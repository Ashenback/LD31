var Boss = function () {
    Entity.call(this);
};
Boss.prototype = Object.create(Entity.prototype);
Boss.prototype.constructor = Boss;
Boss.prototype._init = function () {
    this.target = new PIXI.Point();
    this.follow = true;
    this.animTick = 0;
};
Boss.prototype._load = function () {
    this.texture = createTexture('nasty_boss.png');
    this.points = [];
    var segs = 20;
    var length = this.texture.width / segs;
    console.log(this.texture.width);
    for (var i = 0; i < segs; i++) {
        this.points.push(new PIXI.Point(length * i, 0));
    }
    console.log(this.points);
    this.spine = new PIXI.Rope(this.texture, this.points);
    this.head = this.points[0];
    this.root.addChild(this.spine);
    //this.pivot.x = 100;
    this.position.x = 200;
    this.position.y = 200;
};
Boss.prototype._update = function (delta, now) {
    if (this.follow) {
        var diff = new PIXI.Point(this.target.x - this.x, this.target.y - this.y);
        var dir = Math.atan2(diff.y, diff.x) + Math.PI;

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

        var angleDelta = angle * delta / 1000.0;
        var newAngle = this.rotation + angleDelta;
        this.rotation = newAngle;
        this.namePlate.setText(this.rotation.toFixed(2));

        if (Math.abs(diff.x) > 0 || Math.abs(diff.y) > 0) {
            this.x += Math.sin(this.rotation - Math.PI/2) * 2.0;
            this.y -= Math.cos(this.rotation - Math.PI/2) * 2.0;
            this.animTick++;
            //this.points[0].x += Math.cos(0.01 + this.animTick/10.0);
            //this.points[0].y = Math.sin(0.3 + this.animTick/10.0) * 20.0;
            //this.head.x = Math.sin(angle) * this.texture.width / 20.0;
            this.head.y = -Math.cos(angle - Math.PI/2) * this.texture.height / Math.PI;
            var length = this.texture.width / this.points.length;
            for (var i = 1; i < 20; i++) {
                this.points[i].y = Math.sin(i * 0.3 + this.animTick/10.0) * 8.0;
                //this.points[i].y = this.points[i-1].y * 0.9;
                //this.points[i].y = Math.sin(i * 0.3 + this.animTick/10.0) * 4.0;
            }
        }
    }
};
Boss.prototype.setTarget = function (point) {
    this.target = point;
};