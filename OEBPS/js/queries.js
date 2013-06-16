/* Our javascript-based media queries */
/*global $:false */

enquire.register("screen and (min-device-width : 768px) and (max-device-width : 1024px)", {

    match : function() {
        if ( navigator.epubReadingSystem.name == 'iBooks') {
            $('.container').css('width', '600px;');
        }
    },
    unmatch : function() {
    }

});