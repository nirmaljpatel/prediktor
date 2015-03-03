
var moment = require('moment');
var _ = require('underscore');

var Season = Parse.Object.extend("season");
var Match = Parse.Object.extend("match");
var Team = Parse.Object.extend("team");
var Prediktion = Parse.Object.extend("prediktion");

//Displays today's matches
exports.list = function (req, res) {
    if (Parse.User.current()) {
        console.log("...We have a Parse user!!!");
        // No need to fetch the current user for querying Note objects.

        var matchQuery = new Parse.Query(Match);

        var season = new Season();
        season.id = req.params.seasonId;
        matchQuery.equalTo("season", season);
        
		var tomorrow = moment().add('days', 1);
		
		console.log(tomorrow);
		

		matchQuery.startsWith('matchDate', getDateAsStringAsStoredInParse(tomorrow));
		matchQuery.include("playingTeams");
		matchQuery.include("venue");
		//matchQuery.include("prediktions");
		
		var usersPrediktionsQuery = new Parse.Query(Prediktion);
		usersPrediktionsQuery.equalTo("user", Parse.User.current());
		//usersPrediktionsQuery.containedIn("match", poMatches);
		//usersPrediktionsQuery.include("match");
		
		//matchQuery.matchesQuery( "prediktions", usersPrediktionsQuery);

		var promises = [];
		var todaysMatches;
        matchQuery.find().then(function (poMatches) {
				todaysMatches = poMatches;
				_.each(poMatches, function(match){
					var usersPrediktionsQuery = new Parse.Query(Prediktion);
					usersPrediktionsQuery.equalTo("user", Parse.User.current());
					usersPrediktionsQuery.equalTo("match", match);
					usersPrediktionsQuery.include("match");
					
					promises.push(usersPrediktionsQuery.first());
				});
				return Parse.Promise.when(promises);
		}).then(function(){
				var usersPrediktions = Array.prototype.slice.call(arguments);
				//console.log(todaysMatches);
				console.log(usersPrediktions);
				res.render('matches.ejs', {
					fordate: matchesForDate.format("MMM Do YYYY"),
					matches : todaysMatches,
					season: season,
					prediktions: usersPrediktions
				});
        },
        function (error) {
				console.log(error);
            // Render error page.
            res.render('error.ejs');
        });
    } else {
        console.log("...We dont have a Parse user!!!");
        // Render a public welcome page, with a link to the '/login' endpoint.
        res.render('defaultPage.ejs');
    }
};
var findMyMatchPrediktions = function(match){
		var promise = new Parse.Promise();
		
		var predikQuery = new Parse.Query(Prediktion);
		predikQuery.equalTo("user", Parse.User.current());
		predikQuery.equalTo("match", match);
	
		predikQuery.find().then(function(prediktion){
				match.prediktion = prediktion;
				promise.resolve();
		});
		
		return promise;
};
//Creates a dummy match data
exports.create = function(req, res){
		var aSeason = new Season();
		var aTeam = new Team();
		var bTeam = new Team();
		aSeason.set("name", "dummySeason-"+req.params.name);
		aSeason.save().then(function(obj){
			aTeam.set("name", "dummyATeam-"+req.params.name);
			return aTeam.save();
		}).then(function(obj){
			bTeam.set("name", "dummyBTeam-"+req.params.name);
			return bTeam.save();
		}).then(function(obj){
			var aMatch = new Match();
			aMatch.set("name", "dummyMatch-"+req.params.name);
			aMatch.set("matchDate", getDateAsStringAsStoredInParse(new Date()));
			aMatch.set("season", aSeason); //One Season has Many Matches
		
			/*** Parse Relation *** 
			var relation = aMatch.relation("playingteams");
			relation.add(aTeam);
			relation.add(bTeam);
			
			*** Parse Realtion ***/
			
			/*** Array of Parse Objects ***/
			var playingTeams = [aTeam, bTeam];
			aMatch.set("playingTeams", playingTeams);
			/*** Array of Parse Objects */
			
			return aMatch.save();
		}).then(function(obj){
			console.log("Everything done to add a dummy match");
		});
};

var getDateAsStringAsStoredInParse = function (time) {
    //2015-03-29T14:30:00+1100
    return moment(time).format('YYYY-MM-DD');
};
