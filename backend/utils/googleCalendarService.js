import { google } from 'googleapis';

// ═══════════════════════════════════════════════════════════════════════════
// CONFIGURACIÓN Y AUTENTICACIÓN
// ═══════════════════════════════════════════════════════════════════════════

let authClient = null;

const getGoogleAuth = () => {
  try {
    // Si ya tenemos un cliente autenticado, reutilizarlo
    if (authClient) {
      return authClient;
    }
    
    console.log('🔐 Obteniendo autenticación Google...');
    
    const serviceAccountJson = process.env.GOOGLE_SERVICE_ACCOUNT_JSON;
    
    if (!serviceAccountJson) {
      console.error('❌ GOOGLE_SERVICE_ACCOUNT_JSON no está configurada');
      console.error('');
      console.error('📋 Para configurarla:');
      console.error('   1. Ve a Google Cloud Console → IAM → Cuentas de servicio');
      console.error('   2. Crea/usa una cuenta de servicio');
      console.error('   3. Genera una clave JSON');
      console.error('   4. Configura la variable de entorno con el contenido del JSON');
      throw new Error('GOOGLE_SERVICE_ACCOUNT_JSON no configurada');
    }
    
    // Verificar que el JSON sea válido
    let credentials;
    try {
      credentials = JSON.parse(serviceAccountJson);
    } catch (parseError) {
      console.error('❌ El JSON de la cuenta de servicio es inválido');
      console.error('   Error:', parseError.message);
      throw new Error('JSON de cuenta de servicio inválido');
    }
    
    // Verificar campos requeridos
    if (!credentials.client_email || !credentials.private_key) {
      console.error('❌ El JSON no contiene client_email o private_key');
      throw new Error('JSON de cuenta de servicio incompleto');
    }
    
    console.log(`📧 Cuenta de servicio: ${credentials.client_email}`);
    
    authClient = new google.auth.GoogleAuth({
      credentials: credentials,
      scopes: ['https://www.googleapis.com/auth/calendar']
    });
    
    console.log('✅ Autenticación Google obtenida');
    return authClient;
    
  } catch (error) {
    console.error('❌ ERROR en autenticación Google:', error.message);
    throw error;
  }
};

// ═══════════════════════════════════════════════════════════════════════════
// CREAR EVENTO EN GOOGLE CALENDAR
// ═══════════════════════════════════════════════════════════════════════════

export const crearEventoCalendar = async (reserva) => {
  try {
    console.log('');
    console.log('📅 ═══════════════════════════════════════════════════════');
    console.log('📅 CREANDO EVENTO EN GOOGLE CALENDAR');
    console.log('📅 ═══════════════════════════════════════════════════════');
    console.log('🆔 ID Reserva:', reserva._id);
    console.log('👤 Cliente:', reserva.nombreCliente);
    console.log('📱 Teléfono:', reserva.telefonoCliente);
    console.log('💅 Servicio:', reserva.servicio);
    console.log('📅 Fecha:', reserva.fecha);
    console.log('⏰ Hora:', `${reserva.horaInicio} - ${reserva.horaFin}`);
    
    // Obtener autenticación
    const auth = getGoogleAuth();
    const calendar = google.calendar({ version: 'v3', auth });
    
    // Obtener ID del calendario
    const calendarId = process.env.GOOGLE_CALENDAR_ID || 'primary';
    console.log('📅 Calendar ID:', calendarId);
    
    // Mapeo de servicios a nombres legibles
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
    // IMPORTANTE: Usar el formato correcto con timezone
    const startDateTime = `${reserva.fecha}T${reserva.horaInicio}:00`;
    const endDateTime = `${reserva.fecha}T${reserva.horaFin}:00`;
    
    console.log('⏰ Start:', startDateTime);
    console.log('⏰ End:', endDateTime);
    
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
    
    // Configurar el evento
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
      colorId: '11'
    };
    
    console.log('📋 Insertando evento...');
    
    // Insertar el evento
    const result = await calendar.events.insert({
      calendarId: calendarId,
      resource: event,
      sendUpdates: 'none'
    });
    
    console.log('');
    console.log('✅ ═══════════════════════════════════════════════════════');
    console.log('✅ EVENTO CREADO EXITOSAMENTE');
    console.log('✅ ═══════════════════════════════════════════════════════');
    console.log('🆔 Event ID:', result.data.id);
    console.log('🔗 Link:', result.data.htmlLink);
    console.log('📅 Título:', result.data.summary);
    console.log('');
    
    return {
      success: true,
      eventId: result.data.id,
      htmlLink: result.data.htmlLink,
      data: {
        summary: result.data.summary,
        start: result.data.start.dateTime,
        end: result.data.end.dateTime
      }
    };
    
  } catch (error) {
    console.error('');
    console.error('❌ ═══════════════════════════════════════════════════════');
    console.error('❌ ERROR CREANDO EVENTO EN GOOGLE CALENDAR');
    console.error('❌ ═══════════════════════════════════════════════════════');
    console.error('📌 Tipo:', error.name);
    console.error('📌 Mensaje:', error.message);
    console.error('📌 Código:', error.code);
    
    // Errores específicos de Google Calendar
    if (error.code === 401) {
      console.error('');
      console.error('📋 ERROR 401 - No autenticado');
      console.error('   El JSON de la cuenta de servicio es inválido o ha expirado.');
      console.error('   Genera una nueva clave en Google Cloud Console.');
    }
    
    if (error.code === 403) {
      console.error('');
      console.error('📋 ERROR 403 - Sin permisos');
      console.error('   La cuenta de servicio no tiene acceso al calendario.');
      console.error('   SOLUCIÓN:');
      console.error('   1. Abre Google Calendar en el navegador');
      console.error('   2. Ve a Configuración del calendario');
      console.error('   3. Busca "Compartir con personas específicas"');
      console.error('   4. Agrega el email de la cuenta de servicio');
      console.error('   5. Selecciona "Hacer cambios en eventos"');
    }
    
    if (error.code === 404) {
      console.error('');
      console.error('📋 ERROR 404 - Calendario no encontrado');
      console.error('   El GOOGLE_CALENDAR_ID es incorrecto.');
      console.error('   Usa "primary" o el ID correcto de tu calendario.');
    }
    
    if (error.response?.data) {
      console.error('');
      console.error('📋 Respuesta de Google:');
      console.error(JSON.stringify(error.response.data, null, 2));
    }
    
    console.error('');
    
    return {
      success: false,
      error: error.message,
      code: error.code,
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
    
    console.log('🗑️ Eliminando evento de Google Calendar:', eventId);
    
    const auth = getGoogleAuth();
    const calendar = google.calendar({ version: 'v3', auth });
    const calendarId = process.env.GOOGLE_CALENDAR_ID || 'primary';
    
    await calendar.events.delete({
      calendarId: calendarId,
      eventId: eventId
    });
    
    console.log('✅ Evento eliminado');
    return { success: true };
    
  } catch (error) {
    console.error('❌ ERROR eliminando evento:', error.message);
    
    // Si el evento ya no existe, considerarlo éxito
    if (error.code === 404 || error.code === 410) {
      console.log('ℹ️ El evento ya no existía');
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
    
    // Intentar obtener info del calendario
    const response = await calendar.calendars.get({
      calendarId: calendarId
    });
    
    console.log('✅ Conexión exitosa');
    console.log(`📅 Calendario: ${response.data.summary}`);
    console.log(`🆔 ID: ${response.data.id}`);
    console.log(`🌎 Timezone: ${response.data.timeZone}`);
    
    return {
      success: true,
      calendario: response.data.summary,
      id: response.data.id,
      timezone: response.data.timeZone
    };
    
  } catch (error) {
    console.error('❌ ERROR verificando conexión:', error.message);
    
    if (error.code === 404) {
      console.error('   El calendario no existe o no tienes acceso.');
    }
    
    return {
      success: false,
      error: error.message,
      code: error.code
    };
  }
};

// ═══════════════════════════════════════════════════════════════════════════
// OBTENER TODOS LOS EVENTOS DEL CALENDARIO
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
    console.log(`📅 ${eventos.length} eventos encontrados`);
    
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
// OBTENER EVENTOS POR FECHA
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
    console.log(`📅 ${eventos.length} eventos para ${fecha}`);
    
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