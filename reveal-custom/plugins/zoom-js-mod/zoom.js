/*!
 * zoom.js 0.3 (modified for use with reveal.js)
 * http://lab.hakim.se/zoom-js
 * MIT licensed
 *
 * Copyright (C) 2011-2014 Hakim El Hattab, http://hakim.se
 */
let zoom = (function(){

	// The current zoom level (scale)
	let level = 1;

	// The current mouse position, used for panning
	let mouseX = 0,
		mouseY = 0;

	// Timeout before pan is activated
	let panEngageTimeout = -1,
		panUpdateInterval = -1;

	document.body.style.transition = 'transform 0.8s ease';

	// Zoom out if the user hits escape
	document.addEventListener( 'keydown', function( event ) {
		if( level !== 1 && event.keyCode === 27 ) {
			var oldTransitionSettings = document.body.style.transition;
			document.body.style.transition = 'transform 0s';
			zoom.out();
			document.body.style.transition = oldTransitionSettings;
		}
	} );

	// Monitor mouse movement for panning
	document.addEventListener( 'mousemove', function( event ) {
		if( level !== 1 ) {
			mouseX = event.clientX;
			mouseY = event.clientY;
		}
	} );

	/**
	 * Applies the CSS required to zoom in, prefers the use of CSS3
	 * transforms but falls back on zoom for IE.
	 *
	 * @param {Object} rect
	 * @param {Number} scale
	 */
	function magnify( rect, scale ) {

		let scrollOffset = getScrollOffset();

		// Ensure a width/height is set
		rect.width = rect.width || 1;
		rect.height = rect.height || 1;

		// Center the rect within the zoomed viewport
		rect.x -= ( window.innerWidth - ( rect.width * scale ) ) / 2;
		rect.y -= ( window.innerHeight - ( rect.height * scale ) ) / 2;

		// Reset
		if( scale === 1 )
			document.body.style.transform = '';
		// Scale
		else {
			var origin = scrollOffset.x +'px '+ scrollOffset.y +'px',
				transform = 'translate('+ -rect.x +'px,'+ -rect.y +'px) scale('+ scale +')';

			document.body.style.transformOrigin = origin;
			document.body.style.transform = transform;
		}


		level = scale;

		if( document.documentElement.classList ) {
			if( level !== 1 ) {
				document.documentElement.classList.add( 'zoomed' );
			}
			else {
				document.documentElement.classList.remove( 'zoomed' );
			}
		}
	}

	/**
	 * Pan the document when the mouse cursor approaches the edges
	 * of the window.
	 */
	function pan() {
		let range = 0.12,
			rangeX = window.innerWidth * range,
			rangeY = window.innerHeight * range,
			scrollOffset = getScrollOffset();

		// Up
		if( mouseY < rangeY ) {
			window.scroll( scrollOffset.x, scrollOffset.y - ( 1 - ( mouseY / rangeY ) ) * ( 14 / level ) );
		}
		// Down
		else if( mouseY > window.innerHeight - rangeY ) {
			window.scroll( scrollOffset.x, scrollOffset.y + ( 1 - ( window.innerHeight - mouseY ) / rangeY ) * ( 14 / level ) );
		}

		// Left
		if( mouseX < rangeX ) {
			window.scroll( scrollOffset.x - ( 1 - ( mouseX / rangeX ) ) * ( 14 / level ), scrollOffset.y );
		}
		// Right
		else if( mouseX > window.innerWidth - rangeX ) {
			window.scroll( scrollOffset.x + ( 1 - ( window.innerWidth - mouseX ) / rangeX ) * ( 14 / level ), scrollOffset.y );
		}
	}

	function getScrollOffset() {
		return {
			x: window.scrollX !== undefined ? window.scrollX : window.pageXOffset,
			y: window.scrollY !== undefined ? window.scrollY : window.pageYOffset
		}
	}

	return {
		/**
		 * Zooms in on either a rectangle or HTML element.
		 *
		 * @param {Object} options
		 *   - element: HTML element to zoom in on
		 *   OR
		 *   - x/y: coordinates in non-transformed space to zoom in on
		 *   - width/height: the portion of the screen to zoom in on
		 *   - scale: can be used instead of width/height to explicitly set scale
		 */
		to: function( options ) {

			// Due to an implementation limitation we can't zoom in
			// to another element without zooming out first
			if( level !== 1 ) {
				zoom.out();
			}
			else {
				options.x = options.x || 0;
				options.y = options.y || 0;

				// If an element is set, that takes precedence
				if( !!options.element ) {
					// Space around the zoomed in element to leave on screen
					let padding = 20;
					let bounds = options.element.getBoundingClientRect();

					options.x = bounds.left - padding;
					options.y = bounds.top - padding;
					options.width = bounds.width + ( padding * 2 );
					options.height = bounds.height + ( padding * 2 );
				}

				// If width/height values are set, calculate scale from those values
				if( options.width !== undefined && options.height !== undefined ) {
					options.scale = Math.max( Math.min( window.innerWidth / options.width, window.innerHeight / options.height ), 1 );
				}

				if( options.scale > 1 ) {
					options.x *= options.scale;
					options.y *= options.scale;

					magnify( options, options.scale );

					if( options.pan !== false ) {

						// Wait with engaging panning as it may conflict with the
						// zoom transition
						panEngageTimeout = setTimeout( function() {
							panUpdateInterval = setInterval( pan, 1000 / 60 );
						}, 800 );

					}
				}
			}
		},

		/**
		 * Resets the document zoom state to its default.
		 */
		out: function() {
			clearTimeout( panEngageTimeout );
			clearInterval( panUpdateInterval );

			magnify( { x: 0, y: 0 }, 1 );

			level = 1;
		},

		// Alias
		magnify: function( options ) { this.to( options ) },
		reset: function() { this.out() },

		zoomLevel: function() {
			return level;
		}
	}

})();
(function(){
	let options = Reveal.getConfig().zooming || {};
	const EXPLICIT_ZOOMABLES = !!options.explicitZoomables;
	const ZOOM_KEY = ( options.zoomKey || 'alt' ) + 'Key';
	const FULLSCREEN_KEY = ( options.fullscreenKey || 'ctrl' ) + 'Key';

	let isEnabled = true;

	document.querySelector( '.reveal .slides' ).addEventListener( 'mousedown', function( event ) {
		if( !(event[ ZOOM_KEY ] && isEnabled) ) {
			return;
		}


		let zoomPadding = 20;
		let revealScale = Reveal.getScale();

		let target = event.target;
		while (true)
		{
			if(target.tagName.toLowerCase() == 'section') {
				target = event.target;
				break;
			}
			if(target.classList.contains('MathJax')){
				break;
			}
			if(target.classList.contains('smallest-zoomable') || target.hasAttribute('data-smallest-zoomable')){
				break;
			}

			target = target.parentNode;
		}

		if(EXPLICIT_ZOOMABLES && !target.classList.contains('smallest-zoomable') && !target.hasAttribute('data-smallest-zoomable') && !target.classList.contains('zoomable') && !target.hasAttribute('data-zoomable')){
			return;
		}


		if(event[FULLSCREEN_KEY] && document.fullscreenEnabled) {
			target.addEventListener('mousedown', function(evt){
				if(evt.target.fullscreenElement !== false && evt[ZOOM_KEY] && evt[FULLSCREEN_KEY]){
					document.exitFullscreen();
				}
			});
			target.requestFullscreen();
			return;
		}


		event.preventDefault();

		let bounds = target.getBoundingClientRect();

		zoom.to({
			x: ( bounds.left * revealScale ) - zoomPadding,
			y: ( bounds.top * revealScale ) - zoomPadding,
			width: ( bounds.width * revealScale ) + ( zoomPadding * 2 ),
			height: ( bounds.height * revealScale ) + ( zoomPadding * 2 ),
			pan: false
		});
	} );

	Reveal.addEventListener('overviewshown', function() { isEnabled = false; });
	Reveal.addEventListener('overviewhidden', function() { isEnabled = true; });
	Reveal.addEventListener('ready', function () {
		for(let e of document.querySelectorAll(
			'img,video,span,div,section'
		)){
			e.removeAttribute('title')
		}
	})
})();