'use strict';

var Ractive = require('cs-ractive')
var emitter = require('cs-emitter')
var showError = require('cs-modal-flash').showError
var getNetwork = require('cs-network')

var Auth = Ractive.extend({
  el: document.getElementById("auth"),
  template: require('./index.ract').template,
  partials: {
    header: require('./header.ract').template,
    actions: require('./actions.ract').template,
    content: require('./content.ract').template,
    footer: require('./footer.ract').template
  },
  init: function(){
    var self = this
    this.set('opening', false)

    emitter.on('wallet-opening', function(progress){
      self.set('progress', progress)
    })

    self.on('teardown', function(){
      emitter.removeAllListeners('wallet-opening')
    })

    function onDoneError(err) {
      if(err === 'user_deleted') {
        return location.reload(false);
      }

      emitter.emit('clear-pin')

      if(err === 'auth_failed') {
        return showError({ message: 'Your PIN is incorrect' })
      }

      console.error(err)
      return showError({ message: err.message })
    }

   function onSyncDone(err) {
      self.set('opening', false)
      if(err) {
        return onDoneError(err)
      }

      window.scrollTo( 0, 0 )
      emitter.emit('wallet-ready')
    }

    function onTxSyncDone(err, transactions) {
      if(err) {
        emitter.emit('set-transactions', [])
        return onDoneError(err)
      }
      emitter.emit('set-transactions', transactions)
    }

    this.onSyncDone = onSyncDone
    this.onTxSyncDone = onTxSyncDone
    this.getNetwork = getNetwork
  }
})

module.exports = Auth
