
Quintus.Editor = function(Q) {

  Q.register('editor',{
    added: function() {
      var stage = this.entity;

      stage.pause();

      $("#quintus-editor").remove();
      this.controls = $("<div id='quintus-editor'>")
          .appendTo(Q.wrapper)
          .css({position:"absolute",top:0, zIndex: 100});

      _.bindAll(this);

      this.buttons = {
        move: this.button("move",this.move),
        paint: this.button("paint",this.paint),
        erase: this.button("erase",this.erase),
        select: this.button("tile",this.tile),
        play: this.button("play",this.play),
        out: this.button("-",this.out),
        in: this.button("+",this.in),
        save: this.button("save",this.save) 
      };

      this.select('move');

      this.activeTile = 1;

      Q.el.on('touchstart mousedown',this.touch);
      Q.el.on('touchmove mousemove',this.drag);
      Q.el.on('touchend mouseup',this.release);
    },

    setFile: function(levelFile) {
      this.levelFile = levelFile;
    },

    button: function(text,callback) {

      var elem = $("<div>")
                   .text(text)
                   .css({float:'left',
                         margin: "10px 5px",
                         padding:"15px 5px",
                         backgroundColor:'#DDD',
                         width:35,
                         textAlign:'center',
                         fontSize: "14px",
                         cursor:'pointer',
                         fontFamily: 'Arial',
                         fontWeight:'bold',
                         borderRadius: "5px",
                         boxShadow: "2px 2px 5px #999",
                       color:"black"})
                    .appendTo(this.controls);

                         
      elem.on('mousedown touchstart',callback);
      return elem;
    },

    select: function(button) {
      if(this.selected) {
        this.buttons[this.selected].css('backgroundColor','#DDD');
      }
      this.selected = button;

      if(this.buttons[this.selected]) {
        this.buttons[this.selected].css('backgroundColor','#FFF');
      }

    },

    move: function() {
      this.select('move');
    },

    paint: function() {
      this.select('paint');
    },

    erase: function() {
      this.select('erase');
    },


    play: function(e) {
      if(this.playing) {
        this.buttons['play'].text('Play');
        Q.input.disableTouchControls();
        this.entity.trigger('reset');
        this.select();

      } else {
        Q.el.off('touchstart mousedown',this.touch);
        Q.el.off('touchmove mousemove',this.drag);
        Q.el.off('touchend mouseup',this.release);
        this.select('play');
        this.buttons['play'].text('reset');
        this.playing = true;
        this.entity.unpause();
        Q.controls();
      }
      e.preventDefault();
    },

    out: function() {
      this.entity.viewport.scale /= 1.5;
      this.entity.viewport.recenter();
    },

    in: function() {
      this.entity.viewport.scale *= 1.5;
      this.entity.viewport.recenter();
    },

    touch: function(e) {
      var touch = e.originalEvent.changedTouches ? e.originalEvent.changedTouches[0] : e,
          stage = this.entity;

      this.start = { pageX: touch.pageX, pageY: touch.pageY };
      this.viewportX = stage.viewport.centerX;
      this.viewportY = stage.viewport.centerY;

      this.tool(touch);
      e.preventDefault();
    },


    drag: function(e) {
      var touch = e.originalEvent.changedTouches ? e.originalEvent.changedTouches[0] : e,
          stage = this.entity;


      if(this.start) {
        this.tool(touch);
      }
      e.preventDefault();

    },

    release: function(e) {
      this.start= null;
    }, 

   tilePos: function(x,y) {
      var canvasPos = $(Q.el).offset(),
          canvasX = (x - canvasPos.left) / Q.el.width() * Q.width,
          canvasY = (y - canvasPos.top) / Q.el.height() * Q.height,
          viewport = this.entity.viewport,
          tileLayer = this.entity.collision,
          tileX = Math.floor((canvasX / viewport.scale + viewport.x - tileLayer.p.x) / tileLayer.p.tileW),
          tileY = Math.floor((canvasY / viewport.scale + viewport.y - tileLayer.p.y) / tileLayer.p.tileH);

      return { x: tileX, y: tileY };
    },



    tool: function(touch) {
      var stage = this.entity,
          viewport = stage.viewport;

      switch(this.selected) {
        case 'move':
          stage.centerOn(this.viewportX + (this.start.pageX - touch.pageX) / viewport.scale,
                         this.viewportY + (this.start.pageY - touch.pageY) / viewport.scale);
          break;
        case 'paint':
          var tile = this.tilePos(touch.pageX, touch.pageY);
          stage.collision.setTile(tile.x,tile.y,this.activeTile);
          break;
        case 'erase':
          var tile = this.tilePos(touch.pageX, touch.pageY);
          stage.collision.setTile(tile.x,tile.y,0);
          break;
      }

    },


    tile: function() {
      if(!this.tiles) this.setupTiles();
      $(this.tiles).show();
    },

    setupTiles: function() {
      var sheet = this.entity.collision.sheet();

      this.tiles = document.createElement("canvas");
      this.tiles.width = Q.el.width();
      this.tiles.height = Q.el.height();

      var x = 0, y = 0, ctx = this.tiles.getContext('2d');

      for(var i=0;i<sheet.frames;i++) {
        sheet.draw(ctx, x, y, i);
        x += sheet.tilew;
        if(x >= this.tiles.width) {
          x = 0;
          y += sheet.tileh;
        }
      }

      $(this.tiles)
        .prependTo(this.controls)
        .css({position:'absolute',
              top:60, 
              zIndex: 200,
              backgroundColor:'white',
              width: Q.el.width(),
              height: Q.el.height()
            })
        .on('touchstart mousedown',this.selectTile);
    },

    selectTile: function(e) {
      var touch = e.originalEvent.changedTouches ? e.originalEvent.changedTouches[0] : e,
          canvasPos = $(this.tiles).offset(),
          canvasX = (touch.pageX - canvasPos.left),
          canvasY = (touch.pageY - canvasPos.top),
          tileLayer = this.entity.collision,
          sheet = tileLayer.sheet(),
          tileX = Math.floor(canvasX / sheet.tilew),
          tileY = Math.floor(canvasY / sheet.tileh),
          frame = tileX + tileY * Math.floor(this.tiles.width / sheet.tilew);

       $(this.tiles).hide();
       if(frame <= sheet.frames) {
         this.activeTile = frame;
       }
       e.preventDefault();

    },

    save: function() {
      var levelName = prompt("Level Name?",this.levelFile);
      if(levelName) {
        $.post('/save',{ tiles: this.entity.collision.p.tiles, level: levelName });
      }
    }

 
  });
};

