import PlaceholderPage from '../components/PlaceholderPage.jsx';

export default function CartPage() {
  return (
    <PlaceholderPage
      title="Your cart"
      subtitle="Cart lines, quantity controls and totals will appear here in the Cart step."
      steps={[
        'Build cart APIs for guests and signed-in customers',
        'Create a React cart context shared by the header and cart page',
        'Add the cash-on-delivery checkout with shipping details and order confirmation',
      ]}
    />
  );
}
