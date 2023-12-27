function NOOP() {
  //
}

export default class Anim {
  progress = 0;
  constructor(
    private timeStart: number,
    private duration: number,
    private updateCallback: (progress: number) => void,
    private completeCallback: () => void = NOOP
  ) {
    //
  }
  update(timeNow: number) {
    this.progress = Math.min(1, (timeNow - this.timeStart) / this.duration);
    this.updateCallback(this.progress);
    if (this.progress === 1) {
      this.completeCallback();
    }
  }
}
