
var _ = require('underscore');
var Match = Parse.Object.extend("match");

var iccMatchDataUrl = "http://cdn.pulselive.com/dynamic/data/core/cricket/2012/cwc-2015/matchSchedule2.js";


Parse.Cloud.job("matchDataDownloader", function(request, status) {
	console.log("MatchDataDownloader Background Job Started...");
		
	Parse.Cloud.httpRequest({
		url: iccMatchDataUrl,
		success: function(httpResponse) {
			//console.log(httpResponse.text);
			jsonObj = removeJsonP(httpResponse.text);
			updateWCSchedule(jsonObj).then(function(){
					console.log("Looks like everything worked... calling status.success");
					status.success("Match data updated successfully at: " +new Date());
			}
			);
		},
		error: function(httpResponse) {
			// Set the job's error status
			status.error("Request failed with response code ' + httpResponse.status");
		}
	});
});

//Validates passed in string matches response expected.
//Sort of protection since we use eval()
var removeJsonP = function(response) {
		var expectedStart = 'onMatchSchedule(';
		var expectedEnd = ');';
		var jsonStr = response.substring(expectedStart.length, response.length - expectedEnd.length);
		
		return JSON.parse(jsonStr);
};

var updateWCSchedule = function(scheduleJson) {
	//console.log(scheduleJson);
		
	var wc = {
		tournamentId : scheduleJson.tournamentId.id,
		tournamentName : scheduleJson.tournamentId.name,
		schedule : scheduleJson.schedule
	};
	var seasonObj = {
		icc_id : wc.tournamentId,
		name : wc.tournamentName
	};
	
	var totalMatches = wc.schedule.length;
	var venues = [];
	var teams = [];
	var matches = [];
	
	for (var i = 0; i < totalMatches; i++) {
		var match = wc.schedule[i];
		//console.log("["+i+"]: ", match);
		
		var matchData = {
			matchId : match.matchId.id,
			matchName : match.matchId.name,
			matchType : match.matchType,
			description : match.description,
			venueId : match.venue.id,
			matchDate : match.matchDate,
			groupName : match.groupName,
			team1 : match.team1 ? match.team1.team.id : null,
			team2 : match.team2 ? match.team2.team.id : null,
			matchState : match.matchState,
			matchStatus : match.matchState !== "U" ? match.matchStatus : null,
			reportLink : match.matchState !== "U" ? match.reportLink : null
		};
		if (_.find(matches, function(match){return match.matchId === matchData.matchId;}) == null) {
			matches.push(matchData);
		}
		
		var venue = match.venue;
		var venueData = {
			venueId : venue.id,
			country : venue.country,
			fullName : venue.fullName,
			shortName : venue.shortName,
			city : venue.city
		};
		if (_.where(venues, venueData) == null) {
			venues.push(venueData);
		}
		if (match.team1 !== undefined) {
			var team = match.team1.team;
			var teamData = {
				type : team.type,
				fullName : team.fullName,
				shortName : team.shortName,
				abbrv : team.abbreviation,
				primaryColor : team.primaryColor,
				secondaryColor : team.secondaryColor,
				teamId : team.id
			};
			if (_.where(teams, teamData) == null) {
				teams.push(teamData);
			}
			team = match.team2.team;
			teamData = {
				type : team.type,
				fullName : team.fullName,
				shortName : team.shortName,
				abbrv : team.abbreviation,
				primaryColor : team.primaryColor,
				secondaryColor : team.secondaryColor,
				teamId : team.id
			};
			if (_.where(teams, teamData) == null) {
				teams.push(teamData);
			}
		}
	}
	console.log("Finished parsing the JSON from ICC Site.");
	//console.log(matches);
	var updatePromises = [];
	
	matches.forEach(function(match){
			var matchQuery = new Parse.Query(Match);
			matchQuery.equalTo("matchId", match.matchId);
			
			updatePromises.push(
				matchQuery.find().then(function(result){
						var matchPO = result[0]; //We are "dangerously??" assuming we will find the match
						matchPO.set("team1", match.team1);
						matchPO.set("team2", match.team2);
						matchPO.set("matchState", match.matchState);
						matchPO.set("matchStatus", match.matchStatus);
						return matchPO.save();
					}));
	});
	
	return Parse.Promise.when(updatePromises);
};