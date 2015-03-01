var Prediktion = Parse.Object.extend("prediktion");

Parse.Cloud.beforeSave("prediktion", function(request, response) {

	var match = request.object.get("match");
	var matchState = match.get("matchState");
	
	if ( matchState === "C") {
			response.error("111: Cannot add prediktion for a Completed match.");
	} 
	
	//ToDo: Allow saving a prediktion only if currTime < matchStarttime
	
	var usersPrediktionsQuery = new Parse.Query(Prediktion);
	usersPrediktionsQuery.equalTo("user", request.user);
	usersPrediktionsQuery.equalTo("match", match);
	usersPrediktionsQuery.include("match");
	
	
	usersPrediktionsQuery.find().then(
	function(foundPred){
			if(foundPred.length > 0){
				response.error("102: An existing prediktion for this match found.");
			} else {
				response.success();
			}
	},
	function(error){
		console.log(error);
		response.error("101: Error when trying to find prediktions.");
	}
	);
});