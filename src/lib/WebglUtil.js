class WebglUtil{
    constructor(){

    }
    static error(msg){
        console.error(msg);
    }
    static loadShader(gl, shaderSource, shaderType, opt_errorCallback) {
        let errFn = opt_errorCallback || this.error;
        // Create the shader object
        let shader = gl.createShader(shaderType);
    
        // Load the shader source
        gl.shaderSource(shader, shaderSource);
    
        // Compile the shader
        gl.compileShader(shader);
    
        // Check the compile status
        let compiled = gl.getShaderParameter(shader, gl.COMPILE_STATUS);
        if (!compiled) {
          // Something went wrong during compilation; get the error
          let lastError = gl.getShaderInfoLog(shader);
          errFn("*** Error compiling shader '" + shader + "':" + lastError);
          gl.deleteShader(shader);
          return null;
        }
        return shader;
    }

    static createProgram( gl, shaders, opt_attribs, opt_locations, opt_errorCallback) {
        let errFn = opt_errorCallback || this.error;
        let program = gl.createProgram();
        shaders.forEach(function(shader) {
            gl.attachShader(program, shader);
        });
        if (opt_attribs) {
            opt_attribs.forEach(function(attrib, ndx) {
            gl.bindAttribLocation(
                program,
                opt_locations ? opt_locations[ndx] : ndx,
                attrib);
            });
        }
        gl.linkProgram(program);
    
        // Check the link status
        let linked = gl.getProgramParameter(program, gl.LINK_STATUS);
        if (!linked) {
            // something went wrong with the link
            let lastError = gl.getProgramInfoLog(program);
            errFn("Error in program linking:" + lastError);
    
            gl.deleteProgram(program);
            return null;
        }
        return program;
    }

    static createProgramFromSources( gl, shaderSources, opt_attribs, opt_locations, opt_errorCallback) {
        let shaders = [];
        let defaultShaderType = [
            "VERTEX_SHADER",
            "FRAGMENT_SHADER",
        ];
        for (let ii = 0; ii < shaderSources.length; ++ii) {
            shaders.push(this.loadShader( gl, shaderSources[ii], gl[defaultShaderType[ii]], opt_errorCallback));
        }
        return this.createProgram(gl, shaders, opt_attribs, opt_locations, opt_errorCallback);
    }

    static resizeCanvasToDisplaySize(gl, multiplier) {
        multiplier = multiplier || 1;
        let width  = gl.canvas.clientWidth  * multiplier | 0;
        let height = gl.canvas.clientHeight * multiplier | 0;
        if (gl.canvas.width !== width ||  gl.canvas.height !== height) {
            gl.canvas.width  = width;
            gl.canvas.height = height;
            return true;
        }
        return false;
    }
}
export default WebglUtil;