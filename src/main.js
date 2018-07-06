import WebglUtil from './lib/WebglUtil';
import ShaderToyRenderer from './ShaderToyRenderer';
import ComputeBuffer from './ComputeBuffer';
import Util from './lib/Util';
import Clock from './Clock';
import Stats from 'stats.js';

var canvas, gl;
var renderer, computeBuffer;
var mouseDown = false;
var touchPoint = [-1000, -1000, -1000, -1000];
var bornIndex = 0;
var explosionDirection = 12;
var explosionPoint = 64;
var isMobile = false;
var glHeight= 512;
var stats, timer;
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
    timer = new Clock(false);

    document.body.appendChild( canvas );
    // inverse y coord
    if(Util.mobileCheck()){
        canvas.ontouchstart = (e) => {
            mouseDown = true;
            touchPoint[0] = e.targetTouches[0].pageX;
            touchPoint[1] = gl.canvas.height - e.targetTouches[0].pageY;
            touchPoint[2] = e.targetTouches[0].pageX;
            touchPoint[3] = gl.canvas.height - e.targetTouches[0].pageY;
        }
        canvas.ontouchend = (e) =>{
            mouseDown = false;
            touchPoint[0] = e.targetTouches[0].pageX;
            touchPoint[1] = gl.canvas.height - e.targetTouches[0].pageY;
            touchPoint[2] = -1000;
            touchPoint[3] = -1000;
        }
        canvas.ontouchmove = (e) => {
            touchPoint[0] = e.targetTouches[0].pageX;
            touchPoint[1] = gl.canvas.height - e.targetTouches[0].pageY;
        }
        isMobile = true;
        Util.changeCSS('mobile.css',0);
        // if(window.innerHeight > glHeight){
        //     ratio = window.innerWidth/ window.innerHeight;
        //     WebglUtil.resizeCanvas(gl, ratio*glHeight, glHeight);
        // }
        // else{
            WebglUtil.resizeCanvas(gl);
        // }
    }
    else{
        canvas.onmousedown = (e) =>{
            mouseDown = true;
            touchPoint[0] = e.pageX;
            touchPoint[1] = gl.canvas.height - e.pageY;
            touchPoint[2] = e.pageX;
            touchPoint[3] = gl.canvas.height - e.pageY;
        }
        canvas.onmouseup = (e)=>{
            mouseDown = false;
            touchPoint[0] = e.pageX;
            touchPoint[1] = gl.canvas.height - e.pageY;
            touchPoint[2] = -1000;
            touchPoint[3] = -1000;
        }
        canvas.onmousemove = (e)=>{
            if(mouseDown){
                touchPoint[0] = e.pageX;
                touchPoint[1] = gl.canvas.height - e.pageY;
            }
        }
        isMobile = false;
        WebglUtil.resizeCanvas(gl);
    }
    
    timer.start();
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
    // if(isMobile){
    //     WebglUtil.resizeCanvas(gl);
    // }
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