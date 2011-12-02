#ifdef GL_ES
precision highp float;
#endif

varying vec3 normal;
varying vec4 vPosition;
varying vec4 vColor;
varying vec3 vLightPos;


uniform vec3 uAmbientColor;
uniform vec3 uPointLightingDiffuseColor;
uniform bool useLight;
uniform float uAlpha;

uniform bool uIsHighlighted;
uniform bool uSomethingHighlighted;

uniform bool uPicking;
uniform vec3 uPickColor;

uniform bool uCutWhite;

void main(void) 
{
	vec4 fragmentColor = vColor;
	fragmentColor.a = uAlpha;
	vec3 lightDirection = normalize(vLightPos);
	
	if ( fragmentColor.a < 1.0 )
	{
		float dir = dot(normal, lightDirection);
		if ( dir < 0.0 )
		{
			discard;
		}
	}
	
	
	if ( uCutWhite && ( ( vColor.r + vColor.g + vColor.b ) != 3.0 ) )
	{
		fragmentColor.a = 1.0;
	}

	if ( uPicking )
	{
		gl_FragColor = vec4(uPickColor,1.0);
	}
	else
	{
		vec3 lightWeighting;
	
		float diffuseLightWeighting = max(dot(normal, lightDirection), 0.0);
			
		lightWeighting = uAmbientColor + uPointLightingDiffuseColor * diffuseLightWeighting;
	
		if ( uSomethingHighlighted && !uIsHighlighted )
		{
			fragmentColor = vec4( 0.4, 0.4, 0.4, fragmentColor.a );
		}
		
		gl_FragColor = vec4(fragmentColor.rgb * lightWeighting * fragmentColor.a, fragmentColor.a);

	}
}