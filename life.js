// Copyright 2017 Joshua J Baker. All rights reserved.
// https://github.com/tidwall/life
// Inspired by the work of @JacobJoaquin

(function(){
var DRAW_ANCHORS = false;
var CELLS = 27;
var CELL_SIZE = 256
var SPEED = 2;
var NUM_RING_ANIMS = 16;
var CENTER_ON_ANCHORS = false;
var BLUR = false;
var BACKGROUND = true;
var FIT_PAGE = false;
var WIDTH_HEIGHT = 480
var GITHUB_URL = "https://github.com/tidwall/life";

window.addEventListener("load", function(){
    // sweet page style preparation
    var sheet = document.createElement("style");
	sheet.innerHTML = [
        "html, body {",
			"padding:0; margin:0; border:0;",
            "width:100%; height:100%; overflow:hidden;",
		"}",
		"html {",
			"background: black;",
		"}",
    ].join("\n");
    document.head.appendChild(sheet);
	document.title = "life... what's it good for?";

    // the most dazzling background gradient
    if (BACKGROUND){
        var backgrounds = ["#dcedfe", "#000000"];
        var cover = document.createElement("div");
        cover.style.height = "100%";
        cover.style.width = "100%";
        //cover.style.backgroundImage = "radial-gradient(ellipse farthest-corner at 45px 45px , #00FFFF 0%, rgba(0, 0, 255, 0) 50%, #0000FF 95%)";
        cover.style.opacity = "0.15";
        cover.style.position = "absolute";
        document.body.appendChild(cover);
    }
    // bookkeeping variables
    var pwidth, pheight;
    var ratio, width, height, canvas, ctx;
    var timestamp, basets, step;
    var anis = []; // currently playing animation
    var fields = [[],[]]; // fields for swapping

    // generate the animations
    var start = new Date()
    var ringAnims = [];
    for (var i=0;i<NUM_RING_ANIMS;i++){
        ringAnims.push(genani());
    }
    console.log(((new Date())-start)/1000, "seconds");

    // layout a canvas for the imagination
    function layout(){
        var nratio = window.devicePixelRatio;
        var nwidth = document.body.offsetWidth * nratio
        var nheight = document.body.offsetHeight * nratio
        if (canvas && nwidth == pwidth && nheight == pheight && nratio == ratio) {
            return;
        }
        pwidth = nwidth;
        pheight = nheight;
        ratio = nratio
        if (FIT_PAGE){
            width = pwidth;
            height = pwidth;
        } else {
            width = WIDTH_HEIGHT*ratio;
            height = WIDTH_HEIGHT*ratio;
        }
        if (width > pwidth){
            width = pwidth;
        }
        if (height > pheight){
            heigth = pheight;
        }

        if (canvas) {
            document.body.removeChild(canvas);
        }
        canvas = document.createElement("canvas");
        ctx = canvas.getContext("2d");
        
        canvas.width = Math.floor(width);
        canvas.height = Math.floor(height);
        canvas.style.width = Math.floor(width/ratio)+"px";
        canvas.style.height = Math.floor(height/ratio)+"px";

        canvas.style.position = "absolute";
        document.body.appendChild(canvas);

        canvas.style.top = Math.floor(document.body.offsetHeight/2-canvas.offsetHeight/2)+"px"
        canvas.style.left = Math.floor(document.body.offsetWidth/2-canvas.offsetHeight/2)+"px"
        canvas.style.cursor = "pointer";
        canvas.addEventListener("click", function(){
            document.location = GITHUB_URL;
        })

    }

    // handle the resize event so that the canvas will always look nice
    window.addEventListener("resize", layout);
    var rafs = ["requestAnimationFrame", "webkitRequestAnimationFrame", "mozRequestAnimationFrame"];
    for (var i=0;i<rafs.length;i++){
        if (window[rafs[i]]){
            function fevent(timestamp){
                window[rafs[i]](fevent);
                frame(timestamp/1000);
            }
            window[rafs[i]](fevent);
			break
		}
	}
    layout()

    function startAni(ani, startts, x, y) {
        anis.push({ani:ringAnims[ani],
        x:x,y:y,
        startts:startts,
        endts:startts+3})
    }

    // set a life cell on or off
    function set(which, x, y, on) {
        var cell = fields[which][y][x];
        if (cell.on){
            if (!on){
                // switch off
                cell.on = false;
            }
        } else {
            if (on){
                // switch on
                if (!cell){
                    cell = {};
                }
                cell.on = true;
                startAni(
                    Math.floor(rnd(NUM_RING_ANIMS)), 
                    Math.floor(timestamp), x, y)
            }
        }
        fields[which][y][x] = cell;
    }

    // Alive reports whether the specified cell is alive.
    // If the x or y coordinates are outside the field boundaries they are wrapped
    // toroidally. For instance, an x value of -1 is treated as width-1.
    function alive(which, x, y){
        x += fields[which][0].length;
        x %= fields[which][0].length;
        y += fields[which].length;
        y %= fields[which].length;
        return fields[which][y][x].on;
    }

    // next returns the state of the specified cell at the next time step
    function next(which, x, y) {
    	// count the adjacent cells that are alive
	    var count = 0;
	    for (var i=-1;i<=1;i++) {
		    for (var j=-1;j<=1;j++) {
			    if ((j != 0 || i != 0) && alive(which, x+i, y+j)) {
				    count++;
			    }
		    }
	    }
        // Return next state according to the game rules:
        //   exactly 3 neighbors: on,
        //   exactly 2 neighbors: maintain current state,
        //   otherwise: off.
        return count == 3 || count == 2 && alive(which, x, y);
    }

    function sizeFields(xAnchors, yAnchors){
        if (fields[0].length != yAnchors){
            // resize the field
            if (fields[0].length < yAnchors){
                for (var i=0;i<2;i++){
                    for (var j=fields[i].length-1;j<yAnchors;j++){
                        fields[i][j] = [];
                        for (var k=0;k<xAnchors;k++){
                            fields[i][j][k] = {};
                        }
                    }
                }
            } else {
                for (var i=0;i<2;i++){
                    fields[i].length = yAnchors;
                }
            }
        }
    }

    function drawCell(x, y, sz){
        //startAni(Math.floor(rnd(NUM_RING_ANIMS)), timestamp, 
        var x = x*sz;
        var y = y*sz;
        ctx.fillStyle = "rgba(255,255,255,0.3)";
        ctx.beginPath()
        ctx.moveTo(x-sz/2,y-sz/2);
        ctx.lineTo(x+sz/2,y-sz/2);
        ctx.lineTo(x+sz/2,y+sz/2);
        ctx.lineTo(x-sz/2,y+sz/2);
        ctx.lineTo(x-sz/2,y-sz/2);
        ctx.fill();
    }

    function renderAllAnis(sz){
        for (var i=0;i<anis.length;i++){
            var pos = (timestamp-anis[i].startts)/(anis[i].endts-anis[i].startts);
            if (pos < 0){
                continue;
            }
            if (pos >= 1){
                anis[i] = anis[anis.length-1];
                anis.length--;
                i--;
                continue
            }
            var x = anis[i].x*sz;
            var y = anis[i].y*sz;
            if (!CENTER_ON_ANCHORS){
                x += sz/2;
                y += sz/2;
            }
            anis[i].ani.draw(ctx, x, y, sz, pos)
        }

    }

    function frame(ts){
        ts *= SPEED;
        if (timestamp === undefined){
            basets = ts;
            timestamp = ts;
        }
        var elapsed = ts - timestamp
        timestamp = ts;
        ctx.clearRect(0, 0, width, height);
        
        // size shouldn't matter, so they say
        var depth = 1;  // 1, 2, 4, 8, etc.
        var xAnchors = CELLS;
        var cellSize = width/(xAnchors-1);
            
        xAnchors *= depth;
        cellSize /= depth;
        var yAnchors = Math.floor(height/cellSize+1);


        if (!CENTER_ON_ANCHORS){
            xAnchors--;
            //yAnchors--
        }

        // get the next step
        var nstep = Math.floor((timestamp-basets));//*SPEED);
        if (nstep != step){
            step = nstep;
            if (step == 0){
                console.log("let's start a little game of life");
                sizeFields(xAnchors, yAnchors);
                // seed some cells
                for (var i=0;i<(xAnchors*yAnchors/4);i++) {
		            set(0, Math.floor(Math.random()*xAnchors), Math.floor(Math.random()*yAnchors), true);
	            }
            } else {
                sizeFields(xAnchors, yAnchors);
                // Update the state of the next field (b) from the current field (a).
	            for (var y=0;y<yAnchors;y++) {
		            for (var x=0;x<xAnchors;x++) {
                        set(1, x, y, next(0, x, y));
		            }
	            }
	            // Swap fields a and b.
                var tmp = fields[0];
                fields[0] = fields[1];
                fields[1] = tmp;
            }
        }

        // clear the room
        ctx.clearRect(0, 0, width, height);

        if (DRAW_ANCHORS){
            ctx.strokeStyle = "rgba(255,255,255,0.3)";
            ctx.beginPath();
            for (var i=0;i<yAnchors;i++){
                for (var j=0;j<xAnchors;j++){
                    var x = j*cellSize;
                    var y = i*cellSize;
                    ctx.moveTo(x-cellSize/3,y);
                    ctx.lineTo(x+cellSize/3,y);
                    ctx.moveTo(x,y-cellSize/3);
                    ctx.lineTo(x,y+cellSize/3);
                }
            }
            ctx.stroke();
        }

        renderAllAnis(cellSize)
    }
});


// intensity : 0-1
// blur      : pixel size
// pos       : 0-1
function drawRing(ctx, x, y, rad, stroke, opacity, intensity, blur, delay, speed, pos){
    // delay = 0;
    //speed = 0.25;
    pos = (pos-delay)/(1-delay); // adjust for delay
    pos *= 1/speed;
    if (pos <= 0 || pos > 1) {
        return
    }
    stroke *= rad;
    var irad = (rad+stroke)*pos-stroke;
    var orad = irad+stroke;
    if (orad > rad){
        orad = rad;
    }
    if (irad > rad){
        irad = rad;
    }
    if (irad >= orad){
        return
    }
    var nstroke = orad-irad;
    var r = 0.50*intensity;
    var g = 1.00;
    var b = 1.00*intensity;
    var a = opacity;
    var clr = "rgba("+
        Math.floor(r*255)+","+
        Math.floor(g*255)+","+
        Math.floor(b*255)+","+
        a+
    ")";
    if (blur){
        ctx.shadowColor = clr;
        ctx.shadowBlur = blur*rad;
    }
    if (irad <= 0){
        // solid circle
        ctx.fillStyle = clr;
        ctx.beginPath();
        ctx.arc(x, y, orad, 0, 2 * Math.PI, false);
        ctx.fill();
    } else {
        // stroked circle
        ctx.lineWidth = nstroke;
        ctx.strokeStyle = clr;
        ctx.beginPath();
        ctx.arc(x, y, irad+(orad-irad)/2, 0, 2 * Math.PI, false);
        ctx.stroke();
    }
}

function rnd(n) { return Math.random()*n; }

// genani generates an ring animation
function genani(props) {
    // an animation is a single canvas that contains all the frames
    // from left to right.

    var frames = props&&props.frames?props.frames:48;
    var rings = props&&props.rings?props.rings:4;
    var size = props&&props.size?props.size:76;
    var radius = size/4; // room for blur
    var cv = [];   // animation values values
    for (var i=0;i<rings;i++){
        //       stroke,    opacity,       intensity,    blur, delay  pos offset
        cv.push([
            rnd(0.25),       // stroke    (0-1)
            0.5+rnd(0.5),    // opacity   (0-1)
            0.5+rnd(0.5),    // intensity (0-1)
            BLUR?1:0,        // blur      (0-1)
            rnd(0.5),        // delay     (0-1)
            0.5+rnd(0.5),    // speed up  (0-1)
        ])
    }
    var canvas = document.createElement("canvas")
    canvas.width = Math.ceil(size*frames);
    canvas.height = Math.ceil(size);
    var ctx = canvas.getContext("2d");
    for (var i=0;i<frames;i++){
        var pos = i/(frames);
        for (var j=0;j<rings;j++){
            drawRing(ctx, 
            size*i+size/2, size/2, radius, 
                cv[j][0], // stroke
                cv[j][1], // opacity
                cv[j][2], // intensity 
                cv[j][3], // blur    
                cv[j][4], // delay
                cv[j][5], // speed
                pos);
        }
    }
    var fsize = size;
    return {
        canvas: canvas,
        draw: function(ctx, x, y, size, pos){
            // if (pos < 0 || pos > 1){
            //     return;
            // }
            var frame = Math.floor(frames*pos);
            //frame = frames-23;
            ctx.drawImage(canvas, 
                frame*fsize, 0, fsize, fsize,
                x-size, y-size, size*2, size*2);
        }
    };
}

}());
