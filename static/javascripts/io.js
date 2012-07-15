function loadMesh(el) {
	var element = el;
	$.getJSON(settings.DATA_URL + el.url, function(data) {
		element.indices  = data.indices;
		
		var vertices = data.vertices;
		if (element.correction) {
			for ( var m = 0; m < data.vertices.length / 3; ++m) {
				vertices[3 * m] += data.correction[0];
				vertices[3 * m + 1] += data.correction[1];
				vertices[3 * m + 2] += data.correction[2];
			}
		}
		
		var colors = [];
		if (!data.colors) {
			colorSize = (data.vertices.length / 3) * 4;
			
			if (el.color) {
				for ( var k = 0; k < colorSize / 4; ++k) {
					colors.push(el.color.r);
					colors.push(el.color.g);
					colors.push(el.color.b);
					colors.push(1);
				}
			} else {
				for ( var k = 0; k < colorSize; ++k) {
					colors.push(1);
				}
			}
			
		}
		else {
			colors = data.colors;
		}
		
		element.vertices = [];
		for ( var i = 0; i < vertices.length /3; ++i ) {
			element.vertices.push( vertices[ i * 3 ]);
			element.vertices.push( vertices[ i * 3 + 1 ]);
			element.vertices.push( vertices[ i * 3 + 2 ]);
			element.vertices.push( data.normals[ i * 3 ]);
			element.vertices.push( data.normals[ i * 3 + 1 ]);
			element.vertices.push( data.normals[ i * 3 + 2 ]);
			element.vertices.push( colors[ i * 4 ]);
			element.vertices.push( colors[ i * 4 + 1 ]);
			element.vertices.push( colors[ i * 4 + 2 ]);
		}

		element.transparency = el.transparency;
		element.hasBuffer = false;

		pickColor = createPickColor(Viewer.pickInfo.pickIndex);
		Viewer.pickInfo.pickArray[pickColor.join()] = el.id;
		Viewer.pickInfo.pickIndex++;
		pc = [];
		pc[0] = pickColor[0] / 255;
		pc[1] = pickColor[1] / 255;
		pc[2] = pickColor[2] / 255;
		element.pickColor = pc;
	});
	
	Viewer.elements.meshes[el.id] = element;
	
	$(Viewer).trigger('loadElementComplete', {
		'id' : el.id,
		'active' : el.display
	});
}

function loadFibre(el) {
	var element = el;
	$.getJSON(settings.DATA_URL + el.url, function(data) {
		element.indices = data.indices;
		var vertices = data.vertices;
		
		if (element.correction) {
			for ( var m = 0; m < element.vertices.length / 3; ++m) {
				vertices[3 * m] += data.correction[0];
				vertices[3 * m + 1] += data.correction[1];
				vertices[3 * m + 2] += data.correction[2];
			}
		}
		
//		var colors = [];
//		if (!data.colors) {
//			colorSize = (data.vertices.length / 3) * 4;
//			
//			if (el.color) {
//				for ( var k = 0; k < colorSize / 4; ++k) {
//					colors.push(el.color.r);
//					colors.push(el.color.g);
//					colors.push(el.color.b);
//					colors.push(1);
//				}
//			} else {
//				for ( var k = 0; k < colorSize; ++k) {
//					colors.push(1);
//				}
//			}
//		}
//		else {
//			colors = data.colors;
//		}
		
		element.transparency = el.transparency;
		element.hasBuffer = false;

		pickColor = createPickColor(Viewer.pickInfo.pickIndex);
		Viewer.pickInfo.pickArray[pickColor.join()] = el.id;
		Viewer.pickInfo.pickIndex++;
		pc = [];
		pc[0] = pickColor[0] / 255;
		pc[1] = pickColor[1] / 255;
		pc[2] = pickColor[2] / 255;
		element.pickColor = pc;


		tubeVertices = [];
		tubeTexCoords = [];
		tubeColors = [];
		
		for ( var m = 0; m < vertices.length / 3; ++m) {
			tubeVertices.push(vertices[3 * m]);
			tubeVertices.push(vertices[3 * m + 1]);
			tubeVertices.push(vertices[3 * m + 2]);
			tubeVertices.push(vertices[3 * m]);
			tubeVertices.push(vertices[3 * m + 1]);
			tubeVertices.push(vertices[3 * m + 2]);
			
//			tubeColors.push(colors[4 * m]);
//			tubeColors.push(colors[4 * m + 1]);
//			tubeColors.push(colors[4 * m + 2]);
//			tubeColors.push(colors[4 * m + 3]);
//			tubeColors.push(colors[4 * m]);
//			tubeColors.push(colors[4 * m + 1]);
//			tubeColors.push(colors[4 * m + 2]);
//			tubeColors.push(colors[4 * m + 3]);
			
			tubeTexCoords.push(1.0);
			tubeTexCoords.push(1.0);
			tubeTexCoords.push(-1.0);
			tubeTexCoords.push(1.0);
		}
		
		tubeNormals = calcTubeNormals(data);

		element.tubeVertices = [];
		for ( var i = 0; i < tubeVertices.length /3; ++i ) {
			element.tubeVertices.push( tubeVertices[ i * 3 ]);
			element.tubeVertices.push( tubeVertices[ i * 3 + 1 ]);
			element.tubeVertices.push( tubeVertices[ i * 3 + 2 ]);
			element.tubeVertices.push( tubeNormals[ i * 3 ]);
			element.tubeVertices.push( tubeNormals[ i * 3 + 1 ]);
			element.tubeVertices.push( tubeNormals[ i * 3 + 2 ]);
//			element.tubeVertices.push( tubeColors[ i * 4 ]);
//			element.tubeVertices.push( tubeColors[ i * 4 + 1 ]);
//			element.tubeVertices.push( tubeColors[ i * 4 + 2 ]);
//			element.tubeVertices.push( tubeColors[ i * 4 + 3 ]);
			element.tubeVertices.push( tubeTexCoords[ i * 2 ]);
			element.tubeVertices.push( tubeTexCoords[ i * 2 + 1 ]);
		}
		
		
		var lineStart = 0;
		var lineStarts = [];
		for ( var i = 0; i < element.indices.length; ++i) {
			lineStarts.push(lineStart);
			lineStart += element.indices[i];
		}
		element.lineStarts = lineStarts;

		element.color = el.color;
		
		Viewer.elements.fibres[el.id] = element;
		
		$(Viewer).trigger('loadElementComplete', {
			'id' : el.id,
			'active' : el.display
		});
	});	
}

function calcTubeNormals(elem) {
	tubeNormals = [];

	lineStart = 0;
	for ( var i = 0; i < elem.indices.length; ++i) {
		length = elem.indices[i];

		var x1=0, x2=0, y1=0, y2=0, z1=0, z2=0, nx=0, ny=0, nz=0;

		tubeNormals.push(0);
		tubeNormals.push(0);
		tubeNormals.push(0);
		tubeNormals.push(0);
		tubeNormals.push(0);
		tubeNormals.push(0);

		for ( var j = 1; j < length - 1; ++j) {
			x1 = elem.vertices[lineStart + 3 * j - 3];
			y1 = elem.vertices[lineStart + 3 * j - 2];
			z1 = elem.vertices[lineStart + 3 * j - 1];
			x2 = elem.vertices[lineStart + 3 * j + 3];
			y2 = elem.vertices[lineStart + 3 * j + 4];
			z2 = elem.vertices[lineStart + 3 * j + 5];

			nx = x1 - x2;
			ny = y1 - y2;
			nz = z1 - z2;

			tubeNormals.push(nx);
			tubeNormals.push(ny);
			tubeNormals.push(nz);
			tubeNormals.push(nx);
			tubeNormals.push(ny);
			tubeNormals.push(nz);
		}

		tubeNormals.push(nx);
		tubeNormals.push(ny);
		tubeNormals.push(nz);
		tubeNormals.push(nx);
		tubeNormals.push(ny);
		tubeNormals.push(nz);

		for ( var k = 0; k < 6; ++k)
			tubeNormals[k] = tubeNormals[6 + k];

		lineStart += elem.indices[i] * 3;
	}

	return tubeNormals;
}

function loadTexture(el) {
	var niftii  = new Niftii();
	niftii.load( settings.DATA_URL + el.url );
	Viewer.elements.niftiis[el.id] = niftii;
	Viewer.elements.niftiis[el.id].id = el.id;
	Viewer.elements.niftiis[el.id].name = el.name;
	Viewer.elements.textures[el.id] = {};
	Viewer.elements.texIds.push(el.id);
}

//***************************************************************************************************
//
//	load functions
//
//***************************************************************************************************/
function loadElements(elementsToLoad) {
	$(Viewer).trigger('loadElementsStart');

	// alle Elemente durchgehen, 
	$.each(elementsToLoad, function(i, el) {
		$(Viewer).trigger('loadElementStart', {
			'id' : el.id,
			'name' : el.name,
			'type' : el.type
		});

		switch( el.type ) {
		case "mesh" :
			loadMesh(el);
			break;
		case "fibre" :
			loadFibre(el);
			break;
		case "texture" :
			loadTexture(el);
			$(Viewer).trigger('loadTexture', {
				'id' : el.id,
				'name' : elements.niftiis[el.id].name
			});
			break;
			default:
		}
	});
	//  den loadElementsComplete-Event feuern, wenn alle Elemente geladen sind.
	$(Viewer).trigger('loadElementsComplete');
	variables.scene.tex1 = elements.texIds[0];
	Viewer.redraw();
}

function loadActivations(activationsToLoad) {
	$(Viewer).trigger('loadActivationsStart');

	$.each(activationsToLoad, function(i, ac) {
		createActivation( ac.id, ac.name, ac.coord.x, ac.coord.y, ac.coord.z, ac.size, ac.color.r, ac.color.g, ac.color.b );
		elements.activations[ac.id].fromJSON = true;

		$(Viewer).trigger('newActivation', {
			'id' : ac.id,
			'name' : ac.name,
			'active' : true
		});
		
		$(Viewer).trigger('loadActivationComplete', {
			'id' : ac.id
		});
		
		var saveAct = {};
        saveAct.id = ac.id;
        saveAct.name = ac.name;
        saveAct.co = elements.activations[ac.id].coordinates;
        saveAct.size = ac.size;
        saveAct.rgb = elements.activations[ac.id].rgb;
        variables.connectom.activations[ac.id] = saveAct;
	});
	
	$(Viewer).trigger('loadActivationsComplete');
}

function loadConnections(connectionsToLoad) {
	$(Viewer).trigger('loadConnectionsStart');

	$.each(connectionsToLoad, function(i, con) {
		var fromId = con.fromId;
		var toId = con.toId;
		var color = con.color;
		var strength = con.strength;
		var size = con.size;
		var distance = con.distance;
		var speed = con.speed;
		var color2 = con.color2;
		var strength2 = con.strength2;
		var size2 = con.size2;
		var distance2 = con.distance2;
		var speed2 = con.speed2;
		
		addConnection( fromId, toId, color, strength, size, distance, speed, color2, strength2, size2, distance2, speed2, false );
		
		$(Viewer).trigger('loadConnectionComplete', {
			'id' : con.id
		});
	});

	$(Viewer).trigger('loadConnectionssComplete');
}

function loadScenes() {
    
	$(Viewer).trigger('loadScenesStart');
	$.getJSON(settings.DATA_URL + 'scenes.json', function(data) {
		$.each(data, function(i, sc) {
			scenes[sc.id] = {};
			scenes[sc.id].cameraPosition = sc.cameraPosition;
			scenes[sc.id].cameraTranslation = sc.cameraTranslation;
			scenes[sc.id].cameraZoom = sc.cameraZoom;
			scenes[sc.id].elementsAvailable = sc.elementsAvailable;
			scenes[sc.id].elementsActive = sc.elementsActive;
			scenes[sc.id].activationsAvailable = sc.activationsAvailable;
			scenes[sc.id].activationsActive = sc.activationsActive;
			scenes[sc.id].slices = sc.slices;
			scenes[sc.id].texture1 = sc.texture1;
			scenes[sc.id].texture2 = sc.texture2;
			scenes[sc.id].isView = sc.isView;
			scenes[sc.id].name = sc.name;

			$(Viewer).trigger('loadSceneComplete', {
				'id' : sc.id,
				'isView' : sc.isView,
				'name' : sc.name
			});
		});
		$(Viewer).trigger('loadScenesComplete');
	});
}
