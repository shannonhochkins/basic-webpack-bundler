module.exports =  {
    bindings: {
        videoId: '<?',
        playerVars: '<?',
        playlist: '<?',
        ratio: '<?',
        loop: '<?',
        mute: '<?',
        start: '<?',
        end: '<?',
        captions : '<?',
        contentZIndex: '<?',
        allowClickEvents: '<?',        
        onApiReady: '&?',
        onPlayerReady: '&?',
        onStateChange: '&?'
    },
    require : {
        atcContainer : '^atcContainer',
    },
    transclude: true,
    template: '<div><div></div><div ng-transclude></div></div>',
    controllerAs : '$video',
    controller : require('./_atc-video-utilities.controller.js')
};

