var fs = require('fs');
var path = require('path');
var childProcess = require('child_process');

var Package = function(dir) {
	var that = this;	
	this.name = path.basename(dir).split('ngen-').pop()
	
	if (fs.lstatSync(dir).isSymbolicLink()) {
		dir = fs.readlinkSync(dir);
	}

	this.dir = path.join(dir, 'generators');

	this.generators = fs.readdirSync(this.dir).filter(function(f){
		if (fs.statSync(path.join(that.dir, f)).isDirectory()) {
			return f;
		}
	});
};

Package.getPackages = function() {
	var packages = [
		path.join(__dirname, '../')
	];

	var prefix = childProcess.execSync('npm config get prefix').toString().replace(/\r?\n|\r/g, '');
	var localPrefix = childProcess.execSync('npm bin').toString().replace(/\r?\n|\r/g, '');
	var nodePaths = [
		path.join(prefix, 'lib', 'node_modules'), // unix
		path.join(prefix, 'node_modules'), // windows
		path.dirname(localPrefix) // local modules
	];

	nodePaths.forEach(function(p){
		if (!fs.existsSync(p)) return;

		p = fs.realpathSync(p);
		
		fs.readdirSync(p).forEach(function(f){
			if (f.search('ngen-') === 0) {
				packages.push(path.join(p,f));
			}
		});
	});

	packages = packages.map(function(p){
		return new Package(p);
	});
	
	return packages;
};

module.exports = Package;