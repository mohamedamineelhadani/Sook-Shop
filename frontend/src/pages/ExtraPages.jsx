import PlaceholderPage from '../components/PlaceholderPage.jsx';

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
