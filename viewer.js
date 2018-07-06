(function () {
	'use strict';

	var classCallCheck = function (instance, Constructor) {
	  if (!(instance instanceof Constructor)) {
	    throw new TypeError("Cannot call a class as a function");
	  }
	};

	var createClass = function () {
	  function defineProperties(target, props) {
	    for (var i = 0; i < props.length; i++) {
	      var descriptor = props[i];
	      descriptor.enumerable = descriptor.enumerable || false;
	      descriptor.configurable = true;
	      if ("value" in descriptor) descriptor.writable = true;
	      Object.defineProperty(target, descriptor.key, descriptor);
	    }
	  }

	  return function (Constructor, protoProps, staticProps) {
	    if (protoProps) defineProperties(Constructor.prototype, protoProps);
	    if (staticProps) defineProperties(Constructor, staticProps);
	    return Constructor;
	  };
	}();

	var WebglUtil = function () {
	    function WebglUtil() {
	        classCallCheck(this, WebglUtil);
	    }

	    createClass(WebglUtil, null, [{
	        key: "error",
	        value: function error(msg) {
	            console.error(msg);
	        }
	    }, {
	        key: "loadShader",
	        value: function loadShader(gl, shaderSource, shaderType, opt_errorCallback) {
	            var errFn = opt_errorCallback || this.error;
	            // Create the shader object
	            var shader = gl.createShader(shaderType);

	            // Load the shader source
	            gl.shaderSource(shader, shaderSource);

	            // Compile the shader
	            gl.compileShader(shader);

	            // Check the compile status
	            var compiled = gl.getShaderParameter(shader, gl.COMPILE_STATUS);
	            if (!compiled) {
	                // Something went wrong during compilation; get the error
	                var lastError = gl.getShaderInfoLog(shader);
	                errFn("*** Error compiling shader '" + shader + "':" + lastError);
	                gl.deleteShader(shader);
	                return null;
	            }
	            return shader;
	        }
	    }, {
	        key: "createProgram",
	        value: function createProgram(gl, shaders, opt_attribs, opt_locations, opt_errorCallback) {
	            var errFn = opt_errorCallback || this.error;
	            var program = gl.createProgram();
	            shaders.forEach(function (shader) {
	                gl.attachShader(program, shader);
	            });
	            if (opt_attribs) {
	                opt_attribs.forEach(function (attrib, ndx) {
	                    gl.bindAttribLocation(program, opt_locations ? opt_locations[ndx] : ndx, attrib);
	                });
	            }
	            gl.linkProgram(program);

	            // Check the link status
	            var linked = gl.getProgramParameter(program, gl.LINK_STATUS);
	            if (!linked) {
	                // something went wrong with the link
	                var lastError = gl.getProgramInfoLog(program);
	                errFn("Error in program linking:" + lastError);

	                gl.deleteProgram(program);
	                return null;
	            }
	            return program;
	        }
	    }, {
	        key: "createProgramFromSources",
	        value: function createProgramFromSources(gl, shaderSources, opt_attribs, opt_locations, opt_errorCallback) {
	            var shaders = [];
	            var defaultShaderType = ["VERTEX_SHADER", "FRAGMENT_SHADER"];
	            for (var ii = 0; ii < shaderSources.length; ++ii) {
	                shaders.push(this.loadShader(gl, shaderSources[ii], gl[defaultShaderType[ii]], opt_errorCallback));
	            }
	            return this.createProgram(gl, shaders, opt_attribs, opt_locations, opt_errorCallback);
	        }
	    }, {
	        key: "resizeCanvas",
	        value: function resizeCanvas(gl, width, height, multiplier) {
	            multiplier = multiplier || 1;
	            width = width || gl.canvas.clientWidth * multiplier | 0;
	            height = height || gl.canvas.clientHeight * multiplier | 0;
	            if (gl.canvas.width !== width || gl.canvas.height !== height) {
	                gl.canvas.width = width;
	                gl.canvas.height = height;
	                return true;
	            }
	            return false;
	        }
	    }]);
	    return WebglUtil;
	}();

	var shaderToyVexterShader = "#version 300 es\n#define GLSLIFY 1\nin vec4 a_position;\nvoid main(){\n    gl_Position = a_position;\n}";

	var explosionMain = "#version 300 es\nprecision mediump float;\n#define GLSLIFY 1\nuniform vec3 iResolution;\nuniform sampler2D inputTexture;\nuniform vec2 textureResolution;\nvec3 black = vec3(0);\nvec3 red = vec3(1,0,0);\nvec3 green = vec3(0,1,0);\nfloat radius = 0.01;\nfloat blurRange = 0.005;\nout vec4 color;\nfloat circle(vec2 pos, vec2 center, float radius){\n    return 1.0 - smoothstep(radius-(radius*blurRange), radius+(radius*blurRange), length(pos-center));\n}\nvoid main()\n{\n    vec2 uv;\n    if(iResolution.x > iResolution.y)\n        uv = gl_FragCoord.xy/iResolution.y;\n    else\n        uv = gl_FragCoord.xy/iResolution.x;\n\tvec3 final = vec3(0.0);\n    \n    for(int y = 0; y < int(textureResolution.y); y++){\n        for(int x = 0; x < int(textureResolution.x); x++){\n            vec4 ball = texelFetch(inputTexture, ivec2(x,y),0);\n            final += mix(black, red, circle(uv, ball.xy, radius));\n        }\n    }\n    \n    color = vec4(final,1.0);\n}\n";

	var ShaderToyRenderer = function () {
	    function ShaderToyRenderer(gl, texWidth, texHeight) {
	        classCallCheck(this, ShaderToyRenderer);

	        this.gl = gl;
	        this.mainProgram = WebglUtil.createProgramFromSources(this.gl, [shaderToyVexterShader, explosionMain]);

	        // vertex array
	        this.vao = this.gl.createVertexArray();

	        // create position buffer
	        var positionBuffer = this.gl.createBuffer();
	        this.gl.bindBuffer(this.gl.ARRAY_BUFFER, positionBuffer);
	        this.gl.bufferData(this.gl.ARRAY_BUFFER, new Float32Array([-1.0, -1.0, 1.0, -1.0, -1.0, 1.0, -1.0, 1.0, 1.0, -1.0, 1.0, 1.0]), this.gl.STATIC_DRAW);

	        // bind attribute to buffer
	        this.gl.bindVertexArray(this.vao);
	        var posAttribLocation = this.gl.getAttribLocation(this.mainProgram, "a_position");
	        this.gl.enableVertexAttribArray(posAttribLocation);
	        this.gl.vertexAttribPointer(posAttribLocation, 2, this.gl.FLOAT, false, 0, 0);

	        // uniform location
	        this.resolutionLocation = this.gl.getUniformLocation(this.mainProgram, "iResolution");
	        this.textureResLocation = this.gl.getUniformLocation(this.mainProgram, "textureResolution");
	        this.gl.useProgram(this.mainProgram);
	        this.gl.uniform2fv(this.textureResLocation, [texWidth, texHeight]);
	    }

	    createClass(ShaderToyRenderer, [{
	        key: 'render',
	        value: function render() {
	            this.gl.useProgram(this.mainProgram);
	            this.gl.bindFramebuffer(this.gl.FRAMEBUFFER, null);
	            this.gl.viewport(0, 0, this.gl.drawingBufferWidth, this.gl.drawingBufferHeight);

	            this.gl.uniform3fv(this.resolutionLocation, [this.gl.canvas.width, this.gl.canvas.height, 1]);

	            this.gl.clearColor(0, 0, 0, 0);
	            this.gl.clear(this.gl.COLOR_BUFFER_BIT | this.gl.DEPTH_BUFFER_BIT);

	            this.gl.drawArrays(this.gl.TRIANGLES, 0, 6);
	        }
	    }]);
	    return ShaderToyRenderer;
	}();

	var explosionCompute = "#version 300 es\nprecision mediump float;\n#define GLSLIFY 1\n#define TWO_PI 6.28318530718\n#define THRES 0.9 \nuniform sampler2D iChannel0;\nuniform vec3 iResolution;\nuniform vec4 iMouse;\nuniform int iFrame;\nuniform float iTime;\nuniform float iTimeDelta;\nuniform int bornIndex;\nuniform vec2 lastDownPoint;\nuniform int isMouseDownBefore;\nout vec4 color;\nvec4 posVel;\nvoid updatePoint(ivec2 index, vec2 mousePoint){\n    if( index.y == bornIndex){\n        switch(index.x){\n            case 0:\n            posVel.zw = vec2(1,0);\n            break;\n            case 1:\n            posVel.zw = vec2(sqrt(3.0)/2.0,0.5);\n            break;\n            case 2:\n            posVel.zw = vec2(0.5, sqrt(3.0)/2.0);\n            break;\n            case 3:\n            posVel.zw = vec2(0,1);\n            break;\n            case 4:\n            posVel.zw = vec2(-0.5, sqrt(3.0)/2.0);\n            break;\n            case 5:            \n            posVel.zw = vec2(-sqrt(3.0)/2.0,0.5);\n            break;\n            case 6:\n            posVel.zw = vec2(-1,0);\n            break;\n            case 7:\n            posVel.zw = vec2(-sqrt(3.0)/2.0,-0.5);\n            break;\n            case 8:\n            posVel.zw = vec2(-0.5, -sqrt(3.0)/2.0);\n            break;\n            case 9:\n            posVel.zw = vec2(0, -1);\n            break;\n            case 10:\n            posVel.zw = vec2(0.5, -sqrt(3.0)/2.0);\n            break;\n            case 11:\n            posVel.zw = vec2(sqrt(3.0)/2.0,-0.5);\n            break;\n        }\n        posVel.xy = mousePoint + posVel.zw*iTimeDelta;\n    }\n    else{\n        posVel.xy += posVel.zw*iTimeDelta;\n    }\n}\nvoid main()\n{\n    ivec2 index = ivec2(gl_FragCoord.xy - 0.5);\n    vec2 mos;\n    if(iResolution.x > iResolution.y){\n        mos = iMouse.xy/iResolution.y;\n    }\n    else{\n        mos = iMouse.xy/iResolution.x;\n    }\n    posVel = texelFetch(iChannel0, index ,0);\n    if(iFrame == 0){\n        posVel.xy = vec2(-10,-10);\n        posVel.zw = vec2(0,0);\n    }\n    if(iMouse.z > 0.0 && (isMouseDownBefore == 0 || iMouse.xy != lastDownPoint || sin(iTime*TWO_PI*5.0) > THRES) ){\n        updatePoint(index, mos);\n    }\n    else{\n        posVel.xy += posVel.zw*iTimeDelta;\n    }\n    \n    color = posVel;\n}";

	var Clock = function () {
	    function Clock(auto) {
	        classCallCheck(this, Clock);

	        this.autoStart = auto !== undefined ? auto : true;
	        this.startTime = 0;
	        this.oldTime = 0;
	        this.elapsedTime = 0;
	        this.running = false;
	    }

	    createClass(Clock, [{
	        key: 'getDelta',
	        value: function getDelta() {
	            var diff = 0;
	            if (this.autoStart && !this.running) {
	                this.start();
	                return 0;
	            }
	            if (this.running) {
	                var newTime = (typeof performance === 'undefined' ? Date : performance).now();
	                diff = (newTime - this.oldTime) / 1000;
	                this.oldTime = newTime;
	                this.elapsedTime += diff;
	            }
	            return diff;
	        }
	    }, {
	        key: 'getElapsedTime',
	        value: function getElapsedTime() {
	            this.getDelta();
	            return this.elapsedTime;
	        }
	    }, {
	        key: 'start',
	        value: function start() {
	            this.startTime = (typeof performance === 'undefined' ? Date : performance).now();
	            this.oldTime = this.startTime;
	            this.elapsedTime = 0;
	            this.running = true;
	        }
	    }, {
	        key: 'stop',
	        value: function stop() {
	            this.getElapsedTime();
	            this.running = false;
	            this.autoStart = false;
	        }
	    }]);
	    return Clock;
	}();

	var ComputeBuffer = function () {
	    function ComputeBuffer(gl, width, height) {
	        classCallCheck(this, ComputeBuffer);

	        this.gl = gl;
	        this.textureWidth = width;
	        this.textureHeight = height;
	        this.frameCount = -1;
	        this.textures = [];
	        this.frameBuffers = [];
	        this.currentTexture = 0;
	        this.computeProgram = WebglUtil.createProgramFromSources(this.gl, [shaderToyVexterShader, explosionCompute]);

	        for (var i = 0; i < 2; i++) {
	            var texture = this.createTexture();
	            this.textures.push(texture);

	            var fbo = this.gl.createFramebuffer();
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

	    createClass(ComputeBuffer, [{
	        key: 'createTexture',
	        value: function createTexture() {
	            var texture = this.gl.createTexture();
	            this.gl.bindTexture(this.gl.TEXTURE_2D, texture);
	            this.gl.texImage2D(this.gl.TEXTURE_2D, 0, this.gl.RGBA32F, this.textureWidth, this.textureHeight, 0, this.gl.RGBA, this.gl.FLOAT, null);
	            this.gl.texParameteri(this.gl.TEXTURE_2D, this.gl.TEXTURE_WRAP_S, this.gl.CLAMP_TO_EDGE);
	            this.gl.texParameteri(this.gl.TEXTURE_2D, this.gl.TEXTURE_WRAP_T, this.gl.CLAMP_TO_EDGE);
	            this.gl.texParameteri(this.gl.TEXTURE_2D, this.gl.TEXTURE_MIN_FILTER, this.gl.NEAREST);
	            this.gl.texParameteri(this.gl.TEXTURE_2D, this.gl.TEXTURE_MAG_FILTER, this.gl.NEAREST);
	            return texture;
	        }
	    }, {
	        key: 'compute',
	        value: function compute() {

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
	    }, {
	        key: 'setBornIndex',
	        value: function setBornIndex(index) {
	            this.gl.useProgram(this.computeProgram);
	            this.gl.uniform1i(this.bornIndexLocation, index);
	        }
	    }, {
	        key: 'setLastDownPosition',
	        value: function setLastDownPosition(x, y) {
	            this.gl.useProgram(this.computeProgram);
	            this.gl.uniform2fv(this.lastDownLocation, [x, y]);
	        }
	    }, {
	        key: 'setIsMouseDownBefore',
	        value: function setIsMouseDownBefore(isMouseDownBefore) {
	            this.gl.useProgram(this.computeProgram);
	            this.gl.uniform1i(this.isMouseDownLocation, isMouseDownBefore);
	        }
	    }, {
	        key: 'setiMouse',
	        value: function setiMouse(p) {
	            this.gl.useProgram(this.computeProgram);
	            this.gl.uniform4fv(this.mouseLocation, p);
	        }
	    }]);
	    return ComputeBuffer;
	}();

	var Util = function () {
	    function Util() {
	        classCallCheck(this, Util);
	    }

	    createClass(Util, null, [{
	        key: "mobileCheck",
	        value: function mobileCheck() {
	            var check = false;
	            (function (a) {
	                if (/(android|bb\d+|meego).+mobile|avantgo|bada\/|blackberry|blazer|compal|elaine|fennec|hiptop|iemobile|ip(hone|od)|iris|kindle|lge |maemo|midp|mmp|mobile.+firefox|netfront|opera m(ob|in)i|palm( os)?|phone|p(ixi|re)\/|plucker|pocket|psp|series(4|6)0|symbian|treo|up\.(browser|link)|vodafone|wap|windows ce|xda|xiino/i.test(a) || /1207|6310|6590|3gso|4thp|50[1-6]i|770s|802s|a wa|abac|ac(er|oo|s\-)|ai(ko|rn)|al(av|ca|co)|amoi|an(ex|ny|yw)|aptu|ar(ch|go)|as(te|us)|attw|au(di|\-m|r |s )|avan|be(ck|ll|nq)|bi(lb|rd)|bl(ac|az)|br(e|v)w|bumb|bw\-(n|u)|c55\/|capi|ccwa|cdm\-|cell|chtm|cldc|cmd\-|co(mp|nd)|craw|da(it|ll|ng)|dbte|dc\-s|devi|dica|dmob|do(c|p)o|ds(12|\-d)|el(49|ai)|em(l2|ul)|er(ic|k0)|esl8|ez([4-7]0|os|wa|ze)|fetc|fly(\-|_)|g1 u|g560|gene|gf\-5|g\-mo|go(\.w|od)|gr(ad|un)|haie|hcit|hd\-(m|p|t)|hei\-|hi(pt|ta)|hp( i|ip)|hs\-c|ht(c(\-| |_|a|g|p|s|t)|tp)|hu(aw|tc)|i\-(20|go|ma)|i230|iac( |\-|\/)|ibro|idea|ig01|ikom|im1k|inno|ipaq|iris|ja(t|v)a|jbro|jemu|jigs|kddi|keji|kgt( |\/)|klon|kpt |kwc\-|kyo(c|k)|le(no|xi)|lg( g|\/(k|l|u)|50|54|\-[a-w])|libw|lynx|m1\-w|m3ga|m50\/|ma(te|ui|xo)|mc(01|21|ca)|m\-cr|me(rc|ri)|mi(o8|oa|ts)|mmef|mo(01|02|bi|de|do|t(\-| |o|v)|zz)|mt(50|p1|v )|mwbp|mywa|n10[0-2]|n20[2-3]|n30(0|2)|n50(0|2|5)|n7(0(0|1)|10)|ne((c|m)\-|on|tf|wf|wg|wt)|nok(6|i)|nzph|o2im|op(ti|wv)|oran|owg1|p800|pan(a|d|t)|pdxg|pg(13|\-([1-8]|c))|phil|pire|pl(ay|uc)|pn\-2|po(ck|rt|se)|prox|psio|pt\-g|qa\-a|qc(07|12|21|32|60|\-[2-7]|i\-)|qtek|r380|r600|raks|rim9|ro(ve|zo)|s55\/|sa(ge|ma|mm|ms|ny|va)|sc(01|h\-|oo|p\-)|sdk\/|se(c(\-|0|1)|47|mc|nd|ri)|sgh\-|shar|sie(\-|m)|sk\-0|sl(45|id)|sm(al|ar|b3|it|t5)|so(ft|ny)|sp(01|h\-|v\-|v )|sy(01|mb)|t2(18|50)|t6(00|10|18)|ta(gt|lk)|tcl\-|tdg\-|tel(i|m)|tim\-|t\-mo|to(pl|sh)|ts(70|m\-|m3|m5)|tx\-9|up(\.b|g1|si)|utst|v400|v750|veri|vi(rg|te)|vk(40|5[0-3]|\-v)|vm40|voda|vulc|vx(52|53|60|61|70|80|81|83|85|98)|w3c(\-| )|webc|whit|wi(g |nc|nw)|wmlb|wonu|x700|yas\-|your|zeto|zte\-/i.test(a.substr(0, 4))) check = true;
	            })(navigator.userAgent || navigator.vendor || window.opera);
	            return check;
	        }
	    }, {
	        key: "changeCSS",
	        value: function changeCSS(cssFile, cssLinkIndex) {

	            var oldlink = document.getElementsByTagName("link").item(cssLinkIndex);

	            var newlink = document.createElement("link");
	            newlink.setAttribute("rel", "stylesheet");
	            newlink.setAttribute("type", "text/css");
	            newlink.setAttribute("href", cssFile);

	            document.getElementsByTagName("head").item(0).replaceChild(newlink, oldlink);
	        }
	    }]);
	    return Util;
	}();

	var commonjsGlobal = typeof window !== 'undefined' ? window : typeof global !== 'undefined' ? global : typeof self !== 'undefined' ? self : {};

	function createCommonjsModule(fn, module) {
		return module = { exports: {} }, fn(module, module.exports), module.exports;
	}

	var stats_min = createCommonjsModule(function (module, exports) {
	// stats.js - http://github.com/mrdoob/stats.js
	(function(f,e){module.exports=e();})(commonjsGlobal,function(){var f=function(){function e(a){c.appendChild(a.dom);return a}function u(a){for(var d=0;d<c.children.length;d++)c.children[d].style.display=d===a?"block":"none";l=a;}var l=0,c=document.createElement("div");c.style.cssText="position:fixed;top:0;left:0;cursor:pointer;opacity:0.9;z-index:10000";c.addEventListener("click",function(a){a.preventDefault();
	u(++l%c.children.length);},!1);var k=(performance||Date).now(),g=k,a=0,r=e(new f.Panel("FPS","#0ff","#002")),h=e(new f.Panel("MS","#0f0","#020"));if(self.performance&&self.performance.memory)var t=e(new f.Panel("MB","#f08","#201"));u(0);return {REVISION:16,dom:c,addPanel:e,showPanel:u,begin:function(){k=(performance||Date).now();},end:function(){a++;var c=(performance||Date).now();h.update(c-k,200);if(c>g+1E3&&(r.update(1E3*a/(c-g),100),g=c,a=0,t)){var d=performance.memory;t.update(d.usedJSHeapSize/
	1048576,d.jsHeapSizeLimit/1048576);}return c},update:function(){k=this.end();},domElement:c,setMode:u}};f.Panel=function(e,f,l){var c=Infinity,k=0,g=Math.round,a=g(window.devicePixelRatio||1),r=80*a,h=48*a,t=3*a,v=2*a,d=3*a,m=15*a,n=74*a,p=30*a,q=document.createElement("canvas");q.width=r;q.height=h;q.style.cssText="width:80px;height:48px";var b=q.getContext("2d");b.font="bold "+9*a+"px Helvetica,Arial,sans-serif";b.textBaseline="top";b.fillStyle=l;b.fillRect(0,0,r,h);b.fillStyle=f;b.fillText(e,t,v);
	b.fillRect(d,m,n,p);b.fillStyle=l;b.globalAlpha=.9;b.fillRect(d,m,n,p);return {dom:q,update:function(h,w){c=Math.min(c,h);k=Math.max(k,h);b.fillStyle=l;b.globalAlpha=1;b.fillRect(0,0,r,m);b.fillStyle=f;b.fillText(g(h)+" "+e+" ("+g(c)+"-"+g(k)+")",t,v);b.drawImage(q,d+a,m,n-a,p,d,m,n-a,p);b.fillRect(d+n-a,m,a,p);b.fillStyle=l;b.globalAlpha=.9;b.fillRect(d+n-a,m,a,g((1-h/w)*p));}}};return f});
	});

	var canvas, gl;
	var renderer, computeBuffer;
	var mouseDown = false;
	var touchPoint = [-1000, -1000, -1000, -1000];
	var bornIndex = 0;
	var explosionDirection = 12;
	var explosionPoint = 64;
	var isMobile = false;
	var glHeight = 512;
	var stats, timer;
	init();
	animate();

	function init() {
	    canvas = document.createElement('canvas');
	    gl = canvas.getContext("webgl2");
	    if (!gl) {
	        alert("no webgl 2.0 context");
	        return;
	    }
	    var ext = gl.getExtension("EXT_color_buffer_float");
	    if (!ext) {
	        alert("need EXT_color_buffer_float");
	        return;
	    }
	    renderer = new ShaderToyRenderer(gl, explosionDirection, explosionPoint);
	    computeBuffer = new ComputeBuffer(gl, explosionDirection, explosionPoint);
	    timer = new Clock(false);

	    document.body.appendChild(canvas);
	    // inverse y coord
	    if (Util.mobileCheck()) {
	        canvas.ontouchstart = function (e) {
	            mouseDown = true;
	            touchPoint[0] = e.targetTouches[0].pageX;
	            touchPoint[1] = gl.canvas.height - e.targetTouches[0].pageY;
	            touchPoint[2] = e.targetTouches[0].pageX;
	            touchPoint[3] = gl.canvas.height - e.targetTouches[0].pageY;
	        };
	        canvas.ontouchend = function (e) {
	            mouseDown = false;
	            touchPoint[0] = e.targetTouches[0].pageX;
	            touchPoint[1] = gl.canvas.height - e.targetTouches[0].pageY;
	            touchPoint[2] = -1000;
	            touchPoint[3] = -1000;
	        };
	        canvas.ontouchmove = function (e) {
	            touchPoint[0] = e.targetTouches[0].pageX;
	            touchPoint[1] = gl.canvas.height - e.targetTouches[0].pageY;
	        };
	        isMobile = true;
	        Util.changeCSS('mobile.css', 0);
	        if (window.innerHeight > glHeight) {
	            ratio = window.innerWidth / window.innerHeight;
	            WebglUtil.resizeCanvas(gl, ratio * glHeight, glHeight);
	        } else {
	            WebglUtil.resizeCanvas(gl);
	        }
	    } else {
	        canvas.onmousedown = function (e) {
	            mouseDown = true;
	            touchPoint[0] = e.pageX;
	            touchPoint[1] = gl.canvas.height - e.pageY;
	            touchPoint[2] = e.pageX;
	            touchPoint[3] = gl.canvas.height - e.pageY;
	        };
	        canvas.onmouseup = function (e) {
	            mouseDown = false;
	            touchPoint[0] = e.pageX;
	            touchPoint[1] = gl.canvas.height - e.pageY;
	            touchPoint[2] = -1000;
	            touchPoint[3] = -1000;
	        };
	        canvas.onmousemove = function (e) {
	            if (mouseDown) {
	                touchPoint[0] = e.pageX;
	                touchPoint[1] = gl.canvas.height - e.pageY;
	            }
	        };
	        isMobile = false;
	        WebglUtil.resizeCanvas(gl);
	    }

	    timer.start();
	    stats = new stats_min();
	    stats.showPanel(0);
	    document.body.appendChild(stats.dom);
	}

	function animate() {
	    preProcess();
	    render();
	    postProcess();
	    stats.update();

	    requestAnimationFrame(animate);
	}
	function preProcess() {
	    computeBuffer.setiMouse(touchPoint);
	    if (isMobile) {
	        WebglUtil.resizeCanvas(gl);
	    }
	}
	function render() {
	    computeBuffer.compute();
	    renderer.render();
	}
	function postProcess() {
	    if (mouseDown) {
	        updateBornIndex();
	        computeBuffer.setLastDownPosition(touchPoint[0], touchPoint[1]);
	        computeBuffer.setIsMouseDownBefore(1);
	    } else {
	        computeBuffer.setIsMouseDownBefore(0);
	    }
	}

	function updateBornIndex() {
	    bornIndex += 1;
	    if (bornIndex > explosionPoint - 1) {
	        bornIndex = 0;
	    }
	    computeBuffer.setBornIndex(bornIndex);
	}

}());
