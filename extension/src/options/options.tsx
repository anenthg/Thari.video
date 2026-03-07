import { createRoot } from 'react-dom/client'
import App from '../sidepanel/App'
import '../styles/index.css'

// Options page reuses the same App component
createRoot(document.getElementById('root')!).render(<App />)
