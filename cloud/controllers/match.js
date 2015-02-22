
var moment = require('moment');
var _ = require('underscore');

var Season = Parse.Object.extend("season");
var Match = Parse.Object.extend("match");
var Team = Parse.Object.extend("team");

//Displays today's matches
exports.list = function (req, res) {
    if (Parse.User.current()) {
        console.log("...We have a Parse user!!!");
        // No need to fetch the current user for querying Note objects.

        var matchesQuery = new Parse.Query(Match);

        var season = new Season();
        season.id = req.params.seasonId;
        //matchesQuery.equalTo("season", season);
        
		matchesQuery.startsWith('matchDate', getDateAsStringAsStoredInParse(new Date()));
		matchesQuery.include("season");
		//matchesQuery.include(["season.name"]);

        matchesQuery.find().then(function (matches) {
			console.log(matches);
			for(var i=0; i < matches.length; i++){
				var season = matches[i].get("season");
				console.log(season);
				//console.log(matches[i].get("season.name"));
			}
			res.render('matches.ejs', {
				matches : matches
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
			aMatch.set("parent", aSeason); //One Season has Many Matches
		
			var relation = aMatch.relation("playingteams");
			relation.add(aTeam);
			relation.add(bTeam);
			
			return aMatch.save();
		}).then(function(obj){
			console.log("Everything done to add a dummy match");
		});
};

var getDateAsStringAsStoredInParse = function (time) {
    //2015-03-29T14:30:00+1100
    return moment(time).format('YYYY-MM-DD');
};
