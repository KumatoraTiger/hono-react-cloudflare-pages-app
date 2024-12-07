import { SessionProvider, useSession } from '@hono/auth-js/react'
import { createRoot } from 'react-dom/client'
import { Header } from './components/header'

function App() {
  return (
    <SessionProvider>
      <Header />
      <AdminLink />
    </SessionProvider>
  )
}

function AdminLink() {
  const { data: _session, status } = useSession()
  return (
    <>
      { status === "authenticated" && <a href="/admin">Admin</a> }
    </>
  )
}

const domNode = document.getElementById('root')
if (domNode) {
  const root = createRoot(domNode)
  root.render(<App />)
} else {
  console.error('Failed to find the root element')
}