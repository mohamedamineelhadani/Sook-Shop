import PlaceholderPage from '../components/PlaceholderPage.jsx';

export default function HomePage() {
  return (
    <PlaceholderPage
      title="Welcome to Sookshop"
      subtitle="Your new tech & gadgets store — with cash on delivery on every order."
      steps={[
        'Convert the Sprylo template hero, banners and product cards into React components',
        'Load featured products and categories from the Sookshop API',
        'Make search, tabs and quick-add-to-cart work end to end',
      ]}
    />
  );
}
