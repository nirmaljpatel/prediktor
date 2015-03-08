var moment = require('moment');

var Prediktion = Parse.Object.extend("prediktion");

Parse.Cloud.beforeSave("prediktion", function(request, response) {

	var match = request.object.get("match");
	
	if(isScoreUpdate) {
			response.success();
	}
	
	match.fetch().then(function(){
	
		var matchState = match.get("matchState");
		
		if ( matchState === "C") {
				response.error("103: Cannot add prediktion for a Completed match.");
		} else if(hasMatchStarted(match)) {
				response.error("104: Cannot add prediktion for a match after its start time.");
		}
		
		
		//ToDo: Allow saving a prediktion only if currTime < matchStartTime
		
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
		});
	},
	function(error){
		console.log(error);
		response.error("101: Error when trying to find prediktions.");
	});
});

Parse.Cloud.beforeDelete("prediktion", function(request, response){
	var match = request.object.get("match");
	
	match.fetch().then(function(){
		var matchState = match.get("matchState");
		
		if ( matchState === "C") {
			console.log("111: Cannot delete prediktion for a Completed match.");
			response.error("111: Cannot delete prediktion for a Completed match.");
		} else if(hasMatchStarted(match)) {
			console.log("104: Cannot delete prediktion for a match after its start time.");
			response.error("104: Cannot delete prediktion for a match after its start time.");
		} else {
			response.success();
		}
	},
	function(error){
		console.log(error);
		response.error("101: Error when trying to deleting prediktion." + error.message);
	});
});

var hasMatchStarted = function(match) {
		var now = moment();
		console.log(now.format());
		
		var matchDate = match.get("matchDate");
		var matchMoment = moment(matchDate);
		
		now.zone(matchDate);
		console.log(matchMoment.format());
		console.log(now > matchMoment);
		
		
		return now > matchMoment;
};

var isScoreUpdate = function(req) {
		var dirtyKeys = req.object.dirtyKeys();
		//console.log(dirtyKeys);
		return (dirtyKeys.length === 1) && dirtyKey[0] === "score";
};