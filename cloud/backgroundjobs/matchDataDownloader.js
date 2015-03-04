
var _ = require('underscore');
var moment = require('moment');

var util = require('cloud/util.js');

var Match = Parse.Object.extend("match");
var Prediktion = Parse.Object.extend("prediktion");

var iccMatchDataUrl = "http://cdn.pulselive.com/dynamic/data/core/cricket/2012/cwc-2015/matchSchedule2.js";


Parse.Cloud.job("matchDataDownloader", function(request, status) {
	status.message("MatchDataDownloader Background Job Started...");
	
	fetchMatchData().then(function(jsonObj){
			console.log("Then... updateWCSchedule()");
			console.log(jsonObj);
			updateWCSchedule(jsonObj);
	}).then(function(){
		console.log("Then... updateScores()");
		//Somehow the following does not work when I put the block in a function
		var yesterday = moment().subtract('days', 1);
		console.log(yesterday);
		var matchQuery = new Parse.Query(Match);
		matchQuery.startsWith('matchDate', util.getDateAsStringAsStoredInParse(yesterday));
		
		var prediktionQuery = new Parse.Query(Prediktion);
		prediktionQuery.matchesKeyInQuery("match", "objectId", matchQuery);
		prediktionQuery.include("match");
		prediktionQuery.include("winner");
		
		var promises = [];
		return prediktionQuery.find().then(function(yesterdaysPrediktions){
			_.each(yesterdaysPrediktions, function(prediktion){
				var matchWinner = getWinnerTeamId(prediktion.get("match"));
				var points = 0;
				if(prediktion.get("winner").get("teamId") === matchWinner){
						points = 10;
				}
				prediktion.set("score", points);
				promises.push( prediktion.save(null, { useMasterKey: true }));
			});
			return Parse.Promise.when(promises);
		});
	}).then(function(){
			console.log("Then... set success.");
			status.success("MatchDataDownloader completed successfully at: " +new Date());
	},function(error){
			status.error("MatchDataDownloader Failed: " + error);
	});
});

var getWinnerTeamId = function (match) {
		//matchStatus format: {"outcome":"A","text":"Pakistan won by 20 runs"}
		var winner;
		var matchStatus = match.get("matchStatus");
		//console.log(matchStatus);
		if(matchStatus !== null && matchStatus.outcome === "A"){
				//console.log("...A");
				winner =  match.get("team1");
		}else if(matchStatus !== null && matchStatus.outcome === "B"){
				//console.log("...B");
				winner = match.get("team2");
		}
		return winner;
}

var updateScores = function() {
	
	
};

//Validates passed in string matches response expected.
var removeJsonP = function(response) {
		var expectedStart = 'onMatchSchedule(';
		var expectedEnd = ');';
		var jsonStr = response.substring(expectedStart.length, response.length - expectedEnd.length);
		
		return JSON.parse(jsonStr);
};
var fetchMatchData = function(){
	var promise = new Parse.Promise();

	Parse.Cloud.httpRequest({
		url: iccMatchDataUrl,
		success: function(httpResponse) {
			//console.log(httpResponse.text);
			jsonObj = removeJsonP(httpResponse.text);
			promise.resolve(jsonObj);
		},
		error: function(httpResponse) {
			promise.reject("Request failed with response code: " + httpResponse.status);
		}
	});
	return promise;
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
		console.log("["+i+"]: ", match);
		
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
		if (_.find(venues, function(venue){return venue.venueId === venueData.venueId;}) == null) {
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
			if (_.find(teams, function(team){return team.teamId === teamData.teamId;}) == null) {
				teams.push(teamData);
			}
		}
		if (match.team2 !== undefined) {
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
			if (_.find(teams, function(team){return team.teamId === teamData.teamId;}) == null) {
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