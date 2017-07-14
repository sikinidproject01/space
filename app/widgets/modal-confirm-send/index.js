'use strict';

var Ractive = require('cs-modal')
var emitter = require('cs-emitter')
var getWallet = require('cs-wallet-js').getWallet
var parseHistoryTx = require('cs-wallet-js').parseHistoryTx
var btcToSatoshi = require('cs-convert').btcToSatoshi
var satoshiToBtc = require('cs-convert').satoshiToBtc
var openSupportModal = require('cs-modal-support')
var bitcoin = require('bitcoinjs-lib')
var showInfo = require('cs-modal-flash').showInfo
var getNetwork = require('cs-network')

function open(data){

  data.confirmation = true
  data.isBitcoin = getNetwork() === 'bitcoin'

  var wallet = getWallet()
  var feeRates = null
  var fees = null

  if (data.isBitcoin) {
    var defaultFeePerKb = bitcoin.networks['bitcoin'].feePerKb

    feeRates = [
      defaultFeePerKb,
      data.dynamicFees.hourFeePerKb ? data.dynamicFees.hourFeePerKb : defaultFeePerKb,
      data.dynamicFees.fastestFeePerKb ? data.dynamicFees.fastestFeePerKb : defaultFeePerKb
    ];
    fees = wallet.estimateFees(data.to, btcToSatoshi(data.amount), feeRates)

    data.feeMinimum = satoshiToBtc(fees[0])
    data.feeHour = satoshiToBtc(fees[1])
    data.feeFastest = satoshiToBtc(fees[2])
    data.fee = data.feeHour
  } else {
    feeRates = [bitcoin.networks[getNetwork()].feePerKb]
    fees = wallet.estimateFees(data.to, btcToSatoshi(data.amount), feeRates)

    data.fee = satoshiToBtc(fees[0])
  }

  var ractive = new Ractive({
    partials: {
      content: require('./_content.ract').template
    },
    data: data
  })

  emitter.emit('send-confirm-open')

  ractive.on('clear', function() {
    ractive.fire('cancel')
    emitter.emit('clear-send-form')
  })

  ractive.on('send', function(){
    ractive.set('sending', true)
    var to = ractive.get('to')
    var fee = btcToSatoshi(ractive.get('fee'))
    var value = btcToSatoshi(ractive.get('amount'))
    var wallet = getWallet()
    var tx = null

    if(feeIsTooBig(wallet.getBalance(), value, fee)) {
      ractive.set('sending', false)
      return showInfo({message: 'Please choose lower fee.'})
    }

    try {
      tx = wallet.createTx(to, value, fee)
    } catch(err) {
      return handleTransactionError()
    }

    wallet.sendTx(tx, function (err, historyTx){
      if(err) return handleTransactionError(err);

      ractive.set('confirmation', false)
      ractive.set('success', true)

      // update balance & tx history
      emitter.emit('wallet-ready')
      emitter.emit('append-transactions', [parseHistoryTx(historyTx)])
    })
  })

  ractive.on('open-support', function(){
    ractive.fire('cancel')
    var message = ractive.data.translate("Please describe what happened above. Below are network error logs that could help us identify your issue.")
    openSupportModal({description: "\n----\n" + message + "\n\n" + ractive.get('error')})
  })


  function handleTransactionError(err) {
    ractive.set('confirmation', false)
    ractive.set('error', err.message)
  }

  function feeIsTooBig(balance, amount, fee){
    return balance - fee < amount && amount <= balance
  }

  return ractive
}

module.exports = open
