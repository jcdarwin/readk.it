/* Our javascript-based media queries */
/*global $:false */

$(document).ready(function() {

    /* ============== Browsers, not dedicated EPUB reading systems ============== */
    enquire.register("screen", {
        match : function() {
            if ( !navigator.epubReadingSystem ) {
                // Readkit mixes in our grids (which make sense in a browser, but not in a dedicated EPUB reading system)
                // by virtue of the css file entry in the content.opf.
                //$('head').append('<link href="css/grids.css" media="screen, projection" rel="stylesheet" type="text/css" />');
                $(document).on('kickoff', function() {
                    // Show the close button on callouts
                    $('.calloutNav').css({'height': '1.8rem', 'margin-bottom': '0.4rem', 'padding-top': '0.25rem'});
                    $('.calloutNavClose').css('display', 'block');
                });
            }
        },
        unmatch : function() {
        }

    });

    /* ======== Browsers, not mobile, not dedicated EPUB reading systems ======== */
    enquire.register("screen and (min-width : 1025px)", {
        match : function() {
            if ( !navigator.epubReadingSystem ) {
                $(document).on('kickoff', function() {
                    // Use Modernizr.Detectizr to detect whether we've got a desktop browser
                    Modernizr.Detectizr.detect({ detectDeviceModel: false, detectScreen: true, detectOS: false, detectBrowser: false, detectPlugins: false });
                    if (Modernizr.Detectizr.device.type === 'desktop') {
                        // We only want our blue-pulse animation for the header icon on desktop browsers.
                        // This alerts uses that they can go full-screen.
                        $('.header-icon').css({'-webkit-animation-name': 'bluePulse', '-webkit-animation-duration': '2s', '-webkit-animation-iteration-count': 'infinite'});
                        $('.header-icon').css({'animation-name': 'bluePulse', 'animation-duration': '2s', 'animation-iteration-count': 'infinite'});
                    }
                });
            }
        },
        unmatch : function() {
        }
    });

    /* ========================= Apple iBooks iPad ============================== */
    enquire.register("screen and (min-device-width : 768px) and (max-device-width : 1024px)", {

        match : function() {
            if ( navigator.epubReadingSystem && navigator.epubReadingSystem.name === 'iBooks' ) {
                // Ensure our headings stay with their next paragraph
                $('h1, h2, h3, h4, h5, h6').css('page-break-after', 'avoid');

                // Bump up the size of the body text a tad
                $('p, li').css('font-size', '1.2rem');

                $('.delta').css({'font-size': '26x'});
                $('.delta').css({'font-size': '1.44444rem'});

                // Resize the major headings to a sensible size
                $('h1').css({'font-size': '48px'});
                $('h1').css({'font-size': '2.66667rem'});

                $('h2').css({'font-size': '36px'});
                $('h2').css({'font-size': '2rem'});

                $('.header').css({'padding-left': '10px', 'padding-right': '10px'});

                // force page breaks
                $('nav').css({'padding-top': '1rem'});
                $('.pure-g-r').css({'margin-top': '4rem'});
            }
        },
        unmatch : function() {
        }

    });

    enquire.register("screen and (min-device-width : 768px) and (max-device-width : 1024px) and (orientation : portrait)", {

        match : function() {
            if ( navigator.epubReadingSystem && navigator.epubReadingSystem.name === 'iBooks' ) {
                $('.container').css('width', '460px');
            }
        },
        unmatch : function() {
            if ( navigator.epubReadingSystem && navigator.epubReadingSystem.name === 'iBooks' ) {
                $('.container').css('width', '320px');
            }
        }

    });

    // I really wish Apple would publish the details of the applicable media queries for iBooks
    //enquire.register("screen and (min-device-width : 768px) and (max-device-width : 1024px) and (orientation : landscape)", {
    enquire.register("screen and (width : 866px) and (orientation : landscape)", {

        match : function() {
            if ( navigator.epubReadingSystem && navigator.epubReadingSystem.name === 'iBooks') {
                $('.container').css({'width': '320px', 'padding': '0 10px'});
                $('h1').css({'font-size': '32px'});
                $('h1').css({'font-size': '1.77777rem'});
                $('h2').css('page-break-before', 'always');
            }
        },
        unmatch : function() {
            if ( navigator.epubReadingSystem && navigator.epubReadingSystem.name === 'iBooks') {
                $('.container').css({'width': '460px', 'padding': '0'});
                $('h1').css('page-break-after', 'auto');
                $('h1').css({'font-size': '48px'});
                $('h1').css({'font-size': '2.66667rem'});
            }
        }

    });

    /* ======================== Apple iBooks iPhone ============================= */

    /* iPhone 2G-4S in portrait & landscape */
    enquire.register("screen and (min-device-width : 320px) and (max-device-width : 480px)", {
        match : function() {
            if ( navigator.epubReadingSystem && navigator.epubReadingSystem.name === 'iBooks' ) {
                $('.header-icon').css('width', '50%');
                $('.header').css('padding-top', '1.5rem');
                $('.container').css('width', '260px');
                $('h1').css({'margin-bottom': '4rem'});
                $('h2').css({'page-break-before': 'always'});
                $('nav').css({'padding-top': '4rem'});
            }
        }
    });

    /* iPhone 5 in portrait & landscape */
    enquire.register("screen and (min-device-width : 320px) and (max-device-width : 568px)", {
        match : function() {
            if ( navigator.epubReadingSystem && navigator.epubReadingSystem.name === 'iBooks' ) {
                $('.header-icon').css('width', '50%');
                $('.header').css('padding-top', '1.5rem');
                $('.container').css('width', '260px');
                $('h1').css({'margin-bottom': '4rem'});
                $('h2').css({'page-break-before': 'always'});
                $('nav').css({'padding-top': '4rem'});
            }
        }
    });

});
