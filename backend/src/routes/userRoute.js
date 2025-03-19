import express from 'express';
import userController from '../controllers/userController.js';
const router = express.Router();
router.route('/')
    .get(userController.getProducts)
    .post(userController.createProduct);
router.route('/:id')
    .put(userController.updateProduct)
    .delete(userController.deleteProduct);
export default router;