import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.jsx'
import { AppProvider } from './context/AppContext'
import { ModalProvider } from './context/ModalContext'
import { OficinaProvider } from './context/OficinaContext'
import { ToastProvider } from './context/ToastContext'
import './styles/tailwind.css'
import './index.css'

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <AppProvider>
      <OficinaProvider>
        <ToastProvider>
          <ModalProvider>
            <App />
          </ModalProvider>
        </ToastProvider>
      </OficinaProvider>
    </AppProvider>
  </React.StrictMode>,
)
