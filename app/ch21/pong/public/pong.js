$(function() {

  var Q = window.Q = Quintus()
                     .include('Input,Sprites,Scenes')
                     .setup('quintus');
  var socket = io.connect();

  Q.input.keyboardControls()
  Q.input.touchControls({ 
            controls:  [ ['left','<' ],[],[],[],['right','>' ]]
          });

  var gameType = null, delay = 0;

  Q.Paddle = Q.Sprite.extend({
    init: function(props) {
      this._super(_(props).defaults({
        w: 60, h: 20,
        speed: 200,
        direction: null
      }));
    },

    step: function(dt) {
      dt += this.p.paddleDelay / 1000;
      this.p.paddleDelay = 0;

      if(this.p.direction == 'left') {
        this.p.x -= this.p.speed * dt;
      } else if(this.p.direction == 'right') {
        this.p.x += this.p.speed * dt;
      } 

      if(this.p.x < 0) { this.p.x = 0; }
      if(this.p.x > Q.width - this.p.w) { this.p.x = Q.width - this.p.w; }
    },

    draw: function(ctx) {
      ctx.fillStyle = "black";
      ctx.fillRect(Math.floor(this.p.x),
                   Math.floor(this.p.y),
                   this.p.w,this.p.h);

    }
  });

  Q.PlayerPaddle = Q.Paddle.extend({
    step: function(dt) {
      var lastDirection = this.p.direction;

      this.p.direction = null;
      if(Q.inputs['left']) {
        this.p.direction = 'left';
      } else if(Q.inputs['right']) {
        this.p.direction = 'right';
      }

      this._super(dt);

      if(lastDirection != this.p.direction) {
        socket.emit("move",[this.p.direction,this.p.x]);
      }
    }
  });


  Q.EnemyPaddle = Q.Paddle.extend({ 
    init: function(props) {
      this._super(props);

      var self = this, p = this.p;
      socket.on("move",function(data) {
        p.direction = data[0];
        p.x = data[1];
        self.step(delay/1000);
      });
    }
  });


  Q.Ball = Q.Sprite.extend({
    init: function(props) {
      this._super(_(props||{}).defaults({
        x: 200, y: 100,
        w: 10,  h: 10,
        dx: -1, dy: -1,
        speed: 100,
        ballRate: 0.5,
        ballSend: 0.5
      }));

      var self = this, p = this.p;
      if(gameType == 'slave') {
        socket.on("ball",function(pos) {
          p.x = pos.x;
          p.y = pos.y;
          p.dx = pos.dx;
          p.dy = pos.dy;
          self.step(delay/1000);
        });
      }

    },

    step: function(dt) {
      var p = this.p;

      var hit = Q.stage().collide(this);
      if(hit) {
        p.dy = hit.p.y < 100 ? 1 : -1;
      }

      p.x += p.dx * p.speed * dt;
      p.y += p.dy * p.speed * dt;

      var maxX = Q.width - p.w;

      if(p.x < 0) { p.x = 0; p.dx = 1; } 
      else if(p.x > maxX) { p.dx = -1; p.x = maxX; }
      
      if(p.y < 0 || p.y > Q.height) { 
        p.x = 200; p.y = 100;
        p.dy *= -1;
      } 

      if(gameType == 'master') {
        p.ballSend -= dt;
        if(p.ballSend < 0) {
          socket.emit("ball", { x: p.x, y: p.y, dx: p.dx, dy: p.dy });
          p.ballSend += p.ballRate;
        }
      }
    },

    draw: function(ctx) {
      ctx.fillStyle = "black";
      ctx.beginPath();
      ctx.arc(this.p.x + this.p.w/2,
              this.p.y + this.p.h/2,
              this.p.w/2,0,Math.PI*2); 
      ctx.fill();
    }

  });

  Q.scene('game',new Q.Scene(function(stage) {

    if(gameType == 'master') {
      stage.insert(new Q.PlayerPaddle({ x:0, y: 40}));
      stage.insert(new Q.EnemyPaddle({ x:0, y: Q.height - 100}));
    } else if(gameType == 'slave') {
      stage.insert(new Q.EnemyPaddle({ x:0, y: 40}));
      stage.insert(new Q.PlayerPaddle({ x:0, y: Q.height - 100}));
    }
    stage.insert(new Q.Ball());

  }));


  socket.on("master",function() {
    gameType = 'master';
    Q.stageScene("game");
  });


  socket.on("slave",function() {
    gameType = 'slave';
    Q.stageScene("game");
  });

  socket.on("end",function() {
    Q.clearStage(0);
  });
  
  socket.on('delay',function(data) {
    if(data.steps == 3) {
      // delay 1/2 of the round trip time
      delay = (new Date().getTime() - data.timer)/2;
      if(delay > 50) {
        delay = 50;
      }
    } else {
      data.steps += 1;
      socket.emit('delay',data);
    }
  });

  setInterval(function() {
    socket.emit('delay',{ steps: 0, timer: new Date().getTime() });
  },2000);

});

