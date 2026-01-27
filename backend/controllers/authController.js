import User from '../models/User.js';
import jwt from 'jsonwebtoken';

const generateToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET, {
    expiresIn: '30d'
  });
};

export const register = async (req, res) => {
  try {
    const { nombreCompleto, telefono, password } = req.body;

    if (!nombreCompleto || !telefono || !password) {
      return res.status(400).json({ message: 'Todos los campos son requeridos' });
    }

    const userExists = await User.findOne({ telefono });
    if (userExists) {
      return res.status(400).json({ message: 'El número de teléfono ya está registrado' });
    }

    const user = await User.create({
      nombreCompleto,
      telefono,
      password
    });

    if (user) {
      res.status(201).json({
        _id: user._id,
        nombreCompleto: user.nombreCompleto,
        telefono: user.telefono,
        token: generateToken(user._id)
      });
    }
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const login = async (req, res) => {
  try {
    const { telefono, password } = req.body;

    const user = await User.findOne({ telefono });

    if (user && (await user.matchPassword(password))) {
      res.json({
        _id: user._id,
        nombreCompleto: user.nombreCompleto,
        telefono: user.telefono,
        token: generateToken(user._id)
      });
    } else {
      res.status(401).json({ message: 'Credenciales inválidas' });
    }
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const getProfile = async (req, res) => {
  try {
    const user = await User.findById(req.user._id).select('-password');
    res.json(user);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};