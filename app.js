var express = require('express')
   ,conf = require('./conf')
   ,everyauth = require('everyauth')
   ,Promise = everyauth.Promise
   ,mongoose = require('mongoose')
   ,users = require('./lib/users')
   ,util = require('util')
   ,models = require('./models')
   ,RedisStore = require('connect-redis')(express)
   ,port = conf.port
   ;

var app = module.exports = express.createServer();
everyauth.google
  .myHostname(conf.baseurl)
  .appId(conf.google.clientId)
  .appSecret(conf.google.clientSecret)
  .scope('https://www.googleapis.com/auth/userinfo.email')
  .handleAuthCallbackError( function (req, res) {})
  .findOrCreateUser( function (sess, accessToken, accessTokenSecret, googleUserData) {
      var promise = this.Promise();
      users.findOrCreateByGoogleData(googleUserData, accessToken, accessTokenSecret, promise);
      return promise;
  })
  .redirectPath('/');

// Configuration
app.configure(function(){
  app.set('views', __dirname + '/frontend/themes/01');
  app.set('view engine', 'jade');
  //app.set('view engine', 'ejs');
  app.use(express.bodyParser());
  app.use(express.cookieParser());
  app.use(express.session({ secret: conf.session_secret }));
  //app.use(express.session({ secret: conf.session_secret, store: new RedisStore }));
  app.use(everyauth.middleware());
  app.use(app.router);
  app.use(express.static(__dirname + '/frontend'));
});

app.register('.html', require('ejs'));
//app.register('.html', require('jade'));
app.configure('development', function(){
  app.use(express.errorHandler({ dumpExceptions: true, showStack: true }));
});

app.configure('production', function(){
  app.use(express.errorHandler());
});


// Routes
app.get('/', function(req, res) {
  if(!req.loggedIn) {
    res.redirect(conf.baseurl + '/login');
    return;
  }
  res.render('index.html', {
    title: 'JWTeMa - Terrirory Manager'
    ,projectname: 'JWTeMa - Territory Manager'
    ,pagename: 'Hello!'
    ,tagline: '... zur online Gebietsverwaltung'
    ,nav: {
        text: {
            start: 'Start'
            ,territories: 'Gebiete'
            ,contacts: 'Kontakte'
            ,stats: 'Statistik'
        }
    }
  });
});

app.get('/login', function(req, res) {
    res.render('login.html', { 
        layout: false
        ,projectname: 'JWTeMa - Territory Manager'
        ,pagename: 'Login'
        ,tagline: '... zur online Gebietsverwaltung'
        ,nav: {
            text: {
                home: 'Start'
                ,about: 'Über uns'
                ,contact: 'Kontakt'
                ,what: 'Was ist das?'
            }
        }
    });
});

app.get('/territories', function(req, res) {
    if(!req.loggedIn) {
        res.send({success: false, message: 'Please login first'});
        return;
    }
    models.Territory.find({ user_id: req.user._id }).populate('contact').sort('ident','ascending').run(function(err, docs) {
        if(err) {
            res.send({success: false, message: err.message});
        }
        else {
            var data = docs.map(function(d) {
                return d.toObject();
            });
            res.send(data);
        }
    });
});

app.post('/territories', function(req, res) {
    if(!req.loggedIn) {
        res.send({success: false, message: 'Please login first'});
        return;
    }
    var data = req.body;
    data.user_id = req.user._id;
    var newDoc = new models.Territory(data);
    newDoc.save(function(err, doc) {
        if(err) {
            res.send({'success': false, 'message': err.message});
        }
        else {
            res.send(doc.toObject());
        }
    });
});

app.put('/territories/:id', function(req,res) {
    if(!req.loggedIn) {
        res.send({success: false, message: 'Please login first'});
        return;
    }
    var updatedData = req.body;
    var territory_id = updatedData._id;
    delete(updatedData._id);
    delete(updatedData.contact);
    delete(updatedData.history);

    models.Territory.update({ _id: req.params.id }, updatedData, function(err) {
        if(err) {
            res.send({'success':false, 'message': err.message});
        }
        else {
            res.send(req.body);
        }
    });
});

app.put('/territories/:id/give', function(req,res) {
    if(!req.loggedIn) {
        res.send({success: false, message: 'Please login first'});
        return;
    }
    var updatedData = req.body;
    var territory_id = updatedData._id;
    var date = req.query.date;
    var contact = req.body.contact;

    delete(updatedData._id);

    if(updatedData.contact && updatedData.contact._id) {
        updatedData.contact = updatedData.contact._id;
    }
    else {
        res.send({'success': false, 'message': 'No contact given!'});
        return;
    }


    var log = new models.TerritoryHistory();
    log.event_text = 'Given to ' + contact.name + ' on ' + date; // FIXME i18n
    log.event_type = 'GIVEN';

    models.Territory.update({ _id: req.params.id }, updatedData, function(err) {
        if(err) {
            res.send({'success':false, 'message': err.message});
        }
        else {
            models.Territory.findById(territory_id, function (err, doc) {
                if (!err) {
                    doc.history.push(log);
                    doc.save(function (err) {
                        // do something
                    });
                }
            });
            res.send({success: true, message: log.event_text});
        }
    });
});

app.put('/territories/:id/getback', function(req,res) {
    if(!req.loggedIn) {
        res.send({success: false, message: 'Please login first'});
        return;
    }
    territoryGetBack(req, function(result) {
        if(result.success) {
            res.send(result);
        }
        else {
            res.send(result);
        }
    });
});

app.put('/territories/:id/processed', function(req,res){
    if(!req.loggedIn) {
        res.send({success: false, message: 'Please login first'});
        return;
    }
    var date = req.query.date;

    var log = new models.TerritoryHistory();
    log.event_text = 'Processed from ' + req.body.contact.name + ' on ' + date; // FIXME i18n
    log.event_type = 'PROCESSED';

    models.Territory.update(
        { _id: req.params.id },
        {
            'last_processed_at': req.body.last_processed_at
        },
        function(err) {
            if(err) {
                res.send({'success':false, 'message': err.message});
            }
            else {
                models.Territory.findById(req.params.id, function (err, doc) {
                    if (!err) {
                        doc.history.push(log);
                        doc.save(function (err) {
                            // do something
                        });
                    }
                });
                res.send({'success': true, 'message': log.event_text }); // FIXME i18n
            }
    });
});

app.del('/territories/:id', function(req,res) {
    if(!req.loggedIn) {
        res.send({success: false, message: 'Please login first'});
        return;
    }
    models.Territory.remove({ _id: req.params.id }, function(err) {
        if(err) {
            res.send({'success':false, 'message': err.message});
        }
        else {
            res.send(req.body);
        }
    });
});


app.get('/contacts', function(req, res) {
    if(!req.loggedIn) {
        res.send({success: false, message: 'Please login first'});
        return;
    }
    models.Contact.find({ user_id: req.user._id }).populate('territories').sort('name','ascending').run(function(err, docs) {
        if(err) {
            res.send({success: false, message: err.message});
        }
        else {
            var data = docs.map(function(d) {
                return d.toObject();
            });
            res.send(data);
        }
    });
});

app.post('/contacts', function(req, res) {
    if(!req.loggedIn) {
        res.send({success: false, message: 'Please login first'});
        return;
    }
    var newDoc = new models.Contact(req.body);
    newDoc.user_id = req.user._id;
    newDoc.save(function(err, doc) {
        if(err) {
            res.send({'success': false, 'message': err.message});
        }
        else {
            res.send(doc.toObject());
        }
    });
});

app.put('/contacts/:id', function(req,res) {
    if(!req.loggedIn) {
        res.send({success: false, message: 'Please login first'});
        return;
    }
    var updatedData = req.body;
    delete(updatedData._id);

    models.Contact.update({ _id: req.params.id }, updatedData, function(err) {
        if(err) {
            res.send({'success':false, 'message': err.message});
        }
        else {
            res.send(req.body);
        }
    });
});

app.del('/contacts/:id', function(req,res) {
    if(!req.loggedIn) {
        res.send({success: false, message: 'Please login first'});
        return;
    }
    models.Contact.remove({ _id: req.params.id }, function(err) {
        if(err) {
            res.send({'success':false, 'message': err.message});
        }
        else {
            res.send(req.body);
        }
    });
});

var territoryGetBack = function(req, cb) {
    if(!req.loggedIn) {
        cb({success: false, message: 'Please login first'});
        return;
    }
    var updatedData = req.body;
    var date = req.query.date;
    var territory_id = updatedData._id;

    delete(updatedData._id);

    models.Territory.update(
        { _id: req.params.id },
        {
            'contact': (updatedData.contact && updatedData.contact._id) ? updatedData.contact._id : null,
            'status_changed_at': req.body.status_changed_at,
            'last_processed_at': req.body.last_processed_at
        },
        function(err) {
            if(err) {
                cb({'success':false, 'message': err.message});
            }
            else {
                var success_text = '';
                models.Territory.findById(territory_id, function (err, doc) {
                    if (!err) {
                        if(req.body.mark_as_processed){
                            var log = new models.TerritoryHistory();
                            log.event_text = 'Processed from ' + updatedData.contact_prev.name + ' on ' + date; // FIXME i18n
                            log.event_type = 'PROCESSED';
                            success_text = 'Marked as processed. ';
                            doc.history.push(log);
                        }

                        var log = new models.TerritoryHistory();
                        log.event_text = 'Get back from ' + updatedData.contact_prev.name + ' on ' + date; // FIXME i18n
                        log.event_type = 'GET_BACK';
                        success_text = success_text + 'Get back from ' + updatedData.contact_prev.name + ' on ' + date;
                        doc.history.push(log);

                        if(req.body.contact.name != undefined) {
                            var log = new models.TerritoryHistory();
                            log.event_text = 'Given to ' + req.body.contact.name + ' on ' + date; // FIXME i18n
                            log.event_type = 'GIVEN';
                            success_text = success_text + ', given to ' + req.body.contact.name;
                            doc.history.push(log);
                        }

                        doc.save(function (err) {
                            // do something
                            if(err) {
                                cb({success: false, message: err.message});
                            }
                        });

                        cb({success: true, message: success_text});
                    }
                    else {
                        cb({success: false, message: err.message});
                    }
                });
            }
        }
    );
};

everyauth.helpExpress(app);

// Only listen on $ node app.js
if (!module.parent) {
  app.listen(port);
  console.log("Express server listening on port %d", app.address().port);
}

