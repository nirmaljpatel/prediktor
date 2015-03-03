var moment = require('moment');

var Prediktion = Parse.Object.extend("match");

Parse.Cloud.beforeSave("match", function(request, response) {

	console.log("Before saving match:");
	console.log(request.object);
	
	//ToDo: Update match object with team arrays. This is for auto updating teams for matches beyond pool matches.
});