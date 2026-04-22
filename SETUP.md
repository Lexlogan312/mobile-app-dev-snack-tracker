# Snack Tracker Setup

Welcome to Snack Tracker! Follow these steps to get the app running locally and on mobile devices.

## 1. Install Dependencies
Run the following command to install all necessary packages:
```bash
npm install
```

## 2. Firebase Setup
1. Create a new project in the [Firebase Console](https://console.firebase.google.com/).
2. Enable **Firestore Database**, **Firebase Authentication** (Email/Password), and **Firebase Storage**.
3. Copy the `.env.example` file to `.env` and fill in your Firebase configuration keys.
4. Deploy the security rules located in `/firebase/firestore.rules` and `/firebase/storage.rules` to your Firebase project.
5. Create 1-2 admin accounts manually in the Firebase Authentication console.

## 3. Running on Web
Start the development server:
```bash
npm run dev
```

## 4. Building for iOS and Android with Capacitor
To build the app for mobile devices, you need to have Android Studio (for Android) and Xcode (for iOS) installed.

1. Build the web project:
```bash
npm run build
```

2. Add the mobile platforms (if not already added):
```bash
npx cap add ios
npx cap add android
```

3. Sync the web code to the native projects:
```bash
npx cap sync
```

4. Open the native IDEs to build and run the app:
```bash
npx cap open ios
npx cap open android
```

### Capacitor Plugins
The app uses the following Capacitor plugins which are already installed:
- `@capacitor/camera`: For taking photos of snacks.
- `@capacitor/share`: For exporting shopping lists and summaries.
- `@capacitor/filesystem`: For saving exported files.

Ensure you have added the necessary permissions in `AndroidManifest.xml` and `Info.plist` for camera and file access as per the Capacitor documentation.
