import { Scene } from "../scene";
import { Splat } from "./splat";
import { v4 as uuidv4 } from "uuid";

export interface IEnemy {
  id: string;
  splat: Splat;
}

export enum EEnemy {
  HOLLANDE,
  MACRON
}

export class EnemyManager {
  enemies: IEnemy[] = [];
  lastTimeEnemyCheck: number = 0;

  preferredEnemyType: EEnemy = EEnemy.MACRON;

  constructor(
    private scene: Scene,
    // @ts-ignore
    private macronTextureImageUri: string = require("../assets/macron-edit.png"),
    // @ts-ignore
    private hollandeTextureImageUri: string = require("../assets/hollande.png")
  ) {
    scene.addOnTickHandler((elapsed: number) => {
      if (this.lastTimeEnemyCheck === 0) {
        this.lastTimeEnemyCheck = elapsed;
      }
      if (elapsed - this.lastTimeEnemyCheck > 3000) {
        this.lastTimeEnemyCheck = elapsed;
        this.add(Math.random() * 3);
      }
    });
  }

  add(n: number) {
    for (let i = 0; i < n; i++) {
      this.scene
        .addSplatFromUri(this.getImageUri(), `enemy-${uuidv4()}`)
        .then(splat => {
          this.enemies.push({ id: splat.id, splat });

          splat.setPosition(this.recFindGoodPosition(), 1, 0.5);
          splat.onTick = (elapsed: number) => {
            splat.position[1] -= 0.0005 * elapsed;

            if (splat.position[1] < -1) {
              this.scene.removeSplatFromId(splat.id);
              splat.clear();
              this.removeFromId(splat.id);
            }
          };
        });
    }
  }

  recFindGoodPosition(): number {
    const desiredPosition = Math.random() * 2 - 1;

    const nearEnemies = this.enemies.filter(splat => {
      return Math.abs(splat.splat.position[0] - desiredPosition) <= 0.25;
    });

    if (nearEnemies.length > 0) {
      return this.recFindGoodPosition();
    }
    return desiredPosition;
  }

  removeFromId(id: string) {
    this.enemies = this.enemies.filter(splat => splat.id !== id);
  }

  setPreferredEnemyType(type: EEnemy) {
    this.preferredEnemyType = type;
  }

  getImageUri() {
    switch (this.preferredEnemyType) {
      case EEnemy.HOLLANDE:
        return this.hollandeTextureImageUri;
      case EEnemy.MACRON:
        return this.macronTextureImageUri;
    }
  }
}
