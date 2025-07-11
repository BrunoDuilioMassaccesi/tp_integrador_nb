const pool = require('../db');

const registerEnrollment = async (req, res) => {
  const eventId = req.params.id;
  const userId = req.user.id;

  try {
    // Verificar que el evento exista
    const eventQuery = 'SELECT * FROM event WHERE id = $1';
    const eventResult = await pool.query(eventQuery, [eventId]);
    if (eventResult.rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Evento no encontrado.' });
    }
    const event = eventResult.rows[0];

    // Verificar capacidad máxima
    const enrollmentCountQuery = 'SELECT COUNT(*) FROM event_enrollment WHERE id_event = $1';
    const enrollmentCountResult = await pool.query(enrollmentCountQuery, [eventId]);
    const currentEnrollment = parseInt(enrollmentCountResult.rows[0].count);
    if (currentEnrollment >= event.max_assistance) {
      return res.status(400).json({ success: false, message: 'Capacidad máxima del evento alcanzada.' });
    }

    // Verificar fecha del evento
    const now = new Date();
    const eventDate = new Date(event.start_date);
    if (eventDate <= now) {
      return res.status(400).json({ success: false, message: 'No se puede registrar a un evento que ya sucedió o es hoy.' });
    }

    // Verificar si está habilitado para inscripción
    if (!event.enabled_for_enrollment) {
      return res.status(400).json({ success: false, message: 'El evento no está habilitado para inscripción.' });
    }

    // Verificar si el usuario ya está registrado
    const userEnrollmentQuery = 'SELECT * FROM event_enrollment WHERE id_event = $1 AND id_user = $2';
    const userEnrollmentResult = await pool.query(userEnrollmentQuery, [eventId, userId]);
    if (userEnrollmentResult.rows.length > 0) {
      return res.status(400).json({ success: false, message: 'El usuario ya está registrado en el evento.' });
    }

    // Registrar inscripción
    const insertEnrollmentQuery = `
      INSERT INTO event_enrollment (id_event, id_user, registration_date_time)
      VALUES ($1, $2, NOW())
    `;
    await pool.query(insertEnrollmentQuery, [eventId, userId]);

    res.status(201).json({ success: true, message: 'Inscripción realizada correctamente.' });
  } catch (error) {
    console.error('Error registrando inscripción:', error);
    res.status(500).json({ success: false, message: 'Error interno del servidor' });
  }
};

const removeEnrollment = async (req, res) => {
  const eventId = req.params.id;
  const userId = req.user.id;

  try {
    // Verificar que el evento exista
    const eventQuery = 'SELECT * FROM event WHERE id = $1';
    const eventResult = await pool.query(eventQuery, [eventId]);
    if (eventResult.rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Evento no encontrado.' });
    }
    const event = eventResult.rows[0];

    // Verificar fecha del evento
    const now = new Date();
    const eventDate = new Date(event.start_date);
    if (eventDate <= now) {
      return res.status(400).json({ success: false, message: 'No se puede remover inscripción de un evento que ya sucedió o es hoy.' });
    }

    // Verificar si el usuario está registrado
    const userEnrollmentQuery = 'SELECT * FROM event_enrollment WHERE id_event = $1 AND id_user = $2';
    const userEnrollmentResult = await pool.query(userEnrollmentQuery, [eventId, userId]);
    if (userEnrollmentResult.rows.length === 0) {
      return res.status(400).json({ success: false, message: 'El usuario no está registrado en el evento.' });
    }

    // Eliminar inscripción
    const deleteEnrollmentQuery = 'DELETE FROM event_enrollment WHERE id_event = $1 AND id_user = $2';
    await pool.query(deleteEnrollmentQuery, [eventId, userId]);

    res.status(200).json({ success: true, message: 'Inscripción removida correctamente.' });
  } catch (error) {
    console.error('Error removiendo inscripción:', error);
    res.status(500).json({ success: false, message: 'Error interno del servidor' });
  }
};

module.exports = {
  registerEnrollment,
  removeEnrollment,
};
