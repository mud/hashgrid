/*  hashgrid (Prototype version)
 *  http://github.com/mud/hashgrid
 *  Takashi Okamoto, buzamoto.com
 *
 *  This is a port of hashgrid originally by Jon Gibbins using Prototype.
 *
 *--------------------------------------------------------------------------*/
 
/**
 * hashgrid (jQuery version)
 * http://github.com/dotjay/hashgrid
 * Version 4, 29 Mar 2010
 * By Jon Gibbins, accessibility.co.uk
 *
 * // Using a basic #grid setup
 * var grid = new hashgrid();
 *
 * // Using #grid with a custom id (e.g. #mygrid)
 * var grid = new hashgrid("mygrid");
 *
 * // Using #grid with additional options
 * var grid = new hashgrid({
 *     id: 'mygrid',            // id for the grid container
 *     modifierKey: 'alt',      // optional 'ctrl', 'alt' or 'shift'
 *     showGridKey: 's',        // key to show the grid
 *     holdGridKey: 'enter',    // key to hold the grid in place
 *     foregroundKey: 'f',      // key to toggle foreground/background
 *     jumpGridsKey: 'd',       // key to cycle through the grid classes
 *     numberOfGrids: 2,        // number of grid classes used
 *     classPrefix: 'class',    // prefix for the grid classes
 *     cookiePrefix: 'mygrid'   // prefix for the cookie name
 * });
 */


/**
 * You can call hashgrid from your own code, but it's loaded here by
 * default for convenience.
 */
Event.observe(window, 'load', function() {

	var grid = new hashgrid({
		numberOfGrids: 2
	});

});


/**
 * hashgrid overlay
 */
var hashgrid = function(set) {

	var options = {
		id: 'grid',             // id for the grid container
		modifierKey: null,      // optional 'ctrl', 'alt' or 'shift'
		showGridKey: 'g',       // key to show the grid
		holdGridKey: 'h',       // key to hold the grid in place
		foregroundKey: 'f',     // key to toggle foreground/background
		jumpGridsKey: 'j',      // key to cycle through the grid classes
		numberOfGrids: 1,       // number of grid classes used
		classPrefix: 'grid-',   // prefix for the grid classes
		cookiePrefix: 'hashgrid'// prefix for the cookie name
	};
	var overlayOn = false,
		sticky = false,
		overlayZState = 'B',
		overlayZBackground = -1,
		overlayZForeground = 9999,
		classNumber = 1;

	// Apply options
	if (typeof set == 'object') {
		var k;
		for (k in set) options[k] = set[k];
	}
	else if (typeof set == 'string') {
		options.id = set;
	}

	// Remove any conflicting overlay
	if ($$('#' + options.id).length > 0) {
		$(options.id).remove();
	}

	// Create overlay, hidden before adding to DOM
	var overlayEl = new Element('div', { id: options.id });
	overlayEl.setStyle({ display: 'none' });
	if (document.body.childNodes.length > 0) {
		document.body.insert({ top: overlayEl });
	} else {
		document.body.appendChild(overlayEl);
	}
	var overlay = $(options.id);

	// Unless a custom z-index is set, ensure the overlay will be behind everything
	if (overlay.getStyle('z-index') == 'auto') overlay.setStyle({ zIndex: overlayZBackground });

	// Override the default overlay height with the actual page height
	// There wasn't a Prototype method to get page height, so I took this from jQuery's implementation of document.height()
	var pageHeight = Math.max(
		document.documentElement["clientHeight"],
		document.body["scrollHeight"], document.documentElement["scrollHeight"],
		document.body["offsetHeight"], document.documentElement["offsetHeight"]
	);
	overlay.setStyle({ height: pageHeight+'px' });

	// Add the first grid line so that we can measure it
	overlay.appendChild(new Element('div', { 'class': 'horiz first-line' }));

	// Calculate the number of grid lines needed
	var overlayGridLines = overlay.down('.horiz'),
		overlayGridLineHeight = parseFloat(overlayGridLines.getStyle('height')) + parseFloat(overlayGridLines.getStyle('border-bottom-width'));

	// Break on zero line height
	if (overlayGridLineHeight <= 0) return true;

	// Add the remaining grid lines
	var i, numGridLines = Math.floor(pageHeight / overlayGridLineHeight);
	for (i = numGridLines - 1; i >= 1; i--) {
		overlay.appendChild(new Element('div', { 'class': 'horiz' }));
	}

	// Check for saved state
	var overlayCookie = readCookie(options.cookiePrefix + options.id);
	if (typeof overlayCookie == 'string') {
		var state = overlayCookie.split(',');
		state[2] = Number(state[2]);
		if ((typeof state[2] == 'number') && !isNaN(state[2])) {
			classNumber = state[2].toFixed(0);
			overlay.addClassName(options.classPrefix + classNumber);
		}
		if (state[1] == 'F') {
			overlayZState = 'F';
			overlay.setStyle({ zIndex: overlayZForeground });
		}
		if (state[0] == '1') {
			overlayOn = true;
			sticky = true;
			overlay.show();
		}
	}
	else {
		overlay.addClassName(options.classPrefix + classNumber)
	}
	
	// Keyboard controls
	Event.observe(document, 'keydown', keydownHandler);
	Event.observe(document, 'keyup', keyupHandler);
	/**
	 * Helpers
	 */

	function getModifier(e) {
		if (options.modifierKey == null) return true; // Bypass by default
		var m = true;
		switch(options.modifierKey) {
			case 'ctrl':
				m = (e.ctrlKey ? e.ctrlKey : false);
				break;

			case 'alt':
				m = (e.altKey ? e.altKey : false);
				break;

			case 'shift':
				m = (e.shiftKey ? e.shiftKey : false);
				break;
		}
		return m;
	}

	function getKey(e) {
		var k = false, c = (e.keyCode ? e.keyCode : e.which);
		// Handle keywords
		if (c == 13) k = 'enter';
		// Handle letters
		else k = String.fromCharCode(c).toLowerCase();
		return k;
	}

	function saveState() {
		createCookie(options.cookiePrefix + options.id, (sticky ? '1' : '0') + ',' + overlayZState + ',' + classNumber, 1);
	}

	/**
	 * Event handlers
	 */

	function keydownHandler(e) {
		var source = e.target.tagName.toLowerCase();
		if ((source == 'input') || (source == 'textarea') || (source == 'select')) return true;
		var m = getModifier(e);
		if (!m) return true;
		var k = getKey(e);
		if (!k) return true;
		switch(k) {
			case options.showGridKey:
				if (!overlayOn) {
					overlay.show();
					overlayOn = true;
				}
				else if (sticky) {
					overlay.hide();
					overlayOn = false;
					sticky = false;
					saveState();
				}
				break;
			case options.holdGridKey:
				if (overlayOn && !sticky) {
					// Turn sticky overlay on
					sticky = true;
					saveState();
				}
				break;
			case options.foregroundKey:
				if (overlayOn) {
					// Toggle sticky overlay z-index
					if (overlay.getStyle('z-index') == overlayZForeground) {
						overlay.setStyle({ zIndex: overlayZBackground });
						overlayZState = 'B';
					}
					else {
						overlay.setStyle({ zIndex: overlayZBackground });
						overlayZState = 'F';
					}
					saveState();
				}
				break;
			case options.jumpGridsKey:
				if (overlayOn && (options.numberOfGrids > 1)) {
					// Cycle through the available grids
					overlay.removeClassName(options.classPrefix + classNumber);
					classNumber++;
					if (classNumber > options.numberOfGrids) classNumber = 1;
					overlay.addClassName(options.classPrefix + classNumber);
					if (/webkit/.test( navigator.userAgent.toLowerCase() )) {
						forceRepaint();
					}
					saveState();
				}
				break;
		}
	}

	function keyupHandler(e) {
		var m = getModifier(e);
		if (!m) return true;
		var k = getKey(e);
		if (!k) return true;
		if ((k == options.showGridKey) && !sticky) {
			overlay.hide();
			overlayOn = false;
		}
	}

}


/**
 * Cookie functions
 *
 * By Peter-Paul Koch:
 * http://www.quirksmode.org/js/cookies.html
 */
function createCookie(name,value,days) {
	if (days) {
		var date = new Date();
		date.setTime(date.getTime()+(days*24*60*60*1000));
		var expires = "; expires="+date.toGMTString();
	}
	else var expires = "";
	document.cookie = name+"="+value+expires+"; path=/";
}

function readCookie(name) {
	var nameEQ = name + "=";
	var ca = document.cookie.split(';');
	for(var i=0;i < ca.length;i++) {
		var c = ca[i];
		while (c.charAt(0)==' ') c = c.substring(1,c.length);
		if (c.indexOf(nameEQ) == 0) return c.substring(nameEQ.length,c.length);
	}
	return null;
}

function eraseCookie(name) {
	createCookie(name,"",-1);
}


/**
 * Forces a repaint (because WebKit has issues)
 * http://www.sitepoint.com/forums/showthread.php?p=4538763
 * http://www.phpied.com/the-new-game-show-will-it-reflow/
 */
function forceRepaint() {
	var ss = document.styleSheets[0];
	try {
		ss.addRule('.xxxxxx', 'position: relative');
		ss.removeRule(ss.rules.length - 1);
	} catch(e){}
}