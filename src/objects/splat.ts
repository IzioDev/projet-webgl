import {initShaders} from "../utils/game-utils";

export class Splat {
    id: string;
    texture: WebGLTexture;
    gl: WebGL2RenderingContext;
    shader: WebGLProgram;

    vao: WebGLVertexArrayObject;
    vertexBuffer: WebGLVertexArrayObject;
    coordBuffer: WebGLVertexArrayObject;
    triangles: WebGLVertexArrayObject;

    width = 0.2;
    height = 0.2;
    position = [0.0,0.0,0.0];
    couleur = [1,0,0];
    time = 0.0;

    wo2 =  0.5*this.width;
    ho2 = 0.5*this.height;

    vertices = [
        -this.wo2,-this.ho2, -0.8,
        this.wo2,-this.ho2, -0.8,
        this.wo2, this.ho2, -0.8,
        -this.wo2, this.ho2, -0.8
    ];

    coords = [
        0.0, 0.0,
        1.0, 0.0,
        1.0, 1.0,
        0.0, 1.0
    ];

    tri = [0,1,2,0,2,3];

    loaded = false;

    constructor(gl: WebGL2RenderingContext, splatShader: WebGLProgram, texture: WebGLTexture, id: string) {
        Splat.initShader(gl);
        this.id = id;
        this.gl = gl;
        this.texture = texture;
        this.shader = splatShader;

        this.bindToGC();
    }

    bindToGC() {
        const {gl} = this;

        // cree un nouveau buffer sur le GPU et l'active
        this.vertexBuffer = gl.createBuffer();
        (this.vertexBuffer as any).itemSize = 3;
        (this.vertexBuffer as any).numItems = 4;
        gl.bindBuffer(gl.ARRAY_BUFFER, this.vertexBuffer);
        gl.enableVertexAttribArray(0);
        gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(this.vertices), gl.STATIC_DRAW);
        gl.vertexAttribPointer(0, (this.vertexBuffer as any).itemSize, gl.FLOAT, false, 0, 0);

        // meme principe pour les coords
        this.coordBuffer = gl.createBuffer();
        (this.coordBuffer as any).itemSize = 2;
        (this.coordBuffer as any).numItems = 4;
        gl.bindBuffer(gl.ARRAY_BUFFER, this.coordBuffer);
        gl.enableVertexAttribArray(1);
        gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(this.coords), gl.STATIC_DRAW);
        gl.vertexAttribPointer(1, (this.coordBuffer as any).itemSize, gl.FLOAT, false, 0, 0);

        // creation des faces du cube (les triangles) avec les indices vers les sommets
        this.triangles = gl.createBuffer();
        gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, this.triangles);
        gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, new Uint16Array(this.tri), gl.STATIC_DRAW);
        (this.triangles as any).numItems = 6;

        gl.bindVertexArray(null);

        this.loaded = true;

        console.log("splat initialized");
    }

    getShader() {
        return this.shader;
    }

    initParameters () {
        // paramètres par défaut d'un splat (taille, position, couleur)
        this.width = 0.2;
        this.height = 0.2;
        this.position = [0.0,0.0,0.0];
        this.couleur = [1,0,0];
        this.time = 0.0;
    }

    setPosition (x: number,y: number,z: number) {
        this.position = [x,y,z];
    }

    setParameters (elapsed) {
        this.time += 0.01*elapsed;
        // on peut animer les splats ici. Par exemple :
        //this.position[1] += 0.03; // permet de déplacer le splat vers le haut au fil du temps
        //this.position[0] += 0.02*Math.sin(this.time); // permet de déplacer le splat sur l'axe X
    }

    sendUniformVariables() {
        // envoie des variables au shader (position du splat, couleur, texture)
        // fonction appelée à chaque frame, avant le dessin du splat
        if(this.loaded) {
            const {gl, shader, texture} = this;

            gl.uniform3fv((shader as any).positionUniform,this.position);
            gl.uniform3fv((shader as any).couleurUniform,this.couleur);

            // how to send a texture:
            gl.activeTexture(gl.TEXTURE0);
            gl.bindTexture(gl.TEXTURE_2D, texture);
            gl.uniform1i((shader as any).texUniform, 0);
        }
    }

    draw () {
        // dessin du splat
        if(this.loaded) {
            const {gl} = this;
            gl.bindVertexArray(this.vao);
            gl.drawElements(gl.TRIANGLES, (this.triangles as any).numItems, gl.UNSIGNED_SHORT, 0);
            gl.bindVertexArray(null);
        }
    }

    clear() {
        // clear all GPU memory
        this.gl.deleteBuffer(this.vertexBuffer);
        this.gl.deleteBuffer(this.coordBuffer);
        this.gl.deleteVertexArray(this.vao);
        this.loaded = false;
    }

    static initShader (gl: WebGL2RenderingContext) {
        const splatShader = initShaders(gl, "splat-vs", "splat-fs");

        // active ce shader
        gl.useProgram(splatShader);

        // adresse des variables uniform dans le shader
        (splatShader as any).positionUniform = gl.getUniformLocation(
            splatShader,
            "uPosition"
        );
        (splatShader as any).texUniform = gl.getUniformLocation(splatShader, "uTex");
        (splatShader as any).couleurUniform = gl.getUniformLocation(
            splatShader,
            "maCouleur"
        );

        console.log("splat shader initialized");

        return splatShader;
    };
}
