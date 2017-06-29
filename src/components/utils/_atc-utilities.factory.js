module.exports = factory;
factory.$inject = ['$timeout', '$rootScope'];

function factory($timeout, $rootScope) {
    let $actUtil = {
        nextTick,
        debounce,
        detectIE
    };

    return $actUtil;



    /* Alternative to $timeout calls with 0 delay.
     * nextTick() coalesces all calls within a single frame
     * to minimize $digest thrashing
     *
     * @param callback
     * @param digest
     * @returns {*}
     */

    function nextTick(callback, digest, scope) {
        //-- grab function reference for storing state details
        var nextTick = $actUtil.nextTick;
        var timeout = nextTick.timeout;
        var queue = nextTick.queue || [];

        //-- add callback to the queue
        queue.push({
            scope: scope,
            callback: callback
        });

        //-- set default value for digest
        if (digest == null) digest = true;

        //-- store updated digest/queue values
        nextTick.digest = nextTick.digest || digest;
        nextTick.queue = queue;

        //-- either return existing timeout or create a new one
        return timeout || (nextTick.timeout = $timeout(processQueue, 0, false));

        /**
         * Grab a copy of the current queue
         * Clear the queue for future use
         * Process the existing queue
         * Trigger digest if necessary
         */
        function processQueue() {
            var queue = nextTick.queue;
            var digest = nextTick.digest;

            nextTick.queue = [];
            nextTick.timeout = null;
            nextTick.digest = false;

            queue.forEach(function(queueItem) {
                var skip = queueItem.scope && queueItem.scope.$$destroyed;
                if (!skip) {
                    queueItem.callback();
                }
            });

            if (digest) $rootScope.$digest();
        }
    }



    // Utility methods

    function debounce(func, wait) {
        var timeout;
        return function() {
            var context = this,
                args = arguments;
            var later = function() {
                timeout = null;
                func.apply(context, args);
            };
            clearTimeout(timeout);
            timeout = setTimeout(later, wait);
        };
    }

    /**
     * detect IE
     * returns version of IE or false, if browser is not Internet Explorer
     */
    function detectIE() {
        var ua = window.navigator.userAgent,
            msie = ua.indexOf('MSIE '),
            trident = ua.indexOf('Trident/'),
            edge = ua.indexOf('Edge/');

        if (msie > 0) {
            // IE 10 or older => return version number
            return parseInt(ua.substring(msie + 5, ua.indexOf('.', msie)), 10);
        }

        if (trident > 0) {
            // IE 11 => return version number
            var rv = ua.indexOf('rv:');
            return parseInt(ua.substring(rv + 3, ua.indexOf('.', rv)), 10);
        }

        if (edge > 0) {
            // IE 12 => return version number
            return parseInt(ua.substring(edge + 5, ua.indexOf('.', edge)), 10);
        }

        // other browser
        return false;
    }
}