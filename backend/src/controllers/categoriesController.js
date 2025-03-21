import Category from "../models/Categories.js";
const categoriesController = {};

// Obtener todas las categorías (GET)
categoriesController.getCategories = async (req, res) => {
    try {
        const categories = await Category.find();
        res.json(categories);
    } catch (error) {
        res.status(500).json({ message: "Error retrieving categories", error: error.message });
    }
};

// Crear una nueva categoría (POST)
categoriesController.createCategory = async (req, res) => {
    try {
        const { name } = req.body;

        if (!name) {
            return res.status(400).json({ message: "Category name is required" });
        }

        const newCategory = new Category({ name });
        await newCategory.save();
        res.json({ message: "Category created", category: newCategory });
    } catch (error) {
        res.status(500).json({ message: "Error creating category", error: error.message });
    }
};

// Actualizar una categoría existente (PUT)
categoriesController.updateCategory = async (req, res) => {
    try {
        const { name } = req.body;
        const updatedCategory = await Category.findByIdAndUpdate(
            req.params.id,
            { name },
            { new: true }
        );

        if (!updatedCategory) {
            return res.status(404).json({ message: "Category not found" });
        }

        res.json({ message: "Category updated", category: updatedCategory });
    } catch (error) {
        res.status(500).json({ message: "Error updating category", error: error.message });
    }
};

// Eliminar una categoría (DELETE)
categoriesController.deleteCategory = async (req, res) => {
    try {
        const deletedCategory = await Category.findByIdAndDelete(req.params.id);

        if (!deletedCategory) {
            return res.status(404).json({ message: "Category not found" });
        }

        res.json({ message: "Category deleted", category: deletedCategory });
    } catch (error) {
        res.status(500).json({ message: "Error deleting category", error: error.message });
    }
};

export default categoriesController;