import {StrictMode} from 'react';
import {createRoot} from 'react-dom/client';
import App from './App.tsx';
import './index.css';

const rootElement = document.getElementById('root');

if (rootElement) {
  try {
    const root = createRoot(rootElement);
    root.render(
      <StrictMode>
        <App />
      </StrictMode>,
    );
  } catch (err: any) {
    console.error('Fatal client startup error:', err);
    rootElement.innerHTML = `
      <div style="min-height:100vh;display:flex;align-items:center;justify-content:center;background:#0c0c0e;color:#fff;padding:20px;font-family:sans-serif;text-align:center;">
        <div style="max-width:400px;background:#18181c;border:1px solid #ea580c;border-radius:24px;padding:24px;">
          <h2 style="color:#ea580c;font-size:18px;margin-bottom:8px;">Erreur de démarrage</h2>
          <p style="color:#a1a1aa;font-size:12px;margin-bottom:16px;">${err?.message || 'Une erreur est survenue lors de l initialisation.'}</p>
          <button onclick="localStorage.clear();sessionStorage.clear();window.location.reload();" style="padding:10px 16px;background:#ea580c;color:#fff;border:none;border-radius:12px;font-weight:bold;cursor:pointer;">Réinitialiser et recharger</button>
        </div>
      </div>
    `;
  }
}

