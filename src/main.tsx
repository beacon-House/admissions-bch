import React from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter as Router } from 'react-router-dom';
import App from './App.tsx';
import { validateEnv } from './lib/env';
import './index.css';

// Validate environment variables before app starts
validateEnv();

createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <Router>
    <App />
    </Router>
  </React.StrictMode>
);
