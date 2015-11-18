var path = require('path');
var fs = require('fs');
var expect = require('chai').expect;
var Package = require("../lib/Package");

 
describe('Package', function(){
	 
	 describe('.getPackages()', function(){
	 	it('Should return a list of local and global nGen packages', function(){
	 		var packages = Package.getPackages();
	 		expect(packages).to.have.length.above(0);
	 		expect(packages[0].name).to.have.string('ngen');
	 	});
	 });
});

describe('new Package()', function(){
	
	var packages = [];

	beforeEach(function(){
		packages = Package.getPackages();
	});

	describe('.name', function(){
		it('Should be a string matching the suffix of the dir name', function(){
			packages.forEach(function(p){
				var dir = fs.realpathSync(path.join(p.dir, '../'));
				expect(p.name).to.equal(dir.split(path.sep).pop().split('ngen-').pop());
			});
		});
	});
});