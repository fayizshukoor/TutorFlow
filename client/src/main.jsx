import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './app/App.jsx';

import './styles/tokens.css';
import './styles/base.css';
import './styles/layout.css';
import './styles/navigation.css';
import './styles/forms.css';
import './styles/dashboards.css';
import './styles/students.css';
import './styles/responsive.css';

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
);
