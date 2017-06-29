module.exports = factory;


/**
 * @Factory
 * @name $atcPoller
 * @description - Used to trigger callbacks every second, seeing as this whole
 * application is built around time, it needs to do this accurately, this uses request animation frame api
 * and will allow you to register callbacks into the state.
 */


factory.$inject = ['$atcUtil'];
function factory($atcUtil) {

    let callbacks = [],
    	i = 0,
    	currentSecond = new Date().getSeconds(),
	    keepgoing = true,
	    start = () => (loop(true), methods), 
	    stop = () => (loop(false), methods),
	    register = fn => (callbacks.push({fn,i}),start(), i++, deregister(i) ),
	    runCallbacks = () => angular.forEach(callbacks, obj => obj.fn(currentSecond));
	


	const methods = {
        stop,
        start,
        register
    };

    
	return methods;

   	/**
   	 * @function
   	 * @name deregister
   	 * @description - Removes the callback, this is not a public method, however it is returned by register,
   	 * so when you register, you can deregister at any time.
   	 * @example
   	 *     this.deregister = $atcPoller.register();
   	 * 
   	 *     // some time later
   	 *     this.deregister();
   	 */

	function deregister(b) {
		return function() {
			var index = callbacks.findIndex(obj => obj.i == (b - 1)); 
			if (index > -1) callbacks.splice(index, 1);
      return null;
		}
	}
    
   	/**
   	 * @function
   	 * @name loop
   	 * @description - Instead of using setTimeout, we use requestAnimationFrame api to 
   	 * call any regisered methods
   	 */

    function loop(updater) {
    	if (!callbacks.length) return;
    	if (updater === true) keepgoing = updater;
        if (keepgoing) {
            requestAnimFrame(loop);
            draw();
        }
    }

   	/**
   	 * @function
   	 * @name draw
   	 * @description - Called by the loop, only processes every second.
   	 */
   	
    function draw() {
        if (currentSecond !== new Date().getSeconds()) {
            runCallbacks();
            currentSecond = new Date().getSeconds();
        }
    }
}

window.requestAnimFrame = (function() {
    return window.requestAnimationFrame ||
        window.webkitRequestAnimationFrame ||
        window.mozRequestAnimationFrame ||
        window.oRequestAnimationFrame ||
        window.msRequestAnimationFrame ||
        function( /* function */ callback, /* DOMElement */ element) {
            window.setTimeout(callback, 1000 / 60);
        };
})();