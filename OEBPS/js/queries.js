/* Our javascript-based media queries */
/*global $:false */

enquire.register("screen and (min-device-width : 768px) and (max-device-width : 1024px)", {

    match : function() {
        if ( navigator.epubReadingSystem && navigator.epubReadingSystem.name === 'iBooks') {
            // iBooks doesn't do columns, so revert our grid to a single column.
            $('.pure-u-1-2').css('width', '100%');

            // Bump up the size of the body text a tad
            $('p, li').css('font-size', '1.2rem');

            // Hide the close button on callouts
            $('.calloutNav').css({'height': '0', 'margin-bottom': '0', 'padding-top': '0'});
            $('.calloutNavClose').css('display', 'none');

        }
    },
    unmatch : function() {
    }

});

enquire.register("screen and (min-device-width : 768px) and (max-device-width : 1024px) and (orientation : portrait)", {

    match : function() {
        if ( navigator.epubReadingSystem && navigator.epubReadingSystem.name === 'iBooks') {
            $('.container').css('width', '400px');
        }
    },
    unmatch : function() {
        if ( navigator.epubReadingSystem && navigator.epubReadingSystem.name === 'iBooks') {
            $('.container').css('width', '320px');
        }
    }

});

enquire.register("screen and (min-device-width : 768px) and (max-device-width : 1024px) and (orientation : landscape)", {

    match : function() {
        if ( navigator.epubReadingSystem && navigator.epubReadingSystem.name === 'iBooks') {
            $('.container').css({'width': '320px', 'padding': '0 10px'});
            $('h1').css('font-size', '2.66667rem');
        }
    },
    unmatch : function() {
        if ( navigator.epubReadingSystem && navigator.epubReadingSystem.name === 'iBooks') {
            $('.container').css({'width': '400px', 'padding': '0'});
            $('h1').css('font-size', '3.33333rem');
        }
    }

});