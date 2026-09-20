import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import App from './App.jsx';
import { SiteSettingsProvider } from './contexts/SiteSettingsContext.jsx';
import './styles/global.css';

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <BrowserRouter>
      <SiteSettingsProvider>
        <App />
      </SiteSettingsProvider>
    </BrowserRouter>
  </React.StrictMode>
);
