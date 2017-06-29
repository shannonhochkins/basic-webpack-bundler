module.exports = {
	controller,
	require : {
		'$atc': '^atc-container',
	},
	bindings : {
		state : '<'
	},
	template : require('./_atc-player-captions.template.html')
}


controller.$inject = ['$element'];


function controller($element) {
	var $ctrl =  this;

	const styles = require('./_player-captions.scss');

	this.lastCaption = '';
	this.$doCheck = $doCheck;
	this.$onInit = $onInit;
	this.getElement = () => angular.element($element[0].querySelector('.player-captions'));
	this.$onDestroy = $onDestroy;

	/**
     * @function
     * @name $doCheck
     * @description Whenever the digest is updating, this is called
     */

	function $doCheck() {
		if (!$ctrl.$atc) return;
		$element.toggleClass('hidden', $ctrl.state == 'ended' || $ctrl.state === null);
	}

	/**
     * @function
     * @name $onInit
     * @description When this controller is ready, this will only be called once.
     * Here you should start you initializing.
     */

	function $onInit() {
		this.$atc.captionPoller = function() {
			$ctrl.currentCaption = checkCaptions();
			if ($ctrl.currentCaption == $ctrl.lastCaption) return;
			$ctrl.lastCaption = $ctrl.currentCaption;
			$ctrl.getElement().html('<span>' + $ctrl.currentCaption + '</span>');
		}
	}


	/**
     * @function
     * @name $onDestroy
     * @description Will this element is destroyed, we need to upate some data.
     */


	function $onDestroy() {
		this.getElement().empty();
		this.$atc.captionPoller = null;
	}

	/**
     * @function
     * @name getCaptions
     * @description Retreives captions array or empty array.
     */

    function getCaptions() {
        let captions = [];
        try {
            captions = $ctrl.$atc.state.current.data.captions;
        } catch(e) {
            // no captions
        }
        return captions;
    }

	/**
     * @function
     * @name checkCaptions
     * @description Will get all the captions for the current state, 
     * it will then check against the time properties on the caption, vs what's 
     * currently playing in the video and display the captions over the top of the video.
     */

	function checkCaptions() {
        let currentCaption = '';
        let captions = getCaptions();
        angular.forEach(captions, (caption, index) => {
            if (!angular.isNumber(caption.start)) throw new Error('caption start needs to be a integer in seconds.');
            if (caption.start < 0) caption.start = 0;
            if (!caption.start) throw new error('caption needs a start time provided in seconds.');
            if (caption.start > $ctrl.$atc.player.getDuration()) throw new Error('start time is greater than duration of video', caption);
            if ($ctrl.$atc.player.getCurrentTime() > caption.start + caption.duration){
                // console.log('out of range, removeing', caption)
                captions.splice(index, 1);
            }
            if ($ctrl.$atc.player.getCurrentTime() >= caption.start && $ctrl.$atc.player.getCurrentTime() < (caption.start + caption.duration)) {
                currentCaption = caption.text;
                // console.log('showing', caption.text)
            }
        });
        return currentCaption;
    }
}