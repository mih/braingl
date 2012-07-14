#ifdef GL_ES
precision highp float;
#endif


uniform float uAlpha;
uniform bool uPicking;
uniform vec3 uPickColor;

varying vec4 vPosition;
varying vec3 vLightPos;
varying vec3 vNormal;
varying vec4 vColor;

void main(void) 
{
	vec3 uAmbientColor = vec3(0.4);
	vec3 uPointLightingDiffuseColor= vec3(0.6);

	vec4 fragmentColor = vColor;
	fragmentColor.a = uAlpha;
	vec3 lightDirection = normalize(vLightPos);
	
	if ( fragmentColor.a < 1.0 )
	{
		float dir = dot(vNormal, lightDirection);
		if ( dir < 0.0 )
		{
			discard;
		}
	}

	if ( uPicking )
	{
		gl_FragColor = vec4(uPickColor,1.0);
	}
	else
	{
		vec3 lightWeighting;
	
		float diffuseLightWeighting = max(dot(vNormal, lightDirection), 0.0);
			
		lightWeighting = uAmbientColor + uPointLightingDiffuseColor * diffuseLightWeighting;
	
		gl_FragColor = vec4(fragmentColor.rgb * lightWeighting * fragmentColor.a, fragmentColor.a);

	}
}