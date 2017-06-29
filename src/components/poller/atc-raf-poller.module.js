
module.exports = angular.module('atcPoller', [])
	.factory('$atcPoller', require('./_atc-raf-poller.factory.js'));