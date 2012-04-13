#ifdef GL_ES
precision highp float;
#endif

uniform float uAlpha;
uniform bool uCutWhite;
uniform bool uPicking;
uniform vec3 uPickColor;

uniform vec3 uFibreColor;
uniform bool uFibreColorMode;

varying vec4 vPosition;
varying vec3 vLightPos;
varying vec3 normal;
varying vec4 vColor;
varying vec2 vTex;

void main(void) 
{
	if ( uPicking )
	{
		gl_FragColor = vec4(uPickColor,1.0);
	}
	else
	{
		vec3 uAmbientColor = vec3(0.4);
		vec3 uPointLightingDiffuseColor= vec3(0.6);
	
		vec3 lightDirection = normalize(vLightPos);
	
		vec3 color;
		if ( uFibreColorMode )
		{
			color = abs(normal);
		}
		else
		{
			color = uFibreColor;
		}
		vec4 fragmentColor = vec4(color, uAlpha);
	
		vec3 lightWeighting;
	
		float diffuseLightWeighting = max(dot(normal, lightDirection), 0.0);
			
		lightWeighting = uAmbientColor + uPointLightingDiffuseColor * diffuseLightWeighting;
	
		gl_FragColor = vec4(fragmentColor.rgb * lightWeighting * fragmentColor.a, fragmentColor.a);

	}
}