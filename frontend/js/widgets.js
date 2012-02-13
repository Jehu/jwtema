/* http://docs.angularjs.org/#!angular.widget */
angular.widget('my:notifications', function(notify, element) { 
    var compiler = this;
    var watched = notify.attr('messages');
    return function(element) {
        var currentScope = this;
        currentScope.$watch(watched, function(value) {
            var value = value || null;
            console.log('value',value);
            if(value != 'undefined' && value)
            {
                angular.forEach(value, function() {
                    jQuery.jGrowl(item.message, { theme: item.theme });
                });
            }
        });
    };
});

angular.widget('my:notification', function(notify, element) { 
    var compiler = this;
    var watched = notify.attr('message');
    return function(element) {
        var currentScope = this;
        currentScope.$watch(watched, function(value) {
            var value = value || null;
            if(value.message)
            {
                jQuery.jGrowl(value.message, { theme: value.theme });
            }
        });
    };
});

//angular.widget('my:datatable', function(expression, element) { 
//    var compiler = this;
//    return function(element) {
//        var currentScope = this;
//        currentScope.$watch(expression, function(value) {
//            var value = value || null;
//            if(value)
//            {
//                var options = {};
//                jQuery.each(value, function(optionName,theData) {
//                    options[optionName] = theData;
//                });
//                element.dataTable(options);
//            }
//        });
//    };
//});


angular.widget('@my:chosen', function(expression,element) {
    function instanceFn(element) { // this is how we can inject services properly... (not needed here)
        var currentScope = this;
        var i18n = angular.filter.i18n;
        currentScope.$watch(expression, function(value) {
            if(value) {
                if(element.attr('data-placeholder'))
                {
                    element.append('<option value="">' + i18n(element.attr('data-placeholder'))+ '</option>');
                }
                angular.forEach(value,function(item, index) {
                    element.append('<option value="' + item + '">' + item  + '</option>')
                });
                element.chosen({no_results_text: i18n("No results matched")}).change(function() {
                    var elemName = element.attr('name');
                    currentScope[elemName] = element.val();
                });
            }
        });
    }
    instanceFn.$inject = [];
    return instanceFn;
});
