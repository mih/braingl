(function($) {
    // Sobald wir mit dem DOM arbeiten k��nnen, ���
    $(document).ready(function() {
        if (!window.WebGLRenderingContext) {
            $('html').addClass('no-webgl');
        }
        
        // ��� die Konfigurationsdaten und die Elemente per AJAX laden.
        var config = $.getSyncJSON(settings.STATIC_URL + 'data/config.json'),
            elements = $.getSyncJSON(settings.STATIC_URL + 'data/elements.json'),
            activations = $.getSyncJSON(settings.STATIC_URL + 'data/coordinates.json'),
            connections = $.getSyncJSON(settings.STATIC_URL + 'data/connections.json'),
            loadingDiv = $('<div class="loading" />'),
            $elementsTogglesContainer = $('#elements'),
            $activationsTogglesContainer = $('#activations'),
            $controlsTogglesContainer = $('#controls-toggles'),
            webglNotSupported = false;
        
        
        // FIXED POSTION: SMALL SCREEN FALLBACK
        $(window).bind('resize', function(e) {
            var $sidebar = $('#sidebar'),
                top = parseInt($('body').css('padding-top'),10);
            $sidebar.parent().toggleClass('fixed', $(window).height() > $sidebar.outerHeight() + top);
        }).trigger('resize');
        
        
        // LOADING
        $('#viewer').append(loadingDiv);
        
        
        // CONTROLS
        $('a[href="#controls"]').click(function(e) {
            e.preventDefault();
            $('#controls').slideToggle();
            return false;
        });
        
        $('a[href="#controls2"]').click(function(e) {
            e.preventDefault();
            $('#controls2').slideToggle();
            return false;
        });
        
        $('a[href="#elements"]').click(function(e) {
            e.preventDefault();
            $('#elements').slideToggle();
            return false;
        });
        
        $('a[href="#activations"]').click(function(e) {
            e.preventDefault();
            $('#activations').slideToggle();
            return false;
        });
        
        $('a[href="#connections"]').click(function(e) {
            e.preventDefault();
            $('#connections').slideToggle();
            return false;
        });
        
        $('a[href="#saveload"]').click(function(e) {
            e.preventDefault();
            $('#saveload').slideToggle();
            return false;
        });
        
        $('a[href="#animation"]').click(function(e) {
            e.preventDefault();
            $('#animation').slideToggle();
            return false;
        });
        
        $('a[href="#inputActivations"]').click(function(e) {
            e.preventDefault();
            $('#inputActivations').slideToggle();
            return false;
        });
        
        $('a[href="#inputConnections"]').click(function(e) {
            e.preventDefault();
            $('#inputConnections').slideToggle();
            return false;
        });
        
        $('a[href="#editActivations"]').click(function(e) {
            e.preventDefault();
            $('#editActivations').slideToggle();
            return false;
        });
        
        $('a[href="#zoom"]').click(function(e) {
            e.preventDefault();
            
            var $vc = $('#viewer-canvas');
            var $vd = $('#viewer');
            
            $('#toggles').slideToggle();
            
            if (Viewer.enlarged === true) {
            	console.log("small");
                $vc.height(Viewer.oldHeight);
                $vc.width(Viewer.oldWidth);
                $vd.height(Viewer.oldHeight);
                $vd.width(Viewer.oldWidth);
                
                Viewer.enlarged = false;
            }
            else {
            	Viewer.oldWidth = $vc.width();
            	Viewer.oldHeight = $vc.height();
            	
            	var newSize = Math.min($(window).width(), $(window).height()) - 40;
            	
                $vc.height(newSize);
                $vc.width(newSize);
                $vd.height(newSize);
                $vd.width(newSize);
                
                Viewer.enlarged = true;
            }
            Viewer.updateSize();
        });
        
        // SLICES
        var sliderChangeHandler = function(method) {
            return function(e) {
                var value = $(this).val();
                $(this).parent().find('.value').text(value);
                Viewer[method](value);
            };
        };
        $('#sliceX').bind('change', sliderChangeHandler('setSagittal')).trigger('change');
        $('#sliceY').bind('change', sliderChangeHandler('setCoronal')).trigger('change');
        $('#sliceZ').bind('change', sliderChangeHandler('setAxial')).trigger('change');
        $('#transp').bind('change', sliderChangeHandler('setTransparency')).trigger('change');
        
        
        // ELEMENTS
        $.each(elements, function(i, el) {
        	if ( el.type != "texture") {
	            var $toggle = $('<a />');
	            $toggle.append('<span/>');
	            $toggle.append('<label>'+el.name+'</label>');
	            $toggle.addClass('toggle');
	            $toggle.addClass('disabled');
	            $toggle.attr('href', '#toggle:' + el.id);
	            $toggle.attr('id', 'toggle-' + el.id);
	            $toggle.click(function(e) {
	                e.preventDefault();
	                Viewer.toggleElement(el.id);
	                return false;
	            });
	            if ($.inArray(el.id, config.controlElements) > -1) $controlsTogglesContainer.append($toggle);
	            else $elementsTogglesContainer.append($toggle);
        	}
        });
        
        Viewer.bind('webglNotSupported', function(evt, data) {
            webglNotSupported = true;
            $('#viewer-canvas').replaceWith($('#viewer-canvas').children());
            $('#viewer .loading').remove();
            $('html').addClass('no-webgl');
        });
        
        Viewer.bind('loadElementComplete', function(evt, data) {
            //if (config.debug) console.log('FINISHED ELEMENT:', data.id);
            $('#toggle-' + data.id).removeClass('disabled');
        });
        
        Viewer.bind('elementDisplayChange', function(evt, data) {
            $('#toggle-' + data.id).toggleClass('active', data.active);
        });
        
        
        // ACTIVATIONS
        $.each(activations, function(i, ac) {
            var $toggle = $('<a />');
            $toggle.append('<span/>');
            var $label = $('<label>'+ac.name+'</label>');
            $toggle.append($label);
            $label.attr('id', 'label-' + ac.id);
            $toggle.addClass('toggle');
            $toggle.attr('href', '#toggle:' + ac.id);
            $toggle.attr('id', 'toggle-' + ac.id);
            $toggle.click(function(e) {
                e.preventDefault();
                Viewer.toggleActivation(ac.id);
                return false;
            });
            $activationsTogglesContainer.append($toggle);
        });
        Viewer.bind('activationDisplayChange', function(evt, data) {
            $('#toggle-' + data.id).toggleClass('active', data.active);
        });
        
        
        // INLINE HIGHLIGHT LINKS
        $('[href^="#highlight:"]').live('mouseover mouseout', function(e) {
            var href = $(this).attr('href'),
                elementId = href.substr(href.lastIndexOf(':')+1);
            if (e.type == 'mouseover') {
                Viewer.highlight(elementId);
            } else {
                Viewer.unHighlight();
            }
        }).live('click', function(e) {
            e.preventDefault();
            return false;
        });
        
        
        // SCENES
        Viewer.bind('activateSceneComplete', function(evt, data) {
            var scene = data.scene,
                togglesAvailable = [];
            togglesAvailable = $.merge(togglesAvailable, scene.elementsAvailable);
            togglesAvailable = $.merge(togglesAvailable, scene.activationsAvailable);
            $('#elements, #activations').find('.toggle').hide();
            $.each(togglesAvailable, function(i, toggle) {
                $('#toggle-' + toggle).show();
            });
            $('#elements, #activations').each(function(i, el) {
                var $group = $(el);
                $group.show();
                $group.toggle(!!$group.find('.toggle:visible').length);
            });
            $('#sliceX').val(scene.slices[0]).trigger('change');
            $('#sliceY').val(scene.slices[1]).trigger('change');
            $('#sliceZ').val(scene.slices[2]).trigger('change');
            $(window).trigger('resize');
        });
        
        $('a[href="#reset-view"]').click(function(e) {
            var scene = $('[data-scene]').data('scene');
            e.preventDefault();
            if (scene) {
                Viewer.activateScene(scene);
            }
            return false;
        });
        
        
        // INLINE SCENE LINKS
        $('[href^="#scene:"]').live('click', function(e) {
            e.preventDefault();
            var href = $(this).attr('href'),
                sceneId = href.substr(href.lastIndexOf(':')+1);
            Viewer.activateScene(sceneId);
            return false;
        });
        
        
        // IMAGE MAPS
        var $tooltip = $('<div id="tooltip"></div>');
        $('body').append($tooltip);
        $('area[title]').each(function() {
            $(this).data('title', $(this).attr('title'));
            $(this).attr('title', '');
        }).live('mouseover', function(e) {
            var text = $(this).data('title');
            if (text && text.length) {
                $tooltip.text(text);
                $tooltip.show();
            }
        }).live('mousemove', function(e) {
            $tooltip.css({
                'left': e.pageX+5,
                'top': e.pageY-10 - $('#tooltip').height()
            });
        }).live('mouseout', function(e) {
            $tooltip.hide();
        });
        
        // LOADING
        Viewer.bind('ready', function(evt) {
            $('#viewer .loading').remove();
            $(window).trigger('resize');
        });
        
        Viewer.bind('loadScenesComplete', function(evt) {
            var scene = $('[data-scene]').data('scene');
            if (scene) {
                Viewer.activateScene(scene);
            }
        });
        
        if (config.debug) Viewer.bind('loadElementsComplete', function(evt, data) {
            console.log('ALL ELEMENTS LOADED.');
        });
        
        if (config.debug) Viewer.bind('loadElementStart', function(evt, data) {
            //console.log('START ELEMENT:', data.id);
        });
        
        if (config.debug) Viewer.bind('loadActivationComplete', function(evt, data) {
            //console.log('FINISHED ACTIVATION:', data.id);
        });
                
        if (config.debug) Viewer.bind('loadActivationsComplete', function(evt, data) {
            //console.log('ALL ACTIVATIONS LOADED.');
        });
        
        var $viewerTooltip = $('<div id="tooltip"></div>');
        $('body').append($viewerTooltip);
        
        Viewer.bind('pickChanged', function(evt, data) {
        	if ( data.id != "none" )
        	{
        		//if (config.debug) console.log(data.id + " " + data.name);
	            $viewerTooltip.text(data.name);
	            $viewerTooltip.css({
	                'left': data.event.x + 10,
	                'top': data.event.y  - 10
	            });
	            
	            $viewerTooltip.show();
        	}
        	else
        	{
        		$viewerTooltip.hide();
        	}
        });
        
        // INIT VIEWER
        window.setTimeout(function() {
            var $vc = $('#viewer-canvas');
            $vc.attr({
                'width': $vc.width(),
                'height': $vc.height()
            });
            
            if (!$('#viewer').is('.deactivated')) Viewer.init({
                'container': '#viewer',
                'canvas': '#viewer-canvas',
                'elements': elements,
                'activations': activations,
                'connections': connections,
                'backgroundColor': config.backgroundColor,
                'scenes': config.scenes
            });
        }, 200);
        
        
        // RESIZING
        $(Viewer).bind('resize', function() {
            var $vc = $('#viewer-canvas'),
                w = $vc.width(),
                h = $vc.height(),
                size = w+'x'+h;
            
            if (Viewer._previousSize && (Viewer._previousSize != size)) {
                $vc.attr({
                    'width': w,
                    'height': h
                });
                Viewer.updateSize();
            }
            
            Viewer._previousSize = size;
        });
        
        $(window).bind('resize', function() {
            $(Viewer).trigger('resize');
        });
        
        
        // HISTORY
        $.support.historyPushState = window.history && history.pushState;
        
        var loadContent = function(url) {
            var $container = $('#content-outer');
            $('#content').addClass('transition-out');
            window.setTimeout(function() {
                $container.load(url + ' #content', function(responseText) {
                    var $resp = $('<div>').append(responseText.replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')),
                        title = $resp.find('title').text(),
                        scene = $resp.find('[data-scene]').data('scene');
                    $container.data('contentReplaced', true);
                    window.setTimeout(function() {
                        var $target;
                        $('#content').removeClass('transition-in');
                        if (location.hash) {
                            $target = $('#'+location.hash.replace('#',''));
                            if ($target.length) {
                                window.setTimeout(function() {
                                    $.scrollTo(location.hash, {'duration': 250});
                                }, 250);
                            }
                        } 
                        if ((!$target || !$target.length) && $('body').scrollTop()) $('html, body').animate({'scrollTop': 0}, 500);
                    }, 0);
                    if (title) {
                        document.title = title;
                    }
                    if (scene) {
                        if (config.debug) console.log('ACTIVATE SCENE:', scene);
                        if (!webglNotSupported) Viewer.activateScene(scene);
                        $('[data-scene]').data('scene', scene);
                    }
                    if (webglNotSupported) {
                        var fallback = $resp.find('#viewer-canvas').html();
                        $('#viewer-fallback').replaceWith(fallback);
                    }
                });
            }, 400);
        };
        
        $('a').live('click', function(e) {
            var $link = $(this),
                href = $link.attr('href');
            if ((this.hostname.replace(/\:\d+$/, '') != location.hostname) || (href.substr(0,1) == '#') || (href.indexOf('/admin/') > -1)) {
                return true;
            }
            e.preventDefault();
            if (location.pathname == href) return;
            if ($.support.historyPushState) {
                history.pushState(null, null, href);
            } else {
                location.hash = '#!' + href;
            }
            loadContent(href);
            return false;
        });
        
        $(window).bind('popstate', function(e) {
            if (!$('#content-outer').data('contentReplaced')) return;
            loadContent(location.pathname);
        });
        
        
        // KEYBOARD SHORTCUTS
        $('a').live('clickflash', function() {
            var $link = $(this);
            $link.addClass('flash flash-transition');
            window.setTimeout(function() {
                $link.removeClass('flash');
            }, 500);
            window.setTimeout(function() {
                $link.removeClass('flash-transition');
            }, 1000);
            $(this).eq(0).trigger('click');
        });
        
        $(document).bind('keypress', function(e) {
            function sliceMove(axis, diff) {
                var $slider = $('#slice' + axis.toUpperCase());
                $slider.val(parseInt($slider.val(), 10)+diff).trigger('change');
            }
            
            switch(e.which) {
                case 99: // c : toggle controls
                    $('a[href="#controls"]').trigger('clickflash');
                    break;
                case 114: // r : reset view
                    $('a[href="#reset-view"]').trigger('clickflash');
                    break;
                case 112: // p : previous
                case 37: // <-
                    $('nav.prev-next a.prev').trigger('clickflash');
                    break;
                case 110: // n : next
                case 39: // ->
                    $('nav.prev-next a.next').trigger('clickflash');
                    break;
                case 105: // i : introduction
                    $('#nav a.intro').trigger('clickflash');
                    break;
                case 116: // t : table of contents
                    $('#nav a.toc').trigger('clickflash');
                    break;
                case 103: // g : glossary
                    $('#nav a.glossary').trigger('clickflash');
                    break;
                case 101: // e : reference list
                    $('#nav a.sources').trigger('clickflash');
                    break;
                case 97: // a : about
                    $('#nav a.about').trigger('clickflash');
                    break;
                case 120: // x
                    sliceMove('x', 1);
                    break;
                case 88: // X
                    sliceMove('x', -1);
                    break;
                case 121: // y
                    sliceMove('y', 1);
                    break;
                case 89: // Y
                    sliceMove('y', -1);
                    break;
                case 122: // z
                    sliceMove('z', 1);
                    break;
                case 90: // Z
                    sliceMove('z', -1);
                    break;
            }
        });
        $(document).bind('keyup', function(e) {
            switch(e.which) {
                case 37: // <- : previous
                    $('nav.prev-next a.prev').trigger('clickflash');
                    break;
                case 39: // -> : next
                    $('nav.prev-next a.next').trigger('clickflash');
                    break;
            }
        });
    });
    
    
    // Methode zum synchronen Abruf von JSON-Daten.
    // (��$.getJSON�� funktioniert asynchron.)
    $.getSyncJSON = function(url, callback) {
        return $.parseJSON(jQuery.ajax({
            'type': 'GET',
            'url': url,
            'success': callback,
            'dataType': 'json',
            'async': false
        }).responseText);
    };
})(jQuery);
