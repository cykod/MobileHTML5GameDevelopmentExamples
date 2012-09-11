
Quintus.Platformer = function(Q) {

  
  Q.TileLayer = Q.Sprite.extend({

    init: function(props) {
      this._super(_(props).defaults({
        tileW: 32,
        tileH: 32,
        blockW: 10,
        blockH: 10,
        type: 1
      }));

      if(this.p.dataAsset) {
        this.load(this.p.dataAsset);
      }

      this.blocks = [];

      // reusable collision object
      this.colBounds = {}; 

      this.directions = [ 'top','left','right','bottom'];
    },

    load: function(dataAsset) {
      var data = _.isString(dataAsset) ?  Q.asset(dataAsset) : dataAsset;

      this.p.tiles = data;
      this.p.rows = data.length;
      this.p.cols = data[0].length;
      this.p.w = this.p.rows * this.p.tileH;
      this.p.h = this.p.cols * this.p.tileW;
    },

    draw: function(ctx) {
      var p = this.p,
          tiles = p.tiles,
          sheet = this.sheet();

      for(var y=0;y < p.rows;y++) {
        if(tiles[y]) {
          for(var x =0;x < p.cols;x++) {
            if(tiles[y][x]) {
              sheet.draw(ctx,
                         x*p.tileW + p.x,
                         y*p.tileH + p.y,
                         tiles[y][x]);
            }
          }
        }
      }
    }
  });


};


