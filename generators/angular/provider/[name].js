angular.module('<%= name.camelCase %>').provider('<%= name.raw %>', function() {
	this.$get = function () {
		return new Object();
	};
});