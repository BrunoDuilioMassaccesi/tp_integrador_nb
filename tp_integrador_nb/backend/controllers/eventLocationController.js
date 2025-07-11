const pool = require('../db');

const listEventLocations = async (req, res) => {
  const userId = req.user.id;
  const { limit = 15, offset = 0 } = req.query;

  try {
    const query = `
      SELECT el.*, 
        json_build_object(
          'id', l.id,
          'name', l.name,
          'id_province', l.id_province,
          'latitude', l.latitude,
          'longitude', l.longitude,
          'province', json_build_object(
            'id', p.id,
            'name', p.name,
            'full_name', p.full_name,
            'latitude', p.latitude,
            'longitude', p.longitude,
            'display_order', p.display_order
          )
        ) AS location
      FROM event_location el
      JOIN location l ON el.id_location = l.id
      JOIN province p ON l.id_province = p.id
      WHERE el.id_creator_user = $1
      ORDER BY el.id
      LIMIT $2 OFFSET $3
    `;
    const result = await pool.query(query, [userId, limit, offset]);

    const countQuery = `
      SELECT COUNT(*) AS total
      FROM event_location
      WHERE id_creator_user = $1
    `;
    const countResult = await pool.query(countQuery, [userId]);
    const total = countResult.rows[0].total;

    res.json({
      collection: result.rows,
      pagination: {
        limit: parseInt(limit),
        offset: parseInt(offset),
        total: parseInt(total),
      },
    });
  } catch (error) {
    console.error('Error listando event locations:', error);
    res.status(500).json({ success: false, message: 'Error interno del servidor' });
  }
};

const getEventLocationById = async (req, res) => {
  const userId = req.user.id;
  const { id } = req.params;

  try {
    const query = `
      SELECT el.*, 
        json_build_object(
          'id', l.id,
          'name', l.name,
          'id_province', l.id_province,
          'latitude', l.latitude,
          'longitude', l.longitude,
          'province', json_build_object(
            'id', p.id,
            'name', p.name,
            'full_name', p.full_name,
            'latitude', p.latitude,
            'longitude', p.longitude,
            'display_order', p.display_order
          )
        ) AS location
      FROM event_location el
      JOIN location l ON el.id_location = l.id
      JOIN province p ON l.id_province = p.id
      WHERE el.id = $1 AND el.id_creator_user = $2
    `;
    const result = await pool.query(query, [id, userId]);

    if (result.rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Event location no encontrada o no autorizada' });
    }

    res.json(result.rows[0]);
  } catch (error) {
    console.error('Error obteniendo event location:', error);
    res.status(500).json({ success: false, message: 'Error interno del servidor' });
  }
};

const createEventLocation = async (req, res) => {
  const userId = req.user.id;
  const { id_location, name, full_address, max_capacity, latitude, longitude } = req.body;

  if (!name || name.length < 3) {
    return res.status(400).json({ success: false, message: 'El campo name debe tener al menos 3 letras.' });
  }
  if (!full_address || full_address.length < 3) {
    return res.status(400).json({ success: false, message: 'El campo full_address debe tener al menos 3 letras.' });
  }
  if (max_capacity < 0) {
    return res.status(400).json({ success: false, message: 'El campo max_capacity no puede ser negativo.' });
  }

  try {
    // Verificar que la location exista
    const locationQuery = 'SELECT * FROM location WHERE id = $1';
    const locationResult = await pool.query(locationQuery, [id_location]);
    if (locationResult.rows.length === 0) {
      return res.status(400).json({ success: false, message: 'El id_location no existe.' });
    }

    const insertQuery = `
      INSERT INTO event_location (id_location, name, full_address, max_capacity, latitude, longitude, id_creator_user)
      VALUES ($1, $2, $3, $4, $5, $6, $7)
      RETURNING id
    `;
    const insertValues = [id_location, name, full_address, max_capacity, latitude, longitude, userId];
    const insertResult = await pool.query(insertQuery, insertValues);
    const eventLocationId = insertResult.rows[0].id;

    res.status(201).json({ success: true, message: 'Event location creada correctamente', eventLocationId });
  } catch (error) {
    console.error('Error creando event location:', error);
    res.status(500).json({ success: false, message: 'Error interno del servidor' });
  }
};

const updateEventLocation = async (req, res) => {
  const userId = req.user.id;
  const { id, id_location, name, full_address, max_capacity, latitude, longitude } = req.body;

  if (!id) {
    return res.status(400).json({ success: false, message: 'El campo id es obligatorio para actualizar.' });
  }
  if (!name || name.length < 3) {
    return res.status(400).json({ success: false, message: 'El campo name debe tener al menos 3 letras.' });
  }
  if (!full_address || full_address.length < 3) {
    return res.status(400).json({ success: false, message: 'El campo full_address debe tener al menos 3 letras.' });
  }
  if (max_capacity < 0) {
    return res.status(400).json({ success: false, message: 'El campo max_capacity no puede ser negativo.' });
  }

  try {
    // Verificar que la event_location exista y pertenezca al usuario
    const eventLocationQuery = 'SELECT * FROM event_location WHERE id = $1 AND id_creator_user = $2';
    const eventLocationResult = await pool.query(eventLocationQuery, [id, userId]);
    if (eventLocationResult.rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Event location no encontrada o no autorizada' });
    }

    // Verificar que la location exista
    const locationQuery = 'SELECT * FROM location WHERE id = $1';
    const locationResult = await pool.query(locationQuery, [id_location]);
    if (locationResult.rows.length === 0) {
      return res.status(400).json({ success: false, message: 'El id_location no existe.' });
    }

    // Actualizar event_location
    const updateQuery = `
      UPDATE event_location
      SET id_location = $1, name = $2, full_address = $3, max_capacity = $4, latitude = $5, longitude = $6
      WHERE id = $7
    `;
    const updateValues = [id_location, name, full_address, max_capacity, latitude, longitude, id];
    await pool.query(updateQuery, updateValues);

    res.status(200).json({ success: true, message: 'Event location actualizada correctamente' });
  } catch (error) {
    console.error('Error actualizando event location:', error);
    res.status(500).json({ success: false, message: 'Error interno del servidor' });
  }
};

const deleteEventLocation = async (req, res) => {
  const userId = req.user.id;
  const { id } = req.params;

  try {
    // Verificar que la event_location exista y pertenezca al usuario
    const eventLocationQuery = 'SELECT * FROM event_location WHERE id = $1 AND id_creator_user = $2';
    const eventLocationResult = await pool.query(eventLocationQuery, [id, userId]);
    if (eventLocationResult.rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Event location no encontrada o no autorizada' });
    }

    // Verificar que no existan eventos asociados
    const eventQuery = 'SELECT COUNT(*) FROM event WHERE id_event_location = $1';
    const eventResult = await pool.query(eventQuery, [id]);
    if (parseInt(eventResult.rows[0].count) > 0) {
      return res.status(400).json({ success: false, message: 'No se puede eliminar la event location porque tiene eventos asociados.' });
    }

    // Eliminar event_location
    await pool.query('DELETE FROM event_location WHERE id = $1', [id]);

    res.status(200).json({ success: true, message: 'Event location eliminada correctamente' });
  } catch (error) {
    console.error('Error eliminando event location:', error);
    res.status(500).json({ success: false, message: 'Error interno del servidor' });
  }
};

module.exports = {
  listEventLocations,
  getEventLocationById,
  createEventLocation,
  updateEventLocation,
  deleteEventLocation,
};
