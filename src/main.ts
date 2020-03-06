import {Scene} from "./scene";
import {initWebGL} from "./utils/game-utils";
import {v4 as uuidv4} from "uuid";
import {MissileAmmoManager} from "./objects/missile-ammo-manager";
import {EEnemy, EnemyManager} from "./objects/enemy-manager";
// @ts-ignore
const planeObjUri = require("./assets/plane.obj");
// @ts-ignore
const missileTextureImageUri = require("./assets/missile2.png");

let scene: Scene | null = null;
let enemyManager: EnemyManager | null;

export const onEnemyTypeChanged = (enemyType: EEnemy) => {
  enemyManager?.setPreferredEnemyType(enemyType);
};

document.addEventListener("DOMContentLoaded", async () => {

  document.getElementById('hollande')?.addEventListener('click', () => {
    onEnemyTypeChanged(EEnemy.HOLLANDE);
  });

  document.getElementById('macron')?.addEventListener('click', () => {
    onEnemyTypeChanged(EEnemy.MACRON);
  });

  const canvas: HTMLCanvasElement = document.getElementById(
    "super-soccer-canvas"
  ) as HTMLCanvasElement;

  const clientHeight = document.documentElement.clientHeight;
  canvas.height = clientHeight;
  canvas.width = clientHeight;

  const gl = initWebGL(canvas);

  let lastTimeShootMissile = 0;

  scene = new Scene(gl);

  const missileAmmoManager = new MissileAmmoManager(scene);
  missileAmmoManager.add(3, missileTextureImageUri);

  enemyManager = new EnemyManager(scene);
  enemyManager.add(1);

  scene.setBackground({
    amplitude: 5,
    offset: [0.5, 0.0],
    persistence: 0.8,
    frequency: 6
  });

  await scene.addModelFromObjectUri(planeObjUri, "plane-1").then(model => {
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
      if (
        scene.getTime() - lastTimeShootMissile > 500 &&
        missileAmmoManager.getLeftCount() > 0
      ) {
        missileAmmoManager.removeOne();

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
          };
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
