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

uniform vec2 uCanvasSize;
// uMinorMode = 0 render, 1 pick, 2 autoscale, 4 C0, 5 D0, 6 D1, 7 D2, 8 D1b, 9 C1, 10 C2, 11 C3, 12 C4
uniform int uMinorMode;

uniform sampler2D D0; // TEXTURE3 - opaque depth map (uMinorMode 5)
uniform sampler2D D1; // TEXTURE4 - 1st of two ping-pong depth maps (uMinorMode 6)
uniform sampler2D D2; // TEXTURE5 - 2nd of two ping-pong depth maps (uMinorMode 7); also used for C4

vec4 encode( float k ) 
{ // assumes k is >= 0
    if ( k <= 0.0 ) return vec4( 0.0, 0.0, 0.0, 0.0 );
    return vec4(
        floor( 256.0 * k) / 255.0,
        floor( 256.0 * fract( 256.0 * k ) ) / 255.0,
        floor( 256.0 * fract( 65536.0 * k ) ) / 255.0,
        0.0);
}

float decode( vec4 d ) 
{
    if ( length( d ) == 0.0 ) return 0.0;
    return ( 65536.0 * d[0] + 256.0 * d[1] + d[2] ) / 16777216.0;
}

void main(void) 
{
	// create depth map, D0 (5); ping-pong D1 (6) and D2 (7)
    vec4 c = encode(1.0-gl_FragCoord.z);
    float z = decode(c);
    if (uMinorMode == 5) 
    { // D0
        gl_FragColor = c;
    } 
    else 
    {
        vec2 loc = vec2( gl_FragCoord.x/uCanvasSize.x, gl_FragCoord.y/uCanvasSize.y );
        float zmin = decode( texture2D( D0, loc ) );
        float zmax;
        if ( uMinorMode == 6 ) 
        { // first creation of D1
            if (z > zmin) 
            {
                gl_FragColor = c;
            } else 
            {
                discard;
            }
        } 
        else 
        {
            if (uMinorMode == 7) 
            {
                zmax = decode(texture2D(D1, loc)); // create D2
            } 
            else 
            {
                zmax = decode(texture2D(D2, loc)); // D1b; create D1 again
            }
            if (zmin < z && z < zmax) 
            {
                gl_FragColor = c;
            } 
            else 
            {
                discard; // All pixels are discarded, since (zmax < z && z < zmax) is always false
            }
        }
    }
}