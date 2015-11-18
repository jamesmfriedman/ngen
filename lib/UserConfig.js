var path = require('path');
var fs = require('fs');

var UserConfig = function() {
	var userConfigPath = path.join(process.cwd(), 'ngen.config.js');
	var userConfig = {};

	if (fs.existsSync(userConfigPath)) {
		userConfig = require(userConfigPath);
	}

	return userConfig;
};

module.exports = UserConfig;