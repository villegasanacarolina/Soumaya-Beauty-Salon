import { google } from 'googleapis';

// Obtener autenticación
const getGoogleAuth = () => {
  try {
    const serviceAccountJson = process.env.GOOGLE_SERVICE_ACCOUNT_JSON;
    
    if (!serviceAccountJson) {
      throw new Error('GOOGLE_SERVICE_ACCOUNT_JSON no configurada');
    }
    
    const credentials = JSON.parse(serviceAccountJson);
    
    const auth = new google.auth.GoogleAuth({
      credentials: credentials,
      scopes: ['https://www.googleapis.com/auth/calendar']
    });
    
    return auth;
  } catch (error) {
    console.error('❌ ERROR autenticación Google:', error.message);
    throw error;
  }
};

// CREAR EVENTO EN GOOGLE CALENDAR
export const crearEventoCalendar = async (reserva) => {
  try {
    console.log('📅 Creando evento en Google Calendar...');
    
    const auth = getGoogleAuth();
    const calendar = google.calendar({ version: 'v3', auth });
    
    // Usar calendario principal
    const calendarId = process.env.GOOGLE_CALENDAR_ID || 'primary';
    
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
    
    // Formatear fechas para Google Calendar
    const startDateTime = `${reserva.fecha}T${reserva.horaInicio}:00`;
    const endDateTime = `${reserva.fecha}T${reserva.horaFin}:00`;
    
    // Crear descripción detallada
    const description = `
💅 SERVICIO: ${servicioNombre}
👤 CLIENTE: ${reserva.nombreCliente}
📱 TELÉFONO: ${reserva.telefonoCliente}
📅 FECHA: ${reserva.fecha}
⏰ HORA: ${reserva.horaInicio} - ${reserva.horaFin}
⏳ DURACIÓN: ${reserva.duracion} minutos
💰 PRECIO: $${reserva.precio} MXN
🆔 ID RESERVA: ${reserva._id}

📍 SOUMAYA BEAUTY BAR

---
Creado automáticamente por el sistema de reservas.
    `.trim();
    
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
          { method: 'popup', minutes: 60 },
          { method: 'popup', minutes: 30 }
        ]
      },
      colorId: '9', // Color morado
      guestsCanInviteOthers: false,
      guestsCanModify: false,
      guestsCanSeeOtherGuests: false
    };
    
    console.log('📝 Datos del evento:');
    console.log('- Cliente:', reserva.nombreCliente);
    console.log('- Servicio:', servicioNombre);
    console.log('- Fecha:', reserva.fecha);
    console.log('- Hora:', `${reserva.horaInicio} - ${reserva.horaFin}`);
    console.log('- Calendario:', calendarId);
    
    // Insertar evento
    const result = await calendar.events.insert({
      calendarId: calendarId,
      resource: event,
      sendUpdates: 'none'
    });
    
    console.log('✅ Evento creado en Google Calendar');
    console.log('🆔 Event ID:', result.data.id);
    console.log('🔗 Enlace:', result.data.htmlLink);
    
    return {
      success: true,
      eventId: result.data.id,
      htmlLink: result.data.htmlLink,
      data: {
        summary: result.data.summary,
        start: result.data.start,
        end: result.data.end,
        description: result.data.description
      }
    };
    
  } catch (error) {
    console.error('❌ ERROR creando evento Google Calendar:');
    console.error('Mensaje:', error.message);
    
    // Información adicional para debugging
    if (error.code === 401) {
      console.error('⚠️ Error de autenticación. Verifica las credenciales.');
    } else if (error.code === 403) {
      console.error('⚠️ Error de permisos. Verifica los scopes.');
    } else if (error.code === 404) {
      console.error('⚠️ Calendario no encontrado.');
    }
    
    return {
      success: false,
      error: error.message,
      details: error.response?.data || null
    };
  }
};

// ELIMINAR EVENTO DE GOOGLE CALENDAR
export const eliminarEventoCalendar = async (eventId) => {
  try {
    if (!eventId) {
      console.warn('⚠️ No hay eventId para eliminar');
      return { success: false, error: 'No eventId' };
    }
    
    console.log('🗑️ Eliminando evento de Google Calendar:', eventId);
    
    const auth = getGoogleAuth();
    const calendar = google.calendar({ version: 'v3', auth });
    const calendarId = process.env.GOOGLE_CALENDAR_ID || 'primary';
    
    await calendar.events.delete({
      calendarId: calendarId,
      eventId: eventId
    });
    
    console.log('✅ Evento eliminado de Google Calendar');
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

// VERIFICAR CONEXIÓN CON GOOGLE CALENDAR
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

// OBTENER EVENTOS DE UNA FECHA
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