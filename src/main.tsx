import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { ThemeProvider } from './components/ThemeProvider';
import { PreferencesProvider } from './components/PreferencesProvider';
import { AuthProvider } from './components/AuthProvider';
import App from './App';
import Settings from './routes/Settings';
import History from './routes/History';
import Leaderboard from './routes/Leaderboard';
import './index.css';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <ThemeProvider>
      <PreferencesProvider>
        <AuthProvider>
          <BrowserRouter>
            <Routes>
              <Route path="/" element={<App />} />
              <Route path="/settings" element={<Settings />} />
              <Route path="/history" element={<History />} />
              <Route path="/statistics" element={<History />} />
              <Route path="/stats" element={<History />} />
              <Route path="/leaderboard" element={<Leaderboard />} />
            </Routes>
          </BrowserRouter>
        </AuthProvider>
      </PreferencesProvider>
    </ThemeProvider>
  </StrictMode>,
);
