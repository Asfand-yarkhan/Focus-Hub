# Focus Hub

A React Native application for managing study sessions and productivity.

## Setup Instructions

1. Clone the repository
2. Install dependencies:
   ```bash
   npm install
   ```

3. Firebase Setup:
   - Create a new Firebase project at https://console.firebase.google.com
   - Add an Android app to your Firebase project
   - Download the `google-services.json` file
   - Place the `google-services.json` file in the `android/app/` directory
   - Never commit the actual `google-services.json` file to version control

4. Run the application:
   ```bash
   # For Android
   npm run android
   
   # For iOS
   npm run ios
   ```

## Troubleshooting Firebase Issues

If you're experiencing Firebase connection errors:

1. **Missing google-services.json**: Make sure you have downloaded the `google-services.json` file from your Firebase console and placed it in `android/app/` directory.

2. **Firebase Project Configuration**: 
   - Ensure your Firebase project has Authentication enabled
   - Enable Firestore Database in your Firebase console
   - Set up Firestore security rules properly

3. **Android Build Issues**:
   - Clean and rebuild your project:
     ```bash
     cd android && ./gradlew clean
     cd .. && npm run android
     ```

4. **Firebase Rules**: Make sure your Firestore rules allow read/write access for authenticated users.

5. **Network Issues**: Check your internet connection and ensure the device can reach Firebase servers.

## Important Security Notes

The following files contain sensitive information and should never be committed to version control:
- `android/app/google-services.json` - Contains Firebase configuration
- Any keystore files (`.keystore`, `.jks`) - Contains signing keys
- `.env` files - Contains environment variables

These files are listed in `.gitignore` and should be kept secure and shared through secure channels.

## Project Structure

- `/Screens` - Contains all the screen components
- `/Assets` - Contains images and other static assets
- `/android` - Android specific files
- `/ios` - iOS specific files

## Dependencies

- React Native
- Firebase (Authentication, Firestore)
- React Navigation
- React Native Vector Icons

# Getting Started

> **Note**: Make sure you have completed the [Set Up Your Environment](https://reactnative.dev/docs/set-up-your-environment) guide before proceeding.

## Step 1: Start Metro

First, you will need to run **Metro**, the JavaScript build tool for React Native.

To start the Metro dev server, run the following command from the root of your React Native project:

```sh
# Using npm
npm start

# OR using Yarn
yarn start
```

## Step 2: Build and run your app

With Metro running, open a new terminal window/pane from the root of your React Native project, and use one of the following commands to build and run your Android or iOS app:

### Android

```sh
# Using npm
npm run android

# OR using Yarn
yarn android
```

### iOS

For iOS, remember to install CocoaPods dependencies (this only needs to be run on first clone or after updating native deps).

The first time you create a new project, run the Ruby bundler to install CocoaPods itself:

```sh
bundle install
```

Then, and every time you update your native dependencies, run:

```sh
bundle exec pod install
```

For more information, please visit [CocoaPods Getting Started guide](https://guides.cocoapods.org/using/getting-started.html).

```sh
# Using npm
npm run ios

# OR using Yarn
yarn ios
```

If everything is set up correctly, you should see your new app running in the Android Emulator, iOS Simulator, or your connected device.

This is one way to run your app — you can also build it directly from Android Studio or Xcode.

## Step 3: Modify your app

Now that you have successfully run the app, let's make changes!

Open `App.tsx` in your text editor of choice and make some changes. When you save, your app will automatically update and reflect these changes — this is powered by [Fast Refresh](https://reactnative.dev/docs/fast-refresh).

When you want to forcefully reload, for example to reset the state of your app, you can perform a full reload:

- **Android**: Press the <kbd>R</kbd> key twice or select **"Reload"** from the **Dev Menu**, accessed via <kbd>Ctrl</kbd> + <kbd>M</kbd> (Windows/Linux) or <kbd>Cmd ⌘</kbd> + <kbd>M</kbd> (macOS).
- **iOS**: Press <kbd>R</kbd> in iOS Simulator.

## Congratulations! :tada:

You've successfully run and modified your React Native App. :partying_face:

### Now what?

- If you want to add this new React Native code to an existing application, check out the [Integration guide](https://reactnative.dev/docs/integration-with-existing-apps).
- If you're curious to learn more about React Native, check out the [docs](https://reactnative.dev/docs/getting-started).

# Troubleshooting

If you're having issues getting the above steps to work, see the [Troubleshooting](https://reactnative.dev/docs/troubleshooting) page.

# Learn More

To learn more about React Native, take a look at the following resources:

- [React Native Website](https://reactnative.dev) - learn more about React Native.
- [Getting Started](https://reactnative.dev/docs/environment-setup) - an **overview** of React Native and how setup your environment.
- [Learn the Basics](https://reactnative.dev/docs/getting-started) - a **guided tour** of the React Native **basics**.
- [Blog](https://reactnative.dev/blog) - read the latest official React Native **Blog** posts.
- [`@facebook/react-native`](https://github.com/facebook/react-native) - the Open Source; GitHub **repository** for React Native.

# Features

### Friend Request Notifications
- Users can send friend requests to other users
- Real-time notifications are sent when friend requests are received
- Notification badge shows unread notification count
- Users can accept or reject friend requests from their profile
- Notifications are automatically marked as read when viewed

### How Friend Requests Work
1. **Sending Requests**: Users can send friend requests through the "Invite Friends" modal
2. **Notifications**: Recipients receive real-time notifications about new friend requests
3. **Managing Requests**: Users can view pending requests and accept/reject them from the sender's profile
4. **Status Tracking**: The app tracks friend request status (none, pending, received, accepted)

### Notification Types
- **Friend Requests**: Orange icon, navigates to sender's profile
- **Likes**: Pink icon, navigates to the liked post
- **Comments**: Blue icon, navigates to the commented post
- **Messages**: Purple icon, navigates to the chat

## Technical Implementation

### Database Collections
- `users`: User profiles and information
- `friend_requests`: Friend request data with status tracking
- `notifications`: Real-time notifications for various activities
- `posts`: User posts and content
- `chats`: Chat rooms and messages

### Key Components
- `NotificationScreen.js`: Displays and manages notifications
- `Profile.js`: Handles friend request actions (accept/reject)
- `InviteFriendsModal.js`: Sends friend requests and creates notifications
- `Homescreen.js`: Shows notification badge with unread count

### Firestore Rules
- Users can read their own notifications
- Users can create notifications for others
- Users can update their own notifications (mark as read)
- Friend requests have appropriate read/write permissions
