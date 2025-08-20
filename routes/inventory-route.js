import express from 'express';
import {
  createCategory,
  createProduct,
  deleteCategory,
  deleteProduct,
  getAllProducts,
  getCategoriesController,
  loadCategory,
  orderStock,
  updateCategory,
  updateProduct,
} from '../controllers/inventoryController.js';
import upload from '../middlewares/uploadConfig.js';
import catService from '../services/categoryService.js';

const router = express.Router();

router.get('/', getAllProducts);
router.post(
  '/new-product',

  upload.single('image'),
  createProduct
);
router.patch('/:id/update', upload.single('image'), updateProduct);
router.delete('/:id/delete', deleteProduct);
router.post('/order/:productId', orderStock);

router.post('/category', createCategory);

router.get('/category', getCategoriesController);
router.get('/load-category', loadCategory);
router.get('/category', getCategoriesController);
router.patch('/category/:id/update', updateCategory);
router.delete('/category/:id/delete', deleteCategory);
export default router;
