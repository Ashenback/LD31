(function (_) {
    PIXI.dontSayHello = true;

    function proxy(func, context) {
        return function () {
            func.apply(context || window, arguments);
        }
    }

    _.mixin({
        deepExtend: function (source, target) {
            for (var prop in source) {
                if (prop in target) {
                    _.deepExtend(source[prop], target[prop]);
                } else {
                    target[prop] = source[prop];
                }
            }
            return target;
        }
    });

    var assetsToLoader = [
        'frog.json',
        'lilypad_01.png',
        'lilypad_02.png',
        'lilypad_f_01.png',
        'lilypad_f_02.png',
        'nasty_boss.png'
    ];

    // create a new loader
    var loader = new PIXI.AssetLoader(assetsToLoader);

    // use callback
    loader.onComplete = game;

    //begin load
    loader.load();

    // create an new instance of a pixi stage
    var stage = new PIXI.Stage(0x33CCFF);

    // create a renderer instance.
    var
        gameWidth = 800,
        gameHeight = gameWidth / (window.innerWidth / window.innerHeight),
        rendererOptions = {
            antialias: false,
            autoResize: false,
            resolution: 1
        },
        renderer = PIXI.autoDetectRenderer(gameWidth, gameHeight, rendererOptions);

    // add the renderer view element to the DOM
    document.body.appendChild(renderer.view);


    function resize() {
        renderer.view.style.width = window.innerWidth;
        renderer.view.style.height = window.innerHeight;
    }

    window.onresize = resize;
    resize();

    var updateFuncs = [];

    function game() {
        //////////////////////////////////////////////
        //		GAME INPUT 							//
        //////////////////////////////////////////////
        var inputHandler = (function () {
            var inputEventTarget = function(){};
            PIXI.EventTarget.mixin(inputEventTarget.prototype);

            var _eventTarget = new inputEventTarget(),
                touchPos = new PIXI.Point(),
                mousePos = new PIXI.Point(),
                keys = [],
                onEvent = function (data) {
                    var type = data.originalEvent.type, compositeType;
                    _eventTarget.emit(type, data);
                    switch(type) {
                        case 'mousedown':
                        case 'touchstart':
                            compositeType = 'clickstart';
                            break;
                        case 'mouseup':
                        case 'mouseupoutside':
                        case 'touchend':
                        case 'touchendoutside':
                            compositeType = 'clickend';
                            break;
                        case 'mousemove':
                        case 'touchmove':
                            compositeType = 'drag';
                            break;
                    }
                    if (compositeType) {
                        _eventTarget.emit(compositeType, data);
                    }
                };

            // Add Event handler listener to all events :)
            stage.mousedown = stage.touchstart =
                stage.mouseup = stage.mouseupoutside =
                    stage.touchend = stage.touchendoutside =
                        stage.mousemove = stage.touchmove = onEvent;

            return _eventTarget;
        })();

        var map = [];

        //////////////////////////////////////////////
        //		LOAD     							//
        //////////////////////////////////////////////
        function createSprite(frameName) {
            return PIXI.Sprite.fromImage(frameName, false, PIXI.scaleModes.NEAREST);
        }

        function createTexture(imageName) {
            return PIXI.Texture.fromImage(imageName, false, PIXI.scaleModes.NEAREST);
        }

        var Animation = require('./Animation');

        var Frame = function (sprite, duration) {
            this.sprite = sprite;
            this.duration = duration;
        };

        Frame.prototype = {
            sprite: null
        };

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

        var gridSize = 10;
        var offX = (gameWidth % gridSize) / 2;
        var offY = (gameHeight % gridSize) / 2;

        for (var y = 0; y < gridSize; y++) {
            var yy = gameHeight / gridSize * y;
            for (var x = 0; x < gridSize; x++) {
                map[x + y * gridSize] = false;
                var xx = gameWidth / gridSize * x;
                var l = new Lilypad();
                l.init();
                l.load();
                l.x = xx + l.sprite.width / 2 + gridSize / 2 + offX;
                l.y = yy + l.sprite.height / 2 + gridSize / 2 + offY;
                map[x + y * gridSize] = true;
            }
        }

        var frog = new Frog();
        frog.init();
        frog.load();

        var boss = new Boss();
        boss.init();
        boss.load();
        boss.setTarget(frog.position);
    }

    var lastTimeMsec = null;

    function animate(nowMsec) {

        requestAnimFrame(animate);

        // measure time
        lastTimeMsec = lastTimeMsec || nowMsec - 1000 / 60;
        var deltaMsec = Math.min(200, nowMsec - lastTimeMsec);
        lastTimeMsec = nowMsec;

        updateFuncs.forEach(function (updateFn) {
            updateFn(deltaMsec, nowMsec);
        });

        // render the stage
        renderer.render(stage);
    }

    requestAnimFrame(animate);

}(_));