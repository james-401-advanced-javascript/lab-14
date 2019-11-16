'use strict';

const mongoose = require('mongoose');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const roles = require('./roles-schema');

/**
 * The schema definition for a user record
 * @type {mongoose.Schema}
 */
const users = new mongoose.Schema(
  {
    username: { type: String, required: true, unique: true },
    password: { type: String, required: true },
    email: { type: String },
    role: { type: String, default: 'user', enum: ['admin', 'editor', 'user'] },
  },
  { toObject: { virtuals: true }, toJSON: { virtuals: true } }
);

users.virtual('virtual_role', {
  ref: 'roles',
  localField: 'role',
  foreignField: 'role',
  justOne: true,
});

/**
 * This function compares a plaintext password with the stored hashed password for an individual user record (`this` refers to an individual record)
 * @param {string} plainTextPassword - the password to check in string format
 * @return {boolean} true/false
 */
users.methods.comparePassword = function(plainTextPassword) {
  return bcrypt.compare(plainTextPassword, this.password);
};

users.methods.generateToken = function(timeout) {
  // default expirity, and then figure out if timeout is set, and override default
  let expiry = Math.floor(Date.now() / 1000) + 60 * 60;
  let secret = process.env.JWT_SECRET;
  if (parseInt(timeout))
    expiry = Math.floor(Date.now() / 1000) + parseInt(timeout);
  return jwt.sign(
    {
      data: {
        id: this._id,
      },
      exp: expiry,
    },
    secret
  );
};

users.methods.can = function(capability) {
  // check user (this) > virtual_role > capabilities > if the parameter capability exists in the array
  console.log('CAPABILITIES: ', this.virtual_role.capabilities);
  return this.virtual_role.capabilities.includes(capability);
};

users.pre('findOne', function() {
  this.populate('virtual_role');
});

users.pre('save', async function() {
  this.password = await bcrypt.hash(this.password, 10);
});

/**
 * Exporting a mongoose model generated from the above schema, statics, methods and middleware
 * @type {mongoose model}
 */
module.exports = mongoose.model('users', users);
