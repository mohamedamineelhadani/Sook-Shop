import { useEffect, useState } from 'react';
import { Package, ShoppingCart, Tags, Users } from 'lucide-react';

import { getCategories, getProducts } from '../api/catalog.js';
import AdminPlaceholder from '../components/AdminPlaceholder.jsx';

export function DashboardPage() {
  const [counts, setCounts] = useState({ products: 0, categories: 0 });

  useEffect(() => {
    let alive = true;
    Promise.all([getProducts({ limit: 1 }), getCategories()])
      .then(([products, categories]) => {
        if (!alive) return;
        setCounts({
          products: products.pagination?.total || 0,
          categories: categories.data.length,
        });
      })
      .catch(() => {});
    return () => {
      alive = false;
    };
  }, []);

  const stats = [
    { label: 'Products', value: counts.products, icon: Package, tone: 'amber' },
    { label: 'Categories', value: counts.categories, icon: Tags, tone: 'indigo' },
    { label: 'Orders (COD)', value: 0, icon: ShoppingCart, tone: 'green' },
    { label: 'Customers', value: 0, icon: Users, tone: 'purple' },
  ];

  return (
    <>
      <div className="admin-page-head">
        <div>
          <h2>Store overview</h2>
          <p>Your Sookshop numbers will appear here as each feature is connected.</p>
        </div>
        <span className="admin-pill">Cash on delivery only</span>
      </div>

      <div className="admin-stats">
        {stats.map(({ label, value, icon: Icon, tone }) => (
          <div className="admin-stat" key={label}>
            <span className={`admin-stat-icon tone-${tone}`}>
              <Icon size={19} />
            </span>
            <div>
              <span className="admin-stat-label">{label}</span>
              <strong>{value}</strong>
            </div>
          </div>
        ))}
      </div>

      <AdminPlaceholder
        title="Live dashboard"
        description="Charts and recent activity are added when the Orders and Customers features are built."
        steps={[
          'Build dashboard summary endpoints in the API',
          'Show recent COD orders and low-stock alerts',
          'Add charts with real data from MongoDB',
        ]}
      />
    </>
  );
}

export function OrdersPage() {
  return (
    <AdminPlaceholder
      title="Order management"
      description="Review cash-on-delivery orders and move them through confirmed → shipped → delivered."
      steps={[
        'Build order listing and status update endpoints',
        'Create the orders table with details drawer',
        'Show live order counts on the dashboard',
      ]}
    />
  );
}

export function UsersPage() {
  return (
    <AdminPlaceholder
      title="Customer management"
      description="View registered customers and their order history. Admin accounts are managed here too."
      steps={[
        'Create the customers table with order history',
        'Add account status controls',
        'Show live customer counts on the dashboard',
      ]}
    />
  );
}
