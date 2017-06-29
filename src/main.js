'use strict';


// hard coded dependencies.
var mainStyles = require('./main.scss');
var generator = require('../state-generator/state-generator');
var moduleDependencies = ['ngAnimate', 'ui.router'];


// require all .module.js files
var req = require.context('./', true, /\.*module.js$/);
req.keys().forEach(function(key) {
    var module = req(key);
    if (module && module.name) moduleDependencies.push(module.name);
});

// need to define our module first.
var module = angular.module('atc', moduleDependencies);
// all auto-generated data from node.
let outputData = generator(module, {
  	urlAsNumber : true,
  	allowUrlOverride : false,
	allowRootOverride : false,
  	rootComponent : 'atcContainer',  
  	inheritedName : '$atc'
});


module.run([function() {
    
}])
.config(['$animateProvider', function($animateProvider) {
    $animateProvider.classNameFilter(/animate-/);
}]);