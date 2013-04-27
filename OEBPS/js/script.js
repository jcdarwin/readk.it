/*
••••••••••••••••••••••••

Powered by Type & Grids™
www.typeandgrids.com

••••••••••••••••••••••••
*/

jQuery.easing.def = "easeOutQuad";

$(document).ready(function() {
    $.event.trigger('kickoff');
});

$(document).on('kickoff', function() {
	// Make enlarge buttons inactive if no onClick event
	$(".enlargeButton").each(function() {
        if ( $(this).attr("onClick") === undefined )  {
            $(this).addClass("projectNavInactive");
        }
    });

	// For fluid video embedding
	$(".video").fitVids();

	// Hide project info
	$(".projectInfo").css("display", "none");
	// Don't hide video info
	$(".videoInfo").css("display", "inline");

	// Move projects to second column
	$(".project:odd").appendTo("#col2");

	// Project thumbnail hover
	$(".projectThumbnail").on("mouseenter", function(e) {
		$(this).children(".projectThumbnailHover").fadeIn(300);

		$(this).children(".projectThumbnailHover").find("h4").css("display", "block");
		$(this).children(".projectThumbnailHover").find("h4").css("opacity", "0");
		$(this).children(".projectThumbnailHover").find("h4").delay(200).animate({left: '30', opacity: 1}, 200);

		$(this).children(".projectThumbnailHover").find("h5").css("display", "block");
		$(this).children(".projectThumbnailHover").find("h5").css("opacity", "0");
		$(this).children(".projectThumbnailHover").find("h5").delay(350).animate({left: '30', opacity: 1}, 200);
	});

	$(".projectThumbnail").on("mouseleave", function(e)	{
		$(this).children(".projectThumbnailHover").fadeOut(200);
		$(this).children(".projectThumbnailHover").find("h4").animate({left: '0', opacity: 0}, 0);
		$(this).children(".projectThumbnailHover").find("h5").animate({left: '0', opacity: 0}, 0);
	});

	// Hide hover effect on touch devices
	if (Modernizr.touch) {
		$(".projectThumbnailHover").css("display", "none");
		$(".projectThumbnailHover").css("visibility", "hidden");
		$(".projectThumbnail").unbind("mouseenter");
		$(".projectThumbnail").unbind("mouseleave");
	}

	// Page navigation
	var isWorkCurrentPage = true;
	var isAboutCurrentPage = false;

	$("#logoDetailView").click(function() {
		window.location = "../../index.html";
	});

	$("#workPage, #logo").click(function() {
		if(!isWorkCurrentPage)
		{
			isWorkCurrentPage = true;
			isAboutCurrentPage = false;
			$("#workPage").attr("class", "currentPage");
			$("#aboutPage").removeClass("currentPage");
			$("#about").fadeOut(500, function() {
				$("#work").fadeIn(500);
			});
		}
	});

	$("#aboutPage").click(function() {
			if(!isAboutCurrentPage) {
				isAboutCurrentPage = true;
				isWorkCurrentPage = false;
				$("#aboutPage").attr("class", "currentPage");
				$("#workPage").removeClass("currentPage");
				$("#work").fadeOut(500, function() {
					$("#about").fadeIn(500);
				});
			}
		});

	// Make Work page current page
	$("#workPage").attr("class", "currentPage");

	// Hide About page
	//$("#about").css("display", "none");
	$("#about").fadeOut(0);

	// For site fade site in
//*	$(".container").css("display", "none");

	// Remove site preloader after site is loaded

	$('#sitePreloader').delay(200).fadeOut(500, function() {
		$(this).remove();
	});

	// Fade site in
//*	$(".container").delay(700).fadeIn(500, function(){
		$.event.trigger('kickedoff');
//*	});

	// Portfolio slider setup
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
		openedProjectInfo = false,
		isAnimating = false,
		currOpenProject;

	function closeOpenedProject(el) {
		openedProjectInfo.slideUp(900);
		openedProjectInfo.parent().find('.portfolioSlider').fadeOut();
		openedProjectInfo = false;
		if(el && el.length) {
			el.css('visibility', 'visible');
		}
	}

	$(".projectThumbnail").click(function(e) {
		if(isAnimating) {
			return;
		}
		isAnimating = true;

		var firstImgLoaded = false,
			projectEl = $(this).parent('.project'),
			projectNav = projectEl.find('.projectNav'),

			//
			projectInfo = projectEl.find('.projectInfo'),
			//

			newOpenProjectInfo = projectEl.find(".projectInfo"),
			currEl = $(this).find(".thumbnailImage");

		var sliderEl,
			imgPreloaderOverlay;

		if( !projectEl.data('slider-inited') ) {
			var portfolioSliderData = projectEl.find('.portfolioSliderData');

			//var currItemCounter = projectNav.find('.projectNavCounter'),
			var currItemCounter,
				arrowNext,
				arrowPrev,
				arrowPrevBlocked,
				arrowNextBlocked;

			if(portfolioSliderData.length > 0) {
				imgPreloaderOverlay = $('<div class="first-img-preloader"><div class="preloader-graphics"></d</div>');
				projectEl.append(imgPreloaderOverlay);

				portfolioSliderData
					.addClass('portfolioSlidesContainer')
					.wrap($('<div class="portfolioSlider"></div>'))
					.find('li').addClass('portfolioSlide');

				sliderEl = projectEl.find('.portfolioSlider');
				currEl.clone().addClass('portfolioImage myImage').appendTo(sliderEl.find('li').eq(0).removeAttr('data-src'));
				var imgLoadCounter = 0;

				var sliderInstance = sliderEl.portfolioSlider(sliderProps).data('portfolioSlider');
				var numSlides = sliderInstance.numSlides;

				// Fixes bug when resizing window on About page
				$("#logo, #workPage").click(function() {
					function bugFix() {
						sliderInstance.updateSliderSize();
						$(".projectThumbnailHover").fadeOut(800);
					}
					setTimeout(bugFix, 710);
				});

				//var currItemCounter = projectNav.find('.projectNavCounter'),
				currItemCounter = projectInfo.find('.projectNavCounter'),
				arrowNext = projectNav.find('.projectNavButtons .next'),
				arrowPrev = projectNav.find('.projectNavButtons .prev'),
				arrowPrevBlocked = false,
				arrowNextBlocked = false;

				function updateNextPrevButtons() {
					if(sliderInstance.currentSlideId <= 0) {
						arrowPrev.addClass('projectNavInactive');
						arrowPrevBlocked = true;
					} else {
						arrowPrev.removeClass('projectNavInactive');
						arrowPrevBlocked = false;
					}

					if(sliderInstance.currentSlideId >= numSlides - 1) {
						arrowNext.addClass('projectNavInactive');
						arrowNextBlocked = true;
					} else {
						arrowNext.removeClass('projectNavInactive');
						arrowNextBlocked = false;
					}
				}

				sliderInstance.settings.beforeSlideChange = function() {
					currItemCounter.text( (sliderInstance.currentSlideId + 1) + ' of ' + numSlides );
					updateNextPrevButtons();
				};

				arrowNext.click(function() {
					if(!arrowNextBlocked) {
						sliderInstance.next();
					}
				});
				arrowPrev.click(function() {
					if(!arrowPrevBlocked) {
						sliderInstance.prev();
					}
				});

				sliderInstance.settings.beforeSlideChange.call();
				updateNextPrevButtons();
				projectEl.data('slider-inited', true);

				imgPreloaderOverlay.css({
					width: currEl.width(),
					height: currEl.height()
				}).fadeIn();

				sliderInstance.settings.imgLoadComplete = function() {
					imgLoadCounter++;

					if(imgLoadCounter >= 2) {
						sliderInstance.settings.imgLoadComplete = false;
						setTimeout(function() {
							//sliderInstance.updateSliderSize()
							sliderInstance.goTo(1);
							isAnimating = false;
							currEl.css('visibility', 'hidden');
							imgPreloaderOverlay.stop().fadeOut();
						}, 400);
					}

				};

			} else {
				if(projectNav.length > 0) {
					currItemCounter = projectInfo.find('.projectNavCounter'),
					arrowNext = projectNav.find('.projectNavButtons .next'),
					arrowPrev = projectNav.find('.projectNavButtons .prev'),
					arrowPrevBlocked = false,
					arrowNextBlocked = false;
					arrowNext.addClass('projectNavInactive');
					arrowPrev.addClass('projectNavInactive');
				}
				projectEl.data('slider-inited', true);
				isAnimating = false;
			}
		} else {
			sliderEl = projectEl.find('.portfolioSlider');
			if (sliderEl.length > 0) {
				sliderEl.data('portfolioSlider').goToSilent(0);
				imgPreloaderOverlay = projectEl.find('.first-img-preloader');
				imgPreloaderOverlay.css({
					width: currEl.width(),
					height: currEl.height()
				}).fadeIn();

				setTimeout(function() {
					sliderEl.show();

					setTimeout(function() {
						currEl.css({'visibility': 'hidden'});
						imgPreloaderOverlay.stop().fadeOut();
						sliderEl.data('portfolioSlider').isAnimating = false;
						sliderEl.data('portfolioSlider').goTo(1);
						isAnimating = false;
					}, 400);

				}, 450);

			} else {
				isAnimating = false;
			}

		}

		if(openedProjectInfo) {
			if(newOpenProjectInfo.is(openedProjectInfo)) {
				// The following is deactivated as it causes a problem on iOS
				// closeOpenedProject(currOpenProject.find(".thumbnailImage"));
				// currOpenProject.find(".projectThumbnailHover").fadeOut(800, function(){currOpenProject.find(".projectThumbnailHover").css("visibility", "visible");});
				return false;
			} else {
				closeOpenedProject(currOpenProject.find(".thumbnailImage"));
				currOpenProject.find(".projectThumbnailHover").fadeOut(800, function(){currOpenProject.find(".projectThumbnailHover").css("visibility", "visible");});
			}
		}
		currOpenProject = projectEl;
		openedProjectInfo = newOpenProjectInfo.stop().delay(200).slideDown(900).data('project-open', true);
		currOpenProject.find(".projectThumbnailHover").fadeOut(200, function(){currOpenProject.find(".projectThumbnailHover").css("visibility", "hidden");});
	});

	$(".closeButton, #aboutPage, #logo").click(function() {
		// Add a delay to fix weird issue with resizing About page
		function closeSlider() {
			if(openedProjectInfo && currOpenProject) {
				closeOpenedProject(currOpenProject.find(".thumbnailImage"));
				currOpenProject.find(".projectThumbnailHover").css("visibility", "visible");
			}
		}
		//setTimeout(closeSlider, 400);
		setTimeout(closeSlider, 1);

	});

});

// Theme switcher
// =================================================================================================
function changeTheme() {
	$(".thumbnailMask").css("background-image", "none");
	$("#shapeSelector").val('1');
	$('#colorTheme').attr('href', $('#colorSelector').val());
	$('#typeTheme').attr('href', $('#typeSelector').val());
}

function changeShape() {
	function hexc(colorval)
	{
		var parts = colorval.match(/^rgb\((\d+),\s*(\d+),\s*(\d+)\)$/);
		delete(parts[0]);
		for (var i = 1; i <= 3; ++i) {
			parts[i] = parseInt(parts[i]).toString(16);
			if (parts[i].length == 1) parts[i] = '0' + parts[i];
		}
		color = parts.join('');
	}
	var color = '';
	var x = $("body").css("background-color");
	hexc(x);
	$(".thumbnailMask").css("background-image", "url('images/masks/" + color + "_" + $('#shapeSelector').val() + ".png')");
}
