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
    var gameAspect = 16 / 9,
        gameWidth = 400,
        gameHeight = gameWidth / gameAspect,
        rendererOptions = {
            antialias: false,
            resolution: 1
        },
        renderer = PIXI.autoDetectRenderer(gameWidth, gameHeight, rendererOptions);

    // add the renderer view element to the DOM
    document.body.appendChild(renderer.view);


    function resize() {
        var width = window.innerWidth;
        var height = window.innerHeight;


        if (width > height) {
            height = window.innerHeight;
            width = height * gameAspect;
            if (width > window.innerWidth) {
                width = window.innerWidth;
                height = width / gameAspect;
            }
        } else {
            width = window.innerWidth;
            height = width / gameAspect;
            if (height > window.innerHeight) {
                height = window.innerHeight;
                width = height * gameAspect;
            }
        }

        var domElement = renderer.view;
        domElement.style.width = width;
        domElement.style.height = height;
        domElement.style.top = (window.innerHeight - height) / 2;
        domElement.style.left = (window.innerWidth - width) / 2;
    }

    window.onresize = resize;
    resize();

    var updateFuncs = [];

    function game() {
        //////////////////////////////////////////////
        //		GAME INPUT 							//
        //////////////////////////////////////////////
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

        var Entity = {
            currentAnimation: null,
            animations: {},
            _init: function () {
            },
            _update: function () {
            },
            _load: function () {
            },
            init: function () {
                this.tick = 0;
                this.root = new PIXI.DisplayObjectContainer();
                stage.addChild(this.root);
                this.position = this.root.position;
                updateFuncs.push(proxy(this.update, this));
                this._init();
            },
            load: function () {
                this._load();
            },
            update: function (delta, now) {
                this.tick++;
                this._update(delta, now);
            },
            addAnimation: function (animation) {
                this.animations[animation.name] = animation;
                animation.parent = this;
            },
            setAnimation: function (animation) {
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
            }
        };


        var frog = _.deepExtend(Entity, {
            _init: function () {
            },
            _load: function () {
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
                console.log(this.currentAnimation);
            },
            _update: function (delta, now) {
                var newPos = new PIXI.Point(this.position.x, this.position.y);

                if (keys[37]) { // left
                    newPos.x -= 1.0;
                }
                if (keys[38]) { // up
                    newPos.y -= 1.0;
                }
                if (keys[39]) { // right
                    newPos.x += 1.0;
                }
                if (keys[40]) { // down
                    newPos.y += 1.0;
                }

                var diff = new PIXI.Point(newPos.x - this.position.x, newPos.y - this.position.y);

                if (Math.abs(diff.x) > 0 || Math.abs(diff.y) > 0) {
                    this.setAnimation('walk_up');
                } else {
                    this.setAnimation('idle_up');
                }

                this.position.set(newPos.x, newPos.y);
            }
        });

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