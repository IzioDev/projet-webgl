export const requestAnimFrame = (tickFunction: FrameRequestCallback) => {
    return window.requestAnimationFrame(tickFunction) ||
        window.webkitRequestAnimationFrame(tickFunction) ||
        (window as any).mozRequestAnimationFrame(tickFunction) ||
        (window as any).oRequestAnimationFrame(tickFunction) ||
        (window as any).msRequestAnimationFrame(tickFunction) ||
        function(/* function FrameRequestCallback */ callback, /* DOMElement Element */ element) {
            window.setTimeout(callback, 1000/60);
        };
};
