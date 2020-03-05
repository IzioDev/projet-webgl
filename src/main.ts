import { Background } from "./objects/background";
import { Scene } from "./scene";
import { Splat } from "./objects/splat";
import { Model } from "./objects/model";

const initWebGL = (canvas: HTMLCanvasElement): WebGL2RenderingContext => {

    const gl = canvas.getContext("webgl2");

    if (gl === null) {
      throw new Error("Cannot create a WebGL2 rendering context");
    }

    gl.viewport(0, 0, canvas.width, canvas.height);
    console.log("initiated webgl on canvas.");
    return gl;
};

const isPowerOf2 = (value: number) => {
  return (value & (value - 1)) == 0;
};

const initTexture = (
  filePath: string,
  gl: WebGL2RenderingContext
): WebGLTexture => {
  const texture = gl.createTexture();

  if (texture === null) {
    throw new Error("Cannot create texture");
  }

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
  gl.texImage2D(
    gl.TEXTURE_2D,
    level,
    internalFormat,
    width,
    height,
    border,
    srcFormat,
    srcType,
    pixel
  );
  const image = new Image();

  image.onload = function() {
    gl.bindTexture(gl.TEXTURE_2D, texture);
    gl.texImage2D(
      gl.TEXTURE_2D,
      level,
      internalFormat,
      srcFormat,
      srcType,
      image
    );

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

document.addEventListener("DOMContentLoaded", async () => {
  const canvas: HTMLCanvasElement = document.getElementById(
    "super-soccer-canvas"
  ) as HTMLCanvasElement;

  const gl = initWebGL(canvas);

  // @ts-ignore
  const missileTextureImageURI = require("./assets/missile.png");
  const missileTexture = initTexture(missileTextureImageURI, gl);

  // @ts-ignore
  const planeObjUri = require("./assets/plane.obj");

  // const shootSample = new Splat(gl, splatShader, missileTexture);

  const scene = new Scene(gl);
  scene.setBackground(new Background(gl));
  scene.addModelFromObjectUri(planeObjUri, "plane-1")
      .then((model) => {
        model.addKeyHandler(68, () => {
          model.move(1, 0);
        });

        model.addKeyHandler(81, () => {
          model.move(-1, 0);
        });

        model.addKeyHandler(90, () => {
          model.move(0, 1);
        });

        model.addKeyHandler(83, () => {
          model.move(0, -1);
        });
      });

  // la couleur de fond sera grise fonc�e
  gl.clearColor(0.3, 0.3, 0.3, 1.0);

  // active le test de profondeur
  gl.enable(gl.DEPTH_TEST);

  // fonction de mélange utilisée pour la transparence
  gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);

  scene.tick();
});
