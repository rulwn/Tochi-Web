import express from 'express'
import orderController from '../controllers/orderController.js'

const router = express.Router()
router.route('/')
    .get(orderController.getOrders)
    .post(orderController.postOrder)

router.route('/:id')
    .put(orderController.putOrder)
    .delete(orderController.deleteOrder)

export default router