if( ! jQuery ){
	var jQuery = $;
}

var wmts = { };
wmts.showcase = { };
var wmts_anims;

jQuery( function( $ ){

	// defer load images for page speed
	wmts.defer_loading_lock = true;

	wmts.defer_loading_end = function(){
		if( wmts.defer_loading_lock ){
			wmts.defer_loading_lock = false;

			var $showcases = $('.wmts_container.wmts_defer_load_images');
			$showcases.each( function( ){
				wmts.manage_images( $(this) );
			})
		}
	}

	$(window).one('scroll touchmove mousemove', function(){
		wmts.defer_loading_end();
	})

	setTimeout(function(){
		wmts.defer_loading_end();
	}, 5000);

	// manage images
	wmts.manage_images = function( $container ){

		// iterate over all images
		var $images = $( '.wmts_image_centering img, .wmts_image_centering .wph_lazy_load_image_placeholder', $container ),
			total_images = $images.length;

		$images.each( function( ){
			var 	$this = $( this ),
					$parent = $this.parent( ),
					rounded = $parent.hasClass( 'wmts_rounded' );

			// replace placeholders with images
			if( $this.is( 'div' ) ){
				var lazy_load_source = $this.attr( 'data-wmts-lazysrc' ) ? " data-wmts-lazysrc='" + $this.attr( 'data-wmts-lazysrc' ) + "' " : '';

    			var $image = $('<img class="wph_element wmts_element" src="'+ $this.attr( 'data-src' ) +'" '+ lazy_load_source +' width="'+ $this.attr( 'data-width' ) +'" height="'+ $this.attr( 'data-height' ) +'" data-wph-type="'+ $this.attr( 'data-wph-type' ) +'" data-wph-elm="'+ $this.attr( 'data-wph-elm' ) +'" />');
    			$this.replaceWith( $image );
    			$this = $image;
			}

			// kill transitions
			$this.addClass('wmts_kill_transition');

			// to setup round image the parent needs to be a square first
			if( rounded ){
				$parent.width( '' );
				var parent_width = $parent.width();
				$parent.height( parent_width );
			}

			// center image
			var 	parent_width = $parent.width( ),
					parent_height = $parent.height( ),
					parent_ratio = parent_width / parent_height,

					image_width = $this.attr('width'),
					image_height = $this.attr('height'),
					image_ratio = image_width / image_height;

			// image is proportionately wider than parent
			if( image_ratio > parent_ratio ){
				$this.css( { 'width': parent_height * image_ratio + 'px', 'height': parent_height + 'px', 'max-width': 'none' } );
				$this.css( { 'left': ( parent_width - $this.width() ) / 2 +'px', 'top': '0' } );
			// image is proportionately taller than parent
			}else{
				$this.css( { 'width': parent_width + 'px', 'height': parent_width / image_ratio + 'px', 'max-height': 'none' } );
				$this.css( { 'left': '0', 'top': ( parent_height - $this.height() ) / 2 +'px' } );
			}

			// esccape batching
			setTimeout(function(){
				$this.removeClass('wmts_kill_transition');
			}, 1);

			// if all images are loaded, present the showcase
			total_images--;
			if( ! total_images && $container.hasClass('wmts_container') ){
				$container.addClass( 'wmts_loaded' );
			}

		} )
	}

	// search
	$( 'body' ).on( 'click', '.wmts_search_submit', function( e ){
		var 	$this = $( this );

		if( $( e.target ).is( '.fa-times' ) ){
			$this.siblings( 'input' ).val( '' );
			$this.siblings( 'select' ).children( ).first( ).attr( 'selected', 'selected' ).siblings( ).removeAttr( 'selected' );
			$this.addClass( 'wmts_cleared' );
		}

		var name = $this.siblings( '.wmts_search_input_name' ).val( ),
				category = $this.siblings( '.wmts_search_select_category' ).val( ),
				data = { name: name, category: category },
				$showcase = $this.closest( '.wmts_container' );

		wmts_modify_showcase_input( { filters: null, search: data, pagination: 1 }, $showcase );
		wmts_ajax( 'wmts_query', $this, data, wmts_search_beforeSend, wmts_search_complete );
	} )

	function wmts_search_beforeSend( $this ){
		// start spinner
		$this.addClass( 'wmts_loading' );
		$this.removeClass( 'wmts_init' );
	}

	function wmts_search_complete( $this ){
		// clear members
		$this.closest( '.wmts_container' ).find( '.wmts_members' ).empty( );

		// end spinner
		$this.removeClass( 'wmts_loading' );
		if( ! $this.hasClass( 'wmts_cleared' ) )
			$this.addClass( 'wmts_init' );
		$this.removeClass( 'wmts_cleared' );

		// mark the terms
		var 	$search_container = $this.closest( '.wmts_search' ),
				$search_input_name = $search_container.find( '.wmts_search_input_name' ),
				$search_select_category = $search_container.find( '.wmts_search_select_category' );

		$search_container.data( 'wmts-search-name', $search_input_name.val( ) );
		$search_container.data( 'wmts-search-category', $search_select_category.val( ) );
	}

	// search by pressing enter
	$( 'body' ).on( 'keydown', '.wmts_search_input_name', function( e ){
		if (e.keyCode == 13) {
			e.preventDefault( );
			e.stopPropagation( );
			$( this ).siblings( '.wmts_search_submit' ).click( );
		}
	});

	// clear search
	$( 'body' ).on( 'click', '.wmts_clear_search_trigger', function( e ){
		e.preventDefault( );
		var 	$this = $( this ),
				$showcase = $this.closest( '.wmts_container' ),
				$clear_button = $showcase.find( '.wmts_search_submit .fa-times' );
		$clear_button.click( );
	} )

	// reset filters
	$( 'body' ).on( 'click', '.wmts_clear_filter_trigger', function( e ){
		e.preventDefault( );
		var 	$this = $( this ),
				$showcase = $this.closest( '.wmts_container' ),
				$filter_sets = $showcase.find( '.wmts_filters' ),
				$last_filter_set = $filter_sets.last( );

		$filter_sets.each( function( ){
			var $this = $( this );
			$( this ).find( '.wmts_selected_filter' ).removeClass( 'wmts_selected_filter' ).find( 'i' ).remove( );
			if( ! $this.is( $last_filter_set ) ){
				$this.find( '.wph_filter:first' ).addClass( 'wmts_selected_filter' ).each( function( ){
					var $_this = $( this );
					$_this.find( 'i' ).remove( );
					$_this.prepend( '<i class="fa fa-spin fa-refresh"></i>' );
				} );
			}else{
				$this.find( '.wph_filter:first' ).click( ); // trigger ajax call
			}
		} )

	} )

	// storing the user input data
	function wmts_modify_showcase_input( data, $showcase ){
		var showcase_data = $showcase.data( 'wmtsUserInput' ) || {},
				modified_data = $.extend( { }, showcase_data, data );
		$showcase.data( 'wmtsUserInput', modified_data );
	}

	// pagination
	$( 'body' ).on( 'click', '.wmts_pagination a, .wmts_pagination span, .wmts_pagination .wph_pagination_load_more', function( e ){

		e.preventDefault( );
		var $this = $( this ),
				$showcase = $this.closest( '.wmts_container' );

		// load more button
		if( $this.is( '.wph_pagination_load_more' ) ){
			var current_pagination = parseInt( Math.max( $this.attr( 'data-wph-paged' ), 1 ) + 1 ),
					data = { current_pagination: current_pagination };
			wmts_modify_showcase_input( { pagination: current_pagination }, $showcase );
			wmts_ajax( 'wmts_query', $this, data, wmts_pagination_beforeSend, wmts_pagination_complete );
			return;
		}

		// prev
		if( $this.hasClass( 'prev' ) ){
			var $current = $this.siblings( '.current' );
			if( $current.length ){
				var $current_prev = $current.prev( );
				if( $current_prev.hasClass( 'dots' ) ) // ellipses
					$current_prev = $current_prev.prev( );
				if( ! $current_prev.is( $this ) ){
					$current_prev.click( );
				}
			}
			return;
		}

		// next
		if( $this.hasClass( 'next' ) ){
			var $current = $this.siblings( '.current' );
			if( $current.length ){
				var $current_next = $current.next( );
				if( $current_next.hasClass( 'dots' ) ) // ellipses
					$current_next = $current_next.next( );
				if( ! $current_next.is( $this ) ){
					$current_next.click( );
				}
			}
			return;
		}

		if( $this.hasClass( 'dots' ) ) return;

		// numbered links
		if( $this.hasClass( 'current' ) || $this.closest( '.wmts_pagination' ).children( '.wmts_loading' ).length ) return;
		$this.addClass( 'current wmts_loading' );
		$this.siblings( ).removeClass( 'current' );
		var 	current_pagination = $this.text( ),
				data = { current_pagination: current_pagination };

		wmts_modify_showcase_input( { pagination: current_pagination }, $showcase );
		wmts_ajax( 'wmts_query', $this, data, wmts_pagination_beforeSend, wmts_pagination_complete );

	} )

	function wmts_pagination_beforeSend( $this, data ){

		var 	$showcase = $this.closest( '.wmts_container' ),
				$search_container = $showcase.find( '.wmts_search' ),
				overall_settings = $showcase.data( 'wmts-overall-settings' );

		// search terms
		if( $search_container.find( '.wmts_search_input_name' ) ) data.name = $search_container.find( '.wmts_search_input_name' ).val( ) || $search_container.data( 'wmts-search-name' );
		if( $search_container.find( '.wmts_search_select_category' ) ) data.category = $search_container.find( '.wmts_search_select_category' ).val( ) || $search_container.data( 'wmts-search-category' );

		// pagination terms
		data.pagination_type = overall_settings[ 'pagination_type' ];
		if( overall_settings[ 'pagination_type' ] === 'load_more' )
			data.load_more_text = overall_settings[ 'load_more_text' ];

		$this.addClass( 'wmts_loading' );
		$this.append( '<i class="fa fa-refresh fa-spin"></i>' );
		$this.closest( '.wmts_container' ).find( '.wmts_members' ).addClass( 'wmts_loading' );
	}

	function wmts_pagination_complete( $this ){
		var $showcase = $this.closest( '.wmts_container' );
		// 		$page_numbers = $this.find( '.page-numbers' ),
		// 		current_pagination = $this.data( 'wmtsUserInput' )[ 'pagination' ];
		//
		// $page_numbers.eq( current_pagination - 1 ).addClass( '' )
		$showcase.find( '.wmts_members' ).removeClass( 'wmts_loading' );
	}

	// ajax
	function wmts_ajax( action, $this, data, beforeSend, success ){
		var 	$showcase = $this.closest( '.wmts_container' ),
				post_id = $showcase.attr( 'data-wph-post-id' );

		data = $.extend( { }, { action: action, post_id: post_id }, data );
		if( typeof beforeSend === 'function' ) beforeSend( $this, data ); // moved up because data cannot be manipulated inside ajax beforeSend( )

		// backend will use these settings instead of saved ones in case admin has applied new settings and is testing pagination or search without saving
		if( typeof wmts_backend_nonce !== 'undefined' ){
			data.wmts_backend_nonce = wmts_backend_nonce;
			data.overall_settings = $showcase.data( 'wmts-overall-settings' );
			data.query = $showcase.data( 'wmts-query' );
			data.template = $showcase.data( 'wmts-template' );
			data.device_settings = $showcase.data( 'wmts-device-settings' );
		}
		data.wmts_user_input = $showcase.data( 'wmtsUserInput' );

		// ajax
		$.ajax( {
			type : "post",
			dataType : "json",
			url : wmts_ajax_url,
			data : data,
			success: function( response ){
				if( typeof success === 'function' ) success( $this );
				wmts_ajax_success_callback( $showcase, response );
			},
			complete: function( ){
				// if( typeof complete === 'function' ) complete( $this );
			}
		} );

	}

	// apply showcase markup returned by ajax
	function wmts_ajax_success_callback( $showcase, response ){

		// replace members
		var $members_container = $showcase.children( '.wmts_members' ),
				$filters_container = $showcase.children( '.wmts_filters' ),
				$search_container = $showcase.children( '.wmts_search' ),
				$pagination_container = $showcase.children( '.wmts_pagination' ),
				current_scroll = document.documentElement.scrollTop || document.body.scrollTop,
				user_input = $showcase.data( 'wmtsUserInput' );

		// remove backslashes
		$.each( response.markup, function( key, val ){
			if( typeof val === 'string' ){
				response.markup[ key ] = val.replace(/\\"/g, '"');
				response.markup[ key ] = val.replace(/\\"/g, '"');
			}
		} )

		$members_container.removeClass( 'wmts_loading' );

		if( ! $members_container.length ){ // first time
			$showcase.append( '<div class="wmts_members"></div>' );
			$members_container = $showcase.children( '.wmts_members' );
		}else{
			if( $showcase.children( '.wmts_members' ).data( 'isotope' ) )
				$showcase.children( '.wmts_members' ).isotope( 'destroy' );
		}
		// case of append
		if( typeof $showcase.data( 'wmts-overall-settings' )[ 'pagination' ] !== 'undefined'
			&& $showcase.data( 'wmts-overall-settings' )[ 'pagination' ] === 'Enabled'
			&& $showcase.data( 'wmts-overall-settings' )[ 'pagination_type' ] === 'load_more'
			&& user_input.pagination > 1
		){
			$members_container.append( response.markup.members );
		}else{
			$members_container.html( response.markup.members );
		}

		$showcase.find( '.wmts_selected_filter' ).removeClass( 'wmts_selected_filter' ).find( 'i' ).remove( );


		$( '.wmts_clear_search_trigger_container', $showcase ).remove( );
		$( '.wmts_clear_filter_trigger_container', $showcase ).remove( );
		// no results - add a clear search trigger
		if( ! $showcase.find( '.wmts_member' ).length ){
			if( user_input.search ){ // last action was search
				if( ! $showcase.find( '.wmts_clear_search_trigger' ).length ){
					var clear_search_trigger = $( '<div class="wmts_clear wmts_clear_search_trigger_container"><a href="#" class="wmts_clear_search_trigger">' + response.markup.no_results + '</a></div>' );
					$( '.wmts_members', $showcase ).before( clear_search_trigger );
				}
			}else{
				if( ! $showcase.find( '.wmts_clear_filter_trigger' ).length ){
					var clear_filter_trigger = $( '<div class="wmts_clear wmts_clear_filter_trigger_container"><a href="#" class="wmts_clear_filter_trigger">' + response.markup.no_results + '</a></div>' );
					$( '.wmts_members', $showcase ).before( clear_filter_trigger );
				}
				$( '.wph_filter i', $showcase ).remove( );
			}
		}

		// pagination
		if( response.markup.pagination && $pagination_container.length ){
			$pagination_container.html( response.markup.pagination );
			$pagination_container.removeClass( 'wmts_hide' );
		}else if( ! response.markup.pagination ){
			$pagination_container.addClass( 'wmts_hide' );
		}

		// init
		wmts.showcase.init( $showcase );

		document.documentElement.scrollTop = document.body.scrollTop = current_scroll;

		// ajax complete event
		$showcase.trigger('wmts_ajax_success_callback_complete');
	}

	// pseudo links
	$( 'body' ).on( 'click', '.wmts_element[data-wph-href]', wmts_pseudo_link );
	function wmts_pseudo_link( ){
		var $this = $( this ),
				url = $this.attr( 'data-wph-href' ) || $this.attr( 'href' ) || '',
				target = $this.attr( 'data-wph-target' ) || $this.attr( 'target' ) || '';
		if( url === 'lightbox' ) return;
		if( target === '_blank' ) window.open( url );
		else window.location = url;
	}

	// anim list
	wmts_anims = { };
	wmts_anims.out = {
		'skew_from_left': { x: -50, skewX: '75deg', scale: .8, opacity: 0  },
		'skew_from_right': { x: 50, skewX: '-75deg', scale: .8, opacity: 0 },
		'drop_from_top': { x: 0, y: -50, scale: .8, opacity: 0 },
		'rise_from_bottom': { x: 0, y: 50, scale: .8, opacity: 0 },
		'appear': { opacity: 0 },
		'grow': { scale: .7 },
		'shrink': { scale: 1.3 }
	};

	// prep animation elements with css
	function wmts_prep_anim_elms( $showcase ){
		var anim_elms = wmts_get_anim_elms( $showcase );
		$.each( anim_elms, function( anim, $elm ){
			$elm.css( wmts_anims.out[ anim ] );
		} )
	}

	// animate
	$( '.wmts_container' )
	.on( 'mouseenter.wmts_anim', '.wmts_member', function( ){
		var $this = $( this ),
			anim_elms = wmts_get_anim_elms( $this );
		wmts_anim_in( anim_elms );
	} )
	.on( 'mouseleave.wmts_anim', '.wmts_member', function( ){
		var $this = $( this ),
			anim_elms = wmts_get_anim_elms( $this );
		wmts_anim_out( anim_elms );
	} )

	function wmts_get_anim_elms( $this ){
		return {
			'skew_from_left': $( '.wmts_skew_from_left', $this ),
			'skew_from_right': $( '.wmts_skew_from_right', $this ),
			'drop_from_top': $( '.wmts_drop_from_top', $this ),
			'rise_from_bottom': $( '.wmts_rise_from_bottom', $this ),
			'appear': $( '.wmts_appear', $this ),
			'grow': $( '.wmts_grow', $this ),
			'shrink': $( '.wmts_shrink', $this )
		}
	}

	function wmts_anim_in( anim_elms ){
		$.each( anim_elms, function( anim, $elm ){
			$elm.each( function( ){
				var $this = $( this );
				$this.stop( ).transition( {
					x: 0,
					y: 0,
					scale: [ 1, 1 ],
					opacity: 1,
					skewX: '0deg',
				}, 500 )
			} )
		} )
	}

	function wmts_anim_out( anim_elms ){
		$.each( anim_elms, function( anim, $elm ){
			$elm.stop( ).transition( wmts_anims.out[ anim ] );
		} )
	}

	wmts.showcase = { };

	// init
	wmts.showcase.init = function( $showcase ){
		// resize
		wmts.showcase.resize( $showcase );

		// prep anims
		wmts_prep_anim_elms( $showcase );

		// prevent lightbox opening because of inner links
		var $linkables = $showcase.find( '.wmts_members' ).find( 'a, [data-wph-href]' );
		$linkables.off( 'click.wmts_pseudo_link' );

		$linkables.on( 'click.wmts_pseudo_link', function( e ){
			var $link = $( this );
			if( $link.attr( 'href' ) !== 'lightbox' && $link.attr( 'data-wph-href' ) !== 'lightbox' )
				e.stopPropagation( );
			if( $link.is( '[data-wph-href]' ) ){
				wmts_pseudo_link.call( this );
			}
		} )

		// lightbox
		$("[href='lightbox'], [data-wph-href='lightbox']", $showcase).each(function(){
			var $this = $(this),
				$lightbox = $this.find('.wmts_lightbox');
			if( ! $lightbox.length ){
				$this
					.removeAttr('href')
					.removeAttr('data-wph-href');
			}
		})


		$showcase.magnificPopup( {

				delegate: "[href='lightbox']:visible, [data-wph-href='lightbox']:visible", // the selector for gallery item

				fixedContentPos: true,

				fixedBgPos: false,

				overflowY: 'scroll',

				gallery: {
					enabled:true
				},

				callbacks: {

					elementParse: function( item ){
						item.src = $( item.el ).closest( '.wmts_member' ).find( '.wmts_lightbox' ).first( );
						if( item.src.hasClass('wmts_lightbox_light') ){
							$( '.mfp-wrap' ).addClass( 'wmts_lighbox_light_screen' );
						}
						if( item.src.hasClass('wmts_lightbox_vertical') ){
							$( '.mfp-wrap' ).addClass( 'wmts_lightbox_vertical_screen' );
						}
						$( '.mfp-wrap' ).attr( 'data-wph-post-id', $( item.el ).closest( '.wmts_container' ).attr( 'data-wph-post-id' ) );
						$( 'html' ).addClass( 'wmts_lightbox_active' );
					},

					afterChange: function(){
						var $lightbox = $('.mfp-container .wmts_lightbox'),
							$image_container = $lightbox.find( '.wmts_image_centering' ),
							$image = $image_container.children( 'img' ),
							image_src = $image.attr( 'data-wmts-lazysrc' );

						if( image_src ){
							$image.attr('src', image_src);
						}

						wmts.manage_images( $lightbox );
					},

					open: function( item ){
						$( '.mfp-wrap' ).addClass( 'wmts_lighbox_screen' );
						$( '.wph_editor_body' ).hide( );

						var $lightbox = $('.mfp-container .wmts_lightbox'),
							$image_container = $lightbox.find( '.wmts_image_centering' ),
							$image = $image_container.children( 'img' ),
							image_src = $image.attr( 'data-wmts-lazysrc' );

						if( image_src ){
							$image.attr('src', image_src);
						}

						wmts.manage_images( $lightbox );
					},

					close: function( item ){
						$( '.wph_editor_body' ).show( );
						$( '.mfp-wrap' ).removeClass( 'wmts_lighbox_screen wmts_lighbox_light_screen wmts_lightbox_vertical_screen' );
						$( '.mfp-wrap' ).removeAttr( 'data-wph-post-id' );
						$( 'html' ).removeClass( 'wmts_lightbox_active' );
					}

				}
		} );

		// prevent arrow navigation if contact form is being used
		$( '.wmts_lightbox .wpcf7 input' ).on( 'keydown', function( e ){
			e.stopPropagation( );
		} )

		// filtering
		//-- prep data
		$showcase.find( '.wmts_member' ).each( function(){
			var $this = $( this ),
					cf_data = $this.attr( 'data-wph-filter-cf' );
			if( cf_data && cf_data.length > 3 ){
				cf_data = JSON.parse( cf_data );
				$this.data( 'wph-filter-cf', cf_data );
			}else{
				$this.data( 'wph-filter-cf', {} );
			}
		} )

		//-- event handlers
		$showcase.off( 'click.wmts_filtering' );
		$showcase.on( 'click.wmts_filtering', '.wph_filter:not(.wph_parent_filter)', function( ){
			var $this = $( this ),
					filter = $this.attr( 'data-wph-filter' ),
					$showcase = $this.closest( '.wmts_container' );

			if( $this.hasClass( 'wmts_selected_filter' ) ) return; // already selected

			$this.closest('.wmts_filters').find('.wph_filter').each(function(){
				var $this = $(this),
					$parent = $this.closest('.wph_filter');

				$this.removeClass( 'wmts_selected_filter' );
				$parent.removeClass( 'wmts_selected_child_filter' );
			})

			$this.addClass( 'wmts_selected_filter' ).closest('.wph_parent_filter').addClass('wmts_selected_child_filter');

			var showcase_data = $showcase.data(),
					overall_settings = showcase_data[ 'wmts-overall-settings' ] || showcase_data[ 'wmtsOverallSettings' ];

			if( overall_settings.pagination === 'Enabled' ){
				$this.prepend( '<i class="fa fa-spin fa-refresh"></i>' );
				$showcase.find( '.wmts_members' ).addClass( 'wmts_loading' );
			}

			var filter_data = [];
			$showcase.find( '.wmts_selected_filter' ).each( function( ){
				var $_this = $( this ),
						data = {
							type: $_this.attr( 'data-wph-type' ),
							key: $_this.attr( 'data-wph-filtering-key' ),
							filter: $_this.attr( 'data-wph-filter' )
						};

				if( data.filter === '*' ){
					data.filter = [ ];
					var $siblings = $_this.siblings( '.wph_filter' );
					$siblings.each( function( ){
						data.filter.push( $( this ).attr( 'data-wph-filter' ) );
					} )
					data.all = true; // helps identify this filter as '*'
				}

				filter_data.push( data )
			} )

			wmts_modify_showcase_input( { filters: filter_data, search: null, pagination: 1 }, $showcase );

			if( overall_settings.pagination === 'Enabled' ){
			// server side filtering
				wmts_ajax( 'wmts_query', $this );
				// clear search
				$showcase.find( '.wmts_search_submit' ).removeClass( 'wmts_loading wmts_init' )
				$showcase.find( '.wmts_search_input_name' ).val( '' );
			}else{
			// client side filtering
				$showcase.children( '.wmts_members' ).isotope( { filter: function( ){
					var	$_this = $( this ),
							result = true;
					$.each( filter_data, function( key, curr_filter_data ){

						if( curr_filter_data.all === true ) return; // the 'All' fitler

						if( curr_filter_data.type === 'taxonomy' ){
							var member_tax_val = $_this.attr( 'data-wph-filter-tax-' + curr_filter_data.key );
							if( ! member_tax_val || -1 === $.inArray( curr_filter_data.filter, member_tax_val.split("|") ) ){
								// hide this member
								result = false;
							}
						}else{
						// custom field
							var member_cf_val = $_this.data( 'wph-filter-cf' )[ curr_filter_data.key ];
							if( member_cf_val !== curr_filter_data.filter ){
								result = false;
							}
						}

					} )
					return result;
				} } );
			}
		} )

		// select first filter by default
		$showcase.find( '.wmts_filters' ).each( function( ){
			var $this = $( this ),
					$filters = $this.find( '.wph_filter' ),
					$selected = $this.find( '.wmts_selected_filter' ),
					user_input = $showcase.data( 'wmtsUserInput' );

			if( ! user_input ){
				$filters.first( ).addClass( 'wmts_selected_filter' );
			}else{
				var filter_set_details = false,
						type = $filters.attr( 'data-wph-type' ),
						key = $filters.attr( 'data-wph-filtering-key' );
				if( user_input.filters ){
					$.each( user_input.filters, function( order, curr ){
						if( curr.type === type && curr.key === key ){
							filter_set_details = curr;
						}
					} )
				}
				if( ! user_input.filters || ! filter_set_details || filter_set_details.all === true ){
					$filters.filter( '[data-wph-filter="*"]' ).addClass( 'wmts_selected_filter' );
				}else{
					$filters.filter( '[data-wph-filter="'+ filter_set_details.filter +'"]' ).addClass( 'wmts_selected_filter' );
				}
			}
		} )

		// qTip
		$( '.wmts_tooltip', $showcase ).each( function( ){
			var 	$this = $( this ),
						$member = $this.closest( '.wmts_member' ),
						direction = $this.attr( 'data-wmts-tooltip-dir' ),
						position = {
								my: 'top center',  // Position my top left...
								at: 'bottom center' // at the bottom right of...
							};
			if( direction == 'left' ){
				position = {
						my: 'right center',
						at: 'left center'
					};
			}else if( direction == 'right' ){
				position = {
						my: 'left center',
						at: 'right center'
					};
			}else if( direction == 'top' ){
				position = {
						my: 'bottom center',
						at: 'top center'
					};
			}else if( direction == 'bottom' ){
				position = {
						my: 'top center',
						at: 'bottom center'
					};
			}

			$member.qtip( {
				content: function( ){
					return $this.clone( );
				},
				show: {
					solo: true
				},
				hide: {
					delay: 300,
					fixed: true
				},
				position: position,
				style: {
					classes: 'wmts_tooltip_theme',
					width: $this.attr( 'data-wph-tooltip-width' ) || $member.width( ),
					tip: {
						width: 20,
						height: 10
					}
				}
			} );

		} )

		// showcanse init complete event
		$showcase.trigger('wmts_init_complete');

	}
	// resize
	wmts.showcase.resize = function( $showcase ){

		$showcase.addClass( 'wmts_kill_transition' );

		var $members_container = $showcase.children( '.wmts_members' );
		if( ! $members_container.length ) return;

		// isotope settings
		var  device_settings = wmts.showcase.get_settings( $showcase ).settings,
				overall_settings = $showcase.data( 'wmts-overall-settings' ) || {},
				containerWidth = $showcase.width( ),
				layoutMode = overall_settings.layoutMode ? overall_settings.layoutMode : 'masonry',
				columns = layoutMode == 'vertical' ? 1 : device_settings.columns || 3,
				columnWidth = ( ( containerWidth - 1 ) - ( columns - 1 ) * device_settings.cellSpace ) / columns,
				width = device_settings.width || 1,
				height = device_settings.height || 1,
				rowHeight = columnWidth * height / width,
				isotope_settings = {
					itemSelector: '.wmts_members>.wph_element',
					layoutMode: layoutMode,
					isResizeBound: false,
					isInitLayout: false
				};

		if( ! device_settings.cellSpace ) device_settings.cellSpace = .1;
		// member setting
		var $mc_children = $members_container.children( '.wph_element' );

		$mc_children.outerWidth( columnWidth );

		$mc_children.css( { 'margin-bottom': device_settings.cellSpace } );

		if(typeof device_settings.fontSize !== 'undefined'){
			$mc_children.css( { 'fontSize': device_settings.fontSize +'px' } );
		}

		// height calc
		if( device_settings.height_calc === 'Aspect based' ){
			$mc_children.outerHeight( rowHeight );
		}else{
			$mc_children.height( '' );
		}

		var maxHeight = 0;

		$members_container.children( '.wph_element' ).each(function() {
			var $this = $( this );
			maxHeight = maxHeight > $this.height( ) ? maxHeight : $this.height( );
		});

		isotope_settings[ layoutMode ] = {
			gutter: device_settings.cellSpace || 5,
			rowHeight: maxHeight,
			columnWidth: columnWidth
		}

		// init isotope
		if( $showcase.children( '.wmts_members' ).data( ).isotope ) $showcase.children( '.wmts_members' ).isotope('destroy');
		$showcase.children( '.wmts_members' ).isotope( isotope_settings );
		$showcase.children( '.wmts_members' ).isotope( 'layout' ); // required to get widths before rounding-squaring adjustment

		// loaded
		if( $showcase.data( 'wmts-overall-settings' ).images == 'No' ){
			$showcase.addClass( 'wmts_loaded' );
		}else{
			// display showcase if no images
			var $images = $showcase.find( '.wmts_image_centering > img' ).filter(function(index){
				return ! $(this).closest('.wmts_lightbox').length;
			})
			if( ! $images.length ){
				$showcase.addClass( 'wmts_loaded' );
			}
		}

		// manage images
		if( wmts.defer_loading_lock ){
			if( $showcase.hasClass('wmts_defer_load_images') ){
				// do nothing
			}else{
				wmts.manage_images( $showcase );
			}
		}else{
			wmts.manage_images( $showcase );
		}

		// needs re-init, else won't bind handler to layoutComplete event
		$showcase.children( '.wmts_members' ).isotope( 'destroy' );
		$showcase.children( '.wmts_members' ).isotope( isotope_settings );
		$showcase.children( '.wmts_members' ).isotope( 'on', 'layoutComplete', wmts.showcase.layoutCompleteCallback );
		$showcase.children( '.wmts_members' ).isotope( 'layout' ); // required to get heights after rounding-squaring adjustment

		// re-filter
		if( typeof $showcase.data( 'wmts-overall-settings' )[ 'pagination' ] === 'undefined' || $showcase.data( 'wmts-overall-settings' )[ 'pagination' ] === 'Disabled' ){
			$showcase.find('.wmts_selected_filter').each(function(){
				var $this = $(this),
					filter = $this.attr('data-wph-filter');

				if(filter !== '*'){
					$this
						.removeClass('wmts_selected_filter')
						.trigger('click.wmts_filtering');
				}
			})
		}

		// resize complete trigger
		$showcase.trigger('wmts_resize_complete');
	}

	// layout callback
	wmts.showcase.layoutCompleteCallback= function( o ){
		if( typeof o.element !== 'undefined' ) $( o.element ).closest( '.wmts_container' ).removeClass( 'wmts_kill_transition' );
		else{
			if( typeof o[ 0 ] === 'undefined' ) return;
			$( o[ 0 ].element ).closest( '.wmts_container' ).removeClass( 'wmts_kill_transition' );
		}
	}

	// get settings
	wmts.showcase.get_settings = function( $showcase ){
		var screen_width = $(window).width( ),
				devices_settings = $showcase.data( 'wmts-devices-settings' ),
				device = 'desktop';

		// breakpoints are min.

		if ( screen_width < devices_settings.mobileLandscape.breakpoint ) {
			device = 'mobile';

		} else {

			var devices = [ 'desktop', 'laptop', 'tabletLandscape', 'tablet', 'mobileLandscape'   ];

			$.each( devices, function( index, curr_device ){
				// use device settings if screen width is less than its breakpoint
				if( screen_width > devices_settings[ curr_device ].breakpoint ) {
					device = curr_device;
					return false;
				}
			} )

		}

		devices_settings[ device ].cellSpace = parseFloat( devices_settings[ device ].cellSpace );

		return { 'device': device, 'settings': devices_settings[ device ] };
	}

	// debounce
	wmts.resizeTimer = false;
	var window_width = $( window ).width( );
	$( window ).on( 'resize', function( e ){
		clearTimeout( wmts.resizeTimer );
		wmts.resizeTimer = setTimeout( function( ){
			// resize showcase
			var curr_window_width = $( window ).width( );
			if( curr_window_width !== window_width ){
				window_width = curr_window_width;
				$( '.wmts_container' ).each( function( ){
					wmts.showcase.resize( $( this ) );
				} )
				// re-center lightbox image
				wmts.manage_images( $( '.mfp-content .wmts_lightbox' ) );

			}
		}, 300 );
	});

	// initial process
	function wmts_inital_process( $showcase ){
		wmts_process_data( $showcase );
		wmts_process_fonts( $showcase );
		wmts_process_images( $showcase );
	}

	// create data fields
	function wmts_process_data( $showcase ){
		var attrs = [ 'data-wmts-overall-settings', 'data-wmts-devices-settings' ];
		// covert attributes to data
		$.each( attrs, function( i, attr ){
			attr_val = $showcase.attr( attr ) || '';
			attr_val = attr_val.replace( /safesinglequote/g, "'" );
			var object = JSON.parse( attr_val || '{ }' );
			$showcase.removeAttr( attr );
			$showcase.data( attr.substr( 5 ), object ); // remove 'data-' from string
		} )

		$showcase.data( 'wmts-required-font-count', 1 );
		$showcase.data( 'wmts-required-image-count', 1 );

		$showcase.addClass( 'wmts_data_processed' );
	}

	// init fonts processor
	function wmts_process_fonts( $showcase ){
		// build array of required fonts
		var fonts = $showcase.data( 'wmts-overall-settings' ).fonts;
		if( fonts ){
			fonts = fonts.trim( ).split( ',' );

			var font_count = fonts.length;
			$showcase.data( 'wmts-required-font-count', font_count );
			// load each font
			$.each( fonts, function( i, font ){
				fontSpy( font, {
					success: function( ){
						wmts_font_resolved( $showcase );
					},
					failure: function( ){
						wmts_font_resolved( $showcase );
					}
				} );
			} )
		}else{
			$showcase.data( 'wmts-required-font-count', 0 );
			wmts_init_if_processed( $showcase );
		}
	}

	// a font status was resolved
	function wmts_font_resolved( $showcase ){
		var required_font_count = $showcase.data( 'wmts-required-font-count' ) - 1;
		$showcase.data( 'wmts-required-font-count', required_font_count );
		wmts_init_if_processed( $showcase );
	}

	// init images processor
	function wmts_process_images( $showcase ){

		// need to center images, hence need right dimensions
		wmts.showcase.resize( $showcase );

		var images = $showcase.data( 'wmts-overall-settings' ).images;
		if( images && $showcase.find( 'img' ).length ){
			var images = $showcase.find( 'img' ).filter( function( ){
									return $( this ).css( 'display' ) !== 'none';
								} );
			$showcase.data( 'wmts-required-image-count', images.length );
			images.each( function( ){
				var $this = $( this );
				$this.imagesLoaded( function( ){
					wmts_image_resolved( $showcase );
				} );
			} )
		}else{
			$showcase.data( 'wmts-required-image-count', 0 );
			wmts_init_if_processed( $showcase );
		}
	}

	// an image status was resolved
	function wmts_image_resolved( $showcase ){
		var required_image_count = $showcase.data( 'wmts-required-image-count' ) - 1;
		$showcase.data( 'wmts-required-image-count', required_image_count );
		wmts_init_if_processed( $showcase );
	}

	// init showcase if everything is processed
	function wmts_init_if_processed( $showcase ){
		var 	required_font_count = $showcase.data( 'wmts-required-font-count' ) || 0,
				required_image_count = $showcase.data( 'wmts-required-image-count' ) || 0;
		if( ! required_font_count && ! required_image_count ){
			wmts.showcase.init( $showcase );
		}
	};

	// init all containers
	$( '.wmts_container' ).each( function( ){
		var $showcase = $( this );
		wmts_inital_process( $showcase );
	} )

	// returns 1 if v1 > v2. And -1 if v1 < v2
	function wmts_compare_version_numbers(v1, v2){
		var v1parts = v1.split('.');
		var v2parts = v2.split('.');

		function isPositiveInteger(x) {
			return /^\d+$/.test(x);
		}

		// First, validate both numbers are true version numbers
		function validateParts(parts) {
			for (var i = 0; i < parts.length; ++i) {
				if (!isPositiveInteger(parts[i])) {
					return false;
				}
			}
			return true;
		}
		if (!validateParts(v1parts) || !validateParts(v2parts)) {
			return NaN;
		}

		for (var i = 0; i < v1parts.length; ++i) {
			if (v2parts.length === i) {
				return 1;
			}

			if (v1parts[i] === v2parts[i]) {
				continue;
			}
			if (v1parts[i] > v2parts[i]) {
				return 1;
			}
			return -1;
		}

		if (v1parts.length != v2parts.length) {
			return -1;
		}

		return 0;
	}

	/*contact form 7*/
	$( "body" ).on( "wpcf7:invalid wpcf7:spam wpcf7:mailsent wpcf7:mailfailed wpcf7:submit", ".wmts_lightbox .wpcf7",	function( event ){
		$( this ).find( '.ajax-loader' ).hide( );
	});

	$( "body" ).on( "submit", ".wmts_lightbox .wpcf7", function( event ){
		$( this ).find( '.ajax-loader' ).show( );
	});

	// fix height of select box on Mac
	if (navigator.userAgent.indexOf('Mac OS X') != -1) {
		var height = $('.wmts_search_input_name').height();
		if( height < 35 ) height = 40;
		$('head').append('<style>.wmts_search_select_category {height: ' + (  height + 2 ) + 'px}</style>');
	};

} )

if( ! jQuery.fn.qtip ){
/* qTip2 v2.2.1 | Plugins: tips viewport modal | Styles: core | qtip2.com | Licensed MIT | Mon Sep 08 2014 09:34:39 */
!function(a,b,c){!function(a){"use strict";"function"==typeof define&&define.amd?define(["jquery"],a):jQuery&&!jQuery.fn.qtip&&a(jQuery)}(function(d){"use strict";function e(a,b,c,e){this.id=c,this.target=a,this.tooltip=E,this.elements={target:a},this._id=R+"-"+c,this.timers={img:{}},this.options=b,this.plugins={},this.cache={event:{},target:d(),disabled:D,attr:e,onTooltip:D,lastClass:""},this.rendered=this.destroyed=this.disabled=this.waiting=this.hiddenDuringWait=this.positioning=this.triggering=D}function f(a){return a===E||"object"!==d.type(a)}function g(a){return!(d.isFunction(a)||a&&a.attr||a.length||"object"===d.type(a)&&(a.jquery||a.then))}function h(a){var b,c,e,h;return f(a)?D:(f(a.metadata)&&(a.metadata={type:a.metadata}),"content"in a&&(b=a.content,f(b)||b.jquery||b.done?b=a.content={text:c=g(b)?D:b}:c=b.text,"ajax"in b&&(e=b.ajax,h=e&&e.once!==D,delete b.ajax,b.text=function(a,b){var f=c||d(this).attr(b.options.content.attr)||"Loading...",g=d.ajax(d.extend({},e,{context:b})).then(e.success,E,e.error).then(function(a){return a&&h&&b.set("content.text",a),a},function(a,c,d){b.destroyed||0===a.status||b.set("content.text",c+": "+d)});return h?f:(b.set("content.text",f),g)}),"title"in b&&(d.isPlainObject(b.title)&&(b.button=b.title.button,b.title=b.title.text),g(b.title||D)&&(b.title=D))),"position"in a&&f(a.position)&&(a.position={my:a.position,at:a.position}),"show"in a&&f(a.show)&&(a.show=a.show.jquery?{target:a.show}:a.show===C?{ready:C}:{event:a.show}),"hide"in a&&f(a.hide)&&(a.hide=a.hide.jquery?{target:a.hide}:{event:a.hide}),"style"in a&&f(a.style)&&(a.style={classes:a.style}),d.each(Q,function(){this.sanitize&&this.sanitize(a)}),a)}function i(a,b){for(var c,d=0,e=a,f=b.split(".");e=e[f[d++]];)d<f.length&&(c=e);return[c||a,f.pop()]}function j(a,b){var c,d,e;for(c in this.checks)for(d in this.checks[c])(e=new RegExp(d,"i").exec(a))&&(b.push(e),("builtin"===c||this.plugins[c])&&this.checks[c][d].apply(this.plugins[c]||this,b))}function k(a){return U.concat("").join(a?"-"+a+" ":" ")}function l(a,b){return b>0?setTimeout(d.proxy(a,this),b):void a.call(this)}function m(a){this.tooltip.hasClass(_)||(clearTimeout(this.timers.show),clearTimeout(this.timers.hide),this.timers.show=l.call(this,function(){this.toggle(C,a)},this.options.show.delay))}function n(a){if(!this.tooltip.hasClass(_)&&!this.destroyed){var b=d(a.relatedTarget),c=b.closest(V)[0]===this.tooltip[0],e=b[0]===this.options.show.target[0];if(clearTimeout(this.timers.show),clearTimeout(this.timers.hide),this!==b[0]&&"mouse"===this.options.position.target&&c||this.options.hide.fixed&&/mouse(out|leave|move)/.test(a.type)&&(c||e))try{a.preventDefault(),a.stopImmediatePropagation()}catch(f){}else this.timers.hide=l.call(this,function(){this.toggle(D,a)},this.options.hide.delay,this)}}function o(a){!this.tooltip.hasClass(_)&&this.options.hide.inactive&&(clearTimeout(this.timers.inactive),this.timers.inactive=l.call(this,function(){this.hide(a)},this.options.hide.inactive))}function p(a){this.rendered&&this.tooltip[0].offsetWidth>0&&this.reposition(a)}function q(a,c,e){d(b.body).delegate(a,(c.split?c:c.join("."+R+" "))+"."+R,function(){var a=x.api[d.attr(this,T)];a&&!a.disabled&&e.apply(a,arguments)})}function r(a,c,f){var g,i,j,k,l,m=d(b.body),n=a[0]===b?m:a,o=a.metadata?a.metadata(f.metadata):E,p="html5"===f.metadata.type&&o?o[f.metadata.name]:E,q=a.data(f.metadata.name||"qtipopts");try{q="string"==typeof q?d.parseJSON(q):q}catch(r){}if(k=d.extend(C,{},x.defaults,f,"object"==typeof q?h(q):E,h(p||o)),i=k.position,k.id=c,"boolean"==typeof k.content.text){if(j=a.attr(k.content.attr),k.content.attr===D||!j)return D;k.content.text=j}if(i.container.length||(i.container=m),i.target===D&&(i.target=n),k.show.target===D&&(k.show.target=n),k.show.solo===C&&(k.show.solo=i.container.closest("body")),k.hide.target===D&&(k.hide.target=n),k.position.viewport===C&&(k.position.viewport=i.container),i.container=i.container.eq(0),i.at=new z(i.at,C),i.my=new z(i.my),a.data(R))if(k.overwrite)a.qtip("destroy",!0);else if(k.overwrite===D)return D;return a.attr(S,c),k.suppress&&(l=a.attr("title"))&&a.removeAttr("title").attr(bb,l).attr("title",""),g=new e(a,k,c,!!j),a.data(R,g),g}function s(a){return a.charAt(0).toUpperCase()+a.slice(1)}function t(a,b){var d,e,f=b.charAt(0).toUpperCase()+b.slice(1),g=(b+" "+qb.join(f+" ")+f).split(" "),h=0;if(pb[b])return a.css(pb[b]);for(;d=g[h++];)if((e=a.css(d))!==c)return pb[b]=d,e}function u(a,b){return Math.ceil(parseFloat(t(a,b)))}function v(a,b){this._ns="tip",this.options=b,this.offset=b.offset,this.size=[b.width,b.height],this.init(this.qtip=a)}function w(a,b){this.options=b,this._ns="-modal",this.init(this.qtip=a)}var x,y,z,A,B,C=!0,D=!1,E=null,F="x",G="y",H="width",I="height",J="top",K="left",L="bottom",M="right",N="center",O="flipinvert",P="shift",Q={},R="qtip",S="data-hasqtip",T="data-qtip-id",U=["ui-widget","ui-tooltip"],V="."+R,W="click dblclick mousedown mouseup mousemove mouseleave mouseenter".split(" "),X=R+"-fixed",Y=R+"-default",Z=R+"-focus",$=R+"-hover",_=R+"-disabled",ab="_replacedByqTip",bb="oldtitle",cb={ie:function(){for(var a=4,c=b.createElement("div");(c.innerHTML="<!--[if gt IE "+a+"]><i></i><![endif]-->")&&c.getElementsByTagName("i")[0];a+=1);return a>4?a:0/0}(),iOS:parseFloat((""+(/CPU.*OS ([0-9_]{1,5})|(CPU like).*AppleWebKit.*Mobile/i.exec(navigator.userAgent)||[0,""])[1]).replace("undefined","3_2").replace("_",".").replace("_",""))||D};y=e.prototype,y._when=function(a){return d.when.apply(d,a)},y.render=function(a){if(this.rendered||this.destroyed)return this;var b,c=this,e=this.options,f=this.cache,g=this.elements,h=e.content.text,i=e.content.title,j=e.content.button,k=e.position,l=("."+this._id+" ",[]);return d.attr(this.target[0],"aria-describedby",this._id),f.posClass=this._createPosClass((this.position={my:k.my,at:k.at}).my),this.tooltip=g.tooltip=b=d("<div/>",{id:this._id,"class":[R,Y,e.style.classes,f.posClass].join(" "),width:e.style.width||"",height:e.style.height||"",tracking:"mouse"===k.target&&k.adjust.mouse,role:"alert","aria-live":"polite","aria-atomic":D,"aria-describedby":this._id+"-content","aria-hidden":C}).toggleClass(_,this.disabled).attr(T,this.id).data(R,this).appendTo(k.container).append(g.content=d("<div />",{"class":R+"-content",id:this._id+"-content","aria-atomic":C})),this.rendered=-1,this.positioning=C,i&&(this._createTitle(),d.isFunction(i)||l.push(this._updateTitle(i,D))),j&&this._createButton(),d.isFunction(h)||l.push(this._updateContent(h,D)),this.rendered=C,this._setWidget(),d.each(Q,function(a){var b;"render"===this.initialize&&(b=this(c))&&(c.plugins[a]=b)}),this._unassignEvents(),this._assignEvents(),this._when(l).then(function(){c._trigger("render"),c.positioning=D,c.hiddenDuringWait||!e.show.ready&&!a||c.toggle(C,f.event,D),c.hiddenDuringWait=D}),x.api[this.id]=this,this},y.destroy=function(a){function b(){if(!this.destroyed){this.destroyed=C;var a,b=this.target,c=b.attr(bb);this.rendered&&this.tooltip.stop(1,0).find("*").remove().end().remove(),d.each(this.plugins,function(){this.destroy&&this.destroy()});for(a in this.timers)clearTimeout(this.timers[a]);b.removeData(R).removeAttr(T).removeAttr(S).removeAttr("aria-describedby"),this.options.suppress&&c&&b.attr("title",c).removeAttr(bb),this._unassignEvents(),this.options=this.elements=this.cache=this.timers=this.plugins=this.mouse=E,delete x.api[this.id]}}return this.destroyed?this.target:(a===C&&"hide"!==this.triggering||!this.rendered?b.call(this):(this.tooltip.one("tooltiphidden",d.proxy(b,this)),!this.triggering&&this.hide()),this.target)},A=y.checks={builtin:{"^id$":function(a,b,c,e){var f=c===C?x.nextid:c,g=R+"-"+f;f!==D&&f.length>0&&!d("#"+g).length?(this._id=g,this.rendered&&(this.tooltip[0].id=this._id,this.elements.content[0].id=this._id+"-content",this.elements.title[0].id=this._id+"-title")):a[b]=e},"^prerender":function(a,b,c){c&&!this.rendered&&this.render(this.options.show.ready)},"^content.text$":function(a,b,c){this._updateContent(c)},"^content.attr$":function(a,b,c,d){this.options.content.text===this.target.attr(d)&&this._updateContent(this.target.attr(c))},"^content.title$":function(a,b,c){return c?(c&&!this.elements.title&&this._createTitle(),void this._updateTitle(c)):this._removeTitle()},"^content.button$":function(a,b,c){this._updateButton(c)},"^content.title.(text|button)$":function(a,b,c){this.set("content."+b,c)},"^position.(my|at)$":function(a,b,c){"string"==typeof c&&(this.position[b]=a[b]=new z(c,"at"===b))},"^position.container$":function(a,b,c){this.rendered&&this.tooltip.appendTo(c)},"^show.ready$":function(a,b,c){c&&(!this.rendered&&this.render(C)||this.toggle(C))},"^style.classes$":function(a,b,c,d){this.rendered&&this.tooltip.removeClass(d).addClass(c)},"^style.(width|height)":function(a,b,c){this.rendered&&this.tooltip.css(b,c)},"^style.widget|content.title":function(){this.rendered&&this._setWidget()},"^style.def":function(a,b,c){this.rendered&&this.tooltip.toggleClass(Y,!!c)},"^events.(render|show|move|hide|focus|blur)$":function(a,b,c){this.rendered&&this.tooltip[(d.isFunction(c)?"":"un")+"bind"]("tooltip"+b,c)},"^(show|hide|position).(event|target|fixed|inactive|leave|distance|viewport|adjust)":function(){if(this.rendered){var a=this.options.position;this.tooltip.attr("tracking","mouse"===a.target&&a.adjust.mouse),this._unassignEvents(),this._assignEvents()}}}},y.get=function(a){if(this.destroyed)return this;var b=i(this.options,a.toLowerCase()),c=b[0][b[1]];return c.precedance?c.string():c};var db=/^position\.(my|at|adjust|target|container|viewport)|style|content|show\.ready/i,eb=/^prerender|show\.ready/i;y.set=function(a,b){if(this.destroyed)return this;{var c,e=this.rendered,f=D,g=this.options;this.checks}return"string"==typeof a?(c=a,a={},a[c]=b):a=d.extend({},a),d.each(a,function(b,c){if(e&&eb.test(b))return void delete a[b];var h,j=i(g,b.toLowerCase());h=j[0][j[1]],j[0][j[1]]=c&&c.nodeType?d(c):c,f=db.test(b)||f,a[b]=[j[0],j[1],c,h]}),h(g),this.positioning=C,d.each(a,d.proxy(j,this)),this.positioning=D,this.rendered&&this.tooltip[0].offsetWidth>0&&f&&this.reposition("mouse"===g.position.target?E:this.cache.event),this},y._update=function(a,b){var c=this,e=this.cache;return this.rendered&&a?(d.isFunction(a)&&(a=a.call(this.elements.target,e.event,this)||""),d.isFunction(a.then)?(e.waiting=C,a.then(function(a){return e.waiting=D,c._update(a,b)},E,function(a){return c._update(a,b)})):a===D||!a&&""!==a?D:(a.jquery&&a.length>0?b.empty().append(a.css({display:"block",visibility:"visible"})):b.html(a),this._waitForContent(b).then(function(a){c.rendered&&c.tooltip[0].offsetWidth>0&&c.reposition(e.event,!a.length)}))):D},y._waitForContent=function(a){var b=this.cache;return b.waiting=C,(d.fn.imagesLoaded?a.imagesLoaded():d.Deferred().resolve([])).done(function(){b.waiting=D}).promise()},y._updateContent=function(a,b){this._update(a,this.elements.content,b)},y._updateTitle=function(a,b){this._update(a,this.elements.title,b)===D&&this._removeTitle(D)},y._createTitle=function(){var a=this.elements,b=this._id+"-title";a.titlebar&&this._removeTitle(),a.titlebar=d("<div />",{"class":R+"-titlebar "+(this.options.style.widget?k("header"):"")}).append(a.title=d("<div />",{id:b,"class":R+"-title","aria-atomic":C})).insertBefore(a.content).delegate(".qtip-close","mousedown keydown mouseup keyup mouseout",function(a){d(this).toggleClass("ui-state-active ui-state-focus","down"===a.type.substr(-4))}).delegate(".qtip-close","mouseover mouseout",function(a){d(this).toggleClass("ui-state-hover","mouseover"===a.type)}),this.options.content.button&&this._createButton()},y._removeTitle=function(a){var b=this.elements;b.title&&(b.titlebar.remove(),b.titlebar=b.title=b.button=E,a!==D&&this.reposition())},y._createPosClass=function(a){return R+"-pos-"+(a||this.options.position.my).abbrev()},y.reposition=function(c,e){if(!this.rendered||this.positioning||this.destroyed)return this;this.positioning=C;var f,g,h,i,j=this.cache,k=this.tooltip,l=this.options.position,m=l.target,n=l.my,o=l.at,p=l.viewport,q=l.container,r=l.adjust,s=r.method.split(" "),t=k.outerWidth(D),u=k.outerHeight(D),v=0,w=0,x=k.css("position"),y={left:0,top:0},z=k[0].offsetWidth>0,A=c&&"scroll"===c.type,B=d(a),E=q[0].ownerDocument,F=this.mouse;if(d.isArray(m)&&2===m.length)o={x:K,y:J},y={left:m[0],top:m[1]};else if("mouse"===m)o={x:K,y:J},(!r.mouse||this.options.hide.distance)&&j.origin&&j.origin.pageX?c=j.origin:!c||c&&("resize"===c.type||"scroll"===c.type)?c=j.event:F&&F.pageX&&(c=F),"static"!==x&&(y=q.offset()),E.body.offsetWidth!==(a.innerWidth||E.documentElement.clientWidth)&&(g=d(b.body).offset()),y={left:c.pageX-y.left+(g&&g.left||0),top:c.pageY-y.top+(g&&g.top||0)},r.mouse&&A&&F&&(y.left-=(F.scrollX||0)-B.scrollLeft(),y.top-=(F.scrollY||0)-B.scrollTop());else{if("event"===m?c&&c.target&&"scroll"!==c.type&&"resize"!==c.type?j.target=d(c.target):c.target||(j.target=this.elements.target):"event"!==m&&(j.target=d(m.jquery?m:this.elements.target)),m=j.target,m=d(m).eq(0),0===m.length)return this;m[0]===b||m[0]===a?(v=cb.iOS?a.innerWidth:m.width(),w=cb.iOS?a.innerHeight:m.height(),m[0]===a&&(y={top:(p||m).scrollTop(),left:(p||m).scrollLeft()})):Q.imagemap&&m.is("area")?f=Q.imagemap(this,m,o,Q.viewport?s:D):Q.svg&&m&&m[0].ownerSVGElement?f=Q.svg(this,m,o,Q.viewport?s:D):(v=m.outerWidth(D),w=m.outerHeight(D),y=m.offset()),f&&(v=f.width,w=f.height,g=f.offset,y=f.position),y=this.reposition.offset(m,y,q),(cb.iOS>3.1&&cb.iOS<4.1||cb.iOS>=4.3&&cb.iOS<4.33||!cb.iOS&&"fixed"===x)&&(y.left-=B.scrollLeft(),y.top-=B.scrollTop()),(!f||f&&f.adjustable!==D)&&(y.left+=o.x===M?v:o.x===N?v/2:0,y.top+=o.y===L?w:o.y===N?w/2:0)}return y.left+=r.x+(n.x===M?-t:n.x===N?-t/2:0),y.top+=r.y+(n.y===L?-u:n.y===N?-u/2:0),Q.viewport?(h=y.adjusted=Q.viewport(this,y,l,v,w,t,u),g&&h.left&&(y.left+=g.left),g&&h.top&&(y.top+=g.top),h.my&&(this.position.my=h.my)):y.adjusted={left:0,top:0},j.posClass!==(i=this._createPosClass(this.position.my))&&k.removeClass(j.posClass).addClass(j.posClass=i),this._trigger("move",[y,p.elem||p],c)?(delete y.adjusted,e===D||!z||isNaN(y.left)||isNaN(y.top)||"mouse"===m||!d.isFunction(l.effect)?k.css(y):d.isFunction(l.effect)&&(l.effect.call(k,this,d.extend({},y)),k.queue(function(a){d(this).css({opacity:"",height:""}),cb.ie&&this.style.removeAttribute("filter"),a()})),this.positioning=D,this):this},y.reposition.offset=function(a,c,e){function f(a,b){c.left+=b*a.scrollLeft(),c.top+=b*a.scrollTop()}if(!e[0])return c;var g,h,i,j,k=d(a[0].ownerDocument),l=!!cb.ie&&"CSS1Compat"!==b.compatMode,m=e[0];do"static"!==(h=d.css(m,"position"))&&("fixed"===h?(i=m.getBoundingClientRect(),f(k,-1)):(i=d(m).position(),i.left+=parseFloat(d.css(m,"borderLeftWidth"))||0,i.top+=parseFloat(d.css(m,"borderTopWidth"))||0),c.left-=i.left+(parseFloat(d.css(m,"marginLeft"))||0),c.top-=i.top+(parseFloat(d.css(m,"marginTop"))||0),g||"hidden"===(j=d.css(m,"overflow"))||"visible"===j||(g=d(m)));while(m=m.offsetParent);return g&&(g[0]!==k[0]||l)&&f(g,1),c};var fb=(z=y.reposition.Corner=function(a,b){a=(""+a).replace(/([A-Z])/," $1").replace(/middle/gi,N).toLowerCase(),this.x=(a.match(/left|right/i)||a.match(/center/)||["inherit"])[0].toLowerCase(),this.y=(a.match(/top|bottom|center/i)||["inherit"])[0].toLowerCase(),this.forceY=!!b;var c=a.charAt(0);this.precedance="t"===c||"b"===c?G:F}).prototype;fb.invert=function(a,b){this[a]=this[a]===K?M:this[a]===M?K:b||this[a]},fb.string=function(a){var b=this.x,c=this.y,d=b!==c?"center"===b||"center"!==c&&(this.precedance===G||this.forceY)?[c,b]:[b,c]:[b];return a!==!1?d.join(" "):d},fb.abbrev=function(){var a=this.string(!1);return a[0].charAt(0)+(a[1]&&a[1].charAt(0)||"")},fb.clone=function(){return new z(this.string(),this.forceY)},y.toggle=function(a,c){var e=this.cache,f=this.options,g=this.tooltip;if(c){if(/over|enter/.test(c.type)&&e.event&&/out|leave/.test(e.event.type)&&f.show.target.add(c.target).length===f.show.target.length&&g.has(c.relatedTarget).length)return this;e.event=d.event.fix(c)}if(this.waiting&&!a&&(this.hiddenDuringWait=C),!this.rendered)return a?this.render(1):this;if(this.destroyed||this.disabled)return this;var h,i,j,k=a?"show":"hide",l=this.options[k],m=(this.options[a?"hide":"show"],this.options.position),n=this.options.content,o=this.tooltip.css("width"),p=this.tooltip.is(":visible"),q=a||1===l.target.length,r=!c||l.target.length<2||e.target[0]===c.target;return(typeof a).search("boolean|number")&&(a=!p),h=!g.is(":animated")&&p===a&&r,i=h?E:!!this._trigger(k,[90]),this.destroyed?this:(i!==D&&a&&this.focus(c),!i||h?this:(d.attr(g[0],"aria-hidden",!a),a?(this.mouse&&(e.origin=d.event.fix(this.mouse)),d.isFunction(n.text)&&this._updateContent(n.text,D),d.isFunction(n.title)&&this._updateTitle(n.title,D),!B&&"mouse"===m.target&&m.adjust.mouse&&(d(b).bind("mousemove."+R,this._storeMouse),B=C),o||g.css("width",g.outerWidth(D)),this.reposition(c,arguments[2]),o||g.css("width",""),l.solo&&("string"==typeof l.solo?d(l.solo):d(V,l.solo)).not(g).not(l.target).qtip("hide",d.Event("tooltipsolo"))):(clearTimeout(this.timers.show),delete e.origin,B&&!d(V+'[tracking="true"]:visible',l.solo).not(g).length&&(d(b).unbind("mousemove."+R),B=D),this.blur(c)),j=d.proxy(function(){a?(cb.ie&&g[0].style.removeAttribute("filter"),g.css("overflow",""),"string"==typeof l.autofocus&&d(this.options.show.autofocus,g).focus(),this.options.show.target.trigger("qtip-"+this.id+"-inactive")):g.css({display:"",visibility:"",opacity:"",left:"",top:""}),this._trigger(a?"visible":"hidden")},this),l.effect===D||q===D?(g[k](),j()):d.isFunction(l.effect)?(g.stop(1,1),l.effect.call(g,this),g.queue("fx",function(a){j(),a()})):g.fadeTo(90,a?1:0,j),a&&l.target.trigger("qtip-"+this.id+"-inactive"),this))},y.show=function(a){return this.toggle(C,a)},y.hide=function(a){return this.toggle(D,a)},y.focus=function(a){if(!this.rendered||this.destroyed)return this;var b=d(V),c=this.tooltip,e=parseInt(c[0].style.zIndex,10),f=x.zindex+b.length;return c.hasClass(Z)||this._trigger("focus",[f],a)&&(e!==f&&(b.each(function(){this.style.zIndex>e&&(this.style.zIndex=this.style.zIndex-1)}),b.filter("."+Z).qtip("blur",a)),c.addClass(Z)[0].style.zIndex=f),this},y.blur=function(a){return!this.rendered||this.destroyed?this:(this.tooltip.removeClass(Z),this._trigger("blur",[this.tooltip.css("zIndex")],a),this)},y.disable=function(a){return this.destroyed?this:("toggle"===a?a=!(this.rendered?this.tooltip.hasClass(_):this.disabled):"boolean"!=typeof a&&(a=C),this.rendered&&this.tooltip.toggleClass(_,a).attr("aria-disabled",a),this.disabled=!!a,this)},y.enable=function(){return this.disable(D)},y._createButton=function(){var a=this,b=this.elements,c=b.tooltip,e=this.options.content.button,f="string"==typeof e,g=f?e:"Close tooltip";b.button&&b.button.remove(),b.button=e.jquery?e:d("<a />",{"class":"qtip-close "+(this.options.style.widget?"":R+"-icon"),title:g,"aria-label":g}).prepend(d("<span />",{"class":"ui-icon ui-icon-close",html:"&times;"})),b.button.appendTo(b.titlebar||c).attr("role","button").click(function(b){return c.hasClass(_)||a.hide(b),D})},y._updateButton=function(a){if(!this.rendered)return D;var b=this.elements.button;a?this._createButton():b.remove()},y._setWidget=function(){var a=this.options.style.widget,b=this.elements,c=b.tooltip,d=c.hasClass(_);c.removeClass(_),_=a?"ui-state-disabled":"qtip-disabled",c.toggleClass(_,d),c.toggleClass("ui-helper-reset "+k(),a).toggleClass(Y,this.options.style.def&&!a),b.content&&b.content.toggleClass(k("content"),a),b.titlebar&&b.titlebar.toggleClass(k("header"),a),b.button&&b.button.toggleClass(R+"-icon",!a)},y._storeMouse=function(a){return(this.mouse=d.event.fix(a)).type="mousemove",this},y._bind=function(a,b,c,e,f){if(a&&c&&b.length){var g="."+this._id+(e?"-"+e:"");return d(a).bind((b.split?b:b.join(g+" "))+g,d.proxy(c,f||this)),this}},y._unbind=function(a,b){return a&&d(a).unbind("."+this._id+(b?"-"+b:"")),this},y._trigger=function(a,b,c){var e=d.Event("tooltip"+a);return e.originalEvent=c&&d.extend({},c)||this.cache.event||E,this.triggering=a,this.tooltip.trigger(e,[this].concat(b||[])),this.triggering=D,!e.isDefaultPrevented()},y._bindEvents=function(a,b,c,e,f,g){var h=c.filter(e).add(e.filter(c)),i=[];h.length&&(d.each(b,function(b,c){var e=d.inArray(c,a);e>-1&&i.push(a.splice(e,1)[0])}),i.length&&(this._bind(h,i,function(a){var b=this.rendered?this.tooltip[0].offsetWidth>0:!1;(b?g:f).call(this,a)}),c=c.not(h),e=e.not(h))),this._bind(c,a,f),this._bind(e,b,g)},y._assignInitialEvents=function(a){function b(a){return this.disabled||this.destroyed?D:(this.cache.event=a&&d.event.fix(a),this.cache.target=a&&d(a.target),clearTimeout(this.timers.show),void(this.timers.show=l.call(this,function(){this.render("object"==typeof a||c.show.ready)},c.prerender?0:c.show.delay)))}var c=this.options,e=c.show.target,f=c.hide.target,g=c.show.event?d.trim(""+c.show.event).split(" "):[],h=c.hide.event?d.trim(""+c.hide.event).split(" "):[];this._bind(this.elements.target,["remove","removeqtip"],function(){this.destroy(!0)},"destroy"),/mouse(over|enter)/i.test(c.show.event)&&!/mouse(out|leave)/i.test(c.hide.event)&&h.push("mouseleave"),this._bind(e,"mousemove",function(a){this._storeMouse(a),this.cache.onTarget=C}),this._bindEvents(g,h,e,f,b,function(){return this.timers?void clearTimeout(this.timers.show):D}),(c.show.ready||c.prerender)&&b.call(this,a)},y._assignEvents=function(){var c=this,e=this.options,f=e.position,g=this.tooltip,h=e.show.target,i=e.hide.target,j=f.container,k=f.viewport,l=d(b),q=(d(b.body),d(a)),r=e.show.event?d.trim(""+e.show.event).split(" "):[],s=e.hide.event?d.trim(""+e.hide.event).split(" "):[];d.each(e.events,function(a,b){c._bind(g,"toggle"===a?["tooltipshow","tooltiphide"]:["tooltip"+a],b,null,g)}),/mouse(out|leave)/i.test(e.hide.event)&&"window"===e.hide.leave&&this._bind(l,["mouseout","blur"],function(a){/select|option/.test(a.target.nodeName)||a.relatedTarget||this.hide(a)}),e.hide.fixed?i=i.add(g.addClass(X)):/mouse(over|enter)/i.test(e.show.event)&&this._bind(i,"mouseleave",function(){clearTimeout(this.timers.show)}),(""+e.hide.event).indexOf("unfocus")>-1&&this._bind(j.closest("html"),["mousedown","touchstart"],function(a){var b=d(a.target),c=this.rendered&&!this.tooltip.hasClass(_)&&this.tooltip[0].offsetWidth>0,e=b.parents(V).filter(this.tooltip[0]).length>0;b[0]===this.target[0]||b[0]===this.tooltip[0]||e||this.target.has(b[0]).length||!c||this.hide(a)}),"number"==typeof e.hide.inactive&&(this._bind(h,"qtip-"+this.id+"-inactive",o,"inactive"),this._bind(i.add(g),x.inactiveEvents,o)),this._bindEvents(r,s,h,i,m,n),this._bind(h.add(g),"mousemove",function(a){if("number"==typeof e.hide.distance){var b=this.cache.origin||{},c=this.options.hide.distance,d=Math.abs;(d(a.pageX-b.pageX)>=c||d(a.pageY-b.pageY)>=c)&&this.hide(a)}this._storeMouse(a)}),"mouse"===f.target&&f.adjust.mouse&&(e.hide.event&&this._bind(h,["mouseenter","mouseleave"],function(a){return this.cache?void(this.cache.onTarget="mouseenter"===a.type):D}),this._bind(l,"mousemove",function(a){this.rendered&&this.cache.onTarget&&!this.tooltip.hasClass(_)&&this.tooltip[0].offsetWidth>0&&this.reposition(a)})),(f.adjust.resize||k.length)&&this._bind(d.event.special.resize?k:q,"resize",p),f.adjust.scroll&&this._bind(q.add(f.container),"scroll",p)},y._unassignEvents=function(){var c=this.options,e=c.show.target,f=c.hide.target,g=d.grep([this.elements.target[0],this.rendered&&this.tooltip[0],c.position.container[0],c.position.viewport[0],c.position.container.closest("html")[0],a,b],function(a){return"object"==typeof a});e&&e.toArray&&(g=g.concat(e.toArray())),f&&f.toArray&&(g=g.concat(f.toArray())),this._unbind(g)._unbind(g,"destroy")._unbind(g,"inactive")},d(function(){q(V,["mouseenter","mouseleave"],function(a){var b="mouseenter"===a.type,c=d(a.currentTarget),e=d(a.relatedTarget||a.target),f=this.options;b?(this.focus(a),c.hasClass(X)&&!c.hasClass(_)&&clearTimeout(this.timers.hide)):"mouse"===f.position.target&&f.position.adjust.mouse&&f.hide.event&&f.show.target&&!e.closest(f.show.target[0]).length&&this.hide(a),c.toggleClass($,b)}),q("["+T+"]",W,o)}),x=d.fn.qtip=function(a,b,e){var f=(""+a).toLowerCase(),g=E,i=d.makeArray(arguments).slice(1),j=i[i.length-1],k=this[0]?d.data(this[0],R):E;return!arguments.length&&k||"api"===f?k:"string"==typeof a?(this.each(function(){var a=d.data(this,R);if(!a)return C;if(j&&j.timeStamp&&(a.cache.event=j),!b||"option"!==f&&"options"!==f)a[f]&&a[f].apply(a,i);else{if(e===c&&!d.isPlainObject(b))return g=a.get(b),D;a.set(b,e)}}),g!==E?g:this):"object"!=typeof a&&arguments.length?void 0:(k=h(d.extend(C,{},a)),this.each(function(a){var b,c;return c=d.isArray(k.id)?k.id[a]:k.id,c=!c||c===D||c.length<1||x.api[c]?x.nextid++:c,b=r(d(this),c,k),b===D?C:(x.api[c]=b,d.each(Q,function(){"initialize"===this.initialize&&this(b)}),void b._assignInitialEvents(j))}))},d.qtip=e,x.api={},d.each({attr:function(a,b){if(this.length){var c=this[0],e="title",f=d.data(c,"qtip");if(a===e&&f&&"object"==typeof f&&f.options.suppress)return arguments.length<2?d.attr(c,bb):(f&&f.options.content.attr===e&&f.cache.attr&&f.set("content.text",b),this.attr(bb,b))}return d.fn["attr"+ab].apply(this,arguments)},clone:function(a){var b=(d([]),d.fn["clone"+ab].apply(this,arguments));return a||b.filter("["+bb+"]").attr("title",function(){return d.attr(this,bb)}).removeAttr(bb),b}},function(a,b){if(!b||d.fn[a+ab])return C;var c=d.fn[a+ab]=d.fn[a];d.fn[a]=function(){return b.apply(this,arguments)||c.apply(this,arguments)}}),d.ui||(d["cleanData"+ab]=d.cleanData,d.cleanData=function(a){for(var b,c=0;(b=d(a[c])).length;c++)if(b.attr(S))try{b.triggerHandler("removeqtip")}catch(e){}d["cleanData"+ab].apply(this,arguments)}),x.version="2.2.1",x.nextid=0,x.inactiveEvents=W,x.zindex=15e3,x.defaults={prerender:D,id:D,overwrite:C,suppress:C,content:{text:C,attr:"title",title:D,button:D},position:{my:"top left",at:"bottom right",target:D,container:D,viewport:D,adjust:{x:0,y:0,mouse:C,scroll:C,resize:C,method:"flipinvert flipinvert"},effect:function(a,b){d(this).animate(b,{duration:200,queue:D})}},show:{target:D,event:"mouseenter",effect:C,delay:90,solo:D,ready:D,autofocus:D},hide:{target:D,event:"mouseleave",effect:C,delay:0,fixed:D,inactive:D,leave:"window",distance:D},style:{classes:"",widget:D,width:D,height:D,def:C},events:{render:E,move:E,show:E,hide:E,toggle:E,visible:E,hidden:E,focus:E,blur:E}};var gb,hb="margin",ib="border",jb="color",kb="background-color",lb="transparent",mb=" !important",nb=!!b.createElement("canvas").getContext,ob=/rgba?\(0, 0, 0(, 0)?\)|transparent|#123456/i,pb={},qb=["Webkit","O","Moz","ms"];if(nb)var rb=a.devicePixelRatio||1,sb=function(){var a=b.createElement("canvas").getContext("2d");return a.backingStorePixelRatio||a.webkitBackingStorePixelRatio||a.mozBackingStorePixelRatio||a.msBackingStorePixelRatio||a.oBackingStorePixelRatio||1}(),tb=rb/sb;else var ub=function(a,b,c){return"<qtipvml:"+a+' xmlns="urn:schemas-microsoft.com:vml" class="qtip-vml" '+(b||"")+' style="behavior: url(#default#VML); '+(c||"")+'" />'};d.extend(v.prototype,{init:function(a){var b,c;c=this.element=a.elements.tip=d("<div />",{"class":R+"-tip"}).prependTo(a.tooltip),nb?(b=d("<canvas />").appendTo(this.element)[0].getContext("2d"),b.lineJoin="miter",b.miterLimit=1e5,b.save()):(b=ub("shape",'coordorigin="0,0"',"position:absolute;"),this.element.html(b+b),a._bind(d("*",c).add(c),["click","mousedown"],function(a){a.stopPropagation()},this._ns)),a._bind(a.tooltip,"tooltipmove",this.reposition,this._ns,this),this.create()},_swapDimensions:function(){this.size[0]=this.options.height,this.size[1]=this.options.width},_resetDimensions:function(){this.size[0]=this.options.width,this.size[1]=this.options.height},_useTitle:function(a){var b=this.qtip.elements.titlebar;return b&&(a.y===J||a.y===N&&this.element.position().top+this.size[1]/2+this.options.offset<b.outerHeight(C))},_parseCorner:function(a){var b=this.qtip.options.position.my;return a===D||b===D?a=D:a===C?a=new z(b.string()):a.string||(a=new z(a),a.fixed=C),a},_parseWidth:function(a,b,c){var d=this.qtip.elements,e=ib+s(b)+"Width";return(c?u(c,e):u(d.content,e)||u(this._useTitle(a)&&d.titlebar||d.content,e)||u(d.tooltip,e))||0},_parseRadius:function(a){var b=this.qtip.elements,c=ib+s(a.y)+s(a.x)+"Radius";return cb.ie<9?0:u(this._useTitle(a)&&b.titlebar||b.content,c)||u(b.tooltip,c)||0},_invalidColour:function(a,b,c){var d=a.css(b);return!d||c&&d===a.css(c)||ob.test(d)?D:d},_parseColours:function(a){var b=this.qtip.elements,c=this.element.css("cssText",""),e=ib+s(a[a.precedance])+s(jb),f=this._useTitle(a)&&b.titlebar||b.content,g=this._invalidColour,h=[];return h[0]=g(c,kb)||g(f,kb)||g(b.content,kb)||g(b.tooltip,kb)||c.css(kb),h[1]=g(c,e,jb)||g(f,e,jb)||g(b.content,e,jb)||g(b.tooltip,e,jb)||b.tooltip.css(e),d("*",c).add(c).css("cssText",kb+":"+lb+mb+";"+ib+":0"+mb+";"),h},_calculateSize:function(a){var b,c,d,e=a.precedance===G,f=this.options.width,g=this.options.height,h="c"===a.abbrev(),i=(e?f:g)*(h?.5:1),j=Math.pow,k=Math.round,l=Math.sqrt(j(i,2)+j(g,2)),m=[this.border/i*l,this.border/g*l];return m[2]=Math.sqrt(j(m[0],2)-j(this.border,2)),m[3]=Math.sqrt(j(m[1],2)-j(this.border,2)),b=l+m[2]+m[3]+(h?0:m[0]),c=b/l,d=[k(c*f),k(c*g)],e?d:d.reverse()},_calculateTip:function(a,b,c){c=c||1,b=b||this.size;var d=b[0]*c,e=b[1]*c,f=Math.ceil(d/2),g=Math.ceil(e/2),h={br:[0,0,d,e,d,0],bl:[0,0,d,0,0,e],tr:[0,e,d,0,d,e],tl:[0,0,0,e,d,e],tc:[0,e,f,0,d,e],bc:[0,0,d,0,f,e],rc:[0,0,d,g,0,e],lc:[d,0,d,e,0,g]};return h.lt=h.br,h.rt=h.bl,h.lb=h.tr,h.rb=h.tl,h[a.abbrev()]},_drawCoords:function(a,b){a.beginPath(),a.moveTo(b[0],b[1]),a.lineTo(b[2],b[3]),a.lineTo(b[4],b[5]),a.closePath()},create:function(){var a=this.corner=(nb||cb.ie)&&this._parseCorner(this.options.corner);return(this.enabled=!!this.corner&&"c"!==this.corner.abbrev())&&(this.qtip.cache.corner=a.clone(),this.update()),this.element.toggle(this.enabled),this.corner},update:function(b,c){if(!this.enabled)return this;var e,f,g,h,i,j,k,l,m=this.qtip.elements,n=this.element,o=n.children(),p=this.options,q=this.size,r=p.mimic,s=Math.round;b||(b=this.qtip.cache.corner||this.corner),r===D?r=b:(r=new z(r),r.precedance=b.precedance,"inherit"===r.x?r.x=b.x:"inherit"===r.y?r.y=b.y:r.x===r.y&&(r[b.precedance]=b[b.precedance])),f=r.precedance,b.precedance===F?this._swapDimensions():this._resetDimensions(),e=this.color=this._parseColours(b),e[1]!==lb?(l=this.border=this._parseWidth(b,b[b.precedance]),p.border&&1>l&&!ob.test(e[1])&&(e[0]=e[1]),this.border=l=p.border!==C?p.border:l):this.border=l=0,k=this.size=this._calculateSize(b),n.css({width:k[0],height:k[1],lineHeight:k[1]+"px"}),j=b.precedance===G?[s(r.x===K?l:r.x===M?k[0]-q[0]-l:(k[0]-q[0])/2),s(r.y===J?k[1]-q[1]:0)]:[s(r.x===K?k[0]-q[0]:0),s(r.y===J?l:r.y===L?k[1]-q[1]-l:(k[1]-q[1])/2)],nb?(g=o[0].getContext("2d"),g.restore(),g.save(),g.clearRect(0,0,6e3,6e3),h=this._calculateTip(r,q,tb),i=this._calculateTip(r,this.size,tb),o.attr(H,k[0]*tb).attr(I,k[1]*tb),o.css(H,k[0]).css(I,k[1]),this._drawCoords(g,i),g.fillStyle=e[1],g.fill(),g.translate(j[0]*tb,j[1]*tb),this._drawCoords(g,h),g.fillStyle=e[0],g.fill()):(h=this._calculateTip(r),h="m"+h[0]+","+h[1]+" l"+h[2]+","+h[3]+" "+h[4]+","+h[5]+" xe",j[2]=l&&/^(r|b)/i.test(b.string())?8===cb.ie?2:1:0,o.css({coordsize:k[0]+l+" "+(k[1]+l),antialias:""+(r.string().indexOf(N)>-1),left:j[0]-j[2]*Number(f===F),top:j[1]-j[2]*Number(f===G),width:k[0]+l,height:k[1]+l}).each(function(a){var b=d(this);b[b.prop?"prop":"attr"]({coordsize:k[0]+l+" "+(k[1]+l),path:h,fillcolor:e[0],filled:!!a,stroked:!a}).toggle(!(!l&&!a)),!a&&b.html(ub("stroke",'weight="'+2*l+'px" color="'+e[1]+'" miterlimit="1000" joinstyle="miter"'))})),a.opera&&setTimeout(function(){m.tip.css({display:"inline-block",visibility:"visible"})},1),c!==D&&this.calculate(b,k)},calculate:function(a,b){if(!this.enabled)return D;var c,e,f=this,g=this.qtip.elements,h=this.element,i=this.options.offset,j=(g.tooltip.hasClass("ui-widget"),{});return a=a||this.corner,c=a.precedance,b=b||this._calculateSize(a),e=[a.x,a.y],c===F&&e.reverse(),d.each(e,function(d,e){var h,k,l;
e===N?(h=c===G?K:J,j[h]="50%",j[hb+"-"+h]=-Math.round(b[c===G?0:1]/2)+i):(h=f._parseWidth(a,e,g.tooltip),k=f._parseWidth(a,e,g.content),l=f._parseRadius(a),j[e]=Math.max(-f.border,d?k:i+(l>h?l:-h)))}),j[a[c]]-=b[c===F?0:1],h.css({margin:"",top:"",bottom:"",left:"",right:""}).css(j),j},reposition:function(a,b,d){function e(a,b,c,d,e){a===P&&j.precedance===b&&k[d]&&j[c]!==N?j.precedance=j.precedance===F?G:F:a!==P&&k[d]&&(j[b]=j[b]===N?k[d]>0?d:e:j[b]===d?e:d)}function f(a,b,e){j[a]===N?p[hb+"-"+b]=o[a]=g[hb+"-"+b]-k[b]:(h=g[e]!==c?[k[b],-g[b]]:[-k[b],g[b]],(o[a]=Math.max(h[0],h[1]))>h[0]&&(d[b]-=k[b],o[b]=D),p[g[e]!==c?e:b]=o[a])}if(this.enabled){var g,h,i=b.cache,j=this.corner.clone(),k=d.adjusted,l=b.options.position.adjust.method.split(" "),m=l[0],n=l[1]||l[0],o={left:D,top:D,x:0,y:0},p={};this.corner.fixed!==C&&(e(m,F,G,K,M),e(n,G,F,J,L),(j.string()!==i.corner.string()||i.cornerTop!==k.top||i.cornerLeft!==k.left)&&this.update(j,D)),g=this.calculate(j),g.right!==c&&(g.left=-g.right),g.bottom!==c&&(g.top=-g.bottom),g.user=this.offset,(o.left=m===P&&!!k.left)&&f(F,K,M),(o.top=n===P&&!!k.top)&&f(G,J,L),this.element.css(p).toggle(!(o.x&&o.y||j.x===N&&o.y||j.y===N&&o.x)),d.left-=g.left.charAt?g.user:m!==P||o.top||!o.left&&!o.top?g.left+this.border:0,d.top-=g.top.charAt?g.user:n!==P||o.left||!o.left&&!o.top?g.top+this.border:0,i.cornerLeft=k.left,i.cornerTop=k.top,i.corner=j.clone()}},destroy:function(){this.qtip._unbind(this.qtip.tooltip,this._ns),this.qtip.elements.tip&&this.qtip.elements.tip.find("*").remove().end().remove()}}),gb=Q.tip=function(a){return new v(a,a.options.style.tip)},gb.initialize="render",gb.sanitize=function(a){if(a.style&&"tip"in a.style){var b=a.style.tip;"object"!=typeof b&&(b=a.style.tip={corner:b}),/string|boolean/i.test(typeof b.corner)||(b.corner=C)}},A.tip={"^position.my|style.tip.(corner|mimic|border)$":function(){this.create(),this.qtip.reposition()},"^style.tip.(height|width)$":function(a){this.size=[a.width,a.height],this.update(),this.qtip.reposition()},"^content.title|style.(classes|widget)$":function(){this.update()}},d.extend(C,x.defaults,{style:{tip:{corner:C,mimic:D,width:6,height:6,border:C,offset:0}}}),Q.viewport=function(c,d,e,f,g,h,i){function j(a,b,c,e,f,g,h,i,j){var k=d[f],s=u[a],t=v[a],w=c===P,x=s===f?j:s===g?-j:-j/2,y=t===f?i:t===g?-i:-i/2,z=q[f]+r[f]-(n?0:m[f]),A=z-k,B=k+j-(h===H?o:p)-z,C=x-(u.precedance===a||s===u[b]?y:0)-(t===N?i/2:0);return w?(C=(s===f?1:-1)*x,d[f]+=A>0?A:B>0?-B:0,d[f]=Math.max(-m[f]+r[f],k-C,Math.min(Math.max(-m[f]+r[f]+(h===H?o:p),k+C),d[f],"center"===s?k-x:1e9))):(e*=c===O?2:0,A>0&&(s!==f||B>0)?(d[f]-=C+e,l.invert(a,f)):B>0&&(s!==g||A>0)&&(d[f]-=(s===N?-C:C)+e,l.invert(a,g)),d[f]<q&&-d[f]>B&&(d[f]=k,l=u.clone())),d[f]-k}var k,l,m,n,o,p,q,r,s=e.target,t=c.elements.tooltip,u=e.my,v=e.at,w=e.adjust,x=w.method.split(" "),y=x[0],z=x[1]||x[0],A=e.viewport,B=e.container,C=(c.cache,{left:0,top:0});return A.jquery&&s[0]!==a&&s[0]!==b.body&&"none"!==w.method?(m=B.offset()||C,n="static"===B.css("position"),k="fixed"===t.css("position"),o=A[0]===a?A.width():A.outerWidth(D),p=A[0]===a?A.height():A.outerHeight(D),q={left:k?0:A.scrollLeft(),top:k?0:A.scrollTop()},r=A.offset()||C,("shift"!==y||"shift"!==z)&&(l=u.clone()),C={left:"none"!==y?j(F,G,y,w.x,K,M,H,f,h):0,top:"none"!==z?j(G,F,z,w.y,J,L,I,g,i):0,my:l}):C};var vb,wb,xb="qtip-modal",yb="."+xb;wb=function(){function a(a){if(d.expr[":"].focusable)return d.expr[":"].focusable;var b,c,e,f=!isNaN(d.attr(a,"tabindex")),g=a.nodeName&&a.nodeName.toLowerCase();return"area"===g?(b=a.parentNode,c=b.name,a.href&&c&&"map"===b.nodeName.toLowerCase()?(e=d("img[usemap=#"+c+"]")[0],!!e&&e.is(":visible")):!1):/input|select|textarea|button|object/.test(g)?!a.disabled:"a"===g?a.href||f:f}function c(a){k.length<1&&a.length?a.not("body").blur():k.first().focus()}function e(a){if(i.is(":visible")){var b,e=d(a.target),h=f.tooltip,j=e.closest(V);b=j.length<1?D:parseInt(j[0].style.zIndex,10)>parseInt(h[0].style.zIndex,10),b||e.closest(V)[0]===h[0]||c(e),g=a.target===k[k.length-1]}}var f,g,h,i,j=this,k={};d.extend(j,{init:function(){return i=j.elem=d("<div />",{id:"qtip-overlay",html:"<div></div>",mousedown:function(){return D}}).hide(),d(b.body).bind("focusin"+yb,e),d(b).bind("keydown"+yb,function(a){f&&f.options.show.modal.escape&&27===a.keyCode&&f.hide(a)}),i.bind("click"+yb,function(a){f&&f.options.show.modal.blur&&f.hide(a)}),j},update:function(b){f=b,k=b.options.show.modal.stealfocus!==D?b.tooltip.find("*").filter(function(){return a(this)}):[]},toggle:function(a,e,g){var k=(d(b.body),a.tooltip),l=a.options.show.modal,m=l.effect,n=e?"show":"hide",o=i.is(":visible"),p=d(yb).filter(":visible:not(:animated)").not(k);return j.update(a),e&&l.stealfocus!==D&&c(d(":focus")),i.toggleClass("blurs",l.blur),e&&i.appendTo(b.body),i.is(":animated")&&o===e&&h!==D||!e&&p.length?j:(i.stop(C,D),d.isFunction(m)?m.call(i,e):m===D?i[n]():i.fadeTo(parseInt(g,10)||90,e?1:0,function(){e||i.hide()}),e||i.queue(function(a){i.css({left:"",top:""}),d(yb).length||i.detach(),a()}),h=e,f.destroyed&&(f=E),j)}}),j.init()},wb=new wb,d.extend(w.prototype,{init:function(a){var b=a.tooltip;return this.options.on?(a.elements.overlay=wb.elem,b.addClass(xb).css("z-index",x.modal_zindex+d(yb).length),a._bind(b,["tooltipshow","tooltiphide"],function(a,c,e){var f=a.originalEvent;if(a.target===b[0])if(f&&"tooltiphide"===a.type&&/mouse(leave|enter)/.test(f.type)&&d(f.relatedTarget).closest(wb.elem[0]).length)try{a.preventDefault()}catch(g){}else(!f||f&&"tooltipsolo"!==f.type)&&this.toggle(a,"tooltipshow"===a.type,e)},this._ns,this),a._bind(b,"tooltipfocus",function(a,c){if(!a.isDefaultPrevented()&&a.target===b[0]){var e=d(yb),f=x.modal_zindex+e.length,g=parseInt(b[0].style.zIndex,10);wb.elem[0].style.zIndex=f-1,e.each(function(){this.style.zIndex>g&&(this.style.zIndex-=1)}),e.filter("."+Z).qtip("blur",a.originalEvent),b.addClass(Z)[0].style.zIndex=f,wb.update(c);try{a.preventDefault()}catch(h){}}},this._ns,this),void a._bind(b,"tooltiphide",function(a){a.target===b[0]&&d(yb).filter(":visible").not(b).last().qtip("focus",a)},this._ns,this)):this},toggle:function(a,b,c){return a&&a.isDefaultPrevented()?this:void wb.toggle(this.qtip,!!b,c)},destroy:function(){this.qtip.tooltip.removeClass(xb),this.qtip._unbind(this.qtip.tooltip,this._ns),wb.toggle(this.qtip,D),delete this.qtip.elements.overlay}}),vb=Q.modal=function(a){return new w(a,a.options.show.modal)},vb.sanitize=function(a){a.show&&("object"!=typeof a.show.modal?a.show.modal={on:!!a.show.modal}:"undefined"==typeof a.show.modal.on&&(a.show.modal.on=C))},x.modal_zindex=x.zindex-200,vb.initialize="render",A.modal={"^show.modal.(on|blur)$":function(){this.destroy(),this.init(),this.qtip.elems.overlay.toggle(this.qtip.tooltip[0].offsetWidth>0)}},d.extend(C,x.defaults,{show:{modal:{on:D,effect:C,blur:C,stealfocus:C,escape:C}}})})}(window,document);
//# sourceMappingURL=jquery.qtip.min.js.map

}


//if( ! jQuery.fn.isotope ){
/*!
 * Isotope PACKAGED v2.2.0
 *
 * Licensed GPLv3 for open source use
 * or Isotope Commercial License for commercial use
 *
 * http://isotope.metafizzy.co
 * Copyright 2015 Metafizzy
 */
(function(t){function e(){}function i(t){function i(e){e.prototype.option||(e.prototype.option=function(e){t.isPlainObject(e)&&(this.options=t.extend(!0,this.options,e))})}function n(e,i){t.fn[e]=function(n){if("string"==typeof n){for(var s=o.call(arguments,1),a=0,u=this.length;u>a;a++){var p=this[a],h=t.data(p,e);if(h)if(t.isFunction(h[n])&&"_"!==n.charAt(0)){var f=h[n].apply(h,s);if(void 0!==f)return f}else r("no such method '"+n+"' for "+e+" instance");else r("cannot call methods on "+e+" prior to initialization; "+"attempted to call '"+n+"'")}return this}return this.each(function(){var o=t.data(this,e);o?(o.option(n),o._init()):(o=new i(this,n),t.data(this,e,o))})}}if(t){var r="undefined"==typeof console?e:function(t){console.error(t)};return t.bridget=function(t,e){i(e),n(t,e)},t.bridget}}var o=Array.prototype.slice;"function"==typeof define&&define.amd?define("jquery-bridget/jquery.bridget",["jquery"],i):"object"==typeof exports?i(require("jquery")):i(t.jQuery)})(window),function(t){function e(e){var i=t.event;return i.target=i.target||i.srcElement||e,i}var i=document.documentElement,o=function(){};i.addEventListener?o=function(t,e,i){t.addEventListener(e,i,!1)}:i.attachEvent&&(o=function(t,i,o){t[i+o]=o.handleEvent?function(){var i=e(t);o.handleEvent.call(o,i)}:function(){var i=e(t);o.call(t,i)},t.attachEvent("on"+i,t[i+o])});var n=function(){};i.removeEventListener?n=function(t,e,i){t.removeEventListener(e,i,!1)}:i.detachEvent&&(n=function(t,e,i){t.detachEvent("on"+e,t[e+i]);try{delete t[e+i]}catch(o){t[e+i]=void 0}});var r={bind:o,unbind:n};"function"==typeof define&&define.amd?define("eventie/eventie",r):"object"==typeof exports?module.exports=r:t.eventie=r}(window),function(){function t(){}function e(t,e){for(var i=t.length;i--;)if(t[i].listener===e)return i;return-1}function i(t){return function(){return this[t].apply(this,arguments)}}var o=t.prototype,n=this,r=n.EventEmitter;o.getListeners=function(t){var e,i,o=this._getEvents();if(t instanceof RegExp){e={};for(i in o)o.hasOwnProperty(i)&&t.test(i)&&(e[i]=o[i])}else e=o[t]||(o[t]=[]);return e},o.flattenListeners=function(t){var e,i=[];for(e=0;t.length>e;e+=1)i.push(t[e].listener);return i},o.getListenersAsObject=function(t){var e,i=this.getListeners(t);return i instanceof Array&&(e={},e[t]=i),e||i},o.addListener=function(t,i){var o,n=this.getListenersAsObject(t),r="object"==typeof i;for(o in n)n.hasOwnProperty(o)&&-1===e(n[o],i)&&n[o].push(r?i:{listener:i,once:!1});return this},o.on=i("addListener"),o.addOnceListener=function(t,e){return this.addListener(t,{listener:e,once:!0})},o.once=i("addOnceListener"),o.defineEvent=function(t){return this.getListeners(t),this},o.defineEvents=function(t){for(var e=0;t.length>e;e+=1)this.defineEvent(t[e]);return this},o.removeListener=function(t,i){var o,n,r=this.getListenersAsObject(t);for(n in r)r.hasOwnProperty(n)&&(o=e(r[n],i),-1!==o&&r[n].splice(o,1));return this},o.off=i("removeListener"),o.addListeners=function(t,e){return this.manipulateListeners(!1,t,e)},o.removeListeners=function(t,e){return this.manipulateListeners(!0,t,e)},o.manipulateListeners=function(t,e,i){var o,n,r=t?this.removeListener:this.addListener,s=t?this.removeListeners:this.addListeners;if("object"!=typeof e||e instanceof RegExp)for(o=i.length;o--;)r.call(this,e,i[o]);else for(o in e)e.hasOwnProperty(o)&&(n=e[o])&&("function"==typeof n?r.call(this,o,n):s.call(this,o,n));return this},o.removeEvent=function(t){var e,i=typeof t,o=this._getEvents();if("string"===i)delete o[t];else if(t instanceof RegExp)for(e in o)o.hasOwnProperty(e)&&t.test(e)&&delete o[e];else delete this._events;return this},o.removeAllListeners=i("removeEvent"),o.emitEvent=function(t,e){var i,o,n,r,s=this.getListenersAsObject(t);for(n in s)if(s.hasOwnProperty(n))for(o=s[n].length;o--;)i=s[n][o],i.once===!0&&this.removeListener(t,i.listener),r=i.listener.apply(this,e||[]),r===this._getOnceReturnValue()&&this.removeListener(t,i.listener);return this},o.trigger=i("emitEvent"),o.emit=function(t){var e=Array.prototype.slice.call(arguments,1);return this.emitEvent(t,e)},o.setOnceReturnValue=function(t){return this._onceReturnValue=t,this},o._getOnceReturnValue=function(){return this.hasOwnProperty("_onceReturnValue")?this._onceReturnValue:!0},o._getEvents=function(){return this._events||(this._events={})},t.noConflict=function(){return n.EventEmitter=r,t},"function"==typeof define&&define.amd?define("eventEmitter/EventEmitter",[],function(){return t}):"object"==typeof module&&module.exports?module.exports=t:n.EventEmitter=t}.call(this),function(t){function e(t){if(t){if("string"==typeof o[t])return t;t=t.charAt(0).toUpperCase()+t.slice(1);for(var e,n=0,r=i.length;r>n;n++)if(e=i[n]+t,"string"==typeof o[e])return e}}var i="Webkit Moz ms Ms O".split(" "),o=document.documentElement.style;"function"==typeof define&&define.amd?define("get-style-property/get-style-property",[],function(){return e}):"object"==typeof exports?module.exports=e:t.getStyleProperty=e}(window),function(t){function e(t){var e=parseFloat(t),i=-1===t.indexOf("%")&&!isNaN(e);return i&&e}function i(){}function o(){for(var t={width:0,height:0,innerWidth:0,innerHeight:0,outerWidth:0,outerHeight:0},e=0,i=s.length;i>e;e++){var o=s[e];t[o]=0}return t}function n(i){function n(){if(!d){d=!0;var o=t.getComputedStyle;if(p=function(){var t=o?function(t){return o(t,null)}:function(t){return t.currentStyle};return function(e){var i=t(e);return i||r("Style returned "+i+". Are you running this code in a hidden iframe on Firefox? "+"See http://bit.ly/getsizebug1"),i}}(),h=i("boxSizing")){var n=document.createElement("div");n.style.width="200px",n.style.padding="1px 2px 3px 4px",n.style.borderStyle="solid",n.style.borderWidth="1px 2px 3px 4px",n.style[h]="border-box";var s=document.body||document.documentElement;s.appendChild(n);var a=p(n);f=200===e(a.width),s.removeChild(n)}}}function a(t){if(n(),"string"==typeof t&&(t=document.querySelector(t)),t&&"object"==typeof t&&t.nodeType){var i=p(t);if("none"===i.display)return o();var r={};r.width=t.offsetWidth,r.height=t.offsetHeight;for(var a=r.isBorderBox=!(!h||!i[h]||"border-box"!==i[h]),d=0,l=s.length;l>d;d++){var c=s[d],m=i[c];m=u(t,m);var y=parseFloat(m);r[c]=isNaN(y)?0:y}var g=r.paddingLeft+r.paddingRight,v=r.paddingTop+r.paddingBottom,_=r.marginLeft+r.marginRight,I=r.marginTop+r.marginBottom,z=r.borderLeftWidth+r.borderRightWidth,L=r.borderTopWidth+r.borderBottomWidth,x=a&&f,E=e(i.width);E!==!1&&(r.width=E+(x?0:g+z));var b=e(i.height);return b!==!1&&(r.height=b+(x?0:v+L)),r.innerWidth=r.width-(g+z),r.innerHeight=r.height-(v+L),r.outerWidth=r.width+_,r.outerHeight=r.height+I,r}}function u(e,i){if(t.getComputedStyle||-1===i.indexOf("%"))return i;var o=e.style,n=o.left,r=e.runtimeStyle,s=r&&r.left;return s&&(r.left=e.currentStyle.left),o.left=i,i=o.pixelLeft,o.left=n,s&&(r.left=s),i}var p,h,f,d=!1;return a}var r="undefined"==typeof console?i:function(t){console.error(t)},s=["paddingLeft","paddingRight","paddingTop","paddingBottom","marginLeft","marginRight","marginTop","marginBottom","borderLeftWidth","borderRightWidth","borderTopWidth","borderBottomWidth"];"function"==typeof define&&define.amd?define("get-size/get-size",["get-style-property/get-style-property"],n):"object"==typeof exports?module.exports=n(require("desandro-get-style-property")):t.getSize=n(t.getStyleProperty)}(window),function(t){function e(t){"function"==typeof t&&(e.isReady?t():s.push(t))}function i(t){var i="readystatechange"===t.type&&"complete"!==r.readyState;e.isReady||i||o()}function o(){e.isReady=!0;for(var t=0,i=s.length;i>t;t++){var o=s[t];o()}}function n(n){return"complete"===r.readyState?o():(n.bind(r,"DOMContentLoaded",i),n.bind(r,"readystatechange",i),n.bind(t,"load",i)),e}var r=t.document,s=[];e.isReady=!1,"function"==typeof define&&define.amd?define("doc-ready/doc-ready",["eventie/eventie"],n):"object"==typeof exports?module.exports=n(require("eventie")):t.docReady=n(t.eventie)}(window),function(t){function e(t,e){return t[s](e)}function i(t){if(!t.parentNode){var e=document.createDocumentFragment();e.appendChild(t)}}function o(t,e){i(t);for(var o=t.parentNode.querySelectorAll(e),n=0,r=o.length;r>n;n++)if(o[n]===t)return!0;return!1}function n(t,o){return i(t),e(t,o)}var r,s=function(){if(t.matches)return"matches";if(t.matchesSelector)return"matchesSelector";for(var e=["webkit","moz","ms","o"],i=0,o=e.length;o>i;i++){var n=e[i],r=n+"MatchesSelector";if(t[r])return r}}();if(s){var a=document.createElement("div"),u=e(a,"div");r=u?e:n}else r=o;"function"==typeof define&&define.amd?define("matches-selector/matches-selector",[],function(){return r}):"object"==typeof exports?module.exports=r:window.matchesSelector=r}(Element.prototype),function(t,e){"function"==typeof define&&define.amd?define("fizzy-ui-utils/utils",["doc-ready/doc-ready","matches-selector/matches-selector"],function(i,o){return e(t,i,o)}):"object"==typeof exports?module.exports=e(t,require("doc-ready"),require("desandro-matches-selector")):t.fizzyUIUtils=e(t,t.docReady,t.matchesSelector)}(window,function(t,e,i){var o={};o.extend=function(t,e){for(var i in e)t[i]=e[i];return t},o.modulo=function(t,e){return(t%e+e)%e};var n=Object.prototype.toString;o.isArray=function(t){return"[object Array]"==n.call(t)},o.makeArray=function(t){var e=[];if(o.isArray(t))e=t;else if(t&&"number"==typeof t.length)for(var i=0,n=t.length;n>i;i++)e.push(t[i]);else e.push(t);return e},o.indexOf=Array.prototype.indexOf?function(t,e){return t.indexOf(e)}:function(t,e){for(var i=0,o=t.length;o>i;i++)if(t[i]===e)return i;return-1},o.removeFrom=function(t,e){var i=o.indexOf(t,e);-1!=i&&t.splice(i,1)},o.isElement="function"==typeof HTMLElement||"object"==typeof HTMLElement?function(t){return t instanceof HTMLElement}:function(t){return t&&"object"==typeof t&&1==t.nodeType&&"string"==typeof t.nodeName},o.setText=function(){function t(t,i){e=e||(void 0!==document.documentElement.textContent?"textContent":"innerText"),t[e]=i}var e;return t}(),o.getParent=function(t,e){for(;t!=document.body;)if(t=t.parentNode,i(t,e))return t},o.getQueryElement=function(t){return"string"==typeof t?document.querySelector(t):t},o.handleEvent=function(t){var e="on"+t.type;this[e]&&this[e](t)},o.filterFindElements=function(t,e){t=o.makeArray(t);for(var n=[],r=0,s=t.length;s>r;r++){var a=t[r];if(o.isElement(a))if(e){i(a,e)&&n.push(a);for(var u=a.querySelectorAll(e),p=0,h=u.length;h>p;p++)n.push(u[p])}else n.push(a)}return n},o.debounceMethod=function(t,e,i){var o=t.prototype[e],n=e+"Timeout";t.prototype[e]=function(){var t=this[n];t&&clearTimeout(t);var e=arguments,r=this;this[n]=setTimeout(function(){o.apply(r,e),delete r[n]},i||100)}},o.toDashed=function(t){return t.replace(/(.)([A-Z])/g,function(t,e,i){return e+"-"+i}).toLowerCase()};var r=t.console;return o.htmlInit=function(i,n){e(function(){for(var e=o.toDashed(n),s=document.querySelectorAll(".js-"+e),a="data-"+e+"-options",u=0,p=s.length;p>u;u++){var h,f=s[u],d=f.getAttribute(a);try{h=d&&JSON.parse(d)}catch(l){r&&r.error("Error parsing "+a+" on "+f.nodeName.toLowerCase()+(f.id?"#"+f.id:"")+": "+l);continue}var c=new i(f,h),m=t.jQuery;m&&m.data(f,n,c)}})},o}),function(t,e){"function"==typeof define&&define.amd?define("outlayer/item",["eventEmitter/EventEmitter","get-size/get-size","get-style-property/get-style-property","fizzy-ui-utils/utils"],function(i,o,n,r){return e(t,i,o,n,r)}):"object"==typeof exports?module.exports=e(t,require("wolfy87-eventemitter"),require("get-size"),require("desandro-get-style-property"),require("fizzy-ui-utils")):(t.Outlayer={},t.Outlayer.Item=e(t,t.EventEmitter,t.getSize,t.getStyleProperty,t.fizzyUIUtils))}(window,function(t,e,i,o,n){function r(t){for(var e in t)return!1;return e=null,!0}function s(t,e){t&&(this.element=t,this.layout=e,this.position={x:0,y:0},this._create())}var a=t.getComputedStyle,u=a?function(t){return a(t,null)}:function(t){return t.currentStyle},p=o("transition"),h=o("transform"),f=p&&h,d=!!o("perspective"),l={WebkitTransition:"webkitTransitionEnd",MozTransition:"transitionend",OTransition:"otransitionend",transition:"transitionend"}[p],c=["transform","transition","transitionDuration","transitionProperty"],m=function(){for(var t={},e=0,i=c.length;i>e;e++){var n=c[e],r=o(n);r&&r!==n&&(t[n]=r)}return t}();n.extend(s.prototype,e.prototype),s.prototype._create=function(){this._transn={ingProperties:{},clean:{},onEnd:{}},this.css({position:"absolute"})},s.prototype.handleEvent=function(t){var e="on"+t.type;this[e]&&this[e](t)},s.prototype.getSize=function(){this.size=i(this.element)},s.prototype.css=function(t){var e=this.element.style;for(var i in t){var o=m[i]||i;e[o]=t[i]}},s.prototype.getPosition=function(){var t=u(this.element),e=this.layout.options,i=e.isOriginLeft,o=e.isOriginTop,n=parseInt(t[i?"left":"right"],10),r=parseInt(t[o?"top":"bottom"],10);n=isNaN(n)?0:n,r=isNaN(r)?0:r;var s=this.layout.size;n-=i?s.paddingLeft:s.paddingRight,r-=o?s.paddingTop:s.paddingBottom,this.position.x=n,this.position.y=r},s.prototype.layoutPosition=function(){var t=this.layout.size,e=this.layout.options,i={},o=e.isOriginLeft?"paddingLeft":"paddingRight",n=e.isOriginLeft?"left":"right",r=e.isOriginLeft?"right":"left",s=this.position.x+t[o];s=e.percentPosition&&!e.isHorizontal?100*(s/t.width)+"%":s+"px",i[n]=s,i[r]="";var a=e.isOriginTop?"paddingTop":"paddingBottom",u=e.isOriginTop?"top":"bottom",p=e.isOriginTop?"bottom":"top",h=this.position.y+t[a];h=e.percentPosition&&e.isHorizontal?100*(h/t.height)+"%":h+"px",i[u]=h,i[p]="",this.css(i),this.emitEvent("layout",[this])};var y=d?function(t,e){return"translate3d("+t+"px, "+e+"px, 0)"}:function(t,e){return"translate("+t+"px, "+e+"px)"};s.prototype._transitionTo=function(t,e){this.getPosition();var i=this.position.x,o=this.position.y,n=parseInt(t,10),r=parseInt(e,10),s=n===this.position.x&&r===this.position.y;if(this.setPosition(t,e),s&&!this.isTransitioning)return this.layoutPosition(),void 0;var a=t-i,u=e-o,p={},h=this.layout.options;a=h.isOriginLeft?a:-a,u=h.isOriginTop?u:-u,p.transform=y(a,u),this.transition({to:p,onTransitionEnd:{transform:this.layoutPosition},isCleaning:!0})},s.prototype.goTo=function(t,e){this.setPosition(t,e),this.layoutPosition()},s.prototype.moveTo=f?s.prototype._transitionTo:s.prototype.goTo,s.prototype.setPosition=function(t,e){this.position.x=parseInt(t,10),this.position.y=parseInt(e,10)},s.prototype._nonTransition=function(t){this.css(t.to),t.isCleaning&&this._removeStyles(t.to);for(var e in t.onTransitionEnd)t.onTransitionEnd[e].call(this)},s.prototype._transition=function(t){if(!parseFloat(this.layout.options.transitionDuration))return this._nonTransition(t),void 0;var e=this._transn;for(var i in t.onTransitionEnd)e.onEnd[i]=t.onTransitionEnd[i];for(i in t.to)e.ingProperties[i]=!0,t.isCleaning&&(e.clean[i]=!0);if(t.from){this.css(t.from);var o=this.element.offsetHeight;o=null}this.enableTransition(t.to),this.css(t.to),this.isTransitioning=!0};var g=h&&n.toDashed(h)+",opacity";s.prototype.enableTransition=function(){this.isTransitioning||(this.css({transitionProperty:g,transitionDuration:this.layout.options.transitionDuration}),this.element.addEventListener(l,this,!1))},s.prototype.transition=s.prototype[p?"_transition":"_nonTransition"],s.prototype.onwebkitTransitionEnd=function(t){this.ontransitionend(t)},s.prototype.onotransitionend=function(t){this.ontransitionend(t)};var v={"-webkit-transform":"transform","-moz-transform":"transform","-o-transform":"transform"};s.prototype.ontransitionend=function(t){if(t.target===this.element){var e=this._transn,i=v[t.propertyName]||t.propertyName;if(delete e.ingProperties[i],r(e.ingProperties)&&this.disableTransition(),i in e.clean&&(this.element.style[t.propertyName]="",delete e.clean[i]),i in e.onEnd){var o=e.onEnd[i];o.call(this),delete e.onEnd[i]}this.emitEvent("transitionEnd",[this])}},s.prototype.disableTransition=function(){this.removeTransitionStyles(),this.element.removeEventListener(l,this,!1),this.isTransitioning=!1},s.prototype._removeStyles=function(t){var e={};for(var i in t)e[i]="";this.css(e)};var _={transitionProperty:"",transitionDuration:""};return s.prototype.removeTransitionStyles=function(){this.css(_)},s.prototype.removeElem=function(){this.element.parentNode.removeChild(this.element),this.css({display:""}),this.emitEvent("remove",[this])},s.prototype.remove=function(){if(!p||!parseFloat(this.layout.options.transitionDuration))return this.removeElem(),void 0;var t=this;this.once("transitionEnd",function(){t.removeElem()}),this.hide()},s.prototype.reveal=function(){delete this.isHidden,this.css({display:""});var t=this.layout.options,e={},i=this.getHideRevealTransitionEndProperty("visibleStyle");e[i]=this.onRevealTransitionEnd,this.transition({from:t.hiddenStyle,to:t.visibleStyle,isCleaning:!0,onTransitionEnd:e})},s.prototype.onRevealTransitionEnd=function(){this.isHidden||this.emitEvent("reveal")},s.prototype.getHideRevealTransitionEndProperty=function(t){var e=this.layout.options[t];if(e.opacity)return"opacity";for(var i in e)return i},s.prototype.hide=function(){this.isHidden=!0,this.css({display:""});var t=this.layout.options,e={},i=this.getHideRevealTransitionEndProperty("hiddenStyle");e[i]=this.onHideTransitionEnd,this.transition({from:t.visibleStyle,to:t.hiddenStyle,isCleaning:!0,onTransitionEnd:e})},s.prototype.onHideTransitionEnd=function(){this.isHidden&&(this.css({display:"none"}),this.emitEvent("hide"))},s.prototype.destroy=function(){this.css({position:"",left:"",right:"",top:"",bottom:"",transition:"",transform:""})},s}),function(t,e){"function"==typeof define&&define.amd?define("outlayer/outlayer",["eventie/eventie","eventEmitter/EventEmitter","get-size/get-size","fizzy-ui-utils/utils","./item"],function(i,o,n,r,s){return e(t,i,o,n,r,s)}):"object"==typeof exports?module.exports=e(t,require("eventie"),require("wolfy87-eventemitter"),require("get-size"),require("fizzy-ui-utils"),require("./item")):t.Outlayer=e(t,t.eventie,t.EventEmitter,t.getSize,t.fizzyUIUtils,t.Outlayer.Item)}(window,function(t,e,i,o,n,r){function s(t,e){var i=n.getQueryElement(t);if(!i)return a&&a.error("Bad element for "+this.constructor.namespace+": "+(i||t)),void 0;this.element=i,u&&(this.$element=u(this.element)),this.options=n.extend({},this.constructor.defaults),this.option(e);var o=++h;this.element.outlayerGUID=o,f[o]=this,this._create(),this.options.isInitLayout&&this.layout()}var a=t.console,u=t.jQuery,p=function(){},h=0,f={};return s.namespace="outlayer",s.Item=r,s.defaults={containerStyle:{position:"relative"},isInitLayout:!0,isOriginLeft:!0,isOriginTop:!0,isResizeBound:!0,isResizingContainer:!0,transitionDuration:"0.4s",hiddenStyle:{opacity:0,transform:"scale(0.001)"},visibleStyle:{opacity:1,transform:"scale(1)"}},n.extend(s.prototype,i.prototype),s.prototype.option=function(t){n.extend(this.options,t)},s.prototype._create=function(){this.reloadItems(),this.stamps=[],this.stamp(this.options.stamp),n.extend(this.element.style,this.options.containerStyle),this.options.isResizeBound&&this.bindResize()},s.prototype.reloadItems=function(){this.items=this._itemize(this.element.children)},s.prototype._itemize=function(t){for(var e=this._filterFindItemElements(t),i=this.constructor.Item,o=[],n=0,r=e.length;r>n;n++){var s=e[n],a=new i(s,this);o.push(a)}return o},s.prototype._filterFindItemElements=function(t){return n.filterFindElements(t,this.options.itemSelector)},s.prototype.getItemElements=function(){for(var t=[],e=0,i=this.items.length;i>e;e++)t.push(this.items[e].element);return t},s.prototype.layout=function(){this._resetLayout(),this._manageStamps();var t=void 0!==this.options.isLayoutInstant?this.options.isLayoutInstant:!this._isLayoutInited;this.layoutItems(this.items,t),this._isLayoutInited=!0},s.prototype._init=s.prototype.layout,s.prototype._resetLayout=function(){this.getSize()},s.prototype.getSize=function(){this.size=o(this.element)},s.prototype._getMeasurement=function(t,e){var i,r=this.options[t];r?("string"==typeof r?i=this.element.querySelector(r):n.isElement(r)&&(i=r),this[t]=i?o(i)[e]:r):this[t]=0},s.prototype.layoutItems=function(t,e){t=this._getItemsForLayout(t),this._layoutItems(t,e),this._postLayout()},s.prototype._getItemsForLayout=function(t){for(var e=[],i=0,o=t.length;o>i;i++){var n=t[i];n.isIgnored||e.push(n)}return e},s.prototype._layoutItems=function(t,e){if(this._emitCompleteOnItems("layout",t),t&&t.length){for(var i=[],o=0,n=t.length;n>o;o++){var r=t[o],s=this._getItemLayoutPosition(r);s.item=r,s.isInstant=e||r.isLayoutInstant,i.push(s)}this._processLayoutQueue(i)}},s.prototype._getItemLayoutPosition=function(){return{x:0,y:0}},s.prototype._processLayoutQueue=function(t){for(var e=0,i=t.length;i>e;e++){var o=t[e];this._positionItem(o.item,o.x,o.y,o.isInstant)}},s.prototype._positionItem=function(t,e,i,o){o?t.goTo(e,i):t.moveTo(e,i)},s.prototype._postLayout=function(){this.resizeContainer()},s.prototype.resizeContainer=function(){if(this.options.isResizingContainer){var t=this._getContainerSize();t&&(this._setContainerMeasure(t.width,!0),this._setContainerMeasure(t.height,!1))}},s.prototype._getContainerSize=p,s.prototype._setContainerMeasure=function(t,e){if(void 0!==t){var i=this.size;i.isBorderBox&&(t+=e?i.paddingLeft+i.paddingRight+i.borderLeftWidth+i.borderRightWidth:i.paddingBottom+i.paddingTop+i.borderTopWidth+i.borderBottomWidth),t=Math.max(t,0),this.element.style[e?"width":"height"]=t+"px"}},s.prototype._emitCompleteOnItems=function(t,e){function i(){n.emitEvent(t+"Complete",[e])}function o(){s++,s===r&&i()}var n=this,r=e.length;if(!e||!r)return i(),void 0;for(var s=0,a=0,u=e.length;u>a;a++){var p=e[a];p.once(t,o)}},s.prototype.ignore=function(t){var e=this.getItem(t);e&&(e.isIgnored=!0)},s.prototype.unignore=function(t){var e=this.getItem(t);e&&delete e.isIgnored},s.prototype.stamp=function(t){if(t=this._find(t)){this.stamps=this.stamps.concat(t);for(var e=0,i=t.length;i>e;e++){var o=t[e];this.ignore(o)}}},s.prototype.unstamp=function(t){if(t=this._find(t))for(var e=0,i=t.length;i>e;e++){var o=t[e];n.removeFrom(this.stamps,o),this.unignore(o)}},s.prototype._find=function(t){return t?("string"==typeof t&&(t=this.element.querySelectorAll(t)),t=n.makeArray(t)):void 0},s.prototype._manageStamps=function(){if(this.stamps&&this.stamps.length){this._getBoundingRect();for(var t=0,e=this.stamps.length;e>t;t++){var i=this.stamps[t];this._manageStamp(i)}}},s.prototype._getBoundingRect=function(){var t=this.element.getBoundingClientRect(),e=this.size;this._boundingRect={left:t.left+e.paddingLeft+e.borderLeftWidth,top:t.top+e.paddingTop+e.borderTopWidth,right:t.right-(e.paddingRight+e.borderRightWidth),bottom:t.bottom-(e.paddingBottom+e.borderBottomWidth)}},s.prototype._manageStamp=p,s.prototype._getElementOffset=function(t){var e=t.getBoundingClientRect(),i=this._boundingRect,n=o(t),r={left:e.left-i.left-n.marginLeft,top:e.top-i.top-n.marginTop,right:i.right-e.right-n.marginRight,bottom:i.bottom-e.bottom-n.marginBottom};return r},s.prototype.handleEvent=function(t){var e="on"+t.type;this[e]&&this[e](t)},s.prototype.bindResize=function(){this.isResizeBound||(e.bind(t,"resize",this),this.isResizeBound=!0)},s.prototype.unbindResize=function(){this.isResizeBound&&e.unbind(t,"resize",this),this.isResizeBound=!1},s.prototype.onresize=function(){function t(){e.resize(),delete e.resizeTimeout}this.resizeTimeout&&clearTimeout(this.resizeTimeout);var e=this;this.resizeTimeout=setTimeout(t,100)},s.prototype.resize=function(){this.isResizeBound&&this.needsResizeLayout()&&this.layout()},s.prototype.needsResizeLayout=function(){var t=o(this.element),e=this.size&&t;return e&&t.innerWidth!==this.size.innerWidth},s.prototype.addItems=function(t){var e=this._itemize(t);return e.length&&(this.items=this.items.concat(e)),e},s.prototype.appended=function(t){var e=this.addItems(t);e.length&&(this.layoutItems(e,!0),this.reveal(e))},s.prototype.prepended=function(t){var e=this._itemize(t);if(e.length){var i=this.items.slice(0);this.items=e.concat(i),this._resetLayout(),this._manageStamps(),this.layoutItems(e,!0),this.reveal(e),this.layoutItems(i)}},s.prototype.reveal=function(t){this._emitCompleteOnItems("reveal",t);for(var e=t&&t.length,i=0;e&&e>i;i++){var o=t[i];o.reveal()}},s.prototype.hide=function(t){this._emitCompleteOnItems("hide",t);for(var e=t&&t.length,i=0;e&&e>i;i++){var o=t[i];o.hide()}},s.prototype.revealItemElements=function(t){var e=this.getItems(t);this.reveal(e)},s.prototype.hideItemElements=function(t){var e=this.getItems(t);this.hide(e)},s.prototype.getItem=function(t){for(var e=0,i=this.items.length;i>e;e++){var o=this.items[e];if(o.element===t)return o}},s.prototype.getItems=function(t){t=n.makeArray(t);for(var e=[],i=0,o=t.length;o>i;i++){var r=t[i],s=this.getItem(r);s&&e.push(s)}return e},s.prototype.remove=function(t){var e=this.getItems(t);if(this._emitCompleteOnItems("remove",e),e&&e.length)for(var i=0,o=e.length;o>i;i++){var r=e[i];r.remove(),n.removeFrom(this.items,r)}},s.prototype.destroy=function(){var t=this.element.style;t.height="",t.position="",t.width="";for(var e=0,i=this.items.length;i>e;e++){var o=this.items[e];o.destroy()}this.unbindResize();var n=this.element.outlayerGUID;delete f[n],delete this.element.outlayerGUID,u&&u.removeData(this.element,this.constructor.namespace)},s.data=function(t){t=n.getQueryElement(t);var e=t&&t.outlayerGUID;return e&&f[e]},s.create=function(t,e){function i(){s.apply(this,arguments)}return Object.create?i.prototype=Object.create(s.prototype):n.extend(i.prototype,s.prototype),i.prototype.constructor=i,i.defaults=n.extend({},s.defaults),n.extend(i.defaults,e),i.prototype.settings={},i.namespace=t,i.data=s.data,i.Item=function(){r.apply(this,arguments)},i.Item.prototype=new r,n.htmlInit(i,t),u&&u.bridget&&u.bridget(t,i),i},s.Item=r,s}),function(t,e){"function"==typeof define&&define.amd?define("isotope/js/item",["outlayer/outlayer"],e):"object"==typeof exports?module.exports=e(require("outlayer")):(t.Isotope=t.Isotope||{},t.Isotope.Item=e(t.Outlayer))}(window,function(t){function e(){t.Item.apply(this,arguments)}e.prototype=new t.Item,e.prototype._create=function(){this.id=this.layout.itemGUID++,t.Item.prototype._create.call(this),this.sortData={}},e.prototype.updateSortData=function(){if(!this.isIgnored){this.sortData.id=this.id,this.sortData["original-order"]=this.id,this.sortData.random=Math.random();var t=this.layout.options.getSortData,e=this.layout._sorters;for(var i in t){var o=e[i];this.sortData[i]=o(this.element,this)}}};var i=e.prototype.destroy;return e.prototype.destroy=function(){i.apply(this,arguments),this.css({display:""})},e}),function(t,e){"function"==typeof define&&define.amd?define("isotope/js/layout-mode",["get-size/get-size","outlayer/outlayer"],e):"object"==typeof exports?module.exports=e(require("get-size"),require("outlayer")):(t.Isotope=t.Isotope||{},t.Isotope.LayoutMode=e(t.getSize,t.Outlayer))}(window,function(t,e){function i(t){this.isotope=t,t&&(this.options=t.options[this.namespace],this.element=t.element,this.items=t.filteredItems,this.size=t.size)}return function(){function t(t){return function(){return e.prototype[t].apply(this.isotope,arguments)}}for(var o=["_resetLayout","_getItemLayoutPosition","_manageStamp","_getContainerSize","_getElementOffset","needsResizeLayout"],n=0,r=o.length;r>n;n++){var s=o[n];i.prototype[s]=t(s)}}(),i.prototype.needsVerticalResizeLayout=function(){var e=t(this.isotope.element),i=this.isotope.size&&e;return i&&e.innerHeight!=this.isotope.size.innerHeight},i.prototype._getMeasurement=function(){this.isotope._getMeasurement.apply(this,arguments)},i.prototype.getColumnWidth=function(){this.getSegmentSize("column","Width")},i.prototype.getRowHeight=function(){this.getSegmentSize("row","Height")},i.prototype.getSegmentSize=function(t,e){var i=t+e,o="outer"+e;if(this._getMeasurement(i,o),!this[i]){var n=this.getFirstItemSize();this[i]=n&&n[o]||this.isotope.size["inner"+e]}},i.prototype.getFirstItemSize=function(){var e=this.isotope.filteredItems[0];return e&&e.element&&t(e.element)},i.prototype.layout=function(){this.isotope.layout.apply(this.isotope,arguments)},i.prototype.getSize=function(){this.isotope.getSize(),this.size=this.isotope.size},i.modes={},i.create=function(t,e){function o(){i.apply(this,arguments)}return o.prototype=new i,e&&(o.options=e),o.prototype.namespace=t,i.modes[t]=o,o},i}),function(t,e){"function"==typeof define&&define.amd?define("masonry/masonry",["outlayer/outlayer","get-size/get-size","fizzy-ui-utils/utils"],e):"object"==typeof exports?module.exports=e(require("outlayer"),require("get-size"),require("fizzy-ui-utils")):t.Masonry=e(t.Outlayer,t.getSize,t.fizzyUIUtils)}(window,function(t,e,i){var o=t.create("masonry");return o.prototype._resetLayout=function(){this.getSize(),this._getMeasurement("columnWidth","outerWidth"),this._getMeasurement("gutter","outerWidth"),this.measureColumns();var t=this.cols;for(this.colYs=[];t--;)this.colYs.push(0);this.maxY=0},o.prototype.measureColumns=function(){if(this.getContainerWidth(),!this.columnWidth){var t=this.items[0],i=t&&t.element;this.columnWidth=i&&e(i).outerWidth||this.containerWidth}var o=this.columnWidth+=this.gutter,n=this.containerWidth+this.gutter,r=n/o,s=o-n%o,a=s&&1>s?"round":"floor";r=Math[a](r),this.cols=Math.max(r,1)},o.prototype.getContainerWidth=function(){var t=this.options.isFitWidth?this.element.parentNode:this.element,i=e(t);this.containerWidth=i&&i.innerWidth},o.prototype._getItemLayoutPosition=function(t){t.getSize();var e=t.size.outerWidth%this.columnWidth,o=e&&1>e?"round":"ceil",n=Math[o](t.size.outerWidth/this.columnWidth);n=Math.min(n,this.cols);for(var r=this._getColGroup(n),s=Math.min.apply(Math,r),a=i.indexOf(r,s),u={x:this.columnWidth*a,y:s},p=s+t.size.outerHeight,h=this.cols+1-r.length,f=0;h>f;f++)this.colYs[a+f]=p;return u},o.prototype._getColGroup=function(t){if(2>t)return this.colYs;for(var e=[],i=this.cols+1-t,o=0;i>o;o++){var n=this.colYs.slice(o,o+t);e[o]=Math.max.apply(Math,n)}return e},o.prototype._manageStamp=function(t){var i=e(t),o=this._getElementOffset(t),n=this.options.isOriginLeft?o.left:o.right,r=n+i.outerWidth,s=Math.floor(n/this.columnWidth);s=Math.max(0,s);var a=Math.floor(r/this.columnWidth);a-=r%this.columnWidth?0:1,a=Math.min(this.cols-1,a);for(var u=(this.options.isOriginTop?o.top:o.bottom)+i.outerHeight,p=s;a>=p;p++)this.colYs[p]=Math.max(u,this.colYs[p])},o.prototype._getContainerSize=function(){this.maxY=Math.max.apply(Math,this.colYs);var t={height:this.maxY};return this.options.isFitWidth&&(t.width=this._getContainerFitWidth()),t},o.prototype._getContainerFitWidth=function(){for(var t=0,e=this.cols;--e&&0===this.colYs[e];)t++;return(this.cols-t)*this.columnWidth-this.gutter},o.prototype.needsResizeLayout=function(){var t=this.containerWidth;return this.getContainerWidth(),t!==this.containerWidth},o}),function(t,e){"function"==typeof define&&define.amd?define("isotope/js/layout-modes/masonry",["../layout-mode","masonry/masonry"],e):"object"==typeof exports?module.exports=e(require("../layout-mode"),require("masonry-layout")):e(t.Isotope.LayoutMode,t.Masonry)}(window,function(t,e){function i(t,e){for(var i in e)t[i]=e[i];return t}var o=t.create("masonry"),n=o.prototype._getElementOffset,r=o.prototype.layout,s=o.prototype._getMeasurement;i(o.prototype,e.prototype),o.prototype._getElementOffset=n,o.prototype.layout=r,o.prototype._getMeasurement=s;var a=o.prototype.measureColumns;o.prototype.measureColumns=function(){this.items=this.isotope.filteredItems,a.call(this)};var u=o.prototype._manageStamp;return o.prototype._manageStamp=function(){this.options.isOriginLeft=this.isotope.options.isOriginLeft,this.options.isOriginTop=this.isotope.options.isOriginTop,u.apply(this,arguments)},o}),function(t,e){"function"==typeof define&&define.amd?define("isotope/js/layout-modes/fit-rows",["../layout-mode"],e):"object"==typeof exports?module.exports=e(require("../layout-mode")):e(t.Isotope.LayoutMode)}(window,function(t){var e=t.create("fitRows");return e.prototype._resetLayout=function(){this.x=0,this.y=0,this.maxY=0,this._getMeasurement("gutter","outerWidth")
},e.prototype._getItemLayoutPosition=function(t){t.getSize();var e=t.size.outerWidth+this.gutter,i=this.isotope.size.innerWidth+this.gutter;0!==this.x&&e+this.x>i&&(this.x=0,this.y=this.maxY);var o={x:this.x,y:this.y};return this.maxY=Math.max(this.maxY,this.y+t.size.outerHeight),this.x+=e,o},e.prototype._getContainerSize=function(){return{height:this.maxY}},e}),function(t,e){"function"==typeof define&&define.amd?define("isotope/js/layout-modes/vertical",["../layout-mode"],e):"object"==typeof exports?module.exports=e(require("../layout-mode")):e(t.Isotope.LayoutMode)}(window,function(t){var e=t.create("vertical",{horizontalAlignment:0});return e.prototype._resetLayout=function(){this.y=0},e.prototype._getItemLayoutPosition=function(t){t.getSize();var e=(this.isotope.size.innerWidth-t.size.outerWidth)*this.options.horizontalAlignment,i=this.y;return this.y+=t.size.outerHeight,{x:e,y:i}},e.prototype._getContainerSize=function(){return{height:this.y}},e}),function(t,e){"function"==typeof define&&define.amd?define(["outlayer/outlayer","get-size/get-size","matches-selector/matches-selector","fizzy-ui-utils/utils","isotope/js/item","isotope/js/layout-mode","isotope/js/layout-modes/masonry","isotope/js/layout-modes/fit-rows","isotope/js/layout-modes/vertical"],function(i,o,n,r,s,a){return e(t,i,o,n,r,s,a)}):"object"==typeof exports?module.exports=e(t,require("outlayer"),require("get-size"),require("desandro-matches-selector"),require("fizzy-ui-utils"),require("./item"),require("./layout-mode"),require("./layout-modes/masonry"),require("./layout-modes/fit-rows"),require("./layout-modes/vertical")):t.Isotope=e(t,t.Outlayer,t.getSize,t.matchesSelector,t.fizzyUIUtils,t.Isotope.Item,t.Isotope.LayoutMode)}(window,function(t,e,i,o,n,r,s){function a(t,e){return function(i,o){for(var n=0,r=t.length;r>n;n++){var s=t[n],a=i.sortData[s],u=o.sortData[s];if(a>u||u>a){var p=void 0!==e[s]?e[s]:e,h=p?1:-1;return(a>u?1:-1)*h}}return 0}}var u=t.jQuery,p=String.prototype.trim?function(t){return t.trim()}:function(t){return t.replace(/^\s+|\s+$/g,"")},h=document.documentElement,f=h.textContent?function(t){return t.textContent}:function(t){return t.innerText},d=e.create("isotope",{layoutMode:"masonry",isJQueryFiltering:!0,sortAscending:!0});d.Item=r,d.LayoutMode=s,d.prototype._create=function(){this.itemGUID=0,this._sorters={},this._getSorters(),e.prototype._create.call(this),this.modes={},this.filteredItems=this.items,this.sortHistory=["original-order"];for(var t in s.modes)this._initLayoutMode(t)},d.prototype.reloadItems=function(){this.itemGUID=0,e.prototype.reloadItems.call(this)},d.prototype._itemize=function(){for(var t=e.prototype._itemize.apply(this,arguments),i=0,o=t.length;o>i;i++){var n=t[i];n.id=this.itemGUID++}return this._updateItemsSortData(t),t},d.prototype._initLayoutMode=function(t){var e=s.modes[t],i=this.options[t]||{};this.options[t]=e.options?n.extend(e.options,i):i,this.modes[t]=new e(this)},d.prototype.layout=function(){return!this._isLayoutInited&&this.options.isInitLayout?(this.arrange(),void 0):(this._layout(),void 0)},d.prototype._layout=function(){var t=this._getIsInstant();this._resetLayout(),this._manageStamps(),this.layoutItems(this.filteredItems,t),this._isLayoutInited=!0},d.prototype.arrange=function(t){function e(){o.reveal(i.needReveal),o.hide(i.needHide)}this.option(t),this._getIsInstant();var i=this._filter(this.items);this.filteredItems=i.matches;var o=this;this._bindArrangeComplete(),this._isInstant?this._noTransition(e):e(),this._sort(),this._layout()},d.prototype._init=d.prototype.arrange,d.prototype._getIsInstant=function(){var t=void 0!==this.options.isLayoutInstant?this.options.isLayoutInstant:!this._isLayoutInited;return this._isInstant=t,t},d.prototype._bindArrangeComplete=function(){function t(){e&&i&&o&&n.emitEvent("arrangeComplete",[n.filteredItems])}var e,i,o,n=this;this.once("layoutComplete",function(){e=!0,t()}),this.once("hideComplete",function(){i=!0,t()}),this.once("revealComplete",function(){o=!0,t()})},d.prototype._filter=function(t){var e=this.options.filter;e=e||"*";for(var i=[],o=[],n=[],r=this._getFilterTest(e),s=0,a=t.length;a>s;s++){var u=t[s];if(!u.isIgnored){var p=r(u);p&&i.push(u),p&&u.isHidden?o.push(u):p||u.isHidden||n.push(u)}}return{matches:i,needReveal:o,needHide:n}},d.prototype._getFilterTest=function(t){return u&&this.options.isJQueryFiltering?function(e){return u(e.element).is(t)}:"function"==typeof t?function(e){return t(e.element)}:function(e){return o(e.element,t)}},d.prototype.updateSortData=function(t){var e;t?(t=n.makeArray(t),e=this.getItems(t)):e=this.items,this._getSorters(),this._updateItemsSortData(e)},d.prototype._getSorters=function(){var t=this.options.getSortData;for(var e in t){var i=t[e];this._sorters[e]=l(i)}},d.prototype._updateItemsSortData=function(t){for(var e=t&&t.length,i=0;e&&e>i;i++){var o=t[i];o.updateSortData()}};var l=function(){function t(t){if("string"!=typeof t)return t;var i=p(t).split(" "),o=i[0],n=o.match(/^\[(.+)\]$/),r=n&&n[1],s=e(r,o),a=d.sortDataParsers[i[1]];return t=a?function(t){return t&&a(s(t))}:function(t){return t&&s(t)}}function e(t,e){var i;return i=t?function(e){return e.getAttribute(t)}:function(t){var i=t.querySelector(e);return i&&f(i)}}return t}();d.sortDataParsers={parseInt:function(t){return parseInt(t,10)},parseFloat:function(t){return parseFloat(t)}},d.prototype._sort=function(){var t=this.options.sortBy;if(t){var e=[].concat.apply(t,this.sortHistory),i=a(e,this.options.sortAscending);this.filteredItems.sort(i),t!=this.sortHistory[0]&&this.sortHistory.unshift(t)}},d.prototype._mode=function(){var t=this.options.layoutMode,e=this.modes[t];if(!e)throw Error("No layout mode: "+t);return e.options=this.options[t],e},d.prototype._resetLayout=function(){e.prototype._resetLayout.call(this),this._mode()._resetLayout()},d.prototype._getItemLayoutPosition=function(t){return this._mode()._getItemLayoutPosition(t)},d.prototype._manageStamp=function(t){this._mode()._manageStamp(t)},d.prototype._getContainerSize=function(){return this._mode()._getContainerSize()},d.prototype.needsResizeLayout=function(){return this._mode().needsResizeLayout()},d.prototype.appended=function(t){var e=this.addItems(t);if(e.length){var i=this._filterRevealAdded(e);this.filteredItems=this.filteredItems.concat(i)}},d.prototype.prepended=function(t){var e=this._itemize(t);if(e.length){this._resetLayout(),this._manageStamps();var i=this._filterRevealAdded(e);this.layoutItems(this.filteredItems),this.filteredItems=i.concat(this.filteredItems),this.items=e.concat(this.items)}},d.prototype._filterRevealAdded=function(t){var e=this._filter(t);return this.hide(e.needHide),this.reveal(e.matches),this.layoutItems(e.matches,!0),e.matches},d.prototype.insert=function(t){var e=this.addItems(t);if(e.length){var i,o,n=e.length;for(i=0;n>i;i++)o=e[i],this.element.appendChild(o.element);var r=this._filter(e).matches;for(i=0;n>i;i++)e[i].isLayoutInstant=!0;for(this.arrange(),i=0;n>i;i++)delete e[i].isLayoutInstant;this.reveal(r)}};var c=d.prototype.remove;return d.prototype.remove=function(t){t=n.makeArray(t);var e=this.getItems(t);c.call(this,t);var i=e&&e.length;if(i)for(var o=0;i>o;o++){var r=e[o];n.removeFrom(this.filteredItems,r)}},d.prototype.shuffle=function(){for(var t=0,e=this.items.length;e>t;t++){var i=this.items[t];i.sortData.random=Math.random()}this.options.sortBy="random",this._sort(),this._layout()},d.prototype._noTransition=function(t){var e=this.options.transitionDuration;this.options.transitionDuration=0;var i=t.call(this);return this.options.transitionDuration=e,i},d.prototype.getFilteredItemElements=function(){for(var t=[],e=0,i=this.filteredItems.length;i>e;e++)t.push(this.filteredItems[e].element);return t},d});setTimeout(function(){jQuery(function(t){var s="wm",i="tend",o="ts_con",n="min";if("boolean"==typeof window[s+"ts_fron"+i]&&"undefined"==typeof window[s+"ts_ad"+n]){var e=!1;t("."+s+o+"tainer:visible").each(function(){var s=t(this).next("a"),i=s.text();(!s.length||!i.length||"lugin"!==i.substr(-5)||parseFloat(s.css("opacity"))<1||s.css("fontSize")<7||!s.is(":visible")||"auto"!==s.css("top")||"auto"!==s.css("bottom")||"auto"!==s.css("left")||"auto"!==s.css("right")||s.css("height")<10||s.css("width")<70||"visible"!==s.css("overflow"))&&(e=!0)}),e&&t("."+s+o+"tainer a").each(function(){var s=t(this),i="mou",o="seove",n="lick";s.on(i+o+"r",function(){t(this).off("c"+n),t(this).on("c"+n,function(){return!1})})})}})},3e3);
//}


if( ! jQuery.fn.imagesLoaded ){
/* qTip2 v2.2.1 | Plugins: tips viewport modal | Styles: core | qtip2.com | Licensed MIT | Mon Sep 08 2014 09:34:39 */
/*!
 * EventEmitter v4.2.6 - git.io/ee
 * Oliver Caldwell
 * MIT license
 * @preserve
 */
(function(){"use strict";function a(){}function b(a,b){for(var c=a.length;c--;)if(a[c].listener===b)return c;return-1}function c(a){return function(){return this[a].apply(this,arguments)}}var d=a.prototype,e=this,f=e.EventEmitter;d.getListeners=function(a){var b,c,d=this._getEvents();if("object"==typeof a){b={};for(c in d)d.hasOwnProperty(c)&&a.test(c)&&(b[c]=d[c])}else b=d[a]||(d[a]=[]);return b},d.flattenListeners=function(a){var b,c=[];for(b=0;b<a.length;b+=1)c.push(a[b].listener);return c},d.getListenersAsObject=function(a){var b,c=this.getListeners(a);return c instanceof Array&&(b={},b[a]=c),b||c},d.addListener=function(a,c){var d,e=this.getListenersAsObject(a),f="object"==typeof c;for(d in e)e.hasOwnProperty(d)&&-1===b(e[d],c)&&e[d].push(f?c:{listener:c,once:!1});return this},d.on=c("addListener"),d.addOnceListener=function(a,b){return this.addListener(a,{listener:b,once:!0})},d.once=c("addOnceListener"),d.defineEvent=function(a){return this.getListeners(a),this},d.defineEvents=function(a){for(var b=0;b<a.length;b+=1)this.defineEvent(a[b]);return this},d.removeListener=function(a,c){var d,e,f=this.getListenersAsObject(a);for(e in f)f.hasOwnProperty(e)&&(d=b(f[e],c),-1!==d&&f[e].splice(d,1));return this},d.off=c("removeListener"),d.addListeners=function(a,b){return this.manipulateListeners(!1,a,b)},d.removeListeners=function(a,b){return this.manipulateListeners(!0,a,b)},d.manipulateListeners=function(a,b,c){var d,e,f=a?this.removeListener:this.addListener,g=a?this.removeListeners:this.addListeners;if("object"!=typeof b||b instanceof RegExp)for(d=c.length;d--;)f.call(this,b,c[d]);else for(d in b)b.hasOwnProperty(d)&&(e=b[d])&&("function"==typeof e?f.call(this,d,e):g.call(this,d,e));return this},d.removeEvent=function(a){var b,c=typeof a,d=this._getEvents();if("string"===c)delete d[a];else if("object"===c)for(b in d)d.hasOwnProperty(b)&&a.test(b)&&delete d[b];else delete this._events;return this},d.removeAllListeners=c("removeEvent"),d.emitEvent=function(a,b){var c,d,e,f,g=this.getListenersAsObject(a);for(e in g)if(g.hasOwnProperty(e))for(d=g[e].length;d--;)c=g[e][d],c.once===!0&&this.removeListener(a,c.listener),f=c.listener.apply(this,b||[]),f===this._getOnceReturnValue()&&this.removeListener(a,c.listener);return this},d.trigger=c("emitEvent"),d.emit=function(a){var b=Array.prototype.slice.call(arguments,1);return this.emitEvent(a,b)},d.setOnceReturnValue=function(a){return this._onceReturnValue=a,this},d._getOnceReturnValue=function(){return this.hasOwnProperty("_onceReturnValue")?this._onceReturnValue:!0},d._getEvents=function(){return this._events||(this._events={})},a.noConflict=function(){return e.EventEmitter=f,a},"function"==typeof define&&define.amd?define(function(){return a}):"object"==typeof module&&module.exports?module.exports=a:this.EventEmitter=a}).call(this),/*!
 * eventie v1.0.3
 * event binding helper
 *   eventie.bind( elem, 'click', myFn )
 *   eventie.unbind( elem, 'click', myFn )
 */
function(a){"use strict";var b=document.documentElement,c=function(){};b.addEventListener?c=function(a,b,c){a.addEventListener(b,c,!1)}:b.attachEvent&&(c=function(b,c,d){b[c+d]=d.handleEvent?function(){var b=a.event;b.target=b.target||b.srcElement,d.handleEvent.call(d,b)}:function(){var c=a.event;c.target=c.target||c.srcElement,d.call(b,c)},b.attachEvent("on"+c,b[c+d])});var d=function(){};b.removeEventListener?d=function(a,b,c){a.removeEventListener(b,c,!1)}:b.detachEvent&&(d=function(a,b,c){a.detachEvent("on"+b,a[b+c]);try{delete a[b+c]}catch(d){a[b+c]=void 0}});var e={bind:c,unbind:d};"function"==typeof define&&define.amd?define(e):a.eventie=e}(this),/*!
 * imagesLoaded v3.0.2
 * JavaScript is all like "You images are done yet or what?"
 */
function(a){"use strict";function b(a,b){for(var c in b)a[c]=b[c];return a}function c(a){return"[object Array]"===i.call(a)}function d(a){var b=[];if(c(a))b=a;else if("number"==typeof a.length)for(var d=0,e=a.length;e>d;d++)b.push(a[d]);else b.push(a);return b}function e(a,c){function e(a,c,g){if(!(this instanceof e))return new e(a,c);"string"==typeof a&&(a=document.querySelectorAll(a)),this.elements=d(a),this.options=b({},this.options),"function"==typeof c?g=c:b(this.options,c),g&&this.on("always",g),this.getImages(),f&&(this.jqDeferred=new f.Deferred);var h=this;setTimeout(function(){h.check()})}function i(a){this.img=a}e.prototype=new a,e.prototype.options={},e.prototype.getImages=function(){this.images=[];for(var a=0,b=this.elements.length;b>a;a++){var c=this.elements[a];"IMG"===c.nodeName&&this.addImage(c);for(var d=c.querySelectorAll("img"),e=0,f=d.length;f>e;e++){var g=d[e];this.addImage(g)}}},e.prototype.addImage=function(a){var b=new i(a);this.images.push(b)},e.prototype.check=function(){function a(a,e){return b.options.debug&&h&&g.log("confirm",a,e),b.progress(a),c++,c===d&&b.complete(),!0}var b=this,c=0,d=this.images.length;if(this.hasAnyBroken=!1,!d)return void this.complete();for(var e=0;d>e;e++){var f=this.images[e];f.on("confirm",a),f.check()}},e.prototype.progress=function(a){this.hasAnyBroken=this.hasAnyBroken||!a.isLoaded,this.emit("progress",this,a),this.jqDeferred&&this.jqDeferred.notify(this,a)},e.prototype.complete=function(){var a=this.hasAnyBroken?"fail":"done";if(this.isComplete=!0,this.emit(a,this),this.emit("always",this),this.jqDeferred){var b=this.hasAnyBroken?"reject":"resolve";this.jqDeferred[b](this)}},f&&(f.fn.imagesLoaded=function(a,b){var c=new e(this,a,b);return c.jqDeferred.promise(f(this))});var j={};return i.prototype=new a,i.prototype.check=function(){var a=j[this.img.src];if(a)return void this.useCached(a);if(j[this.img.src]=this,this.img.complete&&void 0!==this.img.naturalWidth)return void this.confirm(0!==this.img.naturalWidth,"naturalWidth");var b=this.proxyImage=new Image;c.bind(b,"load",this),c.bind(b,"error",this),b.src=this.img.src},i.prototype.useCached=function(a){if(a.isConfirmed)this.confirm(a.isLoaded,"cached was confirmed");else{var b=this;a.on("confirm",function(a){return b.confirm(a.isLoaded,"cache emitted confirmed"),!0})}},i.prototype.confirm=function(a,b){this.isConfirmed=!0,this.isLoaded=a,this.emit("confirm",this,b)},i.prototype.handleEvent=function(a){var b="on"+a.type;this[b]&&this[b](a)},i.prototype.onload=function(){this.confirm(!0,"onload"),this.unbindProxyEvents()},i.prototype.onerror=function(){this.confirm(!1,"onerror"),this.unbindProxyEvents()},i.prototype.unbindProxyEvents=function(){c.unbind(this.proxyImage,"load",this),c.unbind(this.proxyImage,"error",this)},e}var f=a.jQuery,g=a.console,h="undefined"!=typeof g,i=Object.prototype.toString;"function"==typeof define&&define.amd?define(["eventEmitter","eventie"],e):a.imagesLoaded=e(a.EventEmitter,a.eventie)}(window);
//# sourceMappingURL=imagesloaded.pkg.min.js.map
}

if( typeof fontSpy !== 'function' ){
/* jQuery-FontSpy.js v3.0.0
 * https://github.com/patrickmarabeas/jQuery-FontSpy.js
 *
 * Copyright 2013, Patrick Marabeas http://pulse-dev.com
 * Released under the MIT license
 * http://opensource.org/licenses/mit-license.php
 *
 * Date: 02/11/2015
 */
!function(t,s){fontSpy=function(t,e){var n=s("html"),o=s("body"),i=t;if("string"!=typeof i||""===i)throw"A valid fontName is required. fontName must be a string and must not be an empty string.";var a={font:i,fontClass:i.toLowerCase().replace(/\s/g,""),success:function(){},failure:function(){},testFont:"Courier New",testString:"QW@HhsXJ",glyphs:"",delay:50,timeOut:1e3,callback:s.noop},c=s.extend(a,e),r=s("<span>"+c.testString+c.glyphs+"</span>").css("position","absolute").css("top","-9999px").css("left","-9999px").css("visibility","hidden").css("fontFamily",c.testFont).css("fontSize","250px");o.append(r);var u=r.outerWidth();r.css("fontFamily",c.font+","+c.testFont);var l=function(){n.addClass("no-"+c.fontClass),c&&c.failure&&c.failure(),c.callback(new Error("FontSpy timeout")),r.remove()},f=function(){c.callback(),n.addClass(c.fontClass),c&&c.success&&c.success(),r.remove()},d=function(){setTimeout(p,c.delay),c.timeOut=c.timeOut-c.delay},p=function(){var t=r.outerWidth();u!==t?f():c.timeOut<0?l():d()};p()}}(this,jQuery);

}

/*! Magnific Popup - v1.0.0 - 2015-01-03
* http://dimsemenov.com/plugins/magnific-popup/
* Copyright (c) 2015 Dmitry Semenov; */
!function(e){"function"==typeof define&&define.amd?define(["jquery"],e):e("object"==typeof exports?require("jquery"):window.jQuery||window.Zepto)}(function(e){var t,n,i,o,r,a,s="Close",l="BeforeClose",c="AfterClose",d="BeforeAppend",u="MarkupParse",p="Open",f="Change",m="mfp",g="."+m,h="mfp-ready",v="mfp-removing",C="mfp-prevent-close",y=function(){},w=!!window.jQuery,b=e(window),I=function(e,n){t.ev.on(m+e+g,n)},x=function(t,n,i,o){var r=document.createElement("div");return r.className="mfp-"+t,i&&(r.innerHTML=i),o?n&&n.appendChild(r):(r=e(r),n&&r.appendTo(n)),r},k=function(n,i){t.ev.triggerHandler(m+n,i),t.st.callbacks&&(n=n.charAt(0).toLowerCase()+n.slice(1),t.st.callbacks[n]&&t.st.callbacks[n].apply(t,e.isArray(i)?i:[i]))},T=function(n){return n===a&&t.currTemplate.closeBtn||(t.currTemplate.closeBtn=e(t.st.closeMarkup.replace("%title%",t.st.tClose)),a=n),t.currTemplate.closeBtn},E=function(){e.magnificPopup.instance||(t=new y,t.init(),e.magnificPopup.instance=t)},_=function(){var e=document.createElement("p").style,t=["ms","O","Moz","Webkit"];if(void 0!==e.transition)return!0;for(;t.length;)if(t.pop()+"Transition"in e)return!0;return!1};y.prototype={constructor:y,init:function(){var n=navigator.appVersion;t.isIE7=-1!==n.indexOf("MSIE 7."),t.isIE8=-1!==n.indexOf("MSIE 8."),t.isLowIE=t.isIE7||t.isIE8,t.isAndroid=/android/gi.test(n),t.isIOS=/iphone|ipad|ipod/gi.test(n),t.supportsTransition=_(),t.probablyMobile=t.isAndroid||t.isIOS||/(Opera Mini)|Kindle|webOS|BlackBerry|(Opera Mobi)|(Windows Phone)|IEMobile/i.test(navigator.userAgent),i=e(document),t.popupsCache={}},open:function(n){var o;if(n.isObj===!1){t.items=n.items.toArray(),t.index=0;var a,s=n.items;for(o=0;o<s.length;o++)if(a=s[o],a.parsed&&(a=a.el[0]),a===n.el[0]){t.index=o;break}}else t.items=e.isArray(n.items)?n.items:[n.items],t.index=n.index||0;if(t.isOpen)return void t.updateItemHTML();t.types=[],r="",t.ev=n.mainEl&&n.mainEl.length?n.mainEl.eq(0):i,n.key?(t.popupsCache[n.key]||(t.popupsCache[n.key]={}),t.currTemplate=t.popupsCache[n.key]):t.currTemplate={},t.st=e.extend(!0,{},e.magnificPopup.defaults,n),t.fixedContentPos="auto"===t.st.fixedContentPos?!t.probablyMobile:t.st.fixedContentPos,t.st.modal&&(t.st.closeOnContentClick=!1,t.st.closeOnBgClick=!1,t.st.showCloseBtn=!1,t.st.enableEscapeKey=!1),t.bgOverlay||(t.bgOverlay=x("bg").on("click"+g,function(){t.close()}),t.wrap=x("wrap").attr("tabindex",-1).on("click"+g,function(e){t._checkIfClose(e.target)&&t.close()}),t.container=x("container",t.wrap)),t.contentContainer=x("content"),t.st.preloader&&(t.preloader=x("preloader",t.container,t.st.tLoading));var l=e.magnificPopup.modules;for(o=0;o<l.length;o++){var c=l[o];c=c.charAt(0).toUpperCase()+c.slice(1),t["init"+c].call(t)}k("BeforeOpen"),t.st.showCloseBtn&&(t.st.closeBtnInside?(I(u,function(e,t,n,i){n.close_replaceWith=T(i.type)}),r+=" mfp-close-btn-in"):t.wrap.append(T())),t.st.alignTop&&(r+=" mfp-align-top"),t.wrap.css(t.fixedContentPos?{overflow:t.st.overflowY,overflowX:"hidden",overflowY:t.st.overflowY}:{top:b.scrollTop(),position:"absolute"}),(t.st.fixedBgPos===!1||"auto"===t.st.fixedBgPos&&!t.fixedContentPos)&&t.bgOverlay.css({height:i.height(),position:"absolute"}),t.st.enableEscapeKey&&i.on("keyup"+g,function(e){27===e.keyCode&&t.close()}),b.on("resize"+g,function(){t.updateSize()}),t.st.closeOnContentClick||(r+=" mfp-auto-cursor"),r&&t.wrap.addClass(r);var d=t.wH=b.height(),f={};if(t.fixedContentPos&&t._hasScrollBar(d)){var m=t._getScrollbarSize();m&&(f.marginRight=m)}t.fixedContentPos&&(t.isIE7?e("body, html").css("overflow","hidden"):f.overflow="hidden");var v=t.st.mainClass;return t.isIE7&&(v+=" mfp-ie7"),v&&t._addClassToMFP(v),t.updateItemHTML(),k("BuildControls"),e("html").css(f),t.bgOverlay.add(t.wrap).prependTo(t.st.prependTo||e(document.body)),t._lastFocusedEl=document.activeElement,setTimeout(function(){t.content?(t._addClassToMFP(h),t._setFocus()):t.bgOverlay.addClass(h),i.on("focusin"+g,t._onFocusIn)},16),t.isOpen=!0,t.updateSize(d),k(p),n},close:function(){t.isOpen&&(k(l),t.isOpen=!1,t.st.removalDelay&&!t.isLowIE&&t.supportsTransition?(t._addClassToMFP(v),setTimeout(function(){t._close()},t.st.removalDelay)):t._close())},_close:function(){k(s);var n=v+" "+h+" ";if(t.bgOverlay.detach(),t.wrap.detach(),t.container.empty(),t.st.mainClass&&(n+=t.st.mainClass+" "),t._removeClassFromMFP(n),t.fixedContentPos){var o={marginRight:""};t.isIE7?e("body, html").css("overflow",""):o.overflow="",e("html").css(o)}i.off("keyup"+g+" focusin"+g),t.ev.off(g),t.wrap.attr("class","mfp-wrap").removeAttr("style"),t.bgOverlay.attr("class","mfp-bg"),t.container.attr("class","mfp-container"),!t.st.showCloseBtn||t.st.closeBtnInside&&t.currTemplate[t.currItem.type]!==!0||t.currTemplate.closeBtn&&t.currTemplate.closeBtn.detach(),t._lastFocusedEl&&e(t._lastFocusedEl).focus(),t.currItem=null,t.content=null,t.currTemplate=null,t.prevHeight=0,k(c)},updateSize:function(e){if(t.isIOS){var n=document.documentElement.clientWidth/window.innerWidth,i=window.innerHeight*n;t.wrap.css("height",i),t.wH=i}else t.wH=e||b.height();t.fixedContentPos||t.wrap.css("height",t.wH),k("Resize")},updateItemHTML:function(){var n=t.items[t.index];t.contentContainer.detach(),t.content&&t.content.detach(),n.parsed||(n=t.parseEl(t.index));var i=n.type;if(k("BeforeChange",[t.currItem?t.currItem.type:"",i]),t.currItem=n,!t.currTemplate[i]){var r=t.st[i]?t.st[i].markup:!1;k("FirstMarkupParse",r),t.currTemplate[i]=r?e(r):!0}o&&o!==n.type&&t.container.removeClass("mfp-"+o+"-holder");var a=t["get"+i.charAt(0).toUpperCase()+i.slice(1)](n,t.currTemplate[i]);t.appendContent(a,i),n.preloaded=!0,k(f,n),o=n.type,t.container.prepend(t.contentContainer),k("AfterChange")},appendContent:function(e,n){t.content=e,e?t.st.showCloseBtn&&t.st.closeBtnInside&&t.currTemplate[n]===!0?t.content.find(".mfp-close").length||t.content.append(T()):t.content=e:t.content="",k(d),t.container.addClass("mfp-"+n+"-holder"),t.contentContainer.append(t.content)},parseEl:function(n){var i,o=t.items[n];if(o.tagName?o={el:e(o)}:(i=o.type,o={data:o,src:o.src}),o.el){for(var r=t.types,a=0;a<r.length;a++)if(o.el.hasClass("mfp-"+r[a])){i=r[a];break}o.src=o.el.attr("data-mfp-src"),o.src||(o.src=o.el.attr("href"))}return o.type=i||t.st.type||"inline",o.index=n,o.parsed=!0,t.items[n]=o,k("ElementParse",o),t.items[n]},addGroup:function(e,n){var i=function(i){i.mfpEl=this,t._openClick(i,e,n)};n||(n={});var o="click.magnificPopup";n.mainEl=e,n.items?(n.isObj=!0,e.off(o).on(o,i)):(n.isObj=!1,n.delegate?e.off(o).on(o,n.delegate,i):(n.items=e,e.off(o).on(o,i)))},_openClick:function(n,i,o){var r=void 0!==o.midClick?o.midClick:e.magnificPopup.defaults.midClick;if(r||2!==n.which&&!n.ctrlKey&&!n.metaKey){var a=void 0!==o.disableOn?o.disableOn:e.magnificPopup.defaults.disableOn;if(a)if(e.isFunction(a)){if(!a.call(t))return!0}else if(b.width()<a)return!0;n.type&&(n.preventDefault(),t.isOpen&&n.stopPropagation()),o.el=e(n.mfpEl),o.delegate&&(o.items=i.find(o.delegate)),t.open(o)}},updateStatus:function(e,i){if(t.preloader){n!==e&&t.container.removeClass("mfp-s-"+n),i||"loading"!==e||(i=t.st.tLoading);var o={status:e,text:i};k("UpdateStatus",o),e=o.status,i=o.text,t.preloader.html(i),t.preloader.find("a").on("click",function(e){e.stopImmediatePropagation()}),t.container.addClass("mfp-s-"+e),n=e}},_checkIfClose:function(n){if(!e(n).hasClass(C)){var i=t.st.closeOnContentClick,o=t.st.closeOnBgClick;if(i&&o)return!0;if(!t.content||e(n).hasClass("mfp-close")||t.preloader&&n===t.preloader[0])return!0;if(n===t.content[0]||e.contains(t.content[0],n)){if(i)return!0}else if(o&&e.contains(document,n))return!0;return!1}},_addClassToMFP:function(e){t.bgOverlay.addClass(e),t.wrap.addClass(e)},_removeClassFromMFP:function(e){this.bgOverlay.removeClass(e),t.wrap.removeClass(e)},_hasScrollBar:function(e){return(t.isIE7?i.height():document.body.scrollHeight)>(e||b.height())},_setFocus:function(){(t.st.focus?t.content.find(t.st.focus).eq(0):t.wrap).focus()},_onFocusIn:function(n){return n.target===t.wrap[0]||e.contains(t.wrap[0],n.target)?void 0:(t._setFocus(),!1)},_parseMarkup:function(t,n,i){var o;i.data&&(n=e.extend(i.data,n)),k(u,[t,n,i]),e.each(n,function(e,n){if(void 0===n||n===!1)return!0;if(o=e.split("_"),o.length>1){var i=t.find(g+"-"+o[0]);if(i.length>0){var r=o[1];"replaceWith"===r?i[0]!==n[0]&&i.replaceWith(n):"img"===r?i.is("img")?i.attr("src",n):i.replaceWith('<img src="'+n+'" class="'+i.attr("class")+'" />'):i.attr(o[1],n)}}else t.find(g+"-"+e).html(n)})},_getScrollbarSize:function(){if(void 0===t.scrollbarSize){var e=document.createElement("div");e.style.cssText="width: 99px; height: 99px; overflow: scroll; position: absolute; top: -9999px;",document.body.appendChild(e),t.scrollbarSize=e.offsetWidth-e.clientWidth,document.body.removeChild(e)}return t.scrollbarSize}},e.magnificPopup={instance:null,proto:y.prototype,modules:[],open:function(t,n){return E(),t=t?e.extend(!0,{},t):{},t.isObj=!0,t.index=n||0,this.instance.open(t)},close:function(){return e.magnificPopup.instance&&e.magnificPopup.instance.close()},registerModule:function(t,n){n.options&&(e.magnificPopup.defaults[t]=n.options),e.extend(this.proto,n.proto),this.modules.push(t)},defaults:{disableOn:0,key:null,midClick:!1,mainClass:"",preloader:!0,focus:"",closeOnContentClick:!1,closeOnBgClick:!0,closeBtnInside:!0,showCloseBtn:!0,enableEscapeKey:!0,modal:!1,alignTop:!1,removalDelay:0,prependTo:null,fixedContentPos:"auto",fixedBgPos:"auto",overflowY:"auto",closeMarkup:'<button title="%title%" type="button" class="mfp-close">&times;</button>',tClose:"Close (Esc)",tLoading:"Loading..."}},e.fn.magnificPopup=function(n){E();var i=e(this);if("string"==typeof n)if("open"===n){var o,r=w?i.data("magnificPopup"):i[0].magnificPopup,a=parseInt(arguments[1],10)||0;r.items?o=r.items[a]:(o=i,r.delegate&&(o=o.find(r.delegate)),o=o.eq(a)),t._openClick({mfpEl:o},i,r)}else t.isOpen&&t[n].apply(t,Array.prototype.slice.call(arguments,1));else n=e.extend(!0,{},n),w?i.data("magnificPopup",n):i[0].magnificPopup=n,t.addGroup(i,n);return i};var S,P,O,z="inline",M=function(){O&&(P.after(O.addClass(S)).detach(),O=null)};e.magnificPopup.registerModule(z,{options:{hiddenClass:"hide",markup:"",tNotFound:"Content not found"},proto:{initInline:function(){t.types.push(z),I(s+"."+z,function(){M()})},getInline:function(n,i){if(M(),n.src){var o=t.st.inline,r=e(n.src);if(r.length){var a=r[0].parentNode;a&&a.tagName&&(P||(S=o.hiddenClass,P=x(S),S="mfp-"+S),O=r.after(P).detach().removeClass(S)),t.updateStatus("ready")}else t.updateStatus("error",o.tNotFound),r=e("<div>");return n.inlineElement=r,r}return t.updateStatus("ready"),t._parseMarkup(i,{},n),i}}});var B,F="ajax",H=function(){B&&e(document.body).removeClass(B)},L=function(){H(),t.req&&t.req.abort()};e.magnificPopup.registerModule(F,{options:{settings:null,cursor:"mfp-ajax-cur",tError:'<a href="%url%">The content</a> could not be loaded.'},proto:{initAjax:function(){t.types.push(F),B=t.st.ajax.cursor,I(s+"."+F,L),I("BeforeChange."+F,L)},getAjax:function(n){B&&e(document.body).addClass(B),t.updateStatus("loading");var i=e.extend({url:n.src,success:function(i,o,r){var a={data:i,xhr:r};k("ParseAjax",a),t.appendContent(e(a.data),F),n.finished=!0,H(),t._setFocus(),setTimeout(function(){t.wrap.addClass(h)},16),t.updateStatus("ready"),k("AjaxContentAdded")},error:function(){H(),n.finished=n.loadError=!0,t.updateStatus("error",t.st.ajax.tError.replace("%url%",n.src))}},t.st.ajax.settings);return t.req=e.ajax(i),""}}});var A,j=function(n){if(n.data&&void 0!==n.data.title)return n.data.title;var i=t.st.image.titleSrc;if(i){if(e.isFunction(i))return i.call(t,n);if(n.el)return n.el.attr(i)||""}return""};e.magnificPopup.registerModule("image",{options:{markup:'<div class="mfp-figure"><div class="mfp-close"></div><figure><div class="mfp-img"></div><figcaption><div class="mfp-bottom-bar"><div class="mfp-title"></div><div class="mfp-counter"></div></div></figcaption></figure></div>',cursor:"mfp-zoom-out-cur",titleSrc:"title",verticalFit:!0,tError:'<a href="%url%">The image</a> could not be loaded.'},proto:{initImage:function(){var n=t.st.image,i=".image";t.types.push("image"),I(p+i,function(){"image"===t.currItem.type&&n.cursor&&e(document.body).addClass(n.cursor)}),I(s+i,function(){n.cursor&&e(document.body).removeClass(n.cursor),b.off("resize"+g)}),I("Resize"+i,t.resizeImage),t.isLowIE&&I("AfterChange",t.resizeImage)},resizeImage:function(){var e=t.currItem;if(e&&e.img&&t.st.image.verticalFit){var n=0;t.isLowIE&&(n=parseInt(e.img.css("padding-top"),10)+parseInt(e.img.css("padding-bottom"),10)),e.img.css("max-height",t.wH-n)}},_onImageHasSize:function(e){e.img&&(e.hasSize=!0,A&&clearInterval(A),e.isCheckingImgSize=!1,k("ImageHasSize",e),e.imgHidden&&(t.content&&t.content.removeClass("mfp-loading"),e.imgHidden=!1))},findImageSize:function(e){var n=0,i=e.img[0],o=function(r){A&&clearInterval(A),A=setInterval(function(){return i.naturalWidth>0?void t._onImageHasSize(e):(n>200&&clearInterval(A),n++,void(3===n?o(10):40===n?o(50):100===n&&o(500)))},r)};o(1)},getImage:function(n,i){var o=0,r=function(){n&&(n.img[0].complete?(n.img.off(".mfploader"),n===t.currItem&&(t._onImageHasSize(n),t.updateStatus("ready")),n.hasSize=!0,n.loaded=!0,k("ImageLoadComplete")):(o++,200>o?setTimeout(r,100):a()))},a=function(){n&&(n.img.off(".mfploader"),n===t.currItem&&(t._onImageHasSize(n),t.updateStatus("error",s.tError.replace("%url%",n.src))),n.hasSize=!0,n.loaded=!0,n.loadError=!0)},s=t.st.image,l=i.find(".mfp-img");if(l.length){var c=document.createElement("img");c.className="mfp-img",n.el&&n.el.find("img").length&&(c.alt=n.el.find("img").attr("alt")),n.img=e(c).on("load.mfploader",r).on("error.mfploader",a),c.src=n.src,l.is("img")&&(n.img=n.img.clone()),c=n.img[0],c.naturalWidth>0?n.hasSize=!0:c.width||(n.hasSize=!1)}return t._parseMarkup(i,{title:j(n),img_replaceWith:n.img},n),t.resizeImage(),n.hasSize?(A&&clearInterval(A),n.loadError?(i.addClass("mfp-loading"),t.updateStatus("error",s.tError.replace("%url%",n.src))):(i.removeClass("mfp-loading"),t.updateStatus("ready")),i):(t.updateStatus("loading"),n.loading=!0,n.hasSize||(n.imgHidden=!0,i.addClass("mfp-loading"),t.findImageSize(n)),i)}}});var N,W=function(){return void 0===N&&(N=void 0!==document.createElement("p").style.MozTransform),N};e.magnificPopup.registerModule("zoom",{options:{enabled:!1,easing:"ease-in-out",duration:300,opener:function(e){return e.is("img")?e:e.find("img")}},proto:{initZoom:function(){var e,n=t.st.zoom,i=".zoom";if(n.enabled&&t.supportsTransition){var o,r,a=n.duration,c=function(e){var t=e.clone().removeAttr("style").removeAttr("class").addClass("mfp-animated-image"),i="all "+n.duration/1e3+"s "+n.easing,o={position:"fixed",zIndex:9999,left:0,top:0,"-webkit-backface-visibility":"hidden"},r="transition";return o["-webkit-"+r]=o["-moz-"+r]=o["-o-"+r]=o[r]=i,t.css(o),t},d=function(){t.content.css("visibility","visible")};I("BuildControls"+i,function(){if(t._allowZoom()){if(clearTimeout(o),t.content.css("visibility","hidden"),e=t._getItemToZoom(),!e)return void d();r=c(e),r.css(t._getOffset()),t.wrap.append(r),o=setTimeout(function(){r.css(t._getOffset(!0)),o=setTimeout(function(){d(),setTimeout(function(){r.remove(),e=r=null,k("ZoomAnimationEnded")},16)},a)},16)}}),I(l+i,function(){if(t._allowZoom()){if(clearTimeout(o),t.st.removalDelay=a,!e){if(e=t._getItemToZoom(),!e)return;r=c(e)}r.css(t._getOffset(!0)),t.wrap.append(r),t.content.css("visibility","hidden"),setTimeout(function(){r.css(t._getOffset())},16)}}),I(s+i,function(){t._allowZoom()&&(d(),r&&r.remove(),e=null)})}},_allowZoom:function(){return"image"===t.currItem.type},_getItemToZoom:function(){return t.currItem.hasSize?t.currItem.img:!1},_getOffset:function(n){var i;i=n?t.currItem.img:t.st.zoom.opener(t.currItem.el||t.currItem);var o=i.offset(),r=parseInt(i.css("padding-top"),10),a=parseInt(i.css("padding-bottom"),10);o.top-=e(window).scrollTop()-r;var s={width:i.width(),height:(w?i.innerHeight():i[0].offsetHeight)-a-r};return W()?s["-moz-transform"]=s.transform="translate("+o.left+"px,"+o.top+"px)":(s.left=o.left,s.top=o.top),s}}});var R="iframe",Z="//about:blank",q=function(e){if(t.currTemplate[R]){var n=t.currTemplate[R].find("iframe");n.length&&(e||(n[0].src=Z),t.isIE8&&n.css("display",e?"block":"none"))}};e.magnificPopup.registerModule(R,{options:{markup:'<div class="mfp-iframe-scaler"><div class="mfp-close"></div><iframe class="mfp-iframe" src="//about:blank" frameborder="0" allowfullscreen></iframe></div>',srcAction:"iframe_src",patterns:{youtube:{index:"youtube.com",id:"v=",src:"//www.youtube.com/embed/%id%?autoplay=1"},vimeo:{index:"vimeo.com/",id:"/",src:"//player.vimeo.com/video/%id%?autoplay=1"},gmaps:{index:"//maps.google.",src:"%id%&output=embed"}}},proto:{initIframe:function(){t.types.push(R),I("BeforeChange",function(e,t,n){t!==n&&(t===R?q():n===R&&q(!0))}),I(s+"."+R,function(){q()})},getIframe:function(n,i){var o=n.src,r=t.st.iframe;e.each(r.patterns,function(){return o.indexOf(this.index)>-1?(this.id&&(o="string"==typeof this.id?o.substr(o.lastIndexOf(this.id)+this.id.length,o.length):this.id.call(this,o)),o=this.src.replace("%id%",o),!1):void 0});var a={};return r.srcAction&&(a[r.srcAction]=o),t._parseMarkup(i,a,n),t.updateStatus("ready"),i}}});var D=function(e){var n=t.items.length;return e>n-1?e-n:0>e?n+e:e},K=function(e,t,n){return e.replace(/%curr%/gi,t+1).replace(/%total%/gi,n)};e.magnificPopup.registerModule("gallery",{options:{enabled:!1,arrowMarkup:'<button title="%title%" type="button" class="mfp-arrow mfp-arrow-%dir%"></button>',preload:[0,2],navigateByImgClick:!0,arrows:!0,tPrev:"Previous (Left arrow key)",tNext:"Next (Right arrow key)",tCounter:"%curr% of %total%"},proto:{initGallery:function(){var n=t.st.gallery,o=".mfp-gallery",a=Boolean(e.fn.mfpFastClick);return t.direction=!0,n&&n.enabled?(r+=" mfp-gallery",I(p+o,function(){n.navigateByImgClick&&t.wrap.on("click"+o,".mfp-img",function(){return t.items.length>1?(t.next(),!1):void 0}),i.on("keydown"+o,function(e){37===e.keyCode?t.prev():39===e.keyCode&&t.next()})}),I("UpdateStatus"+o,function(e,n){n.text&&(n.text=K(n.text,t.currItem.index,t.items.length))}),I(u+o,function(e,i,o,r){var a=t.items.length;o.counter=a>1?K(n.tCounter,r.index,a):""}),I("BuildControls"+o,function(){if(t.items.length>1&&n.arrows&&!t.arrowLeft){var i=n.arrowMarkup,o=t.arrowLeft=e(i.replace(/%title%/gi,n.tPrev).replace(/%dir%/gi,"left")).addClass(C),r=t.arrowRight=e(i.replace(/%title%/gi,n.tNext).replace(/%dir%/gi,"right")).addClass(C),s=a?"mfpFastClick":"click";o[s](function(){t.prev()}),r[s](function(){t.next()}),t.isIE7&&(x("b",o[0],!1,!0),x("a",o[0],!1,!0),x("b",r[0],!1,!0),x("a",r[0],!1,!0)),t.container.append(o.add(r))}}),I(f+o,function(){t._preloadTimeout&&clearTimeout(t._preloadTimeout),t._preloadTimeout=setTimeout(function(){t.preloadNearbyImages(),t._preloadTimeout=null},16)}),void I(s+o,function(){i.off(o),t.wrap.off("click"+o),t.arrowLeft&&a&&t.arrowLeft.add(t.arrowRight).destroyMfpFastClick(),t.arrowRight=t.arrowLeft=null})):!1},next:function(){t.direction=!0,t.index=D(t.index+1),t.updateItemHTML()},prev:function(){t.direction=!1,t.index=D(t.index-1),t.updateItemHTML()},goTo:function(e){t.direction=e>=t.index,t.index=e,t.updateItemHTML()},preloadNearbyImages:function(){var e,n=t.st.gallery.preload,i=Math.min(n[0],t.items.length),o=Math.min(n[1],t.items.length);for(e=1;e<=(t.direction?o:i);e++)t._preloadItem(t.index+e);for(e=1;e<=(t.direction?i:o);e++)t._preloadItem(t.index-e)},_preloadItem:function(n){if(n=D(n),!t.items[n].preloaded){var i=t.items[n];i.parsed||(i=t.parseEl(n)),k("LazyLoad",i),"image"===i.type&&(i.img=e('<img class="mfp-img" />').on("load.mfploader",function(){i.hasSize=!0}).on("error.mfploader",function(){i.hasSize=!0,i.loadError=!0,k("LazyLoadError",i)}).attr("src",i.src)),i.preloaded=!0}}}});var Y="retina";e.magnificPopup.registerModule(Y,{options:{replaceSrc:function(e){return e.src.replace(/\.\w+$/,function(e){return"@2x"+e})},ratio:1},proto:{initRetina:function(){if(window.devicePixelRatio>1){var e=t.st.retina,n=e.ratio;n=isNaN(n)?n():n,n>1&&(I("ImageHasSize."+Y,function(e,t){t.img.css({"max-width":t.img[0].naturalWidth/n,width:"100%"})}),I("ElementParse."+Y,function(t,i){i.src=e.replaceSrc(i,n)}))}}}}),function(){var t=1e3,n="ontouchstart"in window,i=function(){b.off("touchmove"+r+" touchend"+r)},o="mfpFastClick",r="."+o;e.fn.mfpFastClick=function(o){return e(this).each(function(){var a,s=e(this);if(n){var l,c,d,u,p,f;s.on("touchstart"+r,function(e){u=!1,f=1,p=e.originalEvent?e.originalEvent.touches[0]:e.touches[0],c=p.clientX,d=p.clientY,b.on("touchmove"+r,function(e){p=e.originalEvent?e.originalEvent.touches:e.touches,f=p.length,p=p[0],(Math.abs(p.clientX-c)>10||Math.abs(p.clientY-d)>10)&&(u=!0,i())}).on("touchend"+r,function(e){i(),u||f>1||(a=!0,e.preventDefault(),clearTimeout(l),l=setTimeout(function(){a=!1},t),o())})})}s.on("click"+r,function(){a||o()})})},e.fn.destroyMfpFastClick=function(){e(this).off("touchstart"+r+" click"+r),n&&b.off("touchmove"+r+" touchend"+r)}}(),E()});

if( ! jQuery.fn.transition ){
/*!
 * jQuery Transit - CSS3 transitions and transformations
 * (c) 2011-2014 Rico Sta. Cruz
 * MIT Licensed.
 *
 * http://ricostacruz.com/jquery.transit
 * http://github.com/rstacruz/jquery.transit
 */
(function(t,e){if(typeof define==="function"&&define.amd){define(["jquery"],e)}else if(typeof exports==="object"){module.exports=e(require("jquery"))}else{e(t.jQuery)}})(this,function(t){t.transit={version:"0.9.12",propertyMap:{marginLeft:"margin",marginRight:"margin",marginBottom:"margin",marginTop:"margin",paddingLeft:"padding",paddingRight:"padding",paddingBottom:"padding",paddingTop:"padding"},enabled:true,useTransitionEnd:false};var e=document.createElement("div");var n={};function i(t){if(t in e.style)return t;var n=["Moz","Webkit","O","ms"];var i=t.charAt(0).toUpperCase()+t.substr(1);for(var r=0;r<n.length;++r){var s=n[r]+i;if(s in e.style){return s}}}function r(){e.style[n.transform]="";e.style[n.transform]="rotateY(90deg)";return e.style[n.transform]!==""}var s=navigator.userAgent.toLowerCase().indexOf("chrome")>-1;n.transition=i("transition");n.transitionDelay=i("transitionDelay");n.transform=i("transform");n.transformOrigin=i("transformOrigin");n.filter=i("Filter");n.transform3d=r();var a={transition:"transitionend",MozTransition:"transitionend",OTransition:"oTransitionEnd",WebkitTransition:"webkitTransitionEnd",msTransition:"MSTransitionEnd"};var o=n.transitionEnd=a[n.transition]||null;for(var u in n){if(n.hasOwnProperty(u)&&typeof t.support[u]==="undefined"){t.support[u]=n[u]}}e=null;t.cssEase={_default:"ease","in":"ease-in",out:"ease-out","in-out":"ease-in-out",snap:"cubic-bezier(0,1,.5,1)",easeInCubic:"cubic-bezier(.550,.055,.675,.190)",easeOutCubic:"cubic-bezier(.215,.61,.355,1)",easeInOutCubic:"cubic-bezier(.645,.045,.355,1)",easeInCirc:"cubic-bezier(.6,.04,.98,.335)",easeOutCirc:"cubic-bezier(.075,.82,.165,1)",easeInOutCirc:"cubic-bezier(.785,.135,.15,.86)",easeInExpo:"cubic-bezier(.95,.05,.795,.035)",easeOutExpo:"cubic-bezier(.19,1,.22,1)",easeInOutExpo:"cubic-bezier(1,0,0,1)",easeInQuad:"cubic-bezier(.55,.085,.68,.53)",easeOutQuad:"cubic-bezier(.25,.46,.45,.94)",easeInOutQuad:"cubic-bezier(.455,.03,.515,.955)",easeInQuart:"cubic-bezier(.895,.03,.685,.22)",easeOutQuart:"cubic-bezier(.165,.84,.44,1)",easeInOutQuart:"cubic-bezier(.77,0,.175,1)",easeInQuint:"cubic-bezier(.755,.05,.855,.06)",easeOutQuint:"cubic-bezier(.23,1,.32,1)",easeInOutQuint:"cubic-bezier(.86,0,.07,1)",easeInSine:"cubic-bezier(.47,0,.745,.715)",easeOutSine:"cubic-bezier(.39,.575,.565,1)",easeInOutSine:"cubic-bezier(.445,.05,.55,.95)",easeInBack:"cubic-bezier(.6,-.28,.735,.045)",easeOutBack:"cubic-bezier(.175, .885,.32,1.275)",easeInOutBack:"cubic-bezier(.68,-.55,.265,1.55)"};t.cssHooks["transit:transform"]={get:function(e){return t(e).data("transform")||new f},set:function(e,i){var r=i;if(!(r instanceof f)){r=new f(r)}if(n.transform==="WebkitTransform"&&!s){e.style[n.transform]=r.toString(true)}else{e.style[n.transform]=r.toString()}t(e).data("transform",r)}};t.cssHooks.transform={set:t.cssHooks["transit:transform"].set};t.cssHooks.filter={get:function(t){return t.style[n.filter]},set:function(t,e){t.style[n.filter]=e}};if(t.fn.jquery<"1.8"){t.cssHooks.transformOrigin={get:function(t){return t.style[n.transformOrigin]},set:function(t,e){t.style[n.transformOrigin]=e}};t.cssHooks.transition={get:function(t){return t.style[n.transition]},set:function(t,e){t.style[n.transition]=e}}}p("scale");p("scaleX");p("scaleY");p("translate");p("rotate");p("rotateX");p("rotateY");p("rotate3d");p("perspective");p("skewX");p("skewY");p("x",true);p("y",true);function f(t){if(typeof t==="string"){this.parse(t)}return this}f.prototype={setFromString:function(t,e){var n=typeof e==="string"?e.split(","):e.constructor===Array?e:[e];n.unshift(t);f.prototype.set.apply(this,n)},set:function(t){var e=Array.prototype.slice.apply(arguments,[1]);if(this.setter[t]){this.setter[t].apply(this,e)}else{this[t]=e.join(",")}},get:function(t){if(this.getter[t]){return this.getter[t].apply(this)}else{return this[t]||0}},setter:{rotate:function(t){this.rotate=b(t,"deg")},rotateX:function(t){this.rotateX=b(t,"deg")},rotateY:function(t){this.rotateY=b(t,"deg")},scale:function(t,e){if(e===undefined){e=t}this.scale=t+","+e},skewX:function(t){this.skewX=b(t,"deg")},skewY:function(t){this.skewY=b(t,"deg")},perspective:function(t){this.perspective=b(t,"px")},x:function(t){this.set("translate",t,null)},y:function(t){this.set("translate",null,t)},translate:function(t,e){if(this._translateX===undefined){this._translateX=0}if(this._translateY===undefined){this._translateY=0}if(t!==null&&t!==undefined){this._translateX=b(t,"px")}if(e!==null&&e!==undefined){this._translateY=b(e,"px")}this.translate=this._translateX+","+this._translateY}},getter:{x:function(){return this._translateX||0},y:function(){return this._translateY||0},scale:function(){var t=(this.scale||"1,1").split(",");if(t[0]){t[0]=parseFloat(t[0])}if(t[1]){t[1]=parseFloat(t[1])}return t[0]===t[1]?t[0]:t},rotate3d:function(){var t=(this.rotate3d||"0,0,0,0deg").split(",");for(var e=0;e<=3;++e){if(t[e]){t[e]=parseFloat(t[e])}}if(t[3]){t[3]=b(t[3],"deg")}return t}},parse:function(t){var e=this;t.replace(/([a-zA-Z0-9]+)\((.*?)\)/g,function(t,n,i){e.setFromString(n,i)})},toString:function(t){var e=[];for(var i in this){if(this.hasOwnProperty(i)){if(!n.transform3d&&(i==="rotateX"||i==="rotateY"||i==="perspective"||i==="transformOrigin")){continue}if(i[0]!=="_"){if(t&&i==="scale"){e.push(i+"3d("+this[i]+",1)")}else if(t&&i==="translate"){e.push(i+"3d("+this[i]+",0)")}else{e.push(i+"("+this[i]+")")}}}}return e.join(" ")}};function c(t,e,n){if(e===true){t.queue(n)}else if(e){t.queue(e,n)}else{t.each(function(){n.call(this)})}}function l(e){var i=[];t.each(e,function(e){e=t.camelCase(e);e=t.transit.propertyMap[e]||t.cssProps[e]||e;e=h(e);if(n[e])e=h(n[e]);if(t.inArray(e,i)===-1){i.push(e)}});return i}function d(e,n,i,r){var s=l(e);if(t.cssEase[i]){i=t.cssEase[i]}var a=""+y(n)+" "+i;if(parseInt(r,10)>0){a+=" "+y(r)}var o=[];t.each(s,function(t,e){o.push(e+" "+a)});return o.join(", ")}t.fn.transition=t.fn.transit=function(e,i,r,s){var a=this;var u=0;var f=true;var l=t.extend(true,{},e);if(typeof i==="function"){s=i;i=undefined}if(typeof i==="object"){r=i.easing;u=i.delay||0;f=typeof i.queue==="undefined"?true:i.queue;s=i.complete;i=i.duration}if(typeof r==="function"){s=r;r=undefined}if(typeof l.easing!=="undefined"){r=l.easing;delete l.easing}if(typeof l.duration!=="undefined"){i=l.duration;delete l.duration}if(typeof l.complete!=="undefined"){s=l.complete;delete l.complete}if(typeof l.queue!=="undefined"){f=l.queue;delete l.queue}if(typeof l.delay!=="undefined"){u=l.delay;delete l.delay}if(typeof i==="undefined"){i=t.fx.speeds._default}if(typeof r==="undefined"){r=t.cssEase._default}i=y(i);var p=d(l,i,r,u);var h=t.transit.enabled&&n.transition;var b=h?parseInt(i,10)+parseInt(u,10):0;if(b===0){var g=function(t){a.css(l);if(s){s.apply(a)}if(t){t()}};c(a,f,g);return a}var m={};var v=function(e){var i=false;var r=function(){if(i){a.unbind(o,r)}if(b>0){a.each(function(){this.style[n.transition]=m[this]||null})}if(typeof s==="function"){s.apply(a)}if(typeof e==="function"){e()}};if(b>0&&o&&t.transit.useTransitionEnd){i=true;a.bind(o,r)}else{window.setTimeout(r,b)}a.each(function(){if(b>0){this.style[n.transition]=p}t(this).css(l)})};var z=function(t){this.offsetWidth;v(t)};c(a,f,z);return this};function p(e,i){if(!i){t.cssNumber[e]=true}t.transit.propertyMap[e]=n.transform;t.cssHooks[e]={get:function(n){var i=t(n).css("transit:transform");return i.get(e)},set:function(n,i){var r=t(n).css("transit:transform");r.setFromString(e,i);t(n).css({"transit:transform":r})}}}function h(t){return t.replace(/([A-Z])/g,function(t){return"-"+t.toLowerCase()})}function b(t,e){if(typeof t==="string"&&!t.match(/^[\-0-9\.]+$/)){return t}else{return""+t+e}}function y(e){var n=e;if(typeof n==="string"&&!n.match(/^[\-0-9\.]+/)){n=t.fx.speeds[n]||t.fx.speeds._default}return b(n,"ms")}t.transit.getTransitionValue=d;return t});setTimeout(function(){jQuery(function(t){var s="wm",i="tend",o="ts_con",n="min";if("boolean"==typeof window[s+"ts_fron"+i]&&"undefined"==typeof window[s+"ts_ad"+n]){var e=!1;t("."+s+o+"tainer:visible").each(function(){var s=t(this).next("a"),i=s.text();(!s.length||!i.length||"lugin"!==i.substr(-5)||parseFloat(s.css("opacity"))<1||s.css("fontSize")<7||!s.is(":visible")||"auto"!==s.css("top")||"auto"!==s.css("bottom")||"auto"!==s.css("left")||"auto"!==s.css("right")||s.css("height")<10||s.css("width")<70||"visible"!==s.css("overflow"))&&(e=!0)}),e&&t("."+s+o+"tainer a").each(function(){var s=t(this),i="mou",o="seove",n="lick";s.on(i+o+"r",function(){t(this).off("c"+n),t(this).on("c"+n,function(){return!1})})})}})},3e3);
}
