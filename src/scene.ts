import {Background} from "./objects/background";
import {Model} from "./objects/model";
import {Splat} from "./objects/splat";
import {EShaderType, ShaderManager} from "./objects/shader-manager";
import { pathOr } from 'ramda';

export interface IBackgroundOptions {
  offset?: number[];
  amplitude?: number;
  frequency?: number;
  persistence?: number;
}

export class Scene {
  gl: WebGL2RenderingContext;
  background: Background | null = null;

  shaderManager: ShaderManager;

  loadedModels: Model[] = [];
  loadedSplats: Splat[] = [];

  models: Model[] = [];
  splats: Splat[] = [];

  onTickHandlers: Function[] = [];

  currentlyPressed: any = {};

  lastTime = 0;

  started = false;

  constructor(
    gl: WebGL2RenderingContext,
  ) {
    this.gl = gl;

    this.shaderManager = new ShaderManager(gl);

    const handleKeyDown = (event: KeyboardEvent) => {
      this.currentlyPressed[event.keyCode] = true;
    };

    const handleKeyUp = (event: KeyboardEvent) => {
      this.currentlyPressed[event.keyCode] = false;
    };

    document.onkeydown = handleKeyDown;
    document.onkeyup = handleKeyUp;
  }

  setBackground(options?: IBackgroundOptions) {
    const backgroundProgram = this.shaderManager.loadOrGetLoadedShader("background-vs", "background-fs", EShaderType.BACKGROUND);

    const background = new Background(this.gl, backgroundProgram);
    if (options) {
      background.frequency = pathOr(background.frequency,["frequency"], options);
      background.offset = pathOr(background.offset,["offset"], options);
      background.persistence = pathOr(background.persistence,["persistence"], options);
      background.amplitude = pathOr(background.amplitude,["amplitude"], options);
    }

    this.background = background;
  }

  addModelFromObjectUri(objectUri: string, id: string): Promise<Model> {
    return new Promise((res, _) => {
      const modelProgram = this.shaderManager.loadOrGetLoadedShader("model-vs", "model-fs", EShaderType.MODEL);
      const model = new Model(this.gl, objectUri, modelProgram, id);
      model.load().then(() => {
        this.models.push(model);
        res(model);
      });
    });
  }

  addSplatFromUri(splatUri: string, id: string): Promise<Splat> {
    return new Promise((res, _) => {
      const splatProgram = this.shaderManager.loadOrGetLoadedShader("splat-vs", "splat-fs", EShaderType.SPLAT);
      const splat = new Splat(this.gl, splatUri, splatProgram, id);
      this.splats.push(splat);
      res(splat);
    });
  }

  removeSplatFromId(id: string) {
    this.splats = this.splats.filter((splat) => splat.id !== id);
  }

  tick() {
    setTimeout(() => {
      window.requestAnimationFrame(this.tick.bind(this));
      if (this.started) {
        this.onTickHandlers.forEach((tickHandler) => tickHandler(this.lastTime));
        this.handleKeys();
        this.drawScene();
        this.animate();
        this.collisionChecker();
      }
    }, 1000 / 60);
  }

  collisionChecker() {
    // This could impact performance on massive splats. But for our usage, we're fine.
    for (const splat1 of this.splats) {

      // ignore collision with ammo
      if (splat1.isAmmoSplat()) {
        continue;
      }

      for (const splat2 of this.splats) {

        // ignore collision with ammo
        if (splat2.isAmmoSplat()) {
          continue;
        }

        // Ignore if splat1 = splat2 (same object)
        if (splat1.id === splat2.id) {
          continue;
        }

        // Retrieve the base position
        const [s1xBase, s1yBase] = splat1.position;
        const [s2xBase, s2yBase] = splat2.position;

        const s1xEnd = s1xBase + splat1.width;
        const s1yEnd = s1yBase + splat1.height;

        const s2xEnd = s2xBase + splat2.width;
        const s2yEnd = s2yBase + splat2.height;

        // if splats collide
        if ( ((s1xBase <= s2xEnd) && (s1xEnd > s2xBase)) && ( (s1yBase < s2yEnd) && (s1yEnd > s2yBase))) {
          splat1.onCollide(splat2);
          splat2.onCollide(splat1);
        }
      }

      for (const model of this.models) {
        const bbox = model.getBBox();
        const [[modelxStart, modelyStart], [modelxEnd, modelyEnd]] = bbox;
        // If the splat comparator is not one of
        if (!splat1.isAmmoSplat() && !splat1.isMissileSplat()) {
          // Retrieve the base position
          const [s1xBase, s1yBase] = splat1.position;
          const s1xEnd = s1xBase + splat1.width;
          const s1yEnd = s1yBase + splat1.height;

          // if model collide
          if ( ((s1xBase <= modelxEnd) && (s1xEnd > modelxStart)) && ( (s1yBase < modelyEnd) && (s1yEnd > modelyStart))) {
            model.onCollide(splat1);
          }
        }
      }
    }
  }

  handleKeys() {
    this.models.forEach((model) => {
      model.keyHandlers.forEach((keyHandler) => {
        if (this.currentlyPressed[keyHandler.key]) {
          keyHandler.cb();
        }
      })
    });
    this.splats.forEach((splat) => {
      splat.keyHandlers.forEach((keyHandler) => {
        if (this.currentlyPressed[keyHandler.key]) {
          keyHandler.cb();
        }
      })
    });
  }

  drawScene() {
    const { gl } = this;
    // initialisation du viewport
    gl.viewport(
      0,
      0,
      gl.getParameter(gl.VIEWPORT)[2],
      gl.getParameter(gl.VIEWPORT)[3]
    );

    // efface les buffers de couleur et de profondeur
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

    // dessin du fond (d�commenter pour travailler dessus)
    if (this.background) {
      gl.useProgram(this.background.getShader());
      this.background.sendUniformVariables();
      this.background.draw();
    }

    // Draw all models :
    this.models.forEach(model => {
      gl.useProgram(model.getShader());
      model.sendUniformVariables();
      model.draw();
    });

    // For each splats, let's activate transparency, draw it.
    this.splats.forEach(splat => {
      gl.enable(gl.BLEND); // transparence activ�e
      gl.useProgram(splat.getShader());
      splat.sendUniformVariables();
      splat.draw();
      gl.disable(gl.BLEND); // transparence d�sactiv�e
    });
  }

  animate() {
    const timeNow = new Date().getTime();

    if (this.lastTime != 0) {
      const elapsed = timeNow - this.lastTime;

      this.models.forEach((model) => {
        model.setParameters(elapsed);
      });

      this.splats.forEach((splat) => {
        if (splat.onTick === null) {
          splat.setParameters(elapsed);
        } else {
          splat.onTick(elapsed);
        }
      });

      if (this.background) {
        this.background.setParameters(elapsed);
      }

    }
    this.lastTime = timeNow;
  }

  getTime() {
    return this.lastTime;
  }

  addOnTickHandler(handler: Function) {
    this.onTickHandlers.push(handler);
    return this.onTickHandlers.length - 1;
  }

  removeOnTickHandler(id: number) {
    this.onTickHandlers.splice(id, 1);
  }

  setStarted(value: boolean) {
    this.started = value;
  }
}
