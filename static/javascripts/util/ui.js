define(["jquery", "mousewheel", "io", "./gfx/mygl", "./gfx/viewer", "./gfx/arcball", "./gfx/scene"], 
		function($, mousewheel, io, mygl, viewer, arcball, scene ) {
	
//***************************************************************************************************
//
// resizing
//
//***************************************************************************************************/
$(window).bind('resize', function() {
    $('#viewer-div').height( $(document).height() - 10 );
    $('#viewer-div').width( $(document).width() - ( $('#links').width() +  25 ) );
    var $vc = $('#viewer-canvas');
    $vc.height( $('#viewer-div').height() );
    $vc.width( $('#viewer-div').width() );
    
    w = $vc.width(),
    h = $vc.height(),
    $vc.attr({
        'width': w,
        'height': h
    });
    
    mygl.resizeGL( $vc );
    arcball.setViewportDims(mygl.viewportWidth(), mygl.viewportHeight() );

	viewer.redraw();
});	
	
	
	
//***************************************************************************************************
//
// everything mouse related
//
//***************************************************************************************************/
var leftDown = false;
var middleDown = false;
    
function fixupMouse(event) {
	event = event || window.event;

	var e = {
		event : event,
		target : event.target ? event.target : event.srcElement,
		which : event.which ? event.which : event.button === 1 ? 1 : event.button === 2 ? 3 : event.button === 4 ? 2 : 1,
		x : event[0] ? event[0] : event.clientX,
		y : event[1] ? event[1] : event.clientY,
	};
	
	if (event.offsetX) {
		// chrome case, should work
		e.fixedX = event.offsetX;
		e.fixedY = event.offsetY;
	} else {
		e.fixedX = e.x - findPosX($('#viewer-canvas').get(0) );
		e.fixedY = e.y - findPosY($('#viewer-canvas').get(0) );
	}
	return e;
}

function findPosX(obj) {
	var curleft = 0;
	if (obj.offsetParent)
		while (1) {
			curleft += obj.offsetLeft;
			if (!obj.offsetParent)
				break;
			obj = obj.offsetParent;
		}
	else if (obj.x)
		curleft += obj.x;
	return curleft;
}

function findPosY(obj) {
	var curtop = 0;
	if (obj.offsetParent)
		while (1) {
			curtop += obj.offsetTop;
			if (!obj.offsetParent)
				break;
			obj = obj.offsetParent;
		}
	else if (obj.y)
		curtop += obj.y;
	return curtop;
}

$('#viewer-canvas').mousedown( function (event) {
	e = fixupMouse(event);
	if (e.which == 1) {
		arcball.click(e.fixedX, e.fixedY);
		leftDown = true;
	} else if (e.which == 2) {
		middleDown = true;
		arcball.midClick(e.fixedX, e.fixedY);
	}
	event.preventDefault();
	viewer.redraw();
});

$('#viewer-canvas').mouseup( function (event) {
	e = fixupMouse(event);
	if (e.which == 1) {
		leftDown = false;
	} else if (e.which == 2) {
		middleDown = false;
	}
	event.preventDefault();
	viewer.redraw();
});

$('#viewer-canvas').mousemove( function (event) {
	e = fixupMouse(event);
	if (leftDown) {
		arcball.drag(e.fixedX, e.fixedY);
	} 
	else if (middleDown) {
		arcball.midDrag(e.fixedX, e.fixedY);
	}
	event.preventDefault();
	viewer.redraw();
});

$('#viewer-canvas').on("mousewheel", function(event, delta, deltaX, deltaY) {
    if (middleDown) {
		return;
	}
	if (delta < 0) {
		arcball.zoomIn();
	}
	else {
		arcball.zoomOut();
	}

	viewer.redraw();
});

//***************************************************************************************************
//
// keyboard functions
//
//***************************************************************************************************/
$(document).bind('keypress', function(e) {
    console.log( "key # " + e.which);
    switch(e.which) {
        case 32: // Spacebar
            viewer.resetView();
            break;
	}
});

//***************************************************************************************************
//
// callbacks for element loading, create controls
//
//***************************************************************************************************/
function addElementToUI ( el ) {
	console.log( 'start loading ' + el.id );
	if ( el.type == 'tex' ) {
		$('#textureSelect').append($('<option></option>').val(el.id).html(el.name));
		$('#textureSelect2').append($('<option></option>').val(el.id).html(el.name));
	}
	else if ( el.type != 'tex') {
        var $toggle = $('<a />');
        $toggle.append('<span/>');
        $toggle.append('<label>'+el.name+'</label>');
        $toggle.addClass('toggle');
        $toggle.addClass('disabled');
        $toggle.attr('href', '#toggle:' + el.id);
        $toggle.attr('id', 'toggle-' + el.id);
        $toggle.click(function(e) {
            e.preventDefault();
            scene.toggleElement(el.id, toggleCallback );
            return false;
        });
        
    	$('#elements').append($toggle);
    	if ( el.type === 'mesh' || el.type === 'fibre' ) {
    		$('#elementSelect').append($('<option></option>').val(el.id).html(el.name));
    	}
	}
}

function toggleCallback (id, active) {
	 $('#toggle-' + id).toggleClass('active', active);
}

function loadElementStart( el ) {
	addElementToUI( el );
}

function elementLoaded( el ) {
	console.log( 'finished loading ' + el.id );
	$('#toggle-' + el.id).removeClass('disabled');
    $('#toggle-' + el.id).toggleClass('active', el.display);
}
function allElementsLoaded() {
	console.log( 'all elements loaded' );
	scene.setValue('loadingComplete', true );
} 


//***************************************************************************************************
//
// bind controls
//
//***************************************************************************************************/
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
var sliderChangeHandler = function(property) {
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
    	scene.setValue( property, parseFloat(value) );
    };
};
$('#sliceX').bind('change', sliderChangeHandler('sagittal')).trigger('change');
$('#sliceY').bind('change', sliderChangeHandler('coronal')).trigger('change');
$('#sliceZ').bind('change', sliderChangeHandler('axial')).trigger('change');
$('#transp').bind('change', sliderChangeHandler('transparency')).trigger('change');
$('#threshold1').bind('change', sliderChangeHandler('threshold1')).trigger('change');
$('#threshold2').bind('change', sliderChangeHandler('threshold2')).trigger('change');
$('#alpha2').bind('change', sliderChangeHandler('alpha2')).trigger('change');

$('#textureSelect').bind('change',function() {
	scene.setValue('tex1', $('#textureSelect').val() );
	$('#sliceX').attr('max', io.niftiis()[$('#textureSelect').val()].getDims()[0] );
	$('#sliceY').attr('max', io.niftiis()[$('#textureSelect').val()].getDims()[1] );
	$('#sliceZ').attr('max', io.niftiis()[$('#textureSelect').val()].getDims()[2] );
});

$('#textureSelect2').bind('change',function() {
	scene.setValue('tex2', $('#textureSelect2').val() );
	scene.getColormapValues( true, setColormapValues );
});

$('#colormapSelect').bind('change',function() {
	scene.setValue('colormap', $('#colormapSelect').val() );
	scene.getColormapValues( false, setColormapValues );
});

function setColormapValues( data ) {
	$('#colormapSelect option[value='+ data.id + ']').attr('selected', true);
	$('#threshold1').attr('min', data.t1min );
	$('#threshold1').attr('max', data.t1max );
	$('#threshold1').attr('step', data.t1step );
	$('#threshold2').attr('min', data.t2min );
	$('#threshold2').attr('max', data.t2max );
	$('#threshold2').attr('step', data.t2step );
};

$('#interpolate').bind('click',function() { io.setTexInterpolation( $('#textureSelect').val(), $('#interpolate').attr('checked')?true:false ); });


//**********************************************************************************************************
//*
//* return visible functions  
//*
//**********************************************************************************************************
return {
	loadElementStart: loadElementStart,
	elementLoaded : elementLoaded, 
	allElementsLoaded : allElementsLoaded 
};


});