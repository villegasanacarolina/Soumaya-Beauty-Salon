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

  // Función para formatear fecha a YYYY-MM-DD con hora específica para el backend
  const formatDateForBackend = (fecha, hora) => {
    // Crear una nueva fecha con la hora específica en zona horaria local
    const [horas, minutos] = hora.split(':').map(Number);
    const fechaConHora = new Date(fecha);
    fechaConHora.setHours(horas, minutos, 0, 0);
    
    // Para el backend, enviar como ISO string completo (incluye zona horaria)
    // O como fecha local formateada
    return {
      iso: fechaConHora.toISOString(), // Para debugging
      fechaLocal: `${fechaConHora.getFullYear()}-${String(fechaConHora.getMonth() + 1).padStart(2, '0')}-${String(fechaConHora.getDate()).padStart(2, '0')}`,
      // Alternativa: agregar un día si el backend está en UTC
      fechaUTC: `${fechaConHora.getUTCFullYear()}-${String(fechaConHora.getUTCMonth() + 1).padStart(2, '0')}-${String(fechaConHora.getUTCDate()).padStart(2, '0')}`
    };
  };

  const cargarDisponibilidad = async () => {
    try {
      // Enviar fecha actual en formato local
      const hoy = new Date();
      const fechaISO = `${hoy.getFullYear()}-${String(hoy.getMonth() + 1).padStart(2, '0')}-${String(hoy.getDate()).padStart(2, '0')}`;
      
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
    // Obtener el lunes de la semana actual
    const hoy = new Date();
    hoy.setHours(0, 0, 0, 0);
    const lunes = new Date(hoy);
    const diaSemana = lunes.getDay();
    const diff = lunes.getDate() - diaSemana + (diaSemana === 0 ? -6 : 1); // Ajustar cuando es domingo
    lunes.setDate(diff);
    
    for (let i = 0; i < 7; i++) {
      const fecha = new Date(lunes);
      fecha.setDate(lunes.getDate() + i);
      dias.push(fecha);
    }
    
    return dias;
  };

  const estaOcupado = (fecha, hora) => {
    return reservas.some((reserva) => {
      // Convertir fecha de reserva a objeto Date
      const fechaReserva = new Date(reserva.fecha);
      // Comparar solo día, mes y año (ignorar hora)
      const fechaSeleccionada = new Date(fecha);
      
      const mismoDia = fechaReserva.getFullYear() === fechaSeleccionada.getFullYear() &&
                      fechaReserva.getMonth() === fechaSeleccionada.getMonth() &&
                      fechaReserva.getDate() === fechaSeleccionada.getDate();
      
      return mismoDia && reserva.horaInicio <= hora && reserva.horaFin > hora;
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
      // SOLUCIÓN: Crear la fecha en hora local y convertir a UTC para el backend
      const fechaSeleccionada = new Date(fecha);
      const [horasSeleccionadas, minutosSeleccionados] = hora.split(':').map(Number);
      
      // Crear fecha local exacta
      const fechaLocal = new Date(
        fechaSeleccionada.getFullYear(),
        fechaSeleccionada.getMonth(),
        fechaSeleccionada.getDate(),
        horasSeleccionadas,
        minutosSeleccionados,
        0
      );
      
      // Para el backend, necesitamos la fecha en UTC
      // Pero primero vamos a verificar qué fecha estamos enviando
      console.log('DEBUG - Antes de enviar:', {
        fechaSeleccionada: fechaSeleccionada.toDateString(),
        horaSeleccionada: hora,
        fechaLocal: fechaLocal.toISOString(),
        fechaLocalString: fechaLocal.toString(),
        fechaUTC: fechaLocal.toISOString().split('T')[0],
        fechaLocalFormato: `${fechaLocal.getFullYear()}-${String(fechaLocal.getMonth() + 1).padStart(2, '0')}-${String(fechaLocal.getDate()).padStart(2, '0')}`,
        fechaUTCFormato: `${fechaLocal.getUTCFullYear()}-${String(fechaLocal.getUTCMonth() + 1).padStart(2, '0')}-${String(fechaLocal.getUTCDate()).padStart(2, '0')}`
      });
      
      // PRUEBA: Enviar fecha UTC (un día después si estamos en zona horaria negativa)
      const fechaParaBackend = `${fechaLocal.getUTCFullYear()}-${String(fechaLocal.getUTCMonth() + 1).padStart(2, '0')}-${String(fechaLocal.getUTCDate()).padStart(2, '0')}`;
      
      console.log('Enviando al backend:', {
        servicio: selectedService,
        fecha: fechaParaBackend,
        horaInicio: hora,
        fechaLocal: fechaLocal.toLocaleDateString('es-MX')
      });

      const response = await fetch(`${API_URL}/api/reservations`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          servicio: selectedService,
          fecha: fechaParaBackend, // Usamos la fecha UTC
          horaInicio: hora,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message);
      }

      alert(`¡Cita agendada exitosamente para el ${fechaSeleccionada.toLocaleDateString('es-MX')} a las ${hora}! Recibirás un mensaje de confirmación por WhatsApp.`);
      cargarDisponibilidad();
      cargarMisReservas();
    } catch (err) {
      setError(err.message || 'Error al agendar la cita');
      console.error('Error agendando cita:', err);
    } finally {
      setLoading(false);
    }
  };

  const cambiarSemana = (direccion) => {
    const nuevaFecha = new Date(currentWeekStart);
    nuevaFecha.setDate(nuevaFecha.getDate() + (direccion * 7));
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
                  {diasSemana[0].toLocaleDateString('es-MX', { 
                    month: 'long', 
                    year: 'numeric' 
                  })} - 
                  {diasSemana[6].toLocaleDateString('es-MX', { 
                    day: 'numeric',
                    month: 'long' 
                  })}
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
                          <div className="text-xs text-muted-foreground">
                            {dia.toLocaleDateString('es-MX')}
                          </div>
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
                          
                          // Verificar si la fecha/hora ya pasó
                          const fechaHoraSeleccionada = new Date(dia);
                          const [horas, minutos] = hora.split(':').map(Number);
                          fechaHoraSeleccionada.setHours(horas, minutos, 0, 0);
                          const pasado = fechaHoraSeleccionada < new Date();

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
                                {ocupado ? '🚫' : pasado ? '✗' : '✓'}
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
                  <div className="w-6 h-6 bg-card border border-input rounded flex items-center justify-center">✓</div>
                  <span>Disponible</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-6 h-6 bg-primary rounded flex items-center justify-center">🚫</div>
                  <span>Ocupado</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-6 h-6 bg-muted rounded flex items-center justify-center">✗</div>
                  <span>Pasado</span>
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