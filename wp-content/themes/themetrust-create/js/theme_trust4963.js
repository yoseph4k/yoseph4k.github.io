var $j = jQuery.noConflict();
    windowHeight 	= $j(window).height(),
	adminOffset 	= $j('body').hasClass('admin-bar') ? 32 : 0,
    navOffset       = $j('#logo').outerHeight(),
    bannerType      = $j('.top-banner').attr('id'),
	scroll 			= $j(window).scrollTop(),
    navHeight       = $j("#main-nav").height(),
    finalOffset     = navOffset + adminOffset,
	headerBreakPoint = 0,
	headerContentWidth = 0,
	mobileBreakPoint = 780,
	masonry        = $j('.masonry').length,
	parallaxSkroll = false,
	breakpoints     = {
        "Large": [9999, 3], // *3* columns for all larger screens
        "Medium":[800, 2], // For *Medium* screens of *1100 to 700*, set Isotope to *2* columns
        "Small": [500,  1] // For *Small* screens below *700*, set Isotope to *1* column
    };


/**
* Mobile Detection
*/

var isMobile = {
    Android: function() {
        return navigator.userAgent.match(/Android/i);
    },
    BlackBerry: function() {
        return navigator.userAgent.match(/BlackBerry/i);
    },
    iOS: function() {
        return navigator.userAgent.match(/iPhone|iPad|iPod/i);
    },
    Opera: function() {
        return navigator.userAgent.match(/Opera Mini/i);
    },
    Windows: function() {
        return navigator.userAgent.match(/IEMobile/i);
    },
    any: function() {
        return (isMobile.Android() || isMobile.BlackBerry() || isMobile.iOS() || isMobile.Opera() || isMobile.Windows());
    }
};

/**
* Check if browser is IE
*/
function isIE(){
	var ua = window.navigator.userAgent;
	    var msie = ua.indexOf("MSIE ");

	    if (msie > 0 || !!navigator.userAgent.match(/Trident.*rv\:11\./))  // If Internet Explorer, return version number
	    {
	        ie = true;
	    }
	    else  // If another browser, return 0
	    {
	        ie = false;
	    }

	    return ie;
}

/**
* Check if browser is Edge
*/

function isEdge(){
	
	if (document.documentMode || /Edge/.test(navigator.userAgent)) {
		$j('body').addClass('ie');
		return true;
	}
}


/**
* Header Setup
*/
function menuSetup(){  
    // Misc.
    // -- Hover menus
    $j('ul.sf-menu').superfish({
		cssArrows:     false,
	});
}


/**
 * Masonry Blog Initialization
 *
 * Check to see if the layout mode is set to masonry, and
 * defaults to fitRows if the .masonry class is not found.
 * Initializes Isotope on the $gridContainer var
 */

function initMasonryBlog() {
	var gridContainer = $j('.blog .masonry');
	if(gridContainer.length){
		gridContainer.each(function(){
			var $this = $j(this);
			$this.waitForImages(function(){
				
                $this.isotope({
					itemSelector: '.post.small',
					resizable: true,
					masonry: {
						columnWidth: ''
					}
				});
				$j('.post.small').addClass('show');
			});
		});
	}
}



/**
 * Filter Navigation
 *
 * Binds the Isotope filtering function to clicks on the
 * portfolio filter links using the data-filter attribute
 */

function filterInit() {
	var $filterNavA = $j( '#filter-nav a' );
	$filterNavA.click( function(){
		var selector = $j(this).attr( 'data-filter' );
		$j(this).parents( '.projects' ).find('.thumbs').isotope({filter: selector});
		if ( ! $j(this).hasClass( 'selected' ) ) {
			$j(this).parents( '#filter-nav' ).find( '.selected' ).removeClass( 'selected' );
			$j(this).addClass( 'selected' );
		}
		return false;
	});
}

/**
 * Portfolio Initialization
 *
 * Check to see if the layout mode is set to masonry, and
 * defaults to fitRows if the .masonry class is not found.
 * Initializes Isotope on the $gridContainer var
 */

function initPortfolio() {
	var gridContainer = $j('.projects .thumbs');
	if(gridContainer.length){
		
		masonryProjectResize();
		
		gridContainer.each(function(){
			var $this = $j(this);
			$this.waitForImages(function(){
				
                $this.isotope({
					itemSelector: '.project.small',
					resizable: false,
					masonry: {
						columnWidth: '.grid-sizer'
					}
				});
				$j('.projects .thumbs .project.small').addClass('show');
			});
		});
	}
}

/**
 * Resize Masonry Grid Items
 *
 */

function masonryProjectResize() {
	if($j('.masonry-with-gutter').length || $j('.masonry-without-gutter').length){
	var defaultSize = $j('.projects .grid-sizer').width();
	var projectDefault = $j('.projects .project.small');
	var projectMasonryDefault = $j('.projects .masonry-default');	
	var projectMasonryWide = $j('.projects .masonry-wide');
	var projectMasonryTall = $j('.projects .masonry-tall');
	var projectMasonryWideTall = $j('.projects .masonry-wide_tall');
	
	projectDefault.css('height', defaultSize);
    projectMasonryDefault.css('height', defaultSize);
	projectMasonryWide.css('height', defaultSize);
	projectMasonryTall.css('height', defaultSize*2);
	projectMasonryWideTall.css('height', defaultSize*2);
	projectMasonryWideTall.css('width', defaultSize*2);
	}
}


/*
 **	Load More Projects
 */

function loadMoreProjects(){
    if($j('.projects .load-more-button').length){
	
    var i = 1;

    $j('.load-more-button a').on('click', function(e)  {
        e.preventDefault();
		
		var gridContainer = $j('.projects .thumbs');
        var link = $j(this).attr('href');
        var $content = '.projects .thumbs';
        var $anchor = '.projects .load-more-button a';
        var $next_href = $j($anchor).attr('href'); // Get URL for the next set of projects
		var loadMoreButton = $j('.projects .load-more-holder .load-more-button');
		var loading   = $j('.projects .load-more-holder .loading');

		loadMoreButton.addClass('hidden');
		loading.removeClass('hidden');
		
        $j.get(link+'', function(data){
            

            var $new_content = $j($content, data).wrapInner('').html(); // Load only the projects
            $next_href = $j($anchor, data).attr('href'); // Get the new href

            $j($content, data).waitForImages(function() {

                $j('.projects .thumbs .project.small:last').after($new_content); // Append the new projects
				 
				masonryProjectResize();
				gridContainer.isotope( 'on', 'layoutComplete',
				  function( laidOutItems ) {
				    $j('.project.small:not(.show)').addClass('show');
				  }
				);
				
				setTimeout(function(){
				    gridContainer.isotope('reloadItems').isotope();
				},200);
               
                if($j('.load-more-button').data('rel') > i) {
                    $j('.load-more-button a').attr('href', $next_href); // Change the next URL
                } else {
                    $j('.load-more-button').remove();
                }
                
				loadMoreButton.removeClass('hidden');
				loading.addClass('hidden');
            });
        });
        i++;
    });
	}
}



/**
* Slide Nav Setup
*/

function initSlideMenu(){
	var siteContainer = $j('#site-wrap');
	slideMenu = $j('#slide-panel');
	slideMenuWidth = slideMenu.outerWidth();
	$j('.menu-toggle.open').on('click', function () {
		slideMenu.css('transform', 'translateX(0)');		
	});
	$j('#menu-toggle-close').on('click', function () {		
		slideMenu.css('transform', 'translateX(' + slideMenuWidth + 'px)');		
	});
	var browserWidth = $j(window).width();
	if(isMobile.any() && browserWidth < 768) {
		var browserWidth = $j(window).width();
		slideMenuWidth = browserWidth;
		slideMenu.css('width', browserWidth + 'px');
	}
	slideMenu.css('transform', 'translateX(' + slideMenuWidth + 'px)');	
	slideMenu.css('visibility', 'visible');	
}

/**
 * Mobile Menu Submenus
 * Set collapsable submenus.
 */
// Toggle sub menus
function initMobileSubMenus(){
	jQuery( "#slide-panel nav" ).find( "li.menu-item-has-children" ).click( function(){
		jQuery( "#slide-panel nav" ).not( this ).find( "ul" ).next().slideToggle( 100 );
		jQuery( this ).find( "> ul" ).stop( true, true ).slideToggle( 100 );
		jQuery( this ).toggleClass( "active-sub-menu" );
		return false;
	});

	// Don't fire sub menu toggle if a user is trying to click the link
	jQuery( ".menu-item-has-children a" ).click( function(e) {
		e.stopPropagation();
		return true;
	});
}



/**
* Header Search Setup
*/

function initHeaderSearch(){
	var headerSearchBar = $j('.header-search');
	$j('.search-toggle.open').on('click', function () {
		headerSearchBar.addClass('open');
		$j(this).closest('header').find('#s').focus();	
	});
	$j('.search-toggle.close').on('click', function () {
		headerSearchBar.removeClass('open');		
	});
}

/**
* Single Page Nav Links
*/

function initSinglePageNav(){
	
	lastId = "";
	topMenu = $j('.top-header #site-header .main-nav');
	headerHeight = $j('.top-header #site-header').height();
	adminBarHeight = $j('body').hasClass('admin-bar') ? 32 : 0;
	var browserWidth = $j(window).width();
	if(isMobile.any() && browserWidth < 768) {
		scrollOffest = 0;
	}else{
		scrollOffest = adminBarHeight + headerHeight - 10;
	}
	
	// All list items
	menuItems = topMenu.find("a");
	// Anchors corresponding to menu items
	scrollItems = menuItems.map(function(){
	   var target = this.hash.replace(/^.*#/, '');
	   var item = $j('div[data-row-id="'+target+'"]');
	   if (item.length) { return item; }
	});
	
	$j('.main-nav a[href^="#"], #slide-mobile-menu a[href^="#"]').click(function(e) {
	    e.preventDefault();
		var target = this.hash.replace(/^.*#/, '');
		var targetElement = $j('div[data-row-id="'+target+'"]');
		if(targetElement.length) {
			// Shut the slide panel if it is open
			slideMenu.css('transform', 'translateX(' + slideMenuWidth + 'px)');
		}
	   $j(window).scrollTo(targetElement, {duration:500, interrupt:false, offset: -(scrollOffest-15) });
	 });	
}

function singlePageNavScroll(){
	// Get container scroll position
	
	var fromTop = $j(this).scrollTop()+scrollOffest+140;
	
	// Get id of current scroll item
	var cur = scrollItems.map(function(){
	if ($j(this).offset().top <= fromTop)
		return this;
	});
	// Get the id of the current element
	cur = cur[cur.length-1];
	
	
	var id = cur && cur.length ? cur.data("rowId") : "";

	if (lastId !== id) {
		//alert(cur.data("rowId"));
	    lastId = id;
	    // Set/remove active class
	    menuItems
	      .parent().removeClass("active")
	      .end().filter("[href=#"+id+"]").parent().addClass("active");
	}
}

/**
* Init lightbox links
*/

function initLightbox(){
	$j("a[data-rel^='prettyPhoto']").prettyPhoto({
		hook: 'data-rel',
		social_tools:'',
		autoplay: false,
		show_title: false,
		deeplinking: false,
		overlay_gallery: false,
		markup: '<div class="pp_pic_holder"> \
								<div class="ppt">&nbsp;</div> \
								<div class="pp_top"> \
									<div class="pp_left"></div> \
									<div class="pp_middle"></div> \
									<div class="pp_right"></div> \
								</div> \
								<div class="pp_content_container"> \
									<div class="pp_left"> \
									<div class="pp_right"> \
										<div class="pp_content"> \
											<div class="pp_loaderIcon"></div> \
											<div class="pp_fade"> \
												<a href="#" class="pp_expand" title="Expand the image">Expand</a> \
												<div class="pp_hoverContainer"> \
													<a class="pp_next" href="#"></a> \
													<a class="pp_previous" href="#"></a> \
												</div> \
												<div id="pp_full_res"></div> \
												<div class="pp_details"> \
													<p class="currentTextHolder">0/0</p> \
													<a class="pp_close" href="#"></a> \
												</div> \
											</div> \
										</div> \
									</div> \
									</div> \
								</div> \
								<div class="pp_bottom"> \
									<div class="pp_left"></div> \
									<div class="pp_middle"></div> \
									<div class="pp_right"></div> \
								</div> \
							</div> \
							<div class="pp_overlay"></div>',
	});
}

/**
* Parallax
*/

function initParallax(){
		
	if(isEdge()){
		return false;
	}	
		
	$j( '.parallax-inner' ).remove();
	$j( '.parallax-section' ).each( function () {
		var skrollrSpeed,
			skrollrSize,
			skrollrStart,
			skrollrEnd,
			parallaxSectionId,
			$parallaxElement,
			parallaxSectionHeight,
			parallaxImage;
		parallaxSectionId = $j( this ).data( 'parallaxId' );
		parallaxSection = $j( this );
		var pOffset = parallaxSection.offset(); //Get the offset of the parallax section
		var pOffsetTop = pOffset.top;
		$parallaxElement = $j( '<div />' ).addClass( 'parallax-inner' ).appendTo( $j( this ) );
		
		if(pOffsetTop<100){
			parallaxSection.addClass('top');
		}
		$parallaxElement.attr('data-parallax', '{"y": 530, "distance": 2000, "smoothness": 0}');
		
		parallaxImage = $j( this ).data( 'parallaxImage' );
		if ( parallaxImage !== undefined ) {
			//$parallaxElement.backstretch(parallaxImage);
			$parallaxElement.css( 'background-image', 'url(' + parallaxImage + ')' );
		}
		
		if ( !isMobile.any()) {
		
		}
	});
	
}


function ieParallax(){	
	$j( '.parallax-section' ).each( function () {
		var parallaxSection = $j(this);
		parallaxSection.css({'background-attachemnt' : 'fixed'});
	});
}

function parallaxRefresh() {
	if(parallaxSkroll){
		parallaxSkroll.refresh();
	}
}

function parallaxRefreshDelayed() {
	setTimeout(parallaxRefresh, 400);
}


/**
* Sticky Header
*/

function initStickyHeader(){
	if ($j("body").hasClass("sticky-header") && !isMobile.any() ) {	
		$j("#main-container").before($j("#site-header").clone().addClass("sticky").removeClass("stacked").removeClass("main").removeClass("transparent"));
	}
}

function stickyHeader(){	
	var fromTop = $j(document).scrollTop();
	$j('body').toggleClass("down", (fromTop > 200));
}

/**
* Transparent Header
*/

function transparentHeader(){
	var transparentHeader = $j('#site-header.transparent');	
	transparentHeader.waitForImages(function() {
		var headerHeight = transparentHeader.height();
		$j('body header.entry-header.main .title').css('margin-top', headerHeight);
	});
}

/**
* Megamenu width
*/

function megamenuWidth(){
	var headerWidth = $j('#site-header .logo-and-nav').outerWidth();
	$j('.mega-menu.full-width ul').css('width', headerWidth+'px');
}


/**
* Equal Height Page Builder Columns
*/
function equalizePageBuilderColumnHeights(){
	if($j(window).width() > mobileBreakPoint){
		
	var tallestColumnHeight = 0;
	var currentColumnHeight = 0;
	var currentColumn;
	var columns = [];
	var lastRow = "";
	$j(".panel-grid .equal-column-height .panel-grid-cell:not(.panel-grid-cell .panel-grid-cell)").each(function(intIndex) {
		
		currentColumn = $j('.so-panel.widget:first', this);
		var currentRow = currentColumn.closest(".panel-grid").attr("id");
		
		if(currentRow != lastRow) {
			lastRow = currentRow;
			tallestColumnHeight = 0;
			currentColumnHeight = 0;
			columns = [];
		}
		
		currentColumn.find('div:first').css('min-height', '0');
		currentColumnHeight = currentColumn.height();
		
		if(currentColumnHeight >= tallestColumnHeight){
			tallestColumnHeight = currentColumnHeight;
			
		}
		columns.push(currentColumn);
		$j.each(columns, function() {
			$j(this).find('div:first').css('min-height', tallestColumnHeight);
		});
		
	});
	}
	
	if(isIE()){
		$j(".v-center").each(function() {
			var outerHeight = $j(this).height();
			var inner = $j(this).find("div:first");
			var innerHeight = inner.height();
			var topOffset = (outerHeight/2) - (innerHeight/2);
			inner.css('margin-top', topOffset);
		});
	};
}


/**
* Scroll to top button
*/

function initScrollToTopButton(){
	if($j('#scroll-to-top')){
		$j('#scroll-to-top').click(function(e) {	
			$j(window).scrollTo(0, {duration:500, interrupt:false });
		})
	}
}

function scrollToTopButton(){
	if($j('#scroll-to-top')){	
		var fromTop = $j(document).scrollTop();
		$j('#scroll-to-top').toggleClass("active", (fromTop > 200));
	}
}


/**
* Set poster image for background videos in Slider Revolution
*/
function revSliderMobilePoster() {
	var mobile = 'ontouchend' in window;
	 $j('.tp-videolayer').each(function() {
	 	var $this = $j(this);
	 	if(!mobile) {
	 		// to keep the video poster for desktop, comment out or remove the line below
	 		$this.attr('data-videoposter', '');
	 		return;
	 	}
	 	$this.removeClass('fullscreenvideo tp-videolayer').addClass('mobile-video-fallback-image').css(
	 		'background-image', 'url(' + $this.attr('data-videoposter') + ')'
	 	);
	 });
}

/**
* Fix mouse wheel zoom on Google Maps
*/
function fixGoogleMapMouseWheelZoom() {
	$j('.sow-google-map-canvas').addClass('scroll-off'); // set the pointer events to none on doc ready
	$j('.widget_sow-google-map').on('click', function () {
		$j('.sow-google-map-canvas').removeClass('scroll-off'); // set the pointer events true on click
	});
	// disable pointer events when the mouse leave the canvas area;
	$j(".widget_sow-google-map").mouseleave(function () {
		$j('.sow-google-map-canvas').addClass('scroll-off'); // set the pointer events to none when mouse leaves the map area
	});
}


/**
* Fade out preloader
*/
$j(window).load(function(){
	$j('body').addClass('loaded');
	$j('#loader-container').one('webkitTransitionEnd otransitionend oTransitionEnd msTransitionEnd transitionend', function(e) {
	  $j('#loader-container').addClass('finished');
	});
})


/**
* Fix mouswheel scroll in IE for fixed backgrounds
*/

if(navigator.userAgent.match(/Trident\/7\./)) { // if IE
        $j('body').on("mousewheel", function () {
            // remove default behavior
            event.preventDefault(); 

            //scroll without smoothing
            var wheelDelta = event.wheelDelta;
            var currentScrollPosition = window.pageYOffset;
            window.scrollTo(0, currentScrollPosition - wheelDelta);
        });
}


/**
* Initialize Everything
*/

$j(document).ready(function(){
	isEdge();
	initStickyHeader();
	initSlideMenu();
	transparentHeader();
    $j(".content-area").fitVids();		
	menuSetup();																				
	filterInit();		
	loadMoreProjects();
	initSinglePageNav();
	initLightbox();
	initHeaderSearch();
	megamenuWidth();
	initMobileSubMenus();
	revSliderMobilePoster();
	initScrollToTopButton();
	fixGoogleMapMouseWheelZoom();
	
	//Scroll events
	$j(window).scroll(function() {		
		if(!isMobile.any()){
			stickyHeader();
		}
		singlePageNavScroll();
		scrollToTopButton();
	});
	
	
	$j(window).bind('resize', function(e)
	{
	    window.resizeEvt;
	    $j(window).resize(function()
	    {
	        clearTimeout(window.resizeEvt);
	        window.resizeEvt = setTimeout(function()
	        {
				initPortfolio();
				equalizePageBuilderColumnHeights();
				megamenuWidth();
				if(!isMobile.any() && parallaxSkroll){
					parallaxSkroll.refresh();
				}
				
	        }, 250);
	    });
	});
	
});

$j(window).load(function(){
	initMasonryBlog();
	initPortfolio();
	equalizePageBuilderColumnHeights();
	if(!isMobile.any() && !isIE()){
		initParallax();
	}
	if(isIE() || isEdge()){
		ieParallax();
	}
	singlePageNavScroll();
	parallaxRefreshDelayed();
})