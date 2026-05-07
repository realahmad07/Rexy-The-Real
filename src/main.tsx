import './polyfills';
import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import { WalletContextProvider } from './components/WalletContextProvider';
import ErrorBoundary from './components/ErrorBoundary';
import { AppStateProvider } from './contexts/AppStateContext';
import { db } from './firebase';
import { doc, getDocFromServer } from 'firebase/firestore';
import './index.css';

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <ErrorBoundary>
      <WalletContextProvider>
        <AppStateProvider>
          <App />
        </AppStateProvider>
      </WalletContextProvider>
    </ErrorBoundary>
  </React.StrictMode>
);
