import { createClient } from '@/app/lib/supabase/server'
import { inviteStaff } from './actions'

export default async function AdminStaffPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string; success?: string }>
}) {
  const { error, success } = await searchParams
  const supabase = await createClient()

  // For context: show existing staff/admin accounts below the form.
  // This reads from profiles only (no auth.users access needed/possible
  // from this client) — full_name may be null if a staff member hasn't
  // completed their profile yet.
  const { data: staffList } = await supabase
    .from('profiles')
    .select('id, role, full_name, status, created_at')
    .in('role', ['staff', 'admin'])
    .order('created_at', { ascending: false })

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
      <h1 style={{ fontSize: 22 }}>Add Staff</h1>

      <div style={{ border: '1px solid #ddd', borderRadius: 8, padding: 16, maxWidth: 420 }}>
        {success && (
          <p style={{ color: '#1e7b34', fontSize: 14, marginBottom: 12 }}>
            Invitation sent. The staff member will receive an email to set
            their own password.
          </p>
        )}
        {error && <p style={{ color: 'red', fontSize: 14, marginBottom: 12 }}>{error}</p>}

        <form action={inviteStaff} style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          <label style={{ fontSize: 14 }}>
            Staff Email
            <input
              type="email"
              name="email"
              required
              placeholder="staff@example.com"
              style={{ width: '100%', padding: 8, marginTop: 4 }}
            />
          </label>

          <label style={{ fontSize: 14 }}>
            Role
            <select name="role" required defaultValue="staff" style={{ width: '100%', padding: 8, marginTop: 4 }}>
              <option value="staff">Staff</option>
            </select>
          </label>

          <p style={{ fontSize: 12, color: '#888' }}>
            No password is set here — the staff member creates their own
            after clicking the link in the invitation email.
          </p>

          <button type="submit" style={{ padding: 10, marginTop: 4, cursor: 'pointer' }}>
            Send Invitation
          </button>
        </form>
      </div>

      <div style={{ border: '1px solid #ddd', borderRadius: 8, padding: 16 }}>
        <h2 style={{ fontSize: 16, marginBottom: 12 }}>Existing Staff & Admin</h2>

        {(!staffList || staffList.length === 0) && (
          <p style={{ fontSize: 13, color: '#999' }}>None yet.</p>
        )}

        {staffList && staffList.length > 0 && (
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 14 }}>
            <thead>
              <tr style={{ textAlign: 'left', borderBottom: '1px solid #eee' }}>
                <th style={{ padding: '8px 4px' }}>Name</th>
                <th style={{ padding: '8px 4px' }}>Role</th>
                <th style={{ padding: '8px 4px' }}>Status</th>
                <th style={{ padding: '8px 4px' }}>Added</th>
              </tr>
            </thead>
            <tbody>
              {staffList.map((s) => (
                <tr key={s.id} style={{ borderBottom: '1px solid #f5f5f5' }}>
                  <td style={{ padding: '8px 4px' }}>{s.full_name ?? '(not set yet)'}</td>
                  <td style={{ padding: '8px 4px' }}>{s.role}</td>
                  <td style={{ padding: '8px 4px' }}>{s.status}</td>
                  <td style={{ padding: '8px 4px', color: '#888', fontSize: 12 }}>
                    {new Date(s.created_at).toLocaleDateString()}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  )
}