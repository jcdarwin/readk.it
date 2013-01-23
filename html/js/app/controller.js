/*
** controller.js
**
** Author: Jason Darwin
**
** Our main controller, bootstrapped by require.js.
*/

define([
    'jquery',
    'app/config'
], function($, config){

    /* Constructor */
    var Controller = function (options, callback) {

        $.getJSON(options.manifest, function(data){
            $.each(data, function(index, value){
                console.log(value.name);

                // Load an entry for the publication into the library view
                $('#library').append('<div class="publication"><a href="' + value.path + '"><img src="' + value.cover + '" /></a><h2><a href="' + value.path + '">' + value.name + '</a></h2></div>');

            });
        });

        callback();
    };

    return (Controller);
});
