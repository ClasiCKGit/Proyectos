import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import {CounterApp} from './CounterApp.tsx'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <CounterApp />
  </StrictMode>,
)

//TODO: implementar logica para los botones de deshacer y rehacer,