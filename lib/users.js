var util = require('util')
    ,models = require('../models')
    ;

exports.findOrCreateByGoogleData = function(googleUserData, accessToken, accessTokenSecret, promise) {
  models.User.findOne({ id: googleUserData.email }, function(err, doc) {
    if (err) {
      promise.fail(err);
      return;
    }
    if (doc) {
      var user = doc.toObject();
      console.log('user exists: ' + util.inspect(user));
      promise.fulfill(user);
    } else {
      var newUser = new models.User({
        accessToken: accessToken,
        accessTokenSecret: accessTokenSecret,
        email: googleUserData.email,
        id: googleUserData.email
      });
      newUser.save(function(err, doc) {
          if(err) {
              promise.fail(err);
              return;
          }
          else {
              promise.fulfill(doc);
          }
      });
    }
  });
}
