import { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { Phone, Lock, User } from 'lucide-react';

const Login = () => {
  const [isRegister, setIsRegister] = useState(false);
  const [nombreCompleto, setNombreCompleto] = useState('');
  const [telefono, setTelefono] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const { login, register } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      let result;
      if (isRegister) {
        if (!nombreCompleto || !telefono || !password) {
          setError('Todos los campos son requeridos');
          setLoading(false);
          return;
        }
        if (password.length < 6) {
          setError('La contraseña debe tener al menos 6 caracteres');
          setLoading(false);
          return;
        }
        result = await register(nombreCompleto, telefono, password);
      } else {
        if (!telefono || !password) {
          setError('Teléfono y contraseña son requeridos');
          setLoading(false);
          return;
        }
        result = await login(telefono, password);
      }

      if (result.success) {
        navigate('/reservaciones');
      } else {
        setError(result.message || 'Error al procesar la solicitud');
      }
    } catch (err) {
      setError('Error de conexión. Intenta de nuevo.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center px-4" style={{ paddingTop: '300px' }}>
      <div className="max-w-md w-full bg-card rounded-2xl shadow-2xl p-8">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-alex-brush text-primary mb-2">
            {isRegister ? 'Crear Cuenta' : 'Iniciar Sesión'}
          </h1>
          <p className="text-muted-foreground">
            {isRegister ? 'Regístrate para agendar tu cita' : 'Accede a tu cuenta'}
          </p>
        </div>

        {/* Error Message */}
        {error && (
          <div className="mb-6 p-4 bg-destructive/10 border border-destructive text-destructive rounded-lg">
            {error}
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Nombre Completo (solo en registro) */}
          {isRegister && (
            <div>
              <label className="block text-sm font-medium text-foreground mb-2">
                Nombre Completo
              </label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-5 h-5" />
                <input
                  type="text"
                  value={nombreCompleto}
                  onChange={(e) => setNombreCompleto(e.target.value)}
                  className="w-full pl-12 pr-4 py-3 border-2 border-input rounded-lg focus:border-primary focus:outline-none bg-background text-foreground"
                  placeholder="María García"
                  required={isRegister}
                />
              </div>
            </div>
          )}

          {/* Teléfono */}
          <div>
            <label className="block text-sm font-medium text-foreground mb-2">
              Teléfono
            </label>
            <div className="relative">
              <Phone className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-5 h-5" />
              <input
                type="tel"
                value={telefono}
                onChange={(e) => setTelefono(e.target.value)}
                className="w-full pl-12 pr-4 py-3 border-2 border-input rounded-lg focus:border-primary focus:outline-none bg-background text-foreground"
                placeholder="+52 555 123 4567"
                required
              />
            </div>
            <p className="mt-1 text-xs text-muted-foreground">
              Formato internacional: +52 seguido de tu número
            </p>
          </div>

          {/* Contraseña */}
          <div>
            <label className="block text-sm font-medium text-foreground mb-2">
              Contraseña
            </label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-5 h-5" />
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full pl-12 pr-4 py-3 border-2 border-input rounded-lg focus:border-primary focus:outline-none bg-background text-foreground"
                placeholder="••••••••"
                required
                minLength={6}
              />
            </div>
            {isRegister && (
              <p className="mt-1 text-xs text-muted-foreground">
                Mínimo 6 caracteres
              </p>
            )}
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            disabled={loading}
            className="w-full bg-primary hover:bg-primary/90 text-white font-semibold py-3 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? 'Procesando...' : isRegister ? 'Registrarse' : 'Iniciar Sesión'}
          </button>
        </form>

        {/* Toggle Login/Register */}
        <div className="mt-6 text-center">
          <button
            onClick={() => {
              setIsRegister(!isRegister);
              setError('');
              setNombreCompleto('');
              setTelefono('');
              setPassword('');
            }}
            className="text-primary hover:underline"
          >
            {isRegister
              ? '¿Ya tienes cuenta? Inicia sesión'
              : '¿No tienes cuenta? Regístrate'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default Login;