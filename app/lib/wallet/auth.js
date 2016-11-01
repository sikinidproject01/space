'use strict';

var xhr = require('cs-xhr')
var db = require('cs-db')
var querystring = require('querystring')
var uriRoot = window.location.origin
if(window.buildType === 'phonegap') {
  uriRoot = process.env.PHONEGAP_URL
}

function register(wallet_id, pin, callback) {
  postCredentials('register', { wallet_id: wallet_id, pin: pin }, callback)
}

function login(wallet_id, pin, callback) {
  postCredentials('login', { wallet_id: wallet_id, pin: pin }, callback)
}

function exist(wallet_id, callback) {
  xhr({
    uri: uriRoot + "/exist?wallet_id=" + wallet_id,
    method: 'GET'
  }, function(err, resp, body){
    if(resp.statusCode !== 200) {
      console.error(body)
      return callback(JSON.parse(body))
    }
    callback(null, body === 'true')
  })
}

function disablePin(wallet_id, pin, callback) {
  xhr({
    uri: uriRoot + "/pin",
    headers: { "Content-Type": "application/json" },
    method: 'DELETE',
    body: JSON.stringify({id: wallet_id, pin: pin})
  }, function(err, resp, body){
    if(resp.statusCode !== 200) {
      console.error(body)
      return callback(JSON.parse(body))
    }
    callback()
  })
}

function setUsername(firstName, callback) {
  db.get(function(err, doc){
    if(err) return callback(err);

    var oldUsername = (doc.userInfo.firstName || '').toLowerCase().replace(/[^a-z0-9-]/g, '')
    var username = (firstName || '').toLowerCase().replace(/[^a-z0-9-]/g, '')

    if(username == oldUsername) return callback(null, doc.userInfo.firstName);

    xhr({
      uri: uriRoot + "/username",
      headers: { "Content-Type": "application/json" },
      method: 'POST',
      body: JSON.stringify({id: db.userID(), username: username})
    }, function(err, resp, body){
      if(resp.statusCode !== 200) {
        return callback(JSON.parse(body))
      }
      var data = JSON.parse(body)
      callback(null, data.username)
    })
  })
}

function postCredentials(endpoint, data, callback) {
  xhr({
    uri: uriRoot + "/" +  endpoint,
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    method: 'POST',
    body: querystring.stringify(data)
  }, function(err, resp, body){
    if(resp.statusCode !== 200) {
      console.error(body)
      return callback(JSON.parse(body))
    }
    callback(null, body)
  })
}

module.exports = {
  register: register,
  login: login,
  exist: exist,
  disablePin: disablePin,
  setUsername: setUsername
}
