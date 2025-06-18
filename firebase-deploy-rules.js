// Firebase Deploy Rules Script
// Run this with: node firebase-deploy-rules.js

const { exec } = require('child_process');

console.log('🚀 Deploying Firestore rules...');

exec('firebase deploy --only firestore:rules', (error, stdout, stderr) => {
  if (error) {
    console.error('❌ Error deploying rules:', error);
    return;
  }
  if (stderr) {
    console.error('❌ Stderr:', stderr);
    return;
  }
  console.log('✅ Firestore rules deployed successfully!');
  console.log(stdout);
});

// Alternative manual deployment instructions:
console.log('\n📋 Manual Deployment Instructions:');
console.log('1. Open terminal in your project directory');
console.log('2. Run: firebase deploy --only firestore:rules');
console.log('3. Or use Firebase Console:');
console.log('   - Go to https://console.firebase.google.com');
console.log('   - Select your project');
console.log('   - Go to Firestore Database > Rules');
console.log('   - Copy the rules from firestore.rules');
console.log('   - Paste and publish'); 