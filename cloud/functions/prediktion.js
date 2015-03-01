var Prediktion = Parse.Object.extend("prediktion");

Parse.Cloud.beforeSave("prediktion", function(request, response) {
		
	var usersPrediktionsQuery = new Parse.Query(Prediktion);
	usersPrediktionsQuery.equalTo("user", req.user);
	usersPrediktionsQuery.equalTo("match", req.object.get("match"));
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