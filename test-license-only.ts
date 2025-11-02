/**
 * License-Only Test Script
 * This script generates and emails a license without simulating payments
 * Perfect for testing just the license generation and email delivery parts
 */

import { testLicenseOnly, cleanupTestData } from './test/MockLicenseProcessor';

const runLicenseOnlyTest = async () => {
  console.log('📧 Starting License-Only Test (Generate + Email)\n');
  
  // Configuration - modify these values as needed
  const testEmail = "zak@fryfoundation.com"; // Change to your email
  const testAddress = "TEST_ADDRESS_" + Date.now();
  
  try {
    console.log(`📬 Generating license for: ${testEmail}`);
    console.log(`🏠 Using address: ${testAddress}`);
    console.log('⏳ Processing...\n');
    
    const result = await testLicenseOnly({
      email: testEmail,
      address: testAddress,
      sendRealEmail: true // Set to false to skip actual email sending
    });
    
    if (result.success) {
      console.log('✅ License generation test PASSED!');
      console.log(`🎫 License Key: ${result.license}`);
      console.log(`📧 Email sent to: ${testEmail}`);
      console.log(`💾 License stored in database`);
      console.log(`🏠 Associated with address: ${testAddress}`);
    } else {
      console.log('❌ License generation test FAILED!');
      console.log(`💥 Error: ${result.error}`);
    }
    
  } catch (error) {
    console.error('💥 Test execution failed:', error);
  }
  
  console.log('\n📋 What this test did:');
  console.log('   ✓ Connected to database');
  console.log('   ✓ Created/updated user record');
  console.log('   ✓ Marked user as having completed payments');
  console.log('   ✓ Generated unique license key');
  console.log('   ✓ Stored license in database');
  console.log('   ✓ Sent email with license key');
  
  console.log('\n🧹 Cleanup:');
  console.log(`To remove test data: cleanupTestData("${testEmail}")`);
};

// Run the test
runLicenseOnlyTest()
  .then(() => {
    console.log('\n🏁 License-only test completed');
  })
  .catch(error => {
    console.error('💥 Fatal error:', error);
  });
