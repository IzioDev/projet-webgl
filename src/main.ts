import { Scene } from "./scene";
import { initWebGL } from "./utils/game-utils";
import { v4 as uuidv4 } from 'uuid';
import {MissileAmmoManager} from "./objects/missile-ammo-manager";
// @ts-ignore
const planeObjUri = require("./assets/plane.obj");
// @ts-ignore
const missileTextureImageUri = require("./assets/missile2.png");

document.addEventListener("DOMContentLoaded", async () => {
  const canvas: HTMLCanvasElement = document.getElementById(
    "super-soccer-canvas"
  ) as HTMLCanvasElement;

  const clientHeight = document.documentElement.clientHeight;
  canvas.height = clientHeight;
  canvas.width = clientHeight;

  const gl = initWebGL(canvas);

  let lastTimeShootMissile = 0;

  const scene = new Scene(gl);

  const missileAmmoManager = new MissileAmmoManager(scene);
  missileAmmoManager.add(3, missileTextureImageUri);

  scene.setBackground({amplitude: 5, offset: [0.5,0.0], persistence: 0.8, frequency: 6});
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
      if (scene.getTime() - lastTimeShootMissile > 1000 && missileAmmoManager.getLeftCount() > 0) {

        missileAmmoManager.remove(1);

        lastTimeShootMissile = scene.getTime();
        const bb = model.getBBox();
        const x = (bb[0][0] + bb[1][0]) / 2;
        const y = bb[1][1];
        const z = bb[1][2] + 0.005;

        scene.addSplatFromUri(missileTextureImageUri, uuidv4()).then(splat => {
          splat.setPosition(x, y, z);
          splat.addKeyHandler(77, () => {
            scene.removeSplatFromId(splat.id);
            splat.clear();
          });
          splat.onLeaveViewport = (_: number[]) => {
            scene.removeSplatFromId(splat.id);
            splat.clear();
          }
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
