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

    if (this.currentlyPressed[77]) {
      // M
      // juste un test pour supprimer un splat (tir)
      this.splat.clear();
    }

    if (this.currentlyPressed[32]) {
      // SPACE
      // exemple: comment positionner un splat devant le vaisseau
      var p = this.model.getBBox(); // boite englobante du vaisseau sur l'�cran
      var x = (p[0][0] + p[1][0]) / 2;
      var y = p[1][1];
      var z = p[1][2] + 0.005; // profondeur du splat (juste derri�re le vaisseau)

      this.splat.setPosition(x, y, z);
    }
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
    gl.useProgram(this.background.getShader());
    this.background.sendUniformVariables();
    this.background.draw();

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

      // this.background.setParameters(elapsed);

    }
    this.lastTime = timeNow;
  }
}
