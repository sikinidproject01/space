'use strict';

var Ractive = require('lib/ractive');
var emitter = require('lib/emitter');
var db = require('lib/db');

module.exports = function(el) {
  var ractive = new Ractive({
    el: el,
    template: require('./index.ract'),
    data: {
      toSymbol: '',
      toAddress: '',
      amount: ''
    },
    partials: {
      footer: require('../footer.ract')
    }
  });

  ractive.on('before-show', function(context) {
    ractive.set({
      toSymbol: context.outgoingType,
      toAddress: context.withdraw,
      amount: context.outgoingCoin
    });
  });

  ractive.on('done', function() {
    db.set('exchangeInfo', null).then(function() {
      emitter.emit('change-exchange-step', 'create');
    }).catch(function(err) {
      console.error(err);
    })
  });

  return ractive;
}
