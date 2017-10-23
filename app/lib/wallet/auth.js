'use strict';

var request = require('lib/request')
var db = require('lib/db')
var urlRoot = process.env.SITE_URL

function register(wallet_id, pin, callback) {
  postCredentials('register', { wallet_id: wallet_id, pin: pin }, callback)
}

function login(wallet_id, pin, callback) {
  postCredentials('login', { wallet_id: wallet_id, pin: pin }, callback)
}

function exist(wallet_id, callback) {
  request({
    url: urlRoot + '/exist?wallet_id=' + wallet_id
  }, callback)
}

function remove(wallet_id, callback) {
  request({
    url: urlRoot + '/account',
    method: 'delete',
    data: {
      id: wallet_id
    }
  }, callback)
}

function setUsername(firstName, callback) {
  db.get(function(err, doc){
    if(err) return callback(err);

    var oldUsername = (doc.userInfo.firstName || '').toLowerCase().replace(/[^a-z0-9-]/g, '')
    var username = (firstName || '').toLowerCase().replace(/[^a-z0-9-]/g, '')

    if(username == oldUsername) return callback(null, doc.userInfo.firstName);

    request({
      url: urlRoot + '/username',
      method: 'post',
      data: {
        id: db.userID(),
        username: username
      }
    }, function(err, data) {
      if (err) return callback(err);
      return callback(null, data.username);
    })
  })
}

function postCredentials(endpoint, data, callback) {
  request({
    url: urlRoot + '/' +  endpoint,
    method: 'post',
    data: data
  }, callback)
}

module.exports = {
  register: register,
  login: login,
  exist: exist,
  remove: remove,
  setUsername: setUsername
}
