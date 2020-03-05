import { Background } from "./objects/background";
import { Model } from "./objects/model";
import { Splat } from "./objects/splat";

export class Scene {
  gl: WebGL2RenderingContext;
  background: Background;
  model: Model;
  splat: Splat;

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

    const handleKeyDown = (event: KeyboardEvent) => {
      this.currentlyPressed[event.keyCode] = true;
    };

    const handleKeyUp = (event: KeyboardEvent) => {
      this.currentlyPressed[event.keyCode] = false;
    };

    document.onkeydown = handleKeyDown;
    document.onkeyup = handleKeyUp;
  }

  setBackground(background: Background) {
    this.background = background;
  }

  addModelFromObjectUri(objectUri: string, id: string): Promise<Model> {
    return new Promise((res, _) => {
      const model = new Model(this.gl, objectUri, id);
      model.load().then(() => {
        this.models.push(model);
        res(model);
      });
    });
  }

  addSplatFromUri(splatUri: string, id: string): Promise<Splat> {
    return new Promise((res, _) => {
      const splat = new Splat(this.gl, splatUri, id);
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
