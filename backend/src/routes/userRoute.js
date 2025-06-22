import express from 'express';
import multer from 'multer';
import userController, { authenticateToken } from '../controllers/userController.js';

const router = express.Router();

const upload = multer({ dest: 'public/' });


router.get('/check-admin', userController.checkAdminExists);
router.get('/profile', authenticateToken, userController.getMyProfile);

router.get('/addresses', authenticateToken, userController.getUserAddresses);
router.post('/addresses', authenticateToken, userController.addUserAddress);
router.put('/addresses/:addressId', authenticateToken, userController.updateUserAddress);
router.delete('/addresses/:addressId', authenticateToken, userController.deleteUserAddress);
router.put('/addresses/:addressId/default', authenticateToken, userController.setDefaultAddress);

router.route('/')
    .get(userController.getUsers)
    .post(upload.single('imageUrl'), userController.createUser);

router.put('/profile/:id', authenticateToken, userController.updateUserProfile);

// Rutas con parámetros (van al final)
router.route('/:id')
    .get(userController.getUserById)
    .put(upload.single('imageUrl'), userController.updateUser)
    .delete(userController.deleteUser);

export default router;