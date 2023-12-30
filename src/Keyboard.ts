enum KEYSTATE {
  PRESSED,
  CONSUMED,
}

export default class Keyboard {
  keys = new Map<string, KEYSTATE | undefined>();
  constructor(debug = false) {
    window.addEventListener("keydown", (event) => {
      if (debug) {
        console.log("keyboard code: " + event.code);
      }
      if (this.keys.get(event.code) !== KEYSTATE.PRESSED) {
        this.keys.set(event.code, KEYSTATE.PRESSED);
      }
    });
    window.addEventListener("keyup", (event) => {
      this.keys.set(event.code, undefined);
    });
  }
  isPressed(code: string) {
    return this.keys.get(code) !== undefined;
  }
  consumePressed(code: string) {
    var p = this.keys.get(code) === KEYSTATE.PRESSED;
    if (p) {
      this.keys.set(code, KEYSTATE.CONSUMED);
    }
    return p;
  }
}
