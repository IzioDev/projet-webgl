export interface IKeyHandler {
    key: number;
    cb: Function;
}

export class KeyHandler {

    keyHandlers: IKeyHandler[] = [];

    addKeyHandler(key: number, cb: Function) {
        this.keyHandlers.push({
            cb,
            key,
        })
    }

    clearKeyHandlerForKey(key: number) {
        this.keyHandlers.reduce((acc: IKeyHandler[], keyHandler) => {
            if (keyHandler.key !== key) {
                acc.push(keyHandler);
            }
            return acc;
        }, []);
    }
}
