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
	            if ($.inArray(el.id, config.controlElements) > -1) {
	            	$controlsTogglesContainer.append($toggle);
	            } else {
	            	$elementsTogglesContainer.append($toggle);
	            	$('#elementSelect').append($('<option></option>').val(el.id).html(el.name));
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
        
        Viewer.bind('webglNotSupported', function(evt, data) {
            webglNotSupported = true;
            $('#viewer-canvas').replaceWith($('#viewer-canvas').children());
            $('#viewer .loading').remove();
            $('html').addClass('no-webgl');
        });
        
        Viewer.bind('loadElementComplete', function(evt, data) {
            if (config.debug) console.log('FINISHED ELEMENT:', data.id);
            $('#toggle-' + data.id).removeClass('disabled');
            $('#toggle-' + data.id).toggleClass('active', data.active);
        });
        
        Viewer.bind('elementDisplayChange', function(evt, data) {
        	if (config.debug) console.log('ELEMENT DISPLAY CHANGE:', data.id);
            $('#toggle-' + data.id).toggleClass('active', data.active);
        });
        
        
        // ACTIVATIONS
        /*
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
        */
        Viewer.bind('activationDisplayChange', function(evt, data) {
            $('#toggle-' + data.id).toggleClass('active', data.active);
        });
        
        var activationChangeHandler = function(method) {
            return function(e) {
            	var value = $(this).val();
            	var name = $(this).attr('id');
            	var id = $('#editActivationSelect').val();
            	Viewer[method](id, name, value);
            	$('#editActivationSelect option[value=' + id + ']' ).text($('#acName').val());
        		$('#fromSelect option[value=' + id + ']').text($('#acName').val());
        		$('#toSelect option[value=' + id + ']').text($('#acName').val());
        		$("#label-"+id).html( $('#acName').val() );
            };
        };
        $('#acName').bind('change', activationChangeHandler('changeActivationAttrib'));
        $('#acX').bind('change', activationChangeHandler('changeActivationAttrib'));
        $('#acY').bind('change', activationChangeHandler('changeActivationAttrib'));
        $('#acZ').bind('change', activationChangeHandler('changeActivationAttrib'));
        $('#acSize').bind('change', activationChangeHandler('changeActivationAttrib'));
        $('#acR').bind('change', activationChangeHandler('changeActivationAttrib'));
        $('#acG').bind('change', activationChangeHandler('changeActivationAttrib'));
        $('#acB').bind('change', activationChangeHandler('changeActivationAttrib'));

        $('#newActivation').bind('click',function() {
        	  Viewer.addActivation($('#acName').val(), 
						parseFloat($('#acX').val()), 
						parseFloat($('#acY').val()), 
						parseFloat($('#acZ').val()), 
						parseFloat($('#acSize').val()), 
						parseFloat($('#acR').val()), 
						parseFloat($('#acG').val()), 
						parseFloat($('#acB').val()));
        });
        
        $('#editActivationSelect').bind('click',function() {
        	var el = Viewer.getActivation( $('#editActivationSelect').val() );
        	$('#acName').val( el.name );
    		$('#acX').val( el.coordinates[0] );
    		$('#acY').val( el.coordinates[1] );
    		$('#acZ').val( el.coordinates[2] );
    		$('#acSize').val( el.size );
    		$('#acR').val( el.rgb.r );
    		$('#acG').val( el.rgb.g );
    		$('#acB').val( el.rgb.b );
        });
        
        Viewer.bind('newActivation', function(evt, data) {
        	var $toggle = $('<a />');
            $toggle.append('<span/>');
            var $label = $('<label>'+data.name+'</label>');
            $toggle.append($label);
            $label.attr('id', 'label-' + data.id);
            $toggle.addClass('toggle');
            $toggle.attr('href', '#toggle:' +data.id);
            $toggle.attr('id', 'toggle-' + data.id);
            $toggle.click(function(e) {
                e.preventDefault();
                Viewer.toggleActivation(data.id);
                return false;
            });
            $('#activations').append($toggle);
            
            $('#editActivationSelect').append($('<option></option>').val(data.id).html(data.name));
            $('#fromSelect').append($('<option></option>').val(data.id).html(data.name));
            $('#toSelect').append($('<option></option>').val(data.id).html(data.name));
        });
        
        // CONNECTIONS
        $('#newConnection').bind('click',function() {
        	var color = {"r": parseFloat($('#coR').val()), "g": parseFloat($('#coG').val()), "b": parseFloat($('#coB').val())};
    		var strength = parseFloat($('#coStrength').val());
    		var size = parseFloat($('#coSize').val());
    		var distance = parseFloat($('#coDistance').val());
    		var speed = parseFloat($('#coSpeed').val());
    		var color2 = {"r": parseFloat($('#coR2').val()), "g": parseFloat($('#coG2').val()), "b": parseFloat($('#coB2').val())};
    		var strength2 = parseFloat($('#coStrength2').val());
    		var size2 = parseFloat($('#coSize2').val());
    		var distance2 = parseFloat($('#coDistance2').val());
    		var speed2 = parseFloat($('#coSpeed2').val());
        	Viewer.addConnection( $('#fromSelect').val(),
        						  $('#toSelect').val(),
        						  color, strength, size, distance, speed, 
        						  color2, strength2, size2, distance2, speed2, true
        	);
        });
        
        $('#editConnectionSelect').bind('click',function() {
        	var co = Viewer.getConnection( $('#editConnectionSelect').val() );
    		$('#coR').val( co.color.r );
    		$('#coG').val( co.color.g );
    		$('#coB').val( co.color.b );
    		$('#coStrength').val(  co.strength );
    		$('#coSize').val(  co.size );
    		$('#coDistance').val(  co.distance );
    		$('#coSpeed').val(  co.speed );
    		
    		$('#fromSelect option[value='+ co.fromId + ']').attr('selected', true);
    		$('#toSelect option[value='+ co.toId + ']').attr('selected', true);
    		
    		var co2 = Viewer.getConnection( co.coId );
    		$('#coR2').val( co2.color.r );
    		$('#coG2').val( co2.color.g );
    		$('#coB2').val( co2.color.b );
    		$('#coStrength2').val( co2.strength );
    		$('#coSize2').val(  co2.size );
    		$('#coDistance2').val( co2.distance );
    		$('#coSpeed2').val( co2.speed );
        });
        
        var connectionChangeHandler = function(method) {
            return function(e) {
            	var value = $(this).val();
            	var name = $(this).attr('id');
            	var id = $('#editConnectionSelect').val();
            	Viewer[method](id, name, value);
            };
        };
        $('#coR').bind('change', connectionChangeHandler('changeConnectionAttrib'));
        $('#coG').bind('change', connectionChangeHandler('changeConnectionAttrib'));
        $('#coB').bind('change', connectionChangeHandler('changeConnectionAttrib'));
        $('#coR2').bind('change', connectionChangeHandler('changeConnectionAttrib'));
        $('#coG2').bind('change', connectionChangeHandler('changeConnectionAttrib'));
        $('#coB2').bind('change', connectionChangeHandler('changeConnectionAttrib'));
        $('#coStrength').bind('change', connectionChangeHandler('changeConnectionAttrib'));
        $('#coSize').bind('change', connectionChangeHandler('changeConnectionAttrib'));
        $('#coDistance').bind('change', connectionChangeHandler('changeConnectionAttrib'));
        $('#coSpeed').bind('change', connectionChangeHandler('changeConnectionAttrib'));
        $('#coStrength2').bind('change', connectionChangeHandler('changeConnectionAttrib'));
        $('#coSize2').bind('change', connectionChangeHandler('changeConnectionAttrib'));
        $('#coDistance2').bind('change', connectionChangeHandler('changeConnectionAttrib'));
        $('#coSpeed2').bind('change', connectionChangeHandler('changeConnectionAttrib'));
        
        $('#fromSelect').bind('click',function() {
        	Viewer.changeConnectionAttrib( $('#editConnectionSelect').val(), 'fromId', $('#fromSelect').val() );
        });

        $('#toSelect').bind('click',function() {
        	Viewer.changeConnectionAttrib( $('#editConnectionSelect').val(), 'toId', $('#toSelect').val() );
        });

        Viewer.bind('updateConnection', function(evt, data) {
        	$('#editConnectionSelect option[value=' + data.id + ']' ).text(data.name);
    		$("#label-"+ data.id).html( data.name );
    		$('#editConnectionSelect option[value=' + data.id2 + ']' ).text(data.name2);
    		$("#label-"+ data.id2).html( data.name2 );
        });
        
        Viewer.bind('newConnection', function(evt, data) {
        	var $toggle = $('<a />');
            $toggle.append('<span/>');
            var $label = $('<label>'+data.name+'</label>');
            $toggle.append($label);
            $label.attr('id', 'label-' + data.id);
            $toggle.addClass('toggle');
            $toggle.attr('href', '#toggle:' +data.id);
            $toggle.attr('id', 'toggle-' + data.id);
            $toggle.click(function(e) {
                e.preventDefault();
                Viewer.toggleActivation(data.id);
                return false;
            });
            $('#connections').append($toggle);
            
            $('#editConnectionSelect').append($('<option></option>').val(data.id).html(data.name));
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
        	$button.attr('value', data.id);
        	$button.click(function(e) {
        		Viewer.activateScene(data.id);
        		return false;
        	});
        	$('#sceneButtons').append($button);
        });

        $('#rotate').bind('click',function() {
        	Viewer.autoRotate(parseInt($('#animX').val()), parseInt($('#animY').val()), parseInt($('#animT').val()), parseInt($('#animF').val()) );
        });
        
        $('#save').bind('click',function() {
        	$('#textInput').val( Viewer.saveScene() );
    		
    		var mydomstorage=window.localStorage || (window.globalStorage? globalStorage[location.hostname] : null);
    		if (mydomstorage){
    			mydomstorage.conviewSave = $('#textInput').val();
    		}
    		else{
    		    // Your browser doesn't support DOM Storage unfortunately.
    		}
        });
        
        $('#load').bind('click',function() {
        	$('#activations').empty();
        	$('#connections').empty();
        	var mydomstorage=window.localStorage || (window.globalStorage? globalStorage[location.hostname] : null);
    		if (mydomstorage && mydomstorage.conviewSave && $("#saveLoc").attr("checked") ) {
    			console.log("load from browser storage");
    			Viewer.loadScene(mydomstorage.conviewSave);
    		}
    		else {
    			Viewer.loadScene($('#textInput').val());
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
        	if (config.debug) console.log('ALL ELEMENTS LOADED.');
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
