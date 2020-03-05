import {Background} from "./objects/background";
import {Model} from "./objects/model";
import {Splat} from "./objects/splat";
import {requestAnimFrame} from "./utils/game-utils";

export class Scene {
    gl: WebGL2RenderingContext;
    background: Background;
    model: Model;
    splat: Splat;

    currentlyPressed: any = {};

    lastTime = 0;

    constructor(gl: WebGL2RenderingContext, background: Background, model: Model, splat: Splat) {
        this.background = background;
        this.model = model;
        this.splat = splat;
        this.gl = gl;

        const handleKeyDown = (event) => {
            this.currentlyPressed[event.keyCode] = true;
        };

        const handleKeyUp = (event) => {
            this.currentlyPressed[event.keyCode] = false;
        };

        document.onkeydown = handleKeyDown;
        document.onkeyup = handleKeyUp;
    }

    tick() {
        setTimeout(() => {
            window.requestAnimationFrame(this.tick.bind(this));
            this.handleKeys();
            this.drawScene();
            this.animate();
        },  1000/60);

    };

    handleKeys() {
        if (this.currentlyPressed[68]) {
            // D
            this.model.move(1, 0);
        }

        if (this.currentlyPressed[81]) {
            // Q
            this.model.move(-1, 0);
        }

        if (this.currentlyPressed[90]) {
            // Z
            this.model.move(0, 1);
        }

        if (this.currentlyPressed[83]) {
            // S
            this.model.move(0, -1);
        }

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
        const {gl} = this;
        // initialisation du viewport
        gl.viewport(0, 0, gl.getParameter(gl.VIEWPORT)[2], gl.getParameter(gl.VIEWPORT)[3]);

        // efface les buffers de couleur et de profondeur
        gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

        // dessin du fond (d�commenter pour travailler dessus)
        // gl.useProgram(background.shader());
        // background.sendUniformVariables();
        // background.draw();

        // dessin du vaisseau
        gl.useProgram(this.model.getShader());
        this.model.sendUniformVariables();
        this.model.draw();

        // test pour afficher un splat quand on appuie sur espace
        gl.enable(gl.BLEND); // transparence activ�e
        gl.useProgram(this.splat.getShader());
        this.splat.sendUniformVariables();
        this.splat.draw();
        gl.disable(gl.BLEND); // transparence d�sactiv�e
    }

    animate() {
        // fonction appel�e � chaque frame, permet d'animer la sc�ne
        const timeNow = new Date().getTime();

        if (this.lastTime != 0) {
            // anime chacun des objets de la scene
            // si necessaire (en fonction du temps ecoul�)
            var elapsed = timeNow - this.lastTime;
            this.model.setParameters(elapsed);
            // this.background.setParameters(elapsed);
            this.splat.setParameters(elapsed);
        }
        this.lastTime = timeNow;
    }
}
