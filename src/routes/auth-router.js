'use strict';

const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');

router.post('/signup', (req, res, next) => {});
router.post('/signin', auth, (req, res, next) => {
  res.status(200).json({ token: 'Bearer ' + req.token });
});

module.exports = router;
