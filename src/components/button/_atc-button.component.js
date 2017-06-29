
  	
  module.exports = {
  	bindings : {
  		href : '=?'
  	},
  	transclude: true,
  	template : `
		<a ng-href="{{$ctrl.href}}" class="button-outline" ng-mouseenter="">
			<span class="button-outline-copy small-padding">
				<span class="">
					<span class="button-text-wrapper" ng-transclude>
						
					</span>
				</span>
			</span>
			<span class="button-outline-bottom"></span>
		</a>
  	`,
  	controller : controller
  };


controller.$inject  = ['$element'];
function controller($element) {
  	const styles = require('./_atc-button.scss');
  	$element.addClass(styles['atc-button']);
}