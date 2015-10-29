# KeyCatch

Key strokes in JavaScript made easy :)

This library is at alpha stage. It's used in production at the moment, but still needs more features and a test framework.

## Using KeyCatch

KeyCatch works as a singleton, based on the element in which it is targeting (defaulting to `document`). Some examples follow.

Bind to the _i_ key, on the `document`.

```
KeyCatch.on('i', function (e) {
    doSomething();
});
```

Bind to the _i_ key, on a specific element. You can do this multiple times, and each handler function will be called in order.

```
KeyCatch(el).on('i', function (e) {
    doSomething();
});
```

If you `return false` in your handler function, KeyCatch will automatically prevent the default event action, and stop propagation of the event.

```
KeyCatch.on('i', function (e) {
    doSomething();
    return false;
});
```

## Supported keys

KeyCatch doesn't support modifier key detection at this point, only single keystrokes. KeyCatch works by name, not by any key codes.

Modifier keys such as `ctrl`, `shift`, `alt`.

Other special non-character keys such as `backspace`, `enter`, `up`, `down`, `left`, `right`, etc.

Character-based keys such as `i`, `Q`, `2`, `%`.

## API

KeyCatch provides some static level functions so that you can take advantage of the code, and some instance level methods to control how specific instances of KeyCatch operate.

### Instance-level functions

The API works at both the document level `KeyCatch.on`, or the element level `KeyCatch(el).on`. Using either of these methods create an instance of KeyCatch which is cached in an internal store. When you call the method again with the same element (or without) the instance is retrieved from the internal store and used.

- `KeyCatch.on`
- `KeyCatch.off`
- `KeyCatch.all`
- `KeyCatch.reset`

#### KeyCatch.on

`document` level:

```
KeyCatch.on(key, callback[, type])
KeyCatch.on('i', function () {}, 'keydown')
```

`element` level:

```
KeyCatch(el).on(key, callback[, type])
KeyCatch(el).on('i', function () {}, 'keydown')
```

##### Parameters

**_key_** The key you'd like to listen for as a string, i.e. `'s'`, `'('`.

**_callback_** The function that will be executed, passed the original event.

**_type_** The `KeyBoardEvent.type` that you'd like to listen for. This is optional. If not passed KeyCatch will determine between `keydown` and `keypress` based on the **_key_** parameter.

### Static-level functions

All of the following work from a KeyBoardEvent that gets passed in.

- `KeyCatch.preventDefault`
- `KeyCatch.stopPropagation`
- `KeyCatch.getCharacter`
- `KeyCatch.chooseAction`
