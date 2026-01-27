import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { ThemeProvider } from './components/theme-provider';
import { AuthProvider } from './contexts/AuthContext';
import Navbar from './components/Navbar';
import Home from './pages/Home';
import ServiciosIndex from './pages/ServiciosIndex';
import Galeria from './pages/Galeria';
import Ubicaciones from './pages/Ubicaciones';
import Contacto from './pages/Contacto';
import Login from './pages/Login';
import Reservaciones from './pages/Reservaciones';
import UnasGel from './pages/servicios/UnasGel';
import UnasAcrilicas from './pages/servicios/UnasAcrilicas';
import Pedicure from './pages/servicios/Pedicure';
import Keratina from './pages/servicios/Keratina';
import Tinte from './pages/servicios/Tinte';
import Pestanas from './pages/servicios/Pestanas';
import Cejas from './pages/servicios/Cejas';

function App() {
  return (
    <ThemeProvider defaultTheme="light" storageKey="soumaya-theme">
      <AuthProvider>
        <Router>
          <div className="min-h-screen bg-background text-foreground">
            <Navbar />
            <Routes>
              <Route path="/" element={<Home />} />
              <Route path="/login" element={<Login />} />
              <Route path="/reservaciones" element={<Reservaciones />} />
              <Route path="/servicios" element={<ServiciosIndex />} />
              <Route path="/servicios/unas-gel" element={<UnasGel />} />
              <Route path="/servicios/unas-acrilicas" element={<UnasAcrilicas />} />
              <Route path="/servicios/pedicure" element={<Pedicure />} />
              <Route path="/servicios/keratina" element={<Keratina />} />
              <Route path="/servicios/tinte" element={<Tinte />} />
              <Route path="/servicios/pestanas" element={<Pestanas />} />
              <Route path="/servicios/cejas" element={<Cejas />} />
              <Route path="/galeria" element={<Galeria />} />
              <Route path="/ubicaciones" element={<Ubicaciones />} />
              <Route path="/contacto" element={<Contacto />} />
            </Routes>
          </div>
        </Router>
      </AuthProvider>
    </ThemeProvider>
  );
}

export default App;