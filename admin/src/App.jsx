import { Route, Routes } from 'react-router-dom';

import RequireAdmin from './components/RequireAdmin.jsx';
import AdminLayout from './layouts/AdminLayout.jsx';
import { DashboardPage, OrdersPage, UsersPage } from './pages/AdminPages.jsx';
import AdminLoginPage from './pages/AdminLoginPage.jsx';
import CategoriesPage from './pages/CategoriesPage.jsx';
import InsightsPage from './pages/InsightsPage.jsx';
import ProductsPage from './pages/ProductsPage.jsx';

export default function App() {
  return (
    <Routes>
      <Route path="/login" element={<AdminLoginPage />} />
      <Route
        element={
          <RequireAdmin>
            <AdminLayout />
          </RequireAdmin>
        }
      >
        <Route index element={<DashboardPage />} />
        <Route path="products" element={<ProductsPage />} />
        <Route path="categories" element={<CategoriesPage />} />
        <Route path="insights" element={<InsightsPage />} />
        <Route path="orders" element={<OrdersPage />} />
        <Route path="users" element={<UsersPage />} />
        <Route path="*" element={<DashboardPage />} />
      </Route>
    </Routes>
  );
}
