import express from 'express';
import orderController from '../controllers/orderController.js';
import authMiddleware, { 
  simpleAuthMiddleware, 
  adminAuthMiddleware, 
  userAuthMiddleware 
} from '../middlewares/authMiddleware.js';

const router = express.Router();

// Rutas para admin
router.get('/', adminAuthMiddleware, orderController.getOrders); // Solo admin
router.get('/stats', adminAuthMiddleware, orderController.getOrderStats); // Solo admin
router.delete('/:id', adminAuthMiddleware, orderController.deleteOrder); // Solo admin

// Rutas para usuarios autenticados
router.get('/user/:userId', userAuthMiddleware, orderController.getOrdersByUserId);
router.get('/:id', userAuthMiddleware, orderController.getOrderById);

// Crear nueva orden - cualquier usuario autenticado
router.post('/', simpleAuthMiddleware, orderController.postOrder);

// Actualizar orden - cualquier usuario autenticado
router.put('/:id', userAuthMiddleware, orderController.putOrder);

// Confirmar pago de orden
router.put('/:id/payment', simpleAuthMiddleware, orderController.confirmPayment);

// Cancelar orden
router.put('/:id/cancel', userAuthMiddleware, orderController.cancelOrder);

export default router;