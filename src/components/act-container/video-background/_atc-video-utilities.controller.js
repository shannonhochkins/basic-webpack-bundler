module.exports = controller;

controller.$inject = ['$scope', '$element', '$window', '$q', '$timeout', '$atcUtil', '$attrs', '$interval'];
function controller($scope, $element, $window, $q, $timeout, $atcUtil, $attrs, $interval) {

    var $ctrl = this;
    $element.children().eq(0).attr('id', 'atc-video-bg');
    $element.addClass('atc-video-bg');
    var computedStyles,
        youtubeRegexp = /https?:\/\/(?:[0-9A-Z-]+\.)?(?:youtu\.be\/|youtube(?:-nocookie)?\.com\S*[^\w\s-])([\w-]{11})(?=[^\w-]|$)(?![?=&+%\w.-]*(?:['"][^<>]*>|<\/a>))[?=&+%\w.-]*/ig,
        ytScript = document.querySelector('script[src="//www.youtube.com/iframe_api"]'),
        $player = $element,           
        parentDimensions,
        playerDimensions,        
        videoArr,
        interval,
        ie = $atcUtil.detectIE();

    // from YT.PlayerState
    const stateNames = {
        '-1': 'unstarted',
        0: 'ended',
        1: 'playing',
        2: 'paused',
        3: 'buffering',
        5: 'queued'
    };

    const playerVarsDefaults = {
        autoplay: 1,
        controls: 0,
        iv_load_policy: 3,
        cc_load_policy: 0,
        modestbranding: 1,
        playsinline: 1,
        enablejsapi : 1,
        rel: 0,
        loop: false,
        showinfo: 0,   
        fs : 0     
    };

    this.player = null;
    this.initialized = false;
    this.apiIsReady = false;
    this.methods = {
        pause,
        play,
        toggleMute,                    
    };

    this.$doCheck = $atcUtil.debounce(function() {
        applyClasses();
    }, 100);


    function applyClasses() {
        if (!$ctrl.initialized) return;
        $ctrl.atcContainer.$element.toggleClass('player-has-started', $ctrl.atcContainer.videoStarted);
        $ctrl.atcContainer.$element.toggleClass('player-is-captions-active', $ctrl.atcContainer.captions);
        $ctrl.atcContainer.$element.toggleClass('player-is-fullscreen-active', $ctrl.atcContainer.methods.fullscreen.isFullScreen());
        $ctrl.atcContainer.$element.toggleClass('player-is-muted', $ctrl.atcContainer.mute);
        $ctrl.atcContainer.$element.toggleClass('player-is-ended', $ctrl.atcContainer.playerState == 'ended');
        $ctrl.atcContainer.$element.toggleClass('player-is-playing', $ctrl.atcContainer.playerState == 'playing');
        $ctrl.atcContainer.$element.toggleClass('player-is-paused', $ctrl.atcContainer.playerState == 'paused');
        $ctrl.atcContainer.$element.toggleClass('player-is-unstarted', $ctrl.atcContainer.playerState == 'unstarted');
        $ctrl.atcContainer.$element.toggleClass('player-is-buffering', $ctrl.atcContainer.playerState == 'buffering');
    }

    this.$onInit = function() {
        this.initialized = true;
        this.atcContainer.methods.fullscreen = _fullscreen();
        this.playerVars = angular.extend({}, playerVarsDefaults, this.playerVars || {});
        this.ratio = this.ratio || 16/9;
        this.mute = this.mute === undefined ? false : this.mute;
        this.captions = this.captions === undefined ? true : this.captions;
        applyClasses();

         /**
         * if it's not mobile or tablet then initialize video
         */
        if( !/Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent) ) {
            var ytd;
            /**
             * Check to see if YouTube IFrame script is ready, if it is, resolve ytd defer, if not, wait for
             * onYouTubeIframeAPIReady to be called by the script to resolve it.
             */
            if (!$window.youTubeIframeAPIReady) {
                ytd = $q.defer();
                $window.youTubeIframeAPIReady = ytd.promise;
                $window.onYouTubeIframeAPIReady = function() {
                    ytd.resolve();
                };
            }

            /**
             * If YouTube IFrame Script hasn't been loaded, load the library asynchronously
             */
            if (!ytScript) {
                var tag = document.createElement('script');
                tag.src = "//www.youtube.com/iframe_api";
                var firstScriptTag = document.getElementsByTagName('script')[0];
                firstScriptTag.parentNode.insertBefore(tag, firstScriptTag);
            } else if (ytd) {
                ytd.resolve();
            }

            /**
             * When the YouTube IFrame API script is loaded, we initialize the video player.
             */
            $window.youTubeIframeAPIReady.then(initVideoPlayer);

            /**
             * Anytime the window is resized, update the video player dimensions and position. (this is debounced for
             * performance reasons)
             */
            angular.element($window).on('resize', windowResized);

        }

    }

    
    


    

    /**
     * @ngdoc method
     * @name getPropertyAllSides
     * @methodOf angularVideoBg.directive:videoBg
     * @description This method takes a property such as margin and returns the computed styles for all four
     * sides of the parent container.
     * @param {string} property - the css property to get
     * @param {Function} func - the function to call on computedStyles
     * @returns {object} - object that contains all four property sides (top, right, bottom, top)
     * @example
     * getPropertyAllSides('margin', computedStyles.getPropertyValue);
     * // returns { margin-top: 10, margin-right: 10, margin-bottom: 10, margin-left: 10 }
     */
    function getPropertyAllSides(property, func) {
        var sides = ['top', 'right', 'bottom', 'left'],
            getProperty = function(obj, side) {
                obj[side] = parseInt(func.call(computedStyles, property + '-' + side), 10);
                return obj;
            };
        return sides.reduce(getProperty, {});
    }

    /**
     * @ngdoc method
     * @name calculateParentDimensions
     * @methodOf angularVideoBg.directive:videoBg
     * @description This method takes the dimensions (width and height) of the parent, as well as the "spacers"
     * (simply all of the margin, padding and border values) and adds the margin, padding and border values to
     * the dimensions in order to get back the outer dimensions of the parent.
     * @param {object} dimensions - width and height of parent container
     * @param {object} spacers - margin, padding and border values of parent container
     * @returns {{width: number, height: number}}
     * @example
     *
     * var dimensions = {
     *      width: 1000,
     *      height: 400
     * };
     *
     * var spacers = {
     *      margin: {
     *          top: 10,
     *          right: 10,
     *          bottom: 10,
     *          left: 10
     *      },
     *      padding: {
     *          top: 0,
     *          right: 10,
     *          bottom: 0,
     *          left: 10
     *      },
     *      border: {
     *          top: 0,
     *          right: 0,
     *          bottom: 0,
     *          left: 0
     *      }
     * };
     *
     * calculateParentDimensions(dimensions, spacers);
     * // returns { width: 1040, height: 420 }
     *
     */
    function calculateParentDimensions(dimensions, spacers) {
        function calculateSpacerValues() {
            var args = Array.prototype.slice.call(arguments),
                spacer,
                sum = 0,
                sumValues = function(_sum, arg) {
                    return spacer[arg] ? _sum + spacer[arg] : _sum;
                };
            for (var key in spacers) {
                if (spacers.hasOwnProperty(key)) {
                    spacer = spacers[key];
                    sum += args.reduce(sumValues, 0);
                }
            }
            return sum;
        }
        
        return {
            width: dimensions.width + calculateSpacerValues('left', 'right'),
            height: (ie && ie < 12) ? dimensions.height : dimensions.height + calculateSpacerValues('top', 'bottom')
        };
    }

    function styleContentElements() {
        var $content = $element.children().eq(1),
            hasContent = !!$content.children().length,
            parentChildren = Array.prototype.slice.call($element.parent().children());
        $element.parent().css({
            position: 'relative',
            overflow: 'hidden'
        });
        if (!hasContent) {
            $element.css({
                position: 'absolute',
                left: '0',
                top: '0'
            });
            // var i = parentChildren.indexOf($element[0]);
            // if (i > -1) {
            //     parentChildren.splice(i, 1);
            // }
            // $content = angular.element(parentChildren);
        }

        // $content.css({
        //     position: 'relative',
        //     zIndex: $ctrl.contentZIndex || 99
        // });
    }

    /**
     * @ngdoc method
     * @name getParentDimensions
     * @methodOf angularVideoBg.directive:videoBg
     * @description This method utilizes the getPropertyAllSides and calculateParentDimensions in order to get
     * the parent container dimensions and return them.
     * @returns {{width: number, height: number}}
     */
    function getParentDimensions() {
        computedStyles = $window.getComputedStyle($element.parent()[0]);
        var dimensionProperties = ['width', 'height'],
            spacerProperties = ['border', 'margin'];
        if (ie && ie < 12) {
            spacerProperties.push('padding');
        }
        dimensionProperties = dimensionProperties.reduce(function(obj, property) {
            obj[property] = parseInt(computedStyles.getPropertyValue(property), 10);
            return obj;
        }, {});
        spacerProperties = spacerProperties.reduce(function(obj, property) {
            obj[property] = getPropertyAllSides(property, computedStyles.getPropertyValue);
            return obj;
        }, {});
        return calculateParentDimensions(dimensionProperties, spacerProperties);
    }

    /**
     * @ngdoc method
     * @name getPlayerDimensions
     * @methodOf angularVideoBg.directive:videoBg
     * @description This method uses the aspect ratio of the video and the height/width of the parent container
     * in order to calculate the width and height of the video player.
     * @returns {{width: number, height: number}}
     */
    function getPlayerDimensions() {
        var aspectHeight = parseInt(parentDimensions.width / $ctrl.ratio, 10),
            aspectWidth = parseInt(parentDimensions.height * $ctrl.ratio, 10),
            useAspectHeight = parentDimensions.height < aspectHeight;
        return {
            width: useAspectHeight ? parentDimensions.width : aspectWidth,
            height: useAspectHeight ? aspectHeight : parentDimensions.height
        };
    }

    /**
     * This method simply executes getParentDimensions and getPlayerDimensions when necessary.
     */
    function updateDimensions() {
        styleContentElements();
        parentDimensions = getParentDimensions();
        playerDimensions = getPlayerDimensions();
    }

    /**
     * This method simply resizes and repositions the player based on the dimensions of the parent and video
     * player, it is called when necessary.
     */
    function resizeAndPositionPlayer() {
        var options = {
            zIndex: 1,
            position: 'absolute',
            width: playerDimensions.width + 'px',
            height: playerDimensions.height + 'px',
            left: parseInt((parentDimensions.width - playerDimensions.width)/2, 10) + 'px',
            top: parseInt((parentDimensions.height - playerDimensions.height)/2, 10) + 'px'
        };
        if (!$ctrl.allowClickEvents) {
            options.pointerEvents = 'none';
        }
        $player.css(options);
    }

    /**
     * This method simply seeks the video to either the beginning or to the start position (if set).
     */
    function seekToStart(video) {
        video = video || $ctrl;
        $ctrl.player.seekTo(video.start || 0);
    }

    function pause() {
        $ctrl.player.pauseVideo();
    }
    
    function play() {
        $ctrl.player.playVideo();
    }

    function toggleMute() {
        if (!$ctrl.player.isMuted()) {
            $ctrl.player.mute();
        } else {
            $ctrl.player.unMute();
        }
    }

    /**
     * This is the method called when the "player" object is ready and can be interfaced with.
     */
    function onPlayerReady() {
        if ($ctrl.onPlayerReady) {
            $atcUtil.nextTick(() => {
                $ctrl.onPlayerReady({ player: $ctrl.player });
            });
        }        
        if ($ctrl.mute && !$ctrl.player.isMuted()) {
            $ctrl.player.mute();
        } else if ($ctrl.player.isMuted()) {
            $ctrl.player.unMute();
        }
        if ($ctrl.playerVars.autoplay) seekToStart();

    }

     /**
     * This method handles looping the video better than the native YT embed API player var "loop", especially
     * when start and end positions are set.
     */
    function isAtEnd() {
        // msDuration = duration * 1000;
        return $interval(() => {
            // if X seconds from end, assume end of video.
            let margin = 0.1,
                duration;
            if ($ctrl.end) {
                duration = $ctrl.end - ($ctrl.start || 0);
            } else if ($ctrl.start) {
                duration = $ctrl.player.getDuration() - $ctrl.start;
            } else {
                duration = $ctrl.player.getDuration();
            }
            var elapsed = $ctrl.player.getCurrentTime();
            // 0.5seconds before the end of the video, add a class
            // to the element so we can start fading it out.
            $element.toggleClass('player-is-ending', elapsed >= (duration - 0.5));

            if (elapsed >= (duration - margin)) {
                onStateChange({data : 0});
            }

        }, 100, 0, false);
    }

    
    /**
     * This is the method called when the "player" object has changed state. It is used here to toggle the video's
     * display css to block only when the video starts playing, and kick off the video loop (if enabled).
     */
    function onStateChange(evt) {
        let state = stateNames[evt.data];
        
        if (state === 'ended') {            
            // $player.css('opacity', '0');
        }
        if (state !== 'playing' && interval) $interval.cancel(interval);
        if (state === 'playing') {
            interval = isAtEnd();
            // $player.css('display', 'block');
            // loopVideo();
        }
        if ($ctrl.onStateChange) {
            $atcUtil.nextTick(() => {
                $ctrl.onStateChange({ player: $ctrl.player, state : state });
            });
        }
    }

    // Fullscreen API
    function _fullscreen() {

        var fullscreen = {
                supportsFullScreen: false,
                isFullScreen: function() { return false; },
                toggle: function() {
                    this.isFullScreen() ? this.cancelFullScreen() : this.requestFullScreen();
                },
                requestFullScreen: function() {},
                cancelFullScreen: function() {},
                fullScreenEventName: '',
                element: null,
                prefix: ''
            },
            browserPrefixes = 'webkit o moz ms khtml'.split(' ');


        // Check for native support
        if (!angular.isUndefined(document.cancelFullScreen)) {
            fullscreen.supportsFullScreen = true;
        } else {
            // Check for fullscreen support by vendor prefix
            for (var i = 0, il = browserPrefixes.length; i < il; i++ ) {
                fullscreen.prefix = browserPrefixes[i];

                if (!angular.isUndefined(document[fullscreen.prefix + 'CancelFullScreen'])) {
                    fullscreen.supportsFullScreen = true;
                    break;
                } else if (!angular.isUndefined(document.msExitFullscreen) && document.msFullscreenEnabled) {
                    // Special case for MS (when isn't it?)
                    fullscreen.prefix = 'ms';
                    fullscreen.supportsFullScreen = true;
                    break;
                }
            }
        }
        // console.log(fullscreen.supportsFullScreen)
        // Update methods to do something useful
        if (fullscreen.supportsFullScreen) {
            // Yet again Microsoft awesomeness,
            // Sometimes the prefix is 'ms', sometimes 'MS' to keep you on your toes
            fullscreen.fullScreenEventName = (fullscreen.prefix === 'ms' ? 'MSFullscreenChange' : fullscreen.prefix + 'fullscreenchange');

            fullscreen.isFullScreen = function(element) {
                if (angular.isUndefined(element)) {
                    element = document.body;
                }
                switch (this.prefix) {
                    case '':
                        return document.fullscreenElement === element;
                    case 'moz':
                        return document.mozFullScreenElement === element;
                    default:
                        return document[this.prefix + 'FullscreenElement'] === element;
                }
            };
            fullscreen.requestFullScreen = function(element) {
                if (angular.isUndefined(element)) {
                    element = document.body;
                }
                angular.element(element).addClass('is-full-screen');
                return (this.prefix === '') ? element.requestFullScreen() : element[this.prefix + (this.prefix === 'ms' ? 'RequestFullscreen' : 'RequestFullScreen')]();
            };
            fullscreen.cancelFullScreen = function() {
                angular.element(fullscreen.element).removeClass('is-full-screen');
                return (this.prefix === '') ? document.cancelFullScreen() : document[this.prefix + (this.prefix === 'ms' ? 'ExitFullscreen' : 'CancelFullScreen')]();
            };
            fullscreen.element = function() {
                return (this.prefix === '') ? document.fullscreenElement : document[this.prefix + 'FullscreenElement'];
            };
        }

        return fullscreen;
    }

    /**
     * This method initializes the video player and updates the dimensions and positions for the first time.
     */
    function initVideoPlayer() {
        if (!$ctrl.apiIsReady && $ctrl.onPlayerReady && $ctrl.player === null) {
            $ctrl.apiIsReady = true;
            $atcUtil.nextTick(() => {
                $ctrl.onApiReady();
            });
            if (!$ctrl.videoId) {
                // video not set yet, don't bother continueing
                return;
            }
        }

        updateDimensions();
        $ctrl.player = new YT.Player($element.children().eq(0).attr('id'), {
            width: playerDimensions.width,
            height: playerDimensions.height,
            videoId: getIdFromURL($ctrl.videoId),
            playerVars : $ctrl.playerVars,
            events: {
                onReady: onPlayerReady,
                onStateChange: onStateChange
            }
        });
        $ctrl.player.methods = $ctrl.methods;        
        $player = $element;
        // $player.css('display', 'none');
        resizeAndPositionPlayer();
    }

    /**
     * @function
     * @name contains
     * @decsription - Simply checks if the inbound string contains another string.
     * @param {[string]} [str] Current string to check against
     * @param {[string]} [substr] Current substring to check if it's contained in the main str
     * @returns {[bool]} - if match is true
     */

    function contains(str, substr) {
        return (str.indexOf(substr) > -1);
    }

    /**
     * @function
     * @name getIdFromURL
     * @description - This will extract the current YouTube ID from a url that's added as the attribute or part of the atribute
     * @param {[String]} [url] Current url to try and extract the ID from.
     * @returns {[String]} - The Youtube ID from the URL if matched
     * @xample:
        $dfrYoutubeApiService.getIdFromURL('https://www.youtube.com/watch?v=wyesmCWM8IU') => wyesmCWM8IU
     */

    function getIdFromURL(url) {
        let id = url.replace(youtubeRegexp, '$1');

        if (contains(id, ';')) {
            let pieces = id.split(';');
            // https://www.youtube.com/watch?v=VbNF9X1waSc&amp;feature=youtu.be
            // `id` looks like 'VbNF9X1waSc;feature=youtu.be' currently.
            // strip the ';feature=youtu.be'
            id = pieces[0];
            if (contains(pieces[1], '%')) {
                // links like this:
                // "http://www.youtube.com/attribution_link?a=pxa6goHqzaA&amp;u=%2Fwatch%3Fv%3DdPdgx30w9sU%26feature%3Dshare"
                // have the real query string URI encoded behind a ';'.
                // at this point, `id is 'pxa6goHqzaA;u=%2Fwatch%3Fv%3DdPdgx30w9sU%26feature%3Dshare'
                let uriComponent = decodeURIComponent(pieces[1]);
                id = (`http://youtube.com${uriComponent}`).replace(youtubeRegexp, '$1');
            }
        } else if (contains(id, '#')) {
            // id might look like '93LvTKF_jW0#t=1'
            // and we want '93LvTKF_jW0'
            id = id.split('#')[0];
        }
        console.log('found', id);
        return id;
    }

    /**
     * @name windowResized
     * @function
     * @description - Called when window is resized.
     */
 
    function windowResized() {
        return $atcUtil.debounce(function() {
            if (!$ctrl.player) return;
            updateDimensions();
            resizeAndPositionPlayer();
        }, 300);
    }


    /**
     * @name requestNew
     * @function
     * @description - When called, it will decide weather or not to destroy the player
     * or request a new one.
     */

    function requestNew() {
        // $player.css('display', 'none');
        if ($ctrl.videoId) {
            $ctrl.atcContainer.methods.stage.reset();
            $ctrl.player.loadVideoById($ctrl.videoId);
        } else {
            $ctrl.player.destroy();            
            $ctrl.player = null;
            $ctrl.atcContainer.methods.video.onDestroy();
        }                
    }

    /**
     * @function
     * @name checkLastVideo
     * @description - Will return true, if the video change detection was the same as the last
     * video, or if the video id does not exist in the changes object.
     */

    function checkLastVideo(changes) {
        if (!changes.videoId || (changes.videoId.currentValue == changes.videoId.previousValue)) {
            // don't go any further if the current video is the same as the changed video.
            // this means no video will every be requested again after the first instace.
            return true;
        }  
        return false;
    }


    this.$onChanges = function(changes) {
        if (!$ctrl.initialized) return;

        // update mute if inbound value changes.
        if (changes.mute) toggleMute();

        // update other changes here.

        let abort = checkLastVideo(changes);
        if ($ctrl.player === null && changes.videoId.currentValue) {      
            if (abort) return;     
            // console.log('initVideoPlayer', $ctrl.videoId);
            initVideoPlayer();
        } else if ($ctrl.player !== null) {
            if (abort) return;
            // player has been previously created, now we update player.
            // console.log('requestNew', $ctrl.videoId);
            requestNew();
        }
    }


}