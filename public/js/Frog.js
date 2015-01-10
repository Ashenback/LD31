var Frog = function () {
    Entity.call(this);
};

Frog.prototype = Object.create(Entity.prototype);
Frog.prototype.constructor = Frog;

Frog.prototype._init = function () {
    this.target = new PIXI.Point();
    this.follow = false;
    inputHandler.on('clickstart', proxy(function (event) {
        this.target.set(event.data.global.x, event.data.global.y);
        this.follow = true;
    }, this));
    inputHandler.on('clickend', proxy(function (event) {
        this.follow = false;
    }, this));
    inputHandler.on('drag', proxy(function (event) {
        this.target.set(event.data.global.x, event.data.global.y);
    }, this));
    this.root.pivot.set(12.5, 12.5);
    this.position.set(100, 100);
    this.turnSpeed = 3.0;
};

Frog.prototype._load = function () {
    var animation = new Animation({
        name: 'walk_up',
        frames: [
            new Frame(createSprite('frog_up_sit.png'), 100),
            new Frame(createSprite('frog_up_jump.png'), 100),
            new Frame(createSprite('frog_up_land.png'), 100)
        ],
        type: Animation.types.LOOP
    });
    this.addAnimation(animation);

    animation = new Animation({
        name: 'idle_up',
        frames: [
            new Frame(createSprite('frog_up_sit.png'), 1000)
        ],
        type: Animation.types.LINEAR
    });
    this.addAnimation(animation);

    this.setAnimation('idle_up');
    this.root.scale.x = 2.0;
    this.root.scale.y = 2.0;
};

Frog.prototype._update = function (delta, now) {
    var diff = new PIXI.Point(this.target.x - this.x, this.target.y - this.y);
    var dir = Math.atan2(diff.y, diff.x) + Math.PI/2;

    if (dir < 0) {
        dir += Math.PI*2;
    }
    if (dir > Math.PI*2) {
        dir -= Math.PI*2;
    }

    var angle = dir - this.rotation;

    if (angle > Math.PI) {
        this.rotation += Math.PI * 2;
        angle -= Math.PI * 2;
    }

    if (angle < -Math.PI) {
        this.rotation -= Math.PI * 2;
        angle += Math.PI * 2;
    }

    this.rotation += angle * this.turnSpeed * delta / 1000.0;
    this.namePlate.setText(this.rotation.toFixed(2));
    if (this.follow && (Math.abs(diff.x) > 0 || Math.abs(diff.y) > 0)) {
        this.setAnimation('walk_up');
        this.x += Math.sin(this.rotation) * 2.0;
        this.y -= Math.cos(this.rotation) * 2.0;
    } else {
        this.setAnimation('idle_up');
    }
};