define( ["./mygl", "io", "./arcball", "./glMatrix-0.9.5.min"], 
		(function(mygl, io, arcball ) { 
			
			
			elements.fibres = {};
			elements.meshes = {};			
//***************************************************************************************************
//
//	definition of global variables
//
//***************************************************************************************************/
var variables = {};

var gl = {};
var shaders = {}; // array storing the loaded shader programs
	
// webgl
variables.webgl = {};
variables.webgl.needsRedraw = false; // flag indicating the scene needs redrawing, only drawing the scene 
variables.webgl.needsRedrawCount = 10; // draw every 10th animation tick even if no interaction happened

variables.webgl.mvMatrix = mat4.create(); // model view matrix
mat4.identity( variables.webgl.mvMatrix );
variables.webgl.pMatrix = mat4.create(); // projection matrix
variables.webgl.lightPos = vec3.create(); // light position

//state of the currently displayed scene
variables.scene = {};
variables.scene.zoom = 1.0;
variables.scene.axial = 80;
variables.scene.coronal = 100;
variables.scene.sagittal = 80;
variables.scene.tex1 = 'tex1';
variables.scene.tex2 = "none"; //"fmri1";
variables.scene.localFibreColor = false;
variables.scene.showSlices = true;
variables.scene.renderTubes = true;
variables.scene.texThreshold1 = 1.0;
variables.scene.texThreshold2 = 1.0;
variables.scene.colormap = 1.0;
variables.scene.texAlpha2 = 1.0;
variables.scene.texInterpolation = true;


//***************************************************************************************************
//
//	init and loading of all the elements
//
//***************************************************************************************************/
function init(opts) {
	variables.config = opts.config;
	
	gl = mygl.gl();
	shaders = mygl.shaderPrograms();
	
	if ('backgroundColor' in opts) {
		gl.clearColor(opts.backgroundColor[0], opts.backgroundColor[1], opts.backgroundColor[2], 0.0);
	} else {
		gl.clearColor(1.0, 1.0, 1.0, 0.0);
	}
	
	resetView();
	
	redraw();
	tick();
}

function tick() {
	requestAnimFrame(tick);
	drawScene();
}

//***************************************************************************************************
//
// main functions that actually draw the entire scene
//
//***************************************************************************************************/
function redraw() {
	variables.webgl.needsRedraw = true;
}

function drawScene() {
	if (!variables.webgl.needsRedraw && variables.webgl.needsRedrawCount > 0 ) {
		variables.webgl.needsRedrawCount -= 1;
		return;
	}
	variables.webgl.needsRedrawCount = 10;
	
	
//	if (!variables.webgl.needsRedraw) {
//		return;
//	}

	variables.webgl.needsRedraw = false;
	
	gl.viewport(0, 0, mygl.viewportWidth(), mygl.viewportHeight());
	gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
	
	var ratio = mygl.viewportWidth() / mygl.viewportHeight();

	if ( ratio >= 1.0 ) {
		mat4.ortho( -100*ratio, 100 * ratio, -100, 100, -500, 500, variables.webgl.pMatrix );	
	}
	else {
		mat4.ortho( -100, 100, -100/ ratio, 100 / ratio, -500, 500, variables.webgl.pMatrix );
	}

	variables.webgl.lightPos[0] = 0.0;
	variables.webgl.lightPos[1] = 0.0;
	variables.webgl.lightPos[2] = -1.0;
	
	variables.webgl.mvMatrix.set( arcball.get() );
	

	gl.enable(gl.DEPTH_TEST);
	
    //***************************************************************************************************
    //
    // draw
    //
    //***************************************************************************************************/

	draw();
	
	//variables.webgl.minorMode = 4;
	//drawSlices();
}
//***************************************************************************************************
//
// function that does all the render calls for transparency
//
//***************************************************************************************************/
function draw() {
	gl.enable(gl.DEPTH_TEST);
	gl.depthFunc(gl.LEQUAL);
    gl.clearDepth(1);
    
    var peels = mygl.peels();
    var peelFramebuffer = mygl.peelFramebuffer();
    //***************************************************************************************************
    //
    // Pass 1 - draw opaque objects
    //
    //***************************************************************************************************/
	variables.webgl.minorMode = 4;
	// set render target to C0
	gl.bindFramebuffer( gl.FRAMEBUFFER, peelFramebuffer );
    gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, peels['C0'], 0);
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

    if ( variables.scene.showSlices ) {
		drawSlices();
	}
	$.each(elements.meshes, function() {
		if (this.display && this.transparency == 1.0 ) {
			drawMesh(this);
		}
	});
	$.each(elements.fibres, function() {
		if (this.display && this.transparency == 1.0 ) {
			drawFibers(this);
		}
	});
	gl.bindFramebuffer(gl.FRAMEBUFFER, null);

	variables.webgl.minorMode = 5;
	// set render target to D0
	gl.bindFramebuffer( gl.FRAMEBUFFER, peelFramebuffer );
    gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, peels['D0'], 0);
    gl.clearColor(0, 0, 0, 0);
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
    
	if ( variables.scene.showSlices ) {
		drawSlices();
	}
	
	$.each(elements.meshes, function() {
		if (this.display && this.transparency == 1.0 ) {
			drawMeshTransp(this);
		}
	});
	$.each(elements.fibres, function() {
		if (this.display && this.transparency == 1.0 ) {
			drawFibersTransp(this);
		}
	});
	gl.bindFramebuffer(gl.FRAMEBUFFER, null);
	
	//***************************************************************************************************
    //
    // Pass 2
    //
    //***************************************************************************************************/
	variables.webgl.minorMode = 9;
	// set render target to C1
	gl.bindFramebuffer( gl.FRAMEBUFFER, peelFramebuffer );
    gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, peels['C1'], 0);
    gl.clearColor(1.0, 1.0, 1.0, 0);
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
	
	$.each(elements.meshes, function() {
		if (this.display && this.transparency < 1.0 ) {
			drawMesh(this);
		}
	});
	$.each(elements.fibres, function() {
		if (this.display && this.transparency < 1.0 ) {
			drawFibers(this);
		}
	});
	gl.bindFramebuffer(gl.FRAMEBUFFER, null);
	
	variables.webgl.minorMode = 6;
	// set render target to D1
	gl.bindFramebuffer( gl.FRAMEBUFFER, peelFramebuffer );
    gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, peels['D1'], 0);
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
	
	$.each(elements.meshes, function() {
		if (this.display && this.transparency < 1.0 ) {
			drawMeshTransp(this);
		}
	});
	$.each(elements.fibres, function() {
		if (this.display && this.transparency < 1.0 ) {
			drawFibersTransp(this);
		}
	});
	gl.bindFramebuffer(gl.FRAMEBUFFER, null);
	
	//***************************************************************************************************
    //
    // Pass 3
    //
    //***************************************************************************************************/
	variables.webgl.minorMode = 10;
	// set render target to C2
	gl.bindFramebuffer( gl.FRAMEBUFFER, peelFramebuffer );
    gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, peels['C2'], 0);
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
	
	$.each(elements.meshes, function() {
		if (this.display && this.transparency < 1.0 ) {
			drawMesh(this);
		}
	});
	$.each(elements.fibres, function() {
		if (this.display && this.transparency < 1.0 ) {
			drawFibers(this);
		}
	});
	gl.bindFramebuffer(gl.FRAMEBUFFER, null);
	
	variables.webgl.minorMode = 7;
	// set render target to D2
	gl.bindFramebuffer( gl.FRAMEBUFFER, peelFramebuffer );
    gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, peels['D2'], 0);
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
	
	$.each(elements.meshes, function() {
		if (this.display && this.transparency < 1.0 ) {
			drawMeshTransp(this);
		}
	});
	$.each(elements.fibres, function() {
		if (this.display && this.transparency < 1.0 ) {
			drawFibersTransp(this);
		}
	});
	gl.bindFramebuffer(gl.FRAMEBUFFER, null);
	
	//***************************************************************************************************
    //
    // Pass 4
    //
    //***************************************************************************************************/
	variables.webgl.minorMode = 11;
	// set render target to C3
	gl.bindFramebuffer( gl.FRAMEBUFFER, peelFramebuffer );
    gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, peels['C3'], 0);
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
	
	$.each(elements.meshes, function() {
		if (this.display && this.transparency < 1.0 ) {
			drawMesh(this);
		}
	});
	$.each(elements.fibres, function() {
		if (this.display && this.transparency < 1.0 ) {
			drawFibers(this);
		}
	});
	gl.bindFramebuffer(gl.FRAMEBUFFER, null);
	
	variables.webgl.minorMode = 8;
	// set render target to D1b
	gl.bindFramebuffer( gl.FRAMEBUFFER, peelFramebuffer );
    gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, peels['D1'], 0);
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
	
	$.each(elements.meshes, function() {
		if (this.display && this.transparency < 1.0 ) {
			drawMeshTransp(this);
		}
	});
	$.each(elements.fibres, function() {
		if (this.display && this.transparency < 1.0 ) {
			drawFibersTransp(this);
		}
	});
	gl.bindFramebuffer(gl.FRAMEBUFFER, null);
	
	//***************************************************************************************************
    //
    // Pass 5
    //
    //***************************************************************************************************/
	variables.webgl.minorMode = 12;
	// set render target to C3
	gl.bindFramebuffer( gl.FRAMEBUFFER, peelFramebuffer );
    gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, peels['D2'], 0);
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
	
	$.each(elements.meshes, function() {
		if (this.display && this.transparency < 1.0 ) {
			drawMesh(this);
		}
	});
	$.each(elements.fibres, function() {
		if (this.display && this.transparency < 1.0 ) {
			drawFibers(this);
		}
	});
	gl.bindFramebuffer(gl.FRAMEBUFFER, null);
	
	
	//***************************************************************************************************
    //
    // Pass 6 - merge previous results and render on quad
    //
    //***************************************************************************************************/	
	gl.useProgram(shaders['merge']);
	gl.enableVertexAttribArray(shaders['merge'].aVertexPosition);
	
	var posBuffer = gl.createBuffer();
	gl.bindBuffer(gl.ARRAY_BUFFER, posBuffer);
	
	var vertices = [ -gl.viewportWidth,  -10,   0, 
	                  gl.viewportWidth,  -10, 0,
	                  gl.viewportWidth,  gl.viewportHeight, 0,
	                 -gl.viewportWidth0, gl.viewportHeight, 0 ];
	
	gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(vertices), gl.STATIC_DRAW);
	gl.vertexAttribPointer(shaders['merge'].aVertexPosition, 3, gl.FLOAT, false, 0, 0);
	gl.uniform2f(shaders['merge'].uCanvasSize, gl.viewportWidth, gl.viewportHeight);
	
	gl.activeTexture( gl.TEXTURE2 );
	gl.bindTexture( gl.TEXTURE_2D, peels['C0'] );
	gl.uniform1i(shaders['merge'].C0, 2);
	
	gl.activeTexture( gl.TEXTURE6 );
	gl.bindTexture( gl.TEXTURE_2D, peels['C1'] );
	gl.uniform1i(shaders['merge'].C1, 6);
	
	gl.activeTexture( gl.TEXTURE7 );
	gl.bindTexture( gl.TEXTURE_2D, peels['C2'] );
	gl.uniform1i(shaders['merge'].C2, 7);
	
	gl.activeTexture( gl.TEXTURE8 );
	gl.bindTexture( gl.TEXTURE_2D, peels['C3'] );
	gl.uniform1i(shaders['merge'].C3, 8);
	
	gl.activeTexture( gl.TEXTURE5 );
	gl.bindTexture( gl.TEXTURE_2D, peels['D2'] );
	gl.uniform1i(shaders['merge'].D2, 5);
	
	var vertexIndexBuffer = gl.createBuffer();
	gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, vertexIndexBuffer);
	var vertexIndices = [ 0, 1, 2, 0, 2, 3 ];
	gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, new Uint16Array(vertexIndices), gl.STATIC_DRAW);

	gl.drawElements(gl.TRIANGLES, 6, gl.UNSIGNED_SHORT, 0);
}



//***************************************************************************************************
//
// draw routines for all available elements
//
//***************************************************************************************************/
function drawSlices() {
	gl.useProgram(shaders['slice']);
	gl.enableVertexAttribArray(shaders['slice'].aVertexPosition);
	gl.enableVertexAttribArray(shaders['slice'].aTextureCoord);

	// initialize the secondary texture with an empty one
	gl.activeTexture(gl.TEXTURE1);
	gl.bindTexture(gl.TEXTURE_2D, null);
	gl.uniform1i(shaders['slice'].uSampler1, 1);
	gl.uniform1i(shaders['slice'].uColorMap,0);
	gl.uniform1f(shaders['slice'].uMin, 0);
	gl.uniform1f(shaders['slice'].uMax, 0);
	gl.uniform1f(shaders['slice'].uThreshold1, 0);
	gl.uniform1f(shaders['slice'].uThreshold2, 0);
	
	var axialPosBuffer = gl.createBuffer();
	gl.bindBuffer(gl.ARRAY_BUFFER, axialPosBuffer);
	var ap = variables.scene.axial + 0.5;
	var vertices = [ 0,   0,   ap, 0.0, 0.0, 
	                 256, 0.5, ap, 1.0, 0.0,
	                 256, 256, ap, 1.0, 1.0,
	                 0,   256, ap, 0.0, 1.0 ];
	
	gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(vertices), gl.STATIC_DRAW);

	gl.vertexAttribPointer(shaders['slice'].aVertexPosition, 3, gl.FLOAT, false, 20, 0);
	gl.vertexAttribPointer(shaders['slice'].aTextureCoord, 2, gl.FLOAT, false, 20, 12);
	
	var axialVertexIndexBuffer = gl.createBuffer();
	gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, axialVertexIndexBuffer);
	var vertexIndices = [ 0, 1, 2, 0, 2, 3 ];
	gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, new Uint16Array(vertexIndices), gl.STATIC_DRAW);

	gl.activeTexture(gl.TEXTURE0);
	gl.bindTexture(gl.TEXTURE_2D, io.getTexture(variables.scene.tex1, 'axial', variables.scene.axial));
	gl.uniform1i(shaders['slice'].uSampler, 0);
	gl.uniform1i(shaders['slice'].uMinorMode, variables.webgl.minorMode );

	if (variables.scene.tex2 != "none") {
		gl.activeTexture(gl.TEXTURE1);
		gl.bindTexture(gl.TEXTURE_2D, io.getTexture(variables.scene.tex2, 'axial', variables.scene.axial));
		gl.uniform1i(shaders['slice'].uSampler1, 1);
		gl.uniform1i(shaders['slice'].uColorMap,variables.scene.colormap);
		gl.uniform1f(shaders['slice'].uMin, elements.niftiis[variables.scene.tex2].getMin() );
		gl.uniform1f(shaders['slice'].uMax, elements.niftiis[variables.scene.tex2].getMax() );
		gl.uniform1f(shaders['slice'].uThreshold1, variables.scene.texThreshold1);
		gl.uniform1f(shaders['slice'].uThreshold2, variables.scene.texThreshold2);
		gl.uniform1f(shaders['slice'].uAlpha2, variables.scene.texAlpha2);
	}

	gl.uniformMatrix4fv(shaders['slice'].uPMatrix, false, variables.webgl.pMatrix);
	gl.uniformMatrix4fv(shaders['slice'].uMVMatrix, false, variables.webgl.mvMatrix);

	gl.drawElements(gl.TRIANGLES, 6, gl.UNSIGNED_SHORT, 0);


	var coronalPosBuffer = gl.createBuffer();
	gl.bindBuffer(gl.ARRAY_BUFFER, coronalPosBuffer);
	var cp = variables.scene.coronal + 0.5;
	var vertices = [ 0,   cp, 0,   0.0, 0.0,
	                 256, cp, 0,   1.0, 0.0,
	                 256, cp, 256, 1.0, 1.0,
	                 0,   cp, 256, 0.0, 1.0];
	
	gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(vertices), gl.STATIC_DRAW);
	
	gl.vertexAttribPointer(shaders['slice'].aVertexPosition, 3, gl.FLOAT, false, 20, 0);
	gl.vertexAttribPointer(shaders['slice'].aTextureCoord, 2, gl.FLOAT, false, 20, 12);

	var coronalVertexIndexBuffer = gl.createBuffer();
	gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, coronalVertexIndexBuffer);
	var vertexIndices = [ 0, 1, 2, 0, 2, 3 ];
	gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, new Uint16Array(vertexIndices), gl.STATIC_DRAW);

	gl.activeTexture(gl.TEXTURE0);
	gl.bindTexture(gl.TEXTURE_2D, io.getTexture(variables.scene.tex1, 'coronal', variables.scene.coronal));
	gl.uniform1i(shaders['slice'].sampler, 0);

	if (variables.scene.tex2 != "none") {
		gl.activeTexture(gl.TEXTURE1);
		gl.bindTexture(gl.TEXTURE_2D, io.getTexture(variables.scene.tex2, 'coronal', variables.scene.coronal));
		gl.uniform1i(shaders['slice'].uSampler1, 1);
	}

	gl.drawElements(gl.TRIANGLES, 6, gl.UNSIGNED_SHORT, 0);

	
	var sagittalPosBuffer = gl.createBuffer();
	gl.bindBuffer(gl.ARRAY_BUFFER, sagittalPosBuffer);
	var sp = variables.scene.sagittal + 0.5;
	var vertices = [ sp, 0,   0,   0.0, 0.0,
	                 sp, 0,   256, 0.0, 1.0,
	                 sp, 256, 256, 1.0, 1.0,
	                 sp, 256, 0,   1.0, 0.0 ];
	gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(vertices), gl.STATIC_DRAW);

	gl.vertexAttribPointer(shaders['slice'].aVertexPosition, 3, gl.FLOAT, false, 20, 0);
	gl.vertexAttribPointer(shaders['slice'].aTextureCoord, 2, gl.FLOAT, false, 20, 12);

	var sagittalVertexIndexBuffer = gl.createBuffer();
	gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, sagittalVertexIndexBuffer);
	var vertexIndices = [ 0, 1, 2, 0, 2, 3 ];
	gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, new Uint16Array(vertexIndices), gl.STATIC_DRAW);

	gl.activeTexture(gl.TEXTURE0);
	gl.bindTexture(gl.TEXTURE_2D, io.getTexture(variables.scene.tex1, 'sagittal', variables.scene.sagittal));
	gl.uniform1i(shaders['slice'].sampler, 0);

	if (variables.scene.tex2 != "none") {
		gl.activeTexture(gl.TEXTURE1);
		gl.bindTexture(gl.TEXTURE_2D, io.getTexture(variables.scene.tex2, 'sagittal', variables.scene.sagittal));
		gl.uniform1i(shaders['slice'].uSampler1, 1);
	}

	gl.drawElements(gl.TRIANGLES, 6, gl.UNSIGNED_SHORT, 0);


	gl.bindBuffer(gl.ARRAY_BUFFER, null);
	gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, null);
}




//***************************************************************************************************
//
// helper functions
//
//***************************************************************************************************/
function resetView() {
	arcball.setViewportDims( mygl.viewportWidth(), mygl.viewportHeight() );
	arcball.setZoom( 1.0 );

	redraw();
}

//***************************************************************************************************
//
// public functions, getters and setters
//
//***************************************************************************************************/
return {
	'init' : init,
	'redraw' : redraw,
	'resetView' : resetView
};
}));

