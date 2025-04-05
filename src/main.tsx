import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { Toaster } from 'react-hot-toast';
import './styles/App.css'; // Updated CSS import path
import App from './pages/App';
import React from 'react';

const rootElement = document.getElementById('root');
if (!rootElement) {
} else {
    createRoot(rootElement).render(
        <StrictMode>
        <Toaster />
        <App />
        </StrictMode>,
    );
}
