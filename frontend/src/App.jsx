import { Route, Routes } from 'react-router-dom';

import RequireAuth from './components/RequireAuth.jsx';
import StoreLayout from './layouts/StoreLayout.jsx';
import AccountPage from './pages/AccountPage.jsx';
import AuthPage from './pages/AuthPage.jsx';
import CartPage from './pages/CartPage.jsx';
import ContactPage from './pages/ContactPage.jsx';
import { NotFoundPage, OrdersPage, WishlistPage } from './pages/ExtraPages.jsx';
import HomePage from './pages/HomePage.jsx';
import ProductPage from './pages/ProductPage.jsx';
import ShopPage from './pages/ShopPage.jsx';

export default function App() {
  return (
    <Routes>
      <Route element={<StoreLayout />}>
        <Route index element={<HomePage />} />
        <Route path="shop" element={<ShopPage />} />
        <Route path="products/:slug" element={<ProductPage />} />
        <Route path="cart" element={<CartPage />} />
        <Route path="contact" element={<ContactPage />} />
        <Route path="login" element={<AuthPage />} />
        <Route
          path="account"
          element={
            <RequireAuth>
              <AccountPage />
            </RequireAuth>
          }
        />
        <Route
          path="wishlist"
          element={
            <RequireAuth>
              <WishlistPage />
            </RequireAuth>
          }
        />
        <Route
          path="orders"
          element={
            <RequireAuth>
              <OrdersPage />
            </RequireAuth>
          }
        />
        <Route path="*" element={<NotFoundPage />} />
      </Route>
    </Routes>
  );
}
