module.exports = controller;

const containerStyles = require('./_atc-container.scss');
controller.$inject = ['$filter', '$location', '$transclude', '$scope', '$element', '$timeout', '$generatedData', '$startingState', '$state', '$attrs', '$transitions', '$atcUtil', '$compile', '$atcPoller'];


function controller($filter, $location, $transclude, $scope, $element, $timeout, $generatedData, $startingState, $state, $attrs, $transitions, $atcUtil, $compile, $atcPoller) {
    let $ctrl = this;

    let debug = window.location.search.indexOf('debug') > -1,
        locationSearch = true;

    
    if (DEVELOPMENT && debug) {
        let el = $compile('<atc-debugger></atc-debugger>')($scope);
        $element.parent().append(el);
    }

    // adds dynamic class to element.
    $element.addClass(containerStyles['atc-container']);
    this.testContent = 'INHERITTTINGG';
    // define our methods
    this.methods = {
        find,
        stage : {
            reset
        },
        video : {
            convertTime,
            onDestroy,
            onPlayerReady,
            onStateChange,
            onApiReady
        },
        state : {
            find,
            go
        }
    };
    this.$element = $element;
    // store reference to transitions.
    this.$transitions = $transitions;
    // mute by default
    this.mute = false;
    // turn on captions by default
    this.captions = true;
    // storing references
    this.state = {
        current : null,
        last : null
    };
    setupDefaultState();
    // store adventures lcoally.
    this.adventures = $generatedData;

    // needs to be initiated.
    this.state.current = null;
    // when a new video is requested, it starts the loading state, the loading state is re-triggered 
    // AFTER the video actually starts playing.
    toggleLoading(false);
    // when the youtube api is ready.
    this.apiReady = false;
    // when the api is ready, and all pre-animations are finished.
    this.stageReady = false;
    // setup state listeners.
    this.$transitions.onSuccess({}, onSuccess);
    this.$transitions.onStart({}, onStart);
    this.pollers = [];
    


    this.$onInit = function(changes) {
        // what view changes to by default when api is ready.
        this.state.default = this.methods.state.find($startingState);
        // if no state default is provided, throw an error.
        if (!this.state.default) {
            throw new Error(`$startingState: "${$startingState}" not found, ${$startingState} does not exist as a state as a constant $startingState file. The default state must have a video to preload.`);
        }
    };

    /**
     * @function
     * @name poller
     * @description - A very smart simple counter, that will run this method every second.
     * This isn't based on time, it's based on animation frames, it's going to work when a tab
     * is inactive and stopping states, it's not called at all when a tab is not in focus, this is 
     * completely intentional, so we're not smashing performance, and making our application update
     * when times are incorrect.
     * 
     * Receives normal arguments that the onSuccess transition event receives.
     */    



    function poller(iteration) {
        if (!$ctrl.player) return;        
        if ($ctrl.controllerPoller) $ctrl.controllerPoller(iteration);
        if ($ctrl.captionPoller) $ctrl.captionPoller(iteration);
    }

    

    /**
     * @function
     * @name convertTime
     * @description Will convert the seconds value to a youtube time video.
     */

    function convertTime(seconds) {
        return $filter('date')(Math.floor(seconds) * 1000, 'mm:ss');
    }

    /**
     * @function
     * @name onDestroy
     * @description Called by the video, when there's no video id passed.
     */

    function onDestroy() {
        // toggleLoading(false);
        setupDefaultState();
    }

    /**
     * @function
     * @name reset
     * @description Reset the state to it's original values.
     */

    function reset() {
        // toggleLoading(true);
        setupDefaultState();
    }

    /**
     * @function
     * @name setupDefaultState
     * @description Reset the state to it's original values.
     */

    function setupDefaultState() {
        
        // when the first youtube video plays, this will update to true.
        $ctrl.playerReady = false;
        // revert the player, so it's a clean state.
        $ctrl.player = null;
        // revert the player state so it think's there's been no video.
        $ctrl.playerState = null;
        // reset duration and current time
        $ctrl.currentTime = 0;
        $ctrl.duration = 0;
        // called whenever the video starts playing, will not update until video finishes.    
        // video isn't playing anymore.
        $ctrl.videoStarted = false;
    }

    /**
     * @function
     * @name onSuccess
     * @description - Called whenever a state is successfully resolved by ui-router.
     * 
     * Receives normal arguments that the onSuccess transition event receives.
     */    

    function onSuccess(transitions) {
        // console.log('onSuccess', transitions.$to().name);
        $location.search(locationSearch);
        
    }

    /**
     * @function
     * @name onStart
     * @description - Called whenever a state starts to change by ui-router.
     * When the state changes, but it was the last stateit will abort the transition
     * and take over it manually.
     * 
     * Receives normal arguments that the onStart transition event receives.
     */    

    function onStart(transitions) {
        $location.search('cscore', parseInt($location.search().cscore || 0) +1);
        locationSearch = $location.search();

        var to = transitions.$to();
        // if ($ctrl.state.last) console.log('start', $ctrl.state.last.name, to.name)
        if ($ctrl.state.last && $ctrl.state.last.name == to.name) {
         // assume the back button was pressed.
            // transitions.abort();
            // $atcUtil.nextTick(function() {
            //     go(to.name);
            // });
        }        
        $ctrl.state.last = transitions.$from() || {};
    }

    /**
     * @function
     * @name toggleLoading
     * @description - Simple updates the instance variable, and toggles the class on this component.
     * 
     * @param {[bool]} [isLoading] Toggles the controller variables.
     * @param {[bool]} [justView] if justView is provided as a truthy value, it will only toggle the class.
     * 
     */    

    function toggleLoading(isLoading, justView) {
        if (!justView) $ctrl.isLoading = isLoading || false;
        $element.toggleClass('is-loading', isLoading || false);
    }

    /**
     * @function
     * @name find
     * @description - Searches the generates staes for a state matching by REFERENCE name. 
     * The reference name, is the folder name of the state you want to go to.
     * @returns {[Object]} - the state object or null;
     */


    function find(stateRef) {
        var state = null;
        angular.forEach(angular.copy($ctrl.adventures), adventure => {
            if (adventure.state && adventure.state.ref == stateRef) state = adventure;
        });
        return state;
    }

    /**
     * @function
     * @name go
     * @description - This is basically a wrapper for $state.go, but it does additional checking
     * to make sure we have all the necessary data to actually progress, it wont change the state if
     * the requested state is the same state.
     * @param {[Object]} [stateRefOrState] - needs to be the reference name (folder name) of the state, or the original state object.
     * Using the original state object, won't request that we lookup states every time, it will then just make sure 
     * the nescessary options are updated on this instance.
     */

    function go(stateRefOrState, i) {
        console.log('stateRefOrState', i)
        if (angular.isObject(stateRefOrState) && stateRefOrState.state) stateRefOrState = stateRefOrState.state.ref
        let state = find(stateRefOrState);
        console.log(state);
        // console.log('requesting', state);
        if (state === null) throw new Error(`Could not find state ${stateRefOrState}, please check _adventure.js`);
        $ctrl.state.current = angular.extend({}, state, state.state);
        // console.log('going', $ctrl.state.current);
        // dont bother continueing if the requested state is already loaded.
        // if ($state.is($ctrl.state.current.name)) return;
        if ($state.is($ctrl.state.current.name)) {
            $location.search('iscore', parseInt($location.search().iscore || 0) +1);
            return;
        }

        if (state) {
            // if there's a video id, toggle loading state.
            if ($ctrl.state.current.data.videoId) toggleLoading(true);
            $state.go($ctrl.state.current.name);
        }
    }

    /**
     * @function
     * @name onApiReady
     * @description - Called by atc-video-background, after it has requested and successfully
     * loaded the youtube iframe api, this is NOT when the player is ready.
     * You can simulate a fake loader by increasing or decreasing the fakeLoader variable, intially the loader is very quick,
     * this just makes the state a little more fluent.
     * 
     * This will go to the default state, unless the inbound state is already set, you can set the default state by setting an angular constant.
     * @example
     * angular.module('atc').constant('$startingState', 'state-folder-name-here');
     * @rules
     * If the default state is provided and the inbound url/state is different and actually exists, it will stay on that state.
     * 
     */

    function onApiReady() {
        let fakeLoader = 1000;
        $timeout(function() {
            $ctrl.apiReady = true;
            angular.element(document.body).addClass('youtube-api-ready');
            $timeout(function() {
                $ctrl.stageReady = true;
                // if current is still undefined, it's because the url is NOT the default, attempt to grab it.
                if (!$ctrl.state.current && $state.current && $state.current.ref) $ctrl.state.current = find($state.current.ref);
                // if current is still undefined, grab the default.
                // if (!$ctrl.state.current || !$state.current || $state.current.name == "") $ctrl.state.current = $ctrl.state.default;
                // only go, if it's defined.
                console.log('only fire once?', $ctrl.state.current)
                if ($ctrl.state.current) go($ctrl.state.current, 'api');
            }, 600); 
        }, fakeLoader, fakeLoader > 0);       
    }

    /**
     * @function
     * @name onPlayerReady
     * @description - Called after the youtube instance player is actually ready to integrate.
     
     * This is exposed on the controller under $ctrl.player, in your state template, this is accessible 
     * under $ctrl.$atc.player
     * @param {[object]} [player] Player from youtube instance, this is automatically called.
     * 
     */    

    function onPlayerReady(player) {        
        $ctrl.playerReady = true;
        $ctrl.player = player;      
        $ctrl.durationSeconds = $ctrl.player.getDuration();  
        $ctrl.duration = convertTime($ctrl.durationSeconds);  
        angular.element(document.body).addClass('youtube-player-ready');
    }



    /**
     * @function
     * @name onStateChange
     * @description - Called by the YouTube instance player, whenever a registered state changes on the actual player.
     * States can be [playing, paused, ended, buffering, queued, unstarted]     
     * This is exposed on the controller under $ctrl.player, in your state template, this is accessible 
     * under $ctrl.$atc.player
     * 
     * When the video finishes (ended) it will close the video and open the state that holds that video.
     * 
     * @param {[object]} [player] Player from youtube instance, this is automatically called.
     * @param {[string]} [playerState] Current state name.
     * 
     */    

    function onStateChange(player, playerState) {
        $atcUtil.nextTick(function() {
            if (playerState != 'ended') {
                $ctrl.state.pre = true;
                $ctrl.state.post = false;
            }
            
            // if the state was ever playing, we've started a video.
            if (playerState == 'playing') {   
                $ctrl.videoStarted = true;             
                // will deregister when the video ends or pauses
                $ctrl.deregister = $atcPoller.register(poller);
                toggleLoading(false);
            }
            if (playerState == 'paused') {
                if ($ctrl.deregister) $ctrl.deregister();
            }

            
            if (playerState == 'ended') {
                $ctrl.state.pre = false;
                // no need to keep polling if the video is ended.
                if ($ctrl.deregister) $ctrl.deregister();
                toggleLoading(true);
                $timeout(function() {                
                    $ctrl.state.current.data.videoId = null;   
                    $ctrl.state.post = true;
                    toggleLoading(false);
                }, 500);
            }
            $ctrl.playerState = playerState;
            $attrs.$set('youtube-state', playerState);
            $ctrl.player = player;
        });
    }    
  

}