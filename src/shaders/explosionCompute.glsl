#version 300 es
precision mediump float;

#define TWO_PI 6.28318530718
#define THRES 0.9 

uniform sampler2D iChannel0;
uniform vec3 iResolution;
uniform vec4 iMouse;
uniform int iFrame;
uniform float iTime;
uniform float iTimeDelta;

uniform int bornIndex;
uniform vec2 lastDownPoint;
uniform int isMouseDownBefore;

out vec4 color;

vec4 posVel;

void updatePoint(ivec2 index, vec2 mousePoint){
    if( index.y == bornIndex){
        switch(index.x){
            case 0:
            posVel.zw = vec2(1,0);
            break;
            case 1:
            posVel.zw = vec2(sqrt(3.0)/2.0,0.5);
            break;
            case 2:
            posVel.zw = vec2(0.5, sqrt(3.0)/2.0);
            break;
            case 3:
            posVel.zw = vec2(0,1);
            break;
            case 4:
            posVel.zw = vec2(-0.5, sqrt(3.0)/2.0);
            break;
            case 5:            
            posVel.zw = vec2(-sqrt(3.0)/2.0,0.5);
            break;
            case 6:
            posVel.zw = vec2(-1,0);
            break;
            case 7:
            posVel.zw = vec2(-sqrt(3.0)/2.0,-0.5);
            break;
            case 8:
            posVel.zw = vec2(-0.5, -sqrt(3.0)/2.0);
            break;
            case 9:
            posVel.zw = vec2(0, -1);
            break;
            case 10:
            posVel.zw = vec2(0.5, -sqrt(3.0)/2.0);
            break;
            case 11:
            posVel.zw = vec2(sqrt(3.0)/2.0,-0.5);
            break;
        }
        posVel.xy = mousePoint + posVel.zw*iTimeDelta;
    }
    else{
        posVel.xy += posVel.zw*iTimeDelta;
    }
}
void main()
{
    ivec2 index = ivec2(gl_FragCoord.xy - 0.5);
    vec2 mos;
    if(iResolution.x > iResolution.y){
        mos = iMouse.xy/iResolution.y;
    }
    else{
        mos = iMouse.xy/iResolution.x;
    }
    posVel = texelFetch(iChannel0, index ,0);
    if(iFrame == 0){
        posVel.xy = vec2(-10,-10);
        posVel.zw = vec2(0,0);
    }
    if(iMouse.z > 0.0 && (isMouseDownBefore == 0 || iMouse.xy != lastDownPoint || sin(iTime*TWO_PI*5.0) > THRES) ){
        updatePoint(index, mos);
    }
    else{
        posVel.xy += posVel.zw*iTimeDelta;
    }
    
    color = posVel;
}