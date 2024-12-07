import { signIn, signOut, useSession } from '@hono/auth-js/react'

export function Header() {
  const { data: session, status } = useSession()
  return (
    <>
      <div>I am {session?.user?.name || 'unknown'}</div>
      {
        status === "authenticated" ?
          <SignOutButton /> :
          <SignInButton />
      }
    </>
  )
}

function SignInButton() {
  return <button type="button" onClick={() => signIn('google')}>Sign in with Google</button>
}

function SignOutButton() {
  return <button type="button" onClick={() => signOut()}>Sign out</button>
}