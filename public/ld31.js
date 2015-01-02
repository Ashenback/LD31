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

    var assetsToLoader = ['frog.json'];

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
        gameWidth = window.innerWidth,
        gameHeight = window.innerHeight,
        rendererOptions = {
            antialias: false,
            autoResize: false,
            resolution: 1
        },
        renderer = PIXI.autoDetectRenderer(gameWidth, gameHeight, rendererOptions);

    // add the renderer view element to the DOM
    document.body.appendChild(renderer.view);


    function resize() {
        renderer.resize(window.innerWidth, window.innerHeight);
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


        // Desktop
        var mouse = {x: 0, y: 0};
        document.addEventListener('mousemove', function (event) {
            mouse.x = (event.clientX / window.innerWidth );
            mouse.y = (event.clientY / window.innerHeight);
        }, false);
        var keys = [];
        document.addEventListener('keydown', function (event) {
            keys[event.keyCode] = true;
        });
        document.addEventListener('keyup', function (event) {
            keys[event.keyCode] = false;
        });

        //////////////////////////////////////////////
        //		LOAD     							//
        //////////////////////////////////////////////
        function createSprite(frameName, options) {
            return _.deepExtend(PIXI.Sprite.fromImage(frameName, false, PIXI.scaleModes.NEAREST), options || {});
        }

        var Animation = function (settings) {
            this.settings = settings || {};
            this.name = this.settings.name;
            this.type = this.settings.type || Animation.types.LINEAR;
            this.frames = this.settings.frames;
            updateFuncs.push(proxy(this.update, this));
        };

        Animation.types = {
            LINEAR: 'linear',
            PING_PONG: 'pingpong',
            LOOP: 'loop'
        };

        Animation.prototype = {
            name: '',
            type: null,
            animationSpeed: 1,
            animationDirection: 1,
            frames: [],
            currentFrameIndex: 0,
            elapsed: 0,
            playing: false,
            paused: false,
            getFrame: function () {
                if (this.currentFrameIndex >= 0 && this.currentFrameIndex < this.frames.length) {
                    return this.frames[this.currentFrameIndex];
                }
                return _.extend({}, Frame.prototype);
            },
            getSprite: function () {
                return this.getFrame().sprite;
            },
            atEnd: function () {
                if (this.type === Animation.types.PING_PONG) {
                    if (this.animationDirection > 0) {
                        return this.currentFrameIndex >= this.frames.length;
                    } else {
                        return this.currentFrameIndex == 0;
                    }
                }

                return this.currentFrameIndex >= this.frames.length;
            },
            setNext: function () {
                this.parent.root.removeChild(this.getSprite());
                this.currentFrameIndex += this.animationDirection;
                if (this.atEnd()) {
                    if (this.type === Animation.types.PING_PONG) { // change direction
                        this.animationDirection *= -1;
                        if (this.currentFrameIndex === this.frames.length) {
                            this.currentFrameIndex += this.animationDirection * 2;
                        }
                    } else if (this.type === Animation.types.LOOP) { // loop
                        this.currentFrameIndex = 0;
                    } else { // LINEAR
                        this.currentFrameIndex = this.frames.length - 1; // stop at end
                    }
                }
                this.parent.root.addChild(this.getSprite());
            },
            stop: function () {
                if (this.playing) {
                    this.playing = false;
                    this.paused = false;
                    this.elapsed = 0;
                    this.parent.root.removeChild(this.getSprite());
                }
                return this;
            },
            pause: function () {
                this.playing = false;
                this.paused = true;
                return this;
            },
            start: function () {
                if (!this.playing) {
                    this.playing = true;
                    if (!this.paused) {
                        this.elapsed = 0;
                    }
                    this.paused = false;
                    this.parent.root.addChild(this.getSprite());
                }
                return this;
            },
            update: function (delta, now) {
                if (this.playing) {
                    this.elapsed += delta * this.animationSpeed;
                    while (this.elapsed > this.getFrame().duration) {
                        this.elapsed -= this.getFrame().duration;
                        this.setNext();
                    }
                }
            }
        };

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
            updateFuncs.push(proxy(this.update, this));
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


        var frog = new Entity();
            frog._init = function () {
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
            frog._load = function () {
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

                this.namePlate = new PIXI.Text('Frog');
                //this.namePlate.position.x = 10;
                //this.namePlate.position.y = 20;
                this.namePlate.position = this.position;
                this.namePlate.anchor.x = 0.5;
                //this.root.addChild(this.namePlate);
                stage.addChild(this.namePlate);
            };
            frog._update = function (delta, now) {
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

                if (this.follow && (Math.abs(diff.x) > 0 || Math.abs(diff.y) > 0)) {
                    this.setAnimation('walk_up');
                    this.x += Math.sin(this.root.rotation) * 2.0;
                    this.y -= Math.cos(this.root.rotation) * 2.0;
                } else {
                    this.setAnimation('idle_up');
                }
            };

        frog.init();
        frog.load();
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