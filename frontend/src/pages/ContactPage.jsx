import PlaceholderPage from '../components/PlaceholderPage.jsx';

export default function ContactPage() {
  return (
    <PlaceholderPage
      title="Contact us"
      subtitle="Store details and the contact form will be connected in a later step."
      steps={[
        'Add contact settings to the backend',
        'Build the contact form and validation',
        'Show order-tracking help for cash-on-delivery customers',
      ]}
    />
  );
}
