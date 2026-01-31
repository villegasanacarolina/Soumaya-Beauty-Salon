import { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { ChevronLeft, ChevronRight, Calendar, Clock, LogOut, X, CheckCircle, AlertCircle, Trash2, RefreshCw } from 'lucide-react';

const API_URL = 'https://soumaya-beauty-salon.onrender.com';

const serviceDurations = {
  'unas-gel':       { duracion: 60,  nombre: 'Uñas de Gel',             precio: 450  },
  'unas-acrilicas': { duracion: 90,  nombre: 'Uñas Acrílicas',          precio: 600  },
  'pedicure':       { duracion: 90,  nombre: 'Pedicure Premium',        precio: 500  },
  'keratina':       { duracion: 180, nombre: 'Tratamiento de Keratina', precio: 1200 },
  'tinte':          { duracion: 180, nombre: 'Tinte Profesional',       precio: 800  },
  'pestanas':       { duracion: 60,  nombre: 'Extensión de Pestañas',   precio: 900  },
  'cejas':          { duracion: 30,  nombre: 'Diseño de Cejas',         precio: 350  },
};

// ─── Toast ──────────────────────────────────────────────────────────────────
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
    <div className={`fixed top-24 right-4 z-50 max-w-md w-full ${bgColor} border-2 rounded-xl shadow-2xl p-4`}>
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

// ─── Modal: ¿Reagendar? ─────────────────────────────────────────────────────
const ReagendarModal = ({ reserva, onConfirmCancel, onClose }) => {
  const info = serviceDurations[reserva.servicio];
  const [year, month, day] = reserva.fecha.split('-').map(Number);
  const fechaObj = new Date(year, month - 1, day);
  const fechaFormateada = fechaObj.toLocaleDateString('es-MX', {
    weekday: 'long', day: 'numeric', month: 'long', year: 'numeric'
  });

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Fondo oscuro */}
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />

      {/* Modal */}
      <div className="relative bg-card border border-border rounded-2xl shadow-2xl max-w-md w-full mx-4 p-6">
        {/* Botón cerrar */}
        <button onClick={onClose} className="absolute top-4 right-4 text-muted-foreground hover:text-foreground transition-colors">
          <X className="w-5 h-5" />
        </button>

        {/* Ícono */}
        <div className="flex justify-center mb-4">
          <div className="w-14 h-14 rounded-full bg-red-100 dark:bg-red-900/30 flex items-center justify-center">
            <AlertCircle className="w-7 h-7 text-red-500" />
          </div>
        </div>

        {/* Título */}
        <h3 className="text-xl font-bold text-foreground text-center mb-2">
          ¿Cancelar esta cita?
        </h3>
        <p className="text-muted-foreground text-center text-sm mb-4">
          Esta acción no puede deshacerse
        </p>

        {/* Detalles de la reserva */}
        <div className="bg-muted rounded-xl p-4 mb-5 space-y-2">
          <div className="flex justify-between">
            <span className="text-sm text-muted-foreground">Servicio</span>
            <span className="text-sm font-semibold text-foreground">{info?.nombre}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-sm text-muted-foreground">Fecha</span>
            <span className="text-sm font-semibold text-foreground">{fechaFormateada}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-sm text-muted-foreground">Hora</span>
            <span className="text-sm font-semibold text-foreground">{reserva.horaInicio} - {reserva.horaFin}</span>
          </div>
        </div>

        {/* Botones */}
        <div className="flex flex-col gap-3">
          {/* Cancelar + Reagendar: cancela y redirige a la misma página para seleccionar nuevo horario */}
          <button
            onClick={() => onConfirmCancel(true)}
            className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-primary text-white rounded-xl font-semibold hover:bg-primary/90 transition-colors"
          >
            <RefreshCw className="w-4 h-4" />
            Cancelar y Reagendar
          </button>

          {/* Solo cancelar */}
          <button
            onClick={() => onConfirmCancel(false)}
            className="w-full px-4 py-3 bg-red-500 text-white rounded-xl font-semibold hover:bg-red-600 transition-colors"
          >
            Solo Cancelar
          </button>

          {/* No cancelar */}
          <button
            onClick={onClose}
            className="w-full px-4 py-3 bg-muted text-foreground rounded-xl font-medium hover:bg-muted/80 transition-colors"
          >
            No, mantener mi cita
          </button>
        </div>
      </div>
    </div>
  );
};

// ─── Componente principal ───────────────────────────────────────────────────
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

  // Modal de cancelación con reagendar
  const [modalReserva, setModalReserva] = useState(null); // reserva seleccionada para cancelar

  useEffect(() => {
    if (!isAuthenticated) navigate('/login');
  }, [isAuthenticated, navigate]);

  useEffect(() => {
    cargarDisponibilidad();
    cargarMisReservas();
  }, [currentWeekStart]);

  // ── Toast helpers ─────────────────────────────────────────────────────────
  const showToast = (message, type = 'success') => setToast({ message, type });
  const closeToast = () => setToast(null);

  // ── Fecha helpers ─────────────────────────────────────────────────────────
  const formatDateToYMD = (date) => {
    const d = new Date(date);
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
  };

  // ── Cargar datos ──────────────────────────────────────────────────────────
  const cargarDisponibilidad = async () => {
    try {
      const fechaISO = formatDateToYMD(currentWeekStart);
      const response = await fetch(`${API_URL}/api/reservations/availability/${fechaISO}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (!response.ok) throw new Error(`Error ${response.status}`);
      const data = await response.json();
      setReservas(data);
    } catch (err) {
      console.error('❌ Error cargando disponibilidad:', err);
    }
  };

  const cargarMisReservas = async () => {
    try {
      const response = await fetch(`${API_URL}/api/reservations/my-reservations`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (!response.ok) throw new Error(`Error ${response.status}`);
      const data = await response.json();
      setMisReservas(data);
    } catch (err) {
      console.error('❌ Error cargando mis reservas:', err);
    }
  };

  // ── Horarios y semana ─────────────────────────────────────────────────────
  const generarHorarios = () => {
    const horarios = [];
    for (let h = 10; h < 20; h++) {
      for (let m = 0; m < 60; m += 30) {
        horarios.push(`${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`);
      }
    }
    return horarios;
  };

  const generarDiasSemana = () => {
    const dias = [];
    for (let i = 0; i < 7; i++) {
      const fecha = new Date(currentWeekStart);
      fecha.setDate(currentWeekStart.getDate() + i);
      dias.push(fecha);
    }
    return dias;
  };

  // ── Ocupación ─────────────────────────────────────────────────────────────
  const obtenerHorasOcupadas = (reserva) => {
    const horasOcupadas = [];
    const [horaInicio, minutoInicio] = reserva.horaInicio.split(':').map(Number);
    const [horaFin, minutoFin]       = reserva.horaFin.split(':').map(Number);
    const inicioMinutos = horaInicio * 60 + minutoInicio;
    const finMinutos    = horaFin * 60 + minutoFin;

    for (let minutos = inicioMinutos; minutos < finMinutos; minutos += 30) {
      const h = Math.floor(minutos / 60);
      const m = minutos % 60;
      horasOcupadas.push(`${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`);
    }
    return horasOcupadas;
  };

  const estaOcupado = (fecha, hora) => {
    const fechaStr = formatDateToYMD(fecha);
    return reservas.some((reserva) => {
      const reservaFecha = typeof reserva.fecha === 'string' ? reserva.fecha : formatDateToYMD(new Date(reserva.fecha));
      if (reservaFecha !== fechaStr) return false;
      return obtenerHorasOcupadas(reserva).includes(hora);
    });
  };

  const getReservaInfo = (fecha, hora) => {
    const fechaStr = formatDateToYMD(fecha);
    for (const reserva of reservas) {
      const reservaFecha = typeof reserva.fecha === 'string' ? reserva.fecha : formatDateToYMD(new Date(reserva.fecha));
      if (reservaFecha !== fechaStr) continue;
      if (obtenerHorasOcupadas(reserva).includes(hora)) {
        return { servicio: reserva.servicio, nombreCliente: reserva.nombreCliente, horaInicio: reserva.horaInicio, horaFin: reserva.horaFin };
      }
    }
    return null;
  };

  // ── Agendar cita ──────────────────────────────────────────────────────────
  const agendarCita = async (fecha, hora) => {
    if (!selectedService) {
      showToast('Por favor selecciona un servicio primero', 'error');
      return;
    }
    if (estaOcupado(fecha, hora)) {
      showToast('Este horario ya está ocupado', 'error');
      return;
    }

    setLoading(true);
    try {
      const fechaParaBackend = formatDateToYMD(fecha);

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
      if (!response.ok) throw new Error(data.message || `Error ${response.status}`);

      showToast('¡Cita agendada! Abriendo WhatsApp para tu confirmación...', 'success');

      // 🤖 Abrir WhatsApp automáticamente con mensaje prellenado
      setTimeout(() => {
        if (data.whatsappLink) {
          window.open(data.whatsappLink, '_blank');
        }
      }, 1500);

      await Promise.all([cargarDisponibilidad(), cargarMisReservas()]);

    } catch (err) {
      console.error('❌ Error agendando:', err);
      showToast(err.message || 'Error al agendar la cita', 'error');
    } finally {
      setLoading(false);
    }
  };

  // ── Cancelar reserva (desde "Mis Citas") ─────────────────────────────────
  // Abre el modal de cancelación
  const abrirModalCancelar = (reserva) => {
    setModalReserva(reserva);
  };

  // Cuando el usuario confirma en el modal
  const confirmarCancelacion = async (reagendar) => {
    if (!modalReserva) return;
    setLoading(true);
    setModalReserva(null); // cerrar modal

    try {
      const response = await fetch(`${API_URL}/api/reservations/${modalReserva._id}/cancel`, {
        method: 'PUT',
        headers: { Authorization: `Bearer ${token}` }
      });

      if (!response.ok) throw new Error(`Error ${response.status}`);

      if (reagendar) {
        showToast('Cita cancelada. Selecciona un nuevo horario 👇', 'success');
        // Si tiene servicio previo, preseleccionar el mismo
        if (modalReserva.servicio) {
          setSelectedService(modalReserva.servicio);
        }
        // Scroll al calendario
        setTimeout(() => {
          document.querySelector('[data-calendario]')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }, 500);
      } else {
        showToast('Cita cancelada exitosamente.', 'success');
      }

      await Promise.all([cargarDisponibilidad(), cargarMisReservas()]);

    } catch (err) {
      console.error('❌ Error cancelando:', err);
      showToast(`Error al cancelar: ${err.message}`, 'error');
    } finally {
      setLoading(false);
    }
  };

  // ── Eliminar del historial ────────────────────────────────────────────────
  const eliminarDelHistorial = async (reservaId) => {
    if (!window.confirm('¿Eliminar esta cita del historial?')) return;
    setLoading(true);
    try {
      const response = await fetch(`${API_URL}/api/reservations/${reservaId}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` }
      });
      if (!response.ok) throw new Error(`Error ${response.status}`);
      showToast('Cita eliminada del historial', 'success');
      await cargarMisReservas();
    } catch (err) {
      showToast(`Error: ${err.message}`, 'error');
    } finally {
      setLoading(false);
    }
  };

  // ── Cambiar semana ────────────────────────────────────────────────────────
  const cambiarSemana = (direccion) => {
    const nuevaFecha = new Date(currentWeekStart);
    nuevaFecha.setDate(nuevaFecha.getDate() + (direccion * 7));
    setCurrentWeekStart(nuevaFecha);
  };

  // ── Render ────────────────────────────────────────────────────────────────
  const horarios = generarHorarios();
  const diasSemana = generarDiasSemana();

  return (
    <div className="min-h-screen bg-background">
      {/* Toast */}
      {toast && <Toast message={toast.message} type={toast.type} onClose={closeToast} />}

      {/* Modal de cancelar con reagendar */}
      {modalReserva && (
        <ReagendarModal
          reserva={modalReserva}
          onConfirmCancel={confirmarCancelacion}
          onClose={() => setModalReserva(null)}
        />
      )}

      {/* Header */}
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

        {/* ── Selección de servicio ─────────────────────────────────────── */}
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

        {/* ── Calendario semanal ────────────────────────────────────────── */}
        {selectedService && (
          <div className="bg-card rounded-2xl shadow-lg p-6 mb-8 border border-border" data-calendario>
            {/* Nav semana */}
            <div className="flex items-center justify-between mb-6">
              <button onClick={() => cambiarSemana(-1)} className="flex items-center gap-2 px-4 py-2 rounded-lg bg-primary text-white hover:bg-primary/90" disabled={loading}>
                <ChevronLeft className="w-5 h-5" />
              </button>
              <div className="text-center">
                <h3 className="text-xl font-semibold text-foreground">
                  {diasSemana[0].toLocaleDateString('es-MX', { day: 'numeric', month: 'long' })} -
                  {diasSemana[6].toLocaleDateString('es-MX', { day: 'numeric', month: 'long', year: 'numeric' })}
                </h3>
              </div>
              <button onClick={() => cambiarSemana(1)} className="flex items-center gap-2 px-4 py-2 rounded-lg bg-primary text-white hover:bg-primary/90" disabled={loading}>
                <ChevronRight className="w-5 h-5" />
              </button>
            </div>

            {/* Tabla */}
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
                              style={ocupado ? { backgroundColor: '#D98FA0' } : {}}
                              className={`w-full h-12 rounded-lg transition-all flex items-center justify-center font-bold text-lg ${
                                ocupado
                                  ? 'text-white cursor-not-allowed'
                                  : pasado
                                  ? 'bg-muted text-muted-foreground cursor-not-allowed'
                                  : 'bg-card hover:bg-primary/10 text-foreground hover:text-primary border-2 border-border hover:border-primary cursor-pointer'
                              } ${loading ? 'opacity-50' : ''}`}
                              title={ocupado ? `Ocupado: ${serviceDurations[reservaInfo?.servicio]?.nombre || ''}` : pasado ? 'Horario pasado' : 'Disponible – Click para agendar'}
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

            {/* Leyenda */}
            <div className="mt-6 flex flex-wrap gap-4 items-center justify-center">
              <div className="flex items-center gap-2">
                <div className="w-6 h-6 bg-card border-2 border-border rounded"></div>
                <span className="text-sm text-foreground">Disponible</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-6 h-6 rounded" style={{ backgroundColor: '#D98FA0' }}></div>
                <span className="text-sm text-foreground">Ocupado</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-6 h-6 bg-muted rounded"></div>
                <span className="text-sm text-foreground">No disponible</span>
              </div>
            </div>
          </div>
        )}

        {/* ── Mis Citas ────────────────────────────────────────────────── */}
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
                <div key={reserva._id} className={`p-4 rounded-xl border-2 ${
                  reserva.estado === 'confirmada'
                    ? 'border-green-200 bg-green-50 dark:bg-green-900/10'
                    : 'border-red-200 bg-red-50 dark:bg-red-900/10'
                }`}>
                  <div className="flex flex-col md:flex-row justify-between gap-4">
                    <div className="flex-1">
                      {/* Badge estado */}
                      <div className="flex items-center gap-2 mb-2">
                        <span className={`px-2 py-1 rounded text-xs font-medium ${
                          reserva.estado === 'confirmada'
                            ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300'
                            : 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300'
                        }`}>
                          {reserva.estado === 'confirmada' ? '✅ Confirmada' : '❌ Cancelada'}
                        </span>
                      </div>

                      {/* Info */}
                      <h3 className="font-bold text-lg text-primary mb-2">
                        {serviceDurations[reserva.servicio]?.nombre}
                      </h3>
                      <div className="space-y-1 text-sm text-foreground">
                        <p>📅 {reserva.fechaLegible || reserva.fecha}</p>
                        <p>⏰ {reserva.horaInicio} - {reserva.horaFin}</p>
                        <p>💰 ${serviceDurations[reserva.servicio]?.precio} MXN</p>
                      </div>
                    </div>

                    {/* Botones */}
                    <div className="flex gap-2">
                      {reserva.estado === 'confirmada' && (
                        <button
                          onClick={() => abrirModalCancelar(reserva)}
                          className="px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors font-medium whitespace-nowrap"
                          disabled={loading}
                        >
                          Cancelar Cita
                        </button>
                      )}
                      <button
                        onClick={() => eliminarDelHistorial(reserva._id)}
                        className="px-3 py-2 bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors"
                        disabled={loading}
                        title="Eliminar del historial"
                      >
                        <Trash2 className="w-5 h-5" />
                      </button>
                    </div>
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
