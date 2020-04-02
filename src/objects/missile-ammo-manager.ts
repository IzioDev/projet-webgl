import {Splat} from "./splat";
import {Scene} from "../scene";
import uuid = require("uuid");

export interface IMissileAmmo {
  splat: Splat;
}

export class MissileAmmoManager {
  ammo: IMissileAmmo[] = [];
  maxAmmoNumber: number = 3;

  lastTimeAddAmmo = 0;

  // @ts-ignore
  constructor(private readonly scene: Scene, private defaultTextureUri: string = require("../assets/missile2.png")) {
    this.initTick();
  }

  initTick() {
    this.scene.addOnTickHandler((elapsed: number) => {
      if (this.getLeftCount() < this.maxAmmoNumber) {
        if (this.lastTimeAddAmmo === 0) {
          this.lastTimeAddAmmo = elapsed;
        }
        if (elapsed - this.lastTimeAddAmmo > 2000) {
          this.lastTimeAddAmmo = elapsed;
          this.add(1, this.defaultTextureUri);
        }
      } else {
        this.lastTimeAddAmmo = elapsed;
      }
    });
  }

  add(n: number, textureUri: string) {
    for (let i = 1; i <= n; i++) {
      this.scene.addSplatFromUri(textureUri, `ammo-${uuid.v4()}`)
        .then((splat) => {
          this.ammo.push({splat});
          splat.position = [-1.087 + (0.13 * this.ammo.length), -0.9, 0.5];
          splat.onTick = () => null;
        });
    }
  }

  removeOne() {
    if (this.ammo.length > 0) {
      const ammo = this.ammo.pop() as IMissileAmmo;
      this.scene.removeSplatFromId(ammo.splat.id);
      ammo.splat.clear();
    }
  }

  getLeftCount(): number {
    return this.ammo.length;
  }

  setMaxAmmo(n: number) {
    this.maxAmmoNumber = n;
  }
}
