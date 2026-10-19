import {createRoot} from 'react-dom/client';
import App from './App.tsx';
import './index.css';

createRoot(document.getElementById('root')!).render(<App />);

// Signal Android WebView that React mounted (avoids stuck black screen / enables online fallback cancel)
try {
  const bridge = (window as any).NativeSpeakAndroid;
  if (bridge && typeof bridge.onAppReady === 'function') {
    bridge.onAppReady();
  }
} catch (_) {
  // browser / PWA — ignore
}
