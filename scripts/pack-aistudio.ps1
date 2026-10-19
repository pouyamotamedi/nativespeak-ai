# Pack ONLY the files Google AI Studio needs — never upload android/APK/zips/node_modules.
$ErrorActionPreference = "Stop"
$Root = Split-Path -Parent (Split-Path -Parent $MyInvocation.MyCommand.Path)
Set-Location $Root

$OutZip = Join-Path $Root "AI_STUDIO_UPLOAD.zip"
if (Test-Path $OutZip) { Remove-Item $OutZip -Force }

$Include = @(
  "server.ts",
  "package.json",
  "package-lock.json",
  "tsconfig.json",
  "vite.config.ts",
  "index.html",
  "metadata.json",
  ".env.example",
  ".gitignore",
  "README.md",
  "firebase-blueprint.json",
  "firestore.rules"
)

$Staging = Join-Path $Root ".aistudio-pack"
if (Test-Path $Staging) { Remove-Item $Staging -Recurse -Force }
New-Item -ItemType Directory -Path $Staging | Out-Null

foreach ($f in $Include) {
  $src = Join-Path $Root $f
  if (Test-Path $src) {
    Copy-Item $src (Join-Path $Staging $f) -Force
  }
}

# src + public only (no android)
Copy-Item (Join-Path $Root "src") (Join-Path $Staging "src") -Recurse -Force
if (Test-Path (Join-Path $Root "public")) {
  Copy-Item (Join-Path $Root "public") (Join-Path $Staging "public") -Recurse -Force
}

# IMPORTANT: Do NOT overwrite AI Studio's firebase-applet-config.json from this zip.
# Keep the Studio-generated Firebase config. We ship a note instead.
@"
# AI Studio upload pack

1. In AI Studio: open your Remix project.
2. Upload / replace ONLY the files inside this zip (or sync via GitHub).
3. DO NOT replace firebase-applet-config.json if Studio already generated one — keep Studio's version.
4. DO NOT upload: android/, APK_DOWNLOAD/, node_modules/, dist/, *.apk, *.zip extras.
5. After upload, prompt the agent: Fix any build issues with the current code
6. Secrets (optional): OPENAI_API_KEY, GAPGPT_* as documented in .env.example
"@ | Set-Content -Encoding UTF8 (Join-Path $Staging "AISTUDIO_README.txt")

Compress-Archive -Path (Join-Path $Staging "*") -DestinationPath $OutZip -Force
Remove-Item $Staging -Recurse -Force

Write-Host "Ready for AI Studio: $OutZip" -ForegroundColor Green
Get-Item $OutZip | Format-List FullName, Length, LastWriteTime
