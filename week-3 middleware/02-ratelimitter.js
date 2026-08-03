const request = require('supertest');
const assert = require('assert');
const express = require('express');
const app = express();
// You have been given an express server which has a few endpoints.
// Your task is to create a global middleware (app.use) which will
// rate limit the requests from a user to only 5 request per second
// If a user sends more than 5 requests in a single second, the server
// should block them with a 404.
// User will be sending in their user id in the header as 'user-id'
// You have been given a numberOfRequestsForUser object to start off with which
// clears every one second

let numberOfRequestsForUser = {};
setInterval(() => {
    numberOfRequestsForUser = {};
}, 1000)

app.use(function(req, res, next) {
  const userId = req.headers["user-id"];

  // 1. If the user header isn't present, safely proceed out of the block
  if (!userId) {
    return next();
  }

  // 2. Initialize the user profile at 0 if they don't exist yet
  if (!numberOfRequestsForUser[userId]) {
    numberOfRequestsForUser[userId] = 0;
  }

  // 3. Increment tracking for the incoming network request
  numberOfRequestsForUser[userId]++;

  // 4. Block them if they make MORE than 5 requests (the 6th request triggers this)
  if (numberOfRequestsForUser[userId] > 5) {
    return res.status(404).send("too many requests.");
  }

  // 5. Allow standard request routing pipeline execution
  next();
});



app.get('/user', function(req, res) {
  res.status(200).json({ name: 'john' });
});

app.post('/user', function(req, res) {
  res.status(200).json({ msg: 'created dummy user' });
});

module.exports = app;