// this is an optional global configuration option for your <%= name %> generator
module.exports = {
	newConfig : {
		_ : {
			ignore: ['.DS_Store'],
			createDir: false
		}
	},

	newGenerator : {
		_ : {
			ignore: ['.DS_Store'],
			createDir: false,
			path : 'node_modules/ngen-[name]/'	
		},
	}
}