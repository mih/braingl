/**
* A class to load niftii files and provide slices as png textures.
*
* @version 0.1
* @author Ralph Schurade <schurade@gmx.de>
* @copyright Copyright (c) 2011, Ralph Schurade
* @link 
* @license http://www.opensource.org/licenses/bsd-license.php BSD License
*
*/

(function() {
	window.Niftii = function () {
		var data;
		var hdr = {};
				
		this.load = function(url) {
			var xhr = new XMLHttpRequest();
			xhr.open('GET', url, false);
			xhr.responseType = 'arraybuffer';

			xhr.onload = function(e) {
				data = new Uint8Array(this.response); // this.response == uInt8Array.buffer

				hdr.datatype = data[70] + data[71] * 256;
				hdr.dim0 = data[40] + data[41] * 256;
				hdr.dim1 = data[42] + data[43] * 256;
				hdr.dim2 = data[44] + data[45] * 256;
				hdr.dim3 = data[46] + data[47] * 256;
				hdr.dim4 = data[48] + data[49] * 256;
				hdr.dim5 = data[50] + data[51] * 256;
				hdr.dim6 = data[52] + data[53] * 256;
				hdr.dim7 = data[54] + data[54] * 256;
				
				if ( hdr.datatype === 16 ) {
					data = new Float32Array(this.response);
				}
				
				loaded = true;
					
			};
			xhr.send();
		};
	
		this.getImage = function (orient, pos) {
			if ( !loaded ) console.log( "DEBUG nifti file not finished loading");
			if ( hdr.datatype === 2 ) {
				if (hdr.dim4 === 1 ) {
					return getImageGrayByte(orient,pos);
				}
				if (hdr.dim4 === 3) {
					return getImageRGBByte(orient,pos);
				}
			}
			else if ( hdr.datatype === 16 ) {
				if (hdr.dim4 === 1 ) {
					return getImageGrayFloat(orient,pos);
				}
			}
		};
		
		function getImageGrayByte(orient, pos) {
			var c2d = document.createElement("canvas");
			c2d.width = 256;
			c2d.height = 256;
			var ctx = c2d.getContext("2d");
			var imageData = ctx.getImageData(0, 0, c2d.width, c2d.height);
			
			if ( orient === "axial" ) {
				for( var x = 0; x < hdr.dim1; ++x )
		        {
		            for( var y = 0; y < hdr.dim2; ++y )
		            {
		            	var col = data[getId(x,y,pos)];
		            	var index = 4 * (y * imageData.width + x);
		                imageData.data[index] = col;
		                imageData.data[index+1] = col;
		                imageData.data[index+2] = col;
		                imageData.data[index+3] = 255;
		            }
		        }
			}
			
			if ( orient === "coronal" ) {
				for( var x = 0; x < hdr.dim1; ++x )
		        {
		            for( var z = 0; z < hdr.dim3; ++z )
		            {
		            	var col = data[getId(x,pos,z)];
		            	var index = 4 * (z * imageData.width + x);
		            	imageData.data[index] = col;
		                imageData.data[index+1] = col;
		                imageData.data[index+2] = col;
		                imageData.data[index+3] = 255;
		            }
		        }
			}
			
			if ( orient === "sagittal" ) {
				for( var y = 0; y < hdr.dim2; ++y )
		        {
		            for( var z = 0; z < hdr.dim3; ++z )
		            {
		            	var col = data[getId(pos-1+1,y,z)];
		            	var index = 4 * (z * imageData.width + y);
		            	imageData.data[index] = col;
		                imageData.data[index+1] = col;
		                imageData.data[index+2] = col;
		                imageData.data[index+3] = 255;
		            }
		        }
			}
			
			return imageData;
		} 
		
		function getId(x,y,z) {
			return 352 + x + (y * hdr.dim1) + (z * hdr.dim1 * hdr.dim2);
		}
		
		function getIdFloat(x,y,z) {
			return 88 + x + (y * hdr.dim1) + (z * hdr.dim1 * hdr.dim2);
		}
		
		function getImageRGBByte(orient, pos) {
			var c2d = document.createElement("canvas");
			c2d.width = 256;
			c2d.height = 256;
			var ctx = c2d.getContext("2d");
			var imageData = ctx.getImageData(0, 0, c2d.width, c2d.height);
			
			var gOff = hdr.dim1 * hdr.dim2 * hdr.dim3;
			var bOff = 2 * gOff;
			
			if ( orient === "axial" ) {
				for( var x = 0; x < hdr.dim1; ++x )
		        {
		            for( var y = 0; y < hdr.dim2; ++y )
		            {
		            	var r = data[getId(x,y,pos)];
		            	var g = data[parseInt(getId(x,y,pos))+parseInt(gOff)];
		            	var b = data[parseInt(getId(x,y,pos))+parseInt(bOff)];
		            	var index = 4 * (y * imageData.width + x);
		            	imageData.data[index] = r;
		                imageData.data[index+1] = g;
		                imageData.data[index+2] = b;
		                imageData.data[index+3] = 255;
		            }
		        }
			}
			
			if ( orient === "coronal" ) {
				for( var x = 0; x < hdr.dim1; ++x )
		        {
		            for( var z = 0; z < hdr.dim3; ++z )
		            {
		                var r = data[getId(x,pos,z)];
		            	var g = data[getId(x,pos,z)+gOff];
		            	var b = data[getId(x,pos,z)+bOff];
		            	var index = 4 * (z * imageData.width + x);
		            	imageData.data[index] = r;
		                imageData.data[index+1] = g;
		                imageData.data[index+2] = b;
		                imageData.data[index+3] = 255;
		            }
		        }
			}
			
			if ( orient === "sagittal" ) {
				for( var y = 0; y < hdr.dim2; ++y )
		        {
		            for( var z = 0; z < hdr.dim3; ++z )
		            {
		                var r = data[getId(pos-1+1,y,z)];
		            	var g = data[getId(pos-1+1,y,z)+gOff];
		            	var b = data[getId(pos-1+1,y,z)+bOff];
		            	var index = 4 * (z * imageData.width + y);
		            	imageData.data[index] = r;
		                imageData.data[index+1] = g;
		                imageData.data[index+2] = b;
		                imageData.data[index+3] = 255;
		            }
		        }
			}
			
			return imageData;
		}
		
		function getImageGrayFloat(orient, pos) {
			var c2d = document.createElement("canvas");
			c2d.width = 256;
			c2d.height = 256;
			var ctx = c2d.getContext("2d");
			var imageData = ctx.getImageData(0, 0, c2d.width, c2d.height);
			
			if ( orient === "axial" ) {
				for( var x = 0; x < hdr.dim1; ++x )
		        {
		            for( var y = 0; y < hdr.dim2; ++y )
		            {
		            	var col = data[getIdFloat(x,y,pos)];
		            	var index = 4 * (y * imageData.width + x);
		                imageData.data[index] = col * 255;
		                imageData.data[index+1] = col * 255;
		                imageData.data[index+2] = col * 255;
		                imageData.data[index+3] = 255;
		            }
		        }
			}
			
			if ( orient === "coronal" ) {
				for( var x = 0; x < hdr.dim1; ++x )
		        {
		            for( var z = 0; z < hdr.dim3; ++z )
		            {
		            	var col = data[getIdFloat(x,pos,z)];
		            	var index = 4 * (z * imageData.width + x);
		            	imageData.data[index] = col * 255;
		                imageData.data[index+1] = col * 255;
		                imageData.data[index+2] = col * 255;
		                imageData.data[index+3] = 255;
		            }
		        }
			}
			
			if ( orient === "sagittal" ) {
				for( var y = 0; y < hdr.dim2; ++y )
		        {
		            for( var z = 0; z < hdr.dim3; ++z )
		            {
		            	var col = data[getIdFloat(pos-1+1,y,z)];
		            	var index = 4 * (z * imageData.width + y);
		            	imageData.data[index] = col * 255;
		                imageData.data[index+1] = col * 255;
		                imageData.data[index+2] = col * 255;
		                imageData.data[index+3] = 255;
		            }
		        }
			}
			
			return imageData;
		}
	};
})();