#ifdef GL_ES
precision highp float;
#endif

varying vec3 normal;
varying vec4 vPosition;
varying vec4 vColor;
varying vec3 vLightPos;

uniform float uAlpha;

uniform bool uPicking;
uniform vec3 uPickColor;

uniform bool uCutWhite;

void main(void) 
{
	vec3 uAmbientColor = vec3(0.4);
	vec3 uPointLightingDiffuseColor= vec3(0.6);

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
	
		gl_FragColor = vec4(fragmentColor.rgb * lightWeighting * fragmentColor.a, fragmentColor.a);

	}
}