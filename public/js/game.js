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


function createSprite(frameName) {
    return PIXI.Sprite.fromImage(frameName, false, PIXI.scaleModes.NEAREST);
}

function createTexture(imageName) {
    return PIXI.Texture.fromImage(imageName, false, PIXI.scaleModes.NEAREST);
}


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

function game() {

    var map = [];

    //////////////////////////////////////////////
    //		LOAD     							//
    //////////////////////////////////////////////
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