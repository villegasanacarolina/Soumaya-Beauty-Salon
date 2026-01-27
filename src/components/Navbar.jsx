import { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Menu, X, Sun, Moon, Home, Scissors, Image as ImageIcon, MapPin, Phone, LogIn, Calendar } from 'lucide-react';
import AnimatedLogo from './AnimatedLogo';
import './Navbar.css';
import { useTheme } from './theme-provider';

export default function Navbar() {
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const { theme, setTheme } = useTheme();
  const location = useLocation();

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 50);
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Cerrar menú al cambiar de ruta
  useEffect(() => {
    setIsMenuOpen(false);
  }, [location]);

  const toggleTheme = () => {
    setTheme(theme === 'dark' ? 'light' : 'dark');
  };

  const navLinks = [
    { to: '/', icon: Home, label: 'Inicio' },
    { to: '/servicios', icon: Scissors, label: 'Servicios' },
    { to: '/galeria', icon: ImageIcon, label: 'Galería' },
    { to: '/ubicaciones', icon: MapPin, label: 'Ubicación' },
    { to: '/contacto', icon: Phone, label: 'Contacto' },
    { to: '/login', icon: LogIn, label: 'Login' },
    { to: '/reservaciones', icon: Calendar, label: 'Reservaciones' },
  ];

  return (
    <>
      <nav className={`navbar ${isScrolled ? 'scrolled' : ''}`}>
        <div className="navbar-content">
          {!isScrolled && (
            <div className="logo-container">
              <AnimatedLogo />
            </div>
          )}

          <div className="navbar-controls">
            <button
              onClick={toggleTheme}
              className="theme-toggle"
              aria-label="Cambiar tema"
            >
              {theme === 'dark' ? <Sun size={24} /> : <Moon size={24} />}
            </button>

            <button
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              className="menu-button"
              aria-label="Abrir menú"
            >
              <Menu size={28} />
            </button>
          </div>
        </div>
      </nav>

      {/* Overlay */}
      {isMenuOpen && (
        <div 
          className="menu-overlay"
          onClick={() => setIsMenuOpen(false)}
        />
      )}

      {/* Panel del menú */}
      <div className={`menu-panel ${isMenuOpen ? 'open' : ''}`}>
        <div className="menu-header">
          <h2 className="menu-title">Menú</h2>
          <button
            onClick={() => setIsMenuOpen(false)}
            className="close-button"
            aria-label="Cerrar menú"
          >
            <X size={24} />
          </button>
        </div>

        <nav className="menu-nav">
          {navLinks.map((link) => {
            const Icon = link.icon;
            const isActive = location.pathname === link.to;

            return (
              <Link
                key={link.to}
                to={link.to}
                className={`menu-link ${isActive ? 'active' : ''}`}
              >
                <Icon className="menu-link-icon" />
                <span className="menu-link-text">{link.label}</span>
              </Link>
            );
          })}
        </nav>
      </div>
    </>
  );
}