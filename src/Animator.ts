import Anim from "./Anim";

export default class Animator {
  time = 0;
  anims: Anim[] = [];
  constructor(private frameDuration: number) {
    //
  }

  update() {
    this.time += this.frameDuration;
    for (let i = 0; i < this.anims.length; i++) {
      this.anims[i].update(this.time);
    }
    for (let i = this.anims.length - 1; i >= 0; i--) {
      if (this.anims[i].progress === 1) {
        this.anims.splice(i, 1);
      }
    }
  }
  animate(
    duration: number,
    updateCallback: (progress: number) => void,
    completeCallback?: () => void
  ) {
    this.anims.push(
      new Anim(this.time, duration, updateCallback, completeCallback)
    );
  }
}
