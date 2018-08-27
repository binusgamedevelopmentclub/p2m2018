var AudioManager;

AudioManager = (function() {

  /**
  * Manages the audio playback of the game. 
  *
  * @module gs
  * @class AudioManager
  * @memberof gs
  * @constructor
   */
  function AudioManager() {

    /**
    * Stores all audio buffers.
    * @property buffers
    * @type gs.AudioBuffer[]
    * @protected
     */
    this.audioBuffers = [];

    /**
    * Stores all audio buffers by layer.
    * @property buffers
    * @type gs.AudioBuffer[]
    * @protected
     */
    this.audioBuffersByLayer = [];

    /**
    * Stores all audio buffer references for sounds.
    * @property soundReferences
    * @type gs.AudioBufferReference[]
    * @protected
     */
    this.soundReferences = {};

    /**
    * Current Music (Layer 0)
    * @property music
    * @type Object
    * @protected
     */
    this.music = null;

    /**
    * Current music volume.
    * @property musicVolume
    * @type number
    * @protected
     */
    this.musicVolume = 100;

    /**
    * Current sound volume.
    * @property soundVolume
    * @type number
    * @protected
     */
    this.soundVolume = 100;

    /**
    * Current voice volume.
    * @property voiceVolume
    * @type number
    * @protected
     */
    this.voiceVolume = 100;

    /**
    * General music volume
    * @property generalMusicVolume
    * @type number
    * @protected
     */
    this.generalMusicVolume = 100;

    /**
    * General sound volume
    * @property generalSoundVolume
    * @type number
    * @protected
     */
    this.generalSoundVolume = 100;

    /**
    * General voice volume
    * @property generalVoiceVolume
    * @type number
    * @protected
     */
    this.generalVoiceVolume = 100;

    /**
    * Stores audio layer info-data for each layer.
    * @property audioLayers
    * @type gs.AudioLayerInfo[]
    * @protected
     */
    this.audioLayers = [];
  }


  /**
  * Restores audio-playback from a specified array of audio layers.
  *
  * @method restore
  * @param {gs.AudioLayerInfo[]} layers - An array of audio layer info objects.
   */

  AudioManager.prototype.restore = function(layers) {
    var i, j, layer, len, results;
    this.audioLayers = layers;
    results = [];
    for (i = j = 0, len = layers.length; j < len; i = ++j) {
      layer = layers[i];
      if (layer && layer.playing) {
        if (layer.customData) {
          results.push(this.playMusicRandom(layer, layer.customData.fadeTime, i, layer.customData.playTime, layer.customData.playRange));
        } else {
          results.push(this.playMusic(layer, layer.fadeInTime, i));
        }
      } else {
        results.push(void 0);
      }
    }
    return results;
  };


  /**
  * Loads the specified music.
  *
  * @method loadMusic
  * @param {String} name - The name of the music to load.
   */

  AudioManager.prototype.loadMusic = function(name) {
    name = name != null ? name.name || name : name;
    if (name && name.length > 0) {
      return ResourceManager.getAudioStream("Audio/Music/" + name);
    }
  };


  /**
  * Loads the specified sound.
  *
  * @method loadSound
  * @param {String} name - The name of the sound to load.
   */

  AudioManager.prototype.loadSound = function(name) {
    name = name != null ? name.name || name : name;
    if (name && name.length > 0) {
      return ResourceManager.getAudioBuffer("Audio/Sounds/" + name);
    }
  };


  /**
  * Updates a randomly played audio buffer.
  *
  * @method updateRandomAudio
  * @param {gs.AudioBuffer} buffer - The audio buffer to update.
  * @protected
   */

  AudioManager.prototype.updateRandomAudio = function(buffer) {
    var currentTime, timeLeft;
    if (buffer.customData.startTimer > 0) {
      buffer.customData.startTimer--;
      if (buffer.customData.startTimer <= 0) {
        buffer.fadeInVolume = 1.0 / (buffer.customData.fadeTime || 1);
        buffer.fadeInTime = buffer.customData.fadeTime || 1;
        buffer.fadeOutTime = buffer.customData.fadeTime || 1;
        buffer.playTime = buffer.customData.playTime.min + Math.random() * (buffer.customData.playTime.max - buffer.customData.playTime.min);
        currentTime = buffer.currentTime;
        timeLeft = buffer.duration - currentTime;
        buffer.playTime = Math.min(timeLeft * 1000 / 16.6, buffer.playTime);
        return buffer.customData.startTimer = buffer.playTime + buffer.customData.playRange.start + Math.random() * (buffer.customData.playRange.end - buffer.customData.playRange.start);
      }
    }
  };


  /**
  * Updates all audio-buffers depending on the play-type.
  *
  * @method updateAudioBuffers
  * @protected
   */

  AudioManager.prototype.updateAudioBuffers = function() {
    var buffer, j, len, ref, results;
    ref = this.audioBuffers;
    results = [];
    for (j = 0, len = ref.length; j < len; j++) {
      buffer = ref[j];
      if (buffer != null) {
        if (buffer.customData.playType === 1) {
          this.updateRandomAudio(buffer);
        }
        if (GameManager.settings.bgmVolume !== this.generalMusicVolume) {
          buffer.volume = (this.musicVolume * GameManager.settings.bgmVolume / 100) / 100;
          this.generalMusicVolume = GameManager.settings.bgmVolume;
        }
        results.push(buffer.update());
      } else {
        results.push(void 0);
      }
    }
    return results;
  };


  /**
  * Updates all audio-buffers depending on the play-type.
  *
  * @method updateAudioBuffers
  * @protected
   */

  AudioManager.prototype.updateGeneralVolume = function() {
    var k, reference, results;
    if (GameManager.settings.seVolume !== this.generalSoundVolume || GameManager.settings.voiceVolume !== this.generalVoiceVolume) {
      this.generalSoundVolume = GameManager.settings.seVolume;
      this.generalVoiceVolume = GameManager.settings.voiceVolume;
      results = [];
      for (k in this.soundReferences) {
        results.push((function() {
          var j, len, ref, results1;
          ref = this.soundReferences[k];
          results1 = [];
          for (j = 0, len = ref.length; j < len; j++) {
            reference = ref[j];
            if (reference.voice) {
              results1.push(reference.volume = (this.voiceVolume * GameManager.settings.voiceVolume / 100) / 100);
            } else {
              results1.push(reference.volume = (this.soundVolume * GameManager.settings.seVolume / 100) / 100);
            }
          }
          return results1;
        }).call(this));
      }
      return results;
    }
  };


  /**
  * Updates the audio-playback.
  *
  * @method update
   */

  AudioManager.prototype.update = function() {
    this.updateAudioBuffers();
    return this.updateGeneralVolume();
  };


  /**
  * Changes the current music to the specified one.
  *
  * @method changeMusic
  * @param {Object} music - The music to play. If <b>null</b> the current music will stop playing.
   */

  AudioManager.prototype.changeMusic = function(music) {
    if ((music != null) && (music.name != null)) {
      if ((this.music != null) && this.music.name !== music.name) {
        return this.playMusic(music);
      } else if (this.music == null) {
        return this.playMusic(music);
      }
    } else {
      return this.stopMusic();
    }
  };


  /**
  * Prepares. 
  *
  * @method prepare
  * @param {Object} music - The music to play. If <b>null</b> the current music will stop playing.
   */

  AudioManager.prototype.prepare = function(path, volume, rate) {
    var buffer;
    buffer = ResourceManager.getAudioBuffer(path);
    if (buffer.decoded) {
      buffer.volume = volume != null ? volume / 100 : 1.0;
      buffer.playbackRate = rate != null ? rate / 100 : 1.0;
    } else {
      buffer.onFinishDecode = (function(_this) {
        return function(source) {
          source.volume = volume != null ? volume / 100 : 1.0;
          return source.playbackRate = rate != null ? rate / 100 : 1.0;
        };
      })(this);
      buffer.decode();
    }
    return buffer;
  };


  /**
  * Plays an audio resource.
  *
  * @method play
  * @param {String} path - The path to the audio resource.
  * @param {number} volume - The volume.
  * @param {number} rate - The playback rate.
  * @param {number} fadeInTime - The fade-in time in frames.
   */

  AudioManager.prototype.play = function(path, volume, rate, fadeInTime) {
    var buffer;
    buffer = ResourceManager.getAudioStream(path);
    if (buffer.decoded) {
      buffer.volume = volume != null ? volume / 100 : 1.0;
      buffer.playbackRate = rate != null ? rate / 100 : 1.0;
      if (GameManager.settings.bgmEnabled) {
        buffer.play(fadeInTime);
      }
    } else {
      buffer.onFinishDecode = (function(_this) {
        return function(source) {
          source.volume = volume != null ? volume / 100 : 1.0;
          source.playbackRate = rate != null ? rate / 100 : 1.0;
          if (GameManager.settings.bgmEnabled) {
            return source.play(fadeInTime);
          }
        };
      })(this);
      buffer.decode();
    }
    return buffer;
  };


  /**
  * Stops all sounds.
  *
  * @method stopAllSounds
   */

  AudioManager.prototype.stopAllSounds = function() {
    var k, reference, results;
    results = [];
    for (k in this.soundReferences) {
      results.push((function() {
        var j, len, ref, results1;
        ref = this.soundReferences[k];
        results1 = [];
        for (j = 0, len = ref.length; j < len; j++) {
          reference = ref[j];
          results1.push(reference != null ? reference.stop() : void 0);
        }
        return results1;
      }).call(this));
    }
    return results;
  };


  /**
  * Stops a sound and all references of it.
  *
  * @method stopSound
  * @param {String} name - The name of the sound to stop.
   */

  AudioManager.prototype.stopSound = function(name) {
    var j, len, ref, reference, results;
    if (this.soundReferences[name] != null) {
      ref = this.soundReferences[name];
      results = [];
      for (j = 0, len = ref.length; j < len; j++) {
        reference = ref[j];
        results.push(reference.stop());
      }
      return results;
    }
  };


  /**
  * Stops a voice.
  *
  * @method stopVoice
  * @param {String} name - The name of the voice to stop.
   */

  AudioManager.prototype.stopVoice = function(name) {
    return this.stopSound(name);
  };


  /**
  * Stops all voices.
  *
  * @method stopAllVoices
   */

  AudioManager.prototype.stopAllVoices = function() {
    var k, reference, results;
    results = [];
    for (k in this.soundReferences) {
      results.push((function() {
        var j, len, ref, results1;
        ref = this.soundReferences[k];
        results1 = [];
        for (j = 0, len = ref.length; j < len; j++) {
          reference = ref[j];
          if (reference.voice) {
            results1.push(reference.stop());
          } else {
            results1.push(void 0);
          }
        }
        return results1;
      }).call(this));
    }
    return results;
  };


  /**
  * Plays a voice.
  *
  * @method playVoice
  * @param {String} name - The name of the voice to play.
  * @param {number} volume - The voice volume.
  * @param {number} rate - The voice playback rate.
   */

  AudioManager.prototype.playVoice = function(name, volume, rate) {
    var ref, voice;
    voice = null;
    if (GameManager.settings.voiceEnabled && !((ref = $PARAMS.preview) != null ? ref.settings.voiceDisabled : void 0)) {
      voice = this.playSound(name != null ? name.name : void 0, volume || GameManager.defaults.audio.voiceVolume, rate || GameManager.defaults.audio.voicePlaybackRate, false, true);
    }
    return voice;
  };


  /**
  * Plays a sound.
  *
  * @method playSound
  * @param {String} name - The name of the sound to play.
  * @param {number} volume - The sound's volume.
  * @param {number} rate - The sound's playback rate.
  * @param {boolean} musicEffect - Indicates if the sound should be played as a music effect. In that case, the current music
  * at audio-layer will be paused until the sound finishes playing.
  * @param {boolean} voice - Indicates if the sound should be handled as a voice.
   */

  AudioManager.prototype.playSound = function(name, volume, rate, musicEffect, voice, loopSound) {
    var buffer, j, len, r, ref, ref1, reference;
    if ((ref = $PARAMS.preview) != null ? ref.settings.soundDisabled : void 0) {
      return;
    }
    if ((name == null) || (!voice && !GameManager.settings.soundEnabled)) {
      return;
    }
    if (name.name != null) {
      volume = name.volume;
      rate = name.playbackRate;
      name = name.name;
    }
    if (name.length === 0) {
      return;
    }
    if (musicEffect) {
      this.stopMusic();
    }
    if (this.soundReferences[name] == null) {
      this.soundReferences[name] = [];
    }
    volume = volume != null ? volume : 100;
    volume *= voice ? this.generalVoiceVolume / 100 : this.generalSoundVolume / 100;
    reference = null;
    ref1 = this.soundReferences[name];
    for (j = 0, len = ref1.length; j < len; j++) {
      r = ref1[j];
      if (!r.isPlaying) {
        reference = r;
        if (musicEffect) {
          reference.onEnd = (function(_this) {
            return function() {
              return _this.resumeMusic(40);
            };
          })(this);
        }
        reference.voice = voice;
        reference.volume = volume / 100;
        reference.playbackRate = rate / 100;
        reference.loop = loopSound;
        if (voice) {
          this.voice = reference;
        }
        reference.play();
        break;
      }
    }
    if (reference == null) {
      buffer = ResourceManager.getAudioBuffer("Audio/Sounds/" + name);
      if (buffer && buffer.loaded) {
        if (buffer.decoded) {
          reference = new GS.AudioBufferReference(buffer, voice);
          if (musicEffect) {
            reference.onEnd = (function(_this) {
              return function() {
                return _this.resumeMusic(40);
              };
            })(this);
          }
          reference.volume = volume / 100;
          reference.playbackRate = rate / 100;
          reference.voice = voice;
          reference.loop = loopSound;
          reference.play();
          if (voice) {
            this.voice = reference;
          }
          this.soundReferences[name].push(reference);
        } else {
          buffer.name = name;
          buffer.onDecodeFinish = (function(_this) {
            return function(source) {
              reference = new GS.AudioBufferReference(source, voice);
              if (musicEffect) {
                reference.onEnd = function() {
                  return _this.resumeMusic(40);
                };
              }
              reference.voice = voice;
              reference.volume = volume / 100;
              reference.playbackRate = rate / 100;
              reference.loop = loopSound;
              if (voice) {
                _this.voice = reference;
              }
              reference.play();
              return _this.soundReferences[source.name].push(reference);
            };
          })(this);
          buffer.decode();
        }
      }
    }
    return reference;
  };


  /**
  * Plays a music as a random music. A random music will fade-in and fade-out
  * at random times. That can be combined with other audio-layers to create a
  * much better looping of an audio track.
  *
  * @method playMusicRandom
  * @param {Object} music - The music to play.
  * @param {number} fadeTime - The time for a single fade-in/out in frames.
  * @param {number} layer - The audio layer to use.
  * @param {gs.Range} playTime - Play-Time range like 10s to 30s.
  * @param {gs.Range} playRange - Play-Range.
   */

  AudioManager.prototype.playMusicRandom = function(music, fadeTime, layer, playTime, playRange) {
    var musicBuffer, ref, volume;
    if ((ref = $PARAMS.preview) != null ? ref.settings.musicDisabled : void 0) {
      return;
    }
    layer = layer != null ? layer : 0;
    volume = music.volume != null ? music.volume : 100;
    volume = volume * (this.generalMusicVolume / 100);
    this.musicVolume = volume;
    this.disposeMusic(layer);
    if ((music.name != null) && music.name.length > 0) {
      musicBuffer = this.play("Audio/Music/" + music.name, volume, music.rate);
      musicBuffer.loop = true;
      musicBuffer.volume = 0;
      musicBuffer.duration = Math.round(musicBuffer.duration * 1000 / 16.6);
      musicBuffer.customData.playType = 1;
      musicBuffer.customData.playTime = playTime;
      if (playRange.end === 0) {
        musicBuffer.customData.playRange = {
          start: playRange.start,
          end: musicBuffer.duration
        };
      } else {
        musicBuffer.customData.playRange = playRange;
      }
      musicBuffer.customData.fadeTime = fadeTime;
      musicBuffer.customData.startTimer = Math.round(musicBuffer.customData.playRange.start + Math.random() * (musicBuffer.customData.playRange.end - musicBuffer.customData.playRange.start));
      if (!this.audioBuffers.contains(musicBuffer)) {
        this.audioBuffers.push(musicBuffer);
      }
      this.audioBuffersByLayer[layer] = musicBuffer;
      return this.audioLayers[layer] = {
        name: music.name,
        time: music.currentTime,
        volume: music.volume,
        rate: music.playbackRate,
        fadeInTime: fadeTime,
        customData: musicBuffer.customData
      };
    }
  };


  /**
  * Plays a music.
  *
  * @method playMusic
  * @param {string|Object} name - The music to play. Can be just a name or a music data-object.
  * @param {number} volume - The music's volume in percent.
  * @param {number} rate - The music's playback rate in percent.
  * @param {number} fadeInTime - The fade-in time.
  * @param {number} layer - The layer to play the music on.
  * @param {boolean} loop - Indicates if the music should be looped
   */

  AudioManager.prototype.playMusic = function(name, volume, rate, fadeInTime, layer, loopMusic) {
    var musicBuffer, ref;
    if ((ref = $PARAMS.preview) != null ? ref.settings.musicDisabled : void 0) {
      return;
    }
    if (loopMusic == null) {
      loopMusic = true;
    }
    if ((name != null) && (name.name != null)) {
      layer = layer != null ? layer : rate || 0;
      fadeInTime = volume;
      volume = name.volume;
      rate = name.playbackRate;
      name = name.name;
    } else {
      layer = layer != null ? layer : 0;
    }
    this.disposeMusic(layer);
    this.audioLayers[layer] = {
      name: name,
      volume: volume,
      rate: rate,
      fadeInTime: fadeInTime,
      playing: true
    };
    volume = volume != null ? volume : 100;
    volume = volume * (this.generalMusicVolume / 100);
    this.musicVolume = volume;
    if ((name != null) && name.length > 0) {
      this.music = {
        name: name
      };
      musicBuffer = this.play("Audio/Music/" + name, volume, rate, fadeInTime);
      musicBuffer.loop = loopMusic;
      if (!this.audioBuffers.contains(musicBuffer)) {
        this.audioBuffers.push(musicBuffer);
      }
      this.audioBuffersByLayer[layer] = musicBuffer;
    }
    return musicBuffer;
  };


  /**
  * Resumes a paused music.
  *
  * @method resumeMusic
  * @param {number} fadeInTime - The fade-in time in frames.
  * @param {number} layer - The audio layer to resume.
   */

  AudioManager.prototype.resumeMusic = function(fadeInTime, layer) {
    var ref;
    layer = layer != null ? layer : 0;
    if ((this.audioBuffersByLayer[layer] != null) && !this.audioBuffersByLayer[layer].isPlaying) {
      this.audioBuffersByLayer[layer].resume(fadeInTime);
      return (ref = this.audioLayers[layer]) != null ? ref.playing = true : void 0;
    }
  };


  /**
  * Stops a music.
  *
  * @method stopMusic
  * @param {number} fadeOutTime - The fade-out time in frames.
  * @param {number} layer - The audio layer to stop.
   */

  AudioManager.prototype.stopMusic = function(fadeOutTime, layer) {
    var ref, ref1, ref2;
    layer = layer != null ? layer : 0;
    if ((ref = this.audioBuffersByLayer[layer]) != null) {
      ref.stop(fadeOutTime);
    }
    if ((ref1 = this.audioBuffersByLayer[layer]) != null) {
      ref1.customData = {};
    }
    if ((ref2 = this.audioLayers[layer]) != null) {
      ref2.playing = false;
    }
    return this.music = null;
  };


  /**
  * Stops all music/audio layers.
  *
  * @method stopAllMusic
  * @param {number} fadeOutTime - The fade-out time in frames.
   */

  AudioManager.prototype.stopAllMusic = function(fadeOutTime) {
    var buffer, j, len, ref;
    ref = this.audioBuffers;
    for (j = 0, len = ref.length; j < len; j++) {
      buffer = ref[j];
      if (buffer != null) {
        buffer.stop(fadeOutTime);
        buffer.customData = {};
      }
    }
    return this.music = null;
  };

  AudioManager.prototype.dispose = function(context) {
    var buffer, data, j, layer, len, ref, results;
    data = context.resources.select(function(r) {
      return r.data;
    });
    ref = this.audioBuffersByLayer;
    results = [];
    for (layer = j = 0, len = ref.length; j < len; layer = ++j) {
      buffer = ref[layer];
      if (buffer && data.indexOf(buffer) !== -1) {
        buffer.dispose();
        this.audioBuffers.remove(buffer);
        this.audioBuffersByLayer[layer] = null;
        results.push(this.audioLayers[layer] = null);
      } else {
        results.push(void 0);
      }
    }
    return results;
  };


  /**
  * Disposes a music.
  *
  * @method disposeMusic
  * @param {number} layer - The audio layer of the music to dispose.
   */

  AudioManager.prototype.disposeMusic = function(layer) {
    layer = layer != null ? layer : 0;
    this.stopMusic(0, layer);
    this.audioBuffers.remove(this.audioBuffersByLayer[layer]);
    this.audioBuffersByLayer[layer] = null;
    return this.audioLayers[layer] = null;
  };

  return AudioManager;

})();

window.AudioManager = new AudioManager();

gs.AudioManager = AudioManager;

//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQU9BLElBQUE7O0FBQU07O0FBQ0Y7Ozs7Ozs7O0VBUWEsc0JBQUE7O0FBQ1Q7Ozs7OztJQU1BLElBQUMsQ0FBQSxZQUFELEdBQWdCOztBQUVoQjs7Ozs7O0lBTUEsSUFBQyxDQUFBLG1CQUFELEdBQXVCOztBQUV2Qjs7Ozs7O0lBTUEsSUFBQyxDQUFBLGVBQUQsR0FBbUI7O0FBRW5COzs7Ozs7SUFNQSxJQUFDLENBQUEsS0FBRCxHQUFTOztBQUVUOzs7Ozs7SUFNQSxJQUFDLENBQUEsV0FBRCxHQUFlOztBQUVmOzs7Ozs7SUFNQSxJQUFDLENBQUEsV0FBRCxHQUFlOztBQUVmOzs7Ozs7SUFNQSxJQUFDLENBQUEsV0FBRCxHQUFlOztBQUVmOzs7Ozs7SUFNQSxJQUFDLENBQUEsa0JBQUQsR0FBc0I7O0FBRXRCOzs7Ozs7SUFNQSxJQUFDLENBQUEsa0JBQUQsR0FBc0I7O0FBRXRCOzs7Ozs7SUFNQSxJQUFDLENBQUEsa0JBQUQsR0FBc0I7O0FBRXRCOzs7Ozs7SUFNQSxJQUFDLENBQUEsV0FBRCxHQUFlO0VBdkZOOzs7QUF5RmI7Ozs7Ozs7eUJBTUEsT0FBQSxHQUFTLFNBQUMsTUFBRDtBQUNMLFFBQUE7SUFBQSxJQUFDLENBQUEsV0FBRCxHQUFlO0FBRWY7U0FBQSxnREFBQTs7TUFDSSxJQUFHLEtBQUEsSUFBVSxLQUFLLENBQUMsT0FBbkI7UUFDSSxJQUFHLEtBQUssQ0FBQyxVQUFUO3VCQUNJLElBQUMsQ0FBQSxlQUFELENBQWlCLEtBQWpCLEVBQXdCLEtBQUssQ0FBQyxVQUFVLENBQUMsUUFBekMsRUFBbUQsQ0FBbkQsRUFBc0QsS0FBSyxDQUFDLFVBQVUsQ0FBQyxRQUF2RSxFQUFpRixLQUFLLENBQUMsVUFBVSxDQUFDLFNBQWxHLEdBREo7U0FBQSxNQUFBO3VCQUdJLElBQUMsQ0FBQSxTQUFELENBQVcsS0FBWCxFQUFrQixLQUFLLENBQUMsVUFBeEIsRUFB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Q0FBQSxTQUFELENBQVcsQ0FBWCxFQUFjLEtBQWQ7SUFFQSxJQUFDLENBQUEsWUFBWSxDQUFDLE1BQWQsQ0FBcUIsSUFBQyxDQUFBLG1CQUFvQixDQUFBLEtBQUEsQ0FBMUM7SUFDQSxJQUFDLENBQUEsbUJBQW9CLENBQUEsS0FBQSxDQUFyQixHQUE4QjtXQUM5QixJQUFDLENBQUEsV0FBWSxDQUFBLEtBQUEsQ0FBYixHQUFzQjtFQVBaOzs7Ozs7QUFTbEIsTUFBTSxDQUFDLFlBQVAsR0FBMEIsSUFBQSxZQUFBLENBQUE7O0FBQzFCLEVBQUUsQ0FBQyxZQUFILEdBQWtCIiwic291cmNlc0NvbnRlbnQiOlsiIyA9PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09XG4jXG4jICAgU2NyaXB0OiBBdWRpb01hbmFnZXJcbiNcbiMgICAkJENPUFlSSUdIVCQkXG4jXG4jID09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT1cbmNsYXNzIEF1ZGlvTWFuYWdlclxuICAgICMjIypcbiAgICAqIE1hbmFnZXMgdGhlIGF1ZGlvIHBsYXliYWNrIG9mIHRoZSBnYW1lLiBcbiAgICAqXG4gICAgKiBAbW9kdWxlIGdzXG4gICAgKiBAY2xhc3MgQXVkaW9NYW5hZ2VyXG4gICAgKiBAbWVtYmVyb2YgZ3NcbiAgICAqIEBjb25zdHJ1Y3RvclxuICAgICMjI1xuICAgIGNvbnN0cnVjdG9yOiAtPlxuICAgICAgICAjIyMqXG4gICAgICAgICogU3RvcmVzIGFsbCBhdWRpbyBidWZmZXJzLlxuICAgICAgICAqIEBwcm9wZXJ0eSBidWZmZXJzXG4gICAgICAgICogQHR5cGUgZ3MuQXVkaW9CdWZmZXJbXVxuICAgICAgICAqIEBwcm90ZWN0ZWRcbiAgICAgICAgIyMjICBcbiAgICAgICAgQGF1ZGlvQnVmZmVycyA9IFtdXG4gICAgICAgIFxuICAgICAgICAjIyMqXG4gICAgICAgICogU3RvcmVzIGFsbCBhdWRpbyBidWZmZXJzIGJ5IGxheWVyLlxuICAgICAgICAqIEBwcm9wZXJ0eSBidWZmZXJzXG4gICAgICAgICogQHR5cGUgZ3MuQXVkaW9CdWZmZXJbXVxuICAgICAgICAqIEBwcm90ZWN0ZWRcbiAgICAgICAgIyMjICBcbiAgICAgICAgQGF1ZGlvQnVmZmVyc0J5TGF5ZXIgPSBbXVxuICAgICAgICBcbiAgICAgICAgIyMjKlxuICAgICAgICAqIFN0b3JlcyBhbGwgYXVkaW8gYnVmZmVyIHJlZmVyZW5jZXMgZm9yIHNvdW5kcy5cbiAgICAgICAgKiBAcHJvcGVydHkgc291bmRSZWZlcmVuY2VzXG4gICAgICAgICogQHR5cGUgZ3MuQXVkaW9CdWZmZXJSZWZlcmVuY2VbXVxuICAgICAgICAqIEBwcm90ZWN0ZWRcbiAgICAgICAgIyMjICBcbiAgICAgICAgQHNvdW5kUmVmZXJlbmNlcyA9IHt9XG4gICAgICAgIFxuICAgICAgICAjIyMqXG4gICAgICAgICogQ3VycmVudCBNdXNpYyAoTGF5ZXIgMClcbiAgICAgICAgKiBAcHJvcGVydHkgbXVzaWNcbiAgICAgICAgKiBAdHlwZSBPYmplY3RcbiAgICAgICAgKiBAcHJvdGVjdGVkXG4gICAgICAgICMjIyBcbiAgICAgICAgQG11c2ljID0gbnVsbFxuICAgICAgICBcbiAgICAgICAgIyMjKlxuICAgICAgICAqIEN1cnJlbnQgbXVzaWMgdm9sdW1lLlxuICAgICAgICAqIEBwcm9wZXJ0eSBtdXNpY1ZvbHVtZVxuICAgICAgICAqIEB0eXBlIG51bWJlclxuICAgICAgICAqIEBwcm90ZWN0ZWRcbiAgICAgICAgIyMjIFxuICAgICAgICBAbXVzaWNWb2x1bWUgPSAxMDBcbiAgICAgICAgXG4gICAgICAgICMjIypcbiAgICAgICAgKiBDdXJyZW50IHNvdW5kIHZvbHVtZS5cbiAgICAgICAgKiBAcHJvcGVydHkgc291bmRWb2x1bWVcbiAgICAgICAgKiBAdHlwZSBudW1iZXJcbiAgICAgICAgKiBAcHJvdGVjdGVkXG4gICAgICAgICMjIyBcbiAgICAgICAgQHNvdW5kVm9sdW1lID0gMTAwXG4gICAgICAgIFxuICAgICAgICAjIyMqXG4gICAgICAgICogQ3VycmVudCB2b2ljZSB2b2x1bWUuXG4gICAgICAgICogQHByb3BlcnR5IHZvaWNlVm9sdW1lXG4gICAgICAgICogQHR5cGUgbnVtYmVyXG4gICAgICAgICogQHByb3RlY3RlZFxuICAgICAgICAjIyMgXG4gICAgICAgIEB2b2ljZVZvbHVtZSA9IDEwMFxuICAgICAgICBcbiAgICAgICAgIyMjKlxuICAgICAgICAqIEdlbmVyYWwgbXVzaWMgdm9sdW1lXG4gICAgICAgICogQHByb3BlcnR5IGdlbmVyYWxNdXNpY1ZvbHVtZVxuICAgICAgICAqIEB0eXBlIG51bWJlclxuICAgICAgICAqIEBwcm90ZWN0ZWRcbiAgICAgICAgIyMjIFxuICAgICAgICBAZ2VuZXJhbE11c2ljVm9sdW1lID0gMTAwXG4gICAgICAgIFxuICAgICAgICAjIyMqXG4gICAgICAgICogR2VuZXJhbCBzb3VuZCB2b2x1bWVcbiAgICAgICAgKiBAcHJvcGVydHkgZ2VuZXJhbFNvdW5kVm9sdW1lXG4gICAgICAgICogQHR5cGUgbnVtYmVyXG4gICAgICAgICogQHByb3RlY3RlZFxuICAgICAgICAjIyMgXG4gICAgICAgIEBnZW5lcmFsU291bmRWb2x1bWUgPSAxMDBcbiAgICAgICAgXG4gICAgICAgICMjIypcbiAgICAgICAgKiBHZW5lcmFsIHZvaWNlIHZvbHVtZVxuICAgICAgICAqIEBwcm9wZXJ0eSBnZW5lcmFsVm9pY2VWb2x1bWVcbiAgICAgICAgKiBAdHlwZSBudW1iZXJcbiAgICAgICAgKiBAcHJvdGVjdGVkXG4gICAgICAgICMjIyBcbiAgICAgICAgQGdlbmVyYWxWb2ljZVZvbHVtZSA9IDEwMFxuICAgICAgICBcbiAgICAgICAgIyMjKlxuICAgICAgICAqIFN0b3JlcyBhdWRpbyBsYXllciBpbmZvLWRhdGEgZm9yIGVhY2ggbGF5ZXIuXG4gICAgICAgICogQHByb3BlcnR5IGF1ZGlvTGF5ZXJzXG4gICAgICAgICogQHR5cGUgZ3MuQXVkaW9MYXllckluZm9bXVxuICAgICAgICAqIEBwcm90ZWN0ZWRcbiAgICAgICAgIyMjIFxuICAgICAgICBAYXVkaW9MYXllcnMgPSBbXVxuICAgICAgXG4gICAgIyMjKlxuICAgICogUmVzdG9yZXMgYXVkaW8tcGxheWJhY2sgZnJvbSBhIHNwZWNpZmllZCBhcnJheSBvZiBhdWRpbyBsYXllcnMuXG4gICAgKlxuICAgICogQG1ldGhvZCByZXN0b3JlXG4gICAgKiBAcGFyYW0ge2dzLkF1ZGlvTGF5ZXJJbmZvW119IGxheWVycyAtIEFuIGFycmF5IG9mIGF1ZGlvIGxheWVyIGluZm8gb2JqZWN0cy5cbiAgICAjIyMgIFxuICAgIHJlc3RvcmU6IChsYXllcnMpIC0+XG4gICAgICAgIEBhdWRpb0xheWVycyA9IGxheWVyc1xuICAgICAgICBcbiAgICAgICAgZm9yIGxheWVyLCBpIGluIGxheWVyc1xuICAgICAgICAgICAgaWYgbGF5ZXIgYW5kIGxheWVyLnBsYXlpbmdcbiAgICAgICAgICAgICAgICBpZiBsYXllci5jdXN0b21EYXRhXG4gICAgICAgICAgICAgICAgICAgIEBwbGF5TXVzaWNSYW5kb20obGF5ZXIsIGxheWVyLmN1c3RvbURhdGEuZmFkZVRpbWUsIGksIGxheWVyLmN1c3RvbURhdGEucGxheVRpbWUsIGxheWVyLmN1c3RvbURhdGEucGxheVJhbmdlKVxuICAgICAgICAgICAgICAgIGVsc2VcbiAgICAgICAgICAgICAgICAgICAgQHBsYXlNdXNpYyhsYXllciwgbGF5ZXIuZmFkZUluVGltZSwgaSlcbiAgICAgXG4gICAgIyMjKlxuICAgICogTG9hZHMgdGhlIHNwZWNpZmllZCBtdXNpYy5cbiAgICAqXG4gICAgKiBAbWV0aG9kIGxvYWRNdXNpY1xuICAgICogQHBhcmFtIHtTdHJpbmd9IG5hbWUgLSBUaGUgbmFtZSBvZiB0aGUgbXVzaWMgdG8gbG9hZC5cbiAgICAjIyMgICAgXG4gICAgbG9hZE11c2ljOiAobmFtZSkgLT4gXG4gICAgICAgIG5hbWUgPSBpZiBuYW1lPyB0aGVuIChuYW1lLm5hbWUgfHwgbmFtZSkgZWxzZSBuYW1lXG4gICAgICAgIGlmIG5hbWUgYW5kIG5hbWUubGVuZ3RoID4gMFxuICAgICAgICAgICAgUmVzb3VyY2VNYW5hZ2VyLmdldEF1ZGlvU3RyZWFtKFwiQXVkaW8vTXVzaWMvI3tuYW1lfVwiKVxuICAgICBcbiAgICAjIyMqXG4gICAgKiBMb2FkcyB0aGUgc3BlY2lmaWVkIHNvdW5kLlxuICAgICpcbiAgICAqIEBtZXRob2QgbG9hZFNvdW5kXG4gICAgKiBAcGFyYW0ge1N0cmluZ30gbmFtZSAtIFRoZSBuYW1lIG9mIHRoZSBzb3VuZCB0byBsb2FkLlxuICAgICMjIyAgICAgICAgICAgXG4gICAgbG9hZFNvdW5kOiAobmFtZSkgLT4gXG4gICAgICAgIG5hbWUgPSBpZiBuYW1lPyB0aGVuIG5hbWUubmFtZSB8fCBuYW1lIGVsc2UgbmFtZVxuICAgICAgICBpZiBuYW1lIGFuZCBuYW1lLmxlbmd0aCA+IDBcbiAgICAgICAgICAgIFJlc291cmNlTWFuYWdlci5nZXRBdWRpb0J1ZmZlcihcIkF1ZGlvL1NvdW5kcy8je25hbWV9XCIpXG4gICAgXG4gICAgIyMjKlxuICAgICogVXBkYXRlcyBhIHJhbmRvbWx5IHBsYXllZCBhdWRpbyBidWZmZXIuXG4gICAgKlxuICAgICogQG1ldGhvZCB1cGRhdGVSYW5kb21BdWRpb1xuICAgICogQHBhcmFtIHtncy5BdWRpb0J1ZmZlcn0gYnVmZmVyIC0gVGhlIGF1ZGlvIGJ1ZmZlciB0byB1cGRhdGUuXG4gICAgKiBAcHJvdGVjdGVkXG4gICAgIyMjICAgIFxuICAgICMgRklYTUU6IFJlZmFjdG9yaW5nIG5lY2Vzc2FyeS4gICAgICBcbiAgICB1cGRhdGVSYW5kb21BdWRpbzogKGJ1ZmZlcikgLT5cbiAgICAgICAgaWYgYnVmZmVyLmN1c3RvbURhdGEuc3RhcnRUaW1lciA+IDBcbiAgICAgICAgICAgIGJ1ZmZlci5jdXN0b21EYXRhLnN0YXJ0VGltZXItLVxuICAgICAgICAgICAgaWYgYnVmZmVyLmN1c3RvbURhdGEuc3RhcnRUaW1lciA8PSAwXG4gICAgICAgICAgICAgICAgYnVmZmVyLmZhZGVJblZvbHVtZSA9IDEuMCAvIChidWZmZXIuY3VzdG9tRGF0YS5mYWRlVGltZXx8MSlcbiAgICAgICAgICAgICAgICBidWZmZXIuZmFkZUluVGltZSA9IGJ1ZmZlci5jdXN0b21EYXRhLmZhZGVUaW1lfHwxXG4gICAgICAgICAgICAgICAgYnVmZmVyLmZhZGVPdXRUaW1lID0gYnVmZmVyLmN1c3RvbURhdGEuZmFkZVRpbWV8fDFcbiAgICAgICAgICAgICAgICBidWZmZXIucGxheVRpbWUgPSBidWZmZXIuY3VzdG9tRGF0YS5wbGF5VGltZS5taW4gKyBNYXRoLnJhbmRvbSgpICogKGJ1ZmZlci5jdXN0b21EYXRhLnBsYXlUaW1lLm1heCAtIGJ1ZmZlci5jdXN0b21EYXRhLnBsYXlUaW1lLm1pbilcbiAgICAgICAgICAgICAgICBjdXJyZW50VGltZSA9IGJ1ZmZlci5jdXJyZW50VGltZSAjIC0gYnVmZmVyLnN0YXJ0VGltZVxuICAgICAgICAgICAgICAgIHRpbWVMZWZ0ID0gYnVmZmVyLmR1cmF0aW9uIC0gY3VycmVudFRpbWVcbiAgICAgICAgICAgICAgICBidWZmZXIucGxheVRpbWUgPSBNYXRoLm1pbih0aW1lTGVmdCAqIDEwMDAgLyAxNi42LCBidWZmZXIucGxheVRpbWUpXG4gICAgXG4gICAgICAgICAgICAgICAgYnVmZmVyLmN1c3RvbURhdGEuc3RhcnRUaW1lciA9IGJ1ZmZlci5wbGF5VGltZSArIGJ1ZmZlci5jdXN0b21EYXRhLnBsYXlSYW5nZS5zdGFydCArIE1hdGgucmFuZG9tKCkgKiAoYnVmZmVyLmN1c3RvbURhdGEucGxheVJhbmdlLmVuZCAtIGJ1ZmZlci5jdXN0b21EYXRhLnBsYXlSYW5nZS5zdGFydClcbiAgICBcbiAgICAjIyMqXG4gICAgKiBVcGRhdGVzIGFsbCBhdWRpby1idWZmZXJzIGRlcGVuZGluZyBvbiB0aGUgcGxheS10eXBlLlxuICAgICpcbiAgICAqIEBtZXRob2QgdXBkYXRlQXVkaW9CdWZmZXJzXG4gICAgKiBAcHJvdGVjdGVkXG4gICAgIyMjICAgXG4gICAgdXBkYXRlQXVkaW9CdWZmZXJzOiAtPlxuICAgICAgICBmb3IgYnVmZmVyIGluIEBhdWRpb0J1ZmZlcnNcbiAgICAgICAgICAgIGlmIGJ1ZmZlcj9cbiAgICAgICAgICAgICAgICBpZiBidWZmZXIuY3VzdG9tRGF0YS5wbGF5VHlwZSA9PSAxXG4gICAgICAgICAgICAgICAgICAgIEB1cGRhdGVSYW5kb21BdWRpbyhidWZmZXIpXG4gICAgICAgICAgICAgICAgICAgIFxuICAgICAgICAgICAgICAgIGlmIEdhbWVNYW5hZ2VyLnNldHRpbmdzLmJnbVZvbHVtZSAhPSBAZ2VuZXJhbE11c2ljVm9sdW1lXG4gICAgICAgICAgICAgICAgICAgIGJ1ZmZlci52b2x1bWUgPSAoQG11c2ljVm9sdW1lICogR2FtZU1hbmFnZXIuc2V0dGluZ3MuYmdtVm9sdW1lIC8gMTAwKSAvIDEwMFxuICAgICAgICAgICAgICAgICAgICBAZ2VuZXJhbE11c2ljVm9sdW1lID0gR2FtZU1hbmFnZXIuc2V0dGluZ3MuYmdtVm9sdW1lXG4gICAgICAgICAgICAgICAgYnVmZmVyLnVwZGF0ZSgpXG4gICAgXG4gICAgXG4gICAgIyMjKlxuICAgICogVXBkYXRlcyBhbGwgYXVkaW8tYnVmZmVycyBkZXBlbmRpbmcgb24gdGhlIHBsYXktdHlwZS5cbiAgICAqXG4gICAgKiBAbWV0aG9kIHVwZGF0ZUF1ZGlvQnVmZmVyc1xuICAgICogQHByb3RlY3RlZFxuICAgICMjIyAgICAgICAgICAgICBcbiAgICB1cGRhdGVHZW5lcmFsVm9sdW1lOiAtPlxuICAgICAgICBpZiBHYW1lTWFuYWdlci5zZXR0aW5ncy5zZVZvbHVtZSAhPSBAZ2VuZXJhbFNvdW5kVm9sdW1lIG9yIEdhbWVNYW5hZ2VyLnNldHRpbmdzLnZvaWNlVm9sdW1lICE9IEBnZW5lcmFsVm9pY2VWb2x1bWVcbiAgICAgICAgICAgIEBnZW5lcmFsU291bmRWb2x1bWUgPSBHYW1lTWFuYWdlci5zZXR0aW5ncy5zZVZvbHVtZVxuICAgICAgICAgICAgQGdlbmVyYWxWb2ljZVZvbHVtZSA9IEdhbWVNYW5hZ2VyLnNldHRpbmdzLnZvaWNlVm9sdW1lXG4gICAgICAgICAgICBmb3IgayBvZiBAc291bmRSZWZlcmVuY2VzXG4gICAgICAgICAgICAgICAgZm9yIHJlZmVyZW5jZSBpbiBAc291bmRSZWZlcmVuY2VzW2tdXG4gICAgICAgICAgICAgICAgICAgIGlmIHJlZmVyZW5jZS52b2ljZVxuICAgICAgICAgICAgICAgICAgICAgICAgcmVmZXJlbmNlLnZvbHVtZSA9IChAdm9pY2VWb2x1bWUgKiBHYW1lTWFuYWdlci5zZXR0aW5ncy52b2ljZVZvbHVtZSAvIDEwMCkgLyAxMDBcbiAgICAgICAgICAgICAgICAgICAgZWxzZVxuICAgICAgICAgICAgICAgICAgICAgICAgcmVmZXJlbmNlLnZvbHVtZSA9IChAc291bmRWb2x1bWUgKiBHYW1lTWFuYWdlci5zZXR0aW5ncy5zZVZvbHVtZSAvIDEwMCkgLyAxMDBcbiAgICAjIyMqXG4gICAgKiBVcGRhdGVzIHRoZSBhdWRpby1wbGF5YmFjay5cbiAgICAqXG4gICAgKiBAbWV0aG9kIHVwZGF0ZVxuICAgICMjIyAgICAgICAgICAgICAgICBcbiAgICB1cGRhdGU6IC0+XG4gICAgICAgIEB1cGRhdGVBdWRpb0J1ZmZlcnMoKVxuICAgICAgICBAdXBkYXRlR2VuZXJhbFZvbHVtZSgpXG4gICAgIFxuICAgICMjIypcbiAgICAqIENoYW5nZXMgdGhlIGN1cnJlbnQgbXVzaWMgdG8gdGhlIHNwZWNpZmllZCBvbmUuXG4gICAgKlxuICAgICogQG1ldGhvZCBjaGFuZ2VNdXNpY1xuICAgICogQHBhcmFtIHtPYmplY3R9IG11c2ljIC0gVGhlIG11c2ljIHRvIHBsYXkuIElmIDxiPm51bGw8L2I+IHRoZSBjdXJyZW50IG11c2ljIHdpbGwgc3RvcCBwbGF5aW5nLlxuICAgICMjIyAgICAgICAgICAgXG4gICAgY2hhbmdlTXVzaWM6IChtdXNpYykgLT5cbiAgICAgICAgaWYgbXVzaWM/IGFuZCBtdXNpYy5uYW1lP1xuICAgICAgICAgICAgaWYgQG11c2ljPyBhbmQgQG11c2ljLm5hbWUgIT0gbXVzaWMubmFtZVxuICAgICAgICAgICAgICAgIEBwbGF5TXVzaWMobXVzaWMpXG4gICAgICAgICAgICBlbHNlIGlmIG5vdCBAbXVzaWM/XG4gICAgICAgICAgICAgICAgQHBsYXlNdXNpYyhtdXNpYylcbiAgICAgICAgZWxzZVxuICAgICAgICAgICAgQHN0b3BNdXNpYygpXG4gICAgIFxuICAgICMgRklYTUU6IElzIHRoaXMgc3RpbGwgdXNlZD9cbiAgICAjIyMqXG4gICAgKiBQcmVwYXJlcy4gXG4gICAgKlxuICAgICogQG1ldGhvZCBwcmVwYXJlXG4gICAgKiBAcGFyYW0ge09iamVjdH0gbXVzaWMgLSBUaGUgbXVzaWMgdG8gcGxheS4gSWYgPGI+bnVsbDwvYj4gdGhlIGN1cnJlbnQgbXVzaWMgd2lsbCBzdG9wIHBsYXlpbmcuXG4gICAgIyMjICAgICAgICAgICAgXG4gICAgcHJlcGFyZTogKHBhdGgsIHZvbHVtZSwgcmF0ZSkgLT4gXG4gICAgICAgIGJ1ZmZlciA9IFJlc291cmNlTWFuYWdlci5nZXRBdWRpb0J1ZmZlcihwYXRoKVxuICAgICAgICBcbiAgICAgICAgaWYgYnVmZmVyLmRlY29kZWRcbiAgICAgICAgICAgIGJ1ZmZlci52b2x1bWUgPSBpZiB2b2x1bWU/IHRoZW4gdm9sdW1lIC8gMTAwIGVsc2UgMS4wXG4gICAgICAgICAgICBidWZmZXIucGxheWJhY2tSYXRlID0gaWYgcmF0ZT8gdGhlbiByYXRlIC8gMTAwIGVsc2UgMS4wXG4gICAgICAgIGVsc2VcbiAgICAgICAgICAgYnVmZmVyLm9uRmluaXNoRGVjb2RlID0gKHNvdXJjZSkgPT4gXG4gICAgICAgICAgICAgICBzb3VyY2Uudm9sdW1lID0gaWYgdm9sdW1lPyB0aGVuIHZvbHVtZSAvIDEwMCBlbHNlIDEuMFxuICAgICAgICAgICAgICAgc291cmNlLnBsYXliYWNrUmF0ZSA9IGlmIHJhdGU/IHRoZW4gcmF0ZSAvIDEwMCBlbHNlIDEuMFxuICAgICAgICAgICBidWZmZXIuZGVjb2RlKClcbiAgICAgICAgICAgXG4gICAgICAgIHJldHVybiBidWZmZXJcbiAgICAgICAgXG4gICAgIyMjKlxuICAgICogUGxheXMgYW4gYXVkaW8gcmVzb3VyY2UuXG4gICAgKlxuICAgICogQG1ldGhvZCBwbGF5XG4gICAgKiBAcGFyYW0ge1N0cmluZ30gcGF0aCAtIFRoZSBwYXRoIHRvIHRoZSBhdWRpbyByZXNvdXJjZS5cbiAgICAqIEBwYXJhbSB7bnVtYmVyfSB2b2x1bWUgLSBUaGUgdm9sdW1lLlxuICAgICogQHBhcmFtIHtudW1iZXJ9IHJhdGUgLSBUaGUgcGxheWJhY2sgcmF0ZS5cbiAgICAqIEBwYXJhbSB7bnVtYmVyfSBmYWRlSW5UaW1lIC0gVGhlIGZhZGUtaW4gdGltZSBpbiBmcmFtZXMuXG4gICAgIyMjICAgICBcbiAgICBwbGF5OiAocGF0aCwgdm9sdW1lLCByYXRlLCBmYWRlSW5UaW1lKSAtPlxuICAgICAgICBidWZmZXIgPSBSZXNvdXJjZU1hbmFnZXIuZ2V0QXVkaW9TdHJlYW0ocGF0aClcbiAgICBcbiAgICAgICAgaWYgYnVmZmVyLmRlY29kZWRcbiAgICAgICAgICAgIGJ1ZmZlci52b2x1bWUgPSBpZiB2b2x1bWU/IHRoZW4gdm9sdW1lIC8gMTAwIGVsc2UgMS4wXG4gICAgICAgICAgICBidWZmZXIucGxheWJhY2tSYXRlID0gaWYgcmF0ZT8gdGhlbiByYXRlIC8gMTAwIGVsc2UgMS4wXG4gICAgICAgICAgICBidWZmZXIucGxheShmYWRlSW5UaW1lKSBpZiBHYW1lTWFuYWdlci5zZXR0aW5ncy5iZ21FbmFibGVkXG4gICAgICAgIGVsc2VcbiAgICAgICAgICAgYnVmZmVyLm9uRmluaXNoRGVjb2RlID0gKHNvdXJjZSkgPT4gXG4gICAgICAgICAgICAgICBzb3VyY2Uudm9sdW1lID0gaWYgdm9sdW1lPyB0aGVuIHZvbHVtZSAvIDEwMCBlbHNlIDEuMFxuICAgICAgICAgICAgICAgc291cmNlLnBsYXliYWNrUmF0ZSA9IGlmIHJhdGU/IHRoZW4gcmF0ZSAvIDEwMCBlbHNlIDEuMFxuICAgICAgICAgICAgICAgc291cmNlLnBsYXkoZmFkZUluVGltZSkgaWYgR2FtZU1hbmFnZXIuc2V0dGluZ3MuYmdtRW5hYmxlZFxuICAgICAgICAgICBidWZmZXIuZGVjb2RlKClcbiAgICAgICAgICAgXG4gICAgICAgIHJldHVybiBidWZmZXJcbiAgICAgXG4gICAgIyMjKlxuICAgICogU3RvcHMgYWxsIHNvdW5kcy5cbiAgICAqXG4gICAgKiBAbWV0aG9kIHN0b3BBbGxTb3VuZHNcbiAgICAjIyMgICAgXG4gICAgc3RvcEFsbFNvdW5kczogLT5cbiAgICAgICAgZm9yIGsgb2YgQHNvdW5kUmVmZXJlbmNlc1xuICAgICAgICAgICAgZm9yIHJlZmVyZW5jZSBpbiBAc291bmRSZWZlcmVuY2VzW2tdXG4gICAgICAgICAgICAgICAgcmVmZXJlbmNlPy5zdG9wKClcbiAgICBcbiAgICAjIyMqXG4gICAgKiBTdG9wcyBhIHNvdW5kIGFuZCBhbGwgcmVmZXJlbmNlcyBvZiBpdC5cbiAgICAqXG4gICAgKiBAbWV0aG9kIHN0b3BTb3VuZFxuICAgICogQHBhcmFtIHtTdHJpbmd9IG5hbWUgLSBUaGUgbmFtZSBvZiB0aGUgc291bmQgdG8gc3RvcC5cbiAgICAjIyMgICAgICAgICAgICAgXG4gICAgc3RvcFNvdW5kOiAobmFtZSkgLT5cbiAgICAgICAgaWYgQHNvdW5kUmVmZXJlbmNlc1tuYW1lXT9cbiAgICAgICAgICAgIGZvciByZWZlcmVuY2UgaW4gQHNvdW5kUmVmZXJlbmNlc1tuYW1lXVxuICAgICAgICAgICAgICAgIHJlZmVyZW5jZS5zdG9wKClcbiAgICBcbiAgICBcbiAgICAjIyMqXG4gICAgKiBTdG9wcyBhIHZvaWNlLlxuICAgICpcbiAgICAqIEBtZXRob2Qgc3RvcFZvaWNlXG4gICAgKiBAcGFyYW0ge1N0cmluZ30gbmFtZSAtIFRoZSBuYW1lIG9mIHRoZSB2b2ljZSB0byBzdG9wLlxuICAgICMjIyAgICAgICAgICAgICBcbiAgICBzdG9wVm9pY2U6IChuYW1lKSAtPlxuICAgICAgICBAc3RvcFNvdW5kKG5hbWUpXG4gICAgXG4gICAgIyMjKlxuICAgICogU3RvcHMgYWxsIHZvaWNlcy5cbiAgICAqXG4gICAgKiBAbWV0aG9kIHN0b3BBbGxWb2ljZXNcbiAgICAjIyMgICAgIFxuICAgIHN0b3BBbGxWb2ljZXM6IC0+XG4gICAgICAgIGZvciBrIG9mIEBzb3VuZFJlZmVyZW5jZXNcbiAgICAgICAgICAgIGZvciByZWZlcmVuY2UgaW4gQHNvdW5kUmVmZXJlbmNlc1trXVxuICAgICAgICAgICAgICAgIHJlZmVyZW5jZS5zdG9wKCkgaWYgcmVmZXJlbmNlLnZvaWNlXG4gICAgXG4gICAgIyMjKlxuICAgICogUGxheXMgYSB2b2ljZS5cbiAgICAqXG4gICAgKiBAbWV0aG9kIHBsYXlWb2ljZVxuICAgICogQHBhcmFtIHtTdHJpbmd9IG5hbWUgLSBUaGUgbmFtZSBvZiB0aGUgdm9pY2UgdG8gcGxheS5cbiAgICAqIEBwYXJhbSB7bnVtYmVyfSB2b2x1bWUgLSBUaGUgdm9pY2Ugdm9sdW1lLlxuICAgICogQHBhcmFtIHtudW1iZXJ9IHJhdGUgLSBUaGUgdm9pY2UgcGxheWJhY2sgcmF0ZS5cbiAgICAjIyMgICAgIFxuICAgIHBsYXlWb2ljZTogKG5hbWUsIHZvbHVtZSwgcmF0ZSkgLT5cbiAgICAgICAgdm9pY2UgPSBudWxsXG4gICAgICAgIGlmIEdhbWVNYW5hZ2VyLnNldHRpbmdzLnZvaWNlRW5hYmxlZCBhbmQgbm90ICRQQVJBTVMucHJldmlldz8uc2V0dGluZ3Mudm9pY2VEaXNhYmxlZFxuICAgICAgICAgICAgdm9pY2UgPSBAcGxheVNvdW5kKG5hbWU/Lm5hbWUsIHZvbHVtZSB8fCBHYW1lTWFuYWdlci5kZWZhdWx0cy5hdWRpby52b2ljZVZvbHVtZSwgcmF0ZSB8fCBHYW1lTWFuYWdlci5kZWZhdWx0cy5hdWRpby52b2ljZVBsYXliYWNrUmF0ZSwgbm8sIHllcylcbiAgICAgICAgXG4gICAgICAgIHJldHVybiB2b2ljZSAgICBcbiAgICBcbiAgICAjIyMqXG4gICAgKiBQbGF5cyBhIHNvdW5kLlxuICAgICpcbiAgICAqIEBtZXRob2QgcGxheVNvdW5kXG4gICAgKiBAcGFyYW0ge1N0cmluZ30gbmFtZSAtIFRoZSBuYW1lIG9mIHRoZSBzb3VuZCB0byBwbGF5LlxuICAgICogQHBhcmFtIHtudW1iZXJ9IHZvbHVtZSAtIFRoZSBzb3VuZCdzIHZvbHVtZS5cbiAgICAqIEBwYXJhbSB7bnVtYmVyfSByYXRlIC0gVGhlIHNvdW5kJ3MgcGxheWJhY2sgcmF0ZS5cbiAgICAqIEBwYXJhbSB7Ym9vbGVhbn0gbXVzaWNFZmZlY3QgLSBJbmRpY2F0ZXMgaWYgdGhlIHNvdW5kIHNob3VsZCBiZSBwbGF5ZWQgYXMgYSBtdXNpYyBlZmZlY3QuIEluIHRoYXQgY2FzZSwgdGhlIGN1cnJlbnQgbXVzaWNcbiAgICAqIGF0IGF1ZGlvLWxheWVyIHdpbGwgYmUgcGF1c2VkIHVudGlsIHRoZSBzb3VuZCBmaW5pc2hlcyBwbGF5aW5nLlxuICAgICogQHBhcmFtIHtib29sZWFufSB2b2ljZSAtIEluZGljYXRlcyBpZiB0aGUgc291bmQgc2hvdWxkIGJlIGhhbmRsZWQgYXMgYSB2b2ljZS5cbiAgICAjIyMgICAgICAgICAgXG4gICAgcGxheVNvdW5kOiAobmFtZSwgdm9sdW1lLCByYXRlLCBtdXNpY0VmZmVjdCwgdm9pY2UsIGxvb3BTb3VuZCkgLT5cbiAgICAgICAgaWYgJFBBUkFNUy5wcmV2aWV3Py5zZXR0aW5ncy5zb3VuZERpc2FibGVkIHRoZW4gcmV0dXJuXG4gICAgICAgIGlmIG5vdCBuYW1lPyBvciAoIXZvaWNlIGFuZCAhR2FtZU1hbmFnZXIuc2V0dGluZ3Muc291bmRFbmFibGVkKSB0aGVuIHJldHVyblxuICAgICAgICBpZiBuYW1lLm5hbWU/XG4gICAgICAgICAgICB2b2x1bWUgPSBuYW1lLnZvbHVtZVxuICAgICAgICAgICAgcmF0ZSA9IG5hbWUucGxheWJhY2tSYXRlXG4gICAgICAgICAgICBuYW1lID0gbmFtZS5uYW1lXG4gICAgICAgICBcbiAgICAgICAgaWYgbmFtZS5sZW5ndGggPT0gMCB0aGVuIHJldHVyblxuICAgICAgICBcbiAgICAgICAgaWYgbXVzaWNFZmZlY3RcbiAgICAgICAgICAgIEBzdG9wTXVzaWMoKVxuICAgICAgICBcbiAgICAgICAgaWYgbm90IEBzb3VuZFJlZmVyZW5jZXNbbmFtZV0/XG4gICAgICAgICAgICBAc291bmRSZWZlcmVuY2VzW25hbWVdID0gW11cbiAgICAgICAgXG4gICAgICAgIHZvbHVtZSA9IHZvbHVtZSA/IDEwMFxuICAgICAgICB2b2x1bWUgKj0gaWYgdm9pY2UgdGhlbiBAZ2VuZXJhbFZvaWNlVm9sdW1lIC8gMTAwIGVsc2UgQGdlbmVyYWxTb3VuZFZvbHVtZSAvIDEwMFxuICAgICAgICBcbiAgICAgICAgcmVmZXJlbmNlID0gbnVsbFxuICAgICAgICBmb3IgciBpbiBAc291bmRSZWZlcmVuY2VzW25hbWVdXG4gICAgICAgICAgICBpZiBub3Qgci5pc1BsYXlpbmdcbiAgICAgICAgICAgICAgICByZWZlcmVuY2UgPSByXG4gICAgICAgICAgICAgICAgaWYgbXVzaWNFZmZlY3QgdGhlbiByZWZlcmVuY2Uub25FbmQgPSA9PiBAcmVzdW1lTXVzaWMoNDApXG4gICAgICAgICAgICAgICAgcmVmZXJlbmNlLnZvaWNlID0gdm9pY2VcbiAgICAgICAgICAgICAgICByZWZlcmVuY2Uudm9sdW1lID0gdm9sdW1lIC8gMTAwXG4gICAgICAgICAgICAgICAgcmVmZXJlbmNlLnBsYXliYWNrUmF0ZSA9IHJhdGUgLyAxMDBcbiAgICAgICAgICAgICAgICByZWZlcmVuY2UubG9vcCA9IGxvb3BTb3VuZFxuICAgICAgICAgICAgICAgIEB2b2ljZSA9IHJlZmVyZW5jZSBpZiB2b2ljZVxuICAgICAgICAgICAgICAgIHJlZmVyZW5jZS5wbGF5KClcbiAgICAgICAgICAgICAgICBicmVha1xuICAgICAgICAgXG4gICAgICAgIGlmIG5vdCByZWZlcmVuY2U/XG4gICAgICAgICAgICBidWZmZXIgPSBSZXNvdXJjZU1hbmFnZXIuZ2V0QXVkaW9CdWZmZXIoXCJBdWRpby9Tb3VuZHMvI3tuYW1lfVwiKVxuICAgICAgICAgICAgaWYgYnVmZmVyIGFuZCBidWZmZXIubG9hZGVkXG4gICAgICAgICAgICAgICAgaWYgYnVmZmVyLmRlY29kZWRcbiAgICAgICAgICAgICAgICAgICAgcmVmZXJlbmNlID0gbmV3IEdTLkF1ZGlvQnVmZmVyUmVmZXJlbmNlKGJ1ZmZlciwgdm9pY2UpXG4gICAgICAgICAgICAgICAgICAgIGlmIG11c2ljRWZmZWN0IHRoZW4gcmVmZXJlbmNlLm9uRW5kID0gPT4gQHJlc3VtZU11c2ljKDQwKVxuICAgICAgICAgICAgICAgICAgICByZWZlcmVuY2Uudm9sdW1lID0gdm9sdW1lIC8gMTAwXG4gICAgICAgICAgICAgICAgICAgIHJlZmVyZW5jZS5wbGF5YmFja1JhdGUgPSByYXRlIC8gMTAwXG4gICAgICAgICAgICAgICAgICAgIHJlZmVyZW5jZS52b2ljZSA9IHZvaWNlXG4gICAgICAgICAgICAgICAgICAgIHJlZmVyZW5jZS5sb29wID0gbG9vcFNvdW5kXG4gICAgICAgICAgICAgICAgICAgIHJlZmVyZW5jZS5wbGF5KClcbiAgICAgICAgICAgICAgICAgICAgQHZvaWNlID0gcmVmZXJlbmNlIGlmIHZvaWNlXG4gICAgICAgICAgICAgICAgICAgIEBzb3VuZFJlZmVyZW5jZXNbbmFtZV0ucHVzaChyZWZlcmVuY2UpXG4gICAgICAgICAgICAgICAgZWxzZVxuICAgICAgICAgICAgICAgICAgICBidWZmZXIubmFtZSA9IG5hbWVcbiAgICAgICAgICAgICAgICAgICAgYnVmZmVyLm9uRGVjb2RlRmluaXNoID0gKHNvdXJjZSkgPT5cbiAgICAgICAgICAgICAgICAgICAgICAgIHJlZmVyZW5jZSA9IG5ldyBHUy5BdWRpb0J1ZmZlclJlZmVyZW5jZShzb3VyY2UsIHZvaWNlKVxuICAgICAgICAgICAgICAgICAgICAgICAgaWYgbXVzaWNFZmZlY3QgdGhlbiByZWZlcmVuY2Uub25FbmQgPSA9PiBAcmVzdW1lTXVzaWMoNDApXG4gICAgICAgICAgICAgICAgICAgICAgICByZWZlcmVuY2Uudm9pY2UgPSB2b2ljZVxuICAgICAgICAgICAgICAgICAgICAgICAgcmVmZXJlbmNlLnZvbHVtZSA9IHZvbHVtZSAvIDEwMFxuICAgICAgICAgICAgICAgICAgICAgICAgcmVmZXJlbmNlLnBsYXliYWNrUmF0ZSA9IHJhdGUgLyAxMDBcbiAgICAgICAgICAgICAgICAgICAgICAgIHJlZmVyZW5jZS5sb29wID0gbG9vcFNvdW5kXG4gICAgICAgICAgICAgICAgICAgICAgICBAdm9pY2UgPSByZWZlcmVuY2UgaWYgdm9pY2VcbiAgICAgICAgICAgICAgICAgICAgICAgIHJlZmVyZW5jZS5wbGF5KClcbiAgICAgICAgICAgICAgICAgICAgICAgIEBzb3VuZFJlZmVyZW5jZXNbc291cmNlLm5hbWVdLnB1c2gocmVmZXJlbmNlKVxuICAgICAgICAgICAgICAgICAgICBidWZmZXIuZGVjb2RlKClcbiAgICAgICAgXG4gICAgICAgIHJldHVybiByZWZlcmVuY2UgICAgICAgICAgICBcbiAgICBcbiAgICAjIyMqXG4gICAgKiBQbGF5cyBhIG11c2ljIGFzIGEgcmFuZG9tIG11c2ljLiBBIHJhbmRvbSBtdXNpYyB3aWxsIGZhZGUtaW4gYW5kIGZhZGUtb3V0XG4gICAgKiBhdCByYW5kb20gdGltZXMuIFRoYXQgY2FuIGJlIGNvbWJpbmVkIHdpdGggb3RoZXIgYXVkaW8tbGF5ZXJzIHRvIGNyZWF0ZSBhXG4gICAgKiBtdWNoIGJldHRlciBsb29waW5nIG9mIGFuIGF1ZGlvIHRyYWNrLlxuICAgICpcbiAgICAqIEBtZXRob2QgcGxheU11c2ljUmFuZG9tXG4gICAgKiBAcGFyYW0ge09iamVjdH0gbXVzaWMgLSBUaGUgbXVzaWMgdG8gcGxheS5cbiAgICAqIEBwYXJhbSB7bnVtYmVyfSBmYWRlVGltZSAtIFRoZSB0aW1lIGZvciBhIHNpbmdsZSBmYWRlLWluL291dCBpbiBmcmFtZXMuXG4gICAgKiBAcGFyYW0ge251bWJlcn0gbGF5ZXIgLSBUaGUgYXVkaW8gbGF5ZXIgdG8gdXNlLlxuICAgICogQHBhcmFtIHtncy5SYW5nZX0gcGxheVRpbWUgLSBQbGF5LVRpbWUgcmFuZ2UgbGlrZSAxMHMgdG8gMzBzLlxuICAgICogQHBhcmFtIHtncy5SYW5nZX0gcGxheVJhbmdlIC0gUGxheS1SYW5nZS5cbiAgICAjIyMgICAgIFxuICAgIHBsYXlNdXNpY1JhbmRvbTogKG11c2ljLCBmYWRlVGltZSwgbGF5ZXIsIHBsYXlUaW1lLCBwbGF5UmFuZ2UpIC0+XG4gICAgICAgIHJldHVybiBpZiAkUEFSQU1TLnByZXZpZXc/LnNldHRpbmdzLm11c2ljRGlzYWJsZWRcbiAgICAgICAgbGF5ZXIgPSBsYXllciA/IDBcblxuICAgICAgICB2b2x1bWUgPSBpZiBtdXNpYy52b2x1bWU/IHRoZW4gbXVzaWMudm9sdW1lIGVsc2UgMTAwXG4gICAgICAgIHZvbHVtZSA9IHZvbHVtZSAqIChAZ2VuZXJhbE11c2ljVm9sdW1lIC8gMTAwKVxuICAgICAgICBAbXVzaWNWb2x1bWUgPSB2b2x1bWVcbiAgICAgICAgQGRpc3Bvc2VNdXNpYyhsYXllcilcbiAgICAgICAgXG4gICAgICAgIGlmIG11c2ljLm5hbWU/IGFuZCBtdXNpYy5uYW1lLmxlbmd0aCA+IDBcbiAgICAgICAgICAgIG11c2ljQnVmZmVyID0gQHBsYXkoXCJBdWRpby9NdXNpYy8je211c2ljLm5hbWV9XCIsIHZvbHVtZSwgbXVzaWMucmF0ZSlcbiAgICAgICAgICAgIG11c2ljQnVmZmVyLmxvb3AgPSB5ZXNcbiAgICAgICAgICAgIG11c2ljQnVmZmVyLnZvbHVtZSA9IDBcbiAgICAgICAgICAgIG11c2ljQnVmZmVyLmR1cmF0aW9uID0gTWF0aC5yb3VuZChtdXNpY0J1ZmZlci5kdXJhdGlvbiAqIDEwMDAgLyAxNi42KVxuICAgICAgICAgICAgbXVzaWNCdWZmZXIuY3VzdG9tRGF0YS5wbGF5VHlwZSA9IDFcbiAgICAgICAgICAgIG11c2ljQnVmZmVyLmN1c3RvbURhdGEucGxheVRpbWUgPSBwbGF5VGltZVxuICAgICAgICAgICAgaWYgcGxheVJhbmdlLmVuZCA9PSAwXG4gICAgICAgICAgICAgICAgbXVzaWNCdWZmZXIuY3VzdG9tRGF0YS5wbGF5UmFuZ2UgPSB7IHN0YXJ0OiBwbGF5UmFuZ2Uuc3RhcnQsIGVuZDogbXVzaWNCdWZmZXIuZHVyYXRpb24gfVxuICAgICAgICAgICAgZWxzZVxuICAgICAgICAgICAgICAgIG11c2ljQnVmZmVyLmN1c3RvbURhdGEucGxheVJhbmdlID0gcGxheVJhbmdlXG4gICAgICAgICAgICBtdXNpY0J1ZmZlci5jdXN0b21EYXRhLmZhZGVUaW1lID0gZmFkZVRpbWVcbiAgICAgICAgICAgIFxuICAgICAgICAgICAgbXVzaWNCdWZmZXIuY3VzdG9tRGF0YS5zdGFydFRpbWVyID0gTWF0aC5yb3VuZChtdXNpY0J1ZmZlci5jdXN0b21EYXRhLnBsYXlSYW5nZS5zdGFydCArIE1hdGgucmFuZG9tKCkgKiAobXVzaWNCdWZmZXIuY3VzdG9tRGF0YS5wbGF5UmFuZ2UuZW5kIC0gbXVzaWNCdWZmZXIuY3VzdG9tRGF0YS5wbGF5UmFuZ2Uuc3RhcnQpKVxuICAgICAgICAgICAgXG4gICAgICAgICAgICBAYXVkaW9CdWZmZXJzLnB1c2gobXVzaWNCdWZmZXIpIGlmIG5vdCBAYXVkaW9CdWZmZXJzLmNvbnRhaW5zKG11c2ljQnVmZmVyKVxuICAgICAgICAgICAgQGF1ZGlvQnVmZmVyc0J5TGF5ZXJbbGF5ZXJdID0gbXVzaWNCdWZmZXJcbiAgICAgICAgICAgIEBhdWRpb0xheWVyc1tsYXllcl0gPSBuYW1lOiBtdXNpYy5uYW1lLCB0aW1lOiBtdXNpYy5jdXJyZW50VGltZSwgdm9sdW1lOiBtdXNpYy52b2x1bWUsIHJhdGU6IG11c2ljLnBsYXliYWNrUmF0ZSwgZmFkZUluVGltZTogZmFkZVRpbWUsIGN1c3RvbURhdGE6IG11c2ljQnVmZmVyLmN1c3RvbURhdGFcbiAgICAgXG4gICAgIyMjKlxuICAgICogUGxheXMgYSBtdXNpYy5cbiAgICAqXG4gICAgKiBAbWV0aG9kIHBsYXlNdXNpY1xuICAgICogQHBhcmFtIHtzdHJpbmd8T2JqZWN0fSBuYW1lIC0gVGhlIG11c2ljIHRvIHBsYXkuIENhbiBiZSBqdXN0IGEgbmFtZSBvciBhIG11c2ljIGRhdGEtb2JqZWN0LlxuICAgICogQHBhcmFtIHtudW1iZXJ9IHZvbHVtZSAtIFRoZSBtdXNpYydzIHZvbHVtZSBpbiBwZXJjZW50LlxuICAgICogQHBhcmFtIHtudW1iZXJ9IHJhdGUgLSBUaGUgbXVzaWMncyBwbGF5YmFjayByYXRlIGluIHBlcmNlbnQuXG4gICAgKiBAcGFyYW0ge251bWJlcn0gZmFkZUluVGltZSAtIFRoZSBmYWRlLWluIHRpbWUuXG4gICAgKiBAcGFyYW0ge251bWJlcn0gbGF5ZXIgLSBUaGUgbGF5ZXIgdG8gcGxheSB0aGUgbXVzaWMgb24uXG4gICAgKiBAcGFyYW0ge2Jvb2xlYW59IGxvb3AgLSBJbmRpY2F0ZXMgaWYgdGhlIG11c2ljIHNob3VsZCBiZSBsb29wZWRcbiAgICAjIyMgICAgICAgICAgXG4gICAgcGxheU11c2ljOiAobmFtZSwgdm9sdW1lLCByYXRlLCBmYWRlSW5UaW1lLCBsYXllciwgbG9vcE11c2ljKSAtPlxuICAgICAgICByZXR1cm4gaWYgJFBBUkFNUy5wcmV2aWV3Py5zZXR0aW5ncy5tdXNpY0Rpc2FibGVkXG4gICAgICAgIGxvb3BNdXNpYyA/PSB5ZXNcbiAgICAgICAgaWYgbmFtZT8gYW5kIG5hbWUubmFtZT9cbiAgICAgICAgICAgIGxheWVyID0gaWYgbGF5ZXI/IHRoZW4gbGF5ZXIgZWxzZSByYXRlIHx8IDBcbiAgICAgICAgICAgIGZhZGVJblRpbWUgPSB2b2x1bWVcbiAgICAgICAgICAgIHZvbHVtZSA9IG5hbWUudm9sdW1lXG4gICAgICAgICAgICByYXRlID0gbmFtZS5wbGF5YmFja1JhdGVcbiAgICAgICAgICAgIG5hbWUgPSBuYW1lLm5hbWVcbiAgICAgICAgZWxzZVxuICAgICAgICAgICAgbGF5ZXIgPSBsYXllciA/IDBcbiAgICAgICAgICAgIFxuICAgICAgICBAZGlzcG9zZU11c2ljKGxheWVyKVxuICAgICAgICBAYXVkaW9MYXllcnNbbGF5ZXJdID0gbmFtZTogbmFtZSwgdm9sdW1lOiB2b2x1bWUsIHJhdGU6IHJhdGUsIGZhZGVJblRpbWU6IGZhZGVJblRpbWUsIHBsYXlpbmc6IHRydWVcbiAgICAgICAgICAgXG4gICAgICAgIHZvbHVtZSA9IGlmIHZvbHVtZT8gdGhlbiB2b2x1bWUgZWxzZSAxMDBcbiAgICAgICAgdm9sdW1lID0gdm9sdW1lICogKEBnZW5lcmFsTXVzaWNWb2x1bWUgLyAxMDApXG4gICAgICAgIEBtdXNpY1ZvbHVtZSA9IHZvbHVtZVxuICAgICAgICBcbiAgICAgICAgXG4gICAgICAgIGlmIG5hbWU/IGFuZCBuYW1lLmxlbmd0aCA+IDBcbiAgICAgICAgICAgIEBtdXNpYyA9IG5hbWU6IG5hbWVcbiAgICAgICAgICAgIG11c2ljQnVmZmVyID0gQHBsYXkoXCJBdWRpby9NdXNpYy8je25hbWV9XCIsIHZvbHVtZSwgcmF0ZSwgZmFkZUluVGltZSlcbiAgICAgICAgICAgIG11c2ljQnVmZmVyLmxvb3AgPSBsb29wTXVzaWNcbiAgICAgICAgICAgIEBhdWRpb0J1ZmZlcnMucHVzaChtdXNpY0J1ZmZlcikgaWYgbm90IEBhdWRpb0J1ZmZlcnMuY29udGFpbnMobXVzaWNCdWZmZXIpXG4gICAgICAgICAgICBAYXVkaW9CdWZmZXJzQnlMYXllcltsYXllcl0gPSBtdXNpY0J1ZmZlclxuICAgICAgICAgICAgXG4gICAgICAgIHJldHVybiBtdXNpY0J1ZmZlclxuICAgICAgICAgICAgXG4gICAgIyMjKlxuICAgICogUmVzdW1lcyBhIHBhdXNlZCBtdXNpYy5cbiAgICAqXG4gICAgKiBAbWV0aG9kIHJlc3VtZU11c2ljXG4gICAgKiBAcGFyYW0ge251bWJlcn0gZmFkZUluVGltZSAtIFRoZSBmYWRlLWluIHRpbWUgaW4gZnJhbWVzLlxuICAgICogQHBhcmFtIHtudW1iZXJ9IGxheWVyIC0gVGhlIGF1ZGlvIGxheWVyIHRvIHJlc3VtZS5cbiAgICAjIyMgICBcbiAgICByZXN1bWVNdXNpYzogKGZhZGVJblRpbWUsIGxheWVyKSAtPlxuICAgICAgICBsYXllciA9IGxheWVyID8gMFxuICAgICAgICBpZiBAYXVkaW9CdWZmZXJzQnlMYXllcltsYXllcl0/IGFuZCBub3QgQGF1ZGlvQnVmZmVyc0J5TGF5ZXJbbGF5ZXJdLmlzUGxheWluZ1xuICAgICAgICAgICAgQGF1ZGlvQnVmZmVyc0J5TGF5ZXJbbGF5ZXJdLnJlc3VtZShmYWRlSW5UaW1lKVxuICAgICAgICAgICAgQGF1ZGlvTGF5ZXJzW2xheWVyXT8ucGxheWluZyA9IHRydWVcbiAgICBcbiAgICAjIyMqXG4gICAgKiBTdG9wcyBhIG11c2ljLlxuICAgICpcbiAgICAqIEBtZXRob2Qgc3RvcE11c2ljXG4gICAgKiBAcGFyYW0ge251bWJlcn0gZmFkZU91dFRpbWUgLSBUaGUgZmFkZS1vdXQgdGltZSBpbiBmcmFtZXMuXG4gICAgKiBAcGFyYW0ge251bWJlcn0gbGF5ZXIgLSBUaGUgYXVkaW8gbGF5ZXIgdG8gc3RvcC5cbiAgICAjIyMgICAgICAgICBcbiAgICBzdG9wTXVzaWM6IChmYWRlT3V0VGltZSwgbGF5ZXIpIC0+IFxuICAgICAgICBsYXllciA9IGxheWVyID8gMFxuICAgICAgICBAYXVkaW9CdWZmZXJzQnlMYXllcltsYXllcl0/LnN0b3AoZmFkZU91dFRpbWUpXG4gICAgICAgIEBhdWRpb0J1ZmZlcnNCeUxheWVyW2xheWVyXT8uY3VzdG9tRGF0YSA9IHt9XG4gICAgICAgIEBhdWRpb0xheWVyc1tsYXllcl0/LnBsYXlpbmcgPSBmYWxzZVxuICAgICAgICBAbXVzaWMgPSBudWxsXG4gICAgICAgIFxuICAgICMjIypcbiAgICAqIFN0b3BzIGFsbCBtdXNpYy9hdWRpbyBsYXllcnMuXG4gICAgKlxuICAgICogQG1ldGhvZCBzdG9wQWxsTXVzaWNcbiAgICAqIEBwYXJhbSB7bnVtYmVyfSBmYWRlT3V0VGltZSAtIFRoZSBmYWRlLW91dCB0aW1lIGluIGZyYW1lcy5cbiAgICAjIyMgICAgICAgICBcbiAgICBzdG9wQWxsTXVzaWM6IChmYWRlT3V0VGltZSkgLT4gXG4gICAgICAgIGZvciBidWZmZXIgaW4gQGF1ZGlvQnVmZmVyc1xuICAgICAgICAgICAgaWYgYnVmZmVyP1xuICAgICAgICAgICAgICAgIGJ1ZmZlci5zdG9wKGZhZGVPdXRUaW1lKVxuICAgICAgICAgICAgICAgIGJ1ZmZlci5jdXN0b21EYXRhID0ge31cbiAgICAgICAgQG11c2ljID0gbnVsbFxuXG5cbiAgICBkaXNwb3NlOiAoY29udGV4dCkgLT5cbiAgICAgICAgZGF0YSA9IGNvbnRleHQucmVzb3VyY2VzLnNlbGVjdCAocikgLT4gci5kYXRhXG4gICAgICAgIGZvciBidWZmZXIsIGxheWVyIGluIEBhdWRpb0J1ZmZlcnNCeUxheWVyXG4gICAgICAgICAgICBpZiBidWZmZXIgYW5kIGRhdGEuaW5kZXhPZihidWZmZXIpICE9IC0xXG4gICAgICAgICAgICAgICAgYnVmZmVyLmRpc3Bvc2UoKVxuICAgICAgICAgICAgICAgIFxuICAgICAgICAgICAgICAgIEBhdWRpb0J1ZmZlcnMucmVtb3ZlKGJ1ZmZlcilcbiAgICAgICAgICAgICAgICBAYXVkaW9CdWZmZXJzQnlMYXllcltsYXllcl0gPSBudWxsXG4gICAgICAgICAgICAgICAgQGF1ZGlvTGF5ZXJzW2xheWVyXSA9IG51bGxcbiAgICAgICAgICAgICAgICBcbiAgICAjIyMqXG4gICAgKiBEaXNwb3NlcyBhIG11c2ljLlxuICAgICpcbiAgICAqIEBtZXRob2QgZGlzcG9zZU11c2ljXG4gICAgKiBAcGFyYW0ge251bWJlcn0gbGF5ZXIgLSBUaGUgYXVkaW8gbGF5ZXIgb2YgdGhlIG11c2ljIHRvIGRpc3Bvc2UuXG4gICAgIyMjIFxuICAgIGRpc3Bvc2VNdXNpYzogKGxheWVyKSAtPlxuICAgICAgICBsYXllciA9IGxheWVyID8gMFxuICAgICAgICBcbiAgICAgICAgQHN0b3BNdXNpYygwLCBsYXllcilcbiAgICAgICAgI0BhdWRpb0J1ZmZlcnNbbGF5ZXJdPy5kaXNwb3NlKClcbiAgICAgICAgQGF1ZGlvQnVmZmVycy5yZW1vdmUoQGF1ZGlvQnVmZmVyc0J5TGF5ZXJbbGF5ZXJdKVxuICAgICAgICBAYXVkaW9CdWZmZXJzQnlMYXllcltsYXllcl0gPSBudWxsXG4gICAgICAgIEBhdWRpb0xheWVyc1tsYXllcl0gPSBudWxsXG4gICAgXG53aW5kb3cuQXVkaW9NYW5hZ2VyID0gbmV3IEF1ZGlvTWFuYWdlcigpXG5ncy5BdWRpb01hbmFnZXIgPSBBdWRpb01hbmFnZXIiXX0=
//# sourceURL=AudioManager_71.js