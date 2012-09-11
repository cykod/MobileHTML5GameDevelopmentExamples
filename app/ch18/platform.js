$(function() {
  var Q = window.Q = Quintus()
                     .include('Input,Sprites,Scenes,Anim,Platformer')
                     .setup('quintus', { maximize: true })
                     .controls();

  Q.Enemy = Q.Sprite.extend({
    init:function(props) {
      this._super(_(props).extend({
        sheet: 'blob',
        sprite: 'blob',
        rate: 1/15,
        type: 2,
        collisionMask: 5,
        health: 50,
        speed: 100,
        direction: 'left'
      }));
      this.bind('damage',this,'damage');
      this.bind('hit.tile',this,'changeDirection');
      this.bind('hit.sprite',this,'hurtPlayer');
      this.add('animation, 2d')
          .collisionPoints()
    },

    changeDirection: function(col) {
      if(col.direction == 'left') {
       this.p.direction = 'right';
      } else if(col.direction == 'right') {
        this.p.direction = 'left';
      }
    },

    hurtPlayer: function(col) {
      if(col.p.x < this.p.x) {
        col.p.x -= 10;
        col.damage(5);
      } else {
        col.p.x += 10;
        col.damage(5);
      }
    },

    damage: function(amount) {
      this.p.health -= amount;
      if(this.p.health <= 0) {
        this.destroy();
      }
    }, 

    step: function(dt) {
      var p = this.p;
      if(p.direction == 'right') {
        this.play('run_right');
        p.vx = p.speed;
      } else {
        this.play('run_left');
        p.vx = -p.speed;
      }
      this._super(dt);
    }
  });
                     
  Q.Player = Q.Sprite.extend({
    init:function(props) {
      this._super(_(props).extend({
        sheet: 'man',
        sprite: 'player',
        rate: 1/15,
        speed: 250,
        standing: 3,
        type: 4,
        health: 100,
        collisionMask: 1,
        direction: 'right'
      }));

     this.add('animation, 2d')
          .collisionPoints({
            top: [[ 20, 3]],
            left: [[ 5,15], [ 5,40]], 
            bottom: [[ 20,51 ]],
            right: [[ 30,15], [ 30,40]]
          });
 
      this.bind('animEnd.fire_right',this,"launchBullet");
      this.bind('animEnd.fire_left',this,"launchBullet");
      this.bind('hit.tile',this,'tile');
      Q.input.bind('fire',this,"fire");
      Q.input.bind('action',this,"jump");
    },

    fire: function() {
      this.play('fire_' + this.p.direction,2);
    },

    damage: function(amount) {
      this.p.health -= amount;
      if(this.p.health < 0) {
        Q.stageScene("level",0,Q.PlatformStage);
      }
    },
    launchBullet: function() {
      var p = this.p,
          vx = p.direction == 'right' ? 500 : -500,
          x = p.direction == 'right' ? (p.x + p.w) : p.x;
      this.parent.insert(new Q.Bullet({ x: x, y: p.y + p.h/2, vx: vx }));
    },

    jump: function() {
      if(this.p.standing >= 0) {
        this.p.vy = -this.p.speed * 1.4;
        this.p.standing = -1;
      }
    },

    tile: function(collision) {
      if(collision.direction == 'bottom') {
        this.p.standing = 5;
      }
    },

    step: function(dt) {
      var p = this.p;
      if(p.animation == 'fire_right' || p.animation == 'fire_left') {
        if(this.p.standing > 0) {
          this.p.vx = 0;
        }
      } else {
        if(this.p.standing < 0) {
          if(p.vx) {
            p.direction = p.vx > 0 ? 'right' : 'left';
          }
          this.play('fall_' + p.direction,1);
        }
        if(Q.inputs['right']) {
          this.play('run_right');
          p.vx = p.speed;
          p.direction = 'right';
        } else if(Q.inputs['left']) {
          this.play('run_left');
          p.vx = -p.speed;
          p.direction = 'left';
        } else {
          p.vx = 0;
          this.play('stand_' + p.direction);
        }
        this.p.standing--;
      }
      this._super(dt);
    }
  });

  Q.Bullet = Q.Sprite.extend({
    init: function(props) {
      this._super(_(props).extend({ w:4, h:2, 
                                    gravity:0, collisionMask:3  }));
      this.add('2d')
      this.collisionPoints();
      this.bind('hit.tile',this,'remove');
      this.bind('hit.sprite',this,'damage');
    },

    remove: function() {
      this.destroy();
    },

    damage: function(obj) {
      obj.trigger('damage',10);
      this.destroy();
    },

    draw: function(ctx) {
      var p = this.p; 
      ctx.fillStyle = "#000";
      ctx.fillRect(p.x,p.y,p.w,p.h);
    }
  });
  
   
  Q.scene('level',new Q.Scene(function(stage) {
    stage.insert(new Q.Repeater({ asset: 'background-wall.png', 
                                  speedX: 0.50, y:-225, z:0 }));
    var tiles = stage.insert(new Q.TileLayer({ sheet: 'block',
                                               x: -100, y: -100,
                                               tileW: 32,
                                               tileH: 32,
                                               dataAsset: 'level.json', 
                                               z:1 }));
    stage.collisionLayer(tiles);
    var player = stage.insert(new Q.Player({ x:100, y:0, z:3, sheet: 'man' }));

    stage.insert(new Q.Enemy({ x:400, y:0, z:3 }));
    stage.insert(new Q.Enemy({ x:600, y:0, z:3 }));
    stage.insert(new Q.Enemy({ x:1200, y:100, z:3 }));
    stage.insert(new Q.Enemy({ x:1600, y:0, z:3 }));

    stage.add('viewport');
    stage.follow(player);
  }, { sort: true }));

  Q.load(['sprites.png','sprites.json',
          'background-wall.png','level.json'],function() {
    Q.compileSheets('sprites.png','sprites.json');

    Q.animations('player', {
      run_right: { frames: _.range(7,-1,-1), rate: 1/15}, 
      run_left: { frames: _.range(19,11,-1), rate:1/15 },
      fire_right: { frames: [9,10,10], next: 'stand_right', rate: 1/30 },
      fire_left: { frames: [20,21,21], next: 'stand_left', rate: 1/30 },
      stand_right: { frames: [8], rate: 1/5 },
      stand_left: { frames: [20], rate: 1/5 },
      fall_right: { frames: [2], loop: false },
      fall_left: { frames: [14], loop: false }
    });

    Q.animations('blob', {
      run_right: { frames: _.range(0,2), rate: 1/5 },
      run_left: { frames: _.range(2,4), rate: 1/5 }
    });
    Q.stageScene("level",0,Q.PlatformStage);
  });
});

