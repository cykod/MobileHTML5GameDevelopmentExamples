$(function() {
  var Q = window.Q = Quintus()
                     .include('Input,Sprites,Scenes,Anim')
                     .setup('quintus', { maximize: true })
                     .controls() 
  Q.Player = Q.Sprite.extend({
    init:function(props) {
      this._super(_(props).extend({
        sheet: 'man',
        sprite: 'player',
        rate: 1/15,
        speed: 700
      }));
      this.add('animation');
      this.bind('animEnd.fire',this,function() { 
                                     console.log("Fired!"); 
                                    });
      this.bind('animLoop.run_right',this,function() { 
                                           console.log("right"); 
                                          });
      this.bind('animLoop.run_left',this,function() { 
                                          console.log("left"); 
                                         });
      Q.input.bind('fire',this,"fire");
    },
    fire: function() {
      this.play('fire',1);
    },
    step: function(dt) {
      var p = this.p;
      if(p.animation != 'fire') {
        if(Q.inputs['right']) {
          this.play('run_right');
          p.x += p.speed * dt;
        } else if(Q.inputs['left']) {
          this.play('run_left');
          p.x -= p.speed * dt;
        } else {
          this.play('stand');
        }
      }
      this._super(dt);
    }
  });

  Q.Block = Q.Sprite.extend({
    init:function(props) {
      this._super(_(props).extend({ sheet: 'woodbox' }));
    }
  });

  Q.scene('level',new Q.Scene(function(stage) {
    stage.insert(new Q.Repeater({ asset: 'background-wall.png', 
                                  speedX: 0.50, repeatY: false, y:-225 }));
    stage.insert(new Q.Repeater({ asset: 'background-floor.png',
                                  speedX: 1.0, repeatY: false,  y:260}));

    var player = stage.insert(new Q.Player({ x:100, y:50, z:2 }));
    stage.insert(new Q.Block({ x:800, y:160, z:1 }));
    stage.insert(new Q.Block({ x:550, y:160, z:1 }));
  
    stage.add('viewport');
    stage.follow(player);
    Q.input.bind('action',stage,function() {
      stage.viewport.scale = stage.viewport.scale == 1 ? 0.5 : 1;
    });
  }, { sort: true }));


  Q.load(['sprites.png','sprites.json',,'background-floor.png',
          'background-wall.png'],function() {
    Q.compileSheets('sprites.png','sprites.json');
    Q.animations('player', {
      run_right: { frames: _.range(7,-1,-1), rate: 1/10}, 
      run_left: { frames: _.range(0,8), rate:1/10 },
      fire: { frames: [8,9,10,8], next: 'stand', rate: 1/30 },
      stand: { frames: [8], rate: 1/5 }
    });
    Q.stageScene("level");
  });
});

