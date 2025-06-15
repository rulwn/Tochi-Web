import User from "../models/User.js";

const usersController = {
  getUserByEmail: async (req, res) => {
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

  /**
   * Obtiene todos los usuarios (solo para administradores)
   */
  getAllUsers: async (req, res) => {
    try {
      const users = await User.find()
        .select('-password -__v -createdAt -updatedAt');
      res.json(users);
    } catch (error) {
      res.status(500).json({ 
        message: "Error retrieving users", 
        error: error.message 
      });
    }
  },

  /**
   * Obtiene un usuario específico por ID
   */
  getUserById: async (req, res) => {
    try {
      const user = await User.findById(req.params.id)
        .select('-password -__v -createdAt -updatedAt');
      
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }
      
      res.json(user);
    } catch (error) {
      res.status(500).json({ 
        message: "Error retrieving user", 
        error: error.message 
      });
    }
  },

  /**
   * Crea un nuevo usuario
   */
  createUser: async (req, res) => {
    try {
      const { name, email, password, phone, role, address, imgUrl } = req.body;
      const newUser = new User({ 
        name, 
        email, 
        password, 
        phone, 
        role, 
        address, 
        imgUrl 
      });
      
      await newUser.save();
      
      // Eliminamos campos sensibles antes de responder
      const userResponse = newUser.toObject();
      delete userResponse.password;
      delete userResponse.__v;
      
      res.status(201).json({ 
        message: "User created successfully", 
        user: userResponse 
      });
    } catch (error) {
      res.status(500).json({ 
        message: "Error creating user", 
        error: error.message 
      });
    }
  },

  /**
   * Actualiza un usuario existente
   */
  updateUser: async (req, res) => {
    try {
      const { name, email, phone, role, address, imgUrl } = req.body;
      
      const updatedUser = await User.findByIdAndUpdate(
        req.params.id,
        { name, email, phone, role, address, imgUrl },
        { new: true }
      ).select('-password -__v -createdAt -updatedAt');

      if (!updatedUser) {
        return res.status(404).json({ message: "User not found" });
      }
      
      res.json({ 
        message: "User updated successfully", 
        user: updatedUser 
      });
    } catch (error) {
      res.status(500).json({ 
        message: "Error updating user", 
        error: error.message 
      });
    }
  },

  /**
   * Elimina un usuario
   */
  deleteUser: async (req, res) => {
    try {
      const deletedUser = await User.findByIdAndDelete(req.params.id)
        .select('-password -__v -createdAt -updatedAt');
      
      if (!deletedUser) {
        return res.status(404).json({ message: "User not found" });
      }
      
      res.json({ 
        message: "User deleted successfully", 
        user: deletedUser 
      });
    } catch (error) {
      res.status(500).json({ 
        message: "Error deleting user", 
        error: error.message 
      });
    }
  }
};

export default usersController;