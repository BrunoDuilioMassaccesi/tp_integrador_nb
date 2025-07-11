require('dotenv').config();
const express = require('express');
const { Pool } = require('pg');

const app = express();
const port = process.env.PORT || 3000;

const userRoutes = require('./routes/user');
const enrollmentRoutes = require('./routes/enrollment');
const eventLocationRoutes = require('./routes/eventLocation');

// Middleware para parsear JSON
app.use(express.json());

// Configuración de conexión a PostgreSQL
const pool = new Pool({
  host: process.env.DB_HOST,
  port: process.env.DB_PORT,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
});

// Rutas de usuario
app.use('/api/user', userRoutes);
app.use('/api/event', enrollmentRoutes);
app.use('/api/event-location', eventLocationRoutes);

// Endpoint de prueba para verificar conexión a la base de datos
app.get('/api/test-db', async (req, res) => {
  try {
    const result = await pool.query('SELECT NOW()');
    res.json({ success: true, time: result.rows[0].now });
  } catch (error) {
    console.error('Error al conectar a la base de datos:', error);
    res.status(500).json({ success: false, message: 'Error al conectar a la base de datos' });
  }
});

app.listen(port, () => {
  console.log(`Servidor backend corriendo en http://localhost:${port}`);
});
