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

	beforeEach(function(){
		generator = new Generator(packages[0], 'init', 'helloWorldTest', null, new UserConfig(), {});
	})

 	it('Should init.', function(){
 		expect(generator).to.be.an('object');
 	});

 	it('Should generate.', function(){
 		generator.generate();
 		var dir = path.join(process.cwd(),'node_modules', 'ngen-helloWorldTest');
 		expect( fs.existsSync(dir) ).to.be.true;
 		wrench.rmdirSyncRecursive(dir);
 	});

 	it('Should detect conflicts.', function(){
 		generator.generate();
 		var dir = path.join(process.cwd(),'node_modules', 'ngen-helloWorldTest');
 		expect(generator.testGen()).to.have.length.above(0);
 		wrench.rmdirSyncRecursive(dir);
 	});
});