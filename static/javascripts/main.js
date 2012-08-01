requirejs.config({
    //By default load any module IDs from js/lib
    baseUrl: 'static/javascripts/util',
    //except, if the module ID starts with "app",
    //load it from the js/app directory. paths
    //config is relative to the baseUrl, and
    //never includes a ".js" extension since
    //the paths config could be for a directory.
    paths: {
        gfx: '../gfx',
    }
});

require(['jquery', 'ui', 'io', './gfx/viewer', './gfx/mygl', 'html5slider'], 
		function($, ui, io, viewer, mygl ) {
    $(function() {
    	// Sobald wir mit dem DOM arbeiten koennen,
        $(document).ready(function() {
        	/**
        	 * Provides requestAnimationFrame in a cross browser way.
        	 */
        	window.requestAnimFrame = (function() {
        	  return window.requestAnimationFrame ||
        	         window.webkitRequestAnimationFrame ||
        	         window.mozRequestAnimationFrame ||
        	         window.oRequestAnimationFrame ||
        	         window.msRequestAnimationFrame ||
        	         function(/* function FrameRequestCallback */ callback, /* DOMElement Element */ element) {
        	           window.setTimeout(callback, 1000/60);
        	         };
        	})();
        	
            if (!window.WebGLRenderingContext) {
                $('html').addClass('no-webgl');
            }
            
            // INIT VIEWER
            window.setTimeout(function() {
                var $vc = $('#viewer-canvas');
                $vc.attr({
                    'width': $vc.width(),
                    'height': $vc.height()
                });
                
                if (!$('#viewer-div').is('.deactivated')) {
                	// hier wird der eigentliche WebGL-Viewer initialisiert 
                	try {
                		mygl.initGL( $vc.get(0) );
                		mygl.initPeel();
                	} catch (e) {
                		console.error('webglNotSupported', e);
                		return;
                	}
                	                	
                	viewer.init({
                	    'backgroundColor': [0.99,0.99,0.98,1]
                	}, loadElements);
                	$(window).trigger('resize');
                };
            }, 200);
        });
        
        function loadElements() {
        	io.loadElements( ui.loadElementStart, ui.elementLoaded, ui.allElementsLoaded );
        }        
        
        
        // method for synchronous loading of json files
        // $.getJSON works asynchronous.
        $.getSyncJSON = function(url, callback) {
            return $.parseJSON(jQuery.ajax({
                'type': 'GET',
                'url': url,
                'success': callback,
                'dataType': 'json',
                'async': false
            }).responseText);
        };
    });
});
