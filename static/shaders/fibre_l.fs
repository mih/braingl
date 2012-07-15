#ifdef GL_ES
precision highp float;
#endif

uniform float uAlpha;
uniform vec3 uFibreColor;
uniform bool uFibreColorMode;

varying vec4 vPosition;
varying vec3 vLightPos;
varying vec3 vNormal;
varying vec4 vColor;

void main(void) 
{
	vec3 uAmbientColor = vec3(0.4);
	vec3 uPointLightingDiffuseColor= vec3(0.6);

	vec3 lightDirection = normalize(vLightPos);

	vec3 color;
	if ( uFibreColorMode )
	{
		color = abs(vNormal);
	}
	else
	{
		color = uFibreColor;
	}
	vec4 fragmentColor = vec4(color, uAlpha);

	vec3 lightWeighting;

	float diffuseLightWeighting = max(dot(vNormal, lightDirection), 0.0);
		
	lightWeighting = uAmbientColor + uPointLightingDiffuseColor * diffuseLightWeighting;

	gl_FragColor = vec4(fragmentColor.rgb * lightWeighting * fragmentColor.a, fragmentColor.a);
}