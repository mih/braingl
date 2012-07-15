var elements = {}; // set of loaded triangle meshes and fiber bundles

elements.fibres = {};
elements.meshes = {};
elements.niftiis = {};
elements.textures = {};
elements.texIds = [];

var scenes = {};
var variables = {};

var Viewer = (function() {
//***************************************************************************************************
//
//	definition of global variables
//
//***************************************************************************************************/
var canvas = {}; // = document.getElementById("viewer-canvas"); // id of canvas in the DOM
var $canvas = {}; // jQuery object of the canvas element
var gl = {}; // stores the webgl context

var shaders = {}; // set storing the shaders
var shaderPrograms = {}; // array storing the loaded shader programs

// webgl
variables.webgl = {};
variables.webgl.needsRedraw = false; // flag indicating the scene needs redrawing, only drawing the scene 
									 // when something changed to reduces cpu usage
variables.webgl.preloadTextures; // stores the preload textures interval for clearinterval()
variables.webgl.preloadCounterAxial = 1; // 
variables.webgl.preloadCounterCoronal = 1; //
variables.webgl.lastRot = mat4.create(); // accumulates the rotations from the arcball
mat4.identity(variables.webgl.lastRot);
variables.webgl.thisRot = mat4.create(); // current rotation matrix
mat4.identity(variables.webgl.thisRot);
variables.webgl.mvMatrix = mat4.create(); // model view matrix
variables.webgl.pMatrix = mat4.create(); // projection matrix
variables.webgl.nMatrix = mat3.create(); // normal matrix
mat4.rotateX(variables.webgl.thisRot, 2.0);
mat4.rotateY(variables.webgl.thisRot, -2.2);
mat4.rotateZ(variables.webgl.thisRot, 0.2);
variables.webgl.rttFrameBuffer; // framebuffer for offscreen rendering
variables.webgl.rttTexture; // texture to render into
variables.webgl.lightPos = vec3.create(); // light position
variables.webgl.minorMode = 0;
variables.webgl.peelInitialized = false;

// mouse interaction
variables.mouse = {};
variables.mouse.leftDown = false;
variables.mouse.middleDown = false;
variables.mouse.midClickX = 0;
variables.mouse.midClickY = 0;
variables.mouse.screenMoveX = 0;
variables.mouse.screenMoveY = 0;
variables.mouse.screenMoveXold = 0;
variables.mouse.screenMoveYold = 0;

// state of the currently displayed scene
variables.scene = {};
variables.scene.zoom = 1.0;
variables.scene.axial = 80;
variables.scene.coronal = 100;
variables.scene.sagittal = 80;
variables.scene.tex1 = 'none';
variables.scene.tex2 = "none"; //"fmri1";
variables.scene.localFibreColor = false;
variables.scene.showSlices = true;
variables.scene.renderTubes = true;
variables.scene.texThreshold1 = 1.0;
variables.scene.texThreshold2 = 1.0;
variables.scene.colormap = 1.0;
variables.scene.texAlpha2 = 1.0;
variables.scene.texInterpolation = true;
		
// picking
variables.picking = {};
variables.picking.pickIndex = 1; // starting index for pick colors
variables.picking.pickArray = {};
variables.picking.pickMode = false;
variables.picking.oldPick = "none";
variables.picking.showTooltips = false;

// smooth transition mechanism 
variables.transition = {};
variables.transition.nextRot;
variables.transition.quatOldRot;
variables.transition.quatNextRot;
variables.transition.step = 0;
variables.transition.rotateInterval;
variables.transition.zoomOld;
variables.transition.zoomNext;
variables.transition.screenMoveXNext;
variables.transition.screenMoveYNext;
variables.transition.transitionOngoing = false;

//***************************************************************************************************
//
//	init and loading of all the elements
//
//***************************************************************************************************/
function init(opts) {
	$canvas = $(opts.canvas);
	canvas = $canvas[0];
	
	variables.config = opts.config;
	
	$(Viewer).bind('loadElementsComplete', function(event) {
		// wenn alle Elemente geladen wurden, soll der ready-Event gefeuert werden.
		$(Viewer).trigger('ready');
		redraw();
	});
	
	// hier wird der eigentliche WebGL-Viewer initialisiert 
	try {
		initGL(canvas);
	} catch (e) {
		$(Viewer).trigger('webglNotSupported', e);
		return;
	}
	Arcball.set_win_size($canvas.width(), $canvas.height());
	loadShaders();

	if ('backgroundColor' in opts) {
		gl.clearColor(opts.backgroundColor[0], opts.backgroundColor[1], opts.backgroundColor[2], 0.0);
	} else {
		gl.clearColor(1.0, 1.0, 1.0, 0.0);
	}


	if ('elements' in opts && opts.elements.length) {
		loadElements(opts.elements);
	}

	loadScenes();
	
	addSphere( "s1", "sphere1", 50, 50, 50, 15, 1.0, 0, 0, 1.0 );
	addSphere( "s2", "sphere2", 50, 70, 50, 20, 0.0, 1.0, 0, 0.3 );
	addSphere( "s3", "sphere3", 50, 50, 70, 20, 0.0, 0, 1.0, 0.3 );
	addSphere( "s4", "sphere4", 50, 60, 60, 20, 1.0, 1.0, 0, 0.3 );
	addSphere( "s5", "sphere5", 50, 70, 70, 20, 1.0, 0, 1.0, 0.3 );
	
	canvas.onmousedown = handleMouseDown;
	canvas.onmouseup = handleMouseUp;
	canvas.onmousemove = handleMouseMove;
	canvas.addEventListener('DOMMouseScroll', handleMouseWheel, false);
	canvas.addEventListener('mousewheel', handleMouseWheel, false);

	redraw();
	tick();
}

function tick() {
	requestAnimFrame(tick);
	drawScene();
}

//***************************************************************************************************
//
//	init webgl
//
//***************************************************************************************************/
var peels = {C0:null, D0:null, D1:null, D2:null, C1:null, C2:null, C3:null, EXTENT_TEXTURE:null};
var textureN = {C0:gl.TEXTURE2, D0:gl.TEXTURE3, D1:gl.TEXTURE4, D2:gl.TEXTURE5,
                                   C1:gl.TEXTURE6, C2:gl.TEXTURE7, C3:gl.TEXTURE8, 
                                   EXTENT_TEXTURE:gl.TEXTURE9};

var peelFramebuffer = null;
var peelRenderbuffer = null;
var sizeMult = 1;

function initGL(canvas) {
	//gl = WebGLDebugUtils.makeDebugContext(canvas.getContext("experimental-webgl"));
	gl = canvas.getContext("experimental-webgl", {preserveDrawingBuffer: true});
	gl.viewportWidth = $canvas.width();
	gl.viewportHeight = $canvas.height();
}

function initPeel() {
	for (var T in peels) {
        makeTexture(T); 
	}
	
	peelFramebuffer = gl.createFramebuffer();
    gl.bindFramebuffer(gl.FRAMEBUFFER, peelFramebuffer);

    peelRenderbuffer = gl.createRenderbuffer(); // create depth buffer
    gl.bindRenderbuffer(gl.RENDERBUFFER, peelRenderbuffer);
    gl.renderbufferStorage(gl.RENDERBUFFER, gl.DEPTH_COMPONENT16, sizeMult * gl.viewportWidth, sizeMult * gl.viewportHeight);
    gl.framebufferRenderbuffer(gl.FRAMEBUFFER, gl.DEPTH_ATTACHMENT, gl.RENDERBUFFER, peelRenderbuffer);
    
    gl.bindRenderbuffer(gl.RENDERBUFFER, null);
    gl.bindFramebuffer(gl.FRAMEBUFFER, null);
}

function makeTexture(T) {
    peels[T] = gl.createTexture();
    gl.bindTexture(gl.TEXTURE_2D, peels[T]);
    
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
    
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, sizeMult * gl.viewportWidth, sizeMult * gl.viewportHeight, 0, gl.RGBA, gl.UNSIGNED_BYTE, null);
    gl.bindTexture(gl.TEXTURE_2D, null);
}

// ***************************************************************************************************
//
// functions for smooth transitions between scenes
//
// ***************************************************************************************************/
function activateScene(id) {
	
}


function activateView(id) {

}


//***************************************************************************************************
//
//	shader management
//
//***************************************************************************************************/
function loadShaders() {
	getShader('mesh', 'vs');
	getShader('mesh', 'fs');
	getShader('fibre_t', 'vs');
	getShader('fibre_t', 'fs');
	getShader('fibre_t_transp', 'vs');
	getShader('fibre_t_transp', 'fs');
	
	getShader('fibre_l', 'vs');
	getShader('fibre_l', 'fs');
	getShader('fibre_l_transp', 'vs');
	getShader('fibre_l_transp', 'fs');
	getShader('slice', 'vs');
	getShader('slice', 'fs');
	
	getShader('merge', 'vs');
	getShader('merge', 'fs');
	getShader('mesh_transp', 'vs');
	getShader('mesh_transp', 'fs');
	
	initShader('merge');
	initShader('slice');
	initShader('mesh');
	initShader('mesh_transp');
	initShader('fibre_l');
	initShader('fibre_l_transp');
	initShader('fibre_t');
	initShader('fibre_t_transp');
}

function getShader(name, type) {
	var shader;
	$.ajax({
		url : 'static/shaders/' + name + '.' + type,
		async : false,
		success : function(data) {

			if (type == 'fs') {
				shader = gl.createShader(gl.FRAGMENT_SHADER);
			} else {
				shader = gl.createShader(gl.VERTEX_SHADER);
			}
			gl.shaderSource(shader, data);
			gl.compileShader(shader);

			if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
				alert(gl.getShaderInfoLog(shader));
				return null;
			}
			shaders[name + '_' + type] = shader;
		}
	});
}

function initShader(name) {
	shaderPrograms[name] = gl.createProgram();
	gl.attachShader(shaderPrograms[name], shaders[name + '_vs']);
	gl.attachShader(shaderPrograms[name], shaders[name + '_fs']);
	gl.linkProgram(shaderPrograms[name]);

	if (!gl.getProgramParameter(shaderPrograms[name], gl.LINK_STATUS)) {
		alert("Could not initialise shaders\n" + gl.LINK_STATUS);
	}

	gl.useProgram(shaderPrograms[name]);
	
	shaderPrograms[name].vertexPositionAttribute = gl.getAttribLocation(shaderPrograms[name], "aVertexPosition");
	shaderPrograms[name].vertexNormalAttribute   = gl.getAttribLocation(shaderPrograms[name], "aVertexNormal");
	shaderPrograms[name].vertexColorAttribute    = gl.getAttribLocation(shaderPrograms[name], "aVertexColor");
	shaderPrograms[name].textureCoordAttribute   = gl.getAttribLocation(shaderPrograms[name], "aTextureCoord");
	
	shaderPrograms[name].minorModeUniform        = gl.getUniformLocation(shaderPrograms[name], "uMinorMode");
	shaderPrograms[name].canvasSizeUniform       = gl.getUniformLocation(shaderPrograms[name], "uCanvasSize");
	
	shaderPrograms[name].c0Uniform               = gl.getUniformLocation(shaderPrograms[name], "C0");
	shaderPrograms[name].c1Uniform               = gl.getUniformLocation(shaderPrograms[name], "C1");
	shaderPrograms[name].c2Uniform               = gl.getUniformLocation(shaderPrograms[name], "C2");
	shaderPrograms[name].c3Uniform               = gl.getUniformLocation(shaderPrograms[name], "C3");
	shaderPrograms[name].d0Uniform               = gl.getUniformLocation(shaderPrograms[name], "D0");
	shaderPrograms[name].d1Uniform               = gl.getUniformLocation(shaderPrograms[name], "D1");
	shaderPrograms[name].d2Uniform               = gl.getUniformLocation(shaderPrograms[name], "D2");
	shaderPrograms[name].samplerUniform          = gl.getUniformLocation(shaderPrograms[name], "uSampler");
	shaderPrograms[name].samplerUniform1         = gl.getUniformLocation(shaderPrograms[name], "uSampler1");
	
	shaderPrograms[name].colorMapUniform         = gl.getUniformLocation(shaderPrograms[name], "uColorMap");
	shaderPrograms[name].minUniform              = gl.getUniformLocation(shaderPrograms[name], "uMin");
	shaderPrograms[name].maxUniform              = gl.getUniformLocation(shaderPrograms[name], "uMax");
	shaderPrograms[name].threshold1Uniform       = gl.getUniformLocation(shaderPrograms[name], "uThreshold1");
	shaderPrograms[name].threshold2Uniform       = gl.getUniformLocation(shaderPrograms[name], "uThreshold2");
	shaderPrograms[name].alphaUniform            = gl.getUniformLocation(shaderPrograms[name], "uAlpha");
	shaderPrograms[name].alpha2Uniform           = gl.getUniformLocation(shaderPrograms[name], "uAlpha2");
	
	shaderPrograms[name].pMatrixUniform          = gl.getUniformLocation(shaderPrograms[name], "uPMatrix");
	shaderPrograms[name].mvMatrixUniform         = gl.getUniformLocation(shaderPrograms[name], "uMVMatrix");
	shaderPrograms[name].nMatrixUniform          = gl.getUniformLocation(shaderPrograms[name], "uNMatrix");
	shaderPrograms[name].lightLocationUniform    = gl.getUniformLocation(shaderPrograms[name], "uLightLocation");
	
	
	shaderPrograms[name].fibreColorUniform       = gl.getUniformLocation(shaderPrograms[name], "uFibreColor");
	shaderPrograms[name].fibreColorModeUniform   = gl.getUniformLocation(shaderPrograms[name], "uFibreColorMode");
	shaderPrograms[name].zoomUniform             = gl.getUniformLocation(shaderPrograms[name], "uZoom");
	shaderPrograms[name].thicknessUniform        = gl.getUniformLocation(shaderPrograms[name], "uThickness");
}


//***************************************************************************************************
//
// texture management
//
//***************************************************************************************************/
var waitId=0;
var waitOrient=0;
var waitPos=0;

function getTexture(id, orient, pos) {
	if (elements.textures[id][orient + pos]) {
		return elements.textures[id][orient + pos];
	} else {
		if ( elements.niftiis[id].loaded() ) {
			elements.textures[id][orient + pos] = gl.createTexture();
			elements.textures[id][orient + pos].image = elements.niftiis[id].getImage(orient, pos);
			handleLoadedTexture(elements.textures[id][orient + pos]);
		}
		else {
			// start time out and look a little bit later
			waitId = id;
			waitOrient = orient;
			waitPos = pos;
			setTimeout( waitForTextureLoad, 200 );
		}
	}
}

function waitForTextureLoad() {
	if ( elements.niftiis[waitId].loaded() ) {
		elements.textures[waitId][waitOrient + waitPos] = gl.createTexture();
		elements.textures[waitId][waitOrient + waitPos].image = elements.niftiis[waitId].getImage(waitOrient, waitPos);
		handleLoadedTexture(elements.textures[waitId][waitOrient + waitPos]);
	}
	else {
		// start time out and look a little bit later
		setTimeout( waitForTextureLoad, 200 );
	}
}

function handleLoadedTexture(texture) {
	gl.bindTexture(gl.TEXTURE_2D, texture);
	gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, texture.image);
	if ( variables.scene.texInterpolation ) {
		gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
		gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
	}
	else {
		gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
		gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
	}
	gl.generateMipmap(gl.TEXTURE_2D);
	gl.bindTexture(gl.TEXTURE_2D, null);
	delete texture.image;
	redraw();
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
	if (!variables.webgl.needsRedraw) {
		return;
	}
	variables.webgl.needsRedraw = false;
	
	if ( !variables.webgl.peelInitialized )
	{
		initPeel();
		variables.webgl.peelInitialized = true;
	}
	
	
	gl.viewport(0, 0, gl.viewportWidth, gl.viewportHeight);
	gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
	
	mat4.ortho(-100 + variables.mouse.screenMoveX, 100 + variables.mouse.screenMoveX, -100 - variables.mouse.screenMoveY, 100 - variables.mouse.screenMoveY, -500, 500, variables.webgl.pMatrix);

	mat4.identity(variables.webgl.mvMatrix);
	zv = vec3.create();
	zv[0] = variables.scene.zoom;
	zv[1] = variables.scene.zoom;
	zv[2] = variables.scene.zoom;
	mat4.scale(variables.webgl.mvMatrix, zv);

	variables.webgl.lightPos[0] = 0.0;
	variables.webgl.lightPos[1] = 0.0;
	variables.webgl.lightPos[2] = -1.0;

	var dim = elements.niftiis[variables.scene.tex1].getDims();
	mat4.translate(variables.webgl.mvMatrix, [ dim[0]/-2.0, dim[1]/-2.0, dim[2]/-2.0 ]);

	mat4.inverse(variables.webgl.thisRot);
	mat4.multiply(variables.webgl.thisRot, variables.webgl.mvMatrix, variables.webgl.mvMatrix);
	mat4.inverse(variables.webgl.thisRot);

	mat4.toInverseMat3(variables.webgl.mvMatrix, variables.webgl.nMatrix);
	mat3.transpose(variables.webgl.nMatrix);

	mat4.multiplyVec3(variables.webgl.thisRot, variables.webgl.lightPos);

	gl.enable(gl.DEPTH_TEST);
	gl.depthFunc(gl.LEQUAL);
    gl.clearDepth(1);
	
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
	gl.useProgram(shaderPrograms['merge']);
	gl.enableVertexAttribArray(shaderPrograms['merge'].vertexPositionAttribute);
	
	var posBuffer = gl.createBuffer();
	gl.bindBuffer(gl.ARRAY_BUFFER, posBuffer);
	
	var vertices = [ -gl.viewportWidth,  -10,   0, 
	                  gl.viewportWidth,  -10, 0,
	                  gl.viewportWidth,  gl.viewportHeight, 0,
	                 -gl.viewportWidth0, gl.viewportHeight, 0 ];
	
	gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(vertices), gl.STATIC_DRAW);

	gl.vertexAttribPointer(shaderPrograms['merge'].vertexPositionAttribute, 3, gl.FLOAT, false, 0, 0);
	gl.uniform2f(shaderPrograms['merge'].canvasSizeUniform, gl.viewportWidth, gl.viewportHeight);
	
	gl.activeTexture( gl.TEXTURE2 );
	gl.bindTexture( gl.TEXTURE_2D, peels['C0'] );
	gl.uniform1i(shaderPrograms['merge'].c0Uniform, 2);
	
	gl.activeTexture( gl.TEXTURE6 );
	gl.bindTexture( gl.TEXTURE_2D, peels['C1'] );
	gl.uniform1i(shaderPrograms['merge'].c1Uniform, 6);
	
	gl.activeTexture( gl.TEXTURE7 );
	gl.bindTexture( gl.TEXTURE_2D, peels['C2'] );
	gl.uniform1i(shaderPrograms['merge'].c2Uniform, 7);
	
	gl.activeTexture( gl.TEXTURE8 );
	gl.bindTexture( gl.TEXTURE_2D, peels['C3'] );
	gl.uniform1i(shaderPrograms['merge'].c3Uniform, 8);
	
	gl.activeTexture( gl.TEXTURE5 );
	gl.bindTexture( gl.TEXTURE_2D, peels['D2'] );
	gl.uniform1i(shaderPrograms['merge'].d2Uniform, 5);
	
	var vertexIndexBuffer = gl.createBuffer();
	gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, vertexIndexBuffer);
	var vertexIndices = [ 0, 1, 2, 0, 2, 3 ];
	gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, new Uint16Array(vertexIndices), gl.STATIC_DRAW);

	gl.drawElements(gl.TRIANGLES, 6, gl.UNSIGNED_SHORT, 0);
}

function setPeelUniforms( shader ) {
	gl.uniform2f(shaderPrograms[shader].canvasSizeUniform, gl.viewportWidth, gl.viewportHeight);
	gl.uniform1i(shaderPrograms[shader].minorModeUniform, variables.webgl.minorMode );
	gl.activeTexture( gl.TEXTURE3 );
	gl.bindTexture( gl.TEXTURE_2D, peels['D0'] );
	gl.uniform1i(shaderPrograms[shader].d0Uniform, 3);
	gl.activeTexture( gl.TEXTURE4 );
	gl.bindTexture( gl.TEXTURE_2D, peels['D1'] );
	gl.uniform1i(shaderPrograms[shader].d1Uniform, 4);
	gl.activeTexture( gl.TEXTURE5 );
	gl.bindTexture( gl.TEXTURE_2D, peels['D2'] );
	gl.uniform1i(shaderPrograms[shader].d2Uniform, 5);
}

function setMeshUniforms() {
	gl.useProgram(shaderPrograms['mesh']);
	gl.uniformMatrix4fv(shaderPrograms['mesh'].pMatrixUniform, false, variables.webgl.pMatrix);
	gl.uniformMatrix4fv(shaderPrograms['mesh'].mvMatrixUniform, false, variables.webgl.mvMatrix);
	gl.uniformMatrix3fv(shaderPrograms['mesh'].nMatrixUniform, false, variables.webgl.nMatrix);
	gl.uniform1f(shaderPrograms['mesh'].alphaUniform, 1.0);
	gl.uniform3f(shaderPrograms['mesh'].lightLocationUniform, variables.webgl.lightPos[0], variables.webgl.lightPos[1], variables.webgl.lightPos[2]);
}


function drawMesh(elem) {
	if (!elem || !elem.display || !elem.indices )
		return;

	setMeshUniforms();
	gl.enableVertexAttribArray(shaderPrograms['mesh'].vertexPositionAttribute);
	gl.enableVertexAttribArray(shaderPrograms['mesh'].vertexNormalAttribute);
	gl.enableVertexAttribArray(shaderPrograms['mesh'].vertexColorAttribute);
		
	if ( !elem.hasBuffer ) {
		bindMeshBuffers(elem);
	}
	
	gl.bindBuffer(gl.ARRAY_BUFFER, elem.vertexPositionBuffer);
	gl.bufferData(gl.ARRAY_BUFFER, elem.vertexPositionBuffer.data, gl.STATIC_DRAW);
	
	gl.vertexAttribPointer(shaderPrograms['mesh'].vertexPositionAttribute, 3, gl.FLOAT, false, 36, 0);
	gl.vertexAttribPointer(shaderPrograms['mesh'].vertexNormalAttribute, 3, gl.FLOAT, false, 36, 12);
	gl.vertexAttribPointer(shaderPrograms['mesh'].vertexColorAttribute, 3, gl.FLOAT, false, 36, 24);
	
	setPeelUniforms( 'mesh' );
	
	gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, elem.vertexIndexBuffer);
	gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, elem.vertexIndexBuffer.data, gl.STATIC_DRAW);

	gl.enable(gl.DEPTH_TEST);
	gl.enable(gl.CULL_FACE);
	gl.cullFace( gl.BACK );
	gl.frontFace( gl.CW );
	
	gl.uniform1f(shaderPrograms['mesh'].alphaUniform, elem.transparency);

	gl.drawElements(gl.TRIANGLES, elem.vertexIndexBuffer.numItems, gl.UNSIGNED_SHORT, 0);

	gl.bindBuffer(gl.ARRAY_BUFFER, null);
	gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, null);
	gl.disable(gl.CULL_FACE);
}

function drawMeshTransp(elem) {
	if (!elem || !elem.display || !elem.indices )
		return;

	gl.useProgram(shaderPrograms['mesh_transp']);
	gl.enableVertexAttribArray(shaderPrograms['mesh_transp'].vertexPositionAttribute);
	gl.uniformMatrix4fv(shaderPrograms['mesh_transp'].pMatrixUniform, false, variables.webgl.pMatrix);
	gl.uniformMatrix4fv(shaderPrograms['mesh_transp'].mvMatrixUniform, false, variables.webgl.mvMatrix);
	gl.uniformMatrix3fv(shaderPrograms['mesh_transp'].nMatrixUniform, false, variables.webgl.nMatrix);
	
	setPeelUniforms( 'mesh_transp' );
	

	gl.enableVertexAttribArray(shaderPrograms['mesh_transp'].vertexPositionAttribute);
		
	if ( !elem.hasBuffer ) {
		bindMeshBuffers(elem);
	}
	
	gl.bindBuffer(gl.ARRAY_BUFFER, elem.vertexPositionBuffer);
	gl.bufferData(gl.ARRAY_BUFFER, elem.vertexPositionBuffer.data, gl.STATIC_DRAW);
	
	gl.vertexAttribPointer(shaderPrograms['mesh_transp'].vertexPositionAttribute, 3, gl.FLOAT, false, 36, 0);
	

	gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, elem.vertexIndexBuffer);
	gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, elem.vertexIndexBuffer.data, gl.STATIC_DRAW);

	gl.enable(gl.DEPTH_TEST);
	gl.enable(gl.CULL_FACE);
	gl.cullFace( gl.BACK );
	gl.frontFace( gl.CW );

	gl.drawElements(gl.TRIANGLES, elem.vertexIndexBuffer.numItems, gl.UNSIGNED_SHORT, 0);

	gl.bindBuffer(gl.ARRAY_BUFFER, null);
	gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, null);
	gl.disable(gl.CULL_FACE);
}

function bindMeshBuffers(elem) {
	var vertexPositionBuffer = gl.createBuffer();
	vertexPositionBuffer.data = new Float32Array(elem.vertices);
	
	var vertexIndexBuffer = gl.createBuffer();
	vertexIndexBuffer.data = new Uint16Array(elem.indices);
	vertexIndexBuffer.itemSize = 1;
	vertexIndexBuffer.numItems = elem.indices.length;

	elem.vertexPositionBuffer = vertexPositionBuffer;
	elem.vertexIndexBuffer    = vertexIndexBuffer;
	elem.hasBuffer = true;
}

function setFibreLineUniforms() {
	gl.useProgram(shaderPrograms['fibre_l']);
	gl.uniformMatrix4fv(shaderPrograms['fibre_l'].pMatrixUniform, false, variables.webgl.pMatrix);
	gl.uniformMatrix4fv(shaderPrograms['fibre_l'].mvMatrixUniform, false, variables.webgl.mvMatrix);
	gl.uniformMatrix3fv(shaderPrograms['fibre_l'].nMatrixUniform, false, variables.webgl.nMatrix);
	gl.uniform1f(shaderPrograms['fibre_l'].alphaUniform, 1.0);
	gl.uniform3f(shaderPrograms['fibre_l'].lightLocationUniform, variables.webgl.lightPos[0], variables.webgl.lightPos[1], variables.webgl.lightPos[2]);
	gl.uniform1i(shaderPrograms['fibre_l'].fibreColorModeUniform, variables.scene.localFibreColor);
}


function setFiberTubeUniforms() {
	gl.useProgram(shaderPrograms['fibre_t']);
	gl.uniformMatrix4fv(shaderPrograms['fibre_t'].pMatrixUniform, false, variables.webgl.pMatrix);
	gl.uniformMatrix4fv(shaderPrograms['fibre_t'].mvMatrixUniform, false, variables.webgl.mvMatrix);
	gl.uniformMatrix3fv(shaderPrograms['fibre_t'].nMatrixUniform, false, variables.webgl.nMatrix);
	gl.uniform1f(shaderPrograms['fibre_t'].zoomUniform, variables.scene.zoom);
	gl.uniform1i(shaderPrograms['fibre_t'].fibreColorModeUniform, variables.scene.localFibreColor);
}

function drawFibers(elem) {

	if ( !elem.hasBuffer ) {
		bindFibreBuffers(elem);
	}
	
	if ( variables.scene.renderTubes ) {
		setFiberTubeUniforms();
		gl.enableVertexAttribArray(shaderPrograms['fibre_t'].vertexPositionAttribute);
		gl.enableVertexAttribArray(shaderPrograms['fibre_t'].textureCoordAttribute);
		gl.enableVertexAttribArray(shaderPrograms['fibre_t'].vertexNormalAttribute);
		
		gl.bindBuffer(gl.ARRAY_BUFFER, elem.vertexPositionBuffer);
		gl.bufferData(gl.ARRAY_BUFFER, elem.vertexPositionBuffer.data, gl.STATIC_DRAW);
		
		gl.vertexAttribPointer(shaderPrograms['fibre_t'].vertexPositionAttribute, 3, gl.FLOAT, false, 32, 0);
		gl.vertexAttribPointer(shaderPrograms['fibre_t'].vertexNormalAttribute, 3, gl.FLOAT, false, 32, 12);
		gl.vertexAttribPointer(shaderPrograms['fibre_t'].textureCoordAttribute, 2, gl.FLOAT, false, 32, 24);
	
		gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, elem.vertexIndexBuffer);
		gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, elem.vertexIndexBuffer.data, gl.STATIC_DRAW);

		gl.uniform3f(shaderPrograms['fibre_t'].fibreColorUniform, elem.color.r, elem.color.g, elem.color.b);
		gl.uniform1f(shaderPrograms['fibre_t'].thicknessUniform, 0.6);
		
		setPeelUniforms( 'fibre_t' );

		gl.uniform1f(shaderPrograms['fibre_t'].alphaUniform, elem.transparency);
		
		for ( var i = 0; i < elem.indices.length; ++i) {
			gl.drawArrays(gl.TRIANGLE_STRIP, elem.lineStarts[i]*2, elem.indices[i] * 2);
		}
			
	}
	else {
		setFibreLineUniforms();
		gl.enableVertexAttribArray(shaderPrograms['fibre_l'].vertexPositionAttribute);
		gl.enableVertexAttribArray(shaderPrograms['fibre_l'].vertexNormalAttribute);
		
		gl.bindBuffer(gl.ARRAY_BUFFER, elem.vertexPositionBuffer);
		gl.bufferData(gl.ARRAY_BUFFER, elem.vertexPositionBuffer.data, gl.STATIC_DRAW);
		
		gl.vertexAttribPointer(shaderPrograms['fibre_l'].vertexPositionAttribute, 3, gl.FLOAT, false, 64, 0);
		gl.vertexAttribPointer(shaderPrograms['fibre_l'].vertexNormalAttribute, 3, gl.FLOAT, false, 64, 12);
		
		gl.uniform3f(shaderPrograms['fibre_l'].fibreColorUniform, elem.color.r, elem.color.g, elem.color.b);
		gl.uniform1f(shaderPrograms['fibre_l'].alphaUniform, elem.transparency);
		
		setPeelUniforms( 'fibre_l' );
		
		for ( var i = 0; i < elem.indices.length; ++i) {
			gl.drawArrays(gl.LINE_STRIP, elem.lineStarts[i], elem.indices[i]);
		}
	}
					
	gl.bindBuffer(gl.ARRAY_BUFFER, null);
	gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, null);
}

function drawFibersTransp(elem) {

	if ( !elem.hasBuffer ) {
		bindFibreBuffers(elem);
	}
	
	if ( variables.scene.renderTubes ) {
		gl.useProgram(shaderPrograms['fibre_t_transp']);
		gl.uniformMatrix4fv(shaderPrograms['fibre_t_transp'].pMatrixUniform, false, variables.webgl.pMatrix);
		gl.uniformMatrix4fv(shaderPrograms['fibre_t_transp'].mvMatrixUniform, false, variables.webgl.mvMatrix);
		gl.uniformMatrix3fv(shaderPrograms['fibre_t_transp'].nMatrixUniform, false, variables.webgl.nMatrix);
		gl.uniform1f(shaderPrograms['fibre_t_transp'].zoomUniform, variables.scene.zoom);
		gl.uniform1i(shaderPrograms['fibre_t_transp'].fibreColorModeUniform, variables.scene.localFibreColor);
		
		gl.enableVertexAttribArray(shaderPrograms['fibre_t_transp'].vertexPositionAttribute);
		gl.enableVertexAttribArray(shaderPrograms['fibre_t_transp'].textureCoordAttribute);
		gl.enableVertexAttribArray(shaderPrograms['fibre_t_transp'].vertexNormalAttribute);
		
		gl.bindBuffer(gl.ARRAY_BUFFER, elem.vertexPositionBuffer);
		gl.bufferData(gl.ARRAY_BUFFER, elem.vertexPositionBuffer.data, gl.STATIC_DRAW);
		
		gl.vertexAttribPointer(shaderPrograms['fibre_t_transp'].vertexPositionAttribute, 3, gl.FLOAT, false, 32, 0);
		gl.vertexAttribPointer(shaderPrograms['fibre_t_transp'].vertexNormalAttribute, 3, gl.FLOAT, false, 32, 12);
		gl.vertexAttribPointer(shaderPrograms['fibre_t_transp'].textureCoordAttribute, 2, gl.FLOAT, false, 32, 24);
	
		gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, elem.vertexIndexBuffer);
		gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, elem.vertexIndexBuffer.data, gl.STATIC_DRAW);

		gl.uniform3f(shaderPrograms['fibre_t_transp'].fibreColorUniform, elem.color.r, elem.color.g, elem.color.b);
		gl.uniform1f(shaderPrograms['fibre_t_transp'].thicknessUniform, 0.6);

		gl.uniform1f(shaderPrograms['fibre_t_transp'].alphaUniform, elem.transparency);
		
		setPeelUniforms( 'fibre_t_transp' );
		
		for ( var i = 0; i < elem.indices.length; ++i) {
			gl.drawArrays(gl.TRIANGLE_STRIP, elem.lineStarts[i]*2, elem.indices[i] * 2);
		}
			
	}
	else {
		gl.useProgram(shaderPrograms['fibre_l_transp']);
		gl.uniformMatrix4fv(shaderPrograms['fibre_l_transp'].pMatrixUniform, false, variables.webgl.pMatrix);
		gl.uniformMatrix4fv(shaderPrograms['fibre_l_transp'].mvMatrixUniform, false, variables.webgl.mvMatrix);
		gl.uniformMatrix3fv(shaderPrograms['fibre_l_transp'].nMatrixUniform, false, variables.webgl.nMatrix);
		gl.uniform1f(shaderPrograms['fibre_l_transp'].alphaUniform, 1.0);
		gl.uniform3f(shaderPrograms['fibre_l_transp'].lightLocationUniform, variables.webgl.lightPos[0], variables.webgl.lightPos[1], variables.webgl.lightPos[2]);
		gl.uniform1i(shaderPrograms['fibre_l_transp'].fibreColorModeUniform, variables.scene.localFibreColor);
		
		gl.enableVertexAttribArray(shaderPrograms['fibre_l_transp'].vertexPositionAttribute);
		gl.enableVertexAttribArray(shaderPrograms['fibre_l_transp'].vertexNormalAttribute);
		
		gl.bindBuffer(gl.ARRAY_BUFFER, elem.vertexPositionBuffer);
		gl.bufferData(gl.ARRAY_BUFFER, elem.vertexPositionBuffer.data, gl.STATIC_DRAW);
		
		gl.vertexAttribPointer(shaderPrograms['fibre_l_transp'].vertexPositionAttribute, 3, gl.FLOAT, false, 64, 0);
		gl.vertexAttribPointer(shaderPrograms['fibre_l_transp'].vertexNormalAttribute, 3, gl.FLOAT, false, 64, 12);
		
		gl.uniform3f(shaderPrograms['fibre_l_transp'].fibreColorUniform, elem.color.r, elem.color.g, elem.color.b);
		gl.uniform1f(shaderPrograms['fibre_l_transp'].alphaUniform, elem.transparency);
		
		setPeelUniforms( 'fibre_l_transp' );
		
		for ( var i = 0; i < elem.indices.length; ++i) {
			gl.drawArrays(gl.LINE_STRIP, elem.lineStarts[i], elem.indices[i]);
		}
	}
					
	gl.bindBuffer(gl.ARRAY_BUFFER, null);
	gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, null);
}

function bindFibreBuffers(elem) {
	var vertexPositionBuffer = gl.createBuffer();
	vertexPositionBuffer.data = new Float32Array(elem.tubeVertices);
	
	var vertexIndexBuffer = gl.createBuffer();
	vertexIndexBuffer.data = new Uint16Array(elem.indices);
	vertexIndexBuffer.itemSize = 1;
	vertexIndexBuffer.numItems = elem.indices.length;

	elem.vertexPositionBuffer = vertexPositionBuffer;
	elem.vertexIndexBuffer    = vertexIndexBuffer;
	elem.hasBuffer = true;
} 

function drawSlices() {
	gl.useProgram(shaderPrograms['slice']);
	gl.enableVertexAttribArray(shaderPrograms['slice'].vertexPositionAttribute);
	gl.enableVertexAttribArray(shaderPrograms['slice'].textureCoordAttribute);

	// initialize the secondary texture with an empty one
	gl.activeTexture(gl.TEXTURE1);
	gl.bindTexture(gl.TEXTURE_2D, null);
	gl.uniform1i(shaderPrograms['slice'].samplerUniform1, 1);
	gl.uniform1i(shaderPrograms['slice'].colorMapUniform,0);
	gl.uniform1f(shaderPrograms['slice'].minUniform, 0);
	gl.uniform1f(shaderPrograms['slice'].maxUniform, 0);
	gl.uniform1f(shaderPrograms['slice'].threshold1Uniform, 0);
	gl.uniform1f(shaderPrograms['slice'].threshold2Uniform, 0);
	
	var axialPosBuffer = gl.createBuffer();
	gl.bindBuffer(gl.ARRAY_BUFFER, axialPosBuffer);
	var ap = variables.scene.axial + 0.5;
	var vertices = [ 0,   0,   ap, 0.0, 0.0, 
	                 256, 0.5, ap, 1.0, 0.0,
	                 256, 256, ap, 1.0, 1.0,
	                 0,   256, ap, 0.0, 1.0 ];
	
	gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(vertices), gl.STATIC_DRAW);

	gl.vertexAttribPointer(shaderPrograms['slice'].vertexPositionAttribute, 3, gl.FLOAT, false, 20, 0);
	gl.vertexAttribPointer(shaderPrograms['slice'].textureCoordAttribute, 2, gl.FLOAT, false, 20, 12);
	
	var axialVertexIndexBuffer = gl.createBuffer();
	gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, axialVertexIndexBuffer);
	var vertexIndices = [ 0, 1, 2, 0, 2, 3 ];
	gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, new Uint16Array(vertexIndices), gl.STATIC_DRAW);

	gl.activeTexture(gl.TEXTURE0);
	gl.bindTexture(gl.TEXTURE_2D, getTexture(variables.scene.tex1, 'axial', variables.scene.axial));
	gl.uniform1i(shaderPrograms['slice'].samplerUniform, 0);
	gl.uniform1i(shaderPrograms['slice'].minorModeUniform, variables.webgl.minorMode );

	if (variables.scene.tex2 != "none") {
		gl.activeTexture(gl.TEXTURE1);
		gl.bindTexture(gl.TEXTURE_2D, getTexture(variables.scene.tex2, 'axial', variables.scene.axial));
		gl.uniform1i(shaderPrograms['slice'].samplerUniform1, 1);
		gl.uniform1i(shaderPrograms['slice'].colorMapUniform,variables.scene.colormap);
		gl.uniform1f(shaderPrograms['slice'].minUniform, elements.niftiis[variables.scene.tex2].getMin() );
		gl.uniform1f(shaderPrograms['slice'].maxUniform, elements.niftiis[variables.scene.tex2].getMax() );
		gl.uniform1f(shaderPrograms['slice'].threshold1Uniform, variables.scene.texThreshold1);
		gl.uniform1f(shaderPrograms['slice'].threshold2Uniform, variables.scene.texThreshold2);
		gl.uniform1f(shaderPrograms['slice'].alpha2Uniform, variables.scene.texAlpha2);
	}

	gl.uniformMatrix4fv(shaderPrograms['slice'].pMatrixUniform, false, variables.webgl.pMatrix);
	gl.uniformMatrix4fv(shaderPrograms['slice'].mvMatrixUniform, false, variables.webgl.mvMatrix);
	gl.uniformMatrix3fv(shaderPrograms['slice'].nMatrixUniform, false, variables.webgl.nMatrix);

	gl.drawElements(gl.TRIANGLES, 6, gl.UNSIGNED_SHORT, 0);


	var coronalPosBuffer = gl.createBuffer();
	gl.bindBuffer(gl.ARRAY_BUFFER, coronalPosBuffer);
	var cp = variables.scene.coronal + 0.5;
	var vertices = [ 0,   cp, 0,   0.0, 0.0,
	                 256, cp, 0,   1.0, 0.0,
	                 256, cp, 256, 1.0, 1.0,
	                 0,   cp, 256, 0.0, 1.0];
	
	gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(vertices), gl.STATIC_DRAW);
	
	gl.vertexAttribPointer(shaderPrograms['slice'].vertexPositionAttribute, 3, gl.FLOAT, false, 20, 0);
	gl.vertexAttribPointer(shaderPrograms['slice'].textureCoordAttribute, 2, gl.FLOAT, false, 20, 12);

	var coronalVertexIndexBuffer = gl.createBuffer();
	gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, coronalVertexIndexBuffer);
	var vertexIndices = [ 0, 1, 2, 0, 2, 3 ];
	gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, new Uint16Array(vertexIndices), gl.STATIC_DRAW);

	gl.activeTexture(gl.TEXTURE0);
	gl.bindTexture(gl.TEXTURE_2D, getTexture(variables.scene.tex1, 'coronal', variables.scene.coronal));
	gl.uniform1i(shaderPrograms['slice'].samplerUniform, 0);

	if (variables.scene.tex2 != "none") {
		gl.activeTexture(gl.TEXTURE1);
		gl.bindTexture(gl.TEXTURE_2D, getTexture(variables.scene.tex2, 'coronal', variables.scene.coronal));
		gl.uniform1i(shaderPrograms['slice'].samplerUniform1, 1);
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

	gl.vertexAttribPointer(shaderPrograms['slice'].vertexPositionAttribute, 3, gl.FLOAT, false, 20, 0);
	gl.vertexAttribPointer(shaderPrograms['slice'].textureCoordAttribute, 2, gl.FLOAT, false, 20, 12);

	var sagittalVertexIndexBuffer = gl.createBuffer();
	gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, sagittalVertexIndexBuffer);
	var vertexIndices = [ 0, 1, 2, 0, 2, 3 ];
	gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, new Uint16Array(vertexIndices), gl.STATIC_DRAW);

	gl.activeTexture(gl.TEXTURE0);
	gl.bindTexture(gl.TEXTURE_2D, getTexture(variables.scene.tex1, 'sagittal', variables.scene.sagittal));
	gl.uniform1i(shaderPrograms['slice'].samplerUniform, 0);

	if (variables.scene.tex2 != "none") {
		gl.activeTexture(gl.TEXTURE1);
		gl.bindTexture(gl.TEXTURE_2D, getTexture(variables.scene.tex2, 'sagittal', variables.scene.sagittal));
		gl.uniform1i(shaderPrograms['slice'].samplerUniform1, 1);
	}

	gl.drawElements(gl.TRIANGLES, 6, gl.UNSIGNED_SHORT, 0);


	gl.bindBuffer(gl.ARRAY_BUFFER, null);
	gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, null);
}

//***************************************************************************************************
//
// everything mouse related
//
//***************************************************************************************************/

function fixupMouse(event) {
	event = event || window.event;

	var e = {
		event : event,
		target : event.target ? event.target : event.srcElement,
		which : event.which ? event.which : event.button === 1 ? 1 : event.button === 2 ? 3 : event.button === 4 ? 2 : 1,
		x : event[0] ? event[0] : event.clientX,
		y : event[1] ? event[1] : event.clientY
	};

	if (event.offsetX) {
		// chrome case, should work
		e.fixedX = event.offsetX;
		e.fixedY = event.offsetY;
	} else {
		e.fixedX = e.x - findPosX(canvas);
		e.fixedY = e.y - findPosY(canvas);
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

function handleMouseDown(event) {
	e = fixupMouse(event);

	if (e.which == 1) {
		variables.mouse.leftDown = true;
		mat4.set(variables.webgl.thisRot, variables.webgl.lastRot);
		Arcball.click(e.fixedX, e.fixedY);
	} else if (e.which == 2) {
		variables.mouse.middleDown = true;
		variables.mouse.screenMoveXold = variables.mouse.screenMoveX;
		variables.mouse.screenMoveYold = variables.mouse.screenMoveY;

		variables.mouse.midClickX = e.fixedX;
		variables.mouse.midClickY = e.fixedY;
	}
	event.preventDefault();
	redraw();
}

function handleMouseUp(event) {
	e = fixupMouse(event);
	if (e.which == 1) {
		variables.mouse.leftDown = false;
	} else if (e.which == 2) {
		variables.mouse.middleDown = false;
	}
	event.preventDefault();
	redraw();
}

function handleMouseMove(event) {
	e = fixupMouse(event);

	if (variables.mouse.leftDown) {
		Arcball.drag(e.fixedX, e.fixedY);
		mat4.set(Arcball.get(), variables.webgl.thisRot);
		mat4.multiply(variables.webgl.lastRot, variables.webgl.thisRot, variables.webgl.thisRot);
		$.each(elements.meshes, function() {
			if (this.display) {
				this.dirty = true;
			}
		});
		$.each(elements.fibres, function() {
			if (this.display) {
				this.dirty = true;
			}
		});
		
	} else if (variables.mouse.middleDown) {
		variables.mouse.screenMoveX = variables.mouse.midClickX - e.fixedX + variables.mouse.screenMoveXold;
		variables.mouse.screenMoveY = variables.mouse.midClickY - e.fixedY + variables.mouse.screenMoveYold;
	}
	event.preventDefault();
	redraw();
}

function handleMouseWheel(e) {
	e = e ? e : window.event;
	wheelData = e.detail ? e.detail * -1 : e.wheelDelta / 40;
	if (variables.mouse.middleDown) {
		e.preventDefault();
		return;
	}
	if (wheelData < 0) {
		if ( variables.scene.zoom <= 1 ) {
			variables.scene.zoom -= 0.1;
		}
		else {
			variables.scene.zoom -= 0.5;
		}
	} else {
		if ( variables.scene.zoom <= 1 ) {
			variables.scene.zoom += 0.1;
		}
		else {
			variables.scene.zoom += 0.5;
		}
	}
	if (variables.scene.zoom < 0.5) {
		variables.scene.zoom = 0.5;
	}
	e.preventDefault();
	redraw();
}



//***************************************************************************************************
//
// public functions, getters and setters
//
//***************************************************************************************************/
function toggleElement(id) {
	if (id in elements.meshes) {
		elements.meshes[id].display = !elements.meshes[id].display;
		$(Viewer).trigger('elementDisplayChange', {
			'id' : id,
			'active' : elements.meshes[id].display
		});
	}
	else if (id in elements.fibres) {
		elements.fibres[id].display = !elements.fibres[id].display;
		$(Viewer).trigger('elementDisplayChange', {
			'id' : id,
			'active' : elements.fibres[id].display
		});
	}
	else {
		console.warn('Element "' + id + '" is unknown.');
		return false;
	}
	
	redraw();
}

function showElement(id) {
	if (id in elements.meshes) {
		elements.meshes[id].display = true;
		$(Viewer).trigger('elementDisplayChange', {
			'id' : id,
			'active' : true
		});
	}
	else if (id in elements.fibres) {
		elements.fibres[id].display = true;
		$(Viewer).trigger('elementDisplayChange', {
			'id' : id,
			'active' : true
		});
	}
	else {
		console.warn('Element "' + id + '" is unknown.');
		return false;
	}
	
	redraw();
}

function hideElement(id) {
	if (id in elements.meshes) {
		elements.meshes[id].display = false;
		$(Viewer).trigger('elementDisplayChange', {
			'id' : id,
			'active' : false
		});
	}
	else if (id in elements.fibres) {
		elements.fibres[id].display = false;
		$(Viewer).trigger('elementDisplayChange', {
			'id' : id,
			'active' : false
		});
	}
	else {
		console.warn('Element "' + id + '" is unknown.');
		return false;
	}
	redraw();
}

function setAxial(position) {
	if (position < 0)
		position = 0;
	if (position > 255)
		position = 255;
	variables.scene.axial = parseFloat(position);
	redraw();
}

function setCoronal(position) {
	if (position < 0)
		position = 0;
	if (position > 255)
		position = 255;
	variables.scene.coronal = parseFloat(position);
	redraw();
}

function setSagittal(position) {
	if (position < 0)
		position = 0;
	if (position > 255)
		position = 255;
	variables.scene.sagittal = parseFloat(position);
	redraw();
}

function getAxial() {
	return variables.scene.axial;
}

function getCoronal() {
	return variables.scene.coronal;
}

function getSagittal() {
	return variables.scene.sagittal;
}

function updateSize() {
	gl.viewportWidth = $canvas.width();
	gl.viewportHeight = $canvas.height();
	Arcball.set_win_size(gl.viewportWidth, gl.viewportHeight);
	variables.webgl.peelInitialized = false;
	redraw();
}

function bind(event, callback) {
	$(Viewer).bind(event, callback);
}

function saveScene() {
	//console.log( JSON.stringify(variables));
	var activs = [];
    $.each(elements, function() {
        if (this.display) {
             activs.push(this.id);
        }
    });
    variables.scene.activ = activs;
	variables.connectom.animate = false;
	
	return JSON.stringify(variables);
}

function loadScene( saveString ) {
	var loadData;
	
	if (saveString != "") {
		try {
			loadData = JSON.parse(saveString);
		}
		catch(e) {
			alert("Error while loading");
			return;
		}
	}
	else {
		alert("Nothing to load!");
		return;
	}

	
	variables.webgl.thisRot.set(loadData.webgl.thisRot);
	variables.scene = loadData.scene;
	
	$.each(elements, function(id, element) {
		hideElement(id);
	});
	$.each(loadData.scene.activ, function() {
		showElement(this);
	});
	redraw();
}


function changeTexture(id) {
	variables.scene.tex1 = id;
	redraw();
}

function changeTexture2(id) {
	variables.scene.tex2 = id;

	var t1min = 0;
	var t1max = 0;
	var t1step = 0;
	var t2min = 0;
	var t2max = 0;
	var t2step = 0;
	if ( id === 'none') {
		variables.scene.colormap = 0;
	}
	else {
		t1min = elements.niftiis[id].getMin();
		t1max = 0;
		t1step = elements.niftiis[id].getMin() / 100 * -1.0;
		t2min = 0;
		t2max = elements.niftiis[id].getMax();
		t2step = elements.niftiis[id].getMax() / 100;
	
		if ( elements.niftiis[id].getType() === 'anatomy' || elements.niftiis[id].getType() === 'rgb' ) {
			variables.scene.colormap = 0;
		}
		else if ( elements.niftiis[id].getType() === 'fmri' ) {
			variables.scene.colormap = 1;
		}
		else if ( elements.niftiis[id].getType() === 'overlay' ) {
			variables.scene.colormap = 3;
		}
	}
	
	$(Viewer).trigger('colormapChanged', {
		'id' : variables.scene.colormap,
		't1' : variables.scene.texThreshold1,
		't1min' : t1min,
		't1max' : t1max,
		't1step' : t1step,
		't2' : variables.scene.texThreshold2,
		't2min' : t2min,
		't2max' : t2max,
		't2step' : t2step
	});
	
	redraw();
}

function changeColormap(id) {
	variables.scene.colormap = id;
	redraw();
}

function setThreshold1(value) {
	variables.scene.texThreshold1 = value;
	redraw();
}

function setThreshold2(value) {
	variables.scene.texThreshold2 = value;
	redraw();
}

function setAlpha2(value) {
	variables.scene.texAlpha2 = value;
	redraw();
}

function getElementAlpha(id) {
	if ( elements.meshes[id] ) {
		return elements.meshes[id].transparency;
	}
	if ( elements.fibres[id] ) {
		return elements.fibres[id].transparency;
	}
}

function setElementAlpha(id, alpha) {
	if ( elements.meshes[id] ) {
		elements.meshes[id].transparency = alpha;
	}
	if ( elements.fibres[id] ) {
		elements.fibres[id].transparency = alpha;
	}
	redraw();
}

function screenshot() {
	var img = canvas.toDataURL("image/png");
	document.location.href = img.replace("image/png", "image/octet-stream");
}

function control(id) {
	switch (id) {
	case "fibreColor":
		variables.scene.localFibreColor = !variables.scene.localFibreColor;
		break;
	case "fibreTubes":
		variables.scene.renderTubes = !variables.scene.renderTubes;
		break;				
	case "slices":
		variables.scene.showSlices = !variables.scene.showSlices;
		break;
	case "interpolation":
		variables.scene.texInterpolation = !variables.scene.texInterpolation;
		textures = {};
		$.each(elements.niftiis, function() {
			elements.textures[this.id] = {};
		});
		break;
	case "screenshot" :
		screenshot();
		break;
	case "updateSize" :
		updateSize();
		break;
	default:
		}
		redraw();
}
	
	// Im Viewer-Singleton werden nur die im folgenden aufgefhrten
// Methoden/Eigenschaften nach
// auen sichtbar gemacht.
return {
	'init' : init,
	'bind' : bind,
	'toggleElement' : toggleElement,
	'showElement' : showElement,
	'hideElement' : hideElement,
	'activateScene' : activateScene,
	'activateView' : activateView,
	'setAxial' : setAxial,
	'setCoronal' : setCoronal,
	'setSagittal' : setSagittal,
	'getAxial' : getAxial,
	'getCoronal' : getCoronal,
	'getSagittal' : getSagittal,
	'changeTexture' : changeTexture,
	'changeTexture2' : changeTexture2,
	'changeColormap' : changeColormap,
	'setThreshold1' : setThreshold1,
	'setThreshold2' : setThreshold2,
	'setAlpha2' : setAlpha2,
	'getElementAlpha' : getElementAlpha,
	'setElementAlpha' : setElementAlpha,
	'control' : control,
	'pickInfo' : variables.picking,
	'elements' : elements,
	'redraw' : redraw
};
})();

