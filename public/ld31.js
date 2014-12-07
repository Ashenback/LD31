(function () {
    //////////////////////////////////////////////
    //		SETUP                               //
    //////////////////////////////////////////////
    var updateFcts	= [];
    var gameWidth = 1280;
    var gameHeight = 720;
    var gameAspect = gameWidth / gameHeight;
    var scene = new THREE.Scene();
    var camera = new THREE.OrthographicCamera( gameWidth / - 2, gameWidth / 2, gameHeight / 2, gameHeight / - 2, .1, 1000 );
    var socket = io();

    var renderer = new THREE.WebGLRenderer();
    renderer.setSize( window.innerWidth, window.innerHeight );
    document.body.appendChild( renderer.domElement );

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

        var domElement = renderer.domElement;
        domElement.style.width = width;
        domElement.style.height = height;
        domElement.style.top = (window.innerHeight - height) / 2;
        domElement.style.left = (window.innerWidth - width) / 2;
    }

    window.onresize = resize;
    resize();

    //////////////////////////////////////////////
    //		CREATE FONT                         //
    //////////////////////////////////////////////
    var font = {};
    (function () {
        var canvas	= document.createElement( 'canvas' );
        canvas.width	= gameWidth;
        canvas.height	= gameHeight;
        var context	= canvas.getContext( '2d' );
        context.lineWidth = 10;
        context.font = "bolder 50px Verdana";
        context.fillStyle = 'white';
        var texture = new THREE.Texture( canvas );
        texture.needsUpdate	= true;
        texture.anisotropy	= 16;

        var mesh;
        var geometry	= new THREE.PlaneBufferGeometry(canvas.width, canvas.height);
        var material	= new THREE.MeshBasicMaterial();
        material.map	= texture;

        mesh = new THREE.Mesh(geometry, material);
        mesh.position.z	= -1;
        scene.add(mesh);

        font.canvas = canvas;
        font.mesh = mesh;
        font.context = context;
        font.texture = texture;
    }());

    function drawText(text, x, y) {
        font.context.fillText(text || '', x, y);
        font.texture.needsUpdate = true;
    }

    function clearFont() {
        font.context.clearRect(0, 0, font.canvas.width, font.canvas.height);
    }

    //////////////////////////////////////////////
    //		CREATE SPRITES                      //
    //////////////////////////////////////////////
    function createSprite() {
        /*
        var canvas	= document.createElement( 'canvas' );
        var sprite = {
            texture: new THREE.Texture(canvas),
            canvas: canvas,
            mesh: {},
            geometry: {},
            material: new THREE.MeshBasicMaterial()
        };
        sprite.geometry = new THREE.PlaneBufferGeometry(canvas.width, canvas.height);
        sprite.material = new THREE.MeshBasicMaterial();
        mesh = new THREE.Mesh(geometry, material);
        mesh.position.z	= -1;
        scene.add(mesh);
        */

        var map = THREE.ImageUtils.loadTexture( '' );
        var material = new THREE.SpriteMaterial( { map: map, color: 0xffffff} );
        var sprite = new THREE.Sprite( material );

        scene.add( sprite );

        return sprite;
    }

    var player = createSprite();


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
    updateFcts.push(function(delta, now){
        drawText('MousePos ' + mouse.x + ', ' + mouse.y, mouse.x * gameWidth, mouse.y * gameHeight);
    });

    //////////////////////////////////////////////
    //		SCENE RENDERER                      //
    //////////////////////////////////////////////
    updateFcts.push(function(){
        renderer.render( scene, camera );
        clearFont();
    });

    //////////////////////////////////////////////
    //		LOOP     							//
    //////////////////////////////////////////////
    var lastTimeMsec= null;
    requestAnimationFrame(function animate(nowMsec) {
        // keep looping
        requestAnimationFrame(animate);
        // measure time
        lastTimeMsec = lastTimeMsec || nowMsec - 1000 / 60;
        var deltaMsec = Math.min(200, nowMsec - lastTimeMsec);
        lastTimeMsec = nowMsec;
        // call each update function
        updateFcts.forEach(function (updateFn) {
            updateFn(deltaMsec / 1000, nowMsec / 1000);
        })
    });

}());