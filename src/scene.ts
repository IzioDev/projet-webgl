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
      this.handleKeys();
      this.drawScene();
      this.animate();
    }, 1000 / 60);
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
        splat.setParameters(elapsed);
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
}
