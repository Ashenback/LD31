(function () {
    function proxy(func, context) {
        return function () {
            func.call(context || window);
        }
    }
    var updateFuncs = [];

// create an new instance of a pixi stage
    var stage = new PIXI.Stage(0x33CCFF);

// create a renderer instance.
    var gameWidth = 800,
        gameHeight = 800,
        gameAspect = gameWidth / gameHeight,
        renderer = PIXI.autoDetectRenderer(gameWidth, gameHeight);

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

    //////////////////////////////////////////////
    //		GAME INPUT 							//
    //////////////////////////////////////////////
    var mouse	= {x : 0, y : 0};
    document.addEventListener('mousemove', function (event){
        mouse.x	= (event.clientX / window.innerWidth );
        mouse.y	= (event.clientY / window.innerHeight);
    }, false);
    var keys = [];
    document.addEventListener('keydown', function (event) {
        keys[event.keyCode] = true;
    });
    document.addEventListener('keyup', function (event) {
        keys[event.keyCode] = false;
    });

    function createSprite(textureName) {
    // create a texture from an image path
        var texture = PIXI.Texture.fromImage(textureName, false, PIXI.scaleModes.NEAREST);
    // create a new Sprite using the texture
        return new PIXI.Sprite(texture);
    }
    var hippo_open = createSprite('hippo_open.png');
    var hippo_closed = createSprite('hippo_closed.png');

    hippo_open.scale.x = 3;
    hippo_open.scale.y = 3;
    hippo_closed.scale.x = 3;
    hippo_closed.scale.y = 3;

    var hippo = {
        pos: new PIXI.Point(0, 0),
        sprites: {
            open: hippo_open,
            closed: hippo_closed
        },
        currentSprite: hippo_closed,
        ticks: 0,
        update: function (delta, now) {
            this.ticks++;
            if (this.ticks % 30 === 0) {
                stage.removeChild(this.currentSprite);
                if (this.currentSprite === this.sprites.closed) {
                    this.currentSprite = this.sprites.open;
                } else {
                    this.currentSprite = this.sprites.closed;
                }
                stage.addChild(this.currentSprite);
            }

            if (keys[37]) { // left
                this.pos.x -= 1.0;
            }
            if (keys[38]) { // up
                this.pos.y -= 1.0;
            }
            if (keys[39]) { // right
                this.pos.x += 1.0;
            }
            if (keys[40]) { // down
                this.pos.y += 1.0;
            }

            this.currentSprite.position.x = this.pos.x;
            this.currentSprite.position.y = this.pos.y;
        }
    };

    //stage.addChild(hippo.currentSprite);

    updateFuncs.push(proxy(hippo.update, hippo));

    var lastTimeMsec = null;
    function animate(nowMsec) {

        requestAnimFrame(animate);

        // measure time
        lastTimeMsec = lastTimeMsec || nowMsec - 1000 / 60;
        var deltaMsec = Math.min(200, nowMsec - lastTimeMsec);
        lastTimeMsec = nowMsec;

        updateFuncs.forEach(function (updateFn) {
            updateFn(deltaMsec / 1000, nowMsec / 1000);
        });

        // render the stage
        renderer.render(stage);
    }

    requestAnimFrame(animate);
}());