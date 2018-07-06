import WebglUtil from './lib/WebglUtil';
import shaderToyVexterShader from './shaders/ShaderToyVexter.glsl';
import explosionMain from './shaders/explosionMain.glsl';

class ShaderToyRenderer{
    constructor(gl, texWidth, texHeight){
        this.gl = gl;
        this.mainProgram = WebglUtil.createProgramFromSources(this.gl, [shaderToyVexterShader, explosionMain]);
        
        // vertex array
        this.vao = this.gl.createVertexArray();

        // create position buffer
        let positionBuffer = this.gl.createBuffer();
        this.gl.bindBuffer(this.gl.ARRAY_BUFFER, positionBuffer);
        this.gl.bufferData(this.gl.ARRAY_BUFFER, new Float32Array([
            -1.0, -1.0,
             1.0, -1.0,
            -1.0,  1.0,
            -1.0,  1.0,
             1.0, -1.0,
             1.0,  1.0,
        ]), this.gl.STATIC_DRAW);

        // bind attribute to buffer
        this.gl.bindVertexArray(this.vao);
        let posAttribLocation = this.gl.getAttribLocation(this.mainProgram, "a_position");
        this.gl.enableVertexAttribArray(posAttribLocation);
        this.gl.vertexAttribPointer(posAttribLocation, 2, this.gl.FLOAT, false, 0, 0);

        // uniform location
        this.resolutionLocation = this.gl.getUniformLocation(this.mainProgram, "iResolution");
        this.textureResLocation = this.gl.getUniformLocation(this.mainProgram, "textureResolution");
        this.gl.useProgram(this.mainProgram);
        this.gl.uniform2fv(this.textureResLocation, [texWidth, texHeight]);
    }
    render(){
        this.gl.useProgram(this.mainProgram);
        this.gl.bindFramebuffer(this.gl.FRAMEBUFFER, null);
        this.gl.viewport(0, 0, this.gl.drawingBufferWidth, this.gl.drawingBufferHeight);

        this.gl.uniform3fv(this.resolutionLocation, [this.gl.canvas.width, this.gl.canvas.height,1]);

        this.gl.clearColor(0, 0, 0, 0);
        this.gl.clear(this.gl.COLOR_BUFFER_BIT | this.gl.DEPTH_BUFFER_BIT);
        
        this.gl.drawArrays(this.gl.TRIANGLES, 0, 6);
    }
}
export default ShaderToyRenderer;