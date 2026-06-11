import { useState } from 'react';

const initialForm = {
  full_name: '',
  email: '',
  phone: '',
};

export default function Customers({ customers, onCreate, onDelete }) {
  const [form, setForm] = useState(initialForm);

  const handleSubmit = async (event) => {
    event.preventDefault();
    await onCreate({
      full_name: form.full_name.trim(),
      email: form.email.trim(),
      phone: form.phone.trim(),
    });
    setForm(initialForm);
  };

  return (
    <div className="stack">
      <div className="section-heading">
        <div>
          <h2>Customer Management</h2>
          <p>Create customers with unique emails and manage customer records.</p>
        </div>
      </div>

      <form className="card form-grid" onSubmit={handleSubmit}>
        <label>
          Full name
          <input value={form.full_name} onChange={(e) => setForm({ ...form, full_name: e.target.value })} required minLength="2" />
        </label>
        <label>
          Email address
          <input type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} required />
        </label>
        <label>
          Phone number
          <input value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} required minLength="7" />
        </label>
        <div className="form-actions">
          <button type="submit">Add Customer</button>
        </div>
      </form>

      <div className="card table-card">
        <table>
          <thead>
            <tr>
              <th>Name</th>
              <th>Email</th>
              <th>Phone</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {customers.map((customer) => (
              <tr key={customer.id}>
                <td>{customer.full_name}</td>
                <td>{customer.email}</td>
                <td>{customer.phone}</td>
                <td className="row-actions">
                  <button className="danger" onClick={() => onDelete(customer.id)}>Delete</button>
                </td>
              </tr>
            ))}
            {customers.length === 0 && (
              <tr><td colSpan="4" className="empty">No customers found.</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
