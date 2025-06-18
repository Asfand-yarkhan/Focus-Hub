# Firebase Setup Guide - Fix Connection Issues

## Current Issue
You're getting Firebase connection errors. Here's how to fix it:

## Step 1: Verify Firebase Project Configuration

1. **Go to Firebase Console**: https://console.firebase.google.com
2. **Select your project**: `focus-hub-b58fe`
3. **Check these services are enabled**:

### Authentication
- Go to Authentication → Sign-in method
- Enable Email/Password authentication
- Make sure it's turned ON

### Firestore Database
- Go to Firestore Database
- If not created, click "Create Database"
- Choose "Start in test mode" for now
- Select a location (choose closest to your region)

### Storage (if using images)
- Go to Storage
- If not created, click "Get Started"
- Choose "Start in test mode" for now

## Step 2: Deploy Firestore Rules

1. **Install Firebase CLI** (if not installed):
   ```bash
   npm install -g firebase-tools
   ```

2. **Login to Firebase**:
   ```bash
   firebase login
   ```

3. **Initialize Firebase in your project**:
   ```bash
   firebase init firestore
   ```

4. **Deploy the rules**:
   ```bash
   firebase deploy --only firestore:rules
   ```

## Step 3: Test Firebase Connection

1. **Run the app** and check console logs
2. **Click "Debug Info" button** in notification screen
3. **Check the logs** for specific error messages

## Step 4: Common Issues & Solutions

### Issue: "Permission denied"
- **Solution**: Deploy Firestore rules properly

### Issue: "Project not found"
- **Solution**: Check if google-services.json matches your Firebase project

### Issue: "Authentication failed"
- **Solution**: Enable Email/Password auth in Firebase console

### Issue: "Network error"
- **Solution**: Check internet connection and firewall settings

## Step 5: Verify Setup

1. **Check Firebase Console**:
   - Authentication → Users (should show registered users)
   - Firestore → Data (should show collections)

2. **Test in App**:
   - Try to register/login
   - Check if notifications load
   - Look at console logs for errors

## Debug Information

Your current configuration:
- **Project ID**: focus-hub-b58fe
- **Package Name**: com.focushub
- **Firebase Config**: ✅ Present (google-services.json)

## Next Steps

1. Follow the steps above
2. Deploy Firestore rules
3. Test the app again
4. Check console logs for specific errors
5. If still having issues, share the specific error message from console logs 