jQuery.easing.def = "easeOutQuad";

$(document).ready(function() {
    $.event.trigger('kickoff');
});

$(document).on('kickoff', function() {
    // For fluid video embedding
    $(".video").fitVids();

    // Hide callout info
    $(".calloutInfo").css("display", "none");
    // Don't hide video info
    $(".videoInfo").css("display", "inline");

    // Callout thumbnail hover
    $(".calloutThumbnail").on("mouseenter", function(e) {
        $(this).children(".calloutThumbnailHover").fadeIn(300);

        $(this).children(".calloutThumbnailHover").find("h4").css("display", "block");
        $(this).children(".calloutThumbnailHover").find("h4").css("opacity", "0");
        $(this).children(".calloutThumbnailHover").find("h4").delay(200).animate({left: '30', opacity: 1}, 200);

        $(this).children(".calloutThumbnailHover").find("h5").css("display", "block");
        $(this).children(".calloutThumbnailHover").find("h5").css("opacity", "0");
        $(this).children(".calloutThumbnailHover").find("h5").delay(350).animate({left: '30', opacity: 1}, 200);

        if(!openedCalloutInfo) {
            $(this).children(".calloutThumbnailHover").css("visibility", "visible");
        }
    });

    $(".calloutThumbnail").on("mouseleave", function(e) {
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
    var sliderProps = {
        autoScaleSlider: true,
        autoScaleSliderWidth: 460,
        autoScaleSliderHeight: 284,
        captionShowEffects: '',
        controlNavEnabled: false,
        keyboardNavEnabled: true,
        directionNavEnabled: false,
        startSlideIndex: 0,
        imageScaleMode: 'fill' },
        openedCalloutInfo = false,
        isAnimating = false,
        currOpenCallout;

    function closeOpenedCallout(el) {
        openedCalloutInfo.slideUp(900);
        openedCalloutInfo = false;
        if(el && el.length) {
            el.css('visibility', 'visible');
        }
    }

    $(".calloutThumbnail").click(function(e) {
        if(isAnimating) {
            return;
        }
        isAnimating = true;

        var firstImgLoaded = false,
            calloutEl = $(this).parent('.callout'),
            calloutNav = calloutEl.find('.calloutNav'),

            //
            calloutInfo = calloutEl.find('.calloutInfo'),
            //

            newOpenCalloutInfo = calloutEl.find(".calloutInfo"),
            currEl = $(this).find(".thumbnailImage");

        isAnimating = false;

        if(openedCalloutInfo) {
            if(newOpenCalloutInfo.is(openedCalloutInfo)) {
                // The following is/was deactivated as it causes a problem on iOS
                closeOpenedCallout(currOpenCallout.find(".thumbnailImage"));
                currOpenCallout.find(".calloutThumbnailHover").fadeOut(800, function(){currOpenCallout.find(".calloutThumbnailHover").css("visibility", "visible");});
                return false;
            } else {
                closeOpenedCallout(currOpenCallout.find(".thumbnailImage"));
                currOpenCallout.find(".calloutThumbnailHover").fadeOut(800, function(){currOpenCallout.find(".calloutThumbnailHover").css("visibility", "visible");});
            }
        }
        currOpenCallout = calloutEl;
        openedCalloutInfo = newOpenCalloutInfo.stop().delay(200).slideDown(900).data('callout-open', true);
        currOpenCallout.find(".calloutThumbnailHover").fadeOut(200, function(){currOpenCallout.find(".calloutThumbnailHover").css("visibility", "hidden");});
    });

    $(".closeButton, #aboutPage, #logo").click(function() {
        // Add a delay to fix weird issue with resizing About page
        function closeSlider() {
            if(openedCalloutInfo && currOpenCallout) {
                closeOpenedCallout(currOpenCallout.find(".thumbnailImage"));
                currOpenCallout.find(".calloutThumbnailHover").css("visibility", "visible");
            }
        }
        //setTimeout(closeSlider, 400);
        setTimeout(closeSlider, 1);

    });

});
