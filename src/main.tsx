import React from 'react'
import { createRoot } from 'react-dom/client'
import './style.scss'
import App from './components/App.tsx'

const container = document.querySelector('.mount') as Element
const root = createRoot(container)

root.render(<App />)
