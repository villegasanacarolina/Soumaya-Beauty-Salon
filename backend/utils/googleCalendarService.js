import { google } from 'googleapis';

// ═══════════════════════════════════════════════════════════════════════════
// AUTENTICACIÓN DE GOOGLE
// ═══════════════════════════════════════════════════════════════════════════
const getGoogleAuth = () => {
  try {
    console.log('🔐 Obteniendo autenticación Google...');
    const serviceAccountJson = process.env.GOOGLE_SERVICE_ACCOUNT_JSON;
    
    if (!serviceAccountJson) {
      console.error('❌ GOOGLE_SERVICE_ACCOUNT_JSON no configurada');
      throw new Error('GOOGLE_SERVICE_ACCOUNT_JSON no configurada');
    }
    
    const credentials = JSON.parse(serviceAccountJson);
    
    const auth = new google.auth.GoogleAuth({
      credentials: credentials,
      scopes: ['https://www.googleapis.com/auth/calendar']
    });
    
    console.log('✅ Autenticación Google obtenida');
    return auth;
  } catch (error) {
    console.error('❌ ERROR autenticación Google:', error.message);
    throw error;
  }
};

// ═══════════════════════════════════════════════════════════════════════════
// CREAR EVENTO EN GOOGLE CALENDAR
// ═══════════════════════════════════════════════════════════════════════════
export const crearEventoCalendar = async (reserva) => {
  try {
    console.log('📅 ========== CREANDO EVENTO EN GOOGLE CALENDAR ==========');
    console.log('🆔 ID Reserva:', reserva._id);
    console.log('👤 Cliente:', reserva.nombreCliente);
    console.log('📱 Teléfono:', reserva.telefonoCliente);
    console.log('💅 Servicio:', reserva.servicio);
    console.log('📅 Fecha:', reserva.fecha);
    console.log('⏰ Hora:', `${reserva.horaInicio} - ${reserva.horaFin}`);
    
    const auth = getGoogleAuth();
    const calendar = google.calendar({ version: 'v3', auth });
    
    // Usar calendario principal o el configurado
    const calendarId = process.env.GOOGLE_CALENDAR_ID || 'primary';
    console.log('📅 Calendar ID:', calendarId);
    
    // Mapeo de servicios
    const serviciosNombres = {
      'unas-gel': 'Uñas de Gel',
      'unas-acrilicas': 'Uñas Acrílicas',
      'pedicure': 'Pedicure Premium',
      'keratina': 'Tratamiento de Keratina',
      'tinte': 'Tinte Profesional',
      'pestanas': 'Extensión de Pestaña',
      'cejas': 'Diseño de Cejas'
    };
    
    const servicioNombre = serviciosNombres[reserva.servicio] || reserva.servicio;
    console.log('💅 Nombre del servicio:', servicioNombre);
    
    // Formatear fechas para Google Calendar (IMPORTANTE: timezone)
    const startDateTime = `${reserva.fecha}T${reserva.horaInicio}:00`;
    const endDateTime = `${reserva.fecha}T${reserva.horaFin}:00`;
    
    console.log('⏰ Start DateTime:', startDateTime);
    console.log('⏰ End DateTime:', endDateTime);
    console.log('🌎 Timezone:', 'America/Mexico_City');
    
    // Crear descripción detallada
    const description = `💅 SERVICIO: ${servicioNombre}
👤 CLIENTE: ${reserva.nombreCliente}
📱 TELÉFONO: ${reserva.telefonoCliente}
📅 FECHA: ${reserva.fecha}
⏰ HORA: ${reserva.horaInicio} - ${reserva.horaFin} (${reserva.duracion} min)
💰 PRECIO: $${reserva.precio} MXN
🆔 ID RESERVA: ${reserva._id}

📍 SOUMAYA BEAUTY BAR

---
Creado automáticamente por el sistema de reservas.`;
    
    console.log('📝 Descripción creada');
    
    // Configurar evento
    const event = {
      summary: `🌸 ${servicioNombre} - ${reserva.nombreCliente}`,
      description: description,
      location: 'Soumaya Beauty Bar',
      start: {
        dateTime: startDateTime,
        timeZone: 'America/Mexico_City'
      },
      end: {
        dateTime: endDateTime,
        timeZone: 'America/Mexico_City'
      },
      reminders: {
        useDefault: false,
        overrides: [
          { method: 'email', minutes: 60 },
          { method: 'popup', minutes: 30 }
        ]
      },
      colorId: '11', // Color rosa
      guestsCanInviteOthers: false,
      guestsCanModify: false,
      guestsCanSeeOtherGuests: false
    };
    
    console.log('📋 Evento configurado, insertando en Google Calendar...');
    
    // Insertar evento
    const result = await calendar.events.insert({
      calendarId: calendarId,
      resource: event,
      sendUpdates: 'none'
    });
    
    console.log('✅ ========== EVENTO CREADO EXITOSAMENTE ==========');
    console.log('🆔 Event ID:', result.data.id);
    console.log('🔗 Enlace:', result.data.htmlLink);
    console.log('📅 Título:', result.data.summary);
    console.log('⏰ Inicio:', result.data.start.dateTime);
    console.log('⏰ Fin:', result.data.end.dateTime);
    console.log('====================================================');
    
    return {
      success: true,
      eventId: result.data.id,
      htmlLink: result.data.htmlLink,
      data: {
        summary: result.data.summary,
        start: result.data.start.dateTime,
        end: result.data.end.dateTime,
        description: result.data.description
      }
    };
    
  } catch (error) {
    console.error('❌ ========== ERROR CREANDO EVENTO GOOGLE CALENDAR ==========');
    console.error('📌 Tipo de error:', error.name);
    console.error('📌 Mensaje:', error.message);
    console.error('📌 Código:', error.code);
    
    if (error.response) {
      console.error('📌 Status:', error.response.status);
      console.error('📌 Data:', JSON.stringify(error.response.data, null, 2));
    }
    
    console.error('❌ Stack trace:', error.stack);
    console.error('=============================================================');
    
    return {
      success: false,
      error: error.message,
      details: error.response?.data || null
    };
  }
};

// ═══════════════════════════════════════════════════════════════════════════
// ELIMINAR EVENTO DE GOOGLE CALENDAR
// ═══════════════════════════════════════════════════════════════════════════
export const eliminarEventoCalendar = async (eventId) => {
  try {
    if (!eventId) {
      console.warn('⚠️ No hay eventId para eliminar');
      return { success: false, error: 'No eventId' };
    }
    
    console.log('🗑️ ========== ELIMINANDO EVENTO DE GOOGLE CALENDAR ==========');
    console.log('🆔 Event ID:', eventId);
    
    const auth = getGoogleAuth();
    const calendar = google.calendar({ version: 'v3', auth });
    const calendarId = process.env.GOOGLE_CALENDAR_ID || 'primary';
    
    await calendar.events.delete({
      calendarId: calendarId,
      eventId: eventId
    });
    
    console.log('✅ Evento eliminado de Google Calendar');
    console.log('===================================================');
    return { success: true };
    
  } catch (error) {
    console.error('❌ ERROR eliminando evento Google Calendar:', error.message);
    
    // Si el evento ya no existe, considerarlo éxito
    if (error.code === 404) {
      console.log('ℹ️ Evento ya no existe en Google Calendar');
      return { success: true };
    }
    
    return {
      success: false,
      error: error.message
    };
  }
};

// ═══════════════════════════════════════════════════════════════════════════
// VERIFICAR CONEXIÓN CON GOOGLE CALENDAR
// ═══════════════════════════════════════════════════════════════════════════
export const verificarConexionCalendar = async () => {
  try {
    console.log('🔍 Verificando conexión con Google Calendar...');
    
    const auth = getGoogleAuth();
    const calendar = google.calendar({ version: 'v3', auth });
    const calendarId = process.env.GOOGLE_CALENDAR_ID || 'primary';
    
    // Intentar obtener la lista de calendarios
    const response = await calendar.calendarList.list();
    
    console.log('✅ Conexión exitosa con Google Calendar');
    console.log(`📅 Calendarios disponibles: ${response.data.items.length}`);
    
    // Verificar si podemos acceder al calendario especificado
    if (calendarId !== 'primary') {
      const calendario = response.data.items.find(item => item.id === calendarId);
      if (calendario) {
        console.log(`✅ Calendario encontrado: ${calendario.summary}`);
      } else {
        console.warn(`⚠️ Calendario ${calendarId} no encontrado. Usando primary.`);
      }
    }
    
    return {
      success: true,
      calendarios: response.data.items.length
    };
    
  } catch (error) {
    console.error('❌ ERROR verificando conexión Google Calendar:', error.message);
    return {
      success: false,
      error: error.message
    };
  }
};

// ═══════════════════════════════════════════════════════════════════════════
// OBTENER TODOS LOS EVENTOS DEL CALENDARIO (próximos 30 días)
// ═══════════════════════════════════════════════════════════════════════════
export const obtenerEventosCalendar = async () => {
  try {
    console.log('📅 Obteniendo eventos de Google Calendar...');
    
    const auth = getGoogleAuth();
    const calendar = google.calendar({ version: 'v3', auth });
    const calendarId = process.env.GOOGLE_CALENDAR_ID || 'primary';
    
    // Obtener eventos de los próximos 30 días
    const now = new Date();
    const futuro = new Date();
    futuro.setDate(futuro.getDate() + 30);
    
    const response = await calendar.events.list({
      calendarId: calendarId,
      timeMin: now.toISOString(),
      timeMax: futuro.toISOString(),
      singleEvents: true,
      orderBy: 'startTime',
      maxResults: 100
    });
    
    const eventos = response.data.items || [];
    
    console.log(`📅 ${eventos.length} eventos encontrados en Google Calendar`);
    
    return {
      success: true,
      eventos: eventos.map(evento => ({
        id: evento.id,
        summary: evento.summary,
        description: evento.description,
        start: evento.start?.dateTime || evento.start?.date,
        end: evento.end?.dateTime || evento.end?.date,
        created: evento.created,
        location: evento.location
      }))
    };
    
  } catch (error) {
    console.error('❌ ERROR obteniendo eventos:', error.message);
    return {
      success: false,
      error: error.message,
      eventos: []
    };
  }
};

// ═══════════════════════════════════════════════════════════════════════════
// OBTENER EVENTOS POR FECHA ESPECÍFICA
// ═══════════════════════════════════════════════════════════════════════════
export const obtenerEventosPorFecha = async (fecha) => {
  try {
    const auth = getGoogleAuth();
    const calendar = google.calendar({ version: 'v3', auth });
    const calendarId = process.env.GOOGLE_CALENDAR_ID || 'primary';
    
    const startDateTime = `${fecha}T00:00:00-06:00`;
    const endDateTime = `${fecha}T23:59:59-06:00`;
    
    const response = await calendar.events.list({
      calendarId: calendarId,
      timeMin: startDateTime,
      timeMax: endDateTime,
      singleEvents: true,
      orderBy: 'startTime'
    });
    
    const eventos = response.data.items || [];
    
    console.log(`📅 ${eventos.length} eventos encontrados para ${fecha}`);
    
    return {
      success: true,
      eventos: eventos.map(evento => ({
        id: evento.id,
        summary: evento.summary,
        description: evento.description,
        start: evento.start?.dateTime || evento.start?.date,
        end: evento.end?.dateTime || evento.end?.date,
        created: evento.created
      }))
    };
    
  } catch (error) {
    console.error('❌ ERROR obteniendo eventos:', error.message);
    return {
      success: false,
      error: error.message
    };
  }
};

// ═══════════════════════════════════════════════════════════════════════════
// VERIFICAR SI UN EVENTO EXISTE
// ═══════════════════════════════════════════════════════════════════════════
export const verificarEventoExiste = async (eventId) => {
  try {
    if (!eventId) {
      return { exists: false };
    }
    
    const auth = getGoogleAuth();
    const calendar = google.calendar({ version: 'v3', auth });
    const calendarId = process.env.GOOGLE_CALENDAR_ID || 'primary';
    
    const response = await calendar.events.get({
      calendarId: calendarId,
      eventId: eventId
    });
    
    return {
      exists: true,
      evento: response.data
    };
    
  } catch (error) {
    if (error.code === 404) {
      return { exists: false };
    }
    console.error('❌ ERROR verificando evento:', error.message);
    return { exists: false, error: error.message };
  }
};