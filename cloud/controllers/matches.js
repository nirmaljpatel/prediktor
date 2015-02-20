
var seasons = Parse.Object.extend("Seasons");
var matches = Parse.Object.extend("Matches");

exports.list = function (req, res, next) {
    console.log("Routing for /seasons/id:", req.params.seasonId);
	console.log("...req:", req);
	
    if (Parse.User.current()) {
        console.log("...We have a Parse user!!!");
        // No need to fetch the current user for querying Note objects.

        var query = new Parse.Query(matches);

        var season = new seasons();
        season.id = req.param.seasonId;
        query.equalTo("season", season);

        query.find().then(function (matches) {
            console.log(matches);
            res.render('matches.ejs', {
                matches : matches
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
