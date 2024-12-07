import { SessionProvider } from '@hono/auth-js/react'
import { createRoot } from 'react-dom/client'
import { Header } from './components/header'

function App() {
  return (
    <SessionProvider>
      <Header />
      <h1>Welcome Admin!</h1>
    </SessionProvider>
  )
}

const domNode = document.getElementById('root')
if (domNode) {
  const root = createRoot(domNode)
  root.render(<App />)
} else {
  console.error('Failed to find the root element')
}