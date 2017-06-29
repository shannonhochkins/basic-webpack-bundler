import {
    uid,
    parse
} from './_utils';

var dot = require('dot-object');

module.exports = generator;


function collector(req) {
	let collectedData = {},
		$index = 0,
		tree = {},
		lastGroup = null,
		lastRef;

	// initially, this will loop over each state found
    // and generate an object for us to then iterate over and generate our states, components or anything else automatically.
    req.keys().forEach(function(key, b) {
        // generate a directory object.
        let parsed = parse(key);
        // if the current inbound state directory is '.', expect it to be the default root state.
        let isRootState = parsed.dir === '.';
        if (isRootState) parsed.dir = 'index';

        // the directore of the state
        let base = parsed.dir.replace(/\.\//g, '');

        // a dot notated name from folder names, user, user.edit from folder structure.
        let name = base.replace(/\//g, '.');
        // the last folder requested, /user/edit/please, would reture please.
        let ref = base.split('/').pop();
        // used by angular when registering .components automatically.
        collectedData[ref] = collectedData[ref] || {};
        collectedData[ref].parsed = parsed;
        collectedData[ref].base = base;
        collectedData[ref].name = name;
        collectedData[ref].isRootState = isRootState;
        
        dot.str(name, null, tree);


        switch (parsed.ext) {
            case '.js':
                // save data in _exports.js on .data;
                if (parsed.name == '_exports') collectedData[ref].data = req(key);
                // store component logic from *controller.js
                if (parsed.name.indexOf('controller') > -1) collectedData[ref].controller = req(key);
                break;
            case '.html':
                // store the inbound template on the component directly.
                collectedData[ref].template = req(key);
                break;
            case '.scss':
                // store any local exports froms scss.
                collectedData[ref].locals = req(key);
                break;
        }
        lastRef = ref;
    });

    
    walk(tree);
    return collectedData;


    /**
     * @function
     * @name walk
     * @description - Will recurssively run throught the directories
     * found and map their index with the folder structure, example:
     * 
     * Assuming the below are folders, setup inside our states
     * directory, it will assign an index, based on it's position.
     * 
     * 	angular : 0
     *  	directive : 0
     *   	component : 1
     *    		depth-component : 0
     *    	service : 2
     *     		some-service : 0
     *       	some-other-service : 1
     *        	another-service : 2
     * 
     */

    function walk(obj) {
    	let count = 0;
    	angular.forEach(obj, (__obj, key) => {
    		if (angular.isObject(__obj)) walk(__obj);
    		collectedData[key].$index = count;
    		count++;
   		});
    }
}

function generator(module, opts) {
	opts = angular.extend({}, {
		urlAsNumber : true,
		allowUrlOverride: true,
		allowRootOverride : true,
        rootComponent : null,
        inheritFrom : null,
        inheritedName : '$inherited'
	}, opts);

    if (!opts.rootComponent) throw new Error(`You need to specify the rootComponent property on the options object for your generator. This should be the starting 'component' wrapper.`);
    if (!opts.inheritFrom) opts.inheritFrom = `^^${opts.rootComponent}`;
    if (!module || !module.component) throw new Error("state generator needs the angular module as the first argument, angular 1.5+ is needed.");
    let $generated = {};
    // used to generate urls from the reference names.
    let toUrl = i => i.replace(/^[/]/, '').replace(/[!\/]\s+/g, '-').replace(/([a-zA-Z])(?=[A-Z])/g, '$1-').toLowerCase();
    let toCamelCase = i => i.replace(/[^A-Za-z0-9]/g, ' ').replace(/^\w|[A-Z]|\b\w|\s+/g, (match, index) => {
        // or if (/\s+/.test(match)) for white spaces
        if (+match === 0 || match === '-' || match === '.') return "";
        return index === 0 ? match.toLowerCase() : match.toUpperCase();
    });
    // until we upgrade node, we can't pass dynamic directories to this context

    const nestedStates = require.context(`../src/states/`, true, /(\.|_)(exports.js|controller.js|scss|template.html)$/);


    
    let $nestedStates = collector(nestedStates) || {};
    // default state not found if $rootStates does not resolve correctly.
	if (!$nestedStates.index) throw new Error("No index state found in the states directory.");
    let collectedData = angular.extend({}, $nestedStates);

    let $abstractWrapper = {
        $index : -1,
        name : 'root',
        data : {
            componentName : opts.rootComponent,
            disableComponent : true,
            url : '/',
            state : {
                parent : undefined,
                ref : undefined,
                name : 'root', 
                abstract : true,   
                url : undefined, 
                redirectTo : collectedData.index.name
            }
        }
    };
    collectedData.root = $abstractWrapper;

    
    angular.forEach(collectedData, (data, key) => {
        // used by angular when registering .components automatically.
        let componentName = toCamelCase(key + '-' + uid()),
        	ref = key,
            immediateParent = getImmediateParent(data.name),
        	exported = data.data || {};

        if (exported.componentName) componentName = exported.componentName;

        // when urlAsNumber is true, and we don't have a url defined, use index value.
    
        $generated[ref] = {
            component : {
                generate : !exported.disableComponent,
                name: componentName,
                template: exported.disableComponent ? '' : data.template || `<h1>No template found for ${data.parsed.dir}</h1>`
                // require // we could build something that automatically, request the
                // parent components.
            },
            state: {
                parent : collectedData.root.name,
                $template : data.template,
                // name for our state
                // name: collectedData.root.name + '.' + data.name,
                name : ref,
                // reference to request the state by it's folder name.
                ref,
                // url of the state, should be just the reference name really.
                // url: `/${toUrl(url)}`,
                url : spitUrl(data.name)
            },
            // if the current requested state is a child of another.
            sibling: data.name.indexOf('.') > -1,
            locals: data.locals || null,
            data: exported,
            $original: data,
            $opts : opts
        };
        

        $generated[ref].state.component = componentName;
        if (angular.isObject(exported.state)) $generated[ref].state = angular.merge({}, $generated[ref].state, exported.state);

        /*
         * @function
         * @name spitUrl
         * @description - Auto generates our urls for our states.
         */

        function spitUrl(name) {
            let url = '';
            name.split('.').forEach($this => {
                let other = collectedData[$this];
                let exported = other.data || {};
                // use index values as url else the current key.
                let key = opts.urlAsNumber ? '' + other.$index : $this;
                // when override url is true, and theres an exported url, set it to that.
                if (opts.allowUrlOverride && exported.url) key = exported.url;
                // when the url is not a number, decide to set it to the reference, or the exported url
                if (!opts.urlAsNumber) {            
                    if (opts.allowUrlOverride && !other.isRootState) key = !exported.url ? $this : exported.url;           
                }

                url += '/' + toUrl(key);
                
            });
            url = '/' + toUrl(url);            
            return url;
        }

        /*
         * @function
         * @name getImmediateParent
         * @description - Returns the parent of the current state name.
         */

        function getImmediateParent(d) {
            var s = d.split('.');
            if (s.length === 1) return null;
            if (s.length >= 2) return s[s.length - 2];                
        }

        
        


        
    });
    // make data accessible as constant over application
    module.constant('$generatedData', $generated)

	// by default, it will just start at the root level unless told otherwise.
	.value('$startingState', ($nestedStates.index.name ? $nestedStates.index.name : '') );

    // dynamically creates a component for each state
	angular.forEach($generated, data => {
	    if (data.component && data.component.generate) {
            if (opts.inheritFrom) {
    	        data.component.require = data.component.require || {};
    	        data.component.require[opts.inheritedName] = opts.inheritFrom;
            }
            
	        data.component.controller = data.$original.controller || angular.noop;
	        data.component.controllerAs = data.component.controllerAs || '$ctrl';
            if (data.data && angular.isObject(data.data.component)) {
                // extends from individual state.
                data.component = angular.merge({}, data.component, data.data.component);
            }
            module.component(data.component.name, data.component);
	    }
	    
	});
	// dynamically automates our states and configs for the states.
    module.config(['$stateRegistryProvider', '$locationProvider', '$urlRouterProvider', function($stateRegistryProvider, $locationProvider, $urlRouterProvider) {
	    $locationProvider.html5Mode({
	        enabled : true,
	        requireBase : true,
	        rewriteLinks : true
	    });
	    angular.forEach($generated, data => {
	        if (angular.isObject(data.state)) $stateRegistryProvider.register(data.state);
	    });
        $urlRouterProvider.otherwise($generated.index.state.url);
	}]);	
    return $generated;
}