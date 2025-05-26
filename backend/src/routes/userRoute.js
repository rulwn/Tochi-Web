import express from 'express';
import multer from 'multer';
import userController from '../controllers/userController.js';
import authMiddleware from "../middlewares/authMiddleware.js";

const router = express.Router();

// Configuración de multer para subida de archivos
const upload = multer({ dest: 'uploads/' });

router.route('/')
    .get(userController.getUsers)
    .post(upload.single('imageUrl'), userController.createUser);

router.route('/:id')
    .get(userController.getUserById)
    .put(upload.single('imageUrl'), userController.updateUser)
    .delete(userController.deleteUser);

// Ruta para obtener datos del usuario autenticado
router.get("/me", authMiddleware, userController.getCurrentUser);

export default router;