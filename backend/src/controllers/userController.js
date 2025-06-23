import User from "../models/User.js";
import { v2 as cloudinary } from 'cloudinary';
import fs from 'fs';
import config from '../config.js';
import bcryptjs from "bcryptjs";
import jwt from "jsonwebtoken";
import crypto from "crypto";
import nodemailer from "nodemailer";

cloudinary.config({
  cloud_name: config.cloudinary.cloudinary_name,
  api_key: config.cloudinary.cloudinary_api_key,
  api_secret: config.cloudinary.cloudinary_api_secret
});

// Configurar nodemailer - CORRECCIÓN: createTransport (sin "r")
const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: config.email.email_user,
    pass: config.email.email_pass
  }
});

const usersController = {};

// Almacén temporal para códigos de verificación (en producción usa Redis o base de datos)
const verificationCodes = new Map();

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
    const { id } = req.params;
    const updates = {};

    // Manejar campos básicos
    if (req.body.name) updates.name = req.body.name;
    if (req.body.email) updates.email = req.body.email;
    if (req.body.phone) updates.phone = req.body.phone;
    if (req.body.address) updates.address = req.body.address;
    if (req.body.role) updates.role = req.body.role;

    // Manejar imagen
    if (req.file) {
      const result = await cloudinary.uploader.upload(req.file.path, {
        folder: 'tochi/users',
        allowed_formats: ['jpg', 'png', 'jpeg']
      });
      updates.imgUrl = result.secure_url;
      fs.unlinkSync(req.file.path); // Eliminar archivo temporal
    }

    // Manejar contraseña si se proporciona
    if (req.body.password) {
      updates.password = await bcryptjs.hash(req.body.password, 10);
    }

    const updatedUser = await User.findByIdAndUpdate(
      id,
      updates,
      { new: true, runValidators: true }
    ).select('-password');

    if (!updatedUser) {
      return res.status(404).json({ 
        success: false,
        message: "User not found" 
      });
    }

    res.json({ 
      success: true,
      message: "User updated successfully", 
      user: updatedUser 
    });
  } catch (error) {
    res.status(500).json({ 
      success: false,
      message: "Error updating user", 
      error: error.message 
    });
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

// Actualizar perfil de usuario (ruta PUT /profile/:id)
usersController.updateUserProfile = async (req, res) => {
  try {
    const { id } = req.params;
    
    // Verificar que el usuario solo actualice su propio perfil
    if (id !== req.user.id) {
      return res.status(403).json({ 
        success: false,
        message: "No tienes permiso para actualizar este perfil" 
      });
    }

    const updates = {};
    
    // Campos permitidos para actualización desde el perfil
    if (req.body.name) updates.name = req.body.name;
    if (req.body.phone) updates.phone = req.body.phone;
    if (req.body.address) updates.address = req.body.address;

    // Manejar imagen de perfil
    if (req.file) {
      try {
        const result = await cloudinary.uploader.upload(req.file.path, {
          folder: 'tochi/users',
          allowed_formats: ['jpg', 'png', 'jpeg']
        });
        updates.imgUrl = result.secure_url;
        
        // Eliminar archivo temporal
        if (fs.existsSync(req.file.path)) {
          fs.unlinkSync(req.file.path);
        }
      } catch (uploadError) {
        console.error('Error uploading to Cloudinary:', uploadError);
        // Limpiar archivo temporal en caso de error
        if (req.file && fs.existsSync(req.file.path)) {
          fs.unlinkSync(req.file.path);
        }
        return res.status(500).json({
          success: false,
          message: "Error al subir la imagen"
        });
      }
    }

    // Manejar eliminación de imagen
    if (req.body.removeImage === 'true') {
      updates.imgUrl = null;
    }

    // No permitir actualización de email o rol desde el perfil
    if (req.body.email || req.body.role) {
      return res.status(403).json({ 
        success: false,
        message: "No puedes cambiar tu email o rol desde esta sección" 
      });
    }

    const updatedUser = await User.findByIdAndUpdate(
      id,
      updates,
      { new: true, runValidators: true }
    ).select('-password');

    if (!updatedUser) {
      return res.status(404).json({ 
        success: false,
        message: "User not found" 
      });
    }

    res.json({ 
      success: true,
      message: "Perfil actualizado correctamente", 
      user: updatedUser 
    });
  } catch (error) {
    console.error('Error al actualizar perfil:', error);
    
    // Limpiar archivo temporal en caso de error
    if (req.file && fs.existsSync(req.file.path)) {
      fs.unlinkSync(req.file.path);
    }
    
    res.status(500).json({ 
      success: false,
      message: "Error al actualizar perfil", 
      error: error.message 
    });
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

// ===============================
// FUNCIONES DE RECUPERACIÓN DE CONTRASEÑA
// ===============================

// Función para enviar email
const sendResetEmail = async (email, verificationCode, userName = 'Usuario') => {
  const mailOptions = {
    from: `"Soporte Tochi" <${config.email.email_user}>`,
    to: email,
    subject: '🔐 Código de Recuperación de Contraseña - Tochi',
    html: `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <link href="https://fonts.googleapis.com/css2?family=Poppins:wght@400;600&display=swap" rel="stylesheet">
          <style>
            body { 
              margin: 0; 
              padding: 0; 
              font-family: 'Poppins', sans-serif; 
              background-color: #f5f5f5;
              line-height: 1.6;
            }
            .email-container { 
              width: 100%; 
              min-height: 100vh; 
              display: flex; 
              justify-content: center; 
              align-items: center; 
              padding: 20px; 
              box-sizing: border-box;
            }
            .email-box {
              background: white;
              border-radius: 20px;
              width: 100%;
              max-width: 600px;
              padding: 40px 30px;
              box-shadow: 0 0 25px rgba(0, 0, 0, 0.1);
              text-align: center;
            }
            .logo-section {
              margin-bottom: 30px;
            }
            .logo-text {
              font-size: 28px;
              font-weight: 600;
              color: #00BF63;
              margin: 0;
            }
            .header-title {
              font-size: 24px;
              font-weight: 600;
              color: #333;
              margin: 0 0 10px 0;
            }
            .header-subtitle {
              color: #777;
              font-size: 16px;
              margin: 0 0 30px 0;
            }
            .greeting {
              font-size: 16px;
              color: #333;
              margin-bottom: 25px;
              text-align: left;
            }
            .code-section {
              background: #f9f9f9;
              border: 2px solid #00BF63;
              border-radius: 15px;
              padding: 30px 20px;
              margin: 30px 0;
            }
            .code-label {
              font-size: 14px;
              color: #777;
              margin-bottom: 15px;
              font-weight: 600;
            }
            .verification-code {
              font-size: 36px;
              font-weight: 600;
              color: #00BF63;
              letter-spacing: 8px;
              margin: 10px 0;
              font-family: 'Courier New', monospace;
            }
            .warning-box {
              background: #fff3cd;
              border: 1px solid #00BF63;
              border-radius: 10px;
              padding: 20px;
              margin: 25px 0;
              text-align: left;
            }
            .warning-title {
              font-weight: 600;
              color: #333;
              margin-bottom: 10px;
              display: flex;
              align-items: center;
            }
            .warning-list {
              margin: 10px 0 0 0;
              padding-left: 20px;
              color: #555;
            }
            .warning-list li {
              margin-bottom: 5px;
            }
            .help-section {
              border-top: 1px solid #eee;
              padding-top: 25px;
              margin-top: 30px;
              text-align: left;
            }
            .help-title {
              font-weight: 600;
              color: #333;
              margin-bottom: 8px;
            }
            .help-text {
              color: #777;
              font-size: 14px;
            }
            .footer {
              text-align: center;
              color: #999;
              font-size: 12px;
              margin-top: 30px;
              padding-top: 20px;
              border-top: 1px solid #eee;
            }
            .tochi-green { color: #00BF63; }
            .highlight { font-weight: 600; }
            
            /* Responsive */
            @media (max-width: 600px) {
              .email-box {
                padding: 30px 20px;
              }
              .verification-code {
                font-size: 28px;
                letter-spacing: 4px;
              }
            }
          </style>
        </head>
        <body>
          <div class="email-container">
            <div class="email-box">
              <!-- Logo/Brand -->
              <div class="logo-section">
                <h1 class="logo-text">Tochi</h1>
              </div>
              
              <!-- Header -->
              <h2 class="header-title">🔐 Recuperación de Contraseña</h2>
              <p class="header-subtitle">Restablecer el acceso a tu cuenta</p>
              
              <!-- Greeting -->
              <div class="greeting">
                <p>Hola <span class="highlight">${userName}</span>,</p>
                <p>Recibimos una solicitud para restablecer la contraseña de tu cuenta Tochi. Para continuar con el proceso, utiliza el siguiente código de verificación:</p>
              </div>
              
              <!-- Verification Code -->
              <div class="code-section">
                <div class="code-label">CÓDIGO DE VERIFICACIÓN</div>
                <div class="verification-code">${verificationCode}</div>
              </div>
              
              <!-- Warning/Instructions -->
              <div class="warning-box">
                <div class="warning-title">
                  ⚠️ Información importante
                </div>
                <ul class="warning-list">
                  <li>Este código <span class="highlight">expira en 10 minutos</span></li>
                  <li>Solo tienes <span class="highlight">3 intentos</span> para ingresarlo correctamente</li>
                  <li>Si no solicitaste este cambio, puedes ignorar este email</li>
                  <li>Puedes solicitar un nuevo código desde la aplicación si este expira</li>
                </ul>
              </div>
              
              <!-- Help Section -->
              <div class="help-section">
                <div class="help-title">¿Necesitas ayuda?</div>
                <p class="help-text">
                  Si tienes problemas para restablecer tu contraseña o no solicitaste este cambio, 
                  no dudes en contactar a nuestro equipo de soporte respondiendo a este email.
                </p>
              </div>
              
              <!-- Footer -->
              <div class="footer">
                <p>
                  Este email fue enviado automáticamente desde <span class="tochi-green highlight">Tochi App</span><br>
                  Por favor, no respondas directamente a este email.
                </p>
              </div>
            </div>
          </div>
        </body>
      </html>
    `
  };

  try {
    await transporter.sendMail(mailOptions);
    return true;
  } catch (error) {
    console.error('Error enviando email:', error);
    return false;
  }
};

// 1. Solicitar código de recuperación
usersController.requestPasswordReset = async (req, res) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({
        success: false,
        message: "El email es requerido"
      });
    }

    // Verificar si el usuario existe
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(404).json({
        success: false,
        message: "No existe una cuenta con este email"
      });
    }

    // Generar código de 4 dígitos
    const verificationCode = Math.floor(1000 + Math.random() * 9000).toString();
    
    // Guardar el código con expiración de 10 minutos
    verificationCodes.set(email, {
      code: verificationCode,
      expires: Date.now() + 10 * 60 * 1000, // 10 minutos
      attempts: 0
    });

    // Enviar email con el código
    const emailSent = await sendResetEmail(email, verificationCode, user.name);
    
    if (!emailSent) {
      // Si falla el envío del email, eliminar el código
      verificationCodes.delete(email);
      return res.status(500).json({
        success: false,
        message: "Error al enviar el email. Intenta de nuevo."
      });
    }

    console.log(`Código de verificación para ${email}: ${verificationCode}`); // Para debug

    res.json({
      success: true,
      message: "Código de verificación enviado a tu email"
    });

  } catch (error) {
    console.error("Error al solicitar reset de contraseña:", error);
    res.status(500).json({
      success: false,
      message: "Error del servidor",
      error: error.message
    });
  }
};

// 2. Verificar código
usersController.verifyResetCode = async (req, res) => {
  try {
    const { email, code } = req.body;

    if (!email || !code) {
      return res.status(400).json({
        success: false,
        message: "Email y código son requeridos"
      });
    }

    const storedData = verificationCodes.get(email);
    
    if (!storedData) {
      return res.status(400).json({
        success: false,
        message: "No hay código de verificación para este email"
      });
    }

    // Verificar si el código ha expirado
    if (Date.now() > storedData.expires) {
      verificationCodes.delete(email);
      return res.status(400).json({
        success: false,
        message: "El código ha expirado. Solicita uno nuevo"
      });
    }

    // Verificar intentos
    if (storedData.attempts >= 3) {
      verificationCodes.delete(email);
      return res.status(400).json({
        success: false,
        message: "Demasiados intentos. Solicita un nuevo código"
      });
    }

    // Verificar código
    if (storedData.code !== code) {
      storedData.attempts++;
      return res.status(400).json({
        success: false,
        message: "Código incorrecto",
        attemptsLeft: 3 - storedData.attempts
      });
    }

    // Generar token temporal para cambio de contraseña
    const resetToken = jwt.sign(
      { email, purpose: 'password-reset' },
      process.env.JWT_SECRET,
      { expiresIn: '15m' }
    );

    // Limpiar el código usado
    verificationCodes.delete(email);

    res.json({
      success: true,
      message: "Código verificado correctamente",
      resetToken
    });

  } catch (error) {
    console.error("Error al verificar código:", error);
    res.status(500).json({
      success: false,
      message: "Error del servidor",
      error: error.message
    });
  }
};

// 3. Cambiar contraseña
usersController.resetPassword = async (req, res) => {
  try {
    const { resetToken, newPassword, confirmPassword } = req.body;

    if (!resetToken || !newPassword || !confirmPassword) {
      return res.status(400).json({
        success: false,
        message: "Todos los campos son requeridos"
      });
    }

    if (newPassword !== confirmPassword) {
      return res.status(400).json({
        success: false,
        message: "Las contraseñas no coinciden"
      });
    }

    if (newPassword.length < 6) {
      return res.status(400).json({
        success: false,
        message: "La contraseña debe tener al menos 6 caracteres"
      });
    }

    // Verificar token
    let decoded;
    try {
      decoded = jwt.verify(resetToken, process.env.JWT_SECRET);
    } catch (error) {
      return res.status(400).json({
        success: false,
        message: "Token inválido o expirado"
      });
    }

    if (decoded.purpose !== 'password-reset') {
      return res.status(400).json({
        success: false,
        message: "Token inválido"
      });
    }

    // Buscar usuario
    const user = await User.findOne({ email: decoded.email });
    if (!user) {
      return res.status(404).json({
        success: false,
        message: "Usuario no encontrado"
      });
    }

    // Actualizar contraseña
    const hashedPassword = await bcryptjs.hash(newPassword, 10);
    user.password = hashedPassword;
    await user.save();

    res.json({
      success: true,
      message: "Contraseña actualizada correctamente"
    });

  } catch (error) {
    console.error("Error al cambiar contraseña:", error);
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