import Product from "../models/Products.js";
import { v2 as cloudinary } from 'cloudinary'
import config from '../config.js'

cloudinary.config({
    cloud_name: config.cloudinary.cloudinary_name,
    api_key: config.cloudinary.cloudinary_api_key,
    api_secret: config.cloudinary.cloudinary_api_secret
})

const productsController = {};
//Get
productsController.getProducts = async (req, res) => {
    const products = await Product.find();
    res.json(products);
};
//Post
productsController.createProduct = async (req, res) => {
    try {
        const { name, description, price, stock, idCategory } = req.body;
        let image

        if (req.file) {
            const result = await cloudinary.upload(req.file.path, {
                folder: 'tochi',
                allowed_formats: ['jpg', 'png', 'jpeg']
            })
            image = result.secure_url
        }


        const newProduct = new Product({ name, description, price, stock, idCategory, imageUrl: image });
        await newProduct.save();
        res.json({ message: "Product created" });
    }
    catch (error) {
        res.status(400).json({ message: error.message })

    }
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