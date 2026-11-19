import { ArrowRight, Hammer } from 'lucide-react';
import { Link } from 'react-router-dom';

export default function AdminPlaceholder({ title, description, steps }) {
  return (
    <section className="admin-card admin-placeholder">
      <span className="admin-eyebrow">
        <Hammer size={13} /> COMING IN A LATER STEP
      </span>
      <h2>{title}</h2>
      <p>{description}</p>
      <ul className="admin-step-list">
        {steps.map((step, index) => (
          <li key={step}>
            <span>STEP {index + 1}</span>
            {step}
          </li>
        ))}
      </ul>
      <Link to="/products" className="admin-button">
        Go to products <ArrowRight size={14} />
      </Link>
    </section>
  );
}
