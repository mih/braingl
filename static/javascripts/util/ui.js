require(["jquery", "mousewheel", "./gfx/mygl", "./gfx/viewer", "./gfx/arcball"], 
		function($, mousewheel, mygl, viewer, arcball ) {
	
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
var leftClickX = 0;
var leftClickY = 0;
var midClickX = 0;
var midClickY = 0;
    
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
		//mat4.set(variables.webgl.thisRot, variables.webgl.lastRot);
		arcball.click(e.fixedX, e.fixedY);
		leftClickX = e.fixedX;
		leftClickY = e.fixedY;
		leftDown = true;
	} else if (e.which == 2) {
		middleDown = true;
		midClickX = e.fixedX;
		midClickY = e.fixedY;
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
	var xMult = 1.0; //game.board().width / mygl.viewportWidth();
	var yMult = 1.0; //game.board().height / mygl.viewportHeight();
	
	if (leftDown) {
		arcball.drag(e.fixedX, e.fixedY);
		
		leftClickX = e.fixedX;
		leftClickY = e.fixedY;
	} 
	else if (middleDown) {
		midClickX = e.fixedX;
		midClickY = e.fixedY;
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
	
$(document).bind('keypress', function(e) {
    //console.log( "key # " + e.which);
    switch(e.which) {
        case 32: // Spacebar
            viewer.resetView();
            break;
	}
});
	
});