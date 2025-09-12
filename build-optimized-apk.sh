#!/bin/bash

# 🚀 Optimized APK Build Script for TokTok

echo "🔧 Starting optimized APK build..."

# Clean previous builds
echo "🧹 Cleaning previous builds..."
cd android && ./gradlew clean && cd ..

# Remove node_modules and reinstall (optional, for fresh build)
echo "📦 Cleaning node_modules..."
rm -rf node_modules
npm install

# Clear Metro cache
echo "🗑️ Clearing Metro cache..."
npx react-native start --reset-cache &
METRO_PID=$!

# Wait for Metro to start
sleep 10

# Build optimized APK
echo "🏗️ Building optimized APK..."
npx react-native build-android --mode=release

# Kill Metro
kill $METRO_PID

# Check APK size
echo "📊 APK size information:"
ls -lh android/app/build/outputs/apk/release/app-release.apk

echo "✅ Optimized APK build complete!"
echo "📱 APK location: android/app/build/outputs/apk/release/app-release.apk"
