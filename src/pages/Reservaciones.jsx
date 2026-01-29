import { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { ChevronLeft, ChevronRight, Calendar, Clock, LogOut } from 'lucide-react';

const API_URL = 'https://soumaya-beauty-salon.onrender.com';

const serviceDurations = {
  'unas-gel': { duracion: 60, nombre: 'Uñas de Gel', precio: 450 },
  'unas-acrilicas': { duracion: 90, nombre: 'Uñas Acrílicas', precio: 600 },
  'pedicure': { duracion: 90, nombre: 'Pedicure Premium', precio: 500 },
  'keratina': { duracion: 180, nombre: 'Tratamiento de Keratina', precio: 1200 },
  'tinte': { duracion: 180, nombre: 'Tinte Profesional', precio: 800 },
  'pestanas': { duracion: 60, nombre: 'Extensión de Pestañas', precio: 900 },
  'cejas': { duracion: 30, nombre: 'Diseño de Cejas', precio: 350 },
};

const Reservaciones = () => {
  const { user, token, logout, isAuthenticated } = useAuth();
  const navigate = useNavigate();

  const [currentWeekStart, setCurrentWeekStart] = useState(new Date());
  const [selectedService, setSelectedService] = useState('');
  const [reservas, setReservas] = useState([]);
  const [misReservas, setMisReservas] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!isAuthenticated) {
      navigate('/login');
    }
  }, [isAuthenticated, navigate]);

  useEffect(() => {
    if (selectedService) {
      cargarDisponibilidad();
    }
    cargarMisReservas();
  }, [currentWeekStart, selectedService]);

  const cargarDisponibilidad = async () => {
    try {
      const fechaISO = currentWeekStart.toISOString().split('T')[0];
      const response = await fetch(
        `${API_URL}/api/reservations/availability/${fechaISO}?servicio=${selectedService}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );
      const data = await response.json();
      setReservas(data);
    } catch (err) {
      console.error('Error cargando disponibilidad:', err);
    }
  };

  const cargarMisReservas = async () => {
    try {
      const response = await fetch(`${API_URL}/api/reservations/my-reservations`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      const data = await response.json();
      setMisReservas(data);
    } catch (err) {
      console.error('Error cargando mis reservas:', err);
    }
  };

  const generarHorarios = () => {
    const horarios = [];
    for (let h = 10; h < 20; h++) {
      for (let m = 0; m < 60; m += 30) {
        const hora = `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
        horarios.push(hora);
      }
    }
    return horarios;
  };

  const generarDiasSemana = () => {
    const dias = [];
    const inicio = new Date(currentWeekStart);
    inicio.setHours(0, 0, 0, 0);

    for (let i = 0; i < 7; i++) {
      const fecha = new Date(inicio);
      fecha.setDate(inicio.getDate() + i);
      dias.push(fecha);
    }
    return dias;
  };

  const estaOcupado = (fecha, hora) => {
    return reservas.some((reserva) => {
      const fechaReserva = new Date(reserva.fecha).toDateString();
      const fechaSeleccionada = fecha.toDateString();
      return (
        fechaReserva === fechaSeleccionada &&
        reserva.horaInicio <= hora &&
        reserva.horaFin > hora
      );
    });
  };

  const agendarCita = async (fecha, hora) => {
    if (!selectedService) {
      setError('Por favor selecciona un servicio primero');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const fechaISO = fecha.toISOString().split('T')[0];
      const response = await fetch(`${API_URL}/api/reservations`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          servicio: selectedService,
          fecha: fechaISO,
          horaInicio: hora,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message);
      }

      alert('¡Cita agendada exitosamente! Recibirás un mensaje de confirmación por WhatsApp.');
      cargarDisponibilidad();
      cargarMisReservas();
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const cambiarSemana = (direccion) => {
    const nuevaFecha = new Date(currentWeekStart);
    nuevaFecha.setDate(nuevaFecha.getDate() + direccion * 7);
    setCurrentWeekStart(nuevaFecha);
  };

  const cancelarReserva = async (reservaId) => {
    if (!confirm('¿Estás segura de que deseas cancelar esta cita?')) {
      return;
    }

    try {
      const response = await fetch(`${API_URL}/api/reservations/${reservaId}/cancel`, {
        method: 'PUT',
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (response.ok) {
        alert('Cita cancelada exitosamente');
        cargarMisReservas();
        cargarDisponibilidad();
      }
    } catch (err) {
      alert('Error al cancelar la cita');
    }
  };

  const horarios = generarHorarios();
  const diasSemana = generarDiasSemana();

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="bg-primary shadow-lg" style={{ marginTop: '300px' }}>
        <div className="container mx-auto px-4 py-6">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-3xl font-alex-brush text-white">Reservaciones</h1>
              <p className="text-white/80">Hola, {user?.nombreCompleto}</p>
            </div>
            <button
              onClick={logout}
              className="flex items-center gap-2 bg-white text-primary px-4 py-2 rounded-lg hover:bg-background transition-colors"
            >
              <LogOut className="w-4 h-4" />
              Cerrar Sesión
            </button>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8">
        {/* Selector de Servicio */}
        <div className="bg-card rounded-xl shadow-lg p-6 mb-8">
          <h2 className="text-2xl font-alex-brush text-primary mb-4">Selecciona un servicio</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {Object.entries(serviceDurations).map(([key, value]) => (
              <button
                key={key}
                onClick={() => setSelectedService(key)}
                className={`p-4 rounded-lg border-2 transition-all ${
                  selectedService === key
                    ? 'border-primary bg-primary/10'
                    : 'border-input hover:border-primary'
                }`}
              >
                <p className="font-semibold text-foreground">{value.nombre}</p>
                <p className="text-sm text-muted-foreground">${value.precio} MXN</p>
                <p className="text-xs text-muted-foreground">{value.duracion} min</p>
              </button>
            ))}
          </div>
        </div>

        {selectedService && (
          <>
            {/* Navegación de Semana */}
            <div className="bg-card rounded-xl shadow-lg p-6 mb-8">
              <div className="flex items-center justify-between mb-4">
                <button
                  onClick={() => cambiarSemana(-1)}
                  className="p-2 rounded-lg bg-primary text-white hover:bg-primary/90"
                >
                  <ChevronLeft className="w-6 h-6" />
                </button>
                <h3 className="text-xl font-semibold text-primary">
                  {currentWeekStart.toLocaleDateString('es-MX', { month: 'long', year: 'numeric' })}
                </h3>
                <button
                  onClick={() => cambiarSemana(1)}
                  className="p-2 rounded-lg bg-primary text-white hover:bg-primary/90"
                >
                  <ChevronRight className="w-6 h-6" />
                </button>
              </div>

              {error && (
                <div className="mb-4 p-4 bg-destructive/10 border border-destructive text-destructive rounded-lg">
                  {error}
                </div>
              )}

              {/* Calendario */}
              <div className="overflow-x-auto">
                <table className="w-full min-w-[800px]">
                  <thead>
                    <tr>
                      <th className="p-2 border border-border bg-muted">Hora</th>
                      {diasSemana.map((dia, idx) => (
                        <th key={idx} className="p-2 border border-border bg-muted">
                          <div className="text-sm text-foreground">
                            {dia.toLocaleDateString('es-MX', { weekday: 'short' })}
                          </div>
                          <div className="font-bold text-primary">{dia.getDate()}</div>
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {horarios.map((hora) => (
                      <tr key={hora}>
                        <td className="p-2 border border-border text-center font-semibold text-foreground bg-muted">
                          {hora}
                        </td>
                        {diasSemana.map((dia, idx) => {
                          const ocupado = estaOcupado(dia, hora);
                          const pasado = new Date(dia.toDateString() + ' ' + hora) < new Date();

                          return (
                            <td
                              key={idx}
                              className="p-2 border border-border"
                            >
                              <button
                                onClick={() => !ocupado && !pasado && agendarCita(dia, hora)}
                                disabled={ocupado || pasado || loading}
                                className={`w-full h-12 rounded transition-colors ${
                                  ocupado
                                    ? 'bg-primary cursor-not-allowed'
                                    : pasado
                                    ? 'bg-muted cursor-not-allowed'
                                    : 'bg-card hover:bg-primary/20 cursor-pointer border border-input'
                                }`}
                              >
                                {ocupado ? '🚫' : ''}
                              </button>
                            </td>
                          );
                        })}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <div className="mt-4 flex gap-4 text-sm text-foreground">
                <div className="flex items-center gap-2">
                  <div className="w-6 h-6 bg-card border border-input rounded"></div>
                  <span>Disponible</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-6 h-6 bg-primary rounded"></div>
                  <span>Ocupado</span>
                </div>
              </div>
            </div>
          </>
        )}

        {/* Mis Reservas */}
        <div className="bg-card rounded-xl shadow-lg p-6">
          <h2 className="text-2xl font-alex-brush text-primary mb-4">Mis Citas</h2>
          {misReservas.length === 0 ? (
            <p className="text-muted-foreground">No tienes citas agendadas</p>
          ) : (
            <div className="space-y-4">
              {misReservas.map((reserva) => (
                <div
                  key={reserva._id}
                  className="p-4 border-2 border-border rounded-lg bg-background"
                >
                  <div className="flex justify-between items-start">
                    <div>
                      <p className="font-semibold text-lg text-primary">
                        {serviceDurations[reserva.servicio]?.nombre}
                      </p>
                      <p className="text-foreground">
                        <Calendar className="inline w-4 h-4 mr-1" />
                        {new Date(reserva.fecha).toLocaleDateString('es-MX', {
                          weekday: 'long',
                          year: 'numeric',
                          month: 'long',
                          day: 'numeric',
                        })}
                      </p>
                      <p className="text-foreground">
                        <Clock className="inline w-4 h-4 mr-1" />
                        {reserva.horaInicio} - {reserva.horaFin}
                      </p>
                      <p className="text-sm text-muted-foreground mt-2">
                        Estado:{' '}
                        <span
                          className={
                            reserva.estado === 'confirmada' ? 'text-green-600' : 'text-red-600'
                          }
                        >
                          {reserva.estado}
                        </span>
                      </p>
                    </div>
                    {reserva.estado === 'confirmada' && (
                      <button
                        onClick={() => cancelarReserva(reserva._id)}
                        className="px-4 py-2 bg-destructive text-destructive-foreground rounded-lg hover:bg-destructive/90 transition-colors"
                      >
                        Cancelar
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Reservaciones;