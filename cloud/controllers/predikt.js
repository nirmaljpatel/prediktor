var moment = require('moment');
var _ = require('underscore');

var Season = Parse.Object.extend("season");
var Match = Parse.Object.extend("match");
var Team = Parse.Object.extend("team");
var Prediktion = Parse.Object.extend("prediktion");

//Save a prediktion
exports.save = function (req, res) {
    console.log("Saving a Prediktion.");
    if (Parse.User.current()) {
        console.log("...We have a Parse user!!!");
		
		console.log(req.body.winner);
		if(req.body.winner === undefined) {
			res.send(500, "Hello Prediktor... You forgot to select your team... Now go back.");
		}
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
			res.send(500, 'Failed saving prediktion:'+ error.message);
		});        
    } else {
        console.log("...We dont have a Parse user!!!");
        // Render a public welcome page, with a link to the '/login' endpoint.
        res.render('defaultPage.ejs');
    }
};

exports.delete = function (req, res) {
	console.log("Deleting a Prediktion");
	if(Parse.User.current()) {
		console.log("...We have a Parse user!!!");
		
		var prediktion = new Prediktion();
		prediktion.id = req.params.predId;
		
		prediktion.destroy({
			success: function(myObject) {
				// The object was deleted from the Parse Cloud.
				res.redirect('/user');
			},
			error: function(myObject, error) {
				console.log(error);
				res.send(500, 'Failed to delete prediktion.');
			}
		});
		
	} else {
		console.log("...We dont have a Parse user!!!");
		// Render a public welcome page, with a link to the '/login' endpoint.
		res.render('defaultPage.ejs');
	}
};