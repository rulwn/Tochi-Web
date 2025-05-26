import express from 'express';
import userController from '../controllers/userController.js';
import authMiddleware from "../middlewares/authMiddleware.js";

const router = express.Router();

// Rutas para operaciones CRUD generales
router.route('/')
    .get(userController.getUsers)
    .post(userController.createUser);

router.route('/:id')
    .get(userController.getUserById)
    .put(userController.updateUser)
    .delete(userController.deleteUser);

// Ruta para obtener datos del usuario autenticado
router.get("/me", authMiddleware, userController.getCurrentUser);

export default router;