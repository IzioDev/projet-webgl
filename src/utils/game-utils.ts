export const getShader = (gl: WebGL2RenderingContext, id: string) => {
    const shaderScript: HTMLScriptElement = document.getElementById(
        id
    ) as HTMLScriptElement;
    if (!shaderScript) {
        throw new Error(`No shader script found for id ${id}`);
    }

    let str = "";
    let k = shaderScript.firstChild;
    while (k) {
        if (k.nodeType == 3) {
            str += k.textContent;
        }
        k = k.nextSibling;
    }

    let shader;
    if (shaderScript.type == "x-shader/x-fragment") {
        shader = gl.createShader(gl.FRAGMENT_SHADER);
    } else if (shaderScript.type == "x-shader/x-vertex") {
        shader = gl.createShader(gl.VERTEX_SHADER);
    }

    if (!shader) {
        throw new Error(`Cannot create shader for script : ${shaderScript.type}`);
    }

    gl.shaderSource(shader, str);
    gl.compileShader(shader);

    if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
        alert(gl.getShaderInfoLog(shader));
        throw new Error(`Error while compiling shader : ${shaderScript.type}`);
    }

    return shader;
};

export const initShaders = (
    gl: WebGL2RenderingContext,
    vertexId: string,
    fsId: string
) => {
    // recupere les vertex et fragment shaders
    const fragmentShader = getShader(gl, fsId);
    const vertexShader = getShader(gl, vertexId);

    // cree le programme et lui associe les vertex/fragments
    const shaderProgram = gl.createProgram();

    if (shaderProgram === null) {
        throw new Error("shader program is null");
    }

    gl.attachShader(shaderProgram, vertexShader);
    gl.attachShader(shaderProgram, fragmentShader);
    gl.linkProgram(shaderProgram);

    if (!gl.getProgramParameter(shaderProgram, gl.LINK_STATUS)) {
        alert("Could not initialise shaders");
    }

    return shaderProgram;
};
