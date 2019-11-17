/**
 * Combines SuperTest and Mongoose Memory Server
 * to reduce (hopefully) the pain of
 * testing a Mongoose API
 */

const mongoose = require('mongoose');
const MongoMemoryServer = require('mongodb-memory-server').default;
const supertest = require('supertest');

let mongoServer;

let supertester = (module.exports = {});
/**
 * @server
 * @returns function that expects an express server
 */
supertester.server = server => supertest(server);

/**
 * Typically used in Jest beforeAll hook
 */
supertester.startDB = async () => {
  mongoServer = new MongoMemoryServer();

  const mongoUri = await mongoServer.getConnectionString();

  const mongooseOptions = {
    useNewUrlParser: true,
    useCreateIndex: true,
  };

  await mongoose.connect(mongoUri, mongooseOptions, err => {
    if (err) console.error(err);
  });
};

/**
 * Typically used in Jest afterAll hook
 */
supertester.stopDB = () => {
  mongoose.disconnect();
  mongoServer.stop();
};

// Just so that it can live in the tests folder
describe('supertester', () => {
  it('is super', () => {
    expect(true).toBeTruthy();
  });
});
