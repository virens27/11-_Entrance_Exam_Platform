import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.jsx'
import { AuthProvider } from './context/AuthContext.jsx'
import { Toaster } from 'react-hot-toast'
import './index.css'

ReactDOM.createRoot(document.getElementById('root')).render(
    <React.StrictMode>
        {/* AuthProvider wraps everything so all pages know who is logged in */}
        <AuthProvider>
            <App />
            {/* Toaster shows popup messages like "Correct!" or "Wrong answer" */}
            <Toaster
                position="top-center"
                toastOptions={{
                    duration: 3000,
                    style: {
                        borderRadius: '12px',
                        fontFamily: 'sans-serif',
                        fontSize: '14px',
                    },
                    success: {
                        style: {
                            background: '#d1fae5',
                            color: '#064e3b',
                        },
                    },
                    error: {
                        style: {
                            background: '#fee2e2',
                            color: '#7f1d1d',
                        },
                    },
                }}
            />
        </AuthProvider>
    </React.StrictMode>
)