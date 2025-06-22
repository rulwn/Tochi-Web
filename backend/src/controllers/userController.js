import User from "../models/User.js";
import { v2 as cloudinary } from 'cloudinary';
import config from '../config.js';
import bcryptjs from "bcryptjs";
import jwt from "jsonwebtoken"; // FALTABA ESTA IMPORTACIÓN

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
};

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
    const user = await User.findById(req.params.id).select('-password');
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

// Actualizar perfil de usuario
usersController.updateUserProfile = async (req, res) => {
  try {
    const { id } = req.params;
    const updateData = req.body;

    // Remover campos que no se deben actualizar directamente
    delete updateData.password;
    delete updateData.role;
    delete updateData._id;

    const updatedUser = await User.findByIdAndUpdate(
      id, 
      updateData, 
      { 
        new: true, 
        runValidators: true 
      }
    ).select('-password');

    if (!updatedUser) {
      return res.status(404).json({ message: "Usuario no encontrado" });
    }

    res.json(updatedUser);
  } catch (error) {
    console.error('Error al actualizar usuario:', error);
    res.status(500).json({ message: "Error interno del servidor" });
  }
};

// Obtener perfil del usuario autenticado
usersController.getMyProfile = async (req, res) => {
  try {
    // El middleware de autenticación debe haber agregado el usuario a req.user
    const user = await User.findById(req.user.id).select('-password');
    
    if (!user) {
      return res.status(404).json({ message: "Usuario no encontrado" });
    }

    res.json(user);
  } catch (error) {
    console.error('Error al obtener perfil:', error);
    res.status(500).json({ message: "Error interno del servidor" });
  }
};

// Métodos para manejar direcciones de envío

// Obtener todas las direcciones de un usuario
usersController.getUserAddresses = async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select('addresses');
    
    if (!user) {
      return res.status(404).json({
        success: false,
        message: "Usuario no encontrado"
      });
    }

    res.json({
      success: true,
      data: user.addresses || []
    });
  } catch (error) {
    console.error("Error al obtener direcciones:", error);
    res.status(500).json({
      success: false,
      message: "Error del servidor",
      error: error.message
    });
  }
};

// Agregar nueva dirección
usersController.addUserAddress = async (req, res) => {
  try {
    const { title, address, contactNumber, isDefault } = req.body;

    if (!title || !address) {
      return res.status(400).json({
        success: false,
        message: "Título y dirección son requeridos"
      });
    }

    const user = await User.findById(req.user.id);
    
    if (!user) {
      return res.status(404).json({
        success: false,
        message: "Usuario no encontrado"
      });
    }

    // Si no hay direcciones o esta será la primera, hacerla por defecto
    const willBeDefault = isDefault || !user.addresses || user.addresses.length === 0;

    // Si esta dirección será por defecto, quitar el default de las otras
    if (willBeDefault && user.addresses) {
      user.addresses.forEach(addr => {
        addr.isDefault = false;
      });
    }

    const newAddress = {
      title,
      address,
      contactNumber: contactNumber || '',
      isDefault: willBeDefault
    };

    if (!user.addresses) {
      user.addresses = [];
    }

    user.addresses.push(newAddress);
    await user.save();

    res.json({
      success: true,
      message: "Dirección agregada exitosamente",
      data: user.addresses
    });
  } catch (error) {
    console.error("Error al agregar dirección:", error);
    res.status(500).json({
      success: false,
      message: "Error del servidor",
      error: error.message
    });
  }
};

// Actualizar dirección
usersController.updateUserAddress = async (req, res) => {
  try {
    const { addressId } = req.params;
    const { title, address, contactNumber, isDefault } = req.body;

    const user = await User.findById(req.user.id);
    
    if (!user) {
      return res.status(404).json({
        success: false,
        message: "Usuario no encontrado"
      });
    }

    const addressIndex = user.addresses.findIndex(addr => addr._id.toString() === addressId);
    
    if (addressIndex === -1) {
      return res.status(404).json({
        success: false,
        message: "Dirección no encontrada"
      });
    }

    // Si se marca como por defecto, quitar el default de las otras
    if (isDefault) {
      user.addresses.forEach((addr, index) => {
        if (index !== addressIndex) {
          addr.isDefault = false;
        }
      });
    }

    // Actualizar la dirección
    if (title) user.addresses[addressIndex].title = title;
    if (address) user.addresses[addressIndex].address = address;
    if (contactNumber !== undefined) user.addresses[addressIndex].contactNumber = contactNumber;
    if (isDefault !== undefined) user.addresses[addressIndex].isDefault = isDefault;

    await user.save();

    res.json({
      success: true,
      message: "Dirección actualizada exitosamente",
      data: user.addresses
    });
  } catch (error) {
    console.error("Error al actualizar dirección:", error);
    res.status(500).json({
      success: false,
      message: "Error del servidor",
      error: error.message
    });
  }
};

// Eliminar dirección
usersController.deleteUserAddress = async (req, res) => {
  try {
    const { addressId } = req.params;

    const user = await User.findById(req.user.id);
    
    if (!user) {
      return res.status(404).json({
        success: false,
        message: "Usuario no encontrado"
      });
    }

    const addressIndex = user.addresses.findIndex(addr => addr._id.toString() === addressId);
    
    if (addressIndex === -1) {
      return res.status(404).json({
        success: false,
        message: "Dirección no encontrada"
      });
    }

    // No permitir eliminar si es la única dirección
    if (user.addresses.length === 1) {
      return res.status(400).json({
        success: false,
        message: "No puedes eliminar la única dirección. Agrega otra primero."
      });
    }

    const wasDefault = user.addresses[addressIndex].isDefault;
    
    // Eliminar la dirección
    user.addresses.splice(addressIndex, 1);

    // Si era la dirección por defecto, hacer la primera restante como por defecto
    if (wasDefault && user.addresses.length > 0) {
      user.addresses[0].isDefault = true;
    }

    await user.save();

    res.json({
      success: true,
      message: "Dirección eliminada exitosamente",
      data: user.addresses
    });
  } catch (error) {
    console.error("Error al eliminar dirección:", error);
    res.status(500).json({
      success: false,
      message: "Error del servidor",
      error: error.message
    });
  }
};

// Establecer dirección por defecto
usersController.setDefaultAddress = async (req, res) => {
  try {
    const { addressId } = req.params;

    const user = await User.findById(req.user.id);
    
    if (!user) {
      return res.status(404).json({
        success: false,
        message: "Usuario no encontrado"
      });
    }

    const addressIndex = user.addresses.findIndex(addr => addr._id.toString() === addressId);
    
    if (addressIndex === -1) {
      return res.status(404).json({
        success: false,
        message: "Dirección no encontrada"
      });
    }

    // Quitar el default de todas las direcciones
    user.addresses.forEach(addr => {
      addr.isDefault = false;
    });

    // Establecer la nueva dirección por defecto
    user.addresses[addressIndex].isDefault = true;

    await user.save();

    res.json({
      success: true,
      message: "Dirección establecida como predeterminada",
      data: user.addresses
    });
  } catch (error) {
    console.error("Error al establecer dirección por defecto:", error);
    res.status(500).json({
      success: false,
      message: "Error del servidor",
      error: error.message
    });
  }
};

// Middleware para verificar token JWT
export const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN

  if (!token) {
    return res.status(401).json({ message: 'Token de acceso requerido' });
  }

  jwt.verify(token, process.env.JWT_SECRET, (err, user) => {
    if (err) {
      return res.status(403).json({ message: 'Token inválido' });
    }
    req.user = user;
    next();
  });
};

export default usersController;