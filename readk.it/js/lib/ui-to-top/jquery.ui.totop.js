/*
|--------------------------------------------------------------------------
| UItoTop jQuery Plugin 1.2 by Matt Varone
| http://www.mattvarone.com/web-design/uitotop-jquery-plugin/
|--------------------------------------------------------------------------
*/
(function($){
	$.fn.UItoTop = function(options) {

        var defaults = {
                text: 'To Right',
                min: 320,
                inDelay:600,
                outDelay:400,
                containerID: 'toTop',
                containerHoverID: 'toTopHover',
                scrollSpeed: 1200,
                easingType: 'linear',
                layout: ''
            },
            settings = $.extend(defaults, options),
            containerIDhash = '#' + settings.containerID,
            containerHoverIDHash = '#'+settings.containerHoverID;
		
		$('body').append('<a href="#" id="'+settings.containerID+'">'+settings.text+'</a>');

		$(containerIDhash).hide()
/*
        .on('click.UItoTop',function(){
			$('html, body').animate({scrollTop:0}, settings.scrollSpeed, settings.easingType);
			$('#'+settings.containerHoverID, this).stop().animate({'opacity': 0 }, settings.inDelay, settings.easingType);
			return false;
		})
*/
		.prepend('<span id="'+settings.containerHoverID+'"></span>')
		.hover(function() {
				$(containerHoverIDHash, this).stop().animate({
					'opacity': 1
				}, 600, 'linear');
			}, function() {
				$(containerHoverIDHash, this).stop().animate({
					'opacity': 0
				}, 700, 'linear');
			});
					
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
				$(containerIDhash).fadeIn(settings.inDelay);

                setTimeout(function () {
                    $(containerIDhash).fadeOut(settings.Outdelay);
                }, 700);

			} else {
				$(containerIDhash).fadeOut(settings.Outdelay);
            }
		});
};
})(jQuery);