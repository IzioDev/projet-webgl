import {mat4, vec3} from "gl-matrix";
import {safeCreateBuffer} from "../utils/game-utils";
import {KeyHandler} from "./key-handler";

export class Model extends KeyHandler {
  id: string;

  textureUri: string;
  gl: WebGL2RenderingContext;
  shader: WebGLProgram;

  vao: WebGLVertexArrayObject;
  vertexBuffer: WebGLVertexArrayObject;
  normalBuffer: WebGLVertexArrayObject;
  coordBuffer: WebGLVertexArrayObject;
  triangles: WebGLVertexArrayObject;

  bbmin = [0, 0, 0];
  bbmax = [0, 0, 0];

  bbminP = [0, 0, 0, 0];
  bbmaxP = [0, 0, 0, 0];

  width = 0.2;
  height = 0.2;
  position = [0, 0, 0];
  rotation = 0;
  scale = 0.2;
  couleur = [1, 0, 0];
  time = 0.0;

  wo2 = 0.5 * this.width;
  ho2 = 0.5 * this.height;

  vertices = [
    -this.wo2,
    -this.ho2,
    -0.8,
    this.wo2,
    -this.ho2,
    -0.8,
    this.wo2,
    this.ho2,
    -0.8,
    -this.wo2,
    this.ho2,
    -0.8
  ];

  coords = [0.0, 0.0, 1.0, 0.0, 1.0, 1.0, 0.0, 1.0];

  tri = [0, 1, 2, 0, 2, 3];

  col = [0.2, 0.6, 0.5];
  light = [0.0, 0.0, 0.5];

  loaded = false;

  modelMatrix;
  viewMatrix;
  projMatrix;

  private _onCollide: (splat: Splat) => void = () => null;

  constructor(
    gl: WebGL2RenderingContext,
    textureUri: string,
    program: WebGLProgram,
    id: string
  ) {
    super();

    this.gl = gl;
    this.textureUri = textureUri;
    this.shader = program;
    this.id = id;

    const _vertexBuffer = gl.createBuffer();
    if (_vertexBuffer === null) {
      throw new Error(`Cannot create buffer`);
    }
    this.vertexBuffer = _vertexBuffer;
    (this.vertexBuffer as any).itemSize = 0;
    (this.vertexBuffer as any).numItems = 0;

    const _normalBuffer = gl.createBuffer();
    if (_normalBuffer === null) {
      throw new Error(`Cannot create buffer`);
    }
    this.normalBuffer = _normalBuffer;
    (this.normalBuffer as any).itemSize = 0;
    (this.normalBuffer as any).numItems = 0;

    this.loaded = false;
  }

  // @ts-ignore
  async load(): Promise<any> {
    const {textureUri} = this;
    // @ts-ignore
    return new Promise((res, rej) => {
      // lecture du fichier, récupération des positions et des normales
      var vertices = null;
      var xmlhttp = new XMLHttpRequest();
      var instance = this;

      xmlhttp.onreadystatechange = function () {
        if (xmlhttp.readyState == XMLHttpRequest.DONE) {
          if (xmlhttp.status == 200) {
            var data = xmlhttp.responseText;

            var lines = data.split("\n");

            var positions = [];
            var normals = [];
            var arrayVertex = [];
            var arrayNormal = [];

            for (var i = 0; i < lines.length; i++) {
              var parts = (lines[i] as any).trimRight().split(" ");
              if (parts.length > 0) {
                switch (parts[0]) {
                  case "v":
                    positions.push(
                      vec3.fromValues(
                        parseFloat(parts[1]),
                        parseFloat(parts[2]),
                        parseFloat(parts[3])
                      )
                    );
                    break;
                  case "vn":
                    normals.push(
                      vec3.fromValues(
                        parseFloat(parts[1]),
                        parseFloat(parts[2]),
                        parseFloat(parts[3])
                      )
                    );
                    break;
                  case "f": {
                    var f1 = parts[1].split("/");
                    var f2 = parts[2].split("/");
                    var f3 = parts[3].split("/");
                    Array.prototype.push.apply(
                      arrayVertex,
                      positions[parseInt(f1[0]) - 1]
                    );
                    Array.prototype.push.apply(
                      arrayVertex,
                      positions[parseInt(f2[0]) - 1]
                    );
                    Array.prototype.push.apply(
                      arrayVertex,
                      positions[parseInt(f3[0]) - 1]
                    );

                    Array.prototype.push.apply(
                      arrayNormal,
                      normals[parseInt(f1[2]) - 1]
                    );
                    Array.prototype.push.apply(
                      arrayNormal,
                      normals[parseInt(f2[2]) - 1]
                    );
                    Array.prototype.push.apply(
                      arrayNormal,
                      normals[parseInt(f3[2]) - 1]
                    );
                    break;
                  }
                  default:
                    break;
                }
              }
            }

            var objData = [
              new Float32Array(arrayVertex),
              new Float32Array(arrayNormal)
            ];
            instance.handleLoadedObject(objData);

            res();
          }
        }
      };

      console.log("Loading Model <" + textureUri + ">...");

      xmlhttp.open("GET", textureUri, true);
      xmlhttp.send();
    });
  }

  computeBoundingBox(vertices: any) {
    var i, j;

    if (vertices.length >= 3) {
      this.bbmin = [vertices[0], vertices[1], vertices[2]];
      this.bbmax = [vertices[0], vertices[1], vertices[2]];
    }

    for (i = 3; i < vertices.length; i += 3) {
      for (j = 0; j < 3; j++) {
        if (vertices[i + j] > this.bbmax[j]) {
          this.bbmax[j] = vertices[i + j];
        }

        if (vertices[i + j] < this.bbmin[j]) {
          this.bbmin[j] = vertices[i + j];
        }
      }
    }
  }

  handleLoadedObject(objData: any) {
    const {gl} = this;

    var vertices = objData[0];
    var normals = objData[1];

    console.log("Nb vertices: " + vertices.length / 3);

    this.computeBoundingBox(vertices);
    console.log(
      "BBox min: " + this.bbmin[0] + "," + this.bbmin[1] + "," + this.bbmin[2]
    );
    console.log(
      "BBox max: " + this.bbmax[0] + "," + this.bbmax[1] + "," + this.bbmax[2]
    );

    this.initParameters();

    this.vao = gl.createVertexArray();
    gl.bindVertexArray(this.vao);

    // cree un nouveau buffer sur le GPU et l'active
    this.vertexBuffer = safeCreateBuffer(this.gl);
    (this.vertexBuffer as any).itemSize = 3;
    (this.vertexBuffer as any).numItems = vertices.length / 3;
    gl.bindBuffer(gl.ARRAY_BUFFER, this.vertexBuffer);
    gl.enableVertexAttribArray(0);
    gl.bufferData(gl.ARRAY_BUFFER, vertices, gl.STATIC_DRAW);
    gl.vertexAttribPointer(
      0,
      (this.vertexBuffer as any).itemSize,
      gl.FLOAT,
      false,
      0,
      0
    );

    this.normalBuffer = safeCreateBuffer(this.gl);
    (this.normalBuffer as any).itemSize = 3;
    (this.normalBuffer as any).numItems = normals.length / 3;
    gl.bindBuffer(gl.ARRAY_BUFFER, this.normalBuffer);
    gl.enableVertexAttribArray(1);
    gl.bufferData(gl.ARRAY_BUFFER, normals, gl.STATIC_DRAW);
    gl.vertexAttribPointer(
      1,
      (this.normalBuffer as any).itemSize,
      gl.FLOAT,
      false,
      0,
      0
    );

    gl.bindVertexArray(null);

    console.log("model initialized");
    this.loaded = true;
  }

  getShader() {
    return this.shader;
  }

  initParameters() {
    this.modelMatrix = mat4.create();
    this.viewMatrix = mat4.create();
    this.projMatrix = mat4.create();

    // la caméra est positionné sur l'axe Z et regarde le point 0,0,0
    mat4.lookAt(this.viewMatrix, [0, 0, 10], [0, 0, 0], [0, 1, 0]);

    // matrice de projection perspective classique
    mat4.perspective(this.projMatrix, 45.0, 1, 0.1, 30);

    // on utilise des variables pour se rappeler quelles sont les transformations courantes
    // rotation, translation, scaling de l'objet
    this.position = [0, 0, 0]; // position de l'objet dans l'espace
    this.rotation = 0; // angle de rotation en radian autour de l'axe Y
    this.scale = 0.2; // mise à l'echelle (car l'objet est trop  gros par défaut)
  }

  setPosition(x: number, y: number, z: number) {
    this.position = [x, y, z];
  }

  setParameters(_: number) {
    // fonction appelée à chaque frame.
    // mise à jour de la matrice modèle avec les paramètres de transformation
    // les matrices view et projection ne changent pas

    // creation des matrices rotation/translation/scaling
    const rMat = mat4.create();
    mat4.rotate(rMat, mat4.create(), this.rotation, [0, 1, 0]);
    const tMat = mat4.create();
    mat4.translate(tMat, mat4.create(), [
      this.position[0],
      this.position[1],
      this.position[2]
    ]);
    const sMat = mat4.create();
    mat4.scale(sMat, mat4.create(), [this.scale, this.scale, this.scale]);

    // on applique les transformations successivement
    this.modelMatrix = mat4.create();
    mat4.multiply(this.modelMatrix, sMat, this.modelMatrix);
    mat4.multiply(this.modelMatrix, rMat, this.modelMatrix);
    mat4.multiply(this.modelMatrix, tMat, this.modelMatrix);
  }

  sendUniformVariables() {
    // on envoie les matrices de transformation (model/view/proj) au shader
    // fonction appelée a chaque frame, avant le dessin du vaisseau
    if (this.loaded) {
      const {gl, shader} = this;

      var m = this.modelMatrix;
      var v = this.viewMatrix;
      var p = this.projMatrix;

      // envoie des matrices aux GPU
      gl.uniformMatrix4fv(
        (shader as any).modelMatrixUniform,
        false,
        this.modelMatrix
      );
      gl.uniformMatrix4fv(
        (shader as any).viewMatrixUniform,
        false,
        this.viewMatrix
      );
      gl.uniformMatrix4fv(
        (shader as any).projMatrixUniform,
        false,
        this.projMatrix
      );

      //couleur du model
      gl.uniform3f(
        (shader as any).kdUniform,
        this.col[0],
        this.col[1],
        this.col[2]
      );

      //light
      gl.uniform3f(
        (shader as any).lightUniform,
        this.light[0],
        this.light[1],
        this.light[2]
      );

      // calcul de la boite englobante (projetée)
      this.multiplyVec4(
        m,
        [this.bbmin[0], this.bbmin[1], this.bbmin[2], 1],
        this.bbminP
      );
      this.multiplyVec4(
        m,
        [this.bbmax[0], this.bbmax[1], this.bbmax[2], 1],
        this.bbmaxP
      );
      this.multiplyVec4(v, this.bbminP);
      this.multiplyVec4(v, this.bbmaxP);
      this.multiplyVec4(p, this.bbminP);
      this.multiplyVec4(p, this.bbmaxP);

      this.bbminP[0] /= this.bbminP[3];
      this.bbminP[1] /= this.bbminP[3];
      this.bbminP[2] /= this.bbminP[3];
      this.bbminP[3] /= this.bbminP[3];

      this.bbmaxP[0] /= this.bbmaxP[3];
      this.bbmaxP[1] /= this.bbmaxP[3];
      this.bbmaxP[2] /= this.bbmaxP[3];
      this.bbmaxP[3] /= this.bbmaxP[3];
    }
  }

  multiplyVec4(mat: number[], vec: number[], dest = vec) {
    const x = vec[0],
      y = vec[1],
      z = vec[2],
      w = vec[3];

    dest[0] = mat[0] * x + mat[4] * y + mat[8] * z + mat[12] * w;
    dest[1] = mat[1] * x + mat[5] * y + mat[9] * z + mat[13] * w;
    dest[2] = mat[2] * x + mat[6] * y + mat[10] * z + mat[14] * w;
    dest[3] = mat[3] * x + mat[7] * y + mat[11] * z + mat[15] * w;

    return dest;
  }

  draw() {
    // cette fonction dit à la carte graphique de dessiner le vaisseau (déjà stocké en mémoire)
    if (this.loaded) {
      this.gl.bindVertexArray(this.vao);
      this.gl.drawArrays(
        this.gl.TRIANGLES,
        0,
        (this.vertexBuffer as any).numItems
      );
      this.gl.bindVertexArray(null);
    }
  }

  move(x: number, y: number) {
    // faire bouger votre vaisseau ici. Exemple :
    this.rotation += x * 0.05;
    this.position[0] += x * 0.1;
    this.position[1] += y * 0.1;

    if (this.rotation > 0.8) {
      this.rotation = 0.8;
    }

    if (this.rotation < -0.8) {
      this.rotation = -0.8;
    }

    if (this.position[0] > 6.5) {
      this.position[0] = -6.5;
    }
    if (this.position[0] < -6.5) {
      this.position[0] = 6.5;
    }
    if (this.position[1] > 5.0) {
      this.position[1] = 5.0;
    }
    if (this.position[1] < -5.0) {
      this.position[1] = -5.0;
    }
  }

  getBBox() {
    return [this.bbminP, this.bbmaxP];
  }

  clear() {
    // clear all GPU memory
    this.gl.deleteBuffer(this.vertexBuffer);
    this.gl.deleteBuffer(this.normalBuffer);
    this.gl.deleteVertexArray(this.vao);
    this.loaded = false;
  }

  static initProgram(gl: WebGL2RenderingContext, program: WebGLProgram) {
    // active ce shader
    gl.useProgram(program);

    // adresse des variables de type uniform dans le shader
    (program as any).modelMatrixUniform = gl.getUniformLocation(
      program,
      "uModelMatrix"
    );
    (program as any).viewMatrixUniform = gl.getUniformLocation(
      program,
      "uViewMatrix"
    );
    (program as any).projMatrixUniform = gl.getUniformLocation(
      program,
      "uProjMatrix"
    );

    //couleur obj
    (program as any).kdUniform = gl.getUniformLocation(program, "ukd");

    //lumiere
    (program as any).lightUniform = gl.getUniformLocation(program, "ul");

    console.log("model shader initialized");
    return program;
  }

  get onCollide() {
    return this._onCollide;
  }

  set onCollide(value: (splat: Splat) => void) {
    this._onCollide = value;
  }
}
