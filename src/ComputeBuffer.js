
import WebglUtil from './lib/WebglUtil';
import shaderToyVexterShader from './shaders/ShaderToyVexter.glsl';
import explosionCompute from './shaders/explosionCompute.glsl';
import Clock from './Clock';

class ComputeBuffer{

    constructor(gl, width, height){
        this.gl = gl;
        this.textureWidth = width;
        this.textureHeight = height;
        this.frameCount = -1;
        this.textures = [];
        this.frameBuffers = [];
        this.currentTexture = 0;
        this.computeProgram = WebglUtil.createProgramFromSources(this.gl, [shaderToyVexterShader, explosionCompute]);

        for(let i =0 ; i < 2 ; i++){
            let texture = this.createTexture();
            this.textures.push(texture);

            let fbo = this.gl.createFramebuffer();
            this.frameBuffers.push(fbo);
            this.gl.bindFramebuffer(this.gl.FRAMEBUFFER, fbo);
            this.gl.framebufferTexture2D(this.gl.FRAMEBUFFER, this.gl.COLOR_ATTACHMENT0, this.gl.TEXTURE_2D, texture, 0);
        }
        
        // unifrom location
        this.resolutionLocation = this.gl.getUniformLocation(this.computeProgram, "iResolution");
        this.mouseLocation = this.gl.getUniformLocation(this.computeProgram, "iMouse");
        this.frameLocation = this.gl.getUniformLocation(this.computeProgram, "iFrame");
        this.timeLocation = this.gl.getUniformLocation(this.computeProgram, "iTime");
        this.timeDeltaLocation = this.gl.getUniformLocation(this.computeProgram, "iTimeDelta");
        this.bornIndexLocation = this.gl.getUniformLocation(this.computeProgram, "bornIndex");
        this.lastDownLocation = this.gl.getUniformLocation(this.computeProgram, "lastDownPoint");
        this.isMouseDownLocation = this.gl.getUniformLocation(this.computeProgram, "isMouseDownBefore");

        this.gl.useProgram(this.computeProgram);
        this.gl.uniform1i(this.bornIndexLocation, 0);
        this.gl.uniform1i(this.isMouseDownLocation, 0);

        this.clock = new Clock(true);
    }
    createTexture(){
        let texture = this.gl.createTexture();
        this.gl.bindTexture(this.gl.TEXTURE_2D, texture);
        this.gl.texImage2D(this.gl.TEXTURE_2D, 0, this.gl.RGBA32F, this.textureWidth, this.textureHeight, 0, this.gl.RGBA, this.gl.FLOAT, null);
        this.gl.texParameteri(this.gl.TEXTURE_2D, this.gl.TEXTURE_WRAP_S, this.gl.CLAMP_TO_EDGE);
        this.gl.texParameteri(this.gl.TEXTURE_2D, this.gl.TEXTURE_WRAP_T, this.gl.CLAMP_TO_EDGE);
        this.gl.texParameteri(this.gl.TEXTURE_2D, this.gl.TEXTURE_MIN_FILTER, this.gl.NEAREST);
        this.gl.texParameteri(this.gl.TEXTURE_2D, this.gl.TEXTURE_MAG_FILTER, this.gl.NEAREST);
        return texture;
    }
    compute(){

        this.frameCount++;
        this.gl.useProgram(this.computeProgram);

        this.gl.bindFramebuffer(this.gl.FRAMEBUFFER, this.frameBuffers[this.currentTexture]);
        this.gl.viewport(0, 0, this.textureWidth, this.textureHeight);

        this.gl.uniform3fv(this.resolutionLocation, [this.gl.canvas.width, this.gl.canvas.height, 1]);
        this.gl.uniform1i(this.frameLocation, this.frameCount);
        this.gl.uniform1f(this.timeDeltaLocation, this.clock.getDelta());
        this.gl.uniform1f(this.timeLocation, this.clock.elapsedTime);
        
        this.gl.drawArrays(this.gl.TRIANGLES, 0, 6);

        this.gl.bindTexture(this.gl.TEXTURE_2D, this.textures[this.currentTexture]);
        this.currentTexture = this.currentTexture ^ 1;
    }
    setBornIndex(index){
        this.gl.useProgram(this.computeProgram);
        this.gl.uniform1i(this.bornIndexLocation, index);
    }
    setLastDownPosition(x,y){
        this.gl.useProgram(this.computeProgram);
        this.gl.uniform2fv(this.lastDownLocation, [x,y]);
    }
    setIsMouseDownBefore(isMouseDownBefore){
        this.gl.useProgram(this.computeProgram);
        this.gl.uniform1i(this.isMouseDownLocation, isMouseDownBefore);
    }
    setiMouse(p){
        this.gl.useProgram(this.computeProgram);
        this.gl.uniform4fv(this.mouseLocation, p);
    }
}
export default ComputeBuffer;