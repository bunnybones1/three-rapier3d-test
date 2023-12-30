import Keyboard from "./Keyboard";
import { getUrlFlag } from "./location";

let keyboard: Keyboard | undefined;
export function getKeyboard() {
  if (!keyboard) {
    keyboard = new Keyboard(getUrlFlag("debugKeyboard"));
  }
  return keyboard!;
}
