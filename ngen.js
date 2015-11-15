#! /usr/bin/env node

var fs = require("fs");
var path = require('path');

var ejs = require('ejs');
var wrench = require('wrench');
var changeCase = require('change-case')
var merge = require('merge');
var prompt = require('prompt');
var argv = require('minimist')(process.argv.slice(2));

var Generator = function(generatorPackage, generatorType, generatorName, extraPath, inlineConfig) {
	var that = this;
	this.package = generatorPackage;
	this.packageDir = path.join(__dirname, 'generators', this.package); 
	this.type = generatorType;
	this.name = generatorName;
	this.extraPath = null
	this.config = null;
	this.spec = path.join(this.packageDir, this.type);
	this.cwd = process.cwd();

	this.init = function() {
		this.config = this.buildConfig();
		this.extraPath = (this.config.createDir ? this.name : '') + (extraPath ? path.sep + extraPath : '');
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
				
				fs.mkdirSync(newF);

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
			return that.config.ignore.indexOf(path.basename(f)) == -1;
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
		if (typeof this.config.path == 'object' && ext in this.config.path) {
			newPath = path.join(this.cwd, this.config.path[ext], f);
		} 

		// catch all in path
		else if (typeof this.config.path == 'object' && '*' in this.config.path) {
			newPath = path.join(this.cwd, this.config.path['*'], f);
		}

		// this component goes somewhere
		else if (typeof this.config.path == 'string') {
			newPath = path.join(this.cwd, this.config.path, f);
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
		var userConfigPath = path.join(process.cwd(), 'ngen.config.js');
		var packageConfigPath = path.join(this.packageDir, 'ngen.config.js');
		var generaterConfigPath = path.join(this.spec, 'ngen.config.js');
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
		if (fs.existsSync(userConfigPath)) {
			var userConfig = require(userConfigPath);

			if ('*' in userConfig) {
				userGeneratorConfig = merge.recursive(true, userGeneratorConfig, userConfig['*']);
			}

			if (this.package in userConfig) {

				// get the all for this package
				if ('*' in userConfig[this.package]) {
					userGeneratorConfig = merge.recursive(true, userGeneratorConfig, userConfig[this.package]['*']);
				}

				// get the generator config
				userGeneratorConfig = merge.recursive(true, userGeneratorConfig, (this.type in userConfig[this.package] ? userConfig[this.package][this.type] : {} ));
			}

			if (userConfig) {
				
			}
		}
		
		var generatorConfig = {};
		if (fs.existsSync(generaterConfigPath)) {
			generatorConfig = require(generaterConfigPath);
		}

		var packageConfig = {};
		if (fs.existsSync(packageConfigPath)) {
			packageConfig = require(packageConfigPath);
		}

		var standardConfig = {
			ignore: ['ngen.config.js', '.DS_Store'],
			createDir: true,
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

		var conf = merge.recursive(true, standardConfig, packageConfig, generatorConfig, userGeneratorConfig, inlineConfig);
		console.log('');
		console.log('Generator Config:');
		console.log(JSON.stringify(conf, null, 4));
		
		return conf;
	}

	this.init();	
};

function init() {
	var generatorPackage = 'angular';
	var generatorType = argv._[0];
	var generatorName = argv._[1].split(path.sep).pop();
	var extraPath = argv._[1].split(path.sep).length > 1 ? path.normalize(argv._[1].split(path.sep).slice(0, -1).join(path.sep)) : '';
	var commandLineConfig = require('minimist')(process.argv.slice(2)); // get another copy because we're going to edit this one
	delete commandLineConfig._;

	var generator = new Generator(generatorPackage, generatorType, generatorName, extraPath, commandLineConfig);
	generator.generate();

}

init();
