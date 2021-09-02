'use strict';

var sass      = require('node-sass');
var glob      = require('glob');
var _         = require('lodash');
var fs        = require('fs');
var Promise   = require('promise');
var Delegate  = require('delegate-create');

function SassBuilder(options){
  this._options = options;
}

SassBuilder.prototype._sassVariables = function(variablesObj) {
  return Object.keys(variablesObj).map(function (name) {
    return "$" + name + ": " + variablesObj[name] + ";";
  }).join('\n');
};

SassBuilder.prototype._sassImport = function(path) {
  return "@import '" + path + "';";
};

SassBuilder.prototype._createDynamicSass = function(scssEntry, variables, handleSuccess, handleError) {
  /*
   Dynamically create "SASS variable declarations"
   then import the "actual entry.scss file".
   dataString is just "SASS" to be evaluated before
   the actual entry.scss is imported.
   */
  var dataString = this._sassVariables(variables) + this._sassImport(scssEntry);
  var sassOptions = _.assign({}, this._options, {
    data: dataString
  });

  sass.render(sassOptions, function (err, result) {
    return (err)
      ? handleError(err)
      : handleSuccess(result.css.toString());
  });
};

SassBuilder.prototype.renderStyles = function(sourcePaths, destinationFile, variables){
  glob(sourcePaths, Delegate.create(this, function(err, files){
    console.log(files);
    for(var i=0; i<files.length; i++){
      this._createDynamicSass(files[i], variables,
        function(result){
          fs.appendFile(destinationFile, result, function(err){});
        },
        function(error){
          console.log('error', error)
        }
      )
    }
  }));
};

module.exports = SassBuilder;
