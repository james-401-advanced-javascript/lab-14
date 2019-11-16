'use strict';

const { startDB, stopDB } = require('./supertester.js');
const Users = require('../src/models/users-model.js');
const Roles = require('../src/models/roles-model.js');
const Books = require('../src/models/books-model.js');
const server = require('../src/server.js').server;
const supertester = require('./supertester.js');

const mockRequest = supertester.server(server);
process.env.JWT_SECRET = 'test-secret';

let users = {
  admin: {
    username: 'sarah',
    password: 'sarahpassword',
    email: 'sarah@email.com',
    role: 'admin',
  },
  editor: {
    username: 'bill',
    password: 'billpassword',
    email: 'bill@email.com',
    role: 'editor',
  },
  user: {
    username: 'rene',
    password: 'renepassword',
    email: 'rene@email.com',
    role: 'user',
  },
};

let roles = {
  admin: {
    role: 'admin',
    capabilities: ['create', 'read', 'update', 'delete', 'superuser'],
  },
  editor: { role: 'editor', capabilities: ['create', 'read', 'update'] },
  user: { role: 'user', capabilities: ['read'] },
};

let books = {
  all: {
    title: 'Alice in Wonderland',
    auth: ['admin', 'editor', 'user'],
  },
  some: {
    title: 'Hamlet',
    auth: ['admin', 'editor'],
  },
  few: {
    title: 'Brave New World',
    auth: ['admin'],
  },
};

beforeAll(async done => {
  let usersDB = new Users();
  let rolesDB = new Roles();
  let booksDB = new Books();
  await startDB();
  await usersDB.create(users.admin);
  await usersDB.create(users.editor);
  await usersDB.create(users.user);
  await rolesDB.create(roles.admin);
  await rolesDB.create(roles.editor);
  await rolesDB.create(roles.user);
  await booksDB.create(books.all);
  await booksDB.create(books.some);
  await booksDB.create(books.few);
  done();
});

afterAll(stopDB);

describe('books route works as expected', () => {
  let adminBasicAuth =
    'Basic ' + Buffer.from('sarah:sarahpassword').toString('base64');

  let editorBasicAuth =
    'Basic ' + Buffer.from('bill:billpassword').toString('base64');

  let userBasicAuth =
    'Basic ' + Buffer.from('rene:renepassword').toString('base64');

  it('does not work when user is not authenticated', async () => {
    let response = await mockRequest
      .post('/books')
      .set('Content-Type', 'application/json')
      .set('Accept', 'application/json');

    expect(response.status).toBe(400);
    expect(response.body.error).toBe('Missing request headers!');
  });
  it('does work when a user is authenticated', async () => {
    let response = await mockRequest
      .post('/signin')
      .set('Content-Type', 'application/json')
      .set('Accept', 'application/json')
      .set('Authorization', adminBasicAuth);

    let bookResponse = await mockRequest
      .get('/books')
      .set('Content-Type', 'application/json')
      .set('Accept', 'application/json')
      .set('Authorization', response.body.token);
    expect(bookResponse.status).toBe(200);
    expect(bookResponse.body.length).toBe(3);
  });
  it('returns correct books for editor authorization', async () => {
    let response = await mockRequest
      .post('/signin')
      .set('Content-Type', 'application/json')
      .set('Accept', 'application/json')
      .set('Authorization', editorBasicAuth);

    let bookResponse = await mockRequest
      .get('/books')
      .set('Content-Type', 'application/json')
      .set('Accept', 'application/json')
      .set('Authorization', response.body.token);
    expect(bookResponse.status).toBe(200);
    expect(bookResponse.body.length).toBe(2);
  });
  it('returns correct books for user authorization', async () => {
    let response = await mockRequest
      .post('/signin')
      .set('Content-Type', 'application/json')
      .set('Accept', 'application/json')
      .set('Authorization', userBasicAuth);

    let bookResponse = await mockRequest
      .get('/books')
      .set('Content-Type', 'application/json')
      .set('Accept', 'application/json')
      .set('Authorization', response.body.token);
    expect(bookResponse.status).toBe(200);
    expect(bookResponse.body.length).toBe(1);
  });
  it('allows authenticated user to create new book', async () => {
    let response = await mockRequest
      .post('/signin')
      .set('Content-Type', 'application/json')
      .set('Accept', 'application/json')
      .set('Authorization', adminBasicAuth);

    let bookResponse = await mockRequest
      .post('/books')
      .set('Content-Type', 'application/json')
      .set('Accept', 'application/json')
      .set('Authorization', response.body.token)
      .send({ title: '1984', author: 'George Orwell' });
    expect(bookResponse.status).toBe(200);
    expect(bookResponse.body).toBe('You created a book!');
  });
  it('allows authenticated user to update book', async () => {
    let response = await mockRequest
      .post('/signin')
      .set('Content-Type', 'application/json')
      .set('Accept', 'application/json')
      .set('Authorization', adminBasicAuth);

    let newBook = new Books();
    let bookToUpdate = await newBook.getFromField();
    let bookResponse = await mockRequest
      .put(`/books/${bookToUpdate[3]._id}`)
      .set('Content-Type', 'application/json')
      .set('Accept', 'application/json')
      .set('Authorization', response.body.token)
      .send({
        auth: ['admin', 'editor'],
        title: '1984',
        author: 'George Orwell',
      });
    expect(bookResponse.status).toBe(200);
    expect(bookResponse.body).toBe('Successfully updated book');
  });
  it('allows authenticated user to update book through patch', async () => {
    let response = await mockRequest
      .post('/signin')
      .set('Content-Type', 'application/json')
      .set('Accept', 'application/json')
      .set('Authorization', adminBasicAuth);

    let newBook = new Books();
    let bookToUpdate = await newBook.getFromField();
    let bookResponse = await mockRequest
      .patch(`/books/${bookToUpdate[3]._id}`)
      .set('Content-Type', 'application/json')
      .set('Accept', 'application/json')
      .set('Authorization', response.body.token)
      .send({
        auth: ['admin', 'editor'],
        title: '1984',
        author: 'George Orwell',
      });
    expect(bookResponse.status).toBe(200);
    expect(bookResponse.body).toBe('Successfully updated book');
  });
  it('responds with correct message if book does not exist', async () => {
    let response = await mockRequest
      .post('/signin')
      .set('Content-Type', 'application/json')
      .set('Accept', 'application/json')
      .set('Authorization', adminBasicAuth);

    let bookResponse = await mockRequest
      .put('/books/5dd08073036bd27e1e60f31c')
      .set('Content-Type', 'application/json')
      .set('Accept', 'application/json')
      .set('Authorization', response.body.token)
      .send({
        auth: ['admin', 'editor'],
        title: '1984',
        author: 'George Orwell',
      });
    expect(bookResponse.status).toBe(404);
    expect(Object.values(bookResponse.body)[0]).toBe('Cannot find this book');
  });
  it('responds with correct message if book does not exist', async () => {
    let response = await mockRequest
      .post('/signin')
      .set('Content-Type', 'application/json')
      .set('Accept', 'application/json')
      .set('Authorization', adminBasicAuth);

    let bookResponse = await mockRequest
      .patch('/books/5dd08073036bd27e1e60f31c')
      .set('Content-Type', 'application/json')
      .set('Accept', 'application/json')
      .set('Authorization', response.body.token)
      .send({
        auth: ['admin', 'editor'],
        title: '1984',
        author: 'George Orwell',
      });
    expect(bookResponse.status).toBe(404);
    expect(Object.values(bookResponse.body)[0]).toBe('Cannot find this book');
  });
});
