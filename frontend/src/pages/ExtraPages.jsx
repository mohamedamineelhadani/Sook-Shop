import PlaceholderPage from '../components/PlaceholderPage.jsx';

export function WishlistPage() {
  return (
    <PlaceholderPage
      title="Wishlist"
      subtitle="Saved products arrive with the Wishlist step."
      steps={[
        'Add wishlist endpoints to the API',
        'Wire the heart buttons in the product cards',
        'Show saved items with quick add-to-cart',
      ]}
    />
  );
}

export function OrdersPage() {
  return (
    <PlaceholderPage
      title="My orders"
      subtitle="Cash-on-delivery order history arrives with the Orders step."
      steps={[
        'Build the order creation and order history APIs',
        'Create the checkout flow in the storefront',
        'Let admins manage order status in the admin panel',
      ]}
    />
  );
}

export function NotFoundPage() {
  return (
    <PlaceholderPage
      title="Page not found"
      subtitle="That page does not exist in Sookshop."
      steps={[
        'Check the URL and try again',
        'Head back to the shop to browse products',
      ]}
    />
  );
}
