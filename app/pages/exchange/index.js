'use strict';

var Ractive = require('lib/ractive');
var emitter = require('lib/emitter');
var initShapeshift = require('./shapeshift');
var initChangelly = require('./changelly');

module.exports = function(el) {
  var ractive = new Ractive({
    el: el,
    template: require('./index.ract')
  });

  var exchanges = {
    changelly: initChangelly(ractive.find('#exchange_changelly')),
    shapeshift: initShapeshift(ractive.find('#exchange_shapeshift')),
    none: new Ractive({
      el: ractive.find('#exchange_none'),
      template: require('./choose.ract'),
      data: {
        choose: choose
      }
    })
  }
  var currentExchange = exchanges.none;

  ractive.on('before-show', function() {
    var preferredExchange = window.localStorage.getItem('_cs_preferred_exchange');
    if (exchanges[preferredExchange]) {
      showExchange(exchanges[preferredExchange]);
    } else {
      showExchange(exchanges.none);
    }
  });

  ractive.on('before-hide', function() {
    currentExchange.hide();
  });

  function choose(exchangeName) {
    window.localStorage.setItem('_cs_preferred_exchange', exchangeName);
    showExchange(exchanges[exchangeName]);
  }

  emitter.on('set-exchange', function(exchangeName) {
    choose(exchangeName);
  })

  function showExchange(exchange) {
    setTimeout(function() {
      currentExchange.hide();
      exchange.show();
      currentExchange = exchange;
    })
  }

  return ractive;
}
