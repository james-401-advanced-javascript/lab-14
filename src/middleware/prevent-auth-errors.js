'use strict';

module.exports = (req, res, next) => {
  req.authError = false;
  next();
};
