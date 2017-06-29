
module.exports = {
    bindings: {
        from: '=?',
        to: '=?',
        whenFinished: '&?'
    },
    controller: controller
};



controller.$inject = ['$scope', '$atcPoller', '$attrs', '$element'];

function controller($scope, $atcPoller, $attrs, $element) {
    let $ctrl = this;


    this.$onInit = function() {
        this.deregister = $atcPoller.register(onPoll);
        console.log("to "+this.to);
        console.log("from "+this.from);
        this.counter = this.from || this.to;
        this.direction = (this.from)? 'countdown':'countup';
        // if (this.$atc.debug) this.counter = 1;
        this.state = !$attrs.whenFinished ? false : $attrs.whenFinished.replace(/^.*\(['|"](.[a-zA-Z-]+).+$/g, '$1');
        this.whenFinished = this.whenFinished || angular.noop;
    };

    /**
     * @function
     * @name onPoll
     * @description - Called by the atcPoller, every second this will receive the current iteration value.
     * This will NOT digest the app, so make sure what ever changes you make here are digested correctly.
     * @param {[int]} [iteration] - The current iteration value, this number will always increment.
     */

    function onPoll(iteration) {
        if (!$ctrl.counter) {
            $element.html('');
            return;
        }

        switch ($ctrl.direction){
            case 'countup':
                $ctrl.counter++
                $element.html('' + $ctrl.counter);
            break;
            case 'countdown':
                $ctrl.counter--;
                $element.html('' + $ctrl.counter);
                if ($ctrl.counter <= 0) {
                    $ctrl.whenFinished();
                    $ctrl.deregister($ctrl.state);
                }
            break;
        }
    }
}