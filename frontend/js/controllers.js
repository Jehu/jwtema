/* App Controllers */

/**
 * Contacts List
 */
function ContactsListCtrl($xhr,$defer,$location,globalObjects,ResContacts) {
    var self = this;
    self.contacts =  [];

    self.$root.pagename = angular.filter.i18n('Contacts');

    self.message = globalObjects.notification;
    globalObjects.notification = {};

    ResContacts.list(function(res) {
        self.contacts = res;
        var tblColumns = [
            null,
            null,
            null,
            null,
            { "bSearchable": false, "bSortable": false },
            { "sType": "string" },
            { "bSearchable": false, "bSortable": false }
        ];
        self.$eval();
        jQuery('#table-contacts').dataTable( {
            "bJQueryUI": true,
            //"aLengthMenu": [[-1, 25, 50, 100], ["All", 25, 50, 100]],
            "bPaginate": false,
            "aoColumns": tblColumns,
            "bDestroy": true
        });
    });

    self.editContact = function(contact) {
        // set seleteced territory in global service
        globalObjects.selectedContact = contact;
        // now route to edit maksk
        $location.updateHash('/contacts/edit');
        self.$eval();
    }
}
ContactsListCtrl.$inject = ['$xhr','$defer','$location','globalObjects','ResContacts']

/**
 * Contact Edit
 */
function ContactEditCtrl($location, globalObjects, ResContacts, ResTerritories) {
    self = this;
    self.contact = globalObjects.selectedContact;

    self.$root.pagename = angular.filter.i18n('Edit Contact');

    self.saveContact = function(contact) {
        if(!self.contact._id) {
            ResContacts.save(contact, function() {
                globalObjects.notification = {
                    'message': angular.filter.i18n('Added') + ': ' + self.contact.name,
                    'theme' : 'success'
                }
            });
        }
        else {
            ResContacts.update(contact, function() {
                globalObjects.notification = {
                    'message': angular.filter.i18n('Updated') + ': ' + self.contact.name,
                    'theme' : 'success'
                }
            });
        }
        $location.updateHash('/contacts');
    }

    self.deleteContact = function(contact) {
        // FIXME ask user if he want really delete this!

        var hasTerritories = checkHasTerritories(contact, ResTerritories);
        if(Boolean(hasTerritories)) {
            globalObjects.notification = {
                'message': angular.filter.i18n('Publisher %s has some Territories. Please get them back first.',[contact.name]),
                'theme' : 'error'
            }
            $location.updateHash('/contacts');
            return;
        }

        if(!self.contact._id || self.contact._id == 'undefined') {
            self.cancelEdit();
        }
        else {
            ResContacts.remove({id: contact._id}, function() {
                globalObjects.notification = {
                    'message': angular.filter.i18n('Deleted') + ': ' + contact.name,
                    'theme' : 'information'
                }
            });
            $location.updateHash('/contacts');
        }
    }

    self.cancelEdit = function() {
        globalObjects.selectedContact = null;
        globalObjects.notification = {
            'message': angular.filter.i18n('Action cancelled'),
            'theme' : 'success'
        }
        $location.updateHash('/contacts');
    }
};
ContactEditCtrl.$inject = ['$location','globalObjects','ResContacts','ResTerritories']

function jwtemaApp($location, globalObjects) {
    var self = this;
    self.notification = {
        'message': '',
        'theme': 'information'
    };
    self.message = self.notification;
};
jwtemaApp.$inject = ['$location','globalObjects'];

/**
 * Territories List
 */
function TerritoriesListCtrl($xhr, $defer, $resource, $location, globalObjects, ResTerritories) {
    var self = this;

    self.$root.pagename = angular.filter.i18n('Territories');

    self.territories = [];
    self.selectedTerritory = null;
    self.newTerritory = null;
    self.last_processed_at = null;

    self.message = globalObjects.notification;
    self.messages = globalObjects.notifications;
    globalObjects.notification = {};
    globalObjects.notifications = {};

    self.showTerritoryInfo = function(territory) {
        globalObjects.selectedTerritory = territory;
        self.selectedTerritory = territory;
        self.$eval();
    };

    self.hideTerritoryInfo = function() {
        self.selectedTerritory = null;
    };

    self.editTerritory = function(territory) {
        // set seleteced territory in global service
        globalObjects.selectedTerritory = territory;
        // now route to edit maksk
        $location.updateHash('/territories/edit');
        self.$eval();
    }

    self.give = function(territory) {
        globalObjects.selectedTerritory = territory;
        $location.updateHash('/territories/give');
        self.$eval();
    }

    self.getBack = function(territory) {
        globalObjects.selectedTerritory = territory;
        $location.updateHash('/territories/getback');
        self.$eval();
    }

    self.processed  = function(territory) {
        globalObjects.selectedTerritory = territory;
        $location.updateHash('/territories/processed');
        self.$eval();
    }

    ResTerritories.list(function(res) {
        self.territories = res;
        self.$eval();
        var tblColumns = [
            null,
            null,
            null,
            null,
            null,
            { "bSortable": false },
        ];
        var tblConfig = {
            "bJQueryUI": true,
            //"aLengthMenu": [[-1, 25, 50, 100], ["All", 25, 50, 100]],
            "bPaginate": false,
            "aoColumns": tblColumns
        };
        //$("select, input:checkbox, input:text, input:password, input:radio, input:file, textarea").uniform();
        jQuery('#table-territories').dataTable(tblConfig);
    });
}
TerritoriesListCtrl.$inject = ['$xhr','$defer','$resource','$location','globalObjects','ResTerritories'];

/**
 * Territory Edit
 */
function TerritoryEditCtrl($xhr, $resource, $location, globalObjects, ResTerritories) {
    var self = this;
    self.text = null;
    self.message = null;
    self.messages = null;
    self.territory = globalObjects.selectedTerritory;

    self.$root.pagename = angular.filter.i18n('Edit Territory');

    // needed for select fields
    self.countries = [];
    self.states = [];
    self.streets = [];

    ResTerritories.list(function(res){
        var countries = [];
        var states = [];

        angular.forEach(res,function(item) {
            countries.push(item.country);
            states.push(item.state);
        });
        self.countries = uniqueArray(countries);
        self.countries.sort();

        self.states = uniqueArray(states);
        self.states.sort();
    });

    angular.forEach(self.territory.streets, function(street) {
        self.streets.push(street.name);
    });
    self.streets.sort();

    if(self.territory._id) {
        var date = (self.territory.last_processed_at) ? self.territory.last_processed_at.toString(angular.filter.i18n('M/d/yyyy')) : '';
        self.last_processed_at = date;
    }

    self.save = function(territory, redirect) {
        var redirect = redirect || false;
        territory.last_processed_at = self.last_processed_atObj; // date object comes from datepicker widget
        // it's a new entity
        if(!self.territory._id || self.territory._id == 'undefined') {
            ResTerritories.save(territory, function(res) {
                self.territory = res;
                globalObjects.notification = {
                    'message': angular.filter.i18n('Added') + ': ' + self.territory.ident,
                    'theme' : 'success'
                }
            });
        }
        // it's an update
        else {
            ResTerritories.update(territory, function() {
                //globalObjects.notification = {
                self.$root.notification = { // FIXME
                    'message': angular.filter.i18n('Updated') + ': ' + self.territory.ident,
                    'theme' : 'success'
                }
            });
        }
        if(redirect) {
            $location.updateHash('/territories');
        }
    }

    self.delete = function(territory) {
        if(!self.territory._id || self.territory._id == 'undefined') {
            self.cancelEdit();
        }
        else {
            ResTerritories.remove({id: territory._id}, function() {
                globalObjects.notification = {
                    'message': angular.filter.i18n('Deleted') + ': ' + territory.ident,
                    'theme' : 'success'
                }
                $location.updateHash('/territories');
            });
        }
    }

    self.cancelEdit = function() {
        globalObjects.selectedTerritory = {};
        globalObjects.notification = {
            'message': angular.filter.i18n('Action cancelled.'),
            'theme' : 'warning'
        }
        $location.updateHash('/territories');
    }

    // street tab
    var streetClass = function() {
        this.name = '';
        this.numbers_range = '';
        this.numbers_even = true;
        this.numbers_odd = true;
    };

    self.selectedStreet = new streetClass();

    self.saveStreet = function() {
        if(self.selectedStreet.edit != undefined && self.selectedStreet.edit == true) {
            angular.Array.remove(self.territory.streets, self.selectedStreet);
        }
        if(self.selectedStreet.name != '') {
            self.territory.streets.push(self.selectedStreet);
        }
        self.selectedStreet = new streetClass();
    }

    self.selectStreet = function(street) {
        street.edit = true;
        self.selectedStreet = street;
        jQuery('#territory-tab3-streets').trigger("liszt:updated");
        self.$eval();
    }

    self.removeStreet = function(street) {
        angular.Array.remove(self.territory.streets, street);
        self.selectedStreet = new streetClass();
    }

    // "Do not visit" Tab
    self.do_not_visit_date = '';
    self.do_not_visit_dateObj;

    var doNotVisitClass = function() {
        this.street = '';
        this.name = '';
        this.date = '';
        this.number = '';
    };

    self.selectedDoNotVisit = new doNotVisitClass();

    self.saveDoNotVisit = function() {
        if(self.selectedDoNotVisit.edit != undefined && self.selectedDoNotVisit.edit == true) {
            angular.Array.remove(self.territory.donotvisit, self.selectedDoNotVisit);
        }

        // set date from datepicker datObject
        if(self.do_not_visit_dateObj) {
            self.selectedDoNotVisit.date = self.do_not_visit_dateObj;
        }

        if(self.selectedDoNotVisit.name != '') {
            self.territory.donotvisit.push(self.selectedDoNotVisit);
        }

        self.selectedDoNotVisit = new doNotVisitClass();
        self.do_not_visit_date = '';
    }

    self.selectDoNotVisit = function(dnv) {
        dnv.edit = true;
        var date = (dnv.date) ? dnv.date.toString(angular.filter.i18n('M/d/yyyy')) : '';
        self.do_not_visit_date = date;

        self.selectedDoNotVisit = dnv;
    };

    self.removeDoNotVisit = function(dnv) {
        angular.Array.remove(self.territory.donotvisit, dnv);
        self.selectedDoNotVisit = new doNotVisitClass();
        self.do_not_visit_date = '';
    }
}
TerritoryEditCtrl.$inject = ['$xhr','$resource','$location','globalObjects', 'ResTerritories'];

/**
 * Territory give
 */
function TerritoryGiveCtrl($xhr, $resource, $location, globalObjects, ResTerritories, ResContacts) {
    var self = this;
    self.territory = globalObjects.selectedTerritory;

    self.$root.pagename = angular.filter.i18n('Give out a territory');
    self.$root.tagline = self.territory.ident;

    // show error if no territory was selected and bring back to list
    if(!self.territory._id) {
        globalObjects.notification = {
            'message': angular.filter.i18n('Please select a territory first!'),
            'theme' : 'error'
        }
        $location.updateHash('/territories');
    }

    var now = new Date();
    self.date = now.toString(angular.filter.i18n('M/d/yyyy'));

    var contacts = [];
    var contactsObj = [];
    self.selectedContactName = null;
    self.availableContactOptions = [];

    ResContacts.list(function(res) {
        angular.forEach(res,function(person) {
            if(person.active) {
                contacts.push(person.name);
                contactsObj.push(person);
            }
        });
        self.availableContacts = contacts;
    });

    self.save = function() {
        var contactToSave = null;
        angular.forEach(contactsObj, function(contact) {
            if(contact.name == self.selectedContactName)
            {
                contactToSave = angular.toJson(contact);
            }
        });

        if(contactToSave) {
            self.territory.contact = angular.fromJson(contactToSave);
            self.territory.status_changed_at = self.dateObj;
            $xhr('PUT', '/territories/' + self.territory._id + '/give?date=' + self.date, self.territory,
                function(code) { // success
                    globalObjects.selectedTerritory = {};
                    globalObjects.notification = {
                        'message': angular.filter.i18n('Saved'),
                        'theme' : 'success'
                    }
                    $location.updateHash('/territories');
                },
                function(code){ // error
                    console.log('error: ', code);
                }
            );
        }
        else {
            jQuery.jGrowl(angular.filter.i18n('The selected publisher does not exist.'), { theme: 'error' });
        }
    }

    self.cancel = function() {
        globalObjects.selectedTerritory = {};
        globalObjects.notification = {
            'message': angular.filter.i18n('Action cancelled.'),
            'theme' : 'warning'
        }
        $location.updateHash('/territories');
    }
}
TerritoryGiveCtrl.$inject = ['$xhr','$resource','$location','globalObjects','ResTerritories','ResContacts'];

/**
 * Get territory back
 */
function TerritoryGetBackCtrl($xhr, $location, globalObjects, ResContacts) {
    var self = this;
    self.territory = globalObjects.selectedTerritory;
    self.markAsProcessed = true;

    self.$root.pagename = angular.filter.i18n('Get back');
    self.$root.tagline = self.territory.ident;

    var now = new Date();
    self.date = now.toString(angular.filter.i18n('M/d/yyyy'));

    self.cancel = function() {
        globalObjects.selectedTerritory = {};
        globalObjects.notification = {
            'message': angular.filter.i18n('Action cancelled.'),
            'theme' : 'warning'
        }
        $location.updateHash('/territories');
    }

    var contacts = [];
    var contactsObj = [];
    self.selectedContactName = null;
    self.availableContactOptions = [];

    ResContacts.list(function(res) {
        angular.forEach(res,function(person) {
            if(person.active) { // FIXME this filter should be done in resource ba GET param
                contacts.push(person.name);
                contactsObj.push(person);
            }
        });
        self.availableContacts = contacts;
    });

    self.save = function() {
        self.territory.status_changed_at = self.dateObj;
        self.territory.last_processed_at = (self.markAsProcessed) ? self.dateObj : self.territory.last_processed_at;

        var tmpTerritoryToSend = self.territory;
        tmpTerritoryToSend.contact_prev = self.territory.contact;
        tmpTerritoryToSend.contact = {}; // if we want to give territory immediately to another person
        tmpTerritoryToSend.mark_as_processed = self.markAsProcessed;

        delete(tmpTerritoryToSend.history);
        var contactToSave = null;

        angular.forEach(contactsObj, function(contact) {
            if(contact.name == self.selectedContactName)
            {
                tmpTerritoryToSend.contact = contact; // angular.toJson(contact);
            }
        });

        $xhr('PUT', '/territories/' + self.territory._id + '/getback?date=' + self.date, tmpTerritoryToSend,
            function(code,res) { // success
                globalObjects.notification = {
                    'message': res.message,
                    'theme' : 'success'
                };

                globalObjects.selectedTerritory = {};
                $location.updateHash('/territories');
            },
            function(code){ // error
                console.log('error: ', code, res);
            }
        );
    }
}
TerritoryGetBackCtrl.$inject = ['$xhr','$location','globalObjects','ResContacts'];

/**
 * Set territory as processed
 */
function TerritoryProcessedCtrl($xhr, $location, globalObjects) {
    var self = this;
    self.territory = globalObjects.selectedTerritory;

    self.$root.pagename = angular.filter.i18n('Get back');
    self.$root.tagline = self.territory.ident;

    var now = new Date();
    self.date = now.toString(angular.filter.i18n('M/d/yyyy'));

    self.cancel = function() {
        globalObjects.selectedTerritory = {};
        globalObjects.notification = {
            'message': angular.filter.i18n('Action cancelled.'),
            'theme' : 'warning'
        }
        $location.updateHash('/territories');
    }

    self.save = function() {
        self.territory.last_processed_at = self.dateObj; // date object comes from datepicker widget
        $xhr('PUT', '/territories/' + self.territory._id + '/processed?date=' + self.date, self.territory,
            function(code,res) { // success
                var placeholders = [self.territory.contact.name, self.date];
                globalObjects.selectedTerritory = {};
                globalObjects.notification = {
                    //'message': angular.filter.i18n('Territory was processed from %s on %s.', placeholders),
                    'message': res.message,
                    'theme' : 'success'
                }
                $location.updateHash('/territories');
            },
            function(code){ // error
                console.log('error: ', code);
            }
        );
    }
}
TerritoryProcessedCtrl.$inject = ['$xhr','$location','globalObjects'];

/**
 * Statistics
 */
function StatisticsCtrl($xhr, $location, ResTerritories) {
    var self = this;
    self.territories = [];
    self.month = 6;
    self.totalCount = 0;
    self.totalCount = 0;
    self.inTheBox = 0;
    self.given = 0;
    self.notProcessedSince = 0;
    self.$root.pagename = angular.filter.i18n('Statistics');

    var getTotalCount = function(territories) {
        return territories.length;
    };

    var getInTheBox = function(territories) {
        var cnt = 0;
        angular.forEach(territories, function(territory) {
            if(!territory.contact) {
                cnt++;
            }
        });
        return cnt;
    }

    var getGiven = function(territories) {
        var cnt = 0;
        angular.forEach(territories, function(territory) {
            if(territory.contact) {
                cnt++;
            }
        });
        return cnt;
    }

    this.getNotProcessedSinceCount = function() {
        var cnt = 0;
        var today = Date.today();
        var past = Date.today().add(- parseInt(self.month)).months();
        angular.forEach(self.territories, function(territory){
            var lastProcessed = territory.last_processed_at;
            if(!lastProcessed || lastProcessed.compareTo(past) === -1) { // -1 => älter als angegeben
                cnt++;
            }
        });
        self.notProcessedSince = cnt;
        return cnt;
    }

    ResTerritories.list(function(res) {
        self.territories = res;
        self.totalCount = getTotalCount(res);
        self.inTheBox = getInTheBox(res);
        self.given = getGiven(res);
        self.notProcessedSince = self.getNotProcessedSinceCount();
    });


}
StatisticsCtrl.$inject = ['$xhr','$location','ResTerritories'];

function checkHasTerritories(contact, ResTerritories) {
    var hasTerritories = [];
    ResTerritories.list(function(territories) {
        angular.forEach(territories, function(territory) {
            if(territory.contact && territory.contact._id == contact._id) {
                hasTerritories.push(territory);
            }
        });
    });
    return hasTerritories;
}

function getHistory(history, type, last_only) {
    var historyRes = [];
    var type = type || null;
    var last_only = last_only || false;

    angular.forEach(history, function(item,index) {
        if(type && item.event_type == type) {
            historyRes.push(item);
        }
        else {
            historyRes.push(item);
        }
    });

    if(historyRes && last_only) {
        return historyRes[0];
    }

    return historyRes;
}

/**
 * Removes duplicates in the array
 * @author Johan Känngård, http://dev.kanngard.net
 */
function uniqueArray(a) {
    var tmp = new Array(0);
    for(i=0;i<a.length;i++){
        if(!contains(tmp, a[i])){
            tmp.length+=1;
            tmp[tmp.length-1]=a[i];
        }
    }
    return tmp;
}

/**
 * Returns true if 's' is contained in the array 'a'
 * @author Johan Känngård, http://dev.kanngard.net
 */
function contains(a, e) {
    for(j=0;j<a.length;j++)if(a[j]==e)return true;
    return false;
}
