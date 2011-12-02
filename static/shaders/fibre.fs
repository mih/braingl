#ifdef GL_ES
precision highp float;
#endif

uniform bool uIsHighlighted;
uniform bool uSomethingHighlighted;

uniform vec3 uFibreColor;
uniform bool uFibreColorMode;

uniform bool uPicking;
uniform vec3 uPickColor;

varying vec3 normal;
varying vec4 vPosition;

varying vec3 tangentR3; // Tangent vector in world space
varying float s_param; // s parameter of texture [-1..1]
varying float tangent_dot_view;

// variables for blob animation
uniform bool uAnimate;
uniform float uSpeed;
uniform float uBlobSize;
uniform float uDistance;
uniform float uLength;
uniform int uTimestep;
varying float vLocation;


void main(void) 
{
	if ( uPicking )
	{
		gl_FragColor = vec4(uPickColor,1.0);
	}
	else
	{
		vec3 color;
		
		if ( uFibreColorMode )
		{
			color = abs(normalize(tangentR3));
		}
		else
		{
			color = uFibreColor;
		}
	
		if ( uSomethingHighlighted && !uIsHighlighted )
		{
			color = vec3( 0.4, 0.4, 0.4 );
		}
		
		color *= min(1.0, vLocation + 0.3);
		
		if (uAnimate)
		{
			float pix = uLength * vLocation;
		
			float blobStep = (uLength + uBlobSize) / 100.0 * uSpeed;
			float blobBegin = uBlobSize;
			float blobEnd = blobBegin - uBlobSize;
			float pixModulo = mod(pix - float(uTimestep) * blobStep, blobBegin + uDistance);
			
			if (  pixModulo >= blobEnd && pixModulo < blobBegin )
			{
				color = vec3(1.0);
			} 			
		}
		
		vec3 view = vec3(0., 0., -1.);
	    float view_dot_normal = sqrt(1. - s_param * s_param) + .1;
	
	    gl_FragColor.rgb = clamp(view_dot_normal * (color + 0.15 * pow( view_dot_normal, 10.) *
							pow(tangent_dot_view, 10.) ), 0., 1.); //< set the color of this fragment (i.e. pixel)
					
		gl_FragColor.a = 1.0;
	}	
}