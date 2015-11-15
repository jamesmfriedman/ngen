angular.module('<%= module || name.camelCase %>').directive('<%= name.camelCase %>', function() {
	return 'E',
	templateUrl: '<%= templatePath %><%= name.camelCase %>.html',
	link: function(scope, el, attrs) {

	},
	controller: function($scope) {

	}
});