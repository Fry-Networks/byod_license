/**
 * Mock Transaction Processor for Testing BYOD License Flow
 * This replaces the real TransactionProcessor for safe testing without actual blockchain transactions
 */

import { getUser, setUser } from '../src/app/classes/LicenseProcessor.js';

export interface MockTransactionConfig {
  shouldSucceed: boolean;
  errorCode?: number;
  customTxId?: string;
}

/**
 * Mock version of confirmTransaction that simulates transaction validation
 * without requiring real blockchain transactions
 */
export async function mockConfirmTransaction(
  txId: string,
  asset: "algo" | "fry",
  email: string,
  config: MockTransactionConfig = { shouldSucceed: true }
): Promise<number> {
  console.log(`[MOCK] Confirming ${asset.toUpperCase()} transaction: ${txId} for ${email}`);
  
  // Simulate processing delay
  await new Promise(resolve => setTimeout(resolve, 500));
  
  if (!config.shouldSucceed) {
    console.log(`[MOCK] Transaction failed with error code: ${config.errorCode || 1}`);
    return config.errorCode || 1;
  }
  
  // Simulate successful transaction validation
  try {
    let user = await getUser(email);
    if (!user) {
      console.log(`[MOCK] User not found: ${email}`);
      return 4;
    }
    
    // Mark the payment type as completed
    user[asset] = true;
    
    // Set a mock address if not present
    if (!user.address) {
      user.address = "MOCK_ADDRESS_" + Math.random().toString(36).substring(2, 15).toUpperCase();
    }
    
    await setUser(user);
    console.log(`[MOCK] Successfully confirmed ${asset.toUpperCase()} payment for ${email}`);
    return 0;
  } catch (error) {
    console.error(`[MOCK] Error updating user:`, error);
    return 5;
  }
}

/**
 * Generate a realistic-looking mock transaction ID
 */
export function generateMockTxId(): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ234567';
  let result = '';
  for (let i = 0; i < 52; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
}

/**
 * Mock transaction scenarios for testing different cases
 */
export const MockScenarios = {
  SUCCESS: { shouldSucceed: true },
  WRONG_RECEIVER: { shouldSucceed: false, errorCode: 2 },
  WRONG_AMOUNT: { shouldSucceed: false, errorCode: 3 },
  USER_NOT_FOUND: { shouldSucceed: false, errorCode: 4 },
  DATABASE_ERROR: { shouldSucceed: false, errorCode: 5 }
};
