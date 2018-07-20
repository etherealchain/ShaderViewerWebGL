import WebglUtil from './lib/WebglUtil';
import ShaderToyRenderer from './ShaderToyRenderer';
import ComputeBuffer from './ComputeBuffer';
import Util from './lib/Util';
import Stats from 'stats.js';

var canvas, gl;
var renderer, computeBuffer;
var mouseDown = false;
var touchPoint = [-1000, -1000, -1000, -1000];
var bornIndex = 0;
var explosionDirection = 12;
var explosionPoint = 64;
var stats;
var maxPixels = 16384;
var windowWidth = 0;
var windowHeight = 0;
var glRatio = 0;

init();
animate();

function init() {
    canvas = document.createElement( 'canvas' );
    gl = canvas.getContext("webgl2");
    if(!gl){
        alert("no webgl 2.0 context");
        return;
    }
    const ext = gl.getExtension("EXT_color_buffer_float");
    if (!ext) {
        alert("need EXT_color_buffer_float");
        return;
    }
    renderer = new ShaderToyRenderer(gl,explosionDirection, explosionPoint);
    computeBuffer = new ComputeBuffer(gl,explosionDirection, explosionPoint);

    document.body.appendChild( canvas );
    // inverse y coord
    if(Util.mobileCheck()){
        canvas.ontouchcancel = (e) =>{
            // e.preventDefault();
            mouseDown = false;
            touchPoint[2] = -1000;
            touchPoint[3] = -1000;
        }
        canvas.ontouchstart = (e) => {
            // e.preventDefault();
            mouseDown = true;
            touchPoint[0] = e.targetTouches[0].pageX;
            touchPoint[1] = gl.canvas.height - e.targetTouches[0].pageY;
            touchPoint[2] = e.targetTouches[0].pageX;
            touchPoint[3] = gl.canvas.height - e.targetTouches[0].pageY;
        }
        canvas.ontouchend = (e) =>{
            // e.preventDefault();
            mouseDown = false;
            touchPoint[2] = -1000;
            touchPoint[3] = -1000;
        }
        canvas.ontouchmove = (e) => {
            // e.preventDefault();
            touchPoint[0] = e.targetTouches[0].pageX;
            touchPoint[1] = gl.canvas.height - e.targetTouches[0].pageY;
        }
        // isMobile = true;
        // Util.changeCSS('mobile.css',0);
        // if(window.innerHeight > glHeight){
        //     ratio = window.innerWidth/ window.innerHeight;
        //     WebglUtil.resizeCanvas(gl, ratio*glHeight, glHeight);
        // }
        // else{
        // }
    }
    else{
        canvas.onmousedown = (e) =>{
            mouseDown = true;
            touchPoint[0] = e.pageX * glRatio;
            touchPoint[1] = (gl.canvas.clientHeight - e.pageY) * glRatio;
            touchPoint[2] = e.pageX * glRatio;
            touchPoint[3] = (gl.canvas.clientHeight - e.pageY) * glRatio;
        }
        canvas.onmouseup = (e)=>{
            mouseDown = false;
            touchPoint[0] = e.pageX * glRatio;
            touchPoint[1] = (gl.canvas.clientHeight - e.pageY) * glRatio;
            touchPoint[2] = -1000;
            touchPoint[3] = -1000;
        }
        canvas.onmousemove = (e)=>{
            if(mouseDown){
                touchPoint[0] = e.pageX * glRatio;
                touchPoint[1] = (gl.canvas.clientHeight - e.pageY) * glRatio;
            }
        }
        // isMobile = false;
    }
    stats = new Stats();
    stats.showPanel(0);
    document.body.appendChild(stats.dom);
}

function animate() {
    preProcess();
    render();
    postProcess();
    stats.update();

    requestAnimationFrame( animate );
}
function preProcess(){
    computeBuffer.setiMouse(touchPoint);
    let size =  WebglUtil.resizeCanvas(maxPixels, windowWidth, windowHeight ,gl);
    windowWidth = size[0];
    windowHeight = size[1];
    if(size[2] != 0)
        glRatio = size[2];
}
function render() {
    computeBuffer.compute();
    renderer.render();
}
function postProcess(){
    if(mouseDown){
        updateBornIndex();
        computeBuffer.setLastDownPosition(touchPoint[0],touchPoint[1]);
        computeBuffer.setIsMouseDownBefore(1);
    }
    else{
        computeBuffer.setIsMouseDownBefore(0);
    }
}

function updateBornIndex(){
    bornIndex += 1;
    if(bornIndex > explosionPoint -1){
        bornIndex = 0;
    }
    computeBuffer.setBornIndex(bornIndex);
}