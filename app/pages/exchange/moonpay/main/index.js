'use strict';

var Ractive = require('lib/ractive');
var emitter = require('lib/emitter');
var moonpay = require('lib/moonpay');

module.exports = function(el) {
  var ractive = new Ractive({
    el: el,
    template: require('./index.ract'),
    data: {
      isLoading: true,
      isLoadingBuy: false,
      dailyLimitRemaining: 0,
      monthlyLimitRemaining: 0,
      limitIncreaseEligible: false,
      currencies: [],
      defaultCurrency: '',
      defaultCurrencyLabel: function() {
        return moonpay.getFiatById(ractive.get('defaultCurrency'), 'symbol');
      },
    },
    partials: {
      loader: require('../loader.ract'),
    }
  });

  var verificationLevels = [];
  var limit;

  ractive.on('before-show', function() {
    ractive.set('isLoading', true);
    return Promise.all([
      moonpay.limits(),
      moonpay.loadFiat()
    ]).then(function(results) {
      ractive.set('isLoading', false);
      limit = results[0].limits.find(function(item) {
        return item.type === 'buy_credit_debit_card';
      });
      var fiatSign = moonpay.getFiatById(moonpay.getCustomer().defaultCurrencyId, 'sign');
      ractive.set('dailyLimitRemaining', fiatSign + limit.dailyLimitRemaining);
      ractive.set('monthlyLimitRemaining', fiatSign + limit.monthlyLimitRemaining);
      ractive.set('limitIncreaseEligible', results[0].limitIncreaseEligible);
      ractive.set('currencies', moonpay.getFiatList());
      ractive.set('defaultCurrency', moonpay.getCustomer().defaultCurrencyId);
      verificationLevels = results[0].verificationLevels;
    }).catch(function(err) {
      ractive.set('isLoading', false);
      console.error(err);
    });
  });

  ractive.on('change-currency', function() {
    var id = ractive.get('defaultCurrency');
    ractive.set('isLoading', true);
    return moonpay.updateCustomer({defaultCurrencyId: id}).then(function() {
      moonpay.getCustomer().defaultCurrencyId = id;
      ractive.show();
    }).catch(function(err) {
      console.error(err);
      ractive.set('isLoading', false);
      ractive.set('defaultCurrency', moonpay.getCustomer().defaultCurrencyId);
    });
  });

  ractive.on('back', function() {
    emitter.emit('set-exchange', 'none');
  });

  ractive.on('verification', function() {
    emitter.emit('change-moonpay-step', 'verification', {
      verificationLevels: verificationLevels
    });
  });

  ractive.on('logout', function() {
    moonpay.cleanAccessToken();
    moonpay.cleanCustomer();
    emitter.emit('set-exchange', 'none');
  });

  ractive.on('buy', function() {

  });

  return ractive;
}
