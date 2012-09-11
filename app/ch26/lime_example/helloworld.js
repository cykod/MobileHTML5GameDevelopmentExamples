goog.provide('movingballs');

goog.require('lime.Director');
goog.require('lime.Scene');
goog.require('lime.Circle');
goog.require('lime.animation.Spawn');
goog.require('lime.animation.FadeTo');
goog.require('lime.animation.ScaleTo');
goog.require('lime.animation.MoveTo');


movingballs.start = function(){

  var director = new lime.Director(document.body,1024,768),
      scene = new lime.Scene();

  director.makeMobileWebAppCapable();

  goog.events.listen(scene,['mousedown','touchstart'],function(e){

    var circle = new lime.Circle()
                         .setSize(50,50)
                         .setFill(Math.floor(Math.random()*255),
                                  Math.floor(Math.random()*255),
                                  Math.floor(Math.random()*255));
    scene.appendChild(circle);
    circle.setPosition(e.position.x,e.position.y)
          .setOpacity(0.5);
              

    e.swallow(['mousemove','touchmove'],function(e) {
      circle.runAction(
        new lime.animation.MoveTo(e.position)
                          .setEasing(lime.animation.Easing.LINEAR)

      );
    });

    e.swallow(['mouseup','touchend'],function(e){
      circle.runAction(new lime.animation.Spawn(
        new lime.animation.FadeTo(1),
        new lime.animation.ScaleTo(1.5)
        ));
      });
    });

    director.replaceScene(scene);
  };

