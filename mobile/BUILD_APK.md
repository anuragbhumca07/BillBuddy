# BillBuddy APK Build Instructions

## Prerequisites
- Node.js 18+
- Expo account (free at https://expo.dev)
- EAS CLI installed globally

## Steps to Generate APK

### 1. Install dependencies
```bash
cd mobile
npm install
```

### 2. Install EAS CLI
```bash
npm install -g eas-cli
```

### 3. Login to Expo
```bash
eas login
# Enter your Expo credentials (anuragbhumca07@gmail.com)
```

### 4. Configure EAS project
```bash
eas init --id <your-project-id>
# Or create a new project at https://expo.dev
```

### 5. Build APK (preview profile = APK output)
```bash
eas build --platform android --profile preview
```

### 6. Download APK
After build completes (~10-15 minutes), EAS will provide a download URL.
Download and save to: `/output/BillBuddy.apk`

## What the preview profile produces
- Build type: `apk` (not aab) — directly installable on Android
- Package name: `com.BillBuddy.app`
- Version: 1.0.0
- Distribution: internal

## Local build (alternative, requires Android SDK)
```bash
# Install Expo Dev Client
npm install expo-dev-client

# Build locally (requires Android Studio + SDK)
eas build --platform android --profile preview --local
# Output: /output/BillBuddy.apk
```

## Notes
- The EAS cloud build does NOT require Android Studio locally
- Free tier allows 30 builds/month
- Build logs visible at https://expo.dev/accounts/[username]/projects/BillBuddy/builds
