'use strict';

let token = '';

/**
 * This function shows show simple it can be to encode something using base64 encoding. Note, this is client-side javascript, and so we don't have access to the Buffer class. So, we use a built-in function that does base64 encoding, btoa
 * @param  {string} username  The username to encode
 * @param  {string} password  The plain-text password to encode
 * @return {string}           A base 64 encoded string of the format 'Basic username:password'
 */
const encode = (username, password) => {
  let encoded = btoa(username + ':' + password);
  return 'Basic ' + encoded;
};

/**
 * This function captures user input from the form, encodes the username and password, and then sends a request to our server, asking our server to authenticate the user and return us a token
 * @param  {object} e  This is the event object that is returned from the form HTML element. We need this so that we can prevent the form from causing a page refresh and so that we can grab the form inputs
 */
const basicAuth = async e => {
  e.preventDefault();

  $('#book-view').slideUp();
  $('#model-view').slideUp();

  // Grab form inputs
  let username = e.target[0].value;
  let password = e.target[1].value;
  let timeout = e.target[2].value;

  // Error message if not the correct input
  if (!username || !password)
    sendMessage('Please enter in a username and password', 'red');
  else {
    // Encode username and password
    let bAuthData = encode(username, password);
    sendMessage(`Converted data to encoded:\n${bAuthData}`, 'green');

    // POST to /signin route - I want to verify this user
    // and receive a JSON Web Token
    let authResponse = await fetch('/signin', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Accept: 'application/json',
        Authorization: bAuthData,
        Timeout: timeout,
      },
    });

    let authData = await authResponse.json();

    // If we got a successful response, we should have a token
    if (authResponse.status === 200) {
      sendMessage(
        `Successfully logged in and recieved token:\n${authData.token}`,
        'green',
      );

      token = authData.token;
    } else
      sendMessage(
        `Received response:\n${authResponse.status} ${authData.error}`,
        'red',
      );
  }
};

const createBook = async e => {
  e.preventDefault();

  let auth = [];

  if (e.target[3].checked) auth.push('admin');
  if (e.target[4].checked) auth.push('editor');
  if (e.target[5].checked) auth.push('user');

  let book = {
    title: e.target[1].value,
    author: e.target[2].value,
    auth: auth,
  };

  let response = await fetch('/books', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Accept: 'application/json',
      Authorization: token,
    },
    body: JSON.stringify(book),
  });

  let data = await response.json();

  if (response.status === 200)
    sendMessage('Successfully created book', 'green');
  else
    sendMessage(`Received response:\n${response.status} ${data.error}`, 'red');
};

const editBook = async () => {
  let id = $('#book-id')
    .val()
    .trim();
  let book = {};
  let auth = [];

  if (!id) {
    sendMessage('Missing id', 'red');
    return;
  }

  if ($('#admin-chk').prop('checked')) auth.push('admin');
  if ($('#editor-chk').prop('checked')) auth.push('editor');
  if ($('#user-chk').prop('checked')) auth.push('user');

  if (
    $('#title').val() &&
    $('#title')
      .val()
      .trim()
  )
    book.title = $('#title').val();
  if (
    $('#author').val() &&
    $('#author')
      .val()
      .trim()
  )
    book.author = $('#author').val();

  if (auth.length) book.auth = auth;
  else {
    sendMessage('Missing auth specification', 'red');
    return;
  }

  let response = await fetch('/books/' + id, {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
      Accept: 'application/json',
      Authorization: token,
    },
    body: JSON.stringify(book),
  });

  let data = await response.json();

  if (response.status === 200)
    sendMessage('Successfully updated book', 'green');
  else
    sendMessage(`Received response:\n${response.status} ${data.error}`, 'red');
};

const modelViewer = async e => {
  e.preventDefault();

  let model = e.target[0].value;
  let id = e.target[1].value;

  let path = '/model/' + model;
  if (id) path += '/' + id;

  let response = await fetch(path, {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
      Accept: 'application/json',
      Authorization: token,
    },
  });

  let data = await response.json();

  if (response.status === 200) {
    sendMessage('Successfully recieved model data', 'green');
    $('#model-view')
      .html(JSON.stringify(data, undefined, 2))
      .slideDown();
  } else {
    sendMessage(`Received response:\n${response.status} ${data.error}`, 'red');
    $('#model-view').slideUp();
  }
};

const bookViewer = async () => {
  let response = await fetch('/books', {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
      Accept: 'application/json',
      Authorization: token,
    },
  });

  let data = await response.json();

  if (response.status === 200) {
    sendMessage('Successfully recieved books', 'green');
    $('#book-view')
      .html(JSON.stringify(data, undefined, 2))
      .slideDown();
  } else {
    sendMessage(`Received response:\n${response.status} ${data.error}`, 'red');
    $('#book-view').slideUp();
  }
};

/**
 * This function is just a client bootstrap-oriented function which generates popup messages that fade away after a short period of time
 * @param {string} message   The message to print in the popup
 * @param {string} color     Either 'red' or 'green' color for the popup
 */
const sendMessage = (message, className) => {
  let toastId = 'toast-' + Date.now();
  let toast = '<div class="toast ';

  toast += className + '" ';

  toast += 'id="' + toastId + '"';
  toast +=
    ' role="alert" aria-live="assertive" aria-atomic="true"><div class="toast-header"><h4 class="mr-auto">';

  toast += 'Message';

  toast += '</h4><p>';

  let date = new Date();
  toast += date.toLocaleString();

  toast +=
    '</p><button type="button" class="ml-2 mb-1 close" data-dismiss="toast" aria-label="Close"><span aria-hidden="true">&times;</span></button></div><p class="lead toast-body">';

  toast += message;

  toast += '</p></div>';

  $('#bAuth-message').append(toast);
  $('#' + toastId).toast({
    delay: 7000,
  });

  $('#' + toastId).toast('show');
};
