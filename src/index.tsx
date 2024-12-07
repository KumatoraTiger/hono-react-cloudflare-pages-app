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
    renderToString(
      <html lang="ja">
        <head>
          <meta charSet="utf-8" />
          <meta content="width=device-width, initial-scale=1" name="viewport" />
          <link rel="stylesheet" href="https://cdn.simplecss.org/simple.min.css" />
          {import.meta.env.PROD ? (
            <script type="module" src="/static/root.js" />
          ) : (
            <script type="module" src="/src/root.tsx" />
          )}
          <body>
            <div id="root" />
          </body>
        </head>
      </html>
    )
  )
})

app.get('/admin', (c) => {
  return c.html(
    renderToString(
      <html lang="ja">
        <head>
          <meta charSet="utf-8" />
          <meta content="width=device-width, initial-scale=1" name="viewport" />
          <link rel="stylesheet" href="https://cdn.simplecss.org/simple.min.css" />
          {import.meta.env.PROD ? (
            <script type="module" src="/static/admin.js" />
          ) : (
            <script type="module" src="/src/admin.tsx" />
          )}
          <body>
            <div id="root" />
          </body>
        </head>
      </html>
    )
  )
})

export default app
