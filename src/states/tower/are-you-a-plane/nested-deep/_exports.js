module.exports = {
	videoId : 'lAnN6FxQBWk',
	state : {
		onEnter : function() {
			console.log('called when state starts.')
		},
		params : {
		    someQueryString : {
		    	value: "someValue"
		    }
		}
	},
	component : {
		require : {
			test : '^?tester'
		},
		bindings : {
			attr : '<?'
		}
	}
}