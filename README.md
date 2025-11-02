# BYOD License System

A Next.js application for selling FRY 2.0 cryptocurrency-based licenses with Algorand blockchain integration.

## Overview

The BYOD (Bring Your Own Device) License System is a decentralized payment platform that allows users to purchase software licenses using FRY 2.0 tokens on the Algorand blockchain. The system handles wallet connections, transaction verification, license generation, and email delivery.

## Architecture

### Frontend Components

- **Next.js 14** with TypeScript and Tailwind CSS
- **Wallet Integration**: Support for multiple Algorand wallets (Pera, Defly, Daffi, MyAlgo, WalletConnect)
- **Payment Modal**: Split payment interface for ALGO + FRY transactions
- **Email Input**: Validation and user management
- **Transaction Status**: Real-time feedback with color-coded messages

### Backend Services

- **Server Actions**: Next.js server components for secure operations
- **MongoDB Integration**: User data, payments, and license storage
- **Email Service**: Automated license delivery via Nodemailer
- **Blockchain Verification**: Algorand transaction confirmation
- **Price Oracle**: Dynamic cryptocurrency price fetching

### Database Schema

- **Users Collection**: Email, wallet addresses, payment history
- **BYOD Collection**: License keys, usage status, transaction IDs
- **Prices Collection**: Project pricing configuration

## How It Works (A-Z)

### Payment Flow

1. **User Connection**: User connects Algorand wallet via @txnlab/use-wallet
2. **Email Validation**: User enters and validates email address
3. **Price Calculation**: System fetches current FRY price and calculates token amount needed for $105 USD
4. **Transaction Creation**: Creates asset transfer transaction for FRY 2.0 tokens
5. **Transaction Signing**: User signs transaction with connected wallet
6. **Blockchain Verification**: System confirms transaction on Algorand network
7. **License Generation**: Creates unique license key and stores in database
8. **Email Delivery**: Sends license key to user via email template

### Price Calculation System

```javascript
// Dynamic pricing calculation with multiple sources
const vestigePrice = await fetchFromVestigeLabs(assetId);
const tinymanPrice = await fetchFromTinyMan(assetId);

// Priority: TinyMan direct > Dynamic factor > Fallback factor
const finalPrice =
  tinymanPrice ||
  vestigePrice * (calculateDynamicFactor(vestigePrice, tinymanPrice) || 0.175);

USD_AMOUNT = $105; // configurable in database
TOKENS_NEEDED = USD_AMOUNT / finalPrice;
(MICROALGOS = TOKENS_NEEDED * 1), 000, 000;
```

### Transaction Verification

- **Amount Validation**: Confirms payment within 5% tolerance range
- **Receiver Verification**: Validates payment sent to correct address
- **Asset Verification**: Ensures correct FRY 2.0 asset ID (2485314946)
- **Double-Spend Protection**: Prevents duplicate license creation

### License Generation

- **Unique Keys**: 108-character alphanumeric licenses
- **Collision Prevention**: Database uniqueness checks
- **Usage Tracking**: Monitors license activation status
- **Payment History**: Links licenses to transaction records

## Installation & Setup

### Prerequisites

- Node.js 18+
- MongoDB database
- Algorand wallet for testing
- Email service credentials

### Environment Variables

```bash
# Database
MONGODB_URI=mongodb://localhost:27017/byod

# Email Service
EMAIL_USER=your-email@domain.com
EMAIL_PASS=your-app-password

# Algorand Network
NODE_ENV=development # or production
```

### Installation

```bash
# Clone repository
git clone <repository-url>
cd byod_license

# Install dependencies
npm install

# Set up environment
cp .env.example .env
# Edit .env with your configuration

# Start development server
npm run dev
```

### Production Deployment

```bash
# Build application
npm run build

# Start production server
npm start

# Or use PM2
npm run sync
```

## Configuration

### Price Configuration

Update the MongoDB `prices` collection:

```javascript
{
  project_name: "BYOD",
  price: 105, // USD amount
  asset_id: "2485314946" // FRY 2.0 asset ID
}
```

### Email Templates

Customize the HTML template in `/config/HTMLtemplate.html`:

- Replace `LICENSE_REPLACE_TEXT` placeholder
- Update branding and styling as needed

### Wallet Configuration

Supported wallets are configured in `/src/app/payment.tsx`:

- Pera Wallet
- Defly Wallet
- Daffi Wallet
- MyAlgo Connect
- WalletConnect

## API Reference

### Price Endpoint

```
GET /api/price?projectName=BYOD
```

Returns current pricing configuration for the project.

### Core Functions

#### `getFRYPrice()`

Fetches current FRY 2.0 price with dynamic conversion factor.

- **Returns**: Price in USD per FRY token
- **Caching**: 1-minute cache to reduce API calls
- **Conversion**: Uses 0.175 factor to align with vestige.fi pricing

#### `createLicense(email, address, txId)`

Generates new license after transaction verification.

- **Parameters**: User email, wallet address, transaction ID
- **Returns**: License key or error message
- **Validation**: Confirms transaction authenticity

#### `confirmTransaction(txId, asset, email)`

Verifies blockchain transaction details.

- **Parameters**: Transaction ID, asset type, user email
- **Returns**: Validation status code (0 = success)
- **Checks**: Amount, receiver, asset ID validation

## Integration Guide

### User Dashboard Integration

To integrate this BYOD system into your existing user dashboard:

#### 1. Component Extraction

Key components to extract:

```javascript
// Core payment components
import { PaymentModal } from "./src/app/components/PaymentModal";
import { FryPaymentButton } from "./src/app/components/FryPaymentButton";
import { EmailInput } from "./src/app/components/EmailInput";

// Wallet providers
import { WalletProvider, useWallet } from "@txnlab/use-wallet";
```

#### 2. License Processing

```javascript
// Server-side license functions
import {
  createLicense,
  createUser,
  getUserData,
  fetchCryptoPrice,
} from "./src/app/classes/LicenseProcessor";
```

#### 3. Database Schema

Replicate these MongoDB schemas in your system:

- User schema: `/src/app/db/users-schema.ts`
- BYOD schema: `/src/app/db/byod-schema.ts`
- Price schema: `/src/app/db/price-schema.ts`

#### 4. Environment Setup

Required environment variables:

```bash
MONGODB_URI=your-mongodb-connection
EMAIL_USER=your-smtp-user
EMAIL_PASS=your-smtp-password
```

#### 5. API Integration

```javascript
// Fetch pricing
const response = await fetch("/api/price?projectName=BYOD");
const { data } = await response.json();

// Create payment transaction
const transaction = await createFryTransaction(
  userAddress,
  userEmail,
  data.price
);
```

#### 6. Wallet Connection

```jsx
function YourDashboard() {
  const { activeAddress, signTransactions } = useWallet();

  return (
    <WalletProvider value={walletProviders}>
      {/* Your existing dashboard */}
      <PaymentModal
        activeAddress={activeAddress}
        onPaymentComplete={handleLicenseCreated}
      />
    </WalletProvider>
  );
}
```

## Recent Pricing Fix

### Issue

The system was charging ~$80 instead of $105 due to an incorrect hardcoded conversion factor.

### Root Cause

```javascript
// Old incorrect factor
const VESTIGE_PRICE_CONVERSION = 0.236;

// This caused:
// API Price: $0.056748 * 0.236 = $0.0134
// But actual vestige.fi price: $0.0099
// Result: Users paid fewer tokens than needed
```

### Solution

```javascript
// Implemented truly dynamic pricing system
async function getFRYPrice() {
  const vestigePrice = await fetchFromVestigeLabs(assetId);
  const tinymanPrice = await fetchFromTinyMan(assetId);

  // Priority: TinyMan direct price > Dynamic factor > Fallback factor
  if (tinymanPrice) {
    return tinymanPrice; // Most reliable
  } else if (vestigePrice) {
    const dynamicFactor =
      calculateDynamicFactor(vestigePrice, tinymanPrice) || 0.175;
    return vestigePrice * dynamicFactor;
  }

  return cachedPrice || 0.0099; // Ultimate fallback
}
```

### Validation

- **Before**: ~$80 effective payment (24% underpayment)
- **After**: $105 exact payment (correct pricing)
- **Monitoring**: Added logging to detect future price drift

## Testing

### Development Testing

```bash
# Test license creation only
npm run test:license

# Test complete payment flow
npm run test:complete

# Test error scenarios
npm run test:errors

# Run all tests
npm run test:all
```

### Manual Testing Checklist

- [ ] Wallet connection across all supported wallets
- [ ] Email validation and user creation
- [ ] Price calculation accuracy
- [ ] Transaction signing and submission
- [ ] Blockchain verification
- [ ] License generation and uniqueness
- [ ] Email delivery with correct template
- [ ] Error handling for failed transactions

## Monitoring & Maintenance

### Price Monitoring

Monitor the conversion factor effectiveness:

```bash
# Check logs for price calculations
tail -f logs/pricing.log | grep "FRY price calculation"
```

### Database Maintenance

```javascript
// Check for duplicate licenses
db.byod.aggregate([
  { $unwind: "$licenses" },
  { $group: { _id: "$licenses.license", count: { $sum: 1 } } },
  { $match: { count: { $gt: 1 } } },
]);

// Monitor payment amounts
db.byod.aggregate([
  { $unwind: "$payments" },
  {
    $group: {
      _id: null,
      avgPayment: { $avg: "$payments.price" },
      totalRevenue: { $sum: "$payments.price" },
    },
  },
]);
```

### Performance Optimization

- **Price Caching**: 1-minute cache prevents excessive API calls
- **Database Indexing**: Email and address fields indexed
- **Connection Pooling**: MongoDB connections reused
- **Error Recovery**: Automatic retry logic for failed transactions

## Security Considerations

### Transaction Security

- **Amount Validation**: 5% tolerance prevents minor price fluctuations from failing payments
- **Address Validation**: Hardcoded receiver addresses prevent payment redirection
- **Asset Verification**: Confirms correct FRY 2.0 token transfers
- **Replay Protection**: Transaction IDs tracked to prevent reuse

### Data Protection

- **Email Encryption**: Sensitive data encrypted in transit
- **License Uniqueness**: Cryptographically secure license generation
- **Database Security**: MongoDB connection with authentication
- **Environment Variables**: Sensitive credentials in environment files

## Troubleshooting

### Common Issues

#### Payment Failures

```javascript
// Check transaction status
const confirmedTxn = await algodClient.pendingTransactionInformation(txId).do();
console.log("Transaction details:", confirmedTxn);
```

#### Price Discrepancies

```javascript
// Validate price calculation
const rawPrice = 0.056748; // From API
const converted = rawPrice * 0.175;
console.log(`Expected: $0.0099, Actual: $${converted}`);
```

#### Email Delivery Issues

- Verify SMTP credentials in environment variables
- Check email template path: `/config/HTMLtemplate.html`
- Monitor email service rate limits

#### Database Connection

```javascript
// Test MongoDB connection
import { connect } from "./src/app/db/connect";
await connect();
console.log("Database connected successfully");
```

## Support & Maintenance

### Regular Maintenance Tasks

1. **Price Monitoring**: Weekly verification of FRY price alignment
2. **Database Cleanup**: Monthly removal of expired user sessions
3. **License Auditing**: Quarterly verification of license uniqueness
4. **Security Updates**: Keep dependencies updated monthly

### Deployment Pipeline

```bash
# Development workflow
git pull origin main
npm run build
npm run test:all
npm run sync  # Updates production with PM2 restart
```

## License & Credits

This system is built for FRY Networks' BYOD program using:

- **Next.js** - React framework
- **Algorand** - Blockchain infrastructure
- **MongoDB** - Database storage
- **@txnlab/use-wallet** - Wallet integration
- **Vestige Labs** - Price oracle services

For support, contact: contact@fryfoundation.com
