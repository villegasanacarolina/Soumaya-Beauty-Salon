import { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { ChevronLeft, ChevronRight, Calendar, Clock, LogOut, XCircle, CheckCircle, AlertCircle } from 'lucide-react';

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
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

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

  const formatDateToYMD = (date) => {
    const d = new Date(date);
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  // Función para calcular todas las horas ocupadas por una reserva
  const obtenerHorasOcupadas = (reserva) => {
    const horasOcupadas = [];
    const [horaInicio, minutoInicio] = reserva.horaInicio.split(':').map(Number);
    const [horaFin, minutoFin] = reserva.horaFin.split(':').map(Number);
    
    // Convertir a minutos totales
    const inicioMinutos = horaInicio * 60 + minutoInicio;
    const finMinutos = horaFin * 60 + minutoFin;
    
    // Generar todas las franjas de 30 minutos ocupadas
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
      console.log('📅 Cargando disponibilidad para fecha:', fechaISO);
      
      const response = await fetch(
        `${API_URL}/api/reservations/availability/${fechaISO}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );
      
      if (!response.ok) {
        throw new Error(`Error ${response.status}: ${response.statusText}`);
      }
      
      const data = await response.json();
      console.log('✅ Disponibilidad cargada:', data.length, 'reservas');
      setReservas(data);
    } catch (err) {
      console.error('❌ Error cargando disponibilidad:', err);
      setError(`Error al cargar disponibilidad: ${err.message}`);
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
        throw new Error(`Error ${response.status}: ${response.statusText}`);
      }
      
      const data = await response.json();
      console.log('📋 Mis reservas cargadas:', data.length);
      setMisReservas(data);
    } catch (err) {
      console.error('❌ Error cargando mis reservas:', err);
      setError(`Error al cargar tus reservas: ${err.message}`);
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

  // Verificar si una hora específica está ocupada
  const estaOcupado = (fecha, hora) => {
    const fechaStr = formatDateToYMD(fecha);
    
    return reservas.some((reserva) => {
      // Obtener la fecha de la reserva
      const reservaFecha = typeof reserva.fecha === 'string' 
        ? reserva.fecha 
        : formatDateToYMD(new Date(reserva.fecha));
      
      // Verificar que sea el mismo día
      if (reservaFecha !== fechaStr) return false;
      
      // Obtener todas las horas ocupadas por esta reserva
      const horasOcupadas = obtenerHorasOcupadas(reserva);
      
      // Verificar si la hora está en las horas ocupadas
      return horasOcupadas.includes(hora);
    });
  };

  // Obtener información de la reserva que ocupa esta hora (para tooltip)
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
      setError('Por favor selecciona un servicio primero');
      return;
    }

    setLoading(true);
    setError('');
    setSuccess('');

    try {
      const fechaParaBackend = formatDateToYMD(fecha);
      
      console.log('🖱️ Agendando cita:', {
        fechaVisual: fecha.toLocaleDateString('es-MX'),
        fechaEnviada: fechaParaBackend,
        horaEnviada: hora,
        servicio: selectedService,
        duracion: serviceDurations[selectedService].duracion
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

      console.log('✅ Cita agendada exitosamente:', data);
      
      // Calcular horas fin localmente
      const duracion = serviceDurations[selectedService].duracion;
      const [horaInicioNum, minutoInicioNum] = hora.split(':').map(Number);
      const inicioMinutos = horaInicioNum * 60 + minutoInicioNum;
      const finMinutos = inicioMinutos + duracion;
      const horaFinNum = Math.floor(finMinutos / 60);
      const minutoFinNum = finMinutos % 60;
      const horaFin = `${String(horaFinNum).padStart(2, '0')}:${String(minutoFinNum).padStart(2, '0')}`;
      
      // Crear objeto de reserva con todas las horas ocupadas
      const nuevaReserva = {
        _id: data._id,
        fecha: fechaParaBackend,
        horaInicio: hora,
        horaFin: data.horaFin || horaFin,
        servicio: selectedService,
        duracion: duracion,
        nombreCliente: user?.nombreCompleto || 'Cliente',
        estado: 'confirmada'
      };
      
      console.log('➕ Añadiendo nueva reserva:', nuevaReserva);
      console.log('⏰ Horas ocupadas:', obtenerHorasOcupadas(nuevaReserva));
      
      // Actualizar el estado de reservas
      setReservas(prevReservas => [...prevReservas, nuevaReserva]);
      
      setSuccess(`¡Cita agendada exitosamente para el ${fecha.toLocaleDateString('es-MX', { 
        weekday: 'long', 
        year: 'numeric', 
        month: 'long', 
        day: 'numeric' 
      })} a las ${hora}! Duración: ${duracion} minutos. Recibirás un mensaje de confirmación por WhatsApp.`);
      
      // Recargar datos del backend
      await cargarDisponibilidad();
      await cargarMisReservas();
      
    } catch (err) {
      console.error('❌ Error agendando cita:', err);
      setError(err.message || 'Error al agendar la cita. Por favor intenta de nuevo.');
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

    try {
      const response = await fetch(`${API_URL}/api/reservations/${reservaId}/cancel`, {
        method: 'PUT',
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        throw new Error(`Error ${response.status}: ${response.statusText}`);
      }

      // Remover la reserva cancelada del estado local
      setReservas(prevReservas => 
        prevReservas.filter(reserva => reserva._id !== reservaId)
      );
      
      alert('✅ Cita cancelada exitosamente');
      await cargarMisReservas();
      await cargarDisponibilidad();
    } catch (err) {
      console.error('❌ Error cancelando reserva:', err);
      alert(`Error al cancelar la cita: ${err.message}`);
    }
  };

  const horarios = generarHorarios();
  const diasSemana = generarDiasSemana();

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="bg-primary shadow-lg" style={{ marginTop: '300px' }}>
        <div className="container mx-auto px-4 py-6">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
            <div>
              <h1 className="text-3xl md:text-4xl font-alex-brush text-white">Reservaciones</h1>
              <p className="text-white/90 mt-1">Hola, {user?.nombreCompleto || 'Usuario'}</p>
            </div>
            <button
              onClick={logout}
              className="flex items-center gap-2 bg-white text-primary px-4 py-2 rounded-lg hover:bg-gray-100 transition-colors font-medium"
            >
              <LogOut className="w-4 h-4" />
              Cerrar Sesión
            </button>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8">
        {/* Mensajes de estado */}
        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-xl">
            <div className="flex items-center gap-3">
              <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0" />
              <div>
                <p className="text-red-800 font-medium">Error</p>
                <p className="text-red-600 text-sm">{error}</p>
              </div>
            </div>
          </div>
        )}

        {success && (
          <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-xl">
            <div className="flex items-center gap-3">
              <CheckCircle className="w-5 h-5 text-green-500 flex-shrink-0" />
              <div>
                <p className="text-green-800 font-medium">¡Éxito!</p>
                <p className="text-green-600 text-sm">{success}</p>
              </div>
            </div>
          </div>
        )}

        {/* Selector de Servicio */}
        <div className="bg-white rounded-2xl shadow-lg p-6 mb-8 border border-gray-100">
          <h2 className="text-2xl md:text-3xl font-alex-brush text-primary mb-6">
            Selecciona un servicio
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {Object.entries(serviceDurations).map(([key, value]) => (
              <button
                key={key}
                onClick={() => {
                  setSelectedService(key);
                  setError('');
                  setSuccess('');
                }}
                className={`p-4 rounded-xl border-2 transition-all duration-200 ${
                  selectedService === key
                    ? 'border-primary bg-primary/10 shadow-md'
                    : 'border-gray-200 hover:border-primary hover:bg-gray-50'
                }`}
              >
                <p className="font-semibold text-gray-800 text-left">{value.nombre}</p>
                <div className="flex justify-between items-center mt-2">
                  <span className="text-sm font-medium text-primary">
                    ${value.precio} MXN
                  </span>
                  <span className="text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded">
                    {value.duracion} min
                  </span>
                </div>
              </button>
            ))}
          </div>
          
          {selectedService && (
            <div className="mt-6 p-4 bg-blue-50 rounded-lg border border-blue-200">
              <p className="text-blue-700 text-sm font-medium">
                Servicio seleccionado: <span className="text-primary">{serviceDurations[selectedService].nombre}</span>
                <span className="ml-4">Duración: <span className="font-bold">{serviceDurations[selectedService].duracion} minutos</span></span>
                <span className="ml-4">Precio: <span className="font-bold">${serviceDurations[selectedService].precio} MXN</span></span>
              </p>
              <p className="text-blue-600 text-xs mt-2">
                ⓘ Al agendar, se ocuparán {serviceDurations[selectedService].duracion/30} franjas de tiempo consecutivas.
              </p>
            </div>
          )}
        </div>

        {selectedService && (
          <>
            {/* Navegación de Semana */}
            <div className="bg-white rounded-2xl shadow-lg p-6 mb-8 border border-gray-100">
              <div className="flex items-center justify-between mb-6">
                <button
                  onClick={() => cambiarSemana(-1)}
                  className="flex items-center gap-2 px-4 py-2 rounded-lg bg-primary text-white hover:bg-primary/90 transition-colors"
                  disabled={loading}
                >
                  <ChevronLeft className="w-5 h-5" />
                  <span className="hidden sm:inline">Semana anterior</span>
                </button>
                
                <div className="text-center">
                  <h3 className="text-xl font-semibold text-gray-800">
                    {diasSemana[0].toLocaleDateString('es-MX', { 
                      day: 'numeric', 
                      month: 'long' 
                    })} - {diasSemana[6].toLocaleDateString('es-MX', { 
                      day: 'numeric', 
                      month: 'long',
                      year: 'numeric'
                    })}
                  </h3>
                  <p className="text-sm text-gray-500 mt-1">
                    Horario: 10:00 AM - 8:00 PM
                  </p>
                </div>
                
                <button
                  onClick={() => cambiarSemana(1)}
                  className="flex items-center gap-2 px-4 py-2 rounded-lg bg-primary text-white hover:bg-primary/90 transition-colors"
                  disabled={loading}
                >
                  <span className="hidden sm:inline">Siguiente semana</span>
                  <ChevronRight className="w-5 h-5" />
                </button>
              </div>

              {/* Calendario */}
              <div className="overflow-x-auto rounded-lg border border-gray-200">
                <table className="w-full min-w-[800px]">
                  <thead>
                    <tr className="bg-gray-50">
                      <th className="p-4 border-b border-gray-200 text-left font-semibold text-gray-700">
                        Hora
                      </th>
                      {diasSemana.map((dia, idx) => {
                        const esHoy = formatDateToYMD(dia) === formatDateToYMD(new Date());
                        return (
                          <th 
                            key={idx} 
                            className={`p-4 border-b border-gray-200 text-center ${
                              esHoy ? 'bg-primary/5' : ''
                            }`}
                          >
                            <div className="text-sm font-medium text-gray-600">
                              {dia.toLocaleDateString('es-MX', { weekday: 'short' })}
                            </div>
                            <div className={`text-xl font-bold mt-1 ${
                              esHoy ? 'text-primary' : 'text-gray-800'
                            }`}>
                              {dia.getDate()}
                            </div>
                            <div className="text-xs text-gray-400 mt-1">
                              {dia.toLocaleDateString('es-MX', { month: 'short' })}
                            </div>
                            {esHoy && (
                              <div className="mt-1">
                                <span className="inline-block px-2 py-0.5 text-xs bg-primary text-white rounded-full">
                                  Hoy
                                </span>
                              </div>
                            )}
                          </th>
                        );
                      })}
                    </tr>
                  </thead>
                  <tbody>
                    {horarios.map((hora) => (
                      <tr key={hora} className="hover:bg-gray-50">
                        <td className="p-4 border-b border-gray-200 text-center font-medium text-gray-700 bg-gray-50">
                          {hora}
                        </td>
                        {diasSemana.map((dia, idx) => {
                          const ocupado = estaOcupado(dia, hora);
                          const reservaInfo = ocupado ? getReservaInfo(dia, hora) : null;
                          
                          // Verificar si ya pasó
                          const ahora = new Date();
                          const fechaHoraSeleccionada = new Date(dia);
                          const [horasSel, minutosSel] = hora.split(':').map(Number);
                          fechaHoraSeleccionada.setHours(horasSel, minutosSel, 0, 0);
                          const pasado = fechaHoraSeleccionada < ahora;

                          return (
                            <td key={idx} className="p-2 border-b border-gray-200">
                              <button
                                onClick={() => !ocupado && !pasado && agendarCita(dia, hora)}
                                disabled={ocupado || pasado || loading}
                                className={`w-full h-12 rounded-lg transition-all duration-200 flex items-center justify-center relative group ${
                                  ocupado
                                    ? 'bg-pink-100 text-pink-700 border border-pink-300 cursor-not-allowed'
                                    : pasado
                                    ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                                    : 'bg-white hover:bg-primary/10 text-gray-700 hover:text-primary border border-gray-200 hover:border-primary cursor-pointer'
                                } ${loading ? 'opacity-50' : ''}`}
                                title={reservaInfo 
                                  ? `Ocupado por: ${reservaInfo.nombreCliente}\nServicio: ${serviceDurations[reservaInfo.servicio]?.nombre || reservaInfo.servicio}\nHorario: ${reservaInfo.horaInicio} - ${reservaInfo.horaFin} (${reservaInfo.duracion} min)`
                                  : `${dia.toLocaleDateString('es-MX')} a las ${hora}`
                                }
                              >
                                {ocupado ? (
                                  <>
                                    <XCircle className="w-4 h-4 text-pink-600" />
                                    {/* Tooltip */}
                                    <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-3 py-2 bg-gray-900 text-white text-xs rounded-lg opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap z-10">
                                      <div className="font-medium">{serviceDurations[reservaInfo?.servicio]?.nombre || 'Servicio'}</div>
                                      <div>{reservaInfo?.horaInicio} - {reservaInfo?.horaFin}</div>
                                      <div className="text-gray-300">{reservaInfo?.nombreCliente}</div>
                                    </div>
                                  </>
                                ) : pasado ? (
                                  <span className="text-xs">✗</span>
                                ) : (
                                  <CheckCircle className="w-4 h-4" />
                                )}
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
                  <div className="w-4 h-4 bg-white border-2 border-gray-200 rounded"></div>
                  <span className="text-sm text-gray-600">Disponible</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 bg-pink-100 border-2 border-pink-300 rounded"></div>
                  <span className="text-sm text-gray-600">Ocupado</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 bg-gray-100 border-2 border-gray-200 rounded"></div>
                  <span className="text-sm text-gray-600">No disponible</span>
                </div>
              </div>

              {/* Información */}
              <div className="mt-6 p-4 bg-blue-50 rounded-xl border border-blue-100">
                <div className="flex items-start gap-3">
                  <AlertCircle className="w-5 h-5 text-blue-500 mt-0.5 flex-shrink-0" />
                  <div>
                    <h4 className="font-medium text-blue-800 mb-1">Instrucciones para agendar:</h4>
                    <ul className="text-sm text-blue-700 space-y-1">
                      <li>• Cada servicio tiene una duración específica (ver arriba)</li>
                      <li>• Al agendar, se ocuparán múltiples franjas consecutivas según la duración</li>
                      <li>• Pasa el cursor sobre los recuadros <span className="text-pink-600 font-medium">rosas</span> para ver información de la reserva</li>
                      <li>• Recibirás un mensaje de confirmación por WhatsApp</li>
                    </ul>
                  </div>
                </div>
              </div>
            </div>
          </>
        )}

        {/* Mis Reservas */}
        <div className="bg-white rounded-2xl shadow-lg p-6 border border-gray-100">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl md:text-3xl font-alex-brush text-primary">
              Mis Citas Programadas
            </h2>
            <span className="px-3 py-1 bg-primary/10 text-primary rounded-full text-sm font-medium">
              {misReservas.length} {misReservas.length === 1 ? 'cita' : 'citas'}
            </span>
          </div>
          
          {misReservas.length === 0 ? (
            <div className="text-center py-12">
              <div className="inline-block p-4 bg-gray-100 rounded-full mb-4">
                <Calendar className="w-12 h-12 text-gray-400" />
              </div>
              <p className="text-gray-500 text-lg">No tienes citas agendadas</p>
              <p className="text-gray-400 mt-2">Selecciona un servicio y horario para agendar tu primera cita</p>
            </div>
          ) : (
            <div className="space-y-4">
              {misReservas.map((reserva) => (
                <div
                  key={reserva._id}
                  className={`p-4 rounded-xl border-2 transition-colors ${
                    reserva.estado === 'confirmada'
                      ? 'border-green-200 bg-green-50 hover:bg-green-100'
                      : 'border-red-200 bg-red-50 hover:bg-red-100'
                  }`}
                >
                  <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-3">
                        <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                          reserva.estado === 'confirmada'
                            ? 'bg-green-100 text-green-800'
                            : 'bg-red-100 text-red-800'
                        }`}>
                          {reserva.estado === 'confirmada' ? '✅ Confirmada' : '❌ Cancelada'}
                        </span>
                        <span className="text-sm text-gray-500">
                          ID: {reserva._id.slice(-6)}
                        </span>
                      </div>
                      
                      <h3 className="font-bold text-lg text-gray-800 mb-2">
                        {reserva.servicioNombre || serviceDurations[reserva.servicio]?.nombre}
                      </h3>
                      
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                        <div className="flex items-center gap-2">
                          <Calendar className="w-4 h-4 text-gray-400 flex-shrink-0" />
                          <div>
                            <p className="text-sm text-gray-500">Fecha</p>
                            <p className="font-medium text-gray-700">
                              {reserva.fechaLegible || reserva.fecha}
                            </p>
                          </div>
                        </div>
                        
                        <div className="flex items-center gap-2">
                          <Clock className="w-4 h-4 text-gray-400 flex-shrink-0" />
                          <div>
                            <p className="text-sm text-gray-500">Horario</p>
                            <p className="font-medium text-gray-700">
                              {reserva.horaInicio} - {reserva.horaFin} ({reserva.duracion} min)
                            </p>
                          </div>
                        </div>
                        
                        <div className="flex items-center gap-2">
                          <div className="w-4 h-4 text-gray-400 flex-shrink-0">💰</div>
                          <div>
                            <p className="text-sm text-gray-500">Precio</p>
                            <p className="font-medium text-gray-700">
                              ${serviceDurations[reserva.servicio]?.precio || '---'} MXN
                            </p>
                          </div>
                        </div>
                      </div>
                    </div>
                    
                    {reserva.estado === 'confirmada' && (
                      <div className="flex gap-2">
                        <button
                          onClick={() => cancelarReserva(reserva._id)}
                          className="px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors font-medium text-sm whitespace-nowrap"
                          disabled={loading}
                        >
                          Cancelar Cita
                        </button>
                      </div>
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