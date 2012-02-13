jQuery(document).ready(function($){
    $('form input[type=submit]', 'form button').live('click',function(e) {
       e.stopPropagation();
       e.preventDefault();
       return false;
    });
});

