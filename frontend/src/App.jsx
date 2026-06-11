import { useCallback, useEffect, useState } from 'react';
import { api } from './api.js';
import Dashboard from './components/Dashboard.jsx';
import Products from './components/Products.jsx';
import Customers from './components/Customers.jsx';
import Orders from './components/Orders.jsx';

const tabs = [
  { id: 'dashboard', label: 'Dashboard' },
  { id: 'products', label: 'Products' },
  { id: 'customers', label: 'Customers' },
  { id: 'orders', label: 'Orders' },
];

export default function App() {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [summary, setSummary] = useState(null);
  const [products, setProducts] = useState([]);
  const [customers, setCustomers] = useState([]);
  const [orders, setOrders] = useState([]);
  const [message, setMessage] = useState({ type: '', text: '' });
  const [loading, setLoading] = useState(false);

  const showMessage = (type, text) => {
    setMessage({ type, text });
    window.setTimeout(() => setMessage({ type: '', text: '' }), 4000);
  };

  const loadAll = useCallback(async () => {
    setLoading(true);
    try {
      const [summaryData, productsData, customersData, ordersData] = await Promise.all([
        api.getSummary(),
        api.getProducts(),
        api.getCustomers(),
        api.getOrders(),
      ]);
      setSummary(summaryData);
      setProducts(productsData);
      setCustomers(customersData);
      setOrders(ordersData);
    } catch (error) {
      showMessage('error', error.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadAll();
  }, [loadAll]);

  const handleAction = async (action, successMessage) => {
    try {
      await action();
      await loadAll();
      showMessage('success', successMessage);
    } catch (error) {
      showMessage('error', error.message);
    }
  };

  return (
    <main className="app-shell">
      <header className="hero">
        <div>
          <p className="eyebrow">Production-ready assessment project</p>
          <h1>Inventory & Order Management</h1>
          <p className="hero-text">
            Manage products, customers, orders, and stock validation from one responsive dashboard.
          </p>
          <p className="api-pill">API: {api.baseUrl}</p>
        </div>
      </header>

      <nav className="tabs" aria-label="Main navigation">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            className={activeTab === tab.id ? 'active' : ''}
            onClick={() => setActiveTab(tab.id)}
          >
            {tab.label}
          </button>
        ))}
      </nav>

      {message.text && <div className={`alert ${message.type}`}>{message.text}</div>}
      {loading && <div className="loading-bar" />}

      <section className="content-panel">
        {activeTab === 'dashboard' && <Dashboard summary={summary} products={products} orders={orders} />}
        {activeTab === 'products' && (
          <Products
            products={products}
            onCreate={(payload) => handleAction(() => api.createProduct(payload), 'Product added successfully')}
            onUpdate={(id, payload) => handleAction(() => api.updateProduct(id, payload), 'Product updated successfully')}
            onDelete={(id) => handleAction(() => api.deleteProduct(id), 'Product deleted successfully')}
          />
        )}
        {activeTab === 'customers' && (
          <Customers
            customers={customers}
            onCreate={(payload) => handleAction(() => api.createCustomer(payload), 'Customer added successfully')}
            onDelete={(id) => handleAction(() => api.deleteCustomer(id), 'Customer deleted successfully')}
          />
        )}
        {activeTab === 'orders' && (
          <Orders
            orders={orders}
            customers={customers}
            products={products}
            onCreate={(payload) => handleAction(() => api.createOrder(payload), 'Order placed and stock reduced successfully')}
            onCancel={(id) => handleAction(() => api.cancelOrder(id), 'Order cancelled and stock restored')}
          />
        )}
      </section>
    </main>
  );
}
