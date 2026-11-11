import Author from '../models/Author.js';

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

    await Author.findByIdAndDelete(req.params.id);
    return res.status(200).json({ message: 'Author deleted successfully.' });
  } catch (error) {
    return res.status(500).json({ message: 'Failed to delete author', error: error.message });
  }
};
