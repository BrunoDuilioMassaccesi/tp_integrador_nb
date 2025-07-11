const pool = require('../db');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

const validateEmail = (email) => {
  const re = /^[\w-\.]+@([\w-]+\.)+[\w-]{2,4}$/;
  return re.test(email);
};

const registerUser = async (req, res) => {
  const { first_name, last_name, username, password } = req.body;

  if (!first_name || first_name.length < 3) {
    return res.status(400).json({ success: false, message: 'El campo first_name debe tener al menos 3 letras.' });
  }
  if (!last_name || last_name.length < 3) {
    return res.status(400).json({ success: false, message: 'El campo last_name debe tener al menos 3 letras.' });
  }
  if (!validateEmail(username)) {
    return res.status(400).json({ success: false, message: 'El email es invalido.' });
  }
  if (!password || password.length < 3) {
    return res.status(400).json({ success: false, message: 'El campo password debe tener al menos 3 letras.' });
  }

  try {
    const hashedPassword = await bcrypt.hash(password, 10);
    const query = 'INSERT INTO users (first_name, last_name, username, password) VALUES ($1, $2, $3, $4) RETURNING id';
    const values = [first_name, last_name, username, hashedPassword];
    const result = await pool.query(query, values);
    res.status(201).json({ success: true, message: 'Usuario registrado correctamente', userId: result.rows[0].id });
  } catch (error) {
    console.error('Error en registro:', error);
    res.status(500).json({ success: false, message: 'Error interno del servidor' });
  }
};

const loginUser = async (req, res) => {
  const { username, password } = req.body;

  if (!validateEmail(username)) {
    return res.status(400).json({ success: false, message: 'El email es invalido.', token: '' });
  }

  try {
    const query = 'SELECT * FROM users WHERE username = $1';
    const result = await pool.query(query, [username]);
    if (result.rows.length === 0) {
      return res.status(401).json({ success: false, message: 'Usuario o clave inválida.', token: '' });
    }

    const user = result.rows[0];
    const match = await bcrypt.compare(password, user.password);
    if (!match) {
      return res.status(401).json({ success: false, message: 'Usuario o clave inválida.', token: '' });
    }

    const token = jwt.sign(
      { id: user.id, first_name: user.first_name, last_name: user.last_name, username: user.username },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRES_IN }
    );

    res.json({ success: true, message: '', token });
  } catch (error) {
    console.error('Error en login:', error);
    res.status(500).json({ success: false, message: 'Error interno del servidor', token: '' });
  }
};

module.exports = {
  registerUser,
  loginUser,
};
