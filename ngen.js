#! /usr/bin/env node

var fs = require("fs");
var path = require('path');

var ejs = require('ejs');
var wrench = require('wrench');
var changeCase = require('change-case')
var merge = require('merge');
var prompt = require('prompt');
var argv = require('minimist')(process.argv.slice(2));


var Generator = function(generatorPackage, generatorType, generatorName, extraPath, userConfig, inlineConfig) {
	var that = this;
	this.package = generatorPackage;
	this.type = generatorType;
	this.name = generatorName;
	this.extraPath = null
	this.config = null;
	this.spec = path.join(this.package.dir, this.type);
	this.cwd = process.cwd();

	this.init = function() {
		this.config = this.buildConfig();
		this.extraPath = (this.config._.createDir ? this.name : '') + (extraPath ? path.sep + extraPath : '');
	};

	this.generate = function() {

		var conflicts = this.testGen();
		
		if (conflicts.length) {
			prompt.start();

			var promptText = '\n\nFile Conflicts:\n\t';
			promptText += conflicts.join('\n\t');
			promptText += '\n\nThe files and directores listed already exist. Generating will overrwrite. Continue? (y/N)';
			
			prompt.get([promptText], function(err, result){
				if (['y', 'Y', 'yes', 'Yes', 'YES'].indexOf(result[promptText]) != -1) {
					that.makeFiles();
				} else {
					console.log('Aborted by User!')
				}
			});
		} else {
			this.makeFiles();
		}
	};

	this.testGen = function() {
		var conflicts = [];

		this.getFiles().forEach(function(f){
			var newF = that.getNewFileLocation(f);
			if (fs.existsSync(newF)) {
				conflicts.push(newF);
			}
		});

		return conflicts;
	};

	this.makeFiles = function() {
		var dirCount = 0;
		var fileCount = 0;
		var lineCount = 0;

		var pluralize = function(count, single, plural) {
			if (plural == null)
				plural = single + 's';

			return (count == 1 ? single : plural) 
		}

		this.getFiles().forEach(function(f){
			var specF = that.getSpecFileLocation(f);
			var newF = that.getNewFileLocation(f);
			
			if (fs.statSync(specF).isDirectory()) {
				if (fs.existsSync(newF)) {
					wrench.rmdirSyncRecursive(newF);
				}
				
				wrench.mkdirSyncRecursive(newF);
				console.log('Gen dir: ' + newF);
				dirCount++;
			} else {
				var tmpl = fs.readFileSync(specF, 'utf8');
				var rendered = ejs.render(tmpl, that.config);
				lineCount += rendered.split('\n').length

				// create the dirs if we need them
				wrench.mkdirSyncRecursive(path.dirname(newF), 0777);

				if (fs.existsSync(newF)) {
					fs.unlinkSync(newF);
				}
		  		
		  		var fd = fs.openSync(newF, 'w');
		  		fs.writeFileSync(newF, rendered);
		  		console.log('Gen file: ' + newF);
		  		fileCount++;
			}
		});

		var stats = [];

		if (dirCount) {
			stats.push(dirCount + ' ' + pluralize(dirCount, 'directory', 'directories'));
		}

		if (fileCount) {
			stats.push(fileCount + ' ' + pluralize(fileCount, 'file'));
		}

		if (lineCount) {
			stats.push(lineCount + ' ' + pluralize(lineCount, 'line'));
		}

		console.log('');
		console.log('*************************************************')
		console.log('* Generated', this.type, this.name);
		console.log('*', stats.join(', '));
		console.log('*************************************************')
		console.log('');
	};

	this.getFiles = function() {
		var files = wrench.readdirSyncRecursive(this.spec);

		return files.filter(function(f){
			return that.config._.ignore.indexOf(path.basename(f)) == -1;
		});
	};

	this.replaceSlugName = function(name) {
		var matches = name.match(/\[(.+?)\]/g) || [];
		matches.forEach(function(match){
			match = match.slice(1, -1);
			var key = match == 'name' ?'name.raw' : match;

			var replaceVal = eval('that.config.' + key);
			if (typeof replaceVal == 'string') {
				var regex = new RegExp('\\['+ match +'\\]', 'g');
				name = name.replace(regex, replaceVal);
			}
		});
		
		return name;
	};

	this.getSpecFileLocation = function(f) {
		return path.join(this.spec, f);
	};

	this.getNewFileLocation = function(f) {
		var ext = path.extname(f);
		var basename = path.basename(f, ext);
		var name = path.basename(f);
		var newPath;
		
		// this type of file goes somewhere
		if (typeof this.config._.path == 'object' && ext in this.config._.path) {
			newPath = path.join(this.cwd, this.config._.path[ext], f);
		} 

		// catch all in path
		else if (typeof this.config._.path == 'object' && '*' in this.config._.path) {
			newPath = path.join(this.cwd, this.config._.path['*'], f);
		}

		// this component goes somewhere
		else if (typeof this.config._.path == 'string') {
			newPath = path.join(this.cwd, this.config._.path, f);
		}

		// standard path
		else {
			newPath = path.join(this.cwd, this.extraPath, f);	
		}

		newPath = this.replaceSlugName(newPath);
		return newPath		
	};
	
	this.buildConfig = function() {
		// create our config, merge it with the user config for this specific type
		var packageConfigPath = path.join(this.package.dir, 'ngen.config.js');
		var generaterConfigPath = path.join(this.spec, '../..', 'ngen.config.js');
		var nameCases = [
			'', //needed for the raw name
			'camelCase', 
			'pascalCase', 
			'snakeCase', 
			'paramCase', 
			'constantCase', 
			'dotCase'
		];
		
		inlineConfig = inlineConfig || {};

		var userGeneratorConfig = {};
		if ('*' in userConfig) {
			userGeneratorConfig = merge.recursive(true, userGeneratorConfig, userConfig['*']);
		}

		if (this.package.name in userConfig) {
			// get the all for this package
			if ('*' in userConfig[this.package.name]) {
				userGeneratorConfig = merge.recursive(true, userGeneratorConfig, userConfig[this.package.name]['*']);
			}

			// get the generator config
			userGeneratorConfig = merge.recursive(true, userGeneratorConfig, (this.type in userConfig[this.package.name] ? userConfig[this.package.name][this.type] : {} ));
		}
		
		
		var generatorConfig = {};
		if (fs.existsSync(generaterConfigPath)) {
			generatorConfig = require(generaterConfigPath);
		}

		var packageGeneratorConfig = {};
		if (fs.existsSync(packageConfigPath)) {
			var packageConfig = require(packageConfigPath);
			packageGeneratorConfig = merge.recursive(true, packageGeneratorConfig, (this.type in packageConfig ? packageConfig[this.type] : {} ));
		}

		var standardConfig = {
			'_' : {
				ignore: ['ngen.config.js', '.DS_Store'],
				createDir: true,	
			},
			name: {}
		};

		// build out versions of the name
		nameCases.forEach(function(nameCase){
			if (!nameCase) {
				standardConfig.name['raw'] = that.name;			
			} else {
				standardConfig.name[nameCase] = changeCase[nameCase](that.name);
			}
		});

		var conf = merge.recursive(true, standardConfig, packageGeneratorConfig, generatorConfig, userGeneratorConfig, inlineConfig);
		console.log('');
		console.log('Generator Config:');
		console.log(JSON.stringify(conf, null, 4));
		
		return conf;
	}

	this.init();	
};

var Package = function(dir, name) {
	var that = this;
	this.name = name || path.basename(dir);
	this.dir = path.join(dir, 'generators');

	this.generators = fs.readdirSync(this.dir).filter(function(f){
		if (fs.statSync(path.join(that.dir, f)).isDirectory()) {
			return f;
		}
	});
};

var UserConfig = function() {
	var userConfigPath = path.join(process.cwd(), 'ngen.config.js');
	var userConfig = {
		_: {generators: []}
	};

	if (fs.existsSync(userConfigPath)) {
		userConfig = require(userConfigPath);
	}

	return userConfig;
};

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
	userConfig._.generators.push({name: 'ngen', dir: __dirname});
	var packages = userConfig._.generators.map(function(f){
		return new Package(f.dir, f.name);
	}).filter(function(p){
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
			promptText += '\t' + (i + 1) + ') ' + p.name + '\n'
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
		userConfig._.generators.forEach(function(p){
			p = new Package(p.dir, p.name);
			console.log('\t' + p.name + ': ' + p.dir);
			p.generators.forEach(function(g){
				console.log('\t\t' + g);
			});
		});
		console.log('');
	}
}

init();
