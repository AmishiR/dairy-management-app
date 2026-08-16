import { adminLogin } from './actions'
import Link from 'next/link'

export default async function AdminLoginPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>
}) {
  const { error } = await searchParams

  return (
    <div
      style={{
        display: 'flex',
        minHeight: '100vh',
        alignItems: 'center',
        justifyContent: 'center',
        fontFamily: 'sans-serif',
      }}
    >
      <form
        action={adminLogin}
        style={{
          display: 'flex',
          flexDirection: 'column',
          gap: 12,
          width: 320,
          padding: 24,
          border: '1px solid #333',
          borderRadius: 8,
        }}
      >
        <h1 style={{ fontSize: 20, marginBottom: 8 }}>Admin Login</h1>

        {error && <p style={{ color: 'red', fontSize: 14 }}>{error}</p>}

        <label style={{ fontSize: 14 }}>
          Email
          <input
            type="email"
            name="email"
            required
            style={{ width: '100%', padding: 8, marginTop: 4 }}
          />
        </label>

        <label style={{ fontSize: 14 }}>
          Password
          <input
            type="password"
            name="password"
            required
            style={{ width: '100%', padding: 8, marginTop: 4 }}
          />
        </label>

        <button type="submit" style={{ padding: 10, marginTop: 8, cursor: 'pointer' }}>
          Log in as Admin
        </button>

        <div style={{ textAlign: 'center', marginTop: 8 }}>
          <Link href="/login" style={{ fontSize: 13, color: '#2563eb' }}>
            ← Back to staff login
          </Link>
        </div>
      </form>
    </div>
  )
}