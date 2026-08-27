const TYPE_OPTIONS = ['retail', 'wholesale', 'institutional']

type CustomerFields = {
  customer_id: string
  customer_code: string
  organization_name: string
  customer_type: string
  contact_person: string | null
  phone: string | null
  email: string | null
  address: string | null
  status: string
}

// Shared add/edit form. `customer` is undefined when adding; when editing it
// pre-fills the fields and a hidden customer_id is emitted for the action.
export default function CustomerForm({
  action,
  customer,
  submitLabel,
}: {
  action: (formData: FormData) => void
  customer?: CustomerFields
  submitLabel: string
}) {
  // Keep an unrecognised existing type selectable so a save doesn't silently
  // rewrite it to the first option.
  const typeOptions =
    customer && !TYPE_OPTIONS.includes(customer.customer_type)
      ? [customer.customer_type, ...TYPE_OPTIONS]
      : TYPE_OPTIONS

  return (
    <form action={action} style={{ display: 'flex', flexDirection: 'column', gap: 12, maxWidth: 480 }}>
      {customer && <input type="hidden" name="customer_id" value={customer.customer_id} />}

      <label style={{ fontSize: 14 }}>
        Customer Code *
        <input
          name="customer_code"
          required
          defaultValue={customer?.customer_code ?? ''}
          placeholder="e.g. CUST-0001"
          style={{ width: '100%', padding: 8, marginTop: 4 }}
        />
      </label>

      <label style={{ fontSize: 14 }}>
        Organization Name *
        <input
          name="organization_name"
          required
          defaultValue={customer?.organization_name ?? ''}
          placeholder="e.g. Sharma Sweets"
          style={{ width: '100%', padding: 8, marginTop: 4 }}
        />
      </label>

      <label style={{ fontSize: 14 }}>
        Customer Type
        <select
          name="customer_type"
          defaultValue={customer?.customer_type ?? 'retail'}
          style={{ width: '100%', padding: 8, marginTop: 4 }}
        >
          {typeOptions.map((t) => (
            <option key={t} value={t}>
              {t}
            </option>
          ))}
        </select>
      </label>

      <label style={{ fontSize: 14 }}>
        Contact Person
        <input
          name="contact_person"
          defaultValue={customer?.contact_person ?? ''}
          style={{ width: '100%', padding: 8, marginTop: 4 }}
        />
      </label>

      <label style={{ fontSize: 14 }}>
        Phone
        <input
          name="phone"
          defaultValue={customer?.phone ?? ''}
          style={{ width: '100%', padding: 8, marginTop: 4 }}
        />
      </label>

      <label style={{ fontSize: 14 }}>
        Email
        <input
          type="email"
          name="email"
          defaultValue={customer?.email ?? ''}
          style={{ width: '100%', padding: 8, marginTop: 4 }}
        />
      </label>

      <label style={{ fontSize: 14 }}>
        Address
        <textarea
          name="address"
          rows={3}
          defaultValue={customer?.address ?? ''}
          style={{ width: '100%', padding: 8, marginTop: 4, fontFamily: 'inherit' }}
        />
      </label>

      <label style={{ fontSize: 14 }}>
        Status
        <select
          name="status"
          defaultValue={customer?.status === 'inactive' ? 'inactive' : 'active'}
          style={{ width: '100%', padding: 8, marginTop: 4 }}
        >
          <option value="active">active</option>
          <option value="inactive">inactive</option>
        </select>
      </label>

      <button type="submit" style={{ padding: 10, marginTop: 8, cursor: 'pointer' }}>
        {submitLabel}
      </button>
    </form>
  )
}
