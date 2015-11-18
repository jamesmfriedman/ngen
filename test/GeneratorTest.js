process.env.NODE_ENV = 'test';

var path = require('path');
var fs = require('fs');
var expect = require('chai').expect;
var wrench = require('wrench');

var UserConfig = require("../lib/UserConfig");
var Package = require("../lib/Package");
var Generator = require("../lib/Generator");

describe('new Generator()', function(){

	var packages = Package.getPackages();
	var generator = null;
	var fakeUserConf = {};
	var fakeCommandLineConf = {};

	beforeEach(function(){
		generator = new Generator(packages[0], 'ngenTestGenerator', 'ngenTest', null, new UserConfig(), {});
		
		fakeUserConf = {
			'*': {
				'ngenStarTest': 'userConfigGlobalStar'
			},
			'ngen' : {
				'*': {
					'ngenStarTest': 'userConfig'
				},

				'ngenTestGenerator' : {
					'_' : {},
					'ngenTestVar' : 'userConfig',
					'ngenTestVal' : 'helloWorld',
					'ngenTestObj' : {
						'foo' : 'baz'
					}
				}
			}
		};

		fakeCommandLineConf = {
			'ngenTestVar' : 'commandLineConfig'
		};
	})

	describe('.init()', function(){
	 	it('Should work.', function(){
	 		expect(generator).to.be.an('object');
	 	});
	});

	describe('.generate()', function(){
	 	it('Should generate init generator scaffold in node_modules.', function(){
	 		var initGenerator = new Generator(packages[0], 'init', 'ngenTest', null, new UserConfig(), {});
	 		initGenerator.generate();
	 		var dir = path.join(process.cwd(),'node_modules', 'ngen-ngenTest');
	 		expect( fs.existsSync(dir) ).to.be.true;
	 		wrench.rmdirSyncRecursive(dir);
	 	});

	 	it('Should generate ngenTestGenerator.', function(){
	 		generator.generate();
	 		var dir = path.join(process.cwd(), 'ngenTest');
	 		expect( fs.existsSync(dir) ).to.be.true;
	 		wrench.rmdirSyncRecursive(dir);
	 	});
	});

	describe('.testGen()', function(){
	 	it('Should detect conflicts.', function(){
	 		generator.generate();
	 		var dir = path.join(process.cwd(),'ngenTest');
	 		expect(generator.testGen()).to.have.length.above(0);
	 		wrench.rmdirSyncRecursive(dir);
	 	});
	});

	describe('.replaceSlugName()', function(){
		it('Should replace a [value] with one present in config.', function(){
			generator = new Generator(packages[0], 'ngenTestGenerator', 'ngenTest', null, fakeUserConf, {});
			var val = generator.replaceSlugName('[ngenTestVal].js');
			expect(val).to.match(/^helloWorld\.js/);
		});

		it('Should handle a special case for [name] and match it to name.raw in the config.', function(){
			generator = new Generator(packages[0], 'ngenTestGenerator', 'ngenTest', null, fakeUserConf, {});
			var val = generator.replaceSlugName('[name].js');
			expect(val).to.match(/^ngenTest\.js/);
		});

		it('Should handle nested keys [value.param].', function(){
			generator = new Generator(packages[0], 'ngenTestGenerator', 'ngenTest', null, fakeUserConf, {});
			var val = generator.replaceSlugName('[ngenTestObj.foo].js');
			expect(val).to.match(/^baz\.js/);
		});
	});

	describe('.getNewFileLocation()', function(){
		it('Should place all files in a named folder if no extra path specified.', function(){
			generator.getFiles().forEach(function(f){
				var newF = generator.getNewFileLocation(f);
				expect( newF.search(process.cwd()) ).to.equal(0);
			});
		});

		it('Should route all files to a singular location if _.path is a string.', function(){
			fakeUserConf.ngen.ngenTestGenerator._.path = 'src/components'

			generator = new Generator(packages[0], 'ngenTestGenerator', 'ngenTest', null, fakeUserConf, {});
			generator.getFiles().forEach(function(f){
				var newF = generator.getNewFileLocation(f);
				expect( newF.search( path.join(process.cwd(), generator.config._.path) )).to.equal(0);
			});
		});

		it('Should route files to multiple locations if _.path is an object.', function(){
			fakeUserConf.ngen.ngenTestGenerator._.path = {
				'*': 'src/components',
				'.html' : 'public/templates'
			}

			generator = new Generator(packages[0], 'ngenTestGenerator', 'ngenTest', null, fakeUserConf, {});
			
			generator.getFiles().forEach(function(f){
				var newF = generator.getNewFileLocation(f);
				var foundPath = generator.config._.path[path.extname(newF)] || generator.config._.path['*']
				expect( newF.search( path.join(process.cwd(), foundPath) )).to.equal(0);	
			});
		});

		it('Should append the extraPath to the current one.', function(){
			generator = new Generator(packages[0], 'ngenTestGenerator', 'ngenTest', 'foo', fakeUserConf, {});
			generator.getFiles().forEach(function(f){
				var newF = generator.getNewFileLocation(f);
				expect( newF.search( path.join(process.cwd(), generator.name, 'foo') )).to.equal(0);
			});
		});
	});

	describe('.buildConfig()', function(){
	 	it('Should be an object.', function(){
	 		var config = generator.buildConfig();
	 		expect(config).to.be.an('object');
	 	});

	 	it('Should merge package ngen.config.', function(){
	 		var config = generator.buildConfig();
	 		expect(config.ngenTestVar).to.match(/^packageConfig/);
	 	});

	 	it('Should merge * values in package ngen.config.', function(){
	 		var config = generator.buildConfig();
	 		expect(config.ngenStarTest).to.match(/^packageConfig/);
	 	});

	 	it('Should merge users ngen.config.', function(){
	 		generator = new Generator(packages[0], 'ngenTestGenerator', 'ngenTest', null, fakeUserConf, {});
	 		var config = generator.buildConfig();
	 		expect(config.ngenTestVar).to.match(/^userConfig/);
	 	});

	 	it('Should merge global * values in users ngen.config.', function(){
	 		delete fakeUserConf.ngen;
	 		generator = new Generator(packages[0], 'ngenTestGenerator', 'ngenTest', null, fakeUserConf, {});
	 		var config = generator.buildConfig();
	 		expect(config.ngenStarTest).to.match(/^userConfigGlobalStar/);
	 	});

	 	it('Should merge * values in users ngen.config under the package.', function(){
	 		generator = new Generator(packages[0], 'ngenTestGenerator', 'ngenTest', null, fakeUserConf, {});
	 		var config = generator.buildConfig();
	 		expect(config.ngenStarTest).to.match(/^userConfig/);
	 	});

	 	it('Should merge inline (command line) options.', function(){
	 		generator = new Generator(packages[0], 'ngenTestGenerator', 'ngenTest', null, fakeUserConf, fakeCommandLineConf);
	 		var config = generator.buildConfig();
	 		expect(config.ngenTestVar).to.match(/^commandLineConfig/);
	 	});
	});
});