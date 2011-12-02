#ifdef GL_ES
precision highp float;
#endif

varying vec2 vTextureCoord;
varying vec3 vTransformedNormal;
varying vec4 vPosition;
varying vec4 vColor;

uniform int uColorMap;

uniform sampler2D uSampler;
uniform sampler2D uSampler1;

vec3 rainbowColorMap( in float value )
{
	value *= 5.0;
	vec3 color;
	if( value < 0.0 )
		color = vec3( 0.0, 0.0, 0.0 );
	else if( value < 1.0 )
		color = vec3( 0.0, value, 1.0 );
	else if( value < 2.0 )
		color = vec3( 0.0, 1.0, 2.0-value );
	else if( value < 3.0 )
		color =  vec3( value-2.0, 1.0, 0.0 );
	else if( value < 4.0 )
		color = vec3( 1.0, 4.0-value, 0.0 );
	else if( value <= 5.0 )
		color = vec3( 1.0, 0.0, value-4.0 );
	else
		color = vec3( 1.0, 0.0, 1.0 );
	return color;
}

vec3 redYellowColorMap( in float value )
{
	vec3 color = vec3(0);
	color.r = 1.0;
	color.g = value;
	return color;
}

vec3 blueLightblueColorMap( in float value )
{
	vec3 color = vec3(0);
	color.b = 1.0;
	color.g = value;
	return color;
}

void main(void) {
	
	vec4 fragmentColor = texture2D(uSampler, vec2(vTextureCoord.s, vTextureCoord.t));
	vec4 fragmentColor1 = texture2D(uSampler1, vec2(vTextureCoord.s, vTextureCoord.t));
	
	// if present show secondary texture
	if ( ( fragmentColor1.r + fragmentColor1.g + fragmentColor1.b ) > 0.01 )
	{
		if ( uColorMap != 0 )
		{
			vec3 c;
			if ( uColorMap == 1 )
			{
				c = redYellowColorMap( fragmentColor1.r );
			}
			if ( uColorMap == 2 )
			{
				c = blueLightblueColorMap( fragmentColor1.r );
			}
			if ( uColorMap == 3 )
			{
				c = rainbowColorMap( fragmentColor1.r );
			}
			fragmentColor = vec4(mix(fragmentColor.rgb, c, 1.0), 1.0 );
		}
		else
		{
			fragmentColor = vec4(mix(fragmentColor.rgb, fragmentColor1.rgb, 1.0), 1.0 );
		}
	}
	
	// color texture, discard zero values
	if ( ( ( fragmentColor.r + fragmentColor.g + fragmentColor.b ) / 3.0 ) < 0.001 )
		discard;
	
	gl_FragColor = vec4(fragmentColor.r, fragmentColor.g, fragmentColor.b, fragmentColor.a);
}