import express from 'express';
import categoriesController from '../controllers/categoriesController.js';
const router = express.Router();
router.route('/')
    .get(categoriesController.getCategories)
    .post(categoriesController.createCategory);
router.route('/:id')
    .put(categoriesController.updateCategory)
    .delete(categoriesController.deleteCategory);
export default router;