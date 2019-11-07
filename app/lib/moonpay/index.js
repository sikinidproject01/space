'use strict';

var request = require('lib/request');
var urlRoot = window.urlRoot;
var coins = {};
var emitter = require('lib/emitter');
var showSuccess = require('widgets/modals/moonpay-success');

var hasHandledMobileSuccess = false;
var apiKey = process.env.MOONPAY_API_KEY;
var customer;
var fiat;
var countries = {documents: [], allowed: []};
var ipCountry;

emitter.on('handleOpenURL', function(url) {
  url = url || '';
  var matchAction = url.match(/action=([^&]+)/);
  if (!matchAction || matchAction[1] !== 'moonpay-success') return;
  hasHandledMobileSuccess = true;
  window.localStorage.setItem('_cs_moonpay_success', 'true');
});

function init() {
  return request({url: 'https://api.moonpay.io/v3/ip_address', params: {apiKey: apiKey}}).then(function(data) {
    if (data && data.isAllowed) {
      ipCountry = data.alpha3;
      return request({
        url: urlRoot + 'moonpay/coins',
        params: {country: data.alpha3}
      });
    }
  }).then(function(data) {
    if (!data) return;
    coins = data;
  }).catch(console.error);
}

function loadFiat() {
  if (fiat) return Promise.resolve();
  return request({url: urlRoot + 'moonpay/fiat'}).then(function(data) {
    fiat = data;
  }).catch(console.error);
}

function getFiatById(id, field) {
  if (field) {
    return fiat[id] ? fiat[id][field] : '';
  }
  return fiat[id];
}

function isSupported(symbol) {
  return !!coins[symbol];
}

function isLogged() {
  return !!getAccessToken();
}

function signIn(email, securityCode) {
  if (email === '' || email.indexOf('@') === -1 || email.indexOf('.') === -1) {
    return Promise.reject(new Error('invalid_email'));
  }
  if (securityCode === '') {
    return Promise.reject(new Error('invalid_security_code'));
  }
  return request({
    url: 'https://api.moonpay.io/v3/customers/email_login',
    method: 'post',
    params: {apiKey: apiKey},
    data: {email: email, securityCode: securityCode}
  }).catch(function(err) {
    if (/Invalid body/.test(err.message)) {
      if (securityCode) throw new Error('invalid_security_code');
      throw new Error('invalid_email');
    }
    if (/Invalid security code/.test(err.message)) throw new Error('invalid_security_code');
    throw err;
  });
}

function limits() {
  return request({
    url: 'https://api.moonpay.io/v3/customers/me/limits',
    headers: getAuthorizationHeaders()
  });
}

function refreshToken() {
  return request({
    url: 'https://api.moonpay.io/v3/customers/refresh_token',
    params: {apiKey: apiKey},
    headers: getAuthorizationHeaders()
  });
}

function getAccessToken() {
  return window.localStorage.getItem('_cs_moonpay_token');
}

function getAuthorizationHeaders() {
  return {
    'Authorization': 'Bearer ' + getAccessToken()
  }
}

function setAccessToken(token) {
  window.localStorage.setItem('_cs_moonpay_token', token);
}

function cleanAccessToken() {
  window.localStorage.removeItem('_cs_moonpay_token');
}

function getCustomer() {
  return customer;
}

function setCustomer(data) {
  customer = data;
}

function cleanCustomer() {
  customer = undefined;
}

function updateCustomer(data) {
  return request({
    url: 'https://api.moonpay.io/v3/customers/me',
    method: 'patch',
    data: data,
    headers: getAuthorizationHeaders(),
  });
}

function verifyPhoneNumber(code) {
  return request({
    url: 'https://api.moonpay.io/v3/customers/verify_phone_number',
    method: 'post',
    data: {
      verificationCode: code
    },
    headers: getAuthorizationHeaders(),
  });
}

function loadCountries(type) {
  return request({
    url: urlRoot + 'moonpay/countries',
    params: {type: type}
  }).then(function(data) {
    if (!data) return;
    countries[type] = data;
  });
}

function getCountries(type) {
  return countries[type];
}

function getIpCountry() {
  return ipCountry;
}

module.exports = {
  init: init,
  loadFiat: loadFiat,
  getFiatById: getFiatById,
  isSupported: isSupported,
  isLogged: isLogged,
  signIn: signIn,
  limits: limits,
  refreshToken: refreshToken,
  setAccessToken: setAccessToken,
  cleanAccessToken: cleanAccessToken,
  getCustomer: getCustomer,
  setCustomer: setCustomer,
  cleanCustomer: cleanCustomer,
  updateCustomer: updateCustomer,
  verifyPhoneNumber: verifyPhoneNumber,
  loadCountries: loadCountries,
  getCountries: getCountries,
  getIpCountry: getIpCountry
}
