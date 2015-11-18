#! /usr/bin/env node

var fs = require('fs');
var path = require('path');

var Package = require('./lib/Package')
var UserConfig =  require('./lib/UserConfig')
var Generator =  require('./lib/Generator')

var isBinaryFile = require('isBinaryFile');
var ejs = require('ejs');
var wrench = require('wrench');
var changeCase = require('change-case')
var merge = require('merge');
var prompt = require('prompt');
var argv = require('minimist')(process.argv.slice(2));

function init() {

	// some base args from the command line
	var generatorType = argv._[0];
	var generatorName = argv._[1].split(path.sep).pop();
	var extraPath = argv._[1].split(path.sep).length > 1 ? path.normalize(argv._[1].split(path.sep).slice(0, -1).join(path.sep)) : '';
	var chosenPackage = null;

	// split apart the generator type for package:generator format. Example angular:directive.
	var parts = generatorType.split(':');
	if (parts.length > 1) {
		chosenPackage = parts[0];
		generatorType = parts[1];
	}
	
	// process some configuration
	var userConfig = new UserConfig();
	var commandLineConfig = require('minimist')(process.argv.slice(2)); // get another copy because we're going to edit this one
	delete commandLineConfig._;

	// add user generators
	var packages = Package.getPackages().filter(function(p){
		// filter out other packages if a chosen one was specified
		if (chosenPackage !== null ? p.name == chosenPackage : true) {
			return p.generators.indexOf(generatorType) != -1;
		}
	});	

	if (packages.length == 1) {		
		var generatorPackage = packages[0];
		var generator = new Generator(generatorPackage, generatorType, generatorName, extraPath, userConfig, commandLineConfig);
		generator.generate();

	} else if (packages.length > 1) {
		prompt.start()
		var promptText = '\n\nMultiple packages found containing generator "'+ generatorType +'":\n';
		packages.forEach(function(p, i){
			promptText += '\t' + (i + 1) + ') ' + p.name + ': ' + p.dir + '\n'
		});

		promptText += '\n\nPlease choose a package (1)';
		
		prompt.get([promptText], function(err, result){
			var num = parseInt(result[promptText] || 1);
			if (num <= 0 || num > promptText.length) {
				num = 0;
			} else {
				num = num - 1;
			}
			
			var generatorPackage = packages[num];
			var generator = new Generator(generatorPackage, generatorType, generatorName, extraPath, userConfig, commandLineConfig);
			generator.generate();
		});
	} 

	// not found
	else {
		console.log('');
		console.log('No generators found for "' + generatorType + '"!');
		console.log('Installed Generators:');
		getPackages().forEach(function(p){
			console.log('\t' + p.name + ': ' + p.dir);
			p.generators.forEach(function(g){
				console.log('\t\t' + g);
			});
		});
		console.log('');
	}
}

init();
