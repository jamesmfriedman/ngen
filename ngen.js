#! /usr/bin/env node

var fs = require("fs");
var ejs = require('ejs');
var wrench = require('wrench');
var path = require('path');
var changeCase = require('change-case')
var merge = require('merge');
var prompt = require('prompt');

var nameCases = [
	'', //needed for the raw name
	'camelCase', 
	'pascalCase', 
	'snakeCase', 
	'paramCase', 
	'constantCase', 
	'dotCase'
];

var userArgs = process.argv.slice(2);
var componentType = userArgs.length ? userArgs[0] : null;
var componentPath = path.normalize(userArgs.length > 1 ? userArgs[1].split(path.sep).slice(0, -1).join(path.sep): componentType);
var componentName = userArgs[1].split(path.sep).pop();
var generator = 'angular';

var specDir = path.join(__dirname, 'generators', generator, componentType);
var newDir;
var componentConfig = buildConfig();



function init () {
	getDirs();

	if (fs.existsSync(newDir)) {
		prompt.start();
		var promptText = 'That directory already exists. Generating will overrwrite that directory. Continue? (y/N)';
		prompt.get([promptText], function(err, result){
			if (['y', 'Y', 'yes', 'Yes', 'YES'].indexOf(result[promptText]) != -1) {
				generate();
			} else {
				console.log('Aborted by User!')
			}
		});
	} else {
		generate();
	}
}

function generate() {
	wrench.mkdirSyncRecursive(newDir, 0777);
	
	// copy over the existing dir recursively
	wrench.copyDirSyncRecursive(specDir, newDir, {
		forceDelete: true, // Whether to overwrite existing directory or not
		excludeHiddenUnix: true, // Whether to copy hidden Unix files or not (preceding .)
		preserveFiles: false, // If we're overwriting something and the file already exists, keep the existing
		preserveTimestamps: false, // Preserve the mtime and atime when copying files
		inflateSymlinks: true, // Whether to follow symlinks or not when copying files
		exclude: 'ngen.config.js'
	});	

	// loop through all of the files
	wrench.readdirRecursive(newDir, function(error, curFiles) {
		if (!curFiles) return;

		curFiles.forEach(function(f){
			f =  path.join(newDir,f)

			if (fs.statSync(f).isDirectory()) return;

			var tmpl = fs.readFileSync(f, 'utf8');
		  	fs.writeFileSync(f, ejs.render(tmpl, componentConfig));
		  		
	  		var ext = path.extname(f)
			
			var newName = replaceSlugName(f);
			fs.renameSync(f, newName);
			f = newName;

			if ('path' in componentConfig && typeof componentConfig.path != 'string' && ext in componentConfig.path) {
				var extPath = replaceSlugName(path.normalize(componentConfig.path[ext]));
				wrench.mkdirSyncRecursive(extPath, 0777);
				fs.renameSync(f, path.join(extPath, path.basename(f)))	
			}
		});

		// this should fail if its not empty
		fs.rmdir(newDir, function(err){});
	});

	console.log('');
	console.log('*************************************************')
	console.log('* Generated', componentType, componentName);
	console.log('*************************************************')
	console.log('');
}

function getDirs() {

	var basePath = '';
	if (typeof componentConfig.path == 'string') {
		basePath = componentConfig.path;
	} else if (componentConfig.path && componentConfig.path['*']) {
		basePath = componentConfig.path['*'];
	}

	newDir = path.join( process.cwd(), basePath , componentPath, componentName );

}

function buildConfig() {
	// create our config, merge it with the user config for this specific type
	var userConfigPath = path.join(process.cwd(), 'ngen.config.js');
	var generaterConfigPath = path.join(specDir, 'ngen.config.js');

	var userComponentConfig = {};
	if (fs.existsSync(userConfigPath)) {
		var userConfig = require(userConfigPath);
		userComponentConfig = componentType in userConfig ? userConfig[componentType] : {};
	}
	
	var generatorConfig = {};
	if (fs.existsSync(generaterConfigPath)) {
		generatorConfig = require(generaterConfigPath);
	}

	var standardConfig = {
		name: {}
	};

	// build out versions of the name
	nameCases.forEach(function(nameCase){
		if (!nameCase) {
			standardConfig.name['raw'] = componentName;			
		} else {
			standardConfig.name[nameCase] = changeCase[nameCase](componentName);
		}
	});

	var conf = merge.recursive(true, standardConfig, generatorConfig, userComponentConfig);
	console.log('');
	console.log('Generator Config:');
	console.log(JSON.stringify(conf, null, 4));
	
	return conf;
}

/**
 * takes a string witha slug name and replace it with the proper cased name
 */
function replaceSlugName(name) {
	var replaceWith = null;
	nameCases.forEach(function(nameHash){
		var regex = new RegExp('\\[name' + changeCase.upperCaseFirst(nameHash) + '\\]', 'g');
		if (name.search(regex) != -1) {
			name = name.replace(regex, componentConfig.name[nameHash || 'raw']);
		}	
	});

	return name;
}

init();