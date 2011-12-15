(function($) {
    // Sobald wir mit dem DOM arbeiten k��nnen, ���
    $(document).ready(function() {
        if (!window.WebGLRenderingContext) {
            $('html').addClass('no-webgl');
        }
        
        // ��� die Konfigurationsdaten und die Elemente per AJAX laden.
        var config = $.getSyncJSON(settings.DATA_URL + 'config.json'),
            elements = $.getSyncJSON(settings.DATA_URL + 'elements.json'),
            activations = $.getSyncJSON(settings.DATA_URL + 'coordinates.json'),
            connections = $.getSyncJSON(settings.DATA_URL + 'connections.json'),
            loadingDiv = $('<div class="loading" />'),
            $elementsTogglesContainer = $('#elements'),
            $activationsTogglesContainer = $('#activations'),
            $controlsTogglesContainer = $('#controls-toggles');
        
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
            if( $('#mriTab').css('display') === "block" ) {
            	$('#mriTab').slideToggle();
            	$('a[href="#textures"]').css('font-weight', 'normal');
            }
            if( $('#elementTab').css('display') === "block" ) {
            	$('#elementTab').slideToggle();
            	$('a[href="#elements"]').css('font-weight', 'normal');
            }
            if( $('#activationTab').css('display') === "block" ) {
            	$('#activationTab').slideToggle();
            	$('a[href="#activations"]').css('font-weight', 'normal');
            }
            if( $('#controlTab1').css('display') != "block" ) {
            	$('#controlTab1').slideToggle();
            	$('a[href="#controls"]').css('font-weight', 'bold');
            }
            return false;
        });
        
        $('a[href="#textures"]').click(function(e) {
            e.preventDefault();
            if( $('#controlTab1').css('display') === "block" ) {
            	$('#controlTab1').slideToggle();
            	$('a[href="#controls"]').css('font-weight', 'normal');
            }
            if( $('#elementTab').css('display') === "block" ) {
            	$('#elementTab').slideToggle();
            	$('a[href="#elements"]').css('font-weight', 'normal');
            }
            if( $('#activationTab').css('display') === "block" ) {
            	$('#activationTab').slideToggle();
            	$('a[href="#activations"]').css('font-weight', 'normal');
            }
            if( $('#mriTab').css('display') != "block" ) {
            	$('#mriTab').slideToggle();
            	$('a[href="#textures"]').css('font-weight', 'bold');
            }
            return false;
        });
        
        $('a[href="#elements"]').click(function(e) {
            e.preventDefault();
            if( $('#controlTab1').css('display') === "block" ) {
            	$('#controlTab1').slideToggle();
            	$('a[href="#controls"]').css('font-weight', 'normal');
            }
            if( $('#mriTab').css('display') === "block" ) {
            	$('#mriTab').slideToggle();
            	$('a[href="#textures"]').css('font-weight', 'normal');
            }
            if( $('#activationTab').css('display') === "block" ) {
            	$('#activationTab').slideToggle();
            	$('a[href="#activations"]').css('font-weight', 'normal');
            }
            if( $('#elementTab').css('display') != "block" ) {
            	$('#elementTab').slideToggle();
            	$('a[href="#elements"]').css('font-weight', 'bold');
            }
            return false;
        });
        
        $('a[href="#activations"]').click(function(e) {
            e.preventDefault();
            if( $('#controlTab1').css('display') === "block" ) {
            	$('#controlTab1').slideToggle();
            	$('a[href="#controls"]').css('font-weight', 'normal');
            }
            if( $('#mriTab').css('display') === "block" ) {
            	$('#mriTab').slideToggle();
            	$('a[href="#textures"]').css('font-weight', 'normal');
            }
            if( $('#elementTab').css('display') === "block" ) {
            	$('#elementTab').slideToggle();
            	$('a[href="#elements"]').css('font-weight', 'normal');
            }
            if( $('#activationTab').css('display') != "block" ) {
            	$('#activationTab').slideToggle();
            	$('a[href="#activations"]').css('font-weight', 'bold');
            }
            return false;
        });
        
        // SLICES
        var sliderChangeHandler = function(method) {
            return function(e) {
            	var value = "";
            	value = $(this).val();
            	if ( $(this).attr('id') === "threshold1" ) {
            		value = parseFloat($(this).val()).toFixed(3);
            		document.getElementById('tn').innerHTML = value;
            	}
            	else if ( $(this).attr('id') === "threshold2" ) {
            		value = parseFloat($(this).val()).toFixed(3);
            		document.getElementById('tp').innerHTML = value;
            	}
            	$(this).parent().find('.value').text(value);
                Viewer[method](value);
            };
        };
        $('#sliceX').bind('change', sliderChangeHandler('setSagittal')).trigger('change');
        $('#sliceY').bind('change', sliderChangeHandler('setCoronal')).trigger('change');
        $('#sliceZ').bind('change', sliderChangeHandler('setAxial')).trigger('change');
        $('#transp').bind('change', sliderChangeHandler('setTransparency')).trigger('change');
        $('#threshold1').bind('change', sliderChangeHandler('setThreshold1')).trigger('change');
        $('#threshold2').bind('change', sliderChangeHandler('setThreshold2')).trigger('change');
        $('#alpha2').bind('change', sliderChangeHandler('setAlpha2')).trigger('change');
        
        
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
        	if (config.debug) console.log('START ELEMENT:', data.id);
        });
        
        if (config.debug) Viewer.bind('loadActivationComplete', function(evt, data) {
        	if (config.debug) console.log('FINISHED ACTIVATION:', data.id);
        });
                
        if (config.debug) Viewer.bind('loadActivationsComplete', function(evt, data) {
        	if (config.debug) console.log('ALL ACTIVATIONS LOADED.');
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
