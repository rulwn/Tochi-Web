import Cart from "../models/Cart.js"; 

const cartController = {};


cartController.getCart = async (req, res) => {
    const { userId } = req.params; 

    try {
        const cart = await Cart.findOne({ userId }).populate('products.productId', 'name price').exec(); // Obtenemos el carrito con los productos
        if (!cart) {
            return res.status(404).json({ message: "Cart not found" });
        }
        res.json(cart);
    } catch (error) {
        res.status(500).json({ message: "Error retrieving cart", error: error.message });
    }
};

//INSERTWE
cartController.insertCart = async (req, res) => {
    const { userId, products } = req.body; 

    try {
        const newCart = new Cart({
            userId,
            products,
            total: products.reduce((acc, product) => acc + product.subtotal, 0), 
            status: "Pendiente"
        });

        await newCart.save(); 
        res.json({ message: "Cart created", cart: newCart }); 
    } catch (error) {
        res.status(500).json({ message: "Error creating cart", error: error.message });
    }
};

//DELETE WE
cartController.deleteCart = async (req, res) => {
    const { userId } = req.params; 
    try {
        const cart = await Cart.findOneAndDelete({ userId });
        if (!cart) {
            return res.status(404).json({ message: "Cart not found" });
        }
        res.json({ message: "Cart deleted" });
    } catch (error) {
        res.status(500).json({ message: "Error deleting cart", error: error.message });
    }
};

//UPDATE WE
cartController.updateCart = async (req, res) => {
    const { userId } = req.params; 
    const { products } = req.body; 

    try {
        const cart = await Cart.findOne({ userId }); 

        if (!cart) {
            return res.status(404).json({ message: "Cart not found" });
        }

    
        cart.products = products;

        cart.total = products.reduce((acc, product) => acc + product.subtotal, 0);

        await cart.save();

        res.json({ message: "Cart updated", cart }); 
    } catch (error) {
        res.status(500).json({ message: "Error updating cart", error: error.message });
    }
};


export default cartController;