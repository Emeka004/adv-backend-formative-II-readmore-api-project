import express from 'express';
import {
  createBook,
  deleteBook,
  getAllBooks,
  getBookById,
  updateBook,
} from '../controllers/bookController.js';

const router = express.Router();

router.post('/', createBook);
router.get('/', getAllBooks);
router.get('/:id', getBookById);
router.put('/:id', updateBook);
router.delete('/:id', deleteBook);

export default router;
