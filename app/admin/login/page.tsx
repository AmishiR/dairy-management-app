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
        background: 'linear-gradient(180deg, #FFFFFF 0%, var(--color-surface) 100%)',
        padding: '24px',
      }}
    >
      <form
        action={adminLogin}
        className="ui-form ui-card"
        style={{ 
          width: '100%', 
          maxWidth: '400px', 
          padding: '40px',
          borderTop: '6px solid var(--color-accent)', // Branded accent bar
          boxShadow: 'var(--shadow-md)'
        }}
      >
        <div style={{ marginBottom: 32, textAlign: 'center' }}>
          <div 
            style={{ 
              display: 'inline-block', 
              padding: '8px 12px', 
              background: 'var(--color-accent-soft)', 
              borderRadius: '8px',
              marginBottom: '16px'
            }}
          >
            <span style={{ fontSize: '12px', fontWeight: 700, color: 'var(--color-accent)', letterSpacing: '0.05em', textTransform: 'uppercase' }}>
              Secure Portal
            </span>
          </div>
          <h1 style={{ 
            fontFamily: 'var(--font-display)', 
            fontSize: '28px', 
            fontWeight: 600, 
            margin: 0,
            color: 'var(--color-text)' 
          }}>
            Admin Sign in
          </h1>
          <p style={{ fontSize: '14px', color: 'var(--color-text-secondary)', marginTop: 8 }}>
            Please enter your administrative credentials.
          </p>
        </div>

        {error && (
          <div style={{ marginBottom: '20px' }}>
            <p className="ui-error" style={{ textAlign: 'center' }}>{error}</p>
          </div>
        )}

        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          <label className="ui-field">
            Admin Email
            <input 
              type="email" 
              name="email" 
              required 
              className="ui-input" 
              placeholder="admin@puredairy.com"
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
              marginTop: '10px',
              padding: '12px',
              fontSize: '15px'
            }}
          >
            Sign in as Administrator
          </button>

          <div style={{ textAlign: 'center', marginTop: '12px' }}>
            <Link 
              href="/login" 
              className="ui-link" 
              style={{ 
                fontSize: '13px', 
                color: 'var(--color-text-secondary)',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '4px'
              }}
            >
              <span>←</span> Back to staff login
            </Link>
          </div>
        </div>
      </form>
    </div>
  )
}