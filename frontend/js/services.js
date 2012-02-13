/* http://docs.angularjs.org/#!angular.service */

/**
 * App service which is responsible for the main configuration of the app.
 */
angular.service('jwtemaApp', function($route, $location, $window, $xhr, globalObjects) {

    var theme = 'themes/01/';

    $route.when('/contacts', {template: theme + 'partials/contactsList.html', controller: ContactsListCtrl});
    $route.when('/contacts/edit', {template: theme + 'partials/contactEdit.html', controller: ContactEditCtrl});
    $route.when('/territories', {template: theme + 'partials/territoriesList.html', controller: TerritoriesListCtrl});
    $route.when('/territories/edit', {template: theme + 'partials/territoryEdit.html', controller: TerritoryEditCtrl});
    $route.when('/territories/give', {template: theme + 'partials/territoryGive.html', controller: TerritoryGiveCtrl});
    $route.when('/territories/getback', {template: theme + 'partials/territoryGetback.html', controller: TerritoryGetBackCtrl});
    $route.when('/territories/processed', {template: theme + 'partials/territoryProcessed.html', controller: TerritoryProcessedCtrl});
    $route.when('/stats', {template: theme + 'partials/statistics.html', controller: StatisticsCtrl});

    // richtigen Content-Type für POST setzen, http://groups.google.com/group/angular/browse_thread/thread/9aae25ab1bd51187
    $xhr.defaults.headers.post['Content-Type']='application/json';
    $xhr.defaults.headers.put['Content-Type']='application/json';
    $xhr.defaults.headers.delete['Content-Type']='application/json';

    var self = this;

    $route.onChange(function() {
        if ($location.hash === '') {
            $location.updateHash('/territories');
            self.$eval();
        } else if ($location.hash == '/territories/create') {
            globalObjects.selectedTerritory = {};
            $location.updateHash('/territories/edit');
            self.$eval();
        } else if ($location.hash == '/contacts/create') {
            globalObjects.selectedContact = { active: true };
            $location.updateHash('/contacts/edit');
            self.$eval();
        } else {
            $route.current.scope.params = $route.current.params;
            $window.scrollTo(0,0);
        }
    });

}, {$inject:['$route', '$location', '$window','$xhr','globalObjects'], $eager: true});

angular.service('globalObjects', function() {
    return {
        selectedTerritory: {},
        selectedContact: {},
        notification: {
            'message': null,
            'theme': 'information'
        }
    };
}, {$inject: []});

angular.service('ResTerritories', function($resource) {
    var self = this;
    return $resource(
        '/territories/:id',
        { id: '@_id' },
        { 
            'save':  { method: 'POST' },
            'list':   { method: 'GET', isArray: true, verifyCache: true },
            'update':  { method: 'PUT' },
            'remove': { method: 'DELETE' }
        }
    );
}, {$inject:['$resource'], $eager:true} );

angular.service('ResContacts', function($resource) {
    var self = this;
    return $resource(
        '/contacts/:id',
        { id: '@_id' },
        {
            'save':  { method: 'POST' },
            'list':   { method: 'GET', isArray: true },
            'update':  { method: 'PUT' },
            'remove': { method: 'DELETE' }
        }
    );
}, { $inject:['$resource'], $eager:true });
