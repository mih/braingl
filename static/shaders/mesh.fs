#ifdef GL_ES
precision highp float;
#endif

uniform float uAlpha;

varying vec4 vPosition;
varying vec3 vLightPos;
varying vec3 vNormal;
varying vec3 vColor;

uniform vec2 uCanvasSize;
// uMinorMode = 0 render, 1 pick, 2 autoscale, 4 C0, 5 D0, 6 D1, 7 D2, 8 D1b, 9 C1, 10 C2, 11 C3, 12 C4
uniform int uMinorMode;

uniform sampler2D D0; // TEXTURE3 - opaque depth map (uMinorMode 5)
uniform sampler2D D1; // TEXTURE4 - 1st of two ping-pong depth maps (uMinorMode 6)
uniform sampler2D D2; // TEXTURE5 - 2nd of two ping-pong depth maps (uMinorMode 7); also used for C4


vec4 encode( float k ) 
{ // assumes k is >= 0
    if ( k <= 0.0 ) return vec4( 0.0, 0.0, 0.0, 0.0 );
    return vec4(
        floor( 256.0 * k) / 255.0,
        floor( 256.0 * fract( 256.0 * k ) ) / 255.0,
        floor( 256.0 * fract( 65536.0 * k ) ) / 255.0,
        0.0);
}

float decode( vec4 d ) 
{
    if ( length( d ) == 0.0 ) return 0.0;
    return ( 65536.0 * d[0] + 256.0 * d[1] + d[2] ) / 16777216.0;
}

vec3 lightAt( vec3 diffuse_color, vec3 specular_color )
{
	vec3 light_ambient = vec3( 0.4 );

	vec3 color;
	color = light_ambient * diffuse_color;

	vec3 L = vLightPos;
	L = normalize(L);

	color += specular_color * max( dot( vNormal, L ), 0.0 ) * diffuse_color;

	return color;
}

void main(void) 
{
	vec3 color = lightAt( vColor, vec3(.6,.6,.6) );
	if ( uMinorMode == 4 )
	{ 
		gl_FragColor = vec4( color, uAlpha );
	}
	else
	{
		vec2 loc = vec2(gl_FragCoord.x/uCanvasSize.x, gl_FragCoord.y/uCanvasSize.y);
    	float z = decode(encode(1.0-gl_FragCoord.z)); // bigger number => closer to camera; distance out of screen
		float zmin = decode( texture2D( D0, loc ) );
		float zmax;
    	if (uMinorMode == 9) 
    	{ // C1
	        if (z > zmin) 
	        {
	            gl_FragColor = vec4( color, uAlpha );
	        } 
	        else 
	        {
	            discard;
	        }
    	} 
    	else 
    	{
        	if (uMinorMode == 11) 
        	{ 
        		// C3 (11)
            	zmax = decode(texture2D(D2, loc));
        	} 
        	else 
        	{ 
        		// C2 (10) or C4 (12)
            	zmax = decode(texture2D(D1, loc));
        	}
        	if (zmin < z && z < zmax) {
            	gl_FragColor = vec4( color, uAlpha );
        	} 
        	else 
        	{
            	discard;
        	}
    	}
	}
}