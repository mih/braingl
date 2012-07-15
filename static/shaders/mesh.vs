attribute vec3 aVertexPosition;
attribute vec3 aVertexNormal;
attribute vec3 aVertexColor;

uniform mat4 uMVMatrix;
uniform mat4 uPMatrix;
uniform mat3 uNMatrix;
uniform vec3 uLightLocation;

varying vec4 vPosition;
varying vec3 vLightPos;
varying vec3 vNormal;
varying vec3 vColor;

void main(void) 
{
	vPosition = uPMatrix * uMVMatrix * vec4( aVertexPosition, 1.0);
	vLightPos = uLightLocation;
	vNormal = normalize(aVertexNormal);
	vColor = aVertexColor;
	
	gl_Position = vPosition;
}