/*
angular.directive("my:events", function(expression, element) { 
  return function(element) { 
    var self = this; 
    var events = self.$tryEval(expression, element); 
    for (var e in events) { 
        element.bind(e, function(event) { 
            self.$root.browserEvent = event; 
            self.$tryEval(events[event.type], element); 
            self.$root.$eval(); 
            event.stopPropagation(); 
        }); 
    } 
  }; 
}); 
*/
/*
angular.directive('my:tabs', function(expression,element) {
    function instanceFn(element) { // this is how we can inject services properly... (not needed here)
        var currentScope = this;
        var container = element;

        var Tab = function ( element ) {
          this.element = $(element)
        }
        
        Tab.prototype = {
        
          constructor: Tab
        
        , show: function () {
            var $this = this.element
              , $ul = $this.closest('ul:not(.dropdown-menu)')
              , selector = $this.attr('data-target')
              , previous
              , $target
        
            if (!selector) {
              selector = $this.attr('href')
              selector = selector && selector.replace(/.*(?=#[^\s]*$)/, '') //strip for ie7
            }
        
            if ( $this.parent('li').hasClass('active') ) return
        
            previous = $ul.find('.active a').last()[0]
        
            $this.trigger({
              type: 'show'
            , relatedTarget: previous
            })
        
            $target = $(selector)
        
            this.activate($this.parent('li'), $ul)
            this.activate($target, $target.parent(), function () {
              $this.trigger({
                type: 'shown'
              , relatedTarget: previous
              })
            })
          }
        
        , activate: function ( element, container, callback) {
            var $active = container.find('> .active')
              , transition = callback
                  && $.support.transition
                  && $active.hasClass('fade')
        
            function next() {
              $active
                .removeClass('active')
                .find('> .dropdown-menu > .active')
                .removeClass('active')
        
              element.addClass('active')
        
              if (transition) {
                element[0].offsetWidth // reflow for transition
                element.addClass('in')
              } else {
                element.removeClass('fade')
              }
        
              if ( element.parent('.dropdown-menu') ) {
                element.closest('li.dropdown').addClass('active')
              }
        
              callback && callback()
            }
        
            transition ?
              $active.one($.support.transition.end, next) :
              next()
        
            $active.removeClass('in')
          }
        }
        
        $.fn.tab = function ( option ) {
          return this.each(function () {
            var $this = $(this)
              , data = $this.data('tab')
            if (!data) $this.data('tab', (data = new Tab(this)))
            if (typeof option == 'string') data[option]()
          })
        }
        
        $.fn.tab.Constructor = Tab
        
        
        //$(function () {
        //  $('body').on('click.tab.data-api', '[data-toggle="tab"], [data-toggle="pill"]', function (e) {
        //    e.preventDefault()
        //    $(this).tab('show')
        //  })
        //})
    }
    instanceFn.$inject = [];
    return instanceFn;
})
*/
angular.directive('my:tabs', function(expression,element) {
    function instanceFn(element) { // this is how we can inject services properly... (not needed here)
        var currentScope = this;
        var container = element;
        
        container.find('.tab-content').hide();
        container.find("ul.tabs li:first").addClass("active").show();
        container.find(".tab-content:first").show();
        
        container.find("ul.tabs li").click(function() {
            container.find("ul.tabs li").removeClass("active");
            $(this).addClass("active");
            container.find(".tab-content").hide();
        
            var activeTab = $(this).find("a").attr("href");
            $(activeTab).fadeIn();
            return false;
        });
        //currentScope.$root.$eval();
    }
    instanceFn.$inject = [];
    return instanceFn;
});
//var angularui = angularui || {};
//angular.directive('jq:plugin', function(expression, compiledElement){
//    var options = {};
//    angular.extend(options, angularui[expression]);
//    return function(linkElement) {
//        linkElement[expression](options);
//    };
//});

/** 
 * Removes 'nojs' class from element, so the whole 
 * page becomes visible once angular is operational. 
 */ 
angular.directive('my:remove-nojs', function(expr, compiledElement) { 
    setTimeout(
        function() { 
            compiledElement.removeClass('nojs') 
        },1000
    );
}); 

