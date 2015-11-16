Ngen
====
Ngen is here to be better way to scaffold. Why? Other scaffolding generators are too opinionated or try to do too much. Even with a bunch of prebuilt generators, lets face it: you or your team do things your own way. Define your own reusable scaffolds and template individual files, whole directories, or even entire projects.

Installation
------------
Currently waiting to submit to npm, so for the time being:
```bash
$ npm install git@github.com:jamesmfriedman/ngen.git
```
Generators are easy to make and add to your project. You'll probably want to define your own generators, but if you see one that meets your needs, install it to your project or global node_modules directory.
```bash
$ npm install ng-ngen
```
After ngen is installed, at an ngen.config.js file to the root of your project. This is where you can define per project configuration, and where you add generators to your project. Here is the simplest version of the config, with one generator installed:

```javascript
module.exports = {
	_ : {
		generators: [
			require('ngen-ng')	
		]
	}
}
```

How it works
------------------
Ngen takes a generator spec (a directory) and copies all of its contents to the appropriate locations in your project. The files and file names are processed by Ngen with a configuration object containing templated variables and names. Example Spec and example [name].js file:
```
// example spec
+-- directive
|	+-- [name].html
|	+-- [name.paramCase].scss
|	+-- [name].js
|	+-- tests
|	|	+-- [name.snakeCase]_test.js
|	|	+-- another_test.js
```
```javascript
// example [name].js file
angular.module('<%= module || name.camelCase %>').directive('<%= name.camelCase %>', function() {
	return 'E',
	templateUrl: '<%= templatePath %><%= name.camelCase %>.html',
	link: function(scope, el, attrs) {},
	controller: function($scope) {}
});
```

Runnging the command `$ ngen directive helloWorld` would generate the following structure in your project as well as process the individual files to inject template variables using EJS templating (http://www.embeddedjs.com/). 
```
// generated directory
+-- helloWorld
|	+-- helloWorld.html
|	+-- hello-world.scss
|	+-- helloWorld.js
|	+-- tests
|	|	+-- hello_world_test.js
|	|	+-- another_test.js
```
```javascript
// example helloWorld.js file
angular.module('app').directive('helloWorld', function() {
	return 'E',
	templateUrl: '/public/templates/helloWorld.html',
	link: function(scope, el, attrs) {},
	controller: function($scope) {}
});
```

Usage
------
Ngen is a command line tool that takes in a set of parameters.
```bash
$ ngen optionalPackageName:generator componentName
```
Here is an example in usage
```bash
$ ngen ng:directive mainNav
```
This will generate a new directive using the 'directive' generator and give it a name "mainNav". The directive generator is part of the 'ng' generator package. You don't have to specify the package explicity, Ngen will prompt you if it finds multiple generators named the same thing. Shorthand:
```bash
$ ngen directive mainNav
```
Configure to Your Heart's Desire
--------------------------------
When Ngen runs, it builds a configuration object that gets passed into all of the generator's files as template variables. Configuration variables are honored in the following order:

- any inline command line args
- the project's ngen.config.js file
- the generator's ngen.config.js file
- the generator package's ngen.config.js file
- the standard Ngen config.

When running Ngen, the configuration object will be logged in your terminal so theres no guessing as to what your templates are seeing. In addition to the templates, file names can use any variables present in your configuration using dot notation. Example, a file named [module].js will be replaced with a configuration variable {'module': 'foo'}.

Sample Config
-------------
Make a file called ngen.config.js in the main directory of your project. The only required configuration parameter is _.generators.

```javascript
module.exports = {
	// the underscore is for Ngen configuration options. They're kept here so they don't conflict with your 
	- : {
		generators: [require('ngen-ng')] // require as many generator packages as your want.
		ignore: ['.DS_Store', 'ngen.config.js'] // array of filenames to ignore when copying scaffolding. This is the default.
	},
	
	// specific configuration for a genrator called 'template'
	'template': {
		_ : {
			// just copies the files and does not contain a parent directory for the generator
			createDir: false
		}
		// these are custom variables that will be exposed to any files in the generator when templating
		staticPath: '/public/',
		namespace: 'myapp-'
	},
	
	//specific configuration for a generator called 'service'
	'service' : { 
		_ : {
			path: '/src/services' //places all files created by this generator in /src/services
		}
		// these are custom variables that will be exposed to any files in the generator when templating
		module: 'myapp.services'
	},
	
	//specific configuration for a generator called 'directive'
	'directive': {
		_ : {
			path: {
				'*': '/src/components/[name.camelCase]/', // a catch all location for generated files
				'.html': '/public/templates/', //transfers files with an html extension to this location
				'.scss': '/src/sass/' //transfers files with an scss extenstion to this location.
			}
		}
		
		// these are custom variables that will be exposed to any files in the generator when templating
		foo: 'baz',
		hello: 'world'
	}
}
```
