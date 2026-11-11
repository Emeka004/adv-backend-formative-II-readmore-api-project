import express from 'express';
import {
  createAuthor,
  deleteAuthor,
  getAllAuthors,
  getAuthorBooks,
  getAuthorById,
  getAuthorStats,
  updateAuthor,
} from '../controllers/authorController.js';

const router = express.Router();

router.post('/', createAuthor);
router.get('/', getAllAuthors);
router.get('/:id/books', getAuthorBooks);
router.get('/:id/stats', getAuthorStats);
router.get('/:id', getAuthorById);
router.put('/:id', updateAuthor);
router.delete('/:id', deleteAuthor);

export default router;
