import Cart from "../models/Cart.js"; 

const cartController = {};


cartController.getCart = async (req, res) => {
    try {
        const carts = await Cart.find()
            .populate("Products.idProduct", "name price") 
            .exec();

        if (!carts.length) {
            return res.status(404).json({ message: "No carts found" });
        }

        res.json(carts);
    } catch (error) {
        res.status(500).json({ message: "Error retrieving carts", error: error.message });
    }
};
//INSERTWE
cartController.insertCart = async (req, res) => {
    const { idClient, Products } = req.body; 

    try {
        if (!Products || !Array.isArray(Products) || Products.length === 0) {
            return res.status(400).json({ message: "Products array is required and must not be empty" });
        }

        
        const processedProducts = Products.map(product => ({
            idProduct: product.idProduct,
            quantity: Number(product.quantity), 
            subtotal: Number(product.subtotal) 
        }));

        const total = processedProducts.reduce((acc, product) => acc + product.subtotal, 0);

        const newCart = new Cart({
            idClient,
            Products: processedProducts,
            total,
            state: "Pendiente"
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