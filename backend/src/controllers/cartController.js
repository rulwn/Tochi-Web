import Cart from "../models/Cart.js"; 

const cartController = {};

// Obtener carrito por ID de usuario específico
cartController.getCartByUserId = async (req, res) => {
    try {
        const { userId } = req.params;
        
        const cart = await Cart.findOne({ 
            idClient: userId,
            state: "Pendiente" 
        })
        .populate("Products.idProduct", "name price imageUrl quantity unit") 
        .exec();

        if (!cart) {
            return res.status(404).json({ message: "Cart not found for this user" });
        }

        // Transformar los datos para que coincidan con el formato esperado en el frontend
        const transformedCart = {
            ...cart.toObject(),
            Products: cart.Products.map(item => ({
                ...item.idProduct.toObject(),
                id: item.idProduct._id,
                selectedQuantity: item.quantity,
                subtotal: item.subtotal
            }))
        };

        res.json(transformedCart);
    } catch (error) {
        res.status(500).json({ message: "Error retrieving cart", error: error.message });
    }
};

// Obtener todos los carritos (para admin)
cartController.getCart = async (req, res) => {
    try {
        const carts = await Cart.find()
            .populate("Products.idProduct", "name price imageUrl quantity unit") 
            .populate("idClient", "name email")
            .exec();

        if (!carts.length) {
            return res.status(404).json({ message: "No carts found" });
        }

        res.json(carts);
    } catch (error) {
        res.status(500).json({ message: "Error retrieving carts", error: error.message });
    }
};

// Crear nuevo carrito
cartController.insertCart = async (req, res) => {
    const { idClient, Products } = req.body; 

    try {
        if (!Products || !Array.isArray(Products) || Products.length === 0) {
            return res.status(400).json({ message: "Products array is required and must not be empty" });
        }

        // Verificar si ya existe un carrito pendiente para este usuario
        const existingCart = await Cart.findOne({ 
            idClient, 
            state: "Pendiente" 
        });

        if (existingCart) {
            return res.status(400).json({ 
                message: "User already has a pending cart", 
                cartId: existingCart._id 
            });
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
        
        // Poblar los datos del producto antes de enviar la respuesta
        await newCart.populate("Products.idProduct", "name price imageUrl quantity unit");
        
        res.status(201).json({ message: "Cart created", cart: newCart });

    } catch (error) {
        res.status(500).json({ message: "Error creating cart", error: error.message });
    }
};

// Eliminar carrito
cartController.deleteCart = async (req, res) => {
    const { userId } = req.params; 
    try {
        const cart = await Cart.findOneAndDelete({ 
            idClient: userId, 
            state: "Pendiente" 
        });
        
        if (!cart) {
            return res.status(404).json({ message: "Cart not found" });
        }
        
        res.json({ message: "Cart deleted successfully" });
    } catch (error) {
        res.status(500).json({ message: "Error deleting cart", error: error.message });
    }
};

// Actualizar carrito
cartController.updateCart = async (req, res) => {
    const { userId } = req.params; 
    const { products } = req.body; 

    try {
        if (!products || !Array.isArray(products)) {
            return res.status(400).json({ message: "Products array is required" });
        }

        const cart = await Cart.findOne({ 
            idClient: userId, 
            state: "Pendiente" 
        }); 

        if (!cart) {
            return res.status(404).json({ message: "Cart not found" });
        }

        // Procesar productos
        const processedProducts = products.map(product => ({
            idProduct: product.idProduct,
            quantity: Number(product.quantity),
            subtotal: Number(product.subtotal)
        }));

        // Actualizar productos y calcular nuevo total
        cart.Products = processedProducts;
        cart.total = processedProducts.reduce((acc, product) => acc + product.subtotal, 0);

        await cart.save();

        // Poblar los datos antes de enviar respuesta
        await cart.populate("Products.idProduct", "name price imageUrl quantity unit");

        res.json({ message: "Cart updated successfully", cart }); 
    } catch (error) {
        res.status(500).json({ message: "Error updating cart", error: error.message });
    }
};

// Confirmar carrito (cambiar estado a "Confirmado")
cartController.confirmCart = async (req, res) => {
    const { userId } = req.params;
    
    try {
        const cart = await Cart.findOne({ 
            idClient: userId, 
            state: "Pendiente" 
        });

        if (!cart) {
            return res.status(404).json({ message: "No pending cart found for this user" });
        }

        cart.state = "Confirmado";
        await cart.save();

        res.json({ message: "Cart confirmed successfully", cart });
    } catch (error) {
        res.status(500).json({ message: "Error confirming cart", error: error.message });
    }
};

// Cancelar carrito
cartController.cancelCart = async (req, res) => {
    const { userId } = req.params;
    
    try {
        const cart = await Cart.findOne({ 
            idClient: userId, 
            state: "Pendiente" 
        });

        if (!cart) {
            return res.status(404).json({ message: "No pending cart found for this user" });
        }

        cart.state = "Cancelado";
        await cart.save();

        res.json({ message: "Cart cancelled successfully", cart });
    } catch (error) {
        res.status(500).json({ message: "Error cancelling cart", error: error.message });
    }
};

export default cartController;