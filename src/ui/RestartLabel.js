import Phaser from "phaser";

export default class RestartLabel extends Phaser.GameObjects.Text {
  constructor(scene, x, y, text, style) {
    super(scene, x, y, "Space to restart.", style);
  }
}
