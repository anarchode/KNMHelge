


level1 = []
for (var i=-20; i<60; i++) {
    level1.push([350+Math.random()*100+i*-20 ,-25+Math.random()*10, Math.random()*-20-30*i  ])
    level1.push([-350-Math.random()*100 ,-25+Math.random()*10, Math.random()*-20-30*i  ])

}
function createBox(x,y,z) { //hacky coastline
        var colors = [0x111111, 0x111122, 0x112211, 0x122112, 0x110033, 0x112233, 0x331133, 0x112233];
        var boxMaterials = [
        new THREE.MeshBasicMaterial({color: 0x00aa22}), 
        new THREE.MeshBasicMaterial({color: 0x00ff22}), 
        new THREE.MeshBasicMaterial({color: 0x00ee22}), 
        new THREE.MeshBasicMaterial({color: 0x00ff22}), 
        new THREE.MeshBasicMaterial({color: 0x00aa22}), 
        new THREE.MeshBasicMaterial({color: 0x00ff22}), 
	];
	var cubeGeometry = new THREE.BoxGeometry(x,y,z);
	box = new THREE.Mesh(cubeGeometry, boxMaterials);
        box.rotation.x += Math.random()*Math.PI;
        box.rotation.z += Math.random()*Math.PI;
	return box;
    }


function createFloor(x,y) {
    
    var geometry = new THREE.PlaneGeometry( x,y);
    var f_loader = new THREE.TextureLoader();
    var t_floor = f_loader.load("textures/water/Water_2_M_Normal.jpg");
    t_floor.wrapS = THREE.RepeatWrapping;
    t_floor.wrapT = THREE.RepeatWrapping;
    t_floor.repeat.set(20,20);
    var material = new THREE.MeshPhongMaterial({map: t_floor});
    return new THREE.Mesh(geometry, material);
    }


class LevelGenerator {
    constructor(size_x, size_y) {
        this.level = [{"mesh":createFloor(size_x*3, size_y*2),"position":{"x":0, "y":-2, "z":0}}];
        this.level[0].mesh.rotation.x -= Math.PI/2;
        for (var i=0; i<level1.length; i++) {
            this.level.push({"mesh":createBox(32,32,32), "position":{"x":level1[i][0], "y":-14, "z":level1[i][2]}   })
        }
    }
}


document.addEventListener('DOMContentLoaded', function(event) { //is this the wey?
    window.requestAnimationFrame = (function() {
        return window.requestAnimationFrame;
    })();
    var state = "normal";
    var water;
    var music_playing = false;    
    var clock = new THREE.Clock();
    //var mixer = new THREE.AnimationMixer();
    var player = new THREE.Mesh();
    var axis = new THREE.Vector3( 0, 1, 0 );
    var playerObject;
    var tankerObject;
    var pPlayer = new THREE.Vector3();
    var aPlayer = new THREE.Vector3( 0, 0,-2 );
    var aTanker = new THREE.Vector3( 0, 0, 2 );
    var quat = new THREE.Quaternion();
    var enemies = [];
    var leftPressed = false;
    var rightPressed = false;
    var upPressed = false;
    var downPressed = false;
    var jumpPressed = false;
    var cameraRight = false;
    var cameraLeft = false;
    var mouse = new THREE.Vector2();
    var level = new LevelGenerator(300,300);
    var caption;
    //audio vars
    var listener;
    var logg1;
    var logg2;
    var music;
    
    
    function animateScene() {
        requestAnimationFrame(animateScene);
        if (!playerObject) {
            return;
        }
        pPlayer = new THREE.Vector3(player.position.x, player.position.y , player.position.z);
        camera.lookAt(player.position);

        var delta = clock.getDelta();
        if (clock.elapsedTime > 2 && !music_playing) { //hacky hack?
            music.play();
            music_playing = true;
        }
        
        //start playing radio log    
        if (clock.elapsedTime > 20 && state == "normal") {
            logg1.play();
            state = "first_warning";
        }

        //misheard lyrics
        if (clock.elapsedTime > 38 && caption==undefined) {
            caption = drawDialog(dialogFrame([" nærme  MÅKENE"]));
            caption.position.z = pPlayer.z + 2*aPlayer.z;
            caption.position.y = 5;
            caption.rotation.y = player.rotation.y+Math.PI;
            caption.position.x = pPlayer.x + 2*aPlayer.x;
            caption.scale.set(0.005,0.005,0.005);
            scene.add(caption);     
        }


        //spawn tanker and lock on, spawn it at once with SPACE
        if (jumpPressed || (clock.elapsedTime > 65 && state=="first_warning")) {
            logg2.play();
            state = "happening";
            pTanker = pPlayer.clone();
            for (var i=0; i<30; i++) {
                pTanker.add(aPlayer);
            }           
            spawnTanker(pTanker.x, pTanker.y, pTanker.z);
            caption = drawDialog(dialogFrame(["Steady as she goes"]));
            caption.position.z = pPlayer.z + 2*aPlayer.z;
            caption.position.y = 5;
            caption.rotation.y = player.rotation.y+Math.PI;
            caption.position.x = pPlayer.x + 2*aPlayer.x;
            caption.scale.set(0.005,0.005,0.005);
            scene.add(caption);
        }
        //cut the steering, wildcard woo
        if (state=="happening") {
            upPressed = true;
            leftPressed = false;
            rightPressed = false;
            x_orientation = x_initial_orientation;
            y_orientation = y_initial_orientation;
        }

        if (state=="sinking") {
            if (player.rotation.z < Math.PI/3) {
                player.rotation.z += 1*delta;
                player.position.y -= 0.2*delta;
                aPlayer = new THREE.Vector3(0,0,0);
           }
            else {
                state ="done";
           }   
        }
        
       //impact
       if (state=="happening" && player.position.x > tankerObject.scene.position.x -15 && player.position.z > tankerObject.scene.position.z -15 && 
           player.position.x < tankerObject.scene.position.x + 15 && player.position.z < tankerObject.scene.position.z + 15) {
            state = "sinking";
        }

        var rot = 0.005;
        if (cameraRight) {
            rotateCamera(rot*3, 0);
        }
        if (cameraLeft) {
            rotateCamera(-rot*3, 0);
        }


        if (state!="done" && (leftPressed || y_orientation<y_initial_orientation-10)) {
            aPlayer.applyAxisAngle( axis, rot );
            player.rotation.y += rot;
            tankerObject.scene.rotation.y += rot;
            rotateCamera(rot,0);
        } 
	else if (state!= "done" && (rightPressed || y_orientation>y_initial_orientation+10)) {
            aPlayer.applyAxisAngle( axis, -rot );
            player.rotation.y -= rot;
            tankerObject.scene.rotation.y -= rot;
            rotateCamera(-rot,0);
        }
	if (( upPressed || x_orientation<x_initial_orientation)) {
            player.position.x += aPlayer.x*delta; //plz make a function
            player.position.y += aPlayer.y*delta;
            player.position.z += aPlayer.z*delta;
            camera.position.x += aPlayer.x*delta;
            camera.position.y += aPlayer.y*delta;
            camera.position.z += aPlayer.z*delta;
            if (detectCollide(player)) {            
                player.position.x -= aPlayer.x*delta;
                player.position.y -= aPlayer.y*delta;
                player.position.z -= aPlayer.z*delta;
                camera.position.x -= aPlayer.x*delta;
                camera.position.y -= aPlayer.y*delta;
                camera.position.z -= aPlayer.z*delta;
            }
	}
        else if (downPressed) {
            player.position.x -= aPlayer.x*delta;
            player.position.y -= aPlayer.y*delta;
            player.position.z -= aPlayer.z*delta;
            camera.position.x -= aPlayer.x*delta;
            camera.position.y -= aPlayer.y*delta;
            camera.position.z -= aPlayer.z*delta;
            if (detectCollide(player)) {   
                player.position.x += aPlayer.x*delta;
                player.position.y += aPlayer.y*delta;
                player.position.z += aPlayer.z*delta;
                camera.position.x += aPlayer.x*delta;
                camera.position.y += aPlayer.y*delta;
                camera.position.z += aPlayer.z*delta;
            }
        }
        renderScene();
    }

    function rotateCamera(x,y) {
        var pCamera = new THREE.Vector3(camera.position.x, camera.position.y, camera.position.z);
        quat.setFromAxisAngle( new THREE.Vector3( 0, 1, 0 ), x);
        var origin = pCamera.clone();
        origin.sub(pPlayer);
        origin.applyQuaternion(quat);
        origin.add(pPlayer);
        pCamera = origin;
        quat.setFromAxisAngle( new THREE.Vector3( 1, 0, 0), y);
        origin = pCamera.clone();
        origin.sub(pPlayer);
        origin.applyQuaternion(quat);
        origin.add(pPlayer);
        pCamera = origin;
        camera.position.x = pCamera.x;
        camera.position.y = pCamera.y;
        camera.position.z = pCamera.z;
    }

    function detectCollide(unit) {
       for (var i=1; i<level.level.length; i++) {
           if (unit.position.x > level.level[i].position.x -13.5 && unit.position.z > level.level[i].position.z -13.5) {
               if (unit.position.x < level.level[i].position.x +13.5 && unit.position.z < level.level[i].position.z + 13.5) { 
                   console.log("CRASHING");
                   return true;
               }
            }
       }
       return false;
    }
		
    function createPlayer(x,y,z) {
        var loader = new THREE.GLTFLoader();
        loader.load( 'model/nyhelge/KNM-Helge.gltf', function ( gltf ) {
            playerObject = gltf;
            player = gltf.scene;
            player.material = new THREE.MeshPhongMaterial({color: 0x555555});
            player.name = "player";
            player.rotation.y += Math.PI;
            player.position.set(x,y,z);
            player.scale.set(0.9,0.9,0.9);
            scene.add( player);
            mixer = new THREE.AnimationMixer(player);
            }, undefined, function ( error ) {
       		console.error( error );
        });
    }
	
    function createTanker() {
        var loader = new THREE.GLTFLoader();
        loader.load( 'model/tank/tanker-sola.gltf', function ( gltf ) {
            tankerObject = gltf;
            tankerObject.scene.rotation.y -= Math.PI/12;
            tankerObject.scene.scale.set(2,2,2);
	    }, undefined, function ( error ) {
                console.error( error );
        });
    }

    function spawnTanker(x,y,z) {
        tankerObject.scene.position.set(x,y,z);
        scene.add( tankerObject.scene);
    }

    function init_water() {
        var waterG = new THREE.PlaneBufferGeometry(600,600);
        water = new THREE.Water(waterG, {
            color: "#0000ad",
            scale: "4",
            flowDirection: new THREE.Vector2(-0.3,0.3),
            textureWidth: 256,
            textureHeight: 256 
        });
        water.position.y = 1;
        water.rotation.x = Math.PI * -0.5;
        scene.add(water);
    }

    function dialogFrame(dialog_obj) { 
        var frame = document.createElement('canvas');
        var ctx = frame.getContext('2d');
        
        frame.width = 1200;
        frame.height = 100+100*dialog_obj.length;
        ctx.font = 'Italic 100px Arial';
        ctx.fillStyle = "grey";
        ctx.fillRect(5, 5, frame.width-10, frame.height-10)
        ctx.fillStyle = "white";
        for (var i=0; i<dialog_obj.length; i++) {
            ctx.fillText(dialog_obj[i], 10, (110*i)+100 );
        }
        var texture = new THREE.Texture(frame);
        texture.needsUpdate = true;
        return [texture, [frame.width, frame.height]]
    }


    function drawDialog(dialog_frame) {
        var geometry = new THREE.PlaneGeometry(dialog_frame[1][0], dialog_frame[1][1]);
        var material = new THREE.MeshPhongMaterial({map:dialog_frame[0]});
        return new THREE.Mesh(geometry, material);
    }

    function startScene(player, level) {
        var canvas = document.getElementById('canvas');
        render = new THREE.WebGLRenderer({antialias: true});
        render.gammaOutput = true;
        render.gammaFactor = 2.2;
        render.setPixelRatio(window.devicePixelRatio);
        render.setClearColor(0x000044, 1);
        var canvasWidth = canvas.getAttribute('width');
        var canvasHeight = canvas.getAttribute('height');
        render.setSize(canvasWidth, canvasHeight);

        canvas.appendChild(render.domElement);

        scene = new THREE.Scene();
        scene.fog = new THREE.Fog("#666677",0,50);
        var aspect = canvasWidth / canvasHeight;

        camera = new THREE.PerspectiveCamera(75, aspect);
        camera.position.set(0, 5, 10);
        camera.lookAt(scene.position);
			

        function loadSound() {
            listener = new THREE.AudioListener();
            camera.add( listener );
            music = new THREE.Audio(listener);
            logg1 = new THREE.Audio(listener);
            logg2 = new THREE.Audio(listener);
            var audio_loader = new THREE.AudioLoader();    
            audio_loader.load("audio/logg1.ogg", function(buffer) {
                logg1.setBuffer(buffer);
                logg1.setLoop(false);
                logg1.setVolume(0.8);
            });
            audio_loader.load("audio/logg2.ogg", function(buffer) {
                logg2.setBuffer(buffer);
                logg2.setLoop(false);
                logg2.setVolume(0.8);
            });
            audio_loader.load( 'audio/ocean1.ogg', function( buffer ) {
                music.setBuffer( buffer );
                music.setLoop( true );
                music.setVolume( 0.5 );
                });
        }
        
        loadSound();
        createPlayer(0,1,0);
		createTanker();

        //for (var i=0; i<10; i++) {
        //    createEnemy(Math.random()*-20,0,Math.random()*-20);
        //}
		var aLight = new THREE.AmbientLight( 0xcccccc, 0.4 );
       
        var sun = new THREE.DirectionalLight( 0xffffff, 0.4);
        sun.position.set(1,1,1);
		scene.add( aLight );
        scene.add (sun);
        scene.add(camera);
        init_water();
        var welcome = drawDialog(dialogFrame(["Hei og velkommen", "til havs", "","WASD for å styre Helge","Q og E styrer kamera"]));
        welcome.position.z = -3;
        welcome.position.y = 5;
        welcome.position.x = -10;
        welcome.rotation.y += Math.PI/6;
        welcome.scale.set(0.005,0.005,0.005);
        scene.add(welcome);

        var welcome2 = drawDialog(dialogFrame(["Dette er ikke morsomt"]));
        welcome2.position.z = -20;
        welcome2.position.y = 5;
        welcome2.position.x = 10;
        welcome2.rotation.y -= Math.PI/5;
        welcome2.scale.set(0.005,0.005,0.005);
        scene.add(welcome2);
         
        for (var i=0; i<level.level.length; i++) {
            level.level[i].mesh.position.set(level.level[i].position.x, level.level[i].position.y, level.level[i].position.z);
            scene.add(level.level[i].mesh);
        } 
    }

    function renderScene() {
        render.render(scene, camera);
    }


    document.addEventListener("keydown",keydown);
    function keydown(e){
        //alert(e.which);
        if (e.which == 65) {
            leftPressed = true;
        }
        else if (e.which == 68) {
            rightPressed = true;
        }
        else if (e.which == 87) {
            upPressed = true;
        }
        else if (e.which == 83) {
            downPressed = true;
        }
        else if (e.which == 32) {
            jumpPressed = true;
        }        
        else if (e.which == 69) {
            cameraRight = true;
        }        
        else if (e.which == 81) {
            cameraLeft = true;
        }        
    }

    document.addEventListener("keyup",keyup);

    window.addEventListener("mousemove", onMouseMove, false);
    function onMouseMove(e) {    
        mouse.x = (e.clientX/window.innerWidth)*2-1;
        mouse.y = -(e.clientY/window.innerHeight)*2+1;
    }

    function keyup (e){
        if (e.which == 65) {
            leftPressed = false;
        }
        else if (e.which == 68) {
            rightPressed = false;
        }
        else if (e.which == 87) {
            upPressed = false;
        }
        else if (e.which == 83) {
            downPressed = false;
	} else if (e.which == 32) {
            jumpPressed = false;
        }        
        else if (e.which == 69) {
            cameraRight = false;
        }        
        else if (e.which == 81) {
            cameraLeft = false;
        }        
    }
	

    //REMOVE THIS? YES YES
    var x_initial_orientation = 0;
    var x_orientation = 0;
    var y_initial_orientation = 0;
    var y_orientation = 0;
    var z_initial_orientation = 0;
    var z_orientation = 0;
    window.addEventListener("deviceorientation", updateOrientation, true);
    function updateOrientation(e) {
        if (x_initial_orientation==0) {
            z_initial_orientation = e.alpha; //twist
            x_initial_orientation = e.beta; //forth
            y_initial_orientation = e.gamma; //
	}
        z_orientation = e.alpha;
        x_orientation = e.beta;
        y_orientation = e.gamma;
    }

    startScene(player, level);
    animateScene();
    renderScene();
});
