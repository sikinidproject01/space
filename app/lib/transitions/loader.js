'use strict';

var fadeOut = require('./fade.js').fadeOut

module.exports =  {
  out: function(container) {
    fadeOut(container, function() {
      window.initCSApp()
    })
  }
}
