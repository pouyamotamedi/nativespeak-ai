import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { build as esbuild } from 'esbuild';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const distAndroid = path.join(root, 'dist-android');
const www = path.join(root, 'android', 'app', 'src', 'main', 'assets', 'www');

function rmrf(p) {
  if (fs.existsSync(p)) fs.rmSync(p, { recursive: true, force: true });
}

rmrf(www);
fs.mkdirSync(path.join(www, 'assets'), { recursive: true });

// Copy icon if present
for (const f of ['icon.svg']) {
  const src = path.join(distAndroid, f);
  if (fs.existsSync(src)) fs.copyFileSync(src, path.join(www, f));
}

// Find vite JS + CSS outputs
const assetsDir = path.join(distAndroid, 'assets');
const files = fs.existsSync(assetsDir) ? fs.readdirSync(assetsDir) : [];
const jsFile = files.find((f) => f.endsWith('.js'));
const cssFile = files.find((f) => f.endsWith('.css'));
if (!jsFile) throw new Error('No JS bundle in dist-android/assets');

const jsIn = path.join(assetsDir, jsFile);
const jsOut = path.join(www, 'assets', 'app.js');
const cssOut = path.join(www, 'assets', 'app.css');

// Convert ESM → classic IIFE so Android WebView file:// can execute it
await esbuild({
  entryPoints: [jsIn],
  bundle: true,
  format: 'iife',
  platform: 'browser',
  target: ['es2020'],
  outfile: jsOut,
  logLevel: 'info',
});

if (cssFile) {
  fs.copyFileSync(path.join(assetsDir, cssFile), cssOut);
} else {
  fs.writeFileSync(cssOut, '/* no css */');
}

const html = `<!doctype html>
<html lang="fa" dir="rtl">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no, viewport-fit=cover" />
    <title>NativeSpeak AI</title>
    <meta name="theme-color" content="#4f46e5" />
    <link rel="icon" type="image/svg+xml" href="./icon.svg" />
    <link rel="stylesheet" href="./assets/app.css" />
    <style>
      html, body, #root { height: 100%; margin: 0; background: #020617; }
      #boot { color: #94a3b8; font-family: Vazirmatn, sans-serif; text-align: center; padding: 48px 16px; font-size: 14px; }
    </style>
  </head>
  <body>
    <div id="root"><div id="boot">در حال بارگذاری NativeSpeak…</div></div>
    <script src="./assets/app.js"></script>
  </body>
</html>
`;

fs.writeFileSync(path.join(www, 'index.html'), html);
console.log('Android www prepared:', www);
console.log('JS bytes:', fs.statSync(jsOut).size);
