import PlaceholderPage from '../components/PlaceholderPage.jsx';

export default function ProductPage() {
  return (
    <PlaceholderPage
      title="Product details"
      subtitle="Gallery, options, stock and the add-to-cart button arrive in the Products step."
      steps={[
        'Build GET /api/products/:slug with product details and related items',
        'Convert the product detail template into a React page',
        'Wire quantity selection and add-to-cart to the cart store',
      ]}
    />
  );
}
