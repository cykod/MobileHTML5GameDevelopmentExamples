var fs = require('fs'),
    Canvas = require('canvas'),
    canvas = new Canvas(200,200), 
    ctx = canvas.getContext('2d');

ctx.fillStyle = "#CCC";
ctx.fillRect(0,0,100,100);
ctx.fillStyle = "#C00";
ctx.fillRect(50,50,100,100);
fs.writeFileSync("./sprites.png",canvas.toBuffer());

