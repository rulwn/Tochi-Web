import express from 'express';
import multer from 'multer';
import userController, { authenticateToken } from '../controllers/userController.js';


const router = express.Router();

const upload = multer({ dest: 'public/' });

router.route('/')
    .get(userController.getUsers)
    .post(upload.single('imageUrl'), userController.createUser);

router.route('/:id')
    .get(userController.getUserById)
    .put(upload.single('imageUrl'), userController.updateUser)
    .put(authenticateToken, userController.updateUserProfile)
    .get(authenticateToken, userController.getUserById)
    .delete(userController.deleteUser);

router.get('/check-admin', userController.checkAdminExists);
router.get('/profile', authenticateToken, userController.getMyProfile);





export default router;