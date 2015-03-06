var Season = Parse.Object.extend("season");
var Prediktion = Parse.Object.extend("prediktion");

exports.listSeasons = function(req, res) {
	console.log("Routing for /");
    if (Parse.User.current()) {
        console.log("...We have a Parse user!!!");
        // No need to fetch the current user for querying Note objects.

        var query = new Parse.Query(Season);
        query.find().then(function (results) {
            console.log(results);
            res.render('_listSeasons.ejs', {
                seasons : results,
				leaderboard : true
            });
        },
            function (error) {
            // Render error page.
            res.render('error.ejs');
        });
    } else {
        console.log("...We dont have a Parse user!!!");
        // Render a public welcome page, with a link to the '/login' endpoint.
        res.render('defaultPage.ejs');
    }
};

exports.seasonLeaderBoard = function(req, res) {
		res.render('comingsoon.ejs');
};