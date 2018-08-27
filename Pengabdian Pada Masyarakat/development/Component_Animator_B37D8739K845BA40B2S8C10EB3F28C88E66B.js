var Component_Animator,
  extend = function(child, parent) { for (var key in parent) { if (hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; },
  hasProp = {}.hasOwnProperty;

Component_Animator = (function(superClass) {
  extend(Component_Animator, superClass);


  /**
  * An animator-component allows to execute different kind of animations 
  * on a game object. The animations are using the game object's 
  * dstRect & offset-property to execute.
  *
  * @module gs
  * @class Component_Animator
  * @extends gs.Component
  * @memberof gs
  * @constructor
   */

  function Component_Animator() {
    Component_Animator.__super__.constructor.apply(this, arguments);
    this.moveAnimation = new gs.Component_MoveAnimation();
    this.pathAnimation = new gs.Component_PathAnimation();
    this.zoomAnimation = new gs.Component_ZoomAnimation();
    this.blendAnimation = new gs.Component_BlendAnimation();
    this.blurAnimation = new gs.Component_BlurAnimation();
    this.pixelateAnimation = new gs.Component_PixelateAnimation();
    this.wobbleAnimation = new gs.Component_WobbleAnimation();
    this.colorAnimation = new gs.Component_ColorAnimation();
    this.imageAnimation = new gs.Component_ImageAnimation();
    this.frameAnimation = new gs.Component_FrameAnimation();
    this.fieldAnimation = new gs.Component_FieldAnimation();
    this.shakeAnimation = new gs.Component_ShakeAnimation();
    this.tintAnimation = new gs.Component_TintAnimation();
    this.rotateAnimation = new gs.Component_RotateAnimation();
    this.maskAnimation = new gs.Component_MaskAnimation();
    this.l2dAnimation = new gs.Component_Live2DAnimation();

    /**
    * Standard Callback Routine
    * @property callback
    * @type function
    * @private
     */
    this.callback = function(object, animation) {
      return object.removeComponent(animation);
    };
    this.onBlendFinish = function(object, animation, callback) {
      object.removeComponent(animation);
      return typeof callback === "function" ? callback(object) : void 0;
    };
  }

  Component_Animator.accessors("isAnimating", {
    get: function() {
      return this.object;
    }

    /**
    * Updates the animator.
    *
    * @method update
     */
  });

  Component_Animator.prototype.update = function() {
    var ref, ref1;
    Component_Animator.__super__.update.apply(this, arguments);
    if (((ref = this.object.mask) != null ? (ref1 = ref.source) != null ? ref1.videoElement : void 0 : void 0) != null) {
      return this.object.mask.source.update();
    }
  };


  /**
  * Moves the game object with a specified speed.
  *
  * @method move
  * @param {number} speedX The speed on x-axis in pixels per frame.
  * @param {number} speedY The speed on y-axis in pixels per frame.
  * @param {number} duration The duration in frames.
  * @param {Object} easingType The easing-type used for the animation.
   */

  Component_Animator.prototype.move = function(speedX, speedY, duration, easingType) {
    this.object.addComponent(this.moveAnimation);
    this.moveAnimation.move(speedX, speedY, duration, easingType, this.callback);
    return this.moveAnimation;
  };


  /**
  * Moves the game object to a specified position.
  *
  * @method moveTo
  * @param {number} x The x-coordinate of the position.
  * @param {number} y The y-coordinate of the position.
  * @param {number} duration The duration in frames.
  * @param {Object} easingType The easing-type.
   */

  Component_Animator.prototype.moveTo = function(x, y, duration, easingType) {
    this.object.addComponent(this.moveAnimation);
    this.moveAnimation.moveTo(x, y, duration, easingType, this.callback);
    return this.moveAnimation;
  };


  /**
  * Moves the game object along a path.
  *
  * @method movePath
  * @param {Object} path The path to follow.
  * @param {gs.AnimationLoopType} loopType The loop-Type.
  * @param {number} duration The duration in frames.
  * @param {Object} easingType The easing-type.
  * @param {Object[]} effects Optional array of effects executed during the path-movement like playing a sound.
   */

  Component_Animator.prototype.movePath = function(path, loopType, duration, easingType, effects) {
    var c;
    c = this.object.findComponent("Component_PathAnimation");
    if (c != null) {
      c.loopType = loopType;
    } else {
      this.object.addComponent(this.pathAnimation);
      this.pathAnimation.start(path, loopType, duration, easingType, effects, this.callback);
    }
    return this.pathAnimation;
  };


  /**
  * Scrolls the game object with a specified speed.
  *
  * @method scroll
  * @param {number} speedX The speed on x-axis in pixels per frame.
  * @param {number} speedY The speed on y-axis in pixels per frame.
  * @param {number} duration The duration in frames.
  * @param {Object} easingType The easing-type used for the animation.
   */

  Component_Animator.prototype.scroll = function(speedX, speedY, duration, easingType) {
    this.object.addComponent(this.moveAnimation);
    this.moveAnimation.scroll(speedX, speedY, duration, easingType, this.callback);
    return this.moveAnimation;
  };


  /**
  * Scrolls the game object to a specified position.
  *
  * @method scrollTo
  * @param {number} x The x-coordinate of the position.
  * @param {number} y The y-coordinate of the position.
  * @param {number} duration The duration in frames.
  * @param {Object} easingType The easing-type.
   */

  Component_Animator.prototype.scrollTo = function(x, y, duration, easingType) {
    this.object.addComponent(this.moveAnimation);
    this.moveAnimation.scrollTo(x, y, duration, easingType, this.callback);
    return this.moveAnimation;
  };


  /**
  * Scrolls the game object along a path.
  *
  * @method scrollPath
  * @param {Object} path The path to follow.
  * @param {gs.AnimationLoopType} loopType The loop-Type.
  * @param {number} duration The duration in frames.
  * @param {Object} easingType The easing-type.
   */

  Component_Animator.prototype.scrollPath = function(path, loopType, duration, easingType) {
    this.object.addComponent(this.pathAnimation);
    this.pathAnimation.scroll(path, loopType, duration, easingType, this.callback);
    return this.pathAnimation;
  };


  /**
  * Zooms a game object to specified size.
  *
  * @method zoomTo
  * @param {number} x The x-axis zoom-factor.
  * @param {number} y The y-axis zoom-factor.
  * @param {number} duration The duration in frames.
  * @param {Object} easingType The easing-type.
   */

  Component_Animator.prototype.zoomTo = function(x, y, duration, easingType) {
    this.object.addComponent(this.zoomAnimation);
    this.zoomAnimation.start(x, y, duration, easingType, this.callback);
    return this.zoomAnimation;
  };


  /**
  * Blends a game object to specified opacity.
  *
  * @method blendTo
  * @param {number} opacity The target opacity.
  * @param {number} duration The duration in frames.
  * @param {Object} easingType The easing-type.
  * @param {function} [callback] An optional callback called if blending is finished.
   */

  Component_Animator.prototype.blendTo = function(opacity, duration, easingType, callback) {
    this.object.addComponent(this.blendAnimation);
    this.blendAnimation.start(opacity, duration, easingType, gs.CallBack("onBlendFinish", this, callback));
    return this.blendAnimation;
  };


  /**
  * Animates a Live2D model parameter of a Live2D game object to a specified value.
  *
  * @method blendTo
  * @param {string} param The name of the parameter to animate.
  * @param {number} value The target value.
  * @param {number} duration The duration in frames.
  * @param {Object} easingType The easing-type.
  * @param {function} [callback] An optional callback called if blending is finished.
   */

  Component_Animator.prototype.l2dParameterTo = function(param, value, duration, easingType, callback) {
    this.object.addComponent(this.l2dAnimation);
    this.l2dAnimation.start(param, value, duration, easingType, gs.CallBack("onBlendFinish", this, callback));
    return this.l2dAnimation;
  };


  /**
  * Blurs a game object to specified blur-power.
  *
  * @method blurTo
  * @param {number} power The target blur-power.
  * @param {number} duration The duration in frames.
  * @param {Object} easingType The easing-type.
   */

  Component_Animator.prototype.blurTo = function(power, duration, easingType) {
    this.object.addComponent(this.blurAnimation);
    this.blurAnimation.start(power, duration, easingType);
    return this.blurAnimation;
  };


  /**
  * Pixelates a game object to specified pixel-size/block-size
  *
  * @method pixelateTo
  * @param {number} width - The target block-width
  * @param {number} height - The target block-height
  * @param {number} duration The duration in frames.
  * @param {Object} easingType The easing-type.
   */

  Component_Animator.prototype.pixelateTo = function(width, height, duration, easingType) {
    this.object.addComponent(this.pixelateAnimation);
    this.pixelateAnimation.start(width, height, duration, easingType);
    return this.pixelateAnimation;
  };


  /**
  * Wobbles a game object to specified wobble-power and wobble-speed.
  *
  * @method wobbleTo
  * @param {number} power The target wobble-power.
  * @param {number} speed The target wobble-speed.
  * @param {number} duration The duration in frames.
  * @param {Object} easingType The easing-type.
   */

  Component_Animator.prototype.wobbleTo = function(power, speed, duration, easingType) {
    this.object.addComponent(this.wobbleAnimation);
    this.wobbleAnimation.start(power, speed, duration, easingType);
    return this.wobbleAnimation;
  };


  /**
  * Colors a game object to a specified target color.
  *
  * @method colorTo
  * @param {Color} color The target color.
  * @param {number} duration The duration in frames.
  * @param {Object} easingType The easing-type.
   */

  Component_Animator.prototype.colorTo = function(color, duration, easingType) {
    this.object.addComponent(this.colorAnimation);
    this.colorAnimation.start(color, duration, easingType, this.callback);
    return this.colorAnimation;
  };


  /**
  * An image animation runs from left to right using the game object's
  * image-property.
  *
  * @method changeImages
  * @param {Array} images An array of image names.
  * @param {number} duration The duration in frames.
  * @param {Object} easingType The easing-type.
   */

  Component_Animator.prototype.changeImages = function(images, duration, easingType) {
    this.object.addComponent(this.imageAnimation);
    this.imageAnimation.start(images, duration, easingType, this.callback);
    return this.imageAnimation;
  };


  /**
  * A frame animation which modifies the game object's srcRect property
  * a play an animation.
  *
  * @method changeFrames
  * @param {gs.Rect[]} frames An array of source rectangles (frames).
  * @param {number} duration The duration in frames.
  * @param {Object} easingType The easing-type.
   */


  /**
  * A frame animation which modifies the game object's srcRect property
  * a play an animation.
  *
  * @method playAnimation
  * @param {gs.Rect[]} frames An array of source rectangles (frames).
  * @param {number} duration The duration in frames.
  * @param {Object} easingType The easing-type.
   */

  Component_Animator.prototype.playAnimation = function(animationRecord) {
    this.frameAnimation.refresh(animationRecord);
    this.object.addComponent(this.frameAnimation);
    this.frameAnimation.start(this.callback);
    return this.frameAnimation;
  };


  /**
  * Changes a field of the game object to a specified value.
  *
  * @method change
  * @param {number} Value The target value.
  * @param {string} field The name of the field/property.
  * @param {number} duration The duration in frames.
  * @param {Object} easingType The easing-type.
   */

  Component_Animator.prototype.change = function(value, field, duration, easingType) {
    this.object.addComponent(this.fieldAnimation);
    this.fieldAnimation.start(value, field, duration, easingType, this.callback);
    return this.fieldAnimation;
  };


  /**
  * Shakes the game object horizontally using the game object's offset-property.
  *
  * @method shake
  * @param {gs.Range} range The horizontal shake-range.
  * @param {number} speed The shake speed.
  * @param {number} duration The duration in frames.
  * @param {Object} easingType The easing-type.
   */

  Component_Animator.prototype.shake = function(range, speed, duration, easing) {
    this.object.addComponent(this.shakeAnimation);
    this.shakeAnimation.start(range, speed, duration, easing, this.callback);
    return this.shakeAnimation;
  };


  /**
  * Tints the game object to a specified tone.
  *
  * @method tintTo
  * @param {Tone} tone The target tone.
  * @param {number} duration The duration in frames.
  * @param {Object} easingType The easing-type.
   */

  Component_Animator.prototype.tintTo = function(tone, duration, easingType) {
    this.object.addComponent(this.tintAnimation);
    this.tintAnimation.start(tone, duration, easingType, this.callback);
    return this.tintAnimation;
  };


  /**
  * Rotates the game object around its anchor-point.
  *
  * @method rotate
  * @param {gs.RotationDirection} direction The rotation-direction.
  * @param {number} speed The rotation speed in degrees per frame.
  * @param {number} duration The duration in frames.
  * @param {Object} easingType The easing-type.
   */

  Component_Animator.prototype.rotate = function(direction, speed, duration, easingType) {
    this.object.addComponent(this.rotateAnimation);
    this.rotateAnimation.rotate(direction, speed, duration, easingType, this.callback);
    return this.rotateAnimation;
  };


  /**
  * Rotates the game object around its anchor-point to a specified angle.
  *
  * @method rotateTo
  * @param {number} angle The target angle.
  * @param {number} duration The duration in frames.
  * @param {Object} easingType The easing-type.
   */

  Component_Animator.prototype.rotateTo = function(angle, duration, easingType) {
    this.object.addComponent(this.rotateAnimation);
    this.rotateAnimation.rotateTo(angle, duration, easingType, this.callback);
    return this.rotateAnimation;
  };


  /**
  * Lets a game object appear on screen using a masking-effect.
  *
  * @method maskIn
  * @param {gs.Mask} mask The mask used for the animation.
  * @param {number} duration The duration in frames.
  * @param {Object} easingType The easing-type.
  * @param {function} [callback] An optional callback-function called when the animation is finished.
   */

  Component_Animator.prototype.maskIn = function(mask, duration, easing, callback) {
    this.object.addComponent(this.maskAnimation);
    this.maskAnimation.maskIn(mask, duration, easing, function(object, animation) {
      object.removeComponent(animation);
      return typeof callback === "function" ? callback(object) : void 0;
    });
    return this.maskAnimation;
  };


  /**
  * Description follows...
  *
  * @method maskTo
  * @param {gs.Mask} mask The mask used for the animation.
  * @param {number} duration The duration in frames.
  * @param {Object} easingType The easing-type.
  * @param {function} [callback] An optional callback-function called when the animation is finished.
   */

  Component_Animator.prototype.maskTo = function(mask, duration, easing, callback) {
    this.object.addComponent(this.maskAnimation);
    this.maskAnimation.maskTo(mask, duration, easing, function(object, animation) {
      object.removeComponent(animation);
      return typeof callback === "function" ? callback(object) : void 0;
    });
    return this.maskAnimation;
  };


  /**
  * Lets a game object disappear from screen using a masking-effect.
  *
  * @method maskOut
  * @param {gs.Mask} mask The mask used for the animation.
  * @param {number} duration The duration in frames.
  * @param {Object} easingType The easing-type.
  * @param {function} [callback] An optional callback-function called when the animation is finished.
   */

  Component_Animator.prototype.maskOut = function(mask, duration, easing, callback) {
    this.object.addComponent(this.maskAnimation);
    this.maskAnimation.maskOut(mask, duration, easing, function(object, animation) {
      object.removeComponent(animation);
      return typeof callback === "function" ? callback(object) : void 0;
    });
    return this.maskAnimation;
  };


  /**
  * Lets a game object appear on screen from left, top, right or bottom using 
  * a move-animation
  *
  * @method moveIn
  * @param {number} x The x-coordinate of the target-position.
  * @param {number} y The y-coordinate of the target-position.
  * @param {number} type The movement-direction from where the game object should move-in.
  * @param {number} duration The duration in frames.
  * @param {Object} easingType The easing-type.
  * @param {function} [callback] An optional callback-function called when the animation is finished.
   */

  Component_Animator.prototype.moveIn = function(x, y, type, duration, easing, callback) {
    this.object.addComponent(this.moveAnimation);
    this.moveAnimation.moveIn(x, y, type, duration, easing, function(object, animation) {
      object.removeComponent(animation);
      return typeof callback === "function" ? callback(object) : void 0;
    });
    return this.moveAnimation;
  };


  /**
  * Lets a game object disappear from screen to the left, top, right or bottom using 
  * a move-animation
  *
  * @method moveOut
  * @param {number} type The movement-direction in which the game object should move-out.
  * @param {number} duration The duration in frames.
  * @param {Object} easingType The easing-type.
  * @param {function} [callback] An optional callback-function called when the animation is finished.
   */

  Component_Animator.prototype.moveOut = function(type, duration, easing, callback) {
    this.object.addComponent(this.moveAnimation);
    this.moveAnimation.moveOut(type, duration, easing, function(object, animation) {
      object.removeComponent(animation);
      return typeof callback === "function" ? callback(object) : void 0;
    });
    return this.moveAnimation;
  };


  /**
  * Lets a game object appear on screen using blending.
  *
  * @method show
  * @param {number} duration The duration in frames.
  * @param {Object} easing The easing-type.
  * @param {function} [callback] An optional callback-function called when the animation is finished.
   */

  Component_Animator.prototype.show = function(duration, easing, callback) {
    var ref;
    this.object.opacity = 0;
    if ((ref = this.object.visual) != null) {
      ref.update();
    }
    return this.blendTo(255, duration, easing, callback);
  };


  /**
  * Lets a game object disappear from screen using blending.
  *
  * @method hide
  * @param {number} duration The duration in frames.
  * @param {Object} easing The easing-type.
  * @param {function} [callback] An optional callback-function called when the animation is finished.
   */

  Component_Animator.prototype.hide = function(duration, easing, callback) {
    return this.blendTo(0, duration, easing, callback);
  };


  /**
  * Changes visible-property to true. This method is deprecated.
  * 
  * @method open
  * @deprecated
   */

  Component_Animator.prototype.open = function() {
    return this.object.visible = true;
  };


  /**
  * Changes visible-property to false. This method is deprecated.
  * 
  * @method close
  * @deprecated
   */

  Component_Animator.prototype.close = function() {
    return this.object.visible = false;
  };


  /**
  * Flashes the game object.
  *
  * @method flash
  * @param {Color} color The flash-color.
  * @param {number} duration The duration in frames.
   */

  Component_Animator.prototype.flash = function(color, duration) {
    this.object.color = color;
    color = new Color(color);
    color.alpha = 0;
    return this.colorTo(color, duration, gs.Easings.EASE_LINEAR[gs.EasingTypes.EASE_IN]);
  };


  /**
  * Lets a game object appear on screen using a specified animation.
  *
  * @method appear
  * @param {number} x The x-coordinate of the target-position.
  * @param {number} y The y-coordinate of the target-position.
  * @param {gs.AppearAnimationInfo} animation The animation info-object.
  * @param {Object} easing The easing-type.
  * @param {number} duration The duration in frames.
  * @param {function} [callback] An optional callback-function called when the animation is finished.
   */

  Component_Animator.prototype.appear = function(x, y, animation, easing, duration, callback) {
    easing = easing || gs.Easings.EASE_LINEAR[gs.EasingTypes.EASE_IN];
    this.object.visible = true;
    if (animation.type === gs.AnimationTypes.MOVEMENT) {
      return this.moveIn(x, y, animation.movement, duration, easing, callback);
    } else if (animation.type === gs.AnimationTypes.MASKING) {
      return this.maskIn(animation.mask, duration, easing, callback);
    } else {
      return this.show(duration, easing, callback);
    }
  };


  /**
  * Lets a game object disappear from screen using a specified animation.
  *
  * @method disappear
  * @param {gs.AppearAnimationInfo} animation The animation info-object.
  * @param {Object} easing The easing-type.
  * @param {number} duration The duration in frames.
  * @param {function} [callback] An optional callback-function called when the animation is finished.
   */

  Component_Animator.prototype.disappear = function(animation, easing, duration, callback) {
    this.object.visible = true;
    if (animation.type === gs.AnimationTypes.MOVEMENT) {
      return this.moveOut(animation.movement, duration, easing, callback);
    } else if (animation.type === gs.AnimationTypes.MASKING) {
      return this.maskOut(animation.mask, duration, easing, callback);
    } else {
      return this.hide(duration, easing, callback);
    }
  };

  return Component_Animator;

})(gs.Component);

gs.Animator = Component_Animator;

gs.Component_Animator = Component_Animator;

//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQU9BLElBQUEsa0JBQUE7RUFBQTs7O0FBQU07Ozs7QUFDRjs7Ozs7Ozs7Ozs7O0VBV2EsNEJBQUE7SUFDVCxxREFBQSxTQUFBO0lBRUEsSUFBQyxDQUFBLGFBQUQsR0FBcUIsSUFBQSxFQUFFLENBQUMsdUJBQUgsQ0FBQTtJQUNyQixJQUFDLENBQUEsYUFBRCxHQUFxQixJQUFBLEVBQUUsQ0FBQyx1QkFBSCxDQUFBO0lBQ3JCLElBQUMsQ0FBQSxhQUFELEdBQXFCLElBQUEsRUFBRSxDQUFDLHVCQUFILENBQUE7SUFDckIsSUFBQyxDQUFBLGNBQUQsR0FBc0IsSUFBQSxFQUFFLENBQUMsd0JBQUgsQ0FBQTtJQUN0QixJQUFDLENBQUEsYUFBRCxHQUFxQixJQUFBLEVBQUUsQ0FBQyx1QkFBSCxDQUFBO0lBQ3JCLElBQUMsQ0FBQSxpQkFBRCxHQUF5QixJQUFBLEVBQUUsQ0FBQywyQkFBSCxDQUFBO0lBQ3pCLElBQUMsQ0FBQSxlQUFELEdBQXVCLElBQUEsRUFBRSxDQUFDLHlCQUFILENBQUE7SUFDdkIsSUFBQyxDQUFBLGNBQUQsR0FBc0IsSUFBQSxFQUFFLENBQUMsd0JBQUgsQ0FBQTtJQUN0QixJQUFDLENBQUEsY0FBRCxHQUFzQixJQUFBLEVBQUUsQ0FBQyx3QkFBSCxDQUFBO0lBQ3RCLElBQUMsQ0FBQSxjQUFELEdBQXNCLElBQUEsRUFBRSxDQUFDLHdCQUFILENBQUE7SUFDdEIsSUFBQyxDQUFBLGNBQUQsR0FBc0IsSUFBQSxFQUFFLENBQUMsd0JBQUgsQ0FBQTtJQUN0QixJQUFDLENBQUEsY0FBRCxHQUFzQixJQUFBLEVBQUUsQ0FBQyx3QkFBSCxDQUFBO0lBQ3RCLElBQUMsQ0FBQSxhQUFELEdBQXFCLElBQUEsRUFBRSxDQUFDLHVCQUFILENBQUE7SUFDckIsSUFBQyxDQUFBLGVBQUQsR0FBdUIsSUFBQSxFQUFFLENBQUMseUJBQUgsQ0FBQTtJQUN2QixJ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OztHQWxpQmtCLEVBQUUsQ0FBQzs7QUE0aUJwQyxFQUFFLENBQUMsUUFBSCxHQUFjOztBQUNkLEVBQUUsQ0FBQyxrQkFBSCxHQUF3QiIsInNvdXJjZXNDb250ZW50IjpbIiMgPT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PVxuI1xuIyAgIFNjcmlwdDogQ29tcG9uZW50X0FuaW1hdG9yXG4jXG4jICAgJCRDT1BZUklHSFQkJFxuI1xuIyA9PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09XG5jbGFzcyBDb21wb25lbnRfQW5pbWF0b3IgZXh0ZW5kcyBncy5Db21wb25lbnRcbiAgICAjIyMqXG4gICAgKiBBbiBhbmltYXRvci1jb21wb25lbnQgYWxsb3dzIHRvIGV4ZWN1dGUgZGlmZmVyZW50IGtpbmQgb2YgYW5pbWF0aW9ucyBcbiAgICAqIG9uIGEgZ2FtZSBvYmplY3QuIFRoZSBhbmltYXRpb25zIGFyZSB1c2luZyB0aGUgZ2FtZSBvYmplY3QncyBcbiAgICAqIGRzdFJlY3QgJiBvZmZzZXQtcHJvcGVydHkgdG8gZXhlY3V0ZS5cbiAgICAqXG4gICAgKiBAbW9kdWxlIGdzXG4gICAgKiBAY2xhc3MgQ29tcG9uZW50X0FuaW1hdG9yXG4gICAgKiBAZXh0ZW5kcyBncy5Db21wb25lbnRcbiAgICAqIEBtZW1iZXJvZiBnc1xuICAgICogQGNvbnN0cnVjdG9yXG4gICAgIyMjXG4gICAgY29uc3RydWN0b3I6IC0+XG4gICAgICAgIHN1cGVyXG4gICAgICAgIFxuICAgICAgICBAbW92ZUFuaW1hdGlvbiA9IG5ldyBncy5Db21wb25lbnRfTW92ZUFuaW1hdGlvbigpXG4gICAgICAgIEBwYXRoQW5pbWF0aW9uID0gbmV3IGdzLkNvbXBvbmVudF9QYXRoQW5pbWF0aW9uKClcbiAgICAgICAgQHpvb21BbmltYXRpb24gPSBuZXcgZ3MuQ29tcG9uZW50X1pvb21BbmltYXRpb24oKVxuICAgICAgICBAYmxlbmRBbmltYXRpb24gPSBuZXcgZ3MuQ29tcG9uZW50X0JsZW5kQW5pbWF0aW9uKClcbiAgICAgICAgQGJsdXJBbmltYXRpb24gPSBuZXcgZ3MuQ29tcG9uZW50X0JsdXJBbmltYXRpb24oKVxuICAgICAgICBAcGl4ZWxhdGVBbmltYXRpb24gPSBuZXcgZ3MuQ29tcG9uZW50X1BpeGVsYXRlQW5pbWF0aW9uKClcbiAgICAgICAgQHdvYmJsZUFuaW1hdGlvbiA9IG5ldyBncy5Db21wb25lbnRfV29iYmxlQW5pbWF0aW9uKClcbiAgICAgICAgQGNvbG9yQW5pbWF0aW9uID0gbmV3IGdzLkNvbXBvbmVudF9Db2xvckFuaW1hdGlvbigpXG4gICAgICAgIEBpbWFnZUFuaW1hdGlvbiA9IG5ldyBncy5Db21wb25lbnRfSW1hZ2VBbmltYXRpb24oKVxuICAgICAgICBAZnJhbWVBbmltYXRpb24gPSBuZXcgZ3MuQ29tcG9uZW50X0ZyYW1lQW5pbWF0aW9uKClcbiAgICAgICAgQGZpZWxkQW5pbWF0aW9uID0gbmV3IGdzLkNvbXBvbmVudF9GaWVsZEFuaW1hdGlvbigpXG4gICAgICAgIEBzaGFrZUFuaW1hdGlvbiA9IG5ldyBncy5Db21wb25lbnRfU2hha2VBbmltYXRpb24oKVxuICAgICAgICBAdGludEFuaW1hdGlvbiA9IG5ldyBncy5Db21wb25lbnRfVGludEFuaW1hdGlvbigpXG4gICAgICAgIEByb3RhdGVBbmltYXRpb24gPSBuZXcgZ3MuQ29tcG9uZW50X1JvdGF0ZUFuaW1hdGlvbigpXG4gICAgICAgIEBtYXNrQW5pbWF0aW9uID0gbmV3IGdzLkNvbXBvbmVudF9NYXNrQW5pbWF0aW9uKClcbiAgICAgICAgQGwyZEFuaW1hdGlvbiA9IG5ldyBncy5Db21wb25lbnRfTGl2ZTJEQW5pbWF0aW9uKClcbiAgICAgICAgXG4gICAgICAgICMjIypcbiAgICAgICAgKiBTdGFuZGFyZCBDYWxsYmFjayBSb3V0aW5lXG4gICAgICAgICogQHByb3BlcnR5IGNhbGxiYWNrXG4gICAgICAgICogQHR5cGUgZnVuY3Rpb25cbiAgICAgICAgKiBAcHJpdmF0ZVxuICAgICAgICAjIyNcbiAgICAgICAgQGNhbGxiYWNrID0gKG9iamVjdCwgYW5pbWF0aW9uKSAtPiBvYmplY3QucmVtb3ZlQ29tcG9uZW50KGFuaW1hdGlvbilcbiAgICAgICAgXG4gICAgICAgIEBvbkJsZW5kRmluaXNoID0gKG9iamVjdCwgYW5pbWF0aW9uLCBjYWxsYmFjaykgLT4gXG4gICAgICAgICAgICBvYmplY3QucmVtb3ZlQ29tcG9uZW50KGFuaW1hdGlvbilcbiAgICAgICAgICAgIGNhbGxiYWNrPyhvYmplY3QpXG4gICAgICAgIFxuICAgICAgICBcbiAgICBAYWNjZXNzb3JzIFwiaXNBbmltYXRpbmdcIiwgZ2V0OiAtPiBAb2JqZWN0XG4gICAgIyMjKlxuICAgICogVXBkYXRlcyB0aGUgYW5pbWF0b3IuXG4gICAgKlxuICAgICogQG1ldGhvZCB1cGRhdGVcbiAgICAjIyNcbiAgICB1cGRhdGU6IC0+XG4gICAgICAgIHN1cGVyXG4gICAgICAgIFxuICAgICAgICBpZiBAb2JqZWN0Lm1hc2s/LnNvdXJjZT8udmlkZW9FbGVtZW50P1xuICAgICAgICAgICAgQG9iamVjdC5tYXNrLnNvdXJjZS51cGRhdGUoKVxuICAgICAgICBcbiAgICAjIyMqXG4gICAgKiBNb3ZlcyB0aGUgZ2FtZSBvYmplY3Qgd2l0aCBhIHNwZWNpZmllZCBzcGVlZC5cbiAgICAqXG4gICAgKiBAbWV0aG9kIG1vdmVcbiAgICAqIEBwYXJhbSB7bnVtYmVyfSBzcGVlZFggVGhlIHNwZWVkIG9uIHgtYXhpcyBpbiBwaXhlbHMgcGVyIGZyYW1lLlxuICAgICogQHBhcmFtIHtudW1iZXJ9IHNwZWVkWSBUaGUgc3BlZWQgb24geS1heGlzIGluIHBpeGVscyBwZXIgZnJhbWUuXG4gICAgKiBAcGFyYW0ge251bWJlcn0gZHVyYXRpb24gVGhlIGR1cmF0aW9uIGluIGZyYW1lcy5cbiAgICAqIEBwYXJhbSB7T2JqZWN0fSBlYXNpbmdUeXBlIFRoZSBlYXNpbmctdHlwZSB1c2VkIGZvciB0aGUgYW5pbWF0aW9uLlxuICAgICMjI1xuICAgIG1vdmU6IChzcGVlZFgsIHNwZWVkWSwgZHVyYXRpb24sIGVhc2luZ1R5cGUpIC0+XG4gICAgICAgIEBvYmplY3QuYWRkQ29tcG9uZW50KEBtb3ZlQW5pbWF0aW9uKVxuICAgICAgICBAbW92ZUFuaW1hdGlvbi5tb3ZlKHNwZWVkWCwgc3BlZWRZLCBkdXJhdGlvbiwgZWFzaW5nVHlwZSwgQGNhbGxiYWNrKVxuICAgICAgICBcbiAgICAgICAgcmV0dXJuIEBtb3ZlQW5pbWF0aW9uXG4gICAgICAgIFxuICAgICMjIypcbiAgICAqIE1vdmVzIHRoZSBnYW1lIG9iamVjdCB0byBhIHNwZWNpZmllZCBwb3NpdGlvbi5cbiAgICAqXG4gICAgKiBAbWV0aG9kIG1vdmVUb1xuICAgICogQHBhcmFtIHtudW1iZXJ9IHggVGhlIHgtY29vcmRpbmF0ZSBvZiB0aGUgcG9zaXRpb24uXG4gICAgKiBAcGFyYW0ge251bWJlcn0geSBUaGUgeS1jb29yZGluYXRlIG9mIHRoZSBwb3NpdGlvbi5cbiAgICAqIEBwYXJhbSB7bnVtYmVyfSBkdXJhdGlvbiBUaGUgZHVyYXRpb24gaW4gZnJhbWVzLlxuICAgICogQHBhcmFtIHtPYmplY3R9IGVhc2luZ1R5cGUgVGhlIGVhc2luZy10eXBlLlxuICAgICMjIyAgXG4gICAgbW92ZVRvOiAoeCwgeSwgZHVyYXRpb24sIGVhc2luZ1R5cGUpIC0+XG4gICAgICAgIEBvYmplY3QuYWRkQ29tcG9uZW50KEBtb3ZlQW5pbWF0aW9uKVxuICAgICAgICBAbW92ZUFuaW1hdGlvbi5tb3ZlVG8oeCwgeSwgZHVyYXRpb24sIGVhc2luZ1R5cGUsIEBjYWxsYmFjaylcbiAgICAgICAgXG4gICAgICAgIHJldHVybiBAbW92ZUFuaW1hdGlvblxuICAgIFxuICAgICMjIypcbiAgICAqIE1vdmVzIHRoZSBnYW1lIG9iamVjdCBhbG9uZyBhIHBhdGguXG4gICAgKlxuICAgICogQG1ldGhvZCBtb3ZlUGF0aFxuICAgICogQHBhcmFtIHtPYmplY3R9IHBhdGggVGhlIHBhdGggdG8gZm9sbG93LlxuICAgICogQHBhcmFtIHtncy5BbmltYXRpb25Mb29wVHlwZX0gbG9vcFR5cGUgVGhlIGxvb3AtVHlwZS5cbiAgICAqIEBwYXJhbSB7bnVtYmVyfSBkdXJhdGlvbiBUaGUgZHVyYXRpb24gaW4gZnJhbWVzLlxuICAgICogQHBhcmFtIHtPYmplY3R9IGVhc2luZ1R5cGUgVGhlIGVhc2luZy10eXBlLlxuICAgICogQHBhcmFtIHtPYmplY3RbXX0gZWZmZWN0cyBPcHRpb25hbCBhcnJheSBvZiBlZmZlY3RzIGV4ZWN1dGVkIGR1cmluZyB0aGUgcGF0aC1tb3ZlbWVudCBsaWtlIHBsYXlpbmcgYSBzb3VuZC5cbiAgICAjIyMgIFxuICAgIG1vdmVQYXRoOiAocGF0aCwgbG9vcFR5cGUsIGR1cmF0aW9uLCBlYXNpbmdUeXBlLCBlZmZlY3RzKSAtPlxuICAgICAgICBjID0gQG9iamVjdC5maW5kQ29tcG9uZW50KFwiQ29tcG9uZW50X1BhdGhBbmltYXRpb25cIilcbiAgICAgICAgXG4gICAgICAgIGlmIGM/XG4gICAgICAgICAgICBjLmxvb3BUeXBlID0gbG9vcFR5cGVcbiAgICAgICAgZWxzZVxuICAgICAgICAgICAgQG9iamVjdC5hZGRDb21wb25lbnQoQHBhdGhBbmltYXRpb24pXG4gICAgICAgICAgICBAcGF0aEFuaW1hdGlvbi5zdGFydChwYXRoLCBsb29wVHlwZSwgZHVyYXRpb24sIGVhc2luZ1R5cGUsIGVmZmVjdHMsIEBjYWxsYmFjaylcbiAgICAgICAgICAgIFxuICAgICAgICByZXR1cm4gQHBhdGhBbmltYXRpb25cbiAgICBcbiAgICAjIyMqXG4gICAgKiBTY3JvbGxzIHRoZSBnYW1lIG9iamVjdCB3aXRoIGEgc3BlY2lmaWVkIHNwZWVkLlxuICAgICpcbiAgICAqIEBtZXRob2Qgc2Nyb2xsXG4gICAgKiBAcGFyYW0ge251bWJlcn0gc3BlZWRYIFRoZSBzcGVlZCBvbiB4LWF4aXMgaW4gcGl4ZWxzIHBlciBmcmFtZS5cbiAgICAqIEBwYXJhbSB7bnVtYmVyfSBzcGVlZFkgVGhlIHNwZWVkIG9uIHktYXhpcyBpbiBwaXhlbHMgcGVyIGZyYW1lLlxuICAgICogQHBhcmFtIHtudW1iZXJ9IGR1cmF0aW9uIFRoZSBkdXJhdGlvbiBpbiBmcmFtZXMuXG4gICAgKiBAcGFyYW0ge09iamVjdH0gZWFzaW5nVHlwZSBUaGUgZWFzaW5nLXR5cGUgdXNlZCBmb3IgdGhlIGFuaW1hdGlvbi5cbiAgICAjIyNcbiAgICBzY3JvbGw6IChzcGVlZFgsIHNwZWVkWSwgZHVyYXRpb24sIGVhc2luZ1R5cGUpIC0+XG4gICAgICAgIEBvYmplY3QuYWRkQ29tcG9uZW50KEBtb3ZlQW5pbWF0aW9uKVxuICAgICAgICBAbW92ZUFuaW1hdGlvbi5zY3JvbGwoc3BlZWRYLCBzcGVlZFksIGR1cmF0aW9uLCBlYXNpbmdUeXBlLCBAY2FsbGJhY2spXG4gICAgICAgIFxuICAgICAgICByZXR1cm4gQG1vdmVBbmltYXRpb25cbiAgICAgICAgXG4gICAgIyMjKlxuICAgICogU2Nyb2xscyB0aGUgZ2FtZSBvYmplY3QgdG8gYSBzcGVjaWZpZWQgcG9zaXRpb24uXG4gICAgKlxuICAgICogQG1ldGhvZCBzY3JvbGxUb1xuICAgICogQHBhcmFtIHtudW1iZXJ9IHggVGhlIHgtY29vcmRpbmF0ZSBvZiB0aGUgcG9zaXRpb24uXG4gICAgKiBAcGFyYW0ge251bWJlcn0geSBUaGUgeS1jb29yZGluYXRlIG9mIHRoZSBwb3NpdGlvbi5cbiAgICAqIEBwYXJhbSB7bnVtYmVyfSBkdXJhdGlvbiBUaGUgZHVyYXRpb24gaW4gZnJhbWVzLlxuICAgICogQHBhcmFtIHtPYmplY3R9IGVhc2luZ1R5cGUgVGhlIGVhc2luZy10eXBlLlxuICAgICMjIyAgXG4gICAgc2Nyb2xsVG86ICh4LCB5LCBkdXJhdGlvbiwgZWFzaW5nVHlwZSkgLT5cbiAgICAgICAgQG9iamVjdC5hZGRDb21wb25lbnQoQG1vdmVBbmltYXRpb24pXG4gICAgICAgIEBtb3ZlQW5pbWF0aW9uLnNjcm9sbFRvKHgsIHksIGR1cmF0aW9uLCBlYXNpbmdUeXBlLCBAY2FsbGJhY2spXG4gICAgICAgIFxuICAgICAgICByZXR1cm4gQG1vdmVBbmltYXRpb25cbiAgICAgICAgXG4gICAgIyMjKlxuICAgICogU2Nyb2xscyB0aGUgZ2FtZSBvYmplY3QgYWxvbmcgYSBwYXRoLlxuICAgICpcbiAgICAqIEBtZXRob2Qgc2Nyb2xsUGF0aFxuICAgICogQHBhcmFtIHtPYmplY3R9IHBhdGggVGhlIHBhdGggdG8gZm9sbG93LlxuICAgICogQHBhcmFtIHtncy5BbmltYXRpb25Mb29wVHlwZX0gbG9vcFR5cGUgVGhlIGxvb3AtVHlwZS5cbiAgICAqIEBwYXJhbSB7bnVtYmVyfSBkdXJhdGlvbiBUaGUgZHVyYXRpb24gaW4gZnJhbWVzLlxuICAgICogQHBhcmFtIHtPYmplY3R9IGVhc2luZ1R5cGUgVGhlIGVhc2luZy10eXBlLlxuICAgICMjIyAgXG4gICAgc2Nyb2xsUGF0aDogKHBhdGgsIGxvb3BUeXBlLCBkdXJhdGlvbiwgZWFzaW5nVHlwZSkgLT5cbiAgICAgICAgQG9iamVjdC5hZGRDb21wb25lbnQoQHBhdGhBbmltYXRpb24pXG4gICAgICAgIEBwYXRoQW5pbWF0aW9uLnNjcm9sbChwYXRoLCBsb29wVHlwZSwgZHVyYXRpb24sIGVhc2luZ1R5cGUsIEBjYWxsYmFjaylcbiAgICAgICAgXG4gICAgICAgIHJldHVybiBAcGF0aEFuaW1hdGlvblxuICAgIFxuICAgICAgICBcbiAgICAjIyMqXG4gICAgKiBab29tcyBhIGdhbWUgb2JqZWN0IHRvIHNwZWNpZmllZCBzaXplLlxuICAgICpcbiAgICAqIEBtZXRob2Qgem9vbVRvXG4gICAgKiBAcGFyYW0ge251bWJlcn0geCBUaGUgeC1heGlzIHpvb20tZmFjdG9yLlxuICAgICogQHBhcmFtIHtudW1iZXJ9IHkgVGhlIHktYXhpcyB6b29tLWZhY3Rvci5cbiAgICAqIEBwYXJhbSB7bnVtYmVyfSBkdXJhdGlvbiBUaGUgZHVyYXRpb24gaW4gZnJhbWVzLlxuICAgICogQHBhcmFtIHtPYmplY3R9IGVhc2luZ1R5cGUgVGhlIGVhc2luZy10eXBlLlxuICAgICMjIyAgICAgIFxuICAgIHpvb21UbzogKHgsIHksIGR1cmF0aW9uLCBlYXNpbmdUeXBlKSAtPlxuICAgICAgICBAb2JqZWN0LmFkZENvbXBvbmVudChAem9vbUFuaW1hdGlvbilcbiAgICAgICAgQHpvb21BbmltYXRpb24uc3RhcnQoeCwgeSwgZHVyYXRpb24sIGVhc2luZ1R5cGUsIEBjYWxsYmFjaylcbiAgICAgICAgXG4gICAgICAgIHJldHVybiBAem9vbUFuaW1hdGlvblxuICAgICAgICBcbiAgICBcbiAgICAjIyMqXG4gICAgKiBCbGVuZHMgYSBnYW1lIG9iamVjdCB0byBzcGVjaWZpZWQgb3BhY2l0eS5cbiAgICAqXG4gICAgKiBAbWV0aG9kIGJsZW5kVG9cbiAgICAqIEBwYXJhbSB7bnVtYmVyfSBvcGFjaXR5IFRoZSB0YXJnZXQgb3BhY2l0eS5cbiAgICAqIEBwYXJhbSB7bnVtYmVyfSBkdXJhdGlvbiBUaGUgZHVyYXRpb24gaW4gZnJhbWVzLlxuICAgICogQHBhcmFtIHtPYmplY3R9IGVhc2luZ1R5cGUgVGhlIGVhc2luZy10eXBlLlxuICAgICogQHBhcmFtIHtmdW5jdGlvbn0gW2NhbGxiYWNrXSBBbiBvcHRpb25hbCBjYWxsYmFjayBjYWxsZWQgaWYgYmxlbmRpbmcgaXMgZmluaXNoZWQuIFxuICAgICMjIyAgICBcbiAgICBibGVuZFRvOiAob3BhY2l0eSwgZHVyYXRpb24sIGVhc2luZ1R5cGUsIGNhbGxiYWNrKSAtPlxuICAgICAgICBAb2JqZWN0LmFkZENvbXBvbmVudChAYmxlbmRBbmltYXRpb24pXG4gICAgICAgIEBibGVuZEFuaW1hdGlvbi5zdGFydChvcGFjaXR5LCBkdXJhdGlvbiwgZWFzaW5nVHlwZSwgZ3MuQ2FsbEJhY2soXCJvbkJsZW5kRmluaXNoXCIsIHRoaXMsIGNhbGxiYWNrKSkgXG4gICAgICAgIFxuICAgICAgICByZXR1cm4gQGJsZW5kQW5pbWF0aW9uXG4gICAgIFxuICAgICMjIypcbiAgICAqIEFuaW1hdGVzIGEgTGl2ZTJEIG1vZGVsIHBhcmFtZXRlciBvZiBhIExpdmUyRCBnYW1lIG9iamVjdCB0byBhIHNwZWNpZmllZCB2YWx1ZS5cbiAgICAqXG4gICAgKiBAbWV0aG9kIGJsZW5kVG9cbiAgICAqIEBwYXJhbSB7c3RyaW5nfSBwYXJhbSBUaGUgbmFtZSBvZiB0aGUgcGFyYW1ldGVyIHRvIGFuaW1hdGUuXG4gICAgKiBAcGFyYW0ge251bWJlcn0gdmFsdWUgVGhlIHRhcmdldCB2YWx1ZS5cbiAgICAqIEBwYXJhbSB7bnVtYmVyfSBkdXJhdGlvbiBUaGUgZHVyYXRpb24gaW4gZnJhbWVzLlxuICAgICogQHBhcmFtIHtPYmplY3R9IGVhc2luZ1R5cGUgVGhlIGVhc2luZy10eXBlLlxuICAgICogQHBhcmFtIHtmdW5jdGlvbn0gW2NhbGxiYWNrXSBBbiBvcHRpb25hbCBjYWxsYmFjayBjYWxsZWQgaWYgYmxlbmRpbmcgaXMgZmluaXNoZWQuIFxuICAgICMjI1xuICAgIGwyZFBhcmFtZXRlclRvOiAocGFyYW0sIHZhbHVlLCBkdXJhdGlvbiwgZWFzaW5nVHlwZSwgY2FsbGJhY2spIC0+XG4gICAgICAgIEBvYmplY3QuYWRkQ29tcG9uZW50KEBsMmRBbmltYXRpb24pXG4gICAgICAgIEBsMmRBbmltYXRpb24uc3RhcnQocGFyYW0sIHZhbHVlLCBkdXJhdGlvbiwgZWFzaW5nVHlwZSwgZ3MuQ2FsbEJhY2soXCJvbkJsZW5kRmluaXNoXCIsIHRoaXMsIGNhbGxiYWNrKSkgXG4gICAgICAgIFxuICAgICAgICByZXR1cm4gQGwyZEFuaW1hdGlvblxuICAgICAgICBcbiAgICAjIyMqXG4gICAgKiBCbHVycyBhIGdhbWUgb2JqZWN0IHRvIHNwZWNpZmllZCBibHVyLXBvd2VyLlxuICAgICpcbiAgICAqIEBtZXRob2QgYmx1clRvXG4gICAgKiBAcGFyYW0ge251bWJlcn0gcG93ZXIgVGhlIHRhcmdldCBibHVyLXBvd2VyLlxuICAgICogQHBhcmFtIHtudW1iZXJ9IGR1cmF0aW9uIFRoZSBkdXJhdGlvbiBpbiBmcmFtZXMuXG4gICAgKiBAcGFyYW0ge09iamVjdH0gZWFzaW5nVHlwZSBUaGUgZWFzaW5nLXR5cGUuXG4gICAgIyMjICAgICBcbiAgICBibHVyVG86IChwb3dlciwgZHVyYXRpb24sIGVhc2luZ1R5cGUpIC0+XG4gICAgICAgIEBvYmplY3QuYWRkQ29tcG9uZW50KEBibHVyQW5pbWF0aW9uKVxuICAgICAgICBAYmx1ckFuaW1hdGlvbi5zdGFydChwb3dlciwgZHVyYXRpb24sIGVhc2luZ1R5cGUpIFxuICAgICAgICBcbiAgICAgICAgcmV0dXJuIEBibHVyQW5pbWF0aW9uXG4gICAgICAgIFxuICAgICMjIypcbiAgICAqIFBpeGVsYXRlcyBhIGdhbWUgb2JqZWN0IHRvIHNwZWNpZmllZCBwaXhlbC1zaXplL2Jsb2NrLXNpemVcbiAgICAqXG4gICAgKiBAbWV0aG9kIHBpeGVsYXRlVG9cbiAgICAqIEBwYXJhbSB7bnVtYmVyfSB3aWR0aCAtIFRoZSB0YXJnZXQgYmxvY2std2lkdGhcbiAgICAqIEBwYXJhbSB7bnVtYmVyfSBoZWlnaHQgLSBUaGUgdGFyZ2V0IGJsb2NrLWhlaWdodFxuICAgICogQHBhcmFtIHtudW1iZXJ9IGR1cmF0aW9uIFRoZSBkdXJhdGlvbiBpbiBmcmFtZXMuXG4gICAgKiBAcGFyYW0ge09iamVjdH0gZWFzaW5nVHlwZSBUaGUgZWFzaW5nLXR5cGUuXG4gICAgIyMjICAgICBcbiAgICBwaXhlbGF0ZVRvOiAod2lkdGgsIGhlaWdodCwgZHVyYXRpb24sIGVhc2luZ1R5cGUpIC0+XG4gICAgICAgIEBvYmplY3QuYWRkQ29tcG9uZW50KEBwaXhlbGF0ZUFuaW1hdGlvbilcbiAgICAgICAgQHBpeGVsYXRlQW5pbWF0aW9uLnN0YXJ0KHdpZHRoLCBoZWlnaHQsIGR1cmF0aW9uLCBlYXNpbmdUeXBlKSBcbiAgICAgICAgXG4gICAgICAgIHJldHVybiBAcGl4ZWxhdGVBbmltYXRpb25cbiAgICAgICAgXG4gICAgIyMjKlxuICAgICogV29iYmxlcyBhIGdhbWUgb2JqZWN0IHRvIHNwZWNpZmllZCB3b2JibGUtcG93ZXIgYW5kIHdvYmJsZS1zcGVlZC5cbiAgICAqXG4gICAgKiBAbWV0aG9kIHdvYmJsZVRvXG4gICAgKiBAcGFyYW0ge251bWJlcn0gcG93ZXIgVGhlIHRhcmdldCB3b2JibGUtcG93ZXIuXG4gICAgKiBAcGFyYW0ge251bWJlcn0gc3BlZWQgVGhlIHRhcmdldCB3b2JibGUtc3BlZWQuXG4gICAgKiBAcGFyYW0ge251bWJlcn0gZHVyYXRpb24gVGhlIGR1cmF0aW9uIGluIGZyYW1lcy5cbiAgICAqIEBwYXJhbSB7T2JqZWN0fSBlYXNpbmdUeXBlIFRoZSBlYXNpbmctdHlwZS5cbiAgICAjIyMgICAgIFxuICAgIHdvYmJsZVRvOiAocG93ZXIsIHNwZWVkLCBkdXJhdGlvbiwgZWFzaW5nVHlwZSkgLT5cbiAgICAgICAgQG9iamVjdC5hZGRDb21wb25lbnQoQHdvYmJsZUFuaW1hdGlvbilcbiAgICAgICAgQHdvYmJsZUFuaW1hdGlvbi5zdGFydChwb3dlciwgc3BlZWQsIGR1cmF0aW9uLCBlYXNpbmdUeXBlKSBcbiAgICAgICAgXG4gICAgICAgIHJldHVybiBAd29iYmxlQW5pbWF0aW9uXG4gICAgICAgIFxuICAgICMjIypcbiAgICAqIENvbG9ycyBhIGdhbWUgb2JqZWN0IHRvIGEgc3BlY2lmaWVkIHRhcmdldCBjb2xvci5cbiAgICAqXG4gICAgKiBAbWV0aG9kIGNvbG9yVG9cbiAgICAqIEBwYXJhbSB7Q29sb3J9IGNvbG9yIFRoZSB0YXJnZXQgY29sb3IuXG4gICAgKiBAcGFyYW0ge251bWJlcn0gZHVyYXRpb24gVGhlIGR1cmF0aW9uIGluIGZyYW1lcy5cbiAgICAqIEBwYXJhbSB7T2JqZWN0fSBlYXNpbmdUeXBlIFRoZSBlYXNpbmctdHlwZS5cbiAgICAjIyMgIFxuICAgIGNvbG9yVG86IChjb2xvciwgZHVyYXRpb24sIGVhc2luZ1R5cGUpIC0+XG4gICAgICAgIEBvYmplY3QuYWRkQ29tcG9uZW50KEBjb2xvckFuaW1hdGlvbilcbiAgICAgICAgQGNvbG9yQW5pbWF0aW9uLnN0YXJ0KGNvbG9yLCBkdXJhdGlvbiwgZWFzaW5nVHlwZSwgQGNhbGxiYWNrKVxuICAgICAgICBcbiAgICAgICAgcmV0dXJuIEBjb2xvckFuaW1hdGlvblxuICAgICAgICBcbiAgICAjIyMqXG4gICAgKiBBbiBpbWFnZSBhbmltYXRpb24gcnVucyBmcm9tIGxlZnQgdG8gcmlnaHQgdXNpbmcgdGhlIGdhbWUgb2JqZWN0J3NcbiAgICAqIGltYWdlLXByb3BlcnR5LlxuICAgICpcbiAgICAqIEBtZXRob2QgY2hhbmdlSW1hZ2VzXG4gICAgKiBAcGFyYW0ge0FycmF5fSBpbWFnZXMgQW4gYXJyYXkgb2YgaW1hZ2UgbmFtZXMuXG4gICAgKiBAcGFyYW0ge251bWJlcn0gZHVyYXRpb24gVGhlIGR1cmF0aW9uIGluIGZyYW1lcy5cbiAgICAqIEBwYXJhbSB7T2JqZWN0fSBlYXNpbmdUeXBlIFRoZSBlYXNpbmctdHlwZS5cbiAgICAjIyMgICAgICBcbiAgICBjaGFuZ2VJbWFnZXM6IChpbWFnZXMsIGR1cmF0aW9uLCBlYXNpbmdUeXBlKSAtPlxuICAgICAgICBAb2JqZWN0LmFkZENvbXBvbmVudChAaW1hZ2VBbmltYXRpb24pXG4gICAgICAgIEBpbWFnZUFuaW1hdGlvbi5zdGFydChpbWFnZXMsIGR1cmF0aW9uLCBlYXNpbmdUeXBlLCBAY2FsbGJhY2spXG4gICAgICAgIFxuICAgICAgICByZXR1cm4gQGltYWdlQW5pbWF0aW9uXG4gICAgICAgIFxuICAgICMjIypcbiAgICAqIEEgZnJhbWUgYW5pbWF0aW9uIHdoaWNoIG1vZGlmaWVzIHRoZSBnYW1lIG9iamVjdCdzIHNyY1JlY3QgcHJvcGVydHlcbiAgICAqIGEgcGxheSBhbiBhbmltYXRpb24uXG4gICAgKlxuICAgICogQG1ldGhvZCBjaGFuZ2VGcmFtZXNcbiAgICAqIEBwYXJhbSB7Z3MuUmVjdFtdfSBmcmFtZXMgQW4gYXJyYXkgb2Ygc291cmNlIHJlY3RhbmdsZXMgKGZyYW1lcykuXG4gICAgKiBAcGFyYW0ge251bWJlcn0gZHVyYXRpb24gVGhlIGR1cmF0aW9uIGluIGZyYW1lcy5cbiAgICAqIEBwYXJhbSB7T2JqZWN0fSBlYXNpbmdUeXBlIFRoZSBlYXNpbmctdHlwZS5cbiAgICAjIyMgICAgICBcbiAgICAjY2hhbmdlRnJhbWVzOiAoZnJhbWVzLCBkdXJhdGlvbiwgZWFzaW5nVHlwZSkgLT5cbiAgICAjICAgIGFuaW1hdGlvbiA9IG5ldyBncy5Db21wb25lbnRfRnJhbWVBbmltYXRpb24oKVxuICAgICMgICAgQG9iamVjdC5hZGRDb21wb25lbnQoYW5pbWF0aW9uKVxuICAgICMgICAgYW5pbWF0aW9uLnN0YXJ0KGZyYW1lcywgZHVyYXRpb24sIGVhc2luZ1R5cGUsIEBjYWxsYmFjaylcbiAgICAgICBcbiAgICAjIyMqXG4gICAgKiBBIGZyYW1lIGFuaW1hdGlvbiB3aGljaCBtb2RpZmllcyB0aGUgZ2FtZSBvYmplY3QncyBzcmNSZWN0IHByb3BlcnR5XG4gICAgKiBhIHBsYXkgYW4gYW5pbWF0aW9uLlxuICAgICpcbiAgICAqIEBtZXRob2QgcGxheUFuaW1hdGlvblxuICAgICogQHBhcmFtIHtncy5SZWN0W119IGZyYW1lcyBBbiBhcnJheSBvZiBzb3VyY2UgcmVjdGFuZ2xlcyAoZnJhbWVzKS5cbiAgICAqIEBwYXJhbSB7bnVtYmVyfSBkdXJhdGlvbiBUaGUgZHVyYXRpb24gaW4gZnJhbWVzLlxuICAgICogQHBhcmFtIHtPYmplY3R9IGVhc2luZ1R5cGUgVGhlIGVhc2luZy10eXBlLlxuICAgICMjIyAgICAgXG4gICAgcGxheUFuaW1hdGlvbjogKGFuaW1hdGlvblJlY29yZCkgLT5cbiAgICAgICAgQGZyYW1lQW5pbWF0aW9uLnJlZnJlc2goYW5pbWF0aW9uUmVjb3JkKVxuICAgICAgICBAb2JqZWN0LmFkZENvbXBvbmVudChAZnJhbWVBbmltYXRpb24pXG4gICAgICAgIEBmcmFtZUFuaW1hdGlvbi5zdGFydChAY2FsbGJhY2spXG4gICAgICAgIFxuICAgICAgICByZXR1cm4gQGZyYW1lQW5pbWF0aW9uXG4gICAgICAgXG4gICAgIyMjKlxuICAgICogQ2hhbmdlcyBhIGZpZWxkIG9mIHRoZSBnYW1lIG9iamVjdCB0byBhIHNwZWNpZmllZCB2YWx1ZS5cbiAgICAqXG4gICAgKiBAbWV0aG9kIGNoYW5nZVxuICAgICogQHBhcmFtIHtudW1iZXJ9IFZhbHVlIFRoZSB0YXJnZXQgdmFsdWUuXG4gICAgKiBAcGFyYW0ge3N0cmluZ30gZmllbGQgVGhlIG5hbWUgb2YgdGhlIGZpZWxkL3Byb3BlcnR5LlxuICAgICogQHBhcmFtIHtudW1iZXJ9IGR1cmF0aW9uIFRoZSBkdXJhdGlvbiBpbiBmcmFtZXMuXG4gICAgKiBAcGFyYW0ge09iamVjdH0gZWFzaW5nVHlwZSBUaGUgZWFzaW5nLXR5cGUuXG4gICAgIyMjICAgXG4gICAgY2hhbmdlOiAodmFsdWUsIGZpZWxkLCBkdXJhdGlvbiwgZWFzaW5nVHlwZSkgLT5cbiAgICAgICAgQG9iamVjdC5hZGRDb21wb25lbnQoQGZpZWxkQW5pbWF0aW9uKVxuICAgICAgICBAZmllbGRBbmltYXRpb24uc3RhcnQodmFsdWUsIGZpZWxkLCBkdXJhdGlvbiwgZWFzaW5nVHlwZSwgQGNhbGxiYWNrKVxuICAgICAgICBcbiAgICAgICAgcmV0dXJuIEBmaWVsZEFuaW1hdGlvblxuICAgICAgIFxuICAgICMjIypcbiAgICAqIFNoYWtlcyB0aGUgZ2FtZSBvYmplY3QgaG9yaXpvbnRhbGx5IHVzaW5nIHRoZSBnYW1lIG9iamVjdCdzIG9mZnNldC1wcm9wZXJ0eS5cbiAgICAqXG4gICAgKiBAbWV0aG9kIHNoYWtlXG4gICAgKiBAcGFyYW0ge2dzLlJhbmdlfSByYW5nZSBUaGUgaG9yaXpvbnRhbCBzaGFrZS1yYW5nZS5cbiAgICAqIEBwYXJhbSB7bnVtYmVyfSBzcGVlZCBUaGUgc2hha2Ugc3BlZWQuXG4gICAgKiBAcGFyYW0ge251bWJlcn0gZHVyYXRpb24gVGhlIGR1cmF0aW9uIGluIGZyYW1lcy5cbiAgICAqIEBwYXJhbSB7T2JqZWN0fSBlYXNpbmdUeXBlIFRoZSBlYXNpbmctdHlwZS5cbiAgICAjIyMgXG4gICAgc2hha2U6IChyYW5nZSwgc3BlZWQsIGR1cmF0aW9uLCBlYXNpbmcpIC0+XG4gICAgICAgIEBvYmplY3QuYWRkQ29tcG9uZW50KEBzaGFrZUFuaW1hdGlvbilcbiAgICAgICAgQHNoYWtlQW5pbWF0aW9uLnN0YXJ0KHJhbmdlLCBzcGVlZCwgZHVyYXRpb24sIGVhc2luZywgQGNhbGxiYWNrKVxuICAgICAgICBcbiAgICAgICAgcmV0dXJuIEBzaGFrZUFuaW1hdGlvblxuICAgICAgICBcbiAgICAjIyMqXG4gICAgKiBUaW50cyB0aGUgZ2FtZSBvYmplY3QgdG8gYSBzcGVjaWZpZWQgdG9uZS5cbiAgICAqXG4gICAgKiBAbWV0aG9kIHRpbnRUb1xuICAgICogQHBhcmFtIHtUb25lfSB0b25lIFRoZSB0YXJnZXQgdG9uZS5cbiAgICAqIEBwYXJhbSB7bnVtYmVyfSBkdXJhdGlvbiBUaGUgZHVyYXRpb24gaW4gZnJhbWVzLlxuICAgICogQHBhcmFtIHtPYmplY3R9IGVhc2luZ1R5cGUgVGhlIGVhc2luZy10eXBlLlxuICAgICMjIyBcbiAgICB0aW50VG86ICh0b25lLCBkdXJhdGlvbiwgZWFzaW5nVHlwZSkgLT5cbiAgICAgICAgQG9iamVjdC5hZGRDb21wb25lbnQoQHRpbnRBbmltYXRpb24pXG4gICAgICAgIEB0aW50QW5pbWF0aW9uLnN0YXJ0KHRvbmUsIGR1cmF0aW9uLCBlYXNpbmdUeXBlLCBAY2FsbGJhY2spXG4gICAgICAgIFxuICAgICAgICByZXR1cm4gQHRpbnRBbmltYXRpb25cbiAgICBcbiAgICAjIyMqXG4gICAgKiBSb3RhdGVzIHRoZSBnYW1lIG9iamVjdCBhcm91bmQgaXRzIGFuY2hvci1wb2ludC5cbiAgICAqXG4gICAgKiBAbWV0aG9kIHJvdGF0ZVxuICAgICogQHBhcmFtIHtncy5Sb3RhdGlvbkRpcmVjdGlvbn0gZGlyZWN0aW9uIFRoZSByb3RhdGlvbi1kaXJlY3Rpb24uXG4gICAgKiBAcGFyYW0ge251bWJlcn0gc3BlZWQgVGhlIHJvdGF0aW9uIHNwZWVkIGluIGRlZ3JlZXMgcGVyIGZyYW1lLlxuICAgICogQHBhcmFtIHtudW1iZXJ9IGR1cmF0aW9uIFRoZSBkdXJhdGlvbiBpbiBmcmFtZXMuXG4gICAgKiBAcGFyYW0ge09iamVjdH0gZWFzaW5nVHlwZSBUaGUgZWFzaW5nLXR5cGUuXG4gICAgIyMjIFxuICAgIHJvdGF0ZTogKGRpcmVjdGlvbiwgc3BlZWQsIGR1cmF0aW9uLCBlYXNpbmdUeXBlKSAtPlxuICAgICAgICBAb2JqZWN0LmFkZENvbXBvbmVudChAcm90YXRlQW5pbWF0aW9uKVxuICAgICAgICBAcm90YXRlQW5pbWF0aW9uLnJvdGF0ZShkaXJlY3Rpb24sIHNwZWVkLCBkdXJhdGlvbiwgZWFzaW5nVHlwZSwgQGNhbGxiYWNrKVxuICAgICAgICBcbiAgICAgICAgcmV0dXJuIEByb3RhdGVBbmltYXRpb25cbiAgICBcbiAgICAjIyMqXG4gICAgKiBSb3RhdGVzIHRoZSBnYW1lIG9iamVjdCBhcm91bmQgaXRzIGFuY2hvci1wb2ludCB0byBhIHNwZWNpZmllZCBhbmdsZS5cbiAgICAqXG4gICAgKiBAbWV0aG9kIHJvdGF0ZVRvXG4gICAgKiBAcGFyYW0ge251bWJlcn0gYW5nbGUgVGhlIHRhcmdldCBhbmdsZS5cbiAgICAqIEBwYXJhbSB7bnVtYmVyfSBkdXJhdGlvbiBUaGUgZHVyYXRpb24gaW4gZnJhbWVzLlxuICAgICogQHBhcmFtIHtPYmplY3R9IGVhc2luZ1R5cGUgVGhlIGVhc2luZy10eXBlLlxuICAgICMjIyBcbiAgICByb3RhdGVUbzogKGFuZ2xlLCBkdXJhdGlvbiwgZWFzaW5nVHlwZSkgLT5cbiAgICAgICAgQG9iamVjdC5hZGRDb21wb25lbnQoQHJvdGF0ZUFuaW1hdGlvbilcbiAgICAgICAgQHJvdGF0ZUFuaW1hdGlvbi5yb3RhdGVUbyhhbmdsZSwgZHVyYXRpb24sIGVhc2luZ1R5cGUsIEBjYWxsYmFjaylcbiAgICAgICAgXG4gICAgICAgIHJldHVybiBAcm90YXRlQW5pbWF0aW9uXG4gICAgICAgIFxuICAgICMjIypcbiAgICAqIExldHMgYSBnYW1lIG9iamVjdCBhcHBlYXIgb24gc2NyZWVuIHVzaW5nIGEgbWFza2luZy1lZmZlY3QuXG4gICAgKlxuICAgICogQG1ldGhvZCBtYXNrSW5cbiAgICAqIEBwYXJhbSB7Z3MuTWFza30gbWFzayBUaGUgbWFzayB1c2VkIGZvciB0aGUgYW5pbWF0aW9uLlxuICAgICogQHBhcmFtIHtudW1iZXJ9IGR1cmF0aW9uIFRoZSBkdXJhdGlvbiBpbiBmcmFtZXMuXG4gICAgKiBAcGFyYW0ge09iamVjdH0gZWFzaW5nVHlwZSBUaGUgZWFzaW5nLXR5cGUuXG4gICAgKiBAcGFyYW0ge2Z1bmN0aW9ufSBbY2FsbGJhY2tdIEFuIG9wdGlvbmFsIGNhbGxiYWNrLWZ1bmN0aW9uIGNhbGxlZCB3aGVuIHRoZSBhbmltYXRpb24gaXMgZmluaXNoZWQuIFxuICAgICMjIyAgICAgXG4gICAgbWFza0luOiAobWFzaywgZHVyYXRpb24sIGVhc2luZywgY2FsbGJhY2spIC0+XG4gICAgICAgIEBvYmplY3QuYWRkQ29tcG9uZW50KEBtYXNrQW5pbWF0aW9uKVxuICAgICAgICBAbWFza0FuaW1hdGlvbi5tYXNrSW4obWFzaywgZHVyYXRpb24sIGVhc2luZywgKG9iamVjdCwgYW5pbWF0aW9uKSAtPiBvYmplY3QucmVtb3ZlQ29tcG9uZW50KGFuaW1hdGlvbik7IGNhbGxiYWNrPyhvYmplY3QpOylcbiAgICAgICAgXG4gICAgICAgIHJldHVybiBAbWFza0FuaW1hdGlvblxuICAgICBcbiAgICAjIyMqXG4gICAgKiBEZXNjcmlwdGlvbiBmb2xsb3dzLi4uXG4gICAgKlxuICAgICogQG1ldGhvZCBtYXNrVG9cbiAgICAqIEBwYXJhbSB7Z3MuTWFza30gbWFzayBUaGUgbWFzayB1c2VkIGZvciB0aGUgYW5pbWF0aW9uLlxuICAgICogQHBhcmFtIHtudW1iZXJ9IGR1cmF0aW9uIFRoZSBkdXJhdGlvbiBpbiBmcmFtZXMuXG4gICAgKiBAcGFyYW0ge09iamVjdH0gZWFzaW5nVHlwZSBUaGUgZWFzaW5nLXR5cGUuXG4gICAgKiBAcGFyYW0ge2Z1bmN0aW9ufSBbY2FsbGJhY2tdIEFuIG9wdGlvbmFsIGNhbGxiYWNrLWZ1bmN0aW9uIGNhbGxlZCB3aGVuIHRoZSBhbmltYXRpb24gaXMgZmluaXNoZWQuIFxuICAgICMjIyAgICAgXG4gICAgbWFza1RvOiAobWFzaywgZHVyYXRpb24sIGVhc2luZywgY2FsbGJhY2spIC0+XG4gICAgICAgIEBvYmplY3QuYWRkQ29tcG9uZW50KEBtYXNrQW5pbWF0aW9uKVxuICAgICAgICBAbWFza0FuaW1hdGlvbi5tYXNrVG8obWFzaywgZHVyYXRpb24sIGVhc2luZywgKG9iamVjdCwgYW5pbWF0aW9uKSAtPiBvYmplY3QucmVtb3ZlQ29tcG9uZW50KGFuaW1hdGlvbik7IGNhbGxiYWNrPyhvYmplY3QpOylcbiAgICAgICAgXG4gICAgICAgIHJldHVybiBAbWFza0FuaW1hdGlvblxuICAgICAgICBcbiAgICAjIyMqXG4gICAgKiBMZXRzIGEgZ2FtZSBvYmplY3QgZGlzYXBwZWFyIGZyb20gc2NyZWVuIHVzaW5nIGEgbWFza2luZy1lZmZlY3QuXG4gICAgKlxuICAgICogQG1ldGhvZCBtYXNrT3V0XG4gICAgKiBAcGFyYW0ge2dzLk1hc2t9IG1hc2sgVGhlIG1hc2sgdXNlZCBmb3IgdGhlIGFuaW1hdGlvbi5cbiAgICAqIEBwYXJhbSB7bnVtYmVyfSBkdXJhdGlvbiBUaGUgZHVyYXRpb24gaW4gZnJhbWVzLlxuICAgICogQHBhcmFtIHtPYmplY3R9IGVhc2luZ1R5cGUgVGhlIGVhc2luZy10eXBlLlxuICAgICogQHBhcmFtIHtmdW5jdGlvbn0gW2NhbGxiYWNrXSBBbiBvcHRpb25hbCBjYWxsYmFjay1mdW5jdGlvbiBjYWxsZWQgd2hlbiB0aGUgYW5pbWF0aW9uIGlzIGZpbmlzaGVkLiBcbiAgICAjIyMgIFxuICAgIG1hc2tPdXQ6IChtYXNrLCBkdXJhdGlvbiwgZWFzaW5nLCBjYWxsYmFjaykgLT5cbiAgICAgICAgQG9iamVjdC5hZGRDb21wb25lbnQoQG1hc2tBbmltYXRpb24pXG4gICAgICAgIEBtYXNrQW5pbWF0aW9uLm1hc2tPdXQobWFzaywgZHVyYXRpb24sIGVhc2luZywgKG9iamVjdCwgYW5pbWF0aW9uKSAtPiBvYmplY3QucmVtb3ZlQ29tcG9uZW50KGFuaW1hdGlvbik7IGNhbGxiYWNrPyhvYmplY3QpOylcbiAgICAgICAgXG4gICAgICAgIHJldHVybiBAbWFza0FuaW1hdGlvblxuXG4gICAgIyMjKlxuICAgICogTGV0cyBhIGdhbWUgb2JqZWN0IGFwcGVhciBvbiBzY3JlZW4gZnJvbSBsZWZ0LCB0b3AsIHJpZ2h0IG9yIGJvdHRvbSB1c2luZyBcbiAgICAqIGEgbW92ZS1hbmltYXRpb25cbiAgICAqXG4gICAgKiBAbWV0aG9kIG1vdmVJblxuICAgICogQHBhcmFtIHtudW1iZXJ9IHggVGhlIHgtY29vcmRpbmF0ZSBvZiB0aGUgdGFyZ2V0LXBvc2l0aW9uLlxuICAgICogQHBhcmFtIHtudW1iZXJ9IHkgVGhlIHktY29vcmRpbmF0ZSBvZiB0aGUgdGFyZ2V0LXBvc2l0aW9uLlxuICAgICogQHBhcmFtIHtudW1iZXJ9IHR5cGUgVGhlIG1vdmVtZW50LWRpcmVjdGlvbiBmcm9tIHdoZXJlIHRoZSBnYW1lIG9iamVjdCBzaG91bGQgbW92ZS1pbi5cbiAgICAqIEBwYXJhbSB7bnVtYmVyfSBkdXJhdGlvbiBUaGUgZHVyYXRpb24gaW4gZnJhbWVzLlxuICAgICogQHBhcmFtIHtPYmplY3R9IGVhc2luZ1R5cGUgVGhlIGVhc2luZy10eXBlLlxuICAgICogQHBhcmFtIHtmdW5jdGlvbn0gW2NhbGxiYWNrXSBBbiBvcHRpb25hbCBjYWxsYmFjay1mdW5jdGlvbiBjYWxsZWQgd2hlbiB0aGUgYW5pbWF0aW9uIGlzIGZpbmlzaGVkLiBcbiAgICAjIyMgIFxuICAgIG1vdmVJbjogKHgsIHksIHR5cGUsIGR1cmF0aW9uLCBlYXNpbmcsIGNhbGxiYWNrKSAtPlxuICAgICAgICBAb2JqZWN0LmFkZENvbXBvbmVudChAbW92ZUFuaW1hdGlvbilcbiAgICAgICAgQG1vdmVBbmltYXRpb24ubW92ZUluKHgsIHksIHR5cGUsIGR1cmF0aW9uLCBlYXNpbmcsIChvYmplY3QsIGFuaW1hdGlvbikgLT4gXG4gICAgICAgICAgICBvYmplY3QucmVtb3ZlQ29tcG9uZW50KGFuaW1hdGlvbilcbiAgICAgICAgICAgIGNhbGxiYWNrPyhvYmplY3QpKVxuICAgICAgICBcbiAgICAgICAgcmV0dXJuIEBtb3ZlQW5pbWF0aW9uXG4gICAgICBcbiAgICAjIyMqXG4gICAgKiBMZXRzIGEgZ2FtZSBvYmplY3QgZGlzYXBwZWFyIGZyb20gc2NyZWVuIHRvIHRoZSBsZWZ0LCB0b3AsIHJpZ2h0IG9yIGJvdHRvbSB1c2luZyBcbiAgICAqIGEgbW92ZS1hbmltYXRpb25cbiAgICAqXG4gICAgKiBAbWV0aG9kIG1vdmVPdXRcbiAgICAqIEBwYXJhbSB7bnVtYmVyfSB0eXBlIFRoZSBtb3ZlbWVudC1kaXJlY3Rpb24gaW4gd2hpY2ggdGhlIGdhbWUgb2JqZWN0IHNob3VsZCBtb3ZlLW91dC5cbiAgICAqIEBwYXJhbSB7bnVtYmVyfSBkdXJhdGlvbiBUaGUgZHVyYXRpb24gaW4gZnJhbWVzLlxuICAgICogQHBhcmFtIHtPYmplY3R9IGVhc2luZ1R5cGUgVGhlIGVhc2luZy10eXBlLlxuICAgICogQHBhcmFtIHtmdW5jdGlvbn0gW2NhbGxiYWNrXSBBbiBvcHRpb25hbCBjYWxsYmFjay1mdW5jdGlvbiBjYWxsZWQgd2hlbiB0aGUgYW5pbWF0aW9uIGlzIGZpbmlzaGVkLiBcbiAgICAjIyMgICAgXG4gICAgbW92ZU91dDogKHR5cGUsIGR1cmF0aW9uLCBlYXNpbmcsIGNhbGxiYWNrKSAtPlxuICAgICAgICBAb2JqZWN0LmFkZENvbXBvbmVudChAbW92ZUFuaW1hdGlvbilcbiAgICAgICAgQG1vdmVBbmltYXRpb24ubW92ZU91dCh0eXBlLCBkdXJhdGlvbiwgZWFzaW5nLCAob2JqZWN0LCBhbmltYXRpb24pIC0+IFxuICAgICAgICAgICAgb2JqZWN0LnJlbW92ZUNvbXBvbmVudChhbmltYXRpb24pXG4gICAgICAgICAgICBjYWxsYmFjaz8ob2JqZWN0KVxuICAgICAgICApXG4gICAgICAgIFxuICAgICAgICByZXR1cm4gQG1vdmVBbmltYXRpb25cbiAgICAgICAgXG4gICAgIyMjKlxuICAgICogTGV0cyBhIGdhbWUgb2JqZWN0IGFwcGVhciBvbiBzY3JlZW4gdXNpbmcgYmxlbmRpbmcuXG4gICAgKlxuICAgICogQG1ldGhvZCBzaG93XG4gICAgKiBAcGFyYW0ge251bWJlcn0gZHVyYXRpb24gVGhlIGR1cmF0aW9uIGluIGZyYW1lcy5cbiAgICAqIEBwYXJhbSB7T2JqZWN0fSBlYXNpbmcgVGhlIGVhc2luZy10eXBlLlxuICAgICogQHBhcmFtIHtmdW5jdGlvbn0gW2NhbGxiYWNrXSBBbiBvcHRpb25hbCBjYWxsYmFjay1mdW5jdGlvbiBjYWxsZWQgd2hlbiB0aGUgYW5pbWF0aW9uIGlzIGZpbmlzaGVkLiBcbiAgICAjIyMgIFxuICAgIHNob3c6IChkdXJhdGlvbiwgZWFzaW5nLCBjYWxsYmFjaykgLT5cbiAgICAgICAgQG9iamVjdC5vcGFjaXR5ID0gMFxuICAgICAgICBAb2JqZWN0LnZpc3VhbD8udXBkYXRlKClcbiAgICAgICAgXG4gICAgICAgIHJldHVybiBAYmxlbmRUbygyNTUsIGR1cmF0aW9uLCBlYXNpbmcsIGNhbGxiYWNrKVxuICAgICBcbiAgICAjIyMqXG4gICAgKiBMZXRzIGEgZ2FtZSBvYmplY3QgZGlzYXBwZWFyIGZyb20gc2NyZWVuIHVzaW5nIGJsZW5kaW5nLlxuICAgICpcbiAgICAqIEBtZXRob2QgaGlkZVxuICAgICogQHBhcmFtIHtudW1iZXJ9IGR1cmF0aW9uIFRoZSBkdXJhdGlvbiBpbiBmcmFtZXMuXG4gICAgKiBAcGFyYW0ge09iamVjdH0gZWFzaW5nIFRoZSBlYXNpbmctdHlwZS5cbiAgICAqIEBwYXJhbSB7ZnVuY3Rpb259IFtjYWxsYmFja10gQW4gb3B0aW9uYWwgY2FsbGJhY2stZnVuY3Rpb24gY2FsbGVkIHdoZW4gdGhlIGFuaW1hdGlvbiBpcyBmaW5pc2hlZC4gXG4gICAgIyMjICAgICBcbiAgICBoaWRlOiAoZHVyYXRpb24sIGVhc2luZywgY2FsbGJhY2spIC0+XG4gICAgICAgIHJldHVybiBAYmxlbmRUbygwLCBkdXJhdGlvbiwgZWFzaW5nLCBjYWxsYmFjaylcbiAgICAgICBcbiAgICAjIyMqXG4gICAgKiBDaGFuZ2VzIHZpc2libGUtcHJvcGVydHkgdG8gdHJ1ZS4gVGhpcyBtZXRob2QgaXMgZGVwcmVjYXRlZC5cbiAgICAqIFxuICAgICogQG1ldGhvZCBvcGVuXG4gICAgKiBAZGVwcmVjYXRlZFxuICAgICMjIyAgIFxuICAgIG9wZW46IC0+IEBvYmplY3QudmlzaWJsZSA9IHllc1xuICAgIFxuICAgICMjIypcbiAgICAqIENoYW5nZXMgdmlzaWJsZS1wcm9wZXJ0eSB0byBmYWxzZS4gVGhpcyBtZXRob2QgaXMgZGVwcmVjYXRlZC5cbiAgICAqIFxuICAgICogQG1ldGhvZCBjbG9zZVxuICAgICogQGRlcHJlY2F0ZWRcbiAgICAjIyMgICBcbiAgICBjbG9zZTogLT4gQG9iamVjdC52aXNpYmxlID0gbm9cbiAgICBcbiAgICAjIyMqXG4gICAgKiBGbGFzaGVzIHRoZSBnYW1lIG9iamVjdC5cbiAgICAqXG4gICAgKiBAbWV0aG9kIGZsYXNoXG4gICAgKiBAcGFyYW0ge0NvbG9yfSBjb2xvciBUaGUgZmxhc2gtY29sb3IuXG4gICAgKiBAcGFyYW0ge251bWJlcn0gZHVyYXRpb24gVGhlIGR1cmF0aW9uIGluIGZyYW1lcy5cbiAgICAjIyNcbiAgICBmbGFzaDogKGNvbG9yLCBkdXJhdGlvbikgLT5cbiAgICAgICAgQG9iamVjdC5jb2xvciA9IGNvbG9yXG4gICAgICAgIGNvbG9yID0gbmV3IENvbG9yKGNvbG9yKVxuICAgICAgICBjb2xvci5hbHBoYSA9IDBcbiAgICAgICAgcmV0dXJuIEBjb2xvclRvKGNvbG9yLCBkdXJhdGlvbiwgZ3MuRWFzaW5ncy5FQVNFX0xJTkVBUltncy5FYXNpbmdUeXBlcy5FQVNFX0lOXSlcbiAgICBcbiAgICAjIyMqXG4gICAgKiBMZXRzIGEgZ2FtZSBvYmplY3QgYXBwZWFyIG9uIHNjcmVlbiB1c2luZyBhIHNwZWNpZmllZCBhbmltYXRpb24uXG4gICAgKlxuICAgICogQG1ldGhvZCBhcHBlYXJcbiAgICAqIEBwYXJhbSB7bnVtYmVyfSB4IFRoZSB4LWNvb3JkaW5hdGUgb2YgdGhlIHRhcmdldC1wb3NpdGlvbi5cbiAgICAqIEBwYXJhbSB7bnVtYmVyfSB5IFRoZSB5LWNvb3JkaW5hdGUgb2YgdGhlIHRhcmdldC1wb3NpdGlvbi5cbiAgICAqIEBwYXJhbSB7Z3MuQXBwZWFyQW5pbWF0aW9uSW5mb30gYW5pbWF0aW9uIFRoZSBhbmltYXRpb24gaW5mby1vYmplY3QuXG4gICAgKiBAcGFyYW0ge09iamVjdH0gZWFzaW5nIFRoZSBlYXNpbmctdHlwZS5cbiAgICAqIEBwYXJhbSB7bnVtYmVyfSBkdXJhdGlvbiBUaGUgZHVyYXRpb24gaW4gZnJhbWVzLlxuICAgICogQHBhcmFtIHtmdW5jdGlvbn0gW2NhbGxiYWNrXSBBbiBvcHRpb25hbCBjYWxsYmFjay1mdW5jdGlvbiBjYWxsZWQgd2hlbiB0aGUgYW5pbWF0aW9uIGlzIGZpbmlzaGVkLiBcbiAgICAjIyMgICAgICBcbiAgICBhcHBlYXI6ICh4LCB5LCBhbmltYXRpb24sIGVhc2luZywgZHVyYXRpb24sIGNhbGxiYWNrKSAtPlxuICAgICAgICBlYXNpbmcgPSBlYXNpbmcgfHwgZ3MuRWFzaW5ncy5FQVNFX0xJTkVBUltncy5FYXNpbmdUeXBlcy5FQVNFX0lOXVxuICAgICAgICBAb2JqZWN0LnZpc2libGUgPSB5ZXNcblxuICAgICAgICBpZiBhbmltYXRpb24udHlwZSA9PSBncy5BbmltYXRpb25UeXBlcy5NT1ZFTUVOVFxuICAgICAgICAgICAgQG1vdmVJbih4LCB5LCBhbmltYXRpb24ubW92ZW1lbnQsIGR1cmF0aW9uLCBlYXNpbmcsIGNhbGxiYWNrKVxuICAgICAgICBlbHNlIGlmIGFuaW1hdGlvbi50eXBlID09IGdzLkFuaW1hdGlvblR5cGVzLk1BU0tJTkdcbiAgICAgICAgICAgIEBtYXNrSW4oYW5pbWF0aW9uLm1hc2ssIGR1cmF0aW9uLCBlYXNpbmcsIGNhbGxiYWNrKVxuICAgICAgICBlbHNlXG4gICAgICAgICAgICBAc2hvdyhkdXJhdGlvbiwgZWFzaW5nLCBjYWxsYmFjaylcbiAgICBcbiAgICAjIyMqXG4gICAgKiBMZXRzIGEgZ2FtZSBvYmplY3QgZGlzYXBwZWFyIGZyb20gc2NyZWVuIHVzaW5nIGEgc3BlY2lmaWVkIGFuaW1hdGlvbi5cbiAgICAqXG4gICAgKiBAbWV0aG9kIGRpc2FwcGVhclxuICAgICogQHBhcmFtIHtncy5BcHBlYXJBbmltYXRpb25JbmZvfSBhbmltYXRpb24gVGhlIGFuaW1hdGlvbiBpbmZvLW9iamVjdC5cbiAgICAqIEBwYXJhbSB7T2JqZWN0fSBlYXNpbmcgVGhlIGVhc2luZy10eXBlLlxuICAgICogQHBhcmFtIHtudW1iZXJ9IGR1cmF0aW9uIFRoZSBkdXJhdGlvbiBpbiBmcmFtZXMuXG4gICAgKiBAcGFyYW0ge2Z1bmN0aW9ufSBbY2FsbGJhY2tdIEFuIG9wdGlvbmFsIGNhbGxiYWNrLWZ1bmN0aW9uIGNhbGxlZCB3aGVuIHRoZSBhbmltYXRpb24gaXMgZmluaXNoZWQuIFxuICAgICMjIyAgICAgICBcbiAgICBkaXNhcHBlYXI6IChhbmltYXRpb24sIGVhc2luZywgZHVyYXRpb24sIGNhbGxiYWNrKSAtPlxuICAgICAgICBAb2JqZWN0LnZpc2libGUgPSB5ZXNcbiAgICAgICAgaWYgYW5pbWF0aW9uLnR5cGUgPT0gZ3MuQW5pbWF0aW9uVHlwZXMuTU9WRU1FTlRcbiAgICAgICAgICAgIEBtb3ZlT3V0KGFuaW1hdGlvbi5tb3ZlbWVudCwgZHVyYXRpb24sIGVhc2luZywgY2FsbGJhY2spXG4gICAgICAgIGVsc2UgaWYgYW5pbWF0aW9uLnR5cGUgPT0gZ3MuQW5pbWF0aW9uVHlwZXMuTUFTS0lOR1xuICAgICAgICAgICAgQG1hc2tPdXQoYW5pbWF0aW9uLm1hc2ssIGR1cmF0aW9uLCBlYXNpbmcsIGNhbGxiYWNrKVxuICAgICAgICBlbHNlXG4gICAgICAgICAgICBAaGlkZShkdXJhdGlvbiwgZWFzaW5nLCBjYWxsYmFjaylcbiAgICAgICAgXG5cbmdzLkFuaW1hdG9yID0gQ29tcG9uZW50X0FuaW1hdG9yXG5ncy5Db21wb25lbnRfQW5pbWF0b3IgPSBDb21wb25lbnRfQW5pbWF0b3IiXX0=
//# sourceURL=Component_Animator_139.js