'use strict';

const mongoose = require('mongoose');

/**
 * The schema definition for a book record
 * @type {mongoose.Schema}
 */
const booksSchema = new mongoose.Schema({
  title: { type: String, required: true },
  author: { type: String },
  auth: { type: Array, required: true },
});

/**
 * Exporting a mongoose model generated from the above schema, statics, methods and middleware
 * @type {mongoose model}
 */
module.exports = mongoose.model('books', booksSchema);
