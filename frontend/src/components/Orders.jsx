import { useMemo, useState } from 'react';

export default function Orders({ orders, customers, products, onCreate, onCancel }) {
  const [customerId, setCustomerId] = useState('');
  const [items, setItems] = useState([{ product_id: '', quantity: 1 }]);

  const selectedTotal = useMemo(() => {
    return items.reduce((sum, item) => {
      const product = products.find((candidate) => String(candidate.id) === String(item.product_id));
      return sum + (product ? Number(product.price) * Number(item.quantity || 0) : 0);
    }, 0);
  }, [items, products]);

  const updateItem = (index, key, value) => {
    const copy = [...items];
    copy[index] = { ...copy[index], [key]: value };
    setItems(copy);
  };

  const addItem = () => setItems([...items, { product_id: '', quantity: 1 }]);
  const removeItem = (index) => setItems(items.filter((_, itemIndex) => itemIndex !== index));

  const handleSubmit = async (event) => {
    event.preventDefault();
    const payload = {
      customer_id: Number(customerId),
      items: items.map((item) => ({ product_id: Number(item.product_id), quantity: Number(item.quantity) })),
    };
    await onCreate(payload);
    setCustomerId('');
    setItems([{ product_id: '', quantity: 1 }]);
  };

  return (
    <div className="stack">
      <div className="section-heading">
        <div>
          <h2>Order Management</h2>
          <p>Create orders only when enough inventory is available. Stock reduces automatically.</p>
        </div>
      </div>

      <form className="card order-form" onSubmit={handleSubmit}>
        <label>
          Customer
          <select value={customerId} onChange={(e) => setCustomerId(e.target.value)} required>
            <option value="">Select customer</option>
            {customers.map((customer) => (
              <option value={customer.id} key={customer.id}>{customer.full_name} · {customer.email}</option>
            ))}
          </select>
        </label>

        <div className="order-items">
          {items.map((item, index) => {
            const product = products.find((candidate) => String(candidate.id) === String(item.product_id));
            return (
              <div className="order-item-row" key={index}>
                <label>
                  Product
                  <select value={item.product_id} onChange={(e) => updateItem(index, 'product_id', e.target.value)} required>
                    <option value="">Select product</option>
                    {products.map((productOption) => (
                      <option value={productOption.id} key={productOption.id}>
                        {productOption.name} · {productOption.sku} · Stock: {productOption.quantity_in_stock}
                      </option>
                    ))}
                  </select>
                </label>
                <label>
                  Quantity
                  <input
                    type="number"
                    min="1"
                    max={product?.quantity_in_stock || undefined}
                    value={item.quantity}
                    onChange={(e) => updateItem(index, 'quantity', e.target.value)}
                    required
                  />
                </label>
                {items.length > 1 && (
                  <button type="button" className="danger slim" onClick={() => removeItem(index)}>Remove</button>
                )}
              </div>
            );
          })}
        </div>

        <div className="order-footer">
          <button type="button" className="secondary" onClick={addItem}>+ Add item</button>
          <strong>Estimated total: ₹{selectedTotal.toFixed(2)}</strong>
          <button type="submit">Place Order</button>
        </div>
      </form>

      <div className="card table-card">
        <table>
          <thead>
            <tr>
              <th>Order</th>
              <th>Customer</th>
              <th>Items</th>
              <th>Total</th>
              <th>Status</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {orders.map((order) => (
              <tr key={order.id}>
                <td>#{order.id}</td>
                <td>{order.customer.full_name}</td>
                <td>
                  <ul className="order-lines">
                    {order.items.map((item) => (
                      <li key={item.id}>
                        {item.product.name} × {item.quantity} = ₹{Number(item.line_total).toFixed(2)}
                      </li>
                    ))}
                  </ul>
                </td>
                <td>₹{Number(order.total_amount).toFixed(2)}</td>
                <td><span className={`badge ${order.status.toLowerCase()}`}>{order.status}</span></td>
                <td className="row-actions">
                  {order.status !== 'CANCELLED' ? (
                    <button className="danger" onClick={() => onCancel(order.id)}>Cancel</button>
                  ) : (
                    <span className="muted">—</span>
                  )}
                </td>
              </tr>
            ))}
            {orders.length === 0 && (
              <tr><td colSpan="6" className="empty">No orders found.</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
