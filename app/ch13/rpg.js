$(function() {
  var Q = window.Q = Quintus()
                     .include('Input,Sprites,Scenes,DOM')
                     .domOnly()
                     .setup('quintus',{ maximize: true });
  var tileSize = 32;
  var TILE = {
    WALL: 10,
    FLOOR: 30,
    STAIRS: 45
  };
  var impassableTiles = {
    10: true
  };
  Q.input.keyboardControls();
  Q.input.joypadControls({zone: Q.width});

  Q.Level = Q.DOMTileMap.extend({
    legend: {
      "X": "wall",
      ".": "floor",
      "m": "monster",
      "f": "fountain",
      "d": "door",
      "g": "gold",
      "s": "stairs"
    },
    init:function(asset,stage) {
      this.stage = stage;
      this.level = [];
      this.sprites = [];
      var data = Q.asset(asset);
      this.extra = [];
      _.each(data.split("\n"),function(row) { 
        var columns = row.split("");
        if(columns.length > 1) {
          this.level.push(columns);
          this.sprites.push([]);
        }
      },this);

      this._super({
        cols:this.level[0].length,
        rows:this.level.length,
        sheet: 'tiles'
      })

      var tiles =[];
      for(var y=0;y<this.level.length;y++) {
        tiles[y] = [];
        for(var x =0;x<this.level[0].length;x++) {
          var square = this.level[y][x],
              frame = null,
              method = this.legend[square] || "wall";
          
          frame = this[method](x*tileSize,y*tileSize);
          tiles[y].push(frame);
        }
      }
      this.setup(tiles,true);
    },

    insert: function(sprite) {
      this.stage.insert(sprite);
      this.sprites[sprite.p.tileY][sprite.p.tileX] = sprite;
      return sprite;
    },
  
    unfog: function(x,y) {
      for(var sx=x-2,ex=x+2;sx<=ex;sx++) {
        for(var sy=y-2,ey=y+2;sy<=ey;sy++) {
          this.show(sx,sy);
          if(this.validTile(sx,sy) && this.sprites[sy][sx]) {
            this.sprites[sy][sx].show();
          }
        }
      }
    },
    wall: function(x,y) { return TILE.WALL; },
 
    floor: function(x,y) { return TILE.FLOOR; },
 
    stairs: function(x,y) {
      this.startX = x;
      this.startY = y;
      return TILE.STAIRS;
    },
 
    gold: function(x,y) {
      this.insert(new Q.Loot({ x:x, y:y }));
      return TILE.FLOOR;
    },
 
    fountain: function(x,y) {
      this.insert(new Q.Fountain({ x:x, y:y }));
      return TILE.FLOOR;
    },

    monster: function(x,y) {
      var frame = Math.floor(Math.random()*64);
      this.insert(new Q.Enemy({ x:x, y:y, frame:frame }));
      return TILE.FLOOR;
    }
   
  });


  Q.register('tiled', {
    added:function() {
      var p = this.entity.p;
      _(p).extend({
        wait: 0,
        delay: 0.15,
        tileX: Math.floor(p.x / tileSize),
        tileY: Math.floor(p.y / tileSize),
        dx: 0,
        dy: 0
      });
      this.direction = {};
      this.entity.bind('step',this,'move');
      this.entity.bind('removed',this,'removed');
    },

    move: function(dt) {
      var p =this.entity.p,
          stage = this.entity.parent;

      if(p.wait <= 0) {
        var destX = p.tileX, destY = p.tileY;

        if(p.attacking) {
            this.entity.trigger('attack',this.direction);
        } else if(p.dx || p.dy) {
          if(p.dx > 0) { destX += 1; }
          else if(p.dx < 0) { destX -= 1 };
          if(p.dy > 0) { destY += 1; }
          else if(p.dy < 0) { destY -= 1; }

          if(!impassableTiles[stage.level.get(destX,destY)]) {
            var sprite = stage.level.sprites[destY][destX];
            this.direction.dx = destX - p.tileX;
            this.direction.dy = destY - p.tileY;
            this.direction.sprite = sprite;
            if(!sprite) {
              this.moved(destX,destY);
              this.setPosition();
              p.wait = p.delay;
            } else {
              p.wait = p.delay * 2;
            }
            this.entity.trigger(sprite ? 'hit' : 'moved',
                                this.direction);
          }
        } 
      } else {
        p.wait -= dt;
      }
    },
    setPosition: function() {
      var p =this.entity.p;
      p.x = p.tileX * tileSize;
      p.y = p.tileY * tileSize;
    },
    moved: function(destX,destY) {
      var stage = this.entity.parent;
      var p =this.entity.p;
      stage.level.sprites[p.tileY][p.tileX] = null;
      p.tileX = destX;
      p.tileY = destY;
      stage.level.sprites[p.tileY][p.tileX] = this.entity;
    },
    removed: function() {
      var stage = this.entity.parent;
      var p =this.entity.p;
      stage.level.sprites[p.tileY][p.tileX] = null;
    }
  });

  Q.register('transition', {
    added: function() {
      Q.transitionDOM(this.entity.dom,'transform','0.25s');
    }
  });


  Q.register('camera', {
    added: function() {
      this.entity.bind('moved',this,'track');
    },
    track: function() {
      var p = this.entity.p,
          stage = this.entity.parent;
      stage.centerOn(p.x, p.y);
      stage.level.unfog(p.tileX,p.tileY);
    }
  });

  Q.register('player_input', {
    added: function() {
      this.entity.bind('step',this,'input');
    },
    input: function() {
      var p = this.entity.p;
      if(Q.inputs['left']) { p.dx = -1 }
      else if(Q.inputs['right']) { p.dx = 1;}
      else { p.dx = 0;}
      if(Q.inputs['up']) { p.dy = -1 }
      else if(Q.inputs['down']) { p.dy = 1;}
      else { p.dy = 0;}
    }
  });

  Q.register('healthbar', {
    added: function() {
      this.entity.bind('health',this,'update');

      this.bg = $("<div>").appendTo(this.entity.dom).css({
        width: "100%",
        height: 5,
        position: 'absolute',
        bottom: -6,
        left: 0,
        backgroundColor: "#000",
        border: "1px solid #999"
      }).hide();

      this.bar = $("<div>").appendTo(this.entity.dom).css({
        width: "100%",
        height: 5,
        position: 'absolute',
        bottom: -5,
        left: 1,
        backgroundColor: "#F00"
      }).hide();

      Q.transitionDOM(this.bar[0],'width');

    },

    large: function() {
      this.bg.css({ height: 20, bottom: -1 }).show();
      this.bar.css({ height: 20, bottom: 0 }).show();
      return this;
    },

    update: function(sprite) {
      this.bar.show();
      this.bg.show();
      var p = sprite.p;
      var width = Math.round(p.health / p.maxHealth * 100);
      this.bar.css('width',width + "%");
    }
  });




  Q.Player = Q.Sprite.extend({
    init: function(props) {
      this._super(_({
        sheet: 'characters',
        frame: 65,
        wait: 0,
        z: 10,
        attack: 5,
        health: 40,
        maxHealth: 40,
        gold: 0,
        xp: 0
      }).extend(props));
      this.add('player_input, tiled, camera, transition');
      this.bind('hit',this,'collision');
      this.bind('attack',this,'attack');
      this.bind('interact',this,'interact');
      this.bind('heal',this,'heal');
    },

    collision: function(data) {
      this.p.x += data.dx * tileSize/2; 
      this.p.y += data.dy * tileSize/2; 
      this.p.attacking = true;
    },

    attack: function(data) {
      var damage = Math.round(Math.random() * this.p.attack);
      data.sprite.trigger('interact',
                          { source: this, damage: damage });
      this.p.attacking = false;
      this.tiled.setPosition();
    },

    interact: function(data) {
      this.p.health -= data.damage;
      if(this.p.health <= 0) {
        this.destroy();
      }
      this.trigger('health');
    },

    heal: function(data) {
      this.p.health += data.amount;
      if(this.p.health > this.p.maxHealth) {
        this.p.health = this.p.maxHealth;
      }
      this.trigger('health');
    }
  });

  Q.Enemy = Q.Sprite.extend({
    init: function(props) {
      this._super(_({
        sheet: 'characters',
        z: 10,
        health: 10,
        maxHealth: 10,
        damage: 5,
        xp: 100
      }).extend(props));
      this.add('tiled, transition, healthbar');
      this.bind('interact',this,'interact');
      this.hide();
    },

    interact: function(data) {
      this.p.health -= data.damage;
      if(this.p.health <= 0) {
        this.destroy();
        data.source.trigger('xp',this.p.xp);
      } else {
        var damage = Math.round(Math.random() * this.p.damage);
        data.source.trigger('interact',
                            { source: this, damage: damage });
      }
      this.trigger('health',this);
    }
  });

  Q.Fountain= Q.Sprite.extend({
    init: function(props) {
      this._super(_({
        sheet: 'tiles',
        frame: 71,
        z: 10,
        power: 10
      }).extend(props));
      this.add('tiled');
      this.bind('interact',this,'interact');
      this.hide();
    },

    interact: function(data) {
      data.source.trigger('heal',{ amount: this.p.power });
    }
  });

  Q.Loot = Q.Sprite.extend({
    init: function(props) {
      this._super(_({
        sheet: 'items',
        frame: Math.floor(Math.random() * 30 * 9) + 150, 
        z: 10,
        gold: Math.floor(Math.random() * 100)
      }).extend(props));
      this.add('tiled');
      this.bind('interact',this,'interact');
      this.hide();
    },
    interact: function(data) {
      data.source.trigger('gold',this.p.gold);
      this.destroy();
    }
  });



  Q.Stat = Q.Sprite.extend({
    init: function(props) {
      this._super(_(props).extend({
        w: 100, h: 20, z: 100
      }));
      
      this.el.css({color: 'white', fontFamily: 'arial' })
             .text(this.p.text + ": 0");
    },

    update: function(data) {
      this.el.text(this.p.text + ": " + data.amount);
    }
  });

  Q.PlayerHealth = Q.Sprite.extend({
    init: function(props) {
      this._super(_(props).extend({
        w: Q.width / 4, h: 20, z: 100
      }));
      this.add('healthbar');
      this.healthbar.large();
    },
    update: function(sprite) {
      this.trigger('health',sprite);
    }
  });




  


  Q.load(['characters.png',
          'dungeon.png',
          'items.png',
          'level1.txt'], function() {
    
    Q.sheet('characters', 'characters.png', 
            { tilew: tileSize, tileh: tileSize });
    
    Q.sheet('tiles', 'dungeon.png', 
            { tilew: tileSize, tileh: tileSize });
    
    Q.sheet('items', 'items.png',
            { tilew: tileSize, tileh: tileSize });

    Q.scene('hud',new Q.Scene(function(stage) {
      var health, gold, xp;
      health = stage.insert(new Q.PlayerHealth({ x: 0, y: 10 }));
      stage.bind('health',health,'update');
      gold = stage.insert(new Q.Stat({ 
                                  text: "gold", x: Q.width-100, y: 10 
                              }));

      stage.bind('gold',gold,'update');
      xp = stage.insert(new Q.Stat({ text: "xp", x: Q.width-200, y: 10 }));
      stage.bind('xp',xp,'update');
    }));

    
    Q.scene('level1',new Q.Scene(function(stage) {
      Q.stageScene('hud',1);
      if(Q.width > 600 || Q.height > 600) {
        stage.rescale(2);
      }

      stage.level = stage.insert(
                      new Q.Level("level1.txt",stage)
                    );

      stage.add('transition');
      var player = stage.insert(new Q.Player({ x: stage.level.startX ,
                                               y: stage.level.startY }));

      player.camera.track();
      player.bind('removed',stage,function() {
       Q.stageScene('level1');
      });

      player.bind('health',stage,function() {
        Q.stage(1).trigger('health',player);
      });

      Q.stage(1).trigger('health',player);
      player.bind('gold',stage,function(amount) {
        player.p.gold += amount;
        Q.stage(1).trigger('gold',{ amount: player.p.gold });
      });

      player.bind('xp',stage,function(amount) {
        player.p.xp += amount;
        Q.stage(1).trigger('xp',{ amount: player.p.xp });
      });
    

   
    }));
    Q.stageScene('level1');
  });
});

