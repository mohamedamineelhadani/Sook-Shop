import {
  DollarSign,
  Package,
  ShoppingCart,
  Users,
} from 'lucide-react';

import AdminPlaceholder from '../components/AdminPlaceholder.jsx';

const stats = [
  { label: 'Revenue (COD)', value: '$0', icon: DollarSign, tone: 'indigo' },
  { label: 'Orders', value: '0', icon: ShoppingCart, tone: 'green' },
  { label: 'Products', value: '0', icon: Package, tone: 'amber' },
  { label: 'Customers', value: '0', icon: Users, tone: 'purple' },
];

export function DashboardPage() {
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
        description="Charts and recent activity are added when the Orders and Products features are built."
        steps={[
          'Build dashboard summary endpoints in the API',
          'Show recent COD orders and low-stock alerts',
          'Add charts with real data from MongoDB',
        ]}
      />
    </>
  );
}

export function ProductsPage() {
  return (
    <AdminPlaceholder
      title="Product management"
      description="Create, edit, delete and search products. Stock, prices and images all live here."
      steps={[
        'Build the products CRUD API with image and category support',
        'Create the product table, search and filters in React',
        'Add the product form with validation and stock tracking',
      ]}
    />
  );
}

export function CategoriesPage() {
  return (
    <AdminPlaceholder
      title="Category management"
      description="Organise products into categories and subcategories shown in the shop filters."
      steps={[
        'Build the categories CRUD API',
        'Create the category tree table in React',
        'Connect categories to the storefront shop filters',
      ]}
    />
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
        'Build authentication and role-based access in the API',
        'Create the customers table in React',
        'Protect admin routes for admin accounts only',
      ]}
    />
  );
}

export function LoginPage() {
  return (
    <AdminPlaceholder
      title="Admin login"
      description="A secure login form will protect this panel in the Authentication step."
      steps={[
        'Build login, logout and JWT refresh endpoints',
        'Create the React login form and protected routes',
        'Seed the first admin account',
      ]}
    />
  );
}
