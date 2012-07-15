#ifdef GL_ES
precision highp float;
#endif

uniform float uAlpha;

varying vec4 vPosition;
varying vec3 vLightPos;
varying vec3 vNormal;
varying vec3 vColor;

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

	gl_FragColor = vec4( color, uAlpha );
}