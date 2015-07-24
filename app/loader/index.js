'use strict';

require('browsernizr/lib/load')
require('browsernizr/test/storage/localstorage')
require('browsernizr/test/storage/websqldatabase')
require('browsernizr/test/indexedDB')
require('browsernizr/test/workers/webworkers')
require('browsernizr/test/blob')
require('browsernizr/test/crypto/getrandomvalues')
require('browsernizr/test/svg/smil')

var token = require('cs-network')()
var animateLogo = require('cs-transitions/loader.js').animateLogo
var fadeOut = require('cs-transitions/loader.js').out
var Modernizr = require('browsernizr')
var languages = require('cs-i18n').languages

document.getElementsByTagName('html')[0].classList.add(token)

var elems =  {
  body: document.getElementById('logo_svg_body'),
  border: document.getElementById('logo_svg_border'),
  coin: document.getElementById('logo_svg_coin'),
  space: document.getElementById('logo_svg_space'),
  dot: document.getElementById('logo_svg_dot')
}

var containerEl = document.getElementById('loader')
var goodToGo;

var delay = animateLogo(elems, document.getElementsByTagName('html')[0].classList.contains('no-smil'))
Modernizr.on('indexeddb', function(hasIndexedDB){
  var supportsPouchDB = hasIndexedDB || Modernizr.websqldatabase
  var language = findTranslation()

  Modernizr.load({
    test: supportsPouchDB && (Modernizr.localstorage && Modernizr.webworkers && Modernizr.blobconstructor && Modernizr.getrandomvalues),
    yep: 'assets/js/application-' + language + '.js',
    nope: 'assets/js/nope-' + language + '.js',
    callback: function(testResult, key) {
      goodToGo = key
    },
    complete: function() {
      if(goodToGo) {
        setTimeout(function(){
          fadeOut(containerEl)
        }, delay)
      }
    }
  })
})

function findTranslation(){
  var language = navigator.language.toLocaleLowerCase() || 'en'
  return languages.filter(function(l){
    return language === l || language.substr(0, 2) === l
  })[0] || 'en'
}

//monkey patch URL for safari 6
window.URL = window.URL || window.webkitURL
//fix for ie
if (!window.location.origin) {
  window.location.origin = window.location.protocol + "//" + window.location.hostname + (window.location.port ? ':' + window.location.port: '')
}
window.isIE = !!document.documentMode
