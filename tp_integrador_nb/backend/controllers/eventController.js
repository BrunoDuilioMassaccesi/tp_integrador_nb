const pool = require('../db');

const listEvents = async (req, res) => {
  const { name, startdate, tag, limit = 15, offset = 0 } = req.query;

  try {
    let baseQuery = `
      SELECT e.id, e.name, e.description, e.start_date, e.duration_in_minutes, e.price, e.enabled_for_enrollment, e.max_assistance,
             json_build_object(
               'id', el.id,
               'name', el.name,
               'full_address', el.full_address,
               'latitude', el.latitude,
               'longitude', el.longitude,
               'max_capacity', el.max_capacity,
               'location', json_build_object(
                 'id', l.id,
                 'name', l.name,
                 'latitude', l.latitude,
                 'longitude', l.longitude,
                 'province', json_build_object(
                   'id', p.id,
                   'name', p.name,
                   'full_name', p.full_name,
                   'latitude', p.latitude,
                   'longitude', p.longitude
                 )
               )
             ) AS event_location,
             json_build_object(
               'id', u.id,
               'first_name', u.first_name,
               'last_name', u.last_name,
               'username', u.username
             ) AS creator_user
      FROM event e
      JOIN event_location el ON e.id_event_location = el.id
      JOIN location l ON el.id_location = l.id
      JOIN province p ON l.id_province = p.id
      JOIN users u ON e.id_creator_user = u.id
      LEFT JOIN event_tag et ON e.id = et.id_event
      LEFT JOIN tag t ON et.id_tag = t.id
      WHERE 1=1
    `;

    const params = [];
    let paramIndex = 1;

    if (name) {
      baseQuery += ` AND e.name ILIKE $${paramIndex}`;
      params.push(`%${name}%`);
      paramIndex++;
    }
    if (startdate) {
      baseQuery += ` AND e.start_date::date = $${paramIndex}`;
      params.push(startdate);
      paramIndex++;
    }
    if (tag) {
      baseQuery += ` AND t.name ILIKE $${paramIndex}`;
      params.push(`%${tag}%`);
      paramIndex++;
    }

    baseQuery += ` GROUP BY e.id, el.id, l.id, p.id, u.id ORDER BY e.start_date LIMIT $${paramIndex} OFFSET $${paramIndex + 1}`;
    params.push(limit, offset);

    const result = await pool.query(baseQuery, params);

    // Contar total para paginación
    let countQuery = `
      SELECT COUNT(DISTINCT e.id) AS total
      FROM event e
      LEFT JOIN event_tag et ON e.id = et.id_event
      LEFT JOIN tag t ON et.id_tag = t.id
      WHERE 1=1
    `;

    const countParams = [];
    let countParamIndex = 1;

    if (name) {
      countQuery += ` AND e.name ILIKE $${countParamIndex}`;
      countParams.push(`%${name}%`);
      countParamIndex++;
    }
    if (startdate) {
      countQuery += ` AND e.start_date::date = $${countParamIndex}`;
      countParams.push(startdate);
      countParamIndex++;
    }
    if (tag) {
      countQuery += ` AND t.name ILIKE $${countParamIndex}`;
      countParams.push(`%${tag}%`);
      countParamIndex++;
    }

    const countResult = await pool.query(countQuery, countParams);
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
    console.error('Error listando eventos:', error);
    res.status(500).json({ success: false, message: 'Error interno del servidor' });
  }
};

const getEventById = async (req, res) => {
  const { id } = req.params;

  try {
    const query = `
      SELECT e.*, 
        json_build_object(
          'id', el.id,
          'id_location', el.id_location,
          'name', el.name,
          'full_address', el.full_address,
          'max_capacity', el.max_capacity,
          'latitude', el.latitude,
          'longitude', el.longitude,
          'id_creator_user', el.id_creator_user,
          'location', json_build_object(
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
          ),
          'creator_user', json_build_object(
            'id', cu.id,
            'first_name', cu.first_name,
            'last_name', cu.last_name,
            'username', cu.username,
            'password', '******'
          )
        ) AS event_location,
        (SELECT json_agg(json_build_object('id', t.id, 'name', t.name))
         FROM tag t
         JOIN event_tag et ON t.id = et.id_tag
         WHERE et.id_event = e.id) AS tags,
        json_build_object(
          'id', u.id,
          'first_name', u.first_name,
          'last_name', u.last_name,
          'username', u.username,
          'password', '******'
        ) AS creator_user
      FROM event e
      JOIN event_location el ON e.id_event_location = el.id
      JOIN location l ON el.id_location = l.id
      JOIN province p ON l.id_province = p.id
      JOIN users u ON e.id_creator_user = u.id
      JOIN users cu ON el.id_creator_user = cu.id
      WHERE e.id = $1
    `;

    const result = await pool.query(query, [id]);

    if (result.rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Evento no encontrado' });
    }

    res.json(result.rows[0]);
  } catch (error) {
    console.error('Error obteniendo detalle de evento:', error);
    res.status(500).json({ success: false, message: 'Error interno del servidor' });
  }
};

const createEvent = async (req, res) => {
  const {
    name,
    description,
    id_event_location,
    start_date,
    duration_in_minutes,
    price,
    enabled_for_enrollment,
    max_assistance,
    tags,
  } = req.body;

  const userId = req.user.id;

  // Validaciones básicas
  if (!name || name.length < 3) {
    return res.status(400).json({ success: false, message: 'El campo name debe tener al menos 3 letras.' });
  }
  if (!description || description.length < 3) {
    return res.status(400).json({ success: false, message: 'El campo description debe tener al menos 3 letras.' });
  }
  if (price < 0) {
    return res.status(400).json({ success: false, message: 'El campo price no puede ser negativo.' });
  }
  if (duration_in_minutes < 0) {
    return res.status(400).json({ success: false, message: 'El campo duration_in_minutes no puede ser negativo.' });
  }

  try {
    // Verificar capacidad máxima del lugar
    const locationQuery = 'SELECT max_capacity FROM event_location WHERE id = $1';
    const locationResult = await pool.query(locationQuery, [id_event_location]);
    if (locationResult.rows.length === 0) {
      return res.status(400).json({ success: false, message: 'El id_event_location no existe.' });
    }
    const maxCapacity = parseInt(locationResult.rows[0].max_capacity);
    if (max_assistance > maxCapacity) {
      return res.status(400).json({ success: false, message: 'max_assistance no puede ser mayor que max_capacity del lugar.' });
    }

    // Insertar evento
    const insertQuery = `
      INSERT INTO event (name, description, id_event_location, start_date, duration_in_minutes, price, enabled_for_enrollment, max_assistance, id_creator_user)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
      RETURNING id
    `;
    const insertValues = [name, description, id_event_location, start_date, duration_in_minutes, price, enabled_for_enrollment, max_assistance, userId];
    const insertResult = await pool.query(insertQuery, insertValues);
    const eventId = insertResult.rows[0].id;

    // Insertar tags si existen
    if (tags && Array.isArray(tags)) {
      for (const tagName of tags) {
        // Verificar si el tag existe
        let tagResult = await pool.query('SELECT id FROM tag WHERE name = $1', [tagName]);
        let tagId;
        if (tagResult.rows.length === 0) {
          // Insertar nuevo tag
          const insertTagResult = await pool.query('INSERT INTO tag (name) VALUES ($1) RETURNING id', [tagName]);
          tagId = insertTagResult.rows[0].id;
        } else {
          tagId = tagResult.rows[0].id;
        }
        // Insertar relación event_tag
        await pool.query('INSERT INTO event_tag (id_event, id_tag) VALUES ($1, $2)', [eventId, tagId]);
      }
    }

    res.status(201).json({ success: true, message: 'Evento creado correctamente', eventId });
  } catch (error) {
    console.error('Error creando evento:', error);
    res.status(500).json({ success: false, message: 'Error interno del servidor' });
  }
};

const updateEvent = async (req, res) => {
  const {
    id,
    name,
    description,
    id_event_location,
    start_date,
    duration_in_minutes,
    price,
    enabled_for_enrollment,
    max_assistance,
    tags,
  } = req.body;

  const userId = req.user.id;

  if (!id) {
    return res.status(400).json({ success: false, message: 'El campo id es obligatorio para actualizar.' });
  }

  // Validaciones básicas
  if (!name || name.length < 3) {
    return res.status(400).json({ success: false, message: 'El campo name debe tener al menos 3 letras.' });
  }
  if (!description || description.length < 3) {
    return res.status(400).json({ success: false, message: 'El campo description debe tener al menos 3 letras.' });
  }
  if (price < 0) {
    return res.status(400).json({ success: false, message: 'El campo price no puede ser negativo.' });
  }
  if (duration_in_minutes < 0) {
    return res.status(400).json({ success: false, message: 'El campo duration_in_minutes no puede ser negativo.' });
  }

  try {
    // Verificar que el evento exista y pertenezca al usuario
    const eventQuery = 'SELECT * FROM event WHERE id = $1';
    const eventResult = await pool.query(eventQuery, [id]);
    if (eventResult.rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Evento no encontrado.' });
    }
    const event = eventResult.rows[0];
    if (event.id_creator_user !== userId) {
      return res.status(401).json({ success: false, message: 'No autorizado para actualizar este evento.' });
    }

    // Verificar capacidad máxima del lugar
    const locationQuery = 'SELECT max_capacity FROM event_location WHERE id = $1';
    const locationResult = await pool.query(locationQuery, [id_event_location]);
    if (locationResult.rows.length === 0) {
      return res.status(400).json({ success: false, message: 'El id_event_location no existe.' });
    }
    const maxCapacity = parseInt(locationResult.rows[0].max_capacity);
    if (max_assistance > maxCapacity) {
      return res.status(400).json({ success: false, message: 'max_assistance no puede ser mayor que max_capacity del lugar.' });
    }

    // Actualizar evento
    const updateQuery = `
      UPDATE event
      SET name = $1, description = $2, id_event_location = $3, start_date = $4, duration_in_minutes = $5, price = $6, enabled_for_enrollment = $7, max_assistance = $8
      WHERE id = $9
    `;
    const updateValues = [name, description, id_event_location, start_date, duration_in_minutes, price, enabled_for_enrollment, max_assistance, id];
    await pool.query(updateQuery, updateValues);

    // Actualizar tags: eliminar existentes y agregar nuevas
    await pool.query('DELETE FROM event_tag WHERE id_event = $1', [id]);
    if (tags && Array.isArray(tags)) {
      for (const tagName of tags) {
        let tagResult = await pool.query('SELECT id FROM tag WHERE name = $1', [tagName]);
        let tagId;
        if (tagResult.rows.length === 0) {
          const insertTagResult = await pool.query('INSERT INTO tag (name) VALUES ($1) RETURNING id', [tagName]);
          tagId = insertTagResult.rows[0].id;
        } else {
          tagId = tagResult.rows[0].id;
        }
        await pool.query('INSERT INTO event_tag (id_event, id_tag) VALUES ($1, $2)', [id, tagId]);
      }
    }

    res.status(200).json({ success: true, message: 'Evento actualizado correctamente' });
  } catch (error) {
    console.error('Error actualizando evento:', error);
    res.status(500).json({ success: false, message: 'Error interno del servidor' });
  }
};

const deleteEvent = async (req, res) => {
  const { id } = req.params;
  const userId = req.user.id;

  try {
    // Verificar que el evento exista y pertenezca al usuario
    const eventQuery = 'SELECT * FROM event WHERE id = $1';
    const eventResult = await pool.query(eventQuery, [id]);
    if (eventResult.rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Evento no encontrado.' });
    }
    const event = eventResult.rows[0];
    if (event.id_creator_user !== userId) {
      return res.status(401).json({ success: false, message: 'No autorizado para eliminar este evento.' });
    }

    // Verificar que no existan usuarios registrados al evento
    const enrollmentQuery = 'SELECT COUNT(*) FROM event_enrollment WHERE id_event = $1';
    const enrollmentResult = await pool.query(enrollmentQuery, [id]);
    if (parseInt(enrollmentResult.rows[0].count) > 0) {
      return res.status(400).json({ success: false, message: 'No se puede eliminar el evento porque tiene usuarios registrados.' });
    }

    // Eliminar tags relacionados
    await pool.query('DELETE FROM event_tag WHERE id_event = $1', [id]);

    // Eliminar evento
    await pool.query('DELETE FROM event WHERE id = $1', [id]);

    res.status(200).json({ success: true, message: 'Evento eliminado correctamente' });
  } catch (error) {
    console.error('Error eliminando evento:', error);
    res.status(500).json({ success: false, message: 'Error interno del servidor' });
  }
};

module.exports = {
  listEvents,
  getEventById,
  createEvent,
  updateEvent,
  deleteEvent,
};
