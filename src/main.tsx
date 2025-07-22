import { createRoot } from 'react-dom/client'
import App from './App.tsx'
import './index.css'
import { validateSecurityHeaders } from './lib/security-config'

// Validate security configuration on startup
validateSecurityHeaders();

createRoot(document.getElementById("root")!).render(<App />);
