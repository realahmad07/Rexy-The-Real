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

// Test Firestore connection
async function testConnection() {
  try {
    await getDocFromServer(doc(db, 'test', 'connection'));
    console.log("Firestore connection successful");
  } catch (error) {
    if (error instanceof Error && error.message.includes('the client is offline')) {
      console.error("Please check your Firebase configuration. The client is offline.");
    }
  }
}
testConnection();

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
