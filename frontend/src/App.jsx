import { Route, Routes } from 'react-router-dom';

import StoreLayout from './layouts/StoreLayout.jsx';
import CartPage from './pages/CartPage.jsx';
import ContactPage from './pages/ContactPage.jsx';
import {
  LoginPage,
  NotFoundPage,
  OrdersPage,
  WishlistPage,
} from './pages/ExtraPages.jsx';
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
        <Route path="login" element={<LoginPage />} />
        <Route path="wishlist" element={<WishlistPage />} />
        <Route path="orders" element={<OrdersPage />} />
        <Route path="*" element={<NotFoundPage />} />
      </Route>
    </Routes>
  );
}
