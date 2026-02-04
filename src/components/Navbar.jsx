import { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Menu, X, Sun, Moon, Home, Scissors, Image as ImageIcon, MapPin, Phone, LogIn, Calendar, User } from 'lucide-react';
import AnimatedLogo from './AnimatedLogo';
import './Navbar.css';
import { useTheme } from './theme-provider';
import { useAuth } from '../contexts/AuthContext';

export default function Navbar() {
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const { theme, setTheme } = useTheme();
  const { user, logout } = useAuth();
  const location = useLocation();

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 50);
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

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
  ];

  // Si el usuario está autenticado, mostrar Reservaciones en lugar de Login
  if (user) {
    navLinks.push({ to: '/reservaciones', icon: Calendar, label: 'Reservaciones' });
  }

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
            {/* Botón de Login/Usuario */}
            <div className="flex items-center gap-4">
              {user ? (
                <div className="flex items-center gap-2">
                  <User className="w-5 h-5 text-primary" />
                  <span className="text-sm text-foreground hidden md:inline">
                    {user.nombreCompleto?.split(' ')[0]}
                  </span>
                  <button
                    onClick={logout}
                    className="px-3 py-1.5 bg-primary text-white text-sm rounded-lg hover:bg-primary/90 transition-colors"
                  >
                    Cerrar Sesión
                  </button>
                </div>
              ) : (
                <Link
                  to="/login"
                  className="flex items-center gap-2 px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary/90 transition-colors"
                >
                  <LogIn className="w-5 h-5" />
                  <span className="hidden md:inline">Login</span>
                </Link>
              )}

              {/* Toggle de tema */}
              <button
                onClick={toggleTheme}
                className="theme-toggle"
                aria-label="Cambiar tema"
              >
                {theme === 'dark' ? <Sun size={24} /> : <Moon size={24} />}
              </button>
            </div>

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
          
          {/* Enlace de Login/Logout en el menú móvil */}
          {user ? (
            <button
              onClick={logout}
              className="menu-link"
            >
              <LogIn className="menu-link-icon" />
              <span className="menu-link-text">Cerrar Sesión</span>
            </button>
          ) : (
            <Link
              to="/login"
              className={`menu-link ${location.pathname === '/login' ? 'active' : ''}`}
            >
              <LogIn className="menu-link-icon" />
              <span className="menu-link-text">Login</span>
            </Link>
          )}
        </nav>
      </div>
    </>
  );
}