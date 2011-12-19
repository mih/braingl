attribute vec3 aVertexPosition;
attribute vec3 aVertexNormal;
attribute vec4 aVertexColor;
attribute vec2 aTextureCoord;

uniform mat4 uMVMatrix;
uniform mat4 uPMatrix;
uniform mat3 uNMatrix;
uniform vec3 uPointLightingLocation;

varying vec4 vPosition;
varying vec3 vLightPos;
varying vec3 normal;
varying vec4 vColor;

void main(void) 
{
	vPosition = uPMatrix * uMVMatrix * vec4(aVertexPosition, 1.0);
	vLightPos = uPointLightingLocation;
	normal = normalize(aVertexNormal);
	vColor = aVertexColor;
	vec2 t = aTextureCoord;
	
	gl_Position = vPosition;
}