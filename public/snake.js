// holder to store aliens
var count = 0;

// create an new instance of a pixi stage
var stage = new PIXI.Stage(0xace455);

// create a renderer instance.
var renderer = PIXI.autoDetectRenderer(window.innerWidth, window.innerHeight);

var target = new PIXI.Point();

// add the renderer view element to the DOM
document.body.appendChild(renderer.view);

// create an empty container
count = 0;


// build a rope!
var length = 918 / 20;
points = [];
for (var i = 0; i < 20; i++) {
    var segSize = length;
    points.push(new PIXI.Point(i * length, 0));
};

strip = new PIXI.Rope(PIXI.Texture.fromImage("snake.png"), points);
strip.x = -918/2;

var snakeContainer = new PIXI.DisplayObjectContainer();
snakeContainer.position.x = window.innerWidth/2;
snakeContainer.position.y = window.innerHeight/2;

snakeContainer.scale.set( window.innerWidth / 1100)
stage.addChild(snakeContainer);

snakeContainer.addChild(strip);


// start animating
requestAnimFrame(animate);

function animate() {

    count += 0.1;

    var length = 918 / 20;

    for (var i = 0; i < points.length; i++) {

        //points[i].y = Math.sin(i *0.5  + count) * 30;

        points[i].x = i * length + Math.cos(i *0.3  + count) * 20;

    };

    // render the stage
    renderer.render(stage);

    requestAnimFrame(animate);
}