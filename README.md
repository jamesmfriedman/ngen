# nGen

nGen is here to be better way to scaffold. Why? Other scaffolding generators are too opinionated or try to do too much. Even with a bunch of prebuilt generators, lets face it: you or your team do things your own way. Define your own reusable scaffolds and template individual files, whole directories, or even entire projects.

## Installation

Currently waiting to submit to npm, so for the time being:
```shell
$ npm install git@github.com:jamesmfriedman/ngen.git
```
Generators are easy to make and add to your project. You'll probably want to define your own generators, but if you see one that meets your needs, install it to your project or global node_modules directory.
```shell
$ npm install ngen-ng
```
The ngen-ng Angular generator is available here: https://github.com/jamesmfriedman/ngen-ng

After nGen is installed, at an ngen.config.js file to the root of your project. This is where you can define per project configuration, and where you add generators to your project. Here is the simplest version of the config, with one generator installed:

```javascript
module.exports = {
	_ : {
		generators: [
			require('ngen-ng')	
		]
	}
}
```

## How it works
nGen takes a generator spec (a directory) and copies all of its contents to the appropriate locations in your project. The files and file names are processed by nGen with a configuration object containing templated variables and names. Example Spec and example [name].js file:
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

Running the command `$ ngen directive helloWorld` would generate the following structure in your project as well as process the individual files to inject template variables using EJS templating (http://www.embeddedjs.com/). 
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

## Usage
nGen is a command line tool that takes in a set of parameters.
```shell
$ ngen optionalPackageName:generator componentName
```
Here is an example in usage
```shell
$ ngen ng:directive mainNav
```
This will generate a new directive using the 'directive' generator and give it a name "mainNav". Note, you don't have to explicity specify the pakage ng, especially if you only have one generator package installed.
```shell
$ ngen directive mainNav
```
### Configure to Your Heart's Desire
When nGen runs, it builds a configuration object that gets passed into all of the generator's files as template variables. Configuration variables are honored in the following order:

- any inline command line args
- the project's ngen.config.js file
- the generator's ngen.config.js file
- the generator package's ngen.config.js file
- the standard nGen config.

When running nGen, the configuration object that gets passed to your templates will be logged in your terminal so theres no guessing as to what values are getting processed. In addition to the templates, file names can use any variables present in your configuration using dot notation. Example, a file named [module].js will be replaced with a configuration variable {'module': 'foo'}. The name you pass into the command line will be available in the name property converted into camelCase, PascalCase, snake_case, param-case, CONSTANT_CASE, and dot.case. In your template just access it accordingly (name.camelCase, name.pascalCase). Again, the same options are available to your file names, so you can name your files or directories things like [name]/[name.camelCase].js.

### Sample Config
Make a file called `ngen.config.js` in the main directory of your project. The only required configuration parameter is _.generators.

```javascript
module.exports = {
	
	- : { // the underscore is for global nGen configuration options, here so they don't conflict with your params
		generators: [require('ngen-ng')] // require as many generator packages as your want.
		ignore: ['.DS_Store', 'ngen.config.js'] // array of filenames to ignore when copying scaffolding. This is the default.
	},
	
	ng: { // configuration for the 'ng' generator package
		template: { // a basic custom configuration for a generator called 'template'
			_ : {
				// just copies the files and does not contain a parent directory for the generator
				createDir: false
			}
			// these are custom variables that will be exposed to any files in the generator when templating
			staticPath: '/public/',
			namespace: 'myapp-'
		},
		service : { //specific configuration for a generator called 'service'
			_ : {
				path: '/src/services' //places all files created by this generator in /src/services
			}
			// these are custom variables that will be exposed to any files in the generator when templating
			module: 'myapp.services'
		},
		directive: { //an advanced configuration 'directive'. Routes differnt types of files to multiple locations
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
		},
		
		'*': { // any params or options in here will apply to all generators in the 'ng' package
			myAppName: 'awesomeapp'
		}
	}
}
```

### Inline Arguments
Any arguments passed into the command line using the `--argument value` syntax will be captured and converted to configuration options. These options will override any conflicting ones in your config.
```shell
$ ngen directive helloWorld --module foo --publicPath /static/
```

## Creating your own Generators.
Since no one can know exactly how you do things, you're probably going to want to make your own generators. Luckily it's as easy as running nGen.

1. Make sure `ngen` is installed and available
2. In your project's root, run `ngen newGenerator yourGeneratorPackageName`
3. Your generator is now avilable in your node_modules folder and can be accessed by using require('ngen-yourGeneratorPackageName') from your config.

Check it out in your `node_modules` folder, you should see something like this:
```
+-- ngen-yourGeneratorPackageName
|	+-- index.js
|	+-- generators
| 	+-- ngen.config.js //optional config for your whole package
|	+-- sampleGenerator
|	|	+-- index.html
```

From here, just start adding your own generators to your new package.
