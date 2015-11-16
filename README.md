Ngen
====
Ngen is here to be better way to scaffold. Why? Other scaffolding generators are too opinionated or try to do too much. Even with a bunch of prebuilt generators, lets face it: you or your team do things your own way. Define your own reusable scaffolds and template individual files, whole directories, or even entire projects.

Installation
------------
Currently waiting to submit to npm, so for the time being:
```bash
$ npm install git@github.com:jamesmfriedman/ngen.git
```
How it works
------------------
Ngen takes a generator spec (a directory) and copies all of its contents to the appropriate locations in your project. The files and file names are processed by Ngen with templated variables and names.

Generators are easy to make and add to your project. You'll probably want to define your own generators, but if you see one that meets your needs, install it to your project or global node_modules directory.
```bash
$ npm install ng-ngen
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
