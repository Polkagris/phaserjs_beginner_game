import Phaser from "phaser";
import ScoreLabel from "../ui/ScoreLabel";
import BombSpawner from "./BombSpawner";
import RestartLabel from "../ui/RestartLabel";

const GROUND_KEY = "ground";
const DUDE_KEY = "dude";
const STAR_KEY = "star";
const BOMB_KEY = "bomb";

export default class GameScene extends Phaser.Scene {
  constructor() {
    super("game-scene");

    this.gameOver = false;
  }

  preload() {
    this.load.image("sky", "assets/sky.png");
    this.load.image(GROUND_KEY, "assets/platform.png");
    this.load.image(STAR_KEY, "assets/star.png");
    this.load.image(BOMB_KEY, "assets/bomb.png");

    this.load.spritesheet(DUDE_KEY, "assets/dude.png", {
      frameWidth: 32,
      frameHeight: 48,
    });
  }

  create() {
    this.add.image(400, 300, "sky");
    this.add.image(400, 300, STAR_KEY);

    const platforms = this.createPlatforms();
    this.player = this.createPlayer();
    this.stars = this.createStars();

    // Text for score
    this.scoreLabel = this.createScoreLabel(16, 16, 0);

    // Restart text
    this.restartText = new RestartLabel(this, 30, 30, {
      fontSize: "32px",
      fill: "#000",
    });

    this.add.text(16, 40, "Type space to restart.", {
      fontSize: "24px",
      color: "#000",
    });

    // bomb
    this.bombspawner = new BombSpawner(this, BOMB_KEY);
    const bombGroup = this.bombspawner.group;
    this.bombTest = bombGroup;

    // colliders between platforms and bombs
    this.physics.add.collider(bombGroup, platforms);
    this.physics.add.collider(
      this.player,
      bombGroup,
      this.hitByBomb,
      null,
      this
    );

    // colliders with platform/ground
    this.physics.add.collider(this.player, platforms);
    this.physics.add.collider(this.stars, platforms);

    this.cursors = this.input.keyboard.createCursorKeys();
    // collecting stars - detect overlap between player and star
    // if that happens -> call collectStars
    this.physics.add.overlap(
      this.player,
      this.stars,
      this.collectStars,
      null,
      this
    );
  }

  update() {
    if (this.gameOver) {
      // space to restart when dead
      /*       this.add.text(16, 40, "Type space to restart.", {
        fontSize: "32px",
        color: "#000",
      }); */
      if (this.cursors.space.isDown) {
        this.scene.restart();
      }
    }

    if (this.cursors.left.isDown) {
      this.player.setVelocityX(-160);
      this.player.anims.play("left", true);
    } else if (this.cursors.right.isDown) {
      this.player.setVelocityX(160);
      this.player.anims.play("right", true);
    } else {
      this.player.setVelocityX(0);
      this.player.anims.play("turn");
    }

    if (this.cursors.up.isDown && this.player.body.touching.down)
      this.player.setVelocityY(-330);
  }

  createPlatforms() {
    // ground obj that does not move
    const platforms = this.physics.add.staticGroup();

    platforms.create(400, 568, GROUND_KEY).setScale(2).refreshBody();

    platforms.create(600, 400, GROUND_KEY);
    platforms.create(50, 250, GROUND_KEY);
    platforms.create(750, 220, GROUND_KEY);

    return platforms;
  }

  createPlayer() {
    const player = this.physics.add.sprite(100, 450, DUDE_KEY);
    player.setBounce(0.2);
    player.setCollideWorldBounds(true);

    this.anims.create({
      key: "left",
      frames: this.anims.generateFrameNumbers(DUDE_KEY, { start: 0, end: 3 }),
      frameRate: 10,
      repeat: -1,
    });

    this.anims.create({
      key: "turn",
      frames: [{ key: DUDE_KEY, frame: 4 }],
      frameRate: 20,
    });

    this.anims.create({
      key: "right",
      frames: this.anims.generateFrameNumbers(DUDE_KEY, { start: 5, end: 8 }),
      frameRate: 10,
      repeat: -1,
    });

    return player;
  }

  // not static group
  createStars() {
    const stars = this.physics.add.group({
      key: STAR_KEY,
      repeat: 11,
      setXY: { x: 12, y: 0, stepX: 70 },
    });
    stars.children.iterate((c) => {
      // cast to physics sprite
      const child = /** @type {Phaser.Physics.Arcade.Sprite} */ (c);
      child.setBounceY(Phaser.Math.FloatBetween(0.4, 0.8));
    });

    return stars;
  }

  collectStars(player, star) {
    star.disableBody(true, true);

    this.scoreLabel.add(10);

    // check if all stars have been collected/no active stars
    if (this.stars.countActive(true) === 0) {
      this.stars.children.iterate((c) => {
        const child = /** @type {Phaser.Physics.Arcade.Sprite} */ (c);
        // Spawn the stars again
        child.enableBody(true, child.x, 0, true, true);
      });
      // only spawn bomb if all stars are collected
      // this.bombspawner.spawn(player.x);
    }
    // each time a star is collected, spawn a new bomb - but not more than number
    if (this.bombTest.countActive(true) < 5) {
      this.bombspawner.spawn(player.x);
    }
  }

  createScoreLabel(x, y, score) {
    const style = { fontSize: "32px", fill: "#000" };
    const label = new ScoreLabel(this, x, y, score, style);

    this.add.existing(label);

    return label;
  }

  hitByBomb(player) {
    this.physics.pause();
    player.setTint(0xff0000);
    player.anims.play("turn");
    this.gameOver = true;
  }
}
