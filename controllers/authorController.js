import Author from '../models/Author.js';
import Book from '../models/Book.js';

export const createAuthor = async (req, res) => {
  try {
    const { name, country, bio } = req.body;

    if (!name || !country || !bio) {
      return res.status(400).json({ message: 'Name, country and bio are required.' });
    }

    const author = await Author.create({ name, country, bio });
    return res.status(201).json(author);
  } catch (error) {
    return res.status(500).json({ message: 'Failed to create author', error: error.message });
  }
};

export const getAllAuthors = async (req, res) => {
  try {
    const authors = await Author.find().sort({ createdAt: -1 });
    return res.status(200).json(authors);
  } catch (error) {
    return res.status(500).json({ message: 'Failed to fetch authors', error: error.message });
  }
};

export const getAuthorById = async (req, res) => {
  try {
    const author = await Author.findById(req.params.id);

    if (!author) {
      return res.status(404).json({ message: 'Author not found.' });
    }

    return res.status(200).json(author);
  } catch (error) {
    return res.status(500).json({ message: 'Failed to fetch author', error: error.message });
  }
};

export const updateAuthor = async (req, res) => {
  try {
    const { name, country, bio } = req.body;

    if (!name || !country || !bio) {
      return res.status(400).json({ message: 'Name, country and bio are required.' });
    }

    const author = await Author.findByIdAndUpdate(
      req.params.id,
      { name, country, bio },
      { new: true, runValidators: true }
    );

    if (!author) {
      return res.status(404).json({ message: 'Author not found.' });
    }

    return res.status(200).json(author);
  } catch (error) {
    return res.status(500).json({ message: 'Failed to update author', error: error.message });
  }
};

export const deleteAuthor = async (req, res) => {
  try {
    const author = await Author.findById(req.params.id);

    if (!author) {
      return res.status(404).json({ message: 'Author not found.' });
    }

    const linkedBooks = await Book.find({ author: req.params.id });

    if (linkedBooks.length > 0) {
      return res.status(409).json({
        message: 'Cannot delete author because they still have books. Blocked to prevent orphaned records.',
      });
    }

    await Author.findByIdAndDelete(req.params.id);
    return res.status(200).json({ message: 'Author deleted successfully.' });
  } catch (error) {
    return res.status(500).json({ message: 'Failed to delete author', error: error.message });
  }
};

export const getAuthorBooks = async (req, res) => {
  try {
    const author = await Author.findById(req.params.id);

    if (!author) {
      return res.status(404).json({ message: 'Author not found.' });
    }

    const books = await Book.find({ author: req.params.id }).populate('author').sort({ createdAt: -1 });
    return res.status(200).json(books);
  } catch (error) {
    return res.status(500).json({ message: 'Failed to fetch books for author', error: error.message });
  }
};

export const getAuthorStats = async (req, res) => {
  try {
    const author = await Author.findById(req.params.id);

    if (!author) {
      return res.status(404).json({ message: 'Author not found.' });
    }

    const books = await Book.find({ author: req.params.id }).sort({ price: 1 });

    if (books.length === 0) {
      return res.status(200).json({
        author: author.name,
        bookCount: 0,
        averagePrice: 0,
        cheapestBook: null,
        mostExpensiveBook: null,
      });
    }

    const total = books.reduce((sum, book) => sum + Number(book.price), 0);
    const average = total / books.length;
    const averagePrice = Number((average + Number.EPSILON * Math.abs(average)).toFixed(2));
    const cheapestBook = books[0]?.title || null;
    const mostExpensiveBook = books[books.length - 1]?.title || null;

    return res.status(200).json({
      author: author.name,
      bookCount: books.length,
      averagePrice,
      cheapestBook,
      mostExpensiveBook,
    });
  } catch (error) {
    return res.status(500).json({ message: 'Failed to fetch author stats', error: error.message });
  }
};
