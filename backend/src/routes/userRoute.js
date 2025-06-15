import express from 'express';
import userController from '../controllers/userController.js';
import authMiddleware from "../middlewares/authMiddleware.js";

const router = express.Router();


router.get('/email/:email', authMiddleware, userController.getUserByEmail);
// Rutas CRUD estándar
router.route('/users')
    .get(authMiddleware, userController.getAllUsers)
    .post(userController.createUser);

router.route('/users/:id')
    .get(authMiddleware, userController.getUserById)
    .put(authMiddleware, userController.updateUser)
    .delete(authMiddleware, userController.deleteUser);

export default router;