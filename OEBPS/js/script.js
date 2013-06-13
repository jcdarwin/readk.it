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
        isAnimating = false,
        currOpenCallout;

    function closeOpenedCallout(el) {
        currOpenCalloutInfo = currOpenCallout.find(".calloutInfo");
        currOpenCalloutInfo.slideUp(900);
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

});
