var Component_CommandInterpreter, InterpreterContext, LivePreviewInfo,
  extend = function(child, parent) { for (var key in parent) { if (hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; },
  hasProp = {}.hasOwnProperty;

LivePreviewInfo = (function() {

  /**
  * Stores internal preview-info if the game runs currently in Live-Preview.
  *        
  * @module gs
  * @class LivePreviewInfo
  * @memberof gs
   */
  function LivePreviewInfo() {

    /**
    * Timer ID if a timeout for live-preview was configured to exit the game loop after a certain amount of time.
    * @property timeout
    * @type number
     */
    this.timeout = null;

    /** 
    * Indicates if Live-Preview is currently waiting for the next user-action. (Selecting another command, etc.)
    * @property waiting  
    * @type boolean
     */
    this.waiting = false;

    /**
    * Counts the amount of executed commands since the last 
    * interpreter-pause(waiting, etc.). If its more than 500, the interpreter will automatically pause for 1 frame to 
    * avoid that Live-Preview freezes the Editor in case of endless loops.
    * @property executedCommands
    * @type number
     */
    this.executedCommands = 0;

    /** 
    * Indicates that the command to skip to has not been found. 
    * @property commandNotFound  
    * @type boolean
     */
    this.commandNotFound = false;
  }

  return LivePreviewInfo;

})();

gs.LivePreviewInfo = LivePreviewInfo;

InterpreterContext = (function() {
  InterpreterContext.objectCodecBlackList = ["owner"];


  /**
  * Describes an interpreter-context which holds information about
  * the interpreter's owner and also unique ID used for accessing correct
  * local variables.
  *
  * @module gs
  * @class InterpreterContext
  * @memberof gs
  * @param {number|string} id - A unique ID
  * @param {Object} owner - The owner of the interpreter
   */

  function InterpreterContext(id, owner) {

    /**
    * A unique numeric or textual ID used for accessing correct local variables.
    * @property id
    * @type number|string
     */
    this.id = id;

    /**
    * The owner of the interpreter (e.g. current scene, etc.).
    * @property owner
    * @type Object
     */
    this.owner = owner;
  }


  /**
  * Sets the context's data.
  * @param {number|string} id - A unique ID
  * @param {Object} owner - The owner of the interpreter
  * @method set
   */

  InterpreterContext.prototype.set = function(id, owner) {
    this.id = id;
    return this.owner = owner;
  };

  return InterpreterContext;

})();

gs.InterpreterContext = InterpreterContext;

Component_CommandInterpreter = (function(superClass) {
  extend(Component_CommandInterpreter, superClass);

  Component_CommandInterpreter.objectCodecBlackList = ["object", "command", "onMessageADVWaiting", "onMessageADVDisappear", "onMessageADVFinish"];


  /**
  * Called if this object instance is restored from a data-bundle. It can be used
  * re-assign event-handler, anonymous functions, etc.
  * 
  * @method onDataBundleRestore.
  * @param Object data - The data-bundle
  * @param gs.ObjectCodecContext context - The codec-context.
   */

  Component_CommandInterpreter.prototype.onDataBundleRestore = function(data, context) {};


  /**
  * A component which allows a game object to process commands like for
  * scene-objects. For each command a command-function exists. To add
  * own custom commands to the interpreter just create a sub-class and
  * override the gs.Component_CommandInterpreter.assignCommand method
  * and assign the command-function for your custom-command.
  *
  * @module gs
  * @class Component_CommandInterpreter
  * @extends gs.Component
  * @memberof gs
   */

  function Component_CommandInterpreter() {
    Component_CommandInterpreter.__super__.constructor.call(this);

    /**
    * Wait-Counter in frames. If greater than 0, the interpreter will for that amount of frames before continue.
    * @property waitCounter
    * @type number
     */
    this.waitCounter = 0;

    /**
    * Index to the next command to execute.
    * @property pointer
    * @type number
     */
    this.pointer = 0;

    /**
    * Stores states of conditions.
    * @property conditions
    * @type number
    * @protected
     */
    this.conditions = [];

    /**
    * Stores states of loops.
    * @property loops
    * @type number
    * @protected
     */
    this.loops = [];
    this.timers = [];

    /**
    * Indicates if the interpreter is currently running.
    * @property isRunning
    * @type boolean
    * @readOnly
     */
    this.isRunning = false;

    /**
    * Indicates if the interpreter is currently waiting.
    * @property isWaiting
    * @type boolean
     */
    this.isWaiting = false;

    /**
    * Indicates if the interpreter is currently waiting until a message processed by another context like a Common Event
    * is finished.
    * FIXME: Conflict handling can be removed maybe. 
    * @property isWaitingForMessage
    * @type boolean
     */
    this.isWaitingForMessage = false;

    /**
    * Stores internal preview-info if the game runs currently in Live-Preview.
    * <ul>
    * <li>previewInfo.timeout - Timer ID if a timeout for live-preview was configured to exit the game loop after a certain amount of time.</li>
    * <li>previewInfo.waiting - Indicates if Live-Preview is currently waiting for the next user-action. (Selecting another command, etc.)</li>
    * <li>previewInfo.executedCommands - Counts the amount of executed commands since the last 
    * interpreter-pause(waiting, etc.). If its more than 500, the interpreter will automatically pause for 1 frame to 
    * avoid that Live-Preview freezes the Editor in case of endless loops.</li>
    * </ul>
    * @property previewInfo
    * @type boolean
    * @protected
     */
    this.previewInfo = new gs.LivePreviewInfo();

    /**
    * Stores Live-Preview related info passed from the VN Maker editor like the command-index the player clicked on, etc.
    * @property previewData
    * @type Object
    * @protected
     */
    this.previewData = null;

    /**
    * Indicates if the interpreter automatically repeats execution after the last command was executed.
    * @property repeat
    * @type boolean
     */
    this.repeat = false;

    /**
    * The execution context of the interpreter.
    * @property context
    * @type gs.InterpreterContext
    * @protected
     */
    this.context = new gs.InterpreterContext(0, null);

    /**
    * Sub-Interpreter from a Common Event Call. The interpreter will wait until the sub-interpreter is done and set back to
    * <b>null</b>.
    * @property subInterpreter
    * @type gs.Component_CommandInterpreter
    * @protected
     */
    this.subInterpreter = null;

    /**
    * Current indent-level of execution
    * @property indent
    * @type number
    * @protected
     */
    this.indent = 0;

    /**
    * Stores information about for what the interpreter is currently waiting for like for a ADV message, etc. to
    * restore probably when loaded from a save-game.
    * @property waitingFor
    * @type Object
    * @protected
     */
    this.waitingFor = {};

    /**
    * Stores interpreter related settings like how to handle messages, etc.
    * @property settings
    * @type Object
    * @protected
     */
    this.settings = {
      message: {
        byId: {},
        autoErase: true,
        waitAtEnd: true,
        backlog: true
      },
      screen: {
        pan: new gs.Point(0, 0)
      }
    };

    /**
    * Mapping table to quickly get the anchor point for the an inserted anchor-point constant such as
    * Top-Left(0), Top(1), Top-Right(2) and so on.
    * @property graphicAnchorPointsByConstant
    * @type gs.Point[]
    * @protected
     */
    this.graphicAnchorPointsByConstant = [new gs.Point(0.0, 0.0), new gs.Point(0.5, 0.0), new gs.Point(1.0, 0.0), new gs.Point(1.0, 0.5), new gs.Point(1.0, 1.0), new gs.Point(0.5, 1.0), new gs.Point(0.0, 1.0), new gs.Point(0.0, 0.5), new gs.Point(0.5, 0.5)];
  }

  Component_CommandInterpreter.prototype.onHotspotClick = function(e, data) {
    return this.executeAction(data.params.actions.onClick, false, data.bindValue);
  };

  Component_CommandInterpreter.prototype.onHotspotEnter = function(e, data) {
    return this.executeAction(data.params.actions.onEnter, true, data.bindValue);
  };

  Component_CommandInterpreter.prototype.onHotspotLeave = function(e, data) {
    return this.executeAction(data.params.actions.onLeave, false, data.bindValue);
  };

  Component_CommandInterpreter.prototype.onHotspotDragStart = function(e, data) {
    return this.executeAction(data.params.actions.onDrag, true, data.bindValue);
  };

  Component_CommandInterpreter.prototype.onHotspotDrag = function(e, data) {
    return this.executeAction(data.params.actions.onDrag, true, data.bindValue);
  };

  Component_CommandInterpreter.prototype.onHotspotDragEnd = function(e, data) {
    return this.executeAction(data.params.actions.onDrag, false, data.bindValue);
  };

  Component_CommandInterpreter.prototype.onHotspotStateChanged = function(e, params) {
    if (e.sender.behavior.selected) {
      return this.executeAction(params.actions.onSelect, true);
    } else {
      return this.executeAction(params.actions.onDeselect, false);
    }
  };


  /**
  * Called when a ADV message finished rendering and is now waiting
  * for the user/autom-message timer to proceed.
  *
  * @method onMessageADVWaiting
  * @return {Object} Event Object containing additional data.
  * @protected
   */

  Component_CommandInterpreter.prototype.onMessageADVWaiting = function(e) {
    var messageObject;
    messageObject = e.sender.object;
    if (!this.messageSettings().waitAtEnd) {
      if (e.data.params.waitForCompletion) {
        this.isWaiting = false;
      }
      messageObject.textRenderer.isWaiting = false;
      messageObject.textRenderer.isRunning = false;
    }
    messageObject.events.off("waiting", e.handler);
    if (this.messageSettings().backlog && (messageObject.settings.autoErase || messageObject.settings.paragraphSpacing > 0)) {
      return GameManager.backlog.push({
        character: messageObject.character,
        message: messageObject.behavior.message,
        choices: []
      });
    }
  };


  /**
  * Called when an ADV message finished fade-out.
  *
  * @method onMessageADVDisappear
  * @return {Object} Event Object containing additional data.
  * @protected
   */

  Component_CommandInterpreter.prototype.onMessageADVDisappear = function(messageObject, waitForCompletion) {
    SceneManager.scene.currentCharacter = {
      name: ""
    };
    messageObject.behavior.clear();
    messageObject.visible = false;
    if (messageObject.waitForCompletion) {
      this.isWaiting = false;
    }
    return this.waitingFor.messageADV = null;
  };


  /**
  * Called when an ADV message finished clear.
  *
  * @method onMessageADVClear
  * @return {Object} Event Object containing additional data.
  * @protected
   */

  Component_CommandInterpreter.prototype.onMessageADVClear = function(messageObject, waitForCompletion) {
    messageObject = this.targetMessage();
    if (this.messageSettings().backlog) {
      GameManager.backlog.push({
        character: messageObject.character,
        message: messageObject.behavior.message,
        choices: []
      });
    }
    return this.onMessageADVDisappear(messageObject, waitForCompletion);
  };


  /**
  * Called when a hotspot/image-map sends a "jumpTo" event to let the
  * interpreter jump to the position defined in the event object.
  *
  * @method onJumpTo
  * @return {Object} Event Object containing additional data.
  * @protected
   */

  Component_CommandInterpreter.prototype.onJumpTo = function(e) {
    this.jumpToLabel(e.label);
    return this.isWaiting = false;
  };


  /**
  * Called when a hotspot/image-map sends a "callCommonEvent" event to let the
  * interpreter call the common event defined in the event object.
  *
  * @method onJumpTo
  * @return {Object} Event Object containing additional data.
  * @protected
   */

  Component_CommandInterpreter.prototype.onCallCommonEvent = function(e) {
    var event, eventId, ref;
    eventId = e.commonEventId;
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
    this.callCommonEvent(eventId, e.params || [], !e.finish);
    return this.isWaiting = (ref = e.waiting) != null ? ref : false;
  };


  /**
  * Called when a ADV message finishes. 
  *
  * @method onMessageADVFinish
  * @return {Object} Event Object containing additional data.
  * @protected
   */

  Component_CommandInterpreter.prototype.onMessageADVFinish = function(e) {
    var commands, duration, fading, messageObject, pointer;
    messageObject = e.sender.object;
    if (!this.messageSettings().waitAtEnd) {
      return;
    }
    GameManager.globalData.messages[lcsm(e.data.params.message)] = {
      read: true
    };
    GameManager.saveGlobalData();
    if (e.data.params.waitForCompletion) {
      this.isWaiting = false;
    }
    this.waitingFor.messageADV = null;
    pointer = this.pointer;
    commands = this.object.commands;
    messageObject.events.off("finish", e.handler);
    if ((messageObject.voice != null) && GameManager.settings.skipVoiceOnAction) {
      AudioManager.stopSound(messageObject.voice.name);
    }
    if (!this.isMessageCommand(pointer, commands) && this.messageSettings().autoErase) {
      this.isWaiting = true;
      this.waitingFor.messageADV = e.data.params;
      fading = GameManager.tempSettings.messageFading;
      duration = GameManager.tempSettings.skip ? 0 : fading.duration;
      messageObject.waitForCompletion = e.data.params.waitForCompletion;
      return messageObject.animator.disappear(fading.animation, fading.easing, duration, gs.CallBack("onMessageADVDisappear", this, e.data.params.waitForCompletion));
    }
  };


  /**
  * Called when a common event finished execution. In most cases, the interpreter
  * will stop waiting and continue processing after this. But h
  *
  * @method onCommonEventFinish
  * @return {Object} Event Object containing additional data.
  * @protected
   */

  Component_CommandInterpreter.prototype.onCommonEventFinish = function(e) {
    var ref;
    SceneManager.scene.commonEventContainer.removeObject(e.sender.object);
    e.sender.object.events.off("finish");
    this.subInterpreter = null;
    return this.isWaiting = (ref = e.data.waiting) != null ? ref : false;
  };


  /**
  * Called when a scene call finished execution.
  *
  * @method onCallSceneFinish
  * @param {Object} sender - The sender of this event.
  * @protected
   */

  Component_CommandInterpreter.prototype.onCallSceneFinish = function(sender) {
    this.isWaiting = false;
    return this.subInterpreter = null;
  };


  /**
  * Serializes the interpreter into a data-bundle.
  *
  * @method toDataBundle
  * @return {Object} The data-bundle.
   */

  Component_CommandInterpreter.prototype.toDataBundle = function() {
    if (this.isInputDataCommand(Math.max(this.pointer - 1, 0), this.object.commands)) {
      return {
        pointer: Math.max(this.pointer - 1, 0),
        choice: this.choice,
        conditions: this.conditions,
        loops: this.loops,
        labels: this.labels,
        isWaiting: false,
        isRunning: this.isRunning,
        waitCounter: this.waitCounter,
        waitingFor: this.waitingFor,
        indent: this.indent,
        settings: this.settings
      };
    } else {
      return {
        pointer: this.pointer,
        choice: this.choice,
        conditions: this.conditions,
        loops: this.loops,
        labels: this.labels,
        isWaiting: this.isWaiting,
        isRunning: this.isRunning,
        waitCounter: this.waitCounter,
        waitingFor: this.waitingFor,
        indent: this.indent,
        settings: this.settings
      };
    }
  };


  /**
   * Previews the current scene at the specified pointer. This method is called from the
   * VN Maker Scene-Editor if live-preview is enabled and the user clicked on a command.
   *
   * @method preview
   */

  Component_CommandInterpreter.prototype.preview = function() {
    var ex, scene;
    try {
      if (!$PARAMS.preview || !$PARAMS.preview.scene) {
        return;
      }
      AudioManager.stopAllSounds();
      AudioManager.stopAllMusic();
      AudioManager.stopAllVoices();
      SceneManager.scene.choices = [];
      GameManager.setupCursor();
      this.previewData = $PARAMS.preview;
      gs.GlobalEventManager.emit("previewRestart");
      if (this.previewInfo.timeout) {
        clearTimeout(this.previewInfo.timeout);
      }
      if (Graphics.stopped) {
        Graphics.stopped = false;
        Graphics.onEachFrame(gs.Main.frameCallback);
      }
      scene = new vn.Object_Scene();
      scene.sceneData.uid = this.previewData.scene.uid;
      return SceneManager.switchTo(scene);
    } catch (error) {
      ex = error;
      return console.warn(ex);
    }
  };


  /**
   * Sets up the interpreter.
   *
   * @method setup
   */

  Component_CommandInterpreter.prototype.setup = function() {
    Component_CommandInterpreter.__super__.setup.apply(this, arguments);
    this.previewData = $PARAMS.preview;
    if (this.previewData) {
      return gs.GlobalEventManager.on("mouseDown", ((function(_this) {
        return function() {
          if (_this.previewInfo.waiting) {
            if (_this.previewInfo.timeout) {
              clearTimeout(_this.previewInfo.timeout);
            }
            _this.previewInfo.waiting = false;
            GameManager.tempSettings.skip = false;
            _this.previewData = null;
            return gs.GlobalEventManager.emit("previewRestart");
          }
        };
      })(this)), null, this.object);
    }
  };


  /**
   * Disposes the interpreter.
   *
   * @method dispose
   */

  Component_CommandInterpreter.prototype.dispose = function() {
    if (this.previewData) {
      gs.GlobalEventManager.offByOwner("mouseDown", this.object);
    }
    return Component_CommandInterpreter.__super__.dispose.apply(this, arguments);
  };

  Component_CommandInterpreter.prototype.isInstantSkip = function() {
    return GameManager.tempSettings.skip && GameManager.tempSettings.skipTime === 0;
  };


  /**
  * Restores the interpreter from a data-bundle
  *
  * @method restore
  * @param {Object} bundle- The data-bundle.
   */

  Component_CommandInterpreter.prototype.restore = function() {};


  /**
  * Gets the default game message for novel-mode.
  *
  * @method messageObjectNVL
  * @return {ui.Object_Message} The NVL game message object.
   */

  Component_CommandInterpreter.prototype.messageObjectNVL = function() {
    return gs.ObjectManager.current.objectById("nvlGameMessage_message");
  };


  /**
  * Gets the default game message for adventure-mode.
  *
  * @method messageObjectADV
  * @return {ui.Object_Message} The ADV game message object.
   */

  Component_CommandInterpreter.prototype.messageObjectADV = function() {
    return gs.ObjectManager.current.objectById("gameMessage_message");
  };


  /**
  * Starts the interpreter
  *
  * @method start
   */

  Component_CommandInterpreter.prototype.start = function() {
    this.conditions = [];
    this.loops = [];
    this.indent = 0;
    this.pointer = 0;
    this.isRunning = true;
    return this.isWaiting = false;
  };


  /**
  * Stops the interpreter
  *
  * @method stop
   */

  Component_CommandInterpreter.prototype.stop = function() {
    return this.isRunning = false;
  };


  /**
  * Resumes the interpreter
  *
  * @method resume
   */

  Component_CommandInterpreter.prototype.resume = function() {
    return this.isRunning = true;
  };


  /**
  * Updates the interpreter and executes all commands until the next wait is 
  * triggered by a command. So in the case of an endless-loop the method will 
  * never return.
  *
  * @method update
   */

  Component_CommandInterpreter.prototype.update = function() {
    if (this.subInterpreter != null) {
      this.subInterpreter.update();
      return;
    }
    GameManager.variableStore.setupTempVariables(this.context);
    if (((this.object.commands == null) || this.pointer >= this.object.commands.length) && !this.isWaiting) {
      if (this.repeat) {
        this.start();
      } else if (this.isRunning) {
        this.isRunning = false;
        if (this.onFinish != null) {
          this.onFinish(this);
        }
        return;
      }
    }
    if (!this.isRunning) {
      return;
    }
    if (!this.object.commands.optimized) {
      DataOptimizer.optimizeEventCommands(this.object.commands);
    }
    if (this.waitCounter > 0) {
      this.waitCounter--;
      this.isWaiting = this.waitCounter > 0;
      return;
    }
    if (this.isWaitingForMessage) {
      this.isWaiting = true;
      if (!this.isProcessingMessageInOtherContext()) {
        this.isWaiting = false;
        this.isWaitingForMessage = false;
      } else {
        return;
      }
    }
    if (GameManager.inLivePreview) {
      while (!(this.isWaiting || this.previewInfo.waiting) && this.pointer < this.object.commands.length && this.isRunning) {
        this.executeCommand(this.pointer);
        this.previewInfo.executedCommands++;
        if (this.previewInfo.executedCommands > 500) {
          this.previewInfo.executedCommands = 0;
          this.isWaiting = true;
          this.waitCounter = 1;
        }
      }
    } else {
      while (!(this.isWaiting || this.previewInfo.waiting) && this.pointer < this.object.commands.length && this.isRunning) {
        this.executeCommand(this.pointer);
      }
    }
    if (this.pointer >= this.object.commands.length && !this.isWaiting) {
      if (this.repeat) {
        return this.start();
      } else if (this.isRunning) {
        this.isRunning = false;
        if (this.onFinish != null) {
          return this.onFinish(this);
        }
      }
    }
  };


  /**
  * Assigns the correct command-function to the specified command-object if 
  * necessary.
  *
  * @method assignCommand
   */

  Component_CommandInterpreter.prototype.assignCommand = function(command) {
    switch (command.id) {
      case "gs.Idle":
        return command.execute = this.commandIdle;
      case "gs.StartTimer":
        return command.execute = this.commandStartTimer;
      case "gs.PauseTimer":
        return command.execute = this.commandPauseTimer;
      case "gs.ResumeTimer":
        return command.execute = this.commandResumeTimer;
      case "gs.StopTimer":
        return command.execute = this.commandStopTimer;
      case "gs.WaitCommand":
        return command.execute = this.commandWait;
      case "gs.LoopCommand":
        return command.execute = this.commandLoop;
      case "gs.BreakLoopCommand":
        return command.execute = this.commandBreakLoop;
      case "gs.Comment":
        return command.execute = function() {
          return 0;
        };
      case "gs.EmptyCommand":
        return command.execute = function() {
          return 0;
        };
      case "gs.ListAdd":
        return command.execute = this.commandListAdd;
      case "gs.ListPop":
        return command.execute = this.commandListPop;
      case "gs.ListShift":
        return command.execute = this.commandListShift;
      case "gs.ListRemoveAt":
        return command.execute = this.commandListRemoveAt;
      case "gs.ListInsertAt":
        return command.execute = this.commandListInsertAt;
      case "gs.ListValueAt":
        return command.execute = this.commandListValueAt;
      case "gs.ListClear":
        return command.execute = this.commandListClear;
      case "gs.ListShuffle":
        return command.execute = this.commandListShuffle;
      case "gs.ListSort":
        return command.execute = this.commandListSort;
      case "gs.ListIndexOf":
        return command.execute = this.commandListIndexOf;
      case "gs.ListSet":
        return command.execute = this.commandListSet;
      case "gs.ListCopy":
        return command.execute = this.commandListCopy;
      case "gs.ListLength":
        return command.execute = this.commandListLength;
      case "gs.ListJoin":
        return command.execute = this.commandListJoin;
      case "gs.ListFromText":
        return command.execute = this.commandListFromText;
      case "gs.ResetVariables":
        return command.execute = this.commandResetVariables;
      case "gs.ChangeVariableDomain":
        return command.execute = this.commandChangeVariableDomain;
      case "gs.ChangeNumberVariables":
        return command.execute = this.commandChangeNumberVariables;
      case "gs.ChangeDecimalVariables":
        return command.execute = this.commandChangeDecimalVariables;
      case "gs.ChangeBooleanVariables":
        return command.execute = this.commandChangeBooleanVariables;
      case "gs.ChangeStringVariables":
        return command.execute = this.commandChangeStringVariables;
      case "gs.CheckSwitch":
        return command.execute = this.commandCheckSwitch;
      case "gs.CheckNumberVariable":
        return command.execute = this.commandCheckNumberVariable;
      case "gs.CheckTextVariable":
        return command.execute = this.commandCheckTextVariable;
      case "gs.Condition":
        return command.execute = this.commandCondition;
      case "gs.ConditionElse":
        return command.execute = this.commandConditionElse;
      case "gs.ConditionElseIf":
        return command.execute = this.commandConditionElseIf;
      case "gs.Label":
        return command.execute = this.commandLabel;
      case "gs.JumpToLabel":
        return command.execute = this.commandJumpToLabel;
      case "gs.SetMessageArea":
        return command.execute = this.commandSetMessageArea;
      case "gs.ShowMessage":
        return command.execute = this.commandShowMessage;
      case "gs.ShowPartialMessage":
        return command.execute = this.commandShowPartialMessage;
      case "gs.MessageFading":
        return command.execute = this.commandMessageFading;
      case "gs.MessageSettings":
        return command.execute = this.commandMessageSettings;
      case "gs.CreateMessageArea":
        return command.execute = this.commandCreateMessageArea;
      case "gs.EraseMessageArea":
        return command.execute = this.commandEraseMessageArea;
      case "gs.SetTargetMessage":
        return command.execute = this.commandSetTargetMessage;
      case "vn.MessageBoxDefaults":
        return command.execute = this.commandMessageBoxDefaults;
      case "vn.MessageBoxVisibility":
        return command.execute = this.commandMessageBoxVisibility;
      case "vn.MessageVisibility":
        return command.execute = this.commandMessageVisibility;
      case "vn.BacklogVisibility":
        return command.execute = this.commandBacklogVisibility;
      case "gs.ClearMessage":
        return command.execute = this.commandClearMessage;
      case "gs.ChangeWeather":
        return command.execute = this.commandChangeWeather;
      case "gs.FreezeScreen":
        return command.execute = this.commandFreezeScreen;
      case "gs.ScreenTransition":
        return command.execute = this.commandScreenTransition;
      case "gs.ShakeScreen":
        return command.execute = this.commandShakeScreen;
      case "gs.TintScreen":
        return command.execute = this.commandTintScreen;
      case "gs.FlashScreen":
        return command.execute = this.commandFlashScreen;
      case "gs.ZoomScreen":
        return command.execute = this.commandZoomScreen;
      case "gs.RotateScreen":
        return command.execute = this.commandRotateScreen;
      case "gs.PanScreen":
        return command.execute = this.commandPanScreen;
      case "gs.ScreenEffect":
        return command.execute = this.commandScreenEffect;
      case "gs.ShowVideo":
        return command.execute = this.commandShowVideo;
      case "gs.MoveVideo":
        return command.execute = this.commandMoveVideo;
      case "gs.MoveVideoPath":
        return command.execute = this.commandMoveVideoPath;
      case "gs.TintVideo":
        return command.execute = this.commandTintVideo;
      case "gs.FlashVideo":
        return command.execute = this.commandFlashVideo;
      case "gs.CropVideo":
        return command.execute = this.commandCropVideo;
      case "gs.RotateVideo":
        return command.execute = this.commandRotateVideo;
      case "gs.ZoomVideo":
        return command.execute = this.commandZoomVideo;
      case "gs.BlendVideo":
        return command.execute = this.commandBlendVideo;
      case "gs.MaskVideo":
        return command.execute = this.commandMaskVideo;
      case "gs.VideoEffect":
        return command.execute = this.commandVideoEffect;
      case "gs.VideoMotionBlur":
        return command.execute = this.commandVideoMotionBlur;
      case "gs.VideoDefaults":
        return command.execute = this.commandVideoDefaults;
      case "gs.EraseVideo":
        return command.execute = this.commandEraseVideo;
      case "gs.ShowImageMap":
        return command.execute = this.commandShowImageMap;
      case "gs.EraseImageMap":
        return command.execute = this.commandEraseImageMap;
      case "gs.AddHotspot":
        return command.execute = this.commandAddHotspot;
      case "gs.EraseHotspot":
        return command.execute = this.commandEraseHotspot;
      case "gs.ChangeHotspotState":
        return command.execute = this.commandChangeHotspotState;
      case "gs.ShowPicture":
        return command.execute = this.commandShowPicture;
      case "gs.MovePicture":
        return command.execute = this.commandMovePicture;
      case "gs.MovePicturePath":
        return command.execute = this.commandMovePicturePath;
      case "gs.TintPicture":
        return command.execute = this.commandTintPicture;
      case "gs.FlashPicture":
        return command.execute = this.commandFlashPicture;
      case "gs.CropPicture":
        return command.execute = this.commandCropPicture;
      case "gs.RotatePicture":
        return command.execute = this.commandRotatePicture;
      case "gs.ZoomPicture":
        return command.execute = this.commandZoomPicture;
      case "gs.BlendPicture":
        return command.execute = this.commandBlendPicture;
      case "gs.ShakePicture":
        return command.execute = this.commandShakePicture;
      case "gs.MaskPicture":
        return command.execute = this.commandMaskPicture;
      case "gs.PictureEffect":
        return command.execute = this.commandPictureEffect;
      case "gs.PictureMotionBlur":
        return command.execute = this.commandPictureMotionBlur;
      case "gs.PictureDefaults":
        return command.execute = this.commandPictureDefaults;
      case "gs.PlayPictureAnimation":
        return command.execute = this.commandPlayPictureAnimation;
      case "gs.ErasePicture":
        return command.execute = this.commandErasePicture;
      case "gs.InputNumber":
        return command.execute = this.commandInputNumber;
      case "vn.Choice":
        return command.execute = this.commandShowChoice;
      case "vn.ChoiceTimer":
        return command.execute = this.commandChoiceTimer;
      case "vn.ShowChoices":
        return command.execute = this.commandShowChoices;
      case "vn.UnlockCG":
        return command.execute = this.commandUnlockCG;
      case "vn.L2DJoinScene":
        return command.execute = this.commandL2DJoinScene;
      case "vn.L2DExitScene":
        return command.execute = this.commandL2DExitScene;
      case "vn.L2DMotion":
        return command.execute = this.commandL2DMotion;
      case "vn.L2DMotionGroup":
        return command.execute = this.commandL2DMotionGroup;
      case "vn.L2DExpression":
        return command.execute = this.commandL2DExpression;
      case "vn.L2DMove":
        return command.execute = this.commandL2DMove;
      case "vn.L2DParameter":
        return command.execute = this.commandL2DParameter;
      case "vn.L2DSettings":
        return command.execute = this.commandL2DSettings;
      case "vn.L2DDefaults":
        return command.execute = this.commandL2DDefaults;
      case "vn.CharacterJoinScene":
        return command.execute = this.commandCharacterJoinScene;
      case "vn.CharacterExitScene":
        return command.execute = this.commandCharacterExitScene;
      case "vn.CharacterChangeExpression":
        return command.execute = this.commandCharacterChangeExpression;
      case "vn.CharacterSetParameter":
        return command.execute = this.commandCharacterSetParameter;
      case "vn.CharacterGetParameter":
        return command.execute = this.commandCharacterGetParameter;
      case "vn.CharacterDefaults":
        return command.execute = this.commandCharacterDefaults;
      case "vn.CharacterEffect":
        return command.execute = this.commandCharacterEffect;
      case "vn.ZoomCharacter":
        return command.execute = this.commandZoomCharacter;
      case "vn.RotateCharacter":
        return command.execute = this.commandRotateCharacter;
      case "vn.BlendCharacter":
        return command.execute = this.commandBlendCharacter;
      case "vn.ShakeCharacter":
        return command.execute = this.commandShakeCharacter;
      case "vn.MaskCharacter":
        return command.execute = this.commandMaskCharacter;
      case "vn.MoveCharacter":
        return command.execute = this.commandMoveCharacter;
      case "vn.MoveCharacterPath":
        return command.execute = this.commandMoveCharacterPath;
      case "vn.FlashCharacter":
        return command.execute = this.commandFlashCharacter;
      case "vn.TintCharacter":
        return command.execute = this.commandTintCharacter;
      case "vn.CharacterMotionBlur":
        return command.execute = this.commandCharacterMotionBlur;
      case "vn.ChangeBackground":
        return command.execute = this.commandChangeBackground;
      case "vn.ShakeBackground":
        return command.execute = this.commandShakeBackground;
      case "vn.ScrollBackground":
        return command.execute = this.commandScrollBackground;
      case "vn.ScrollBackgroundTo":
        return command.execute = this.commandScrollBackgroundTo;
      case "vn.ScrollBackgroundPath":
        return command.execute = this.commandScrollBackgroundPath;
      case "vn.ZoomBackground":
        return command.execute = this.commandZoomBackground;
      case "vn.RotateBackground":
        return command.execute = this.commandRotateBackground;
      case "vn.TintBackground":
        return command.execute = this.commandTintBackground;
      case "vn.BlendBackground":
        return command.execute = this.commandBlendBackground;
      case "vn.MaskBackground":
        return command.execute = this.commandMaskBackground;
      case "vn.BackgroundMotionBlur":
        return command.execute = this.commandBackgroundMotionBlur;
      case "vn.BackgroundEffect":
        return command.execute = this.commandBackgroundEffect;
      case "vn.BackgroundDefaults":
        return command.execute = this.commandBackgroundDefaults;
      case "vn.ChangeScene":
        return command.execute = this.commandChangeScene;
      case "vn.ReturnToPreviousScene":
        return command.execute = this.commandReturnToPreviousScene;
      case "vn.CallScene":
        return command.execute = this.commandCallScene;
      case "vn.SwitchToLayout":
        return command.execute = this.commandSwitchToLayout;
      case "gs.ChangeTransition":
        return command.execute = this.commandChangeTransition;
      case "gs.ChangeWindowSkin":
        return command.execute = this.commandChangeWindowSkin;
      case "gs.ChangeScreenTransitions":
        return command.execute = this.commandChangeScreenTransitions;
      case "vn.UIAccess":
        return command.execute = this.commandUIAccess;
      case "gs.PlayVideo":
        return command.execute = this.commandPlayVideo;
      case "gs.PlayMusic":
        return command.execute = this.commandPlayMusic;
      case "gs.StopMusic":
        return command.execute = this.commandStopMusic;
      case "gs.PlaySound":
        return command.execute = this.commandPlaySound;
      case "gs.StopSound":
        return command.execute = this.commandStopSound;
      case "gs.PauseMusic":
        return command.execute = this.commandPauseMusic;
      case "gs.ResumeMusic":
        return command.execute = this.commandResumeMusic;
      case "gs.AudioDefaults":
        return command.execute = this.commandAudioDefaults;
      case "gs.EndCommonEvent":
        return command.execute = this.commandEndCommonEvent;
      case "gs.ResumeCommonEvent":
        return command.execute = this.commandResumeCommonEvent;
      case "gs.CallCommonEvent":
        return command.execute = this.commandCallCommonEvent;
      case "gs.ChangeTimer":
        return command.execute = this.commandChangeTimer;
      case "gs.ShowText":
        return command.execute = this.commandShowText;
      case "gs.RefreshText":
        return command.execute = this.commandRefreshText;
      case "gs.TextMotionBlur":
        return command.execute = this.commandTextMotionBlur;
      case "gs.MoveText":
        return command.execute = this.commandMoveText;
      case "gs.MoveTextPath":
        return command.execute = this.commandMoveTextPath;
      case "gs.RotateText":
        return command.execute = this.commandRotateText;
      case "gs.ZoomText":
        return command.execute = this.commandZoomText;
      case "gs.BlendText":
        return command.execute = this.commandBlendText;
      case "gs.ColorText":
        return command.execute = this.commandColorText;
      case "gs.EraseText":
        return command.execute = this.commandEraseText;
      case "gs.TextEffect":
        return command.execute = this.commandTextEffect;
      case "gs.TextDefaults":
        return command.execute = this.commandTextDefaults;
      case "gs.ChangeTextSettings":
        return command.execute = this.commandChangeTextSettings;
      case "gs.InputText":
        return command.execute = this.commandInputText;
      case "gs.InputName":
        return command.execute = this.commandInputName;
      case "gs.SavePersistentData":
        return command.execute = this.commandSavePersistentData;
      case "gs.SaveSettings":
        return command.execute = this.commandSaveSettings;
      case "gs.PrepareSaveGame":
        return command.execute = this.commandPrepareSaveGame;
      case "gs.SaveGame":
        return command.execute = this.commandSaveGame;
      case "gs.LoadGame":
        return command.execute = this.commandLoadGame;
      case "gs.GetInputData":
        return command.execute = this.commandGetInputData;
      case "gs.WaitForInput":
        return command.execute = this.commandWaitForInput;
      case "gs.ChangeObjectDomain":
        return command.execute = this.commandChangeObjectDomain;
      case "vn.GetGameData":
        return command.execute = this.commandGetGameData;
      case "vn.SetGameData":
        return command.execute = this.commandSetGameData;
      case "vn.GetObjectData":
        return command.execute = this.commandGetObjectData;
      case "vn.SetObjectData":
        return command.execute = this.commandSetObjectData;
      case "vn.ChangeSounds":
        return command.execute = this.commandChangeSounds;
      case "vn.ChangeColors":
        return command.execute = this.commandChangeColors;
      case "gs.ChangeScreenCursor":
        return command.execute = this.commandChangeScreenCursor;
      case "gs.ResetGlobalData":
        return command.execute = this.commandResetGlobalData;
      case "gs.Script":
        return command.execute = this.commandScript;
    }
  };


  /**
  * Executes the command at the specified index and increases the command-pointer.
  *
  * @method executeCommand
   */

  Component_CommandInterpreter.prototype.executeCommand = function(index) {
    var indent;
    this.command = this.object.commands[index];
    if (this.previewData) {
      if (this.previewData.uid && this.previewData.uid !== this.command.uid) {
        GameManager.tempSettings.skip = true;
        GameManager.tempSettings.skipTime = 0;
      } else if (this.pointer < this.previewData.pointer) {
        GameManager.tempSettings.skip = true;
        GameManager.tempSettings.skipTime = 0;
      } else {
        GameManager.tempSettings.skip = this.previewData.settings.animationDisabled;
        GameManager.tempSettings.skipTime = 0;
        this.previewInfo.waiting = true;
        gs.GlobalEventManager.emit("previewWaiting");
        if (this.previewData.settings.animationDisabled || this.previewData.settings.animationTime > 0) {
          this.previewInfo.timeout = setTimeout((function() {
            return Graphics.stopped = true;
          }), this.previewData.settings.animationTime * 1000);
        }
      }
    }
    if (this.command.execute != null) {
      this.command.interpreter = this;
      if (this.command.indent === this.indent) {
        this.command.execute();
      }
      this.pointer++;
      this.command = this.object.commands[this.pointer];
      if (this.command != null) {
        indent = this.command.indent;
      } else {
        indent = this.indent;
        while (indent > 0 && (this.loops[indent] == null)) {
          indent--;
        }
      }
      if (indent < this.indent) {
        this.indent = indent;
        if (this.loops[this.indent] != null) {
          this.pointer = this.loops[this.indent];
          this.command = this.object.commands[this.pointer];
          return this.command.interpreter = this;
        }
      }
    } else {
      this.assignCommand(this.command);
      if (this.command.execute != null) {
        this.command.interpreter = this;
        if (this.command.indent === this.indent) {
          this.command.execute();
        }
        this.pointer++;
        this.command = this.object.commands[this.pointer];
        if (this.command != null) {
          indent = this.command.indent;
        } else {
          indent = this.indent;
          while (indent > 0 && (this.loops[indent] == null)) {
            indent--;
          }
        }
        if (indent < this.indent) {
          this.indent = indent;
          if (this.loops[this.indent] != null) {
            this.pointer = this.loops[this.indent];
            this.command = this.object.commands[this.pointer];
            return this.command.interpreter = this;
          }
        }
      } else {
        return this.pointer++;
      }
    }
  };


  /**
  * Skips all commands until a command with the specified indent-level is 
  * found. So for example: To jump from a Condition-Command to the next
  * Else-Command just pass the indent-level of the Condition/Else command.
  *
  * @method skip
  * @param {number} indent - The indent-level.
  * @param {boolean} backward - If true the skip runs backward.
   */

  Component_CommandInterpreter.prototype.skip = function(indent, backward) {
    var results, results1;
    if (backward) {
      this.pointer--;
      results = [];
      while (this.pointer > 0 && this.object.commands[this.pointer].indent !== indent) {
        results.push(this.pointer--);
      }
      return results;
    } else {
      this.pointer++;
      results1 = [];
      while (this.pointer < this.object.commands.length && this.object.commands[this.pointer].indent !== indent) {
        results1.push(this.pointer++);
      }
      return results1;
    }
  };


  /**
  * Halts the interpreter for the specified amount of time. An optionally
  * callback function can be passed which is called when the time is up.
  *
  * @method wait
  * @param {number} time - The time to wait
  * @param {gs.Callback} callback - Called if the wait time is up.
   */

  Component_CommandInterpreter.prototype.wait = function(time, callback) {
    this.isWaiting = true;
    this.waitCounter = time;
    return this.waitCallback = callback;
  };


  /**
  * Checks if the command at the specified pointer-index is a game message
  * related command.
  *
  * @method isMessageCommand
  * @param {number} pointer - The pointer/index.
  * @param {Object[]} commands - The list of commands to check.
  * @return {boolean} <b>true</b> if its a game message related command. Otherwise <b>false</b>.
   */

  Component_CommandInterpreter.prototype.isMessageCommand = function(pointer, commands) {
    var result;
    result = true;
    if (pointer >= commands.length || (commands[pointer].id !== "gs.InputNumber" && commands[pointer].id !== "vn.Choice" && commands[pointer].id !== "gs.InputText" && commands[pointer].id !== "gs.InputName")) {
      result = false;
    }
    return result;
  };


  /**
  * Checks if the command at the specified pointer-index asks for user-input like
  * the Input Number or Input Text command.
  *
  * @method isInputDataCommand
  * @param {number} pointer - The pointer/index.
  * @param {Object[]} commands - The list of commands to check.
  * @return {boolean} <b>true</b> if its an input-data command. Otherwise <b>false</b>
   */

  Component_CommandInterpreter.prototype.isInputDataCommand = function(pointer, commands) {
    return pointer < commands.length && (commands[pointer].id === "gs.InputNumber" || commands[pointer].id === "gs.InputText" || commands[pointer].id === "vn.Choice" || commands[pointer].id === "vn.ShowChoices");
  };


  /**
  * Checks if a game message is currently running by another interpreter like a
  * common-event interpreter.
  *
  * @method isProcessingMessageInOtherContext
  * @return {boolean} <b>true</b> a game message is running in another context. Otherwise <b>false</b>
   */

  Component_CommandInterpreter.prototype.isProcessingMessageInOtherContext = function() {
    var gm, result, s;
    result = false;
    gm = GameManager;
    s = SceneManager.scene;
    result = ((s.inputNumberWindow != null) && s.inputNumberWindow.visible && s.inputNumberWindow.executionContext !== this.context) || ((s.inputTextWindow != null) && s.inputTextWindow.active && s.inputTextWindow.executionContext !== this.context);
    return result;
  };


  /**
  * If a game message is currently running by an other interpreter like a common-event
  * interpreter, this method trigger a wait until the other interpreter is finished
  * with the game message.
  *
  * @method waitForMessage
  * @return {boolean} <b>true</b> a game message is running in another context. Otherwise <b>false</b>
   */

  Component_CommandInterpreter.prototype.waitForMessage = function() {
    this.isWaitingForMessage = true;
    this.isWaiting = true;
    return this.pointer--;
  };


  /**
  * Gets the value the number variable at the specified index.
  *
  * @method numberValueAtIndex
  * @param {number} scope - The variable's scope.
  * @param {number} index - The index of the variable to get the value from.
  * @return {Number} The value of the variable.
   */

  Component_CommandInterpreter.prototype.numberValueAtIndex = function(scope, index, domain) {
    return GameManager.variableStore.numberValueAtIndex(scope, index, domain);
  };


  /**
  * Gets the value of a (possible) number variable. If a constant number value is specified, this method
  * does nothing an just returns that constant value. That's to make it more comfortable to just pass a value which
  * can be calculated by variable but also be just a constant value.
  *
  * @method numberValueOf
  * @param {number|Object} object - A number variable or constant number value.
  * @return {Number} The value of the variable.
   */

  Component_CommandInterpreter.prototype.numberValueOf = function(object) {
    return GameManager.variableStore.numberValueOf(object);
  };


  /**
  * It does the same like <b>numberValueOf</b> with one difference: If the specified object
  * is a variable, it's value is considered as a duration-value in milliseconds and automatically converted
  * into frames.
  *
  * @method durationValueOf
  * @param {number|Object} object - A number variable or constant number value.
  * @return {Number} The value of the variable.
   */

  Component_CommandInterpreter.prototype.durationValueOf = function(object) {
    if (object && (object.index != null)) {
      return Math.round(GameManager.variableStore.numberValueOf(object) / 1000 * Graphics.frameRate);
    } else {
      return Math.round(GameManager.variableStore.numberValueOf(object));
    }
  };


  /**
  * Gets a position ({x, y}) for the specified predefined object position configured in 
  * Database - System.
  *
  * @method predefinedObjectPosition
  * @param {number} position - The index/ID of the predefined object position to set.
  * @param {gs.Object_Base} object - The game object to set the position for.
  * @param {Object} params - The params object of the scene command.
  * @return {Object} The position {x, y}.
   */

  Component_CommandInterpreter.prototype.predefinedObjectPosition = function(position, object, params) {
    var objectPosition;
    objectPosition = RecordManager.system.objectPositions[position];
    if (!objectPosition) {
      return {
        x: 0,
        y: 0
      };
    }
    return objectPosition.func.call(null, object, params) || {
      x: 0,
      y: 0
    };
  };


  /**
  * Sets the value of a number variable at the specified index.
  *
  * @method setNumberValueAtIndex
  * @param {number} scope - The variable's scope.
  * @param {number} index - The index of the variable to set.
  * @param {number} value - The number value to set the variable to.
   */

  Component_CommandInterpreter.prototype.setNumberValueAtIndex = function(scope, index, value, domain) {
    return GameManager.variableStore.setNumberValueAtIndex(scope, index, value, domain);
  };


  /**
  * Sets the value of a number variable.
  *
  * @method setNumberValueTo
  * @param {number} variable - The variable to set.
  * @param {number} value - The number value to set the variable to.
   */

  Component_CommandInterpreter.prototype.setNumberValueTo = function(variable, value) {
    return GameManager.variableStore.setNumberValueTo(variable, value);
  };


  /**
  * Sets the value of a list variable.
  *
  * @method setListObjectTo
  * @param {Object} variable - The variable to set.
  * @param {Object} value - The list object to set the variable to.
   */

  Component_CommandInterpreter.prototype.setListObjectTo = function(variable, value) {
    return GameManager.variableStore.setListObjectTo(variable, value);
  };


  /**
  * Sets the value of a boolean/switch variable.
  *
  * @method setBooleanValueTo
  * @param {Object} variable - The variable to set.
  * @param {boolean} value - The boolean value to set the variable to.
   */

  Component_CommandInterpreter.prototype.setBooleanValueTo = function(variable, value) {
    return GameManager.variableStore.setBooleanValueTo(variable, value);
  };


  /**
  * Sets the value of a number variable at the specified index.
  *
  * @method setBooleanValueAtIndex
  * @param {number} scope - The variable's scope.
  * @param {number} index - The index of the variable to set.
  * @param {boolean} value - The boolean value to set the variable to.
   */

  Component_CommandInterpreter.prototype.setBooleanValueAtIndex = function(scope, index, value, domain) {
    return GameManager.variableStore.setBooleanValueAtIndex(scope, index, value, domain);
  };


  /**
  * Sets the value of a string/text variable.
  *
  * @method setStringValueTo
  * @param {Object} variable - The variable to set.
  * @param {string} value - The string/text value to set the variable to.
   */

  Component_CommandInterpreter.prototype.setStringValueTo = function(variable, value) {
    return GameManager.variableStore.setStringValueTo(variable, value);
  };


  /**
  * Sets the value of the string variable at the specified index.
  *
  * @method setStringValueAtIndex
  * @param {number} scope - The variable scope.
  * @param {number} index - The variable's index.
  * @param {string} value - The value to set.
   */

  Component_CommandInterpreter.prototype.setStringValueAtIndex = function(scope, index, value, domain) {
    return GameManager.variableStore.setStringValueAtIndex(scope, index, value, domain);
  };


  /**
  * Gets the value of a (possible) string variable. If a constant string value is specified, this method
  * does nothing an just returns that constant value. That's to make it more comfortable to just pass a value which
  * can be calculated by variable but also be just a constant value.
  *
  * @method stringValueOf
  * @param {string|Object} object - A string variable or constant string value.
  * @return {string} The value of the variable.
   */

  Component_CommandInterpreter.prototype.stringValueOf = function(object) {
    return GameManager.variableStore.stringValueOf(object);
  };


  /**
  * Gets the value of the string variable at the specified index.
  *
  * @method stringValueAtIndex
  * @param {number} scope - The variable's scope.
  * @param {number} index - The index of the variable to get the value from.
  * @return {string} The value of the variable.
   */

  Component_CommandInterpreter.prototype.stringValueAtIndex = function(scope, index, domain) {
    return GameManager.variableStore.stringValueAtIndex(scope, index, domain);
  };


  /**
  * Gets the value of a (possible) boolean variable. If a constant boolean value is specified, this method
  * does nothing an just returns that constant value. That's to make it more comfortable to just pass a value which
  * can be calculated by variable but also be just a constant value.
  *
  * @method booleanValueOf
  * @param {boolean|Object} object - A boolean variable or constant boolean value.
  * @return {boolean} The value of the variable.
   */

  Component_CommandInterpreter.prototype.booleanValueOf = function(object) {
    return GameManager.variableStore.booleanValueOf(object);
  };


  /**
  * Gets the value of the boolean variable at the specified index.
  *
  * @method booleanValueAtIndex
  * @param {number} scope - The variable's scope.
  * @param {number} index - The index of the variable to get the value from.
  * @return {string} The value of the variable.
   */

  Component_CommandInterpreter.prototype.booleanValueAtIndex = function(scope, index, domain) {
    return GameManager.variableStore.booleanValueAtIndex(scope, index, domain);
  };


  /**
  * Gets the value of a (possible) list variable.
  *
  * @method listObjectOf
  * @param {Object} object - A list variable.
  * @return {Object} The value of the list variable.
   */

  Component_CommandInterpreter.prototype.listObjectOf = function(object) {
    return GameManager.variableStore.listObjectOf(object);
  };


  /**
  * Compares two object using the specified operation and returns the result.
  *
  * @method compare
  * @param {Object} a - Object A.
  * @param {Object} b - Object B.
  * @param {number} operation - The compare-operation to compare Object A with Object B.
  * <ul>
  * <li>0 = Equal To</li>
  * <li>1 = Not Equal To</li>
  * <li>2 = Greater Than</li>
  * <li>3 = Greater or Equal To</li>
  * <li>4 = Less Than</li>
  * <li>5 = Less or Equal To</li>
  * </ul>
  * @return {boolean} The comparison result.
   */

  Component_CommandInterpreter.prototype.compare = function(a, b, operation) {
    switch (operation) {
      case 0:
        return a == b;
      case 1:
        return a != b;
      case 2:
        return a > b;
      case 3:
        return a >= b;
      case 4:
        return a < b;
      case 5:
        return a <= b;
    }
  };


  /**
  * Changes number variables and allows decimal values such as 0.5 too.
  *
  * @method changeDecimalVariables
  * @param {Object} params - Input params from the command
  * @param {Object} roundMethod - The result of the operation will be rounded using the specified method.
  * <ul>
  * <li>0 = None. The result will not be rounded.</li>
  * <li>1 = Commercially</li>
  * <li>2 = Round Up</li>
  * <li>3 = Round Down</li>
  * </ul>
   */

  Component_CommandInterpreter.prototype.changeDecimalVariables = function(params, roundMethod) {
    var diff, end, i, index, k, ref, ref1, roundFunc, scope, source, start;
    source = 0;
    roundFunc = null;
    switch (roundMethod) {
      case 0:
        roundFunc = function(value) {
          return value;
        };
        break;
      case 1:
        roundFunc = function(value) {
          return Math.round(value);
        };
        break;
      case 2:
        roundFunc = function(value) {
          return Math.ceil(value);
        };
        break;
      case 3:
        roundFunc = function(value) {
          return Math.floor(value);
        };
    }
    switch (params.source) {
      case 0:
        source = this.numberValueOf(params.sourceValue);
        break;
      case 1:
        start = this.numberValueOf(params.sourceRandom.start);
        end = this.numberValueOf(params.sourceRandom.end);
        diff = end - start;
        source = Math.floor(start + Math.random() * (diff + 1));
        break;
      case 2:
        source = this.numberValueAtIndex(params.sourceScope, this.numberValueOf(params.sourceReference) - 1, params.sourceReferenceDomain);
        break;
      case 3:
        source = this.numberValueOfGameData(params.sourceValue1);
        break;
      case 4:
        source = this.numberValueOfDatabaseData(params.sourceValue1);
    }
    switch (params.target) {
      case 0:
        switch (params.operation) {
          case 0:
            this.setNumberValueTo(params.targetVariable, roundFunc(source));
            break;
          case 1:
            this.setNumberValueTo(params.targetVariable, roundFunc(this.numberValueOf(params.targetVariable) + source));
            break;
          case 2:
            this.setNumberValueTo(params.targetVariable, roundFunc(this.numberValueOf(params.targetVariable) - source));
            break;
          case 3:
            this.setNumberValueTo(params.targetVariable, roundFunc(this.numberValueOf(params.targetVariable) * source));
            break;
          case 4:
            this.setNumberValueTo(params.targetVariable, roundFunc(this.numberValueOf(params.targetVariable) / source));
            break;
          case 5:
            this.setNumberValueTo(params.targetVariable, this.numberValueOf(params.targetVariable) % source);
        }
        break;
      case 1:
        scope = params.targetScope;
        start = params.targetRange.start - 1;
        end = params.targetRange.end - 1;
        for (i = k = ref = start, ref1 = end; ref <= ref1 ? k <= ref1 : k >= ref1; i = ref <= ref1 ? ++k : --k) {
          switch (params.operation) {
            case 0:
              this.setNumberValueAtIndex(scope, i, roundFunc(source));
              break;
            case 1:
              this.setNumberValueAtIndex(scope, i, roundFunc(this.numberValueAtIndex(scope, i) + source));
              break;
            case 2:
              this.setNumberValueAtIndex(scope, i, roundFunc(this.numberValueAtIndex(scope, i) - source));
              break;
            case 3:
              this.setNumberValueAtIndex(scope, i, roundFunc(this.numberValueAtIndex(scope, i) * source));
              break;
            case 4:
              this.setNumberValueAtIndex(scope, i, roundFunc(this.numberValueAtIndex(scope, i) / source));
              break;
            case 5:
              this.setNumberValueAtIndex(scope, i, this.numberValueAtIndex(scope, i) % source);
          }
        }
        break;
      case 2:
        index = this.numberValueOf(params.targetReference) - 1;
        switch (params.operation) {
          case 0:
            this.setNumberValueAtIndex(params.targetScope, index, roundFunc(source), params.targetReferenceDomain);
            break;
          case 1:
            this.setNumberValueAtIndex(params.targetScope, index, roundFunc(this.numberValueAtIndex(params.targetScope, index, params.targetReferenceDomain) + source), params.targetReferenceDomain);
            break;
          case 2:
            this.setNumberValueAtIndex(params.targetScope, index, roundFunc(this.numberValueAtIndex(params.targetScope, index, params.targetReferenceDomain) - source), params.targetReferenceDomain);
            break;
          case 3:
            this.setNumberValueAtIndex(params.targetScope, index, roundFunc(this.numberValueAtIndex(params.targetScope, index, params.targetReferenceDomain) * source), params.targetReferenceDomain);
            break;
          case 4:
            this.setNumberValueAtIndex(params.targetScope, index, roundFunc(this.numberValueAtIndex(params.targetScope, index, params.targetReferenceDomain) / source), params.targetReferenceDomain);
            break;
          case 5:
            this.setNumberValueAtIndex(params.targetScope, index, this.numberValueAtIndex(params.targetScope, index, params.targetReferenceDomain) % source, params.targetReferenceDomain);
        }
    }
    return null;
  };


  /**
  * Shakes a game object.
  *
  * @method shakeObject
  * @param {gs.Object_Base} object - The game object to shake.
  * @return {Object} A params object containing additional info about the shake-animation.
   */

  Component_CommandInterpreter.prototype.shakeObject = function(object, params) {
    var duration, easing;
    duration = Math.max(Math.round(this.durationValueOf(params.duration)), 2);
    easing = gs.Easings.fromObject(params.easing);
    object.animator.shake({
      x: this.numberValueOf(params.range.x),
      y: this.numberValueOf(params.range.y)
    }, this.numberValueOf(params.speed) / 100, duration, easing);
    if (params.waitForCompletion && !(duration === 0 || this.isInstantSkip())) {
      this.isWaiting = true;
      return this.waitCounter = duration;
    }
  };


  /**
  * Lets the interpreter wait for the completion of a running operation like an animation, etc.
  *
  * @method waitForCompletion
  * @param {gs.Object_Base} object - The game object the operation is executed on. Can be <b>null</b>.
  * @return {Object} A params object containing additional info.
   */

  Component_CommandInterpreter.prototype.waitForCompletion = function(object, params) {
    var duration;
    duration = this.durationValueOf(params.duration);
    if (params.waitForCompletion && !(duration === 0 || this.isInstantSkip())) {
      this.isWaiting = true;
      return this.waitCounter = duration;
    }
  };


  /**
  * Erases a game object.
  *
  * @method eraseObject
  * @param {gs.Object_Base} object - The game object to erase.
  * @return {Object} A params object containing additional info.
   */

  Component_CommandInterpreter.prototype.eraseObject = function(object, params, callback) {
    var duration, easing;
    easing = gs.Easings.fromObject(params.easing);
    duration = this.durationValueOf(params.duration);
    object.animator.disappear(params.animation, easing, duration, (function(_this) {
      return function(sender) {
        sender.dispose();
        return typeof callback === "function" ? callback(sender) : void 0;
      };
    })(this));
    if (params.waitForCompletion && !(duration === 0 || this.isInstantSkip())) {
      this.isWaiting = true;
      return this.waitCounter = duration;
    }
  };


  /**
  * Shows a game object on screen.
  *
  * @method showObject
  * @param {gs.Object_Base} object - The game object to show.
  * @param {gs.Point} position - The position where the game object should be shown.
  * @param {Object} A params object containing additional info.
   */

  Component_CommandInterpreter.prototype.showObject = function(object, position, params) {
    var duration, easing, x, y;
    x = this.numberValueOf(position.x);
    y = this.numberValueOf(position.y);
    easing = gs.Easings.fromObject(params.easing);
    duration = this.durationValueOf(params.duration);
    object.animator.appear(x, y, params.animation, easing, duration);
    if (params.waitForCompletion && !(duration === 0 || this.isInstantSkip())) {
      this.isWaiting = true;
      return this.waitCounter = duration;
    }
  };


  /**
  * Moves a game object.
  *
  * @method moveObject
  * @param {gs.Object_Base} object - The game object to move.
  * @param {gs.Point} position - The position to move the game object to.
  * @param {Object} A params object containing additional info.
   */

  Component_CommandInterpreter.prototype.moveObject = function(object, position, params) {
    var duration, easing, p, x, y;
    if (params.positionType === 0) {
      p = this.predefinedObjectPosition(params.predefinedPositionId, object, params);
      x = p.x;
      y = p.y;
    } else {
      x = this.numberValueOf(position.x);
      y = this.numberValueOf(position.y);
    }
    easing = gs.Easings.fromObject(params.easing);
    duration = this.durationValueOf(params.duration);
    object.animator.moveTo(x, y, duration, easing);
    if (params.waitForCompletion && !(duration === 0 || this.isInstantSkip())) {
      this.isWaiting = true;
      return this.waitCounter = duration;
    }
  };


  /**
  * Moves a game object along a path.
  *
  * @method moveObjectPath
  * @param {gs.Object_Base} object - The game object to move.
  * @param {Object} path - The path to move the game object along.
  * @param {Object} A params object containing additional info.
   */

  Component_CommandInterpreter.prototype.moveObjectPath = function(object, path, params) {
    var duration, easing, ref;
    easing = gs.Easings.fromObject(params.easing);
    duration = this.durationValueOf(params.duration);
    object.animator.movePath(path.data, params.loopType, duration, easing, (ref = path.effects) != null ? ref.data : void 0);
    if (params.waitForCompletion && !(duration === 0 || this.isInstantSkip())) {
      this.isWaiting = true;
      return this.waitCounter = duration;
    }
  };


  /**
  * Scrolls a scrollable game object along a path.
  *
  * @method scrollObjectPath
  * @param {gs.Object_Base} object - The game object to scroll.
  * @param {Object} path - The path to scroll the game object along.
  * @param {Object} A params object containing additional info.
   */

  Component_CommandInterpreter.prototype.scrollObjectPath = function(object, path, params) {
    var duration, easing;
    easing = gs.Easings.fromObject(params.easing);
    duration = this.durationValueOf(params.duration);
    object.animator.scrollPath(path, params.loopType, duration, easing);
    if (params.waitForCompletion && !(duration === 0 || this.isInstantSkip())) {
      this.isWaiting = true;
      return this.waitCounter = duration;
    }
  };


  /**
  * Zooms/Scales a game object.
  *
  * @method zoomObject
  * @param {gs.Object_Base} object - The game object to zoom.
  * @param {Object} A params object containing additional info.
   */

  Component_CommandInterpreter.prototype.zoomObject = function(object, params) {
    var duration, easing;
    easing = gs.Easings.fromObject(params.easing);
    duration = this.durationValueOf(params.duration);
    object.animator.zoomTo(this.numberValueOf(params.zooming.x) / 100, this.numberValueOf(params.zooming.y) / 100, duration, easing);
    if (params.waitForCompletion && !(duration === 0 || this.isInstantSkip())) {
      this.isWaiting = true;
      return this.waitCounter = duration;
    }
  };


  /**
  * Rotates a game object.
  *
  * @method rotateObject
  * @param {gs.Object_Base} object - The game object to rotate.
  * @param {Object} A params object containing additional info.
   */

  Component_CommandInterpreter.prototype.rotateObject = function(object, params) {
    var duration, easing;
    easing = gs.Easings.fromObject(params.easing);
    duration = this.durationValueOf(params.duration);
    easing = gs.Easings.fromObject(params.easing);
    object.animator.rotate(params.direction, this.numberValueOf(params.speed) / 100, duration, easing);
    if (params.waitForCompletion && !(duration === 0 || this.isInstantSkip())) {
      this.isWaiting = true;
      return this.waitCounter = duration;
    }
  };


  /**
  * Blends a game object.
  *
  * @method blendObject
  * @param {gs.Object_Base} object - The game object to blend.
  * @param {Object} A params object containing additional info.
   */

  Component_CommandInterpreter.prototype.blendObject = function(object, params) {
    var duration, easing;
    easing = gs.Easings.fromObject(params.easing);
    duration = this.durationValueOf(params.duration);
    object.animator.blendTo(this.numberValueOf(params.opacity), duration, easing);
    if (params.waitForCompletion && !(duration === 0 || this.isInstantSkip())) {
      this.isWaiting = true;
      return this.waitCounter = duration;
    }
  };


  /**
  * Executes a masking-effect on a game object..
  *
  * @method maskObject
  * @param {gs.Object_Base} object - The game object to execute a masking-effect on.
  * @param {Object} A params object containing additional info.
   */

  Component_CommandInterpreter.prototype.maskObject = function(object, params) {
    var duration, easing, ref, ref1, ref2;
    easing = gs.Easings.fromObject(params.easing);
    if (params.mask.type === 0) {
      object.mask.type = 0;
      object.mask.ox = this.numberValueOf(params.mask.ox);
      object.mask.oy = this.numberValueOf(params.mask.oy);
      if (((ref = object.mask.source) != null ? ref.videoElement : void 0) != null) {
        object.mask.source.pause();
      }
      if (params.mask.sourceType === 0) {
        object.mask.source = ResourceManager.getBitmap("Graphics/Masks/" + ((ref1 = params.mask.graphic) != null ? ref1.name : void 0));
      } else {
        object.mask.source = ResourceManager.getVideo("Movies/" + ((ref2 = params.mask.video) != null ? ref2.name : void 0));
        if (object.mask.source) {
          object.mask.source.play();
          object.mask.source.loop = true;
        }
      }
    } else {
      duration = this.durationValueOf(params.duration);
      object.animator.maskTo(params.mask, duration, easing);
    }
    if (params.waitForCompletion && !(duration === 0 || this.isInstantSkip())) {
      this.isWaiting = true;
      return this.waitCounter = duration;
    }
  };


  /**
  * Tints a game object.
  *
  * @method tintObject
  * @param {gs.Object_Base} object - The game object to tint.
  * @param {Object} A params object containing additional info.
   */

  Component_CommandInterpreter.prototype.tintObject = function(object, params) {
    var duration, easing;
    duration = this.durationValueOf(params.duration);
    easing = gs.Easings.fromObject(params.easing);
    object.animator.tintTo(params.tone, duration, easing);
    if (params.waitForCompletion && !(duration === 0 || this.isInstantSkip())) {
      this.isWaiting = true;
      return this.waitCounter = duration;
    }
  };


  /**
  * Flashes a game object.
  *
  * @method flashObject
  * @param {gs.Object_Base} object - The game object to flash.
  * @param {Object} A params object containing additional info.
   */

  Component_CommandInterpreter.prototype.flashObject = function(object, params) {
    var duration;
    duration = this.durationValueOf(params.duration);
    object.animator.flash(new Color(params.color), duration);
    if (params.waitForCompletion && !(duration === 0 || this.isInstantSkip())) {
      this.isWaiting = true;
      return this.waitCounter = duration;
    }
  };


  /**
  * Cropes a game object.
  *
  * @method cropObject
  * @param {gs.Object_Base} object - The game object to crop.
  * @param {Object} A params object containing additional info.
   */

  Component_CommandInterpreter.prototype.cropObject = function(object, params) {
    object.srcRect.x = this.numberValueOf(params.x);
    object.srcRect.y = this.numberValueOf(params.y);
    object.srcRect.width = this.numberValueOf(params.width);
    object.srcRect.height = this.numberValueOf(params.height);
    object.dstRect.width = this.numberValueOf(params.width);
    return object.dstRect.height = this.numberValueOf(params.height);
  };


  /**
  * Sets the motion blur settings of a game object.
  *
  * @method objectMotionBlur
  * @param {gs.Object_Base} object - The game object to set the motion blur settings for.
  * @param {Object} A params object containing additional info.
   */

  Component_CommandInterpreter.prototype.objectMotionBlur = function(object, params) {
    return object.motionBlur.set(params.motionBlur);
  };


  /**
  * Enables an effect on a game object.
  *
  * @method objectEffect
  * @param {gs.Object_Base} object - The game object to execute a masking-effect on.
  * @param {Object} A params object containing additional info.
   */

  Component_CommandInterpreter.prototype.objectEffect = function(object, params) {
    var duration, easing, wobble;
    duration = this.durationValueOf(params.duration);
    easing = gs.Easings.fromObject(params.easing);
    switch (params.type) {
      case 0:
        object.animator.wobbleTo(params.wobble.power / 10000, params.wobble.speed / 100, duration, easing);
        wobble = object.effects.wobble;
        wobble.enabled = params.wobble.power > 0;
        wobble.vertical = params.wobble.orientation === 0 || params.wobble.orientation === 2;
        wobble.horizontal = params.wobble.orientation === 1 || params.wobble.orientation === 2;
        break;
      case 1:
        object.animator.blurTo(params.blur.power / 100, duration, easing);
        object.effects.blur.enabled = true;
        break;
      case 2:
        object.animator.pixelateTo(params.pixelate.size.width, params.pixelate.size.height, duration, easing);
        object.effects.pixelate.enabled = true;
    }
    if (params.waitForCompletion && duration !== 0) {
      this.isWaiting = true;
      return this.waitCounter = duration;
    }
  };


  /**
  * Executes an action like for a hotspot.
  *
  * @method executeAction
  * @param {Object} action - Action-Data.
  * @param {boolean} stateValue - In case of switch-binding, the switch is set to this value.
  * @param {number} bindValue - A number value which be put into the action's bind-value variable.
   */

  Component_CommandInterpreter.prototype.executeAction = function(action, stateValue, bindValue) {
    var domain, ref;
    switch (action.type) {
      case 0:
        if (action.labelIndex) {
          return this.pointer = action.labelIndex;
        } else {
          return this.jumpToLabel(action.label);
        }
        break;
      case 1:
        return this.callCommonEvent(action.commonEventId, null, this.isWaiting);
      case 2:
        domain = GameManager.variableStore.domain;
        return this.setBooleanValueTo(action["switch"], stateValue);
      case 3:
        return this.callScene((ref = action.scene) != null ? ref.uid : void 0);
      case 4:
        domain = GameManager.variableStore.domain;
        this.setNumberValueTo(action.bindValueVariable, bindValue);
        if (action.labelIndex) {
          return this.pointer = action.labelIndex;
        } else {
          return this.jumpToLabel(action.label);
        }
    }
  };


  /**
  * Calls a common event and returns the sub-interpreter for it.
  *
  * @method callCommonEvent
  * @param {number} id - The ID of the common event to call.
  * @param {Object} parameters - Optional common event parameters.
  * @param {boolean} wait - Indicates if the interpreter should be stay in waiting-mode even if the sub-interpreter is finished.
   */

  Component_CommandInterpreter.prototype.callCommonEvent = function(id, parameters, wait) {
    var commonEvent, ref;
    commonEvent = GameManager.commonEvents[id];
    if (commonEvent != null) {
      if (SceneManager.scene.commonEventContainer.subObjects.indexOf(commonEvent) === -1) {
        SceneManager.scene.commonEventContainer.addObject(commonEvent);
      }
      if ((ref = commonEvent.events) != null) {
        ref.on("finish", gs.CallBack("onCommonEventFinish", this), {
          waiting: wait
        });
      }
      this.subInterpreter = commonEvent.behavior.call(parameters || [], this.settings, this.context);
      commonEvent.behavior.update();
      if (this.subInterpreter != null) {
        this.isWaiting = true;
        this.subInterpreter.settings = this.settings;
        this.subInterpreter.start();
        return this.subInterpreter.update();
      }
    }
  };


  /**
  * Calls a scene and returns the sub-interpreter for it.
  *
  * @method callScene
  * @param {String} uid - The UID of the scene to call.
   */

  Component_CommandInterpreter.prototype.callScene = function(uid) {
    var object, sceneDocument;
    sceneDocument = DataManager.getDocument(uid);
    if (sceneDocument != null) {
      this.isWaiting = true;
      this.subInterpreter = new vn.Component_CallSceneInterpreter();
      object = {
        commands: sceneDocument.items.commands
      };
      this.subInterpreter.repeat = false;
      this.subInterpreter.context.set(sceneDocument.uid, sceneDocument);
      this.subInterpreter.object = object;
      this.subInterpreter.onFinish = gs.CallBack("onCallSceneFinish", this);
      this.subInterpreter.start();
      this.subInterpreter.settings = this.settings;
      return this.subInterpreter.update();
    }
  };


  /**
  * Calls a common event and returns the sub-interpreter for it.
  *
  * @method storeListValue
  * @param {number} id - The ID of the common event to call.
  * @param {Object} parameters - Optional common event parameters.
  * @param {boolean} wait - Indicates if the interpreter should be stay in waiting-mode even if the sub-interpreter is finished.
   */

  Component_CommandInterpreter.prototype.storeListValue = function(variable, list, value, valueType) {
    switch (valueType) {
      case 0:
        return this.setNumberValueTo(variable, (!isNaN(value) ? value : 0));
      case 1:
        return this.setBooleanValueTo(variable, (value ? 1 : 0));
      case 2:
        return this.setStringValueTo(variable, value.toString());
      case 3:
        return this.setListObjectTo(variable, (value.length != null ? value : []));
    }
  };


  /**
  * @method jumpToLabel
   */

  Component_CommandInterpreter.prototype.jumpToLabel = function(label) {
    var found, i, k, ref;
    if (!label) {
      return;
    }
    found = false;
    for (i = k = 0, ref = this.object.commands.length; 0 <= ref ? k < ref : k > ref; i = 0 <= ref ? ++k : --k) {
      if (this.object.commands[i].id === "gs.Label" && this.object.commands[i].params.name === label) {
        this.pointer = i;
        this.indent = this.object.commands[i].indent;
        found = true;
        break;
      }
    }
    if (found) {
      this.waitCounter = 0;
      return this.isWaiting = false;
    }
  };


  /**
  * Gets the current message box object depending on game mode (ADV or NVL).
  *
  * @method messageBoxObject
  * @return {gs.Object_Base} The message box object.
  * @protected
   */

  Component_CommandInterpreter.prototype.messageBoxObject = function(id) {
    if (SceneManager.scene.layout.visible) {
      return gs.ObjectManager.current.objectById(id || "messageBox");
    } else {
      return gs.ObjectManager.current.objectById(id || "nvlMessageBox");
    }
  };


  /**
  * Gets the current message object depending on game mode (ADV or NVL).
  *
  * @method messageObject
  * @return {ui.Object_Message} The message object.
  * @protected
   */

  Component_CommandInterpreter.prototype.messageObject = function() {
    if (SceneManager.scene.layout.visible) {
      return gs.ObjectManager.current.objectById("gameMessage_message");
    } else {
      return gs.ObjectManager.current.objectById("nvlGameMessage_message");
    }
  };


  /**
  * Gets the current message ID depending on game mode (ADV or NVL).
  *
  * @method messageObjectId
  * @return {string} The message object ID.
  * @protected
   */

  Component_CommandInterpreter.prototype.messageObjectId = function() {
    if (SceneManager.scene.layout.visible) {
      return "gameMessage_message";
    } else {
      return "nvlGameMessage_message";
    }
  };


  /**
  * Gets the current message settings.
  *
  * @method messageSettings
  * @return {Object} The message settings
  * @protected
   */

  Component_CommandInterpreter.prototype.messageSettings = function() {
    var message;
    message = this.targetMessage();
    return message.settings;
  };


  /**
  * Gets the current target message object where all message commands are executed on.
  *
  * @method targetMessage
  * @return {ui.Object_Message} The target message object.
  * @protected
   */

  Component_CommandInterpreter.prototype.targetMessage = function() {
    var message, ref, ref1, ref2, target;
    message = this.messageObject();
    target = this.settings.message.target;
    if (target != null) {
      switch (target.type) {
        case 0:
          message = (ref = gs.ObjectManager.current.objectById(target.id)) != null ? ref : this.messageObject();
          break;
        case 1:
          message = (ref1 = (ref2 = SceneManager.scene.messageAreas[target.id]) != null ? ref2.message : void 0) != null ? ref1 : this.messageObject();
      }
    }
    return message;
  };


  /**
  * Gets the current target message box containing the current target message.
  *
  * @method targetMessageBox
  * @return {ui.Object_UIElement} The target message box.
  * @protected
   */

  Component_CommandInterpreter.prototype.targetMessageBox = function() {
    var messageBox, ref, ref1, target;
    messageBox = this.messageObject();
    target = this.settings.message.target;
    if (target != null) {
      switch (target.type) {
        case 0:
          messageBox = (ref = gs.ObjectManager.current.objectById(target.id)) != null ? ref : this.messageObject();
          break;
        case 1:
          messageBox = (ref1 = gs.ObjectManager.current.objectById("customGameMessage_" + target.id)) != null ? ref1 : this.messageObject();
      }
    }
    return messageBox;
  };


  /**
  * Called after an input number dialog was accepted by the user. It takes the user's input and puts
  * it in the configured number variable.
  *
  * @method onInputNumberFinish
  * @return {Object} Event Object containing additional data like the number, etc.
  * @protected
   */

  Component_CommandInterpreter.prototype.onInputNumberFinish = function(e) {
    this.messageObject().behavior.clear();
    this.setNumberValueTo(this.waitingFor.inputNumber.variable, parseInt(ui.Component_FormulaHandler.fieldValue(e.sender, e.number)));
    this.isWaiting = false;
    this.waitingFor.inputNumber = null;
    return SceneManager.scene.inputNumberBox.dispose();
  };


  /**
  * Called after an input text dialog was accepted by the user. It takes the user's text input and puts
  * it in the configured string variable.
  *
  * @method onInputTextFinish
  * @return {Object} Event Object containing additional data like the text, etc.
  * @protected
   */

  Component_CommandInterpreter.prototype.onInputTextFinish = function(e) {
    this.messageObject().behavior.clear();
    this.setStringValueTo(this.waitingFor.inputText.variable, ui.Component_FormulaHandler.fieldValue(e.sender, e.text).replace(/_/g, ""));
    this.isWaiting = false;
    this.waitingFor.inputText = null;
    return SceneManager.scene.inputTextBox.dispose();
  };


  /**
  * Called after a choice was selected by the user. It jumps to the corresponding label
  * and also puts the choice into backlog.
  *
  * @method onChoiceAccept
  * @return {Object} Event Object containing additional data like the label, etc.
  * @protected
   */

  Component_CommandInterpreter.prototype.onChoiceAccept = function(e) {
    var duration, fading, messageObject, scene;
    scene = SceneManager.scene;
    scene.choiceTimer.behavior.stop();
    e.isSelected = true;
    delete e.sender;
    GameManager.backlog.push({
      character: {
        name: ""
      },
      message: "",
      choice: e,
      choices: scene.choices,
      isChoice: true
    });
    scene.choices = [];
    messageObject = this.messageObject();
    if (messageObject != null ? messageObject.visible : void 0) {
      this.isWaiting = true;
      fading = GameManager.tempSettings.messageFading;
      duration = GameManager.tempSettings.skip ? 0 : fading.duration;
      messageObject.animator.disappear(fading.animation, fading.easing, duration, (function(_this) {
        return function() {
          messageObject.behavior.clear();
          messageObject.visible = false;
          _this.isWaiting = false;
          _this.waitingFor.choice = null;
          return _this.executeAction(e.action, true);
        };
      })(this));
    } else {
      this.isWaiting = false;
      this.executeAction(e.action, true);
    }
    return scene.choiceWindow.dispose();
  };


  /**
  * Idle
  * @method commandIdle
  * @protected
   */

  Component_CommandInterpreter.prototype.commandIdle = function() {
    return this.interpreter.isWaiting = !this.interpreter.isInstantSkip();
  };


  /**
  * Start Timer
  * @method commandStartTimer
  * @protected
   */

  Component_CommandInterpreter.prototype.commandStartTimer = function() {
    var number, scene, timer, timers;
    scene = SceneManager.scene;
    timers = scene.timers;
    number = this.interpreter.numberValueOf(this.params.number);
    timer = timers[number];
    if (timer == null) {
      timer = new gs.Object_IntervalTimer();
      timers[number] = timer;
    }
    timer.events.offByOwner("elapsed", this.object);
    timer.events.on("elapsed", (function(_this) {
      return function(e) {
        var params;
        params = e.data.params;
        switch (params.action.type) {
          case 0:
            if (params.labelIndex != null) {
              return SceneManager.scene.interpreter.pointer = params.labelIndex;
            } else {
              return SceneManager.scene.interpreter.jumpToLabel(params.action.data.label);
            }
            break;
          case 1:
            return SceneManager.scene.interpreter.callCommonEvent(params.action.data.commonEventId);
        }
      };
    })(this), {
      params: this.params
    }, this.object);
    timer.behavior.interval = this.interpreter.durationValueOf(this.params.interval);
    return timer.behavior.start();
  };


  /**
  * Resume Timer
  * @method commandResumeTimer
  * @protected
   */

  Component_CommandInterpreter.prototype.commandResumeTimer = function() {
    var number, ref, timers;
    timers = SceneManager.scene.timers;
    number = this.interpreter.numberValueOf(this.params.number);
    return (ref = timers[number]) != null ? ref.behavior.resume() : void 0;
  };


  /**
  * Pauses Timer
  * @method commandPauseTimer
  * @protected
   */

  Component_CommandInterpreter.prototype.commandPauseTimer = function() {
    var number, ref, timers;
    timers = SceneManager.scene.timers;
    number = this.interpreter.numberValueOf(this.params.number);
    return (ref = timers[number]) != null ? ref.behavior.pause() : void 0;
  };


  /**
  * Stop Timer
  * @method commandStopTimer
  * @protected
   */

  Component_CommandInterpreter.prototype.commandStopTimer = function() {
    var number, ref, timers;
    timers = SceneManager.scene.timers;
    number = this.interpreter.numberValueOf(this.params.number);
    return (ref = timers[number]) != null ? ref.behavior.stop() : void 0;
  };


  /**
  * Wait
  * @method commandWait
  * @protected
   */

  Component_CommandInterpreter.prototype.commandWait = function() {
    var time;
    time = this.interpreter.durationValueOf(this.params.time);
    if ((time != null) && time > 0 && !this.interpreter.previewData) {
      this.interpreter.waitCounter = time;
      return this.interpreter.isWaiting = true;
    }
  };


  /**
  * Loop
  * @method commandLoop
  * @protected
   */

  Component_CommandInterpreter.prototype.commandLoop = function() {
    this.interpreter.loops[this.interpreter.indent] = this.interpreter.pointer;
    return this.interpreter.indent++;
  };


  /**
  * Break Loop
  * @method commandBreakLoop
  * @protected
   */

  Component_CommandInterpreter.prototype.commandBreakLoop = function() {
    var indent;
    indent = this.indent;
    while ((this.interpreter.loops[indent] == null) && indent > 0) {
      indent--;
    }
    this.interpreter.loops[indent] = null;
    return this.interpreter.indent = indent;
  };


  /**
  * @method commandListAdd
  * @protected
   */

  Component_CommandInterpreter.prototype.commandListAdd = function() {
    var list;
    list = this.interpreter.listObjectOf(this.params.listVariable);
    switch (this.params.valueType) {
      case 0:
        list.push(this.interpreter.numberValueOf(this.params.numberValue));
        break;
      case 1:
        list.push(this.interpreter.booleanValueOf(this.params.switchValue));
        break;
      case 2:
        list.push(this.interpreter.stringValueOf(this.params.stringValue));
        break;
      case 3:
        list.push(this.interpreter.listObjectOf(this.params.listValue));
    }
    return this.interpreter.setListObjectTo(this.params.listVariable, list);
  };


  /**
  * @method commandListPop
  * @protected
   */

  Component_CommandInterpreter.prototype.commandListPop = function() {
    var list, ref, value;
    list = this.interpreter.listObjectOf(this.params.listVariable);
    value = (ref = list.pop()) != null ? ref : 0;
    return this.interpreter.storeListValue(this.params.targetVariable, list, value, this.params.valueType);
  };


  /**
  * @method commandListShift
  * @protected
   */

  Component_CommandInterpreter.prototype.commandListShift = function() {
    var list, ref, value;
    list = this.interpreter.listObjectOf(this.params.listVariable);
    value = (ref = list.shift()) != null ? ref : 0;
    return this.interpreter.storeListValue(this.params.targetVariable, list, value, this.params.valueType);
  };


  /**
  * @method commandListIndexOf
  * @protected
   */

  Component_CommandInterpreter.prototype.commandListIndexOf = function() {
    var list, value;
    list = this.interpreter.listObjectOf(this.params.listVariable);
    value = -1;
    switch (this.params.valueType) {
      case 0:
        value = list.indexOf(this.interpreter.numberValueOf(this.params.numberValue));
        break;
      case 1:
        value = list.indexOf(this.interpreter.booleanValueOf(this.params.switchValue));
        break;
      case 2:
        value = list.indexOf(this.interpreter.stringValueOf(this.params.stringValue));
        break;
      case 3:
        value = list.indexOf(this.interpreter.listObjectOf(this.params.listValue));
    }
    return this.interpreter.setNumberValueTo(this.params.targetVariable, value);
  };


  /**
  * @method commandListClear
  * @protected
   */

  Component_CommandInterpreter.prototype.commandListClear = function() {
    var list;
    list = this.interpreter.listObjectOf(this.params.listVariable);
    return list.length = 0;
  };


  /**
  * @method commandListValueAt
  * @protected
   */

  Component_CommandInterpreter.prototype.commandListValueAt = function() {
    var index, list, ref, value;
    list = this.interpreter.listObjectOf(this.params.listVariable);
    index = this.interpreter.numberValueOf(this.params.index);
    if (index >= 0 && index < list.length) {
      value = (ref = list[index]) != null ? ref : 0;
      return this.interpreter.storeListValue(this.params.targetVariable, list, value, this.params.valueType);
    }
  };


  /**
  * @method commandListRemoveAt
  * @protected
   */

  Component_CommandInterpreter.prototype.commandListRemoveAt = function() {
    var index, list;
    list = this.interpreter.listObjectOf(this.params.listVariable);
    index = this.interpreter.numberValueOf(this.params.index);
    if (index >= 0 && index < list.length) {
      return list.splice(index, 1);
    }
  };


  /**
  * @method commandListInsertAt
  * @protected
   */

  Component_CommandInterpreter.prototype.commandListInsertAt = function() {
    var index, list;
    list = this.interpreter.listObjectOf(this.params.listVariable);
    index = this.interpreter.numberValueOf(this.params.index);
    if (index >= 0 && index < list.length) {
      switch (this.params.valueType) {
        case 0:
          list.splice(index, 0, this.interpreter.numberValueOf(this.params.numberValue));
          break;
        case 1:
          list.splice(index, 0, this.interpreter.booleanValueOf(this.params.switchValue));
          break;
        case 2:
          list.splice(index, 0, this.interpreter.stringValueOf(this.params.stringValue));
          break;
        case 3:
          list.splice(index, 0, this.interpreter.listObjectOf(this.params.listValue));
      }
      return this.interpreter.setListObjectTo(this.params.listVariable, list);
    }
  };


  /**
  * @method commandListSet
  * @protected
   */

  Component_CommandInterpreter.prototype.commandListSet = function() {
    var index, list;
    list = this.interpreter.listObjectOf(this.params.listVariable);
    index = this.interpreter.numberValueOf(this.params.index);
    if (index >= 0) {
      switch (this.params.valueType) {
        case 0:
          list[index] = this.interpreter.numberValueOf(this.params.numberValue);
          break;
        case 1:
          list[index] = this.interpreter.booleanValueOf(this.params.switchValue);
          break;
        case 2:
          list[index] = this.interpreter.stringValueOf(this.params.stringValue);
          break;
        case 3:
          list[index] = this.interpreter.listObjectOf(this.params.listValue);
      }
      return this.interpreter.setListObjectTo(this.params.listVariable, list);
    }
  };


  /**
  * @method commandListCopy
  * @protected
   */

  Component_CommandInterpreter.prototype.commandListCopy = function() {
    var copy, list;
    list = this.interpreter.listObjectOf(this.params.listVariable);
    copy = Object.deepCopy(list);
    return this.interpreter.setListObjectTo(this.params.targetVariable, copy);
  };


  /**
  * @method commandListLength
  * @protected
   */

  Component_CommandInterpreter.prototype.commandListLength = function() {
    var list;
    list = this.interpreter.listObjectOf(this.params.listVariable);
    return this.interpreter.setNumberValueTo(this.params.targetVariable, list.length);
  };


  /**
  * @method commandListJoin
  * @protected
   */

  Component_CommandInterpreter.prototype.commandListJoin = function() {
    var list, value;
    list = this.interpreter.listObjectOf(this.params.listVariable);
    value = this.params.order === 0 ? list.join(this.params.separator || "") : list.reverse().join(this.params.separator || "");
    return this.interpreter.setStringValueTo(this.params.targetVariable, value);
  };


  /**
  * @method commandListFromText
  * @protected
   */

  Component_CommandInterpreter.prototype.commandListFromText = function() {
    var list, separator, text;
    text = this.interpreter.stringValueOf(this.params.textVariable);
    separator = this.interpreter.stringValueOf(this.params.separator);
    list = text.split(separator);
    return this.interpreter.setListObjectTo(this.params.targetVariable, list);
  };


  /**
  * @method commandListShuffle
  * @protected
   */

  Component_CommandInterpreter.prototype.commandListShuffle = function() {
    var i, j, k, list, ref, results, tempi, tempj;
    list = this.interpreter.listObjectOf(this.params.listVariable);
    if (list.length === 0) {
      return;
    }
    results = [];
    for (i = k = ref = list.length - 1; ref <= 1 ? k <= 1 : k >= 1; i = ref <= 1 ? ++k : --k) {
      j = Math.floor(Math.random() * (i + 1));
      tempi = list[i];
      tempj = list[j];
      list[i] = tempj;
      results.push(list[j] = tempi);
    }
    return results;
  };


  /**
  * @method commandListSort
  * @protected
   */

  Component_CommandInterpreter.prototype.commandListSort = function() {
    var list;
    list = this.interpreter.listObjectOf(this.params.listVariable);
    if (list.length === 0) {
      return;
    }
    switch (this.params.sortOrder) {
      case 0:
        return list.sort(function(a, b) {
          if (a < b) {
            return -1;
          }
          if (a > b) {
            return 1;
          }
          return 0;
        });
      case 1:
        return list.sort(function(a, b) {
          if (a > b) {
            return -1;
          }
          if (a < b) {
            return 1;
          }
          return 0;
        });
    }
  };


  /**
  * @method commandResetVariables
  * @protected
   */

  Component_CommandInterpreter.prototype.commandResetVariables = function() {
    var range;
    switch (this.params.target) {
      case 0:
        range = null;
        break;
      case 1:
        range = this.params.range;
    }
    switch (this.params.scope) {
      case 0:
        if (this.params.scene) {
          return GameManager.variableStore.clearLocalVariables({
            id: this.params.scene.uid
          }, this.params.type, range);
        }
        break;
      case 1:
        return GameManager.variableStore.clearLocalVariables(null, this.params.type, range);
      case 2:
        return GameManager.variableStore.clearGlobalVariables(this.params.type, range);
      case 3:
        GameManager.variableStore.clearPersistentVariables(this.params.type, range);
        return GameManager.saveGlobalData();
    }
  };


  /**
  * @method commandChangeVariableDomain
  * @protected
   */

  Component_CommandInterpreter.prototype.commandChangeVariableDomain = function() {
    return GameManager.variableStore.changeDomain(this.interpreter.stringValueOf(this.params.domain));
  };


  /**
  * @method commandChangeDecimalVariables
  * @protected
   */

  Component_CommandInterpreter.prototype.commandChangeDecimalVariables = function() {
    return this.interpreter.changeDecimalVariables(this.params, this.params.roundMethod);
  };


  /**
  * @method commandChangeNumberVariables
  * @protected
   */

  Component_CommandInterpreter.prototype.commandChangeNumberVariables = function() {
    var diff, end, i, index, k, ref, ref1, scope, source, start;
    source = 0;
    switch (this.params.source) {
      case 0:
        source = this.interpreter.numberValueOf(this.params.sourceValue);
        break;
      case 1:
        start = this.interpreter.numberValueOf(this.params.sourceRandom.start);
        end = this.interpreter.numberValueOf(this.params.sourceRandom.end);
        diff = end - start;
        source = Math.floor(start + Math.random() * (diff + 1));
        break;
      case 2:
        source = this.interpreter.numberValueAtIndex(this.params.sourceScope, this.interpreter.numberValueOf(this.params.sourceReference) - 1, this.params.sourceReferenceDomain);
        break;
      case 3:
        source = this.interpreter.numberValueOfGameData(this.params.sourceValue1);
        break;
      case 4:
        source = this.interpreter.numberValueOfDatabaseData(this.params.sourceValue1);
    }
    switch (this.params.target) {
      case 0:
        switch (this.params.operation) {
          case 0:
            this.interpreter.setNumberValueTo(this.params.targetVariable, source);
            break;
          case 1:
            this.interpreter.setNumberValueTo(this.params.targetVariable, this.interpreter.numberValueOf(this.params.targetVariable) + source);
            break;
          case 2:
            this.interpreter.setNumberValueTo(this.params.targetVariable, this.interpreter.numberValueOf(this.params.targetVariable) - source);
            break;
          case 3:
            this.interpreter.setNumberValueTo(this.params.targetVariable, this.interpreter.numberValueOf(this.params.targetVariable) * source);
            break;
          case 4:
            this.interpreter.setNumberValueTo(this.params.targetVariable, Math.floor(this.interpreter.numberValueOf(this.params.targetVariable) / source));
            break;
          case 5:
            this.interpreter.setNumberValueTo(this.params.targetVariable, this.interpreter.numberValueOf(this.params.targetVariable) % source);
        }
        break;
      case 1:
        scope = this.params.targetScope;
        start = this.params.targetRange.start - 1;
        end = this.params.targetRange.end - 1;
        for (i = k = ref = start, ref1 = end; ref <= ref1 ? k <= ref1 : k >= ref1; i = ref <= ref1 ? ++k : --k) {
          switch (this.params.operation) {
            case 0:
              this.interpreter.setNumberValueAtIndex(scope, i, source);
              break;
            case 1:
              this.interpreter.setNumberValueAtIndex(scope, i, this.interpreter.numberValueAtIndex(scope, i) + source);
              break;
            case 2:
              this.interpreter.setNumberValueAtIndex(scope, i, this.interpreter.numberValueAtIndex(scope, i) - source);
              break;
            case 3:
              this.interpreter.setNumberValueAtIndex(scope, i, this.interpreter.numberValueAtIndex(scope, i) * source);
              break;
            case 4:
              this.interpreter.setNumberValueAtIndex(scope, i, Math.floor(this.interpreter.numberValueAtIndex(scope, i) / source));
              break;
            case 5:
              this.interpreter.setNumberValueAtIndex(scope, i, this.interpreter.numberValueAtIndex(scope, i) % source);
          }
        }
        break;
      case 2:
        index = this.interpreter.numberValueOf(this.params.targetReference) - 1;
        switch (this.params.operation) {
          case 0:
            this.interpreter.setNumberValueAtIndex(this.params.targetScope, index, source, this.params.targetReferenceDomain);
            break;
          case 1:
            this.interpreter.setNumberValueAtIndex(this.params.targetScope, index, this.interpreter.numberValueAtIndex(this.params.targetScope, index, this.params.targetReferenceDomain) + source, this.params.targetReferenceDomain);
            break;
          case 2:
            this.interpreter.setNumberValueAtIndex(this.params.targetScope, index, this.interpreter.numberValueAtIndex(this.params.targetScope, index, this.params.targetReferenceDomain) - source, this.params.targetReferenceDomain);
            break;
          case 3:
            this.interpreter.setNumberValueAtIndex(this.params.targetScope, index, this.interpreter.numberValueAtIndex(this.params.targetScope, index, this.params.targetReferenceDomain) * source, this.params.targetReferenceDomain);
            break;
          case 4:
            this.interpreter.setNumberValueAtIndex(this.params.targetScope, index, Math.floor(this.interpreter.numberValueAtIndex(this.params.targetScope, index, this.params.targetReferenceDomain) / source), this.params.targetReferenceDomain);
            break;
          case 5:
            this.interpreter.setNumberValueAtIndex(this.params.targetScope, index, this.interpreter.numberValueAtIndex(this.params.targetScope, index, this.params.targetReferenceDomain) % source, this.params.targetReferenceDomain);
        }
    }
    return null;
  };


  /**
  * @method commandChangeBooleanVariables
  * @protected
   */

  Component_CommandInterpreter.prototype.commandChangeBooleanVariables = function() {
    var i, index, k, ref, ref1, source, targetValue, variable;
    source = this.interpreter.booleanValueOf(this.params.value);
    switch (this.params.target) {
      case 0:
        if (this.params.value === 2) {
          targetValue = this.interpreter.booleanValueOf(this.params.targetVariable);
          this.interpreter.setBooleanValueTo(this.params.targetVariable, targetValue ? false : true);
        } else {
          this.interpreter.setBooleanValueTo(this.params.targetVariable, source);
        }
        break;
      case 1:
        variable = {
          index: 0,
          scope: this.params.targetRangeScope
        };
        for (i = k = ref = this.params.rangeStart - 1, ref1 = this.params.rangeEnd - 1; ref <= ref1 ? k <= ref1 : k >= ref1; i = ref <= ref1 ? ++k : --k) {
          variable.index = i;
          if (this.params.value === 2) {
            targetValue = this.interpreter.booleanValueOf(variable);
            this.interpreter.setBooleanValueTo(variable, targetValue ? false : true);
          } else {
            this.interpreter.setBooleanValueTo(variable, source);
          }
        }
        break;
      case 2:
        index = this.interpreter.numberValueOf(this.params.targetReference) - 1;
        this.interpreter.setBooleanValueAtIndex(this.params.targetRangeScope, index, source, this.params.targetReferenceDomain);
    }
    return null;
  };


  /**
  * @method commandChangeStringVariables
  * @protected
   */

  Component_CommandInterpreter.prototype.commandChangeStringVariables = function() {
    var ex, i, index, k, ref, ref1, source, targetValue, variable;
    source = "";
    switch (this.params.source) {
      case 0:
        source = lcs(this.params.textValue);
        break;
      case 1:
        source = this.interpreter.stringValueOf(this.params.sourceVariable);
        break;
      case 2:
        source = this.interpreter.stringValueOfDatabaseData(this.params.databaseData);
        break;
      case 2:
        try {
          source = eval(this.params.script);
        } catch (error) {
          ex = error;
          source = "ERR: " + ex.message;
        }
        break;
      default:
        source = lcs(this.params.textValue);
    }
    switch (this.params.target) {
      case 0:
        switch (this.params.operation) {
          case 0:
            this.interpreter.setStringValueTo(this.params.targetVariable, source);
            break;
          case 1:
            this.interpreter.setStringValueTo(this.params.targetVariable, this.interpreter.stringValueOf(this.params.targetVariable) + source);
            break;
          case 2:
            this.interpreter.setStringValueTo(this.params.targetVariable, this.interpreter.stringValueOf(this.params.targetVariable).toUpperCase());
            break;
          case 3:
            this.interpreter.setStringValueTo(this.params.targetVariable, this.interpreter.stringValueOf(this.params.targetVariable).toLowerCase());
        }
        break;
      case 1:
        variable = {
          index: 0,
          scope: this.params.targetRangeScope
        };
        for (i = k = ref = this.params.rangeStart - 1, ref1 = this.params.rangeEnd - 1; ref <= ref1 ? k <= ref1 : k >= ref1; i = ref <= ref1 ? ++k : --k) {
          variable.index = i;
          switch (this.params.operation) {
            case 0:
              this.interpreter.setStringValueTo(variable, source);
              break;
            case 1:
              this.interpreter.setStringValueTo(variable, this.interpreter.stringValueOf(variable) + source);
              break;
            case 2:
              this.interpreter.setStringValueTo(variable, this.interpreter.stringValueOf(variable).toUpperCase());
              break;
            case 3:
              this.interpreter.setStringValueTo(variable, this.interpreter.stringValueOf(variable).toLowerCase());
          }
        }
        break;
      case 2:
        index = this.interpreter.numberValueOf(this.params.targetReference) - 1;
        switch (this.params.operation) {
          case 0:
            this.interpreter.setStringValueAtIndex(this.params.targetRangeScope, index, source, this.params.targetReferenceDomain);
            break;
          case 1:
            targetValue = this.interpreter.stringValueAtIndex(this.params.targetRangeScope, index, this.params.targetReferenceDomain);
            this.interpreter.setStringValueAtIndex(this.params.targetRangeScope, index, targetValue + source, this.params.targetReferenceDomain);
            break;
          case 2:
            targetValue = this.interpreter.stringValueAtIndex(this.params.targetRangeScope, index, this.params.targetReferenceDomain);
            this.interpreter.setStringValueAtIndex(this.params.targetRangeScope, index, targetValue.toUpperCase(), this.params.targetReferenceDomain);
            break;
          case 3:
            targetValue = this.interpreter.stringValueAtIndex(this.params.targetRangeScope, index, this.params.targetReferenceDomain);
            this.interpreter.setStringValueTo(this.params.targetRangeScope, index, targetValue.toLowerCase(), this.params.targetReferenceDomain);
        }
    }
    return null;
  };


  /**
  * @method commandCheckSwitch
  * @protected
   */

  Component_CommandInterpreter.prototype.commandCheckSwitch = function() {
    var result;
    result = this.interpreter.booleanValueOf(this.params.targetVariable) && this.params.value;
    if (result) {
      return this.interpreter.pointer = this.params.labelIndex;
    }
  };


  /**
  * @method commandNumberCondition
  * @protected
   */

  Component_CommandInterpreter.prototype.commandNumberCondition = function() {
    var result;
    result = this.interpreter.compare(this.interpreter.numberValueOf(this.params.targetVariable), this.interpreter.numberValueOf(this.params.value), this.params.operation);
    this.interpreter.conditions[this.interpreter.indent] = result;
    if (result) {
      return this.interpreter.indent++;
    }
  };


  /**
  * @method commandCondition
  * @protected
   */

  Component_CommandInterpreter.prototype.commandCondition = function() {
    var result;
    switch (this.params.valueType) {
      case 0:
        result = this.interpreter.compare(this.interpreter.numberValueOf(this.params.variable), this.interpreter.numberValueOf(this.params.numberValue), this.params.operation);
        break;
      case 1:
        result = this.interpreter.compare(this.interpreter.booleanValueOf(this.params.variable), this.interpreter.booleanValueOf(this.params.switchValue), this.params.operation);
        break;
      case 2:
        result = this.interpreter.compare(lcs(this.interpreter.stringValueOf(this.params.variable)), lcs(this.interpreter.stringValueOf(this.params.textValue)), this.params.operation);
    }
    this.interpreter.conditions[this.interpreter.indent] = result;
    if (result) {
      return this.interpreter.indent++;
    }
  };


  /**
  * @method commandConditionElse
  * @protected
   */

  Component_CommandInterpreter.prototype.commandConditionElse = function() {
    if (!this.interpreter.conditions[this.interpreter.indent]) {
      return this.interpreter.indent++;
    }
  };


  /**
  * @method commandConditionElseIf
  * @protected
   */

  Component_CommandInterpreter.prototype.commandConditionElseIf = function() {
    if (!this.interpreter.conditions[this.interpreter.indent]) {
      return this.interpreter.commandCondition.call(this);
    }
  };


  /**
  * @method commandCheckNumberVariable
  * @protected
   */

  Component_CommandInterpreter.prototype.commandCheckNumberVariable = function() {
    var result;
    result = this.interpreter.compare(this.interpreter.numberValueOf(this.params.targetVariable), this.interpreter.numberValueOf(this.params.value), this.params.operation);
    if (result) {
      return this.interpreter.pointer = this.params.labelIndex;
    }
  };


  /**
  * @method commandCheckTextVariable
  * @protected
   */

  Component_CommandInterpreter.prototype.commandCheckTextVariable = function() {
    var result, text1, text2;
    result = false;
    text1 = this.interpreter.stringValueOf(this.params.targetVariable);
    text2 = this.interpreter.stringValueOf(this.params.value);
    switch (this.params.operation) {
      case 0:
        result = text1 === text2;
        break;
      case 1:
        result = text1 !== text2;
        break;
      case 2:
        result = text1.length > text2.length;
        break;
      case 3:
        result = text1.length >= text2.length;
        break;
      case 4:
        result = text1.length < text2.length;
        break;
      case 5:
        result = text1.length <= text2.length;
    }
    if (result) {
      return this.interpreter.pointer = this.params.labelIndex;
    }
  };


  /**
  * @method commandLabel
  * @protected
   */

  Component_CommandInterpreter.prototype.commandLabel = function() {};


  /**
  * @method commandJumpToLabel
  * @protected
   */

  Component_CommandInterpreter.prototype.commandJumpToLabel = function() {
    var label;
    label = this.params.labelIndex;
    if (label != null) {
      this.interpreter.pointer = label;
      return this.interpreter.indent = this.interpreter.object.commands[label].indent;
    } else {
      switch (this.params.target) {
        case "activeContext":
          return this.interpreter.jumpToLabel(this.interpreter.stringValueOf(this.params.name));
        case "activeScene":
          return SceneManager.scene.interpreter.jumpToLabel(this.interpreter.stringValueOf(this.params.name));
        default:
          return this.interpreter.jumpToLabel(this.interpreter.stringValueOf(this.params.name));
      }
    }
  };


  /**
  * @method commandClearMessage
  * @protected
   */

  Component_CommandInterpreter.prototype.commandClearMessage = function() {
    var duration, fading, flags, isLocked, messageObject, scene;
    scene = SceneManager.scene;
    messageObject = this.interpreter.targetMessage();
    if (messageObject == null) {
      return;
    }
    flags = this.params.fieldFlags || {};
    isLocked = gs.CommandFieldFlags.isLocked;
    duration = 0;
    fading = GameManager.tempSettings.messageFading;
    if (!GameManager.tempSettings.skip) {
      duration = !isLocked(flags.duration) ? this.interpreter.durationValueOf(this.params.duration) : fading.duration;
    }
    messageObject.animator.disappear(fading.animation, fading.easing, duration, gs.CallBack("onMessageADVClear", this.interpreter));
    this.interpreter.waitForCompletion(messageObject, this.params);
    return gs.GameNotifier.postMinorChange();
  };


  /**
  * @method commandMessageBoxDefaults
  * @protected
   */

  Component_CommandInterpreter.prototype.commandMessageBoxDefaults = function() {
    var defaults, flags, isLocked;
    defaults = GameManager.defaults.messageBox;
    flags = this.params.fieldFlags || {};
    isLocked = gs.CommandFieldFlags.isLocked;
    if (!isLocked(flags.appearDuration)) {
      defaults.appearDuration = this.interpreter.durationValueOf(this.params.appearDuration);
    }
    if (!isLocked(flags.disappearDuration)) {
      defaults.disappearDuration = this.interpreter.durationValueOf(this.params.disappearDuration);
    }
    if (!isLocked(flags.zOrder)) {
      defaults.zOrder = this.interpreter.numberValueOf(this.params.zOrder);
    }
    if (!isLocked(flags["appearEasing.type"])) {
      defaults.appearEasing = this.params.appearEasing;
    }
    if (!isLocked(flags["appearAnimation.type"])) {
      defaults.appearAnimation = this.params.appearAnimation;
    }
    if (!isLocked(flags["disappearEasing.type"])) {
      defaults.disappearEasing = this.params.disappearEasing;
    }
    if (!isLocked(flags["disappearAnimation.type"])) {
      return defaults.disappearAnimation = this.params.disappearAnimation;
    }
  };


  /**
  * @method commandShowMessage
  * @protected
   */

  Component_CommandInterpreter.prototype.commandShowMessage = function() {
    var animation, character, defaults, duration, easing, expression, ref, scene, showMessage;
    scene = SceneManager.scene;
    scene.messageMode = vn.MessageMode.ADV;
    character = scene.characters.first((function(_this) {
      return function(v) {
        return !v.disposed && v.rid === _this.params.characterId;
      };
    })(this));
    showMessage = (function(_this) {
      return function() {
        var messageObject, ref, settings, voiceSettings;
        character = RecordManager.characters[_this.params.characterId];
        scene.layout.visible = true;
        messageObject = _this.interpreter.targetMessage();
        if (messageObject == null) {
          return;
        }
        scene.currentCharacter = character;
        messageObject.character = character;
        messageObject.opacity = 255;
        messageObject.events.offByOwner("callCommonEvent", _this.interpreter);
        messageObject.events.on("callCommonEvent", gs.CallBack("onCallCommonEvent", _this.interpreter), {
          params: _this.params
        }, _this.interpreter);
        messageObject.events.once("finish", gs.CallBack("onMessageADVFinish", _this.interpreter), {
          params: _this.params
        }, _this.interpreter);
        messageObject.events.once("waiting", gs.CallBack("onMessageADVWaiting", _this.interpreter), {
          params: _this.params
        }, _this.interpreter);
        if (messageObject.settings.useCharacterColor) {
          messageObject.message.showMessage(_this.interpreter, _this.params, character);
        } else {
          messageObject.message.showMessage(_this.interpreter, _this.params);
        }
        settings = GameManager.settings;
        voiceSettings = settings.voicesByCharacter[character.index];
        if ((_this.params.voice != null) && GameManager.settings.voiceEnabled && (!voiceSettings || voiceSettings > 0)) {
          if ((GameManager.settings.skipVoiceOnAction || !((ref = AudioManager.voice) != null ? ref.playing : void 0)) && !GameManager.tempSettings.skip) {
            messageObject.voice = _this.params.voice;
            return messageObject.behavior.voice = AudioManager.playVoice(_this.params.voice);
          }
        } else {
          return messageObject.behavior.voice = null;
        }
      };
    })(this);
    if ((this.params.expressionId != null) && (character != null)) {
      expression = RecordManager.characterExpressions[this.params.expressionId || 0];
      defaults = GameManager.defaults.character;
      duration = !gs.CommandFieldFlags.isLocked(this.params.fieldFlags.duration) ? this.interpreter.durationValueOf(this.params.duration) : defaults.expressionDuration;
      easing = gs.Easings.fromObject(defaults.changeEasing);
      animation = defaults.changeAnimation;
      character.behavior.changeExpression(expression, animation, easing, duration, (function(_this) {
        return function() {
          return showMessage();
        };
      })(this));
    } else {
      showMessage();
    }
    this.interpreter.isWaiting = ((ref = this.params.waitForCompletion) != null ? ref : true) && !(GameManager.tempSettings.skip && GameManager.tempSettings.skipTime === 0);
    return this.interpreter.waitingFor.messageADV = this.params;
  };


  /**
  * @method commandSetMessageArea
  * @protected
   */

  Component_CommandInterpreter.prototype.commandSetMessageArea = function() {
    var messageLayout, number, scene;
    scene = SceneManager.scene;
    number = this.interpreter.numberValueOf(this.params.number);
    if (scene.messageAreas[number]) {
      messageLayout = scene.messageAreas[number].layout;
      messageLayout.dstRect.x = this.params.box.x;
      messageLayout.dstRect.y = this.params.box.y;
      messageLayout.dstRect.width = this.params.box.size.width;
      messageLayout.dstRect.height = this.params.box.size.height;
      return messageLayout.needsUpdate = true;
    }
  };


  /**
  * @method commandMessageFading
  * @protected
   */

  Component_CommandInterpreter.prototype.commandMessageFading = function() {
    return GameManager.tempSettings.messageFading = {
      duration: this.interpreter.durationValueOf(this.params.duration),
      animation: this.params.animation,
      easing: gs.Easings.fromObject(this.params.easing)
    };
  };


  /**
  * @method commandMessageSettings
  * @protected
   */

  Component_CommandInterpreter.prototype.commandMessageSettings = function() {
    var flags, font, fontName, fontSize, isLocked, messageObject, messageSettings, ref, ref1, ref2, ref3, ref4, ref5;
    messageObject = this.interpreter.targetMessage();
    if (!messageObject) {
      return;
    }
    flags = this.params.fieldFlags || {};
    isLocked = gs.CommandFieldFlags.isLocked;
    messageSettings = this.interpreter.messageSettings();
    if (!isLocked(flags.autoErase)) {
      messageSettings.autoErase = this.params.autoErase;
    }
    if (!isLocked(flags.waitAtEnd)) {
      messageSettings.waitAtEnd = this.params.waitAtEnd;
    }
    if (!isLocked(flags.backlog)) {
      messageSettings.backlog = this.params.backlog;
    }
    if (!isLocked(flags.lineHeight)) {
      messageSettings.lineHeight = this.params.lineHeight;
    }
    if (!isLocked(flags.lineSpacing)) {
      messageSettings.lineSpacing = this.params.lineSpacing;
    }
    if (!isLocked(flags.linePadding)) {
      messageSettings.linePadding = this.params.linePadding;
    }
    if (!isLocked(flags.paragraphSpacing)) {
      messageSettings.paragraphSpacing = this.params.paragraphSpacing;
    }
    if (!isLocked(flags.useCharacterColor)) {
      messageSettings.useCharacterColor = this.params.useCharacterColor;
    }
    messageObject.textRenderer.minLineHeight = (ref = messageSettings.lineHeight) != null ? ref : 0;
    messageObject.textRenderer.lineSpacing = (ref1 = messageSettings.lineSpacing) != null ? ref1 : messageObject.textRenderer.lineSpacing;
    messageObject.textRenderer.padding = (ref2 = messageSettings.linePadding) != null ? ref2 : messageObject.textRenderer.padding;
    fontName = !isLocked(flags.font) ? this.params.font : messageObject.font.name;
    fontSize = !isLocked(flags.size) ? this.params.size : messageObject.font.size;
    font = messageObject.font;
    if (!isLocked(flags.font) || !isLocked(flags.size)) {
      messageObject.font = new Font(fontName, fontSize);
    }
    if (!isLocked(flags.bold)) {
      messageObject.font.bold = this.params.bold;
    }
    if (!isLocked(flags.italic)) {
      messageObject.font.italic = this.params.italic;
    }
    if (!isLocked(flags.smallCaps)) {
      messageObject.font.smallCaps = this.params.smallCaps;
    }
    if (!isLocked(flags.underline)) {
      messageObject.font.underline = this.params.underline;
    }
    if (!isLocked(flags.strikeThrough)) {
      messageObject.font.strikeThrough = this.params.strikeThrough;
    }
    if (!isLocked(flags.color)) {
      messageObject.font.color = new Color(this.params.color);
    }
    messageObject.font.color = (flags.color != null) && !isLocked(flags.color) ? new Color(this.params.color) : font.color;
    messageObject.font.border = (flags.outline != null) && !isLocked(flags.outline) ? this.params.outline : font.border;
    messageObject.font.borderColor = (flags.outlineColor != null) && !isLocked(flags.outlineColor) ? new Color(this.params.outlineColor) : new Color(font.borderColor);
    messageObject.font.borderSize = (flags.outlineSize != null) && !isLocked(flags.outlineSize) ? (ref3 = this.params.outlineSize) != null ? ref3 : 4 : font.borderSize;
    messageObject.font.shadow = (flags.shadow != null) && !isLocked(flags.shadow) ? this.params.shadow : font.shadow;
    messageObject.font.shadowColor = (flags.shadowColor != null) && !isLocked(flags.shadowColor) ? new Color(this.params.shadowColor) : new Color(font.shadowColor);
    messageObject.font.shadowOffsetX = (flags.shadowOffsetX != null) && !isLocked(flags.shadowOffsetX) ? (ref4 = this.params.shadowOffsetX) != null ? ref4 : 1 : font.shadowOffsetX;
    messageObject.font.shadowOffsetY = (flags.shadowOffsetY != null) && !isLocked(flags.shadowOffsetY) ? (ref5 = this.params.shadowOffsetY) != null ? ref5 : 1 : font.shadowOffsetY;
    if (isLocked(flags.bold)) {
      messageObject.font.bold = font.bold;
    }
    if (isLocked(flags.italic)) {
      messageObject.font.italic = font.italic;
    }
    if (isLocked(flags.smallCaps)) {
      return messageObject.font.smallCaps = font.smallCaps;
    }
  };


  /**
  * @method commandCreateMessageArea
  * @protected
   */

  Component_CommandInterpreter.prototype.commandCreateMessageArea = function() {
    var messageArea, number, scene;
    number = this.interpreter.numberValueOf(this.params.number);
    scene = SceneManager.scene;
    scene.behavior.changeMessageAreaDomain(this.params.numberDomain);
    if (!scene.messageAreas[number]) {
      messageArea = new gs.Object_MessageArea();
      messageArea.layout = ui.UIManager.createControlFromDescriptor({
        type: "ui.CustomGameMessage",
        id: "customGameMessage_" + number,
        params: {
          id: "customGameMessage_" + number
        }
      }, messageArea);
      messageArea.message = gs.ObjectManager.current.objectById("customGameMessage_" + number + "_message");
      messageArea.message.domain = this.params.numberDomain;
      messageArea.addObject(messageArea.layout);
      messageArea.layout.dstRect.x = this.params.box.x;
      messageArea.layout.dstRect.y = this.params.box.y;
      messageArea.layout.dstRect.width = this.params.box.size.width;
      messageArea.layout.dstRect.height = this.params.box.size.height;
      messageArea.layout.needsUpdate = true;
      return scene.messageAreas[number] = messageArea;
    }
  };


  /**
  * @method commandEraseMessageArea
  * @protected
   */

  Component_CommandInterpreter.prototype.commandEraseMessageArea = function() {
    var area, number, scene;
    number = this.interpreter.numberValueOf(this.params.number);
    scene = SceneManager.scene;
    scene.behavior.changeMessageAreaDomain(this.params.numberDomain);
    area = scene.messageAreas[number];
    if (area != null) {
      area.layout.dispose();
    }
    return scene.messageAreas[number] = null;
  };


  /**
  * @method commandSetTargetMessage
  * @protected
   */

  Component_CommandInterpreter.prototype.commandSetTargetMessage = function() {
    var message, ref, ref1, scene, target;
    message = this.interpreter.targetMessage();
    if (message != null) {
      message.textRenderer.isWaiting = false;
    }
    if (message != null) {
      message.behavior.isWaiting = false;
    }
    scene = SceneManager.scene;
    scene.behavior.changeMessageAreaDomain(this.params.numberDomain);
    target = {
      type: this.params.type,
      id: null
    };
    switch (this.params.type) {
      case 0:
        target.id = this.params.id;
        break;
      case 1:
        target.id = this.interpreter.numberValueOf(this.params.number);
    }
    this.interpreter.settings.message.target = target;
    if (this.params.clear) {
      if ((ref = this.interpreter.targetMessage()) != null) {
        ref.behavior.clear();
      }
    }
    return (ref1 = this.interpreter.targetMessage()) != null ? ref1.visible = true : void 0;
  };


  /**
  * @method commandBacklogVisibility
  * @protected
   */

  Component_CommandInterpreter.prototype.commandBacklogVisibility = function() {
    var control;
    if (this.params.visible) {
      control = gs.ObjectManager.current.objectById("backlogBox");
      if (control == null) {
        control = gs.ObjectManager.current.objectById("backlog");
      }
      if (control != null) {
        control.dispose();
      }
      if (this.params.backgroundVisible) {
        return control = SceneManager.scene.behavior.createControl(this, {
          descriptor: "ui.MessageBacklogBox"
        });
      } else {
        return control = SceneManager.scene.behavior.createControl(this, {
          descriptor: "ui.MessageBacklog"
        });
      }
    } else {
      control = gs.ObjectManager.current.objectById("backlogBox");
      if (control == null) {
        control = gs.ObjectManager.current.objectById("backlog");
      }
      return control != null ? control.dispose() : void 0;
    }
  };


  /**
  * @method commandMessageVisibility
  * @protected
   */

  Component_CommandInterpreter.prototype.commandMessageVisibility = function() {
    var animation, defaults, duration, easing, flags, isLocked, message;
    defaults = GameManager.defaults.messageBox;
    flags = this.params.fieldFlags || {};
    isLocked = gs.CommandFieldFlags.isLocked;
    message = this.interpreter.targetMessage();
    if ((message == null) || this.params.visible === message.visible) {
      return;
    }
    if (this.params.visible) {
      duration = !isLocked(flags.duration) ? this.interpreter.durationValueOf(this.params.duration) : defaults.appearDuration;
      easing = !isLocked(flags["easing.type"]) ? gs.Easings.fromObject(this.params.easing) : gs.Easings.fromObject(defaults.appearEasing);
      animation = !isLocked(flags["animation.type"]) ? this.params.animation : defaults.appearAnimation;
      message.animator.appear(message.dstRect.x, message.dstRect.y, this.params.animation, easing, duration);
    } else {
      duration = !isLocked(flags.duration) ? this.interpreter.durationValueOf(this.params.duration) : defaults.disappearDuration;
      easing = !isLocked(flags["easing.type"]) ? gs.Easings.fromObject(this.params.easing) : gs.Easings.fromObject(defaults.disappearEasing);
      animation = !isLocked(flags["animation.type"]) ? this.params.animation : defaults.disappearAnimation;
      message.animator.disappear(animation, easing, duration, function() {
        return message.visible = false;
      });
    }
    message.update();
    if (this.params.waitForCompletion && !(duration === 0 || this.interpreter.isInstantSkip())) {
      this.interpreter.isWaiting = true;
      this.interpreter.waitCounter = duration;
    }
    return gs.GameNotifier.postMinorChange();
  };


  /**
  * @method commandMessageBoxVisibility
  * @protected
   */

  Component_CommandInterpreter.prototype.commandMessageBoxVisibility = function() {
    var animation, defaults, duration, easing, flags, isLocked, messageBox, visible;
    defaults = GameManager.defaults.messageBox;
    flags = this.params.fieldFlags || {};
    isLocked = gs.CommandFieldFlags.isLocked;
    messageBox = this.interpreter.messageBoxObject(this.interpreter.stringValueOf(this.params.id));
    visible = this.params.visible === 1;
    if ((messageBox == null) || visible === messageBox.visible) {
      return;
    }
    if (this.params.visible) {
      duration = !isLocked(flags.duration) ? this.interpreter.durationValueOf(this.params.duration) : defaults.appearDuration;
      easing = !isLocked(flags["easing.type"]) ? gs.Easings.fromObject(this.params.easing) : gs.Easings.fromObject(defaults.appearEasing);
      animation = !isLocked(flags["animation.type"]) ? this.params.animation : defaults.appearAnimation;
      messageBox.animator.appear(messageBox.dstRect.x, messageBox.dstRect.y, animation, easing, duration);
    } else {
      duration = !isLocked(flags.duration) ? this.interpreter.durationValueOf(this.params.duration) : defaults.disappearDuration;
      easing = !isLocked(flags["easing.type"]) ? gs.Easings.fromObject(this.params.easing) : gs.Easings.fromObject(defaults.disappearEasing);
      animation = !isLocked(flags["animation.type"]) ? this.params.animation : defaults.disappearAnimation;
      messageBox.animator.disappear(animation, easing, duration, function() {
        return messageBox.visible = false;
      });
    }
    messageBox.update();
    if (this.params.waitForCompletion && !(duration === 0 || this.interpreter.isInstantSkip())) {
      this.interpreter.isWaiting = true;
      this.interpreter.waitCounter = duration;
    }
    return gs.GameNotifier.postMinorChange();
  };


  /**
  * @method commandUIAccess
  * @protected
   */

  Component_CommandInterpreter.prototype.commandUIAccess = function() {
    var flags, isLocked;
    flags = this.params.fieldFlags || {};
    isLocked = gs.CommandFieldFlags.isLocked;
    if (!isLocked(flags.generalMenu)) {
      GameManager.tempSettings.menuAccess = this.interpreter.booleanValueOf(this.params.generalMenu);
    }
    if (!isLocked(flags.saveMenu)) {
      GameManager.tempSettings.saveMenuAccess = this.interpreter.booleanValueOf(this.params.saveMenu);
    }
    if (!isLocked(flags.loadMenu)) {
      GameManager.tempSettings.loadMenuAccess = this.interpreter.booleanValueOf(this.params.loadMenu);
    }
    if (!isLocked(flags.backlog)) {
      return GameManager.tempSettings.backlogAccess = this.interpreter.booleanValueOf(this.params.backlog);
    }
  };


  /**
  * @method commandUnlockCG
  * @protected
   */

  Component_CommandInterpreter.prototype.commandUnlockCG = function() {
    var cg;
    cg = RecordManager.cgGallery[this.interpreter.stringValueOf(this.params.cgId)];
    if (cg != null) {
      GameManager.globalData.cgGallery[cg.index] = {
        unlocked: true
      };
      return GameManager.saveGlobalData();
    }
  };


  /**
  * @method commandL2DMove
  * @protected
   */

  Component_CommandInterpreter.prototype.commandL2DMove = function() {
    var character, scene;
    scene = SceneManager.scene;
    character = scene.characters.first((function(_this) {
      return function(v) {
        return !v.disposed && v.rid === _this.params.characterId;
      };
    })(this));
    if (!character instanceof vn.Object_Live2DCharacter) {
      return;
    }
    this.interpreter.moveObject(character, this.params.position, this.params);
    return gs.GameNotifier.postMinorChange();
  };


  /**
  * @method commandL2DMotionGroup
  * @protected
   */

  Component_CommandInterpreter.prototype.commandL2DMotionGroup = function() {
    var character, motions, scene;
    scene = SceneManager.scene;
    character = scene.characters.first((function(_this) {
      return function(v) {
        return !v.disposed && v.rid === _this.params.characterId;
      };
    })(this));
    if (!character instanceof vn.Object_Live2DCharacter) {
      return;
    }
    character.motionGroup = {
      name: this.params.data.motionGroup,
      loop: this.params.loop,
      playType: this.params.playType
    };
    if (this.params.waitForCompletion && !this.params.loop) {
      motions = character.model.motionsByGroup[character.motionGroup.name];
      if (motions != null) {
        this.interpreter.isWaiting = true;
        this.interpreter.waitCounter = motions.sum(function(m) {
          return m.getDurationMSec() / 16.6;
        });
      }
    }
    return gs.GameNotifier.postMinorChange();
  };


  /**
  * @method commandL2DMotion
  * @protected
   */

  Component_CommandInterpreter.prototype.commandL2DMotion = function() {
    var character, defaults, fadeInTime, flags, isLocked, motion, scene;
    defaults = GameManager.defaults.live2d;
    flags = this.params.fieldFlags || {};
    isLocked = gs.CommandFieldFlags.isLocked;
    scene = SceneManager.scene;
    character = scene.characters.first((function(_this) {
      return function(v) {
        return !v.disposed && v.rid === _this.params.characterId;
      };
    })(this));
    if (!character instanceof vn.Object_Live2DCharacter) {
      return;
    }
    fadeInTime = !isLocked(flags.fadeInTime) ? this.params.fadeInTime : defaults.motionFadeInTime;
    character.motion = {
      name: this.params.data.motion,
      fadeInTime: fadeInTime,
      loop: this.params.loop
    };
    character.motionGroup = null;
    if (this.params.waitForCompletion && !this.params.loop) {
      motion = character.model.motions[character.motion.name];
      if (motion != null) {
        this.interpreter.isWaiting = true;
        this.interpreter.waitCounter = motion.getDurationMSec() / 16.6;
      }
    }
    return gs.GameNotifier.postMinorChange();
  };


  /**
  * @method commandL2DExpression
  * @protected
   */

  Component_CommandInterpreter.prototype.commandL2DExpression = function() {
    var character, defaults, fadeInTime, flags, isLocked, scene;
    defaults = GameManager.defaults.live2d;
    flags = this.params.fieldFlags || {};
    isLocked = gs.CommandFieldFlags.isLocked;
    scene = SceneManager.scene;
    character = scene.characters.first((function(_this) {
      return function(v) {
        return !v.disposed && v.rid === _this.params.characterId;
      };
    })(this));
    if (!character instanceof vn.Object_Live2DCharacter) {
      return;
    }
    fadeInTime = !isLocked(flags.fadeInTime) ? this.params.fadeInTime : defaults.expressionFadeInTime;
    character.expression = {
      name: this.params.data.expression,
      fadeInTime: fadeInTime
    };
    return gs.GameNotifier.postMinorChange();
  };


  /**
  * @method commandL2DExitScene
  * @protected
   */

  Component_CommandInterpreter.prototype.commandL2DExitScene = function() {
    var defaults;
    defaults = GameManager.defaults.live2d;
    this.interpreter.commandCharacterExitScene.call(this, defaults);
    return gs.GameNotifier.postMinorChange();
  };


  /**
  * @method commandL2DSettings
  * @protected
   */

  Component_CommandInterpreter.prototype.commandL2DSettings = function() {
    var character, flags, isLocked, scene;
    flags = this.params.fieldFlags || {};
    isLocked = gs.CommandFieldFlags.isLocked;
    scene = SceneManager.scene;
    character = scene.characters.first((function(_this) {
      return function(v) {
        return !v.disposed && v.rid === _this.params.characterId;
      };
    })(this));
    if (!(character != null ? character.visual.l2dObject : void 0)) {
      return;
    }
    if (!isLocked(flags.lipSyncSensitivity)) {
      character.visual.l2dObject.lipSyncSensitivity = this.interpreter.numberValueOf(this.params.lipSyncSensitivity);
    }
    if (!isLocked(flags.idleIntensity)) {
      character.visual.l2dObject.idleIntensity = this.interpreter.numberValueOf(this.params.idleIntensity);
    }
    if (!isLocked(flags.breathIntensity)) {
      character.visual.l2dObject.breathIntensity = this.interpreter.numberValueOf(this.params.breathIntensity);
    }
    if (!isLocked(flags["eyeBlink.enabled"])) {
      character.visual.l2dObject.eyeBlink.enabled = this.params.eyeBlink.enabled;
    }
    if (!isLocked(flags["eyeBlink.interval"])) {
      character.visual.l2dObject.eyeBlink.blinkIntervalMsec = this.interpreter.numberValueOf(this.params.eyeBlink.interval);
    }
    if (!isLocked(flags["eyeBlink.closedMotionTime"])) {
      character.visual.l2dObject.eyeBlink.closedMotionMsec = this.interpreter.numberValueOf(this.params.eyeBlink.closedMotionTime);
    }
    if (!isLocked(flags["eyeBlink.closingMotionTime"])) {
      character.visual.l2dObject.eyeBlink.closingMotionMsec = this.interpreter.numberValueOf(this.params.eyeBlink.closingMotionTime);
    }
    if (!isLocked(flags["eyeBlink.openingMotionTime"])) {
      character.visual.l2dObject.eyeBlink.openingMotionMsec = this.interpreter.numberValueOf(this.params.eyeBlink.openingMotionTime);
    }
    return gs.GameNotifier.postMinorChange();
  };


  /**
  * @method commandL2DParameter
  * @protected
   */

  Component_CommandInterpreter.prototype.commandL2DParameter = function() {
    var character, duration, easing, scene;
    scene = SceneManager.scene;
    character = scene.characters.first((function(_this) {
      return function(v) {
        return !v.disposed && v.rid === _this.params.characterId;
      };
    })(this));
    if (!character instanceof vn.Object_Live2DCharacter) {
      return;
    }
    easing = gs.Easings.fromObject(this.params.easing);
    duration = this.interpreter.durationValueOf(this.params.duration);
    character.animator.l2dParameterTo(this.params.param.name, this.interpreter.numberValueOf(this.params.param.value), duration, easing);
    if (this.params.waitForCompletion && !(duration === 0 || this.interpreter.isInstantSkip())) {
      this.interpreter.isWaiting = true;
      this.interpreter.waitCounter = duration;
    }
    return gs.GameNotifier.postMinorChange();
  };


  /**
  * @method commandL2DDefaults
  * @protected
   */

  Component_CommandInterpreter.prototype.commandL2DDefaults = function() {
    var defaults, flags, isLocked;
    defaults = GameManager.defaults.live2d;
    flags = this.params.fieldFlags || {};
    isLocked = gs.CommandFieldFlags.isLocked;
    if (!isLocked(flags.appearDuration)) {
      defaults.appearDuration = this.interpreter.durationValueOf(this.params.appearDuration);
    }
    if (!isLocked(flags.disappearDuration)) {
      defaults.disappearDuration = this.interpreter.durationValueOf(this.params.disappearDuration);
    }
    if (!isLocked(flags.zOrder)) {
      defaults.zOrder = this.interpreter.numberValueOf(this.params.zOrder);
    }
    if (!isLocked(flags.motionFadeInTime)) {
      defaults.motionFadeInTime = this.interpreter.numberValueOf(this.params.motionFadeInTime);
    }
    if (!isLocked(flags["appearEasing.type"])) {
      defaults.appearEasing = this.params.appearEasing;
    }
    if (!isLocked(flags["appearAnimation.type"])) {
      defaults.appearAnimation = this.params.appearAnimation;
    }
    if (!isLocked(flags["disappearEasing.type"])) {
      defaults.disappearEasing = this.params.disappearEasing;
    }
    if (!isLocked(flags["disappearAnimation.type"])) {
      defaults.disappearAnimation = this.params.disappearAnimation;
    }
    return gs.GameNotifier.postMinorChange();
  };


  /**
  * @method commandL2DJoinScene
  * @protected
   */

  Component_CommandInterpreter.prototype.commandL2DJoinScene = function() {
    var animation, character, defaults, duration, easing, flags, isLocked, motionBlur, origin, p, record, ref, ref1, ref2, ref3, ref4, ref5, scene, x, y, zIndex;
    defaults = GameManager.defaults.live2d;
    flags = this.params.fieldFlags || {};
    isLocked = gs.CommandFieldFlags.isLocked;
    scene = SceneManager.scene;
    record = RecordManager.characters[this.interpreter.stringValueOf(this.params.characterId)];
    if (!record || scene.characters.first(function(v) {
      return !v.disposed && v.rid === record.index;
    })) {
      return;
    }
    if (this.params.positionType === 1) {
      x = this.params.position.x;
      y = this.params.position.y;
    } else if (this.params.positionType === 2) {
      x = this.interpreter.numberValueOf(this.params.position.x);
      y = this.interpreter.numberValueOf(this.params.position.y);
    }
    easing = !isLocked(flags["easing.type"]) ? gs.Easings.fromValues(this.interpreter.numberValueOf(this.params.easing.type), this.params.easing.inOut) : gs.Easings.fromObject(defaults.appearEasing);
    duration = !isLocked(flags.duration) ? this.interpreter.durationValueOf(this.params.duration) : defaults.appearDuration;
    zIndex = !isLocked(flags.zOrder) ? this.interpreter.numberValueOf(this.params.zOrder) : defaults.zOrder;
    animation = !isLocked(flags["animation.type"]) ? this.params.animation : defaults.appearAnimation;
    motionBlur = !isLocked(flags["motionBlur.enabled"]) ? this.params.motionBlur : defaults.motionBlur;
    origin = !isLocked(flags.origin) ? this.params.origin : defaults.origin;
    if (this.params.waitForCompletion && !(duration === 0 || this.interpreter.isInstantSkip())) {
      this.interpreter.isWaiting = true;
      this.interpreter.waitCounter = duration;
    }
    character = new vn.Object_Live2DCharacter(record);
    character.modelName = ((ref = this.params.model) != null ? ref.name : void 0) || "";
    character.model = ResourceManager.getLive2DModel("Live2D/" + character.modelName);
    if (character.model.motions) {
      character.motion = {
        name: "",
        fadeInTime: 0,
        loop: true
      };
    }
    character.dstRect.x = x;
    character.dstRect.y = y;
    character.anchor.x = !origin ? 0 : 0.5;
    character.anchor.y = !origin ? 0 : 0.5;
    character.blendMode = this.interpreter.numberValueOf(this.params.blendMode);
    character.zoom.x = this.params.position.zoom.d;
    character.zoom.y = this.params.position.zoom.d;
    character.zIndex = zIndex || 200;
    if ((ref1 = character.model) != null) {
      ref1.reset();
    }
    character.setup();
    character.visual.l2dObject.idleIntensity = (ref2 = record.idleIntensity) != null ? ref2 : 1.0;
    character.visual.l2dObject.breathIntensity = (ref3 = record.breathIntensity) != null ? ref3 : 1.0;
    character.visual.l2dObject.lipSyncSensitivity = (ref4 = record.lipSyncSensitivity) != null ? ref4 : 1.0;
    character.update();
    if (this.params.positionType === 0) {
      p = this.interpreter.predefinedObjectPosition(this.params.predefinedPositionId, character, this.params);
      character.dstRect.x = p.x;
      character.dstRect.y = p.y;
    }
    scene.behavior.addCharacter(character, false, {
      animation: animation,
      duration: duration,
      easing: easing,
      motionBlur: motionBlur
    });
    if (((ref5 = this.params.viewport) != null ? ref5.type : void 0) === "ui") {
      character.viewport = Graphics.viewport;
    }
    return gs.GameNotifier.postMinorChange();
  };


  /**
  * @method commandCharacterJoinScene
  * @protected
   */

  Component_CommandInterpreter.prototype.commandCharacterJoinScene = function() {
    var angle, animation, bitmap, character, defaults, duration, easing, flags, isLocked, mirror, motionBlur, origin, p, record, ref, ref1, ref2, ref3, ref4, scene, x, y, zIndex, zoom;
    defaults = GameManager.defaults.character;
    flags = this.params.fieldFlags || {};
    isLocked = gs.CommandFieldFlags.isLocked;
    scene = SceneManager.scene;
    record = RecordManager.characters[this.params.characterId];
    if (!record || scene.characters.first(function(v) {
      return !v.disposed && v.rid === record.index && !v.disposed;
    })) {
      return;
    }
    character = new vn.Object_Character(record, null, scene);
    character.expression = RecordManager.characterExpressions[((ref = this.params.expressionId) != null ? ref : record.defaultExpressionId) || 0];
    if (character.expression != null) {
      bitmap = ResourceManager.getBitmap("Graphics/Characters/" + ((ref1 = character.expression.idle[0]) != null ? ref1.resource.name : void 0));
    }
    mirror = false;
    angle = 0;
    zoom = 1;
    if (this.params.positionType === 1) {
      x = this.interpreter.numberValueOf(this.params.position.x);
      y = this.interpreter.numberValueOf(this.params.position.y);
      mirror = this.params.position.horizontalFlip;
      angle = this.params.position.angle || 0;
      zoom = ((ref2 = this.params.position.data) != null ? ref2.zoom : void 0) || 1;
    } else if (this.params.positionType === 2) {
      x = this.interpreter.numberValueOf(this.params.position.x);
      y = this.interpreter.numberValueOf(this.params.position.y);
      mirror = false;
      angle = 0;
      zoom = 1;
    }
    easing = !isLocked(flags["easing.type"]) ? gs.Easings.fromValues(this.interpreter.numberValueOf(this.params.easing.type), this.params.easing.inOut) : gs.Easings.fromObject(defaults.appearEasing);
    duration = !isLocked(flags.duration) ? this.interpreter.durationValueOf(this.params.duration) : defaults.appearDuration;
    origin = !isLocked(flags.origin) ? this.params.origin : defaults.origin;
    zIndex = !isLocked(flags.zOrder) ? this.interpreter.numberValueOf(this.params.zOrder) : defaults.zOrder;
    animation = !isLocked(flags["animation.type"]) ? this.params.animation : defaults.appearAnimation;
    motionBlur = !isLocked(flags["motionBlur.enabled"]) ? this.params.motionBlur : defaults.motionBlur;
    if (this.params.waitForCompletion && !(duration === 0 || this.interpreter.isInstantSkip())) {
      this.interpreter.isWaiting = true;
      this.interpreter.waitCounter = duration;
    }
    if (character.expression != null) {
      bitmap = ResourceManager.getBitmap("Graphics/Characters/" + ((ref3 = character.expression.idle[0]) != null ? ref3.resource.name : void 0));
      if (this.params.origin === 1 && (bitmap != null)) {
        x += (bitmap.width * zoom - bitmap.width) / 2;
        y += (bitmap.height * zoom - bitmap.height) / 2;
      }
    }
    character.mirror = mirror;
    character.anchor.x = !origin ? 0 : 0.5;
    character.anchor.y = !origin ? 0 : 0.5;
    character.zoom.x = zoom;
    character.zoom.y = zoom;
    character.dstRect.x = x;
    character.dstRect.y = y;
    character.zIndex = zIndex || 200;
    character.blendMode = this.interpreter.numberValueOf(this.params.blendMode);
    character.angle = angle;
    character.setup();
    character.update();
    if (this.params.positionType === 0) {
      p = this.interpreter.predefinedObjectPosition(this.params.predefinedPositionId, character, this.params);
      character.dstRect.x = p.x;
      character.dstRect.y = p.y;
    }
    scene.behavior.addCharacter(character, false, {
      animation: animation,
      duration: duration,
      easing: easing,
      motionBlur: motionBlur
    });
    if (((ref4 = this.params.viewport) != null ? ref4.type : void 0) === "ui") {
      character.viewport = Graphics.viewport;
    }
    return gs.GameNotifier.postMinorChange();
  };


  /**
  * @method commandCharacterExitScene
  * @protected
   */

  Component_CommandInterpreter.prototype.commandCharacterExitScene = function(defaults) {
    var animation, character, duration, easing, flags, isLocked, scene;
    defaults = defaults || GameManager.defaults.character;
    flags = this.params.fieldFlags || {};
    isLocked = gs.CommandFieldFlags.isLocked;
    scene = SceneManager.scene;
    character = scene.characters.first((function(_this) {
      return function(v) {
        return !v.disposed && v.rid === _this.params.characterId;
      };
    })(this));
    easing = !isLocked(flags["easing.type"]) ? gs.Easings.fromValues(this.interpreter.numberValueOf(this.params.easing.type), this.params.easing.inOut) : gs.Easings.fromObject(defaults.disappearEasing);
    duration = !isLocked(flags.duration) ? this.interpreter.durationValueOf(this.params.duration) : defaults.disappearDuration;
    animation = !isLocked(flags["animation.type"]) ? this.params.animation : defaults.disappearAnimation;
    if (this.params.waitForCompletion && !(duration === 0 || this.interpreter.isInstantSkip())) {
      this.interpreter.isWaiting = true;
      this.interpreter.waitCounter = duration;
    }
    scene.behavior.removeCharacter(character, {
      animation: animation,
      duration: duration,
      easing: easing
    });
    return gs.GameNotifier.postMinorChange();
  };


  /**
  * @method commandCharacterChangeExpression
  * @protected
   */

  Component_CommandInterpreter.prototype.commandCharacterChangeExpression = function() {
    var animation, character, defaults, duration, easing, expression, flags, isLocked, scene;
    scene = SceneManager.scene;
    character = scene.characters.first((function(_this) {
      return function(v) {
        return !v.disposed && v.rid === _this.params.characterId;
      };
    })(this));
    if (character == null) {
      return;
    }
    defaults = GameManager.defaults.character;
    flags = this.params.fieldFlags || {};
    isLocked = gs.CommandFieldFlags.isLocked;
    duration = !isLocked(flags.duration) ? this.interpreter.durationValueOf(this.params.duration) : defaults.expressionDuration;
    expression = RecordManager.characterExpressions[this.params.expressionId || 0];
    easing = !isLocked(flags["easing.type"]) ? gs.Easings.fromObject(this.params.easing) : gs.Easings.fromObject(defaults.changeEasing);
    animation = !isLocked(flags["animation.type"]) ? this.params.animation : defaults.changeAnimation;
    character.behavior.changeExpression(expression, this.params.animation, easing, duration);
    if (this.params.waitForCompletion && !(duration === 0 || this.interpreter.isInstantSkip())) {
      this.interpreter.isWaiting = true;
      this.interpreter.waitCounter = duration;
    }
    return gs.GameNotifier.postMinorChange();
  };


  /**
  * @method commandCharacterSetParameter
  * @protected
   */

  Component_CommandInterpreter.prototype.commandCharacterSetParameter = function() {
    var params, value;
    params = GameManager.characterParams[this.interpreter.stringValueOf(this.params.characterId)];
    if ((params == null) || (this.params.param == null)) {
      return;
    }
    switch (this.params.valueType) {
      case 0:
        switch (this.params.param.type) {
          case 0:
            return params[this.params.param.name] = this.interpreter.numberValueOf(this.params.numberValue);
          case 1:
            return params[this.params.param.name] = this.interpreter.numberValueOf(this.params.numberValue) > 0;
          case 2:
            return params[this.params.param.name] = this.interpreter.numberValueOf(this.params.numberValue).toString();
        }
        break;
      case 1:
        switch (this.params.param.type) {
          case 0:
            value = this.interpreter.booleanValueOf(this.params.switchValue);
            return params[this.params.param.name] = value ? 1 : 0;
          case 1:
            return params[this.params.param.name] = this.interpreter.booleanValueOf(this.params.switchValue);
          case 2:
            value = this.interpreter.booleanValueOf(this.params.switchValue);
            return params[this.params.param.name] = value ? "ON" : "OFF";
        }
        break;
      case 2:
        switch (this.params.param.type) {
          case 0:
            value = this.interpreter.stringValueOf(this.params.textValue);
            return params[this.params.param.name] = value.length;
          case 1:
            return params[this.params.param.name] = this.interpreter.stringValueOf(this.params.textValue) === "ON";
          case 2:
            return params[this.params.param.name] = this.interpreter.stringValueOf(this.params.textValue);
        }
    }
  };


  /**
  * @method commandCharacterGetParameter
  * @protected
   */

  Component_CommandInterpreter.prototype.commandCharacterGetParameter = function() {
    var params, value;
    params = GameManager.characterParams[this.interpreter.stringValueOf(this.params.characterId)];
    if ((params == null) || (this.params.param == null)) {
      return;
    }
    value = params[this.params.param.name];
    switch (this.params.valueType) {
      case 0:
        switch (this.params.param.type) {
          case 0:
            return this.interpreter.setNumberValueTo(this.params.targetVariable, value);
          case 1:
            return this.interpreter.setNumberValueTo(this.params.targetVariable, value ? 1 : 0);
          case 2:
            return this.interpreter.setNumberValueTo(this.params.targetVariable, value != null ? value.length : 0);
        }
        break;
      case 1:
        switch (this.params.param.type) {
          case 0:
            return this.interpreter.setBooleanValueTo(this.params.targetVariable, value > 0);
          case 1:
            return this.interpreter.setBooleanValueTo(this.params.targetVariable, value);
          case 2:
            return this.interpreter.setBooleanValueTo(this.params.targetVariable, value === "ON");
        }
        break;
      case 2:
        switch (this.params.param.type) {
          case 0:
            return this.interpreter.setStringValueTo(this.params.targetVariable, value != null ? value.toString() : "");
          case 1:
            return this.interpreter.setStringValueTo(this.params.targetVariable, value ? "ON" : "OFF");
          case 2:
            return this.interpreter.setStringValueTo(this.params.targetVariable, value);
        }
    }
  };


  /**
  * @method commandCharacterMotionBlur
  * @protected
   */

  Component_CommandInterpreter.prototype.commandCharacterMotionBlur = function() {
    var character, scene;
    scene = SceneManager.scene;
    character = scene.characters.first((function(_this) {
      return function(v) {
        return !v.disposed && v.rid === _this.params.characterId;
      };
    })(this));
    if (character == null) {
      return;
    }
    return character.motionBlur.set(this.params.motionBlur);
  };


  /**
  * @method commandCharacterDefaults
  * @protected
   */

  Component_CommandInterpreter.prototype.commandCharacterDefaults = function() {
    var defaults, flags, isLocked;
    defaults = GameManager.defaults.character;
    flags = this.params.fieldFlags || {};
    isLocked = gs.CommandFieldFlags.isLocked;
    if (!isLocked(flags.appearDuration)) {
      defaults.appearDuration = this.interpreter.durationValueOf(this.params.appearDuration);
    }
    if (!isLocked(flags.disappearDuration)) {
      defaults.disappearDuration = this.interpreter.durationValueOf(this.params.disappearDuration);
    }
    if (!isLocked(flags.expressionDuration)) {
      defaults.expressionDuration = this.interpreter.durationValueOf(this.params.expressionDuration);
    }
    if (!isLocked(flags.zOrder)) {
      defaults.zOrder = this.interpreter.numberValueOf(this.params.zOrder);
    }
    if (!isLocked(flags["appearEasing.type"])) {
      defaults.appearEasing = this.params.appearEasing;
    }
    if (!isLocked(flags["appearAnimation.type"])) {
      defaults.appearAnimation = this.params.appearAnimation;
    }
    if (!isLocked(flags["disappearEasing.type"])) {
      defaults.disappearEasing = this.params.disappearEasing;
    }
    if (!isLocked(flags["disappearAnimation.type"])) {
      defaults.disappearAnimation = this.params.disappearAnimation;
    }
    if (!isLocked(flags["motionBlur.enabled"])) {
      defaults.motionBlur = this.params.motionBlur;
    }
    if (!isLocked(flags.origin)) {
      return defaults.origin = this.params.origin;
    }
  };


  /**
  * @method commandCharacterEffect
  * @protected
   */

  Component_CommandInterpreter.prototype.commandCharacterEffect = function() {
    var character, characterId, scene;
    scene = SceneManager.scene;
    characterId = this.interpreter.stringValueOf(this.params.characterId);
    character = scene.characters.first(function(c) {
      return !c.disposed && c.rid === characterId;
    });
    if (character == null) {
      return;
    }
    this.interpreter.objectEffect(character, this.params);
    return gs.GameNotifier.postMinorChange();
  };


  /**
  * @method commandFlashCharacter
  * @protected
   */

  Component_CommandInterpreter.prototype.commandFlashCharacter = function() {
    var character, duration, scene;
    scene = SceneManager.scene;
    character = scene.characters.first((function(_this) {
      return function(v) {
        return !v.disposed && v.rid === _this.params.characterId;
      };
    })(this));
    if (!character) {
      return;
    }
    duration = this.interpreter.durationValueOf(this.params.duration);
    character.animator.flash(new Color(this.params.color), duration);
    if (this.params.waitForCompletion && !(duration === 0 || this.interpreter.isInstantSkip())) {
      this.interpreter.isWaiting = true;
      this.interpreter.waitCounter = duration;
    }
    return gs.GameNotifier.postMinorChange();
  };


  /**
  * @method commandTintCharacter
  * @protected
   */

  Component_CommandInterpreter.prototype.commandTintCharacter = function() {
    var character, duration, easing, scene;
    scene = SceneManager.scene;
    character = scene.characters.first((function(_this) {
      return function(v) {
        return !v.disposed && v.rid === _this.params.characterId;
      };
    })(this));
    easing = gs.Easings.fromValues(this.interpreter.numberValueOf(this.params.easing.type), this.params.easing.inOut);
    if (!character) {
      return;
    }
    duration = this.interpreter.durationValueOf(this.params.duration);
    character.animator.tintTo(this.params.tone, duration, easing);
    if (this.params.waitForCompletion && !(duration === 0 || this.interpreter.isInstantSkip())) {
      this.interpreter.isWaiting = true;
      this.interpreter.waitCounter = duration;
    }
    return gs.GameNotifier.postMinorChange();
  };


  /**
  * @method commandZoomCharacter
  * @protected
   */

  Component_CommandInterpreter.prototype.commandZoomCharacter = function() {
    var character, scene;
    scene = SceneManager.scene;
    character = scene.characters.first((function(_this) {
      return function(v) {
        return !v.disposed && v.rid === _this.params.characterId;
      };
    })(this));
    if (character == null) {
      return;
    }
    this.interpreter.zoomObject(character, this.params);
    return gs.GameNotifier.postMinorChange();
  };


  /**
  * @method commandRotateCharacter
  * @protected
   */

  Component_CommandInterpreter.prototype.commandRotateCharacter = function() {
    var character, scene;
    scene = SceneManager.scene;
    character = scene.characters.first((function(_this) {
      return function(v) {
        return !v.disposed && v.rid === _this.params.characterId;
      };
    })(this));
    if (character == null) {
      return;
    }
    this.interpreter.rotateObject(character, this.params);
    return gs.GameNotifier.postMinorChange();
  };


  /**
  * @method commandBlendCharacter
  * @protected
   */

  Component_CommandInterpreter.prototype.commandBlendCharacter = function() {
    var character;
    character = SceneManager.scene.characters.first((function(_this) {
      return function(v) {
        return !v.disposed && v.rid === _this.params.characterId;
      };
    })(this));
    if (character == null) {
      return;
    }
    this.interpreter.blendObject(character, this.params);
    return gs.GameNotifier.postMinorChange();
  };


  /**
  * @method commandShakeCharacter
  * @protected
   */

  Component_CommandInterpreter.prototype.commandShakeCharacter = function() {
    var character;
    character = SceneManager.scene.characters.first((function(_this) {
      return function(v) {
        return !v.disposed && v.rid === _this.params.characterId;
      };
    })(this));
    if (character == null) {
      return;
    }
    this.interpreter.shakeObject(character, this.params);
    return gs.GameNotifier.postMinorChange();
  };


  /**
  * @method commandMaskCharacter
  * @protected
   */

  Component_CommandInterpreter.prototype.commandMaskCharacter = function() {
    var character, scene;
    scene = SceneManager.scene;
    character = scene.characters.first((function(_this) {
      return function(v) {
        return !v.disposed && v.rid === _this.params.characterId;
      };
    })(this));
    if (character == null) {
      return;
    }
    this.interpreter.maskObject(character, this.params);
    return gs.GameNotifier.postMinorChange();
  };


  /**
  * @method commandMoveCharacter
  * @protected
   */

  Component_CommandInterpreter.prototype.commandMoveCharacter = function() {
    var character, scene;
    scene = SceneManager.scene;
    character = scene.characters.first((function(_this) {
      return function(v) {
        return !v.disposed && v.rid === _this.params.characterId;
      };
    })(this));
    if (character == null) {
      return;
    }
    this.interpreter.moveObject(character, this.params.position, this.params);
    return gs.GameNotifier.postMinorChange();
  };


  /**
  * @method commandMoveCharacterPath
  * @protected
   */

  Component_CommandInterpreter.prototype.commandMoveCharacterPath = function() {
    var character, scene;
    scene = SceneManager.scene;
    character = scene.characters.first((function(_this) {
      return function(v) {
        return !v.disposed && v.rid === _this.params.characterId;
      };
    })(this));
    if (character == null) {
      return;
    }
    this.interpreter.moveObjectPath(character, this.params.path, this.params);
    return gs.GameNotifier.postMinorChange();
  };


  /**
  * @method commandShakeBackground
  * @protected
   */

  Component_CommandInterpreter.prototype.commandShakeBackground = function() {
    var background;
    background = SceneManager.scene.backgrounds[this.interpreter.numberValueOf(this.params.layer)];
    if (background == null) {
      return;
    }
    this.interpreter.shakeObject(background, this.params);
    return gs.GameNotifier.postMinorChange();
  };


  /**
  * @method commandScrollBackground
  * @protected
   */

  Component_CommandInterpreter.prototype.commandScrollBackground = function() {
    var duration, easing, horizontalSpeed, layer, ref, scene, verticalSpeed;
    scene = SceneManager.scene;
    duration = this.interpreter.durationValueOf(this.params.duration);
    horizontalSpeed = this.interpreter.numberValueOf(this.params.horizontalSpeed);
    verticalSpeed = this.interpreter.numberValueOf(this.params.verticalSpeed);
    easing = gs.Easings.fromValues(this.interpreter.numberValueOf(this.params.easing.type), this.params.easing.inOut);
    layer = this.interpreter.numberValueOf(this.params.layer);
    if (this.params.waitForCompletion && !(duration === 0 || this.interpreter.isInstantSkip())) {
      this.interpreter.isWaiting = true;
      this.interpreter.waitCounter = duration;
    }
    if ((ref = scene.backgrounds[layer]) != null) {
      ref.animator.move(horizontalSpeed, verticalSpeed, duration, easing);
    }
    return gs.GameNotifier.postMinorChange();
  };


  /**
  * @method commandScrollBackgroundTo
  * @protected
   */

  Component_CommandInterpreter.prototype.commandScrollBackgroundTo = function() {
    var background, duration, easing, layer, p, scene, x, y;
    scene = SceneManager.scene;
    duration = this.interpreter.durationValueOf(this.params.duration);
    x = this.interpreter.numberValueOf(this.params.background.location.x);
    y = this.interpreter.numberValueOf(this.params.background.location.y);
    easing = gs.Easings.fromValues(this.interpreter.numberValueOf(this.params.easing.type), this.params.easing.inOut);
    layer = this.interpreter.numberValueOf(this.params.layer);
    background = scene.backgrounds[layer];
    if (!background) {
      return;
    }
    if (this.params.waitForCompletion && !(duration === 0 || this.interpreter.isInstantSkip())) {
      this.interpreter.isWaiting = true;
      this.interpreter.waitCounter = duration;
    }
    if (this.params.positionType === 0) {
      p = this.interpreter.predefinedObjectPosition(this.params.predefinedPositionId, background, this.params);
      x = p.x;
      y = p.y;
    }
    background.animator.moveTo(x, y, duration, easing);
    return gs.GameNotifier.postMinorChange();
  };


  /**
  * @method commandScrollBackgroundPath
  * @protected
   */

  Component_CommandInterpreter.prototype.commandScrollBackgroundPath = function() {
    var background, scene;
    scene = SceneManager.scene;
    background = scene.backgrounds[this.interpreter.numberValueOf(this.params.layer)];
    if (background == null) {
      return;
    }
    this.interpreter.moveObjectPath(background, this.params.path, this.params);
    return gs.GameNotifier.postMinorChange();
  };


  /**
  * @method commandMaskBackground
  * @protected
   */

  Component_CommandInterpreter.prototype.commandMaskBackground = function() {
    var background, scene;
    scene = SceneManager.scene;
    background = scene.backgrounds[this.interpreter.numberValueOf(this.params.layer)];
    if (background == null) {
      return;
    }
    this.interpreter.maskObject(background, this.params);
    return gs.GameNotifier.postMinorChange();
  };


  /**
  * @method commandZoomBackground
  * @protected
   */

  Component_CommandInterpreter.prototype.commandZoomBackground = function() {
    var duration, easing, layer, ref, scene, x, y;
    scene = SceneManager.scene;
    duration = this.interpreter.durationValueOf(this.params.duration);
    x = this.interpreter.numberValueOf(this.params.zooming.x);
    y = this.interpreter.numberValueOf(this.params.zooming.y);
    easing = gs.Easings.fromValues(this.interpreter.numberValueOf(this.params.easing.type), this.params.easing.inOut);
    layer = this.interpreter.numberValueOf(this.params.layer);
    if (this.params.waitForCompletion && !(duration === 0 || this.interpreter.isInstantSkip())) {
      this.interpreter.isWaiting = true;
      this.interpreter.waitCounter = duration;
    }
    if ((ref = scene.backgrounds[layer]) != null) {
      ref.animator.zoomTo(x / 100, y / 100, duration, easing);
    }
    return gs.GameNotifier.postMinorChange();
  };


  /**
  * @method commandRotateBackground
  * @protected
   */

  Component_CommandInterpreter.prototype.commandRotateBackground = function() {
    var background, scene;
    scene = SceneManager.scene;
    background = scene.backgrounds[this.interpreter.numberValueOf(this.params.layer)];
    if (background) {
      this.interpreter.rotateObject(background, this.params);
    }
    return gs.GameNotifier.postMinorChange();
  };


  /**        
  * @method commandTintBackground
  * @protected
   */

  Component_CommandInterpreter.prototype.commandTintBackground = function() {
    var background, duration, easing, layer, scene;
    scene = SceneManager.scene;
    layer = this.interpreter.numberValueOf(this.params.layer);
    background = scene.backgrounds[layer];
    if (background == null) {
      return;
    }
    duration = this.interpreter.durationValueOf(this.params.duration);
    easing = gs.Easings.fromObject(this.params.easing);
    background.animator.tintTo(this.params.tone, duration, easing);
    this.interpreter.waitForCompletion(background, this.params);
    return gs.GameNotifier.postMinorChange();
  };


  /**
  * @method commandBlendBackground
  * @protected
   */

  Component_CommandInterpreter.prototype.commandBlendBackground = function() {
    var background, layer;
    layer = this.interpreter.numberValueOf(this.params.layer);
    background = SceneManager.scene.backgrounds[layer];
    if (background == null) {
      return;
    }
    this.interpreter.blendObject(background, this.params);
    return gs.GameNotifier.postMinorChange();
  };


  /**
  * @method commandBackgroundEffect
  * @protected
   */

  Component_CommandInterpreter.prototype.commandBackgroundEffect = function() {
    var background, layer;
    layer = this.interpreter.numberValueOf(this.params.layer);
    background = SceneManager.scene.backgrounds[layer];
    if (background == null) {
      return;
    }
    this.interpreter.objectEffect(background, this.params);
    return gs.GameNotifier.postMinorChange();
  };


  /**
  * @method commandBackgroundDefaults
  * @protected
   */

  Component_CommandInterpreter.prototype.commandBackgroundDefaults = function() {
    var defaults, flags, isLocked;
    defaults = GameManager.defaults.background;
    flags = this.params.fieldFlags || {};
    isLocked = gs.CommandFieldFlags.isLocked;
    if (!isLocked(flags.duration)) {
      defaults.duration = this.interpreter.durationValueOf(this.params.duration);
    }
    if (!isLocked(flags.zOrder)) {
      defaults.zOrder = this.interpreter.numberValueOf(this.params.zOrder);
    }
    if (!isLocked(flags["easing.type"])) {
      defaults.easing = this.params.easing;
    }
    if (!isLocked(flags["animation.type"])) {
      defaults.animation = this.params.animation;
    }
    if (!isLocked(flags.origin)) {
      defaults.origin = this.params.origin;
    }
    if (!isLocked(flags.loopHorizontal)) {
      defaults.loopHorizontal = this.params.loopHorizontal;
    }
    if (!isLocked(flags.loopVertical)) {
      return defaults.loopVertical = this.params.loopVertical;
    }
  };


  /**
  * @method commandBackgroundMotionBlur
  * @protected
   */

  Component_CommandInterpreter.prototype.commandBackgroundMotionBlur = function() {
    var background, layer;
    layer = this.interpreter.numberValueOf(this.params.layer);
    background = SceneManager.scene.backgrounds[layer];
    if (background == null) {
      return;
    }
    return background.motionBlur.set(this.params.motionBlur);
  };


  /**
  * @method commandChangeBackground
  * @protected
   */

  Component_CommandInterpreter.prototype.commandChangeBackground = function() {
    var animation, defaults, duration, easing, flags, isLocked, layer, loopH, loopV, origin, ref, scene, zIndex;
    defaults = GameManager.defaults.background;
    scene = SceneManager.scene;
    flags = this.params.fieldFlags || {};
    isLocked = gs.CommandFieldFlags.isLocked;
    duration = !isLocked(flags.duration) ? this.interpreter.durationValueOf(this.params.duration) : defaults.duration;
    loopH = !isLocked(flags.loopHorizontal) ? this.params.loopHorizontal : defaults.loopHorizontal;
    loopV = !isLocked(flags.loopVertical) ? this.params.loopVertical : defaults.loopVertical;
    animation = !isLocked(flags["animation.type"]) ? this.params.animation : defaults.animation;
    origin = !isLocked(flags.origin) ? this.params.origin : defaults.origin;
    zIndex = !isLocked(flags.zOrder) ? this.interpreter.numberValueOf(this.params.zOrder) : defaults.zOrder;
    if (this.params.waitForCompletion && !(duration === 0 || this.interpreter.isInstantSkip())) {
      this.interpreter.isWaiting = true;
      this.interpreter.waitCounter = duration;
    }
    easing = !isLocked(flags["easing.type"]) ? gs.Easings.fromObject(this.params.easing) : gs.Easings.fromObject(defaults.easing);
    layer = this.interpreter.numberValueOf(this.params.layer);
    scene.behavior.changeBackground(this.params.graphic, false, animation, easing, duration, 0, 0, layer, loopH, loopV);
    if (scene.backgrounds[layer]) {
      if (((ref = this.params.viewport) != null ? ref.type : void 0) === "ui") {
        scene.backgrounds[layer].viewport = Graphics.viewport;
      }
      scene.backgrounds[layer].anchor.x = origin === 0 ? 0 : 0.5;
      scene.backgrounds[layer].anchor.y = origin === 0 ? 0 : 0.5;
      scene.backgrounds[layer].blendMode = this.interpreter.numberValueOf(this.params.blendMode);
      scene.backgrounds[layer].zIndex = zIndex + layer;
      if (origin === 1) {
        scene.backgrounds[layer].dstRect.x = scene.backgrounds[layer].dstRect.x;
        scene.backgrounds[layer].dstRect.y = scene.backgrounds[layer].dstRect.y;
      }
      scene.backgrounds[layer].setup();
      scene.backgrounds[layer].update();
    }
    return gs.GameNotifier.postMinorChange();
  };


  /**
  * @method commandCallScene
  * @protected
   */

  Component_CommandInterpreter.prototype.commandCallScene = function() {
    return this.interpreter.callScene(this.interpreter.stringValueOf(this.params.scene.uid || this.params.scene));
  };


  /**
  * @method commandChangeScene
  * @protected
   */

  Component_CommandInterpreter.prototype.commandChangeScene = function() {
    var flags, isLocked, k, len, len1, n, newScene, picture, ref, ref1, scene, uid, video;
    if (GameManager.inLivePreview) {
      return;
    }
    GameManager.tempSettings.skip = false;
    if (!this.params.savePrevious) {
      SceneManager.clear();
    }
    scene = SceneManager.scene;
    if (!this.params.erasePictures && !this.params.savePrevious) {
      scene.removeObject(scene.pictureContainer);
      ref = scene.pictures;
      for (k = 0, len = ref.length; k < len; k++) {
        picture = ref[k];
        if (picture) {
          ResourceManager.context.remove("Graphics/Pictures/" + picture.image);
        }
      }
    }
    if (!this.params.eraseTexts && !this.params.savePrevious) {
      scene.removeObject(scene.textContainer);
    }
    if (!this.params.eraseVideos && !this.params.savePrevious) {
      scene.removeObject(scene.videoContainer);
      ref1 = scene.videos;
      for (n = 0, len1 = ref1.length; n < len1; n++) {
        video = ref1[n];
        if (video) {
          ResourceManager.context.remove("Movies/" + video.video);
        }
      }
    }
    if (this.params.scene) {
      if (this.params.savePrevious) {
        GameManager.sceneData = {
          uid: uid = this.params.scene.uid,
          pictures: [],
          texts: [],
          videos: []
        };
      } else {
        GameManager.sceneData = {
          uid: uid = this.params.scene.uid,
          pictures: scene.pictureContainer.subObjectsByDomain,
          texts: scene.textContainer.subObjectsByDomain,
          videos: scene.videoContainer.subObjectsByDomain
        };
      }
      flags = this.params.fieldFlags || {};
      isLocked = gs.CommandFieldFlags.isLocked;
      newScene = new vn.Object_Scene();
      if (this.params.savePrevious) {
        newScene.sceneData = {
          uid: uid = this.params.scene.uid,
          pictures: [],
          texts: [],
          videos: [],
          backlog: GameManager.backlog
        };
      } else {
        newScene.sceneData = {
          uid: uid = this.params.scene.uid,
          pictures: scene.pictureContainer.subObjectsByDomain,
          texts: scene.textContainer.subObjectsByDomain,
          videos: scene.videoContainer.subObjectsByDomain
        };
      }
      SceneManager.switchTo(newScene, this.params.savePrevious, (function(_this) {
        return function() {
          return _this.interpreter.isWaiting = false;
        };
      })(this));
    } else {
      SceneManager.switchTo(null);
    }
    return this.interpreter.isWaiting = true;
  };


  /**
  * @method commandReturnToPreviousScene
  * @protected
   */

  Component_CommandInterpreter.prototype.commandReturnToPreviousScene = function() {
    if (GameManager.inLivePreview) {
      return;
    }
    SceneManager.returnToPrevious((function(_this) {
      return function() {
        return _this.interpreter.isWaiting = false;
      };
    })(this));
    return this.interpreter.isWaiting = true;
  };


  /**
  * @method commandSwitchToLayout
  * @protected
   */

  Component_CommandInterpreter.prototype.commandSwitchToLayout = function() {
    var scene;
    if (GameManager.inLivePreview) {
      return;
    }
    if (ui.UIManager.layouts[this.params.layout.name] != null) {
      scene = new gs.Object_Layout(this.params.layout.name);
      SceneManager.switchTo(scene, this.params.savePrevious, (function(_this) {
        return function() {
          return _this.interpreter.isWaiting = false;
        };
      })(this));
      return this.interpreter.isWaiting = true;
    }
  };


  /**
  * @method commandChangeTransition
  * @protected
   */

  Component_CommandInterpreter.prototype.commandChangeTransition = function() {
    var flags, isLocked;
    flags = this.params.fieldFlags || {};
    isLocked = gs.CommandFieldFlags.isLocked;
    if (!isLocked(flags.duration)) {
      SceneManager.transitionData.duration = this.interpreter.durationValueOf(this.params.duration);
    }
    if (!isLocked(flags.graphic)) {
      SceneManager.transitionData.graphic = this.params.graphic;
    }
    if (!isLocked(flags.vague)) {
      return SceneManager.transitionData.vague = this.params.vague;
    }
  };


  /**
  * @method commandFreezeScreen
  * @protected
   */

  Component_CommandInterpreter.prototype.commandFreezeScreen = function() {
    return Graphics.freeze();
  };


  /**
  * @method commandScreenTransition
  * @protected
   */

  Component_CommandInterpreter.prototype.commandScreenTransition = function() {
    var bitmap, defaults, duration, flags, graphicName, isLocked, ref, ref1, vague;
    defaults = GameManager.defaults.scene;
    flags = this.params.fieldFlags || {};
    isLocked = gs.CommandFieldFlags.isLocked;
    graphicName = !isLocked(flags.graphic) ? (ref = this.params.graphic) != null ? ref.name : void 0 : (ref1 = SceneManager.transitionData.graphic) != null ? ref1.name : void 0;
    if (graphicName) {
      bitmap = !isLocked(flags.graphic) ? ResourceManager.getBitmap("Graphics/Masks/" + graphicName) : ResourceManager.getBitmap("Graphics/Masks/" + graphicName);
    }
    vague = !isLocked(flags.vague) ? this.interpreter.numberValueOf(this.params.vague) : SceneManager.transitionData.vague;
    duration = !isLocked(flags.duration) ? this.interpreter.durationValueOf(this.params.duration) : SceneManager.transitionData.duration;
    this.interpreter.isWaiting = !GameManager.inLivePreview;
    this.interpreter.waitCounter = duration;
    return Graphics.transition(duration, bitmap, vague);
  };


  /**
  * @method commandShakeScreen
  * @protected
   */

  Component_CommandInterpreter.prototype.commandShakeScreen = function() {
    if (SceneManager.scene.viewport == null) {
      return;
    }
    this.interpreter.shakeObject(SceneManager.scene.viewport, this.params);
    return gs.GameNotifier.postMinorChange();
  };


  /**
  * @method commandTintScreen
  * @protected
   */

  Component_CommandInterpreter.prototype.commandTintScreen = function() {
    var duration;
    duration = this.interpreter.durationValueOf(this.params.duration);
    SceneManager.scene.viewport.animator.tintTo(new Tone(this.params.tone), duration, gs.Easings.EASE_LINEAR[0]);
    if (this.params.waitForCompletion && duration > 0) {
      this.interpreter.isWaiting = true;
      this.interpreter.waitCounter = duration;
    }
    return gs.GameNotifier.postMinorChange();
  };


  /**
  * @method commandZoomScreen
  * @protected
   */

  Component_CommandInterpreter.prototype.commandZoomScreen = function() {
    var duration, easing, scene;
    easing = gs.Easings.fromObject(this.params.easing);
    duration = this.interpreter.durationValueOf(this.params.duration);
    scene = SceneManager.scene;
    SceneManager.scene.viewport.anchor.x = 0.5;
    SceneManager.scene.viewport.anchor.y = 0.5;
    SceneManager.scene.viewport.animator.zoomTo(this.interpreter.numberValueOf(this.params.zooming.x) / 100, this.interpreter.numberValueOf(this.params.zooming.y) / 100, duration, easing);
    this.interpreter.waitForCompletion(null, this.params);
    return gs.GameNotifier.postMinorChange();
  };


  /**
  * @method commandPanScreen
  * @protected
   */

  Component_CommandInterpreter.prototype.commandPanScreen = function() {
    var duration, easing, scene, viewport;
    scene = SceneManager.scene;
    duration = this.interpreter.durationValueOf(this.params.duration);
    easing = gs.Easings.fromObject(this.params.easing);
    this.interpreter.settings.screen.pan.x -= this.params.position.x;
    this.interpreter.settings.screen.pan.y -= this.params.position.y;
    viewport = SceneManager.scene.viewport;
    viewport.animator.scrollTo(-this.params.position.x + viewport.dstRect.x, -this.params.position.y + viewport.dstRect.y, duration, easing);
    this.interpreter.waitForCompletion(null, this.params);
    return gs.GameNotifier.postMinorChange();
  };


  /**
  * @method commandRotateScreen
  * @protected
   */

  Component_CommandInterpreter.prototype.commandRotateScreen = function() {
    var duration, easing, pan, scene;
    scene = SceneManager.scene;
    easing = gs.Easings.fromObject(this.params.easing);
    duration = this.interpreter.durationValueOf(this.params.duration);
    pan = this.interpreter.settings.screen.pan;
    SceneManager.scene.viewport.anchor.x = 0.5;
    SceneManager.scene.viewport.anchor.y = 0.5;
    SceneManager.scene.viewport.animator.rotate(this.params.direction, this.interpreter.numberValueOf(this.params.speed) / 100, duration, easing);
    this.interpreter.waitForCompletion(null, this.params);
    return gs.GameNotifier.postMinorChange();
  };


  /**
  * @method commandFlashScreen
  * @protected
   */

  Component_CommandInterpreter.prototype.commandFlashScreen = function() {
    var duration;
    duration = this.interpreter.durationValueOf(this.params.duration);
    SceneManager.scene.viewport.animator.flash(new Color(this.params.color), duration, gs.Easings.EASE_LINEAR[0]);
    if (this.params.waitForCompletion && duration !== 0) {
      this.interpreter.isWaiting = true;
      this.interpreter.waitCounter = duration;
    }
    return gs.GameNotifier.postMinorChange();
  };


  /**
  * @method commandScreenEffect
  * @protected
   */

  Component_CommandInterpreter.prototype.commandScreenEffect = function() {
    var duration, easing, flags, isLocked, scene, viewport, wobble, zOrder;
    scene = SceneManager.scene;
    flags = this.params.fieldFlags || {};
    isLocked = gs.CommandFieldFlags.isLocked;
    duration = this.interpreter.durationValueOf(this.params.duration);
    easing = gs.Easings.fromObject(this.params.easing);
    if (!gs.CommandFieldFlags.isLocked(flags.zOrder)) {
      zOrder = this.interpreter.numberValueOf(this.params.zOrder);
    } else {
      zOrder = SceneManager.scene.viewport.zIndex;
    }
    viewport = scene.viewportContainer.subObjects.first(function(v) {
      return v.zIndex === zOrder;
    });
    if (!viewport) {
      viewport = new gs.Object_Viewport();
      viewport.zIndex = zOrder;
      scene.viewportContainer.addObject(viewport);
    }
    switch (this.params.type) {
      case 0:
        viewport.animator.wobbleTo(this.params.wobble.power / 10000, this.params.wobble.speed / 100, duration, easing);
        wobble = viewport.effects.wobble;
        wobble.enabled = this.params.wobble.power > 0;
        wobble.vertical = this.params.wobble.orientation === 0 || this.params.wobble.orientation === 2;
        wobble.horizontal = this.params.wobble.orientation === 1 || this.params.wobble.orientation === 2;
        break;
      case 1:
        viewport.animator.blurTo(this.params.blur.power / 100, duration, easing);
        viewport.effects.blur.enabled = true;
        break;
      case 2:
        viewport.animator.pixelateTo(this.params.pixelate.size.width, this.params.pixelate.size.height, duration, easing);
        viewport.effects.pixelate.enabled = true;
    }
    if (this.params.waitForCompletion && duration !== 0) {
      this.interpreter.isWaiting = true;
      this.interpreter.waitCounter = duration;
    }
    return gs.GameNotifier.postMinorChange();
  };


  /**
  * @method commandVideoDefaults
  * @protected
   */

  Component_CommandInterpreter.prototype.commandVideoDefaults = function() {
    var defaults, flags, isLocked;
    defaults = GameManager.defaults.video;
    flags = this.params.fieldFlags || {};
    isLocked = gs.CommandFieldFlags.isLocked;
    if (!isLocked(flags.appearDuration)) {
      defaults.appearDuration = this.interpreter.durationValueOf(this.params.appearDuration);
    }
    if (!isLocked(flags.disappearDuration)) {
      defaults.disappearDuration = this.interpreter.durationValueOf(this.params.disappearDuration);
    }
    if (!isLocked(flags.zOrder)) {
      defaults.zOrder = this.interpreter.numberValueOf(this.params.zOrder);
    }
    if (!isLocked(flags["appearEasing.type"])) {
      defaults.appearEasing = this.params.appearEasing;
    }
    if (!isLocked(flags["appearAnimation.type"])) {
      defaults.appearAnimation = this.params.appearAnimation;
    }
    if (!isLocked(flags["disappearEasing.type"])) {
      defaults.disappearEasing = this.params.disappearEasing;
    }
    if (!isLocked(flags["disappearAnimation.type"])) {
      defaults.disappearAnimation = this.params.disappearAnimation;
    }
    if (!isLocked(flags["motionBlur.enabled"])) {
      defaults.motionBlur = this.params.motionBlur;
    }
    if (!isLocked(flags.origin)) {
      return defaults.origin = this.params.origin;
    }
  };


  /**
  * @method commandShowVideo
  * @protected
   */

  Component_CommandInterpreter.prototype.commandShowVideo = function() {
    var animation, defaults, duration, easing, flags, isLocked, number, origin, p, ref, ref1, ref2, scene, video, videos, x, y, zIndex;
    defaults = GameManager.defaults.video;
    flags = this.params.fieldFlags || {};
    isLocked = gs.CommandFieldFlags.isLocked;
    scene = SceneManager.scene;
    scene.behavior.changeVideoDomain(this.params.numberDomain);
    number = this.interpreter.numberValueOf(this.params.number);
    videos = scene.videos;
    if (videos[number] == null) {
      videos[number] = new gs.Object_Video();
    }
    x = this.interpreter.numberValueOf(this.params.position.x);
    y = this.interpreter.numberValueOf(this.params.position.y);
    easing = !isLocked(flags["easing.type"]) ? gs.Easings.fromValues(this.interpreter.numberValueOf(this.params.easing.type), this.params.easing.inOut) : gs.Easings.fromObject(defaults.appearEasing);
    duration = !isLocked(flags.duration) ? this.interpreter.durationValueOf(this.params.duration) : defaults.appearDuration;
    origin = !isLocked(flags.origin) ? this.params.origin : defaults.origin;
    zIndex = !isLocked(flags.zOrder) ? this.interpreter.numberValueOf(this.params.zOrder) : defaults.zOrder;
    animation = !isLocked(flags["animation.type"]) ? this.params.animation : defaults.appearAnimation;
    video = videos[number];
    video.domain = this.params.numberDomain;
    video.video = (ref = this.params.video) != null ? ref.name : void 0;
    video.loop = (ref1 = this.params.loop) != null ? ref1 : true;
    video.dstRect.x = x;
    video.dstRect.y = y;
    video.blendMode = this.interpreter.numberValueOf(this.params.blendMode);
    video.anchor.x = origin === 0 ? 0 : 0.5;
    video.anchor.y = origin === 0 ? 0 : 0.5;
    video.zIndex = zIndex || (1000 + number);
    if (((ref2 = this.params.viewport) != null ? ref2.type : void 0) === "scene") {
      video.viewport = SceneManager.scene.behavior.viewport;
    }
    video.update();
    if (this.params.positionType === 0) {
      p = this.interpreter.predefinedObjectPosition(this.params.predefinedPositionId, video, this.params);
      video.dstRect.x = p.x;
      video.dstRect.y = p.y;
    }
    video.animator.appear(x, y, animation, easing, duration);
    if (this.params.waitForCompletion && !(duration === 0 || this.interpreter.isInstantSkip())) {
      this.interpreter.isWaiting = true;
      this.interpreter.waitCounter = duration;
    }
    return gs.GameNotifier.postMinorChange();
  };


  /**
  * @method commandMoveVideo
  * @protected
   */

  Component_CommandInterpreter.prototype.commandMoveVideo = function() {
    var number, scene, video;
    scene = SceneManager.scene;
    scene.behavior.changeVideoDomain(this.params.numberDomain);
    number = this.interpreter.numberValueOf(this.params.number);
    video = scene.videos[number];
    if (video == null) {
      return;
    }
    this.interpreter.moveObject(video, this.params.picture.position, this.params);
    return gs.GameNotifier.postMinorChange();
  };


  /**
  * @method commandMoveVideoPath
  * @protected
   */

  Component_CommandInterpreter.prototype.commandMoveVideoPath = function() {
    var number, scene, video;
    scene = SceneManager.scene;
    scene.behavior.changeVideoDomain(this.params.numberDomain);
    number = this.interpreter.numberValueOf(this.params.number);
    video = scene.videos[number];
    if (video == null) {
      return;
    }
    this.interpreter.moveObjectPath(video, this.params);
    return gs.GameNotifier.postMinorChange();
  };


  /**
  * @method commandRotateVideo
  * @protected
   */

  Component_CommandInterpreter.prototype.commandRotateVideo = function() {
    var number, scene, video;
    scene = SceneManager.scene;
    scene.behavior.changeVideoDomain(this.params.numberDomain);
    number = this.interpreter.numberValueOf(this.params.number);
    video = scene.videos[number];
    if (video == null) {
      return;
    }
    this.interpreter.rotateObject(video, this.params);
    return gs.GameNotifier.postMinorChange();
  };


  /**
  * @method commandZoomVideo
  * @protected
   */

  Component_CommandInterpreter.prototype.commandZoomVideo = function() {
    var number, scene, video;
    scene = SceneManager.scene;
    scene.behavior.changeVideoDomain(this.params.numberDomain);
    number = this.interpreter.numberValueOf(this.params.number);
    video = scene.videos[number];
    if (video == null) {
      return;
    }
    this.interpreter.zoomObject(video, this.params);
    return gs.GameNotifier.postMinorChange();
  };


  /**
  * @method commandBlendVideo
  * @protected
   */

  Component_CommandInterpreter.prototype.commandBlendVideo = function() {
    var video;
    SceneManager.scene.behavior.changeVideoDomain(this.params.numberDomain);
    video = SceneManager.scene.videos[this.interpreter.numberValueOf(this.params.number)];
    if (video == null) {
      return;
    }
    this.interpreter.blendObject(video, this.params);
    return gs.GameNotifier.postMinorChange();
  };


  /**
  * @method commandTintVideo
  * @protected
   */

  Component_CommandInterpreter.prototype.commandTintVideo = function() {
    var number, scene, video;
    scene = SceneManager.scene;
    scene.behavior.changeVideoDomain(this.params.numberDomain);
    number = this.interpreter.numberValueOf(this.params.number);
    video = scene.videos[number];
    if (video == null) {
      return;
    }
    this.interpreter.tintObject(video, this.params);
    return gs.GameNotifier.postMinorChange();
  };


  /**
  * @method commandFlashVideo
  * @protected
   */

  Component_CommandInterpreter.prototype.commandFlashVideo = function() {
    var number, scene, video;
    scene = SceneManager.scene;
    scene.behavior.changeVideoDomain(this.params.numberDomain);
    number = this.interpreter.numberValueOf(this.params.number);
    video = scene.videos[number];
    if (video == null) {
      return;
    }
    this.interpreter.flashObject(video, this.params);
    return gs.GameNotifier.postMinorChange();
  };


  /**
  * @method commandCropVideo
  * @protected
   */

  Component_CommandInterpreter.prototype.commandCropVideo = function() {
    var number, scene, video;
    scene = SceneManager.scene;
    scene.behavior.changeVideoDomain(this.params.numberDomain);
    number = this.interpreter.numberValueOf(this.params.number);
    video = scene.videos[number];
    if (video == null) {
      return;
    }
    return this.interpreter.cropObject(video, this.params);
  };


  /**
  * @method commandVideoMotionBlur
  * @protected
   */

  Component_CommandInterpreter.prototype.commandVideoMotionBlur = function() {
    var number, scene, video;
    scene = SceneManager.scene;
    scene.behavior.changeVideoDomain(this.params.numberDomain);
    number = this.interpreter.numberValueOf(this.params.number);
    video = scene.videos[number];
    if (video == null) {
      return;
    }
    return this.interpreter.objectMotionBlur(video, this.params);
  };


  /**
  * @method commandMaskVideo
  * @protected
   */

  Component_CommandInterpreter.prototype.commandMaskVideo = function() {
    var number, scene, video;
    scene = SceneManager.scene;
    scene.behavior.changeVideoDomain(this.params.numberDomain);
    number = this.interpreter.numberValueOf(this.params.number);
    video = scene.videos[number];
    if (video == null) {
      return;
    }
    this.interpreter.maskObject(video, this.params);
    return gs.GameNotifier.postMinorChange();
  };


  /**
  * @method commandVideoEffect
  * @protected
   */

  Component_CommandInterpreter.prototype.commandVideoEffect = function() {
    var number, scene, video;
    scene = SceneManager.scene;
    scene.behavior.changeVideoDomain(this.params.numberDomain);
    number = this.interpreter.numberValueOf(this.params.number);
    video = scene.videos[number];
    if (video == null) {
      return;
    }
    this.interpreter.objectEffect(video, this.params);
    return gs.GameNotifier.postMinorChange();
  };


  /**
  * @method commandEraseVideo
  * @protected
   */

  Component_CommandInterpreter.prototype.commandEraseVideo = function() {
    var animation, defaults, duration, easing, flags, isLocked, number, scene, video;
    defaults = GameManager.defaults.video;
    flags = this.params.fieldFlags || {};
    isLocked = gs.CommandFieldFlags.isLocked;
    scene = SceneManager.scene;
    scene.behavior.changeVideoDomain(this.params.numberDomain);
    number = this.interpreter.numberValueOf(this.params.number);
    video = scene.videos[number];
    if (video == null) {
      return;
    }
    easing = !isLocked(flags["easing.type"]) ? gs.Easings.fromValues(this.interpreter.numberValueOf(this.params.easing.type), this.params.easing.inOut) : gs.Easings.fromObject(defaults.disappearEasing);
    duration = !isLocked(flags.duration) ? this.interpreter.durationValueOf(this.params.duration) : defaults.disappearDuration;
    animation = !isLocked(flags["animation.type"]) ? this.params.animation : defaults.disappearAnimation;
    video.animator.disappear(animation, easing, duration, (function(_this) {
      return function(sender) {
        sender.dispose();
        scene.behavior.changeTextDomain(sender.domain);
        return scene.videos[number] = null;
      };
    })(this));
    if (this.params.waitForCompletion && !(duration === 0 || this.interpreter.isInstantSkip())) {
      this.interpreter.isWaiting = true;
      this.interpreter.waitCounter = duration;
    }
    return gs.GameNotifier.postMinorChange();
  };


  /**
  * @method commandShowImageMap
  * @protected
   */

  Component_CommandInterpreter.prototype.commandShowImageMap = function() {
    var bitmap, flags, imageMap, isLocked, number, p, ref, ref1, ref2, ref3, ref4, ref5;
    flags = this.params.fieldFlags || {};
    isLocked = gs.CommandFieldFlags.isLocked;
    SceneManager.scene.behavior.changePictureDomain(this.params.numberDomain);
    number = this.interpreter.numberValueOf(this.params.number);
    imageMap = SceneManager.scene.pictures[number];
    if (imageMap != null) {
      imageMap.dispose();
    }
    imageMap = new gs.Object_ImageMap();
    imageMap.visual.variableContext = this.interpreter.context;
    SceneManager.scene.pictures[number] = imageMap;
    bitmap = ResourceManager.getBitmap("Graphics/Pictures/" + ((ref = this.params.ground) != null ? ref.name : void 0));
    imageMap.dstRect.width = bitmap.width;
    imageMap.dstRect.height = bitmap.height;
    if (this.params.positionType === 0) {
      p = this.interpreter.predefinedObjectPosition(this.params.predefinedPositionId, imageMap, this.params);
      imageMap.dstRect.x = p.x;
      imageMap.dstRect.y = p.y;
    } else {
      imageMap.dstRect.x = this.interpreter.numberValueOf(this.params.position.x);
      imageMap.dstRect.y = this.interpreter.numberValueOf(this.params.position.y);
    }
    imageMap.anchor.x = this.params.origin === 1 ? 0.5 : 0;
    imageMap.anchor.y = this.params.origin === 1 ? 0.5 : 0;
    imageMap.zIndex = !isLocked(flags.zOrder) ? this.interpreter.numberValueOf(this.params.zOrder) : 400;
    imageMap.blendMode = !isLocked(flags.blendMode) ? this.params.blendMode : 0;
    imageMap.hotspots = this.params.hotspots;
    imageMap.images = [(ref1 = this.params.ground) != null ? ref1.name : void 0, (ref2 = this.params.hover) != null ? ref2.name : void 0, (ref3 = this.params.unselected) != null ? ref3.name : void 0, (ref4 = this.params.selected) != null ? ref4.name : void 0, (ref5 = this.params.selectedHover) != null ? ref5.name : void 0];
    imageMap.events.on("jumpTo", gs.CallBack("onJumpTo", this.interpreter));
    imageMap.events.on("callCommonEvent", gs.CallBack("onCallCommonEvent", this.interpreter));
    imageMap.setup();
    imageMap.update();
    this.interpreter.showObject(imageMap, {
      x: 0,
      y: 0
    }, this.params);
    if (this.params.waitForCompletion) {
      this.interpreter.waitCounter = 0;
      this.interpreter.isWaiting = true;
    }
    imageMap.events.on("finish", (function(_this) {
      return function(sender) {
        return _this.interpreter.isWaiting = false;
      };
    })(this));
    return gs.GameNotifier.postMinorChange();
  };


  /**
  * @method commandEraseImageMap
  * @protected
   */

  Component_CommandInterpreter.prototype.commandEraseImageMap = function() {
    var imageMap, number, scene;
    scene = SceneManager.scene;
    scene.behavior.changePictureDomain(this.params.numberDomain);
    number = this.interpreter.numberValueOf(this.params.number);
    imageMap = scene.pictures[number];
    if (imageMap == null) {
      return;
    }
    imageMap.events.emit("finish", imageMap);
    imageMap.visual.active = false;
    this.interpreter.eraseObject(imageMap, this.params, (function(_this) {
      return function(sender) {
        scene.behavior.changePictureDomain(sender.domain);
        return scene.pictures[number] = null;
      };
    })(this));
    return gs.GameNotifier.postMinorChange();
  };


  /**
  * @method commandAddHotspot
  * @protected
   */

  Component_CommandInterpreter.prototype.commandAddHotspot = function() {
    var dragging, hotspot, hotspots, number, picture, ref, ref1, ref2, ref3, ref4, ref5, scene, text;
    scene = SceneManager.scene;
    scene.behavior.changeHotspotDomain(this.params.numberDomain);
    number = this.interpreter.numberValueOf(this.params.number);
    hotspots = scene.hotspots;
    if (hotspots[number] == null) {
      hotspots[number] = new gs.Object_Hotspot();
    }
    hotspot = hotspots[number];
    hotspot.domain = this.params.numberDomain;
    switch (this.params.positionType) {
      case 0:
        hotspot.dstRect.x = this.params.box.x;
        hotspot.dstRect.y = this.params.box.y;
        hotspot.dstRect.width = this.params.box.size.width;
        hotspot.dstRect.height = this.params.box.size.height;
        break;
      case 1:
        hotspot.dstRect.x = this.interpreter.numberValueOf(this.params.box.x);
        hotspot.dstRect.y = this.interpreter.numberValueOf(this.params.box.y);
        hotspot.dstRect.width = this.interpreter.numberValueOf(this.params.box.size.width);
        hotspot.dstRect.height = this.interpreter.numberValueOf(this.params.box.size.height);
        break;
      case 2:
        picture = scene.pictures[this.interpreter.numberValueOf(this.params.pictureNumber)];
        if (picture != null) {
          hotspot.target = picture;
        }
        break;
      case 3:
        text = scene.texts[this.interpreter.numberValueOf(this.params.textNumber)];
        if (text != null) {
          hotspot.target = text;
        }
    }
    hotspot.behavior.shape = (ref = this.params.shape) != null ? ref : gs.HotspotShape.RECTANGLE;
    if (text != null) {
      hotspot.images = null;
    } else {
      hotspot.images = [((ref1 = this.params.baseGraphic) != null ? ref1.name : void 0) || this.interpreter.stringValueOf(this.params.baseGraphic) || (picture != null ? picture.image : void 0), ((ref2 = this.params.hoverGraphic) != null ? ref2.name : void 0) || this.interpreter.stringValueOf(this.params.hoverGraphic), ((ref3 = this.params.selectedGraphic) != null ? ref3.name : void 0) || this.interpreter.stringValueOf(this.params.selectedGraphic), ((ref4 = this.params.selectedHoverGraphic) != null ? ref4.name : void 0) || this.interpreter.stringValueOf(this.params.selectedHoverGraphic), ((ref5 = this.params.unselectedGraphic) != null ? ref5.name : void 0) || this.interpreter.stringValueOf(this.params.unselectedGraphic)];
    }
    if (this.params.actions.onClick.type !== 0 || this.params.actions.onClick.label) {
      hotspot.events.on("click", gs.CallBack("onHotspotClick", this.interpreter, {
        params: this.params,
        bindValue: this.interpreter.numberValueOf(this.params.actions.onClick.bindValue)
      }));
    }
    if (this.params.actions.onEnter.type !== 0 || this.params.actions.onEnter.label) {
      hotspot.events.on("enter", gs.CallBack("onHotspotEnter", this.interpreter, {
        params: this.params,
        bindValue: this.interpreter.numberValueOf(this.params.actions.onEnter.bindValue)
      }));
    }
    if (this.params.actions.onLeave.type !== 0 || this.params.actions.onLeave.label) {
      hotspot.events.on("leave", gs.CallBack("onHotspotLeave", this.interpreter, {
        params: this.params,
        bindValue: this.interpreter.numberValueOf(this.params.actions.onLeave.bindValue)
      }));
    }
    if (this.params.actions.onDrag.type !== 0 || this.params.actions.onDrag.label) {
      hotspot.events.on("dragStart", gs.CallBack("onHotspotDragStart", this.interpreter, {
        params: this.params,
        bindValue: this.interpreter.numberValueOf(this.params.actions.onDrag.bindValue)
      }));
      hotspot.events.on("drag", gs.CallBack("onHotspotDrag", this.interpreter, {
        params: this.params,
        bindValue: this.interpreter.numberValueOf(this.params.actions.onDrag.bindValue)
      }));
      hotspot.events.on("dragEnd", gs.CallBack("onHotspotDragEnd", this.interpreter, {
        params: this.params,
        bindValue: this.interpreter.numberValueOf(this.params.actions.onDrag.bindValue)
      }));
    }
    if (this.params.actions.onSelect.type !== 0 || this.params.actions.onSelect.label || this.params.actions.onDeselect.type !== 0 || this.params.actions.onDeselect.label) {
      hotspot.events.on("stateChanged", gs.CallBack("onHotspotStateChanged", this.interpreter, this.params));
    }
    hotspot.selectable = true;
    hotspot.setup();
    if (this.params.dragging.enabled) {
      dragging = this.params.dragging;
      hotspot.draggable = {
        rect: new Rect(dragging.rect.x, dragging.rect.y, dragging.rect.size.width, dragging.rect.size.height),
        axisX: dragging.horizontal,
        axisY: dragging.vertical
      };
      hotspot.addComponent(new ui.Component_Draggable());
      return hotspot.events.on("drag", (function(_this) {
        return function(e) {
          var drag;
          drag = e.sender.draggable;
          GameManager.variableStore.setupTempVariables(_this.interpreter.context);
          if (_this.params.dragging.horizontal) {
            return _this.interpreter.setNumberValueTo(_this.params.dragging.variable, Math.round((e.sender.dstRect.x - drag.rect.x) / (drag.rect.width - e.sender.dstRect.width) * 100));
          } else {
            return _this.interpreter.setNumberValueTo(_this.params.dragging.variable, Math.round((e.sender.dstRect.y - drag.rect.y) / (drag.rect.height - e.sender.dstRect.height) * 100));
          }
        };
      })(this));
    }
  };


  /**
  * @method commandChangeHotspotState
  * @protected
   */

  Component_CommandInterpreter.prototype.commandChangeHotspotState = function() {
    var flags, hotspot, isLocked, number, scene;
    flags = this.params.fieldFlags || {};
    isLocked = gs.CommandFieldFlags.isLocked;
    scene = SceneManager.scene;
    scene.behavior.changeHotspotDomain(this.params.numberDomain);
    number = this.interpreter.numberValueOf(this.params.number);
    hotspot = scene.hotspots[number];
    if (!hotspot) {
      return;
    }
    if (!isLocked(flags.selected)) {
      hotspot.behavior.selected = this.interpreter.booleanValueOf(this.params.selected);
    }
    if (!isLocked(flags.enabled)) {
      hotspot.behavior.enabled = this.interpreter.booleanValueOf(this.params.enabled);
    }
    hotspot.behavior.updateInput();
    return hotspot.behavior.updateImage();
  };


  /**
  * @method commandEraseHotspot
  * @protected
   */

  Component_CommandInterpreter.prototype.commandEraseHotspot = function() {
    var number, scene;
    scene = SceneManager.scene;
    scene.behavior.changeHotspotDomain(this.params.numberDomain);
    number = this.interpreter.numberValueOf(this.params.number);
    if (scene.hotspots[number] != null) {
      scene.hotspots[number].dispose();
      return scene.hotspotContainer.eraseObject(number);
    }
  };


  /**
  * @method commandChangeObjectDomain
  * @protected
   */

  Component_CommandInterpreter.prototype.commandChangeObjectDomain = function() {
    return SceneManager.scene.behavior.changeObjectDomain(this.interpreter.stringValueOf(this.params.domain));
  };


  /**
  * @method commandPictureDefaults
  * @protected
   */

  Component_CommandInterpreter.prototype.commandPictureDefaults = function() {
    var defaults, flags, isLocked;
    defaults = GameManager.defaults.picture;
    flags = this.params.fieldFlags || {};
    isLocked = gs.CommandFieldFlags.isLocked;
    if (!isLocked(flags.appearDuration)) {
      defaults.appearDuration = this.interpreter.durationValueOf(this.params.appearDuration);
    }
    if (!isLocked(flags.disappearDuration)) {
      defaults.disappearDuration = this.interpreter.durationValueOf(this.params.disappearDuration);
    }
    if (!isLocked(flags.zOrder)) {
      defaults.zOrder = this.interpreter.numberValueOf(this.params.zOrder);
    }
    if (!isLocked(flags["appearEasing.type"])) {
      defaults.appearEasing = this.params.appearEasing;
    }
    if (!isLocked(flags["appearAnimation.type"])) {
      defaults.appearAnimation = this.params.appearAnimation;
    }
    if (!isLocked(flags["disappearEasing.type"])) {
      defaults.disappearEasing = this.params.disappearEasing;
    }
    if (!isLocked(flags["disappearAnimation.type"])) {
      defaults.disappearAnimation = this.params.disappearAnimation;
    }
    if (!isLocked(flags["motionBlur.enabled"])) {
      defaults.motionBlur = this.params.motionBlur;
    }
    if (!isLocked(flags.origin)) {
      return defaults.origin = this.params.origin;
    }
  };

  Component_CommandInterpreter.prototype.createPicture = function(graphic, params) {
    var animation, bitmap, defaults, duration, easing, flags, graphicName, isLocked, number, origin, picture, pictures, ref, ref1, ref2, ref3, ref4, ref5, ref6, scene, snapshot, x, y, zIndex;
    graphic = this.stringValueOf(graphic);
    graphicName = (graphic != null ? graphic.name : void 0) != null ? graphic.name : graphic;
    bitmap = ResourceManager.getBitmap("Graphics/Pictures/" + graphicName);
    if (bitmap && !bitmap.loaded) {
      return null;
    }
    defaults = GameManager.defaults.picture;
    flags = params.fieldFlags || {};
    isLocked = gs.CommandFieldFlags.isLocked;
    scene = SceneManager.scene;
    number = this.numberValueOf(params.number);
    pictures = scene.pictures;
    if (pictures[number] == null) {
      picture = new gs.Object_Picture(null, null, (ref = params.visual) != null ? ref.type : void 0);
      picture.domain = params.numberDomain;
      pictures[number] = picture;
      switch ((ref1 = params.visual) != null ? ref1.type : void 0) {
        case 1:
          picture.visual.looping.vertical = true;
          picture.visual.looping.horizontal = true;
          break;
        case 2:
          picture.frameThickness = params.visual.frame.thickness;
          picture.frameCornerSize = params.visual.frame.cornerSize;
          break;
        case 3:
          picture.visual.orientation = params.visual.threePartImage.orientation;
          break;
        case 4:
          picture.color = gs.Color.fromObject(params.visual.quad.color);
          break;
        case 5:
          snapshot = Graphics.snapshot();
          picture.bitmap = snapshot;
          picture.dstRect.width = snapshot.width;
          picture.dstRect.height = snapshot.height;
          picture.srcRect.set(0, 0, snapshot.width, snapshot.height);
      }
    }
    x = this.numberValueOf(params.position.x);
    y = this.numberValueOf(params.position.y);
    picture = pictures[number];
    if (!picture.bitmap) {
      picture.image = graphicName;
    } else {
      picture.image = null;
    }
    bitmap = (ref2 = picture.bitmap) != null ? ref2 : ResourceManager.getBitmap("Graphics/Pictures/" + graphicName);
    easing = !isLocked(flags["easing.type"]) ? gs.Easings.fromValues(this.numberValueOf(params.easing.type), params.easing.inOut) : gs.Easings.fromObject(defaults.appearEasing);
    duration = !isLocked(flags.duration) ? this.durationValueOf(params.duration) : defaults.appearDuration;
    origin = !isLocked(flags.origin) ? params.origin : defaults.origin;
    zIndex = !isLocked(flags.zOrder) ? this.numberValueOf(params.zOrder) : defaults.zOrder;
    animation = !isLocked(flags["animation.type"]) ? params.animation : defaults.appearAnimation;
    picture.mirror = params.position.horizontalFlip;
    picture.angle = params.position.angle || 0;
    picture.zoom.x = ((ref3 = params.position.data) != null ? ref3.zoom : void 0) || 1;
    picture.zoom.y = ((ref4 = params.position.data) != null ? ref4.zoom : void 0) || 1;
    picture.blendMode = this.numberValueOf(params.blendMode);
    if (params.origin === 1 && (bitmap != null)) {
      x += (bitmap.width * picture.zoom.x - bitmap.width) / 2;
      y += (bitmap.height * picture.zoom.y - bitmap.height) / 2;
    }
    picture.dstRect.x = x;
    picture.dstRect.y = y;
    picture.anchor.x = origin === 1 ? 0.5 : 0;
    picture.anchor.y = origin === 1 ? 0.5 : 0;
    picture.zIndex = zIndex || (700 + number);
    if (((ref5 = params.viewport) != null ? ref5.type : void 0) === "scene") {
      picture.viewport = SceneManager.scene.behavior.viewport;
    }
    if (((ref6 = params.size) != null ? ref6.type : void 0) === 1) {
      picture.dstRect.width = this.numberValueOf(params.size.width);
      picture.dstRect.height = this.numberValueOf(params.size.height);
    }
    picture.update();
    return picture;
  };


  /**
  * @method commandShowPicture
  * @protected
   */

  Component_CommandInterpreter.prototype.commandShowPicture = function() {
    var animation, defaults, duration, easing, flags, isLocked, p, picture;
    SceneManager.scene.behavior.changePictureDomain(this.params.numberDomain || "");
    defaults = GameManager.defaults.picture;
    flags = this.params.fieldFlags || {};
    isLocked = gs.CommandFieldFlags.isLocked;
    picture = this.interpreter.createPicture(this.params.graphic, this.params);
    if (!picture) {
      this.interpreter.pointer--;
      this.interpreter.isWaiting = true;
      this.interpreter.waitCounter = 1;
      return;
    }
    if (this.params.positionType === 0) {
      p = this.interpreter.predefinedObjectPosition(this.params.predefinedPositionId, picture, this.params);
      picture.dstRect.x = p.x;
      picture.dstRect.y = p.y;
    }
    easing = !isLocked(flags["easing.type"]) ? gs.Easings.fromValues(this.interpreter.numberValueOf(this.params.easing.type), this.params.easing.inOut) : gs.Easings.fromObject(defaults.appearEasing);
    duration = !isLocked(flags.duration) ? this.interpreter.durationValueOf(this.params.duration) : defaults.appearDuration;
    animation = !isLocked(flags["animation.type"]) ? this.params.animation : defaults.appearAnimation;
    picture.animator.appear(picture.dstRect.x, picture.dstRect.y, animation, easing, duration);
    if (this.params.waitForCompletion && !(duration === 0 || this.interpreter.isInstantSkip())) {
      this.interpreter.isWaiting = true;
      this.interpreter.waitCounter = duration;
    }
    return gs.GameNotifier.postMinorChange();
  };


  /**
  * @method commandPlayPictureAnimation
  * @protected
   */

  Component_CommandInterpreter.prototype.commandPlayPictureAnimation = function() {
    var animation, bitmap, component, defaults, duration, easing, flags, isLocked, p, picture, record;
    SceneManager.scene.behavior.changePictureDomain(this.params.numberDomain || "");
    defaults = GameManager.defaults.picture;
    flags = this.params.fieldFlags || {};
    isLocked = gs.CommandFieldFlags.isLocked;
    picture = null;
    easing = !isLocked(flags["easing.type"]) ? gs.Easings.fromValues(this.interpreter.numberValueOf(this.params.easing.type), this.params.easing.inOut) : gs.Easings.fromObject(defaults.appearEasing);
    duration = !isLocked(flags.duration) ? this.interpreter.durationValueOf(this.params.duration) : defaults.appearDuration;
    animation = !isLocked(flags["animation.type"]) ? this.params.animation : defaults.appearAnimation;
    if (this.params.animationId != null) {
      record = RecordManager.animations[this.params.animationId];
      if (record != null) {
        picture = this.interpreter.createPicture(record.graphic, this.params);
        component = picture.findComponent("Component_FrameAnimation");
        if (component != null) {
          component.refresh(record);
          component.start();
        } else {
          component = new gs.Component_FrameAnimation(record);
          picture.addComponent(component);
        }
        component.update();
        if (this.params.positionType === 0) {
          p = this.interpreter.predefinedObjectPosition(this.params.predefinedPositionId, picture, this.params);
          picture.dstRect.x = p.x;
          picture.dstRect.y = p.y;
        }
        picture.animator.appear(picture.dstRect.x, picture.dstRect.y, animation, easing, duration);
      }
    } else {
      picture = SceneManager.scene.pictures[this.interpreter.numberValueOf(this.params.number)];
      animation = picture != null ? picture.findComponent("Component_FrameAnimation") : void 0;
      if (animation != null) {
        picture.removeComponent(animation);
        bitmap = ResourceManager.getBitmap("Graphics/Animations/" + picture.image);
        if (bitmap != null) {
          picture.srcRect.set(0, 0, bitmap.width, bitmap.height);
          picture.dstRect.width = picture.srcRect.width;
          picture.dstRect.height = picture.srcRect.height;
        }
      }
    }
    if (this.params.waitForCompletion && !(duration === 0 || this.interpreter.isInstantSkip())) {
      this.interpreter.isWaiting = true;
      this.interpreter.waitCounter = duration;
    }
    return gs.GameNotifier.postMinorChange();
  };


  /**
  * @method commandMovePicturePath
  * @protected
   */

  Component_CommandInterpreter.prototype.commandMovePicturePath = function() {
    var number, picture, scene;
    scene = SceneManager.scene;
    scene.behavior.changePictureDomain(this.params.numberDomain);
    number = this.interpreter.numberValueOf(this.params.number);
    picture = scene.pictures[number];
    if (picture == null) {
      return;
    }
    this.interpreter.moveObjectPath(picture, this.params.path, this.params);
    return gs.GameNotifier.postMinorChange();
  };


  /**
  * @method commandMovePicture
  * @protected
   */

  Component_CommandInterpreter.prototype.commandMovePicture = function() {
    var number, picture, scene;
    scene = SceneManager.scene;
    scene.behavior.changePictureDomain(this.params.numberDomain);
    number = this.interpreter.numberValueOf(this.params.number);
    picture = scene.pictures[number];
    if (picture == null) {
      return;
    }
    this.interpreter.moveObject(picture, this.params.picture.position, this.params);
    return gs.GameNotifier.postMinorChange();
  };


  /**
  * @method commandTintPicture
  * @protected
   */

  Component_CommandInterpreter.prototype.commandTintPicture = function() {
    var number, picture, scene;
    scene = SceneManager.scene;
    scene.behavior.changePictureDomain(this.params.numberDomain || "");
    number = this.interpreter.numberValueOf(this.params.number);
    picture = scene.pictures[number];
    if (picture == null) {
      return;
    }
    this.interpreter.tintObject(picture, this.params);
    return gs.GameNotifier.postMinorChange();
  };


  /**
  * @method commandFlashPicture
  * @protected
   */

  Component_CommandInterpreter.prototype.commandFlashPicture = function() {
    var number, picture, scene;
    scene = SceneManager.scene;
    scene.behavior.changePictureDomain(this.params.numberDomain || "");
    number = this.interpreter.numberValueOf(this.params.number);
    picture = scene.pictures[number];
    if (picture == null) {
      return;
    }
    this.interpreter.flashObject(picture, this.params);
    return gs.GameNotifier.postMinorChange();
  };


  /**
  * @method commandCropPicture
  * @protected
   */

  Component_CommandInterpreter.prototype.commandCropPicture = function() {
    var number, picture, scene;
    scene = SceneManager.scene;
    scene.behavior.changePictureDomain(this.params.numberDomain || "");
    number = this.interpreter.numberValueOf(this.params.number);
    picture = scene.pictures[number];
    if (picture == null) {
      return;
    }
    return this.interpreter.cropObject(picture, this.params);
  };


  /**
  * @method commandRotatePicture
  * @protected
   */

  Component_CommandInterpreter.prototype.commandRotatePicture = function() {
    var number, picture, scene;
    scene = SceneManager.scene;
    scene.behavior.changePictureDomain(this.params.numberDomain || "");
    number = this.interpreter.numberValueOf(this.params.number);
    picture = scene.pictures[number];
    if (picture == null) {
      return;
    }
    this.interpreter.rotateObject(picture, this.params);
    return gs.GameNotifier.postMinorChange();
  };


  /**
  * @method commandZoomPicture
  * @protected
   */

  Component_CommandInterpreter.prototype.commandZoomPicture = function() {
    var number, picture, scene;
    scene = SceneManager.scene;
    scene.behavior.changePictureDomain(this.params.numberDomain || "");
    number = this.interpreter.numberValueOf(this.params.number);
    picture = scene.pictures[number];
    if (picture == null) {
      return;
    }
    this.interpreter.zoomObject(picture, this.params);
    return gs.GameNotifier.postMinorChange();
  };


  /**
  * @method commandBlendPicture
  * @protected
   */

  Component_CommandInterpreter.prototype.commandBlendPicture = function() {
    var picture;
    SceneManager.scene.behavior.changePictureDomain(this.params.numberDomain || "");
    picture = SceneManager.scene.pictures[this.interpreter.numberValueOf(this.params.number)];
    if (picture == null) {
      return;
    }
    this.interpreter.blendObject(picture, this.params);
    return gs.GameNotifier.postMinorChange();
  };


  /**
  * @method commandShakePicture
  * @protected
   */

  Component_CommandInterpreter.prototype.commandShakePicture = function() {
    var picture;
    picture = SceneManager.scene.pictures[this.interpreter.numberValueOf(this.params.number)];
    if (picture == null) {
      return;
    }
    this.interpreter.shakeObject(picture, this.params);
    return gs.GameNotifier.postMinorChange();
  };


  /**
  * @method commandMaskPicture
  * @protected
   */

  Component_CommandInterpreter.prototype.commandMaskPicture = function() {
    var number, picture, scene;
    scene = SceneManager.scene;
    scene.behavior.changePictureDomain(this.params.numberDomain || "");
    number = this.interpreter.numberValueOf(this.params.number);
    picture = scene.pictures[number];
    if (picture == null) {
      return;
    }
    this.interpreter.maskObject(picture, this.params);
    return gs.GameNotifier.postMinorChange();
  };


  /**
  * @method commandPictureMotionBlur
  * @protected
   */

  Component_CommandInterpreter.prototype.commandPictureMotionBlur = function() {
    var number, picture, scene;
    scene = SceneManager.scene;
    scene.behavior.changePictureDomain(this.params.numberDomain || "");
    number = this.interpreter.numberValueOf(this.params.number);
    picture = scene.pictures[number];
    if (picture == null) {
      return;
    }
    this.interpreter.objectMotionBlur(picture, this.params);
    return gs.GameNotifier.postMinorChange();
  };


  /**
  * @method commandPictureEffect
  * @protected
   */

  Component_CommandInterpreter.prototype.commandPictureEffect = function() {
    var number, picture, scene;
    scene = SceneManager.scene;
    scene.behavior.changePictureDomain(this.params.numberDomain || "");
    number = this.interpreter.numberValueOf(this.params.number);
    picture = scene.pictures[number];
    if (picture == null) {
      return;
    }
    this.interpreter.objectEffect(picture, this.params);
    return gs.GameNotifier.postMinorChange();
  };


  /**
  * @method commandErasePicture
  * @protected
   */

  Component_CommandInterpreter.prototype.commandErasePicture = function() {
    var animation, defaults, duration, easing, flags, isLocked, number, picture, scene;
    defaults = GameManager.defaults.picture;
    flags = this.params.fieldFlags || {};
    isLocked = gs.CommandFieldFlags.isLocked;
    scene = SceneManager.scene;
    scene.behavior.changePictureDomain(this.params.numberDomain || "");
    number = this.interpreter.numberValueOf(this.params.number);
    picture = scene.pictures[number];
    if (picture == null) {
      return;
    }
    easing = !isLocked(flags["easing.type"]) ? gs.Easings.fromValues(this.interpreter.numberValueOf(this.params.easing.type), this.params.easing.inOut) : gs.Easings.fromObject(defaults.disappearEasing);
    duration = !isLocked(flags.duration) ? this.interpreter.durationValueOf(this.params.duration) : defaults.disappearDuration;
    animation = !isLocked(flags["animation.type"]) ? this.params.animation : defaults.disappearAnimation;
    picture.animator.disappear(animation, easing, duration, (function(_this) {
      return function(sender) {
        sender.dispose();
        scene.behavior.changePictureDomain(sender.domain);
        return scene.pictures[number] = null;
      };
    })(this));
    if (this.params.waitForCompletion && !(duration === 0 || this.interpreter.isInstantSkip())) {
      this.interpreter.isWaiting = true;
      this.interpreter.waitCounter = duration;
    }
    return gs.GameNotifier.postMinorChange();
  };


  /**
  * @method commandInputNumber
  * @protected
   */

  Component_CommandInterpreter.prototype.commandInputNumber = function() {
    var scene;
    scene = SceneManager.scene;
    this.interpreter.isWaiting = true;
    if (this.interpreter.isProcessingMessageInOtherContext()) {
      this.interpreter.waitForMessage();
      return;
    }
    if ((GameManager.settings.allowChoiceSkip || this.interpreter.preview) && GameManager.tempSettings.skip) {
      this.interpreter.isWaiting = false;
      this.interpreter.messageObject().behavior.clear();
      this.interpreter.setNumberValueTo(this.params.variable, 0);
      return;
    }
    $tempFields.digits = this.params.digits;
    scene.behavior.showInputNumber(this.params.digits, gs.CallBack("onInputNumberFinish", this.interpreter, this.params));
    this.interpreter.waitingFor.inputNumber = this.params;
    return gs.GameNotifier.postMinorChange();
  };


  /**
  * @method commandChoiceTimer
  * @protected
   */

  Component_CommandInterpreter.prototype.commandChoiceTimer = function() {
    var scene;
    scene = SceneManager.scene;
    GameManager.tempFields.choiceTimer = scene.choiceTimer;
    GameManager.tempFields.choiceTimerVisible = this.params.visible;
    if (this.params.enabled) {
      scene.choiceTimer.behavior.seconds = this.interpreter.numberValueOf(this.params.seconds);
      scene.choiceTimer.behavior.minutes = this.interpreter.numberValueOf(this.params.minutes);
      scene.choiceTimer.behavior.start();
      return scene.choiceTimer.events.on("finish", (function(_this) {
        return function(sender) {
          var defaultChoice, ref;
          if (scene.choiceWindow && ((ref = scene.choices) != null ? ref.length : void 0) > 0) {
            defaultChoice = (scene.choices.first(function(c) {
              return c.isDefault;
            })) || scene.choices[0];
            return scene.choiceWindow.events.emit("selectionAccept", scene.choiceWindow, defaultChoice);
          }
        };
      })(this));
    } else {
      return scene.choiceTimer.stop();
    }
  };


  /**
  * @method commandShowChoices
  * @protected
   */

  Component_CommandInterpreter.prototype.commandShowChoices = function() {
    var choices, defaultChoice, messageObject, pointer, scene;
    scene = SceneManager.scene;
    pointer = this.interpreter.pointer;
    choices = scene.choices || [];
    if ((GameManager.settings.allowChoiceSkip || this.interpreter.previewData) && GameManager.tempSettings.skip) {
      messageObject = this.interpreter.messageObject();
      if (messageObject != null ? messageObject.visible : void 0) {
        messageObject.behavior.clear();
      }
      defaultChoice = (choices.first(function(c) {
        return c.isDefault;
      })) || choices[0];
      if (defaultChoice.action.labelIndex != null) {
        this.interpreter.pointer = defaultChoice.action.labelIndex;
      } else {
        this.interpreter.jumpToLabel(defaultChoice.action.label);
      }
      scene.choices = [];
    } else {
      if (choices.length > 0) {
        this.interpreter.isWaiting = true;
        scene.behavior.showChoices(gs.CallBack("onChoiceAccept", this.interpreter, {
          pointer: pointer,
          params: this.params
        }));
      }
    }
    return gs.GameNotifier.postMinorChange();
  };


  /**
  * @method commandShowChoice
  * @protected
   */

  Component_CommandInterpreter.prototype.commandShowChoice = function() {
    var choices, command, commands, dstRect, index, pointer, scene;
    scene = SceneManager.scene;
    commands = this.interpreter.object.commands;
    command = null;
    index = 0;
    pointer = this.interpreter.pointer;
    choices = null;
    dstRect = null;
    switch (this.params.positionType) {
      case 0:
        dstRect = null;
        break;
      case 1:
        dstRect = new Rect(this.params.box.x, this.params.box.y, this.params.box.size.width, this.params.box.size.height);
    }
    if (!scene.choices) {
      scene.choices = [];
    }
    choices = scene.choices;
    return choices.push({
      dstRect: dstRect,
      text: this.params.text,
      index: index,
      action: this.params.action,
      isSelected: false,
      isDefault: this.params.defaultChoice,
      isEnabled: this.interpreter.booleanValueOf(this.params.enabled)
    });
  };


  /**
  * @method commandOpenMenu
  * @protected
   */

  Component_CommandInterpreter.prototype.commandOpenMenu = function() {
    SceneManager.switchTo(new gs.Object_Layout("menuLayout"), true);
    this.interpreter.waitCounter = 1;
    return this.interpreter.isWaiting = true;
  };


  /**
  * @method commandOpenLoadMenu
  * @protected
   */

  Component_CommandInterpreter.prototype.commandOpenLoadMenu = function() {
    SceneManager.switchTo(new gs.Object_Layout("loadMenuLayout"), true);
    this.interpreter.waitCounter = 1;
    return this.interpreter.isWaiting = true;
  };


  /**
  * @method commandOpenSaveMenu
  * @protected
   */

  Component_CommandInterpreter.prototype.commandOpenSaveMenu = function() {
    SceneManager.switchTo(new gs.Object_Layout("saveMenuLayout"), true);
    this.interpreter.waitCounter = 1;
    return this.interpreter.isWaiting = true;
  };


  /**
  * @method commandReturnToTitle
  * @protected
   */

  Component_CommandInterpreter.prototype.commandReturnToTitle = function() {
    SceneManager.clear();
    SceneManager.switchTo(new gs.Object_Layout("titleLayout"));
    this.interpreter.waitCounter = 1;
    return this.interpreter.isWaiting = true;
  };


  /**
  * @method commandPlayVideo
  * @protected
   */

  Component_CommandInterpreter.prototype.commandPlayVideo = function() {
    var ref, scene;
    if ((GameManager.inLivePreview || GameManager.settings.allowVideoSkip) && GameManager.tempSettings.skip) {
      return;
    }
    GameManager.tempSettings.skip = false;
    scene = SceneManager.scene;
    if (((ref = this.params.video) != null ? ref.name : void 0) != null) {
      scene.video = ResourceManager.getVideo("Movies/" + this.params.video.name);
      this.videoSprite = new Sprite(Graphics.viewport);
      this.videoSprite.srcRect = new Rect(0, 0, scene.video.width, scene.video.height);
      this.videoSprite.video = scene.video;
      this.videoSprite.zoomX = Graphics.width / scene.video.width;
      this.videoSprite.zoomY = Graphics.height / scene.video.height;
      this.videoSprite.z = 99999999;
      scene.video.onEnded = (function(_this) {
        return function() {
          _this.interpreter.isWaiting = false;
          _this.videoSprite.dispose();
          return scene.video = null;
        };
      })(this);
      scene.video.volume = this.params.volume / 100;
      scene.video.playbackRate = this.params.playbackRate / 100;
      this.interpreter.isWaiting = true;
      scene.video.play();
    }
    return gs.GameNotifier.postMinorChange();
  };


  /**
  * @method commandAudioDefaults
  * @protected
   */

  Component_CommandInterpreter.prototype.commandAudioDefaults = function() {
    var defaults, flags, isLocked;
    defaults = GameManager.defaults.audio;
    flags = this.params.fieldFlags || {};
    isLocked = gs.CommandFieldFlags.isLocked;
    if (!isLocked(flags.musicFadeInDuration)) {
      defaults.musicFadeInDuration = this.params.musicFadeInDuration;
    }
    if (!isLocked(flags.musicFadeOutDuration)) {
      defaults.musicFadeOutDuration = this.params.musicFadeOutDuration;
    }
    if (!isLocked(flags.musicVolume)) {
      defaults.musicVolume = this.params.musicVolume;
    }
    if (!isLocked(flags.musicPlaybackRate)) {
      defaults.musicPlaybackRate = this.params.musicPlaybackRate;
    }
    if (!isLocked(flags.soundVolume)) {
      defaults.soundVolume = this.params.soundVolume;
    }
    if (!isLocked(flags.soundPlaybackRate)) {
      defaults.soundPlaybackRate = this.params.soundPlaybackRate;
    }
    if (!isLocked(flags.voiceVolume)) {
      defaults.voiceVolume = this.params.voiceVolume;
    }
    if (!isLocked(flags.voicePlaybackRate)) {
      return defaults.voicePlaybackRate = this.params.voicePlaybackRate;
    }
  };


  /**
  * @method commandPlayMusic
  * @protected
   */

  Component_CommandInterpreter.prototype.commandPlayMusic = function() {
    var defaults, fadeDuration, flags, isLocked, music, playRange, playTime, playbackRate, volume;
    if (this.params.music == null) {
      return;
    }
    defaults = GameManager.defaults.audio;
    flags = this.params.fieldFlags || {};
    isLocked = gs.CommandFieldFlags.isLocked;
    music = null;
    if (GameManager.settings.bgmEnabled) {
      fadeDuration = !isLocked(flags.fadeInDuration) ? this.params.fadeInDuration : defaults.musicFadeInDuration;
      volume = !isLocked(flags["music.volume"]) ? this.params.music.volume : defaults.musicVolume;
      playbackRate = !isLocked(flags["music.playbackRate"]) ? this.params.music.playbackRate : defaults.musicPlaybackRate;
      music = {
        name: this.params.music.name,
        volume: volume,
        playbackRate: playbackRate
      };
      if (this.params.playType === 1) {
        playTime = {
          min: this.params.playTime.min * 60,
          max: this.params.playTime.max * 60
        };
        playRange = {
          start: this.params.playRange.start * 60,
          end: this.params.playRange.end * 60
        };
        AudioManager.playMusicRandom(music, fadeDuration, this.params.layer || 0, playTime, playRange);
      } else {
        music = AudioManager.playMusic(this.params.music.name, volume, playbackRate, fadeDuration, this.params.layer || 0, this.params.loop);
      }
    }
    if (music && this.params.waitForCompletion && !this.params.loop) {
      this.interpreter.isWaiting = true;
      this.interpreter.waitCounter = Math.round(music.duration * Graphics.frameRate);
    }
    return gs.GameNotifier.postMinorChange();
  };


  /**
  * @method commandStopMusic
  * @protected
   */

  Component_CommandInterpreter.prototype.commandStopMusic = function() {
    var defaults, fadeDuration, flags, isLocked;
    defaults = GameManager.defaults.audio;
    flags = this.params.fieldFlags || {};
    isLocked = gs.CommandFieldFlags.isLocked;
    fadeDuration = !isLocked(flags.fadeOutDuration) ? this.params.fadeOutDuration : defaults.musicFadeOutDuration;
    AudioManager.stopMusic(fadeDuration, this.interpreter.numberValueOf(this.params.layer));
    return gs.GameNotifier.postMinorChange();
  };


  /**
  * @method commandPauseMusic
  * @protected
   */

  Component_CommandInterpreter.prototype.commandPauseMusic = function() {
    var defaults, fadeDuration, flags, isLocked;
    defaults = GameManager.defaults.audio;
    flags = this.params.fieldFlags || {};
    isLocked = gs.CommandFieldFlags.isLocked;
    fadeDuration = !isLocked(flags.fadeOutDuration) ? this.params.fadeOutDuration : defaults.musicFadeOutDuration;
    return AudioManager.stopMusic(fadeDuration, this.interpreter.numberValueOf(this.params.layer));
  };


  /**
  * @method commandResumeMusic
  * @protected
   */

  Component_CommandInterpreter.prototype.commandResumeMusic = function() {
    var defaults, fadeDuration, flags, isLocked;
    defaults = GameManager.defaults.audio;
    flags = this.params.fieldFlags || {};
    isLocked = gs.CommandFieldFlags.isLocked;
    fadeDuration = !isLocked(flags.fadeInDuration) ? this.params.fadeInDuration : defaults.musicFadeInDuration;
    AudioManager.resumeMusic(fadeDuration, this.interpreter.numberValueOf(this.params.layer));
    return gs.GameNotifier.postMinorChange();
  };


  /**
  * @method commandPlaySound
  * @protected
   */

  Component_CommandInterpreter.prototype.commandPlaySound = function() {
    var defaults, flags, isLocked, playbackRate, sound, volume;
    defaults = GameManager.defaults.audio;
    flags = this.params.fieldFlags || {};
    isLocked = gs.CommandFieldFlags.isLocked;
    sound = null;
    if (GameManager.settings.soundEnabled && !GameManager.tempSettings.skip) {
      volume = !isLocked(flags["sound.volume"]) ? this.params.sound.volume : defaults.soundVolume;
      playbackRate = !isLocked(flags["sound.playbackRate"]) ? this.params.sound.playbackRate : defaults.soundPlaybackRate;
      sound = AudioManager.playSound(this.params.sound.name, volume, playbackRate, this.params.musicEffect, null, this.params.loop);
    }
    gs.GameNotifier.postMinorChange();
    if (sound && this.params.waitForCompletion && !this.params.loop) {
      this.interpreter.isWaiting = true;
      return this.interpreter.waitCounter = Math.round(sound.duration * Graphics.frameRate);
    }
  };


  /**
  * @method commandStopSound
  * @protected
   */

  Component_CommandInterpreter.prototype.commandStopSound = function() {
    AudioManager.stopSound(this.params.sound.name);
    return gs.GameNotifier.postMinorChange();
  };


  /**
  * @method commandEndCommonEvent
  * @protected
   */

  Component_CommandInterpreter.prototype.commandEndCommonEvent = function() {
    var event, eventId;
    eventId = this.interpreter.stringValueOf(this.params.commonEventId);
    event = GameManager.commonEvents[eventId];
    return event != null ? event.behavior.stop() : void 0;
  };


  /**
  * @method commandResumeCommonEvent
  * @protected
   */

  Component_CommandInterpreter.prototype.commandResumeCommonEvent = function() {
    var event, eventId;
    eventId = this.interpreter.stringValueOf(this.params.commonEventId);
    event = GameManager.commonEvents[eventId];
    return event != null ? event.behavior.resume() : void 0;
  };


  /**
  * @method commandCallCommonEvent
  * @protected
   */

  Component_CommandInterpreter.prototype.commandCallCommonEvent = function() {
    var eventId, list, params, scene;
    scene = SceneManager.scene;
    eventId = null;
    if (this.params.commonEventId.index != null) {
      eventId = this.interpreter.stringValueOf(this.params.commonEventId);
      list = this.interpreter.listObjectOf(this.params.parameters.values[0]);
      params = {
        values: list
      };
    } else {
      params = this.params.parameters;
      eventId = this.params.commonEventId;
    }
    return this.interpreter.callCommonEvent(eventId, params);
  };


  /**
  * @method commandChangeTextSettings
  * @protected
   */

  Component_CommandInterpreter.prototype.commandChangeTextSettings = function() {
    var flags, font, fontName, fontSize, isLocked, number, padding, ref, ref1, ref2, ref3, ref4, scene, textSprite, texts;
    scene = SceneManager.scene;
    scene.behavior.changeTextDomain(this.params.numberDomain);
    number = this.interpreter.numberValueOf(this.params.number);
    texts = scene.texts;
    if (texts[number] == null) {
      texts[number] = new gs.Object_Text();
      texts[number].visible = false;
    }
    textSprite = texts[number];
    padding = textSprite.behavior.padding;
    font = textSprite.font;
    fontName = textSprite.font.name;
    fontSize = textSprite.font.size;
    flags = this.params.fieldFlags || {};
    isLocked = gs.CommandFieldFlags.isLocked;
    if (!isLocked(flags.lineSpacing)) {
      textSprite.textRenderer.lineSpacing = (ref = this.params.lineSpacing) != null ? ref : textSprite.textRenderer.lineSpacing;
    }
    if (!isLocked(flags.font)) {
      fontName = this.interpreter.stringValueOf(this.params.font);
    }
    if (!isLocked(flags.size)) {
      fontSize = this.interpreter.numberValueOf(this.params.size);
    }
    if (!isLocked(flags.font) || !isLocked(flags.size)) {
      textSprite.font = new Font(fontName, fontSize);
    }
    padding.left = !isLocked(flags["padding.0"]) ? (ref1 = this.params.padding) != null ? ref1[0] : void 0 : padding.left;
    padding.top = !isLocked(flags["padding.1"]) ? (ref2 = this.params.padding) != null ? ref2[1] : void 0 : padding.top;
    padding.right = !isLocked(flags["padding.2"]) ? (ref3 = this.params.padding) != null ? ref3[2] : void 0 : padding.right;
    padding.bottom = !isLocked(flags["padding.3"]) ? (ref4 = this.params.padding) != null ? ref4[3] : void 0 : padding.bottom;
    if (!isLocked(flags.bold)) {
      textSprite.font.bold = this.params.bold;
    }
    if (!isLocked(flags.italic)) {
      textSprite.font.italic = this.params.italic;
    }
    if (!isLocked(flags.smallCaps)) {
      textSprite.font.smallCaps = this.params.smallCaps;
    }
    if (!isLocked(flags.underline)) {
      textSprite.font.underline = this.params.underline;
    }
    if (!isLocked(flags.strikeThrough)) {
      textSprite.font.strikeThrough = this.params.strikeThrough;
    }
    textSprite.font.color = !isLocked(flags.color) ? new Color(this.params.color) : font.color;
    textSprite.font.border = !isLocked(flags.outline) ? this.params.outline : font.border;
    textSprite.font.borderColor = !isLocked(flags.outlineColor) ? new Color(this.params.outlineColor) : new Color(font.borderColor);
    textSprite.font.borderSize = !isLocked(flags.outlineSize) ? this.params.outlineSize : font.borderSize;
    textSprite.font.shadow = !isLocked(flags.shadow) ? this.params.shadow : font.shadow;
    textSprite.font.shadowColor = !isLocked(flags.shadowColor) ? new Color(this.params.shadowColor) : new Color(font.shadowColor);
    textSprite.font.shadowOffsetX = !isLocked(flags.shadowOffsetX) ? this.params.shadowOffsetX : font.shadowOffsetX;
    textSprite.font.shadowOffsetY = !isLocked(flags.shadowOffsetY) ? this.params.shadowOffsetY : font.shadowOffsetY;
    textSprite.behavior.refresh();
    return textSprite.update();
  };


  /**
  * @method commandChangeTextSettings
  * @protected
   */

  Component_CommandInterpreter.prototype.commandTextDefaults = function() {
    var defaults, flags, isLocked;
    defaults = GameManager.defaults.text;
    flags = this.params.fieldFlags || {};
    isLocked = gs.CommandFieldFlags.isLocked;
    if (!isLocked(flags.appearDuration)) {
      defaults.appearDuration = this.interpreter.durationValueOf(this.params.appearDuration);
    }
    if (!isLocked(flags.disappearDuration)) {
      defaults.disappearDuration = this.interpreter.durationValueOf(this.params.disappearDuration);
    }
    if (!isLocked(flags.zOrder)) {
      defaults.zOrder = this.interpreter.numberValueOf(this.params.zOrder);
    }
    if (!isLocked(flags["appearEasing.type"])) {
      defaults.appearEasing = this.params.appearEasing;
    }
    if (!isLocked(flags["appearAnimation.type"])) {
      defaults.appearAnimation = this.params.appearAnimation;
    }
    if (!isLocked(flags["disappearEasing.type"])) {
      defaults.disappearEasing = this.params.disappearEasing;
    }
    if (!isLocked(flags["disappearAnimation.type"])) {
      defaults.disappearAnimation = this.params.disappearAnimation;
    }
    if (!isLocked(flags["motionBlur.enabled"])) {
      defaults.motionBlur = this.params.motionBlur;
    }
    if (!isLocked(flags.origin)) {
      return defaults.origin = this.params.origin;
    }
  };


  /**
  * @method commandShowText
  * @protected
   */

  Component_CommandInterpreter.prototype.commandShowText = function() {
    var animation, defaults, duration, easing, flags, isLocked, number, origin, p, positionAnchor, ref, scene, text, textObject, texts, x, y, zIndex;
    defaults = GameManager.defaults.text;
    flags = this.params.fieldFlags || {};
    isLocked = gs.CommandFieldFlags.isLocked;
    scene = SceneManager.scene;
    scene.behavior.changeTextDomain(this.params.numberDomain);
    number = this.interpreter.numberValueOf(this.params.number);
    text = this.params.text;
    texts = scene.texts;
    if (texts[number] == null) {
      texts[number] = new gs.Object_Text();
    }
    x = this.interpreter.numberValueOf(this.params.position.x);
    y = this.interpreter.numberValueOf(this.params.position.y);
    textObject = texts[number];
    textObject.domain = this.params.numberDomain;
    easing = !isLocked(flags["easing.type"]) ? gs.Easings.fromValues(this.interpreter.numberValueOf(this.params.easing.type), this.params.easing.inOut) : gs.Easings.fromObject(defaults.appearEasing);
    duration = !isLocked(flags.duration) ? this.interpreter.durationValueOf(this.params.duration) : defaults.appearDuration;
    origin = !isLocked(flags.origin) ? this.params.origin : defaults.origin;
    zIndex = !isLocked(flags.zOrder) ? this.interpreter.numberValueOf(this.params.zOrder) : defaults.zOrder;
    animation = !isLocked(flags["animation.type"]) ? this.params.animation : defaults.appearAnimation;
    positionAnchor = !isLocked(flags.positionOrigin) ? this.interpreter.graphicAnchorPointsByConstant[this.params.positionOrigin] || new gs.Point(0, 0) : this.interpreter.graphicAnchorPointsByConstant[defaults.positionOrigin];
    textObject.text = text;
    textObject.dstRect.x = x;
    textObject.dstRect.y = y;
    textObject.blendMode = this.interpreter.numberValueOf(this.params.blendMode);
    textObject.anchor.x = origin === 0 ? 0 : 0.5;
    textObject.anchor.y = origin === 0 ? 0 : 0.5;
    textObject.positionAnchor.x = positionAnchor.x;
    textObject.positionAnchor.y = positionAnchor.y;
    textObject.zIndex = zIndex || (700 + number);
    textObject.sizeToFit = true;
    textObject.formatting = true;
    if (((ref = this.params.viewport) != null ? ref.type : void 0) === "scene") {
      textObject.viewport = SceneManager.scene.behavior.viewport;
    }
    textObject.update();
    if (this.params.positionType === 0) {
      p = this.interpreter.predefinedObjectPosition(this.params.predefinedPositionId, textObject, this.params);
      textObject.dstRect.x = p.x;
      textObject.dstRect.y = p.y;
    }
    textObject.animator.appear(x, y, animation, easing, duration);
    if (this.params.waitForCompletion && !(duration === 0 || this.interpreter.isInstantSkip())) {
      this.interpreter.isWaiting = true;
      this.interpreter.waitCounter = duration;
    }
    return gs.GameNotifier.postMinorChange();
  };


  /**
  * @method commandTextMotionBlur
  * @protected
   */

  Component_CommandInterpreter.prototype.commandTextMotionBlur = function() {
    var number, scene, text;
    scene = SceneManager.scene;
    scene.behavior.changeTextDomain(this.params.numberDomain);
    number = this.interpreter.numberValueOf(this.params.number);
    text = scene.texts[number];
    if (text == null) {
      return;
    }
    return text.motionBlur.set(this.params.motionBlur);
  };


  /**
  * @method commandRefreshText
  * @protected
   */

  Component_CommandInterpreter.prototype.commandRefreshText = function() {
    var number, scene, texts;
    scene = SceneManager.scene;
    scene.behavior.changeTextDomain(this.params.numberDomain);
    number = this.interpreter.numberValueOf(this.params.number);
    texts = scene.texts;
    if (texts[number] == null) {
      return;
    }
    return texts[number].behavior.refresh(true);
  };


  /**
  * @method commandMoveText
  * @protected
   */

  Component_CommandInterpreter.prototype.commandMoveText = function() {
    var number, scene, text;
    scene = SceneManager.scene;
    scene.behavior.changeTextDomain(this.params.numberDomain);
    number = this.interpreter.numberValueOf(this.params.number);
    text = scene.texts[number];
    if (text == null) {
      return;
    }
    this.interpreter.moveObject(text, this.params.picture.position, this.params);
    return gs.GameNotifier.postMinorChange();
  };


  /**
  * @method commandMoveTextPath
  * @protected
   */

  Component_CommandInterpreter.prototype.commandMoveTextPath = function() {
    var number, scene, text;
    scene = SceneManager.scene;
    scene.behavior.changeTextDomain(this.params.numberDomain);
    number = this.interpreter.numberValueOf(this.params.number);
    text = scene.texts[number];
    if (text == null) {
      return;
    }
    this.interpreter.moveObjectPath(text, this.params.path, this.params);
    return gs.GameNotifier.postMinorChange();
  };


  /**
  * @method commandRotateText
  * @protected
   */

  Component_CommandInterpreter.prototype.commandRotateText = function() {
    var number, scene, text;
    scene = SceneManager.scene;
    scene.behavior.changeTextDomain(this.params.numberDomain);
    number = this.interpreter.numberValueOf(this.params.number);
    text = scene.texts[number];
    if (text == null) {
      return;
    }
    this.interpreter.rotateObject(text, this.params);
    return gs.GameNotifier.postMinorChange();
  };


  /**
  * @method commandZoomText
  * @protected
   */

  Component_CommandInterpreter.prototype.commandZoomText = function() {
    var number, scene, text;
    scene = SceneManager.scene;
    scene.behavior.changeTextDomain(this.params.numberDomain);
    number = this.interpreter.numberValueOf(this.params.number);
    text = scene.texts[number];
    if (text == null) {
      return;
    }
    this.interpreter.zoomObject(text, this.params);
    return gs.GameNotifier.postMinorChange();
  };


  /**
  * @method commandBlendText
  * @protected
   */

  Component_CommandInterpreter.prototype.commandBlendText = function() {
    var text;
    SceneManager.scene.behavior.changeTextDomain(this.params.numberDomain);
    text = SceneManager.scene.texts[this.interpreter.numberValueOf(this.params.number)];
    if (text == null) {
      return;
    }
    this.interpreter.blendObject(text, this.params);
    return gs.GameNotifier.postMinorChange();
  };


  /**
  * @method commandColorText
  * @protected
   */

  Component_CommandInterpreter.prototype.commandColorText = function() {
    var duration, easing, number, scene, text;
    scene = SceneManager.scene;
    scene.behavior.changeTextDomain(this.params.numberDomain);
    number = this.interpreter.numberValueOf(this.params.number);
    text = scene.texts[number];
    duration = this.interpreter.durationValueOf(this.params.duration);
    easing = gs.Easings.fromObject(this.params.easing);
    if (text != null) {
      text.animator.colorTo(new Color(this.params.color), duration, easing);
      if (this.params.waitForCompletion && !(duration === 0 || this.interpreter.isInstantSkip())) {
        this.interpreter.isWaiting = true;
        this.interpreter.waitCounter = duration;
      }
    }
    return gs.GameNotifier.postMinorChange();
  };


  /**
  * @method commandEraseText
  * @protected
   */

  Component_CommandInterpreter.prototype.commandEraseText = function() {
    var animation, defaults, duration, easing, flags, isLocked, number, scene, text;
    defaults = GameManager.defaults.text;
    flags = this.params.fieldFlags || {};
    isLocked = gs.CommandFieldFlags.isLocked;
    scene = SceneManager.scene;
    scene.behavior.changeTextDomain(this.params.numberDomain);
    number = this.interpreter.numberValueOf(this.params.number);
    text = scene.texts[number];
    if (text == null) {
      return;
    }
    easing = !isLocked(flags["easing.type"]) ? gs.Easings.fromValues(this.interpreter.numberValueOf(this.params.easing.type), this.params.easing.inOut) : gs.Easings.fromObject(defaults.disappearEasing);
    duration = !isLocked(flags.duration) ? this.interpreter.durationValueOf(this.params.duration) : defaults.disappearDuration;
    animation = !isLocked(flags["animation.type"]) ? this.params.animation : defaults.disappearAnimation;
    text.animator.disappear(animation, easing, duration, (function(_this) {
      return function(sender) {
        sender.dispose();
        scene.behavior.changeTextDomain(sender.domain);
        return scene.texts[number] = null;
      };
    })(this));
    if (this.params.waitForCompletion && !(duration === 0 || this.interpreter.isInstantSkip())) {
      this.interpreter.isWaiting = true;
      this.interpreter.waitCounter = duration;
    }
    return gs.GameNotifier.postMinorChange();
  };


  /**
  * @method commandTextEffect
  * @protected
   */

  Component_CommandInterpreter.prototype.commandTextEffect = function() {
    var number, scene, text;
    scene = SceneManager.scene;
    scene.behavior.changeTextDomain(this.params.numberDomain);
    number = this.interpreter.numberValueOf(this.params.number);
    text = scene.texts[number];
    if (text == null) {
      return;
    }
    this.interpreter.objectEffect(text, this.params);
    return gs.GameNotifier.postMinorChange();
  };


  /**
  * @method commandInputText
  * @protected
   */

  Component_CommandInterpreter.prototype.commandInputText = function() {
    var scene;
    scene = SceneManager.scene;
    scene.behavior.changeTextDomain(this.params.numberDomain);
    if ((GameManager.settings.allowChoiceSkip || this.interpreter.preview) && GameManager.tempSettings.skip) {
      this.interpreter.messageObject().behavior.clear();
      this.interpreter.setStringValueTo(this.params.variable, "");
      return;
    }
    this.interpreter.isWaiting = true;
    if (this.interpreter.isProcessingMessageInOtherContext()) {
      this.interpreter.waitForMessage();
      return;
    }
    $tempFields.letters = this.params.letters;
    scene.behavior.showInputText(this.params.letters, gs.CallBack("onInputTextFinish", this.interpreter, this.interpreter));
    this.interpreter.waitingFor.inputText = this.params;
    return gs.GameNotifier.postMinorChange();
  };


  /**
  * @method commandSavePersistentData
  * @protected
   */

  Component_CommandInterpreter.prototype.commandSavePersistentData = function() {
    return GameManager.saveGlobalData();
  };


  /**
  * @method commandSaveSettings
  * @protected
   */

  Component_CommandInterpreter.prototype.commandSaveSettings = function() {
    return GameManager.saveSettings();
  };


  /**
  * @method commandPrepareSaveGame
  * @protected
   */

  Component_CommandInterpreter.prototype.commandPrepareSaveGame = function() {
    if (this.interpreter.previewData != null) {
      return;
    }
    this.interpreter.pointer++;
    GameManager.prepareSaveGame(this.params.snapshot);
    return this.interpreter.pointer--;
  };


  /**
  * @method commandSaveGame
  * @protected
   */

  Component_CommandInterpreter.prototype.commandSaveGame = function() {
    var thumbHeight, thumbWidth;
    if (this.interpreter.previewData != null) {
      return;
    }
    thumbWidth = this.interpreter.numberValueOf(this.params.thumbWidth);
    thumbHeight = this.interpreter.numberValueOf(this.params.thumbHeight);
    return GameManager.save(this.interpreter.numberValueOf(this.params.slot) - 1, thumbWidth, thumbHeight);
  };


  /**
  * @method commandLoadGame
  * @protected
   */

  Component_CommandInterpreter.prototype.commandLoadGame = function() {
    if (this.interpreter.previewData != null) {
      return;
    }
    return GameManager.load(this.interpreter.numberValueOf(this.params.slot) - 1);
  };


  /**
  * @method commandWaitForInput
  * @protected
   */

  Component_CommandInterpreter.prototype.commandWaitForInput = function() {
    var f;
    if (this.interpreter.isInstantSkip()) {
      return;
    }
    gs.GlobalEventManager.offByOwner("mouseDown", this.interpreter.object);
    gs.GlobalEventManager.offByOwner("mouseUp", this.interpreter.object);
    gs.GlobalEventManager.offByOwner("keyDown", this.interpreter.object);
    gs.GlobalEventManager.offByOwner("keyUp", this.interpreter.object);
    f = (function(_this) {
      return function() {
        var executeAction, key;
        key = _this.interpreter.numberValueOf(_this.params.key);
        executeAction = false;
        if (Input.Mouse.isButton(_this.params.key)) {
          executeAction = Input.Mouse.buttons[_this.params.key] === _this.params.state;
        } else if (_this.params.key === 100) {
          if (Input.keyDown && _this.params.state === 1) {
            executeAction = true;
          }
          if (Input.keyUp && _this.params.state === 2) {
            executeAction = true;
          }
        } else if (_this.params.key === 101) {
          if (Input.Mouse.buttonDown && _this.params.state === 1) {
            executeAction = true;
          }
          if (Input.Mouse.buttonUp && _this.params.state === 2) {
            executeAction = true;
          }
        } else if (_this.params.key === 102) {
          if ((Input.keyDown || Input.Mouse.buttonDown) && _this.params.state === 1) {
            executeAction = true;
          }
          if ((Input.keyUp || Input.Mouse.buttonUp) && _this.params.state === 2) {
            executeAction = true;
          }
        } else {
          key = key > 100 ? key - 100 : key;
          executeAction = Input.keys[key] === _this.params.state;
        }
        if (executeAction) {
          _this.interpreter.isWaiting = false;
          gs.GlobalEventManager.offByOwner("mouseDown", _this.interpreter.object);
          gs.GlobalEventManager.offByOwner("mouseUp", _this.interpreter.object);
          gs.GlobalEventManager.offByOwner("keyDown", _this.interpreter.object);
          return gs.GlobalEventManager.offByOwner("keyUp", _this.interpreter.object);
        }
      };
    })(this);
    gs.GlobalEventManager.on("mouseDown", f, null, this.interpreter.object);
    gs.GlobalEventManager.on("mouseUp", f, null, this.interpreter.object);
    gs.GlobalEventManager.on("keyDown", f, null, this.interpreter.object);
    gs.GlobalEventManager.on("keyUp", f, null, this.interpreter.object);
    return this.interpreter.isWaiting = true;
  };


  /**
  * @method commandGetInputData
  * @protected
   */

  Component_CommandInterpreter.prototype.commandGetInputData = function() {
    var anyButton, anyInput, anyKey, code;
    switch (this.params.field) {
      case 0:
        return this.interpreter.setNumberValueTo(this.params.targetVariable, Input.keys[Input.A]);
      case 1:
        return this.interpreter.setNumberValueTo(this.params.targetVariable, Input.keys[Input.B]);
      case 2:
        return this.interpreter.setNumberValueTo(this.params.targetVariable, Input.keys[Input.X]);
      case 3:
        return this.interpreter.setNumberValueTo(this.params.targetVariable, Input.keys[Input.Y]);
      case 4:
        return this.interpreter.setNumberValueTo(this.params.targetVariable, Input.keys[Input.L]);
      case 5:
        return this.interpreter.setNumberValueTo(this.params.targetVariable, Input.keys[Input.R]);
      case 6:
        return this.interpreter.setNumberValueTo(this.params.targetVariable, Input.keys[Input.START]);
      case 7:
        return this.interpreter.setNumberValueTo(this.params.targetVariable, Input.keys[Input.SELECT]);
      case 8:
        return this.interpreter.setNumberValueTo(this.params.targetVariable, Input.Mouse.x);
      case 9:
        return this.interpreter.setNumberValueTo(this.params.targetVariable, Input.Mouse.y);
      case 10:
        return this.interpreter.setNumberValueTo(this.params.targetVariable, Input.Mouse.wheel);
      case 11:
        return this.interpreter.setNumberValueTo(this.params.targetVariable, Input.Mouse.buttons[Input.Mouse.LEFT]);
      case 12:
        return this.interpreter.setNumberValueTo(this.params.targetVariable, Input.Mouse.buttons[Input.Mouse.RIGHT]);
      case 13:
        return this.interpreter.setNumberValueTo(this.params.targetVariable, Input.Mouse.buttons[Input.Mouse.MIDDLE]);
      case 100:
        anyKey = 0;
        if (Input.keyDown) {
          anyKey = 1;
        }
        if (Input.keyUp) {
          anyKey = 2;
        }
        return this.interpreter.setNumberValueTo(this.params.targetVariable, anyKey);
      case 101:
        anyButton = 0;
        if (Input.Mouse.buttonDown) {
          anyButton = 1;
        }
        if (Input.Mouse.buttonUp) {
          anyButton = 2;
        }
        return this.interpreter.setNumberValueTo(this.params.targetVariable, anyButton);
      case 102:
        anyInput = 0;
        if (Input.Mouse.buttonDown || Input.keyDown) {
          anyInput = 1;
        }
        if (Input.Mouse.buttonUp || Input.keyUp) {
          anyInput = 2;
        }
        return this.interpreter.setNumberValueTo(this.params.targetVariable, anyInput);
      default:
        code = this.params.field - 100;
        return this.interpreter.setNumberValueTo(this.params.targetVariable, Input.keys[code]);
    }
  };


  /**
  * @method commandGetGameData
  * @protected
   */

  Component_CommandInterpreter.prototype.commandGetGameData = function() {
    var ref, ref1, settings, tempSettings;
    tempSettings = GameManager.tempSettings;
    settings = GameManager.settings;
    switch (this.params.field) {
      case 0:
        return this.interpreter.setStringValueTo(this.params.targetVariable, SceneManager.scene.sceneDocument.uid);
      case 1:
        return this.interpreter.setNumberValueTo(this.params.targetVariable, Math.round(Graphics.frameCount / 60));
      case 2:
        return this.interpreter.setNumberValueTo(this.params.targetVariable, Math.round(Graphics.frameCount / 60 / 60));
      case 3:
        return this.interpreter.setNumberValueTo(this.params.targetVariable, Math.round(Graphics.frameCount / 60 / 60 / 60));
      case 4:
        return this.interpreter.setNumberValueTo(this.params.targetVariable, new Date().getDate());
      case 5:
        return this.interpreter.setNumberValueTo(this.params.targetVariable, new Date().getDay());
      case 6:
        return this.interpreter.setNumberValueTo(this.params.targetVariable, new Date().getMonth());
      case 7:
        return this.interpreter.setNumberValueTo(this.params.targetVariable, new Date().getFullYear());
      case 8:
        return this.interpreter.setBooleanValueTo(this.params.targetVariable, settings.allowSkip);
      case 9:
        return this.interpreter.setBooleanValueTo(this.params.targetVariable, settings.allowSkipUnreadMessages);
      case 10:
        return this.interpreter.setNumberValueTo(this.params.targetVariable, settings.messageSpeed);
      case 11:
        return this.interpreter.setBooleanValueTo(this.params.targetVariable, settings.autoMessage.enabled);
      case 12:
        return this.interpreter.setNumberValueTo(this.params.targetVariable, settings.autoMessage.time);
      case 13:
        return this.interpreter.setBooleanValueTo(this.params.targetVariable, settings.autoMessage.waitForVoice);
      case 14:
        return this.interpreter.setBooleanValueTo(this.params.targetVariable, settings.autoMessage.stopOnAction);
      case 15:
        return this.interpreter.setBooleanValueTo(this.params.targetVariable, settings.timeMessageToVoice);
      case 16:
        return this.interpreter.setBooleanValueTo(this.params.targetVariable, settings.allowVideoSkip);
      case 17:
        return this.interpreter.setBooleanValueTo(this.params.targetVariable, settings.allowChoiceSkip);
      case 18:
        return this.interpreter.setBooleanValueTo(this.params.targetVariable, settings.skipVoiceOnAction);
      case 19:
        return this.interpreter.setBooleanValueTo(this.params.targetVariable, settings.fullScreen);
      case 20:
        return this.interpreter.setBooleanValueTo(this.params.targetVariable, settings.adjustAspectRatio);
      case 21:
        return this.interpreter.setBooleanValueTo(this.params.targetVariable, settings.confirmation);
      case 22:
        return this.interpreter.setNumberValueTo(this.params.targetVariable, settings.bgmVolume);
      case 23:
        return this.interpreter.setNumberValueTo(this.params.targetVariable, settings.voiceVolume);
      case 24:
        return this.interpreter.setNumberValueTo(this.params.targetVariable, settings.seVolume);
      case 25:
        return this.interpreter.setBooleanValueTo(this.params.targetVariable, settings.bgmEnabled);
      case 26:
        return this.interpreter.setBooleanValueTo(this.params.targetVariable, settings.voiceEnabled);
      case 27:
        return this.interpreter.setBooleanValueTo(this.params.targetVariable, settings.seEnabled);
      case 28:
        return this.interpreter.setStringValueTo(this.params.targetVariable, ((ref = LanguageManager.language) != null ? ref.code : void 0) || "");
      case 29:
        return this.interpreter.setStringValueTo(this.params.targetVariable, ((ref1 = LanguageManager.language) != null ? ref1.name : void 0) || "");
      case 30:
        return this.interpreter.setBooleanValueTo(this.params.targetVariable, GameManager.tempSettings.skip);
    }
  };


  /**
  * @method commandSetGameData
  * @protected
   */

  Component_CommandInterpreter.prototype.commandSetGameData = function() {
    var code, language, settings, tempSettings;
    tempSettings = GameManager.tempSettings;
    settings = GameManager.settings;
    switch (this.params.field) {
      case 0:
        return settings.allowSkip = this.interpreter.booleanValueOf(this.params.switchValue);
      case 1:
        return settings.allowSkipUnreadMessages = this.interpreter.booleanValueOf(this.params.switchValue);
      case 2:
        return settings.messageSpeed = this.interpreter.numberValueOf(this.params.decimalValue);
      case 3:
        return settings.autoMessage.enabled = this.interpreter.booleanValueOf(this.params.switchValue);
      case 4:
        return settings.autoMessage.time = this.interpreter.numberValueOf(this.params.numberValue);
      case 5:
        return settings.autoMessage.waitForVoice = this.interpreter.booleanValueOf(this.params.switchValue);
      case 6:
        return settings.autoMessage.stopOnAction = this.interpreter.booleanValueOf(this.params.switchValue);
      case 7:
        return settings.timeMessageToVoice = this.interpreter.booleanValueOf(this.params.switchValue);
      case 8:
        return settings.allowVideoSkip = this.interpreter.booleanValueOf(this.params.switchValue);
      case 9:
        return settings.allowChoiceSkip = this.interpreter.booleanValueOf(this.params.switchValue);
      case 10:
        return settings.skipVoiceOnAction = this.interpreter.booleanValueOf(this.params.switchValue);
      case 11:
        settings.fullScreen = this.interpreter.booleanValueOf(this.params.switchValue);
        if (settings.fullScreen) {
          return SceneManager.scene.behavior.enterFullScreen();
        } else {
          return SceneManager.scene.behavior.leaveFullScreen();
        }
        break;
      case 12:
        settings.adjustAspectRatio = this.interpreter.booleanValueOf(this.params.switchValue);
        Graphics.keepRatio = settings.adjustAspectRatio;
        return Graphics.onResize();
      case 13:
        return settings.confirmation = this.interpreter.booleanValueOf(this.params.switchValue);
      case 14:
        return settings.bgmVolume = this.interpreter.numberValueOf(this.params.numberValue);
      case 15:
        return settings.voiceVolume = this.interpreter.numberValueOf(this.params.numberValue);
      case 16:
        return settings.seVolume = this.interpreter.numberValueOf(this.params.numberValue);
      case 17:
        return settings.bgmEnabled = this.interpreter.booleanValueOf(this.params.switchValue);
      case 18:
        return settings.voiceEnabled = this.interpreter.booleanValueOf(this.params.switchValue);
      case 19:
        return settings.seEnabled = this.interpreter.booleanValueOf(this.params.switchValue);
      case 20:
        code = this.interpreter.stringValueOf(this.params.textValue);
        language = LanguageManager.languages.first((function(_this) {
          return function(l) {
            return l.code === code;
          };
        })(this));
        if (language) {
          return LanguageManager.selectLanguage(language);
        }
        break;
      case 21:
        return GameManager.tempSettings.skip = this.interpreter.booleanValueOf(this.params.switchValue);
    }
  };


  /**
  * @method commandGetObjectData
  * @protected
   */

  Component_CommandInterpreter.prototype.commandGetObjectData = function() {
    var area, characterId, field, object, ref, ref1, scene;
    scene = SceneManager.scene;
    switch (this.params.objectType) {
      case 0:
        scene.behavior.changePictureDomain(this.params.numberDomain);
        object = SceneManager.scene.pictures[this.interpreter.numberValueOf(this.params.number)];
        break;
      case 1:
        object = SceneManager.scene.backgrounds[this.interpreter.numberValueOf(this.params.layer)];
        break;
      case 2:
        scene.behavior.changeTextDomain(this.params.numberDomain);
        object = SceneManager.scene.texts[this.interpreter.numberValueOf(this.params.number)];
        break;
      case 3:
        scene.behavior.changeVideoDomain(this.params.numberDomain);
        object = SceneManager.scene.videos[this.interpreter.numberValueOf(this.params.number)];
        break;
      case 4:
        characterId = this.interpreter.stringValueOf(this.params.characterId);
        object = SceneManager.scene.characters.first((function(_this) {
          return function(v) {
            return !v.disposed && v.rid === characterId;
          };
        })(this));
        break;
      case 5:
        object = gs.ObjectManager.current.objectById("messageBox");
        break;
      case 6:
        scene.behavior.changeMessageAreaDomain(this.params.numberDomain);
        area = SceneManager.scene.messageAreas[this.interpreter.numberValueOf(this.params.number)];
        object = area != null ? area.layout : void 0;
        break;
      case 7:
        scene.behavior.changeHotspotDomain(this.params.numberDomain);
        object = SceneManager.scene.hotspots[this.interpreter.numberValueOf(this.params.number)];
    }
    field = this.params.field;
    if (this.params.objectType === 4) {
      switch (this.params.field) {
        case 0:
          this.interpreter.setStringValueTo(this.params.targetVariable, ((ref = RecordManager.characters[characterId]) != null ? ref.index : void 0) || "");
          break;
        case 1:
          this.interpreter.setStringValueTo(this.params.targetVariable, lcs((ref1 = RecordManager.characters[characterId]) != null ? ref1.name : void 0) || "");
      }
      field -= 2;
    }
    if (object != null) {
      if (field >= 0) {
        switch (field) {
          case 0:
            switch (this.params.objectType) {
              case 2:
                return this.interpreter.setStringValueTo(this.params.targetVariable, object.text || "");
              case 3:
                return this.interpreter.setStringValueTo(this.params.targetVariable, object.video || "");
              default:
                return this.interpreter.setStringValueTo(this.params.targetVariable, object.image || "");
            }
            break;
          case 1:
            return this.interpreter.setNumberValueTo(this.params.targetVariable, object.dstRect.x);
          case 2:
            return this.interpreter.setNumberValueTo(this.params.targetVariable, object.dstRect.y);
          case 3:
            return this.interpreter.setNumberValueTo(this.params.targetVariable, Math.round(object.anchor.x * 100));
          case 4:
            return this.interpreter.setNumberValueTo(this.params.targetVariable, Math.round(object.anchor.y * 100));
          case 5:
            return this.interpreter.setNumberValueTo(this.params.targetVariable, Math.round(object.zoom.x * 100));
          case 6:
            return this.interpreter.setNumberValueTo(this.params.targetVariable, Math.round(object.zoom.y * 100));
          case 7:
            return this.interpreter.setNumberValueTo(this.params.targetVariable, object.dstRect.width);
          case 8:
            return this.interpreter.setNumberValueTo(this.params.targetVariable, object.dstRect.height);
          case 9:
            return this.interpreter.setNumberValueTo(this.params.targetVariable, object.zIndex);
          case 10:
            return this.interpreter.setNumberValueTo(this.params.targetVariable, object.opacity);
          case 11:
            return this.interpreter.setNumberValueTo(this.params.targetVariable, object.angle);
          case 12:
            return this.interpreter.setBooleanValueTo(this.params.targetVariable, object.visible);
          case 13:
            return this.interpreter.setNumberValueTo(this.params.targetVariable, object.blendMode);
          case 14:
            return this.interpreter.setBooleanValueTo(this.params.targetVariable, object.mirror);
        }
      }
    }
  };


  /**
  * @method commandSetObjectData
  * @protected
   */

  Component_CommandInterpreter.prototype.commandSetObjectData = function() {
    var area, characterId, field, name, object, ref, scene;
    scene = SceneManager.scene;
    switch (this.params.objectType) {
      case 0:
        scene.behavior.changePictureDomain(this.params.numberDomain);
        object = SceneManager.scene.pictures[this.interpreter.numberValueOf(this.params.number)];
        break;
      case 1:
        object = SceneManager.scene.backgrounds[this.interpreter.numberValueOf(this.params.layer)];
        break;
      case 2:
        scene.behavior.changeTextDomain(this.params.numberDomain);
        object = SceneManager.scene.texts[this.interpreter.numberValueOf(this.params.number)];
        break;
      case 3:
        scene.behavior.changeVideoDomain(this.params.numberDomain);
        object = SceneManager.scene.videos[this.interpreter.numberValueOf(this.params.number)];
        break;
      case 4:
        characterId = this.interpreter.stringValueOf(this.params.characterId);
        object = SceneManager.scene.characters.first((function(_this) {
          return function(v) {
            return !v.disposed && v.rid === characterId;
          };
        })(this));
        break;
      case 5:
        object = gs.ObjectManager.current.objectById("messageBox");
        break;
      case 6:
        scene.behavior.changeMessageAreaDomain(this.params.numberDomain);
        area = SceneManager.scene.messageAreas[this.interpreter.numberValueOf(this.params.number)];
        object = area != null ? area.layout : void 0;
        break;
      case 7:
        scene.behavior.changeHotspotDomain(this.params.numberDomain);
        object = SceneManager.scene.hotspots[this.interpreter.numberValueOf(this.params.number)];
    }
    field = this.params.field;
    if (this.params.objectType === 4) {
      switch (field) {
        case 0:
          name = this.interpreter.stringValueOf(this.params.textValue);
          if (object != null) {
            object.name = name;
          }
          if ((ref = RecordManager.characters[characterId]) != null) {
            ref.name = name;
          }
      }
      field--;
    }
    if (object != null) {
      if (field >= 0) {
        switch (field) {
          case 0:
            switch (this.params.objectType) {
              case 2:
                return object.text = this.interpreter.stringValueOf(this.params.textValue);
              case 3:
                return object.video = this.interpreter.stringValueOf(this.params.textValue);
              default:
                return object.image = this.interpreter.stringValueOf(this.params.textValue);
            }
            break;
          case 1:
            return object.dstRect.x = this.interpreter.numberValueOf(this.params.numberValue);
          case 2:
            return object.dstRect.y = this.interpreter.numberValueOf(this.params.numberValue);
          case 3:
            return object.anchor.x = this.interpreter.numberValueOf(this.params.numberValue) / 100;
          case 4:
            return object.anchor.y = this.interpreter.numberValueOf(this.params.numberValue) / 100;
          case 5:
            return object.zoom.x = this.interpreter.numberValueOf(this.params.numberValue) / 100;
          case 6:
            return object.zoom.y = this.interpreter.numberValueOf(this.params.numberValue) / 100;
          case 7:
            return object.zIndex = this.interpreter.numberValueOf(this.params.numberValue);
          case 8:
            return object.opacity = this.interpreter.numberValueOf(this.params.numberValue);
          case 9:
            return object.angle = this.interpreter.numberValueOf(this.params.numberValue);
          case 10:
            return object.visible = this.interpreter.booleanValueOf(this.params.switchValue);
          case 11:
            return object.blendMode = this.interpreter.numberValueOf(this.params.numberValue);
          case 12:
            return object.mirror = this.interpreter.booleanValueOf(this.params.switchValue);
        }
      }
    }
  };


  /**
  * @method commandChangeSounds
  * @protected
   */

  Component_CommandInterpreter.prototype.commandChangeSounds = function() {
    var fieldFlags, i, k, len, ref, results, sound, sounds;
    sounds = RecordManager.system.sounds;
    fieldFlags = this.params.fieldFlags || {};
    ref = this.params.sounds;
    results = [];
    for (i = k = 0, len = ref.length; k < len; i = ++k) {
      sound = ref[i];
      if (!gs.CommandFieldFlags.isLocked(fieldFlags["sounds." + i])) {
        results.push(sounds[i] = this.params.sounds[i]);
      } else {
        results.push(void 0);
      }
    }
    return results;
  };


  /**
  * @method commandChangeColors
  * @protected
   */

  Component_CommandInterpreter.prototype.commandChangeColors = function() {
    var color, colors, fieldFlags, i, k, len, ref, results;
    colors = RecordManager.system.colors;
    fieldFlags = this.params.fieldFlags || {};
    ref = this.params.colors;
    results = [];
    for (i = k = 0, len = ref.length; k < len; i = ++k) {
      color = ref[i];
      if (!gs.CommandFieldFlags.isLocked(fieldFlags["colors." + i])) {
        results.push(colors[i] = new gs.Color(this.params.colors[i]));
      } else {
        results.push(void 0);
      }
    }
    return results;
  };


  /**
  * @method commandChangeScreenCursor
  * @protected
   */

  Component_CommandInterpreter.prototype.commandChangeScreenCursor = function() {
    var bitmap, ref;
    if (((ref = this.params.graphic) != null ? ref.name : void 0) != null) {
      bitmap = ResourceManager.getBitmap("Graphics/Pictures/" + this.params.graphic.name);
      return Graphics.setCursorBitmap(bitmap, this.params.hx, this.params.hy);
    } else {
      return Graphics.setCursorBitmap(null, 0, 0);
    }
  };


  /**
  * @method commandResetGlobalData
  * @protected
   */

  Component_CommandInterpreter.prototype.commandResetGlobalData = function() {
    return GameManager.resetGlobalData();
  };


  /**
  * @method commandScript
  * @protected
   */

  Component_CommandInterpreter.prototype.commandScript = function() {
    var ex;
    try {
      if (!this.params.scriptFunc) {
        this.params.scriptFunc = eval("(function(){" + this.params.script + "})");
      }
      return this.params.scriptFunc();
    } catch (error) {
      ex = error;
      return console.log(ex);
    }
  };

  return Component_CommandInterpreter;

})(gs.Component);

window.CommandInterpreter = Component_CommandInterpreter;

gs.Component_CommandInterpreter = Component_CommandInterpreter;

//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQVFBLElBQUEsaUVBQUE7RUFBQTs7O0FBQU07O0FBQ0Y7Ozs7Ozs7RUFPYSx5QkFBQTs7QUFDVDs7Ozs7SUFLQSxJQUFDLENBQUEsT0FBRCxHQUFXOztBQUVYOzs7OztJQUtBLElBQUMsQ0FBQSxPQUFELEdBQVc7O0FBRVg7Ozs7Ozs7SUFPQSxJQUFDLENBQUEsZ0JBQUQsR0FBb0I7O0FBRXBCOzs7OztJQUtBLElBQUMsQ0FBQSxlQUFELEdBQW1CO0VBN0JWOzs7Ozs7QUErQmpCLEVBQUUsQ0FBQyxlQUFILEdBQXFCOztBQUVmO0VBQ0Ysa0JBQUMsQ0FBQSxvQkFBRCxHQUF3QixDQUFDLE9BQUQ7OztBQUV4Qjs7Ozs7Ozs7Ozs7O0VBV2EsNEJBQUMsRUFBRCxFQUFLLEtBQUw7O0FBQ1Q7Ozs7O0lBS0EsSUFBQyxDQUFBLEVBQUQsR0FBTTs7QUFFTjs7Ozs7SUFLQSxJQUFDLENBQUEsS0FBRCxHQUFTO0VBYkE7OztBQWViOzs7Ozs7OytCQU1BLEdBQUEsR0FBSyxTQUFDLEVBQUQsRUFBSyxLQUFMO0lBQ0QsSUFBQyxDQUFBLEVBQUQsR0FBTTtXQUNOLElBQUMsQ0FBQSxLQUFELEdBQVM7RUFGUjs7Ozs7O0FBSVQsRUFBRSxDQUFDLGtCQUFILEdBQXdCOztBQUVsQjs7O0VBQ0YsNEJBQUMsQ0FBQSxvQkFBRCxHQUF3QixDQUFDLFFBQUQsRUFBVyxTQUFYLEVBQXNCLHFCQUF0QixFQUE2Qyx1QkFBN0MsRUFBc0Usb0JBQXRFOzs7QUFFeEI7Ozs7Ozs7Ozt5Q0FRQSxtQkFBQSxHQUFxQixTQUFDLElBQUQsRUFBTyxPQUFQLEdBQUE7OztBQUdyQjs7Ozs7Ozs7Ozs7OztFQVlhLHNDQUFBO0lBQ1QsNERBQUE7O0FBRUE7Ozs7O0lBS0EsSUFBQyxDQUFBLFdBQUQsR0FBZTs7QUFFZjs7Ozs7SUFLQSxJQUFDLENBQUEsT0FBRCxHQUFXOztBQUVYOzs7Ozs7SUFNQSxJQUFD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PT09PT09PT09PT09PT09PT09PT09PT09PT1cbiNcbiMgICBTY3JpcHQ6IENvbXBvbmVudF9Db21tYW5kSW50ZXJwcmV0ZXJcbiNcbiMgICAkJENPUFlSSUdIVCQkXG4jXG4jID09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT1cblxuY2xhc3MgTGl2ZVByZXZpZXdJbmZvXG4gICAgIyMjKlxuICAgICogU3RvcmVzIGludGVybmFsIHByZXZpZXctaW5mbyBpZiB0aGUgZ2FtZSBydW5zIGN1cnJlbnRseSBpbiBMaXZlLVByZXZpZXcuXG4gICAgKiAgICAgICAgXG4gICAgKiBAbW9kdWxlIGdzXG4gICAgKiBAY2xhc3MgTGl2ZVByZXZpZXdJbmZvXG4gICAgKiBAbWVtYmVyb2YgZ3NcbiAgICAjIyNcbiAgICBjb25zdHJ1Y3RvcjogLT5cbiAgICAgICAgIyMjKlxuICAgICAgICAqIFRpbWVyIElEIGlmIGEgdGltZW91dCBmb3IgbGl2ZS1wcmV2aWV3IHdhcyBjb25maWd1cmVkIHRvIGV4aXQgdGhlIGdhbWUgbG9vcCBhZnRlciBhIGNlcnRhaW4gYW1vdW50IG9mIHRpbWUuXG4gICAgICAgICogQHByb3BlcnR5IHRpbWVvdXRcbiAgICAgICAgKiBAdHlwZSBudW1iZXJcbiAgICAgICAgIyMjXG4gICAgICAgIEB0aW1lb3V0ID0gbnVsbFxuICAgICAgICBcbiAgICAgICAgIyMjKiBcbiAgICAgICAgKiBJbmRpY2F0ZXMgaWYgTGl2ZS1QcmV2aWV3IGlzIGN1cnJlbnRseSB3YWl0aW5nIGZvciB0aGUgbmV4dCB1c2VyLWFjdGlvbi4gKFNlbGVjdGluZyBhbm90aGVyIGNvbW1hbmQsIGV0Yy4pXG4gICAgICAgICogQHByb3BlcnR5IHdhaXRpbmcgIFxuICAgICAgICAqIEB0eXBlIGJvb2xlYW5cbiAgICAgICAgIyMjXG4gICAgICAgIEB3YWl0aW5nID0gbm9cbiAgICAgICAgXG4gICAgICAgICMjIypcbiAgICAgICAgKiBDb3VudHMgdGhlIGFtb3VudCBvZiBleGVjdXRlZCBjb21tYW5kcyBzaW5jZSB0aGUgbGFzdCBcbiAgICAgICAgKiBpbnRlcnByZXRlci1wYXVzZSh3YWl0aW5nLCBldGMuKS4gSWYgaXRzIG1vcmUgdGhhbiA1MDAsIHRoZSBpbnRlcnByZXRlciB3aWxsIGF1dG9tYXRpY2FsbHkgcGF1c2UgZm9yIDEgZnJhbWUgdG8gXG4gICAgICAgICogYXZvaWQgdGhhdCBMaXZlLVByZXZpZXcgZnJlZXplcyB0aGUgRWRpdG9yIGluIGNhc2Ugb2YgZW5kbGVzcyBsb29wcy5cbiAgICAgICAgKiBAcHJvcGVydHkgZXhlY3V0ZWRDb21tYW5kc1xuICAgICAgICAqIEB0eXBlIG51bWJlclxuICAgICAgICAjIyNcbiAgICAgICAgQGV4ZWN1dGVkQ29tbWFuZHMgPSAwXG4gICAgICAgIFxuICAgICAgICAjIyMqIFxuICAgICAgICAqIEluZGljYXRlcyB0aGF0IHRoZSBjb21tYW5kIHRvIHNraXAgdG8gaGFzIG5vdCBiZWVuIGZvdW5kLiBcbiAgICAgICAgKiBAcHJvcGVydHkgY29tbWFuZE5vdEZvdW5kICBcbiAgICAgICAgKiBAdHlwZSBib29sZWFuXG4gICAgICAgICMjI1xuICAgICAgICBAY29tbWFuZE5vdEZvdW5kID0gbm9cbiAgICAgICAgXG5ncy5MaXZlUHJldmlld0luZm8gPSBMaXZlUHJldmlld0luZm9cbiAgICAgICAgXG5jbGFzcyBJbnRlcnByZXRlckNvbnRleHRcbiAgICBAb2JqZWN0Q29kZWNCbGFja0xpc3QgPSBbXCJvd25lclwiXVxuICAgIFxuICAgICMjIypcbiAgICAqIERlc2NyaWJlcyBhbiBpbnRlcnByZXRlci1jb250ZXh0IHdoaWNoIGhvbGRzIGluZm9ybWF0aW9uIGFib3V0XG4gICAgKiB0aGUgaW50ZXJwcmV0ZXIncyBvd25lciBhbmQgYWxzbyB1bmlxdWUgSUQgdXNlZCBmb3IgYWNjZXNzaW5nIGNvcnJlY3RcbiAgICAqIGxvY2FsIHZhcmlhYmxlcy5cbiAgICAqXG4gICAgKiBAbW9kdWxlIGdzXG4gICAgKiBAY2xhc3MgSW50ZXJwcmV0ZXJDb250ZXh0XG4gICAgKiBAbWVtYmVyb2YgZ3NcbiAgICAqIEBwYXJhbSB7bnVtYmVyfHN0cmluZ30gaWQgLSBBIHVuaXF1ZSBJRFxuICAgICogQHBhcmFtIHtPYmplY3R9IG93bmVyIC0gVGhlIG93bmVyIG9mIHRoZSBpbnRlcnByZXRlclxuICAgICMjI1xuICAgIGNvbnN0cnVjdG9yOiAoaWQsIG93bmVyKSAtPlxuICAgICAgICAjIyMqXG4gICAgICAgICogQSB1bmlxdWUgbnVtZXJpYyBvciB0ZXh0dWFsIElEIHVzZWQgZm9yIGFjY2Vzc2luZyBjb3JyZWN0IGxvY2FsIHZhcmlhYmxlcy5cbiAgICAgICAgKiBAcHJvcGVydHkgaWRcbiAgICAgICAgKiBAdHlwZSBudW1iZXJ8c3RyaW5nXG4gICAgICAgICMjI1xuICAgICAgICBAaWQgPSBpZFxuICAgICAgICBcbiAgICAgICAgIyMjKlxuICAgICAgICAqIFRoZSBvd25lciBvZiB0aGUgaW50ZXJwcmV0ZXIgKGUuZy4gY3VycmVudCBzY2VuZSwgZXRjLikuXG4gICAgICAgICogQHByb3BlcnR5IG93bmVyXG4gICAgICAgICogQHR5cGUgT2JqZWN0XG4gICAgICAgICMjI1xuICAgICAgICBAb3duZXIgPSBvd25lclxuICAgIFxuICAgICMjIypcbiAgICAqIFNldHMgdGhlIGNvbnRleHQncyBkYXRhLlxuICAgICogQHBhcmFtIHtudW1iZXJ8c3RyaW5nfSBpZCAtIEEgdW5pcXVlIElEXG4gICAgKiBAcGFyYW0ge09iamVjdH0gb3duZXIgLSBUaGUgb3duZXIgb2YgdGhlIGludGVycHJldGVyXG4gICAgKiBAbWV0aG9kIHNldFxuICAgICMjIyAgICBcbiAgICBzZXQ6IChpZCwgb3duZXIpIC0+XG4gICAgICAgIEBpZCA9IGlkXG4gICAgICAgIEBvd25lciA9IG93bmVyXG4gICAgICAgIFxuZ3MuSW50ZXJwcmV0ZXJDb250ZXh0ID0gSW50ZXJwcmV0ZXJDb250ZXh0XG5cbmNsYXNzIENvbXBvbmVudF9Db21tYW5kSW50ZXJwcmV0ZXIgZXh0ZW5kcyBncy5Db21wb25lbnRcbiAgICBAb2JqZWN0Q29kZWNCbGFja0xpc3QgPSBbXCJvYmplY3RcIiwgXCJjb21tYW5kXCIsIFwib25NZXNzYWdlQURWV2FpdGluZ1wiLCBcIm9uTWVzc2FnZUFEVkRpc2FwcGVhclwiLCBcIm9uTWVzc2FnZUFEVkZpbmlzaFwiXVxuICAgIFxuICAgICMjIypcbiAgICAqIENhbGxlZCBpZiB0aGlzIG9iamVjdCBpbnN0YW5jZSBpcyByZXN0b3JlZCBmcm9tIGEgZGF0YS1idW5kbGUuIEl0IGNhbiBiZSB1c2VkXG4gICAgKiByZS1hc3NpZ24gZXZlbnQtaGFuZGxlciwgYW5vbnltb3VzIGZ1bmN0aW9ucywgZXRjLlxuICAgICogXG4gICAgKiBAbWV0aG9kIG9uRGF0YUJ1bmRsZVJlc3RvcmUuXG4gICAgKiBAcGFyYW0gT2JqZWN0IGRhdGEgLSBUaGUgZGF0YS1idW5kbGVcbiAgICAqIEBwYXJhbSBncy5PYmplY3RDb2RlY0NvbnRleHQgY29udGV4dCAtIFRoZSBjb2RlYy1jb250ZXh0LlxuICAgICMjI1xuICAgIG9uRGF0YUJ1bmRsZVJlc3RvcmU6IChkYXRhLCBjb250ZXh0KSAtPlxuICAgIFxuICAgICAgICBcbiAgICAjIyMqXG4gICAgKiBBIGNvbXBvbmVudCB3aGljaCBhbGxvd3MgYSBnYW1lIG9iamVjdCB0byBwcm9jZXNzIGNvbW1hbmRzIGxpa2UgZm9yXG4gICAgKiBzY2VuZS1vYmplY3RzLiBGb3IgZWFjaCBjb21tYW5kIGEgY29tbWFuZC1mdW5jdGlvbiBleGlzdHMuIFRvIGFkZFxuICAgICogb3duIGN1c3RvbSBjb21tYW5kcyB0byB0aGUgaW50ZXJwcmV0ZXIganVzdCBjcmVhdGUgYSBzdWItY2xhc3MgYW5kXG4gICAgKiBvdmVycmlkZSB0aGUgZ3MuQ29tcG9uZW50X0NvbW1hbmRJbnRlcnByZXRlci5hc3NpZ25Db21tYW5kIG1ldGhvZFxuICAgICogYW5kIGFzc2lnbiB0aGUgY29tbWFuZC1mdW5jdGlvbiBmb3IgeW91ciBjdXN0b20tY29tbWFuZC5cbiAgICAqXG4gICAgKiBAbW9kdWxlIGdzXG4gICAgKiBAY2xhc3MgQ29tcG9uZW50X0NvbW1hbmRJbnRlcnByZXRlclxuICAgICogQGV4dGVuZHMgZ3MuQ29tcG9uZW50XG4gICAgKiBAbWVtYmVyb2YgZ3NcbiAgICAjIyNcbiAgICBjb25zdHJ1Y3RvcjogKCkgLT5cbiAgICAgICAgc3VwZXIoKVxuICAgICAgICBcbiAgICAgICAgIyMjKlxuICAgICAgICAqIFdhaXQtQ291bnRlciBpbiBmcmFtZXMuIElmIGdyZWF0ZXIgdGhhbiAwLCB0aGUgaW50ZXJwcmV0ZXIgd2lsbCBmb3IgdGhhdCBhbW91bnQgb2YgZnJhbWVzIGJlZm9yZSBjb250aW51ZS5cbiAgICAgICAgKiBAcHJvcGVydHkgd2FpdENvdW50ZXJcbiAgICAgICAgKiBAdHlwZSBudW1iZXJcbiAgICAgICAgIyMjXG4gICAgICAgIEB3YWl0Q291bnRlciA9IDBcbiAgICAgICAgXG4gICAgICAgICMjIypcbiAgICAgICAgKiBJbmRleCB0byB0aGUgbmV4dCBjb21tYW5kIHRvIGV4ZWN1dGUuXG4gICAgICAgICogQHByb3BlcnR5IHBvaW50ZXJcbiAgICAgICAgKiBAdHlwZSBudW1iZXJcbiAgICAgICAgIyMjXG4gICAgICAgIEBwb2ludGVyID0gMFxuICAgICAgICBcbiAgICAgICAgIyMjKlxuICAgICAgICAqIFN0b3JlcyBzdGF0ZXMgb2YgY29uZGl0aW9ucy5cbiAgICAgICAgKiBAcHJvcGVydHkgY29uZGl0aW9uc1xuICAgICAgICAqIEB0eXBlIG51bWJlclxuICAgICAgICAqIEBwcm90ZWN0ZWRcbiAgICAgICAgIyMjXG4gICAgICAgIEBjb25kaXRpb25zID0gW11cbiAgICAgICAgXG4gICAgICAgICMjIypcbiAgICAgICAgKiBTdG9yZXMgc3RhdGVzIG9mIGxvb3BzLlxuICAgICAgICAqIEBwcm9wZXJ0eSBsb29wc1xuICAgICAgICAqIEB0eXBlIG51bWJlclxuICAgICAgICAqIEBwcm90ZWN0ZWRcbiAgICAgICAgIyMjXG4gICAgICAgIEBsb29wcyA9IFtdXG4gICAgICAgIFxuICAgICAgICAjIEZJWE1FOiBTaG91bGQgbm90IGJlIHN0b3JlZCBpbiB0aGUgaW50ZXJwcmV0ZXIuXG4gICAgICAgIEB0aW1lcnMgPSBbXVxuICAgICAgICBcbiAgICAgICAgIyMjKlxuICAgICAgICAqIEluZGljYXRlcyBpZiB0aGUgaW50ZXJwcmV0ZXIgaXMgY3VycmVudGx5IHJ1bm5pbmcuXG4gICAgICAgICogQHByb3BlcnR5IGlzUnVubmluZ1xuICAgICAgICAqIEB0eXBlIGJvb2xlYW5cbiAgICAgICAgKiBAcmVhZE9ubHlcbiAgICAgICAgIyMjXG4gICAgICAgIEBpc1J1bm5pbmcgPSBub1xuICAgICAgICBcbiAgICAgICAgIyMjKlxuICAgICAgICAqIEluZGljYXRlcyBpZiB0aGUgaW50ZXJwcmV0ZXIgaXMgY3VycmVudGx5IHdhaXRpbmcuXG4gICAgICAgICogQHByb3BlcnR5IGlzV2FpdGluZ1xuICAgICAgICAqIEB0eXBlIGJvb2xlYW5cbiAgICAgICAgIyMjXG4gICAgICAgIEBpc1dhaXRpbmcgPSBub1xuICAgICAgICBcbiAgICAgICAgIyMjKlxuICAgICAgICAqIEluZGljYXRlcyBpZiB0aGUgaW50ZXJwcmV0ZXIgaXMgY3VycmVudGx5IHdhaXRpbmcgdW50aWwgYSBtZXNzYWdlIHByb2Nlc3NlZCBieSBhbm90aGVyIGNvbnRleHQgbGlrZSBhIENvbW1vbiBFdmVudFxuICAgICAgICAqIGlzIGZpbmlzaGVkLlxuICAgICAgICAqIEZJWE1FOiBDb25mbGljdCBoYW5kbGluZyBjYW4gYmUgcmVtb3ZlZCBtYXliZS4gXG4gICAgICAgICogQHByb3BlcnR5IGlzV2FpdGluZ0Zvck1lc3NhZ2VcbiAgICAgICAgKiBAdHlwZSBib29sZWFuXG4gICAgICAgICMjI1xuICAgICAgICBAaXNXYWl0aW5nRm9yTWVzc2FnZSA9IG5vXG4gICAgICAgIFxuICAgICAgICAjIyMqXG4gICAgICAgICogU3RvcmVzIGludGVybmFsIHByZXZpZXctaW5mbyBpZiB0aGUgZ2FtZSBydW5zIGN1cnJlbnRseSBpbiBMaXZlLVByZXZpZXcuXG4gICAgICAgICogPHVsPlxuICAgICAgICAqIDxsaT5wcmV2aWV3SW5mby50aW1lb3V0IC0gVGltZXIgSUQgaWYgYSB0aW1lb3V0IGZvciBsaXZlLXByZXZpZXcgd2FzIGNvbmZpZ3VyZWQgdG8gZXhpdCB0aGUgZ2FtZSBsb29wIGFmdGVyIGEgY2VydGFpbiBhbW91bnQgb2YgdGltZS48L2xpPlxuICAgICAgICAqIDxsaT5wcmV2aWV3SW5mby53YWl0aW5nIC0gSW5kaWNhdGVzIGlmIExpdmUtUHJldmlldyBpcyBjdXJyZW50bHkgd2FpdGluZyBmb3IgdGhlIG5leHQgdXNlci1hY3Rpb24uIChTZWxlY3RpbmcgYW5vdGhlciBjb21tYW5kLCBldGMuKTwvbGk+XG4gICAgICAgICogPGxpPnByZXZpZXdJbmZvLmV4ZWN1dGVkQ29tbWFuZHMgLSBDb3VudHMgdGhlIGFtb3VudCBvZiBleGVjdXRlZCBjb21tYW5kcyBzaW5jZSB0aGUgbGFzdCBcbiAgICAgICAgKiBpbnRlcnByZXRlci1wYXVzZSh3YWl0aW5nLCBldGMuKS4gSWYgaXRzIG1vcmUgdGhhbiA1MDAsIHRoZSBpbnRlcnByZXRlciB3aWxsIGF1dG9tYXRpY2FsbHkgcGF1c2UgZm9yIDEgZnJhbWUgdG8gXG4gICAgICAgICogYXZvaWQgdGhhdCBMaXZlLVByZXZpZXcgZnJlZXplcyB0aGUgRWRpdG9yIGluIGNhc2Ugb2YgZW5kbGVzcyBsb29wcy48L2xpPlxuICAgICAgICAqIDwvdWw+XG4gICAgICAgICogQHByb3BlcnR5IHByZXZpZXdJbmZvXG4gICAgICAgICogQHR5cGUgYm9vbGVhblxuICAgICAgICAqIEBwcm90ZWN0ZWRcbiAgICAgICAgIyMjXG4gICAgICAgIEBwcmV2aWV3SW5mbyA9IG5ldyBncy5MaXZlUHJldmlld0luZm8oKVxuICAgICAgICBcbiAgICAgICAgIyMjKlxuICAgICAgICAqIFN0b3JlcyBMaXZlLVByZXZpZXcgcmVsYXRlZCBpbmZvIHBhc3NlZCBmcm9tIHRoZSBWTiBNYWtlciBlZGl0b3IgbGlrZSB0aGUgY29tbWFuZC1pbmRleCB0aGUgcGxheWVyIGNsaWNrZWQgb24sIGV0Yy5cbiAgICAgICAgKiBAcHJvcGVydHkgcHJldmlld0RhdGFcbiAgICAgICAgKiBAdHlwZSBPYmplY3RcbiAgICAgICAgKiBAcHJvdGVjdGVkXG4gICAgICAgICMjI1xuICAgICAgICBAcHJldmlld0RhdGEgPSBudWxsXG4gICAgICAgIFxuICAgICAgICAjIyMqXG4gICAgICAgICogSW5kaWNhdGVzIGlmIHRoZSBpbnRlcnByZXRlciBhdXRvbWF0aWNhbGx5IHJlcGVhdHMgZXhlY3V0aW9uIGFmdGVyIHRoZSBsYXN0IGNvbW1hbmQgd2FzIGV4ZWN1dGVkLlxuICAgICAgICAqIEBwcm9wZXJ0eSByZXBlYXRcbiAgICAgICAgKiBAdHlwZSBib29sZWFuXG4gICAgICAgICMjI1xuICAgICAgICBAcmVwZWF0ID0gbm9cbiAgICAgICAgXG4gICAgICAgICMjIypcbiAgICAgICAgKiBUaGUgZXhlY3V0aW9uIGNvbnRleHQgb2YgdGhlIGludGVycHJldGVyLlxuICAgICAgICAqIEBwcm9wZXJ0eSBjb250ZXh0XG4gICAgICAgICogQHR5cGUgZ3MuSW50ZXJwcmV0ZXJDb250ZXh0XG4gICAgICAgICogQHByb3RlY3RlZFxuICAgICAgICAjIyNcbiAgICAgICAgQGNvbnRleHQgPSBuZXcgZ3MuSW50ZXJwcmV0ZXJDb250ZXh0KDAsIG51bGwpXG4gICAgICAgIFxuICAgICAgICAjIyMqXG4gICAgICAgICogU3ViLUludGVycHJldGVyIGZyb20gYSBDb21tb24gRXZlbnQgQ2FsbC4gVGhlIGludGVycHJldGVyIHdpbGwgd2FpdCB1bnRpbCB0aGUgc3ViLWludGVycHJldGVyIGlzIGRvbmUgYW5kIHNldCBiYWNrIHRvXG4gICAgICAgICogPGI+bnVsbDwvYj4uXG4gICAgICAgICogQHByb3BlcnR5IHN1YkludGVycHJldGVyXG4gICAgICAgICogQHR5cGUgZ3MuQ29tcG9uZW50X0NvbW1hbmRJbnRlcnByZXRlclxuICAgICAgICAqIEBwcm90ZWN0ZWRcbiAgICAgICAgIyMjXG4gICAgICAgIEBzdWJJbnRlcnByZXRlciA9IG51bGxcbiAgICAgICAgXG4gICAgICAgICMjIypcbiAgICAgICAgKiBDdXJyZW50IGluZGVudC1sZXZlbCBvZiBleGVjdXRpb25cbiAgICAgICAgKiBAcHJvcGVydHkgaW5kZW50XG4gICAgICAgICogQHR5cGUgbnVtYmVyXG4gICAgICAgICogQHByb3RlY3RlZFxuICAgICAgICAjIyNcbiAgICAgICAgQGluZGVudCA9IDBcbiAgICAgICAgXG4gICAgICAgICMjIypcbiAgICAgICAgKiBTdG9yZXMgaW5mb3JtYXRpb24gYWJvdXQgZm9yIHdoYXQgdGhlIGludGVycHJldGVyIGlzIGN1cnJlbnRseSB3YWl0aW5nIGZvciBsaWtlIGZvciBhIEFEViBtZXNzYWdlLCBldGMuIHRvXG4gICAgICAgICogcmVzdG9yZSBwcm9iYWJseSB3aGVuIGxvYWRlZCBmcm9tIGEgc2F2ZS1nYW1lLlxuICAgICAgICAqIEBwcm9wZXJ0eSB3YWl0aW5nRm9yXG4gICAgICAgICogQHR5cGUgT2JqZWN0XG4gICAgICAgICogQHByb3RlY3RlZFxuICAgICAgICAjIyNcbiAgICAgICAgQHdhaXRpbmdGb3IgPSB7fVxuICAgICAgICBcbiAgICAgICAgIyMjKlxuICAgICAgICAqIFN0b3JlcyBpbnRlcnByZXRlciByZWxhdGVkIHNldHRpbmdzIGxpa2UgaG93IHRvIGhhbmRsZSBtZXNzYWdlcywgZXRjLlxuICAgICAgICAqIEBwcm9wZXJ0eSBzZXR0aW5nc1xuICAgICAgICAqIEB0eXBlIE9iamVjdFxuICAgICAgICAqIEBwcm90ZWN0ZWRcbiAgICAgICAgIyMjXG4gICAgICAgIEBzZXR0aW5ncyA9IHsgbWVzc2FnZTogeyBieUlkOiB7fSwgYXV0b0VyYXNlOiB5ZXMsIHdhaXRBdEVuZDogeWVzLCBiYWNrbG9nOiB5ZXMgfSwgc2NyZWVuOiB7IHBhbjogbmV3IGdzLlBvaW50KDAsIDApIH0gfVxuICAgICAgIFxuICAgICAgICAjIyMqXG4gICAgICAgICogTWFwcGluZyB0YWJsZSB0byBxdWlja2x5IGdldCB0aGUgYW5jaG9yIHBvaW50IGZvciB0aGUgYW4gaW5zZXJ0ZWQgYW5jaG9yLXBvaW50IGNvbnN0YW50IHN1Y2ggYXNcbiAgICAgICAgKiBUb3AtTGVmdCgwKSwgVG9wKDEpLCBUb3AtUmlnaHQoMikgYW5kIHNvIG9uLlxuICAgICAgICAqIEBwcm9wZXJ0eSBncmFwaGljQW5jaG9yUG9pbnRzQnlDb25zdGFudFxuICAgICAgICAqIEB0eXBlIGdzLlBvaW50W11cbiAgICAgICAgKiBAcHJvdGVjdGVkXG4gICAgICAgICMjI1xuICAgICAgICBAZ3JhcGhpY0FuY2hvclBvaW50c0J5Q29uc3RhbnQgPSBbXG4gICAgICAgICAgICBuZXcgZ3MuUG9pbnQoMC4wLCAwLjApLFxuICAgICAgICAgICAgbmV3IGdzLlBvaW50KDAuNSwgMC4wKSxcbiAgICAgICAgICAgIG5ldyBncy5Qb2ludCgxLjAsIDAuMCksXG4gICAgICAgICAgICBuZXcgZ3MuUG9pbnQoMS4wLCAwLjUpLFxuICAgICAgICAgICAgbmV3IGdzLlBvaW50KDEuMCwgMS4wKSxcbiAgICAgICAgICAgIG5ldyBncy5Qb2ludCgwLjUsIDEuMCksXG4gICAgICAgICAgICBuZXcgZ3MuUG9pbnQoMC4wLCAxLjApLFxuICAgICAgICAgICAgbmV3IGdzLlBvaW50KDAuMCwgMC41KSxcbiAgICAgICAgICAgIG5ldyBncy5Qb2ludCgwLjUsIDAuNSlcbiAgICAgICAgXVxuICAgICAgICBcbiAgICBvbkhvdHNwb3RDbGljazogKGUsIGRhdGEpIC0+IFxuICAgICAgICBAZXhlY3V0ZUFjdGlvbihkYXRhLnBhcmFtcy5hY3Rpb25zLm9uQ2xpY2ssIG5vLCBkYXRhLmJpbmRWYWx1ZSlcbiAgICAgICAgXG4gICAgb25Ib3RzcG90RW50ZXI6IChlLCBkYXRhKSAtPiBcbiAgICAgICAgQGV4ZWN1dGVBY3Rpb24oZGF0YS5wYXJhbXMuYWN0aW9ucy5vbkVudGVyLCB5ZXMsIGRhdGEuYmluZFZhbHVlKVxuICAgICAgICBcbiAgICBvbkhvdHNwb3RMZWF2ZTogKGUsIGRhdGEpIC0+IFxuICAgICAgICBAZXhlY3V0ZUFjdGlvbihkYXRhLnBhcmFtcy5hY3Rpb25zLm9uTGVhdmUsIG5vLCBkYXRhLmJpbmRWYWx1ZSlcbiAgICBvbkhvdHNwb3REcmFnU3RhcnQ6IChlLCBkYXRhKSAtPiBcbiAgICAgICAgQGV4ZWN1dGVBY3Rpb24oZGF0YS5wYXJhbXMuYWN0aW9ucy5vbkRyYWcsIHllcywgZGF0YS5iaW5kVmFsdWUpXG4gICAgb25Ib3RzcG90RHJhZzogKGUsIGRhdGEpIC0+IFxuICAgICAgICBAZXhlY3V0ZUFjdGlvbihkYXRhLnBhcmFtcy5hY3Rpb25zLm9uRHJhZywgeWVzLCBkYXRhLmJpbmRWYWx1ZSlcbiAgICBvbkhvdHNwb3REcmFnRW5kOiAoZSwgZGF0YSkgLT4gXG4gICAgICAgIEBleGVjdXRlQWN0aW9uKGRhdGEucGFyYW1zLmFjdGlvbnMub25EcmFnLCBubywgZGF0YS5iaW5kVmFsdWUpXG4gICAgb25Ib3RzcG90U3RhdGVDaGFuZ2VkOiAoZSwgcGFyYW1zKSAtPiBcbiAgICAgICAgaWYgZS5zZW5kZXIuYmVoYXZpb3Iuc2VsZWN0ZWRcbiAgICAgICAgICAgIEBleGVjdXRlQWN0aW9uKHBhcmFtcy5hY3Rpb25zLm9uU2VsZWN0LCB5ZXMpXG4gICAgICAgIGVsc2VcbiAgICAgICAgICAgIEBleGVjdXRlQWN0aW9uKHBhcmFtcy5hY3Rpb25zLm9uRGVzZWxlY3QsIG5vKVxuICAgICAgICAgICAgXG4gICAgIyMjKlxuICAgICogQ2FsbGVkIHdoZW4gYSBBRFYgbWVzc2FnZSBmaW5pc2hlZCByZW5kZXJpbmcgYW5kIGlzIG5vdyB3YWl0aW5nXG4gICAgKiBmb3IgdGhlIHVzZXIvYXV0b20tbWVzc2FnZSB0aW1lciB0byBwcm9jZWVkLlxuICAgICpcbiAgICAqIEBtZXRob2Qgb25NZXNzYWdlQURWV2FpdGluZ1xuICAgICogQHJldHVybiB7T2JqZWN0fSBFdmVudCBPYmplY3QgY29udGFpbmluZyBhZGRpdGlvbmFsIGRhdGEuXG4gICAgKiBAcHJvdGVjdGVkXG4gICAgIyMjICAgICAgIFxuICAgIG9uTWVzc2FnZUFEVldhaXRpbmc6IChlKSAtPlxuICAgICAgICBtZXNzYWdlT2JqZWN0ID0gZS5zZW5kZXIub2JqZWN0XG4gICAgICAgIGlmICFAbWVzc2FnZVNldHRpbmdzKCkud2FpdEF0RW5kXG4gICAgICAgICAgICBpZiBlLmRhdGEucGFyYW1zLndhaXRGb3JDb21wbGV0aW9uXG4gICAgICAgICAgICAgICAgQGlzV2FpdGluZyA9IG5vXG4gICAgICAgICAgICBtZXNzYWdlT2JqZWN0LnRleHRSZW5kZXJlci5pc1dhaXRpbmcgPSBub1xuICAgICAgICAgICAgbWVzc2FnZU9iamVjdC50ZXh0UmVuZGVyZXIuaXNSdW5uaW5nID0gbm9cbiAgICAgICAgbWVzc2FnZU9iamVjdC5ldmVudHMub2ZmIFwid2FpdGluZ1wiLCBlLmhhbmRsZXJcbiAgICAgICAgXG4gICAgICAgIGlmIEBtZXNzYWdlU2V0dGluZ3MoKS5iYWNrbG9nIGFuZCAobWVzc2FnZU9iamVjdC5zZXR0aW5ncy5hdXRvRXJhc2Ugb3IgbWVzc2FnZU9iamVjdC5zZXR0aW5ncy5wYXJhZ3JhcGhTcGFjaW5nID4gMClcbiAgICAgICAgICAgIEdhbWVNYW5hZ2VyLmJhY2tsb2cucHVzaCh7IGNoYXJhY3RlcjogbWVzc2FnZU9iamVjdC5jaGFyYWN0ZXIsIG1lc3NhZ2U6IG1lc3NhZ2VPYmplY3QuYmVoYXZpb3IubWVzc2FnZSwgY2hvaWNlczogW10gfSkgXG4gICAgIFxuICAgICMjIypcbiAgICAqIENhbGxlZCB3aGVuIGFuIEFEViBtZXNzYWdlIGZpbmlzaGVkIGZhZGUtb3V0LlxuICAgICpcbiAgICAqIEBtZXRob2Qgb25NZXNzYWdlQURWRGlzYXBwZWFyXG4gICAgKiBAcmV0dXJuIHtPYmplY3R9IEV2ZW50IE9iamVjdCBjb250YWluaW5nIGFkZGl0aW9uYWwgZGF0YS5cbiAgICAqIEBwcm90ZWN0ZWRcbiAgICAjIyMgICAgXG4gICAgb25NZXNzYWdlQURWRGlzYXBwZWFyOiAobWVzc2FnZU9iamVjdCwgd2FpdEZvckNvbXBsZXRpb24pIC0+XG4gICAgICAgIFNjZW5lTWFuYWdlci5zY2VuZS5jdXJyZW50Q2hhcmFjdGVyID0geyBuYW1lOiBcIlwiIH1cbiAgICAgICAgbWVzc2FnZU9iamVjdC5iZWhhdmlvci5jbGVhcigpXG4gICAgICAgIG1lc3NhZ2VPYmplY3QudmlzaWJsZSA9IG5vXG4gICAgICAgIFxuICAgICAgICBpZiBtZXNzYWdlT2JqZWN0LndhaXRGb3JDb21wbGV0aW9uICAgIFxuICAgICAgICAgICAgQGlzV2FpdGluZyA9IG5vXG4gICAgICAgIEB3YWl0aW5nRm9yLm1lc3NhZ2VBRFYgPSBudWxsXG4gICAgXG4gICAgIyMjKlxuICAgICogQ2FsbGVkIHdoZW4gYW4gQURWIG1lc3NhZ2UgZmluaXNoZWQgY2xlYXIuXG4gICAgKlxuICAgICogQG1ldGhvZCBvbk1lc3NhZ2VBRFZDbGVhclxuICAgICogQHJldHVybiB7T2JqZWN0fSBFdmVudCBPYmplY3QgY29udGFpbmluZyBhZGRpdGlvbmFsIGRhdGEuXG4gICAgKiBAcHJvdGVjdGVkXG4gICAgIyMjICAgICAgICBcbiAgICBvbk1lc3NhZ2VBRFZDbGVhcjogKG1lc3NhZ2VPYmplY3QsIHdhaXRGb3JDb21wbGV0aW9uKSAtPlxuICAgICAgICBtZXNzYWdlT2JqZWN0ID0gQHRhcmdldE1lc3NhZ2UoKVxuICAgICAgICBpZiBAbWVzc2FnZVNldHRpbmdzKCkuYmFja2xvZyAgIFxuICAgICAgICAgICAgR2FtZU1hbmFnZXIuYmFja2xvZy5wdXNoKHsgY2hhcmFjdGVyOiBtZXNzYWdlT2JqZWN0LmNoYXJhY3RlciwgbWVzc2FnZTogbWVzc2FnZU9iamVjdC5iZWhhdmlvci5tZXNzYWdlLCBjaG9pY2VzOiBbXSB9KSBcbiAgICAgICAgQG9uTWVzc2FnZUFEVkRpc2FwcGVhcihtZXNzYWdlT2JqZWN0LCB3YWl0Rm9yQ29tcGxldGlvbilcbiAgICAgICAgXG4gICAgICAgIFxuICAgIFxuICAgICMjIypcbiAgICAqIENhbGxlZCB3aGVuIGEgaG90c3BvdC9pbWFnZS1tYXAgc2VuZHMgYSBcImp1bXBUb1wiIGV2ZW50IHRvIGxldCB0aGVcbiAgICAqIGludGVycHJldGVyIGp1bXAgdG8gdGhlIHBvc2l0aW9uIGRlZmluZWQgaW4gdGhlIGV2ZW50IG9iamVjdC5cbiAgICAqXG4gICAgKiBAbWV0aG9kIG9uSnVtcFRvXG4gICAgKiBAcmV0dXJuIHtPYmplY3R9IEV2ZW50IE9iamVjdCBjb250YWluaW5nIGFkZGl0aW9uYWwgZGF0YS5cbiAgICAqIEBwcm90ZWN0ZWRcbiAgICAjIyMgIFxuICAgIG9uSnVtcFRvOiAoZSkgLT5cbiAgICAgICAgQGp1bXBUb0xhYmVsKGUubGFiZWwpXG4gICAgICAgIEBpc1dhaXRpbmcgPSBub1xuICAgICAgICBcbiAgICAjIyMqXG4gICAgKiBDYWxsZWQgd2hlbiBhIGhvdHNwb3QvaW1hZ2UtbWFwIHNlbmRzIGEgXCJjYWxsQ29tbW9uRXZlbnRcIiBldmVudCB0byBsZXQgdGhlXG4gICAgKiBpbnRlcnByZXRlciBjYWxsIHRoZSBjb21tb24gZXZlbnQgZGVmaW5lZCBpbiB0aGUgZXZlbnQgb2JqZWN0LlxuICAgICpcbiAgICAqIEBtZXRob2Qgb25KdW1wVG9cbiAgICAqIEByZXR1cm4ge09iamVjdH0gRXZlbnQgT2JqZWN0IGNvbnRhaW5pbmcgYWRkaXRpb25hbCBkYXRhLlxuICAgICogQHByb3RlY3RlZFxuICAgICMjIyAgXG4gICAgb25DYWxsQ29tbW9uRXZlbnQ6IChlKSAtPlxuICAgICAgICBldmVudElkID0gZS5jb21tb25FdmVudElkXG4gICAgICAgIGV2ZW50ID0gUmVjb3JkTWFuYWdlci5jb21tb25FdmVudHNbZXZlbnRJZF1cbiAgICAgICAgaWYgIWV2ZW50XG4gICAgICAgICAgICBldmVudCA9IFJlY29yZE1hbmFnZXIuY29tbW9uRXZlbnRzLmZpcnN0ICh4KSA9PiB4Lm5hbWUgPT0gZXZlbnRJZFxuICAgICAgICAgICAgZXZlbnRJZCA9IGV2ZW50LmluZGV4IGlmIGV2ZW50XG4gICAgICAgIEBjYWxsQ29tbW9uRXZlbnQoZXZlbnRJZCwgZS5wYXJhbXMgfHwgW10sICFlLmZpbmlzaClcbiAgICAgICAgQGlzV2FpdGluZyA9IGUud2FpdGluZyA/IG5vXG4gICAgICAgIFxuICAgICMjIypcbiAgICAqIENhbGxlZCB3aGVuIGEgQURWIG1lc3NhZ2UgZmluaXNoZXMuIFxuICAgICpcbiAgICAqIEBtZXRob2Qgb25NZXNzYWdlQURWRmluaXNoXG4gICAgKiBAcmV0dXJuIHtPYmplY3R9IEV2ZW50IE9iamVjdCBjb250YWluaW5nIGFkZGl0aW9uYWwgZGF0YS5cbiAgICAqIEBwcm90ZWN0ZWRcbiAgICAjIyMgIFxuICAgIG9uTWVzc2FnZUFEVkZpbmlzaDogKGUpIC0+XG4gICAgICAgIG1lc3NhZ2VPYmplY3QgPSBlLnNlbmRlci5vYmplY3QgXG4gIFxuICAgICAgICBpZiBub3QgQG1lc3NhZ2VTZXR0aW5ncygpLndhaXRBdEVuZCB0aGVuIHJldHVyblxuICAgICAgICBcbiAgICAgICAgR2FtZU1hbmFnZXIuZ2xvYmFsRGF0YS5tZXNzYWdlc1tsY3NtKGUuZGF0YS5wYXJhbXMubWVzc2FnZSldID0geyByZWFkOiB5ZXMgfVxuICAgICAgICBHYW1lTWFuYWdlci5zYXZlR2xvYmFsRGF0YSgpXG4gICAgICAgIGlmIGUuZGF0YS5wYXJhbXMud2FpdEZvckNvbXBsZXRpb25cbiAgICAgICAgICAgIEBpc1dhaXRpbmcgPSBub1xuICAgICAgICBAd2FpdGluZ0Zvci5tZXNzYWdlQURWID0gbnVsbFxuICAgICAgICBwb2ludGVyID0gQHBvaW50ZXJcbiAgICAgICAgY29tbWFuZHMgPSBAb2JqZWN0LmNvbW1hbmRzXG4gICAgICAgIFxuICAgICAgICBtZXNzYWdlT2JqZWN0LmV2ZW50cy5vZmYgXCJmaW5pc2hcIiwgZS5oYW5kbGVyXG4gICAgICAgICNtZXNzYWdlT2JqZWN0LmNoYXJhY3RlciA9IG51bGxcbiAgICAgICAgXG4gICAgICAgIGlmIG1lc3NhZ2VPYmplY3Qudm9pY2U/IGFuZCBHYW1lTWFuYWdlci5zZXR0aW5ncy5za2lwVm9pY2VPbkFjdGlvblxuICAgICAgICAgICAgQXVkaW9NYW5hZ2VyLnN0b3BTb3VuZChtZXNzYWdlT2JqZWN0LnZvaWNlLm5hbWUpXG4gICAgICAgIFxuICAgICAgICBpZiBub3QgQGlzTWVzc2FnZUNvbW1hbmQocG9pbnRlciwgY29tbWFuZHMpIGFuZCBAbWVzc2FnZVNldHRpbmdzKCkuYXV0b0VyYXNlXG4gICAgICAgICAgICBAaXNXYWl0aW5nID0geWVzXG4gICAgICAgICAgICBAd2FpdGluZ0Zvci5tZXNzYWdlQURWID0gZS5kYXRhLnBhcmFtc1xuICAgICAgICBcbiAgICAgICAgICAgIGZhZGluZyA9IEdhbWVNYW5hZ2VyLnRlbXBTZXR0aW5ncy5tZXNzYWdlRmFkaW5nXG4gICAgICAgICAgICBkdXJhdGlvbiA9IGlmIEdhbWVNYW5hZ2VyLnRlbXBTZXR0aW5ncy5za2lwIHRoZW4gMCBlbHNlIGZhZGluZy5kdXJhdGlvblxuICAgICAgICAgICAgXG4gICAgICAgICAgICBtZXNzYWdlT2JqZWN0LndhaXRGb3JDb21wbGV0aW9uID0gZS5kYXRhLnBhcmFtcy53YWl0Rm9yQ29tcGxldGlvblxuICAgICAgICAgICAgbWVzc2FnZU9iamVjdC5hbmltYXRvci5kaXNhcHBlYXIoZmFkaW5nLmFuaW1hdGlvbiwgZmFkaW5nLmVhc2luZywgZHVyYXRpb24sIGdzLkNhbGxCYWNrKFwib25NZXNzYWdlQURWRGlzYXBwZWFyXCIsIHRoaXMsIGUuZGF0YS5wYXJhbXMud2FpdEZvckNvbXBsZXRpb24pKVxuXG4gICAgIyMjKlxuICAgICogQ2FsbGVkIHdoZW4gYSBjb21tb24gZXZlbnQgZmluaXNoZWQgZXhlY3V0aW9uLiBJbiBtb3N0IGNhc2VzLCB0aGUgaW50ZXJwcmV0ZXJcbiAgICAqIHdpbGwgc3RvcCB3YWl0aW5nIGFuZCBjb250aW51ZSBwcm9jZXNzaW5nIGFmdGVyIHRoaXMuIEJ1dCBoXG4gICAgKlxuICAgICogQG1ldGhvZCBvbkNvbW1vbkV2ZW50RmluaXNoXG4gICAgKiBAcmV0dXJuIHtPYmplY3R9IEV2ZW50IE9iamVjdCBjb250YWluaW5nIGFkZGl0aW9uYWwgZGF0YS5cbiAgICAqIEBwcm90ZWN0ZWRcbiAgICAjIyNcbiAgICBvbkNvbW1vbkV2ZW50RmluaXNoOiAoZSkgLT5cbiAgICAgICAgU2NlbmVNYW5hZ2VyLnNjZW5lLmNvbW1vbkV2ZW50Q29udGFpbmVyLnJlbW92ZU9iamVjdChlLnNlbmRlci5vYmplY3QpXG4gICAgICAgIGUuc2VuZGVyLm9iamVjdC5ldmVudHMub2ZmIFwiZmluaXNoXCJcbiAgICAgICAgQHN1YkludGVycHJldGVyID0gbnVsbFxuICAgICAgICBAaXNXYWl0aW5nID0gZS5kYXRhLndhaXRpbmcgPyBub1xuICAgIFxuICAgICMjIypcbiAgICAqIENhbGxlZCB3aGVuIGEgc2NlbmUgY2FsbCBmaW5pc2hlZCBleGVjdXRpb24uXG4gICAgKlxuICAgICogQG1ldGhvZCBvbkNhbGxTY2VuZUZpbmlzaFxuICAgICogQHBhcmFtIHtPYmplY3R9IHNlbmRlciAtIFRoZSBzZW5kZXIgb2YgdGhpcyBldmVudC5cbiAgICAqIEBwcm90ZWN0ZWRcbiAgICAjIyMgICAgXG4gICAgb25DYWxsU2NlbmVGaW5pc2g6IChzZW5kZXIpIC0+XG4gICAgICAgIEBpc1dhaXRpbmcgPSBub1xuICAgICAgICBAc3ViSW50ZXJwcmV0ZXIgPSBudWxsXG4gICAgICAgIFxuICAgICMjIypcbiAgICAqIFNlcmlhbGl6ZXMgdGhlIGludGVycHJldGVyIGludG8gYSBkYXRhLWJ1bmRsZS5cbiAgICAqXG4gICAgKiBAbWV0aG9kIHRvRGF0YUJ1bmRsZVxuICAgICogQHJldHVybiB7T2JqZWN0fSBUaGUgZGF0YS1idW5kbGUuXG4gICAgIyMjICAgXG4gICAgdG9EYXRhQnVuZGxlOiAtPlxuICAgICAgICBpZiBAaXNJbnB1dERhdGFDb21tYW5kKE1hdGgubWF4KEBwb2ludGVyIC0gMSwgMCksIEBvYmplY3QuY29tbWFuZHMpIFxuICAgICAgICAgICAgcG9pbnRlcjogTWF0aC5tYXgoQHBvaW50ZXIgLSAxICwgMCksXG4gICAgICAgICAgICBjaG9pY2U6IEBjaG9pY2UsIFxuICAgICAgICAgICAgY29uZGl0aW9uczogQGNvbmRpdGlvbnMsIFxuICAgICAgICAgICAgbG9vcHM6IEBsb29wcyxcbiAgICAgICAgICAgIGxhYmVsczogQGxhYmVscyxcbiAgICAgICAgICAgIGlzV2FpdGluZzogbm8sXG4gICAgICAgICAgICBpc1J1bm5pbmc6IEBpc1J1bm5pbmcsXG4gICAgICAgICAgICB3YWl0Q291bnRlcjogQHdhaXRDb3VudGVyLFxuICAgICAgICAgICAgd2FpdGluZ0ZvcjogQHdhaXRpbmdGb3IsXG4gICAgICAgICAgICBpbmRlbnQ6IEBpbmRlbnQsXG4gICAgICAgICAgICBzZXR0aW5nczogQHNldHRpbmdzXG4gICAgICAgIGVsc2VcbiAgICAgICAgICAgIHBvaW50ZXI6IEBwb2ludGVyLFxuICAgICAgICAgICAgY2hvaWNlOiBAY2hvaWNlLCBcbiAgICAgICAgICAgIGNvbmRpdGlvbnM6IEBjb25kaXRpb25zLCBcbiAgICAgICAgICAgIGxvb3BzOiBAbG9vcHMsXG4gICAgICAgICAgICBsYWJlbHM6IEBsYWJlbHMsXG4gICAgICAgICAgICBpc1dhaXRpbmc6IEBpc1dhaXRpbmcsXG4gICAgICAgICAgICBpc1J1bm5pbmc6IEBpc1J1bm5pbmcsXG4gICAgICAgICAgICB3YWl0Q291bnRlcjogQHdhaXRDb3VudGVyLFxuICAgICAgICAgICAgd2FpdGluZ0ZvcjogQHdhaXRpbmdGb3IsXG4gICAgICAgICAgICBpbmRlbnQ6IEBpbmRlbnQsXG4gICAgICAgICAgICBzZXR0aW5nczogQHNldHRpbmdzXG4gICAgXG4gICAgIyMjKlxuICAgICMgUHJldmlld3MgdGhlIGN1cnJlbnQgc2NlbmUgYXQgdGhlIHNwZWNpZmllZCBwb2ludGVyLiBUaGlzIG1ldGhvZCBpcyBjYWxsZWQgZnJvbSB0aGVcbiAgICAjIFZOIE1ha2VyIFNjZW5lLUVkaXRvciBpZiBsaXZlLXByZXZpZXcgaXMgZW5hYmxlZCBhbmQgdGhlIHVzZXIgY2xpY2tlZCBvbiBhIGNvbW1hbmQuXG4gICAgI1xuICAgICMgQG1ldGhvZCBwcmV2aWV3XG4gICAgIyMjXG4gICAgcHJldmlldzogLT5cbiAgICAgICAgdHJ5XG4gICAgICAgICAgICByZXR1cm4gaWYgISRQQVJBTVMucHJldmlldyBvciAhJFBBUkFNUy5wcmV2aWV3LnNjZW5lXG4gICAgICAgICAgICBBdWRpb01hbmFnZXIuc3RvcEFsbFNvdW5kcygpXG4gICAgICAgICAgICBBdWRpb01hbmFnZXIuc3RvcEFsbE11c2ljKClcbiAgICAgICAgICAgIEF1ZGlvTWFuYWdlci5zdG9wQWxsVm9pY2VzKClcbiAgICAgICAgICAgIFNjZW5lTWFuYWdlci5zY2VuZS5jaG9pY2VzID0gW11cbiAgICAgICAgICAgIEdhbWVNYW5hZ2VyLnNldHVwQ3Vyc29yKClcbiAgICAgICAgICAgIEBwcmV2aWV3RGF0YSA9ICRQQVJBTVMucHJldmlld1xuICAgICAgICAgICAgZ3MuR2xvYmFsRXZlbnRNYW5hZ2VyLmVtaXQoXCJwcmV2aWV3UmVzdGFydFwiKVxuICAgICAgICAgICAgaWYgQHByZXZpZXdJbmZvLnRpbWVvdXRcbiAgICAgICAgICAgICAgICBjbGVhclRpbWVvdXQoQHByZXZpZXdJbmZvLnRpbWVvdXQpXG4gICAgICAgICAgICAgICAgXG4gICAgICAgICAgICBpZiBHcmFwaGljcy5zdG9wcGVkXG4gICAgICAgICAgICAgICAgR3JhcGhpY3Muc3RvcHBlZCA9IG5vXG4gICAgICAgICAgICAgICAgR3JhcGhpY3Mub25FYWNoRnJhbWUoZ3MuTWFpbi5mcmFtZUNhbGxiYWNrKVxuICAgICAgICAgICBcbiAgICAgICAgICAgIHNjZW5lID0gbmV3IHZuLk9iamVjdF9TY2VuZSgpIFxuICAgICAgICBcbiAgICAgICAgICAgIHNjZW5lLnNjZW5lRGF0YS51aWQgPSBAcHJldmlld0RhdGEuc2NlbmUudWlkICAgIFxuICAgICAgICAgICAgU2NlbmVNYW5hZ2VyLnN3aXRjaFRvKHNjZW5lKVxuICAgICAgICBjYXRjaCBleFxuICAgICAgICAgICAgY29uc29sZS53YXJuKGV4KVxuICAgIFxuICAgICMjIypcbiAgICAjIFNldHMgdXAgdGhlIGludGVycHJldGVyLlxuICAgICNcbiAgICAjIEBtZXRob2Qgc2V0dXBcbiAgICAjIyMgICAgXG4gICAgc2V0dXA6IC0+XG4gICAgICAgIHN1cGVyXG4gICAgICAgIFxuICAgICAgICBAcHJldmlld0RhdGEgPSAkUEFSQU1TLnByZXZpZXdcbiAgICAgICAgaWYgQHByZXZpZXdEYXRhXG4gICAgICAgICAgICBncy5HbG9iYWxFdmVudE1hbmFnZXIub24gXCJtb3VzZURvd25cIiwgKD0+XG4gICAgICAgICAgICAgICAgaWYgQHByZXZpZXdJbmZvLndhaXRpbmdcbiAgICAgICAgICAgICAgICAgICAgaWYgQHByZXZpZXdJbmZvLnRpbWVvdXRcbiAgICAgICAgICAgICAgICAgICAgICAgIGNsZWFyVGltZW91dChAcHJldmlld0luZm8udGltZW91dClcbiAgICAgICAgICAgICAgICAgICAgQHByZXZpZXdJbmZvLndhaXRpbmcgPSBub1xuICAgICAgICAgICAgICAgICAgICAjQGlzV2FpdGluZyA9IG5vXG4gICAgICAgICAgICAgICAgICAgIEdhbWVNYW5hZ2VyLnRlbXBTZXR0aW5ncy5za2lwID0gbm9cbiAgICAgICAgICAgICAgICAgICAgQHByZXZpZXdEYXRhID0gbnVsbFxuICAgICAgICAgICAgICAgICAgICBncy5HbG9iYWxFdmVudE1hbmFnZXIuZW1pdChcInByZXZpZXdSZXN0YXJ0XCIpXG4gICAgICAgICAgICAgICAgKSwgbnVsbCwgQG9iamVjdFxuICAgICBcbiAgICAjIyMqXG4gICAgIyBEaXNwb3NlcyB0aGUgaW50ZXJwcmV0ZXIuXG4gICAgI1xuICAgICMgQG1ldGhvZCBkaXNwb3NlXG4gICAgIyMjICAgICAgIFxuICAgIGRpc3Bvc2U6IC0+XG4gICAgICAgIGlmIEBwcmV2aWV3RGF0YVxuICAgICAgICAgICAgZ3MuR2xvYmFsRXZlbnRNYW5hZ2VyLm9mZkJ5T3duZXIoXCJtb3VzZURvd25cIiwgQG9iamVjdClcbiAgICAgICAgIFxuICAgICAgICAgICBcbiAgICAgICAgc3VwZXJcbiAgICAgXG4gICAgIFxuICAgIGlzSW5zdGFudFNraXA6IC0+IEdhbWVNYW5hZ2VyLnRlbXBTZXR0aW5ncy5za2lwIGFuZCBHYW1lTWFuYWdlci50ZW1wU2V0dGluZ3Muc2tpcFRpbWUgPT0gMCAgIFxuICAgIFxuICAgICMjIypcbiAgICAqIFJlc3RvcmVzIHRoZSBpbnRlcnByZXRlciBmcm9tIGEgZGF0YS1idW5kbGVcbiAgICAqXG4gICAgKiBAbWV0aG9kIHJlc3RvcmVcbiAgICAqIEBwYXJhbSB7T2JqZWN0fSBidW5kbGUtIFRoZSBkYXRhLWJ1bmRsZS5cbiAgICAjIyMgICAgIFxuICAgIHJlc3RvcmU6IC0+XG4gICAgICAgICAgICBcbiAgICAjIyMqXG4gICAgKiBHZXRzIHRoZSBkZWZhdWx0IGdhbWUgbWVzc2FnZSBmb3Igbm92ZWwtbW9kZS5cbiAgICAqXG4gICAgKiBAbWV0aG9kIG1lc3NhZ2VPYmplY3ROVkxcbiAgICAqIEByZXR1cm4ge3VpLk9iamVjdF9NZXNzYWdlfSBUaGUgTlZMIGdhbWUgbWVzc2FnZSBvYmplY3QuXG4gICAgIyMjICAgICAgICAgICBcbiAgICBtZXNzYWdlT2JqZWN0TlZMOiAtPiBncy5PYmplY3RNYW5hZ2VyLmN1cnJlbnQub2JqZWN0QnlJZChcIm52bEdhbWVNZXNzYWdlX21lc3NhZ2VcIilcbiAgICBcbiAgICAjIyMqXG4gICAgKiBHZXRzIHRoZSBkZWZhdWx0IGdhbWUgbWVzc2FnZSBmb3IgYWR2ZW50dXJlLW1vZGUuXG4gICAgKlxuICAgICogQG1ldGhvZCBtZXNzYWdlT2JqZWN0QURWXG4gICAgKiBAcmV0dXJuIHt1aS5PYmplY3RfTWVzc2FnZX0gVGhlIEFEViBnYW1lIG1lc3NhZ2Ugb2JqZWN0LlxuICAgICMjIyAgICAgICAgICAgXG4gICAgbWVzc2FnZU9iamVjdEFEVjogLT4gXG4gICAgICAgIGdzLk9iamVjdE1hbmFnZXIuY3VycmVudC5vYmplY3RCeUlkKFwiZ2FtZU1lc3NhZ2VfbWVzc2FnZVwiKVxuICAgIFxuICAgICMjIypcbiAgICAqIFN0YXJ0cyB0aGUgaW50ZXJwcmV0ZXJcbiAgICAqXG4gICAgKiBAbWV0aG9kIHN0YXJ0XG4gICAgIyMjICAgXG4gICAgc3RhcnQ6IC0+XG4gICAgICAgIEBjb25kaXRpb25zID0gW11cbiAgICAgICAgQGxvb3BzID0gW11cbiAgICAgICAgQGluZGVudCA9IDBcbiAgICAgICAgQHBvaW50ZXIgPSAwXG4gICAgICAgIEBpc1J1bm5pbmcgPSB5ZXNcbiAgICAgICAgQGlzV2FpdGluZyA9IG5vXG4gICAgICAgIFxuICAgICMjIypcbiAgICAqIFN0b3BzIHRoZSBpbnRlcnByZXRlclxuICAgICpcbiAgICAqIEBtZXRob2Qgc3RvcFxuICAgICMjIyAgIFxuICAgIHN0b3A6IC0+XG4gICAgICAgIEBpc1J1bm5pbmcgPSBub1xuICAgICAgICBcbiAgICAjIyMqXG4gICAgKiBSZXN1bWVzIHRoZSBpbnRlcnByZXRlclxuICAgICpcbiAgICAqIEBtZXRob2QgcmVzdW1lXG4gICAgIyMjICBcbiAgICByZXN1bWU6IC0+XG4gICAgICAgIEBpc1J1bm5pbmcgPSB5ZXMgICAgICAgIFxuICAgICBcbiAgICAjIyMqXG4gICAgKiBVcGRhdGVzIHRoZSBpbnRlcnByZXRlciBhbmQgZXhlY3V0ZXMgYWxsIGNvbW1hbmRzIHVudGlsIHRoZSBuZXh0IHdhaXQgaXMgXG4gICAgKiB0cmlnZ2VyZWQgYnkgYSBjb21tYW5kLiBTbyBpbiB0aGUgY2FzZSBvZiBhbiBlbmRsZXNzLWxvb3AgdGhlIG1ldGhvZCB3aWxsIFxuICAgICogbmV2ZXIgcmV0dXJuLlxuICAgICpcbiAgICAqIEBtZXRob2QgdXBkYXRlXG4gICAgIyMjICAgICAgXG4gICAgdXBkYXRlOiAtPlxuICAgICAgICBpZiBAc3ViSW50ZXJwcmV0ZXI/XG4gICAgICAgICAgICBAc3ViSW50ZXJwcmV0ZXIudXBkYXRlKClcbiAgICAgICAgICAgIHJldHVyblxuICAgICAgICBcbiAgICAgICAgR2FtZU1hbmFnZXIudmFyaWFibGVTdG9yZS5zZXR1cFRlbXBWYXJpYWJsZXMoQGNvbnRleHQpXG4gICAgICAgIFxuICAgICAgICBpZiAobm90IEBvYmplY3QuY29tbWFuZHM/IG9yIEBwb2ludGVyID49IEBvYmplY3QuY29tbWFuZHMubGVuZ3RoKSBhbmQgbm90IEBpc1dhaXRpbmdcbiAgICAgICAgICAgIGlmIEByZXBlYXRcbiAgICAgICAgICAgICAgICBAc3RhcnQoKVxuICAgICAgICAgICAgZWxzZSBpZiBAaXNSdW5uaW5nXG4gICAgICAgICAgICAgICAgQGlzUnVubmluZyA9IG5vXG4gICAgICAgICAgICAgICAgaWYgQG9uRmluaXNoPyB0aGVuIEBvbkZpbmlzaCh0aGlzKVxuICAgICAgICAgICAgICAgIHJldHVyblxuICAgICAgICAgICAgXG4gICAgICAgIGlmIG5vdCBAaXNSdW5uaW5nIHRoZW4gcmV0dXJuXG4gICAgICAgIFxuICAgICAgICBpZiBub3QgQG9iamVjdC5jb21tYW5kcy5vcHRpbWl6ZWRcbiAgICAgICAgICAgIERhdGFPcHRpbWl6ZXIub3B0aW1pemVFdmVudENvbW1hbmRzKEBvYmplY3QuY29tbWFuZHMpXG5cbiAgICAgICAgaWYgQHdhaXRDb3VudGVyID4gMFxuICAgICAgICAgICAgQHdhaXRDb3VudGVyLS1cbiAgICAgICAgICAgIEBpc1dhaXRpbmcgPSBAd2FpdENvdW50ZXIgPiAwXG4gICAgICAgICAgICByZXR1cm4gICAgICBcbiAgICAgICAgICAgIFxuICAgICAgICBpZiBAaXNXYWl0aW5nRm9yTWVzc2FnZVxuICAgICAgICAgICAgQGlzV2FpdGluZyA9IHllc1xuICAgICAgICAgICAgaWYgbm90IEBpc1Byb2Nlc3NpbmdNZXNzYWdlSW5PdGhlckNvbnRleHQoKVxuICAgICAgICAgICAgICAgIEBpc1dhaXRpbmcgPSBub1xuICAgICAgICAgICAgICAgIEBpc1dhaXRpbmdGb3JNZXNzYWdlID0gbm9cbiAgICAgICAgICAgIGVsc2VcbiAgICAgICAgICAgICAgICByZXR1cm5cbiAgICAgICAgICAgICAgICBcbiAgICAgICAgaWYgR2FtZU1hbmFnZXIuaW5MaXZlUHJldmlld1xuICAgICAgICAgICAgd2hpbGUgbm90IChAaXNXYWl0aW5nIG9yIEBwcmV2aWV3SW5mby53YWl0aW5nKSBhbmQgQHBvaW50ZXIgPCBAb2JqZWN0LmNvbW1hbmRzLmxlbmd0aCBhbmQgQGlzUnVubmluZ1xuICAgICAgICAgICAgICAgIEBleGVjdXRlQ29tbWFuZChAcG9pbnRlcilcbiAgICAgICAgICAgICAgICAgICAgXG4gICAgICAgICAgICAgICAgQHByZXZpZXdJbmZvLmV4ZWN1dGVkQ29tbWFuZHMrK1xuICAgICAgICAgICAgICAgIFxuICAgICAgICAgICAgICAgIGlmIEBwcmV2aWV3SW5mby5leGVjdXRlZENvbW1hbmRzID4gNTAwXG4gICAgICAgICAgICAgICAgICAgIEBwcmV2aWV3SW5mby5leGVjdXRlZENvbW1hbmRzID0gMFxuICAgICAgICAgICAgICAgICAgICBAaXNXYWl0aW5nID0geWVzXG4gICAgICAgICAgICAgICAgICAgIEB3YWl0Q291bnRlciA9IDFcbiAgICAgICAgZWxzZVxuICAgICAgICAgICAgd2hpbGUgbm90IChAaXNXYWl0aW5nIG9yIEBwcmV2aWV3SW5mby53YWl0aW5nKSBhbmQgQHBvaW50ZXIgPCBAb2JqZWN0LmNvbW1hbmRzLmxlbmd0aCBhbmQgQGlzUnVubmluZ1xuICAgICAgICAgICAgICAgIEBleGVjdXRlQ29tbWFuZChAcG9pbnRlcilcbiAgICAgXG4gICAgICAgICAgXG4gICAgICAgIGlmIEBwb2ludGVyID49IEBvYmplY3QuY29tbWFuZHMubGVuZ3RoIGFuZCBub3QgQGlzV2FpdGluZ1xuICAgICAgICAgICAgaWYgQHJlcGVhdFxuICAgICAgICAgICAgICAgIEBzdGFydCgpXG4gICAgICAgICAgICBlbHNlIGlmIEBpc1J1bm5pbmdcbiAgICAgICAgICAgICAgICBAaXNSdW5uaW5nID0gbm9cbiAgICAgICAgICAgICAgICBpZiBAb25GaW5pc2g/IHRoZW4gQG9uRmluaXNoKHRoaXMpXG4gICAgICAgICAgICAgICAgXG4gICAgICAgIFxuICAgIFxuICAgIFxuICAgICMjIypcbiAgICAqIEFzc2lnbnMgdGhlIGNvcnJlY3QgY29tbWFuZC1mdW5jdGlvbiB0byB0aGUgc3BlY2lmaWVkIGNvbW1hbmQtb2JqZWN0IGlmIFxuICAgICogbmVjZXNzYXJ5LlxuICAgICpcbiAgICAqIEBtZXRob2QgYXNzaWduQ29tbWFuZFxuICAgICMjIyAgICAgIFxuICAgIGFzc2lnbkNvbW1hbmQ6IChjb21tYW5kKSAtPlxuICAgICAgICBzd2l0Y2ggY29tbWFuZC5pZFxuICAgICAgICAgICAgd2hlbiBcImdzLklkbGVcIiB0aGVuIGNvbW1hbmQuZXhlY3V0ZSA9IEBjb21tYW5kSWRsZVxuICAgICAgICAgICAgd2hlbiBcImdzLlN0YXJ0VGltZXJcIiB0aGVuIGNvbW1hbmQuZXhlY3V0ZSA9IEBjb21tYW5kU3RhcnRUaW1lclxuICAgICAgICAgICAgd2hlbiBcImdzLlBhdXNlVGltZXJcIiB0aGVuIGNvbW1hbmQuZXhlY3V0ZSA9IEBjb21tYW5kUGF1c2VUaW1lclxuICAgICAgICAgICAgd2hlbiBcImdzLlJlc3VtZVRpbWVyXCIgdGhlbiBjb21tYW5kLmV4ZWN1dGUgPSBAY29tbWFuZFJlc3VtZVRpbWVyXG4gICAgICAgICAgICB3aGVuIFwiZ3MuU3RvcFRpbWVyXCIgdGhlbiBjb21tYW5kLmV4ZWN1dGUgPSBAY29tbWFuZFN0b3BUaW1lclxuICAgICAgICAgICAgd2hlbiBcImdzLldhaXRDb21tYW5kXCIgdGhlbiBjb21tYW5kLmV4ZWN1dGUgPSBAY29tbWFuZFdhaXRcbiAgICAgICAgICAgIHdoZW4gXCJncy5Mb29wQ29tbWFuZFwiIHRoZW4gY29tbWFuZC5leGVjdXRlID0gQGNvbW1hbmRMb29wXG4gICAgICAgICAgICB3aGVuIFwiZ3MuQnJlYWtMb29wQ29tbWFuZFwiIHRoZW4gY29tbWFuZC5leGVjdXRlID0gQGNvbW1hbmRCcmVha0xvb3BcbiAgICAgICAgICAgIHdoZW4gXCJncy5Db21tZW50XCIgdGhlbiBjb21tYW5kLmV4ZWN1dGUgPSAtPiAwXG4gICAgICAgICAgICB3aGVuIFwiZ3MuRW1wdHlDb21tYW5kXCIgdGhlbiBjb21tYW5kLmV4ZWN1dGUgPSAtPiAwXG4gICAgICAgICAgICB3aGVuIFwiZ3MuTGlzdEFkZFwiIHRoZW4gY29tbWFuZC5leGVjdXRlID0gQGNvbW1hbmRMaXN0QWRkXG4gICAgICAgICAgICB3aGVuIFwiZ3MuTGlzdFBvcFwiIHRoZW4gY29tbWFuZC5leGVjdXRlID0gQGNvbW1hbmRMaXN0UG9wXG4gICAgICAgICAgICB3aGVuIFwiZ3MuTGlzdFNoaWZ0XCIgdGhlbiBjb21tYW5kLmV4ZWN1dGUgPSBAY29tbWFuZExpc3RTaGlmdFxuICAgICAgICAgICAgd2hlbiBcImdzLkxpc3RSZW1vdmVBdFwiIHRoZW4gY29tbWFuZC5leGVjdXRlID0gQGNvbW1hbmRMaXN0UmVtb3ZlQXRcbiAgICAgICAgICAgIHdoZW4gXCJncy5MaXN0SW5zZXJ0QXRcIiB0aGVuIGNvbW1hbmQuZXhlY3V0ZSA9IEBjb21tYW5kTGlzdEluc2VydEF0XG4gICAgICAgICAgICB3aGVuIFwiZ3MuTGlzdFZhbHVlQXRcIiB0aGVuIGNvbW1hbmQuZXhlY3V0ZSA9IEBjb21tYW5kTGlzdFZhbHVlQXRcbiAgICAgICAgICAgIHdoZW4gXCJncy5MaXN0Q2xlYXJcIiB0aGVuIGNvbW1hbmQuZXhlY3V0ZSA9IEBjb21tYW5kTGlzdENsZWFyXG4gICAgICAgICAgICB3aGVuIFwiZ3MuTGlzdFNodWZmbGVcIiB0aGVuIGNvbW1hbmQuZXhlY3V0ZSA9IEBjb21tYW5kTGlzdFNodWZmbGVcbiAgICAgICAgICAgIHdoZW4gXCJncy5MaXN0U29ydFwiIHRoZW4gY29tbWFuZC5leGVjdXRlID0gQGNvbW1hbmRMaXN0U29ydFxuICAgICAgICAgICAgd2hlbiBcImdzLkxpc3RJbmRleE9mXCIgdGhlbiBjb21tYW5kLmV4ZWN1dGUgPSBAY29tbWFuZExpc3RJbmRleE9mXG4gICAgICAgICAgICB3aGVuIFwiZ3MuTGlzdFNldFwiIHRoZW4gY29tbWFuZC5leGVjdXRlID0gQGNvbW1hbmRMaXN0U2V0XG4gICAgICAgICAgICB3aGVuIFwiZ3MuTGlzdENvcHlcIiB0aGVuIGNvbW1hbmQuZXhlY3V0ZSA9IEBjb21tYW5kTGlzdENvcHlcbiAgICAgICAgICAgIHdoZW4gXCJncy5MaXN0TGVuZ3RoXCIgdGhlbiBjb21tYW5kLmV4ZWN1dGUgPSBAY29tbWFuZExpc3RMZW5ndGhcbiAgICAgICAgICAgIHdoZW4gXCJncy5MaXN0Sm9pblwiIHRoZW4gY29tbWFuZC5leGVjdXRlID0gQGNvbW1hbmRMaXN0Sm9pblxuICAgICAgICAgICAgd2hlbiBcImdzLkxpc3RGcm9tVGV4dFwiIHRoZW4gY29tbWFuZC5leGVjdXRlID0gQGNvbW1hbmRMaXN0RnJvbVRleHRcbiAgICAgICAgICAgIHdoZW4gXCJncy5SZXNldFZhcmlhYmxlc1wiIHRoZW4gY29tbWFuZC5leGVjdXRlID0gQGNvbW1hbmRSZXNldFZhcmlhYmxlc1xuICAgICAgICAgICAgd2hlbiBcImdzLkNoYW5nZVZhcmlhYmxlRG9tYWluXCIgdGhlbiBjb21tYW5kLmV4ZWN1dGUgPSBAY29tbWFuZENoYW5nZVZhcmlhYmxlRG9tYWluXG4gICAgICAgICAgICB3aGVuIFwiZ3MuQ2hhbmdlTnVtYmVyVmFyaWFibGVzXCIgdGhlbiBjb21tYW5kLmV4ZWN1dGUgPSBAY29tbWFuZENoYW5nZU51bWJlclZhcmlhYmxlc1xuICAgICAgICAgICAgd2hlbiBcImdzLkNoYW5nZURlY2ltYWxWYXJpYWJsZXNcIiB0aGVuIGNvbW1hbmQuZXhlY3V0ZSA9IEBjb21tYW5kQ2hhbmdlRGVjaW1hbFZhcmlhYmxlc1xuICAgICAgICAgICAgd2hlbiBcImdzLkNoYW5nZUJvb2xlYW5WYXJpYWJsZXNcIiB0aGVuIGNvbW1hbmQuZXhlY3V0ZSA9IEBjb21tYW5kQ2hhbmdlQm9vbGVhblZhcmlhYmxlc1xuICAgICAgICAgICAgd2hlbiBcImdzLkNoYW5nZVN0cmluZ1ZhcmlhYmxlc1wiIHRoZW4gY29tbWFuZC5leGVjdXRlID0gQGNvbW1hbmRDaGFuZ2VTdHJpbmdWYXJpYWJsZXNcbiAgICAgICAgICAgIHdoZW4gXCJncy5DaGVja1N3aXRjaFwiIHRoZW4gY29tbWFuZC5leGVjdXRlID0gQGNvbW1hbmRDaGVja1N3aXRjaFxuICAgICAgICAgICAgd2hlbiBcImdzLkNoZWNrTnVtYmVyVmFyaWFibGVcIiB0aGVuIGNvbW1hbmQuZXhlY3V0ZSA9IEBjb21tYW5kQ2hlY2tOdW1iZXJWYXJpYWJsZVxuICAgICAgICAgICAgd2hlbiBcImdzLkNoZWNrVGV4dFZhcmlhYmxlXCIgdGhlbiBjb21tYW5kLmV4ZWN1dGUgPSBAY29tbWFuZENoZWNrVGV4dFZhcmlhYmxlXG4gICAgICAgICAgICB3aGVuIFwiZ3MuQ29uZGl0aW9uXCIgdGhlbiBjb21tYW5kLmV4ZWN1dGUgPSBAY29tbWFuZENvbmRpdGlvblxuICAgICAgICAgICAgd2hlbiBcImdzLkNvbmRpdGlvbkVsc2VcIiB0aGVuIGNvbW1hbmQuZXhlY3V0ZSA9IEBjb21tYW5kQ29uZGl0aW9uRWxzZVxuICAgICAgICAgICAgd2hlbiBcImdzLkNvbmRpdGlvbkVsc2VJZlwiIHRoZW4gY29tbWFuZC5leGVjdXRlID0gQGNvbW1hbmRDb25kaXRpb25FbHNlSWZcbiAgICAgICAgICAgIHdoZW4gXCJncy5MYWJlbFwiIHRoZW4gY29tbWFuZC5leGVjdXRlID0gQGNvbW1hbmRMYWJlbFxuICAgICAgICAgICAgd2hlbiBcImdzLkp1bXBUb0xhYmVsXCIgdGhlbiBjb21tYW5kLmV4ZWN1dGUgPSBAY29tbWFuZEp1bXBUb0xhYmVsXG4gICAgICAgICAgICB3aGVuIFwiZ3MuU2V0TWVzc2FnZUFyZWFcIiB0aGVuIGNvbW1hbmQuZXhlY3V0ZSA9IEBjb21tYW5kU2V0TWVzc2FnZUFyZWFcbiAgICAgICAgICAgIHdoZW4gXCJncy5TaG93TWVzc2FnZVwiIHRoZW4gY29tbWFuZC5leGVjdXRlID0gQGNvbW1hbmRTaG93TWVzc2FnZVxuICAgICAgICAgICAgd2hlbiBcImdzLlNob3dQYXJ0aWFsTWVzc2FnZVwiIHRoZW4gY29tbWFuZC5leGVjdXRlID0gQGNvbW1hbmRTaG93UGFydGlhbE1lc3NhZ2VcbiAgICAgICAgICAgIHdoZW4gXCJncy5NZXNzYWdlRmFkaW5nXCIgdGhlbiBjb21tYW5kLmV4ZWN1dGUgPSBAY29tbWFuZE1lc3NhZ2VGYWRpbmdcbiAgICAgICAgICAgIHdoZW4gXCJncy5NZXNzYWdlU2V0dGluZ3NcIiB0aGVuIGNvbW1hbmQuZXhlY3V0ZSA9IEBjb21tYW5kTWVzc2FnZVNldHRpbmdzXG4gICAgICAgICAgICB3aGVuIFwiZ3MuQ3JlYXRlTWVzc2FnZUFyZWFcIiB0aGVuIGNvbW1hbmQuZXhlY3V0ZSA9IEBjb21tYW5kQ3JlYXRlTWVzc2FnZUFyZWFcbiAgICAgICAgICAgIHdoZW4gXCJncy5FcmFzZU1lc3NhZ2VBcmVhXCIgdGhlbiBjb21tYW5kLmV4ZWN1dGUgPSBAY29tbWFuZEVyYXNlTWVzc2FnZUFyZWFcbiAgICAgICAgICAgIHdoZW4gXCJncy5TZXRUYXJnZXRNZXNzYWdlXCIgdGhlbiBjb21tYW5kLmV4ZWN1dGUgPSBAY29tbWFuZFNldFRhcmdldE1lc3NhZ2VcbiAgICAgICAgICAgIHdoZW4gXCJ2bi5NZXNzYWdlQm94RGVmYXVsdHNcIiB0aGVuIGNvbW1hbmQuZXhlY3V0ZSA9IEBjb21tYW5kTWVzc2FnZUJveERlZmF1bHRzXG4gICAgICAgICAgICB3aGVuIFwidm4uTWVzc2FnZUJveFZpc2liaWxpdHlcIiB0aGVuIGNvbW1hbmQuZXhlY3V0ZSA9IEBjb21tYW5kTWVzc2FnZUJveFZpc2liaWxpdHlcbiAgICAgICAgICAgIHdoZW4gXCJ2bi5NZXNzYWdlVmlzaWJpbGl0eVwiIHRoZW4gY29tbWFuZC5leGVjdXRlID0gQGNvbW1hbmRNZXNzYWdlVmlzaWJpbGl0eVxuICAgICAgICAgICAgd2hlbiBcInZuLkJhY2tsb2dWaXNpYmlsaXR5XCIgdGhlbiBjb21tYW5kLmV4ZWN1dGUgPSBAY29tbWFuZEJhY2tsb2dWaXNpYmlsaXR5XG4gICAgICAgICAgICB3aGVuIFwiZ3MuQ2xlYXJNZXNzYWdlXCIgdGhlbiBjb21tYW5kLmV4ZWN1dGUgPSBAY29tbWFuZENsZWFyTWVzc2FnZVxuICAgICAgICAgICAgd2hlbiBcImdzLkNoYW5nZVdlYXRoZXJcIiB0aGVuIGNvbW1hbmQuZXhlY3V0ZSA9IEBjb21tYW5kQ2hhbmdlV2VhdGhlclxuICAgICAgICAgICAgd2hlbiBcImdzLkZyZWV6ZVNjcmVlblwiIHRoZW4gY29tbWFuZC5leGVjdXRlID0gQGNvbW1hbmRGcmVlemVTY3JlZW5cbiAgICAgICAgICAgIHdoZW4gXCJncy5TY3JlZW5UcmFuc2l0aW9uXCIgdGhlbiBjb21tYW5kLmV4ZWN1dGUgPSBAY29tbWFuZFNjcmVlblRyYW5zaXRpb25cbiAgICAgICAgICAgIHdoZW4gXCJncy5TaGFrZVNjcmVlblwiIHRoZW4gY29tbWFuZC5leGVjdXRlID0gQGNvbW1hbmRTaGFrZVNjcmVlblxuICAgICAgICAgICAgd2hlbiBcImdzLlRpbnRTY3JlZW5cIiB0aGVuIGNvbW1hbmQuZXhlY3V0ZSA9IEBjb21tYW5kVGludFNjcmVlblxuICAgICAgICAgICAgd2hlbiBcImdzLkZsYXNoU2NyZWVuXCIgdGhlbiBjb21tYW5kLmV4ZWN1dGUgPSBAY29tbWFuZEZsYXNoU2NyZWVuXG4gICAgICAgICAgICB3aGVuIFwiZ3MuWm9vbVNjcmVlblwiIHRoZW4gY29tbWFuZC5leGVjdXRlID0gQGNvbW1hbmRab29tU2NyZWVuXG4gICAgICAgICAgICB3aGVuIFwiZ3MuUm90YXRlU2NyZWVuXCIgdGhlbiBjb21tYW5kLmV4ZWN1dGUgPSBAY29tbWFuZFJvdGF0ZVNjcmVlblxuICAgICAgICAgICAgd2hlbiBcImdzLlBhblNjcmVlblwiIHRoZW4gY29tbWFuZC5leGVjdXRlID0gQGNvbW1hbmRQYW5TY3JlZW5cbiAgICAgICAgICAgIHdoZW4gXCJncy5TY3JlZW5FZmZlY3RcIiB0aGVuIGNvbW1hbmQuZXhlY3V0ZSA9IEBjb21tYW5kU2NyZWVuRWZmZWN0XG4gICAgICAgICAgICB3aGVuIFwiZ3MuU2hvd1ZpZGVvXCIgdGhlbiBjb21tYW5kLmV4ZWN1dGUgPSBAY29tbWFuZFNob3dWaWRlb1xuICAgICAgICAgICAgd2hlbiBcImdzLk1vdmVWaWRlb1wiIHRoZW4gY29tbWFuZC5leGVjdXRlID0gQGNvbW1hbmRNb3ZlVmlkZW9cbiAgICAgICAgICAgIHdoZW4gXCJncy5Nb3ZlVmlkZW9QYXRoXCIgdGhlbiBjb21tYW5kLmV4ZWN1dGUgPSBAY29tbWFuZE1vdmVWaWRlb1BhdGhcbiAgICAgICAgICAgIHdoZW4gXCJncy5UaW50VmlkZW9cIiB0aGVuIGNvbW1hbmQuZXhlY3V0ZSA9IEBjb21tYW5kVGludFZpZGVvXG4gICAgICAgICAgICB3aGVuIFwiZ3MuRmxhc2hWaWRlb1wiIHRoZW4gY29tbWFuZC5leGVjdXRlID0gQGNvbW1hbmRGbGFzaFZpZGVvXG4gICAgICAgICAgICB3aGVuIFwiZ3MuQ3JvcFZpZGVvXCIgdGhlbiBjb21tYW5kLmV4ZWN1dGUgPSBAY29tbWFuZENyb3BWaWRlb1xuICAgICAgICAgICAgd2hlbiBcImdzLlJvdGF0ZVZpZGVvXCIgdGhlbiBjb21tYW5kLmV4ZWN1dGUgPSBAY29tbWFuZFJvdGF0ZVZpZGVvXG4gICAgICAgICAgICB3aGVuIFwiZ3MuWm9vbVZpZGVvXCIgdGhlbiBjb21tYW5kLmV4ZWN1dGUgPSBAY29tbWFuZFpvb21WaWRlb1xuICAgICAgICAgICAgd2hlbiBcImdzLkJsZW5kVmlkZW9cIiB0aGVuIGNvbW1hbmQuZXhlY3V0ZSA9IEBjb21tYW5kQmxlbmRWaWRlb1xuICAgICAgICAgICAgd2hlbiBcImdzLk1hc2tWaWRlb1wiIHRoZW4gY29tbWFuZC5leGVjdXRlID0gQGNvbW1hbmRNYXNrVmlkZW9cbiAgICAgICAgICAgIHdoZW4gXCJncy5WaWRlb0VmZmVjdFwiIHRoZW4gY29tbWFuZC5leGVjdXRlID0gQGNvbW1hbmRWaWRlb0VmZmVjdFxuICAgICAgICAgICAgd2hlbiBcImdzLlZpZGVvTW90aW9uQmx1clwiIHRoZW4gY29tbWFuZC5leGVjdXRlID0gQGNvbW1hbmRWaWRlb01vdGlvbkJsdXJcbiAgICAgICAgICAgIHdoZW4gXCJncy5WaWRlb0RlZmF1bHRzXCIgdGhlbiBjb21tYW5kLmV4ZWN1dGUgPSBAY29tbWFuZFZpZGVvRGVmYXVsdHNcbiAgICAgICAgICAgIHdoZW4gXCJncy5FcmFzZVZpZGVvXCIgdGhlbiBjb21tYW5kLmV4ZWN1dGUgPSBAY29tbWFuZEVyYXNlVmlkZW9cbiAgICAgICAgICAgIHdoZW4gXCJncy5TaG93SW1hZ2VNYXBcIiB0aGVuIGNvbW1hbmQuZXhlY3V0ZSA9IEBjb21tYW5kU2hvd0ltYWdlTWFwXG4gICAgICAgICAgICB3aGVuIFwiZ3MuRXJhc2VJbWFnZU1hcFwiIHRoZW4gY29tbWFuZC5leGVjdXRlID0gQGNvbW1hbmRFcmFzZUltYWdlTWFwXG4gICAgICAgICAgICB3aGVuIFwiZ3MuQWRkSG90c3BvdFwiIHRoZW4gY29tbWFuZC5leGVjdXRlID0gQGNvbW1hbmRBZGRIb3RzcG90XG4gICAgICAgICAgICB3aGVuIFwiZ3MuRXJhc2VIb3RzcG90XCIgdGhlbiBjb21tYW5kLmV4ZWN1dGUgPSBAY29tbWFuZEVyYXNlSG90c3BvdFxuICAgICAgICAgICAgd2hlbiBcImdzLkNoYW5nZUhvdHNwb3RTdGF0ZVwiIHRoZW4gY29tbWFuZC5leGVjdXRlID0gQGNvbW1hbmRDaGFuZ2VIb3RzcG90U3RhdGVcbiAgICAgICAgICAgIHdoZW4gXCJncy5TaG93UGljdHVyZVwiIHRoZW4gY29tbWFuZC5leGVjdXRlID0gQGNvbW1hbmRTaG93UGljdHVyZVxuICAgICAgICAgICAgd2hlbiBcImdzLk1vdmVQaWN0dXJlXCIgdGhlbiBjb21tYW5kLmV4ZWN1dGUgPSBAY29tbWFuZE1vdmVQaWN0dXJlXG4gICAgICAgICAgICB3aGVuIFwiZ3MuTW92ZVBpY3R1cmVQYXRoXCIgdGhlbiBjb21tYW5kLmV4ZWN1dGUgPSBAY29tbWFuZE1vdmVQaWN0dXJlUGF0aFxuICAgICAgICAgICAgd2hlbiBcImdzLlRpbnRQaWN0dXJlXCIgdGhlbiBjb21tYW5kLmV4ZWN1dGUgPSBAY29tbWFuZFRpbnRQaWN0dXJlXG4gICAgICAgICAgICB3aGVuIFwiZ3MuRmxhc2hQaWN0dXJlXCIgdGhlbiBjb21tYW5kLmV4ZWN1dGUgPSBAY29tbWFuZEZsYXNoUGljdHVyZVxuICAgICAgICAgICAgd2hlbiBcImdzLkNyb3BQaWN0dXJlXCIgdGhlbiBjb21tYW5kLmV4ZWN1dGUgPSBAY29tbWFuZENyb3BQaWN0dXJlXG4gICAgICAgICAgICB3aGVuIFwiZ3MuUm90YXRlUGljdHVyZVwiIHRoZW4gY29tbWFuZC5leGVjdXRlID0gQGNvbW1hbmRSb3RhdGVQaWN0dXJlXG4gICAgICAgICAgICB3aGVuIFwiZ3MuWm9vbVBpY3R1cmVcIiB0aGVuIGNvbW1hbmQuZXhlY3V0ZSA9IEBjb21tYW5kWm9vbVBpY3R1cmVcbiAgICAgICAgICAgIHdoZW4gXCJncy5CbGVuZFBpY3R1cmVcIiB0aGVuIGNvbW1hbmQuZXhlY3V0ZSA9IEBjb21tYW5kQmxlbmRQaWN0dXJlXG4gICAgICAgICAgICB3aGVuIFwiZ3MuU2hha2VQaWN0dXJlXCIgdGhlbiBjb21tYW5kLmV4ZWN1dGUgPSBAY29tbWFuZFNoYWtlUGljdHVyZVxuICAgICAgICAgICAgd2hlbiBcImdzLk1hc2tQaWN0dXJlXCIgdGhlbiBjb21tYW5kLmV4ZWN1dGUgPSBAY29tbWFuZE1hc2tQaWN0dXJlXG4gICAgICAgICAgICB3aGVuIFwiZ3MuUGljdHVyZUVmZmVjdFwiIHRoZW4gY29tbWFuZC5leGVjdXRlID0gQGNvbW1hbmRQaWN0dXJlRWZmZWN0XG4gICAgICAgICAgICB3aGVuIFwiZ3MuUGljdHVyZU1vdGlvbkJsdXJcIiB0aGVuIGNvbW1hbmQuZXhlY3V0ZSA9IEBjb21tYW5kUGljdHVyZU1vdGlvbkJsdXJcbiAgICAgICAgICAgIHdoZW4gXCJncy5QaWN0dXJlRGVmYXVsdHNcIiB0aGVuIGNvbW1hbmQuZXhlY3V0ZSA9IEBjb21tYW5kUGljdHVyZURlZmF1bHRzXG4gICAgICAgICAgICB3aGVuIFwiZ3MuUGxheVBpY3R1cmVBbmltYXRpb25cIiB0aGVuIGNvbW1hbmQuZXhlY3V0ZSA9IEBjb21tYW5kUGxheVBpY3R1cmVBbmltYXRpb25cbiAgICAgICAgICAgIHdoZW4gXCJncy5FcmFzZVBpY3R1cmVcIiB0aGVuIGNvbW1hbmQuZXhlY3V0ZSA9IEBjb21tYW5kRXJhc2VQaWN0dXJlXG4gICAgICAgICAgICB3aGVuIFwiZ3MuSW5wdXROdW1iZXJcIiB0aGVuIGNvbW1hbmQuZXhlY3V0ZSA9IEBjb21tYW5kSW5wdXROdW1iZXJcbiAgICAgICAgICAgIHdoZW4gXCJ2bi5DaG9pY2VcIiB0aGVuIGNvbW1hbmQuZXhlY3V0ZSA9IEBjb21tYW5kU2hvd0Nob2ljZVxuICAgICAgICAgICAgd2hlbiBcInZuLkNob2ljZVRpbWVyXCIgdGhlbiBjb21tYW5kLmV4ZWN1dGUgPSBAY29tbWFuZENob2ljZVRpbWVyXG4gICAgICAgICAgICB3aGVuIFwidm4uU2hvd0Nob2ljZXNcIiB0aGVuIGNvbW1hbmQuZXhlY3V0ZSA9IEBjb21tYW5kU2hvd0Nob2ljZXNcbiAgICAgICAgICAgIHdoZW4gXCJ2bi5VbmxvY2tDR1wiIHRoZW4gY29tbWFuZC5leGVjdXRlID0gQGNvbW1hbmRVbmxvY2tDR1xuICAgICAgICAgICAgd2hlbiBcInZuLkwyREpvaW5TY2VuZVwiIHRoZW4gY29tbWFuZC5leGVjdXRlID0gQGNvbW1hbmRMMkRKb2luU2NlbmVcbiAgICAgICAgICAgIHdoZW4gXCJ2bi5MMkRFeGl0U2NlbmVcIiB0aGVuIGNvbW1hbmQuZXhlY3V0ZSA9IEBjb21tYW5kTDJERXhpdFNjZW5lXG4gICAgICAgICAgICB3aGVuIFwidm4uTDJETW90aW9uXCIgdGhlbiBjb21tYW5kLmV4ZWN1dGUgPSBAY29tbWFuZEwyRE1vdGlvblxuICAgICAgICAgICAgd2hlbiBcInZuLkwyRE1vdGlvbkdyb3VwXCIgdGhlbiBjb21tYW5kLmV4ZWN1dGUgPSBAY29tbWFuZEwyRE1vdGlvbkdyb3VwXG4gICAgICAgICAgICB3aGVuIFwidm4uTDJERXhwcmVzc2lvblwiIHRoZW4gY29tbWFuZC5leGVjdXRlID0gQGNvbW1hbmRMMkRFeHByZXNzaW9uXG4gICAgICAgICAgICB3aGVuIFwidm4uTDJETW92ZVwiIHRoZW4gY29tbWFuZC5leGVjdXRlID0gQGNvbW1hbmRMMkRNb3ZlXG4gICAgICAgICAgICB3aGVuIFwidm4uTDJEUGFyYW1ldGVyXCIgdGhlbiBjb21tYW5kLmV4ZWN1dGUgPSBAY29tbWFuZEwyRFBhcmFtZXRlclxuICAgICAgICAgICAgd2hlbiBcInZuLkwyRFNldHRpbmdzXCIgdGhlbiBjb21tYW5kLmV4ZWN1dGUgPSBAY29tbWFuZEwyRFNldHRpbmdzXG4gICAgICAgICAgICB3aGVuIFwidm4uTDJERGVmYXVsdHNcIiB0aGVuIGNvbW1hbmQuZXhlY3V0ZSA9IEBjb21tYW5kTDJERGVmYXVsdHNcbiAgICAgICAgICAgIHdoZW4gXCJ2bi5DaGFyYWN0ZXJKb2luU2NlbmVcIiB0aGVuIGNvbW1hbmQuZXhlY3V0ZSA9IEBjb21tYW5kQ2hhcmFjdGVySm9pblNjZW5lXG4gICAgICAgICAgICB3aGVuIFwidm4uQ2hhcmFjdGVyRXhpdFNjZW5lXCIgdGhlbiBjb21tYW5kLmV4ZWN1dGUgPSBAY29tbWFuZENoYXJhY3RlckV4aXRTY2VuZVxuICAgICAgICAgICAgd2hlbiBcInZuLkNoYXJhY3RlckNoYW5nZUV4cHJlc3Npb25cIiB0aGVuIGNvbW1hbmQuZXhlY3V0ZSA9IEBjb21tYW5kQ2hhcmFjdGVyQ2hhbmdlRXhwcmVzc2lvblxuICAgICAgICAgICAgd2hlbiBcInZuLkNoYXJhY3RlclNldFBhcmFtZXRlclwiIHRoZW4gY29tbWFuZC5leGVjdXRlID0gQGNvbW1hbmRDaGFyYWN0ZXJTZXRQYXJhbWV0ZXJcbiAgICAgICAgICAgIHdoZW4gXCJ2bi5DaGFyYWN0ZXJHZXRQYXJhbWV0ZXJcIiB0aGVuIGNvbW1hbmQuZXhlY3V0ZSA9IEBjb21tYW5kQ2hhcmFjdGVyR2V0UGFyYW1ldGVyXG4gICAgICAgICAgICB3aGVuIFwidm4uQ2hhcmFjdGVyRGVmYXVsdHNcIiB0aGVuIGNvbW1hbmQuZXhlY3V0ZSA9IEBjb21tYW5kQ2hhcmFjdGVyRGVmYXVsdHNcbiAgICAgICAgICAgIHdoZW4gXCJ2bi5DaGFyYWN0ZXJFZmZlY3RcIiB0aGVuIGNvbW1hbmQuZXhlY3V0ZSA9IEBjb21tYW5kQ2hhcmFjdGVyRWZmZWN0XG4gICAgICAgICAgICB3aGVuIFwidm4uWm9vbUNoYXJhY3RlclwiIHRoZW4gY29tbWFuZC5leGVjdXRlID0gQGNvbW1hbmRab29tQ2hhcmFjdGVyXG4gICAgICAgICAgICB3aGVuIFwidm4uUm90YXRlQ2hhcmFjdGVyXCIgdGhlbiBjb21tYW5kLmV4ZWN1dGUgPSBAY29tbWFuZFJvdGF0ZUNoYXJhY3RlclxuICAgICAgICAgICAgd2hlbiBcInZuLkJsZW5kQ2hhcmFjdGVyXCIgdGhlbiBjb21tYW5kLmV4ZWN1dGUgPSBAY29tbWFuZEJsZW5kQ2hhcmFjdGVyXG4gICAgICAgICAgICB3aGVuIFwidm4uU2hha2VDaGFyYWN0ZXJcIiB0aGVuIGNvbW1hbmQuZXhlY3V0ZSA9IEBjb21tYW5kU2hha2VDaGFyYWN0ZXJcbiAgICAgICAgICAgIHdoZW4gXCJ2bi5NYXNrQ2hhcmFjdGVyXCIgdGhlbiBjb21tYW5kLmV4ZWN1dGUgPSBAY29tbWFuZE1hc2tDaGFyYWN0ZXJcbiAgICAgICAgICAgIHdoZW4gXCJ2bi5Nb3ZlQ2hhcmFjdGVyXCIgdGhlbiBjb21tYW5kLmV4ZWN1dGUgPSBAY29tbWFuZE1vdmVDaGFyYWN0ZXJcbiAgICAgICAgICAgIHdoZW4gXCJ2bi5Nb3ZlQ2hhcmFjdGVyUGF0aFwiIHRoZW4gY29tbWFuZC5leGVjdXRlID0gQGNvbW1hbmRNb3ZlQ2hhcmFjdGVyUGF0aFxuICAgICAgICAgICAgd2hlbiBcInZuLkZsYXNoQ2hhcmFjdGVyXCIgdGhlbiBjb21tYW5kLmV4ZWN1dGUgPSBAY29tbWFuZEZsYXNoQ2hhcmFjdGVyXG4gICAgICAgICAgICB3aGVuIFwidm4uVGludENoYXJhY3RlclwiIHRoZW4gY29tbWFuZC5leGVjdXRlID0gQGNvbW1hbmRUaW50Q2hhcmFjdGVyXG4gICAgICAgICAgICB3aGVuIFwidm4uQ2hhcmFjdGVyTW90aW9uQmx1clwiIHRoZW4gY29tbWFuZC5leGVjdXRlID0gQGNvbW1hbmRDaGFyYWN0ZXJNb3Rpb25CbHVyXG4gICAgICAgICAgICB3aGVuIFwidm4uQ2hhbmdlQmFja2dyb3VuZFwiIHRoZW4gY29tbWFuZC5leGVjdXRlID0gQGNvbW1hbmRDaGFuZ2VCYWNrZ3JvdW5kXG4gICAgICAgICAgICB3aGVuIFwidm4uU2hha2VCYWNrZ3JvdW5kXCIgdGhlbiBjb21tYW5kLmV4ZWN1dGUgPSBAY29tbWFuZFNoYWtlQmFja2dyb3VuZFxuICAgICAgICAgICAgd2hlbiBcInZuLlNjcm9sbEJhY2tncm91bmRcIiB0aGVuIGNvbW1hbmQuZXhlY3V0ZSA9IEBjb21tYW5kU2Nyb2xsQmFja2dyb3VuZFxuICAgICAgICAgICAgd2hlbiBcInZuLlNjcm9sbEJhY2tncm91bmRUb1wiIHRoZW4gY29tbWFuZC5leGVjdXRlID0gQGNvbW1hbmRTY3JvbGxCYWNrZ3JvdW5kVG9cbiAgICAgICAgICAgIHdoZW4gXCJ2bi5TY3JvbGxCYWNrZ3JvdW5kUGF0aFwiIHRoZW4gY29tbWFuZC5leGVjdXRlID0gQGNvbW1hbmRTY3JvbGxCYWNrZ3JvdW5kUGF0aFxuICAgICAgICAgICAgd2hlbiBcInZuLlpvb21CYWNrZ3JvdW5kXCIgdGhlbiBjb21tYW5kLmV4ZWN1dGUgPSBAY29tbWFuZFpvb21CYWNrZ3JvdW5kXG4gICAgICAgICAgICB3aGVuIFwidm4uUm90YXRlQmFja2dyb3VuZFwiIHRoZW4gY29tbWFuZC5leGVjdXRlID0gQGNvbW1hbmRSb3RhdGVCYWNrZ3JvdW5kXG4gICAgICAgICAgICB3aGVuIFwidm4uVGludEJhY2tncm91bmRcIiB0aGVuIGNvbW1hbmQuZXhlY3V0ZSA9IEBjb21tYW5kVGludEJhY2tncm91bmRcbiAgICAgICAgICAgIHdoZW4gXCJ2bi5CbGVuZEJhY2tncm91bmRcIiB0aGVuIGNvbW1hbmQuZXhlY3V0ZSA9IEBjb21tYW5kQmxlbmRCYWNrZ3JvdW5kXG4gICAgICAgICAgICB3aGVuIFwidm4uTWFza0JhY2tncm91bmRcIiB0aGVuIGNvbW1hbmQuZXhlY3V0ZSA9IEBjb21tYW5kTWFza0JhY2tncm91bmRcbiAgICAgICAgICAgIHdoZW4gXCJ2bi5CYWNrZ3JvdW5kTW90aW9uQmx1clwiIHRoZW4gY29tbWFuZC5leGVjdXRlID0gQGNvbW1hbmRCYWNrZ3JvdW5kTW90aW9uQmx1clxuICAgICAgICAgICAgd2hlbiBcInZuLkJhY2tncm91bmRFZmZlY3RcIiB0aGVuIGNvbW1hbmQuZXhlY3V0ZSA9IEBjb21tYW5kQmFja2dyb3VuZEVmZmVjdFxuICAgICAgICAgICAgd2hlbiBcInZuLkJhY2tncm91bmREZWZhdWx0c1wiIHRoZW4gY29tbWFuZC5leGVjdXRlID0gQGNvbW1hbmRCYWNrZ3JvdW5kRGVmYXVsdHNcbiAgICAgICAgICAgIHdoZW4gXCJ2bi5DaGFuZ2VTY2VuZVwiIHRoZW4gY29tbWFuZC5leGVjdXRlID0gQGNvbW1hbmRDaGFuZ2VTY2VuZVxuICAgICAgICAgICAgd2hlbiBcInZuLlJldHVyblRvUHJldmlvdXNTY2VuZVwiIHRoZW4gY29tbWFuZC5leGVjdXRlID0gQGNvbW1hbmRSZXR1cm5Ub1ByZXZpb3VzU2NlbmVcbiAgICAgICAgICAgIHdoZW4gXCJ2bi5DYWxsU2NlbmVcIiB0aGVuIGNvbW1hbmQuZXhlY3V0ZSA9IEBjb21tYW5kQ2FsbFNjZW5lXG4gICAgICAgICAgICB3aGVuIFwidm4uU3dpdGNoVG9MYXlvdXRcIiB0aGVuIGNvbW1hbmQuZXhlY3V0ZSA9IEBjb21tYW5kU3dpdGNoVG9MYXlvdXRcbiAgICAgICAgICAgIHdoZW4gXCJncy5DaGFuZ2VUcmFuc2l0aW9uXCIgdGhlbiBjb21tYW5kLmV4ZWN1dGUgPSBAY29tbWFuZENoYW5nZVRyYW5zaXRpb25cbiAgICAgICAgICAgIHdoZW4gXCJncy5DaGFuZ2VXaW5kb3dTa2luXCIgdGhlbiBjb21tYW5kLmV4ZWN1dGUgPSBAY29tbWFuZENoYW5nZVdpbmRvd1NraW5cbiAgICAgICAgICAgIHdoZW4gXCJncy5DaGFuZ2VTY3JlZW5UcmFuc2l0aW9uc1wiIHRoZW4gY29tbWFuZC5leGVjdXRlID0gQGNvbW1hbmRDaGFuZ2VTY3JlZW5UcmFuc2l0aW9uc1xuICAgICAgICAgICAgd2hlbiBcInZuLlVJQWNjZXNzXCIgdGhlbiBjb21tYW5kLmV4ZWN1dGUgPSBAY29tbWFuZFVJQWNjZXNzXG4gICAgICAgICAgICB3aGVuIFwiZ3MuUGxheVZpZGVvXCIgdGhlbiBjb21tYW5kLmV4ZWN1dGUgPSBAY29tbWFuZFBsYXlWaWRlb1xuICAgICAgICAgICAgd2hlbiBcImdzLlBsYXlNdXNpY1wiIHRoZW4gY29tbWFuZC5leGVjdXRlID0gQGNvbW1hbmRQbGF5TXVzaWNcbiAgICAgICAgICAgIHdoZW4gXCJncy5TdG9wTXVzaWNcIiB0aGVuIGNvbW1hbmQuZXhlY3V0ZSA9IEBjb21tYW5kU3RvcE11c2ljXG4gICAgICAgICAgICB3aGVuIFwiZ3MuUGxheVNvdW5kXCIgdGhlbiBjb21tYW5kLmV4ZWN1dGUgPSBAY29tbWFuZFBsYXlTb3VuZFxuICAgICAgICAgICAgd2hlbiBcImdzLlN0b3BTb3VuZFwiIHRoZW4gY29tbWFuZC5leGVjdXRlID0gQGNvbW1hbmRTdG9wU291bmRcbiAgICAgICAgICAgIHdoZW4gXCJncy5QYXVzZU11c2ljXCIgdGhlbiBjb21tYW5kLmV4ZWN1dGUgPSBAY29tbWFuZFBhdXNlTXVzaWNcbiAgICAgICAgICAgIHdoZW4gXCJncy5SZXN1bWVNdXNpY1wiIHRoZW4gY29tbWFuZC5leGVjdXRlID0gQGNvbW1hbmRSZXN1bWVNdXNpY1xuICAgICAgICAgICAgd2hlbiBcImdzLkF1ZGlvRGVmYXVsdHNcIiB0aGVuIGNvbW1hbmQuZXhlY3V0ZSA9IEBjb21tYW5kQXVkaW9EZWZhdWx0c1xuICAgICAgICAgICAgd2hlbiBcImdzLkVuZENvbW1vbkV2ZW50XCIgdGhlbiBjb21tYW5kLmV4ZWN1dGUgPSBAY29tbWFuZEVuZENvbW1vbkV2ZW50XG4gICAgICAgICAgICB3aGVuIFwiZ3MuUmVzdW1lQ29tbW9uRXZlbnRcIiB0aGVuIGNvbW1hbmQuZXhlY3V0ZSA9IEBjb21tYW5kUmVzdW1lQ29tbW9uRXZlbnRcbiAgICAgICAgICAgIHdoZW4gXCJncy5DYWxsQ29tbW9uRXZlbnRcIiB0aGVuIGNvbW1hbmQuZXhlY3V0ZSA9IEBjb21tYW5kQ2FsbENvbW1vbkV2ZW50XG4gICAgICAgICAgICB3aGVuIFwiZ3MuQ2hhbmdlVGltZXJcIiB0aGVuIGNvbW1hbmQuZXhlY3V0ZSA9IEBjb21tYW5kQ2hhbmdlVGltZXJcbiAgICAgICAgICAgIHdoZW4gXCJncy5TaG93VGV4dFwiIHRoZW4gY29tbWFuZC5leGVjdXRlID0gQGNvbW1hbmRTaG93VGV4dFxuICAgICAgICAgICAgd2hlbiBcImdzLlJlZnJlc2hUZXh0XCIgdGhlbiBjb21tYW5kLmV4ZWN1dGUgPSBAY29tbWFuZFJlZnJlc2hUZXh0XG4gICAgICAgICAgICB3aGVuIFwiZ3MuVGV4dE1vdGlvbkJsdXJcIiB0aGVuIGNvbW1hbmQuZXhlY3V0ZSA9IEBjb21tYW5kVGV4dE1vdGlvbkJsdXJcbiAgICAgICAgICAgIHdoZW4gXCJncy5Nb3ZlVGV4dFwiIHRoZW4gY29tbWFuZC5leGVjdXRlID0gQGNvbW1hbmRNb3ZlVGV4dFxuICAgICAgICAgICAgd2hlbiBcImdzLk1vdmVUZXh0UGF0aFwiIHRoZW4gY29tbWFuZC5leGVjdXRlID0gQGNvbW1hbmRNb3ZlVGV4dFBhdGhcbiAgICAgICAgICAgIHdoZW4gXCJncy5Sb3RhdGVUZXh0XCIgdGhlbiBjb21tYW5kLmV4ZWN1dGUgPSBAY29tbWFuZFJvdGF0ZVRleHRcbiAgICAgICAgICAgIHdoZW4gXCJncy5ab29tVGV4dFwiIHRoZW4gY29tbWFuZC5leGVjdXRlID0gQGNvbW1hbmRab29tVGV4dFxuICAgICAgICAgICAgd2hlbiBcImdzLkJsZW5kVGV4dFwiIHRoZW4gY29tbWFuZC5leGVjdXRlID0gQGNvbW1hbmRCbGVuZFRleHRcbiAgICAgICAgICAgIHdoZW4gXCJncy5Db2xvclRleHRcIiB0aGVuIGNvbW1hbmQuZXhlY3V0ZSA9IEBjb21tYW5kQ29sb3JUZXh0XG4gICAgICAgICAgICB3aGVuIFwiZ3MuRXJhc2VUZXh0XCIgdGhlbiBjb21tYW5kLmV4ZWN1dGUgPSBAY29tbWFuZEVyYXNlVGV4dCBcbiAgICAgICAgICAgIHdoZW4gXCJncy5UZXh0RWZmZWN0XCIgdGhlbiBjb21tYW5kLmV4ZWN1dGUgPSBAY29tbWFuZFRleHRFZmZlY3QgXG4gICAgICAgICAgICB3aGVuIFwiZ3MuVGV4dERlZmF1bHRzXCIgdGhlbiBjb21tYW5kLmV4ZWN1dGUgPSBAY29tbWFuZFRleHREZWZhdWx0c1xuICAgICAgICAgICAgd2hlbiBcImdzLkNoYW5nZVRleHRTZXR0aW5nc1wiIHRoZW4gY29tbWFuZC5leGVjdXRlID0gQGNvbW1hbmRDaGFuZ2VUZXh0U2V0dGluZ3NcbiAgICAgICAgICAgIHdoZW4gXCJncy5JbnB1dFRleHRcIiB0aGVuIGNvbW1hbmQuZXhlY3V0ZSA9IEBjb21tYW5kSW5wdXRUZXh0XG4gICAgICAgICAgICB3aGVuIFwiZ3MuSW5wdXROYW1lXCIgdGhlbiBjb21tYW5kLmV4ZWN1dGUgPSBAY29tbWFuZElucHV0TmFtZVxuICAgICAgICAgICAgd2hlbiBcImdzLlNhdmVQZXJzaXN0ZW50RGF0YVwiIHRoZW4gY29tbWFuZC5leGVjdXRlID0gQGNvbW1hbmRTYXZlUGVyc2lzdGVudERhdGFcbiAgICAgICAgICAgIHdoZW4gXCJncy5TYXZlU2V0dGluZ3NcIiB0aGVuIGNvbW1hbmQuZXhlY3V0ZSA9IEBjb21tYW5kU2F2ZVNldHRpbmdzXG4gICAgICAgICAgICB3aGVuIFwiZ3MuUHJlcGFyZVNhdmVHYW1lXCIgdGhlbiBjb21tYW5kLmV4ZWN1dGUgPSBAY29tbWFuZFByZXBhcmVTYXZlR2FtZVxuICAgICAgICAgICAgd2hlbiBcImdzLlNhdmVHYW1lXCIgdGhlbiBjb21tYW5kLmV4ZWN1dGUgPSBAY29tbWFuZFNhdmVHYW1lXG4gICAgICAgICAgICB3aGVuIFwiZ3MuTG9hZEdhbWVcIiB0aGVuIGNvbW1hbmQuZXhlY3V0ZSA9IEBjb21tYW5kTG9hZEdhbWVcbiAgICAgICAgICAgIHdoZW4gXCJncy5HZXRJbnB1dERhdGFcIiB0aGVuIGNvbW1hbmQuZXhlY3V0ZSA9IEBjb21tYW5kR2V0SW5wdXREYXRhXG4gICAgICAgICAgICB3aGVuIFwiZ3MuV2FpdEZvcklucHV0XCIgdGhlbiBjb21tYW5kLmV4ZWN1dGUgPSBAY29tbWFuZFdhaXRGb3JJbnB1dFxuICAgICAgICAgICAgd2hlbiBcImdzLkNoYW5nZU9iamVjdERvbWFpblwiIHRoZW4gY29tbWFuZC5leGVjdXRlID0gQGNvbW1hbmRDaGFuZ2VPYmplY3REb21haW5cbiAgICAgICAgICAgIHdoZW4gXCJ2bi5HZXRHYW1lRGF0YVwiIHRoZW4gY29tbWFuZC5leGVjdXRlID0gQGNvbW1hbmRHZXRHYW1lRGF0YVxuICAgICAgICAgICAgd2hlbiBcInZuLlNldEdhbWVEYXRhXCIgdGhlbiBjb21tYW5kLmV4ZWN1dGUgPSBAY29tbWFuZFNldEdhbWVEYXRhXG4gICAgICAgICAgICB3aGVuIFwidm4uR2V0T2JqZWN0RGF0YVwiIHRoZW4gY29tbWFuZC5leGVjdXRlID0gQGNvbW1hbmRHZXRPYmplY3REYXRhXG4gICAgICAgICAgICB3aGVuIFwidm4uU2V0T2JqZWN0RGF0YVwiIHRoZW4gY29tbWFuZC5leGVjdXRlID0gQGNvbW1hbmRTZXRPYmplY3REYXRhXG4gICAgICAgICAgICB3aGVuIFwidm4uQ2hhbmdlU291bmRzXCIgdGhlbiBjb21tYW5kLmV4ZWN1dGUgPSBAY29tbWFuZENoYW5nZVNvdW5kc1xuICAgICAgICAgICAgd2hlbiBcInZuLkNoYW5nZUNvbG9yc1wiIHRoZW4gY29tbWFuZC5leGVjdXRlID0gQGNvbW1hbmRDaGFuZ2VDb2xvcnNcbiAgICAgICAgICAgIHdoZW4gXCJncy5DaGFuZ2VTY3JlZW5DdXJzb3JcIiB0aGVuIGNvbW1hbmQuZXhlY3V0ZSA9IEBjb21tYW5kQ2hhbmdlU2NyZWVuQ3Vyc29yXG4gICAgICAgICAgICB3aGVuIFwiZ3MuUmVzZXRHbG9iYWxEYXRhXCIgdGhlbiBjb21tYW5kLmV4ZWN1dGUgPSBAY29tbWFuZFJlc2V0R2xvYmFsRGF0YVxuICAgICAgICAgICAgd2hlbiBcImdzLlNjcmlwdFwiIHRoZW4gY29tbWFuZC5leGVjdXRlID0gQGNvbW1hbmRTY3JpcHRcbiAgICBcbiAgICAjIyMqXG4gICAgKiBFeGVjdXRlcyB0aGUgY29tbWFuZCBhdCB0aGUgc3BlY2lmaWVkIGluZGV4IGFuZCBpbmNyZWFzZXMgdGhlIGNvbW1hbmQtcG9pbnRlci5cbiAgICAqXG4gICAgKiBAbWV0aG9kIGV4ZWN1dGVDb21tYW5kXG4gICAgIyMjICAgICAgIFxuICAgIGV4ZWN1dGVDb21tYW5kOiAoaW5kZXgpIC0+XG4gICAgICAgIEBjb21tYW5kID0gQG9iamVjdC5jb21tYW5kc1tpbmRleF1cblxuICAgICAgICBpZiBAcHJldmlld0RhdGFcbiAgICAgICAgICAgIGlmIEBwcmV2aWV3RGF0YS51aWQgYW5kIEBwcmV2aWV3RGF0YS51aWQgIT0gQGNvbW1hbmQudWlkXG4gICAgICAgICAgICAgICAgR2FtZU1hbmFnZXIudGVtcFNldHRpbmdzLnNraXAgPSB5ZXNcbiAgICAgICAgICAgICAgICBHYW1lTWFuYWdlci50ZW1wU2V0dGluZ3Muc2tpcFRpbWUgPSAwXG4gICAgICAgICAgICBlbHNlIGlmIEBwb2ludGVyIDwgQHByZXZpZXdEYXRhLnBvaW50ZXJcbiAgICAgICAgICAgICAgICBHYW1lTWFuYWdlci50ZW1wU2V0dGluZ3Muc2tpcCA9IHllc1xuICAgICAgICAgICAgICAgIEdhbWVNYW5hZ2VyLnRlbXBTZXR0aW5ncy5za2lwVGltZSA9IDBcbiAgICAgICAgICAgIGVsc2VcbiAgICAgICAgICAgICAgICBHYW1lTWFuYWdlci50ZW1wU2V0dGluZ3Muc2tpcCA9IEBwcmV2aWV3RGF0YS5zZXR0aW5ncy5hbmltYXRpb25EaXNhYmxlZFxuICAgICAgICAgICAgICAgIEdhbWVNYW5hZ2VyLnRlbXBTZXR0aW5ncy5za2lwVGltZSA9IDBcbiAgICAgICAgICAgICAgICBAcHJldmlld0luZm8ud2FpdGluZyA9IHllc1xuICAgICAgICAgICAgICAgIFxuICAgICAgICAgICAgICAgIGdzLkdsb2JhbEV2ZW50TWFuYWdlci5lbWl0KFwicHJldmlld1dhaXRpbmdcIilcbiAgICAgICAgICAgICAgICBpZiBAcHJldmlld0RhdGEuc2V0dGluZ3MuYW5pbWF0aW9uRGlzYWJsZWQgb3IgQHByZXZpZXdEYXRhLnNldHRpbmdzLmFuaW1hdGlvblRpbWUgPiAwXG4gICAgICAgICAgICAgICAgICAgIEBwcmV2aWV3SW5mby50aW1lb3V0ID0gc2V0VGltZW91dCAoLT4gR3JhcGhpY3Muc3RvcHBlZCA9IHllcyksIChAcHJldmlld0RhdGEuc2V0dGluZ3MuYW5pbWF0aW9uVGltZSkqMTAwMFxuICAgICAgICAgICAgICAgIFxuICAgICAgICBpZiBAY29tbWFuZC5leGVjdXRlP1xuICAgICAgICAgICAgQGNvbW1hbmQuaW50ZXJwcmV0ZXIgPSB0aGlzXG4gICAgICAgICAgICBAY29tbWFuZC5leGVjdXRlKCkgaWYgQGNvbW1hbmQuaW5kZW50ID09IEBpbmRlbnRcbiAgICAgICAgICAgIEBwb2ludGVyKytcbiAgICAgICAgICAgIFxuICAgICAgICAgICAgQGNvbW1hbmQgPSBAb2JqZWN0LmNvbW1hbmRzW0Bwb2ludGVyXVxuICAgICAgICAgICAgaWYgQGNvbW1hbmQ/XG4gICAgICAgICAgICAgICAgaW5kZW50ID0gQGNvbW1hbmQuaW5kZW50XG4gICAgICAgICAgICBlbHNlXG4gICAgICAgICAgICAgICAgaW5kZW50ID0gQGluZGVudFxuICAgICAgICAgICAgICAgIHdoaWxlIGluZGVudCA+IDAgYW5kIChub3QgQGxvb3BzW2luZGVudF0/KVxuICAgICAgICAgICAgICAgICAgICBpbmRlbnQtLVxuICAgICAgICAgICAgICAgICAgICBcbiAgICAgICAgICAgIGlmIGluZGVudCA8IEBpbmRlbnRcbiAgICAgICAgICAgICAgICBAaW5kZW50ID0gaW5kZW50XG4gICAgICAgICAgICAgICAgaWYgQGxvb3BzW0BpbmRlbnRdP1xuICAgICAgICAgICAgICAgICAgICBAcG9pbnRlciA9IEBsb29wc1tAaW5kZW50XVxuICAgICAgICAgICAgICAgICAgICBAY29tbWFuZCA9IEBvYmplY3QuY29tbWFuZHNbQHBvaW50ZXJdXG4gICAgICAgICAgICAgICAgICAgIEBjb21tYW5kLmludGVycHJldGVyID0gdGhpc1xuICAgICAgICBlbHNlXG4gICAgICAgICAgICBAYXNzaWduQ29tbWFuZChAY29tbWFuZClcbiAgICAgICAgICAgICAgICBcbiAgICAgICAgICAgIGlmIEBjb21tYW5kLmV4ZWN1dGU/XG4gICAgICAgICAgICAgICAgQGNvbW1hbmQuaW50ZXJwcmV0ZXIgPSB0aGlzXG4gICAgICAgICAgICAgICAgQGNvbW1hbmQuZXhlY3V0ZSgpIGlmIEBjb21tYW5kLmluZGVudCA9PSBAaW5kZW50XG4gICAgICAgICAgICAgICAgQHBvaW50ZXIrK1xuICAgICAgICAgICAgICAgIEBjb21tYW5kID0gQG9iamVjdC5jb21tYW5kc1tAcG9pbnRlcl1cbiAgICAgICAgICAgICAgICBpZiBAY29tbWFuZD9cbiAgICAgICAgICAgICAgICAgICAgaW5kZW50ID0gQGNvbW1hbmQuaW5kZW50XG4gICAgICAgICAgICAgICAgZWxzZVxuICAgICAgICAgICAgICAgICAgICBpbmRlbnQgPSBAaW5kZW50XG4gICAgICAgICAgICAgICAgICAgIHdoaWxlIGluZGVudCA+IDAgYW5kIChub3QgQGxvb3BzW2luZGVudF0/KVxuICAgICAgICAgICAgICAgICAgICAgICAgaW5kZW50LS1cbiAgICAgICAgICAgICAgICAgICAgICAgIFxuICAgICAgICAgICAgICAgIGlmIGluZGVudCA8IEBpbmRlbnRcbiAgICAgICAgICAgICAgICAgICAgQGluZGVudCA9IGluZGVudFxuICAgICAgICAgICAgICAgICAgICBpZiBAbG9vcHNbQGluZGVudF0/XG4gICAgICAgICAgICAgICAgICAgICAgICBAcG9pbnRlciA9IEBsb29wc1tAaW5kZW50XVxuICAgICAgICAgICAgICAgICAgICAgICAgQGNvbW1hbmQgPSBAb2JqZWN0LmNvbW1hbmRzW0Bwb2ludGVyXVxuICAgICAgICAgICAgICAgICAgICAgICAgQGNvbW1hbmQuaW50ZXJwcmV0ZXIgPSB0aGlzXG4gICAgICAgICAgICBlbHNlXG4gICAgICAgICAgICAgICAgQHBvaW50ZXIrK1xuICAgICMjIypcbiAgICAqIFNraXBzIGFsbCBjb21tYW5kcyB1bnRpbCBhIGNvbW1hbmQgd2l0aCB0aGUgc3BlY2lmaWVkIGluZGVudC1sZXZlbCBpcyBcbiAgICAqIGZvdW5kLiBTbyBmb3IgZXhhbXBsZTogVG8ganVtcCBmcm9tIGEgQ29uZGl0aW9uLUNvbW1hbmQgdG8gdGhlIG5leHRcbiAgICAqIEVsc2UtQ29tbWFuZCBqdXN0IHBhc3MgdGhlIGluZGVudC1sZXZlbCBvZiB0aGUgQ29uZGl0aW9uL0Vsc2UgY29tbWFuZC5cbiAgICAqXG4gICAgKiBAbWV0aG9kIHNraXBcbiAgICAqIEBwYXJhbSB7bnVtYmVyfSBpbmRlbnQgLSBUaGUgaW5kZW50LWxldmVsLlxuICAgICogQHBhcmFtIHtib29sZWFufSBiYWNrd2FyZCAtIElmIHRydWUgdGhlIHNraXAgcnVucyBiYWNrd2FyZC5cbiAgICAjIyMgICBcbiAgICBza2lwOiAoaW5kZW50LCBiYWNrd2FyZCkgLT5cbiAgICAgICAgaWYgYmFja3dhcmRcbiAgICAgICAgICAgIEBwb2ludGVyLS1cbiAgICAgICAgICAgIHdoaWxlIEBwb2ludGVyID4gMCBhbmQgQG9iamVjdC5jb21tYW5kc1tAcG9pbnRlcl0uaW5kZW50ICE9IGluZGVudFxuICAgICAgICAgICAgICAgIEBwb2ludGVyLS1cbiAgICAgICAgZWxzZVxuICAgICAgICAgICAgQHBvaW50ZXIrK1xuICAgICAgICAgICAgd2hpbGUgQHBvaW50ZXIgPCBAb2JqZWN0LmNvbW1hbmRzLmxlbmd0aCBhbmQgQG9iamVjdC5jb21tYW5kc1tAcG9pbnRlcl0uaW5kZW50ICE9IGluZGVudFxuICAgICAgICAgICAgICAgIEBwb2ludGVyKytcbiAgICBcbiAgICAjIyMqXG4gICAgKiBIYWx0cyB0aGUgaW50ZXJwcmV0ZXIgZm9yIHRoZSBzcGVjaWZpZWQgYW1vdW50IG9mIHRpbWUuIEFuIG9wdGlvbmFsbHlcbiAgICAqIGNhbGxiYWNrIGZ1bmN0aW9uIGNhbiBiZSBwYXNzZWQgd2hpY2ggaXMgY2FsbGVkIHdoZW4gdGhlIHRpbWUgaXMgdXAuXG4gICAgKlxuICAgICogQG1ldGhvZCB3YWl0XG4gICAgKiBAcGFyYW0ge251bWJlcn0gdGltZSAtIFRoZSB0aW1lIHRvIHdhaXRcbiAgICAqIEBwYXJhbSB7Z3MuQ2FsbGJhY2t9IGNhbGxiYWNrIC0gQ2FsbGVkIGlmIHRoZSB3YWl0IHRpbWUgaXMgdXAuXG4gICAgIyMjICBcbiAgICB3YWl0OiAodGltZSwgY2FsbGJhY2spIC0+XG4gICAgICAgIEBpc1dhaXRpbmcgPSB5ZXNcbiAgICAgICAgQHdhaXRDb3VudGVyID0gdGltZVxuICAgICAgICBAd2FpdENhbGxiYWNrID0gY2FsbGJhY2tcbiAgICAgICAgXG4gICAgIyMjKlxuICAgICogQ2hlY2tzIGlmIHRoZSBjb21tYW5kIGF0IHRoZSBzcGVjaWZpZWQgcG9pbnRlci1pbmRleCBpcyBhIGdhbWUgbWVzc2FnZVxuICAgICogcmVsYXRlZCBjb21tYW5kLlxuICAgICpcbiAgICAqIEBtZXRob2QgaXNNZXNzYWdlQ29tbWFuZFxuICAgICogQHBhcmFtIHtudW1iZXJ9IHBvaW50ZXIgLSBUaGUgcG9pbnRlci9pbmRleC5cbiAgICAqIEBwYXJhbSB7T2JqZWN0W119IGNvbW1hbmRzIC0gVGhlIGxpc3Qgb2YgY29tbWFuZHMgdG8gY2hlY2suXG4gICAgKiBAcmV0dXJuIHtib29sZWFufSA8Yj50cnVlPC9iPiBpZiBpdHMgYSBnYW1lIG1lc3NhZ2UgcmVsYXRlZCBjb21tYW5kLiBPdGhlcndpc2UgPGI+ZmFsc2U8L2I+LlxuICAgICMjIyBcbiAgICBpc01lc3NhZ2VDb21tYW5kOiAocG9pbnRlciwgY29tbWFuZHMpIC0+XG4gICAgICAgIHJlc3VsdCA9IHllc1xuICAgICAgICBpZiBwb2ludGVyID49IGNvbW1hbmRzLmxlbmd0aCBvciAoY29tbWFuZHNbcG9pbnRlcl0uaWQgIT0gXCJncy5JbnB1dE51bWJlclwiIGFuZFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgY29tbWFuZHNbcG9pbnRlcl0uaWQgIT0gXCJ2bi5DaG9pY2VcIiBhbmRcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGNvbW1hbmRzW3BvaW50ZXJdLmlkICE9IFwiZ3MuSW5wdXRUZXh0XCIgYW5kXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBjb21tYW5kc1twb2ludGVyXS5pZCAhPSBcImdzLklucHV0TmFtZVwiKVxuICAgICAgICAgICAgICAgIHJlc3VsdCA9IG5vXG4gICAgICAgIHJldHVybiByZXN1bHRcbiAgICBcbiAgICAjIyMqXG4gICAgKiBDaGVja3MgaWYgdGhlIGNvbW1hbmQgYXQgdGhlIHNwZWNpZmllZCBwb2ludGVyLWluZGV4IGFza3MgZm9yIHVzZXItaW5wdXQgbGlrZVxuICAgICogdGhlIElucHV0IE51bWJlciBvciBJbnB1dCBUZXh0IGNvbW1hbmQuXG4gICAgKlxuICAgICogQG1ldGhvZCBpc0lucHV0RGF0YUNvbW1hbmRcbiAgICAqIEBwYXJhbSB7bnVtYmVyfSBwb2ludGVyIC0gVGhlIHBvaW50ZXIvaW5kZXguXG4gICAgKiBAcGFyYW0ge09iamVjdFtdfSBjb21tYW5kcyAtIFRoZSBsaXN0IG9mIGNvbW1hbmRzIHRvIGNoZWNrLlxuICAgICogQHJldHVybiB7Ym9vbGVhbn0gPGI+dHJ1ZTwvYj4gaWYgaXRzIGFuIGlucHV0LWRhdGEgY29tbWFuZC4gT3RoZXJ3aXNlIDxiPmZhbHNlPC9iPlxuICAgICMjIyAgICAgXG4gICAgaXNJbnB1dERhdGFDb21tYW5kOiAocG9pbnRlciwgY29tbWFuZHMpIC0+XG4gICAgICAgIHBvaW50ZXIgPCBjb21tYW5kcy5sZW5ndGggYW5kIChcbiAgICAgICAgICAgIGNvbW1hbmRzW3BvaW50ZXJdLmlkID09IFwiZ3MuSW5wdXROdW1iZXJcIiBvclxuICAgICAgICAgICAgY29tbWFuZHNbcG9pbnRlcl0uaWQgPT0gXCJncy5JbnB1dFRleHRcIiBvclxuICAgICAgICAgICAgY29tbWFuZHNbcG9pbnRlcl0uaWQgPT0gXCJ2bi5DaG9pY2VcIiBvclxuICAgICAgICAgICAgY29tbWFuZHNbcG9pbnRlcl0uaWQgPT0gXCJ2bi5TaG93Q2hvaWNlc1wiXG4gICAgICAgIClcbiAgICAgXG4gICAgIyMjKlxuICAgICogQ2hlY2tzIGlmIGEgZ2FtZSBtZXNzYWdlIGlzIGN1cnJlbnRseSBydW5uaW5nIGJ5IGFub3RoZXIgaW50ZXJwcmV0ZXIgbGlrZSBhXG4gICAgKiBjb21tb24tZXZlbnQgaW50ZXJwcmV0ZXIuXG4gICAgKlxuICAgICogQG1ldGhvZCBpc1Byb2Nlc3NpbmdNZXNzYWdlSW5PdGhlckNvbnRleHRcbiAgICAqIEByZXR1cm4ge2Jvb2xlYW59IDxiPnRydWU8L2I+IGEgZ2FtZSBtZXNzYWdlIGlzIHJ1bm5pbmcgaW4gYW5vdGhlciBjb250ZXh0LiBPdGhlcndpc2UgPGI+ZmFsc2U8L2I+XG4gICAgIyMjICAgICBcbiAgICBpc1Byb2Nlc3NpbmdNZXNzYWdlSW5PdGhlckNvbnRleHQ6IC0+XG4gICAgICAgIHJlc3VsdCA9IG5vXG4gICAgICAgIGdtID0gR2FtZU1hbmFnZXJcbiAgICAgICAgcyA9IFNjZW5lTWFuYWdlci5zY2VuZVxuICAgICAgICBcbiAgICAgICAgcmVzdWx0ID1cbiAgICAgICAgICAgICAgICAgKHMuaW5wdXROdW1iZXJXaW5kb3c/IGFuZCBzLmlucHV0TnVtYmVyV2luZG93LnZpc2libGUgYW5kIHMuaW5wdXROdW1iZXJXaW5kb3cuZXhlY3V0aW9uQ29udGV4dCAhPSBAY29udGV4dCkgb3JcbiAgICAgICAgICAgICAgICAgKHMuaW5wdXRUZXh0V2luZG93PyBhbmQgcy5pbnB1dFRleHRXaW5kb3cuYWN0aXZlIGFuZCBzLmlucHV0VGV4dFdpbmRvdy5leGVjdXRpb25Db250ZXh0ICE9IEBjb250ZXh0KVxuICAgICAgICBcbiAgICAgICAgcmV0dXJuIHJlc3VsdFxuICAgIFxuICAgICMjIypcbiAgICAqIElmIGEgZ2FtZSBtZXNzYWdlIGlzIGN1cnJlbnRseSBydW5uaW5nIGJ5IGFuIG90aGVyIGludGVycHJldGVyIGxpa2UgYSBjb21tb24tZXZlbnRcbiAgICAqIGludGVycHJldGVyLCB0aGlzIG1ldGhvZCB0cmlnZ2VyIGEgd2FpdCB1bnRpbCB0aGUgb3RoZXIgaW50ZXJwcmV0ZXIgaXMgZmluaXNoZWRcbiAgICAqIHdpdGggdGhlIGdhbWUgbWVzc2FnZS5cbiAgICAqXG4gICAgKiBAbWV0aG9kIHdhaXRGb3JNZXNzYWdlXG4gICAgKiBAcmV0dXJuIHtib29sZWFufSA8Yj50cnVlPC9iPiBhIGdhbWUgbWVzc2FnZSBpcyBydW5uaW5nIGluIGFub3RoZXIgY29udGV4dC4gT3RoZXJ3aXNlIDxiPmZhbHNlPC9iPlxuICAgICMjIyAgICAgICBcbiAgICB3YWl0Rm9yTWVzc2FnZTogLT5cbiAgICAgICAgQGlzV2FpdGluZ0Zvck1lc3NhZ2UgPSB5ZXNcbiAgICAgICAgQGlzV2FpdGluZyA9IHllc1xuICAgICAgICBAcG9pbnRlci0tXG4gICAgXG4gICAgXG4gICAgIyMjKlxuICAgICogR2V0cyB0aGUgdmFsdWUgdGhlIG51bWJlciB2YXJpYWJsZSBhdCB0aGUgc3BlY2lmaWVkIGluZGV4LlxuICAgICpcbiAgICAqIEBtZXRob2QgbnVtYmVyVmFsdWVBdEluZGV4XG4gICAgKiBAcGFyYW0ge251bWJlcn0gc2NvcGUgLSBUaGUgdmFyaWFibGUncyBzY29wZS5cbiAgICAqIEBwYXJhbSB7bnVtYmVyfSBpbmRleCAtIFRoZSBpbmRleCBvZiB0aGUgdmFyaWFibGUgdG8gZ2V0IHRoZSB2YWx1ZSBmcm9tLlxuICAgICogQHJldHVybiB7TnVtYmVyfSBUaGUgdmFsdWUgb2YgdGhlIHZhcmlhYmxlLlxuICAgICMjIyAgICAgXG4gICAgbnVtYmVyVmFsdWVBdEluZGV4OiAoc2NvcGUsIGluZGV4LCBkb21haW4pIC0+IEdhbWVNYW5hZ2VyLnZhcmlhYmxlU3RvcmUubnVtYmVyVmFsdWVBdEluZGV4KHNjb3BlLCBpbmRleCwgZG9tYWluKVxuICAgIFxuICAgICMjIypcbiAgICAqIEdldHMgdGhlIHZhbHVlIG9mIGEgKHBvc3NpYmxlKSBudW1iZXIgdmFyaWFibGUuIElmIGEgY29uc3RhbnQgbnVtYmVyIHZhbHVlIGlzIHNwZWNpZmllZCwgdGhpcyBtZXRob2RcbiAgICAqIGRvZXMgbm90aGluZyBhbiBqdXN0IHJldHVybnMgdGhhdCBjb25zdGFudCB2YWx1ZS4gVGhhdCdzIHRvIG1ha2UgaXQgbW9yZSBjb21mb3J0YWJsZSB0byBqdXN0IHBhc3MgYSB2YWx1ZSB3aGljaFxuICAgICogY2FuIGJlIGNhbGN1bGF0ZWQgYnkgdmFyaWFibGUgYnV0IGFsc28gYmUganVzdCBhIGNvbnN0YW50IHZhbHVlLlxuICAgICpcbiAgICAqIEBtZXRob2QgbnVtYmVyVmFsdWVPZlxuICAgICogQHBhcmFtIHtudW1iZXJ8T2JqZWN0fSBvYmplY3QgLSBBIG51bWJlciB2YXJpYWJsZSBvciBjb25zdGFudCBudW1iZXIgdmFsdWUuXG4gICAgKiBAcmV0dXJuIHtOdW1iZXJ9IFRoZSB2YWx1ZSBvZiB0aGUgdmFyaWFibGUuXG4gICAgIyMjICAgICBcbiAgICBudW1iZXJWYWx1ZU9mOiAob2JqZWN0KSAtPiBHYW1lTWFuYWdlci52YXJpYWJsZVN0b3JlLm51bWJlclZhbHVlT2Yob2JqZWN0KVxuICAgIFxuICAgICMjIypcbiAgICAqIEl0IGRvZXMgdGhlIHNhbWUgbGlrZSA8Yj5udW1iZXJWYWx1ZU9mPC9iPiB3aXRoIG9uZSBkaWZmZXJlbmNlOiBJZiB0aGUgc3BlY2lmaWVkIG9iamVjdFxuICAgICogaXMgYSB2YXJpYWJsZSwgaXQncyB2YWx1ZSBpcyBjb25zaWRlcmVkIGFzIGEgZHVyYXRpb24tdmFsdWUgaW4gbWlsbGlzZWNvbmRzIGFuZCBhdXRvbWF0aWNhbGx5IGNvbnZlcnRlZFxuICAgICogaW50byBmcmFtZXMuXG4gICAgKlxuICAgICogQG1ldGhvZCBkdXJhdGlvblZhbHVlT2ZcbiAgICAqIEBwYXJhbSB7bnVtYmVyfE9iamVjdH0gb2JqZWN0IC0gQSBudW1iZXIgdmFyaWFibGUgb3IgY29uc3RhbnQgbnVtYmVyIHZhbHVlLlxuICAgICogQHJldHVybiB7TnVtYmVyfSBUaGUgdmFsdWUgb2YgdGhlIHZhcmlhYmxlLlxuICAgICMjIyAgICAgXG4gICAgZHVyYXRpb25WYWx1ZU9mOiAob2JqZWN0KSAtPiBcbiAgICAgICAgaWYgb2JqZWN0IGFuZCBvYmplY3QuaW5kZXg/XG4gICAgICAgICAgICBNYXRoLnJvdW5kKEdhbWVNYW5hZ2VyLnZhcmlhYmxlU3RvcmUubnVtYmVyVmFsdWVPZihvYmplY3QpIC8gMTAwMCAqIEdyYXBoaWNzLmZyYW1lUmF0ZSlcbiAgICAgICAgZWxzZVxuICAgICAgICAgICAgTWF0aC5yb3VuZChHYW1lTWFuYWdlci52YXJpYWJsZVN0b3JlLm51bWJlclZhbHVlT2Yob2JqZWN0KSlcbiAgICAgXG4gICAgIyMjKlxuICAgICogR2V0cyBhIHBvc2l0aW9uICh7eCwgeX0pIGZvciB0aGUgc3BlY2lmaWVkIHByZWRlZmluZWQgb2JqZWN0IHBvc2l0aW9uIGNvbmZpZ3VyZWQgaW4gXG4gICAgKiBEYXRhYmFzZSAtIFN5c3RlbS5cbiAgICAqXG4gICAgKiBAbWV0aG9kIHByZWRlZmluZWRPYmplY3RQb3NpdGlvblxuICAgICogQHBhcmFtIHtudW1iZXJ9IHBvc2l0aW9uIC0gVGhlIGluZGV4L0lEIG9mIHRoZSBwcmVkZWZpbmVkIG9iamVjdCBwb3NpdGlvbiB0byBzZXQuXG4gICAgKiBAcGFyYW0ge2dzLk9iamVjdF9CYXNlfSBvYmplY3QgLSBUaGUgZ2FtZSBvYmplY3QgdG8gc2V0IHRoZSBwb3NpdGlvbiBmb3IuXG4gICAgKiBAcGFyYW0ge09iamVjdH0gcGFyYW1zIC0gVGhlIHBhcmFtcyBvYmplY3Qgb2YgdGhlIHNjZW5lIGNvbW1hbmQuXG4gICAgKiBAcmV0dXJuIHtPYmplY3R9IFRoZSBwb3NpdGlvbiB7eCwgeX0uXG4gICAgIyMjXG4gICAgcHJlZGVmaW5lZE9iamVjdFBvc2l0aW9uOiAocG9zaXRpb24sIG9iamVjdCwgcGFyYW1zKSAtPlxuICAgICAgICBvYmplY3RQb3NpdGlvbiA9IFJlY29yZE1hbmFnZXIuc3lzdGVtLm9iamVjdFBvc2l0aW9uc1twb3NpdGlvbl1cbiAgICAgICAgaWYgIW9iamVjdFBvc2l0aW9uIHRoZW4gcmV0dXJuIHsgeDogMCwgeTogMCB9XG4gICAgICAgIFxuICAgICAgICByZXR1cm4gb2JqZWN0UG9zaXRpb24uZnVuYy5jYWxsKG51bGwsIG9iamVjdCwgcGFyYW1zKSB8fCB7IHg6IDAsIHk6IDAgfVxuICAgICAgICBcbiAgICAjIyMqXG4gICAgKiBTZXRzIHRoZSB2YWx1ZSBvZiBhIG51bWJlciB2YXJpYWJsZSBhdCB0aGUgc3BlY2lmaWVkIGluZGV4LlxuICAgICpcbiAgICAqIEBtZXRob2Qgc2V0TnVtYmVyVmFsdWVBdEluZGV4XG4gICAgKiBAcGFyYW0ge251bWJlcn0gc2NvcGUgLSBUaGUgdmFyaWFibGUncyBzY29wZS5cbiAgICAqIEBwYXJhbSB7bnVtYmVyfSBpbmRleCAtIFRoZSBpbmRleCBvZiB0aGUgdmFyaWFibGUgdG8gc2V0LlxuICAgICogQHBhcmFtIHtudW1iZXJ9IHZhbHVlIC0gVGhlIG51bWJlciB2YWx1ZSB0byBzZXQgdGhlIHZhcmlhYmxlIHRvLlxuICAgICMjI1xuICAgIHNldE51bWJlclZhbHVlQXRJbmRleDogKHNjb3BlLCBpbmRleCwgdmFsdWUsIGRvbWFpbikgLT4gR2FtZU1hbmFnZXIudmFyaWFibGVTdG9yZS5zZXROdW1iZXJWYWx1ZUF0SW5kZXgoc2NvcGUsIGluZGV4LCB2YWx1ZSwgZG9tYWluKVxuICAgIFxuICAgICMjIypcbiAgICAqIFNldHMgdGhlIHZhbHVlIG9mIGEgbnVtYmVyIHZhcmlhYmxlLlxuICAgICpcbiAgICAqIEBtZXRob2Qgc2V0TnVtYmVyVmFsdWVUb1xuICAgICogQHBhcmFtIHtudW1iZXJ9IHZhcmlhYmxlIC0gVGhlIHZhcmlhYmxlIHRvIHNldC5cbiAgICAqIEBwYXJhbSB7bnVtYmVyfSB2YWx1ZSAtIFRoZSBudW1iZXIgdmFsdWUgdG8gc2V0IHRoZSB2YXJpYWJsZSB0by5cbiAgICAjIyNcbiAgICBzZXROdW1iZXJWYWx1ZVRvOiAodmFyaWFibGUsIHZhbHVlKSAtPiBHYW1lTWFuYWdlci52YXJpYWJsZVN0b3JlLnNldE51bWJlclZhbHVlVG8odmFyaWFibGUsIHZhbHVlKVxuICAgIFxuICAgICMjIypcbiAgICAqIFNldHMgdGhlIHZhbHVlIG9mIGEgbGlzdCB2YXJpYWJsZS5cbiAgICAqXG4gICAgKiBAbWV0aG9kIHNldExpc3RPYmplY3RUb1xuICAgICogQHBhcmFtIHtPYmplY3R9IHZhcmlhYmxlIC0gVGhlIHZhcmlhYmxlIHRvIHNldC5cbiAgICAqIEBwYXJhbSB7T2JqZWN0fSB2YWx1ZSAtIFRoZSBsaXN0IG9iamVjdCB0byBzZXQgdGhlIHZhcmlhYmxlIHRvLlxuICAgICMjI1xuICAgIHNldExpc3RPYmplY3RUbzogKHZhcmlhYmxlLCB2YWx1ZSkgLT4gR2FtZU1hbmFnZXIudmFyaWFibGVTdG9yZS5zZXRMaXN0T2JqZWN0VG8odmFyaWFibGUsIHZhbHVlKVxuXG4gICAgIyMjKlxuICAgICogU2V0cyB0aGUgdmFsdWUgb2YgYSBib29sZWFuL3N3aXRjaCB2YXJpYWJsZS5cbiAgICAqXG4gICAgKiBAbWV0aG9kIHNldEJvb2xlYW5WYWx1ZVRvXG4gICAgKiBAcGFyYW0ge09iamVjdH0gdmFyaWFibGUgLSBUaGUgdmFyaWFibGUgdG8gc2V0LlxuICAgICogQHBhcmFtIHtib29sZWFufSB2YWx1ZSAtIFRoZSBib29sZWFuIHZhbHVlIHRvIHNldCB0aGUgdmFyaWFibGUgdG8uXG4gICAgIyMjXG4gICAgc2V0Qm9vbGVhblZhbHVlVG86ICh2YXJpYWJsZSwgdmFsdWUpIC0+IEdhbWVNYW5hZ2VyLnZhcmlhYmxlU3RvcmUuc2V0Qm9vbGVhblZhbHVlVG8odmFyaWFibGUsIHZhbHVlKVxuICAgIFxuICAgICMjIypcbiAgICAqIFNldHMgdGhlIHZhbHVlIG9mIGEgbnVtYmVyIHZhcmlhYmxlIGF0IHRoZSBzcGVjaWZpZWQgaW5kZXguXG4gICAgKlxuICAgICogQG1ldGhvZCBzZXRCb29sZWFuVmFsdWVBdEluZGV4XG4gICAgKiBAcGFyYW0ge251bWJlcn0gc2NvcGUgLSBUaGUgdmFyaWFibGUncyBzY29wZS5cbiAgICAqIEBwYXJhbSB7bnVtYmVyfSBpbmRleCAtIFRoZSBpbmRleCBvZiB0aGUgdmFyaWFibGUgdG8gc2V0LlxuICAgICogQHBhcmFtIHtib29sZWFufSB2YWx1ZSAtIFRoZSBib29sZWFuIHZhbHVlIHRvIHNldCB0aGUgdmFyaWFibGUgdG8uXG4gICAgIyMjXG4gICAgc2V0Qm9vbGVhblZhbHVlQXRJbmRleDogKHNjb3BlLCBpbmRleCwgdmFsdWUsIGRvbWFpbikgLT4gR2FtZU1hbmFnZXIudmFyaWFibGVTdG9yZS5zZXRCb29sZWFuVmFsdWVBdEluZGV4KHNjb3BlLCBpbmRleCwgdmFsdWUsIGRvbWFpbilcbiAgICBcbiAgICAjIyMqXG4gICAgKiBTZXRzIHRoZSB2YWx1ZSBvZiBhIHN0cmluZy90ZXh0IHZhcmlhYmxlLlxuICAgICpcbiAgICAqIEBtZXRob2Qgc2V0U3RyaW5nVmFsdWVUb1xuICAgICogQHBhcmFtIHtPYmplY3R9IHZhcmlhYmxlIC0gVGhlIHZhcmlhYmxlIHRvIHNldC5cbiAgICAqIEBwYXJhbSB7c3RyaW5nfSB2YWx1ZSAtIFRoZSBzdHJpbmcvdGV4dCB2YWx1ZSB0byBzZXQgdGhlIHZhcmlhYmxlIHRvLlxuICAgICMjI1xuICAgIHNldFN0cmluZ1ZhbHVlVG86ICh2YXJpYWJsZSwgdmFsdWUpIC0+IEdhbWVNYW5hZ2VyLnZhcmlhYmxlU3RvcmUuc2V0U3RyaW5nVmFsdWVUbyh2YXJpYWJsZSwgdmFsdWUpXG4gICAgXG4gICAgIyMjKlxuICAgICogU2V0cyB0aGUgdmFsdWUgb2YgdGhlIHN0cmluZyB2YXJpYWJsZSBhdCB0aGUgc3BlY2lmaWVkIGluZGV4LlxuICAgICpcbiAgICAqIEBtZXRob2Qgc2V0U3RyaW5nVmFsdWVBdEluZGV4XG4gICAgKiBAcGFyYW0ge251bWJlcn0gc2NvcGUgLSBUaGUgdmFyaWFibGUgc2NvcGUuXG4gICAgKiBAcGFyYW0ge251bWJlcn0gaW5kZXggLSBUaGUgdmFyaWFibGUncyBpbmRleC5cbiAgICAqIEBwYXJhbSB7c3RyaW5nfSB2YWx1ZSAtIFRoZSB2YWx1ZSB0byBzZXQuXG4gICAgIyMjICAgICBcbiAgICBzZXRTdHJpbmdWYWx1ZUF0SW5kZXg6IChzY29wZSwgaW5kZXgsIHZhbHVlLCBkb21haW4pIC0+IEdhbWVNYW5hZ2VyLnZhcmlhYmxlU3RvcmUuc2V0U3RyaW5nVmFsdWVBdEluZGV4KHNjb3BlLCBpbmRleCwgdmFsdWUsIGRvbWFpbilcbiAgICAgICAgICAgIFxuICAgICMjIypcbiAgICAqIEdldHMgdGhlIHZhbHVlIG9mIGEgKHBvc3NpYmxlKSBzdHJpbmcgdmFyaWFibGUuIElmIGEgY29uc3RhbnQgc3RyaW5nIHZhbHVlIGlzIHNwZWNpZmllZCwgdGhpcyBtZXRob2RcbiAgICAqIGRvZXMgbm90aGluZyBhbiBqdXN0IHJldHVybnMgdGhhdCBjb25zdGFudCB2YWx1ZS4gVGhhdCdzIHRvIG1ha2UgaXQgbW9yZSBjb21mb3J0YWJsZSB0byBqdXN0IHBhc3MgYSB2YWx1ZSB3aGljaFxuICAgICogY2FuIGJlIGNhbGN1bGF0ZWQgYnkgdmFyaWFibGUgYnV0IGFsc28gYmUganVzdCBhIGNvbnN0YW50IHZhbHVlLlxuICAgICpcbiAgICAqIEBtZXRob2Qgc3RyaW5nVmFsdWVPZlxuICAgICogQHBhcmFtIHtzdHJpbmd8T2JqZWN0fSBvYmplY3QgLSBBIHN0cmluZyB2YXJpYWJsZSBvciBjb25zdGFudCBzdHJpbmcgdmFsdWUuXG4gICAgKiBAcmV0dXJuIHtzdHJpbmd9IFRoZSB2YWx1ZSBvZiB0aGUgdmFyaWFibGUuXG4gICAgIyMjIFxuICAgIHN0cmluZ1ZhbHVlT2Y6IChvYmplY3QpIC0+IEdhbWVNYW5hZ2VyLnZhcmlhYmxlU3RvcmUuc3RyaW5nVmFsdWVPZihvYmplY3QpXG4gICAgXG4gICAgIyMjKlxuICAgICogR2V0cyB0aGUgdmFsdWUgb2YgdGhlIHN0cmluZyB2YXJpYWJsZSBhdCB0aGUgc3BlY2lmaWVkIGluZGV4LlxuICAgICpcbiAgICAqIEBtZXRob2Qgc3RyaW5nVmFsdWVBdEluZGV4XG4gICAgKiBAcGFyYW0ge251bWJlcn0gc2NvcGUgLSBUaGUgdmFyaWFibGUncyBzY29wZS5cbiAgICAqIEBwYXJhbSB7bnVtYmVyfSBpbmRleCAtIFRoZSBpbmRleCBvZiB0aGUgdmFyaWFibGUgdG8gZ2V0IHRoZSB2YWx1ZSBmcm9tLlxuICAgICogQHJldHVybiB7c3RyaW5nfSBUaGUgdmFsdWUgb2YgdGhlIHZhcmlhYmxlLlxuICAgICMjIyAgICAgXG4gICAgc3RyaW5nVmFsdWVBdEluZGV4OiAoc2NvcGUsIGluZGV4LCBkb21haW4pIC0+IEdhbWVNYW5hZ2VyLnZhcmlhYmxlU3RvcmUuc3RyaW5nVmFsdWVBdEluZGV4KHNjb3BlLCBpbmRleCwgZG9tYWluKVxuICAgIFxuICAgICMjIypcbiAgICAqIEdldHMgdGhlIHZhbHVlIG9mIGEgKHBvc3NpYmxlKSBib29sZWFuIHZhcmlhYmxlLiBJZiBhIGNvbnN0YW50IGJvb2xlYW4gdmFsdWUgaXMgc3BlY2lmaWVkLCB0aGlzIG1ldGhvZFxuICAgICogZG9lcyBub3RoaW5nIGFuIGp1c3QgcmV0dXJucyB0aGF0IGNvbnN0YW50IHZhbHVlLiBUaGF0J3MgdG8gbWFrZSBpdCBtb3JlIGNvbWZvcnRhYmxlIHRvIGp1c3QgcGFzcyBhIHZhbHVlIHdoaWNoXG4gICAgKiBjYW4gYmUgY2FsY3VsYXRlZCBieSB2YXJpYWJsZSBidXQgYWxzbyBiZSBqdXN0IGEgY29uc3RhbnQgdmFsdWUuXG4gICAgKlxuICAgICogQG1ldGhvZCBib29sZWFuVmFsdWVPZlxuICAgICogQHBhcmFtIHtib29sZWFufE9iamVjdH0gb2JqZWN0IC0gQSBib29sZWFuIHZhcmlhYmxlIG9yIGNvbnN0YW50IGJvb2xlYW4gdmFsdWUuXG4gICAgKiBAcmV0dXJuIHtib29sZWFufSBUaGUgdmFsdWUgb2YgdGhlIHZhcmlhYmxlLlxuICAgICMjIyBcbiAgICBib29sZWFuVmFsdWVPZjogKG9iamVjdCkgLT4gR2FtZU1hbmFnZXIudmFyaWFibGVTdG9yZS5ib29sZWFuVmFsdWVPZihvYmplY3QpXG4gICAgXG4gICAgIyMjKlxuICAgICogR2V0cyB0aGUgdmFsdWUgb2YgdGhlIGJvb2xlYW4gdmFyaWFibGUgYXQgdGhlIHNwZWNpZmllZCBpbmRleC5cbiAgICAqXG4gICAgKiBAbWV0aG9kIGJvb2xlYW5WYWx1ZUF0SW5kZXhcbiAgICAqIEBwYXJhbSB7bnVtYmVyfSBzY29wZSAtIFRoZSB2YXJpYWJsZSdzIHNjb3BlLlxuICAgICogQHBhcmFtIHtudW1iZXJ9IGluZGV4IC0gVGhlIGluZGV4IG9mIHRoZSB2YXJpYWJsZSB0byBnZXQgdGhlIHZhbHVlIGZyb20uXG4gICAgKiBAcmV0dXJuIHtzdHJpbmd9IFRoZSB2YWx1ZSBvZiB0aGUgdmFyaWFibGUuXG4gICAgIyMjICAgICBcbiAgICBib29sZWFuVmFsdWVBdEluZGV4OiAoc2NvcGUsIGluZGV4LCBkb21haW4pIC0+IEdhbWVNYW5hZ2VyLnZhcmlhYmxlU3RvcmUuYm9vbGVhblZhbHVlQXRJbmRleChzY29wZSwgaW5kZXgsIGRvbWFpbilcbiAgICBcbiAgICAjIyMqXG4gICAgKiBHZXRzIHRoZSB2YWx1ZSBvZiBhIChwb3NzaWJsZSkgbGlzdCB2YXJpYWJsZS5cbiAgICAqXG4gICAgKiBAbWV0aG9kIGxpc3RPYmplY3RPZlxuICAgICogQHBhcmFtIHtPYmplY3R9IG9iamVjdCAtIEEgbGlzdCB2YXJpYWJsZS5cbiAgICAqIEByZXR1cm4ge09iamVjdH0gVGhlIHZhbHVlIG9mIHRoZSBsaXN0IHZhcmlhYmxlLlxuICAgICMjIyBcbiAgICBsaXN0T2JqZWN0T2Y6IChvYmplY3QpIC0+IEdhbWVNYW5hZ2VyLnZhcmlhYmxlU3RvcmUubGlzdE9iamVjdE9mKG9iamVjdClcbiAgICBcbiAgICAjIyMqXG4gICAgKiBDb21wYXJlcyB0d28gb2JqZWN0IHVzaW5nIHRoZSBzcGVjaWZpZWQgb3BlcmF0aW9uIGFuZCByZXR1cm5zIHRoZSByZXN1bHQuXG4gICAgKlxuICAgICogQG1ldGhvZCBjb21wYXJlXG4gICAgKiBAcGFyYW0ge09iamVjdH0gYSAtIE9iamVjdCBBLlxuICAgICogQHBhcmFtIHtPYmplY3R9IGIgLSBPYmplY3QgQi5cbiAgICAqIEBwYXJhbSB7bnVtYmVyfSBvcGVyYXRpb24gLSBUaGUgY29tcGFyZS1vcGVyYXRpb24gdG8gY29tcGFyZSBPYmplY3QgQSB3aXRoIE9iamVjdCBCLlxuICAgICogPHVsPlxuICAgICogPGxpPjAgPSBFcXVhbCBUbzwvbGk+XG4gICAgKiA8bGk+MSA9IE5vdCBFcXVhbCBUbzwvbGk+XG4gICAgKiA8bGk+MiA9IEdyZWF0ZXIgVGhhbjwvbGk+XG4gICAgKiA8bGk+MyA9IEdyZWF0ZXIgb3IgRXF1YWwgVG88L2xpPlxuICAgICogPGxpPjQgPSBMZXNzIFRoYW48L2xpPlxuICAgICogPGxpPjUgPSBMZXNzIG9yIEVxdWFsIFRvPC9saT5cbiAgICAqIDwvdWw+XG4gICAgKiBAcmV0dXJuIHtib29sZWFufSBUaGUgY29tcGFyaXNvbiByZXN1bHQuXG4gICAgIyMjIFxuICAgIGNvbXBhcmU6IChhLCBiLCBvcGVyYXRpb24pIC0+XG4gICAgICAgIHN3aXRjaCBvcGVyYXRpb25cbiAgICAgICAgICAgIHdoZW4gMCB0aGVuIHJldHVybiBgYSA9PSBiYFxuICAgICAgICAgICAgd2hlbiAxIHRoZW4gcmV0dXJuIGBhICE9IGJgXG4gICAgICAgICAgICB3aGVuIDIgdGhlbiByZXR1cm4gYSA+IGJcbiAgICAgICAgICAgIHdoZW4gMyB0aGVuIHJldHVybiBhID49IGJcbiAgICAgICAgICAgIHdoZW4gNCB0aGVuIHJldHVybiBhIDwgYlxuICAgICAgICAgICAgd2hlbiA1IHRoZW4gcmV0dXJuIGEgPD0gYlxuICAgICBcbiAgICAjIyMqXG4gICAgKiBDaGFuZ2VzIG51bWJlciB2YXJpYWJsZXMgYW5kIGFsbG93cyBkZWNpbWFsIHZhbHVlcyBzdWNoIGFzIDAuNSB0b28uXG4gICAgKlxuICAgICogQG1ldGhvZCBjaGFuZ2VEZWNpbWFsVmFyaWFibGVzXG4gICAgKiBAcGFyYW0ge09iamVjdH0gcGFyYW1zIC0gSW5wdXQgcGFyYW1zIGZyb20gdGhlIGNvbW1hbmRcbiAgICAqIEBwYXJhbSB7T2JqZWN0fSByb3VuZE1ldGhvZCAtIFRoZSByZXN1bHQgb2YgdGhlIG9wZXJhdGlvbiB3aWxsIGJlIHJvdW5kZWQgdXNpbmcgdGhlIHNwZWNpZmllZCBtZXRob2QuXG4gICAgKiA8dWw+XG4gICAgKiA8bGk+MCA9IE5vbmUuIFRoZSByZXN1bHQgd2lsbCBub3QgYmUgcm91bmRlZC48L2xpPlxuICAgICogPGxpPjEgPSBDb21tZXJjaWFsbHk8L2xpPlxuICAgICogPGxpPjIgPSBSb3VuZCBVcDwvbGk+XG4gICAgKiA8bGk+MyA9IFJvdW5kIERvd248L2xpPlxuICAgICogPC91bD5cbiAgICAjIyMgICAgICAgXG4gICAgY2hhbmdlRGVjaW1hbFZhcmlhYmxlczogKHBhcmFtcywgcm91bmRNZXRob2QpIC0+XG4gICAgICAgIHNvdXJjZSA9IDBcbiAgICAgICAgcm91bmRGdW5jID0gbnVsbFxuICAgICAgICBcbiAgICAgICAgc3dpdGNoIHJvdW5kTWV0aG9kXG4gICAgICAgICAgICB3aGVuIDAgdGhlbiByb3VuZEZ1bmMgPSAodmFsdWUpIC0+IHZhbHVlXG4gICAgICAgICAgICB3aGVuIDEgdGhlbiByb3VuZEZ1bmMgPSAodmFsdWUpIC0+IE1hdGgucm91bmQodmFsdWUpXG4gICAgICAgICAgICB3aGVuIDIgdGhlbiByb3VuZEZ1bmMgPSAodmFsdWUpIC0+IE1hdGguY2VpbCh2YWx1ZSlcbiAgICAgICAgICAgIHdoZW4gMyB0aGVuIHJvdW5kRnVuYyA9ICh2YWx1ZSkgLT4gTWF0aC5mbG9vcih2YWx1ZSlcbiAgICAgICAgXG4gICAgICAgIHN3aXRjaCBwYXJhbXMuc291cmNlXG4gICAgICAgICAgICB3aGVuIDAgIyBDb25zdGFudCBWYWx1ZSAvIFZhcmlhYmxlIFZhbHVlXG4gICAgICAgICAgICAgICAgc291cmNlID0gQG51bWJlclZhbHVlT2YocGFyYW1zLnNvdXJjZVZhbHVlKVxuICAgICAgICAgICAgd2hlbiAxICMgUmFuZG9tXG4gICAgICAgICAgICAgICAgc3RhcnQgPSBAbnVtYmVyVmFsdWVPZihwYXJhbXMuc291cmNlUmFuZG9tLnN0YXJ0KVxuICAgICAgICAgICAgICAgIGVuZCA9IEBudW1iZXJWYWx1ZU9mKHBhcmFtcy5zb3VyY2VSYW5kb20uZW5kKVxuICAgICAgICAgICAgICAgIGRpZmYgPSBlbmQgLSBzdGFydFxuICAgICAgICAgICAgICAgIHNvdXJjZSA9IE1hdGguZmxvb3Ioc3RhcnQgKyBNYXRoLnJhbmRvbSgpICogKGRpZmYrMSkpXG4gICAgICAgICAgICB3aGVuIDIgIyBQb2ludGVyXG4gICAgICAgICAgICAgICAgc291cmNlID0gQG51bWJlclZhbHVlQXRJbmRleChwYXJhbXMuc291cmNlU2NvcGUsIEBudW1iZXJWYWx1ZU9mKHBhcmFtcy5zb3VyY2VSZWZlcmVuY2UpLTEsIHBhcmFtcy5zb3VyY2VSZWZlcmVuY2VEb21haW4pXG4gICAgICAgICAgICB3aGVuIDMgIyBHYW1lIERhdGFcbiAgICAgICAgICAgICAgICBzb3VyY2UgPSBAbnVtYmVyVmFsdWVPZkdhbWVEYXRhKHBhcmFtcy5zb3VyY2VWYWx1ZTEpXG4gICAgICAgICAgICB3aGVuIDQgIyBEYXRhYmFzZSBEYXRhXG4gICAgICAgICAgICAgICAgc291cmNlID0gQG51bWJlclZhbHVlT2ZEYXRhYmFzZURhdGEocGFyYW1zLnNvdXJjZVZhbHVlMSlcbiAgICAgICAgICAgIFxuICAgICAgICBzd2l0Y2ggcGFyYW1zLnRhcmdldFxuICAgICAgICAgICAgd2hlbiAwICMgVmFyaWFibGVcbiAgICAgICAgICAgICAgICBzd2l0Y2ggcGFyYW1zLm9wZXJhdGlvblxuICAgICAgICAgICAgICAgICAgICB3aGVuIDAgIyBTZXRcbiAgICAgICAgICAgICAgICAgICAgICAgIEBzZXROdW1iZXJWYWx1ZVRvKHBhcmFtcy50YXJnZXRWYXJpYWJsZSwgcm91bmRGdW5jKHNvdXJjZSkpXG4gICAgICAgICAgICAgICAgICAgIHdoZW4gMSAjIEFkZFxuICAgICAgICAgICAgICAgICAgICAgICAgQHNldE51bWJlclZhbHVlVG8ocGFyYW1zLnRhcmdldFZhcmlhYmxlLCByb3VuZEZ1bmMoQG51bWJlclZhbHVlT2YocGFyYW1zLnRhcmdldFZhcmlhYmxlKSArIHNvdXJjZSkgKVxuICAgICAgICAgICAgICAgICAgICB3aGVuIDIgIyBTdWJcbiAgICAgICAgICAgICAgICAgICAgICAgIEBzZXROdW1iZXJWYWx1ZVRvKHBhcmFtcy50YXJnZXRWYXJpYWJsZSwgcm91bmRGdW5jKEBudW1iZXJWYWx1ZU9mKHBhcmFtcy50YXJnZXRWYXJpYWJsZSkgLSBzb3VyY2UpIClcbiAgICAgICAgICAgICAgICAgICAgd2hlbiAzICMgTXVsXG4gICAgICAgICAgICAgICAgICAgICAgICBAc2V0TnVtYmVyVmFsdWVUbyhwYXJhbXMudGFyZ2V0VmFyaWFibGUsIHJvdW5kRnVuYyhAbnVtYmVyVmFsdWVPZihwYXJhbXMudGFyZ2V0VmFyaWFibGUpICogc291cmNlKSlcbiAgICAgICAgICAgICAgICAgICAgd2hlbiA0ICMgRGl2XG4gICAgICAgICAgICAgICAgICAgICAgICBAc2V0TnVtYmVyVmFsdWVUbyhwYXJhbXMudGFyZ2V0VmFyaWFibGUsIHJvdW5kRnVuYyhAbnVtYmVyVmFsdWVPZihwYXJhbXMudGFyZ2V0VmFyaWFibGUpIC8gc291cmNlKSlcbiAgICAgICAgICAgICAgICAgICAgd2hlbiA1ICMgTW9kXG4gICAgICAgICAgICAgICAgICAgICAgICBAc2V0TnVtYmVyVmFsdWVUbyhwYXJhbXMudGFyZ2V0VmFyaWFibGUsIEBudW1iZXJWYWx1ZU9mKHBhcmFtcy50YXJnZXRWYXJpYWJsZSkgJSBzb3VyY2UpXG4gICAgICAgICAgICB3aGVuIDEgIyBSYW5nZVxuICAgICAgICAgICAgICAgIHNjb3BlID0gcGFyYW1zLnRhcmdldFNjb3BlXG4gICAgICAgICAgICAgICAgc3RhcnQgPSBwYXJhbXMudGFyZ2V0UmFuZ2Uuc3RhcnQtMVxuICAgICAgICAgICAgICAgIGVuZCA9IHBhcmFtcy50YXJnZXRSYW5nZS5lbmQtMVxuICAgICAgICAgICAgICAgIGZvciBpIGluIFtzdGFydC4uZW5kXVxuICAgICAgICAgICAgICAgICAgICBzd2l0Y2ggcGFyYW1zLm9wZXJhdGlvblxuICAgICAgICAgICAgICAgICAgICAgICAgd2hlbiAwICMgU2V0XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgQHNldE51bWJlclZhbHVlQXRJbmRleChzY29wZSwgaSwgcm91bmRGdW5jKHNvdXJjZSkpXG4gICAgICAgICAgICAgICAgICAgICAgICB3aGVuIDEgIyBBZGRcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBAc2V0TnVtYmVyVmFsdWVBdEluZGV4KHNjb3BlLCBpLCByb3VuZEZ1bmMoQG51bWJlclZhbHVlQXRJbmRleChzY29wZSwgaSkgKyBzb3VyY2UpKVxuICAgICAgICAgICAgICAgICAgICAgICAgd2hlbiAyICMgU3ViXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgQHNldE51bWJlclZhbHVlQXRJbmRleChzY29wZSwgaSwgcm91bmRGdW5jKEBudW1iZXJWYWx1ZUF0SW5kZXgoc2NvcGUsIGkpIC0gc291cmNlKSlcbiAgICAgICAgICAgICAgICAgICAgICAgIHdoZW4gMyAjIE11bFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIEBzZXROdW1iZXJWYWx1ZUF0SW5kZXgoc2NvcGUsIGksIHJvdW5kRnVuYyhAbnVtYmVyVmFsdWVBdEluZGV4KHNjb3BlLCBpKSAqIHNvdXJjZSkpXG4gICAgICAgICAgICAgICAgICAgICAgICB3aGVuIDQgIyBEaXZcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBAc2V0TnVtYmVyVmFsdWVBdEluZGV4KHNjb3BlLCBpLCByb3VuZEZ1bmMoQG51bWJlclZhbHVlQXRJbmRleChzY29wZSwgaSkgLyBzb3VyY2UpKVxuICAgICAgICAgICAgICAgICAgICAgICAgd2hlbiA1ICMgTW9kXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgQHNldE51bWJlclZhbHVlQXRJbmRleChzY29wZSwgaSwgQG51bWJlclZhbHVlQXRJbmRleChzY29wZSwgaSkgJSBzb3VyY2UpXG4gICAgICAgICAgICB3aGVuIDIgIyBSZWZlcmVuY2VcbiAgICAgICAgICAgICAgICBpbmRleCA9IEBudW1iZXJWYWx1ZU9mKHBhcmFtcy50YXJnZXRSZWZlcmVuY2UpIC0gMVxuICAgICAgICAgICAgICAgIHN3aXRjaCBwYXJhbXMub3BlcmF0aW9uXG4gICAgICAgICAgICAgICAgICAgIHdoZW4gMCAjIFNldFxuICAgICAgICAgICAgICAgICAgICAgICAgQHNldE51bWJlclZhbHVlQXRJbmRleChwYXJhbXMudGFyZ2V0U2NvcGUsIGluZGV4LCByb3VuZEZ1bmMoc291cmNlKSwgcGFyYW1zLnRhcmdldFJlZmVyZW5jZURvbWFpbilcbiAgICAgICAgICAgICAgICAgICAgd2hlbiAxICMgQWRkXG4gICAgICAgICAgICAgICAgICAgICAgICBAc2V0TnVtYmVyVmFsdWVBdEluZGV4KHBhcmFtcy50YXJnZXRTY29wZSwgaW5kZXgsIHJvdW5kRnVuYyhAbnVtYmVyVmFsdWVBdEluZGV4KHBhcmFtcy50YXJnZXRTY29wZSwgaW5kZXgsIHBhcmFtcy50YXJnZXRSZWZlcmVuY2VEb21haW4pICsgc291cmNlKSwgcGFyYW1zLnRhcmdldFJlZmVyZW5jZURvbWFpbilcbiAgICAgICAgICAgICAgICAgICAgd2hlbiAyICMgU3ViXG4gICAgICAgICAgICAgICAgICAgICAgICBAc2V0TnVtYmVyVmFsdWVBdEluZGV4KHBhcmFtcy50YXJnZXRTY29wZSwgaW5kZXgsIHJvdW5kRnVuYyhAbnVtYmVyVmFsdWVBdEluZGV4KHBhcmFtcy50YXJnZXRTY29wZSwgaW5kZXgsIHBhcmFtcy50YXJnZXRSZWZlcmVuY2VEb21haW4pIC0gc291cmNlKSwgcGFyYW1zLnRhcmdldFJlZmVyZW5jZURvbWFpbilcbiAgICAgICAgICAgICAgICAgICAgd2hlbiAzICMgTXVsXG4gICAgICAgICAgICAgICAgICAgICAgICBAc2V0TnVtYmVyVmFsdWVBdEluZGV4KHBhcmFtcy50YXJnZXRTY29wZSwgaW5kZXgsIHJvdW5kRnVuYyhAbnVtYmVyVmFsdWVBdEluZGV4KHBhcmFtcy50YXJnZXRTY29wZSwgaW5kZXgsIHBhcmFtcy50YXJnZXRSZWZlcmVuY2VEb21haW4pICogc291cmNlKSwgcGFyYW1zLnRhcmdldFJlZmVyZW5jZURvbWFpbilcbiAgICAgICAgICAgICAgICAgICAgd2hlbiA0ICMgRGl2XG4gICAgICAgICAgICAgICAgICAgICAgICBAc2V0TnVtYmVyVmFsdWVBdEluZGV4KHBhcmFtcy50YXJnZXRTY29wZSwgaW5kZXgsIHJvdW5kRnVuYyhAbnVtYmVyVmFsdWVBdEluZGV4KHBhcmFtcy50YXJnZXRTY29wZSwgaW5kZXgsIHBhcmFtcy50YXJnZXRSZWZlcmVuY2VEb21haW4pIC8gc291cmNlKSwgcGFyYW1zLnRhcmdldFJlZmVyZW5jZURvbWFpbilcbiAgICAgICAgICAgICAgICAgICAgd2hlbiA1ICMgTW9kXG4gICAgICAgICAgICAgICAgICAgICAgICBAc2V0TnVtYmVyVmFsdWVBdEluZGV4KHBhcmFtcy50YXJnZXRTY29wZSwgaW5kZXgsIEBudW1iZXJWYWx1ZUF0SW5kZXgocGFyYW1zLnRhcmdldFNjb3BlLCBpbmRleCwgcGFyYW1zLnRhcmdldFJlZmVyZW5jZURvbWFpbikgJSBzb3VyY2UsIHBhcmFtcy50YXJnZXRSZWZlcmVuY2VEb21haW4pXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgXG4gICAgICAgIHJldHVybiBudWxsXG4gICAgIFxuICAgICMjIypcbiAgICAqIFNoYWtlcyBhIGdhbWUgb2JqZWN0LlxuICAgICpcbiAgICAqIEBtZXRob2Qgc2hha2VPYmplY3RcbiAgICAqIEBwYXJhbSB7Z3MuT2JqZWN0X0Jhc2V9IG9iamVjdCAtIFRoZSBnYW1lIG9iamVjdCB0byBzaGFrZS5cbiAgICAqIEByZXR1cm4ge09iamVjdH0gQSBwYXJhbXMgb2JqZWN0IGNvbnRhaW5pbmcgYWRkaXRpb25hbCBpbmZvIGFib3V0IHRoZSBzaGFrZS1hbmltYXRpb24uXG4gICAgIyMjICAgICAgICBcbiAgICBzaGFrZU9iamVjdDogKG9iamVjdCwgcGFyYW1zKSAtPlxuICAgICAgICBkdXJhdGlvbiA9IE1hdGgubWF4KE1hdGgucm91bmQoQGR1cmF0aW9uVmFsdWVPZihwYXJhbXMuZHVyYXRpb24pKSwgMilcbiAgICAgICAgZWFzaW5nID0gZ3MuRWFzaW5ncy5mcm9tT2JqZWN0KHBhcmFtcy5lYXNpbmcpXG4gICAgICAgIFxuICAgICAgICBvYmplY3QuYW5pbWF0b3Iuc2hha2UoeyB4OiBAbnVtYmVyVmFsdWVPZihwYXJhbXMucmFuZ2UueCksIHk6IEBudW1iZXJWYWx1ZU9mKHBhcmFtcy5yYW5nZS55KSB9LCBAbnVtYmVyVmFsdWVPZihwYXJhbXMuc3BlZWQpIC8gMTAwLCBkdXJhdGlvbiwgZWFzaW5nKVxuICAgICAgICBcbiAgICAgICAgaWYgcGFyYW1zLndhaXRGb3JDb21wbGV0aW9uIGFuZCBub3QgKGR1cmF0aW9uID09IDAgb3IgQGlzSW5zdGFudFNraXAoKSlcbiAgICAgICAgICAgIEBpc1dhaXRpbmcgPSB5ZXNcbiAgICAgICAgICAgIEB3YWl0Q291bnRlciA9IGR1cmF0aW9uXG4gICAgXG4gICAgIyMjKlxuICAgICogTGV0cyB0aGUgaW50ZXJwcmV0ZXIgd2FpdCBmb3IgdGhlIGNvbXBsZXRpb24gb2YgYSBydW5uaW5nIG9wZXJhdGlvbiBsaWtlIGFuIGFuaW1hdGlvbiwgZXRjLlxuICAgICpcbiAgICAqIEBtZXRob2Qgd2FpdEZvckNvbXBsZXRpb25cbiAgICAqIEBwYXJhbSB7Z3MuT2JqZWN0X0Jhc2V9IG9iamVjdCAtIFRoZSBnYW1lIG9iamVjdCB0aGUgb3BlcmF0aW9uIGlzIGV4ZWN1dGVkIG9uLiBDYW4gYmUgPGI+bnVsbDwvYj4uXG4gICAgKiBAcmV0dXJuIHtPYmplY3R9IEEgcGFyYW1zIG9iamVjdCBjb250YWluaW5nIGFkZGl0aW9uYWwgaW5mby5cbiAgICAjIyMgIFxuICAgIHdhaXRGb3JDb21wbGV0aW9uOiAob2JqZWN0LCBwYXJhbXMpIC0+XG4gICAgICAgIGR1cmF0aW9uID0gQGR1cmF0aW9uVmFsdWVPZihwYXJhbXMuZHVyYXRpb24pXG4gICAgICAgIGlmIHBhcmFtcy53YWl0Rm9yQ29tcGxldGlvbiBhbmQgbm90IChkdXJhdGlvbiA9PSAwIG9yIEBpc0luc3RhbnRTa2lwKCkpXG4gICAgICAgICAgICBAaXNXYWl0aW5nID0geWVzXG4gICAgICAgICAgICBAd2FpdENvdW50ZXIgPSBkdXJhdGlvblxuICAgIFxuICAgICMjIypcbiAgICAqIEVyYXNlcyBhIGdhbWUgb2JqZWN0LlxuICAgICpcbiAgICAqIEBtZXRob2QgZXJhc2VPYmplY3RcbiAgICAqIEBwYXJhbSB7Z3MuT2JqZWN0X0Jhc2V9IG9iamVjdCAtIFRoZSBnYW1lIG9iamVjdCB0byBlcmFzZS5cbiAgICAqIEByZXR1cm4ge09iamVjdH0gQSBwYXJhbXMgb2JqZWN0IGNvbnRhaW5pbmcgYWRkaXRpb25hbCBpbmZvLlxuICAgICMjIyAgICAgIFxuICAgIGVyYXNlT2JqZWN0OiAob2JqZWN0LCBwYXJhbXMsIGNhbGxiYWNrKSAtPlxuICAgICAgICBlYXNpbmcgPSBncy5FYXNpbmdzLmZyb21PYmplY3QocGFyYW1zLmVhc2luZylcbiAgICAgICAgZHVyYXRpb24gPSBAZHVyYXRpb25WYWx1ZU9mKHBhcmFtcy5kdXJhdGlvbilcbiAgICAgICAgb2JqZWN0LmFuaW1hdG9yLmRpc2FwcGVhcihwYXJhbXMuYW5pbWF0aW9uLCBlYXNpbmcsIGR1cmF0aW9uLCAoc2VuZGVyKSA9PiBcbiAgICAgICAgICAgIHNlbmRlci5kaXNwb3NlKClcbiAgICAgICAgICAgIGNhbGxiYWNrPyhzZW5kZXIpXG4gICAgICAgIClcbiAgICAgICAgXG4gICAgICAgIGlmIHBhcmFtcy53YWl0Rm9yQ29tcGxldGlvbiBhbmQgbm90IChkdXJhdGlvbiA9PSAwIG9yIEBpc0luc3RhbnRTa2lwKCkpXG4gICAgICAgICAgICBAaXNXYWl0aW5nID0geWVzXG4gICAgICAgICAgICBAd2FpdENvdW50ZXIgPSBkdXJhdGlvbiBcbiAgICBcbiAgICAjIyMqXG4gICAgKiBTaG93cyBhIGdhbWUgb2JqZWN0IG9uIHNjcmVlbi5cbiAgICAqXG4gICAgKiBAbWV0aG9kIHNob3dPYmplY3RcbiAgICAqIEBwYXJhbSB7Z3MuT2JqZWN0X0Jhc2V9IG9iamVjdCAtIFRoZSBnYW1lIG9iamVjdCB0byBzaG93LlxuICAgICogQHBhcmFtIHtncy5Qb2ludH0gcG9zaXRpb24gLSBUaGUgcG9zaXRpb24gd2hlcmUgdGhlIGdhbWUgb2JqZWN0IHNob3VsZCBiZSBzaG93bi5cbiAgICAqIEBwYXJhbSB7T2JqZWN0fSBBIHBhcmFtcyBvYmplY3QgY29udGFpbmluZyBhZGRpdGlvbmFsIGluZm8uXG4gICAgIyMjICAgICAgICAgIFxuICAgIHNob3dPYmplY3Q6IChvYmplY3QsIHBvc2l0aW9uLCBwYXJhbXMpIC0+XG4gICAgICAgIHggPSBAbnVtYmVyVmFsdWVPZihwb3NpdGlvbi54KVxuICAgICAgICB5ID0gQG51bWJlclZhbHVlT2YocG9zaXRpb24ueSlcbiAgICAgICAgZWFzaW5nID0gZ3MuRWFzaW5ncy5mcm9tT2JqZWN0KHBhcmFtcy5lYXNpbmcpXG4gICAgICAgIGR1cmF0aW9uID0gQGR1cmF0aW9uVmFsdWVPZihwYXJhbXMuZHVyYXRpb24pXG4gICAgICBcbiAgICAgICAgb2JqZWN0LmFuaW1hdG9yLmFwcGVhcih4LCB5LCBwYXJhbXMuYW5pbWF0aW9uLCBlYXNpbmcsIGR1cmF0aW9uKVxuICAgICAgICBcbiAgICAgICAgaWYgcGFyYW1zLndhaXRGb3JDb21wbGV0aW9uIGFuZCBub3QgKGR1cmF0aW9uID09IDAgb3IgQGlzSW5zdGFudFNraXAoKSlcbiAgICAgICAgICAgIEBpc1dhaXRpbmcgPSB5ZXNcbiAgICAgICAgICAgIEB3YWl0Q291bnRlciA9IGR1cmF0aW9uXG4gICAgIFxuICAgICAgICAgICBcbiAgICAjIyMqXG4gICAgKiBNb3ZlcyBhIGdhbWUgb2JqZWN0LlxuICAgICpcbiAgICAqIEBtZXRob2QgbW92ZU9iamVjdFxuICAgICogQHBhcmFtIHtncy5PYmplY3RfQmFzZX0gb2JqZWN0IC0gVGhlIGdhbWUgb2JqZWN0IHRvIG1vdmUuXG4gICAgKiBAcGFyYW0ge2dzLlBvaW50fSBwb3NpdGlvbiAtIFRoZSBwb3NpdGlvbiB0byBtb3ZlIHRoZSBnYW1lIG9iamVjdCB0by5cbiAgICAqIEBwYXJhbSB7T2JqZWN0fSBBIHBhcmFtcyBvYmplY3QgY29udGFpbmluZyBhZGRpdGlvbmFsIGluZm8uXG4gICAgIyMjIFxuICAgIG1vdmVPYmplY3Q6IChvYmplY3QsIHBvc2l0aW9uLCBwYXJhbXMpIC0+XG4gICAgICAgIGlmIHBhcmFtcy5wb3NpdGlvblR5cGUgPT0gMFxuICAgICAgICAgICAgcCA9IEBwcmVkZWZpbmVkT2JqZWN0UG9zaXRpb24ocGFyYW1zLnByZWRlZmluZWRQb3NpdGlvbklkLCBvYmplY3QsIHBhcmFtcylcbiAgICAgICAgICAgIHggPSBwLnhcbiAgICAgICAgICAgIHkgPSBwLnlcbiAgICAgICAgZWxzZVxuICAgICAgICAgICAgeCA9IEBudW1iZXJWYWx1ZU9mKHBvc2l0aW9uLngpXG4gICAgICAgICAgICB5ID0gQG51bWJlclZhbHVlT2YocG9zaXRpb24ueSlcbiAgICBcbiAgICAgICAgZWFzaW5nID0gZ3MuRWFzaW5ncy5mcm9tT2JqZWN0KHBhcmFtcy5lYXNpbmcpXG4gICAgICAgIGR1cmF0aW9uID0gQGR1cmF0aW9uVmFsdWVPZihwYXJhbXMuZHVyYXRpb24pXG4gICAgICAgIFxuICAgICAgICBvYmplY3QuYW5pbWF0b3IubW92ZVRvKHgsIHksIGR1cmF0aW9uLCBlYXNpbmcpXG4gICAgXG4gICAgICAgIGlmIHBhcmFtcy53YWl0Rm9yQ29tcGxldGlvbiBhbmQgbm90IChkdXJhdGlvbiA9PSAwIG9yIEBpc0luc3RhbnRTa2lwKCkpXG4gICAgICAgICAgICBAaXNXYWl0aW5nID0geWVzXG4gICAgICAgICAgICBAd2FpdENvdW50ZXIgPSBkdXJhdGlvblxuICAgICAgICAgICAgXG4gICAgIyMjKlxuICAgICogTW92ZXMgYSBnYW1lIG9iamVjdCBhbG9uZyBhIHBhdGguXG4gICAgKlxuICAgICogQG1ldGhvZCBtb3ZlT2JqZWN0UGF0aFxuICAgICogQHBhcmFtIHtncy5PYmplY3RfQmFzZX0gb2JqZWN0IC0gVGhlIGdhbWUgb2JqZWN0IHRvIG1vdmUuXG4gICAgKiBAcGFyYW0ge09iamVjdH0gcGF0aCAtIFRoZSBwYXRoIHRvIG1vdmUgdGhlIGdhbWUgb2JqZWN0IGFsb25nLlxuICAgICogQHBhcmFtIHtPYmplY3R9IEEgcGFyYW1zIG9iamVjdCBjb250YWluaW5nIGFkZGl0aW9uYWwgaW5mby5cbiAgICAjIyMgXG4gICAgbW92ZU9iamVjdFBhdGg6IChvYmplY3QsIHBhdGgsIHBhcmFtcykgLT5cbiAgICAgICAgZWFzaW5nID0gZ3MuRWFzaW5ncy5mcm9tT2JqZWN0KHBhcmFtcy5lYXNpbmcpXG4gICAgICAgIGR1cmF0aW9uID0gQGR1cmF0aW9uVmFsdWVPZihwYXJhbXMuZHVyYXRpb24pXG4gICAgICAgIG9iamVjdC5hbmltYXRvci5tb3ZlUGF0aChwYXRoLmRhdGEsIHBhcmFtcy5sb29wVHlwZSwgZHVyYXRpb24sIGVhc2luZywgcGF0aC5lZmZlY3RzPy5kYXRhKVxuICAgIFxuICAgICAgICBpZiBwYXJhbXMud2FpdEZvckNvbXBsZXRpb24gYW5kIG5vdCAoZHVyYXRpb24gPT0gMCBvciBAaXNJbnN0YW50U2tpcCgpKVxuICAgICAgICAgICAgQGlzV2FpdGluZyA9IHllc1xuICAgICAgICAgICAgQHdhaXRDb3VudGVyID0gZHVyYXRpb25cbiAgICBcbiAgICAjIyMqXG4gICAgKiBTY3JvbGxzIGEgc2Nyb2xsYWJsZSBnYW1lIG9iamVjdCBhbG9uZyBhIHBhdGguXG4gICAgKlxuICAgICogQG1ldGhvZCBzY3JvbGxPYmplY3RQYXRoXG4gICAgKiBAcGFyYW0ge2dzLk9iamVjdF9CYXNlfSBvYmplY3QgLSBUaGUgZ2FtZSBvYmplY3QgdG8gc2Nyb2xsLlxuICAgICogQHBhcmFtIHtPYmplY3R9IHBhdGggLSBUaGUgcGF0aCB0byBzY3JvbGwgdGhlIGdhbWUgb2JqZWN0IGFsb25nLlxuICAgICogQHBhcmFtIHtPYmplY3R9IEEgcGFyYW1zIG9iamVjdCBjb250YWluaW5nIGFkZGl0aW9uYWwgaW5mby5cbiAgICAjIyMgICAgICAgIFxuICAgIHNjcm9sbE9iamVjdFBhdGg6IChvYmplY3QsIHBhdGgsIHBhcmFtcykgLT5cbiAgICAgICAgZWFzaW5nID0gZ3MuRWFzaW5ncy5mcm9tT2JqZWN0KHBhcmFtcy5lYXNpbmcpXG4gICAgICAgIGR1cmF0aW9uID0gQGR1cmF0aW9uVmFsdWVPZihwYXJhbXMuZHVyYXRpb24pXG4gICAgICAgIG9iamVjdC5hbmltYXRvci5zY3JvbGxQYXRoKHBhdGgsIHBhcmFtcy5sb29wVHlwZSwgZHVyYXRpb24sIGVhc2luZylcbiAgICBcbiAgICAgICAgaWYgcGFyYW1zLndhaXRGb3JDb21wbGV0aW9uIGFuZCBub3QgKGR1cmF0aW9uID09IDAgb3IgQGlzSW5zdGFudFNraXAoKSlcbiAgICAgICAgICAgIEBpc1dhaXRpbmcgPSB5ZXNcbiAgICAgICAgICAgIEB3YWl0Q291bnRlciA9IGR1cmF0aW9uXG4gICAgICAgICAgICBcbiAgICAjIyMqXG4gICAgKiBab29tcy9TY2FsZXMgYSBnYW1lIG9iamVjdC5cbiAgICAqXG4gICAgKiBAbWV0aG9kIHpvb21PYmplY3RcbiAgICAqIEBwYXJhbSB7Z3MuT2JqZWN0X0Jhc2V9IG9iamVjdCAtIFRoZSBnYW1lIG9iamVjdCB0byB6b29tLlxuICAgICogQHBhcmFtIHtPYmplY3R9IEEgcGFyYW1zIG9iamVjdCBjb250YWluaW5nIGFkZGl0aW9uYWwgaW5mby5cbiAgICAjIyMgXG4gICAgem9vbU9iamVjdDogKG9iamVjdCwgcGFyYW1zKSAtPlxuICAgICAgICBlYXNpbmcgPSBncy5FYXNpbmdzLmZyb21PYmplY3QocGFyYW1zLmVhc2luZylcbiAgICAgICAgZHVyYXRpb24gPSBAZHVyYXRpb25WYWx1ZU9mKHBhcmFtcy5kdXJhdGlvbilcbiAgICAgICAgb2JqZWN0LmFuaW1hdG9yLnpvb21UbyhAbnVtYmVyVmFsdWVPZihwYXJhbXMuem9vbWluZy54KSAvIDEwMCwgQG51bWJlclZhbHVlT2YocGFyYW1zLnpvb21pbmcueSkgLyAxMDAsIGR1cmF0aW9uLCBlYXNpbmcpXG4gICAgICAgIFxuICAgICAgICBpZiBwYXJhbXMud2FpdEZvckNvbXBsZXRpb24gYW5kIG5vdCAoZHVyYXRpb24gPT0gMCBvciBAaXNJbnN0YW50U2tpcCgpKVxuICAgICAgICAgICAgQGlzV2FpdGluZyA9IHllc1xuICAgICAgICAgICAgQHdhaXRDb3VudGVyID0gZHVyYXRpb25cbiAgICAgICAgICAgIFxuICAgICMjIypcbiAgICAqIFJvdGF0ZXMgYSBnYW1lIG9iamVjdC5cbiAgICAqXG4gICAgKiBAbWV0aG9kIHJvdGF0ZU9iamVjdFxuICAgICogQHBhcmFtIHtncy5PYmplY3RfQmFzZX0gb2JqZWN0IC0gVGhlIGdhbWUgb2JqZWN0IHRvIHJvdGF0ZS5cbiAgICAqIEBwYXJhbSB7T2JqZWN0fSBBIHBhcmFtcyBvYmplY3QgY29udGFpbmluZyBhZGRpdGlvbmFsIGluZm8uXG4gICAgIyMjIFxuICAgIHJvdGF0ZU9iamVjdDogKG9iamVjdCwgcGFyYW1zKSAtPlxuICAgICAgICBlYXNpbmcgPSBncy5FYXNpbmdzLmZyb21PYmplY3QocGFyYW1zLmVhc2luZylcbiAgICAgICAgZHVyYXRpb24gPSBAZHVyYXRpb25WYWx1ZU9mKHBhcmFtcy5kdXJhdGlvbilcbiAgICAgICAgXG4gICAgICAgIFxuICAgICAgICBlYXNpbmcgPSBncy5FYXNpbmdzLmZyb21PYmplY3QocGFyYW1zLmVhc2luZylcbiAgICAgICAgXG4gICAgICAgICNpZiBHYW1lTWFuYWdlci50ZW1wU2V0dGluZ3Muc2tpcFxuICAgICAgICAjICAgIGFjdHVhbER1cmF0aW9uID0gQGR1cmF0aW9uVmFsdWVPZihAcGFyYW1zLmR1cmF0aW9uKVxuICAgICAgICAjICAgIGR1cmF0aW9uID0gQGR1cmF0aW9uVmFsdWVPZihAZHVyYXRpb24pXG4gICAgICAgICMgICAgc3BlZWQgPSBAbnVtYmVyVmFsdWVPZihAcGFyYW1zLnNwZWVkKSAvIDEwMFxuICAgICAgICAjICAgIHNwZWVkID0gTWF0aC5yb3VuZChkdXJhdGlvbiAvIChhY3R1YWxEdXJhdGlvbnx8MSkgKiBzcGVlZClcbiAgICAgICAgIyAgICBwaWN0dXJlLmFuaW1hdG9yLnJvdGF0ZShAcGFyYW1zLmRpcmVjdGlvbiwgc3BlZWQsIGFjdHVhbER1cmF0aW9ufHwxLCBlYXNpbmcpXG4gICAgICAgICMgICAgZHVyYXRpb24gPSBhY3R1YWxEdXJhdGlvblxuICAgICAgICAjZWxzZVxuICAgICAgICAjICAgIGR1cmF0aW9uID0gQGR1cmF0aW9uVmFsdWVPZihwYXJhbXMuZHVyYXRpb24pXG4gICAgICAgICMgICAgb2JqZWN0LmFuaW1hdG9yLnJvdGF0ZShwYXJhbXMuZGlyZWN0aW9uLCBAbnVtYmVyVmFsdWVPZihAcGFyYW1zLnNwZWVkKSAvIDEwMCwgZHVyYXRpb24sIGVhc2luZylcbiAgICAgICAgXG4gICAgICAgIG9iamVjdC5hbmltYXRvci5yb3RhdGUocGFyYW1zLmRpcmVjdGlvbiwgQG51bWJlclZhbHVlT2YocGFyYW1zLnNwZWVkKSAvIDEwMCwgZHVyYXRpb24sIGVhc2luZylcbiAgICAgICAgXG4gICAgICAgIGlmIHBhcmFtcy53YWl0Rm9yQ29tcGxldGlvbiBhbmQgbm90IChkdXJhdGlvbiA9PSAwIG9yIEBpc0luc3RhbnRTa2lwKCkpXG4gICAgICAgICAgICBAaXNXYWl0aW5nID0geWVzXG4gICAgICAgICAgICBAd2FpdENvdW50ZXIgPSBkdXJhdGlvblxuICAgIFxuICAgICMjIypcbiAgICAqIEJsZW5kcyBhIGdhbWUgb2JqZWN0LlxuICAgICpcbiAgICAqIEBtZXRob2QgYmxlbmRPYmplY3RcbiAgICAqIEBwYXJhbSB7Z3MuT2JqZWN0X0Jhc2V9IG9iamVjdCAtIFRoZSBnYW1lIG9iamVjdCB0byBibGVuZC5cbiAgICAqIEBwYXJhbSB7T2JqZWN0fSBBIHBhcmFtcyBvYmplY3QgY29udGFpbmluZyBhZGRpdGlvbmFsIGluZm8uXG4gICAgIyMjXG4gICAgYmxlbmRPYmplY3Q6IChvYmplY3QsIHBhcmFtcykgLT5cbiAgICAgICAgZWFzaW5nID0gZ3MuRWFzaW5ncy5mcm9tT2JqZWN0KHBhcmFtcy5lYXNpbmcpXG4gICAgICAgIGR1cmF0aW9uID0gQGR1cmF0aW9uVmFsdWVPZihwYXJhbXMuZHVyYXRpb24pXG4gICAgICAgIG9iamVjdC5hbmltYXRvci5ibGVuZFRvKEBudW1iZXJWYWx1ZU9mKHBhcmFtcy5vcGFjaXR5KSwgZHVyYXRpb24sIGVhc2luZylcbiAgICAgICAgXG4gICAgICAgIGlmIHBhcmFtcy53YWl0Rm9yQ29tcGxldGlvbiBhbmQgbm90IChkdXJhdGlvbiA9PSAwIG9yIEBpc0luc3RhbnRTa2lwKCkpXG4gICAgICAgICAgICBAaXNXYWl0aW5nID0geWVzXG4gICAgICAgICAgICBAd2FpdENvdW50ZXIgPSBkdXJhdGlvblxuICAgICAgICAgICAgXG4gICAgIyMjKlxuICAgICogRXhlY3V0ZXMgYSBtYXNraW5nLWVmZmVjdCBvbiBhIGdhbWUgb2JqZWN0Li5cbiAgICAqXG4gICAgKiBAbWV0aG9kIG1hc2tPYmplY3RcbiAgICAqIEBwYXJhbSB7Z3MuT2JqZWN0X0Jhc2V9IG9iamVjdCAtIFRoZSBnYW1lIG9iamVjdCB0byBleGVjdXRlIGEgbWFza2luZy1lZmZlY3Qgb24uXG4gICAgKiBAcGFyYW0ge09iamVjdH0gQSBwYXJhbXMgb2JqZWN0IGNvbnRhaW5pbmcgYWRkaXRpb25hbCBpbmZvLlxuICAgICMjIyBcbiAgICBtYXNrT2JqZWN0OiAob2JqZWN0LCBwYXJhbXMpIC0+XG4gICAgICAgIGVhc2luZyA9IGdzLkVhc2luZ3MuZnJvbU9iamVjdChwYXJhbXMuZWFzaW5nKVxuICAgICAgXG4gICAgICAgIGlmIHBhcmFtcy5tYXNrLnR5cGUgPT0gMFxuICAgICAgICAgICAgb2JqZWN0Lm1hc2sudHlwZSA9IDBcbiAgICAgICAgICAgIG9iamVjdC5tYXNrLm94ID0gQG51bWJlclZhbHVlT2YocGFyYW1zLm1hc2sub3gpXG4gICAgICAgICAgICBvYmplY3QubWFzay5veSA9IEBudW1iZXJWYWx1ZU9mKHBhcmFtcy5tYXNrLm95KVxuICAgICAgICAgICAgaWYgb2JqZWN0Lm1hc2suc291cmNlPy52aWRlb0VsZW1lbnQ/XG4gICAgICAgICAgICAgICAgb2JqZWN0Lm1hc2suc291cmNlLnBhdXNlKClcbiAgICAgICAgICAgICAgICBcbiAgICAgICAgICAgIGlmIHBhcmFtcy5tYXNrLnNvdXJjZVR5cGUgPT0gMFxuICAgICAgICAgICAgICAgIG9iamVjdC5tYXNrLnNvdXJjZSA9IFJlc291cmNlTWFuYWdlci5nZXRCaXRtYXAoXCJHcmFwaGljcy9NYXNrcy8je3BhcmFtcy5tYXNrLmdyYXBoaWM/Lm5hbWV9XCIpXG4gICAgICAgICAgICBlbHNlXG4gICAgICAgICAgICAgICAgb2JqZWN0Lm1hc2suc291cmNlID0gUmVzb3VyY2VNYW5hZ2VyLmdldFZpZGVvKFwiTW92aWVzLyN7cGFyYW1zLm1hc2sudmlkZW8/Lm5hbWV9XCIpXG4gICAgICAgICAgICAgICAgaWYgb2JqZWN0Lm1hc2suc291cmNlXG4gICAgICAgICAgICAgICAgICAgIG9iamVjdC5tYXNrLnNvdXJjZS5wbGF5KClcbiAgICAgICAgICAgICAgICAgICAgb2JqZWN0Lm1hc2suc291cmNlLmxvb3AgPSB5ZXNcbiAgICAgICAgZWxzZVxuICAgICAgICAgICAgZHVyYXRpb24gPSBAZHVyYXRpb25WYWx1ZU9mKHBhcmFtcy5kdXJhdGlvbilcbiAgICAgICAgICAgIG9iamVjdC5hbmltYXRvci5tYXNrVG8ocGFyYW1zLm1hc2ssIGR1cmF0aW9uLCBlYXNpbmcpXG4gICAgICAgIFxuICAgICAgICBpZiBwYXJhbXMud2FpdEZvckNvbXBsZXRpb24gYW5kIG5vdCAoZHVyYXRpb24gPT0gMCBvciBAaXNJbnN0YW50U2tpcCgpKVxuICAgICAgICAgICAgQGlzV2FpdGluZyA9IHllc1xuICAgICAgICAgICAgQHdhaXRDb3VudGVyID0gZHVyYXRpb25cbiAgICAgIFxuICAgICMjIypcbiAgICAqIFRpbnRzIGEgZ2FtZSBvYmplY3QuXG4gICAgKlxuICAgICogQG1ldGhvZCB0aW50T2JqZWN0XG4gICAgKiBAcGFyYW0ge2dzLk9iamVjdF9CYXNlfSBvYmplY3QgLSBUaGUgZ2FtZSBvYmplY3QgdG8gdGludC5cbiAgICAqIEBwYXJhbSB7T2JqZWN0fSBBIHBhcmFtcyBvYmplY3QgY29udGFpbmluZyBhZGRpdGlvbmFsIGluZm8uXG4gICAgIyMjICAgICAgIFxuICAgIHRpbnRPYmplY3Q6IChvYmplY3QsIHBhcmFtcykgLT5cbiAgICAgICAgZHVyYXRpb24gPSBAZHVyYXRpb25WYWx1ZU9mKHBhcmFtcy5kdXJhdGlvbilcbiAgICAgICAgZWFzaW5nID0gZ3MuRWFzaW5ncy5mcm9tT2JqZWN0KHBhcmFtcy5lYXNpbmcpXG4gICAgICAgIG9iamVjdC5hbmltYXRvci50aW50VG8ocGFyYW1zLnRvbmUsIGR1cmF0aW9uLCBlYXNpbmcpXG4gICAgICAgIFxuICAgICAgICBpZiBwYXJhbXMud2FpdEZvckNvbXBsZXRpb24gYW5kIG5vdCAoZHVyYXRpb24gPT0gMCBvciBAaXNJbnN0YW50U2tpcCgpKVxuICAgICAgICAgICAgQGlzV2FpdGluZyA9IHllc1xuICAgICAgICAgICAgQHdhaXRDb3VudGVyID0gZHVyYXRpb25cbiAgICAgXG4gICAgIyMjKlxuICAgICogRmxhc2hlcyBhIGdhbWUgb2JqZWN0LlxuICAgICpcbiAgICAqIEBtZXRob2QgZmxhc2hPYmplY3RcbiAgICAqIEBwYXJhbSB7Z3MuT2JqZWN0X0Jhc2V9IG9iamVjdCAtIFRoZSBnYW1lIG9iamVjdCB0byBmbGFzaC5cbiAgICAqIEBwYXJhbSB7T2JqZWN0fSBBIHBhcmFtcyBvYmplY3QgY29udGFpbmluZyBhZGRpdGlvbmFsIGluZm8uXG4gICAgIyMjIFxuICAgIGZsYXNoT2JqZWN0OiAob2JqZWN0LCBwYXJhbXMpIC0+XG4gICAgICAgIGR1cmF0aW9uID0gQGR1cmF0aW9uVmFsdWVPZihwYXJhbXMuZHVyYXRpb24pXG4gICAgICAgIG9iamVjdC5hbmltYXRvci5mbGFzaChuZXcgQ29sb3IocGFyYW1zLmNvbG9yKSwgZHVyYXRpb24pXG4gICAgICAgIFxuICAgICAgICBpZiBwYXJhbXMud2FpdEZvckNvbXBsZXRpb24gYW5kIG5vdCAoZHVyYXRpb24gPT0gMCBvciBAaXNJbnN0YW50U2tpcCgpKVxuICAgICAgICAgICAgQGlzV2FpdGluZyA9IHllc1xuICAgICAgICAgICAgQHdhaXRDb3VudGVyID0gZHVyYXRpb25cbiAgICBcbiAgICAjIyMqXG4gICAgKiBDcm9wZXMgYSBnYW1lIG9iamVjdC5cbiAgICAqXG4gICAgKiBAbWV0aG9kIGNyb3BPYmplY3RcbiAgICAqIEBwYXJhbSB7Z3MuT2JqZWN0X0Jhc2V9IG9iamVjdCAtIFRoZSBnYW1lIG9iamVjdCB0byBjcm9wLlxuICAgICogQHBhcmFtIHtPYmplY3R9IEEgcGFyYW1zIG9iamVjdCBjb250YWluaW5nIGFkZGl0aW9uYWwgaW5mby5cbiAgICAjIyMgICAgICAgICBcbiAgICBjcm9wT2JqZWN0OiAob2JqZWN0LCBwYXJhbXMpIC0+XG4gICAgICAgIG9iamVjdC5zcmNSZWN0LnggPSBAbnVtYmVyVmFsdWVPZihwYXJhbXMueClcbiAgICAgICAgb2JqZWN0LnNyY1JlY3QueSA9IEBudW1iZXJWYWx1ZU9mKHBhcmFtcy55KVxuICAgICAgICBvYmplY3Quc3JjUmVjdC53aWR0aCA9IEBudW1iZXJWYWx1ZU9mKHBhcmFtcy53aWR0aClcbiAgICAgICAgb2JqZWN0LnNyY1JlY3QuaGVpZ2h0ID0gQG51bWJlclZhbHVlT2YocGFyYW1zLmhlaWdodClcbiAgICAgICAgXG4gICAgICAgIG9iamVjdC5kc3RSZWN0LndpZHRoID0gQG51bWJlclZhbHVlT2YocGFyYW1zLndpZHRoKVxuICAgICAgICBvYmplY3QuZHN0UmVjdC5oZWlnaHQgPSBAbnVtYmVyVmFsdWVPZihwYXJhbXMuaGVpZ2h0KVxuICAgIFxuICAgICMjIypcbiAgICAqIFNldHMgdGhlIG1vdGlvbiBibHVyIHNldHRpbmdzIG9mIGEgZ2FtZSBvYmplY3QuXG4gICAgKlxuICAgICogQG1ldGhvZCBvYmplY3RNb3Rpb25CbHVyXG4gICAgKiBAcGFyYW0ge2dzLk9iamVjdF9CYXNlfSBvYmplY3QgLSBUaGUgZ2FtZSBvYmplY3QgdG8gc2V0IHRoZSBtb3Rpb24gYmx1ciBzZXR0aW5ncyBmb3IuXG4gICAgKiBAcGFyYW0ge09iamVjdH0gQSBwYXJhbXMgb2JqZWN0IGNvbnRhaW5pbmcgYWRkaXRpb25hbCBpbmZvLlxuICAgICMjI1xuICAgIG9iamVjdE1vdGlvbkJsdXI6IChvYmplY3QsIHBhcmFtcykgLT5cbiAgICAgICAgb2JqZWN0Lm1vdGlvbkJsdXIuc2V0KHBhcmFtcy5tb3Rpb25CbHVyKVxuICAgICAgICBcbiAgICAjIyMqXG4gICAgKiBFbmFibGVzIGFuIGVmZmVjdCBvbiBhIGdhbWUgb2JqZWN0LlxuICAgICpcbiAgICAqIEBtZXRob2Qgb2JqZWN0RWZmZWN0XG4gICAgKiBAcGFyYW0ge2dzLk9iamVjdF9CYXNlfSBvYmplY3QgLSBUaGUgZ2FtZSBvYmplY3QgdG8gZXhlY3V0ZSBhIG1hc2tpbmctZWZmZWN0IG9uLlxuICAgICogQHBhcmFtIHtPYmplY3R9IEEgcGFyYW1zIG9iamVjdCBjb250YWluaW5nIGFkZGl0aW9uYWwgaW5mby5cbiAgICAjIyMgXG4gICAgb2JqZWN0RWZmZWN0OiAob2JqZWN0LCBwYXJhbXMpIC0+XG4gICAgICAgIGR1cmF0aW9uID0gQGR1cmF0aW9uVmFsdWVPZihwYXJhbXMuZHVyYXRpb24pXG4gICAgICAgIGVhc2luZyA9IGdzLkVhc2luZ3MuZnJvbU9iamVjdChwYXJhbXMuZWFzaW5nKVxuICAgICAgICBcbiAgICAgICAgc3dpdGNoIHBhcmFtcy50eXBlXG4gICAgICAgICAgICB3aGVuIDAgIyBXb2JibGVcbiAgICAgICAgICAgICAgICBvYmplY3QuYW5pbWF0b3Iud29iYmxlVG8ocGFyYW1zLndvYmJsZS5wb3dlciAvIDEwMDAwLCBwYXJhbXMud29iYmxlLnNwZWVkIC8gMTAwLCBkdXJhdGlvbiwgZWFzaW5nKVxuICAgICAgICAgICAgICAgIHdvYmJsZSA9IG9iamVjdC5lZmZlY3RzLndvYmJsZVxuICAgICAgICAgICAgICAgIHdvYmJsZS5lbmFibGVkID0gcGFyYW1zLndvYmJsZS5wb3dlciA+IDBcbiAgICAgICAgICAgICAgICB3b2JibGUudmVydGljYWwgPSBwYXJhbXMud29iYmxlLm9yaWVudGF0aW9uID09IDAgb3IgcGFyYW1zLndvYmJsZS5vcmllbnRhdGlvbiA9PSAyXG4gICAgICAgICAgICAgICAgd29iYmxlLmhvcml6b250YWwgPSBwYXJhbXMud29iYmxlLm9yaWVudGF0aW9uID09IDEgb3IgcGFyYW1zLndvYmJsZS5vcmllbnRhdGlvbiA9PSAyXG4gICAgICAgICAgICB3aGVuIDEgIyBCbHVyXG4gICAgICAgICAgICAgICAgb2JqZWN0LmFuaW1hdG9yLmJsdXJUbyhwYXJhbXMuYmx1ci5wb3dlciAvIDEwMCwgZHVyYXRpb24sIGVhc2luZylcbiAgICAgICAgICAgICAgICBvYmplY3QuZWZmZWN0cy5ibHVyLmVuYWJsZWQgPSB5ZXNcbiAgICAgICAgICAgIHdoZW4gMiAjIFBpeGVsYXRlXG4gICAgICAgICAgICAgICAgb2JqZWN0LmFuaW1hdG9yLnBpeGVsYXRlVG8ocGFyYW1zLnBpeGVsYXRlLnNpemUud2lkdGgsIHBhcmFtcy5waXhlbGF0ZS5zaXplLmhlaWdodCwgZHVyYXRpb24sIGVhc2luZylcbiAgICAgICAgICAgICAgICBvYmplY3QuZWZmZWN0cy5waXhlbGF0ZS5lbmFibGVkID0geWVzXG4gICAgXG4gICAgICAgIGlmIHBhcmFtcy53YWl0Rm9yQ29tcGxldGlvbiBhbmQgZHVyYXRpb24gIT0gMFxuICAgICAgICAgICAgQGlzV2FpdGluZyA9IHllc1xuICAgICAgICAgICAgQHdhaXRDb3VudGVyID0gZHVyYXRpb25cbiBcbiAgICAjIyMqXG4gICAgKiBFeGVjdXRlcyBhbiBhY3Rpb24gbGlrZSBmb3IgYSBob3RzcG90LlxuICAgICpcbiAgICAqIEBtZXRob2QgZXhlY3V0ZUFjdGlvblxuICAgICogQHBhcmFtIHtPYmplY3R9IGFjdGlvbiAtIEFjdGlvbi1EYXRhLlxuICAgICogQHBhcmFtIHtib29sZWFufSBzdGF0ZVZhbHVlIC0gSW4gY2FzZSBvZiBzd2l0Y2gtYmluZGluZywgdGhlIHN3aXRjaCBpcyBzZXQgdG8gdGhpcyB2YWx1ZS5cbiAgICAqIEBwYXJhbSB7bnVtYmVyfSBiaW5kVmFsdWUgLSBBIG51bWJlciB2YWx1ZSB3aGljaCBiZSBwdXQgaW50byB0aGUgYWN0aW9uJ3MgYmluZC12YWx1ZSB2YXJpYWJsZS5cbiAgICAjIyNcbiAgICBleGVjdXRlQWN0aW9uOiAoYWN0aW9uLCBzdGF0ZVZhbHVlLCBiaW5kVmFsdWUpIC0+XG4gICAgICAgIHN3aXRjaCBhY3Rpb24udHlwZVxuICAgICAgICAgICAgd2hlbiAwICMgSnVtcCBUbyBMYWJlbFxuICAgICAgICAgICAgICAgIGlmIGFjdGlvbi5sYWJlbEluZGV4XG4gICAgICAgICAgICAgICAgICAgIEBwb2ludGVyID0gYWN0aW9uLmxhYmVsSW5kZXhcbiAgICAgICAgICAgICAgICBlbHNlXG4gICAgICAgICAgICAgICAgICAgIEBqdW1wVG9MYWJlbChhY3Rpb24ubGFiZWwpXG4gICAgICAgICAgICB3aGVuIDEgIyBDYWxsIENvbW1vbiBFdmVudFxuICAgICAgICAgICAgICAgIEBjYWxsQ29tbW9uRXZlbnQoYWN0aW9uLmNvbW1vbkV2ZW50SWQsIG51bGwsIEBpc1dhaXRpbmcpXG4gICAgICAgICAgICB3aGVuIDIgIyBCaW5kIFRvIFN3aXRjaFxuICAgICAgICAgICAgICAgIGRvbWFpbiA9IEdhbWVNYW5hZ2VyLnZhcmlhYmxlU3RvcmUuZG9tYWluXG4gICAgICAgICAgICAgICAgQHNldEJvb2xlYW5WYWx1ZVRvKGFjdGlvbi5zd2l0Y2gsIHN0YXRlVmFsdWUpXG4gICAgICAgICAgICB3aGVuIDMgIyBDYWxsIFNjZW5lXG4gICAgICAgICAgICAgICAgQGNhbGxTY2VuZShhY3Rpb24uc2NlbmU/LnVpZClcbiAgICAgICAgICAgIHdoZW4gNCAjIEJpbmQgVmFsdWUgdG8gVmFyaWFibGVcbiAgICAgICAgICAgICAgICBkb21haW4gPSBHYW1lTWFuYWdlci52YXJpYWJsZVN0b3JlLmRvbWFpblxuICAgICAgICAgICAgICAgIEBzZXROdW1iZXJWYWx1ZVRvKGFjdGlvbi5iaW5kVmFsdWVWYXJpYWJsZSwgYmluZFZhbHVlKVxuICAgICAgICAgICAgICAgIGlmIGFjdGlvbi5sYWJlbEluZGV4XG4gICAgICAgICAgICAgICAgICAgIEBwb2ludGVyID0gYWN0aW9uLmxhYmVsSW5kZXhcbiAgICAgICAgICAgICAgICBlbHNlXG4gICAgICAgICAgICAgICAgICAgIEBqdW1wVG9MYWJlbChhY3Rpb24ubGFiZWwpXG4gICAgICAgICAgICAgICAgICAgIFxuICAgICMjIypcbiAgICAqIENhbGxzIGEgY29tbW9uIGV2ZW50IGFuZCByZXR1cm5zIHRoZSBzdWItaW50ZXJwcmV0ZXIgZm9yIGl0LlxuICAgICpcbiAgICAqIEBtZXRob2QgY2FsbENvbW1vbkV2ZW50XG4gICAgKiBAcGFyYW0ge251bWJlcn0gaWQgLSBUaGUgSUQgb2YgdGhlIGNvbW1vbiBldmVudCB0byBjYWxsLlxuICAgICogQHBhcmFtIHtPYmplY3R9IHBhcmFtZXRlcnMgLSBPcHRpb25hbCBjb21tb24gZXZlbnQgcGFyYW1ldGVycy5cbiAgICAqIEBwYXJhbSB7Ym9vbGVhbn0gd2FpdCAtIEluZGljYXRlcyBpZiB0aGUgaW50ZXJwcmV0ZXIgc2hvdWxkIGJlIHN0YXkgaW4gd2FpdGluZy1tb2RlIGV2ZW4gaWYgdGhlIHN1Yi1pbnRlcnByZXRlciBpcyBmaW5pc2hlZC5cbiAgICAjIyMgXG4gICAgY2FsbENvbW1vbkV2ZW50OiAoaWQsIHBhcmFtZXRlcnMsIHdhaXQpIC0+XG4gICAgICAgIGNvbW1vbkV2ZW50ID0gR2FtZU1hbmFnZXIuY29tbW9uRXZlbnRzW2lkXVxuICAgICAgICBcbiAgICAgICAgaWYgY29tbW9uRXZlbnQ/XG4gICAgICAgICAgICBpZiBTY2VuZU1hbmFnZXIuc2NlbmUuY29tbW9uRXZlbnRDb250YWluZXIuc3ViT2JqZWN0cy5pbmRleE9mKGNvbW1vbkV2ZW50KSA9PSAtMVxuICAgICAgICAgICAgICAgIFNjZW5lTWFuYWdlci5zY2VuZS5jb21tb25FdmVudENvbnRhaW5lci5hZGRPYmplY3QoY29tbW9uRXZlbnQpXG4gICAgICAgICAgICBjb21tb25FdmVudC5ldmVudHM/Lm9uIFwiZmluaXNoXCIsIGdzLkNhbGxCYWNrKFwib25Db21tb25FdmVudEZpbmlzaFwiLCB0aGlzKSwgeyB3YWl0aW5nOiB3YWl0IH1cbiAgICAgICAgICAgIFxuICAgICAgICAgICAgQHN1YkludGVycHJldGVyID0gY29tbW9uRXZlbnQuYmVoYXZpb3IuY2FsbChwYXJhbWV0ZXJzIHx8IFtdLCBAc2V0dGluZ3MsIEBjb250ZXh0KVxuICAgICAgICAgICAgI0dhbWVNYW5hZ2VyLnZhcmlhYmxlU3RvcmUuc2V0dXBMb2NhbFZhcmlhYmxlcyhAc3ViSW50ZXJwcmV0ZXIuY29udGV4dClcbiAgICAgICAgICAgICNHYW1lTWFuYWdlci52YXJpYWJsZVN0b3JlLnNldHVwVGVtcFZhcmlhYmxlcyhAc3ViSW50ZXJwcmV0ZXIuY29udGV4dClcbiAgICAgICAgICAgIGNvbW1vbkV2ZW50LmJlaGF2aW9yLnVwZGF0ZSgpXG4gICAgICAgICAgICBcbiAgICAgICAgICAgIGlmIEBzdWJJbnRlcnByZXRlcj9cbiAgICAgICAgICAgICAgICBAaXNXYWl0aW5nID0geWVzXG4gICAgICAgICAgICAgICAgQHN1YkludGVycHJldGVyLnNldHRpbmdzID0gQHNldHRpbmdzXG4gICAgICAgICAgICAgICAgQHN1YkludGVycHJldGVyLnN0YXJ0KClcbiAgICAgICAgICAgICAgICBAc3ViSW50ZXJwcmV0ZXIudXBkYXRlKClcbiAgICBcbiAgICAjIyMqXG4gICAgKiBDYWxscyBhIHNjZW5lIGFuZCByZXR1cm5zIHRoZSBzdWItaW50ZXJwcmV0ZXIgZm9yIGl0LlxuICAgICpcbiAgICAqIEBtZXRob2QgY2FsbFNjZW5lXG4gICAgKiBAcGFyYW0ge1N0cmluZ30gdWlkIC0gVGhlIFVJRCBvZiB0aGUgc2NlbmUgdG8gY2FsbC5cbiAgICAjIyMgICAgICAgICBcbiAgICBjYWxsU2NlbmU6ICh1aWQpIC0+XG4gICAgICAgIHNjZW5lRG9jdW1lbnQgPSBEYXRhTWFuYWdlci5nZXREb2N1bWVudCh1aWQpXG4gICAgICAgIFxuICAgICAgICBpZiBzY2VuZURvY3VtZW50P1xuICAgICAgICAgICAgQGlzV2FpdGluZyA9IHllc1xuICAgICAgICAgICAgQHN1YkludGVycHJldGVyID0gbmV3IHZuLkNvbXBvbmVudF9DYWxsU2NlbmVJbnRlcnByZXRlcigpXG4gICAgICAgICAgICBvYmplY3QgPSB7IGNvbW1hbmRzOiBzY2VuZURvY3VtZW50Lml0ZW1zLmNvbW1hbmRzIH1cbiAgICAgICAgICAgIEBzdWJJbnRlcnByZXRlci5yZXBlYXQgPSBub1xuICAgICAgICAgICAgQHN1YkludGVycHJldGVyLmNvbnRleHQuc2V0KHNjZW5lRG9jdW1lbnQudWlkLCBzY2VuZURvY3VtZW50KVxuICAgICAgICAgICAgQHN1YkludGVycHJldGVyLm9iamVjdCA9IG9iamVjdFxuICAgICAgICAgICAgQHN1YkludGVycHJldGVyLm9uRmluaXNoID0gZ3MuQ2FsbEJhY2soXCJvbkNhbGxTY2VuZUZpbmlzaFwiLCB0aGlzKVxuICAgICAgICAgICAgQHN1YkludGVycHJldGVyLnN0YXJ0KClcbiAgICAgICAgICAgIEBzdWJJbnRlcnByZXRlci5zZXR0aW5ncyA9IEBzZXR0aW5nc1xuICAgICAgICAgICAgQHN1YkludGVycHJldGVyLnVwZGF0ZSgpXG4gICAgICAgICAgICBcbiAgXG4gICAgICAgIFxuICAgICMjIypcbiAgICAqIENhbGxzIGEgY29tbW9uIGV2ZW50IGFuZCByZXR1cm5zIHRoZSBzdWItaW50ZXJwcmV0ZXIgZm9yIGl0LlxuICAgICpcbiAgICAqIEBtZXRob2Qgc3RvcmVMaXN0VmFsdWVcbiAgICAqIEBwYXJhbSB7bnVtYmVyfSBpZCAtIFRoZSBJRCBvZiB0aGUgY29tbW9uIGV2ZW50IHRvIGNhbGwuXG4gICAgKiBAcGFyYW0ge09iamVjdH0gcGFyYW1ldGVycyAtIE9wdGlvbmFsIGNvbW1vbiBldmVudCBwYXJhbWV0ZXJzLlxuICAgICogQHBhcmFtIHtib29sZWFufSB3YWl0IC0gSW5kaWNhdGVzIGlmIHRoZSBpbnRlcnByZXRlciBzaG91bGQgYmUgc3RheSBpbiB3YWl0aW5nLW1vZGUgZXZlbiBpZiB0aGUgc3ViLWludGVycHJldGVyIGlzIGZpbmlzaGVkLlxuICAgICMjIyAgICAgICAgXG4gICAgc3RvcmVMaXN0VmFsdWU6ICh2YXJpYWJsZSwgbGlzdCwgdmFsdWUsIHZhbHVlVHlwZSkgLT5cbiAgICAgICAgc3dpdGNoIHZhbHVlVHlwZVxuICAgICAgICAgICAgd2hlbiAwICMgTnVtYmVyIFZhbHVlXG4gICAgICAgICAgICAgICAgQHNldE51bWJlclZhbHVlVG8odmFyaWFibGUsIChpZiAhaXNOYU4odmFsdWUpIHRoZW4gdmFsdWUgZWxzZSAwKSlcbiAgICAgICAgICAgIHdoZW4gMSAjIFN3aXRjaCBWYWx1ZVxuICAgICAgICAgICAgICAgIEBzZXRCb29sZWFuVmFsdWVUbyh2YXJpYWJsZSwgKGlmIHZhbHVlIHRoZW4gMSBlbHNlIDApKVxuICAgICAgICAgICAgd2hlbiAyICMgVGV4dCBWYWx1ZVxuICAgICAgICAgICAgICAgIEBzZXRTdHJpbmdWYWx1ZVRvKHZhcmlhYmxlLCB2YWx1ZS50b1N0cmluZygpKVxuICAgICAgICAgICAgd2hlbiAzICMgTGlzdCBWYWx1ZVxuICAgICAgICAgICAgICAgIEBzZXRMaXN0T2JqZWN0VG8odmFyaWFibGUsIChpZiB2YWx1ZS5sZW5ndGg/IHRoZW4gdmFsdWUgZWxzZSBbXSkpIFxuICAgICAgICBcbiAgICAjIyMqXG4gICAgKiBAbWV0aG9kIGp1bXBUb0xhYmVsXG4gICAgIyMjICAgICAgICAgXG4gICAganVtcFRvTGFiZWw6IChsYWJlbCkgLT5cbiAgICAgICAgcmV0dXJuIGlmIG5vdCBsYWJlbFxuICAgICAgICBmb3VuZCA9IG5vXG4gICAgICAgIFxuICAgICAgICBmb3IgaSBpbiBbMC4uLkBvYmplY3QuY29tbWFuZHMubGVuZ3RoXVxuICAgICAgICAgICAgaWYgQG9iamVjdC5jb21tYW5kc1tpXS5pZCA9PSBcImdzLkxhYmVsXCIgYW5kIEBvYmplY3QuY29tbWFuZHNbaV0ucGFyYW1zLm5hbWUgPT0gbGFiZWxcbiAgICAgICAgICAgICAgICBAcG9pbnRlciA9IGlcbiAgICAgICAgICAgICAgICBAaW5kZW50ID0gQG9iamVjdC5jb21tYW5kc1tpXS5pbmRlbnRcbiAgICAgICAgICAgICAgICBmb3VuZCA9IHllc1xuICAgICAgICAgICAgICAgIGJyZWFrXG4gICAgICAgICAgICAgICAgXG4gICAgICAgIGlmIGZvdW5kXG4gICAgICAgICAgICBAd2FpdENvdW50ZXIgPSAwXG4gICAgICAgICAgICBAaXNXYWl0aW5nID0gbm9cbiAgICBcbiAgICAjIyMqXG4gICAgKiBHZXRzIHRoZSBjdXJyZW50IG1lc3NhZ2UgYm94IG9iamVjdCBkZXBlbmRpbmcgb24gZ2FtZSBtb2RlIChBRFYgb3IgTlZMKS5cbiAgICAqXG4gICAgKiBAbWV0aG9kIG1lc3NhZ2VCb3hPYmplY3RcbiAgICAqIEByZXR1cm4ge2dzLk9iamVjdF9CYXNlfSBUaGUgbWVzc2FnZSBib3ggb2JqZWN0LlxuICAgICogQHByb3RlY3RlZFxuICAgICMjIyAgICAgICAgICAgIFxuICAgIG1lc3NhZ2VCb3hPYmplY3Q6IChpZCkgLT5cbiAgICAgICAgaWYgU2NlbmVNYW5hZ2VyLnNjZW5lLmxheW91dC52aXNpYmxlXG4gICAgICAgICAgICByZXR1cm4gZ3MuT2JqZWN0TWFuYWdlci5jdXJyZW50Lm9iamVjdEJ5SWQoaWQgfHwgXCJtZXNzYWdlQm94XCIpXG4gICAgICAgIGVsc2VcbiAgICAgICAgICAgIHJldHVybiBncy5PYmplY3RNYW5hZ2VyLmN1cnJlbnQub2JqZWN0QnlJZChpZCB8fCBcIm52bE1lc3NhZ2VCb3hcIilcbiAgICAgIFxuICAgICMjIypcbiAgICAqIEdldHMgdGhlIGN1cnJlbnQgbWVzc2FnZSBvYmplY3QgZGVwZW5kaW5nIG9uIGdhbWUgbW9kZSAoQURWIG9yIE5WTCkuXG4gICAgKlxuICAgICogQG1ldGhvZCBtZXNzYWdlT2JqZWN0XG4gICAgKiBAcmV0dXJuIHt1aS5PYmplY3RfTWVzc2FnZX0gVGhlIG1lc3NhZ2Ugb2JqZWN0LlxuICAgICogQHByb3RlY3RlZFxuICAgICMjIyAgICAgICBcbiAgICBtZXNzYWdlT2JqZWN0OiAtPlxuICAgICAgICBpZiBTY2VuZU1hbmFnZXIuc2NlbmUubGF5b3V0LnZpc2libGVcbiAgICAgICAgICAgIHJldHVybiBncy5PYmplY3RNYW5hZ2VyLmN1cnJlbnQub2JqZWN0QnlJZChcImdhbWVNZXNzYWdlX21lc3NhZ2VcIilcbiAgICAgICAgZWxzZVxuICAgICAgICAgICAgcmV0dXJuIGdzLk9iamVjdE1hbmFnZXIuY3VycmVudC5vYmplY3RCeUlkKFwibnZsR2FtZU1lc3NhZ2VfbWVzc2FnZVwiKVxuICAgICMjIypcbiAgICAqIEdldHMgdGhlIGN1cnJlbnQgbWVzc2FnZSBJRCBkZXBlbmRpbmcgb24gZ2FtZSBtb2RlIChBRFYgb3IgTlZMKS5cbiAgICAqXG4gICAgKiBAbWV0aG9kIG1lc3NhZ2VPYmplY3RJZFxuICAgICogQHJldHVybiB7c3RyaW5nfSBUaGUgbWVzc2FnZSBvYmplY3QgSUQuXG4gICAgKiBAcHJvdGVjdGVkXG4gICAgIyMjICAgICAgICAgICBcbiAgICBtZXNzYWdlT2JqZWN0SWQ6IC0+XG4gICAgICAgIGlmIFNjZW5lTWFuYWdlci5zY2VuZS5sYXlvdXQudmlzaWJsZVxuICAgICAgICAgICAgcmV0dXJuIFwiZ2FtZU1lc3NhZ2VfbWVzc2FnZVwiXG4gICAgICAgIGVsc2VcbiAgICAgICAgICAgIHJldHVybiBcIm52bEdhbWVNZXNzYWdlX21lc3NhZ2VcIlxuICAgIFxuICAgICMjIypcbiAgICAqIEdldHMgdGhlIGN1cnJlbnQgbWVzc2FnZSBzZXR0aW5ncy5cbiAgICAqXG4gICAgKiBAbWV0aG9kIG1lc3NhZ2VTZXR0aW5nc1xuICAgICogQHJldHVybiB7T2JqZWN0fSBUaGUgbWVzc2FnZSBzZXR0aW5nc1xuICAgICogQHByb3RlY3RlZFxuICAgICMjIyAgICAgXG4gICAgbWVzc2FnZVNldHRpbmdzOiAtPlxuICAgICAgICBtZXNzYWdlID0gQHRhcmdldE1lc3NhZ2UoKVxuXG4gICAgICAgIHJldHVybiBtZXNzYWdlLnNldHRpbmdzXG4gICAgICAgIFxuICAgICMjIypcbiAgICAqIEdldHMgdGhlIGN1cnJlbnQgdGFyZ2V0IG1lc3NhZ2Ugb2JqZWN0IHdoZXJlIGFsbCBtZXNzYWdlIGNvbW1hbmRzIGFyZSBleGVjdXRlZCBvbi5cbiAgICAqXG4gICAgKiBAbWV0aG9kIHRhcmdldE1lc3NhZ2VcbiAgICAqIEByZXR1cm4ge3VpLk9iamVjdF9NZXNzYWdlfSBUaGUgdGFyZ2V0IG1lc3NhZ2Ugb2JqZWN0LlxuICAgICogQHByb3RlY3RlZFxuICAgICMjIyAgIFxuICAgIHRhcmdldE1lc3NhZ2U6IC0+XG4gICAgICAgIG1lc3NhZ2UgPSBAbWVzc2FnZU9iamVjdCgpXG4gICAgICAgIHRhcmdldCA9IEBzZXR0aW5ncy5tZXNzYWdlLnRhcmdldFxuICAgICAgICBpZiB0YXJnZXQ/XG4gICAgICAgICAgICBzd2l0Y2ggdGFyZ2V0LnR5cGVcbiAgICAgICAgICAgICAgICB3aGVuIDAgIyBMYXlvdXQtQmFzZWRcbiAgICAgICAgICAgICAgICAgICAgbWVzc2FnZSA9IGdzLk9iamVjdE1hbmFnZXIuY3VycmVudC5vYmplY3RCeUlkKHRhcmdldC5pZCkgPyBAbWVzc2FnZU9iamVjdCgpXG4gICAgICAgICAgICAgICAgd2hlbiAxICMgQ3VzdG9tXG4gICAgICAgICAgICAgICAgICAgIG1lc3NhZ2UgPSBTY2VuZU1hbmFnZXIuc2NlbmUubWVzc2FnZUFyZWFzW3RhcmdldC5pZF0/Lm1lc3NhZ2UgPyBAbWVzc2FnZU9iamVjdCgpXG4gICAgICAgICAgICAgICAgICAgIFxuICAgICAgICByZXR1cm4gbWVzc2FnZVxuICAgICAgICBcbiAgICAjIyMqXG4gICAgKiBHZXRzIHRoZSBjdXJyZW50IHRhcmdldCBtZXNzYWdlIGJveCBjb250YWluaW5nIHRoZSBjdXJyZW50IHRhcmdldCBtZXNzYWdlLlxuICAgICpcbiAgICAqIEBtZXRob2QgdGFyZ2V0TWVzc2FnZUJveFxuICAgICogQHJldHVybiB7dWkuT2JqZWN0X1VJRWxlbWVudH0gVGhlIHRhcmdldCBtZXNzYWdlIGJveC5cbiAgICAqIEBwcm90ZWN0ZWRcbiAgICAjIyMgICAgIFxuICAgIHRhcmdldE1lc3NhZ2VCb3g6IC0+XG4gICAgICAgIG1lc3NhZ2VCb3ggPSBAbWVzc2FnZU9iamVjdCgpXG4gICAgICAgIHRhcmdldCA9IEBzZXR0aW5ncy5tZXNzYWdlLnRhcmdldFxuICAgICAgICBpZiB0YXJnZXQ/XG4gICAgICAgICAgICBzd2l0Y2ggdGFyZ2V0LnR5cGVcbiAgICAgICAgICAgICAgICB3aGVuIDAgIyBMYXlvdXQtQmFzZWRcbiAgICAgICAgICAgICAgICAgICAgbWVzc2FnZUJveCA9IGdzLk9iamVjdE1hbmFnZXIuY3VycmVudC5vYmplY3RCeUlkKHRhcmdldC5pZCkgPyBAbWVzc2FnZU9iamVjdCgpXG4gICAgICAgICAgICAgICAgd2hlbiAxICMgQ3VzdG9tXG4gICAgICAgICAgICAgICAgICAgIG1lc3NhZ2VCb3ggPSBncy5PYmplY3RNYW5hZ2VyLmN1cnJlbnQub2JqZWN0QnlJZChcImN1c3RvbUdhbWVNZXNzYWdlX1wiK3RhcmdldC5pZCkgPyBAbWVzc2FnZU9iamVjdCgpXG4gICAgICAgICAgICAgICAgICAgIFxuICAgICAgICByZXR1cm4gbWVzc2FnZUJveFxuICAgICAgICBcbiAgICAjIyMqXG4gICAgKiBDYWxsZWQgYWZ0ZXIgYW4gaW5wdXQgbnVtYmVyIGRpYWxvZyB3YXMgYWNjZXB0ZWQgYnkgdGhlIHVzZXIuIEl0IHRha2VzIHRoZSB1c2VyJ3MgaW5wdXQgYW5kIHB1dHNcbiAgICAqIGl0IGluIHRoZSBjb25maWd1cmVkIG51bWJlciB2YXJpYWJsZS5cbiAgICAqXG4gICAgKiBAbWV0aG9kIG9uSW5wdXROdW1iZXJGaW5pc2hcbiAgICAqIEByZXR1cm4ge09iamVjdH0gRXZlbnQgT2JqZWN0IGNvbnRhaW5pbmcgYWRkaXRpb25hbCBkYXRhIGxpa2UgdGhlIG51bWJlciwgZXRjLlxuICAgICogQHByb3RlY3RlZFxuICAgICMjIyAgICAgICAgICAgICBcbiAgICBvbklucHV0TnVtYmVyRmluaXNoOiAoZSkgLT5cbiAgICAgICAgQG1lc3NhZ2VPYmplY3QoKS5iZWhhdmlvci5jbGVhcigpXG4gICAgICAgIEBzZXROdW1iZXJWYWx1ZVRvKEB3YWl0aW5nRm9yLmlucHV0TnVtYmVyLnZhcmlhYmxlLCBwYXJzZUludCh1aS5Db21wb25lbnRfRm9ybXVsYUhhbmRsZXIuZmllbGRWYWx1ZShlLnNlbmRlciwgZS5udW1iZXIpKSlcbiAgICAgICAgQGlzV2FpdGluZyA9IG5vXG4gICAgICAgIEB3YWl0aW5nRm9yLmlucHV0TnVtYmVyID0gbnVsbFxuICAgICAgICBTY2VuZU1hbmFnZXIuc2NlbmUuaW5wdXROdW1iZXJCb3guZGlzcG9zZSgpXG4gICAgXG4gICAgIyMjKlxuICAgICogQ2FsbGVkIGFmdGVyIGFuIGlucHV0IHRleHQgZGlhbG9nIHdhcyBhY2NlcHRlZCBieSB0aGUgdXNlci4gSXQgdGFrZXMgdGhlIHVzZXIncyB0ZXh0IGlucHV0IGFuZCBwdXRzXG4gICAgKiBpdCBpbiB0aGUgY29uZmlndXJlZCBzdHJpbmcgdmFyaWFibGUuXG4gICAgKlxuICAgICogQG1ldGhvZCBvbklucHV0VGV4dEZpbmlzaFxuICAgICogQHJldHVybiB7T2JqZWN0fSBFdmVudCBPYmplY3QgY29udGFpbmluZyBhZGRpdGlvbmFsIGRhdGEgbGlrZSB0aGUgdGV4dCwgZXRjLlxuICAgICogQHByb3RlY3RlZFxuICAgICMjIyAgICBcbiAgICBvbklucHV0VGV4dEZpbmlzaDogKGUpIC0+XG4gICAgICAgIEBtZXNzYWdlT2JqZWN0KCkuYmVoYXZpb3IuY2xlYXIoKVxuICAgICAgICBAc2V0U3RyaW5nVmFsdWVUbyhAd2FpdGluZ0Zvci5pbnB1dFRleHQudmFyaWFibGUsIHVpLkNvbXBvbmVudF9Gb3JtdWxhSGFuZGxlci5maWVsZFZhbHVlKGUuc2VuZGVyLCBlLnRleHQpLnJlcGxhY2UoL18vZywgXCJcIikpXG4gICAgICAgIEBpc1dhaXRpbmcgPSBub1xuICAgICAgICBAd2FpdGluZ0Zvci5pbnB1dFRleHQgPSBudWxsXG4gICAgICAgIFNjZW5lTWFuYWdlci5zY2VuZS5pbnB1dFRleHRCb3guZGlzcG9zZSgpXG4gICAgXG4gICAgIyMjKlxuICAgICogQ2FsbGVkIGFmdGVyIGEgY2hvaWNlIHdhcyBzZWxlY3RlZCBieSB0aGUgdXNlci4gSXQganVtcHMgdG8gdGhlIGNvcnJlc3BvbmRpbmcgbGFiZWxcbiAgICAqIGFuZCBhbHNvIHB1dHMgdGhlIGNob2ljZSBpbnRvIGJhY2tsb2cuXG4gICAgKlxuICAgICogQG1ldGhvZCBvbkNob2ljZUFjY2VwdFxuICAgICogQHJldHVybiB7T2JqZWN0fSBFdmVudCBPYmplY3QgY29udGFpbmluZyBhZGRpdGlvbmFsIGRhdGEgbGlrZSB0aGUgbGFiZWwsIGV0Yy5cbiAgICAqIEBwcm90ZWN0ZWRcbiAgICAjIyMgICAgICAgIFxuICAgIG9uQ2hvaWNlQWNjZXB0OiAoZSkgLT5cbiAgICAgICAgc2NlbmUgPSBTY2VuZU1hbmFnZXIuc2NlbmVcbiAgICAgICAgc2NlbmUuY2hvaWNlVGltZXIuYmVoYXZpb3Iuc3RvcCgpXG4gICAgICAgIFxuICAgICAgICBlLmlzU2VsZWN0ZWQgPSB5ZXNcbiAgICAgICAgZGVsZXRlIGUuc2VuZGVyXG4gICAgICAgIFxuICAgICAgICBHYW1lTWFuYWdlci5iYWNrbG9nLnB1c2goeyBjaGFyYWN0ZXI6IHsgbmFtZTogXCJcIiB9LCBtZXNzYWdlOiBcIlwiLCBjaG9pY2U6IGUsIGNob2ljZXM6IHNjZW5lLmNob2ljZXMsIGlzQ2hvaWNlOiB5ZXMgfSlcbiAgICAgICAgc2NlbmUuY2hvaWNlcyA9IFtdXG4gICAgICAgIG1lc3NhZ2VPYmplY3QgPSBAbWVzc2FnZU9iamVjdCgpXG4gICAgICAgIGlmIG1lc3NhZ2VPYmplY3Q/LnZpc2libGVcbiAgICAgICAgICAgIEBpc1dhaXRpbmcgPSB5ZXNcbiAgICAgICAgICAgIGZhZGluZyA9IEdhbWVNYW5hZ2VyLnRlbXBTZXR0aW5ncy5tZXNzYWdlRmFkaW5nXG4gICAgICAgICAgICBkdXJhdGlvbiA9IGlmIEdhbWVNYW5hZ2VyLnRlbXBTZXR0aW5ncy5za2lwIHRoZW4gMCBlbHNlIGZhZGluZy5kdXJhdGlvblxuICAgICAgICAgICAgbWVzc2FnZU9iamVjdC5hbmltYXRvci5kaXNhcHBlYXIoZmFkaW5nLmFuaW1hdGlvbiwgZmFkaW5nLmVhc2luZywgZHVyYXRpb24sID0+XG4gICAgICAgICAgICAgICAgbWVzc2FnZU9iamVjdC5iZWhhdmlvci5jbGVhcigpXG4gICAgICAgICAgICAgICAgbWVzc2FnZU9iamVjdC52aXNpYmxlID0gbm9cbiAgICAgICAgICAgICAgICBAaXNXYWl0aW5nID0gbm9cbiAgICAgICAgICAgICAgICBAd2FpdGluZ0Zvci5jaG9pY2UgPSBudWxsXG4gICAgICAgICAgICAgICAgQGV4ZWN1dGVBY3Rpb24oZS5hY3Rpb24sIHRydWUpXG4gICAgICAgICAgICApXG4gICAgICAgIGVsc2VcbiAgICAgICAgICAgIEBpc1dhaXRpbmcgPSBub1xuICAgICAgICAgICAgQGV4ZWN1dGVBY3Rpb24oZS5hY3Rpb24sIHRydWUpXG4gICAgICAgIHNjZW5lLmNob2ljZVdpbmRvdy5kaXNwb3NlKClcbiAgICBcbiAgICAjIyMqXG4gICAgKiBJZGxlXG4gICAgKiBAbWV0aG9kIGNvbW1hbmRJZGxlXG4gICAgKiBAcHJvdGVjdGVkXG4gICAgIyMjIFxuICAgIGNvbW1hbmRJZGxlOiAtPlxuICAgICAgICBAaW50ZXJwcmV0ZXIuaXNXYWl0aW5nID0gIUBpbnRlcnByZXRlci5pc0luc3RhbnRTa2lwKClcbiAgICBcbiAgICBcbiAgICAjIyMqXG4gICAgKiBTdGFydCBUaW1lclxuICAgICogQG1ldGhvZCBjb21tYW5kU3RhcnRUaW1lclxuICAgICogQHByb3RlY3RlZFxuICAgICMjIyAgICAgXG4gICAgY29tbWFuZFN0YXJ0VGltZXI6IC0+XG4gICAgICAgIHNjZW5lID0gU2NlbmVNYW5hZ2VyLnNjZW5lXG4gICAgICAgIHRpbWVycyA9IHNjZW5lLnRpbWVyc1xuICAgICAgICBudW1iZXIgPSBAaW50ZXJwcmV0ZXIubnVtYmVyVmFsdWVPZihAcGFyYW1zLm51bWJlcilcbiAgICAgICAgdGltZXIgPSB0aW1lcnNbbnVtYmVyXVxuICAgICAgICBpZiBub3QgdGltZXI/XG4gICAgICAgICAgICB0aW1lciA9IG5ldyBncy5PYmplY3RfSW50ZXJ2YWxUaW1lcigpXG4gICAgICAgICAgICB0aW1lcnNbbnVtYmVyXSA9IHRpbWVyXG4gICAgICAgICAgICBcbiAgICAgICAgdGltZXIuZXZlbnRzLm9mZkJ5T3duZXIoXCJlbGFwc2VkXCIsIEBvYmplY3QpXG4gICAgICAgIHRpbWVyLmV2ZW50cy5vbihcImVsYXBzZWRcIiwgKGUpID0+XG4gICAgICAgICAgICBwYXJhbXMgPSBlLmRhdGEucGFyYW1zXG4gICAgICAgICAgICBzd2l0Y2ggcGFyYW1zLmFjdGlvbi50eXBlXG4gICAgICAgICAgICAgICAgd2hlbiAwICMgSnVtcCBUbyBMYWJlbFxuICAgICAgICAgICAgICAgICAgICBpZiBwYXJhbXMubGFiZWxJbmRleD9cbiAgICAgICAgICAgICAgICAgICAgICAgIFNjZW5lTWFuYWdlci5zY2VuZS5pbnRlcnByZXRlci5wb2ludGVyID0gcGFyYW1zLmxhYmVsSW5kZXhcbiAgICAgICAgICAgICAgICAgICAgZWxzZVxuICAgICAgICAgICAgICAgICAgICAgICAgU2NlbmVNYW5hZ2VyLnNjZW5lLmludGVycHJldGVyLmp1bXBUb0xhYmVsKHBhcmFtcy5hY3Rpb24uZGF0YS5sYWJlbClcbiAgICAgICAgICAgICAgICB3aGVuIDEgIyBDYWxsIENvbW1vbiBFdmVudFxuICAgICAgICAgICAgICAgICAgICBTY2VuZU1hbmFnZXIuc2NlbmUuaW50ZXJwcmV0ZXIuY2FsbENvbW1vbkV2ZW50KHBhcmFtcy5hY3Rpb24uZGF0YS5jb21tb25FdmVudElkKVxuICAgICAgICB7IHBhcmFtczogQHBhcmFtcyB9LCBAb2JqZWN0KVxuICAgICAgICBcbiAgICAgICAgdGltZXIuYmVoYXZpb3IuaW50ZXJ2YWwgPSBAaW50ZXJwcmV0ZXIuZHVyYXRpb25WYWx1ZU9mKEBwYXJhbXMuaW50ZXJ2YWwpXG4gICAgICAgIHRpbWVyLmJlaGF2aW9yLnN0YXJ0KClcbiAgICAgICAgXG4gICAgXG4gICAgIyMjKlxuICAgICogUmVzdW1lIFRpbWVyXG4gICAgKiBAbWV0aG9kIGNvbW1hbmRSZXN1bWVUaW1lclxuICAgICogQHByb3RlY3RlZFxuICAgICMjIyAgXG4gICAgY29tbWFuZFJlc3VtZVRpbWVyOiAtPlxuICAgICAgICB0aW1lcnMgPSBTY2VuZU1hbmFnZXIuc2NlbmUudGltZXJzXG4gICAgICAgIG51bWJlciA9IEBpbnRlcnByZXRlci5udW1iZXJWYWx1ZU9mKEBwYXJhbXMubnVtYmVyKVxuICAgICAgICB0aW1lcnNbbnVtYmVyXT8uYmVoYXZpb3IucmVzdW1lKClcbiAgICAgICAgXG4gICAgIyMjKlxuICAgICogUGF1c2VzIFRpbWVyXG4gICAgKiBAbWV0aG9kIGNvbW1hbmRQYXVzZVRpbWVyXG4gICAgKiBAcHJvdGVjdGVkXG4gICAgIyMjICBcbiAgICBjb21tYW5kUGF1c2VUaW1lcjogLT5cbiAgICAgICAgdGltZXJzID0gU2NlbmVNYW5hZ2VyLnNjZW5lLnRpbWVyc1xuICAgICAgICBudW1iZXIgPSBAaW50ZXJwcmV0ZXIubnVtYmVyVmFsdWVPZihAcGFyYW1zLm51bWJlcilcbiAgICAgICAgdGltZXJzW251bWJlcl0/LmJlaGF2aW9yLnBhdXNlKClcbiAgICAgICAgXG4gICAgIyMjKlxuICAgICogU3RvcCBUaW1lclxuICAgICogQG1ldGhvZCBjb21tYW5kU3RvcFRpbWVyXG4gICAgKiBAcHJvdGVjdGVkXG4gICAgIyMjICAgXG4gICAgY29tbWFuZFN0b3BUaW1lcjogLT5cbiAgICAgICAgdGltZXJzID0gU2NlbmVNYW5hZ2VyLnNjZW5lLnRpbWVyc1xuICAgICAgICBudW1iZXIgPSBAaW50ZXJwcmV0ZXIubnVtYmVyVmFsdWVPZihAcGFyYW1zLm51bWJlcilcbiAgICAgICAgdGltZXJzW251bWJlcl0/LmJlaGF2aW9yLnN0b3AoKVxuICAgICAgICAgICAgXG4gICAgIyMjKlxuICAgICogV2FpdFxuICAgICogQG1ldGhvZCBjb21tYW5kV2FpdFxuICAgICogQHByb3RlY3RlZFxuICAgICMjIyBcbiAgICBjb21tYW5kV2FpdDogLT5cbiAgICAgICAgdGltZSA9IEBpbnRlcnByZXRlci5kdXJhdGlvblZhbHVlT2YoQHBhcmFtcy50aW1lKSBcbiAgICAgICAgXG4gICAgICAgIGlmIHRpbWU/IGFuZCB0aW1lID4gMCBhbmQgIUBpbnRlcnByZXRlci5wcmV2aWV3RGF0YVxuICAgICAgICAgICAgQGludGVycHJldGVyLndhaXRDb3VudGVyID0gdGltZVxuICAgICAgICAgICAgQGludGVycHJldGVyLmlzV2FpdGluZyA9IHllc1xuICAgICAgICBcbiAgICAjIyMqXG4gICAgKiBMb29wXG4gICAgKiBAbWV0aG9kIGNvbW1hbmRMb29wXG4gICAgKiBAcHJvdGVjdGVkXG4gICAgIyMjIFxuICAgIGNvbW1hbmRMb29wOiAtPlxuICAgICAgICBAaW50ZXJwcmV0ZXIubG9vcHNbQGludGVycHJldGVyLmluZGVudF0gPSBAaW50ZXJwcmV0ZXIucG9pbnRlclxuICAgICAgICBAaW50ZXJwcmV0ZXIuaW5kZW50KytcbiAgICAgICAgXG4gICAgIyMjKlxuICAgICogQnJlYWsgTG9vcFxuICAgICogQG1ldGhvZCBjb21tYW5kQnJlYWtMb29wXG4gICAgKiBAcHJvdGVjdGVkXG4gICAgIyMjIFxuICAgIGNvbW1hbmRCcmVha0xvb3A6IC0+XG4gICAgICAgIGluZGVudCA9IEBpbmRlbnRcbiAgICAgICAgd2hpbGUgbm90IEBpbnRlcnByZXRlci5sb29wc1tpbmRlbnRdPyBhbmQgaW5kZW50ID4gMFxuICAgICAgICAgICAgaW5kZW50LS1cbiAgICAgICAgICAgIFxuICAgICAgICBAaW50ZXJwcmV0ZXIubG9vcHNbaW5kZW50XSA9IG51bGxcbiAgICAgICAgQGludGVycHJldGVyLmluZGVudCA9IGluZGVudFxuICAgIFxuICAgICMjIypcbiAgICAqIEBtZXRob2QgY29tbWFuZExpc3RBZGRcbiAgICAqIEBwcm90ZWN0ZWRcbiAgICAjIyMgIFxuICAgIGNvbW1hbmRMaXN0QWRkOiAtPlxuICAgICAgICBsaXN0ID0gQGludGVycHJldGVyLmxpc3RPYmplY3RPZihAcGFyYW1zLmxpc3RWYXJpYWJsZSlcbiAgICAgICAgXG4gICAgICAgIHN3aXRjaCBAcGFyYW1zLnZhbHVlVHlwZVxuICAgICAgICAgICAgd2hlbiAwICMgTnVtYmVyIFZhbHVlXG4gICAgICAgICAgICAgICAgbGlzdC5wdXNoKEBpbnRlcnByZXRlci5udW1iZXJWYWx1ZU9mKEBwYXJhbXMubnVtYmVyVmFsdWUpKVxuICAgICAgICAgICAgd2hlbiAxICMgU3dpdGNoIFZhbHVlXG4gICAgICAgICAgICAgICAgbGlzdC5wdXNoKEBpbnRlcnByZXRlci5ib29sZWFuVmFsdWVPZihAcGFyYW1zLnN3aXRjaFZhbHVlKSlcbiAgICAgICAgICAgIHdoZW4gMiAjIFRleHQgVmFsdWVcbiAgICAgICAgICAgICAgICBsaXN0LnB1c2goQGludGVycHJldGVyLnN0cmluZ1ZhbHVlT2YoQHBhcmFtcy5zdHJpbmdWYWx1ZSkpXG4gICAgICAgICAgICB3aGVuIDMgIyBMaXN0IFZhbHVlXG4gICAgICAgICAgICAgICAgbGlzdC5wdXNoKEBpbnRlcnByZXRlci5saXN0T2JqZWN0T2YoQHBhcmFtcy5saXN0VmFsdWUpKVxuICAgICAgICAgICAgICAgIFxuICAgICAgICBAaW50ZXJwcmV0ZXIuc2V0TGlzdE9iamVjdFRvKEBwYXJhbXMubGlzdFZhcmlhYmxlLCBsaXN0KVxuICAgIFxuICAgICMjIypcbiAgICAqIEBtZXRob2QgY29tbWFuZExpc3RQb3BcbiAgICAqIEBwcm90ZWN0ZWRcbiAgICAjIyMgXG4gICAgY29tbWFuZExpc3RQb3A6IC0+XG4gICAgICAgIGxpc3QgPSBAaW50ZXJwcmV0ZXIubGlzdE9iamVjdE9mKEBwYXJhbXMubGlzdFZhcmlhYmxlKVxuICAgICAgICB2YWx1ZSA9IGxpc3QucG9wKCkgPyAwXG5cbiAgICAgICAgQGludGVycHJldGVyLnN0b3JlTGlzdFZhbHVlKEBwYXJhbXMudGFyZ2V0VmFyaWFibGUsIGxpc3QsIHZhbHVlLCBAcGFyYW1zLnZhbHVlVHlwZSlcbiAgICAgXG4gICAgIyMjKlxuICAgICogQG1ldGhvZCBjb21tYW5kTGlzdFNoaWZ0XG4gICAgKiBAcHJvdGVjdGVkXG4gICAgIyMjICAgIFxuICAgIGNvbW1hbmRMaXN0U2hpZnQ6IC0+XG4gICAgICAgIGxpc3QgPSBAaW50ZXJwcmV0ZXIubGlzdE9iamVjdE9mKEBwYXJhbXMubGlzdFZhcmlhYmxlKVxuICAgICAgICB2YWx1ZSA9IGxpc3Quc2hpZnQoKSA/IDBcblxuICAgICAgICBAaW50ZXJwcmV0ZXIuc3RvcmVMaXN0VmFsdWUoQHBhcmFtcy50YXJnZXRWYXJpYWJsZSwgbGlzdCwgdmFsdWUsIEBwYXJhbXMudmFsdWVUeXBlKVxuICAgIFxuICAgICMjIypcbiAgICAqIEBtZXRob2QgY29tbWFuZExpc3RJbmRleE9mXG4gICAgKiBAcHJvdGVjdGVkXG4gICAgIyMjICAgIFxuICAgIGNvbW1hbmRMaXN0SW5kZXhPZjogLT5cbiAgICAgICAgbGlzdCA9IEBpbnRlcnByZXRlci5saXN0T2JqZWN0T2YoQHBhcmFtcy5saXN0VmFyaWFibGUpXG4gICAgICAgIHZhbHVlID0gLTFcbiAgICAgICAgXG4gICAgICAgIHN3aXRjaCBAcGFyYW1zLnZhbHVlVHlwZVxuICAgICAgICAgICAgd2hlbiAwICMgTnVtYmVyIFZhbHVlXG4gICAgICAgICAgICAgICAgdmFsdWUgPSBsaXN0LmluZGV4T2YoQGludGVycHJldGVyLm51bWJlclZhbHVlT2YoQHBhcmFtcy5udW1iZXJWYWx1ZSkpXG4gICAgICAgICAgICB3aGVuIDEgIyBTd2l0Y2ggVmFsdWVcbiAgICAgICAgICAgICAgICB2YWx1ZSA9IGxpc3QuaW5kZXhPZihAaW50ZXJwcmV0ZXIuYm9vbGVhblZhbHVlT2YoQHBhcmFtcy5zd2l0Y2hWYWx1ZSkpXG4gICAgICAgICAgICB3aGVuIDIgIyBUZXh0IFZhbHVlXG4gICAgICAgICAgICAgICAgdmFsdWUgPSBsaXN0LmluZGV4T2YoQGludGVycHJldGVyLnN0cmluZ1ZhbHVlT2YoQHBhcmFtcy5zdHJpbmdWYWx1ZSkpXG4gICAgICAgICAgICB3aGVuIDMgIyBMaXN0IFZhbHVlXG4gICAgICAgICAgICAgICAgdmFsdWUgPSBsaXN0LmluZGV4T2YoQGludGVycHJldGVyLmxpc3RPYmplY3RPZihAcGFyYW1zLmxpc3RWYWx1ZSkpXG4gICAgICAgICAgICAgICAgXG4gICAgICAgIEBpbnRlcnByZXRlci5zZXROdW1iZXJWYWx1ZVRvKEBwYXJhbXMudGFyZ2V0VmFyaWFibGUsIHZhbHVlKVxuICAgIFxuICAgICMjIypcbiAgICAqIEBtZXRob2QgY29tbWFuZExpc3RDbGVhclxuICAgICogQHByb3RlY3RlZFxuICAgICMjIyAgXG4gICAgY29tbWFuZExpc3RDbGVhcjogLT5cbiAgICAgICAgbGlzdCA9IEBpbnRlcnByZXRlci5saXN0T2JqZWN0T2YoQHBhcmFtcy5saXN0VmFyaWFibGUpXG4gICAgICAgIGxpc3QubGVuZ3RoID0gMFxuICAgICAgICBcbiAgICAjIyMqXG4gICAgKiBAbWV0aG9kIGNvbW1hbmRMaXN0VmFsdWVBdFxuICAgICogQHByb3RlY3RlZFxuICAgICMjIyAgICAgXG4gICAgY29tbWFuZExpc3RWYWx1ZUF0OiAtPlxuICAgICAgICBsaXN0ID0gQGludGVycHJldGVyLmxpc3RPYmplY3RPZihAcGFyYW1zLmxpc3RWYXJpYWJsZSlcbiAgICAgICAgaW5kZXggPSBAaW50ZXJwcmV0ZXIubnVtYmVyVmFsdWVPZihAcGFyYW1zLmluZGV4KVxuICAgICAgICBcbiAgICAgICAgaWYgaW5kZXggPj0gMCBhbmQgaW5kZXggPCBsaXN0Lmxlbmd0aFxuICAgICAgICAgICAgdmFsdWUgPSBsaXN0W2luZGV4XSA/IDBcbiAgICAgICAgICAgIEBpbnRlcnByZXRlci5zdG9yZUxpc3RWYWx1ZShAcGFyYW1zLnRhcmdldFZhcmlhYmxlLCBsaXN0LCB2YWx1ZSwgQHBhcmFtcy52YWx1ZVR5cGUpXG4gICAgIFxuICAgICMjIypcbiAgICAqIEBtZXRob2QgY29tbWFuZExpc3RSZW1vdmVBdFxuICAgICogQHByb3RlY3RlZFxuICAgICMjIyAgICAgICBcbiAgICBjb21tYW5kTGlzdFJlbW92ZUF0OiAtPlxuICAgICAgICBsaXN0ID0gQGludGVycHJldGVyLmxpc3RPYmplY3RPZihAcGFyYW1zLmxpc3RWYXJpYWJsZSlcbiAgICAgICAgaW5kZXggPSBAaW50ZXJwcmV0ZXIubnVtYmVyVmFsdWVPZihAcGFyYW1zLmluZGV4KVxuICAgICAgICBcbiAgICAgICAgaWYgaW5kZXggPj0gMCBhbmQgaW5kZXggPCBsaXN0Lmxlbmd0aFxuICAgICAgICAgICAgbGlzdC5zcGxpY2UoaW5kZXgsIDEpXG4gICAgXG4gICAgIyMjKlxuICAgICogQG1ldGhvZCBjb21tYW5kTGlzdEluc2VydEF0XG4gICAgKiBAcHJvdGVjdGVkXG4gICAgIyMjICAgICAgICAgIFxuICAgIGNvbW1hbmRMaXN0SW5zZXJ0QXQ6IC0+XG4gICAgICAgIGxpc3QgPSBAaW50ZXJwcmV0ZXIubGlzdE9iamVjdE9mKEBwYXJhbXMubGlzdFZhcmlhYmxlKVxuICAgICAgICBpbmRleCA9IEBpbnRlcnByZXRlci5udW1iZXJWYWx1ZU9mKEBwYXJhbXMuaW5kZXgpXG4gICAgICAgIFxuICAgICAgICBpZiBpbmRleCA+PSAwIGFuZCBpbmRleCA8IGxpc3QubGVuZ3RoXG4gICAgICAgICAgICBzd2l0Y2ggQHBhcmFtcy52YWx1ZVR5cGVcbiAgICAgICAgICAgICAgICB3aGVuIDAgIyBOdW1iZXIgVmFsdWVcbiAgICAgICAgICAgICAgICAgICAgbGlzdC5zcGxpY2UoaW5kZXgsIDAsIEBpbnRlcnByZXRlci5udW1iZXJWYWx1ZU9mKEBwYXJhbXMubnVtYmVyVmFsdWUpKVxuICAgICAgICAgICAgICAgIHdoZW4gMSAjIFN3aXRjaCBWYWx1ZVxuICAgICAgICAgICAgICAgICAgICBsaXN0LnNwbGljZShpbmRleCwgMCwgQGludGVycHJldGVyLmJvb2xlYW5WYWx1ZU9mKEBwYXJhbXMuc3dpdGNoVmFsdWUpKVxuICAgICAgICAgICAgICAgIHdoZW4gMiAjIFRleHQgVmFsdWVcbiAgICAgICAgICAgICAgICAgICAgbGlzdC5zcGxpY2UoaW5kZXgsIDAsIEBpbnRlcnByZXRlci5zdHJpbmdWYWx1ZU9mKEBwYXJhbXMuc3RyaW5nVmFsdWUpKVxuICAgICAgICAgICAgICAgIHdoZW4gMyAjIExpc3QgVmFsdWVcbiAgICAgICAgICAgICAgICAgICAgbGlzdC5zcGxpY2UoaW5kZXgsIDAsIEBpbnRlcnByZXRlci5saXN0T2JqZWN0T2YoQHBhcmFtcy5saXN0VmFsdWUpKVxuICAgICAgICAgICAgICAgICAgICBcbiAgICAgICAgICAgIEBpbnRlcnByZXRlci5zZXRMaXN0T2JqZWN0VG8oQHBhcmFtcy5saXN0VmFyaWFibGUsIGxpc3QpXG4gICAgXG4gICAgIyMjKlxuICAgICogQG1ldGhvZCBjb21tYW5kTGlzdFNldFxuICAgICogQHByb3RlY3RlZFxuICAgICMjIyAgXG4gICAgY29tbWFuZExpc3RTZXQ6IC0+XG4gICAgICAgIGxpc3QgPSBAaW50ZXJwcmV0ZXIubGlzdE9iamVjdE9mKEBwYXJhbXMubGlzdFZhcmlhYmxlKVxuICAgICAgICBpbmRleCA9IEBpbnRlcnByZXRlci5udW1iZXJWYWx1ZU9mKEBwYXJhbXMuaW5kZXgpXG4gICAgICAgIFxuICAgICAgICBpZiBpbmRleCA+PSAwXG4gICAgICAgICAgICBzd2l0Y2ggQHBhcmFtcy52YWx1ZVR5cGVcbiAgICAgICAgICAgICAgICB3aGVuIDAgIyBOdW1iZXIgVmFsdWVcbiAgICAgICAgICAgICAgICAgICAgbGlzdFtpbmRleF0gPSBAaW50ZXJwcmV0ZXIubnVtYmVyVmFsdWVPZihAcGFyYW1zLm51bWJlclZhbHVlKVxuICAgICAgICAgICAgICAgIHdoZW4gMSAjIFN3aXRjaCBWYWx1ZVxuICAgICAgICAgICAgICAgICAgICBsaXN0W2luZGV4XSA9IEBpbnRlcnByZXRlci5ib29sZWFuVmFsdWVPZihAcGFyYW1zLnN3aXRjaFZhbHVlKVxuICAgICAgICAgICAgICAgIHdoZW4gMiAjIFRleHQgVmFsdWVcbiAgICAgICAgICAgICAgICAgICAgbGlzdFtpbmRleF0gPSBAaW50ZXJwcmV0ZXIuc3RyaW5nVmFsdWVPZihAcGFyYW1zLnN0cmluZ1ZhbHVlKVxuICAgICAgICAgICAgICAgIHdoZW4gMyAjIExpc3QgVmFsdWVcbiAgICAgICAgICAgICAgICAgICAgbGlzdFtpbmRleF0gPSBAaW50ZXJwcmV0ZXIubGlzdE9iamVjdE9mKEBwYXJhbXMubGlzdFZhbHVlKVxuICAgICAgICAgICAgICAgICAgICBcbiAgICAgICAgICAgIEBpbnRlcnByZXRlci5zZXRMaXN0T2JqZWN0VG8oQHBhcmFtcy5saXN0VmFyaWFibGUsIGxpc3QpICAgXG4gICAgXG4gICAgIyMjKlxuICAgICogQG1ldGhvZCBjb21tYW5kTGlzdENvcHlcbiAgICAqIEBwcm90ZWN0ZWRcbiAgICAjIyMgICAgICAgICAgXG4gICAgY29tbWFuZExpc3RDb3B5OiAtPlxuICAgICAgICBsaXN0ID0gQGludGVycHJldGVyLmxpc3RPYmplY3RPZihAcGFyYW1zLmxpc3RWYXJpYWJsZSlcbiAgICAgICAgY29weSA9IE9iamVjdC5kZWVwQ29weShsaXN0KVxuICAgICAgICBcbiAgICAgICAgQGludGVycHJldGVyLnNldExpc3RPYmplY3RUbyhAcGFyYW1zLnRhcmdldFZhcmlhYmxlLCBjb3B5KSBcbiAgICAgICAgXG4gICAgIyMjKlxuICAgICogQG1ldGhvZCBjb21tYW5kTGlzdExlbmd0aFxuICAgICogQHByb3RlY3RlZFxuICAgICMjIyBcbiAgICBjb21tYW5kTGlzdExlbmd0aDogLT5cbiAgICAgICAgbGlzdCA9IEBpbnRlcnByZXRlci5saXN0T2JqZWN0T2YoQHBhcmFtcy5saXN0VmFyaWFibGUpXG5cbiAgICAgICAgQGludGVycHJldGVyLnNldE51bWJlclZhbHVlVG8oQHBhcmFtcy50YXJnZXRWYXJpYWJsZSwgbGlzdC5sZW5ndGgpIFxuICAgIFxuICAgICMjIypcbiAgICAqIEBtZXRob2QgY29tbWFuZExpc3RKb2luXG4gICAgKiBAcHJvdGVjdGVkXG4gICAgIyMjICBcbiAgICBjb21tYW5kTGlzdEpvaW46IC0+XG4gICAgICAgIGxpc3QgPSBAaW50ZXJwcmV0ZXIubGlzdE9iamVjdE9mKEBwYXJhbXMubGlzdFZhcmlhYmxlKVxuICAgICAgICB2YWx1ZSA9IGlmIEBwYXJhbXMub3JkZXIgPT0gMCB0aGVuIGxpc3Quam9pbihAcGFyYW1zLnNlcGFyYXRvcnx8XCJcIikgZWxzZSBsaXN0LnJldmVyc2UoKS5qb2luKEBwYXJhbXMuc2VwYXJhdG9yfHxcIlwiKVxuICAgICAgICBcbiAgICAgICAgQGludGVycHJldGVyLnNldFN0cmluZ1ZhbHVlVG8oQHBhcmFtcy50YXJnZXRWYXJpYWJsZSwgdmFsdWUpIFxuICAgICAgICBcbiAgICAjIyMqXG4gICAgKiBAbWV0aG9kIGNvbW1hbmRMaXN0RnJvbVRleHRcbiAgICAqIEBwcm90ZWN0ZWRcbiAgICAjIyMgIFxuICAgIGNvbW1hbmRMaXN0RnJvbVRleHQ6IC0+XG4gICAgICAgIHRleHQgPSBAaW50ZXJwcmV0ZXIuc3RyaW5nVmFsdWVPZihAcGFyYW1zLnRleHRWYXJpYWJsZSlcbiAgICAgICAgc2VwYXJhdG9yID0gQGludGVycHJldGVyLnN0cmluZ1ZhbHVlT2YoQHBhcmFtcy5zZXBhcmF0b3IpXG4gICAgICAgIGxpc3QgPSB0ZXh0LnNwbGl0KHNlcGFyYXRvcilcbiAgICAgICAgXG4gICAgICAgIEBpbnRlcnByZXRlci5zZXRMaXN0T2JqZWN0VG8oQHBhcmFtcy50YXJnZXRWYXJpYWJsZSwgbGlzdCkgXG4gICAgICAgIFxuICAgICMjIypcbiAgICAqIEBtZXRob2QgY29tbWFuZExpc3RTaHVmZmxlXG4gICAgKiBAcHJvdGVjdGVkXG4gICAgIyMjXG4gICAgY29tbWFuZExpc3RTaHVmZmxlOiAtPlxuICAgICAgICBsaXN0ID0gQGludGVycHJldGVyLmxpc3RPYmplY3RPZihAcGFyYW1zLmxpc3RWYXJpYWJsZSlcbiAgICAgICAgaWYgbGlzdC5sZW5ndGggPT0gMCB0aGVuIHJldHVyblxuICAgICAgICBcbiAgICAgICAgZm9yIGkgaW4gW2xpc3QubGVuZ3RoLTEuLjFdXG4gICAgICAgICAgICBqID0gTWF0aC5mbG9vcihNYXRoLnJhbmRvbSgpICogKGkrMSkpXG4gICAgICAgICAgICB0ZW1waSA9IGxpc3RbaV1cbiAgICAgICAgICAgIHRlbXBqID0gbGlzdFtqXVxuICAgICAgICAgICAgbGlzdFtpXSA9IHRlbXBqXG4gICAgICAgICAgICBsaXN0W2pdID0gdGVtcGlcbiAgICAgXG4gICAgIyMjKlxuICAgICogQG1ldGhvZCBjb21tYW5kTGlzdFNvcnRcbiAgICAqIEBwcm90ZWN0ZWRcbiAgICAjIyMgICAgICAgXG4gICAgY29tbWFuZExpc3RTb3J0OiAtPlxuICAgICAgICBsaXN0ID0gQGludGVycHJldGVyLmxpc3RPYmplY3RPZihAcGFyYW1zLmxpc3RWYXJpYWJsZSlcbiAgICAgICAgaWYgbGlzdC5sZW5ndGggPT0gMCB0aGVuIHJldHVyblxuICAgICAgICBcbiAgICAgICAgc3dpdGNoIEBwYXJhbXMuc29ydE9yZGVyXG4gICAgICAgICAgICB3aGVuIDAgIyBBc2NlbmRpbmdcbiAgICAgICAgICAgICAgICBsaXN0LnNvcnQgKGEsIGIpIC0+IFxuICAgICAgICAgICAgICAgICAgICBpZiBhIDwgYiB0aGVuIHJldHVybiAtMVxuICAgICAgICAgICAgICAgICAgICBpZiBhID4gYiB0aGVuIHJldHVybiAxXG4gICAgICAgICAgICAgICAgICAgIHJldHVybiAwXG4gICAgICAgICAgICB3aGVuIDEgIyBEZXNjZW5kaW5nXG4gICAgICAgICAgICAgICAgbGlzdC5zb3J0IChhLCBiKSAtPlxuICAgICAgICAgICAgICAgICAgICBpZiBhID4gYiB0aGVuIHJldHVybiAtMVxuICAgICAgICAgICAgICAgICAgICBpZiBhIDwgYiB0aGVuIHJldHVybiAxXG4gICAgICAgICAgICAgICAgICAgIHJldHVybiAwXG4gICAgIFxuICAgIFxuICAgICMjIypcbiAgICAqIEBtZXRob2QgY29tbWFuZFJlc2V0VmFyaWFibGVzXG4gICAgKiBAcHJvdGVjdGVkXG4gICAgIyMjICAgXG4gICAgY29tbWFuZFJlc2V0VmFyaWFibGVzOiAtPlxuICAgICAgICBzd2l0Y2ggQHBhcmFtcy50YXJnZXRcbiAgICAgICAgICAgIHdoZW4gMCAjIEFsbFxuICAgICAgICAgICAgICAgIHJhbmdlID0gbnVsbFxuICAgICAgICAgICAgd2hlbiAxICMgUmFuZ2VcbiAgICAgICAgICAgICAgICByYW5nZSA9IEBwYXJhbXMucmFuZ2VcbiAgICAgICAgICAgICAgICBcbiAgICAgICAgc3dpdGNoIEBwYXJhbXMuc2NvcGVcbiAgICAgICAgICAgIHdoZW4gMCAjIExvY2FsXG4gICAgICAgICAgICAgICAgaWYgQHBhcmFtcy5zY2VuZVxuICAgICAgICAgICAgICAgICAgICBHYW1lTWFuYWdlci52YXJpYWJsZVN0b3JlLmNsZWFyTG9jYWxWYXJpYWJsZXMoeyBpZDogQHBhcmFtcy5zY2VuZS51aWQgfSwgQHBhcmFtcy50eXBlLCByYW5nZSlcbiAgICAgICAgICAgIHdoZW4gMSAjIEFsbCBMb2NhbHNcbiAgICAgICAgICAgICAgICBHYW1lTWFuYWdlci52YXJpYWJsZVN0b3JlLmNsZWFyTG9jYWxWYXJpYWJsZXMobnVsbCwgQHBhcmFtcy50eXBlLCByYW5nZSlcbiAgICAgICAgICAgIHdoZW4gMiAjIEdsb2JhbFxuICAgICAgICAgICAgICAgIEdhbWVNYW5hZ2VyLnZhcmlhYmxlU3RvcmUuY2xlYXJHbG9iYWxWYXJpYWJsZXMoQHBhcmFtcy50eXBlLCByYW5nZSlcbiAgICAgICAgICAgIHdoZW4gMyAjIFBlcnNpc3RlbnRcbiAgICAgICAgICAgICAgICBHYW1lTWFuYWdlci52YXJpYWJsZVN0b3JlLmNsZWFyUGVyc2lzdGVudFZhcmlhYmxlcyhAcGFyYW1zLnR5cGUsIHJhbmdlKVxuICAgICAgICAgICAgICAgIEdhbWVNYW5hZ2VyLnNhdmVHbG9iYWxEYXRhKClcbiAgICBcbiAgICBcbiAgICAjIyMqXG4gICAgKiBAbWV0aG9kIGNvbW1hbmRDaGFuZ2VWYXJpYWJsZURvbWFpblxuICAgICogQHByb3RlY3RlZFxuICAgICMjIyBcbiAgICBjb21tYW5kQ2hhbmdlVmFyaWFibGVEb21haW46IC0+XG4gICAgICAgIEdhbWVNYW5hZ2VyLnZhcmlhYmxlU3RvcmUuY2hhbmdlRG9tYWluKEBpbnRlcnByZXRlci5zdHJpbmdWYWx1ZU9mKEBwYXJhbXMuZG9tYWluKSlcbiAgICAgICAgXG4gICAgIyMjKlxuICAgICogQG1ldGhvZCBjb21tYW5kQ2hhbmdlRGVjaW1hbFZhcmlhYmxlc1xuICAgICogQHByb3RlY3RlZFxuICAgICMjIyAgICBcbiAgICBjb21tYW5kQ2hhbmdlRGVjaW1hbFZhcmlhYmxlczogLT4gQGludGVycHJldGVyLmNoYW5nZURlY2ltYWxWYXJpYWJsZXMoQHBhcmFtcywgQHBhcmFtcy5yb3VuZE1ldGhvZClcbiAgICBcbiAgICAjIyMqXG4gICAgKiBAbWV0aG9kIGNvbW1hbmRDaGFuZ2VOdW1iZXJWYXJpYWJsZXNcbiAgICAqIEBwcm90ZWN0ZWRcbiAgICAjIyMgXG4gICAgY29tbWFuZENoYW5nZU51bWJlclZhcmlhYmxlczogLT5cbiAgICAgICAgc291cmNlID0gMFxuICAgICAgICBcbiAgICAgICAgc3dpdGNoIEBwYXJhbXMuc291cmNlXG4gICAgICAgICAgICB3aGVuIDAgIyBDb25zdGFudCBWYWx1ZSAvIFZhcmlhYmxlIFZhbHVlXG4gICAgICAgICAgICAgICAgc291cmNlID0gQGludGVycHJldGVyLm51bWJlclZhbHVlT2YoQHBhcmFtcy5zb3VyY2VWYWx1ZSlcbiAgICAgICAgICAgIHdoZW4gMSAjIFJhbmRvbVxuICAgICAgICAgICAgICAgIHN0YXJ0ID0gQGludGVycHJldGVyLm51bWJlclZhbHVlT2YoQHBhcmFtcy5zb3VyY2VSYW5kb20uc3RhcnQpXG4gICAgICAgICAgICAgICAgZW5kID0gQGludGVycHJldGVyLm51bWJlclZhbHVlT2YoQHBhcmFtcy5zb3VyY2VSYW5kb20uZW5kKVxuICAgICAgICAgICAgICAgIGRpZmYgPSBlbmQgLSBzdGFydFxuICAgICAgICAgICAgICAgIHNvdXJjZSA9IE1hdGguZmxvb3Ioc3RhcnQgKyBNYXRoLnJhbmRvbSgpICogKGRpZmYrMSkpXG4gICAgICAgICAgICB3aGVuIDIgIyBQb2ludGVyXG4gICAgICAgICAgICAgICAgc291cmNlID0gQGludGVycHJldGVyLm51bWJlclZhbHVlQXRJbmRleChAcGFyYW1zLnNvdXJjZVNjb3BlLCBAaW50ZXJwcmV0ZXIubnVtYmVyVmFsdWVPZihAcGFyYW1zLnNvdXJjZVJlZmVyZW5jZSktMSwgQHBhcmFtcy5zb3VyY2VSZWZlcmVuY2VEb21haW4pXG4gICAgICAgICAgICB3aGVuIDMgIyBHYW1lIERhdGFcbiAgICAgICAgICAgICAgICBzb3VyY2UgPSBAaW50ZXJwcmV0ZXIubnVtYmVyVmFsdWVPZkdhbWVEYXRhKEBwYXJhbXMuc291cmNlVmFsdWUxKVxuICAgICAgICAgICAgd2hlbiA0ICMgRGF0YWJhc2UgRGF0YVxuICAgICAgICAgICAgICAgIHNvdXJjZSA9IEBpbnRlcnByZXRlci5udW1iZXJWYWx1ZU9mRGF0YWJhc2VEYXRhKEBwYXJhbXMuc291cmNlVmFsdWUxKVxuICAgICAgICAgICAgXG4gICAgICAgIHN3aXRjaCBAcGFyYW1zLnRhcmdldFxuICAgICAgICAgICAgd2hlbiAwICMgVmFyaWFibGVcbiAgICAgICAgICAgICAgICBzd2l0Y2ggQHBhcmFtcy5vcGVyYXRpb25cbiAgICAgICAgICAgICAgICAgICAgd2hlbiAwICMgU2V0XG4gICAgICAgICAgICAgICAgICAgICAgICBAaW50ZXJwcmV0ZXIuc2V0TnVtYmVyVmFsdWVUbyhAcGFyYW1zLnRhcmdldFZhcmlhYmxlLCBzb3VyY2UpXG4gICAgICAgICAgICAgICAgICAgIHdoZW4gMSAjIEFkZFxuICAgICAgICAgICAgICAgICAgICAgICAgQGludGVycHJldGVyLnNldE51bWJlclZhbHVlVG8oQHBhcmFtcy50YXJnZXRWYXJpYWJsZSwgQGludGVycHJldGVyLm51bWJlclZhbHVlT2YoQHBhcmFtcy50YXJnZXRWYXJpYWJsZSkgKyBzb3VyY2UpXG4gICAgICAgICAgICAgICAgICAgIHdoZW4gMiAjIFN1YlxuICAgICAgICAgICAgICAgICAgICAgICAgQGludGVycHJldGVyLnNldE51bWJlclZhbHVlVG8oQHBhcmFtcy50YXJnZXRWYXJpYWJsZSwgQGludGVycHJldGVyLm51bWJlclZhbHVlT2YoQHBhcmFtcy50YXJnZXRWYXJpYWJsZSkgLSBzb3VyY2UpXG4gICAgICAgICAgICAgICAgICAgIHdoZW4gMyAjIE11bFxuICAgICAgICAgICAgICAgICAgICAgICAgQGludGVycHJldGVyLnNldE51bWJlclZhbHVlVG8oQHBhcmFtcy50YXJnZXRWYXJpYWJsZSwgQGludGVycHJldGVyLm51bWJlclZhbHVlT2YoQHBhcmFtcy50YXJnZXRWYXJpYWJsZSkgKiBzb3VyY2UpXG4gICAgICAgICAgICAgICAgICAgIHdoZW4gNCAjIERpdlxuICAgICAgICAgICAgICAgICAgICAgICAgQGludGVycHJldGVyLnNldE51bWJlclZhbHVlVG8oQHBhcmFtcy50YXJnZXRWYXJpYWJsZSwgTWF0aC5mbG9vcihAaW50ZXJwcmV0ZXIubnVtYmVyVmFsdWVPZihAcGFyYW1zLnRhcmdldFZhcmlhYmxlKSAvIHNvdXJjZSkpXG4gICAgICAgICAgICAgICAgICAgIHdoZW4gNSAjIE1vZFxuICAgICAgICAgICAgICAgICAgICAgICAgQGludGVycHJldGVyLnNldE51bWJlclZhbHVlVG8oQHBhcmFtcy50YXJnZXRWYXJpYWJsZSwgQGludGVycHJldGVyLm51bWJlclZhbHVlT2YoQHBhcmFtcy50YXJnZXRWYXJpYWJsZSkgJSBzb3VyY2UpXG4gICAgICAgICAgICB3aGVuIDEgIyBSYW5nZVxuICAgICAgICAgICAgICAgIHNjb3BlID0gQHBhcmFtcy50YXJnZXRTY29wZVxuICAgICAgICAgICAgICAgIHN0YXJ0ID0gQHBhcmFtcy50YXJnZXRSYW5nZS5zdGFydC0xXG4gICAgICAgICAgICAgICAgZW5kID0gQHBhcmFtcy50YXJnZXRSYW5nZS5lbmQtMVxuICAgICAgICAgICAgICAgIGZvciBpIGluIFtzdGFydC4uZW5kXVxuICAgICAgICAgICAgICAgICAgICBzd2l0Y2ggQHBhcmFtcy5vcGVyYXRpb25cbiAgICAgICAgICAgICAgICAgICAgICAgIHdoZW4gMCAjIFNldFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIEBpbnRlcnByZXRlci5zZXROdW1iZXJWYWx1ZUF0SW5kZXgoc2NvcGUsIGksIHNvdXJjZSlcbiAgICAgICAgICAgICAgICAgICAgICAgIHdoZW4gMSAjIEFkZFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIEBpbnRlcnByZXRlci5zZXROdW1iZXJWYWx1ZUF0SW5kZXgoc2NvcGUsIGksIEBpbnRlcnByZXRlci5udW1iZXJWYWx1ZUF0SW5kZXgoc2NvcGUsIGkpICsgc291cmNlKVxuICAgICAgICAgICAgICAgICAgICAgICAgd2hlbiAyICMgU3ViXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgQGludGVycHJldGVyLnNldE51bWJlclZhbHVlQXRJbmRleChzY29wZSwgaSwgQGludGVycHJldGVyLm51bWJlclZhbHVlQXRJbmRleChzY29wZSwgaSkgLSBzb3VyY2UpXG4gICAgICAgICAgICAgICAgICAgICAgICB3aGVuIDMgIyBNdWxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBAaW50ZXJwcmV0ZXIuc2V0TnVtYmVyVmFsdWVBdEluZGV4KHNjb3BlLCBpLCBAaW50ZXJwcmV0ZXIubnVtYmVyVmFsdWVBdEluZGV4KHNjb3BlLCBpKSAqIHNvdXJjZSlcbiAgICAgICAgICAgICAgICAgICAgICAgIHdoZW4gNCAjIERpdlxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIEBpbnRlcnByZXRlci5zZXROdW1iZXJWYWx1ZUF0SW5kZXgoc2NvcGUsIGksIE1hdGguZmxvb3IoQGludGVycHJldGVyLm51bWJlclZhbHVlQXRJbmRleChzY29wZSwgaSkgLyBzb3VyY2UpKVxuICAgICAgICAgICAgICAgICAgICAgICAgd2hlbiA1ICMgTW9kXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgQGludGVycHJldGVyLnNldE51bWJlclZhbHVlQXRJbmRleChzY29wZSwgaSwgQGludGVycHJldGVyLm51bWJlclZhbHVlQXRJbmRleChzY29wZSwgaSkgJSBzb3VyY2UpXG4gICAgICAgICAgICB3aGVuIDIgIyBSZWZlcmVuY2VcbiAgICAgICAgICAgICAgICBpbmRleCA9IEBpbnRlcnByZXRlci5udW1iZXJWYWx1ZU9mKEBwYXJhbXMudGFyZ2V0UmVmZXJlbmNlKSAtIDFcbiAgICAgICAgICAgICAgICBzd2l0Y2ggQHBhcmFtcy5vcGVyYXRpb25cbiAgICAgICAgICAgICAgICAgICAgd2hlbiAwICMgU2V0XG4gICAgICAgICAgICAgICAgICAgICAgICBAaW50ZXJwcmV0ZXIuc2V0TnVtYmVyVmFsdWVBdEluZGV4KEBwYXJhbXMudGFyZ2V0U2NvcGUsIGluZGV4LCBzb3VyY2UsIEBwYXJhbXMudGFyZ2V0UmVmZXJlbmNlRG9tYWluKVxuICAgICAgICAgICAgICAgICAgICB3aGVuIDEgIyBBZGRcbiAgICAgICAgICAgICAgICAgICAgICAgIEBpbnRlcnByZXRlci5zZXROdW1iZXJWYWx1ZUF0SW5kZXgoQHBhcmFtcy50YXJnZXRTY29wZSwgaW5kZXgsIEBpbnRlcnByZXRlci5udW1iZXJWYWx1ZUF0SW5kZXgoQHBhcmFtcy50YXJnZXRTY29wZSwgaW5kZXgsIEBwYXJhbXMudGFyZ2V0UmVmZXJlbmNlRG9tYWluKSArIHNvdXJjZSwgQHBhcmFtcy50YXJnZXRSZWZlcmVuY2VEb21haW4pXG4gICAgICAgICAgICAgICAgICAgIHdoZW4gMiAjIFN1YlxuICAgICAgICAgICAgICAgICAgICAgICAgQGludGVycHJldGVyLnNldE51bWJlclZhbHVlQXRJbmRleChAcGFyYW1zLnRhcmdldFNjb3BlLCBpbmRleCwgQGludGVycHJldGVyLm51bWJlclZhbHVlQXRJbmRleChAcGFyYW1zLnRhcmdldFNjb3BlLCBpbmRleCwgQHBhcmFtcy50YXJnZXRSZWZlcmVuY2VEb21haW4pIC0gc291cmNlLCBAcGFyYW1zLnRhcmdldFJlZmVyZW5jZURvbWFpbilcbiAgICAgICAgICAgICAgICAgICAgd2hlbiAzICMgTXVsXG4gICAgICAgICAgICAgICAgICAgICAgICBAaW50ZXJwcmV0ZXIuc2V0TnVtYmVyVmFsdWVBdEluZGV4KEBwYXJhbXMudGFyZ2V0U2NvcGUsIGluZGV4LCBAaW50ZXJwcmV0ZXIubnVtYmVyVmFsdWVBdEluZGV4KEBwYXJhbXMudGFyZ2V0U2NvcGUsIGluZGV4LCBAcGFyYW1zLnRhcmdldFJlZmVyZW5jZURvbWFpbikgKiBzb3VyY2UsIEBwYXJhbXMudGFyZ2V0UmVmZXJlbmNlRG9tYWluKVxuICAgICAgICAgICAgICAgICAgICB3aGVuIDQgIyBEaXZcbiAgICAgICAgICAgICAgICAgICAgICAgIEBpbnRlcnByZXRlci5zZXROdW1iZXJWYWx1ZUF0SW5kZXgoQHBhcmFtcy50YXJnZXRTY29wZSwgaW5kZXgsIE1hdGguZmxvb3IoQGludGVycHJldGVyLm51bWJlclZhbHVlQXRJbmRleChAcGFyYW1zLnRhcmdldFNjb3BlLCBpbmRleCwgQHBhcmFtcy50YXJnZXRSZWZlcmVuY2VEb21haW4pIC8gc291cmNlKSwgQHBhcmFtcy50YXJnZXRSZWZlcmVuY2VEb21haW4pXG4gICAgICAgICAgICAgICAgICAgIHdoZW4gNSAjIE1vZFxuICAgICAgICAgICAgICAgICAgICAgICAgQGludGVycHJldGVyLnNldE51bWJlclZhbHVlQXRJbmRleChAcGFyYW1zLnRhcmdldFNjb3BlLCBpbmRleCwgQGludGVycHJldGVyLm51bWJlclZhbHVlQXRJbmRleChAcGFyYW1zLnRhcmdldFNjb3BlLCBpbmRleCwgQHBhcmFtcy50YXJnZXRSZWZlcmVuY2VEb21haW4pICUgc291cmNlLCBAcGFyYW1zLnRhcmdldFJlZmVyZW5jZURvbWFpbilcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBcbiAgICAgICAgcmV0dXJuIG51bGxcbiAgICBcbiAgICAjIyMqXG4gICAgKiBAbWV0aG9kIGNvbW1hbmRDaGFuZ2VCb29sZWFuVmFyaWFibGVzXG4gICAgKiBAcHJvdGVjdGVkXG4gICAgIyMjIFxuICAgIGNvbW1hbmRDaGFuZ2VCb29sZWFuVmFyaWFibGVzOiAtPlxuICAgICAgICBzb3VyY2UgPSBAaW50ZXJwcmV0ZXIuYm9vbGVhblZhbHVlT2YoQHBhcmFtcy52YWx1ZSlcblxuICAgICAgICBzd2l0Y2ggQHBhcmFtcy50YXJnZXRcbiAgICAgICAgICAgIHdoZW4gMCAjIFZhcmlhYmxlXG4gICAgICAgICAgICAgICAgaWYgQHBhcmFtcy52YWx1ZSA9PSAyICMgVHJpZ2dlclxuICAgICAgICAgICAgICAgICAgICB0YXJnZXRWYWx1ZSA9IEBpbnRlcnByZXRlci5ib29sZWFuVmFsdWVPZihAcGFyYW1zLnRhcmdldFZhcmlhYmxlKVxuICAgICAgICAgICAgICAgICAgICBAaW50ZXJwcmV0ZXIuc2V0Qm9vbGVhblZhbHVlVG8oQHBhcmFtcy50YXJnZXRWYXJpYWJsZSwgaWYgdGFyZ2V0VmFsdWUgdGhlbiBmYWxzZSBlbHNlIHRydWUpXG4gICAgICAgICAgICAgICAgZWxzZVxuICAgICAgICAgICAgICAgICAgICBAaW50ZXJwcmV0ZXIuc2V0Qm9vbGVhblZhbHVlVG8oQHBhcmFtcy50YXJnZXRWYXJpYWJsZSwgc291cmNlKVxuICAgICAgICAgICAgd2hlbiAxICMgUmFuZ2VcbiAgICAgICAgICAgICAgICB2YXJpYWJsZSA9IHsgaW5kZXg6IDAsIHNjb3BlOiBAcGFyYW1zLnRhcmdldFJhbmdlU2NvcGUgfVxuICAgICAgICAgICAgICAgIGZvciBpIGluIFsoQHBhcmFtcy5yYW5nZVN0YXJ0LTEpLi4oQHBhcmFtcy5yYW5nZUVuZC0xKV1cbiAgICAgICAgICAgICAgICAgICAgdmFyaWFibGUuaW5kZXggPSBpXG4gICAgICAgICAgICAgICAgICAgIGlmIEBwYXJhbXMudmFsdWUgPT0gMiAjIFRyaWdnZXJcbiAgICAgICAgICAgICAgICAgICAgICAgIHRhcmdldFZhbHVlID0gQGludGVycHJldGVyLmJvb2xlYW5WYWx1ZU9mKHZhcmlhYmxlKVxuICAgICAgICAgICAgICAgICAgICAgICAgQGludGVycHJldGVyLnNldEJvb2xlYW5WYWx1ZVRvKHZhcmlhYmxlLCBpZiB0YXJnZXRWYWx1ZSB0aGVuIGZhbHNlIGVsc2UgdHJ1ZSlcbiAgICAgICAgICAgICAgICAgICAgZWxzZVxuICAgICAgICAgICAgICAgICAgICAgICAgQGludGVycHJldGVyLnNldEJvb2xlYW5WYWx1ZVRvKHZhcmlhYmxlLCBzb3VyY2UpXG4gICAgICAgICAgICB3aGVuIDIgIyBSZWZlcmVuY2VcbiAgICAgICAgICAgICAgICBpbmRleCA9IEBpbnRlcnByZXRlci5udW1iZXJWYWx1ZU9mKEBwYXJhbXMudGFyZ2V0UmVmZXJlbmNlKSAtIDFcbiAgICAgICAgICAgICAgICBAaW50ZXJwcmV0ZXIuc2V0Qm9vbGVhblZhbHVlQXRJbmRleChAcGFyYW1zLnRhcmdldFJhbmdlU2NvcGUsIGluZGV4LCBzb3VyY2UsIEBwYXJhbXMudGFyZ2V0UmVmZXJlbmNlRG9tYWluKVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIFxuICAgICAgICByZXR1cm4gbnVsbFxuICAgICAgICBcbiAgICAjIyMqXG4gICAgKiBAbWV0aG9kIGNvbW1hbmRDaGFuZ2VTdHJpbmdWYXJpYWJsZXNcbiAgICAqIEBwcm90ZWN0ZWRcbiAgICAjIyMgXG4gICAgY29tbWFuZENoYW5nZVN0cmluZ1ZhcmlhYmxlczogLT5cbiAgICAgICAgc291cmNlID0gXCJcIlxuICAgICAgICBzd2l0Y2ggQHBhcmFtcy5zb3VyY2VcbiAgICAgICAgICAgIHdoZW4gMCAjIENvbnN0YW50IFRleHRcbiAgICAgICAgICAgICAgICBzb3VyY2UgPSBsY3MoQHBhcmFtcy50ZXh0VmFsdWUpXG4gICAgICAgICAgICB3aGVuIDEgIyBWYXJpYWJsZVxuICAgICAgICAgICAgICAgIHNvdXJjZSA9IEBpbnRlcnByZXRlci5zdHJpbmdWYWx1ZU9mKEBwYXJhbXMuc291cmNlVmFyaWFibGUpXG4gICAgICAgICAgICB3aGVuIDIgIyBEYXRhYmFzZSBEYXRhXG4gICAgICAgICAgICAgICAgc291cmNlID0gQGludGVycHJldGVyLnN0cmluZ1ZhbHVlT2ZEYXRhYmFzZURhdGEoQHBhcmFtcy5kYXRhYmFzZURhdGEpXG4gICAgICAgICAgICB3aGVuIDIgIyBTY3JpcHRcbiAgICAgICAgICAgICAgICB0cnlcbiAgICAgICAgICAgICAgICAgICAgc291cmNlID0gZXZhbChAcGFyYW1zLnNjcmlwdClcbiAgICAgICAgICAgICAgICBjYXRjaCBleFxuICAgICAgICAgICAgICAgICAgICBzb3VyY2UgPSBcIkVSUjogXCIgKyBleC5tZXNzYWdlXG4gICAgICAgICAgICBlbHNlXG4gICAgICAgICAgICAgICAgc291cmNlID0gbGNzKEBwYXJhbXMudGV4dFZhbHVlKVxuICAgICAgICAgICAgXG4gICAgICAgIHN3aXRjaCBAcGFyYW1zLnRhcmdldFxuICAgICAgICAgICAgd2hlbiAwICMgVmFyaWFibGVcbiAgICAgICAgICAgICAgICBzd2l0Y2ggQHBhcmFtcy5vcGVyYXRpb25cbiAgICAgICAgICAgICAgICAgICAgd2hlbiAwICMgU2V0XG4gICAgICAgICAgICAgICAgICAgICAgICBAaW50ZXJwcmV0ZXIuc2V0U3RyaW5nVmFsdWVUbyhAcGFyYW1zLnRhcmdldFZhcmlhYmxlLCBzb3VyY2UpXG4gICAgICAgICAgICAgICAgICAgIHdoZW4gMSAjIEFkZFxuICAgICAgICAgICAgICAgICAgICAgICAgQGludGVycHJldGVyLnNldFN0cmluZ1ZhbHVlVG8oQHBhcmFtcy50YXJnZXRWYXJpYWJsZSwgQGludGVycHJldGVyLnN0cmluZ1ZhbHVlT2YoQHBhcmFtcy50YXJnZXRWYXJpYWJsZSkgKyBzb3VyY2UpXG4gICAgICAgICAgICAgICAgICAgIHdoZW4gMiAjIFRvIFVwcGVyLUNhc2VcbiAgICAgICAgICAgICAgICAgICAgICAgIEBpbnRlcnByZXRlci5zZXRTdHJpbmdWYWx1ZVRvKEBwYXJhbXMudGFyZ2V0VmFyaWFibGUsIEBpbnRlcnByZXRlci5zdHJpbmdWYWx1ZU9mKEBwYXJhbXMudGFyZ2V0VmFyaWFibGUpLnRvVXBwZXJDYXNlKCkpXG4gICAgICAgICAgICAgICAgICAgIHdoZW4gMyAjIFRvIExvd2VyLUNhc2VcbiAgICAgICAgICAgICAgICAgICAgICAgIEBpbnRlcnByZXRlci5zZXRTdHJpbmdWYWx1ZVRvKEBwYXJhbXMudGFyZ2V0VmFyaWFibGUsIEBpbnRlcnByZXRlci5zdHJpbmdWYWx1ZU9mKEBwYXJhbXMudGFyZ2V0VmFyaWFibGUpLnRvTG93ZXJDYXNlKCkpXG5cbiAgICAgICAgICAgIHdoZW4gMSAjIFJhbmdlXG4gICAgICAgICAgICAgICAgdmFyaWFibGUgPSB7IGluZGV4OiAwLCBzY29wZTogQHBhcmFtcy50YXJnZXRSYW5nZVNjb3BlIH1cbiAgICAgICAgICAgICAgICBmb3IgaSBpbiBbQHBhcmFtcy5yYW5nZVN0YXJ0LTEuLkBwYXJhbXMucmFuZ2VFbmQtMV1cbiAgICAgICAgICAgICAgICAgICAgdmFyaWFibGUuaW5kZXggPSBpXG4gICAgICAgICAgICAgICAgICAgIHN3aXRjaCBAcGFyYW1zLm9wZXJhdGlvblxuICAgICAgICAgICAgICAgICAgICAgICAgd2hlbiAwICMgU2V0XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgQGludGVycHJldGVyLnNldFN0cmluZ1ZhbHVlVG8odmFyaWFibGUsIHNvdXJjZSlcbiAgICAgICAgICAgICAgICAgICAgICAgIHdoZW4gMSAjIEFkZFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIEBpbnRlcnByZXRlci5zZXRTdHJpbmdWYWx1ZVRvKHZhcmlhYmxlLCBAaW50ZXJwcmV0ZXIuc3RyaW5nVmFsdWVPZih2YXJpYWJsZSkgKyBzb3VyY2UpXG4gICAgICAgICAgICAgICAgICAgICAgICB3aGVuIDIgIyBUbyBVcHBlci1DYXNlXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgQGludGVycHJldGVyLnNldFN0cmluZ1ZhbHVlVG8odmFyaWFibGUsIEBpbnRlcnByZXRlci5zdHJpbmdWYWx1ZU9mKHZhcmlhYmxlKS50b1VwcGVyQ2FzZSgpKVxuICAgICAgICAgICAgICAgICAgICAgICAgd2hlbiAzICMgVG8gTG93ZXItQ2FzZVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIEBpbnRlcnByZXRlci5zZXRTdHJpbmdWYWx1ZVRvKHZhcmlhYmxlLCBAaW50ZXJwcmV0ZXIuc3RyaW5nVmFsdWVPZih2YXJpYWJsZSkudG9Mb3dlckNhc2UoKSlcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBcbiAgICAgICAgICAgIHdoZW4gMiAjIFJlZmVyZW5jZVxuICAgICAgICAgICAgICAgIGluZGV4ID0gQGludGVycHJldGVyLm51bWJlclZhbHVlT2YoQHBhcmFtcy50YXJnZXRSZWZlcmVuY2UpIC0gMVxuICAgICAgICAgICAgICAgIHN3aXRjaCBAcGFyYW1zLm9wZXJhdGlvblxuICAgICAgICAgICAgICAgICAgICB3aGVuIDAgIyBTZXRcbiAgICAgICAgICAgICAgICAgICAgICAgIEBpbnRlcnByZXRlci5zZXRTdHJpbmdWYWx1ZUF0SW5kZXgoQHBhcmFtcy50YXJnZXRSYW5nZVNjb3BlLCBpbmRleCwgc291cmNlLCBAcGFyYW1zLnRhcmdldFJlZmVyZW5jZURvbWFpbilcbiAgICAgICAgICAgICAgICAgICAgd2hlbiAxICMgQWRkXG4gICAgICAgICAgICAgICAgICAgICAgICB0YXJnZXRWYWx1ZSA9IEBpbnRlcnByZXRlci5zdHJpbmdWYWx1ZUF0SW5kZXgoQHBhcmFtcy50YXJnZXRSYW5nZVNjb3BlLCBpbmRleCwgQHBhcmFtcy50YXJnZXRSZWZlcmVuY2VEb21haW4pXG4gICAgICAgICAgICAgICAgICAgICAgICBAaW50ZXJwcmV0ZXIuc2V0U3RyaW5nVmFsdWVBdEluZGV4KEBwYXJhbXMudGFyZ2V0UmFuZ2VTY29wZSwgaW5kZXgsIHRhcmdldFZhbHVlICsgc291cmNlLCBAcGFyYW1zLnRhcmdldFJlZmVyZW5jZURvbWFpbilcbiAgICAgICAgICAgICAgICAgICAgd2hlbiAyICMgVG8gVXBwZXItQ2FzZVxuICAgICAgICAgICAgICAgICAgICAgICAgdGFyZ2V0VmFsdWUgPSBAaW50ZXJwcmV0ZXIuc3RyaW5nVmFsdWVBdEluZGV4KEBwYXJhbXMudGFyZ2V0UmFuZ2VTY29wZSwgaW5kZXgsIEBwYXJhbXMudGFyZ2V0UmVmZXJlbmNlRG9tYWluKVxuICAgICAgICAgICAgICAgICAgICAgICAgQGludGVycHJldGVyLnNldFN0cmluZ1ZhbHVlQXRJbmRleChAcGFyYW1zLnRhcmdldFJhbmdlU2NvcGUsIGluZGV4LCB0YXJnZXRWYWx1ZS50b1VwcGVyQ2FzZSgpLCBAcGFyYW1zLnRhcmdldFJlZmVyZW5jZURvbWFpbilcbiAgICAgICAgICAgICAgICAgICAgd2hlbiAzICMgVG8gTG93ZXItQ2FzZVxuICAgICAgICAgICAgICAgICAgICAgICAgdGFyZ2V0VmFsdWUgPSBAaW50ZXJwcmV0ZXIuc3RyaW5nVmFsdWVBdEluZGV4KEBwYXJhbXMudGFyZ2V0UmFuZ2VTY29wZSwgaW5kZXgsIEBwYXJhbXMudGFyZ2V0UmVmZXJlbmNlRG9tYWluKVxuICAgICAgICAgICAgICAgICAgICAgICAgQGludGVycHJldGVyLnNldFN0cmluZ1ZhbHVlVG8oQHBhcmFtcy50YXJnZXRSYW5nZVNjb3BlLCBpbmRleCwgdGFyZ2V0VmFsdWUudG9Mb3dlckNhc2UoKSwgQHBhcmFtcy50YXJnZXRSZWZlcmVuY2VEb21haW4pXG4gICAgICAgIHJldHVybiBudWxsXG4gICAgIFxuICAgICMjIypcbiAgICAqIEBtZXRob2QgY29tbWFuZENoZWNrU3dpdGNoXG4gICAgKiBAcHJvdGVjdGVkXG4gICAgIyMjICAgICBcbiAgICBjb21tYW5kQ2hlY2tTd2l0Y2g6IC0+XG4gICAgICAgIHJlc3VsdCA9IEBpbnRlcnByZXRlci5ib29sZWFuVmFsdWVPZihAcGFyYW1zLnRhcmdldFZhcmlhYmxlKSAmJiBAcGFyYW1zLnZhbHVlXG4gICAgICAgIGlmIHJlc3VsdFxuICAgICAgICAgICAgQGludGVycHJldGVyLnBvaW50ZXIgPSBAcGFyYW1zLmxhYmVsSW5kZXhcbiAgICBcbiAgICBcbiAgICAjIyMqXG4gICAgKiBAbWV0aG9kIGNvbW1hbmROdW1iZXJDb25kaXRpb25cbiAgICAqIEBwcm90ZWN0ZWRcbiAgICAjIyMgICAgICAgICBcbiAgICBjb21tYW5kTnVtYmVyQ29uZGl0aW9uOiAtPlxuICAgICAgICByZXN1bHQgPSBAaW50ZXJwcmV0ZXIuY29tcGFyZShAaW50ZXJwcmV0ZXIubnVtYmVyVmFsdWVPZihAcGFyYW1zLnRhcmdldFZhcmlhYmxlKSwgQGludGVycHJldGVyLm51bWJlclZhbHVlT2YoQHBhcmFtcy52YWx1ZSksIEBwYXJhbXMub3BlcmF0aW9uKVxuICAgICAgICBAaW50ZXJwcmV0ZXIuY29uZGl0aW9uc1tAaW50ZXJwcmV0ZXIuaW5kZW50XSA9IHJlc3VsdFxuICAgICAgICBcbiAgICAgICAgaWYgcmVzdWx0XG4gICAgICAgICAgICBAaW50ZXJwcmV0ZXIuaW5kZW50KytcbiAgICBcbiAgICAjIyMqXG4gICAgKiBAbWV0aG9kIGNvbW1hbmRDb25kaXRpb25cbiAgICAqIEBwcm90ZWN0ZWRcbiAgICAjIyMgICAgICAgICAgXG4gICAgY29tbWFuZENvbmRpdGlvbjogLT5cbiAgICAgICAgc3dpdGNoIEBwYXJhbXMudmFsdWVUeXBlXG4gICAgICAgICAgICB3aGVuIDAgIyBOdW1iZXJcbiAgICAgICAgICAgICAgICByZXN1bHQgPSBAaW50ZXJwcmV0ZXIuY29tcGFyZShAaW50ZXJwcmV0ZXIubnVtYmVyVmFsdWVPZihAcGFyYW1zLnZhcmlhYmxlKSwgQGludGVycHJldGVyLm51bWJlclZhbHVlT2YoQHBhcmFtcy5udW1iZXJWYWx1ZSksIEBwYXJhbXMub3BlcmF0aW9uKVxuICAgICAgICAgICAgd2hlbiAxICMgU3dpdGNoXG4gICAgICAgICAgICAgICAgcmVzdWx0ID0gQGludGVycHJldGVyLmNvbXBhcmUoQGludGVycHJldGVyLmJvb2xlYW5WYWx1ZU9mKEBwYXJhbXMudmFyaWFibGUpLCBAaW50ZXJwcmV0ZXIuYm9vbGVhblZhbHVlT2YoQHBhcmFtcy5zd2l0Y2hWYWx1ZSksIEBwYXJhbXMub3BlcmF0aW9uKVxuICAgICAgICAgICAgd2hlbiAyICMgVGV4dFxuICAgICAgICAgICAgICAgIHJlc3VsdCA9IEBpbnRlcnByZXRlci5jb21wYXJlKGxjcyhAaW50ZXJwcmV0ZXIuc3RyaW5nVmFsdWVPZihAcGFyYW1zLnZhcmlhYmxlKSksIGxjcyhAaW50ZXJwcmV0ZXIuc3RyaW5nVmFsdWVPZihAcGFyYW1zLnRleHRWYWx1ZSkpLCBAcGFyYW1zLm9wZXJhdGlvbilcbiAgICAgICAgXG4gICAgICAgIEBpbnRlcnByZXRlci5jb25kaXRpb25zW0BpbnRlcnByZXRlci5pbmRlbnRdID0gcmVzdWx0XG4gICAgICAgIGlmIHJlc3VsdFxuICAgICAgICAgICAgQGludGVycHJldGVyLmluZGVudCsrICAgIFxuICAgICBcbiAgICAjIyMqXG4gICAgKiBAbWV0aG9kIGNvbW1hbmRDb25kaXRpb25FbHNlXG4gICAgKiBAcHJvdGVjdGVkXG4gICAgIyMjICAgICAgICAgXG4gICAgY29tbWFuZENvbmRpdGlvbkVsc2U6IC0+XG4gICAgICAgIGlmIG5vdCBAaW50ZXJwcmV0ZXIuY29uZGl0aW9uc1tAaW50ZXJwcmV0ZXIuaW5kZW50XVxuICAgICAgICAgICAgQGludGVycHJldGVyLmluZGVudCsrXG4gICAgXG4gICAgIyMjKlxuICAgICogQG1ldGhvZCBjb21tYW5kQ29uZGl0aW9uRWxzZUlmXG4gICAgKiBAcHJvdGVjdGVkXG4gICAgIyMjICAgICAgICBcbiAgICBjb21tYW5kQ29uZGl0aW9uRWxzZUlmOiAtPlxuICAgICAgICBpZiBub3QgQGludGVycHJldGVyLmNvbmRpdGlvbnNbQGludGVycHJldGVyLmluZGVudF1cbiAgICAgICAgICAgIEBpbnRlcnByZXRlci5jb21tYW5kQ29uZGl0aW9uLmNhbGwodGhpcylcbiAgICBcbiAgICAjIyMqXG4gICAgKiBAbWV0aG9kIGNvbW1hbmRDaGVja051bWJlclZhcmlhYmxlXG4gICAgKiBAcHJvdGVjdGVkXG4gICAgIyMjICAgICAgICBcbiAgICBjb21tYW5kQ2hlY2tOdW1iZXJWYXJpYWJsZTogLT5cbiAgICAgICAgcmVzdWx0ID0gQGludGVycHJldGVyLmNvbXBhcmUoQGludGVycHJldGVyLm51bWJlclZhbHVlT2YoQHBhcmFtcy50YXJnZXRWYXJpYWJsZSksIEBpbnRlcnByZXRlci5udW1iZXJWYWx1ZU9mKEBwYXJhbXMudmFsdWUpLCBAcGFyYW1zLm9wZXJhdGlvbilcbiAgICAgICAgaWYgcmVzdWx0XG4gICAgICAgICAgICBAaW50ZXJwcmV0ZXIucG9pbnRlciA9IEBwYXJhbXMubGFiZWxJbmRleFxuICAgIFxuICAgICMjIypcbiAgICAqIEBtZXRob2QgY29tbWFuZENoZWNrVGV4dFZhcmlhYmxlXG4gICAgKiBAcHJvdGVjdGVkXG4gICAgIyMjICAgICAgICBcbiAgICBjb21tYW5kQ2hlY2tUZXh0VmFyaWFibGU6IC0+XG4gICAgICAgIHJlc3VsdCA9IG5vXG4gICAgICAgIHRleHQxID0gQGludGVycHJldGVyLnN0cmluZ1ZhbHVlT2YoQHBhcmFtcy50YXJnZXRWYXJpYWJsZSlcbiAgICAgICAgdGV4dDIgPSBAaW50ZXJwcmV0ZXIuc3RyaW5nVmFsdWVPZihAcGFyYW1zLnZhbHVlKVxuICAgICAgICBzd2l0Y2ggQHBhcmFtcy5vcGVyYXRpb25cbiAgICAgICAgICAgIHdoZW4gMCB0aGVuIHJlc3VsdCA9IHRleHQxID09IHRleHQyXG4gICAgICAgICAgICB3aGVuIDEgdGhlbiByZXN1bHQgPSB0ZXh0MSAhPSB0ZXh0MlxuICAgICAgICAgICAgd2hlbiAyIHRoZW4gcmVzdWx0ID0gdGV4dDEubGVuZ3RoID4gdGV4dDIubGVuZ3RoXG4gICAgICAgICAgICB3aGVuIDMgdGhlbiByZXN1bHQgPSB0ZXh0MS5sZW5ndGggPj0gdGV4dDIubGVuZ3RoXG4gICAgICAgICAgICB3aGVuIDQgdGhlbiByZXN1bHQgPSB0ZXh0MS5sZW5ndGggPCB0ZXh0Mi5sZW5ndGhcbiAgICAgICAgICAgIHdoZW4gNSB0aGVuIHJlc3VsdCA9IHRleHQxLmxlbmd0aCA8PSB0ZXh0Mi5sZW5ndGhcbiAgICAgICAgICAgIFxuICAgICAgICBpZiByZXN1bHRcbiAgICAgICAgICAgIEBpbnRlcnByZXRlci5wb2ludGVyID0gQHBhcmFtcy5sYWJlbEluZGV4XG4gICAgIFxuICAgICMjIypcbiAgICAqIEBtZXRob2QgY29tbWFuZExhYmVsXG4gICAgKiBAcHJvdGVjdGVkXG4gICAgIyMjICAgICAgICAgICAgXG4gICAgY29tbWFuZExhYmVsOiAtPiAjIERvZXMgTm90aGluZ1xuICAgICAgICBcbiAgICBcbiAgICAjIyMqXG4gICAgKiBAbWV0aG9kIGNvbW1hbmRKdW1wVG9MYWJlbFxuICAgICogQHByb3RlY3RlZFxuICAgICMjIyAgICAgICAgICAgICAgXG4gICAgY29tbWFuZEp1bXBUb0xhYmVsOiAtPlxuICAgICAgICBsYWJlbCA9IEBwYXJhbXMubGFiZWxJbmRleCAjQGludGVycHJldGVyLmxhYmVsc1tAcGFyYW1zLm5hbWVdXG4gICAgICAgIGlmIGxhYmVsP1xuICAgICAgICAgICAgQGludGVycHJldGVyLnBvaW50ZXIgPSBsYWJlbFxuICAgICAgICAgICAgQGludGVycHJldGVyLmluZGVudCA9IEBpbnRlcnByZXRlci5vYmplY3QuY29tbWFuZHNbbGFiZWxdLmluZGVudFxuICAgICAgICBlbHNlXG4gICAgICAgICAgICBzd2l0Y2ggQHBhcmFtcy50YXJnZXRcbiAgICAgICAgICAgICAgICB3aGVuIFwiYWN0aXZlQ29udGV4dFwiXG4gICAgICAgICAgICAgICAgICAgIEBpbnRlcnByZXRlci5qdW1wVG9MYWJlbChAaW50ZXJwcmV0ZXIuc3RyaW5nVmFsdWVPZihAcGFyYW1zLm5hbWUpKVxuICAgICAgICAgICAgICAgIHdoZW4gXCJhY3RpdmVTY2VuZVwiXG4gICAgICAgICAgICAgICAgICAgIFNjZW5lTWFuYWdlci5zY2VuZS5pbnRlcnByZXRlci5qdW1wVG9MYWJlbChAaW50ZXJwcmV0ZXIuc3RyaW5nVmFsdWVPZihAcGFyYW1zLm5hbWUpKVxuICAgICAgICAgICAgICAgIGVsc2VcbiAgICAgICAgICAgICAgICAgICAgQGludGVycHJldGVyLmp1bXBUb0xhYmVsKEBpbnRlcnByZXRlci5zdHJpbmdWYWx1ZU9mKEBwYXJhbXMubmFtZSkpXG4gICAgICAgIFxuICAgICMjIypcbiAgICAqIEBtZXRob2QgY29tbWFuZENsZWFyTWVzc2FnZVxuICAgICogQHByb3RlY3RlZFxuICAgICMjIyAgICAgICAgXG4gICAgY29tbWFuZENsZWFyTWVzc2FnZTogLT5cbiAgICAgICAgc2NlbmUgPSBTY2VuZU1hbmFnZXIuc2NlbmVcbiAgICAgICAgbWVzc2FnZU9iamVjdCA9IEBpbnRlcnByZXRlci50YXJnZXRNZXNzYWdlKClcbiAgICAgICAgaWYgbm90IG1lc3NhZ2VPYmplY3Q/IHRoZW4gcmV0dXJuXG4gICAgICAgIFxuICAgICAgICBmbGFncyA9IEBwYXJhbXMuZmllbGRGbGFncyB8fCB7fVxuICAgICAgICBpc0xvY2tlZCA9IGdzLkNvbW1hbmRGaWVsZEZsYWdzLmlzTG9ja2VkXG4gICAgICAgIGR1cmF0aW9uID0gMFxuICAgICAgICBmYWRpbmcgPSBHYW1lTWFuYWdlci50ZW1wU2V0dGluZ3MubWVzc2FnZUZhZGluZ1xuICAgICAgICBpZiBub3QgR2FtZU1hbmFnZXIudGVtcFNldHRpbmdzLnNraXBcbiAgICAgICAgICAgIGR1cmF0aW9uID0gaWYgIWlzTG9ja2VkKGZsYWdzLmR1cmF0aW9uKSB0aGVuIEBpbnRlcnByZXRlci5kdXJhdGlvblZhbHVlT2YoQHBhcmFtcy5kdXJhdGlvbikgZWxzZSBmYWRpbmcuZHVyYXRpb25cbiAgICAgICAgbWVzc2FnZU9iamVjdC5hbmltYXRvci5kaXNhcHBlYXIoZmFkaW5nLmFuaW1hdGlvbiwgZmFkaW5nLmVhc2luZywgZHVyYXRpb24sIGdzLkNhbGxCYWNrKFwib25NZXNzYWdlQURWQ2xlYXJcIiwgQGludGVycHJldGVyKSlcblxuICAgICAgICBAaW50ZXJwcmV0ZXIud2FpdEZvckNvbXBsZXRpb24obWVzc2FnZU9iamVjdCwgQHBhcmFtcylcbiAgICAgICAgZ3MuR2FtZU5vdGlmaWVyLnBvc3RNaW5vckNoYW5nZSgpXG4gICAgICAgIFxuICAgICMjIypcbiAgICAqIEBtZXRob2QgY29tbWFuZE1lc3NhZ2VCb3hEZWZhdWx0c1xuICAgICogQHByb3RlY3RlZFxuICAgICMjIyBcbiAgICBjb21tYW5kTWVzc2FnZUJveERlZmF1bHRzOiAtPlxuICAgICAgICBkZWZhdWx0cyA9IEdhbWVNYW5hZ2VyLmRlZmF1bHRzLm1lc3NhZ2VCb3hcbiAgICAgICAgZmxhZ3MgPSBAcGFyYW1zLmZpZWxkRmxhZ3MgfHwge31cbiAgICAgICAgaXNMb2NrZWQgPSBncy5Db21tYW5kRmllbGRGbGFncy5pc0xvY2tlZFxuICAgICAgICBcbiAgICAgICAgaWYgIWlzTG9ja2VkKGZsYWdzLmFwcGVhckR1cmF0aW9uKSB0aGVuIGRlZmF1bHRzLmFwcGVhckR1cmF0aW9uID0gQGludGVycHJldGVyLmR1cmF0aW9uVmFsdWVPZihAcGFyYW1zLmFwcGVhckR1cmF0aW9uKVxuICAgICAgICBpZiAhaXNMb2NrZWQoZmxhZ3MuZGlzYXBwZWFyRHVyYXRpb24pIHRoZW4gZGVmYXVsdHMuZGlzYXBwZWFyRHVyYXRpb24gPSBAaW50ZXJwcmV0ZXIuZHVyYXRpb25WYWx1ZU9mKEBwYXJhbXMuZGlzYXBwZWFyRHVyYXRpb24pXG4gICAgICAgIGlmICFpc0xvY2tlZChmbGFncy56T3JkZXIpIHRoZW4gZGVmYXVsdHMuek9yZGVyID0gQGludGVycHJldGVyLm51bWJlclZhbHVlT2YoQHBhcmFtcy56T3JkZXIpXG4gICAgICAgIGlmICFpc0xvY2tlZChmbGFnc1tcImFwcGVhckVhc2luZy50eXBlXCJdKSB0aGVuIGRlZmF1bHRzLmFwcGVhckVhc2luZyA9IEBwYXJhbXMuYXBwZWFyRWFzaW5nXG4gICAgICAgIGlmICFpc0xvY2tlZChmbGFnc1tcImFwcGVhckFuaW1hdGlvbi50eXBlXCJdKSB0aGVuIGRlZmF1bHRzLmFwcGVhckFuaW1hdGlvbiA9IEBwYXJhbXMuYXBwZWFyQW5pbWF0aW9uXG4gICAgICAgIGlmICFpc0xvY2tlZChmbGFnc1tcImRpc2FwcGVhckVhc2luZy50eXBlXCJdKSB0aGVuIGRlZmF1bHRzLmRpc2FwcGVhckVhc2luZyA9IEBwYXJhbXMuZGlzYXBwZWFyRWFzaW5nXG4gICAgICAgIGlmICFpc0xvY2tlZChmbGFnc1tcImRpc2FwcGVhckFuaW1hdGlvbi50eXBlXCJdKSB0aGVuIGRlZmF1bHRzLmRpc2FwcGVhckFuaW1hdGlvbiA9IEBwYXJhbXMuZGlzYXBwZWFyQW5pbWF0aW9uXG4gICAgXG4gICAgXG4gICAgIyMjKlxuICAgICogQG1ldGhvZCBjb21tYW5kU2hvd01lc3NhZ2VcbiAgICAqIEBwcm90ZWN0ZWRcbiAgICAjIyMgIFxuICAgIGNvbW1hbmRTaG93TWVzc2FnZTogLT5cbiAgICAgICAgc2NlbmUgPSBTY2VuZU1hbmFnZXIuc2NlbmVcbiAgICAgICAgc2NlbmUubWVzc2FnZU1vZGUgPSB2bi5NZXNzYWdlTW9kZS5BRFZcbiAgICAgICAgY2hhcmFjdGVyID0gc2NlbmUuY2hhcmFjdGVycy5maXJzdCAodikgPT4gIXYuZGlzcG9zZWQgYW5kIHYucmlkID09IEBwYXJhbXMuY2hhcmFjdGVySWQgXG4gICAgICAgIFxuICAgICAgICBzaG93TWVzc2FnZSA9ID0+XG4gICAgICAgICAgICBjaGFyYWN0ZXIgPSBSZWNvcmRNYW5hZ2VyLmNoYXJhY3RlcnNbQHBhcmFtcy5jaGFyYWN0ZXJJZF1cbiAgICAgICAgICAgIFxuICAgICAgICAgICAgc2NlbmUubGF5b3V0LnZpc2libGUgPSB5ZXNcbiAgICAgICAgICAgIG1lc3NhZ2VPYmplY3QgPSBAaW50ZXJwcmV0ZXIudGFyZ2V0TWVzc2FnZSgpXG4gICAgICAgICAgICAgICAgXG4gICAgICAgICAgICBpZiBub3QgbWVzc2FnZU9iamVjdD8gdGhlbiByZXR1cm5cbiAgICAgICAgICAgIFxuICAgICAgICAgICAgc2NlbmUuY3VycmVudENoYXJhY3RlciA9IGNoYXJhY3RlclxuICAgICAgICAgICAgbWVzc2FnZU9iamVjdC5jaGFyYWN0ZXIgPSBjaGFyYWN0ZXJcbiAgICAgICAgICAgIFxuICAgICAgICAgICAgbWVzc2FnZU9iamVjdC5vcGFjaXR5ID0gMjU1XG4gICAgICAgICAgICBtZXNzYWdlT2JqZWN0LmV2ZW50cy5vZmZCeU93bmVyKFwiY2FsbENvbW1vbkV2ZW50XCIsIEBpbnRlcnByZXRlcilcbiAgICAgICAgICAgIG1lc3NhZ2VPYmplY3QuZXZlbnRzLm9uKFwiY2FsbENvbW1vbkV2ZW50XCIsIGdzLkNhbGxCYWNrKFwib25DYWxsQ29tbW9uRXZlbnRcIiwgQGludGVycHJldGVyKSwgcGFyYW1zOiBAcGFyYW1zLCBAaW50ZXJwcmV0ZXIpXG4gICAgICAgICAgICBtZXNzYWdlT2JqZWN0LmV2ZW50cy5vbmNlKFwiZmluaXNoXCIsIGdzLkNhbGxCYWNrKFwib25NZXNzYWdlQURWRmluaXNoXCIsIEBpbnRlcnByZXRlciksIHBhcmFtczogQHBhcmFtcywgQGludGVycHJldGVyKVxuICAgICAgICAgICAgbWVzc2FnZU9iamVjdC5ldmVudHMub25jZShcIndhaXRpbmdcIiwgZ3MuQ2FsbEJhY2soXCJvbk1lc3NhZ2VBRFZXYWl0aW5nXCIsIEBpbnRlcnByZXRlciksIHBhcmFtczogQHBhcmFtcywgQGludGVycHJldGVyKSAgIFxuICAgICAgICAgICAgaWYgbWVzc2FnZU9iamVjdC5zZXR0aW5ncy51c2VDaGFyYWN0ZXJDb2xvclxuICAgICAgICAgICAgICAgIG1lc3NhZ2VPYmplY3QubWVzc2FnZS5zaG93TWVzc2FnZShAaW50ZXJwcmV0ZXIsIEBwYXJhbXMsIGNoYXJhY3RlcilcbiAgICAgICAgICAgIGVsc2VcbiAgICAgICAgICAgICAgICBtZXNzYWdlT2JqZWN0Lm1lc3NhZ2Uuc2hvd01lc3NhZ2UoQGludGVycHJldGVyLCBAcGFyYW1zKVxuICAgICAgICAgICAgXG4gICAgICAgICAgICBzZXR0aW5ncyA9IEdhbWVNYW5hZ2VyLnNldHRpbmdzXG4gICAgICAgICAgICB2b2ljZVNldHRpbmdzID0gc2V0dGluZ3Mudm9pY2VzQnlDaGFyYWN0ZXJbY2hhcmFjdGVyLmluZGV4XVxuICAgICAgXG4gICAgICAgICAgICBpZiBAcGFyYW1zLnZvaWNlPyBhbmQgR2FtZU1hbmFnZXIuc2V0dGluZ3Mudm9pY2VFbmFibGVkIGFuZCAoIXZvaWNlU2V0dGluZ3Mgb3Igdm9pY2VTZXR0aW5ncyA+IDApXG4gICAgICAgICAgICAgICAgaWYgKEdhbWVNYW5hZ2VyLnNldHRpbmdzLnNraXBWb2ljZU9uQWN0aW9uIG9yICFBdWRpb01hbmFnZXIudm9pY2U/LnBsYXlpbmcpIGFuZCAhR2FtZU1hbmFnZXIudGVtcFNldHRpbmdzLnNraXBcbiAgICAgICAgICAgICAgICAgICAgbWVzc2FnZU9iamVjdC52b2ljZSA9IEBwYXJhbXMudm9pY2VcbiAgICAgICAgICAgICAgICAgICAgbWVzc2FnZU9iamVjdC5iZWhhdmlvci52b2ljZSA9IEF1ZGlvTWFuYWdlci5wbGF5Vm9pY2UoQHBhcmFtcy52b2ljZSlcbiAgICAgICAgICAgIGVsc2VcbiAgICAgICAgICAgICAgICBtZXNzYWdlT2JqZWN0LmJlaGF2aW9yLnZvaWNlID0gbnVsbFxuICAgICAgICAgICAgICAgIFxuICAgICAgICBpZiBAcGFyYW1zLmV4cHJlc3Npb25JZD8gYW5kIGNoYXJhY3Rlcj9cbiAgICAgICAgICAgIGV4cHJlc3Npb24gPSBSZWNvcmRNYW5hZ2VyLmNoYXJhY3RlckV4cHJlc3Npb25zW0BwYXJhbXMuZXhwcmVzc2lvbklkIHx8IDBdXG4gICAgICAgICAgICBkZWZhdWx0cyA9IEdhbWVNYW5hZ2VyLmRlZmF1bHRzLmNoYXJhY3RlclxuICAgICAgICAgICAgZHVyYXRpb24gPSBpZiAhZ3MuQ29tbWFuZEZpZWxkRmxhZ3MuaXNMb2NrZWQoQHBhcmFtcy5maWVsZEZsYWdzLmR1cmF0aW9uKSB0aGVuIEBpbnRlcnByZXRlci5kdXJhdGlvblZhbHVlT2YoQHBhcmFtcy5kdXJhdGlvbikgZWxzZSBkZWZhdWx0cy5leHByZXNzaW9uRHVyYXRpb25cbiAgICAgICAgICAgIGVhc2luZyA9IGdzLkVhc2luZ3MuZnJvbU9iamVjdChkZWZhdWx0cy5jaGFuZ2VFYXNpbmcpXG4gICAgICAgICAgICBhbmltYXRpb24gPSBkZWZhdWx0cy5jaGFuZ2VBbmltYXRpb25cbiAgICAgICAgICAgIFxuICAgICAgICAgICAgY2hhcmFjdGVyLmJlaGF2aW9yLmNoYW5nZUV4cHJlc3Npb24oZXhwcmVzc2lvbiwgYW5pbWF0aW9uLCBlYXNpbmcsIGR1cmF0aW9uLCA9PlxuICAgICAgICAgICAgICAgIHNob3dNZXNzYWdlKClcbiAgICAgICAgICAgIClcbiAgICAgICAgZWxzZVxuICAgICAgICAgICAgc2hvd01lc3NhZ2UoKVxuICAgIFxuICAgICAgICBAaW50ZXJwcmV0ZXIuaXNXYWl0aW5nID0gKEBwYXJhbXMud2FpdEZvckNvbXBsZXRpb24gPyB5ZXMpIGFuZCAhKEdhbWVNYW5hZ2VyLnRlbXBTZXR0aW5ncy5za2lwIGFuZCBHYW1lTWFuYWdlci50ZW1wU2V0dGluZ3Muc2tpcFRpbWUgPT0gMClcbiAgICAgICAgQGludGVycHJldGVyLndhaXRpbmdGb3IubWVzc2FnZUFEViA9IEBwYXJhbXNcbiAgICAgIFxuICAgICMjIypcbiAgICAqIEBtZXRob2QgY29tbWFuZFNldE1lc3NhZ2VBcmVhXG4gICAgKiBAcHJvdGVjdGVkXG4gICAgIyMjICAgICAgXG4gICAgY29tbWFuZFNldE1lc3NhZ2VBcmVhOiAtPlxuICAgICAgICBzY2VuZSA9IFNjZW5lTWFuYWdlci5zY2VuZVxuICAgICAgICBudW1iZXIgPSBAaW50ZXJwcmV0ZXIubnVtYmVyVmFsdWVPZihAcGFyYW1zLm51bWJlcilcbiAgICAgICAgXG4gICAgICAgIGlmIHNjZW5lLm1lc3NhZ2VBcmVhc1tudW1iZXJdXG4gICAgICAgICAgICBtZXNzYWdlTGF5b3V0ID0gc2NlbmUubWVzc2FnZUFyZWFzW251bWJlcl0ubGF5b3V0XG4gICAgICAgICAgICBtZXNzYWdlTGF5b3V0LmRzdFJlY3QueCA9IEBwYXJhbXMuYm94LnhcbiAgICAgICAgICAgIG1lc3NhZ2VMYXlvdXQuZHN0UmVjdC55ID0gQHBhcmFtcy5ib3gueVxuICAgICAgICAgICAgbWVzc2FnZUxheW91dC5kc3RSZWN0LndpZHRoID0gQHBhcmFtcy5ib3guc2l6ZS53aWR0aFxuICAgICAgICAgICAgbWVzc2FnZUxheW91dC5kc3RSZWN0LmhlaWdodCA9IEBwYXJhbXMuYm94LnNpemUuaGVpZ2h0XG4gICAgICAgICAgICBtZXNzYWdlTGF5b3V0Lm5lZWRzVXBkYXRlID0geWVzXG4gICAgICAgICAgICBcbiAgICAjIyMqXG4gICAgKiBAbWV0aG9kIGNvbW1hbmRNZXNzYWdlRmFkaW5nXG4gICAgKiBAcHJvdGVjdGVkXG4gICAgIyMjIFxuICAgIGNvbW1hbmRNZXNzYWdlRmFkaW5nOiAtPlxuICAgICAgICBHYW1lTWFuYWdlci50ZW1wU2V0dGluZ3MubWVzc2FnZUZhZGluZyA9IGR1cmF0aW9uOiBAaW50ZXJwcmV0ZXIuZHVyYXRpb25WYWx1ZU9mKEBwYXJhbXMuZHVyYXRpb24pLCBhbmltYXRpb246IEBwYXJhbXMuYW5pbWF0aW9uLCBlYXNpbmc6IGdzLkVhc2luZ3MuZnJvbU9iamVjdChAcGFyYW1zLmVhc2luZylcbiAgICAgICAgXG4gICAgIyMjKlxuICAgICogQG1ldGhvZCBjb21tYW5kTWVzc2FnZVNldHRpbmdzXG4gICAgKiBAcHJvdGVjdGVkXG4gICAgIyMjICAgICBcbiAgICBjb21tYW5kTWVzc2FnZVNldHRpbmdzOiAtPlxuICAgICAgICBtZXNzYWdlT2JqZWN0ID0gQGludGVycHJldGVyLnRhcmdldE1lc3NhZ2UoKVxuICAgICAgICBpZiAhbWVzc2FnZU9iamVjdCB0aGVuIHJldHVyblxuICAgICAgICBcbiAgICAgICAgZmxhZ3MgPSBAcGFyYW1zLmZpZWxkRmxhZ3MgfHwge31cbiAgICAgICAgaXNMb2NrZWQgPSBncy5Db21tYW5kRmllbGRGbGFncy5pc0xvY2tlZFxuICAgICAgICBtZXNzYWdlU2V0dGluZ3MgPSBAaW50ZXJwcmV0ZXIubWVzc2FnZVNldHRpbmdzKClcbiAgICAgICAgXG4gICAgICAgIGlmICFpc0xvY2tlZChmbGFncy5hdXRvRXJhc2UpXG4gICAgICAgICAgICBtZXNzYWdlU2V0dGluZ3MuYXV0b0VyYXNlID0gQHBhcmFtcy5hdXRvRXJhc2VcbiAgICAgICAgICAgIFxuICAgICAgICBpZiAhaXNMb2NrZWQoZmxhZ3Mud2FpdEF0RW5kKVxuICAgICAgICAgICAgbWVzc2FnZVNldHRpbmdzLndhaXRBdEVuZCA9IEBwYXJhbXMud2FpdEF0RW5kXG4gICAgICAgICAgICBcbiAgICAgICAgaWYgIWlzTG9ja2VkKGZsYWdzLmJhY2tsb2cpXG4gICAgICAgICAgICBtZXNzYWdlU2V0dGluZ3MuYmFja2xvZyA9IEBwYXJhbXMuYmFja2xvZ1xuICAgICAgICBcbiAgICAgICAgaWYgIWlzTG9ja2VkKGZsYWdzLmxpbmVIZWlnaHQpXG4gICAgICAgICAgICBtZXNzYWdlU2V0dGluZ3MubGluZUhlaWdodCA9IEBwYXJhbXMubGluZUhlaWdodFxuICAgICAgICBcbiAgICAgICAgaWYgIWlzTG9ja2VkKGZsYWdzLmxpbmVTcGFjaW5nKVxuICAgICAgICAgICAgbWVzc2FnZVNldHRpbmdzLmxpbmVTcGFjaW5nID0gQHBhcmFtcy5saW5lU3BhY2luZ1xuICAgICAgICBcbiAgICAgICAgaWYgIWlzTG9ja2VkKGZsYWdzLmxpbmVQYWRkaW5nKVxuICAgICAgICAgICAgbWVzc2FnZVNldHRpbmdzLmxpbmVQYWRkaW5nID0gQHBhcmFtcy5saW5lUGFkZGluZ1xuICAgICAgICAgICAgXG4gICAgICAgIGlmICFpc0xvY2tlZChmbGFncy5wYXJhZ3JhcGhTcGFjaW5nKVxuICAgICAgICAgICAgbWVzc2FnZVNldHRpbmdzLnBhcmFncmFwaFNwYWNpbmcgPSBAcGFyYW1zLnBhcmFncmFwaFNwYWNpbmdcbiAgICAgICAgICAgIFxuICAgICAgICBpZiAhaXNMb2NrZWQoZmxhZ3MudXNlQ2hhcmFjdGVyQ29sb3IpXG4gICAgICAgICAgICBtZXNzYWdlU2V0dGluZ3MudXNlQ2hhcmFjdGVyQ29sb3IgPSBAcGFyYW1zLnVzZUNoYXJhY3RlckNvbG9yXG4gICAgICAgICAgICBcbiAgICAgICAgbWVzc2FnZU9iamVjdC50ZXh0UmVuZGVyZXIubWluTGluZUhlaWdodCA9IG1lc3NhZ2VTZXR0aW5ncy5saW5lSGVpZ2h0ID8gMFxuICAgICAgICBtZXNzYWdlT2JqZWN0LnRleHRSZW5kZXJlci5saW5lU3BhY2luZyA9IG1lc3NhZ2VTZXR0aW5ncy5saW5lU3BhY2luZyA/IG1lc3NhZ2VPYmplY3QudGV4dFJlbmRlcmVyLmxpbmVTcGFjaW5nXG4gICAgICAgIG1lc3NhZ2VPYmplY3QudGV4dFJlbmRlcmVyLnBhZGRpbmcgPSBtZXNzYWdlU2V0dGluZ3MubGluZVBhZGRpbmcgPyBtZXNzYWdlT2JqZWN0LnRleHRSZW5kZXJlci5wYWRkaW5nXG4gICAgICAgIFxuICAgICAgICBmb250TmFtZSA9IGlmICFpc0xvY2tlZChmbGFncy5mb250KSB0aGVuIEBwYXJhbXMuZm9udCBlbHNlIG1lc3NhZ2VPYmplY3QuZm9udC5uYW1lXG4gICAgICAgIGZvbnRTaXplID0gaWYgIWlzTG9ja2VkKGZsYWdzLnNpemUpIHRoZW4gQHBhcmFtcy5zaXplIGVsc2UgbWVzc2FnZU9iamVjdC5mb250LnNpemVcbiAgICAgICAgZm9udCA9IG1lc3NhZ2VPYmplY3QuZm9udFxuICAgICAgICBpZiAhaXNMb2NrZWQoZmxhZ3MuZm9udCkgb3IgIWlzTG9ja2VkKGZsYWdzLnNpemUpXG4gICAgICAgICAgICBtZXNzYWdlT2JqZWN0LmZvbnQgPSBuZXcgRm9udChmb250TmFtZSwgZm9udFNpemUpXG4gICAgICAgICAgICBcbiAgICAgICAgaWYgIWlzTG9ja2VkKGZsYWdzLmJvbGQpXG4gICAgICAgICAgICBtZXNzYWdlT2JqZWN0LmZvbnQuYm9sZCA9IEBwYXJhbXMuYm9sZFxuICAgICAgICBpZiAhaXNMb2NrZWQoZmxhZ3MuaXRhbGljKVxuICAgICAgICAgICAgbWVzc2FnZU9iamVjdC5mb250Lml0YWxpYyA9IEBwYXJhbXMuaXRhbGljXG4gICAgICAgIGlmICFpc0xvY2tlZChmbGFncy5zbWFsbENhcHMpXG4gICAgICAgICAgICBtZXNzYWdlT2JqZWN0LmZvbnQuc21hbGxDYXBzID0gQHBhcmFtcy5zbWFsbENhcHNcbiAgICAgICAgaWYgIWlzTG9ja2VkKGZsYWdzLnVuZGVybGluZSlcbiAgICAgICAgICAgIG1lc3NhZ2VPYmplY3QuZm9udC51bmRlcmxpbmUgPSBAcGFyYW1zLnVuZGVybGluZVxuICAgICAgICBpZiAhaXNMb2NrZWQoZmxhZ3Muc3RyaWtlVGhyb3VnaClcbiAgICAgICAgICAgIG1lc3NhZ2VPYmplY3QuZm9udC5zdHJpa2VUaHJvdWdoID0gQHBhcmFtcy5zdHJpa2VUaHJvdWdoXG4gICAgICAgIGlmICFpc0xvY2tlZChmbGFncy5jb2xvcilcbiAgICAgICAgICAgIG1lc3NhZ2VPYmplY3QuZm9udC5jb2xvciA9IG5ldyBDb2xvcihAcGFyYW1zLmNvbG9yKVxuICAgICAgICAgICAgXG4gICAgICAgIG1lc3NhZ2VPYmplY3QuZm9udC5jb2xvciA9IGlmIGZsYWdzLmNvbG9yPyBhbmQgIWlzTG9ja2VkKGZsYWdzLmNvbG9yKSB0aGVuIG5ldyBDb2xvcihAcGFyYW1zLmNvbG9yKSBlbHNlIGZvbnQuY29sb3JcbiAgICAgICAgbWVzc2FnZU9iamVjdC5mb250LmJvcmRlciA9IGlmIGZsYWdzLm91dGxpbmU/IGFuZCAhaXNMb2NrZWQoZmxhZ3Mub3V0bGluZSkgdGhlbiBAcGFyYW1zLm91dGxpbmUgZWxzZSBmb250LmJvcmRlclxuICAgICAgICBtZXNzYWdlT2JqZWN0LmZvbnQuYm9yZGVyQ29sb3IgPSBpZiBmbGFncy5vdXRsaW5lQ29sb3I/IGFuZCAhaXNMb2NrZWQoZmxhZ3Mub3V0bGluZUNvbG9yKSB0aGVuIG5ldyBDb2xvcihAcGFyYW1zLm91dGxpbmVDb2xvcikgZWxzZSBuZXcgQ29sb3IoZm9udC5ib3JkZXJDb2xvcilcbiAgICAgICAgbWVzc2FnZU9iamVjdC5mb250LmJvcmRlclNpemUgPSBpZiBmbGFncy5vdXRsaW5lU2l6ZT8gYW5kICFpc0xvY2tlZChmbGFncy5vdXRsaW5lU2l6ZSkgdGhlbiAoQHBhcmFtcy5vdXRsaW5lU2l6ZSA/IDQpIGVsc2UgZm9udC5ib3JkZXJTaXplXG4gICAgICAgIG1lc3NhZ2VPYmplY3QuZm9udC5zaGFkb3cgPSBpZiBmbGFncy5zaGFkb3c/IGFuZCAhaXNMb2NrZWQoZmxhZ3Muc2hhZG93KXRoZW4gQHBhcmFtcy5zaGFkb3cgZWxzZSBmb250LnNoYWRvd1xuICAgICAgICBtZXNzYWdlT2JqZWN0LmZvbnQuc2hhZG93Q29sb3IgPSBpZiBmbGFncy5zaGFkb3dDb2xvcj8gYW5kICFpc0xvY2tlZChmbGFncy5zaGFkb3dDb2xvcikgdGhlbiBuZXcgQ29sb3IoQHBhcmFtcy5zaGFkb3dDb2xvcikgZWxzZSBuZXcgQ29sb3IoZm9udC5zaGFkb3dDb2xvcilcbiAgICAgICAgbWVzc2FnZU9iamVjdC5mb250LnNoYWRvd09mZnNldFggPSBpZiBmbGFncy5zaGFkb3dPZmZzZXRYPyBhbmQgIWlzTG9ja2VkKGZsYWdzLnNoYWRvd09mZnNldFgpIHRoZW4gKEBwYXJhbXMuc2hhZG93T2Zmc2V0WCA/IDEpIGVsc2UgZm9udC5zaGFkb3dPZmZzZXRYXG4gICAgICAgIG1lc3NhZ2VPYmplY3QuZm9udC5zaGFkb3dPZmZzZXRZID0gaWYgZmxhZ3Muc2hhZG93T2Zmc2V0WT8gYW5kICFpc0xvY2tlZChmbGFncy5zaGFkb3dPZmZzZXRZKSB0aGVuIChAcGFyYW1zLnNoYWRvd09mZnNldFkgPyAxKSBlbHNlIGZvbnQuc2hhZG93T2Zmc2V0WVxuICAgICAgICBcbiAgICAgICAgaWYgaXNMb2NrZWQoZmxhZ3MuYm9sZCkgdGhlbiBtZXNzYWdlT2JqZWN0LmZvbnQuYm9sZCA9IGZvbnQuYm9sZFxuICAgICAgICBpZiBpc0xvY2tlZChmbGFncy5pdGFsaWMpIHRoZW4gbWVzc2FnZU9iamVjdC5mb250Lml0YWxpYyA9IGZvbnQuaXRhbGljXG4gICAgICAgIGlmIGlzTG9ja2VkKGZsYWdzLnNtYWxsQ2FwcykgdGhlbiBtZXNzYWdlT2JqZWN0LmZvbnQuc21hbGxDYXBzID0gZm9udC5zbWFsbENhcHNcbiAgICAgICAgICAgIFxuICAgICMjIypcbiAgICAqIEBtZXRob2QgY29tbWFuZENyZWF0ZU1lc3NhZ2VBcmVhXG4gICAgKiBAcHJvdGVjdGVkXG4gICAgIyMjICBcbiAgICBjb21tYW5kQ3JlYXRlTWVzc2FnZUFyZWE6IC0+XG4gICAgICAgIG51bWJlciA9IEBpbnRlcnByZXRlci5udW1iZXJWYWx1ZU9mKEBwYXJhbXMubnVtYmVyKVxuICAgICAgICBzY2VuZSA9IFNjZW5lTWFuYWdlci5zY2VuZVxuICAgICAgICBzY2VuZS5iZWhhdmlvci5jaGFuZ2VNZXNzYWdlQXJlYURvbWFpbihAcGFyYW1zLm51bWJlckRvbWFpbilcbiAgICAgICAgaWYgIXNjZW5lLm1lc3NhZ2VBcmVhc1tudW1iZXJdXG4gICAgICAgICAgICBtZXNzYWdlQXJlYSA9IG5ldyBncy5PYmplY3RfTWVzc2FnZUFyZWEoKVxuICAgICAgICAgICAgbWVzc2FnZUFyZWEubGF5b3V0ID0gdWkuVUlNYW5hZ2VyLmNyZWF0ZUNvbnRyb2xGcm9tRGVzY3JpcHRvcih0eXBlOiBcInVpLkN1c3RvbUdhbWVNZXNzYWdlXCIsIGlkOiBcImN1c3RvbUdhbWVNZXNzYWdlX1wiK251bWJlciwgcGFyYW1zOiB7IGlkOiBcImN1c3RvbUdhbWVNZXNzYWdlX1wiK251bWJlciB9LCBtZXNzYWdlQXJlYSlcbiAgICAgICAgICAgIG1lc3NhZ2VBcmVhLm1lc3NhZ2UgPSBncy5PYmplY3RNYW5hZ2VyLmN1cnJlbnQub2JqZWN0QnlJZChcImN1c3RvbUdhbWVNZXNzYWdlX1wiK251bWJlcitcIl9tZXNzYWdlXCIpXG4gICAgICAgICAgICBtZXNzYWdlQXJlYS5tZXNzYWdlLmRvbWFpbiA9IEBwYXJhbXMubnVtYmVyRG9tYWluXG4gICAgICAgICAgICBtZXNzYWdlQXJlYS5hZGRPYmplY3QobWVzc2FnZUFyZWEubGF5b3V0KVxuICAgICAgICAgICAgbWVzc2FnZUFyZWEubGF5b3V0LmRzdFJlY3QueCA9IEBwYXJhbXMuYm94LnhcbiAgICAgICAgICAgIG1lc3NhZ2VBcmVhLmxheW91dC5kc3RSZWN0LnkgPSBAcGFyYW1zLmJveC55XG4gICAgICAgICAgICBtZXNzYWdlQXJlYS5sYXlvdXQuZHN0UmVjdC53aWR0aCA9IEBwYXJhbXMuYm94LnNpemUud2lkdGhcbiAgICAgICAgICAgIG1lc3NhZ2VBcmVhLmxheW91dC5kc3RSZWN0LmhlaWdodCA9IEBwYXJhbXMuYm94LnNpemUuaGVpZ2h0XG4gICAgICAgICAgICBtZXNzYWdlQXJlYS5sYXlvdXQubmVlZHNVcGRhdGUgPSB5ZXNcbiAgICAgICAgICAgIHNjZW5lLm1lc3NhZ2VBcmVhc1tudW1iZXJdID0gbWVzc2FnZUFyZWFcbiAgICBcbiAgICAjIyMqXG4gICAgKiBAbWV0aG9kIGNvbW1hbmRFcmFzZU1lc3NhZ2VBcmVhXG4gICAgKiBAcHJvdGVjdGVkXG4gICAgIyMjICBcbiAgICBjb21tYW5kRXJhc2VNZXNzYWdlQXJlYTogLT5cbiAgICAgICAgbnVtYmVyID0gQGludGVycHJldGVyLm51bWJlclZhbHVlT2YoQHBhcmFtcy5udW1iZXIpXG4gICAgICAgIHNjZW5lID0gU2NlbmVNYW5hZ2VyLnNjZW5lXG4gICAgICAgIHNjZW5lLmJlaGF2aW9yLmNoYW5nZU1lc3NhZ2VBcmVhRG9tYWluKEBwYXJhbXMubnVtYmVyRG9tYWluKVxuICAgICAgICBhcmVhID0gc2NlbmUubWVzc2FnZUFyZWFzW251bWJlcl0gXG4gICAgICAgIGFyZWE/LmxheW91dC5kaXNwb3NlKClcbiAgICAgICAgc2NlbmUubWVzc2FnZUFyZWFzW251bWJlcl0gPSBudWxsXG4gICAgICAgICAgICBcbiAgICAjIyMqXG4gICAgKiBAbWV0aG9kIGNvbW1hbmRTZXRUYXJnZXRNZXNzYWdlXG4gICAgKiBAcHJvdGVjdGVkXG4gICAgIyMjICBcbiAgICBjb21tYW5kU2V0VGFyZ2V0TWVzc2FnZTogLT5cbiAgICAgICAgbWVzc2FnZSA9IEBpbnRlcnByZXRlci50YXJnZXRNZXNzYWdlKClcbiAgICAgICAgbWVzc2FnZT8udGV4dFJlbmRlcmVyLmlzV2FpdGluZyA9IGZhbHNlXG4gICAgICAgIG1lc3NhZ2U/LmJlaGF2aW9yLmlzV2FpdGluZyA9IGZhbHNlXG4gICAgICAgIFxuICAgICAgICBzY2VuZSA9IFNjZW5lTWFuYWdlci5zY2VuZVxuICAgICAgICBzY2VuZS5iZWhhdmlvci5jaGFuZ2VNZXNzYWdlQXJlYURvbWFpbihAcGFyYW1zLm51bWJlckRvbWFpbilcbiAgICAgICAgdGFyZ2V0ID0geyB0eXBlOiBAcGFyYW1zLnR5cGUsIGlkOiBudWxsIH1cbiAgICAgICAgXG4gICAgICAgIHN3aXRjaCBAcGFyYW1zLnR5cGVcbiAgICAgICAgICAgIHdoZW4gMCAjIExheW91dC1iYXNlZFxuICAgICAgICAgICAgICAgIHRhcmdldC5pZCA9IEBwYXJhbXMuaWRcbiAgICAgICAgICAgIHdoZW4gMSAjIEN1c3RvbVxuICAgICAgICAgICAgICAgIHRhcmdldC5pZCA9IEBpbnRlcnByZXRlci5udW1iZXJWYWx1ZU9mKEBwYXJhbXMubnVtYmVyKVxuICAgICAgICAgICAgICAgIFxuICAgICAgICBAaW50ZXJwcmV0ZXIuc2V0dGluZ3MubWVzc2FnZS50YXJnZXQgPSB0YXJnZXRcbiAgICAgICAgXG4gICAgICAgIGlmIEBwYXJhbXMuY2xlYXJcbiAgICAgICAgICAgIEBpbnRlcnByZXRlci50YXJnZXRNZXNzYWdlKCk/LmJlaGF2aW9yLmNsZWFyKClcbiAgICAgICAgQGludGVycHJldGVyLnRhcmdldE1lc3NhZ2UoKT8udmlzaWJsZSA9IHllc1xuICAgICAgICAgICAgXG4gICAgIyMjKlxuICAgICogQG1ldGhvZCBjb21tYW5kQmFja2xvZ1Zpc2liaWxpdHlcbiAgICAqIEBwcm90ZWN0ZWRcbiAgICAjIyMgIFxuICAgIGNvbW1hbmRCYWNrbG9nVmlzaWJpbGl0eTogLT5cbiAgICAgICAgaWYgQHBhcmFtcy52aXNpYmxlIFxuICAgICAgICAgICAgY29udHJvbCA9IGdzLk9iamVjdE1hbmFnZXIuY3VycmVudC5vYmplY3RCeUlkKFwiYmFja2xvZ0JveFwiKVxuICAgICAgICAgICAgaWYgbm90IGNvbnRyb2w/IHRoZW4gY29udHJvbCA9IGdzLk9iamVjdE1hbmFnZXIuY3VycmVudC5vYmplY3RCeUlkKFwiYmFja2xvZ1wiKVxuICAgICAgICAgICAgXG4gICAgICAgICAgICBpZiBjb250cm9sP1xuICAgICAgICAgICAgICAgIGNvbnRyb2wuZGlzcG9zZSgpXG4gICAgICAgICAgICBcbiAgICAgICAgICAgIGlmIEBwYXJhbXMuYmFja2dyb3VuZFZpc2libGVcbiAgICAgICAgICAgICAgICBjb250cm9sID0gU2NlbmVNYW5hZ2VyLnNjZW5lLmJlaGF2aW9yLmNyZWF0ZUNvbnRyb2wodGhpcywgeyBkZXNjcmlwdG9yOiBcInVpLk1lc3NhZ2VCYWNrbG9nQm94XCIgfSlcbiAgICAgICAgICAgIGVsc2VcbiAgICAgICAgICAgICAgICBjb250cm9sID0gU2NlbmVNYW5hZ2VyLnNjZW5lLmJlaGF2aW9yLmNyZWF0ZUNvbnRyb2wodGhpcywgeyBkZXNjcmlwdG9yOiBcInVpLk1lc3NhZ2VCYWNrbG9nXCIgfSlcbiAgICAgICAgZWxzZVxuICAgICAgICAgICAgY29udHJvbCA9IGdzLk9iamVjdE1hbmFnZXIuY3VycmVudC5vYmplY3RCeUlkKFwiYmFja2xvZ0JveFwiKVxuICAgICAgICAgICAgaWYgbm90IGNvbnRyb2w/IHRoZW4gY29udHJvbCA9IGdzLk9iamVjdE1hbmFnZXIuY3VycmVudC5vYmplY3RCeUlkKFwiYmFja2xvZ1wiKVxuICAgICAgICAgICAgXG4gICAgICAgICAgICBjb250cm9sPy5kaXNwb3NlKClcbiAgICBcbiAgICAjIyMqXG4gICAgKiBAbWV0aG9kIGNvbW1hbmRNZXNzYWdlVmlzaWJpbGl0eVxuICAgICogQHByb3RlY3RlZFxuICAgICMjIyBcbiAgICBjb21tYW5kTWVzc2FnZVZpc2liaWxpdHk6IC0+XG4gICAgICAgIGRlZmF1bHRzID0gR2FtZU1hbmFnZXIuZGVmYXVsdHMubWVzc2FnZUJveFxuICAgICAgICBmbGFncyA9IEBwYXJhbXMuZmllbGRGbGFncyB8fCB7fVxuICAgICAgICBpc0xvY2tlZCA9IGdzLkNvbW1hbmRGaWVsZEZsYWdzLmlzTG9ja2VkXG4gICAgICAgIFxuICAgICAgICBtZXNzYWdlID0gQGludGVycHJldGVyLnRhcmdldE1lc3NhZ2UoKVxuICAgICAgICBpZiBub3QgbWVzc2FnZT8gb3IgQHBhcmFtcy52aXNpYmxlID09IG1lc3NhZ2UudmlzaWJsZSB0aGVuIHJldHVyblxuICAgICAgICBcbiAgICAgICAgaWYgQHBhcmFtcy52aXNpYmxlXG4gICAgICAgICAgICBkdXJhdGlvbiA9IGlmICFpc0xvY2tlZChmbGFncy5kdXJhdGlvbikgdGhlbiBAaW50ZXJwcmV0ZXIuZHVyYXRpb25WYWx1ZU9mKEBwYXJhbXMuZHVyYXRpb24pIGVsc2UgZGVmYXVsdHMuYXBwZWFyRHVyYXRpb25cbiAgICAgICAgICAgIGVhc2luZyA9IGlmICFpc0xvY2tlZChmbGFnc1tcImVhc2luZy50eXBlXCJdKSB0aGVuIGdzLkVhc2luZ3MuZnJvbU9iamVjdChAcGFyYW1zLmVhc2luZykgZWxzZSBncy5FYXNpbmdzLmZyb21PYmplY3QoZGVmYXVsdHMuYXBwZWFyRWFzaW5nKVxuICAgICAgICAgICAgYW5pbWF0aW9uID0gaWYgIWlzTG9ja2VkKGZsYWdzW1wiYW5pbWF0aW9uLnR5cGVcIl0pIHRoZW4gQHBhcmFtcy5hbmltYXRpb24gZWxzZSBkZWZhdWx0cy5hcHBlYXJBbmltYXRpb25cbiAgICAgICAgICAgIG1lc3NhZ2UuYW5pbWF0b3IuYXBwZWFyKG1lc3NhZ2UuZHN0UmVjdC54LCBtZXNzYWdlLmRzdFJlY3QueSwgQHBhcmFtcy5hbmltYXRpb24sIGVhc2luZywgZHVyYXRpb24pXG4gICAgICAgIGVsc2VcbiAgICAgICAgICAgIGR1cmF0aW9uID0gaWYgIWlzTG9ja2VkKGZsYWdzLmR1cmF0aW9uKSB0aGVuIEBpbnRlcnByZXRlci5kdXJhdGlvblZhbHVlT2YoQHBhcmFtcy5kdXJhdGlvbikgZWxzZSBkZWZhdWx0cy5kaXNhcHBlYXJEdXJhdGlvblxuICAgICAgICAgICAgZWFzaW5nID0gaWYgIWlzTG9ja2VkKGZsYWdzW1wiZWFzaW5nLnR5cGVcIl0pIHRoZW4gZ3MuRWFzaW5ncy5mcm9tT2JqZWN0KEBwYXJhbXMuZWFzaW5nKSBlbHNlIGdzLkVhc2luZ3MuZnJvbU9iamVjdChkZWZhdWx0cy5kaXNhcHBlYXJFYXNpbmcpXG4gICAgICAgICAgICBhbmltYXRpb24gPSBpZiAhaXNMb2NrZWQoZmxhZ3NbXCJhbmltYXRpb24udHlwZVwiXSkgdGhlbiBAcGFyYW1zLmFuaW1hdGlvbiBlbHNlIGRlZmF1bHRzLmRpc2FwcGVhckFuaW1hdGlvblxuICAgICAgICAgICAgbWVzc2FnZS5hbmltYXRvci5kaXNhcHBlYXIoYW5pbWF0aW9uLCBlYXNpbmcsIGR1cmF0aW9uLCAtPiBtZXNzYWdlLnZpc2libGUgPSBubylcbiAgICAgICAgbWVzc2FnZS51cGRhdGUoKVxuICAgICAgICBcbiAgICAgICAgaWYgQHBhcmFtcy53YWl0Rm9yQ29tcGxldGlvbiBhbmQgbm90IChkdXJhdGlvbiA9PSAwIG9yIEBpbnRlcnByZXRlci5pc0luc3RhbnRTa2lwKCkpXG4gICAgICAgICAgICBAaW50ZXJwcmV0ZXIuaXNXYWl0aW5nID0geWVzXG4gICAgICAgICAgICBAaW50ZXJwcmV0ZXIud2FpdENvdW50ZXIgPSBkdXJhdGlvblxuICAgICAgICBncy5HYW1lTm90aWZpZXIucG9zdE1pbm9yQ2hhbmdlKClcbiAgICAjIyMqXG4gICAgKiBAbWV0aG9kIGNvbW1hbmRNZXNzYWdlQm94VmlzaWJpbGl0eVxuICAgICogQHByb3RlY3RlZFxuICAgICMjIyAgICBcbiAgICBjb21tYW5kTWVzc2FnZUJveFZpc2liaWxpdHk6IC0+XG4gICAgICAgIGRlZmF1bHRzID0gR2FtZU1hbmFnZXIuZGVmYXVsdHMubWVzc2FnZUJveFxuICAgICAgICBmbGFncyA9IEBwYXJhbXMuZmllbGRGbGFncyB8fCB7fVxuICAgICAgICBpc0xvY2tlZCA9IGdzLkNvbW1hbmRGaWVsZEZsYWdzLmlzTG9ja2VkXG4gICAgICAgIG1lc3NhZ2VCb3ggPSBAaW50ZXJwcmV0ZXIubWVzc2FnZUJveE9iamVjdChAaW50ZXJwcmV0ZXIuc3RyaW5nVmFsdWVPZihAcGFyYW1zLmlkKSlcbiAgICAgICAgdmlzaWJsZSA9IEBwYXJhbXMudmlzaWJsZSA9PSAxXG4gICAgICAgIGlmIG5vdCBtZXNzYWdlQm94PyBvciB2aXNpYmxlID09IG1lc3NhZ2VCb3gudmlzaWJsZSB0aGVuIHJldHVyblxuICBcbiAgICAgICAgaWYgQHBhcmFtcy52aXNpYmxlXG4gICAgICAgICAgICBkdXJhdGlvbiA9IGlmICFpc0xvY2tlZChmbGFncy5kdXJhdGlvbikgdGhlbiBAaW50ZXJwcmV0ZXIuZHVyYXRpb25WYWx1ZU9mKEBwYXJhbXMuZHVyYXRpb24pIGVsc2UgZGVmYXVsdHMuYXBwZWFyRHVyYXRpb25cbiAgICAgICAgICAgIGVhc2luZyA9IGlmICFpc0xvY2tlZChmbGFnc1tcImVhc2luZy50eXBlXCJdKSB0aGVuIGdzLkVhc2luZ3MuZnJvbU9iamVjdChAcGFyYW1zLmVhc2luZykgZWxzZSBncy5FYXNpbmdzLmZyb21PYmplY3QoZGVmYXVsdHMuYXBwZWFyRWFzaW5nKVxuICAgICAgICAgICAgYW5pbWF0aW9uID0gaWYgIWlzTG9ja2VkKGZsYWdzW1wiYW5pbWF0aW9uLnR5cGVcIl0pIHRoZW4gQHBhcmFtcy5hbmltYXRpb24gZWxzZSBkZWZhdWx0cy5hcHBlYXJBbmltYXRpb25cbiAgICAgICAgICAgIG1lc3NhZ2VCb3guYW5pbWF0b3IuYXBwZWFyKG1lc3NhZ2VCb3guZHN0UmVjdC54LCBtZXNzYWdlQm94LmRzdFJlY3QueSwgYW5pbWF0aW9uLCBlYXNpbmcsIGR1cmF0aW9uKVxuICAgICAgICBlbHNlXG4gICAgICAgICAgICBkdXJhdGlvbiA9IGlmICFpc0xvY2tlZChmbGFncy5kdXJhdGlvbikgdGhlbiBAaW50ZXJwcmV0ZXIuZHVyYXRpb25WYWx1ZU9mKEBwYXJhbXMuZHVyYXRpb24pIGVsc2UgZGVmYXVsdHMuZGlzYXBwZWFyRHVyYXRpb25cbiAgICAgICAgICAgIGVhc2luZyA9IGlmICFpc0xvY2tlZChmbGFnc1tcImVhc2luZy50eXBlXCJdKSB0aGVuIGdzLkVhc2luZ3MuZnJvbU9iamVjdChAcGFyYW1zLmVhc2luZykgZWxzZSBncy5FYXNpbmdzLmZyb21PYmplY3QoZGVmYXVsdHMuZGlzYXBwZWFyRWFzaW5nKVxuICAgICAgICAgICAgYW5pbWF0aW9uID0gaWYgIWlzTG9ja2VkKGZsYWdzW1wiYW5pbWF0aW9uLnR5cGVcIl0pIHRoZW4gQHBhcmFtcy5hbmltYXRpb24gZWxzZSBkZWZhdWx0cy5kaXNhcHBlYXJBbmltYXRpb25cbiAgICAgICAgICAgIG1lc3NhZ2VCb3guYW5pbWF0b3IuZGlzYXBwZWFyKGFuaW1hdGlvbiwgZWFzaW5nLCBkdXJhdGlvbiwgLT4gbWVzc2FnZUJveC52aXNpYmxlID0gbm8pXG4gICAgICAgIG1lc3NhZ2VCb3gudXBkYXRlKClcbiAgICAgICAgXG4gICAgICAgIGlmIEBwYXJhbXMud2FpdEZvckNvbXBsZXRpb24gYW5kIG5vdCAoZHVyYXRpb24gPT0gMCBvciBAaW50ZXJwcmV0ZXIuaXNJbnN0YW50U2tpcCgpKVxuICAgICAgICAgICAgQGludGVycHJldGVyLmlzV2FpdGluZyA9IHllc1xuICAgICAgICAgICAgQGludGVycHJldGVyLndhaXRDb3VudGVyID0gZHVyYXRpb25cbiAgICAgICAgZ3MuR2FtZU5vdGlmaWVyLnBvc3RNaW5vckNoYW5nZSgpXG4gICAgXG4gICAgIyMjKlxuICAgICogQG1ldGhvZCBjb21tYW5kVUlBY2Nlc3NcbiAgICAqIEBwcm90ZWN0ZWRcbiAgICAjIyMgXG4gICAgY29tbWFuZFVJQWNjZXNzOiAtPlxuICAgICAgICBmbGFncyA9IEBwYXJhbXMuZmllbGRGbGFncyB8fCB7fVxuICAgICAgICBpc0xvY2tlZCA9IGdzLkNvbW1hbmRGaWVsZEZsYWdzLmlzTG9ja2VkXG4gICAgICAgIFxuICAgICAgICBpZiAhaXNMb2NrZWQoZmxhZ3MuZ2VuZXJhbE1lbnUpXG4gICAgICAgICAgICBHYW1lTWFuYWdlci50ZW1wU2V0dGluZ3MubWVudUFjY2VzcyA9IEBpbnRlcnByZXRlci5ib29sZWFuVmFsdWVPZihAcGFyYW1zLmdlbmVyYWxNZW51KVxuICAgICAgICBpZiAhaXNMb2NrZWQoZmxhZ3Muc2F2ZU1lbnUpXG4gICAgICAgICAgICBHYW1lTWFuYWdlci50ZW1wU2V0dGluZ3Muc2F2ZU1lbnVBY2Nlc3MgPSBAaW50ZXJwcmV0ZXIuYm9vbGVhblZhbHVlT2YoQHBhcmFtcy5zYXZlTWVudSlcbiAgICAgICAgaWYgIWlzTG9ja2VkKGZsYWdzLmxvYWRNZW51KVxuICAgICAgICAgICAgR2FtZU1hbmFnZXIudGVtcFNldHRpbmdzLmxvYWRNZW51QWNjZXNzID0gQGludGVycHJldGVyLmJvb2xlYW5WYWx1ZU9mKEBwYXJhbXMubG9hZE1lbnUpXG4gICAgICAgIGlmICFpc0xvY2tlZChmbGFncy5iYWNrbG9nKVxuICAgICAgICAgICAgR2FtZU1hbmFnZXIudGVtcFNldHRpbmdzLmJhY2tsb2dBY2Nlc3MgPSBAaW50ZXJwcmV0ZXIuYm9vbGVhblZhbHVlT2YoQHBhcmFtcy5iYWNrbG9nKVxuICAgICAgICAgICAgXG4gICAgIyMjKlxuICAgICogQG1ldGhvZCBjb21tYW5kVW5sb2NrQ0dcbiAgICAqIEBwcm90ZWN0ZWRcbiAgICAjIyMgICAgICAgICAgICBcbiAgICBjb21tYW5kVW5sb2NrQ0c6IC0+XG4gICAgICAgIGNnID0gUmVjb3JkTWFuYWdlci5jZ0dhbGxlcnlbQGludGVycHJldGVyLnN0cmluZ1ZhbHVlT2YoQHBhcmFtcy5jZ0lkKV1cbiAgICAgICAgXG4gICAgICAgIGlmIGNnP1xuICAgICAgICAgICAgR2FtZU1hbmFnZXIuZ2xvYmFsRGF0YS5jZ0dhbGxlcnlbY2cuaW5kZXhdID0geyB1bmxvY2tlZDogeWVzIH1cbiAgICAgICAgICAgIEdhbWVNYW5hZ2VyLnNhdmVHbG9iYWxEYXRhKClcbiAgICAgXG4gICAgIyMjKlxuICAgICogQG1ldGhvZCBjb21tYW5kTDJETW92ZVxuICAgICogQHByb3RlY3RlZFxuICAgICMjIyAgICAgICAgXG4gICAgY29tbWFuZEwyRE1vdmU6IC0+XG4gICAgICAgIHNjZW5lID0gU2NlbmVNYW5hZ2VyLnNjZW5lXG4gICAgICAgIGNoYXJhY3RlciA9IHNjZW5lLmNoYXJhY3RlcnMuZmlyc3QgKHYpID0+ICF2LmRpc3Bvc2VkIGFuZCB2LnJpZCA9PSBAcGFyYW1zLmNoYXJhY3RlcklkIFxuICAgICAgICBpZiBub3QgY2hhcmFjdGVyIGluc3RhbmNlb2Ygdm4uT2JqZWN0X0xpdmUyRENoYXJhY3RlciB0aGVuIHJldHVyblxuICAgICAgICBcbiAgICAgICAgQGludGVycHJldGVyLm1vdmVPYmplY3QoY2hhcmFjdGVyLCBAcGFyYW1zLnBvc2l0aW9uLCBAcGFyYW1zKVxuICAgICAgICBncy5HYW1lTm90aWZpZXIucG9zdE1pbm9yQ2hhbmdlKClcbiAgICBcbiAgICAjIyMqXG4gICAgKiBAbWV0aG9kIGNvbW1hbmRMMkRNb3Rpb25Hcm91cFxuICAgICogQHByb3RlY3RlZFxuICAgICMjIyAgIFxuICAgIGNvbW1hbmRMMkRNb3Rpb25Hcm91cDogLT5cbiAgICAgICAgc2NlbmUgPSBTY2VuZU1hbmFnZXIuc2NlbmVcbiAgICAgICAgY2hhcmFjdGVyID0gc2NlbmUuY2hhcmFjdGVycy5maXJzdCAodikgPT4gIXYuZGlzcG9zZWQgYW5kIHYucmlkID09IEBwYXJhbXMuY2hhcmFjdGVySWQgXG4gICAgICAgIGlmIG5vdCBjaGFyYWN0ZXIgaW5zdGFuY2VvZiB2bi5PYmplY3RfTGl2ZTJEQ2hhcmFjdGVyIHRoZW4gcmV0dXJuXG4gICAgICAgIFxuICAgICAgICBjaGFyYWN0ZXIubW90aW9uR3JvdXAgPSB7IG5hbWU6IEBwYXJhbXMuZGF0YS5tb3Rpb25Hcm91cCwgbG9vcDogQHBhcmFtcy5sb29wLCBwbGF5VHlwZTogQHBhcmFtcy5wbGF5VHlwZSB9XG4gICAgICAgIGlmIEBwYXJhbXMud2FpdEZvckNvbXBsZXRpb24gYW5kIG5vdCBAcGFyYW1zLmxvb3BcbiAgICAgICAgICAgIG1vdGlvbnMgPSBjaGFyYWN0ZXIubW9kZWwubW90aW9uc0J5R3JvdXBbY2hhcmFjdGVyLm1vdGlvbkdyb3VwLm5hbWVdXG4gICAgICAgICAgICBpZiBtb3Rpb25zP1xuICAgICAgICAgICAgICAgIEBpbnRlcnByZXRlci5pc1dhaXRpbmcgPSB5ZXNcbiAgICAgICAgICAgICAgICBAaW50ZXJwcmV0ZXIud2FpdENvdW50ZXIgPSBtb3Rpb25zLnN1bSAobSkgLT4gbS5nZXREdXJhdGlvbk1TZWMoKSAvIDE2LjZcbiAgICAgICAgZ3MuR2FtZU5vdGlmaWVyLnBvc3RNaW5vckNoYW5nZSgpXG4gICAgXG4gICAgIyMjKlxuICAgICogQG1ldGhvZCBjb21tYW5kTDJETW90aW9uXG4gICAgKiBAcHJvdGVjdGVkXG4gICAgIyMjICBcbiAgICBjb21tYW5kTDJETW90aW9uOiAtPlxuICAgICAgICBkZWZhdWx0cyA9IEdhbWVNYW5hZ2VyLmRlZmF1bHRzLmxpdmUyZFxuICAgICAgICBmbGFncyA9IEBwYXJhbXMuZmllbGRGbGFncyB8fCB7fVxuICAgICAgICBpc0xvY2tlZCA9IGdzLkNvbW1hbmRGaWVsZEZsYWdzLmlzTG9ja2VkXG4gICAgICAgIHNjZW5lID0gU2NlbmVNYW5hZ2VyLnNjZW5lXG4gICAgICAgIGNoYXJhY3RlciA9IHNjZW5lLmNoYXJhY3RlcnMuZmlyc3QgKHYpID0+ICF2LmRpc3Bvc2VkIGFuZCB2LnJpZCA9PSBAcGFyYW1zLmNoYXJhY3RlcklkIFxuICAgICAgICBpZiBub3QgY2hhcmFjdGVyIGluc3RhbmNlb2Ygdm4uT2JqZWN0X0xpdmUyRENoYXJhY3RlciB0aGVuIHJldHVyblxuICAgICAgICBmYWRlSW5UaW1lID0gaWYgIWlzTG9ja2VkKGZsYWdzLmZhZGVJblRpbWUpIHRoZW4gQHBhcmFtcy5mYWRlSW5UaW1lIGVsc2UgZGVmYXVsdHMubW90aW9uRmFkZUluVGltZVxuICAgICAgICBjaGFyYWN0ZXIubW90aW9uID0geyBuYW1lOiBAcGFyYW1zLmRhdGEubW90aW9uLCBmYWRlSW5UaW1lOiBmYWRlSW5UaW1lLCBsb29wOiBAcGFyYW1zLmxvb3AgfVxuICAgICAgICBjaGFyYWN0ZXIubW90aW9uR3JvdXAgPSBudWxsXG4gICAgICAgIFxuICAgICAgICBpZiBAcGFyYW1zLndhaXRGb3JDb21wbGV0aW9uIGFuZCBub3QgQHBhcmFtcy5sb29wXG4gICAgICAgICAgICBtb3Rpb24gPSBjaGFyYWN0ZXIubW9kZWwubW90aW9uc1tjaGFyYWN0ZXIubW90aW9uLm5hbWVdXG4gICAgICAgICAgICBpZiBtb3Rpb24/XG4gICAgICAgICAgICAgICAgQGludGVycHJldGVyLmlzV2FpdGluZyA9IHllc1xuICAgICAgICAgICAgICAgIEBpbnRlcnByZXRlci53YWl0Q291bnRlciA9IG1vdGlvbi5nZXREdXJhdGlvbk1TZWMoKSAvIDE2LjZcbiAgICAgICAgZ3MuR2FtZU5vdGlmaWVyLnBvc3RNaW5vckNoYW5nZSgpXG4gICAgXG4gICAgIyMjKlxuICAgICogQG1ldGhvZCBjb21tYW5kTDJERXhwcmVzc2lvblxuICAgICogQHByb3RlY3RlZFxuICAgICMjIyBcbiAgICBjb21tYW5kTDJERXhwcmVzc2lvbjogLT5cbiAgICAgICAgZGVmYXVsdHMgPSBHYW1lTWFuYWdlci5kZWZhdWx0cy5saXZlMmRcbiAgICAgICAgZmxhZ3MgPSBAcGFyYW1zLmZpZWxkRmxhZ3MgfHwge31cbiAgICAgICAgaXNMb2NrZWQgPSBncy5Db21tYW5kRmllbGRGbGFncy5pc0xvY2tlZFxuICAgICAgICBzY2VuZSA9IFNjZW5lTWFuYWdlci5zY2VuZVxuICAgICAgICBjaGFyYWN0ZXIgPSBzY2VuZS5jaGFyYWN0ZXJzLmZpcnN0ICh2KSA9PiAhdi5kaXNwb3NlZCBhbmQgdi5yaWQgPT0gQHBhcmFtcy5jaGFyYWN0ZXJJZCBcbiAgICAgICAgaWYgbm90IGNoYXJhY3RlciBpbnN0YW5jZW9mIHZuLk9iamVjdF9MaXZlMkRDaGFyYWN0ZXIgdGhlbiByZXR1cm5cbiAgICAgICAgZmFkZUluVGltZSA9IGlmICFpc0xvY2tlZChmbGFncy5mYWRlSW5UaW1lKSB0aGVuIEBwYXJhbXMuZmFkZUluVGltZSBlbHNlIGRlZmF1bHRzLmV4cHJlc3Npb25GYWRlSW5UaW1lXG4gICAgICAgIFxuICAgICAgICBjaGFyYWN0ZXIuZXhwcmVzc2lvbiA9IHsgbmFtZTogQHBhcmFtcy5kYXRhLmV4cHJlc3Npb24sIGZhZGVJblRpbWU6IGZhZGVJblRpbWUgfVxuICAgICAgICBncy5HYW1lTm90aWZpZXIucG9zdE1pbm9yQ2hhbmdlKClcbiAgICAgXG4gICAgIyMjKlxuICAgICogQG1ldGhvZCBjb21tYW5kTDJERXhpdFNjZW5lXG4gICAgKiBAcHJvdGVjdGVkXG4gICAgIyMjICAgICBcbiAgICBjb21tYW5kTDJERXhpdFNjZW5lOiAtPlxuICAgICAgICBkZWZhdWx0cyA9IEdhbWVNYW5hZ2VyLmRlZmF1bHRzLmxpdmUyZFxuICAgICAgICBAaW50ZXJwcmV0ZXIuY29tbWFuZENoYXJhY3RlckV4aXRTY2VuZS5jYWxsKHRoaXMsIGRlZmF1bHRzKVxuICAgICAgICBncy5HYW1lTm90aWZpZXIucG9zdE1pbm9yQ2hhbmdlKClcbiAgICBcbiAgICAjIyMqXG4gICAgKiBAbWV0aG9kIGNvbW1hbmRMMkRTZXR0aW5nc1xuICAgICogQHByb3RlY3RlZFxuICAgICMjIyAgICBcbiAgICBjb21tYW5kTDJEU2V0dGluZ3M6IC0+XG4gICAgICAgIGZsYWdzID0gQHBhcmFtcy5maWVsZEZsYWdzIHx8IHt9XG4gICAgICAgIGlzTG9ja2VkID0gZ3MuQ29tbWFuZEZpZWxkRmxhZ3MuaXNMb2NrZWRcbiAgICAgICAgXG4gICAgICAgIHNjZW5lID0gU2NlbmVNYW5hZ2VyLnNjZW5lXG4gICAgICAgIGNoYXJhY3RlciA9IHNjZW5lLmNoYXJhY3RlcnMuZmlyc3QgKHYpID0+ICF2LmRpc3Bvc2VkIGFuZCB2LnJpZCA9PSBAcGFyYW1zLmNoYXJhY3RlcklkIFxuICAgICAgICBpZiBub3QgY2hhcmFjdGVyPy52aXN1YWwubDJkT2JqZWN0IHRoZW4gcmV0dXJuXG4gICAgICAgIFxuICAgICAgICBcbiAgICAgICAgaWYgIWlzTG9ja2VkKGZsYWdzLmxpcFN5bmNTZW5zaXRpdml0eSlcbiAgICAgICAgICAgIGNoYXJhY3Rlci52aXN1YWwubDJkT2JqZWN0LmxpcFN5bmNTZW5zaXRpdml0eSA9IEBpbnRlcnByZXRlci5udW1iZXJWYWx1ZU9mKEBwYXJhbXMubGlwU3luY1NlbnNpdGl2aXR5KVxuICAgICAgICBpZiAhaXNMb2NrZWQoZmxhZ3MuaWRsZUludGVuc2l0eSkgICAgXG4gICAgICAgICAgICBjaGFyYWN0ZXIudmlzdWFsLmwyZE9iamVjdC5pZGxlSW50ZW5zaXR5ID0gQGludGVycHJldGVyLm51bWJlclZhbHVlT2YoQHBhcmFtcy5pZGxlSW50ZW5zaXR5KVxuICAgICAgICBpZiAhaXNMb2NrZWQoZmxhZ3MuYnJlYXRoSW50ZW5zaXR5KVxuICAgICAgICAgICAgY2hhcmFjdGVyLnZpc3VhbC5sMmRPYmplY3QuYnJlYXRoSW50ZW5zaXR5ID0gQGludGVycHJldGVyLm51bWJlclZhbHVlT2YoQHBhcmFtcy5icmVhdGhJbnRlbnNpdHkpXG4gICAgICAgIGlmICFpc0xvY2tlZChmbGFnc1tcImV5ZUJsaW5rLmVuYWJsZWRcIl0pXG4gICAgICAgICAgICBjaGFyYWN0ZXIudmlzdWFsLmwyZE9iamVjdC5leWVCbGluay5lbmFibGVkID0gQHBhcmFtcy5leWVCbGluay5lbmFibGVkXG4gICAgICAgIGlmICFpc0xvY2tlZChmbGFnc1tcImV5ZUJsaW5rLmludGVydmFsXCJdKVxuICAgICAgICAgICAgY2hhcmFjdGVyLnZpc3VhbC5sMmRPYmplY3QuZXllQmxpbmsuYmxpbmtJbnRlcnZhbE1zZWMgPSBAaW50ZXJwcmV0ZXIubnVtYmVyVmFsdWVPZihAcGFyYW1zLmV5ZUJsaW5rLmludGVydmFsKVxuICAgICAgICBpZiAhaXNMb2NrZWQoZmxhZ3NbXCJleWVCbGluay5jbG9zZWRNb3Rpb25UaW1lXCJdKVxuICAgICAgICAgICAgY2hhcmFjdGVyLnZpc3VhbC5sMmRPYmplY3QuZXllQmxpbmsuY2xvc2VkTW90aW9uTXNlYyA9IEBpbnRlcnByZXRlci5udW1iZXJWYWx1ZU9mKEBwYXJhbXMuZXllQmxpbmsuY2xvc2VkTW90aW9uVGltZSlcbiAgICAgICAgaWYgIWlzTG9ja2VkKGZsYWdzW1wiZXllQmxpbmsuY2xvc2luZ01vdGlvblRpbWVcIl0pXG4gICAgICAgICAgICBjaGFyYWN0ZXIudmlzdWFsLmwyZE9iamVjdC5leWVCbGluay5jbG9zaW5nTW90aW9uTXNlYyA9IEBpbnRlcnByZXRlci5udW1iZXJWYWx1ZU9mKEBwYXJhbXMuZXllQmxpbmsuY2xvc2luZ01vdGlvblRpbWUpXG4gICAgICAgIGlmICFpc0xvY2tlZChmbGFnc1tcImV5ZUJsaW5rLm9wZW5pbmdNb3Rpb25UaW1lXCJdKVxuICAgICAgICAgICAgY2hhcmFjdGVyLnZpc3VhbC5sMmRPYmplY3QuZXllQmxpbmsub3BlbmluZ01vdGlvbk1zZWMgPSBAaW50ZXJwcmV0ZXIubnVtYmVyVmFsdWVPZihAcGFyYW1zLmV5ZUJsaW5rLm9wZW5pbmdNb3Rpb25UaW1lKVxuICAgICAgICBcbiAgICAgICAgZ3MuR2FtZU5vdGlmaWVyLnBvc3RNaW5vckNoYW5nZSgpXG4gICAgIyMjKlxuICAgICogQG1ldGhvZCBjb21tYW5kTDJEUGFyYW1ldGVyXG4gICAgKiBAcHJvdGVjdGVkXG4gICAgIyMjICAgIFxuICAgIGNvbW1hbmRMMkRQYXJhbWV0ZXI6IC0+XG4gICAgICAgIHNjZW5lID0gU2NlbmVNYW5hZ2VyLnNjZW5lXG4gICAgICAgIGNoYXJhY3RlciA9IHNjZW5lLmNoYXJhY3RlcnMuZmlyc3QgKHYpID0+ICF2LmRpc3Bvc2VkIGFuZCB2LnJpZCA9PSBAcGFyYW1zLmNoYXJhY3RlcklkIFxuICAgICAgICBpZiBub3QgY2hhcmFjdGVyIGluc3RhbmNlb2Ygdm4uT2JqZWN0X0xpdmUyRENoYXJhY3RlciB0aGVuIHJldHVyblxuICAgICAgICBcbiAgICAgICAgZWFzaW5nID0gZ3MuRWFzaW5ncy5mcm9tT2JqZWN0KEBwYXJhbXMuZWFzaW5nKVxuICAgICAgICBkdXJhdGlvbiA9IEBpbnRlcnByZXRlci5kdXJhdGlvblZhbHVlT2YoQHBhcmFtcy5kdXJhdGlvbilcbiAgICAgICAgY2hhcmFjdGVyLmFuaW1hdG9yLmwyZFBhcmFtZXRlclRvKEBwYXJhbXMucGFyYW0ubmFtZSwgQGludGVycHJldGVyLm51bWJlclZhbHVlT2YoQHBhcmFtcy5wYXJhbS52YWx1ZSksIGR1cmF0aW9uLCBlYXNpbmcpXG4gICAgICAgIFxuICAgICAgICBpZiBAcGFyYW1zLndhaXRGb3JDb21wbGV0aW9uIGFuZCBub3QgKGR1cmF0aW9uID09IDAgb3IgQGludGVycHJldGVyLmlzSW5zdGFudFNraXAoKSlcbiAgICAgICAgICAgIEBpbnRlcnByZXRlci5pc1dhaXRpbmcgPSB5ZXNcbiAgICAgICAgICAgIEBpbnRlcnByZXRlci53YWl0Q291bnRlciA9IGR1cmF0aW9uXG4gICAgICAgIGdzLkdhbWVOb3RpZmllci5wb3N0TWlub3JDaGFuZ2UoKVxuICAgICMjIypcbiAgICAqIEBtZXRob2QgY29tbWFuZEwyRERlZmF1bHRzXG4gICAgKiBAcHJvdGVjdGVkXG4gICAgIyMjICAgIFxuICAgIGNvbW1hbmRMMkREZWZhdWx0czogLT5cbiAgICAgICAgZGVmYXVsdHMgPSBHYW1lTWFuYWdlci5kZWZhdWx0cy5saXZlMmRcbiAgICAgICAgZmxhZ3MgPSBAcGFyYW1zLmZpZWxkRmxhZ3MgfHwge31cbiAgICAgICAgaXNMb2NrZWQgPSBncy5Db21tYW5kRmllbGRGbGFncy5pc0xvY2tlZFxuICAgICAgICBcbiAgICAgICAgaWYgIWlzTG9ja2VkKGZsYWdzLmFwcGVhckR1cmF0aW9uKSB0aGVuIGRlZmF1bHRzLmFwcGVhckR1cmF0aW9uID0gQGludGVycHJldGVyLmR1cmF0aW9uVmFsdWVPZihAcGFyYW1zLmFwcGVhckR1cmF0aW9uKVxuICAgICAgICBpZiAhaXNMb2NrZWQoZmxhZ3MuZGlzYXBwZWFyRHVyYXRpb24pIHRoZW4gZGVmYXVsdHMuZGlzYXBwZWFyRHVyYXRpb24gPSBAaW50ZXJwcmV0ZXIuZHVyYXRpb25WYWx1ZU9mKEBwYXJhbXMuZGlzYXBwZWFyRHVyYXRpb24pXG4gICAgICAgIGlmICFpc0xvY2tlZChmbGFncy56T3JkZXIpIHRoZW4gZGVmYXVsdHMuek9yZGVyID0gQGludGVycHJldGVyLm51bWJlclZhbHVlT2YoQHBhcmFtcy56T3JkZXIpXG4gICAgICAgIGlmICFpc0xvY2tlZChmbGFncy5tb3Rpb25GYWRlSW5UaW1lKSB0aGVuIGRlZmF1bHRzLm1vdGlvbkZhZGVJblRpbWUgPSBAaW50ZXJwcmV0ZXIubnVtYmVyVmFsdWVPZihAcGFyYW1zLm1vdGlvbkZhZGVJblRpbWUpXG4gICAgICAgIGlmICFpc0xvY2tlZChmbGFnc1tcImFwcGVhckVhc2luZy50eXBlXCJdKSB0aGVuIGRlZmF1bHRzLmFwcGVhckVhc2luZyA9IEBwYXJhbXMuYXBwZWFyRWFzaW5nXG4gICAgICAgIGlmICFpc0xvY2tlZChmbGFnc1tcImFwcGVhckFuaW1hdGlvbi50eXBlXCJdKSB0aGVuIGRlZmF1bHRzLmFwcGVhckFuaW1hdGlvbiA9IEBwYXJhbXMuYXBwZWFyQW5pbWF0aW9uXG4gICAgICAgIGlmICFpc0xvY2tlZChmbGFnc1tcImRpc2FwcGVhckVhc2luZy50eXBlXCJdKSB0aGVuIGRlZmF1bHRzLmRpc2FwcGVhckVhc2luZyA9IEBwYXJhbXMuZGlzYXBwZWFyRWFzaW5nXG4gICAgICAgIGlmICFpc0xvY2tlZChmbGFnc1tcImRpc2FwcGVhckFuaW1hdGlvbi50eXBlXCJdKSB0aGVuIGRlZmF1bHRzLmRpc2FwcGVhckFuaW1hdGlvbiA9IEBwYXJhbXMuZGlzYXBwZWFyQW5pbWF0aW9uXG4gICAgICAgIFxuICAgICAgICBncy5HYW1lTm90aWZpZXIucG9zdE1pbm9yQ2hhbmdlKClcbiAgICAjIyMqXG4gICAgKiBAbWV0aG9kIGNvbW1hbmRMMkRKb2luU2NlbmVcbiAgICAqIEBwcm90ZWN0ZWRcbiAgICAjIyMgICBcbiAgICBjb21tYW5kTDJESm9pblNjZW5lOiAtPlxuICAgICAgICBkZWZhdWx0cyA9IEdhbWVNYW5hZ2VyLmRlZmF1bHRzLmxpdmUyZFxuICAgICAgICBmbGFncyA9IEBwYXJhbXMuZmllbGRGbGFncyB8fCB7fVxuICAgICAgICBpc0xvY2tlZCA9IGdzLkNvbW1hbmRGaWVsZEZsYWdzLmlzTG9ja2VkXG4gICAgICAgIHNjZW5lID0gU2NlbmVNYW5hZ2VyLnNjZW5lXG4gICAgICAgIHJlY29yZCA9IFJlY29yZE1hbmFnZXIuY2hhcmFjdGVyc1tAaW50ZXJwcmV0ZXIuc3RyaW5nVmFsdWVPZihAcGFyYW1zLmNoYXJhY3RlcklkKV1cbiAgICAgICAgcmV0dXJuIGlmICFyZWNvcmQgb3Igc2NlbmUuY2hhcmFjdGVycy5maXJzdCAodikgLT4gIXYuZGlzcG9zZWQgYW5kIHYucmlkID09IHJlY29yZC5pbmRleFxuICAgICAgICBcbiAgICAgICAgaWYgQHBhcmFtcy5wb3NpdGlvblR5cGUgPT0gMVxuICAgICAgICAgICAgeCA9IEBwYXJhbXMucG9zaXRpb24ueFxuICAgICAgICAgICAgeSA9IEBwYXJhbXMucG9zaXRpb24ueVxuICAgICAgICBlbHNlIGlmIEBwYXJhbXMucG9zaXRpb25UeXBlID09IDJcbiAgICAgICAgICAgIHggPSBAaW50ZXJwcmV0ZXIubnVtYmVyVmFsdWVPZihAcGFyYW1zLnBvc2l0aW9uLngpXG4gICAgICAgICAgICB5ID0gQGludGVycHJldGVyLm51bWJlclZhbHVlT2YoQHBhcmFtcy5wb3NpdGlvbi55KVxuICAgICAgICAgICAgXG4gICAgICAgIGVhc2luZyA9IGlmICFpc0xvY2tlZChmbGFnc1tcImVhc2luZy50eXBlXCJdKSB0aGVuIGdzLkVhc2luZ3MuZnJvbVZhbHVlcyhAaW50ZXJwcmV0ZXIubnVtYmVyVmFsdWVPZihAcGFyYW1zLmVhc2luZy50eXBlKSwgQHBhcmFtcy5lYXNpbmcuaW5PdXQpIGVsc2UgZ3MuRWFzaW5ncy5mcm9tT2JqZWN0KGRlZmF1bHRzLmFwcGVhckVhc2luZylcbiAgICAgICAgZHVyYXRpb24gPSBpZiAhaXNMb2NrZWQoZmxhZ3MuZHVyYXRpb24pIHRoZW4gQGludGVycHJldGVyLmR1cmF0aW9uVmFsdWVPZihAcGFyYW1zLmR1cmF0aW9uKSBlbHNlIGRlZmF1bHRzLmFwcGVhckR1cmF0aW9uXG4gICAgICAgIHpJbmRleCA9IGlmICFpc0xvY2tlZChmbGFncy56T3JkZXIpIHRoZW4gQGludGVycHJldGVyLm51bWJlclZhbHVlT2YoQHBhcmFtcy56T3JkZXIpIGVsc2UgZGVmYXVsdHMuek9yZGVyXG4gICAgICAgIGFuaW1hdGlvbiA9IGlmICFpc0xvY2tlZChmbGFnc1tcImFuaW1hdGlvbi50eXBlXCJdKSB0aGVuIEBwYXJhbXMuYW5pbWF0aW9uIGVsc2UgZGVmYXVsdHMuYXBwZWFyQW5pbWF0aW9uXG4gICAgICAgIG1vdGlvbkJsdXIgPSBpZiAhaXNMb2NrZWQoZmxhZ3NbXCJtb3Rpb25CbHVyLmVuYWJsZWRcIl0pIHRoZW4gQHBhcmFtcy5tb3Rpb25CbHVyIGVsc2UgZGVmYXVsdHMubW90aW9uQmx1clxuICAgICAgICBvcmlnaW4gPSBpZiAhaXNMb2NrZWQoZmxhZ3Mub3JpZ2luKSB0aGVuIEBwYXJhbXMub3JpZ2luIGVsc2UgZGVmYXVsdHMub3JpZ2luXG5cbiAgICAgICAgaWYgQHBhcmFtcy53YWl0Rm9yQ29tcGxldGlvbiBhbmQgbm90IChkdXJhdGlvbiA9PSAwIG9yIEBpbnRlcnByZXRlci5pc0luc3RhbnRTa2lwKCkpXG4gICAgICAgICAgICBAaW50ZXJwcmV0ZXIuaXNXYWl0aW5nID0geWVzXG4gICAgICAgICAgICBAaW50ZXJwcmV0ZXIud2FpdENvdW50ZXIgPSBkdXJhdGlvblxuICAgICAgICAgICAgXG5cbiAgICAgICAgY2hhcmFjdGVyID0gbmV3IHZuLk9iamVjdF9MaXZlMkRDaGFyYWN0ZXIocmVjb3JkKVxuICAgICAgICBjaGFyYWN0ZXIubW9kZWxOYW1lID0gQHBhcmFtcy5tb2RlbD8ubmFtZSB8fCBcIlwiXG4gICAgICAgIGNoYXJhY3Rlci5tb2RlbCA9IFJlc291cmNlTWFuYWdlci5nZXRMaXZlMkRNb2RlbChcIkxpdmUyRC8je2NoYXJhY3Rlci5tb2RlbE5hbWV9XCIpXG4gICAgICAgIGNoYXJhY3Rlci5tb3Rpb24gPSB7IG5hbWU6IFwiXCIsIGZhZGVJblRpbWU6IDAsIGxvb3A6IHRydWUgfSBpZiBjaGFyYWN0ZXIubW9kZWwubW90aW9uc1xuICAgICAgICAjY2hhcmFjdGVyLmV4cHJlc3Npb24gPSB7IG5hbWU6IE9iamVjdC5rZXlzKGNoYXJhY3Rlci5tb2RlbC5leHByZXNzaW9ucylbMF0sIGZhZGVJblRpbWU6IDAgfSBpZiBjaGFyYWN0ZXIubW9kZWwuZXhwcmVzc2lvbnNcbiAgICAgICAgY2hhcmFjdGVyLmRzdFJlY3QueCA9IHhcbiAgICAgICAgY2hhcmFjdGVyLmRzdFJlY3QueSA9IHlcbiAgICAgICAgY2hhcmFjdGVyLmFuY2hvci54ID0gaWYgIW9yaWdpbiB0aGVuIDAgZWxzZSAwLjVcbiAgICAgICAgY2hhcmFjdGVyLmFuY2hvci55ID0gaWYgIW9yaWdpbiB0aGVuIDAgZWxzZSAwLjVcbiAgICAgICAgXG4gICAgICAgIGNoYXJhY3Rlci5ibGVuZE1vZGUgPSBAaW50ZXJwcmV0ZXIubnVtYmVyVmFsdWVPZihAcGFyYW1zLmJsZW5kTW9kZSlcbiAgICAgICAgY2hhcmFjdGVyLnpvb20ueCA9IEBwYXJhbXMucG9zaXRpb24uem9vbS5kXG4gICAgICAgIGNoYXJhY3Rlci56b29tLnkgPSBAcGFyYW1zLnBvc2l0aW9uLnpvb20uZFxuICAgICAgICBjaGFyYWN0ZXIuekluZGV4ID0gekluZGV4IHx8IDIwMFxuICAgICAgICBjaGFyYWN0ZXIubW9kZWw/LnJlc2V0KClcbiAgICAgICAgY2hhcmFjdGVyLnNldHVwKClcbiAgICAgICAgY2hhcmFjdGVyLnZpc3VhbC5sMmRPYmplY3QuaWRsZUludGVuc2l0eSA9IHJlY29yZC5pZGxlSW50ZW5zaXR5ID8gMS4wXG4gICAgICAgIGNoYXJhY3Rlci52aXN1YWwubDJkT2JqZWN0LmJyZWF0aEludGVuc2l0eSA9IHJlY29yZC5icmVhdGhJbnRlbnNpdHkgPyAxLjAgXG4gICAgICAgIGNoYXJhY3Rlci52aXN1YWwubDJkT2JqZWN0LmxpcFN5bmNTZW5zaXRpdml0eSA9IHJlY29yZC5saXBTeW5jU2Vuc2l0aXZpdHkgPyAxLjBcbiAgICAgICAgXG4gICAgICAgIGNoYXJhY3Rlci51cGRhdGUoKVxuICAgICAgICBcbiAgICAgICAgaWYgQHBhcmFtcy5wb3NpdGlvblR5cGUgPT0gMFxuICAgICAgICAgICAgcCA9IEBpbnRlcnByZXRlci5wcmVkZWZpbmVkT2JqZWN0UG9zaXRpb24oQHBhcmFtcy5wcmVkZWZpbmVkUG9zaXRpb25JZCwgY2hhcmFjdGVyLCBAcGFyYW1zKVxuICAgICAgICAgICAgY2hhcmFjdGVyLmRzdFJlY3QueCA9IHAueFxuICAgICAgICAgICAgY2hhcmFjdGVyLmRzdFJlY3QueSA9IHAueVxuICAgICAgICBcbiAgICAgICAgc2NlbmUuYmVoYXZpb3IuYWRkQ2hhcmFjdGVyKGNoYXJhY3Rlciwgbm8sIHsgYW5pbWF0aW9uOiBhbmltYXRpb24sIGR1cmF0aW9uOiBkdXJhdGlvbiwgZWFzaW5nOiBlYXNpbmcsIG1vdGlvbkJsdXI6IG1vdGlvbkJsdXJ9KVxuICAgICAgICBcbiAgICAgICAgaWYgQHBhcmFtcy52aWV3cG9ydD8udHlwZSA9PSBcInVpXCJcbiAgICAgICAgICAgIGNoYXJhY3Rlci52aWV3cG9ydCA9IEdyYXBoaWNzLnZpZXdwb3J0XG4gICAgICAgICAgICBcbiAgICAgICAgZ3MuR2FtZU5vdGlmaWVyLnBvc3RNaW5vckNoYW5nZSgpXG4gICAgIyMjKlxuICAgICogQG1ldGhvZCBjb21tYW5kQ2hhcmFjdGVySm9pblNjZW5lXG4gICAgKiBAcHJvdGVjdGVkXG4gICAgIyMjICAgXG4gICAgY29tbWFuZENoYXJhY3RlckpvaW5TY2VuZTogLT5cbiAgICAgICAgZGVmYXVsdHMgPSBHYW1lTWFuYWdlci5kZWZhdWx0cy5jaGFyYWN0ZXJcbiAgICAgICAgZmxhZ3MgPSBAcGFyYW1zLmZpZWxkRmxhZ3MgfHwge31cbiAgICAgICAgaXNMb2NrZWQgPSBncy5Db21tYW5kRmllbGRGbGFncy5pc0xvY2tlZFxuICAgICAgICBzY2VuZSA9IFNjZW5lTWFuYWdlci5zY2VuZVxuICAgICAgICByZWNvcmQgPSBSZWNvcmRNYW5hZ2VyLmNoYXJhY3RlcnNbQHBhcmFtcy5jaGFyYWN0ZXJJZF1cbiAgICAgICAgcmV0dXJuIGlmICFyZWNvcmQgb3Igc2NlbmUuY2hhcmFjdGVycy5maXJzdCAodikgLT4gIXYuZGlzcG9zZWQgYW5kIHYucmlkID09IHJlY29yZC5pbmRleCBhbmQgIXYuZGlzcG9zZWRcbiAgICAgICAgXG4gICAgICAgIGNoYXJhY3RlciA9IG5ldyB2bi5PYmplY3RfQ2hhcmFjdGVyKHJlY29yZCwgbnVsbCwgc2NlbmUpXG4gICAgICAgIGNoYXJhY3Rlci5leHByZXNzaW9uID0gUmVjb3JkTWFuYWdlci5jaGFyYWN0ZXJFeHByZXNzaW9uc1tAcGFyYW1zLmV4cHJlc3Npb25JZCA/IHJlY29yZC5kZWZhdWx0RXhwcmVzc2lvbklkfHwwXSAjY2hhcmFjdGVyLmV4cHJlc3Npb25cbiAgICAgICAgaWYgY2hhcmFjdGVyLmV4cHJlc3Npb24/XG4gICAgICAgICAgICBiaXRtYXAgPSBSZXNvdXJjZU1hbmFnZXIuZ2V0Qml0bWFwKFwiR3JhcGhpY3MvQ2hhcmFjdGVycy8je2NoYXJhY3Rlci5leHByZXNzaW9uLmlkbGVbMF0/LnJlc291cmNlLm5hbWV9XCIpXG4gICAgICAgIFxuICAgICAgICBtaXJyb3IgPSBub1xuICAgICAgICBhbmdsZSA9IDBcbiAgICAgICAgem9vbSA9IDFcbiAgICAgICAgXG4gICAgICAgIGlmIEBwYXJhbXMucG9zaXRpb25UeXBlID09IDFcbiAgICAgICAgICAgIHggPSBAaW50ZXJwcmV0ZXIubnVtYmVyVmFsdWVPZihAcGFyYW1zLnBvc2l0aW9uLngpXG4gICAgICAgICAgICB5ID0gQGludGVycHJldGVyLm51bWJlclZhbHVlT2YoQHBhcmFtcy5wb3NpdGlvbi55KVxuICAgICAgICAgICAgbWlycm9yID0gQHBhcmFtcy5wb3NpdGlvbi5ob3Jpem9udGFsRmxpcFxuICAgICAgICAgICAgYW5nbGUgPSBAcGFyYW1zLnBvc2l0aW9uLmFuZ2xlfHwwXG4gICAgICAgICAgICB6b29tID0gQHBhcmFtcy5wb3NpdGlvbi5kYXRhPy56b29tIHx8IDFcbiAgICAgICAgZWxzZSBpZiBAcGFyYW1zLnBvc2l0aW9uVHlwZSA9PSAyXG4gICAgICAgICAgICB4ID0gQGludGVycHJldGVyLm51bWJlclZhbHVlT2YoQHBhcmFtcy5wb3NpdGlvbi54KVxuICAgICAgICAgICAgeSA9IEBpbnRlcnByZXRlci5udW1iZXJWYWx1ZU9mKEBwYXJhbXMucG9zaXRpb24ueSlcbiAgICAgICAgICAgIG1pcnJvciA9IG5vXG4gICAgICAgICAgICBhbmdsZSA9IDBcbiAgICAgICAgICAgIHpvb20gPSAxXG4gICAgICAgIFxuICAgICAgICBlYXNpbmcgPSBpZiAhaXNMb2NrZWQoZmxhZ3NbXCJlYXNpbmcudHlwZVwiXSkgdGhlbiBncy5FYXNpbmdzLmZyb21WYWx1ZXMoQGludGVycHJldGVyLm51bWJlclZhbHVlT2YoQHBhcmFtcy5lYXNpbmcudHlwZSksIEBwYXJhbXMuZWFzaW5nLmluT3V0KSBlbHNlIGdzLkVhc2luZ3MuZnJvbU9iamVjdChkZWZhdWx0cy5hcHBlYXJFYXNpbmcpXG4gICAgICAgIGR1cmF0aW9uID0gaWYgIWlzTG9ja2VkKGZsYWdzLmR1cmF0aW9uKSB0aGVuIEBpbnRlcnByZXRlci5kdXJhdGlvblZhbHVlT2YoQHBhcmFtcy5kdXJhdGlvbikgZWxzZSBkZWZhdWx0cy5hcHBlYXJEdXJhdGlvblxuICAgICAgICBvcmlnaW4gPSBpZiAhaXNMb2NrZWQoZmxhZ3Mub3JpZ2luKSB0aGVuIEBwYXJhbXMub3JpZ2luIGVsc2UgZGVmYXVsdHMub3JpZ2luXG4gICAgICAgIHpJbmRleCA9IGlmICFpc0xvY2tlZChmbGFncy56T3JkZXIpIHRoZW4gQGludGVycHJldGVyLm51bWJlclZhbHVlT2YoQHBhcmFtcy56T3JkZXIpIGVsc2UgZGVmYXVsdHMuek9yZGVyXG4gICAgICAgIGFuaW1hdGlvbiA9IGlmICFpc0xvY2tlZChmbGFnc1tcImFuaW1hdGlvbi50eXBlXCJdKSB0aGVuIEBwYXJhbXMuYW5pbWF0aW9uIGVsc2UgZGVmYXVsdHMuYXBwZWFyQW5pbWF0aW9uXG4gICAgICAgIG1vdGlvbkJsdXIgPSBpZiAhaXNMb2NrZWQoZmxhZ3NbXCJtb3Rpb25CbHVyLmVuYWJsZWRcIl0pIHRoZW4gQHBhcmFtcy5tb3Rpb25CbHVyIGVsc2UgZGVmYXVsdHMubW90aW9uQmx1clxuICAgICAgXG4gICAgICAgIGlmIEBwYXJhbXMud2FpdEZvckNvbXBsZXRpb24gYW5kIG5vdCAoZHVyYXRpb24gPT0gMCBvciBAaW50ZXJwcmV0ZXIuaXNJbnN0YW50U2tpcCgpKVxuICAgICAgICAgICAgQGludGVycHJldGVyLmlzV2FpdGluZyA9IHllc1xuICAgICAgICAgICAgQGludGVycHJldGVyLndhaXRDb3VudGVyID0gZHVyYXRpb25cbiAgICAgICAgXG4gICAgICAgIFxuICAgICAgICBpZiBjaGFyYWN0ZXIuZXhwcmVzc2lvbj9cbiAgICAgICAgICAgIGJpdG1hcCA9IFJlc291cmNlTWFuYWdlci5nZXRCaXRtYXAoXCJHcmFwaGljcy9DaGFyYWN0ZXJzLyN7Y2hhcmFjdGVyLmV4cHJlc3Npb24uaWRsZVswXT8ucmVzb3VyY2UubmFtZX1cIilcbiAgICAgICAgICAgIGlmIEBwYXJhbXMub3JpZ2luID09IDEgYW5kIGJpdG1hcD9cbiAgICAgICAgICAgICAgICB4ICs9IChiaXRtYXAud2lkdGgqem9vbS1iaXRtYXAud2lkdGgpLzJcbiAgICAgICAgICAgICAgICB5ICs9IChiaXRtYXAuaGVpZ2h0Knpvb20tYml0bWFwLmhlaWdodCkvMlxuICAgICAgICAgICAgICAgIFxuICAgICAgICBjaGFyYWN0ZXIubWlycm9yID0gbWlycm9yXG4gICAgICAgIGNoYXJhY3Rlci5hbmNob3IueCA9IGlmICFvcmlnaW4gdGhlbiAwIGVsc2UgMC41XG4gICAgICAgIGNoYXJhY3Rlci5hbmNob3IueSA9IGlmICFvcmlnaW4gdGhlbiAwIGVsc2UgMC41XG4gICAgICAgIGNoYXJhY3Rlci56b29tLnggPSB6b29tXG4gICAgICAgIGNoYXJhY3Rlci56b29tLnkgPSB6b29tXG4gICAgICAgIGNoYXJhY3Rlci5kc3RSZWN0LnggPSB4XG4gICAgICAgIGNoYXJhY3Rlci5kc3RSZWN0LnkgPSB5XG4gICAgICAgIGNoYXJhY3Rlci56SW5kZXggPSB6SW5kZXggfHwgIDIwMFxuICAgICAgICBjaGFyYWN0ZXIuYmxlbmRNb2RlID0gQGludGVycHJldGVyLm51bWJlclZhbHVlT2YoQHBhcmFtcy5ibGVuZE1vZGUpXG4gICAgICAgIGNoYXJhY3Rlci5hbmdsZSA9IGFuZ2xlXG4gICAgICAgIGNoYXJhY3Rlci5zZXR1cCgpXG4gICAgICAgIGNoYXJhY3Rlci51cGRhdGUoKVxuICAgICAgICBcbiAgICAgICAgaWYgQHBhcmFtcy5wb3NpdGlvblR5cGUgPT0gMFxuICAgICAgICAgICAgcCA9IEBpbnRlcnByZXRlci5wcmVkZWZpbmVkT2JqZWN0UG9zaXRpb24oQHBhcmFtcy5wcmVkZWZpbmVkUG9zaXRpb25JZCwgY2hhcmFjdGVyLCBAcGFyYW1zKVxuICAgICAgICAgICAgY2hhcmFjdGVyLmRzdFJlY3QueCA9IHAueFxuICAgICAgICAgICAgY2hhcmFjdGVyLmRzdFJlY3QueSA9IHAueVxuICAgICAgICBcbiAgICAgICAgc2NlbmUuYmVoYXZpb3IuYWRkQ2hhcmFjdGVyKGNoYXJhY3Rlciwgbm8sIHsgYW5pbWF0aW9uOiBhbmltYXRpb24sIGR1cmF0aW9uOiBkdXJhdGlvbiwgZWFzaW5nOiBlYXNpbmcsIG1vdGlvbkJsdXI6IG1vdGlvbkJsdXJ9KVxuICAgICAgICBcbiAgICAgICAgaWYgQHBhcmFtcy52aWV3cG9ydD8udHlwZSA9PSBcInVpXCJcbiAgICAgICAgICAgIGNoYXJhY3Rlci52aWV3cG9ydCA9IEdyYXBoaWNzLnZpZXdwb3J0XG4gICAgICAgICAgICBcbiAgICAgICAgZ3MuR2FtZU5vdGlmaWVyLnBvc3RNaW5vckNoYW5nZSgpXG4gICAgXG4gICAgIyMjKlxuICAgICogQG1ldGhvZCBjb21tYW5kQ2hhcmFjdGVyRXhpdFNjZW5lXG4gICAgKiBAcHJvdGVjdGVkXG4gICAgIyMjICAgXG4gICAgY29tbWFuZENoYXJhY3RlckV4aXRTY2VuZTogKGRlZmF1bHRzKSAtPlxuICAgICAgICBkZWZhdWx0cyA9IGRlZmF1bHRzIHx8IEdhbWVNYW5hZ2VyLmRlZmF1bHRzLmNoYXJhY3RlclxuICAgICAgICBmbGFncyA9IEBwYXJhbXMuZmllbGRGbGFncyB8fCB7fVxuICAgICAgICBpc0xvY2tlZCA9IGdzLkNvbW1hbmRGaWVsZEZsYWdzLmlzTG9ja2VkXG4gICAgICAgIFxuICAgICAgICBzY2VuZSA9IFNjZW5lTWFuYWdlci5zY2VuZVxuICAgICAgICBjaGFyYWN0ZXIgPSBzY2VuZS5jaGFyYWN0ZXJzLmZpcnN0ICh2KSA9PiAhdi5kaXNwb3NlZCBhbmQgdi5yaWQgPT0gQHBhcmFtcy5jaGFyYWN0ZXJJZFxuICAgICAgICBcbiAgICAgICAgZWFzaW5nID0gaWYgIWlzTG9ja2VkKGZsYWdzW1wiZWFzaW5nLnR5cGVcIl0pIHRoZW4gZ3MuRWFzaW5ncy5mcm9tVmFsdWVzKEBpbnRlcnByZXRlci5udW1iZXJWYWx1ZU9mKEBwYXJhbXMuZWFzaW5nLnR5cGUpLCBAcGFyYW1zLmVhc2luZy5pbk91dCkgZWxzZSBncy5FYXNpbmdzLmZyb21PYmplY3QoZGVmYXVsdHMuZGlzYXBwZWFyRWFzaW5nKVxuICAgICAgICBkdXJhdGlvbiA9IGlmICFpc0xvY2tlZChmbGFncy5kdXJhdGlvbikgdGhlbiBAaW50ZXJwcmV0ZXIuZHVyYXRpb25WYWx1ZU9mKEBwYXJhbXMuZHVyYXRpb24pIGVsc2UgZGVmYXVsdHMuZGlzYXBwZWFyRHVyYXRpb25cbiAgICAgICAgYW5pbWF0aW9uID0gaWYgIWlzTG9ja2VkKGZsYWdzW1wiYW5pbWF0aW9uLnR5cGVcIl0pIHRoZW4gQHBhcmFtcy5hbmltYXRpb24gZWxzZSBkZWZhdWx0cy5kaXNhcHBlYXJBbmltYXRpb25cbiAgICAgIFxuICAgICAgICBpZiBAcGFyYW1zLndhaXRGb3JDb21wbGV0aW9uIGFuZCBub3QgKGR1cmF0aW9uID09IDAgb3IgQGludGVycHJldGVyLmlzSW5zdGFudFNraXAoKSlcbiAgICAgICAgICAgIEBpbnRlcnByZXRlci5pc1dhaXRpbmcgPSB5ZXNcbiAgICAgICAgICAgIEBpbnRlcnByZXRlci53YWl0Q291bnRlciA9IGR1cmF0aW9uXG4gICAgICAgICAgICBcbiAgICAgICAgc2NlbmUuYmVoYXZpb3IucmVtb3ZlQ2hhcmFjdGVyKGNoYXJhY3RlciwgeyBhbmltYXRpb246IGFuaW1hdGlvbiwgZHVyYXRpb246IGR1cmF0aW9uLCBlYXNpbmc6IGVhc2luZ30pICBcbiAgICAgICAgZ3MuR2FtZU5vdGlmaWVyLnBvc3RNaW5vckNoYW5nZSgpXG4gICAgICAgIFxuICAgICMjIypcbiAgICAqIEBtZXRob2QgY29tbWFuZENoYXJhY3RlckNoYW5nZUV4cHJlc3Npb25cbiAgICAqIEBwcm90ZWN0ZWRcbiAgICAjIyMgIFxuICAgIGNvbW1hbmRDaGFyYWN0ZXJDaGFuZ2VFeHByZXNzaW9uOiAtPlxuICAgICAgICBzY2VuZSA9IFNjZW5lTWFuYWdlci5zY2VuZVxuICAgICAgICBjaGFyYWN0ZXIgPSBzY2VuZS5jaGFyYWN0ZXJzLmZpcnN0ICh2KSA9PiAhdi5kaXNwb3NlZCBhbmQgdi5yaWQgPT0gQHBhcmFtcy5jaGFyYWN0ZXJJZCBcbiAgICAgICAgaWYgbm90IGNoYXJhY3Rlcj8gdGhlbiByZXR1cm5cbiAgICAgICAgZGVmYXVsdHMgPSBHYW1lTWFuYWdlci5kZWZhdWx0cy5jaGFyYWN0ZXJcbiAgICAgICAgZmxhZ3MgPSBAcGFyYW1zLmZpZWxkRmxhZ3MgfHwge31cbiAgICAgICAgaXNMb2NrZWQgPSBncy5Db21tYW5kRmllbGRGbGFncy5pc0xvY2tlZFxuICAgICAgICBcbiAgICAgICAgZHVyYXRpb24gPSBpZiAhaXNMb2NrZWQoZmxhZ3MuZHVyYXRpb24pIHRoZW4gQGludGVycHJldGVyLmR1cmF0aW9uVmFsdWVPZihAcGFyYW1zLmR1cmF0aW9uKSBlbHNlIGRlZmF1bHRzLmV4cHJlc3Npb25EdXJhdGlvblxuICAgICAgICBleHByZXNzaW9uID0gUmVjb3JkTWFuYWdlci5jaGFyYWN0ZXJFeHByZXNzaW9uc1tAcGFyYW1zLmV4cHJlc3Npb25JZCB8fCAwXVxuICAgICAgICBlYXNpbmcgPSBpZiAhaXNMb2NrZWQoZmxhZ3NbXCJlYXNpbmcudHlwZVwiXSkgdGhlbiBncy5FYXNpbmdzLmZyb21PYmplY3QoQHBhcmFtcy5lYXNpbmcpIGVsc2UgZ3MuRWFzaW5ncy5mcm9tT2JqZWN0KGRlZmF1bHRzLmNoYW5nZUVhc2luZylcbiAgICAgICAgYW5pbWF0aW9uID0gaWYgIWlzTG9ja2VkKGZsYWdzW1wiYW5pbWF0aW9uLnR5cGVcIl0pIHRoZW4gQHBhcmFtcy5hbmltYXRpb24gZWxzZSBkZWZhdWx0cy5jaGFuZ2VBbmltYXRpb25cbiAgICAgICAgXG4gICAgICAgIGNoYXJhY3Rlci5iZWhhdmlvci5jaGFuZ2VFeHByZXNzaW9uKGV4cHJlc3Npb24sIEBwYXJhbXMuYW5pbWF0aW9uLCBlYXNpbmcsIGR1cmF0aW9uKVxuXG4gICAgICAgIGlmIEBwYXJhbXMud2FpdEZvckNvbXBsZXRpb24gYW5kIG5vdCAoZHVyYXRpb24gPT0gMCBvciBAaW50ZXJwcmV0ZXIuaXNJbnN0YW50U2tpcCgpKVxuICAgICAgICAgICAgQGludGVycHJldGVyLmlzV2FpdGluZyA9IHllc1xuICAgICAgICAgICAgQGludGVycHJldGVyLndhaXRDb3VudGVyID0gZHVyYXRpb25cbiAgICAgICAgICAgIFxuICAgICAgICBncy5HYW1lTm90aWZpZXIucG9zdE1pbm9yQ2hhbmdlKClcbiAgICBcbiAgICAjIyMqXG4gICAgKiBAbWV0aG9kIGNvbW1hbmRDaGFyYWN0ZXJTZXRQYXJhbWV0ZXJcbiAgICAqIEBwcm90ZWN0ZWRcbiAgICAjIyMgICAgXG4gICAgY29tbWFuZENoYXJhY3RlclNldFBhcmFtZXRlcjogLT5cbiAgICAgICAgcGFyYW1zID0gR2FtZU1hbmFnZXIuY2hhcmFjdGVyUGFyYW1zW0BpbnRlcnByZXRlci5zdHJpbmdWYWx1ZU9mKEBwYXJhbXMuY2hhcmFjdGVySWQpXVxuICAgICAgICBpZiBub3QgcGFyYW1zPyBvciBub3QgQHBhcmFtcy5wYXJhbT8gdGhlbiByZXR1cm5cbiAgICAgICAgXG4gICAgICAgIHN3aXRjaCBAcGFyYW1zLnZhbHVlVHlwZVxuICAgICAgICAgICAgd2hlbiAwICMgTnVtYmVyIFZhbHVlXG4gICAgICAgICAgICAgICAgc3dpdGNoIEBwYXJhbXMucGFyYW0udHlwZVxuICAgICAgICAgICAgICAgICAgICB3aGVuIDAgIyBOdW1iZXJcbiAgICAgICAgICAgICAgICAgICAgICAgIHBhcmFtc1tAcGFyYW1zLnBhcmFtLm5hbWVdID0gQGludGVycHJldGVyLm51bWJlclZhbHVlT2YoQHBhcmFtcy5udW1iZXJWYWx1ZSlcbiAgICAgICAgICAgICAgICAgICAgd2hlbiAxICMgU3dpdGNoXG4gICAgICAgICAgICAgICAgICAgICAgICBwYXJhbXNbQHBhcmFtcy5wYXJhbS5uYW1lXSA9IEBpbnRlcnByZXRlci5udW1iZXJWYWx1ZU9mKEBwYXJhbXMubnVtYmVyVmFsdWUpID4gMFxuICAgICAgICAgICAgICAgICAgICB3aGVuIDIgIyBUZXh0XG4gICAgICAgICAgICAgICAgICAgICAgICBwYXJhbXNbQHBhcmFtcy5wYXJhbS5uYW1lXSA9IEBpbnRlcnByZXRlci5udW1iZXJWYWx1ZU9mKEBwYXJhbXMubnVtYmVyVmFsdWUpLnRvU3RyaW5nKClcbiAgICAgICAgICAgIHdoZW4gMSAjIFN3aXRjaCBWYWx1ZVxuICAgICAgICAgICAgICAgIHN3aXRjaCBAcGFyYW1zLnBhcmFtLnR5cGVcbiAgICAgICAgICAgICAgICAgICAgd2hlbiAwICMgTnVtYmVyXG4gICAgICAgICAgICAgICAgICAgICAgICB2YWx1ZSA9IEBpbnRlcnByZXRlci5ib29sZWFuVmFsdWVPZihAcGFyYW1zLnN3aXRjaFZhbHVlKVxuICAgICAgICAgICAgICAgICAgICAgICAgcGFyYW1zW0BwYXJhbXMucGFyYW0ubmFtZV0gPSBpZiB2YWx1ZSB0aGVuIDEgZWxzZSAwXG4gICAgICAgICAgICAgICAgICAgIHdoZW4gMSAjIFN3aXRjaFxuICAgICAgICAgICAgICAgICAgICAgICAgcGFyYW1zW0BwYXJhbXMucGFyYW0ubmFtZV0gPSBAaW50ZXJwcmV0ZXIuYm9vbGVhblZhbHVlT2YoQHBhcmFtcy5zd2l0Y2hWYWx1ZSkgICAgXG4gICAgICAgICAgICAgICAgICAgIHdoZW4gMiAjIFRleHRcbiAgICAgICAgICAgICAgICAgICAgICAgIHZhbHVlID0gQGludGVycHJldGVyLmJvb2xlYW5WYWx1ZU9mKEBwYXJhbXMuc3dpdGNoVmFsdWUpXG4gICAgICAgICAgICAgICAgICAgICAgICBwYXJhbXNbQHBhcmFtcy5wYXJhbS5uYW1lXSA9IGlmIHZhbHVlIHRoZW4gXCJPTlwiIGVsc2UgXCJPRkZcIlxuICAgICAgICAgICAgd2hlbiAyICMgVGV4dCBWYWx1ZVxuICAgICAgICAgICAgICAgIHN3aXRjaCBAcGFyYW1zLnBhcmFtLnR5cGVcbiAgICAgICAgICAgICAgICAgICAgd2hlbiAwICMgTnVtYmVyXG4gICAgICAgICAgICAgICAgICAgICAgICB2YWx1ZSA9IEBpbnRlcnByZXRlci5zdHJpbmdWYWx1ZU9mKEBwYXJhbXMudGV4dFZhbHVlKVxuICAgICAgICAgICAgICAgICAgICAgICAgcGFyYW1zW0BwYXJhbXMucGFyYW0ubmFtZV0gPSB2YWx1ZS5sZW5ndGhcbiAgICAgICAgICAgICAgICAgICAgd2hlbiAxICMgU3dpdGNoXG4gICAgICAgICAgICAgICAgICAgICAgICBwYXJhbXNbQHBhcmFtcy5wYXJhbS5uYW1lXSA9IEBpbnRlcnByZXRlci5zdHJpbmdWYWx1ZU9mKEBwYXJhbXMudGV4dFZhbHVlKSA9PSBcIk9OXCJcbiAgICAgICAgICAgICAgICAgICAgd2hlbiAyICMgVGV4dFxuICAgICAgICAgICAgICAgICAgICAgICAgcGFyYW1zW0BwYXJhbXMucGFyYW0ubmFtZV0gPSBAaW50ZXJwcmV0ZXIuc3RyaW5nVmFsdWVPZihAcGFyYW1zLnRleHRWYWx1ZSlcbiAgICAgICAgICAgICAgICAgICAgXG4gICAgICAgICAgICBcbiAgICAgICAgICAgIFxuICAgICAgICAgICAgICAgICAgICBcbiAgICAjIyMqXG4gICAgKiBAbWV0aG9kIGNvbW1hbmRDaGFyYWN0ZXJHZXRQYXJhbWV0ZXJcbiAgICAqIEBwcm90ZWN0ZWRcbiAgICAjIyMgICAgXG4gICAgY29tbWFuZENoYXJhY3RlckdldFBhcmFtZXRlcjogLT5cbiAgICAgICAgcGFyYW1zID0gR2FtZU1hbmFnZXIuY2hhcmFjdGVyUGFyYW1zW0BpbnRlcnByZXRlci5zdHJpbmdWYWx1ZU9mKEBwYXJhbXMuY2hhcmFjdGVySWQpXVxuICAgICAgICBpZiBub3QgcGFyYW1zPyBvciBub3QgQHBhcmFtcy5wYXJhbT8gdGhlbiByZXR1cm5cbiAgICAgICAgXG4gICAgICAgIHZhbHVlID0gcGFyYW1zW0BwYXJhbXMucGFyYW0ubmFtZV1cbiAgICAgICAgXG4gICAgICAgIHN3aXRjaCBAcGFyYW1zLnZhbHVlVHlwZVxuICAgICAgICAgICAgd2hlbiAwICMgTnVtYmVyIFZhbHVlXG4gICAgICAgICAgICAgICAgc3dpdGNoIEBwYXJhbXMucGFyYW0udHlwZVxuICAgICAgICAgICAgICAgICAgICB3aGVuIDAgIyBOdW1iZXJcbiAgICAgICAgICAgICAgICAgICAgICAgIEBpbnRlcnByZXRlci5zZXROdW1iZXJWYWx1ZVRvKEBwYXJhbXMudGFyZ2V0VmFyaWFibGUsIHZhbHVlKVxuICAgICAgICAgICAgICAgICAgICB3aGVuIDEgIyBTd2l0Y2hcbiAgICAgICAgICAgICAgICAgICAgICAgIEBpbnRlcnByZXRlci5zZXROdW1iZXJWYWx1ZVRvKEBwYXJhbXMudGFyZ2V0VmFyaWFibGUsIGlmIHZhbHVlIHRoZW4gMSBlbHNlIDApXG4gICAgICAgICAgICAgICAgICAgIHdoZW4gMiAjIFRleHRcbiAgICAgICAgICAgICAgICAgICAgICAgIEBpbnRlcnByZXRlci5zZXROdW1iZXJWYWx1ZVRvKEBwYXJhbXMudGFyZ2V0VmFyaWFibGUsIGlmIHZhbHVlPyB0aGVuIHZhbHVlLmxlbmd0aCBlbHNlIDApXG4gICAgICAgICAgICB3aGVuIDEgIyBTd2l0Y2ggVmFsdWVcbiAgICAgICAgICAgICAgICBzd2l0Y2ggQHBhcmFtcy5wYXJhbS50eXBlXG4gICAgICAgICAgICAgICAgICAgIHdoZW4gMCAjIE51bWJlclxuICAgICAgICAgICAgICAgICAgICAgICAgQGludGVycHJldGVyLnNldEJvb2xlYW5WYWx1ZVRvKEBwYXJhbXMudGFyZ2V0VmFyaWFibGUsIHZhbHVlID4gMClcbiAgICAgICAgICAgICAgICAgICAgd2hlbiAxICMgU3dpdGNoXG4gICAgICAgICAgICAgICAgICAgICAgICBAaW50ZXJwcmV0ZXIuc2V0Qm9vbGVhblZhbHVlVG8oQHBhcmFtcy50YXJnZXRWYXJpYWJsZSwgdmFsdWUpXG4gICAgICAgICAgICAgICAgICAgIHdoZW4gMiAjIFRleHRcbiAgICAgICAgICAgICAgICAgICAgICAgIEBpbnRlcnByZXRlci5zZXRCb29sZWFuVmFsdWVUbyhAcGFyYW1zLnRhcmdldFZhcmlhYmxlLCB2YWx1ZSA9PSBcIk9OXCIpXG4gICAgICAgICAgICAgICAgICAgIFxuICAgICAgICAgICAgd2hlbiAyICMgVGV4dCBWYWx1ZVxuICAgICAgICAgICAgICAgIHN3aXRjaCBAcGFyYW1zLnBhcmFtLnR5cGVcbiAgICAgICAgICAgICAgICAgICAgd2hlbiAwICMgTnVtYmVyXG4gICAgICAgICAgICAgICAgICAgICAgICBAaW50ZXJwcmV0ZXIuc2V0U3RyaW5nVmFsdWVUbyhAcGFyYW1zLnRhcmdldFZhcmlhYmxlLCBpZiB2YWx1ZT8gdGhlbiB2YWx1ZS50b1N0cmluZygpIGVsc2UgXCJcIilcbiAgICAgICAgICAgICAgICAgICAgd2hlbiAxICMgU3dpdGNoXG4gICAgICAgICAgICAgICAgICAgICAgICBAaW50ZXJwcmV0ZXIuc2V0U3RyaW5nVmFsdWVUbyhAcGFyYW1zLnRhcmdldFZhcmlhYmxlLCBpZiB2YWx1ZSB0aGVuIFwiT05cIiBlbHNlIFwiT0ZGXCIpXG4gICAgICAgICAgICAgICAgICAgIHdoZW4gMiAjIFRleHRcbiAgICAgICAgICAgICAgICAgICAgICAgIEBpbnRlcnByZXRlci5zZXRTdHJpbmdWYWx1ZVRvKEBwYXJhbXMudGFyZ2V0VmFyaWFibGUsIHZhbHVlKVxuICAgICAgICAgICAgICAgICAgICBcbiAgICAgICAgICAgIFxuICAgIFxuICAgICMjIypcbiAgICAqIEBtZXRob2QgY29tbWFuZENoYXJhY3Rlck1vdGlvbkJsdXJcbiAgICAqIEBwcm90ZWN0ZWRcbiAgICAjIyMgICAgICBcbiAgICBjb21tYW5kQ2hhcmFjdGVyTW90aW9uQmx1cjogLT5cbiAgICAgICAgc2NlbmUgPSBTY2VuZU1hbmFnZXIuc2NlbmVcbiAgICAgICAgY2hhcmFjdGVyID0gc2NlbmUuY2hhcmFjdGVycy5maXJzdCAodikgPT4gIXYuZGlzcG9zZWQgYW5kIHYucmlkID09IEBwYXJhbXMuY2hhcmFjdGVySWRcbiAgICAgICAgaWYgbm90IGNoYXJhY3Rlcj8gdGhlbiByZXR1cm5cblxuICAgICAgICBjaGFyYWN0ZXIubW90aW9uQmx1ci5zZXQoQHBhcmFtcy5tb3Rpb25CbHVyKVxuICAgICBcbiAgICAjIyMqXG4gICAgKiBAbWV0aG9kIGNvbW1hbmRDaGFyYWN0ZXJEZWZhdWx0c1xuICAgICogQHByb3RlY3RlZFxuICAgICMjIyAgICBcbiAgICBjb21tYW5kQ2hhcmFjdGVyRGVmYXVsdHM6IC0+XG4gICAgICAgIGRlZmF1bHRzID0gR2FtZU1hbmFnZXIuZGVmYXVsdHMuY2hhcmFjdGVyXG4gICAgICAgIGZsYWdzID0gQHBhcmFtcy5maWVsZEZsYWdzIHx8IHt9XG4gICAgICAgIGlzTG9ja2VkID0gZ3MuQ29tbWFuZEZpZWxkRmxhZ3MuaXNMb2NrZWRcbiAgICAgICAgXG4gICAgICAgIGlmICFpc0xvY2tlZChmbGFncy5hcHBlYXJEdXJhdGlvbikgdGhlbiBkZWZhdWx0cy5hcHBlYXJEdXJhdGlvbiA9IEBpbnRlcnByZXRlci5kdXJhdGlvblZhbHVlT2YoQHBhcmFtcy5hcHBlYXJEdXJhdGlvbilcbiAgICAgICAgaWYgIWlzTG9ja2VkKGZsYWdzLmRpc2FwcGVhckR1cmF0aW9uKSB0aGVuIGRlZmF1bHRzLmRpc2FwcGVhckR1cmF0aW9uID0gQGludGVycHJldGVyLmR1cmF0aW9uVmFsdWVPZihAcGFyYW1zLmRpc2FwcGVhckR1cmF0aW9uKVxuICAgICAgICBpZiAhaXNMb2NrZWQoZmxhZ3MuZXhwcmVzc2lvbkR1cmF0aW9uKSB0aGVuIGRlZmF1bHRzLmV4cHJlc3Npb25EdXJhdGlvbiA9IEBpbnRlcnByZXRlci5kdXJhdGlvblZhbHVlT2YoQHBhcmFtcy5leHByZXNzaW9uRHVyYXRpb24pXG4gICAgICAgIGlmICFpc0xvY2tlZChmbGFncy56T3JkZXIpIHRoZW4gZGVmYXVsdHMuek9yZGVyID0gQGludGVycHJldGVyLm51bWJlclZhbHVlT2YoQHBhcmFtcy56T3JkZXIpXG4gICAgICAgIGlmICFpc0xvY2tlZChmbGFnc1tcImFwcGVhckVhc2luZy50eXBlXCJdKSB0aGVuIGRlZmF1bHRzLmFwcGVhckVhc2luZyA9IEBwYXJhbXMuYXBwZWFyRWFzaW5nXG4gICAgICAgIGlmICFpc0xvY2tlZChmbGFnc1tcImFwcGVhckFuaW1hdGlvbi50eXBlXCJdKSB0aGVuIGRlZmF1bHRzLmFwcGVhckFuaW1hdGlvbiA9IEBwYXJhbXMuYXBwZWFyQW5pbWF0aW9uXG4gICAgICAgIGlmICFpc0xvY2tlZChmbGFnc1tcImRpc2FwcGVhckVhc2luZy50eXBlXCJdKSB0aGVuIGRlZmF1bHRzLmRpc2FwcGVhckVhc2luZyA9IEBwYXJhbXMuZGlzYXBwZWFyRWFzaW5nXG4gICAgICAgIGlmICFpc0xvY2tlZChmbGFnc1tcImRpc2FwcGVhckFuaW1hdGlvbi50eXBlXCJdKSB0aGVuIGRlZmF1bHRzLmRpc2FwcGVhckFuaW1hdGlvbiA9IEBwYXJhbXMuZGlzYXBwZWFyQW5pbWF0aW9uXG4gICAgICAgIGlmICFpc0xvY2tlZChmbGFnc1tcIm1vdGlvbkJsdXIuZW5hYmxlZFwiXSkgdGhlbiBkZWZhdWx0cy5tb3Rpb25CbHVyID0gQHBhcmFtcy5tb3Rpb25CbHVyXG4gICAgICAgIGlmICFpc0xvY2tlZChmbGFncy5vcmlnaW4pIHRoZW4gZGVmYXVsdHMub3JpZ2luID0gQHBhcmFtcy5vcmlnaW5cbiAgICBcbiAgICAjIyMqXG4gICAgKiBAbWV0aG9kIGNvbW1hbmRDaGFyYWN0ZXJFZmZlY3RcbiAgICAqIEBwcm90ZWN0ZWRcbiAgICAjIyMgICBcbiAgICBjb21tYW5kQ2hhcmFjdGVyRWZmZWN0OiAtPlxuICAgICAgICBzY2VuZSA9IFNjZW5lTWFuYWdlci5zY2VuZVxuICAgICAgICBjaGFyYWN0ZXJJZCA9IEBpbnRlcnByZXRlci5zdHJpbmdWYWx1ZU9mKEBwYXJhbXMuY2hhcmFjdGVySWQpXG4gICAgICAgIGNoYXJhY3RlciA9IHNjZW5lLmNoYXJhY3RlcnMuZmlyc3QgKGMpIC0+ICFjLmRpc3Bvc2VkIGFuZCBjLnJpZCA9PSBjaGFyYWN0ZXJJZFxuICAgICAgICBpZiBub3QgY2hhcmFjdGVyPyB0aGVuIHJldHVyblxuICAgICAgICBcbiAgICAgICAgQGludGVycHJldGVyLm9iamVjdEVmZmVjdChjaGFyYWN0ZXIsIEBwYXJhbXMpXG4gICAgICAgIFxuICAgICAgICBncy5HYW1lTm90aWZpZXIucG9zdE1pbm9yQ2hhbmdlKClcbiAgICAgICAgXG4gICAgIyMjKlxuICAgICogQG1ldGhvZCBjb21tYW5kRmxhc2hDaGFyYWN0ZXJcbiAgICAqIEBwcm90ZWN0ZWRcbiAgICAjIyMgICAgICBcbiAgICBjb21tYW5kRmxhc2hDaGFyYWN0ZXI6IC0+XG4gICAgICAgIHNjZW5lID0gU2NlbmVNYW5hZ2VyLnNjZW5lXG4gICAgICAgIGNoYXJhY3RlciA9IHNjZW5lLmNoYXJhY3RlcnMuZmlyc3QgKHYpID0+ICF2LmRpc3Bvc2VkIGFuZCB2LnJpZCA9PSBAcGFyYW1zLmNoYXJhY3RlcklkIFxuICAgICAgICByZXR1cm4gaWYgbm90IGNoYXJhY3RlclxuICAgICAgICBcbiAgICAgICAgZHVyYXRpb24gPSBAaW50ZXJwcmV0ZXIuZHVyYXRpb25WYWx1ZU9mKEBwYXJhbXMuZHVyYXRpb24pXG4gICAgICAgIGNoYXJhY3Rlci5hbmltYXRvci5mbGFzaChuZXcgQ29sb3IoQHBhcmFtcy5jb2xvciksIGR1cmF0aW9uKVxuICAgICAgICBpZiBAcGFyYW1zLndhaXRGb3JDb21wbGV0aW9uIGFuZCBub3QgKGR1cmF0aW9uID09IDAgb3IgQGludGVycHJldGVyLmlzSW5zdGFudFNraXAoKSlcbiAgICAgICAgICAgIEBpbnRlcnByZXRlci5pc1dhaXRpbmcgPSB5ZXNcbiAgICAgICAgICAgIEBpbnRlcnByZXRlci53YWl0Q291bnRlciA9IGR1cmF0aW9uXG4gICAgICAgICAgICBcbiAgICAgICAgZ3MuR2FtZU5vdGlmaWVyLnBvc3RNaW5vckNoYW5nZSgpXG4gICAgXG4gICAgIyMjKlxuICAgICogQG1ldGhvZCBjb21tYW5kVGludENoYXJhY3RlclxuICAgICogQHByb3RlY3RlZFxuICAgICMjIyAgXG4gICAgY29tbWFuZFRpbnRDaGFyYWN0ZXI6IC0+XG4gICAgICAgIHNjZW5lID0gU2NlbmVNYW5hZ2VyLnNjZW5lXG4gICAgICAgIGNoYXJhY3RlciA9IHNjZW5lLmNoYXJhY3RlcnMuZmlyc3QgKHYpID0+ICF2LmRpc3Bvc2VkIGFuZCB2LnJpZCA9PSBAcGFyYW1zLmNoYXJhY3RlcklkIFxuICAgICAgICBlYXNpbmcgPSBncy5FYXNpbmdzLmZyb21WYWx1ZXMoQGludGVycHJldGVyLm51bWJlclZhbHVlT2YoQHBhcmFtcy5lYXNpbmcudHlwZSksIEBwYXJhbXMuZWFzaW5nLmluT3V0KVxuICAgICAgICByZXR1cm4gaWYgbm90IGNoYXJhY3RlclxuICAgICAgICBcbiAgICAgICAgZHVyYXRpb24gPSBAaW50ZXJwcmV0ZXIuZHVyYXRpb25WYWx1ZU9mKEBwYXJhbXMuZHVyYXRpb24pXG4gICAgICAgIGNoYXJhY3Rlci5hbmltYXRvci50aW50VG8oQHBhcmFtcy50b25lLCBkdXJhdGlvbiwgZWFzaW5nKVxuICAgICAgICBpZiBAcGFyYW1zLndhaXRGb3JDb21wbGV0aW9uIGFuZCBub3QgKGR1cmF0aW9uID09IDAgb3IgQGludGVycHJldGVyLmlzSW5zdGFudFNraXAoKSlcbiAgICAgICAgICAgIEBpbnRlcnByZXRlci5pc1dhaXRpbmcgPSB5ZXNcbiAgICAgICAgICAgIEBpbnRlcnByZXRlci53YWl0Q291bnRlciA9IGR1cmF0aW9uXG4gICAgICAgICAgICBcbiAgICAgICAgZ3MuR2FtZU5vdGlmaWVyLnBvc3RNaW5vckNoYW5nZSgpXG4gICAgICAgIFxuICAgICMjIypcbiAgICAqIEBtZXRob2QgY29tbWFuZFpvb21DaGFyYWN0ZXJcbiAgICAqIEBwcm90ZWN0ZWRcbiAgICAjIyMgICAgXG4gICAgY29tbWFuZFpvb21DaGFyYWN0ZXI6IC0+XG4gICAgICAgIHNjZW5lID0gU2NlbmVNYW5hZ2VyLnNjZW5lXG4gICAgICAgIGNoYXJhY3RlciA9IHNjZW5lLmNoYXJhY3RlcnMuZmlyc3QgKHYpID0+ICF2LmRpc3Bvc2VkIGFuZCB2LnJpZCA9PSBAcGFyYW1zLmNoYXJhY3RlcklkICAgICAgXG4gICAgICAgIGlmIG5vdCBjaGFyYWN0ZXI/IHRoZW4gcmV0dXJuXG4gICAgICAgIFxuICAgICAgICBAaW50ZXJwcmV0ZXIuem9vbU9iamVjdChjaGFyYWN0ZXIsIEBwYXJhbXMpXG4gICAgICAgIFxuICAgICAgICBncy5HYW1lTm90aWZpZXIucG9zdE1pbm9yQ2hhbmdlKClcblxuICAgICMjIypcbiAgICAqIEBtZXRob2QgY29tbWFuZFJvdGF0ZUNoYXJhY3RlclxuICAgICogQHByb3RlY3RlZFxuICAgICMjIyAgICBcbiAgICBjb21tYW5kUm90YXRlQ2hhcmFjdGVyOiAtPlxuICAgICAgICBzY2VuZSA9IFNjZW5lTWFuYWdlci5zY2VuZVxuICAgICAgICBjaGFyYWN0ZXIgPSBzY2VuZS5jaGFyYWN0ZXJzLmZpcnN0ICh2KSA9PiAhdi5kaXNwb3NlZCBhbmQgdi5yaWQgPT0gQHBhcmFtcy5jaGFyYWN0ZXJJZCAgICAgIFxuICAgICAgICBpZiBub3QgY2hhcmFjdGVyPyB0aGVuIHJldHVyblxuICAgICAgICBcbiAgICAgICAgQGludGVycHJldGVyLnJvdGF0ZU9iamVjdChjaGFyYWN0ZXIsIEBwYXJhbXMpXG4gICAgICAgIFxuICAgICAgICBncy5HYW1lTm90aWZpZXIucG9zdE1pbm9yQ2hhbmdlKClcbiAgICAgICAgXG4gICAgIyMjKlxuICAgICogQG1ldGhvZCBjb21tYW5kQmxlbmRDaGFyYWN0ZXJcbiAgICAqIEBwcm90ZWN0ZWRcbiAgICAjIyNcbiAgICBjb21tYW5kQmxlbmRDaGFyYWN0ZXI6IC0+XG4gICAgICAgIGNoYXJhY3RlciA9IFNjZW5lTWFuYWdlci5zY2VuZS5jaGFyYWN0ZXJzLmZpcnN0ICh2KSA9PiAhdi5kaXNwb3NlZCBhbmQgdi5yaWQgPT0gQHBhcmFtcy5jaGFyYWN0ZXJJZCAgICAgIFxuICAgICAgICBpZiBub3QgY2hhcmFjdGVyPyB0aGVuIHJldHVyblxuICAgICAgICBcbiAgICAgICAgQGludGVycHJldGVyLmJsZW5kT2JqZWN0KGNoYXJhY3RlciwgQHBhcmFtcykgXG4gICAgICAgIFxuICAgICAgICBncy5HYW1lTm90aWZpZXIucG9zdE1pbm9yQ2hhbmdlKClcbiAgICAgICAgXG4gICAgIyMjKlxuICAgICogQG1ldGhvZCBjb21tYW5kU2hha2VDaGFyYWN0ZXJcbiAgICAqIEBwcm90ZWN0ZWRcbiAgICAjIyNcbiAgICBjb21tYW5kU2hha2VDaGFyYWN0ZXI6IC0+IFxuICAgICAgICBjaGFyYWN0ZXIgPSBTY2VuZU1hbmFnZXIuc2NlbmUuY2hhcmFjdGVycy5maXJzdCAodikgPT4gIXYuZGlzcG9zZWQgYW5kICB2LnJpZCA9PSBAcGFyYW1zLmNoYXJhY3RlcklkICAgICAgXG4gICAgICAgIGlmIG5vdCBjaGFyYWN0ZXI/IHRoZW4gcmV0dXJuXG4gICAgICAgIEBpbnRlcnByZXRlci5zaGFrZU9iamVjdChjaGFyYWN0ZXIsIEBwYXJhbXMpICBcbiAgICAgICAgXG4gICAgICAgIGdzLkdhbWVOb3RpZmllci5wb3N0TWlub3JDaGFuZ2UoKVxuICAgIFxuICAgICMjIypcbiAgICAqIEBtZXRob2QgY29tbWFuZE1hc2tDaGFyYWN0ZXJcbiAgICAqIEBwcm90ZWN0ZWRcbiAgICAjIyNcbiAgICBjb21tYW5kTWFza0NoYXJhY3RlcjogLT5cbiAgICAgICAgc2NlbmUgPSBTY2VuZU1hbmFnZXIuc2NlbmVcbiAgICAgICAgY2hhcmFjdGVyID0gc2NlbmUuY2hhcmFjdGVycy5maXJzdCAodikgPT4gIXYuZGlzcG9zZWQgYW5kIHYucmlkID09IEBwYXJhbXMuY2hhcmFjdGVySWQgICAgICBcbiAgICAgICAgaWYgbm90IGNoYXJhY3Rlcj8gdGhlbiByZXR1cm5cbiAgICAgICAgXG4gICAgICAgIEBpbnRlcnByZXRlci5tYXNrT2JqZWN0KGNoYXJhY3RlciwgQHBhcmFtcylcbiAgICAgICAgXG4gICAgICAgIGdzLkdhbWVOb3RpZmllci5wb3N0TWlub3JDaGFuZ2UoKVxuICAgIFxuICAgICMjIypcbiAgICAqIEBtZXRob2QgY29tbWFuZE1vdmVDaGFyYWN0ZXJcbiAgICAqIEBwcm90ZWN0ZWRcbiAgICAjIyMgICAgXG4gICAgY29tbWFuZE1vdmVDaGFyYWN0ZXI6IC0+XG4gICAgICAgIHNjZW5lID0gU2NlbmVNYW5hZ2VyLnNjZW5lXG4gICAgICAgIGNoYXJhY3RlciA9IHNjZW5lLmNoYXJhY3RlcnMuZmlyc3QgKHYpID0+ICF2LmRpc3Bvc2VkIGFuZCB2LnJpZCA9PSBAcGFyYW1zLmNoYXJhY3RlcklkICAgICAgXG4gICAgICAgIGlmIG5vdCBjaGFyYWN0ZXI/IHRoZW4gcmV0dXJuXG4gICAgICAgIFxuICAgICAgICBAaW50ZXJwcmV0ZXIubW92ZU9iamVjdChjaGFyYWN0ZXIsIEBwYXJhbXMucG9zaXRpb24sIEBwYXJhbXMpXG4gICAgICAgIFxuICAgICAgICBncy5HYW1lTm90aWZpZXIucG9zdE1pbm9yQ2hhbmdlKClcbiAgICBcbiAgICAjIyMqXG4gICAgKiBAbWV0aG9kIGNvbW1hbmRNb3ZlQ2hhcmFjdGVyUGF0aFxuICAgICogQHByb3RlY3RlZFxuICAgICMjI1xuICAgIGNvbW1hbmRNb3ZlQ2hhcmFjdGVyUGF0aDogLT5cbiAgICAgICAgc2NlbmUgPSBTY2VuZU1hbmFnZXIuc2NlbmVcbiAgICAgICAgY2hhcmFjdGVyID0gc2NlbmUuY2hhcmFjdGVycy5maXJzdCAodikgPT4gIXYuZGlzcG9zZWQgYW5kIHYucmlkID09IEBwYXJhbXMuY2hhcmFjdGVySWQgICAgICBcbiAgICAgICAgaWYgbm90IGNoYXJhY3Rlcj8gdGhlbiByZXR1cm5cbiAgICAgICAgXG4gICAgICAgIEBpbnRlcnByZXRlci5tb3ZlT2JqZWN0UGF0aChjaGFyYWN0ZXIsIEBwYXJhbXMucGF0aCwgQHBhcmFtcylcbiAgICAgICAgXG4gICAgICAgIGdzLkdhbWVOb3RpZmllci5wb3N0TWlub3JDaGFuZ2UoKVxuICAgIFxuICAgICMjIypcbiAgICAqIEBtZXRob2QgY29tbWFuZFNoYWtlQmFja2dyb3VuZFxuICAgICogQHByb3RlY3RlZFxuICAgICMjIyAgICBcbiAgICBjb21tYW5kU2hha2VCYWNrZ3JvdW5kOiAtPiBcbiAgICAgICAgYmFja2dyb3VuZCA9IFNjZW5lTWFuYWdlci5zY2VuZS5iYWNrZ3JvdW5kc1tAaW50ZXJwcmV0ZXIubnVtYmVyVmFsdWVPZihAcGFyYW1zLmxheWVyKV1cbiAgICAgICAgaWYgbm90IGJhY2tncm91bmQ/IHRoZW4gcmV0dXJuXG4gICAgICAgIFxuICAgICAgICBAaW50ZXJwcmV0ZXIuc2hha2VPYmplY3QoYmFja2dyb3VuZCwgQHBhcmFtcylcbiAgICAgICAgXG4gICAgICAgIGdzLkdhbWVOb3RpZmllci5wb3N0TWlub3JDaGFuZ2UoKVxuXG4gICAgIyMjKlxuICAgICogQG1ldGhvZCBjb21tYW5kU2Nyb2xsQmFja2dyb3VuZFxuICAgICogQHByb3RlY3RlZFxuICAgICMjIyAgXG4gICAgY29tbWFuZFNjcm9sbEJhY2tncm91bmQ6IC0+XG4gICAgICAgIHNjZW5lID0gU2NlbmVNYW5hZ2VyLnNjZW5lXG4gICAgICAgIGR1cmF0aW9uID0gQGludGVycHJldGVyLmR1cmF0aW9uVmFsdWVPZihAcGFyYW1zLmR1cmF0aW9uKVxuICAgICAgICBob3Jpem9udGFsU3BlZWQgPSBAaW50ZXJwcmV0ZXIubnVtYmVyVmFsdWVPZihAcGFyYW1zLmhvcml6b250YWxTcGVlZClcbiAgICAgICAgdmVydGljYWxTcGVlZCA9IEBpbnRlcnByZXRlci5udW1iZXJWYWx1ZU9mKEBwYXJhbXMudmVydGljYWxTcGVlZClcbiAgICAgICAgZWFzaW5nID0gZ3MuRWFzaW5ncy5mcm9tVmFsdWVzKEBpbnRlcnByZXRlci5udW1iZXJWYWx1ZU9mKEBwYXJhbXMuZWFzaW5nLnR5cGUpLCBAcGFyYW1zLmVhc2luZy5pbk91dClcbiAgICAgICAgbGF5ZXIgPSBAaW50ZXJwcmV0ZXIubnVtYmVyVmFsdWVPZihAcGFyYW1zLmxheWVyKVxuICAgICAgICBpZiBAcGFyYW1zLndhaXRGb3JDb21wbGV0aW9uIGFuZCBub3QgKGR1cmF0aW9uID09IDAgb3IgQGludGVycHJldGVyLmlzSW5zdGFudFNraXAoKSlcbiAgICAgICAgICAgIEBpbnRlcnByZXRlci5pc1dhaXRpbmcgPSB5ZXNcbiAgICAgICAgICAgIEBpbnRlcnByZXRlci53YWl0Q291bnRlciA9IGR1cmF0aW9uXG4gICAgIFxuICAgICAgICBzY2VuZS5iYWNrZ3JvdW5kc1tsYXllcl0/LmFuaW1hdG9yLm1vdmUoaG9yaXpvbnRhbFNwZWVkLCB2ZXJ0aWNhbFNwZWVkLCBkdXJhdGlvbiwgZWFzaW5nKVxuICAgICAgICBcbiAgICAgICAgZ3MuR2FtZU5vdGlmaWVyLnBvc3RNaW5vckNoYW5nZSgpXG4gICAgXG4gICAgIyMjKlxuICAgICogQG1ldGhvZCBjb21tYW5kU2Nyb2xsQmFja2dyb3VuZFRvXG4gICAgKiBAcHJvdGVjdGVkXG4gICAgIyMjICBcbiAgICBjb21tYW5kU2Nyb2xsQmFja2dyb3VuZFRvOiAtPlxuICAgICAgICBzY2VuZSA9IFNjZW5lTWFuYWdlci5zY2VuZVxuICAgICAgICBkdXJhdGlvbiA9IEBpbnRlcnByZXRlci5kdXJhdGlvblZhbHVlT2YoQHBhcmFtcy5kdXJhdGlvbilcbiAgICAgICAgeCA9IEBpbnRlcnByZXRlci5udW1iZXJWYWx1ZU9mKEBwYXJhbXMuYmFja2dyb3VuZC5sb2NhdGlvbi54KVxuICAgICAgICB5ID0gQGludGVycHJldGVyLm51bWJlclZhbHVlT2YoQHBhcmFtcy5iYWNrZ3JvdW5kLmxvY2F0aW9uLnkpXG4gICAgICAgIGVhc2luZyA9IGdzLkVhc2luZ3MuZnJvbVZhbHVlcyhAaW50ZXJwcmV0ZXIubnVtYmVyVmFsdWVPZihAcGFyYW1zLmVhc2luZy50eXBlKSwgQHBhcmFtcy5lYXNpbmcuaW5PdXQpXG4gICAgICAgIGxheWVyID0gQGludGVycHJldGVyLm51bWJlclZhbHVlT2YoQHBhcmFtcy5sYXllcilcbiAgICAgICAgYmFja2dyb3VuZCA9IHNjZW5lLmJhY2tncm91bmRzW2xheWVyXVxuICAgICAgICBpZiAhYmFja2dyb3VuZCB0aGVuIHJldHVyblxuICAgICAgICBcbiAgICAgICAgaWYgQHBhcmFtcy53YWl0Rm9yQ29tcGxldGlvbiBhbmQgbm90IChkdXJhdGlvbiA9PSAwIG9yIEBpbnRlcnByZXRlci5pc0luc3RhbnRTa2lwKCkpXG4gICAgICAgICAgICBAaW50ZXJwcmV0ZXIuaXNXYWl0aW5nID0geWVzXG4gICAgICAgICAgICBAaW50ZXJwcmV0ZXIud2FpdENvdW50ZXIgPSBkdXJhdGlvblxuICAgICAgICAgICAgXG4gICAgICAgIGlmIEBwYXJhbXMucG9zaXRpb25UeXBlID09IDBcbiAgICAgICAgICAgIHAgPSBAaW50ZXJwcmV0ZXIucHJlZGVmaW5lZE9iamVjdFBvc2l0aW9uKEBwYXJhbXMucHJlZGVmaW5lZFBvc2l0aW9uSWQsIGJhY2tncm91bmQsIEBwYXJhbXMpXG4gICAgICAgICAgICB4ID0gcC54XG4gICAgICAgICAgICB5ID0gcC55XG4gICAgIFxuICAgICAgICBiYWNrZ3JvdW5kLmFuaW1hdG9yLm1vdmVUbyh4LCB5LCBkdXJhdGlvbiwgZWFzaW5nKVxuICAgICAgICBcbiAgICAgICAgZ3MuR2FtZU5vdGlmaWVyLnBvc3RNaW5vckNoYW5nZSgpXG4gICAgXG4gICAgIyMjKlxuICAgICogQG1ldGhvZCBjb21tYW5kU2Nyb2xsQmFja2dyb3VuZFBhdGhcbiAgICAqIEBwcm90ZWN0ZWRcbiAgICAjIyNcbiAgICBjb21tYW5kU2Nyb2xsQmFja2dyb3VuZFBhdGg6IC0+XG4gICAgICAgIHNjZW5lID0gU2NlbmVNYW5hZ2VyLnNjZW5lXG4gICAgICAgIGJhY2tncm91bmQgPSBzY2VuZS5iYWNrZ3JvdW5kc1tAaW50ZXJwcmV0ZXIubnVtYmVyVmFsdWVPZihAcGFyYW1zLmxheWVyKV1cbiAgICAgICAgcmV0dXJuIHVubGVzcyBiYWNrZ3JvdW5kP1xuICAgICAgICBcbiAgICAgICAgQGludGVycHJldGVyLm1vdmVPYmplY3RQYXRoKGJhY2tncm91bmQsIEBwYXJhbXMucGF0aCwgQHBhcmFtcylcbiAgICAgICAgXG4gICAgICAgIGdzLkdhbWVOb3RpZmllci5wb3N0TWlub3JDaGFuZ2UoKVxuICAgIFxuICAgICMjIypcbiAgICAqIEBtZXRob2QgY29tbWFuZE1hc2tCYWNrZ3JvdW5kXG4gICAgKiBAcHJvdGVjdGVkXG4gICAgIyMjXG4gICAgY29tbWFuZE1hc2tCYWNrZ3JvdW5kOiAtPlxuICAgICAgICBzY2VuZSA9IFNjZW5lTWFuYWdlci5zY2VuZVxuICAgICAgICBiYWNrZ3JvdW5kID0gc2NlbmUuYmFja2dyb3VuZHNbQGludGVycHJldGVyLm51bWJlclZhbHVlT2YoQHBhcmFtcy5sYXllcildXG4gICAgICAgIHJldHVybiB1bmxlc3MgYmFja2dyb3VuZD9cbiAgICAgICAgXG4gICAgICAgIEBpbnRlcnByZXRlci5tYXNrT2JqZWN0KGJhY2tncm91bmQsIEBwYXJhbXMpXG4gICAgICAgIFxuICAgICAgICBncy5HYW1lTm90aWZpZXIucG9zdE1pbm9yQ2hhbmdlKClcbiAgICAgXG4gICAgIyMjKlxuICAgICogQG1ldGhvZCBjb21tYW5kWm9vbUJhY2tncm91bmRcbiAgICAqIEBwcm90ZWN0ZWRcbiAgICAjIyMgICAgXG4gICAgY29tbWFuZFpvb21CYWNrZ3JvdW5kOiAtPlxuICAgICAgICBzY2VuZSA9IFNjZW5lTWFuYWdlci5zY2VuZVxuICAgICAgICBkdXJhdGlvbiA9IEBpbnRlcnByZXRlci5kdXJhdGlvblZhbHVlT2YoQHBhcmFtcy5kdXJhdGlvbilcbiAgICAgICAgeCA9IEBpbnRlcnByZXRlci5udW1iZXJWYWx1ZU9mKEBwYXJhbXMuem9vbWluZy54KVxuICAgICAgICB5ID0gQGludGVycHJldGVyLm51bWJlclZhbHVlT2YoQHBhcmFtcy56b29taW5nLnkpXG4gICAgICAgIGVhc2luZyA9IGdzLkVhc2luZ3MuZnJvbVZhbHVlcyhAaW50ZXJwcmV0ZXIubnVtYmVyVmFsdWVPZihAcGFyYW1zLmVhc2luZy50eXBlKSwgQHBhcmFtcy5lYXNpbmcuaW5PdXQpXG4gICAgICAgIGxheWVyID0gQGludGVycHJldGVyLm51bWJlclZhbHVlT2YoQHBhcmFtcy5sYXllcilcbiAgICAgICAgaWYgQHBhcmFtcy53YWl0Rm9yQ29tcGxldGlvbiBhbmQgbm90IChkdXJhdGlvbiA9PSAwIG9yIEBpbnRlcnByZXRlci5pc0luc3RhbnRTa2lwKCkpXG4gICAgICAgICAgICBAaW50ZXJwcmV0ZXIuaXNXYWl0aW5nID0geWVzXG4gICAgICAgICAgICBAaW50ZXJwcmV0ZXIud2FpdENvdW50ZXIgPSBkdXJhdGlvblxuICAgICAgICAgICAgXG4gICAgICAgIHNjZW5lLmJhY2tncm91bmRzW2xheWVyXT8uYW5pbWF0b3Iuem9vbVRvKHggLyAxMDAsIHkgLyAxMDAsIGR1cmF0aW9uLCBlYXNpbmcpXG4gICAgICAgIFxuICAgICAgICBncy5HYW1lTm90aWZpZXIucG9zdE1pbm9yQ2hhbmdlKClcbiAgICBcbiAgICAjIyMqXG4gICAgKiBAbWV0aG9kIGNvbW1hbmRSb3RhdGVCYWNrZ3JvdW5kXG4gICAgKiBAcHJvdGVjdGVkXG4gICAgIyMjIFxuICAgIGNvbW1hbmRSb3RhdGVCYWNrZ3JvdW5kOiAtPlxuICAgICAgICBzY2VuZSA9IFNjZW5lTWFuYWdlci5zY2VuZVxuICAgICAgICBiYWNrZ3JvdW5kID0gc2NlbmUuYmFja2dyb3VuZHNbQGludGVycHJldGVyLm51bWJlclZhbHVlT2YoQHBhcmFtcy5sYXllcildXG4gICAgICAgIFxuICAgICAgICBpZiBiYWNrZ3JvdW5kXG4gICAgICAgICAgICBAaW50ZXJwcmV0ZXIucm90YXRlT2JqZWN0KGJhY2tncm91bmQsIEBwYXJhbXMpXG4gICAgICAgICAgICBcbiAgICAgICAgZ3MuR2FtZU5vdGlmaWVyLnBvc3RNaW5vckNoYW5nZSgpXG4gICAgICAgICAgICBcbiAgICAjIyMqICAgICAgICBcbiAgICAqIEBtZXRob2QgY29tbWFuZFRpbnRCYWNrZ3JvdW5kXG4gICAgKiBAcHJvdGVjdGVkXG4gICAgIyMjXG4gICAgY29tbWFuZFRpbnRCYWNrZ3JvdW5kOiAtPlxuICAgICAgICBzY2VuZSA9IFNjZW5lTWFuYWdlci5zY2VuZVxuICAgICAgICBsYXllciA9IEBpbnRlcnByZXRlci5udW1iZXJWYWx1ZU9mKEBwYXJhbXMubGF5ZXIpXG4gICAgICAgIGJhY2tncm91bmQgPSBzY2VuZS5iYWNrZ3JvdW5kc1tsYXllcl1cbiAgICAgICAgaWYgbm90IGJhY2tncm91bmQ/IHRoZW4gcmV0dXJuXG4gICAgICAgIFxuICAgICAgICBkdXJhdGlvbiA9IEBpbnRlcnByZXRlci5kdXJhdGlvblZhbHVlT2YoQHBhcmFtcy5kdXJhdGlvbilcbiAgICAgICAgZWFzaW5nID0gZ3MuRWFzaW5ncy5mcm9tT2JqZWN0KEBwYXJhbXMuZWFzaW5nKVxuICAgICAgICBiYWNrZ3JvdW5kLmFuaW1hdG9yLnRpbnRUbyhAcGFyYW1zLnRvbmUsIGR1cmF0aW9uLCBlYXNpbmcpXG4gICAgICAgIFxuICAgICAgICBAaW50ZXJwcmV0ZXIud2FpdEZvckNvbXBsZXRpb24oYmFja2dyb3VuZCwgQHBhcmFtcylcbiAgICAgICAgXG4gICAgICAgIGdzLkdhbWVOb3RpZmllci5wb3N0TWlub3JDaGFuZ2UoKVxuICAgIFxuICAgICMjIypcbiAgICAqIEBtZXRob2QgY29tbWFuZEJsZW5kQmFja2dyb3VuZFxuICAgICogQHByb3RlY3RlZFxuICAgICMjI1xuICAgIGNvbW1hbmRCbGVuZEJhY2tncm91bmQ6IC0+XG4gICAgICAgIGxheWVyID0gQGludGVycHJldGVyLm51bWJlclZhbHVlT2YoQHBhcmFtcy5sYXllcilcbiAgICAgICAgYmFja2dyb3VuZCA9IFNjZW5lTWFuYWdlci5zY2VuZS5iYWNrZ3JvdW5kc1tsYXllcl1cbiAgICAgICAgaWYgbm90IGJhY2tncm91bmQ/IHRoZW4gcmV0dXJuXG4gICAgICAgIFxuICAgICAgICBAaW50ZXJwcmV0ZXIuYmxlbmRPYmplY3QoYmFja2dyb3VuZCwgQHBhcmFtcykgXG4gICAgICAgIFxuICAgICAgICBncy5HYW1lTm90aWZpZXIucG9zdE1pbm9yQ2hhbmdlKClcbiAgICAgICAgXG4gICAgIyMjKlxuICAgICogQG1ldGhvZCBjb21tYW5kQmFja2dyb3VuZEVmZmVjdFxuICAgICogQHByb3RlY3RlZFxuICAgICMjIyAgXG4gICAgY29tbWFuZEJhY2tncm91bmRFZmZlY3Q6IC0+XG4gICAgICAgIGxheWVyID0gQGludGVycHJldGVyLm51bWJlclZhbHVlT2YoQHBhcmFtcy5sYXllcilcbiAgICAgICAgYmFja2dyb3VuZCA9IFNjZW5lTWFuYWdlci5zY2VuZS5iYWNrZ3JvdW5kc1tsYXllcl1cbiAgICAgICAgaWYgbm90IGJhY2tncm91bmQ/IHRoZW4gcmV0dXJuXG4gICAgICAgIFxuICAgICAgICBAaW50ZXJwcmV0ZXIub2JqZWN0RWZmZWN0KGJhY2tncm91bmQsIEBwYXJhbXMpXG4gICAgICAgIFxuICAgICAgICBncy5HYW1lTm90aWZpZXIucG9zdE1pbm9yQ2hhbmdlKClcbiAgICBcbiAgICAjIyMqXG4gICAgKiBAbWV0aG9kIGNvbW1hbmRCYWNrZ3JvdW5kRGVmYXVsdHNcbiAgICAqIEBwcm90ZWN0ZWRcbiAgICAjIyMgICBcbiAgICBjb21tYW5kQmFja2dyb3VuZERlZmF1bHRzOiAtPlxuICAgICAgICBkZWZhdWx0cyA9IEdhbWVNYW5hZ2VyLmRlZmF1bHRzLmJhY2tncm91bmRcbiAgICAgICAgZmxhZ3MgPSBAcGFyYW1zLmZpZWxkRmxhZ3MgfHwge31cbiAgICAgICAgaXNMb2NrZWQgPSBncy5Db21tYW5kRmllbGRGbGFncy5pc0xvY2tlZFxuICAgICAgICBcbiAgICAgICAgaWYgIWlzTG9ja2VkKGZsYWdzLmR1cmF0aW9uKSB0aGVuIGRlZmF1bHRzLmR1cmF0aW9uID0gQGludGVycHJldGVyLmR1cmF0aW9uVmFsdWVPZihAcGFyYW1zLmR1cmF0aW9uKVxuICAgICAgICBpZiAhaXNMb2NrZWQoZmxhZ3Muek9yZGVyKSB0aGVuIGRlZmF1bHRzLnpPcmRlciA9IEBpbnRlcnByZXRlci5udW1iZXJWYWx1ZU9mKEBwYXJhbXMuek9yZGVyKVxuICAgICAgICBpZiAhaXNMb2NrZWQoZmxhZ3NbXCJlYXNpbmcudHlwZVwiXSkgdGhlbiBkZWZhdWx0cy5lYXNpbmcgPSBAcGFyYW1zLmVhc2luZ1xuICAgICAgICBpZiAhaXNMb2NrZWQoZmxhZ3NbXCJhbmltYXRpb24udHlwZVwiXSkgdGhlbiBkZWZhdWx0cy5hbmltYXRpb24gPSBAcGFyYW1zLmFuaW1hdGlvblxuICAgICAgICBpZiAhaXNMb2NrZWQoZmxhZ3Mub3JpZ2luKSB0aGVuIGRlZmF1bHRzLm9yaWdpbiA9IEBwYXJhbXMub3JpZ2luXG4gICAgICAgIGlmICFpc0xvY2tlZChmbGFncy5sb29wSG9yaXpvbnRhbCkgdGhlbiBkZWZhdWx0cy5sb29wSG9yaXpvbnRhbCA9IEBwYXJhbXMubG9vcEhvcml6b250YWxcbiAgICAgICAgaWYgIWlzTG9ja2VkKGZsYWdzLmxvb3BWZXJ0aWNhbCkgdGhlbiBkZWZhdWx0cy5sb29wVmVydGljYWwgPSBAcGFyYW1zLmxvb3BWZXJ0aWNhbFxuICAgIFxuICAgICMjIypcbiAgICAqIEBtZXRob2QgY29tbWFuZEJhY2tncm91bmRNb3Rpb25CbHVyXG4gICAgKiBAcHJvdGVjdGVkXG4gICAgIyMjICAgICBcbiAgICBjb21tYW5kQmFja2dyb3VuZE1vdGlvbkJsdXI6IC0+XG4gICAgICAgIGxheWVyID0gQGludGVycHJldGVyLm51bWJlclZhbHVlT2YoQHBhcmFtcy5sYXllcilcbiAgICAgICAgYmFja2dyb3VuZCA9IFNjZW5lTWFuYWdlci5zY2VuZS5iYWNrZ3JvdW5kc1tsYXllcl1cbiAgICAgICAgaWYgbm90IGJhY2tncm91bmQ/IHRoZW4gcmV0dXJuXG4gICAgICAgIFxuICAgICAgICBiYWNrZ3JvdW5kLm1vdGlvbkJsdXIuc2V0KEBwYXJhbXMubW90aW9uQmx1cilcbiAgICAgXG4gICAgIyMjKlxuICAgICogQG1ldGhvZCBjb21tYW5kQ2hhbmdlQmFja2dyb3VuZFxuICAgICogQHByb3RlY3RlZFxuICAgICMjIyAgICAgXG4gICAgY29tbWFuZENoYW5nZUJhY2tncm91bmQ6IC0+XG4gICAgICAgIGRlZmF1bHRzID0gR2FtZU1hbmFnZXIuZGVmYXVsdHMuYmFja2dyb3VuZFxuICAgICAgICBzY2VuZSA9IFNjZW5lTWFuYWdlci5zY2VuZVxuICAgICAgICBmbGFncyA9IEBwYXJhbXMuZmllbGRGbGFncyB8fCB7fVxuICAgICAgICBpc0xvY2tlZCA9IGdzLkNvbW1hbmRGaWVsZEZsYWdzLmlzTG9ja2VkXG4gICAgICAgIGR1cmF0aW9uID0gaWYgIWlzTG9ja2VkKGZsYWdzLmR1cmF0aW9uKSB0aGVuIEBpbnRlcnByZXRlci5kdXJhdGlvblZhbHVlT2YoQHBhcmFtcy5kdXJhdGlvbikgZWxzZSBkZWZhdWx0cy5kdXJhdGlvblxuICAgICAgICBsb29wSCA9IGlmICFpc0xvY2tlZChmbGFncy5sb29wSG9yaXpvbnRhbCkgdGhlbiBAcGFyYW1zLmxvb3BIb3Jpem9udGFsIGVsc2UgZGVmYXVsdHMubG9vcEhvcml6b250YWxcbiAgICAgICAgbG9vcFYgPSBpZiAhaXNMb2NrZWQoZmxhZ3MubG9vcFZlcnRpY2FsKSB0aGVuIEBwYXJhbXMubG9vcFZlcnRpY2FsIGVsc2UgZGVmYXVsdHMubG9vcFZlcnRpY2FsXG4gICAgICAgIGFuaW1hdGlvbiA9IGlmICFpc0xvY2tlZChmbGFnc1tcImFuaW1hdGlvbi50eXBlXCJdKSB0aGVuIEBwYXJhbXMuYW5pbWF0aW9uIGVsc2UgZGVmYXVsdHMuYW5pbWF0aW9uXG4gICAgICAgIG9yaWdpbiA9IGlmICFpc0xvY2tlZChmbGFncy5vcmlnaW4pIHRoZW4gQHBhcmFtcy5vcmlnaW4gZWxzZSBkZWZhdWx0cy5vcmlnaW5cbiAgICAgICAgekluZGV4ID0gaWYgIWlzTG9ja2VkKGZsYWdzLnpPcmRlcikgdGhlbiBAaW50ZXJwcmV0ZXIubnVtYmVyVmFsdWVPZihAcGFyYW1zLnpPcmRlcikgZWxzZSBkZWZhdWx0cy56T3JkZXJcbiAgICAgICAgXG4gICAgICAgIGlmIEBwYXJhbXMud2FpdEZvckNvbXBsZXRpb24gYW5kIG5vdCAoZHVyYXRpb24gPT0gMCBvciBAaW50ZXJwcmV0ZXIuaXNJbnN0YW50U2tpcCgpKVxuICAgICAgICAgICAgQGludGVycHJldGVyLmlzV2FpdGluZyA9IHllc1xuICAgICAgICAgICAgQGludGVycHJldGVyLndhaXRDb3VudGVyID0gZHVyYXRpb25cbiAgICAgICBcbiAgICAgICAgZWFzaW5nID0gaWYgIWlzTG9ja2VkKGZsYWdzW1wiZWFzaW5nLnR5cGVcIl0pIHRoZW4gIGdzLkVhc2luZ3MuZnJvbU9iamVjdChAcGFyYW1zLmVhc2luZykgZWxzZSBncy5FYXNpbmdzLmZyb21PYmplY3QoZGVmYXVsdHMuZWFzaW5nKVxuICAgICAgICBsYXllciA9IEBpbnRlcnByZXRlci5udW1iZXJWYWx1ZU9mKEBwYXJhbXMubGF5ZXIpXG4gICAgICAgIHNjZW5lLmJlaGF2aW9yLmNoYW5nZUJhY2tncm91bmQoQHBhcmFtcy5ncmFwaGljLCBubywgYW5pbWF0aW9uLCBlYXNpbmcsIGR1cmF0aW9uLCAwLCAwLCBsYXllciwgbG9vcEgsIGxvb3BWKVxuICAgICAgICBcbiAgICAgICAgaWYgc2NlbmUuYmFja2dyb3VuZHNbbGF5ZXJdXG4gICAgICAgICAgICBpZiBAcGFyYW1zLnZpZXdwb3J0Py50eXBlID09IFwidWlcIlxuICAgICAgICAgICAgICAgIHNjZW5lLmJhY2tncm91bmRzW2xheWVyXS52aWV3cG9ydCA9IEdyYXBoaWNzLnZpZXdwb3J0XG4gICAgICAgICAgICBzY2VuZS5iYWNrZ3JvdW5kc1tsYXllcl0uYW5jaG9yLnggPSBpZiBvcmlnaW4gPT0gMCB0aGVuIDAgZWxzZSAwLjVcbiAgICAgICAgICAgIHNjZW5lLmJhY2tncm91bmRzW2xheWVyXS5hbmNob3IueSA9IGlmIG9yaWdpbiA9PSAwIHRoZW4gMCBlbHNlIDAuNVxuICAgICAgICAgICAgc2NlbmUuYmFja2dyb3VuZHNbbGF5ZXJdLmJsZW5kTW9kZSA9IEBpbnRlcnByZXRlci5udW1iZXJWYWx1ZU9mKEBwYXJhbXMuYmxlbmRNb2RlKVxuICAgICAgICAgICAgc2NlbmUuYmFja2dyb3VuZHNbbGF5ZXJdLnpJbmRleCA9IHpJbmRleCArIGxheWVyXG4gICAgICAgICAgICBcbiAgICAgICAgICAgIGlmIG9yaWdpbiA9PSAxXG4gICAgICAgICAgICAgICAgc2NlbmUuYmFja2dyb3VuZHNbbGF5ZXJdLmRzdFJlY3QueCA9IHNjZW5lLmJhY2tncm91bmRzW2xheWVyXS5kc3RSZWN0LngjICsgc2NlbmUuYmFja2dyb3VuZHNbbGF5ZXJdLmJpdG1hcC53aWR0aC8yXG4gICAgICAgICAgICAgICAgc2NlbmUuYmFja2dyb3VuZHNbbGF5ZXJdLmRzdFJlY3QueSA9IHNjZW5lLmJhY2tncm91bmRzW2xheWVyXS5kc3RSZWN0LnkjICsgc2NlbmUuYmFja2dyb3VuZHNbbGF5ZXJdLmJpdG1hcC5oZWlnaHQvMlxuICAgICAgICAgICAgc2NlbmUuYmFja2dyb3VuZHNbbGF5ZXJdLnNldHVwKClcbiAgICAgICAgICAgIHNjZW5lLmJhY2tncm91bmRzW2xheWVyXS51cGRhdGUoKVxuICAgICAgICAgICAgXG4gICAgICAgIGdzLkdhbWVOb3RpZmllci5wb3N0TWlub3JDaGFuZ2UoKVxuICAgIFxuICAgICMjIypcbiAgICAqIEBtZXRob2QgY29tbWFuZENhbGxTY2VuZVxuICAgICogQHByb3RlY3RlZFxuICAgICMjIyAgICAgICAgIFxuICAgIGNvbW1hbmRDYWxsU2NlbmU6IC0+XG4gICAgICAgIEBpbnRlcnByZXRlci5jYWxsU2NlbmUoQGludGVycHJldGVyLnN0cmluZ1ZhbHVlT2YoQHBhcmFtcy5zY2VuZS51aWQgfHwgQHBhcmFtcy5zY2VuZSkpXG4gICAgICAgIFxuICAgICMjIypcbiAgICAqIEBtZXRob2QgY29tbWFuZENoYW5nZVNjZW5lXG4gICAgKiBAcHJvdGVjdGVkXG4gICAgIyMjICAgICAgICAgXG4gICAgY29tbWFuZENoYW5nZVNjZW5lOiAtPlxuICAgICAgICBpZiBHYW1lTWFuYWdlci5pbkxpdmVQcmV2aWV3IHRoZW4gcmV0dXJuXG4gICAgICAgIEdhbWVNYW5hZ2VyLnRlbXBTZXR0aW5ncy5za2lwID0gbm9cbiAgICAgICAgXG4gICAgICAgIGlmICFAcGFyYW1zLnNhdmVQcmV2aW91c1xuICAgICAgICAgICAgU2NlbmVNYW5hZ2VyLmNsZWFyKClcbiAgICAgICAgICAgIFxuICAgICAgICBzY2VuZSA9IFNjZW5lTWFuYWdlci5zY2VuZVxuICAgICAgICBpZiAhQHBhcmFtcy5lcmFzZVBpY3R1cmVzIGFuZCAhQHBhcmFtcy5zYXZlUHJldmlvdXNcbiAgICAgICAgICAgIHNjZW5lLnJlbW92ZU9iamVjdChzY2VuZS5waWN0dXJlQ29udGFpbmVyKVxuICAgICAgICAgICAgZm9yIHBpY3R1cmUgaW4gc2NlbmUucGljdHVyZXNcbiAgICAgICAgICAgICAgICBSZXNvdXJjZU1hbmFnZXIuY29udGV4dC5yZW1vdmUoXCJHcmFwaGljcy9QaWN0dXJlcy8je3BpY3R1cmUuaW1hZ2V9XCIpIGlmIHBpY3R1cmVcbiAgICAgICAgaWYgIUBwYXJhbXMuZXJhc2VUZXh0cyBhbmQgIUBwYXJhbXMuc2F2ZVByZXZpb3VzXG4gICAgICAgICAgICBzY2VuZS5yZW1vdmVPYmplY3Qoc2NlbmUudGV4dENvbnRhaW5lcilcbiAgICAgICMgIGlmICFAcGFyYW1zLmVyYXNlTWVzc2FnZUFyZWFzIGFuZCAhQHBhcmFtcy5zYXZlUHJldmlvdXNcbiAgICAgICMgICAgICBzY2VuZS5yZW1vdmVPYmplY3Qoc2NlbmUubWVzc2FnZUFyZWFDb250YWluZXIpXG4gICAgICAjICBpZiAhQHBhcmFtcy5lcmFzZUhvdHNwb3RzIGFuZCAhQHBhcmFtcy5zYXZlUHJldmlvdXNcbiAgICAgICMgICAgICBzY2VuZS5yZW1vdmVPYmplY3Qoc2NlbmUuaG90c3BvdENvbnRhaW5lcilcbiAgICAgICAgaWYgIUBwYXJhbXMuZXJhc2VWaWRlb3MgYW5kICFAcGFyYW1zLnNhdmVQcmV2aW91c1xuICAgICAgICAgICAgc2NlbmUucmVtb3ZlT2JqZWN0KHNjZW5lLnZpZGVvQ29udGFpbmVyKVxuICAgICAgICAgICAgZm9yIHZpZGVvIGluIHNjZW5lLnZpZGVvc1xuICAgICAgICAgICAgICAgIFJlc291cmNlTWFuYWdlci5jb250ZXh0LnJlbW92ZShcIk1vdmllcy8je3ZpZGVvLnZpZGVvfVwiKSBpZiB2aWRlb1xuICAgICAgICBcbiAgICAgICAgaWYgQHBhcmFtcy5zY2VuZVxuICAgICAgICAgICAgaWYgQHBhcmFtcy5zYXZlUHJldmlvdXNcbiAgICAgICAgICAgICAgICBHYW1lTWFuYWdlci5zY2VuZURhdGEgPSB1aWQ6IHVpZCA9IEBwYXJhbXMuc2NlbmUudWlkLCBwaWN0dXJlczogW10sIHRleHRzOiBbXSwgdmlkZW9zOiBbXVxuICAgICAgICAgICAgZWxzZVxuICAgICAgICAgICAgICAgIEdhbWVNYW5hZ2VyLnNjZW5lRGF0YSA9IHtcbiAgICAgICAgICAgICAgICAgICAgdWlkOiB1aWQgPSBAcGFyYW1zLnNjZW5lLnVpZCwgXG4gICAgICAgICAgICAgICAgICAgIHBpY3R1cmVzOiBzY2VuZS5waWN0dXJlQ29udGFpbmVyLnN1Yk9iamVjdHNCeURvbWFpbiwgXG4gICAgICAgICAgICAgICAgICAgIHRleHRzOiBzY2VuZS50ZXh0Q29udGFpbmVyLnN1Yk9iamVjdHNCeURvbWFpbiwgXG4gICAgICAgICAgICAgICAgICAgIHZpZGVvczogc2NlbmUudmlkZW9Db250YWluZXIuc3ViT2JqZWN0c0J5RG9tYWluXG4gICAgICAgICAgICAgICAgIyAgICBtZXNzYWdlQXJlYXM6IHNjZW5lLm1lc3NhZ2VBcmVhQ29udGFpbmVyLnN1Yk9iamVjdHNCeURvbWFpbixcbiAgICAgICAgICAgICAgICAgIyAgIGhvdHNwb3RzOiBzY2VuZS5ob3RzcG90Q29udGFpbmVyLnN1Yk9iamVjdHNCeURvbWFpblxuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGZsYWdzID0gQHBhcmFtcy5maWVsZEZsYWdzIHx8IHt9XG4gICAgICAgICAgICBpc0xvY2tlZCA9IGdzLkNvbW1hbmRGaWVsZEZsYWdzLmlzTG9ja2VkXG4gICAgICAgICAgICBuZXdTY2VuZSA9IG5ldyB2bi5PYmplY3RfU2NlbmUoKVxuICAgICAgICAgICAgaWYgQHBhcmFtcy5zYXZlUHJldmlvdXNcbiAgICAgICAgICAgICAgICBuZXdTY2VuZS5zY2VuZURhdGEgPSB1aWQ6IHVpZCA9IEBwYXJhbXMuc2NlbmUudWlkLCBwaWN0dXJlczogW10sIHRleHRzOiBbXSwgdmlkZW9zOiBbXSwgYmFja2xvZzogR2FtZU1hbmFnZXIuYmFja2xvZ1xuICAgICAgICAgICAgZWxzZVxuICAgICAgICAgICAgICAgIG5ld1NjZW5lLnNjZW5lRGF0YSA9IHVpZDogdWlkID0gQHBhcmFtcy5zY2VuZS51aWQsIHBpY3R1cmVzOiBzY2VuZS5waWN0dXJlQ29udGFpbmVyLnN1Yk9iamVjdHNCeURvbWFpbiwgdGV4dHM6IHNjZW5lLnRleHRDb250YWluZXIuc3ViT2JqZWN0c0J5RG9tYWluLCB2aWRlb3M6IHNjZW5lLnZpZGVvQ29udGFpbmVyLnN1Yk9iamVjdHNCeURvbWFpblxuICAgICAgICAgICAgXG4gICAgICAgICAgICBTY2VuZU1hbmFnZXIuc3dpdGNoVG8obmV3U2NlbmUsIEBwYXJhbXMuc2F2ZVByZXZpb3VzLCA9PiBAaW50ZXJwcmV0ZXIuaXNXYWl0aW5nID0gbm8pXG4gICAgICAgIGVsc2VcbiAgICAgICAgICAgIFNjZW5lTWFuYWdlci5zd2l0Y2hUbyhudWxsKVxuICAgICAgICAgICBcbiAgICAgICAgQGludGVycHJldGVyLmlzV2FpdGluZyA9IHllc1xuICAgICAgXG4gICAgIyMjKlxuICAgICogQG1ldGhvZCBjb21tYW5kUmV0dXJuVG9QcmV2aW91c1NjZW5lXG4gICAgKiBAcHJvdGVjdGVkXG4gICAgIyMjICBcbiAgICBjb21tYW5kUmV0dXJuVG9QcmV2aW91c1NjZW5lOiAtPlxuICAgICAgICBpZiBHYW1lTWFuYWdlci5pbkxpdmVQcmV2aWV3IHRoZW4gcmV0dXJuXG4gICAgICAgIFNjZW5lTWFuYWdlci5yZXR1cm5Ub1ByZXZpb3VzKD0+IEBpbnRlcnByZXRlci5pc1dhaXRpbmcgPSBubylcbiAgICAgICAgXG4gICAgICAgIEBpbnRlcnByZXRlci5pc1dhaXRpbmcgPSB5ZXNcbiAgICAgICAgXG4gICAgXG4gICAgIyMjKlxuICAgICogQG1ldGhvZCBjb21tYW5kU3dpdGNoVG9MYXlvdXRcbiAgICAqIEBwcm90ZWN0ZWRcbiAgICAjIyMgICAgXG4gICAgY29tbWFuZFN3aXRjaFRvTGF5b3V0OiAtPlxuICAgICAgICBpZiBHYW1lTWFuYWdlci5pbkxpdmVQcmV2aWV3IHRoZW4gcmV0dXJuXG4gICAgICAgIGlmIHVpLlVJTWFuYWdlci5sYXlvdXRzW0BwYXJhbXMubGF5b3V0Lm5hbWVdP1xuICAgICAgICAgICAgc2NlbmUgPSBuZXcgZ3MuT2JqZWN0X0xheW91dChAcGFyYW1zLmxheW91dC5uYW1lKVxuICAgICAgICAgICAgU2NlbmVNYW5hZ2VyLnN3aXRjaFRvKHNjZW5lLCBAcGFyYW1zLnNhdmVQcmV2aW91cywgPT4gQGludGVycHJldGVyLmlzV2FpdGluZyA9IG5vKVxuICAgICAgICAgICAgQGludGVycHJldGVyLmlzV2FpdGluZyA9IHllc1xuICAgIFxuICAgICMjIypcbiAgICAqIEBtZXRob2QgY29tbWFuZENoYW5nZVRyYW5zaXRpb25cbiAgICAqIEBwcm90ZWN0ZWRcbiAgICAjIyMgICAgXG4gICAgY29tbWFuZENoYW5nZVRyYW5zaXRpb246IC0+XG4gICAgICAgIGZsYWdzID0gQHBhcmFtcy5maWVsZEZsYWdzIHx8IHt9XG4gICAgICAgIGlzTG9ja2VkID0gZ3MuQ29tbWFuZEZpZWxkRmxhZ3MuaXNMb2NrZWRcbiAgICAgICAgXG4gICAgICAgIGlmICFpc0xvY2tlZChmbGFncy5kdXJhdGlvbilcbiAgICAgICAgICAgIFNjZW5lTWFuYWdlci50cmFuc2l0aW9uRGF0YS5kdXJhdGlvbiA9IEBpbnRlcnByZXRlci5kdXJhdGlvblZhbHVlT2YoQHBhcmFtcy5kdXJhdGlvbilcbiAgICAgICAgaWYgIWlzTG9ja2VkKGZsYWdzLmdyYXBoaWMpXG4gICAgICAgICAgICBTY2VuZU1hbmFnZXIudHJhbnNpdGlvbkRhdGEuZ3JhcGhpYyA9IEBwYXJhbXMuZ3JhcGhpY1xuICAgICAgICBpZiAhaXNMb2NrZWQoZmxhZ3MudmFndWUpXG4gICAgICAgICAgICBTY2VuZU1hbmFnZXIudHJhbnNpdGlvbkRhdGEudmFndWUgPSBAcGFyYW1zLnZhZ3VlXG4gICAgICAgIFxuICAgICMjIypcbiAgICAqIEBtZXRob2QgY29tbWFuZEZyZWV6ZVNjcmVlblxuICAgICogQHByb3RlY3RlZFxuICAgICMjIyAgIFxuICAgIGNvbW1hbmRGcmVlemVTY3JlZW46IC0+IFxuICAgICAgICBHcmFwaGljcy5mcmVlemUoKVxuICAgIFxuICAgICMjIypcbiAgICAqIEBtZXRob2QgY29tbWFuZFNjcmVlblRyYW5zaXRpb25cbiAgICAqIEBwcm90ZWN0ZWRcbiAgICAjIyMgIFxuICAgIGNvbW1hbmRTY3JlZW5UcmFuc2l0aW9uOiAtPlxuICAgICAgICBkZWZhdWx0cyA9IEdhbWVNYW5hZ2VyLmRlZmF1bHRzLnNjZW5lXG4gICAgICAgIGZsYWdzID0gQHBhcmFtcy5maWVsZEZsYWdzIHx8IHt9XG4gICAgICAgIGlzTG9ja2VkID0gZ3MuQ29tbWFuZEZpZWxkRmxhZ3MuaXNMb2NrZWRcbiAgICAgICAgZ3JhcGhpY05hbWUgPSBpZiAhaXNMb2NrZWQoZmxhZ3MuZ3JhcGhpYykgdGhlbiBAcGFyYW1zLmdyYXBoaWM/Lm5hbWUgZWxzZSBTY2VuZU1hbmFnZXIudHJhbnNpdGlvbkRhdGEuZ3JhcGhpYz8ubmFtZVxuICAgICAgICBcbiAgICAgICAgaWYgZ3JhcGhpY05hbWVcbiAgICAgICAgICAgIGJpdG1hcCA9IGlmICFpc0xvY2tlZChmbGFncy5ncmFwaGljKSB0aGVuIFJlc291cmNlTWFuYWdlci5nZXRCaXRtYXAoXCJHcmFwaGljcy9NYXNrcy8je2dyYXBoaWNOYW1lfVwiKSBlbHNlIFJlc291cmNlTWFuYWdlci5nZXRCaXRtYXAoXCJHcmFwaGljcy9NYXNrcy8je2dyYXBoaWNOYW1lfVwiKVxuICAgICAgICB2YWd1ZSA9IGlmICFpc0xvY2tlZChmbGFncy52YWd1ZSkgdGhlbiBAaW50ZXJwcmV0ZXIubnVtYmVyVmFsdWVPZihAcGFyYW1zLnZhZ3VlKSBlbHNlIFNjZW5lTWFuYWdlci50cmFuc2l0aW9uRGF0YS52YWd1ZVxuICAgICAgICBkdXJhdGlvbiA9IGlmICFpc0xvY2tlZChmbGFncy5kdXJhdGlvbikgdGhlbiBAaW50ZXJwcmV0ZXIuZHVyYXRpb25WYWx1ZU9mKEBwYXJhbXMuZHVyYXRpb24pIGVsc2UgU2NlbmVNYW5hZ2VyLnRyYW5zaXRpb25EYXRhLmR1cmF0aW9uXG4gICAgICAgIFxuICAgICAgICBAaW50ZXJwcmV0ZXIuaXNXYWl0aW5nID0gIUdhbWVNYW5hZ2VyLmluTGl2ZVByZXZpZXdcbiAgICAgICAgQGludGVycHJldGVyLndhaXRDb3VudGVyID0gZHVyYXRpb25cbiAgICAgICAgXG4gICAgICAgIFxuICAgICAgICBHcmFwaGljcy50cmFuc2l0aW9uKGR1cmF0aW9uLCBiaXRtYXAsIHZhZ3VlKVxuICAgIFxuICAgICMjIypcbiAgICAqIEBtZXRob2QgY29tbWFuZFNoYWtlU2NyZWVuXG4gICAgKiBAcHJvdGVjdGVkXG4gICAgIyMjXG4gICAgY29tbWFuZFNoYWtlU2NyZWVuOiAtPlxuICAgICAgICBpZiBub3QgU2NlbmVNYW5hZ2VyLnNjZW5lLnZpZXdwb3J0PyB0aGVuIHJldHVybiAgICAgICAgICAgICAgICBcbiAgICAgICBcbiAgICAgICAgQGludGVycHJldGVyLnNoYWtlT2JqZWN0KFNjZW5lTWFuYWdlci5zY2VuZS52aWV3cG9ydCwgQHBhcmFtcykgIFxuICAgICAgICBncy5HYW1lTm90aWZpZXIucG9zdE1pbm9yQ2hhbmdlKClcbiAgICBcbiAgICBcbiAgICAjIyMqXG4gICAgKiBAbWV0aG9kIGNvbW1hbmRUaW50U2NyZWVuXG4gICAgKiBAcHJvdGVjdGVkXG4gICAgIyMjICAgIFxuICAgIGNvbW1hbmRUaW50U2NyZWVuOiAtPlxuICAgICAgICBkdXJhdGlvbiA9IEBpbnRlcnByZXRlci5kdXJhdGlvblZhbHVlT2YoQHBhcmFtcy5kdXJhdGlvbilcbiAgICAgICAgU2NlbmVNYW5hZ2VyLnNjZW5lLnZpZXdwb3J0LmFuaW1hdG9yLnRpbnRUbyhuZXcgVG9uZShAcGFyYW1zLnRvbmUpLCBkdXJhdGlvbiwgZ3MuRWFzaW5ncy5FQVNFX0xJTkVBUlswXSlcbiAgICAgICBcbiAgICAgICAgaWYgQHBhcmFtcy53YWl0Rm9yQ29tcGxldGlvbiBhbmQgZHVyYXRpb24gPiAwXG4gICAgICAgICAgICBAaW50ZXJwcmV0ZXIuaXNXYWl0aW5nID0geWVzXG4gICAgICAgICAgICBAaW50ZXJwcmV0ZXIud2FpdENvdW50ZXIgPSBkdXJhdGlvblxuICAgICAgICBncy5HYW1lTm90aWZpZXIucG9zdE1pbm9yQ2hhbmdlKClcbiAgICBcbiAgICAjIyMqXG4gICAgKiBAbWV0aG9kIGNvbW1hbmRab29tU2NyZWVuXG4gICAgKiBAcHJvdGVjdGVkXG4gICAgIyMjICBcbiAgICBjb21tYW5kWm9vbVNjcmVlbjogLT5cbiAgICAgICAgZWFzaW5nID0gZ3MuRWFzaW5ncy5mcm9tT2JqZWN0KEBwYXJhbXMuZWFzaW5nKVxuICAgICAgICBkdXJhdGlvbiA9IEBpbnRlcnByZXRlci5kdXJhdGlvblZhbHVlT2YoQHBhcmFtcy5kdXJhdGlvbilcbiAgICAgICAgc2NlbmUgPSBTY2VuZU1hbmFnZXIuc2NlbmVcblxuICAgICAgICBTY2VuZU1hbmFnZXIuc2NlbmUudmlld3BvcnQuYW5jaG9yLnggPSAwLjVcbiAgICAgICAgU2NlbmVNYW5hZ2VyLnNjZW5lLnZpZXdwb3J0LmFuY2hvci55ID0gMC41XG4gICAgICAgIFNjZW5lTWFuYWdlci5zY2VuZS52aWV3cG9ydC5hbmltYXRvci56b29tVG8oQGludGVycHJldGVyLm51bWJlclZhbHVlT2YoQHBhcmFtcy56b29taW5nLngpIC8gMTAwLCBAaW50ZXJwcmV0ZXIubnVtYmVyVmFsdWVPZihAcGFyYW1zLnpvb21pbmcueSkgLyAxMDAsIGR1cmF0aW9uLCBlYXNpbmcpXG4gICAgICAgIFxuICAgICAgICBAaW50ZXJwcmV0ZXIud2FpdEZvckNvbXBsZXRpb24obnVsbCwgQHBhcmFtcylcbiAgICAgICAgZ3MuR2FtZU5vdGlmaWVyLnBvc3RNaW5vckNoYW5nZSgpXG4gICAgICAgIFxuICAgICMjIypcbiAgICAqIEBtZXRob2QgY29tbWFuZFBhblNjcmVlblxuICAgICogQHByb3RlY3RlZFxuICAgICMjIyAgICAgICAgIFxuICAgIGNvbW1hbmRQYW5TY3JlZW46IC0+XG4gICAgICAgIHNjZW5lID0gU2NlbmVNYW5hZ2VyLnNjZW5lXG4gICAgICAgIGR1cmF0aW9uID0gQGludGVycHJldGVyLmR1cmF0aW9uVmFsdWVPZihAcGFyYW1zLmR1cmF0aW9uKVxuICAgICAgICBlYXNpbmcgPSBncy5FYXNpbmdzLmZyb21PYmplY3QoQHBhcmFtcy5lYXNpbmcpXG4gICAgICAgIEBpbnRlcnByZXRlci5zZXR0aW5ncy5zY3JlZW4ucGFuLnggLT0gQHBhcmFtcy5wb3NpdGlvbi54XG4gICAgICAgIEBpbnRlcnByZXRlci5zZXR0aW5ncy5zY3JlZW4ucGFuLnkgLT0gQHBhcmFtcy5wb3NpdGlvbi55XG4gICAgICAgIHZpZXdwb3J0ID0gU2NlbmVNYW5hZ2VyLnNjZW5lLnZpZXdwb3J0XG5cbiAgICAgICAgdmlld3BvcnQuYW5pbWF0b3Iuc2Nyb2xsVG8oLUBwYXJhbXMucG9zaXRpb24ueCArIHZpZXdwb3J0LmRzdFJlY3QueCwgLUBwYXJhbXMucG9zaXRpb24ueSArIHZpZXdwb3J0LmRzdFJlY3QueSwgZHVyYXRpb24sIGVhc2luZykgIFxuICAgICAgICBAaW50ZXJwcmV0ZXIud2FpdEZvckNvbXBsZXRpb24obnVsbCwgQHBhcmFtcylcbiAgICAgICAgZ3MuR2FtZU5vdGlmaWVyLnBvc3RNaW5vckNoYW5nZSgpXG4gICAgXG4gICAgIyMjKlxuICAgICogQG1ldGhvZCBjb21tYW5kUm90YXRlU2NyZWVuXG4gICAgKiBAcHJvdGVjdGVkXG4gICAgIyMjIFxuICAgIGNvbW1hbmRSb3RhdGVTY3JlZW46IC0+XG4gICAgICAgIHNjZW5lID0gU2NlbmVNYW5hZ2VyLnNjZW5lXG4gICAgICAgIFxuICAgICAgICBlYXNpbmcgPSBncy5FYXNpbmdzLmZyb21PYmplY3QoQHBhcmFtcy5lYXNpbmcpXG4gICAgICAgIGR1cmF0aW9uID0gQGludGVycHJldGVyLmR1cmF0aW9uVmFsdWVPZihAcGFyYW1zLmR1cmF0aW9uKVxuICAgICAgICBwYW4gPSBAaW50ZXJwcmV0ZXIuc2V0dGluZ3Muc2NyZWVuLnBhblxuXG4gICAgICAgIFNjZW5lTWFuYWdlci5zY2VuZS52aWV3cG9ydC5hbmNob3IueCA9IDAuNVxuICAgICAgICBTY2VuZU1hbmFnZXIuc2NlbmUudmlld3BvcnQuYW5jaG9yLnkgPSAwLjVcbiAgICAgICAgU2NlbmVNYW5hZ2VyLnNjZW5lLnZpZXdwb3J0LmFuaW1hdG9yLnJvdGF0ZShAcGFyYW1zLmRpcmVjdGlvbiwgQGludGVycHJldGVyLm51bWJlclZhbHVlT2YoQHBhcmFtcy5zcGVlZCkgLyAxMDAsIGR1cmF0aW9uLCBlYXNpbmcpXG4gICAgICAgIFxuICAgICAgICBAaW50ZXJwcmV0ZXIud2FpdEZvckNvbXBsZXRpb24obnVsbCwgQHBhcmFtcylcbiAgICAgICAgZ3MuR2FtZU5vdGlmaWVyLnBvc3RNaW5vckNoYW5nZSgpXG4gICAgICAgIFxuICAgICMjIypcbiAgICAqIEBtZXRob2QgY29tbWFuZEZsYXNoU2NyZWVuXG4gICAgKiBAcHJvdGVjdGVkXG4gICAgIyMjICAgICAgICAgXG4gICAgY29tbWFuZEZsYXNoU2NyZWVuOiAtPlxuICAgICAgICBkdXJhdGlvbiA9IEBpbnRlcnByZXRlci5kdXJhdGlvblZhbHVlT2YoQHBhcmFtcy5kdXJhdGlvbilcbiAgICAgICAgU2NlbmVNYW5hZ2VyLnNjZW5lLnZpZXdwb3J0LmFuaW1hdG9yLmZsYXNoKG5ldyBDb2xvcihAcGFyYW1zLmNvbG9yKSwgZHVyYXRpb24sIGdzLkVhc2luZ3MuRUFTRV9MSU5FQVJbMF0pXG4gICAgICAgIFxuICAgICAgICBpZiBAcGFyYW1zLndhaXRGb3JDb21wbGV0aW9uIGFuZCBkdXJhdGlvbiAhPSAwXG4gICAgICAgICAgICBAaW50ZXJwcmV0ZXIuaXNXYWl0aW5nID0geWVzXG4gICAgICAgICAgICBAaW50ZXJwcmV0ZXIud2FpdENvdW50ZXIgPSBkdXJhdGlvblxuICAgICAgICBncy5HYW1lTm90aWZpZXIucG9zdE1pbm9yQ2hhbmdlKClcbiAgICBcbiAgICBcbiAgICAjIyMqXG4gICAgKiBAbWV0aG9kIGNvbW1hbmRTY3JlZW5FZmZlY3RcbiAgICAqIEBwcm90ZWN0ZWRcbiAgICAjIyMgICAgICAgICAgXG4gICAgY29tbWFuZFNjcmVlbkVmZmVjdDogLT5cbiAgICAgICAgc2NlbmUgPSBTY2VuZU1hbmFnZXIuc2NlbmVcbiAgICAgICAgZmxhZ3MgPSBAcGFyYW1zLmZpZWxkRmxhZ3MgfHwge31cbiAgICAgICAgaXNMb2NrZWQgPSBncy5Db21tYW5kRmllbGRGbGFncy5pc0xvY2tlZFxuICAgICAgICBkdXJhdGlvbiA9IEBpbnRlcnByZXRlci5kdXJhdGlvblZhbHVlT2YoQHBhcmFtcy5kdXJhdGlvbilcbiAgICAgICAgZWFzaW5nID0gZ3MuRWFzaW5ncy5mcm9tT2JqZWN0KEBwYXJhbXMuZWFzaW5nKVxuICAgICAgICBcbiAgICAgICAgaWYgIWdzLkNvbW1hbmRGaWVsZEZsYWdzLmlzTG9ja2VkKGZsYWdzLnpPcmRlcikgXG4gICAgICAgICAgICB6T3JkZXIgPSBAaW50ZXJwcmV0ZXIubnVtYmVyVmFsdWVPZihAcGFyYW1zLnpPcmRlcilcbiAgICAgICAgZWxzZVxuICAgICAgICAgICAgek9yZGVyID0gU2NlbmVNYW5hZ2VyLnNjZW5lLnZpZXdwb3J0LnpJbmRleFxuICAgICAgICAgICAgXG4gICAgICAgIHZpZXdwb3J0ID0gc2NlbmUudmlld3BvcnRDb250YWluZXIuc3ViT2JqZWN0cy5maXJzdCAodikgLT4gdi56SW5kZXggPT0gek9yZGVyXG4gICAgICAgIFxuICAgICAgICBpZiAhdmlld3BvcnRcbiAgICAgICAgICAgIHZpZXdwb3J0ID0gbmV3IGdzLk9iamVjdF9WaWV3cG9ydCgpXG4gICAgICAgICAgICB2aWV3cG9ydC56SW5kZXggPSB6T3JkZXJcbiAgICAgICAgICAgIHNjZW5lLnZpZXdwb3J0Q29udGFpbmVyLmFkZE9iamVjdCh2aWV3cG9ydClcbiAgICAgICAgXG4gICAgICAgIHN3aXRjaCBAcGFyYW1zLnR5cGVcbiAgICAgICAgICAgIHdoZW4gMCAjIFdvYmJsZVxuICAgICAgICAgICAgICAgIHZpZXdwb3J0LmFuaW1hdG9yLndvYmJsZVRvKEBwYXJhbXMud29iYmxlLnBvd2VyIC8gMTAwMDAsIEBwYXJhbXMud29iYmxlLnNwZWVkIC8gMTAwLCBkdXJhdGlvbiwgZWFzaW5nKVxuICAgICAgICAgICAgICAgIHdvYmJsZSA9IHZpZXdwb3J0LmVmZmVjdHMud29iYmxlXG4gICAgICAgICAgICAgICAgd29iYmxlLmVuYWJsZWQgPSBAcGFyYW1zLndvYmJsZS5wb3dlciA+IDBcbiAgICAgICAgICAgICAgICB3b2JibGUudmVydGljYWwgPSBAcGFyYW1zLndvYmJsZS5vcmllbnRhdGlvbiA9PSAwIG9yIEBwYXJhbXMud29iYmxlLm9yaWVudGF0aW9uID09IDJcbiAgICAgICAgICAgICAgICB3b2JibGUuaG9yaXpvbnRhbCA9IEBwYXJhbXMud29iYmxlLm9yaWVudGF0aW9uID09IDEgb3IgQHBhcmFtcy53b2JibGUub3JpZW50YXRpb24gPT0gMlxuICAgICAgICAgICAgd2hlbiAxICMgQmx1clxuICAgICAgICAgICAgICAgIHZpZXdwb3J0LmFuaW1hdG9yLmJsdXJUbyhAcGFyYW1zLmJsdXIucG93ZXIgLyAxMDAsIGR1cmF0aW9uLCBlYXNpbmcpXG4gICAgICAgICAgICAgICAgdmlld3BvcnQuZWZmZWN0cy5ibHVyLmVuYWJsZWQgPSB5ZXNcbiAgICAgICAgICAgIHdoZW4gMiAjIFBpeGVsYXRlXG4gICAgICAgICAgICAgICAgdmlld3BvcnQuYW5pbWF0b3IucGl4ZWxhdGVUbyhAcGFyYW1zLnBpeGVsYXRlLnNpemUud2lkdGgsIEBwYXJhbXMucGl4ZWxhdGUuc2l6ZS5oZWlnaHQsIGR1cmF0aW9uLCBlYXNpbmcpXG4gICAgICAgICAgICAgICAgdmlld3BvcnQuZWZmZWN0cy5waXhlbGF0ZS5lbmFibGVkID0geWVzXG4gICAgXG4gICAgICAgIGlmIEBwYXJhbXMud2FpdEZvckNvbXBsZXRpb24gYW5kIGR1cmF0aW9uICE9IDBcbiAgICAgICAgICAgIEBpbnRlcnByZXRlci5pc1dhaXRpbmcgPSB5ZXNcbiAgICAgICAgICAgIEBpbnRlcnByZXRlci53YWl0Q291bnRlciA9IGR1cmF0aW9uXG4gICAgICAgIGdzLkdhbWVOb3RpZmllci5wb3N0TWlub3JDaGFuZ2UoKVxuICAgIFxuICAgICMjIypcbiAgICAqIEBtZXRob2QgY29tbWFuZFZpZGVvRGVmYXVsdHNcbiAgICAqIEBwcm90ZWN0ZWRcbiAgICAjIyMgICAgXG4gICAgY29tbWFuZFZpZGVvRGVmYXVsdHM6IC0+XG4gICAgICAgIGRlZmF1bHRzID0gR2FtZU1hbmFnZXIuZGVmYXVsdHMudmlkZW9cbiAgICAgICAgZmxhZ3MgPSBAcGFyYW1zLmZpZWxkRmxhZ3MgfHwge31cbiAgICAgICAgaXNMb2NrZWQgPSBncy5Db21tYW5kRmllbGRGbGFncy5pc0xvY2tlZFxuICAgICAgICBcbiAgICAgICAgaWYgIWlzTG9ja2VkKGZsYWdzLmFwcGVhckR1cmF0aW9uKSB0aGVuIGRlZmF1bHRzLmFwcGVhckR1cmF0aW9uID0gQGludGVycHJldGVyLmR1cmF0aW9uVmFsdWVPZihAcGFyYW1zLmFwcGVhckR1cmF0aW9uKVxuICAgICAgICBpZiAhaXNMb2NrZWQoZmxhZ3MuZGlzYXBwZWFyRHVyYXRpb24pIHRoZW4gZGVmYXVsdHMuZGlzYXBwZWFyRHVyYXRpb24gPSBAaW50ZXJwcmV0ZXIuZHVyYXRpb25WYWx1ZU9mKEBwYXJhbXMuZGlzYXBwZWFyRHVyYXRpb24pXG4gICAgICAgIGlmICFpc0xvY2tlZChmbGFncy56T3JkZXIpIHRoZW4gZGVmYXVsdHMuek9yZGVyID0gQGludGVycHJldGVyLm51bWJlclZhbHVlT2YoQHBhcmFtcy56T3JkZXIpXG4gICAgICAgIGlmICFpc0xvY2tlZChmbGFnc1tcImFwcGVhckVhc2luZy50eXBlXCJdKSB0aGVuIGRlZmF1bHRzLmFwcGVhckVhc2luZyA9IEBwYXJhbXMuYXBwZWFyRWFzaW5nXG4gICAgICAgIGlmICFpc0xvY2tlZChmbGFnc1tcImFwcGVhckFuaW1hdGlvbi50eXBlXCJdKSB0aGVuIGRlZmF1bHRzLmFwcGVhckFuaW1hdGlvbiA9IEBwYXJhbXMuYXBwZWFyQW5pbWF0aW9uXG4gICAgICAgIGlmICFpc0xvY2tlZChmbGFnc1tcImRpc2FwcGVhckVhc2luZy50eXBlXCJdKSB0aGVuIGRlZmF1bHRzLmRpc2FwcGVhckVhc2luZyA9IEBwYXJhbXMuZGlzYXBwZWFyRWFzaW5nXG4gICAgICAgIGlmICFpc0xvY2tlZChmbGFnc1tcImRpc2FwcGVhckFuaW1hdGlvbi50eXBlXCJdKSB0aGVuIGRlZmF1bHRzLmRpc2FwcGVhckFuaW1hdGlvbiA9IEBwYXJhbXMuZGlzYXBwZWFyQW5pbWF0aW9uXG4gICAgICAgIGlmICFpc0xvY2tlZChmbGFnc1tcIm1vdGlvbkJsdXIuZW5hYmxlZFwiXSkgdGhlbiBkZWZhdWx0cy5tb3Rpb25CbHVyID0gQHBhcmFtcy5tb3Rpb25CbHVyXG4gICAgICAgIGlmICFpc0xvY2tlZChmbGFncy5vcmlnaW4pIHRoZW4gZGVmYXVsdHMub3JpZ2luID0gQHBhcmFtcy5vcmlnaW5cbiAgICBcbiAgICBcbiAgICAjIyMqXG4gICAgKiBAbWV0aG9kIGNvbW1hbmRTaG93VmlkZW9cbiAgICAqIEBwcm90ZWN0ZWRcbiAgICAjIyMgICAgIFxuICAgIGNvbW1hbmRTaG93VmlkZW86IC0+XG4gICAgICAgIGRlZmF1bHRzID0gR2FtZU1hbmFnZXIuZGVmYXVsdHMudmlkZW9cbiAgICAgICAgZmxhZ3MgPSBAcGFyYW1zLmZpZWxkRmxhZ3MgfHwge31cbiAgICAgICAgaXNMb2NrZWQgPSBncy5Db21tYW5kRmllbGRGbGFncy5pc0xvY2tlZFxuICAgICAgICBzY2VuZSA9IFNjZW5lTWFuYWdlci5zY2VuZVxuICAgICAgICBzY2VuZS5iZWhhdmlvci5jaGFuZ2VWaWRlb0RvbWFpbihAcGFyYW1zLm51bWJlckRvbWFpbilcbiAgICAgICAgbnVtYmVyID0gQGludGVycHJldGVyLm51bWJlclZhbHVlT2YoQHBhcmFtcy5udW1iZXIpXG4gICAgICAgIHZpZGVvcyA9IHNjZW5lLnZpZGVvc1xuICAgICAgICBpZiBub3QgdmlkZW9zW251bWJlcl0/IHRoZW4gdmlkZW9zW251bWJlcl0gPSBuZXcgZ3MuT2JqZWN0X1ZpZGVvKClcbiAgICAgICAgXG4gICAgICAgIHggPSBAaW50ZXJwcmV0ZXIubnVtYmVyVmFsdWVPZihAcGFyYW1zLnBvc2l0aW9uLngpXG4gICAgICAgIHkgPSBAaW50ZXJwcmV0ZXIubnVtYmVyVmFsdWVPZihAcGFyYW1zLnBvc2l0aW9uLnkpXG4gICAgICAgIFxuICAgICAgICBlYXNpbmcgPSBpZiAhaXNMb2NrZWQoZmxhZ3NbXCJlYXNpbmcudHlwZVwiXSkgdGhlbiBncy5FYXNpbmdzLmZyb21WYWx1ZXMoQGludGVycHJldGVyLm51bWJlclZhbHVlT2YoQHBhcmFtcy5lYXNpbmcudHlwZSksIEBwYXJhbXMuZWFzaW5nLmluT3V0KSBlbHNlIGdzLkVhc2luZ3MuZnJvbU9iamVjdChkZWZhdWx0cy5hcHBlYXJFYXNpbmcpXG4gICAgICAgIGR1cmF0aW9uID0gaWYgIWlzTG9ja2VkKGZsYWdzLmR1cmF0aW9uKSB0aGVuIEBpbnRlcnByZXRlci5kdXJhdGlvblZhbHVlT2YoQHBhcmFtcy5kdXJhdGlvbikgZWxzZSBkZWZhdWx0cy5hcHBlYXJEdXJhdGlvblxuICAgICAgICBvcmlnaW4gPSBpZiAhaXNMb2NrZWQoZmxhZ3Mub3JpZ2luKSB0aGVuIEBwYXJhbXMub3JpZ2luIGVsc2UgZGVmYXVsdHMub3JpZ2luXG4gICAgICAgIHpJbmRleCA9IGlmICFpc0xvY2tlZChmbGFncy56T3JkZXIpIHRoZW4gQGludGVycHJldGVyLm51bWJlclZhbHVlT2YoQHBhcmFtcy56T3JkZXIpIGVsc2UgZGVmYXVsdHMuek9yZGVyXG4gICAgICAgIGFuaW1hdGlvbiA9IGlmICFpc0xvY2tlZChmbGFnc1tcImFuaW1hdGlvbi50eXBlXCJdKSB0aGVuIEBwYXJhbXMuYW5pbWF0aW9uIGVsc2UgZGVmYXVsdHMuYXBwZWFyQW5pbWF0aW9uXG4gICAgXG4gICAgICAgIHZpZGVvID0gdmlkZW9zW251bWJlcl1cbiAgICAgICAgdmlkZW8uZG9tYWluID0gQHBhcmFtcy5udW1iZXJEb21haW5cbiAgICAgICAgdmlkZW8udmlkZW8gPSBAcGFyYW1zLnZpZGVvPy5uYW1lXG4gICAgICAgIHZpZGVvLmxvb3AgPSBAcGFyYW1zLmxvb3AgPyB5ZXNcbiAgICAgICAgdmlkZW8uZHN0UmVjdC54ID0geFxuICAgICAgICB2aWRlby5kc3RSZWN0LnkgPSB5XG4gICAgICAgIHZpZGVvLmJsZW5kTW9kZSA9IEBpbnRlcnByZXRlci5udW1iZXJWYWx1ZU9mKEBwYXJhbXMuYmxlbmRNb2RlKVxuICAgICAgICB2aWRlby5hbmNob3IueCA9IGlmIG9yaWdpbiA9PSAwIHRoZW4gMCBlbHNlIDAuNVxuICAgICAgICB2aWRlby5hbmNob3IueSA9IGlmIG9yaWdpbiA9PSAwIHRoZW4gMCBlbHNlIDAuNVxuICAgICAgICB2aWRlby56SW5kZXggPSB6SW5kZXggfHwgICgxMDAwICsgbnVtYmVyKVxuICAgICAgICBpZiBAcGFyYW1zLnZpZXdwb3J0Py50eXBlID09IFwic2NlbmVcIlxuICAgICAgICAgICAgdmlkZW8udmlld3BvcnQgPSBTY2VuZU1hbmFnZXIuc2NlbmUuYmVoYXZpb3Iudmlld3BvcnRcbiAgICAgICAgdmlkZW8udXBkYXRlKClcbiAgICAgICAgXG4gICAgICAgIGlmIEBwYXJhbXMucG9zaXRpb25UeXBlID09IDBcbiAgICAgICAgICAgIHAgPSBAaW50ZXJwcmV0ZXIucHJlZGVmaW5lZE9iamVjdFBvc2l0aW9uKEBwYXJhbXMucHJlZGVmaW5lZFBvc2l0aW9uSWQsIHZpZGVvLCBAcGFyYW1zKVxuICAgICAgICAgICAgdmlkZW8uZHN0UmVjdC54ID0gcC54XG4gICAgICAgICAgICB2aWRlby5kc3RSZWN0LnkgPSBwLnlcbiAgICAgICAgICAgIFxuICAgICAgICB2aWRlby5hbmltYXRvci5hcHBlYXIoeCwgeSwgYW5pbWF0aW9uLCBlYXNpbmcsIGR1cmF0aW9uKVxuICAgICAgICBcbiAgICAgICAgaWYgQHBhcmFtcy53YWl0Rm9yQ29tcGxldGlvbiBhbmQgbm90IChkdXJhdGlvbiA9PSAwIG9yIEBpbnRlcnByZXRlci5pc0luc3RhbnRTa2lwKCkpXG4gICAgICAgICAgICBAaW50ZXJwcmV0ZXIuaXNXYWl0aW5nID0geWVzXG4gICAgICAgICAgICBAaW50ZXJwcmV0ZXIud2FpdENvdW50ZXIgPSBkdXJhdGlvblxuICAgICAgICBncy5HYW1lTm90aWZpZXIucG9zdE1pbm9yQ2hhbmdlKClcbiAgICBcbiAgICAjIyMqXG4gICAgKiBAbWV0aG9kIGNvbW1hbmRNb3ZlVmlkZW9cbiAgICAqIEBwcm90ZWN0ZWRcbiAgICAjIyMgIFxuICAgIGNvbW1hbmRNb3ZlVmlkZW86IC0+XG4gICAgICAgIHNjZW5lID0gU2NlbmVNYW5hZ2VyLnNjZW5lXG4gICAgICAgIHNjZW5lLmJlaGF2aW9yLmNoYW5nZVZpZGVvRG9tYWluKEBwYXJhbXMubnVtYmVyRG9tYWluKVxuICAgICAgICBudW1iZXIgPSBAaW50ZXJwcmV0ZXIubnVtYmVyVmFsdWVPZihAcGFyYW1zLm51bWJlcilcbiAgICAgICAgdmlkZW8gPSBzY2VuZS52aWRlb3NbbnVtYmVyXVxuICAgICAgICBpZiBub3QgdmlkZW8/IHRoZW4gcmV0dXJuXG4gICAgICAgIFxuICAgICAgICBAaW50ZXJwcmV0ZXIubW92ZU9iamVjdCh2aWRlbywgQHBhcmFtcy5waWN0dXJlLnBvc2l0aW9uLCBAcGFyYW1zKVxuICAgICAgICBcbiAgICAgICAgZ3MuR2FtZU5vdGlmaWVyLnBvc3RNaW5vckNoYW5nZSgpXG4gICAgXG4gICAgIyMjKlxuICAgICogQG1ldGhvZCBjb21tYW5kTW92ZVZpZGVvUGF0aFxuICAgICogQHByb3RlY3RlZFxuICAgICMjIyAgICAgIFxuICAgIGNvbW1hbmRNb3ZlVmlkZW9QYXRoOiAtPlxuICAgICAgICBzY2VuZSA9IFNjZW5lTWFuYWdlci5zY2VuZVxuICAgICAgICBzY2VuZS5iZWhhdmlvci5jaGFuZ2VWaWRlb0RvbWFpbihAcGFyYW1zLm51bWJlckRvbWFpbilcbiAgICAgICAgbnVtYmVyID0gQGludGVycHJldGVyLm51bWJlclZhbHVlT2YoQHBhcmFtcy5udW1iZXIpXG4gICAgICAgIHZpZGVvID0gc2NlbmUudmlkZW9zW251bWJlcl1cbiAgICAgICAgaWYgbm90IHZpZGVvPyB0aGVuIHJldHVyblxuICAgICAgICBcbiAgICAgICAgQGludGVycHJldGVyLm1vdmVPYmplY3RQYXRoKHZpZGVvLCBAcGFyYW1zKVxuICAgICAgICBcbiAgICAgICAgZ3MuR2FtZU5vdGlmaWVyLnBvc3RNaW5vckNoYW5nZSgpXG4gICAgXG4gICAgIyMjKlxuICAgICogQG1ldGhvZCBjb21tYW5kUm90YXRlVmlkZW9cbiAgICAqIEBwcm90ZWN0ZWRcbiAgICAjIyMgXG4gICAgY29tbWFuZFJvdGF0ZVZpZGVvOiAtPlxuICAgICAgICBzY2VuZSA9IFNjZW5lTWFuYWdlci5zY2VuZVxuICAgICAgICBzY2VuZS5iZWhhdmlvci5jaGFuZ2VWaWRlb0RvbWFpbihAcGFyYW1zLm51bWJlckRvbWFpbilcbiAgICAgICAgbnVtYmVyID0gQGludGVycHJldGVyLm51bWJlclZhbHVlT2YoQHBhcmFtcy5udW1iZXIpXG4gICAgICAgIHZpZGVvID0gc2NlbmUudmlkZW9zW251bWJlcl1cbiAgICAgICAgaWYgbm90IHZpZGVvPyB0aGVuIHJldHVyblxuICAgICAgICBcbiAgICAgICAgQGludGVycHJldGVyLnJvdGF0ZU9iamVjdCh2aWRlbywgQHBhcmFtcylcbiAgICAgICAgXG4gICAgICAgIGdzLkdhbWVOb3RpZmllci5wb3N0TWlub3JDaGFuZ2UoKVxuICAgIFxuICAgICMjIypcbiAgICAqIEBtZXRob2QgY29tbWFuZFpvb21WaWRlb1xuICAgICogQHByb3RlY3RlZFxuICAgICMjIyBcbiAgICBjb21tYW5kWm9vbVZpZGVvOiAtPlxuICAgICAgICBzY2VuZSA9IFNjZW5lTWFuYWdlci5zY2VuZVxuICAgICAgICBzY2VuZS5iZWhhdmlvci5jaGFuZ2VWaWRlb0RvbWFpbihAcGFyYW1zLm51bWJlckRvbWFpbilcbiAgICAgICAgbnVtYmVyID0gQGludGVycHJldGVyLm51bWJlclZhbHVlT2YoQHBhcmFtcy5udW1iZXIpXG4gICAgICAgIHZpZGVvID0gc2NlbmUudmlkZW9zW251bWJlcl1cbiAgICAgICAgaWYgbm90IHZpZGVvPyB0aGVuIHJldHVyblxuICAgICAgICBcbiAgICAgICAgQGludGVycHJldGVyLnpvb21PYmplY3QodmlkZW8sIEBwYXJhbXMpXG4gICAgICAgIFxuICAgICAgICBncy5HYW1lTm90aWZpZXIucG9zdE1pbm9yQ2hhbmdlKClcbiAgICBcbiAgICAjIyMqXG4gICAgKiBAbWV0aG9kIGNvbW1hbmRCbGVuZFZpZGVvXG4gICAgKiBAcHJvdGVjdGVkXG4gICAgIyMjXG4gICAgY29tbWFuZEJsZW5kVmlkZW86IC0+XG4gICAgICAgIFNjZW5lTWFuYWdlci5zY2VuZS5iZWhhdmlvci5jaGFuZ2VWaWRlb0RvbWFpbihAcGFyYW1zLm51bWJlckRvbWFpbilcbiAgICAgICAgdmlkZW8gPSBTY2VuZU1hbmFnZXIuc2NlbmUudmlkZW9zW0BpbnRlcnByZXRlci5udW1iZXJWYWx1ZU9mKEBwYXJhbXMubnVtYmVyKV1cbiAgICAgICAgaWYgbm90IHZpZGVvPyB0aGVuIHJldHVyblxuICAgICAgICBcbiAgICAgICAgQGludGVycHJldGVyLmJsZW5kT2JqZWN0KHZpZGVvLCBAcGFyYW1zKSBcbiAgICAgICAgXG4gICAgICAgIGdzLkdhbWVOb3RpZmllci5wb3N0TWlub3JDaGFuZ2UoKVxuICAgICAgICBcbiAgICAjIyMqXG4gICAgKiBAbWV0aG9kIGNvbW1hbmRUaW50VmlkZW9cbiAgICAqIEBwcm90ZWN0ZWRcbiAgICAjIyMgXG4gICAgY29tbWFuZFRpbnRWaWRlbzogLT5cbiAgICAgICAgc2NlbmUgPSBTY2VuZU1hbmFnZXIuc2NlbmVcbiAgICAgICAgc2NlbmUuYmVoYXZpb3IuY2hhbmdlVmlkZW9Eb21haW4oQHBhcmFtcy5udW1iZXJEb21haW4pXG4gICAgICAgIG51bWJlciA9IEBpbnRlcnByZXRlci5udW1iZXJWYWx1ZU9mKEBwYXJhbXMubnVtYmVyKVxuICAgICAgICB2aWRlbyA9IHNjZW5lLnZpZGVvc1tudW1iZXJdXG4gICAgICAgIGlmIG5vdCB2aWRlbz8gdGhlbiByZXR1cm5cbiAgICAgICAgXG4gICAgICAgIEBpbnRlcnByZXRlci50aW50T2JqZWN0KHZpZGVvLCBAcGFyYW1zKVxuICAgICAgICBcbiAgICAgICAgZ3MuR2FtZU5vdGlmaWVyLnBvc3RNaW5vckNoYW5nZSgpXG4gICAgXG4gICAgIyMjKlxuICAgICogQG1ldGhvZCBjb21tYW5kRmxhc2hWaWRlb1xuICAgICogQHByb3RlY3RlZFxuICAgICMjIyBcbiAgICBjb21tYW5kRmxhc2hWaWRlbzogLT5cbiAgICAgICAgc2NlbmUgPSBTY2VuZU1hbmFnZXIuc2NlbmVcbiAgICAgICAgc2NlbmUuYmVoYXZpb3IuY2hhbmdlVmlkZW9Eb21haW4oQHBhcmFtcy5udW1iZXJEb21haW4pXG4gICAgICAgIG51bWJlciA9IEBpbnRlcnByZXRlci5udW1iZXJWYWx1ZU9mKEBwYXJhbXMubnVtYmVyKVxuICAgICAgICB2aWRlbyA9IHNjZW5lLnZpZGVvc1tudW1iZXJdXG4gICAgICAgIGlmIG5vdCB2aWRlbz8gdGhlbiByZXR1cm5cbiAgICAgICAgXG4gICAgICAgIEBpbnRlcnByZXRlci5mbGFzaE9iamVjdCh2aWRlbywgQHBhcmFtcylcbiAgICAgICAgXG4gICAgICAgIGdzLkdhbWVOb3RpZmllci5wb3N0TWlub3JDaGFuZ2UoKVxuICAgIFxuICAgICMjIypcbiAgICAqIEBtZXRob2QgY29tbWFuZENyb3BWaWRlb1xuICAgICogQHByb3RlY3RlZFxuICAgICMjIyBcbiAgICBjb21tYW5kQ3JvcFZpZGVvOiAtPlxuICAgICAgICBzY2VuZSA9IFNjZW5lTWFuYWdlci5zY2VuZVxuICAgICAgICBzY2VuZS5iZWhhdmlvci5jaGFuZ2VWaWRlb0RvbWFpbihAcGFyYW1zLm51bWJlckRvbWFpbilcbiAgICAgICAgbnVtYmVyID0gQGludGVycHJldGVyLm51bWJlclZhbHVlT2YoQHBhcmFtcy5udW1iZXIpXG4gICAgICAgIHZpZGVvID0gc2NlbmUudmlkZW9zW251bWJlcl1cbiAgICAgICAgaWYgbm90IHZpZGVvPyB0aGVuIHJldHVyblxuICAgICAgICBcbiAgICAgICAgQGludGVycHJldGVyLmNyb3BPYmplY3QodmlkZW8sIEBwYXJhbXMpXG4gICAgICAgIFxuICAgIFxuICAgICMjIypcbiAgICAqIEBtZXRob2QgY29tbWFuZFZpZGVvTW90aW9uQmx1clxuICAgICogQHByb3RlY3RlZFxuICAgICMjIyAgICAgXG4gICAgY29tbWFuZFZpZGVvTW90aW9uQmx1cjogLT5cbiAgICAgICAgc2NlbmUgPSBTY2VuZU1hbmFnZXIuc2NlbmVcbiAgICAgICAgc2NlbmUuYmVoYXZpb3IuY2hhbmdlVmlkZW9Eb21haW4oQHBhcmFtcy5udW1iZXJEb21haW4pXG4gICAgICAgIG51bWJlciA9IEBpbnRlcnByZXRlci5udW1iZXJWYWx1ZU9mKEBwYXJhbXMubnVtYmVyKVxuICAgICAgICB2aWRlbyA9IHNjZW5lLnZpZGVvc1tudW1iZXJdXG4gICAgICAgIGlmIG5vdCB2aWRlbz8gdGhlbiByZXR1cm5cbiAgICAgICAgXG4gICAgICAgIEBpbnRlcnByZXRlci5vYmplY3RNb3Rpb25CbHVyKHZpZGVvLCBAcGFyYW1zKVxuICAgICAgICBcbiAgICAjIyMqXG4gICAgKiBAbWV0aG9kIGNvbW1hbmRNYXNrVmlkZW9cbiAgICAqIEBwcm90ZWN0ZWRcbiAgICAjIyMgXG4gICAgY29tbWFuZE1hc2tWaWRlbzogLT5cbiAgICAgICAgc2NlbmUgPSBTY2VuZU1hbmFnZXIuc2NlbmVcbiAgICAgICAgc2NlbmUuYmVoYXZpb3IuY2hhbmdlVmlkZW9Eb21haW4oQHBhcmFtcy5udW1iZXJEb21haW4pXG4gICAgICAgIG51bWJlciA9IEBpbnRlcnByZXRlci5udW1iZXJWYWx1ZU9mKEBwYXJhbXMubnVtYmVyKVxuICAgICAgICB2aWRlbyA9IHNjZW5lLnZpZGVvc1tudW1iZXJdXG4gICAgICAgIGlmIG5vdCB2aWRlbz8gdGhlbiByZXR1cm5cbiAgICAgICAgXG4gICAgICAgIEBpbnRlcnByZXRlci5tYXNrT2JqZWN0KHZpZGVvLCBAcGFyYW1zKVxuICAgICAgICBcbiAgICAgICAgZ3MuR2FtZU5vdGlmaWVyLnBvc3RNaW5vckNoYW5nZSgpXG4gICAgXG4gICAgIyMjKlxuICAgICogQG1ldGhvZCBjb21tYW5kVmlkZW9FZmZlY3RcbiAgICAqIEBwcm90ZWN0ZWRcbiAgICAjIyMgXG4gICAgY29tbWFuZFZpZGVvRWZmZWN0OiAtPlxuICAgICAgICBzY2VuZSA9IFNjZW5lTWFuYWdlci5zY2VuZVxuICAgICAgICBzY2VuZS5iZWhhdmlvci5jaGFuZ2VWaWRlb0RvbWFpbihAcGFyYW1zLm51bWJlckRvbWFpbilcbiAgICAgICAgbnVtYmVyID0gQGludGVycHJldGVyLm51bWJlclZhbHVlT2YoQHBhcmFtcy5udW1iZXIpXG4gICAgICAgIHZpZGVvID0gc2NlbmUudmlkZW9zW251bWJlcl1cbiAgICAgICAgaWYgbm90IHZpZGVvPyB0aGVuIHJldHVyblxuICAgICAgICBcbiAgICAgICAgQGludGVycHJldGVyLm9iamVjdEVmZmVjdCh2aWRlbywgQHBhcmFtcylcbiAgICAgICAgZ3MuR2FtZU5vdGlmaWVyLnBvc3RNaW5vckNoYW5nZSgpXG4gICAgICAgIFxuICAgICMjIypcbiAgICAqIEBtZXRob2QgY29tbWFuZEVyYXNlVmlkZW9cbiAgICAqIEBwcm90ZWN0ZWRcbiAgICAjIyMgICAgIFxuICAgIGNvbW1hbmRFcmFzZVZpZGVvOiAtPlxuICAgICAgICBkZWZhdWx0cyA9IEdhbWVNYW5hZ2VyLmRlZmF1bHRzLnZpZGVvXG4gICAgICAgIGZsYWdzID0gQHBhcmFtcy5maWVsZEZsYWdzIHx8IHt9XG4gICAgICAgIGlzTG9ja2VkID0gZ3MuQ29tbWFuZEZpZWxkRmxhZ3MuaXNMb2NrZWRcbiAgICAgICAgc2NlbmUgPSBTY2VuZU1hbmFnZXIuc2NlbmVcbiAgICAgICAgc2NlbmUuYmVoYXZpb3IuY2hhbmdlVmlkZW9Eb21haW4oQHBhcmFtcy5udW1iZXJEb21haW4pXG4gICAgICAgIG51bWJlciA9IEBpbnRlcnByZXRlci5udW1iZXJWYWx1ZU9mKEBwYXJhbXMubnVtYmVyKVxuICAgICAgICB2aWRlbyA9IHNjZW5lLnZpZGVvc1tudW1iZXJdXG4gICAgICAgIGlmIG5vdCB2aWRlbz8gdGhlbiByZXR1cm5cbiAgICAgICAgXG4gICAgICAgIGVhc2luZyA9IGlmICFpc0xvY2tlZChmbGFnc1tcImVhc2luZy50eXBlXCJdKSB0aGVuIGdzLkVhc2luZ3MuZnJvbVZhbHVlcyhAaW50ZXJwcmV0ZXIubnVtYmVyVmFsdWVPZihAcGFyYW1zLmVhc2luZy50eXBlKSwgQHBhcmFtcy5lYXNpbmcuaW5PdXQpIGVsc2UgZ3MuRWFzaW5ncy5mcm9tT2JqZWN0KGRlZmF1bHRzLmRpc2FwcGVhckVhc2luZylcbiAgICAgICAgZHVyYXRpb24gPSBpZiAhaXNMb2NrZWQoZmxhZ3MuZHVyYXRpb24pIHRoZW4gQGludGVycHJldGVyLmR1cmF0aW9uVmFsdWVPZihAcGFyYW1zLmR1cmF0aW9uKSBlbHNlIGRlZmF1bHRzLmRpc2FwcGVhckR1cmF0aW9uXG4gICAgICAgIGFuaW1hdGlvbiA9IGlmICFpc0xvY2tlZChmbGFnc1tcImFuaW1hdGlvbi50eXBlXCJdKSB0aGVuIEBwYXJhbXMuYW5pbWF0aW9uIGVsc2UgZGVmYXVsdHMuZGlzYXBwZWFyQW5pbWF0aW9uXG4gICAgICAgIFxuICAgICAgICB2aWRlby5hbmltYXRvci5kaXNhcHBlYXIoYW5pbWF0aW9uLCBlYXNpbmcsIGR1cmF0aW9uLCAoc2VuZGVyKSA9PiBcbiAgICAgICAgICAgIHNlbmRlci5kaXNwb3NlKClcbiAgICAgICAgICAgIHNjZW5lLmJlaGF2aW9yLmNoYW5nZVRleHREb21haW4oc2VuZGVyLmRvbWFpbilcbiAgICAgICAgICAgIHNjZW5lLnZpZGVvc1tudW1iZXJdID0gbnVsbFxuICAgICAgICAgICMgIHNlbmRlci52aWRlby5wYXVzZSgpXG4gICAgICAgIClcbiAgICAgICAgXG4gICAgICAgIGlmIEBwYXJhbXMud2FpdEZvckNvbXBsZXRpb24gYW5kIG5vdCAoZHVyYXRpb24gPT0gMCBvciBAaW50ZXJwcmV0ZXIuaXNJbnN0YW50U2tpcCgpKVxuICAgICAgICAgICAgQGludGVycHJldGVyLmlzV2FpdGluZyA9IHllc1xuICAgICAgICAgICAgQGludGVycHJldGVyLndhaXRDb3VudGVyID0gZHVyYXRpb24gXG4gICAgICAgIGdzLkdhbWVOb3RpZmllci5wb3N0TWlub3JDaGFuZ2UoKVxuICAgIFxuICAgICMjIypcbiAgICAqIEBtZXRob2QgY29tbWFuZFNob3dJbWFnZU1hcFxuICAgICogQHByb3RlY3RlZFxuICAgICMjIyAgXG4gICAgY29tbWFuZFNob3dJbWFnZU1hcDogLT5cbiAgICAgICAgZmxhZ3MgPSBAcGFyYW1zLmZpZWxkRmxhZ3MgfHwge31cbiAgICAgICAgaXNMb2NrZWQgPSBncy5Db21tYW5kRmllbGRGbGFncy5pc0xvY2tlZFxuICAgICAgICBTY2VuZU1hbmFnZXIuc2NlbmUuYmVoYXZpb3IuY2hhbmdlUGljdHVyZURvbWFpbihAcGFyYW1zLm51bWJlckRvbWFpbilcbiAgICAgICAgbnVtYmVyID0gQGludGVycHJldGVyLm51bWJlclZhbHVlT2YoQHBhcmFtcy5udW1iZXIpXG4gICAgICAgIGltYWdlTWFwID0gU2NlbmVNYW5hZ2VyLnNjZW5lLnBpY3R1cmVzW251bWJlcl1cbiAgICAgICAgaWYgaW1hZ2VNYXA/XG4gICAgICAgICAgICBpbWFnZU1hcC5kaXNwb3NlKClcbiAgICAgICAgaW1hZ2VNYXAgPSBuZXcgZ3MuT2JqZWN0X0ltYWdlTWFwKClcbiAgICAgICAgaW1hZ2VNYXAudmlzdWFsLnZhcmlhYmxlQ29udGV4dCA9IEBpbnRlcnByZXRlci5jb250ZXh0XG4gICAgICAgIFNjZW5lTWFuYWdlci5zY2VuZS5waWN0dXJlc1tudW1iZXJdID0gaW1hZ2VNYXBcbiAgICAgICAgYml0bWFwID0gUmVzb3VyY2VNYW5hZ2VyLmdldEJpdG1hcChcIkdyYXBoaWNzL1BpY3R1cmVzLyN7QHBhcmFtcy5ncm91bmQ/Lm5hbWV9XCIpXG4gICAgICAgIFxuICAgICAgICBpbWFnZU1hcC5kc3RSZWN0LndpZHRoID0gYml0bWFwLndpZHRoXG4gICAgICAgIGltYWdlTWFwLmRzdFJlY3QuaGVpZ2h0ID0gYml0bWFwLmhlaWdodFxuICAgICAgICBcbiAgICAgICAgaWYgQHBhcmFtcy5wb3NpdGlvblR5cGUgPT0gMFxuICAgICAgICAgICAgcCA9IEBpbnRlcnByZXRlci5wcmVkZWZpbmVkT2JqZWN0UG9zaXRpb24oQHBhcmFtcy5wcmVkZWZpbmVkUG9zaXRpb25JZCwgaW1hZ2VNYXAsIEBwYXJhbXMpXG4gICAgICAgICAgICBpbWFnZU1hcC5kc3RSZWN0LnggPSBwLnhcbiAgICAgICAgICAgIGltYWdlTWFwLmRzdFJlY3QueSA9IHAueVxuICAgICAgICBlbHNlXG4gICAgICAgICAgICBpbWFnZU1hcC5kc3RSZWN0LnggPSBAaW50ZXJwcmV0ZXIubnVtYmVyVmFsdWVPZihAcGFyYW1zLnBvc2l0aW9uLngpXG4gICAgICAgICAgICBpbWFnZU1hcC5kc3RSZWN0LnkgPSBAaW50ZXJwcmV0ZXIubnVtYmVyVmFsdWVPZihAcGFyYW1zLnBvc2l0aW9uLnkpXG4gICAgICAgICAgICBcbiAgICAgICAgaW1hZ2VNYXAuYW5jaG9yLnggPSBpZiBAcGFyYW1zLm9yaWdpbiA9PSAxIHRoZW4gMC41IGVsc2UgMFxuICAgICAgICBpbWFnZU1hcC5hbmNob3IueSA9IGlmIEBwYXJhbXMub3JpZ2luID09IDEgdGhlbiAwLjUgZWxzZSAwXG4gICAgICAgIGltYWdlTWFwLnpJbmRleCA9IGlmICFpc0xvY2tlZChmbGFncy56T3JkZXIpIHRoZW4gQGludGVycHJldGVyLm51bWJlclZhbHVlT2YoQHBhcmFtcy56T3JkZXIpIGVsc2UgNDAwXG4gICAgICAgIGltYWdlTWFwLmJsZW5kTW9kZSA9IGlmICFpc0xvY2tlZChmbGFncy5ibGVuZE1vZGUpIHRoZW4gQHBhcmFtcy5ibGVuZE1vZGUgZWxzZSAwXG4gICAgICAgIGltYWdlTWFwLmhvdHNwb3RzID0gQHBhcmFtcy5ob3RzcG90c1xuICAgICAgICBpbWFnZU1hcC5pbWFnZXMgPSBbXG4gICAgICAgICAgICBAcGFyYW1zLmdyb3VuZD8ubmFtZSxcbiAgICAgICAgICAgIEBwYXJhbXMuaG92ZXI/Lm5hbWUsXG4gICAgICAgICAgICBAcGFyYW1zLnVuc2VsZWN0ZWQ/Lm5hbWUsXG4gICAgICAgICAgICBAcGFyYW1zLnNlbGVjdGVkPy5uYW1lLFxuICAgICAgICAgICAgQHBhcmFtcy5zZWxlY3RlZEhvdmVyPy5uYW1lXG4gICAgICAgIF1cbiAgICAgICAgXG4gICAgICAgIGltYWdlTWFwLmV2ZW50cy5vbiBcImp1bXBUb1wiLCBncy5DYWxsQmFjayhcIm9uSnVtcFRvXCIsIEBpbnRlcnByZXRlcilcbiAgICAgICAgaW1hZ2VNYXAuZXZlbnRzLm9uIFwiY2FsbENvbW1vbkV2ZW50XCIsIGdzLkNhbGxCYWNrKFwib25DYWxsQ29tbW9uRXZlbnRcIiwgQGludGVycHJldGVyKVxuICAgICAgICBcbiAgICAgICAgaW1hZ2VNYXAuc2V0dXAoKVxuICAgICAgICBpbWFnZU1hcC51cGRhdGUoKVxuICAgICAgICBcbiAgICAgICAgQGludGVycHJldGVyLnNob3dPYmplY3QoaW1hZ2VNYXAsIHt4OjAsIHk6MH0sIEBwYXJhbXMpXG4gICAgICAgIFxuICAgICAgICBpZiBAcGFyYW1zLndhaXRGb3JDb21wbGV0aW9uXG4gICAgICAgICAgICBAaW50ZXJwcmV0ZXIud2FpdENvdW50ZXIgPSAwXG4gICAgICAgICAgICBAaW50ZXJwcmV0ZXIuaXNXYWl0aW5nID0geWVzXG4gICAgICAgICAgICBcbiAgICAgICAgaW1hZ2VNYXAuZXZlbnRzLm9uIFwiZmluaXNoXCIsIChzZW5kZXIpID0+XG4gICAgICAgICAgICBAaW50ZXJwcmV0ZXIuaXNXYWl0aW5nID0gbm9cbiAgICAgICAgICAgIyBAaW50ZXJwcmV0ZXIuZXJhc2VPYmplY3Qoc2NlbmUuaW1hZ2VNYXAsIEBwYXJhbXMpXG4gICAgICAgIGdzLkdhbWVOb3RpZmllci5wb3N0TWlub3JDaGFuZ2UoKVxuICAgICAgICAgICAgICAgIFxuICAgICMjIypcbiAgICAqIEBtZXRob2QgY29tbWFuZEVyYXNlSW1hZ2VNYXBcbiAgICAqIEBwcm90ZWN0ZWRcbiAgICAjIyMgICAgICAgICAgICAgXG4gICAgY29tbWFuZEVyYXNlSW1hZ2VNYXA6IC0+XG4gICAgICAgIHNjZW5lID0gU2NlbmVNYW5hZ2VyLnNjZW5lXG4gICAgICAgIHNjZW5lLmJlaGF2aW9yLmNoYW5nZVBpY3R1cmVEb21haW4oQHBhcmFtcy5udW1iZXJEb21haW4pXG4gICAgICAgIG51bWJlciA9IEBpbnRlcnByZXRlci5udW1iZXJWYWx1ZU9mKEBwYXJhbXMubnVtYmVyKVxuICAgICAgICBpbWFnZU1hcCA9IHNjZW5lLnBpY3R1cmVzW251bWJlcl1cbiAgICAgICAgaWYgbm90IGltYWdlTWFwPyB0aGVuIHJldHVyblxuICAgICAgICBcbiAgICAgICAgaW1hZ2VNYXAuZXZlbnRzLmVtaXQoXCJmaW5pc2hcIiwgaW1hZ2VNYXApXG4gICAgICAgIGltYWdlTWFwLnZpc3VhbC5hY3RpdmUgPSBub1xuICAgICAgICBAaW50ZXJwcmV0ZXIuZXJhc2VPYmplY3QoaW1hZ2VNYXAsIEBwYXJhbXMsIChzZW5kZXIpID0+IFxuICAgICAgICAgICAgICAgIHNjZW5lLmJlaGF2aW9yLmNoYW5nZVBpY3R1cmVEb21haW4oc2VuZGVyLmRvbWFpbilcbiAgICAgICAgICAgICAgICBzY2VuZS5waWN0dXJlc1tudW1iZXJdID0gbnVsbFxuICAgICAgICApXG4gICAgICAgIGdzLkdhbWVOb3RpZmllci5wb3N0TWlub3JDaGFuZ2UoKVxuICAgICAgICBcbiAgICAjIyMqXG4gICAgKiBAbWV0aG9kIGNvbW1hbmRBZGRIb3RzcG90XG4gICAgKiBAcHJvdGVjdGVkXG4gICAgIyMjICAgICAgXG4gICAgY29tbWFuZEFkZEhvdHNwb3Q6IC0+XG4gICAgICAgIHNjZW5lID0gU2NlbmVNYW5hZ2VyLnNjZW5lXG4gICAgICAgIHNjZW5lLmJlaGF2aW9yLmNoYW5nZUhvdHNwb3REb21haW4oQHBhcmFtcy5udW1iZXJEb21haW4pXG4gICAgICAgIG51bWJlciA9IEBpbnRlcnByZXRlci5udW1iZXJWYWx1ZU9mKEBwYXJhbXMubnVtYmVyKVxuICAgICAgICBob3RzcG90cyA9IHNjZW5lLmhvdHNwb3RzXG4gICAgIFxuICAgICAgICBpZiBub3QgaG90c3BvdHNbbnVtYmVyXT9cbiAgICAgICAgICAgIGhvdHNwb3RzW251bWJlcl0gPSBuZXcgZ3MuT2JqZWN0X0hvdHNwb3QoKVxuICAgICAgICAgICAgXG4gICAgICAgIGhvdHNwb3QgPSBob3RzcG90c1tudW1iZXJdXG4gICAgICAgIGhvdHNwb3QuZG9tYWluID0gQHBhcmFtcy5udW1iZXJEb21haW5cbiAgICAgICAgXG4gICAgICAgIHN3aXRjaCBAcGFyYW1zLnBvc2l0aW9uVHlwZVxuICAgICAgICAgICAgd2hlbiAwICMgRGlyZWN0XG4gICAgICAgICAgICAgICAgaG90c3BvdC5kc3RSZWN0LnggPSBAcGFyYW1zLmJveC54XG4gICAgICAgICAgICAgICAgaG90c3BvdC5kc3RSZWN0LnkgPSBAcGFyYW1zLmJveC55XG4gICAgICAgICAgICAgICAgaG90c3BvdC5kc3RSZWN0LndpZHRoID0gQHBhcmFtcy5ib3guc2l6ZS53aWR0aFxuICAgICAgICAgICAgICAgIGhvdHNwb3QuZHN0UmVjdC5oZWlnaHQgPSBAcGFyYW1zLmJveC5zaXplLmhlaWdodFxuICAgICAgICAgICAgd2hlbiAxICMgQ2FsY3VsYXRlZFxuICAgICAgICAgICAgICAgIGhvdHNwb3QuZHN0UmVjdC54ID0gQGludGVycHJldGVyLm51bWJlclZhbHVlT2YoQHBhcmFtcy5ib3gueClcbiAgICAgICAgICAgICAgICBob3RzcG90LmRzdFJlY3QueSA9IEBpbnRlcnByZXRlci5udW1iZXJWYWx1ZU9mKEBwYXJhbXMuYm94LnkpXG4gICAgICAgICAgICAgICAgaG90c3BvdC5kc3RSZWN0LndpZHRoID0gQGludGVycHJldGVyLm51bWJlclZhbHVlT2YoQHBhcmFtcy5ib3guc2l6ZS53aWR0aClcbiAgICAgICAgICAgICAgICBob3RzcG90LmRzdFJlY3QuaGVpZ2h0ID0gQGludGVycHJldGVyLm51bWJlclZhbHVlT2YoQHBhcmFtcy5ib3guc2l6ZS5oZWlnaHQpXG4gICAgICAgICAgICB3aGVuIDIgIyBCaW5kIHRvIFBpY3R1cmVcbiAgICAgICAgICAgICAgICBwaWN0dXJlID0gc2NlbmUucGljdHVyZXNbQGludGVycHJldGVyLm51bWJlclZhbHVlT2YoQHBhcmFtcy5waWN0dXJlTnVtYmVyKV1cbiAgICAgICAgICAgICAgICBpZiBwaWN0dXJlP1xuICAgICAgICAgICAgICAgICAgICBob3RzcG90LnRhcmdldCA9IHBpY3R1cmVcbiAgICAgICAgICAgIHdoZW4gMyAjIEJpbmQgdG8gVGV4dFxuICAgICAgICAgICAgICAgIHRleHQgPSBzY2VuZS50ZXh0c1tAaW50ZXJwcmV0ZXIubnVtYmVyVmFsdWVPZihAcGFyYW1zLnRleHROdW1iZXIpXVxuICAgICAgICAgICAgICAgIGlmIHRleHQ/XG4gICAgICAgICAgICAgICAgICAgIGhvdHNwb3QudGFyZ2V0ID0gdGV4dFxuICAgICAgICBcbiAgICAgICAgaG90c3BvdC5iZWhhdmlvci5zaGFwZSA9IEBwYXJhbXMuc2hhcGUgPyBncy5Ib3RzcG90U2hhcGUuUkVDVEFOR0xFIFxuICAgICAgICBcbiAgICAgICAgaWYgdGV4dD9cbiAgICAgICAgICAgIGhvdHNwb3QuaW1hZ2VzID0gbnVsbFxuICAgICAgICBlbHNlXG4gICAgICAgICAgICBob3RzcG90LmltYWdlcyA9IFtcbiAgICAgICAgICAgICAgICBAcGFyYW1zLmJhc2VHcmFwaGljPy5uYW1lIHx8IEBpbnRlcnByZXRlci5zdHJpbmdWYWx1ZU9mKEBwYXJhbXMuYmFzZUdyYXBoaWMpIHx8IHBpY3R1cmU/LmltYWdlLFxuICAgICAgICAgICAgICAgIEBwYXJhbXMuaG92ZXJHcmFwaGljPy5uYW1lIHx8IEBpbnRlcnByZXRlci5zdHJpbmdWYWx1ZU9mKEBwYXJhbXMuaG92ZXJHcmFwaGljKSxcbiAgICAgICAgICAgICAgICBAcGFyYW1zLnNlbGVjdGVkR3JhcGhpYz8ubmFtZSB8fCBAaW50ZXJwcmV0ZXIuc3RyaW5nVmFsdWVPZihAcGFyYW1zLnNlbGVjdGVkR3JhcGhpYyksXG4gICAgICAgICAgICAgICAgQHBhcmFtcy5zZWxlY3RlZEhvdmVyR3JhcGhpYz8ubmFtZSB8fCBAaW50ZXJwcmV0ZXIuc3RyaW5nVmFsdWVPZihAcGFyYW1zLnNlbGVjdGVkSG92ZXJHcmFwaGljKSxcbiAgICAgICAgICAgICAgICBAcGFyYW1zLnVuc2VsZWN0ZWRHcmFwaGljPy5uYW1lIHx8IEBpbnRlcnByZXRlci5zdHJpbmdWYWx1ZU9mKEBwYXJhbXMudW5zZWxlY3RlZEdyYXBoaWMpXG4gICAgICAgICAgICBdXG4gICAgICAgIFxuICAgICAgICBcbiAgICAgICAgaWYgQHBhcmFtcy5hY3Rpb25zLm9uQ2xpY2sudHlwZSAhPSAwIG9yIEBwYXJhbXMuYWN0aW9ucy5vbkNsaWNrLmxhYmVsICAgICAgICBcbiAgICAgICAgICAgIGhvdHNwb3QuZXZlbnRzLm9uIFwiY2xpY2tcIiwgZ3MuQ2FsbEJhY2soXCJvbkhvdHNwb3RDbGlja1wiLCBAaW50ZXJwcmV0ZXIsIHsgcGFyYW1zOiBAcGFyYW1zLCBiaW5kVmFsdWU6IEBpbnRlcnByZXRlci5udW1iZXJWYWx1ZU9mKEBwYXJhbXMuYWN0aW9ucy5vbkNsaWNrLmJpbmRWYWx1ZSkgfSlcbiAgICAgICAgaWYgQHBhcmFtcy5hY3Rpb25zLm9uRW50ZXIudHlwZSAhPSAwIG9yIEBwYXJhbXMuYWN0aW9ucy5vbkVudGVyLmxhYmVsICAgICAgICBcbiAgICAgICAgICAgIGhvdHNwb3QuZXZlbnRzLm9uIFwiZW50ZXJcIiwgZ3MuQ2FsbEJhY2soXCJvbkhvdHNwb3RFbnRlclwiLCBAaW50ZXJwcmV0ZXIsIHsgcGFyYW1zOiBAcGFyYW1zLCBiaW5kVmFsdWU6IEBpbnRlcnByZXRlci5udW1iZXJWYWx1ZU9mKEBwYXJhbXMuYWN0aW9ucy5vbkVudGVyLmJpbmRWYWx1ZSkgfSlcbiAgICAgICAgaWYgQHBhcmFtcy5hY3Rpb25zLm9uTGVhdmUudHlwZSAhPSAwIG9yIEBwYXJhbXMuYWN0aW9ucy5vbkxlYXZlLmxhYmVsICAgICAgICBcbiAgICAgICAgICAgIGhvdHNwb3QuZXZlbnRzLm9uIFwibGVhdmVcIiwgZ3MuQ2FsbEJhY2soXCJvbkhvdHNwb3RMZWF2ZVwiLCBAaW50ZXJwcmV0ZXIsIHsgcGFyYW1zOiBAcGFyYW1zLCBiaW5kVmFsdWU6IEBpbnRlcnByZXRlci5udW1iZXJWYWx1ZU9mKEBwYXJhbXMuYWN0aW9ucy5vbkxlYXZlLmJpbmRWYWx1ZSkgfSlcbiAgICAgICAgaWYgQHBhcmFtcy5hY3Rpb25zLm9uRHJhZy50eXBlICE9IDAgb3IgQHBhcmFtcy5hY3Rpb25zLm9uRHJhZy5sYWJlbCAgICAgICAgXG4gICAgICAgICAgICBob3RzcG90LmV2ZW50cy5vbiBcImRyYWdTdGFydFwiLCBncy5DYWxsQmFjayhcIm9uSG90c3BvdERyYWdTdGFydFwiLCBAaW50ZXJwcmV0ZXIsIHsgcGFyYW1zOiBAcGFyYW1zLCBiaW5kVmFsdWU6IEBpbnRlcnByZXRlci5udW1iZXJWYWx1ZU9mKEBwYXJhbXMuYWN0aW9ucy5vbkRyYWcuYmluZFZhbHVlKSB9KVxuICAgICAgICAgICAgaG90c3BvdC5ldmVudHMub24gXCJkcmFnXCIsIGdzLkNhbGxCYWNrKFwib25Ib3RzcG90RHJhZ1wiLCBAaW50ZXJwcmV0ZXIsIHsgcGFyYW1zOiBAcGFyYW1zLCBiaW5kVmFsdWU6IEBpbnRlcnByZXRlci5udW1iZXJWYWx1ZU9mKEBwYXJhbXMuYWN0aW9ucy5vbkRyYWcuYmluZFZhbHVlKSB9KVxuICAgICAgICAgICAgaG90c3BvdC5ldmVudHMub24gXCJkcmFnRW5kXCIsIGdzLkNhbGxCYWNrKFwib25Ib3RzcG90RHJhZ0VuZFwiLCBAaW50ZXJwcmV0ZXIsIHsgcGFyYW1zOiBAcGFyYW1zLCBiaW5kVmFsdWU6IEBpbnRlcnByZXRlci5udW1iZXJWYWx1ZU9mKEBwYXJhbXMuYWN0aW9ucy5vbkRyYWcuYmluZFZhbHVlKSB9KVxuICAgICAgICBpZiBAcGFyYW1zLmFjdGlvbnMub25TZWxlY3QudHlwZSAhPSAwIG9yIEBwYXJhbXMuYWN0aW9ucy5vblNlbGVjdC5sYWJlbCBvclxuICAgICAgICAgICBAcGFyYW1zLmFjdGlvbnMub25EZXNlbGVjdC50eXBlICE9IDAgb3IgQHBhcmFtcy5hY3Rpb25zLm9uRGVzZWxlY3QubGFiZWwgICAgXG4gICAgICAgICAgICBob3RzcG90LmV2ZW50cy5vbiBcInN0YXRlQ2hhbmdlZFwiLCBncy5DYWxsQmFjayhcIm9uSG90c3BvdFN0YXRlQ2hhbmdlZFwiLCBAaW50ZXJwcmV0ZXIsIEBwYXJhbXMpXG4gICAgICAgICAgICAgICAgXG4gICAgICAgIGhvdHNwb3Quc2VsZWN0YWJsZSA9IHllc1xuICAgICAgICBob3RzcG90LnNldHVwKClcblxuICAgICAgICBpZiBAcGFyYW1zLmRyYWdnaW5nLmVuYWJsZWRcbiAgICAgICAgICAgIGRyYWdnaW5nID0gQHBhcmFtcy5kcmFnZ2luZ1xuICAgICAgICAgICAgaG90c3BvdC5kcmFnZ2FibGUgPSB7IFxuICAgICAgICAgICAgICAgIHJlY3Q6IG5ldyBSZWN0KGRyYWdnaW5nLnJlY3QueCwgZHJhZ2dpbmcucmVjdC55LCBkcmFnZ2luZy5yZWN0LnNpemUud2lkdGgsIGRyYWdnaW5nLnJlY3Quc2l6ZS5oZWlnaHQpLCBcbiAgICAgICAgICAgICAgICBheGlzWDogZHJhZ2dpbmcuaG9yaXpvbnRhbCwgXG4gICAgICAgICAgICAgICAgYXhpc1k6IGRyYWdnaW5nLnZlcnRpY2FsIFxuICAgICAgICAgICAgfVxuICAgICAgICAgICAgaG90c3BvdC5hZGRDb21wb25lbnQobmV3IHVpLkNvbXBvbmVudF9EcmFnZ2FibGUoKSlcbiAgICAgICAgICAgIGhvdHNwb3QuZXZlbnRzLm9uIFwiZHJhZ1wiLCAoZSkgPT4gXG4gICAgICAgICAgICAgICAgZHJhZyA9IGUuc2VuZGVyLmRyYWdnYWJsZVxuICAgICAgICAgICAgICAgIEdhbWVNYW5hZ2VyLnZhcmlhYmxlU3RvcmUuc2V0dXBUZW1wVmFyaWFibGVzKEBpbnRlcnByZXRlci5jb250ZXh0KVxuICAgICAgICAgICAgICAgIGlmIEBwYXJhbXMuZHJhZ2dpbmcuaG9yaXpvbnRhbFxuICAgICAgICAgICAgICAgICAgICBAaW50ZXJwcmV0ZXIuc2V0TnVtYmVyVmFsdWVUbyhAcGFyYW1zLmRyYWdnaW5nLnZhcmlhYmxlLCBNYXRoLnJvdW5kKChlLnNlbmRlci5kc3RSZWN0LngtZHJhZy5yZWN0LngpIC8gKGRyYWcucmVjdC53aWR0aC1lLnNlbmRlci5kc3RSZWN0LndpZHRoKSAqIDEwMCkpXG4gICAgICAgICAgICAgICAgZWxzZVxuICAgICAgICAgICAgICAgICAgICBAaW50ZXJwcmV0ZXIuc2V0TnVtYmVyVmFsdWVUbyhAcGFyYW1zLmRyYWdnaW5nLnZhcmlhYmxlLCBNYXRoLnJvdW5kKChlLnNlbmRlci5kc3RSZWN0LnktZHJhZy5yZWN0LnkpIC8gKGRyYWcucmVjdC5oZWlnaHQtZS5zZW5kZXIuZHN0UmVjdC5oZWlnaHQpICogMTAwKSlcbiAgICBcbiAgICAjIyMqXG4gICAgKiBAbWV0aG9kIGNvbW1hbmRDaGFuZ2VIb3RzcG90U3RhdGVcbiAgICAqIEBwcm90ZWN0ZWRcbiAgICAjIyMgICBcbiAgICBjb21tYW5kQ2hhbmdlSG90c3BvdFN0YXRlOiAtPlxuICAgICAgICBmbGFncyA9IEBwYXJhbXMuZmllbGRGbGFncyB8fCB7fVxuICAgICAgICBpc0xvY2tlZCA9IGdzLkNvbW1hbmRGaWVsZEZsYWdzLmlzTG9ja2VkXG4gICAgICAgIHNjZW5lID0gU2NlbmVNYW5hZ2VyLnNjZW5lXG4gICAgICAgIHNjZW5lLmJlaGF2aW9yLmNoYW5nZUhvdHNwb3REb21haW4oQHBhcmFtcy5udW1iZXJEb21haW4pXG4gICAgICAgIG51bWJlciA9IEBpbnRlcnByZXRlci5udW1iZXJWYWx1ZU9mKEBwYXJhbXMubnVtYmVyKVxuICAgICAgICBob3RzcG90ID0gc2NlbmUuaG90c3BvdHNbbnVtYmVyXVxuICAgICAgICByZXR1cm4gaWYgIWhvdHNwb3RcbiAgICAgICAgXG4gICAgICAgIGlmICFpc0xvY2tlZChmbGFncy5zZWxlY3RlZCkgdGhlbiBob3RzcG90LmJlaGF2aW9yLnNlbGVjdGVkID0gQGludGVycHJldGVyLmJvb2xlYW5WYWx1ZU9mKEBwYXJhbXMuc2VsZWN0ZWQpXG4gICAgICAgIGlmICFpc0xvY2tlZChmbGFncy5lbmFibGVkKSB0aGVuIGhvdHNwb3QuYmVoYXZpb3IuZW5hYmxlZCA9IEBpbnRlcnByZXRlci5ib29sZWFuVmFsdWVPZihAcGFyYW1zLmVuYWJsZWQpXG4gICAgICAgIFxuICAgICAgICBob3RzcG90LmJlaGF2aW9yLnVwZGF0ZUlucHV0KClcbiAgICAgICAgaG90c3BvdC5iZWhhdmlvci51cGRhdGVJbWFnZSgpXG4gICAgICAgIFxuICAgICMjIypcbiAgICAqIEBtZXRob2QgY29tbWFuZEVyYXNlSG90c3BvdFxuICAgICogQHByb3RlY3RlZFxuICAgICMjIyAgICAgIFxuICAgIGNvbW1hbmRFcmFzZUhvdHNwb3Q6IC0+XG4gICAgICAgIHNjZW5lID0gU2NlbmVNYW5hZ2VyLnNjZW5lXG4gICAgICAgIHNjZW5lLmJlaGF2aW9yLmNoYW5nZUhvdHNwb3REb21haW4oQHBhcmFtcy5udW1iZXJEb21haW4pXG4gICAgICAgIG51bWJlciA9IEBpbnRlcnByZXRlci5udW1iZXJWYWx1ZU9mKEBwYXJhbXMubnVtYmVyKVxuICAgICAgICBcbiAgICAgICAgaWYgc2NlbmUuaG90c3BvdHNbbnVtYmVyXT9cbiAgICAgICAgICAgIHNjZW5lLmhvdHNwb3RzW251bWJlcl0uZGlzcG9zZSgpXG4gICAgICAgICAgICBzY2VuZS5ob3RzcG90Q29udGFpbmVyLmVyYXNlT2JqZWN0KG51bWJlcilcbiAgICBcbiAgICAjIyMqXG4gICAgKiBAbWV0aG9kIGNvbW1hbmRDaGFuZ2VPYmplY3REb21haW5cbiAgICAqIEBwcm90ZWN0ZWRcbiAgICAjIyMgXG4gICAgY29tbWFuZENoYW5nZU9iamVjdERvbWFpbjogLT5cbiAgICAgICAgU2NlbmVNYW5hZ2VyLnNjZW5lLmJlaGF2aW9yLmNoYW5nZU9iamVjdERvbWFpbihAaW50ZXJwcmV0ZXIuc3RyaW5nVmFsdWVPZihAcGFyYW1zLmRvbWFpbikpXG4gICAgICAgIFxuICAgICMjIypcbiAgICAqIEBtZXRob2QgY29tbWFuZFBpY3R1cmVEZWZhdWx0c1xuICAgICogQHByb3RlY3RlZFxuICAgICMjIyAgICAgIFxuICAgIGNvbW1hbmRQaWN0dXJlRGVmYXVsdHM6IC0+XG4gICAgICAgIGRlZmF1bHRzID0gR2FtZU1hbmFnZXIuZGVmYXVsdHMucGljdHVyZVxuICAgICAgICBmbGFncyA9IEBwYXJhbXMuZmllbGRGbGFncyB8fCB7fVxuICAgICAgICBpc0xvY2tlZCA9IGdzLkNvbW1hbmRGaWVsZEZsYWdzLmlzTG9ja2VkXG4gICAgICAgIFxuICAgICAgICBpZiAhaXNMb2NrZWQoZmxhZ3MuYXBwZWFyRHVyYXRpb24pIHRoZW4gZGVmYXVsdHMuYXBwZWFyRHVyYXRpb24gPSBAaW50ZXJwcmV0ZXIuZHVyYXRpb25WYWx1ZU9mKEBwYXJhbXMuYXBwZWFyRHVyYXRpb24pXG4gICAgICAgIGlmICFpc0xvY2tlZChmbGFncy5kaXNhcHBlYXJEdXJhdGlvbikgdGhlbiBkZWZhdWx0cy5kaXNhcHBlYXJEdXJhdGlvbiA9IEBpbnRlcnByZXRlci5kdXJhdGlvblZhbHVlT2YoQHBhcmFtcy5kaXNhcHBlYXJEdXJhdGlvbilcbiAgICAgICAgaWYgIWlzTG9ja2VkKGZsYWdzLnpPcmRlcikgdGhlbiBkZWZhdWx0cy56T3JkZXIgPSBAaW50ZXJwcmV0ZXIubnVtYmVyVmFsdWVPZihAcGFyYW1zLnpPcmRlcilcbiAgICAgICAgaWYgIWlzTG9ja2VkKGZsYWdzW1wiYXBwZWFyRWFzaW5nLnR5cGVcIl0pIHRoZW4gZGVmYXVsdHMuYXBwZWFyRWFzaW5nID0gQHBhcmFtcy5hcHBlYXJFYXNpbmdcbiAgICAgICAgaWYgIWlzTG9ja2VkKGZsYWdzW1wiYXBwZWFyQW5pbWF0aW9uLnR5cGVcIl0pIHRoZW4gZGVmYXVsdHMuYXBwZWFyQW5pbWF0aW9uID0gQHBhcmFtcy5hcHBlYXJBbmltYXRpb25cbiAgICAgICAgaWYgIWlzTG9ja2VkKGZsYWdzW1wiZGlzYXBwZWFyRWFzaW5nLnR5cGVcIl0pIHRoZW4gZGVmYXVsdHMuZGlzYXBwZWFyRWFzaW5nID0gQHBhcmFtcy5kaXNhcHBlYXJFYXNpbmdcbiAgICAgICAgaWYgIWlzTG9ja2VkKGZsYWdzW1wiZGlzYXBwZWFyQW5pbWF0aW9uLnR5cGVcIl0pIHRoZW4gZGVmYXVsdHMuZGlzYXBwZWFyQW5pbWF0aW9uID0gQHBhcmFtcy5kaXNhcHBlYXJBbmltYXRpb25cbiAgICAgICAgaWYgIWlzTG9ja2VkKGZsYWdzW1wibW90aW9uQmx1ci5lbmFibGVkXCJdKSB0aGVuIGRlZmF1bHRzLm1vdGlvbkJsdXIgPSBAcGFyYW1zLm1vdGlvbkJsdXJcbiAgICAgICAgaWYgIWlzTG9ja2VkKGZsYWdzLm9yaWdpbikgdGhlbiBkZWZhdWx0cy5vcmlnaW4gPSBAcGFyYW1zLm9yaWdpblxuICAgIFxuICAgIFxuICAgIGNyZWF0ZVBpY3R1cmU6IChncmFwaGljLCBwYXJhbXMpIC0+XG4gICAgICAgIGdyYXBoaWMgPSBAc3RyaW5nVmFsdWVPZihncmFwaGljKVxuICAgICAgICBncmFwaGljTmFtZSA9IGlmIGdyYXBoaWM/Lm5hbWU/IHRoZW4gZ3JhcGhpYy5uYW1lIGVsc2UgZ3JhcGhpY1xuICAgICAgICBiaXRtYXAgPSBSZXNvdXJjZU1hbmFnZXIuZ2V0Qml0bWFwKFwiR3JhcGhpY3MvUGljdHVyZXMvI3tncmFwaGljTmFtZX1cIilcbiAgICAgICAgcmV0dXJuIG51bGwgaWYgYml0bWFwICYmICFiaXRtYXAubG9hZGVkXG4gICAgICAgIFxuICAgICAgICBkZWZhdWx0cyA9IEdhbWVNYW5hZ2VyLmRlZmF1bHRzLnBpY3R1cmVcbiAgICAgICAgZmxhZ3MgPSBwYXJhbXMuZmllbGRGbGFncyB8fCB7fVxuICAgICAgICBpc0xvY2tlZCA9IGdzLkNvbW1hbmRGaWVsZEZsYWdzLmlzTG9ja2VkXG4gICAgICAgIHNjZW5lID0gU2NlbmVNYW5hZ2VyLnNjZW5lXG4gICAgICAgIG51bWJlciA9IEBudW1iZXJWYWx1ZU9mKHBhcmFtcy5udW1iZXIpXG4gICAgICAgIHBpY3R1cmVzID0gc2NlbmUucGljdHVyZXNcbiAgICAgICAgaWYgbm90IHBpY3R1cmVzW251bWJlcl0/XG4gICAgICAgICAgICBwaWN0dXJlID0gbmV3IGdzLk9iamVjdF9QaWN0dXJlKG51bGwsIG51bGwsIHBhcmFtcy52aXN1YWw/LnR5cGUpXG4gICAgICAgICAgICBwaWN0dXJlLmRvbWFpbiA9IHBhcmFtcy5udW1iZXJEb21haW5cbiAgICAgICAgICAgIHBpY3R1cmVzW251bWJlcl0gPSBwaWN0dXJlXG4gICAgICAgICAgICBzd2l0Y2ggcGFyYW1zLnZpc3VhbD8udHlwZVxuICAgICAgICAgICAgICAgIHdoZW4gMVxuICAgICAgICAgICAgICAgICAgICBwaWN0dXJlLnZpc3VhbC5sb29waW5nLnZlcnRpY2FsID0geWVzXG4gICAgICAgICAgICAgICAgICAgIHBpY3R1cmUudmlzdWFsLmxvb3BpbmcuaG9yaXpvbnRhbCA9IHllc1xuICAgICAgICAgICAgICAgIHdoZW4gMlxuICAgICAgICAgICAgICAgICAgICBwaWN0dXJlLmZyYW1lVGhpY2tuZXNzID0gcGFyYW1zLnZpc3VhbC5mcmFtZS50aGlja25lc3NcbiAgICAgICAgICAgICAgICAgICAgcGljdHVyZS5mcmFtZUNvcm5lclNpemUgPSBwYXJhbXMudmlzdWFsLmZyYW1lLmNvcm5lclNpemVcbiAgICAgICAgICAgICAgICB3aGVuIDNcbiAgICAgICAgICAgICAgICAgICAgcGljdHVyZS52aXN1YWwub3JpZW50YXRpb24gPSBwYXJhbXMudmlzdWFsLnRocmVlUGFydEltYWdlLm9yaWVudGF0aW9uXG4gICAgICAgICAgICAgICAgd2hlbiA0XG4gICAgICAgICAgICAgICAgICAgIHBpY3R1cmUuY29sb3IgPSBncy5Db2xvci5mcm9tT2JqZWN0KHBhcmFtcy52aXN1YWwucXVhZC5jb2xvcilcbiAgICAgICAgICAgICAgICB3aGVuIDVcbiAgICAgICAgICAgICAgICAgICAgc25hcHNob3QgPSBHcmFwaGljcy5zbmFwc2hvdCgpXG4gICAgICAgICAgICAgICAgICAgICNSZXNvdXJjZU1hbmFnZXIuYWRkQ3VzdG9tQml0bWFwKHNuYXBzaG90KVxuICAgICAgICAgICAgICAgICAgICBwaWN0dXJlLmJpdG1hcCA9IHNuYXBzaG90XG4gICAgICAgICAgICAgICAgICAgIHBpY3R1cmUuZHN0UmVjdC53aWR0aCA9IHNuYXBzaG90LndpZHRoXG4gICAgICAgICAgICAgICAgICAgIHBpY3R1cmUuZHN0UmVjdC5oZWlnaHQgPSBzbmFwc2hvdC5oZWlnaHRcbiAgICAgICAgICAgICAgICAgICAgcGljdHVyZS5zcmNSZWN0LnNldCgwLCAwLCBzbmFwc2hvdC53aWR0aCwgc25hcHNob3QuaGVpZ2h0KVxuICAgICAgICAgICAgICAgICAgICBcbiAgICAgICAgICAgIFxuICAgICAgICB4ID0gQG51bWJlclZhbHVlT2YocGFyYW1zLnBvc2l0aW9uLngpXG4gICAgICAgIHkgPSBAbnVtYmVyVmFsdWVPZihwYXJhbXMucG9zaXRpb24ueSlcbiAgICAgICAgcGljdHVyZSA9IHBpY3R1cmVzW251bWJlcl1cbiAgICAgICAgXG4gICAgICAgIGlmICFwaWN0dXJlLmJpdG1hcFxuICAgICAgICAgICAgcGljdHVyZS5pbWFnZSA9IGdyYXBoaWNOYW1lXG4gICAgICAgIGVsc2VcbiAgICAgICAgICAgIHBpY3R1cmUuaW1hZ2UgPSBudWxsXG4gICAgXG4gICAgICAgIGJpdG1hcCA9IHBpY3R1cmUuYml0bWFwID8gUmVzb3VyY2VNYW5hZ2VyLmdldEJpdG1hcChcIkdyYXBoaWNzL1BpY3R1cmVzLyN7Z3JhcGhpY05hbWV9XCIpXG4gICAgICAgIGVhc2luZyA9IGlmICFpc0xvY2tlZChmbGFnc1tcImVhc2luZy50eXBlXCJdKSB0aGVuIGdzLkVhc2luZ3MuZnJvbVZhbHVlcyhAbnVtYmVyVmFsdWVPZihwYXJhbXMuZWFzaW5nLnR5cGUpLCBwYXJhbXMuZWFzaW5nLmluT3V0KSBlbHNlIGdzLkVhc2luZ3MuZnJvbU9iamVjdChkZWZhdWx0cy5hcHBlYXJFYXNpbmcpXG4gICAgICAgIGR1cmF0aW9uID0gaWYgIWlzTG9ja2VkKGZsYWdzLmR1cmF0aW9uKSB0aGVuIEBkdXJhdGlvblZhbHVlT2YocGFyYW1zLmR1cmF0aW9uKSBlbHNlIGRlZmF1bHRzLmFwcGVhckR1cmF0aW9uXG4gICAgICAgIG9yaWdpbiA9IGlmICFpc0xvY2tlZChmbGFncy5vcmlnaW4pIHRoZW4gcGFyYW1zLm9yaWdpbiBlbHNlIGRlZmF1bHRzLm9yaWdpblxuICAgICAgICB6SW5kZXggPSBpZiAhaXNMb2NrZWQoZmxhZ3Muek9yZGVyKSB0aGVuIEBudW1iZXJWYWx1ZU9mKHBhcmFtcy56T3JkZXIpIGVsc2UgZGVmYXVsdHMuek9yZGVyXG4gICAgICAgIGFuaW1hdGlvbiA9IGlmICFpc0xvY2tlZChmbGFnc1tcImFuaW1hdGlvbi50eXBlXCJdKSB0aGVuIHBhcmFtcy5hbmltYXRpb24gZWxzZSBkZWZhdWx0cy5hcHBlYXJBbmltYXRpb25cbiAgICBcbiAgICAgICAgcGljdHVyZS5taXJyb3IgPSBwYXJhbXMucG9zaXRpb24uaG9yaXpvbnRhbEZsaXBcbiAgICAgICAgcGljdHVyZS5hbmdsZSA9IHBhcmFtcy5wb3NpdGlvbi5hbmdsZSB8fCAwXG4gICAgICAgIHBpY3R1cmUuem9vbS54ID0gKHBhcmFtcy5wb3NpdGlvbi5kYXRhPy56b29tfHwxKVxuICAgICAgICBwaWN0dXJlLnpvb20ueSA9IChwYXJhbXMucG9zaXRpb24uZGF0YT8uem9vbXx8MSlcbiAgICAgICAgcGljdHVyZS5ibGVuZE1vZGUgPSBAbnVtYmVyVmFsdWVPZihwYXJhbXMuYmxlbmRNb2RlKVxuICAgICAgICBcbiAgICAgICAgaWYgcGFyYW1zLm9yaWdpbiA9PSAxIGFuZCBiaXRtYXA/XG4gICAgICAgICAgICB4ICs9IChiaXRtYXAud2lkdGgqcGljdHVyZS56b29tLngtYml0bWFwLndpZHRoKS8yXG4gICAgICAgICAgICB5ICs9IChiaXRtYXAuaGVpZ2h0KnBpY3R1cmUuem9vbS55LWJpdG1hcC5oZWlnaHQpLzJcbiAgICAgICAgICAgIFxuICAgICAgICBwaWN0dXJlLmRzdFJlY3QueCA9IHhcbiAgICAgICAgcGljdHVyZS5kc3RSZWN0LnkgPSB5XG4gICAgICAgIHBpY3R1cmUuYW5jaG9yLnggPSBpZiBvcmlnaW4gPT0gMSB0aGVuIDAuNSBlbHNlIDBcbiAgICAgICAgcGljdHVyZS5hbmNob3IueSA9IGlmIG9yaWdpbiA9PSAxIHRoZW4gMC41IGVsc2UgMFxuICAgICAgICBwaWN0dXJlLnpJbmRleCA9IHpJbmRleCB8fCAgKDcwMCArIG51bWJlcilcbiAgICAgICAgXG4gICAgICAgIGlmIHBhcmFtcy52aWV3cG9ydD8udHlwZSA9PSBcInNjZW5lXCJcbiAgICAgICAgICAgIHBpY3R1cmUudmlld3BvcnQgPSBTY2VuZU1hbmFnZXIuc2NlbmUuYmVoYXZpb3Iudmlld3BvcnRcbiAgICAgICAgXG4gICAgICAgIGlmIHBhcmFtcy5zaXplPy50eXBlID09IDFcbiAgICAgICAgICAgIHBpY3R1cmUuZHN0UmVjdC53aWR0aCA9IEBudW1iZXJWYWx1ZU9mKHBhcmFtcy5zaXplLndpZHRoKVxuICAgICAgICAgICAgcGljdHVyZS5kc3RSZWN0LmhlaWdodCA9IEBudW1iZXJWYWx1ZU9mKHBhcmFtcy5zaXplLmhlaWdodClcbiAgICAgICAgICAgIFxuICAgICAgICBwaWN0dXJlLnVwZGF0ZSgpXG4gICAgICAgIFxuICAgICAgICByZXR1cm4gcGljdHVyZVxuICAgICMjIypcbiAgICAqIEBtZXRob2QgY29tbWFuZFNob3dQaWN0dXJlXG4gICAgKiBAcHJvdGVjdGVkXG4gICAgIyMjICAgIFxuICAgIGNvbW1hbmRTaG93UGljdHVyZTogLT4gXG4gICAgICAgIFNjZW5lTWFuYWdlci5zY2VuZS5iZWhhdmlvci5jaGFuZ2VQaWN0dXJlRG9tYWluKEBwYXJhbXMubnVtYmVyRG9tYWluIHx8IFwiXCIpXG4gICAgICAgIGRlZmF1bHRzID0gR2FtZU1hbmFnZXIuZGVmYXVsdHMucGljdHVyZVxuICAgICAgICBmbGFncyA9IEBwYXJhbXMuZmllbGRGbGFncyB8fCB7fVxuICAgICAgICBpc0xvY2tlZCA9IGdzLkNvbW1hbmRGaWVsZEZsYWdzLmlzTG9ja2VkXG4gICAgICAgIHBpY3R1cmUgPSBAaW50ZXJwcmV0ZXIuY3JlYXRlUGljdHVyZShAcGFyYW1zLmdyYXBoaWMsIEBwYXJhbXMpXG4gICAgICAgIGlmICFwaWN0dXJlXG4gICAgICAgICAgICBAaW50ZXJwcmV0ZXIucG9pbnRlci0tXG4gICAgICAgICAgICBAaW50ZXJwcmV0ZXIuaXNXYWl0aW5nID0geWVzXG4gICAgICAgICAgICBAaW50ZXJwcmV0ZXIud2FpdENvdW50ZXIgPSAxXG4gICAgICAgICAgICByZXR1cm5cbiAgICAgICAgXG4gICAgICAgIGlmIEBwYXJhbXMucG9zaXRpb25UeXBlID09IDBcbiAgICAgICAgICAgIHAgPSBAaW50ZXJwcmV0ZXIucHJlZGVmaW5lZE9iamVjdFBvc2l0aW9uKEBwYXJhbXMucHJlZGVmaW5lZFBvc2l0aW9uSWQsIHBpY3R1cmUsIEBwYXJhbXMpXG4gICAgICAgICAgICBwaWN0dXJlLmRzdFJlY3QueCA9IHAueFxuICAgICAgICAgICAgcGljdHVyZS5kc3RSZWN0LnkgPSBwLnlcbiAgICAgICAgICAgIFxuICAgICAgICBlYXNpbmcgPSBpZiAhaXNMb2NrZWQoZmxhZ3NbXCJlYXNpbmcudHlwZVwiXSkgdGhlbiBncy5FYXNpbmdzLmZyb21WYWx1ZXMoQGludGVycHJldGVyLm51bWJlclZhbHVlT2YoQHBhcmFtcy5lYXNpbmcudHlwZSksIEBwYXJhbXMuZWFzaW5nLmluT3V0KSBlbHNlIGdzLkVhc2luZ3MuZnJvbU9iamVjdChkZWZhdWx0cy5hcHBlYXJFYXNpbmcpXG4gICAgICAgIGR1cmF0aW9uID0gaWYgIWlzTG9ja2VkKGZsYWdzLmR1cmF0aW9uKSB0aGVuIEBpbnRlcnByZXRlci5kdXJhdGlvblZhbHVlT2YoQHBhcmFtcy5kdXJhdGlvbikgZWxzZSBkZWZhdWx0cy5hcHBlYXJEdXJhdGlvblxuICAgICAgICBhbmltYXRpb24gPSBpZiAhaXNMb2NrZWQoZmxhZ3NbXCJhbmltYXRpb24udHlwZVwiXSkgdGhlbiBAcGFyYW1zLmFuaW1hdGlvbiBlbHNlIGRlZmF1bHRzLmFwcGVhckFuaW1hdGlvblxuICAgIFxuICAgICAgICBwaWN0dXJlLmFuaW1hdG9yLmFwcGVhcihwaWN0dXJlLmRzdFJlY3QueCwgcGljdHVyZS5kc3RSZWN0LnksIGFuaW1hdGlvbiwgZWFzaW5nLCBkdXJhdGlvbilcbiAgICAgICAgXG4gICAgICAgIGlmIEBwYXJhbXMud2FpdEZvckNvbXBsZXRpb24gYW5kIG5vdCAoZHVyYXRpb24gPT0gMCBvciBAaW50ZXJwcmV0ZXIuaXNJbnN0YW50U2tpcCgpKVxuICAgICAgICAgICAgQGludGVycHJldGVyLmlzV2FpdGluZyA9IHllc1xuICAgICAgICAgICAgQGludGVycHJldGVyLndhaXRDb3VudGVyID0gZHVyYXRpb25cbiAgICAgICAgICAgIFxuICAgICAgICBncy5HYW1lTm90aWZpZXIucG9zdE1pbm9yQ2hhbmdlKClcbiAgICBcbiAgICAjIyMqXG4gICAgKiBAbWV0aG9kIGNvbW1hbmRQbGF5UGljdHVyZUFuaW1hdGlvblxuICAgICogQHByb3RlY3RlZFxuICAgICMjIyBcbiAgICBjb21tYW5kUGxheVBpY3R1cmVBbmltYXRpb246IC0+XG4gICAgICAgIFNjZW5lTWFuYWdlci5zY2VuZS5iZWhhdmlvci5jaGFuZ2VQaWN0dXJlRG9tYWluKEBwYXJhbXMubnVtYmVyRG9tYWluIHx8IFwiXCIpXG4gICAgICAgIFxuICAgICAgICBkZWZhdWx0cyA9IEdhbWVNYW5hZ2VyLmRlZmF1bHRzLnBpY3R1cmVcbiAgICAgICAgZmxhZ3MgPSBAcGFyYW1zLmZpZWxkRmxhZ3MgfHwge31cbiAgICAgICAgaXNMb2NrZWQgPSBncy5Db21tYW5kRmllbGRGbGFncy5pc0xvY2tlZFxuICAgICAgICBwaWN0dXJlID0gbnVsbFxuICAgICAgICBcbiAgICAgICAgZWFzaW5nID0gaWYgIWlzTG9ja2VkKGZsYWdzW1wiZWFzaW5nLnR5cGVcIl0pIHRoZW4gZ3MuRWFzaW5ncy5mcm9tVmFsdWVzKEBpbnRlcnByZXRlci5udW1iZXJWYWx1ZU9mKEBwYXJhbXMuZWFzaW5nLnR5cGUpLCBAcGFyYW1zLmVhc2luZy5pbk91dCkgZWxzZSBncy5FYXNpbmdzLmZyb21PYmplY3QoZGVmYXVsdHMuYXBwZWFyRWFzaW5nKVxuICAgICAgICBkdXJhdGlvbiA9IGlmICFpc0xvY2tlZChmbGFncy5kdXJhdGlvbikgdGhlbiBAaW50ZXJwcmV0ZXIuZHVyYXRpb25WYWx1ZU9mKEBwYXJhbXMuZHVyYXRpb24pIGVsc2UgZGVmYXVsdHMuYXBwZWFyRHVyYXRpb25cbiAgICAgICAgYW5pbWF0aW9uID0gaWYgIWlzTG9ja2VkKGZsYWdzW1wiYW5pbWF0aW9uLnR5cGVcIl0pIHRoZW4gQHBhcmFtcy5hbmltYXRpb24gZWxzZSBkZWZhdWx0cy5hcHBlYXJBbmltYXRpb25cbiAgICAgICAgXG4gICAgICAgIGlmIEBwYXJhbXMuYW5pbWF0aW9uSWQ/XG4gICAgICAgICAgICByZWNvcmQgPSBSZWNvcmRNYW5hZ2VyLmFuaW1hdGlvbnNbQHBhcmFtcy5hbmltYXRpb25JZF1cbiAgICAgICAgICAgIGlmIHJlY29yZD9cbiAgICAgICAgICAgICAgICBwaWN0dXJlID0gQGludGVycHJldGVyLmNyZWF0ZVBpY3R1cmUocmVjb3JkLmdyYXBoaWMsIEBwYXJhbXMpXG4gICAgICAgICAgICAgICAgXG4gICAgICAgICAgICAgICAgY29tcG9uZW50ID0gcGljdHVyZS5maW5kQ29tcG9uZW50KFwiQ29tcG9uZW50X0ZyYW1lQW5pbWF0aW9uXCIpXG4gICAgICAgICAgICAgICAgaWYgY29tcG9uZW50P1xuICAgICAgICAgICAgICAgICAgICBjb21wb25lbnQucmVmcmVzaChyZWNvcmQpXG4gICAgICAgICAgICAgICAgICAgIGNvbXBvbmVudC5zdGFydCgpXG4gICAgICAgICAgICAgICAgZWxzZVxuICAgICAgICAgICAgICAgICAgICBjb21wb25lbnQgPSBuZXcgZ3MuQ29tcG9uZW50X0ZyYW1lQW5pbWF0aW9uKHJlY29yZClcbiAgICAgICAgICAgICAgICAgICAgcGljdHVyZS5hZGRDb21wb25lbnQoY29tcG9uZW50KVxuICAgICAgICAgICAgICAgICAgICBcbiAgICAgICAgICAgICAgICBjb21wb25lbnQudXBkYXRlKClcbiAgICAgICAgICAgICAgICBcbiAgICAgICAgICAgICAgICBpZiBAcGFyYW1zLnBvc2l0aW9uVHlwZSA9PSAwXG4gICAgICAgICAgICAgICAgICAgIHAgPSBAaW50ZXJwcmV0ZXIucHJlZGVmaW5lZE9iamVjdFBvc2l0aW9uKEBwYXJhbXMucHJlZGVmaW5lZFBvc2l0aW9uSWQsIHBpY3R1cmUsIEBwYXJhbXMpXG4gICAgICAgICAgICAgICAgICAgIHBpY3R1cmUuZHN0UmVjdC54ID0gcC54XG4gICAgICAgICAgICAgICAgICAgIHBpY3R1cmUuZHN0UmVjdC55ID0gcC55XG4gICAgICAgICAgICAgICAgICAgIFxuICAgICAgICAgICAgICAgIHBpY3R1cmUuYW5pbWF0b3IuYXBwZWFyKHBpY3R1cmUuZHN0UmVjdC54LCBwaWN0dXJlLmRzdFJlY3QueSwgYW5pbWF0aW9uLCBlYXNpbmcsIGR1cmF0aW9uKVxuICAgICAgICAgICAgICAgIFxuICAgICAgICBlbHNlXG4gICAgICAgICAgICBwaWN0dXJlID0gU2NlbmVNYW5hZ2VyLnNjZW5lLnBpY3R1cmVzW0BpbnRlcnByZXRlci5udW1iZXJWYWx1ZU9mKEBwYXJhbXMubnVtYmVyKV1cbiAgICAgICAgICAgIGFuaW1hdGlvbiA9IHBpY3R1cmU/LmZpbmRDb21wb25lbnQoXCJDb21wb25lbnRfRnJhbWVBbmltYXRpb25cIilcbiAgICAgICAgICAgIFxuICAgICAgICAgICAgaWYgYW5pbWF0aW9uP1xuICAgICAgICAgICAgICAgIHBpY3R1cmUucmVtb3ZlQ29tcG9uZW50KGFuaW1hdGlvbilcbiAgICAgICAgICAgICAgICBiaXRtYXAgPSBSZXNvdXJjZU1hbmFnZXIuZ2V0Qml0bWFwKFwiR3JhcGhpY3MvQW5pbWF0aW9ucy8je3BpY3R1cmUuaW1hZ2V9XCIpXG4gICAgICAgICAgICAgICAgaWYgYml0bWFwP1xuICAgICAgICAgICAgICAgICAgICBwaWN0dXJlLnNyY1JlY3Quc2V0KDAsIDAsIGJpdG1hcC53aWR0aCwgYml0bWFwLmhlaWdodClcbiAgICAgICAgICAgICAgICAgICAgcGljdHVyZS5kc3RSZWN0LndpZHRoID0gcGljdHVyZS5zcmNSZWN0LndpZHRoXG4gICAgICAgICAgICAgICAgICAgIHBpY3R1cmUuZHN0UmVjdC5oZWlnaHQgPSBwaWN0dXJlLnNyY1JlY3QuaGVpZ2h0XG4gICAgICAgIFxuICAgICAgICBpZiBAcGFyYW1zLndhaXRGb3JDb21wbGV0aW9uIGFuZCBub3QgKGR1cmF0aW9uID09IDAgb3IgQGludGVycHJldGVyLmlzSW5zdGFudFNraXAoKSlcbiAgICAgICAgICAgIEBpbnRlcnByZXRlci5pc1dhaXRpbmcgPSB5ZXNcbiAgICAgICAgICAgIEBpbnRlcnByZXRlci53YWl0Q291bnRlciA9IGR1cmF0aW9uXG4gICAgICAgICAgICBcbiAgICAgICAgZ3MuR2FtZU5vdGlmaWVyLnBvc3RNaW5vckNoYW5nZSgpXG4gICAgICAgICAgICBcbiAgICAjIyMqXG4gICAgKiBAbWV0aG9kIGNvbW1hbmRNb3ZlUGljdHVyZVBhdGhcbiAgICAqIEBwcm90ZWN0ZWRcbiAgICAjIyMgICAgICAgICBcbiAgICBjb21tYW5kTW92ZVBpY3R1cmVQYXRoOiAtPlxuICAgICAgICBzY2VuZSA9IFNjZW5lTWFuYWdlci5zY2VuZVxuICAgICAgICBzY2VuZS5iZWhhdmlvci5jaGFuZ2VQaWN0dXJlRG9tYWluKEBwYXJhbXMubnVtYmVyRG9tYWluKVxuICAgICAgICBudW1iZXIgPSBAaW50ZXJwcmV0ZXIubnVtYmVyVmFsdWVPZihAcGFyYW1zLm51bWJlcilcbiAgICAgICAgcGljdHVyZSA9IHNjZW5lLnBpY3R1cmVzW251bWJlcl1cbiAgICAgICAgaWYgbm90IHBpY3R1cmU/IHRoZW4gcmV0dXJuXG4gICAgICAgIFxuICAgICAgICBAaW50ZXJwcmV0ZXIubW92ZU9iamVjdFBhdGgocGljdHVyZSwgQHBhcmFtcy5wYXRoLCBAcGFyYW1zKVxuICAgICAgICBcbiAgICAgICAgZ3MuR2FtZU5vdGlmaWVyLnBvc3RNaW5vckNoYW5nZSgpXG4gICAgXG4gICAgIyMjKlxuICAgICogQG1ldGhvZCBjb21tYW5kTW92ZVBpY3R1cmVcbiAgICAqIEBwcm90ZWN0ZWRcbiAgICAjIyMgICAgIFxuICAgIGNvbW1hbmRNb3ZlUGljdHVyZTogLT5cbiAgICAgICAgc2NlbmUgPSBTY2VuZU1hbmFnZXIuc2NlbmVcbiAgICAgICAgc2NlbmUuYmVoYXZpb3IuY2hhbmdlUGljdHVyZURvbWFpbihAcGFyYW1zLm51bWJlckRvbWFpbilcbiAgICAgICAgbnVtYmVyID0gQGludGVycHJldGVyLm51bWJlclZhbHVlT2YoQHBhcmFtcy5udW1iZXIpXG4gICAgICAgIHBpY3R1cmUgPSBzY2VuZS5waWN0dXJlc1tudW1iZXJdXG4gICAgICAgIGlmIG5vdCBwaWN0dXJlPyB0aGVuIHJldHVyblxuICAgICAgICBcbiAgICAgICAgQGludGVycHJldGVyLm1vdmVPYmplY3QocGljdHVyZSwgQHBhcmFtcy5waWN0dXJlLnBvc2l0aW9uLCBAcGFyYW1zKVxuICAgICAgICBcbiAgICAgICAgZ3MuR2FtZU5vdGlmaWVyLnBvc3RNaW5vckNoYW5nZSgpXG4gICAgICAgXG5cbiAgICAjIyMqXG4gICAgKiBAbWV0aG9kIGNvbW1hbmRUaW50UGljdHVyZVxuICAgICogQHByb3RlY3RlZFxuICAgICMjIyAgICAgICAgXG4gICAgY29tbWFuZFRpbnRQaWN0dXJlOiAtPlxuICAgICAgICBzY2VuZSA9IFNjZW5lTWFuYWdlci5zY2VuZVxuICAgICAgICBzY2VuZS5iZWhhdmlvci5jaGFuZ2VQaWN0dXJlRG9tYWluKEBwYXJhbXMubnVtYmVyRG9tYWluIHx8IFwiXCIpXG4gICAgICAgIG51bWJlciA9IEBpbnRlcnByZXRlci5udW1iZXJWYWx1ZU9mKEBwYXJhbXMubnVtYmVyKVxuICAgICAgICBwaWN0dXJlID0gc2NlbmUucGljdHVyZXNbbnVtYmVyXVxuICAgICAgICBpZiBub3QgcGljdHVyZT8gdGhlbiByZXR1cm5cbiAgICAgICAgXG4gICAgICAgIEBpbnRlcnByZXRlci50aW50T2JqZWN0KHBpY3R1cmUsIEBwYXJhbXMpXG4gICAgICAgIFxuICAgICAgICBncy5HYW1lTm90aWZpZXIucG9zdE1pbm9yQ2hhbmdlKClcbiAgICBcbiAgICAjIyMqXG4gICAgKiBAbWV0aG9kIGNvbW1hbmRGbGFzaFBpY3R1cmVcbiAgICAqIEBwcm90ZWN0ZWRcbiAgICAjIyMgXG4gICAgY29tbWFuZEZsYXNoUGljdHVyZTogLT5cbiAgICAgICAgc2NlbmUgPSBTY2VuZU1hbmFnZXIuc2NlbmVcbiAgICAgICAgc2NlbmUuYmVoYXZpb3IuY2hhbmdlUGljdHVyZURvbWFpbihAcGFyYW1zLm51bWJlckRvbWFpbiB8fCBcIlwiKVxuICAgICAgICBudW1iZXIgPSBAaW50ZXJwcmV0ZXIubnVtYmVyVmFsdWVPZihAcGFyYW1zLm51bWJlcilcbiAgICAgICAgcGljdHVyZSA9IHNjZW5lLnBpY3R1cmVzW251bWJlcl1cbiAgICAgICAgaWYgbm90IHBpY3R1cmU/IHRoZW4gcmV0dXJuXG4gICAgICAgIFxuICAgICAgICBAaW50ZXJwcmV0ZXIuZmxhc2hPYmplY3QocGljdHVyZSwgQHBhcmFtcylcbiAgICAgICBcbiAgICAgICAgZ3MuR2FtZU5vdGlmaWVyLnBvc3RNaW5vckNoYW5nZSgpXG4gICAgXG4gICAgIyMjKlxuICAgICogQG1ldGhvZCBjb21tYW5kQ3JvcFBpY3R1cmVcbiAgICAqIEBwcm90ZWN0ZWRcbiAgICAjIyMgICAgICAgICBcbiAgICBjb21tYW5kQ3JvcFBpY3R1cmU6IC0+XG4gICAgICAgIHNjZW5lID0gU2NlbmVNYW5hZ2VyLnNjZW5lXG4gICAgICAgIHNjZW5lLmJlaGF2aW9yLmNoYW5nZVBpY3R1cmVEb21haW4oQHBhcmFtcy5udW1iZXJEb21haW4gfHwgXCJcIilcbiAgICAgICAgbnVtYmVyID0gQGludGVycHJldGVyLm51bWJlclZhbHVlT2YoQHBhcmFtcy5udW1iZXIpXG4gICAgICAgIHBpY3R1cmUgPSBzY2VuZS5waWN0dXJlc1tudW1iZXJdXG4gICAgICAgIGlmIG5vdCBwaWN0dXJlPyB0aGVuIHJldHVyblxuICAgICAgICBcbiAgICAgICAgQGludGVycHJldGVyLmNyb3BPYmplY3QocGljdHVyZSwgQHBhcmFtcylcbiAgICAgICAgXG4gICAgIyMjKlxuICAgICogQG1ldGhvZCBjb21tYW5kUm90YXRlUGljdHVyZVxuICAgICogQHByb3RlY3RlZFxuICAgICMjIyAgICAgICAgXG4gICAgY29tbWFuZFJvdGF0ZVBpY3R1cmU6IC0+XG4gICAgICAgIHNjZW5lID0gU2NlbmVNYW5hZ2VyLnNjZW5lXG4gICAgICAgIHNjZW5lLmJlaGF2aW9yLmNoYW5nZVBpY3R1cmVEb21haW4oQHBhcmFtcy5udW1iZXJEb21haW4gfHwgXCJcIilcbiAgICAgICAgbnVtYmVyID0gQGludGVycHJldGVyLm51bWJlclZhbHVlT2YoQHBhcmFtcy5udW1iZXIpXG4gICAgICAgIHBpY3R1cmUgPSBzY2VuZS5waWN0dXJlc1tudW1iZXJdXG4gICAgICAgIGlmIG5vdCBwaWN0dXJlPyB0aGVuIHJldHVyblxuICAgICAgICBcbiAgICAgICAgQGludGVycHJldGVyLnJvdGF0ZU9iamVjdChwaWN0dXJlLCBAcGFyYW1zKVxuICAgICAgICBcbiAgICAgICAgZ3MuR2FtZU5vdGlmaWVyLnBvc3RNaW5vckNoYW5nZSgpXG4gICAgXG4gICAgIyMjKlxuICAgICogQG1ldGhvZCBjb21tYW5kWm9vbVBpY3R1cmVcbiAgICAqIEBwcm90ZWN0ZWRcbiAgICAjIyMgICAgICAgICBcbiAgICBjb21tYW5kWm9vbVBpY3R1cmU6IC0+XG4gICAgICAgIHNjZW5lID0gU2NlbmVNYW5hZ2VyLnNjZW5lXG4gICAgICAgIHNjZW5lLmJlaGF2aW9yLmNoYW5nZVBpY3R1cmVEb21haW4oQHBhcmFtcy5udW1iZXJEb21haW4gfHwgXCJcIilcbiAgICAgICAgbnVtYmVyID0gQGludGVycHJldGVyLm51bWJlclZhbHVlT2YoQHBhcmFtcy5udW1iZXIpXG4gICAgICAgIHBpY3R1cmUgPSBzY2VuZS5waWN0dXJlc1tudW1iZXJdXG4gICAgICAgIGlmIG5vdCBwaWN0dXJlPyB0aGVuIHJldHVyblxuICAgICAgICBcbiAgICAgICAgQGludGVycHJldGVyLnpvb21PYmplY3QocGljdHVyZSwgQHBhcmFtcylcblxuICAgICAgICBncy5HYW1lTm90aWZpZXIucG9zdE1pbm9yQ2hhbmdlKClcbiAgICBcbiAgICAjIyMqXG4gICAgKiBAbWV0aG9kIGNvbW1hbmRCbGVuZFBpY3R1cmVcbiAgICAqIEBwcm90ZWN0ZWRcbiAgICAjIyNcbiAgICBjb21tYW5kQmxlbmRQaWN0dXJlOiAtPlxuICAgICAgICBTY2VuZU1hbmFnZXIuc2NlbmUuYmVoYXZpb3IuY2hhbmdlUGljdHVyZURvbWFpbihAcGFyYW1zLm51bWJlckRvbWFpbiB8fCBcIlwiKVxuICAgICAgICBwaWN0dXJlID0gU2NlbmVNYW5hZ2VyLnNjZW5lLnBpY3R1cmVzW0BpbnRlcnByZXRlci5udW1iZXJWYWx1ZU9mKEBwYXJhbXMubnVtYmVyKV1cbiAgICAgICAgaWYgbm90IHBpY3R1cmU/IHRoZW4gcmV0dXJuXG4gICAgICAgIFxuICAgICAgICBAaW50ZXJwcmV0ZXIuYmxlbmRPYmplY3QocGljdHVyZSwgQHBhcmFtcykgXG4gICAgICAgIGdzLkdhbWVOb3RpZmllci5wb3N0TWlub3JDaGFuZ2UoKVxuICAgICAgICBcbiAgICAjIyMqXG4gICAgKiBAbWV0aG9kIGNvbW1hbmRTaGFrZVBpY3R1cmVcbiAgICAqIEBwcm90ZWN0ZWRcbiAgICAjIyNcbiAgICBjb21tYW5kU2hha2VQaWN0dXJlOiAtPiBcbiAgICAgICAgcGljdHVyZSA9IFNjZW5lTWFuYWdlci5zY2VuZS5waWN0dXJlc1tAaW50ZXJwcmV0ZXIubnVtYmVyVmFsdWVPZihAcGFyYW1zLm51bWJlcildXG4gICAgICAgIGlmIG5vdCBwaWN0dXJlPyB0aGVuIHJldHVyblxuICAgICAgICBcbiAgICAgICAgQGludGVycHJldGVyLnNoYWtlT2JqZWN0KHBpY3R1cmUsIEBwYXJhbXMpICBcbiAgICAgICAgZ3MuR2FtZU5vdGlmaWVyLnBvc3RNaW5vckNoYW5nZSgpXG4gICAgXG4gICAgIyMjKlxuICAgICogQG1ldGhvZCBjb21tYW5kTWFza1BpY3R1cmVcbiAgICAqIEBwcm90ZWN0ZWRcbiAgICAjIyMgICAgXG4gICAgY29tbWFuZE1hc2tQaWN0dXJlOiAtPlxuICAgICAgICBzY2VuZSA9IFNjZW5lTWFuYWdlci5zY2VuZVxuICAgICAgICBzY2VuZS5iZWhhdmlvci5jaGFuZ2VQaWN0dXJlRG9tYWluKEBwYXJhbXMubnVtYmVyRG9tYWluIHx8IFwiXCIpXG4gICAgICAgIG51bWJlciA9IEBpbnRlcnByZXRlci5udW1iZXJWYWx1ZU9mKEBwYXJhbXMubnVtYmVyKVxuICAgICAgICBwaWN0dXJlID0gc2NlbmUucGljdHVyZXNbbnVtYmVyXVxuICAgICAgICBpZiBub3QgcGljdHVyZT8gdGhlbiByZXR1cm5cbiAgICAgICAgXG4gICAgICAgIEBpbnRlcnByZXRlci5tYXNrT2JqZWN0KHBpY3R1cmUsIEBwYXJhbXMpXG4gICAgICAgIGdzLkdhbWVOb3RpZmllci5wb3N0TWlub3JDaGFuZ2UoKVxuICAgIFxuICAgIFxuICAgICMjIypcbiAgICAqIEBtZXRob2QgY29tbWFuZFBpY3R1cmVNb3Rpb25CbHVyXG4gICAgKiBAcHJvdGVjdGVkXG4gICAgIyMjICAgICAgICAgXG4gICAgY29tbWFuZFBpY3R1cmVNb3Rpb25CbHVyOiAtPlxuICAgICAgICBzY2VuZSA9IFNjZW5lTWFuYWdlci5zY2VuZVxuICAgICAgICBzY2VuZS5iZWhhdmlvci5jaGFuZ2VQaWN0dXJlRG9tYWluKEBwYXJhbXMubnVtYmVyRG9tYWluIHx8IFwiXCIpXG4gICAgICAgIG51bWJlciA9IEBpbnRlcnByZXRlci5udW1iZXJWYWx1ZU9mKEBwYXJhbXMubnVtYmVyKVxuICAgICAgICBwaWN0dXJlID0gc2NlbmUucGljdHVyZXNbbnVtYmVyXVxuICAgICAgICBpZiBub3QgcGljdHVyZT8gdGhlbiByZXR1cm5cbiAgICAgICAgXG4gICAgICAgIEBpbnRlcnByZXRlci5vYmplY3RNb3Rpb25CbHVyKHBpY3R1cmUsIEBwYXJhbXMpXG4gICAgICAgIFxuICAgICAgICBncy5HYW1lTm90aWZpZXIucG9zdE1pbm9yQ2hhbmdlKClcbiAgICBcbiAgICAjIyMqXG4gICAgKiBAbWV0aG9kIGNvbW1hbmRQaWN0dXJlRWZmZWN0XG4gICAgKiBAcHJvdGVjdGVkXG4gICAgIyMjICAgIFxuICAgIGNvbW1hbmRQaWN0dXJlRWZmZWN0OiAtPlxuICAgICAgICBzY2VuZSA9IFNjZW5lTWFuYWdlci5zY2VuZVxuICAgICAgICBzY2VuZS5iZWhhdmlvci5jaGFuZ2VQaWN0dXJlRG9tYWluKEBwYXJhbXMubnVtYmVyRG9tYWluIHx8IFwiXCIpXG4gICAgICAgIG51bWJlciA9IEBpbnRlcnByZXRlci5udW1iZXJWYWx1ZU9mKEBwYXJhbXMubnVtYmVyKVxuICAgICAgICBwaWN0dXJlID0gc2NlbmUucGljdHVyZXNbbnVtYmVyXVxuICAgICAgICBpZiBub3QgcGljdHVyZT8gdGhlbiByZXR1cm5cbiAgICAgICAgXG4gICAgICAgIEBpbnRlcnByZXRlci5vYmplY3RFZmZlY3QocGljdHVyZSwgQHBhcmFtcylcbiAgICAgICAgZ3MuR2FtZU5vdGlmaWVyLnBvc3RNaW5vckNoYW5nZSgpXG4gICAgXG4gICAgIyMjKlxuICAgICogQG1ldGhvZCBjb21tYW5kRXJhc2VQaWN0dXJlXG4gICAgKiBAcHJvdGVjdGVkXG4gICAgIyMjXG4gICAgY29tbWFuZEVyYXNlUGljdHVyZTogLT5cbiAgICAgICAgZGVmYXVsdHMgPSBHYW1lTWFuYWdlci5kZWZhdWx0cy5waWN0dXJlXG4gICAgICAgIGZsYWdzID0gQHBhcmFtcy5maWVsZEZsYWdzIHx8IHt9XG4gICAgICAgIGlzTG9ja2VkID0gZ3MuQ29tbWFuZEZpZWxkRmxhZ3MuaXNMb2NrZWRcbiAgICAgICAgXG4gICAgICAgIHNjZW5lID0gU2NlbmVNYW5hZ2VyLnNjZW5lXG4gICAgICAgIHNjZW5lLmJlaGF2aW9yLmNoYW5nZVBpY3R1cmVEb21haW4oQHBhcmFtcy5udW1iZXJEb21haW4gfHwgXCJcIilcbiAgICAgICAgbnVtYmVyID0gQGludGVycHJldGVyLm51bWJlclZhbHVlT2YoQHBhcmFtcy5udW1iZXIpXG4gICAgICAgIHBpY3R1cmUgPSBzY2VuZS5waWN0dXJlc1tudW1iZXJdXG4gICAgICAgIGlmIG5vdCBwaWN0dXJlPyB0aGVuIHJldHVyblxuICAgICAgICBcbiAgICAgICAgZWFzaW5nID0gaWYgIWlzTG9ja2VkKGZsYWdzW1wiZWFzaW5nLnR5cGVcIl0pIHRoZW4gZ3MuRWFzaW5ncy5mcm9tVmFsdWVzKEBpbnRlcnByZXRlci5udW1iZXJWYWx1ZU9mKEBwYXJhbXMuZWFzaW5nLnR5cGUpLCBAcGFyYW1zLmVhc2luZy5pbk91dCkgZWxzZSBncy5FYXNpbmdzLmZyb21PYmplY3QoZGVmYXVsdHMuZGlzYXBwZWFyRWFzaW5nKVxuICAgICAgICBkdXJhdGlvbiA9IGlmICFpc0xvY2tlZChmbGFncy5kdXJhdGlvbikgdGhlbiBAaW50ZXJwcmV0ZXIuZHVyYXRpb25WYWx1ZU9mKEBwYXJhbXMuZHVyYXRpb24pIGVsc2UgZGVmYXVsdHMuZGlzYXBwZWFyRHVyYXRpb25cbiAgICAgICAgYW5pbWF0aW9uID0gaWYgIWlzTG9ja2VkKGZsYWdzW1wiYW5pbWF0aW9uLnR5cGVcIl0pIHRoZW4gQHBhcmFtcy5hbmltYXRpb24gZWxzZSBkZWZhdWx0cy5kaXNhcHBlYXJBbmltYXRpb25cbiAgICAgICAgXG4gICAgICAgIHBpY3R1cmUuYW5pbWF0b3IuZGlzYXBwZWFyKGFuaW1hdGlvbiwgZWFzaW5nLCBkdXJhdGlvbiwgXG4gICAgICAgICAgICAoc2VuZGVyKSA9PiBcbiAgICAgICAgICAgICAgICBzZW5kZXIuZGlzcG9zZSgpXG4gICAgICAgICAgICAgICAgc2NlbmUuYmVoYXZpb3IuY2hhbmdlUGljdHVyZURvbWFpbihzZW5kZXIuZG9tYWluKVxuICAgICAgICAgICAgICAgIHNjZW5lLnBpY3R1cmVzW251bWJlcl0gPSBudWxsXG4gICAgICAgIClcbiAgICAgICAgXG4gICAgICAgIGlmIEBwYXJhbXMud2FpdEZvckNvbXBsZXRpb24gYW5kIG5vdCAoZHVyYXRpb24gPT0gMCBvciBAaW50ZXJwcmV0ZXIuaXNJbnN0YW50U2tpcCgpKVxuICAgICAgICAgICAgQGludGVycHJldGVyLmlzV2FpdGluZyA9IHllc1xuICAgICAgICAgICAgQGludGVycHJldGVyLndhaXRDb3VudGVyID0gZHVyYXRpb24gXG4gICAgICAgICAgICBcbiAgICAgICAgZ3MuR2FtZU5vdGlmaWVyLnBvc3RNaW5vckNoYW5nZSgpXG4gICAgICAgICAgICBcbiAgICBcbiAgICAjIyMqXG4gICAgKiBAbWV0aG9kIGNvbW1hbmRJbnB1dE51bWJlclxuICAgICogQHByb3RlY3RlZFxuICAgICMjI1xuICAgIGNvbW1hbmRJbnB1dE51bWJlcjogLT5cbiAgICAgICAgc2NlbmUgPSBTY2VuZU1hbmFnZXIuc2NlbmVcbiAgICAgICAgQGludGVycHJldGVyLmlzV2FpdGluZyA9IHllc1xuICAgICAgICBpZiBAaW50ZXJwcmV0ZXIuaXNQcm9jZXNzaW5nTWVzc2FnZUluT3RoZXJDb250ZXh0KClcbiAgICAgICAgICAgIEBpbnRlcnByZXRlci53YWl0Rm9yTWVzc2FnZSgpXG4gICAgICAgICAgICByZXR1cm5cbiAgICAgICAgICAgIFxuICAgICAgICBpZiAoR2FtZU1hbmFnZXIuc2V0dGluZ3MuYWxsb3dDaG9pY2VTa2lwfHxAaW50ZXJwcmV0ZXIucHJldmlldykgYW5kIEdhbWVNYW5hZ2VyLnRlbXBTZXR0aW5ncy5za2lwXG4gICAgICAgICAgICBAaW50ZXJwcmV0ZXIuaXNXYWl0aW5nID0gbm9cbiAgICAgICAgICAgIEBpbnRlcnByZXRlci5tZXNzYWdlT2JqZWN0KCkuYmVoYXZpb3IuY2xlYXIoKVxuICAgICAgICAgICAgQGludGVycHJldGVyLnNldE51bWJlclZhbHVlVG8oQHBhcmFtcy52YXJpYWJsZSwgMClcbiAgICAgICAgICAgIHJldHVyblxuICAgICAgICAgICAgXG4gICAgICAgICR0ZW1wRmllbGRzLmRpZ2l0cyA9IEBwYXJhbXMuZGlnaXRzXG4gICAgICAgIHNjZW5lLmJlaGF2aW9yLnNob3dJbnB1dE51bWJlcihAcGFyYW1zLmRpZ2l0cywgZ3MuQ2FsbEJhY2soXCJvbklucHV0TnVtYmVyRmluaXNoXCIsIEBpbnRlcnByZXRlciwgQHBhcmFtcykpXG4gICAgICAgXG4gICAgICAgIEBpbnRlcnByZXRlci53YWl0aW5nRm9yLmlucHV0TnVtYmVyID0gQHBhcmFtc1xuICAgICAgICBncy5HYW1lTm90aWZpZXIucG9zdE1pbm9yQ2hhbmdlKClcbiAgICBcbiAgICAjIyMqXG4gICAgKiBAbWV0aG9kIGNvbW1hbmRDaG9pY2VUaW1lclxuICAgICogQHByb3RlY3RlZFxuICAgICMjI1xuICAgIGNvbW1hbmRDaG9pY2VUaW1lcjogLT5cbiAgICAgICAgc2NlbmUgPSBTY2VuZU1hbmFnZXIuc2NlbmVcbiAgICAgICAgXG4gICAgICAgIEdhbWVNYW5hZ2VyLnRlbXBGaWVsZHMuY2hvaWNlVGltZXIgPSBzY2VuZS5jaG9pY2VUaW1lclxuICAgICAgICBHYW1lTWFuYWdlci50ZW1wRmllbGRzLmNob2ljZVRpbWVyVmlzaWJsZSA9IEBwYXJhbXMudmlzaWJsZVxuICAgICAgICAgICAgICAgIFxuICAgICAgICBpZiBAcGFyYW1zLmVuYWJsZWRcbiAgICAgICAgICAgIHNjZW5lLmNob2ljZVRpbWVyLmJlaGF2aW9yLnNlY29uZHMgPSBAaW50ZXJwcmV0ZXIubnVtYmVyVmFsdWVPZihAcGFyYW1zLnNlY29uZHMpXG4gICAgICAgICAgICBzY2VuZS5jaG9pY2VUaW1lci5iZWhhdmlvci5taW51dGVzID0gQGludGVycHJldGVyLm51bWJlclZhbHVlT2YoQHBhcmFtcy5taW51dGVzKVxuICAgICAgICAgICAgc2NlbmUuY2hvaWNlVGltZXIuYmVoYXZpb3Iuc3RhcnQoKVxuICAgICAgICAgICAgc2NlbmUuY2hvaWNlVGltZXIuZXZlbnRzLm9uIFwiZmluaXNoXCIsIChzZW5kZXIpID0+XG4gICAgICAgICAgICAgICAgaWYgIHNjZW5lLmNob2ljZVdpbmRvdyBhbmQgc2NlbmUuY2hvaWNlcz8ubGVuZ3RoID4gMCAgICBcbiAgICAgICAgICAgICAgICAgICAgZGVmYXVsdENob2ljZSA9IChzY2VuZS5jaG9pY2VzLmZpcnN0IChjKSAtPiBjLmlzRGVmYXVsdCkgfHwgc2NlbmUuY2hvaWNlc1swXVxuICAgICAgICAgICAgICAgICAgICAjc2NlbmUuY2hvaWNlV2luZG93LmV2ZW50cy5lbWl0KFwic2VsZWN0aW9uQWNjZXB0XCIsIHNjZW5lLmNob2ljZVdpbmRvdywgeyBsYWJlbEluZGV4OiBkZWZhdWx0Q2hvaWNlLmFjdGlvbi5sYWJlbEluZGV4IH0pXG4gICAgICAgICAgICAgICAgICAgIHNjZW5lLmNob2ljZVdpbmRvdy5ldmVudHMuZW1pdChcInNlbGVjdGlvbkFjY2VwdFwiLCBzY2VuZS5jaG9pY2VXaW5kb3csIGRlZmF1bHRDaG9pY2UpXG4gICAgICAgIGVsc2VcbiAgICAgICAgICAgIHNjZW5lLmNob2ljZVRpbWVyLnN0b3AoKVxuICAgICBcbiAgICAjIyMqXG4gICAgKiBAbWV0aG9kIGNvbW1hbmRTaG93Q2hvaWNlc1xuICAgICogQHByb3RlY3RlZFxuICAgICMjI1xuICAgIGNvbW1hbmRTaG93Q2hvaWNlczogLT4gIFxuICAgICAgICBzY2VuZSA9IFNjZW5lTWFuYWdlci5zY2VuZVxuICAgICAgICBwb2ludGVyID0gQGludGVycHJldGVyLnBvaW50ZXJcbiAgICAgICAgY2hvaWNlcyA9IHNjZW5lLmNob2ljZXMgfHwgW11cbiAgICAgICAgXG4gICAgICAgIGlmIChHYW1lTWFuYWdlci5zZXR0aW5ncy5hbGxvd0Nob2ljZVNraXB8fEBpbnRlcnByZXRlci5wcmV2aWV3RGF0YSkgYW5kIEdhbWVNYW5hZ2VyLnRlbXBTZXR0aW5ncy5za2lwXG4gICAgICAgICAgICBtZXNzYWdlT2JqZWN0ID0gQGludGVycHJldGVyLm1lc3NhZ2VPYmplY3QoKVxuICAgICAgICAgICAgaWYgbWVzc2FnZU9iamVjdD8udmlzaWJsZVxuICAgICAgICAgICAgICAgIG1lc3NhZ2VPYmplY3QuYmVoYXZpb3IuY2xlYXIoKVxuICAgICAgICAgICAgZGVmYXVsdENob2ljZSA9IChjaG9pY2VzLmZpcnN0KChjKSAtPiBjLmlzRGVmYXVsdCkpIHx8IGNob2ljZXNbMF0gICAgXG4gICAgICAgICAgICBpZiBkZWZhdWx0Q2hvaWNlLmFjdGlvbi5sYWJlbEluZGV4P1xuICAgICAgICAgICAgICAgIEBpbnRlcnByZXRlci5wb2ludGVyID0gZGVmYXVsdENob2ljZS5hY3Rpb24ubGFiZWxJbmRleFxuICAgICAgICAgICAgZWxzZVxuICAgICAgICAgICAgICAgIEBpbnRlcnByZXRlci5qdW1wVG9MYWJlbChkZWZhdWx0Q2hvaWNlLmFjdGlvbi5sYWJlbClcbiAgICAgICAgICAgIHNjZW5lLmNob2ljZXMgPSBbXVxuICAgICAgICBlbHNlXG4gICAgICAgICAgICBpZiBjaG9pY2VzLmxlbmd0aCA+IDBcbiAgICAgICAgICAgICAgICBAaW50ZXJwcmV0ZXIuaXNXYWl0aW5nID0geWVzXG4gICAgICAgICAgICAgICAgc2NlbmUuYmVoYXZpb3Iuc2hvd0Nob2ljZXMoZ3MuQ2FsbEJhY2soXCJvbkNob2ljZUFjY2VwdFwiLCBAaW50ZXJwcmV0ZXIsIHsgcG9pbnRlcjogcG9pbnRlciwgcGFyYW1zOiBAcGFyYW1zIH0pKVxuICAgICAgICBcbiAgICAgICAgZ3MuR2FtZU5vdGlmaWVyLnBvc3RNaW5vckNoYW5nZSgpXG4gICAgXG4gICAgIyMjKlxuICAgICogQG1ldGhvZCBjb21tYW5kU2hvd0Nob2ljZVxuICAgICogQHByb3RlY3RlZFxuICAgICMjIyAgICAgICAgXG4gICAgY29tbWFuZFNob3dDaG9pY2U6IC0+IFxuICAgICAgICBzY2VuZSA9IFNjZW5lTWFuYWdlci5zY2VuZVxuICAgICAgICBjb21tYW5kcyA9IEBpbnRlcnByZXRlci5vYmplY3QuY29tbWFuZHNcbiAgICAgICAgY29tbWFuZCA9IG51bGxcbiAgICAgICAgaW5kZXggPSAwXG4gICAgICAgIHBvaW50ZXIgPSBAaW50ZXJwcmV0ZXIucG9pbnRlclxuICAgICAgICBjaG9pY2VzID0gbnVsbFxuICAgICAgICBkc3RSZWN0ID0gbnVsbFxuICAgICAgICBcbiAgICAgICAgc3dpdGNoIEBwYXJhbXMucG9zaXRpb25UeXBlXG4gICAgICAgICAgICB3aGVuIDAgIyBBdXRvXG4gICAgICAgICAgICAgICAgZHN0UmVjdCA9IG51bGxcbiAgICAgICAgICAgIHdoZW4gMSAjIERpcmVjdFxuICAgICAgICAgICAgICAgIGRzdFJlY3QgPSBuZXcgUmVjdChAcGFyYW1zLmJveC54LCBAcGFyYW1zLmJveC55LCBAcGFyYW1zLmJveC5zaXplLndpZHRoLCBAcGFyYW1zLmJveC5zaXplLmhlaWdodClcbiAgICAgICAgICAgICAgICBcbiAgICAgICAgaWYgIXNjZW5lLmNob2ljZXNcbiAgICAgICAgICAgIHNjZW5lLmNob2ljZXMgPSBbXVxuICAgICAgICBjaG9pY2VzID0gc2NlbmUuY2hvaWNlc1xuICAgICAgICBjaG9pY2VzLnB1c2goeyBcbiAgICAgICAgICAgIGRzdFJlY3Q6IGRzdFJlY3QsIFxuICAgICAgICAgICAgI3RleHQ6IGxjcyhAcGFyYW1zLnRleHQpLCBcbiAgICAgICAgICAgIHRleHQ6IEBwYXJhbXMudGV4dCwgXG4gICAgICAgICAgICBpbmRleDogaW5kZXgsIFxuICAgICAgICAgICAgYWN0aW9uOiBAcGFyYW1zLmFjdGlvbiwgXG4gICAgICAgICAgICBpc1NlbGVjdGVkOiBubywgXG4gICAgICAgICAgICBpc0RlZmF1bHQ6IEBwYXJhbXMuZGVmYXVsdENob2ljZSwgXG4gICAgICAgICAgICBpc0VuYWJsZWQ6IEBpbnRlcnByZXRlci5ib29sZWFuVmFsdWVPZihAcGFyYW1zLmVuYWJsZWQpIH0pXG4gICAgXG4gICAgIyMjKlxuICAgICogQG1ldGhvZCBjb21tYW5kT3Blbk1lbnVcbiAgICAqIEBwcm90ZWN0ZWRcbiAgICAjIyMgICAgICBcbiAgICBjb21tYW5kT3Blbk1lbnU6IC0+XG4gICAgICAgIFNjZW5lTWFuYWdlci5zd2l0Y2hUbyhuZXcgZ3MuT2JqZWN0X0xheW91dChcIm1lbnVMYXlvdXRcIiksIHRydWUpXG4gICAgICAgIEBpbnRlcnByZXRlci53YWl0Q291bnRlciA9IDFcbiAgICAgICAgQGludGVycHJldGVyLmlzV2FpdGluZyA9IHllc1xuICAgIFxuICAgICMjIypcbiAgICAqIEBtZXRob2QgY29tbWFuZE9wZW5Mb2FkTWVudVxuICAgICogQHByb3RlY3RlZFxuICAgICMjIyAgICAgXG4gICAgY29tbWFuZE9wZW5Mb2FkTWVudTogLT5cbiAgICAgICAgU2NlbmVNYW5hZ2VyLnN3aXRjaFRvKG5ldyBncy5PYmplY3RfTGF5b3V0KFwibG9hZE1lbnVMYXlvdXRcIiksIHRydWUpXG4gICAgICAgIEBpbnRlcnByZXRlci53YWl0Q291bnRlciA9IDFcbiAgICAgICAgQGludGVycHJldGVyLmlzV2FpdGluZyA9IHllc1xuICAgICAgICBcbiAgICAjIyMqXG4gICAgKiBAbWV0aG9kIGNvbW1hbmRPcGVuU2F2ZU1lbnVcbiAgICAqIEBwcm90ZWN0ZWRcbiAgICAjIyMgICAgIFxuICAgIGNvbW1hbmRPcGVuU2F2ZU1lbnU6IC0+XG4gICAgICAgIFNjZW5lTWFuYWdlci5zd2l0Y2hUbyhuZXcgZ3MuT2JqZWN0X0xheW91dChcInNhdmVNZW51TGF5b3V0XCIpLCB0cnVlKVxuICAgICAgICBAaW50ZXJwcmV0ZXIud2FpdENvdW50ZXIgPSAxXG4gICAgICAgIEBpbnRlcnByZXRlci5pc1dhaXRpbmcgPSB5ZXNcbiAgICAgIFxuICAgICMjIypcbiAgICAqIEBtZXRob2QgY29tbWFuZFJldHVyblRvVGl0bGVcbiAgICAqIEBwcm90ZWN0ZWRcbiAgICAjIyMgICAgIFxuICAgIGNvbW1hbmRSZXR1cm5Ub1RpdGxlOiAtPlxuICAgICAgICBTY2VuZU1hbmFnZXIuY2xlYXIoKVxuICAgICAgICBTY2VuZU1hbmFnZXIuc3dpdGNoVG8obmV3IGdzLk9iamVjdF9MYXlvdXQoXCJ0aXRsZUxheW91dFwiKSlcbiAgICAgICAgQGludGVycHJldGVyLndhaXRDb3VudGVyID0gMVxuICAgICAgICBAaW50ZXJwcmV0ZXIuaXNXYWl0aW5nID0geWVzXG5cbiAgICBcbiAgICAjIyMqXG4gICAgKiBAbWV0aG9kIGNvbW1hbmRQbGF5VmlkZW9cbiAgICAqIEBwcm90ZWN0ZWRcbiAgICAjIyMgXG4gICAgY29tbWFuZFBsYXlWaWRlbzogLT5cbiAgICAgICAgaWYgKEdhbWVNYW5hZ2VyLmluTGl2ZVByZXZpZXcgb3IgR2FtZU1hbmFnZXIuc2V0dGluZ3MuYWxsb3dWaWRlb1NraXApIGFuZCBHYW1lTWFuYWdlci50ZW1wU2V0dGluZ3Muc2tpcCB0aGVuIHJldHVyblxuICAgICAgICBcbiAgICAgICAgR2FtZU1hbmFnZXIudGVtcFNldHRpbmdzLnNraXAgPSBub1xuICAgICAgICBzY2VuZSA9IFNjZW5lTWFuYWdlci5zY2VuZVxuICAgICAgICBcbiAgICAgICAgaWYgQHBhcmFtcy52aWRlbz8ubmFtZT9cbiAgICAgICAgICAgIHNjZW5lLnZpZGVvID0gUmVzb3VyY2VNYW5hZ2VyLmdldFZpZGVvKFwiTW92aWVzLyN7QHBhcmFtcy52aWRlby5uYW1lfVwiKVxuICAgICAgICAgICAgXG4gICAgICAgICAgICBAdmlkZW9TcHJpdGUgPSBuZXcgU3ByaXRlKEdyYXBoaWNzLnZpZXdwb3J0KVxuICAgICAgICAgICAgQHZpZGVvU3ByaXRlLnNyY1JlY3QgPSBuZXcgUmVjdCgwLCAwLCBzY2VuZS52aWRlby53aWR0aCwgc2NlbmUudmlkZW8uaGVpZ2h0KVxuICAgICAgICAgICAgQHZpZGVvU3ByaXRlLnZpZGVvID0gc2NlbmUudmlkZW9cbiAgICAgICAgICAgIEB2aWRlb1Nwcml0ZS56b29tWCA9IEdyYXBoaWNzLndpZHRoIC8gc2NlbmUudmlkZW8ud2lkdGhcbiAgICAgICAgICAgIEB2aWRlb1Nwcml0ZS56b29tWSA9IEdyYXBoaWNzLmhlaWdodCAvIHNjZW5lLnZpZGVvLmhlaWdodFxuICAgICAgICAgICAgQHZpZGVvU3ByaXRlLnogPSA5OTk5OTk5OVxuICAgICAgICAgICAgc2NlbmUudmlkZW8ub25FbmRlZCA9ID0+XG4gICAgICAgICAgICAgICAgQGludGVycHJldGVyLmlzV2FpdGluZyA9IG5vXG4gICAgICAgICAgICAgICAgQHZpZGVvU3ByaXRlLmRpc3Bvc2UoKVxuICAgICAgICAgICAgICAgIHNjZW5lLnZpZGVvID0gbnVsbFxuICAgICAgICAgICAgc2NlbmUudmlkZW8udm9sdW1lID0gQHBhcmFtcy52b2x1bWUgLyAxMDBcbiAgICAgICAgICAgIHNjZW5lLnZpZGVvLnBsYXliYWNrUmF0ZSA9IEBwYXJhbXMucGxheWJhY2tSYXRlIC8gMTAwXG4gICAgICAgICAgICBAaW50ZXJwcmV0ZXIuaXNXYWl0aW5nID0geWVzXG4gICAgICAgICAgICBzY2VuZS52aWRlby5wbGF5KClcbiAgICAgICAgZ3MuR2FtZU5vdGlmaWVyLnBvc3RNaW5vckNoYW5nZSgpXG4gICAgIyMjKlxuICAgICogQG1ldGhvZCBjb21tYW5kQXVkaW9EZWZhdWx0c1xuICAgICogQHByb3RlY3RlZFxuICAgICMjIyBcbiAgICBjb21tYW5kQXVkaW9EZWZhdWx0czogLT5cbiAgICAgICAgZGVmYXVsdHMgPSBHYW1lTWFuYWdlci5kZWZhdWx0cy5hdWRpb1xuICAgICAgICBmbGFncyA9IEBwYXJhbXMuZmllbGRGbGFncyB8fCB7fVxuICAgICAgICBpc0xvY2tlZCA9IGdzLkNvbW1hbmRGaWVsZEZsYWdzLmlzTG9ja2VkXG4gICAgICAgIFxuICAgICAgICBpZiAhaXNMb2NrZWQoZmxhZ3MubXVzaWNGYWRlSW5EdXJhdGlvbikgdGhlbiBkZWZhdWx0cy5tdXNpY0ZhZGVJbkR1cmF0aW9uID0gQHBhcmFtcy5tdXNpY0ZhZGVJbkR1cmF0aW9uXG4gICAgICAgIGlmICFpc0xvY2tlZChmbGFncy5tdXNpY0ZhZGVPdXREdXJhdGlvbikgdGhlbiBkZWZhdWx0cy5tdXNpY0ZhZGVPdXREdXJhdGlvbiA9IEBwYXJhbXMubXVzaWNGYWRlT3V0RHVyYXRpb25cbiAgICAgICAgaWYgIWlzTG9ja2VkKGZsYWdzLm11c2ljVm9sdW1lKSB0aGVuIGRlZmF1bHRzLm11c2ljVm9sdW1lID0gQHBhcmFtcy5tdXNpY1ZvbHVtZVxuICAgICAgICBpZiAhaXNMb2NrZWQoZmxhZ3MubXVzaWNQbGF5YmFja1JhdGUpIHRoZW4gZGVmYXVsdHMubXVzaWNQbGF5YmFja1JhdGUgPSBAcGFyYW1zLm11c2ljUGxheWJhY2tSYXRlXG4gICAgICAgIGlmICFpc0xvY2tlZChmbGFncy5zb3VuZFZvbHVtZSkgdGhlbiBkZWZhdWx0cy5zb3VuZFZvbHVtZSA9IEBwYXJhbXMuc291bmRWb2x1bWVcbiAgICAgICAgaWYgIWlzTG9ja2VkKGZsYWdzLnNvdW5kUGxheWJhY2tSYXRlKSB0aGVuIGRlZmF1bHRzLnNvdW5kUGxheWJhY2tSYXRlID0gQHBhcmFtcy5zb3VuZFBsYXliYWNrUmF0ZVxuICAgICAgICBpZiAhaXNMb2NrZWQoZmxhZ3Mudm9pY2VWb2x1bWUpIHRoZW4gZGVmYXVsdHMudm9pY2VWb2x1bWUgPSBAcGFyYW1zLnZvaWNlVm9sdW1lXG4gICAgICAgIGlmICFpc0xvY2tlZChmbGFncy52b2ljZVBsYXliYWNrUmF0ZSkgdGhlbiBkZWZhdWx0cy52b2ljZVBsYXliYWNrUmF0ZSA9IEBwYXJhbXMudm9pY2VQbGF5YmFja1JhdGVcbiAgXG4gICAgIyMjKlxuICAgICogQG1ldGhvZCBjb21tYW5kUGxheU11c2ljXG4gICAgKiBAcHJvdGVjdGVkXG4gICAgIyMjXG4gICAgY29tbWFuZFBsYXlNdXNpYzogLT5cbiAgICAgICAgaWYgbm90IEBwYXJhbXMubXVzaWM/IHRoZW4gcmV0dXJuXG4gICAgICAgIGRlZmF1bHRzID0gR2FtZU1hbmFnZXIuZGVmYXVsdHMuYXVkaW9cbiAgICAgICAgZmxhZ3MgPSBAcGFyYW1zLmZpZWxkRmxhZ3MgfHwge31cbiAgICAgICAgaXNMb2NrZWQgPSBncy5Db21tYW5kRmllbGRGbGFncy5pc0xvY2tlZFxuICAgICAgICBtdXNpYyA9IG51bGxcbiAgICAgICAgXG4gICAgICAgIGlmIEdhbWVNYW5hZ2VyLnNldHRpbmdzLmJnbUVuYWJsZWRcbiAgICAgICAgICAgIGZhZGVEdXJhdGlvbiA9IGlmICFpc0xvY2tlZChmbGFncy5mYWRlSW5EdXJhdGlvbikgdGhlbiBAcGFyYW1zLmZhZGVJbkR1cmF0aW9uIGVsc2UgZGVmYXVsdHMubXVzaWNGYWRlSW5EdXJhdGlvblxuICAgICAgICAgICAgdm9sdW1lID0gaWYgIWlzTG9ja2VkKGZsYWdzW1wibXVzaWMudm9sdW1lXCJdKSB0aGVuIEBwYXJhbXMubXVzaWMudm9sdW1lIGVsc2UgZGVmYXVsdHMubXVzaWNWb2x1bWVcbiAgICAgICAgICAgIHBsYXliYWNrUmF0ZSA9IGlmICFpc0xvY2tlZChmbGFnc1tcIm11c2ljLnBsYXliYWNrUmF0ZVwiXSkgdGhlbiBAcGFyYW1zLm11c2ljLnBsYXliYWNrUmF0ZSBlbHNlIGRlZmF1bHRzLm11c2ljUGxheWJhY2tSYXRlXG4gICAgICAgICAgICBtdXNpYyA9IHsgbmFtZTogQHBhcmFtcy5tdXNpYy5uYW1lLCB2b2x1bWU6IHZvbHVtZSwgcGxheWJhY2tSYXRlOiBwbGF5YmFja1JhdGUgfVxuICAgICAgICAgICAgaWYgQHBhcmFtcy5wbGF5VHlwZSA9PSAxXG4gICAgICAgICAgICAgICAgcGxheVRpbWUgPSBtaW46IEBwYXJhbXMucGxheVRpbWUubWluICogNjAsIG1heDogQHBhcmFtcy5wbGF5VGltZS5tYXggKiA2MFxuICAgICAgICAgICAgICAgIHBsYXlSYW5nZSA9IHN0YXJ0OiBAcGFyYW1zLnBsYXlSYW5nZS5zdGFydCAqIDYwLCBlbmQ6IEBwYXJhbXMucGxheVJhbmdlLmVuZCAqIDYwXG4gICAgICAgICAgICAgICAgQXVkaW9NYW5hZ2VyLnBsYXlNdXNpY1JhbmRvbShtdXNpYywgZmFkZUR1cmF0aW9uLCBAcGFyYW1zLmxheWVyIHx8IDAsIHBsYXlUaW1lLCBwbGF5UmFuZ2UpXG4gICAgICAgICAgICBlbHNlXG4gICAgICAgICAgICAgICAgbXVzaWMgPSBBdWRpb01hbmFnZXIucGxheU11c2ljKEBwYXJhbXMubXVzaWMubmFtZSwgdm9sdW1lLCBwbGF5YmFja1JhdGUsIGZhZGVEdXJhdGlvbiwgQHBhcmFtcy5sYXllciB8fCAwLCBAcGFyYW1zLmxvb3ApXG4gICAgXG4gICAgICAgIGlmIG11c2ljIGFuZCBAcGFyYW1zLndhaXRGb3JDb21wbGV0aW9uIGFuZCAhQHBhcmFtcy5sb29wXG4gICAgICAgICAgICBAaW50ZXJwcmV0ZXIuaXNXYWl0aW5nID0geWVzXG4gICAgICAgICAgICBAaW50ZXJwcmV0ZXIud2FpdENvdW50ZXIgPSBNYXRoLnJvdW5kKG11c2ljLmR1cmF0aW9uICogR3JhcGhpY3MuZnJhbWVSYXRlKVxuICAgICAgICAgICAgXG4gICAgICAgIGdzLkdhbWVOb3RpZmllci5wb3N0TWlub3JDaGFuZ2UoKVxuICAgICMjIypcbiAgICAqIEBtZXRob2QgY29tbWFuZFN0b3BNdXNpY1xuICAgICogQHByb3RlY3RlZFxuICAgICMjI1xuICAgIGNvbW1hbmRTdG9wTXVzaWM6IC0+IFxuICAgICAgICBkZWZhdWx0cyA9IEdhbWVNYW5hZ2VyLmRlZmF1bHRzLmF1ZGlvXG4gICAgICAgIGZsYWdzID0gQHBhcmFtcy5maWVsZEZsYWdzIHx8IHt9XG4gICAgICAgIGlzTG9ja2VkID0gZ3MuQ29tbWFuZEZpZWxkRmxhZ3MuaXNMb2NrZWRcbiAgICAgICAgZmFkZUR1cmF0aW9uID0gaWYgIWlzTG9ja2VkKGZsYWdzLmZhZGVPdXREdXJhdGlvbikgdGhlbiBAcGFyYW1zLmZhZGVPdXREdXJhdGlvbiBlbHNlIGRlZmF1bHRzLm11c2ljRmFkZU91dER1cmF0aW9uXG4gICAgICAgIFxuICAgICAgICBBdWRpb01hbmFnZXIuc3RvcE11c2ljKGZhZGVEdXJhdGlvbiwgQGludGVycHJldGVyLm51bWJlclZhbHVlT2YoQHBhcmFtcy5sYXllcikpXG4gICAgICAgIFxuICAgICAgICBncy5HYW1lTm90aWZpZXIucG9zdE1pbm9yQ2hhbmdlKClcbiAgICAjIyMqXG4gICAgKiBAbWV0aG9kIGNvbW1hbmRQYXVzZU11c2ljXG4gICAgKiBAcHJvdGVjdGVkXG4gICAgIyMjXG4gICAgY29tbWFuZFBhdXNlTXVzaWM6IC0+XG4gICAgICAgIGRlZmF1bHRzID0gR2FtZU1hbmFnZXIuZGVmYXVsdHMuYXVkaW9cbiAgICAgICAgZmxhZ3MgPSBAcGFyYW1zLmZpZWxkRmxhZ3MgfHwge31cbiAgICAgICAgaXNMb2NrZWQgPSBncy5Db21tYW5kRmllbGRGbGFncy5pc0xvY2tlZFxuICAgICAgICBmYWRlRHVyYXRpb24gPSBpZiAhaXNMb2NrZWQoZmxhZ3MuZmFkZU91dER1cmF0aW9uKSB0aGVuIEBwYXJhbXMuZmFkZU91dER1cmF0aW9uIGVsc2UgZGVmYXVsdHMubXVzaWNGYWRlT3V0RHVyYXRpb25cbiAgICAgICAgXG4gICAgICAgIEF1ZGlvTWFuYWdlci5zdG9wTXVzaWMoZmFkZUR1cmF0aW9uLCBAaW50ZXJwcmV0ZXIubnVtYmVyVmFsdWVPZihAcGFyYW1zLmxheWVyKSlcbiAgICBcbiAgICAjIyMqXG4gICAgKiBAbWV0aG9kIGNvbW1hbmRSZXN1bWVNdXNpY1xuICAgICogQHByb3RlY3RlZFxuICAgICMjI1xuICAgIGNvbW1hbmRSZXN1bWVNdXNpYzogLT4gXG4gICAgICAgIGRlZmF1bHRzID0gR2FtZU1hbmFnZXIuZGVmYXVsdHMuYXVkaW9cbiAgICAgICAgZmxhZ3MgPSBAcGFyYW1zLmZpZWxkRmxhZ3MgfHwge31cbiAgICAgICAgaXNMb2NrZWQgPSBncy5Db21tYW5kRmllbGRGbGFncy5pc0xvY2tlZFxuICAgICAgICBmYWRlRHVyYXRpb24gPSBpZiAhaXNMb2NrZWQoZmxhZ3MuZmFkZUluRHVyYXRpb24pIHRoZW4gQHBhcmFtcy5mYWRlSW5EdXJhdGlvbiBlbHNlIGRlZmF1bHRzLm11c2ljRmFkZUluRHVyYXRpb25cbiAgICAgICAgXG4gICAgICAgIEF1ZGlvTWFuYWdlci5yZXN1bWVNdXNpYyhmYWRlRHVyYXRpb24sIEBpbnRlcnByZXRlci5udW1iZXJWYWx1ZU9mKEBwYXJhbXMubGF5ZXIpKVxuICAgICAgICBncy5HYW1lTm90aWZpZXIucG9zdE1pbm9yQ2hhbmdlKClcbiAgICAjIyMqXG4gICAgKiBAbWV0aG9kIGNvbW1hbmRQbGF5U291bmRcbiAgICAqIEBwcm90ZWN0ZWRcbiAgICAjIyMgICAgXG4gICAgY29tbWFuZFBsYXlTb3VuZDogLT5cbiAgICAgICAgZGVmYXVsdHMgPSBHYW1lTWFuYWdlci5kZWZhdWx0cy5hdWRpb1xuICAgICAgICBmbGFncyA9IEBwYXJhbXMuZmllbGRGbGFncyB8fCB7fVxuICAgICAgICBpc0xvY2tlZCA9IGdzLkNvbW1hbmRGaWVsZEZsYWdzLmlzTG9ja2VkXG4gICAgICAgIHNvdW5kID0gbnVsbFxuICAgICAgICBpZiBHYW1lTWFuYWdlci5zZXR0aW5ncy5zb3VuZEVuYWJsZWQgYW5kICFHYW1lTWFuYWdlci50ZW1wU2V0dGluZ3Muc2tpcFxuICAgICAgICAgICAgdm9sdW1lID0gaWYgIWlzTG9ja2VkKGZsYWdzW1wic291bmQudm9sdW1lXCJdKSB0aGVuIEBwYXJhbXMuc291bmQudm9sdW1lIGVsc2UgZGVmYXVsdHMuc291bmRWb2x1bWVcbiAgICAgICAgICAgIHBsYXliYWNrUmF0ZSA9IGlmICFpc0xvY2tlZChmbGFnc1tcInNvdW5kLnBsYXliYWNrUmF0ZVwiXSkgdGhlbiBAcGFyYW1zLnNvdW5kLnBsYXliYWNrUmF0ZSBlbHNlIGRlZmF1bHRzLnNvdW5kUGxheWJhY2tSYXRlXG4gICAgICAgICAgICBcbiAgICAgICAgICAgIHNvdW5kID0gQXVkaW9NYW5hZ2VyLnBsYXlTb3VuZChAcGFyYW1zLnNvdW5kLm5hbWUsIHZvbHVtZSwgcGxheWJhY2tSYXRlLCBAcGFyYW1zLm11c2ljRWZmZWN0LCBudWxsLCBAcGFyYW1zLmxvb3ApXG4gICAgICAgIGdzLkdhbWVOb3RpZmllci5wb3N0TWlub3JDaGFuZ2UoKVxuICAgICAgICBpZiBzb3VuZCBhbmQgQHBhcmFtcy53YWl0Rm9yQ29tcGxldGlvbiBhbmQgIUBwYXJhbXMubG9vcFxuICAgICAgICAgICAgQGludGVycHJldGVyLmlzV2FpdGluZyA9IHllc1xuICAgICAgICAgICAgQGludGVycHJldGVyLndhaXRDb3VudGVyID0gTWF0aC5yb3VuZChzb3VuZC5kdXJhdGlvbiAqIEdyYXBoaWNzLmZyYW1lUmF0ZSlcbiAgICAjIyMqXG4gICAgKiBAbWV0aG9kIGNvbW1hbmRTdG9wU291bmRcbiAgICAqIEBwcm90ZWN0ZWRcbiAgICAjIyMgICAgXG4gICAgY29tbWFuZFN0b3BTb3VuZDogLT5cbiAgICAgICAgQXVkaW9NYW5hZ2VyLnN0b3BTb3VuZChAcGFyYW1zLnNvdW5kLm5hbWUpXG4gICAgICAgIGdzLkdhbWVOb3RpZmllci5wb3N0TWlub3JDaGFuZ2UoKVxuICAgICMjIypcbiAgICAqIEBtZXRob2QgY29tbWFuZEVuZENvbW1vbkV2ZW50XG4gICAgKiBAcHJvdGVjdGVkXG4gICAgIyMjXG4gICAgY29tbWFuZEVuZENvbW1vbkV2ZW50OiAtPlxuICAgICAgICBldmVudElkID0gQGludGVycHJldGVyLnN0cmluZ1ZhbHVlT2YoQHBhcmFtcy5jb21tb25FdmVudElkKVxuICAgICAgICBldmVudCA9IEdhbWVNYW5hZ2VyLmNvbW1vbkV2ZW50c1tldmVudElkXSBcbiAgICAgICAgZXZlbnQ/LmJlaGF2aW9yLnN0b3AoKVxuICAgICBcbiAgICAjIyMqXG4gICAgKiBAbWV0aG9kIGNvbW1hbmRSZXN1bWVDb21tb25FdmVudFxuICAgICogQHByb3RlY3RlZFxuICAgICMjIyAgIFxuICAgIGNvbW1hbmRSZXN1bWVDb21tb25FdmVudDogLT5cbiAgICAgICAgZXZlbnRJZCA9IEBpbnRlcnByZXRlci5zdHJpbmdWYWx1ZU9mKEBwYXJhbXMuY29tbW9uRXZlbnRJZClcbiAgICAgICAgZXZlbnQgPSBHYW1lTWFuYWdlci5jb21tb25FdmVudHNbZXZlbnRJZF0gXG4gICAgICAgIGV2ZW50Py5iZWhhdmlvci5yZXN1bWUoKVxuICAgIFxuICAgICMjIypcbiAgICAqIEBtZXRob2QgY29tbWFuZENhbGxDb21tb25FdmVudFxuICAgICogQHByb3RlY3RlZFxuICAgICMjIyAgICBcbiAgICBjb21tYW5kQ2FsbENvbW1vbkV2ZW50OiAtPlxuICAgICAgICBzY2VuZSA9IFNjZW5lTWFuYWdlci5zY2VuZVxuICAgICAgICBldmVudElkID0gbnVsbFxuICAgICAgICBcbiAgICAgICAgaWYgQHBhcmFtcy5jb21tb25FdmVudElkLmluZGV4P1xuICAgICAgICAgICAgZXZlbnRJZCA9IEBpbnRlcnByZXRlci5zdHJpbmdWYWx1ZU9mKEBwYXJhbXMuY29tbW9uRXZlbnRJZClcbiAgICAgICAgICAgIGxpc3QgPSBAaW50ZXJwcmV0ZXIubGlzdE9iamVjdE9mKEBwYXJhbXMucGFyYW1ldGVycy52YWx1ZXNbMF0pXG4gICAgICAgICAgICBwYXJhbXMgPSB7IHZhbHVlczogbGlzdCB9XG4gICAgICAgIGVsc2VcbiAgICAgICAgICAgIHBhcmFtcyA9IEBwYXJhbXMucGFyYW1ldGVyc1xuICAgICAgICAgICAgZXZlbnRJZCA9IEBwYXJhbXMuY29tbW9uRXZlbnRJZFxuXG4gICAgICAgIEBpbnRlcnByZXRlci5jYWxsQ29tbW9uRXZlbnQoZXZlbnRJZCwgcGFyYW1zKVxuICAgICBcbiAgXG4gICAgIyMjKlxuICAgICogQG1ldGhvZCBjb21tYW5kQ2hhbmdlVGV4dFNldHRpbmdzXG4gICAgKiBAcHJvdGVjdGVkXG4gICAgIyMjIFxuICAgIGNvbW1hbmRDaGFuZ2VUZXh0U2V0dGluZ3M6IC0+XG4gICAgICAgIHNjZW5lID0gU2NlbmVNYW5hZ2VyLnNjZW5lXG4gICAgICAgIHNjZW5lLmJlaGF2aW9yLmNoYW5nZVRleHREb21haW4oQHBhcmFtcy5udW1iZXJEb21haW4pXG4gICAgICAgIG51bWJlciA9IEBpbnRlcnByZXRlci5udW1iZXJWYWx1ZU9mKEBwYXJhbXMubnVtYmVyKVxuICAgICAgICB0ZXh0cyA9IHNjZW5lLnRleHRzXG4gICAgICAgIGlmIG5vdCB0ZXh0c1tudW1iZXJdPyBcbiAgICAgICAgICAgIHRleHRzW251bWJlcl0gPSBuZXcgZ3MuT2JqZWN0X1RleHQoKVxuICAgICAgICAgICAgdGV4dHNbbnVtYmVyXS52aXNpYmxlID0gbm9cbiAgICAgICAgICAgIFxuICAgICAgICBcbiAgICAgICAgdGV4dFNwcml0ZSA9IHRleHRzW251bWJlcl1cbiAgICAgICAgcGFkZGluZyA9IHRleHRTcHJpdGUuYmVoYXZpb3IucGFkZGluZ1xuICAgICAgICBmb250ID0gdGV4dFNwcml0ZS5mb250XG4gICAgICAgIGZvbnROYW1lID0gdGV4dFNwcml0ZS5mb250Lm5hbWVcbiAgICAgICAgZm9udFNpemUgPSB0ZXh0U3ByaXRlLmZvbnQuc2l6ZVxuICAgICAgICBmbGFncyA9IEBwYXJhbXMuZmllbGRGbGFncyB8fCB7fVxuICAgICAgICBpc0xvY2tlZCA9IGdzLkNvbW1hbmRGaWVsZEZsYWdzLmlzTG9ja2VkXG4gICAgICAgIGlmICFpc0xvY2tlZChmbGFncy5saW5lU3BhY2luZykgdGhlbiB0ZXh0U3ByaXRlLnRleHRSZW5kZXJlci5saW5lU3BhY2luZyA9IEBwYXJhbXMubGluZVNwYWNpbmcgPyB0ZXh0U3ByaXRlLnRleHRSZW5kZXJlci5saW5lU3BhY2luZ1xuICAgICAgICBpZiAhaXNMb2NrZWQoZmxhZ3MuZm9udCkgdGhlbiBmb250TmFtZSA9IEBpbnRlcnByZXRlci5zdHJpbmdWYWx1ZU9mKEBwYXJhbXMuZm9udClcbiAgICAgICAgaWYgIWlzTG9ja2VkKGZsYWdzLnNpemUpIHRoZW4gZm9udFNpemUgPSBAaW50ZXJwcmV0ZXIubnVtYmVyVmFsdWVPZihAcGFyYW1zLnNpemUpXG4gICAgICAgICAgICBcbiAgICAgICAgaWYgIWlzTG9ja2VkKGZsYWdzLmZvbnQpIG9yICFpc0xvY2tlZChmbGFncy5zaXplKVxuICAgICAgICAgICAgdGV4dFNwcml0ZS5mb250ID0gbmV3IEZvbnQoZm9udE5hbWUsIGZvbnRTaXplKVxuICAgICAgICAgICAgXG4gICAgICAgIHBhZGRpbmcubGVmdCA9IGlmICFpc0xvY2tlZChmbGFnc1tcInBhZGRpbmcuMFwiXSkgdGhlbiBAcGFyYW1zLnBhZGRpbmc/WzBdIGVsc2UgcGFkZGluZy5sZWZ0XG4gICAgICAgIHBhZGRpbmcudG9wID0gaWYgIWlzTG9ja2VkKGZsYWdzW1wicGFkZGluZy4xXCJdKSB0aGVuIEBwYXJhbXMucGFkZGluZz9bMV0gZWxzZSBwYWRkaW5nLnRvcFxuICAgICAgICBwYWRkaW5nLnJpZ2h0ID0gaWYgIWlzTG9ja2VkKGZsYWdzW1wicGFkZGluZy4yXCJdKSB0aGVuIEBwYXJhbXMucGFkZGluZz9bMl0gZWxzZSBwYWRkaW5nLnJpZ2h0XG4gICAgICAgIHBhZGRpbmcuYm90dG9tID0gaWYgIWlzTG9ja2VkKGZsYWdzW1wicGFkZGluZy4zXCJdKSB0aGVuIEBwYXJhbXMucGFkZGluZz9bM10gZWxzZSBwYWRkaW5nLmJvdHRvbVxuICAgICAgICBcbiAgICAgICAgaWYgIWlzTG9ja2VkKGZsYWdzLmJvbGQpXG4gICAgICAgICAgICB0ZXh0U3ByaXRlLmZvbnQuYm9sZCA9IEBwYXJhbXMuYm9sZFxuICAgICAgICBpZiAhaXNMb2NrZWQoZmxhZ3MuaXRhbGljKVxuICAgICAgICAgICAgdGV4dFNwcml0ZS5mb250Lml0YWxpYyA9IEBwYXJhbXMuaXRhbGljXG4gICAgICAgIGlmICFpc0xvY2tlZChmbGFncy5zbWFsbENhcHMpXG4gICAgICAgICAgICB0ZXh0U3ByaXRlLmZvbnQuc21hbGxDYXBzID0gQHBhcmFtcy5zbWFsbENhcHNcbiAgICAgICAgaWYgIWlzTG9ja2VkKGZsYWdzLnVuZGVybGluZSlcbiAgICAgICAgICAgIHRleHRTcHJpdGUuZm9udC51bmRlcmxpbmUgPSBAcGFyYW1zLnVuZGVybGluZVxuICAgICAgICBpZiAhaXNMb2NrZWQoZmxhZ3Muc3RyaWtlVGhyb3VnaClcbiAgICAgICAgICAgIHRleHRTcHJpdGUuZm9udC5zdHJpa2VUaHJvdWdoID0gQHBhcmFtcy5zdHJpa2VUaHJvdWdoXG4gICAgICAgICAgICBcbiAgICAgICAgdGV4dFNwcml0ZS5mb250LmNvbG9yID0gaWYgIWlzTG9ja2VkKGZsYWdzLmNvbG9yKSB0aGVuIG5ldyBDb2xvcihAcGFyYW1zLmNvbG9yKSBlbHNlIGZvbnQuY29sb3JcbiAgICAgICAgdGV4dFNwcml0ZS5mb250LmJvcmRlciA9IGlmICFpc0xvY2tlZChmbGFncy5vdXRsaW5lKXRoZW4gQHBhcmFtcy5vdXRsaW5lIGVsc2UgZm9udC5ib3JkZXJcbiAgICAgICAgdGV4dFNwcml0ZS5mb250LmJvcmRlckNvbG9yID0gaWYgIWlzTG9ja2VkKGZsYWdzLm91dGxpbmVDb2xvcikgdGhlbiBuZXcgQ29sb3IoQHBhcmFtcy5vdXRsaW5lQ29sb3IpIGVsc2UgbmV3IENvbG9yKGZvbnQuYm9yZGVyQ29sb3IpXG4gICAgICAgIHRleHRTcHJpdGUuZm9udC5ib3JkZXJTaXplID0gaWYgIWlzTG9ja2VkKGZsYWdzLm91dGxpbmVTaXplKSB0aGVuIEBwYXJhbXMub3V0bGluZVNpemUgZWxzZSBmb250LmJvcmRlclNpemVcbiAgICAgICAgdGV4dFNwcml0ZS5mb250LnNoYWRvdyA9IGlmICFpc0xvY2tlZChmbGFncy5zaGFkb3cpdGhlbiBAcGFyYW1zLnNoYWRvdyBlbHNlIGZvbnQuc2hhZG93XG4gICAgICAgIHRleHRTcHJpdGUuZm9udC5zaGFkb3dDb2xvciA9IGlmICFpc0xvY2tlZChmbGFncy5zaGFkb3dDb2xvcikgdGhlbiBuZXcgQ29sb3IoQHBhcmFtcy5zaGFkb3dDb2xvcikgZWxzZSBuZXcgQ29sb3IoZm9udC5zaGFkb3dDb2xvcilcbiAgICAgICAgdGV4dFNwcml0ZS5mb250LnNoYWRvd09mZnNldFggPSBpZiAhaXNMb2NrZWQoZmxhZ3Muc2hhZG93T2Zmc2V0WCkgdGhlbiBAcGFyYW1zLnNoYWRvd09mZnNldFggZWxzZSBmb250LnNoYWRvd09mZnNldFhcbiAgICAgICAgdGV4dFNwcml0ZS5mb250LnNoYWRvd09mZnNldFkgPSBpZiAhaXNMb2NrZWQoZmxhZ3Muc2hhZG93T2Zmc2V0WSkgdGhlbiBAcGFyYW1zLnNoYWRvd09mZnNldFkgZWxzZSBmb250LnNoYWRvd09mZnNldFlcbiAgICAgICAgdGV4dFNwcml0ZS5iZWhhdmlvci5yZWZyZXNoKClcbiAgICAgICAgdGV4dFNwcml0ZS51cGRhdGUoKVxuICAgICBcbiAgICAjIyMqXG4gICAgKiBAbWV0aG9kIGNvbW1hbmRDaGFuZ2VUZXh0U2V0dGluZ3NcbiAgICAqIEBwcm90ZWN0ZWRcbiAgICAjIyMgICBcbiAgICBjb21tYW5kVGV4dERlZmF1bHRzOiAtPlxuICAgICAgICBkZWZhdWx0cyA9IEdhbWVNYW5hZ2VyLmRlZmF1bHRzLnRleHRcbiAgICAgICAgZmxhZ3MgPSBAcGFyYW1zLmZpZWxkRmxhZ3MgfHwge31cbiAgICAgICAgaXNMb2NrZWQgPSBncy5Db21tYW5kRmllbGRGbGFncy5pc0xvY2tlZFxuICAgICAgICBcbiAgICAgICAgaWYgIWlzTG9ja2VkKGZsYWdzLmFwcGVhckR1cmF0aW9uKSB0aGVuIGRlZmF1bHRzLmFwcGVhckR1cmF0aW9uID0gQGludGVycHJldGVyLmR1cmF0aW9uVmFsdWVPZihAcGFyYW1zLmFwcGVhckR1cmF0aW9uKVxuICAgICAgICBpZiAhaXNMb2NrZWQoZmxhZ3MuZGlzYXBwZWFyRHVyYXRpb24pIHRoZW4gZGVmYXVsdHMuZGlzYXBwZWFyRHVyYXRpb24gPSBAaW50ZXJwcmV0ZXIuZHVyYXRpb25WYWx1ZU9mKEBwYXJhbXMuZGlzYXBwZWFyRHVyYXRpb24pXG4gICAgICAgIGlmICFpc0xvY2tlZChmbGFncy56T3JkZXIpIHRoZW4gZGVmYXVsdHMuek9yZGVyID0gQGludGVycHJldGVyLm51bWJlclZhbHVlT2YoQHBhcmFtcy56T3JkZXIpXG4gICAgICAgIGlmICFpc0xvY2tlZChmbGFnc1tcImFwcGVhckVhc2luZy50eXBlXCJdKSB0aGVuIGRlZmF1bHRzLmFwcGVhckVhc2luZyA9IEBwYXJhbXMuYXBwZWFyRWFzaW5nXG4gICAgICAgIGlmICFpc0xvY2tlZChmbGFnc1tcImFwcGVhckFuaW1hdGlvbi50eXBlXCJdKSB0aGVuIGRlZmF1bHRzLmFwcGVhckFuaW1hdGlvbiA9IEBwYXJhbXMuYXBwZWFyQW5pbWF0aW9uXG4gICAgICAgIGlmICFpc0xvY2tlZChmbGFnc1tcImRpc2FwcGVhckVhc2luZy50eXBlXCJdKSB0aGVuIGRlZmF1bHRzLmRpc2FwcGVhckVhc2luZyA9IEBwYXJhbXMuZGlzYXBwZWFyRWFzaW5nXG4gICAgICAgIGlmICFpc0xvY2tlZChmbGFnc1tcImRpc2FwcGVhckFuaW1hdGlvbi50eXBlXCJdKSB0aGVuIGRlZmF1bHRzLmRpc2FwcGVhckFuaW1hdGlvbiA9IEBwYXJhbXMuZGlzYXBwZWFyQW5pbWF0aW9uXG4gICAgICAgIGlmICFpc0xvY2tlZChmbGFnc1tcIm1vdGlvbkJsdXIuZW5hYmxlZFwiXSkgdGhlbiBkZWZhdWx0cy5tb3Rpb25CbHVyID0gQHBhcmFtcy5tb3Rpb25CbHVyXG4gICAgICAgIGlmICFpc0xvY2tlZChmbGFncy5vcmlnaW4pIHRoZW4gZGVmYXVsdHMub3JpZ2luID0gQHBhcmFtcy5vcmlnaW5cbiAgICBcbiAgICAjIyMqXG4gICAgKiBAbWV0aG9kIGNvbW1hbmRTaG93VGV4dFxuICAgICogQHByb3RlY3RlZFxuICAgICMjIyAgICAgXG4gICAgY29tbWFuZFNob3dUZXh0OiAtPlxuICAgICAgICBkZWZhdWx0cyA9IEdhbWVNYW5hZ2VyLmRlZmF1bHRzLnRleHRcbiAgICAgICAgZmxhZ3MgPSBAcGFyYW1zLmZpZWxkRmxhZ3MgfHwge31cbiAgICAgICAgaXNMb2NrZWQgPSBncy5Db21tYW5kRmllbGRGbGFncy5pc0xvY2tlZFxuICAgICAgICBzY2VuZSA9IFNjZW5lTWFuYWdlci5zY2VuZVxuICAgICAgICBzY2VuZS5iZWhhdmlvci5jaGFuZ2VUZXh0RG9tYWluKEBwYXJhbXMubnVtYmVyRG9tYWluKVxuICAgICAgICBudW1iZXIgPSBAaW50ZXJwcmV0ZXIubnVtYmVyVmFsdWVPZihAcGFyYW1zLm51bWJlcilcbiAgICAgICAgdGV4dCA9IEBwYXJhbXMudGV4dFxuICAgICAgICB0ZXh0cyA9IHNjZW5lLnRleHRzXG4gICAgICAgIGlmIG5vdCB0ZXh0c1tudW1iZXJdPyB0aGVuIHRleHRzW251bWJlcl0gPSBuZXcgZ3MuT2JqZWN0X1RleHQoKVxuICAgICAgICBcbiAgICAgICAgeCA9IEBpbnRlcnByZXRlci5udW1iZXJWYWx1ZU9mKEBwYXJhbXMucG9zaXRpb24ueClcbiAgICAgICAgeSA9IEBpbnRlcnByZXRlci5udW1iZXJWYWx1ZU9mKEBwYXJhbXMucG9zaXRpb24ueSlcbiAgICAgICAgdGV4dE9iamVjdCA9IHRleHRzW251bWJlcl1cbiAgICAgICAgdGV4dE9iamVjdC5kb21haW4gPSBAcGFyYW1zLm51bWJlckRvbWFpblxuICAgICAgICBcbiAgICAgICAgZWFzaW5nID0gaWYgIWlzTG9ja2VkKGZsYWdzW1wiZWFzaW5nLnR5cGVcIl0pIHRoZW4gZ3MuRWFzaW5ncy5mcm9tVmFsdWVzKEBpbnRlcnByZXRlci5udW1iZXJWYWx1ZU9mKEBwYXJhbXMuZWFzaW5nLnR5cGUpLCBAcGFyYW1zLmVhc2luZy5pbk91dCkgZWxzZSBncy5FYXNpbmdzLmZyb21PYmplY3QoZGVmYXVsdHMuYXBwZWFyRWFzaW5nKVxuICAgICAgICBkdXJhdGlvbiA9IGlmICFpc0xvY2tlZChmbGFncy5kdXJhdGlvbikgdGhlbiBAaW50ZXJwcmV0ZXIuZHVyYXRpb25WYWx1ZU9mKEBwYXJhbXMuZHVyYXRpb24pIGVsc2UgZGVmYXVsdHMuYXBwZWFyRHVyYXRpb25cbiAgICAgICAgb3JpZ2luID0gaWYgIWlzTG9ja2VkKGZsYWdzLm9yaWdpbikgdGhlbiBAcGFyYW1zLm9yaWdpbiBlbHNlIGRlZmF1bHRzLm9yaWdpblxuICAgICAgICB6SW5kZXggPSBpZiAhaXNMb2NrZWQoZmxhZ3Muek9yZGVyKSB0aGVuIEBpbnRlcnByZXRlci5udW1iZXJWYWx1ZU9mKEBwYXJhbXMuek9yZGVyKSBlbHNlIGRlZmF1bHRzLnpPcmRlclxuICAgICAgICBhbmltYXRpb24gPSBpZiAhaXNMb2NrZWQoZmxhZ3NbXCJhbmltYXRpb24udHlwZVwiXSkgdGhlbiBAcGFyYW1zLmFuaW1hdGlvbiBlbHNlIGRlZmF1bHRzLmFwcGVhckFuaW1hdGlvblxuICAgICAgICBwb3NpdGlvbkFuY2hvciA9IGlmICFpc0xvY2tlZChmbGFncy5wb3NpdGlvbk9yaWdpbikgdGhlbiBAaW50ZXJwcmV0ZXIuZ3JhcGhpY0FuY2hvclBvaW50c0J5Q29uc3RhbnRbQHBhcmFtcy5wb3NpdGlvbk9yaWdpbl0gfHwgbmV3IGdzLlBvaW50KDAsIDApIGVsc2UgQGludGVycHJldGVyLmdyYXBoaWNBbmNob3JQb2ludHNCeUNvbnN0YW50W2RlZmF1bHRzLnBvc2l0aW9uT3JpZ2luXVxuICAgICAgICBcbiAgICAgICAgdGV4dE9iamVjdC50ZXh0ID0gdGV4dFxuICAgICAgICB0ZXh0T2JqZWN0LmRzdFJlY3QueCA9IHggXG4gICAgICAgIHRleHRPYmplY3QuZHN0UmVjdC55ID0geSBcbiAgICAgICAgdGV4dE9iamVjdC5ibGVuZE1vZGUgPSBAaW50ZXJwcmV0ZXIubnVtYmVyVmFsdWVPZihAcGFyYW1zLmJsZW5kTW9kZSlcbiAgICAgICAgdGV4dE9iamVjdC5hbmNob3IueCA9IGlmIG9yaWdpbiA9PSAwIHRoZW4gMCBlbHNlIDAuNVxuICAgICAgICB0ZXh0T2JqZWN0LmFuY2hvci55ID0gaWYgb3JpZ2luID09IDAgdGhlbiAwIGVsc2UgMC41XG4gICAgICAgIHRleHRPYmplY3QucG9zaXRpb25BbmNob3IueCA9IHBvc2l0aW9uQW5jaG9yLnhcbiAgICAgICAgdGV4dE9iamVjdC5wb3NpdGlvbkFuY2hvci55ID0gcG9zaXRpb25BbmNob3IueVxuICAgICAgICB0ZXh0T2JqZWN0LnpJbmRleCA9IHpJbmRleCB8fCAgKDcwMCArIG51bWJlcilcbiAgICAgICAgdGV4dE9iamVjdC5zaXplVG9GaXQgPSB5ZXNcbiAgICAgICAgdGV4dE9iamVjdC5mb3JtYXR0aW5nID0geWVzXG4gICAgICAgIGlmIEBwYXJhbXMudmlld3BvcnQ/LnR5cGUgPT0gXCJzY2VuZVwiXG4gICAgICAgICAgICB0ZXh0T2JqZWN0LnZpZXdwb3J0ID0gU2NlbmVNYW5hZ2VyLnNjZW5lLmJlaGF2aW9yLnZpZXdwb3J0XG4gICAgICAgIHRleHRPYmplY3QudXBkYXRlKClcbiAgICAgICAgXG4gICAgICAgIGlmIEBwYXJhbXMucG9zaXRpb25UeXBlID09IDBcbiAgICAgICAgICAgIHAgPSBAaW50ZXJwcmV0ZXIucHJlZGVmaW5lZE9iamVjdFBvc2l0aW9uKEBwYXJhbXMucHJlZGVmaW5lZFBvc2l0aW9uSWQsIHRleHRPYmplY3QsIEBwYXJhbXMpXG4gICAgICAgICAgICB0ZXh0T2JqZWN0LmRzdFJlY3QueCA9IHAueFxuICAgICAgICAgICAgdGV4dE9iamVjdC5kc3RSZWN0LnkgPSBwLnlcbiAgICAgICAgICAgIFxuICAgICAgICB0ZXh0T2JqZWN0LmFuaW1hdG9yLmFwcGVhcih4LCB5LCBhbmltYXRpb24sIGVhc2luZywgZHVyYXRpb24pXG4gICAgICAgIFxuICAgICAgICBpZiBAcGFyYW1zLndhaXRGb3JDb21wbGV0aW9uIGFuZCBub3QgKGR1cmF0aW9uID09IDAgb3IgQGludGVycHJldGVyLmlzSW5zdGFudFNraXAoKSlcbiAgICAgICAgICAgIEBpbnRlcnByZXRlci5pc1dhaXRpbmcgPSB5ZXNcbiAgICAgICAgICAgIEBpbnRlcnByZXRlci53YWl0Q291bnRlciA9IGR1cmF0aW9uXG4gICAgXG4gICAgICAgIGdzLkdhbWVOb3RpZmllci5wb3N0TWlub3JDaGFuZ2UoKVxuICAgICMjIypcbiAgICAqIEBtZXRob2QgY29tbWFuZFRleHRNb3Rpb25CbHVyXG4gICAgKiBAcHJvdGVjdGVkXG4gICAgIyMjICAgICBcbiAgICBjb21tYW5kVGV4dE1vdGlvbkJsdXI6IC0+XG4gICAgICAgIHNjZW5lID0gU2NlbmVNYW5hZ2VyLnNjZW5lXG4gICAgICAgIHNjZW5lLmJlaGF2aW9yLmNoYW5nZVRleHREb21haW4oQHBhcmFtcy5udW1iZXJEb21haW4pXG4gICAgICAgIG51bWJlciA9IEBpbnRlcnByZXRlci5udW1iZXJWYWx1ZU9mKEBwYXJhbXMubnVtYmVyKVxuICAgICAgICB0ZXh0ID0gc2NlbmUudGV4dHNbbnVtYmVyXVxuICAgICAgICBpZiBub3QgdGV4dD8gdGhlbiByZXR1cm5cbiAgICAgICAgXG4gICAgICAgIHRleHQubW90aW9uQmx1ci5zZXQoQHBhcmFtcy5tb3Rpb25CbHVyKVxuICAgICBcbiAgICAjIyMqXG4gICAgKiBAbWV0aG9kIGNvbW1hbmRSZWZyZXNoVGV4dFxuICAgICogQHByb3RlY3RlZFxuICAgICMjIyAgICAgXG4gICAgY29tbWFuZFJlZnJlc2hUZXh0OiAtPlxuICAgICAgICBzY2VuZSA9IFNjZW5lTWFuYWdlci5zY2VuZVxuICAgICAgICBzY2VuZS5iZWhhdmlvci5jaGFuZ2VUZXh0RG9tYWluKEBwYXJhbXMubnVtYmVyRG9tYWluKVxuICAgICAgICBudW1iZXIgPSBAaW50ZXJwcmV0ZXIubnVtYmVyVmFsdWVPZihAcGFyYW1zLm51bWJlcilcbiAgICAgICAgdGV4dHMgPSBzY2VuZS50ZXh0c1xuICAgICAgICBpZiBub3QgdGV4dHNbbnVtYmVyXT8gdGhlbiByZXR1cm5cblxuICAgICAgICB0ZXh0c1tudW1iZXJdLmJlaGF2aW9yLnJlZnJlc2goeWVzKVxuICAgIFxuICAgICMjIypcbiAgICAqIEBtZXRob2QgY29tbWFuZE1vdmVUZXh0XG4gICAgKiBAcHJvdGVjdGVkXG4gICAgIyMjICAgIFxuICAgIGNvbW1hbmRNb3ZlVGV4dDogLT5cbiAgICAgICAgc2NlbmUgPSBTY2VuZU1hbmFnZXIuc2NlbmVcbiAgICAgICAgc2NlbmUuYmVoYXZpb3IuY2hhbmdlVGV4dERvbWFpbihAcGFyYW1zLm51bWJlckRvbWFpbilcbiAgICAgICAgbnVtYmVyID0gQGludGVycHJldGVyLm51bWJlclZhbHVlT2YoQHBhcmFtcy5udW1iZXIpXG4gICAgICAgIHRleHQgPSBzY2VuZS50ZXh0c1tudW1iZXJdXG4gICAgICAgIGlmIG5vdCB0ZXh0PyB0aGVuIHJldHVyblxuICAgICAgICBcbiAgICAgICAgQGludGVycHJldGVyLm1vdmVPYmplY3QodGV4dCwgQHBhcmFtcy5waWN0dXJlLnBvc2l0aW9uLCBAcGFyYW1zKVxuICAgICAgICBcbiAgICAgICAgZ3MuR2FtZU5vdGlmaWVyLnBvc3RNaW5vckNoYW5nZSgpXG4gICAgIyMjKlxuICAgICogQG1ldGhvZCBjb21tYW5kTW92ZVRleHRQYXRoXG4gICAgKiBAcHJvdGVjdGVkXG4gICAgIyMjICAgIFxuICAgIGNvbW1hbmRNb3ZlVGV4dFBhdGg6IC0+XG4gICAgICAgIHNjZW5lID0gU2NlbmVNYW5hZ2VyLnNjZW5lXG4gICAgICAgIHNjZW5lLmJlaGF2aW9yLmNoYW5nZVRleHREb21haW4oQHBhcmFtcy5udW1iZXJEb21haW4pXG4gICAgICAgIG51bWJlciA9IEBpbnRlcnByZXRlci5udW1iZXJWYWx1ZU9mKEBwYXJhbXMubnVtYmVyKVxuICAgICAgICB0ZXh0ID0gc2NlbmUudGV4dHNbbnVtYmVyXVxuICAgICAgICBpZiBub3QgdGV4dD8gdGhlbiByZXR1cm5cbiAgICAgICAgXG4gICAgICAgIEBpbnRlcnByZXRlci5tb3ZlT2JqZWN0UGF0aCh0ZXh0LCBAcGFyYW1zLnBhdGgsIEBwYXJhbXMpXG4gICAgICAgIFxuICAgICAgICBncy5HYW1lTm90aWZpZXIucG9zdE1pbm9yQ2hhbmdlKClcbiAgICAjIyMqXG4gICAgKiBAbWV0aG9kIGNvbW1hbmRSb3RhdGVUZXh0XG4gICAgKiBAcHJvdGVjdGVkXG4gICAgIyMjICAgIFxuICAgIGNvbW1hbmRSb3RhdGVUZXh0OiAtPlxuICAgICAgICBzY2VuZSA9IFNjZW5lTWFuYWdlci5zY2VuZVxuICAgICAgICBzY2VuZS5iZWhhdmlvci5jaGFuZ2VUZXh0RG9tYWluKEBwYXJhbXMubnVtYmVyRG9tYWluKVxuICAgICAgICBudW1iZXIgPSBAaW50ZXJwcmV0ZXIubnVtYmVyVmFsdWVPZihAcGFyYW1zLm51bWJlcilcbiAgICAgICAgdGV4dCA9IHNjZW5lLnRleHRzW251bWJlcl1cbiAgICAgICAgaWYgbm90IHRleHQ/IHRoZW4gcmV0dXJuXG4gICAgICAgIFxuICAgICAgICBAaW50ZXJwcmV0ZXIucm90YXRlT2JqZWN0KHRleHQsIEBwYXJhbXMpXG4gICAgICAgIFxuICAgICAgICBncy5HYW1lTm90aWZpZXIucG9zdE1pbm9yQ2hhbmdlKClcbiAgICAjIyMqXG4gICAgKiBAbWV0aG9kIGNvbW1hbmRab29tVGV4dFxuICAgICogQHByb3RlY3RlZFxuICAgICMjIyAgICAgXG4gICAgY29tbWFuZFpvb21UZXh0OiAtPlxuICAgICAgICBzY2VuZSA9IFNjZW5lTWFuYWdlci5zY2VuZVxuICAgICAgICBzY2VuZS5iZWhhdmlvci5jaGFuZ2VUZXh0RG9tYWluKEBwYXJhbXMubnVtYmVyRG9tYWluKVxuICAgICAgICBudW1iZXIgPSBAaW50ZXJwcmV0ZXIubnVtYmVyVmFsdWVPZihAcGFyYW1zLm51bWJlcilcbiAgICAgICAgdGV4dCA9IHNjZW5lLnRleHRzW251bWJlcl1cbiAgICAgICAgaWYgbm90IHRleHQ/IHRoZW4gcmV0dXJuXG4gICAgICAgIFxuICAgICAgICBAaW50ZXJwcmV0ZXIuem9vbU9iamVjdCh0ZXh0LCBAcGFyYW1zKVxuICAgICAgICBcbiAgICAgICAgZ3MuR2FtZU5vdGlmaWVyLnBvc3RNaW5vckNoYW5nZSgpXG4gICAgICAgIFxuICAgICMjIypcbiAgICAqIEBtZXRob2QgY29tbWFuZEJsZW5kVGV4dFxuICAgICogQHByb3RlY3RlZFxuICAgICMjI1xuICAgIGNvbW1hbmRCbGVuZFRleHQ6IC0+XG4gICAgICAgIFNjZW5lTWFuYWdlci5zY2VuZS5iZWhhdmlvci5jaGFuZ2VUZXh0RG9tYWluKEBwYXJhbXMubnVtYmVyRG9tYWluKVxuICAgICAgICB0ZXh0ID0gU2NlbmVNYW5hZ2VyLnNjZW5lLnRleHRzW0BpbnRlcnByZXRlci5udW1iZXJWYWx1ZU9mKEBwYXJhbXMubnVtYmVyKV1cbiAgICAgICAgaWYgbm90IHRleHQ/IHRoZW4gcmV0dXJuXG4gICAgICAgIFxuICAgICAgICBAaW50ZXJwcmV0ZXIuYmxlbmRPYmplY3QodGV4dCwgQHBhcmFtcykgIFxuICAgICAgICBncy5HYW1lTm90aWZpZXIucG9zdE1pbm9yQ2hhbmdlKClcbiAgICAjIyMqXG4gICAgKiBAbWV0aG9kIGNvbW1hbmRDb2xvclRleHRcbiAgICAqIEBwcm90ZWN0ZWRcbiAgICAjIyMgICAgICBcbiAgICBjb21tYW5kQ29sb3JUZXh0OiAtPlxuICAgICAgICBzY2VuZSA9IFNjZW5lTWFuYWdlci5zY2VuZVxuICAgICAgICBzY2VuZS5iZWhhdmlvci5jaGFuZ2VUZXh0RG9tYWluKEBwYXJhbXMubnVtYmVyRG9tYWluKVxuICAgICAgICBudW1iZXIgPSBAaW50ZXJwcmV0ZXIubnVtYmVyVmFsdWVPZihAcGFyYW1zLm51bWJlcilcbiAgICAgICAgdGV4dCA9IHNjZW5lLnRleHRzW251bWJlcl1cbiAgICAgICAgZHVyYXRpb24gPSBAaW50ZXJwcmV0ZXIuZHVyYXRpb25WYWx1ZU9mKEBwYXJhbXMuZHVyYXRpb24pXG4gICAgICAgIGVhc2luZyA9IGdzLkVhc2luZ3MuZnJvbU9iamVjdChAcGFyYW1zLmVhc2luZylcbiAgICAgICAgXG4gICAgICAgIGlmIHRleHQ/XG4gICAgICAgICAgICB0ZXh0LmFuaW1hdG9yLmNvbG9yVG8obmV3IENvbG9yKEBwYXJhbXMuY29sb3IpLCBkdXJhdGlvbiwgZWFzaW5nKVxuICAgICAgICAgICAgaWYgQHBhcmFtcy53YWl0Rm9yQ29tcGxldGlvbiBhbmQgbm90IChkdXJhdGlvbiA9PSAwIG9yIEBpbnRlcnByZXRlci5pc0luc3RhbnRTa2lwKCkpXG4gICAgICAgICAgICAgICAgQGludGVycHJldGVyLmlzV2FpdGluZyA9IHllc1xuICAgICAgICAgICAgICAgIEBpbnRlcnByZXRlci53YWl0Q291bnRlciA9IGR1cmF0aW9uIFxuICAgICAgICBncy5HYW1lTm90aWZpZXIucG9zdE1pbm9yQ2hhbmdlKClcbiAgICAjIyMqXG4gICAgKiBAbWV0aG9kIGNvbW1hbmRFcmFzZVRleHRcbiAgICAqIEBwcm90ZWN0ZWRcbiAgICAjIyMgICAgICAgICAgICAgXG4gICAgY29tbWFuZEVyYXNlVGV4dDogLT5cbiAgICAgICAgZGVmYXVsdHMgPSBHYW1lTWFuYWdlci5kZWZhdWx0cy50ZXh0XG4gICAgICAgIGZsYWdzID0gQHBhcmFtcy5maWVsZEZsYWdzIHx8IHt9XG4gICAgICAgIGlzTG9ja2VkID0gZ3MuQ29tbWFuZEZpZWxkRmxhZ3MuaXNMb2NrZWRcbiAgICAgICAgc2NlbmUgPSBTY2VuZU1hbmFnZXIuc2NlbmVcbiAgICAgICAgc2NlbmUuYmVoYXZpb3IuY2hhbmdlVGV4dERvbWFpbihAcGFyYW1zLm51bWJlckRvbWFpbilcbiAgICAgICAgbnVtYmVyID0gQGludGVycHJldGVyLm51bWJlclZhbHVlT2YoQHBhcmFtcy5udW1iZXIpXG4gICAgICAgIHRleHQgPSBzY2VuZS50ZXh0c1tudW1iZXJdXG4gICAgICAgIGlmIG5vdCB0ZXh0PyB0aGVuIHJldHVyblxuICAgICAgICBcbiAgICAgICAgZWFzaW5nID0gaWYgIWlzTG9ja2VkKGZsYWdzW1wiZWFzaW5nLnR5cGVcIl0pIHRoZW4gZ3MuRWFzaW5ncy5mcm9tVmFsdWVzKEBpbnRlcnByZXRlci5udW1iZXJWYWx1ZU9mKEBwYXJhbXMuZWFzaW5nLnR5cGUpLCBAcGFyYW1zLmVhc2luZy5pbk91dCkgZWxzZSBncy5FYXNpbmdzLmZyb21PYmplY3QoZGVmYXVsdHMuZGlzYXBwZWFyRWFzaW5nKVxuICAgICAgICBkdXJhdGlvbiA9IGlmICFpc0xvY2tlZChmbGFncy5kdXJhdGlvbikgdGhlbiBAaW50ZXJwcmV0ZXIuZHVyYXRpb25WYWx1ZU9mKEBwYXJhbXMuZHVyYXRpb24pIGVsc2UgZGVmYXVsdHMuZGlzYXBwZWFyRHVyYXRpb25cbiAgICAgICAgYW5pbWF0aW9uID0gaWYgIWlzTG9ja2VkKGZsYWdzW1wiYW5pbWF0aW9uLnR5cGVcIl0pIHRoZW4gQHBhcmFtcy5hbmltYXRpb24gZWxzZSBkZWZhdWx0cy5kaXNhcHBlYXJBbmltYXRpb25cbiAgICAgICAgXG4gICAgICAgIFxuICAgICAgICB0ZXh0LmFuaW1hdG9yLmRpc2FwcGVhcihhbmltYXRpb24sIGVhc2luZywgZHVyYXRpb24sIChzZW5kZXIpID0+IFxuICAgICAgICAgICAgc2VuZGVyLmRpc3Bvc2UoKVxuICAgICAgICAgICAgc2NlbmUuYmVoYXZpb3IuY2hhbmdlVGV4dERvbWFpbihzZW5kZXIuZG9tYWluKVxuICAgICAgICAgICAgc2NlbmUudGV4dHNbbnVtYmVyXSA9IG51bGxcbiAgICAgICAgKVxuICAgICAgICBcbiAgICAgICAgaWYgQHBhcmFtcy53YWl0Rm9yQ29tcGxldGlvbiBhbmQgbm90IChkdXJhdGlvbiA9PSAwIG9yIEBpbnRlcnByZXRlci5pc0luc3RhbnRTa2lwKCkpXG4gICAgICAgICAgICBAaW50ZXJwcmV0ZXIuaXNXYWl0aW5nID0geWVzXG4gICAgICAgICAgICBAaW50ZXJwcmV0ZXIud2FpdENvdW50ZXIgPSBkdXJhdGlvbiBcbiAgICAgICAgZ3MuR2FtZU5vdGlmaWVyLnBvc3RNaW5vckNoYW5nZSgpXG4gICAgIyMjKlxuICAgICogQG1ldGhvZCBjb21tYW5kVGV4dEVmZmVjdFxuICAgICogQHByb3RlY3RlZFxuICAgICMjI1xuICAgIGNvbW1hbmRUZXh0RWZmZWN0OiAtPlxuICAgICAgICBzY2VuZSA9IFNjZW5lTWFuYWdlci5zY2VuZVxuICAgICAgICBzY2VuZS5iZWhhdmlvci5jaGFuZ2VUZXh0RG9tYWluKEBwYXJhbXMubnVtYmVyRG9tYWluKVxuICAgICAgICBudW1iZXIgPSBAaW50ZXJwcmV0ZXIubnVtYmVyVmFsdWVPZihAcGFyYW1zLm51bWJlcilcbiAgICAgICAgdGV4dCA9IHNjZW5lLnRleHRzW251bWJlcl1cbiAgICAgICAgaWYgbm90IHRleHQ/IHRoZW4gcmV0dXJuXG4gICAgICAgIFxuICAgICAgICBAaW50ZXJwcmV0ZXIub2JqZWN0RWZmZWN0KHRleHQsIEBwYXJhbXMpXG4gICAgICAgIGdzLkdhbWVOb3RpZmllci5wb3N0TWlub3JDaGFuZ2UoKVxuICAgICMjIypcbiAgICAqIEBtZXRob2QgY29tbWFuZElucHV0VGV4dFxuICAgICogQHByb3RlY3RlZFxuICAgICMjIyBcbiAgICBjb21tYW5kSW5wdXRUZXh0OiAtPlxuICAgICAgICBzY2VuZSA9IFNjZW5lTWFuYWdlci5zY2VuZVxuICAgICAgICBzY2VuZS5iZWhhdmlvci5jaGFuZ2VUZXh0RG9tYWluKEBwYXJhbXMubnVtYmVyRG9tYWluKVxuICAgICAgICBpZiAoR2FtZU1hbmFnZXIuc2V0dGluZ3MuYWxsb3dDaG9pY2VTa2lwfHxAaW50ZXJwcmV0ZXIucHJldmlldykgYW5kIEdhbWVNYW5hZ2VyLnRlbXBTZXR0aW5ncy5za2lwXG4gICAgICAgICAgICBAaW50ZXJwcmV0ZXIubWVzc2FnZU9iamVjdCgpLmJlaGF2aW9yLmNsZWFyKClcbiAgICAgICAgICAgIEBpbnRlcnByZXRlci5zZXRTdHJpbmdWYWx1ZVRvKEBwYXJhbXMudmFyaWFibGUsIFwiXCIpXG4gICAgICAgICAgICByZXR1cm5cbiAgICAgICAgICAgIFxuICAgICAgICBAaW50ZXJwcmV0ZXIuaXNXYWl0aW5nID0geWVzXG4gICAgICAgIGlmIEBpbnRlcnByZXRlci5pc1Byb2Nlc3NpbmdNZXNzYWdlSW5PdGhlckNvbnRleHQoKVxuICAgICAgICAgICAgQGludGVycHJldGVyLndhaXRGb3JNZXNzYWdlKClcbiAgICAgICAgICAgIHJldHVyblxuICAgICAgICBcbiAgICAgICAgJHRlbXBGaWVsZHMubGV0dGVycyA9IEBwYXJhbXMubGV0dGVyc1xuICAgICAgICBzY2VuZS5iZWhhdmlvci5zaG93SW5wdXRUZXh0KEBwYXJhbXMubGV0dGVycywgZ3MuQ2FsbEJhY2soXCJvbklucHV0VGV4dEZpbmlzaFwiLCBAaW50ZXJwcmV0ZXIsIEBpbnRlcnByZXRlcikpICBcbiAgICAgICAgQGludGVycHJldGVyLndhaXRpbmdGb3IuaW5wdXRUZXh0ID0gQHBhcmFtc1xuICAgICAgICBncy5HYW1lTm90aWZpZXIucG9zdE1pbm9yQ2hhbmdlKClcbiAgICAjIyMqXG4gICAgKiBAbWV0aG9kIGNvbW1hbmRTYXZlUGVyc2lzdGVudERhdGFcbiAgICAqIEBwcm90ZWN0ZWRcbiAgICAjIyMgXG4gICAgY29tbWFuZFNhdmVQZXJzaXN0ZW50RGF0YTogLT4gR2FtZU1hbmFnZXIuc2F2ZUdsb2JhbERhdGEoKVxuICAgIFxuICAgICMjIypcbiAgICAqIEBtZXRob2QgY29tbWFuZFNhdmVTZXR0aW5nc1xuICAgICogQHByb3RlY3RlZFxuICAgICMjIyBcbiAgICBjb21tYW5kU2F2ZVNldHRpbmdzOiAtPiBHYW1lTWFuYWdlci5zYXZlU2V0dGluZ3MoKVxuICAgIFxuICAgICMjIypcbiAgICAqIEBtZXRob2QgY29tbWFuZFByZXBhcmVTYXZlR2FtZVxuICAgICogQHByb3RlY3RlZFxuICAgICMjIyBcbiAgICBjb21tYW5kUHJlcGFyZVNhdmVHYW1lOiAtPlxuICAgICAgICBpZiBAaW50ZXJwcmV0ZXIucHJldmlld0RhdGE/IHRoZW4gcmV0dXJuXG4gICAgICAgIFxuICAgICAgICBAaW50ZXJwcmV0ZXIucG9pbnRlcisrXG4gICAgICAgIEdhbWVNYW5hZ2VyLnByZXBhcmVTYXZlR2FtZShAcGFyYW1zLnNuYXBzaG90KVxuICAgICAgICBAaW50ZXJwcmV0ZXIucG9pbnRlci0tXG4gICAgICAgIFxuICAgICMjIypcbiAgICAqIEBtZXRob2QgY29tbWFuZFNhdmVHYW1lXG4gICAgKiBAcHJvdGVjdGVkXG4gICAgIyMjIFxuICAgIGNvbW1hbmRTYXZlR2FtZTogLT5cbiAgICAgICAgaWYgQGludGVycHJldGVyLnByZXZpZXdEYXRhPyB0aGVuIHJldHVyblxuICAgICAgICBcbiAgICAgICAgdGh1bWJXaWR0aCA9IEBpbnRlcnByZXRlci5udW1iZXJWYWx1ZU9mKEBwYXJhbXMudGh1bWJXaWR0aClcbiAgICAgICAgdGh1bWJIZWlnaHQgPSBAaW50ZXJwcmV0ZXIubnVtYmVyVmFsdWVPZihAcGFyYW1zLnRodW1iSGVpZ2h0KVxuICAgICAgICBcbiAgICAgICAgR2FtZU1hbmFnZXIuc2F2ZShAaW50ZXJwcmV0ZXIubnVtYmVyVmFsdWVPZihAcGFyYW1zLnNsb3QpIC0gMSwgdGh1bWJXaWR0aCwgdGh1bWJIZWlnaHQpXG4gICAgICAgIFxuICAgICMjIypcbiAgICAqIEBtZXRob2QgY29tbWFuZExvYWRHYW1lXG4gICAgKiBAcHJvdGVjdGVkXG4gICAgIyMjIFxuICAgIGNvbW1hbmRMb2FkR2FtZTogLT5cbiAgICAgICAgaWYgQGludGVycHJldGVyLnByZXZpZXdEYXRhPyB0aGVuIHJldHVyblxuICAgICAgICBcbiAgICAgICAgR2FtZU1hbmFnZXIubG9hZChAaW50ZXJwcmV0ZXIubnVtYmVyVmFsdWVPZihAcGFyYW1zLnNsb3QpIC0gMSlcbiAgICAgICAgXG4gICAgIyMjKlxuICAgICogQG1ldGhvZCBjb21tYW5kV2FpdEZvcklucHV0XG4gICAgKiBAcHJvdGVjdGVkXG4gICAgIyMjIFxuICAgIGNvbW1hbmRXYWl0Rm9ySW5wdXQ6IC0+XG4gICAgICAgIHJldHVybiBpZiBAaW50ZXJwcmV0ZXIuaXNJbnN0YW50U2tpcCgpXG4gICAgICAgIFxuICAgICAgICBncy5HbG9iYWxFdmVudE1hbmFnZXIub2ZmQnlPd25lcihcIm1vdXNlRG93blwiLCBAaW50ZXJwcmV0ZXIub2JqZWN0KVxuICAgICAgICBncy5HbG9iYWxFdmVudE1hbmFnZXIub2ZmQnlPd25lcihcIm1vdXNlVXBcIiwgQGludGVycHJldGVyLm9iamVjdClcbiAgICAgICAgZ3MuR2xvYmFsRXZlbnRNYW5hZ2VyLm9mZkJ5T3duZXIoXCJrZXlEb3duXCIsIEBpbnRlcnByZXRlci5vYmplY3QpXG4gICAgICAgIGdzLkdsb2JhbEV2ZW50TWFuYWdlci5vZmZCeU93bmVyKFwia2V5VXBcIiwgQGludGVycHJldGVyLm9iamVjdClcbiAgICAgICAgXG4gICAgICAgIGYgPSA9PlxuICAgICAgICAgICAga2V5ID0gQGludGVycHJldGVyLm51bWJlclZhbHVlT2YoQHBhcmFtcy5rZXkpXG4gICAgICAgICAgICBleGVjdXRlQWN0aW9uID0gbm9cbiAgICAgICAgICAgIGlmIElucHV0Lk1vdXNlLmlzQnV0dG9uKEBwYXJhbXMua2V5KVxuICAgICAgICAgICAgICAgIGV4ZWN1dGVBY3Rpb24gPSBJbnB1dC5Nb3VzZS5idXR0b25zW0BwYXJhbXMua2V5XSA9PSBAcGFyYW1zLnN0YXRlXG4gICAgICAgICAgICBlbHNlIGlmIEBwYXJhbXMua2V5ID09IDEwMFxuICAgICAgICAgICAgICAgIGV4ZWN1dGVBY3Rpb24gPSB5ZXMgaWYgSW5wdXQua2V5RG93biBhbmQgQHBhcmFtcy5zdGF0ZSA9PSAxXG4gICAgICAgICAgICAgICAgZXhlY3V0ZUFjdGlvbiA9IHllcyBpZiBJbnB1dC5rZXlVcCBhbmQgQHBhcmFtcy5zdGF0ZSA9PSAyXG4gICAgICAgICAgICBlbHNlIGlmIEBwYXJhbXMua2V5ID09IDEwMVxuICAgICAgICAgICAgICAgIGV4ZWN1dGVBY3Rpb24gPSB5ZXMgaWYgSW5wdXQuTW91c2UuYnV0dG9uRG93biBhbmQgQHBhcmFtcy5zdGF0ZSA9PSAxXG4gICAgICAgICAgICAgICAgZXhlY3V0ZUFjdGlvbiA9IHllcyBpZiBJbnB1dC5Nb3VzZS5idXR0b25VcCBhbmQgQHBhcmFtcy5zdGF0ZSA9PSAyXG4gICAgICAgICAgICBlbHNlIGlmIEBwYXJhbXMua2V5ID09IDEwMlxuICAgICAgICAgICAgICAgIGV4ZWN1dGVBY3Rpb24gPSB5ZXMgaWYgKElucHV0LmtleURvd24gb3IgSW5wdXQuTW91c2UuYnV0dG9uRG93bikgYW5kIEBwYXJhbXMuc3RhdGUgPT0gMVxuICAgICAgICAgICAgICAgIGV4ZWN1dGVBY3Rpb24gPSB5ZXMgaWYgKElucHV0LmtleVVwIG9yIElucHV0Lk1vdXNlLmJ1dHRvblVwKSBhbmQgQHBhcmFtcy5zdGF0ZSA9PSAyXG4gICAgICAgICAgICBlbHNlXG4gICAgICAgICAgICAgICAga2V5ID0gaWYga2V5ID4gMTAwIHRoZW4ga2V5IC0gMTAwIGVsc2Uga2V5XG4gICAgICAgICAgICAgICAgZXhlY3V0ZUFjdGlvbiA9IElucHV0LmtleXNba2V5XSA9PSBAcGFyYW1zLnN0YXRlXG4gICAgICAgICAgICAgICAgXG4gICAgICAgICAgICAgICAgXG4gICAgICAgICAgICBpZiBleGVjdXRlQWN0aW9uXG4gICAgICAgICAgICAgICAgQGludGVycHJldGVyLmlzV2FpdGluZyA9IG5vXG4gICAgICAgICAgICBcbiAgICAgICAgICAgICAgICBncy5HbG9iYWxFdmVudE1hbmFnZXIub2ZmQnlPd25lcihcIm1vdXNlRG93blwiLCBAaW50ZXJwcmV0ZXIub2JqZWN0KVxuICAgICAgICAgICAgICAgIGdzLkdsb2JhbEV2ZW50TWFuYWdlci5vZmZCeU93bmVyKFwibW91c2VVcFwiLCBAaW50ZXJwcmV0ZXIub2JqZWN0KVxuICAgICAgICAgICAgICAgIGdzLkdsb2JhbEV2ZW50TWFuYWdlci5vZmZCeU93bmVyKFwia2V5RG93blwiLCBAaW50ZXJwcmV0ZXIub2JqZWN0KVxuICAgICAgICAgICAgICAgIGdzLkdsb2JhbEV2ZW50TWFuYWdlci5vZmZCeU93bmVyKFwia2V5VXBcIiwgQGludGVycHJldGVyLm9iamVjdClcbiAgICAgICAgICAgIFxuICAgICAgICBncy5HbG9iYWxFdmVudE1hbmFnZXIub24gXCJtb3VzZURvd25cIiwgZiwgbnVsbCwgQGludGVycHJldGVyLm9iamVjdFxuICAgICAgICBncy5HbG9iYWxFdmVudE1hbmFnZXIub24gXCJtb3VzZVVwXCIsIGYsIG51bGwsIEBpbnRlcnByZXRlci5vYmplY3RcbiAgICAgICAgZ3MuR2xvYmFsRXZlbnRNYW5hZ2VyLm9uIFwia2V5RG93blwiLCBmLCBudWxsLCBAaW50ZXJwcmV0ZXIub2JqZWN0XG4gICAgICAgIGdzLkdsb2JhbEV2ZW50TWFuYWdlci5vbiBcImtleVVwXCIsIGYsIG51bGwsIEBpbnRlcnByZXRlci5vYmplY3RcbiAgICAgICAgICAgICAgICBcbiAgICAgICAgQGludGVycHJldGVyLmlzV2FpdGluZyA9IHllc1xuICAgIFxuICAgICMjIypcbiAgICAqIEBtZXRob2QgY29tbWFuZEdldElucHV0RGF0YVxuICAgICogQHByb3RlY3RlZFxuICAgICMjI1xuICAgIGNvbW1hbmRHZXRJbnB1dERhdGE6IC0+XG4gICAgICAgIHN3aXRjaCBAcGFyYW1zLmZpZWxkXG4gICAgICAgICAgICB3aGVuIDAgIyBCdXR0b24gQVxuICAgICAgICAgICAgICAgIEBpbnRlcnByZXRlci5zZXROdW1iZXJWYWx1ZVRvKEBwYXJhbXMudGFyZ2V0VmFyaWFibGUsIElucHV0LmtleXNbSW5wdXQuQV0pXG4gICAgICAgICAgICB3aGVuIDEgIyBCdXR0b24gQlxuICAgICAgICAgICAgICAgIEBpbnRlcnByZXRlci5zZXROdW1iZXJWYWx1ZVRvKEBwYXJhbXMudGFyZ2V0VmFyaWFibGUsIElucHV0LmtleXNbSW5wdXQuQl0pXG4gICAgICAgICAgICB3aGVuIDIgIyBCdXR0b24gWFxuICAgICAgICAgICAgICAgIEBpbnRlcnByZXRlci5zZXROdW1iZXJWYWx1ZVRvKEBwYXJhbXMudGFyZ2V0VmFyaWFibGUsIElucHV0LmtleXNbSW5wdXQuWF0pXG4gICAgICAgICAgICB3aGVuIDMgIyBCdXR0b24gWVxuICAgICAgICAgICAgICAgIEBpbnRlcnByZXRlci5zZXROdW1iZXJWYWx1ZVRvKEBwYXJhbXMudGFyZ2V0VmFyaWFibGUsIElucHV0LmtleXNbSW5wdXQuWV0pXG4gICAgICAgICAgICB3aGVuIDQgIyBCdXR0b24gTFxuICAgICAgICAgICAgICAgIEBpbnRlcnByZXRlci5zZXROdW1iZXJWYWx1ZVRvKEBwYXJhbXMudGFyZ2V0VmFyaWFibGUsIElucHV0LmtleXNbSW5wdXQuTF0pXG4gICAgICAgICAgICB3aGVuIDUgIyBCdXR0b24gUlxuICAgICAgICAgICAgICAgIEBpbnRlcnByZXRlci5zZXROdW1iZXJWYWx1ZVRvKEBwYXJhbXMudGFyZ2V0VmFyaWFibGUsIElucHV0LmtleXNbSW5wdXQuUl0pXG4gICAgICAgICAgICB3aGVuIDYgIyBCdXR0b24gU1RBUlRcbiAgICAgICAgICAgICAgICBAaW50ZXJwcmV0ZXIuc2V0TnVtYmVyVmFsdWVUbyhAcGFyYW1zLnRhcmdldFZhcmlhYmxlLCBJbnB1dC5rZXlzW0lucHV0LlNUQVJUXSlcbiAgICAgICAgICAgIHdoZW4gNyAjIEJ1dHRvbiBTRUxFQ1RcbiAgICAgICAgICAgICAgICBAaW50ZXJwcmV0ZXIuc2V0TnVtYmVyVmFsdWVUbyhAcGFyYW1zLnRhcmdldFZhcmlhYmxlLCBJbnB1dC5rZXlzW0lucHV0LlNFTEVDVF0pXG4gICAgICAgICAgICB3aGVuIDggIyBNb3VzZSBYXG4gICAgICAgICAgICAgICAgQGludGVycHJldGVyLnNldE51bWJlclZhbHVlVG8oQHBhcmFtcy50YXJnZXRWYXJpYWJsZSwgSW5wdXQuTW91c2UueClcbiAgICAgICAgICAgIHdoZW4gOSAjIE1vdXNlIFlcbiAgICAgICAgICAgICAgICBAaW50ZXJwcmV0ZXIuc2V0TnVtYmVyVmFsdWVUbyhAcGFyYW1zLnRhcmdldFZhcmlhYmxlLCBJbnB1dC5Nb3VzZS55KVxuICAgICAgICAgICAgd2hlbiAxMCAjIE1vdXNlIFdoZWVsXG4gICAgICAgICAgICAgICAgQGludGVycHJldGVyLnNldE51bWJlclZhbHVlVG8oQHBhcmFtcy50YXJnZXRWYXJpYWJsZSwgSW5wdXQuTW91c2Uud2hlZWwpXG4gICAgICAgICAgICB3aGVuIDExICMgTW91c2UgTGVmdFxuICAgICAgICAgICAgICAgIEBpbnRlcnByZXRlci5zZXROdW1iZXJWYWx1ZVRvKEBwYXJhbXMudGFyZ2V0VmFyaWFibGUsIElucHV0Lk1vdXNlLmJ1dHRvbnNbSW5wdXQuTW91c2UuTEVGVF0pXG4gICAgICAgICAgICB3aGVuIDEyICMgTW91c2UgUmlnaHRcbiAgICAgICAgICAgICAgICBAaW50ZXJwcmV0ZXIuc2V0TnVtYmVyVmFsdWVUbyhAcGFyYW1zLnRhcmdldFZhcmlhYmxlLCBJbnB1dC5Nb3VzZS5idXR0b25zW0lucHV0Lk1vdXNlLlJJR0hUXSlcbiAgICAgICAgICAgIHdoZW4gMTMgIyBNb3VzZSBNaWRkbGVcbiAgICAgICAgICAgICAgICBAaW50ZXJwcmV0ZXIuc2V0TnVtYmVyVmFsdWVUbyhAcGFyYW1zLnRhcmdldFZhcmlhYmxlLCBJbnB1dC5Nb3VzZS5idXR0b25zW0lucHV0Lk1vdXNlLk1JRERMRV0pXG4gICAgICAgICAgICB3aGVuIDEwMCAjIEFueSBLZXlcbiAgICAgICAgICAgICAgICBhbnlLZXkgPSAwXG4gICAgICAgICAgICAgICAgYW55S2V5ID0gMSBpZiBJbnB1dC5rZXlEb3duXG4gICAgICAgICAgICAgICAgYW55S2V5ID0gMiBpZiBJbnB1dC5rZXlVcFxuICAgICAgICAgICAgICAgIEBpbnRlcnByZXRlci5zZXROdW1iZXJWYWx1ZVRvKEBwYXJhbXMudGFyZ2V0VmFyaWFibGUsIGFueUtleSlcbiAgICAgICAgICAgIHdoZW4gMTAxICMgQW55IEJ1dHRvblxuICAgICAgICAgICAgICAgIGFueUJ1dHRvbiA9IDBcbiAgICAgICAgICAgICAgICBhbnlCdXR0b24gPSAxIGlmIElucHV0Lk1vdXNlLmJ1dHRvbkRvd25cbiAgICAgICAgICAgICAgICBhbnlCdXR0b24gPSAyIGlmIElucHV0Lk1vdXNlLmJ1dHRvblVwXG4gICAgICAgICAgICAgICAgQGludGVycHJldGVyLnNldE51bWJlclZhbHVlVG8oQHBhcmFtcy50YXJnZXRWYXJpYWJsZSwgYW55QnV0dG9uKVxuICAgICAgICAgICAgd2hlbiAxMDIgIyBBbnkgSW5wdXRcbiAgICAgICAgICAgICAgICBhbnlJbnB1dCA9IDBcbiAgICAgICAgICAgICAgICBhbnlJbnB1dCA9IDEgaWYgSW5wdXQuTW91c2UuYnV0dG9uRG93biBvciBJbnB1dC5rZXlEb3duXG4gICAgICAgICAgICAgICAgYW55SW5wdXQgPSAyIGlmIElucHV0Lk1vdXNlLmJ1dHRvblVwIG9yIElucHV0LmtleVVwXG4gICAgICAgICAgICAgICAgQGludGVycHJldGVyLnNldE51bWJlclZhbHVlVG8oQHBhcmFtcy50YXJnZXRWYXJpYWJsZSwgYW55SW5wdXQpXG4gICAgICAgICAgICBlbHNlXG4gICAgICAgICAgICAgICAgY29kZSA9IEBwYXJhbXMuZmllbGQgLSAxMDBcbiAgICAgICAgICAgICAgICBAaW50ZXJwcmV0ZXIuc2V0TnVtYmVyVmFsdWVUbyhAcGFyYW1zLnRhcmdldFZhcmlhYmxlLCBJbnB1dC5rZXlzW2NvZGVdKVxuICAgICMjIypcbiAgICAqIEBtZXRob2QgY29tbWFuZEdldEdhbWVEYXRhXG4gICAgKiBAcHJvdGVjdGVkXG4gICAgIyMjICAgICAgICAgICAgXG4gICAgY29tbWFuZEdldEdhbWVEYXRhOiAtPlxuICAgICAgICB0ZW1wU2V0dGluZ3MgPSBHYW1lTWFuYWdlci50ZW1wU2V0dGluZ3NcbiAgICAgICAgc2V0dGluZ3MgPSBHYW1lTWFuYWdlci5zZXR0aW5nc1xuICAgICAgICBcbiAgICAgICAgc3dpdGNoIEBwYXJhbXMuZmllbGRcbiAgICAgICAgICAgIHdoZW4gMCAjIFNjZW5lIElEXG4gICAgICAgICAgICAgICAgQGludGVycHJldGVyLnNldFN0cmluZ1ZhbHVlVG8oQHBhcmFtcy50YXJnZXRWYXJpYWJsZSwgU2NlbmVNYW5hZ2VyLnNjZW5lLnNjZW5lRG9jdW1lbnQudWlkKVxuICAgICAgICAgICAgd2hlbiAxICMgR2FtZSBUaW1lIC0gU2Vjb25kc1xuICAgICAgICAgICAgICAgIEBpbnRlcnByZXRlci5zZXROdW1iZXJWYWx1ZVRvKEBwYXJhbXMudGFyZ2V0VmFyaWFibGUsIE1hdGgucm91bmQoR3JhcGhpY3MuZnJhbWVDb3VudCAvIDYwKSlcbiAgICAgICAgICAgIHdoZW4gMiAjIEdhbWUgVGltZSAtIE1pbnV0ZXNcbiAgICAgICAgICAgICAgICBAaW50ZXJwcmV0ZXIuc2V0TnVtYmVyVmFsdWVUbyhAcGFyYW1zLnRhcmdldFZhcmlhYmxlLCBNYXRoLnJvdW5kKEdyYXBoaWNzLmZyYW1lQ291bnQgLyA2MCAvIDYwKSlcbiAgICAgICAgICAgIHdoZW4gMyAjIEdhbWUgVGltZSAtIEhvdXJzXG4gICAgICAgICAgICAgICAgQGludGVycHJldGVyLnNldE51bWJlclZhbHVlVG8oQHBhcmFtcy50YXJnZXRWYXJpYWJsZSwgTWF0aC5yb3VuZChHcmFwaGljcy5mcmFtZUNvdW50IC8gNjAgLyA2MCAvIDYwKSlcbiAgICAgICAgICAgIHdoZW4gNCAjIERhdGUgLSBEYXkgb2YgTW9udGhcbiAgICAgICAgICAgICAgICBAaW50ZXJwcmV0ZXIuc2V0TnVtYmVyVmFsdWVUbyhAcGFyYW1zLnRhcmdldFZhcmlhYmxlLCBuZXcgRGF0ZSgpLmdldERhdGUoKSlcbiAgICAgICAgICAgIHdoZW4gNSAjIERhdGUgLSBEYXkgb2YgV2Vla1xuICAgICAgICAgICAgICAgIEBpbnRlcnByZXRlci5zZXROdW1iZXJWYWx1ZVRvKEBwYXJhbXMudGFyZ2V0VmFyaWFibGUsIG5ldyBEYXRlKCkuZ2V0RGF5KCkpXG4gICAgICAgICAgICB3aGVuIDYgIyBEYXRlIC0gTW9udGhcbiAgICAgICAgICAgICAgICBAaW50ZXJwcmV0ZXIuc2V0TnVtYmVyVmFsdWVUbyhAcGFyYW1zLnRhcmdldFZhcmlhYmxlLCBuZXcgRGF0ZSgpLmdldE1vbnRoKCkpXG4gICAgICAgICAgICB3aGVuIDcgIyBEYXRlIC0gWWVhclxuICAgICAgICAgICAgICAgIEBpbnRlcnByZXRlci5zZXROdW1iZXJWYWx1ZVRvKEBwYXJhbXMudGFyZ2V0VmFyaWFibGUsIG5ldyBEYXRlKCkuZ2V0RnVsbFllYXIoKSlcbiAgICAgICAgICAgIHdoZW4gOFxuICAgICAgICAgICAgICAgIEBpbnRlcnByZXRlci5zZXRCb29sZWFuVmFsdWVUbyhAcGFyYW1zLnRhcmdldFZhcmlhYmxlLCBzZXR0aW5ncy5hbGxvd1NraXApXG4gICAgICAgICAgICB3aGVuIDlcbiAgICAgICAgICAgICAgICBAaW50ZXJwcmV0ZXIuc2V0Qm9vbGVhblZhbHVlVG8oQHBhcmFtcy50YXJnZXRWYXJpYWJsZSwgc2V0dGluZ3MuYWxsb3dTa2lwVW5yZWFkTWVzc2FnZXMpXG4gICAgICAgICAgICB3aGVuIDEwXG4gICAgICAgICAgICAgICAgQGludGVycHJldGVyLnNldE51bWJlclZhbHVlVG8oQHBhcmFtcy50YXJnZXRWYXJpYWJsZSwgc2V0dGluZ3MubWVzc2FnZVNwZWVkKVxuICAgICAgICAgICAgd2hlbiAxMVxuICAgICAgICAgICAgICAgIEBpbnRlcnByZXRlci5zZXRCb29sZWFuVmFsdWVUbyhAcGFyYW1zLnRhcmdldFZhcmlhYmxlLCBzZXR0aW5ncy5hdXRvTWVzc2FnZS5lbmFibGVkKVxuICAgICAgICAgICAgd2hlbiAxMlxuICAgICAgICAgICAgICAgIEBpbnRlcnByZXRlci5zZXROdW1iZXJWYWx1ZVRvKEBwYXJhbXMudGFyZ2V0VmFyaWFibGUsIHNldHRpbmdzLmF1dG9NZXNzYWdlLnRpbWUpXG4gICAgICAgICAgICB3aGVuIDEzXG4gICAgICAgICAgICAgICAgQGludGVycHJldGVyLnNldEJvb2xlYW5WYWx1ZVRvKEBwYXJhbXMudGFyZ2V0VmFyaWFibGUsIHNldHRpbmdzLmF1dG9NZXNzYWdlLndhaXRGb3JWb2ljZSlcbiAgICAgICAgICAgIHdoZW4gMTRcbiAgICAgICAgICAgICAgICBAaW50ZXJwcmV0ZXIuc2V0Qm9vbGVhblZhbHVlVG8oQHBhcmFtcy50YXJnZXRWYXJpYWJsZSwgc2V0dGluZ3MuYXV0b01lc3NhZ2Uuc3RvcE9uQWN0aW9uKVxuICAgICAgICAgICAgd2hlbiAxNVxuICAgICAgICAgICAgICAgIEBpbnRlcnByZXRlci5zZXRCb29sZWFuVmFsdWVUbyhAcGFyYW1zLnRhcmdldFZhcmlhYmxlLCBzZXR0aW5ncy50aW1lTWVzc2FnZVRvVm9pY2UpXG4gICAgICAgICAgICB3aGVuIDE2XG4gICAgICAgICAgICAgICAgQGludGVycHJldGVyLnNldEJvb2xlYW5WYWx1ZVRvKEBwYXJhbXMudGFyZ2V0VmFyaWFibGUsIHNldHRpbmdzLmFsbG93VmlkZW9Ta2lwKVxuICAgICAgICAgICAgd2hlbiAxN1xuICAgICAgICAgICAgICAgIEBpbnRlcnByZXRlci5zZXRCb29sZWFuVmFsdWVUbyhAcGFyYW1zLnRhcmdldFZhcmlhYmxlLCBzZXR0aW5ncy5hbGxvd0Nob2ljZVNraXApXG4gICAgICAgICAgICB3aGVuIDE4XG4gICAgICAgICAgICAgICAgQGludGVycHJldGVyLnNldEJvb2xlYW5WYWx1ZVRvKEBwYXJhbXMudGFyZ2V0VmFyaWFibGUsIHNldHRpbmdzLnNraXBWb2ljZU9uQWN0aW9uKVxuICAgICAgICAgICAgd2hlbiAxOVxuICAgICAgICAgICAgICAgIEBpbnRlcnByZXRlci5zZXRCb29sZWFuVmFsdWVUbyhAcGFyYW1zLnRhcmdldFZhcmlhYmxlLCBzZXR0aW5ncy5mdWxsU2NyZWVuKVxuICAgICAgICAgICAgd2hlbiAyMFxuICAgICAgICAgICAgICAgIEBpbnRlcnByZXRlci5zZXRCb29sZWFuVmFsdWVUbyhAcGFyYW1zLnRhcmdldFZhcmlhYmxlLCBzZXR0aW5ncy5hZGp1c3RBc3BlY3RSYXRpbylcbiAgICAgICAgICAgIHdoZW4gMjFcbiAgICAgICAgICAgICAgICBAaW50ZXJwcmV0ZXIuc2V0Qm9vbGVhblZhbHVlVG8oQHBhcmFtcy50YXJnZXRWYXJpYWJsZSwgc2V0dGluZ3MuY29uZmlybWF0aW9uKVxuICAgICAgICAgICAgd2hlbiAyMlxuICAgICAgICAgICAgICAgIEBpbnRlcnByZXRlci5zZXROdW1iZXJWYWx1ZVRvKEBwYXJhbXMudGFyZ2V0VmFyaWFibGUsIHNldHRpbmdzLmJnbVZvbHVtZSlcbiAgICAgICAgICAgIHdoZW4gMjNcbiAgICAgICAgICAgICAgICBAaW50ZXJwcmV0ZXIuc2V0TnVtYmVyVmFsdWVUbyhAcGFyYW1zLnRhcmdldFZhcmlhYmxlLCBzZXR0aW5ncy52b2ljZVZvbHVtZSlcbiAgICAgICAgICAgIHdoZW4gMjRcbiAgICAgICAgICAgICAgICBAaW50ZXJwcmV0ZXIuc2V0TnVtYmVyVmFsdWVUbyhAcGFyYW1zLnRhcmdldFZhcmlhYmxlLCBzZXR0aW5ncy5zZVZvbHVtZSlcbiAgICAgICAgICAgIHdoZW4gMjVcbiAgICAgICAgICAgICAgICBAaW50ZXJwcmV0ZXIuc2V0Qm9vbGVhblZhbHVlVG8oQHBhcmFtcy50YXJnZXRWYXJpYWJsZSwgc2V0dGluZ3MuYmdtRW5hYmxlZClcbiAgICAgICAgICAgIHdoZW4gMjZcbiAgICAgICAgICAgICAgICBAaW50ZXJwcmV0ZXIuc2V0Qm9vbGVhblZhbHVlVG8oQHBhcmFtcy50YXJnZXRWYXJpYWJsZSwgc2V0dGluZ3Mudm9pY2VFbmFibGVkKVxuICAgICAgICAgICAgd2hlbiAyN1xuICAgICAgICAgICAgICAgIEBpbnRlcnByZXRlci5zZXRCb29sZWFuVmFsdWVUbyhAcGFyYW1zLnRhcmdldFZhcmlhYmxlLCBzZXR0aW5ncy5zZUVuYWJsZWQpXG4gICAgICAgICAgICB3aGVuIDI4ICMgTGFuZ3VhZ2UgLSBDb2RlXG4gICAgICAgICAgICAgICAgQGludGVycHJldGVyLnNldFN0cmluZ1ZhbHVlVG8oQHBhcmFtcy50YXJnZXRWYXJpYWJsZSwgTGFuZ3VhZ2VNYW5hZ2VyLmxhbmd1YWdlPy5jb2RlIHx8IFwiXCIpXG4gICAgICAgICAgICB3aGVuIDI5ICMgTGFuZ3VhZ2UgLSBOYW1lXG4gICAgICAgICAgICAgICAgQGludGVycHJldGVyLnNldFN0cmluZ1ZhbHVlVG8oQHBhcmFtcy50YXJnZXRWYXJpYWJsZSwgTGFuZ3VhZ2VNYW5hZ2VyLmxhbmd1YWdlPy5uYW1lIHx8IFwiXCIpICAgIFxuICAgICAgICAgICAgd2hlbiAzMFxuICAgICAgICAgICAgICAgIEBpbnRlcnByZXRlci5zZXRCb29sZWFuVmFsdWVUbyhAcGFyYW1zLnRhcmdldFZhcmlhYmxlLCBHYW1lTWFuYWdlci50ZW1wU2V0dGluZ3Muc2tpcClcbiAgICBcbiAgICAjIyMqXG4gICAgKiBAbWV0aG9kIGNvbW1hbmRTZXRHYW1lRGF0YVxuICAgICogQHByb3RlY3RlZFxuICAgICMjI1xuICAgIGNvbW1hbmRTZXRHYW1lRGF0YTogLT5cbiAgICAgICAgdGVtcFNldHRpbmdzID0gR2FtZU1hbmFnZXIudGVtcFNldHRpbmdzXG4gICAgICAgIHNldHRpbmdzID0gR2FtZU1hbmFnZXIuc2V0dGluZ3NcbiAgICAgICAgXG4gICAgICAgIHN3aXRjaCBAcGFyYW1zLmZpZWxkXG4gICAgICAgICAgICB3aGVuIDBcbiAgICAgICAgICAgICAgICBzZXR0aW5ncy5hbGxvd1NraXAgPSBAaW50ZXJwcmV0ZXIuYm9vbGVhblZhbHVlT2YoQHBhcmFtcy5zd2l0Y2hWYWx1ZSlcbiAgICAgICAgICAgIHdoZW4gMVxuICAgICAgICAgICAgICAgIHNldHRpbmdzLmFsbG93U2tpcFVucmVhZE1lc3NhZ2VzID0gQGludGVycHJldGVyLmJvb2xlYW5WYWx1ZU9mKEBwYXJhbXMuc3dpdGNoVmFsdWUpXG4gICAgICAgICAgICB3aGVuIDJcbiAgICAgICAgICAgICAgICBzZXR0aW5ncy5tZXNzYWdlU3BlZWQgPSBAaW50ZXJwcmV0ZXIubnVtYmVyVmFsdWVPZihAcGFyYW1zLmRlY2ltYWxWYWx1ZSlcbiAgICAgICAgICAgIHdoZW4gM1xuICAgICAgICAgICAgICAgIHNldHRpbmdzLmF1dG9NZXNzYWdlLmVuYWJsZWQgPSBAaW50ZXJwcmV0ZXIuYm9vbGVhblZhbHVlT2YoQHBhcmFtcy5zd2l0Y2hWYWx1ZSlcbiAgICAgICAgICAgIHdoZW4gNFxuICAgICAgICAgICAgICAgIHNldHRpbmdzLmF1dG9NZXNzYWdlLnRpbWUgPSBAaW50ZXJwcmV0ZXIubnVtYmVyVmFsdWVPZihAcGFyYW1zLm51bWJlclZhbHVlKVxuICAgICAgICAgICAgd2hlbiA1XG4gICAgICAgICAgICAgICAgc2V0dGluZ3MuYXV0b01lc3NhZ2Uud2FpdEZvclZvaWNlID0gQGludGVycHJldGVyLmJvb2xlYW5WYWx1ZU9mKEBwYXJhbXMuc3dpdGNoVmFsdWUpXG4gICAgICAgICAgICB3aGVuIDZcbiAgICAgICAgICAgICAgICBzZXR0aW5ncy5hdXRvTWVzc2FnZS5zdG9wT25BY3Rpb24gPSBAaW50ZXJwcmV0ZXIuYm9vbGVhblZhbHVlT2YoQHBhcmFtcy5zd2l0Y2hWYWx1ZSlcbiAgICAgICAgICAgIHdoZW4gN1xuICAgICAgICAgICAgICAgIHNldHRpbmdzLnRpbWVNZXNzYWdlVG9Wb2ljZSA9IEBpbnRlcnByZXRlci5ib29sZWFuVmFsdWVPZihAcGFyYW1zLnN3aXRjaFZhbHVlKVxuICAgICAgICAgICAgd2hlbiA4XG4gICAgICAgICAgICAgICAgc2V0dGluZ3MuYWxsb3dWaWRlb1NraXAgPSBAaW50ZXJwcmV0ZXIuYm9vbGVhblZhbHVlT2YoQHBhcmFtcy5zd2l0Y2hWYWx1ZSlcbiAgICAgICAgICAgIHdoZW4gOVxuICAgICAgICAgICAgICAgIHNldHRpbmdzLmFsbG93Q2hvaWNlU2tpcCA9IEBpbnRlcnByZXRlci5ib29sZWFuVmFsdWVPZihAcGFyYW1zLnN3aXRjaFZhbHVlKVxuICAgICAgICAgICAgd2hlbiAxMFxuICAgICAgICAgICAgICAgIHNldHRpbmdzLnNraXBWb2ljZU9uQWN0aW9uID0gQGludGVycHJldGVyLmJvb2xlYW5WYWx1ZU9mKEBwYXJhbXMuc3dpdGNoVmFsdWUpXG4gICAgICAgICAgICB3aGVuIDExXG4gICAgICAgICAgICAgICAgc2V0dGluZ3MuZnVsbFNjcmVlbiA9IEBpbnRlcnByZXRlci5ib29sZWFuVmFsdWVPZihAcGFyYW1zLnN3aXRjaFZhbHVlKVxuICAgICAgICAgICAgICAgIGlmIHNldHRpbmdzLmZ1bGxTY3JlZW5cbiAgICAgICAgICAgICAgICAgICAgU2NlbmVNYW5hZ2VyLnNjZW5lLmJlaGF2aW9yLmVudGVyRnVsbFNjcmVlbigpXG4gICAgICAgICAgICAgICAgZWxzZVxuICAgICAgICAgICAgICAgICAgICBTY2VuZU1hbmFnZXIuc2NlbmUuYmVoYXZpb3IubGVhdmVGdWxsU2NyZWVuKClcbiAgICAgICAgICAgIHdoZW4gMTJcbiAgICAgICAgICAgICAgICBzZXR0aW5ncy5hZGp1c3RBc3BlY3RSYXRpbyA9IEBpbnRlcnByZXRlci5ib29sZWFuVmFsdWVPZihAcGFyYW1zLnN3aXRjaFZhbHVlKVxuICAgICAgICAgICAgICAgIEdyYXBoaWNzLmtlZXBSYXRpbyA9IHNldHRpbmdzLmFkanVzdEFzcGVjdFJhdGlvXG4gICAgICAgICAgICAgICAgR3JhcGhpY3Mub25SZXNpemUoKVxuICAgICAgICAgICAgd2hlbiAxM1xuICAgICAgICAgICAgICAgIHNldHRpbmdzLmNvbmZpcm1hdGlvbiA9IEBpbnRlcnByZXRlci5ib29sZWFuVmFsdWVPZihAcGFyYW1zLnN3aXRjaFZhbHVlKVxuICAgICAgICAgICAgd2hlbiAxNFxuICAgICAgICAgICAgICAgIHNldHRpbmdzLmJnbVZvbHVtZSA9IEBpbnRlcnByZXRlci5udW1iZXJWYWx1ZU9mKEBwYXJhbXMubnVtYmVyVmFsdWUpXG4gICAgICAgICAgICB3aGVuIDE1XG4gICAgICAgICAgICAgICAgc2V0dGluZ3Mudm9pY2VWb2x1bWUgPSBAaW50ZXJwcmV0ZXIubnVtYmVyVmFsdWVPZihAcGFyYW1zLm51bWJlclZhbHVlKVxuICAgICAgICAgICAgd2hlbiAxNlxuICAgICAgICAgICAgICAgIHNldHRpbmdzLnNlVm9sdW1lID0gQGludGVycHJldGVyLm51bWJlclZhbHVlT2YoQHBhcmFtcy5udW1iZXJWYWx1ZSlcbiAgICAgICAgICAgIHdoZW4gMTdcbiAgICAgICAgICAgICAgICBzZXR0aW5ncy5iZ21FbmFibGVkID0gQGludGVycHJldGVyLmJvb2xlYW5WYWx1ZU9mKEBwYXJhbXMuc3dpdGNoVmFsdWUpXG4gICAgICAgICAgICB3aGVuIDE4XG4gICAgICAgICAgICAgICAgc2V0dGluZ3Mudm9pY2VFbmFibGVkID0gQGludGVycHJldGVyLmJvb2xlYW5WYWx1ZU9mKEBwYXJhbXMuc3dpdGNoVmFsdWUpXG4gICAgICAgICAgICB3aGVuIDE5XG4gICAgICAgICAgICAgICAgc2V0dGluZ3Muc2VFbmFibGVkID0gQGludGVycHJldGVyLmJvb2xlYW5WYWx1ZU9mKEBwYXJhbXMuc3dpdGNoVmFsdWUpICAgXG4gICAgICAgICAgICB3aGVuIDIwIFxuICAgICAgICAgICAgICAgIGNvZGUgPSBAaW50ZXJwcmV0ZXIuc3RyaW5nVmFsdWVPZihAcGFyYW1zLnRleHRWYWx1ZSlcbiAgICAgICAgICAgICAgICBsYW5ndWFnZSA9IExhbmd1YWdlTWFuYWdlci5sYW5ndWFnZXMuZmlyc3QgKGwpID0+IGwuY29kZSA9PSBjb2RlXG4gICAgICAgICAgICAgICAgTGFuZ3VhZ2VNYW5hZ2VyLnNlbGVjdExhbmd1YWdlKGxhbmd1YWdlKSBpZiBsYW5ndWFnZVxuICAgICAgICAgICAgd2hlbiAyMVxuICAgICAgICAgICAgICAgIEdhbWVNYW5hZ2VyLnRlbXBTZXR0aW5ncy5za2lwID0gQGludGVycHJldGVyLmJvb2xlYW5WYWx1ZU9mKEBwYXJhbXMuc3dpdGNoVmFsdWUpXG4gICAgXG4gICAgIyMjKlxuICAgICogQG1ldGhvZCBjb21tYW5kR2V0T2JqZWN0RGF0YVxuICAgICogQHByb3RlY3RlZFxuICAgICMjI1xuICAgIGNvbW1hbmRHZXRPYmplY3REYXRhOiAtPlxuICAgICAgICBzY2VuZSA9IFNjZW5lTWFuYWdlci5zY2VuZVxuICAgICAgICBzd2l0Y2ggQHBhcmFtcy5vYmplY3RUeXBlXG4gICAgICAgICAgICB3aGVuIDAgIyBQaWN0dXJlXG4gICAgICAgICAgICAgICAgc2NlbmUuYmVoYXZpb3IuY2hhbmdlUGljdHVyZURvbWFpbihAcGFyYW1zLm51bWJlckRvbWFpbilcbiAgICAgICAgICAgICAgICBvYmplY3QgPSBTY2VuZU1hbmFnZXIuc2NlbmUucGljdHVyZXNbQGludGVycHJldGVyLm51bWJlclZhbHVlT2YoQHBhcmFtcy5udW1iZXIpXVxuICAgICAgICAgICAgd2hlbiAxICMgQmFja2dyb3VuZFxuICAgICAgICAgICAgICAgIG9iamVjdCA9IFNjZW5lTWFuYWdlci5zY2VuZS5iYWNrZ3JvdW5kc1tAaW50ZXJwcmV0ZXIubnVtYmVyVmFsdWVPZihAcGFyYW1zLmxheWVyKV1cbiAgICAgICAgICAgIHdoZW4gMiAjIFRleHRcbiAgICAgICAgICAgICAgICBzY2VuZS5iZWhhdmlvci5jaGFuZ2VUZXh0RG9tYWluKEBwYXJhbXMubnVtYmVyRG9tYWluKVxuICAgICAgICAgICAgICAgIG9iamVjdCA9IFNjZW5lTWFuYWdlci5zY2VuZS50ZXh0c1tAaW50ZXJwcmV0ZXIubnVtYmVyVmFsdWVPZihAcGFyYW1zLm51bWJlcildXG4gICAgICAgICAgICB3aGVuIDMgIyBNb3ZpZVxuICAgICAgICAgICAgICAgIHNjZW5lLmJlaGF2aW9yLmNoYW5nZVZpZGVvRG9tYWluKEBwYXJhbXMubnVtYmVyRG9tYWluKVxuICAgICAgICAgICAgICAgIG9iamVjdCA9IFNjZW5lTWFuYWdlci5zY2VuZS52aWRlb3NbQGludGVycHJldGVyLm51bWJlclZhbHVlT2YoQHBhcmFtcy5udW1iZXIpXVxuICAgICAgICAgICAgd2hlbiA0ICMgQ2hhcmFjdGVyXG4gICAgICAgICAgICAgICAgY2hhcmFjdGVySWQgPSBAaW50ZXJwcmV0ZXIuc3RyaW5nVmFsdWVPZihAcGFyYW1zLmNoYXJhY3RlcklkKVxuICAgICAgICAgICAgICAgIG9iamVjdCA9IFNjZW5lTWFuYWdlci5zY2VuZS5jaGFyYWN0ZXJzLmZpcnN0ICh2KSA9PiAhdi5kaXNwb3NlZCBhbmQgdi5yaWQgPT0gY2hhcmFjdGVySWRcbiAgICAgICAgICAgIHdoZW4gNSAjIE1lc3NhZ2UgQm94XG4gICAgICAgICAgICAgICAgb2JqZWN0ID0gZ3MuT2JqZWN0TWFuYWdlci5jdXJyZW50Lm9iamVjdEJ5SWQoXCJtZXNzYWdlQm94XCIpXG4gICAgICAgICAgICB3aGVuIDYgIyBNZXNzYWdlIEFyZWFcbiAgICAgICAgICAgICAgICBzY2VuZS5iZWhhdmlvci5jaGFuZ2VNZXNzYWdlQXJlYURvbWFpbihAcGFyYW1zLm51bWJlckRvbWFpbilcbiAgICAgICAgICAgICAgICBhcmVhID0gU2NlbmVNYW5hZ2VyLnNjZW5lLm1lc3NhZ2VBcmVhc1tAaW50ZXJwcmV0ZXIubnVtYmVyVmFsdWVPZihAcGFyYW1zLm51bWJlcildXG4gICAgICAgICAgICAgICAgb2JqZWN0ID0gYXJlYT8ubGF5b3V0XG4gICAgICAgICAgICB3aGVuIDcgIyBIb3RzcG90XG4gICAgICAgICAgICAgICAgc2NlbmUuYmVoYXZpb3IuY2hhbmdlSG90c3BvdERvbWFpbihAcGFyYW1zLm51bWJlckRvbWFpbilcbiAgICAgICAgICAgICAgICBvYmplY3QgPSBTY2VuZU1hbmFnZXIuc2NlbmUuaG90c3BvdHNbQGludGVycHJldGVyLm51bWJlclZhbHVlT2YoQHBhcmFtcy5udW1iZXIpXVxuICAgICAgICAgICAgXG4gICAgICAgIFxuICAgICAgICBmaWVsZCA9IEBwYXJhbXMuZmllbGRcbiAgICAgICAgaWYgQHBhcmFtcy5vYmplY3RUeXBlID09IDQgIyBDaGFyYWN0ZXJcbiAgICAgICAgICAgIHN3aXRjaCBAcGFyYW1zLmZpZWxkXG4gICAgICAgICAgICAgICAgd2hlbiAwICMgSURcbiAgICAgICAgICAgICAgICAgICAgQGludGVycHJldGVyLnNldFN0cmluZ1ZhbHVlVG8oQHBhcmFtcy50YXJnZXRWYXJpYWJsZSwgUmVjb3JkTWFuYWdlci5jaGFyYWN0ZXJzW2NoYXJhY3RlcklkXT8uaW5kZXggfHwgXCJcIilcbiAgICAgICAgICAgICAgICB3aGVuIDEgIyBOYW1lXG4gICAgICAgICAgICAgICAgICAgIEBpbnRlcnByZXRlci5zZXRTdHJpbmdWYWx1ZVRvKEBwYXJhbXMudGFyZ2V0VmFyaWFibGUsIGxjcyhSZWNvcmRNYW5hZ2VyLmNoYXJhY3RlcnNbY2hhcmFjdGVySWRdPy5uYW1lKSB8fCBcIlwiKVxuICAgICAgICAgICAgZmllbGQgLT0gMlxuICAgICAgICAgICAgXG4gICAgICAgIGlmIG9iamVjdD8gICAgICAgIFxuICAgICAgICAgICAgaWYgZmllbGQgPj0gMFxuICAgICAgICAgICAgICAgIHN3aXRjaCBmaWVsZFxuICAgICAgICAgICAgICAgICAgICB3aGVuIDAgIyBSZXNvdXJjZSBOYW1lXG4gICAgICAgICAgICAgICAgICAgICAgICBzd2l0Y2ggQHBhcmFtcy5vYmplY3RUeXBlXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgd2hlbiAyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIEBpbnRlcnByZXRlci5zZXRTdHJpbmdWYWx1ZVRvKEBwYXJhbXMudGFyZ2V0VmFyaWFibGUsIG9iamVjdC50ZXh0IHx8IFwiXCIpXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgd2hlbiAzXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIEBpbnRlcnByZXRlci5zZXRTdHJpbmdWYWx1ZVRvKEBwYXJhbXMudGFyZ2V0VmFyaWFibGUsIG9iamVjdC52aWRlbyB8fCBcIlwiKVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGVsc2VcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgQGludGVycHJldGVyLnNldFN0cmluZ1ZhbHVlVG8oQHBhcmFtcy50YXJnZXRWYXJpYWJsZSwgb2JqZWN0LmltYWdlIHx8IFwiXCIpXG4gICAgICAgICAgICAgICAgICAgIHdoZW4gMSAjIFBvc2l0aW9uIC0gWFxuICAgICAgICAgICAgICAgICAgICAgICAgQGludGVycHJldGVyLnNldE51bWJlclZhbHVlVG8oQHBhcmFtcy50YXJnZXRWYXJpYWJsZSwgb2JqZWN0LmRzdFJlY3QueClcbiAgICAgICAgICAgICAgICAgICAgd2hlbiAyICMgUG9zaXRpb24gLSBZXG4gICAgICAgICAgICAgICAgICAgICAgICBAaW50ZXJwcmV0ZXIuc2V0TnVtYmVyVmFsdWVUbyhAcGFyYW1zLnRhcmdldFZhcmlhYmxlLCBvYmplY3QuZHN0UmVjdC55KVxuICAgICAgICAgICAgICAgICAgICB3aGVuIDMgIyBBbmNob3IgLSBYXG4gICAgICAgICAgICAgICAgICAgICAgICBAaW50ZXJwcmV0ZXIuc2V0TnVtYmVyVmFsdWVUbyhAcGFyYW1zLnRhcmdldFZhcmlhYmxlLCBNYXRoLnJvdW5kKG9iamVjdC5hbmNob3IueCAqIDEwMCkpXG4gICAgICAgICAgICAgICAgICAgIHdoZW4gNCAjIEFuY2hvciAtIFlcbiAgICAgICAgICAgICAgICAgICAgICAgIEBpbnRlcnByZXRlci5zZXROdW1iZXJWYWx1ZVRvKEBwYXJhbXMudGFyZ2V0VmFyaWFibGUsIE1hdGgucm91bmQob2JqZWN0LmFuY2hvci55ICogMTAwKSlcbiAgICAgICAgICAgICAgICAgICAgd2hlbiA1ICMgWm9vbSAtIFhcbiAgICAgICAgICAgICAgICAgICAgICAgIEBpbnRlcnByZXRlci5zZXROdW1iZXJWYWx1ZVRvKEBwYXJhbXMudGFyZ2V0VmFyaWFibGUsIE1hdGgucm91bmQob2JqZWN0Lnpvb20ueCAqIDEwMCkpXG4gICAgICAgICAgICAgICAgICAgIHdoZW4gNiAjIFpvb20gLSBZXG4gICAgICAgICAgICAgICAgICAgICAgICBAaW50ZXJwcmV0ZXIuc2V0TnVtYmVyVmFsdWVUbyhAcGFyYW1zLnRhcmdldFZhcmlhYmxlLCBNYXRoLnJvdW5kKG9iamVjdC56b29tLnkgKiAxMDApKVxuICAgICAgICAgICAgICAgICAgICB3aGVuIDcgIyBTaXplIC0gV2lkdGhcbiAgICAgICAgICAgICAgICAgICAgICAgIEBpbnRlcnByZXRlci5zZXROdW1iZXJWYWx1ZVRvKEBwYXJhbXMudGFyZ2V0VmFyaWFibGUsIG9iamVjdC5kc3RSZWN0LndpZHRoKVxuICAgICAgICAgICAgICAgICAgICB3aGVuIDggIyBTaXplIC0gSGVpZ2h0XG4gICAgICAgICAgICAgICAgICAgICAgICBAaW50ZXJwcmV0ZXIuc2V0TnVtYmVyVmFsdWVUbyhAcGFyYW1zLnRhcmdldFZhcmlhYmxlLCBvYmplY3QuZHN0UmVjdC5oZWlnaHQpXG4gICAgICAgICAgICAgICAgICAgIHdoZW4gOSAjIFotSW5kZXhcbiAgICAgICAgICAgICAgICAgICAgICAgIEBpbnRlcnByZXRlci5zZXROdW1iZXJWYWx1ZVRvKEBwYXJhbXMudGFyZ2V0VmFyaWFibGUsIG9iamVjdC56SW5kZXgpXG4gICAgICAgICAgICAgICAgICAgIHdoZW4gMTAgIyBPcGFjaXR5XG4gICAgICAgICAgICAgICAgICAgICAgICBAaW50ZXJwcmV0ZXIuc2V0TnVtYmVyVmFsdWVUbyhAcGFyYW1zLnRhcmdldFZhcmlhYmxlLCBvYmplY3Qub3BhY2l0eSlcbiAgICAgICAgICAgICAgICAgICAgd2hlbiAxMSAjIEFuZ2xlXG4gICAgICAgICAgICAgICAgICAgICAgICBAaW50ZXJwcmV0ZXIuc2V0TnVtYmVyVmFsdWVUbyhAcGFyYW1zLnRhcmdldFZhcmlhYmxlLCBvYmplY3QuYW5nbGUpXG4gICAgICAgICAgICAgICAgICAgIHdoZW4gMTIgIyBWaXNpYmxlXG4gICAgICAgICAgICAgICAgICAgICAgICBAaW50ZXJwcmV0ZXIuc2V0Qm9vbGVhblZhbHVlVG8oQHBhcmFtcy50YXJnZXRWYXJpYWJsZSwgb2JqZWN0LnZpc2libGUpXG4gICAgICAgICAgICAgICAgICAgIHdoZW4gMTMgIyBCbGVuZCBNb2RlXG4gICAgICAgICAgICAgICAgICAgICAgICBAaW50ZXJwcmV0ZXIuc2V0TnVtYmVyVmFsdWVUbyhAcGFyYW1zLnRhcmdldFZhcmlhYmxlLCBvYmplY3QuYmxlbmRNb2RlKVxuICAgICAgICAgICAgICAgICAgICB3aGVuIDE0ICMgRmxpcHBlZFxuICAgICAgICAgICAgICAgICAgICAgICAgQGludGVycHJldGVyLnNldEJvb2xlYW5WYWx1ZVRvKEBwYXJhbXMudGFyZ2V0VmFyaWFibGUsIG9iamVjdC5taXJyb3IpXG4gICAgXG4gICAgIyMjKlxuICAgICogQG1ldGhvZCBjb21tYW5kU2V0T2JqZWN0RGF0YVxuICAgICogQHByb3RlY3RlZFxuICAgICMjIyAgICAgICAgICAgICAgICBcbiAgICBjb21tYW5kU2V0T2JqZWN0RGF0YTogLT5cbiAgICAgICAgc2NlbmUgPSBTY2VuZU1hbmFnZXIuc2NlbmVcbiAgICAgICAgc3dpdGNoIEBwYXJhbXMub2JqZWN0VHlwZVxuICAgICAgICAgICAgd2hlbiAwICMgUGljdHVyZVxuICAgICAgICAgICAgICAgIHNjZW5lLmJlaGF2aW9yLmNoYW5nZVBpY3R1cmVEb21haW4oQHBhcmFtcy5udW1iZXJEb21haW4pXG4gICAgICAgICAgICAgICAgb2JqZWN0ID0gU2NlbmVNYW5hZ2VyLnNjZW5lLnBpY3R1cmVzW0BpbnRlcnByZXRlci5udW1iZXJWYWx1ZU9mKEBwYXJhbXMubnVtYmVyKV1cbiAgICAgICAgICAgIHdoZW4gMSAjIEJhY2tncm91bmRcbiAgICAgICAgICAgICAgICBvYmplY3QgPSBTY2VuZU1hbmFnZXIuc2NlbmUuYmFja2dyb3VuZHNbQGludGVycHJldGVyLm51bWJlclZhbHVlT2YoQHBhcmFtcy5sYXllcildXG4gICAgICAgICAgICB3aGVuIDIgIyBUZXh0XG4gICAgICAgICAgICAgICAgc2NlbmUuYmVoYXZpb3IuY2hhbmdlVGV4dERvbWFpbihAcGFyYW1zLm51bWJlckRvbWFpbilcbiAgICAgICAgICAgICAgICBvYmplY3QgPSBTY2VuZU1hbmFnZXIuc2NlbmUudGV4dHNbQGludGVycHJldGVyLm51bWJlclZhbHVlT2YoQHBhcmFtcy5udW1iZXIpXVxuICAgICAgICAgICAgd2hlbiAzICMgTW92aWVcbiAgICAgICAgICAgICAgICBzY2VuZS5iZWhhdmlvci5jaGFuZ2VWaWRlb0RvbWFpbihAcGFyYW1zLm51bWJlckRvbWFpbilcbiAgICAgICAgICAgICAgICBvYmplY3QgPSBTY2VuZU1hbmFnZXIuc2NlbmUudmlkZW9zW0BpbnRlcnByZXRlci5udW1iZXJWYWx1ZU9mKEBwYXJhbXMubnVtYmVyKV1cbiAgICAgICAgICAgIHdoZW4gNCAjIENoYXJhY3RlclxuICAgICAgICAgICAgICAgIGNoYXJhY3RlcklkID0gQGludGVycHJldGVyLnN0cmluZ1ZhbHVlT2YoQHBhcmFtcy5jaGFyYWN0ZXJJZClcbiAgICAgICAgICAgICAgICBvYmplY3QgPSBTY2VuZU1hbmFnZXIuc2NlbmUuY2hhcmFjdGVycy5maXJzdCAodikgPT4gIXYuZGlzcG9zZWQgYW5kIHYucmlkID09IGNoYXJhY3RlcklkXG4gICAgICAgICAgICB3aGVuIDUgIyBNZXNzYWdlIEJveFxuICAgICAgICAgICAgICAgIG9iamVjdCA9IGdzLk9iamVjdE1hbmFnZXIuY3VycmVudC5vYmplY3RCeUlkKFwibWVzc2FnZUJveFwiKVxuICAgICAgICAgICAgd2hlbiA2ICMgTWVzc2FnZSBBcmVhXG4gICAgICAgICAgICAgICAgc2NlbmUuYmVoYXZpb3IuY2hhbmdlTWVzc2FnZUFyZWFEb21haW4oQHBhcmFtcy5udW1iZXJEb21haW4pXG4gICAgICAgICAgICAgICAgYXJlYSA9IFNjZW5lTWFuYWdlci5zY2VuZS5tZXNzYWdlQXJlYXNbQGludGVycHJldGVyLm51bWJlclZhbHVlT2YoQHBhcmFtcy5udW1iZXIpXVxuICAgICAgICAgICAgICAgIG9iamVjdCA9IGFyZWE/LmxheW91dFxuICAgICAgICAgICAgd2hlbiA3ICMgSG90c3BvdFxuICAgICAgICAgICAgICAgIHNjZW5lLmJlaGF2aW9yLmNoYW5nZUhvdHNwb3REb21haW4oQHBhcmFtcy5udW1iZXJEb21haW4pXG4gICAgICAgICAgICAgICAgb2JqZWN0ID0gU2NlbmVNYW5hZ2VyLnNjZW5lLmhvdHNwb3RzW0BpbnRlcnByZXRlci5udW1iZXJWYWx1ZU9mKEBwYXJhbXMubnVtYmVyKV1cbiAgICAgICAgICAgICAgICBcbiAgICAgICAgXG4gICAgICAgIGZpZWxkID0gQHBhcmFtcy5maWVsZFxuICAgICAgICBpZiBAcGFyYW1zLm9iamVjdFR5cGUgPT0gNCAjIENoYXJhY3RlclxuICAgICAgICAgICAgc3dpdGNoIGZpZWxkXG4gICAgICAgICAgICAgICAgd2hlbiAwICMgTmFtZVxuICAgICAgICAgICAgICAgICAgICBuYW1lID0gQGludGVycHJldGVyLnN0cmluZ1ZhbHVlT2YoQHBhcmFtcy50ZXh0VmFsdWUpXG4gICAgICAgICAgICAgICAgICAgIGlmIG9iamVjdD9cbiAgICAgICAgICAgICAgICAgICAgICAgIG9iamVjdC5uYW1lID0gbmFtZVxuICAgICAgICAgICAgICAgICAgICBSZWNvcmRNYW5hZ2VyLmNoYXJhY3RlcnNbY2hhcmFjdGVySWRdPy5uYW1lID0gbmFtZVxuICAgICAgICAgICAgZmllbGQtLVxuICAgICAgICAgICAgXG4gICAgICAgIGlmIG9iamVjdD8gICAgICAgIFxuICAgICAgICAgICAgaWYgZmllbGQgPj0gMFxuICAgICAgICAgICAgICAgIHN3aXRjaCBmaWVsZFxuICAgICAgICAgICAgICAgICAgICB3aGVuIDAgIyBSZXNvdXJjZSBOYW1lIC8gVGV4dFxuICAgICAgICAgICAgICAgICAgICAgICAgc3dpdGNoIEBwYXJhbXMub2JqZWN0VHlwZVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHdoZW4gMlxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBvYmplY3QudGV4dCA9IEBpbnRlcnByZXRlci5zdHJpbmdWYWx1ZU9mKEBwYXJhbXMudGV4dFZhbHVlKVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHdoZW4gM1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBvYmplY3QudmlkZW8gPSBAaW50ZXJwcmV0ZXIuc3RyaW5nVmFsdWVPZihAcGFyYW1zLnRleHRWYWx1ZSlcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBlbHNlXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIG9iamVjdC5pbWFnZSA9IEBpbnRlcnByZXRlci5zdHJpbmdWYWx1ZU9mKEBwYXJhbXMudGV4dFZhbHVlKVxuICAgICAgICAgICAgICAgICAgICB3aGVuIDEgIyBQb3NpdGlvbiAtIFhcbiAgICAgICAgICAgICAgICAgICAgICAgIG9iamVjdC5kc3RSZWN0LnggPSBAaW50ZXJwcmV0ZXIubnVtYmVyVmFsdWVPZihAcGFyYW1zLm51bWJlclZhbHVlKVxuICAgICAgICAgICAgICAgICAgICB3aGVuIDIgIyBQb3NpdGlvbiAtIFlcbiAgICAgICAgICAgICAgICAgICAgICAgIG9iamVjdC5kc3RSZWN0LnkgPSBAaW50ZXJwcmV0ZXIubnVtYmVyVmFsdWVPZihAcGFyYW1zLm51bWJlclZhbHVlKVxuICAgICAgICAgICAgICAgICAgICB3aGVuIDMgIyBBbmNob3IgLSBYXG4gICAgICAgICAgICAgICAgICAgICAgICBvYmplY3QuYW5jaG9yLnggPSBAaW50ZXJwcmV0ZXIubnVtYmVyVmFsdWVPZihAcGFyYW1zLm51bWJlclZhbHVlKSAvIDEwMFxuICAgICAgICAgICAgICAgICAgICB3aGVuIDQgIyBBbmNob3IgLSBZXG4gICAgICAgICAgICAgICAgICAgICAgICBvYmplY3QuYW5jaG9yLnkgPSBAaW50ZXJwcmV0ZXIubnVtYmVyVmFsdWVPZihAcGFyYW1zLm51bWJlclZhbHVlKSAvIDEwMFxuICAgICAgICAgICAgICAgICAgICB3aGVuIDUgIyBab29tIC0gWFxuICAgICAgICAgICAgICAgICAgICAgICAgb2JqZWN0Lnpvb20ueCA9IEBpbnRlcnByZXRlci5udW1iZXJWYWx1ZU9mKEBwYXJhbXMubnVtYmVyVmFsdWUpIC8gMTAwXG4gICAgICAgICAgICAgICAgICAgIHdoZW4gNiAjIFpvb20gLSBZXG4gICAgICAgICAgICAgICAgICAgICAgICBvYmplY3Quem9vbS55ID0gQGludGVycHJldGVyLm51bWJlclZhbHVlT2YoQHBhcmFtcy5udW1iZXJWYWx1ZSkgLyAxMDBcbiAgICAgICAgICAgICAgICAgICAgd2hlbiA3ICMgWi1JbmRleFxuICAgICAgICAgICAgICAgICAgICAgICAgb2JqZWN0LnpJbmRleCA9IEBpbnRlcnByZXRlci5udW1iZXJWYWx1ZU9mKEBwYXJhbXMubnVtYmVyVmFsdWUpXG4gICAgICAgICAgICAgICAgICAgIHdoZW4gOCAjIE9wYWNpdHlcbiAgICAgICAgICAgICAgICAgICAgICAgIG9iamVjdC5vcGFjaXR5PSBAaW50ZXJwcmV0ZXIubnVtYmVyVmFsdWVPZihAcGFyYW1zLm51bWJlclZhbHVlKVxuICAgICAgICAgICAgICAgICAgICB3aGVuIDkgIyBBbmdsZVxuICAgICAgICAgICAgICAgICAgICAgICAgb2JqZWN0LmFuZ2xlID0gQGludGVycHJldGVyLm51bWJlclZhbHVlT2YoQHBhcmFtcy5udW1iZXJWYWx1ZSlcbiAgICAgICAgICAgICAgICAgICAgd2hlbiAxMCAjIFZpc2libGVcbiAgICAgICAgICAgICAgICAgICAgICAgIG9iamVjdC52aXNpYmxlID0gQGludGVycHJldGVyLmJvb2xlYW5WYWx1ZU9mKEBwYXJhbXMuc3dpdGNoVmFsdWUpXG4gICAgICAgICAgICAgICAgICAgIHdoZW4gMTEgIyBCbGVuZCBNb2RlXG4gICAgICAgICAgICAgICAgICAgICAgICBvYmplY3QuYmxlbmRNb2RlID0gQGludGVycHJldGVyLm51bWJlclZhbHVlT2YoQHBhcmFtcy5udW1iZXJWYWx1ZSkgICAgXG4gICAgICAgICAgICAgICAgICAgIHdoZW4gMTIgIyBGbGlwcGVkXG4gICAgICAgICAgICAgICAgICAgICAgICBvYmplY3QubWlycm9yID0gQGludGVycHJldGVyLmJvb2xlYW5WYWx1ZU9mKEBwYXJhbXMuc3dpdGNoVmFsdWUpICBcbiAgICBcbiAgICAjIyMqXG4gICAgKiBAbWV0aG9kIGNvbW1hbmRDaGFuZ2VTb3VuZHNcbiAgICAqIEBwcm90ZWN0ZWRcbiAgICAjIyMgICAgXG4gICAgY29tbWFuZENoYW5nZVNvdW5kczogLT5cbiAgICAgICAgc291bmRzID0gUmVjb3JkTWFuYWdlci5zeXN0ZW0uc291bmRzXG4gICAgICAgIGZpZWxkRmxhZ3MgPSBAcGFyYW1zLmZpZWxkRmxhZ3MgfHwge31cbiAgICAgICAgXG4gICAgICAgIGZvciBzb3VuZCwgaSBpbiBAcGFyYW1zLnNvdW5kc1xuICAgICAgICAgICAgaWYgIWdzLkNvbW1hbmRGaWVsZEZsYWdzLmlzTG9ja2VkKGZpZWxkRmxhZ3NbXCJzb3VuZHMuXCIraV0pXG4gICAgICAgICAgICAgICAgc291bmRzW2ldID0gQHBhcmFtcy5zb3VuZHNbaV1cbiAgICBcbiAgICAjIyMqXG4gICAgKiBAbWV0aG9kIGNvbW1hbmRDaGFuZ2VDb2xvcnNcbiAgICAqIEBwcm90ZWN0ZWRcbiAgICAjIyMgICAgICAgICAgICBcbiAgICBjb21tYW5kQ2hhbmdlQ29sb3JzOiAtPlxuICAgICAgICBjb2xvcnMgPSBSZWNvcmRNYW5hZ2VyLnN5c3RlbS5jb2xvcnNcbiAgICAgICAgZmllbGRGbGFncyA9IEBwYXJhbXMuZmllbGRGbGFncyB8fCB7fVxuICAgICAgICBcbiAgICAgICAgZm9yIGNvbG9yLCBpIGluIEBwYXJhbXMuY29sb3JzXG4gICAgICAgICAgICBpZiAhZ3MuQ29tbWFuZEZpZWxkRmxhZ3MuaXNMb2NrZWQoZmllbGRGbGFnc1tcImNvbG9ycy5cIitpXSlcbiAgICAgICAgICAgICAgICBjb2xvcnNbaV0gPSBuZXcgZ3MuQ29sb3IoQHBhcmFtcy5jb2xvcnNbaV0pXG4gICAgXG4gICAgIyMjKlxuICAgICogQG1ldGhvZCBjb21tYW5kQ2hhbmdlU2NyZWVuQ3Vyc29yXG4gICAgKiBAcHJvdGVjdGVkXG4gICAgIyMjICAgICAgICAgICAgXG4gICAgY29tbWFuZENoYW5nZVNjcmVlbkN1cnNvcjogLT5cbiAgICAgICAgaWYgQHBhcmFtcy5ncmFwaGljPy5uYW1lP1xuICAgICAgICAgICAgYml0bWFwID0gUmVzb3VyY2VNYW5hZ2VyLmdldEJpdG1hcChcIkdyYXBoaWNzL1BpY3R1cmVzLyN7QHBhcmFtcy5ncmFwaGljLm5hbWV9XCIpXG4gICAgICAgICAgICBHcmFwaGljcy5zZXRDdXJzb3JCaXRtYXAoYml0bWFwLCBAcGFyYW1zLmh4LCBAcGFyYW1zLmh5KVxuICAgICAgICBlbHNlXG4gICAgICAgICAgICBHcmFwaGljcy5zZXRDdXJzb3JCaXRtYXAobnVsbCwgMCwgMClcbiAgICBcbiAgICAjIyMqXG4gICAgKiBAbWV0aG9kIGNvbW1hbmRSZXNldEdsb2JhbERhdGFcbiAgICAqIEBwcm90ZWN0ZWRcbiAgICAjIyMgICAgIFxuICAgIGNvbW1hbmRSZXNldEdsb2JhbERhdGE6IC0+XG4gICAgICAgIEdhbWVNYW5hZ2VyLnJlc2V0R2xvYmFsRGF0YSgpXG4gICAgXG4gICAgIyMjKlxuICAgICogQG1ldGhvZCBjb21tYW5kU2NyaXB0XG4gICAgKiBAcHJvdGVjdGVkXG4gICAgIyMjICAgICAgIFxuICAgIGNvbW1hbmRTY3JpcHQ6IC0+XG4gICAgICAgIHRyeVxuICAgICAgICAgICAgaWYgIUBwYXJhbXMuc2NyaXB0RnVuY1xuICAgICAgICAgICAgICAgIEBwYXJhbXMuc2NyaXB0RnVuYyA9IGV2YWwoXCIoZnVuY3Rpb24oKXtcIiArIEBwYXJhbXMuc2NyaXB0ICsgXCJ9KVwiKVxuICAgICAgICAgICAgICAgIFxuICAgICAgICAgICAgQHBhcmFtcy5zY3JpcHRGdW5jKClcbiAgICAgICAgY2F0Y2ggZXhcbiAgICAgICAgICAgIGNvbnNvbGUubG9nKGV4KVxuICAgICAgICAgICAgXG53aW5kb3cuQ29tbWFuZEludGVycHJldGVyID0gQ29tcG9uZW50X0NvbW1hbmRJbnRlcnByZXRlclxuZ3MuQ29tcG9uZW50X0NvbW1hbmRJbnRlcnByZXRlciA9IENvbXBvbmVudF9Db21tYW5kSW50ZXJwcmV0ZXJcbiAgICBcbiAgICAgICAgXG4gICAgICAgICJdfQ==
//# sourceURL=Component_CommandInterpreter_168.js