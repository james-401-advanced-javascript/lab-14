'use strict';

const mongoose = require('mongoose');

/**
 * The schema definition for a role record
 * @type {mongoose.Schema}
 */
const rolesSchema = new mongoose.Schema({
  role: { type: String, required: true },
  capabilities: { type: Array, required: true },
});

/**
 * Exporting a mongoose model generated from the above schema, statics, methods and middleware
 * @type {mongoose model}
 */
module.exports = mongoose.model('roles', rolesSchema);
