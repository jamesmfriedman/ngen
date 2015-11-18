var path = require('path');
var fs = require('fs');
var expect = require('chai').expect;
var UserConfig = require("../lib/UserConfig");

describe('new UserConfig()', function(){
 	it('Should be an object.', function(){
 		var uc = new UserConfig();

 		expect(uc).to.be.an('object');
 	});
});