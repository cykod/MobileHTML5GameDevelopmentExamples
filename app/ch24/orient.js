$(function() {

  var Q = window.Q = Quintus()
                     .include('Input,Sprites,Scenes,SVG,Physics')
                     .svgOnly()
                     .setup('quintus',{ maximize: true });

  Q.Ball = Q.Sprite.extend({
    init: function(props) {
      this._super(_(props).defaults({
        shape: 'circle',
        color: 'red',
        r: 25,
        restitution: 0.9,
        density: 4,
        seconds: 5
      }));
      this.add('physics');
    }

  });

  function rotateContainer() {
    $("#quintus_container")[0].style.webkitTransform = 
                     "rotate(" + -1*window.orientation + "deg)";
  }

  rotateContainer();
  $(window).on("orientationchange",rotateContainer);


  Q.scene('level',new Q.Scene(function(stage) {

    stage.add("world");

    // Create the walls
    stage.insert(new Q.Sprite({ x: 5, y: 300, w: 10, h: 600 }));
    stage.insert(new Q.Sprite({ x: 395, y: 300, w: 10, h: 600 }));
    stage.insert(new Q.Sprite({ x: 200, y: 5, w: 400, h: 10 }));
    stage.insert(new Q.Sprite({ x: 200, y: 595, w: 400, h: 10 }));

    // Add the center object
    var center = stage.insert(new Q.Sprite({
      x: 200, y: 300, w: 100, h: 200
    }));

    stage.each(function() { 
      this.p.type = 'static'; 
      this.add("physics"); 
    });

    // Add the balls
    stage.insert(new Q.Ball({ x: 100, y: 50, color:"blue" }));
    stage.insert(new Q.Ball({ x: 200, y: 50, color:"pink" }));
    stage.insert(new Q.Ball({ x: 300, y: 50, color:"black" }));
    stage.insert(new Q.Ball({ x: 100, y: 150, color:"green" }));
    stage.insert(new Q.Ball({ x: 200, y: 150, color:"teal" }));
    stage.insert(new Q.Ball({ x: 300, y: 150, color:"orange" }));

    stage.viewport(400,600);
    stage.centerOn(200,300);

    if (window.DeviceOrientationEvent) {

      $(window).on("deviceorientation",function(e) {
        var eventData = e.originalEvent
            tiltLR = eventData.gamma,
            tiltFB = eventData.beta,
            direction = eventData.alpha;

        center.physics._body.SetAngle(direction * Math.PI / 180);

        var leanAngle = tiltLR * Math.PI / 180,
            tiltAngle = tiltFB * Math.PI /180,
            gravityX = 20 * Math.sin(leanAngle),
            gravityY = 20 * Math.sin(tiltAngle);

        stage.world._world.m_gravity.x = gravityX;
        stage.world._world.m_gravity.y = gravityY;

      });
    }


        
  }));

  Q.stageScene("level");
});
