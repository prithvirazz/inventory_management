import { useState } from 'react';

const initialForm = {
  name: '',
  sku: '',
  price: '',
  quantity_in_stock: '',
};

export default function Products({ products, onCreate, onUpdate, onDelete }) {
  const [form, setForm] = useState(initialForm);
  const [editingId, setEditingId] = useState(null);

  const handleSubmit = async (event) => {
    event.preventDefault();
    const payload = {
      name: form.name.trim(),
      sku: form.sku.trim(),
      price: Number(form.price),
      quantity_in_stock: Number(form.quantity_in_stock),
    };

    if (editingId) {
      await onUpdate(editingId, payload);
      setEditingId(null);
    } else {
      await onCreate(payload);
    }
    setForm(initialForm);
  };

  const startEdit = (product) => {
    setEditingId(product.id);
    setForm({
      name: product.name,
      sku: product.sku,
      price: product.price,
      quantity_in_stock: product.quantity_in_stock,
    });
  };

  return (
    <div className="stack">
      <div className="section-heading">
        <div>
          <h2>Product Management</h2>
          <p>Add, update, delete, and monitor product inventory.</p>
        </div>
      </div>

      <form className="card form-grid" onSubmit={handleSubmit}>
        <label>
          Product name
          <input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required minLength="2" />
        </label>
        <label>
          SKU/code
          <input value={form.sku} onChange={(e) => setForm({ ...form, sku: e.target.value })} required minLength="2" />
        </label>
        <label>
          Price
          <input type="number" step="0.01" min="0.01" value={form.price} onChange={(e) => setForm({ ...form, price: e.target.value })} required />
        </label>
        <label>
          Quantity in stock
          <input type="number" min="0" value={form.quantity_in_stock} onChange={(e) => setForm({ ...form, quantity_in_stock: e.target.value })} required />
        </label>
        <div className="form-actions">
          <button type="submit">{editingId ? 'Update Product' : 'Add Product'}</button>
          {editingId && (
            <button type="button" className="secondary" onClick={() => { setEditingId(null); setForm(initialForm); }}>
              Cancel Edit
            </button>
          )}
        </div>
      </form>

      <div className="card table-card">
        <table>
          <thead>
            <tr>
              <th>Name</th>
              <th>SKU</th>
              <th>Price</th>
              <th>Stock</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {products.map((product) => (
              <tr key={product.id}>
                <td>{product.name}</td>
                <td>{product.sku}</td>
                <td>₹{Number(product.price).toFixed(2)}</td>
                <td>
                  <span className={product.quantity_in_stock <= 5 ? 'stock low' : 'stock'}>
                    {product.quantity_in_stock}
                  </span>
                </td>
                <td className="row-actions">
                  <button className="secondary" onClick={() => startEdit(product)}>Edit</button>
                  <button className="danger" onClick={() => onDelete(product.id)}>Delete</button>
                </td>
              </tr>
            ))}
            {products.length === 0 && (
              <tr><td colSpan="5" className="empty">No products found.</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
