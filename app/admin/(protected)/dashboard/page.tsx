import DashboardOverview from '@/app/components/DashboardOverview'

// Deliberately identical to /staff — admin sees everything staff sees,
// via the SAME component, not a copy of it. The only admin-exclusive
// feature is the "Add Staff" nav link, added in app/admin/layout.tsx.
export default function AdminDashboardPage() {
  return <DashboardOverview />
}