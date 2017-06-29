## Environment setup 

```sh
  $ npm install
```

## Development

Start the Webpack server (includes live reloading when you change files):

```sh
  $ npm start
```


## Create new states

Literally just create a new folder under src/states, the only thing that's required is a template.

```html
/src
	/states
		/some-state
			_some-state.template.html
```			

The template file must have the .template.html extension to register.

The new state is accessible under /some-state.

You can nest states which will also work the same way.			

```html
/src
	/states
		/some-state-a
			_some-state-a.template.html
			/some-state-b
				_some-state-b.template.html
```		

The new state is accessible under /some-state-a.
The new nested state is accessible under /some-state-a/some-state-b.

## Adding controller for a state.

To create javascript logic for a state, add a controll.js file, export a function which is your controller.
This state will automatically show the view, because there's no video data present, to add a video & captions, see below reference.

```html
/src
	/states
		/some-state
			_some-state.template.html
			_some-state.controller.js
```		

Under _some-state.controller.js

```js
module.exports = controller;
function controller() {
	this.title = 'texxxxtttt';
	this.$onInit = function() {
		// methods for main application available under $ctrl.$atc.methods
		// $ctrl.$atc has a huge amount of options available.
	}
}
```		


## Adding a video & captions to your state
By default, the actual template and .controller files, are a view, they're not the video element.

You can add additional data like captions and video to your state by including a _exports.js file inside the same directory.

Now that you've added the videoId inside your template, your video will play first, and then the post view is called.

There's a few hooks available in your template:

```html
<!-- _some-state.template.html -->

<h1>
	Always visible
</h1>

<h2 ng-if="$ctrl.$atc.state.pre">
	Only shown during a video	
</h2>
<h2 ng-if="$ctrl.$atc.state.post">
	Only shown after the video	
</h2>
```	


```html
/src
	/states
		/some-state
			_some-state.template.html
			_some-state.controller.js
			_exports.js
```	

Inside _exports.js, make sure you export an object.

```js
module.exports = {
	// video id or youtube url.
	videoId : 'lAnN6FxQBWk',
	captions : [
		{
			text : 'This is a caption',
			start : 2, // start this caption when video is 2 seconds in
			duration: 2, // stop it 2 seconds later
		},
		{
			text : 'This is a caption too!',
			start : 3, // start this caption 3 seconds in, 
			// this will overwrite the parent caption a second earlier as they overlap and it will
			// always choose the latest caption.
			duration: 9, // stop this caption 9 seconds in.
		}
	]
}
```		


## Debugger mode

Add ?debug to your query string, and it will pull in some debug data overlayed on the page."# basic-webpack-bundler" 
