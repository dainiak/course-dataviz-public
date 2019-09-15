/*
 * Reveal.js menu plugin
 * MIT licensed
 * (c) Greg Denehy 2015
 */

let RevealMenu = window.RevealMenu || (function(){
	let config = Reveal.getConfig();
	let options = config.menu || {};
	options.path = options.path || scriptPath() || 'plugin/menu/';
	if (!options.path.endsWith('/')) {
		options.path += '/';
	}
	let loadIcons = options.loadIcons;
	if (typeof loadIcons === "undefined") loadIcons = true;
	let initialised = false;
	
	let module = {};

	loadResource(options.path + 'menu.css', 'stylesheet', function() {
		if (loadIcons) {
			loadResource(options.path + 'font-awesome/css/all.css', 'stylesheet', loadPlugin)
		} else {
			loadPlugin();
		}
	})

	function loadPlugin() {
		// does not support IE8 or below
		let initialise = !ieVersion || ieVersion >= 9;

		// do not load the menu in the upcoming slide panel in the speaker notes
		if (Reveal.isSpeakerNotes() && window.location.search.endsWith('controls=false')) {
			initialise = false;
		}

		if (initialise) {
			//
			// Set option defaults
			//
			let side = options.side || 'left';	// 'left' or 'right'
			let width = options.width;
			let numbers = options.numbers || false;
			let titleSelector = 'h1, h2, h3, h4, h5';
			if (typeof options.titleSelector === 'string') titleSelector = options.titleSelector;
			let hideMissingTitles = options.hideMissingTitles || false;
			let useTextContentForMissingTitles = options.useTextContentForMissingTitles || false;
			let markers = options.markers;
			if (typeof markers === "undefined") markers = true;
			let custom = options.custom;
			let themesPath = typeof options.themesPath === 'string' ? options.themesPath : 'css/theme/';
			if (!themesPath.endsWith('/')) themesPath += '/';
			let themes = select('link#theme') ? options.themes : false;
			if (themes === true) {
				themes = [
					{ name: 'Black', theme: themesPath + 'black.css' },
					{ name: 'White', theme: themesPath + 'white.css' },
					{ name: 'League', theme: themesPath + 'league.css' },
					{ name: 'Sky', theme: themesPath + 'sky.css' },
					{ name: 'Beige', theme: themesPath + 'beige.css' },
					{ name: 'Simple', theme: themesPath + 'simple.css' },
					{ name: 'Serif', theme: themesPath + 'serif.css' },
					{ name: 'Blood', theme: themesPath + 'blood.css' },
					{ name: 'Night', theme: themesPath + 'night.css' },
					{ name: 'Moon', theme: themesPath + 'moon.css' },
					{ name: 'Solarized', theme: themesPath + 'solarized.css' }
				];
			} else if (!Array.isArray(themes)) {
				themes = false;
			}
			let transitions = options.transitions || false;
			if (transitions === true) {
				transitions = ['None', 'Fade', 'Slide', 'Convex', 'Concave', 'Zoom'];
			} else if (transitions !== false && (!Array.isArray(transitions) || !transitions.every(function(e) { return typeof e === "string" }))) {
				console.error("reveal.js-menu error: transitions config value must be 'true' or an array of strings, eg ['None', 'Fade', 'Slide')");
				transitions = false;
			}
			if (ieVersion && ieVersion <= 9) {
				// transitions aren't support in IE9 anyway, so no point in showing them
				transitions = false;
			}
			let openButton = options.openButton;
			if (typeof openButton === "undefined") openButton = true;
			let openSlideNumber = options.openSlideNumber;
			if (typeof openSlideNumber === "undefined") openSlideNumber = false;
			let keyboard = options.keyboard;
			if (typeof keyboard === "undefined") keyboard = true;
			let sticky = options.sticky;
			if (typeof sticky === "undefined") sticky = false;
			let autoOpen = options.autoOpen;
			if (typeof autoOpen === "undefined") autoOpen = true;
			let delayInit = options.delayInit;
			if (typeof delayInit === "undefined") delayInit = false;
			let openOnInit = options.openOnInit || false;
			
			let mouseSelectionEnabled = true;
			function disableMouseSelection() {
				mouseSelectionEnabled = false;
			}

			function reenableMouseSelection() {
				// wait until the mouse has moved before re-enabling mouse selection
				// to avoid selections on scroll
				select('nav.slide-menu').addEventListener('mousemove', function fn(e) {
					select('nav.slide-menu').removeEventListener('mousemove', fn);
					//XXX this should select the item under the mouse
					mouseSelectionEnabled = true;
				});
			}

			//
			// Keyboard handling
			//
			function getOffset(el) {
				let _x = 0;
				let _y = 0;
				while(el && !isNaN(el.offsetLeft) && !isNaN(el.offsetTop)) {
					_x += el.offsetLeft - el.scrollLeft;
					_y += el.offsetTop - el.scrollTop;
					el = el.offsetParent;
				}
				return { top: _y, left: _x };
			}

			function visibleOffset(el) {
				let offsetFromTop = getOffset(el).top - el.offsetParent.offsetTop;
				if (offsetFromTop < 0) return -offsetFromTop
				let offsetFromBottom = el.offsetParent.offsetHeight - (el.offsetTop - el.offsetParent.scrollTop + el.offsetHeight);
				if (offsetFromBottom < 0) return offsetFromBottom; 
				return 0;
			}

			function keepVisible(el) {
				let offset = visibleOffset(el);
				if (offset) {
					disableMouseSelection();
					el.scrollIntoView(offset > 0);
					reenableMouseSelection();
				}
			}

			function scrollItemToTop(el) {
				disableMouseSelection();
				el.offsetParent.scrollTop = el.offsetTop;
				reenableMouseSelection();
			}

			function scrollItemToBottom(el) {
				disableMouseSelection();
				el.offsetParent.scrollTop = el.offsetTop - el.offsetParent.offsetHeight + el.offsetHeight
				reenableMouseSelection();
			}

			function selectItem(el) {
				el.classList.add('selected');
				keepVisible(el);
				if (sticky && autoOpen) openItem(el);
			}

			function onDocumentKeyDown(event) {
				let currItem = null;
                let visibleItems = null;
                let item = null;
                if (isOpen()) {
					event.stopImmediatePropagation();
					switch( event.key ) {
						case 'm':
							// toggleMenu();
							break;
						case 'ArrowLeft':
							prevPanel();
							break;
						case 'ArrowRight':
							nextPanel();
							break;

						case 'ArrowUp':
							currItem = select('.active-menu-panel .slide-menu-items li.selected') || select('.active-menu-panel .slide-menu-items li.active');
							if (currItem) {
								selectAll('.active-menu-panel .slide-menu-items li').forEach(function(item) { item.classList.remove('selected') });
								let nextItem = select('.active-menu-panel .slide-menu-items li[data-item="' + (parseInt(currItem.getAttribute('data-item')) - 1) + '"]') || currItem;
								selectItem(nextItem);
							} else {
								let item = select('.active-menu-panel .slide-menu-items li.slide-menu-item');
								if (item) selectItem(item);
							}
							break;

						case 'ArrowDown':
							currItem = select('.active-menu-panel .slide-menu-items li.selected') || select('.active-menu-panel .slide-menu-items li.active');
							if (currItem) {
								selectAll('.active-menu-panel .slide-menu-items li').forEach(function(item) { item.classList.remove('selected') });
								let nextItem = select('.active-menu-panel .slide-menu-items li[data-item="' + (parseInt(currItem.getAttribute('data-item')) + 1) + '"]') || currItem;
								selectItem(nextItem);
							} else {
								let item = select('.active-menu-panel .slide-menu-items li.slide-menu-item');
								if (item) selectItem(item);
							}
							break;

						case 'PageUp':
							let itemsAbove = selectAll('.active-menu-panel .slide-menu-items li').filter(function(item) { return visibleOffset(item) > 0; });
							visibleItems = selectAll('.active-menu-panel .slide-menu-items li').filter(function(item) { return visibleOffset(item) == 0; });

							let firstVisible = (itemsAbove.length > 0 && Math.abs(visibleOffset(itemsAbove[itemsAbove.length-1])) < itemsAbove[itemsAbove.length-1].clientHeight ? itemsAbove[itemsAbove.length-1] : visibleItems[0]);
							if (firstVisible) {
								if (firstVisible.classList.contains('selected') && itemsAbove.length > 0) {
									// at top of viewport already, page scroll (if not at start)
									// ...move selected item to bottom, and change selection to last fully visible item at top
									scrollItemToBottom(firstVisible);
									visibleItems = selectAll('.active-menu-panel .slide-menu-items li').filter(function(item) { return visibleOffset(item) == 0; });
									if (visibleItems[0] == firstVisible) {
										// prev item is still beyond the viewport (for custom panels)
										firstVisible = itemsAbove[itemsAbove.length-1];
									} else {
										firstVisible = visibleItems[0];
									}
								}
								selectAll('.active-menu-panel .slide-menu-items li').forEach(function(item) { item.classList.remove('selected') });
								selectItem(firstVisible);
								// ensure selected item is positioned at the top of the viewport
								scrollItemToTop(firstVisible);
							}
							break;

						case 'PageDown':
							let visibleItems = selectAll('.active-menu-panel .slide-menu-items li').filter(function(item) { return visibleOffset(item) == 0; });
							let itemsBelow = selectAll('.active-menu-panel .slide-menu-items li').filter(function(item) { return visibleOffset(item) < 0; });
							
							let lastVisible = (itemsBelow.length > 0 && Math.abs(visibleOffset(itemsBelow[0])) < itemsBelow[0].clientHeight ? itemsBelow[0] : visibleItems[visibleItems.length-1]);
							if (lastVisible) {
								if (lastVisible.classList.contains('selected') && itemsBelow.length > 0) {
									// at bottom of viewport already, page scroll (if not at end)
									// ...move selected item to top, and change selection to last fully visible item at bottom
									scrollItemToTop(lastVisible);
									visibleItems = selectAll('.active-menu-panel .slide-menu-items li').filter(function(item) { return visibleOffset(item) == 0; });
									if (visibleItems[visibleItems.length-1] == lastVisible) {
										// next item is still beyond the viewport (for custom panels)
										lastVisible = itemsBelow[0];
									} else {
										lastVisible = visibleItems[visibleItems.length-1];
									}
								}
								selectAll('.active-menu-panel .slide-menu-items li').forEach(function(item) { item.classList.remove('selected') });
								selectItem(lastVisible);
								// ensure selected item is positioned at the bottom of the viewport
								scrollItemToBottom(lastVisible);
							}
							break;

						case 'Home':
							selectAll('.active-menu-panel .slide-menu-items li').forEach(function(item) { item.classList.remove('selected') });
							item = select('.active-menu-panel .slide-menu-items li:first-of-type');
							if (item) {
								item.classList.add('selected');
								keepVisible(item);
							}
							break;

						case 'End':
							selectAll('.active-menu-panel .slide-menu-items li').forEach(function(item) { item.classList.remove('selected') });
							item = select('.active-menu-panel .slide-menu-items:last-of-type li:last-of-type');
							if (item) {
								item.classList.add('selected');
								keepVisible(item);
							}
							break;

						case ' ': case 'Enter':
							currItem = select('.active-menu-panel .slide-menu-items li.selected');
							if (currItem) {
								openItem(currItem, true);
							}
							break;

						case 'Escape': closeMenu(null, true); break;
					}
				}
			}

			if (keyboard) {
                Reveal.addKeyBinding( { keyCode: 77, key: 'M', description: 'Toggle menu' }, function() {
                    toggleMenu();
                } );

				document.addEventListener('keydown', onDocumentKeyDown, false);

				// handle key presses within speaker notes
				window.addEventListener( 'message', function( event ) {
					let data;
					try {
						data = JSON.parse( event.data );
					} catch (e) {
					}
					if (data && data.method === 'triggerKey') {
						onDocumentKeyDown( { keyCode: data.args[0], stopImmediatePropagation: function() {} } );
					}
				});

				// Prevent reveal from processing keyboard events when the menu is open
				if (config.keyboardCondition && typeof config.keyboardCondition === 'function') {
					// combine user defined keyboard condition with the menu's own condition
					let userCondition = config.keyboardCondition;
					config.keyboardCondition = function() {
						return userCondition() && !isOpen();
					};
				} else {
					config.keyboardCondition = function() { return !isOpen(); }
				}
			}


			//
			// Utilty functions
			//

			function openMenu(event) {
				if (event) event.preventDefault();
				if (!isOpen()) {
					select('body').classList.add('slide-menu-active');
				    select('.reveal').classList.add('has-' + options.effect + '-' + side);
				    select('.slide-menu').classList.add('active');
				    select('.slide-menu-overlay').classList.add('active');
					
					// identify active theme
					if (themes) {
						selectAll('div[data-panel="Themes"] li').forEach(function(i) { i.classList.remove('active') });
						selectAll('li[data-theme="' + select('link#theme').getAttribute('href') + '"]').forEach(function(i) { i.classList.add('active') });
					}
					
					// identify active transition
					if (transitions) {
						selectAll('div[data-panel="Transitions"] li').forEach(function(i) { i.classList.remove('active') });
						selectAll('li[data-transition="' + Reveal.getConfig().transition + '"]').forEach(function(i) { i.classList.add('active') });
					}

				    // set item selections to match active items
					let items = selectAll('.slide-menu-panel li.active')
					items.forEach(function(i) {
						i.classList.add('selected');
						keepVisible(i);
					});
				}
			}

			function closeMenu(event, force) {
				if (event) event.preventDefault();
				if (!sticky || force) {
					select('body').classList.remove('slide-menu-active');
					select('.reveal').classList.remove('has-' + options.effect + '-' + side);
					select('.slide-menu').classList.remove('active');
					select('.slide-menu-overlay').classList.remove('active');
					selectAll('.slide-menu-panel li.selected').forEach(function(i) { i.classList.remove('selected') });
				}
			}

			function toggleMenu(event) {
				if (isOpen()) {
					closeMenu(event, true);
				} else {
					openMenu(event);
				}
			}

			function isOpen() {
				return select('body').classList.contains('slide-menu-active');
			}

			function openPanel(event, ref) {
				openMenu(event);
				let panel = ref;
				if (typeof ref !== "string") {
					panel = event.currentTarget.getAttribute('data-panel');
				}
				select('.slide-menu-toolbar > li.active-toolbar-button').classList.remove('active-toolbar-button');
				select('li[data-panel="' + panel + '"]').classList.add('active-toolbar-button');
				select('.slide-menu-panel.active-menu-panel').classList.remove('active-menu-panel');
				select('div[data-panel="' + panel + '"]').classList.add('active-menu-panel');
			}

			function nextPanel() {
				let next = (parseInt(select('.active-toolbar-button').getAttribute('data-button')) + 1) % buttons;
				openPanel(null, select('.toolbar-panel-button[data-button="' + next + '"]').getAttribute('data-panel'));
			}

			function prevPanel() {
				let next = parseInt(select('.active-toolbar-button').getAttribute('data-button')) - 1;
				if (next < 0) {
					next = buttons - 1;
				}
				openPanel(null, select('.toolbar-panel-button[data-button="' + next + '"]').getAttribute('data-panel'));
			}

			function openItem(item, force) {
				let h = parseInt(item.getAttribute('data-slide-h'));
				let v = parseInt(item.getAttribute('data-slide-v'));
				let theme = item.getAttribute('data-theme');
				let transition = item.getAttribute('data-transition');
				if (!isNaN(h) && !isNaN(v)) {
					Reveal.slide(h, v);
					closeMenu();
				} else if (theme) {
					// take note of the previous theme and remove it, then create a new stylesheet reference and insert it
					// this is required to force a load event so we can change the menu style to match the new style
					let stylesheet = select('link#theme');
					let parent = stylesheet.parentElement;
					let sibling = stylesheet.nextElementSibling;
					stylesheet.remove();

					let newStylesheet = stylesheet.cloneNode();
					newStylesheet.setAttribute('href', theme);
					newStylesheet.onload = function() { matchRevealStyle() };
					parent.insertBefore(newStylesheet, sibling);

					closeMenu();
				} else if (transition) {
					Reveal.configure({ transition: transition });
					closeMenu();
				} else {
					let link = select('a', item);
					if (link) {
						if (force || !sticky || (autoOpen && link.href.startsWith('#') || link.href.startsWith(window.location.origin + window.location.pathname + '#'))) {
							link.click();
						}
					}
					closeMenu();
				}
			}

			function clicked(event) {
				if (event.target.nodeName !== "A") {
					event.preventDefault();
				}
				openItem(event.currentTarget);
			}

			function highlightCurrentSlide() {
				let state = Reveal.getState();
				selectAll('li.slide-menu-item, li.slide-menu-item-vertical').forEach(function(item) {
					item.classList.remove('past');
					item.classList.remove('active');
					item.classList.remove('future');

					let h = parseInt(item.getAttribute('data-slide-h'));
					let v = parseInt(item.getAttribute('data-slide-v'));
					if (h < state.indexh || (h === state.indexh && v < state.indexv)) {
						item.classList.add('past');
					}
					else if (h === state.indexh && v === state.indexv) {
						item.classList.add('active');
					}
					else {
						item.classList.add('future');
					}
				});
			}

			function matchRevealStyle() {
				let revealStyle = window.getComputedStyle(select('.reveal'));
				let element = select('.slide-menu');
				element.style.fontFamily = revealStyle.fontFamily;
				//XXX could adjust the complete menu style to match the theme, ie colors, etc
			}

			let buttons = 0;
			function init() {
				if (!initialised) {
					let parent = select('.reveal').parentElement;
					let top = create('div', { 'class': 'slide-menu-wrapper'});
					parent.appendChild(top);
					let panels = create('nav', { 'class': 'slide-menu slide-menu--' + side});
					if (typeof width === 'string') {
						if (['normal', 'wide', 'third', 'half', 'full'].indexOf(width) !== -1) {
							panels.classList.add('slide-menu--' + width);
						}
						else {
							panels.classList.add('slide-menu--custom');
							panels.style.width = width;
						}
					}
					top.appendChild(panels);
					matchRevealStyle();
					let overlay = create('div', { 'class': 'slide-menu-overlay'});
					top.appendChild(overlay);
					overlay.onclick = function() { closeMenu(null, true) };

					let toolbar = create('ol', {'class': 'slide-menu-toolbar'});
					select('.slide-menu').appendChild(toolbar);

					function addToolbarButton(title, ref, icon, style, fn, active) {
						let attrs = {
							'data-button': '' + (buttons++),
							'class': 'toolbar-panel-button' + (active ? ' active-toolbar-button' : '')
						};
						if (ref) {
							attrs['data-panel'] = ref;
						}	
						let button = create('li', attrs);

						if (icon.startsWith('fa-')) {
							button.appendChild(create('i', {'class': style + ' ' + icon}));
						} else {
							button.innerHTML = icon + '</i>';
						}
						button.appendChild(create('br'), select('i', button));
						button.appendChild(create('span', {'class': 'slide-menu-toolbar-label'}, title), select('i', button));
						button.onclick = fn;
						toolbar.appendChild(button);
						return button;
					}

					addToolbarButton('Slides', 'Slides', 'fa-images', 'fas', openPanel, true);

					if (custom) {
						custom.forEach(function(element, index, array) {
							addToolbarButton(element.title, 'Custom' + index, element.icon, null, openPanel);
						});
					}

					if (themes) {
						addToolbarButton('Themes', 'Themes', 'fa-adjust', 'fas', openPanel);
					}
					if (transitions) {
						addToolbarButton('Transitions', 'Transitions', 'fa-sticky-note', 'fas', openPanel);
					}
					button = create('li', {id: 'close', 'class': 'toolbar-panel-button'});
					button.appendChild(create('i', {'class': 'fas fa-times'}));
					button.appendChild(create('br'));
					button.appendChild(create('span', {'class': 'slide-menu-toolbar-label'}, 'Close'));
					button.onclick = function() { closeMenu(null, true) };
					toolbar.appendChild(button);

					//
					// Slide links
					//
					function generateItem(type, section, i, h, v) {
						let link = '/#/' + h;
						if (typeof v === 'number' && !isNaN( v )) link += '/' + v;

						function text(selector, parent) {
							let el = (parent ? select(selector, section) : select(selector));
							if (el) return el.textContent;
							return null;
						}
						let title = section.getAttribute('data-menu-title') ||
							text('.menu-title', section) ||
							text(titleSelector, section);

						if (!title && useTextContentForMissingTitles) {
							// attempt to figure out a title based on the text in the slide
							title = section.textContent.trim();
							if (title) {
								title = title.split('\n')
									.map(function(t) { return t.trim() }).join(' ').trim()
									.replace(/^(.{16}[^\s]*).*/, "$1") // limit to 16 chars plus any consecutive non-whitespace chars (to avoid breaking words)
									.replace(/&/g, "&amp;")
									.replace(/</g, "&lt;")
									.replace(/>/g, "&gt;")
									.replace(/"/g, "&quot;")
									.replace(/'/g, "&#039;") + '...';
							}
						}

						if (!title) {
							if (hideMissingTitles) return '';
							type += ' no-title';
							title = "Slide " + i;
						}

						let item = create('li', {
							class: type,
							'data-item': i,
							'data-slide-h': h,
							'data-slide-v': (v === undefined ? 0 : v)
						});

						if (markers) {
							item.appendChild(create('i', {class: 'fas fa-check-circle fa-fw past'}));
							item.appendChild(create('i', {class: 'fas fa-arrow-alt-circle-right fa-fw active'}));
							item.appendChild(create('i', {class: 'far fa-circle fa-fw future'}));
						}

						if (numbers) {
							// Number formatting taken from reveal.js
							let value = [];
							let format = 'h.v';

							// Check if a custom number format is available
							if( typeof numbers === 'string' ) {
								format = numbers;
							}
							else if (typeof config.slideNumber === 'string') {
								// Take user defined number format for slides
								format = config.slideNumber;
							}

							switch( format ) {
								case 'c':
									value.push( i );
									break;
								case 'c/t':
									value.push( i, '/', Reveal.getTotalSlides() );
									break;
								case 'h/v':
									value.push( h + 1 );
									if( typeof v === 'number' && !isNaN( v ) ) value.push( '/', v + 1 );
									break;
								default:
									value.push( h + 1 );
									if( typeof v === 'number' && !isNaN( v ) ) value.push( '.', v + 1 );
							}

							item.appendChild(create('span', {class: 'slide-menu-item-number'}, value.join('') + '. '));
						}

						item.appendChild(create('span', {class: 'slide-menu-item-title'}, title));
						
						return item;
					}

					function createSlideMenu() {
						if ( !document.querySelector('section[data-markdown]:not([data-markdown-parsed])') ) {
							let panel = create('div', {
								'data-panel': 'Slides',
								'class': 'slide-menu-panel active-menu-panel'
							});
							panel.appendChild(create('ul', {class: "slide-menu-items"}));
							panels.appendChild(panel);
							let items = select('.slide-menu-panel[data-panel="Slides"] > .slide-menu-items');
							let slideCount = 0;
							selectAll('.slides > section').forEach(function(section, h) {
								let subsections = selectAll('section', section);
								if (subsections.length > 0) {
									subsections.forEach(function(subsection, v) {
										let type = (v === 0 ? 'slide-menu-item' : 'slide-menu-item-vertical');
										let item = generateItem(type, subsection, slideCount, h, v);
										if (item) {
											slideCount++;
											items.appendChild(item);
										}
									});
								} else {
									let item = generateItem('slide-menu-item', section, slideCount, h);
									if (item) {
										slideCount++;
										items.appendChild(item);
									}
								}
							});
							selectAll('.slide-menu-item, .slide-menu-item-vertical').forEach(function(i) {
								i.onclick = clicked;
							});
							highlightCurrentSlide();
						}
						else {
						// wait for markdown to be loaded and parsed
							setTimeout( createSlideMenu, 100 );
						}
					}

					createSlideMenu();
					Reveal.addEventListener('slidechanged', highlightCurrentSlide);

					//
					// Custom menu panels
					//
					if (custom) {
						function xhrSuccess () {
							if (this.status >= 200 && this.status < 300) {
								this.panel.innerHTML = this.responseText;
								enableCustomLinks(this.panel);
							}
							else {
								showErrorMsg(this)
							}
						}
						function xhrError () {
							showErrorMsg(this)
						}
						function loadCustomPanelContent (panel, sURL) {
							let oReq = new XMLHttpRequest();
							oReq.panel = panel;
							oReq.arguments = Array.prototype.slice.call(arguments, 2);
							oReq.onload = xhrSuccess;
							oReq.onerror = xhrError;
							oReq.open("get", sURL, true);
							oReq.send(null);
						}
						function enableCustomLinks(panel) {
							selectAll('ul.slide-menu-items li.slide-menu-item', panel).forEach(function(item, i) {
								item.setAttribute('data-item', i+1);
								item.onclick = clicked;
								item.addEventListener("mouseenter", handleMouseHighlight);
							});
						}

						function showErrorMsg(response) {
							let msg = '<p>ERROR: The attempt to fetch ' + response.responseURL + ' failed with HTTP status ' + 
								response.status + ' (' + response.statusText + ').</p>' +
								'<p>Remember that you need to serve the presentation HTML from a HTTP server.</p>';
								response.panel.innerHTML = msg;
						}

						custom.forEach(function(element, index, array) {
							let panel = create('div', {
								'data-panel': 'Custom' + index,
								class: 'slide-menu-panel slide-menu-custom-panel'
							});
							if (element.content) {
								panel.innerHTML = element.content;
								enableCustomLinks(panel);
							}
							else if (element.src) {
								loadCustomPanelContent(panel, element.src);
							}
							panels.appendChild(panel);
						})
					}

					//
					// Themes
					//
					if (themes) {
						let panel = create('div', {
							class: 'slide-menu-panel',
							'data-panel': 'Themes'
						});
						panels.appendChild(panel);
						let menu = create('ul', {class: 'slide-menu-items'});
						panel.appendChild(menu);
						themes.forEach(function(t, i) {
							let item = create('li', {
								class: 'slide-menu-item',
								'data-theme': t.theme,
								'data-item': ''+(i+1)
							 }, t.name);
							 menu.appendChild(item);
							 item.onclick = clicked;
						})
					}

					//
					// Transitions
					//
					if (transitions) {
						let panel = create('div', {
							class: 'slide-menu-panel',
							'data-panel': 'Transitions'
						});
						panels.appendChild(panel);
						let menu = create('ul', {class: 'slide-menu-items'});
						panel.appendChild(menu);
						transitions.forEach(function(name, i) {
							let item = create('li', {
								class: 'slide-menu-item',
								'data-transition': name.toLowerCase(),
								'data-item': ''+(i+1)
							}, name);
							menu.appendChild(item);
							item.onclick = clicked;
						})
					}

					//
					// Open menu options
					//
					if (openButton) {
						// add menu button
						let div = create('div', {class: 'slide-menu-button'});
						let link = create('a', {href: '#'});
						link.appendChild(create('i', {class: 'fas fa-bars'}));
						div.appendChild(link);
						select('.reveal').appendChild(div);
						div.onclick = openMenu;
					}

					if (openSlideNumber) {
						// wrap slide number in link
						select('div.slide-number').onclick = openMenu;
					}

					//
					// Handle mouse overs
					//
					selectAll('.slide-menu-panel .slide-menu-items li').forEach(function(item) {
						item.addEventListener("mouseenter", handleMouseHighlight);
					});

					function handleMouseHighlight(event) {
						if (mouseSelectionEnabled) {
							selectAll('.active-menu-panel .slide-menu-items li.selected').forEach(function(i) {
								i.classList.remove('selected');
							});
							event.currentTarget.classList.add('selected');
						}
					}
				}
				if (openOnInit) {
					openMenu();
				}
				initialised = true;
			}

			module.toggle = toggleMenu;
			module.openMenu = openMenu;
			module.closeMenu = closeMenu;
			module.openPanel = openPanel;
			module.isOpen = isOpen;
			module.init = init;
			module.isInit = function() { return initialised };
			
			if (!delayInit) {
				init();
			}

			/**
			 * Extend object a with the properties of object b.
			 * If there's a conflict, object b takes precedence.
			 */
			function extend( a, b ) {
				for( let i in b ) {
					a[ i ] = b[ i ];
				}
			}

			/**
			 * Dispatches an event of the specified type from the
			 * reveal DOM element.
			 */
			function dispatchEvent( type, args ) {
				let event = document.createEvent( 'HTMLEvents', 1, 2 );
				event.initEvent( type, true, true );
				extend( event, args );
				document.querySelector('.reveal').dispatchEvent( event );

				// If we're in an iframe, post each reveal.js event to the
				// parent window. Used by the notes plugin
				if( config.postMessageEvents && window.parent !== window.self ) {
					window.parent.postMessage( JSON.stringify({ namespace: 'reveal', eventName: type, state: Reveal.getState() }), '*' );
				}
			}

			dispatchEvent('menu-ready');
		}
	}

	function select(selector, el) {
		if (!el) {
			el = document;
		}
		return el.querySelector(selector);
	}

	function selectAll(selector, el) {
		if (!el) {
			el = document;
		}
		return Array.prototype.slice.call(el.querySelectorAll(selector));
	}

	function create(tagName, attrs, content) {
		let el = document.createElement(tagName);
		if (attrs) {
			Object.getOwnPropertyNames(attrs).forEach(function(n) {
				el.setAttribute(n, attrs[n]);
			});
		}
		if (content) el.innerHTML = content;
		return el;
	}

	// modified from math plugin
	function loadResource( url, type, callback ) {
		let head = document.querySelector( 'head' );
		let resource;

		if ( type === 'script' ) {
			resource = document.createElement( 'script' );
			resource.type = 'text/javascript';
			resource.src = url;
		}
		else if ( type === 'stylesheet' ) {
			resource = document.createElement( 'link' );
			resource.rel = 'stylesheet';
			resource.href = url;
		}

		// Wrapper for callback to make sure it only fires once
		let finish = function() {
			if( typeof callback === 'function' ) {
				callback.call();
				callback = null;
			}
		}

		resource.onload = finish;

		// IE
		resource.onreadystatechange = function() {
			if ( this.readyState === 'loaded' ) {
				finish();
			}
		}

		// Normal browsers
		head.appendChild( resource );
	}

	function scriptPath() {
		// obtain plugin path from the script element
		let path;
		if (document.currentScript) {
			path = document.currentScript.src.slice(0, -7);
		} else {
			let sel = document.querySelector('script[src$="menu.js"]');
			if (sel) {
				path = sel.src.slice(0, -7);
			}
		}
		return path;
	}

	// polyfill
	if (!String.prototype.startsWith) {
		String.prototype.startsWith = function(searchString, position){
		  return this.substr(position || 0, searchString.length) === searchString;
	  };
	}
	if (!String.prototype.endsWith) {
		String.prototype.endsWith = function(search, this_len) {
			if (this_len === undefined || this_len > this.length) {
				this_len = this.length;
			}
			return this.substring(this_len - search.length, this_len) === search;
		};
	}

	let ieVersion = function() {
		let browser = /(msie) ([\w.]+)/.exec(window.navigator.userAgent.toLowerCase());
		if (browser && browser[1] === "msie") {
			return parseFloat(browser[2]);
		}
		return null;
	}();
	
	return module;
})();
