
var Entity = function () {
    this.currentAnimation = null;
    this.animations = {};
};
Entity.prototype.constructor = Entity;
Object.defineProperty(Entity.prototype, 'x', {
    get: function () {
        return this.root.position.x;
    },
    set: function (value) {
        this.root.position.x = value;
    }
});
Object.defineProperty(Entity.prototype, 'y', {
    get: function () {
        return this.root.position.y;
    },
    set: function (value) {
        this.root.position.y = value;
    }
});
Object.defineProperty(Entity.prototype, 'rotation', {
    get: function () {
        return this.root.rotation;
    },
    set: function (value) {
        while (value < 0) {
            value += Math.PI * 2;
        }
        while (value > Math.PI*2) {
            value -= Math.PI * 2;
        }
        this.root.rotation = value;
    }
});
Entity.prototype._init = function () {};
Entity.prototype._update = function () {};
Entity.prototype._load = function () {};
Entity.prototype.init = function () {
    this.tick = 0;
    this.root = new PIXI.DisplayObjectContainer();
    stage.addChild(this.root);
    this.position = this.root.position;
    this.pivot = this.root.pivot;
    updateFuncs.push(proxy(this.update, this));
    this.namePlate = new PIXI.Text(this.name || 'Entity');
    this.namePlate.position = this.position;
    this.namePlate.anchor.x = 0.5;
    this.namePlate.anchor.y = -0.5;
    this.namePlate.visible = false;
    stage.addChild(this.namePlate);
    this._init();
};
Entity.prototype.load = function () {
    this._load();
};
Entity.prototype.update = function (delta, now) {
    this.tick++;
    this._update(delta, now);
};
Entity.prototype.addAnimation = function (animation) {
    this.animations[animation.name] = animation;
    animation.parent = this;
};
Entity.prototype.setAnimation = function (animation) {
    var newAnimation;
    // Find new animation...
    if (typeof animation === typeof Animation) { // by reference
        newAnimation = animation;
    } else if (animation in this.animations) { // by name
        newAnimation = this.animations[animation];
    }

    if (newAnimation !== this.currentAnimation) {
        if (this.currentAnimation) {
            this.currentAnimation.stop();
        }
        this.currentAnimation = newAnimation;
        this.currentAnimation.start();
    }
};