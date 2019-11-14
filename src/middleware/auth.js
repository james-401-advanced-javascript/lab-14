'use strict';

const Users = require('../models/users-model.js');
const users = new Users();
const jwt = require('jsonwebtoken');

/**
 * This takes an encoded base64 string of the format username:password and finds the matching user from that data
 * @param {string} encoded - base64 string
 * @return {object} - found user from our database
 */
const basicDecode = async encoded => {
  let base64 = Buffer.from(encoded, 'base64');
  let plainText = base64.toString();
  // sarah:sarahpassword
  // {username: sara, password: sarahpassword}

  let [username, password] = plainText.split(':');
  let user = await users.getFromField({ username });

  if (user.length) {
    let isSamePassword = await user[0].comparePassword(password);
    if (isSamePassword) return user[0];
  } else {
    let newUser = await users.create({
      username: username,
      password: password,
    });
    return newUser;
  }

  // if it's an empty array, we won't hit this
  // otherwise we want to get to the object at index 0
  if (user.length && (await user[0].comparePassword(password))) {
    return user[0];
  }
};
const bearerDecrypt = async token => {
  try {
    let tokenData = jwt.verify(token, process.env.JWT_SECRET);
    console.log('TOKEN: ', tokenData);
    if (tokenData && tokenData.data && tokenData.data.id) {
      return await users.get(tokenData.data.id);
    }
  } catch (e) {
    return null;
  }
};

module.exports = async (req, res, next) => {
  if (!req.headers.authorization) {
    return req.authError === false
      ? next()
      : next({ status: 400, msg: 'Missing request headers!' });
  }
  console.log('HEADERS: ', req.headers);
  // Split up the header auth string based on space
  // ['Basic', ]
  let authSplitString = req.headers.authorization.split(/\s+/);

  if (authSplitString.length !== 2) {
    req.authError === false
      ? next()
      : next({ status: 400, msg: 'Incorrect format of request header' });
  }

  let authType = authSplitString[0];
  let authData = authSplitString[1];

  // Check which auth type we're dealing with

  let user;

  if (authType === 'Basic') user = await basicDecode(authData);
  else if (authType === 'Bearer') user = await bearerDecrypt(authData);
  else
    return req.authError === false
      ? next()
      : next({ status: 400, msg: 'Neither Basic nor Bearer request header' });

  console.log('Returned user from decode/decrypt', user);
  console.log('AUTH: ', req.authError);
  if (user) {
    req.user = user;
    req.token = user.generateToken(req.headers.timeout);
    return next();
  } else
    return req.authError === false
      ? next()
      : next({ status: 401, msg: 'User not found from credentials' });
};
