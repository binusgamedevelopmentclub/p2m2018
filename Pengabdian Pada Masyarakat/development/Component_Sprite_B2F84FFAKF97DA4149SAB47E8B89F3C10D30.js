var AnimationTypes, Component_Sprite,
  extend = function(child, parent) { for (var key in parent) { if (hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; },
  hasProp = {}.hasOwnProperty;

Component_Sprite = (function(superClass) {
  extend(Component_Sprite, superClass);


  /**
  * Called if this object instance is restored from a data-bundle. It can be used
  * re-assign event-handler, anonymous functions, etc.
  * 
  * @method onDataBundleRestore.
  * @param Object data - The data-bundle
  * @param gs.ObjectCodecContext context - The codec-context.
   */

  Component_Sprite.prototype.onDataBundleRestore = function(data, context) {
    return this.setupEventHandlers();
  };


  /**
  * A sprite component to display an object on screen. It can be managed or
  * unmanaged. A managed sprite is automatically added to the graphics-system
  * and rendered every frame until it gets disposed. An unmanaged sprite needs
  * to be added and removed manually.
  *
  * @module gs
  * @class Component_Sprite
  * @extends gs.Component_Visual
  * @memberof gs
  * @constructor
  * @param {boolean} managed - Indicates if the sprite is managed by the graphics system.
   */

  function Component_Sprite(managed) {
    Component_Sprite.__super__.constructor.call(this);

    /**
    * The native sprite object to display the game object on screen.
    *
    * @property sprite
    * @type Sprite
    * @protected
     */
    this.sprite = null;

    /**
    * The name of the image to display.
    *
    * @property image
    * @type string
    * @protected
     */
    this.image = null;

    /**
    * The name of the video to display.
    *
    * @property video
    * @type string
    * @protected
     */
    this.video = null;

    /**
    * The name of the folder from where the image should be loaded.
    *
    * @property image
    * @type string
    * @protected
     */
    this.imageFolder = "Graphics/Pictures";

    /**
    * The visibility. If <b>false</b>, the sprite is not rendered.
    *
    * @property visible
    * @type boolean
    * @protected
     */
    this.visible = false;

    /**
    * Indicates if the image is loaded.
    *
    * @property imageLoaded
    * @type boolean
    * @protected
     */
    this.imageLoaded = false;
    debugger;
  }


  /**
  * Disposes the sprite. If the sprite is managed, it will be automatically
  * removed from the graphics system and viewport.
  * @method dispose
   */

  Component_Sprite.prototype.dispose = function() {
    var ref, ref1;
    Component_Sprite.__super__.dispose.apply(this, arguments);
    if (this.sprite) {
      this.sprite.dispose();
      if (this.sprite.video) {
        this.sprite.video.stop();
      }
      if (!this.sprite.managed) {
        if ((ref = this.sprite.viewport) != null) {
          ref.removeGraphicObject(this.sprite);
        }
        return (ref1 = Graphics.viewport) != null ? ref1.removeGraphicObject(this.sprite) : void 0;
      }
    }
  };


  /**
  * Adds event-handlers for mouse/touch events
  *
  * @method setupEventHandlers
   */

  Component_Sprite.prototype.setupEventHandlers = function() {
    return this.sprite.onIndexChange = (function(_this) {
      return function() {
        _this.object.rIndex = _this.sprite.index;
        return _this.object.needsUpdate = true;
      };
    })(this);
  };


  /**
  * Setup the sprite. 
  * @method setupSprite
   */

  Component_Sprite.prototype.setupSprite = function() {
    if (!this.sprite) {
      return this.sprite = new gs.Sprite(Graphics.viewport, typeof managed !== "undefined" && managed !== null ? managed : true);
    }
  };


  /**
  * Setup the sprite component. This method is automatically called by the
  * system.
  * @method setup
   */

  Component_Sprite.prototype.setup = function() {
    this.isSetup = true;
    this.setupSprite();
    this.setupEventHandlers();
    return this.update();
  };


  /**
  * Updates the source- and destination-rectangle of the game object so that
  * the associated bitmap fits in. The imageHandling property controls how
  * the rectangles are resized.
  * @method updateRect
   */

  Component_Sprite.prototype.updateRect = function() {
    if (this.sprite.bitmap != null) {
      if (!this.object.imageHandling) {
        this.object.srcRect = new Rect(0, 0, this.sprite.bitmap.width, this.sprite.bitmap.height);
        if (!this.object.fixedSize) {
          this.object.dstRect.width = this.object.srcRect.width;
          return this.object.dstRect.height = this.object.srcRect.height;
        }
      } else if (this.object.imageHandling === 1) {
        this.object.srcRect = new Rect(0, 0, this.sprite.bitmap.width, this.sprite.bitmap.height / 2);
        if (!this.object.fixedSize) {
          this.object.dstRect.width = this.object.srcRect.width;
          return this.object.dstRect.height = this.object.srcRect.height;
        }
      } else if (this.object.imageHandling === 2) {
        if (!this.object.fixedSize) {
          this.object.dstRect.width = this.object.srcRect.width;
          return this.object.dstRect.height = this.object.srcRect.height;
        }
      }
    }
  };


  /**
  * Updates the bitmap object from the associated image name. The imageFolder
  * property controls from which resource-folder the image will be loaded.
  * @method updateBitmap
   */

  Component_Sprite.prototype.updateBitmap = function() {
    this.imageLoaded = false;
    this.image = this.object.image;
    if (this.object.image.startsWith("data:") || this.object.image.startsWith("$")) {
      this.sprite.bitmap = ResourceManager.getBitmap(this.object.image);
    } else {
      this.sprite.bitmap = ResourceManager.getBitmap((this.object.imageFolder || this.imageFolder) + "/" + this.object.image);
    }
    if (this.sprite.bitmap != null) {
      if (!this.imageLoaded) {
        this.imageLoaded = this.sprite.bitmap.loaded;
      } else {
        delete this.sprite.bitmap.loaded_;
      }
    }
    return this.object.bitmap = this.sprite.bitmap;
  };


  /**
  * Updates the video object from the associated video name. It also updates
  * the video-rendering process.
  * @method updateVideo
   */

  Component_Sprite.prototype.updateVideo = function() {
    var ref, ref1;
    if (this.object.video !== this.videoName) {
      this.videoName = this.object.video;
      this.sprite.video = ResourceManager.getVideo("Movies/" + this.object.video);
      if (this.sprite.video != null) {
        if ((ref = $PARAMS.preview) != null ? ref.settings.musicDisabled : void 0) {
          this.sprite.video.volume = 0;
        }
        this.sprite.video.loop = this.object.loop;
        this.sprite.video.play();
        this.object.srcRect = new Rect(0, 0, this.sprite.video.width, this.sprite.video.height);
        if (!this.object.fixedSize) {
          this.object.dstRect = new Rect(this.object.dstRect.x, this.object.dstRect.y, this.sprite.video.width, this.sprite.video.height);
        }
      }
    }
    return (ref1 = this.sprite.video) != null ? ref1.update() : void 0;
  };


  /**
  * Updates the image if the game object has the image-property set.
  * @method updateImage
   */

  Component_Sprite.prototype.updateImage = function() {
    var ref;
    if (this.object.image != null) {
      if (this.object.image !== this.image || (!this.imageLoaded && ((ref = this.sprite.bitmap) != null ? ref.loaded : void 0))) {
        this.updateBitmap();
        return this.updateRect();
      }
    } else if (this.object.bitmap != null) {
      return this.sprite.bitmap = this.object.bitmap;
    } else if ((this.object.video != null) || this.videoName !== this.object.video) {
      return this.updateVideo();
    } else {
      this.image = null;
      this.object.bitmap = null;
      return this.sprite.bitmap = null;
    }
  };


  /**
  * If the sprite is unmanaged, this method will update the visibility of the
  * sprite. If the sprite leaves the viewport, it will be removed to save 
  * performance and automatically added back to the viewport if it enters
  * the viewport.
  * @method updateVisibility
   */

  Component_Sprite.prototype.updateVisibility = function() {
    var visible;
    if (!this.sprite.managed) {
      visible = Rect.intersect(this.object.dstRect.x + this.object.origin.x, this.object.dstRect.y + this.object.origin.y, this.object.dstRect.width, this.object.dstRect.height, 0, 0, Graphics.width, Graphics.height);
      if (visible && !this.visible) {
        (this.object.viewport || Graphics.viewport).addGraphicObject(this.sprite);
        this.visible = true;
      }
      if (!visible && this.visible) {
        (this.object.viewport || Graphics.viewport).removeGraphicObject(this.sprite);
        return this.visible = false;
      }
    }
  };


  /**
  * Updates the padding.
  * @method updatePadding
   */

  Component_Sprite.prototype.updatePadding = function() {
    if (this.object.padding != null) {
      this.sprite.x += this.object.padding.left;
      this.sprite.y += this.object.padding.top;
      this.sprite.zoomX -= (this.object.padding.left + this.object.padding.right) / this.object.srcRect.width;
      return this.sprite.zoomY -= (this.object.padding.bottom + this.object.padding.bottom) / this.object.srcRect.height;
    }
  };


  /**
  * Updates the sprite properties from the game object properties.
  * @method updateProperties
   */

  Component_Sprite.prototype.updateProperties = function() {
    var ref, ref1;
    this.sprite.width = this.object.dstRect.width;
    this.sprite.height = this.object.dstRect.height;
    this.sprite.x = this.object.dstRect.x;
    this.sprite.y = this.object.dstRect.y;
    this.sprite.mask = (ref = this.object.mask) != null ? ref : this.mask;
    this.sprite.angle = this.object.angle || 0;
    this.sprite.opacity = (ref1 = this.object.opacity) != null ? ref1 : 255;
    this.sprite.clipRect = this.object.clipRect;
    this.sprite.srcRect = this.object.srcRect;
    this.sprite.blendingMode = this.object.blendMode || 0;
    this.sprite.mirror = this.object.mirror;
    this.sprite.visible = this.object.visible && (!this.object.parent || (this.object.parent.visible == null) || this.object.parent.visible);
    this.sprite.ox = -this.object.origin.x;
    this.sprite.oy = -this.object.origin.y;
    return this.sprite.z = (this.object.zIndex || 0) + (!this.object.parent ? 0 : this.object.parent.zIndex || 0);
  };


  /**
  * Updates the optional sprite properties from the game object properties.
  * @method updateOptionalProperties
   */

  Component_Sprite.prototype.updateOptionalProperties = function() {
    if (this.object.tone != null) {
      this.sprite.tone = this.object.tone;
    }
    if (this.object.color != null) {
      this.sprite.color = this.object.color;
    }
    if (this.object.viewport != null) {
      this.sprite.viewport = this.object.viewport;
    }
    if (this.object.effects != null) {
      this.sprite.effects = this.object.effects;
    }
    if (this.object.anchor != null) {
      this.sprite.anchor.x = this.object.anchor.x;
      this.sprite.anchor.y = this.object.anchor.y;
    }
    if (this.object.positionAnchor != null) {
      this.sprite.positionAnchor = this.object.positionAnchor;
    }
    if (this.object.zoom != null) {
      this.sprite.zoomX = this.object.zoom.x;
      this.sprite.zoomY = this.object.zoom.y;
    }
    if (this.object.motionBlur != null) {
      return this.sprite.motionBlur = this.object.motionBlur;
    }
  };


  /**
  * Updates the sprite component by updating its visibility, image, padding and
  * properties.
  * @method update
   */

  Component_Sprite.prototype.update = function() {
    Component_Sprite.__super__.update.apply(this, arguments);
    if (!this.isSetup) {
      this.setup();
    }
    this.updateVisibility();
    this.updateImage();
    this.updateProperties();
    this.updateOptionalProperties();
    this.updatePadding();
    this.object.rIndex = this.sprite.index;
    return this.sprite.update();
  };

  return Component_Sprite;

})(gs.Component_Visual);


/**
* Enumeration of appearance animations. 
*
* @module gs
* @class AnimationTypes
* @static
* @memberof gs
 */

AnimationTypes = (function() {
  function AnimationTypes() {}

  AnimationTypes.initialize = function() {

    /**
    * An object appears or disappears by moving into or out of the screen.
    * @property MOVEMENT
    * @type number
    * @static
    * @final
     */
    this.MOVEMENT = 0;

    /**
    * An object appears or disappears using alpha-blending.
    * @property BLENDING
    * @type number
    * @static
    * @final
     */
    this.BLENDING = 1;

    /**
    * An object appears or disappears using a mask-image.
    * @property MASKING
    * @type number
    * @static
    * @final
     */
    return this.MASKING = 2;
  };

  return AnimationTypes;

})();

AnimationTypes.initialize();

gs.AnimationTypes = AnimationTypes;

gs.Component_Sprite = Component_Sprite;

//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQU9BLElBQUEsZ0NBQUE7RUFBQTs7O0FBQU07Ozs7QUFDRjs7Ozs7Ozs7OzZCQVFBLG1CQUFBLEdBQXFCLFNBQUMsSUFBRCxFQUFPLE9BQVA7V0FDakIsSUFBQyxDQUFBLGtCQUFELENBQUE7RUFEaUI7OztBQUdyQjs7Ozs7Ozs7Ozs7Ozs7RUFhYSwwQkFBQyxPQUFEO0lBQ1QsZ0RBQUE7O0FBRUE7Ozs7Ozs7SUFPQSxJQUFDLENBQUEsTUFBRCxHQUFVOztBQUVWOzs7Ozs7O0lBT0EsSUFBQyxDQUFBLEtBQUQsR0FBUzs7QUFFVDs7Ozs7OztJQU9BLElBQUMsQ0FBQSxLQUFELEdBQVM7O0FBRVQ7Ozs7Ozs7SUFPQSxJQUFDLENBQUEsV0FBRCxHQUFlOztBQUVmOzs7Ozs7O0lBT0EsSUFBQyxDQUFBLE9BQUQsR0FBVzs7QUFFWDs7Ozs7OztJQU9BLElBQUMsQ0FBQSxXQUFELEdBQWU7QUFFZjtFQXpEUzs7O0FBMkRiOzs7Ozs7NkJBS0EsT0FBQSxHQUFTLFNBQUE7QUFDTCxRQUFBO0lBQUEsK0NBQUEsU0FBQTtJQUVBLElBQUcsSUFBQyxDQUFBLE1BQUo7TUFDSSxJQUFDLENBQUEsTUFBTSxDQUFDLE9BQVIsQ0FBQTtNQUVBLElBQUcsSUFBQyxDQUFBLE1BQU0sQ0FBQyxLQUFYO1FBQ0ksSUFBQyxDQUFBLE1BQU0sQ0FBQyxLQUFLLENBQUMsSUFBZCxDQUFBLEVBREo7O01BR0EsSUFBRyxDQUFJLElBQUMsQ0FBQSxNQUFNLENBQUMsT0FBZjs7YUFDb0IsQ0FBRSxtQkFBbEIsQ0FBc0MsSUFBQyxDQUFBLE1BQXZDOzt3REFDaUIsQ0FBRSxtQkFBbkIsQ0FBdUMsSUFBQyxDQUFBLE1BQXhDLFdBRko7T0FOSjs7RUFISzs7O0FBYVQ7Ozs7Ozs2QkFLQSxrQkFBQSxHQUFvQixTQUFBO1dBQ2hCLElBQUMsQ0FBQSxNQUFNLENBQUMsYUFBUixHQUF3QixDQUFBLFNBQUEs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QSxJQUFDLENBQUEsZ0JBQUQsQ0FBQTtJQUNBLElBQUMsQ0FBQSxXQUFELENBQUE7SUFDQSxJQUFDLENBQUEsZ0JBQUQsQ0FBQTtJQUNBLElBQUMsQ0FBQSx3QkFBRCxDQUFBO0lBQ0EsSUFBQyxDQUFBLGFBQUQsQ0FBQTtJQUVBLElBQUMsQ0FBQSxNQUFNLENBQUMsTUFBUixHQUFpQixJQUFDLENBQUEsTUFBTSxDQUFDO1dBQ3pCLElBQUMsQ0FBQSxNQUFNLENBQUMsTUFBUixDQUFBO0VBWEk7Ozs7R0F6U21CLEVBQUUsQ0FBQzs7O0FBdVRsQzs7Ozs7Ozs7O0FBUU07OztFQUNGLGNBQUMsQ0FBQSxVQUFELEdBQWEsU0FBQTs7QUFDVDs7Ozs7OztJQU9BLElBQUMsQ0FBQSxRQUFELEdBQVk7O0FBQ1o7Ozs7Ozs7SUFPQSxJQUFDLENBQUEsUUFBRCxHQUFZOztBQUNaOzs7Ozs7O1dBT0EsSUFBQyxDQUFBLE9BQUQsR0FBVztFQXhCRjs7Ozs7O0FBMEJqQixjQUFjLENBQUMsVUFBZixDQUFBOztBQUNBLEVBQUUsQ0FBQyxjQUFILEdBQW9COztBQUNwQixFQUFFLENBQUMsZ0JBQUgsR0FBc0IiLCJzb3VyY2VzQ29udGVudCI6WyIjID09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT1cbiNcbiMgICBTY3JpcHQ6IENvbXBvbmVudFxuI1xuIyAgICQkQ09QWVJJR0hUJCRcbiNcbiMgPT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PVxuY2xhc3MgQ29tcG9uZW50X1Nwcml0ZSBleHRlbmRzIGdzLkNvbXBvbmVudF9WaXN1YWxcbiAgICAjIyMqXG4gICAgKiBDYWxsZWQgaWYgdGhpcyBvYmplY3QgaW5zdGFuY2UgaXMgcmVzdG9yZWQgZnJvbSBhIGRhdGEtYnVuZGxlLiBJdCBjYW4gYmUgdXNlZFxuICAgICogcmUtYXNzaWduIGV2ZW50LWhhbmRsZXIsIGFub255bW91cyBmdW5jdGlvbnMsIGV0Yy5cbiAgICAqIFxuICAgICogQG1ldGhvZCBvbkRhdGFCdW5kbGVSZXN0b3JlLlxuICAgICogQHBhcmFtIE9iamVjdCBkYXRhIC0gVGhlIGRhdGEtYnVuZGxlXG4gICAgKiBAcGFyYW0gZ3MuT2JqZWN0Q29kZWNDb250ZXh0IGNvbnRleHQgLSBUaGUgY29kZWMtY29udGV4dC5cbiAgICAjIyNcbiAgICBvbkRhdGFCdW5kbGVSZXN0b3JlOiAoZGF0YSwgY29udGV4dCkgLT5cbiAgICAgICAgQHNldHVwRXZlbnRIYW5kbGVycygpXG4gICAgICAgIFxuICAgICMjIypcbiAgICAqIEEgc3ByaXRlIGNvbXBvbmVudCB0byBkaXNwbGF5IGFuIG9iamVjdCBvbiBzY3JlZW4uIEl0IGNhbiBiZSBtYW5hZ2VkIG9yXG4gICAgKiB1bm1hbmFnZWQuIEEgbWFuYWdlZCBzcHJpdGUgaXMgYXV0b21hdGljYWxseSBhZGRlZCB0byB0aGUgZ3JhcGhpY3Mtc3lzdGVtXG4gICAgKiBhbmQgcmVuZGVyZWQgZXZlcnkgZnJhbWUgdW50aWwgaXQgZ2V0cyBkaXNwb3NlZC4gQW4gdW5tYW5hZ2VkIHNwcml0ZSBuZWVkc1xuICAgICogdG8gYmUgYWRkZWQgYW5kIHJlbW92ZWQgbWFudWFsbHkuXG4gICAgKlxuICAgICogQG1vZHVsZSBnc1xuICAgICogQGNsYXNzIENvbXBvbmVudF9TcHJpdGVcbiAgICAqIEBleHRlbmRzIGdzLkNvbXBvbmVudF9WaXN1YWxcbiAgICAqIEBtZW1iZXJvZiBnc1xuICAgICogQGNvbnN0cnVjdG9yXG4gICAgKiBAcGFyYW0ge2Jvb2xlYW59IG1hbmFnZWQgLSBJbmRpY2F0ZXMgaWYgdGhlIHNwcml0ZSBpcyBtYW5hZ2VkIGJ5IHRoZSBncmFwaGljcyBzeXN0ZW0uXG4gICAgIyMjXG4gICAgY29uc3RydWN0b3I6IChtYW5hZ2VkKSAtPlxuICAgICAgICBzdXBlcigpXG5cbiAgICAgICAgIyMjKlxuICAgICAgICAqIFRoZSBuYXRpdmUgc3ByaXRlIG9iamVjdCB0byBkaXNwbGF5IHRoZSBnYW1lIG9iamVjdCBvbiBzY3JlZW4uXG4gICAgICAgICpcbiAgICAgICAgKiBAcHJvcGVydHkgc3ByaXRlXG4gICAgICAgICogQHR5cGUgU3ByaXRlXG4gICAgICAgICogQHByb3RlY3RlZFxuICAgICAgICAjIyNcbiAgICAgICAgQHNwcml0ZSA9IG51bGxcbiAgICAgICAgXG4gICAgICAgICMjIypcbiAgICAgICAgKiBUaGUgbmFtZSBvZiB0aGUgaW1hZ2UgdG8gZGlzcGxheS5cbiAgICAgICAgKlxuICAgICAgICAqIEBwcm9wZXJ0eSBpbWFnZVxuICAgICAgICAqIEB0eXBlIHN0cmluZ1xuICAgICAgICAqIEBwcm90ZWN0ZWRcbiAgICAgICAgIyMjXG4gICAgICAgIEBpbWFnZSA9IG51bGxcbiAgICAgICAgXG4gICAgICAgICMjIypcbiAgICAgICAgKiBUaGUgbmFtZSBvZiB0aGUgdmlkZW8gdG8gZGlzcGxheS5cbiAgICAgICAgKlxuICAgICAgICAqIEBwcm9wZXJ0eSB2aWRlb1xuICAgICAgICAqIEB0eXBlIHN0cmluZ1xuICAgICAgICAqIEBwcm90ZWN0ZWRcbiAgICAgICAgIyMjXG4gICAgICAgIEB2aWRlbyA9IG51bGxcbiAgICAgICAgXG4gICAgICAgICMjIypcbiAgICAgICAgKiBUaGUgbmFtZSBvZiB0aGUgZm9sZGVyIGZyb20gd2hlcmUgdGhlIGltYWdlIHNob3VsZCBiZSBsb2FkZWQuXG4gICAgICAgICpcbiAgICAgICAgKiBAcHJvcGVydHkgaW1hZ2VcbiAgICAgICAgKiBAdHlwZSBzdHJpbmdcbiAgICAgICAgKiBAcHJvdGVjdGVkXG4gICAgICAgICMjI1xuICAgICAgICBAaW1hZ2VGb2xkZXIgPSBcIkdyYXBoaWNzL1BpY3R1cmVzXCJcbiAgICAgICAgXG4gICAgICAgICMjIypcbiAgICAgICAgKiBUaGUgdmlzaWJpbGl0eS4gSWYgPGI+ZmFsc2U8L2I+LCB0aGUgc3ByaXRlIGlzIG5vdCByZW5kZXJlZC5cbiAgICAgICAgKlxuICAgICAgICAqIEBwcm9wZXJ0eSB2aXNpYmxlXG4gICAgICAgICogQHR5cGUgYm9vbGVhblxuICAgICAgICAqIEBwcm90ZWN0ZWRcbiAgICAgICAgIyMjXG4gICAgICAgIEB2aXNpYmxlID0gbm9cblxuICAgICAgICAjIyMqXG4gICAgICAgICogSW5kaWNhdGVzIGlmIHRoZSBpbWFnZSBpcyBsb2FkZWQuXG4gICAgICAgICpcbiAgICAgICAgKiBAcHJvcGVydHkgaW1hZ2VMb2FkZWRcbiAgICAgICAgKiBAdHlwZSBib29sZWFuXG4gICAgICAgICogQHByb3RlY3RlZFxuICAgICAgICAjIyNcbiAgICAgICAgQGltYWdlTG9hZGVkID0gbm9cbiAgICAgICAgXG4gICAgICAgIGRlYnVnZ2VyXG4gICAgICAgIFxuICAgICMjIypcbiAgICAqIERpc3Bvc2VzIHRoZSBzcHJpdGUuIElmIHRoZSBzcHJpdGUgaXMgbWFuYWdlZCwgaXQgd2lsbCBiZSBhdXRvbWF0aWNhbGx5XG4gICAgKiByZW1vdmVkIGZyb20gdGhlIGdyYXBoaWNzIHN5c3RlbSBhbmQgdmlld3BvcnQuXG4gICAgKiBAbWV0aG9kIGRpc3Bvc2VcbiAgICAjIyNcbiAgICBkaXNwb3NlOiAtPiBcbiAgICAgICAgc3VwZXJcbiAgICAgICAgXG4gICAgICAgIGlmIEBzcHJpdGVcbiAgICAgICAgICAgIEBzcHJpdGUuZGlzcG9zZSgpXG4gICAgICAgICAgICBcbiAgICAgICAgICAgIGlmIEBzcHJpdGUudmlkZW9cbiAgICAgICAgICAgICAgICBAc3ByaXRlLnZpZGVvLnN0b3AoKVxuICAgICAgICAgICAgXG4gICAgICAgICAgICBpZiBub3QgQHNwcml0ZS5tYW5hZ2VkXG4gICAgICAgICAgICAgICAgQHNwcml0ZS52aWV3cG9ydD8ucmVtb3ZlR3JhcGhpY09iamVjdChAc3ByaXRlKVxuICAgICAgICAgICAgICAgIEdyYXBoaWNzLnZpZXdwb3J0Py5yZW1vdmVHcmFwaGljT2JqZWN0KEBzcHJpdGUpXG4gXG4gICAgIyMjKlxuICAgICogQWRkcyBldmVudC1oYW5kbGVycyBmb3IgbW91c2UvdG91Y2ggZXZlbnRzXG4gICAgKlxuICAgICogQG1ldGhvZCBzZXR1cEV2ZW50SGFuZGxlcnNcbiAgICAjIyMgXG4gICAgc2V0dXBFdmVudEhhbmRsZXJzOiAtPlxuICAgICAgICBAc3ByaXRlLm9uSW5kZXhDaGFuZ2UgPSA9PlxuICAgICAgICAgICAgQG9iamVjdC5ySW5kZXggPSBAc3ByaXRlLmluZGV4XG4gICAgICAgICAgICBAb2JqZWN0Lm5lZWRzVXBkYXRlID0geWVzXG4gICAgXG4gICAgIyMjKlxuICAgICogU2V0dXAgdGhlIHNwcml0ZS4gXG4gICAgKiBAbWV0aG9kIHNldHVwU3ByaXRlXG4gICAgIyMjIFxuICAgIHNldHVwU3ByaXRlOiAtPlxuICAgICAgICBpZiAhQHNwcml0ZVxuICAgICAgICAgICAgQHNwcml0ZSA9IG5ldyBncy5TcHJpdGUoR3JhcGhpY3Mudmlld3BvcnQsIG1hbmFnZWQgPyB5ZXMpXG4gICAgICAgICAgICBcbiAgICAjIyMqXG4gICAgKiBTZXR1cCB0aGUgc3ByaXRlIGNvbXBvbmVudC4gVGhpcyBtZXRob2QgaXMgYXV0b21hdGljYWxseSBjYWxsZWQgYnkgdGhlXG4gICAgKiBzeXN0ZW0uXG4gICAgKiBAbWV0aG9kIHNldHVwXG4gICAgIyMjXG4gICAgc2V0dXA6IC0+XG4gICAgICAgIEBpc1NldHVwID0geWVzXG4gICAgICAgIEBzZXR1cFNwcml0ZSgpXG4gICAgICAgIEBzZXR1cEV2ZW50SGFuZGxlcnMoKVxuICAgICAgICBAdXBkYXRlKClcbiAgICAgICAgXG4gICAgXG4gICAgIyMjKlxuICAgICogVXBkYXRlcyB0aGUgc291cmNlLSBhbmQgZGVzdGluYXRpb24tcmVjdGFuZ2xlIG9mIHRoZSBnYW1lIG9iamVjdCBzbyB0aGF0XG4gICAgKiB0aGUgYXNzb2NpYXRlZCBiaXRtYXAgZml0cyBpbi4gVGhlIGltYWdlSGFuZGxpbmcgcHJvcGVydHkgY29udHJvbHMgaG93XG4gICAgKiB0aGUgcmVjdGFuZ2xlcyBhcmUgcmVzaXplZC5cbiAgICAqIEBtZXRob2QgdXBkYXRlUmVjdFxuICAgICMjI1xuICAgIHVwZGF0ZVJlY3Q6IC0+XG4gICAgICAgIGlmIEBzcHJpdGUuYml0bWFwP1xuICAgICAgICAgICAgaWYgIUBvYmplY3QuaW1hZ2VIYW5kbGluZ1xuICAgICAgICAgICAgICAgIEBvYmplY3Quc3JjUmVjdCA9IG5ldyBSZWN0KDAsIDAsIEBzcHJpdGUuYml0bWFwLndpZHRoLCBAc3ByaXRlLmJpdG1hcC5oZWlnaHQpXG4gICAgICAgICAgICAgICAgaWYgbm90IEBvYmplY3QuZml4ZWRTaXplXG4gICAgICAgICAgICAgICAgICAgIEBvYmplY3QuZHN0UmVjdC53aWR0aCA9IEBvYmplY3Quc3JjUmVjdC53aWR0aFxuICAgICAgICAgICAgICAgICAgICBAb2JqZWN0LmRzdFJlY3QuaGVpZ2h0ID0gQG9iamVjdC5zcmNSZWN0LmhlaWdodFxuICAgICAgICAgICAgZWxzZSBpZiBAb2JqZWN0LmltYWdlSGFuZGxpbmcgPT0gMVxuICAgICAgICAgICAgICAgIEBvYmplY3Quc3JjUmVjdCA9IG5ldyBSZWN0KDAsIDAsIEBzcHJpdGUuYml0bWFwLndpZHRoLCBAc3ByaXRlLmJpdG1hcC5oZWlnaHQgLyAyKVxuICAgICAgICAgICAgICAgIGlmIG5vdCBAb2JqZWN0LmZpeGVkU2l6ZVxuICAgICAgICAgICAgICAgICAgICBAb2JqZWN0LmRzdFJlY3Qud2lkdGggPSBAb2JqZWN0LnNyY1JlY3Qud2lkdGhcbiAgICAgICAgICAgICAgICAgICAgQG9iamVjdC5kc3RSZWN0LmhlaWdodCA9IEBvYmplY3Quc3JjUmVjdC5oZWlnaHRcbiAgICAgICAgICAgIGVsc2UgaWYgQG9iamVjdC5pbWFnZUhhbmRsaW5nID09IDJcbiAgICAgICAgICAgICAgICBpZiBub3QgQG9iamVjdC5maXhlZFNpemVcbiAgICAgICAgICAgICAgICAgICAgQG9iamVjdC5kc3RSZWN0LndpZHRoID0gQG9iamVjdC5zcmNSZWN0LndpZHRoXG4gICAgICAgICAgICAgICAgICAgIEBvYmplY3QuZHN0UmVjdC5oZWlnaHQgPSBAb2JqZWN0LnNyY1JlY3QuaGVpZ2h0XG4gICAgICAgICAgICAgICAgICAgIFxuICAgICMjIypcbiAgICAqIFVwZGF0ZXMgdGhlIGJpdG1hcCBvYmplY3QgZnJvbSB0aGUgYXNzb2NpYXRlZCBpbWFnZSBuYW1lLiBUaGUgaW1hZ2VGb2xkZXJcbiAgICAqIHByb3BlcnR5IGNvbnRyb2xzIGZyb20gd2hpY2ggcmVzb3VyY2UtZm9sZGVyIHRoZSBpbWFnZSB3aWxsIGJlIGxvYWRlZC5cbiAgICAqIEBtZXRob2QgdXBkYXRlQml0bWFwXG4gICAgIyMjXG4gICAgdXBkYXRlQml0bWFwOiAtPlxuICAgICAgICBAaW1hZ2VMb2FkZWQgPSBub1xuICAgICAgICBAaW1hZ2UgPSBAb2JqZWN0LmltYWdlXG4gICAgICAgIFxuICAgICAgICBpZiBAb2JqZWN0LmltYWdlLnN0YXJ0c1dpdGgoXCJkYXRhOlwiKSB8fCBAb2JqZWN0LmltYWdlLnN0YXJ0c1dpdGgoXCIkXCIpXG4gICAgICAgICAgICBAc3ByaXRlLmJpdG1hcCA9IFJlc291cmNlTWFuYWdlci5nZXRCaXRtYXAoQG9iamVjdC5pbWFnZSlcbiAgICAgICAgZWxzZVxuICAgICAgICAgICAgQHNwcml0ZS5iaXRtYXAgPSBSZXNvdXJjZU1hbmFnZXIuZ2V0Qml0bWFwKFwiI3tAb2JqZWN0LmltYWdlRm9sZGVyfHxAaW1hZ2VGb2xkZXJ9LyN7QG9iamVjdC5pbWFnZX1cIilcbiAgICAgICAgICBcbiAgICAgICAgaWYgQHNwcml0ZS5iaXRtYXA/ICBcbiAgICAgICAgICAgIGlmIG5vdCBAaW1hZ2VMb2FkZWRcbiAgICAgICAgICAgICAgICBAaW1hZ2VMb2FkZWQgPSBAc3ByaXRlLmJpdG1hcC5sb2FkZWRcbiAgICAgICAgICAgIGVsc2VcbiAgICAgICAgICAgICAgICBkZWxldGUgQHNwcml0ZS5iaXRtYXAubG9hZGVkX1xuICAgICAgICAgICAgXG4gICAgICAgIEBvYmplY3QuYml0bWFwID0gQHNwcml0ZS5iaXRtYXBcbiAgICAgICAgXG4gICAgIyMjKlxuICAgICogVXBkYXRlcyB0aGUgdmlkZW8gb2JqZWN0IGZyb20gdGhlIGFzc29jaWF0ZWQgdmlkZW8gbmFtZS4gSXQgYWxzbyB1cGRhdGVzXG4gICAgKiB0aGUgdmlkZW8tcmVuZGVyaW5nIHByb2Nlc3MuXG4gICAgKiBAbWV0aG9kIHVwZGF0ZVZpZGVvXG4gICAgIyMjXG4gICAgdXBkYXRlVmlkZW86IC0+XG4gICAgICAgIGlmIEBvYmplY3QudmlkZW8gIT0gQHZpZGVvTmFtZVxuICAgICAgICAgICAgQHZpZGVvTmFtZSA9IEBvYmplY3QudmlkZW9cbiAgICAgICAgICAgIEBzcHJpdGUudmlkZW8gPSBSZXNvdXJjZU1hbmFnZXIuZ2V0VmlkZW8oXCJNb3ZpZXMvI3tAb2JqZWN0LnZpZGVvfVwiKVxuICAgICAgICAgICAgaWYgQHNwcml0ZS52aWRlbz9cbiAgICAgICAgICAgICAgICBpZiAkUEFSQU1TLnByZXZpZXc/LnNldHRpbmdzLm11c2ljRGlzYWJsZWRcbiAgICAgICAgICAgICAgICAgICAgQHNwcml0ZS52aWRlby52b2x1bWUgPSAwXG4gICAgICAgICAgICAgICAgQHNwcml0ZS52aWRlby5sb29wID0gQG9iamVjdC5sb29wXG4gICAgICAgICAgICAgICAgQHNwcml0ZS52aWRlby5wbGF5KClcbiAgICAgICAgICAgICAgICBcbiAgICAgICAgICAgICAgICBAb2JqZWN0LnNyY1JlY3QgPSBuZXcgUmVjdCgwLCAwLCBAc3ByaXRlLnZpZGVvLndpZHRoLCBAc3ByaXRlLnZpZGVvLmhlaWdodClcbiAgICAgICAgICAgICAgICBpZiBub3QgQG9iamVjdC5maXhlZFNpemVcbiAgICAgICAgICAgICAgICAgICAgQG9iamVjdC5kc3RSZWN0ID0gbmV3IFJlY3QoQG9iamVjdC5kc3RSZWN0LngsIEBvYmplY3QuZHN0UmVjdC55LCBAc3ByaXRlLnZpZGVvLndpZHRoLCBAc3ByaXRlLnZpZGVvLmhlaWdodClcbiAgICAgICAgICAgICAgICBcbiAgICAgICAgQHNwcml0ZS52aWRlbz8udXBkYXRlKClcbiAgICAgICAgXG4gICAgIyMjKlxuICAgICogVXBkYXRlcyB0aGUgaW1hZ2UgaWYgdGhlIGdhbWUgb2JqZWN0IGhhcyB0aGUgaW1hZ2UtcHJvcGVydHkgc2V0LlxuICAgICogQG1ldGhvZCB1cGRhdGVJbWFnZVxuICAgICMjI1xuICAgIHVwZGF0ZUltYWdlOiAtPlxuICAgICAgICBpZiBAb2JqZWN0LmltYWdlP1xuICAgICAgICAgICAgaWYgQG9iamVjdC5pbWFnZSAhPSBAaW1hZ2Ugb3IgKCFAaW1hZ2VMb2FkZWQgYW5kIEBzcHJpdGUuYml0bWFwPy5sb2FkZWQpXG4gICAgICAgICAgICAgICAgQHVwZGF0ZUJpdG1hcCgpXG4gICAgICAgICAgICAgICAgQHVwZGF0ZVJlY3QoKVxuICAgICAgICBlbHNlIGlmIEBvYmplY3QuYml0bWFwPyAgICBcbiAgICAgICAgICAgIEBzcHJpdGUuYml0bWFwID0gQG9iamVjdC5iaXRtYXBcbiAgICAgICAgZWxzZSBpZiBAb2JqZWN0LnZpZGVvPyBvciBAdmlkZW9OYW1lICE9IEBvYmplY3QudmlkZW9cbiAgICAgICAgICAgIEB1cGRhdGVWaWRlbygpXG4gICAgICAgIGVsc2VcbiAgICAgICAgICAgIEBpbWFnZSA9IG51bGxcbiAgICAgICAgICAgIEBvYmplY3QuYml0bWFwID0gbnVsbFxuICAgICAgICAgICAgQHNwcml0ZS5iaXRtYXAgPSBudWxsXG4gICAgICAgICAgICBcbiAgICAjIyMqXG4gICAgKiBJZiB0aGUgc3ByaXRlIGlzIHVubWFuYWdlZCwgdGhpcyBtZXRob2Qgd2lsbCB1cGRhdGUgdGhlIHZpc2liaWxpdHkgb2YgdGhlXG4gICAgKiBzcHJpdGUuIElmIHRoZSBzcHJpdGUgbGVhdmVzIHRoZSB2aWV3cG9ydCwgaXQgd2lsbCBiZSByZW1vdmVkIHRvIHNhdmUgXG4gICAgKiBwZXJmb3JtYW5jZSBhbmQgYXV0b21hdGljYWxseSBhZGRlZCBiYWNrIHRvIHRoZSB2aWV3cG9ydCBpZiBpdCBlbnRlcnNcbiAgICAqIHRoZSB2aWV3cG9ydC5cbiAgICAqIEBtZXRob2QgdXBkYXRlVmlzaWJpbGl0eVxuICAgICMjI1xuICAgIHVwZGF0ZVZpc2liaWxpdHk6IC0+XG4gICAgICAgIGlmICFAc3ByaXRlLm1hbmFnZWRcbiAgICAgICAgICAgIHZpc2libGUgPSBSZWN0LmludGVyc2VjdChAb2JqZWN0LmRzdFJlY3QueCtAb2JqZWN0Lm9yaWdpbi54LCBAb2JqZWN0LmRzdFJlY3QueStAb2JqZWN0Lm9yaWdpbi55LCBAb2JqZWN0LmRzdFJlY3Qud2lkdGgsIEBvYmplY3QuZHN0UmVjdC5oZWlnaHQsIFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIDAsIDAsIEdyYXBoaWNzLndpZHRoLCBHcmFwaGljcy5oZWlnaHQpXG4gICAgICAgICAgICBpZiB2aXNpYmxlIGFuZCAhQHZpc2libGVcbiAgICAgICAgICAgICAgICAoQG9iamVjdC52aWV3cG9ydCB8fCBHcmFwaGljcy52aWV3cG9ydCkuYWRkR3JhcGhpY09iamVjdChAc3ByaXRlKVxuICAgICAgICAgICAgICAgIEB2aXNpYmxlID0geWVzXG4gICAgICAgICAgICAgICAgXG4gICAgICAgICAgICBpZiAhdmlzaWJsZSBhbmQgQHZpc2libGVcbiAgICAgICAgICAgICAgICAoQG9iamVjdC52aWV3cG9ydCB8fCBHcmFwaGljcy52aWV3cG9ydCkucmVtb3ZlR3JhcGhpY09iamVjdChAc3ByaXRlKVxuICAgICAgICAgICAgICAgIEB2aXNpYmxlID0gbm9cbiAgICAgICAgICAgICAgICBcbiAgICAgIFxuICAgICMjIypcbiAgICAqIFVwZGF0ZXMgdGhlIHBhZGRpbmcuXG4gICAgKiBAbWV0aG9kIHVwZGF0ZVBhZGRpbmdcbiAgICAjIyNcbiAgICB1cGRhdGVQYWRkaW5nOiAtPlxuICAgICAgICBpZiBAb2JqZWN0LnBhZGRpbmc/XG4gICAgICAgICAgICBAc3ByaXRlLnggKz0gQG9iamVjdC5wYWRkaW5nLmxlZnRcbiAgICAgICAgICAgIEBzcHJpdGUueSArPSBAb2JqZWN0LnBhZGRpbmcudG9wXG4gICAgICAgICAgICBAc3ByaXRlLnpvb21YIC09IChAb2JqZWN0LnBhZGRpbmcubGVmdCtAb2JqZWN0LnBhZGRpbmcucmlnaHQpIC8gQG9iamVjdC5zcmNSZWN0LndpZHRoXG4gICAgICAgICAgICBAc3ByaXRlLnpvb21ZIC09IChAb2JqZWN0LnBhZGRpbmcuYm90dG9tK0BvYmplY3QucGFkZGluZy5ib3R0b20pIC8gQG9iamVjdC5zcmNSZWN0LmhlaWdodFxuICAgICBcbiAgICAjIyMqXG4gICAgKiBVcGRhdGVzIHRoZSBzcHJpdGUgcHJvcGVydGllcyBmcm9tIHRoZSBnYW1lIG9iamVjdCBwcm9wZXJ0aWVzLlxuICAgICogQG1ldGhvZCB1cGRhdGVQcm9wZXJ0aWVzXG4gICAgIyMjXG4gICAgdXBkYXRlUHJvcGVydGllczogLT5cbiAgICAgICAgQHNwcml0ZS53aWR0aCA9IEBvYmplY3QuZHN0UmVjdC53aWR0aFxuICAgICAgICBAc3ByaXRlLmhlaWdodCA9IEBvYmplY3QuZHN0UmVjdC5oZWlnaHRcbiAgICAgICAgQHNwcml0ZS54ID0gQG9iamVjdC5kc3RSZWN0LnggXG4gICAgICAgIEBzcHJpdGUueSA9IEBvYmplY3QuZHN0UmVjdC55XG4gICAgICAgIEBzcHJpdGUubWFzayA9IEBvYmplY3QubWFzayA/IEBtYXNrXG4gICAgICAgIEBzcHJpdGUuYW5nbGUgPSBAb2JqZWN0LmFuZ2xlIHx8IDBcbiAgICAgICAgQHNwcml0ZS5vcGFjaXR5ID0gQG9iamVjdC5vcGFjaXR5ID8gMjU1XG4gICAgICAgIEBzcHJpdGUuY2xpcFJlY3QgPSBAb2JqZWN0LmNsaXBSZWN0XG4gICAgICAgIEBzcHJpdGUuc3JjUmVjdCA9IEBvYmplY3Quc3JjUmVjdFxuICAgICAgICBAc3ByaXRlLmJsZW5kaW5nTW9kZSA9IEBvYmplY3QuYmxlbmRNb2RlIHx8IDBcbiAgICAgICAgQHNwcml0ZS5taXJyb3IgPSBAb2JqZWN0Lm1pcnJvclxuICAgICAgICBAc3ByaXRlLnZpc2libGUgPSBAb2JqZWN0LnZpc2libGUgYW5kICghQG9iamVjdC5wYXJlbnQgb3IgIUBvYmplY3QucGFyZW50LnZpc2libGU/IG9yIEBvYmplY3QucGFyZW50LnZpc2libGUpXG4gICAgICAgIEBzcHJpdGUub3ggPSAtQG9iamVjdC5vcmlnaW4ueFxuICAgICAgICBAc3ByaXRlLm95ID0gLUBvYmplY3Qub3JpZ2luLnlcbiAgICAgICAgQHNwcml0ZS56ID0gKEBvYmplY3QuekluZGV4IHx8IDApICsgKGlmICFAb2JqZWN0LnBhcmVudCB0aGVuIDAgZWxzZSBAb2JqZWN0LnBhcmVudC56SW5kZXggfHwgMClcbiAgICAgICAgXG4gICAgIyMjKlxuICAgICogVXBkYXRlcyB0aGUgb3B0aW9uYWwgc3ByaXRlIHByb3BlcnRpZXMgZnJvbSB0aGUgZ2FtZSBvYmplY3QgcHJvcGVydGllcy5cbiAgICAqIEBtZXRob2QgdXBkYXRlT3B0aW9uYWxQcm9wZXJ0aWVzXG4gICAgIyMjXG4gICAgdXBkYXRlT3B0aW9uYWxQcm9wZXJ0aWVzOiAtPlxuICAgICAgICBpZiBAb2JqZWN0LnRvbmU/XG4gICAgICAgICAgICBAc3ByaXRlLnRvbmUgPSBAb2JqZWN0LnRvbmVcbiAgICAgICAgaWYgQG9iamVjdC5jb2xvcj9cbiAgICAgICAgICAgIEBzcHJpdGUuY29sb3IgPSBAb2JqZWN0LmNvbG9yXG4gICAgICAgIGlmIEBvYmplY3Qudmlld3BvcnQ/XG4gICAgICAgICAgICBAc3ByaXRlLnZpZXdwb3J0ID0gQG9iamVjdC52aWV3cG9ydFxuICAgICAgICBpZiBAb2JqZWN0LmVmZmVjdHM/XG4gICAgICAgICAgICBAc3ByaXRlLmVmZmVjdHMgPSBAb2JqZWN0LmVmZmVjdHNcbiAgICAgICAgaWYgQG9iamVjdC5hbmNob3I/XG4gICAgICAgICAgICBAc3ByaXRlLmFuY2hvci54ID0gQG9iamVjdC5hbmNob3IueFxuICAgICAgICAgICAgQHNwcml0ZS5hbmNob3IueSA9IEBvYmplY3QuYW5jaG9yLnlcbiAgICAgICAgaWYgQG9iamVjdC5wb3NpdGlvbkFuY2hvcj9cbiAgICAgICAgICAgIEBzcHJpdGUucG9zaXRpb25BbmNob3IgPSBAb2JqZWN0LnBvc2l0aW9uQW5jaG9yXG4gICAgICAgIGlmIEBvYmplY3Quem9vbT9cbiAgICAgICAgICAgIEBzcHJpdGUuem9vbVggPSBAb2JqZWN0Lnpvb20ueFxuICAgICAgICAgICAgQHNwcml0ZS56b29tWSA9IEBvYmplY3Quem9vbS55XG4gICAgICAgIGlmIEBvYmplY3QubW90aW9uQmx1cj9cbiAgICAgICAgICAgIEBzcHJpdGUubW90aW9uQmx1ciA9IEBvYmplY3QubW90aW9uQmx1clxuICAgICAgICBcbiAgICAjIyMqXG4gICAgKiBVcGRhdGVzIHRoZSBzcHJpdGUgY29tcG9uZW50IGJ5IHVwZGF0aW5nIGl0cyB2aXNpYmlsaXR5LCBpbWFnZSwgcGFkZGluZyBhbmRcbiAgICAqIHByb3BlcnRpZXMuXG4gICAgKiBAbWV0aG9kIHVwZGF0ZVxuICAgICMjI1xuICAgIHVwZGF0ZTogLT5cbiAgICAgICAgc3VwZXJcbiAgICAgICAgXG4gICAgICAgIEBzZXR1cCgpIGlmIG5vdCBAaXNTZXR1cFxuICAgICAgICBAdXBkYXRlVmlzaWJpbGl0eSgpXG4gICAgICAgIEB1cGRhdGVJbWFnZSgpXG4gICAgICAgIEB1cGRhdGVQcm9wZXJ0aWVzKClcbiAgICAgICAgQHVwZGF0ZU9wdGlvbmFsUHJvcGVydGllcygpXG4gICAgICAgIEB1cGRhdGVQYWRkaW5nKClcbiAgICAgICAgXG4gICAgICAgIEBvYmplY3QuckluZGV4ID0gQHNwcml0ZS5pbmRleFxuICAgICAgICBAc3ByaXRlLnVwZGF0ZSgpXG4gICAgICAgIFxuXG4jIyMqXG4qIEVudW1lcmF0aW9uIG9mIGFwcGVhcmFuY2UgYW5pbWF0aW9ucy4gXG4qXG4qIEBtb2R1bGUgZ3NcbiogQGNsYXNzIEFuaW1hdGlvblR5cGVzXG4qIEBzdGF0aWNcbiogQG1lbWJlcm9mIGdzXG4jIyNcbmNsYXNzIEFuaW1hdGlvblR5cGVzXG4gICAgQGluaXRpYWxpemU6IC0+ICAgIFxuICAgICAgICAjIyMqXG4gICAgICAgICogQW4gb2JqZWN0IGFwcGVhcnMgb3IgZGlzYXBwZWFycyBieSBtb3ZpbmcgaW50byBvciBvdXQgb2YgdGhlIHNjcmVlbi5cbiAgICAgICAgKiBAcHJvcGVydHkgTU9WRU1FTlRcbiAgICAgICAgKiBAdHlwZSBudW1iZXJcbiAgICAgICAgKiBAc3RhdGljXG4gICAgICAgICogQGZpbmFsXG4gICAgICAgICMjI1xuICAgICAgICBATU9WRU1FTlQgPSAwXG4gICAgICAgICMjIypcbiAgICAgICAgKiBBbiBvYmplY3QgYXBwZWFycyBvciBkaXNhcHBlYXJzIHVzaW5nIGFscGhhLWJsZW5kaW5nLlxuICAgICAgICAqIEBwcm9wZXJ0eSBCTEVORElOR1xuICAgICAgICAqIEB0eXBlIG51bWJlclxuICAgICAgICAqIEBzdGF0aWNcbiAgICAgICAgKiBAZmluYWxcbiAgICAgICAgIyMjXG4gICAgICAgIEBCTEVORElORyA9IDFcbiAgICAgICAgIyMjKlxuICAgICAgICAqIEFuIG9iamVjdCBhcHBlYXJzIG9yIGRpc2FwcGVhcnMgdXNpbmcgYSBtYXNrLWltYWdlLlxuICAgICAgICAqIEBwcm9wZXJ0eSBNQVNLSU5HXG4gICAgICAgICogQHR5cGUgbnVtYmVyXG4gICAgICAgICogQHN0YXRpY1xuICAgICAgICAqIEBmaW5hbFxuICAgICAgICAjIyNcbiAgICAgICAgQE1BU0tJTkcgPSAyXG5cbkFuaW1hdGlvblR5cGVzLmluaXRpYWxpemUoKSAgICBcbmdzLkFuaW1hdGlvblR5cGVzID0gQW5pbWF0aW9uVHlwZXNcbmdzLkNvbXBvbmVudF9TcHJpdGUgPSBDb21wb25lbnRfU3ByaXRlXG4iXX0=
//# sourceURL=Component_Sprite_59.js