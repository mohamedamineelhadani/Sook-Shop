import { useState } from 'react';
import { Link } from 'react-router-dom';

import { sendContactMessage } from '../api/contact.js';
import { useAuth } from '../hooks/useAuth.js';

const emptyForm = { name: '', email: '', subject: 'Order help', message: '' };

export default function ContactPage() {
  const { user } = useAuth();
  const [form, setForm] = useState(() => ({
    ...emptyForm,
    name: user?.name || '',
    email: user?.email || '',
  }));
  const [status, setStatus] = useState('idle');
  const [feedback, setFeedback] = useState('');

  const setField = (key, value) => setForm((current) => ({ ...current, [key]: value }));

  const submit = async (event) => {
    event.preventDefault();
    setStatus('sending');
    setFeedback('');
    try {
      const result = await sendContactMessage(form);
      setStatus('sent');
      setFeedback(result.message || 'Thanks — your message is saved.');
      setForm({ ...emptyForm, name: user?.name || '', email: user?.email || '' });
    } catch (err) {
      setStatus('error');
      setFeedback(err.message);
    }
  };

  return (
    <>
      <section className="page-head">
        <div className="container">
          <div className="crumbs">
            <Link to="/">Home</Link>
            <span className="sep">/</span>
            <span>Contact us</span>
          </div>
          <h1>Contact us</h1>
          <p>Questions about an order, a product, or cash on delivery? Send us a message.</p>
        </div>
      </section>

      <section className="container">
        <div className="contact-grid">
          <div className="contact-info">
            <h2>We are here to help</h2>
            <p className="contact-intro">
              Our team reads every message in the admin inbox. We usually reply within one business
              day.
            </p>

            <div className="info-block">
              <span className="ic" aria-hidden="true">✉</span>
              <div>
                <span className="label">Email us</span>
                <span className="value">support@sookshop.com</span>
              </div>
            </div>
            <div className="info-block">
              <span className="ic" aria-hidden="true">☎</span>
              <div>
                <span className="label">Call / WhatsApp</span>
                <span className="value">+1 555 010 2030</span>
              </div>
            </div>
            <div className="info-block">
              <span className="ic" aria-hidden="true">⌂</span>
              <div>
                <span className="label">Visit us</span>
                <span className="value">12 Demo Street, Cairo, Egypt</span>
              </div>
            </div>
            <div className="info-block">
              <span className="ic" aria-hidden="true">◷</span>
              <div>
                <span className="label">Support hours</span>
                <span className="value">Saturday – Friday · 9am – 6pm</span>
              </div>
            </div>

            <div className="contact-note">
              <strong>Cash on delivery only.</strong> Never share card details with anyone claiming
              to be from Sookshop.
            </div>

            <div className="account-links">
              <Link to="/orders">Track an order →</Link>
              <Link to="/shipping-policy">Read the shipping policy →</Link>
              <Link to="/faqs">Browse common questions →</Link>
            </div>
          </div>

          <div className="contact-form">
            <h2>Send us a message</h2>
            <p className="contact-intro">Fill in the form and we will save it to our support inbox.</p>

            {feedback && (
              <div className={`contact-feedback is-${status}`} role="status" aria-live="polite">
                {feedback}
              </div>
            )}

            <form onSubmit={submit}>
              <div className="field-row">
                <div className="field">
                  <label htmlFor="contact-name">Your name</label>
                  <input
                    id="contact-name"
                    value={form.name}
                    onChange={(event) => setField('name', event.target.value)}
                    placeholder="Ahmed Ali"
                    minLength="2"
                    maxLength="80"
                    required
                  />
                </div>
                <div className="field">
                  <label htmlFor="contact-email">Email address</label>
                  <input
                    id="contact-email"
                    type="email"
                    value={form.email}
                    onChange={(event) => setField('email', event.target.value)}
                    placeholder="you@example.com"
                    required
                  />
                </div>
              </div>

              <div className="field">
                <label htmlFor="contact-subject">What is this about?</label>
                <select
                  id="contact-subject"
                  value={form.subject}
                  onChange={(event) => setField('subject', event.target.value)}
                >
                  <option value="Order help">Order help</option>
                  <option value="Delivery & shipping">Delivery &amp; shipping</option>
                  <option value="Returns & exchanges">Returns &amp; exchanges</option>
                  <option value="Product question">Product question</option>
                  <option value="Something else">Something else</option>
                </select>
              </div>

              <div className="field">
                <label htmlFor="contact-message">Your message</label>
                <textarea
                  id="contact-message"
                  value={form.message}
                  onChange={(event) => setField('message', event.target.value)}
                  placeholder="Tell us how we can help…"
                  minLength="10"
                  maxLength="2000"
                  required
                />
              </div>

              <button className="btn btn--indigo" type="submit" disabled={status === 'sending'}>
                {status === 'sending' ? 'Sending…' : 'Send message →'}
              </button>
            </form>

            <p className="contact-note">
              We store your message and email so our team can reply. No email is sent from this
              demo store.
            </p>
          </div>
        </div>
      </section>
    </>
  );
}
