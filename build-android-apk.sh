#!/usr/bin/env bash
set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
echo "=== Remix NativeSpeak AI Android APK Build Process ==="
echo "Working directory: $SCRIPT_DIR"

PROJECT_DIR="$SCRIPT_DIR/android/app"
BUILD_DIR="/tmp/android-build"
PLATFORM_JAR="/usr/lib/android-sdk/platforms/android-23/android.jar"
DX_TOOL="/usr/lib/android-sdk/build-tools/debian/dx"
KEYSTORE="/tmp/android-debug.keystore"

rm -rf "$BUILD_DIR"
mkdir -p "$BUILD_DIR/gen" "$BUILD_DIR/bin" "$BUILD_DIR/out"
mkdir -p "$SCRIPT_DIR/.build-outputs" "$SCRIPT_DIR/APK_DOWNLOAD"

# 1. Generate or verify debug keystore
if [ ! -f "$KEYSTORE" ]; then
    echo ">> Generating debug signing keystore..."
    keytool -genkey -v -keystore "$KEYSTORE" \
        -alias androiddebugkey \
        -storepass android \
        -keypass android \
        -keyalg RSA \
        -keysize 2048 \
        -validity 10000 \
        -dname "CN=Android Debug,O=Android,C=US"
fi

# 2. Generate R.java with AAPT
echo ">> Processing Android resources and generating R.java..."
aapt package -f -m \
    -J "$BUILD_DIR/gen" \
    -M "$PROJECT_DIR/src/main/AndroidManifest.xml" \
    -S "$PROJECT_DIR/src/main/res" \
    -I "$PLATFORM_JAR"

# 3. Compile Java source code
echo ">> Compiling Java source files..."
javac -source 8 -target 8 \
    -cp "$PLATFORM_JAR" \
    -d "$BUILD_DIR/bin" \
    "$BUILD_DIR/gen/com/remix/nativespeak/R.java" \
    "$PROJECT_DIR/src/main/java/com/remix/nativespeak/MainActivity.java"

# 4. Dex bytecode with DX
echo ">> Converting Java bytecode to Dalvik executable (classes.dex)..."
$DX_TOOL --dex --output="$BUILD_DIR/classes.dex" "$BUILD_DIR/bin"

# 5. Package unaligned APK with resources and assets
echo ">> Packaging APK with Android resources and web assets..."
aapt package -f \
    -M "$PROJECT_DIR/src/main/AndroidManifest.xml" \
    -S "$PROJECT_DIR/src/main/res" \
    -A "$PROJECT_DIR/src/main/assets" \
    -I "$PLATFORM_JAR" \
    -F "$BUILD_DIR/unaligned.apk"

# 6. Add classes.dex to APK
echo ">> Adding classes.dex to package..."
(cd "$BUILD_DIR" && aapt add unaligned.apk classes.dex)

# 7. 4-byte ZipAlign
echo ">> Aligning APK (4-byte alignment)..."
zipalign -v -p 4 "$BUILD_DIR/unaligned.apk" "$BUILD_DIR/aligned.apk"

# 8. Sign APK with apksigner (v1, v2, v3 schemes)
echo ">> Signing APK with apksigner..."
apksigner sign \
    --ks "$KEYSTORE" \
    --ks-key-alias androiddebugkey \
    --ks-pass pass:android \
    --key-pass pass:android \
    --out "$BUILD_DIR/out/app-debug.apk" \
    "$BUILD_DIR/aligned.apk"

# 9. Verify APK signature
echo ">> Verifying APK signature..."
apksigner verify -v "$BUILD_DIR/out/app-debug.apk"

# 10. Copy APK to destination paths
echo ">> Deploying APK to destination directories..."
cp -f "$BUILD_DIR/out/app-debug.apk" "$SCRIPT_DIR/.build-outputs/app-debug.apk"
cp -f "$BUILD_DIR/out/app-debug.apk" "$SCRIPT_DIR/APK_DOWNLOAD/app-debug.apk"

# 11. Verification and inspection
echo "=========================================="
echo ">> Verification of generated APK files:"
ls -lh "$SCRIPT_DIR/.build-outputs/app-debug.apk" "$SCRIPT_DIR/APK_DOWNLOAD/app-debug.apk"

APK_SIZE=$(stat -c%s "$SCRIPT_DIR/APK_DOWNLOAD/app-debug.apk")
echo "APK Size in bytes: $APK_SIZE"

if [ "$APK_SIZE" -lt 1048576 ]; then
    echo "ERROR: APK size ($APK_SIZE bytes) is less than 1 MB requirement!"
    exit 1
else
    echo "SUCCESS: APK size is $(du -h "$SCRIPT_DIR/APK_DOWNLOAD/app-debug.apk" | cut -f1) (greater than 1 MB requirement)!"
fi

echo ">> Checking APK badging details..."
aapt dump badging "$SCRIPT_DIR/APK_DOWNLOAD/app-debug.apk" | grep -E "package|application-label|launchable-activity"

echo "=== Android Debug APK Build Completed Successfully ==="
