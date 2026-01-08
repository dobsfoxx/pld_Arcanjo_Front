import React from 'react';
import ReactDOM from 'react-dom/client';
import { ThemeProvider } from '@mui/material/styles';
import { CssVarsProvider as JoyCssVarsProvider } from '@mui/joy/styles';
import CssBaseline from '@mui/material/CssBaseline';
import { GoogleOAuthProvider } from '@react-oauth/google';
import App from './App';
import { materialTheme, THEME_ID } from './theme/materialTheme';
import { joyTheme } from './theme/joyTheme';
import './index.css';

// Google OAuth Client ID - must be set in frontend env (Vite)
const GOOGLE_CLIENT_ID: string | undefined = import.meta.env.VITE_GOOGLE_CLIENT_ID;

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <ThemeProvider theme={{ [THEME_ID]: materialTheme }}>
      <JoyCssVarsProvider theme={joyTheme} defaultMode="light">
        <CssBaseline enableColorScheme />
        {GOOGLE_CLIENT_ID ? (
          <GoogleOAuthProvider clientId={GOOGLE_CLIENT_ID}>
            <App />
          </GoogleOAuthProvider>
        ) : (
          <App />
        )}
      </JoyCssVarsProvider>
    </ThemeProvider>
  </React.StrictMode>
);