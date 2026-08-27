import { login } from './actions'
import Link from 'next/link'

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>
}) {
  const { error } = await searchParams

  return (
    <div
      style={{
        display: 'grid',
        gridTemplateColumns: '1.2fr 0.8fr',
        minHeight: '100vh',
        background: '#fff',
      }}
      className="ui-login-grid"
    >
      {/* Signature Panel */}
      <div
        style={{
          background: 'linear-gradient(135deg, #007AFF 0%, #00C2FF 100%)',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
          padding: '80px',
          position: 'relative',
          overflow: 'hidden',
          color: 'white',
        }}
        className="ui-login-panel"
      >
        {/* Soft abstract decorative shape */}
        <div
          style={{
            position: 'absolute',
            width: 600,
            height: 600,
            borderRadius: '45% 55% 70% 30% / 30% 30% 70% 70%',
            background: 'rgba(255, 255, 255, 0.15)',
            top: '-10%',
            right: '-10%',
            filter: 'blur(40px)',
          }}
        />

        <h1
          style={{
            fontFamily: 'var(--font-display)',
            fontSize: 52,
            fontWeight: 600,
            lineHeight: 1.1,
            maxWidth: 450,
            position: 'relative',
            margin: 0,
            letterSpacing: '-0.02em',
          }}
        >
          Freshness,
          <br />
          Defined by Data.
        </h1>

        <p
          style={{
            fontSize: 18,
            opacity: 0.9,
            marginTop: 24,
            maxWidth: 380,
            position: 'relative',
            lineHeight: 1.6,
          }}
        >
          The central dashboard for PureDairy operations. Manage your
          production, logistics, and payments in one place.
        </p>
      </div>

      {/* Form Panel */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: 40,
          background: 'var(--color-bg)',
        }}
      >
        <form
          action={login}
          className="ui-form"
          style={{
            width: '100%',
            maxWidth: 360,
          }}
        >
          <div style={{ marginBottom: 32 }}>
            <h2
              style={{
                fontFamily: 'var(--font-display)',
                fontSize: 32,
                fontWeight: 600,
                margin: 0,
                color: 'var(--color-text)',
              }}
            >
              Sign in
            </h2>

            <p
              style={{
                fontSize: 14,
                color: 'var(--color-text-secondary)',
                marginTop: 8,
              }}
            >
              Internal access for staff and administrators.
            </p>
          </div>

          {/* Customer account error */}
          {error === 'customer_accounts_not_supported' && (
            <p className="ui-error">
              This portal is restricted to staff. Customer accounts are not
              supported here.
            </p>
          )}

          {/* Auth service error */}
          {error === 'auth_service_unavailable' && (
            <p className="ui-error">
              We couldn&apos;t reach the login service. Please try again in a
              moment.
            </p>
          )}

          {/* Other errors */}
          {error &&
            error !== 'customer_accounts_not_supported' &&
            error !== 'auth_service_unavailable' && (
              <p className="ui-error">{error}</p>
            )}

          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              gap: 20,
            }}
          >
            <label className="ui-field">
              Email Address

              <input
                type="email"
                name="email"
                required
                className="ui-input"
                placeholder="name@puredairy.com"
              />
            </label>

            <label className="ui-field">
              Password

              <input
                type="password"
                name="password"
                required
                className="ui-input"
                placeholder="••••••••"
              />
            </label>

            <button
              type="submit"
              className="ui-btn ui-btn-primary"
              style={{
                padding: '12px',
                marginTop: 8,
              }}
            >
              Sign in to Dashboard
            </button>
          </div>

          {/* Admin Login */}
          <div
            style={{
              textAlign: 'center',
              marginTop: 24,
            }}
          >
            <Link
              href="/admin/login"
              className="ui-link"
              style={{
                fontSize: 13,
                color: 'var(--color-text-secondary)',
              }}
            >
              Looking for{' '}
              <span
                style={{
                  color: 'var(--color-accent)',
                  fontWeight: 600,
                }}
              >
                Admin Login?
              </span>
            </Link>
          </div>
        </form>
      </div>

      {/* Responsive Design */}
      <style>{`
        @media (max-width: 960px) {
          .ui-login-grid {
            grid-template-columns: 1fr !important;
          }

          .ui-login-panel {
            display: none !important;
          }
        }
      `}</style>
    </div>
  )
}