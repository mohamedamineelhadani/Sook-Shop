import { Link } from 'react-router-dom';

import { ArrowRightIcon } from '../components/Icons.jsx';

function InfoPage({ title, intro, children, aside }) {
  return (
    <>
      <section className="page-head">
        <div className="container">
          <div className="crumbs">
            <Link to="/">Home</Link>
            <span className="sep">/</span>
            <span>{title}</span>
          </div>
          <h1>{title}</h1>
          <p>{intro}</p>
        </div>
      </section>

      <section className="section">
        <div className="container">
          <div className="info-layout">
            <article className="info-card">{children}</article>
            <aside className="info-aside">
              <span className="eyebrow">NEED A HAND?</span>
              <h3>We are one message away</h3>
              <p>
                Our support inbox is open for order questions, delivery help and product advice.
              </p>
              <Link to="/contact" className="btn btn--indigo">
                Contact us <ArrowRightIcon size={14} />
              </Link>
              {aside}
            </aside>
          </div>
        </div>
      </section>
    </>
  );
}

function InfoSection({ title, children }) {
  return (
    <section className="info-section">
      <h2>{title}</h2>
      {children}
    </section>
  );
}

export function AboutPage() {
  return (
    <InfoPage
      title="About us"
      intro="Sookshop is a modern tech store for people who want good gear without complicated payments."
    >
      <InfoSection title="What we do">
        <p>
          We curate smartphones, laptops, watches, cameras, audio and gaming products from brands
          people trust. Every listing shows the price, stock and delivery information up front so
          you can shop with confidence.
        </p>
      </InfoSection>
      <InfoSection title="Cash on delivery, always">
        <p>
          Every order is paid in cash when it arrives. There is no card gateway, no saved card and
          no online payment step. The price you see at checkout is the price you pay the delivery
          driver.
        </p>
      </InfoSection>
      <InfoSection title="Built for support">
        <p>
          You can track orders from your account, read our shipping rules, and send questions
          through the contact page. We keep the process simple and transparent from cart to
          doorstep.
        </p>
        <Link to="/shop" className="info-inline-link">
          Browse all products <ArrowRightIcon size={14} />
        </Link>
      </InfoSection>
    </InfoPage>
  );
}

export function ShippingPolicyPage() {
  return (
    <InfoPage
      title="Shipping policy"
      intro="Clear delivery rules for every cash-on-delivery order."
    >
      <InfoSection title="Shipping fee">
        <p>
          Standard shipping is <strong>$10</strong> per order. Shipping is <strong>free</strong> when
          your order subtotal is <strong>$200 or more</strong>. The rule is calculated on the server
          at checkout, so the total you see is final.
        </p>
      </InfoSection>
      <InfoSection title="Order processing">
        <ul>
          <li>Orders are prepared after they are placed and stock is reserved immediately.</li>
          <li>You will receive an order number that can be tracked from your account.</li>
          <li>Stock is returned to the store if an order is cancelled before it ships.</li>
        </ul>
      </InfoSection>
      <InfoSection title="Cash on delivery">
        <p>
          Please have the exact order total ready when the driver arrives. Payment is collected in
          cash only. If nobody is available to receive and pay for the order, delivery may be
          attempted again or the order may be cancelled.
        </p>
      </InfoSection>
      <InfoSection title="Delivery problems">
        <p>
          If your parcel is late, damaged, or the amount charged does not match your order total,
          contact us with your order number. See the <Link to="/faqs">FAQs</Link> for quick answers.
        </p>
      </InfoSection>
    </InfoPage>
  );
}

export function HelpCentrePage() {
  const topics = [
    {
      title: 'Track an order',
      text: 'Open your account to see current status, items and the cash total for every order.',
      to: '/orders',
      action: 'View my orders',
    },
    {
      title: 'Delivery & shipping',
      text: 'Learn about the $10 fee, free shipping over $200 and what happens on delivery day.',
      to: '/shipping-policy',
      action: 'Read shipping policy',
    },
    {
      title: 'Frequently asked questions',
      text: 'Find short answers about cash on delivery, returns, newsletter signups and more.',
      to: '/faqs',
      action: 'See FAQs',
    },
    {
      title: 'Talk to a human',
      text: 'Send our team a message and we will save it in the support inbox for a reply.',
      to: '/contact',
      action: 'Contact support',
    },
  ];

  return (
    <InfoPage
      title="Help centre"
      intro="Pick a topic below or send us a message — we are happy to help."
    >
      <div className="help-grid">
        {topics.map((topic) => (
          <Link key={topic.title} to={topic.to} className="help-card">
            <h3>{topic.title}</h3>
            <p>{topic.text}</p>
            <span>
              {topic.action} <ArrowRightIcon size={14} />
            </span>
          </Link>
        ))}
      </div>
      <InfoSection title="Before you contact us">
        <p>
          Having your order number ready helps us answer faster. You can find it on your order
          history page or in your confirmation details.
        </p>
      </InfoSection>
    </InfoPage>
  );
}

export function FaqsPage() {
  const faqs = [
    {
      question: 'How do I pay for my order?',
      answer:
        'You pay in cash when your order arrives. We do not accept cards online or on delivery in this demo store.',
    },
    {
      question: 'How much is shipping?',
      answer:
        'Shipping is $10. Orders with a subtotal of $200 or more ship for free. The final amount is shown at checkout before you confirm.',
    },
    {
      question: 'Can I track my order?',
      answer:
        'Yes. Sign in and open My orders to see the status, items and delivery address for each order.',
    },
    {
      question: 'Can I cancel or change an order?',
      answer:
        'Contact us as soon as possible with your order number. We can help while the order is still pending or confirmed; once it ships, changes are limited.',
    },
    {
      question: 'What if a product is out of stock?',
      answer:
        'Stock is checked when you place an order. If an item becomes unavailable, we will contact you about replacing or cancelling that item.',
    },
    {
      question: 'How does the 20% newsletter offer work?',
      answer:
        'The home page form saves your email in our store list so the team can see signups in the admin panel. This demo does not send any emails.',
    },
    {
      question: 'How do I get help with a delivery?',
      answer:
        'Use the contact page and include your order number and phone number. We read every message in the admin inbox.',
    },
  ];

  return (
    <InfoPage title="FAQs" intro="Quick answers to the questions we hear most often.">
      <div className="faq-list">
        {faqs.map((faq) => (
          <details className="faq-item" key={faq.question}>
            <summary>{faq.question}</summary>
            <p>{faq.answer}</p>
          </details>
        ))}
      </div>
    </InfoPage>
  );
}

export function TermsPage() {
  return (
    <InfoPage
      title="Terms & conditions"
      intro="The basic rules for shopping on Sookshop."
    >
      <InfoSection title="Orders and pricing">
        <p>
          Product prices are shown in USD and are confirmed again on the checkout page. Orders are
          subject to stock availability. We may cancel an order if an item becomes unavailable
          after it is placed, and any reserved stock will be released.
        </p>
      </InfoSection>
      <InfoSection title="Cash on delivery">
        <p>
          Payment is due in cash at the moment of delivery. Shipping is $10, or free when the order
          subtotal reaches $200. The delivery address and phone number you provide must be accurate
          so the driver can reach you.
        </p>
      </InfoSection>
      <InfoSection title="Cancellations and returns">
        <p>
          Contact us before an order ships if you need to cancel or change it. For damaged or
          incorrect items, contact us with your order number as soon as the parcel arrives so we
          can arrange a replacement or refund.
        </p>
      </InfoSection>
      <InfoSection title="Account responsibility">
        <p>
          Keep your login details private. You are responsible for activity that happens under your
          account, including orders placed from it.
        </p>
      </InfoSection>
      <InfoSection title="Changes to these terms">
        <p>
          We may update these terms as the store grows. The version shown on this page is the one
          that applies to your current visit.
        </p>
      </InfoSection>
    </InfoPage>
  );
}

export function PrivacyPage() {
  return (
    <InfoPage
      title="Privacy policy"
      intro="What this demo store saves, and what it never asks for."
    >
      <InfoSection title="Information we store">
        <ul>
          <li>Account details such as your name, email and delivery address when you register.</li>
          <li>Orders, cart and wishlist items linked to your account.</li>
          <li>Messages you send through the <Link to="/contact">contact form</Link>.</li>
          <li>Email addresses submitted through the home page newsletter form.</li>
          <li>Product reviews you choose to publish.</li>
        </ul>
      </InfoSection>
      <InfoSection title="No card details">
        <p>
          We do not operate a card gateway and we never ask for card numbers. All orders are cash on
          delivery, so no payment card information is collected or stored by this store.
        </p>
      </InfoSection>
      <InfoSection title="How we use your information">
        <p>
          Information is used to run the store: process orders, show your order history, reply to
          support messages and let administrators see signups. Newsletter emails are stored in the
          admin panel only — this demo does not send marketing emails.
        </p>
      </InfoSection>
      <InfoSection title="Your choices">
        <p>
          You can edit your account details, remove saved reviews, and ask us to remove a contact
          message or newsletter email by using the contact page. In a production store you would
          also get a one-click unsubscribe link.
        </p>
      </InfoSection>
      <InfoSection title="Contact">
        <p>
          Questions about privacy? Send a message through the contact page and include “Privacy”
          in the subject.
        </p>
      </InfoSection>
    </InfoPage>
  );
}
