"use strict"

var db = require('./db')
var userDB = db('_users')
var crypto = require('crypto')

var userPrefix = "org.couchdb.user:"

function exist(name, callback) {
  userDB.get(userPrefix + name, function (err, doc) {
    if(err && err.error === 'not_found'){
      callback(null, false)
    } else if(err) {
      console.error('error getting doc', err)
      callback({error: 'fetching_doc_failed'})
    } else {
      callback(null, true)
    }
  })
}

function register(name, pin, callback){
  exist(name, function(err, userExist){
    if(err) return callback(err)

    if(!userExist) {
      createUser(name, pin, function(err, token){
        if(err) return callback(err);
        createDatabase(name, function(err){
          if(err) return callback(err);

          callback(null, token)
        })
      })
    } else {
      login(name, pin, callback)
    }
  })
}

function login(name, pin, callback) {
  name = userPrefix + name
  userDB.get(name, function (err, doc) {
    if(err){
      console.error('error getting doc', err)
      callback({error: 'auth_failed'})
    } else {
      verifyPin(doc, name, pin, callback)
    }
  })
}

function disablePin(name, pin, callback){
  var error = {error: 'disable_pin_failed'}

  name = userPrefix + name
  userDB.get(name, function (err, user) {
    if(err){
      console.error('error getting user on disable pin', err)
      return callback(error)
    }

    verifyPin(user, name, pin, function(err, token){
      if(err) return callback(error)

      var hashAndSalt = generatePasswordHash(token)
      var credentials = {
        password_sha: hashAndSalt[0],
        salt: hashAndSalt[1]
      }

      userDB.merge(user._id, credentials, function(err, res){
        if(err) return callback(error);

        callback()
      })
    })
  })
}

function createUser(name, pin, callback){
  var token = generateToken()
  var password = token + pin
  var hashAndSalt = generatePasswordHash(password)

  userDB.save(userPrefix + name, {
    name: name,
    password_sha: hashAndSalt[0],
    salt: hashAndSalt[1],
    password_scheme: 'simple',
    type: 'user',
    roles: [],
    token: token,
    failed_attempts: 0,
    dns_record_id: '',
    username_sha: ''
  }, function(err, res){
    if(err) return callback(err);
    callback(null, token)
  })
}

function createDatabase(name, callback) {
  var csDB = db('cs' + name)
  csDB.create(function(err){
    if(err) {
      if(err.error === 'file_exists') return callback(null);
      return callback(err);
    }
    createSecurityDoc()
  })

  function createSecurityDoc() {
    csDB.save('_security', {
      couchdb_auth_only: true,
      admins: { names: [process.env.DB_USER], roles: [] },
      members: { names: [name], roles: [] }
    }, function(err, res){
      if(err) return callback(err);

      callback(null)
    })
  }
}

function setUsername(name, username, callback) {
  var error = {error: 'set_username_failed'}
  name = userPrefix + name
  userDB.get(name, function (err, user) {
    if(err){
      console.error('error getting doc', err)
      callback(error)
    } else {
      validateUsername(username, function(err, username) {
        if(err) return callback(err);

        var username_sha = generateUsernameHash(username)
        userDB.merge(user._id, {username_sha: username_sha}, function(err, res) {
          if(err) {
            console.error('FATAL: failed to update username_sha')
            return callback(error)
          }
          callback(null, username)
        })
      })
    }
  })
}

function validateUsername(username, callback) {
  username = username.toLowerCase().replace(/[^a-z0-9-]/g, '')
  if (!username) return callback({'error': 'Username is invalid'})

  userDB.view('users/username_sha', { key: generateUsernameHash(username)}, function (err, res) {
    if(err) return callback({error: 'users view error'});

    if(res.length == 0) {
      callback(null, username);
    } else {
      callback({error: 'username_exists'});
    }
  });
}

function generateToken(){
  return crypto.randomBytes(64).toString('hex')
}

function generatePasswordHash(password){
  var salt = crypto.randomBytes(16).toString('hex')
  var hash = crypto.createHash('sha1')
  hash.update(password + salt)
  return [hash.digest('hex'), salt]
}

function generateUsernameHash(username) {
  var hash = crypto.createHash('sha1')
  hash.update(username + process.env.USERNAME_SALT)
  return hash.digest('hex')
}

function verifyPin(user, name, pin, callback) {
  pin = pin || ''
  var password = user.token + pin
  var hash = crypto.createHash('sha1')
  var sha = hash.update(password + user.salt).digest('hex')
  if(sha === user.password_sha) {
    if(user.failed_attempts) updateFailCount(user._id, 0)

    callback(null, user.token)
  } else {
    var counter = user.failed_attempts + 1
    if(counter >= 5) return deleteUser(user, callback);

    updateFailCount(user._id, counter)
    callback({error: 'auth_failed'})
  }
}

// ignores db op outcome
function updateFailCount(id, counter) {
  userDB.merge(id, { failed_attempts: counter }, function(err, res){
    if(err) {
      console.error('FATAL: failed to update counter to', counter)
    }
  })
}

function deleteUser(user, callback) {
  userDB.remove(user._id, user._rev, function(err, res){
    if(err) {
      console.error('FATAL: failed to delete user')
      return callback({error: 'auth_failed'})
    }

    callback({error: 'user_deleted'})
  })
}

module.exports = {
  register: register,
  login: login,
  exist: exist,
  disablePin: disablePin,
  setUsername: setUsername
}
