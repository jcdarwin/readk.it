 /*global define:false */
 define([
    'jquery'
], function($){
    $(document).ready(function() {
        $.event.trigger('kickoff');
    });

    $(document).on('kickoff', function() {

    });
});
