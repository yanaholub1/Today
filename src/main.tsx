import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import './index.css'
import App from './App.tsx'

// iOS Safari only applies `:active` styles when some touch listener exists
// on the page — otherwise it treats every tap as a potential scroll/click
// and skips the active state entirely. This no-op listener is the standard
// fix, and is what makes the app-wide `.pressable` press feedback (see
// index.css) actually work on-device, not just in desktop browser testing.
document.addEventListener('touchstart', () => {}, true)

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <BrowserRouter>
      <App />
    </BrowserRouter>
  </StrictMode>,
)
