import { google } from 'googleapis';

// ─── Autenticación con Service Account ─────────────────────────────────────
const getGoogleAuth = () => {
  const serviceAccountJson = process.env.GOOGLE_SERVICE_ACCOUNT_JSON;

  if (!serviceAccountJson) {
    throw new Error('❌ GOOGLE_SERVICE_ACCOUNT_JSON no configurada en .env');
  }

  try {
    const credentials = JSON.parse(serviceAccountJson);
    
    const auth = new google.auth.GoogleAuth({
      credentials,
      scopes: ['https://www.googleapis.com/auth/calendar']
    });

    return auth;
  } catch (error) {
    throw new Error(`❌ Error parseando GOOGLE_SERVICE_ACCOUNT_JSON: ${error.message}`);
  }
};

// ─── Verificar conexión con Google Calendar ────────────────────────────────
export const verificarConexionCalendar = async () => {
  try {
    const auth = getGoogleAuth();
    const calendar = google.calendar({ version: 'v3', auth });
    const calendarId = process.env.GOOGLE_CALENDAR_ID || 'primary';

    // Intentar obtener la lista de calendarios para verificar conexión
    const response = await calendar.calendarList.list();
    
    console.log('✅ Conexión con Google Calendar establecida');
    console.log(`📅 Calendarios disponibles: ${response.data.items.length}`);
    
    // Verificar si el calendario especificado existe
    const calendarioEspecifico = response.data.items.find(
      cal => cal.id === calendarId
    );
    
    if (calendarioEspecifico) {
      console.log(`✅ Calendario encontrado: ${calendarioEspecifico.summary}`);
    } else if (calendarId === 'primary') {
      console.log('✅ Usando calendario principal');
    } else {
      console.warn(`⚠️ Calendario con ID "${calendarId}" no encontrado. Usando primary.`);
    }
    
    return { success: true };
  } catch (error) {
    console.error('❌ Error verificando conexión con Google Calendar:', error.message);
    return { success: false, error: error.message };
  }
};

// ─── Crear evento en Google Calendar ────────────────────────────────────────
export const crearEventoCalendar = async (reserva) => {
  try {
    const auth = getGoogleAuth();
    const calendar = google.calendar({ version: 'v3', auth });
    const calendarId = process.env.GOOGLE_CALENDAR_ID || 'primary';

    // Construir dateTime en formato ISO 8601 con zona horaria
    const startDateTime = `${reserva.fecha}T${reserva.horaInicio}:00`;
    const endDateTime = `${reserva.fecha}T${reserva.horaFin}:00`;

    // Nombres de servicios para el título
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

    const event = {
      summary: `🌸 ${servicioNombre} — ${reserva.nombreCliente}`,
      description:
        `💅 *Servicio:* ${servicioNombre}\n` +
        `👤 *Cliente:* ${reserva.nombreCliente}\n` +
        `📱 *Teléfono:* ${reserva.telefonoCliente}\n` +
        `📅 *Fecha:* ${reserva.fecha}\n` +
        `⏰ *Hora:* ${reserva.horaInicio} - ${reserva.horaFin}\n` +
        `💰 *Precio:* $${reserva.precio || ''} MXN\n` +
        `🆔 *ID Reserva:* ${reserva._id}\n` +
        `🔗 *Sistema:* Soumaya Beauty Bar\n\n` +
        `_Evento creado automáticamente por el sistema de reservas_`,
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
          { method: 'popup', minutes: 60 }, // Recordatorio 1 hora antes
          { method: 'popup', minutes: 30 }  // Recordatorio 30 minutos antes
        ]
      },
      colorId: '9', // Grape/morado para el salón
      transparency: 'opaque',
      visibility: 'private'
    };

    console.log('📅 Creando evento en Google Calendar...');
    console.log('   Calendario:', calendarId);
    console.log('   Fecha:', reserva.fecha);
    console.log('   Hora:', `${reserva.horaInicio} - ${reserva.horaFin}`);
    console.log('   Cliente:', reserva.nombreCliente);

    const result = await calendar.events.insert({
      calendarId,
      resource: event,
      sendUpdates: 'all' // Notificar a los asistentes (si hubiera)
    });

    console.log('✅ Evento creado en Google Calendar:', result.data.id);
    console.log('   Enlace:', result.data.htmlLink);

    return {
      success: true,
      eventId: result.data.id,
      htmlLink: result.data.htmlLink,
      data: result.data
    };

  } catch (error) {
    console.error('❌ Error creando evento en Google Calendar:', error.message);
    
    // Error específico por credenciales inválidas
    if (error.message.includes('invalid_grant') || error.message.includes('unauthorized')) {
      console.error('⚠️ Posible problema con las credenciales de Service Account');
      console.error('   Verifica que el JSON de Service Account sea correcto');
      console.error('   Verifica que el calendario tenga permisos de escritura');
    }
    
    return { success: false, error: error.message };
  }
};

// ─── Eliminar evento de Google Calendar (al cancelar reserva) ───────────────
export const eliminarEventoCalendar = async (eventId) => {
  try {
    if (!eventId) {
      console.warn('⚠️ No se proporcionó eventId para eliminar');
      return { success: false, error: 'No eventId provided' };
    }

    const auth = getGoogleAuth();
    const calendar = google.calendar({ version: 'v3', auth });
    const calendarId = process.env.GOOGLE_CALENDAR_ID || 'primary';

    console.log('🗑️ Eliminando evento de Google Calendar...');
    console.log('   Event ID:', eventId);
    console.log('   Calendario:', calendarId);

    await calendar.events.delete({
      calendarId,
      eventId
    });

    console.log('✅ Evento eliminado de Google Calendar:', eventId);
    return { success: true };

  } catch (error) {
    console.error('❌ Error eliminando evento de Google Calendar:', error.message);
    
    // Si el error es que el evento no existe, igual es éxito (ya fue eliminado)
    if (error.message.includes('Not Found') || error.message.includes('404')) {
      console.log('ℹ️ Evento ya no existe en Google Calendar');
      return { success: true };
    }
    
    return { success: false, error: error.message };
  }
};

// ─── Obtener eventos de Google Calendar (para sincronización) ──────────────
export const obtenerEventosCalendar = async (fechaInicio, fechaFin) => {
  try {
    const auth = getGoogleAuth();
    const calendar = google.calendar({ version: 'v3', auth });
    const calendarId = process.env.GOOGLE_CALENDAR_ID || 'primary';

    const response = await calendar.events.list({
      calendarId,
      timeMin: fechaInicio ? new Date(fechaInicio).toISOString() : new Date().toISOString(),
      timeMax: fechaFin ? new Date(fechaFin).toISOString() : new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(), // 30 días
      singleEvents: true,
      orderBy: 'startTime'
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
        updated: evento.updated
      }))
    };

  } catch (error) {
    console.error('❌ Error obteniendo eventos de Google Calendar:', error.message);
    return { success: false, error: error.message };
  }
};