module.exports = controller;

function controller() {
	var $ctrl = this;
	$ctrl.title = 'Welcome to Air Traffic Control Training!';
	this.$onInit = function() {
		this.data = this.$atc.state.current.data;
		this.next = $ctrl.$atc.methods.find('rule-the-skies').data;
	}
	
}