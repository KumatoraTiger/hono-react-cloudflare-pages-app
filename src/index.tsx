import Google from '@auth/core/providers/google'
import { authHandler, initAuthConfig, verifyAuth } from '@hono/auth-js'
import { Hono } from 'hono'
import { renderToString } from 'react-dom/server'

const app = new Hono()

app.use(
  '*',
  initAuthConfig((c) => ({
    secret: c.env.AUTH_SECRET,
    providers: [
      Google({
        clientId: c.env.GOOGLE_ID,
        clientSecret: c.env.GOOGLE_SECRET,
      }),
    ],
  }))
)

app.use('/api/auth/*', authHandler())

app.use('/admin/*', verifyAuth())

app.get('/', (c) => {
  return c.html(
    renderToString(<h1>Hello!</h1>)
  )
})

app.get('/admin', (c) => {
  return c.html(
    renderToString(<h1>Hello! Admin</h1>)
  )
})

export default app
