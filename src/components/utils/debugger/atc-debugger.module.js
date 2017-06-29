
const disabled = false;
if (DEVELOPMENT && !disabled) {
	module.exports = angular.module('atcDebugger', [])
		.directive('atcDebugger', require('./_atc-debugger.directive'));
}
