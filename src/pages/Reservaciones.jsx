import { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { ChevronLeft, ChevronRight, Calendar, Clock, LogOut, XCircle, CheckCircle, AlertCircle, X } from 'lucide-react';

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

const Toast = ({ message, type, onClose }) => {
  useEffect(() => {
    const timer = setTimeout(onClose, 5000);
    return () => clearTimeout(timer);
  }, [onClose]);

  const bgColor = type === 'success' 
    ? 'bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800' 
    : 'bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800';
  
  const textColor = type === 'success' 
    ? 'text-green-800 dark:text-green-200' 
    : 'text-red-800 dark:text-red-200';
  
  const iconColor = type === 'success' 
    ? 'text-green-500 dark:text-green-400' 
    : 'text-red-500 dark:text-red-400';

  const Icon = type === 'success' ? CheckCircle : AlertCircle;

  return (
    <div className={`fixed top-24 right-4 z-50 max-w-md w-full ${bgColor} border-2 rounded-xl shadow-2xl p-4 animate-in slide-in-from-top-5`}>
      <div className="flex items-start gap-3">
        <Icon className={`w-5 h-5 ${iconColor} flex-shrink-0 mt-0.5`} />
        <div className="flex-1">
          <p className={`${textColor} text-sm font-medium`}>{message}</p>
        </div>
        <button onClick={onClose} className={`${textColor} hover:opacity-70 transition-opacity`}>
          <X className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};

const Reservaciones = () => {
  const { user, token, logout, isAuthenticated } = useAuth();
  const navigate = useNavigate();

  const [currentWeekStart, setCurrentWeekStart] = useState(() => {
    const hoy = new Date();
    const lunes = new Date(hoy);
    const diaSemana = lunes.getDay();
    const diff = lunes.getDate() - diaSemana + (diaSemana === 0 ? -6 : 1);
    lunes.setDate(diff);
    lunes.setHours(0, 0, 0, 0);
    return lunes;
  });
  
  const [selectedService, setSelectedService] = useState('');
  const [reservas, setReservas] = useState([]);
  const [misReservas, setMisReservas] = useState([]);
  const [loading, setLoading] = useState(false);
  const [toast, setToast] = useState(null);

  useEffect(() => {
    if (!isAuthenticated) {
      navigate('/login');
    }
  }, [isAuthenticated, navigate]);

  useEffect(() => {
    cargarDisponibilidad();
    cargarMisReservas();
  }, [currentWeekStart, selectedService]);

  const showToast = (message, type = 'success') => {
    setToast({ message, type });
  };

  const closeToast = () => {
    setToast(null);
  };

  const formatDateToYMD = (date) => {
    const d = new Date(date);
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  const obtenerHorasOcupadas = (reserva) => {
    const horasOcupadas = [];
    const [horaInicio, minutoInicio] = reserva.horaInicio.split(':').map(Number);
    const [horaFin, minutoFin] = reserva.horaFin.split(':').map(Number);
    
    const inicioMinutos = horaInicio * 60 + minutoInicio;
    const finMinutos = horaFin * 60 + minutoFin;
    
    for (let minutos = inicioMinutos; minutos < finMinutos; minutos += 30) {
      const hora = Math.floor(minutos / 60);
      const minuto = minutos % 60;
      const horaStr = `${String(hora).padStart(2, '0')}:${String(minuto).padStart(2, '0')}`;
      horasOcupadas.push(horaStr);
    }
    
    return horasOcupadas;
  };

  const cargarDisponibilidad = async () => {
    try {
      const fechaISO = formatDateToYMD(currentWeekStart);
      console.log('📅 Cargando disponibilidad para:', fechaISO);
      
      const response = await fetch(
        `${API_URL}/api/reservations/availability/${fechaISO}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );
      
      if (!response.ok) {
        throw new Error(`Error ${response.status}`);
      }
      
      const data = await response.json();
      console.log('✅ Reservas cargadas:', data);
      setReservas(data);
    } catch (err) {
      console.error('❌ Error cargando disponibilidad:', err);
    }
  };

  const cargarMisReservas = async () => {
    try {
      const response = await fetch(`${API_URL}/api/reservations/my-reservations`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      
      if (!response.ok) {
        throw new Error(`Error ${response.status}`);
      }
      
      const data = await response.json();
      console.log('📋 Mis reservas:', data);
      setMisReservas(data);
    } catch (err) {
      console.error('❌ Error cargando reservas:', err);
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
    
    for (let i = 0; i < 7; i++) {
      const fecha = new Date(inicio);
      fecha.setDate(inicio.getDate() + i);
      dias.push(fecha);
    }
    return dias;
  };

  const estaOcupado = (fecha, hora) => {
    const fechaStr = formatDateToYMD(fecha);
    
    return reservas.some((reserva) => {
      const reservaFecha = typeof reserva.fecha === 'string' 
        ? reserva.fecha 
        : formatDateToYMD(new Date(reserva.fecha));
      
      if (reservaFecha !== fechaStr) return false;
      
      const horasOcupadas = obtenerHorasOcupadas(reserva);
      return horasOcupadas.includes(hora);
    });
  };

  const getReservaInfo = (fecha, hora) => {
    const fechaStr = formatDateToYMD(fecha);
    
    for (const reserva of reservas) {
      const reservaFecha = typeof reserva.fecha === 'string' 
        ? reserva.fecha 
        : formatDateToYMD(new Date(reserva.fecha));
      
      if (reservaFecha !== fechaStr) continue;
      
      const horasOcupadas = obtenerHorasOcupadas(reserva);
      if (horasOcupadas.includes(hora)) {
        return {
          servicio: reserva.servicio,
          nombreCliente: reserva.nombreCliente,
          horaInicio: reserva.horaInicio,
          horaFin: reserva.horaFin,
          duracion: reserva.duracion
        };
      }
    }
    
    return null;
  };

  const agendarCita = async (fecha, hora) => {
    if (!selectedService) {
      showToast('Por favor selecciona un servicio primero', 'error');
      return;
    }

    setLoading(true);

    try {
      const fechaParaBackend = formatDateToYMD(fecha);
      
      console.log('🖱️ Agendando cita:', {
        fecha: fechaParaBackend,
        hora: hora,
        servicio: selectedService
      });

      const response = await fetch(`${API_URL}/api/reservations`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          servicio: selectedService,
          fecha: fechaParaBackend,
          horaInicio: hora,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || `Error ${response.status}`);
      }

      console.log('✅ Cita creada:', data);
      
      showToast(
        `¡Cita agendada! ${fecha.toLocaleDateString('es-MX', { 
          weekday: 'long', 
          day: 'numeric',
          month: 'long'
        })} a las ${hora}. Confirmación enviada por WhatsApp.`,
        'success'
      );
      
      // Recargar inmediatamente
      await cargarDisponibilidad();
      await cargarMisReservas();
      
    } catch (err) {
      console.error('❌ Error:', err);
      showToast(err.message || 'Error al agendar la cita', 'error');
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
    if (!window.confirm('¿Estás segura de que deseas cancelar esta cita?')) {
      return;
    }

    setLoading(true);

    try {
      const response = await fetch(`${API_URL}/api/reservations/${reservaId}/cancel`, {
        method: 'PUT',
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        throw new Error(`Error ${response.status}`);
      }

      console.log('✅ Cita cancelada');
      
      showToast('Cita cancelada exitosamente', 'success');
      
      // Recargar inmediatamente
      await cargarDisponibilidad();
      await cargarMisReservas();
      
    } catch (err) {
      console.error('❌ Error:', err);
      showToast(`Error al cancelar: ${err.message}`, 'error');
    } finally {
      setLoading(false);
    }
  };

  const horarios = generarHorarios();
  const diasSemana = generarDiasSemana();

  return (
    <div className="min-h-screen bg-background">
      {toast && <Toast message={toast.message} type={toast.type} onClose={closeToast} />}

      <div className="bg-primary shadow-lg" style={{ marginTop: '300px' }}>
        <div className="container mx-auto px-4 py-6">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
            <div>
              <h1 className="text-3xl md:text-4xl font-alex-brush text-white">Reservaciones</h1>
              <p className="text-white/90 mt-1">Hola, {user?.nombreCompleto}</p>
            </div>
            <button
              onClick={logout}
              className="flex items-center gap-2 bg-white text-primary px-4 py-2 rounded-lg hover:bg-card transition-colors font-medium"
            >
              <LogOut className="w-4 h-4" />
              Cerrar Sesión
            </button>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8">
        <div className="bg-card rounded-2xl shadow-lg p-6 mb-8 border border-border">
          <h2 className="text-2xl md:text-3xl font-alex-brush text-primary mb-6">
            Selecciona un servicio
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {Object.entries(serviceDurations).map(([key, value]) => (
              <button
                key={key}
                onClick={() => setSelectedService(key)}
                className={`p-4 rounded-xl border-2 transition-all ${
                  selectedService === key
                    ? 'border-primary bg-primary/10 shadow-md'
                    : 'border-border hover:border-primary hover:bg-muted'
                }`}
              >
                <p className="font-semibold text-foreground text-left">{value.nombre}</p>
                <div className="flex justify-between items-center mt-2">
                  <span className="text-sm font-medium text-primary">${value.precio}</span>
                  <span className="text-xs text-muted-foreground bg-muted px-2 py-1 rounded">{value.duracion} min</span>
                </div>
              </button>
            ))}
          </div>
        </div>

        {selectedService && (
          <div className="bg-card rounded-2xl shadow-lg p-6 mb-8 border border-border">
            <div className="flex items-center justify-between mb-6">
              <button
                onClick={() => cambiarSemana(-1)}
                className="flex items-center gap-2 px-4 py-2 rounded-lg bg-primary text-white hover:bg-primary/90"
                disabled={loading}
              >
                <ChevronLeft className="w-5 h-5" />
                <span className="hidden sm:inline">Anterior</span>
              </button>
              
              <div className="text-center">
                <h3 className="text-xl font-semibold text-foreground">
                  {diasSemana[0].toLocaleDateString('es-MX', { day: 'numeric', month: 'long' })} - 
                  {diasSemana[6].toLocaleDateString('es-MX', { day: 'numeric', month: 'long', year: 'numeric' })}
                </h3>
              </div>
              
              <button
                onClick={() => cambiarSemana(1)}
                className="flex items-center gap-2 px-4 py-2 rounded-lg bg-primary text-white hover:bg-primary/90"
                disabled={loading}
              >
                <span className="hidden sm:inline">Siguiente</span>
                <ChevronRight className="w-5 h-5" />
              </button>
            </div>

            <div className="overflow-x-auto rounded-lg border border-border">
              <table className="w-full min-w-[800px]">
                <thead>
                  <tr className="bg-muted">
                    <th className="p-4 border-b border-border text-left font-semibold text-foreground">Hora</th>
                    {diasSemana.map((dia, idx) => {
                      const esHoy = formatDateToYMD(dia) === formatDateToYMD(new Date());
                      return (
                        <th key={idx} className={`p-4 border-b border-border text-center ${esHoy ? 'bg-primary/5' : ''}`}>
                          <div className="text-sm font-medium text-muted-foreground">
                            {dia.toLocaleDateString('es-MX', { weekday: 'short' })}
                          </div>
                          <div className={`text-xl font-bold mt-1 ${esHoy ? 'text-primary' : 'text-foreground'}`}>
                            {dia.getDate()}
                          </div>
                          {esHoy && (
                            <span className="inline-block px-2 py-0.5 text-xs bg-primary text-white rounded-full mt-1">Hoy</span>
                          )}
                        </th>
                      );
                    })}
                  </tr>
                </thead>
                <tbody>
                  {horarios.map((hora) => (
                    <tr key={hora} className="hover:bg-muted/50">
                      <td className="p-4 border-b border-border text-center font-medium text-foreground bg-muted">{hora}</td>
                      {diasSemana.map((dia, idx) => {
                        const ocupado = estaOcupado(dia, hora);
                        const reservaInfo = ocupado ? getReservaInfo(dia, hora) : null;
                        
                        const ahora = new Date();
                        const fechaHoraSeleccionada = new Date(dia);
                        const [horasSel, minutosSel] = hora.split(':').map(Number);
                        fechaHoraSeleccionada.setHours(horasSel, minutosSel, 0, 0);
                        const pasado = fechaHoraSeleccionada < ahora;

                        return (
                          <td key={idx} className="p-2 border-b border-border">
                            <button
                              onClick={() => !ocupado && !pasado && agendarCita(dia, hora)}
                              disabled={ocupado || pasado || loading}
                              className={`w-full h-12 rounded-lg transition-all flex items-center justify-center ${
                                ocupado
                                  ? 'bg-primary text-white cursor-not-allowed'
                                  : pasado
                                  ? 'bg-muted text-muted-foreground cursor-not-allowed'
                                  : 'bg-card hover:bg-primary/10 text-foreground hover:text-primary border border-border hover:border-primary cursor-pointer'
                              } ${loading ? 'opacity-50' : ''}`}
                              title={ocupado ? `Ocupado: ${serviceDurations[reservaInfo.servicio]?.nombre}` : 'Disponible'}
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

            <div className="mt-6 flex flex-wrap gap-4 items-center justify-center">
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 bg-card border-2 border-border rounded"></div>
                <span className="text-sm text-foreground">Disponible</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 bg-primary rounded"></div>
                <span className="text-sm text-foreground">Ocupado</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 bg-muted rounded"></div>
                <span className="text-sm text-foreground">No disponible</span>
              </div>
            </div>
          </div>
        )}

        <div className="bg-card rounded-2xl shadow-lg p-6 border border-border">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl md:text-3xl font-alex-brush text-primary">Mis Citas</h2>
            <span className="px-3 py-1 bg-primary/10 text-primary rounded-full text-sm font-medium">
              {misReservas.length}
            </span>
          </div>
          
          {misReservas.length === 0 ? (
            <div className="text-center py-12">
              <Calendar className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
              <p className="text-muted-foreground">No tienes citas agendadas</p>
            </div>
          ) : (
            <div className="space-y-4">
              {misReservas.map((reserva) => (
                <div key={reserva._id} className="p-4 rounded-xl border-2 border-border bg-card">
                  <div className="flex flex-col md:flex-row justify-between gap-4">
                    <div className="flex-1">
                      <h3 className="font-bold text-lg text-primary mb-2">
                        {serviceDurations[reserva.servicio]?.nombre}
                      </h3>
                      <div className="space-y-2 text-sm">
                        <p className="text-foreground">📅 {reserva.fechaLegible || reserva.fecha}</p>
                        <p className="text-foreground">⏰ {reserva.horaInicio} - {reserva.horaFin}</p>
                        <p className="text-foreground">💰 ${serviceDurations[reserva.servicio]?.precio} MXN</p>
                      </div>
                    </div>
                    {reserva.estado === 'confirmada' && (
                      <button
                        onClick={() => cancelarReserva(reserva._id)}
                        className="px-4 py-2 bg-destructive text-destructive-foreground rounded-lg hover:bg-destructive/90"
                        disabled={loading}
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