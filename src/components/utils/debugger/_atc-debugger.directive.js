

module.exports = directive;

function directive() {
	const styles = require('./_atc-debugger.scss');
	return  {
		restrict : 'E',
		scope : true,
		template : `
		<div class="layout-column layout-align-start-start code">
			<span class="punctuation">// state indicators</span>
			<span><span>$atc.apiReady</span>: <span class="bool">{{ $atc.apiReady | json }}</span></span>
			<span><span>$atc.isLoading</span>: <span class="bool">{{$atc.isLoading | json }}</span></span>
			<span><span>$atc.player</span>: <span class="{{$atc.player == null ? 'null' : 'punctuation'}}">{{ $atc.player == null ? 'null' : $atc.player.getIframe() == 'null' ? 'error' : '"initialized"' }}</span></span>			
			<span><span>$atc.state.pre</span>: <span class="bool">{{$atc.state.pre | json }}</span></span>
			<span><span>$atc.state.post</span>: <span class="bool">{{$atc.state.post | json }}</span></span>
			<span><span>$atc.stageReady</span>: <span class="bool">{{ $atc.stageReady | json }}</span></span>
			<span><span>$atc.playerReady</span>: <span class="bool">{{$atc.playerReady | json }}</span></span>
			<span><span>$atc.playerState</span>: <span class="{{$atc.playerState ? 'string' : 'null'}}">{{$atc.playerState ? $atc.playerState : null  | json }}</span></span>
			<span class="punctuation">// state data</span>
			<span><span>$atc.state.current.data.videoId</span>: <span class="{{$atc.state.current.data.videoId ? 'string' : $atc.state.current == null ? 'null' : $atc.state.current && !$atc.state.current.data.videoId ? 'string' : 'red'}}">{{$atc.state.current.data.videoId ? '"' + $atc.state.current.data.videoId + '"'  : $atc.state.current == null ? 'null' : $atc.state.current && !$atc.state.current.data.videoId  ? '"no video"' : 'error'}}</span></span>
			<span><span>$atc.state.last.ref</span>: <span class="string">{{$atc.state.last.ref ? $atc.state.last.ref : '' | json }}</span></span>
			<span><span>$atc.state.current.ref</span>: <span class="string">{{$atc.state.current.ref ? $atc.state.current.ref : '' | json }}</span></span>			
		</div>		
		<div class="player-controls" style="position:relative; background:none;" ng-if="$atc.videoStarted">
			<button type="button" class="layout-row" ng-click="$atc.player.seekTo($atc.player.getDuration() - 1)" style="display:flex">
				<p>Skip Video&nbsp;&nbsp;&nbsp;</p>
		      	<svg><use xmlns:xlink="http://www.w3.org/1999/xlink" xlink:href="#player-fast-forward"></use></svg>
		      	<span class="player-tooltip">Skip to end of video.</span>
		    </button>
	     </div>
		`
	};

}