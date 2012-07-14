(function($) {
    // Sobald wir mit dem DOM arbeiten können,
    $(document).ready(function() {
        if (!window.WebGLRenderingContext) {
            $('html').addClass('no-webgl');
        }
        
        // die Konfigurationsdaten und die Elemente per AJAX laden.
        var config = $.getSyncJSON(settings.DATA_URL + 'config.json'),
            elements = $.getSyncJSON(settings.DATA_URL + 'elements.json'),
            scenes = $.getSyncJSON(settings.DATA_URL + 'scenes.json'),
            loadingDiv = $('<div class="loading" />');
        
        // LOADING
        $('#viewer').append(loadingDiv);
        
        //**********************************************************************************************************
        //*
        //*  tabbed menu left side
        //*
        //**********************************************************************************************************
        
        // controls tab
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
            if( $('#infoTab').css('display') === "block" ) {
            	$('#infoTab').slideToggle();
            	$('a[href="#info"]').css('font-weight', 'normal');
            }
            if( $('#controlTab1').css('display') != "block" ) {
            	$('#controlTab1').slideToggle();
            	$('a[href="#controls"]').css('font-weight', 'bold');
            }
            return false;
        });
        
        // MRI tab
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
            if( $('#infoTab').css('display') === "block" ) {
            	$('#infoTab').slideToggle();
            	$('a[href="#info"]').css('font-weight', 'normal');
            }
            if( $('#mriTab').css('display') != "block" ) {
            	$('#mriTab').slideToggle();
            	$('a[href="#textures"]').css('font-weight', 'bold');
            }
            return false;
        });
        
        // elements tab
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
            if( $('#infoTab').css('display') === "block" ) {
            	$('#infoTab').slideToggle();
            	$('a[href="#info"]').css('font-weight', 'normal');
            }
            if( $('#elementTab').css('display') != "block" ) {
            	$('#elementTab').slideToggle();
            	$('a[href="#elements"]').css('font-weight', 'bold');
            }
            return false;
        });
        
        // activation tab
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
            if( $('#infoTab').css('display') === "block" ) {
            	$('#infoTab').slideToggle();
            	$('a[href="#info"]').css('font-weight', 'normal');
            }
            return false;
        });
        
     // info tab
        $('a[href="#info"]').click(function(e) {
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
            if( $('#infoTab').css('display') != "block" ) {
            	$('#infoTab').slideToggle();
            	$('a[href="#info"]').css('font-weight', 'bold');
            }
            return false;
        });
        
        //**********************************************************************************************************
        //*
        //* mri tab  
        //*
        //**********************************************************************************************************
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
            	else if ( $(this).attr('id') === "alpha2" ) {
            		value = parseFloat($(this).val()).toFixed(3);
            		document.getElementById('texAlpha').innerHTML = value;
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
        
        $('#textureSelect').bind('change',function() {
        	Viewer.changeTexture( $('#textureSelect').val() );
        });
        
        $('#textureSelect2').bind('change',function() {
        	Viewer.changeTexture2( $('#textureSelect2').val() );
        });
        
        $('#colormapSelect').bind('change',function() {
        	Viewer.changeColormap( $('#colormapSelect').val() );
        });
        
        Viewer.bind('colormapChanged', function(evt, data) {
        	$('#colormapSelect option[value='+ data.id + ']').attr('selected', true);
        	$('#threshold1').attr('min', data.t1min );
        	$('#threshold1').attr('max', data.t1max );
        	$('#threshold1').attr('step', data.t1step );
        	$('#threshold2').attr('min', data.t2min );
        	$('#threshold2').attr('max', data.t2max );
        	$('#threshold2').attr('step', data.t2step );
        });
        
        Viewer.bind('loadTexture', function(evt, data) {
        	$('#textureSelect').append($('<option></option>').val(data.id).html(data.name));
        	$('#textureSelect2').append($('<option></option>').val(data.id).html(data.name));
        });

        //**********************************************************************************************************
        //*
        //*  elements tab	
        //*
        //**********************************************************************************************************
        Viewer.bind('loadElementComplete', function(evt, data) {
            if (config.debug) console.log('FINISHED ELEMENT:', data.id);
            $('#toggle-' + data.id).removeClass('disabled');
            $('#toggle-' + data.id).toggleClass('active', data.active);
        });
        
        Viewer.bind('elementDisplayChange', function(evt, data) {
        	if (config.debug) console.log('ELEMENT DISPLAY CHANGE:', data.id);
            $('#toggle-' + data.id).toggleClass('active', data.active);
        });
        
        if (config.debug) Viewer.bind('loadElementStart', function(evt, data) {
        	//if (config.debug) console.log('START ELEMENT:', data.id);
        	if ( data.type != "texture") {
	            var $toggle = $('<a />');
	            $toggle.append('<span/>');
	            $toggle.append('<label>'+data.name+'</label>');
	            $toggle.addClass('toggle');
	            $toggle.addClass('disabled');
	            $toggle.attr('href', '#toggle:' + data.id);
	            $toggle.attr('id', 'toggle-' + data.id);
	            $toggle.click(function(e) {
	                e.preventDefault();
	                Viewer.toggleElement(data.id);
	                return false;
	            });
	            
            	$('#elements').append($toggle);
            	if ( data.type === 'mesh' || data.type === 'fibre' ) {
            		$('#elementSelect').append($('<option></option>').val(data.id).html(data.name));
            	}
        	}
        });
        
        $('#elementSelect').change( function() { 
        	$('#elementAlpha').val( Viewer.getElementAlpha( $('#elementSelect option:selected').val() ) * 100 );
        });
        
        var elementAlphaHandler = function() {
            return function(e) {
            	Viewer.setElementAlpha( $('#elementSelect option:selected').val(), $('#elementAlpha').val() / 100 );
            };
        };
        
        $('#elementAlpha').bind('change', elementAlphaHandler() ).trigger('change');
        
        //**********************************************************************************************************
        //*
        //*  controls tab
        //*
        
        $('#button_localFiberColor').bind('click',function() { Viewer.control('fibreColor'); });
        $('#button_textureInterpolation').bind('click',function() { Viewer.control('fibreTubes'); });
        $('#button_toggleSlices').bind('click',function() { Viewer.control('slices'); });
        $('#button_toggleTooltips').bind('click',function() { Viewer.control('tooltips'); });
        $('#button_interpolate').bind('click',function() { Viewer.control('interpolation'); });
        
        $('#button_left').bind('click',function() { Viewer.control('setViewLeft'); });
        $('#button_axial').bind('click',function() { Viewer.control('setViewAxial'); });
        $('#button_coronal').bind('click',function() { Viewer.control('setViewCoronal'); });
        
        $('#interpolate').bind('click',function() { Viewer.control('interpolation'); });
        
        //**********************************************************************************************************
        //*
        //*  controls tab
        //*
        //**********************************************************************************************************

        
        
        Viewer.bind('webglNotSupported', function(evt, data) {
            webglNotSupported = true;
            $('#viewer-canvas').replaceWith($('#viewer-canvas').children());
            $('#viewer .loading').remove();
            $('html').addClass('no-webgl');
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
            
            $('#textureSelect option[value='+ data.tex1 + ']').attr('selected', true);
            $('#textureSelect2 option[value='+ data.tex2 + ']').attr('selected', true);
        });
        
        Viewer.bind('loadSceneComplete', function(evt, data) {
    		var $button = $('<input type="button" />');
        	$button.attr('id', 'scenebutton-' + data.id);
        	$button.attr('value', data.name);
        	if ( !data.isView === true ) {
	        	$button.click(function(e) {
	        		Viewer.activateScene(data.id);
	        		return false;
	        	});
	        	$('#sceneButtons').append($button);
        	}
        	else {
	        	$button.click(function(e) {
	        		Viewer.activateView(data.id);
	        		return false;
	        	});
	        	$('#viewButtons').append($button);
        	}
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
        	$('#status').css('display', 'none');
        	$(Viewer).trigger('resize');
        	if (config.debug) console.log('ALL ELEMENTS LOADED.');
        });
        
        if (config.debug) Viewer.bind('loadActivationComplete', function(evt, data) {
        	//if (config.debug) console.log('FINISHED ACTIVATION:', data.id);
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
                'backgroundColor': config.backgroundColor,
                'scenes': scenes
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
                Viewer.control('updateSize');
            }
            
            Viewer._previousSize = size;
        });
        
        $(window).bind('resize', function() {
            var size = Math.min( $(document).height() - 20, $(document).width() - 400 );
            $('#viewer').height( size );
            $('#viewer').width( size );
            $('#viewer-canvas').height( size );
            $('#viewer-canvas').width( size );
            $(Viewer).trigger('resize');
        });
        
        $(document).bind('keypress', function(e) {
            function sliceMove(axis, diff) {
                var $slider = $('#slice' + axis.toUpperCase());
                $slider.val(parseInt($slider.val(), 10)+diff).trigger('change');
            }
            
            switch(e.which) {
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
    // ($.getJSON funktioniert asynchron.)
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
