import React from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight } from 'lucide-react';

export default function PortalCard({
  to,
  icon: Icon,
  iconClass = 'client-icon',
  badgeText,
  badgeColor,
  title,
  description,
  actionText,
  isAdmin = false,
}) {
  return (
    <Link to={to} className={`portal-card ${isAdmin ? 'admin-type' : ''}`}>
      <div className={`portal-card-icon ${iconClass}`}>
        <Icon size={28} />
      </div>
      <span
        style={{
          fontSize: '0.75rem',
          color: badgeColor,
          fontWeight: 800,
          textTransform: 'uppercase',
          letterSpacing: '0.05em',
          marginBottom: '0.25rem',
        }}
      >
        {badgeText}
      </span>
      <h2 className="portal-card-title">{title}</h2>
      <p className="portal-card-desc">{description}</p>
      <div className="portal-card-action">
        <span>{actionText}</span>
        <ArrowRight size={18} />
      </div>
    </Link>
  );
}
