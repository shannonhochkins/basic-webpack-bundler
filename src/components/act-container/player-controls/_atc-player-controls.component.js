module.exports = {
	controller,
	require : {
		'$atc': '^atc-container',
	},
	bindings : {
		state : '<'
	},
	template : require('./_atc-player-controls.template.html')
}
controller.$inject = ['$element', '$interval'];


function controller($element, $interval) {
	var $ctrl =  this;
	const styles = require('./_player-controls.scss');
	
	this.$onInit = function() {
		this.$atc.controllerPoller = function() {
			// called roughly every second.
		};
	};

	this.updateProgress = function() {
		this.resetting = false;
		return $interval(() => {
			if ($ctrl.resetting) return;
			let currentTime = $ctrl.$atc.player.getCurrentTime();
			// add a 0.5 margin to the timer, because of paint delays.
			currentTime = currentTime + 0.5;
			$ctrl.getElement().html($ctrl.$atc.methods.video.convertTime(currentTime) + ' - ' + $ctrl.$atc.duration);
			let bar = $ctrl.getProgressBar();
			let progress = currentTime / $ctrl.$atc.durationSeconds * 100;
			if (progress > 100) progress = 100;
			if ($ctrl.state == 'ended') progress = 100;
			bar.css('width', progress + '%');
		}, 0, 0, false);
	};


	// requests the progress bar
	this.getProgressBar = () => angular.element($element[0].querySelector('.progress-bar'));
	// requests the current time element
	this.getElement = () => angular.element($element[0].querySelector('.player-time--current'));

	this.reset = function() {
		if (this.interval) {
			this.resetting = true;
			$interval.cancel(this.interval);			
		}
		this.getElement().html('loading...');
		let bar = this.getProgressBar();
		bar.css('width', '0%');
		this.$atc.controllerPoller = null;
	};


	this.$onDestroy = function() {
		this.reset();
	};

	this.$onChanges = function(changes) {
		if (changes.state && changes.state.currentValue === 'ended') this.reset();
		if (changes.state && changes.state.currentValue == 'playing') this.interval = this.updateProgress();
	};
}