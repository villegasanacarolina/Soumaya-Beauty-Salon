import { Link } from 'react-router-dom';
import { ChevronRight, Home } from 'lucide-react';
import './Breadcrumb.css';

export default function Breadcrumb({ items }) {
  return (
    <nav className="breadcrumb" aria-label="Breadcrumb">
      <ol className="breadcrumb-list">
        <li className="breadcrumb-item">
          <Link to="/" className="breadcrumb-link">
            <Home className="w-4 h-4" />
            <span>Inicio</span>
          </Link>
        </li>
        
        {items.map((item, index) => (
          <li key={index} className="breadcrumb-item">
            <ChevronRight className="breadcrumb-separator w-4 h-4" />
            {item.href ? (
              <Link to={item.href} className="breadcrumb-link">
                {item.label}
              </Link>
            ) : (
              <span className="breadcrumb-current">{item.label}</span>
            )}
          </li>
        ))}
      </ol>
    </nav>
  );
}