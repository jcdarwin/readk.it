/*
|--------------------------------------------------------------------------
| UItoTop jQuery Plugin 1.2 by Matt Varone
| http://www.mattvarone.com/web-design/uitotop-jquery-plugin/
|--------------------------------------------------------------------------
*/
(function($){
	$.fn.UItoTop = function(options) {

        var defaults = {
                text: '',
                min: 320,
                inDelay:600,
                outDelay:400,
                containerID: 'toRight',
                scrollSpeed: 1200,
                easingType: 'linear',
                layout: ''
            },
            settings = $.extend(defaults, options),
            containerIDhash = '#' + settings.containerID;
		
		$('body').append('<a href="#" id="'+settings.containerID+'">'+settings.text+'</a>');

		$(containerIDhash).hide();
					
		$(window).scroll(function() {
			// var sd = $(window).scrollTop();
            var sd = settings.layout ? Math.abs(settings.layout.location().y) + $(window).height(): 0;
			if(typeof document.body.style.maxHeight === "undefined") {
				$(containerIDhash).css({
					'position': 'absolute',
					'top': sd + $(window).height() - 50
				});
			}
			if ( sd > (settings.layout.location().height - settings.min) ) {
				$(containerIDhash).fadeIn(settings.inDelay, function(){
                    setTimeout(function () {
                        $(containerIDhash).fadeOut(settings.Outdelay);
                    }, 700);
                });

			} else {
				$(containerIDhash).fadeOut(settings.Outdelay);
            }
		});
};
})(jQuery);