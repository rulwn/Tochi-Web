import User from "../models/User.js";
import { v2 as cloudinary } from 'cloudinary';
import config from '../config.js';
import bcryptjs from "bcryptjs";

cloudinary.config({
  cloud_name: config.cloudinary.cloudinary_name,
  api_key: config.cloudinary.cloudinary_api_key,
  api_secret: config.cloudinary.cloudinary_api_secret
});


const usersController = {};

// Get all users
usersController.getUsers = async (req, res) => {
  try {
    const users = await User.find();
    res.json(users);
  } catch (error) {
    res.status(500).json({ message: "Error retrieving users", error: error.message });
  }
};

usersController.getCurrentUser = async (req, res) => {
  try {
    if (!req.user?.id) {
      return res.status(401).json({
        success: false,
        message: "No autorizado"
      });
    }

    const email = req.params.email;
    if (!email || typeof email !== 'string') {
      return res.status(400).json({
        success: false,
        message: "Email no válido"
      });
    }

    const authUser = await User.findById(req.user.id);
    if (!authUser || authUser.email !== email) {
      return res.status(403).json({
        success: false,
        message: "No tienes permiso para acceder a este recurso"
      });
    }

    const user = await User.findOne({ email }).select('-password -__v -createdAt -updatedAt');

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "Usuario no encontrado"
      });
    }

    res.json({
      success: true,
      data: {
        id: user._id,
        name: user.name,
        email: user.email,
        imgUrl: user.imgUrl,
        role: user.role,
        phone: user.phone,
        address: user.address
      }
    });

  } catch (error) {
    console.error("Error en getUserByEmail:", error);
    res.status(500).json({
      success: false,
      message: "Error del servidor",
      error: error.message
    });
  }
},



usersController.checkAdminExists = async (req, res) => {
  try {
    const adminCount = await User.countDocuments({ role: "Administrador" });
    res.json({ hasAdmin: adminCount > 0, adminCount });
  } catch (error) {
    res.status(500).json({ message: "Error checking admin existence", error: error.message });
  }
};


// Get user by ID
usersController.getUserById = async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }
    res.json(user);
  } catch (error) {
    res.status(500).json({ message: "Error retrieving user", error: error.message });
  }
};

// Create a new user
usersController.createUser = async (req, res) => {
  try {
    const { name, email, password, phone, role, address } = req.body;
    let imgUrl;

    if (req.file) {
      const result = await cloudinary.uploader.upload(req.file.path, {
        folder: 'tochi/users',
        allowed_formats: ['jpg', 'png', 'jpeg']
      });
      imgUrl = result.secure_url;
    }

    const passwordHash = await bcryptjs.hash(password, 10);

    const newUser = new User({
      name,
      email,
      password: passwordHash,
      phone,
      role,
      address,
      imgUrl
    });

    await newUser.save();
    res.json({ message: "User created", user: newUser });
  } catch (error) {
    res.status(500).json({ message: "Error creating user", error: error.message });
  }
};

// Update user by ID
usersController.updateUser = async (req, res) => {
  try {
    const { name, email, phone, role, address, password } = req.body;

    const updates = {
      name,
      email,
      phone,
      role,
      address
    };

    if (password) {
      updates.password = await bcryptjs.hash(password, 10);
    }

    if (req.file) {
      const result = await cloudinary.uploader.upload(req.file.path, {
        folder: 'tochi/users',
        allowed_formats: ['jpg', 'png', 'jpeg']
      });
      updates.imgUrl = result.secure_url;
    }

    const updatedUser = await User.findByIdAndUpdate(
      req.params.id,
      updates,
      { new: true }
    );

    if (!updatedUser) {
      return res.status(404).json({ message: "User not found" });
    }

    res.json({ message: "User updated", user: updatedUser });
  } catch (error) {
    res.status(500).json({ message: "Error updating user", error: error.message });
  }
};

// Delete user by ID
usersController.deleteUser = async (req, res) => {
  try {
    const deletedUser = await User.findByIdAndDelete(req.params.id);
    if (!deletedUser) {
      return res.status(404).json({ message: "User not found" });
    }
    res.json({ message: "User deleted", user: deletedUser });
  } catch (error) {
    res.status(500).json({ message: "Error deleting user", error: error.message });
  }
};

export default usersController;
