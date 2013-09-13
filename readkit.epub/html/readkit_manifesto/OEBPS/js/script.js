/*global $:false */
/*global window:false */

jQuery.easing.def = "easeOutQuad";

$(document).ready(function() {
    $.event.trigger('kickoff');
});

$(document).on('kickoff', function() {

    // Only load the javascript-based media queries for those eBook reading systems
    // that we need to cater to differently from web browsers.
    if ( navigator.epubReadingSystem && navigator.epubReadingSystem.name === 'iBooks') {
        Modernizr.load([
            //first test need for polyfill
            {
                test: window.matchMedia,
                nope: "js/libs/media.match.min.js"
            },

            //and then load enquire
            "js/libs/enquire.min.js",
            "js/queries.js"
        ]);
    }

    // For fluid video embedding
    $(".video").fitVids();

    // Hide callout info
    $(".calloutInfo").css("display", "none");
    // Don't hide video info
    $(".videoInfo").css("display", "inline");

    // Callout thumbnail hover
    $(".calloutThumbnail").on("mouseenter", function() {
        $(this).children(".calloutThumbnailHover").fadeIn(300);

        $(this).children(".calloutThumbnailHover").find("h4").css("display", "block");
        $(this).children(".calloutThumbnailHover").find("h4").css("opacity", "0");
        $(this).children(".calloutThumbnailHover").find("h4").delay(200).animate({left: '30', opacity: 1}, 200);

        $(this).children(".calloutThumbnailHover").find("h5").css("display", "block");
        $(this).children(".calloutThumbnailHover").find("h5").css("opacity", "0");
        $(this).children(".calloutThumbnailHover").find("h5").delay(350).animate({left: '30', opacity: 1}, 200);
    });

    $(".calloutThumbnail").on("mouseleave", function() {
        $(this).children(".calloutThumbnailHover").fadeOut(200);
        $(this).children(".calloutThumbnailHover").find("h4").animate({left: '0', opacity: 0}, 0);
        $(this).children(".calloutThumbnailHover").find("h5").animate({left: '0', opacity: 0}, 0);
    });

    // Hide hover effect on touch devices
    if (Modernizr.touch) {
        $(".calloutThumbnailHover").css("display", "none");
        $(".calloutThumbnailHover").css("visibility", "hidden");
        $(".calloutThumbnail").unbind("mouseenter");
        $(".calloutThumbnail").unbind("mouseleave");
    }

    // Slider setup
    var isAnimating = false,
        currOpenCallout;

    function closeOpenedCallout(el) {
        var currOpenCalloutInfo = currOpenCallout.find(".calloutInfo");
        currOpenCalloutInfo.slideUp(900);
        if(el && el.length) {
            el.css('visibility', 'visible');
        }
    }

    $(".calloutThumbnail").click(function() {
        if(isAnimating) {
            return;
        }
        isAnimating = true;

        var calloutEl = $(this).parent('.callout'),
            newOpenCalloutInfo = calloutEl.find(".calloutInfo");

        isAnimating = false;

        currOpenCallout = calloutEl;
        newOpenCalloutInfo.stop().delay(200).slideDown(900).data('callout-open', true);
        currOpenCallout.find(".calloutThumbnailHover").fadeOut(200, function(){currOpenCallout.find(".calloutThumbnailHover").css("visibility", "hidden");});
    });

    $(".closeButton, #aboutPage, #logo").click(function() {
        currOpenCallout = $(this).closest('.callout');
        if(currOpenCallout) {
            closeOpenedCallout(currOpenCallout.find(".thumbnailImage"));
            currOpenCallout.find(".calloutThumbnailHover").css("visibility", "visible");
            currOpenCallout = false;
        }
    });

    // button to toggle fullscreen
    $('.main_icon').click(function() {
        if (screenfull.enabled) {
            screenfull.toggle();
        }
    });

    // tooltip support for non-anchor elements
    $('.main_icon').hover(function(){
            // Hover over code
            var title = $(this).attr('title');
            $(this).data('tipText', title).removeAttr('title');
            $('<p class="tooltip"></p>')
            .text(title)
            .appendTo('body')
            .fadeIn('slow');
    }, function() {
            // Hover out code
            $(this).attr('title', $(this).data('tipText'));
            $('.tooltip').remove();
    }).mousemove(function(e) {
            var mousex = e.pageX + 20; //Get X coordinates
            var mousey = e.pageY + 10; //Get Y coordinates
            $('.tooltip')
            .css({ top: mousey, left: mousex });
    });
});
