import Google from '@auth/core/providers/google';
import { DrizzleAdapter } from "@auth/drizzle-adapter";
import { GetObjectCommand, PutObjectCommand, S3Client } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { authHandler, getAuthUser, initAuthConfig, verifyAuth } from '@hono/auth-js';
import { eq } from "drizzle-orm";
import { drizzle } from "drizzle-orm/d1";
import { type Context, Hono } from 'hono';
import { renderToString } from 'react-dom/server';
import { images, users } from './db/schema';

type Bindings = {
  AUTH_SECRET: string;
  GOOGLE_ID: string;
  GOOGLE_SECRET: string;
  CLOUDFLARE_REGION: string;
  CLOUDFLARE_R2_ENDPOINT: string;
  CLOUDFLARE_R2_BUCKET_NAME: string;
  CLOUDFLARE_R2_ACCESS_KEY_ID: string;
  CLOUDFLARE_R2_SECRET_ACCESS_KEY: string;
  DB: D1Database;
  BUCKET: R2Bucket;
}

const app = new Hono<{ Bindings: Bindings }>();

const r2Client = (c: Context<{ Bindings: Bindings}>) => {
  return new S3Client({
    region: c.env.CLOUDFLARE_REGION,
    endpoint: c.env.CLOUDFLARE_R2_ENDPOINT,
    credentials: {
      accessKeyId: c.env.CLOUDFLARE_R2_ACCESS_KEY_ID,
      secretAccessKey: c.env.CLOUDFLARE_R2_SECRET_ACCESS_KEY,
    },
  });
}

app.use(
  '*',
  initAuthConfig((c) => ({
    secret: c.env.AUTH_SECRET,
    adapter: DrizzleAdapter(drizzle(c.env.DB)),
    providers: [
      Google({
        clientId: c.env.GOOGLE_ID,
        clientSecret: c.env.GOOGLE_SECRET,
      }),
    ],
    session: {
      strategy: 'jwt',
    },
  }))
)

app.use('/api/auth/*', authHandler())

app.use('/admin/*', verifyAuth())
app.use('/api/admin/*', verifyAuth())

// 署名付き URL 生成エンドポイント
app.get('/api/admin/get-presigned-url', async (c) => {
  const client = r2Client(c);
  const key = crypto.randomUUID();
  const command = new PutObjectCommand({
    Bucket: c.env.CLOUDFLARE_R2_BUCKET_NAME,
    Key: key,
    ContentType: 'application/octet-stream',
  });

  const signedUrl = await getSignedUrl(client, command, { expiresIn: 3600 });

  return c.json({ url: signedUrl, key: key });
});

app.post('/api/admin/upload-complete', async (c) => {
  const authUser = await getAuthUser(c);
  const email = authUser?.session?.user?.email;

  if (!email) {
    c.status(401);
    return c.json({ message: 'Unauthorized' });
  }

  const { key } = await c.req.json<{ key: string }>();

  const db = drizzle(c.env.DB);
  const user = await db.select().from(users).where(eq(users.email, email)).get();

  if (!user) {
    c.status(401);
    return c.json({ message: 'Unauthorized' });
  }

  await db.insert(images).values({
    id: key,
    userId: user.id,
    createdAt: new Date(),
  });

  return c.json({ message: 'success' });
});

app.get('/api/admin/images', async (c) => {
  const authUser = await getAuthUser(c);
  const email = authUser?.session?.user?.email;

  if (!email) {
    c.status(401);
    return c.json({ message: 'Unauthorized' });
  }

  const db = drizzle(c.env.DB);
  const user = await db.select().from(users).where(eq(users.email, email)).get();

  if (!user) {
    c.status(401);
    return c.json({ message: 'Unauthorized' });
  }

  const objects = await db.select().from(images).where(eq(images.userId, user.id)).all();

  const client = r2Client(c);

  const signedUrls = []
  for (const object of objects) {
    const command = new GetObjectCommand({
      Bucket: c.env.CLOUDFLARE_R2_BUCKET_NAME,
      Key: object.id,
    });
    const signedUrl = await getSignedUrl(client, command, { expiresIn: 3600 });
    signedUrls.push(signedUrl);
  }
  return c.json(signedUrls);
})

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
