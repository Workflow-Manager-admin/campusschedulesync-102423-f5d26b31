import React from 'react';
import ReactDOM from 'react-dom/client';
import './index.css';
import App from './App';
import { SupabaseProvider } from './SupabaseProvider';

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
  <React.StrictMode>
    <SupabaseProvider>
      <App />
    </SupabaseProvider>
  </React.StrictMode>
);
