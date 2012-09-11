$(function() {

  var Q = Quintus().setup('quintus', { maximize: true }),
      socket = io.connect(),
      start = {}, 
      move = {};


  function getTouch(e) {
    var touch = e.originalEvent.changedTouches ? 
                e.originalEvent.changedTouches[0] : e,
        canvasPos = Q.el.offset(),
        canvasX = (touch.pageX - canvasPos.left) / Q.el.width() * Q.width,
        canvasY = (touch.pageY - canvasPos.top) / Q.el.height() * Q.height;

    e.preventDefault();
    return { x: canvasX, y: canvasY };
  }

  function drawLine(from,to) {
    Q.ctx.strokeStyle= "#000";
    Q.ctx.beginPath();
    Q.ctx.moveTo(from.x,from.y);
    Q.ctx.lineTo(to.x,to.y);
    Q.ctx.stroke();
  }

  Q.el.on('touchstart mousedown',function(e) {
    start = getTouch(e);
  });

  Q.el.on('touchmove mousemove',function(e) {
    if(!start.x) return;
    move = getTouch(e);

    drawLine(start,move);

    socket.emit("paint",{ start: start, move: move });
    start = move;
  });

  Q.el.on('touchend mouseup mouseleave',function(e) {
    start.x = null;
  });

  socket.on("connect",function() {
    console.log("Connected");
  });

  socket.on("paint",function(data) {
    drawLine(data.start,data.move);
  });

  socket.on("clear",function(data) {
    Q.ctx.clearRect(0,0,Q.width,Q.height);
  });
  

});
