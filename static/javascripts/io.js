function loadMesh(el) {
	var element = el;
	$.getJSON(settings.DATA_URL + el.url, function(data) {
		
		element.vertices = data.vertices;
		element.normals  = data.normals;
		element.indices  = data.indices;
		element.colors   = data.colors;
		
		if (element.correction) {
			for ( var m = 0; m < element.vertices.length / 3; ++m) {
				element.vertices[3 * m] += data.correction[0];
				element.vertices[3 * m + 1] += data.correction[1];
				element.vertices[3 * m + 2] += data.correction[2];
			}
		}
		
		if (!element.colors) {
			colorSize = (element.indices.length / 3) * 4;
			colors = [];

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
			element.colors = colors;
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
		element.vertices = data.vertices;
		element.normals  = data.normals;
		element.indices  = data.indices;
		element.colors   = data.colors;
		
		if (element.correction) {
			for ( var m = 0; m < element.vertices.length / 3; ++m) {
				element.vertices[3 * m] += data.correction[0];
				element.vertices[3 * m + 1] += data.correction[1];
				element.vertices[3 * m + 2] += data.correction[2];
			}
		}
		
		if (!element.colors) {
			colorSize = (element.indices.length / 3) * 4;
			colors = [];

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
			element.colors = colors;
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


		tubeVertices = [];
		tubeTexCoords = [];
		tubeColors = [];

		for ( var m = 0; m < element.vertices.length / 3; ++m) {
			tubeVertices.push(element.vertices[3 * m]);
			tubeVertices.push(element.vertices[3 * m + 1]);
			tubeVertices.push(element.vertices[3 * m + 2]);
			tubeVertices.push(element.vertices[3 * m]);
			tubeVertices.push(element.vertices[3 * m + 1]);
			tubeVertices.push(element.vertices[3 * m + 2]);
			
			tubeColors.push(element.colors[4 * m]);
			tubeColors.push(element.colors[4 * m + 1]);
			tubeColors.push(element.colors[4 * m + 2]);
			tubeColors.push(element.colors[4 * m + 3]);
			tubeColors.push(element.colors[4 * m]);
			tubeColors.push(element.colors[4 * m + 1]);
			tubeColors.push(element.colors[4 * m + 2]);
			tubeColors.push(element.colors[4 * m + 3]);
			
			

			tubeTexCoords.push(1.0);
			tubeTexCoords.push(1.0);
			tubeTexCoords.push(-1.0);
			tubeTexCoords.push(1.0);
		}
		
		element.tubeVertices = tubeVertices;
		element.tubeTexCoords = tubeTexCoords;
		element.tubeColors = tubeColors;
		calcTubeNormals(element);

		
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


function loadTexture(el) {
	var niftii  = new Niftii();
	niftii.load( settings.DATA_URL + el.url );
	Viewer.elements.niftiis[el.id] = niftii;
	Viewer.elements.niftiis[el.id].id = el.id;
	Viewer.elements.niftiis[el.id].name = el.name;
	Viewer.elements.textures[el.id] = {};
	Viewer.elements.texIds.push(el.id);
}