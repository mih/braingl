define ( ['io'], (function(io) {
//state of the currently displayed scene

variables = {};
variables["zoom"] = 1.0;
variables["axial"] = 80;
variables["coronal"] = 100;
variables["sagittal"] = 80;
variables["tex1"] = 'none';
variables["tex2"] = "none"; //"fmri1";
variables["localFibreColor"] = false;
variables["showSlices"] = true;
variables["renderTubes"] = true;
variables["threshold1"] = 0.0;
variables["threshold2"] = 0.0;
variables["colormap"] = 0;
variables["alpha2"] = 1.0;
variables["interpolate"] = true;
variables["loadingComplete"] = false;

var meshes = {};
var fibres = {};

function init () {
	meshes = io.meshes();
	fibres = io.fibres();
}

function getValue( name ) {
	return variables[name];
}

function ival( name ) {
	return parseInt( variables[name] );
}

function fval( name ) {
	return parseFloat( variables[name] );
}


function setValue( name, value ) {
	variables[name] = value;
}

function getColormapValues( suggest, callback ) {
	var id = variables["tex2"];

	var t1min = 0;
	var t1max = 0;
	var t1step = 0;
	var t2min = 0;
	var t2max = 0;
	var t2step = 0;
	if ( id === 'none') {
		colormap = 0;
	}
	else {
		t1min = io.niftiis()[id].getMin();
		t1max = 0;
		t1step = io.niftiis()[id].getMin() / 100 * -1.0;
		t2min = 0;
		t2max = io.niftiis()[id].getMax();
		t2step = io.niftiis()[id].getMax() / 100;
		
		if ( suggest ) {
			if ( io.niftiis()[id].getType() === 'anatomy' || io.niftiis()[id].getType() === 'rgb' ) {
				variables["colormap"] = 0;
			}
			else if ( io.niftiis()[id].getType() === 'fmri' ) {
				variables["colormap"] = 1;
			}
			else if ( io.niftiis()[id].getType() === 'overlay' ) {
				variables["colormap"] = 3;
			}
		}
	}
	
	callback( {
		'id' : variables["colormap"],
		't1' :variables["threshold1"],
		't1min' : t1min,
		't1max' : t1max,
		't1step' : t1step,
		't2' : variables["threshold2"],
		't2min' : t2min,
		't2max' : t2max,
		't2step' : t2step
	});
	
}

function toggleElement(id, callback) {
	if (id in meshes) {
		meshes[id].display = !meshes[id].display;
		callback( id, meshes[id].display);
	}
	else if (id in fibres) {
		fibres[id].display = !fibres[id].display;
		callback( id, fibres[id].display);
	}
	else {
		console.warn('Element "' + id + '" is unknown.');
		return false;
	}
}

function getElementAlpha(id) {
	if ( meshes[id] ) {
		return meshes[id].transparency;
	}
	if ( io.fibres[id] ) {
		return fibres[id].transparency;
	}
}

function setElementAlpha(id, alpha) {
	if ( meshes[id] ) {
		meshes[id].transparency = alpha;
	}
	if ( fibres[id] ) {
		fibres[id].transparency = alpha;
	}
}

function toggleValue( name ) {
	variables[name] = !variables[name];
}

return {
	init : init,
	setValue : setValue,
	getValue : getValue,
	ival : ival,
	fval : fval,
	getColormapValues: getColormapValues,
	toggleElement : toggleElement,
	getElementAlpha : getElementAlpha,
	setElementAlpha : setElementAlpha,
	toggleValue : toggleValue
	
};
}));