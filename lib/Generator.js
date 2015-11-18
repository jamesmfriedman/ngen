var fs = require('fs');
var path = require('path');

var isBinaryFile = require('isBinaryFile');
var ejs = require('ejs');
var wrench = require('wrench');
var changeCase = require('change-case')
var merge = require('merge');
var prompt = require('prompt');

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
					that.out('Aborted by User!')
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
				that.out('nGen dir: ' + newF);
				dirCount++;
			} else {

				if (isBinaryFile.sync(specF)) {
					fs.createReadStream(specF).pipe(fs.createWriteStream(newF));
					that.out('nGen file copy: ' + newF);
				} else {
					var rendered = fs.readFileSync(specF, 'utf8');
					try {
						rendered = ejs.render(rendered, that.config);	
					} catch(e) {
						that.out(e);
					}
					
					// create the dirs if we need them
					wrench.mkdirSyncRecursive(path.dirname(newF), 0777);

					if (fs.existsSync(newF)) {
						fs.unlinkSync(newF);
					}
			  		
			  		var fd = fs.openSync(newF, 'w');
			  		fs.writeFileSync(newF, rendered);
					
					lineCount += rendered.split('\n').length
					that.out('nGen file: ' + newF);
				}
				
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

		that.out('');
		that.out('*************************************************')
		that.out('* Generated', this.type, this.name);
		that.out('* ' + stats.join(', '));
		that.out('*************************************************')
		that.out('');
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
		var packageConfigPath = path.join(this.package.dir, '../', 'ngen.config.js');
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
		
		
		var packageGeneratorConfig = {};
		if (fs.existsSync(packageConfigPath)) {
			var packageConfig = require(packageConfigPath);
			if ('*' in packageConfig) {
				packageGeneratorConfig = merge.recursive(true, packageGeneratorConfig, packageConfig['*']);
			}

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

		var conf = merge.recursive(true, standardConfig, packageGeneratorConfig, userGeneratorConfig, inlineConfig);
		that.out('');
		that.out('Generator Config:');
		that.out(JSON.stringify(conf, null, 4));
		that.out('');
		
		return conf;
	}

	this.out = function(arguments) {
		if (process.env.NODE_ENV != 'test') {
			if (typeof arguments === 'string') {
				arguments = [arguments]
			}

			console.log.apply(console, arguments);
		}
	};

	this.init();	
};

module.exports = Generator;