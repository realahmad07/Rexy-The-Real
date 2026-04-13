import React from 'react';
import ReactDOM from 'react-dom/client';
import { Buffer } from 'buffer';
import App from './App';
import { WalletContextProvider } from './components/WalletContextProvider';
import './index.css';

// Polyfill Buffer for Solana SDK
if (typeof window !== 'undefined') {
  window.Buffer = Buffer;
}

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <WalletContextProvider>
      <App />
    </WalletContextProvider>
  </React.StrictMode>
);
