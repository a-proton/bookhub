import { StrictMode } from 'react';
import ReactDOM from 'react-dom/client';
import { CartProvider } from './contexts/CartContext.jsx';
import './index.css';
import App from './App.jsx';

const root = ReactDOM.createRoot(document.getElementById('root'));

root.render(
  <StrictMode>
    <CartProvider>
      <App />
    </CartProvider>
  </StrictMode>
);