attribute vec3 aVertexPosition;
attribute vec3 aVertexNormal;
attribute vec2 aTextureCoord;

uniform mat4 uMVMatrix;
uniform mat4 uPMatrix;
uniform mat3 uNMatrix;
uniform vec3 uPointLightingLocation;
uniform float uZoom;
uniform float uThickness;
uniform float uBarShift;

varying vec3 normal;
varying vec4 vPosition;

varying float tangent_dot_view;
varying vec3 tangentR3;
varying float s_param;
varying float vLocation;

void main(void) 
{
	vPosition = uPMatrix * uMVMatrix * vec4(aVertexPosition, 1.0);
	normal = normalize(aVertexNormal);

	s_param = aTextureCoord.x; //< store texture coordinate for shader
	vLocation = aTextureCoord.y;

	tangentR3 = normal;
	vec3 tangent;
	tangent = (uPMatrix * uMVMatrix * vec4(normal,0.)).xyz; //< transform our tangent vector
	float thickness = uThickness * uZoom / 120.;
	
	vec3 offsetNN = cross( normalize( tangent.xyz ), vec3( 0., 0., -1. ) );
	vec3 offset = normalize(offsetNN);
	tangent_dot_view = length(offsetNN);

	offset.x *= thickness;
	offset.y *= thickness;
	
	if ( uBarShift < 0. )
	{
		if (s_param > 0.)
			vPosition.xyz = ( 2.0 * offset * s_param ) + vPosition.xyz; //< add offset in y-direction (eye-space)
	}
	else if ( uBarShift > 0. )
	{
		if (s_param > 0.0)
			vPosition.xyz = ( 2.0 * offset * s_param ) + vPosition.xyz; //< add offset in y-direction (eye-space)
	}
	else
		vPosition.xyz = ( offset * s_param ) + vPosition.xyz;

	gl_Position = vPosition; //< store final position
}