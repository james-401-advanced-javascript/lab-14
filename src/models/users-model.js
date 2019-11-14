'use strict';

const Model = require('./model.js');
const schema = require('./users-schema.js');

/**
 * A class representing the user model in our database.
 * This is in fact a wrapper for our mongoose model
 * defined in users-schema.js
 */
class Users extends Model {
  /**
   * The constructor of our model
   * @return {Users}  A newly created Users object
   */
  constructor() {
    super(schema);
  }

  /**
   * A wrapper for our mongoose model function authenticateBasic,
   * defined in users-schema.js
   * @param  {object}    credentials   An object containing the authentication credentials
   * @return {Promise<object>}         A found record of a user that matches the authentication credentials
   */
  authBasic(credentials) {
    return this.schema.authenticateBasic(credentials);
  }
}

module.exports = Users;
