export default function Dashboard({ summary, products, orders }) {
  const lowStockItems = products.filter((product) => product.quantity_in_stock <= 5);
  const recentOrders = orders.slice(0, 5);

  return (
    <div className="stack">
      <div className="section-heading">
        <div>
          <h2>Dashboard</h2>
          <p>Overview of product, customer, order, and low-stock activity.</p>
        </div>
      </div>

      <div className="summary-grid">
        <SummaryCard label="Total products" value={summary?.total_products ?? 0} />
        <SummaryCard label="Total customers" value={summary?.total_customers ?? 0} />
        <SummaryCard label="Total orders" value={summary?.total_orders ?? 0} />
        <SummaryCard label="Low stock products" value={summary?.low_stock_products ?? 0} warning />
      </div>

      <div className="two-column">
        <div className="card">
          <h3>Low Stock Products</h3>
          {lowStockItems.length === 0 ? (
            <p className="muted">No low-stock products.</p>
          ) : (
            <ul className="mini-list">
              {lowStockItems.map((product) => (
                <li key={product.id}>
                  <span>{product.name}</span>
                  <strong>{product.quantity_in_stock} left</strong>
                </li>
              ))}
            </ul>
          )}
        </div>

        <div className="card">
          <h3>Recent Orders</h3>
          {recentOrders.length === 0 ? (
            <p className="muted">No orders created yet.</p>
          ) : (
            <ul className="mini-list">
              {recentOrders.map((order) => (
                <li key={order.id}>
                  <span>#{order.id} · {order.customer.full_name}</span>
                  <strong>₹{Number(order.total_amount).toFixed(2)}</strong>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </div>
  );
}

function SummaryCard({ label, value, warning }) {
  return (
    <div className={`summary-card ${warning ? 'warning' : ''}`}>
      <span>{label}</span>
      <strong>{value}</strong>
    </div>
  );
}
