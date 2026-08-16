'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/app/lib/supabase/client'

// This page is reached via the invite email link. Supabase's browser
// client automatically detects the invite token in the URL (hash
// fragment) on load and establishes a session — that's why this is a
// Client Component and why we don't need a separate callback route to
// manually exchange a code. By the time this renders, the invited user
// already has a valid session; we're just asking them to set a password
// to finish account setup.
export default function SetPasswordPage() {
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)
  const router = useRouter()

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)

    if (password.length < 8) {
      setError('Password must be at least 8 characters.')
      return
    }
    if (password !== confirmPassword) {
      setError('Passwords do not match.')
      return
    }

    setSubmitting(true)
    const supabase = createClient()

    const { error: updateError } = await supabase.auth.updateUser({ password })

    if (updateError) {
      setError(updateError.message)
      setSubmitting(false)
      return
    }

    // Role was already set correctly at invite time (via user metadata ->
    // fn_handle_new_user), so we don't need to look it up here — staff
    // invites always land on /staff.
    router.push('/staff')
  }

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
        onSubmit={handleSubmit}
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
        <h1 style={{ fontSize: 20, marginBottom: 8 }}>Set Your Password</h1>
        <p style={{ fontSize: 13, color: '#888', marginTop: -8 }}>
          Welcome — set a password to finish setting up your account.
        </p>

        {error && <p style={{ color: 'red', fontSize: 14 }}>{error}</p>}

        <label style={{ fontSize: 14 }}>
          New Password
          <input
            type="password"
            required
            minLength={8}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            style={{ width: '100%', padding: 8, marginTop: 4 }}
          />
        </label>

        <label style={{ fontSize: 14 }}>
          Confirm Password
          <input
            type="password"
            required
            minLength={8}
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            style={{ width: '100%', padding: 8, marginTop: 4 }}
          />
        </label>

        <button
          type="submit"
          disabled={submitting}
          style={{ padding: 10, marginTop: 8, cursor: submitting ? 'default' : 'pointer' }}
        >
          {submitting ? 'Saving…' : 'Set Password & Continue'}
        </button>
      </form>
    </div>
  )
}