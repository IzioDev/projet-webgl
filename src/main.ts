import { Background } from "./objects/background";
import { Scene } from "./scene";
import { initWebGL } from "./utils/game-utils";
// @ts-ignore
const planeObjUri = require("./assets/plane.obj");
// @ts-ignore
const missileTextureImageUri = require("./assets/missile.png");

document.addEventListener("DOMContentLoaded", async () => {
  const canvas: HTMLCanvasElement = document.getElementById(
    "super-soccer-canvas"
  ) as HTMLCanvasElement;

  const gl = initWebGL(canvas);

  let lastTimeSpawnMissile = 0;

  const scene = new Scene(gl);
  // scene.setBackground(new Background(gl));
  scene.addModelFromObjectUri(planeObjUri, "plane-1").then(model => {
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

    model.addKeyHandler(32, () => {
      if (scene.getTime() - lastTimeSpawnMissile > 1000) {
        lastTimeSpawnMissile = scene.getTime();
        const bb = model.getBBox();
        const x = (bb[0][0] + bb[1][0]) / 2;
        const y = bb[1][1];
        const z = bb[1][2] + 0.005;

        scene.addSplatFromUri(missileTextureImageUri, "splat-1").then(splat => {
          splat.setPosition(x, y, z);
          splat.addKeyHandler(77, () => {
            splat.clear();
          });
        });
      }
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
