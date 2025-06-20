import Order from "../models/Order.js"
import Products from "../models/Products.js"
import Cart from "../models/Cart.js"

const orderController = {}

// Obtener todas las órdenes (para admin)
orderController.getOrders = async (req, res) => {
    try {
        const orders = await Order.find()
            .populate({
                path: "cartId",
                populate: {
                    path: "Products.idProduct",
                    model: "Product",
                    select: "name description price stock imageUrl"
                }
            })
            .sort({ createdAt: -1 })
            .exec()

        res.json({
            success: true,
            data: orders,
            message: orders.length > 0 ? "Orders retrieved successfully" : "No orders found"
        })
    } catch (error) {
        console.error('Error in getOrders:', error);
        res.status(500).json({ 
            success: false,
            message: "Error retrieving orders", 
            error: error.message 
        })
    }
}

// Obtener órdenes por ID de usuario
orderController.getOrdersByUserId = async (req, res) => {
    try {
        const { userId } = req.params;
        
        // Verificar que el usuario solo pueda ver sus propias órdenes (a menos que sea admin)
        if (req.user.role !== 'admin' && req.user.id !== userId) {
            return res.status(403).json({ 
                success: false,
                message: "No autorizado para ver estas órdenes" 
            });
        }
        
        const orders = await Order.find()
            .populate({
                path: "cartId",
                match: { idClient: userId },
                populate: {
                    path: "Products.idProduct",
                    model: "Product",
                    select: "name description price stock imageUrl"
                }
            })
            .sort({ createdAt: -1 })
            .exec();

        // Filtrar órdenes que tengan carrito válido
        const userOrders = orders.filter(order => order.cartId !== null);

        res.json({
            success: true,
            data: userOrders,
            message: userOrders.length > 0 ? "User orders retrieved successfully" : "No orders found for this user"
        });
    } catch (error) {
        console.error('Error in getOrdersByUserId:', error);
        res.status(500).json({ 
            success: false,
            message: "Error retrieving user orders", 
            error: error.message 
        });
    }
};

// Crear nueva orden
orderController.postOrder = async (req, res) => {
    const { 
        cartId, 
        address, 
        payingMetod, 
        deliveryMethod, 
        deliveryCost = 0, 
        discount = 0, 
        finalTotal,
        paymentId,
        paymentStatus = 'pending',
        promoCode
    } = req.body;
    
    try {
        console.log('Creating order with data:', { cartId, address, payingMetod, deliveryMethod });
        
        // Validar datos requeridos
        if (!cartId) {
            return res.status(400).json({ 
                success: false,
                message: "Cart ID is required" 
            });
        }

        if (!address || !address.street || !address.city) {
            return res.status(400).json({ 
                success: false,
                message: "Complete address is required" 
            });
        }

        if (!payingMetod) {
            return res.status(400).json({ 
                success: false,
                message: "Payment method is required" 
            });
        }

        // Verificar que el carrito existe
        const cart = await Cart.findById(cartId);
        if (!cart) {
            return res.status(404).json({ 
                success: false,
                message: "Cart not found" 
            });
        }

        // Verificar que el usuario es propietario del carrito (si no es admin)
        if (req.user.role !== 'admin' && cart.idClient.toString() !== req.user.id) {
            return res.status(403).json({ 
                success: false,
                message: "Not authorized to create order for this cart" 
            });
        }

        if (cart.state !== "Pendiente") {
            return res.status(400).json({ 
                success: false,
                message: "Cart is not in pending state" 
            });
        }

        // Crear la nueva orden
        const newOrder = new Order({ 
            cartId, 
            address: {
                street: address.street,
                city: address.city,
                state: address.state || '',
                zipCode: address.zipCode || address.zip || '',
                country: address.country || 'USA',
                addressName: address.addressName || address.name || 'Default'
            }, 
            payingMetod, 
            deliveryMethod: deliveryMethod || 'standard',
            deliveryCost: Number(deliveryCost),
            discount: Number(discount),
            finalTotal: Number(finalTotal) || cart.total,
            paymentId: paymentId || null,
            paymentStatus: paymentStatus,
            promoCode: promoCode || null,
            state: "Pendiente"
        });

        const order = await newOrder.save();
        console.log('Order created successfully:', order._id);

        // Cambiar el estado del carrito a "Confirmado"
        cart.state = "Confirmado";
        await cart.save();

        // Poblar los datos antes de enviar la respuesta
        await order.populate({
            path: "cartId",
            populate: {
                path: "Products.idProduct",
                model: "Product",
                select: "name description price stock imageUrl"
            }
        });

        res.status(201).json({ 
            success: true,
            message: "Order created successfully", 
            order: order 
        });

    } catch (error) {
        console.error('Error creating order:', error);
        res.status(500).json({ 
            success: false,
            message: "Error creating order", 
            error: error.message 
        });
    }
}

// Actualizar orden
orderController.putOrder = async (req, res) => {
    const { id } = req.params;
    const { 
        state, 
        paymentStatus, 
        deliveryStatus, 
        trackingNumber,
        deliveryDate,
        notes 
    } = req.body;

    try {
        // Verificar que la orden existe
        const existingOrder = await Order.findById(id);
        if (!existingOrder) {
            return res.status(404).json({ 
                success: false,
                message: "Order not found" 
            });
        }

        // Verificar autorización (solo el propietario o admin)
        const cart = await Cart.findById(existingOrder.cartId);
        if (req.user.role !== 'admin' && cart.idClient.toString() !== req.user.id) {
            return res.status(403).json({ 
                success: false,
                message: "Not authorized to update this order" 
            });
        }

        const updateData = {};
        
        if (state) updateData.state = state;
        if (paymentStatus) updateData.paymentStatus = paymentStatus;
        if (deliveryStatus) updateData.deliveryStatus = deliveryStatus;
        if (trackingNumber) updateData.trackingNumber = trackingNumber;
        if (deliveryDate) updateData.deliveryDate = deliveryDate;
        if (notes) updateData.notes = notes;

        const updatedOrder = await Order.findByIdAndUpdate(
            id, 
            updateData, 
            { new: true }
        ).populate({
            path: "cartId",
            populate: {
                path: "Products.idProduct",
                model: "Product",
                select: "name description price stock imageUrl"
            }
        });

        res.json({ 
            success: true,
            message: "Order updated successfully", 
            order: updatedOrder 
        });
    } catch (error) {
        console.error('Error updating order:', error);
        res.status(500).json({ 
            success: false,
            message: "Error updating order", 
            error: error.message 
        });
    }
};

// Cancelar orden
orderController.cancelOrder = async (req, res) => {
    const { id } = req.params;
    const { reason } = req.body;

    try {
        const order = await Order.findById(id);
        
        if (!order) {
            return res.status(404).json({ 
                success: false,
                message: "Order not found" 
            });
        }

        // Verificar autorización
        const cart = await Cart.findById(order.cartId);
        if (req.user.role !== 'admin' && cart.idClient.toString() !== req.user.id) {
            return res.status(403).json({ 
                success: false,
                message: "Not authorized to cancel this order" 
            });
        }

        // Verificar que la orden se puede cancelar
        if (order.state === "Entregado" || order.state === "Cancelado") {
            return res.status(400).json({ 
                success: false,
                message: "Cannot cancel order in current state" 
            });
        }

        order.state = "Cancelado";
        order.cancelReason = reason || "Cancelled by user";
        order.cancelledAt = new Date();

        await order.save();

        // Permitir que el carrito vuelva a estado pendiente
        if (cart && cart.state === "Confirmado") {
            cart.state = "Pendiente";
            await cart.save();
        }

        res.json({ 
            success: true,
            message: "Order cancelled successfully", 
            order: order 
        });
    } catch (error) {
        console.error('Error cancelling order:', error);
        res.status(500).json({ 
            success: false,
            message: "Error cancelling order", 
            error: error.message 
        });
    }
};

// Obtener orden por ID
orderController.getOrderById = async (req, res) => {
    const { id } = req.params;

    try {
        const order = await Order.findById(id)
            .populate({
                path: "cartId",
                populate: {
                    path: "Products.idProduct",
                    model: "Product",
                    select: "name description price stock imageUrl quantity unit"
                }
            })
            .exec();

        if (!order) {
            return res.status(404).json({ 
                success: false,
                message: "Order not found" 
            });
        }

        // Verificar autorización
        const cart = await Cart.findById(order.cartId);
        if (req.user.role !== 'admin' && cart.idClient.toString() !== req.user.id) {
            return res.status(403).json({ 
                success: false,
                message: "Not authorized to view this order" 
            });
        }

        res.json({
            success: true,
            data: order,
            message: "Order retrieved successfully"
        });
    } catch (error) {
        console.error('Error getting order by ID:', error);
        res.status(500).json({ 
            success: false,
            message: "Error retrieving order", 
            error: error.message 
        });
    }
};

// Confirmar pago de orden
orderController.confirmPayment = async (req, res) => {
    const { id } = req.params;
    const { paymentId, paymentStatus, transactionDetails } = req.body;

    try {
        const order = await Order.findById(id);
        
        if (!order) {
            return res.status(404).json({ 
                success: false,
                message: "Order not found" 
            });
        }

        order.paymentId = paymentId;
        order.paymentStatus = paymentStatus || 'completed';
        order.paymentConfirmedAt = new Date();
        
        if (transactionDetails) {
            order.transactionDetails = transactionDetails;
        }

        // Si el pago es exitoso, cambiar estado de la orden
        if (paymentStatus === 'completed') {
            order.state = "Confirmado";
        } else if (paymentStatus === 'failed') {
            order.state = "Pago Fallido";
        }

        await order.save();

        res.json({ 
            success: true,
            message: "Payment status updated successfully", 
            order: order 
        });
    } catch (error) {
        console.error('Error confirming payment:', error);
        res.status(500).json({ 
            success: false,
            message: "Error confirming payment", 
            error: error.message 
        });
    }
};

// Eliminar orden (solo para admin)
orderController.deleteOrder = async (req, res) => {
    const { id } = req.params;

    try {
        const deletedOrder = await Order.findByIdAndDelete(id);
        
        if (!deletedOrder) {
            return res.status(404).json({ 
                success: false,
                message: "Order not found" 
            });
        }

        res.json({ 
            success: true,
            message: "Order deleted successfully",
            deletedOrder: deletedOrder 
        });
    } catch (error) {
        console.error('Error deleting order:', error);
        res.status(500).json({ 
            success: false,
            message: "Error deleting order", 
            error: error.message 
        });
    }
};

// Obtener estadísticas de órdenes (para dashboard admin)
orderController.getOrderStats = async (req, res) => {
    try {
        const stats = await Order.aggregate([
            {
                $group: {
                    _id: "$state",
                    count: { $sum: 1 },
                    totalAmount: { $sum: "$finalTotal" }
                }
            }
        ]);

        const totalOrders = await Order.countDocuments();
        const totalRevenue = await Order.aggregate([
            {
                $match: { state: { $in: ["Confirmado", "Entregado"] } }
            },
            {
                $group: {
                    _id: null,
                    total: { $sum: "$finalTotal" }
                }
            }
        ]);

        res.json({
            success: true,
            data: {
                stats: stats,
                totalOrders: totalOrders,
                totalRevenue: totalRevenue.length > 0 ? totalRevenue[0].total : 0
            },
            message: "Statistics retrieved successfully"
        });
    } catch (error) {
        console.error('Error getting order stats:', error);
        res.status(500).json({ 
            success: false,
            message: "Error retrieving order statistics", 
            error: error.message 
        });
    }
};

export default orderController;