import { login } from './actions'

// Staff/admin only — no signup form. Staff accounts are created via the
// Supabase Dashboard (or a dedicated "add staff" screen later), not self-serve.
export default async function LoginPage({
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
        action={login}
        style={{
          display: 'flex',
          flexDirection: 'column',
          gap: 12,
          width: 320,
          padding: 24,
          border: '1px solid #ddd',
          borderRadius: 8,
        }}
      >
        <h1 style={{ fontSize: 20, marginBottom: 8 }}>Dairy Dashboard</h1>

        {error === 'customer_accounts_not_supported' && (
          <p style={{ color: 'red', fontSize: 14 }}>
            This login is for staff/admin only. Customer accounts don&apos;t
            have access here.
          </p>
        )}
        {error && error !== 'customer_accounts_not_supported' && (
          <p style={{ color: 'red', fontSize: 14 }}>{error}</p>
        )}

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

        <button
          type="submit"
          style={{ padding: 10, marginTop: 8, cursor: 'pointer' }}
        >
          Log in
        </button>
      </form>
    </div>
  )
}