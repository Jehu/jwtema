var util = require('util')
    ,models = require('../models')
    ,everyauth = require('everyauth')
    ;

exports.findOrCreateByGoogleData = function(googleUserData, accessToken, accessTokenSecret, promise) {
  models.User.findOne({ email: googleUserData.email }, function(err, doc) {
    if (err) {
      promise.fail(err);
      return;
    }
    if (doc) {
      var user = doc.toObject();
      console.log('user exists: ' + util.inspect(user));
          everyauth.everymodule.findUserById(function (userId, callback) {
              callback(err, doc);
          });
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
              everyauth.everymodule.findUserById(function (userId, callback) {
                  callback(err, doc);
              });
              promise.fulfill(doc);
          }
      });
    }
  });
}
