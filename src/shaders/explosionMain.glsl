#version 300 es
precision mediump float;

uniform vec3 iResolution;
uniform sampler2D inputTexture;
uniform vec2 textureResolution;

vec3 black = vec3(0);
vec3 red = vec3(1,0,0);
vec3 green = vec3(0,1,0);
float radius = 0.01;
float blurRange = 0.005;

out vec4 color;

float circle(vec2 pos, vec2 center, float radius){
    return 1.0 - smoothstep(radius-(radius*blurRange), radius+(radius*blurRange), length(pos-center));
}

void main()
{
    vec2 uv;
    if(iResolution.x > iResolution.y)
        uv = gl_FragCoord.xy/iResolution.y;
    else
        uv = gl_FragCoord.xy/iResolution.x;
	vec3 final = vec3(0.0);
    
    for(int y = 0; y < int(textureResolution.y); y++){
        for(int x = 0; x < int(textureResolution.x); x++){
            vec4 ball = texelFetch(inputTexture, ivec2(x,y),0);
            final += mix(black, red, circle(uv, ball.xy, radius));
        }
    }
    
    color = vec4(final,1.0);
}
