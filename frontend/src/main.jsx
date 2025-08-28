import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import './index.css';
import App from './App.jsx';

import { setAuthTokenGetter } from './api/axios';
import useStore from './store/useStore';
setAuthTokenGetter(() => useStore.getState().accessToken);

ReactDOM.createRoot(document.getElementById('root')).render(
  <BrowserRouter>
    <App />
  </BrowserRouter>
);
