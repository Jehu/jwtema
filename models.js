var mongoose = require('mongoose')
    ,conf = require('./conf')
    ,Schema = mongoose.Schema
    ,ObjectId = mongoose.SchemaTypes.ObjectId;

var schema = exports;

// Schema definitions
schema.Territory = new Schema({
  ident: { type: String },
  language: { type: String },
  population: { type: String },
  city: { type: String },
  country: { type: String },
  state: { type: String },
  map_url: { type: String },
  map_image: { type: String },
  last_processed_at: { type: Date },
  status_changed_at: { type: Date },
  note: { type: String },
  contact: { type: Schema.ObjectId, ref: 'Contact' },
  streets: [schema.Street],
  donotvisit: [schema.DoNotVisit],
  history: [schema.TerritoryHistory],
  deleted: { type: Boolean, 'default': true },
  user_id: String
});

schema.Contact = new Schema({
  'name': String,
  phone: String,
  email: String,
  note: String,
  active: { type: Boolean, 'default': true },
  assembly: String,
  user_id: String
});

schema.Street = new Schema({
  'name': String,
  numbers_even: { type: Boolean, 'default': true },
  numbers_odd: { type: Boolean, 'default': true },
  numbers_range: String,
  user_id: String
});

schema.DoNotVisit = new Schema({
  'name': String,
  number: String,
  date: Date,
  street: String,
  user_id: String
})

schema.TerritoryHistory = new Schema({
  created_at: { type: Date, 'default': Date.now },
  event_text: String,
  event_type: { type: String, 'enum': ['GIVEN','GET_BACK','EDITED','PROCESSED'] },
  user_id: String
});

schema.User = new Schema({
  created_at: { type: Date, 'default': Date.now },
  email: { type: String, index: { unique: true }},
  id: { type: String, index: { unique: true }},
  name: String,
  assembly: String,
  phone: String,
  active: { type: Boolean, 'default': true },
  accessToken: String,
  accessTokenSecret: String
});

mongoose.connect(conf.mongodb);

var Teritory = mongoose.model('Territory', schema.Territory);
exports.Territory = mongoose.model('Territory');

var TeritoryHistory = mongoose.model('TerritoryHistory', schema.TerritoryHistory);
exports.TerritoryHistory = mongoose.model('TerritoryHistory');

var Contact = mongoose.model('Contact', schema.Contact);
exports.Contact = mongoose.model('Contact');

var Street = mongoose.model('Street', schema.Street);
exports.Street = mongoose.model('Street');

var DoNotVisit = mongoose.model('DoNotVisit', schema.DoNotVisit);
exports.DoNotVisit = mongoose.model('DoNotVisit');

var User = mongoose.model('User', schema.User);
exports.User = mongoose.model('User');
