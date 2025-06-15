import Order from "../models/Order.js"
import Products from "../models/Products.js"
import Cart from "../models/Cart.js"

const orderController = {}

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
            .exec()


        if (!orders.length) {
            return res.status(404).json({ message: "No orders found" })
        }

        res.json(orders)
    } catch (error) {
        console.error('Error in getOrders:', error);
        res.status(500).json({ message: "Error retrieving orders", error: error.message })
    }
}

orderController.postOrder = async (req, res) => {
    const { cartId, address, payingMetod } = req.body
    
    try {
        const cart = await Cart.findById(cartId)
        if (!cart) {
            return res.status(404).json({ message: "Cart not found" })
        }

        const newOrder = new Order({ 
            cartId, 
            address, 
            payingMetod, 
            state: "Pendiente"
        })

        const order = await newOrder.save()
        res.status(201).json(order)
    } catch (error) {
        res.status(500).json({ message: "Error creating order", error: error.message })
    }
}

orderController.putOrder = async (req, res) => {
    const { id } = req.params;
    const { state } = req.body;

    try {
        const putOrder = await Order.findByIdAndUpdate(id, { state }, { new: true })
            .populate({
                path: "cartId",
                populate: {
                    path: "Products.idProduct",
                    model: "Product",
                    select: "name description price stock imageUrl"
                }
            });
        
        if (!putOrder) {
            return res.status(404).json({ message: "Order not found" });
        }

        res.json(putOrder);
    } catch (error) {
        res.status(500).json({ message: "Error updating order", error: error.message });
    }
};

// DELETE eliminar orden
orderController.deleteOrder = async (req, res) => {
    const { id } = req.params;

    try {
        const deletedOrder = await Order.findByIdAndDelete(id);
        
        if (!deletedOrder) {
            return res.status(404).json({ message: "Order not found" });
        }

        res.json({ message: "Order deleted successfully" });
    } catch (error) {
        res.status(500).json({ message: "Error deleting order", error: error.message });
    }
};

export default orderController