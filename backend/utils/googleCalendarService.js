import { google } from 'googleapis';

// ─── Autenticación con Service Account ─────────────────────────────────────
// Se usa Service Account para que los eventos se agreguen DIRECTAMENTE
// al calendario del salón sin que el usuario tenga que autorizarse cada vez.
// Descarga el JSON de Service Account desde Google Cloud Console →
// APIs & Services → Credentials → Service Accounts → Create → Keys → JSON
// y pégalo en la variable de entorno GOOGLE_SERVICE_ACCOUNT_JSON

const getGoogleAuth = () => {
  const serviceAccountJson = process.env.GOOGLE_SERVICE_ACCOUNT_JSON;

  if (!serviceAccountJson) {
    throw new Error('❌ GOOGLE_SERVICE_ACCOUNT_JSON no configurada en .env');
  }

  const credentials = JSON.parse(serviceAccountJson);

  const auth = new google.auth.GoogleAuth({
    credentials,
    scopes: ['https://www.googleapis.com/auth/calendar']
  });

  return auth;
};

// ─── Crear evento en Google Calendar ────────────────────────────────────────
// calendarId: ID del calendario donde se agregarán los eventos
//   - Para el calendario principal del salón usa: el email del service account
//     O un calendar ID específico que puedas crear en Google Calendar
//   - Se configura en GOOGLE_CALENDAR_ID en .env
export const crearEventoCalendar = async (reserva) => {
  try {
    const auth        = getGoogleAuth();
    const calendar    = google.calendar({ version: 'v3', auth });
    const calendarId  = process.env.GOOGLE_CALENDAR_ID || 'primary';

    // Construir dateTime en formato ISO 8601 con zona horaria
    // reserva.fecha = "2026-02-15"  |  reserva.horaInicio = "14:00"
    const startDateTime = `${reserva.fecha}T${reserva.horaInicio}:00`;
    const endDateTime   = `${reserva.fecha}T${reserva.horaFin}:00`;

    // Nombres de servicios para el título
    const serviciosNombres = {
      'unas-gel':       'Uñas de Gel',
      'unas-acrilicas': 'Uñas Acrílicas',
      'pedicure':       'Pedicure Premium',
      'keratina':       'Tratamiento de Keratina',
      'tinte':          'Tinte Profesional',
      'pestanas':       'Extensión de Pestaña',
      'cejas':          'Diseño de Cejas'
    };

    const servicioNombre = serviciosNombres[reserva.servicio] || reserva.servicio;

    const event = {
      summary:     `🌸 ${servicioNombre} — ${reserva.nombreCliente}`,
      description:
        `Cliente: ${reserva.nombreCliente}\n` +
        `Teléfono: ${reserva.telefonoCliente}\n` +
        `Servicio: ${servicioNombre}\n` +
        `Precio: $${reserva.precio || ''} MXN\n` +
        `ID Reserva: ${reserva._id}`,
      location:    'Soumaya Beauty Bar',
      start: {
        dateTime: startDateTime,
        timeZone: 'America/Mexico_City'
      },
      end: {
        dateTime: endDateTime,
        timeZone: 'America/Mexico_City'
      },
      colorId: '9' // Grape/morado para el salón
    };

    const result = await calendar.events.insert({
      calendarId,
      resource: event
    });

    console.log('✅ Evento creado en Google Calendar:', result.data.htmlLink);

    // Retornar el eventId para poder eliminarlo después si se cancela
    return {
      success: true,
      eventId: result.data.id,
      htmlLink: result.data.htmlLink
    };

  } catch (error) {
    console.error('❌ Error creando evento en Google Calendar:', error.message);
    return { success: false, error: error.message };
  }
};

// ─── Eliminar evento de Google Calendar (al cancelar reserva) ───────────────
export const eliminarEventoCalendar = async (eventId) => {
  try {
    if (!eventId) {
      console.warn('⚠️ No se proporcionó eventId para eliminar');
      return { success: false };
    }

    const auth        = getGoogleAuth();
    const calendar    = google.calendar({ version: 'v3', auth });
    const calendarId  = process.env.GOOGLE_CALENDAR_ID || 'primary';

    await calendar.events.delete({
      calendarId,
      eventId
    });

    console.log('✅ Evento eliminado de Google Calendar:', eventId);
    return { success: true };

  } catch (error) {
    console.error('❌ Error eliminando evento de Google Calendar:', error.message);
    return { success: false, error: error.message };
  }
};