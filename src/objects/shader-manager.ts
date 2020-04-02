import {initShaders} from "../utils/game-utils";
import {Model} from "./model";
import {Splat} from "./splat";
import {Background} from "./background";

interface Shader {
  vertexId: string;
  fsId: string;
  program: WebGLProgram;
}

export enum EShaderType {
  MODEL,
  SPLAT,
  BACKGROUND
}

export class ShaderManager {
  gl: WebGL2RenderingContext;
  loadedShaders: Shader[] = [];

  constructor(gl: WebGL2RenderingContext) {
    this.gl = gl;
  }

  loadOrGetLoadedShader(vertexId: string, fsId: string, shaderType: EShaderType): WebGLProgram {
    const shader = this.loadedShaders.find((shader) => (shader.fsId === fsId && shader.vertexId === vertexId));

    if (shader) {
      return shader.program;
    }
    const baseProgram = initShaders(this.gl, vertexId, fsId);
    const loadedProgram = this.initProgram(baseProgram, shaderType);
    this.loadedShaders.push({program: loadedProgram, vertexId, fsId});
    return loadedProgram;
  }

  initProgram(program: WebGLProgram, shaderType: EShaderType) {
    switch (shaderType) {
      case EShaderType.MODEL:
        return Model.initProgram(this.gl, program);
      case EShaderType.SPLAT:
        return Splat.initProgram(this.gl, program);
      case EShaderType.BACKGROUND:
        return Background.initProgram(this.gl, program);
    }
  }
}
