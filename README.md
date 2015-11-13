Ngen
====
A better way to scaffold
Has Angular generators for now, but its technically agnostic.


Usage
------
From the command line
$ ngen generatorType componentName

$ ngen directive mainNav

Sample Config
-------------
Make a file called ngen.config.js in the main directory of your project

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

