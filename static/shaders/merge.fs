#ifdef GL_ES
precision highp float;
#endif

uniform sampler2D C0; // TEXTURE2 - opaque color map (minormode 4)
uniform sampler2D C1; // TEXTURE6 - color map for transparency render 1 (minormode 9)
uniform sampler2D C2; // TEXTURE7 - color map for transparency render 2 (minormode 10)
uniform sampler2D C3; // TEXTURE8 - color map for transparency render 3 (minormode 11)
uniform sampler2D D2; // TEXTURE5 - 2nd of two ping-pong depth maps (minormode 8); also used for C4
uniform vec2 uCanvasSize;

void main(void) {
    // need to combine colors from C0, C1, C2, C3, C4
    
    vec2 loc = vec2( gl_FragCoord.x/uCanvasSize.x, gl_FragCoord.y/uCanvasSize.y);
    vec4 c0 = texture2D(C0, loc);
    vec4 c1 = texture2D(C1, loc);
    vec4 c2 = texture2D(C2, loc);
    vec4 c3 = texture2D(C3, loc);
    vec4 c4 = texture2D(D2, loc);
    
    vec3 mcolor = c1.rgb*c1.a + 
                 (1.0-c1.a)*(c2.rgb*c2.a +
                 (1.0-c2.a)*(c3.rgb*c3.a +
                 (1.0-c3.a)*(c4.rgb*c4.a + 
                 (1.0-c4.a)*c0.rgb)));

	                 
	
    gl_FragColor = vec4 (mcolor, 1.0);
}