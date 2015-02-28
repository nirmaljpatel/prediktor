var moment = require('moment');
var _ = require('underscore');

var Season = Parse.Object.extend("season");
var Match = Parse.Object.extend("match");
var Team = Parse.Object.extend("team");
var Prediktion = Parse.Object.extend("prediktion");

//Save a prediktion
exports.save = function (req, res) {
    console.log("Routing for /");
    if (Parse.User.current()) {
        console.log("...We have a Parse user!!!");
        // No need to fetch the current user for querying Note objects.
		
		var prediktion = new Prediktion();
	
		var match = new Match();
		match.id = req.params.matchId;
		prediktion.set('match', match);
		
		prediktion.set('user', Parse.User.current());
		
		var winner = new Team();
		winner.id = req.body.winner;
		prediktion.set('winner', winner);
		//console.log(req.body);
		
		
		prediktion.save().then(function(savedPrediktion){
				var relation = match.relation("prediktions");
				relation.add(savedPrediktion);
				return match.save();
		}).then(function(savedMatch){
			console.log(savedMatch);
			res.redirect('/seasons/' + req.params.seasonId);
		}, function(error){
			console.log(error);
			res.send(500, 'Failed saving prediktion.');
		});        
    } else {
        console.log("...We dont have a Parse user!!!");
        // Render a public welcome page, with a link to the '/login' endpoint.
        res.render('defaultPage.ejs');
    }
};