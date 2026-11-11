import Author from '../models/Author.js';
import Book from '../models/Book.js';

export const createBook = async (req, res) => {
  try {
    const { title, genre, price, publishedYear, author } = req.body;

    if (!title || !genre || price === undefined || !publishedYear || !author) {
      return res.status(400).json({ message: 'Title, genre, price, publishedYear and author are required.' });
    }

    const authorExists = await Author.findById(author);
    if (!authorExists) {
      return res.status(400).json({ message: 'Author does not exist.' });
    }

    const book = await Book.create({ title, genre, price, publishedYear, author });
    const populatedBook = await Book.findById(book._id).populate('author');

    return res.status(201).json(populatedBook);
  } catch (error) {
    return res.status(500).json({ message: 'Failed to create book', error: error.message });
  }
};

export const getAllBooks = async (req, res) => {
  try {
    const books = await Book.find().populate('author').sort({ createdAt: -1 });
    return res.status(200).json(books);
  } catch (error) {
    return res.status(500).json({ message: 'Failed to fetch books', error: error.message });
  }
};

export const getBookById = async (req, res) => {
  try {
    const book = await Book.findById(req.params.id).populate('author');

    if (!book) {
      return res.status(404).json({ message: 'Book not found.' });
    }

    return res.status(200).json(book);
  } catch (error) {
    return res.status(500).json({ message: 'Failed to fetch book', error: error.message });
  }
};

export const updateBook = async (req, res) => {
  try {
    const { title, genre, price, publishedYear, author } = req.body;

    if (!title || !genre || price === undefined || !publishedYear || !author) {
      return res.status(400).json({ message: 'Title, genre, price, publishedYear and author are required.' });
    }

    const authorExists = await Author.findById(author);
    if (!authorExists) {
      return res.status(400).json({ message: 'Author does not exist.' });
    }

    const book = await Book.findByIdAndUpdate(
      req.params.id,
      { title, genre, price, publishedYear, author },
      { new: true, runValidators: true }
    ).populate('author');

    if (!book) {
      return res.status(404).json({ message: 'Book not found.' });
    }

    return res.status(200).json(book);
  } catch (error) {
    return res.status(500).json({ message: 'Failed to update book', error: error.message });
  }
};

export const deleteBook = async (req, res) => {
  try {
    const book = await Book.findById(req.params.id);

    if (!book) {
      return res.status(404).json({ message: 'Book not found.' });
    }

    await Book.findByIdAndDelete(req.params.id);
    return res.status(200).json({ message: 'Book deleted successfully.' });
  } catch (error) {
    return res.status(500).json({ message: 'Failed to delete book', error: error.message });
  }
};
