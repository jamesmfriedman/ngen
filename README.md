Ngen
====
Ngen is here to be better way to scaffold. Why? Other scaffolding generators are too opinionated or try to do too much. Even with a bunch of prebuilt generators, lets face it: you or your team do things your own way. Define your own reusable scaffolds and template individual files, whole directories, or even entire projects.

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

Runnging the command `$ ngen directive helloWorld` would generate the following structure in your project as well as process the individual files to inject template variables using EJS templating. 
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
			require('ng-ngen')	
		]
	}
}
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
When Ngen runs, it builds a configuration object that gets passed into all of the generator's files as template variables.

Sample Config
-------------
Make a file called ngen.config.js in the main directory of your project

```javascript
module.exports = {
	'service' : {
		path: '/src/services' //places all files created by this generator in /src/services
	},
	'directive': {
		'templatePath': '/public/templates/', //overrides the variable templatePath in the generator template
		'path': {
			// path can be an object. * is a catch all, otherwise catch extensions and move them to specific directories.
			// in this example, all our html templates will be moved to public / templates
			'*': 'src/components/', 
			'.html': 'public/templates/'
		}
	}
}
```
