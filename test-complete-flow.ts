/**
 * Complete BYOD License Flow Simulation
 * This script simulates the entire user journey from account creation to license delivery
 */

import { simulateCompleteFlow, cleanupTestData } from './test/MockLicenseProcessor';
import { MockScenarios } from './test/MockTransactionProcessor';

const runCompleteFlowTest = async () => {
  console.log('🚀 Starting Complete BYOD License Flow Simulation\n');
  
  // Test configuration
  const testEmail = "test@example.com";
  const testAddress = "TEST_ADDRESS_" + Date.now();
  
  try {
    // Run the complete flow simulation
    const result = await simulateCompleteFlow({
      email: testEmail,
      address: testAddress,
      sendRealEmail: true, // Set to false to skip actual email sending
      algoTransactionConfig: MockScenarios.SUCCESS,
      fryTransactionConfig: MockScenarios.SUCCESS
    });
    
    console.log('📋 Test Steps:');
    result.steps.forEach(step => console.log(`   ${step}`));
    console.log('');
    
    if (result.success) {
      console.log('✅ Complete flow test PASSED!');
      console.log(`📧 License generated: ${result.license}`);
      console.log(`📬 Email sent to: ${testEmail}`);
      console.log(`🏠 Address: ${testAddress}`);
    } else {
      console.log('❌ Complete flow test FAILED!');
      console.log(`💥 Error: ${result.error}`);
    }
    
  } catch (error) {
    console.error('💥 Test execution failed:', error);
  }
  
  // Ask if user wants to clean up test data
  console.log('\n🧹 Cleanup Options:');
  console.log('To clean up test data, run: npm run test:cleanup');
  console.log(`Test email used: ${testEmail}`);
};

// Run the test
runCompleteFlowTest()
  .then(() => {
    console.log('\n🏁 Test completed');
    process.exit(0);
  })
  .catch(error => {
    console.error('💥 Fatal error:', error);
    process.exit(1);
  });
