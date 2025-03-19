import Product from "../models/Products.js";
const productsController = {};
//Get
productsController.getProducts = async (req, res) => {
    const products = await Product.find();
    res.json(products);
};
//Post
productsController.createProduct = async (req, res) => {
    const { name, description, price, stock, idCategory, imageUrl } = req.body;
    const newProduct = new Product({ name, description, price, stock, idCategory, imageUrl });
    await newProduct.save();
    res.json({ message: "Product created" });
};
//Put
productsController.updateProduct = async (req, res) => {
    try {
        const { name, description, price, stock, idCategory, imageUrl } = req.body;
        const updatedProduct = await Product.findByIdAndUpdate(
            req.params.id,
            { name, description, price, stock, idCategory, imageUrl },
            { new: true }
        );

        if (!updatedProduct) {
            return res.status(404).json({ message: "Product not found" });
        }

        res.json({ message: "Product updated", product: updatedProduct });
    } catch (error) {
        res.status(500).json({ message: "Error updating product", error: error.message });
    }
}
//Delete
productsController.deleteProduct = async (req, res) => {
    await Product.findByIdAndDelete(req.params.id);
    res.json({ message: "Product deleted" + req.params.id });
}

export default productsController;