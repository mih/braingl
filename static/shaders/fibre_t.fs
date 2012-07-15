#ifdef GL_ES
precision highp float;
#endif

uniform float uAlpha;

uniform vec3 uFibreColor;
uniform bool uFibreColorMode;

varying vec3 vNormal;
varying vec4 vPosition;

varying vec3 vTangentR3; // Tangent vector in world space
varying float vS_param; // s parameter of texture [-1..1]
varying float vTangent_dot_view;

void main(void) 
{
	vec3 color;
	
	if ( uFibreColorMode )
	{
		color = abs(normalize(vTangentR3));
	}
	else
	{
		color = uFibreColor;
	}
	

	vec3 view = vec3(0., 0., -1.);
    float view_dot_normal = sqrt(1. - vS_param * vS_param) + .1;

    gl_FragColor.rgb = clamp(view_dot_normal * (color + 0.15 * pow( view_dot_normal, 10.) *
						pow(vTangent_dot_view, 10.) ), 0., 1.); //< set the color of this fragment (i.e. pixel)
				
	gl_FragColor.a = uAlpha;
	
}