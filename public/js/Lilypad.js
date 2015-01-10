var Lilypad = function () {
    Entity.call(this);
};
Lilypad.prototype = Object.create(Entity.prototype);
Lilypad.prototype.constructor = Lilypad;
Lilypad.prototype._init = function () {
    this.rotationOffset = Math.random() * Math.PI * 2.0;
};
Lilypad.prototype._load = function () {
    switch (Math.floor(Math.random() * 4)) {
        case 0:
            this.sprite = createSprite('lilypad_01.png');
            break;
        case 1:
            this.sprite = createSprite('lilypad_02.png');
            break;
        case 2:
            this.sprite = createSprite('lilypad_f_01.png');
            break;
        case 3:
            this.sprite = createSprite('lilypad_f_02.png');
            break;
    }
    this.pivot.x = this.sprite.width / 2;
    this.pivot.y = this.sprite.height / 2;
    this.root.addChild(this.sprite);
};
Lilypad.prototype._update = function (delta, now) {
    this.sprite.y = Math.sin(this.y + this.tick/10.0) * 0.5;
    this.rotation = this.rotationOffset + Math.cos(this.y + this.tick/10.0) * 0.02;
};