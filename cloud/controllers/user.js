var Prediktion = Parse.Object.extend("prediktion");

exports.list = function(req, res) {
	if (Parse.User.current()) {
		var theUser = Parse.User.current();
		
		var userData;
		theUser.fetch().then(function(userDetails){
			userData = userDetails;
			var usersPrediktionsQuery = new Parse.Query(Prediktion);
			usersPrediktionsQuery.equalTo("user", Parse.User.current());
			usersPrediktionsQuery.include("match");
			
			return usersPrediktionsQuery.find();
		}).then(function(usersPrediktions){
			res.render('me/myprofile.ejs', {
				user: userData,
				prediktions: usersPrediktions
			});
		});
	} else {
        console.log("...We dont have a Parse user!!!");
        // Render a public welcome page, with a link to the '/login' endpoint.
        res.render('defaultPage.ejs'); 
    }
};