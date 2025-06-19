import express from 'express';
import cartController from '../controllers/cartController.js';

const router = express.Router();

router.route('/')
    .get(cartController.getCart)        
    .post(cartController.insertCart);   

router.route('/user/:userId')
    .get(cartController.getCartByUserId);

router.route('/:userId')
    .put(cartController.updateCart)     
    .delete(cartController.deleteCart); 

router.route('/:userId/confirm')
    .put(cartController.confirmCart);   

router.route('/:userId/cancel')
    .put(cartController.cancelCart);    

export default router;