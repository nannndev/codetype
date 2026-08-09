import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { ThemeProvider } from './components/ThemeProvider';
import { PreferencesProvider } from './components/PreferencesProvider';
import App from './App';
import Settings from './routes/Settings';
import History from './routes/History';
import './index.css';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <ThemeProvider>
      <PreferencesProvider>
        <BrowserRouter>
          <Routes>
            <Route path="/" element={<App />} />
            <Route path="/settings" element={<Settings />} />
            <Route path="/history" element={<History />} />
          </Routes>
        </BrowserRouter>
      </PreferencesProvider>
    </ThemeProvider>
  </StrictMode>,
);
