import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App.jsx';
import { ErrorBoundary } from './components/common/ErrorBoundary.jsx';
import './index.css';

// Global Security: Cegah menu klik kanan (Save image as, Copy image, dll.) dan dragging pada gambar
window.addEventListener('contextmenu', (e) => {
  if (e.target.tagName === 'IMG' || e.target.closest('img') || e.target.closest('.protected-asset')) {
    e.preventDefault();
  }
});

window.addEventListener('dragstart', (e) => {
  if (e.target.tagName === 'IMG' || e.target.closest('img') || e.target.closest('.protected-asset')) {
    e.preventDefault();
  }
});

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <ErrorBoundary>
      <App />
    </ErrorBoundary>
  </React.StrictMode>,
);

