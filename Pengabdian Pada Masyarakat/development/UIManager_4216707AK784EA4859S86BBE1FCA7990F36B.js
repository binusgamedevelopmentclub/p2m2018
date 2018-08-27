var Formula, Space, Style, UIManager;

Formula = (function() {

  /**
  * Encapsulates a UI formula. A formula can be used in UI layouts to define
  * property-bindings or to implement a specific behavior.
  *
  * @module ui
  * @class Formula
  * @memberof ui
  * @constructor
  * @param {Function} f - The formula-function. Defines the logic of the formula.
  * @param {Object} data - An optional data-object which can be accessed inside the formula-function.
  * @param {string} event - An optional event-name to define when the formula should be executed.
   */
  function Formula(f, data, event) {

    /**
    * Indicates if its the first time the formula is called.
    * @property onInitialize
    * @type boolean
     */
    var i, j, l, ref, ref1;
    this.onInitialize = true;

    /**
    * The formula-function.
    * @property exec_
    * @type Function
     */
    this.exec_ = f;

    /**
    * An optional data-object which can bes accessed inside the formula-function.
    * @property data
    * @type Object
     */
    this.data = data;

    /**
    * An optional event-name to define when the formula should be executed.
    * @property event
    * @type string
     */
    this.event = event;

    /**
    * An array of custom number-data which can be used for different purposes. The first element
    * is also used in onChange method to store the old value and check against the new one to detect a change.
    * @property numbers
    * @type number[]
     */
    this.numbers = new Array(10);
    for (i = j = 0, ref = this.numbers.length; 0 <= ref ? j <= ref : j >= ref; i = 0 <= ref ? ++j : --j) {
      this.numbers[i] = 0;
    }

    /**
    * An array of custom string-data which can be used for different purposes. The first element
    * is also used in onTextChange method to store the old value and check against the new one to detect a change.
    * @property strings
    * @type string[]
     */
    this.strings = new Array(10);
    for (i = l = 0, ref1 = this.strings.length; 0 <= ref1 ? l <= ref1 : l >= ref1; i = 0 <= ref1 ? ++l : --l) {
      this.strings[i] = "";
    }
  }


  /**
  * The formula-function. Its a wrapper-function before the first-time call was made.
  * @method exec
   */

  Formula.prototype.exec = function() {
    var r;
    this.exec = this.exec_;
    r = this.exec_.apply(this, arguments);
    this.onInitialize = false;
    return r;
  };


  /**
  * Checks if the specified number-value has changed since the last check. It uses
  * the first entry of the numbers-array to store the value and check against the new one.
  *
  * @method onChange
  * @param {number} numberValue - Number value to check.
   */

  Formula.prototype.onChange = function(numberValue) {
    var result;
    result = this.numbers[0] !== numberValue;
    this.numbers[0] = numberValue;
    return result;
  };


  /**
  * Checks if the specified text-value has changed since the last check. It uses
  * the first entry of the strings-array to store the value and check against the new one.
  *
  * @method onTextChange
  * @param {string} textValue - Text value to check.
   */

  Formula.prototype.onTextChange = function(textValue) {
    var result;
    result = this.strings[0] !== textValue;
    this.strings[0] = textValue;
    return result;
  };

  return Formula;

})();

ui.Formula = Formula;

Space = (function() {

  /**
  * Describes a space inside or around something like a margin or padding.
  *
  * @module ui
  * @class Space
  * @memberof ui
  * @constructor
  * @param {number} left - Space at the left in pixels.
  * @param {number} top - Space at the top in pixels.
  * @param {number} right - Space at the right in pixels.
  * @param {number} bottom - Space at the bottom in pixels.
   */
  function Space(left, top, right, bottom) {

    /**
    * Space at the left in pixels.
    * @property left
    * @type number
     */
    this.left = left;

    /**
    * Space at the top in pixels.
    * @property top
    * @type number
     */
    this.top = top;

    /**
    * Space at the right in pixels.
    * @property right
    * @type number
     */
    this.right = right;

    /**
    * Space at the bottom in pixels.
    * @property bottom
    * @type number
     */
    this.bottom = bottom;
  }


  /**
  * Sets the coordinates of the space by copying them from a specified space.
  *
  * @method setFromObject
  * @param {Object} space - A space to copy.
   */

  Space.prototype.setFromObject = function(space) {
    this.left = space.left;
    this.top = space.top;
    this.right = space.right;
    return this.bottom = space.bottom;
  };


  /**
  * Sets the coordinates of the space.
  *
  * @method set
  * @param {number} left - Space at the left in pixels.
  * @param {number} top - Space at the top in pixels.
  * @param {number} right - Space at the right in pixels.
  * @param {number} bottom - Space at the bottom in pixels.
   */

  Space.prototype.set = function(left, top, right, bottom) {
    this.left = left;
    this.top = top;
    this.right = right;
    return this.bottom = bottom;
  };


  /**
  * Creates a new space object from an array of coordinates.
  *
  * @method fromArray
  * @static
  * @param {number[]} array - An array of coordinates (left, top right, bottom).
   */

  Space.fromArray = function(array) {
    return new ui.Space(array[0], array[1], array[2], array[3]);
  };

  return Space;

})();

ui.Space = Space;

Style = (function() {

  /**
  * A UI style can applied to a UI object to modify it properties like color, image, etc. to give a certain "style" to it.
  *
  * @module ui
  * @class Style
  * @memberof ui
  * @constructor
  * @param {Object} descriptor - A style-descriptor to initialize the style from.
  * @param {number} id - A unique numeric ID to access the style through UIManager.stylesById collection.
  * @param {number} selector - A selector ID which controls under which conditions the styles will be applied.
   */
  function Style(descriptor, id, selector) {

    /**
    * ID number to quickly access this style and link to this style.
    * @property id
    * @type number
     */
    this.id = id;

    /**
    * Style-ID of target object. This style will only be applied on UI objects with that style ID which are
    * children of UI objects where this style is applied.
    * @property target
    * @type number
     */
    this.target = -1;

    /**
    * Selector-ID which controls under which conditions the style becomes active.
    * @property selector
    * @type number
     */
    this.selector = selector;

    /**
    * The font used for the text-display.
    * @default null
    * @property font
    * @type gs.Font
     */
    this.font = null;

    /**
    * The UI object's image used for visual presentation.
    * @property image
    * @type string
     */
    this.image = null;

    /**
    * The UI object's animations used for visual presentation.
    * @default null
    * @property animations
    * @type Object[]
     */
    this.animations = null;

    /**
    * The UI object's color.
    * @property color
    * @type gs.Color
     */
    this.color = null;

    /**
    * The UI object's tone.
    * @property tone
    * @type gs.Tone
     */
    this.tone = null;

    /**
    * The UI object's anchor-point. For example: An anchor-point with 0,0 places the object with its top-left corner
    * at its position but with an 0.5, 0.5 anchor-point the object is placed with its center. An anchor-point of 1,1
    * places the object with its lower-right corner.
    * @property anchor
    * @type gs.Point
     */
    this.anchor = null;

    /**
    * The UI object's zoom-setting for x and y axis.
    * @default new gs.Point(1.0, 1.0)
    * @property zoom
    * @type gs.Point
     */
    this.zoom = null;

    /**
    * The UI object's margin. The margin defines an extra space around the UI object. 
    * The default is { left: 0, top: 0, right: 0, bottom: 0 }.
    * @property margin
    * @type Object
     */
    this.margin = null;

    /**
    * The UI object's padding. The default is { left: 0, top: 0, right: 0, bottom: 0 }.
    * @property padding
    * @type Object
     */
    this.padding = null;

    /**
    * The UI object's mask for masking-effects.
    * @property mask
    * @type gs.Mask
     */
    this.mask = null;

    /**
    * The UI object's alignment.
    * @property alignment
    * @type ui.Alignment
     */
    this.alignment = -1;

    /**
    * The UI object's opacity to control transparency. For example: 0 = Transparent, 255 = Opaque, 128 = Semi-Transparent.
    * @property opacity
    * @type number
     */
    this.opacity = -1;

    /**
    * The object's clip-rect for visual presentation.
    * @default null
    * @property clipRect
    * @type gs.Rect
    * @protected
     */
    this.clipRect = null;

    /**
    * The corner-size of the frame.
    * @property frameCornerSize
    * @type number
     */
    this.frameCornerSize = -1;

    /**
    * The thickness of the frame.
    * @property frameThickness
    * @type number
     */
    this.frameThickness = -1;

    /**
    * The looping of the image.
    * @property looping
    * @type ui.Orientation
     */
    this.looping = null;

    /**
    * The object's z-index controls rendering-order/image-overlapping. An object with a smaller z-index is rendered
    * before an object with a larger index. For example: To make sure a game object is always on top of the screen, it
    * should have the largest z-index of all game objects.
    * @property zIndex
    * @type number
     */
    this.zIndex = -1;

    /**
    * The object's alignment on x-axis. Needs to be supported by layout.
    * @property alignmentX
    * @type number
     */
    this.alignmentX = -1;

    /**
    * The object's alignment on y-axis. Needs to be supported by layout.
    * @property alignmentY
    * @type number
     */
    this.alignmentY = -1;

    /**
    * The object's resize behavior.
    * @property resizable
    * @type boolean
     */
    this.resizable = null;

    /**
    * The original style descriptor.
    * @property descriptor
    * @type Object
     */
    this.descriptor = descriptor;
    if (descriptor) {
      this.setFromDescriptor(descriptor);
    }
  }


  /**
  * Initializes the style from a style-descriptor.
  *
  * @method setFromDescriptor
  * @param {Object} descriptor - The style-descriptor.
   */

  Style.prototype.setFromDescriptor = function(descriptor) {
    this.descriptor = descriptor;
    this.image = descriptor.image;
    if (descriptor.color) {
      this.color = gs.Color.fromArray(descriptor.color);
    }
    if (descriptor.tone) {
      this.tone = gs.Tone.fromArray(descriptor.tone);
    }
    if (descriptor.anchor) {
      this.anchor = new gs.Point(descriptor.anchor[0], descriptor.anchor[1]);
    }
    if (descriptor.zoom) {
      this.zoom = new gs.Point(descriptor.zoom[0], descriptor.zoom[1]);
    }
    if (descriptor.font) {
      this.setupFont(descriptor);
    }
    if (descriptor.clipRect) {
      this.clipRect = gs.Rect.fromArray(descriptor.clipRect);
    }
    if (descriptor.opacity >= 0) {
      this.opacity = descriptor.opacity;
    }
    if (descriptor.alignment >= 0) {
      this.alignment = descriptor.alignment;
    }
    if (descriptor.margin) {
      this.margin = ui.Space.fromArray(descriptor.margin);
    }
    if (descriptor.padding) {
      this.padding = ui.Space.fromArray(descriptor.padding);
    }
    this.animations = descriptor.animations;
    if (descriptor.frameCornerSize) {
      this.frameCornerSize = descriptor.frameCornerSize;
    }
    if (descriptor.frameThickness) {
      this.frameThickness = descriptor.frameThickness;
    }
    if (descriptor.frame) {
      this.frame = descriptor.frame;
    }
    if (descriptor.looping) {
      this.looping = descriptor.looping;
    }
    if (descriptor.resizable != null) {
      this.resizable = descriptor.resizable;
    }
    if (descriptor.zIndex) {
      this.zIndex = descriptor.zIndex;
    }
    if (descriptor.alignmentX) {
      this.alignmentX = ui.UIManager.alignments[descriptor.alignmentX];
    }
    if (descriptor.alignmentY) {
      return this.alignmentY = ui.UIManager.alignments[descriptor.alignmentY];
    }
  };

  Style.prototype.set = function(style) {
    this.image = style.image;
    this.color.setFromObject(style.color);
    this.tone.setFromObject(style.tone);
    this.anchor.set(style.anchor.x, style.anchor.y);
    this.zoom.set(style.zoom.x, style.zoom.y);
    if (style.font) {
      if (!this.font) {
        this.font = new gs.Font(style.font.name, style.font.size);
      }
      this.font.set(style.font);
    }
    if (style.clipRect) {
      if (!this.clipRect) {
        this.clipRect = new gs.Rect();
      }
      this.clipRect.setFromObject(style.clipRect);
    }
    this.opacity = style.opacitz;
    this.alignment = style.alignment;
    this.margin.setFromObject(style.margin);
    return this.padding.setFromObject(style.padding);
  };


  /**
  * Initializes font-data from a style-descriptor.
  *
  * @method setupFont
  * @param {Object} descriptor - The style-descriptor.
  * @protected
   */

  Style.prototype.setupFont = function(descriptor) {
    var ref, ref1, ref10, ref2, ref3, ref4, ref5, ref6, ref7, ref8, ref9;
    if (descriptor.font) {
      if (!this.font) {
        this.font = new Font(descriptor.font.name, (ref = descriptor.font.size) != null ? ref : 0);
      } else {
        this.font.name = descriptor.font.name;
        this.font.size = (ref1 = descriptor.font.size) != null ? ref1 : 0;
      }
      this.font.bold = (ref2 = descriptor.font.bold) != null ? ref2 : this.font.bold;
      this.font.italic = (ref3 = descriptor.font.italic) != null ? ref3 : this.font.italic;
      this.font.smallCaps = (ref4 = descriptor.font.smallCaps) != null ? ref4 : this.font.smallCaps;
      this.font.underline = (ref5 = descriptor.font.underline) != null ? ref5 : this.font.underline;
      this.font.strikeThrough = (ref6 = descriptor.font.strikeThrough) != null ? ref6 : this.font.strikeThrough;
      if (descriptor.font.color != null) {
        this.font.color.setFromArray(descriptor.font.color);
      }
      if (descriptor.font.border != null) {
        this.font.border = (ref7 = descriptor.font.border) != null ? ref7 : false;
        this.font.borderSize = (ref8 = descriptor.font.borderSize) != null ? ref8 : 4;
        this.font.borderColor.set(0, 0, 0, 255);
      }
      if (descriptor.font.outline != null) {
        this.font.border = (ref9 = descriptor.font.outline) != null ? ref9 : false;
        this.font.borderSize = (ref10 = descriptor.font.outline.size) != null ? ref10 : 4;
        if (descriptor.font.outline.color != null) {
          return this.font.borderColor.setFromArray(descriptor.font.outline.color);
        } else {
          return this.font.borderColor.set(0, 0, 0, 255);
        }
      }
    }
  };


  /**
  * Applies the style to a UI object.
  *
  * @method apply
  * @param {ui.Object_UIElement} object - The UI object where the style should be applied to.
   */

  Style.prototype.apply = function(object) {
    var ref, ref1;
    if (!object.activeStyles.contains(this)) {
      object.activeStyles.push(this);
      if (this.font) {
        if ((ref = object.font) != null) {
          ref.set(this.font);
        }
      }
      if (this.color) {
        object.color.set(this.color);
      }
      if (this.tone) {
        if ((ref1 = object.tone) != null) {
          ref1.set(this.tone);
        }
      }
      if (this.image) {
        object.image = this.image;
      }
      if (this.anchor) {
        object.anchor.set(this.anchor.x, this.anchor.y);
      }
      if (this.zoom) {
        object.zoom.set(this.zoom.x, this.zoom.y);
      }
      if (this.padding) {
        object.padding.setFromObject(this.padding);
      }
      if (this.margin) {
        object.margin.setFromObject(this.margin);
      }
      if (this.opacity >= 0) {
        object.opacity = this.opacity;
      }
      if (this.alignment >= 0) {
        object.alignment = this.alignment;
      }
      if (this.frameThickness >= 0) {
        object.frameThickness = this.frameThickness;
      }
      if (this.frameCornerSize >= 0) {
        object.frameCornerSize = this.frameCornerSize;
      }
      if (this.mask) {
        object.mask.set(this.mask);
      }
      if (this.zIndex >= 0) {
        object.zIndex = this.zIndex;
      }
      if (this.alignmentX >= 0) {
        object.alignmentX = this.alignmentX;
      }
      if (this.alignmentY >= 0) {
        object.alignmentY = this.alignmentY;
      }
      if (this.resizable != null) {
        object.resizable = this.resizable;
      }
      this.applyLooping(object);
      return this.applyAnimations(object);
    }
  };


  /**
  * Applies the looping-data of the style to a UI object.
  *
  * @method applyLooping
  * @param {ui.Object_UIElement} object - The UI object where the looping-data should be applied to.
  * @protected
   */

  Style.prototype.applyLooping = function(object) {
    if (this.looping) {
      if (!object.visual.looping) {
        object.visual.dispose();
        object.removeComponent(object.visual);
        object.visual = new gs.Component_TilingSprite();
        object.addComponent(object.visual);
      }
      object.visual.looping.vertical = this.looping.vertical;
      return object.visual.looping.horizontal = this.looping.horizontal;
    }
  };


  /**
  * Applies the animation-data of the style to a UI object. This automatically adds an animation-handler
  * component(ui.Component_AnimationHandler) with the id "animationHandler" to the UI object if not already exists.
  *
  * @method applyAnimations
  * @param {ui.Object_UIElement} object - The UI object where the animation-data should be applied to.
  * @protected
   */

  Style.prototype.applyAnimations = function(object) {
    if (this.animations) {
      object.animations = Object.deepCopy(this.animations);
      if (!object.findComponentById("animationHandler")) {
        object.animationExecutor = new ui.Component_AnimationExecutor();
        object.addComponent(new ui.Component_AnimationHandler(), "animationHandler");
        return object.addComponent(object.animationExecutor, "animationExecutor");
      }
    }
  };


  /**
  * Reverts the changes from a UI object made by this style. However, this resets all styleable properties
  * were set by this style. So it is necessary to apply all other styles again, but that is already handles in
  * ui.Component_UIBehavior.
  *
  * @method revert
  * @param {ui.Object_UIElement} object - The UI object where the style should be reverted.
   */

  Style.prototype.revert = function(object) {
    var activeStyles, i1, j, j1, k1, l, l1, m1, n, o, p, q, ref, ref1, s, t, u, w, x, y, z;
    activeStyles = object.activeStyles;
    if (object.activeStyles.contains(this)) {
      object.activeStyles.remove(this);
      if (this.font) {
        object.font.set(gs.Fonts.TEXT);
        for (j = activeStyles.length - 1; j >= 0; j += -1) {
          s = activeStyles[j];
          if (s.font) {
            object.font.set(s.font);
            break;
          }
        }
      }
      if (this.color) {
        object.color.set(Color.WHITE);
        for (l = activeStyles.length - 1; l >= 0; l += -1) {
          s = activeStyles[l];
          if (s.color) {
            object.color.set(s.color);
            break;
          }
        }
      }
      if (this.tone) {
        if ((ref = object.tone) != null) {
          ref.set(0, 0, 0, 0);
        }
        for (n = activeStyles.length - 1; n >= 0; n += -1) {
          s = activeStyles[n];
          if (s.tone) {
            if ((ref1 = object.tone) != null) {
              ref1.set(s.tone);
            }
            break;
          }
        }
      }
      if (this.image) {
        object.image = null;
        for (o = activeStyles.length - 1; o >= 0; o += -1) {
          s = activeStyles[o];
          if (s.image) {
            object.image = s.image;
            break;
          }
        }
      }
      if (this.anchor) {
        object.anchor.set(0, 0);
        for (p = activeStyles.length - 1; p >= 0; p += -1) {
          s = activeStyles[p];
          if (s.anchor) {
            object.anchor.setFromObject(s.anchor);
            break;
          }
        }
      }
      if (this.zoom) {
        object.zoom.set(1.0, 1.0);
        for (q = activeStyles.length - 1; q >= 0; q += -1) {
          s = activeStyles[q];
          if (s.zoom) {
            object.zoom.setFromObject(s.zoom);
            break;
          }
        }
      }
      if (this.padding) {
        object.padding.set(0, 0, 0, 0);
        for (t = activeStyles.length - 1; t >= 0; t += -1) {
          s = activeStyles[t];
          if (s.padding) {
            object.padding.setFromObject(s.padding);
            break;
          }
        }
      }
      if (this.margin) {
        object.margin.set(0, 0, 0, 0);
        for (u = activeStyles.length - 1; u >= 0; u += -1) {
          s = activeStyles[u];
          if (s.margin) {
            object.margin.setFromObject(s.margin);
            break;
          }
        }
      }
      if (this.opacity >= 0) {
        object.opacity = 255;
        for (w = activeStyles.length - 1; w >= 0; w += -1) {
          s = activeStyles[w];
          if (s.opacity >= 0) {
            object.opacity = s.opacity;
            break;
          }
        }
      }
      if (this.alignment >= 0) {
        object.alignment = 0;
        for (x = activeStyles.length - 1; x >= 0; x += -1) {
          s = activeStyles[x];
          if (s.alignment >= 0) {
            object.alignment = s.alignment;
            break;
          }
        }
      }
      if (this.frameCornerSize >= 0) {
        object.frameCornerSize = 16;
        for (y = activeStyles.length - 1; y >= 0; y += -1) {
          s = activeStyles[y];
          if (s.frameCornerSize >= 0) {
            object.frameCornerSize = s.frameCornerSize;
            break;
          }
        }
      }
      if (this.frameThickness >= 0) {
        object.frameThickness = 16;
        for (z = activeStyles.length - 1; z >= 0; z += -1) {
          s = activeStyles[z];
          if (s.frameThickness >= 0) {
            object.frameThickness = s.frameThickness;
            break;
          }
        }
      }
      if (this.mask) {
        object.mask.set(null);
        for (i1 = activeStyles.length - 1; i1 >= 0; i1 += -1) {
          s = activeStyles[i1];
          if (s.mask) {
            object.mask.set(s.font);
            break;
          }
        }
      }
      if (this.zIndex >= 0) {
        object.zIndex = 0;
        for (j1 = activeStyles.length - 1; j1 >= 0; j1 += -1) {
          s = activeStyles[j1];
          if (s.zIndex >= 0) {
            object.zIndex = s.zIndex;
            break;
          }
        }
      }
      if (this.alignmentX >= 0) {
        object.alignmentX = 0;
        for (k1 = activeStyles.length - 1; k1 >= 0; k1 += -1) {
          s = activeStyles[k1];
          if (s.alignmentX >= 0) {
            object.alignmentX = s.alignmentX;
            break;
          }
        }
      }
      if (this.alignmentY >= 0) {
        object.alignmentY = 0;
        for (l1 = activeStyles.length - 1; l1 >= 0; l1 += -1) {
          s = activeStyles[l1];
          if (s.alignmentY >= 0) {
            object.alignmentY = s.alignmentY;
            break;
          }
        }
      }
      if (this.resizable != null) {
        object.resizable = false;
        for (m1 = activeStyles.length - 1; m1 >= 0; m1 += -1) {
          s = activeStyles[m1];
          if (s.resizable != null) {
            object.resizable = s.resizable;
            break;
          }
        }
      }
      this.revertAnimations(object);
      return this.revertLooping(object);
    }
  };


  /**
  * Reverts the animation-data changes applied to a UI object by this style.
  *
  * @method revertAnimations
  * @param {ui.Object_UIElement} object - The UI object where the animation-data changes should be reverted.
   */

  Style.prototype.revertAnimations = function(object) {
    var activeStyles, j, results, s;
    activeStyles = object.activeStyles;
    if (this.animations) {
      object.animations = null;
      results = [];
      for (j = activeStyles.length - 1; j >= 0; j += -1) {
        s = activeStyles[j];
        if (s.animations) {
          object.animations = Object.deepCopy(s.animations);
          if (!object.findComponentById("animationHandler")) {
            results.push(object.addComponent(new ui.Component_AnimationHandler(), "animationHandler"));
          } else {
            results.push(void 0);
          }
        } else {
          results.push(void 0);
        }
      }
      return results;
    }
  };


  /**
  * Reverts the looping-data changes applied to a UI object by this style.
  *
  * @method revertLooping
  * @param {ui.Object_UIElement} object - The UI object where the looping-data changes should be reverted.
   */

  Style.prototype.revertLooping = function(object) {
    var activeStyles, j, results, s;
    activeStyles = object.activeStyles;
    if (this.looping) {
      object.visual.looping.vertical = false;
      object.visual.looping.horizontal = false;
      results = [];
      for (j = activeStyles.length - 1; j >= 0; j += -1) {
        s = activeStyles[j];
        if (s.looping) {
          if (!object.visual.looping) {
            object.visual.dispose();
            object.removeComponent(object.visual);
            object.visual = new gs.Component_TilingSprite();
            object.addComponent(object.visual);
          }
          object.visual.looping.vertical = s.looping.vertical;
          results.push(object.visual.looping.horizontal = s.looping.horizontal);
        } else {
          results.push(void 0);
        }
      }
      return results;
    }
  };

  return Style;

})();

ui.Style = Style;

UIManager = (function() {

  /**
  * Handles the creation of In Game UI elements. For more information about
  * In-Game UI see help file.
  *
  * @module ui
  * @class UIManager
  * @memberof ui
  * @constructor
   */
  function UIManager() {

    /**
    * Stores all registered UI layouts by name/id.
    * @property layouts
    * @type Object
     */
    this.layouts = {};

    /**
    * Stores all registered UI styles by name/id.
    * @property styles
    * @type Object
     */
    this.styles = {};

    /**
    * Stores all UI styles by number id.
    * @property stylesById
    * @type ui.Style[]
     */
    this.stylesById = new Array();

    /**
    * Stores all UI styles by style-name.
    * @property stylesByName
    * @type Object
     */
    this.stylesByName = {};

    /**
    * Stores all registered custom UI types/templates by name/id.
    * @property customTypes
    * @type Object
     */
    this.customTypes = {};

    /**
    * Stores all registered UI controllers by name/id.
    * @property customTypes
    * @type Object
     */
    this.controllers = {};

    /**
    * Stores all registered UI data sources by name/id.
    * @property customTypes
    * @type Object
     */
    this.dataSources = {};

    /**
    * Mapping to table to map alignment names to number values.
    * @property alignments
    * @type Object
    * @protected
     */
    this.alignments = {
      "left": 0,
      "top": 0,
      "center": 1,
      "bottom": 2,
      "right": 2,
      "0": 0,
      "1": 1,
      "2": 2
    };

    /**
    * Mapping to table to map blend-mode names to number values.
    * @property blendModes
    * @type Object
    * @protected
     */
    this.blendModes = {
      "normal": 0,
      "add": 1,
      "sub": 2
    };

    /**
    * Mapping to table to map selector names to number values.
    * @property selectors
    * @type Object
     */
    this.selectors = {
      normal: 0,
      hover: 1,
      selected: 2,
      enabled: 3,
      focused: 4
    };
    this.defaultPlaceholderParams = {};
  }


  /**
  * Sets up UI Manager, optimizes styles, etc.
  *
  * @method setup
   */

  UIManager.prototype.setup = function() {
    return this.setupStyles();
  };


  /**
  * Sets up the UI styles by wrapping them into ui.Style objects and optimizing the access.
  *
  * @method setupStyles
  * @protected
   */

  UIManager.prototype.setupStyles = function() {
    var id, k, ref, selector, selectorMap, subs;
    id = 0;
    selectorMap = this.selectors;
    for (k in this.styles) {
      subs = k.split(" ");
      selector = subs[0].split(":");
      if (selectorMap[selector[1]]) {
        this.stylesById[id] = new ui.Style(this.styles[k], id, selectorMap[selector[1]]);
      } else {
        this.stylesById[id] = new ui.Style(this.styles[k], id, 0);
      }
      if (!this.stylesByName[selector[0]]) {
        this.stylesByName[selector[0]] = [];
      }
      this.stylesByName[selector[0]].push(this.stylesById[id]);
      this.styles[k] = this.stylesById[id];
      id++;
    }
    for (k in this.styles) {
      subs = k.split(" ");
      if (subs.length > 1) {
        this.stylesByName[subs[1]].push(this.styles[k]);
        this.styles[k].target = (ref = this.styles[k.split(":")[0]]) != null ? ref.id : void 0;
      }
    }
    return null;
  };


  /**
  * Executes all placeholder formulas in the specified descriptor. The descriptor will be changed
  * and placeholder formulas are replaced with their evaluated result value.
  *
  * @method executePlaceholderFormulas
  * @param {Object} descriptor - The descriptor.
  * @param {Object} params - Object containing the placeholder params.
  * @protected
   */

  UIManager.prototype.executePlaceholderFormulas = function(descriptor, id, params) {
    var c, i, j, k, keys, l, len, len1, v;
    if (descriptor == null) {
      return;
    }
    keys = Object.keys(descriptor);
    for (j = 0, len = keys.length; j < len; j++) {
      k = keys[j];
      v = descriptor[k];
      if (v != null) {
        if (v instanceof Array) {
          for (c = l = 0, len1 = v.length; l < len1; c = ++l) {
            i = v[c];
            if (i != null) {
              if (typeof i === "object") {
                this.executePlaceholderFormulas(i, id, params);
              } else if (c !== "exec" && typeof i === "function") {
                window.p = params || this.defaultPlaceholderParams;
                window.d = descriptor;
                v[c] = i();
              }
            }
          }
        } else if (typeof v === "object") {
          this.executePlaceholderFormulas(v, id, params);
        } else if (k !== "exec_" && typeof v === "function") {
          window.p = params || this.defaultPlaceholderParams;
          window.d = descriptor;
          descriptor[k] = v();
        }
      }
    }
    return null;
  };


  /**
  * Creates a calculation for a specified expression.
  *
  * @method createCalcFunction
  * @param {String} expression - The expression to create a calculation function for.
  * @return {Function} The calculation function.
  * @protected
   */

  UIManager.prototype.createCalcFunction = function(expression) {
    expression = expression.replace(/([0-9]+)%/gm, "($1 / 100 * v)");
    return eval("(function(v){ return " + expression + "})");
  };


  /**
  * Creates an object from the specified object type. The type has the format
  * <namespace>.<typename> like vn.Component_Hotspot.
  *
  * @method createObject
  * @param {String} type - The type name.
  * @return {Object} The created object.
  * @protected
   */

  UIManager.prototype.createObject = function(type) {
    var subs;
    subs = type.split(".");
    return new window[subs[0]][subs[1]]();
  };


  /**
  * Creates an UI object from a specified UI descriptor.
  *
  * @method createFromDescriptor
  * @param {Object} descriptor - The UI object descriptor.
  * @param {gs.Object_UIElement} parent - The UI parent object. (A layout for example).
  * @return {gs.Object_UIElement} The created UI object.
   */

  UIManager.prototype.createFromDescriptor = function(descriptor, parent) {
    var control, k;
    control = null;
    for (k in this.controllers) {
      if (this.controllers[k].type != null) {
        this.controllers[k] = this.createObject(this.controllers[k].type);
      }
    }
    return this._createFromDescriptor(descriptor, parent);
  };


  /**
  * Creates an image button UI object.
  *
  * @method createImageButton
  * @param {Object} descriptor - The UI object descriptor.
  * @return {gs.Object_UIElement} The created image button UI object.
   */

  UIManager.prototype.createImageButton = function(descriptor) {
    var control;
    control = new ui.Object_Hotspot(descriptor.image, descriptor.imageHandling);
    control.behavior.sound = descriptor.sound;
    control.behavior.sounds = descriptor.sounds;
    control.image = descriptor.image;
    control.images = descriptor.images;
    if (descriptor.imageFolder != null) {
      control.imageFolder = descriptor.imageFolder;
    }
    if (descriptor.looping != null) {
      control.visual.dispose();
      control.removeComponent(control.visual);
      control.visual = new gs.Component_TilingSprite();
      control.addComponent(control.visual);
      control.visual.looping.vertical = descriptor.looping.vertical;
      control.visual.looping.horizontal = descriptor.looping.horizontal;
    }
    if (descriptor.color != null) {
      control.color = Color.fromArray(descriptor.color);
    }
    return control;
  };


  /**
  * Creates an image UI object.
  *
  * @method createImage
  * @param {Object} descriptor - The UI object descriptor.
  * @return {gs.Object_UIElement} The created image button UI object.
   */

  UIManager.prototype.createImage = function(descriptor) {
    var control;
    control = new ui.Object_Image(descriptor.image, descriptor.imageHandling);
    if (descriptor.imageFolder != null) {
      control.imageFolder = descriptor.imageFolder;
    }
    if (descriptor.looping != null) {
      control.visual.dispose();
      control.removeComponent(control.visual);
      control.visual = new gs.Component_TilingSprite();
      control.addComponent(control.visual);
      control.visual.looping.vertical = descriptor.looping.vertical;
      control.visual.looping.horizontal = descriptor.looping.horizontal;
    }
    if (descriptor.color != null) {
      control.color = Color.fromArray(descriptor.color);
    }
    return control;
  };


  /**
  * Creates an image map UI object.
  *
  * @method createImageMap
  * @param {Object} descriptor - The UI object descriptor.
  * @return {gs.Object_UIElement} The created image button UI object.
   */

  UIManager.prototype.createImageMap = function(descriptor) {
    var control;
    control = new ui.Object_ImageMap();
    control.hotspots = (descriptor.hotspots || []).select(function(h) {
      return {
        x: h.rect[0],
        y: h.rect[1],
        size: {
          width: h.rect[2],
          height: h.rect[3]
        },
        data: {
          action: 3,
          actions: h.actions
        }
      };
    });
    control.images = descriptor.images;
    control.insertComponent(new ui.Component_ActionHandler(), 1, "actionHandler");
    control.target = SceneManager.scene.behavior;
    return control;
  };


  /**
  * Creates a video UI object.
  *
  * @method createVideo
  * @param {Object} descriptor - The UI object descriptor.
  * @return {gs.Object_UIElement} The created image button UI object.
   */

  UIManager.prototype.createVideo = function(descriptor) {
    var control, ref;
    control = new ui.Object_Video();
    control.video = descriptor.video;
    control.loop = (ref = descriptor.loop) != null ? ref : true;
    return control;
  };


  /**
  * Creates a panel UI object.
  *
  * @method createPanel
  * @param {Object} descriptor - The UI object descriptor.
  * @return {gs.Object_UIElement} The created image button UI object.
   */

  UIManager.prototype.createPanel = function(descriptor) {
    var control, ref;
    control = new ui.Object_Panel();
    control.modal = (ref = descriptor.modal) != null ? ref : false;
    if (descriptor.color != null) {
      control.color = Color.fromArray(descriptor.color);
    }
    return control;
  };


  /**
  * Creates a frame UI object.
  *
  * @method createFrame
  * @param {Object} descriptor - The UI object descriptor.
  * @return {gs.Object_UIElement} The created image button UI object.
   */

  UIManager.prototype.createFrame = function(descriptor) {
    var control;
    control = new ui.Object_Frame(descriptor.frameSkin);
    control.frameThickness = descriptor.frameThickness || 16;
    control.frameCornerSize = descriptor.frameCornerSize || 16;
    control.image = descriptor.image;
    control.images = descriptor.images;
    return control;
  };


  /**
  * Creates a three-part image UI object.
  *
  * @method createThreePartImage
  * @param {Object} descriptor - The UI object descriptor.
  * @return {gs.Object_UIElement} The created image button UI object.
   */

  UIManager.prototype.createThreePartImage = function(descriptor) {
    var control;
    control = new ui.Object_ThreePartImage(descriptor.frameSkin);
    control.firstPartSize = descriptor.firstPartSize || 16;
    control.middlePartSize = descriptor.middlePartSize || 1;
    control.lastPartSize = descriptor.lastPartSize || 16;
    control.image = descriptor.image;
    control.images = descriptor.images;
    return control;
  };


  /**
  * Creates a text UI object.
  *
  * @method createText
  * @param {Object} descriptor - The UI object descriptor.
  * @return {gs.Object_UIElement} The created image button UI object.
   */

  UIManager.prototype.createText = function(descriptor) {
    var control, ref;
    control = new ui.Object_Text();
    control.text = lcs(descriptor.text);
    control.sizeToFit = descriptor.sizeToFit;
    control.formatting = descriptor.formatting;
    control.wordWrap = (ref = descriptor.wordWrap) != null ? ref : false;
    control.behavior.format = descriptor.format;
    if (descriptor.textPadding) {
      control.behavior.padding = ui.Space.fromArray(descriptor.textPadding);
    }
    if (descriptor.resolvePlaceholders != null) {
      control.resolvePlaceholders = descriptor.resolvePlaceholders;
    }
    if (descriptor.color != null) {
      control.color = Color.fromArray(descriptor.color);
    }
    return control;
  };


  /**
  * Creates a free-layout UI object.
  *
  * @method createFreeLayout
  * @param {Object} descriptor - The UI object descriptor.
  * @return {gs.Object_UIElement} The created image button UI object.
   */

  UIManager.prototype.createFreeLayout = function(descriptor) {
    var control;
    if (descriptor.frame != null) {
      control = new ui.Object_FreeLayout(descriptor.frame[0] || 0, descriptor.frame[1] || 0, descriptor.frame[2] || 1, descriptor.frame[3] || 1);
    } else {
      control = new ui.Object_FreeLayout(0, 0, 1, 1);
    }
    control.sizeToFit = descriptor.sizeToFit;
    return control;
  };


  /**
  * Creates a stack-layout UI object.
  *
  * @method createStackLayout
  * @param {Object} descriptor - The UI object descriptor.
  * @return {gs.Object_UIElement} The created image button UI object.
   */

  UIManager.prototype.createStackLayout = function(descriptor) {
    var control;
    if (descriptor.frame != null) {
      control = new ui.Object_StackLayout(descriptor.frame[0] || 0, descriptor.frame[1] || 0, descriptor.frame[2] || 1, descriptor.frame[3] || 1, descriptor.orientation);
    } else {
      control = new ui.Object_StackLayout(0, 0, 1, 1, descriptor.orientation);
    }
    control.sizeToFit = descriptor.sizeToFit;
    return control;
  };


  /**
  * Creates a spread-layout UI object.
  *
  * @method createSpreadLayout
  * @param {Object} descriptor - The UI object descriptor.
  * @return {gs.Object_UIElement} The created image button UI object.
   */

  UIManager.prototype.createSpreadLayout = function(descriptor) {
    var control;
    if (descriptor.frame != null) {
      control = new ui.Object_SpreadLayout(descriptor.frame[0] || 0, descriptor.frame[1] || 0, descriptor.frame[2] || 1, descriptor.frame[3] || 1, descriptor.orientation);
    } else {
      control = new ui.Object_SpreadLayout(0, 0, 1, 1, descriptor.orientation);
    }
    return control;
  };


  /**
  * Creates a grid-layout UI object.
  *
  * @method createGridLayout
  * @param {Object} descriptor - The UI object descriptor.
  * @return {gs.Object_UIElement} The created image button UI object.
   */

  UIManager.prototype.createGridLayout = function(descriptor) {
    var control;
    if (descriptor.frame != null) {
      control = new ui.Object_GridLayout(descriptor.frame[0], descriptor.frame[1], descriptor.frame[2], descriptor.frame[3], descriptor.rows, descriptor.columns, descriptor.template);
    } else {
      control = new ui.Object_GridLayout(0, 0, 1, 1, descriptor.rows, descriptor.columns, descriptor.template);
    }
    control.cellSpacing = descriptor.cellSpacing || [0, 0, 0, 0];
    control.sizeToFit = descriptor.sizeToFit;
    return control;
  };


  /**
  * Creates a message UI object.
  *
  * @method createMessage
  * @param {Object} descriptor - The UI object descriptor.
  * @return {gs.Object_UIElement} The created image button UI object.
   */

  UIManager.prototype.createMessage = function(descriptor) {
    var control;
    control = new ui.Object_Message();
    return control;
  };


  /**
  * Creates a data-grid UI object.
  *
  * @method createDataGrid
  * @param {Object} descriptor - The UI object descriptor.
  * @return {gs.Object_UIElement} The created image button UI object.
   */

  UIManager.prototype.createDataGrid = function(descriptor) {
    var control;
    control = new ui.Object_DataGrid(descriptor);
    return control;
  };


  /**
  * Creates an UI object depending on the object-type of the specified UI descriptor.
  *
  * @method createControl
  * @param {Object} descriptor - The UI object descriptor.
  * @return {gs.Object_UIElement} The created UI object.
  * @protected
   */

  UIManager.prototype.createControl = function(descriptor) {
    var control;
    control = null;
    switch (descriptor.type) {
      case "ui.ImageButton":
        control = this.createImageButton(descriptor);
        break;
      case "ui.Image":
        control = this.createImage(descriptor);
        break;
      case "ui.ImageMap":
        control = this.createImageMap(descriptor);
        break;
      case "ui.Video":
        control = this.createVideo(descriptor);
        break;
      case "ui.Panel":
        control = this.createPanel(descriptor);
        break;
      case "ui.Frame":
        control = this.createFrame(descriptor);
        break;
      case "ui.ThreePartImage":
        control = this.createThreePartImage(descriptor);
        break;
      case "ui.Text":
        control = this.createText(descriptor);
        break;
      case "ui.Message":
        control = this.createMessage(descriptor);
        break;
      case "ui.DataGrid":
        control = this.createDataGrid(descriptor);
        break;
      case "ui.FreeLayout":
        control = this.createFreeLayout(descriptor);
        break;
      case "ui.StackLayout":
        control = this.createStackLayout(descriptor);
        break;
      case "ui.SpreadLayout":
        control = this.createSpreadLayout(descriptor);
        break;
      case "ui.GridLayout":
        control = this.createGridLayout(descriptor);
    }
    return control;
  };

  UIManager.prototype.createLayoutRect = function(frame, control) {
    var ref, ref1, ref2, ref3, ref4, ref5, ref6, ref7;
    if (!control.layoutRect) {
      control.layoutRect = new ui.LayoutRect();
    }
    control.layoutRect.set(0, 0, 0, 0);
    if (frame != null) {
      if (((ref = frame[0]) != null ? ref.length : void 0) != null) {
        control.layoutRect.x = this.createCalcFunction(frame[0]);
        control.dstRect.x = 0;
      } else {
        control.dstRect.x = (ref1 = descriptor.frame[0]) != null ? ref1 : control.dstRect.x;
      }
      if (((ref2 = frame[1]) != null ? ref2.length : void 0) != null) {
        control.layoutRect.y = this.createCalcFunction(frame[1]);
        control.dstRect.y = 0;
      } else {
        control.dstRect.y = (ref3 = frame[1]) != null ? ref3 : control.dstRect.y;
      }
      if (((ref4 = frame[2]) != null ? ref4.length : void 0) != null) {
        control.layoutRect.width = this.createCalcFunction(frame[2]);
        control.dstRect.width = 1;
      } else {
        control.dstRect.width = (ref5 = frame[2]) != null ? ref5 : control.dstRect.width;
      }
      if (((ref6 = frame[3]) != null ? ref6.length : void 0) != null) {
        control.layoutRect.height = this.createCalcFunction(frame[3]);
        return control.dstRect.height = 1;
      } else {
        return control.dstRect.height = (ref7 = frame[3]) != null ? ref7 : control.dstRect.height;
      }
    }
  };


  /**
  * Adds the styles defined in an array of style-names to the specified control.
  *
  * @method addControlStyles
  * @param {Object} control - The control to add the styles to.
  * @param {string[]} styles - Array of style-names to add.
   */

  UIManager.prototype.addControlStyles = function(control, styles) {
    var j, len, results, style, styleName;
    results = [];
    for (j = 0, len = styles.length; j < len; j++) {
      styleName = styles[j];
      if (this.stylesByName[styleName] != null) {
        results.push((function() {
          var l, len1, ref, results1;
          ref = this.stylesByName[styleName];
          results1 = [];
          for (l = 0, len1 = ref.length; l < len1; l++) {
            style = ref[l];
            control.styles.push(style);
            if (style.target === -1 && style.selector === 0) {
              results1.push(style.apply(control));
            } else {
              results1.push(void 0);
            }
          }
          return results1;
        }).call(this));
      } else {
        results.push(void 0);
      }
    }
    return results;
  };


  /**
  * Creates an UI object from a specified UI descriptor. This method is called
  * recursively for all child-descriptors.
  *
  * @method createControlFromDescriptor
  * @param {Object} descriptor - The UI object descriptor.
  * @param {gs.Object_UIElement} parent - The UI parent object. (A layout for example).
  * @param {number} index - The index.
  * @return {gs.Object_UIElement} The created UI object.
  * @protected
   */

  UIManager.prototype.createControlFromDescriptor = function(descriptor, parent, index) {
    var action, actions, bindings, c, child, childControl, component, control, controls, customFields, data, formulas, i, isNumber, item, j, l, len, len1, len2, len3, m, n, o, p, ref, ref1, ref10, ref11, ref12, ref13, ref14, ref15, ref16, ref17, ref18, ref19, ref2, ref20, ref21, ref22, ref23, ref24, ref25, ref26, ref27, ref3, ref4, ref5, ref6, ref7, ref8, ref9, style, target, type, typeName, valid;
    control = null;
    if (descriptor.style != null) {
      descriptor.styles = [descriptor.style];
      delete descriptor.style;
    }
    descriptor = Object.deepCopy(descriptor);
    this.executePlaceholderFormulas(descriptor, descriptor.id, descriptor.params);
    control = this.createControl(descriptor);
    if (control == null) {
      type = Object.deepCopy(this.customTypes[descriptor.type]);
      this.executePlaceholderFormulas(type, descriptor.id, descriptor.params);
      typeName = type.type;
      customFields = type.customFields;
      bindings = type.bindings;
      formulas = type.formulas;
      actions = type.actions;
      if (type.style != null) {
        type.styles = [type.style];
        type.style = null;
      }
      Object.mixin(type, descriptor);
      if (customFields != null) {
        Object.mixin(type.customFields, customFields);
      }
      if ((bindings != null) && bindings !== type.bindings) {
        type.bindings = type.bindings.concat(bindings);
      }
      if ((formulas != null) && formulas !== type.formulas) {
        type.formulas = type.formulas.concat(formulas);
      }
      if ((actions != null) && actions !== type.actions) {
        type.actions = actions.concat(type.actions);
      }
      type.type = typeName;
      return this.createControlFromDescriptor(type, parent);
    } else if (parent != null) {
      parent.addObject(control);
      control.index = index;
    } else {
      gs.ObjectManager.current.addObject(control);
    }
    control.ui = new ui.Component_UIBehavior();
    control.addComponent(control.ui);
    control.params = descriptor.params;
    if (descriptor.updateBehavior === "continuous") {
      control.updateBehavior = ui.UpdateBehavior.CONTINUOUS;
    }
    if (descriptor.inheritProperties) {
      control.inheritProperties = true;
    }
    if (descriptor.font != null) {
      control.font = new Font(descriptor.font.name, descriptor.font.size);
      control.font.bold = (ref = descriptor.font.bold) != null ? ref : control.font.bold;
      control.font.italic = (ref1 = descriptor.font.italic) != null ? ref1 : control.font.italic;
      control.font.smallCaps = (ref2 = descriptor.font.smallCaps) != null ? ref2 : control.font.smallCaps;
      control.font.underline = (ref3 = descriptor.font.underline) != null ? ref3 : control.font.underline;
      control.font.strikeThrough = (ref4 = descriptor.font.strikeThrough) != null ? ref4 : control.font.strikeThrough;
      if (descriptor.font.color != null) {
        control.font.color = Color.fromArray(descriptor.font.color);
      }
      if (descriptor.font.border != null) {
        control.font.border = (ref5 = descriptor.font.border) != null ? ref5 : false;
        control.font.borderSize = (ref6 = descriptor.font.borderSize) != null ? ref6 : 4;
        control.font.borderColor = new Color(0, 0, 0);
      }
      if (descriptor.font.outline != null) {
        control.font.border = (ref7 = descriptor.font.outline) != null ? ref7 : false;
        control.font.borderSize = (ref8 = descriptor.font.outline.size) != null ? ref8 : 4;
        if (descriptor.font.outline.color != null) {
          control.font.borderColor = Color.fromArray(descriptor.font.outline.color);
        } else {
          control.font.borderColor = new Color(0, 0, 0);
        }
      }
    }
    if (descriptor.components != null) {
      ref9 = descriptor.components;
      for (j = 0, len = ref9.length; j < len; j++) {
        c = ref9[j];
        m = c.module || "gs";
        component = new window[m][c.type](c.params);
        control.addComponent(component, c.id);
        control[c.id] = component;
      }
    }
    control.focusable = (ref10 = descriptor.focusable) != null ? ref10 : control.focusable;
    if (descriptor.nextKeyObject) {
      control.ui.nextKeyObjectId = descriptor.nextKeyObject;
    }
    if (descriptor.initialFocus) {
      control.ui.focus();
    }
    actions = Object.deepCopy(descriptor.action != null ? [descriptor.action] : descriptor.actions);
    if (actions != null) {
      for (l = 0, len1 = actions.length; l < len1; l++) {
        action = actions[l];
        if (action != null) {
          action.event = (ref11 = action.event) != null ? ref11 : "onAccept";
          if (action.target == null) {
            target = this.controllers != null ? this.controllers[descriptor.target] : controller;
            action.target = target || SceneManager.scene.behavior;
          }
        }
      }
      control.actions = actions;
      if (!control.findComponentById("actionHandler")) {
        control.insertComponent(new ui.Component_ActionHandler(), 1, "actionHandler");
      }
    }
    if (descriptor.id != null) {
      control.id = descriptor.id;
      gs.ObjectManager.current.setObjectById(control, control.id);
    }
    control.descriptor = descriptor;
    control.layoutRect = new Rect();
    control.layoutRect.set(0, 0, 0, 0);
    if (descriptor.frame != null) {
      if (((ref12 = descriptor.frame[0]) != null ? ref12.length : void 0) != null) {
        control.layoutRect.x = this.createCalcFunction(descriptor.frame[0]);
        control.dstRect.x = 0;
      } else {
        control.dstRect.x = (ref13 = descriptor.frame[0]) != null ? ref13 : control.dstRect.x;
      }
      if (((ref14 = descriptor.frame[1]) != null ? ref14.length : void 0) != null) {
        control.layoutRect.y = this.createCalcFunction(descriptor.frame[1]);
        control.dstRect.y = 0;
      } else {
        control.dstRect.y = (ref15 = descriptor.frame[1]) != null ? ref15 : control.dstRect.y;
      }
      if (((ref16 = descriptor.frame[2]) != null ? ref16.length : void 0) != null) {
        control.layoutRect.width = this.createCalcFunction(descriptor.frame[2]);
        control.dstRect.width = 1;
      } else {
        control.dstRect.width = (ref17 = descriptor.frame[2]) != null ? ref17 : control.dstRect.width;
      }
      if (((ref18 = descriptor.frame[3]) != null ? ref18.length : void 0) != null) {
        control.layoutRect.height = this.createCalcFunction(descriptor.frame[3]);
        control.dstRect.height = 1;
      } else {
        control.dstRect.height = (ref19 = descriptor.frame[3]) != null ? ref19 : control.dstRect.height;
      }
    }
    if (descriptor.sizeToParent != null) {
      control.sizeToParent = descriptor.sizeToParent;
    }
    if (descriptor.blendMode != null) {
      control.blendMode = this.blendModes[descriptor.blendMode];
    }
    if (descriptor.anchor != null) {
      control.anchor.set(descriptor.anchor[0], descriptor.anchor[1]);
    }
    control.opacity = (ref20 = descriptor.opacity) != null ? ref20 : 255;
    if (descriptor.minimumSize != null) {
      control.minimumSize = {
        width: descriptor.minimumSize[0],
        height: descriptor.minimumSize[1]
      };
    }
    if (descriptor.resizable != null) {
      control.resizable = descriptor.resizable;
    }
    if (descriptor.scrollable != null) {
      control.scrollable = descriptor.scrollable;
    }
    if (descriptor.fixedSize != null) {
      control.fixedSize = descriptor.fixedSize;
    }
    if (descriptor.draggable != null) {
      control.draggable = descriptor.draggable;
      control.draggable.step = 0;
      if (control.draggable.rect != null) {
        control.draggable.rect = Rect.fromArray(control.draggable.rect);
      }
      control.addComponent(new ui.Component_Draggable());
    }
    if (descriptor.bindings != null) {
      control.bindings = descriptor.bindings;
      control.insertComponent(new ui.Component_BindingHandler(), 0);
    }
    if (descriptor.formulas != null) {
      control.formulas = descriptor.formulas;
      control.insertComponent(new ui.Component_FormulaHandler(), 0);
    }
    control.dataField = descriptor.dataField;
    control.enabled = (ref21 = descriptor.enabled) != null ? ref21 : true;
    if (descriptor.selectable != null) {
      control.selectable = descriptor.selectable;
    }
    if (descriptor.group != null) {
      control.group = descriptor.group;
      gs.ObjectManager.current.addToGroup(control, control.group);
    }
    if (descriptor.customFields != null) {
      control.customFields = Object.deepCopy(descriptor.customFields);
    }
    if (descriptor.margin != null) {
      control.margin.left = descriptor.margin[0];
      control.margin.top = descriptor.margin[1];
      control.margin.right = descriptor.margin[2];
      control.margin.bottom = descriptor.margin[3];
    }
    if (descriptor.padding != null) {
      control.padding.left = descriptor.padding[0];
      control.padding.top = descriptor.padding[1];
      control.padding.right = descriptor.padding[2];
      control.padding.bottom = descriptor.padding[3];
    }
    if (descriptor.alignment != null) {
      control.alignment = this.alignments[descriptor.alignment];
    }
    control.alignmentY = this.alignments[descriptor.alignmentY || 0];
    control.alignmentX = this.alignments[descriptor.alignmentX || 0];
    control.zIndex = descriptor.zIndex || 0;
    control.order = descriptor.order || 0;
    control.chainOrder = ((ref22 = descriptor.chainOrder) != null ? ref22 : descriptor.zOrder) + ((parent != null ? parent.chainOrder : void 0) || 0);
    if (descriptor.zoom != null) {
      control.zoom = {
        x: descriptor.zoom[0] / 100,
        y: descriptor.zoom[1] / 100
      };
    }
    if (descriptor.visible != null) {
      control.visible = descriptor.visible;
    }
    if (descriptor.clipRect) {
      control.clipRect = new Rect(control.dstRect.x, control.dstRect.y, control.dstRect.width, control.dstRect.height);
    }
    if (descriptor.styles != null) {
      this.addControlStyles(control, descriptor.styles);
    }
    if (descriptor.template != null) {
      control.behavior.managementMode = ui.LayoutManagementMode.fromString(descriptor.managementMode);
      data = ui.Component_FormulaHandler.fieldValue(control, control.dataField);
      isNumber = typeof data === "number";
      if (data != null) {
        for (i = n = 0, ref23 = (ref24 = data.length) != null ? ref24 : data; 0 <= ref23 ? n < ref23 : n > ref23; i = 0 <= ref23 ? ++n : --n) {
          if ((data[i] != null) || isNumber) {
            valid = true;
            if ((descriptor.dataFilter != null) && !isNumber) {
              valid = ui.Component_Handler.checkCondition(data[i], descriptor.dataFilter);
            }
            if (valid || isNumber) {
              child = this.createControlFromDescriptor(descriptor.template, control, i);
              if ((ref25 = data[i]) != null ? ref25.dstRect : void 0) {
                child.dstRect = ui.UIElementRectangle.fromRect(child, data[i].dstRect);
              }
              if ((child.clipRect == null) && (control.clipRect != null)) {
                child.clipRect = control.clipRect;
              }
              control.addObject(child);
              child.index = i;
              child.order = ((ref26 = data.length) != null ? ref26 : data) - i;
              control.controls.push(child);
            }
          }
        }
      }
    }
    if (descriptor.controls && descriptor.controls.exec) {
      controls = ui.Component_FormulaHandler.fieldValue(descriptor, descriptor.controls);
    } else {
      controls = descriptor.controls;
    }
    if (controls != null) {
      for (i = o = 0, len2 = controls.length; o < len2; i = ++o) {
        item = controls[i];
        childControl = this._createFromDescriptor(item, control, i);
        if ((childControl.clipRect == null) && (control.clipRect != null)) {
          childControl.clipRect = control.clipRect;
        }
        childControl.index = i;
        childControl.origin.x = control.origin.x + control.dstRect.x;
        childControl.origin.y = control.origin.y + control.dstRect.y;
        control.addObject(childControl);
        control.controls.push(childControl);
      }
    }
    if (control.styles && control.parentsByStyle) {
      parent = control.parent;
      while (parent) {
        if (parent.styles) {
          ref27 = parent.styles;
          for (p = 0, len3 = ref27.length; p < len3; p++) {
            style = ref27[p];
            if (!control.parentsByStyle[style.id]) {
              control.parentsByStyle[style.id] = [];
            }
            control.parentsByStyle[style.id].push(parent);
          }
        }
        parent = parent.parent;
      }
    }
    if (descriptor.animations != null) {
      control.animations = Object.deepCopy(descriptor.animations);
      control.animationExecutor = new ui.Component_AnimationExecutor();
      control.addComponent(control.animationExecutor);
      control.addComponent(new ui.Component_AnimationHandler());
    }
    control.ui.updateStyle();
    control.setup();
    return control;
  };


  /**
  * Creates an UI object from a specified UI descriptor.
  *
  * @method _createFromDescriptor
  * @param {Object} descriptor - The UI object descriptor.
  * @param {gs.Object_UIElement} parent - The UI parent object. (A layout for example).
  * @return {gs.Object_UIElement} The created UI object.
  * @protected
   */

  UIManager.prototype._createFromDescriptor = function(descriptor, parent, index) {
    var control, controller;
    control = this.createControlFromDescriptor(descriptor, parent, index);
    if (descriptor.controller != null) {
      controller = this.controllers[descriptor.controller];
      control.controller = controller;
      control.addComponent(controller);
    }
    return control;
  };

  UIManager.prototype.createLayoutFromDescriptor = function(descriptor, parent, index) {
    return this._createFromDescriptor(descriptor, parent, index);
  };

  return UIManager;

})();

Graphics.width = $PARAMS.resolution.width;

Graphics.height = $PARAMS.resolution.height;

ui.UiFactory = new UIManager();

ui.UIManager = ui.UiFactory;

//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQVFBLElBQUE7O0FBQU07O0FBQ0Y7Ozs7Ozs7Ozs7OztFQVlhLGlCQUFDLENBQUQsRUFBSSxJQUFKLEVBQVUsS0FBVjs7QUFDVDs7Ozs7QUFBQSxRQUFBO0lBS0EsSUFBQyxDQUFBLFlBQUQsR0FBZ0I7O0FBRWhCOzs7OztJQUtBLElBQUMsQ0FBQSxLQUFELEdBQVM7O0FBRVQ7Ozs7O0lBS0EsSUFBQyxDQUFBLElBQUQsR0FBUTs7QUFFUjs7Ozs7SUFLQSxJQUFDLENBQUEsS0FBRCxHQUFTOztBQUVUOzs7Ozs7SUFNQSxJQUFDLENBQUEsT0FBRCxHQUFlLElBQUEsS0FBQSxDQUFNLEVBQU47QUFDZixTQUF5Qiw4RkFBekI7TUFBQSxJQUFDLENBQUEsT0FBUSxDQUFBLENBQUEsQ0FBVCxHQUFjO0FBQWQ7O0FBRUE7Ozs7OztJQU1BLElBQUMsQ0FBQSxPQUFELEdBQWUsSUFBQSxLQUFBLENBQU0sRUFBTjtBQUNmLFNBQTBCLG1HQUExQjtNQUFBLElBQUMsQ0FBQSxPQUFRLENBQUEsQ0FBQSxDQUFULEdBQWM7QUFBZDtFQTdDUzs7O0FBZ0RiOzs7OztvQkFJQSxJQUFBLEdBQU0sU0FBQTtBQUNILFFBQUE7SUFBQSxJQUFDLENBQUEsSUFBRCxHQUFRLElBQUMsQ0FBQTtJQUNULENBQUEsR0FBSSxJQUFDLENBQUEsS0FBSyxDQUFDLEtBQVAsQ0FBYSxJQUFiLEVBQW1CLFNBQW5CO0lBQ0osSUFBQyxDQUFBLFlBQUQsR0FBZ0I7QUFFaEIsV0FBTztFQUxKOzs7QUFPTjs7Ozs7Ozs7b0JBT0EsUUFBQSxHQUFVLFNBQUMsV0FBRDtBQUNOLFFBQUE7SUFBQSxNQUFBLEdBQVMsSUFBQyxDQUFBLE9BQVEsQ0FBQSxDQUFBLENBQVQsS0FBZTtJQUN4QixJQUFDLENBQUEsT0FBUSxDQUFBLENBQUEsQ0FBVCxHQUFjO0FBRWQsV0FBTztFQUpEOzs7QUFNVjs7Ozs7Ozs7b0JBT0Es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QyxVQUFELEVBQWEsTUFBYixFQUFxQixLQUFyQjtXQUN4QixJQUFDLENBQUEscUJBQUQsQ0FBdUIsVUFBdkIsRUFBbUMsTUFBbkMsRUFBMkMsS0FBM0M7RUFEd0I7Ozs7OztBQUtoQyxRQUFRLENBQUMsS0FBVCxHQUFpQixPQUFPLENBQUMsVUFBVSxDQUFDOztBQUNwQyxRQUFRLENBQUMsTUFBVCxHQUFrQixPQUFPLENBQUMsVUFBVSxDQUFDOztBQUNyQyxFQUFFLENBQUMsU0FBSCxHQUFtQixJQUFBLFNBQUEsQ0FBQTs7QUFDbkIsRUFBRSxDQUFDLFNBQUgsR0FBZSxFQUFFLENBQUMiLCJzb3VyY2VzQ29udGVudCI6WyIjID09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT1cbiNcbiMgICBTY3JpcHQ6IFVJTWFuYWdlclxuI1xuIyAgICQkQ09QWVJJR0hUJCRcbiNcbiMgPT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PVxuXG5jbGFzcyBGb3JtdWxhXG4gICAgIyMjKlxuICAgICogRW5jYXBzdWxhdGVzIGEgVUkgZm9ybXVsYS4gQSBmb3JtdWxhIGNhbiBiZSB1c2VkIGluIFVJIGxheW91dHMgdG8gZGVmaW5lXG4gICAgKiBwcm9wZXJ0eS1iaW5kaW5ncyBvciB0byBpbXBsZW1lbnQgYSBzcGVjaWZpYyBiZWhhdmlvci5cbiAgICAqXG4gICAgKiBAbW9kdWxlIHVpXG4gICAgKiBAY2xhc3MgRm9ybXVsYVxuICAgICogQG1lbWJlcm9mIHVpXG4gICAgKiBAY29uc3RydWN0b3JcbiAgICAqIEBwYXJhbSB7RnVuY3Rpb259IGYgLSBUaGUgZm9ybXVsYS1mdW5jdGlvbi4gRGVmaW5lcyB0aGUgbG9naWMgb2YgdGhlIGZvcm11bGEuXG4gICAgKiBAcGFyYW0ge09iamVjdH0gZGF0YSAtIEFuIG9wdGlvbmFsIGRhdGEtb2JqZWN0IHdoaWNoIGNhbiBiZSBhY2Nlc3NlZCBpbnNpZGUgdGhlIGZvcm11bGEtZnVuY3Rpb24uXG4gICAgKiBAcGFyYW0ge3N0cmluZ30gZXZlbnQgLSBBbiBvcHRpb25hbCBldmVudC1uYW1lIHRvIGRlZmluZSB3aGVuIHRoZSBmb3JtdWxhIHNob3VsZCBiZSBleGVjdXRlZC5cbiAgICAjIyNcbiAgICBjb25zdHJ1Y3RvcjogKGYsIGRhdGEsIGV2ZW50KSAtPlxuICAgICAgICAjIyMqXG4gICAgICAgICogSW5kaWNhdGVzIGlmIGl0cyB0aGUgZmlyc3QgdGltZSB0aGUgZm9ybXVsYSBpcyBjYWxsZWQuXG4gICAgICAgICogQHByb3BlcnR5IG9uSW5pdGlhbGl6ZVxuICAgICAgICAqIEB0eXBlIGJvb2xlYW5cbiAgICAgICAgIyMjXG4gICAgICAgIEBvbkluaXRpYWxpemUgPSB5ZXNcbiAgICAgICAgXG4gICAgICAgICMjIypcbiAgICAgICAgKiBUaGUgZm9ybXVsYS1mdW5jdGlvbi5cbiAgICAgICAgKiBAcHJvcGVydHkgZXhlY19cbiAgICAgICAgKiBAdHlwZSBGdW5jdGlvblxuICAgICAgICAjIyNcbiAgICAgICAgQGV4ZWNfID0gZlxuICAgICAgICAgXG4gICAgICAgICMjIypcbiAgICAgICAgKiBBbiBvcHRpb25hbCBkYXRhLW9iamVjdCB3aGljaCBjYW4gYmVzIGFjY2Vzc2VkIGluc2lkZSB0aGUgZm9ybXVsYS1mdW5jdGlvbi5cbiAgICAgICAgKiBAcHJvcGVydHkgZGF0YVxuICAgICAgICAqIEB0eXBlIE9iamVjdFxuICAgICAgICAjIyMgICBcbiAgICAgICAgQGRhdGEgPSBkYXRhXG4gICAgICAgIFxuICAgICAgICAjIyMqXG4gICAgICAgICogQW4gb3B0aW9uYWwgZXZlbnQtbmFtZSB0byBkZWZpbmUgd2hlbiB0aGUgZm9ybXVsYSBzaG91bGQgYmUgZXhlY3V0ZWQuXG4gICAgICAgICogQHByb3BlcnR5IGV2ZW50XG4gICAgICAgICogQHR5cGUgc3RyaW5nXG4gICAgICAgICMjIyBcbiAgICAgICAgQGV2ZW50ID0gZXZlbnRcbiAgICAgICAgXG4gICAgICAgICMjIypcbiAgICAgICAgKiBBbiBhcnJheSBvZiBjdXN0b20gbnVtYmVyLWRhdGEgd2hpY2ggY2FuIGJlIHVzZWQgZm9yIGRpZmZlcmVudCBwdXJwb3Nlcy4gVGhlIGZpcnN0IGVsZW1lbnRcbiAgICAgICAgKiBpcyBhbHNvIHVzZWQgaW4gb25DaGFuZ2UgbWV0aG9kIHRvIHN0b3JlIHRoZSBvbGQgdmFsdWUgYW5kIGNoZWNrIGFnYWluc3QgdGhlIG5ldyBvbmUgdG8gZGV0ZWN0IGEgY2hhbmdlLlxuICAgICAgICAqIEBwcm9wZXJ0eSBudW1iZXJzXG4gICAgICAgICogQHR5cGUgbnVtYmVyW11cbiAgICAgICAgIyMjIFxuICAgICAgICBAbnVtYmVycyA9IG5ldyBBcnJheSgxMClcbiAgICAgICAgQG51bWJlcnNbaV0gPSAwIGZvciBpIGluIFswLi5AbnVtYmVycy5sZW5ndGhdXG4gICAgICAgIFxuICAgICAgICAjIyMqXG4gICAgICAgICogQW4gYXJyYXkgb2YgY3VzdG9tIHN0cmluZy1kYXRhIHdoaWNoIGNhbiBiZSB1c2VkIGZvciBkaWZmZXJlbnQgcHVycG9zZXMuIFRoZSBmaXJzdCBlbGVtZW50XG4gICAgICAgICogaXMgYWxzbyB1c2VkIGluIG9uVGV4dENoYW5nZSBtZXRob2QgdG8gc3RvcmUgdGhlIG9sZCB2YWx1ZSBhbmQgY2hlY2sgYWdhaW5zdCB0aGUgbmV3IG9uZSB0byBkZXRlY3QgYSBjaGFuZ2UuXG4gICAgICAgICogQHByb3BlcnR5IHN0cmluZ3NcbiAgICAgICAgKiBAdHlwZSBzdHJpbmdbXVxuICAgICAgICAjIyNcbiAgICAgICAgQHN0cmluZ3MgPSBuZXcgQXJyYXkoMTApXG4gICAgICAgIEBzdHJpbmdzW2ldID0gXCJcIiBmb3IgaSBpbiBbMC4uQHN0cmluZ3MubGVuZ3RoXVxuICAgICAgICBcbiAgICBcbiAgICAjIyMqXG4gICAgKiBUaGUgZm9ybXVsYS1mdW5jdGlvbi4gSXRzIGEgd3JhcHBlci1mdW5jdGlvbiBiZWZvcmUgdGhlIGZpcnN0LXRpbWUgY2FsbCB3YXMgbWFkZS5cbiAgICAqIEBtZXRob2QgZXhlY1xuICAgICMjI1xuICAgIGV4ZWM6IC0+XG4gICAgICAgQGV4ZWMgPSBAZXhlY19cbiAgICAgICByID0gQGV4ZWNfLmFwcGx5KHRoaXMsIGFyZ3VtZW50cylcbiAgICAgICBAb25Jbml0aWFsaXplID0gbm9cbiAgICAgICBcbiAgICAgICByZXR1cm4gclxuICAgICAgIFxuICAgICMjIypcbiAgICAqIENoZWNrcyBpZiB0aGUgc3BlY2lmaWVkIG51bWJlci12YWx1ZSBoYXMgY2hhbmdlZCBzaW5jZSB0aGUgbGFzdCBjaGVjay4gSXQgdXNlc1xuICAgICogdGhlIGZpcnN0IGVudHJ5IG9mIHRoZSBudW1iZXJzLWFycmF5IHRvIHN0b3JlIHRoZSB2YWx1ZSBhbmQgY2hlY2sgYWdhaW5zdCB0aGUgbmV3IG9uZS5cbiAgICAqXG4gICAgKiBAbWV0aG9kIG9uQ2hhbmdlXG4gICAgKiBAcGFyYW0ge251bWJlcn0gbnVtYmVyVmFsdWUgLSBOdW1iZXIgdmFsdWUgdG8gY2hlY2suXG4gICAgIyMjICAgIFxuICAgIG9uQ2hhbmdlOiAobnVtYmVyVmFsdWUpIC0+XG4gICAgICAgIHJlc3VsdCA9IEBudW1iZXJzWzBdICE9IG51bWJlclZhbHVlXG4gICAgICAgIEBudW1iZXJzWzBdID0gbnVtYmVyVmFsdWVcbiAgICAgICAgXG4gICAgICAgIHJldHVybiByZXN1bHRcbiAgICAgXG4gICAgIyMjKlxuICAgICogQ2hlY2tzIGlmIHRoZSBzcGVjaWZpZWQgdGV4dC12YWx1ZSBoYXMgY2hhbmdlZCBzaW5jZSB0aGUgbGFzdCBjaGVjay4gSXQgdXNlc1xuICAgICogdGhlIGZpcnN0IGVudHJ5IG9mIHRoZSBzdHJpbmdzLWFycmF5IHRvIHN0b3JlIHRoZSB2YWx1ZSBhbmQgY2hlY2sgYWdhaW5zdCB0aGUgbmV3IG9uZS5cbiAgICAqXG4gICAgKiBAbWV0aG9kIG9uVGV4dENoYW5nZVxuICAgICogQHBhcmFtIHtzdHJpbmd9IHRleHRWYWx1ZSAtIFRleHQgdmFsdWUgdG8gY2hlY2suXG4gICAgIyMjICAgICBcbiAgICBvblRleHRDaGFuZ2U6ICh0ZXh0VmFsdWUpIC0+XG4gICAgICAgIHJlc3VsdCA9IEBzdHJpbmdzWzBdICE9IHRleHRWYWx1ZVxuICAgICAgICBAc3RyaW5nc1swXSA9IHRleHRWYWx1ZVxuICAgICAgICBcbiAgICAgICAgcmV0dXJuIHJlc3VsdFxuICAgICAgICBcbnVpLkZvcm11bGEgPSBGb3JtdWxhXG5cbmNsYXNzIFNwYWNlXG4gICAgIyMjKlxuICAgICogRGVzY3JpYmVzIGEgc3BhY2UgaW5zaWRlIG9yIGFyb3VuZCBzb21ldGhpbmcgbGlrZSBhIG1hcmdpbiBvciBwYWRkaW5nLlxuICAgICpcbiAgICAqIEBtb2R1bGUgdWlcbiAgICAqIEBjbGFzcyBTcGFjZVxuICAgICogQG1lbWJlcm9mIHVpXG4gICAgKiBAY29uc3RydWN0b3JcbiAgICAqIEBwYXJhbSB7bnVtYmVyfSBsZWZ0IC0gU3BhY2UgYXQgdGhlIGxlZnQgaW4gcGl4ZWxzLlxuICAgICogQHBhcmFtIHtudW1iZXJ9IHRvcCAtIFNwYWNlIGF0IHRoZSB0b3AgaW4gcGl4ZWxzLlxuICAgICogQHBhcmFtIHtudW1iZXJ9IHJpZ2h0IC0gU3BhY2UgYXQgdGhlIHJpZ2h0IGluIHBpeGVscy5cbiAgICAqIEBwYXJhbSB7bnVtYmVyfSBib3R0b20gLSBTcGFjZSBhdCB0aGUgYm90dG9tIGluIHBpeGVscy5cbiAgICAjIyNcbiAgICBjb25zdHJ1Y3RvcjogKGxlZnQsIHRvcCwgcmlnaHQsIGJvdHRvbSkgLT5cbiAgICAgICAgIyMjKlxuICAgICAgICAqIFNwYWNlIGF0IHRoZSBsZWZ0IGluIHBpeGVscy5cbiAgICAgICAgKiBAcHJvcGVydHkgbGVmdFxuICAgICAgICAqIEB0eXBlIG51bWJlclxuICAgICAgICAjIyNcbiAgICAgICAgQGxlZnQgPSBsZWZ0XG4gICAgICAgIFxuICAgICAgICAjIyMqXG4gICAgICAgICogU3BhY2UgYXQgdGhlIHRvcCBpbiBwaXhlbHMuXG4gICAgICAgICogQHByb3BlcnR5IHRvcFxuICAgICAgICAqIEB0eXBlIG51bWJlclxuICAgICAgICAjIyNcbiAgICAgICAgQHRvcCA9IHRvcFxuICAgICAgICBcbiAgICAgICAgIyMjKlxuICAgICAgICAqIFNwYWNlIGF0IHRoZSByaWdodCBpbiBwaXhlbHMuXG4gICAgICAgICogQHByb3BlcnR5IHJpZ2h0XG4gICAgICAgICogQHR5cGUgbnVtYmVyXG4gICAgICAgICMjI1xuICAgICAgICBAcmlnaHQgPSByaWdodFxuICAgICAgICBcbiAgICAgICAgIyMjKlxuICAgICAgICAqIFNwYWNlIGF0IHRoZSBib3R0b20gaW4gcGl4ZWxzLlxuICAgICAgICAqIEBwcm9wZXJ0eSBib3R0b21cbiAgICAgICAgKiBAdHlwZSBudW1iZXJcbiAgICAgICAgIyMjXG4gICAgICAgIEBib3R0b20gPSBib3R0b21cbiAgICAgIFxuICAgICMjIypcbiAgICAqIFNldHMgdGhlIGNvb3JkaW5hdGVzIG9mIHRoZSBzcGFjZSBieSBjb3B5aW5nIHRoZW0gZnJvbSBhIHNwZWNpZmllZCBzcGFjZS5cbiAgICAqXG4gICAgKiBAbWV0aG9kIHNldEZyb21PYmplY3RcbiAgICAqIEBwYXJhbSB7T2JqZWN0fSBzcGFjZSAtIEEgc3BhY2UgdG8gY29weS5cbiAgICAjIyMgICBcbiAgICBzZXRGcm9tT2JqZWN0OiAoc3BhY2UpIC0+XG4gICAgICAgIEBsZWZ0ID0gc3BhY2UubGVmdFxuICAgICAgICBAdG9wID0gc3BhY2UudG9wXG4gICAgICAgIEByaWdodCA9IHNwYWNlLnJpZ2h0XG4gICAgICAgIEBib3R0b20gPSBzcGFjZS5ib3R0b21cbiAgICAgIFxuICAgICMjIypcbiAgICAqIFNldHMgdGhlIGNvb3JkaW5hdGVzIG9mIHRoZSBzcGFjZS5cbiAgICAqXG4gICAgKiBAbWV0aG9kIHNldFxuICAgICogQHBhcmFtIHtudW1iZXJ9IGxlZnQgLSBTcGFjZSBhdCB0aGUgbGVmdCBpbiBwaXhlbHMuXG4gICAgKiBAcGFyYW0ge251bWJlcn0gdG9wIC0gU3BhY2UgYXQgdGhlIHRvcCBpbiBwaXhlbHMuXG4gICAgKiBAcGFyYW0ge251bWJlcn0gcmlnaHQgLSBTcGFjZSBhdCB0aGUgcmlnaHQgaW4gcGl4ZWxzLlxuICAgICogQHBhcmFtIHtudW1iZXJ9IGJvdHRvbSAtIFNwYWNlIGF0IHRoZSBib3R0b20gaW4gcGl4ZWxzLlxuICAgICMjIyAgICBcbiAgICBzZXQ6IChsZWZ0LCB0b3AsIHJpZ2h0LCBib3R0b20pIC0+XG4gICAgICAgIEBsZWZ0ID0gbGVmdFxuICAgICAgICBAdG9wID0gdG9wXG4gICAgICAgIEByaWdodCA9IHJpZ2h0XG4gICAgICAgIEBib3R0b20gPSBib3R0b21cbiAgICBcbiAgICAjIyMqXG4gICAgKiBDcmVhdGVzIGEgbmV3IHNwYWNlIG9iamVjdCBmcm9tIGFuIGFycmF5IG9mIGNvb3JkaW5hdGVzLlxuICAgICpcbiAgICAqIEBtZXRob2QgZnJvbUFycmF5XG4gICAgKiBAc3RhdGljXG4gICAgKiBAcGFyYW0ge251bWJlcltdfSBhcnJheSAtIEFuIGFycmF5IG9mIGNvb3JkaW5hdGVzIChsZWZ0LCB0b3AgcmlnaHQsIGJvdHRvbSkuXG4gICAgIyMjICAgIFxuICAgIEBmcm9tQXJyYXk6IChhcnJheSkgLT4gbmV3IHVpLlNwYWNlKGFycmF5WzBdLCBhcnJheVsxXSwgYXJyYXlbMl0sIGFycmF5WzNdKVxuICAgICAgICBcbnVpLlNwYWNlID0gU3BhY2VcblxuY2xhc3MgU3R5bGVcbiAgICAjIyMqXG4gICAgKiBBIFVJIHN0eWxlIGNhbiBhcHBsaWVkIHRvIGEgVUkgb2JqZWN0IHRvIG1vZGlmeSBpdCBwcm9wZXJ0aWVzIGxpa2UgY29sb3IsIGltYWdlLCBldGMuIHRvIGdpdmUgYSBjZXJ0YWluIFwic3R5bGVcIiB0byBpdC5cbiAgICAqXG4gICAgKiBAbW9kdWxlIHVpXG4gICAgKiBAY2xhc3MgU3R5bGVcbiAgICAqIEBtZW1iZXJvZiB1aVxuICAgICogQGNvbnN0cnVjdG9yXG4gICAgKiBAcGFyYW0ge09iamVjdH0gZGVzY3JpcHRvciAtIEEgc3R5bGUtZGVzY3JpcHRvciB0byBpbml0aWFsaXplIHRoZSBzdHlsZSBmcm9tLlxuICAgICogQHBhcmFtIHtudW1iZXJ9IGlkIC0gQSB1bmlxdWUgbnVtZXJpYyBJRCB0byBhY2Nlc3MgdGhlIHN0eWxlIHRocm91Z2ggVUlNYW5hZ2VyLnN0eWxlc0J5SWQgY29sbGVjdGlvbi5cbiAgICAqIEBwYXJhbSB7bnVtYmVyfSBzZWxlY3RvciAtIEEgc2VsZWN0b3IgSUQgd2hpY2ggY29udHJvbHMgdW5kZXIgd2hpY2ggY29uZGl0aW9ucyB0aGUgc3R5bGVzIHdpbGwgYmUgYXBwbGllZC5cbiAgICAjIyNcbiAgICBjb25zdHJ1Y3RvcjogKGRlc2NyaXB0b3IsIGlkLCBzZWxlY3RvcikgLT5cbiAgICAgICAgIyMjKlxuICAgICAgICAqIElEIG51bWJlciB0byBxdWlja2x5IGFjY2VzcyB0aGlzIHN0eWxlIGFuZCBsaW5rIHRvIHRoaXMgc3R5bGUuXG4gICAgICAgICogQHByb3BlcnR5IGlkXG4gICAgICAgICogQHR5cGUgbnVtYmVyXG4gICAgICAgICMjI1xuICAgICAgICBAaWQgPSBpZFxuICAgICAgICBcbiAgICAgICAgIyMjKlxuICAgICAgICAqIFN0eWxlLUlEIG9mIHRhcmdldCBvYmplY3QuIFRoaXMgc3R5bGUgd2lsbCBvbmx5IGJlIGFwcGxpZWQgb24gVUkgb2JqZWN0cyB3aXRoIHRoYXQgc3R5bGUgSUQgd2hpY2ggYXJlXG4gICAgICAgICogY2hpbGRyZW4gb2YgVUkgb2JqZWN0cyB3aGVyZSB0aGlzIHN0eWxlIGlzIGFwcGxpZWQuXG4gICAgICAgICogQHByb3BlcnR5IHRhcmdldFxuICAgICAgICAqIEB0eXBlIG51bWJlclxuICAgICAgICAjIyNcbiAgICAgICAgQHRhcmdldCA9IC0xXG4gICAgICAgIFxuICAgICAgICAjIyMqXG4gICAgICAgICogU2VsZWN0b3ItSUQgd2hpY2ggY29udHJvbHMgdW5kZXIgd2hpY2ggY29uZGl0aW9ucyB0aGUgc3R5bGUgYmVjb21lcyBhY3RpdmUuXG4gICAgICAgICogQHByb3BlcnR5IHNlbGVjdG9yXG4gICAgICAgICogQHR5cGUgbnVtYmVyXG4gICAgICAgICMjI1xuICAgICAgICBAc2VsZWN0b3IgPSBzZWxlY3RvclxuICAgICAgICBcbiAgICAgICAgIyMjKlxuICAgICAgICAqIFRoZSBmb250IHVzZWQgZm9yIHRoZSB0ZXh0LWRpc3BsYXkuXG4gICAgICAgICogQGRlZmF1bHQgbnVsbFxuICAgICAgICAqIEBwcm9wZXJ0eSBmb250XG4gICAgICAgICogQHR5cGUgZ3MuRm9udFxuICAgICAgICAjIyNcbiAgICAgICAgQGZvbnQgPSBudWxsXG4gICAgICAgIFxuICAgICAgICAjIyMqXG4gICAgICAgICogVGhlIFVJIG9iamVjdCdzIGltYWdlIHVzZWQgZm9yIHZpc3VhbCBwcmVzZW50YXRpb24uXG4gICAgICAgICogQHByb3BlcnR5IGltYWdlXG4gICAgICAgICogQHR5cGUgc3RyaW5nXG4gICAgICAgICMjI1xuICAgICAgICBAaW1hZ2UgPSBudWxsXG4gICAgICAgIFxuICAgICAgICAjIyMqXG4gICAgICAgICogVGhlIFVJIG9iamVjdCdzIGFuaW1hdGlvbnMgdXNlZCBmb3IgdmlzdWFsIHByZXNlbnRhdGlvbi5cbiAgICAgICAgKiBAZGVmYXVsdCBudWxsXG4gICAgICAgICogQHByb3BlcnR5IGFuaW1hdGlvbnNcbiAgICAgICAgKiBAdHlwZSBPYmplY3RbXVxuICAgICAgICAjIyNcbiAgICAgICAgQGFuaW1hdGlvbnMgPSBudWxsXG4gICAgICAgIFxuICAgICAgICAjIyMqXG4gICAgICAgICogVGhlIFVJIG9iamVjdCdzIGNvbG9yLlxuICAgICAgICAqIEBwcm9wZXJ0eSBjb2xvclxuICAgICAgICAqIEB0eXBlIGdzLkNvbG9yXG4gICAgICAgICMjI1xuICAgICAgICBAY29sb3IgPSBudWxsXG4gICAgICAgIFxuICAgICAgICAjIyMqXG4gICAgICAgICogVGhlIFVJIG9iamVjdCdzIHRvbmUuXG4gICAgICAgICogQHByb3BlcnR5IHRvbmVcbiAgICAgICAgKiBAdHlwZSBncy5Ub25lXG4gICAgICAgICMjI1xuICAgICAgICBAdG9uZSA9IG51bGxcbiAgICAgICAgXG4gICAgICAgICMjIypcbiAgICAgICAgKiBUaGUgVUkgb2JqZWN0J3MgYW5jaG9yLXBvaW50LiBGb3IgZXhhbXBsZTogQW4gYW5jaG9yLXBvaW50IHdpdGggMCwwIHBsYWNlcyB0aGUgb2JqZWN0IHdpdGggaXRzIHRvcC1sZWZ0IGNvcm5lclxuICAgICAgICAqIGF0IGl0cyBwb3NpdGlvbiBidXQgd2l0aCBhbiAwLjUsIDAuNSBhbmNob3ItcG9pbnQgdGhlIG9iamVjdCBpcyBwbGFjZWQgd2l0aCBpdHMgY2VudGVyLiBBbiBhbmNob3ItcG9pbnQgb2YgMSwxXG4gICAgICAgICogcGxhY2VzIHRoZSBvYmplY3Qgd2l0aCBpdHMgbG93ZXItcmlnaHQgY29ybmVyLlxuICAgICAgICAqIEBwcm9wZXJ0eSBhbmNob3JcbiAgICAgICAgKiBAdHlwZSBncy5Qb2ludFxuICAgICAgICAjIyNcbiAgICAgICAgQGFuY2hvciA9IG51bGxcbiAgICAgICAgXG4gICAgICAgICMjIypcbiAgICAgICAgKiBUaGUgVUkgb2JqZWN0J3Mgem9vbS1zZXR0aW5nIGZvciB4IGFuZCB5IGF4aXMuXG4gICAgICAgICogQGRlZmF1bHQgbmV3IGdzLlBvaW50KDEuMCwgMS4wKVxuICAgICAgICAqIEBwcm9wZXJ0eSB6b29tXG4gICAgICAgICogQHR5cGUgZ3MuUG9pbnRcbiAgICAgICAgIyMjXG4gICAgICAgIEB6b29tID0gbnVsbFxuICAgICAgICBcbiAgICAgICAgIyMjKlxuICAgICAgICAqIFRoZSBVSSBvYmplY3QncyBtYXJnaW4uIFRoZSBtYXJnaW4gZGVmaW5lcyBhbiBleHRyYSBzcGFjZSBhcm91bmQgdGhlIFVJIG9iamVjdC4gXG4gICAgICAgICogVGhlIGRlZmF1bHQgaXMgeyBsZWZ0OiAwLCB0b3A6IDAsIHJpZ2h0OiAwLCBib3R0b206IDAgfS5cbiAgICAgICAgKiBAcHJvcGVydHkgbWFyZ2luXG4gICAgICAgICogQHR5cGUgT2JqZWN0XG4gICAgICAgICMjI1xuICAgICAgICBAbWFyZ2luID0gbnVsbFxuICAgICAgICBcbiAgICAgICAgIyMjKlxuICAgICAgICAqIFRoZSBVSSBvYmplY3QncyBwYWRkaW5nLiBUaGUgZGVmYXVsdCBpcyB7IGxlZnQ6IDAsIHRvcDogMCwgcmlnaHQ6IDAsIGJvdHRvbTogMCB9LlxuICAgICAgICAqIEBwcm9wZXJ0eSBwYWRkaW5nXG4gICAgICAgICogQHR5cGUgT2JqZWN0XG4gICAgICAgICMjI1xuICAgICAgICBAcGFkZGluZyA9IG51bGxcbiAgICAgICAgXG4gICAgICAgICMjIypcbiAgICAgICAgKiBUaGUgVUkgb2JqZWN0J3MgbWFzayBmb3IgbWFza2luZy1lZmZlY3RzLlxuICAgICAgICAqIEBwcm9wZXJ0eSBtYXNrXG4gICAgICAgICogQHR5cGUgZ3MuTWFza1xuICAgICAgICAjIyNcbiAgICAgICAgQG1hc2sgPSBudWxsXG4gICAgICAgIFxuICAgICAgICAjIyMqXG4gICAgICAgICogVGhlIFVJIG9iamVjdCdzIGFsaWdubWVudC5cbiAgICAgICAgKiBAcHJvcGVydHkgYWxpZ25tZW50XG4gICAgICAgICogQHR5cGUgdWkuQWxpZ25tZW50XG4gICAgICAgICMjI1xuICAgICAgICBAYWxpZ25tZW50ID0gLTFcbiAgICAgICAgXG4gICAgICAgICMjIypcbiAgICAgICAgKiBUaGUgVUkgb2JqZWN0J3Mgb3BhY2l0eSB0byBjb250cm9sIHRyYW5zcGFyZW5jeS4gRm9yIGV4YW1wbGU6IDAgPSBUcmFuc3BhcmVudCwgMjU1ID0gT3BhcXVlLCAxMjggPSBTZW1pLVRyYW5zcGFyZW50LlxuICAgICAgICAqIEBwcm9wZXJ0eSBvcGFjaXR5XG4gICAgICAgICogQHR5cGUgbnVtYmVyXG4gICAgICAgICMjI1xuICAgICAgICBAb3BhY2l0eSA9IC0xXG4gICAgICAgIFxuICAgICAgICAjIyMqXG4gICAgICAgICogVGhlIG9iamVjdCdzIGNsaXAtcmVjdCBmb3IgdmlzdWFsIHByZXNlbnRhdGlvbi5cbiAgICAgICAgKiBAZGVmYXVsdCBudWxsXG4gICAgICAgICogQHByb3BlcnR5IGNsaXBSZWN0XG4gICAgICAgICogQHR5cGUgZ3MuUmVjdFxuICAgICAgICAqIEBwcm90ZWN0ZWRcbiAgICAgICAgIyMjXG4gICAgICAgIEBjbGlwUmVjdCA9IG51bGxcbiAgICAgICAgXG4gICAgICAgICMjIypcbiAgICAgICAgKiBUaGUgY29ybmVyLXNpemUgb2YgdGhlIGZyYW1lLlxuICAgICAgICAqIEBwcm9wZXJ0eSBmcmFtZUNvcm5lclNpemVcbiAgICAgICAgKiBAdHlwZSBudW1iZXJcbiAgICAgICAgIyMjXG4gICAgICAgIEBmcmFtZUNvcm5lclNpemUgPSAtMVxuICAgICAgICBcbiAgICAgICAgIyMjKlxuICAgICAgICAqIFRoZSB0aGlja25lc3Mgb2YgdGhlIGZyYW1lLlxuICAgICAgICAqIEBwcm9wZXJ0eSBmcmFtZVRoaWNrbmVzc1xuICAgICAgICAqIEB0eXBlIG51bWJlclxuICAgICAgICAjIyNcbiAgICAgICAgQGZyYW1lVGhpY2tuZXNzID0gLTFcbiAgICAgICAgXG4gICAgICAgICMjIypcbiAgICAgICAgKiBUaGUgbG9vcGluZyBvZiB0aGUgaW1hZ2UuXG4gICAgICAgICogQHByb3BlcnR5IGxvb3BpbmdcbiAgICAgICAgKiBAdHlwZSB1aS5PcmllbnRhdGlvblxuICAgICAgICAjIyNcbiAgICAgICAgQGxvb3BpbmcgPSBudWxsXG4gICAgICAgIFxuICAgICAgICAjIyMqXG4gICAgICAgICogVGhlIG9iamVjdCdzIHotaW5kZXggY29udHJvbHMgcmVuZGVyaW5nLW9yZGVyL2ltYWdlLW92ZXJsYXBwaW5nLiBBbiBvYmplY3Qgd2l0aCBhIHNtYWxsZXIgei1pbmRleCBpcyByZW5kZXJlZFxuICAgICAgICAqIGJlZm9yZSBhbiBvYmplY3Qgd2l0aCBhIGxhcmdlciBpbmRleC4gRm9yIGV4YW1wbGU6IFRvIG1ha2Ugc3VyZSBhIGdhbWUgb2JqZWN0IGlzIGFsd2F5cyBvbiB0b3Agb2YgdGhlIHNjcmVlbiwgaXRcbiAgICAgICAgKiBzaG91bGQgaGF2ZSB0aGUgbGFyZ2VzdCB6LWluZGV4IG9mIGFsbCBnYW1lIG9iamVjdHMuXG4gICAgICAgICogQHByb3BlcnR5IHpJbmRleFxuICAgICAgICAqIEB0eXBlIG51bWJlclxuICAgICAgICAjIyNcbiAgICAgICAgQHpJbmRleCA9IC0xXG4gICAgICAgIFxuICAgICAgICAjIyMqXG4gICAgICAgICogVGhlIG9iamVjdCdzIGFsaWdubWVudCBvbiB4LWF4aXMuIE5lZWRzIHRvIGJlIHN1cHBvcnRlZCBieSBsYXlvdXQuXG4gICAgICAgICogQHByb3BlcnR5IGFsaWdubWVudFhcbiAgICAgICAgKiBAdHlwZSBudW1iZXJcbiAgICAgICAgIyMjXG4gICAgICAgIEBhbGlnbm1lbnRYID0gLTFcbiAgICAgICAgXG4gICAgICAgICMjIypcbiAgICAgICAgKiBUaGUgb2JqZWN0J3MgYWxpZ25tZW50IG9uIHktYXhpcy4gTmVlZHMgdG8gYmUgc3VwcG9ydGVkIGJ5IGxheW91dC5cbiAgICAgICAgKiBAcHJvcGVydHkgYWxpZ25tZW50WVxuICAgICAgICAqIEB0eXBlIG51bWJlclxuICAgICAgICAjIyNcbiAgICAgICAgQGFsaWdubWVudFkgPSAtMVxuICAgICAgICBcbiAgICAgICAgIyMjKlxuICAgICAgICAqIFRoZSBvYmplY3QncyByZXNpemUgYmVoYXZpb3IuXG4gICAgICAgICogQHByb3BlcnR5IHJlc2l6YWJsZVxuICAgICAgICAqIEB0eXBlIGJvb2xlYW5cbiAgICAgICAgIyMjXG4gICAgICAgIEByZXNpemFibGUgPSBudWxsXG4gICAgICAgIFxuICAgICAgICAjIyMqXG4gICAgICAgICogVGhlIG9yaWdpbmFsIHN0eWxlIGRlc2NyaXB0b3IuXG4gICAgICAgICogQHByb3BlcnR5IGRlc2NyaXB0b3JcbiAgICAgICAgKiBAdHlwZSBPYmplY3RcbiAgICAgICAgIyMjXG4gICAgICAgIEBkZXNjcmlwdG9yID0gZGVzY3JpcHRvclxuICAgICAgICBcbiAgICAgICAgaWYgZGVzY3JpcHRvclxuICAgICAgICAgICAgQHNldEZyb21EZXNjcmlwdG9yKGRlc2NyaXB0b3IpXG5cbiAgICAjIyMqXG4gICAgKiBJbml0aWFsaXplcyB0aGUgc3R5bGUgZnJvbSBhIHN0eWxlLWRlc2NyaXB0b3IuXG4gICAgKlxuICAgICogQG1ldGhvZCBzZXRGcm9tRGVzY3JpcHRvclxuICAgICogQHBhcmFtIHtPYmplY3R9IGRlc2NyaXB0b3IgLSBUaGUgc3R5bGUtZGVzY3JpcHRvci5cbiAgICAjIyMgXG4gICAgc2V0RnJvbURlc2NyaXB0b3I6IChkZXNjcmlwdG9yKSAtPlxuICAgICAgICBAZGVzY3JpcHRvciA9IGRlc2NyaXB0b3JcbiAgICAgICAgQGltYWdlID0gZGVzY3JpcHRvci5pbWFnZVxuICAgICAgICBAY29sb3IgPSBncy5Db2xvci5mcm9tQXJyYXkoZGVzY3JpcHRvci5jb2xvcikgaWYgZGVzY3JpcHRvci5jb2xvclxuICAgICAgICBAdG9uZSA9IGdzLlRvbmUuZnJvbUFycmF5KGRlc2NyaXB0b3IudG9uZSkgaWYgZGVzY3JpcHRvci50b25lXG4gICAgICAgIEBhbmNob3IgPSBuZXcgZ3MuUG9pbnQoZGVzY3JpcHRvci5hbmNob3JbMF0sIGRlc2NyaXB0b3IuYW5jaG9yWzFdKSBpZiBkZXNjcmlwdG9yLmFuY2hvclxuICAgICAgICBAem9vbSA9IG5ldyBncy5Qb2ludChkZXNjcmlwdG9yLnpvb21bMF0sIGRlc2NyaXB0b3Iuem9vbVsxXSkgaWYgZGVzY3JpcHRvci56b29tXG4gICAgICAgIFxuICAgICAgICBpZiBkZXNjcmlwdG9yLmZvbnRcbiAgICAgICAgICAgIEBzZXR1cEZvbnQoZGVzY3JpcHRvcilcbiAgICAgICAgICAgIFxuICAgICAgICBpZiBkZXNjcmlwdG9yLmNsaXBSZWN0XG4gICAgICAgICAgICBAY2xpcFJlY3QgPSBncy5SZWN0LmZyb21BcnJheShkZXNjcmlwdG9yLmNsaXBSZWN0KVxuICAgICAgICAgICAgXG4gICAgICAgIEBvcGFjaXR5ID0gZGVzY3JpcHRvci5vcGFjaXR5IGlmIGRlc2NyaXB0b3Iub3BhY2l0eSA+PSAwXG4gICAgICAgIEBhbGlnbm1lbnQgPSBkZXNjcmlwdG9yLmFsaWdubWVudCBpZiBkZXNjcmlwdG9yLmFsaWdubWVudCA+PSAwXG4gICAgICAgIEBtYXJnaW4gPSB1aS5TcGFjZS5mcm9tQXJyYXkoZGVzY3JpcHRvci5tYXJnaW4pIGlmIGRlc2NyaXB0b3IubWFyZ2luXG4gICAgICAgIEBwYWRkaW5nID0gdWkuU3BhY2UuZnJvbUFycmF5KGRlc2NyaXB0b3IucGFkZGluZykgaWYgZGVzY3JpcHRvci5wYWRkaW5nXG4gICAgICAgIEBhbmltYXRpb25zID0gZGVzY3JpcHRvci5hbmltYXRpb25zXG4gICAgICAgIEBmcmFtZUNvcm5lclNpemUgPSBkZXNjcmlwdG9yLmZyYW1lQ29ybmVyU2l6ZSBpZiBkZXNjcmlwdG9yLmZyYW1lQ29ybmVyU2l6ZVxuICAgICAgICBAZnJhbWVUaGlja25lc3MgPSBkZXNjcmlwdG9yLmZyYW1lVGhpY2tuZXNzIGlmIGRlc2NyaXB0b3IuZnJhbWVUaGlja25lc3NcbiAgICAgICAgQGZyYW1lID0gZGVzY3JpcHRvci5mcmFtZSBpZiBkZXNjcmlwdG9yLmZyYW1lXG4gICAgICAgIEBsb29waW5nID0gZGVzY3JpcHRvci5sb29waW5nIGlmIGRlc2NyaXB0b3IubG9vcGluZ1xuICAgICAgICBAcmVzaXphYmxlID0gZGVzY3JpcHRvci5yZXNpemFibGUgaWYgZGVzY3JpcHRvci5yZXNpemFibGU/XG4gICAgICAgIEB6SW5kZXggPSBkZXNjcmlwdG9yLnpJbmRleCBpZiBkZXNjcmlwdG9yLnpJbmRleFxuICAgICAgICBAYWxpZ25tZW50WCA9IHVpLlVJTWFuYWdlci5hbGlnbm1lbnRzW2Rlc2NyaXB0b3IuYWxpZ25tZW50WF0gaWYgZGVzY3JpcHRvci5hbGlnbm1lbnRYXG4gICAgICAgIEBhbGlnbm1lbnRZID0gdWkuVUlNYW5hZ2VyLmFsaWdubWVudHNbZGVzY3JpcHRvci5hbGlnbm1lbnRZXSBpZiBkZXNjcmlwdG9yLmFsaWdubWVudFlcbiAgICAgICAgXG4gICAgc2V0OiAoc3R5bGUpIC0+XG4gICAgICAgIEBpbWFnZSA9IHN0eWxlLmltYWdlXG4gICAgICAgIEBjb2xvci5zZXRGcm9tT2JqZWN0KHN0eWxlLmNvbG9yKVxuICAgICAgICBAdG9uZS5zZXRGcm9tT2JqZWN0KHN0eWxlLnRvbmUpXG4gICAgICAgIEBhbmNob3Iuc2V0KHN0eWxlLmFuY2hvci54LCBzdHlsZS5hbmNob3IueSlcbiAgICAgICAgQHpvb20uc2V0KHN0eWxlLnpvb20ueCwgc3R5bGUuem9vbS55KVxuICAgICAgICBcbiAgICAgICAgaWYgc3R5bGUuZm9udFxuICAgICAgICAgICAgaWYgIUBmb250IHRoZW4gQGZvbnQgPSBuZXcgZ3MuRm9udChzdHlsZS5mb250Lm5hbWUsIHN0eWxlLmZvbnQuc2l6ZSlcbiAgICAgICAgICAgIEBmb250LnNldChzdHlsZS5mb250KVxuICAgICAgICAgICAgXG4gICAgICAgIGlmIHN0eWxlLmNsaXBSZWN0XG4gICAgICAgICAgICBpZiAhQGNsaXBSZWN0IHRoZW4gQGNsaXBSZWN0ID0gbmV3IGdzLlJlY3QoKVxuICAgICAgICAgICAgQGNsaXBSZWN0LnNldEZyb21PYmplY3Qoc3R5bGUuY2xpcFJlY3QpXG4gICAgICAgICAgICBcbiAgICAgICAgQG9wYWNpdHkgPSBzdHlsZS5vcGFjaXR6XG4gICAgICAgIEBhbGlnbm1lbnQgPSBzdHlsZS5hbGlnbm1lbnRcbiAgICAgICAgQG1hcmdpbi5zZXRGcm9tT2JqZWN0KHN0eWxlLm1hcmdpbilcbiAgICAgICAgQHBhZGRpbmcuc2V0RnJvbU9iamVjdChzdHlsZS5wYWRkaW5nKVxuICAgICAgICBcbiAgICAjIyMqXG4gICAgKiBJbml0aWFsaXplcyBmb250LWRhdGEgZnJvbSBhIHN0eWxlLWRlc2NyaXB0b3IuXG4gICAgKlxuICAgICogQG1ldGhvZCBzZXR1cEZvbnRcbiAgICAqIEBwYXJhbSB7T2JqZWN0fSBkZXNjcmlwdG9yIC0gVGhlIHN0eWxlLWRlc2NyaXB0b3IuXG4gICAgKiBAcHJvdGVjdGVkXG4gICAgIyMjIFxuICAgIHNldHVwRm9udDogKGRlc2NyaXB0b3IpIC0+XG4gICAgICAgIGlmIGRlc2NyaXB0b3IuZm9udFxuICAgICAgICAgICAgaWYgIUBmb250XG4gICAgICAgICAgICAgICAgQGZvbnQgPSBuZXcgRm9udChkZXNjcmlwdG9yLmZvbnQubmFtZSwgZGVzY3JpcHRvci5mb250LnNpemUgPyAwKVxuICAgICAgICAgICAgZWxzZVxuICAgICAgICAgICAgICAgIEBmb250Lm5hbWUgPSBkZXNjcmlwdG9yLmZvbnQubmFtZVxuICAgICAgICAgICAgICAgIEBmb250LnNpemUgPSBkZXNjcmlwdG9yLmZvbnQuc2l6ZSA/IDBcbiAgICAgICAgICAgICAgICBcbiAgICAgICAgICAgIEBmb250LmJvbGQgPSBkZXNjcmlwdG9yLmZvbnQuYm9sZCA/IEBmb250LmJvbGRcbiAgICAgICAgICAgIEBmb250Lml0YWxpYyA9IGRlc2NyaXB0b3IuZm9udC5pdGFsaWMgPyBAZm9udC5pdGFsaWNcbiAgICAgICAgICAgIEBmb250LnNtYWxsQ2FwcyA9IGRlc2NyaXB0b3IuZm9udC5zbWFsbENhcHMgPyBAZm9udC5zbWFsbENhcHNcbiAgICAgICAgICAgIEBmb250LnVuZGVybGluZSA9IGRlc2NyaXB0b3IuZm9udC51bmRlcmxpbmUgPyBAZm9udC51bmRlcmxpbmVcbiAgICAgICAgICAgIEBmb250LnN0cmlrZVRocm91Z2ggPSBkZXNjcmlwdG9yLmZvbnQuc3RyaWtlVGhyb3VnaCA/IEBmb250LnN0cmlrZVRocm91Z2hcbiAgICAgICAgICAgIFxuICAgICAgICAgICAgaWYgZGVzY3JpcHRvci5mb250LmNvbG9yP1xuICAgICAgICAgICAgICAgIEBmb250LmNvbG9yLnNldEZyb21BcnJheShkZXNjcmlwdG9yLmZvbnQuY29sb3IpXG4gICAgICAgICAgICBcbiAgICAgICAgICAgIGlmIGRlc2NyaXB0b3IuZm9udC5ib3JkZXI/XG4gICAgICAgICAgICAgICAgQGZvbnQuYm9yZGVyID0gZGVzY3JpcHRvci5mb250LmJvcmRlciA/IG5vXG4gICAgICAgICAgICAgICAgQGZvbnQuYm9yZGVyU2l6ZSA9IGRlc2NyaXB0b3IuZm9udC5ib3JkZXJTaXplID8gNFxuICAgICAgICAgICAgICAgIEBmb250LmJvcmRlckNvbG9yLnNldCgwLCAwLCAwLCAyNTUpXG4gICAgICAgICAgICAgICAgXG4gICAgICAgICAgICBpZiBkZXNjcmlwdG9yLmZvbnQub3V0bGluZT9cbiAgICAgICAgICAgICAgICBAZm9udC5ib3JkZXIgPSBkZXNjcmlwdG9yLmZvbnQub3V0bGluZSA/IG5vXG4gICAgICAgICAgICAgICAgQGZvbnQuYm9yZGVyU2l6ZSA9IGRlc2NyaXB0b3IuZm9udC5vdXRsaW5lLnNpemUgPyA0XG4gICAgICAgICAgICAgICAgXG4gICAgICAgICAgICAgICAgaWYgZGVzY3JpcHRvci5mb250Lm91dGxpbmUuY29sb3I/XG4gICAgICAgICAgICAgICAgICAgIEBmb250LmJvcmRlckNvbG9yLnNldEZyb21BcnJheShkZXNjcmlwdG9yLmZvbnQub3V0bGluZS5jb2xvcilcbiAgICAgICAgICAgICAgICBlbHNlXG4gICAgICAgICAgICAgICAgICAgIEBmb250LmJvcmRlckNvbG9yLnNldCgwLCAwLCAwLCAyNTUpXG4gICAgXG4gICAgIyMjKlxuICAgICogQXBwbGllcyB0aGUgc3R5bGUgdG8gYSBVSSBvYmplY3QuXG4gICAgKlxuICAgICogQG1ldGhvZCBhcHBseVxuICAgICogQHBhcmFtIHt1aS5PYmplY3RfVUlFbGVtZW50fSBvYmplY3QgLSBUaGUgVUkgb2JqZWN0IHdoZXJlIHRoZSBzdHlsZSBzaG91bGQgYmUgYXBwbGllZCB0by5cbiAgICAjIyMgICAgICAgICAgICAgICAgXG4gICAgYXBwbHk6IChvYmplY3QpIC0+XG4gICAgICAgIGlmIG5vdCBvYmplY3QuYWN0aXZlU3R5bGVzLmNvbnRhaW5zKHRoaXMpXG4gICAgICAgICAgICBvYmplY3QuYWN0aXZlU3R5bGVzLnB1c2godGhpcylcbiAgICAgICAgICAgIGlmIEBmb250IHRoZW4gb2JqZWN0LmZvbnQ/LnNldChAZm9udClcbiAgICAgICAgICAgIGlmIEBjb2xvciB0aGVuIG9iamVjdC5jb2xvci5zZXQoQGNvbG9yKVxuICAgICAgICAgICAgaWYgQHRvbmUgdGhlbiBvYmplY3QudG9uZT8uc2V0KEB0b25lKVxuICAgICAgICAgICAgaWYgQGltYWdlIHRoZW4gb2JqZWN0LmltYWdlID0gQGltYWdlXG4gICAgICAgICAgICBpZiBAYW5jaG9yIHRoZW4gb2JqZWN0LmFuY2hvci5zZXQoQGFuY2hvci54LCBAYW5jaG9yLnkpXG4gICAgICAgICAgICBpZiBAem9vbSB0aGVuIG9iamVjdC56b29tLnNldChAem9vbS54LCBAem9vbS55KVxuICAgICAgICAgICAgaWYgQHBhZGRpbmcgdGhlbiBvYmplY3QucGFkZGluZy5zZXRGcm9tT2JqZWN0KEBwYWRkaW5nKVxuICAgICAgICAgICAgaWYgQG1hcmdpbiB0aGVuIG9iamVjdC5tYXJnaW4uc2V0RnJvbU9iamVjdChAbWFyZ2luKVxuICAgICAgICAgICAgaWYgQG9wYWNpdHkgPj0gMCB0aGVuIG9iamVjdC5vcGFjaXR5ID0gQG9wYWNpdHlcbiAgICAgICAgICAgIGlmIEBhbGlnbm1lbnQgPj0gMCB0aGVuIG9iamVjdC5hbGlnbm1lbnQgPSBAYWxpZ25tZW50XG4gICAgICAgICAgICBpZiBAZnJhbWVUaGlja25lc3MgPj0gMCB0aGVuIG9iamVjdC5mcmFtZVRoaWNrbmVzcyA9IEBmcmFtZVRoaWNrbmVzc1xuICAgICAgICAgICAgaWYgQGZyYW1lQ29ybmVyU2l6ZSA+PSAwIHRoZW4gb2JqZWN0LmZyYW1lQ29ybmVyU2l6ZSA9IEBmcmFtZUNvcm5lclNpemVcbiAgICAgICAgICAgIGlmIEBtYXNrIHRoZW4gb2JqZWN0Lm1hc2suc2V0KEBtYXNrKVxuICAgICAgICAgICAgaWYgQHpJbmRleCA+PSAwIHRoZW4gb2JqZWN0LnpJbmRleCA9IEB6SW5kZXhcbiAgICAgICAgICAgIGlmIEBhbGlnbm1lbnRYID49IDAgdGhlbiBvYmplY3QuYWxpZ25tZW50WCA9IEBhbGlnbm1lbnRYXG4gICAgICAgICAgICBpZiBAYWxpZ25tZW50WSA+PSAwIHRoZW4gb2JqZWN0LmFsaWdubWVudFkgPSBAYWxpZ25tZW50WVxuICAgICAgICAgICAgaWYgQHJlc2l6YWJsZT8gdGhlbiBvYmplY3QucmVzaXphYmxlID0gQHJlc2l6YWJsZVxuICAgICAgICAgICAgXG4gICAgICAgICAgICBAYXBwbHlMb29waW5nKG9iamVjdClcbiAgICAgICAgICAgIEBhcHBseUFuaW1hdGlvbnMob2JqZWN0KVxuICAgICBcbiAgICAjIyMqXG4gICAgKiBBcHBsaWVzIHRoZSBsb29waW5nLWRhdGEgb2YgdGhlIHN0eWxlIHRvIGEgVUkgb2JqZWN0LlxuICAgICpcbiAgICAqIEBtZXRob2QgYXBwbHlMb29waW5nXG4gICAgKiBAcGFyYW0ge3VpLk9iamVjdF9VSUVsZW1lbnR9IG9iamVjdCAtIFRoZSBVSSBvYmplY3Qgd2hlcmUgdGhlIGxvb3BpbmctZGF0YSBzaG91bGQgYmUgYXBwbGllZCB0by5cbiAgICAqIEBwcm90ZWN0ZWRcbiAgICAjIyMgICAgIFxuICAgIGFwcGx5TG9vcGluZzogKG9iamVjdCkgLT5cbiAgICAgICAgaWYgQGxvb3BpbmdcbiAgICAgICAgICAgIGlmICFvYmplY3QudmlzdWFsLmxvb3BpbmdcbiAgICAgICAgICAgICAgICBvYmplY3QudmlzdWFsLmRpc3Bvc2UoKVxuICAgICAgICAgICAgICAgIG9iamVjdC5yZW1vdmVDb21wb25lbnQob2JqZWN0LnZpc3VhbClcbiAgICAgICAgICAgICAgICBvYmplY3QudmlzdWFsID0gbmV3IGdzLkNvbXBvbmVudF9UaWxpbmdTcHJpdGUoKVxuICAgICAgICAgICAgICAgIG9iamVjdC5hZGRDb21wb25lbnQob2JqZWN0LnZpc3VhbClcbiAgICAgICAgICAgIFxuICAgICAgICAgICAgb2JqZWN0LnZpc3VhbC5sb29waW5nLnZlcnRpY2FsID0gQGxvb3BpbmcudmVydGljYWxcbiAgICAgICAgICAgIG9iamVjdC52aXN1YWwubG9vcGluZy5ob3Jpem9udGFsID0gQGxvb3BpbmcuaG9yaXpvbnRhbFxuICAgICBcbiAgICAjIyMqXG4gICAgKiBBcHBsaWVzIHRoZSBhbmltYXRpb24tZGF0YSBvZiB0aGUgc3R5bGUgdG8gYSBVSSBvYmplY3QuIFRoaXMgYXV0b21hdGljYWxseSBhZGRzIGFuIGFuaW1hdGlvbi1oYW5kbGVyXG4gICAgKiBjb21wb25lbnQodWkuQ29tcG9uZW50X0FuaW1hdGlvbkhhbmRsZXIpIHdpdGggdGhlIGlkIFwiYW5pbWF0aW9uSGFuZGxlclwiIHRvIHRoZSBVSSBvYmplY3QgaWYgbm90IGFscmVhZHkgZXhpc3RzLlxuICAgICpcbiAgICAqIEBtZXRob2QgYXBwbHlBbmltYXRpb25zXG4gICAgKiBAcGFyYW0ge3VpLk9iamVjdF9VSUVsZW1lbnR9IG9iamVjdCAtIFRoZSBVSSBvYmplY3Qgd2hlcmUgdGhlIGFuaW1hdGlvbi1kYXRhIHNob3VsZCBiZSBhcHBsaWVkIHRvLlxuICAgICogQHByb3RlY3RlZFxuICAgICMjIyAgICAgICAgXG4gICAgYXBwbHlBbmltYXRpb25zOiAob2JqZWN0KSAtPlxuICAgICAgICBpZiBAYW5pbWF0aW9uc1xuICAgICAgICAgICAgb2JqZWN0LmFuaW1hdGlvbnMgPSBPYmplY3QuZGVlcENvcHkoQGFuaW1hdGlvbnMpXG4gICAgICAgICAgICBpZiAhb2JqZWN0LmZpbmRDb21wb25lbnRCeUlkKFwiYW5pbWF0aW9uSGFuZGxlclwiKVxuICAgICAgICAgICAgICAgIG9iamVjdC5hbmltYXRpb25FeGVjdXRvciA9IG5ldyB1aS5Db21wb25lbnRfQW5pbWF0aW9uRXhlY3V0b3IoKVxuICAgICAgICAgICAgICAgIG9iamVjdC5hZGRDb21wb25lbnQobmV3IHVpLkNvbXBvbmVudF9BbmltYXRpb25IYW5kbGVyKCksIFwiYW5pbWF0aW9uSGFuZGxlclwiKVxuICAgICAgICAgICAgICAgIG9iamVjdC5hZGRDb21wb25lbnQob2JqZWN0LmFuaW1hdGlvbkV4ZWN1dG9yLCBcImFuaW1hdGlvbkV4ZWN1dG9yXCIpXG4gICAgICAgICAgICAgICAgXG4gICAgICBcbiAgICAjIyMqXG4gICAgKiBSZXZlcnRzIHRoZSBjaGFuZ2VzIGZyb20gYSBVSSBvYmplY3QgbWFkZSBieSB0aGlzIHN0eWxlLiBIb3dldmVyLCB0aGlzIHJlc2V0cyBhbGwgc3R5bGVhYmxlIHByb3BlcnRpZXNcbiAgICAqIHdlcmUgc2V0IGJ5IHRoaXMgc3R5bGUuIFNvIGl0IGlzIG5lY2Vzc2FyeSB0byBhcHBseSBhbGwgb3RoZXIgc3R5bGVzIGFnYWluLCBidXQgdGhhdCBpcyBhbHJlYWR5IGhhbmRsZXMgaW5cbiAgICAqIHVpLkNvbXBvbmVudF9VSUJlaGF2aW9yLlxuICAgICpcbiAgICAqIEBtZXRob2QgcmV2ZXJ0XG4gICAgKiBAcGFyYW0ge3VpLk9iamVjdF9VSUVsZW1lbnR9IG9iamVjdCAtIFRoZSBVSSBvYmplY3Qgd2hlcmUgdGhlIHN0eWxlIHNob3VsZCBiZSByZXZlcnRlZC5cbiAgICAjIyMgICAgICAgICAgICAgXG4gICAgcmV2ZXJ0OiAob2JqZWN0KSAtPlxuICAgICAgICBhY3RpdmVTdHlsZXMgPSBvYmplY3QuYWN0aXZlU3R5bGVzXG4gICAgICAgIGlmIG9iamVjdC5hY3RpdmVTdHlsZXMuY29udGFpbnModGhpcylcbiAgICAgICAgICAgIG9iamVjdC5hY3RpdmVTdHlsZXMucmVtb3ZlKHRoaXMpXG4gICAgICAgICAgICBcbiAgICAgICAgICAgIGlmIEBmb250IHRoZW4gb2JqZWN0LmZvbnQuc2V0KGdzLkZvbnRzLlRFWFQpOyAgICAgICAgICAgICAgIChpZiBzLmZvbnQgdGhlbiBvYmplY3QuZm9udC5zZXQocy5mb250KTsgYnJlYWspIGZvciBzIGluIGFjdGl2ZVN0eWxlcyBieSAtMVxuICAgICAgICAgICAgaWYgQGNvbG9yIHRoZW4gb2JqZWN0LmNvbG9yLnNldChDb2xvci5XSElURSk7ICAgICAgICAgICAgICAgKGlmIHMuY29sb3IgdGhlbiBvYmplY3QuY29sb3Iuc2V0KHMuY29sb3IpOyBicmVhaykgZm9yIHMgaW4gYWN0aXZlU3R5bGVzIGJ5IC0xXG4gICAgICAgICAgICBpZiBAdG9uZSB0aGVuIG9iamVjdC50b25lPy5zZXQoMCwgMCwgMCwgMCk7ICAgICAgICAgICAgICAgICAoaWYgcy50b25lIHRoZW4gb2JqZWN0LnRvbmU/LnNldChzLnRvbmUpOyBicmVhaykgZm9yIHMgaW4gYWN0aXZlU3R5bGVzIGJ5IC0xXG4gICAgICAgICAgICBpZiBAaW1hZ2UgdGhlbiBvYmplY3QuaW1hZ2UgPSBudWxsOyAgICAgICAgICAgICAgICAgICAgICAgICAoaWYgcy5pbWFnZSB0aGVuIG9iamVjdC5pbWFnZSA9IHMuaW1hZ2U7IGJyZWFrKSBmb3IgcyBpbiBhY3RpdmVTdHlsZXMgYnkgLTFcbiAgICAgICAgICAgIGlmIEBhbmNob3IgdGhlbiBvYmplY3QuYW5jaG9yLnNldCgwLCAwKTsgICAgICAgICAgICAgICAgICAgIChpZiBzLmFuY2hvciB0aGVuIG9iamVjdC5hbmNob3Iuc2V0RnJvbU9iamVjdChzLmFuY2hvcik7IGJyZWFrKSBmb3IgcyBpbiBhY3RpdmVTdHlsZXMgYnkgLTFcbiAgICAgICAgICAgIGlmIEB6b29tIHRoZW4gb2JqZWN0Lnpvb20uc2V0KDEuMCwgMS4wKTsgICAgICAgICAgICAgICAgICAgIChpZiBzLnpvb20gdGhlbiBvYmplY3Quem9vbS5zZXRGcm9tT2JqZWN0KHMuem9vbSk7IGJyZWFrKSBmb3IgcyBpbiBhY3RpdmVTdHlsZXMgYnkgLTFcbiAgICAgICAgICAgIGlmIEBwYWRkaW5nIHRoZW4gb2JqZWN0LnBhZGRpbmcuc2V0KDAsIDAsIDAsIDApOyAgICAgICAgICAgIChpZiBzLnBhZGRpbmcgdGhlbiBvYmplY3QucGFkZGluZy5zZXRGcm9tT2JqZWN0KHMucGFkZGluZyk7IGJyZWFrKSBmb3IgcyBpbiBhY3RpdmVTdHlsZXMgYnkgLTFcbiAgICAgICAgICAgIGlmIEBtYXJnaW4gdGhlbiBvYmplY3QubWFyZ2luLnNldCgwLCAwLCAwLCAwKTsgICAgICAgICAgICAgIChpZiBzLm1hcmdpbiB0aGVuIG9iamVjdC5tYXJnaW4uc2V0RnJvbU9iamVjdChzLm1hcmdpbik7IGJyZWFrKSBmb3IgcyBpbiBhY3RpdmVTdHlsZXMgYnkgLTFcbiAgICAgICAgICAgIGlmIEBvcGFjaXR5ID49IDAgdGhlbiBvYmplY3Qub3BhY2l0eSA9IDI1NTsgICAgICAgICAgICAgICAgIChpZiBzLm9wYWNpdHkgPj0gMCB0aGVuIG9iamVjdC5vcGFjaXR5ID0gcy5vcGFjaXR5OyBicmVhaykgZm9yIHMgaW4gYWN0aXZlU3R5bGVzIGJ5IC0xXG4gICAgICAgICAgICBpZiBAYWxpZ25tZW50ID49IDAgdGhlbiBvYmplY3QuYWxpZ25tZW50ID0gMDsgICAgICAgICAgICAgICAoaWYgcy5hbGlnbm1lbnQgPj0gMCB0aGVuIG9iamVjdC5hbGlnbm1lbnQgPSBzLmFsaWdubWVudDsgYnJlYWspIGZvciBzIGluIGFjdGl2ZVN0eWxlcyBieSAtMVxuICAgICAgICAgICAgaWYgQGZyYW1lQ29ybmVyU2l6ZSA+PSAwIHRoZW4gb2JqZWN0LmZyYW1lQ29ybmVyU2l6ZSA9IDE2OyAgKGlmIHMuZnJhbWVDb3JuZXJTaXplID49IDAgdGhlbiBvYmplY3QuZnJhbWVDb3JuZXJTaXplID0gcy5mcmFtZUNvcm5lclNpemU7IGJyZWFrKSBmb3IgcyBpbiBhY3RpdmVTdHlsZXMgYnkgLTFcbiAgICAgICAgICAgIGlmIEBmcmFtZVRoaWNrbmVzcyA+PSAwIHRoZW4gb2JqZWN0LmZyYW1lVGhpY2tuZXNzID0gMTY7ICAgIChpZiBzLmZyYW1lVGhpY2tuZXNzID49IDAgdGhlbiBvYmplY3QuZnJhbWVUaGlja25lc3MgPSBzLmZyYW1lVGhpY2tuZXNzOyBicmVhaykgZm9yIHMgaW4gYWN0aXZlU3R5bGVzIGJ5IC0xXG4gICAgICAgICAgICBpZiBAbWFzayB0aGVuIG9iamVjdC5tYXNrLnNldChudWxsKTsgICAgICAgICAgICAgICAgICAgICAgICAoaWYgcy5tYXNrIHRoZW4gb2JqZWN0Lm1hc2suc2V0KHMuZm9udCk7IGJyZWFrKSBmb3IgcyBpbiBhY3RpdmVTdHlsZXMgYnkgLTFcbiAgICAgICAgICAgIGlmIEB6SW5kZXggPj0gMCB0aGVuIG9iamVjdC56SW5kZXggPSAwOyAgICAgICAgICAgICAgICAgICAgIChpZiBzLnpJbmRleCA+PSAwIHRoZW4gb2JqZWN0LnpJbmRleCA9IHMuekluZGV4OyBicmVhaykgZm9yIHMgaW4gYWN0aXZlU3R5bGVzIGJ5IC0xXG4gICAgICAgICAgICBpZiBAYWxpZ25tZW50WCA+PSAwIHRoZW4gb2JqZWN0LmFsaWdubWVudFggPSAwOyAgICAgICAgICAgICAoaWYgcy5hbGlnbm1lbnRYID49IDAgdGhlbiBvYmplY3QuYWxpZ25tZW50WCA9IHMuYWxpZ25tZW50WDsgYnJlYWspIGZvciBzIGluIGFjdGl2ZVN0eWxlcyBieSAtMVxuICAgICAgICAgICAgaWYgQGFsaWdubWVudFkgPj0gMCB0aGVuIG9iamVjdC5hbGlnbm1lbnRZID0gMDsgICAgICAgICAgICAgKGlmIHMuYWxpZ25tZW50WSA+PSAwIHRoZW4gb2JqZWN0LmFsaWdubWVudFkgPSBzLmFsaWdubWVudFk7IGJyZWFrKSBmb3IgcyBpbiBhY3RpdmVTdHlsZXMgYnkgLTFcbiAgICAgICAgICAgIGlmIEByZXNpemFibGU/IHRoZW4gb2JqZWN0LnJlc2l6YWJsZSA9IG5vOyAgICAgICAgICAgICAgICAgIChpZiBzLnJlc2l6YWJsZT8gdGhlbiBvYmplY3QucmVzaXphYmxlID0gcy5yZXNpemFibGU7IGJyZWFrKSBmb3IgcyBpbiBhY3RpdmVTdHlsZXMgYnkgLTFcbiAgICAgICAgICAgIFxuICAgICAgICAgICAgQHJldmVydEFuaW1hdGlvbnMob2JqZWN0KVxuICAgICAgICAgICAgQHJldmVydExvb3Bpbmcob2JqZWN0KVxuICAgICAgICAgICAgICAgICAgICBcbiAgICAjIyMqXG4gICAgKiBSZXZlcnRzIHRoZSBhbmltYXRpb24tZGF0YSBjaGFuZ2VzIGFwcGxpZWQgdG8gYSBVSSBvYmplY3QgYnkgdGhpcyBzdHlsZS5cbiAgICAqXG4gICAgKiBAbWV0aG9kIHJldmVydEFuaW1hdGlvbnNcbiAgICAqIEBwYXJhbSB7dWkuT2JqZWN0X1VJRWxlbWVudH0gb2JqZWN0IC0gVGhlIFVJIG9iamVjdCB3aGVyZSB0aGUgYW5pbWF0aW9uLWRhdGEgY2hhbmdlcyBzaG91bGQgYmUgcmV2ZXJ0ZWQuXG4gICAgIyMjICAgICAgICAgICAgICAgICBcbiAgICByZXZlcnRBbmltYXRpb25zOiAob2JqZWN0KSAtPlxuICAgICAgICBhY3RpdmVTdHlsZXMgPSBvYmplY3QuYWN0aXZlU3R5bGVzXG4gICAgICAgIGlmIEBhbmltYXRpb25zXG4gICAgICAgICAgICBvYmplY3QuYW5pbWF0aW9ucyA9IG51bGw7ICAgICAgICAgICAgICAgXG4gICAgICAgICAgICBmb3IgcyBpbiBhY3RpdmVTdHlsZXMgYnkgLTFcbiAgICAgICAgICAgICAgICBpZiBzLmFuaW1hdGlvbnNcbiAgICAgICAgICAgICAgICAgICAgb2JqZWN0LmFuaW1hdGlvbnMgPSBPYmplY3QuZGVlcENvcHkocy5hbmltYXRpb25zKVxuICAgICAgICAgICAgICAgICAgICBpZiAhb2JqZWN0LmZpbmRDb21wb25lbnRCeUlkKFwiYW5pbWF0aW9uSGFuZGxlclwiKVxuICAgICAgICAgICAgICAgICAgICAgICAgb2JqZWN0LmFkZENvbXBvbmVudChuZXcgdWkuQ29tcG9uZW50X0FuaW1hdGlvbkhhbmRsZXIoKSwgXCJhbmltYXRpb25IYW5kbGVyXCIpXG4gICAgICAgIFxuICAgICMjIypcbiAgICAqIFJldmVydHMgdGhlIGxvb3BpbmctZGF0YSBjaGFuZ2VzIGFwcGxpZWQgdG8gYSBVSSBvYmplY3QgYnkgdGhpcyBzdHlsZS5cbiAgICAqXG4gICAgKiBAbWV0aG9kIHJldmVydExvb3BpbmdcbiAgICAqIEBwYXJhbSB7dWkuT2JqZWN0X1VJRWxlbWVudH0gb2JqZWN0IC0gVGhlIFVJIG9iamVjdCB3aGVyZSB0aGUgbG9vcGluZy1kYXRhIGNoYW5nZXMgc2hvdWxkIGJlIHJldmVydGVkLlxuICAgICMjIyAgICAgICAgICAgICAgICAgXG4gICAgcmV2ZXJ0TG9vcGluZzogKG9iamVjdCkgLT5cbiAgICAgICAgYWN0aXZlU3R5bGVzID0gb2JqZWN0LmFjdGl2ZVN0eWxlc1xuICAgICAgICBpZiBAbG9vcGluZ1xuICAgICAgICAgICAgb2JqZWN0LnZpc3VhbC5sb29waW5nLnZlcnRpY2FsID0gbm9cbiAgICAgICAgICAgIG9iamVjdC52aXN1YWwubG9vcGluZy5ob3Jpem9udGFsID0gbm9cbiAgICAgICAgICAgIGZvciBzIGluIGFjdGl2ZVN0eWxlcyBieSAtMVxuICAgICAgICAgICAgICAgIGlmIHMubG9vcGluZ1xuICAgICAgICAgICAgICAgICAgICBpZiAhb2JqZWN0LnZpc3VhbC5sb29waW5nXG4gICAgICAgICAgICAgICAgICAgICAgICBvYmplY3QudmlzdWFsLmRpc3Bvc2UoKVxuICAgICAgICAgICAgICAgICAgICAgICAgb2JqZWN0LnJlbW92ZUNvbXBvbmVudChvYmplY3QudmlzdWFsKVxuICAgICAgICAgICAgICAgICAgICAgICAgb2JqZWN0LnZpc3VhbCA9IG5ldyBncy5Db21wb25lbnRfVGlsaW5nU3ByaXRlKClcbiAgICAgICAgICAgICAgICAgICAgICAgIG9iamVjdC5hZGRDb21wb25lbnQob2JqZWN0LnZpc3VhbClcbiAgICAgICAgICAgICAgICAgICAgXG4gICAgICAgICAgICAgICAgICAgIG9iamVjdC52aXN1YWwubG9vcGluZy52ZXJ0aWNhbCA9IHMubG9vcGluZy52ZXJ0aWNhbFxuICAgICAgICAgICAgICAgICAgICBvYmplY3QudmlzdWFsLmxvb3BpbmcuaG9yaXpvbnRhbCA9IHMubG9vcGluZy5ob3Jpem9udGFsXG4gICAgICAgICAgICBcbnVpLlN0eWxlID0gU3R5bGVcblxuY2xhc3MgVUlNYW5hZ2VyXG4gICAgIyMjKlxuICAgICogSGFuZGxlcyB0aGUgY3JlYXRpb24gb2YgSW4gR2FtZSBVSSBlbGVtZW50cy4gRm9yIG1vcmUgaW5mb3JtYXRpb24gYWJvdXRcbiAgICAqIEluLUdhbWUgVUkgc2VlIGhlbHAgZmlsZS5cbiAgICAqXG4gICAgKiBAbW9kdWxlIHVpXG4gICAgKiBAY2xhc3MgVUlNYW5hZ2VyXG4gICAgKiBAbWVtYmVyb2YgdWlcbiAgICAqIEBjb25zdHJ1Y3RvclxuICAgICMjI1xuICAgIGNvbnN0cnVjdG9yOiAtPlxuICAgICAgICAjIyMqXG4gICAgICAgICogU3RvcmVzIGFsbCByZWdpc3RlcmVkIFVJIGxheW91dHMgYnkgbmFtZS9pZC5cbiAgICAgICAgKiBAcHJvcGVydHkgbGF5b3V0c1xuICAgICAgICAqIEB0eXBlIE9iamVjdFxuICAgICAgICAjIyNcbiAgICAgICAgQGxheW91dHMgPSB7fVxuICAgICAgICBcbiAgICAgICAgIyMjKlxuICAgICAgICAqIFN0b3JlcyBhbGwgcmVnaXN0ZXJlZCBVSSBzdHlsZXMgYnkgbmFtZS9pZC5cbiAgICAgICAgKiBAcHJvcGVydHkgc3R5bGVzXG4gICAgICAgICogQHR5cGUgT2JqZWN0XG4gICAgICAgICMjI1xuICAgICAgICBAc3R5bGVzID0ge31cbiAgICAgICAgXG4gICAgICAgICMjIypcbiAgICAgICAgKiBTdG9yZXMgYWxsIFVJIHN0eWxlcyBieSBudW1iZXIgaWQuXG4gICAgICAgICogQHByb3BlcnR5IHN0eWxlc0J5SWRcbiAgICAgICAgKiBAdHlwZSB1aS5TdHlsZVtdXG4gICAgICAgICMjI1xuICAgICAgICBAc3R5bGVzQnlJZCA9IG5ldyBBcnJheSgpXG4gICAgICAgIFxuICAgICAgICAjIyMqXG4gICAgICAgICogU3RvcmVzIGFsbCBVSSBzdHlsZXMgYnkgc3R5bGUtbmFtZS5cbiAgICAgICAgKiBAcHJvcGVydHkgc3R5bGVzQnlOYW1lXG4gICAgICAgICogQHR5cGUgT2JqZWN0XG4gICAgICAgICMjI1xuICAgICAgICBAc3R5bGVzQnlOYW1lID0ge31cbiAgICAgICAgXG4gICAgICAgICMjIypcbiAgICAgICAgKiBTdG9yZXMgYWxsIHJlZ2lzdGVyZWQgY3VzdG9tIFVJIHR5cGVzL3RlbXBsYXRlcyBieSBuYW1lL2lkLlxuICAgICAgICAqIEBwcm9wZXJ0eSBjdXN0b21UeXBlc1xuICAgICAgICAqIEB0eXBlIE9iamVjdFxuICAgICAgICAjIyNcbiAgICAgICAgQGN1c3RvbVR5cGVzID0ge31cbiAgICAgICAgXG4gICAgICAgICMjIypcbiAgICAgICAgKiBTdG9yZXMgYWxsIHJlZ2lzdGVyZWQgVUkgY29udHJvbGxlcnMgYnkgbmFtZS9pZC5cbiAgICAgICAgKiBAcHJvcGVydHkgY3VzdG9tVHlwZXNcbiAgICAgICAgKiBAdHlwZSBPYmplY3RcbiAgICAgICAgIyMjXG4gICAgICAgIEBjb250cm9sbGVycyA9IHt9XG4gICAgICAgIFxuICAgICAgICAjIyMqXG4gICAgICAgICogU3RvcmVzIGFsbCByZWdpc3RlcmVkIFVJIGRhdGEgc291cmNlcyBieSBuYW1lL2lkLlxuICAgICAgICAqIEBwcm9wZXJ0eSBjdXN0b21UeXBlc1xuICAgICAgICAqIEB0eXBlIE9iamVjdFxuICAgICAgICAjIyNcbiAgICAgICAgQGRhdGFTb3VyY2VzID0ge31cbiAgICAgICAgXG4gICAgICAgICMjIypcbiAgICAgICAgKiBNYXBwaW5nIHRvIHRhYmxlIHRvIG1hcCBhbGlnbm1lbnQgbmFtZXMgdG8gbnVtYmVyIHZhbHVlcy5cbiAgICAgICAgKiBAcHJvcGVydHkgYWxpZ25tZW50c1xuICAgICAgICAqIEB0eXBlIE9iamVjdFxuICAgICAgICAqIEBwcm90ZWN0ZWRcbiAgICAgICAgIyMjXG4gICAgICAgIEBhbGlnbm1lbnRzID0geyBcImxlZnRcIjogMCwgXCJ0b3BcIjogMCwgXCJjZW50ZXJcIjogMSwgXCJib3R0b21cIjogMiwgXCJyaWdodFwiOiAyLCBcIjBcIjogMCwgXCIxXCI6IDEsIFwiMlwiOiAyIH1cbiAgICAgICAgXG4gICAgICAgICMjIypcbiAgICAgICAgKiBNYXBwaW5nIHRvIHRhYmxlIHRvIG1hcCBibGVuZC1tb2RlIG5hbWVzIHRvIG51bWJlciB2YWx1ZXMuXG4gICAgICAgICogQHByb3BlcnR5IGJsZW5kTW9kZXNcbiAgICAgICAgKiBAdHlwZSBPYmplY3RcbiAgICAgICAgKiBAcHJvdGVjdGVkXG4gICAgICAgICMjI1xuICAgICAgICBAYmxlbmRNb2RlcyA9IHsgXCJub3JtYWxcIjogMCwgXCJhZGRcIjogMSwgXCJzdWJcIjogMiB9XG4gICAgICAgIFxuICAgICAgICAjIyMqXG4gICAgICAgICogTWFwcGluZyB0byB0YWJsZSB0byBtYXAgc2VsZWN0b3IgbmFtZXMgdG8gbnVtYmVyIHZhbHVlcy5cbiAgICAgICAgKiBAcHJvcGVydHkgc2VsZWN0b3JzXG4gICAgICAgICogQHR5cGUgT2JqZWN0XG4gICAgICAgICMjI1xuICAgICAgICBAc2VsZWN0b3JzID0geyBub3JtYWw6IDAsIGhvdmVyOiAxLCBzZWxlY3RlZDogMiwgZW5hYmxlZDogMywgZm9jdXNlZDogNCB9XG4gICAgICAgIEBkZWZhdWx0UGxhY2Vob2xkZXJQYXJhbXMgPSB7fVxuICAgIFxuICAgICMjIypcbiAgICAqIFNldHMgdXAgVUkgTWFuYWdlciwgb3B0aW1pemVzIHN0eWxlcywgZXRjLlxuICAgICpcbiAgICAqIEBtZXRob2Qgc2V0dXBcbiAgICAjIyNcbiAgICBzZXR1cDogLT5cbiAgICAgICAgQHNldHVwU3R5bGVzKClcbiAgICAgICAgXG4gICAgIyMjKlxuICAgICogU2V0cyB1cCB0aGUgVUkgc3R5bGVzIGJ5IHdyYXBwaW5nIHRoZW0gaW50byB1aS5TdHlsZSBvYmplY3RzIGFuZCBvcHRpbWl6aW5nIHRoZSBhY2Nlc3MuXG4gICAgKlxuICAgICogQG1ldGhvZCBzZXR1cFN0eWxlc1xuICAgICogQHByb3RlY3RlZFxuICAgICMjI1xuICAgIHNldHVwU3R5bGVzOiAtPlxuICAgICAgICBpZCA9IDBcbiAgICAgICAgc2VsZWN0b3JNYXAgPSBAc2VsZWN0b3JzXG4gICAgICAgIGZvciBrIG9mIEBzdHlsZXNcbiAgICAgICAgICAgIHN1YnMgPSBrLnNwbGl0KFwiIFwiKVxuICAgICAgICAgICAgc2VsZWN0b3IgPSBzdWJzWzBdLnNwbGl0KFwiOlwiKVxuICAgICAgICAgICAgXG4gICAgICAgICAgICBpZiBzZWxlY3Rvck1hcFtzZWxlY3RvclsxXV1cbiAgICAgICAgICAgICAgICBAc3R5bGVzQnlJZFtpZF0gPSBuZXcgdWkuU3R5bGUoQHN0eWxlc1trXSwgaWQsIHNlbGVjdG9yTWFwW3NlbGVjdG9yWzFdXSlcbiAgICAgICAgICAgIGVsc2VcbiAgICAgICAgICAgICAgICBAc3R5bGVzQnlJZFtpZF0gPSBuZXcgdWkuU3R5bGUoQHN0eWxlc1trXSwgaWQsIDApXG4gICAgICAgICAgICBcbiAgICAgICAgICAgIGlmICFAc3R5bGVzQnlOYW1lW3NlbGVjdG9yWzBdXVxuICAgICAgICAgICAgICAgIEBzdHlsZXNCeU5hbWVbc2VsZWN0b3JbMF1dID0gW11cbiAgICAgICAgICAgICAgICBcbiAgICAgICAgICAgIEBzdHlsZXNCeU5hbWVbc2VsZWN0b3JbMF1dLnB1c2goQHN0eWxlc0J5SWRbaWRdKVxuICAgICAgICAgICAgQHN0eWxlc1trXSA9IEBzdHlsZXNCeUlkW2lkXVxuICAgICAgICAgICAgXG4gICAgICAgICAgICBpZCsrXG4gICAgICAgIFxuICAgICAgICBmb3IgayBvZiBAc3R5bGVzXG4gICAgICAgICAgICBzdWJzID0gay5zcGxpdChcIiBcIilcbiAgICAgICAgICAgIGlmIHN1YnMubGVuZ3RoID4gMVxuICAgICAgICAgICAgICAgIEBzdHlsZXNCeU5hbWVbc3Vic1sxXV0ucHVzaChAc3R5bGVzW2tdKVxuICAgICAgICAgICAgICAgIEBzdHlsZXNba10udGFyZ2V0ID0gQHN0eWxlc1trLnNwbGl0KFwiOlwiKVswXV0/LmlkXG4gICAgICAgICAgICAgICAgI0BzdHlsZXNbc3Vic1sxXV0udGFyZ2V0ID0gQHN0eWxlc1trXS5pZFxuICAgICAgICAgICAgICAgICNAc3R5bGVzW2tdLnRhcmdldCA9IEBzdHlsZXNbc3Vic1sxXV0uaWRcbiAgICAgICAgICAgIFxuICAgICAgICByZXR1cm4gbnVsbFxuICAgICAgICBcbiAgICAjIyMqXG4gICAgKiBFeGVjdXRlcyBhbGwgcGxhY2Vob2xkZXIgZm9ybXVsYXMgaW4gdGhlIHNwZWNpZmllZCBkZXNjcmlwdG9yLiBUaGUgZGVzY3JpcHRvciB3aWxsIGJlIGNoYW5nZWRcbiAgICAqIGFuZCBwbGFjZWhvbGRlciBmb3JtdWxhcyBhcmUgcmVwbGFjZWQgd2l0aCB0aGVpciBldmFsdWF0ZWQgcmVzdWx0IHZhbHVlLlxuICAgICpcbiAgICAqIEBtZXRob2QgZXhlY3V0ZVBsYWNlaG9sZGVyRm9ybXVsYXNcbiAgICAqIEBwYXJhbSB7T2JqZWN0fSBkZXNjcmlwdG9yIC0gVGhlIGRlc2NyaXB0b3IuXG4gICAgKiBAcGFyYW0ge09iamVjdH0gcGFyYW1zIC0gT2JqZWN0IGNvbnRhaW5pbmcgdGhlIHBsYWNlaG9sZGVyIHBhcmFtcy5cbiAgICAqIEBwcm90ZWN0ZWRcbiAgICAjIyMgICAgXG4gICAgZXhlY3V0ZVBsYWNlaG9sZGVyRm9ybXVsYXM6IChkZXNjcmlwdG9yLCBpZCwgcGFyYW1zKSAtPlxuICAgICAgICByZXR1cm4gaWYgbm90IGRlc2NyaXB0b3I/XG4gICAgICAgIGtleXMgPSBPYmplY3Qua2V5cyhkZXNjcmlwdG9yKVxuICAgICAgICAgICAgXG4gICAgICAgIGZvciBrIGluIGtleXNcbiAgICAgICAgICAgIHYgPSBkZXNjcmlwdG9yW2tdXG4gICAgICAgICAgICBpZiB2P1xuICAgICAgICAgICAgICAgIGlmIHYgaW5zdGFuY2VvZiBBcnJheVxuICAgICAgICAgICAgICAgICAgICBmb3IgaSwgYyBpbiB2XG4gICAgICAgICAgICAgICAgICAgICAgICBpZiBpP1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGlmIHR5cGVvZiBpID09IFwib2JqZWN0XCJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgQGV4ZWN1dGVQbGFjZWhvbGRlckZvcm11bGFzKGksIGlkLCBwYXJhbXMpXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgZWxzZSBpZiBjICE9IFwiZXhlY1wiIGFuZCB0eXBlb2YgaSA9PSBcImZ1bmN0aW9uXCJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgd2luZG93LnAgPSBwYXJhbXMgfHwgIEBkZWZhdWx0UGxhY2Vob2xkZXJQYXJhbXNcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgd2luZG93LmQgPSBkZXNjcmlwdG9yXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHZbY10gPSBpKClcbiAgICAgICAgICAgICAgICBlbHNlIGlmIHR5cGVvZiB2ID09IFwib2JqZWN0XCJcbiAgICAgICAgICAgICAgICAgICAgQGV4ZWN1dGVQbGFjZWhvbGRlckZvcm11bGFzKHYsIGlkLCBwYXJhbXMpXG4gICAgICAgICAgICAgICAgZWxzZSBpZiBrICE9IFwiZXhlY19cIiBhbmQgdHlwZW9mIHYgPT0gXCJmdW5jdGlvblwiXG4gICAgICAgICAgICAgICAgICAgIHdpbmRvdy5wID0gcGFyYW1zIHx8IEBkZWZhdWx0UGxhY2Vob2xkZXJQYXJhbXNcbiAgICAgICAgICAgICAgICAgICAgd2luZG93LmQgPSBkZXNjcmlwdG9yXG4gICAgICAgICAgICAgICAgICAgIGRlc2NyaXB0b3Jba10gPSB2KClcbiAgICAgICAgcmV0dXJuIG51bGxcblxuICAgICMjIypcbiAgICAqIENyZWF0ZXMgYSBjYWxjdWxhdGlvbiBmb3IgYSBzcGVjaWZpZWQgZXhwcmVzc2lvbi5cbiAgICAqXG4gICAgKiBAbWV0aG9kIGNyZWF0ZUNhbGNGdW5jdGlvblxuICAgICogQHBhcmFtIHtTdHJpbmd9IGV4cHJlc3Npb24gLSBUaGUgZXhwcmVzc2lvbiB0byBjcmVhdGUgYSBjYWxjdWxhdGlvbiBmdW5jdGlvbiBmb3IuXG4gICAgKiBAcmV0dXJuIHtGdW5jdGlvbn0gVGhlIGNhbGN1bGF0aW9uIGZ1bmN0aW9uLlxuICAgICogQHByb3RlY3RlZFxuICAgICMjIyAgICAgICAgICAgICAgIFxuICAgIGNyZWF0ZUNhbGNGdW5jdGlvbjogKGV4cHJlc3Npb24pIC0+XG4gICAgICAgIGV4cHJlc3Npb24gPSBleHByZXNzaW9uLnJlcGxhY2UoLyhbMC05XSspJS9nbSwgXCIoJDEgLyAxMDAgKiB2KVwiKVxuICAgICAgICByZXR1cm4gZXZhbChcIihmdW5jdGlvbih2KXsgcmV0dXJuIFwiICsgZXhwcmVzc2lvbiArIFwifSlcIilcbiAgICBcbiAgICAjIyMqXG4gICAgKiBDcmVhdGVzIGFuIG9iamVjdCBmcm9tIHRoZSBzcGVjaWZpZWQgb2JqZWN0IHR5cGUuIFRoZSB0eXBlIGhhcyB0aGUgZm9ybWF0XG4gICAgKiA8bmFtZXNwYWNlPi48dHlwZW5hbWU+IGxpa2Ugdm4uQ29tcG9uZW50X0hvdHNwb3QuXG4gICAgKlxuICAgICogQG1ldGhvZCBjcmVhdGVPYmplY3RcbiAgICAqIEBwYXJhbSB7U3RyaW5nfSB0eXBlIC0gVGhlIHR5cGUgbmFtZS5cbiAgICAqIEByZXR1cm4ge09iamVjdH0gVGhlIGNyZWF0ZWQgb2JqZWN0LlxuICAgICogQHByb3RlY3RlZFxuICAgICMjIyAgICAgICAgICAgICBcbiAgICBjcmVhdGVPYmplY3Q6ICh0eXBlKSAtPlxuICAgICAgICBzdWJzID0gdHlwZS5zcGxpdChcIi5cIilcbiAgICAgICAgcmV0dXJuIG5ldyB3aW5kb3dbc3Vic1swXV1bc3Vic1sxXV0oKVxuICAgICAgXG4gICAgIyMjKlxuICAgICogQ3JlYXRlcyBhbiBVSSBvYmplY3QgZnJvbSBhIHNwZWNpZmllZCBVSSBkZXNjcmlwdG9yLlxuICAgICpcbiAgICAqIEBtZXRob2QgY3JlYXRlRnJvbURlc2NyaXB0b3JcbiAgICAqIEBwYXJhbSB7T2JqZWN0fSBkZXNjcmlwdG9yIC0gVGhlIFVJIG9iamVjdCBkZXNjcmlwdG9yLlxuICAgICogQHBhcmFtIHtncy5PYmplY3RfVUlFbGVtZW50fSBwYXJlbnQgLSBUaGUgVUkgcGFyZW50IG9iamVjdC4gKEEgbGF5b3V0IGZvciBleGFtcGxlKS5cbiAgICAqIEByZXR1cm4ge2dzLk9iamVjdF9VSUVsZW1lbnR9IFRoZSBjcmVhdGVkIFVJIG9iamVjdC5cbiAgICAjIyMgICBcbiAgICBjcmVhdGVGcm9tRGVzY3JpcHRvcjogKGRlc2NyaXB0b3IsIHBhcmVudCkgLT5cbiAgICAgICAgY29udHJvbCA9IG51bGxcbiAgICAgICAgXG4gICAgICAgIGZvciBrIG9mIEBjb250cm9sbGVyc1xuICAgICAgICAgICAgaWYgQGNvbnRyb2xsZXJzW2tdLnR5cGU/XG4gICAgICAgICAgICAgICAgQGNvbnRyb2xsZXJzW2tdID0gQGNyZWF0ZU9iamVjdChAY29udHJvbGxlcnNba10udHlwZSlcbiAgICAgICAgICAgIFxuICAgICAgICBAX2NyZWF0ZUZyb21EZXNjcmlwdG9yKGRlc2NyaXB0b3IsIHBhcmVudClcbiAgICBcbiAgICBcbiAgICAjIyMqXG4gICAgKiBDcmVhdGVzIGFuIGltYWdlIGJ1dHRvbiBVSSBvYmplY3QuXG4gICAgKlxuICAgICogQG1ldGhvZCBjcmVhdGVJbWFnZUJ1dHRvblxuICAgICogQHBhcmFtIHtPYmplY3R9IGRlc2NyaXB0b3IgLSBUaGUgVUkgb2JqZWN0IGRlc2NyaXB0b3IuXG4gICAgKiBAcmV0dXJuIHtncy5PYmplY3RfVUlFbGVtZW50fSBUaGUgY3JlYXRlZCBpbWFnZSBidXR0b24gVUkgb2JqZWN0LlxuICAgICMjIyAgXG4gICAgY3JlYXRlSW1hZ2VCdXR0b246IChkZXNjcmlwdG9yKSAtPlxuICAgICAgICBjb250cm9sID0gbmV3IHVpLk9iamVjdF9Ib3RzcG90KGRlc2NyaXB0b3IuaW1hZ2UsIGRlc2NyaXB0b3IuaW1hZ2VIYW5kbGluZykgXG4gICAgICAgICAgICAgICAgXG4gICAgICAgIGNvbnRyb2wuYmVoYXZpb3Iuc291bmQgPSBkZXNjcmlwdG9yLnNvdW5kXG4gICAgICAgIGNvbnRyb2wuYmVoYXZpb3Iuc291bmRzID0gZGVzY3JpcHRvci5zb3VuZHNcbiAgICAgICAgY29udHJvbC5pbWFnZSA9IGRlc2NyaXB0b3IuaW1hZ2VcbiAgICAgICAgY29udHJvbC5pbWFnZXMgPSBkZXNjcmlwdG9yLmltYWdlc1xuICAgICAgICBpZiBkZXNjcmlwdG9yLmltYWdlRm9sZGVyP1xuICAgICAgICAgICAgY29udHJvbC5pbWFnZUZvbGRlciA9IGRlc2NyaXB0b3IuaW1hZ2VGb2xkZXJcbiAgICAgICAgICAgIFxuICAgICAgICBpZiBkZXNjcmlwdG9yLmxvb3Bpbmc/XG4gICAgICAgICAgICBjb250cm9sLnZpc3VhbC5kaXNwb3NlKClcbiAgICAgICAgICAgIGNvbnRyb2wucmVtb3ZlQ29tcG9uZW50KGNvbnRyb2wudmlzdWFsKVxuICAgICAgICAgICAgY29udHJvbC52aXN1YWwgPSBuZXcgZ3MuQ29tcG9uZW50X1RpbGluZ1Nwcml0ZSgpXG4gICAgICAgICAgICBjb250cm9sLmFkZENvbXBvbmVudChjb250cm9sLnZpc3VhbClcbiAgICAgICAgICAgIFxuICAgICAgICAgICAgY29udHJvbC52aXN1YWwubG9vcGluZy52ZXJ0aWNhbCA9IGRlc2NyaXB0b3IubG9vcGluZy52ZXJ0aWNhbFxuICAgICAgICAgICAgY29udHJvbC52aXN1YWwubG9vcGluZy5ob3Jpem9udGFsID0gZGVzY3JpcHRvci5sb29waW5nLmhvcml6b250YWxcbiAgICAgICAgaWYgZGVzY3JpcHRvci5jb2xvcj9cbiAgICAgICAgICAgIGNvbnRyb2wuY29sb3IgPSBDb2xvci5mcm9tQXJyYXkoZGVzY3JpcHRvci5jb2xvcilcbiAgICBcbiAgICAgICAgcmV0dXJuIGNvbnRyb2xcbiAgICBcbiAgICAjIyMqXG4gICAgKiBDcmVhdGVzIGFuIGltYWdlIFVJIG9iamVjdC5cbiAgICAqXG4gICAgKiBAbWV0aG9kIGNyZWF0ZUltYWdlXG4gICAgKiBAcGFyYW0ge09iamVjdH0gZGVzY3JpcHRvciAtIFRoZSBVSSBvYmplY3QgZGVzY3JpcHRvci5cbiAgICAqIEByZXR1cm4ge2dzLk9iamVjdF9VSUVsZW1lbnR9IFRoZSBjcmVhdGVkIGltYWdlIGJ1dHRvbiBVSSBvYmplY3QuXG4gICAgIyMjICAgICBcbiAgICBjcmVhdGVJbWFnZTogKGRlc2NyaXB0b3IpIC0+XG4gICAgICAgIGNvbnRyb2wgPSBuZXcgdWkuT2JqZWN0X0ltYWdlKGRlc2NyaXB0b3IuaW1hZ2UsIGRlc2NyaXB0b3IuaW1hZ2VIYW5kbGluZykgXG4gICAgICAgICAgICAgICAgXG4gICAgICAgIGlmIGRlc2NyaXB0b3IuaW1hZ2VGb2xkZXI/XG4gICAgICAgICAgICBjb250cm9sLmltYWdlRm9sZGVyID0gZGVzY3JpcHRvci5pbWFnZUZvbGRlclxuICAgICAgICAgICAgXG4gICAgICAgIGlmIGRlc2NyaXB0b3IubG9vcGluZz9cbiAgICAgICAgICAgIGNvbnRyb2wudmlzdWFsLmRpc3Bvc2UoKVxuICAgICAgICAgICAgY29udHJvbC5yZW1vdmVDb21wb25lbnQoY29udHJvbC52aXN1YWwpXG4gICAgICAgICAgICBjb250cm9sLnZpc3VhbCA9IG5ldyBncy5Db21wb25lbnRfVGlsaW5nU3ByaXRlKClcbiAgICAgICAgICAgIGNvbnRyb2wuYWRkQ29tcG9uZW50KGNvbnRyb2wudmlzdWFsKVxuICAgICAgICAgICAgXG4gICAgICAgICAgICBjb250cm9sLnZpc3VhbC5sb29waW5nLnZlcnRpY2FsID0gZGVzY3JpcHRvci5sb29waW5nLnZlcnRpY2FsXG4gICAgICAgICAgICBjb250cm9sLnZpc3VhbC5sb29waW5nLmhvcml6b250YWwgPSBkZXNjcmlwdG9yLmxvb3BpbmcuaG9yaXpvbnRhbFxuICAgICAgICBpZiBkZXNjcmlwdG9yLmNvbG9yP1xuICAgICAgICAgICAgY29udHJvbC5jb2xvciA9IENvbG9yLmZyb21BcnJheShkZXNjcmlwdG9yLmNvbG9yKVxuICAgICAgICAgICAgICAgICAgICBcbiAgICAgICAgcmV0dXJuIGNvbnRyb2xcbiAgICBcbiAgICAjIyMqXG4gICAgKiBDcmVhdGVzIGFuIGltYWdlIG1hcCBVSSBvYmplY3QuXG4gICAgKlxuICAgICogQG1ldGhvZCBjcmVhdGVJbWFnZU1hcFxuICAgICogQHBhcmFtIHtPYmplY3R9IGRlc2NyaXB0b3IgLSBUaGUgVUkgb2JqZWN0IGRlc2NyaXB0b3IuXG4gICAgKiBAcmV0dXJuIHtncy5PYmplY3RfVUlFbGVtZW50fSBUaGUgY3JlYXRlZCBpbWFnZSBidXR0b24gVUkgb2JqZWN0LlxuICAgICMjIyAgICAgICAgXG4gICAgY3JlYXRlSW1hZ2VNYXA6IChkZXNjcmlwdG9yKSAtPlxuICAgICAgICBjb250cm9sID0gbmV3IHVpLk9iamVjdF9JbWFnZU1hcCgpXG4gICAgICAgIGNvbnRyb2wuaG90c3BvdHMgPSAoZGVzY3JpcHRvci5ob3RzcG90c3x8W10pLnNlbGVjdCAoaCkgLT4gXG4gICAgICAgICAgICB7IHg6IGgucmVjdFswXSwgeTogaC5yZWN0WzFdLCBzaXplOiB7IHdpZHRoOiBoLnJlY3RbMl0sIGhlaWdodDogaC5yZWN0WzNdIH0sIGRhdGE6IHsgYWN0aW9uOiAzLCBhY3Rpb25zOiBoLmFjdGlvbnMgfSB9XG4gICAgICAgIGNvbnRyb2wuaW1hZ2VzID0gZGVzY3JpcHRvci5pbWFnZXNcbiAgICAgICAgY29udHJvbC5pbnNlcnRDb21wb25lbnQobmV3IHVpLkNvbXBvbmVudF9BY3Rpb25IYW5kbGVyKCksIDEsIFwiYWN0aW9uSGFuZGxlclwiKVxuICAgICAgICBjb250cm9sLnRhcmdldCA9IFNjZW5lTWFuYWdlci5zY2VuZS5iZWhhdmlvclxuICAgICAgICBcbiAgICAgICAgcmV0dXJuIGNvbnRyb2xcbiAgICBcbiAgICAjIyMqXG4gICAgKiBDcmVhdGVzIGEgdmlkZW8gVUkgb2JqZWN0LlxuICAgICpcbiAgICAqIEBtZXRob2QgY3JlYXRlVmlkZW9cbiAgICAqIEBwYXJhbSB7T2JqZWN0fSBkZXNjcmlwdG9yIC0gVGhlIFVJIG9iamVjdCBkZXNjcmlwdG9yLlxuICAgICogQHJldHVybiB7Z3MuT2JqZWN0X1VJRWxlbWVudH0gVGhlIGNyZWF0ZWQgaW1hZ2UgYnV0dG9uIFVJIG9iamVjdC5cbiAgICAjIyMgICAgXG4gICAgY3JlYXRlVmlkZW86IChkZXNjcmlwdG9yKSAtPlxuICAgICAgICBjb250cm9sID0gbmV3IHVpLk9iamVjdF9WaWRlbygpXG4gICAgICAgIGNvbnRyb2wudmlkZW8gPSBkZXNjcmlwdG9yLnZpZGVvXG4gICAgICAgIGNvbnRyb2wubG9vcCA9IGRlc2NyaXB0b3IubG9vcCA/IHllc1xuICAgICAgICBcbiAgICAgICAgcmV0dXJuIGNvbnRyb2xcbiAgICBcbiAgICBcbiAgICAjIyMqXG4gICAgKiBDcmVhdGVzIGEgcGFuZWwgVUkgb2JqZWN0LlxuICAgICpcbiAgICAqIEBtZXRob2QgY3JlYXRlUGFuZWxcbiAgICAqIEBwYXJhbSB7T2JqZWN0fSBkZXNjcmlwdG9yIC0gVGhlIFVJIG9iamVjdCBkZXNjcmlwdG9yLlxuICAgICogQHJldHVybiB7Z3MuT2JqZWN0X1VJRWxlbWVudH0gVGhlIGNyZWF0ZWQgaW1hZ2UgYnV0dG9uIFVJIG9iamVjdC5cbiAgICAjIyMgICAgICAgXG4gICAgY3JlYXRlUGFuZWw6IChkZXNjcmlwdG9yKSAtPlxuICAgICAgICBjb250cm9sID0gbmV3IHVpLk9iamVjdF9QYW5lbCgpXG4gICAgICAgIGNvbnRyb2wubW9kYWwgPSBkZXNjcmlwdG9yLm1vZGFsID8gbm9cbiAgICAgICAgaWYgZGVzY3JpcHRvci5jb2xvcj9cbiAgICAgICAgICAgIGNvbnRyb2wuY29sb3IgPSBDb2xvci5mcm9tQXJyYXkoZGVzY3JpcHRvci5jb2xvcilcbiAgICAgICAgICAgIFxuICAgICAgICByZXR1cm4gY29udHJvbFxuICAgIFxuICAgICMjIypcbiAgICAqIENyZWF0ZXMgYSBmcmFtZSBVSSBvYmplY3QuXG4gICAgKlxuICAgICogQG1ldGhvZCBjcmVhdGVGcmFtZVxuICAgICogQHBhcmFtIHtPYmplY3R9IGRlc2NyaXB0b3IgLSBUaGUgVUkgb2JqZWN0IGRlc2NyaXB0b3IuXG4gICAgKiBAcmV0dXJuIHtncy5PYmplY3RfVUlFbGVtZW50fSBUaGUgY3JlYXRlZCBpbWFnZSBidXR0b24gVUkgb2JqZWN0LlxuICAgICMjIyAgICAgICAgICAgXG4gICAgY3JlYXRlRnJhbWU6IChkZXNjcmlwdG9yKSAtPlxuICAgICAgICBjb250cm9sID0gbmV3IHVpLk9iamVjdF9GcmFtZShkZXNjcmlwdG9yLmZyYW1lU2tpbilcbiAgICAgICAgY29udHJvbC5mcmFtZVRoaWNrbmVzcyA9IGRlc2NyaXB0b3IuZnJhbWVUaGlja25lc3MgfHwgMTZcbiAgICAgICAgY29udHJvbC5mcmFtZUNvcm5lclNpemUgPSBkZXNjcmlwdG9yLmZyYW1lQ29ybmVyU2l6ZSB8fCAxNlxuICAgICAgICBjb250cm9sLmltYWdlID0gZGVzY3JpcHRvci5pbWFnZVxuICAgICAgICBjb250cm9sLmltYWdlcyA9IGRlc2NyaXB0b3IuaW1hZ2VzXG4gICAgICAgIFxuICAgICAgICByZXR1cm4gY29udHJvbFxuICAgIFxuICAgICMjIypcbiAgICAqIENyZWF0ZXMgYSB0aHJlZS1wYXJ0IGltYWdlIFVJIG9iamVjdC5cbiAgICAqXG4gICAgKiBAbWV0aG9kIGNyZWF0ZVRocmVlUGFydEltYWdlXG4gICAgKiBAcGFyYW0ge09iamVjdH0gZGVzY3JpcHRvciAtIFRoZSBVSSBvYmplY3QgZGVzY3JpcHRvci5cbiAgICAqIEByZXR1cm4ge2dzLk9iamVjdF9VSUVsZW1lbnR9IFRoZSBjcmVhdGVkIGltYWdlIGJ1dHRvbiBVSSBvYmplY3QuXG4gICAgIyMjICAgICBcbiAgICBjcmVhdGVUaHJlZVBhcnRJbWFnZTogKGRlc2NyaXB0b3IpIC0+XG4gICAgICAgIGNvbnRyb2wgPSBuZXcgdWkuT2JqZWN0X1RocmVlUGFydEltYWdlKGRlc2NyaXB0b3IuZnJhbWVTa2luKVxuICAgICAgICBjb250cm9sLmZpcnN0UGFydFNpemUgPSBkZXNjcmlwdG9yLmZpcnN0UGFydFNpemUgfHwgMTZcbiAgICAgICAgY29udHJvbC5taWRkbGVQYXJ0U2l6ZSA9IGRlc2NyaXB0b3IubWlkZGxlUGFydFNpemUgfHwgMVxuICAgICAgICBjb250cm9sLmxhc3RQYXJ0U2l6ZSA9IGRlc2NyaXB0b3IubGFzdFBhcnRTaXplIHx8IDE2XG4gICAgICAgIGNvbnRyb2wuaW1hZ2UgPSBkZXNjcmlwdG9yLmltYWdlXG4gICAgICAgIGNvbnRyb2wuaW1hZ2VzID0gZGVzY3JpcHRvci5pbWFnZXNcbiAgICAgICAgXG4gICAgICAgIHJldHVybiBjb250cm9sXG4gICAgIFxuICAgICMjIypcbiAgICAqIENyZWF0ZXMgYSB0ZXh0IFVJIG9iamVjdC5cbiAgICAqXG4gICAgKiBAbWV0aG9kIGNyZWF0ZVRleHRcbiAgICAqIEBwYXJhbSB7T2JqZWN0fSBkZXNjcmlwdG9yIC0gVGhlIFVJIG9iamVjdCBkZXNjcmlwdG9yLlxuICAgICogQHJldHVybiB7Z3MuT2JqZWN0X1VJRWxlbWVudH0gVGhlIGNyZWF0ZWQgaW1hZ2UgYnV0dG9uIFVJIG9iamVjdC5cbiAgICAjIyMgICAgIFxuICAgIGNyZWF0ZVRleHQ6IChkZXNjcmlwdG9yKSAtPlxuICAgICAgICBjb250cm9sID0gbmV3IHVpLk9iamVjdF9UZXh0KClcbiAgICAgICAgY29udHJvbC50ZXh0ID0gbGNzKGRlc2NyaXB0b3IudGV4dClcbiAgICAgICAgY29udHJvbC5zaXplVG9GaXQgPSBkZXNjcmlwdG9yLnNpemVUb0ZpdFxuICAgICAgICBjb250cm9sLmZvcm1hdHRpbmcgPSBkZXNjcmlwdG9yLmZvcm1hdHRpbmdcbiAgICAgICAgY29udHJvbC53b3JkV3JhcCA9IGRlc2NyaXB0b3Iud29yZFdyYXAgPyBub1xuICAgICAgICBjb250cm9sLmJlaGF2aW9yLmZvcm1hdCA9IGRlc2NyaXB0b3IuZm9ybWF0XG4gICAgICAgIGlmIGRlc2NyaXB0b3IudGV4dFBhZGRpbmdcbiAgICAgICAgICAgIGNvbnRyb2wuYmVoYXZpb3IucGFkZGluZyA9IHVpLlNwYWNlLmZyb21BcnJheShkZXNjcmlwdG9yLnRleHRQYWRkaW5nKVxuICAgICAgICBpZiBkZXNjcmlwdG9yLnJlc29sdmVQbGFjZWhvbGRlcnM/XG4gICAgICAgICAgICBjb250cm9sLnJlc29sdmVQbGFjZWhvbGRlcnMgPSBkZXNjcmlwdG9yLnJlc29sdmVQbGFjZWhvbGRlcnNcbiAgICAgICAgaWYgZGVzY3JpcHRvci5jb2xvcj9cbiAgICAgICAgICAgIGNvbnRyb2wuY29sb3IgPSBDb2xvci5mcm9tQXJyYXkoZGVzY3JpcHRvci5jb2xvcilcbiAgICAgICAgICAgIFxuICAgICAgICByZXR1cm4gY29udHJvbFxuICAgIFxuICAgICMjIypcbiAgICAqIENyZWF0ZXMgYSBmcmVlLWxheW91dCBVSSBvYmplY3QuXG4gICAgKlxuICAgICogQG1ldGhvZCBjcmVhdGVGcmVlTGF5b3V0XG4gICAgKiBAcGFyYW0ge09iamVjdH0gZGVzY3JpcHRvciAtIFRoZSBVSSBvYmplY3QgZGVzY3JpcHRvci5cbiAgICAqIEByZXR1cm4ge2dzLk9iamVjdF9VSUVsZW1lbnR9IFRoZSBjcmVhdGVkIGltYWdlIGJ1dHRvbiBVSSBvYmplY3QuXG4gICAgIyMjIFxuICAgIGNyZWF0ZUZyZWVMYXlvdXQ6IChkZXNjcmlwdG9yKSAtPlxuICAgICAgICBpZiBkZXNjcmlwdG9yLmZyYW1lP1xuICAgICAgICAgICAgY29udHJvbCA9IG5ldyB1aS5PYmplY3RfRnJlZUxheW91dChkZXNjcmlwdG9yLmZyYW1lWzBdIHx8IDAsIGRlc2NyaXB0b3IuZnJhbWVbMV0gfHwgMCwgZGVzY3JpcHRvci5mcmFtZVsyXSB8fCAxLCBkZXNjcmlwdG9yLmZyYW1lWzNdIHx8IDEpXG4gICAgICAgIGVsc2VcbiAgICAgICAgICAgIGNvbnRyb2wgPSBuZXcgdWkuT2JqZWN0X0ZyZWVMYXlvdXQoMCwgMCwgMSwgMSlcbiAgICAgICAgY29udHJvbC5zaXplVG9GaXQgPSBkZXNjcmlwdG9yLnNpemVUb0ZpdFxuICAgICAgICBcbiAgICAgICAgcmV0dXJuIGNvbnRyb2xcbiAgICBcbiAgICAjIyMqXG4gICAgKiBDcmVhdGVzIGEgc3RhY2stbGF5b3V0IFVJIG9iamVjdC5cbiAgICAqXG4gICAgKiBAbWV0aG9kIGNyZWF0ZVN0YWNrTGF5b3V0XG4gICAgKiBAcGFyYW0ge09iamVjdH0gZGVzY3JpcHRvciAtIFRoZSBVSSBvYmplY3QgZGVzY3JpcHRvci5cbiAgICAqIEByZXR1cm4ge2dzLk9iamVjdF9VSUVsZW1lbnR9IFRoZSBjcmVhdGVkIGltYWdlIGJ1dHRvbiBVSSBvYmplY3QuXG4gICAgIyMjICAgICBcbiAgICBjcmVhdGVTdGFja0xheW91dDogKGRlc2NyaXB0b3IpIC0+XG4gICAgICAgIGlmIGRlc2NyaXB0b3IuZnJhbWU/XG4gICAgICAgICAgICBjb250cm9sID0gbmV3IHVpLk9iamVjdF9TdGFja0xheW91dChkZXNjcmlwdG9yLmZyYW1lWzBdIHx8IDAsIGRlc2NyaXB0b3IuZnJhbWVbMV0gfHwgMCwgZGVzY3JpcHRvci5mcmFtZVsyXSB8fCAxLCBkZXNjcmlwdG9yLmZyYW1lWzNdIHx8IDEsIGRlc2NyaXB0b3Iub3JpZW50YXRpb24pXG4gICAgICAgIGVsc2VcbiAgICAgICAgICAgIGNvbnRyb2wgPSBuZXcgdWkuT2JqZWN0X1N0YWNrTGF5b3V0KDAsIDAsIDEsIDEsIGRlc2NyaXB0b3Iub3JpZW50YXRpb24pXG4gICAgICAgIGNvbnRyb2wuc2l6ZVRvRml0ID0gZGVzY3JpcHRvci5zaXplVG9GaXRcbiAgICAgICAgXG4gICAgICAgIHJldHVybiBjb250cm9sXG4gICAgXG4gICAgIyMjKlxuICAgICogQ3JlYXRlcyBhIHNwcmVhZC1sYXlvdXQgVUkgb2JqZWN0LlxuICAgICpcbiAgICAqIEBtZXRob2QgY3JlYXRlU3ByZWFkTGF5b3V0XG4gICAgKiBAcGFyYW0ge09iamVjdH0gZGVzY3JpcHRvciAtIFRoZSBVSSBvYmplY3QgZGVzY3JpcHRvci5cbiAgICAqIEByZXR1cm4ge2dzLk9iamVjdF9VSUVsZW1lbnR9IFRoZSBjcmVhdGVkIGltYWdlIGJ1dHRvbiBVSSBvYmplY3QuXG4gICAgIyMjICAgICBcbiAgICBjcmVhdGVTcHJlYWRMYXlvdXQ6IChkZXNjcmlwdG9yKSAtPlxuICAgICAgICBpZiBkZXNjcmlwdG9yLmZyYW1lP1xuICAgICAgICAgICAgY29udHJvbCA9IG5ldyB1aS5PYmplY3RfU3ByZWFkTGF5b3V0KGRlc2NyaXB0b3IuZnJhbWVbMF0gfHwgMCwgZGVzY3JpcHRvci5mcmFtZVsxXSB8fCAwLCBkZXNjcmlwdG9yLmZyYW1lWzJdIHx8IDEsIGRlc2NyaXB0b3IuZnJhbWVbM10gfHwgMSwgZGVzY3JpcHRvci5vcmllbnRhdGlvbilcbiAgICAgICAgZWxzZVxuICAgICAgICAgICAgY29udHJvbCA9IG5ldyB1aS5PYmplY3RfU3ByZWFkTGF5b3V0KDAsIDAsIDEsIDEsIGRlc2NyaXB0b3Iub3JpZW50YXRpb24pXG4gICAgICAgICAgICBcbiAgICAgICAgcmV0dXJuIGNvbnRyb2xcbiAgICAgXG4gICAgIyMjKlxuICAgICogQ3JlYXRlcyBhIGdyaWQtbGF5b3V0IFVJIG9iamVjdC5cbiAgICAqXG4gICAgKiBAbWV0aG9kIGNyZWF0ZUdyaWRMYXlvdXRcbiAgICAqIEBwYXJhbSB7T2JqZWN0fSBkZXNjcmlwdG9yIC0gVGhlIFVJIG9iamVjdCBkZXNjcmlwdG9yLlxuICAgICogQHJldHVybiB7Z3MuT2JqZWN0X1VJRWxlbWVudH0gVGhlIGNyZWF0ZWQgaW1hZ2UgYnV0dG9uIFVJIG9iamVjdC5cbiAgICAjIyMgICAgXG4gICAgY3JlYXRlR3JpZExheW91dDogKGRlc2NyaXB0b3IpIC0+XG4gICAgICAgIGlmIGRlc2NyaXB0b3IuZnJhbWU/XG4gICAgICAgICAgICBjb250cm9sID0gbmV3IHVpLk9iamVjdF9HcmlkTGF5b3V0KGRlc2NyaXB0b3IuZnJhbWVbMF0sIGRlc2NyaXB0b3IuZnJhbWVbMV0sIGRlc2NyaXB0b3IuZnJhbWVbMl0sIGRlc2NyaXB0b3IuZnJhbWVbM10sIGRlc2NyaXB0b3Iucm93cywgZGVzY3JpcHRvci5jb2x1bW5zLCBkZXNjcmlwdG9yLnRlbXBsYXRlKVxuICAgICAgICBlbHNlXG4gICAgICAgICAgICBjb250cm9sID0gbmV3IHVpLk9iamVjdF9HcmlkTGF5b3V0KDAsIDAsIDEsIDEsIGRlc2NyaXB0b3Iucm93cywgZGVzY3JpcHRvci5jb2x1bW5zLCBkZXNjcmlwdG9yLnRlbXBsYXRlKVxuICAgICAgICBjb250cm9sLmNlbGxTcGFjaW5nID0gZGVzY3JpcHRvci5jZWxsU3BhY2luZyB8fCBbMCwgMCwgMCwgMF1cbiAgICAgICAgY29udHJvbC5zaXplVG9GaXQgPSBkZXNjcmlwdG9yLnNpemVUb0ZpdFxuICAgICAgICBcbiAgICAgICAgcmV0dXJuIGNvbnRyb2xcbiAgICAgXG4gICAgIyMjKlxuICAgICogQ3JlYXRlcyBhIG1lc3NhZ2UgVUkgb2JqZWN0LlxuICAgICpcbiAgICAqIEBtZXRob2QgY3JlYXRlTWVzc2FnZVxuICAgICogQHBhcmFtIHtPYmplY3R9IGRlc2NyaXB0b3IgLSBUaGUgVUkgb2JqZWN0IGRlc2NyaXB0b3IuXG4gICAgKiBAcmV0dXJuIHtncy5PYmplY3RfVUlFbGVtZW50fSBUaGUgY3JlYXRlZCBpbWFnZSBidXR0b24gVUkgb2JqZWN0LlxuICAgICMjIyAgICAgXG4gICAgY3JlYXRlTWVzc2FnZTogKGRlc2NyaXB0b3IpIC0+XG4gICAgICAgIGNvbnRyb2wgPSBuZXcgdWkuT2JqZWN0X01lc3NhZ2UoKSBcbiAgICAgICAgXG4gICAgICAgIHJldHVybiBjb250cm9sXG4gICAgIFxuICAgICMjIypcbiAgICAqIENyZWF0ZXMgYSBkYXRhLWdyaWQgVUkgb2JqZWN0LlxuICAgICpcbiAgICAqIEBtZXRob2QgY3JlYXRlRGF0YUdyaWRcbiAgICAqIEBwYXJhbSB7T2JqZWN0fSBkZXNjcmlwdG9yIC0gVGhlIFVJIG9iamVjdCBkZXNjcmlwdG9yLlxuICAgICogQHJldHVybiB7Z3MuT2JqZWN0X1VJRWxlbWVudH0gVGhlIGNyZWF0ZWQgaW1hZ2UgYnV0dG9uIFVJIG9iamVjdC5cbiAgICAjIyMgICAgXG4gICAgY3JlYXRlRGF0YUdyaWQ6IChkZXNjcmlwdG9yKSAtPlxuICAgICAgICBjb250cm9sID0gbmV3IHVpLk9iamVjdF9EYXRhR3JpZChkZXNjcmlwdG9yKVxuICAgICAgICBcbiAgICAgICAgcmV0dXJuIGNvbnRyb2xcbiAgICAgICAgXG4gICAgIyMjKlxuICAgICogQ3JlYXRlcyBhbiBVSSBvYmplY3QgZGVwZW5kaW5nIG9uIHRoZSBvYmplY3QtdHlwZSBvZiB0aGUgc3BlY2lmaWVkIFVJIGRlc2NyaXB0b3IuXG4gICAgKlxuICAgICogQG1ldGhvZCBjcmVhdGVDb250cm9sXG4gICAgKiBAcGFyYW0ge09iamVjdH0gZGVzY3JpcHRvciAtIFRoZSBVSSBvYmplY3QgZGVzY3JpcHRvci5cbiAgICAqIEByZXR1cm4ge2dzLk9iamVjdF9VSUVsZW1lbnR9IFRoZSBjcmVhdGVkIFVJIG9iamVjdC5cbiAgICAqIEBwcm90ZWN0ZWRcbiAgICAjIyMgIFxuICAgIGNyZWF0ZUNvbnRyb2w6IChkZXNjcmlwdG9yKSAtPlxuICAgICAgICBjb250cm9sID0gbnVsbFxuICAgICAgICBcbiAgICAgICAgc3dpdGNoIGRlc2NyaXB0b3IudHlwZVxuICAgICAgICAgICAgd2hlbiBcInVpLkltYWdlQnV0dG9uXCJcbiAgICAgICAgICAgICAgICBjb250cm9sID0gQGNyZWF0ZUltYWdlQnV0dG9uKGRlc2NyaXB0b3IpXG4gICAgICAgICAgICB3aGVuIFwidWkuSW1hZ2VcIlxuICAgICAgICAgICAgICAgIGNvbnRyb2wgPSBAY3JlYXRlSW1hZ2UoZGVzY3JpcHRvcilcbiAgICAgICAgICAgIHdoZW4gXCJ1aS5JbWFnZU1hcFwiXG4gICAgICAgICAgICAgICAgY29udHJvbCA9IEBjcmVhdGVJbWFnZU1hcChkZXNjcmlwdG9yKVxuICAgICAgICAgICAgd2hlbiBcInVpLlZpZGVvXCJcbiAgICAgICAgICAgICAgICBjb250cm9sID0gQGNyZWF0ZVZpZGVvKGRlc2NyaXB0b3IpXG4gICAgICAgICAgICB3aGVuIFwidWkuUGFuZWxcIlxuICAgICAgICAgICAgICAgIGNvbnRyb2wgPSBAY3JlYXRlUGFuZWwoZGVzY3JpcHRvcilcbiAgICAgICAgICAgIHdoZW4gXCJ1aS5GcmFtZVwiXG4gICAgICAgICAgICAgICAgY29udHJvbCA9IEBjcmVhdGVGcmFtZShkZXNjcmlwdG9yKVxuICAgICAgICAgICAgd2hlbiBcInVpLlRocmVlUGFydEltYWdlXCJcbiAgICAgICAgICAgICAgICBjb250cm9sID0gQGNyZWF0ZVRocmVlUGFydEltYWdlKGRlc2NyaXB0b3IpXG4gICAgICAgICAgICB3aGVuIFwidWkuVGV4dFwiXG4gICAgICAgICAgICAgICAgY29udHJvbCA9IEBjcmVhdGVUZXh0KGRlc2NyaXB0b3IpXG4gICAgICAgICAgICB3aGVuIFwidWkuTWVzc2FnZVwiXG4gICAgICAgICAgICAgICAgY29udHJvbCA9IEBjcmVhdGVNZXNzYWdlKGRlc2NyaXB0b3IpXG4gICAgICAgICAgICB3aGVuIFwidWkuRGF0YUdyaWRcIlxuICAgICAgICAgICAgICAgIGNvbnRyb2wgPSBAY3JlYXRlRGF0YUdyaWQoZGVzY3JpcHRvcilcbiAgICAgICAgICAgIHdoZW4gXCJ1aS5GcmVlTGF5b3V0XCJcbiAgICAgICAgICAgICAgICBjb250cm9sID0gQGNyZWF0ZUZyZWVMYXlvdXQoZGVzY3JpcHRvcilcbiAgICAgICAgICAgIHdoZW4gXCJ1aS5TdGFja0xheW91dFwiXG4gICAgICAgICAgICAgICAgY29udHJvbCA9IEBjcmVhdGVTdGFja0xheW91dChkZXNjcmlwdG9yKVxuICAgICAgICAgICAgd2hlbiBcInVpLlNwcmVhZExheW91dFwiXG4gICAgICAgICAgICAgICAgY29udHJvbCA9IEBjcmVhdGVTcHJlYWRMYXlvdXQoZGVzY3JpcHRvcilcbiAgICAgICAgICAgIHdoZW4gXCJ1aS5HcmlkTGF5b3V0XCJcbiAgICAgICAgICAgICAgICBjb250cm9sID0gQGNyZWF0ZUdyaWRMYXlvdXQoZGVzY3JpcHRvcilcbiAgICAgICAgICAgICAgICBcbiAgICAgICAgcmV0dXJuIGNvbnRyb2xcbiAgICBcbiAgICBcbiAgICBjcmVhdGVMYXlvdXRSZWN0OiAoZnJhbWUsIGNvbnRyb2wpIC0+XG4gICAgICAgIGlmICFjb250cm9sLmxheW91dFJlY3RcbiAgICAgICAgICAgIGNvbnRyb2wubGF5b3V0UmVjdCA9IG5ldyB1aS5MYXlvdXRSZWN0KClcbiAgICAgICAgY29udHJvbC5sYXlvdXRSZWN0LnNldCgwLCAwLCAwLCAwKVxuICAgICAgICBcbiAgICAgICAgaWYgZnJhbWU/XG4gICAgICAgICAgICBpZiBmcmFtZVswXT8ubGVuZ3RoP1xuICAgICAgICAgICAgICAgIGNvbnRyb2wubGF5b3V0UmVjdC54ID0gQGNyZWF0ZUNhbGNGdW5jdGlvbihmcmFtZVswXSlcbiAgICAgICAgICAgICAgICBjb250cm9sLmRzdFJlY3QueCA9IDBcbiAgICAgICAgICAgIGVsc2VcbiAgICAgICAgICAgICAgICBjb250cm9sLmRzdFJlY3QueCA9IChkZXNjcmlwdG9yLmZyYW1lWzBdID8gY29udHJvbC5kc3RSZWN0LngpXG4gICAgICAgICAgICAgICAgXG4gICAgICAgICAgICBpZiBmcmFtZVsxXT8ubGVuZ3RoP1xuICAgICAgICAgICAgICAgIGNvbnRyb2wubGF5b3V0UmVjdC55ID0gQGNyZWF0ZUNhbGNGdW5jdGlvbihmcmFtZVsxXSlcbiAgICAgICAgICAgICAgICBjb250cm9sLmRzdFJlY3QueSA9IDBcbiAgICAgICAgICAgIGVsc2VcbiAgICAgICAgICAgICAgICBjb250cm9sLmRzdFJlY3QueSA9IChmcmFtZVsxXSA/IGNvbnRyb2wuZHN0UmVjdC55KVxuICAgICAgICAgICAgICAgIFxuICAgICAgICAgICAgaWYgZnJhbWVbMl0/Lmxlbmd0aD9cbiAgICAgICAgICAgICAgICBjb250cm9sLmxheW91dFJlY3Qud2lkdGggPSBAY3JlYXRlQ2FsY0Z1bmN0aW9uKGZyYW1lWzJdKVxuICAgICAgICAgICAgICAgIGNvbnRyb2wuZHN0UmVjdC53aWR0aCA9IDFcbiAgICAgICAgICAgIGVsc2VcbiAgICAgICAgICAgICAgICBjb250cm9sLmRzdFJlY3Qud2lkdGggPSAoZnJhbWVbMl0gPyBjb250cm9sLmRzdFJlY3Qud2lkdGgpXG4gICAgICAgICAgICAgICAgXG4gICAgICAgICAgICBpZiBmcmFtZVszXT8ubGVuZ3RoP1xuICAgICAgICAgICAgICAgIGNvbnRyb2wubGF5b3V0UmVjdC5oZWlnaHQgPSBAY3JlYXRlQ2FsY0Z1bmN0aW9uKGZyYW1lWzNdKVxuICAgICAgICAgICAgICAgIGNvbnRyb2wuZHN0UmVjdC5oZWlnaHQgPSAxXG4gICAgICAgICAgICBlbHNlXG4gICAgICAgICAgICAgICAgY29udHJvbC5kc3RSZWN0LmhlaWdodCA9IChmcmFtZVszXSA/IGNvbnRyb2wuZHN0UmVjdC5oZWlnaHQpXG4gICAgIFxuICAgIFxuICAgICMjIypcbiAgICAqIEFkZHMgdGhlIHN0eWxlcyBkZWZpbmVkIGluIGFuIGFycmF5IG9mIHN0eWxlLW5hbWVzIHRvIHRoZSBzcGVjaWZpZWQgY29udHJvbC5cbiAgICAqXG4gICAgKiBAbWV0aG9kIGFkZENvbnRyb2xTdHlsZXNcbiAgICAqIEBwYXJhbSB7T2JqZWN0fSBjb250cm9sIC0gVGhlIGNvbnRyb2wgdG8gYWRkIHRoZSBzdHlsZXMgdG8uXG4gICAgKiBAcGFyYW0ge3N0cmluZ1tdfSBzdHlsZXMgLSBBcnJheSBvZiBzdHlsZS1uYW1lcyB0byBhZGQuXG4gICAgIyMjICAgICBcbiAgICBhZGRDb250cm9sU3R5bGVzOiAoY29udHJvbCwgc3R5bGVzKSAtPlxuICAgICAgICBmb3Igc3R5bGVOYW1lIGluIHN0eWxlc1xuICAgICAgICAgICAgaWYgQHN0eWxlc0J5TmFtZVtzdHlsZU5hbWVdP1xuICAgICAgICAgICAgICAgIGZvciBzdHlsZSBpbiBAc3R5bGVzQnlOYW1lW3N0eWxlTmFtZV1cbiAgICAgICAgICAgICAgICAgICAgY29udHJvbC5zdHlsZXMucHVzaChzdHlsZSlcbiAgICAgICAgICAgICAgICAgICAgaWYgc3R5bGUudGFyZ2V0ID09IC0xIGFuZCBzdHlsZS5zZWxlY3RvciA9PSAwXG4gICAgICAgICAgICAgICAgICAgICAgICBzdHlsZS5hcHBseShjb250cm9sKVxuICAgICMjIypcbiAgICAqIENyZWF0ZXMgYW4gVUkgb2JqZWN0IGZyb20gYSBzcGVjaWZpZWQgVUkgZGVzY3JpcHRvci4gVGhpcyBtZXRob2QgaXMgY2FsbGVkXG4gICAgKiByZWN1cnNpdmVseSBmb3IgYWxsIGNoaWxkLWRlc2NyaXB0b3JzLlxuICAgICpcbiAgICAqIEBtZXRob2QgY3JlYXRlQ29udHJvbEZyb21EZXNjcmlwdG9yXG4gICAgKiBAcGFyYW0ge09iamVjdH0gZGVzY3JpcHRvciAtIFRoZSBVSSBvYmplY3QgZGVzY3JpcHRvci5cbiAgICAqIEBwYXJhbSB7Z3MuT2JqZWN0X1VJRWxlbWVudH0gcGFyZW50IC0gVGhlIFVJIHBhcmVudCBvYmplY3QuIChBIGxheW91dCBmb3IgZXhhbXBsZSkuXG4gICAgKiBAcGFyYW0ge251bWJlcn0gaW5kZXggLSBUaGUgaW5kZXguXG4gICAgKiBAcmV0dXJuIHtncy5PYmplY3RfVUlFbGVtZW50fSBUaGUgY3JlYXRlZCBVSSBvYmplY3QuXG4gICAgKiBAcHJvdGVjdGVkXG4gICAgIyMjICAgICAgICBcbiAgICBjcmVhdGVDb250cm9sRnJvbURlc2NyaXB0b3I6IChkZXNjcmlwdG9yLCBwYXJlbnQsIGluZGV4KSAtPlxuICAgICAgICBjb250cm9sID0gbnVsbFxuICAgICAgICBcbiAgICAgICAgaWYgZGVzY3JpcHRvci5zdHlsZT9cbiAgICAgICAgICAgIGRlc2NyaXB0b3Iuc3R5bGVzID0gW2Rlc2NyaXB0b3Iuc3R5bGVdXG4gICAgICAgICAgICBkZWxldGUgZGVzY3JpcHRvci5zdHlsZVxuICAgICAgICAgICAgXG4gICAgICAgIGRlc2NyaXB0b3IgPSBPYmplY3QuZGVlcENvcHkoZGVzY3JpcHRvcilcbiAgICAgICAgQGV4ZWN1dGVQbGFjZWhvbGRlckZvcm11bGFzKGRlc2NyaXB0b3IsIGRlc2NyaXB0b3IuaWQsIGRlc2NyaXB0b3IucGFyYW1zKVxuICAgICAgICAgICAgXG4gICAgICAgIGNvbnRyb2wgPSBAY3JlYXRlQ29udHJvbChkZXNjcmlwdG9yKVxuICAgICAgICBcbiAgICAgICAgaWYgbm90IGNvbnRyb2w/XG4gICAgICAgICAgICB0eXBlID0gT2JqZWN0LmRlZXBDb3B5KEBjdXN0b21UeXBlc1tkZXNjcmlwdG9yLnR5cGVdKVxuICAgICAgICAgICAgXG4gICAgICAgICAgICBAZXhlY3V0ZVBsYWNlaG9sZGVyRm9ybXVsYXModHlwZSwgZGVzY3JpcHRvci5pZCwgZGVzY3JpcHRvci5wYXJhbXMpXG4gICAgICAgXG4gICAgICAgICAgICB0eXBlTmFtZSA9IHR5cGUudHlwZVxuICAgICAgICAgICAgY3VzdG9tRmllbGRzID0gdHlwZS5jdXN0b21GaWVsZHNcbiAgICAgICAgICAgIGJpbmRpbmdzID0gdHlwZS5iaW5kaW5nc1xuICAgICAgICAgICAgZm9ybXVsYXMgPSB0eXBlLmZvcm11bGFzXG4gICAgICAgICAgICBhY3Rpb25zID0gdHlwZS5hY3Rpb25zXG4gICAgICAgICAgICBpZiB0eXBlLnN0eWxlP1xuICAgICAgICAgICAgICAgIHR5cGUuc3R5bGVzID0gW3R5cGUuc3R5bGVdXG4gICAgICAgICAgICAgICAgdHlwZS5zdHlsZSA9IG51bGxcbiAgICAgICAgICAgICAgICBcbiAgICAgICAgICAgIE9iamVjdC5taXhpbih0eXBlLCBkZXNjcmlwdG9yKVxuICAgICAgICAgICAgaWYgY3VzdG9tRmllbGRzPyB0aGVuIE9iamVjdC5taXhpbih0eXBlLmN1c3RvbUZpZWxkcywgY3VzdG9tRmllbGRzKVxuICAgICAgICAgICAgaWYgYmluZGluZ3M/IGFuZCBiaW5kaW5ncyAhPSB0eXBlLmJpbmRpbmdzIHRoZW4gdHlwZS5iaW5kaW5ncyA9IHR5cGUuYmluZGluZ3MuY29uY2F0KGJpbmRpbmdzKVxuICAgICAgICAgICAgaWYgZm9ybXVsYXM/IGFuZCBmb3JtdWxhcyAhPSB0eXBlLmZvcm11bGFzIHRoZW4gdHlwZS5mb3JtdWxhcyA9IHR5cGUuZm9ybXVsYXMuY29uY2F0KGZvcm11bGFzKVxuICAgICAgICAgICAgaWYgYWN0aW9ucz8gYW5kIGFjdGlvbnMgIT0gdHlwZS5hY3Rpb25zIHRoZW4gdHlwZS5hY3Rpb25zID0gYWN0aW9ucy5jb25jYXQodHlwZS5hY3Rpb25zKVxuICAgICAgICAgICAgdHlwZS50eXBlID0gdHlwZU5hbWVcbiAgICAgICAgICAgIFxuICAgICAgICAgICAgcmV0dXJuIEBjcmVhdGVDb250cm9sRnJvbURlc2NyaXB0b3IodHlwZSwgcGFyZW50KVxuICAgICAgICBlbHNlIGlmIHBhcmVudD9cbiAgICAgICAgICAgIHBhcmVudC5hZGRPYmplY3QoY29udHJvbClcbiAgICAgICAgICAgIGNvbnRyb2wuaW5kZXggPSBpbmRleFxuICAgICAgICBlbHNlXG4gICAgICAgICAgICBncy5PYmplY3RNYW5hZ2VyLmN1cnJlbnQuYWRkT2JqZWN0KGNvbnRyb2wpXG4gICAgICAgICBcbiAgICAgICAgY29udHJvbC51aSA9IG5ldyB1aS5Db21wb25lbnRfVUlCZWhhdmlvcigpXG4gICAgICAgIGNvbnRyb2wuYWRkQ29tcG9uZW50KGNvbnRyb2wudWkpXG4gICAgICAgIFxuICAgICAgICAgICAgICAgIFxuICAgICAgICAgICAgICAgICAgICBcbiAgICAgICAgY29udHJvbC5wYXJhbXMgPSBkZXNjcmlwdG9yLnBhcmFtc1xuICAgICAgICBcbiAgICAgICAgaWYgZGVzY3JpcHRvci51cGRhdGVCZWhhdmlvciA9PSBcImNvbnRpbnVvdXNcIlxuICAgICAgICAgICAgY29udHJvbC51cGRhdGVCZWhhdmlvciA9IHVpLlVwZGF0ZUJlaGF2aW9yLkNPTlRJTlVPVVNcbiAgICAgICAgICAgIFxuICAgICAgICBpZiBkZXNjcmlwdG9yLmluaGVyaXRQcm9wZXJ0aWVzXG4gICAgICAgICAgICBjb250cm9sLmluaGVyaXRQcm9wZXJ0aWVzID0geWVzXG4gICAgICAgICAgICBcbiAgICAgICAgaWYgZGVzY3JpcHRvci5mb250P1xuICAgICAgICAgICAgY29udHJvbC5mb250ID0gbmV3IEZvbnQoZGVzY3JpcHRvci5mb250Lm5hbWUsIGRlc2NyaXB0b3IuZm9udC5zaXplKVxuICAgICAgICAgICAgY29udHJvbC5mb250LmJvbGQgPSBkZXNjcmlwdG9yLmZvbnQuYm9sZCA/IGNvbnRyb2wuZm9udC5ib2xkXG4gICAgICAgICAgICBjb250cm9sLmZvbnQuaXRhbGljID0gZGVzY3JpcHRvci5mb250Lml0YWxpYyA/IGNvbnRyb2wuZm9udC5pdGFsaWNcbiAgICAgICAgICAgIGNvbnRyb2wuZm9udC5zbWFsbENhcHMgPSBkZXNjcmlwdG9yLmZvbnQuc21hbGxDYXBzID8gY29udHJvbC5mb250LnNtYWxsQ2Fwc1xuICAgICAgICAgICAgY29udHJvbC5mb250LnVuZGVybGluZSA9IGRlc2NyaXB0b3IuZm9udC51bmRlcmxpbmUgPyBjb250cm9sLmZvbnQudW5kZXJsaW5lXG4gICAgICAgICAgICBjb250cm9sLmZvbnQuc3RyaWtlVGhyb3VnaCA9IGRlc2NyaXB0b3IuZm9udC5zdHJpa2VUaHJvdWdoID8gY29udHJvbC5mb250LnN0cmlrZVRocm91Z2hcbiAgICAgICAgICAgIFxuICAgICAgICAgICAgaWYgZGVzY3JpcHRvci5mb250LmNvbG9yP1xuICAgICAgICAgICAgICAgIGNvbnRyb2wuZm9udC5jb2xvciA9IENvbG9yLmZyb21BcnJheShkZXNjcmlwdG9yLmZvbnQuY29sb3IpXG4gICAgICAgICAgICBpZiBkZXNjcmlwdG9yLmZvbnQuYm9yZGVyP1xuICAgICAgICAgICAgICAgIGNvbnRyb2wuZm9udC5ib3JkZXIgPSBkZXNjcmlwdG9yLmZvbnQuYm9yZGVyID8gbm9cbiAgICAgICAgICAgICAgICBjb250cm9sLmZvbnQuYm9yZGVyU2l6ZSA9IGRlc2NyaXB0b3IuZm9udC5ib3JkZXJTaXplID8gNFxuICAgICAgICAgICAgICAjaWYgZGVzY3JpcHRvci5mb250LmJvcmRlci5jb2xvclxuICAgICAgICAgICAgIyAgICAgICAgY29udHJvbC5mb250LmJvcmRlckNvbG9yID0gQ29sb3IuZnJvbUFycmF5KGRlc2NyaXB0b3IuZm9udC5ib3JkZXIuY29sb3IpXG4gICAgICAgICAgICAgICAgY29udHJvbC5mb250LmJvcmRlckNvbG9yID0gbmV3IENvbG9yKDAsIDAsIDApXG4gICAgICAgICAgICAgICAgXG4gICAgICAgICAgICBpZiBkZXNjcmlwdG9yLmZvbnQub3V0bGluZT9cbiAgICAgICAgICAgICAgICBjb250cm9sLmZvbnQuYm9yZGVyID0gZGVzY3JpcHRvci5mb250Lm91dGxpbmUgPyBub1xuICAgICAgICAgICAgICAgIGNvbnRyb2wuZm9udC5ib3JkZXJTaXplID0gZGVzY3JpcHRvci5mb250Lm91dGxpbmUuc2l6ZSA/IDRcbiAgICAgICAgICAgICAgICBcbiAgICAgICAgICAgICAgICBpZiBkZXNjcmlwdG9yLmZvbnQub3V0bGluZS5jb2xvcj9cbiAgICAgICAgICAgICAgICAgICAgY29udHJvbC5mb250LmJvcmRlckNvbG9yID0gQ29sb3IuZnJvbUFycmF5KGRlc2NyaXB0b3IuZm9udC5vdXRsaW5lLmNvbG9yKVxuICAgICAgICAgICAgICAgIGVsc2VcbiAgICAgICAgICAgICAgICAgICAgY29udHJvbC5mb250LmJvcmRlckNvbG9yID0gbmV3IENvbG9yKDAsIDAsIDApXG4gICAgICAgICAgICAgICAgICAgICAgICBcbiAgICAgICAgaWYgZGVzY3JpcHRvci5jb21wb25lbnRzP1xuICAgICAgICAgICAgZm9yIGMgaW4gZGVzY3JpcHRvci5jb21wb25lbnRzXG4gICAgICAgICAgICAgICAgbSA9IGMubW9kdWxlIHx8IFwiZ3NcIlxuICAgICAgICAgICAgICAgIGNvbXBvbmVudCA9IG5ldyB3aW5kb3dbbV1bYy50eXBlXShjLnBhcmFtcylcbiAgICAgICAgICAgICAgICBjb250cm9sLmFkZENvbXBvbmVudChjb21wb25lbnQsIGMuaWQpXG4gICAgICAgICAgICAgICAgY29udHJvbFtjLmlkXSA9IGNvbXBvbmVudFxuICAgICAgICAgICAgICAgICNjb21wb25lbnQuc2V0dXA/KClcbiAgICAgICAgIFxuICAgICAgICBjb250cm9sLmZvY3VzYWJsZSA9IGRlc2NyaXB0b3IuZm9jdXNhYmxlID8gY29udHJvbC5mb2N1c2FibGUgICAgICAgXG4gICAgICAgIGlmIGRlc2NyaXB0b3IubmV4dEtleU9iamVjdFxuICAgICAgICAgICAgY29udHJvbC51aS5uZXh0S2V5T2JqZWN0SWQgPSBkZXNjcmlwdG9yLm5leHRLZXlPYmplY3RcbiAgICAgICAgXG4gICAgICAgIGlmIGRlc2NyaXB0b3IuaW5pdGlhbEZvY3VzXG4gICAgICAgICAgICBjb250cm9sLnVpLmZvY3VzKClcbiAgICAgICAgICAgIFxuICAgICAgICBhY3Rpb25zID0gT2JqZWN0LmRlZXBDb3B5KGlmIGRlc2NyaXB0b3IuYWN0aW9uPyB0aGVuIFtkZXNjcmlwdG9yLmFjdGlvbl0gZWxzZSBkZXNjcmlwdG9yLmFjdGlvbnMpIFxuICAgICAgICBpZiBhY3Rpb25zP1xuICAgICAgICAgICAgZm9yIGFjdGlvbiBpbiBhY3Rpb25zXG4gICAgICAgICAgICAgICAgaWYgYWN0aW9uP1xuICAgICAgICAgICAgICAgICAgICBhY3Rpb24uZXZlbnQgPSBhY3Rpb24uZXZlbnQgPyBcIm9uQWNjZXB0XCJcbiAgICAgICAgICAgICAgICAgICAgaWYgbm90IGFjdGlvbi50YXJnZXQ/XG4gICAgICAgICAgICAgICAgICAgICAgICB0YXJnZXQgPSBpZiBAY29udHJvbGxlcnM/IHRoZW4gQGNvbnRyb2xsZXJzW2Rlc2NyaXB0b3IudGFyZ2V0XSBlbHNlIGNvbnRyb2xsZXJcbiAgICAgICAgICAgICAgICAgICAgICAgIGFjdGlvbi50YXJnZXQgPSB0YXJnZXQgfHwgU2NlbmVNYW5hZ2VyLnNjZW5lLmJlaGF2aW9yXG4gICAgICAgICAgICBcbiAgICAgICAgICAgIGNvbnRyb2wuYWN0aW9ucyA9IGFjdGlvbnNcbiAgICAgICAgICAgIFxuICAgICAgICAgICAgaWYoIWNvbnRyb2wuZmluZENvbXBvbmVudEJ5SWQoXCJhY3Rpb25IYW5kbGVyXCIpKVxuICAgICAgICAgICAgICAgIGNvbnRyb2wuaW5zZXJ0Q29tcG9uZW50KG5ldyB1aS5Db21wb25lbnRfQWN0aW9uSGFuZGxlcigpLCAxLCBcImFjdGlvbkhhbmRsZXJcIilcbiAgICAgICAgXG4gICAgICAgIGlmIGRlc2NyaXB0b3IuaWQ/XG4gICAgICAgICAgICBjb250cm9sLmlkID0gZGVzY3JpcHRvci5pZFxuICAgICAgICAgICAgZ3MuT2JqZWN0TWFuYWdlci5jdXJyZW50LnNldE9iamVjdEJ5SWQoY29udHJvbCwgY29udHJvbC5pZClcbiAgICAgICAgICAgIFxuICAgICAgICBjb250cm9sLmRlc2NyaXB0b3IgPSBkZXNjcmlwdG9yXG4gICAgICAgIGNvbnRyb2wubGF5b3V0UmVjdCA9IG5ldyBSZWN0KClcbiAgICAgICAgY29udHJvbC5sYXlvdXRSZWN0LnNldCgwLCAwLCAwLCAwKVxuICAgICAgICBpZiBkZXNjcmlwdG9yLmZyYW1lP1xuICAgICAgICAgICAgaWYgZGVzY3JpcHRvci5mcmFtZVswXT8ubGVuZ3RoP1xuICAgICAgICAgICAgICAgIGNvbnRyb2wubGF5b3V0UmVjdC54ID0gQGNyZWF0ZUNhbGNGdW5jdGlvbihkZXNjcmlwdG9yLmZyYW1lWzBdKVxuICAgICAgICAgICAgICAgIGNvbnRyb2wuZHN0UmVjdC54ID0gMFxuICAgICAgICAgICAgZWxzZVxuICAgICAgICAgICAgICAgIGNvbnRyb2wuZHN0UmVjdC54ID0gKGRlc2NyaXB0b3IuZnJhbWVbMF0gPyBjb250cm9sLmRzdFJlY3QueClcbiAgICAgICAgICAgICAgICBcbiAgICAgICAgICAgIGlmIGRlc2NyaXB0b3IuZnJhbWVbMV0/Lmxlbmd0aD9cbiAgICAgICAgICAgICAgICBjb250cm9sLmxheW91dFJlY3QueSA9IEBjcmVhdGVDYWxjRnVuY3Rpb24oZGVzY3JpcHRvci5mcmFtZVsxXSlcbiAgICAgICAgICAgICAgICBjb250cm9sLmRzdFJlY3QueSA9IDBcbiAgICAgICAgICAgIGVsc2VcbiAgICAgICAgICAgICAgICBjb250cm9sLmRzdFJlY3QueSA9IChkZXNjcmlwdG9yLmZyYW1lWzFdID8gY29udHJvbC5kc3RSZWN0LnkpXG4gICAgICAgICAgICAgICAgXG4gICAgICAgICAgICBpZiBkZXNjcmlwdG9yLmZyYW1lWzJdPy5sZW5ndGg/XG4gICAgICAgICAgICAgICAgY29udHJvbC5sYXlvdXRSZWN0LndpZHRoID0gQGNyZWF0ZUNhbGNGdW5jdGlvbihkZXNjcmlwdG9yLmZyYW1lWzJdKVxuICAgICAgICAgICAgICAgIGNvbnRyb2wuZHN0UmVjdC53aWR0aCA9IDFcbiAgICAgICAgICAgIGVsc2VcbiAgICAgICAgICAgICAgICBjb250cm9sLmRzdFJlY3Qud2lkdGggPSAoZGVzY3JpcHRvci5mcmFtZVsyXSA/IGNvbnRyb2wuZHN0UmVjdC53aWR0aClcbiAgICAgICAgICAgICAgICBcbiAgICAgICAgICAgIGlmIGRlc2NyaXB0b3IuZnJhbWVbM10/Lmxlbmd0aD9cbiAgICAgICAgICAgICAgICBjb250cm9sLmxheW91dFJlY3QuaGVpZ2h0ID0gQGNyZWF0ZUNhbGNGdW5jdGlvbihkZXNjcmlwdG9yLmZyYW1lWzNdKSAjcGFyc2VJbnQoZGVzY3JpcHRvci5mcmFtZVszXS5zcGxpdChcIiVcIilbMF0pXG4gICAgICAgICAgICAgICAgY29udHJvbC5kc3RSZWN0LmhlaWdodCA9IDFcbiAgICAgICAgICAgIGVsc2VcbiAgICAgICAgICAgICAgICBjb250cm9sLmRzdFJlY3QuaGVpZ2h0ID0gKGRlc2NyaXB0b3IuZnJhbWVbM10gPyBjb250cm9sLmRzdFJlY3QuaGVpZ2h0KVxuICAgICAgICAgICBcbiAgICAgICAgaWYgZGVzY3JpcHRvci5zaXplVG9QYXJlbnQ/XG4gICAgICAgICAgICBjb250cm9sLnNpemVUb1BhcmVudCA9IGRlc2NyaXB0b3Iuc2l6ZVRvUGFyZW50XG4gICAgICAgICAgICBcbiAgICAgICAgaWYgZGVzY3JpcHRvci5ibGVuZE1vZGU/XG4gICAgICAgICAgICBjb250cm9sLmJsZW5kTW9kZSA9IEBibGVuZE1vZGVzW2Rlc2NyaXB0b3IuYmxlbmRNb2RlXVxuICAgICAgICAgICAgXG4gICAgICAgIGlmIGRlc2NyaXB0b3IuYW5jaG9yP1xuICAgICAgICAgICAgY29udHJvbC5hbmNob3Iuc2V0KGRlc2NyaXB0b3IuYW5jaG9yWzBdLCBkZXNjcmlwdG9yLmFuY2hvclsxXSlcbiAgICAgICAgXG5cbiAgICAgICAgY29udHJvbC5vcGFjaXR5ID0gZGVzY3JpcHRvci5vcGFjaXR5ID8gMjU1ICAgIFxuICAgICAgICBpZiBkZXNjcmlwdG9yLm1pbmltdW1TaXplP1xuICAgICAgICAgICAgY29udHJvbC5taW5pbXVtU2l6ZSA9IHsgd2lkdGg6IGRlc2NyaXB0b3IubWluaW11bVNpemVbMF0sIGhlaWdodDogZGVzY3JpcHRvci5taW5pbXVtU2l6ZVsxXSB9XG4gICAgICAgICAgICBcbiAgICAgICAgaWYgZGVzY3JpcHRvci5yZXNpemFibGU/IHRoZW4gY29udHJvbC5yZXNpemFibGUgPSBkZXNjcmlwdG9yLnJlc2l6YWJsZVxuICAgICAgICBpZiBkZXNjcmlwdG9yLnNjcm9sbGFibGU/IHRoZW4gY29udHJvbC5zY3JvbGxhYmxlID0gZGVzY3JpcHRvci5zY3JvbGxhYmxlIFxuICAgICAgICBpZiBkZXNjcmlwdG9yLmZpeGVkU2l6ZT8gdGhlbiBjb250cm9sLmZpeGVkU2l6ZSA9IGRlc2NyaXB0b3IuZml4ZWRTaXplXG4gICAgICAgIGlmIGRlc2NyaXB0b3IuZHJhZ2dhYmxlP1xuICAgICAgICAgICAgY29udHJvbC5kcmFnZ2FibGUgPSBkZXNjcmlwdG9yLmRyYWdnYWJsZVxuICAgICAgICAgICAgY29udHJvbC5kcmFnZ2FibGUuc3RlcCA9IDBcbiAgICAgICAgICAgIGlmIGNvbnRyb2wuZHJhZ2dhYmxlLnJlY3Q/XG4gICAgICAgICAgICAgICAgY29udHJvbC5kcmFnZ2FibGUucmVjdCA9IFJlY3QuZnJvbUFycmF5KGNvbnRyb2wuZHJhZ2dhYmxlLnJlY3QpXG4gICAgICAgICAgICBjb250cm9sLmFkZENvbXBvbmVudChuZXcgdWkuQ29tcG9uZW50X0RyYWdnYWJsZSgpKVxuICAgICAgICBcbiAgICAgICAgaWYgZGVzY3JpcHRvci5iaW5kaW5ncz9cbiAgICAgICAgICAgIGNvbnRyb2wuYmluZGluZ3MgPSBkZXNjcmlwdG9yLmJpbmRpbmdzXG4gICAgICAgICAgICBjb250cm9sLmluc2VydENvbXBvbmVudChuZXcgdWkuQ29tcG9uZW50X0JpbmRpbmdIYW5kbGVyKCksIDApXG4gICAgICAgICAgICBcbiAgICAgICAgaWYgZGVzY3JpcHRvci5mb3JtdWxhcz9cbiAgICAgICAgICAgIGNvbnRyb2wuZm9ybXVsYXMgPSBkZXNjcmlwdG9yLmZvcm11bGFzXG4gICAgICAgICAgICBjb250cm9sLmluc2VydENvbXBvbmVudChuZXcgdWkuQ29tcG9uZW50X0Zvcm11bGFIYW5kbGVyKCksIDApXG4gICAgICAgICAgICBcbiAgICAgICAgY29udHJvbC5kYXRhRmllbGQgPSBkZXNjcmlwdG9yLmRhdGFGaWVsZFxuICAgICAgICBjb250cm9sLmVuYWJsZWQgPSBkZXNjcmlwdG9yLmVuYWJsZWQgPyB5ZXNcbiAgICAgICAgaWYgZGVzY3JpcHRvci5zZWxlY3RhYmxlPyB0aGVuIGNvbnRyb2wuc2VsZWN0YWJsZSA9IGRlc2NyaXB0b3Iuc2VsZWN0YWJsZVxuICAgICAgICBpZiBkZXNjcmlwdG9yLmdyb3VwPyBcbiAgICAgICAgICAgIGNvbnRyb2wuZ3JvdXAgPSBkZXNjcmlwdG9yLmdyb3VwXG4gICAgICAgICAgICBncy5PYmplY3RNYW5hZ2VyLmN1cnJlbnQuYWRkVG9Hcm91cChjb250cm9sLCBjb250cm9sLmdyb3VwKVxuICAgICAgICBcbiAgICAgICAgaWYgZGVzY3JpcHRvci5jdXN0b21GaWVsZHM/XG4gICAgICAgICAgICBjb250cm9sLmN1c3RvbUZpZWxkcyA9IE9iamVjdC5kZWVwQ29weShkZXNjcmlwdG9yLmN1c3RvbUZpZWxkcylcbiAgICAgICAgICAgIFxuICAgICAgICBpZiBkZXNjcmlwdG9yLm1hcmdpbj9cbiAgICAgICAgICAgIGNvbnRyb2wubWFyZ2luLmxlZnQgPSBkZXNjcmlwdG9yLm1hcmdpblswXVxuICAgICAgICAgICAgY29udHJvbC5tYXJnaW4udG9wID0gZGVzY3JpcHRvci5tYXJnaW5bMV1cbiAgICAgICAgICAgIGNvbnRyb2wubWFyZ2luLnJpZ2h0ID0gZGVzY3JpcHRvci5tYXJnaW5bMl1cbiAgICAgICAgICAgIGNvbnRyb2wubWFyZ2luLmJvdHRvbSA9IGRlc2NyaXB0b3IubWFyZ2luWzNdXG4gICAgICAgICAgICBcbiAgICAgICAgaWYgZGVzY3JpcHRvci5wYWRkaW5nP1xuICAgICAgICAgICAgY29udHJvbC5wYWRkaW5nLmxlZnQgPSBkZXNjcmlwdG9yLnBhZGRpbmdbMF1cbiAgICAgICAgICAgIGNvbnRyb2wucGFkZGluZy50b3AgPSBkZXNjcmlwdG9yLnBhZGRpbmdbMV1cbiAgICAgICAgICAgIGNvbnRyb2wucGFkZGluZy5yaWdodCA9IGRlc2NyaXB0b3IucGFkZGluZ1syXVxuICAgICAgICAgICAgY29udHJvbC5wYWRkaW5nLmJvdHRvbSA9IGRlc2NyaXB0b3IucGFkZGluZ1szXVxuICAgICAgICAgICAgXG4gICAgICAgIGlmIGRlc2NyaXB0b3IuYWxpZ25tZW50P1xuICAgICAgICAgICAgY29udHJvbC5hbGlnbm1lbnQgPSBAYWxpZ25tZW50c1tkZXNjcmlwdG9yLmFsaWdubWVudF1cbiAgICAgICAgICAgIFxuICAgICAgICBjb250cm9sLmFsaWdubWVudFkgPSBAYWxpZ25tZW50c1tkZXNjcmlwdG9yLmFsaWdubWVudFkgfHwgMF1cbiAgICAgICAgY29udHJvbC5hbGlnbm1lbnRYID0gQGFsaWdubWVudHNbZGVzY3JpcHRvci5hbGlnbm1lbnRYIHx8IDBdXG4gICAgICAgIGNvbnRyb2wuekluZGV4ID0gZGVzY3JpcHRvci56SW5kZXggfHwgMFxuICAgICAgICBjb250cm9sLm9yZGVyID0gZGVzY3JpcHRvci5vcmRlciB8fCAwXG4gICAgICAgIGNvbnRyb2wuY2hhaW5PcmRlciA9IChkZXNjcmlwdG9yLmNoYWluT3JkZXIgPyBkZXNjcmlwdG9yLnpPcmRlcikgKyAocGFyZW50Py5jaGFpbk9yZGVyIHx8IDApXG4gICAgICAgIGlmIGRlc2NyaXB0b3Iuem9vbT9cbiAgICAgICAgICAgIGNvbnRyb2wuem9vbSA9IHg6IGRlc2NyaXB0b3Iuem9vbVswXSAvIDEwMCwgeTogZGVzY3JpcHRvci56b29tWzFdIC8gMTAwXG4gICAgICAgICNjb250cm9sLmRhdGFGaWVsZHMgPSBkYXRhRmllbGRzXG4gICAgICAgICNjb250cm9sLmNvbnRyb2xsZXJzID0gQGNvbnRyb2xsZXJzXG4gICAgICAgICNjb250cm9sLmNvbnRyb2xsZXIgPSBjb250cm9sbGVyXG4gICAgICAgIFxuICAgICAgICBpZiBkZXNjcmlwdG9yLnZpc2libGU/XG4gICAgICAgICAgICBjb250cm9sLnZpc2libGUgPSBkZXNjcmlwdG9yLnZpc2libGVcbiAgICAgICAgaWYgZGVzY3JpcHRvci5jbGlwUmVjdFxuICAgICAgICAgICAgY29udHJvbC5jbGlwUmVjdCA9IG5ldyBSZWN0KGNvbnRyb2wuZHN0UmVjdC54LCBjb250cm9sLmRzdFJlY3QueSwgY29udHJvbC5kc3RSZWN0LndpZHRoLCBjb250cm9sLmRzdFJlY3QuaGVpZ2h0KVxuXG4gICAgICAgIGlmIGRlc2NyaXB0b3Iuc3R5bGVzP1xuICAgICAgICAgICAgQGFkZENvbnRyb2xTdHlsZXMoY29udHJvbCwgZGVzY3JpcHRvci5zdHlsZXMpXG4gICAgICAgICAgICBcbiAgICAgICAgICAgICAgICAgICAgXG4gICAgICAgIGlmIGRlc2NyaXB0b3IudGVtcGxhdGU/XG4gICAgICAgICAgICBjb250cm9sLmJlaGF2aW9yLm1hbmFnZW1lbnRNb2RlID0gdWkuTGF5b3V0TWFuYWdlbWVudE1vZGUuZnJvbVN0cmluZyhkZXNjcmlwdG9yLm1hbmFnZW1lbnRNb2RlKVxuICAgICAgICAgICAgZGF0YSA9IHVpLkNvbXBvbmVudF9Gb3JtdWxhSGFuZGxlci5maWVsZFZhbHVlKGNvbnRyb2wsIGNvbnRyb2wuZGF0YUZpZWxkKSAjY29udHJvbC5kYXRhRmllbGRzW2NvbnRyb2wuZGF0YUZpZWxkXVxuICAgICAgICAgICAgaXNOdW1iZXIgPSB0eXBlb2YgZGF0YSA9PSBcIm51bWJlclwiXG4gICAgICAgICAgICBpZiBkYXRhP1xuICAgICAgICAgICAgICAgIGZvciBpIGluIFswLi4uKGRhdGEubGVuZ3RoID8gZGF0YSldXG4gICAgICAgICAgICAgICAgICAgIGlmIGRhdGFbaV0/IG9yIGlzTnVtYmVyXG4gICAgICAgICAgICAgICAgICAgICAgICB2YWxpZCA9IHllc1xuICAgICAgICAgICAgICAgICAgICAgICAgaWYgZGVzY3JpcHRvci5kYXRhRmlsdGVyPyBhbmQgbm90IGlzTnVtYmVyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgdmFsaWQgPSB1aS5Db21wb25lbnRfSGFuZGxlci5jaGVja0NvbmRpdGlvbihkYXRhW2ldLCBkZXNjcmlwdG9yLmRhdGFGaWx0ZXIpXG4gICAgICAgICAgICAgICAgICAgICAgICBpZiB2YWxpZCBvciBpc051bWJlclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGNoaWxkID0gQGNyZWF0ZUNvbnRyb2xGcm9tRGVzY3JpcHRvcihkZXNjcmlwdG9yLnRlbXBsYXRlLCBjb250cm9sLCBpKVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICNjaGlsZC5kYXRhRmllbGRzID0gY29udHJvbC5kYXRhRmllbGRzXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgaWYgZGF0YVtpXT8uZHN0UmVjdFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBjaGlsZC5kc3RSZWN0ID0gdWkuVUlFbGVtZW50UmVjdGFuZ2xlLmZyb21SZWN0KGNoaWxkLCBkYXRhW2ldLmRzdFJlY3QpXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgaWYgKG5vdCBjaGlsZC5jbGlwUmVjdD8pIGFuZCBjb250cm9sLmNsaXBSZWN0P1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBjaGlsZC5jbGlwUmVjdCA9IGNvbnRyb2wuY2xpcFJlY3RcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAjY2hpbGQucGFyZW50ID0gY29udHJvbFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGNvbnRyb2wuYWRkT2JqZWN0KGNoaWxkKVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGNoaWxkLmluZGV4ID0gaVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGNoaWxkLm9yZGVyID0gKGRhdGEubGVuZ3RoID8gZGF0YSkgLSBpXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgY29udHJvbC5jb250cm9scy5wdXNoKGNoaWxkKVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIFxuICAgICAgICBcbiAgICAgICAgaWYgZGVzY3JpcHRvci5jb250cm9scyBhbmQgZGVzY3JpcHRvci5jb250cm9scy5leGVjXG4gICAgICAgICAgICBjb250cm9scyA9IHVpLkNvbXBvbmVudF9Gb3JtdWxhSGFuZGxlci5maWVsZFZhbHVlKGRlc2NyaXB0b3IsIGRlc2NyaXB0b3IuY29udHJvbHMpXG4gICAgICAgIGVsc2VcbiAgICAgICAgICAgIGNvbnRyb2xzID0gZGVzY3JpcHRvci5jb250cm9sc1xuICAgICAgICAgICAgXG4gICAgICAgIGlmIGNvbnRyb2xzP1xuICAgICAgICAgICAgZm9yIGl0ZW0sIGkgaW4gY29udHJvbHNcbiAgICAgICAgICAgICAgICBjaGlsZENvbnRyb2wgPSBAX2NyZWF0ZUZyb21EZXNjcmlwdG9yKGl0ZW0sIGNvbnRyb2wsIGkpXG4gICAgICAgICAgICAgICAgaWYgKG5vdCBjaGlsZENvbnRyb2wuY2xpcFJlY3Q/KSBhbmQgY29udHJvbC5jbGlwUmVjdD9cbiAgICAgICAgICAgICAgICAgICAgY2hpbGRDb250cm9sLmNsaXBSZWN0ID0gY29udHJvbC5jbGlwUmVjdFxuICAgICAgICAgICAgICAgIGNoaWxkQ29udHJvbC5pbmRleCA9IGlcbiAgICAgICAgICAgICAgICBjaGlsZENvbnRyb2wub3JpZ2luLnggPSBjb250cm9sLm9yaWdpbi54ICsgY29udHJvbC5kc3RSZWN0LnhcbiAgICAgICAgICAgICAgICBjaGlsZENvbnRyb2wub3JpZ2luLnkgPSBjb250cm9sLm9yaWdpbi55ICsgY29udHJvbC5kc3RSZWN0LnlcbiAgICAgICAgICAgICAgICAjY2hpbGRDb250cm9sLnBhcmVudCA9IGNvbnRyb2xcbiAgICAgICAgICAgICAgICBjb250cm9sLmFkZE9iamVjdChjaGlsZENvbnRyb2wpXG4gICAgICAgICAgICAgICAgY29udHJvbC5jb250cm9scy5wdXNoKGNoaWxkQ29udHJvbClcbiAgICAgICAgICAgICAgICBcbiAgICAgICAgaWYgY29udHJvbC5zdHlsZXMgYW5kIGNvbnRyb2wucGFyZW50c0J5U3R5bGVcbiAgICAgICAgICAgICNmb3Igc3R5bGUgaW4gY29udHJvbC5zdHlsZXNcbiAgICAgICAgICAgIFxuICAgICAgICAgICAgcGFyZW50ID0gY29udHJvbC5wYXJlbnRcbiAgICAgICAgICAgIHdoaWxlIHBhcmVudFxuICAgICAgICAgICAgICAgIGlmIHBhcmVudC5zdHlsZXNcbiAgICAgICAgICAgICAgICAgICAgZm9yIHN0eWxlIGluIHBhcmVudC5zdHlsZXNcbiAgICAgICAgICAgICAgICAgICAgICAgIGlmICFjb250cm9sLnBhcmVudHNCeVN0eWxlW3N0eWxlLmlkXVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGNvbnRyb2wucGFyZW50c0J5U3R5bGVbc3R5bGUuaWRdID0gW11cbiAgICAgICAgICAgICAgICAgICAgICAgIGNvbnRyb2wucGFyZW50c0J5U3R5bGVbc3R5bGUuaWRdLnB1c2gocGFyZW50KVxuICAgICAgICAgICAgICAgIFxuICAgICAgICAgICAgICAgICN3aGlsZSBwYXJlbnRcbiAgICAgICAgICAgICAgICAgICAgI2lmIHBhcmVudC5jb250cm9sc0J5U3R5bGVcbiAgICAgICAgICAgICAgICAgICAgIyAgICBpZighcGFyZW50LmNvbnRyb2xzQnlTdHlsZVtzdHlsZS5pZF0pXG4gICAgICAgICAgICAgICAgICAgICMgICAgICAgIHBhcmVudC5jb250cm9sc0J5U3R5bGVbc3R5bGUuaWRdID0gW11cbiAgICAgICAgICAgICAgICAgICAgIyAgICBwYXJlbnQuY29udHJvbHNCeVN0eWxlW3N0eWxlLmlkXS5wdXNoKGNvbnRyb2wpXG4gICAgICAgICAgICAgICAgICAjICBpZiBjb250cm9sLnBhcmVudHNCeVN0eWxlXG4gICAgICAgICAgICAgICAgICAjICAgICAgaWYgIWNvbnRyb2wucGFyZW50c0J5U3R5bGVbc3R5bGUuaWRdXG4gICAgICAgICAgICAgICAgICAjICAgICAgICAgIGNvbnRyb2wucGFyZW50c0J5U3R5bGVbc3R5bGUuaWRdID0gW11cbiAgICAgICAgICAgICAgICAgICMgICAgICBjb250cm9sLnBhcmVudHNCeVN0eWxlW3N0eWxlLmlkXS5wdXNoKHBhcmVudClcbiAgICAgICAgICAgICAgICBwYXJlbnQgPSBwYXJlbnQucGFyZW50XG4gICAgICAgICAgICAgICAgICAgICAgICBcbiAgICAgICAgaWYgZGVzY3JpcHRvci5hbmltYXRpb25zP1xuICAgICAgICAgICAgY29udHJvbC5hbmltYXRpb25zID0gT2JqZWN0LmRlZXBDb3B5KGRlc2NyaXB0b3IuYW5pbWF0aW9ucylcbiAgICAgICAgICAgIGNvbnRyb2wuYW5pbWF0aW9uRXhlY3V0b3IgPSBuZXcgdWkuQ29tcG9uZW50X0FuaW1hdGlvbkV4ZWN1dG9yKClcbiAgICAgICAgICAgIGNvbnRyb2wuYWRkQ29tcG9uZW50KGNvbnRyb2wuYW5pbWF0aW9uRXhlY3V0b3IpXG4gICAgICAgICAgICBjb250cm9sLmFkZENvbXBvbmVudChuZXcgdWkuQ29tcG9uZW50X0FuaW1hdGlvbkhhbmRsZXIoKSlcbiAgICAgICAgIFxuICAgICAgICBjb250cm9sLnVpLnVwZGF0ZVN0eWxlKClcbiAgICAgICAgY29udHJvbC5zZXR1cCgpXG4gICAgICAgIFxuICAgICAgICByZXR1cm4gY29udHJvbFxuICAgICAgICBcbiAgICAjIyMqXG4gICAgKiBDcmVhdGVzIGFuIFVJIG9iamVjdCBmcm9tIGEgc3BlY2lmaWVkIFVJIGRlc2NyaXB0b3IuXG4gICAgKlxuICAgICogQG1ldGhvZCBfY3JlYXRlRnJvbURlc2NyaXB0b3JcbiAgICAqIEBwYXJhbSB7T2JqZWN0fSBkZXNjcmlwdG9yIC0gVGhlIFVJIG9iamVjdCBkZXNjcmlwdG9yLlxuICAgICogQHBhcmFtIHtncy5PYmplY3RfVUlFbGVtZW50fSBwYXJlbnQgLSBUaGUgVUkgcGFyZW50IG9iamVjdC4gKEEgbGF5b3V0IGZvciBleGFtcGxlKS5cbiAgICAqIEByZXR1cm4ge2dzLk9iamVjdF9VSUVsZW1lbnR9IFRoZSBjcmVhdGVkIFVJIG9iamVjdC5cbiAgICAqIEBwcm90ZWN0ZWQgXG4gICAgIyMjICAgXG4gICAgX2NyZWF0ZUZyb21EZXNjcmlwdG9yOiAoZGVzY3JpcHRvciwgcGFyZW50LCBpbmRleCkgLT4gICAgIFxuICAgICAgICBjb250cm9sID0gQGNyZWF0ZUNvbnRyb2xGcm9tRGVzY3JpcHRvcihkZXNjcmlwdG9yLCBwYXJlbnQsIGluZGV4KVxuICAgICAgICBcbiAgICAgICAgaWYgZGVzY3JpcHRvci5jb250cm9sbGVyP1xuICAgICAgICAgICAgY29udHJvbGxlciA9IEBjb250cm9sbGVyc1tkZXNjcmlwdG9yLmNvbnRyb2xsZXJdXG4gICAgICAgICAgICBjb250cm9sLmNvbnRyb2xsZXIgPSBjb250cm9sbGVyXG4gICAgICAgICAgICBjb250cm9sLmFkZENvbXBvbmVudChjb250cm9sbGVyKVxuICAgICAgICAgICAgICAgIFxuICAgICAgICByZXR1cm4gY29udHJvbFxuICAgICAgICBcbiAgICBjcmVhdGVMYXlvdXRGcm9tRGVzY3JpcHRvcjogKGRlc2NyaXB0b3IsIHBhcmVudCwgaW5kZXgpIC0+XG4gICAgICAgIEBfY3JlYXRlRnJvbURlc2NyaXB0b3IoZGVzY3JpcHRvciwgcGFyZW50LCBpbmRleClcbiAgICAgICAgXG4gICAgICAgICAgICAgICAgXG4gICAgICAgIFxuR3JhcGhpY3Mud2lkdGggPSAkUEFSQU1TLnJlc29sdXRpb24ud2lkdGhcbkdyYXBoaWNzLmhlaWdodCA9ICRQQVJBTVMucmVzb2x1dGlvbi5oZWlnaHRcbnVpLlVpRmFjdG9yeSA9IG5ldyBVSU1hbmFnZXIoKVxudWkuVUlNYW5hZ2VyID0gdWkuVWlGYWN0b3J5Il19
//# sourceURL=UIManager_103.js