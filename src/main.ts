import {Background} from "./objects/background";
import {requestAnimFrame} from "./utils/game-utils";
import {Scene} from "./scene";
import {Splat} from "./objects/splat";
import {Model} from "./objects/model";
const getShader = (gl: WebGL2RenderingContext, id: string) => {
  const shaderScript: HTMLScriptElement = document.getElementById(id) as HTMLScriptElement;
  if (!shaderScript) {
    return null;
  }

  let str = "";
  let k = shaderScript.firstChild;
  while (k) {
    if (k.nodeType == 3) {
      str += k.textContent;
    }
    k = k.nextSibling;
  }

  let shader;
  if (shaderScript.type == "x-shader/x-fragment") {
    shader = gl.createShader(gl.FRAGMENT_SHADER);
  } else if (shaderScript.type == "x-shader/x-vertex") {
    shader = gl.createShader(gl.VERTEX_SHADER);
  } else {
    return null;
  }

  gl.shaderSource(shader, str);
  gl.compileShader(shader);

  if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
    alert(gl.getShaderInfoLog(shader));
    return null;
  }

  return shader;
};

const initShaders = (gl: WebGL2RenderingContext, vertexId: string, fsId: string) => {
    // recupere les vertex et fragment shaders
    const fragmentShader = getShader(gl,fsId);
    const vertexShader = getShader(gl,vertexId);

    // cree le programme et lui associe les vertex/fragments
    const shaderProgram = gl.createProgram();
    gl.attachShader(shaderProgram, vertexShader);
    gl.attachShader(shaderProgram, fragmentShader);
    gl.linkProgram(shaderProgram);

    if (!gl.getProgramParameter(shaderProgram,gl.LINK_STATUS)) {
      alert("Could not initialise shaders");
    }

    return shaderProgram;
};

const initModelShader = (gl: WebGL2RenderingContext) => {
  const modelShader = initShaders(gl, "model-vs","model-fs");

  // active ce shader
  gl.useProgram(modelShader);

  // adresse des variables de type uniform dans le shader
  (modelShader as any).modelMatrixUniform = gl.getUniformLocation(modelShader, "uModelMatrix");
  (modelShader as any).viewMatrixUniform = gl.getUniformLocation(modelShader, "uViewMatrix");
  (modelShader as any).projMatrixUniform = gl.getUniformLocation(modelShader, "uProjMatrix");

  //couleur obj
  (modelShader as any).kdUniform = gl.getUniformLocation(modelShader, "ukd");

  //lumiere
  (modelShader as any).lightUniform = gl.getUniformLocation(modelShader, "ul");

  console.log("model shader initialized");
  return modelShader
}

const initSplatShader =  (gl: WebGL2RenderingContext) => {
  const splatShader = initShaders(gl,"splat-vs","splat-fs");

  // active ce shader
  gl.useProgram(splatShader);

  // adresse des variables uniform dans le shader
  (splatShader as any).positionUniform = gl.getUniformLocation(splatShader, "uPosition");
  (splatShader as any).texUniform = gl.getUniformLocation(splatShader, "uTex");
  (splatShader as any).couleurUniform = gl.getUniformLocation(splatShader, "maCouleur");

  console.log("splat shader initialized");

  return splatShader;
};

const initBackgroundShader = (gl: WebGL2RenderingContext) => {
  const backgroundShader = initShaders(gl,"background-vs","background-fs");

  // active ce shader
  gl.useProgram(backgroundShader);

  // adresse des variables dans le shader associé
  (backgroundShader as any).offsetUniform = gl.getUniformLocation(backgroundShader, "uOffset");
  (backgroundShader as any).amplitudeUniform = gl.getUniformLocation(backgroundShader, "uAmplitude");
  (backgroundShader as any).frequencyUniform = gl.getUniformLocation(backgroundShader, "uFrequency");
  (backgroundShader as any).persistenceUniform = gl.getUniformLocation(backgroundShader, "uPersistence");

  console.log("background shader initialized");

  return backgroundShader;
};

const initWebGL = (canvas: HTMLCanvasElement): WebGL2RenderingContext =>  {
  try {
    const gl: WebGL2RenderingContext = canvas.getContext("webgl2");
    gl.viewport(0, 0, canvas.width, canvas.height);
    console.log("initiated webgl on canvas.");
    return gl;
  } catch (e) {
    alert("Cannot initiate WebGL.");
  }
};

const isPowerOf2 = (value) => {
  return (value & (value - 1)) == 0;
};

const initTexture = (filePath: string, gl: WebGL2RenderingContext): WebGLTexture => {
  const texture = gl.createTexture();
  gl.bindTexture(gl.TEXTURE_2D, texture);

  // Default texture during the real texture download
  const level = 0;
  const internalFormat = gl.RGBA;
  const width = 1;
  const height = 1;
  const border = 0;
  const srcFormat = gl.RGBA;
  const srcType = gl.UNSIGNED_BYTE;
  const pixel = new Uint8Array([0, 0, 255, 255]);
  gl.texImage2D(gl.TEXTURE_2D, level, internalFormat,
    width, height, border, srcFormat, srcType,
    pixel);
  const image = new Image();

  image.onload = function () {
    gl.bindTexture(gl.TEXTURE_2D, texture);
    gl.texImage2D(gl.TEXTURE_2D, level, internalFormat,
      srcFormat, srcType, image);

    if (isPowerOf2(image.width) && isPowerOf2(image.height)) {
      gl.generateMipmap(gl.TEXTURE_2D);
    } else {
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
    }

    console.log("loaded a texture with real URI.");
  };

  image.src = filePath;

  return texture;
};




// @ts-ignore
document.addEventListener("DOMContentLoaded", async () => {
  const canvas: HTMLCanvasElement = document.getElementById("super-soccer-canvas") as HTMLCanvasElement;

  const gl = initWebGL(canvas);

  // @ts-ignore - get the encoded missileURI
  const missileTextureImageURI = require('./assets/missile.png');
  const missileTexture = initTexture(missileTextureImageURI, gl);

  const backGroundShader = initBackgroundShader(gl);
  const modelShader = initModelShader(gl);
  const splatShader = initSplatShader(gl);

  const background = new Background(gl, backGroundShader);
  // @ts-ignore
  const planeObjUri = require('./assets/plane.obj');
  const spaceship = new Model(gl, modelShader,planeObjUri);
  await spaceship.load();
  const shootSample = new Splat(gl, splatShader, missileTexture);

  const scene = new Scene(gl, background, spaceship, shootSample);
  // la couleur de fond sera grise fonc�e
  gl.clearColor(0.3, 0.3, 0.3, 1.0);

  // active le test de profondeur
  gl.enable(gl.DEPTH_TEST);

  // fonction de m�lange utilis�e pour la transparence
  gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);

  scene.tick();
});
