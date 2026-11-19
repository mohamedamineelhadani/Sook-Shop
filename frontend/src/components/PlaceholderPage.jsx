import { Link } from 'react-router-dom';
import { ArrowRightIcon } from './Icons.jsx';

export default function PlaceholderPage({ title, subtitle, steps }) {
  return (
    <>
      <div className="page-head">
        <div className="container">
          <div className="crumbs">
            <Link to="/">Home</Link>
            <span className="sep">/</span>
            <span>{title}</span>
          </div>
          <h1>{title}</h1>
          <p>{subtitle}</p>
        </div>
      </div>

      <section className="section">
        <div className="container">
          <div className="placeholder-card">
            <span className="eyebrow">COMING IN A LATER STEP</span>
            <h2>We are building this page step by step</h2>
            <p>
              The layout and routing are ready. This page gets its real data and
              interactions when its feature step arrives.
            </p>
            <ul className="placeholder-list">
              {steps.map((step, index) => (
                <li key={step}>
                  <span className="step">STEP {index + 1}</span>
                  {step}
                </li>
              ))}
            </ul>
            <Link to="/shop" className="btn btn--indigo" style={{ marginTop: 'var(--s6)' }}>
              Browse the shop <ArrowRightIcon size={14} />
            </Link>
          </div>
        </div>
      </section>
    </>
  );
}
