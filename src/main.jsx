import React from 'react'
import { createRoot } from 'react-dom/client'
import './style.scss'
import App from './components/App.jsx'

const container = document.querySelector('.mount')
const root = createRoot(container)

root.render(<App />)
