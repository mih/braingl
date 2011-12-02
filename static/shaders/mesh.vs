attribute vec3 aVertexPosition;
attribute vec3 aVertexNormal;
attribute vec4 aVertexColor;

uniform mat4 uMVMatrix;
uniform mat4 uPMatrix;
uniform mat3 uNMatrix;
uniform vec3 uPointLightingLocation;

varying vec3 normal;
varying vec4 vPosition;
varying vec4 vColor;
varying vec3 vLightPos;

void main(void) 
{
	vPosition = uPMatrix * uMVMatrix * vec4(aVertexPosition, 1.0);

	vLightPos = uPointLightingLocation;
	
	normal = normalize(aVertexNormal);
	
	vColor = aVertexColor;
	
	gl_Position = vPosition;
}