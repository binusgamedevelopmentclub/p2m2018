var Component_MessageTextRenderer,
  extend = function(child, parent) { for (var key in parent) { if (hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; },
  hasProp = {}.hasOwnProperty;

Component_MessageTextRenderer = (function(superClass) {
  extend(Component_MessageTextRenderer, superClass);

  Component_MessageTextRenderer.objectCodecBlackList = ["onLinkClick", "onBatchDisappear"];


  /**
  * Called if this object instance is restored from a data-bundle. It can be used
  * re-assign event-handler, anonymous functions, etc.
  * x
  * @method onDataBundleRestore.
  * @param Object data - The data-bundle
  * @param gs.ObjectCodecContext context - The codec-context.
   */

  Component_MessageTextRenderer.prototype.onDataBundleRestore = function(data, context) {
    var bitmap, customObject, j, l, len, len1, len2, line, m, message, n, ref, ref1, ref2;
    this.setupEventHandlers();
    l = 0;
    ref = this.object.messages;
    for (j = 0, len = ref.length; j < len; j++) {
      message = ref[j];
      if (this.object.settings.useCharacterColor) {
        this.object.font.color = new gs.Color(message.character.textColor);
      }
      this.lines = this.calculateLines(lcsm(message.text), true, 0);
      ref1 = this.lines;
      for (m = 0, len1 = ref1.length; m < len1; m++) {
        line = ref1[m];
        bitmap = this.createBitmap(line);
        if (line === this.line) {
          this.drawLineContent(line, bitmap, this.charIndex + 1);
        } else {
          this.drawLineContent(line, bitmap, -1);
        }
        this.allSprites[l].bitmap = bitmap;
        l++;
      }
    }
    ref2 = this.customObjects;
    for (n = 0, len2 = ref2.length; n < len2; n++) {
      customObject = ref2[n];
      SceneManager.scene.addObject(customObject);
    }
    return null;
  };


  /**
  *  A text-renderer component to render an animated and interactive message text using
  *  dimensions of the game object's destination-rectangle. The message is displayed
  *  using a sprite for each line instead of drawing to the game object's bitmap object.
  *
  *  @module gs
  *  @class Component_MessageTextRenderer
  *  @extends gs.Component_TextRenderer
  *  @memberof gs
  *  @constructor
   */

  function Component_MessageTextRenderer() {
    Component_MessageTextRenderer.__super__.constructor.apply(this, arguments);

    /**
    * An array containing all sprites of the current message.
    * @property sprites
    * @type gs.Sprite[]
    * @protected
     */
    this.sprites = [];

    /**
    * An array containing all sprites of all messages. In NVL mode
    * a page can contain multiple messages.
    * @property allSprites
    * @type gs.Sprite[]
    * @protected
     */
    this.allSprites = [];

    /**
    * An array containing all line-objects of the current message.
    * @property lines
    * @type gs.TextRendererLine[]
    * @readOnly
     */
    this.lines = null;

    /**
    * The line currently rendered.
    * @property line
    * @type number
    * @readOnly
     */
    this.line = 0;

    /**
    * The left and right padding per line.
    * @property padding
    * @type number
     */
    this.padding = 6;

    /**
    * The minimum height of the line currently rendered. If 0, the measured
    * height of the line will be used.
    * @property minLineHeight
    * @type number
     */
    this.minLineHeight = 0;

    /**
    * The spacing between text lines in pixels.
    * @property lineSpacing
    * @type number
     */
    this.lineSpacing = 2;

    /**
    * The line currently rendered.
    * @property currentLine
    * @type number
    * @protected
     */
    this.currentLine = 0;

    /**
    * The height of the line currently rendered.
    * @property currentLineHeight
    * @type number
    * @protected
     */
    this.currentLineHeight = 0;

    /**
    * Index of the current character to draw.
    * @property charIndex
    * @type number
    * @readOnly
     */
    this.charIndex = 0;

    /**
    * Position of the message caret. The caret is like an invisible
    * cursor pointing to the x/y coordinates of the last rendered character of
    * the message. That position can be used to display a waiting- or processing-animation for example.
    * @property caretPosition
    * @type gs.Point
    * @readOnly
     */
    this.caretPosition = new gs.Point();

    /**
    * Indicates that the a message is currently in progress.
    * @property isRunning
    * @type boolean
    * @readOnly
     */
    this.isRunning = false;

    /**
    * The current x-coordinate of the caret/cursor.
    * @property currentX
    * @type number
    * @readOnly
     */
    this.currentX = 0;

    /**
    * The current y-coordinate of the caret/cursor.
    * @property currentY
    * @type number
    * @readOnly
     */
    this.currentY = 0;

    /**
    * The current sprites used to display the current text-line/part.
    * @property currentSprite
    * @type gs.Sprite
    * @readOnly
     */
    this.currentSprite = null;

    /**
    * Indicates if the message-renderer is currently waiting like for a user-action.
    * @property isWaiting
    * @type boolean
    * @readOnly
     */
    this.isWaiting = false;

    /**
    * Indicates if the message-renderer is currently waiting for a key-press or mouse/touch action.
    * @property waitForKey
    * @type boolean
    * @readOnly
     */
    this.waitForKey = false;

    /**
    * Number of frames the message-renderer should wait before continue.
    * @property waitCounter
    * @type number
     */
    this.waitCounter = 0;

    /**
    * Speed of the message-drawing. The smaller the value, the faster the message is displayed.
    * @property speed
    * @type number
     */
    this.speed = 1;

    /**
    * Indicates if the message should be rendered immedialtely without any animation or delay.
    * @property drawImmediately
    * @type boolean
     */
    this.drawImmediately = false;

    /**
    * Indicates if the message should wait for a user-action or a certain amount of time
    * before finishing.
    * @property waitAtEnd
    * @type boolean
     */
    this.waitAtEnd = true;

    /**
    * The number of frames to wait before finishing a message.
    * before finishing.
    * @property waitAtEndTime
    * @type number
     */
    this.waitAtEndTime = 0;

    /**
    * Indicates if auto word-wrap should be used. Default is <b>true</b>
    * @property wordWrap
    * @type boolean
     */
    this.wordWrap = true;

    /**
    * Custom game objects which are alive until the current message is erased. Can be used to display
    * animated icons, etc.
    * @property customObjects
    * @type gs.Object_Base[]
     */
    this.customObjects = [];

    /**
    * A hashtable/dictionary object to store custom-data useful like for token-processing. The data must be
    * serializable.
    * @property customObjects
    * @type Object
     */
    this.customData = {};

    /**
    * A callback function called if the player clicks on a non-stylable link (LK text-code) to trigger
    * the specified common event.
    * @property onLinkClick
    * @type Function
     */
    this.onLinkClick = function(e) {
      var event, eventId;
      eventId = e.data.linkData.commonEventId;
      event = RecordManager.commonEvents[eventId];
      if (!event) {
        event = RecordManager.commonEvents.first((function(_this) {
          return function(x) {
            return x.name === eventId;
          };
        })(this));
        if (event) {
          eventId = event.index;
        }
      }
      if (!event) {
        return SceneManager.scene.interpreter.jumpToLabel(eventId);
      } else {
        return SceneManager.scene.interpreter.callCommonEvent(eventId, null, true);
      }
    };

    /**
    * A callback function called if a batched messsage has been faded out. It triggers the execution of
    * the next message.
    * @property onBatchDisappear
    * @type Function
     */
    this.onBatchDisappear = (function(_this) {
      return function(e) {
        _this.drawImmediately = false;
        _this.isWaiting = false;
        _this.object.opacity = 255;
        return _this.executeBatch();
      };
    })(this);
  }


  /**
  * Serializes the message text-renderer into a data-bundle.
  * @method toDataBundle
  * @return {Object} A data-bundle.
   */

  Component_MessageTextRenderer.prototype.toDataBundle = function() {
    var bundle, ignore, k;
    ignore = ["object", "font", "sprites", "allSprites", "currentSprite", "currentX"];
    bundle = {
      currentSpriteIndex: this.sprites.indexOf(this.currentSprite)
    };
    for (k in this) {
      if (ignore.indexOf(k) === -1) {
        bundle[k] = this[k];
      }
    }
    return bundle;
  };


  /**
  * Disposes the message text-renderer and all sprites used to display
  * the message.
  * @method dispose
   */

  Component_MessageTextRenderer.prototype.dispose = function() {
    var j, len, ref, ref1, results, sprite;
    Component_MessageTextRenderer.__super__.dispose.apply(this, arguments);
    gs.GlobalEventManager.offByOwner("mouseUp", this.object);
    gs.GlobalEventManager.offByOwner("keyUp", this.object);
    ref = this.allSprites;
    results = [];
    for (j = 0, len = ref.length; j < len; j++) {
      sprite = ref[j];
      if ((ref1 = sprite.bitmap) != null) {
        ref1.dispose();
      }
      results.push(sprite.dispose());
    }
    return results;
  };


  /**
  * Adds event-handlers for mouse/touch events
  *
  * @method setupEventHandlers
   */

  Component_MessageTextRenderer.prototype.setupEventHandlers = function() {
    gs.GlobalEventManager.offByOwner("mouseUp", this.object);
    gs.GlobalEventManager.offByOwner("keyUp", this.object);
    gs.GlobalEventManager.on("mouseUp", ((function(_this) {
      return function(e) {
        if (_this.object.findComponentByName("animation") || (GameManager.settings.autoMessage.enabled && !GameManager.settings.autoMessage.stopOnAction)) {
          return;
        }
        if (_this.isWaiting && !(_this.waitCounter > 0 || _this.waitForKey)) {
          e.breakChain = true;
          _this["continue"]();
        } else {
          e.breakChain = _this.isRunning;
          _this.drawImmediately = !_this.waitForKey;
          _this.waitCounter = 0;
          _this.waitForKey = false;
          _this.isWaiting = false;
        }
        if (_this.waitForKey) {
          if (Input.Mouse.buttons[Input.Mouse.LEFT] === 2) {
            e.breakChain = true;
            Input.clear();
            _this.waitForKey = false;
            return _this.isWaiting = false;
          }
        }
      };
    })(this)), null, this.object);
    return gs.GlobalEventManager.on("keyUp", ((function(_this) {
      return function(e) {
        if (Input.keys[Input.C] && (!_this.isWaiting || (_this.waitCounter > 0 || _this.waitForKey))) {
          _this.drawImmediately = !_this.waitForKey;
          _this.waitCounter = 0;
          _this.waitForKey = false;
          _this.isWaiting = false;
        }
        if (_this.isWaiting && !_this.waitForKey && !_this.waitCounter && Input.keys[Input.C]) {
          _this["continue"]();
        }
        if (_this.waitForKey) {
          if (Input.keys[Input.C]) {
            Input.clear();
            _this.waitForKey = false;
            return _this.isWaiting = false;
          }
        }
      };
    })(this)), null, this.object);
  };


  /**
  * Sets up the renderer. Registers necessary event handlers.
  * @method setup
   */

  Component_MessageTextRenderer.prototype.setup = function() {
    return this.setupEventHandlers();
  };


  /**
  * Restores the message text-renderer's state from a data-bundle.
  * @method restore
  * @param {Object} bundle - A data-bundle containing message text-renderer state.
   */

  Component_MessageTextRenderer.prototype.restore = function(bundle) {
    var k;
    for (k in bundle) {
      if (k === "currentSpriteIndex") {
        this.currentSprite = this.sprites[bundle.currentSpriteIndex];
      } else {
        this[k] = bundle[k];
      }
    }
    if (this.sprites.length > 0) {
      this.currentY = this.sprites.last().y - this.object.origin.y - this.object.dstRect.y;
      this.line = this.maxLines;
      this.isWaiting = this.isWaiting || this.isRunning;
    }
    return null;
  };


  /**
  * Continues message-processing if currently waiting.
  * @method continue
   */

  Component_MessageTextRenderer.prototype["continue"] = function() {
    var duration, fading, ref, ref1;
    this.isWaiting = false;
    if (this.line >= this.lines.length) {
      this.isRunning = false;
      return (ref = this.object.events) != null ? ref.emit("messageFinish", this) : void 0;
    } else {
      if ((ref1 = this.object.events) != null) {
        ref1.emit("messageBatch", this);
      }
      fading = GameManager.tempSettings.messageFading;
      duration = GameManager.tempSettings.skip ? 0 : fading.duration;
      return this.object.animator.disappear(fading.animation, fading.easing, duration, gs.CallBack("onBatchDisappear", this));
    }
  };


  /**
  * Updates the text-renderer.
  * @method update
   */

  Component_MessageTextRenderer.prototype.update = function() {
    var j, len, len1, m, object, ref, ref1, ref2, sprite;
    ref = this.allSprites;
    for (j = 0, len = ref.length; j < len; j++) {
      sprite = ref[j];
      sprite.opacity = this.object.opacity;
      sprite.visible = this.object.visible;
      sprite.ox = -this.object.offset.x;
      sprite.oy = -this.object.offset.y;
      sprite.mask.value = this.object.mask.value;
      sprite.mask.vague = this.object.mask.vague;
      sprite.mask.source = this.object.mask.source;
      sprite.mask.type = this.object.mask.type;
    }
    ref1 = this.customObjects;
    for (m = 0, len1 = ref1.length; m < len1; m++) {
      object = ref1[m];
      object.opacity = this.object.opacity;
      object.visible = this.object.visible;
    }
    if (!this.isRunning && this.waitCounter > 0) {
      this.waitCounter--;
      if (this.waitCounter === 0) {
        this["continue"]();
      }
      return;
    }
    if (this.object.visible && ((ref2 = this.lines) != null ? ref2.length : void 0) > 0) {
      this.updateLineWriting();
      this.updateWaitForKey();
      this.updateWaitCounter();
      return this.updateCaretPosition();
    }
  };


  /**
  * Indicates if its a batched messages.
  *
  * @method isBatched
  * @return If <b>true</b> it is a batched message. Otherwise <b>false</b>.
   */

  Component_MessageTextRenderer.prototype.isBatched = function() {
    return this.lines.length > this.maxLines;
  };


  /**
  * Indicates if the batch is still in progress and not done.
  *
  * @method isBatchInProgress
  * @return If <b>true</b> the batched message is still not done. Otherwise <b>false</b>
   */

  Component_MessageTextRenderer.prototype.isBatchInProgress = function() {
    return this.lines.length - this.line > this.maxLines;
  };


  /**
  * Starts displaying the next page of text if a message is too long to fit
  * into one message box.
  *
  * @method executeBatch
   */

  Component_MessageTextRenderer.prototype.executeBatch = function() {
    this.clearAllSprites();
    this.lines = this.lines.slice(this.line);
    this.line = 0;
    this.currentX = 0;
    this.currentY = 0;
    this.currentLineHeight = 0;
    this.tokenIndex = 0;
    this.charIndex = 0;
    this.token = this.lines[this.line].content[this.tokenIndex] || new gs.RendererToken(null, "");
    this.maxLines = this.calculateMaxLines(this.lines);
    this.lineAnimationCount = this.speed;
    this.sprites = this.createSprites(this.lines);
    this.allSprites = this.allSprites.concat(this.sprites);
    this.currentSprite = this.sprites[this.line];
    this.currentSprite.x = this.currentX + this.object.origin.x + this.object.dstRect.x;
    return this.drawNext();
  };


  /**
  * Calculates the duration(in frames) the message-renderer needs to display
  * the message.
  *
  * @method calculateDuration
  * @return {number} The duration in frames.
   */

  Component_MessageTextRenderer.prototype.calculateDuration = function() {
    var duration, j, len, len1, line, m, ref, ref1, token;
    duration = 0;
    if (this.lines != null) {
      ref = this.lines;
      for (j = 0, len = ref.length; j < len; j++) {
        line = ref[j];
        ref1 = line.content;
        for (m = 0, len1 = ref1.length; m < len1; m++) {
          token = ref1[m];
          if (token != null) {
            duration += this.calculateDurationForToken(token);
          }
        }
      }
    }
    return duration;
  };


  /**
  * Calculates the duration(in frames) the message-renderer needs to display
  * the specified line.
  *
  * @method calculateDurationForLine
  * @param {gs.RendererTextLine} line The line to calculate the duration for.
  * @return {number} The duration in frames.
   */

  Component_MessageTextRenderer.prototype.calculateDurationForLine = function(line) {
    var duration, j, len, ref, token;
    duration = 0;
    if (line) {
      ref = line.content;
      for (j = 0, len = ref.length; j < len; j++) {
        token = ref[j];
        if (token != null) {
          duration += this.calculateDurationForToken(token);
        }
      }
    }
    return duration;
  };


  /**
  * Calculates the duration(in frames) the message-renderer needs to process
  * the specified token.
  *
  * @method calculateDurationForToken
  * @param {string|Object} token - The token.
  * @return {number} The duration in frames.
   */

  Component_MessageTextRenderer.prototype.calculateDurationForToken = function(token) {
    var duration;
    duration = 0;
    if (token.code != null) {
      switch (token.code) {
        case "W":
          if (token.value !== "A") {
            duration = token.value / 1000 * Graphics.frameRate;
          }
      }
    } else {
      duration = token.value.length * this.speed;
    }
    return duration;
  };


  /**
  * Calculates the maximum of lines which can be displayed in one message.
  *
  * @method calculateMaxLines
  * @param {Array} lines - An array of line-objects.
  * @return {number} The number of displayable lines.
   */

  Component_MessageTextRenderer.prototype.calculateMaxLines = function(lines) {
    var height, j, len, line, result;
    height = 0;
    result = 0;
    for (j = 0, len = lines.length; j < len; j++) {
      line = lines[j];
      height += line.height + this.lineSpacing;
      if (this.currentY + height > this.object.dstRect.height) {
        break;
      }
      result++;
    }
    return Math.min(lines.length, result || 1);
  };


  /**
  * Displays the character or processes the next control-token.
  *
  * @method drawNext
   */

  Component_MessageTextRenderer.prototype.drawNext = function() {
    var lineSpacing, size, token;
    token = this.processToken();
    if ((token != null ? token.value.length : void 0) > 0) {
      this.char = this.token.value.charAt(this.charIndex);
      size = this.font.measureTextPlain(this.char);
      lineSpacing = this.lineSpacing;
      if (this.currentLine !== this.line) {
        this.currentLine = this.line;
        this.currentLineHeight = 0;
      }
      this.currentSprite.y = this.object.origin.y + this.object.dstRect.y + this.currentY;
      this.currentSprite.visible = true;
      this.drawLineContent(this.lines[this.line], this.currentSprite.bitmap, this.charIndex + 1);
      this.currentSprite.srcRect.width = this.currentSprite.bitmap.width;
      this.currentLineHeight = this.lines[this.line].height;
      return this.currentX = Math.min(this.lines[this.line].width, this.currentX + size.width);
    }
  };


  /**
  * Processes the next character/token of the message.
  * @method nextChar
  * @private
   */

  Component_MessageTextRenderer.prototype.nextChar = function() {
    var base, base1, results;
    results = [];
    while (true) {
      this.charIndex++;
      this.lineAnimationCount = this.speed;
      if ((this.token.code != null) || this.charIndex >= this.token.value.length) {
        if (typeof (base = this.token).onEnd === "function") {
          base.onEnd();
        }
        this.tokenIndex++;
        if (this.tokenIndex >= this.lines[this.line].content.length) {
          this.tokenIndex = 0;
          this.line++;
          this.currentSprite.srcRect.width = this.currentSprite.bitmap.width;
          this.currentSprite = this.sprites[this.line];
          if (this.currentSprite != null) {
            this.currentSprite.x = this.object.origin.x + this.object.dstRect.x;
          }
          if (this.line < this.maxLines) {
            this.currentY += (this.currentLineHeight || this.font.lineHeight) + this.lineSpacing * Graphics.scale;
            this.charIndex = 0;
            this.currentX = 0;
            this.token = this.lines[this.line].content[this.tokenIndex] || new gs.RendererToken(null, "");
          }
        } else {
          this.charIndex = 0;
          this.token = this.lines[this.line].content[this.tokenIndex] || new gs.RendererToken(null, "");
        }
        if (typeof (base1 = this.token).onStart === "function") {
          base1.onStart();
        }
      }
      if (!this.token || this.token.value !== "\n" || !this.lines[this.line]) {
        break;
      } else {
        results.push(void 0);
      }
    }
    return results;
  };


  /**
  * Finishes the message. Depending on the message configuration, the
  * message text-renderer will now wait for a user-action or a certain amount
  * of time.
  *
  * @method finish
   */

  Component_MessageTextRenderer.prototype.finish = function() {
    var ref, ref1, ref2;
    if (this.waitAtEnd) {
      this.isWaiting = true;
      return (ref = this.object.events) != null ? ref.emit("messageWaiting", this) : void 0;
    } else if (this.waitAtEndTime > 0) {
      this.waitCounter = this.waitAtEndTime;
      this.isWaiting = false;
      return (ref1 = this.object.events) != null ? ref1.emit("messageWaiting", this) : void 0;
    } else {
      if ((ref2 = this.object.events) != null) {
        ref2.emit("messageWaiting", this);
      }
      return this["continue"]();
    }
  };


  /**
  * Returns the position of the caret in pixels. The caret is like an invisible
  * cursor pointing to the x/y coordinates of the last rendered character of
  * the message. That position can be used to display a waiting- or processing-animation for example.
  *
  * @method updateCaretPosition
   */

  Component_MessageTextRenderer.prototype.updateCaretPosition = function() {
    this.caretPosition.x = this.currentX + this.padding;
    return this.caretPosition.y = this.currentY + this.currentLineHeight / 2;
  };


  /**
  * Updates the line writing.
  *
  * @method updateLineWriting
  * @private
   */

  Component_MessageTextRenderer.prototype.updateLineWriting = function() {
    if (this.isRunning && !this.isWaiting && !this.waitForKey && this.waitCounter <= 0) {
      if (this.lineAnimationCount <= 0) {
        while (true) {
          if (this.line < this.maxLines) {
            this.nextChar();
          }
          if (this.line >= this.maxLines) {
            this.finish();
          } else {
            this.drawNext();
          }
          if (!((this.token.code || this.lineAnimationCount <= 0 || this.drawImmediately) && !this.waitForKey && this.waitCounter <= 0 && this.isRunning && this.line < this.maxLines)) {
            break;
          }
        }
      }
      if (GameManager.tempSettings.skip) {
        return this.lineAnimationCount = 0;
      } else {
        return this.lineAnimationCount--;
      }
    }
  };


  /**
  * Updates wait-for-key state. If skipping is enabled, the text renderer will
  * not wait for key press.
  *
  * @method updateWaitForKey
  * @private
   */

  Component_MessageTextRenderer.prototype.updateWaitForKey = function() {
    if (this.waitForKey) {
      this.isWaiting = !GameManager.tempSettings.skip;
      return this.waitForKey = this.isWaiting;
    }
  };


  /**
  * Updates wait counter if the text renderer is waiting for a certain amount of time to pass. If skipping is enabled, the text renderer will
  * not wait for the actual amount of time and sets the wait-counter to 1 frame instead.
  *
  * @method updateWaitForKey
  * @private
   */

  Component_MessageTextRenderer.prototype.updateWaitCounter = function() {
    if (this.waitCounter > 0) {
      if (GameManager.tempSettings.skip) {
        this.waitCounter = 1;
      }
      this.isWaiting = true;
      this.waitCounter--;
      if (this.waitCounter <= 0) {
        this.isWaiting = false;
        if (this.line >= this.maxLines) {
          return this["continue"]();
        }
      }
    }
  };


  /**
  * Creates a token-object for a specified text-code.
  * 
  * @method createToken
  * @param {string} code - The code/type of the text-code.
  * @param {string} value - The value of the text-code.
  * @return {Object} The token-object.
   */

  Component_MessageTextRenderer.prototype.createToken = function(code, value) {
    var data, i, j, ref, tokenObject;
    tokenObject = null;
    switch (code) {
      case "CE":
        data = value.split("/");
        value = data.shift();
        value = isNaN(value) ? value : parseInt(value);
        for (i = j = 0, ref = data; 0 <= ref ? j < ref : j > ref; i = 0 <= ref ? ++j : --j) {
          if (data[i].startsWith('"') && data[i].endsWith('"')) {
            data[i] = data[i].substring(1, data[i].length - 1);
          } else {
            data[i] = isNaN(data[i]) ? data[i] : parseFloat(data[i]);
          }
        }
        tokenObject = {
          code: code,
          value: value,
          values: data
        };
        break;
      default:
        tokenObject = Component_MessageTextRenderer.__super__.createToken.call(this, code, value);
    }
    return tokenObject;
  };


  /**
  * <p>Measures a control-token. If a token produces a visual result like displaying an icon then it must return the size taken by
  * the visual result. If the token has no visual result, <b>null</b> must be returned. This method is called for every token when the message is initialized.</p> 
  *
  * <p>This method is not called while the message is running. For that case, see <i>processControlToken</i> method which is called
  * for every token while the message is running.</p>
  *
  * @param {Object} token - A control-token.
  * @return {gs.Size} The size of the area taken by the visual result of the token or <b>null</b> if the token has no visual result.
  * @method analyzeControlToken
  * @protected
   */

  Component_MessageTextRenderer.prototype.measureControlToken = function(token) {
    return Component_MessageTextRenderer.__super__.measureControlToken.call(this, token);
  };


  /**
  * <p>Draws the visual result of a token, like an icon for example, to the specified bitmap. This method is called for every token when the message is initialized and the sprites for each
  * text-line are created.</p> 
  *
  * <p>This method is not called while the message is running. For that case, see <i>processControlToken</i> method which is called
  * for every token while the message is running.</p>
  *
  * @param {Object} token - A control-token.
  * @param {gs.Bitmap} bitmap - The bitmap used for the current text-line. Can be used to draw something on it like an icon, etc.
  * @param {number} offset - An x-offset for the draw-routine.
  * @param {number} length - Determines how many characters of the token should be drawn. Can be ignored for tokens
  * not drawing any characters.
  * @method drawControlToken
  * @protected
   */

  Component_MessageTextRenderer.prototype.drawControlToken = function(token, bitmap, offset, length) {
    var data, j, len, linkData, results;
    switch (token.code) {
      case "RT":
        return Component_MessageTextRenderer.__super__.drawControlToken.call(this, token, bitmap, offset, length);
      case "SLK":
        if (token.customData.offsetX == null) {
          token.customData.offsetX = offset;
        }
        if (this.customData.linkData) {
          linkData = this.customData.linkData[this.line];
          if (linkData) {
            results = [];
            for (j = 0, len = linkData.length; j < len; j++) {
              data = linkData[j];
              results.push(this.sprites[this.line].bitmap.clearRect(data.cx, 0, data.width, data.height));
            }
            return results;
          }
        }
    }
  };


  /**
  * Processes a control-token. A control-token is a token which influences
  * the text-rendering like changing the fonts color, size or style. Changes 
  * will be automatically applied to the game object's font.
  *
  * For message text-renderer, a few additional control-tokens like
  * speed-change, waiting, etc. needs to be processed here.
  *
  * This method is called for each token while the message is initialized and
  * also while the message is running. See <i>formattingOnly</i> parameter.
  *
  * @param {Object} token - A control-token.
  * @param {boolean} formattingOnly - If <b>true</b> the message is initializing right now and only 
  * format-tokens should be processed which is necessary for the message to calculated sizes correctly.
  * @return {Object} A new token which is processed next or <b>null</b>.
  * @method processControlToken
  * @protected
   */

  Component_MessageTextRenderer.prototype.processControlToken = function(token, formattingOnly) {
    var animation, bitmap, character, duration, easing, expression, line, linkData, linkStart, object, params, ref, ref1, result, sound, textTokens, values;
    if (formattingOnly) {
      return Component_MessageTextRenderer.__super__.processControlToken.call(this, token);
    }
    result = null;
    switch (token.code) {
      case "CR":
        character = RecordManager.charactersArray.first(function(c) {
          var ref;
          return ((ref = c.name.defaultText) != null ? ref : c.name) === token.value;
        });
        if (character) {
          SceneManager.scene.currentCharacter = character;
        }
        break;
      case "CE":
        params = {
          "values": token.values
        };
        if ((ref = this.object.events) != null) {
          ref.emit("callCommonEvent", this.object, {
            commonEventId: token.value,
            params: params,
            finish: false,
            waiting: true
          });
        }
        break;
      case "X":
        if (typeof token.value === "function") {
          token.value(this.object);
        }
        break;
      case "A":
        animation = RecordManager.animationsArray.first(function(a) {
          return a.name === token.value;
        });
        if (!animation) {
          animation = RecordManager.animations[token.value];
        }
        if ((animation != null ? animation.graphic.name : void 0) != null) {
          bitmap = ResourceManager.getBitmap("Graphics/Pictures/" + animation.graphic.name);
          object = new gs.Object_Animation(animation);
          this.addCustomObject(object);
          this.currentX += Math.round(bitmap.width / animation.framesX);
          this.currentSprite.srcRect.width += Math.round(bitmap.width / animation.framesX);
        }
        break;
      case "RT":
        if (token.rtSize.width > token.rbSize.width) {
          this.currentX += token.rtSize.width;
          this.font.set(this.getRubyTextFont(token));
        } else {
          this.currentX += token.rbSize.width;
        }
        break;
      case "LK":
        if (token.value === 'E') {
          object = new ui.Object_Hotspot();
          object.enabled = true;
          object.setup();
          this.addCustomObject(object);
          object.dstRect.x = this.object.dstRect.x + this.object.origin.x + this.customData.linkData.cx;
          object.dstRect.y = this.object.dstRect.y + this.object.origin.y + this.customData.linkData.cy;
          object.dstRect.width = this.currentX - this.customData.linkData.cx;
          object.dstRect.height = this.currentLineHeight;
          object.events.on("click", gs.CallBack("onLinkClick", this), {
            linkData: this.customData.linkData
          }, this);
        } else {
          this.customData.linkData = {
            cx: this.currentX,
            cy: this.currentY,
            commonEventId: token.value,
            tokenIndex: this.tokenIndex
          };
        }
        break;
      case "SLK":
        if (token.value === 'E') {
          linkData = this.customData.linkData[this.line].last();
          line = this.lines[this.line].content;
          linkStart = this.findToken(this.tokenIndex - 1, "SLK", -1, line);
          textTokens = this.findTokensBetween(linkData.tokenIndex, this.tokenIndex, null, line);
          linkData.cx = linkStart.customData.offsetX;
          linkData.width = this.currentX - linkData.cx + this.padding;
          linkData.height = this.currentSprite.bitmap.height;
          object = new ui.Object_Text();
          object.text = textTokens.select((function(_this) {
            return function(x) {
              return x.value;
            };
          })(this)).join("");
          object.formatting = false;
          object.wordWrap = false;
          object.ui = new ui.Component_UIBehavior();
          object.enabled = true;
          object.addComponent(object.ui);
          object.addComponent(new gs.Component_HotspotBehavior());
          object.behavior.padding.left = 0;
          object.behavior.padding.right = 0;
          object.dstRect.width = linkData.width;
          object.dstRect.height = linkData.height;
          if (linkData.styleIndex === -1) {
            ui.UIManager.addControlStyles(object, ["hyperlink"]);
          } else {
            ui.UIManager.addControlStyles(object, ["hyperlink-" + linkData.styleIndex]);
          }
          object.setup();
          this.addCustomObject(object);
          object.dstRect.x = this.currentSprite.x + linkData.cx;
          object.dstRect.y = this.object.dstRect.y + this.object.origin.y + linkData.cy;
          object.events.on("click", gs.CallBack("onLinkClick", this), {
            linkData: linkData
          }, this);
        } else {
          if (!this.customData.linkData) {
            this.customData.linkData = [];
          }
          if (!this.customData.linkData[this.line]) {
            this.customData.linkData[this.line] = [];
          }
          if ((ref1 = token.value) != null ? ref1.contains(",") : void 0) {
            values = token.value.split(",");
            this.customData.linkData[this.line].push({
              cx: this.currentX,
              cy: this.currentY,
              commonEventId: values[0],
              styleIndex: parseInt(values[1]),
              tokenIndex: this.tokenIndex
            });
          } else {
            this.customData.linkData[this.line].push({
              cx: this.currentY,
              cy: this.currentY,
              commonEventId: token.value,
              tokenIndex: this.tokenIndex,
              styleIndex: -1
            });
          }
        }
        break;
      case "E":
        expression = RecordManager.characterExpressionsArray.first(function(c) {
          var ref2;
          return ((ref2 = c.name.defaultText) != null ? ref2 : c.name) === token.value;
        });
        if (!expression) {
          expression = RecordManager.characterExpressions[token.value];
        }
        character = SceneManager.scene.currentCharacter;
        if ((expression != null) && ((character != null ? character.index : void 0) != null)) {
          duration = GameManager.defaults.character.expressionDuration;
          easing = gs.Easings.fromObject(GameManager.defaults.character.changeEasing);
          animation = GameManager.defaults.character.changeAnimation;
          object = SceneManager.scene.characters.first(function(c) {
            return c.rid === character.index;
          });
          if (object != null) {
            object.behavior.changeExpression(expression, animation, easing, duration);
          }
        }
        break;
      case "SP":
        sound = RecordManager.system.sounds[token.value - 1];
        AudioManager.playSound(sound);
        break;
      case "S":
        GameManager.settings.messageSpeed = token.value;
        break;
      case "W":
        this.drawImmediately = false;
        if (!GameManager.tempSettings.skip) {
          if (token.value === "A") {
            this.waitForKey = true;
          } else {
            this.waitCounter = Math.round(token.value / 1000 * Graphics.frameRate);
          }
        }
        break;
      case "WE":
        this.waitAtEnd = token.value === "Y";
        break;
      case "DI":
        this.drawImmediately = token.value === 1 || token.value === "Y";
        break;
      default:
        result = Component_MessageTextRenderer.__super__.processControlToken.call(this, token);
    }
    return result;
  };


  /**
  * Clears/Resets the text-renderer.
  *
  * @method clear
   */

  Component_MessageTextRenderer.prototype.clear = function() {
    var j, len, ref, ref1, ref2, sprite;
    this.charIndex = 0;
    this.currentX = 0;
    this.currentY = 0;
    this.line = 0;
    this.lines = [];
    this.clearCustomObjects();
    if ((ref = this.object.bitmap) != null) {
      ref.clear();
    }
    ref1 = this.allSprites;
    for (j = 0, len = ref1.length; j < len; j++) {
      sprite = ref1[j];
      sprite.dispose();
      if ((ref2 = sprite.bitmap) != null) {
        ref2.dispose();
      }
    }
    this.allSprites = [];
    return null;
  };


  /**
  * Clears/Disposes all sprites used to display the text-lines/parts.
  *
  * @method clearAllSprites
   */

  Component_MessageTextRenderer.prototype.clearAllSprites = function() {
    var j, len, ref, ref1, sprite;
    ref = this.allSprites;
    for (j = 0, len = ref.length; j < len; j++) {
      sprite = ref[j];
      sprite.dispose();
      if ((ref1 = sprite.bitmap) != null) {
        ref1.dispose();
      }
    }
    return null;
  };


  /**
  * Clears/Disposes the sprites used to display the text-lines/parts of the current/last message.
  *
  * @method clearSprites
   */

  Component_MessageTextRenderer.prototype.clearSprites = function() {
    var j, len, ref, ref1, sprite;
    ref = this.sprites;
    for (j = 0, len = ref.length; j < len; j++) {
      sprite = ref[j];
      sprite.dispose();
      if ((ref1 = sprite.bitmap) != null) {
        ref1.dispose();
      }
    }
    return null;
  };


  /**
  * Removes a game object from the message.
  *
  * @method removeCustomObject
  * @param object {gs.Object_Base} The game object to remove.
   */

  Component_MessageTextRenderer.prototype.removeCustomObject = function(object) {
    SceneManager.scene.removeObject(object);
    object.dispose();
    return this.customObjects.remove(object);
  };


  /**
  * Adds a game object to the message which is alive until the message is
  * erased. Can be used to display animationed-icons, etc. in a message.
  *
  * @method addCustomObject
  * @param object {gs.Object_Base} The game object to add.
   */

  Component_MessageTextRenderer.prototype.addCustomObject = function(object) {
    object.dstRect.x = this.object.dstRect.x + this.object.origin.x + this.currentX;
    object.dstRect.y = this.object.dstRect.y + this.object.origin.y + this.currentY;
    object.zIndex = this.object.zIndex + 1;
    object.update();
    SceneManager.scene.addObject(object);
    return this.customObjects.push(object);
  };


  /**
  * Clears the list of custom game objects. All game objects are disposed and removed
  * from the scene.
  *
  * @method clearCustomObjects
  * @param object {Object} The game object to add.
   */

  Component_MessageTextRenderer.prototype.clearCustomObjects = function() {
    var j, len, object, ref;
    ref = this.customObjects;
    for (j = 0, len = ref.length; j < len; j++) {
      object = ref[j];
      object.dispose();
      SceneManager.scene.removeObject(object);
    }
    return this.customObjects = [];
  };


  /**
  * Creates the bitmap for a specified line-object.
  *
  * @method createBitmap
  * @private
  * @param {Object} line - A line-object.
  * @return {Bitmap} A newly created bitmap containing the line-text.
   */

  Component_MessageTextRenderer.prototype.createBitmap = function(line) {
    var bitmap;
    this.font = this.object.font;
    bitmap = new Bitmap(this.object.dstRect.width, Math.max(this.minLineHeight, line.height));
    bitmap.font = this.font;
    return bitmap;
  };


  /**
  * Draws the line's content on the specified bitmap.
  *
  * @method drawLineContent
  * @protected
  * @param {Object} line - A line-object which should be drawn on the bitmap.
  * @param {gs.Bitmap} bitmap - The bitmap to draw the line's content on.
  * @param {number} length - Determines how many characters of the specified line should be drawn. You can 
  * specify -1 to draw all characters.
   */

  Component_MessageTextRenderer.prototype.drawLineContent = function(line, bitmap, length) {
    var currentX, drawAll, i, j, len, ref, size, token, value;
    bitmap.clear();
    currentX = this.padding;
    drawAll = length === -1;
    ref = line.content;
    for (i = j = 0, len = ref.length; j < len; i = ++j) {
      token = ref[i];
      if (i > this.tokenIndex && !drawAll) {
        break;
      }
      if (token.code != null) {
        size = this.measureControlToken(token, bitmap);
        this.drawControlToken(token, bitmap, currentX);
        if (size) {
          currentX += size.width;
        }
        this.processControlToken(token, true, line);
      } else if (token.value.length > 0) {
        token.applyFormat(this.font);
        value = token.value;
        if (!drawAll && this.tokenIndex === i && value.length > length) {
          value = value.substring(0, length);
        }
        if (value !== "\n") {
          size = this.font.measureTextPlain(value);
          bitmap.drawText(currentX, line.height - (size.height - this.font.descent) - line.descent, size.width, bitmap.height, value, 0, 0);
          currentX += size.width;
        }
      }
    }
    return line.contentWidth = currentX + this.font.measureTextPlain(" ").width;
  };


  /**
  * Creates the sprite for a specified line-object.
  *
  * @method createSprite
  * @private
  * @param {Object} line - A line-object.
  * @return {Sprite} A newly created sprite object containing the line-text as bitmap.
   */

  Component_MessageTextRenderer.prototype.createSprite = function(line) {
    var bitmap, sprite;
    bitmap = this.createBitmap(line);
    this.currentX = 0;
    this.waitCounter = 0;
    this.waitForKey = false;
    sprite = new Sprite(Graphics.viewport);
    sprite.bitmap = bitmap;
    sprite.visible = true;
    sprite.z = this.object.zIndex + 1;
    sprite.srcRect = new Rect(0, 0, 0, bitmap.height);
    return sprite;
  };


  /**
  * Creates the sprites for a specified array of line-objects.
  *
  * @method createSprites
  * @private
  * @see gs.Component_MessageTextRenderer.createSprite.
  * @param {Array} lines - An array of line-objects.
  * @return {Array} An array of sprites.
   */

  Component_MessageTextRenderer.prototype.createSprites = function(lines) {
    var i, j, len, line, result, sprite;
    this.fontSize = this.object.font.size;
    result = [];
    for (i = j = 0, len = lines.length; j < len; i = ++j) {
      line = lines[i];
      sprite = this.createSprite(line);
      result.push(sprite);
    }
    return result;
  };


  /**
  * Starts a new line.
  *
  * @method newLine
   */

  Component_MessageTextRenderer.prototype.newLine = function() {
    this.currentX = 0;
    return this.currentY += this.currentLineHeight + this.lineSpacing;
  };


  /**
  * Displays a formatted text immediately without any delays or animations. The
  * Component_TextRenderer.drawFormattedText method from the base-class cannot
  * be used here because it would render to the game object's bitmap object while
  * this method is rendering to the sprites.
  *
  * @method drawFormattedTextImmediately
  * @param {number} x - The x-coordinate of the text's position.
  * @param {number} y - The y-coordinate of the text's position.
  * @param {number} width - Deprecated. Can be null.
  * @param {number} height - Deprecated. Can be null.
  * @param {string} text - The text to draw.
  * @param {boolean} wordWrap - If wordWrap is set to true, line-breaks are automatically created.
   */

  Component_MessageTextRenderer.prototype.drawFormattedTextImmediately = function(x, y, width, height, text, wordWrap) {
    this.drawFormattedText(x, y, width, height, text, wordWrap);
    while (true) {
      this.nextChar();
      if (this.line >= this.maxLines) {
        this.isRunning = false;
      } else {
        this.drawNext();
      }
      if (!this.isRunning) {
        break;
      }
    }
    this.currentY += this.currentLineHeight + this.lineSpacing;
    return null;
  };


  /**
  * Starts the rendering-process for the message.
  *
  * @method drawFormattedText
  * @param {number} x - The x-coordinate of the text's position.
  * @param {number} y - The y-coordinate of the text's position.
  * @param {number} width - Deprecated. Can be null.
  * @param {number} height - Deprecated. Can be null.
  * @param {string} text - The text to draw.
  * @param {boolean} wordWrap - If wordWrap is set to true, line-breaks are automatically created.
   */

  Component_MessageTextRenderer.prototype.drawFormattedText = function(x, y, width, height, text, wordWrap) {
    var currentX, ref;
    text = text || " ";
    this.font.set(this.object.font);
    this.speed = 11 - Math.round(GameManager.settings.messageSpeed * 2.5);
    this.isRunning = true;
    this.drawImmediately = false;
    this.lineAnimationCount = this.speed;
    this.currentLineHeight = 0;
    this.isWaiting = false;
    this.waitForKey = false;
    this.charIndex = 0;
    this.token = null;
    this.tokenIndex = 0;
    this.message = text;
    this.line = 0;
    this.currentLine = this.line;
    currentX = this.currentX;
    this.lines = this.calculateLines(lcsm(this.message), wordWrap, this.currentX);
    this.sprites = this.createSprites(this.lines);
    this.allSprites = this.allSprites.concat(this.sprites);
    this.currentX = currentX;
    this.currentSprite = this.sprites[this.line];
    this.currentSprite.x = this.currentX + this.object.origin.x + this.object.dstRect.x;
    this.maxLines = this.calculateMaxLines(this.lines);
    this.token = ((ref = this.lines[this.line]) != null ? ref.content[this.tokenIndex] : void 0) || new gs.RendererToken(null, "");
    return this.start();
  };


  /**
  * Starts the message-rendering process.
  *
  * @method start
  * @protected
   */

  Component_MessageTextRenderer.prototype.start = function() {
    var ref;
    if (GameManager.tempSettings.skip && GameManager.tempSettings.skipTime === 0) {
      return this.instantSkip();
    } else if (this.maxLines === 0) {
      if (((ref = this.lines[0]) != null ? ref.content : void 0) === "") {
        return this.finish();
      } else {
        this.maxLines = 1;
        return this.drawNext();
      }
    } else {
      return this.drawNext();
    }
  };


  /**
  * Skips the current message and finishes the message-processing immediately. The message
  * tokens are processed but not rendered.
  *
  * @method instantSkip
   */

  Component_MessageTextRenderer.prototype.instantSkip = function() {
    var ref;
    while (true) {
      if (this.line < this.maxLines) {
        this.nextChar();
      }
      if (this.line >= this.maxLines) {
        break;
      } else {
        this.processToken();
      }
      if (!(this.isRunning && this.line < this.maxLines)) {
        break;
      }
    }
    if ((ref = this.object.events) != null) {
      ref.emit("messageWaiting", this);
    }
    return this["continue"]();
  };


  /**
  * Processes the current token.
  *
  * @method processToken
   */

  Component_MessageTextRenderer.prototype.processToken = function() {
    var base, token;
    token = null;
    if (this.token.code != null) {
      token = this.processControlToken(this.token, false);
      if (token != null) {
        this.token = token;
        if (typeof (base = this.token).onStart === "function") {
          base.onStart();
        }
      }
    } else {
      token = this.token;
    }
    return token;
  };

  return Component_MessageTextRenderer;

})(gs.Component_TextRenderer);

gs.Component_MessageTextRenderer = Component_MessageTextRenderer;

//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQU9BLElBQUEsNkJBQUE7RUFBQTs7O0FBQU07OztFQUNGLDZCQUFDLENBQUEsb0JBQUQsR0FBd0IsQ0FBQyxhQUFELEVBQWdCLGtCQUFoQjs7O0FBQ3hCOzs7Ozs7Ozs7MENBUUEsbUJBQUEsR0FBcUIsU0FBQyxJQUFELEVBQU8sT0FBUDtBQUNqQixRQUFBO0lBQUEsSUFBQyxDQUFBLGtCQUFELENBQUE7SUFDQSxDQUFBLEdBQUk7QUFFSjtBQUFBLFNBQUEscUNBQUE7O01BQ0ksSUFBRyxJQUFDLENBQUEsTUFBTSxDQUFDLFFBQVEsQ0FBQyxpQkFBcEI7UUFDSSxJQUFDLENBQUEsTUFBTSxDQUFDLElBQUksQ0FBQyxLQUFiLEdBQXlCLElBQUEsRUFBRSxDQUFDLEtBQUgsQ0FBUyxPQUFPLENBQUMsU0FBUyxDQUFDLFNBQTNCLEVBRDdCOztNQUVBLElBQUMsQ0FBQSxLQUFELEdBQVMsSUFBQyxDQUFBLGNBQUQsQ0FBZ0IsSUFBQSxDQUFLLE9BQU8sQ0FBQyxJQUFiLENBQWhCLEVBQW9DLElBQXBDLEVBQXlDLENBQXpDO0FBQ1Q7QUFBQSxXQUFBLHdDQUFBOztRQUNJLE1BQUEsR0FBUyxJQUFDLENBQUEsWUFBRCxDQUFjLElBQWQ7UUFDVCxJQUFHLElBQUEsS0FBUSxJQUFDLENBQUEsSUFBWjtVQUNJLElBQUMsQ0FBQSxlQUFELENBQWlCLElBQWpCLEVBQXVCLE1BQXZCLEVBQStCLElBQUMsQ0FBQSxTQUFELEdBQVcsQ0FBMUMsRUFESjtTQUFBLE1BQUE7VUFHSSxJQUFDLENBQUEsZUFBRCxDQUFpQixJQUFqQixFQUF1QixNQUF2QixFQUErQixDQUFDLENBQWhDLEVBSEo7O1FBSUEsSUFBQyxDQUFBLFVBQVcsQ0FBQSxDQUFBLENBQUUsQ0FBQyxNQUFmLEdBQXdCO1FBQ3hCLENBQUE7QUFQSjtBQUpKO0FBY0E7QUFBQSxTQUFBLHdDQUFBOztNQUNJLFlBQVksQ0FB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QUFDLENBQUEsbUJBQUQsQ0FBcUIsSUFBQyxDQUFBLEtBQXRCLEVBQTZCLEtBQTdCO01BQ1IsSUFBRyxhQUFIO1FBQ0ksSUFBQyxDQUFBLEtBQUQsR0FBUzs7Y0FDSCxDQUFDO1NBRlg7T0FGSjtLQUFBLE1BQUE7TUFNSSxLQUFBLEdBQVEsSUFBQyxDQUFBLE1BTmI7O0FBUUEsV0FBTztFQVhHOzs7O0dBaHNDMEIsRUFBRSxDQUFDOztBQStzQy9DLEVBQUUsQ0FBQyw2QkFBSCxHQUFtQyIsInNvdXJjZXNDb250ZW50IjpbIiMgPT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PVxuI1xuIyAgIFNjcmlwdDogQ29tcG9uZW50X01lc3NhZ2VUZXh0UmVuZGVyZXJcbiNcbiMgICAkJENPUFlSSUdIVCQkXG4jXG4jID09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT1cbmNsYXNzIENvbXBvbmVudF9NZXNzYWdlVGV4dFJlbmRlcmVyIGV4dGVuZHMgZ3MuQ29tcG9uZW50X1RleHRSZW5kZXJlclxuICAgIEBvYmplY3RDb2RlY0JsYWNrTGlzdCA9IFtcIm9uTGlua0NsaWNrXCIsIFwib25CYXRjaERpc2FwcGVhclwiXVxuICAgICMjIypcbiAgICAqIENhbGxlZCBpZiB0aGlzIG9iamVjdCBpbnN0YW5jZSBpcyByZXN0b3JlZCBmcm9tIGEgZGF0YS1idW5kbGUuIEl0IGNhbiBiZSB1c2VkXG4gICAgKiByZS1hc3NpZ24gZXZlbnQtaGFuZGxlciwgYW5vbnltb3VzIGZ1bmN0aW9ucywgZXRjLlxuICAgICogeFxuICAgICogQG1ldGhvZCBvbkRhdGFCdW5kbGVSZXN0b3JlLlxuICAgICogQHBhcmFtIE9iamVjdCBkYXRhIC0gVGhlIGRhdGEtYnVuZGxlXG4gICAgKiBAcGFyYW0gZ3MuT2JqZWN0Q29kZWNDb250ZXh0IGNvbnRleHQgLSBUaGUgY29kZWMtY29udGV4dC5cbiAgICAjIyNcbiAgICBvbkRhdGFCdW5kbGVSZXN0b3JlOiAoZGF0YSwgY29udGV4dCkgLT5cbiAgICAgICAgQHNldHVwRXZlbnRIYW5kbGVycygpXG4gICAgICAgIGwgPSAwXG4gICAgICAgIFxuICAgICAgICBmb3IgbWVzc2FnZSBpbiBAb2JqZWN0Lm1lc3NhZ2VzXG4gICAgICAgICAgICBpZiBAb2JqZWN0LnNldHRpbmdzLnVzZUNoYXJhY3RlckNvbG9yXG4gICAgICAgICAgICAgICAgQG9iamVjdC5mb250LmNvbG9yID0gbmV3IGdzLkNvbG9yKG1lc3NhZ2UuY2hhcmFjdGVyLnRleHRDb2xvcilcbiAgICAgICAgICAgIEBsaW5lcyA9IEBjYWxjdWxhdGVMaW5lcyhsY3NtKG1lc3NhZ2UudGV4dCksIHllcywgMClcbiAgICAgICAgICAgIGZvciBsaW5lIGluIEBsaW5lc1xuICAgICAgICAgICAgICAgIGJpdG1hcCA9IEBjcmVhdGVCaXRtYXAobGluZSlcbiAgICAgICAgICAgICAgICBpZiBsaW5lID09IEBsaW5lXG4gICAgICAgICAgICAgICAgICAgIEBkcmF3TGluZUNvbnRlbnQobGluZSwgYml0bWFwLCBAY2hhckluZGV4KzEpXG4gICAgICAgICAgICAgICAgZWxzZVxuICAgICAgICAgICAgICAgICAgICBAZHJhd0xpbmVDb250ZW50KGxpbmUsIGJpdG1hcCwgLTEpXG4gICAgICAgICAgICAgICAgQGFsbFNwcml0ZXNbbF0uYml0bWFwID0gYml0bWFwXG4gICAgICAgICAgICAgICAgbCsrXG4gICAgICAgICAgICAgICAgXG4gICAgICAgICAgXG4gICAgICAgIGZvciBjdXN0b21PYmplY3QgaW4gQGN1c3RvbU9iamVjdHNcbiAgICAgICAgICAgIFNjZW5lTWFuYWdlci5zY2VuZS5hZGRPYmplY3QoY3VzdG9tT2JqZWN0KVxuICAgICAgICAgICAgICAgIFxuICAgICAgICByZXR1cm4gbnVsbFxuICAgICAgICBcbiAgICAjIyMqXG4gICAgKiAgQSB0ZXh0LXJlbmRlcmVyIGNvbXBvbmVudCB0byByZW5kZXIgYW4gYW5pbWF0ZWQgYW5kIGludGVyYWN0aXZlIG1lc3NhZ2UgdGV4dCB1c2luZ1xuICAgICogIGRpbWVuc2lvbnMgb2YgdGhlIGdhbWUgb2JqZWN0J3MgZGVzdGluYXRpb24tcmVjdGFuZ2xlLiBUaGUgbWVzc2FnZSBpcyBkaXNwbGF5ZWRcbiAgICAqICB1c2luZyBhIHNwcml0ZSBmb3IgZWFjaCBsaW5lIGluc3RlYWQgb2YgZHJhd2luZyB0byB0aGUgZ2FtZSBvYmplY3QncyBiaXRtYXAgb2JqZWN0LlxuICAgICpcbiAgICAqICBAbW9kdWxlIGdzXG4gICAgKiAgQGNsYXNzIENvbXBvbmVudF9NZXNzYWdlVGV4dFJlbmRlcmVyXG4gICAgKiAgQGV4dGVuZHMgZ3MuQ29tcG9uZW50X1RleHRSZW5kZXJlclxuICAgICogIEBtZW1iZXJvZiBnc1xuICAgICogIEBjb25zdHJ1Y3RvclxuICAgICMjI1xuICAgIGNvbnN0cnVjdG9yOiAtPlxuICAgICAgICBzdXBlclxuICAgICAgICBcbiAgICAgICAgIyMjKlxuICAgICAgICAqIEFuIGFycmF5IGNvbnRhaW5pbmcgYWxsIHNwcml0ZXMgb2YgdGhlIGN1cnJlbnQgbWVzc2FnZS5cbiAgICAgICAgKiBAcHJvcGVydHkgc3ByaXRlc1xuICAgICAgICAqIEB0eXBlIGdzLlNwcml0ZVtdXG4gICAgICAgICogQHByb3RlY3RlZFxuICAgICAgICAjIyNcbiAgICAgICAgQHNwcml0ZXMgPSBbXVxuICAgICAgICBcbiAgICAgICAgIyMjKlxuICAgICAgICAqIEFuIGFycmF5IGNvbnRhaW5pbmcgYWxsIHNwcml0ZXMgb2YgYWxsIG1lc3NhZ2VzLiBJbiBOVkwgbW9kZVxuICAgICAgICAqIGEgcGFnZSBjYW4gY29udGFpbiBtdWx0aXBsZSBtZXNzYWdlcy5cbiAgICAgICAgKiBAcHJvcGVydHkgYWxsU3ByaXRlc1xuICAgICAgICAqIEB0eXBlIGdzLlNwcml0ZVtdXG4gICAgICAgICogQHByb3RlY3RlZFxuICAgICAgICAjIyNcbiAgICAgICAgQGFsbFNwcml0ZXMgPSBbXVxuICAgICAgICAjIyMqXG4gICAgICAgICogQW4gYXJyYXkgY29udGFpbmluZyBhbGwgbGluZS1vYmplY3RzIG9mIHRoZSBjdXJyZW50IG1lc3NhZ2UuXG4gICAgICAgICogQHByb3BlcnR5IGxpbmVzXG4gICAgICAgICogQHR5cGUgZ3MuVGV4dFJlbmRlcmVyTGluZVtdXG4gICAgICAgICogQHJlYWRPbmx5XG4gICAgICAgICMjI1xuICAgICAgICBAbGluZXMgPSBudWxsXG4gICAgICAgIFxuICAgICAgICAjIyMqXG4gICAgICAgICogVGhlIGxpbmUgY3VycmVudGx5IHJlbmRlcmVkLlxuICAgICAgICAqIEBwcm9wZXJ0eSBsaW5lXG4gICAgICAgICogQHR5cGUgbnVtYmVyXG4gICAgICAgICogQHJlYWRPbmx5XG4gICAgICAgICMjI1xuICAgICAgICBAbGluZSA9IDBcbiAgICAgICAgXG4gICAgICAgICMjIypcbiAgICAgICAgKiBUaGUgbGVmdCBhbmQgcmlnaHQgcGFkZGluZyBwZXIgbGluZS5cbiAgICAgICAgKiBAcHJvcGVydHkgcGFkZGluZ1xuICAgICAgICAqIEB0eXBlIG51bWJlclxuICAgICAgICAjIyNcbiAgICAgICAgQHBhZGRpbmcgPSA2XG4gICAgICAgIFxuICAgICAgICAjIyMqXG4gICAgICAgICogVGhlIG1pbmltdW0gaGVpZ2h0IG9mIHRoZSBsaW5lIGN1cnJlbnRseSByZW5kZXJlZC4gSWYgMCwgdGhlIG1lYXN1cmVkXG4gICAgICAgICogaGVpZ2h0IG9mIHRoZSBsaW5lIHdpbGwgYmUgdXNlZC5cbiAgICAgICAgKiBAcHJvcGVydHkgbWluTGluZUhlaWdodFxuICAgICAgICAqIEB0eXBlIG51bWJlclxuICAgICAgICAjIyNcbiAgICAgICAgQG1pbkxpbmVIZWlnaHQgPSAwXG4gICAgICAgIFxuICAgICAgICAjIyMqXG4gICAgICAgICogVGhlIHNwYWNpbmcgYmV0d2VlbiB0ZXh0IGxpbmVzIGluIHBpeGVscy5cbiAgICAgICAgKiBAcHJvcGVydHkgbGluZVNwYWNpbmdcbiAgICAgICAgKiBAdHlwZSBudW1iZXJcbiAgICAgICAgIyMjXG4gICAgICAgIEBsaW5lU3BhY2luZyA9IDJcbiAgICAgICAgXG4gICAgICAgICMjIypcbiAgICAgICAgKiBUaGUgbGluZSBjdXJyZW50bHkgcmVuZGVyZWQuXG4gICAgICAgICogQHByb3BlcnR5IGN1cnJlbnRMaW5lXG4gICAgICAgICogQHR5cGUgbnVtYmVyXG4gICAgICAgICogQHByb3RlY3RlZFxuICAgICAgICAjIyNcbiAgICAgICAgQGN1cnJlbnRMaW5lID0gMFxuICAgICAgICBcbiAgICAgICAgIyMjKlxuICAgICAgICAqIFRoZSBoZWlnaHQgb2YgdGhlIGxpbmUgY3VycmVudGx5IHJlbmRlcmVkLlxuICAgICAgICAqIEBwcm9wZXJ0eSBjdXJyZW50TGluZUhlaWdodFxuICAgICAgICAqIEB0eXBlIG51bWJlclxuICAgICAgICAqIEBwcm90ZWN0ZWRcbiAgICAgICAgIyMjXG4gICAgICAgIEBjdXJyZW50TGluZUhlaWdodCA9IDBcbiAgICAgICAgXG4gICAgICAgICMjIypcbiAgICAgICAgKiBJbmRleCBvZiB0aGUgY3VycmVudCBjaGFyYWN0ZXIgdG8gZHJhdy5cbiAgICAgICAgKiBAcHJvcGVydHkgY2hhckluZGV4XG4gICAgICAgICogQHR5cGUgbnVtYmVyXG4gICAgICAgICogQHJlYWRPbmx5XG4gICAgICAgICMjI1xuICAgICAgICBAY2hhckluZGV4ID0gMFxuICAgICAgICBcbiAgICAgICAgIyMjKlxuICAgICAgICAqIFBvc2l0aW9uIG9mIHRoZSBtZXNzYWdlIGNhcmV0LiBUaGUgY2FyZXQgaXMgbGlrZSBhbiBpbnZpc2libGVcbiAgICAgICAgKiBjdXJzb3IgcG9pbnRpbmcgdG8gdGhlIHgveSBjb29yZGluYXRlcyBvZiB0aGUgbGFzdCByZW5kZXJlZCBjaGFyYWN0ZXIgb2ZcbiAgICAgICAgKiB0aGUgbWVzc2FnZS4gVGhhdCBwb3NpdGlvbiBjYW4gYmUgdXNlZCB0byBkaXNwbGF5IGEgd2FpdGluZy0gb3IgcHJvY2Vzc2luZy1hbmltYXRpb24gZm9yIGV4YW1wbGUuXG4gICAgICAgICogQHByb3BlcnR5IGNhcmV0UG9zaXRpb25cbiAgICAgICAgKiBAdHlwZSBncy5Qb2ludFxuICAgICAgICAqIEByZWFkT25seVxuICAgICAgICAjIyNcbiAgICAgICAgQGNhcmV0UG9zaXRpb24gPSBuZXcgZ3MuUG9pbnQoKVxuICAgICAgICBcbiAgICAgICAgIyMjKlxuICAgICAgICAqIEluZGljYXRlcyB0aGF0IHRoZSBhIG1lc3NhZ2UgaXMgY3VycmVudGx5IGluIHByb2dyZXNzLlxuICAgICAgICAqIEBwcm9wZXJ0eSBpc1J1bm5pbmdcbiAgICAgICAgKiBAdHlwZSBib29sZWFuXG4gICAgICAgICogQHJlYWRPbmx5XG4gICAgICAgICMjI1xuICAgICAgICBAaXNSdW5uaW5nID0gbm9cbiAgICAgICAgXG4gICAgICAgICMjIypcbiAgICAgICAgKiBUaGUgY3VycmVudCB4LWNvb3JkaW5hdGUgb2YgdGhlIGNhcmV0L2N1cnNvci5cbiAgICAgICAgKiBAcHJvcGVydHkgY3VycmVudFhcbiAgICAgICAgKiBAdHlwZSBudW1iZXJcbiAgICAgICAgKiBAcmVhZE9ubHlcbiAgICAgICAgIyMjXG4gICAgICAgIEBjdXJyZW50WCA9IDBcbiAgICAgICAgXG4gICAgICAgICMjIypcbiAgICAgICAgKiBUaGUgY3VycmVudCB5LWNvb3JkaW5hdGUgb2YgdGhlIGNhcmV0L2N1cnNvci5cbiAgICAgICAgKiBAcHJvcGVydHkgY3VycmVudFlcbiAgICAgICAgKiBAdHlwZSBudW1iZXJcbiAgICAgICAgKiBAcmVhZE9ubHlcbiAgICAgICAgIyMjXG4gICAgICAgIEBjdXJyZW50WSA9IDBcbiAgICAgICAgXG4gICAgICAgICMjIypcbiAgICAgICAgKiBUaGUgY3VycmVudCBzcHJpdGVzIHVzZWQgdG8gZGlzcGxheSB0aGUgY3VycmVudCB0ZXh0LWxpbmUvcGFydC5cbiAgICAgICAgKiBAcHJvcGVydHkgY3VycmVudFNwcml0ZVxuICAgICAgICAqIEB0eXBlIGdzLlNwcml0ZVxuICAgICAgICAqIEByZWFkT25seVxuICAgICAgICAjIyNcbiAgICAgICAgQGN1cnJlbnRTcHJpdGUgPSBudWxsXG4gICAgICAgIFxuICAgICAgICAjIyMqXG4gICAgICAgICogSW5kaWNhdGVzIGlmIHRoZSBtZXNzYWdlLXJlbmRlcmVyIGlzIGN1cnJlbnRseSB3YWl0aW5nIGxpa2UgZm9yIGEgdXNlci1hY3Rpb24uXG4gICAgICAgICogQHByb3BlcnR5IGlzV2FpdGluZ1xuICAgICAgICAqIEB0eXBlIGJvb2xlYW5cbiAgICAgICAgKiBAcmVhZE9ubHlcbiAgICAgICAgIyMjXG4gICAgICAgIEBpc1dhaXRpbmcgPSBub1xuICAgICAgICBcbiAgICAgICAgIyMjKlxuICAgICAgICAqIEluZGljYXRlcyBpZiB0aGUgbWVzc2FnZS1yZW5kZXJlciBpcyBjdXJyZW50bHkgd2FpdGluZyBmb3IgYSBrZXktcHJlc3Mgb3IgbW91c2UvdG91Y2ggYWN0aW9uLlxuICAgICAgICAqIEBwcm9wZXJ0eSB3YWl0Rm9yS2V5XG4gICAgICAgICogQHR5cGUgYm9vbGVhblxuICAgICAgICAqIEByZWFkT25seVxuICAgICAgICAjIyNcbiAgICAgICAgQHdhaXRGb3JLZXkgPSBub1xuICAgICAgICBcbiAgICAgICAgIyMjKlxuICAgICAgICAqIE51bWJlciBvZiBmcmFtZXMgdGhlIG1lc3NhZ2UtcmVuZGVyZXIgc2hvdWxkIHdhaXQgYmVmb3JlIGNvbnRpbnVlLlxuICAgICAgICAqIEBwcm9wZXJ0eSB3YWl0Q291bnRlclxuICAgICAgICAqIEB0eXBlIG51bWJlclxuICAgICAgICAjIyNcbiAgICAgICAgQHdhaXRDb3VudGVyID0gMFxuICAgICAgICBcbiAgICAgICAgIyMjKlxuICAgICAgICAqIFNwZWVkIG9mIHRoZSBtZXNzYWdlLWRyYXdpbmcuIFRoZSBzbWFsbGVyIHRoZSB2YWx1ZSwgdGhlIGZhc3RlciB0aGUgbWVzc2FnZSBpcyBkaXNwbGF5ZWQuXG4gICAgICAgICogQHByb3BlcnR5IHNwZWVkXG4gICAgICAgICogQHR5cGUgbnVtYmVyXG4gICAgICAgICMjI1xuICAgICAgICBAc3BlZWQgPSAxXG4gICAgICAgIFxuICAgICAgICAjIyMqXG4gICAgICAgICogSW5kaWNhdGVzIGlmIHRoZSBtZXNzYWdlIHNob3VsZCBiZSByZW5kZXJlZCBpbW1lZGlhbHRlbHkgd2l0aG91dCBhbnkgYW5pbWF0aW9uIG9yIGRlbGF5LlxuICAgICAgICAqIEBwcm9wZXJ0eSBkcmF3SW1tZWRpYXRlbHlcbiAgICAgICAgKiBAdHlwZSBib29sZWFuXG4gICAgICAgICMjI1xuICAgICAgICBAZHJhd0ltbWVkaWF0ZWx5ID0gbm9cbiAgICAgICAgXG4gICAgICAgICMjIypcbiAgICAgICAgKiBJbmRpY2F0ZXMgaWYgdGhlIG1lc3NhZ2Ugc2hvdWxkIHdhaXQgZm9yIGEgdXNlci1hY3Rpb24gb3IgYSBjZXJ0YWluIGFtb3VudCBvZiB0aW1lXG4gICAgICAgICogYmVmb3JlIGZpbmlzaGluZy5cbiAgICAgICAgKiBAcHJvcGVydHkgd2FpdEF0RW5kXG4gICAgICAgICogQHR5cGUgYm9vbGVhblxuICAgICAgICAjIyNcbiAgICAgICAgQHdhaXRBdEVuZCA9IHllc1xuICAgICAgICBcbiAgICAgICAgIyMjKlxuICAgICAgICAqIFRoZSBudW1iZXIgb2YgZnJhbWVzIHRvIHdhaXQgYmVmb3JlIGZpbmlzaGluZyBhIG1lc3NhZ2UuXG4gICAgICAgICogYmVmb3JlIGZpbmlzaGluZy5cbiAgICAgICAgKiBAcHJvcGVydHkgd2FpdEF0RW5kVGltZVxuICAgICAgICAqIEB0eXBlIG51bWJlclxuICAgICAgICAjIyNcbiAgICAgICAgQHdhaXRBdEVuZFRpbWUgPSAwXG4gICAgICAgIFxuICAgICAgICAjIyMqXG4gICAgICAgICogSW5kaWNhdGVzIGlmIGF1dG8gd29yZC13cmFwIHNob3VsZCBiZSB1c2VkLiBEZWZhdWx0IGlzIDxiPnRydWU8L2I+XG4gICAgICAgICogQHByb3BlcnR5IHdvcmRXcmFwXG4gICAgICAgICogQHR5cGUgYm9vbGVhblxuICAgICAgICAjIyNcbiAgICAgICAgQHdvcmRXcmFwID0geWVzXG4gICAgICAgIFxuICAgICAgICAjIyMqXG4gICAgICAgICogQ3VzdG9tIGdhbWUgb2JqZWN0cyB3aGljaCBhcmUgYWxpdmUgdW50aWwgdGhlIGN1cnJlbnQgbWVzc2FnZSBpcyBlcmFzZWQuIENhbiBiZSB1c2VkIHRvIGRpc3BsYXlcbiAgICAgICAgKiBhbmltYXRlZCBpY29ucywgZXRjLlxuICAgICAgICAqIEBwcm9wZXJ0eSBjdXN0b21PYmplY3RzXG4gICAgICAgICogQHR5cGUgZ3MuT2JqZWN0X0Jhc2VbXVxuICAgICAgICAjIyNcbiAgICAgICAgQGN1c3RvbU9iamVjdHMgPSBbXVxuICAgICAgICBcbiAgICAgICAgIyMjKlxuICAgICAgICAqIEEgaGFzaHRhYmxlL2RpY3Rpb25hcnkgb2JqZWN0IHRvIHN0b3JlIGN1c3RvbS1kYXRhIHVzZWZ1bCBsaWtlIGZvciB0b2tlbi1wcm9jZXNzaW5nLiBUaGUgZGF0YSBtdXN0IGJlXG4gICAgICAgICogc2VyaWFsaXphYmxlLlxuICAgICAgICAqIEBwcm9wZXJ0eSBjdXN0b21PYmplY3RzXG4gICAgICAgICogQHR5cGUgT2JqZWN0XG4gICAgICAgICMjI1xuICAgICAgICBAY3VzdG9tRGF0YSA9IHt9XG4gICAgICAgIFxuICAgICAgICAjIyMqXG4gICAgICAgICogQSBjYWxsYmFjayBmdW5jdGlvbiBjYWxsZWQgaWYgdGhlIHBsYXllciBjbGlja3Mgb24gYSBub24tc3R5bGFibGUgbGluayAoTEsgdGV4dC1jb2RlKSB0byB0cmlnZ2VyXG4gICAgICAgICogdGhlIHNwZWNpZmllZCBjb21tb24gZXZlbnQuXG4gICAgICAgICogQHByb3BlcnR5IG9uTGlua0NsaWNrXG4gICAgICAgICogQHR5cGUgRnVuY3Rpb25cbiAgICAgICAgIyMjXG4gICAgICAgIEBvbkxpbmtDbGljayA9IChlKSAtPlxuICAgICAgICAgICAgZXZlbnRJZCA9IGUuZGF0YS5saW5rRGF0YS5jb21tb25FdmVudElkXG4gICAgICAgICAgICBldmVudCA9IFJlY29yZE1hbmFnZXIuY29tbW9uRXZlbnRzW2V2ZW50SWRdXG4gICAgICAgICAgICBpZiAhZXZlbnRcbiAgICAgICAgICAgICAgICBldmVudCA9IFJlY29yZE1hbmFnZXIuY29tbW9uRXZlbnRzLmZpcnN0ICh4KSA9PiB4Lm5hbWUgPT0gZXZlbnRJZFxuICAgICAgICAgICAgICAgIGV2ZW50SWQgPSBldmVudC5pbmRleCBpZiBldmVudFxuICAgICAgICAgICAgaWYgIWV2ZW50XG4gICAgICAgICAgICAgICAgU2NlbmVNYW5hZ2VyLnNjZW5lLmludGVycHJldGVyLmp1bXBUb0xhYmVsKGV2ZW50SWQpXG4gICAgICAgICAgICBlbHNlXG4gICAgICAgICAgICAgICAgU2NlbmVNYW5hZ2VyLnNjZW5lLmludGVycHJldGVyLmNhbGxDb21tb25FdmVudChldmVudElkLCBudWxsLCB5ZXMpXG4gICAgICAgIFxuICAgICAgICAjIyMqXG4gICAgICAgICogQSBjYWxsYmFjayBmdW5jdGlvbiBjYWxsZWQgaWYgYSBiYXRjaGVkIG1lc3NzYWdlIGhhcyBiZWVuIGZhZGVkIG91dC4gSXQgdHJpZ2dlcnMgdGhlIGV4ZWN1dGlvbiBvZlxuICAgICAgICAqIHRoZSBuZXh0IG1lc3NhZ2UuXG4gICAgICAgICogQHByb3BlcnR5IG9uQmF0Y2hEaXNhcHBlYXJcbiAgICAgICAgKiBAdHlwZSBGdW5jdGlvblxuICAgICAgICAjIyMgICAgXG4gICAgICAgIEBvbkJhdGNoRGlzYXBwZWFyID0gKGUpID0+IFxuICAgICAgICAgICAgQGRyYXdJbW1lZGlhdGVseSA9IG5vXG4gICAgICAgICAgICBAaXNXYWl0aW5nID0gbm9cbiAgICAgICAgICAgIEBvYmplY3Qub3BhY2l0eSA9IDI1NVxuICAgICAgICAgICAgQGV4ZWN1dGVCYXRjaCgpIFxuICAgICAgICAgICAgXG4gICAgICAgICAgICBcbiAgICAjIyMqXG4gICAgKiBTZXJpYWxpemVzIHRoZSBtZXNzYWdlIHRleHQtcmVuZGVyZXIgaW50byBhIGRhdGEtYnVuZGxlLlxuICAgICogQG1ldGhvZCB0b0RhdGFCdW5kbGVcbiAgICAqIEByZXR1cm4ge09iamVjdH0gQSBkYXRhLWJ1bmRsZS5cbiAgICAjIyNcbiAgICB0b0RhdGFCdW5kbGU6IC0+XG4gICAgICAgIGlnbm9yZSA9IFtcIm9iamVjdFwiLCBcImZvbnRcIiwgXCJzcHJpdGVzXCIsIFwiYWxsU3ByaXRlc1wiLCBcImN1cnJlbnRTcHJpdGVcIiwgXCJjdXJyZW50WFwiXVxuICAgICAgICBidW5kbGUgPSB7IGN1cnJlbnRTcHJpdGVJbmRleDogQHNwcml0ZXMuaW5kZXhPZihAY3VycmVudFNwcml0ZSkgfVxuICAgICAgICBcbiAgICAgICAgZm9yIGsgb2YgdGhpc1xuICAgICAgICAgICAgaWYgaWdub3JlLmluZGV4T2YoaykgPT0gLTFcbiAgICAgICAgICAgICAgICBidW5kbGVba10gPSB0aGlzW2tdXG4gICAgICAgICAgICAgICAgXG4gICAgICAgIHJldHVybiBidW5kbGVcbiAgICAgXG4gICAgXG4gICAgICAgICAgICBcbiAgICAjIyMqXG4gICAgKiBEaXNwb3NlcyB0aGUgbWVzc2FnZSB0ZXh0LXJlbmRlcmVyIGFuZCBhbGwgc3ByaXRlcyB1c2VkIHRvIGRpc3BsYXlcbiAgICAqIHRoZSBtZXNzYWdlLlxuICAgICogQG1ldGhvZCBkaXNwb3NlXG4gICAgIyMjXG4gICAgZGlzcG9zZTogLT5cbiAgICAgICAgc3VwZXJcbiAgICAgICAgXG4gICAgICAgIGdzLkdsb2JhbEV2ZW50TWFuYWdlci5vZmZCeU93bmVyKFwibW91c2VVcFwiLCBAb2JqZWN0KVxuICAgICAgICBncy5HbG9iYWxFdmVudE1hbmFnZXIub2ZmQnlPd25lcihcImtleVVwXCIsIEBvYmplY3QpXG4gICAgICAgIFxuICAgICAgICBmb3Igc3ByaXRlIGluIEBhbGxTcHJpdGVzXG4gICAgICAgICAgICBzcHJpdGUuYml0bWFwPy5kaXNwb3NlKClcbiAgICAgICAgICAgIHNwcml0ZS5kaXNwb3NlKClcbiAgICBcbiAgICAjIyMqXG4gICAgKiBBZGRzIGV2ZW50LWhhbmRsZXJzIGZvciBtb3VzZS90b3VjaCBldmVudHNcbiAgICAqXG4gICAgKiBAbWV0aG9kIHNldHVwRXZlbnRIYW5kbGVyc1xuICAgICMjIyBcbiAgICBzZXR1cEV2ZW50SGFuZGxlcnM6IC0+XG4gICAgICAgIGdzLkdsb2JhbEV2ZW50TWFuYWdlci5vZmZCeU93bmVyKFwibW91c2VVcFwiLCBAb2JqZWN0KVxuICAgICAgICBncy5HbG9iYWxFdmVudE1hbmFnZXIub2ZmQnlPd25lcihcImtleVVwXCIsIEBvYmplY3QpXG4gICAgICAgIFxuICAgICAgICBncy5HbG9iYWxFdmVudE1hbmFnZXIub24gXCJtb3VzZVVwXCIsICgoZSkgPT5cbiAgICAgICAgICAgIHJldHVybiBpZiBAb2JqZWN0LmZpbmRDb21wb25lbnRCeU5hbWUoXCJhbmltYXRpb25cIikgb3IgKEdhbWVNYW5hZ2VyLnNldHRpbmdzLmF1dG9NZXNzYWdlLmVuYWJsZWQgYW5kICFHYW1lTWFuYWdlci5zZXR0aW5ncy5hdXRvTWVzc2FnZS5zdG9wT25BY3Rpb24pXG4gICAgICAgICAgICAgICAgXG4gICAgICAgICAgICAjaWYgQG9iamVjdC5kc3RSZWN0LmNvbnRhaW5zKElucHV0Lk1vdXNlLnggLSBAb2JqZWN0Lm9yaWdpbi54LCBJbnB1dC5Nb3VzZS55IC0gQG9iamVjdC5vcmlnaW4ueSlcbiAgICAgICAgICAgIGlmIEBpc1dhaXRpbmcgYW5kIG5vdCAoQHdhaXRDb3VudGVyID4gMCBvciBAd2FpdEZvcktleSlcbiAgICAgICAgICAgICAgICBlLmJyZWFrQ2hhaW4gPSB5ZXNcbiAgICAgICAgICAgICAgICBAY29udGludWUoKVxuICAgICAgICAgICAgZWxzZVxuICAgICAgICAgICAgICAgIGUuYnJlYWtDaGFpbiA9IEBpc1J1bm5pbmdcbiAgICAgICAgICAgICAgICBAZHJhd0ltbWVkaWF0ZWx5ID0gIUB3YWl0Rm9yS2V5XG4gICAgICAgICAgICAgICAgQHdhaXRDb3VudGVyID0gMFxuICAgICAgICAgICAgICAgIEB3YWl0Rm9yS2V5ID0gbm9cbiAgICAgICAgICAgICAgICBAaXNXYWl0aW5nID0gbm9cbiAgICAgICAgICAgICAgICBcbiAgICAgICAgICAgIGlmIEB3YWl0Rm9yS2V5XG4gICAgICAgICAgICAgICAgaWYgSW5wdXQuTW91c2UuYnV0dG9uc1tJbnB1dC5Nb3VzZS5MRUZUXSA9PSAyXG4gICAgICAgICAgICAgICAgICAgIGUuYnJlYWtDaGFpbiA9IHllc1xuICAgICAgICAgICAgICAgICAgICBJbnB1dC5jbGVhcigpXG4gICAgICAgICAgICAgICAgICAgIEB3YWl0Rm9yS2V5ID0gbm9cbiAgICAgICAgICAgICAgICAgICAgQGlzV2FpdGluZyA9IG5vXG4gICAgICAgICAgICAgICAgICAgICAgICBcbiAgICAgICAgICAgICAgICBcbiAgICAgICAgICAgICAgICAgICAgICAgIFxuICAgICAgICAgICAgICAgIFxuICAgICAgICApLCBudWxsLCBAb2JqZWN0XG4gICAgICAgIFxuICAgICAgICBncy5HbG9iYWxFdmVudE1hbmFnZXIub24gXCJrZXlVcFwiLCAoKGUpID0+XG4gICAgICAgICAgICBpZiBJbnB1dC5rZXlzW0lucHV0LkNdIGFuZCAoIUBpc1dhaXRpbmcgb3IgKEB3YWl0Q291bnRlciA+IDAgb3IgQHdhaXRGb3JLZXkpKVxuICAgICAgICAgICAgICAgIEBkcmF3SW1tZWRpYXRlbHkgPSAhQHdhaXRGb3JLZXlcbiAgICAgICAgICAgICAgICBAd2FpdENvdW50ZXIgPSAwXG4gICAgICAgICAgICAgICAgQHdhaXRGb3JLZXkgPSBub1xuICAgICAgICAgICAgICAgIEBpc1dhaXRpbmcgPSBub1xuICAgICAgICAgICAgICAgIFxuICAgICAgICAgICAgaWYgQGlzV2FpdGluZyBhbmQgIUB3YWl0Rm9yS2V5IGFuZCAhQHdhaXRDb3VudGVyIGFuZCBJbnB1dC5rZXlzW0lucHV0LkNdXG4gICAgICAgICAgICAgICAgQGNvbnRpbnVlKClcbiAgICAgICAgICAgICAgICBcbiAgICAgICAgICAgIGlmIEB3YWl0Rm9yS2V5XG4gICAgICAgICAgICAgICAgaWYgSW5wdXQua2V5c1tJbnB1dC5DXVxuICAgICAgICAgICAgICAgICAgICBJbnB1dC5jbGVhcigpXG4gICAgICAgICAgICAgICAgICAgIEB3YWl0Rm9yS2V5ID0gbm9cbiAgICAgICAgICAgICAgICAgICAgQGlzV2FpdGluZyA9IG5vXG4gICAgICAgICAgICAgICAgXG4gICAgICAgICksIG51bGwsIEBvYmplY3RcbiAgICAgICAgXG4gICAgIyMjKlxuICAgICogU2V0cyB1cCB0aGUgcmVuZGVyZXIuIFJlZ2lzdGVycyBuZWNlc3NhcnkgZXZlbnQgaGFuZGxlcnMuXG4gICAgKiBAbWV0aG9kIHNldHVwXG4gICAgIyMjIFxuICAgIHNldHVwOiAtPlxuICAgICAgICBAc2V0dXBFdmVudEhhbmRsZXJzKClcbiAgICAgICAgXG4gICAgIyMjKlxuICAgICogUmVzdG9yZXMgdGhlIG1lc3NhZ2UgdGV4dC1yZW5kZXJlcidzIHN0YXRlIGZyb20gYSBkYXRhLWJ1bmRsZS5cbiAgICAqIEBtZXRob2QgcmVzdG9yZVxuICAgICogQHBhcmFtIHtPYmplY3R9IGJ1bmRsZSAtIEEgZGF0YS1idW5kbGUgY29udGFpbmluZyBtZXNzYWdlIHRleHQtcmVuZGVyZXIgc3RhdGUuXG4gICAgIyMjXG4gICAgcmVzdG9yZTogKGJ1bmRsZSkgLT5cbiAgICAgICAgZm9yIGsgb2YgYnVuZGxlXG4gICAgICAgICAgICBpZiBrID09IFwiY3VycmVudFNwcml0ZUluZGV4XCJcbiAgICAgICAgICAgICAgICBAY3VycmVudFNwcml0ZSA9IEBzcHJpdGVzW2J1bmRsZS5jdXJyZW50U3ByaXRlSW5kZXhdXG4gICAgICAgICAgICBlbHNlXG4gICAgICAgICAgICAgICAgdGhpc1trXSA9IGJ1bmRsZVtrXVxuICAgICAgICBcbiAgICAgICAgaWYgQHNwcml0ZXMubGVuZ3RoID4gMFxuICAgICAgICAgICAgQGN1cnJlbnRZID0gQHNwcml0ZXMubGFzdCgpLnkgLSBAb2JqZWN0Lm9yaWdpbi55IC0gQG9iamVjdC5kc3RSZWN0LnlcbiAgICAgICAgICAgIEBsaW5lID0gQG1heExpbmVzXG4gICAgICAgICAgICBAaXNXYWl0aW5nID0gQGlzV2FpdGluZyB8fCBAaXNSdW5uaW5nXG4gICAgICAgICAgICBcbiAgICAgICAgcmV0dXJuIG51bGwgICAgXG4gICAgXG4gICAgXG4gICAgIyMjKlxuICAgICogQ29udGludWVzIG1lc3NhZ2UtcHJvY2Vzc2luZyBpZiBjdXJyZW50bHkgd2FpdGluZy5cbiAgICAqIEBtZXRob2QgY29udGludWVcbiAgICAjIyNcbiAgICBjb250aW51ZTogLT4gXG4gICAgICAgIEBpc1dhaXRpbmcgPSBub1xuICAgXG4gICAgICAgIGlmIEBsaW5lID49IEBsaW5lcy5sZW5ndGhcbiAgICAgICAgICAgIEBpc1J1bm5pbmcgPSBub1xuICAgICAgICAgICAgQG9iamVjdC5ldmVudHM/LmVtaXQoXCJtZXNzYWdlRmluaXNoXCIsIHRoaXMpXG4gICAgICAgIGVsc2VcbiAgICAgICAgICAgIEBvYmplY3QuZXZlbnRzPy5lbWl0KFwibWVzc2FnZUJhdGNoXCIsIHRoaXMpXG4gICAgICAgICAgICBmYWRpbmcgPSBHYW1lTWFuYWdlci50ZW1wU2V0dGluZ3MubWVzc2FnZUZhZGluZ1xuICAgICAgICAgICAgZHVyYXRpb24gPSBpZiBHYW1lTWFuYWdlci50ZW1wU2V0dGluZ3Muc2tpcCB0aGVuIDAgZWxzZSBmYWRpbmcuZHVyYXRpb25cbiAgICAgICAgICAgIEBvYmplY3QuYW5pbWF0b3IuZGlzYXBwZWFyKGZhZGluZy5hbmltYXRpb24sIGZhZGluZy5lYXNpbmcsIGR1cmF0aW9uLCBncy5DYWxsQmFjayhcIm9uQmF0Y2hEaXNhcHBlYXJcIiwgdGhpcykpXG4gICAgICAgICAgICBcbiAgICAjIyMqXG4gICAgKiBVcGRhdGVzIHRoZSB0ZXh0LXJlbmRlcmVyLlxuICAgICogQG1ldGhvZCB1cGRhdGVcbiAgICAjIyNcbiAgICB1cGRhdGU6IC0+XG4gICAgICAgIGZvciBzcHJpdGUgaW4gQGFsbFNwcml0ZXNcbiAgICAgICAgICAgIHNwcml0ZS5vcGFjaXR5ID0gQG9iamVjdC5vcGFjaXR5XG4gICAgICAgICAgICBzcHJpdGUudmlzaWJsZSA9IEBvYmplY3QudmlzaWJsZVxuICAgICAgICAgICAgc3ByaXRlLm94ID0gLUBvYmplY3Qub2Zmc2V0LnhcbiAgICAgICAgICAgIHNwcml0ZS5veSA9IC1Ab2JqZWN0Lm9mZnNldC55XG4gICAgICAgICAgICBzcHJpdGUubWFzay52YWx1ZSA9IEBvYmplY3QubWFzay52YWx1ZVxuICAgICAgICAgICAgc3ByaXRlLm1hc2sudmFndWUgPSBAb2JqZWN0Lm1hc2sudmFndWVcbiAgICAgICAgICAgIHNwcml0ZS5tYXNrLnNvdXJjZSA9IEBvYmplY3QubWFzay5zb3VyY2VcbiAgICAgICAgICAgIHNwcml0ZS5tYXNrLnR5cGUgPSBAb2JqZWN0Lm1hc2sudHlwZVxuICAgIFxuICAgICAgICBmb3Igb2JqZWN0IGluIEBjdXN0b21PYmplY3RzXG4gICAgICAgICAgICBvYmplY3Qub3BhY2l0eSA9IEBvYmplY3Qub3BhY2l0eVxuICAgICAgICAgICAgb2JqZWN0LnZpc2libGUgPSBAb2JqZWN0LnZpc2libGVcbiAgICAgICAgICAgIFxuICAgICAgICBpZiBub3QgQGlzUnVubmluZyBhbmQgQHdhaXRDb3VudGVyID4gMFxuICAgICAgICAgICAgQHdhaXRDb3VudGVyLS1cbiAgICAgICAgICAgIGlmIEB3YWl0Q291bnRlciA9PSAwXG4gICAgICAgICAgICAgICAgQGNvbnRpbnVlKClcbiAgICAgICAgICAgIHJldHVyblxuICAgICAgICAgICAgICAgIFxuICAgICAgICBpZiBAb2JqZWN0LnZpc2libGUgYW5kIEBsaW5lcz8ubGVuZ3RoID4gMFxuICAgICAgICAgICAgQHVwZGF0ZUxpbmVXcml0aW5nKClcbiAgICAgICAgICAgIEB1cGRhdGVXYWl0Rm9yS2V5KClcbiAgICAgICAgICAgIEB1cGRhdGVXYWl0Q291bnRlcigpXG4gICAgICAgICAgICBAdXBkYXRlQ2FyZXRQb3NpdGlvbigpXG4gICAgICAgIFxuICAgICBcbiAgICAjIyMqXG4gICAgKiBJbmRpY2F0ZXMgaWYgaXRzIGEgYmF0Y2hlZCBtZXNzYWdlcy5cbiAgICAqXG4gICAgKiBAbWV0aG9kIGlzQmF0Y2hlZFxuICAgICogQHJldHVybiBJZiA8Yj50cnVlPC9iPiBpdCBpcyBhIGJhdGNoZWQgbWVzc2FnZS4gT3RoZXJ3aXNlIDxiPmZhbHNlPC9iPi5cbiAgICAjIyNcbiAgICBpc0JhdGNoZWQ6IC0+IEBsaW5lcy5sZW5ndGggPiBAbWF4TGluZXNcbiAgICBcbiAgICAjIyMqXG4gICAgKiBJbmRpY2F0ZXMgaWYgdGhlIGJhdGNoIGlzIHN0aWxsIGluIHByb2dyZXNzIGFuZCBub3QgZG9uZS5cbiAgICAqXG4gICAgKiBAbWV0aG9kIGlzQmF0Y2hJblByb2dyZXNzXG4gICAgKiBAcmV0dXJuIElmIDxiPnRydWU8L2I+IHRoZSBiYXRjaGVkIG1lc3NhZ2UgaXMgc3RpbGwgbm90IGRvbmUuIE90aGVyd2lzZSA8Yj5mYWxzZTwvYj5cbiAgICAjIyNcbiAgICBpc0JhdGNoSW5Qcm9ncmVzczogLT4gQGxpbmVzLmxlbmd0aCAtIEBsaW5lID4gQG1heExpbmVzXG4gICAgXG4gICAgIyMjKlxuICAgICogU3RhcnRzIGRpc3BsYXlpbmcgdGhlIG5leHQgcGFnZSBvZiB0ZXh0IGlmIGEgbWVzc2FnZSBpcyB0b28gbG9uZyB0byBmaXRcbiAgICAqIGludG8gb25lIG1lc3NhZ2UgYm94LlxuICAgICpcbiAgICAqIEBtZXRob2QgZXhlY3V0ZUJhdGNoXG4gICAgIyMjIFxuICAgIGV4ZWN1dGVCYXRjaDogLT5cbiAgICAgICAgQGNsZWFyQWxsU3ByaXRlcygpXG4gICAgICAgIEBsaW5lcyA9IEBsaW5lcy5zbGljZShAbGluZSlcbiAgICAgICAgQGxpbmUgPSAwXG4gICAgICAgIEBjdXJyZW50WCA9IDBcbiAgICAgICAgQGN1cnJlbnRZID0gMCAgXG4gICAgICAgIEBjdXJyZW50TGluZUhlaWdodCA9IDBcbiAgICAgICAgQHRva2VuSW5kZXggPSAwXG4gICAgICAgIEBjaGFySW5kZXggPSAwXG4gICAgICAgIEB0b2tlbiA9IEBsaW5lc1tAbGluZV0uY29udGVudFtAdG9rZW5JbmRleF0gfHwgbmV3IGdzLlJlbmRlcmVyVG9rZW4obnVsbCwgXCJcIik7XG4gICAgICAgIEBtYXhMaW5lcyA9IEBjYWxjdWxhdGVNYXhMaW5lcyhAbGluZXMpXG4gICAgICAgIEBsaW5lQW5pbWF0aW9uQ291bnQgPSBAc3BlZWRcbiAgICAgICAgQHNwcml0ZXMgPSBAY3JlYXRlU3ByaXRlcyhAbGluZXMpXG4gICAgICAgIEBhbGxTcHJpdGVzID0gQGFsbFNwcml0ZXMuY29uY2F0KEBzcHJpdGVzKVxuICAgICAgICBAY3VycmVudFNwcml0ZSA9IEBzcHJpdGVzW0BsaW5lXVxuICAgICAgICBAY3VycmVudFNwcml0ZS54ID0gQGN1cnJlbnRYICsgQG9iamVjdC5vcmlnaW4ueCArIEBvYmplY3QuZHN0UmVjdC54XG4gICAgICAgIEBkcmF3TmV4dCgpXG4gICAgXG4gICAgIyMjKlxuICAgICogQ2FsY3VsYXRlcyB0aGUgZHVyYXRpb24oaW4gZnJhbWVzKSB0aGUgbWVzc2FnZS1yZW5kZXJlciBuZWVkcyB0byBkaXNwbGF5XG4gICAgKiB0aGUgbWVzc2FnZS5cbiAgICAqXG4gICAgKiBAbWV0aG9kIGNhbGN1bGF0ZUR1cmF0aW9uXG4gICAgKiBAcmV0dXJuIHtudW1iZXJ9IFRoZSBkdXJhdGlvbiBpbiBmcmFtZXMuXG4gICAgIyMjICAgIFxuICAgIGNhbGN1bGF0ZUR1cmF0aW9uOiAtPlxuICAgICAgICBkdXJhdGlvbiA9IDBcbiAgICAgICAgXG4gICAgICAgIGlmIEBsaW5lcz9cbiAgICAgICAgICAgIGZvciBsaW5lIGluIEBsaW5lc1xuICAgICAgICAgICAgICAgIGZvciB0b2tlbiBpbiBsaW5lLmNvbnRlbnRcbiAgICAgICAgICAgICAgICAgICAgaWYgdG9rZW4/XG4gICAgICAgICAgICAgICAgICAgICAgICBkdXJhdGlvbiArPSBAY2FsY3VsYXRlRHVyYXRpb25Gb3JUb2tlbih0b2tlbilcbiAgICAgICAgcmV0dXJuIGR1cmF0aW9uXG4gICAgXG4gICAgIyMjKlxuICAgICogQ2FsY3VsYXRlcyB0aGUgZHVyYXRpb24oaW4gZnJhbWVzKSB0aGUgbWVzc2FnZS1yZW5kZXJlciBuZWVkcyB0byBkaXNwbGF5XG4gICAgKiB0aGUgc3BlY2lmaWVkIGxpbmUuXG4gICAgKlxuICAgICogQG1ldGhvZCBjYWxjdWxhdGVEdXJhdGlvbkZvckxpbmVcbiAgICAqIEBwYXJhbSB7Z3MuUmVuZGVyZXJUZXh0TGluZX0gbGluZSBUaGUgbGluZSB0byBjYWxjdWxhdGUgdGhlIGR1cmF0aW9uIGZvci5cbiAgICAqIEByZXR1cm4ge251bWJlcn0gVGhlIGR1cmF0aW9uIGluIGZyYW1lcy5cbiAgICAjIyMgICAgICBcbiAgICBjYWxjdWxhdGVEdXJhdGlvbkZvckxpbmU6IChsaW5lKSAtPlxuICAgICAgICBkdXJhdGlvbiA9IDBcbiAgICAgICAgXG4gICAgICAgIGlmIGxpbmVcbiAgICAgICAgICAgIGZvciB0b2tlbiBpbiBsaW5lLmNvbnRlbnRcbiAgICAgICAgICAgICAgICBpZiB0b2tlbj9cbiAgICAgICAgICAgICAgICAgICAgZHVyYXRpb24gKz0gQGNhbGN1bGF0ZUR1cmF0aW9uRm9yVG9rZW4odG9rZW4pXG4gICAgICAgICAgICAgICAgICAgICAgICBcbiAgICAgICAgcmV0dXJuIGR1cmF0aW9uXG4gICAgIFxuICAgICMjIypcbiAgICAqIENhbGN1bGF0ZXMgdGhlIGR1cmF0aW9uKGluIGZyYW1lcykgdGhlIG1lc3NhZ2UtcmVuZGVyZXIgbmVlZHMgdG8gcHJvY2Vzc1xuICAgICogdGhlIHNwZWNpZmllZCB0b2tlbi5cbiAgICAqXG4gICAgKiBAbWV0aG9kIGNhbGN1bGF0ZUR1cmF0aW9uRm9yVG9rZW5cbiAgICAqIEBwYXJhbSB7c3RyaW5nfE9iamVjdH0gdG9rZW4gLSBUaGUgdG9rZW4uXG4gICAgKiBAcmV0dXJuIHtudW1iZXJ9IFRoZSBkdXJhdGlvbiBpbiBmcmFtZXMuXG4gICAgIyMjICAgICAgICAgICAgICAgICAgICBcbiAgICBjYWxjdWxhdGVEdXJhdGlvbkZvclRva2VuOiAodG9rZW4pIC0+XG4gICAgICAgIGR1cmF0aW9uID0gMFxuICAgICAgICBcbiAgICAgICAgaWYgdG9rZW4uY29kZT9cbiAgICAgICAgICAgIHN3aXRjaCB0b2tlbi5jb2RlXG4gICAgICAgICAgICAgICAgd2hlbiBcIldcIlxuICAgICAgICAgICAgICAgICAgICBpZiB0b2tlbi52YWx1ZSAhPSBcIkFcIlxuICAgICAgICAgICAgICAgICAgICAgICAgZHVyYXRpb24gPSB0b2tlbi52YWx1ZSAvIDEwMDAgKiBHcmFwaGljcy5mcmFtZVJhdGVcbiAgICAgICAgZWxzZVxuICAgICAgICAgICAgZHVyYXRpb24gPSB0b2tlbi52YWx1ZS5sZW5ndGggKiBAc3BlZWRcbiAgICAgICAgICAgICAgICAgICAgXG4gICAgICAgIHJldHVybiBkdXJhdGlvblxuICAgICAgICAgICAgICAgICAgICAgICAgXG4gICAgIyMjKlxuICAgICogQ2FsY3VsYXRlcyB0aGUgbWF4aW11bSBvZiBsaW5lcyB3aGljaCBjYW4gYmUgZGlzcGxheWVkIGluIG9uZSBtZXNzYWdlLlxuICAgICpcbiAgICAqIEBtZXRob2QgY2FsY3VsYXRlTWF4TGluZXNcbiAgICAqIEBwYXJhbSB7QXJyYXl9IGxpbmVzIC0gQW4gYXJyYXkgb2YgbGluZS1vYmplY3RzLlxuICAgICogQHJldHVybiB7bnVtYmVyfSBUaGUgbnVtYmVyIG9mIGRpc3BsYXlhYmxlIGxpbmVzLlxuICAgICMjI1xuICAgIGNhbGN1bGF0ZU1heExpbmVzOiAobGluZXMpIC0+XG4gICAgICAgIGhlaWdodCA9IDBcbiAgICAgICAgcmVzdWx0ID0gMFxuICAgICAgICBcbiAgICAgICAgZm9yIGxpbmUgaW4gbGluZXNcbiAgICAgICAgICAgICAgICBoZWlnaHQgKz0gbGluZS5oZWlnaHQgKyBAbGluZVNwYWNpbmdcbiAgICAgICAgICAgICAgICBpZiBAY3VycmVudFkraGVpZ2h0ID4gKEBvYmplY3QuZHN0UmVjdC5oZWlnaHQpXG4gICAgICAgICAgICAgICAgICAgIGJyZWFrXG4gICAgICAgICAgICAgICAgcmVzdWx0KytcbiAgICAgXG4gICAgICAgIHJldHVybiBNYXRoLm1pbihsaW5lcy5sZW5ndGgsIHJlc3VsdCB8fCAxKVxuICAgIFxuICAgICMjIypcbiAgICAqIERpc3BsYXlzIHRoZSBjaGFyYWN0ZXIgb3IgcHJvY2Vzc2VzIHRoZSBuZXh0IGNvbnRyb2wtdG9rZW4uXG4gICAgKlxuICAgICogQG1ldGhvZCBkcmF3TmV4dFxuICAgICMjI1xuICAgIGRyYXdOZXh0OiAtPlxuICAgICAgICB0b2tlbiA9IEBwcm9jZXNzVG9rZW4oKVxuICAgICAgICAgICAgXG4gICAgICAgIGlmIHRva2VuPy52YWx1ZS5sZW5ndGggPiAwXG4gICAgICAgICAgICBAY2hhciA9IEB0b2tlbi52YWx1ZS5jaGFyQXQoQGNoYXJJbmRleClcbiAgICAgICAgICAgIFxuICAgICAgICAgICAgc2l6ZSA9IEBmb250Lm1lYXN1cmVUZXh0UGxhaW4oQGNoYXIpICBcbiAgICAgICAgICAgIGxpbmVTcGFjaW5nID0gQGxpbmVTcGFjaW5nXG4gICAgICAgICAgICBcbiAgICAgICAgICAgIGlmIEBjdXJyZW50TGluZSAhPSBAbGluZVxuICAgICAgICAgICAgICAgIEBjdXJyZW50TGluZSA9IEBsaW5lXG4gICAgICAgICAgICAgICAjIEBjdXJyZW50WSArPSBAY3VycmVudExpbmVIZWlnaHQgKyBsaW5lU3BhY2luZyAqIEdyYXBoaWNzLnNjYWxlXG4gICAgICAgICAgICAgICAgQGN1cnJlbnRMaW5lSGVpZ2h0ID0gMFxuXG4gICAgICAgICAgICBAY3VycmVudFNwcml0ZS55ID0gQG9iamVjdC5vcmlnaW4ueSArIEBvYmplY3QuZHN0UmVjdC55ICsgQGN1cnJlbnRZXG4gICAgICAgICAgICBAY3VycmVudFNwcml0ZS52aXNpYmxlID0geWVzXG4gICAgICAgICAgICBAZHJhd0xpbmVDb250ZW50KEBsaW5lc1tAbGluZV0sIEBjdXJyZW50U3ByaXRlLmJpdG1hcCwgQGNoYXJJbmRleCsxKVxuICAgICAgICAgICAgQGN1cnJlbnRTcHJpdGUuc3JjUmVjdC53aWR0aCA9IEBjdXJyZW50U3ByaXRlLmJpdG1hcC53aWR0aCAjTWF0aC5taW4oQGN1cnJlbnRTcHJpdGUuc3JjUmVjdC53aWR0aCArIHNpemUud2lkdGgsIEBjdXJyZW50U3ByaXRlLmJpdG1hcC53aWR0aClcbiAgICAgICAgXG4gICAgICAgICAgICBAY3VycmVudExpbmVIZWlnaHQgPSBAbGluZXNbQGxpbmVdLmhlaWdodFxuICAgICAgICAgICAgQGN1cnJlbnRYID0gTWF0aC5taW4oQGxpbmVzW0BsaW5lXS53aWR0aCwgQGN1cnJlbnRYICsgc2l6ZS53aWR0aClcbiAgICAgICAgICAgIFxuICAgICMjIypcbiAgICAqIFByb2Nlc3NlcyB0aGUgbmV4dCBjaGFyYWN0ZXIvdG9rZW4gb2YgdGhlIG1lc3NhZ2UuXG4gICAgKiBAbWV0aG9kIG5leHRDaGFyXG4gICAgKiBAcHJpdmF0ZVxuICAgICMjI1xuICAgIG5leHRDaGFyOiAtPlxuICAgICAgICBsb29wXG4gICAgICAgICAgICBAY2hhckluZGV4KytcbiAgICAgICAgICAgIEBsaW5lQW5pbWF0aW9uQ291bnQgPSBAc3BlZWRcbiAgICAgICAgICAgIFxuICAgICAgICAgICAgaWYgQHRva2VuLmNvZGU/IG9yIEBjaGFySW5kZXggPj0gQHRva2VuLnZhbHVlLmxlbmd0aFxuICAgICAgICAgICAgICAgIEB0b2tlbi5vbkVuZD8oKVxuICAgICAgICAgICAgICAgIEB0b2tlbkluZGV4KytcbiAgICAgICAgICAgICAgICBpZiBAdG9rZW5JbmRleCA+PSBAbGluZXNbQGxpbmVdLmNvbnRlbnQubGVuZ3RoXG4gICAgICAgICAgICAgICAgICAgIEB0b2tlbkluZGV4ID0gMFxuICAgICAgICAgICAgICAgICAgICBAbGluZSsrXG4gICAgICAgICAgICAgICAgICAgIEBjdXJyZW50U3ByaXRlLnNyY1JlY3Qud2lkdGggPSBAY3VycmVudFNwcml0ZS5iaXRtYXAud2lkdGhcbiAgICAgICAgICAgICAgICAgICAgQGN1cnJlbnRTcHJpdGUgPSBAc3ByaXRlc1tAbGluZV1cbiAgICAgICAgICAgICAgICAgICAgaWYgQGN1cnJlbnRTcHJpdGU/XG4gICAgICAgICAgICAgICAgICAgICAgICBAY3VycmVudFNwcml0ZS54ID0gQG9iamVjdC5vcmlnaW4ueCArIEBvYmplY3QuZHN0UmVjdC54XG4gICAgICAgICAgICAgICAgICAgIGlmIEBsaW5lIDwgQG1heExpbmVzXG4gICAgICAgICAgICAgICAgICAgICAgICBAY3VycmVudFkgKz0gKEBjdXJyZW50TGluZUhlaWdodCB8fCBAZm9udC5saW5lSGVpZ2h0KSArIEBsaW5lU3BhY2luZyAqIEdyYXBoaWNzLnNjYWxlXG4gICAgICAgICAgICAgICAgICAgICAgICBAY2hhckluZGV4ID0gMFxuICAgICAgICAgICAgICAgICAgICAgICAgQGN1cnJlbnRYID0gMFxuICAgICAgICAgICAgICAgICAgICAgICAgQHRva2VuID0gQGxpbmVzW0BsaW5lXS5jb250ZW50W0B0b2tlbkluZGV4XSB8fCBuZXcgZ3MuUmVuZGVyZXJUb2tlbihudWxsLCBcIlwiKVxuICAgICAgICAgICAgICAgIGVsc2VcbiAgICAgICAgICAgICAgICAgICAgQGNoYXJJbmRleCA9IDBcbiAgICAgICAgICAgICAgICAgICAgQHRva2VuID0gQGxpbmVzW0BsaW5lXS5jb250ZW50W0B0b2tlbkluZGV4XSB8fCBuZXcgZ3MuUmVuZGVyZXJUb2tlbihudWxsLCBcIlwiKVxuICAgICAgICAgICAgICAgIEB0b2tlbi5vblN0YXJ0PygpXG5cbiAgICAgICAgICAgIFxuICAgICAgICAgICAgaWYgIUB0b2tlbiBvciBAdG9rZW4udmFsdWUgIT0gXCJcXG5cIiBvciAhQGxpbmVzW0BsaW5lXVxuICAgICAgICAgICAgICAgIGJyZWFrXG4gICAgIyMjKlxuICAgICogRmluaXNoZXMgdGhlIG1lc3NhZ2UuIERlcGVuZGluZyBvbiB0aGUgbWVzc2FnZSBjb25maWd1cmF0aW9uLCB0aGVcbiAgICAqIG1lc3NhZ2UgdGV4dC1yZW5kZXJlciB3aWxsIG5vdyB3YWl0IGZvciBhIHVzZXItYWN0aW9uIG9yIGEgY2VydGFpbiBhbW91bnRcbiAgICAqIG9mIHRpbWUuXG4gICAgKlxuICAgICogQG1ldGhvZCBmaW5pc2hcbiAgICAjIyNcbiAgICBmaW5pc2g6IC0+XG4gICAgICAgIGlmIEB3YWl0QXRFbmRcbiAgICAgICAgICAgIEBpc1dhaXRpbmcgPSB5ZXNcbiAgICAgICAgICAgIEBvYmplY3QuZXZlbnRzPy5lbWl0KFwibWVzc2FnZVdhaXRpbmdcIiwgdGhpcylcbiAgICAgICAgZWxzZSBpZiBAd2FpdEF0RW5kVGltZSA+IDBcbiAgICAgICAgICAgIEB3YWl0Q291bnRlciA9IEB3YWl0QXRFbmRUaW1lXG4gICAgICAgICAgICBAaXNXYWl0aW5nID0gbm9cbiAgICAgICAgICAgIFxuICAgICAgICAgICAgQG9iamVjdC5ldmVudHM/LmVtaXQoXCJtZXNzYWdlV2FpdGluZ1wiLCB0aGlzKVxuICAgICAgICBlbHNlXG4gICAgICAgICAgICBAb2JqZWN0LmV2ZW50cz8uZW1pdChcIm1lc3NhZ2VXYWl0aW5nXCIsIHRoaXMpXG4gICAgICAgICAgICBAY29udGludWUoKVxuICAgIFxuICAgICMjIypcbiAgICAqIFJldHVybnMgdGhlIHBvc2l0aW9uIG9mIHRoZSBjYXJldCBpbiBwaXhlbHMuIFRoZSBjYXJldCBpcyBsaWtlIGFuIGludmlzaWJsZVxuICAgICogY3Vyc29yIHBvaW50aW5nIHRvIHRoZSB4L3kgY29vcmRpbmF0ZXMgb2YgdGhlIGxhc3QgcmVuZGVyZWQgY2hhcmFjdGVyIG9mXG4gICAgKiB0aGUgbWVzc2FnZS4gVGhhdCBwb3NpdGlvbiBjYW4gYmUgdXNlZCB0byBkaXNwbGF5IGEgd2FpdGluZy0gb3IgcHJvY2Vzc2luZy1hbmltYXRpb24gZm9yIGV4YW1wbGUuXG4gICAgKlxuICAgICogQG1ldGhvZCB1cGRhdGVDYXJldFBvc2l0aW9uXG4gICAgIyMjXG4gICAgdXBkYXRlQ2FyZXRQb3NpdGlvbjogLT4gXG4gICAgICAgIEBjYXJldFBvc2l0aW9uLnggPSBAY3VycmVudFggKyBAcGFkZGluZyAgIFxuICAgICAgICBAY2FyZXRQb3NpdGlvbi55ID0gQGN1cnJlbnRZICsgQGN1cnJlbnRMaW5lSGVpZ2h0LzJcbiAgICAgICAgXG4gICAgIyMjKlxuICAgICogVXBkYXRlcyB0aGUgbGluZSB3cml0aW5nLlxuICAgICpcbiAgICAqIEBtZXRob2QgdXBkYXRlTGluZVdyaXRpbmdcbiAgICAqIEBwcml2YXRlXG4gICAgIyMjXG4gICAgdXBkYXRlTGluZVdyaXRpbmc6IC0+XG4gICAgICAgIGlmIEBpc1J1bm5pbmcgYW5kICFAaXNXYWl0aW5nIGFuZCAhQHdhaXRGb3JLZXkgYW5kIEB3YWl0Q291bnRlciA8PSAwXG4gICAgICAgICAgICBpZiBAbGluZUFuaW1hdGlvbkNvdW50IDw9IDBcbiAgICAgICAgICAgICAgICBsb29wXG4gICAgICAgICAgICAgICAgICAgIGlmIEBsaW5lIDwgQG1heExpbmVzXG4gICAgICAgICAgICAgICAgICAgICAgICBAbmV4dENoYXIoKVxuICAgICAgICAgICAgICAgICAgICAgICAgXG4gICAgICAgICAgICAgICAgICAgIGlmIEBsaW5lID49IEBtYXhMaW5lc1xuICAgICAgICAgICAgICAgICAgICAgICAgQGZpbmlzaCgpXG4gICAgICAgICAgICAgICAgICAgIGVsc2VcbiAgICAgICAgICAgICAgICAgICAgICAgIEBkcmF3TmV4dCgpXG4gICAgICAgICAgICAgICAgICAgICAgICBcbiAgICAgICAgICAgICAgICAgICAgYnJlYWsgdW5sZXNzIChAdG9rZW4uY29kZSBvciBAbGluZUFuaW1hdGlvbkNvdW50IDw9IDAgb3IgQGRyYXdJbW1lZGlhdGVseSkgYW5kICFAd2FpdEZvcktleSBhbmQgQHdhaXRDb3VudGVyIDw9IDAgYW5kIEBpc1J1bm5pbmcgYW5kIEBsaW5lIDwgQG1heExpbmVzXG4gICAgICAgICAgICBcbiAgICAgICAgICAgIGlmIEdhbWVNYW5hZ2VyLnRlbXBTZXR0aW5ncy5za2lwXG4gICAgICAgICAgICAgICAgQGxpbmVBbmltYXRpb25Db3VudCA9IDBcbiAgICAgICAgICAgIGVsc2VcbiAgICAgICAgICAgICAgICBAbGluZUFuaW1hdGlvbkNvdW50LS1cbiAgICBcbiAgICAjIyMqXG4gICAgKiBVcGRhdGVzIHdhaXQtZm9yLWtleSBzdGF0ZS4gSWYgc2tpcHBpbmcgaXMgZW5hYmxlZCwgdGhlIHRleHQgcmVuZGVyZXIgd2lsbFxuICAgICogbm90IHdhaXQgZm9yIGtleSBwcmVzcy5cbiAgICAqXG4gICAgKiBAbWV0aG9kIHVwZGF0ZVdhaXRGb3JLZXlcbiAgICAqIEBwcml2YXRlXG4gICAgIyMjXG4gICAgdXBkYXRlV2FpdEZvcktleTogLT5cbiAgICAgICAgaWYgQHdhaXRGb3JLZXlcbiAgICAgICAgICAgIEBpc1dhaXRpbmcgPSAhR2FtZU1hbmFnZXIudGVtcFNldHRpbmdzLnNraXBcbiAgICAgICAgICAgIEB3YWl0Rm9yS2V5ID0gQGlzV2FpdGluZ1xuICAgICBcbiAgICAjIyMqXG4gICAgKiBVcGRhdGVzIHdhaXQgY291bnRlciBpZiB0aGUgdGV4dCByZW5kZXJlciBpcyB3YWl0aW5nIGZvciBhIGNlcnRhaW4gYW1vdW50IG9mIHRpbWUgdG8gcGFzcy4gSWYgc2tpcHBpbmcgaXMgZW5hYmxlZCwgdGhlIHRleHQgcmVuZGVyZXIgd2lsbFxuICAgICogbm90IHdhaXQgZm9yIHRoZSBhY3R1YWwgYW1vdW50IG9mIHRpbWUgYW5kIHNldHMgdGhlIHdhaXQtY291bnRlciB0byAxIGZyYW1lIGluc3RlYWQuXG4gICAgKlxuICAgICogQG1ldGhvZCB1cGRhdGVXYWl0Rm9yS2V5XG4gICAgKiBAcHJpdmF0ZVxuICAgICMjIyAgICAgICBcbiAgICB1cGRhdGVXYWl0Q291bnRlcjogLT5cbiAgICAgICAgaWYgQHdhaXRDb3VudGVyID4gMFxuICAgICAgICAgICAgaWYgR2FtZU1hbmFnZXIudGVtcFNldHRpbmdzLnNraXBcbiAgICAgICAgICAgICAgICBAd2FpdENvdW50ZXIgPSAxXG4gICAgICAgICAgICBAaXNXYWl0aW5nID0geWVzXG4gICAgICAgICAgICBAd2FpdENvdW50ZXItLVxuICAgICAgICAgICAgaWYgQHdhaXRDb3VudGVyIDw9IDBcbiAgICAgICAgICAgICAgICBAaXNXYWl0aW5nID0gbm9cbiAgICAgICAgICAgICAgICBAY29udGludWUoKSBpZiBAbGluZSA+PSBAbWF4TGluZXNcbiAgICAgICAgICAgICAgICBcbiAgICAjIyMqXG4gICAgKiBDcmVhdGVzIGEgdG9rZW4tb2JqZWN0IGZvciBhIHNwZWNpZmllZCB0ZXh0LWNvZGUuXG4gICAgKiBcbiAgICAqIEBtZXRob2QgY3JlYXRlVG9rZW5cbiAgICAqIEBwYXJhbSB7c3RyaW5nfSBjb2RlIC0gVGhlIGNvZGUvdHlwZSBvZiB0aGUgdGV4dC1jb2RlLlxuICAgICogQHBhcmFtIHtzdHJpbmd9IHZhbHVlIC0gVGhlIHZhbHVlIG9mIHRoZSB0ZXh0LWNvZGUuXG4gICAgKiBAcmV0dXJuIHtPYmplY3R9IFRoZSB0b2tlbi1vYmplY3QuXG4gICAgIyMjXG4gICAgY3JlYXRlVG9rZW46IChjb2RlLCB2YWx1ZSkgLT5cbiAgICAgICAgdG9rZW5PYmplY3QgPSBudWxsXG4gICAgICAgIFxuICAgICAgICBzd2l0Y2ggY29kZVxuICAgICAgICAgICAgd2hlbiBcIkNFXCJcbiAgICAgICAgICAgICAgICBkYXRhID0gdmFsdWUuc3BsaXQoXCIvXCIpXG4gICAgICAgICAgICAgICAgdmFsdWUgPSBkYXRhLnNoaWZ0KClcbiAgICAgICAgICAgICAgICB2YWx1ZSA9IGlmIGlzTmFOKHZhbHVlKSB0aGVuIHZhbHVlIGVsc2UgcGFyc2VJbnQodmFsdWUpXG4gICAgICAgICAgICAgICAgZm9yIGkgaW4gWzAuLi5kYXRhXVxuICAgICAgICAgICAgICAgICAgICBpZiBkYXRhW2ldLnN0YXJ0c1dpdGgoJ1wiJykgYW5kIGRhdGFbaV0uZW5kc1dpdGgoJ1wiJylcbiAgICAgICAgICAgICAgICAgICAgICAgIGRhdGFbaV0gPSBkYXRhW2ldLnN1YnN0cmluZygxLCBkYXRhW2ldLmxlbmd0aC0xKVxuICAgICAgICAgICAgICAgICAgICBlbHNlXG4gICAgICAgICAgICAgICAgICAgICAgICBkYXRhW2ldID0gaWYgaXNOYU4oZGF0YVtpXSkgdGhlbiBkYXRhW2ldIGVsc2UgcGFyc2VGbG9hdChkYXRhW2ldKVxuICAgICAgICAgICAgICAgIHRva2VuT2JqZWN0ID0geyBjb2RlOiBjb2RlLCB2YWx1ZTogdmFsdWUsIHZhbHVlczogZGF0YSAgfVxuICAgICAgICAgICAgZWxzZVxuICAgICAgICAgICAgICAgIHRva2VuT2JqZWN0ID0gc3VwZXIoY29kZSwgdmFsdWUpXG4gICAgICAgXG4gICAgICAgICAgICAgICAgXG4gICAgICAgIHJldHVybiB0b2tlbk9iamVjdCBcbiAgICAjIyMqXG4gICAgKiA8cD5NZWFzdXJlcyBhIGNvbnRyb2wtdG9rZW4uIElmIGEgdG9rZW4gcHJvZHVjZXMgYSB2aXN1YWwgcmVzdWx0IGxpa2UgZGlzcGxheWluZyBhbiBpY29uIHRoZW4gaXQgbXVzdCByZXR1cm4gdGhlIHNpemUgdGFrZW4gYnlcbiAgICAqIHRoZSB2aXN1YWwgcmVzdWx0LiBJZiB0aGUgdG9rZW4gaGFzIG5vIHZpc3VhbCByZXN1bHQsIDxiPm51bGw8L2I+IG11c3QgYmUgcmV0dXJuZWQuIFRoaXMgbWV0aG9kIGlzIGNhbGxlZCBmb3IgZXZlcnkgdG9rZW4gd2hlbiB0aGUgbWVzc2FnZSBpcyBpbml0aWFsaXplZC48L3A+IFxuICAgICpcbiAgICAqIDxwPlRoaXMgbWV0aG9kIGlzIG5vdCBjYWxsZWQgd2hpbGUgdGhlIG1lc3NhZ2UgaXMgcnVubmluZy4gRm9yIHRoYXQgY2FzZSwgc2VlIDxpPnByb2Nlc3NDb250cm9sVG9rZW48L2k+IG1ldGhvZCB3aGljaCBpcyBjYWxsZWRcbiAgICAqIGZvciBldmVyeSB0b2tlbiB3aGlsZSB0aGUgbWVzc2FnZSBpcyBydW5uaW5nLjwvcD5cbiAgICAqXG4gICAgKiBAcGFyYW0ge09iamVjdH0gdG9rZW4gLSBBIGNvbnRyb2wtdG9rZW4uXG4gICAgKiBAcmV0dXJuIHtncy5TaXplfSBUaGUgc2l6ZSBvZiB0aGUgYXJlYSB0YWtlbiBieSB0aGUgdmlzdWFsIHJlc3VsdCBvZiB0aGUgdG9rZW4gb3IgPGI+bnVsbDwvYj4gaWYgdGhlIHRva2VuIGhhcyBubyB2aXN1YWwgcmVzdWx0LlxuICAgICogQG1ldGhvZCBhbmFseXplQ29udHJvbFRva2VuXG4gICAgKiBAcHJvdGVjdGVkXG4gICAgIyMjXG4gICAgbWVhc3VyZUNvbnRyb2xUb2tlbjogKHRva2VuKSAtPiByZXR1cm4gc3VwZXIodG9rZW4pXG4gICAgICAgIFxuICAgICMjIypcbiAgICAqIDxwPkRyYXdzIHRoZSB2aXN1YWwgcmVzdWx0IG9mIGEgdG9rZW4sIGxpa2UgYW4gaWNvbiBmb3IgZXhhbXBsZSwgdG8gdGhlIHNwZWNpZmllZCBiaXRtYXAuIFRoaXMgbWV0aG9kIGlzIGNhbGxlZCBmb3IgZXZlcnkgdG9rZW4gd2hlbiB0aGUgbWVzc2FnZSBpcyBpbml0aWFsaXplZCBhbmQgdGhlIHNwcml0ZXMgZm9yIGVhY2hcbiAgICAqIHRleHQtbGluZSBhcmUgY3JlYXRlZC48L3A+IFxuICAgICpcbiAgICAqIDxwPlRoaXMgbWV0aG9kIGlzIG5vdCBjYWxsZWQgd2hpbGUgdGhlIG1lc3NhZ2UgaXMgcnVubmluZy4gRm9yIHRoYXQgY2FzZSwgc2VlIDxpPnByb2Nlc3NDb250cm9sVG9rZW48L2k+IG1ldGhvZCB3aGljaCBpcyBjYWxsZWRcbiAgICAqIGZvciBldmVyeSB0b2tlbiB3aGlsZSB0aGUgbWVzc2FnZSBpcyBydW5uaW5nLjwvcD5cbiAgICAqXG4gICAgKiBAcGFyYW0ge09iamVjdH0gdG9rZW4gLSBBIGNvbnRyb2wtdG9rZW4uXG4gICAgKiBAcGFyYW0ge2dzLkJpdG1hcH0gYml0bWFwIC0gVGhlIGJpdG1hcCB1c2VkIGZvciB0aGUgY3VycmVudCB0ZXh0LWxpbmUuIENhbiBiZSB1c2VkIHRvIGRyYXcgc29tZXRoaW5nIG9uIGl0IGxpa2UgYW4gaWNvbiwgZXRjLlxuICAgICogQHBhcmFtIHtudW1iZXJ9IG9mZnNldCAtIEFuIHgtb2Zmc2V0IGZvciB0aGUgZHJhdy1yb3V0aW5lLlxuICAgICogQHBhcmFtIHtudW1iZXJ9IGxlbmd0aCAtIERldGVybWluZXMgaG93IG1hbnkgY2hhcmFjdGVycyBvZiB0aGUgdG9rZW4gc2hvdWxkIGJlIGRyYXduLiBDYW4gYmUgaWdub3JlZCBmb3IgdG9rZW5zXG4gICAgKiBub3QgZHJhd2luZyBhbnkgY2hhcmFjdGVycy5cbiAgICAqIEBtZXRob2QgZHJhd0NvbnRyb2xUb2tlblxuICAgICogQHByb3RlY3RlZFxuICAgICMjI1xuICAgIGRyYXdDb250cm9sVG9rZW46ICh0b2tlbiwgYml0bWFwLCBvZmZzZXQsIGxlbmd0aCkgLT5cbiAgICAgICAgc3dpdGNoIHRva2VuLmNvZGVcbiAgICAgICAgICAgIHdoZW4gXCJSVFwiICMgUnVieSBUZXh0XG4gICAgICAgICAgICAgICAgc3VwZXIodG9rZW4sIGJpdG1hcCwgb2Zmc2V0LCBsZW5ndGgpXG4gICAgICAgICAgICB3aGVuIFwiU0xLXCIgIyBTdHlsYWJsZSBMaW5rXG4gICAgICAgICAgICAgICAgaWYgIXRva2VuLmN1c3RvbURhdGEub2Zmc2V0WD9cbiAgICAgICAgICAgICAgICAgICAgdG9rZW4uY3VzdG9tRGF0YS5vZmZzZXRYID0gb2Zmc2V0XG4gICAgICAgICAgICAgICAgaWYgQGN1c3RvbURhdGEubGlua0RhdGFcbiAgICAgICAgICAgICAgICAgICAgbGlua0RhdGEgPSBAY3VzdG9tRGF0YS5saW5rRGF0YVtAbGluZV1cbiAgICAgICAgICAgICAgICAgICAgaWYgbGlua0RhdGEgdGhlbiBmb3IgZGF0YSBpbiBsaW5rRGF0YVxuICAgICAgICAgICAgICAgICAgICAgICAgQHNwcml0ZXNbQGxpbmVdLmJpdG1hcC5jbGVhclJlY3QoZGF0YS5jeCxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgMCxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgZGF0YS53aWR0aCxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgZGF0YS5oZWlnaHQpXG4gICAgICAgICAgICAgICAgXG4gICAgIFxuICAgICMjIypcbiAgICAqIFByb2Nlc3NlcyBhIGNvbnRyb2wtdG9rZW4uIEEgY29udHJvbC10b2tlbiBpcyBhIHRva2VuIHdoaWNoIGluZmx1ZW5jZXNcbiAgICAqIHRoZSB0ZXh0LXJlbmRlcmluZyBsaWtlIGNoYW5naW5nIHRoZSBmb250cyBjb2xvciwgc2l6ZSBvciBzdHlsZS4gQ2hhbmdlcyBcbiAgICAqIHdpbGwgYmUgYXV0b21hdGljYWxseSBhcHBsaWVkIHRvIHRoZSBnYW1lIG9iamVjdCdzIGZvbnQuXG4gICAgKlxuICAgICogRm9yIG1lc3NhZ2UgdGV4dC1yZW5kZXJlciwgYSBmZXcgYWRkaXRpb25hbCBjb250cm9sLXRva2VucyBsaWtlXG4gICAgKiBzcGVlZC1jaGFuZ2UsIHdhaXRpbmcsIGV0Yy4gbmVlZHMgdG8gYmUgcHJvY2Vzc2VkIGhlcmUuXG4gICAgKlxuICAgICogVGhpcyBtZXRob2QgaXMgY2FsbGVkIGZvciBlYWNoIHRva2VuIHdoaWxlIHRoZSBtZXNzYWdlIGlzIGluaXRpYWxpemVkIGFuZFxuICAgICogYWxzbyB3aGlsZSB0aGUgbWVzc2FnZSBpcyBydW5uaW5nLiBTZWUgPGk+Zm9ybWF0dGluZ09ubHk8L2k+IHBhcmFtZXRlci5cbiAgICAqXG4gICAgKiBAcGFyYW0ge09iamVjdH0gdG9rZW4gLSBBIGNvbnRyb2wtdG9rZW4uXG4gICAgKiBAcGFyYW0ge2Jvb2xlYW59IGZvcm1hdHRpbmdPbmx5IC0gSWYgPGI+dHJ1ZTwvYj4gdGhlIG1lc3NhZ2UgaXMgaW5pdGlhbGl6aW5nIHJpZ2h0IG5vdyBhbmQgb25seSBcbiAgICAqIGZvcm1hdC10b2tlbnMgc2hvdWxkIGJlIHByb2Nlc3NlZCB3aGljaCBpcyBuZWNlc3NhcnkgZm9yIHRoZSBtZXNzYWdlIHRvIGNhbGN1bGF0ZWQgc2l6ZXMgY29ycmVjdGx5LlxuICAgICogQHJldHVybiB7T2JqZWN0fSBBIG5ldyB0b2tlbiB3aGljaCBpcyBwcm9jZXNzZWQgbmV4dCBvciA8Yj5udWxsPC9iPi5cbiAgICAqIEBtZXRob2QgcHJvY2Vzc0NvbnRyb2xUb2tlblxuICAgICogQHByb3RlY3RlZFxuICAgICMjI1xuICAgIHByb2Nlc3NDb250cm9sVG9rZW46ICh0b2tlbiwgZm9ybWF0dGluZ09ubHkpIC0+XG4gICAgICAgIHJldHVybiBzdXBlcih0b2tlbikgaWYgZm9ybWF0dGluZ09ubHlcbiAgICAgICAgcmVzdWx0ID0gbnVsbFxuICAgICAgICBcbiAgICAgICAgc3dpdGNoIHRva2VuLmNvZGVcbiAgICAgICAgICAgIHdoZW4gXCJDUlwiICMgQ2hhbmdlIEN1cnJlbnQgQ2hhcmFjdGVyXG4gICAgICAgICAgICAgICAgY2hhcmFjdGVyID0gUmVjb3JkTWFuYWdlci5jaGFyYWN0ZXJzQXJyYXkuZmlyc3QgKGMpIC0+IChjLm5hbWUuZGVmYXVsdFRleHQgPyBjLm5hbWUpID09IHRva2VuLnZhbHVlXG4gICAgICAgICAgICAgICAgaWYgY2hhcmFjdGVyXG4gICAgICAgICAgICAgICAgICAgIFNjZW5lTWFuYWdlci5zY2VuZS5jdXJyZW50Q2hhcmFjdGVyID0gY2hhcmFjdGVyXG4gICAgICAgICAgICB3aGVuIFwiQ0VcIiAjIENhbGwgQ29tbW9uIEV2ZW50XG4gICAgICAgICAgICAgICAgcGFyYW1zID0geyBcInZhbHVlc1wiOiB0b2tlbi52YWx1ZXMgfVxuICAgICAgICAgICAgICAgIEBvYmplY3QuZXZlbnRzPy5lbWl0KFwiY2FsbENvbW1vbkV2ZW50XCIsIEBvYmplY3QsIHsgY29tbW9uRXZlbnRJZDogdG9rZW4udmFsdWUsIHBhcmFtczogcGFyYW1zLCBmaW5pc2g6IG5vLCB3YWl0aW5nOiB5ZXMgfSlcbiAgICAgICAgICAgIHdoZW4gXCJYXCIgIyBTY3JpcHRcbiAgICAgICAgICAgICAgICB0b2tlbi52YWx1ZT8oQG9iamVjdClcbiAgICAgICAgICAgIHdoZW4gXCJBXCIgIyBQbGF5IEFuaW1hdGlvblxuICAgICAgICAgICAgICAgIGFuaW1hdGlvbiA9IFJlY29yZE1hbmFnZXIuYW5pbWF0aW9uc0FycmF5LmZpcnN0IChhKSAtPiBhLm5hbWUgPT0gdG9rZW4udmFsdWVcbiAgICAgICAgICAgICAgICBpZiAhYW5pbWF0aW9uXG4gICAgICAgICAgICAgICAgICAgIGFuaW1hdGlvbiA9IFJlY29yZE1hbmFnZXIuYW5pbWF0aW9uc1t0b2tlbi52YWx1ZV1cbiAgICAgICAgICAgICAgICBpZiBhbmltYXRpb24/LmdyYXBoaWMubmFtZT9cbiAgICAgICAgICAgICAgICAgICAgYml0bWFwID0gUmVzb3VyY2VNYW5hZ2VyLmdldEJpdG1hcChcIkdyYXBoaWNzL1BpY3R1cmVzLyN7YW5pbWF0aW9uLmdyYXBoaWMubmFtZX1cIilcbiAgICAgICAgICAgICAgICAgICAgb2JqZWN0ID0gbmV3IGdzLk9iamVjdF9BbmltYXRpb24oYW5pbWF0aW9uKVxuICAgICAgICAgICAgICAgICAgICBcbiAgICAgICAgICAgICAgICAgICAgQGFkZEN1c3RvbU9iamVjdChvYmplY3QpXG4gICAgICAgICAgICAgICAgICAgIEBjdXJyZW50WCArPSBNYXRoLnJvdW5kKGJpdG1hcC53aWR0aCAvIGFuaW1hdGlvbi5mcmFtZXNYKVxuICAgICAgICAgICAgICAgICAgICBAY3VycmVudFNwcml0ZS5zcmNSZWN0LndpZHRoICs9IE1hdGgucm91bmQoYml0bWFwLndpZHRoIC8gYW5pbWF0aW9uLmZyYW1lc1gpXG4gICAgICAgICAgICBcbiAgICAgICAgICAgIHdoZW4gXCJSVFwiICMgUnVieSBUZXh0XG4gICAgICAgICAgICAgICAgaWYgdG9rZW4ucnRTaXplLndpZHRoID4gdG9rZW4ucmJTaXplLndpZHRoXG4gICAgICAgICAgICAgICAgICAgIEBjdXJyZW50WCArPSB0b2tlbi5ydFNpemUud2lkdGhcbiAgICAgICAgICAgICAgICAgICAgQGZvbnQuc2V0KEBnZXRSdWJ5VGV4dEZvbnQodG9rZW4pKVxuICAgICAgICAgICAgICAgIGVsc2VcbiAgICAgICAgICAgICAgICAgICAgQGN1cnJlbnRYICs9IHRva2VuLnJiU2l6ZS53aWR0aFxuICAgICAgICAgICAgICAgICAgICBcbiAgICAgICAgICAgIHdoZW4gXCJMS1wiICMgTGluayAgICAgIFxuICAgICAgICAgICAgICAgIGlmIHRva2VuLnZhbHVlID09ICdFJyAjIEVuZCBMaW5rXG4gICAgICAgICAgICAgICAgICAgIG9iamVjdCA9IG5ldyB1aS5PYmplY3RfSG90c3BvdCgpXG4gICAgICAgICAgICAgICAgICAgIG9iamVjdC5lbmFibGVkID0geWVzXG4gICAgICAgICAgICAgICAgICAgIG9iamVjdC5zZXR1cCgpXG4gICAgICAgICAgICAgICAgICAgIFxuICAgICAgICAgICAgICAgICAgICBAYWRkQ3VzdG9tT2JqZWN0KG9iamVjdClcbiAgICAgICAgICAgICAgICAgICAgXG4gICAgICAgICAgICAgICAgICAgIG9iamVjdC5kc3RSZWN0LnggPSBAb2JqZWN0LmRzdFJlY3QueCArIEBvYmplY3Qub3JpZ2luLnggKyBAY3VzdG9tRGF0YS5saW5rRGF0YS5jeFxuICAgICAgICAgICAgICAgICAgICBvYmplY3QuZHN0UmVjdC55ID0gQG9iamVjdC5kc3RSZWN0LnkgKyBAb2JqZWN0Lm9yaWdpbi55ICsgQGN1c3RvbURhdGEubGlua0RhdGEuY3lcbiAgICAgICAgICAgICAgICAgICAgb2JqZWN0LmRzdFJlY3Qud2lkdGggPSBAY3VycmVudFggLSBAY3VzdG9tRGF0YS5saW5rRGF0YS5jeFxuICAgICAgICAgICAgICAgICAgICBvYmplY3QuZHN0UmVjdC5oZWlnaHQgPSBAY3VycmVudExpbmVIZWlnaHRcblxuICAgICAgICAgICAgICAgICAgICBvYmplY3QuZXZlbnRzLm9uKFwiY2xpY2tcIiwgZ3MuQ2FsbEJhY2soXCJvbkxpbmtDbGlja1wiLCB0aGlzKSwgbGlua0RhdGE6IEBjdXN0b21EYXRhLmxpbmtEYXRhLCB0aGlzKVxuICAgICAgICAgICAgICAgIGVsc2UgIyBCZWdpbiBMaW5rXG4gICAgICAgICAgICAgICAgICAgIEBjdXN0b21EYXRhLmxpbmtEYXRhID0geyBjeDogQGN1cnJlbnRYLCBjeTogQGN1cnJlbnRZLCBjb21tb25FdmVudElkOiB0b2tlbi52YWx1ZSwgdG9rZW5JbmRleDogQHRva2VuSW5kZXggfVxuICAgICAgICAgICAgd2hlbiBcIlNMS1wiICMgU3R5bGVhYmxlIExpbmtcbiAgICAgICAgICAgICAgICBpZiB0b2tlbi52YWx1ZSA9PSAnRScgIyBFbmQgTGlua1xuICAgICAgICAgICAgICAgICAgICBsaW5rRGF0YSA9IEBjdXN0b21EYXRhLmxpbmtEYXRhW0BsaW5lXS5sYXN0KClcbiAgICAgICAgICAgICAgICAgICAgbGluZSA9IEBsaW5lc1tAbGluZV0uY29udGVudFxuICAgICAgICAgICAgICAgICAgICBsaW5rU3RhcnQgPSBAZmluZFRva2VuKEB0b2tlbkluZGV4LTEsIFwiU0xLXCIsIC0xLCBsaW5lKVxuICAgICAgICAgICAgICAgICAgICB0ZXh0VG9rZW5zID0gQGZpbmRUb2tlbnNCZXR3ZWVuKGxpbmtEYXRhLnRva2VuSW5kZXgsIEB0b2tlbkluZGV4LCBudWxsLCBsaW5lKVxuICAgICAgICAgICAgICAgICAgICBcbiAgICAgICAgICAgICAgICAgICAgbGlua0RhdGEuY3ggPSBsaW5rU3RhcnQuY3VzdG9tRGF0YS5vZmZzZXRYXG4gICAgICAgICAgICAgICAgICAgIGxpbmtEYXRhLndpZHRoID0gQGN1cnJlbnRYIC0gbGlua0RhdGEuY3ggKyBAcGFkZGluZ1xuICAgICAgICAgICAgICAgICAgICBsaW5rRGF0YS5oZWlnaHQgPSBAY3VycmVudFNwcml0ZS5iaXRtYXAuaGVpZ2h0XG4gICAgICAgICAgICAgICAgICAgIFxuICAgICAgICAgICAgICAgICAgICBvYmplY3QgPSBuZXcgdWkuT2JqZWN0X1RleHQoKVxuICAgICAgICAgICAgICAgICAgICBvYmplY3QudGV4dCA9IHRleHRUb2tlbnMuc2VsZWN0KCh4KSA9PiB4LnZhbHVlKS5qb2luKFwiXCIpXG4gICAgICAgICAgICAgICAgICAgICNvYmplY3Quc2l6ZVRvRml0ID0geWVzXG4gICAgICAgICAgICAgICAgICAgIG9iamVjdC5mb3JtYXR0aW5nID0gbm9cbiAgICAgICAgICAgICAgICAgICAgb2JqZWN0LndvcmRXcmFwID0gbm9cbiAgICAgICAgICAgICAgICAgICAgb2JqZWN0LnVpID0gbmV3IHVpLkNvbXBvbmVudF9VSUJlaGF2aW9yKClcbiAgICAgICAgICAgICAgICAgICAgb2JqZWN0LmVuYWJsZWQgPSB5ZXNcbiAgICAgICAgICAgICAgICAgICAgb2JqZWN0LmFkZENvbXBvbmVudChvYmplY3QudWkpXG4gICAgICAgICAgICAgICAgICAgIG9iamVjdC5hZGRDb21wb25lbnQobmV3IGdzLkNvbXBvbmVudF9Ib3RzcG90QmVoYXZpb3IoKSlcbiAgICAgICAgICAgICAgICAgICAgb2JqZWN0LmJlaGF2aW9yLnBhZGRpbmcubGVmdCA9IDBcbiAgICAgICAgICAgICAgICAgICAgb2JqZWN0LmJlaGF2aW9yLnBhZGRpbmcucmlnaHQgPSAwXG4gICAgICAgICAgICAgICAgICAgIG9iamVjdC5kc3RSZWN0LndpZHRoID0gbGlua0RhdGEud2lkdGhcbiAgICAgICAgICAgICAgICAgICAgb2JqZWN0LmRzdFJlY3QuaGVpZ2h0ID0gbGlua0RhdGEuaGVpZ2h0XG4gICAgICAgICAgICAgICAgICAgIFxuICAgICAgICAgICAgICAgICAgICBpZiBsaW5rRGF0YS5zdHlsZUluZGV4ID09IC0xXG4gICAgICAgICAgICAgICAgICAgICAgICB1aS5VSU1hbmFnZXIuYWRkQ29udHJvbFN0eWxlcyhvYmplY3QsIFtcImh5cGVybGlua1wiXSlcbiAgICAgICAgICAgICAgICAgICAgZWxzZSBcbiAgICAgICAgICAgICAgICAgICAgICAgIHVpLlVJTWFuYWdlci5hZGRDb250cm9sU3R5bGVzKG9iamVjdCwgW1wiaHlwZXJsaW5rLVwiK2xpbmtEYXRhLnN0eWxlSW5kZXhdKVxuICAgICAgICAgICAgICAgICAgICBcbiAgICAgICAgICAgICAgICAgICAgb2JqZWN0LnNldHVwKClcbiAgICAgICAgICAgICAgICAgICAgXG4gICAgICAgICAgICAgICAgICAgIEBhZGRDdXN0b21PYmplY3Qob2JqZWN0KVxuICAgICAgICAgICAgICAgICAgICBcbiAgICAgICAgICAgICAgICAgICAgb2JqZWN0LmRzdFJlY3QueCA9IEBjdXJyZW50U3ByaXRlLnggKyBsaW5rRGF0YS5jeFxuICAgICAgICAgICAgICAgICAgICBvYmplY3QuZHN0UmVjdC55ID0gQG9iamVjdC5kc3RSZWN0LnkgKyBAb2JqZWN0Lm9yaWdpbi55ICsgbGlua0RhdGEuY3lcblxuICAgICAgICAgICAgICAgICAgICBvYmplY3QuZXZlbnRzLm9uKFwiY2xpY2tcIiwgZ3MuQ2FsbEJhY2soXCJvbkxpbmtDbGlja1wiLCB0aGlzKSwgbGlua0RhdGE6IGxpbmtEYXRhLCB0aGlzKVxuICAgICAgICAgICAgICAgIGVsc2UgIyBCZWdpbiBMaW5rXG4gICAgICAgICAgICAgICAgICAgIGlmICFAY3VzdG9tRGF0YS5saW5rRGF0YVxuICAgICAgICAgICAgICAgICAgICAgICAgQGN1c3RvbURhdGEubGlua0RhdGEgPSBbXVxuICAgICAgICAgICAgICAgICAgICBpZiAhQGN1c3RvbURhdGEubGlua0RhdGFbQGxpbmVdXG4gICAgICAgICAgICAgICAgICAgICAgICBAY3VzdG9tRGF0YS5saW5rRGF0YVtAbGluZV0gPSBbXVxuICAgICAgICAgICAgICAgICAgICBpZiB0b2tlbi52YWx1ZT8uY29udGFpbnMoXCIsXCIpXG4gICAgICAgICAgICAgICAgICAgICAgICB2YWx1ZXMgPSB0b2tlbi52YWx1ZS5zcGxpdChcIixcIilcbiAgICAgICAgICAgICAgICAgICAgICAgIEBjdXN0b21EYXRhLmxpbmtEYXRhW0BsaW5lXS5wdXNoKHsgY3g6IEBjdXJyZW50WCwgY3k6IEBjdXJyZW50WSwgY29tbW9uRXZlbnRJZDogdmFsdWVzWzBdLCBzdHlsZUluZGV4OiBwYXJzZUludCh2YWx1ZXNbMV0pLCB0b2tlbkluZGV4OiBAdG9rZW5JbmRleCB9KVxuICAgICAgICAgICAgICAgICAgICBlbHNlXG4gICAgICAgICAgICAgICAgICAgICAgICBAY3VzdG9tRGF0YS5saW5rRGF0YVtAbGluZV0ucHVzaCh7IGN4OiBAY3VycmVudFksIGN5OiBAY3VycmVudFksIGNvbW1vbkV2ZW50SWQ6IHRva2VuLnZhbHVlLCB0b2tlbkluZGV4OiBAdG9rZW5JbmRleCwgc3R5bGVJbmRleDogLTEgfSlcbiAgICAgICAgICAgICAgICAgICAgXG4gICAgICAgICAgICB3aGVuIFwiRVwiICMgQ2hhbmdlIEV4cHJlc3Npb25cbiAgICAgICAgICAgICAgICBleHByZXNzaW9uID0gUmVjb3JkTWFuYWdlci5jaGFyYWN0ZXJFeHByZXNzaW9uc0FycmF5LmZpcnN0IChjKSAtPiAoYy5uYW1lLmRlZmF1bHRUZXh0ID8gYy5uYW1lKSA9PSB0b2tlbi52YWx1ZVxuICAgICAgICAgICAgICAgIGlmICFleHByZXNzaW9uXG4gICAgICAgICAgICAgICAgICAgIGV4cHJlc3Npb24gPSBSZWNvcmRNYW5hZ2VyLmNoYXJhY3RlckV4cHJlc3Npb25zW3Rva2VuLnZhbHVlXVxuICAgICAgICAgICAgICAgICAgICBcbiAgICAgICAgICAgICAgICBjaGFyYWN0ZXIgPSBTY2VuZU1hbmFnZXIuc2NlbmUuY3VycmVudENoYXJhY3RlclxuICAgICAgICAgICAgICAgIGlmIGV4cHJlc3Npb24/IGFuZCBjaGFyYWN0ZXI/LmluZGV4P1xuICAgICAgICAgICAgICAgICAgICBkdXJhdGlvbiA9IEdhbWVNYW5hZ2VyLmRlZmF1bHRzLmNoYXJhY3Rlci5leHByZXNzaW9uRHVyYXRpb25cbiAgICAgICAgICAgICAgICAgICAgZWFzaW5nID0gZ3MuRWFzaW5ncy5mcm9tT2JqZWN0KEdhbWVNYW5hZ2VyLmRlZmF1bHRzLmNoYXJhY3Rlci5jaGFuZ2VFYXNpbmcpXG4gICAgICAgICAgICAgICAgICAgIGFuaW1hdGlvbiA9IEdhbWVNYW5hZ2VyLmRlZmF1bHRzLmNoYXJhY3Rlci5jaGFuZ2VBbmltYXRpb25cbiAgICAgICAgICAgICAgICAgICAgb2JqZWN0ID0gU2NlbmVNYW5hZ2VyLnNjZW5lLmNoYXJhY3RlcnMuZmlyc3QgKGMpIC0+IGMucmlkID09IGNoYXJhY3Rlci5pbmRleFxuICAgICAgICAgICAgICAgICAgICBvYmplY3Q/LmJlaGF2aW9yLmNoYW5nZUV4cHJlc3Npb24oZXhwcmVzc2lvbiwgYW5pbWF0aW9uLCBlYXNpbmcsIGR1cmF0aW9uKVxuICBcbiAgICAgICAgICAgIHdoZW4gXCJTUFwiICMgUGxheSBTb3VuZFxuICAgICAgICAgICAgICAgIHNvdW5kID0gUmVjb3JkTWFuYWdlci5zeXN0ZW0uc291bmRzW3Rva2VuLnZhbHVlLTFdXG4gICAgICAgICAgICAgICAgQXVkaW9NYW5hZ2VyLnBsYXlTb3VuZChzb3VuZClcbiAgICAgICAgICAgIHdoZW4gXCJTXCIgIyBDaGFuZ2UgU3BlZWRcbiAgICAgICAgICAgICAgICBHYW1lTWFuYWdlci5zZXR0aW5ncy5tZXNzYWdlU3BlZWQgPSB0b2tlbi52YWx1ZVxuICAgICAgICAgICAgd2hlbiBcIldcIiAjIFdhaXRcbiAgICAgICAgICAgICAgICBAZHJhd0ltbWVkaWF0ZWx5ID0gbm9cbiAgICAgICAgICAgICAgICBpZiAhR2FtZU1hbmFnZXIudGVtcFNldHRpbmdzLnNraXBcbiAgICAgICAgICAgICAgICAgICAgaWYgdG9rZW4udmFsdWUgPT0gXCJBXCJcbiAgICAgICAgICAgICAgICAgICAgICAgIEB3YWl0Rm9yS2V5ID0geWVzXG4gICAgICAgICAgICAgICAgICAgIGVsc2VcbiAgICAgICAgICAgICAgICAgICAgICAgIEB3YWl0Q291bnRlciA9IE1hdGgucm91bmQodG9rZW4udmFsdWUgLyAxMDAwICogR3JhcGhpY3MuZnJhbWVSYXRlKVxuICAgICAgICAgICAgd2hlbiBcIldFXCIgIyBXYWl0IGF0IEVuZFxuICAgICAgICAgICAgICAgIEB3YWl0QXRFbmQgPSB0b2tlbi52YWx1ZSA9PSBcIllcIlxuICAgICAgICAgICAgd2hlbiBcIkRJXCIgIyBEcmF3IEltbWVkaWFsdHlcbiAgICAgICAgICAgICAgICBAZHJhd0ltbWVkaWF0ZWx5ID0gdG9rZW4udmFsdWUgPT0gMSBvciB0b2tlbi52YWx1ZSA9PSBcIllcIiAjIERyYXcgaW1tZWRpYXRlbHlcbiAgICAgICAgICAgIGVsc2VcbiAgICAgICAgICAgICAgICByZXN1bHQgPSBzdXBlcih0b2tlbilcbiAgICAgICAgXG4gICAgICAgIHJldHVybiByZXN1bHQgICAgICAgIFxuICAgICMjIypcbiAgICAqIENsZWFycy9SZXNldHMgdGhlIHRleHQtcmVuZGVyZXIuXG4gICAgKlxuICAgICogQG1ldGhvZCBjbGVhclxuICAgICMjI1xuICAgIGNsZWFyOiAtPlxuICAgICAgICBAY2hhckluZGV4ID0gMFxuICAgICAgICBAY3VycmVudFggPSAwXG4gICAgICAgIEBjdXJyZW50WSA9IDBcbiAgICAgICAgQGxpbmUgPSAwXG4gICAgICAgIEBsaW5lcyA9IFtdXG4gICAgICAgIEBjbGVhckN1c3RvbU9iamVjdHMoKVxuICAgICAgICBAb2JqZWN0LmJpdG1hcD8uY2xlYXIoKVxuICAgICAgICBcbiAgICAgICAgZm9yIHNwcml0ZSBpbiBAYWxsU3ByaXRlc1xuICAgICAgICAgICAgc3ByaXRlLmRpc3Bvc2UoKVxuICAgICAgICAgICAgc3ByaXRlLmJpdG1hcD8uZGlzcG9zZSgpXG4gICAgICAgIEBhbGxTcHJpdGVzID0gW11cbiAgICAgICAgcmV0dXJuIG51bGxcbiAgICBcbiAgICAjIyMqXG4gICAgKiBDbGVhcnMvRGlzcG9zZXMgYWxsIHNwcml0ZXMgdXNlZCB0byBkaXNwbGF5IHRoZSB0ZXh0LWxpbmVzL3BhcnRzLlxuICAgICpcbiAgICAqIEBtZXRob2QgY2xlYXJBbGxTcHJpdGVzXG4gICAgIyMjXG4gICAgY2xlYXJBbGxTcHJpdGVzOiAtPlxuICAgICAgICBmb3Igc3ByaXRlIGluIEBhbGxTcHJpdGVzXG4gICAgICAgICAgICBzcHJpdGUuZGlzcG9zZSgpXG4gICAgICAgICAgICBzcHJpdGUuYml0bWFwPy5kaXNwb3NlKClcbiAgICAgICAgICAgIFxuICAgICAgICByZXR1cm4gbnVsbFxuICAgIFxuICAgICMjIypcbiAgICAqIENsZWFycy9EaXNwb3NlcyB0aGUgc3ByaXRlcyB1c2VkIHRvIGRpc3BsYXkgdGhlIHRleHQtbGluZXMvcGFydHMgb2YgdGhlIGN1cnJlbnQvbGFzdCBtZXNzYWdlLlxuICAgICpcbiAgICAqIEBtZXRob2QgY2xlYXJTcHJpdGVzXG4gICAgIyMjICAgICAgICBcbiAgICBjbGVhclNwcml0ZXM6IC0+XG4gICAgICAgIGZvciBzcHJpdGUgaW4gQHNwcml0ZXNcbiAgICAgICAgICAgIHNwcml0ZS5kaXNwb3NlKClcbiAgICAgICAgICAgIHNwcml0ZS5iaXRtYXA/LmRpc3Bvc2UoKVxuICAgICAgICAgICAgXG4gICAgICAgIHJldHVybiBudWxsXG4gICAgXG4gICAgXG4gICAgIyMjKlxuICAgICogUmVtb3ZlcyBhIGdhbWUgb2JqZWN0IGZyb20gdGhlIG1lc3NhZ2UuXG4gICAgKlxuICAgICogQG1ldGhvZCByZW1vdmVDdXN0b21PYmplY3RcbiAgICAqIEBwYXJhbSBvYmplY3Qge2dzLk9iamVjdF9CYXNlfSBUaGUgZ2FtZSBvYmplY3QgdG8gcmVtb3ZlLlxuICAgICMjI1xuICAgIHJlbW92ZUN1c3RvbU9iamVjdDogKG9iamVjdCkgLT5cbiAgICAgICAgU2NlbmVNYW5hZ2VyLnNjZW5lLnJlbW92ZU9iamVjdChvYmplY3QpXG4gICAgICAgIG9iamVjdC5kaXNwb3NlKClcbiAgICAgICAgQGN1c3RvbU9iamVjdHMucmVtb3ZlKG9iamVjdClcbiAgICAgICAgXG4gICAgIyMjKlxuICAgICogQWRkcyBhIGdhbWUgb2JqZWN0IHRvIHRoZSBtZXNzYWdlIHdoaWNoIGlzIGFsaXZlIHVudGlsIHRoZSBtZXNzYWdlIGlzXG4gICAgKiBlcmFzZWQuIENhbiBiZSB1c2VkIHRvIGRpc3BsYXkgYW5pbWF0aW9uZWQtaWNvbnMsIGV0Yy4gaW4gYSBtZXNzYWdlLlxuICAgICpcbiAgICAqIEBtZXRob2QgYWRkQ3VzdG9tT2JqZWN0XG4gICAgKiBAcGFyYW0gb2JqZWN0IHtncy5PYmplY3RfQmFzZX0gVGhlIGdhbWUgb2JqZWN0IHRvIGFkZC5cbiAgICAjIyNcbiAgICBhZGRDdXN0b21PYmplY3Q6IChvYmplY3QpIC0+XG4gICAgICAgIG9iamVjdC5kc3RSZWN0LnggPSBAb2JqZWN0LmRzdFJlY3QueCArIEBvYmplY3Qub3JpZ2luLnggKyBAY3VycmVudFhcbiAgICAgICAgb2JqZWN0LmRzdFJlY3QueSA9IEBvYmplY3QuZHN0UmVjdC55ICsgQG9iamVjdC5vcmlnaW4ueSArIEBjdXJyZW50WVxuICAgICAgICBvYmplY3QuekluZGV4ID0gQG9iamVjdC56SW5kZXggKyAxXG4gICAgICAgIG9iamVjdC51cGRhdGUoKVxuICAgICAgICBcbiAgICAgICAgU2NlbmVNYW5hZ2VyLnNjZW5lLmFkZE9iamVjdChvYmplY3QpXG4gICAgICAgIEBjdXN0b21PYmplY3RzLnB1c2gob2JqZWN0KVxuICAgICBcbiAgICAjIyMqXG4gICAgKiBDbGVhcnMgdGhlIGxpc3Qgb2YgY3VzdG9tIGdhbWUgb2JqZWN0cy4gQWxsIGdhbWUgb2JqZWN0cyBhcmUgZGlzcG9zZWQgYW5kIHJlbW92ZWRcbiAgICAqIGZyb20gdGhlIHNjZW5lLlxuICAgICpcbiAgICAqIEBtZXRob2QgY2xlYXJDdXN0b21PYmplY3RzXG4gICAgKiBAcGFyYW0gb2JqZWN0IHtPYmplY3R9IFRoZSBnYW1lIG9iamVjdCB0byBhZGQuXG4gICAgIyMjICAgXG4gICAgY2xlYXJDdXN0b21PYmplY3RzOiAtPlxuICAgICAgICBmb3Igb2JqZWN0IGluIEBjdXN0b21PYmplY3RzXG4gICAgICAgICAgICBvYmplY3QuZGlzcG9zZSgpXG4gICAgICAgICAgICBTY2VuZU1hbmFnZXIuc2NlbmUucmVtb3ZlT2JqZWN0KG9iamVjdClcbiAgICAgICAgICAgIFxuICAgICAgICBAY3VzdG9tT2JqZWN0cyA9IFtdXG4gICAgXG4gICAgIyMjKlxuICAgICogQ3JlYXRlcyB0aGUgYml0bWFwIGZvciBhIHNwZWNpZmllZCBsaW5lLW9iamVjdC5cbiAgICAqXG4gICAgKiBAbWV0aG9kIGNyZWF0ZUJpdG1hcFxuICAgICogQHByaXZhdGVcbiAgICAqIEBwYXJhbSB7T2JqZWN0fSBsaW5lIC0gQSBsaW5lLW9iamVjdC5cbiAgICAqIEByZXR1cm4ge0JpdG1hcH0gQSBuZXdseSBjcmVhdGVkIGJpdG1hcCBjb250YWluaW5nIHRoZSBsaW5lLXRleHQuXG4gICAgIyMjXG4gICAgY3JlYXRlQml0bWFwOiAobGluZSkgLT5cbiAgICAgICAgQGZvbnQgPSBAb2JqZWN0LmZvbnRcbiAgICAgICAgYml0bWFwID0gbmV3IEJpdG1hcChAb2JqZWN0LmRzdFJlY3Qud2lkdGgsIE1hdGgubWF4KEBtaW5MaW5lSGVpZ2h0LCBsaW5lLmhlaWdodCkpXG4gICAgICAgIGJpdG1hcC5mb250ID0gQGZvbnRcbiAgICAgICBcbiAgICAgICAgcmV0dXJuIGJpdG1hcFxuICAgIFxuICAgICMjIypcbiAgICAqIERyYXdzIHRoZSBsaW5lJ3MgY29udGVudCBvbiB0aGUgc3BlY2lmaWVkIGJpdG1hcC5cbiAgICAqXG4gICAgKiBAbWV0aG9kIGRyYXdMaW5lQ29udGVudFxuICAgICogQHByb3RlY3RlZFxuICAgICogQHBhcmFtIHtPYmplY3R9IGxpbmUgLSBBIGxpbmUtb2JqZWN0IHdoaWNoIHNob3VsZCBiZSBkcmF3biBvbiB0aGUgYml0bWFwLlxuICAgICogQHBhcmFtIHtncy5CaXRtYXB9IGJpdG1hcCAtIFRoZSBiaXRtYXAgdG8gZHJhdyB0aGUgbGluZSdzIGNvbnRlbnQgb24uXG4gICAgKiBAcGFyYW0ge251bWJlcn0gbGVuZ3RoIC0gRGV0ZXJtaW5lcyBob3cgbWFueSBjaGFyYWN0ZXJzIG9mIHRoZSBzcGVjaWZpZWQgbGluZSBzaG91bGQgYmUgZHJhd24uIFlvdSBjYW4gXG4gICAgKiBzcGVjaWZ5IC0xIHRvIGRyYXcgYWxsIGNoYXJhY3RlcnMuXG4gICAgIyMjXG4gICAgZHJhd0xpbmVDb250ZW50OiAobGluZSwgYml0bWFwLCBsZW5ndGgpIC0+XG4gICAgICAgIGJpdG1hcC5jbGVhcigpXG4gICAgICAgIGN1cnJlbnRYID0gQHBhZGRpbmdcbiAgICAgICAgZHJhd0FsbCA9IGxlbmd0aCA9PSAtMVxuICAgICAgICBcbiAgICAgICAgZm9yIHRva2VuLCBpIGluIGxpbmUuY29udGVudFxuICAgICAgICAgICAgYnJlYWsgaWYgaSA+IEB0b2tlbkluZGV4IGFuZCAhZHJhd0FsbFxuICAgICAgICAgICAgaWYgdG9rZW4uY29kZT9cbiAgICAgICAgICAgICAgICBzaXplID0gQG1lYXN1cmVDb250cm9sVG9rZW4odG9rZW4sIGJpdG1hcClcbiAgICAgICAgICAgICAgICBAZHJhd0NvbnRyb2xUb2tlbih0b2tlbiwgYml0bWFwLCBjdXJyZW50WClcbiAgICAgICAgICAgICAgICBpZiBzaXplIHRoZW4gY3VycmVudFggKz0gc2l6ZS53aWR0aFxuICAgICAgICAgICAgICAgIEBwcm9jZXNzQ29udHJvbFRva2VuKHRva2VuLCB5ZXMsIGxpbmUpXG4gICAgICAgICAgICBlbHNlIGlmIHRva2VuLnZhbHVlLmxlbmd0aCA+IDBcbiAgICAgICAgICAgICAgICB0b2tlbi5hcHBseUZvcm1hdChAZm9udClcbiAgICAgICAgICAgICAgICB2YWx1ZSA9IHRva2VuLnZhbHVlXG4gICAgICAgICAgICAgICAgaWYgIWRyYXdBbGwgYW5kIEB0b2tlbkluZGV4ID09IGkgYW5kIHZhbHVlLmxlbmd0aCA+IGxlbmd0aFxuICAgICAgICAgICAgICAgICAgICB2YWx1ZSA9IHZhbHVlLnN1YnN0cmluZygwLCBsZW5ndGgpXG4gICAgICAgICAgICAgICAgaWYgdmFsdWUgIT0gXCJcXG5cIlxuICAgICAgICAgICAgICAgICAgICBzaXplID0gQGZvbnQubWVhc3VyZVRleHRQbGFpbih2YWx1ZSkgIFxuICAgICAgICAgICAgICAgICAgICBiaXRtYXAuZHJhd1RleHQoY3VycmVudFgsIGxpbmUuaGVpZ2h0IC0gKHNpemUuaGVpZ2h0IC0gQGZvbnQuZGVzY2VudCkgLSBsaW5lLmRlc2NlbnQsIHNpemUud2lkdGgsIGJpdG1hcC5oZWlnaHQsIHZhbHVlLCAwLCAwKVxuICAgICAgICAgICAgICAgICAgICBjdXJyZW50WCArPSBzaXplLndpZHRoXG4gICAgICAgICAgICAgICAgXG4gICAgICAgIGxpbmUuY29udGVudFdpZHRoID0gY3VycmVudFggKyBAZm9udC5tZWFzdXJlVGV4dFBsYWluKFwiIFwiKS53aWR0aCAgIFxuICAgICAgICBcbiAgICAjIyMqXG4gICAgKiBDcmVhdGVzIHRoZSBzcHJpdGUgZm9yIGEgc3BlY2lmaWVkIGxpbmUtb2JqZWN0LlxuICAgICpcbiAgICAqIEBtZXRob2QgY3JlYXRlU3ByaXRlXG4gICAgKiBAcHJpdmF0ZVxuICAgICogQHBhcmFtIHtPYmplY3R9IGxpbmUgLSBBIGxpbmUtb2JqZWN0LlxuICAgICogQHJldHVybiB7U3ByaXRlfSBBIG5ld2x5IGNyZWF0ZWQgc3ByaXRlIG9iamVjdCBjb250YWluaW5nIHRoZSBsaW5lLXRleHQgYXMgYml0bWFwLlxuICAgICMjI1xuICAgIGNyZWF0ZVNwcml0ZTogKGxpbmUpIC0+XG4gICAgICAgIGJpdG1hcCA9IEBjcmVhdGVCaXRtYXAobGluZSlcbiAgICAgICAgXG4gICAgICAgIEBjdXJyZW50WCA9IDBcbiAgICAgICAgQHdhaXRDb3VudGVyID0gMFxuICAgICAgICBAd2FpdEZvcktleSA9IG5vXG4gICAgICAgICAgICAgICAgXG4gICAgICAgIHNwcml0ZSA9IG5ldyBTcHJpdGUoR3JhcGhpY3Mudmlld3BvcnQpXG4gICAgICAgIHNwcml0ZS5iaXRtYXAgPSBiaXRtYXBcbiAgICAgICAgc3ByaXRlLnZpc2libGUgPSB5ZXNcbiAgICAgICAgc3ByaXRlLnogPSBAb2JqZWN0LnpJbmRleCArIDFcbiAgICAgICAgXG4gICAgICAgIHNwcml0ZS5zcmNSZWN0ID0gbmV3IFJlY3QoMCwgMCwgMCwgYml0bWFwLmhlaWdodClcbiAgICAgICAgXG4gICAgICAgIHJldHVybiBzcHJpdGVcbiAgICAgXG4gICAgIyMjKlxuICAgICogQ3JlYXRlcyB0aGUgc3ByaXRlcyBmb3IgYSBzcGVjaWZpZWQgYXJyYXkgb2YgbGluZS1vYmplY3RzLlxuICAgICpcbiAgICAqIEBtZXRob2QgY3JlYXRlU3ByaXRlc1xuICAgICogQHByaXZhdGVcbiAgICAqIEBzZWUgZ3MuQ29tcG9uZW50X01lc3NhZ2VUZXh0UmVuZGVyZXIuY3JlYXRlU3ByaXRlLlxuICAgICogQHBhcmFtIHtBcnJheX0gbGluZXMgLSBBbiBhcnJheSBvZiBsaW5lLW9iamVjdHMuXG4gICAgKiBAcmV0dXJuIHtBcnJheX0gQW4gYXJyYXkgb2Ygc3ByaXRlcy5cbiAgICAjIyNcbiAgICBjcmVhdGVTcHJpdGVzOiAobGluZXMpIC0+XG4gICAgICAgIEBmb250U2l6ZSA9IEBvYmplY3QuZm9udC5zaXplXG4gICAgICAgIHJlc3VsdCA9IFtdXG4gICAgICAgIGZvciBsaW5lLCBpIGluIGxpbmVzXG4gICAgICAgICAgICBzcHJpdGUgPSBAY3JlYXRlU3ByaXRlKGxpbmUpXG4gICAgICAgICAgICByZXN1bHQucHVzaChzcHJpdGUpXG4gICAgICAgIHJldHVybiByZXN1bHRcbiAgICBcbiAgICAjIyMqXG4gICAgKiBTdGFydHMgYSBuZXcgbGluZS5cbiAgICAqXG4gICAgKiBAbWV0aG9kIG5ld0xpbmVcbiAgICAjIyNcbiAgICBuZXdMaW5lOiAtPlxuICAgICAgICBAY3VycmVudFggPSAwXG4gICAgICAgIEBjdXJyZW50WSArPSBAY3VycmVudExpbmVIZWlnaHQgKyBAbGluZVNwYWNpbmdcbiAgICAgICAgXG4gICAgIyMjKlxuICAgICogRGlzcGxheXMgYSBmb3JtYXR0ZWQgdGV4dCBpbW1lZGlhdGVseSB3aXRob3V0IGFueSBkZWxheXMgb3IgYW5pbWF0aW9ucy4gVGhlXG4gICAgKiBDb21wb25lbnRfVGV4dFJlbmRlcmVyLmRyYXdGb3JtYXR0ZWRUZXh0IG1ldGhvZCBmcm9tIHRoZSBiYXNlLWNsYXNzIGNhbm5vdFxuICAgICogYmUgdXNlZCBoZXJlIGJlY2F1c2UgaXQgd291bGQgcmVuZGVyIHRvIHRoZSBnYW1lIG9iamVjdCdzIGJpdG1hcCBvYmplY3Qgd2hpbGVcbiAgICAqIHRoaXMgbWV0aG9kIGlzIHJlbmRlcmluZyB0byB0aGUgc3ByaXRlcy5cbiAgICAqXG4gICAgKiBAbWV0aG9kIGRyYXdGb3JtYXR0ZWRUZXh0SW1tZWRpYXRlbHlcbiAgICAqIEBwYXJhbSB7bnVtYmVyfSB4IC0gVGhlIHgtY29vcmRpbmF0ZSBvZiB0aGUgdGV4dCdzIHBvc2l0aW9uLlxuICAgICogQHBhcmFtIHtudW1iZXJ9IHkgLSBUaGUgeS1jb29yZGluYXRlIG9mIHRoZSB0ZXh0J3MgcG9zaXRpb24uXG4gICAgKiBAcGFyYW0ge251bWJlcn0gd2lkdGggLSBEZXByZWNhdGVkLiBDYW4gYmUgbnVsbC5cbiAgICAqIEBwYXJhbSB7bnVtYmVyfSBoZWlnaHQgLSBEZXByZWNhdGVkLiBDYW4gYmUgbnVsbC5cbiAgICAqIEBwYXJhbSB7c3RyaW5nfSB0ZXh0IC0gVGhlIHRleHQgdG8gZHJhdy5cbiAgICAqIEBwYXJhbSB7Ym9vbGVhbn0gd29yZFdyYXAgLSBJZiB3b3JkV3JhcCBpcyBzZXQgdG8gdHJ1ZSwgbGluZS1icmVha3MgYXJlIGF1dG9tYXRpY2FsbHkgY3JlYXRlZC5cbiAgICAjIyNcbiAgICBkcmF3Rm9ybWF0dGVkVGV4dEltbWVkaWF0ZWx5OiAoeCwgeSwgd2lkdGgsIGhlaWdodCwgdGV4dCwgd29yZFdyYXApIC0+XG4gICAgICAgIEBkcmF3Rm9ybWF0dGVkVGV4dCh4LCB5LCB3aWR0aCwgaGVpZ2h0LCB0ZXh0LCB3b3JkV3JhcClcbiAgICAgICAgXG4gICAgICAgIGxvb3BcbiAgICAgICAgICAgIEBuZXh0Q2hhcigpXG4gICAgICAgICAgICAgICAgXG4gICAgICAgICAgICBpZiBAbGluZSA+PSBAbWF4TGluZXNcbiAgICAgICAgICAgICAgICBAaXNSdW5uaW5nID0gbm9cbiAgICAgICAgICAgIGVsc2VcbiAgICAgICAgICAgICAgICBAZHJhd05leHQoKVxuICAgICAgICAgICAgICAgIFxuICAgICAgICAgICAgYnJlYWsgdW5sZXNzIEBpc1J1bm5pbmdcbiAgICAgICAgICAgIFxuICAgICAgICBAY3VycmVudFkgKz0gQGN1cnJlbnRMaW5lSGVpZ2h0ICsgQGxpbmVTcGFjaW5nXG4gICAgICAgICAgICBcbiAgICAgICAgcmV0dXJuIG51bGxcbiAgICBcbiAgICBcbiAgICAjIyMqXG4gICAgKiBTdGFydHMgdGhlIHJlbmRlcmluZy1wcm9jZXNzIGZvciB0aGUgbWVzc2FnZS5cbiAgICAqXG4gICAgKiBAbWV0aG9kIGRyYXdGb3JtYXR0ZWRUZXh0XG4gICAgKiBAcGFyYW0ge251bWJlcn0geCAtIFRoZSB4LWNvb3JkaW5hdGUgb2YgdGhlIHRleHQncyBwb3NpdGlvbi5cbiAgICAqIEBwYXJhbSB7bnVtYmVyfSB5IC0gVGhlIHktY29vcmRpbmF0ZSBvZiB0aGUgdGV4dCdzIHBvc2l0aW9uLlxuICAgICogQHBhcmFtIHtudW1iZXJ9IHdpZHRoIC0gRGVwcmVjYXRlZC4gQ2FuIGJlIG51bGwuXG4gICAgKiBAcGFyYW0ge251bWJlcn0gaGVpZ2h0IC0gRGVwcmVjYXRlZC4gQ2FuIGJlIG51bGwuXG4gICAgKiBAcGFyYW0ge3N0cmluZ30gdGV4dCAtIFRoZSB0ZXh0IHRvIGRyYXcuXG4gICAgKiBAcGFyYW0ge2Jvb2xlYW59IHdvcmRXcmFwIC0gSWYgd29yZFdyYXAgaXMgc2V0IHRvIHRydWUsIGxpbmUtYnJlYWtzIGFyZSBhdXRvbWF0aWNhbGx5IGNyZWF0ZWQuXG4gICAgIyMjXG4gICAgZHJhd0Zvcm1hdHRlZFRleHQ6ICh4LCB5LCB3aWR0aCwgaGVpZ2h0LCB0ZXh0LCB3b3JkV3JhcCkgLT5cbiAgICAgICAgdGV4dCA9IHRleHQgfHwgXCIgXCIgIyBVc2UgYSBzcGFjZSBjaGFyYWN0ZXIgaWYgbm8gdGV4dCBpcyBzcGVjaWZpZWQuXG4gICAgICAgIEBmb250LnNldChAb2JqZWN0LmZvbnQpXG4gICAgICAgIEBzcGVlZCA9IDExIC0gTWF0aC5yb3VuZChHYW1lTWFuYWdlci5zZXR0aW5ncy5tZXNzYWdlU3BlZWQgKiAyLjUpXG4gICAgICAgIEBpc1J1bm5pbmcgPSB5ZXNcbiAgICAgICAgQGRyYXdJbW1lZGlhdGVseSA9IG5vXG4gICAgICAgIEBsaW5lQW5pbWF0aW9uQ291bnQgPSBAc3BlZWRcbiAgICAgICAgQGN1cnJlbnRMaW5lSGVpZ2h0ID0gMFxuICAgICAgICBAaXNXYWl0aW5nID0gbm9cbiAgICAgICAgQHdhaXRGb3JLZXkgPSBub1xuICAgICAgICBAY2hhckluZGV4ID0gMFxuICAgICAgICBAdG9rZW4gPSBudWxsXG4gICAgICAgIEB0b2tlbkluZGV4ID0gMFxuICAgICAgICBAbWVzc2FnZSA9IHRleHRcbiAgICAgICAgQGxpbmUgPSAwXG4gICAgICAgIEBjdXJyZW50TGluZSA9IEBsaW5lXG4gICAgICAgIGN1cnJlbnRYID0gQGN1cnJlbnRYICNNYXRoLm1heChAY3VycmVudFgsIEBwYWRkaW5nKVxuICAgICAgICBAbGluZXMgPSBAY2FsY3VsYXRlTGluZXMobGNzbShAbWVzc2FnZSksIHdvcmRXcmFwLCBAY3VycmVudFgpXG4gICAgICAgIEBzcHJpdGVzID0gQGNyZWF0ZVNwcml0ZXMoQGxpbmVzKVxuICAgICAgICBAYWxsU3ByaXRlcyA9IEBhbGxTcHJpdGVzLmNvbmNhdChAc3ByaXRlcylcbiAgICAgICAgQGN1cnJlbnRYID0gY3VycmVudFhcbiAgICAgICAgQGN1cnJlbnRTcHJpdGUgPSBAc3ByaXRlc1tAbGluZV1cbiAgICAgICAgQGN1cnJlbnRTcHJpdGUueCA9IEBjdXJyZW50WCArIEBvYmplY3Qub3JpZ2luLnggKyBAb2JqZWN0LmRzdFJlY3QueFxuICAgICAgICBAbWF4TGluZXMgPSBAY2FsY3VsYXRlTWF4TGluZXMoQGxpbmVzKVxuICAgICAgICBAdG9rZW4gPSBAbGluZXNbQGxpbmVdPy5jb250ZW50W0B0b2tlbkluZGV4XSB8fCBuZXcgZ3MuUmVuZGVyZXJUb2tlbihudWxsLCBcIlwiKVxuICAgICAgICBcbiAgICAgICAgXG4gICAgICAgIEBzdGFydCgpXG4gICAgIFxuICAgICMjIypcbiAgICAqIFN0YXJ0cyB0aGUgbWVzc2FnZS1yZW5kZXJpbmcgcHJvY2Vzcy5cbiAgICAqXG4gICAgKiBAbWV0aG9kIHN0YXJ0XG4gICAgKiBAcHJvdGVjdGVkXG4gICAgIyMjICAgICBcbiAgICBzdGFydDogLT5cbiAgICAgICAgaWYgR2FtZU1hbmFnZXIudGVtcFNldHRpbmdzLnNraXAgYW5kIEdhbWVNYW5hZ2VyLnRlbXBTZXR0aW5ncy5za2lwVGltZSA9PSAwXG4gICAgICAgICAgICBAaW5zdGFudFNraXAoKVxuICAgICAgICBlbHNlIGlmIEBtYXhMaW5lcyA9PSAwXG4gICAgICAgICAgICAjIElmIGZpcnN0IGxpbmUgaXMgZW1wdHkgdGhlbiBpdCBkb2Vzbid0IGZpdCBpbnRvIGN1cnJlbnQgbGluZSwgc28gZmluaXNoLlxuICAgICAgICAgICAgaWYgQGxpbmVzWzBdPy5jb250ZW50ID09IFwiXCJcbiAgICAgICAgICAgICAgICBAZmluaXNoKClcbiAgICAgICAgICAgIGVsc2VcbiAgICAgICAgICAgICAgICBAbWF4TGluZXMgPSAxXG4gICAgICAgICAgICAgICAgQGRyYXdOZXh0KClcbiAgICAgICAgZWxzZVxuICAgICAgICAgICAgQGRyYXdOZXh0KClcbiAgICAgXG4gICAgIyMjKlxuICAgICogU2tpcHMgdGhlIGN1cnJlbnQgbWVzc2FnZSBhbmQgZmluaXNoZXMgdGhlIG1lc3NhZ2UtcHJvY2Vzc2luZyBpbW1lZGlhdGVseS4gVGhlIG1lc3NhZ2VcbiAgICAqIHRva2VucyBhcmUgcHJvY2Vzc2VkIGJ1dCBub3QgcmVuZGVyZWQuXG4gICAgKlxuICAgICogQG1ldGhvZCBpbnN0YW50U2tpcFxuICAgICMjIyAgXG4gICAgaW5zdGFudFNraXA6IC0+XG4gICAgICAgIGxvb3BcbiAgICAgICAgICAgIGlmIEBsaW5lIDwgQG1heExpbmVzXG4gICAgICAgICAgICAgICAgQG5leHRDaGFyKClcbiAgICAgICAgICAgICAgICBcbiAgICAgICAgICAgIGlmIEBsaW5lID49IEBtYXhMaW5lc1xuICAgICAgICAgICAgICAgIGJyZWFrXG4gICAgICAgICAgICBlbHNlXG4gICAgICAgICAgICAgICAgQHByb2Nlc3NUb2tlbigpXG4gICAgICAgICAgICAgICAgXG4gICAgICAgICAgICBicmVhayB1bmxlc3MgQGlzUnVubmluZyBhbmQgQGxpbmUgPCBAbWF4TGluZXNcbiAgICAgICAgXG4gICAgICAgIEBvYmplY3QuZXZlbnRzPy5lbWl0KFwibWVzc2FnZVdhaXRpbmdcIiwgdGhpcylcbiAgICAgICAgQGNvbnRpbnVlKClcbiAgICAgICAgXG4gICAgIyMjKlxuICAgICogUHJvY2Vzc2VzIHRoZSBjdXJyZW50IHRva2VuLlxuICAgICpcbiAgICAqIEBtZXRob2QgcHJvY2Vzc1Rva2VuXG4gICAgIyMjICAgIFxuICAgIHByb2Nlc3NUb2tlbjogLT5cbiAgICAgICAgdG9rZW4gPSBudWxsXG4gICAgICAgIFxuICAgICAgICBpZiBAdG9rZW4uY29kZT9cbiAgICAgICAgICAgIHRva2VuID0gQHByb2Nlc3NDb250cm9sVG9rZW4oQHRva2VuLCBubylcbiAgICAgICAgICAgIGlmIHRva2VuP1xuICAgICAgICAgICAgICAgIEB0b2tlbiA9IHRva2VuXG4gICAgICAgICAgICAgICAgQHRva2VuLm9uU3RhcnQ/KClcbiAgICAgICAgZWxzZVxuICAgICAgICAgICAgdG9rZW4gPSBAdG9rZW5cbiAgICAgICAgICAgIFxuICAgICAgICByZXR1cm4gdG9rZW5cbiAgICAgICAgICAgIFxuICAgICAgICAgICAgXG4gICAgICAgICAgICBcbmdzLkNvbXBvbmVudF9NZXNzYWdlVGV4dFJlbmRlcmVyID0gQ29tcG9uZW50X01lc3NhZ2VUZXh0UmVuZGVyZXIiXX0=
//# sourceURL=Component_MessageTextRenderer_127.js