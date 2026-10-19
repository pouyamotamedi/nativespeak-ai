$ErrorActionPreference = "Stop"
$Root = Split-Path -Parent $MyInvocation.MyCommand.Path
Set-Location $Root

$JavaHome = "C:\Program Files\Eclipse Adoptium\jdk-21.0.6.7-hotspot"
if (-not (Test-Path "$JavaHome\bin\java.exe")) {
  $JavaHome = "C:\Program Files\Android\Android Studio\jbr"
}
$env:JAVA_HOME = $JavaHome
$env:Path = "$JavaHome\bin;$env:Path"

$Sdk = "$env:LOCALAPPDATA\Android\Sdk"
$BuildTools = Get-ChildItem "$Sdk\build-tools" | Sort-Object Name -Descending | Select-Object -First 1
$Platform = Get-ChildItem "$Sdk\platforms" | Sort-Object Name -Descending | Select-Object -First 1
if (-not $BuildTools -or -not $Platform) { throw "Android SDK build-tools/platforms not found" }

$Aapt = Join-Path $BuildTools.FullName "aapt.exe"
$Aapt2 = Join-Path $BuildTools.FullName "aapt2.exe"
$D8 = Join-Path $BuildTools.FullName "d8.bat"
$Zipalign = Join-Path $BuildTools.FullName "zipalign.exe"
$Apksigner = Join-Path $BuildTools.FullName "apksigner.bat"
$AndroidJar = Join-Path $Platform.FullName "android.jar"

$ProjectDir = Join-Path $Root "android\app"
$Manifest = Join-Path $ProjectDir "src\main\AndroidManifest.xml"
$ResDir = Join-Path $ProjectDir "src\main\res"
$AssetsDir = Join-Path $ProjectDir "src\main\assets"
$WwwDir = Join-Path $AssetsDir "www"
$JavaSrc = Join-Path $ProjectDir "src\main\java\com\remix\nativespeak\MainActivity.java"

$BuildDir = Join-Path $Root ".android-build"
$OutDir = Join-Path $Root "APK_DOWNLOAD"
$Keystore = Join-Path $BuildDir "debug.keystore"

Write-Host "=== NativeSpeak Android APK Build ===" -ForegroundColor Cyan
Write-Host "Build-tools: $($BuildTools.Name) | Platform: $($Platform.Name)"

# 1) Install + Android IIFE frontend (file:// WebView cannot run ES modules)
if (-not (Test-Path "node_modules")) {
  Write-Host ">> npm install..."
  npm install --legacy-peer-deps
}
Write-Host ">> Building Android web frontend (single bundle)..."
npx vite build --config vite.android.config.ts
if ($LASTEXITCODE -ne 0) { throw "vite android build failed" }

Write-Host ">> Converting ESM -> classic IIFE for WebView..."
node scripts/prepare-android-www.mjs
if ($LASTEXITCODE -ne 0) { throw "prepare-android-www failed" }

# 3) Prepare build dirs
if (Test-Path $BuildDir) { Remove-Item $BuildDir -Recurse -Force }
New-Item -ItemType Directory -Path (Join-Path $BuildDir "gen"), (Join-Path $BuildDir "classes"), (Join-Path $BuildDir "out") -Force | Out-Null
New-Item -ItemType Directory -Path $OutDir -Force | Out-Null

# 4) Debug keystore
if (-not (Test-Path $Keystore)) {
  Write-Host ">> Generating debug keystore..."
  & keytool -genkeypair -v -keystore $Keystore -alias androiddebugkey -storepass android -keypass android -keyalg RSA -keysize 2048 -validity 10000 -dname "CN=Android Debug,O=Android,C=US"
}

# 5) Generate R.java
Write-Host ">> aapt package (R.java)..."
& $Aapt package -f -m -J (Join-Path $BuildDir "gen") -M $Manifest -S $ResDir -I $AndroidJar
if ($LASTEXITCODE -ne 0) { throw "aapt R.java failed" }

# 6) Compile Java
Write-Host ">> javac..."
$Rjava = Get-ChildItem (Join-Path $BuildDir "gen") -Recurse -Filter "R.java" | Select-Object -First 1
& javac -source 8 -target 8 -bootclasspath $AndroidJar -cp $AndroidJar -d (Join-Path $BuildDir "classes") $Rjava.FullName $JavaSrc
if ($LASTEXITCODE -ne 0) { throw "javac failed" }

# 7) Dex
Write-Host ">> d8 dex..."
$classFiles = Get-ChildItem (Join-Path $BuildDir "classes") -Recurse -Filter "*.class" | ForEach-Object { $_.FullName }
& $D8 --lib $AndroidJar --output $BuildDir @classFiles
if ($LASTEXITCODE -ne 0) { throw "d8 failed" }

# 8) Package resources + assets
Write-Host ">> Packaging APK resources..."
$Unaligned = Join-Path $BuildDir "unaligned.apk"
& $Aapt package -f -M $Manifest -S $ResDir -A $AssetsDir -I $AndroidJar -F $Unaligned
if ($LASTEXITCODE -ne 0) { throw "aapt package failed" }

# 9) Add classes.dex
Write-Host ">> Adding classes.dex..."
Push-Location $BuildDir
& $Aapt add unaligned.apk classes.dex
if ($LASTEXITCODE -ne 0) { Pop-Location; throw "aapt add dex failed" }
Pop-Location

# 10) Align + sign
$Aligned = Join-Path $BuildDir "aligned.apk"
$FinalApk = Join-Path $OutDir "NativeSpeak-AI.apk"
Write-Host ">> zipalign..."
& $Zipalign -f -p 4 $Unaligned $Aligned
if ($LASTEXITCODE -ne 0) { throw "zipalign failed" }

Write-Host ">> apksigner..."
& $Apksigner sign --ks $Keystore --ks-key-alias androiddebugkey --ks-pass pass:android --key-pass pass:android --out $FinalApk $Aligned
if ($LASTEXITCODE -ne 0) { throw "apksigner failed" }

& $Apksigner verify -v $FinalApk
Write-Host ""
Write-Host "APK ready: $FinalApk" -ForegroundColor Green
Get-Item $FinalApk | Format-List FullName, Length, LastWriteTime
