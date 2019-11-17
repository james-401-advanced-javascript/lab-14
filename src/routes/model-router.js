'use strict';

const express = require('express');
const router = express.Router();
const modelFinder = require('../middleware/model-finder.js');
const preventAuthErrors = require('../middleware/prevent-auth-errors');
const auth = require('../middleware/auth');

router.param('model', modelFinder.load);

router.get('/model/:model', preventAuthErrors, auth, async (req, res, next) => {
  if (!req.model) next({ status: 404, msg: 'Cannot find requested model' });

  let records = await req.model.getFromField({});
  let recordCount = records.length;

  let data = {
    model: req.params.model,
    count: recordCount,
  };

  if (req.user && req.user.role === 'admin') data.records = records;

  res.status(200).json(data);
});

router.get('/model/:model/:id', auth, async (req, res, next) => {
  if (req.user.role === 'admin') {
    let record = await req.model.get(req.params.id);

    if (record && record._id) res.status(200).json(record);
    else next({ status: 400, msg: 'Unable to find record' });
  } else next({ status: 403, msg: 'Forbidden to access this route' });
});

module.exports = router;
