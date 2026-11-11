import assert from 'node:assert/strict';
import { after, before, test } from 'node:test';
import mongoose from 'mongoose';
import { app } from '../server.js';
import Author from '../models/Author.js';
import Book from '../models/Book.js';

const mongoUri = process.env.MONGODB_TEST_URI || 'mongodb://127.0.0.1:27017/readmore_test';
let server;
let baseUrl;

const request = async (method, path, body) => {
  const response = await fetch(`${baseUrl}${path}`, {
    method,
    headers: body ? { 'Content-Type': 'application/json' } : undefined,
    body: body ? JSON.stringify(body) : undefined,
  });

  return {
    status: response.status,
    body: await response.json(),
  };
};

before(async () => {
  await mongoose.connect(mongoUri);
  await Promise.all([Author.deleteMany({}), Book.deleteMany({})]);
  server = app.listen(0);
  await new Promise((resolve) => server.once('listening', resolve));
  baseUrl = `http://127.0.0.1:${server.address().port}`;
});

after(async () => {
  if (server) {
    await new Promise((resolve, reject) => {
      server.close((error) => (error ? reject(error) : resolve()));
    });
  }
  await Promise.all([Author.deleteMany({}), Book.deleteMany({})]);
  await mongoose.disconnect();
});

test('API endpoints, business rules, filters, and edge cases', async () => {
  const health = await request('GET', '/');
  assert.equal(health.status, 200);
  assert.equal(health.body.message, 'ReadMore API is running');

  const missingAuthorFields = await request('POST', '/authors', { name: 'Incomplete' });
  assert.equal(missingAuthorFields.status, 400);

  const authorResponse = await request('POST', '/authors', {
    name: 'Stage Five Author',
    country: 'Canada',
    bio: 'Integration test author.',
  });
  assert.equal(authorResponse.status, 201);
  const authorId = authorResponse.body._id;

  const authorById = await request('GET', `/authors/${authorId}`);
  assert.equal(authorById.status, 200);
  assert.equal(authorById.body.name, 'Stage Five Author');
  assert.equal((await request('GET', '/authors')).status, 200);

  const updatedAuthor = await request('PUT', `/authors/${authorId}`, {
    name: 'Stage Five Author Updated',
    country: 'Canada',
    bio: 'Updated integration test author.',
  });
  assert.equal(updatedAuthor.status, 200);

  const missingAuthor = await request('GET', '/authors/507f1f77bcf86cd799439011');
  assert.equal(missingAuthor.status, 404);

  const orphanBook = await request('POST', '/books', {
    title: 'Orphan', genre: 'Mystery', price: 10, publishedYear: 2020,
    author: '507f1f77bcf86cd799439011',
  });
  assert.equal(orphanBook.status, 400);

  const invalidAuthorId = await request('POST', '/books', {
    title: 'Invalid author', genre: 'Mystery', price: 10, publishedYear: 2020,
    author: 'not-an-object-id',
  });
  assert.equal(invalidAuthorId.status, 400);

  const firstBook = await request('POST', '/books', {
    title: 'The Silent Sea', genre: 'Thriller', price: 24.99, publishedYear: 2021,
    author: authorId,
  });
  assert.equal(firstBook.status, 201);
  assert.equal(firstBook.body.author.name, 'Stage Five Author Updated');
  const firstBookId = firstBook.body._id;

  const duplicate = await request('POST', '/books', {
    title: 'the silent sea', genre: 'Thriller', price: 20, publishedYear: 2022,
    author: authorId,
  });
  assert.equal(duplicate.status, 409);

  const invalidPrice = await request('POST', '/books', {
    title: 'Invalid price', genre: 'Thriller', price: 0, publishedYear: 2022,
    author: authorId,
  });
  assert.equal(invalidPrice.status, 422);

  const negativePrice = await request('POST', '/books', {
    title: 'Negative price', genre: 'Thriller', price: -1, publishedYear: 2022,
    author: authorId,
  });
  assert.equal(negativePrice.status, 422);

  const nonNumericPrice = await request('POST', '/books', {
    title: 'Non-numeric price', genre: 'Thriller', price: 'unknown', publishedYear: 2022,
    author: authorId,
  });
  assert.equal(nonNumericPrice.status, 422);

  const invalidYear = await request('POST', '/books', {
    title: 'Invalid year', genre: 'Thriller', price: 12, publishedYear: 1449,
    author: authorId,
  });
  assert.equal(invalidYear.status, 422);

  const futureYear = await request('POST', '/books', {
    title: 'Future year', genre: 'Thriller', price: 12, publishedYear: new Date().getFullYear() + 1,
    author: authorId,
  });
  assert.equal(futureYear.status, 422);

  const secondBook = await request('POST', '/books', {
    title: 'A Quiet Shore', genre: 'Drama', price: 18.5, publishedYear: 2020,
    author: authorId,
  });
  assert.equal(secondBook.status, 201);

  const booksForAuthor = await request('GET', `/authors/${authorId}/books`);
  assert.equal(booksForAuthor.status, 200);
  assert.equal(booksForAuthor.body.length, 2);

  const stats = await request('GET', `/authors/${authorId}/stats`);
  assert.equal(stats.status, 200);
  assert.equal(stats.body.bookCount, 2);
  assert.equal(stats.body.averagePrice, 21.75);

  const filteredBooks = await request(
    'GET',
    `/books?genre=Thriller&minPrice=20&maxPrice=30&search=sea&author=${authorId}&sort=price&order=asc&page=1&limit=1`
  );
  assert.equal(filteredBooks.status, 200);
  assert.equal(filteredBooks.body.total, 1);
  assert.equal(filteredBooks.body.results.length, 1);
  assert.equal(filteredBooks.body.results[0].title, 'The Silent Sea');

  const bookById = await request('GET', `/books/${firstBookId}`);
  assert.equal(bookById.status, 200);
  assert.equal(bookById.body.author._id, authorId);
  assert.equal((await request('GET', '/books?page=1&limit=1')).body.results.length, 1);

  const updatedBook = await request('PUT', `/books/${firstBookId}`, {
    title: 'The Silent Sea Revised', genre: 'Thriller', price: 25, publishedYear: 2021,
    author: authorId,
  });
  assert.equal(updatedBook.status, 200);

  const blockedDelete = await request('DELETE', `/authors/${authorId}`);
  assert.equal(blockedDelete.status, 409);

  const deletedBook = await request('DELETE', `/books/${firstBookId}`);
  assert.equal(deletedBook.status, 200);
  const deletedBookLookup = await request('GET', `/books/${firstBookId}`);
  assert.equal(deletedBookLookup.status, 404);

  const emptyAuthor = await request('POST', '/authors', {
    name: 'No Books Author', country: 'Ireland', bio: 'No linked books.',
  });
  const emptyStats = await request('GET', `/authors/${emptyAuthor.body._id}/stats`);
  assert.equal(emptyStats.status, 200);
  assert.equal(emptyStats.body.bookCount, 0);
  assert.equal(emptyStats.body.averagePrice, 0);
  assert.equal(emptyStats.body.cheapestBook, null);
  assert.equal((await request('DELETE', `/authors/${emptyAuthor.body._id}`)).status, 200);
});