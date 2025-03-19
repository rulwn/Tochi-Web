import express from 'express';
import cartController from '../controllers/cartController.js';
const router = express.Router();
router.route('/')
    .get(cartController.getCart)
    .post(cartController.insertCart);
router.route('/:id')
    .put(cartController.updateCart)
    .delete(cartController.deleteCart);
export default router;