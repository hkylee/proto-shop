import React from 'react'
import { createRoot } from 'react-dom/client'
import App from './App.jsx'
import './styles/tokens.css'
import './styles/player.css'
import './screens/agent.css'
import './screens/product.css'

createRoot(document.getElementById('root')).render(<App />)
