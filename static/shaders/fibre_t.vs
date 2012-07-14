attribute vec3 aVertexPosition;
attribute vec3 aVertexNormal;
attribute vec2 aTextureCoord;

uniform mat4 uMVMatrix;
uniform mat4 uPMatrix;
uniform mat3 uNMatrix;
uniform vec3 uPointLightingLocation;
uniform float uZoom;
uniform float uThickness;

varying vec3 vNormal;
varying vec4 vPosition;

varying float tangent_dot_view;
varying vec3 tangentR3;
varying float s_param;
varying float vLocation;
varying vec3 vColor;

void main(void) 
{
	vPosition = uPMatrix * uMVMatrix * vec4(aVertexPosition, 1.0);
	vNormal = normalize(aVertexNormal);

	s_param = aTextureCoord.x; //< store texture coordinate for shader
	
	tangentR3 = vNormal;
	vec3 tangent;
	tangent = (uPMatrix * uMVMatrix * vec4(vNormal,0.)).xyz; //< transform our tangent vector
	float thickness = uThickness * uZoom / 120.;
	
	vec3 offsetNN = cross( normalize( tangent.xyz ), vec3( 0., 0., -1. ) );
	vec3 offset = normalize(offsetNN);
	tangent_dot_view = length(offsetNN);

	offset.x *= thickness;
	offset.y *= thickness;
	
	vPosition.xyz = ( offset * s_param ) + vPosition.xyz;

	gl_Position = vPosition; //< store final position
}