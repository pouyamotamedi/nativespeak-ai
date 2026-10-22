import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { spawn } from 'node:child_process';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const compiled = path.resolve(__dirname, 'server.js');

if (fs.existsSync(compiled)) {
  // Production mode: run the pre-bundled server.js directly
  await import(`file://${compiled}`);
} else {
  // Development mode: spawn server.app.ts with tsx loader
  const target = path.resolve(__dirname, 'server.app.ts');
  const child = spawn(process.execPath, ['--import', 'tsx', target], {
    stdio: 'inherit',
    env: process.env,
  });

  const forwardSignal = (signal: NodeJS.Signals) => {
    try {
      child.kill(signal);
    } catch {}
  };

  process.on('SIGTERM', () => forwardSignal('SIGTERM'));
  process.on('SIGINT', () => forwardSignal('SIGINT'));

  child.on('exit', (code) => {
    process.exit(code ?? 0);
  });
}
