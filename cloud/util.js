var moment = require('moment');

exports.getDateAsStringAsStoredInParse = function (time) {
    //2015-03-29T14:30:00+1100
    return moment(time).format('YYYY-MM-DD');
};