import mongoose from 'mongoose';
import Author from '../models/Author.js';
import Book from '../models/Book.js';

const isValidObjectId = (id) => mongoose.Types.ObjectId.isValid(id);

const normalizeBookFilters = (reqQuery) => {
  const filter = {};
  const { genre, minPrice, maxPrice, author, search } = reqQuery;

  if (genre) filter.genre = genre;

  if (author) {
    if (!isValidObjectId(author)) {
      throw new Error('Author id is invalid.');
    }
    filter.author = author;
  }

  if (search) {
    filter.title = { $regex: search, $options: 'i' };
  }

  if (minPrice || maxPrice) {
    filter.price = {};

    if (minPrice !== undefined && minPrice !== '') {
      const parsedMin = Number(minPrice);
      if (Number.isNaN(parsedMin)) {
        throw new Error('minPrice must be a number.');
      }
      filter.price.$gte = parsedMin;
    }

    if (maxPrice !== undefined && maxPrice !== '') {
      const parsedMax = Number(maxPrice);
      if (Number.isNaN(parsedMax)) {
        throw new Error('maxPrice must be a number.');
      }
      filter.price.$lte = parsedMax;
    }
  }

  return filter;
};

const buildSort = (reqQuery) => {
  const { sort, order } = reqQuery;
  const allowedFields = ['price', 'title', 'publishedYear'];
  const direction = order === 'desc' ? -1 : 1;

  if (!sort || !allowedFields.includes(sort)) {
    return { createdAt: -1 };
  }

  return { [sort]: direction };
};

export const createBook = async (req, res) => {
  try {
    const { title, genre, price, publishedYear, author } = req.body;

    if (!title || !genre || price === undefined || !publishedYear || !author) {
      return res.status(400).json({ message: 'Title, genre, price, publishedYear and author are required.' });
    }

    if (!isValidObjectId(author)) {
      return res.status(400).json({ message: 'Author id is invalid.' });
    }

    const existingAuthor = await Author.findById(author);
    if (!existingAuthor) {
      return res.status(400).json({ message: 'A book must belong to a real author.' });
    }

    const duplicateTitle = await Book.findOne({
      author,
      title: { $regex: `^${title.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}$`, $options: 'i' },
    });

    if (duplicateTitle) {
      return res.status(409).json({ message: 'This author already has a book with the same title.' });
    }

    if (Number(price) <= 0) {
      return res.status(422).json({ message: 'Price must be greater than zero.' });
    }

    if (Number(publishedYear) < 1450 || Number(publishedYear) > new Date().getFullYear()) {
      return res.status(422).json({ message: 'publishedYear must be between 1450 and the current year.' });
    }

    const book = await Book.create({
      title,
      genre,
      price: Number(price),
      publishedYear: Number(publishedYear),
      author,
    });

    const populatedBook = await Book.findById(book._id).populate('author');
    return res.status(201).json(populatedBook);
  } catch (error) {
    return res.status(500).json({ message: 'Failed to create book', error: error.message });
  }
};

export const getAllBooks = async (req, res) => {
  try {
    const filter = normalizeBookFilters(req.query);
    const sortOptions = buildSort(req.query);
    const page = Number(req.query.page) || 1;
    const requestedLimit = Number(req.query.limit);
    const total = await Book.countDocuments(filter);
    const defaultLimit = total > 0 ? total : 1;
    const limit = requestedLimit > 0 ? requestedLimit : defaultLimit;

    const books = await Book.find(filter)
      .populate('author')
      .sort(sortOptions)
      .skip((page - 1) * limit)
      .limit(limit);

    return res.status(200).json({
      page,
      limit,
      total,
      results: books,
    });
  } catch (error) {
    return res.status(400).json({ message: error.message || 'Failed to fetch books' });
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

    if (!isValidObjectId(author)) {
      return res.status(400).json({ message: 'Author id is invalid.' });
    }

    const authorExists = await Author.findById(author);
    if (!authorExists) {
      return res.status(400).json({ message: 'A book must belong to a real author.' });
    }

    const existingBook = await Book.findById(req.params.id);
    if (!existingBook) {
      return res.status(404).json({ message: 'Book not found.' });
    }

    const duplicateTitle = await Book.findOne({
      author,
      _id: { $ne: req.params.id },
      title: { $regex: `^${title.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}$`, $options: 'i' },
    });

    if (duplicateTitle) {
      return res.status(409).json({ message: 'This author already has a book with the same title.' });
    }

    if (Number(price) <= 0) {
      return res.status(422).json({ message: 'Price must be greater than zero.' });
    }

    if (Number(publishedYear) < 1450 || Number(publishedYear) > new Date().getFullYear()) {
      return res.status(422).json({ message: 'publishedYear must be between 1450 and the current year.' });
    }

    const updatedBook = await Book.findByIdAndUpdate(
      req.params.id,
      { title, genre, price: Number(price), publishedYear: Number(publishedYear), author },
      { new: true, runValidators: true }
    ).populate('author');

    return res.status(200).json(updatedBook);
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
