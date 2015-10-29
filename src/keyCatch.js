(function (global, doc) {

    var targets = [],
        nonPrintable = {
            8: 'backspace',
            9: 'tab',
            13: 'enter',
            16: 'shift',
            17: 'ctrl',
            18: 'alt',
            20: 'capslock',
            27: 'esc',
            32: 'space',
            33: 'pageup',
            34: 'pagedown',
            35: 'end',
            36: 'home',
            37: 'left',
            38: 'up',
            39: 'right',
            40: 'down',
            45: 'ins',
            46: 'del',
            91: 'meta',
            93: 'meta',
            224: 'meta'
        },
        specialCharacters = {
            106: '*',
            107: '+',
            109: '-',
            110: '.',
            111 : '/',
            186: ';',
            187: '=',
            188: ',',
            189: '-',
            190: '.',
            191: '/',
            192: '`',
            219: '[',
            220: '\\',
            221: ']',
            222: '\''
        };

    function addEvent (object, type, callback) {

        if (object.addEventListener) {
            object.addEventListener(type, callback, false);
            return;
        }

        object.attachEvent('on' + type, callback);

    }

    function removeEvent (object, type, callback) {
        if (object.removeEventListener) {
            object.removeEventListener(type, callback, false);
            return;
        }
        object.detachEvent('on' + type, callback);
    }

    function fireCallback (callback, e, key) {

        if (callback(e, key) === false) {
            KeyCatch.preventDefault(e);
            KeyCatch.stopPropagation(e);
        }

    }

    function indexWithinTargets (target) {

        // look for a KeyCatch instance wrapping 'target'
        return targets.findIndex(function (keyCatchInstance) {
            return keyCatchInstance.target === target;
        });

    }

    // Actual Class
    function KeyCatch (target) {

        target = target || doc;

        // look for a KeyCatch instance wrapping 'target'
        var index = indexWithinTargets(target);

        // act as a singleton per target
        // does this target already exist?
        if (index >= 0) {
            return targets[index];
        }

        // support KeyCatch(el) syntax
        if (!(this instanceof KeyCatch)) {
            return new KeyCatch(target);
        }

        // register this within the targets if instantiated with 'new KeyCatch(el)'
        if (index < 0) {
            targets.push(this);
        }
        // targets[target] = this;

        this.target = target;
        this.listening = false;
        this.listeners = {};

        // create a scoped version of KeyCatch.prototype.onKeyboardEvent
        this.scopedResponder = this.onKeyboardEvent.bind(this);

    }

    // static methods

    // prevent the default action for an event
    KeyCatch.preventDefault = function preventDefault (e) {
        if (e.preventDefault) {
            e.preventDefault();
            return;
        }
        e.returnValue = false;
    }

    // stop the propgation of an event
    KeyCatch.stopPropagation = function stopPropagation (e) {
        if (e.stopPropagation) {
            e.stopPropagation();
            return;
        }
        e.cancelBubble = true;
    }

    // from a KeyBoardEvent retrieve an actual character (i.e. *, 9, (, shift, #))
    // https://developer.mozilla.org/en-US/docs/Web/API/KeyboardEvent
    KeyCatch.getCharacter = function getCharacter (e) {

        // normalize character
        if (typeof e.which !== 'number') {
            e.which = e.keyCode;
        }

        // handle keypress events
        if (e.type === 'keypress') {
            var character = String.fromCharCode(e.which);
            if (!e.shiftKey) {
                character = character.toLowerCase();
            }
            return character;
        }

        // handle non printable events
        if (nonPrintable[e.which]) {
            return nonPrintable[e.which];
        }

        // handle special characters
        if (specialCharacters[e.which]) {
            return specialCharacters[e.which];
        }

    }

    // given a key (i.e. *, i, L, 0, shift), choose the best action (i.e. keydown, keypress) to respond to
    KeyCatch.chooseAction = function chooseAction (key, action) {

        if (action) {
            return action;
        }

        // if found
        var found = false;

           // handle non printable
        for (keyCode in nonPrintable) {
            if (nonPrintable[keyCode] === key) {
                found = true;
            }
        }

        // handle special keys
        for (keyCode in specialCharacters) {
            if (specialCharacters[keyCode] === key) {
                found = true;
            }
        }

        return found ? 'keydown' : 'keypress';

    }

    // instance methods

    // Enable or disable a KeyCatch instance's listeners
    KeyCatch.prototype.toggleListeners = function () {

        if (Object.keys(this.listeners).length && !this.listening) {

            addEvent(this.target, 'keypress', this.scopedResponder);
               addEvent(this.target, 'keydown', this.scopedResponder);
            addEvent(this.target, 'keyup', this.scopedResponder);

            this.listening = true;

        } else if (!Object.keys(this.listeners).length && this.listening) {

            removeEvent(this.target, 'keypress', this.scopedResponder);
            removeEvent(this.target, 'keydown', this.scopedResponder);
            removeEvent(this.target, 'keyup', this.scopedResponder);

            this.listening = false;

        }

    };

    // handle any keyboard action
    KeyCatch.prototype.onKeyboardEvent = function (e) {

        var character = KeyCatch.getCharacter(e);

        if (!character) {
            return;
        }

        // do we have any listeners for the key + type combination?
        var type = ((e.type === 'keyup') ? 'keyup' : KeyCatch.chooseAction(character)),
            unique = character + ':' + type,
            wildcard = '?:?';

        if (Object.keys(this.listeners).indexOf(unique) >= 0) {

            this.listeners[unique].filter(function (listener) {
                return listener.combination === unique;
            }).forEach(function (listener) {
                fireCallback(listener.callback, e, character);
            });

        }

        // support wildcards
        if (Object.keys(this.listeners).indexOf(wildcard) >= 0 && (type === 'keydown' || type === 'keypress')) {

            this.listeners[wildcard].filter(function (listener) {
                return listener.combination === wildcard;
            }).forEach(function (listener) {
                fireCallback(listener.callback, e, character);
            });

        }

    };

    // bind this instance of KeyCatch to a key, listener and action
    KeyCatch.prototype.on = function (key, listener, action) {

        var unique = key + ':' + KeyCatch.chooseAction(key, action);

        // store references to the new listener in the listeners object
        if (!this.listeners[unique]) {
            this.listeners[unique] = [];
        }

        // handle use case of listener being a false boolean
        // create a function that will simply stop propagation
        this.listeners[unique].push({
            combination: unique,
            callback: (typeof listener === 'boolean' && listener === false) ? function () { return false; } : listener
        });

        this.toggleListeners();

    };

    KeyCatch.prototype.all = function (listener) {

        var unique = '?:?';

        // store references to the new listener in the listeners object
        if (!this.listeners[unique]) {
            this.listeners[unique] = [];
        }

        // handle use case of listener being a false boolean
        // create a function that will simply stop propagation
        this.listeners[unique].push({
            combination: unique,
            callback: (typeof listener === 'boolean' && listener === false) ? function () { return false; } : listener
        });

        this.toggleListeners();

    };

    // unbind this instance of KeyCatch from a key, listener and action combination
    KeyCatch.prototype.off = function (key, listener, action) {

        var unique = key + ':' + KeyCatch.chooseAction(key, action);

        // do we have any listeners for the key + type combination?
        if (Object.keys(this.listeners).indexOf(unique) >= 0) {

            // remove some elements from the array
            for (var i = 0; i < this.listeners[unique].length; i++) {

                var bRemove = false;

                // if listener is undefined or null, don't try and match the listener
                // just the key itself
                if ((listener == undefined || listener === null) && this.listeners[unique][i].combination === unique) {
                    bRemove = true;
                } else if (this.listeners[unique][i].combination === unique && this.listeners[unique][i].callback === listener) {
                    bRemove = true;
                }

                if (bRemove === true) {
                    this.listeners[unique].splice(i, 1);
                }

            }

            if (!this.listeners[unique].length) {
                delete this.listeners[unique];
            }

        }

        this.toggleListeners();

    }

    // reset this instance of KeyCatch
    KeyCatch.prototype.reset = function () {

        this.listeners = {};
        this.toggleListeners();

    };

    // create a bunch of public static events, that actually return
    // a target wrapped KeyCatch instance
    KeyCatch.static = function () {

        ['on','off','reset','all'].forEach(function (staticFunctionName) {

            KeyCatch[staticFunctionName] = (function () {

                return function () {

                    // look for a KeyCatch instance wrapping 'target'
                    var index = indexWithinTargets(doc);

                    if (index < 0) {
                        var instance = new KeyCatch(doc);
                        index = indexWithinTargets(doc);
                    }

                    return targets[index][staticFunctionName].apply(targets[index], arguments);

                }

            })();

        });

    }

    // setup the public static on the KeyCatch object itself
    KeyCatch.static();

    // Attach the KeyCatch object to our global
    global.KeyCatch = KeyCatch;

    // findIndex polyfill
    if (!Array.prototype.findIndex) {
        Array.prototype.findIndex = function (predicate) {

            if (this === null) {
                throw new TypeError('Array.prototype.findIndex called on null or undefined');
            }

            if (typeof predicate !== 'function') {
                throw new TypeError('predicate must be a function');
            }

            var list = Object(this);
            var length = list.length >>> 0;

            for (var i = 0; i < length; i++) {
                if (predicate.call(arguments[1], list[i], i, list)) {
                    return i;
                }
            }

            return -1;

        };
    }

})(window, document);
