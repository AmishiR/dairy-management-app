import { createClient } from '@/app/lib/supabase/server'
import { inviteStaff } from './actions'
import StaffListTable from './StaffListTable'

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

        <StaffListTable rows={staffList ?? []} />
      </div>
    </div>
  )
}