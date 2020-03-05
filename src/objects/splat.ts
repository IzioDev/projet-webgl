import {initShaders, isPowerOf2, safeCreateBuffer, safeCreateTexture} from "../utils/game-utils";
import {KeyHandler} from "./key-handler";

export class Splat extends KeyHandler {

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
    position = [-1.5,1.0,0.0];
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

    private _onLeaveViewport: Function = () => null;

    constructor(gl: WebGL2RenderingContext, textureUri: string, id: string) {
        super();
        this.gl = gl;

        this.texture = this.initTexture(textureUri);
        this.shader = Splat.initShader(gl);

        this.id = id;

        this.bindToGC();
    }

    bindToGC() {
        const {gl} = this;

        // cree un nouveau buffer sur le GPU et l'active
        this.vertexBuffer = safeCreateBuffer(gl);
        (this.vertexBuffer as any).itemSize = 3;
        (this.vertexBuffer as any).numItems = 4;
        gl.bindBuffer(gl.ARRAY_BUFFER, this.vertexBuffer);
        gl.enableVertexAttribArray(0);
        gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(this.vertices), gl.STATIC_DRAW);
        gl.vertexAttribPointer(0, (this.vertexBuffer as any).itemSize, gl.FLOAT, false, 0, 0);

        // meme principe pour les coords
        this.coordBuffer = safeCreateBuffer(gl);
        (this.coordBuffer as any).itemSize = 2;
        (this.coordBuffer as any).numItems = 4;
        gl.bindBuffer(gl.ARRAY_BUFFER, this.coordBuffer);
        gl.enableVertexAttribArray(1);
        gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(this.coords), gl.STATIC_DRAW);
        gl.vertexAttribPointer(1, (this.coordBuffer as any).itemSize, gl.FLOAT, false, 0, 0);

        // creation des faces du cube (les triangles) avec les indices vers les sommets
        this.triangles = safeCreateBuffer(gl);
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

    setParameters (elapsed: number) {
        this.time += 0.01*elapsed;

        this.position[1] += 0.03;
        this.position[0] += 0.02*Math.sin(this.time);

        if (this.position[1] > 1) {
            this.onLeaveViewport(this.position);
        }
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

    initTexture = (
        filePath: string,
    ): WebGLTexture => {
        const {gl} = this;

        const texture = safeCreateTexture(gl);

        gl.bindTexture(gl.TEXTURE_2D, texture);

        // Default texture during the real texture download
        const level = 0;
        const internalFormat = gl.RGBA;
        const width = 1;
        const height = 1;
        const border = 0;
        const srcFormat = gl.RGBA;
        const srcType = gl.UNSIGNED_BYTE;
        const pixel = new Uint8Array([0, 0, 255, 255]);
        gl.texImage2D(
            gl.TEXTURE_2D,
            level,
            internalFormat,
            width,
            height,
            border,
            srcFormat,
            srcType,
            pixel
        );
        const image = new Image();

        image.onload = function() {
            gl.bindTexture(gl.TEXTURE_2D, texture);
            gl.texImage2D(
                gl.TEXTURE_2D,
                level,
                internalFormat,
                srcFormat,
                srcType,
                image
            );

            if (isPowerOf2(image.width) && isPowerOf2(image.height)) {
                gl.generateMipmap(gl.TEXTURE_2D);
            } else {
                gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
                gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
                gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
            }

            console.log("loaded a texture with real URI.");
        };

        image.src = filePath;

        return texture;
    };

    get onLeaveViewport(): Function {
        return this._onLeaveViewport;
    }

    set onLeaveViewport(value: Function) {
        this._onLeaveViewport = value;
    }
}
