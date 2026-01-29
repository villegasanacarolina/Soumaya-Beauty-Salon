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
    <div className="min-h-screen bg-crema dark:bg-negro flex items-center justify-center px-4" style={{ paddingTop: '300px' }}>
      <div className="max-w-md w-full bg-white dark:bg-negro-claro rounded-2xl shadow-2xl p-8">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-alex-brush text-rosa mb-2">
            {isRegister ? 'Crear Cuenta' : 'Iniciar Sesión'}
          </h1>
          <p className="text-gris dark:text-gris-claro">
            {isRegister ? 'Regístrate para agendar tu cita' : 'Accede a tu cuenta'}
          </p>
        </div>

        {/* Error Message */}
        {error && (
          <div className="mb-6 p-4 bg-red-100 dark:bg-red-900/30 border border-red-400 dark:border-red-700 text-red-700 dark:text-red-400 rounded-lg">
            {error}
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Nombre Completo (solo en registro) */}
          {isRegister && (
            <div>
              <label className="block text-sm font-medium text-texto dark:text-crema mb-2">
                Nombre Completo
              </label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gris dark:text-gris-claro w-5 h-5" />
                <input
                  type="text"
                  value={nombreCompleto}
                  onChange={(e) => setNombreCompleto(e.target.value)}
                  className="w-full pl-12 pr-4 py-3 border-2 border-gris-claro dark:border-gris-oscuro rounded-lg focus:border-rosa focus:outline-none bg-white dark:bg-negro text-texto dark:text-crema"
                  placeholder="María García"
                  required={isRegister}
                />
              </div>
            </div>
          )}

          {/* Teléfono */}
          <div>
            <label className="block text-sm font-medium text-texto dark:text-crema mb-2">
              Teléfono
            </label>
            <div className="relative">
              <Phone className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gris dark:text-gris-claro w-5 h-5" />
              <input
                type="tel"
                value={telefono}
                onChange={(e) => setTelefono(e.target.value)}
                className="w-full pl-12 pr-4 py-3 border-2 border-gris-claro dark:border-gris-oscuro rounded-lg focus:border-rosa focus:outline-none bg-white dark:bg-negro text-texto dark:text-crema"
                placeholder="+52 555 123 4567"
                required
              />
            </div>
            <p className="mt-1 text-xs text-gris dark:text-gris-claro">
              Formato internacional: +52 seguido de tu número
            </p>
          </div>

          {/* Contraseña */}
          <div>
            <label className="block text-sm font-medium text-texto dark:text-crema mb-2">
              Contraseña
            </label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gris dark:text-gris-claro w-5 h-5" />
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full pl-12 pr-4 py-3 border-2 border-gris-claro dark:border-gris-oscuro rounded-lg focus:border-rosa focus:outline-none bg-white dark:bg-negro text-texto dark:text-crema"
                placeholder="••••••••"
                required
                minLength={6}
              />
            </div>
            {isRegister && (
              <p className="mt-1 text-xs text-gris dark:text-gris-claro">
                Mínimo 6 caracteres
              </p>
            )}
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            disabled={loading}
            className="w-full bg-rosa hover:bg-rosa-dark text-white font-semibold py-3 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
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
            className="text-rosa hover:underline"
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