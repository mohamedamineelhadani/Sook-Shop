import PlaceholderPage from '../components/PlaceholderPage.jsx';

export default function ShopPage() {
  return (
    <PlaceholderPage
      title="Shop all products"
      subtitle="Filters, sorting, categories and pagination are coming with the Products step."
      steps={[
        'Build GET /api/products with filtering, sorting and pagination',
        'Create the React product grid, sidebar filters and search results',
        'Add admin product management in the admin React app',
      ]}
    />
  );
}
