import { Route, Routes } from 'react-router-dom';

import AdminLayout from './layouts/AdminLayout.jsx';
import {
  CategoriesPage,
  DashboardPage,
  LoginPage,
  OrdersPage,
  ProductsPage,
  UsersPage,
} from './pages/AdminPages.jsx';

export default function App() {
  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      <Route element={<AdminLayout />}>
        <Route index element={<DashboardPage />} />
        <Route path="products" element={<ProductsPage />} />
        <Route path="categories" element={<CategoriesPage />} />
        <Route path="orders" element={<OrdersPage />} />
        <Route path="users" element={<UsersPage />} />
        <Route path="*" element={<DashboardPage />} />
      </Route>
    </Routes>
  );
}
