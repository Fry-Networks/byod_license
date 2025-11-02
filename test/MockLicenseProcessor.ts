/**
 * Mock License Processor for Testing
 * This creates a modified version of the license creation flow for testing
 */

import { connect } from '../src/app/db/connect.js';
import { addLicense, sendMail, getUser, createUser } from '../src/app/classes/LicenseProcessor.js';
import { mockConfirmTransaction, generateMockTxId, MockTransactionConfig } from './MockTransactionProcessor.js';
import ByodModel from '../src/app/db/byod-schema.js';

export interface TestConfig {
  email: string;
  address?: string;
  sendRealEmail?: boolean;
  algoTransactionConfig?: MockTransactionConfig;
  fryTransactionConfig?: MockTransactionConfig;
  customPrice?: number;
}

/**
 * Mock version of createLicense that uses mock transaction validation
 */
export async function mockCreateLicense(
  email: string,
  address: string,
  txId: string,
  config: MockTransactionConfig = { shouldSucceed: true }
): Promise<string | null> {
  console.log(`[MOCK] Creating license for ${email} with address ${address}`);
  
  // Generate license key
  let license = (
    Math.random().toString(36).substring(2, 40) +
    Math.random().toString(36).substring(2, 40) +
    Math.random().toString(36).substring(2, 40)
  ).toUpperCase();
  
  // Ensure license is unique
  while (await ByodModel.exists({ ["licenses.license"]: license })) {
    license = (
      Math.random().toString(36).substring(2, 40) +
      Math.random().toString(36).substring(2, 40) +
      Math.random().toString(36).substring(2, 40)
    ).toUpperCase();
  }

  const user = await getUser(email);
  if (!user) {
    console.log(`[MOCK] User not found: ${email}`);
    return null;
  }

  // Use mock transaction confirmation instead of real one
  const confirmation = await mockConfirmTransaction(txId, "fry", email, config);
  if (confirmation !== 0) {
    return `[MOCK] Transaction validation failed with code: ${confirmation}`;
  }

  await connect();
  console.log(`[MOCK] Adding license to database: ${license}`);
  await addLicense(email, address, license);
  
  console.log(`[MOCK] Sending email to ${email}`);
  await sendMail(email, license);

  return license;
}

/**
 * Complete flow simulation - simulates the entire user journey
 */
export async function simulateCompleteFlow(config: TestConfig): Promise<{
  success: boolean;
  license?: string;
  error?: string;
  steps: string[];
}> {
  const steps: string[] = [];
  const { email, address = `TEST_ADDRESS_${Date.now()}` } = config;
  
  try {
    await connect();
    steps.push('✓ Connected to database');

    // Step 1: Create or get user
    let user = await getUser(email);
    if (!user) {
      user = await createUser(email);
      steps.push('✓ Created new user');
    } else {
      steps.push('✓ Found existing user');
    }

    // Step 2: Simulate ALGO payment
    const algoTxId = generateMockTxId();
    steps.push(`✓ Generated ALGO transaction ID: ${algoTxId}`);
    
    const algoResult = await mockConfirmTransaction(
      algoTxId, 
      "algo", 
      email, 
      config.algoTransactionConfig || { shouldSucceed: true }
    );
    
    if (algoResult !== 0) {
      return {
        success: false,
        error: `ALGO transaction failed with code: ${algoResult}`,
        steps: [...steps, `✗ ALGO transaction validation failed`]
      };
    }
    steps.push('✓ ALGO payment confirmed');

    // Step 3: Simulate FRY payment and license creation
    const fryTxId = generateMockTxId();
    steps.push(`✓ Generated FRY transaction ID: ${fryTxId}`);
    
    const license = await mockCreateLicense(
      email,
      address,
      fryTxId,
      config.fryTransactionConfig || { shouldSucceed: true }
    );

    if (!license || license.includes('failed')) {
      return {
        success: false,
        error: license || 'License creation failed',
        steps: [...steps, `✗ License creation failed`]
      };
    }

    steps.push('✓ FRY payment confirmed');
    steps.push('✓ License generated and stored in database');
    steps.push('✓ Email sent with license key');

    return {
      success: true,
      license,
      steps
    };

  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      steps: [...steps, `✗ Error: ${error}`]
    };
  }
}

/**
 * Simple license-only test - just generates and emails a license
 */
export async function testLicenseOnly(config: TestConfig): Promise<{
  success: boolean;
  license?: string;
  error?: string;
}> {
  const { email, address = `TEST_ADDRESS_${Date.now()}` } = config;
  
  try {
    await connect();
    
    // Create user if doesn't exist
    let user = await getUser(email);
    if (!user) {
      user = await createUser(email);
    }
    
    // Mark user as having completed both payments
    user.algo = true;
    user.fry = true;
    user.address = address;
    
    // Generate license directly
    const license = (
      Math.random().toString(36).substring(2, 40) +
      Math.random().toString(36).substring(2, 40) +
      Math.random().toString(36).substring(2, 40)
    ).toUpperCase();
    
    await addLicense(email, address, license);
    
    if (config.sendRealEmail !== false) {
      await sendMail(email, license);
    }
    
    return {
      success: true,
      license
    };
    
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    };
  }
}

/**
 * Clean up test data from database
 */
export async function cleanupTestData(email: string): Promise<void> {
  await connect();
  await ByodModel.deleteOne({ email });
  console.log(`[CLEANUP] Removed test data for ${email}`);
}
