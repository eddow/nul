/*FILE: bin/null.3rd.js*/
/*FILE: 3rd/codemirror/codemirror.js*/
/* CodeMirror main module
 *
 * Implements the CodeMirror constructor and prototype, which take care
 * of initializing the editor frame, and providing the outside interface.
 */

// The CodeMirrorConfig object is used to specify a default
// configuration. If you specify such an object before loading this
// file, the values you put into it will override the defaults given
// below. You can also assign to it after loading.
var CodeMirrorConfig = window.CodeMirrorConfig || {};

var CodeMirror = (function(){
  function setDefaults(object, defaults) {
    for (var option in defaults) {
      if (!object.hasOwnProperty(option))
        object[option] = defaults[option];
    }
  }
  function forEach(array, action) {
    for (var i = 0; i < array.length; i++)
      action(array[i]);
  }

  // These default options can be overridden by passing a set of
  // options to a specific CodeMirror constructor. See manual.html for
  // their meaning.
  setDefaults(CodeMirrorConfig, {
    stylesheet: "",
    path: "",
    parserfile: [],
    basefiles: ["util.js", "stringstream.js", "select.js", "undo.js", "editor.js", "tokenize.js"],
    iframeClass: null,
    passDelay: 200,
    passTime: 50,
    continuousScanning: false,
    saveFunction: null,
    onChange: null,
    undoDepth: 50,
    undoDelay: 800,
    disableSpellcheck: true,
    textWrapping: true,
    readOnly: false,
    width: "100%",
    height: "300px",
    autoMatchParens: false,
    parserConfig: null,
    tabMode: "indent", // or "spaces", "default", "shift"
    reindentOnLoad: false,
    activeTokens: null,
    cursorActivity: null,
    lineNumbers: false,
    indentUnit: 2
  });

  function addLineNumberDiv(container) {
    var nums = document.createElement("DIV"),
        scroller = document.createElement("DIV");
    nums.style.position = "absolute";
    nums.style.height = "100%";
    if (nums.style.setExpression) {
      try {nums.style.setExpression("height", "this.previousSibling.offsetHeight + 'px'");}
      catch(e) {} // Seems to throw 'Not Implemented' on some IE8 versions
    }
    nums.style.top = "0px";
    nums.style.overflow = "hidden";
    container.appendChild(nums);
    scroller.className = "CodeMirror-line-numbers";
    nums.appendChild(scroller);
    return nums;
  }

  function activateLineNumbers(frame, nums) {
    var win = frame.contentWindow, doc = win.document,
        scroller = nums.firstChild;

    var nextNum = 1, barWidth = null;
    function sizeBar() {
      for (var root = frame; root.parentNode; root = root.parentNode);
      if (!nums.parentNode || root != document || !win.Editor) {
        // Clear event handlers (their nodes might already be collected, so try/catch)
        try{onScroll();}catch(e){}
        try{onResize();}catch(e){}
        clearInterval(sizeInterval);
        return;
      }

      if (nums.offsetWidth != barWidth) {
        barWidth = nums.offsetWidth;
        nums.style.left = "-" + (frame.parentNode.style.marginLeft = barWidth + "px");
      }
    }
    function update() {
      var diff = 20 + Math.max(doc.body.offsetHeight, frame.offsetHeight) - scroller.offsetHeight;
      for (var n = Math.ceil(diff / 10); n > 0; n--) {
        var div = document.createElement("DIV");
        div.appendChild(document.createTextNode(nextNum++));
        scroller.appendChild(div);
      }
      nums.scrollTop = doc.body.scrollTop || doc.documentElement.scrollTop || 0;
    }
    var onScroll = win.addEventHandler(win, "scroll", update, true),
        onResize = win.addEventHandler(win, "resize", update, true),
        sizeInterval = setInterval(sizeBar, 500);
    sizeBar();
    update();
  }

  function CodeMirror(place, options) {
    // Backward compatibility for deprecated options.
    if (options.dumbTabs) options.tabMode = "spaces";
    else if (options.normalTab) options.tabMode = "default";

    // Use passed options, if any, to override defaults.
    this.options = options = options || {};
    setDefaults(options, CodeMirrorConfig);

    var frame = this.frame = document.createElement("IFRAME");
    if (options.iframeClass) frame.className = options.iframeClass;
    frame.frameBorder = 0;
    frame.src = "javascript:false;";
    frame.style.border = "0";
    frame.style.width = options.width;
    frame.style.height = options.height;
    // display: block occasionally suppresses some Firefox bugs, so we
    // always add it, redundant as it sounds.
    frame.style.display = "block";

    var div = this.wrapping = document.createElement("DIV");
    div.style.position = "relative";
    div.className = "CodeMirror-wrapping";
    if (place.appendChild) place.appendChild(div);
    else place(div);
    div.appendChild(frame);
    if (options.lineNumbers) this.lineNumbers = addLineNumberDiv(div);

    // Link back to this object, so that the editor can fetch options
    // and add a reference to itself.
    frame.CodeMirror = this;
    this.win = frame.contentWindow;

    if (typeof options.parserfile == "string")
      options.parserfile = [options.parserfile];
    if (typeof options.stylesheet == "string")
      options.stylesheet = [options.stylesheet];

    var html = ["<!DOCTYPE HTML PUBLIC \"-//W3C//DTD HTML 4.0 Transitional//EN\" \"http://www.w3.org/TR/html4/loose.dtd\"><html><head>"];
    // Hack to work around a bunch of IE8-specific problems.
    html.push("<meta http-equiv=\"X-UA-Compatible\" content=\"IE=EmulateIE7\"/>");
    forEach(options.stylesheet, function(file) {
      html.push("<link rel=\"stylesheet\" type=\"text/css\" href=\"" + file + "\"/>");
    });
    forEach(options.basefiles.concat(options.parserfile), function(file) {
      html.push("<script type=\"text/javascript\" src=\"" + options.path + file + "\"><" + "/script>");
    });
    html.push("</head><body style=\"border-width: 0;\" class=\"editbox\" spellcheck=\"" +
              (options.disableSpellcheck ? "false" : "true") + "\"></body></html>");

    var doc = this.win.document;
    doc.open();
    doc.write(html.join(""));
    doc.close();
  }

  CodeMirror.prototype = {
    init: function() {
      if (this.options.initCallback) this.options.initCallback(this);
      if (this.lineNumbers) activateLineNumbers(this.frame, this.lineNumbers);
      if (this.options.reindentOnLoad) this.reindent();
    },

    getCode: function() {return this.editor.getCode();},
    setCode: function(code) {this.editor.importCode(code);},
    selection: function() {this.focusIfIE(); return this.editor.selectedText();},
    reindent: function() {this.editor.reindent();},
    reindentSelection: function() {this.focusIfIE(); this.editor.reindentSelection(null);},

    focusIfIE: function() {
      // in IE, a lot of selection-related functionality only works when the frame is focused
      if (this.win.select.ie_selection) this.focus();
    },
    focus: function() {
      this.win.focus();
      if (this.editor.selectionSnapshot) // IE hack
        this.win.select.setBookmark(this.win.document.body, this.editor.selectionSnapshot);
    },
    replaceSelection: function(text) {
      this.focus();
      this.editor.replaceSelection(text);
      return true;
    },
    replaceChars: function(text, start, end) {
      this.editor.replaceChars(text, start, end);
    },
    getSearchCursor: function(string, fromCursor, caseFold) {
      return this.editor.getSearchCursor(string, fromCursor, caseFold);
    },

    undo: function() {this.editor.history.undo();},
    redo: function() {this.editor.history.redo();},
    historySize: function() {return this.editor.history.historySize();},
    clearHistory: function() {this.editor.history.clear();},

    grabKeys: function(callback, filter) {this.editor.grabKeys(callback, filter);},
    ungrabKeys: function() {this.editor.ungrabKeys();},

    setParser: function(name) {this.editor.setParser(name);},
    setSpellcheck: function(on) {this.win.document.body.spellcheck = on;},
    setTextWrapping: function(on) {this.win.document.body.style.whiteSpace = on ? "" : "nowrap";},
    setIndentUnit: function(unit) {this.win.indentUnit = unit;},
    setUndoDepth: function(depth) {this.editor.history.maxDepth = depth;},
    setTabMode: function(mode) {this.options.tabMode = mode;},
    setLineNumbers: function(on) {
      if (on && !this.lineNumbers) {
        this.lineNumbers = addLineNumberDiv(this.wrapping);
        activateLineNumbers(this.frame, this.lineNumbers);
      }
      else if (!on && this.lineNumbers) {
        this.wrapping.removeChild(this.lineNumbers);
        this.wrapping.style.marginLeft = "";
        this.lineNumbers = null;
      }
    },

    cursorPosition: function(start) {this.focusIfIE(); return this.editor.cursorPosition(start);},
    firstLine: function() {return this.editor.firstLine();},
    lastLine: function() {return this.editor.lastLine();},
    nextLine: function(line) {return this.editor.nextLine(line);},
    prevLine: function(line) {return this.editor.prevLine(line);},
    lineContent: function(line) {return this.editor.lineContent(line);},
    setLineContent: function(line, content) {this.editor.setLineContent(line, content);},
    insertIntoLine: function(line, position, content) {this.editor.insertIntoLine(line, position, content);},
    selectLines: function(startLine, startOffset, endLine, endOffset) {
      this.win.focus();
      this.editor.selectLines(startLine, startOffset, endLine, endOffset);
    },
    nthLine: function(n) {
      var line = this.firstLine();
      for (; n > 1 && line !== false; n--)
        line = this.nextLine(line);
      return line;
    },
    lineNumber: function(line) {
      var num = 0;
      while (line !== false) {
        num++;
        line = this.prevLine(line);
      }
      return num;
    },

    // Old number-based line interface
    jumpToLine: function(n) {
      this.selectLines(this.nthLine(n), 0);
      this.win.focus();
    },
    currentLine: function() {
      return this.lineNumber(this.cursorPosition().line);
    }
  };

  CodeMirror.InvalidLineHandle = {toString: function(){return "CodeMirror.InvalidLineHandle";}};

  CodeMirror.replace = function(element) {
    if (typeof element == "string")
      element = document.getElementById(element);
    return function(newElement) {
      element.parentNode.replaceChild(newElement, element);
    };
  };

  CodeMirror.fromTextArea = function(area, options) {
    if (typeof area == "string")
      area = document.getElementById(area);

    options = options || {};
    if (area.style.width && options.width == null)
      options.width = area.style.width;
    if (area.style.height && options.height == null)
      options.height = area.style.height;
    if (options.content == null) options.content = area.value;

    if (area.form) {
      function updateField() {
        area.value = mirror.getCode();
      }
      if (typeof area.form.addEventListener == "function")
        area.form.addEventListener("submit", updateField, false);
      else
        area.form.attachEvent("onsubmit", updateField);
    }

    function insert(frame) {
      if (area.nextSibling)
        area.parentNode.insertBefore(frame, area.nextSibling);
      else
        area.parentNode.appendChild(frame);
    }

    area.style.display = "none";
    var mirror = new CodeMirror(insert, options);
    return mirror;
  };

  CodeMirror.isProbablySupported = function() {
    // This is rather awful, but can be useful.
    var match;
    if (window.opera)
      return Number(window.opera.version()) >= 9.52;
    else if (/Apple Computers, Inc/.test(navigator.vendor) && (match = navigator.userAgent.match(/Version\/(\d+(?:\.\d+)?)\./)))
      return Number(match[1]) >= 3;
    else if (document.selection && window.ActiveXObject && (match = navigator.userAgent.match(/MSIE (\d+(?:\.\d*)?)\b/)))
      return Number(match[1]) >= 6;
    else if (match = navigator.userAgent.match(/gecko\/(\d{8})/i))
      return Number(match[1]) >= 20050901;
    else if (match = navigator.userAgent.match(/AppleWebKit\/(\d+)/))
      return Number(match[1]) >= 525;
    else
      return null;
  };

  return CodeMirror;
})();
/*FILE: 3rd/jsclass/core.js*/
/*!
 * JS.Class: Ruby-style JavaScript
 * Copyright (c) 2007-2009 James Coglan
 * 
 * http://jsclass.jcoglan.com
 * http://github.com/jcoglan/js.class
 * 
 * Permission is hereby granted, free of charge, to any person obtaining a copy
 * of this software and associated documentation files (the "Software"), to deal
 * in the Software without restriction, including without limitation the rights
 * to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
 * copies of the Software, and to permit persons to whom the Software is
 * furnished to do so, subject to the following conditions:
 * 
 * The above copyright notice and this permission notice shall be included in
 * all copies or substantial portions of the Software.
 * 
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
 * IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
 * FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
 * AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
 * LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
 * OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN
 * THE SOFTWARE.
 * 
 * Parts of this software are derived from the following open-source projects:
 * 
 *     - The Prototype framework, (c) 2005-2009 Sam Stephenson
 *     - Alex Arnell's Inheritance library, (c) 2006, Alex Arnell
 *     - Base, (c) 2006-9, Dean Edwards
 */

/**
 * == core ==
 **/

/** section: core
 * JS
 * 
 * The `JS` object is used as a namespace by the rest of the JS.Class framework, and hosts
 * various utility methods used throughout. None of these methods should be taken as being
 * public API, they are all 'plumbing' and may be removed or changed at any time.
 **/
JS = {
  /**
   * JS.extend(target, extensions) -> Object
   * - target (Object): object to be extended
   * - extensions (Object): object containing key/value pairs to add to target
   *
   * Adds the properties of the second argument to the first, and returns the first. Will not
   * needlessly overwrite fields with identical values; if an object has inherited a property
   * we should not add the property to the object itself.
   **/
  extend: function(target, extensions) {
    extensions = extensions || {};
    for (var prop in extensions) {
      if (target[prop] === extensions[prop]) continue;
      target[prop] = extensions[prop];
    }
    return target;
  },
  
  /**
   * JS.makeFunction() -> Function
   *
   * Returns a function for use as a constructor. These functions are used as the basis for
   * classes. The constructor calls the object's `initialize()` method if it exists.
   **/
  makeFunction: function() {
    return function() {
      return this.initialize
          ? (this.initialize.apply(this, arguments) || this)
          : this;
    };
  },
  
  /**
   * JS.makeBridge(klass) -> Object
   * - klass (JS.Class): class from which you want to inherit
   *
   * Takes a class and returns an instance of it, without calling the class's constructor.
   * Used for forging prototype links between objects using JavaScript's inheritance model.
   **/
  makeBridge: function(klass) {
    var bridge = function() {};
    bridge.prototype = klass.prototype;
    return new bridge;
  },
  
  /**
   * JS.bind(object, func) -> Function
   * - object (Object): object to bind the function to
   * - func (Function): function that the bound function should call
   *
   * Takes a function and an object, and returns a new function that calls the original
   * function with `this` set to refer to the `object`. Used to implement `JS.Kernel#method`,
   * amongst other things.
   **/
  bind: function() {
    var args   = JS.array(arguments),
        method = args.shift(),
        object = args.shift() || null;
    
    return function() {
      return method.apply(object, args.concat(JS.array(arguments)));
    };
  },
  
  /**
   * JS.callsSuper(func) -> Boolean
   * - func (Function): function to test for super() calls
   *
   * Takes a function and returns `true` iff the function makes a call to `callSuper()`.
   * Result is cached on the function itself since functions are immutable and decompiling
   * them is expensive. We use this to determine whether to wrap the function when it's
   * added to a class; wrapping impedes performance and should be avoided where possible.
   **/
  callsSuper: function(func) {
    return func.SUPER === undefined
        ? func.SUPER = /\bcallSuper\b/.test(func.toString())
        : func.SUPER;
  },
  
  /**
   * JS.mask(func) -> Function
   * - func (Function): function to obfuscate
   *
   * Disguises a function so that we cannot tell if it uses `callSuper()`. Sometimes we don't
   * want such functions to be wrapped by the inheritance system. Modifies the function's
   * `toString()` method and returns the function.
   **/
  mask: function(func) {
    var string = func.toString().replace(/callSuper/g, 'super');
    func.toString = function() { return string; };
    return func;
  },
  
  /**
   * JS.array(iterable) -> Array
   * - iterable (Object): object you want to cast to an array
   *
   * Takes any iterable object (something with a `length` property) and returns a native
   * JavaScript `Array` containing the same elements.
   **/
  array: function(iterable) {
    if (!iterable) return [];
    if (iterable.toArray) return iterable.toArray();
    
    var length  = iterable.length,
        results = [];
    
    while (length--) results[length] = iterable[length];
    return results;
  },
  
  /**
   * JS.indexOf(haystack, needle) -> Number
   * - haystack (Array): array to search
   * - needle (Object): object to search for
   *
   * Returns the index of the `needle` in the `haystack`, which is typically an `Array` or an
   * array-like object. Returns -1 if no matching element is found. We need this as older
   * IE versions don't implement `Array#indexOf`.
   **/
  indexOf: function(haystack, needle) {
    for (var i = 0, n = haystack.length; i < n; i++) {
      if (haystack[i] === needle) return i;
    }
    return -1;
  },
  
  /**
   * JS.isFn(object) -> Boolean
   * - object (Object): object to test
   *
   * Returns `true` iff the argument is a `Function`.
   **/
  isFn: function(object) {
    return object instanceof Function;
  },
  
  /**
   * JS.isType(object, type) -> Boolean
   * - object (Object): object whose type we wish to check
   * - type (JS.Module): type to match against
   * 
   * Returns `true` iff `object` is of the given `type`.
   **/
  isType: function(object, type) {
    if (!object || !type) return false;
    return (type instanceof Function && object instanceof type) ||
           (typeof type === 'string' && typeof object === type) ||
           (object.isA && object.isA(type));
  },
  
  /**
   * JS.ignore(key, object) -> Boolean
   * - key (String): name of field being added to an object
   * - object (Object): value of the given field
   *
   * Used to determine whether a key-value pair should be added to a class or module. Pairs
   * may be ignored if they have some special function, like `include` or `extend`.
   **/
  ignore: function(key, object) {
    return /^(include|extend)$/.test(key) && typeof object === 'object';
  }
};


/** section: core
 * class JS.Module
 * includes JS.Kernel
 * 
 * `Module` is the core class in JS.Class. A module is simply an object that stores methods,
 * and is responsible for handling method lookups, inheritance relationships and the like.
 * All of Ruby's inheritance semantics are handled using modules in JS.Class.
 * 
 * The basic object/module/class model in Ruby is expressed in the diagram at
 * http://ruby-doc.org/core/classes/Class.html -- `Class` inherits from `Module`, which
 * inherits from `Object` (as do all custom classes). `Kernel` is a `Module` which is mixed
 * into `Object` to provide methods common to all objects.
 * 
 * In JS.Class, there is no `Object` class, but we do have `Module`, `Class` and `Kernel`.
 * All top-level (parentless) classes include the `JS.Kernel` module, so all classes in effect
 * inherit from `Kernel`. All classes are instances of `JS.Class`, and all modules instances
 * of `JS.Module`. `Module` is a top-level class, from which `Class` inherits.
 * 
 * The following diagram shows this relationship; vertical lines indicate parent/child
 * class relationships, horizontal lines indicate module inclusions. (`C`) means a class,
 * (`M`) a module.
 * 
 * 
 *      ==============      ==============      ===================      ==============
 *      | M | Kernel |----->| C | Module |      | C | ParentClass |<-----| M | Kernel |
 *      ==============      ==============      ===================      ==============
 *                                ^                     ^
 *                                |                     |
 *                                |                     |
 *                          =============       ==================
 *                          | C | Class |       | C | ChildClass |
 *                          =============       ==================
 * 
 * 
 * All objects have a metamodule attached to them; this handles storage of singleton
 * methods as metaclasses do in Ruby. This is handled by mixing the object's class into
 * the object's metamodule.
 * 
 * 
 *                class
 *          =================
 *          | C | SomeClass |------------------------------------------------
 *          =================                                               |
 *                  |                                                       |
 *                  V                                                       |
 *          ====================      =================================     |
 *          | <SomeClass:0xb7> |<>----| M | <Module:<SomeClass:0xb7>> |<-----
 *          ====================      =================================
 *                instance                       metamodule
 * 
 * 
 * Similarly, inheritance of class methods is handled by mixing the parent class's
 * metamodule into the child class's metamodule, like so:
 * 
 * 
 *            ===================      ============================
 *            | C | ParentClass |<>----| M | <Module:ParentClass> |------
 *            ===================      ============================     |
 *                    ^                                                 |
 *                    |                                                 |
 *                    |                                                 |
 *            ===================      ===========================      |
 *            | C | ChildClass  |<>----| M | <Module:ChildClass> |<------
 *            ===================      ===========================
 * 
 * 
 * The parent-child relationships are also implemented using module inclusion, with some
 * extra checks and optimisations. Also, bear in mind that although `Class` appears to be a
 * subclass of `Module`, this particular parent-child relationship is faked using manual
 * delegation; every class has a hidden module attached to it that handles all the method
 * storage and lookup responsibilities.
 **/
JS.Module = JS.makeFunction();
JS.extend(JS.Module.prototype, {
  END_WITHOUT_DOT: /([^\.])$/,
  
  /**
   * new JS.Module(name, methods, options)
   * - name (String): the name of the module, used for debugging
   * - methods (Object): list of methods for the class
   * - options (Object): configuration options
   * 
   * The `name` argument is optional and may be omitted; `name` is not used to assign
   * the class to a variable, it is only uses as metadata. The `options` object is used
   * to specify the target object that the module is storing methods for.
   * 
   *     var Runnable = new JS.Module('Runnable', {
   *         run: function(args) {
   *             // ...
   *         }
   *     });
   **/
  initialize: function(name, methods, options) {
    this.__mod__ = this;      // Mirror property found in Class. Think of this as toModule()
    this.__inc__ = [];        // List of modules included in this module
    this.__fns__ = {};        // Object storing methods belonging to this module
    this.__dep__ = [];        // List modules and classes that depend on this module
    this.__mct__ = {};        // Cache table for method call lookups
    
    if (typeof name === 'string') {
      this.__nom__ = this.displayName = name;
    } else {
      this.__nom__ = this.displayName = '';
      options = methods;
      methods = name;
    }
    
    options = options || {};
    
    // Object to resolve methods onto
    this.__res__ = options._resolve || null;
    
    if (methods) this.include(methods, false);
    
    if (JS.Module.__chainq__) JS.Module.__chainq__.push(this);
  },

  def: function(obj) {
	  return obj && obj.isA && obj.isA(this);
  },
  
  /**
   * JS.Module#setName(name) -> undefined
   * - name (String): the name for the module
   * 
   * Sets the `displayName` of the module to the given value. Should be the fully-qualified
   * name, including names of the containing modules.
   **/
  setName: function(name) {
    this.__nom__ = this.displayName = name || '';
    for (var key in this.__mod__.__fns__)
      this.__name__(key);
    if (name && this.__meta__) this.__meta__.setName(name + '.');
  },
  
  /**
   * JS.Module#__name__(name) -> undefined
   * - name (String): the name of the method to assign a `displayName` to
   * 
   * Assigns the `displayName` property to the named method using Ruby conventions for naming
   * instance and singleton methods. If the named field points to another `Module`, the name
   * change is applied recursively.
   **/
  __name__: function(name) {
    if (!this.__nom__) return;
    var object = this.__mod__.__fns__[name] || {};
    name = this.__nom__.replace(this.END_WITHOUT_DOT, '$1#') + name;
    if (JS.isFn(object.setName)) return object.setName(name);
    if (JS.isFn(object)) object.displayName = name;
  },
  
  /**
   * JS.Module#define(name, func[, resolve = true[, options = {}]]) -> undefined
   * - name (String): the name of the method
   * - func (Function): a function implementing the method
   * - resolve (Boolean): sets whether to refresh method tables afterward
   * - options (Object): execution options
   * 
   * Adds an instance method to the module with the given `name`. The `options` parameter is
   * for internal use to make sure callbacks fire on the correct objects, e.g. a class
   * uses a hidden module to store its methods, but callbacks should fire on the class,
   * not the module.
   **/
  define: function(name, func, resolve, options) {
    var notify = (options || {})._notify || this;
    this.__fns__[name] = func;
    this.__name__(name);
    if (JS.Module._notify && notify && JS.isFn(func))
        JS.Module._notify(name, notify);
    if (resolve !== false) this.resolve();
  },
  
  /**
   * JS.Module#instanceMethod(name) -> Function
   * - name (String): the name of the method
   * 
   * Returns the named instance method from the module as an unbound function.
   **/
  instanceMethod: function(name) {
    var method = this.lookup(name).pop();
    return JS.isFn(method) ? method : null;
  },
  
  /**
   * JS.Module#instanceMethods([includeSuper = true[, results]]) -> Array
   * - includeSuper (Boolean): whether to include ancestor methods
   * - results (Array): list of found method names (internal use)
   * 
   * Returns an array of all the method names from the module. Pass `false` to ignore methods
   * inherited from ancestors.
   **/
  instanceMethods: function(includeSuper, results) {
    var self      = this.__mod__,
        results   = results || [],
        ancestors = self.ancestors(),
        n         = ancestors.length,
        name;
    
    for (name in self.__fns__) {
      if (self.__fns__.hasOwnProperty(name) &&
          JS.isFn(self.__fns__[name]) &&
          JS.indexOf(results, name) === -1)
        results.push(name);
    }
    if (includeSuper === false) return results;
    
    while (n--) ancestors[n].instanceMethods(false, results);
    return results;
  },
  
  /**
   * JS.Module#include(module[, resolve = true[, options = {}]]) -> undefined
   * - module (JS.Module): the module to mix in
   * - resolve (Boolean): sets whether to refresh method tables afterward
   * - options (Object): flags to control execution
   * 
   * Mixes `module` into the receiver or, if `module` is plain old object (rather than a
   * `JS.Module`) adds methods directly into the receiver. The `options` and `resolve` arguments
   * are mostly for internal use; `options` specifies objects that callbacks should fire on,
   * and `resolve` tells the module whether to resolve methods onto its target after adding
   * the methods.
   **/
  include: function(module, resolve, options) {
    resolve = (resolve !== false);
    if (!module) return resolve ? this.resolve() : this.uncache();
    options = options || {};
    
    if (module.__mod__) module = module.__mod__;
    
    var inc      = module.include,
        ext      = module.extend,
        includer = options._included || this,
        modules, method, i, n;
    
    if (module.__inc__ && module.__fns__) {
      // module is a Module instance: make links and fire callbacks
      
      this.__inc__.push(module);
      module.__dep__.push(this);
      if (options._extended) module.extended && module.extended(options._extended);
      else module.included && module.included(includer);
      
    } else {
      // module is a normal object: add methods directly to this module
      
      if (options._recall) {
        // Second call: add all the methods
        for (method in module) {
          if (JS.ignore(method, module[method])) continue;
          this.define(method, module[method], false, {_notify: includer || options._extended || this});
        }
      } else {
        // First call: handle include and extend blocks
        
        // Handle inclusions
        if (typeof inc === 'object' || JS.isType(inc, JS.Module)) {
          modules = [].concat(inc);
          for (i = 0, n = modules.length; i < n; i++)
            includer.include(modules[i], resolve, options);
        }
        
        // Handle extensions
        if (typeof ext === 'object' || JS.isType(ext, JS.Module)) {
          modules = [].concat(ext);
          for (i = 0, n = modules.length; i < n; i++)
            includer.extend(modules[i], false);
          includer.extend();
        }
        
        // Make a second call to include(). This allows mixins to modify the
        // include() method and affect the addition of methods to this module
        options._recall = true;
        return includer.include(module, resolve, options);
      }
    }
    resolve ? this.resolve() : this.uncache();
  },
  
  /**
   * JS.Module#includes(module) -> Boolean
   * - module (JS.Module): a module to check for inclusion
   * 
   * Returns `true` iff the receiver includes (i.e. inherits from) the given `module`, or
   * if the receiver and given `module` are the same object. Recurses over the receiver's
   * inheritance tree, could get expensive.
   **/
  includes: function(module) {
    var self = this.__mod__,
        i    = self.__inc__.length;
    
    if (Object === module || self === module || self.__res__ === module.prototype)
      return true;
    
    while (i--) {
      if (self.__inc__[i].includes(module))
        return true;
    }
    return false;
  },
  
  /**
   * JS.Module#match(object) -> Boolean
   * - object (Object): object to type-check
   * 
   * Returns `true` if the receiver is in the inheritance chain of `object`.
   **/
  match: function(object) {
    return object.isA && object.isA(this);
  },
  
  /**
   * JS.Module#ancestors([results]) -> Array
   * - results (Array): list of found ancestors (internal use)
   * 
   * Returns an array of the module's ancestor modules/classes, with the most distant
   * first and the receiver last. This is the opposite order to that given by Ruby, but
   * this order makes it easier to eliminate duplicates and preserve Ruby's inheritance
   * semantics with respect to the diamond problem. The `results` parameter is for internal
   * use; we recurse over the tree passing the same array around rather than generating
   * lots of arrays and concatenating.
   **/
  ancestors: function(results) {
    var self     = this.__mod__,
        cachable = (results === undefined),
        klass    = (self.__res__||{}).klass,
        result   = (klass && self.__res__ === klass.prototype) ? klass : self,
        i, n;
    
    if (cachable && self.__anc__) return self.__anc__.slice();
    results = results || [];
    
    // Recurse over inclusions first
    for (i = 0, n = self.__inc__.length; i < n; i++)
      self.__inc__[i].ancestors(results);
    
    // If this module is not already in the list, add it
    if (JS.indexOf(results, result) === -1) results.push(result);
    
    if (cachable) self.__anc__ = results.slice();
    return results;
  },
  
  /**
   * JS.Module#lookup(name) -> Array
   * - name (String): the name of the method to search for
   * 
   * Returns an array of all the methods in the module's inheritance tree with the given
   * `name`. Methods are returned in the same order as the modules in `JS.Module#ancestors`,
   * so the last method in the list will be called first, the penultimate on the first
   * `callSuper()`, and so on back through the list.
   **/
  lookup: function(name) {
    var self  = this.__mod__,
        cache = self.__mct__;
    
    if (cache[name]) return cache[name].slice();
    
    var ancestors = self.ancestors(),
        results   = [],
        i, n, method;
    
    for (i = 0, n = ancestors.length; i < n; i++) {
      method = ancestors[i].__mod__.__fns__[name];
      if (method) results.push(method);
    }
    cache[name] = results.slice();
    return results;
  },
  
  /**
   * JS.Module#make(name, func) -> Function
   * - name (String): the name of the method being produced
   * - func (Function): a function implementing the method
   * 
   * Returns a version of the function ready to be added to a prototype object. Functions
   * that use `callSuper()` must be wrapped to support that behaviour, other functions can
   * be used raw.
   **/
  make: function(name, func) {
    if (!JS.isFn(func) || !JS.callsSuper(func)) return func;
    var module = this;
    return function() {
      return module.chain(this, name, arguments);
    };
  },
  
  /**
   * JS.Module#chain(self, name, args) -> Object
   * - self (Object): the receiver of the call
   * - name (String): the name of the method being called
   * - args (Array): list of arguments to begin the call
   * 
   * Performs calls to functions that use `callSuper()`. Ancestor methods are looked up
   * dynamically at call-time; this allows `callSuper()` to be late-bound as in Ruby at the
   * cost of a little performance. Arguments to the call are stored so they can be passed
   * up the call stack automatically without the developer needing to pass them by hand.
   **/
  chain: JS.mask( function(self, name, args) {
    var callees      = this.lookup(name),     // List of method implementations
        stackIndex   = callees.length - 1,    // Current position in the call stack
        currentSuper = self.callSuper,        // Current super method attached to the receiver
        params       = JS.array(args),        // Copy of argument list
        result;
    
    // Set up the callSuper() method
    self.callSuper = function() {
    
      // Overwrite arguments specified explicitly
      var i = arguments.length;
      while (i--) params[i] = arguments[i];
      
      // Step up the stack, call and step back down
      stackIndex -= 1;
      var returnValue = callees[stackIndex].apply(self, params);
      stackIndex += 1;
      
      return returnValue;
    };
    
    // Call the last method in the stack
    result = callees.pop().apply(self, params);
    
    // Remove or reassign callSuper() method
    currentSuper ? self.callSuper = currentSuper : delete self.callSuper;
    
    return result;
  } ),
  
  /**
   * JS.Module#resolve([target = this]) -> undefined
   * - target (Object): the object to reflect methods onto
   * 
   * Copies methods from the module onto the `target` object, wrapping methods where
   * necessary. The target will typically be a native JavaScript prototype object used
   * to represent a class. Recurses over this module's ancestors to make sure all applicable
   * methods exist.
   **/
  resolve: function(target) {
    var self     = this.__mod__,
        target   = target || self,
        resolved = target.__res__, i, n, key, made;
    
    // Resolve all dependent modules if the target is this module
    if (target === self) {
      self.uncache(false);
      i = self.__dep__.length;
      while (i--) self.__dep__[i].resolve();
    }
    
    if (!resolved) return;
    
    // Recurse over this module's ancestors
    for (i = 0, n = self.__inc__.length; i < n; i++)
      self.__inc__[i].resolve(target);
    
    // Wrap and copy methods to the target
    for (key in self.__fns__) {
      made = target.make(key, self.__fns__[key]);
      if (resolved[key] !== made) resolved[key] = made;
    }
  },
  
  /**
   * JS.Module#uncache([recursive = true]) -> undefined
   * - recursive (Boolean): whether to clear the cache of all dependent modules
   * 
   * Clears the ancestor and method table cahces for the module. This is used to invalidate
   * caches when modules are modified, to avoid some of the bugs that exist in Ruby.
   **/
  uncache: function(recursive) {
    var self = this.__mod__,
        i    = self.__dep__.length;
    
    self.__anc__ = null;
    self.__mct__ = {};
    if (recursive === false) return;
    while (i--) self.__dep__[i].uncache();
  }
});


/** section: core
 * class JS.Class < JS.Module
 * 
 * `Class` is a subclass of `JS.Module`; classes not only store methods but also spawn
 * new objects. In addition, classes have an extra type of inheritance on top of mixins,
 * in that each class can have a single parent class from which it will inherit both
 * instance and singleton methods.
 * 
 * Refer to `JS.Module` for details of how inheritance is implemented in JS.Class. Though
 * `Class` is supposed to appear to be a subclass of `Module`, this relationship is
 * implemented by letting each `Class` hold a reference to an anonymous `Module` and
 * using manual delegation where necessary.
 **/
JS.Class = JS.makeFunction();
JS.extend(JS.Class.prototype = JS.makeBridge(JS.Module), {
  
  /**
   * new JS.Class(name, parent, methods)
   * - name (String): the name of the class, used for debugging
   * - parent (JS.Class): the parent class to inherit from
   * - methods (Object): list of methods for the class
   * 
   * The `name` and `parent` arguments are both optional and may be omitted. `name`
   * is not used to assign the class to a variable, it is only uses as metadata.
   * The default parent class is `Object`, and all classes include the JS.Kernel
   * module.
   **/
  initialize: function(name, parent, methods) {
    if (typeof name === 'string') {
      this.__nom__ = this.displayName = name;
    } else {
      this.__nom__ = this.displayName = '';
      methods = parent;
      parent = name;
    }
    var klass = JS.extend(JS.makeFunction(), this);
    klass.klass = klass.constructor = this.klass;
    
    if (!JS.isFn(parent)) {
      methods = parent;
      parent = Object;
    }
    
    // Set up parent-child relationship, then add methods. Setting up a parent
    // class in JavaScript wipes the existing prototype object.
    klass.inherit(parent);
    klass.include(methods, false);
    klass.resolve();
    
    // Fire inherited() callback on ancestors
    do {
      parent.inherited && parent.inherited(klass);
    } while (parent = parent.superclass);
    
    return klass;
  },
  
  /**
   * JS.Class#inherit(klass) -> undefined
   * - klass (JS.Class): the class to inherit from
   * 
   * Sets up the parent-child relationship to the parent class. This is a destructive action
   * in that the existing prototype will be discarded; always call this before adding any
   * methods to the class.
   **/
  inherit: function(klass) {
    this.superclass = klass;
    
    // Mix the parent's metamodule into this class's metamodule
    if (this.__eigen__ && klass.__eigen__) this.extend(klass.__eigen__(), true);
    
    this.subclasses = [];
    (klass.subclasses || []).push(this);
    
    // Bootstrap JavaScript's prototypal inheritance model
    var p = this.prototype = JS.makeBridge(klass);
    p.klass = p.constructor = this;
    
    // Set up a module to store methods and delegate calls to
    // -- Class does not really subclass Module, instead each
    // Class has a Module that it delegates to
    this.__mod__ = new JS.Module(this.__nom__, {}, {_resolve: this.prototype});
    this.include(JS.Kernel, false);
    
    if (klass !== Object) this.include(klass.__mod__ || new JS.Module(klass.prototype,
        {_resolve: klass.prototype}), false);
  },
  
  /**
   * JS.Class#include(module[, resolve = true[, options = {}]]) -> undefined
   * - module (JS.Module): the module to mix in
   * - resolve (Boolean): sets whether to refresh method tables afterward
   * - options (Object): flags to control execution
   * 
   * Mixes a `module` into the class if it's a `JS.Module` instance, or adds instance
   * methods to the class itself if given a plain old object. Overrides `JS.Module#include`
   * to make sure callbacks fire on the class rather than its delegating module.
   **/
  include: function(module, resolve, options) {
    if (!module) return;
    
    var mod     = this.__mod__,
        options = options || {};
    
    options._included = this;
    return mod.include(module, resolve, options);
  },
  
  /**
   * JS.Class#define(name, func[, resolve = true[, options = {}]]) -> undefined
   * - name (String): the name of the method
   * - func (Function): a function to implement the method
   * - resolve (Boolean): sets whether to refresh method tables afterward
   * - options (Object): options for internal use
   * 
   * Adds an instance method to the class with the given `name`. The `options` parameter is
   * for internal use to make sure callbacks fire on the correct objects, e.g. a class
   * uses a hidden module to store its methods, but callbacks should fire on the class,
   * not the module.
   **/
  define: function(name, func, resolve, options) {
    var module = this.__mod__;
    options = options || {};
    options._notify = this;
    module.define(name, func, resolve, options);
  }
});


// This file bootstraps the framework by redefining Module and Class using their
// own prototypes and mixing in methods from Kernel, making these classes appear
// to be instances of themselves.

JS.Module = new JS.Class('Module', JS.Module.prototype);
JS.Class = new JS.Class('Class', JS.Module, JS.Class.prototype);
JS.Module.klass = JS.Module.constructor =
JS.Class.klass = JS.Class.constructor = JS.Class;

JS.extend(JS.Module, {
  _observers: [],
  
  __chainq__: [],
  
  methodAdded: function(block, context) {
    this._observers.push([block, context]);
  },
  
  _notify: function(name, object) {
    var obs = this._observers, i = obs.length;
    while (i--) obs[i][0].call(obs[i][1] || null, name, object);
  }
});


/** section: core
 * mixin JS.Kernel
 * 
 * `Kernel` is the base module; all classes include the `Kernel`, so its methods become
 * available to all objects instantiated by JS.Class. As in Ruby, the core `Object`
 * methods are implemented here rather than in the base `Object` class. JS.Class does
 * not in fact have an `Object` class and does not modify the builtin JavaScript `Object`
 * class either.
 **/
JS.Kernel = JS.extend(new JS.Module('Kernel', {
  /**
   * JS.Kernel#__eigen__() -> JS.Module
   * 
   * Returns the object's metamodule, analogous to calling `(class << self; self; end)`
   * in Ruby. Ruby's metaclasses are `Class`es, not just `Module`s, but so far I've not found
   * a compelling reason to enforce this. You cannot instantiate or subclass metaclasses
   * in Ruby, they only really exist to store methods so a module will suffice.
   **/
  __eigen__: function() {
    if (this.__meta__) return this.__meta__;
    
    var me     = this.__nom__,
        klass  = this.klass.__nom__,
        name   = me || (klass ? '#<' + klass + '>' : ''),
        module = this.__meta__ = new JS.Module(name ? name + '.' : '', {}, {_resolve: this});
    
    module.include(this.klass.__mod__, false);
    return module;
  },
  
  /**
   * JS.Kernel#equals(object) -> Boolean
   * - object (Object): object to compare to the receiver
   * 
   * Returns `true` iff `object` is the same object as the receiver. Override to provide a
   * more meaningful comparison for use in sets, hashtables etc.
   **/
  equals: function(object) {
    return this === object;
  },
  
  /**
   * JS.Kernel#extend(module[, resolve = true]) -> undefined
   * - module (JS.Module): module with which to extend the object
   * - resolve (Boolean): whether to refresh method tables afterward
   * 
   * Extends the object using the methods from `module`. If `module` is an instance of
   * `JS.Module`, it becomes part of the object's inheritance chain and any methods added
   * directly to the object will take precedence. Pass `false` as a second argument
   * to prevent the method resolution process from firing.
   **/
  extend: function(module, resolve) {
    return this.__eigen__().include(module, resolve, {_extended: this});
  },
  
  /**
   * JS.Kernel#hash() -> String
   * 
   * Returns a hexadecimal hashcode for the object for use in hashtables. By default,
   * this is a random number guaranteed to be unique to the object. If you override
   * this method, make sure that `a.equals(b)` implies `a.hash() === b.hash()`.
   **/
  hash: function() {
    return this.__hashcode__ = this.__hashcode__ || JS.Kernel.getHashCode();
  },
  
  /**
   * JS.Kernel#isA(type) -> Boolean
   * - type (JS.Module): module or class to check the object's type against
   * 
   * Returns `true` iff the object is an instance of `type` or one of its
   * subclasses, or if the object's class includes the module `type`.
   **/
  isA: function(moduleOrClass) {
    return this.__eigen__().includes(moduleOrClass);
  },
  
  /**
   * JS.Kernel#method(name) -> Function
   * - name (String): the name of the required method
   * 
   * Returns the named method from the object as a bound function.
   **/
  method: function(name) {
    var self  = this,
        cache = self.__mcache__ = self.__mcache__ || {};
    
    if ((cache[name] || {}).fn === self[name]) return cache[name].bd;
    return (cache[name] = {fn: self[name], bd: JS.bind(self[name], self)}).bd;
  },
  
  /**
   * JS.Kernel#methods() -> Array
   * 
   * Returns a list of all the method names defined on the object.
   **/
  methods: function() {
    return this.__eigen__().instanceMethods(true);
  },
  
  /**
   * JS.Kernel#tap(block[, context]) -> this
   * - block (Function): block of code to execute
   * - context (Object): sets the binding of `this` within `block`
   * 
   * Executes the given function passing the object as a parameter, and returns the
   * object rather than the result of the function. Designed to 'tap into' a method
   * chain to inspect intermediate values. From the Ruby docs:
   * 
   *     list                   .tap(function(x) { console.log("original: ", x) })
   *         .toArray()         .tap(function(x) { console.log("array: ", x) })
   *         .select(condition) .tap(function(x) { console.log("evens: ", x) })
   *         .map(square)       .tap(function(x) { console.log("squares: ", x) })
   **/
  tap: function(block, context) {
    block.call(context || null, this);
    return this;
  }
}),

{
  __hashIndex__: 0,
  
  getHashCode: function() {
    this.__hashIndex__ += 1;
    return (Math.floor(new Date().getTime() / 1000) + this.__hashIndex__).toString(16);
  }
});

JS.Module.include(JS.Kernel);
JS.extend(JS.Module, JS.Kernel.__fns__);
JS.Class.include(JS.Kernel);
JS.extend(JS.Class, JS.Kernel.__fns__);


/** section: core
 * class JS.Interface
 * 
 * `Interface` is a class used to encapsulate sets of methods and check whether objects
 * implement them. Think of interfaces as a means of duck-typing rather than as they are
 * used in Java.
 **/
JS.Interface = new JS.Class({
  /**
   * new JS.Interface(methods)
   * - methods (Array): a list of method names
   * 
   * An `Interface` is instantiated using a list of method names; these methods are the
   * API the interface can be used to check for.
   * 
   *     var HistoryInterface = new JS.Interface([
   *         'getInitialState',
   *         'changeState'
   *     ]);
   **/
  initialize: function(methods) {
    this.test = function(object, returnName) {
      var n = methods.length;
      while (n--) {
        if (!JS.isFn(object[methods[n]]))
          return returnName ? methods[n] : false;
      }
      return true;
    };
  },
  
  /**
   * JS.Interface#test(object[, returnName = false]) -> Boolean | String
   * - object (Object): object whose API we wish to check
   * - returnName (Boolean): if true, return the first name found to be missing
   * 
   * Checks whether `object` implements the interface, returning `true` or `false`. If
   * the second argument is `true`, returns the name of the first method found to be
   * missing from the object's API.
   **/
  
  extend: {
    /**
     * JS.Interface.ensure(object, iface1[, iface2]) -> undefined
     * - object (Object): object whose API we wish to check
     * - iface (JS.Interface): interface the object should implement
     * 
     * Throws an `Error` unless `object` implements the required interface(s).
     **/
    ensure: function() {
      var args = JS.array(arguments), object = args.shift(), face, result;
      while (face = args.shift()) {
        result = face.test(object, true);
        if (result !== true) throw new Error('object does not implement ' + result + '()');
      }
    }
  }
});


/** section: core
 * class JS.Singleton
 * 
 * `Singleton` is a class used to construct custom objects with all the inheritance features
 * of `JS.Class`, the methods from `JS.Kernel`, etc. It constructs an anonymous class from the
 * objects you provide and returns an instance of this class.
 **/
JS.Singleton = new JS.Class({
  /**
   * new JS.Singleton(name, parent, methods)
   * - name (String): the name of the singleton, used for debugging
   * - parent (JS.Class): the parent class to inherit from
   * - methods (Object): list of methods for the singleton
   * 
   * `Singleton`s are instantiated the same way as instances of `JS.Class`, the only difference
   * being that `Singleton` returns an instance of the newly created class, rather than the
   * class itself.
   **/
  initialize: function(name, parent, methods) {
    return new (new JS.Class(name, parent, methods));
  }
});
/*FILE: 3rd/jquery/jquery.js*/
/*!
 * jQuery JavaScript Library v1.3.2
 * http://jquery.com/
 *
 * Copyright (c) 2009 John Resig
 * Dual licensed under the MIT and GPL licenses.
 * http://docs.jquery.com/License
 *
 * Date: 2009-02-19 17:34:21 -0500 (Thu, 19 Feb 2009)
 * Revision: 6246
 */
(function(){

var 
	// Map over jQuery in case of overwrite
	_jQuery = window.jQuery,
	// Map over the $ in case of overwrite
	_$ = window.$,

	jQuery = window.jQuery = window.$ = function( selector, context ) {
		// The jQuery object is actually just the init constructor 'enhanced'
		return new jQuery.fn.init( selector, context );
	},

	// A simple way to check for HTML strings or ID strings
	// (both of which we optimize for)
	quickExpr = /^[^<]*(<(.|\s)+>)[^>]*$|^#([\w-]+)$/,
	// Is it a simple selector
	isSimple = /^.[^:#\[\.,]*$/;

jQuery.fn = jQuery.prototype = {
	init: function( selector, context ) {
		// Make sure that a selection was provided
		selector = selector || document;

		// Handle $(DOMElement)
		if ( selector.nodeType ) {
			this[0] = selector;
			this.length = 1;
			this.context = selector;
			return this;
		}
		// Handle HTML strings
		if ( typeof selector === "string" ) {
			// Are we dealing with HTML string or an ID?
			var match = quickExpr.exec( selector );

			// Verify a match, and that no context was specified for #id
			if ( match && (match[1] || !context) ) {

				// HANDLE: $(html) -> $(array)
				if ( match[1] )
					selector = jQuery.clean( [ match[1] ], context );

				// HANDLE: $("#id")
				else {
					var elem = document.getElementById( match[3] );

					// Handle the case where IE and Opera return items
					// by name instead of ID
					if ( elem && elem.id != match[3] )
						return jQuery().find( selector );

					// Otherwise, we inject the element directly into the jQuery object
					var ret = jQuery( elem || [] );
					ret.context = document;
					ret.selector = selector;
					return ret;
				}

			// HANDLE: $(expr, [context])
			// (which is just equivalent to: $(content).find(expr)
			} else
				return jQuery( context ).find( selector );

		// HANDLE: $(function)
		// Shortcut for document ready
		} else if ( jQuery.isFunction( selector ) )
			return jQuery( document ).ready( selector );

		// Make sure that old selector state is passed along
		if ( selector.selector && selector.context ) {
			this.selector = selector.selector;
			this.context = selector.context;
		}

		return this.setArray(jQuery.isArray( selector ) ?
			selector :
			jQuery.makeArray(selector));
	},

	// Start with an empty selector
	selector: "",

	// The current version of jQuery being used
	jquery: "1.3.2",

	// The number of elements contained in the matched element set
	size: function() {
		return this.length;
	},

	// Get the Nth element in the matched element set OR
	// Get the whole matched element set as a clean array
	get: function( num ) {
		return num === undefined ?

			// Return a 'clean' array
			Array.prototype.slice.call( this ) :

			// Return just the object
			this[ num ];
	},

	// Take an array of elements and push it onto the stack
	// (returning the new matched element set)
	pushStack: function( elems, name, selector ) {
		// Build a new jQuery matched element set
		var ret = jQuery( elems );

		// Add the old object onto the stack (as a reference)
		ret.prevObject = this;

		ret.context = this.context;

		if ( name === "find" )
			ret.selector = this.selector + (this.selector ? " " : "") + selector;
		else if ( name )
			ret.selector = this.selector + "." + name + "(" + selector + ")";

		// Return the newly-formed element set
		return ret;
	},

	// Force the current matched set of elements to become
	// the specified array of elements (destroying the stack in the process)
	// You should use pushStack() in order to do this, but maintain the stack
	setArray: function( elems ) {
		// Resetting the length to 0, then using the native Array push
		// is a super-fast way to populate an object with array-like properties
		this.length = 0;
		Array.prototype.push.apply( this, elems );

		return this;
	},

	// Execute a callback for every element in the matched set.
	// (You can seed the arguments with an array of args, but this is
	// only used internally.)
	each: function( callback, args ) {
		return jQuery.each( this, callback, args );
	},

	// Determine the position of an element within
	// the matched set of elements
	index: function( elem ) {
		// Locate the position of the desired element
		return jQuery.inArray(
			// If it receives a jQuery object, the first element is used
			elem && elem.jquery ? elem[0] : elem
		, this );
	},

	attr: function( name, value, type ) {
		var options = name;

		// Look for the case where we're accessing a style value
		if ( typeof name === "string" )
			if ( value === undefined )
				return this[0] && jQuery[ type || "attr" ]( this[0], name );

			else {
				options = {};
				options[ name ] = value;
			}

		// Check to see if we're setting style values
		return this.each(function(i){
			// Set all the styles
			for ( name in options )
				jQuery.attr(
					type ?
						this.style :
						this,
					name, jQuery.prop( this, options[ name ], type, i, name )
				);
		});
	},

	css: function( key, value ) {
		// ignore negative width and height values
		if ( (key == 'width' || key == 'height') && parseFloat(value) < 0 )
			value = undefined;
		return this.attr( key, value, "curCSS" );
	},

	text: function( text ) {
		if ( typeof text !== "object" && text != null )
			return this.empty().append( (this[0] && this[0].ownerDocument || document).createTextNode( text ) );

		var ret = "";

		jQuery.each( text || this, function(){
			jQuery.each( this.childNodes, function(){
				if ( this.nodeType != 8 )
					ret += this.nodeType != 1 ?
						this.nodeValue :
						jQuery.fn.text( [ this ] );
			});
		});

		return ret;
	},

	wrapAll: function( html ) {
		if ( this[0] ) {
			// The elements to wrap the target around
			var wrap = jQuery( html, this[0].ownerDocument ).clone();

			if ( this[0].parentNode )
				wrap.insertBefore( this[0] );

			wrap.map(function(){
				var elem = this;

				while ( elem.firstChild )
					elem = elem.firstChild;

				return elem;
			}).append(this);
		}

		return this;
	},

	wrapInner: function( html ) {
		return this.each(function(){
			jQuery( this ).contents().wrapAll( html );
		});
	},

	wrap: function( html ) {
		return this.each(function(){
			jQuery( this ).wrapAll( html );
		});
	},

	append: function() {
		return this.domManip(arguments, true, function(elem){
			if (this.nodeType == 1)
				this.appendChild( elem );
		});
	},

	prepend: function() {
		return this.domManip(arguments, true, function(elem){
			if (this.nodeType == 1)
				this.insertBefore( elem, this.firstChild );
		});
	},

	before: function() {
		return this.domManip(arguments, false, function(elem){
			this.parentNode.insertBefore( elem, this );
		});
	},

	after: function() {
		return this.domManip(arguments, false, function(elem){
			this.parentNode.insertBefore( elem, this.nextSibling );
		});
	},

	end: function() {
		return this.prevObject || jQuery( [] );
	},

	// For internal use only.
	// Behaves like an Array's method, not like a jQuery method.
	push: [].push,
	sort: [].sort,
	splice: [].splice,

	find: function( selector ) {
		if ( this.length === 1 ) {
			var ret = this.pushStack( [], "find", selector );
			ret.length = 0;
			jQuery.find( selector, this[0], ret );
			return ret;
		} else {
			return this.pushStack( jQuery.unique(jQuery.map(this, function(elem){
				return jQuery.find( selector, elem );
			})), "find", selector );
		}
	},

	clone: function( events ) {
		// Do the clone
		var ret = this.map(function(){
			if ( !jQuery.support.noCloneEvent && !jQuery.isXMLDoc(this) ) {
				// IE copies events bound via attachEvent when
				// using cloneNode. Calling detachEvent on the
				// clone will also remove the events from the orignal
				// In order to get around this, we use innerHTML.
				// Unfortunately, this means some modifications to
				// attributes in IE that are actually only stored
				// as properties will not be copied (such as the
				// the name attribute on an input).
				var html = this.outerHTML;
				if ( !html ) {
					var div = this.ownerDocument.createElement("div");
					div.appendChild( this.cloneNode(true) );
					html = div.innerHTML;
				}

				return jQuery.clean([html.replace(/ jQuery\d+="(?:\d+|null)"/g, "").replace(/^\s*/, "")])[0];
			} else
				return this.cloneNode(true);
		});

		// Copy the events from the original to the clone
		if ( events === true ) {
			var orig = this.find("*").andSelf(), i = 0;

			ret.find("*").andSelf().each(function(){
				if ( this.nodeName !== orig[i].nodeName )
					return;

				var events = jQuery.data( orig[i], "events" );

				for ( var type in events ) {
					for ( var handler in events[ type ] ) {
						jQuery.event.add( this, type, events[ type ][ handler ], events[ type ][ handler ].data );
					}
				}

				i++;
			});
		}

		// Return the cloned set
		return ret;
	},

	filter: function( selector ) {
		return this.pushStack(
			jQuery.isFunction( selector ) &&
			jQuery.grep(this, function(elem, i){
				return selector.call( elem, i );
			}) ||

			jQuery.multiFilter( selector, jQuery.grep(this, function(elem){
				return elem.nodeType === 1;
			}) ), "filter", selector );
	},

	closest: function( selector ) {
		var pos = jQuery.expr.match.POS.test( selector ) ? jQuery(selector) : null,
			closer = 0;

		return this.map(function(){
			var cur = this;
			while ( cur && cur.ownerDocument ) {
				if ( pos ? pos.index(cur) > -1 : jQuery(cur).is(selector) ) {
					jQuery.data(cur, "closest", closer);
					return cur;
				}
				cur = cur.parentNode;
				closer++;
			}
		});
	},

	not: function( selector ) {
		if ( typeof selector === "string" )
			// test special case where just one selector is passed in
			if ( isSimple.test( selector ) )
				return this.pushStack( jQuery.multiFilter( selector, this, true ), "not", selector );
			else
				selector = jQuery.multiFilter( selector, this );

		var isArrayLike = selector.length && selector[selector.length - 1] !== undefined && !selector.nodeType;
		return this.filter(function() {
			return isArrayLike ? jQuery.inArray( this, selector ) < 0 : this != selector;
		});
	},

	add: function( selector ) {
		return this.pushStack( jQuery.unique( jQuery.merge(
			this.get(),
			typeof selector === "string" ?
				jQuery( selector ) :
				jQuery.makeArray( selector )
		)));
	},

	is: function( selector ) {
		return !!selector && jQuery.multiFilter( selector, this ).length > 0;
	},

	hasClass: function( selector ) {
		return !!selector && this.is( "." + selector );
	},

	val: function( value ) {
		if ( value === undefined ) {			
			var elem = this[0];

			if ( elem ) {
				if( jQuery.nodeName( elem, 'option' ) )
					return (elem.attributes.value || {}).specified ? elem.value : elem.text;
				
				// We need to handle select boxes special
				if ( jQuery.nodeName( elem, "select" ) ) {
					var index = elem.selectedIndex,
						values = [],
						options = elem.options,
						one = elem.type == "select-one";

					// Nothing was selected
					if ( index < 0 )
						return null;

					// Loop through all the selected options
					for ( var i = one ? index : 0, max = one ? index + 1 : options.length; i < max; i++ ) {
						var option = options[ i ];

						if ( option.selected ) {
							// Get the specifc value for the option
							value = jQuery(option).val();

							// We don't need an array for one selects
							if ( one )
								return value;

							// Multi-Selects return an array
							values.push( value );
						}
					}

					return values;				
				}

				// Everything else, we just grab the value
				return (elem.value || "").replace(/\r/g, "");

			}

			return undefined;
		}

		if ( typeof value === "number" )
			value += '';

		return this.each(function(){
			if ( this.nodeType != 1 )
				return;

			if ( jQuery.isArray(value) && /radio|checkbox/.test( this.type ) )
				this.checked = (jQuery.inArray(this.value, value) >= 0 ||
					jQuery.inArray(this.name, value) >= 0);

			else if ( jQuery.nodeName( this, "select" ) ) {
				var values = jQuery.makeArray(value);

				jQuery( "option", this ).each(function(){
					this.selected = (jQuery.inArray( this.value, values ) >= 0 ||
						jQuery.inArray( this.text, values ) >= 0);
				});

				if ( !values.length )
					this.selectedIndex = -1;

			} else
				this.value = value;
		});
	},

	html: function( value ) {
		return value === undefined ?
			(this[0] ?
				this[0].innerHTML.replace(/ jQuery\d+="(?:\d+|null)"/g, "") :
				null) :
			this.empty().append( value );
	},

	replaceWith: function( value ) {
		return this.after( value ).remove();
	},

	eq: function( i ) {
		return this.slice( i, +i + 1 );
	},

	slice: function() {
		return this.pushStack( Array.prototype.slice.apply( this, arguments ),
			"slice", Array.prototype.slice.call(arguments).join(",") );
	},

	map: function( callback ) {
		return this.pushStack( jQuery.map(this, function(elem, i){
			return callback.call( elem, i, elem );
		}));
	},

	andSelf: function() {
		return this.add( this.prevObject );
	},

	domManip: function( args, table, callback ) {
		if ( this[0] ) {
			var fragment = (this[0].ownerDocument || this[0]).createDocumentFragment(),
				scripts = jQuery.clean( args, (this[0].ownerDocument || this[0]), fragment ),
				first = fragment.firstChild;

			if ( first )
				for ( var i = 0, l = this.length; i < l; i++ )
					callback.call( root(this[i], first), this.length > 1 || i > 0 ?
							fragment.cloneNode(true) : fragment );
		
			if ( scripts )
				jQuery.each( scripts, evalScript );
		}

		return this;
		
		function root( elem, cur ) {
			return table && jQuery.nodeName(elem, "table") && jQuery.nodeName(cur, "tr") ?
				(elem.getElementsByTagName("tbody")[0] ||
				elem.appendChild(elem.ownerDocument.createElement("tbody"))) :
				elem;
		}
	}
};

// Give the init function the jQuery prototype for later instantiation
jQuery.fn.init.prototype = jQuery.fn;

function evalScript( i, elem ) {
	if ( elem.src )
		jQuery.ajax({
			url: elem.src,
			async: false,
			dataType: "script"
		});

	else
		jQuery.globalEval( elem.text || elem.textContent || elem.innerHTML || "" );

	if ( elem.parentNode )
		elem.parentNode.removeChild( elem );
}

function now(){
	return +new Date;
}

jQuery.extend = jQuery.fn.extend = function() {
	// copy reference to target object
	var target = arguments[0] || {}, i = 1, length = arguments.length, deep = false, options;

	// Handle a deep copy situation
	if ( typeof target === "boolean" ) {
		deep = target;
		target = arguments[1] || {};
		// skip the boolean and the target
		i = 2;
	}

	// Handle case when target is a string or something (possible in deep copy)
	if ( typeof target !== "object" && !jQuery.isFunction(target) )
		target = {};

	// extend jQuery itself if only one argument is passed
	if ( length == i ) {
		target = this;
		--i;
	}

	for ( ; i < length; i++ )
		// Only deal with non-null/undefined values
		if ( (options = arguments[ i ]) != null )
			// Extend the base object
			for ( var name in options ) {
				var src = target[ name ], copy = options[ name ];

				// Prevent never-ending loop
				if ( target === copy )
					continue;

				// Recurse if we're merging object values
				if ( deep && copy && typeof copy === "object" && !copy.nodeType )
					target[ name ] = jQuery.extend( deep, 
						// Never move original objects, clone them
						src || ( copy.length != null ? [ ] : { } )
					, copy );

				// Don't bring in undefined values
				else if ( copy !== undefined )
					target[ name ] = copy;

			}

	// Return the modified object
	return target;
};

// exclude the following css properties to add px
var	exclude = /z-?index|font-?weight|opacity|zoom|line-?height/i,
	// cache defaultView
	defaultView = document.defaultView || {},
	toString = Object.prototype.toString;

jQuery.extend({
	noConflict: function( deep ) {
		window.$ = _$;

		if ( deep )
			window.jQuery = _jQuery;

		return jQuery;
	},

	// See test/unit/core.js for details concerning isFunction.
	// Since version 1.3, DOM methods and functions like alert
	// aren't supported. They return false on IE (#2968).
	isFunction: function( obj ) {
		return toString.call(obj) === "[object Function]";
	},

	isArray: function( obj ) {
		return toString.call(obj) === "[object Array]";
	},

	// check if an element is in a (or is an) XML document
	isXMLDoc: function( elem ) {
		return elem.nodeType === 9 && elem.documentElement.nodeName !== "HTML" ||
			!!elem.ownerDocument && jQuery.isXMLDoc( elem.ownerDocument );
	},

	// Evalulates a script in a global context
	globalEval: function( data ) {
		if ( data && /\S/.test(data) ) {
			// Inspired by code by Andrea Giammarchi
			// http://webreflection.blogspot.com/2007/08/global-scope-evaluation-and-dom.html
			var head = document.getElementsByTagName("head")[0] || document.documentElement,
				script = document.createElement("script");

			script.type = "text/javascript";
			if ( jQuery.support.scriptEval )
				script.appendChild( document.createTextNode( data ) );
			else
				script.text = data;

			// Use insertBefore instead of appendChild  to circumvent an IE6 bug.
			// This arises when a base node is used (#2709).
			head.insertBefore( script, head.firstChild );
			head.removeChild( script );
		}
	},

	nodeName: function( elem, name ) {
		return elem.nodeName && elem.nodeName.toUpperCase() == name.toUpperCase();
	},

	// args is for internal usage only
	each: function( object, callback, args ) {
		var name, i = 0, length = object.length;

		if ( args ) {
			if ( length === undefined ) {
				for ( name in object )
					if ( callback.apply( object[ name ], args ) === false )
						break;
			} else
				for ( ; i < length; )
					if ( callback.apply( object[ i++ ], args ) === false )
						break;

		// A special, fast, case for the most common use of each
		} else {
			if ( length === undefined ) {
				for ( name in object )
					if ( callback.call( object[ name ], name, object[ name ] ) === false )
						break;
			} else
				for ( var value = object[0];
					i < length && callback.call( value, i, value ) !== false; value = object[++i] ){}
		}

		return object;
	},

	prop: function( elem, value, type, i, name ) {
		// Handle executable functions
		if ( jQuery.isFunction( value ) )
			value = value.call( elem, i );

		// Handle passing in a number to a CSS property
		return typeof value === "number" && type == "curCSS" && !exclude.test( name ) ?
			value + "px" :
			value;
	},

	className: {
		// internal only, use addClass("class")
		add: function( elem, classNames ) {
			jQuery.each((classNames || "").split(/\s+/), function(i, className){
				if ( elem.nodeType == 1 && !jQuery.className.has( elem.className, className ) )
					elem.className += (elem.className ? " " : "") + className;
			});
		},

		// internal only, use removeClass("class")
		remove: function( elem, classNames ) {
			if (elem.nodeType == 1)
				elem.className = classNames !== undefined ?
					jQuery.grep(elem.className.split(/\s+/), function(className){
						return !jQuery.className.has( classNames, className );
					}).join(" ") :
					"";
		},

		// internal only, use hasClass("class")
		has: function( elem, className ) {
			return elem && jQuery.inArray( className, (elem.className || elem).toString().split(/\s+/) ) > -1;
		}
	},

	// A method for quickly swapping in/out CSS properties to get correct calculations
	swap: function( elem, options, callback ) {
		var old = {};
		// Remember the old values, and insert the new ones
		for ( var name in options ) {
			old[ name ] = elem.style[ name ];
			elem.style[ name ] = options[ name ];
		}

		callback.call( elem );

		// Revert the old values
		for ( var name in options )
			elem.style[ name ] = old[ name ];
	},

	css: function( elem, name, force, extra ) {
		if ( name == "width" || name == "height" ) {
			var val, props = { position: "absolute", visibility: "hidden", display:"block" }, which = name == "width" ? [ "Left", "Right" ] : [ "Top", "Bottom" ];

			function getWH() {
				val = name == "width" ? elem.offsetWidth : elem.offsetHeight;

				if ( extra === "border" )
					return;

				jQuery.each( which, function() {
					if ( !extra )
						val -= parseFloat(jQuery.curCSS( elem, "padding" + this, true)) || 0;
					if ( extra === "margin" )
						val += parseFloat(jQuery.curCSS( elem, "margin" + this, true)) || 0;
					else
						val -= parseFloat(jQuery.curCSS( elem, "border" + this + "Width", true)) || 0;
				});
			}

			if ( elem.offsetWidth !== 0 )
				getWH();
			else
				jQuery.swap( elem, props, getWH );

			return Math.max(0, Math.round(val));
		}

		return jQuery.curCSS( elem, name, force );
	},

	curCSS: function( elem, name, force ) {
		var ret, style = elem.style;

		// We need to handle opacity special in IE
		if ( name == "opacity" && !jQuery.support.opacity ) {
			ret = jQuery.attr( style, "opacity" );

			return ret == "" ?
				"1" :
				ret;
		}

		// Make sure we're using the right name for getting the float value
		if ( name.match( /float/i ) )
			name = styleFloat;

		if ( !force && style && style[ name ] )
			ret = style[ name ];

		else if ( defaultView.getComputedStyle ) {

			// Only "float" is needed here
			if ( name.match( /float/i ) )
				name = "float";

			name = name.replace( /([A-Z])/g, "-$1" ).toLowerCase();

			var computedStyle = defaultView.getComputedStyle( elem, null );

			if ( computedStyle )
				ret = computedStyle.getPropertyValue( name );

			// We should always get a number back from opacity
			if ( name == "opacity" && ret == "" )
				ret = "1";

		} else if ( elem.currentStyle ) {
			var camelCase = name.replace(/\-(\w)/g, function(all, letter){
				return letter.toUpperCase();
			});

			ret = elem.currentStyle[ name ] || elem.currentStyle[ camelCase ];

			// From the awesome hack by Dean Edwards
			// http://erik.eae.net/archives/2007/07/27/18.54.15/#comment-102291

			// If we're not dealing with a regular pixel number
			// but a number that has a weird ending, we need to convert it to pixels
			if ( !/^\d+(px)?$/i.test( ret ) && /^\d/.test( ret ) ) {
				// Remember the original values
				var left = style.left, rsLeft = elem.runtimeStyle.left;

				// Put in the new values to get a computed value out
				elem.runtimeStyle.left = elem.currentStyle.left;
				style.left = ret || 0;
				ret = style.pixelLeft + "px";

				// Revert the changed values
				style.left = left;
				elem.runtimeStyle.left = rsLeft;
			}
		}

		return ret;
	},

	clean: function( elems, context, fragment ) {
		context = context || document;

		// !context.createElement fails in IE with an error but returns typeof 'object'
		if ( typeof context.createElement === "undefined" )
			context = context.ownerDocument || context[0] && context[0].ownerDocument || document;

		// If a single string is passed in and it's a single tag
		// just do a createElement and skip the rest
		if ( !fragment && elems.length === 1 && typeof elems[0] === "string" ) {
			var match = /^<(\w+)\s*\/?>$/.exec(elems[0]);
			if ( match )
				return [ context.createElement( match[1] ) ];
		}

		var ret = [], scripts = [], div = context.createElement("div");

		jQuery.each(elems, function(i, elem){
			if ( typeof elem === "number" )
				elem += '';

			if ( !elem )
				return;

			// Convert html string into DOM nodes
			if ( typeof elem === "string" ) {
				// Fix "XHTML"-style tags in all browsers
				elem = elem.replace(/(<(\w+)[^>]*?)\/>/g, function(all, front, tag){
					return tag.match(/^(abbr|br|col|img|input|link|meta|param|hr|area|embed)$/i) ?
						all :
						front + "></" + tag + ">";
				});

				// Trim whitespace, otherwise indexOf won't work as expected
				var tags = elem.replace(/^\s+/, "").substring(0, 10).toLowerCase();

				var wrap =
					// option or optgroup
					!tags.indexOf("<opt") &&
					[ 1, "<select multiple='multiple'>", "</select>" ] ||

					!tags.indexOf("<leg") &&
					[ 1, "<fieldset>", "</fieldset>" ] ||

					tags.match(/^<(thead|tbody|tfoot|colg|cap)/) &&
					[ 1, "<table>", "</table>" ] ||

					!tags.indexOf("<tr") &&
					[ 2, "<table><tbody>", "</tbody></table>" ] ||

				 	// <thead> matched above
					(!tags.indexOf("<td") || !tags.indexOf("<th")) &&
					[ 3, "<table><tbody><tr>", "</tr></tbody></table>" ] ||

					!tags.indexOf("<col") &&
					[ 2, "<table><tbody></tbody><colgroup>", "</colgroup></table>" ] ||

					// IE can't serialize <link> and <script> tags normally
					!jQuery.support.htmlSerialize &&
					[ 1, "div<div>", "</div>" ] ||

					[ 0, "", "" ];

				// Go to html and back, then peel off extra wrappers
				div.innerHTML = wrap[1] + elem + wrap[2];

				// Move to the right depth
				while ( wrap[0]-- )
					div = div.lastChild;

				// Remove IE's autoinserted <tbody> from table fragments
				if ( !jQuery.support.tbody ) {

					// String was a <table>, *may* have spurious <tbody>
					var hasBody = /<tbody/i.test(elem),
						tbody = !tags.indexOf("<table") && !hasBody ?
							div.firstChild && div.firstChild.childNodes :

						// String was a bare <thead> or <tfoot>
						wrap[1] == "<table>" && !hasBody ?
							div.childNodes :
							[];

					for ( var j = tbody.length - 1; j >= 0 ; --j )
						if ( jQuery.nodeName( tbody[ j ], "tbody" ) && !tbody[ j ].childNodes.length )
							tbody[ j ].parentNode.removeChild( tbody[ j ] );

					}

				// IE completely kills leading whitespace when innerHTML is used
				if ( !jQuery.support.leadingWhitespace && /^\s/.test( elem ) )
					div.insertBefore( context.createTextNode( elem.match(/^\s*/)[0] ), div.firstChild );
				
				elem = jQuery.makeArray( div.childNodes );
			}

			if ( elem.nodeType )
				ret.push( elem );
			else
				ret = jQuery.merge( ret, elem );

		});

		if ( fragment ) {
			for ( var i = 0; ret[i]; i++ ) {
				if ( jQuery.nodeName( ret[i], "script" ) && (!ret[i].type || ret[i].type.toLowerCase() === "text/javascript") ) {
					scripts.push( ret[i].parentNode ? ret[i].parentNode.removeChild( ret[i] ) : ret[i] );
				} else {
					if ( ret[i].nodeType === 1 )
						ret.splice.apply( ret, [i + 1, 0].concat(jQuery.makeArray(ret[i].getElementsByTagName("script"))) );
					fragment.appendChild( ret[i] );
				}
			}
			
			return scripts;
		}

		return ret;
	},

	attr: function( elem, name, value ) {
		// don't set attributes on text and comment nodes
		if (!elem || elem.nodeType == 3 || elem.nodeType == 8)
			return undefined;

		var notxml = !jQuery.isXMLDoc( elem ),
			// Whether we are setting (or getting)
			set = value !== undefined;

		// Try to normalize/fix the name
		name = notxml && jQuery.props[ name ] || name;

		// Only do all the following if this is a node (faster for style)
		// IE elem.getAttribute passes even for style
		if ( elem.tagName ) {

			// These attributes require special treatment
			var special = /href|src|style/.test( name );

			// Safari mis-reports the default selected property of a hidden option
			// Accessing the parent's selectedIndex property fixes it
			if ( name == "selected" && elem.parentNode )
				elem.parentNode.selectedIndex;

			// If applicable, access the attribute via the DOM 0 way
			if ( name in elem && notxml && !special ) {
				if ( set ){
					// We can't allow the type property to be changed (since it causes problems in IE)
					if ( name == "type" && jQuery.nodeName( elem, "input" ) && elem.parentNode )
						throw "type property can't be changed";

					elem[ name ] = value;
				}

				// browsers index elements by id/name on forms, give priority to attributes.
				if( jQuery.nodeName( elem, "form" ) && elem.getAttributeNode(name) )
					return elem.getAttributeNode( name ).nodeValue;

				// elem.tabIndex doesn't always return the correct value when it hasn't been explicitly set
				// http://fluidproject.org/blog/2008/01/09/getting-setting-and-removing-tabindex-values-with-javascript/
				if ( name == "tabIndex" ) {
					var attributeNode = elem.getAttributeNode( "tabIndex" );
					return attributeNode && attributeNode.specified
						? attributeNode.value
						: elem.nodeName.match(/(button|input|object|select|textarea)/i)
							? 0
							: elem.nodeName.match(/^(a|area)$/i) && elem.href
								? 0
								: undefined;
				}

				return elem[ name ];
			}

			if ( !jQuery.support.style && notxml &&  name == "style" )
				return jQuery.attr( elem.style, "cssText", value );

			if ( set )
				// convert the value to a string (all browsers do this but IE) see #1070
				elem.setAttribute( name, "" + value );

			var attr = !jQuery.support.hrefNormalized && notxml && special
					// Some attributes require a special call on IE
					? elem.getAttribute( name, 2 )
					: elem.getAttribute( name );

			// Non-existent attributes return null, we normalize to undefined
			return attr === null ? undefined : attr;
		}

		// elem is actually elem.style ... set the style

		// IE uses filters for opacity
		if ( !jQuery.support.opacity && name == "opacity" ) {
			if ( set ) {
				// IE has trouble with opacity if it does not have layout
				// Force it by setting the zoom level
				elem.zoom = 1;

				// Set the alpha filter to set the opacity
				elem.filter = (elem.filter || "").replace( /alpha\([^)]*\)/, "" ) +
					(parseInt( value ) + '' == "NaN" ? "" : "alpha(opacity=" + value * 100 + ")");
			}

			return elem.filter && elem.filter.indexOf("opacity=") >= 0 ?
				(parseFloat( elem.filter.match(/opacity=([^)]*)/)[1] ) / 100) + '':
				"";
		}

		name = name.replace(/-([a-z])/ig, function(all, letter){
			return letter.toUpperCase();
		});

		if ( set )
			elem[ name ] = value;

		return elem[ name ];
	},

	trim: function( text ) {
		return (text || "").replace( /^\s+|\s+$/g, "" );
	},

	makeArray: function( array ) {
		var ret = [];

		if( array != null ){
			var i = array.length;
			// The window, strings (and functions) also have 'length'
			if( i == null || typeof array === "string" || jQuery.isFunction(array) || array.setInterval )
				ret[0] = array;
			else
				while( i )
					ret[--i] = array[i];
		}

		return ret;
	},

	inArray: function( elem, array ) {
		for ( var i = 0, length = array.length; i < length; i++ )
		// Use === because on IE, window == document
			if ( array[ i ] === elem )
				return i;

		return -1;
	},

	merge: function( first, second ) {
		// We have to loop this way because IE & Opera overwrite the length
		// expando of getElementsByTagName
		var i = 0, elem, pos = first.length;
		// Also, we need to make sure that the correct elements are being returned
		// (IE returns comment nodes in a '*' query)
		if ( !jQuery.support.getAll ) {
			while ( (elem = second[ i++ ]) != null )
				if ( elem.nodeType != 8 )
					first[ pos++ ] = elem;

		} else
			while ( (elem = second[ i++ ]) != null )
				first[ pos++ ] = elem;

		return first;
	},

	unique: function( array ) {
		var ret = [], done = {};

		try {

			for ( var i = 0, length = array.length; i < length; i++ ) {
				var id = jQuery.data( array[ i ] );

				if ( !done[ id ] ) {
					done[ id ] = true;
					ret.push( array[ i ] );
				}
			}

		} catch( e ) {
			ret = array;
		}

		return ret;
	},

	grep: function( elems, callback, inv ) {
		var ret = [];

		// Go through the array, only saving the items
		// that pass the validator function
		for ( var i = 0, length = elems.length; i < length; i++ )
			if ( !inv != !callback( elems[ i ], i ) )
				ret.push( elems[ i ] );

		return ret;
	},

	map: function( elems, callback ) {
		var ret = [];

		// Go through the array, translating each of the items to their
		// new value (or values).
		for ( var i = 0, length = elems.length; i < length; i++ ) {
			var value = callback( elems[ i ], i );

			if ( value != null )
				ret[ ret.length ] = value;
		}

		return ret.concat.apply( [], ret );
	}
});

// Use of jQuery.browser is deprecated.
// It's included for backwards compatibility and plugins,
// although they should work to migrate away.

var userAgent = navigator.userAgent.toLowerCase();

// Figure out what browser is being used
jQuery.browser = {
	version: (userAgent.match( /.+(?:rv|it|ra|ie)[\/: ]([\d.]+)/ ) || [0,'0'])[1],
	safari: /webkit/.test( userAgent ),
	opera: /opera/.test( userAgent ),
	msie: /msie/.test( userAgent ) && !/opera/.test( userAgent ),
	mozilla: /mozilla/.test( userAgent ) && !/(compatible|webkit)/.test( userAgent )
};

jQuery.each({
	parent: function(elem){return elem.parentNode;},
	parents: function(elem){return jQuery.dir(elem,"parentNode");},
	next: function(elem){return jQuery.nth(elem,2,"nextSibling");},
	prev: function(elem){return jQuery.nth(elem,2,"previousSibling");},
	nextAll: function(elem){return jQuery.dir(elem,"nextSibling");},
	prevAll: function(elem){return jQuery.dir(elem,"previousSibling");},
	siblings: function(elem){return jQuery.sibling(elem.parentNode.firstChild,elem);},
	children: function(elem){return jQuery.sibling(elem.firstChild);},
	contents: function(elem){return jQuery.nodeName(elem,"iframe")?elem.contentDocument||elem.contentWindow.document:jQuery.makeArray(elem.childNodes);}
}, function(name, fn){
	jQuery.fn[ name ] = function( selector ) {
		var ret = jQuery.map( this, fn );

		if ( selector && typeof selector == "string" )
			ret = jQuery.multiFilter( selector, ret );

		return this.pushStack( jQuery.unique( ret ), name, selector );
	};
});

jQuery.each({
	appendTo: "append",
	prependTo: "prepend",
	insertBefore: "before",
	insertAfter: "after",
	replaceAll: "replaceWith"
}, function(name, original){
	jQuery.fn[ name ] = function( selector ) {
		var ret = [], insert = jQuery( selector );

		for ( var i = 0, l = insert.length; i < l; i++ ) {
			var elems = (i > 0 ? this.clone(true) : this).get();
			jQuery.fn[ original ].apply( jQuery(insert[i]), elems );
			ret = ret.concat( elems );
		}

		return this.pushStack( ret, name, selector );
	};
});

jQuery.each({
	removeAttr: function( name ) {
		jQuery.attr( this, name, "" );
		if (this.nodeType == 1)
			this.removeAttribute( name );
	},

	addClass: function( classNames ) {
		jQuery.className.add( this, classNames );
	},

	removeClass: function( classNames ) {
		jQuery.className.remove( this, classNames );
	},

	toggleClass: function( classNames, state ) {
		if( typeof state !== "boolean" )
			state = !jQuery.className.has( this, classNames );
		jQuery.className[ state ? "add" : "remove" ]( this, classNames );
	},

	remove: function( selector ) {
		if ( !selector || jQuery.filter( selector, [ this ] ).length ) {
			// Prevent memory leaks
			jQuery( "*", this ).add([this]).each(function(){
				jQuery.event.remove(this);
				jQuery.removeData(this);
			});
			if (this.parentNode)
				this.parentNode.removeChild( this );
		}
	},

	empty: function() {
		// Remove element nodes and prevent memory leaks
		jQuery(this).children().remove();

		// Remove any remaining nodes
		while ( this.firstChild )
			this.removeChild( this.firstChild );
	}
}, function(name, fn){
	jQuery.fn[ name ] = function(){
		return this.each( fn, arguments );
	};
});

// Helper function used by the dimensions and offset modules
function num(elem, prop) {
	return elem[0] && parseInt( jQuery.curCSS(elem[0], prop, true), 10 ) || 0;
}
var expando = "jQuery" + now(), uuid = 0, windowData = {};

jQuery.extend({
	cache: {},

	data: function( elem, name, data ) {
		elem = elem == window ?
			windowData :
			elem;

		var id = elem[ expando ];

		// Compute a unique ID for the element
		if ( !id )
			id = elem[ expando ] = ++uuid;

		// Only generate the data cache if we're
		// trying to access or manipulate it
		if ( name && !jQuery.cache[ id ] )
			jQuery.cache[ id ] = {};

		// Prevent overriding the named cache with undefined values
		if ( data !== undefined )
			jQuery.cache[ id ][ name ] = data;

		// Return the named cache data, or the ID for the element
		return name ?
			jQuery.cache[ id ][ name ] :
			id;
	},

	removeData: function( elem, name ) {
		elem = elem == window ?
			windowData :
			elem;

		var id = elem[ expando ];

		// If we want to remove a specific section of the element's data
		if ( name ) {
			if ( jQuery.cache[ id ] ) {
				// Remove the section of cache data
				delete jQuery.cache[ id ][ name ];

				// If we've removed all the data, remove the element's cache
				name = "";

				for ( name in jQuery.cache[ id ] )
					break;

				if ( !name )
					jQuery.removeData( elem );
			}

		// Otherwise, we want to remove all of the element's data
		} else {
			// Clean up the element expando
			try {
				delete elem[ expando ];
			} catch(e){
				// IE has trouble directly removing the expando
				// but it's ok with using removeAttribute
				if ( elem.removeAttribute )
					elem.removeAttribute( expando );
			}

			// Completely remove the data cache
			delete jQuery.cache[ id ];
		}
	},
	queue: function( elem, type, data ) {
		if ( elem ){
	
			type = (type || "fx") + "queue";
	
			var q = jQuery.data( elem, type );
	
			if ( !q || jQuery.isArray(data) )
				q = jQuery.data( elem, type, jQuery.makeArray(data) );
			else if( data )
				q.push( data );
	
		}
		return q;
	},

	dequeue: function( elem, type ){
		var queue = jQuery.queue( elem, type ),
			fn = queue.shift();
		
		if( !type || type === "fx" )
			fn = queue[0];
			
		if( fn !== undefined )
			fn.call(elem);
	}
});

jQuery.fn.extend({
	data: function( key, value ){
		var parts = key.split(".");
		parts[1] = parts[1] ? "." + parts[1] : "";

		if ( value === undefined ) {
			var data = this.triggerHandler("getData" + parts[1] + "!", [parts[0]]);

			if ( data === undefined && this.length )
				data = jQuery.data( this[0], key );

			return data === undefined && parts[1] ?
				this.data( parts[0] ) :
				data;
		} else
			return this.trigger("setData" + parts[1] + "!", [parts[0], value]).each(function(){
				jQuery.data( this, key, value );
			});
	},

	removeData: function( key ){
		return this.each(function(){
			jQuery.removeData( this, key );
		});
	},
	queue: function(type, data){
		if ( typeof type !== "string" ) {
			data = type;
			type = "fx";
		}

		if ( data === undefined )
			return jQuery.queue( this[0], type );

		return this.each(function(){
			var queue = jQuery.queue( this, type, data );
			
			 if( type == "fx" && queue.length == 1 )
				queue[0].call(this);
		});
	},
	dequeue: function(type){
		return this.each(function(){
			jQuery.dequeue( this, type );
		});
	}
});/*!
 * Sizzle CSS Selector Engine - v0.9.3
 *  Copyright 2009, The Dojo Foundation
 *  Released under the MIT, BSD, and GPL Licenses.
 *  More information: http://sizzlejs.com/
 */
(function(){

var chunker = /((?:\((?:\([^()]+\)|[^()]+)+\)|\[(?:\[[^[\]]*\]|['"][^'"]*['"]|[^[\]'"]+)+\]|\\.|[^ >+~,(\[\\]+)+|[>+~])(\s*,\s*)?/g,
	done = 0,
	toString = Object.prototype.toString;

var Sizzle = function(selector, context, results, seed) {
	results = results || [];
	context = context || document;

	if ( context.nodeType !== 1 && context.nodeType !== 9 )
		return [];
	
	if ( !selector || typeof selector !== "string" ) {
		return results;
	}

	var parts = [], m, set, checkSet, check, mode, extra, prune = true;
	
	// Reset the position of the chunker regexp (start from head)
	chunker.lastIndex = 0;
	
	while ( (m = chunker.exec(selector)) !== null ) {
		parts.push( m[1] );
		
		if ( m[2] ) {
			extra = RegExp.rightContext;
			break;
		}
	}

	if ( parts.length > 1 && origPOS.exec( selector ) ) {
		if ( parts.length === 2 && Expr.relative[ parts[0] ] ) {
			set = posProcess( parts[0] + parts[1], context );
		} else {
			set = Expr.relative[ parts[0] ] ?
				[ context ] :
				Sizzle( parts.shift(), context );

			while ( parts.length ) {
				selector = parts.shift();

				if ( Expr.relative[ selector ] )
					selector += parts.shift();

				set = posProcess( selector, set );
			}
		}
	} else {
		var ret = seed ?
			{ expr: parts.pop(), set: makeArray(seed) } :
			Sizzle.find( parts.pop(), parts.length === 1 && context.parentNode ? context.parentNode : context, isXML(context) );
		set = Sizzle.filter( ret.expr, ret.set );

		if ( parts.length > 0 ) {
			checkSet = makeArray(set);
		} else {
			prune = false;
		}

		while ( parts.length ) {
			var cur = parts.pop(), pop = cur;

			if ( !Expr.relative[ cur ] ) {
				cur = "";
			} else {
				pop = parts.pop();
			}

			if ( pop == null ) {
				pop = context;
			}

			Expr.relative[ cur ]( checkSet, pop, isXML(context) );
		}
	}

	if ( !checkSet ) {
		checkSet = set;
	}

	if ( !checkSet ) {
		throw "Syntax error, unrecognized expression: " + (cur || selector);
	}

	if ( toString.call(checkSet) === "[object Array]" ) {
		if ( !prune ) {
			results.push.apply( results, checkSet );
		} else if ( context.nodeType === 1 ) {
			for ( var i = 0; checkSet[i] != null; i++ ) {
				if ( checkSet[i] && (checkSet[i] === true || checkSet[i].nodeType === 1 && contains(context, checkSet[i])) ) {
					results.push( set[i] );
				}
			}
		} else {
			for ( var i = 0; checkSet[i] != null; i++ ) {
				if ( checkSet[i] && checkSet[i].nodeType === 1 ) {
					results.push( set[i] );
				}
			}
		}
	} else {
		makeArray( checkSet, results );
	}

	if ( extra ) {
		Sizzle( extra, context, results, seed );

		if ( sortOrder ) {
			hasDuplicate = false;
			results.sort(sortOrder);

			if ( hasDuplicate ) {
				for ( var i = 1; i < results.length; i++ ) {
					if ( results[i] === results[i-1] ) {
						results.splice(i--, 1);
					}
				}
			}
		}
	}

	return results;
};

Sizzle.matches = function(expr, set){
	return Sizzle(expr, null, null, set);
};

Sizzle.find = function(expr, context, isXML){
	var set, match;

	if ( !expr ) {
		return [];
	}

	for ( var i = 0, l = Expr.order.length; i < l; i++ ) {
		var type = Expr.order[i], match;
		
		if ( (match = Expr.match[ type ].exec( expr )) ) {
			var left = RegExp.leftContext;

			if ( left.substr( left.length - 1 ) !== "\\" ) {
				match[1] = (match[1] || "").replace(/\\/g, "");
				set = Expr.find[ type ]( match, context, isXML );
				if ( set != null ) {
					expr = expr.replace( Expr.match[ type ], "" );
					break;
				}
			}
		}
	}

	if ( !set ) {
		set = context.getElementsByTagName("*");
	}

	return {set: set, expr: expr};
};

Sizzle.filter = function(expr, set, inplace, not){
	var old = expr, result = [], curLoop = set, match, anyFound,
		isXMLFilter = set && set[0] && isXML(set[0]);

	while ( expr && set.length ) {
		for ( var type in Expr.filter ) {
			if ( (match = Expr.match[ type ].exec( expr )) != null ) {
				var filter = Expr.filter[ type ], found, item;
				anyFound = false;

				if ( curLoop == result ) {
					result = [];
				}

				if ( Expr.preFilter[ type ] ) {
					match = Expr.preFilter[ type ]( match, curLoop, inplace, result, not, isXMLFilter );

					if ( !match ) {
						anyFound = found = true;
					} else if ( match === true ) {
						continue;
					}
				}

				if ( match ) {
					for ( var i = 0; (item = curLoop[i]) != null; i++ ) {
						if ( item ) {
							found = filter( item, match, i, curLoop );
							var pass = not ^ !!found;

							if ( inplace && found != null ) {
								if ( pass ) {
									anyFound = true;
								} else {
									curLoop[i] = false;
								}
							} else if ( pass ) {
								result.push( item );
								anyFound = true;
							}
						}
					}
				}

				if ( found !== undefined ) {
					if ( !inplace ) {
						curLoop = result;
					}

					expr = expr.replace( Expr.match[ type ], "" );

					if ( !anyFound ) {
						return [];
					}

					break;
				}
			}
		}

		// Improper expression
		if ( expr == old ) {
			if ( anyFound == null ) {
				throw "Syntax error, unrecognized expression: " + expr;
			} else {
				break;
			}
		}

		old = expr;
	}

	return curLoop;
};

var Expr = Sizzle.selectors = {
	order: [ "ID", "NAME", "TAG" ],
	match: {
		ID: /#((?:[\w\u00c0-\uFFFF_-]|\\.)+)/,
		CLASS: /\.((?:[\w\u00c0-\uFFFF_-]|\\.)+)/,
		NAME: /\[name=['"]*((?:[\w\u00c0-\uFFFF_-]|\\.)+)['"]*\]/,
		ATTR: /\[\s*((?:[\w\u00c0-\uFFFF_-]|\\.)+)\s*(?:(\S?=)\s*(['"]*)(.*?)\3|)\s*\]/,
		TAG: /^((?:[\w\u00c0-\uFFFF\*_-]|\\.)+)/,
		CHILD: /:(only|nth|last|first)-child(?:\((even|odd|[\dn+-]*)\))?/,
		POS: /:(nth|eq|gt|lt|first|last|even|odd)(?:\((\d*)\))?(?=[^-]|$)/,
		PSEUDO: /:((?:[\w\u00c0-\uFFFF_-]|\\.)+)(?:\((['"]*)((?:\([^\)]+\)|[^\2\(\)]*)+)\2\))?/
	},
	attrMap: {
		"class": "className",
		"for": "htmlFor"
	},
	attrHandle: {
		href: function(elem){
			return elem.getAttribute("href");
		}
	},
	relative: {
		"+": function(checkSet, part, isXML){
			var isPartStr = typeof part === "string",
				isTag = isPartStr && !/\W/.test(part),
				isPartStrNotTag = isPartStr && !isTag;

			if ( isTag && !isXML ) {
				part = part.toUpperCase();
			}

			for ( var i = 0, l = checkSet.length, elem; i < l; i++ ) {
				if ( (elem = checkSet[i]) ) {
					while ( (elem = elem.previousSibling) && elem.nodeType !== 1 ) {}

					checkSet[i] = isPartStrNotTag || elem && elem.nodeName === part ?
						elem || false :
						elem === part;
				}
			}

			if ( isPartStrNotTag ) {
				Sizzle.filter( part, checkSet, true );
			}
		},
		">": function(checkSet, part, isXML){
			var isPartStr = typeof part === "string";

			if ( isPartStr && !/\W/.test(part) ) {
				part = isXML ? part : part.toUpperCase();

				for ( var i = 0, l = checkSet.length; i < l; i++ ) {
					var elem = checkSet[i];
					if ( elem ) {
						var parent = elem.parentNode;
						checkSet[i] = parent.nodeName === part ? parent : false;
					}
				}
			} else {
				for ( var i = 0, l = checkSet.length; i < l; i++ ) {
					var elem = checkSet[i];
					if ( elem ) {
						checkSet[i] = isPartStr ?
							elem.parentNode :
							elem.parentNode === part;
					}
				}

				if ( isPartStr ) {
					Sizzle.filter( part, checkSet, true );
				}
			}
		},
		"": function(checkSet, part, isXML){
			var doneName = done++, checkFn = dirCheck;

			if ( !part.match(/\W/) ) {
				var nodeCheck = part = isXML ? part : part.toUpperCase();
				checkFn = dirNodeCheck;
			}

			checkFn("parentNode", part, doneName, checkSet, nodeCheck, isXML);
		},
		"~": function(checkSet, part, isXML){
			var doneName = done++, checkFn = dirCheck;

			if ( typeof part === "string" && !part.match(/\W/) ) {
				var nodeCheck = part = isXML ? part : part.toUpperCase();
				checkFn = dirNodeCheck;
			}

			checkFn("previousSibling", part, doneName, checkSet, nodeCheck, isXML);
		}
	},
	find: {
		ID: function(match, context, isXML){
			if ( typeof context.getElementById !== "undefined" && !isXML ) {
				var m = context.getElementById(match[1]);
				return m ? [m] : [];
			}
		},
		NAME: function(match, context, isXML){
			if ( typeof context.getElementsByName !== "undefined" ) {
				var ret = [], results = context.getElementsByName(match[1]);

				for ( var i = 0, l = results.length; i < l; i++ ) {
					if ( results[i].getAttribute("name") === match[1] ) {
						ret.push( results[i] );
					}
				}

				return ret.length === 0 ? null : ret;
			}
		},
		TAG: function(match, context){
			return context.getElementsByTagName(match[1]);
		}
	},
	preFilter: {
		CLASS: function(match, curLoop, inplace, result, not, isXML){
			match = " " + match[1].replace(/\\/g, "") + " ";

			if ( isXML ) {
				return match;
			}

			for ( var i = 0, elem; (elem = curLoop[i]) != null; i++ ) {
				if ( elem ) {
					if ( not ^ (elem.className && (" " + elem.className + " ").indexOf(match) >= 0) ) {
						if ( !inplace )
							result.push( elem );
					} else if ( inplace ) {
						curLoop[i] = false;
					}
				}
			}

			return false;
		},
		ID: function(match){
			return match[1].replace(/\\/g, "");
		},
		TAG: function(match, curLoop){
			for ( var i = 0; curLoop[i] === false; i++ ){}
			return curLoop[i] && isXML(curLoop[i]) ? match[1] : match[1].toUpperCase();
		},
		CHILD: function(match){
			if ( match[1] == "nth" ) {
				// parse equations like 'even', 'odd', '5', '2n', '3n+2', '4n-1', '-n+6'
				var test = /(-?)(\d*)n((?:\+|-)?\d*)/.exec(
					match[2] == "even" && "2n" || match[2] == "odd" && "2n+1" ||
					!/\D/.test( match[2] ) && "0n+" + match[2] || match[2]);

				// calculate the numbers (first)n+(last) including if they are negative
				match[2] = (test[1] + (test[2] || 1)) - 0;
				match[3] = test[3] - 0;
			}

			// TODO: Move to normal caching system
			match[0] = done++;

			return match;
		},
		ATTR: function(match, curLoop, inplace, result, not, isXML){
			var name = match[1].replace(/\\/g, "");
			
			if ( !isXML && Expr.attrMap[name] ) {
				match[1] = Expr.attrMap[name];
			}

			if ( match[2] === "~=" ) {
				match[4] = " " + match[4] + " ";
			}

			return match;
		},
		PSEUDO: function(match, curLoop, inplace, result, not){
			if ( match[1] === "not" ) {
				// If we're dealing with a complex expression, or a simple one
				if ( match[3].match(chunker).length > 1 || /^\w/.test(match[3]) ) {
					match[3] = Sizzle(match[3], null, null, curLoop);
				} else {
					var ret = Sizzle.filter(match[3], curLoop, inplace, true ^ not);
					if ( !inplace ) {
						result.push.apply( result, ret );
					}
					return false;
				}
			} else if ( Expr.match.POS.test( match[0] ) || Expr.match.CHILD.test( match[0] ) ) {
				return true;
			}
			
			return match;
		},
		POS: function(match){
			match.unshift( true );
			return match;
		}
	},
	filters: {
		enabled: function(elem){
			return elem.disabled === false && elem.type !== "hidden";
		},
		disabled: function(elem){
			return elem.disabled === true;
		},
		checked: function(elem){
			return elem.checked === true;
		},
		selected: function(elem){
			// Accessing this property makes selected-by-default
			// options in Safari work properly
			elem.parentNode.selectedIndex;
			return elem.selected === true;
		},
		parent: function(elem){
			return !!elem.firstChild;
		},
		empty: function(elem){
			return !elem.firstChild;
		},
		has: function(elem, i, match){
			return !!Sizzle( match[3], elem ).length;
		},
		header: function(elem){
			return /h\d/i.test( elem.nodeName );
		},
		text: function(elem){
			return "text" === elem.type;
		},
		radio: function(elem){
			return "radio" === elem.type;
		},
		checkbox: function(elem){
			return "checkbox" === elem.type;
		},
		file: function(elem){
			return "file" === elem.type;
		},
		password: function(elem){
			return "password" === elem.type;
		},
		submit: function(elem){
			return "submit" === elem.type;
		},
		image: function(elem){
			return "image" === elem.type;
		},
		reset: function(elem){
			return "reset" === elem.type;
		},
		button: function(elem){
			return "button" === elem.type || elem.nodeName.toUpperCase() === "BUTTON";
		},
		input: function(elem){
			return /input|select|textarea|button/i.test(elem.nodeName);
		}
	},
	setFilters: {
		first: function(elem, i){
			return i === 0;
		},
		last: function(elem, i, match, array){
			return i === array.length - 1;
		},
		even: function(elem, i){
			return i % 2 === 0;
		},
		odd: function(elem, i){
			return i % 2 === 1;
		},
		lt: function(elem, i, match){
			return i < match[3] - 0;
		},
		gt: function(elem, i, match){
			return i > match[3] - 0;
		},
		nth: function(elem, i, match){
			return match[3] - 0 == i;
		},
		eq: function(elem, i, match){
			return match[3] - 0 == i;
		}
	},
	filter: {
		PSEUDO: function(elem, match, i, array){
			var name = match[1], filter = Expr.filters[ name ];

			if ( filter ) {
				return filter( elem, i, match, array );
			} else if ( name === "contains" ) {
				return (elem.textContent || elem.innerText || "").indexOf(match[3]) >= 0;
			} else if ( name === "not" ) {
				var not = match[3];

				for ( var i = 0, l = not.length; i < l; i++ ) {
					if ( not[i] === elem ) {
						return false;
					}
				}

				return true;
			}
		},
		CHILD: function(elem, match){
			var type = match[1], node = elem;
			switch (type) {
				case 'only':
				case 'first':
					while (node = node.previousSibling)  {
						if ( node.nodeType === 1 ) return false;
					}
					if ( type == 'first') return true;
					node = elem;
				case 'last':
					while (node = node.nextSibling)  {
						if ( node.nodeType === 1 ) return false;
					}
					return true;
				case 'nth':
					var first = match[2], last = match[3];

					if ( first == 1 && last == 0 ) {
						return true;
					}
					
					var doneName = match[0],
						parent = elem.parentNode;
	
					if ( parent && (parent.sizcache !== doneName || !elem.nodeIndex) ) {
						var count = 0;
						for ( node = parent.firstChild; node; node = node.nextSibling ) {
							if ( node.nodeType === 1 ) {
								node.nodeIndex = ++count;
							}
						} 
						parent.sizcache = doneName;
					}
					
					var diff = elem.nodeIndex - last;
					if ( first == 0 ) {
						return diff == 0;
					} else {
						return ( diff % first == 0 && diff / first >= 0 );
					}
			}
		},
		ID: function(elem, match){
			return elem.nodeType === 1 && elem.getAttribute("id") === match;
		},
		TAG: function(elem, match){
			return (match === "*" && elem.nodeType === 1) || elem.nodeName === match;
		},
		CLASS: function(elem, match){
			return (" " + (elem.className || elem.getAttribute("class")) + " ")
				.indexOf( match ) > -1;
		},
		ATTR: function(elem, match){
			var name = match[1],
				result = Expr.attrHandle[ name ] ?
					Expr.attrHandle[ name ]( elem ) :
					elem[ name ] != null ?
						elem[ name ] :
						elem.getAttribute( name ),
				value = result + "",
				type = match[2],
				check = match[4];

			return result == null ?
				type === "!=" :
				type === "=" ?
				value === check :
				type === "*=" ?
				value.indexOf(check) >= 0 :
				type === "~=" ?
				(" " + value + " ").indexOf(check) >= 0 :
				!check ?
				value && result !== false :
				type === "!=" ?
				value != check :
				type === "^=" ?
				value.indexOf(check) === 0 :
				type === "$=" ?
				value.substr(value.length - check.length) === check :
				type === "|=" ?
				value === check || value.substr(0, check.length + 1) === check + "-" :
				false;
		},
		POS: function(elem, match, i, array){
			var name = match[2], filter = Expr.setFilters[ name ];

			if ( filter ) {
				return filter( elem, i, match, array );
			}
		}
	}
};

var origPOS = Expr.match.POS;

for ( var type in Expr.match ) {
	Expr.match[ type ] = RegExp( Expr.match[ type ].source + /(?![^\[]*\])(?![^\(]*\))/.source );
}

var makeArray = function(array, results) {
	array = Array.prototype.slice.call( array );

	if ( results ) {
		results.push.apply( results, array );
		return results;
	}
	
	return array;
};

// Perform a simple check to determine if the browser is capable of
// converting a NodeList to an array using builtin methods.
try {
	Array.prototype.slice.call( document.documentElement.childNodes );

// Provide a fallback method if it does not work
} catch(e){
	makeArray = function(array, results) {
		var ret = results || [];

		if ( toString.call(array) === "[object Array]" ) {
			Array.prototype.push.apply( ret, array );
		} else {
			if ( typeof array.length === "number" ) {
				for ( var i = 0, l = array.length; i < l; i++ ) {
					ret.push( array[i] );
				}
			} else {
				for ( var i = 0; array[i]; i++ ) {
					ret.push( array[i] );
				}
			}
		}

		return ret;
	};
}

var sortOrder;

if ( document.documentElement.compareDocumentPosition ) {
	sortOrder = function( a, b ) {
		var ret = a.compareDocumentPosition(b) & 4 ? -1 : a === b ? 0 : 1;
		if ( ret === 0 ) {
			hasDuplicate = true;
		}
		return ret;
	};
} else if ( "sourceIndex" in document.documentElement ) {
	sortOrder = function( a, b ) {
		var ret = a.sourceIndex - b.sourceIndex;
		if ( ret === 0 ) {
			hasDuplicate = true;
		}
		return ret;
	};
} else if ( document.createRange ) {
	sortOrder = function( a, b ) {
		var aRange = a.ownerDocument.createRange(), bRange = b.ownerDocument.createRange();
		aRange.selectNode(a);
		aRange.collapse(true);
		bRange.selectNode(b);
		bRange.collapse(true);
		var ret = aRange.compareBoundaryPoints(Range.START_TO_END, bRange);
		if ( ret === 0 ) {
			hasDuplicate = true;
		}
		return ret;
	};
}

// Check to see if the browser returns elements by name when
// querying by getElementById (and provide a workaround)
(function(){
	// We're going to inject a fake input element with a specified name
	var form = document.createElement("form"),
		id = "script" + (new Date).getTime();
	form.innerHTML = "<input name='" + id + "'/>";

	// Inject it into the root element, check its status, and remove it quickly
	var root = document.documentElement;
	root.insertBefore( form, root.firstChild );

	// The workaround has to do additional checks after a getElementById
	// Which slows things down for other browsers (hence the branching)
	if ( !!document.getElementById( id ) ) {
		Expr.find.ID = function(match, context, isXML){
			if ( typeof context.getElementById !== "undefined" && !isXML ) {
				var m = context.getElementById(match[1]);
				return m ? m.id === match[1] || typeof m.getAttributeNode !== "undefined" && m.getAttributeNode("id").nodeValue === match[1] ? [m] : undefined : [];
			}
		};

		Expr.filter.ID = function(elem, match){
			var node = typeof elem.getAttributeNode !== "undefined" && elem.getAttributeNode("id");
			return elem.nodeType === 1 && node && node.nodeValue === match;
		};
	}

	root.removeChild( form );
})();

(function(){
	// Check to see if the browser returns only elements
	// when doing getElementsByTagName("*")

	// Create a fake element
	var div = document.createElement("div");
	div.appendChild( document.createComment("") );

	// Make sure no comments are found
	if ( div.getElementsByTagName("*").length > 0 ) {
		Expr.find.TAG = function(match, context){
			var results = context.getElementsByTagName(match[1]);

			// Filter out possible comments
			if ( match[1] === "*" ) {
				var tmp = [];

				for ( var i = 0; results[i]; i++ ) {
					if ( results[i].nodeType === 1 ) {
						tmp.push( results[i] );
					}
				}

				results = tmp;
			}

			return results;
		};
	}

	// Check to see if an attribute returns normalized href attributes
	div.innerHTML = "<a href='#'></a>";
	if ( div.firstChild && typeof div.firstChild.getAttribute !== "undefined" &&
			div.firstChild.getAttribute("href") !== "#" ) {
		Expr.attrHandle.href = function(elem){
			return elem.getAttribute("href", 2);
		};
	}
})();

if ( document.querySelectorAll ) (function(){
	var oldSizzle = Sizzle, div = document.createElement("div");
	div.innerHTML = "<p class='TEST'></p>";

	// Safari can't handle uppercase or unicode characters when
	// in quirks mode.
	if ( div.querySelectorAll && div.querySelectorAll(".TEST").length === 0 ) {
		return;
	}
	
	Sizzle = function(query, context, extra, seed){
		context = context || document;

		// Only use querySelectorAll on non-XML documents
		// (ID selectors don't work in non-HTML documents)
		if ( !seed && context.nodeType === 9 && !isXML(context) ) {
			try {
				return makeArray( context.querySelectorAll(query), extra );
			} catch(e){}
		}
		
		return oldSizzle(query, context, extra, seed);
	};

	Sizzle.find = oldSizzle.find;
	Sizzle.filter = oldSizzle.filter;
	Sizzle.selectors = oldSizzle.selectors;
	Sizzle.matches = oldSizzle.matches;
})();

if ( document.getElementsByClassName && document.documentElement.getElementsByClassName ) (function(){
	var div = document.createElement("div");
	div.innerHTML = "<div class='test e'></div><div class='test'></div>";

	// Opera can't find a second classname (in 9.6)
	if ( div.getElementsByClassName("e").length === 0 )
		return;

	// Safari caches class attributes, doesn't catch changes (in 3.2)
	div.lastChild.className = "e";

	if ( div.getElementsByClassName("e").length === 1 )
		return;

	Expr.order.splice(1, 0, "CLASS");
	Expr.find.CLASS = function(match, context, isXML) {
		if ( typeof context.getElementsByClassName !== "undefined" && !isXML ) {
			return context.getElementsByClassName(match[1]);
		}
	};
})();

function dirNodeCheck( dir, cur, doneName, checkSet, nodeCheck, isXML ) {
	var sibDir = dir == "previousSibling" && !isXML;
	for ( var i = 0, l = checkSet.length; i < l; i++ ) {
		var elem = checkSet[i];
		if ( elem ) {
			if ( sibDir && elem.nodeType === 1 ){
				elem.sizcache = doneName;
				elem.sizset = i;
			}
			elem = elem[dir];
			var match = false;

			while ( elem ) {
				if ( elem.sizcache === doneName ) {
					match = checkSet[elem.sizset];
					break;
				}

				if ( elem.nodeType === 1 && !isXML ){
					elem.sizcache = doneName;
					elem.sizset = i;
				}

				if ( elem.nodeName === cur ) {
					match = elem;
					break;
				}

				elem = elem[dir];
			}

			checkSet[i] = match;
		}
	}
}

function dirCheck( dir, cur, doneName, checkSet, nodeCheck, isXML ) {
	var sibDir = dir == "previousSibling" && !isXML;
	for ( var i = 0, l = checkSet.length; i < l; i++ ) {
		var elem = checkSet[i];
		if ( elem ) {
			if ( sibDir && elem.nodeType === 1 ) {
				elem.sizcache = doneName;
				elem.sizset = i;
			}
			elem = elem[dir];
			var match = false;

			while ( elem ) {
				if ( elem.sizcache === doneName ) {
					match = checkSet[elem.sizset];
					break;
				}

				if ( elem.nodeType === 1 ) {
					if ( !isXML ) {
						elem.sizcache = doneName;
						elem.sizset = i;
					}
					if ( typeof cur !== "string" ) {
						if ( elem === cur ) {
							match = true;
							break;
						}

					} else if ( Sizzle.filter( cur, [elem] ).length > 0 ) {
						match = elem;
						break;
					}
				}

				elem = elem[dir];
			}

			checkSet[i] = match;
		}
	}
}

var contains = document.compareDocumentPosition ?  function(a, b){
	return a.compareDocumentPosition(b) & 16;
} : function(a, b){
	return a !== b && (a.contains ? a.contains(b) : true);
};

var isXML = function(elem){
	return elem.nodeType === 9 && elem.documentElement.nodeName !== "HTML" ||
		!!elem.ownerDocument && isXML( elem.ownerDocument );
};

var posProcess = function(selector, context){
	var tmpSet = [], later = "", match,
		root = context.nodeType ? [context] : context;

	// Position selectors must be done after the filter
	// And so must :not(positional) so we move all PSEUDOs to the end
	while ( (match = Expr.match.PSEUDO.exec( selector )) ) {
		later += match[0];
		selector = selector.replace( Expr.match.PSEUDO, "" );
	}

	selector = Expr.relative[selector] ? selector + "*" : selector;

	for ( var i = 0, l = root.length; i < l; i++ ) {
		Sizzle( selector, root[i], tmpSet );
	}

	return Sizzle.filter( later, tmpSet );
};

// EXPOSE
jQuery.find = Sizzle;
jQuery.filter = Sizzle.filter;
jQuery.expr = Sizzle.selectors;
jQuery.expr[":"] = jQuery.expr.filters;

Sizzle.selectors.filters.hidden = function(elem){
	return elem.offsetWidth === 0 || elem.offsetHeight === 0;
};

Sizzle.selectors.filters.visible = function(elem){
	return elem.offsetWidth > 0 || elem.offsetHeight > 0;
};

Sizzle.selectors.filters.animated = function(elem){
	return jQuery.grep(jQuery.timers, function(fn){
		return elem === fn.elem;
	}).length;
};

jQuery.multiFilter = function( expr, elems, not ) {
	if ( not ) {
		expr = ":not(" + expr + ")";
	}

	return Sizzle.matches(expr, elems);
};

jQuery.dir = function( elem, dir ){
	var matched = [], cur = elem[dir];
	while ( cur && cur != document ) {
		if ( cur.nodeType == 1 )
			matched.push( cur );
		cur = cur[dir];
	}
	return matched;
};

jQuery.nth = function(cur, result, dir, elem){
	result = result || 1;
	var num = 0;

	for ( ; cur; cur = cur[dir] )
		if ( cur.nodeType == 1 && ++num == result )
			break;

	return cur;
};

jQuery.sibling = function(n, elem){
	var r = [];

	for ( ; n; n = n.nextSibling ) {
		if ( n.nodeType == 1 && n != elem )
			r.push( n );
	}

	return r;
};

return;

window.Sizzle = Sizzle;

})();
/*
 * A number of helper functions used for managing events.
 * Many of the ideas behind this code originated from
 * Dean Edwards' addEvent library.
 */
jQuery.event = {

	// Bind an event to an element
	// Original by Dean Edwards
	add: function(elem, types, handler, data) {
		if ( elem.nodeType == 3 || elem.nodeType == 8 )
			return;

		// For whatever reason, IE has trouble passing the window object
		// around, causing it to be cloned in the process
		if ( elem.setInterval && elem != window )
			elem = window;

		// Make sure that the function being executed has a unique ID
		if ( !handler.guid )
			handler.guid = this.guid++;

		// if data is passed, bind to handler
		if ( data !== undefined ) {
			// Create temporary function pointer to original handler
			var fn = handler;

			// Create unique handler function, wrapped around original handler
			handler = this.proxy( fn );

			// Store data in unique handler
			handler.data = data;
		}

		// Init the element's event structure
		var events = jQuery.data(elem, "events") || jQuery.data(elem, "events", {}),
			handle = jQuery.data(elem, "handle") || jQuery.data(elem, "handle", function(){
				// Handle the second event of a trigger and when
				// an event is called after a page has unloaded
				return typeof jQuery !== "undefined" && !jQuery.event.triggered ?
					jQuery.event.handle.apply(arguments.callee.elem, arguments) :
					undefined;
			});
		// Add elem as a property of the handle function
		// This is to prevent a memory leak with non-native
		// event in IE.
		handle.elem = elem;

		// Handle multiple events separated by a space
		// jQuery(...).bind("mouseover mouseout", fn);
		jQuery.each(types.split(/\s+/), function(index, type) {
			// Namespaced event handlers
			var namespaces = type.split(".");
			type = namespaces.shift();
			handler.type = namespaces.slice().sort().join(".");

			// Get the current list of functions bound to this event
			var handlers = events[type];
			
			if ( jQuery.event.specialAll[type] )
				jQuery.event.specialAll[type].setup.call(elem, data, namespaces);

			// Init the event handler queue
			if (!handlers) {
				handlers = events[type] = {};

				// Check for a special event handler
				// Only use addEventListener/attachEvent if the special
				// events handler returns false
				if ( !jQuery.event.special[type] || jQuery.event.special[type].setup.call(elem, data, namespaces) === false ) {
					// Bind the global event handler to the element
					if (elem.addEventListener)
						elem.addEventListener(type, handle, false);
					else if (elem.attachEvent)
						elem.attachEvent("on" + type, handle);
				}
			}

			// Add the function to the element's handler list
			handlers[handler.guid] = handler;

			// Keep track of which events have been used, for global triggering
			jQuery.event.global[type] = true;
		});

		// Nullify elem to prevent memory leaks in IE
		elem = null;
	},

	guid: 1,
	global: {},

	// Detach an event or set of events from an element
	remove: function(elem, types, handler) {
		// don't do events on text and comment nodes
		if ( elem.nodeType == 3 || elem.nodeType == 8 )
			return;

		var events = jQuery.data(elem, "events"), ret, index;

		if ( events ) {
			// Unbind all events for the element
			if ( types === undefined || (typeof types === "string" && types.charAt(0) == ".") )
				for ( var type in events )
					this.remove( elem, type + (types || "") );
			else {
				// types is actually an event object here
				if ( types.type ) {
					handler = types.handler;
					types = types.type;
				}

				// Handle multiple events seperated by a space
				// jQuery(...).unbind("mouseover mouseout", fn);
				jQuery.each(types.split(/\s+/), function(index, type){
					// Namespaced event handlers
					var namespaces = type.split(".");
					type = namespaces.shift();
					var namespace = RegExp("(^|\\.)" + namespaces.slice().sort().join(".*\\.") + "(\\.|$)");

					if ( events[type] ) {
						// remove the given handler for the given type
						if ( handler )
							delete events[type][handler.guid];

						// remove all handlers for the given type
						else
							for ( var handle in events[type] )
								// Handle the removal of namespaced events
								if ( namespace.test(events[type][handle].type) )
									delete events[type][handle];
									
						if ( jQuery.event.specialAll[type] )
							jQuery.event.specialAll[type].teardown.call(elem, namespaces);

						// remove generic event handler if no more handlers exist
						for ( ret in events[type] ) break;
						if ( !ret ) {
							if ( !jQuery.event.special[type] || jQuery.event.special[type].teardown.call(elem, namespaces) === false ) {
								if (elem.removeEventListener)
									elem.removeEventListener(type, jQuery.data(elem, "handle"), false);
								else if (elem.detachEvent)
									elem.detachEvent("on" + type, jQuery.data(elem, "handle"));
							}
							ret = null;
							delete events[type];
						}
					}
				});
			}

			// Remove the expando if it's no longer used
			for ( ret in events ) break;
			if ( !ret ) {
				var handle = jQuery.data( elem, "handle" );
				if ( handle ) handle.elem = null;
				jQuery.removeData( elem, "events" );
				jQuery.removeData( elem, "handle" );
			}
		}
	},

	// bubbling is internal
	trigger: function( event, data, elem, bubbling ) {
		// Event object or event type
		var type = event.type || event;

		if( !bubbling ){
			event = typeof event === "object" ?
				// jQuery.Event object
				event[expando] ? event :
				// Object literal
				jQuery.extend( jQuery.Event(type), event ) :
				// Just the event type (string)
				jQuery.Event(type);

			if ( type.indexOf("!") >= 0 ) {
				event.type = type = type.slice(0, -1);
				event.exclusive = true;
			}

			// Handle a global trigger
			if ( !elem ) {
				// Don't bubble custom events when global (to avoid too much overhead)
				event.stopPropagation();
				// Only trigger if we've ever bound an event for it
				if ( this.global[type] )
					jQuery.each( jQuery.cache, function(){
						if ( this.events && this.events[type] )
							jQuery.event.trigger( event, data, this.handle.elem );
					});
			}

			// Handle triggering a single element

			// don't do events on text and comment nodes
			if ( !elem || elem.nodeType == 3 || elem.nodeType == 8 )
				return undefined;
			
			// Clean up in case it is reused
			event.result = undefined;
			event.target = elem;
			
			// Clone the incoming data, if any
			data = jQuery.makeArray(data);
			data.unshift( event );
		}

		event.currentTarget = elem;

		// Trigger the event, it is assumed that "handle" is a function
		var handle = jQuery.data(elem, "handle");
		if ( handle )
			handle.apply( elem, data );

		// Handle triggering native .onfoo handlers (and on links since we don't call .click() for links)
		if ( (!elem[type] || (jQuery.nodeName(elem, 'a') && type == "click")) && elem["on"+type] && elem["on"+type].apply( elem, data ) === false )
			event.result = false;

		// Trigger the native events (except for clicks on links)
		if ( !bubbling && elem[type] && !event.isDefaultPrevented() && !(jQuery.nodeName(elem, 'a') && type == "click") ) {
			this.triggered = true;
			try {
				elem[ type ]();
			// prevent IE from throwing an error for some hidden elements
			} catch (e) {}
		}

		this.triggered = false;

		if ( !event.isPropagationStopped() ) {
			var parent = elem.parentNode || elem.ownerDocument;
			if ( parent )
				jQuery.event.trigger(event, data, parent, true);
		}
	},

	handle: function(event) {
		// returned undefined or false
		var all, handlers;

		event = arguments[0] = jQuery.event.fix( event || window.event );
		event.currentTarget = this;
		
		// Namespaced event handlers
		var namespaces = event.type.split(".");
		event.type = namespaces.shift();

		// Cache this now, all = true means, any handler
		all = !namespaces.length && !event.exclusive;
		
		var namespace = RegExp("(^|\\.)" + namespaces.slice().sort().join(".*\\.") + "(\\.|$)");

		handlers = ( jQuery.data(this, "events") || {} )[event.type];

		for ( var j in handlers ) {
			var handler = handlers[j];

			// Filter the functions by class
			if ( all || namespace.test(handler.type) ) {
				// Pass in a reference to the handler function itself
				// So that we can later remove it
				event.handler = handler;
				event.data = handler.data;

				var ret = handler.apply(this, arguments);

				if( ret !== undefined ){
					event.result = ret;
					if ( ret === false ) {
						event.preventDefault();
						event.stopPropagation();
					}
				}

				if( event.isImmediatePropagationStopped() )
					break;

			}
		}
	},

	props: "altKey attrChange attrName bubbles button cancelable charCode clientX clientY ctrlKey currentTarget data detail eventPhase fromElement handler keyCode metaKey newValue originalTarget pageX pageY prevValue relatedNode relatedTarget screenX screenY shiftKey srcElement target toElement view wheelDelta which".split(" "),

	fix: function(event) {
		if ( event[expando] )
			return event;

		// store a copy of the original event object
		// and "clone" to set read-only properties
		var originalEvent = event;
		event = jQuery.Event( originalEvent );

		for ( var i = this.props.length, prop; i; ){
			prop = this.props[ --i ];
			event[ prop ] = originalEvent[ prop ];
		}

		// Fix target property, if necessary
		if ( !event.target )
			event.target = event.srcElement || document; // Fixes #1925 where srcElement might not be defined either

		// check if target is a textnode (safari)
		if ( event.target.nodeType == 3 )
			event.target = event.target.parentNode;

		// Add relatedTarget, if necessary
		if ( !event.relatedTarget && event.fromElement )
			event.relatedTarget = event.fromElement == event.target ? event.toElement : event.fromElement;

		// Calculate pageX/Y if missing and clientX/Y available
		if ( event.pageX == null && event.clientX != null ) {
			var doc = document.documentElement, body = document.body;
			event.pageX = event.clientX + (doc && doc.scrollLeft || body && body.scrollLeft || 0) - (doc.clientLeft || 0);
			event.pageY = event.clientY + (doc && doc.scrollTop || body && body.scrollTop || 0) - (doc.clientTop || 0);
		}

		// Add which for key events
		if ( !event.which && ((event.charCode || event.charCode === 0) ? event.charCode : event.keyCode) )
			event.which = event.charCode || event.keyCode;

		// Add metaKey to non-Mac browsers (use ctrl for PC's and Meta for Macs)
		if ( !event.metaKey && event.ctrlKey )
			event.metaKey = event.ctrlKey;

		// Add which for click: 1 == left; 2 == middle; 3 == right
		// Note: button is not normalized, so don't use it
		if ( !event.which && event.button )
			event.which = (event.button & 1 ? 1 : ( event.button & 2 ? 3 : ( event.button & 4 ? 2 : 0 ) ));

		return event;
	},

	proxy: function( fn, proxy ){
		proxy = proxy || function(){ return fn.apply(this, arguments); };
		// Set the guid of unique handler to the same of original handler, so it can be removed
		proxy.guid = fn.guid = fn.guid || proxy.guid || this.guid++;
		// So proxy can be declared as an argument
		return proxy;
	},

	special: {
		ready: {
			// Make sure the ready event is setup
			setup: bindReady,
			teardown: function() {}
		}
	},
	
	specialAll: {
		live: {
			setup: function( selector, namespaces ){
				jQuery.event.add( this, namespaces[0], liveHandler );
			},
			teardown:  function( namespaces ){
				if ( namespaces.length ) {
					var remove = 0, name = RegExp("(^|\\.)" + namespaces[0] + "(\\.|$)");
					
					jQuery.each( (jQuery.data(this, "events").live || {}), function(){
						if ( name.test(this.type) )
							remove++;
					});
					
					if ( remove < 1 )
						jQuery.event.remove( this, namespaces[0], liveHandler );
				}
			}
		}
	}
};

jQuery.Event = function( src ){
	// Allow instantiation without the 'new' keyword
	if( !this.preventDefault )
		return new jQuery.Event(src);
	
	// Event object
	if( src && src.type ){
		this.originalEvent = src;
		this.type = src.type;
	// Event type
	}else
		this.type = src;

	// timeStamp is buggy for some events on Firefox(#3843)
	// So we won't rely on the native value
	this.timeStamp = now();
	
	// Mark it as fixed
	this[expando] = true;
};

function returnFalse(){
	return false;
}
function returnTrue(){
	return true;
}

// jQuery.Event is based on DOM3 Events as specified by the ECMAScript Language Binding
// http://www.w3.org/TR/2003/WD-DOM-Level-3-Events-20030331/ecma-script-binding.html
jQuery.Event.prototype = {
	preventDefault: function() {
		this.isDefaultPrevented = returnTrue;

		var e = this.originalEvent;
		if( !e )
			return;
		// if preventDefault exists run it on the original event
		if (e.preventDefault)
			e.preventDefault();
		// otherwise set the returnValue property of the original event to false (IE)
		e.returnValue = false;
	},
	stopPropagation: function() {
		this.isPropagationStopped = returnTrue;

		var e = this.originalEvent;
		if( !e )
			return;
		// if stopPropagation exists run it on the original event
		if (e.stopPropagation)
			e.stopPropagation();
		// otherwise set the cancelBubble property of the original event to true (IE)
		e.cancelBubble = true;
	},
	stopImmediatePropagation:function(){
		this.isImmediatePropagationStopped = returnTrue;
		this.stopPropagation();
	},
	isDefaultPrevented: returnFalse,
	isPropagationStopped: returnFalse,
	isImmediatePropagationStopped: returnFalse
};
// Checks if an event happened on an element within another element
// Used in jQuery.event.special.mouseenter and mouseleave handlers
var withinElement = function(event) {
	// Check if mouse(over|out) are still within the same parent element
	var parent = event.relatedTarget;
	// Traverse up the tree
	while ( parent && parent != this )
		try { parent = parent.parentNode; }
		catch(e) { parent = this; }
	
	if( parent != this ){
		// set the correct event type
		event.type = event.data;
		// handle event if we actually just moused on to a non sub-element
		jQuery.event.handle.apply( this, arguments );
	}
};
	
jQuery.each({ 
	mouseover: 'mouseenter', 
	mouseout: 'mouseleave'
}, function( orig, fix ){
	jQuery.event.special[ fix ] = {
		setup: function(){
			jQuery.event.add( this, orig, withinElement, fix );
		},
		teardown: function(){
			jQuery.event.remove( this, orig, withinElement );
		}
	};			   
});

jQuery.fn.extend({
	bind: function( type, data, fn ) {
		return type == "unload" ? this.one(type, data, fn) : this.each(function(){
			jQuery.event.add( this, type, fn || data, fn && data );
		});
	},

	one: function( type, data, fn ) {
		var one = jQuery.event.proxy( fn || data, function(event) {
			jQuery(this).unbind(event, one);
			return (fn || data).apply( this, arguments );
		});
		return this.each(function(){
			jQuery.event.add( this, type, one, fn && data);
		});
	},

	unbind: function( type, fn ) {
		return this.each(function(){
			jQuery.event.remove( this, type, fn );
		});
	},

	trigger: function( type, data ) {
		return this.each(function(){
			jQuery.event.trigger( type, data, this );
		});
	},

	triggerHandler: function( type, data ) {
		if( this[0] ){
			var event = jQuery.Event(type);
			event.preventDefault();
			event.stopPropagation();
			jQuery.event.trigger( event, data, this[0] );
			return event.result;
		}		
	},

	toggle: function( fn ) {
		// Save reference to arguments for access in closure
		var args = arguments, i = 1;

		// link all the functions, so any of them can unbind this click handler
		while( i < args.length )
			jQuery.event.proxy( fn, args[i++] );

		return this.click( jQuery.event.proxy( fn, function(event) {
			// Figure out which function to execute
			this.lastToggle = ( this.lastToggle || 0 ) % i;

			// Make sure that clicks stop
			event.preventDefault();

			// and execute the function
			return args[ this.lastToggle++ ].apply( this, arguments ) || false;
		}));
	},

	hover: function(fnOver, fnOut) {
		return this.mouseenter(fnOver).mouseleave(fnOut);
	},

	ready: function(fn) {
		// Attach the listeners
		bindReady();

		// If the DOM is already ready
		if ( jQuery.isReady )
			// Execute the function immediately
			fn.call( document, jQuery );

		// Otherwise, remember the function for later
		else
			// Add the function to the wait list
			jQuery.readyList.push( fn );

		return this;
	},
	
	live: function( type, fn ){
		var proxy = jQuery.event.proxy( fn );
		proxy.guid += this.selector + type;

		jQuery(document).bind( liveConvert(type, this.selector), this.selector, proxy );

		return this;
	},
	
	die: function( type, fn ){
		jQuery(document).unbind( liveConvert(type, this.selector), fn ? { guid: fn.guid + this.selector + type } : null );
		return this;
	}
});

function liveHandler( event ){
	var check = RegExp("(^|\\.)" + event.type + "(\\.|$)"),
		stop = true,
		elems = [];

	jQuery.each(jQuery.data(this, "events").live || [], function(i, fn){
		if ( check.test(fn.type) ) {
			var elem = jQuery(event.target).closest(fn.data)[0];
			if ( elem )
				elems.push({ elem: elem, fn: fn });
		}
	});

	elems.sort(function(a,b) {
		return jQuery.data(a.elem, "closest") - jQuery.data(b.elem, "closest");
	});
	
	jQuery.each(elems, function(){
		if ( this.fn.call(this.elem, event, this.fn.data) === false )
			return (stop = false);
	});

	return stop;
}

function liveConvert(type, selector){
	return ["live", type, selector.replace(/\./g, "`").replace(/ /g, "|")].join(".");
}

jQuery.extend({
	isReady: false,
	readyList: [],
	// Handle when the DOM is ready
	ready: function() {
		// Make sure that the DOM is not already loaded
		if ( !jQuery.isReady ) {
			// Remember that the DOM is ready
			jQuery.isReady = true;

			// If there are functions bound, to execute
			if ( jQuery.readyList ) {
				// Execute all of them
				jQuery.each( jQuery.readyList, function(){
					this.call( document, jQuery );
				});

				// Reset the list of functions
				jQuery.readyList = null;
			}

			// Trigger any bound ready events
			jQuery(document).triggerHandler("ready");
		}
	}
});

var readyBound = false;

function bindReady(){
	if ( readyBound ) return;
	readyBound = true;

	// Mozilla, Opera and webkit nightlies currently support this event
	if ( document.addEventListener ) {
		// Use the handy event callback
		document.addEventListener( "DOMContentLoaded", function(){
			document.removeEventListener( "DOMContentLoaded", arguments.callee, false );
			jQuery.ready();
		}, false );

	// If IE event model is used
	} else if ( document.attachEvent ) {
		// ensure firing before onload,
		// maybe late but safe also for iframes
		document.attachEvent("onreadystatechange", function(){
			if ( document.readyState === "complete" ) {
				document.detachEvent( "onreadystatechange", arguments.callee );
				jQuery.ready();
			}
		});

		// If IE and not an iframe
		// continually check to see if the document is ready
		if ( document.documentElement.doScroll && window == window.top ) (function(){
			if ( jQuery.isReady ) return;

			try {
				// If IE is used, use the trick by Diego Perini
				// http://javascript.nwbox.com/IEContentLoaded/
				document.documentElement.doScroll("left");
			} catch( error ) {
				setTimeout( arguments.callee, 0 );
				return;
			}

			// and execute any waiting functions
			jQuery.ready();
		})();
	}

	// A fallback to window.onload, that will always work
	jQuery.event.add( window, "load", jQuery.ready );
}

jQuery.each( ("blur,focus,load,resize,scroll,unload,click,dblclick," +
	"mousedown,mouseup,mousemove,mouseover,mouseout,mouseenter,mouseleave," +
	"change,select,submit,keydown,keypress,keyup,error").split(","), function(i, name){

	// Handle event binding
	jQuery.fn[name] = function(fn){
		return fn ? this.bind(name, fn) : this.trigger(name);
	};
});

// Prevent memory leaks in IE
// And prevent errors on refresh with events like mouseover in other browsers
// Window isn't included so as not to unbind existing unload events
jQuery( window ).bind( 'unload', function(){ 
	for ( var id in jQuery.cache )
		// Skip the window
		if ( id != 1 && jQuery.cache[ id ].handle )
			jQuery.event.remove( jQuery.cache[ id ].handle.elem );
}); 
(function(){

	jQuery.support = {};

	var root = document.documentElement,
		script = document.createElement("script"),
		div = document.createElement("div"),
		id = "script" + (new Date).getTime();

	div.style.display = "none";
	div.innerHTML = '   <link/><table></table><a href="/a" style="color:red;float:left;opacity:.5;">a</a><select><option>text</option></select><object><param/></object>';

	var all = div.getElementsByTagName("*"),
		a = div.getElementsByTagName("a")[0];

	// Can't get basic test support
	if ( !all || !all.length || !a ) {
		return;
	}

	jQuery.support = {
		// IE strips leading whitespace when .innerHTML is used
		leadingWhitespace: div.firstChild.nodeType == 3,
		
		// Make sure that tbody elements aren't automatically inserted
		// IE will insert them into empty tables
		tbody: !div.getElementsByTagName("tbody").length,
		
		// Make sure that you can get all elements in an <object> element
		// IE 7 always returns no results
		objectAll: !!div.getElementsByTagName("object")[0]
			.getElementsByTagName("*").length,
		
		// Make sure that link elements get serialized correctly by innerHTML
		// This requires a wrapper element in IE
		htmlSerialize: !!div.getElementsByTagName("link").length,
		
		// Get the style information from getAttribute
		// (IE uses .cssText insted)
		style: /red/.test( a.getAttribute("style") ),
		
		// Make sure that URLs aren't manipulated
		// (IE normalizes it by default)
		hrefNormalized: a.getAttribute("href") === "/a",
		
		// Make sure that element opacity exists
		// (IE uses filter instead)
		opacity: a.style.opacity === "0.5",
		
		// Verify style float existence
		// (IE uses styleFloat instead of cssFloat)
		cssFloat: !!a.style.cssFloat,

		// Will be defined later
		scriptEval: false,
		noCloneEvent: true,
		boxModel: null
	};
	
	script.type = "text/javascript";
	try {
		script.appendChild( document.createTextNode( "window." + id + "=1;" ) );
	} catch(e){}

	root.insertBefore( script, root.firstChild );
	
	// Make sure that the execution of code works by injecting a script
	// tag with appendChild/createTextNode
	// (IE doesn't support this, fails, and uses .text instead)
	if ( window[ id ] ) {
		jQuery.support.scriptEval = true;
		delete window[ id ];
	}

	root.removeChild( script );

	if ( div.attachEvent && div.fireEvent ) {
		div.attachEvent("onclick", function(){
			// Cloning a node shouldn't copy over any
			// bound event handlers (IE does this)
			jQuery.support.noCloneEvent = false;
			div.detachEvent("onclick", arguments.callee);
		});
		div.cloneNode(true).fireEvent("onclick");
	}

	// Figure out if the W3C box model works as expected
	// document.body must exist before we can do this
	jQuery(function(){
		var div = document.createElement("div");
		div.style.width = div.style.paddingLeft = "1px";

		document.body.appendChild( div );
		jQuery.boxModel = jQuery.support.boxModel = div.offsetWidth === 2;
		document.body.removeChild( div ).style.display = 'none';
	});
})();

var styleFloat = jQuery.support.cssFloat ? "cssFloat" : "styleFloat";

jQuery.props = {
	"for": "htmlFor",
	"class": "className",
	"float": styleFloat,
	cssFloat: styleFloat,
	styleFloat: styleFloat,
	readonly: "readOnly",
	maxlength: "maxLength",
	cellspacing: "cellSpacing",
	rowspan: "rowSpan",
	tabindex: "tabIndex"
};
jQuery.fn.extend({
	// Keep a copy of the old load
	_load: jQuery.fn.load,

	load: function( url, params, callback ) {
		if ( typeof url !== "string" )
			return this._load( url );

		var off = url.indexOf(" ");
		if ( off >= 0 ) {
			var selector = url.slice(off, url.length);
			url = url.slice(0, off);
		}

		// Default to a GET request
		var type = "GET";

		// If the second parameter was provided
		if ( params )
			// If it's a function
			if ( jQuery.isFunction( params ) ) {
				// We assume that it's the callback
				callback = params;
				params = null;

			// Otherwise, build a param string
			} else if( typeof params === "object" ) {
				params = jQuery.param( params );
				type = "POST";
			}

		var self = this;

		// Request the remote document
		jQuery.ajax({
			url: url,
			type: type,
			dataType: "html",
			data: params,
			complete: function(res, status){
				// If successful, inject the HTML into all the matched elements
				if ( status == "success" || status == "notmodified" )
					// See if a selector was specified
					self.html( selector ?
						// Create a dummy div to hold the results
						jQuery("<div/>")
							// inject the contents of the document in, removing the scripts
							// to avoid any 'Permission Denied' errors in IE
							.append(res.responseText.replace(/<script(.|\s)*?\/script>/g, ""))

							// Locate the specified elements
							.find(selector) :

						// If not, just inject the full result
						res.responseText );

				if( callback )
					self.each( callback, [res.responseText, status, res] );
			}
		});
		return this;
	},

	serialize: function() {
		return jQuery.param(this.serializeArray());
	},
	serializeArray: function() {
		return this.map(function(){
			return this.elements ? jQuery.makeArray(this.elements) : this;
		})
		.filter(function(){
			return this.name && !this.disabled &&
				(this.checked || /select|textarea/i.test(this.nodeName) ||
					/text|hidden|password|search/i.test(this.type));
		})
		.map(function(i, elem){
			var val = jQuery(this).val();
			return val == null ? null :
				jQuery.isArray(val) ?
					jQuery.map( val, function(val, i){
						return {name: elem.name, value: val};
					}) :
					{name: elem.name, value: val};
		}).get();
	}
});

// Attach a bunch of functions for handling common AJAX events
jQuery.each( "ajaxStart,ajaxStop,ajaxComplete,ajaxError,ajaxSuccess,ajaxSend".split(","), function(i,o){
	jQuery.fn[o] = function(f){
		return this.bind(o, f);
	};
});

var jsc = now();

jQuery.extend({
  
	get: function( url, data, callback, type ) {
		// shift arguments if data argument was ommited
		if ( jQuery.isFunction( data ) ) {
			callback = data;
			data = null;
		}

		return jQuery.ajax({
			type: "GET",
			url: url,
			data: data,
			success: callback,
			dataType: type
		});
	},

	getScript: function( url, callback ) {
		return jQuery.get(url, null, callback, "script");
	},

	getJSON: function( url, data, callback ) {
		return jQuery.get(url, data, callback, "json");
	},

	post: function( url, data, callback, type ) {
		if ( jQuery.isFunction( data ) ) {
			callback = data;
			data = {};
		}

		return jQuery.ajax({
			type: "POST",
			url: url,
			data: data,
			success: callback,
			dataType: type
		});
	},

	ajaxSetup: function( settings ) {
		jQuery.extend( jQuery.ajaxSettings, settings );
	},

	ajaxSettings: {
		url: location.href,
		global: true,
		type: "GET",
		contentType: "application/x-www-form-urlencoded",
		processData: true,
		async: true,
		/*
		timeout: 0,
		data: null,
		username: null,
		password: null,
		*/
		// Create the request object; Microsoft failed to properly
		// implement the XMLHttpRequest in IE7, so we use the ActiveXObject when it is available
		// This function can be overriden by calling jQuery.ajaxSetup
		xhr:function(){
			return window.ActiveXObject ? new ActiveXObject("Microsoft.XMLHTTP") : new XMLHttpRequest();
		},
		accepts: {
			xml: "application/xml, text/xml",
			html: "text/html",
			script: "text/javascript, application/javascript",
			json: "application/json, text/javascript",
			text: "text/plain",
			_default: "*/*"
		}
	},

	// Last-Modified header cache for next request
	lastModified: {},

	ajax: function( s ) {
		// Extend the settings, but re-extend 's' so that it can be
		// checked again later (in the test suite, specifically)
		s = jQuery.extend(true, s, jQuery.extend(true, {}, jQuery.ajaxSettings, s));

		var jsonp, jsre = /=\?(&|$)/g, status, data,
			type = s.type.toUpperCase();

		// convert data if not already a string
		if ( s.data && s.processData && typeof s.data !== "string" )
			s.data = jQuery.param(s.data);

		// Handle JSONP Parameter Callbacks
		if ( s.dataType == "jsonp" ) {
			if ( type == "GET" ) {
				if ( !s.url.match(jsre) )
					s.url += (s.url.match(/\?/) ? "&" : "?") + (s.jsonp || "callback") + "=?";
			} else if ( !s.data || !s.data.match(jsre) )
				s.data = (s.data ? s.data + "&" : "") + (s.jsonp || "callback") + "=?";
			s.dataType = "json";
		}

		// Build temporary JSONP function
		if ( s.dataType == "json" && (s.data && s.data.match(jsre) || s.url.match(jsre)) ) {
			jsonp = "jsonp" + jsc++;

			// Replace the =? sequence both in the query string and the data
			if ( s.data )
				s.data = (s.data + "").replace(jsre, "=" + jsonp + "$1");
			s.url = s.url.replace(jsre, "=" + jsonp + "$1");

			// We need to make sure
			// that a JSONP style response is executed properly
			s.dataType = "script";

			// Handle JSONP-style loading
			window[ jsonp ] = function(tmp){
				data = tmp;
				success();
				complete();
				// Garbage collect
				window[ jsonp ] = undefined;
				try{ delete window[ jsonp ]; } catch(e){}
				if ( head )
					head.removeChild( script );
			};
		}

		if ( s.dataType == "script" && s.cache == null )
			s.cache = false;

		if ( s.cache === false && type == "GET" ) {
			var ts = now();
			// try replacing _= if it is there
			var ret = s.url.replace(/(\?|&)_=.*?(&|$)/, "$1_=" + ts + "$2");
			// if nothing was replaced, add timestamp to the end
			s.url = ret + ((ret == s.url) ? (s.url.match(/\?/) ? "&" : "?") + "_=" + ts : "");
		}

		// If data is available, append data to url for get requests
		if ( s.data && type == "GET" ) {
			s.url += (s.url.match(/\?/) ? "&" : "?") + s.data;

			// IE likes to send both get and post data, prevent this
			s.data = null;
		}

		// Watch for a new set of requests
		if ( s.global && ! jQuery.active++ )
			jQuery.event.trigger( "ajaxStart" );

		// Matches an absolute URL, and saves the domain
		var parts = /^(\w+:)?\/\/([^\/?#]+)/.exec( s.url );

		// If we're requesting a remote document
		// and trying to load JSON or Script with a GET
		if ( s.dataType == "script" && type == "GET" && parts
			&& ( parts[1] && parts[1] != location.protocol || parts[2] != location.host )){

			var head = document.getElementsByTagName("head")[0];
			var script = document.createElement("script");
			script.src = s.url;
			if (s.scriptCharset)
				script.charset = s.scriptCharset;

			// Handle Script loading
			if ( !jsonp ) {
				var done = false;

				// Attach handlers for all browsers
				script.onload = script.onreadystatechange = function(){
					if ( !done && (!this.readyState ||
							this.readyState == "loaded" || this.readyState == "complete") ) {
						done = true;
						success();
						complete();

						// Handle memory leak in IE
						script.onload = script.onreadystatechange = null;
						head.removeChild( script );
					}
				};
			}

			head.appendChild(script);

			// We handle everything using the script element injection
			return undefined;
		}

		var requestDone = false;

		// Create the request object
		var xhr = s.xhr();

		// Open the socket
		// Passing null username, generates a login popup on Opera (#2865)
		if( s.username )
			xhr.open(type, s.url, s.async, s.username, s.password);
		else
			xhr.open(type, s.url, s.async);

		// Need an extra try/catch for cross domain requests in Firefox 3
		try {
			// Set the correct header, if data is being sent
			if ( s.data )
				xhr.setRequestHeader("Content-Type", s.contentType);

			// Set the If-Modified-Since header, if ifModified mode.
			if ( s.ifModified )
				xhr.setRequestHeader("If-Modified-Since",
					jQuery.lastModified[s.url] || "Thu, 01 Jan 1970 00:00:00 GMT" );

			// Set header so the called script knows that it's an XMLHttpRequest
			xhr.setRequestHeader("X-Requested-With", "XMLHttpRequest");

			// Set the Accepts header for the server, depending on the dataType
			xhr.setRequestHeader("Accept", s.dataType && s.accepts[ s.dataType ] ?
				s.accepts[ s.dataType ] + ", */*" :
				s.accepts._default );
		} catch(e){}

		// Allow custom headers/mimetypes and early abort
		if ( s.beforeSend && s.beforeSend(xhr, s) === false ) {
			// Handle the global AJAX counter
			if ( s.global && ! --jQuery.active )
				jQuery.event.trigger( "ajaxStop" );
			// close opended socket
			xhr.abort();
			return false;
		}

		if ( s.global )
			jQuery.event.trigger("ajaxSend", [xhr, s]);

		// Wait for a response to come back
		var onreadystatechange = function(isTimeout){
			// The request was aborted, clear the interval and decrement jQuery.active
			if (xhr.readyState == 0) {
				if (ival) {
					// clear poll interval
					clearInterval(ival);
					ival = null;
					// Handle the global AJAX counter
					if ( s.global && ! --jQuery.active )
						jQuery.event.trigger( "ajaxStop" );
				}
			// The transfer is complete and the data is available, or the request timed out
			} else if ( !requestDone && xhr && (xhr.readyState == 4 || isTimeout == "timeout") ) {
				requestDone = true;

				// clear poll interval
				if (ival) {
					clearInterval(ival);
					ival = null;
				}

				status = isTimeout == "timeout" ? "timeout" :
					!jQuery.httpSuccess( xhr ) ? "error" :
					s.ifModified && jQuery.httpNotModified( xhr, s.url ) ? "notmodified" :
					"success";

				if ( status == "success" ) {
					// Watch for, and catch, XML document parse errors
					try {
						// process the data (runs the xml through httpData regardless of callback)
						data = jQuery.httpData( xhr, s.dataType, s );
					} catch(e) {
						status = "parsererror";
					}
				}

				// Make sure that the request was successful or notmodified
				if ( status == "success" ) {
					// Cache Last-Modified header, if ifModified mode.
					var modRes;
					try {
						modRes = xhr.getResponseHeader("Last-Modified");
					} catch(e) {} // swallow exception thrown by FF if header is not available

					if ( s.ifModified && modRes )
						jQuery.lastModified[s.url] = modRes;

					// JSONP handles its own success callback
					if ( !jsonp )
						success();
				} else
					jQuery.handleError(s, xhr, status);

				// Fire the complete handlers
				complete();

				if ( isTimeout )
					xhr.abort();

				// Stop memory leaks
				if ( s.async )
					xhr = null;
			}
		};

		if ( s.async ) {
			// don't attach the handler to the request, just poll it instead
			var ival = setInterval(onreadystatechange, 13);

			// Timeout checker
			if ( s.timeout > 0 )
				setTimeout(function(){
					// Check to see if the request is still happening
					if ( xhr && !requestDone )
						onreadystatechange( "timeout" );
				}, s.timeout);
		}

		// Send the data
		try {
			xhr.send(s.data);
		} catch(e) {
			jQuery.handleError(s, xhr, null, e);
		}

		// firefox 1.5 doesn't fire statechange for sync requests
		if ( !s.async )
			onreadystatechange();

		function success(){
			// If a local callback was specified, fire it and pass it the data
			if ( s.success )
				s.success( data, status );

			// Fire the global callback
			if ( s.global )
				jQuery.event.trigger( "ajaxSuccess", [xhr, s] );
		}

		function complete(){
			// Process result
			if ( s.complete )
				s.complete(xhr, status);

			// The request was completed
			if ( s.global )
				jQuery.event.trigger( "ajaxComplete", [xhr, s] );

			// Handle the global AJAX counter
			if ( s.global && ! --jQuery.active )
				jQuery.event.trigger( "ajaxStop" );
		}

		// return XMLHttpRequest to allow aborting the request etc.
		return xhr;
	},

	handleError: function( s, xhr, status, e ) {
		// If a local callback was specified, fire it
		if ( s.error ) s.error( xhr, status, e );

		// Fire the global callback
		if ( s.global )
			jQuery.event.trigger( "ajaxError", [xhr, s, e] );
	},

	// Counter for holding the number of active queries
	active: 0,

	// Determines if an XMLHttpRequest was successful or not
	httpSuccess: function( xhr ) {
		try {
			// IE error sometimes returns 1223 when it should be 204 so treat it as success, see #1450
			return !xhr.status && location.protocol == "file:" ||
				( xhr.status >= 200 && xhr.status < 300 ) || xhr.status == 304 || xhr.status == 1223;
		} catch(e){}
		return false;
	},

	// Determines if an XMLHttpRequest returns NotModified
	httpNotModified: function( xhr, url ) {
		try {
			var xhrRes = xhr.getResponseHeader("Last-Modified");

			// Firefox always returns 200. check Last-Modified date
			return xhr.status == 304 || xhrRes == jQuery.lastModified[url];
		} catch(e){}
		return false;
	},

	httpData: function( xhr, type, s ) {
		var ct = xhr.getResponseHeader("content-type"),
			xml = type == "xml" || !type && ct && ct.indexOf("xml") >= 0,
			data = xml ? xhr.responseXML : xhr.responseText;

		if ( xml && data.documentElement.tagName == "parsererror" )
			throw "parsererror";
			
		// Allow a pre-filtering function to sanitize the response
		// s != null is checked to keep backwards compatibility
		if( s && s.dataFilter )
			data = s.dataFilter( data, type );

		// The filter can actually parse the response
		if( typeof data === "string" ){

			// If the type is "script", eval it in global context
			if ( type == "script" )
				jQuery.globalEval( data );

			// Get the JavaScript object, if JSON is used.
			if ( type == "json" )
				data = window["eval"]("(" + data + ")");
		}
		
		return data;
	},

	// Serialize an array of form elements or a set of
	// key/values into a query string
	param: function( a ) {
		var s = [ ];

		function add( key, value ){
			s[ s.length ] = encodeURIComponent(key) + '=' + encodeURIComponent(value);
		};

		// If an array was passed in, assume that it is an array
		// of form elements
		if ( jQuery.isArray(a) || a.jquery )
			// Serialize the form elements
			jQuery.each( a, function(){
				add( this.name, this.value );
			});

		// Otherwise, assume that it's an object of key/value pairs
		else
			// Serialize the key/values
			for ( var j in a )
				// If the value is an array then the key names need to be repeated
				if ( jQuery.isArray(a[j]) )
					jQuery.each( a[j], function(){
						add( j, this );
					});
				else
					add( j, jQuery.isFunction(a[j]) ? a[j]() : a[j] );

		// Return the resulting serialization
		return s.join("&").replace(/%20/g, "+");
	}

});
var elemdisplay = {},
	timerId,
	fxAttrs = [
		// height animations
		[ "height", "marginTop", "marginBottom", "paddingTop", "paddingBottom" ],
		// width animations
		[ "width", "marginLeft", "marginRight", "paddingLeft", "paddingRight" ],
		// opacity animations
		[ "opacity" ]
	];

function genFx( type, num ){
	var obj = {};
	jQuery.each( fxAttrs.concat.apply([], fxAttrs.slice(0,num)), function(){
		obj[ this ] = type;
	});
	return obj;
}

jQuery.fn.extend({
	show: function(speed,callback){
		if ( speed ) {
			return this.animate( genFx("show", 3), speed, callback);
		} else {
			for ( var i = 0, l = this.length; i < l; i++ ){
				var old = jQuery.data(this[i], "olddisplay");
				
				this[i].style.display = old || "";
				
				if ( jQuery.css(this[i], "display") === "none" ) {
					var tagName = this[i].tagName, display;
					
					if ( elemdisplay[ tagName ] ) {
						display = elemdisplay[ tagName ];
					} else {
						var elem = jQuery("<" + tagName + " />").appendTo("body");
						
						display = elem.css("display");
						if ( display === "none" )
							display = "block";
						
						elem.remove();
						
						elemdisplay[ tagName ] = display;
					}
					
					jQuery.data(this[i], "olddisplay", display);
				}
			}

			// Set the display of the elements in a second loop
			// to avoid the constant reflow
			for ( var i = 0, l = this.length; i < l; i++ ){
				this[i].style.display = jQuery.data(this[i], "olddisplay") || "";
			}
			
			return this;
		}
	},

	hide: function(speed,callback){
		if ( speed ) {
			return this.animate( genFx("hide", 3), speed, callback);
		} else {
			for ( var i = 0, l = this.length; i < l; i++ ){
				var old = jQuery.data(this[i], "olddisplay");
				if ( !old && old !== "none" )
					jQuery.data(this[i], "olddisplay", jQuery.css(this[i], "display"));
			}

			// Set the display of the elements in a second loop
			// to avoid the constant reflow
			for ( var i = 0, l = this.length; i < l; i++ ){
				this[i].style.display = "none";
			}

			return this;
		}
	},

	// Save the old toggle function
	_toggle: jQuery.fn.toggle,

	toggle: function( fn, fn2 ){
		var bool = typeof fn === "boolean";

		return jQuery.isFunction(fn) && jQuery.isFunction(fn2) ?
			this._toggle.apply( this, arguments ) :
			fn == null || bool ?
				this.each(function(){
					var state = bool ? fn : jQuery(this).is(":hidden");
					jQuery(this)[ state ? "show" : "hide" ]();
				}) :
				this.animate(genFx("toggle", 3), fn, fn2);
	},

	fadeTo: function(speed,to,callback){
		return this.animate({opacity: to}, speed, callback);
	},

	animate: function( prop, speed, easing, callback ) {
		var optall = jQuery.speed(speed, easing, callback);

		return this[ optall.queue === false ? "each" : "queue" ](function(){
		
			var opt = jQuery.extend({}, optall), p,
				hidden = this.nodeType == 1 && jQuery(this).is(":hidden"),
				self = this;
	
			for ( p in prop ) {
				if ( prop[p] == "hide" && hidden || prop[p] == "show" && !hidden )
					return opt.complete.call(this);

				if ( ( p == "height" || p == "width" ) && this.style ) {
					// Store display property
					opt.display = jQuery.css(this, "display");

					// Make sure that nothing sneaks out
					opt.overflow = this.style.overflow;
				}
			}

			if ( opt.overflow != null )
				this.style.overflow = "hidden";

			opt.curAnim = jQuery.extend({}, prop);

			jQuery.each( prop, function(name, val){
				var e = new jQuery.fx( self, opt, name );

				if ( /toggle|show|hide/.test(val) )
					e[ val == "toggle" ? hidden ? "show" : "hide" : val ]( prop );
				else {
					var parts = val.toString().match(/^([+-]=)?([\d+-.]+)(.*)$/),
						start = e.cur(true) || 0;

					if ( parts ) {
						var end = parseFloat(parts[2]),
							unit = parts[3] || "px";

						// We need to compute starting value
						if ( unit != "px" ) {
							self.style[ name ] = (end || 1) + unit;
							start = ((end || 1) / e.cur(true)) * start;
							self.style[ name ] = start + unit;
						}

						// If a +=/-= token was provided, we're doing a relative animation
						if ( parts[1] )
							end = ((parts[1] == "-=" ? -1 : 1) * end) + start;

						e.custom( start, end, unit );
					} else
						e.custom( start, val, "" );
				}
			});

			// For JS strict compliance
			return true;
		});
	},

	stop: function(clearQueue, gotoEnd){
		var timers = jQuery.timers;

		if (clearQueue)
			this.queue([]);

		this.each(function(){
			// go in reverse order so anything added to the queue during the loop is ignored
			for ( var i = timers.length - 1; i >= 0; i-- )
				if ( timers[i].elem == this ) {
					if (gotoEnd)
						// force the next step to be the last
						timers[i](true);
					timers.splice(i, 1);
				}
		});

		// start the next in the queue if the last step wasn't forced
		if (!gotoEnd)
			this.dequeue();

		return this;
	}

});

// Generate shortcuts for custom animations
jQuery.each({
	slideDown: genFx("show", 1),
	slideUp: genFx("hide", 1),
	slideToggle: genFx("toggle", 1),
	fadeIn: { opacity: "show" },
	fadeOut: { opacity: "hide" }
}, function( name, props ){
	jQuery.fn[ name ] = function( speed, callback ){
		return this.animate( props, speed, callback );
	};
});

jQuery.extend({

	speed: function(speed, easing, fn) {
		var opt = typeof speed === "object" ? speed : {
			complete: fn || !fn && easing ||
				jQuery.isFunction( speed ) && speed,
			duration: speed,
			easing: fn && easing || easing && !jQuery.isFunction(easing) && easing
		};

		opt.duration = jQuery.fx.off ? 0 : typeof opt.duration === "number" ? opt.duration :
			jQuery.fx.speeds[opt.duration] || jQuery.fx.speeds._default;

		// Queueing
		opt.old = opt.complete;
		opt.complete = function(){
			if ( opt.queue !== false )
				jQuery(this).dequeue();
			if ( jQuery.isFunction( opt.old ) )
				opt.old.call( this );
		};

		return opt;
	},

	easing: {
		linear: function( p, n, firstNum, diff ) {
			return firstNum + diff * p;
		},
		swing: function( p, n, firstNum, diff ) {
			return ((-Math.cos(p*Math.PI)/2) + 0.5) * diff + firstNum;
		}
	},

	timers: [],

	fx: function( elem, options, prop ){
		this.options = options;
		this.elem = elem;
		this.prop = prop;

		if ( !options.orig )
			options.orig = {};
	}

});

jQuery.fx.prototype = {

	// Simple function for setting a style value
	update: function(){
		if ( this.options.step )
			this.options.step.call( this.elem, this.now, this );

		(jQuery.fx.step[this.prop] || jQuery.fx.step._default)( this );

		// Set display property to block for height/width animations
		if ( ( this.prop == "height" || this.prop == "width" ) && this.elem.style )
			this.elem.style.display = "block";
	},

	// Get the current size
	cur: function(force){
		if ( this.elem[this.prop] != null && (!this.elem.style || this.elem.style[this.prop] == null) )
			return this.elem[ this.prop ];

		var r = parseFloat(jQuery.css(this.elem, this.prop, force));
		return r && r > -10000 ? r : parseFloat(jQuery.curCSS(this.elem, this.prop)) || 0;
	},

	// Start an animation from one number to another
	custom: function(from, to, unit){
		this.startTime = now();
		this.start = from;
		this.end = to;
		this.unit = unit || this.unit || "px";
		this.now = this.start;
		this.pos = this.state = 0;

		var self = this;
		function t(gotoEnd){
			return self.step(gotoEnd);
		}

		t.elem = this.elem;

		if ( t() && jQuery.timers.push(t) && !timerId ) {
			timerId = setInterval(function(){
				var timers = jQuery.timers;

				for ( var i = 0; i < timers.length; i++ )
					if ( !timers[i]() )
						timers.splice(i--, 1);

				if ( !timers.length ) {
					clearInterval( timerId );
					timerId = undefined;
				}
			}, 13);
		}
	},

	// Simple 'show' function
	show: function(){
		// Remember where we started, so that we can go back to it later
		this.options.orig[this.prop] = jQuery.attr( this.elem.style, this.prop );
		this.options.show = true;

		// Begin the animation
		// Make sure that we start at a small width/height to avoid any
		// flash of content
		this.custom(this.prop == "width" || this.prop == "height" ? 1 : 0, this.cur());

		// Start by showing the element
		jQuery(this.elem).show();
	},

	// Simple 'hide' function
	hide: function(){
		// Remember where we started, so that we can go back to it later
		this.options.orig[this.prop] = jQuery.attr( this.elem.style, this.prop );
		this.options.hide = true;

		// Begin the animation
		this.custom(this.cur(), 0);
	},

	// Each step of an animation
	step: function(gotoEnd){
		var t = now();

		if ( gotoEnd || t >= this.options.duration + this.startTime ) {
			this.now = this.end;
			this.pos = this.state = 1;
			this.update();

			this.options.curAnim[ this.prop ] = true;

			var done = true;
			for ( var i in this.options.curAnim )
				if ( this.options.curAnim[i] !== true )
					done = false;

			if ( done ) {
				if ( this.options.display != null ) {
					// Reset the overflow
					this.elem.style.overflow = this.options.overflow;

					// Reset the display
					this.elem.style.display = this.options.display;
					if ( jQuery.css(this.elem, "display") == "none" )
						this.elem.style.display = "block";
				}

				// Hide the element if the "hide" operation was done
				if ( this.options.hide )
					jQuery(this.elem).hide();

				// Reset the properties, if the item has been hidden or shown
				if ( this.options.hide || this.options.show )
					for ( var p in this.options.curAnim )
						jQuery.attr(this.elem.style, p, this.options.orig[p]);
					
				// Execute the complete function
				this.options.complete.call( this.elem );
			}

			return false;
		} else {
			var n = t - this.startTime;
			this.state = n / this.options.duration;

			// Perform the easing function, defaults to swing
			this.pos = jQuery.easing[this.options.easing || (jQuery.easing.swing ? "swing" : "linear")](this.state, n, 0, 1, this.options.duration);
			this.now = this.start + ((this.end - this.start) * this.pos);

			// Perform the next step of the animation
			this.update();
		}

		return true;
	}

};

jQuery.extend( jQuery.fx, {
	speeds:{
		slow: 600,
 		fast: 200,
 		// Default speed
 		_default: 400
	},
	step: {

		opacity: function(fx){
			jQuery.attr(fx.elem.style, "opacity", fx.now);
		},

		_default: function(fx){
			if ( fx.elem.style && fx.elem.style[ fx.prop ] != null )
				fx.elem.style[ fx.prop ] = fx.now + fx.unit;
			else
				fx.elem[ fx.prop ] = fx.now;
		}
	}
});
if ( document.documentElement["getBoundingClientRect"] )
	jQuery.fn.offset = function() {
		if ( !this[0] ) return { top: 0, left: 0 };
		if ( this[0] === this[0].ownerDocument.body ) return jQuery.offset.bodyOffset( this[0] );
		var box  = this[0].getBoundingClientRect(), doc = this[0].ownerDocument, body = doc.body, docElem = doc.documentElement,
			clientTop = docElem.clientTop || body.clientTop || 0, clientLeft = docElem.clientLeft || body.clientLeft || 0,
			top  = box.top  + (self.pageYOffset || jQuery.boxModel && docElem.scrollTop  || body.scrollTop ) - clientTop,
			left = box.left + (self.pageXOffset || jQuery.boxModel && docElem.scrollLeft || body.scrollLeft) - clientLeft;
		return { top: top, left: left };
	};
else 
	jQuery.fn.offset = function() {
		if ( !this[0] ) return { top: 0, left: 0 };
		if ( this[0] === this[0].ownerDocument.body ) return jQuery.offset.bodyOffset( this[0] );
		jQuery.offset.initialized || jQuery.offset.initialize();

		var elem = this[0], offsetParent = elem.offsetParent, prevOffsetParent = elem,
			doc = elem.ownerDocument, computedStyle, docElem = doc.documentElement,
			body = doc.body, defaultView = doc.defaultView,
			prevComputedStyle = defaultView.getComputedStyle(elem, null),
			top = elem.offsetTop, left = elem.offsetLeft;

		while ( (elem = elem.parentNode) && elem !== body && elem !== docElem ) {
			computedStyle = defaultView.getComputedStyle(elem, null);
			top -= elem.scrollTop, left -= elem.scrollLeft;
			if ( elem === offsetParent ) {
				top += elem.offsetTop, left += elem.offsetLeft;
				if ( jQuery.offset.doesNotAddBorder && !(jQuery.offset.doesAddBorderForTableAndCells && /^t(able|d|h)$/i.test(elem.tagName)) )
					top  += parseInt( computedStyle.borderTopWidth,  10) || 0,
					left += parseInt( computedStyle.borderLeftWidth, 10) || 0;
				prevOffsetParent = offsetParent, offsetParent = elem.offsetParent;
			}
			if ( jQuery.offset.subtractsBorderForOverflowNotVisible && computedStyle.overflow !== "visible" )
				top  += parseInt( computedStyle.borderTopWidth,  10) || 0,
				left += parseInt( computedStyle.borderLeftWidth, 10) || 0;
			prevComputedStyle = computedStyle;
		}

		if ( prevComputedStyle.position === "relative" || prevComputedStyle.position === "static" )
			top  += body.offsetTop,
			left += body.offsetLeft;

		if ( prevComputedStyle.position === "fixed" )
			top  += Math.max(docElem.scrollTop, body.scrollTop),
			left += Math.max(docElem.scrollLeft, body.scrollLeft);

		return { top: top, left: left };
	};

jQuery.offset = {
	initialize: function() {
		if ( this.initialized ) return;
		var body = document.body, container = document.createElement('div'), innerDiv, checkDiv, table, td, rules, prop, bodyMarginTop = body.style.marginTop,
			html = '<div style="position:absolute;top:0;left:0;margin:0;border:5px solid #000;padding:0;width:1px;height:1px;"><div></div></div><table style="position:absolute;top:0;left:0;margin:0;border:5px solid #000;padding:0;width:1px;height:1px;" cellpadding="0" cellspacing="0"><tr><td></td></tr></table>';

		rules = { position: 'absolute', top: 0, left: 0, margin: 0, border: 0, width: '1px', height: '1px', visibility: 'hidden' };
		for ( prop in rules ) container.style[prop] = rules[prop];

		container.innerHTML = html;
		body.insertBefore(container, body.firstChild);
		innerDiv = container.firstChild, checkDiv = innerDiv.firstChild, td = innerDiv.nextSibling.firstChild.firstChild;

		this.doesNotAddBorder = (checkDiv.offsetTop !== 5);
		this.doesAddBorderForTableAndCells = (td.offsetTop === 5);

		innerDiv.style.overflow = 'hidden', innerDiv.style.position = 'relative';
		this.subtractsBorderForOverflowNotVisible = (checkDiv.offsetTop === -5);

		body.style.marginTop = '1px';
		this.doesNotIncludeMarginInBodyOffset = (body.offsetTop === 0);
		body.style.marginTop = bodyMarginTop;

		body.removeChild(container);
		this.initialized = true;
	},

	bodyOffset: function(body) {
		jQuery.offset.initialized || jQuery.offset.initialize();
		var top = body.offsetTop, left = body.offsetLeft;
		if ( jQuery.offset.doesNotIncludeMarginInBodyOffset )
			top  += parseInt( jQuery.curCSS(body, 'marginTop',  true), 10 ) || 0,
			left += parseInt( jQuery.curCSS(body, 'marginLeft', true), 10 ) || 0;
		return { top: top, left: left };
	}
};


jQuery.fn.extend({
	position: function() {
		var left = 0, top = 0, results;

		if ( this[0] ) {
			// Get *real* offsetParent
			var offsetParent = this.offsetParent(),

			// Get correct offsets
			offset       = this.offset(),
			parentOffset = /^body|html$/i.test(offsetParent[0].tagName) ? { top: 0, left: 0 } : offsetParent.offset();

			// Subtract element margins
			// note: when an element has margin: auto the offsetLeft and marginLeft 
			// are the same in Safari causing offset.left to incorrectly be 0
			offset.top  -= num( this, 'marginTop'  );
			offset.left -= num( this, 'marginLeft' );

			// Add offsetParent borders
			parentOffset.top  += num( offsetParent, 'borderTopWidth'  );
			parentOffset.left += num( offsetParent, 'borderLeftWidth' );

			// Subtract the two offsets
			results = {
				top:  offset.top  - parentOffset.top,
				left: offset.left - parentOffset.left
			};
		}

		return results;
	},

	offsetParent: function() {
		var offsetParent = this[0].offsetParent || document.body;
		while ( offsetParent && (!/^body|html$/i.test(offsetParent.tagName) && jQuery.css(offsetParent, 'position') == 'static') )
			offsetParent = offsetParent.offsetParent;
		return jQuery(offsetParent);
	}
});


// Create scrollLeft and scrollTop methods
jQuery.each( ['Left', 'Top'], function(i, name) {
	var method = 'scroll' + name;
	
	jQuery.fn[ method ] = function(val) {
		if (!this[0]) return null;

		return val !== undefined ?

			// Set the scroll offset
			this.each(function() {
				this == window || this == document ?
					window.scrollTo(
						!i ? val : jQuery(window).scrollLeft(),
						 i ? val : jQuery(window).scrollTop()
					) :
					this[ method ] = val;
			}) :

			// Return the scroll offset
			this[0] == window || this[0] == document ?
				self[ i ? 'pageYOffset' : 'pageXOffset' ] ||
					jQuery.boxModel && document.documentElement[ method ] ||
					document.body[ method ] :
				this[0][ method ];
	};
});
// Create innerHeight, innerWidth, outerHeight and outerWidth methods
jQuery.each([ "Height", "Width" ], function(i, name){

	var tl = i ? "Left"  : "Top",  // top or left
		br = i ? "Right" : "Bottom", // bottom or right
		lower = name.toLowerCase();

	// innerHeight and innerWidth
	jQuery.fn["inner" + name] = function(){
		return this[0] ?
			jQuery.css( this[0], lower, false, "padding" ) :
			null;
	};

	// outerHeight and outerWidth
	jQuery.fn["outer" + name] = function(margin) {
		return this[0] ?
			jQuery.css( this[0], lower, false, margin ? "margin" : "border" ) :
			null;
	};
	
	var type = name.toLowerCase();

	jQuery.fn[ type ] = function( size ) {
		// Get window width or height
		return this[0] == window ?
			// Everyone else use document.documentElement or document.body depending on Quirks vs Standards mode
			document.compatMode == "CSS1Compat" && document.documentElement[ "client" + name ] ||
			document.body[ "client" + name ] :

			// Get document width or height
			this[0] == document ?
				// Either scroll[Width/Height] or offset[Width/Height], whichever is greater
				Math.max(
					document.documentElement["client" + name],
					document.body["scroll" + name], document.documentElement["scroll" + name],
					document.body["offset" + name], document.documentElement["offset" + name]
				) :

				// Get or set width or height on the element
				size === undefined ?
					// Get width or height on the element
					(this.length ? jQuery.css( this[0], type ) : null) :

					// Set the width or height on the element (default to pixels if value is unitless)
					this.css( type, typeof size === "string" ? size : size + "px" );
	};

});
})();
/*FILE: src/null.loading.js*/
/*!
 *  NUL language JavaScript framework
 *  (c) 2009 E-med Ware
 *
 * NUL is freely distributable under the terms of GNU GPLv3 license.
 *  For details, see the NUL project site : http://code.google.com/p/nul/
 *
 *--------------------------------------------------------------------------*/

nul = new JS.Singleton(/** @lends nul */{ load: {} });
Function.prototype.describe = function() { return this; };
Function.prototype.contract = function() { return function() {}; };

nul.rootPath = '';
nul.loading = function() {
	$('head script').each(function(){
		var spl = this.src.split('null.');
		if(1< spl.length) {
			nul.rootPath = spl[0];	//TODO 3: quid with rootPath ?
			nul.loading.fixConsole($(this).attr('noconsole'));
		}
	});

	nul.loading.follow(function() {
		if('complete'== document.readyState) nul.loading.initiate();
		else $('body').ready(nul.loading.initiate);
	});
};
nul.loading.initiate = function() {
	var toProvide = {};
	var toLoad = [];
	for(var l in nul.load)
		if(!function(){}[l]) {
			if(!nul.load[l].provide) nul.load[l].provide = [];
			if(0> $.inArray(l, nul.load[l].provide)) nul.load[l].provide.push(l);
			for(var p=0; nul.load[l].provide[p]; ++p)
				toProvide[nul.load[l].provide[p]] = 1+(toProvide[nul.load[l].provide[p]]||0);
			nul.load[l].name = l;
			toLoad.push(nul.load[l]);
		}
	while(toLoad.length) {
		var nxtLd = toLoad.shift();
		var cn = true;
		if(nxtLd.use)
			for(var u in nxtLd.use)
				if(toProvide[u]) cn = false;
		if(cn) {
			nxtLd.apply(document);
			for(var p=0; nxtLd.provide[p]; ++p)
				--toProvide[nxtLd.provide[p]];
		} else toLoad.push(nxtLd);
	}
	delete nul.loading;
};


/*FILE: src/null.inplace.js*/
/*  NUL language JavaScript framework
 *  (c) 2009 E-med Ware
 *
 * NUL is freely distributable under the terms of GNU GPLv3 license.
 *  For details, see the NUL project site : http://code.google.com/p/nul/
 *
 *--------------------------------------------------------------------------*/


nul.loading.fixConsole = function(ncd) { if(ncd) nul.console = false; };
nul.loading.follow = function(f) {f();};
nul.loading();
/*FILE: bin/null.core.js*/
/*FILE: src/web/null.helper.js*/
/*  NUL language JavaScript framework
 *  (c) 2009 E-med Ware
 *
 * NUL is freely distributable under the terms of GNU GPLv3 license.
 *  For details, see the NUL project site : http://code.google.com/p/nul/
 *
 *--------------------------------------------------------------------------*/

/**
 * Determines weither this number is an integer
 * @param {Number} n
 * @return {Boolean}
 */

(function($) {
	$.extend({
		keys: function(obj) {
			var a = [];
			$.each(obj, function(k) {a.push(k); });
			return a;
		},
		/**
		 * For an url option specified in ptcl://url/path/file.ext?options#anchor,
		 * retrieve the value given (if option looks like name=value),
		 * true if the option was gicen without and argument (http://...html?...&ImHappy&...)
		 * false if the option was not given
		 * @param {String} opt The name of the option to retrieve
		 * @return {Boolean|String} The value of the given option
		 */
		url: function(opt) {
			var srch = (window.location.href.split('?')[1]||'').split('#')[0];
			if(!srch) return;
			srch = '&'+srch+'&';
			var rx = new RegExp('\\&'+opt+'(\\=(.*?))?\\&');
			var mh = rx.exec(srch);
			return mh?(mh[2]||true):false;
		},
		id: function(x) { return x; },
		/**
		 * Text node creation shortcut
		 * @param {String} str
		 * @return {jQuery} text node
		 */
		text: function(str) { return $(document.createTextNode(str)); }
	});
})(jQuery);

function isJsInt(n) {
	return n== Math.floor(n);
}

/**
 * Gets weither the index is defined in the class definition
 * @param obj
 * @param ndx
 * @return {Boolean}
 */
function isClsNdx(obj, ndx) {
	if(!obj || 'object'!= typeof obj) return false;
	if('constructor'== ndx) return true;
	for(var c = obj.constructor; c; c = c.superclass)
		if('undefined'!= typeof c.prototype[ndx])
			return c.prototype[ndx] === obj[ndx];
	return false;
}

/**
 * Creates an empty object having the same class as a given one
 * @param {Object} obj Object to mimic
 * @return {Object}
 */
function newEmpty(obj) {
	if('object' != typeof obj) return obj;
	if(!obj.constructor) return {};
	var nativeTypes = [Array, Boolean, Date, String, Number];

	var c = obj.constructor;
	var rv = nativeTypes.include(c) ? c() : {constructor: c, toString: obj.toString};
	for(; c; c = c.superclass) for(var i in c.prototype) if(c.prototype[i]===obj[i]) rv[i] = c.prototype[i];

	return rv;
}

/**
 * Return all the elements that are owned by the object, not his prototype or such
 * @param itm
 * @param fct function(dst, src, ndx)
 * @return
 */
function ownNdx(itm, fct) {
	//TODO 3: use yield?
	if(fct) {
		var rv = newEmpty(itm);
		for(var ndx in itm)
			if(!isClsNdx(itm, ndx))
				fct(rv, itm, reTyped(ndx));
		return rv;
	}
	var rv = {};
	for(var ndx in itm)
		if(!isClsNdx(itm, ndx))
			rv[ndx] = itm[ndx];
	return rv;
}

/**
 * Internal (helper) use for mapping functions
 * @private
 */
function mapCb(fct, ndx, itm) {
	return fct?fct.apply( ['object','function'].include(typeof itm)?itm:null, [reTyped(ndx), itm]):itm;
}

/**
 * Returns the first of 'itm' for which the function 'fct' returned a value evaluated to true
 * @param {Object} itm
 * @param {MapCallBack} fct
 */
function trys(itm, fct) {
	var rv;
	for(var i in ownNdx(itm))
		if(rv = mapCb(fct, i, itm[i])) return rv;
}

/**
 * Returns the sum of the returns value (or 1 if not-false and not-number)
 * @param {Object} itm
 * @param {MapCallBack} fct
 */
function cnt(itm, fct) {
	var rv = 0;
	
	for(var i in ownNdx(itm)) { 
		var trv = mapCb(fct, i, itm[i]);
		if('number'== typeof trv) rv += trv;
		else if(trv) ++rv;
	}
	return rv;
}

/**
 * Returns the same item as 'itm' where each member went through 'fct'.
 * @param {Object} itm
 * @param {MapCallBack} fct
 */
function map(itm, fct) {
	return ownNdx(itm, function(dst, src, ndx) {
		dst[ndx] = mapCb(fct, ndx, itm[ndx]);
	});
}


/**
 * Returns the same item as 'itm' where each member went through 'fct'.
 * Each members returning an empty value are not added
 * @param {Object} itm
 * @param {MapCallBack} fct
 */
function maf(itm, fct) {
	return ownNdx(itm, function(dst, src, ndx) {
		var trv = mapCb(fct, ndx, itm[ndx]);
		if('undefined'!= typeof trv && null!== trv) {
			if('number'== typeof ndx) dst.push(trv);
			else dst[ndx] = trv;
		}
	});
}

/**
 * Escape a string for it to be displayable as text in a HTML page
 * @param {String} str
 * @return {HTML}
 */
function escapeHTML(str) {
	return $('<div />').text(str).html();
};

/**
 * Is 'o' an empty association ? (beside the values contained in array 'b')
 * @param {Object} o
 * @param {param array} b
 * @return {Boolean}
 */ 
function isEmpty(o, b) {
	b = beArrg(arguments, 1);
	for(var i in o) if(!b || !b.include(i)) return false;
	return true;
}

/**
 * If a string is '5', get it as the number 5
 * @param {String|Number} v
 * @return {String|Number}
 */
function reTyped(v) {
	if('string'!= typeof v) return v;
	if((new RegExp('^(\\d+)$', 'g')).exec(v)) return parseInt(v);
	return v;
}

/**
 * Take the 'param array' parameters of the function
 * @param {Arguments} args The given "arguments"
 * @param ndx The argument-index where the param-array begind
 * @return {any[]}
 */
function beArrg(args, ndx) {
	if(!ndx) ndx = 0;
	if(ndx >= args.length) return [];
	if(1+ndx== args.length && $.isArray(args[ndx])) return map(args[ndx]);
	return $.makeArray(args).slice(ndx);
}

/**
 * Modifies the components of an Object (dst) along the components of another Object {src}
 * @param {Object} dst The destination Object
 * @param {Object} src The modifying Object
 * @param {function(srcElement,dstElement) {any}} cb Call-back to compute the new value
 * @return {Object} dst
 */
function merge(dst, src, cb) {
	for(var i in ownNdx(src)) dst[i] = cb?cb(dst[i],src[i], i):src[i];
	if(cb) for(var i in ownNdx(dst)) if('undefined'== typeof src[i]) dst[i] = cb(dst[i], null, i);
	return dst; 
}

//TODO 2: use prototype addMethod ?
[].pushs || (Array.prototype.pushs =
	/**
	 * Concatenate array(s) to this one
	 * @memberOf Array#
	 * @param {Array} [paramarray]
	 * @name pushs
	 */
	function(){
		for(var j=0; j<arguments.length; ++j) {
			var o = arguments[j];
			if(this===o) nul.ex.internal('Catenating self');
			if(!$.isArray(o)) this.push(o);
			else for(var i=0; i<o.length; ++i) this.push(o[i]);
		}
		return this; 
	});

[].union || (Array.prototype.union = 
	/**
	 * Add elements from an array if they're not already present
	 * @memberOf Array#
	 * @param {Array} [paramarray]
	 * @name union
	 */
	function(){
		for(var j=0; j<arguments.length; ++j) {
			var o = arguments[j];
			for(var i=0; i<o.length; ++i) {
				var s;
				for(s=0; s<this.length; ++s) if(this[s]===o[i]) break;
				if(s>=this.length) this.push(o[i]);
			}
		}
		return this; 
	});

[].mar || (Array.prototype.mar = 
	/**
	 * Returns an array whose elements are the return values of <fct> taken for each item of <itm>
	 * <fct> return an array of element to add in the return list
	 * @memberOf Array#
	 * @param {MapCallBack} fct
	 * @name mar
	 */
	function(fct) {
		var rv = [];
		for(var i in ownNdx(this)) rv.pushs(mapCb(fct, i, this[i]));
		return rv;
	});

[].include || (Array.prototype.include = 
	function(itm) { return -1< $.inArray(itm, this); });

[].indexOf || (Array.prototype.indexOf = 
	function(itm) { return $.inArray(itm, this); });


/** @constant */
pinf = Number.POSITIVE_INFINITY;
/** @constant */
ninf = Number.NEGATIVE_INFINITY;

$o = {
	clone: function(o) {
		var rv = {};
		for(var a in o) rv[a] = o[a];
		return rv;
	}
};

Function.prototype.contract = function(){ return function(){}; };
Function.prototype.asserted = function(){};
/*FILE: src/krnl/null.std.js*/
/*  NUL language JavaScript framework
 *  (c) 2009 E-med Ware
 *
 * NUL is freely distributable under the terms of GNU GPLv3 license.
 *  For details, see the NUL project site : http://code.google.com/p/nul/
 *
 *--------------------------------------------------------------------------*/


/**
 * @name nul
 * @namespace
 */
nul.extend( /** @lends nul */{
	/**
	 * List of failures that happened during these trys
	 */
	fails: [],
	/**
	 * Throw a failure
	 * @param reason items to shape a sentence
	 */
	fail: function(reason) {
		if(nul.debugged) nul.debugged.fail(beArrg(arguments));
		throw nul.ex.failure;
	},
	/**
	 * Make several try/catch; accept some failures (debug purpose)
	 */
	trys: function(cb, name, obj, args) {
		/*if(!nul.debugged || !nul.debugged.logging || !nul.debugged.acts)*/ return cb.apply(obj);
		//return nul.debugged.trys(cb, name, obj, beArrg(arguments, 3));
	},
	/**
	 * Catch only failure.
	 */
	failed: function(err) {
		if(nul.ex.failure!== err) throw nul.ex.be(err);
	},
	
	/**
	 * Global NUL values
	 * @type nul.expression[String]
	 */
	globals: {},
	
	/**
	 * Understand the compiled text in a knowledge named glbNm, using the uber-local
	 * @param {nul.compiled} cmpl
	 * @param {String} glbNm
	 * @return {nul.xpr.object}
	 */
	understand: function(cmpl, glbNm) {
		var rv = (new nul.understanding.base.set(null, null, glbNm || 'g')).understand(cmpl);
		return (new nul.klg.represent(nul.execution.globalKlg)).browse(rv);
	},
	
	/**
	 * Compile a text and understand it
	 * @param {String} txt
	 * @return {nul.expression}
	 * @throw {nul.ex.semantic}
	 * @throw {nul.ex.syntax} 
	 */
	nulRead: function(txt, glbNm)
	{
		try {
			return nul.understand(nul.compile(txt), glbNm);
		} catch(x) {
			nul.failed(x);
			return nul.obj.empty;
		}
	},

	/**
	 * Compile an XML content and understand it
	 * @param {XML} txt
	 * @return {nul.expression}
	 * @throw {nul.ex.semantic}
	 * @throw {nul.ex.syntax} 
	 */
	xmlRead: function(txt, glbNm)
	{
		return nul.compile.xml(txt).mar(function() {
			try {
				return nul.understand(this, glbNm).listed();
			} catch(x) {
				nul.failed(x);
				return [];
			}
		});
	},

	/**
	 * Modify the global knowledge : the set contains one and only one element
	 * @param {nul.xpr.object} set The set of value to make known
	 * @return {nul.xpr.object} The value asserted
	 */
	known: function(set, name) {
		var gKlg = nul.execution.globalKlg.modifiable();
		var rv = gKlg.newLocal(name);
		try {
			var tattr = {};
			tattr[name] = gKlg.hesitate(set.having(rv));
			gKlg.attributed(nul.execution.evalLocal, tattr);
			gKlg = gKlg.wrap(nul.execution.uberLocal).knowledge;
			rv = gKlg.attribute(nul.execution.evalLocal, name);
		} catch(x) {
			nul.failed(x);
			nul.ex.semantic('KNW', 'The evaluation of '+name+' failed', set);
		}
		nul.execution.globalKlg = gKlg;
		return rv;
	}.describe('Knownation'),
	
	/**
	 * Compile a text, understand, have it queried and known
	 * @param {String} txt
	 * @return {nul.expression}
	 * @throw {nul.ex.semantic}
	 * @throw {nul.ex.syntax} 
	 */
	read: function(txt, glbNm)
	{
		return nul.known(nul.data.query(nul.nulRead(txt, glbNm)), glbNm);
	}.describe('Reading')
});

/*FILE: src/lng/null.execution.js*/
/*  NUL language JavaScript framework
 *  (c) 2009 E-med Ware
 *
 * NUL is freely distributable under the terms of GNU GPLv3 license.
 *  For details, see the NUL project site : http://code.google.com/p/nul/
 *
 *--------------------------------------------------------------------------*/

/**@namespace*/
nul.execution = {
	/**@namespace*/
	name: {
		gen: function(ns) {
			if(!nul.execution.name.space[ns]) nul.execution.name.space[ns] = 0;
			return ++nul.execution.name.space[ns];
		},
		space: {}
	},
	/**
	 * Create the global knowledge
	 */
	createGlobalKlg: function() {
		nul.erroneus = false;
		nul.execution.name.space = {};
		
		/**
		 * The knowledge that is shared as a parent knowledge from a reading to another
		 * @type {nul.xpr.knowledge}
		 */
		nul.execution.globalKlg = new nul.xpr.knowledge('global');
		nul.execution.uberLocal = nul.execution.globalKlg.newLocal('überLocal');	//TODO 2: use string ndx?
		nul.execution.evalLocal = nul.execution.globalKlg.newLocal('evalLocal');	//TODO 2: use string ndx?
		nul.execution.globalKlg.attributed(nul.execution.uberLocal, {eval: nul.execution.evalLocal});
	},
	/**
	 * Called once nul.globals is made, to close the construction of the primordial globalKlg
	 */
	ready: function() {
		if(!isEmpty(nul.globals)) nul.execution.globalKlg.attributed(nul.execution.uberLocal, nul.globals);
		nul.execution.globalKlg.built();
	},
	/**
	 * Reset the namespaces, the debug state, the erroneus state and the benchmarks(if not specified else)
	 */
	reset: function() {
		nul.execution.createGlobalKlg();
		nul.execution.ready();
	},
	/**@namespace*/
	benchmark: {
		/** List of entered benchmarked named-codes */
		stack: [],
		/** Cumulated named-codes benchmarks */
		computed: {},
		/**
		 * Call cb cumulating its benchmark as named-code 'nm'
		 * @param {String} nm
		 * @param {function() void} cb
		 * @return What cb returns
		 */
		measure: function(nm, cb) {
			this.cstart(nm);
			try { return cb(); }
			finally { this.cstop(nm); }
		},
		/**
		 * Starts a named-code benchmark 'nm' timing
		 * @param {String} nm
		 */
		cstart: function(nm) {
			if(!this.computed[nm]) this.computed[nm] = 0;
			this.computed[nm] -= this.timeStamp(); 
		},
		/**
		 * Stops a named-code benchmark 'nm' timing
		 * @param {String} nm
		 */
		cstop: function(nm) {
			this.computed[nm] += this.timeStamp();
		},
		/**
		 * Get the 'now' time-stamp
		 * @return {DateTime}
		 */
		timeStamp: function() {
			var d = new Date();
			return d.getTime(); 
		},
		/**
		 * Stops the present named-code benchmark and starts a named-code benchmark 'nm' timing instead
		 * @param {String} nm
		 */
		enter: function(nm) {
			if(this.stack.length) this.cstop(this.stack[0]);
			this.stack.unshift(nm);
			this.cstart(nm);
		},
		/**
		 * Stops the present named-code benchmark (named 'nm) and starts back the one stopped before entering if any
		 * @param {String} nm
		 */
		leave: function(nm) {
			if(nul.debugged) nul.assert(nm == this.stack[0], 'benchmark stack coherence');
			this.cstop(this.stack[0]);
			this.stack.shift();
			if(this.stack.length) this.cstart(this.stack[0]);			
		},
		/**
		 * Clear benchmarks data.
		 */
		reset: function() {
			this.computed = {};
			this.stack = [];
		},
		/**
		 * Draw the benchmarks in a table
		 * @param {HTMLTable} tbl
		 * @param {Number} firsts Number of lines to draw (default 7)
		 */
		draw: function(tbl, firsts) {
			var tbd;
			switch(tbl[0].tagName.toLowerCase()) {
			case 'tbody': tbd = tbl; break;
			case 'table': 
				tbd = tbl.find('tbody');
				if(!tbd.length) tbl.append(tbd = $('<tbody></tbody>'));
				break;
			default: throw 'trace me';
			}
			
			tbd.empty();
			var cs = [];
			for(var c in this.computed) cs.push([c, this.computed[c]]);
			cs.sort(function(a, b){ return b[1]-a[1]; });
			for(var i=0; i<cs.length && i < (firsts||7); ++i)
				tbd.append($('<tr><td>'+cs[i][1]+'</td><th>'+cs[i][0]+'</th></tr>'));
		}
	},
	
	/**
	 * Called when the page should have a fixed value (when all libs are loaded)
	 * @throw {nul.ex.semantic}
	 */
	existOnce: function() {
		//TODO 2: verify that all attribs of evalLocal are context-free from 'global'
		if(nul.execution.globalKlg.ior3.length || 2!= nul.execution.globalKlg.nbrLocals())	//kill globalKlg ?
			//TODO 2: specify which .attr is too fuzzy
			nul.ex.semantic('GLB', 'The global knowledge is too fuzzy');
	}
};

nul.load.globalKnowledge = nul.execution.createGlobalKlg;

nul.load.executionReady = nul.execution.ready;
nul.load.executionReady.use = {'nul.globals': true, 'globalKnowledge': true};
/*FILE: src/lng/xpr/null.expression.js*/
/*  NUL language JavaScript framework
 *  (c) 2009 E-med Ware
 *
 * NUL is freely distributable under the terms of GNU GPLv3 license.
 *  For details, see the NUL project site : http://code.google.com/p/nul/
 *
 *--------------------------------------------------------------------------*/


/**
 * Shortcut to build expression summary items
 */
nul.summary = function(itm) {
	return function() { return this.summary(itm); };
};

nul.expression = new JS.Class(/** @lends nul.expression# */{
	/**
	 * @class NUL expression
	 * @constructs
	 * @param {String} tp Type of expression
	 */
 	initialize: function(tp) {
		this.haveOrigin();
		/**
		 * @type String
		 */
 		if(tp) this.expression = tp;
 	},

	/**
	 * Fix my origin from a new action
	 * @param {nul.expression} frm The expression this is derived from
	 */
 	haveOrigin: function(frm) {
		if(nul.action) this.origin = new nul.origin(frm);
		return this;
 	},

	/**
	 * Fix my origin provenance to frm without changing the action
	 * @param {nul.expression} frm The expression this is derived from
	 */
 	from: function(frm) {
 		if(nul.action) this.origin.from = frm;
		return this;
 	},
 	/**
 	 * Defined empty by default. Must be overriden.
 	 * @type String[]
 	 */
	components: {},
	
//////////////// Assertions

	/**
	 * Assert this expression is modifiable
	 */
	modify: function() {
		return !this.summarised;
	}.contract('Cannot modify summarised'),
	/**
	 * Assert this expression is summarised
	 */
	use: function() {
		return !!this.summarised;
	}.contract('Cannot use non-summarised'),

//////////////// Summary functionment

	/**
	 * Retrieve a computed value about this expression
	 * @param {String} itm Summary item to retrieve
	 */
	summary: function(itm) {
		if(!this.summarised) return this['sum_'+itm].apply(this);
		//this.use();
		if('undefined'== typeof this.summarised[itm]) {
			if(nul.debugged) nul.assert(this['sum_'+itm],'Summary '+itm+' provided for '+this.expression);
			this.summarised[itm] = this['sum_'+itm].apply(this);
		}
		return this.summarised[itm];
	},
	
	/**
	 * Compute the summary of this expression. Marks it as unmodifiable
	 * @param {Association} smr The given summary
	 */
	summarise: function(smr) {
		this.modify();
		this.summarised = smr || {};
	},

	/**
	 * Return a clone version of this expression to modify it.
	 */
	modifiable: function() {
		this.use();
		return this.clone('summarised');
	},

	/**
	 * Return a clone version of this expression to modify it.
	 * @param {String} paramarray List of elements to exclude from clone
	 */
	clone: function() {
		var bsd = beArrg(arguments);
		var comps = this.components;
		var rv = maf(this, function(ndx, obj) {
			if(!bsd.include(ndx)) 
				return (comps[ndx] && comps[ndx].bunch)?map(obj):obj;
		});
		
		return rv.haveOrigin(this);
	},

//////////////// Virtuals

	/**
	 * Return a built version of this expression when the components has bee modified by browse
	 */
	chew: function() {
		this.modify();
		return this.built();
	},	
	/**
	 * Return a summarised version of this. Verify children consistency and make them {@link placed}
	 */
	built: function(smr) {
		if(nul.debugged) nul.assert(this.origin, 'Each expression have an origin.');
		this.modify();
		for(var comp in this.components)
			if(this.components[comp].bunch) {
				for(var ci in ownNdx(this[comp])) if('function'!= typeof this[comp][ci]) {
					this[comp][ci] = this[comp][ci].placed(this);
					nul.xpr.use(this[comp][ci], this.components[comp].type);
				}
			} else {
				this[comp] = this[comp].placed(this);
				nul.xpr.use(this[comp], this.components[comp].type);
			}
		this.summarise(smr);
		return this.fix();
	},
	/**
	 * Built called in a constructor.
	 * No return value, assume it returns this
	 */
	alreadyBuilt: function(smr) {
		var built = this.built(smr);
		if(nul.debugged) nul.assert(this===built, 'Already built fix self');
	},
	/**
	 * Modify internal representation : you won't be changed anymore
	 */
	fix: function() {
		this.use();
		return this;
	},
	/**
	 * Get the version to set as a child of 'prnt' to represent me
	 */
	placed: function(prnt) {
		this.use(); nul.xpr.mod(prnt);
		return this;
	},
	
//////////////// Public

	/**
	 * Change the summarised human-destinated texts
	 * Can be changed even for a built expression (doesn't change the meaning, just the debug drawing)
	 */
	invalidateTexts: function() {
		//TODO 3: invalidate parent texts ?
		delete this.summarised.flatTxt;
		delete this.summarised.htmlTxt;
	},

	
////////////////Internals

	/**
	 * Change self sub-representations. Either to change the self-context index or to modify it by another known value
	 * @param {nul.xpr.object|Name} newSelf
	 * @param {Name} selfRef The actual self reference to replace (this one if none specified)
	 * If newSelf is a {nul.xpr.object}, it will replace the self-references
	 * If not, it will be considered as a new self index
	 */
	reself: function(newSelf, selfRef) {
		if(!this.selfRef && !selfRef) return this;
		var rv = new nul.xpr.object.reself(selfRef || this.selfRef, newSelf).browse(this);
		if(nul.debugged) nul.assert(this.expression == rv.expression || ('pair'== this.expression && '&phi;'== rv.expression),
			'Reselfing doesnt modify the definition');
		return rv;
	},

	/**
	 * @param {document} doc
	 * @return {XMLElement}
	 * @throw {nul.ex.semantic}
	 * TODO 2 returns Element
	 */
	XML: function(doc) {
		nul.ex.semantic('XML', this.expression + ' doesnt fit for XML output', this);
	},
	
//////////////// Summary users

	/**
	 * <a href="http://code.google.com/p/nul/wiki/Summary">Summary</a>: The key string-index of this expression
	 * @function
	 * @return {String}
	 */
	toString: nul.summary('index'),
	/**
	 * <a href="http://code.google.com/p/nul/wiki/Summary">Summary</a>: The HTML representation
	 * @function
	 * @return {HTML}
	 */
	toHtml: nul.summary('htmlTxt'),
	/**
	 * <a href="http://code.google.com/p/nul/wiki/Summary">Summary</a>: The NODE representation
	 * @function
	 * @return {NODE}
	 */
	toNode: function() { return this.summary('nodeTxt').clone(true); },
	/**
	 * <a href="http://code.google.com/p/nul/wiki/Summary">Summary</a>: The flat-text representation
	 * @function
	 * @return {String}
	 */
	toFlat: nul.summary('flatTxt'),
	/**
	 * <a href="http://code.google.com/p/nul/wiki/Summary">Summary</a>: The dependances of this expression.
	 * @function
	 * @return {nul.dependance}
	 */
	dependance: nul.summary('dependance'),

//////////////// Generic summary providers

	/** <a href="http://code.google.com/p/nul/wiki/Summary">Summary</a> computation of 'components' */
	sum_components: function() {
		var rv = {};
		for(var comp in this.components)
			if(this.components[comp].bunch) {
				for(var ci in ownNdx(this[comp]))
					rv[comp+':'+ci] = this[comp][ci];
			} else rv[comp] = this[comp];
		return rv;
	},
	
	/** <a href="http://code.google.com/p/nul/wiki/Summary">Summary</a> computation of {@link index} */
	sum_index: function() {
		var cs = [];
		for(var c in this.components) cs.push(this[c]);
		return this.indexedSub();
	},

	/**
	 * Create an index string out of this object and some given more information
	 * @param {String[]} paramarray Specification to hold
	 */
	indexedSub: function() {
		//TODO 3: assert no infinite recursion
		nul.xpr.is(this);
	 	items = beArrg(arguments).join(',');
	 	var rv = [];
	 	for(var c in this.components)
	 		if(this.components[c].bunch) {
	 			for(var e in ownNdx(this[c]))
	 				rv.push(c+'.'+e+':'+this[c][e].toString());
	 		} else rv.push(c+':'+this[c].toString());
	 	if(items) rv.unshift(items);
	 	rv.unshift(this.expression);
	 	return '['+ rv.join('|') +']';
	},

	/** <a href="http://code.google.com/p/nul/wiki/Summary">Summary</a> computation of {@link toNode} */
	sum_nodeTxt: function() { return nul.txt.node.toText(this); },
	/** <a href="http://code.google.com/p/nul/wiki/Summary">Summary</a> computation of {@link toHtml} */
	sum_htmlTxt: function() { return nul.txt.html.toText(this); },
	/** <a href="http://code.google.com/p/nul/wiki/Summary">Summary</a> computation of {@link toFlat} */
	sum_flatTxt: function() { return nul.txt.flat.toText(this); },
	/** <a href="http://code.google.com/p/nul/wiki/Summary">Summary</a> computation of {@link dependance} */
	sum_dependance: function() {
		var comps = this.summary('components');
		var rv = new nul.dependance();
		for(var c in comps) if(comps[c])
			rv.also(comps[c].dependance());
		return rv;
	}
	
});

/**
 * Expression management helper
 * @namespace 
 */
nul.xpr = nul.debugged?/** @lends nul.xpr */{
	/**
	 * Assert: 'x' are a collection of expression of type 't'
	 * @param {nul.expression[]} x
	 * @param {String} t JS type name
	 */
	are: function(x, t) {
		nul.debugged.are(t||'nul.expression')(x);
		return x;
	},
	/**
	 * Assert: 'x' is an expression of type 't'
	 * @param {nul.expression} x
	 * @param {String} t JS type name
	 */
	is: function(x, t) {
		nul.debugged.is(t||'nul.expression')(x);
		return x;
	},
	/**
	 * Assert: 'x' is an expression of type 't'. 'x' is summarised.
	 * @param {nul.expression} x
	 * @param {String} t JS type name
	 */
	use: function(x, t) {
		nul.debugged.is(t||'nul.expression', 'summarised', function(o) { return !!o.summarised; })(x);
		return x;
	},
	/**
	 * Assert: 'x' is an expression of type 't'. 'x' is not summarised.
	 * @param {nul.expression} x
	 * @param {String} t JS type name
	 */
	mod: function(x, t) {
		nul.debugged.is(t||'nul.expression', 'modifiable', function(o) { return !o.summarised; })(x);
		return x;
	}
}:/** @ignore */{ are: $.id, is: $.id, use: $.id, mod: $.id };

/**
 * Retrieve an expression (and modifies the knowledge) to represent a value-taking
 * @returns {nul.expression} rv; set(itm=>rv)
 */
nul.xpr.application = function(set, itm, klg) {
	var lcl = klg.newLocal(nul.understanding.rvName);
	var rv = klg.hesitate(set.having(new nul.obj.lambda(itm, lcl)));
	if(rv.isA(nul.obj.lambda)) return rv.image;
	return lcl;
};

/*FILE: src/krnl/null.exception.js*/
/*  NUL language JavaScript framework
 *  (c) 2009 E-med Ware
 *
 * NUL is freely distributable under the terms of GNU GPLv3 license.
 *  For details, see the NUL project site : http://code.google.com/p/nul/
 *
 *--------------------------------------------------------------------------*/
 
nul.ex = new JS.Class(/** @lends nul.ex# */{
	/** @ignore */
	//include: [JS.Observable],
	/**
	 * @class Exception thrown by NUL
	 * @constructs
	 */
	initialize: function(name, msg) {
		this.message = msg;
		this.code = name;
		//this.fire();
	},
	/**
	 * Throw this exception
	 */
	raise: function() { throw this; },
	extend: /** @lends nul.ex */{
		/**
		 * If the parameter has been thrown, gets the best matching {nul.ex} : either the parameter as is either the parameter wrapped in the correct descendant of {nul.ex}
		 * @param {any} x
		 * @return {nul.ex} 
		 */
		be: function(x) {
			if(window.console && x.fileName && x.stack && 'number'== typeof x.lineNumber) {
				console.error(x);
				return new nul.ex.js('fbug', x.message, x.fileName, x.lineNumber);
			}
			if(!nul.ex.def(x)) return new nul.ex.unk(x);
			return x;
		},
		/**
		 * Get the JS errors from the given window and manage them as NUL errors
		 * @param {Window} wnd as the constant {window}, a given frame or the return value of a {window.open}
		 */
		hook: function(wnd) {
			window.onerror = nul.ex.js.onerror;
		}, 
		/**
		 * When an exception function is called without 'new', just throw a new one
		 */
		initialize: function() {
			(new arguments.callee.caller(arguments[0], arguments[1], arguments[2], arguments[3], arguments[4], arguments[5], arguments[6])).raise();
		}
	}
});

nul.ex.js = new JS.Class(nul.ex, /** @lends nul.ex.js# */{
	/**
	 * @class Exception thrown by JavaScript interpreter on JavaScript error.
	 * @constructs
	 * @extend nul.ex
	 */
	initialize: function(name, msg, url, ln) {
		this.callSuper(name, msg);
		this.file = url;
		this.line = ln;
	},
	extend: /** @lends nul.ex.js */{
		/**
		 * window.onerror end-point
		 */
		onerror: function(msg, url, ln) {
			//if(window.console) return false;
			throw new nul.ex.js('auto', msg, url, ln);
		}
	},
	toString: function() { return 'JavaScript error'; }
});

nul.ex.hook(window);

nul.ex.semantic = new JS.Class(nul.ex, /** @lends nul.ex.semantic# */{
	/**
	 * @class Exception thrown by the NUL interpreter when the semantic of the NUL text is wrong
	 * @constructs
	 * @extend nul.ex
	 */
	initialize: function(name, msg, xpr) {
		this.callSuper();
		this.xpr = xpr;
	},
	toString: function() { return 'Semantic error'; }
});

nul.ex.syntax = new JS.Class(nul.ex, /** @lends nul.ex.syntax# */{
	/**
	 * @class Exception thrown by the NUL interpreter when the syntax of the NUL text is wrong
	 * @constructs
	 * @extend nul.ex
	 */
	initialize: function(name, msg, tknzr, type) {
		this.callSuper();
		this.token = tknzr.token;
		this.until = { line: tknzr.line, clmn: tknzr.clmn };
		this.type = type||'before';
	},
	/**
	 * Select the incriminated text in an editor window
	 * @param {codeMirror.editor} editor
	 */
	select: function(editor) {
		switch(this.type) {
		case 'before': editor.selectLines(editor.nthLine(this.token.line+1), this.token.clmn); break;
		case 'token': editor.selectLines(editor.nthLine(this.token.line+1), this.token.clmn, editor.nthLine(this.until.line+1), this.until.clmn); break;
		}
	},
	toString: function() { return 'Syntax error'; }
});

nul.ex.unk = new JS.Class(nul.ex, /** @lends nul.ex.unk# */{
	/**
	 * @class Exception thrown from we don't know where - should never happend (throw assertion or internal then)
	 * @constructs
	 * @extend nul.ex
	 */
	initialize: function(obj) {
		this.callSuper('wtf', obj.toString());
		this.object = obj;
	},
	toString: function() { return 'Unknown error'; }
});

nul.ex.internal = new JS.Class(nul.ex, /** @lends nul.ex.internal# */{
	/**
	 * @class A bug in the NUL interpreter - ideally never raised
	 * @constructs
	 * @extend nul.ex
	 */
	initialize: function(msg) {
		this.callSuper('bug', msg);
		if(window.console) console.error(msg);
	},
	toString: function() { return 'Internal error'; }
});

nul.ex.assert = new JS.Class(nul.ex, /** @lends nul.ex.assert# */{
	/**
	 * @class A failed assertion - ideally never raised
	 * @constructs
	 * @extend nul.ex
	 */
	initialize: function(msg) {
		this.callSuper('assertion', msg);
	},
	toString: function() { return 'Assertion failure'; }
});

nul.ex.failure = new JS.Singleton(nul.ex, /** @lends nul.ex.failure# */{
	/**
	 * @class A failed evaluation
	 * @constructs
	 * @extend nul.ex
	 */
	initialize: function(msg) {
		this.callSuper('failure');
	},
	toString: function() { return 'Failure'; }
});

/*FILE: src/web/null.page.js*/
/*  NUL language JavaScript framework
 *  (c) 2009 E-med Ware
 *
 * NUL is freely distributable under the terms of GNU GPLv3 license.
 *  For details, see the NUL project site : http://code.google.com/p/nul/
 *
 *--------------------------------------------------------------------------*/

/**
 * Interract with the page
 * @namespace
 */
nul.page = {
	/**
	 * Called when the webpage contains a NUL error
	 * @param msg Error message
	 * @return nothing
	 */
	error: function(/**nul.ex*/ex) {
		alert(ex.name + ' : ' + ex.present());
	}
};

nul.load.page = function() {
	try {
		var elm = $(this.documentElement);
		var nulScripts = elm.find('script[type="text/nul"]');
		for(var s=0; nulScripts[s]; ++s) {
			if(nulScripts[s].src) nul.data.ajax.loadNul(nulScripts[s].src, nulScripts[s].readAttribute('id'));
			else nul.read(nulScripts[s].text,
				nulScripts[s].readAttribute('id') || 'script'+nul.execution.name.gen('nul.page.outline'));
			//We don't really use the value afterward
		}
		return;
		var nulNodes = elm.find('nul');
		var exts = {}, ints= {};
		var nds = {};
		for(var n=0; nulNodes[n]; ++n) {
			var nnid = nulNodes[s].readAttribute('id');
			if(!nnid) nulNodes[s].writeAttribute('id', nnid = ('inline'+nul.execution.name.gen('nul.page.inline')));
			nds[nnid] = $(nulNodes[s]);
			if(nulNodes[s].src) exts[nnid] = nulNodes[s].src;
			else ints[nnid] = nulNodes[s].textContent;
		}

		for(var n in ints) nds[n].replaceWith(nul.read(ints[n], n).XML(this));
		for(var n in exts) nds[n].replaceWith(nul.data.ajax.loadNul(exts[n], n).XML(this));
		nul.execution.existOnce();
	} catch(x) { nul.page.error(nul.ex.be(x)); }
};
nul.load.page.use = {'executionReady': true, 'console': true, 'HTML': true};
/*FILE: src/lng/algo/null.browse.js*/
/*  NUL language JavaScript framework
 *  (c) 2009 E-med Ware
 *
 * NUL is freely distributable under the terms of GNU GPLv3 license.
 *  For details, see the NUL project site : http://code.google.com/p/nul/
 *
 *--------------------------------------------------------------------------*/

nul.browser = new JS.Class(/** @lends nul.browser# */{
	/**
	 * @constructs
	 * @class Generic expression browsing engine
	 * @param {String} desc Text description
	 */
	initialize: function(desc) {
		this.description = desc;
	},

	/**
	 * Called when the sub-browsing of the expression failed.
	 * @param {nul.expression} xpr
	 * @return {nul.expression | null} Some value if the failure should be overriden by a value returned 
	 */
	abort: function(xpr) { if(xpr.failure) return xpr.failure; },
	/**
	 * Called before to browse an expression
	 * @return {boolean} Weither to browse sub-expressions or not
	 */
	enter: function(xpr) { return xpr; },
	/**
	 * Called after sub-element browsing
	 * @param {association} bwsd An assocation of the components browsed mapping the result of the browsing
	 * @param {nul.expression} xpr The xpr given to this function
	 * @return Whatever this browse function should return
	 */
	makeRV: function(xpr, bwsd) { throw 'abstract'; },
	/**
	 * Recursion function over an expression
	 */
	recursion: function(xpr) {
		if(!xpr) return nul.browser.bijectif.unchanged;
		try {
			nul.xpr.use(xpr);
			
			var bwsd = {};
			var sbx = this.enter(xpr);
			if(sbx) for(var comp in sbx.components)
				if(sbx.components[comp].bunch) {
					var brwsr = this;
					bwsd[comp] = map(sbx[comp], function(i, o) { return brwsr.recursion(o); });
				} else
					bwsd[comp] = this.recursion(sbx[comp], comp);
			return this.makeRV(xpr, bwsd);
		} catch(err) {
			nul.failed(err);
			xpr = this.abort(xpr);
			if(xpr) return xpr;
			throw err;
		}
 	},
 	/**
 	 * Entry point of browsing
 	 */
 	browse: function(xpr) {
		return this.recursion(xpr);
 	}.describe('Browse')
});

nul.browser.cached = new JS.Class(nul.browser, /** @lends nul.browser.cached# */{
	/**
	 * @constructs
	 * @class A browser that cache returns value in the expression JS object
	 * @extends nul.browser
	 * @param {String} desc Text description
	 */
	initialize: function(desc) {
		this.name = 'browseCache' + nul.execution.name.gen('browser.cached');
		this.cachedExpressions = [];
		this.callSuper();
	},
	
	/**
	 * Determine weither to use cache for an expression.
	 */
	cachable: function(xpr) { return true; },
	/**
	 * Remove the cache info from an object
	 */
	uncache: function(xpr) {
		delete xpr[this.name];
	},
	/**
	 * Destroy the cache of returned expression
	 */
	invalidateCache: function() {
		if(this.cachedExpressions)
			while(this.cachedExpressions.length)
				this.uncache(this.cachedExpressions.pop());
		
	},
	/**
	 * Recursion function over an expression
	 */
	recursion: function(xpr) {
		if(!xpr) return nul.browser.bijectif.unchanged;
		if(!this.cachable(xpr)) return this.callSuper();
		if(!xpr[this.name]) {
			xpr[this.name] = this.callSuper();
			this.cachedExpressions.push(xpr);
		}
 		return xpr[this.name];
 	},
 	/**
 	 * Entry point of browsing
 	 */
 	browse: function(xpr) {
 		try { return this.callSuper(); }
 		finally { this.invalidateCache(); }
 	}
});

/**
 * @class A browser that gives one other expression or the same expression
 * @extends nul.browser.cached
 */
nul.browser.bijectif = new JS.Class(nul.browser.cached, /** @lends nul.browser.bijectif# */{
	/**
	 * Transform an expression without recursion.
	 * @return nul.expression or nul.browser.bijectif.unchanged
	 */
	transform: function(xpr) { throw 'abstract'; },
	recursion: function(xpr) {
		var evl = new nul.browser.bijectif.evolution(xpr);
		evl.receive(this.callSuper());
		return evl.changed;
 	},
 	/**
 	 * Called when an expression was modified
 	 * SHOULD return an expression (no 'unchanged')
 	 */
 	build: function(xpr) { return xpr.chew(); },
 	/**
 	 * Determine weither this expression should be modifialbe() and chew() even if elements didn't change
 	 * @param {nul.xpr.expression} xpr
 	 * @return {Boolean}
 	 */
 	forceBuild: function(xpr) { return false; },
 	/**
 	 * Called when an expression was not modified
 	 * @param {nul.xpr.expression} xpr
 	 * @return {nul.xpr.expression|nul.browser.bijectif.unchanged}
 	 */
 	leave: function(xpr) { return nul.browser.bijectif.unchanged; },
	/**
	 * Transform this expression that already had bee browsed.
	 * @return Either a new object or 'null' if nothing changed
	 */
	makeRV: function(xpr, bwsd) {
		var evl = new nul.browser.bijectif.evolution(xpr);
		var mod = nul.browser.bijectif.merge(evl.value, bwsd, this);
		if(!mod && this.forceBuild(evl.value)) mod = evl.value.modifiable();
		if(mod) evl.receive(this.build(mod));	//Here are built modifiabled expressions
		else evl.receive(this.leave(evl.value));
		evl.receive(this.transform(evl.value));
		return evl.changed;
	},
 	/**
 	 * Entry point of browsing
 	 */
 	browse: function(xpr) {
		var evl = new nul.browser.bijectif.evolution(xpr);
		evl.receive(this.callSuper());
		return evl.value;
	},
////////////////Bijectif browser statics
	extend: /** @lends nul.browser.bijectif */ {
		/**
		 * Helper to merge an expression and browsing results
		 * @function
		 * @param {nul.expression} xpr The expression to merge
		 * @param {Association(nul.expression)} bwsd The browsed components results
		 */
		merge: function(xpr, bwsd, brwsr) {
			var mod;
			for(var c in bwsd) {
				var nwItm = bwsd[c];
				if(xpr.components[c].bunch) {
					//bwsd[c] contient des null-s et des valeurs
					if(nul.browser.bijectif.unchanged != nul.browser.bijectif.firstChange(nwItm)) {
						//If at least one non-null return value,
						nwItm = merge(nwItm, xpr[c], nul.browser.bijectif.firstChange);
					} else nwItm = nul.browser.bijectif.unchanged;
				}
				if(nul.browser.bijectif.unchanged!= nwItm) {
					if(!mod) mod = xpr.modifiable();
					mod[c] = nwItm;
				}
			}
			return mod;
		},

		/**
		 * Value meaning the browse returned the same expression
		 * @constant
		 */
		unchanged: 'Just the same',

		evolution: new JS.Class( /** @lends nul.browser.bijectif.evolution# */{
			/**
			 * @constructs
			 * @class An evolution object, where an expression is changed step by step
			 * @param {nul.expression} xpr The first step of the evolution
			 */
			initialize: function(xpr) {
				/**
				 * The value as an expression
				 * @type nul.expression
				 */
				this.value = xpr;
				/**
				 * The value as a changement
				 * @type nul.expression|nul.browser.bijectif.unchanged
				 */
				this.changed = nul.browser.bijectif.unchanged;
				/**
				 * Weither the value changed
				 * @type Boolean
				 */
				this.hasChanged = false;
			},
			/**
			 * Describe the next step of this evolution
			 * @param {nul.expression} xpr The next value this evolution steps through
			 */
			receive: function(xpr) {
				if(nul.browser.bijectif.unchanged== xpr) return;
				this.hasChanged = true;
				this.changed = this.value = xpr;
				if(xpr) nul.xpr.use(xpr);
			}
		}),
		firstChange: function(vals, b) {
			if(b) vals = [vals, b];
			for(var i in ownNdx(vals))
				if(vals[i] != nul.browser.bijectif.unchanged)
					return vals[i];
			return nul.browser.bijectif.unchanged;
		}

	}
});
/*FILE: src/lng/xpr/obj/null.xpr.object.js*/
/*  NUL language JavaScript framework
 *  (c) 2009 E-med Ware
 *
 * NUL is freely distributable under the terms of GNU GPLv3 license.
 *  For details, see the NUL project site : http://code.google.com/p/nul/
 *
 *--------------------------------------------------------------------------*/


nul.xpr.object = new JS.Class(nul.expression, /** @lends nul.xpr.object# */{
	/**
	 * @class NUL object
	 * @extends nul.expression
	 * @constructs
	 */
	initialize: function() {
		this.callSuper(null);
	},

	/**
	 * Return a list of possibles[nul.xpr.possible] 'o' once it is known that 'o' is in this 'set'
	 * @param {nul.xpr.object} o
	 * @param {nul.xpr.knowledge} klg
	 * @return {nul.xpr.possible[]}
	 */
	having: function(o) {
		var klg = new nul.xpr.knowledge();
		klg.belong(o, this);
		return [klg.wrap(o)];
	},
	
	/**
	 * Abstract defined also by nul.xpr.possible
	 */
	valueKnowing: function(klg) { return this; },
	
////////////////	Generic summary providers
	
	/** @private */
	sum_dependance: function() {
		var rv = this.callSuper();
		if(this.selfRef) {
			if(rv.usages[nul.obj.local.self.ref] && rv.usages[nul.obj.local.self.ref].local[this.selfRef]) {
				delete rv.usages[nul.obj.local.self.ref].local[this.selfRef];
				if(isEmpty(rv.usages[nul.obj.local.self.ref].local))
					delete rv.usages[nul.obj.local.self.ref];
			} else delete this.selfRef;
		}
		return rv;
	}
});

nul.xpr.object.reself = new JS.Class(nul.browser.bijectif, /** @lends nul.xpr.object.reself# */{
	/**
	 * @class A browser to change the self-referant locals in an object definition
	 * @constructs
	 * @extends nul.browser.bijectif
	 * @param {String} selfRef The self-reference to replace
	 * @param {nul.xpr.object|String} trgt The replacement value. If a string, will be a self-reference local.
	 */
	initialize: function(selfRef, trgt) {
		this.toNode = function() {
			return $('<span />')
				.append($.text('Reselfing '))
				.append($('<span />').text(selfRef))
				.append($.text(' toward '))
				.append(nul.txt.node.as(trgt));
		};
		this.selfRef = selfRef;
		if(!trgt.expression) this.newRef = trgt;
		this.trgt = trgt.expression?trgt:nul.obj.local.self(trgt);
		this.callSuper('SelfRef');
	},
	/**
	 * Removes or change the self-reference of this expression if it was self-refered
	 * @param {nul.expression} xpr
	 */
	build: function(xpr) {
		if(xpr.selfRef == this.selfRef) {
			if(this.newRef) xpr.selfRef = this.newRef;
			else delete xpr.selfRef;
		}
		return this.callSuper();
	},
	/**
	 * Gets a replacement value if xpr is a concerned self-reference
	 * @param {nul.expression} xpr
	 */
	transform: function(xpr) {
		if('local'== xpr.expression && nul.obj.local.self.ref == xpr.klgRef && xpr.ndx == this.selfRef)
			return this.trgt;
		return nul.browser.bijectif.unchanged;
	}
});

/**
 * Object management helper
 * @namespace 
 */
nul.obj = nul.debugged?/** @lends nul.obj */{
	/**
	 * Assert: 'x' are a collection of objects of type 't'
	 * @param {nul.object[]} x
	 * @param {String} t JS type name
	 */
	are: function(x, t) { return nul.xpr.are(x,t||'nul.xpr.object'); },
	/**
	 * Assert: 'x' is an object of type 't'
	 * @param {nul.object} x
	 * @param {String} t JS type name
	 */
	is: function(x, t) { return nul.xpr.is(x,t||'nul.xpr.object'); },
	/**
	 * Assert: 'x' is an object of type 't'. 'x' is summarised.
	 * @param {nul.object} x
	 * @param {String} t JS type name
	 */
	use: function(x, t) { return nul.xpr.use(x,t||'nul.xpr.object'); },
	/**
	 * Assert: 'x' is an object of type 't'. 'x' is not summarised.
	 * @param {nul.object} x
	 * @param {String} t JS type name
	 */
	mod: function(x, t) { return nul.xpr.mod(x,t||'nul.xpr.object'); }
}:/** @ignore */{ are: $.id, is: $.id, use: $.id, mod: $.id };
/*FILE: src/lng/xpr/obj/defined/null.obj.defined.js*/
/*  NUL language JavaScript framework
 *  (c) 2009 E-med Ware
 *
 * NUL is freely distributable under the terms of GNU GPLv3 license.
 *  For details, see the NUL project site : http://code.google.com/p/nul/
 *
 *--------------------------------------------------------------------------*/


nul.obj.defined = new JS.Class(nul.xpr.object, /** @lends nul.obj.defined# */{
	/**
	 * @class Defined object : are defined by the object its composition, its attributes, ... not by the knowledge
	 * @extends nul.xpr.object
	 * @constructs
	 */
	initialize: function() {
		this.cachedProperties = {};
		this.callSuper();
	},
	
//////////////// public

	/**
	 * Unify two defined objects
	 * @return {nul.obj.defined}
	 * @throws {nul.ex.failure}
	 */
	unified: function(o, klg) {
		this.use(); nul.obj.use(o); nul.klg.mod(klg);
		
		if(o.toString() == this.toString()) return true;
		if(this.subUnified) {
			var e = [this, o];
			var rv = 0;
			if(e[0].selfRef && e[1].selfRef) {
				var nwSelf = nul.execution.name.gen('obj.local.self');
				e[0] = e[0].reself(nwSelf);
				e[1] = e[1].reself(nwSelf);
			}
			if(e[1].selfRef) {
				e.unshift(e.pop());
				rv = 1-rv;
			}
			if(e[0].selfRef) e[0] = e[0].reself(e[1]);
			return e[rv].subUnified(e[1-rv], klg);
		}
		nul.fail(this, ' does not unify to ', o);
	},
	
	/**
	 * Intersect two defined objects
	 * @return nul.obj.defined
	 * @throws {nul.ex.failure}
	 * TODO 2: refaire le meme systeme qu'avec unified : subIntersect de deux defined
	 */
	intersect: function(o, klg) {
		this.use(); nul.obj.use(o); nul.klg.mod(klg);
		if(o == this) return true;
	},
	
	
	/**
	 * Bunch of named attributes
	 * @type {nul.xpr.object[String]}
	 * @constant
	 */
	attributes: {},
	
	/**
	 * Bunch of instant-made attributes
	 * @type {function() {nul.xpr.object} [String]}
	 * @constant
	 */
	properties: {
		'': function() { throw 'abstract'; }
	},
	
	/**
	 * Retrieve an attribute
	 * @param {String} an Attribute Name
	 * @return {nul.xpr.object}
	 * @throws {nul.ex.failure}
	 */
	attribute: function(anm, klg) {
		var af = this.attributes[anm] || this.cachedProperties[anm];
		if(af) return af;
		af = this.properties[anm];
		if(af) return this.cachedProperties[anm] = af.apply(this, [klg, anm]);
		nul.fail(this, 'doesnt have the attribute "'+anm+'"');
	},
	
	/**
	 * Return a list of possibles[nul.xpr.possible] 'o' once it is known that 'o' is in this 'set'
	 * Or nothing if nothing can be simplified
	 * @param {nul.xpr.object} o
	 * @param {nul.xpr.object[]} attrs
	 * @return {nul.xpr.object[]|nul.xpr.possible[]}
	 */
	has: function(o, attrs) {
		if(this.subHas) {
			if(!this.selfRef) return this.subHas(o, attrs);
			return;	//TODO R: recursion at the end, return a knowledge knowing he needs to make recursion
			return nul.trys(function() {
				var psbl = this.subHas(o, attrs);
				var dp = [];
				while(psbl.length) dp.pushs(psbl.pop().distribute());
				switch(dp.length) {
				case 0: nul.fail('No convenient recursive base-case');
				case 1: return dp[0].beself(this).distribute();	//TODO O: see which equivls[0] appears in (&isin; &uArr;) to determine recursive argument
				default:
					return;
					var klg = new nul.xpr.knowledge();
					var srcLcl = klg.newLocal('&uArr;');
					klg.unify(srcLcl, this);
					var sRef = this.selfRef;
					dp = map(dp, function() { return this.beself(srcLcl, sRef); });
					return [klg.wrap(klg.hesitate(dp))];
				}
			}, 'Recursion', this, [o, this]);
		}
	},

	/**
	 * The set who give, for each parameter, the recursive parameter applied
	 * @return {nul.obj.list}
	 */
	recursion: function() { return nul.obj.empty; },
	
////////////////nul.xpr.object implementation

	/**
	 * Return a list of possibles[nul.xpr.possible] 'o' once it is known that 'o' is in this 'set'
	 * Try first an assertion of 'this.has'. If nothing is possible, just let the belonging assertion.
	 * @param {nul.xpr.object} o
	 * @param {nul.xpr.knowledge} klg
	 * @return {nul.xpr.possible[]}
	 */
	having: function(o, attr) {
		return this.has(o, attr||{}) || this.callSuper();
	}
});
/*FILE: src/lng/xpr/obj/defined/null.obj.hc.js*/
/*  NUL language JavaScript framework
 *  (c) 2009 E-med Ware
 *
 * NUL is freely distributable under the terms of GNU GPLv3 license.
 *  For details, see the NUL project site : http://code.google.com/p/nul/
 *
 *--------------------------------------------------------------------------*/


nul.obj.hc = new JS.Class(nul.obj.defined, /** @lends nul.obj.hc# */{
	/**
	 * @class The objects that is defined in javascript, along functions and/or set listing.
	 * @constructs
	 * @extends nul.obj.defined
	 * @param {Object} singleton Sub-class definition. Used when sub-classment is made for a singleton, to avoid new Class.create()()
	 */
	initialize: function(singleton) {
		if(singleton) this.extend(singleton);
		this.callSuper();
		this.alreadyBuilt();
	},
	
	/**
	 * Abstract : Retrieve a value from a key (use the container as a function, key is the argument)
	 * @param {nul.obj.defined} key
	 * @return {nul.xpr.object|nul.data|nul.xpr.possible[]}
	 */
	seek: function(key) { nul.ex.semantic('CNT', this.expression+' cannot retrieve items', this); },
	/**
	 * Abstract : List the direct values of this set (the values that are not lambdas)
	 * @return {nul.xpr.object|nul.data|nul.xpr.possible[]}
	 */
	listed: function() { nul.ex.semantic('CNT', this.expression+' cannot select items', this); },
	
	/**
	 * {@link nul.obj.hc.filter} the {@link nul.obj.hc#.seek} along the expected object to select
	 * @param {nul.obj.defined} pnt 'Arguments' of the function call. Have no dependance.
	 * @param {nul.xpr.object} img 'Return value' of the function call.
	 * @param {nul.xpr.object[String]} att Attributes of the 'return value' of the function call.
	 * @return {nul.xpr.possible[]}
	 */
	retrieve: function(pnt, img, att) {
		return nul.obj.hc.filter(
				this.seek(pnt),
				img, att,
				function(v) { return new nul.obj.lambda(pnt, v); }
			);
	}.describe('Retrieval'),
	/**
	 * {@link nul.obj.hc.filter} the {@link nul.obj.hc#.list} along the expected object to select
	 * @param {nul.xpr.object} obj 'Return value' of the function call.
	 * @param {nul.xpr.object[String]} att Attributes of the 'return value' of the function call.
	 * @return {nul.xpr.possible[]}
	 */
	select: function(obj, att) {
		return nul.obj.hc.filter(this.listed(), obj, att);
	}.describe('Selection'),	
	
	/**
	 * Delegate extraction to specific function-call or listing
	 * @param {nul.xpr.object} o
	 * @param {nul.xpr.object[]} attrs
	 * @return {nul.xpr.object[]|nul.xpr.possible[]}
	 */
	subHas: function(o, attrs) {
		if(o.isA(nul.obj.lambda) && isEmpty(o.point.dependance().usages)) return this.retrieve(o.point, o.image, attrs);
		else if((o.isA(nul.obj.defined) && !o.isA(nul.obj.lambda)) || !isEmpty(attrs)) return this.select(o, attrs);
	}
});

/**
 * Used to bind pure data obj.hc can give to a knowledge and, therefore, possibles.
 * @param {nul.xpr.object|nul.data|nul.xpr.possible[]} objs The given objects
 * @param {nul.xpr.object} exp The expected object
 * @param {nul.xpr.object[String]} exp The attributes of the expected object
 * @param {function(any) nul.xpr.object} wrp Function used to build a return object out of 'exp' for instance 
 */
nul.obj.hc.filter = function(objs, exp, att, wrp) {
	if(!$.isArray(objs)) objs = [objs];
	return maf(objs, function(n, orv) {
		try {
			if(orv.isA(nul.data)) orv = orv.object;
			var klg;
			if(orv.isA(nul.xpr.possible)) {
				klg = orv.knowledge.modifiable();
				nul.klg.mod(klg);
				orv = orv.value;
			} else klg = new nul.xpr.knowledge();
			nul.obj.use(orv);
			var vl = klg.unify(orv, exp);
			vl = klg.attributed(vl, att);
			if(wrp) vl = wrp(vl);
			return klg.wrap(vl);
		} catch(e) { nul.failed(e); }
	});
}.describe('Local filtering');
/*FILE: src/lng/xpr/obj/defined/null.obj.node.js*/
/*  NUL language JavaScript framework
 *  (c) 2009 E-med Ware
 *
 * NUL is freely distributable under the terms of GNU GPLv3 license.
 *  For details, see the NUL project site : http://code.google.com/p/nul/
 *
 *--------------------------------------------------------------------------*/


nul.obj.node = new JS.Class(nul.obj.hc, /** @lends nul.obj.node# */{
	/**
	 * @class XML-like node : tag, attributes and list content. There are no restrictions on content and/or attributes.
	 * @extends nul.obj.defined
	 * @constructs
	 * @param {String} tag The tagName of the XML node
	 * @param {nul.xpr.object[String]} attributes The named attributes
	 * @param {nul.xpr.object[]} content The list of contained elements
	 */
	initialize: function(tag, attributes, content) {
		this.tag = tag;
		var dupProp = null;
		this.attributes = attributes || {};
		for(var anm in this.attributes)
			if('function'== typeof this.attributes[anm]) {
				if(!dupProp) dupProp = $o.clone(this.properties);
				dupProp[anm] = this.attributes[anm];
				delete this.attributes[anm];
			}
		if(dupProp) this.properties = dupProp;

		this.content = content || nul.obj.empty;	//TODO 2: assert content #set
		nul.obj.use(this.content, 'nul.obj.list');
		
		return this.callSuper(null);
	},

//////////////// nul.obj.defined implementation

	/**
	 * Develop the unification of tag, attributes and content
	 * @param {nul.xpr.object} o
	 * @param {nul.xpr.knowledge} klg
	 */
	subUnified: function(o, klg) {
		if('node'!= o.expression) nul.fail(o, ' not a node');
		var nattrs = merge(this.attributes, o.attributes, function(a, b, i) {
			if(!a || !b) nul.fail('Attribute not common : '+i);
			return klg.unify(a, b); 
		});
		return new nul.obj.node(this.tag, nattrs, klg.unify(this.content, o.content));
	},
	/**
	 * Generic node properties
	 * @constant
	 */
	properties: {
		'': function() { return new nul.obj.litteral.string(this.tag); },
		'# ': function(klg) { return this.content.attribute('# ', klg); }
	},
	
	/**
	 * Find out a function who, for an argument, tells which recursive arguments will be given to this
	 * $ factorial -> { 0 => {} [] N n > 1 => { n-1 } }
	 */
	recursion: function() { return this.content.recursion(); },

	/**
	 * @param {document} doc
	 * @return {XMLElement}
	 * @throw {nul.ex.semantic}
	 * TODO 2 returns Element
	 */
	XML: function(doc) {
		var rv = doc.createElement(this.tag);
		for(var a in this.attributes) {
			//TODO 3: check a as attribute name
			if(!this.attributes[a].isA(nul.obj.litteral.string))
				nul.ex.semantic('XML', 'This doesnt fit for XML attribute', this.attributes[a]);
			rv.setAttribute(a, this.attributes[a].value);
		}
		var lst = this.content.listed();
		for(var c=0; lst[c]; ++c)
			rv.appendChild(lst[c].XML(doc));
		return rv;
	},

//////////////// nul.obj.hc implementation

	/**
	 * Gets a node from a selector. The selector can be :
	 * TODO 3- a string tag name (simple CSS selector)
	 * - another node as a template
	 * @param {nul.obj.defined} key
	 */
	seek: function(key) {
		switch(key.expression) {
		case 'node':
			return nul.obj.node.relativise(key, this.listed());
		default:
			nul.ex.semantic('NODE', 'NODE elements can only be indexed [by CSS selector or ]by defaulting node', key);
		}
	},
	
	/**
	 * List the content
	 * @return {nul.xpr.possible[]}
	 */
	listed: function() {
		return this.content.listed();
	},
	
//////////////// nul.expression implementation

	/** @constant */
	expression: 'node',
	/** @constant */
	components: {
		'attributes': {type: 'nul.xpr.object', bunch: true},
		'content': {type: 'nul.xpr.object', bunch: false}
	}
});

/**
 * If the template and the node have the same tag, returns an object who :
 * - have all the attributes fixed like obj
 * - have the attributes fixed by tpl and not obj fixed to the value specified by tpl (default value system)
 * - is undefined and, therefore can have other attributes
 * @param {nul.obj.defined} tpl Template
 * @param {nul.obj.defined[]} objs Objects
 * @return {nul.obj.possible[]}
 */
nul.obj.node.relativise = function(tpl, objs) {
	nul.obj.is(tpl, 'nul.obj.defined');
	return maf(objs, function(n, obj) {
		var klg;
		if(obj.isA(nul.xpr.possible)) {
			klg = obj.knowledge;
			obj = obj.value;
		} else klg = nul.klg.always;
		nul.obj.is(obj, 'nul.obj.defined');
		if(tpl.tag == obj.tag) {
			var rAtt = $o.clone(obj.attributes);
			merge(rAtt, obj.properties, function(a, b, n) { return a || obj.attribute(n); });
			merge(rAtt, tpl.attributes, function(a, b, n) { return a || b; });
			merge(rAtt, tpl.properties, function(a, b, n) { return a || tpl.attribute(n); });
			klg = klg.modifiable();
			var trv = klg.newLocal(tpl.tag);
			klg.attributed(trv, rAtt);
			return klg.wrap(trv);
		}
	});
	//TODO 3: manage 'content'
}.describe('Relativise');
/*FILE: src/data/null.data.js*/
/*  NUL language JavaScript framework
 *  (c) 2009 E-med Ware
 *
 * NUL is freely distributable under the terms of GNU GPLv3 license.
 *  For details, see the NUL project site : http://code.google.com/p/nul/
 *
 *--------------------------------------------------------------------------*/


nul.data = new JS.Class(/** @lends nul.data# */{
	/**
	 * @class The data-source providing basic data interaction.
	 * @constructs
	 */
	initialize: function(context, index, singleton) {
		if(singleton) this.extend(singleton);
		/**
		 * @type {nul.data.context}
		 */
		if(context) this.context = context;
		/**
		 * @type string
		 * Index in this context : URL path, server, ...
		 */
		if(index) this.index = index;
		/**
		 * @type {nul.obj.data}
		 * The object refering this data
		 */
		this.object = new nul.obj.data(this);
	},
	
	/**
	 * Retrieve an object from a data-point
	 * @param {any} prm Parameter given to the querier
	 * @return {nul.obj.defined}
	 */
	extract: function(prm) { throw 'abstract'; },
	
	extend: /** @lends nul.data */{
		/**
		 * Query what is needed to have the queried state of the object
		 * @param {nul.xpr.object} obj
		 * @return {nul.xpr.object} The same object without dependancies
		 * @throw {nul.ex.failure}
		 * @throw {nul.ex.semantic}
		 */
		query: function(obj) {
			nul.obj.use(obj);
			var usg = obj.dependance().usages;
			while(!isEmpty(usg, 'global')) {
				var chsdCtx = null;
				for(var d in ownNdx(usg)) {
					var ctx = nul.dependance.contexts[d];
					if(nul.debugged) nul.assert(nul.data.context.def(ctx), 'Context queried');
					if(!chsdCtx || ctx.distance < chsdCtx.distance)
						chsdCtx = ctx;
				}
				//chsdCtx is fixed as minimum distance
				if(!chsdCtx) nul.ex.internal('Cannot query : ' + $.keys(usg).join(', '));
				obj = chsdCtx.query(obj);
				usg = obj.dependance().usages;
			}
			return obj;
		},

		querier: new JS.Class(nul.browser.bijectif, /** @lends nul.data.querier */{
			/**
			 * @class The browser to replace atomic query-dependant values by their queried value
			 * @extends nul.browser.bijectif
			 * @param {nul.data.context} context
			 * @param {Object} prm Parameter given to the queried function
			 * @constructs
			 */
			initialize: function(context, prm) {
				this.toNode = function() {
					return $('<span />')
						.append($.text('Querying '))
						.append($('<span />').text(context.name));				
				};
				this.context = context;
				this.prm = prm;
				this.callSuper('querier:'+context.name);
			},
			/**
			 * Gets the expression-specific queried value if the expression is a data from the queried context
			 */
			transform: function(xpr) {
				if('data'== xpr.expression && this.context.name == xpr.source.context.name)
					return $.isFunction(xpr.source.extract)?xpr.source.extract(this.prm):xpr.source.extract;
				return nul.browser.bijectif.unchanged;
			}
		})
	}
});

nul.data.context = new JS.Class(/** @lends nul.data.context# */{
	/**
	 * @class The data-source provider
	 * @constructs
	 */
	initialize: function(name, distance, singleton) {
		/**
		 * @type String
		 * Context name : protocol, ...
		 */
		this.name = name;
		/**
		 * Number stating how intimate the local script is to the data source.
		 * 0 = total intimacy, 100 = no intimacy at all
		 * Query always try to solve by querying the most intimate dataSource
		 * @type Number
		 */
		this.distance = distance || 0;
		if(singleton) this.extend(singleton);
	},

	toString: function() { return this.name; },

	/**
	 * Gets an object image no more dependant from this context
	 * @param {nul.xpr.object} obj
	 * @return {nul.browser.bijectif}
	 * @throws {nul.ex.failure}
	 */
	query: function(obj) {
		return this.querier().browse(obj);
	}.describe('Query'),
	
	/**
	 * Build a querier to browse and replace 'data' object from an expression.
	 * @param {any} the parameter given to 'extract' functions
	 * @return {nul.browser.bijectif}
	 */
	querier: function(prm) {
		return new nul.data.querier(this, prm);
	}
});

/**
 * Singleton
 * @class The context used for all computations that doesn't require a connection
 * @extends nul.data.context
 */
nul.data.context.local = new nul.data.context('local');
/*FILE: src/lng/txt/in/null.compiled.js*/
/*  NUL language JavaScript framework
 *  (c) 2009 E-med Ware
 *
 * NUL is freely distributable under the terms of GNU GPLv3 license.
 *  For details, see the NUL project site : http://code.google.com/p/nul/
 *
 *--------------------------------------------------------------------------*/


nul.compiled = new JS.Class (/** @lends nul.compiled# */{
		/**
		 * @constructs
		 * @class Compiled expression tree node
		 * @param {Object} props Properties of the node
		 */
		initialize: function(props) {
			this.extend(props);
		},
		
		extend: /** @lends nul.compiled */{
			/**
			 * @class Nodes factory : as {@link nul.compile#compiled}
			 */
			factory: new JS.Class (/** @lends nul.compiled.factory# */{
				/**
				 * @param {String} oprtr
				 * @param {nul.compiled[]} oprnds
				 * @return {nul.compiled}
				 */
				expression: function(oprtr, oprnds) {
					return new nul.compiled.expression({ operator: oprtr, operands: oprnds});
				},
				/**
				 * @param {String} oprtr
				 * @param {nul.compiled} oprnd
				 * @return {nul.compiled}
				 */
				preceded: function(oprtr, oprnd) {
					return new nul.compiled.preceded({ operator: oprtr, operand: oprnd});
				},
				/**
				 * @param {String} oprtr
				 * @param {nul.compiled} oprnd
				 * @return {nul.compiled}
				 */
				postceded: function(oprtr, oprnd) {
					return new nul.compiled.postceded({ operator: oprtr, operand: oprnd});
				},
				/**
				 * @param {nul.compiled} item
				 * @param {nul.compiled} applied
				 * @return {nul.compiled}
				 */
				application: function(item, applied) {
					return new nul.compiled.application({ item: item, applied: applied});
				},
				/**
				 * @param {nul.compiled} item
				 * @param {nul.compiled} token
				 * @return {nul.compiled}
				 */
				taking: function(item, token) {
					return new nul.compiled.taking({ item: item, token: token});
				},
				/**
				 * @param {String} type
				 * @param {Litteral} value
				 * @return {nul.compiled}
				 */
				atom: function(type, value) {
					return new nul.compiled.atom({ type: type, value: value});
				},
				/**
				 * @param {String} decl
				 * @param {nul.compiled} value
				 * @return {nul.compiled}
				 */
				definition: function(decl, value) {
					return new nul.compiled.definition({ decl: decl, value: value});
				},
				/**
				 * @param {nul.compiled} content
				 * @param {String} selfRef
				 * @return {nul.compiled}
				 */
				set: function(content, selfRef) {
					return new nul.compiled.set({ content: content, selfRef: selfRef});
				},
				/**
				 * @param {String} node
				 * @param {nul.compiled[String]} attrs
				 * @param {nul.compiled[]} content
				 * @return {nul.compiled}
				 */
				xml: function(node, attrs, content) {
					return new nul.compiled.xml({ node: node, attributes: attrs, content: content});
				},
				/**
				 * @param {nul.compiled} obj
				 * @param {String} anm
				 * @param {nul.compiled} v
				 * @return {nul.compiled}
				 */
				composed: function(obj, anm, val) {
					return new nul.compiled.composed({ object: obj, aName: anm, value: val});
				},
				/**
				 * @param {nul.compiled} appl
				 * @param {String} lcl
				 * @return {nul.compiled}
				 */
				objectivity: function(appl, lcl) {
					return new nul.compiled.objectivity({ applied: appl, lcl: lcl});
				},
				/**
				 * @param {nul.xpr.object} val
				 * @return {nul.compiled}
				 */
				hardcode: function(val) {
					return new nul.compiled.hardcode({ value: val});
				}
			})
	}
});
/*FILE: src/lng/txt/in/null.tokenizer.js*/
/*  NUL language JavaScript framework
 *  (c) 2009 E-med Ware
 *
 * NUL is freely distributable under the terms of GNU GPLv3 license.
 *  For details, see the NUL project site : http://code.google.com/p/nul/
 *
 *--------------------------------------------------------------------------*/

//TODO 2: "8x" should be an error, not "8 x" ... or not ?

nul.tokenizer = new JS.Class(/** @lends nul.tokenizer# */{
	/**
	 * @class Text reader helper
	 * @constructs
	 * @param {String} src The text content
	 */
	initialize: function(src) {
		this.txt = src.replace(/\n\r/g,'\uffff').replace(/\n/g,'\uffff').replace(/\r/g,'\uffff');
		this.line = 0;
		this.clmn = 0;
		this.next();
	},
	/**
	 * The next token to consider
	 */
	token: /** @lends nul.tokenizer#token# */{
		/** The alphabet that recognised this token */
		type: '',
		/** The computed token value */
		value: '',
		/** The text that produced this token */
		raw: '',
		/** Line coordinate */
		line: 0,
		/** Row coordinate*/
		clmn: 0
	},
	
	/**
	 * Consider the next token
	 */
	next: function()
	{
		var match, alphabet;
		do
		{
			if(''== this.txt)
				return this.token = { value: '', type: 'eof', clmn: this.clmn, line:this.line };
			for(alphabet in nul.tokenizer.alphabets)
				if(match = nul.tokenizer.isAB(this.txt, alphabet))
				{
					this.token = {
						value: (1< match.length) ? match[1]: null,
						type: alphabet,
						raw: match[0],
						line: this.line,
						clmn: this.clmn};
					this.advance(match[0].length);
					break;
				}
			if(!match)
			{
				this.token = this.txt.substr(0,1);
				this.token = { value: this.token, type: 'other', raw:this.token, cl: this.token.cl, ln:this.token.ln };
				this.advance(1);
			}
		} while(null=== this.token.value);
		
		return this.token;
	},
	/**
	 * Compare and return next token
	 * @param {String[]} accepted A list of accepted token type or nothing if any token accepted
	 * @return {token} next token if accepted or null
	 */
	peek: function(accepted)
	{
		if(accepted)	//if specified
		{
			var argx;
			for(argx=0; argx<accepted.length; ++argx)
				if(accepted[argx]== this.token.type)
					break;
			if( argx >= accepted.length )
				return null;
		}
		return this.token;
	},
	/**
	 * Gets next token and advance if accepted.
	 * @param {String[]} accepted A list of accepted token type
	 * @return next token if accepted or null
	 */
	pop: function(accepted)
	{
		if('eof'== this.token.type) nul.ex.syntax('EOF', 'End of file reached.', this);
		var rv = this.peek(accepted);
		if(rv) this.next();
		return rv;
	},
	/**
	 * Gets next token and advance if accepted.
	 * @param {String} value The only accepted token value
	 * @return true if token was token, false if nothing changed
	 */
	take: function(value)
	{
		var rv = this.token.value == value;
		if( rv ) this.next();
		return rv;
	},
	/**
	 * Take next token, asserts its value
	 * @param {String} value The expected value of the next token
	 * @param {any} rv The return value of this function
	 * @return the parameter 'rv'
	 * @throws {nul.ex.syntax} if the token is not the one expected.
	 */
	expect: function(value, rv)
	{
		if(!this.take(value)) nul.ex.syntax('EXP', '"'+value+'" expected', this);
		return rv;
	},
	/**
	 * Gets next characters and advance if accepted.
	 * @param {String} value The characters expected to de found
	 * @return true if the characters were found and taken
	 */
	rawTake: function(value)
	{
		var txt = this.token.raw + this.txt;
		if( txt.substr(0,value.length) != value ) return false;
		this.advance(value.length, txt);
		this.next();
		return true;
	},
	/**
	 * Take some characters, asserts their value
	 * @param {String} value The expected string to find
	 * @param {any} rv The return value of this function
	 * @return the parameter 'rv'
	 * @throws {nul.ex.syntax} if the characters were not found exactly
	 */
	rawExpect: function(value, rv)
	{
		if(!this.rawTake(value)) nul.ex.syntax('EXP', '"'+value+'" expected', this);
		return rv;
	},
	/**
	 * Get a string until some character
	 * @param {String} seeked The bound for seeking
	 * @return {String} the string until the bound, null if the bound is not found.
	 */
	fly: function(seeked)
	{
		var txt = this.token.raw + this.txt;
		var n = txt.indexOf(seeked);
		if(-1== n) return null;
		var rv = txt.substr(0, n);
		this.advance(n, txt);
		this.next();
		return rv;
	},
	/**
	 * Advance the token position
	 */
	advance: function(n, txt) {
		if(!txt) txt = this.txt;
		var advanced = txt.substr(0, n);
		this.txt = txt.substr(n);
		
		advanced = advanced.split('\uffff');
		if(1>= advanced.length) this.clmn += n;
		else if(this.txt) {
			this.line += advanced.length-1;
			this.clmn = advanced.pop().length;
		}
	}
});

/**
 * Try to recognize the string as from an alphabet
 * @param {String} v The string to recognise
 * @param {String} alphabet The alphabet name
 */
nul.tokenizer.isAB = function(v, alphabet) {
	return (new RegExp('^'+nul.tokenizer.alphabets[alphabet], 'g')).exec(v);
};

/**
 * Alphabets used by the tokenizer given by name
 * @type RegExp[String]
 */
nul.tokenizer.alphabets = {
		number:		'(\\d+(\\.\\d+)?)',
		alphanum:	'([\\w@]+)',
		string:		'"([^"\\uffff]*)"',
		space:		'[\\s\\uffff]+',
		comm1:		'\\/\\/.*?\\uffff',
		comm2:		'\\/\\*.*?\\*\\/',
		oprtr:		[',..', '{', '}', '::', '[', ']', '(', ')', '\\/', '.']
	};
/**
 * Load the operators defined in the compiler to create an alphabet
 */
nul.load.operators = function() {
	var escaper = function(n, s) { return '\\' + s.split('').join('\\'); };
	var ops = map(nul.operators, function() { return this[0];});
	ops.pushs(nul.tokenizer.alphabets.oprtr);
	ops.sort(function(a,b){ return b.length-a.length; });
	nul.tokenizer.operators = ops;	//Useful for outer use, like editArea
	nul.tokenizer.alphabets.oprtr = '(' + map(ops,escaper).join('|') + ')';
};
/*FILE: src/lng/txt/in/null.compile.js*/
/*  NUL language JavaScript framework
 *  (c) 2009 E-med Ware
 *
 * NUL is freely distributable under the terms of GNU GPLv3 license.
 *  For details, see the NUL project site : http://code.google.com/p/nul/
 *
 *--------------------------------------------------------------------------*/


//TODO 3: parser les CDATA et <!-- -->

/**
 * Recognised operators sorted by precedence
 * @type [String,String][]
 * @constant
 */
//l => left built ((a . b) . c)
//r => right built (a . (b . c))
//m => multi (a , b , c)
//p => preceder (- a)
//s => postceder (a !)
//k => kept (a , b , c ,.. d)
nul.operators = [
	['[]','m'],								//booleans:meta OR
	[';','m'],								//booleans:meta AND
	[',','k'],				 				//list
	[',.','s'],				 				//list singleton
	['=>','r'],								//lambda
	['!','p'],
	['?','l'],
	['=','m'], ['!=','r'],					//unify
	['<','r'], ['>','r'], ['<=','r'], ['>=','r'],
	['+','m'], ['-','l'],
	['-','p'], ['#','p'], ['$','p'],
	['*','m'], ['/','l'], ['%','l'],
	['..','l']
];

nul.compiler = new JS.Class(/** @lends nul.compiler# */{
	/**
	 * @constructs
	 * @class The object managing compilation of a text
	 * @param {String} txt Text to compile
	 */
	initialize: function(txt) {
		this.tknzr = new nul.tokenizer(txt);
		this.compiled = new nul.compiled.factory;
	},
	/**
	 * Requires the next token to be an alphanumeric
	 * @return {String} The alphanumeric value
	 * @throw {nul.ex.syntax}
	 */
	alphanum: function() {
		var rv = this.tknzr.pop(['alphanum']);
		if(!rv) nul.ex.syntax('IDE', 'Identifier expected', this.tknzr);
		return rv.value;
	},
	/**
	 * Requires the next token to be a number
	 * @return {Number} The number value
	 * @throw {nul.ex.syntax}
	 */
	number: function() {
		var rv = this.tknzr.pop(['number']);
		if(!rv) nul.ex.syntax('IDE', 'Number expected', this.tknzr);
		return rv.value;
	},
	/**
	 * Takes the list of operands for an expression on the n-th operator level
	 * @param {nul.compiled} firstOp The already-red operand
	 * @param {String} oprtr The expected operator
	 * @param {Number} oprtrLvl tThe operator-level : index in {@link nul.operators}
	 * @return {nul.compiled} The compiled value
	 * @throw {nul.ex.syntax}
	 */
	list: function(firstOp, oprtr, oprtrLvl) {
		var rv = [firstOp];
		switch(oprtr[1])
		{
			case 'k':
				while( this.tknzr.take(oprtr[0]) ) rv.push(this.expression(oprtrLvl));
				if(this.tknzr.take(oprtr[0]+'..')) rv.follow = this.expression(oprtrLvl);
				break;
			case 'm':
				while( this.tknzr.take(oprtr[0]) ) rv.push(this.expression(oprtrLvl));
				break;
			case 'l':
				if( this.tknzr.take(oprtr[0]) ) rv.push(this.expression(oprtrLvl));
				break;
			case 'r':
				if( this.tknzr.take(oprtr[0]) ) rv.push(this.expression(oprtrLvl-1));
				break;
			case 's':
				if( this.tknzr.take(oprtr[0]) ) rv.push('ceded');
				break;
			default: nul.ex.internal('Bad operator type');
		}
		return rv;
	},
	/**
	 * Gets the compiled expression on the sepcified operator-level
	 * @param {Number} oprtrLvl tThe operator-level : index in {@link nul.operators}
	 * @return {nul.compiled} The compiled value
	 * @throw {nul.ex.syntax}
	 */
	expression: function(oprtrLvl, firstOp) {
		if('undefined'== typeof oprtrLvl) oprtrLvl = 0; 
		if(nul.operators.length <= oprtrLvl) return firstOp || this.applied();
		var oprtr = nul.operators[oprtrLvl];
		if(!firstOp) firstOp = this.expression(1+oprtrLvl);
		else firstOp = this.expression(1+oprtrLvl, firstOp);
		if('p'== oprtr[1]) return firstOp;	//don't manage preceders here but in .item
		var rv = [firstOp];
		do
		{
			rv = this.list(firstOp, oprtr, 1+oprtrLvl);
			if(0== rv.length) nul.ex.internal('No components and an operator');
			if(1== rv.length && !rv.follow) return rv[0];
			if('ceded'== rv[1]) firstOp = 
				this.expression(0, this.compiled.postceded(oprtr[0], rv[0]));
			else firstOp = this.compiled.expression(oprtr[0], rv);
		} while('l'== oprtr[1]);
		return firstOp;
	},
	/**
	 * Gather a compiled value and all its post-fixes 
	 * @return {nul.compiled} The compiled value
	 * @throw {nul.ex.syntax}
	 */	
	applied: function(lax) {
		var rv = this.item(lax);
		if(!rv) return;
		do
		{
			var tst;
			if(this.tknzr.take('.')) rv = this.compiled.objectivity(rv, this.alphanum()); 
			else if('[]'!= this.tknzr.token.value && this.tknzr.take('['))
				rv = this.compiled.taking(rv, this.tknzr.rawExpect(']', this.expression())); 				
			else if(tst = this.applied('lax')) rv = this.compiled.application(rv, tst);
			else if(this.tknzr.take('::')) {
				var anm = this.tknzr.rawTake('(') ?
					this.tknzr.rawExpect(')', this.tknzr.fly(')')) :
					this.alphanum();
				rv = this.compiled.composed(rv, anm, this.item());					
			}
			
			else return rv;
		} while(true);
	},
	/**
	 * Read inside an XML node 
	 * @return {nul.compiled} The compiled value
	 * @throw {nul.ex.syntax}
	 */	
	innerXML: function() {
		var comps = [];
		do
		{
			var aTxt = this.tknzr.fly('<');
			if(null=== aTxt) nul.ex.syntax('XML', 'XML node not closed', this.tknzr);
			if(''!== aTxt) comps.push(this.compiled.atom('string', aTxt.replace(/\uffff/g, '\n')));
			if(this.tknzr.rawTake('<(')) comps.push(this.tknzr.rawExpect(')>',this.expression()));
			else if(this.tknzr.rawTake('</')) return comps;
			else if(this.tknzr.rawTake('<')) comps.push(this.xml());
			else nul.ex.syntax('UEI', "Don't know what to do with '"+this.tknzr.token.value+"'", this.tknzr, 'token');
		} while(true);
	},
	/**
	 * Read an XML node 
	 * @return {nul.compiled} The compiled value
	 * @throw {nul.ex.syntax}
	 */	
	xml: function() {
		var node = this.alphanum(), attr, attrs = {};
		while(attr = this.tknzr.pop(['alphanum']))
		{
			this.tknzr.expect('=');
			attrs[attr.value] = this.item();
		}
		if(this.tknzr.rawTake('/>')) return this.compiled.xml(node, attrs, []);
		this.tknzr.rawExpect('>');
		var comps = this.innerXML();
		this.tknzr.expect(node);
		return this.tknzr.rawExpect('>', this.compiled.xml(node, attrs, comps));
	},
	/**
	 * Read an item without precedance
	 * @param {Boolean} lax Prevent to read an item that should be understood as an operation
	 * @return {nul.compiled} The compiled value
	 * @throw {nul.ex.syntax}
	 */	
	item: function(lax) {
		var rv;
		if('eof'!= this.tknzr.token.type) {
			//hard-code
			if(this.tknzr.rawTake('<{')) return this.compiled.hardcode(eval(this.tknzr.rawExpect('}>', this.tknzr.fly('}>'))));
			
			//declaration
			if(this.tknzr.take('\\/')) return this.compiled.definition(this.alphanum(), this.expression());
			//Singletons
			if(this.tknzr.take('{')) {
				if(this.tknzr.take('}')) return this.compiled.set();
				var sr;
				if(this.tknzr.take(':')) sr = this.alphanum();
				return this.tknzr.expect('}', this.compiled.set(this.expression(), sr));
			}
			//Global' attribute
			if(this.tknzr.take('.')) return this.compiled.objectivity(this.compiled.atom('alphanum', ''), this.alphanum());
			//Parenthesis
			if(this.tknzr.take('(')) return this.tknzr.expect(')', this.expression());
			if(!lax) {
				if(this.tknzr.take('<')) return this.xml();
				for(var p= 0; p<nul.operators.length; ++p) {
					var oprtr = nul.operators[p];
					if('p'== oprtr[1] && this.tknzr.take(oprtr[0]))
						return this.compiled.preceded(oprtr[0], this.expression(1+p));
				}
			}
			rv = this.tknzr.pop(['alphanum', 'number', 'string']);
		}
		if(!rv && !lax) nul.ex.syntax('ITE', 'Item expected', this.tknzr);
		if(rv) return this.compiled.atom(rv.type, rv.value);
	}
});

/**
 * Make a compiled value out of a text.
 * @param {String} txt
 * @return {nul.compiled}
 * @throw {nul.ex.syntax}
 */
nul.compile = function(txt)
{
	var rv = new nul.compiler(txt+'\n');
	var ev = rv.expression();
	if(rv.tknzr.token.type != 'eof') nul.ex.syntax('TOE', 'Unexpected: "'+rv.tknzr.token.value+"'.", rv.tknzr, 'token');
	return ev;
};

/**
 * Make a compiled value out of an XML content.
 * @param {XML} txt
 * @return {nul.compiled}
 * @throw {nul.ex.syntax}
 */
nul.compile.xml = function(txt)
{
	var rv = new nul.compiler(txt+'</');
	var ev = rv.innerXML();
	if(rv.tknzr.token.type != 'eof') nul.ex.syntax('TOE', 'Unexpected: "'+rv.tknzr.token.value+"'.", this.tknzr, 'token');
	return ev;
};
/*FILE: src/lng/txt/out/null.txt.js*/
/*  NUL language JavaScript framework
 *  (c) 2009 E-med Ware
 *
 * NUL is freely distributable under the terms of GNU GPLv3 license.
 *  For details, see the NUL project site : http://code.google.com/p/nul/
 *
 *--------------------------------------------------------------------------*/


//TODO 3: remove src/lng/txt/out/null.txt.html, still refered in dependance html output

nul.txt = new JS.Class(/** @lends nul.txt# */{
	/**
	 * @class Text output kernel
	 * @constructs
	 */
	initialize: function() {
		this.drawing = [];
	},
	/**
	 * Main function, making a string out of an expression
	 * @param {nul.expression} xpr
	 */
	toText: function(xpr) {
		if(!this.beginDraw(xpr)) return this.recurStr;
		try {
			return this.wrap(
				(this.draw[xpr.expression]||this.draw.other)
					.apply(this.outp(xpr)),
				xpr);
		}
		finally { this.endDraw(xpr); }
	},
	/**
	 * Pairs can have several writing depending on their constitution : singleton { 1 }, list (1, 2, 3) or set { 1 [] 2 [] 3 }.
	 * This function call one of the three sub-function.
	 * @param {nul.expression} xpr
	 */
	dispatchPair: function(xpr) {
		var lstd = xpr.listed();
		if(xpr.isList()) {
			if(1== lstd.length && !lstd.follow)
				return this.draw.singleton.apply(xpr, []);
			return this.draw.list.apply(xpr, [lstd]);
		} 
		return this.draw.set.apply(xpr, [lstd]);
	},
	/**
	 * Called when an expression is about to be drawn
	 * @param {nul.expression} xpr
	 */
	beginDraw: function(xpr) {
		if(this.drawing.include(xpr)) return false;
		this.drawing.push(xpr);
		return true;
	},
	/**
	 * Called for each expression that have been drawn
	 * @param {nul.expression} xpr
	 */
	endDraw: function(xpr) {
		if(nul.debugged) nul.assert(xpr==this.drawing.pop(), 'Drawing consistency');
		else this.drawing.pop();
	}
});
/*FILE: src/lng/xpr/obj/defined/null.obj.list.js*/
/*  NUL language JavaScript framework
 *  (c) 2009 E-med Ware
 *
 * NUL is freely distributable under the terms of GNU GPLv3 license.
 *  For details, see the NUL project site : http://code.google.com/p/nul/
 *
 *--------------------------------------------------------------------------*/


nul.obj.list = new JS.Class(nul.obj.defined, /** @lends nul.obj.list */{
	/**
	 * @class Any expression that act as a list or a set
	 * @extends nul.obj.defined
	 * @constructs
	 */
	initialize: function() {
		this.callSuper();
	},
	
	/**
	 * Yes, it is a list.
	 */
	isList: function() { return true; },
	/**
	 * <a href="http://code.google.com/p/nul/wiki/Summary">Summary</a>: The set who give, for each parameter, the recursive parameter applied
	 * @function
	 * @return {nul.obj.list}
	 */
	recursion: nul.summary('recursion').describe('Recursion analyse'),
	
	/** <a href="http://code.google.com/p/nul/wiki/Summary">Summary</a> computation of {@link recursion} */
	sum_recursion: function() { return nul.obj.empty; }
});
/*FILE: src/lng/xpr/obj/defined/null.obj.pair.js*/
/*  NUL language JavaScript framework
 *  (c) 2009 E-med Ware
 *
 * NUL is freely distributable under the terms of GNU GPLv3 license.
 *  For details, see the NUL project site : http://code.google.com/p/nul/
 *
 *--------------------------------------------------------------------------*/


nul.obj.pair = new JS.Class(nul.obj.list, /** @lends nul.obj.pair# */{
	/**
	 * @class Pair used to build lists : a head and a tail.
	 * @extends nul.obj.list
	 * @constructs
	 * @param {nul.xpr.possible} first List head
	 * @param {nul.xpr.object} second List tail
	 */
	initialize: function(first, second) {
		nul.xpr.use(first); nul.obj.use(second);
		/** @type nul.xpr.possible */
		this.first = nul.xpr.possible.cast(first);
		/** @type nul.xpr.object */
		this.second = second;
		this.callSuper();
	},
	
//////////////// Summary
	
	/**
	 * Summary: Specific pair summary to retrieve the list corresponding to the trailing pair values.
	 * @function
	 * @returns {nul.xpr.possible[]}
	 */
	listed: nul.summary('listed'),

	/**
	 * Summary calculation of 
	 * @function
	 * @returns {nul.xpr.possible[]}
	 */
	sum_listed: function() {
		var rv = [];
		var brwsr = this;
		do {
			rv.push(brwsr.first);
			brwsr = brwsr.second;
		} while('pair'== brwsr.expression);
		if('&phi;'!= brwsr.expression) rv.follow = brwsr;
		return rv;
	},

//////////////// nul.obj.defined implementation

	/**
	 * Try to unify elements
	 * @param {nul.xpr.object} o
	 * @param {nul.xpr.knowledge} klg
	 * @return {nul.xpr.object}
	 */
	subUnified: function(o, klg) {
		if('&phi;'== o.expression) {
			klg.oppose(this.first.knowledge);
			return klg.unify(this.second, o);
		}
		if('pair'!= o.expression) nul.fail(o, ' not a pair');
		if(this === o) return true;
		if(this.first.knowledge === o.first.knowledge)
			return (new nul.obj.pair(
				klg.unify(this.first.value, o.first.value),
				klg.unify(this.second, o.second))).built();
		nul.debugged.warn('error')('Pair fuzzy comparison not yet implemented');
		if(this.toString() === o.toString()) return true;
		nul.fail(o, ' not unifiable pair');
	},
	
	/**
	 * Extract an object o that fit one of these possibles (either the first possible, either subHas from second)
	 * @param {nul.xpr.object} o
	 * @param {nul.xpr.object[]} attrs
	 * @return {nul.xpr.object[]|nul.xpr.possible[]}
	 */
	subHas: function(o, attrs) {
		this.use(); nul.obj.use(o);
		//TODO 2: use attrs?
		//TODO 3: summarise a tree of fixed values (=> ram db)
		//make a table fct also
		var rv = [];
		try { rv.push(this.first.extract(o)); }
		catch(err) { nul.failed(err); }
		return rv.pushs(this.second.having(o, attrs));
	},

//////////////// nul.xpr.object implementation

	/** @constant */
	properties: {
		'$ ': function() {
			return this.recursion();
		},
		'# ': function(klg) {
			var flw = klg.attribute(this.second, '# ');
			var mn = this.first.knowledge.minXst();
			var mx = this.first.knowledge.maxXst();
			var tl; 
			if(mn == mx) tl = new nul.obj.litteral.number(mn);
			else {
				tl = klg.newLocal('#');
				klg.belong(tl, new nul.obj.range(mn, mx));
			}
			return new nul.obj.operation.Nary('+', [tl, flw]);
		},
		'': function() { return nul.obj.litteral.tag.set; }
	},

//////////////// nul.expression implementation

	/** @constant */
	expression: 'pair',
	/** @constant */
	components: {
		'first': {type: 'nul.xpr.possible', bunch: false},
		'second': {type: 'nul.xpr.object', bunch: false}
	},
	/**
	 * <a href="http://code.google.com/p/nul/wiki/Summary">Summary</a>: Weither this pair is a list
	 * @function
	 * @return {Boolean}
	 */
	isList: nul.summary('isList'),
	/** <a href="http://code.google.com/p/nul/wiki/Summary">Summary</a> computation of {@link isList} */
	sum_isList: function() {
		return this.first.knowledge.isA(nul.klg.ncndtnl) && (!this.second.isList || this.second.isList());
	},
	/** Build this set so that it is a following of pairs which values are most simplified as possible */
	built: function() {
		if(this.first.distribuable()) {
			var dList = this.first.distribute();
			if(1!= dList.length) return nul.obj.pair.list(this.second, dList);
			this.first = dList[0];
		}
		return this.callSuper();
	},
	
	/** <a href="http://code.google.com/p/nul/wiki/Summary">Summary</a> computation of {@link recursion} */
	sum_recursion: function() {
		if(!this.selfRef) this.selfRef = nul.execution.name.gen('obj.local.self');
		var rv = [];
		for(var p=this; p.isA(nul.obj.pair); p=p.second)
			rv.pushs(p.first.knowledge.modifiable().sumRecursion(this.selfRef, [], p.first.value));
		return nul.obj.pair.list(null, rv);
	}

});

/**
 * Helper to create triling pairs from a list
 * @param flw Trail of this list. Will be the empty set if not specified
 * @param elms The elements that will be the 'first' of each pairs.
 * @return {nul.obj.pair} The built pair
 * @throws {nul.ex.failure}
 */
nul.obj.pair.list = function(/**nul.xpr.object|null*/flw, /**nul.xpr.possible[]*/elms) {
	elms = beArrg(arguments, 1);
	var rv = flw || nul.obj.empty;
	while(elms.length) {
		var elm = elms.pop();
		nul.xpr.use(elm);
		rv = (new nul.obj.pair(elm, rv)).built();
	}
	return rv;
};
/*FILE: src/lng/xpr/klg/null.xpr.possible.js*/
/*  NUL language JavaScript framework
 *  (c) 2009 E-med Ware
 *
 * NUL is freely distributable under the terms of GNU GPLv3 license.
 *  For details, see the NUL project site : http://code.google.com/p/nul/
 *
 *--------------------------------------------------------------------------*/


nul.xpr.possible = new JS.Class(nul.expression, /** @lends nul.xpr.possible# */{
	/**
	 * @class A value associated with a knowledge : A value that can be unified to several different defined object, along some conditions.
	 * @extends nul.expression
	 * @constructs
	 * @param {nul.xpr.object} value
	 * @param {nul.xpr.knowledge} knowledge
	 */
	initialize: function(value, knowledge) {
		this.callSuper(null, null);
		if(value) {
			if(!knowledge) knowledge = nul.klg.always;
			nul.obj.use(value); nul.klg.use(knowledge);
			/** @type nul.xpr.object */
			this.value = value;
			/** @type nul.xpr.knowledge */
			this.knowledge = knowledge;
		}
		this.alreadyBuilt();
	},

//////////////// public

	/**
	 * The knowledge now knows all what this possible knows - gets the value expression then
	 * @param {nul.xpr.knowledge} klg destination knowledge
	 * @return {nul.xpr.object} This modified value (to refer the new knowledge)
	 */
	valueKnowing: function(klg) {
		return klg.merge(this.knowledge, this.value);
	},
	
	/**
	 * Returns a possible, this unified to an object
	 * @param {nul.xpr.object} o
	 * @return {nul.xpr.possible}
	 * @throws {nul.ex.failure}
	 */
	extract: function(o) {
		//var klg = this.knowledge.modifiable();
		var klg = new nul.xpr.knowledge();
		//Merge because we need to create a new context reference in case of half-recursion
		var rv = klg.wrap(klg.unify(klg.merge(this.knowledge, this.value), o));
		if(nul.debugged) nul.assert(!rv.dependance().usages[klg.name], 'Out of knowledge, no more deps');
		return rv;
	}.describe('Extraction'),
	
	/**
	 * Determine wether the resolution engine can distribute anything
	 * @return {Boolean}
	 */
	distribuable: function() {
		return this.knowledge.distribuable();
	},
	
	/**
	 * Use the resolution engine : make several possibles without ior3
	 * @return {nul.xpr.possible[]}
	 */
	distribute: function() {
		if(!this.knowledge.distribuable()) return [this];
		var val = this.value;
		return maf(this.knowledge.distribute(), function() {
			try { return this.wrap(val); } catch(e) { nul.failed(e); }
		});
	},
	
	/**
	 * @param {document} doc
	 * @return {XMLElement}
	 * @throw {nul.ex.semantic}
	 * TODO 2 returns Element
	 */
	XML: function(doc) {
		if(nul.klg.always != this.knowledge) //TODO 2: if possible too fuzzy, get a "loading" node 
			nul.ex.semantic('XML', 'No XML fixed representation for fuzzy expression', this);
		return this.value.XML(doc);
	},	
	
//////////////// nul.expression summaries

	sum_dependance: function() {
		var rv = this.callSuper();
		this.usage = rv.use(this.knowledge);
		return rv;
	},

//////////////// nul.expression implementation
	
	/** @constant */
	expression: 'possible',
	/** @constant */
	components: {
		'value': {type: 'nul.xpr.object', bunch: false},
		'knowledge': {type: 'nul.xpr.knowledge', bunch: false}
	},
	chew: function() {
		nul.klg.use(this.knowledge);
		return this.knowledge.modifiable().wrap(this.value);
	}.describe('Possible reformulation'),

////////////////	Internals

	/**
	* Change self references to the given self-refered object
	* @param {nul.obj.defined} recursion The object that contains 'this' and makes recursion
	*/
	beself: function(recursion) {
		var fz = this;	//TODO 2: possible#beself
		//1 - remove in knowledge : x in y : x is value and y self-ref
		//TODO O: ne faire cela que si dependance de selfref
		/*var klg = this.knowledge.modifiable();
		var ec = klg.access[this.value];
		if(ec) {
			nul.xpr.use(ec, 'nul.klg.eqClass');
			ec = klg.freeEC(ec);
			for(var b=0; ec.belongs[b]; ++b) {
				var blg = ec.belongs[b];
				if(nul.obj.local.is(blg) && nul.obj.local.self.ref == blg.klgRef && slf.selfRef== blg.ndx) {
					ec.belongs.splice(b,1);
					klg.minMult = 0;
					break;
				}
			}
			klg.ownEC(ec);
			fz = klg.wrap(this.value);
		}*/
		//2 - replace the self-reference by the set
		return new nul.xpr.object.reself(recursion.selfRef, recursion).browse(fz);	//TODO 2: reself other fct ?
		//return fz.reself(slf, selfRef); slf.reself(..., fz) ?
	}
});

nul.xpr.failure = nul.xpr.possible.prototype.failure = new JS.Singleton(nul.xpr.possible, /** @lends nul.xpr.failure# */{
	/**
	 * Singleton
	 * @class Specific possible that never give any value.
	 * @extends nul.xpr.possible
	 * @constructs
	 */
	initialize: function() { this.callSuper(); },
	/** @constant */
	expression: 'possible',
	/** @constant */
	components: {},
	distribuable: function() { return true; },
	distribute: function() { return []; }
});

/**
 * Have a possible for sure. Made with nul.klg.always if an object is given
 * @param {nul.xpr.possible|nul.xpr.object} o
 */
nul.xpr.possible.cast = function(o) {
	if('possible'== o.expression) return o;
	return new nul.xpr.possible(o);
};
/*FILE: src/lng/algo/null.recur.js*/
/*  NUL language JavaScript framework
 *  (c) 2009 E-med Ware
 *
 * NUL is freely distributable under the terms of GNU GPLv3 license.
 *  For details, see the NUL project site : http://code.google.com/p/nul/
 *
 *--------------------------------------------------------------------------*/


nul.expression.include(/** @lends nul.expression# */{
	/**
	 * Retrieve this expression value after programmer' algorythm (recursive) is executed.
	 * @returns {nul.expression}
	 */
	recur: function() { return this; }
});

nul.obj.pair.include(/** @lends nul.obj.pair# */{
	/**
	 * Retrieve this expression value after programmer' algorythm (recursive) is executed : applied to each elements of the set.
	 * @returns {nul.obj.pair}
	 */
	recur: function() {
		return new nul.obj.pair(this.first.recur(), this.second.recur());
	}
});

nul.xpr.possible.include(/** @lends nul.xpr.possible# */{
	/**
	 * Retrieve this expression value after programmer' algorythm (recursive) is executed. If self-reference as belonging, expand them 
	 * @returns {nul.xpr.possible}
	 */
	recur: function() {
		var klg = this.knowledge;
		for(var c=0; c<klg.eqCls.length; ++c) if(klg.eqCls[c].belongs[0].selfRef) {
			//TODO R
		}
		return this;
	}
});
/*FILE: src/lng/algo/null.solve.js*/
/*  NUL language JavaScript framework
 *  (c) 2009 E-med Ware
 *
 * NUL is freely distributable under the terms of GNU GPLv3 license.
 *  For details, see the NUL project site : http://code.google.com/p/nul/
 *
 *--------------------------------------------------------------------------*/

/**
 * Interface function of Solver.
 * Gets a distributed list of knowledges that don't contains ior3 anymore
 * @param {nul.xpr.knowledge} klg
 * @return array(nul.xpr.knowledge)
 */
nul.solve = function() {
	this.modify();
	var toDistr = [this];
	var rv = [];
	
	while(toDistr.length) {
		var tdst = toDistr.shift().simplify();
		if(!tdst.ior3.length) rv.push(tdst);
		else if(1== tdst.ior3.length) {	//if only one ior3s
			var c;
			for(var c=0; tdst.ior3[0].choices[c+1]; ++c) {
				var tried = tdst.clone();
				tried.ior3 = [];
				try {
					tried.merge(tdst.ior3[0].choices[c]);
					toDistr.push(tried);
				} catch(e) { nul.failed(e); }
			}
			var rmnng = tdst.ior3[0].choices[c];
			tdst.ior3 = [];
			try {
				tdst.merge(rmnng);
				toDistr.push(tdst);
			} catch(e) { nul.failed(e); }
		} else {	//if some ior3s
			var jgmnt = map(tdst.eqCls);
			var jgEC = map(tdst.eqCls);
			jgmnt.pushs(tdst.veto);
			for(var v=0; tdst.veto[v]; ++v) jgEC.pushs(tdst.veto[v].eqCls);
			var jdps = new nul.dependance();
			for(var j=0; jgmnt[j]; ++j) jdps.also(jgmnt[j].dependance());
			
			var better = {enth:0};
			for(var i=0; tdst.ior3[i]; ++i) for(var j=0; tdst.ior3[i].choices[j]; ++j) {
				var thisEnth = nul.solve.information(jdps, jgmnt, jgEC, tdst.ior3[i].choices[j], tdst);
				if(thisEnth > better.enth) better = { cases: i, choice: j, enth: thisEnth };
			}
			if(!better.enth) rv.push(tdst);	//No way to bring infos by distributing ... TODO O: modify 'distribuable' ?
			else {	//if some information can be brouhht
		
				if(nul.debugged) nul.debugged.info('Resolution')('Possibility', tdst.ior3[better.cases].choices[better.choice]);
			
				try {
					var choosen = tdst.clone();		//The case when the choice is taken
					choosen.ior3.splice(better.cases, 1);
					choosen.merge(tdst.ior3[better.cases].choices[better.choice]);
					toDistr.push(choosen);
				} catch(e) { nul.failed(e); }
				if(nul.debugged) nul.assert(2<= tdst.ior3[better.cases].choices.length, 'Choice length always at least 2');
				try {
					if(2== tdst.ior3[better.cases].choices.length) {
						tdst.merge(tdst.ior3[better.cases].choices[1-better.choice]);
						tdst.ior3.splice(better.cases, 1);
					} else {
						var nior3 = tdst.ior3[better.cases].modifiable();
						nior3.choices.splice(better.choice, 1);
						tdst.ior3[better.cases] = nior3.built();
					}
					toDistr.push(tdst);
				} catch(e) { nul.failed(e); }
			}
		}
	}
	return rv;
}.describe('Resolution');

/**
 * @param {nul.xpr.knowledge[]} chxs
 */
nul.solve.ior3 = function(chxs) {
	return chxs.mar(chxs[0].distributed);
};

/**
 * Find out how much information is brought to the components of jgmnt by a choice made in ior3
 * @param {nul.dependance} dps Dependance of jgmnt
 * @param {nul.expression[]} jgmnt List of expression for which information can be brought
 * @param {nul.klg.eqClass[]} jgEc List of eqClass appearing in the jugment
 * @param {nul.xpr.knowledge} choice A choice to make
 * @param {nul.xpr.knowledge} klg The knowledge the choice is made in
 */
nul.solve.information = function(dps, jgmnt, jgEC, choice, klg) {
	//TODO O: Trial - real study should be made
	nul.klg.mod(klg); nul.klg.use(choice); /*nul.xpr.are(jgmnt);*/
	var jUsage = dps.usage(klg);
	var cUsage = choice.dependance().usage(klg);
//1- local enthropy : more locals are shared, more enthropy is shared
	var lclSharePoints = 0;
	if(!isEmpty(choice.dependance().usage(klg).local)) ++lclSharePoints;	//TODO 4: other than 0 or 1 if dependances
//2- equivalence class merging 
	var merger = [];
	var mergePoints = 0;
	for(var ec=0; choice.eqCls[ec]; ++ec) {
		merger.push([]);
		for(var eq=0; choice.eqCls[ec].equivls[eq]; ++eq) {
			var klga = klg.access[choice.eqCls[ec].equivls[eq]];
			if(klga) merger[ec].push(klga);
		}
		mergePoints += Math.pow(2, merger[ec].length);
	}
//3- attributes collision	
	var aClsnsPoints = 0;	
	//TOTEST
	var acs = choice.info();
	for(var ec=0; jgEC[ec]; ++ec) {
		var attr = map(jgEC[ec].attribs, function() { return [this]; });
		for(var eq=0; jgEC[ec].equivls[eq]; ++eq) {
			var cEC = acs[jgEC[ec].equivls[eq]];
			if(cEC) {
				var n = choice.eqCls.indexOf(cEC);
				var agrp = [cEC.attribs];
				for(var mec=0; merger[n][mec]; ++mec) agrp.push(merger[n][mec].attribs);
				for(var ag=0; agrp[ag]; ++ag) for(var a in agrp[ag]) {
					if(!attr[a]) {
						attr[a] = [];
						--aClsnsPoints;	//?
					}
					if(!attr[a].include(cEC.attribs[a])) {
						attr[a].push(cEC.attribs[a]);
						++aClsnsPoints;
					}
				}
			}
		}
	}
	return lclSharePoints+aClsnsPoints+mergePoints;
};
/*FILE: src/krnl/null.dependance.js*/
/*  NUL language JavaScript framework
 *  (c) 2009 E-med Ware
 *
 * NUL is freely distributable under the terms of GNU GPLv3 license.
 *  For details, see the NUL project site : http://code.google.com/p/nul/
 *
 *--------------------------------------------------------------------------*/

//TODO O: don't feed back an object { local:{..deps..} } : directly feed back {..deps..} instead
nul.dependance = new JS.Class(/** @lends nul.dependance# */{
	/**
	 * @class A list of dependancies toward knowledges or external resources
	 * @constructs
	 * @param {nul.obj.local|nul.obj.data} dep
	 */
	initialize: function(dep) {
		this.usages = {};
		if(dep) {
			nul.obj.is(dep);
			//if(obj) this.depend(dep, 'local', ndx, obj); else 
			if(nul.obj.local.def(dep)) this.depend(dep.klgRef, 'local', dep.ndx, dep);
			else if(nul.obj.data.def(dep)) {
				var ctxName = dep.source.context.toString();
				if(!nul.dependance.contexts[ctxName]) nul.dependance.contexts[ctxName] = dep.source.context; 
				this.depend(ctxName, 'local', dep.source.index, dep);
			} else nul.ex.internal('No dependance defined for '+dep.expression);
		}
	},
	
//////////////// private
	
	/** @private */
	depend: function(klgNm, type, ndx, objs) {
		if(!$.isArray(objs)) {
			objs = [objs];
			objs.number = 1;
		}
		if(!this.usages[klgNm]) this.usages[klgNm] = { local: {} };
		if(!this.usages[klgNm][type][ndx]) {
			this.usages[klgNm][type][ndx] = [];
			this.usages[klgNm][type][ndx].number = 0;
		}
		this.usages[klgNm][type][ndx].union(objs);
		this.usages[klgNm][type][ndx].number += objs.number;
	},

//////////////// public

	/**
	 * Retrieve a usage
	 * @param {nul.xpr.knowledge} klg
	 * @return {nul.dependance.usage}
	 */
	usage: function(klg) {
		return this.usages[klg.name] || { local: {} };
	},

	/**
	 * Retrieve a usage and remove it from the list
	 * @param {nul.xpr.knowledge} klg
	 * @return {nul.dependance.usage}
	 */
	use: function(klg) {
		try{ return this.usage(klg); }
		finally { delete this.usages[klg.name]; }
	},

	/**
	 * Depends also on all what 'deps' depends on
	 * @param {nul.dependance} deps
	 * @return {nul.dependance}
	 */
	also: function(deps) {
		for(var klgNm in deps.usages)
			for(var type in deps.usages[klgNm])
				for(var ndx in deps.usages[klgNm][type])
					this.depend(klgNm, type, ndx, deps.usages[klgNm][type][ndx]);
		return this;
	},

//////////////// Text output

	/**
	 * Draw a HTML description of these dependances
	 * @return {HTML}
	 */
	toHtml : function() {
		var rv = [];
		for(var krf in this.usages) {
			var ld = this.usages[krf].local;
			var rld = [];
			for(var l in ld) rld.push(html.td(l+':'+ld[l].number));
			rv.push(html.th(krf) + rld.join(''));
		}
		return html.table(rv.join(''));
	},
	
	/**
	 * Draw a flat description of these dependances
	 * @return {String}
	 */
	toFlat : function() {
		var rv = [];
		for(var krf in this.usages) {
			var ld = this.usages[krf].local;
			var rld = [];
			for(var l in ld) rld.push(l+':'+ld[l].number);
			rv.push(krf + '[' + rld.join(', ') + ']');
		}
		return rv.join(' ');
	}
});

/**
 * External data-contexts dictionary.
 * @type {nul.data.context[String]} 
 */
nul.dependance.contexts = {};
/*FILE: src/lng/xpr/obj/undefnd/null.obj.undefnd.js*/
/*  NUL language JavaScript framework
 *  (c) 2009 E-med Ware
 *
 * NUL is freely distributable under the terms of GNU GPLv3 license.
 *  For details, see the NUL project site : http://code.google.com/p/nul/
 *
 *--------------------------------------------------------------------------*/


nul.obj.undefnd = new JS.Class(nul.xpr.object, /** @lends nul.obj.undefnd# */{
	/**
	 * @class Undefined object
	 * @extends nul.xpr.object
	 * @constructs
	 */
	initialize: function() {
		this.callSuper();
	},
	defined: false
});
/*FILE: src/lng/xpr/obj/defined/null.obj.lambda.js*/
/*  NUL language JavaScript framework
 *  (c) 2009 E-med Ware
 *
 * NUL is freely distributable under the terms of GNU GPLv3 license.
 *  For details, see the NUL project site : http://code.google.com/p/nul/
 *
 *--------------------------------------------------------------------------*/


nul.obj.lambda = new JS.Class(nul.obj.defined, /** @lends nul.obj.lambda# */{
	/**
	 * @class Represents the application of a point to an image.
	 * @example point &rArr; image
	 * @constructs
	 * @extends nul.obj.defined
	 * @param {nul.xpr.object} point
	 * @param {nul.xpr.object} image
	 */
	initialize: function(point, image) {
		/** @type nul.xpr.object */
		this.point = point;
		/** @type nul.xpr.object */
		this.image = image;
		this.callSuper();
		this.alreadyBuilt();
	},

//////////////// nul.obj.defined implementation

	/**
	 * Lambdas have no attributes
	 * @throws {nul.ex.failure}
	 */
	attribute: function() { nul.fail('Lambdas have no attributes'); },
	
	/**
	 * Unify component by component
	 * @param {nul.obj.defined} o The other object to unify to
	 * @param {nul.xpr.knowledge} klg
	 * @returns {nul.obj.lambda} The lambda of unified components
	 * @throws {nul.ex.failure}
	 */
	subUnified: function(o, klg) {
		if('lambda'!= o.expression) nul.fail(o, ' not a lambda');
		return new nul.obj.lambda(
			klg.unify(this.point, o.point),
			klg.unify(this.image, o.image));
	},

	/**
	 * Lambdas contain nothing
	 * @throws {nul.ex.failure}
	 */
	subHas: function() { nul.fail('Lambdas contains nothing'); },
		
//////////////// nul.expression implementation

	/** @constant */
	expression: 'lambda',
	/** @constant */
	components: {
		'point': {type: 'nul.xpr.object', bunch: false},
		'image': {type: 'nul.xpr.object', bunch: false}
	}
});
/*FILE: src/lng/xpr/obj/defined/null.obj.litteral.js*/
/*  NUL language JavaScript framework
 *  (c) 2009 E-med Ware
 *
 * NUL is freely distributable under the terms of GNU GPLv3 license.
 *  For details, see the NUL project site : http://code.google.com/p/nul/
 *
 *--------------------------------------------------------------------------*/


nul.obj.litteral = new JS.Class(nul.obj.defined, /** @lends nul.obj.litteral# */ {
	/**
	 * @class Abstract litteral - hold a javascript litteral value
	 * @constructs
	 * @extends nul.obj.defined
	 * @param {Number|String|Boolean} val Javascript value to hold.
	 */
	initialize: function(val) {
		this.callSuper();
		/** @constant */
		this.value = val;
		this.alreadyBuilt();
	}
});

/**
 * @class
 * @extends nul.obj.litteral
*/
nul.obj.litteral.string = new JS.Class(nul.obj.litteral, /** @lends nul.obj.litteral.string# */{

////////////////	nul.xpr.defined implementation
	
	/** @constant */
	properties: {
		'# ': function() { return new nul.obj.litteral.number(this.value.length); },
		'': function() { return nul.obj.litteral.tag.string; }
	},
	
	/**
	 * @param {document} doc
	 * @return {XMLElement}
	 * TODO 2 returns Element
	 */
	XML: function(doc) {
		return doc.createTextNode(this.value);	//TODO 2: remplacer par des &...; ?
	},
	
//////////////// nul.xpr.object implementation

	/** Strings contain nothing */
	subHas: function() { nul.fail('Strings contain nothing'); },

//////////////// nul.expression implementation

	/** @constant */
	expression: 'string',
	/** <a href="http://code.google.com/p/nul/wiki/Summary">Summary</a> computation of {@link index} */
	sum_index: function() { return this.indexedSub(this.value.replace(']','[|]')); }
});

/**
 * @class
 * @extends nul.obj.litteral
*/
nul.obj.litteral.number = new JS.Class(nul.obj.litteral, /** @lends nul.obj.litteral.number# */{

////////////////	nul.xpr.defined implementation
	
	/** @constant */
	properties: {
		'text': function() { return nul.obj.litteral.make(this.value.toString()); },
		'': function() { return nul.obj.litteral.tag.number; }
	},

//////////////// nul.xpr.object implementation

	/**
	 * TODO 3: {2[Q]} ==> ( Q _, Q _ ) ?
	 */ 
	subHas: function(o) {
		nul.fail('TODO 3: number has');
	},
	
//////////////// nul.expression implementation

	/** @constant */
	expression: 'number',
	/** <a href="http://code.google.com/p/nul/wiki/Summary">Summary</a> computation of {@link index} */
	sum_index: function() { return this.indexedSub(this.value.toString().replace(']','[|]')); }
});

/**
 * @class
 * @name nul.obj.litteral.boolean 
 * @extends nul.obj.litteral 
 */
nul.obj.litteral['boolean'] = new JS.Class(nul.obj.litteral, /** @lends nul.obj.litteral.boolean# */{
	
////////////////	nul.xpr.defined implementation
	
	/** @constant */
	properties: {
		'# ': function() { return nul.obj.litteral.make(this.value.length); },
		'': function() { return nul.obj.litteral.tag['boolean']; }
	},
	
	/** @constant */
	attributes: {},
	
//////////////// nul.xpr.object implementation

	/** Booleans contain nothing */
	subHas: function() { nul.fail('Booleans contain nothing'); },

//////////////// nul.expression implementation

	/** @constant */
	expression: 'boolean',
	/** <a href="http://code.google.com/p/nul/wiki/Summary">Summary</a> computation of {@link index} */
	sum_index: function() { return this.indexedSub(this.value?'T':'F'); }
});

/**
 * Make a litteral from a javascript value - choose the wright class
 */
nul.obj.litteral.make = function(v) {
	if(nul.debugged) nul.assert(nul.obj.litteral[typeof v], (typeof v)+' is a litteral type');
	if('boolean'== typeof v) return nul.obj.litteral['boolean'][v?'true':'false'];
	return new nul.obj.litteral[typeof v](v);
};

/**
 * Hard-coding of the booleans : no generic definition while they are two
 */
nul.obj.litteral['boolean']['true'] = new nul.obj.litteral['boolean'](true);
nul.obj.litteral['boolean']['false'] = new nul.obj.litteral['boolean'](false);
nul.obj.litteral['boolean']['true'].attributes['! '] = nul.obj.litteral['boolean']['false'];
nul.obj.litteral['boolean']['false'].attributes['! '] = nul.obj.litteral['boolean']['true'];

/**
 * Virtual 'tags' of litterals
 */
nul.obj.litteral.tag = {
	string: new nul.obj.litteral.string('#text'),
	number: new nul.obj.litteral.string('#number'),
	'boolean': new nul.obj.litteral.string('#boolean'),
	set: new nul.obj.litteral.string('#set')
};
/*FILE: src/lng/xpr/obj/defined/null.obj.sets.js*/
/*  NUL language JavaScript framework
 *  (c) 2009 E-med Ware
 *
 * NUL is freely distributable under the terms of GNU GPLv3 license.
 *  For details, see the NUL project site : http://code.google.com/p/nul/
 *
 *--------------------------------------------------------------------------*/


//TODO 3: express these as descendant from nul.obj.hc
nul.obj.hcSet = new JS.Class(nul.obj.list, /** @lends nul.obj.hcSet */{
	/**
	 * @class A set hard-coded in javascript
	 * @extends nul.obj.defined
	 * @constructs
	 */
	initialize: function() {
		this.callSuper();
		this.alreadyBuilt();
	},
	
	/**
	 * Consider this set is not a transformation
	 */
	subHas: function(o, att, typeAttr) {
		nul.obj.use(o);
		if(o.isA(nul.obj.defined)) return [];
		if(!att[''] || 'string'!= att[''].expression || typeAttr != att[''].value) {
			var klg = new nul.xpr.knowledge();
			klg.attributed(o, '', new nul.obj.litteral.string(typeAttr));
			klg.belong(o, this);
			return [klg.wrap(o)];
		}
	},

	length: pinf,

//////////////// nul.obj.defined implementation

	/** @constant */
	properties: {
		'# ': function() { return nul.obj.litteral.make(this.length); },
		'': function() { return nul.obj.litteral.tag.set; }
	}
});

/**
 * Singleton
 * @class Empty set : &phi;
 * @extends nul.obj.hcSet
 */
nul.obj.empty = new JS.Singleton(nul.obj.hcSet, /** @lends nul.obj.empty# */{
	listed: function() { return []; },
	
	intersect: function(o) {
		nul.fail('No intersection with ', this);
	},
	subHas: function() { return []; },
	
	/** @constant */
	expression: '&phi;',
//////////////// nul.obj.defined implementation

	/** @constant */
	length: 0
	
});

/**
 * Singleton
 * @class Set of number litterals
 * @extends nul.obj.hcSet
 */
nul.obj.number = new JS.Singleton(nul.obj.hcSet, /** @lends nul.obj.number# */{
	intersect: function(o, klg) {
		if('range'== o.expression) return o;
		return this.callSuper(o, klg);
	},
	subHas: function(o, att) {
		if('number'== o.expression) return isFinite(o.value)?[o]:[];
		if(nul.obj.defined.def(att.text)) {
			if('string'!= att.text.expression) return [];	//The attribute text is not a string
			var nbr = parseInt(att.text.value);
			if(nbr.toString() != att.text.value) return [];	//The attribute text is not a good numeric string
			return nul.klg.has(o, new nul.obj.litteral.number(nbr));
		}
		return this.callSuper(o, att, '#number');
	},
	/** @constant */
	expression: '&#x211a;'
});

/**
 * Singleton
 * @class Set of string litterals
 * @extends nul.obj.hcSet
 */
nul.obj.string = new JS.Singleton(nul.obj.hcSet, /** @lends nul.obj.string# */{
	subHas: function(o, att) {
		if('string'== o.expression) return [o];
		return this.callSuper(o, att, '#text');
	},
	expression: 'text'

});

/**
 * @class Set of boolean litterals
 * @extends nul.obj.hcSet
 */
nul.obj.bool = new JS.Singleton(nul.obj.hcSet, /** @lends nul.obj.bool# */{
	subHas: function(o, att) {
		var kt = new nul.xpr.knowledge();
		var kf = new nul.xpr.knowledge();
		return [kt.wrap(kt.unify(nul.obj.litteral.make(true), o)),
		        kf.wrap(kf.unify(nul.obj.litteral.make(false), o)) ];
	},
	/** @constant */
	expression: 'bool',

////////////////	nul.obj.hcSet implementation

	/** @constant */
	length: 2
});

nul.obj.range = new JS.Class(nul.obj.hcSet, /** @lends nul.obj.range# */{
	//TODO 4: solve or XML make them define as extension ?
	/**
	 * @class A range of integer numbers
	 * @extends nul.obj.hcSet
	 * @constructs
	 * @param {Number} lwr Lower bound of the set (or nothing for no bound)
	 * @param {Number} upr Upper bound of the set (or nothing for no bound)
	 */
	initialize: function(lwr, upr) {
		var specBnd = function(s, inf) { return ('undefined'== typeof s)?inf:('string'== typeof s)?parseInt(s):s; };
		this.lower = specBnd(lwr, ninf);
		this.upper = specBnd(upr, pinf);
		//if(ninf== this.lower || pinf== this.upper) this.length = pinf;
		//else if(pinf== this.lower) this.length = 0;
		//else this.length = this.upper-this.lower+1;
		
		this.callSuper();
	},
	/**
	 * {nul.obj.range} can intersect with {@link nul.obj.number} or with another range.
	 */
	intersect: function(o, klg) {
		if('range'== o.expression) {
			var lwr = this.lower<o.lower?o.lower:this.lower;
			var upr = this.upper>o.upper?o.upper:this.upper;
			if(lwr > upr) return [];
			return new nul.obj.range(lwr, upr);
		}
		return this.callSuper();
	},
	/**
	 * The given object is a number, integer and between the bounds.
	 */
	subHas: function(o, att) {
		if(this.lower==this.upper && !o.isA(nul.obj.defined)) {
			//TODO 3: return "o=nbr[this.bound]"
		}
		var nbr = (o.isA(nul.obj.defined))?nul.obj.number.subHas(o, att):false;
		if(!nbr) return this.callSuper(o, att, '#number');		//dunno if number
		if(!nbr.length) return [];						//failure to be a number
		o = nbr[0];	//it's a number !
		if(!isJsInt(o.value)) return [];
		if( o.value < this.lower || o.value > this.upper) return [];
		return [o];
	},

//////////////// nul.obj.defined implementation

	/**
	 * Try to unify to a pair or to another range.
	 */
	subUnified: function(o, klg) {
		this.use(); nul.obj.use(o); nul.klg.mod(klg);
		
		if('range'== o.expression) return (o.lower==this.lower && o.upper==this.upper);
		if('pair'!= o.expression) nul.fail(o, ' is not a range nor a pair');
		if(ninf== this.lower) nul.fail(this, ' has no first');
		//TODO O: warn if(pinf== this.upper) : queue infinie
		klg.unify(nul.obj.litteral.make(this.lower), o.first.value);
		klg.unify(
			(this.lower == this.upper) ?
				nul.obj.empty :
				new nul.obj.range(this.lower+1, this.upper),
			o.second);
		return this;
	},

//////////////// nul.expression implementation

	/** @constant */
	expression: 'range',
	/** <a href="http://code.google.com/p/nul/wiki/Summary">Summary</a> computation of {@link index} */
	sum_index: function() { return this.indexedSub(this.lower, this.upper); }
});

/** The set of numbers */
nul.globals.Q = nul.obj.number;
/** The set of integers */
nul.globals.Z = new nul.obj.range();
/** The set of natural numbers */
nul.globals.N = new nul.obj.range(0);
/** The set of texts/strings */
nul.globals.text = nul.obj.string;
/** The set of boolean (2 elements) */
nul.globals.bool = nul.obj.bool;
/*FILE: src/data/null.data.ajax.js*/
/*  NUL language JavaScript framework
 *  (c) 2009 E-med Ware
 *
 * NUL is freely distributable under the terms of GNU GPLv3 license.
 *  For details, see the NUL project site : http://code.google.com/p/nul/
 *
 *--------------------------------------------------------------------------*/


/** @namespace */
nul.data.ajax = {
	/**
	 * Load a file from an URL and build an object through objFct
	 * @param {URL} url
	 * @param {function(transport) nul.xpr.object} objFct
	 * @return {nul.xpr.object} as objFct returned it
	 * @return {nul.xpr.object} An undefined object, meaning "Not yet loaded" that will be replaced later. [TODO O]
	 */
	load: function(url, objFct) {
		var rq = $.ajax({
			type: "get",
			url: url,
			async: false,
			error: function(xhr, opts, x) {
				var msg; 
				switch(x.code) {
					case 1012: msg = 'Ajax failure : Not respecting the <a href="http://en.wikipedia.org/wiki/Same_origin_policy">Same Origin Policy</a>'; break;
					default: msg = 'Ajax failure : '+x; break;
				}
				nul.ex.semantic('AJAX', msg);
			}
		});
		return objFct(rq);
	},
	
	/**
	 * Load a NUL library (written in NUL) from an URL
	 * @param {String} url
	 * @param {String} id optional : url is used if no id is provided.
	 */
	loadNul : function(url, id) {
		nul.data.ajax.load(url,
			function(t) { return nul.read(t.responseText, id || url); } );
	}
};

/**
 * Creates the 'library' global
 */
nul.load.ajax = function() {
	/**
	 * Singleton
	 * @class The 'library' global
	 * @extends nul.obj.node
	 */
	nul.globals.library = new nul.obj.hc(/** @lends nul.globals.library */{
		
		attributes: {
			/**
			 * Singleton
			 * @class AJAX library loader
			 * @extends nul.obj.hc
			 * @name attributes.file
			 * @memberOf nul.globals.library
			 */
			file: new nul.obj.hc(/** @lends nul.globals.library.attributes.file# */{
				/**
				 * Load the 'pnt' library' value into 'img'
				 * @param {nul.obj.litteral.string} pnt
				 * @param {nul.xpr.object} img
				 * @return {nul.xpr.possible}
				 */
				retrieve: function(pnt, img) {
					if('string'!= pnt.expression) nul.ex.semantic('LIB', 'Libraries files are retrieved from a string URL', pnt);
					var libSet = nul.data.ajax.loadNul(pnt.value);
					var klg = new nul.xpr.knowledge();
					klg.belong(img, libSet);
					return [klg.wrap(new nul.obj.lambda(pnt,img))];
				},
				/** @constant */
				expression: 'library.file'
			})
		},
		expression: 'library'
	});
};
nul.load.ajax.provide = ['nul.globals'];
/*FILE: src/data/null.data.dom.js*/
/*  NUL language JavaScript framework
 *  (c) 2009 E-med Ware
 *
 * NUL is freely distributable under the terms of GNU GPLv3 license.
 *  For details, see the NUL project site : http://code.google.com/p/nul/
 *
 *--------------------------------------------------------------------------*/


/**
 * Singleton
 * @class The context of AJAX-accessible items
 * @extends nul.data.context
 */
nul.data.dom = new nul.data.context('DOM', 10);

nul.data.dom.doc = new JS.Class(nul.data,/** @lends nul.data.dom.doc# */{
	/**
	 * @class Data access to an XML document
	 * @extends nul.data
	 * @param {URL | XMLdocument} doc
	 * @constructs
	 */
	initialize: function(doc) {
		this.document = doc;
		this.extract = new nul.data.dom.element($(doc.documentElement));
		this.callSuper(nul.data.dom, doc.documentURI);
	}
});

nul.data.dom.element = new JS.Class(nul.obj.hc, /** @lends nul.data.dom.element */{
	/**
	 * @class Data access to an XML element
	 * @extends nul.obj.hc
	 * @param {HTMLElement} element
	 * @constructs
	 */
	initialize: function(element) {
		this.element = $(element);
		if(!this.element[0].nulId) this.element[0].nulId = nul.execution.name.gen('element.nulId');
		this.callSuper(null);
		this.tag = this.element[0].tagName;
		this.properties = {
			'': function() { return new nul.obj.litteral.string(this.element[0].tagName); },
			'# ': function() { return new nul.obj.litteral.number(this.element.children().length); }
		};
		for(var a=0; this.element[0].attributes[a]; ++a) this.properties[this.element[0].attributes[a].name] = function(klg, anm) {
			return new nul.obj.litteral.string(this.element.attr(anm)); };
	},
////////////////nul.obj.hc implementation
	
	/**
	 * Gets a node from a selector. The selector can be :
	 * - a string CSS selector (only for HTML element) 
	 * - a string tag name (simple CSS selector)
	 * - another node as a template
	 * @param {nul.obj.defined} key
	 */
	seek: function(key) {
		switch(key.expression) {
		case 'string':
			//TODO 2: essayer avec getElementsByTagName si en profondeur et simple CSS selector
			if(!this.element.find) nul.ex.semantic('DOM', 'Element is not HTML - no CSS selection', this, key);
			var els = $.makeArray(this.element.find(key.value));
			return map(els, function() { return new nul.data.dom.element($(this)); });
		case 'node':
			return nul.obj.node.relativise(key, this.listed());
		default:
			nul.ex.semantic('DOM', 'DOM elements can only be indexed by CSS selector or by defaulting node', key);
		}
	},
	
	/**
	 * List all the sub-nodes as nul objects
	 * @return {nul.xpr.object[]}
	 */
	listed: function() {
		var rv = [];
		for(var chld = this.element[0].firstChild; chld; chld = chld.nextSibling) switch(chld.nodeName) {
			case '#text': rv.push(new nul.obj.litteral.string(chld.data)); break;
			default: rv.push(new nul.data.dom.element(chld)); break;
		}
		return rv;
	},

//////////////// nul.expression implementation

	/** @constant */
	expression: 'dom',

	/** <a href="http://code.google.com/p/nul/wiki/Summary">Summary</a> computation of {@link index} */
	sum_index: function() { return this.indexedSub(this.element[0].nulId); }
});

/**
 * Creates DOM and XML globals
 */
nul.load.dom = function() {
	nul.globals.document = new nul.data.dom.doc(this).object;
	/**
	 * Singleton
	 * @class The 'xml' global
	 * @extends nul.obj.hc
	 */
	nul.globals.xml = new nul.obj.hc(/** @lends nul.globals.xml# */{
		/**
		 * Give an XML node out of an URL string
		 * @param {nul.obj.defined} pnt
		 * @return {nul.data.dom.doc} The loaded document
		 */
		seek: function(pnt) {
			if('string'!= pnt.expression) nul.ex.semantic('AJAX', 'Ajax retrieve XML documents only from a string URL', pnt);
			return nul.data.ajax.load(pnt.value,
					function(t) { return new nul.data.dom.doc(t.responseXML); } );
		},
		//TODO 2: list nodes that fit for xml : string attributes and XMLnode/text content
		/** @constant */
		expression: 'xml'
	});
};
nul.load.dom.provide = ['nul.globals'];
/*FILE: src/data/null.data.time.js*/
/*  NUL language JavaScript framework
 *  (c) 2009 E-med Ware
 *
 * NUL is freely distributable under the terms of GNU GPLv3 license.
 *  For details, see the NUL project site : http://code.google.com/p/nul/
 *
 *--------------------------------------------------------------------------*/


nul.data.time = new JS.Class(nul.obj.node, /** @lends nul.data.time# */{
	/**
	 * @extends nul.obj.node
	 * @class The DateTime object as a node with attributes
	 * @param {Date} dto
	 * @constructs
	 */
	initialize: function(dto) {
		if(nul.debugged) nul.assert(dto.setFullYear, 'Expected a date as argument');
		this.dto = dto;
		this.callSuper('DateTime', map(nul.data.time.nul2js, function() { return function(klg, anm) {
			anm = nul.data.time.nul2js[anm];
			return new nul.obj.litteral.number(this.dto[anm].apply(this.dto));
		}; }));
	}
});

/**
 * The NUL properties are JS methods
 * @constant
 */
nul.data.time.nul2js = {
	year: 'getFullYear',
	month: 'getMonth',
	day: 'getDate',
	hours: 'getHours',
	minutes: 'getMinutes',
	seconds: 'getSeconds',
	milliseconds: 'getMilliseconds',
	dof: 'getDay',
	stamp: 'getTime'
};

/**
 * Creates the 'time' global
 */
nul.load.time = function() {
	/**
	 * Singleton
	 * @class The 'time' global
	 * @extends nul.obj.hc
	 */
	nul.globals.time = new nul.obj.hc(/** @lends nul.globals.time# */{
		/**
		 * Try to accept the value if the object is 'Now' data. If not, use the regular behaviour
		 * @param {nul.xpr.object} obj
		 * @param {nul.xpr.object[]} att
		 * @return {nul.xpr.object[]|nul.xpr.possible[]}
		 */
		subHas: function(obj, att) {
			if(nul.obj.data.def(obj) && 
					['now'].include(obj.source.index) &&
					obj.source.context == nul.data.context.local )
				return [obj];
			return nul.obj.hc.prototype.subHas.apply(this,[obj, att]);
		},
		/**
		 * Try to build a time object if we have enough specifications in attributes
		 * @param {nul.xpr.object} obj
		 * @param {nul.xpr.object[]} att
		 * @return {nul.xpr.object[]|nul.xpr.possible[]}
		 */
		select: function(obj, att) {
			if(nul.data.time.def(obj)) return [obj];
			if(nul.obj.defined.def(obj)) return [];
			//TODO 3: try to see with the attributes if we can discover the date. If yes, return [built date]
		},
		/**
		 * dateTime.parse(key)
		 * @param {nul.obj.litteral.string} key
		 */
		seek: function(key) {
			if('string'!= key.expression) nul.ex.semantic('Time', 'Time element can only be retrieved from a string', key);
			var t = Date.parse(key.value);
			if(isNaN(t)) return [];
			return new nul.data.time(new Date(t));
		},
		/**
		 * @constant
		 * @name nul.globals.time#attributes
		 */
		attributes: {
			/**
			 * Singleton
			 * @class The 'time.now' global
			 * @name nul.globals.time#attributes.now
			 * @extends nul.data
			 */
			now: new nul.data(nul.data.context.local, 'now', /** @lends nul.globals.time#attributes.now# */{
				/**
				 * Get the time when queried
				 */
				extract: function() {
					return new nul.data.time(new Date());
				}
			}).object
		},
		/** @constant */
		expression: 'time'
	});
};
/*FILE: src/lng/txt/in/null.understand.js*/
/*  NUL language JavaScript framework
 *  (c) 2009 E-med Ware
 *
 * NUL is freely distributable under the terms of GNU GPLv3 license.
 *  For details, see the NUL project site : http://code.google.com/p/nul/
 *
 *--------------------------------------------------------------------------*/


/**
 * @namespace
 */
nul.understanding = {
	/** Used as return-value local naming @constant */
	rvName : '&crarr;',
	/** Exception used when a local need to be created @constant */
	unresolvable: 'unresolved identifier',
	/**
	 * Understand each 'ops' in a freshly created understand.base
	 * @param {nul.compiled[]} objs
	 * @param {nul.understanding.base} ub
	 * @return {nul.xpr.possible[]}
	 */
	possibles: function(ops, ub) {
		return maf(ops, function() {
			try { return new nul.understanding.base(ub).understand(this); }
			catch(err) { nul.failed(err); }
		});
	}
};

nul.compiled.extend(/** @lends nul.compiled */{
	/**
	 * @class Standard infix expression : one operator and several operands
	 * @extends nul.compiled
	 */
	expression: new JS.Class (nul.compiled, /** @lends nul.compiled.expression */{
		understand: function(ub) {
			var ops;
			if('[]'== this.operator)
				return ub.klg.hesitate(nul.understanding.possibles(this.operands, ub));
	
			var ops = map(this.operands, function(n, o) {
				return this.understand(ub);
			});
			switch(this.operator)
			{
			case '+':
			case '*':
				return new nul.obj.operation.Nary(this.operator, ops);
			case '-':
			case '/':
			case '%':
				return nul.obj.operation.binary(this.operator, ops);
			//TODO 3: > < >= <=
			case '=>': return new nul.obj.lambda(ops[0], ops[1]);
			case ',': return nul.obj.pair.list(ops.follow, ops);
			case '=': return ub.klg.unify(ops);
			case '!=': ub.klg.oppose(nul.klg.unification(ops));
				return ops[0];
			case ';': return ops[0];
			case '?': return ops[1];
			case '..':
				if('number'!= ops[0].expression) nul.ex.semantic('RNG', 'Range can only be defined with immediates', ops[0]);
				if('number'!= ops[1].expression) nul.ex.semantic('RNG', 'Range can only be defined with immediates', ops[1]);
				return new nul.obj.range(ops[0].value, ops[1].value);
			case ':': 
				var rv = ub.createFreedom(nul.understanding.rvName, false);
				ub.klg.hesitate(ops[0].having(new nul.obj.lambda(rv, ops[1])));
				return rv;
			default:
				nul.ex.internal('Unknown operator: "'+this.operator+'"');
			}
		}
	}),
	/**
	 * @class Standard prefix expression : one operator and one operand
	 * @extends nul.compiled
	 */
	preceded: new JS.Class(nul.compiled, /** @lends nul.compiled.preceded */{
		understand: function (ub) {
			return ub.klg.attribute(this.operand.understand(ub), this.operator+' ');
		}
	}),
	/**
	 * @class Standard postfix expression : one operand and one operator
	 * @extends nul.compiled
	 */
	postceded: new JS.Class(nul.compiled, /** @lends nul.compiled.postceded */{
		understand: function (ub) {
			switch(this.operator) {
			case ',.': return nul.obj.pair.list(null, [this.operand.understand(ub)]);
			default: return ub.klg.attribute(this.operand.understand(ub), ' '+this.operator);
			}
		}
	}),
	/**
	 * @class Set belonging assertion : one set and one item
	 * @extends nul.compiled
	 */
	application: new JS.Class(nul.compiled, /** @lends nul.compiled.application */{
		understand: function(ub){
			return ub.klg.hesitate(this.item.understand(ub).having(this.applied.understand(ub)));
		}
	}),
	/**
	 * @class Value retrieval through set transformation : one set and one point
	 * @extends nul.compiled
	 */
	taking: new JS.Class(nul.compiled, /** @lends nul.compiled.taking */{
		understand: function (ub) {
			return nul.xpr.application(this.item.understand(ub), this.token.understand(ub), ub.klg);
		}
	}),
	/**
	 * @class A undivisible expression : number, string, identifier, ...
	 * @extends nul.compiled
	 */
	atom: new JS.Class(nul.compiled, /** @lends nul.compiled.atom */{
		understand: function (ub) {
			var value;
			switch(this.type)
			{
			case "string":
				value = ''+this.value;
				break;
			case "number":
				value = 1*this.value;
				break;
			case "alphanum" :
				if(!this.value) return nul.execution.uberLocal;
				try { return ub.resolve(this.value); }
				catch(err) {
					if(nul.understanding.unresolvable!= err) throw err;
					return ub.createFreedom(this.value);
				}
				break;
			default:
				nul.ex.internal('unknown atom type: ' + this.type + ' - ' + this.value);
			}
			return nul.obj.litteral.make(value);
		}
	}),
	/**
	 * @class An expression for which a local is defined here : just an item finally
	 * @extends nul.compiled
	 */
	definition: new JS.Class(nul.compiled, /** @lends nul.compiled.definition */{
		understand: function (ub) {
			if('_'== this.decl) nul.ex.semantic('JKD', 'Cannot declare joker !');
			ub.createFreedom(this.decl);
			return this.value.understand(ub);
		}
	}),
	/**
	 * @class Set building. An expression surrounded by { }
	 * @extends nul.compiled
	 */
	set: new JS.Class(nul.compiled, /** @lends nul.compiled.set */{
		understand: function (ub) {
			if(!this.content) return nul.obj.empty;
			return new nul.understanding.base.set(ub, this.selfRef).understand(this.content);
		}
	}),
	/**
	 * @class XML node : tag, attributes, content
	 * @extends nul.compiled
	 */
	xml: new JS.Class(nul.compiled, /** @lends nul.compiled.xml */{
		understand: function (ub) {
			return new nul.obj.node(this.node,												//tag
					map(this.attributes, function() { return this.understand(ub); }),			//attributes
					nul.obj.pair.list(null, nul.understanding.possibles(this.content, ub)));		//content
		}
	}),
	/**
	 * @class An item asserting one of his attribute : one item, one attribute name, one attribute value
	 * @extends nul.compiled
	 */
	composed: new JS.Class(nul.compiled, /** @lends nul.compiled.composed */{
		understand: function (ub) {
			return ub.klg.attributed(this.object.understand(ub), this.aName, this.value.understand(ub));
		}
	}),
	/**
	 * @class An item' attribute : one item and one attribute name
	 * @extends nul.compiled
	 */
	objectivity: new JS.Class(nul.compiled, /** @lends nul.compiled.objectivity */{
		understand: function (ub) {
			return ub.klg.attribute(this.applied.understand(ub), this.lcl);
		}
	}),
	/**
	 * @class An expression given in JavaScript
	 * @extends nul.compiled
	 */
	hardcode: new JS.Class(nul.compiled, /** @lends nul.compiled.hardcode */{
		understand: function (ub) {
			return this.value;
		}
	})
});

nul.understanding.base = new JS.Class(/** @lends nul.understanding.base# */{
	/**
	 * @class Understanding context informations
	 * @constructs
	 * @param {nul.understanding.base} prntUb The parent understanding base
	 * @param {String} klgName The name to give to the created context if any special (if not, one will be generated)
	 */
	initialize: function(prntUb, klgName) {
		this.prntUb = prntUb;
		this.parms = {};
		this.klg = new nul.xpr.knowledge(klgName);
	},
	/**
	 * Gets the value associated with an identifier
	 * @param {String} identifier
	 * @return {nul.xpr.object}
	 * @throw {nul.understanding.unresolvable}
	 */
	resolve: function(identifier) {
		if('undefined'!= typeof this.parms[identifier])
			return this.parms[identifier];
		if(this.prntUb) return this.prntUb.resolve(identifier);
		throw nul.understanding.unresolvable;
	},
	/**
	 * Associate an identifier to a value.
	 * If no value is specified, a local is created
	 * If value is specified explicitely as 'false', a local is created and the name is not remembered
	 * @param {String} name
	 * @param {nul.xpr.object} value
	 * @return {nul.xpr.object}
	 * @throw {nul.ex.semantic}
	 */
	createFreedom: function(name, value) {
		if(this.parms[name]) nul.ex.semantic('FDT', 'Freedom declared twice: '+name);
		var uniqueName = true;
		if(false===value) uniqueName = false;
		if(!value) value = this.klg.newLocal(name);
		if('_'== name) uniqueName = false;
		if(uniqueName) this.parms[name] = value;
		return value;
	},
	/**
	 * Applies the understandment process to a compiled node
	 * @param {nul.compiled} cnt
	 * @return {nul.xpr.object}
	 * @throw {nul.ex.semantic}
	 */
	understand: function(cnt) {
		return this.klg.wrap(cnt.understand(this));
	}
});

nul.understanding.base.set = new JS.Class(nul.understanding.base, /** @lends nul.understanding.base.set# */{
	/**
	 * @class Understanding context' information inside brackets
	 * @extends nul.understanding.base
	 * @constructs
	 * @param {nul.understanding.base} prntUb The parent understanding base
	 * @param {String} selfName The name to use internally (understanding this value) to give to the created value.
	 * @param {String} klgName The name to give to the created context if any special (if not, one will be generated)
	 */
	initialize: function(prntUb, selfName, klgName) {
		this.callSuper(prntUb, klgName);
		if(selfName) this.setSelfRef = (this.parms[selfName] = nul.obj.local.self(null, selfName)).ndx;
	},
	/**
	 * Applies the understandment process to a compiled node
	 * @param {nul.compiled} cnt
	 * @return {nul.obj.pair|nul.obj.empty}
	 * @throw {nul.ex.semantic}
	 */
	understand: function(cnt) {
		var rv;
		try {
			rv = nul.obj.pair.list(null, this.klg.wrap(cnt.understand(this)));
		} catch(err) {
			nul.failed(err);
			return nul.obj.empty;
		}
		if(this.setSelfRef) rv.selfRef = this.setSelfRef;
		return rv;
	}
});
/*FILE: src/lng/txt/out/null.txt.node.js*/
/*  NUL language JavaScript framework
 *  (c) 2009 E-med Ware
 *
 * NUL is freely distributable under the terms of GNU GPLv3 license.
 *  For details, see the NUL project site : http://code.google.com/p/nul/
 *
 *--------------------------------------------------------------------------*/


/**
 * Singleton
 * @class Expression HTML node description building 
 * @extends nul.txt
 */
nul.txt.node = new JS.Singleton(nul.txt, /** @lends nul.txt.node */{
	
	drawing: [],
	/**
	 * Shortcut to make a table of string out of a table of expressions
	 * @param {nul.expression[]} ass
	 * @return {HTML[]}
	 */
	all: function(ass, glu, b4, a9, flwr) {
		var lst = maf(ass, function() { return this.toNode(); });
		var rv = b4||[];
		if(!$.isArray(rv)) rv = [rv];
		if(lst.length) {
			rv.push(lst[0]);
			for(var i=1; lst[i]; ++i) rv.pushs([glu.clone(), lst[i]]);
		}
		if(flwr && ass.follow) rv.pushs([flwr, ass.follow.toNode()]);
		if(a9) rv.push(a9);
		return rv;
	},
	/** @constant */
	recurStr: $('<span>[recur]</span>'),
	/**
	 * Called for each drawn expression to wrap it in common spans and add the tiles (for dependance, ...)
	 * @param {HTML} txt The text specific to this expression
	 * @param {nul.expression} xpr
	 * @return {HTML}
	 */
	wrap: function(txt, xpr) {
		function tilesNode(knd, cnt, pos) {
			if(cnt.toHtml) cnt = cnt.toHtml();
			return $('<a />').attr('class',knd+' _nul_xpr_tile').css('margin-left', (5*pos)+'px').append($('<div />').html(cnt));
		}
		
		var tiles = {};
		tiles.shortStr = xpr.toFlat();
		tiles.index = xpr.toString();
		if(xpr.selfRef) tiles.reference = xpr.selfRef;
		merge(tiles, txt);
		delete tiles[''];
		
		var deps = xpr.dependance();
		if(!isEmpty(deps.usages)) tiles['dependances'] = deps;

		var rv = $('<span />').addClass(xpr.expression).addClass('xpr');
		rv.append(tilesNode('explain', xpr.origin.toShort(), 0).click(nul.txt.node.explain(xpr)));
		var spos = 1;
		for(var t in tiles) rv.append(tilesNode(t, tiles[t], spos++));
		for(var i=0; i<txt[''].length; ++i)
			rv.append(txt[''][i]);
		return rv;
	},
	outp: function(xpr) { return xpr; },
	/** @namespace */
	draw: {
		/**
		 * @methodOf nul.obj.pair#
		 * @return {HTML}
		 */
		pair: function() { return nul.txt.node.dispatchPair(this); },
		
		/**
		 * @methodOf nul.obj.local#
		 * @return {HTML}
		 */
		local: function() {
			if(nul.debugged) nul.assert(this.dbgName, 'Local has name if debug enabled');
			
			return {
				'': [this.dbgName, $('<span class="desc"/>')
						.append($('<span class="sup"/>').html(this.ndx))
						.append($('<span class="sub"/>').html(this.klgRef))]
                };
		},

		/**
		 * @methodOf nul.obj.operation#
		 * @return {HTML}
		 */
		operation: function() {
			return {'': nul.txt.node.all(this.operands, nul.txt.node.op(this.operator), nul.txt.node.op('('), nul.txt.node.op(')'))};
		},
		/**
		 * @methodOf nul.obj.litteral.number#
		 * @return {HTML}
		 */
		number: function() {
			if(pinf==this.value) return {'': '+&infin;'};
			if(ninf==this.value) return {'': '-&infin;'};
			return {'': ''+this.value};
		},
		/**
		 * @methodOf nul.obj.litteral.string#
		 * @return {HTML}
		 */
		string: function() {
			return {'': '"'+this.value+'"'};	//TODO 3: html escape
		},
		/**
		 * @methodOf nul.obj.litteral.boolean#
		 * @return {HTML}
		 */
		'boolean': function() {
			return {'': this.value?'true':'false'};
		},
		/**
		 * @methodOf nul.obj.range#
		 * @return {HTML}
		 */
		range: function() {
			var ltr = 0> this.lower ?
				$('<span>&#x2124;</span>'):	//â?¤
				$('<span>&#x2115;</span>');	//â??
			if(pinf==this.upper) {
				if(ninf==this.lower) return {'': [ltr]};
				if(0== this.lower) return {'': [ltr]};
			}
			return {'': [ltr, $('<span class="desc" />')
			             .append($('<span class="sup" />').text((pinf==this.upper)?'&infin;':this.upper))
			             .append($('<span class="sub" />').text((ninf==this.lower)?'&infin;':this.lower))]
			};
		},
		/**
		 * @methodOf nul.obj.data#
		 * @return {HTML}
		 */
		data: function() {
			return {
				'': [nul.txt.node.op('&Dagger;'), $('<span class="desc"/>')
						.append($('<span class="sup"/>').html(this.source.index))
						.append($('<span class="sub"/>').html(this.source.context))]
                };
		},
		/**
		 * @methodOf nul.expression#
		 * @return {HTML}
		 */
		other: function() {
			return {'': [this.expression]};
		},
		
		/**
		 * @methodOf nul.obj.lambda#
		 * @return {HTML}
		 */
		lambda: function() {
			return {'': [this.point.toNode(), nul.txt.node.op('&rArr;'), this.image.toNode()]};
		},
		/**
		 * @methodOf nul.obj.pair#
		 * @return {HTML}
		 */
		singleton: function() {
			return {'': [nul.txt.node.op('{'), this.first.toNode(), nul.txt.node.op('}')]};
		},
		/**
		 * @methodOf nul.obj.pair#
		 * @param {nul.xpr.possible[]} flat List of the possibles that this pair represent.
		 * @return {HTML}
		 */
		list: function(flat) {
			return {'': nul.txt.node.all(flat, nul.txt.node.op(','), nul.txt.node.op('('), nul.txt.node.op(')'), nul.txt.node.op(',..'))};
		},
		/**
		 * @methodOf nul.obj.pair#
		 * @param {nul.xpr.possible[]} flat List of the possibles that this pair represent.
		 * @return {HTML}
		 */
		set: function(flat) {
			return {'': nul.txt.node.all(flat, nul.txt.node.op('&#9633;'), nul.txt.node.bigop('{'), nul.txt.node.bigop('}'), nul.txt.node.op('&cup;'))};
		},
		
		/**
		 * @methodOf nul.klg.eqClass#
		 * @return {HTML}
		 */
		eqCls: function() {
			var attrs = $('<table class="attributes" />');
			for(var an in ownNdx(this.attribs))
				attrs.append($('<tr />')
						.append($('<th />').html(an))
						.append($('<td />').append(this.attribs[an].toNode())));
			var b4 = [nul.txt.node.op('(')];
			if(attrs.children().length) b4.push(attrs);
			var lst = nul.txt.node.all(this.equivls, nul.txt.node.op('='), b4, nul.txt.node.op(')'));
			if(this.belongs.length) {
				lst.pushs(nul.txt.node.op('&isin;'), nul.txt.node.all(this.belongs, nul.txt.node.op(',')));
			}
			return {'': lst};
		},
		/**
		 * @methodOf nul.xpr.knowledge#
		 * @return {HTML}
		 */
		klg: function() {
			if(this.isA(nul.klg.ncndtnl)) return {'':[nul.txt.node.op(this.name)]};
			var rv = nul.txt.node.all(this.eqCls, nul.txt.node.op('&and;'));
			var ior3 = nul.txt.node.all(this.ior3, nul.txt.node.op('&and;'));
			var veto = nul.txt.node.all(this.veto, nul.txt.node.op('&or;'));
			
			if(rv.length && ior3.length) rv.pushs(nul.txt.node.op('&and;'), ior3);
			else if(ior3.length) rv = ior3;
			
			if(rv.length && veto.length) rv.pushs(nul.txt.node.op('&and;'), nul.txt.node.op('&not;'));
			else if(veto.length) rv = [nul.txt.node.op('&not;')];
			if(veto.length) rv.pushs(veto);
			
			return {
				'': rv.length?[nul.txt.node.op('(')].pushs(rv, nul.txt.node.op(')')):[],
				locals: this.name + (this.locals.length?(' : ' + this.locals.join(', ')):'')
			};
		},
		/**
		 * @methodOf nul.klg.ior3#
		 * @return {HTML}
		 */
		ior3: function() {
			return {'': nul.txt.node.all(this.choices, nul.txt.node.op('&or;'), nul.txt.node.op('('), nul.txt.node.op(')'))};
		},
		
		/**
		 * @methodOf nul.xpr.possible#
		 * @return {HTML}
		 */
		possible: function() {
			if(this===nul.xpr.failure) return { '': nul.txt.node.op('Failure') };
			if(this.knowledge===nul.klg.always) return { '': this.value.toNode() };
			return {
				'': [$('<table class="xpr freedom" />')
						.append($('<tr><td class="freedom" /></tr>').append(this.value.toNode()))
						.append($('<tr><th class="freedom" /></tr>').append(this.knowledge.toNode()))]
			};
		}
	},
	op: function(os) { return $('<span class="op" />').html(os); },
	bigop: function(os) { return $('<span class="big op" />').html(os); },
	
	explain: function(xpr) {
		return function() {
			nul.xpr.use(xpr);
			if(xpr.dialog) xpr.dialog.dialog('moveToTop');
			else if(xpr.origin.action) nul.txt.node.createDlg(xpr, xpr.toFlat()).bind('dialogclose', function() { delete xpr.dialog; });
		};
	},
	createDlg: function(xpr, ttl) {
		var dlg = xpr.dialog = $('<div />');
		if(xpr.origin.from) dlg
			.append( $('<table class="transformation"/>').append( $('<tr />')
					.append($('<th />').append(xpr.toNode()))
					.append($('<td />').html('&lArr;'))
					.append($('<td />').append(xpr.origin.from.toNode()))) );
		else dlg.append(xpr.toNode());
		dlg.append($('<div class="description" />').append(xpr.origin.action.description()));
		dlg.append($('<div class="applied" />').append(xpr.origin.action.appliedNode.clone()));
		for(var i=0; i<xpr.origin.action.args.length; ++i)
			dlg.append($('<div class="argument" />').append(nul.txt.node.as(xpr.origin.action.args[i])));
		return dlg.dialog({
			closeOnEscape: false,
			dialogClass: 'explain',
			title: ttl
		});
	},
	/**
	 * Gets the object as a node - as best as we can
	 * @param {Object} obj
	 * @return {jQuery} node
	 */
	as: function(obj) {
		if(obj.toNode) return obj.toNode();
		return $('<span />').text(obj.toString());
	}
});
/*FILE: src/lng/txt/out/null.txt.flat.js*/
/*  NUL language JavaScript framework
 *  (c) 2009 E-med Ware
 *
 * NUL is freely distributable under the terms of GNU GPLv3 license.
 *  For details, see the NUL project site : http://code.google.com/p/nul/
 *
 *--------------------------------------------------------------------------*/


/**
 * Singleton
 * @extends nul.txt
 * @class Expression flat description building helper
 */
nul.txt.flat = new JS.Singleton(nul.txt, /** @lends nul.txt.flat */{
	/**
	 * Shortcut to make a table of string out of a table of expressions
	 * @param {nul.expression[]} ass
	 * @return {String[]}
	 */
	all: function(ass) {
		return maf(ass, function() { return this.toFlat(); });
	},
	recurStr: '[recur]',
	/**
	 * Called for each drawn expression to wrap it in common spans and add the tiles (for dependance, ...)
	 * @param {String} txt The text specific to this expression
	 * @param {nul.expression} xpr
	 * @return {String}
	 */
	wrap: function(txt) { return txt; },
	outp: function(xpr) { return xpr; },
	/** @namespace */
	draw: {
		/**
		 * @methodOf nul.obj.pair#
		 * @return {String}
		 */
		pair: function() { return nul.txt.flat.dispatchPair(this); },
		
		/**
		 * @methodOf nul.obj.local#
		 * @return {String}
		 */
		local: function() {
			if(nul.debugged) nul.assert(this.dbgName, 'Local has name if debug enabled'); 
			return (this.dbgName||'') + '[' + this.klgRef + '\\' + this.ndx + ']';
		},
		/**
		 * @methodOf nul.obj.operation#
		 * @return {String}
		 */
		operation: function() {
			return '(' + nul.txt.flat.all(this.operands).join(' '+this.operator+' ') + ')';
		},
		/**
		 * @methodOf nul.obj.litteral.number#
		 * @return {String}
		 */
		number: function() {
			if(pinf==this.value) return '+&infin;';
			if(ninf==this.value) return '-&infin;';
			return ''+this.value;
		},
		/**
		 * @methodOf nul.obj.litteral.string#
		 * @return {String}
		 */
		string: function() {
			return '"'+this.value+'"';
		},
		/**
		 * @methodOf nul.obj.litteral.boolean#
		 * @return {String}
		 */
		'boolean': function() {
			return this.value?'true':'false';
		},
		/**
		 * @methodOf nul.obj.range#
		 * @return {String}
		 */
		range: function() {
			var ltr = 0> this.lower ?
					'&#x2124;':	//â?¤
					'&#x2115;';	//â??			
			var rv = ltr+'(';
			if(ninf!= this.lower) rv += this.lower;
			rv += '..';
			if(pinf!= this.upper) rv += this.upper;
			return rv + ')';
		},
		/**
		 * @methodOf nul.obj.data#
		 * @return {String}
		 */
		data: function() {
			return '['+this.source.context+':'+this.source.index+']';
		},
		/**
		 * @methodOf nul.expression#
		 * @return {String}
		 */
		other: function() {
			return this.expression;
		},
		
		/**
		 * @methodOf nul.obj.lambda#
		 * @return {String}
		 */
		lambda: function() {
			return this.point.toFlat() + ' &rArr; ' + this.image.toFlat();
		},
		/**
		 * @methodOf nul.obj.pair#
		 * @return {String}
		 */
		singleton: function() {
			return '{' + this.first.toFlat() + '}';
		},
		/**
		 * @methodOf nul.obj.pair#
		 * @param {nul.xpr.possible[]} flat List of the possibles that this pair represent.
		 * @return {String}
		 */
		list: function(flat) {
			return '(' + nul.txt.flat.all(flat).join(', ') +
				(flat.follow?(',.. '+flat.follow.toFlat()):'')+ ')';
		},
		/**
		 * @methodOf nul.obj.pair#
		 * @param {nul.xpr.possible[]} flat List of the possibles that this pair represent.
		 * @return {String}
		 */
		set: function(flat) {
			return '{' + nul.txt.flat.all(flat).join(' &#9633; ') + '}' +
				(flat.follow?(' &cup; '+flat.follow.toFlat()):'');
		},
		
		/**
		 * @methodOf nul.klg.eqClass#
		 * @return {String}
		 */
		eqCls: function() {
			var attr = [];
			for(var anm in ownNdx(this.attribs)) if(anm)
				attr.push(anm+': '+this.attribs[anm].toFlat());
			attr = (attr.length)?('['+attr.join(', ')+']'):'';
			return '(' + attr + nul.txt.flat.all(this.equivls).join(' = ') + ')' +
				(this.belongs.length?(' &isin; ' + nul.txt.flat.all(this.belongs).join(', ')):'');
		},
		/**
		 * @methodOf nul.xpr.knowledge#
		 * @return {String}
		 */
		klg: function() {
			if(this.isA(nul.klg.ncndtnl)) return nul.klg.always===this?'':html.op(this.name);
			var rv = nul.txt.flat.all(this.eqCls).join(' &and; ');
			var ior3 = nul.txt.flat.all(this.ior3).join(' &and; ');
			if(rv && ior3) rv += ' &and; ' + ior3;
			else if(ior3) rv = ior3;
			rv = rv?'('+rv+')':'';
			if(1== this.minMult && 1== this.maxMult) return rv;
			return '['+this.minMult+((this.minMult==this.maxMult)?'':('-'+this.maxMult))+']' + rv;
		},
		/**
		 * @methodOf nul.klg.ior3#
		 * @return {String}
		 */
		ior3: function() {
			return '('+nul.txt.flat.all(this.choices).join(' &or; ')+')';
		},
		/**
		 * @methodOf nul.xpr.possible#
		 * @return {String}
		 */
		possible: function() {
			if(this===nul.xpr.failure) return 'Failure';
			if(this.knowledge===nul.klg.always) return this.value.toFlat();
			var klgStr = this.knowledge.toFlat();
			var valStr = this.value.toFlat();
			if(!klgStr) return valStr;
			return valStr + '; ' + klgStr;
		}
	}
});
/*FILE: src/lng/txt/out/null.txt.html.js*/
/*  NUL language JavaScript framework
 *  (c) 2009 E-med Ware
 *
 * NUL is freely distributable under the terms of GNU GPLv3 license.
 *  For details, see the NUL project site : http://code.google.com/p/nul/
 *
 *--------------------------------------------------------------------------*/

// css: src/lng/txt/out/null.txt.html

/**
 * Singleton
 * @class HTML expression building helper 
 */
html = {
	_attrd: function(a) {
		switch(typeof a) {
		case 'undefined': return {};
		case 'object': return a;
		case 'string': return {'class':a};
		}
		throw 'unknown attributes';
	},
	tagged: function(tag, attrs, cnt) {
		var rv = '<'+tag;
		for(var a in attrs) if(attrs[a]) rv += ' '+a+'="'+attrs[a]+'"';
		if(null=== cnt) return rv + ' />';
		return rv + '>' + cnt + '</'+tag+'>';
	},
	
	div: function(a, cnt) {
		return html.tagged('div', html._attrd(a), cnt);
	},
	span: function(a, cnt) {
		return html.tagged('span', html._attrd(a), cnt);
	},
	op: function(o) {
		return ' ' + html.span('op', o) + ' ';
	},
	table: function(cnt, a) {
		return html.tagged('table', html._attrd(a), cnt);
	},
	tr: function(cnt, a) {
		return html.tagged('tr', html._attrd(a), cnt);
	},
	th: function(cnt, a) {
		return html.tagged('th', html._attrd(a), cnt);
	},
	td: function(cnt, a) {
		return html.tagged('td', html._attrd(a), cnt);
	},

	tilesStr: function(knd, cnt, pos) {
		if(cnt.toFlat) {
			ttl = cnt.toFlat();
			cnt = cnt.toHtml();
		} else ttl = cnt;
		return ''+
			html.tagged('a', {
				'class': knd+' _nul_xpr_tile',
				//title: ttl,
		        style: 'margin-left: '+(5*pos)+'px;'
			}, html.div({}, cnt));
	}
};

/**
 * Singleton
 * @class Expression HTML description building helper 
 * @extends nul.txt
 */
nul.txt.html = new JS.Singleton(nul.txt, /** @lends nul.txt.html */{
	
	drawing: [],
	/**
	 * Shortcut to make a table of string out of a table of expressions
	 * @param {nul.expression[]} ass
	 * @return {HTML[]}
	 */
	all: function(ass) {
		return maf(ass, function() { return this.toHtml(); });
	},
	/** @constant */
	recurStr: '[recur]',
	/**
	 * Called for each drawn expression to wrap it in common spans and add the tiles (for dependance, ...)
	 * @param {HTML} txt The text specific to this expression
	 * @param {nul.expression} xpr
	 * @return {HTML}
	 */
	wrap: function(txt, xpr) {
		var tilesStr = '';
		var tiles = {};
		tiles.shortStr = xpr.toFlat();
		tiles.index = xpr.toString();
		if(xpr.selfRef) tiles.reference = xpr.selfRef;
		merge(tiles, txt);
		delete tiles[''];
		var spos = 0;
		for(var t in tiles) tilesStr += html.tilesStr(t, tiles[t], spos++);
		
		var deps = xpr.dependance();
		var df = deps.toFlat();
		if(df) tilesStr += html.tilesStr('dependances', deps, spos++);
		return html.span('xpr',
				tilesStr+
				html.span(xpr.expression, txt['']));
	},
	outp: function(xpr) { return xpr; },
	/** @namespace */
	draw: {
		/**
		 * @methodOf nul.obj.pair#
		 * @return {HTML}
		 */
		pair: function() { return nul.txt.html.dispatchPair(this); },
		
		/**
		 * @methodOf nul.obj.local#
		 * @return {HTML}
		 */
		local: function() {
			if(nul.debugged) nul.assert(this.dbgName, 'Local has name if debug enabled'); 
			return {
				'': this.dbgName? (
	                	this.dbgName+
	                	html.span('desc', html.span('sup',this.ndx)+
	                	html.span('sub',this.klgRef))
                	) : this.ndx+html.span('desc', html.span('sub',this.klgRef))
                };
		},

		/**
		 * @methodOf nul.obj.operation#
		 * @return {HTML}
		 */
		operation: function() {
			return {'': html.op('(') +
				nul.txt.html.all(this.operands)
					.join(html.op(this.operator)) +
				html.op(')')};
		},
		/**
		 * @methodOf nul.obj.litteral.number#
		 * @return {HTML}
		 */
		number: function() {
			if(pinf==this.value) return {'': '+&infin;'};
			if(ninf==this.value) return {'': '-&infin;'};
			return {'': ''+this.value};
		},
		/**
		 * @methodOf nul.obj.litteral.string#
		 * @return {HTML}
		 */
		string: function() {
			return {'': '"'+this.value+'"'};
		},
		/**
		 * @methodOf nul.obj.litteral.boolean#
		 * @return {HTML}
		 */
		'boolean': function() {
			return {'': this.value?'true':'false'};
		},
		/**
		 * @methodOf nul.obj.range#
		 * @return {HTML}
		 */
		range: function() {
			var ltr = 0> this.lower ?
				'&#x2124;':	//â?¤
				'&#x2115;';	//â??
			if(pinf==this.upper) {
				if(ninf==this.lower) return {'': ltr};
				if(0== this.lower) return {'': ltr};
			}
			return {'': ltr+html.span('desc',
				html.span('sup',(pinf==this.upper)?'&infin;':this.upper)+
                html.span('sub',(ninf==this.lower)?'&infin;':this.lower))};
		},
		/**
		 * @methodOf nul.obj.data#
		 * @return {HTML}
		 */
		data: function() {
			return {
				'': html.span('op','&Dagger;') +
	                	html.span('desc', html.span('sup',this.source.index)+
	                	html.span('sub',this.source.context))
                };
		},
		/**
		 * @methodOf nul.expression#
		 * @return {HTML}
		 */
		other: function() {
			return {'': this.expression};
		},
		
		/**
		 * @methodOf nul.obj.lambda#
		 * @return {HTML}
		 */
		lambda: function() {
			return {'': this.point.toHtml() + html.op('&rArr;') + this.image.toHtml()};
		},
		/**
		 * @methodOf nul.obj.pair#
		 * @return {HTML}
		 */
		singleton: function() {
			return {'': html.op('{') + this.first.toHtml() + html.op('}')};
		},
		/**
		 * @methodOf nul.obj.pair#
		 * @param {nul.xpr.possible[]} flat List of the possibles that this pair represent.
		 * @return {HTML}
		 */
		list: function(flat) {
			return {'': html.op('(') + nul.txt.html.all(flat).join(html.op(',')) +
				(flat.follow?(html.op(',.. ')+flat.follow.toHtml()):'')+ html.op(')')};
		},
		/**
		 * @methodOf nul.obj.pair#
		 * @param {nul.xpr.possible[]} flat List of the possibles that this pair represent.
		 * @return {HTML}
		 */
		set: function(flat) {
			return {
				'': html.span('big op','{') +
						nul.txt.html.all(flat).join(' &#9633; ') +
					html.span('big op','}') +
					(flat.follow?(html.op('&cup;')+flat.follow.toHtml()):'')
			};
		},
		
		/**
		 * @methodOf nul.klg.eqClass#
		 * @return {HTML}
		 */
		eqCls: function() {
			var attrs = [];
			for(var an in ownNdx(this.attribs))
				attrs.push(html.tr(html.th(an)+html.td(this.attribs[an].toHtml())));

			attrs = attrs.length?html.table(attrs.join(''),'attributes'):'';

			return {'': html.op('(') + attrs +
				nul.txt.html.all(this.equivls).join(html.op('=')) +
				html.op(')') +
				(this.belongs.length?
					(html.op('&isin;') + nul.txt.html.all(this.belongs).join(html.op(','))):
					'')};
		},
		/**
		 * @methodOf nul.xpr.knowledge#
		 * @return {HTML}
		 */
		klg: function() {
			if(this.isA(nul.klg.ncndtnl)) return {'':html.op(this.name)};
			var rv = nul.txt.html.all(this.eqCls).join(html.op('&and;'));
			var ior3 = nul.txt.html.all(this.ior3).join(html.op('&and;'));
			var veto = nul.txt.html.all(this.veto).join(html.op('&or;'));
			if(rv && ior3) rv += html.op('&and;') + ior3;
			else if(ior3) rv = ior3;
			if(rv && veto) rv += html.op('&and;')+html.op('&not;') + veto;
			else if(veto) rv = html.op('&not;') + veto;
			return {
				'': rv?(html.op('(')+rv+html.op(')')):'',
				locals: this.name + (this.locals.length?(' : ' + this.locals.join(', ')):''),
				arbitre: '['+this.minMult+((this.minMult==this.maxMult)?'':('-'+this.maxMult))+']'
			};
		},
		/**
		 * @methodOf nul.klg.ior3#
		 * @return {HTML}
		 */
		ior3: function() {
			return {
				'': html.op('(')+nul.txt.html.all(this.choices).join(html.op('&or;'))+html.op(')')
			};
		},
		
		/**
		 * @methodOf nul.xpr.possible#
		 * @return {HTML}
		 */
		possible: function() {
			if(this===nul.xpr.failure) return { '': html.op('Failure') };
			if(this.knowledge===nul.klg.always) return { '': this.value.toHtml() };
			return {
				'': html.table(
					html.tr(html.td(this.value.toHtml(),'freedom')) +
					html.tr(html.th(this.knowledge.toHtml(),'freedom')),
					'xpr freedom')
			};
		}
	}

});
/*FILE: src/lng/xpr/klg/null.xpr.knowledge.js*/
/*  NUL language JavaScript framework
 *  (c) 2009 E-med Ware
 *
 * NUL is freely distributable under the terms of GNU GPLv3 license.
 *  For details, see the NUL project site : http://code.google.com/p/nul/
 *
 *--------------------------------------------------------------------------*/


nul.xpr.knowledge = new JS.Class(nul.expression, /** @lends nul.xpr.knowledge# */{
	/**
	 * @class Represent a bunch of information about locals and absolute values.
	 * @extends nul.expression
	 * @constructs
	 * @param {String} klgName [optional] Knowledge name
	 */
	initialize: function(klgName, n, x) {
		this.callSuper(null);
 		/**
 		 * Describe the used localspace
 		 * @type String[]
 		 */
        this.locals = this.emptyLocals();
 		/**
 		 * List of all the knowledge that oppose to this knowledge satisfaction
 		 * @type nul.xpr.knowledge[]
 		 */
        this.veto = [];
 		/**
 		 * List of equivalence classes this knowledge assert
 		 * @type nul.klg.eqClass[]
 		 */
 		this.eqCls = [];		//Array of equivalence classes.
 		/**
 		 * List of all the object this knowledge knows (their index is the key) about and the equivalence class they belong to
 		 * @type Access
 		 */
 		this.access = {};		//{nul.xpr.object} object => {nul.klg.eqClass} eqClass
 		/**
 		 * List of all the ior3s that still have to be choosen
 		 * @type nul.klg.ior3[]
 		 */
 		this.ior3 = [];			//List of unchoosed IOR3
 		/**
 		 * Unique name given to the knowledge
 		 * @type String
 		 */
 		this.name = klgName || nul.execution.name.gen('klg');
		if('undefined'== typeof n) n = 1;
		if('undefined'== typeof x) x = n;
		if(!n.expression) n = { minMult:n, maxMult: x };
		this.minMult = n.minMult;
		this.maxMult = n.maxMult;
 	},

	//TODO C
	arythm: function(op, n, x) {
		this.modify();
		if(!n.expression) n = { minMult:n, maxMult: x || n };
		this.minMult = eval(this.minMult + op + n.minMult);
		this.maxMult = eval(this.maxMult + op + n.maxMult);
	},
	//TODO C
	add: function(n, x) { return this.arythm('+', n, x); },
	//TODO C
	mul: function(n, x) { return this.arythm('*', n, x); },

	/**
	 * Retrieve the equivalence class that describe obj
	 * @param {nul.xpr.object|null} obj
	 * @return {nul.xpr.eqClass|null} if obj was specified
	 * @return {nul.xpr.eqClass[String]} if obj was not specified
	 */
	info: function(obj) {
		var atbl = this.summarised?this.summarised.access:this.access;
		return obj?atbl[obj]:atbl;
	},
	
//////////////// privates
 	
 	/**
 	 * Remove the 'access' data used for knowledge modification.
 	 * Debug asserts
 	 */
 	clearAccess: function() {
 		if(!this.access) return;
		if(nul.debugged) {
			for(var i in ownNdx(this.access))
				nul.assert(this.access[i].summarised && 0<= this.eqCls.indexOf(this.access[i]),
		 			'Knowledge access consistence');
			for(var i in ownNdx(this.eqCls))
				for(var e in ownNdx(this.eqCls[i].equivls))
					nul.assert(this.access[this.eqCls[i].equivls[e]] === this.eqCls[i],
		 				'Knowledge access consistence');
		}
		delete this.access;
 	},
 	
	/**
	 * Modify eqCls and set accesses
	 */
 	accede: function(ec) {
		this.modify(); nul.xpr.use(ec, 'nul.klg.eqClass');
		if(ec) ec = ec.placed(this);
		if(ec) {
	 		this.eqCls.push(ec);
			for(var unfd in ownNdx(ec.equivls)) {
				if(nul.debugged) nul.assert(!this.access[ec.equivls[unfd]], 'No double access');
				this.access[ec.equivls[unfd]] = ec;
			}
		}
		return ec;
 	},
 	
	/**
	 * Free ec from this.eqCls if it's not free
	 * @param {nul.klg.eqClass} ec
	 * @return {nul.klg.eqClass} ec
	 */
	freeEC: function(ec) {
 		if(!ec.summarised) return ec;
		var i = this.eqCls.indexOf(ec);
 		if(nul.debugged) nul.assert(0<=i, 'Unaccede accessed class');
		this.eqCls.splice(i, 1);
 		var rv = ec.modifiable();
		for(var i in this.access) if(this.access[i] === ec) this.access[i] = rv;
 		return rv;
 	},

	/**
	 * Own ec from this.eqCls
	 * @param {nul.klg.eqClass} ec
	 * @return {nul.klg.eqClass} ec
	 */
	ownEC: function(ec) {
		var rec = ec.built().placed(this);
		if(rec) this.eqCls.push(rec);
		else this.unaccede(ec);
 	},

 	/**
	 * The eqCls ec is removed : remove access and remove from classes
	 * @param {nul.klg.eqClass} ec
	 * @return {nul.klg.eqClass} ec
	 */
	removeEC: function(ec) {
 		this.modify(); nul.xpr.use(ec, 'nul.klg.eqClass');
		var i = this.eqCls.indexOf(ec);
 		if(nul.debugged) nul.assert(0<=i, 'Unaccede accessed class');
		this.eqCls.splice(i, 1);
		return this.unaccede(ec);
	},
	
 	/**
	 * The eqCls ec has been removed : remove access
	 * @param {nul.klg.eqClass} ec
	 * @return {nul.klg.eqClass} ec
	 */
	unaccede: function(ec) {
 		this.modify(); nul.xpr.is(ec, nul.klg.eqClass);
 		//TODO O: only goes through the access of ec' equivalents
		for(var i in this.access) if(this.access[i] === ec) delete this.access[i];
		return ec;
	},
 	
 	/**
 	 * Add the given equivalence classes in this knowledge
 	 * @param {nul.klg.eqClass[]} eqCls
 	 * @throws {nul.ex.failure}
 	 */
 	addEqCls: function(eqCls) {
 		for(var ec in ownNdx(eqCls)) this.unify(nul.xpr.use(eqCls[ec], 'nul.klg.eqClass'));
 	},
 	
 	/**
 	 * Gets the dependance of an hypothetic possible while this knowledge is not summarised.
 	 */
 	usage: function(value) {
 		//TODO O: use summary if possible.
		var rv = new nul.dependance();
		var comps = value?[value]:[];
		comps.pushs(this.eqCls, this.ior3);
		for(var c=0; c<comps.length; ++c)
			rv.also(comps[c].dependance());
		return rv.use(this);
	},

 //////////////// publics

 	/**
 	 * Gets a value out of these choices
 	 * @param {nul.xpr.possible[]} choices of nul.xpr.possible
 	 * @return nul.xpr.object
 	 */
 	hesitate: function(choices) {
 		choices = beArrg(arguments);
 		this.modify();
		switch(choices.length) {
		case 0:
			nul.fail('No choices');
		case 1:
			return choices[0].valueKnowing(this);
		default:
			var rv = this.newLocal('&otimes;');
			var klgs = [];
			map(choices, function() {
				var p = this;
				var klg;
				if(p.isA(nul.xpr.possible)) {
					klg = p.knowledge.modifiable();
					nul.klg.mod(klg);
					p = p.value;
				} else klg = new nul.xpr.knowledge();				
				klg.unify(p, rv);
				klgs.push(klg.built());	//TODO 2: prune ?
			});
	 		this.ior3.push(new nul.klg.ior3(klgs));
	 		return rv;
		}
	}.describe('Hesitation'),
 	
 	/**
 	 * Know all what klg knows
 	 * @param {nul.xpr.knowledge} klg
 	 * @param {nul.xpr.object} val [optional] Value to modify too
 	 * @return {nul.xpr.object} Value expressed under this knowledge if 
 	 * @return {nul.klg.stepUp} Browser to parse further values if no value were specified
 	 * @throws {nul.ex.failure}
 	 */
 	merge: function(klg, val) {
 		if(nul.klg.never== klg) nul.fail('Merging failure');
 		this.mul(klg);
 		if(klg.isA(nul.klg.ncndtnl)) return val;
 		
 		this.modify(); nul.klg.use(klg);

 		var brwsr = new nul.klg.stepUp(klg.name, this);
		
 		this.concatLocals(klg);

		klg = brwsr.browse(klg);
		
		this.addEqCls(klg.eqCls);
		this.ior3.pushs(klg.ior3);
 		this.veto.pushs(klg.veto);
 		if(val) return brwsr.browse(val);
 		return brwsr;
 	},

 	/**
 	 * Know that all the arguments are unifiable
 	 * Modifies the knowledge
 	 * @param {nul.xpr.object} and {nul.klg.eqClass}
 	 * @return nul.xpr.object The replacement value for all the given values
 	 * @throws {nul.ex.failure}
 	 */
 	unify: function(a, b) {
 		return this.unification(beArrg(arguments)).represent();
 	},
 	 	
	/**
 	 * Know that 'e' is in the sets 'ss'.
 	 * Modifies the knowledge
 	 * @return The replacement value for 'e' or nothing if inclusion failed.
 	 * @throws {nul.ex.failure}
 	 */
 	belong: function(e, ss) {
 		ss = beArrg(arguments, 1);
 		this.modify(); nul.obj.use(e);
		
 		var ec = new nul.klg.eqClass(e);
 		ec.belongs = ss;
 		return this.unify(ec.built());
 	},
 	
 	/**
 	 * States that 'e.anm = vl'
 	 * @param {nul.xpr.object} e
 	 * @param {String} anm
 	 * @param {nul.xpr.object} vl
 	 * @return {nul.xpr.object}
 	 * @throws {nul.ex.failure}
 	 */
 	attributed: function(e, anm, vl) {
 		this.modify(); nul.obj.use(e);
 		var attrs = {};
 		if(vl) attrs[anm] = vl;
 		else attrs = anm;
 		
 		var ec = new nul.klg.eqClass(e, attrs).built();
 		return this.unify(ec);
 	},

 	/**
 	 * Retrieve the attributes stated for 'e'
 	 * @param {nul.xpr.object} e
 	 * @return {nul.xpr.object[]}
 	 * @throws {nul.ex.failure}
 	 */
 	attributes: function(e) {
 		nul.obj.use(e);
 		if(e.isA(nul.obj.defined)) return e.attribute;	//TODO 2 : Special defined case : list needed
		var ec = this.access[e];
		if(!ec) return {};
 		return ec.attribs;
 	},
 	
 	/**
 	 * Retrieve the attribute we know for 'e'
 	 * @param {nul.xpr.object} e
 	 * @param {nul.xpr.String} anm
 	 * @return {nul.xpr.object} The attribute 'anm' stated for e 
 	 * @return {null} There is no information about this attribute 
 	 * @throws {nul.ex.failure}
 	 */
 	attribute: function(e, anm) {
 		nul.obj.use(e);
 		if(e.isA(nul.obj.defined)) return e.attribute(anm, this);
		var ec = this.info(e);
		if(ec && ec.attribs[anm]) return ec.attribs[anm];
		var rv = this.newLocal('&rarr;'+anm);
		this.attributed(e, anm, rv);
		return rv;
 	},
 	
 	/**
 	 * Simplifies oneself knowing the attribute table
 	 * @param {access} dTbl
 	 * @return {String[]} The list of used attributions : xpr indexes
 	 */
 	define: function(acsTbl) {
		this.modify();
		var rv = [];
//		return rv;
		acsTbl = $o.clone(acsTbl);
		var used;
		do {
			used = false;
			for(var v in this.access) {
				if(acsTbl[v]) {
					var ownClass = !!this.access[v].summarised;	//TODO 4: une interface pour pas trimballer un boolean ownClass a l'air
					var nec = this.freeEC(this.access[v]);
					if(nec.define(acsTbl[v], this)) {
						rv.push(v);
						used = true;
					}
					//for(var a in nec.attribs) 
					//	if(nul.obj.local.is(nec.attribs[a]) && nul.obj.local.self.ref == nec.attribs[a].klgRef)
					//		delete nec.attribs[a];
					if(ownClass) this.ownEC(nec);
					delete acsTbl[v];
					break;
				}
			}
		} while(used);
		return rv;
 	}.describe('Sub-knowledge definition'),
 	
	/**
	 * Brings a knowledge in opposition
	 * @param {nul.xpr.knowledge} klg
	 * @throws {nul.ex.failure}
	 */
	oppose: function(klg) {
		this.modify(); nul.klg.use(klg);
		if(0< klg.minXst()) nul.fail('Opposition : ', klg);
		if(nul.klg.never!= klg) this.veto.push(klg);
		return this;
	},

//////////////// Existence summaries

	/**
	 * <a href="http://code.google.com/p/nul/wiki/Summary">Summary</a>: Maximum existance cases of this knowledge
	 * @function
	 * @return {Number}
	 */
	maxXst: nul.summary('maxXst'), 	
	/**
	 * <a href="http://code.google.com/p/nul/wiki/Summary">Summary</a>: Minimum existance cases of this knowledge
	 * @function
	 * @return {Number}
	 */
	minXst: nul.summary('minXst'), 	
	/** <a href="http://code.google.com/p/nul/wiki/Summary">Summary</a> computation of {@link maxXst} */
	sum_maxXst: function() {
		if(0<this.nbrLocals()) return pinf;
		var rv = 1;
		for(var h in ownNdx(this.ior3))
			rv *= this.ior3[h].maxXst();
		return rv * this.maxMult;
	},
	/** <a href="http://code.google.com/p/nul/wiki/Summary">Summary</a> computation of {@link minXst} */
	sum_minXst: function() {
		if(this.eqCls.length || this.veto.length) return 0;
		if(0<this.nbrLocals()) return pinf;
		var rv = 1;
		for(var h in ownNdx(this.ior3))
			rv *= this.ior3[h].minXst();
		return rv * this.minMult;
	},

	/** <a href="http://code.google.com/p/nul/wiki/Summary">Summary</a> computation of {@link index} */
	sum_index: function() {
		return this.indexedSub(this.name);
	},
	
//////////////// nul.expression implementation
	
	/** @constant */
	expression: 'klg',
	/** @constant */
	components: {
		'eqCls': {type: 'nul.klg.eqClass', bunch: true},
		'ior3': {type: 'nul.klg.ior3', bunch: true},
		'veto': {type: 'nul.xpr.knowledge', bunch: true}
	},

	/**
	 * Re-built the access for the new modifiable knowledge.
	 */
	modifiable: function() {
		var rv = this.callSuper();
		rv.eqCls = [];
		rv.access = {};
		for(var i in ownNdx(this.eqCls)) rv.accede(this.eqCls[i]);
		return rv;
	},
	
	/**
	 * Clone taking care to shallow clone access and locals (not refered as components)
	 */
	clone: function() {
		var rv = this.callSuper(beArrg(arguments));
		if(rv.access) rv.access = $o.clone(rv.access);
		rv.locals = this.emptyLocals();
		rv.concatLocals(this);
		return rv;
	},

	/**
	 * When equivalence classes were modified by a browser, re-accede them for the access to be valid and for equivalence class to be consistant.
	 */
	reAccede: function() {
		var nwEqCls = this.eqCls;
		var nwOppstn = this.veto;
		this.veto = [];
		this.eqCls = [];
		this.access = {};
		this.addEqCls(nwEqCls);
		while(nwOppstn.length) this.oppose(nwOppstn.shift());
		return this;
	},

	/**
	 * Reaccede the equivalence classes and build.
	 */
	chew: function() {
		this.reAccede();
		return this.callSuper();
	},
	
	/**
	 * Remove the redundant values. Ensure that the structured is simplified at maximum (no 1-choice IOR3 and no veto's vetos)
	 */
	simplify: function() {
		this.modify();
		//Reduce vetos of vetos into ior3s
		var veto;
		for(var v=0; veto = this.veto[v];)
			if(veto.veto.length) {
				this.veto.splice(v, 1);
				//TODO 4: care about multiplicity 
				var unvetoed = veto.modify();
				unvetoed.veto = [];
				
				var choices = map(veto.veto, function() {
					return unvetoed.clone().merge(this).built();
				});
				var tklg = new nul.xpr.knowledge();
				tklg.oppose(unvetoed.built());
				choices.push(tklg);
				
				this.ior3.push(new nul.klg.ior3(choices));
			} else ++v;

		//Reduce IOR3s : if one has one choice, just merge this choice and forget about ior3
 		for(i=0; this.ior3[i];) switch(this.ior3[i].choices.length) {
 		case 0: nul.ex.internal('IOR3 Always has a first unconditional');
 		case 1:
 			this.merge(this.ior3[0]);
 			this.ior3.splice(i, 1);
 			break;
 		default: ++i; break;
 		}
 		return this;
	},
	
	/**
	 * {@link simplify} and regular build. Return an unconditional global if not conditional.
	 */
 	built: function() {
 		this.simplify();
		var acs = this.access;
		this.clearAccess();
 		if(
 				!this.isA(nul.klg.ncndtnl) &&	//This is not already an unconditional
 				!this.eqCls.length &&			//There are no equivalence/belonging/attribute constraints
 				!this.nbrLocals() &&			//There are no locals involved
 				!this.ior3.length &&			//There are no choices to make
 				!this.veto.length &&			//Nothing oppose to this knowledge
 				this.minMult == this.maxMult)	//This is not an undefined knowledge
 			return nul.klg.unconditional(this.minMult);
 		//if(this.minMult < this.maxMult) this.undefined = nul.execution.name.gen('klg.undefined');
 		//No need : name differenciate different knowledges already
 		var rv = this.callSuper();
 		if(rv === this) rv.summarised.access = acs;
 		return rv;
 	}
});

if(nul.action) nul.localsMdl = new JS.Module(/** @lends nul.xpr.knowledge# */{
	/**
	 * Remove the names of the unused locals.
	 * Use the local names to textualise locals references.
	 */
	useLocalNames: function(keep) {
		for(var i=0; i<this.locals.length; ++i)
			if(!keep[i]) this.locals[i] = null;
			else for(var l = 0; l<keep[i].length; ++l)		//TODO O: useful ? locals should have correct dbgName now
				keep[i][l].invalidateTexts(this.locals[i]);
	},

	/**
	 * An empty set of managed locals
	 */
	emptyLocals: function() { return []; },

	/**
	 * This knowledge now manage this new knowledge locals too
	 */
	concatLocals: function(klg) { this.locals.pushs(klg.locals); },
	
	/**
	 * Unallocate the last local
	 */
	freeLastLocal: function() { this.locals.pop(); },
	
	/**
	 * Get the number of locals this knowledge manage
	 */
	nbrLocals: function() { return this.locals.length; },
	
	/**
	 * Register a new local
	 */
 	newLocal: function(name, ndx) {
 		if('undefined'== typeof ndx) ndx = this.locals.length;
		this.locals[ndx] = name;
 		return new nul.obj.local(this.name, ndx, name);
 	}
 	
}); else nul.localsMdl = new JS.Module(/** @ignore */{
	/** @ignore */
	useLocalNames: function() {},
	/** @ignore */
	emptyLocals: function() { return 0; },
	/** @ignore */
	concatLocals: function(klg) { this.locals += klg.locals; },
	/** @ignore */
	freeLastLocal: function() { --this.locals; },
	/** @ignore */
	nbrLocals: function() { return this.locals; },
	/** @ignore */
 	newLocal: function(name, ndx) {
 		if('undefined'== typeof ndx) ndx = this.locals++;
 		return new nul.obj.local(this.name, ndx, name);
 	}
});

nul.xpr.knowledge.include(nul.localsMdl);
/*FILE: src/lng/xpr/klg/null.klg.js*/
/*  NUL language JavaScript framework
 *  (c) 2009 E-med Ware
 *
 * NUL is freely distributable under the terms of GNU GPLv3 license.
 *  For details, see the NUL project site : http://code.google.com/p/nul/
 *
 *--------------------------------------------------------------------------*/


/**
 * Knowledge management helpers
 * @namespace
 */
nul.klg = /** @lends nul.klg */{
	/**
	 * Create or get an already-built unconditional
	 * @param {Number} mul Multiplicity
	 * @param {String} name Used only when creation is needed
	 * @return {nul.klg.ncndtnl}
	 */
	unconditional: function(mul, name) {
		if(!nul.klg.unconditionals[mul])
			nul.klg.unconditionals[mul] = new nul.klg.ncndtnl(name, mul);
		return nul.klg.unconditionals[mul];
	},
	/**
	 * To avoid doubles, keep the built unconditionals in this table
	 * @type {nul.klg.ncndtnl[]}
	 */
	unconditionals: {},

	ncndtnl: new JS.Class(nul.xpr.knowledge, /** @lends nul.klg.ncndtnl# */{
		/**
		 * @class Unconditional knowledge : only characterised by a min/max existence without real knowledge, condition
		 * @extends nul.xpr.knowledge
		 * @constructs
		 * @param {Number} mul Multiplicity
		 */
		initialize: function(name, mul) {
			this.callSuper(name || ('['+ (mul==pinf?'&infin;':mul.toString()) +']'), mul);
			this.alreadyBuilt();
		},
		/**
		 * Create a brand new knowledge out of the sole multiplicity information
		 */
		modifiable: function() {
			if(0== this.maxMult) nul.fail('No fewer than never');
			return new nul.xpr.knowledge(null, this.minMult, this.maxMult).from(this);
		},
		
		/** @constant */
		components: {},
		/** @constant */
		ior3: [],
		/** @constant */
		eqCls: [],
		/** @constant */
		veto: [],
		/**
		 * The minimum existance multiplicity is constant
		 * @return {Number}
		 */
		minXst: function() { return this.minMult; },
		/**
		 * The maximum existance multiplicity is constant
		 * @return {Number}
		 */
		maxXst: function() { return this.maxMult; }
	}),
	
	//TODO 4: if(!nul.debugged) replace are/is/... by $.id
	/**
	 * Assert: 'x' are a collection of knowledges
	 * @param {nul.object[]} x
	 */
	are: function(x) { return nul.xpr.are(x,'nul.xpr.knowledge'); },
	/**
	 * Assert: 'x' is a knowledge
	 * @param {nul.object} x
	 */
	is: function(x) { return nul.xpr.is(x,'nul.xpr.knowledge'); },
	/**
	 * Assert: 'x' is a knowledge. 'x' is summarised.
	 * @param {nul.object} x
	 */
	use: function(x) { return nul.xpr.use(x,'nul.xpr.knowledge'); },
	/**
	 * Assert: 'x' is a knowledge. 'x' is not summarised.
	 * @param {nul.object} x
	 */
	mod: function(x) { return nul.xpr.mod(x,'nul.xpr.knowledge'); }
};
/**
 * Unconditional knowledge meaning something that is never verified
 */
nul.klg.never = new nul.klg.unconditional(0, 'Never');

/**
 * Unconditional knowledge meaning something that is always verified
 */
nul.klg.always = new nul.klg.unconditional(1, 'Always');


/**
 * Return the knowledge knowing all that ops are equal
 */
nul.klg.unification = function(objs) {
	objs = beArrg(arguments);
	var klg = new nul.xpr.knowledge();
	klg.unify(objs);
	return klg.built();
};

/**
 * Return the wrapped singleton when o is val
 * @param {nul.xpr.object} o
 * @param {nul.xpr.object} val
 * @return {nul.xpr.possible[]}
 * @throws {nul.ex.failure}
 */
nul.klg.has = function(o, val) {
	var klg = new nul.xpr.knowledge();
	return [klg.wrap(klg.unify(o, val))];
};

nul.xpr.knowledge.include({failure: nul.klg.never});
/*FILE: src/lng/xpr/obj/undefnd/null.obj.data.js*/
/*  NUL language JavaScript framework
 *  (c) 2009 E-med Ware
 *
 * NUL is freely distributable under the terms of GNU GPLv3 license.
 *  For details, see the NUL project site : http://code.google.com/p/nul/
 *
 *--------------------------------------------------------------------------*/


nul.obj.data = new JS.Class(nul.obj.undefnd, /** @lends nul.obj.data# */{
	/**
	 * @extends nul.obj.undefnd
	 * @constructs
	 * @class Refers to a data-source from nul.data...
	 */
	initialize: function(ds) {
		this.source = ds;
		this.callSuper();
		this.alreadyBuilt();
	},

//////////////// nul.expression implementation

	/** <a href="http://code.google.com/p/nul/wiki/Summary">Summary</a> computation of {@link dependance} */
	sum_dependance: function() {
		return new nul.dependance(this);
	},

	/** @constant */
	expression: 'data',
	/** <a href="http://code.google.com/p/nul/wiki/Summary">Summary</a> computation of {@link index} */
	sum_index: function() { return this.indexedSub(this.source.context, this.source.index); }
});
/*FILE: src/lng/xpr/obj/undefnd/null.obj.local.js*/
/*  NUL language JavaScript framework
 *  (c) 2009 E-med Ware
 *
 * NUL is freely distributable under the terms of GNU GPLv3 license.
 *  For details, see the NUL project site : http://code.google.com/p/nul/
 *
 *--------------------------------------------------------------------------*/


nul.obj.local = new JS.Class(nul.obj.undefnd, /** @lends nul.obj.local# */{
	/**
	 * @class Define an object that has a local unknown value
	 * @constructs
	 * @extends nul.obj.undefnd
	 * @param {String} klgRef The knowledge this local applies to
	 * @param {String} ndx The index of this local in the knowledge local-space
	 * @param {String} dbgName A string to draw as the name of this variable for debug info
	 */
	initialize: function(klgRef, ndx, dbgName) {
		if(nul.debugged) nul.assert(dbgName, 'Local has name if debug enabled');
		this.callSuper();
		
		/**
		 * The knowledge this local applies to
		 * @type String
		 */
		this.klgRef = klgRef;
		/**
		 * The index of this choice in the knowledge local-space
		 * @type String
		 */
		this.ndx = ndx;
		/**
		 * A string to draw as the name of this variable for debug info
		 * @type String
		 */
		this.dbgName = dbgName;
		if(dbgName && ('_'== dbgName || 
				('&'== dbgName.substr(0,1) && '&rarr;'!= dbgName.substr(0,6))))
			this.anonymous = true;
		this.alreadyBuilt({
			index: this.indexedSub(this.klgRef, this.ndx)
		});
	},

////////////////nul.expression implementation

	/** Specific dependance computation for locals */
	sum_dependance: function() { return new nul.dependance(this); },
	
	/** @constant */
	expression: 'local',
	/**
	 * Change the string debug-names used.
	 * @param {String} dbgName A string to draw as the name of this variable for debug info
	 */
	invalidateTexts: function(dbgName) {
		if(nul.debugged) nul.assert(dbgName, 'Local has name if debug enabled'); 
		this.dbgName = dbgName;
		this.callSuper();
	}
});
//TODO 3: Surligner le self-ref content dans l'html
/**
 * Helper to create a local that specify 'myself' for the given expression
 * @param {String} ndx
 * @param {String} dbgName A string to draw as the name of this variable for debug info
 * @return {nul.obj.local}
 */
nul.obj.local.self = function(ndx, dbgName) {
	return new nul.obj.local(
			nul.obj.local.self.ref,
			ndx || nul.execution.name.gen('obj.local.self'),
			dbgName || '&uArr;');
};

/** @constant */
nul.obj.local.self.ref = '&crarr;';
/*FILE: src/lng/xpr/obj/undefnd/null.obj.operation.js*/
/*  NUL language JavaScript framework
 *  (c) 2009 E-med Ware
 *
 * NUL is freely distributable under the terms of GNU GPLv3 license.
 *  For details, see the NUL project site : http://code.google.com/p/nul/
 *
 *--------------------------------------------------------------------------*/


//TODO 4: ((a + b) + (c + d)) => (a + b + c + d)
//TODO 4: ((a - b) - c) =?> (a - (b + c)) 
//TODO 4: (a - (b - c)) =?> ((a + c) - b) !!!/0 

nul.obj.operation = new JS.Class(nul.obj.undefnd, /** @lends nul.obj.operation# */{
	/**
	 * @class Define an operator applied to one or several objects
	 * @constructs
	 * @extends nul.obj.undefnd
	 * @param {String} operator The operator binding
	 * @param {nul.xpr.object[]} ops The operands
	 */
	initialize: function(operator, ops) {
		this.operator = operator;
		this.operands = ops;
		this.callSuper();
		this.alreadyBuilt();
	},
	
//////////////// nul.expression implementation
	
	/** @constant */
	expression: 'operation',
	/** @constant */
	components: {'operands': {type: 'nul.xpr.object', bunch: true}}
});

nul.obj.operation.binary = new JS.Class(nul.obj.operation, {
	//TODO 3
});

nul.obj.operation.Nary = new JS.Class(nul.obj.operation, {
	//TODO 3
});
/*FILE: src/lng/xpr/klg/null.klg.algo.js*/
/*  NUL language JavaScript framework
 *  (c) 2009 E-med Ware
 *
 * NUL is freely distributable under the terms of GNU GPLv3 license.
 *  For details, see the NUL project site : http://code.google.com/p/nul/
 *
 *--------------------------------------------------------------------------*/


nul.xpr.knowledge.include(new JS.Module(/** @lends nul.xpr.knowledge# */{
 	/**
 	 * Remove any information about locals that are not refered anymore
 	 * @param {nul.xpr.object} value
 	 * @note remove all access before : they are not preserved
 	 * @return nothing
 	 */
 	pruned: function(value) {
 		this.modify();
		this.clearAccess();
 		var vdps = new nul.dependance();
		
		if(value) vdps.also(value.dependance());
		var i;
		for(i in ownNdx(this.ior3)) vdps.also(this.ior3[i].dependance());
		for(i in ownNdx(this.veto)) vdps.also(this.veto[i].dependance());
		vdps = this.localNeed(vdps.usage(this).local);

		//Remove useless equivalence class specifications
		for(var c=0; c<this.eqCls.length;) {
			this.eqCls[c] = this.eqCls[c].pruned(this, vdps);
			if(!this.eqCls[c]) this.eqCls.splice(c,1);
			else ++c;
		} 
 		
 		var deps = this.usage(value);
 		
 		//Remove trailing unrefered locals (not more to preserve indexes)
		while(this.nbrLocals() && !deps.local[this.nbrLocals()-1]) this.freeLastLocal();
 		this.useLocalNames(deps.local);
 		
 		this.reAccede();	//TODO O: maintaint access while pruning instead of rebuilding it
 		
 		return this;
 	}.describe('Prune'),

	/**
	 * Make the need envelope of locals.
	 * If at least 'lcls' are needed to determine a value, then determine which locals are needed
	 * to determine a value, for this knowledge, regarding the equivalence classes
	 * @param {association(ndx: any)} lcls List of needed locals at least
	 * @return {association(ndx: true)} lcls List of needed locals
	 */
	localNeed: function(lcls) {
		lcls = map(lcls,function() { return 3; });
		var toNeed = $.keys(lcls);
		///1: calculate influences
		var max = function(a,b) { return !a?b:!b?a:a>b?a:b; };
		/**
		 * Change the list of local needs and determine which local is discovered needed
		 * knowing that local 'ndx' is needed 'infl' (infl = 1(belong) or 2(equival))
		 * @param {index} ndx Local index
		 * @param {association(ndx:influence)} infl Influence = 1: something belongs to this local. 2: Something is equived to this local
		 * @param {association(ndx:need)} lcls how locals are already known to be needed
		 * @return {array[index]} Locals freshly disvorered to be needed
		 */
		var influence = function(infl, lcls) {
/*(infl[ndx] \ lcls[ndx] :	('>' means 'more than 2')
 * 			0	1	2	>
 * 		1	1	1	>	>
 * 		2	2	>	>	>
 */
 			var rv = [];
 			for(var ndx in infl)
				if( (1!= lcls[ndx] || 1!= infl[ndx]) &&	
					(!lcls[ndx] || 2>= lcls[ndx]) &&
					(2< (lcls[ndx] = (lcls[ndx]||0)+infl[ndx])) )
						rv.push(ndx);
			return rv;
		};
		var lclInfl = {};	//nx => {ndx: [0, 1, 2]}
		//	0: no need
		//	1: define content
		//	2: define equivalence
		for(var c=0; c<this.eqCls.length; ++c) {
			var ec = this.eqCls[c];
			var elms = [];
			elms.pushs(ec.equivls);
			elms.pushs(ec.belongs);
			var extInfl = false;
			
			//Compute influence from other knowledge.
			// If influence from several elements, influence the whole class
			// If influence from only one element, influence the class without that element 
			for(var e in ownNdx(elms)) if('local'!= elms[e].expression || this.name!= elms[e].klgRef) {
					extInfl = extInfl?true:e;
					if(true=== extInfl) break;
				}
			//If this refer to something defined by its attributes
			if(true!== extInfl && !isEmpty(ec.attribs,'')) extInfl = extInfl?true:'attribs:*';
			//If this refer to something equaled in absolute
			if(true!== extInfl && this.eqCls[c].eqvlDefined()) extInfl = extInfl?true:'equivls:0';
			//If this refer to something beblonging in absolute
			if(true!== extInfl && this.eqCls[c].blngDefined()) extInfl = extInfl?true:'belongs:0';
			
			if(extInfl) //If this refer to something defined in another context
				toNeed.pushs(influence(ec.influence(this, extInfl), lcls));
			if(true!== extInfl) for(var e in ownNdx(elms)) {
				//For each usage of this element, influence each other usage of the eqclass
				for(var srcNdx in elms[e].dependance().usage(this).local)
					lclInfl[srcNdx] = ec.influence(this, e, extInfl, lclInfl[srcNdx]);
			}
		}
		//2: use influence to need all influenced locals
		while(toNeed.length)
			toNeed.pushs(influence(lclInfl[toNeed.shift()], lcls));
		return map(lcls,function(i, o) { return 3<=o; });
	},
	
  	/**
 	 * Know that all the arguments are unifiable
 	 * Modifies the knowledge
 	 * @param {nul.xpr.object} and {nul.klg.eqClass}
 	 * @return {nul.klg.eqClass} unsummarised (if in a higher-stack level unification) or summarised
 	 * @throws {nul.ex.failure}
 	 */
 	unification: function() { 	
 		var toUnify = beArrg(arguments);
 		this.modify();
 		var dstEqCls = new nul.klg.eqClass();
 		var alreadyBlg = {};	//TODO 3: make a 'belong' this.access ?
 		var toBelong = [];
 		var ownClass = true;
 		while(toUnify.length || toBelong.length) {
 			while(toUnify.length) {
	 			var v = toUnify.shift();
	 			nul.xpr.use(v);
	 			if(this.access[v]) {
	 				v = this.access[v];
	 				if(dstEqCls=== v) {}
	 				else if(!v.summarised) {	//If not summarised, then it's a class built in another unification higher in the stack
	 					ownClass = false;
	 					this.unaccede(dstEqCls);
	 					dstEqCls.merged = v;
	 					v = dstEqCls;
	 					dstEqCls = v.merged;
	 				}
	 				else this.removeEC(v);
	 			}
	 			if(dstEqCls=== v) {}
	 			else if('eqCls'== v.expression) {
	 				toUnify.pushs(v.equivls);
					toBelong.pushs(v.belongs);
					dstEqCls.hasAttr(v.attribs, this);
	 			} else {
	 				this.access[v] = dstEqCls;
	 				dstEqCls.isEq(v, this);
	 			}
	 		}
	 		if(toBelong.length) {
	 			var s = toBelong.shift();
				alreadyBlg[s] = true;
				dstEqCls.isIn(s, this);
	 		}
 		}
 		if(ownClass) this.ownEC(dstEqCls);
		return dstEqCls;
 	}.describe('Unification'),

 	/**
 	 * Get a pruned possible
 	 * @param {nul.xpr.object} value
	 * @return {nul.xpr.possible}
	 * @throws {nul.ex.failure}
 	 */
 	wrap: function(value) {
 		this.modify(); nul.obj.use(value);
		var representer = new nul.klg.represent(this);
		if(nul.debugged) nul.debugged.info('Represent')('Representants', this.name, this);
		for(var i=0; i<this.eqCls.length;) {
			var ec = this.eqCls[i];
			var nec = representer.subBrowse(ec);
			if(nul.browser.bijectif.unchanged == nec) ++i;
			else {
				value = representer.browse(value);
				this.removeEC(ec);
				nec = this.unify(nec);
				
				//this.unification has effect on other equivalence classes that have to change in the representer
				representer.invalidateCache();
				
				if(nul.debugged) nul.debugged.info('Represent')('Representants', this.name, this);
				i = 0;
			}
		}

		//TODO O: represent sur ior3s : useful or we let it post-resolution ?
		value = representer.browse(value);
		
		var opposition = this.veto;
		//TODO 3: browse 'vetos' like 'value'
		this.veto = [];
		while(opposition.length)
			this.oppose(representer.browse(opposition.shift()));
 		
		this.simplify();
		
		this.pruned(value);
 		
 		return new nul.xpr.possible(value, this.built());
 	}.describe('Wrapping'),
	
	
	/**
	 * Determine wether the resolution engine can distribute anything
	 * @return {Boolean}
	 */
	distribuable: function() {
		return !!this.ior3.length;
	},
	
	/**
	 * Use the resolution engine : make several knowledges (modifiables) without ior3
	 * @return {nul.xpr.possible[]}
	 */
	distribute: function() {
		if(this.ior3.length) return nul.solve.apply(this.modifiable());
		return [this.modifiable()];
	}.describe('Distribution'),
	
	/**
	 * Use the resolution engine : make several knowledges (built) without ior3
	 * @return {nul.xpr.possible[]}
	 */
	distributed: function() {
		if(this.ior3.length) return map(nul.solve.apply(this.modifiable()), this.built);
		return [this];
	}.describe('Distribution'),
	
	/**
	 * Returns a list of all the eqClass we know 'obj' contains
	 * @param {nul.xpr.object} obj
	 * @return {Number[]} The indexes of the equivalence classes defining obj in extension 
	 */
	extension: function(obj) {
		var rv = {};
		for(var ec=0; this.eqCls[ec]; ++ec) {
			var b = this.eqCls[ec].extension(obj);
			if(-1< b) rv[ec] = b;
		}
		return rv;
	},

	/**
	 * @param {String} selfRef
	 * @param {nul.xpr.object[]} alrEqs TODO 2: rename param
	 * @param {nul.xpr.object} point
	 * @return {nul.xpr.possible}
	 */
	sumRecursion: function(selfRef, alrEqs, point) {
		this.modify(); nul.obj.use(point);/* nul.obj.are(alrEqs);*/
		var rv = [];
		var blgSpec = false;
		for(var ec=0; this.eqCls[ec]; ++ec) {
			for(var b=0; this.eqCls[ec].belongs[b]; ++b) {
				blgSpec = true;
				//TODO O: ne pas faire unify et diff sur tout, quand c'est trivial
				try {
					var klg = this.clone();
					var eqc = klg.freeEC(klg.eqCls[ec]);
					klg.oppose(nul.klg.unification(eqc.belongs.splice(b, 1)[0], nul.obj.local.self(selfRef)));
					klg.ownEC(eqc);
					rv.pushs(klg.sumRecursion(selfRef, alrEqs, point));
				} catch(e) { nul.failed(e); }

				try {
					var klg = this.clone();		//TODO 2: don't clone?
					var nalrEqs = map(alrEqs);	//TODO 2: don't clone?
					var eqc = klg.freeEC(klg.eqCls[ec]);
					klg.unify(eqc.belongs.splice(b, 1)[0], nul.obj.local.self(selfRef));
					klg.ownEC(eqc);
					nalrEqs.unshift(eqc.represent());
					rv.pushs(klg.sumRecursion(selfRef, nalrEqs, point));
				} catch(e) { nul.failed(e); }
			}
		}
		if(blgSpec) return rv;
		return [this.wrap(new nul.obj.lambda(point, nul.obj.pair.list(null, alrEqs)))];
	}
}));
/*FILE: src/lng/xpr/klg/null.klg.browse.js*/
/*  NUL language JavaScript framework
 *  (c) 2009 E-med Ware
 *
 * NUL is freely distributable under the terms of GNU GPLv3 license.
 *  For details, see the NUL project site : http://code.google.com/p/nul/
 *
 *--------------------------------------------------------------------------*/


nul.klg.stepUp = new JS.Class(nul.browser.bijectif, /** @lends nul.klg.stepUp# */{
	/**
	 * @class Browser to replace a erference to a knowledge to a reference to another knowledge and modifying the local names 
	 * @extends nul.browser.bijectif
	 * @constructs
	 * @param {String} srcKlgRef The knowledge name whose space the expression is taken of
	 * @param {nul.xpr.knowledge} dstKlg The knowledge whose space the expression is taken to
	 */
	initialize: function(srcKlgRef, dstKlg) {
		var nl = dstKlg.nbrLocals();
		this.toNode = function() {
			return $('<span />')
				.append($.text('StepUp from '))
				.append($('<span />').text(srcKlgRef))
				.append($.text(' to '))
				.append($('<span />').text(dstKlg.name))
				.append($.text(' whom has '))
				.append($('<span />').text(nl))
				.append($.text(' locals'));				
		};
		this.table = {};
		this.forbid = {};
		this.table[srcKlgRef] = {
			klgRef: dstKlg.name,
			deltaLclNdx: dstKlg.nbrLocals(),
			prime: true
		};
		this.callSuper('StepUp', null);
	},
	enterKlg: function(klg) {
		if(klg && !klg.isA(nul.klg.ncndtnl) && !this.table[klg.name]) {
			if(nul.debugged) nul.assert(!this.forbid[klg.name], 'Knowledge already used before entering');
			this.table[klg.name] = { klgRef: nul.execution.name.gen('klg') };
			for(var v in ownNdx(this.veto)) this.enterKlg(this.veto[v]);
			for(var i in ownNdx(this.ior3))
				for(var c in ownNdx(this.ior3[i].choices))
					this.enterKlg(this.ior3[i].choices[c]);
		}
	},
	enter: function(xpr) {
		if('possible'== xpr.expression) this.enterKlg(xpr.knowledge);
		if('klg'== xpr.expression) this.enterKlg(xpr);
		return this.callSuper();
	},
 	forceBuild: function(xpr) { return 'klg'== xpr.expression && !xpr.isA(nul.klg.ncndtnl); },
	/**
	 * If a self-ref was planned, make it in the newly built expression.
	 */
	build: function(xpr) {
		if('klg'== xpr.expression && !xpr.isA(nul.klg.ncndtnl)) {
			if(nul.debugged) nul.assert(this.table[xpr.name], 'Only leave entered knowledge');
			xpr.name = this.table[xpr.name].klgRef;
		}
		return this.callSuper();
	},	
	/**
	 * Changes locals to refer the new context
	 */
	transform: function(xpr) {
		var dst;
		if('local'== xpr.expression) {
			if(dst = this.table[xpr.klgRef]) return new nul.obj.local(dst.klgRef, xpr.ndx+(dst.deltaLclNdx||0), xpr.dbgName).from(xpr);
			this.forbid[xpr.klgRef] = true;
		}
		return nul.browser.bijectif.unchanged;
	}
});

nul.klg.represent = new JS.Class(nul.browser.bijectif, /** @lends nul.klg.represent# */ {
	/**
	 * @class Browser to replace in an expression any occurrence of an object that appears in an equivalence class by the equivalence class representant
	 * @extends nul.browser.bijectif
	 * @constructs
	 * @param {Access} access The access to use to replace values
	 */
	initialize: function(klg) {
		if(nul.action) {
			this.toNode = function() {
				return $('<span />')
					.append($.text('Representing with '))
					.append(this.klg.toNode());				
			};
			this.klg = klg;
		}
		nul.klg.is(klg);
		this.tbl = klg.info();
		this.dbgName = klg.name;
		this.callSuper('Representation');
		this.prepStack = [];
	},
	/**
	 * Used to browse an equivalence class. As each equivalence class appear in the replacement table, they should be protected not to have
	 * their whole components replaced by the only representant.
	 * @param {nul.klg.eqClass} eqc
     * @return {nul.klg.eqClass|nul.browser.bijectif.unchanged}
	 */
	subBrowse: function(eqc) {
		nul.xpr.use(eqc, 'nul.klg.eqClass');
        this.protect = {};
        for(var i=0; i<eqc.equivls.length; ++i)
        	this.protect[eqc.equivls[i]] = eqc.equivls[i];
        try { return this.recursion(eqc); }
        finally {
            for(var i in this.protect) this.uncache(this.protect[i]);
            delete this.protect;
        }
    },
    /**
     * Retrieve, if any, the replacement value for this expression along the replacement table\
     * @param {nul.expression} xpr
     * @return {nul.expression | null}
     */
    tableTransform: function(xpr) {
    	if(this.tbl[xpr] && this.tbl[xpr].represent() != xpr) return this.tbl[xpr].represent();
    },
    /**
     * Only cache if it doesn't appear in the replacement table.\
     * If it does appear, the replacement can be different from one time to another becauyse of protection.
     */
	cachable: function(xpr) {
		return !this.tableTransform(xpr);
	},
	/**
	 * Decide if the value can be changed along the replacement table or not.
     * @param {nul.expression} xpr
     * @return {Boolean}
	 */
	changeable: function(xpr) {
		return this.tableTransform(xpr) && (!this.protect || !this.protect[xpr] || 2<this.prepStack.length);
	},
	/**
	 * Only enter if we don't have a replacement value directly in the access table
	 */
	enter: function(xpr) {
		this.prepStack.unshift(xpr);
		if(this.changeable(xpr)) return false;

		return this.callSuper();
	},
	leave: function(xpr) {
		if('klg'== xpr.expression) {
			var chd = xpr.modifiable();
			if(chd.define(this.tbl).length) return chd.built();
		}
		return this.callSuper();
	},
 	//forceBuild: function(xpr) { return 'klg'== xpr.expression; },
	/**
	 * If a self-ref was planned, make it in the newly built expression.
	 */
	build: function(xpr) {
		if(xpr.setSelfRef) {
			xpr.selfRef = xpr.setSelfRef;
			delete xpr.setSelfRef;
			delete this.prepStack[0].setSelfRef;
		}

		if('klg'== xpr.expression) {
			xpr.reAccede().define(this.tbl);
			return xpr.built();
		}
		
		return this.callSuper();
	},
	/**
	 * Manage the prepStack in case of failure
	 */
	abort: function(xpr) {
		this.prepStack.shift();
		return this.callSuper();
	},
	/**
	 * Change an expression into another along the table. Mark a selfRef to do if needed.
	 */
	transform: function(xpr) {
		var p = this.prepStack.shift();
		var evl = new nul.browser.bijectif.evolution(xpr);
		if(this.changeable(evl.value)) evl.receive(this.tableTransform(xpr));
		//If I'm replacing a value by an expression that contains this value, just don't
		var n = this.prepStack.indexOf(evl.value);
		if(-1< n) {
			evl.receive(nul.obj.local.self(evl.value.selfRef || evl.value.setSelfRef));
			this.prepStack[n].setSelfRef = evl.value.ndx;
		}

		if(nul.debugged && evl.hasChanged) nul.debugged.info('Represent')('Replacement', this.dbgName, evl.changed, xpr, p);
		return evl.changed;
	}
});
/*FILE: src/lng/xpr/klg/null.klg.eqClass.js*/
/*  NUL language JavaScript framework
 *  (c) 2009 E-med Ware
 *
 * NUL is freely distributable under the terms of GNU GPLv3 license.
 *  For details, see the NUL project site : http://code.google.com/p/nul/
 *
 *--------------------------------------------------------------------------*/


nul.klg.eqClass = new JS.Class(nul.expression, /** @lends nul.klg.eqClass# */{
//TODO 4: rename local when we have a non-anonymous name
	/**
	 * @class Represent a list of values that are known unifiable, along with the sets they're known in and their known attributes 
	 * @extends nul.expression
	 * @constructs
	 * @param {nul.xpr.object} obj An object the class is initialised zith
	 * @param {Attributes} attr The attributes the object is known zith
	 */
	initialize: function(obj, attr) {
		this.callSuper(null);
 		if(obj && 'eqCls'== obj.expression) {
			this.equivls = map(obj.equivls);	//Equal values
			this.belongs = map(obj.belongs);	//Sets the values belong to
			this.attribs = $o.clone(obj.attribs);	//Sets the attributes owned
 		} else {
			this.equivls = obj?[obj]:[];
			if(obj) this.represent(obj);
			this.belongs = [];
			this.attribs = attr || {};
		}
	},

//////////////// private
	
	/**
	 * Order the values to equal.
	 * @param {nul.xpr.object} v
	 * @param {nul.xpr.knowledge} klg 
	 * @return A big number if not interesting, a small one if a good "replacement value"
	 * Note: v is undefined 
	 */
	orderEqs: function(v, klg) {
		//if(nul.obj.local.is(v) && nul.obj.local.self.ref == v.klgRef) return -2;
		if(v.isA(nul.obj.defined)) return -1;
		var d = v.dependance();
		var rv = 0;
		if('local'!= this.expression || klg.name!= this.klgRef) rv += 1;
		if(klg && !isEmpty(d.usage(klg).local)) rv += 2;
		if(v.anonymous) rv += 0.5;
		return rv;
	},

//////////////// public equivalence class modification

	/**
	 * Retrieve the representant of this equivalence class, knowing that it could be 'obj' also.
	 * @param {nul.xpr.object} obj
	 * @return {nul.xpr.object}
	 */
	represent: function(obj) {
		return this.equivls[0];
		if(obj && (!this.representant || this.orderEqs(obj) < this.orderEqs(this.representant))) this.representant = obj;
		nul.xpr.use(this.representant);
		return this.representant;
	},
	
	/**
	 * Add an object in the equivlence.
	 * @param {nul.xpr.object} o object to add
	 * @param {nul.xpr.knowledge} klg
	 * @return nothing
	 * @throws {nul.ex.failure}
	 */
	isEq: function(o, klg) {
 		this.modify(); nul.obj.use(o);
		//Add an object to the equivalence class
		nul.obj.use(o);
		if(o.isA(nul.obj.defined)) {
			if(this.eqvlDefined())
				nul.trys(function() {
					nul.klg.mod(klg);
					var unf;
					try {
						unf = this.equivls[0].unified(o, klg);
					} catch(err) {
						if(this.equivls[0].expression == o.expression) throw err;
						nul.failed(err);
						unf = o.unified(this.equivls[0], klg);
					}
					if(true=== unf) unf = this.equivls[0];
					else {
						if(nul.debugged) {
							nul.assert(klg.access[this.equivls[0]] == this, 'Access consistence');
							nul.assert(klg.access[o] == this, 'Access consistence');
						}
						//TODO O: still let 'o' and 'this.equivls[0]' so they are replaced straight in representation ?
						delete klg.access[o];
						delete klg.access[this.equivls[0]];
						klg.access[unf] = this;
						this.equivls[0] = unf;
					}
					return this.represent(unf);
				}, 'Equivalence', this, [this.equivls[0], o]);
			else {
				this.equivls.unshift(o);
				this.hasAttr(this.attribs, klg);
			}
 			this.wedding(klg);
		} else {
			var p = 0;
			var ordr = this.orderEqs(o, klg);
			for(p=0; p<this.equivls.length; ++p) if(ordr<this.orderEqs(this.equivls[p], klg)) break;
			this.equivls.splice(p,0,o);
		}
		return this.represent(o);
	},

	/**
	 * Add an object as a belongs.
	 * @param {nul.xpr.object} o object that belongs the class
	 * @param {nul.xpr.knowledge} klg
	 * @throws {nul.ex.failure}
	 */
	isIn: function(s, klg) {
 		this.modify(); s.use();
 		if(s.isA(nul.obj.defined)) {
 			while(true) {
 				var ntr = null, sn;
	 			for(sn=0; this.belongs[sn] && this.belongs[sn].isA(nul.obj.defined); ++sn) {
	 				var ntr = this.intersect(klg, s, this.belongs[sn]);
	 				if(ntr) break;
	 			}
 				if(ntr) {
 					this.belongs.splice(sn,1);
 					s = ntr;
 				} else {
 					this.belongs.unshift(s);
 					break;
 				}
 			}
 			this.wedding(klg);
 		} else {
 			var b;
 			for(b=0; this.belongs[b]; ++b) if(this.belongs[b].toString() == s.toString()) break;
 			if(!this.belongs[b]) this.belongs.push(s);
 		}
	},
	
	/**
	 * Specify attributes
	 * @param {Attributes} attrs 
	 * @param {nul.xpr.knowledge} klg
	 * @return {Boolean} Weither the call was useless
	 * @throws {nul.ex.failure}
	 */
	hasAttr: function(attrs, klg) {
		this.modify();
		var useless = true;
		if(this.eqvlDefined()) {
			for(var an in attrs) klg.unify(attrs[an], this.equivls[0].attribute(an, klg));
			useless = isEmpty(attrs);
			this.attribs = {};
		} else if(this.attribs !== attrs) {	//TODO 3: gardien est-il necessaire?
			merge(this.attribs, attrs, function(a,b) {
				if((a?a.toString():'')==(b?b.toString():'')) return a;
				useless = false;
				return (a&&b)?klg.unify(a,b):(a||b);
			});
			if(!useless) this.wedding(klg);
		}
		return useless;
	},

	/**
	 * Sets the information that defines the values : the attributes and the defined belong
	 * @param {nul.klg.eqClass} def The class that give some definitions for me
	 * @param {nul.xpr.knowledge} klg The knowledge of this class
	 * @returns {Boolean} Weither something changed
	 */
	define: function(def, klg) {
		var rv = false;
		for(var a in def.attribs) if(this.attribs[a] && def.attribs[a] != this.attribs[a]) {
			rv = true;
			klg.unify(def.attribs[a], this.attribs[a]);
			delete this.attribs[a];
		}
		//rv |= !this.hasAttr(def.attribs, klg);
		return rv;
	},	
	
////////////////	private equivalence class modification

	/**
	 * Try to apply what we know about defined equivalents, defined belongs and attributes
	 * @param {nul.xpr.knowledge} klg
	 */
	wedding: function(klg) {
		nul.klg.mod(klg);
		var unf = this.equivls[0];
		if(!isEmpty(this.attribs) && !unf && this.blngDefined()) {
			unf = klg.newLocal(nul.understanding.rvName);
			klg.access[unf] = this;
			this.equivls.unshift(unf);
		}
		for(var sn=0; this.belongs[sn] && this.belongs[sn].isA(nul.obj.defined);) {
			var attrs = this.attribs;
			if('lambda'== unf.expression) attrs = klg.attributes(unf.image);
			var chx = this.belongs[sn].has(unf, attrs);
			if(chx) {
				this.belongs.splice(sn,1);
				unf = klg.hesitate(chx);
				delete klg.access[this.equivls[0]];
				klg.access[this.equivls[0] = unf] = this;
			}
			else ++sn;
		}
	},
	
	/**
	 * Try to see the programmed intersections of these two sets - knowing that these two sets can have different 'opinions' about it.
	 * Fails when both intersection fail, gives nothing when both intersection give nothing, else give any of the result the intersection gave.
	 * @param {nul.xpr.knowledge} klg
	 * @param {nul.obj.defined} s1
	 * @param {nul.obj.defined} s2
	 * @return {nul.obj.defined | null} Nothing if nothing can still be said
	 * @throws {nul.ex.failure}
	 */
	intersect: function(klg, s1, s2) {
		if(s1==s2) return s1;
		var rv;
		var trueDft = function(c,d) { return (true===c)?d:c; };
		
		return nul.trys(function() {
			try {
				rv = s1.intersect(s2, klg);
				if(rv) return trueDft(rv, s1);					//If (1 & 2) give a result, don't even wonder what (2 & 1) is, just be happy with that
			} catch(err) {
				nul.failed(err);								//If (1 & 2) failed, try to give (2 & 1)
				return trueDft(s2.intersect(s1, klg), s2);		//If (2 & 1) failed too, just fail
			}
			//We're here when (1 & 2) returns nothing
			try {
				return trueDft(s2.intersect(s1, klg), s2);		//If (2 & 1) give a result, while (1 & 2) had nothing to say, just take that as the answer
			} catch(err) {
				nul.failed(err);								//If (2 & 1) failed, we'r not sure, while (1 & 2) didn't fail or give a result
			}
			//So we returns nothing
		}, 'Intersection', this, [s1, s2]);
	},

////////////////	public prune system
	
	/**
	 * Compute the influence of this equivalence class (excluded 'exclElm')
	 * @param {nul.xpr.knowledge} klg
	 * @param {String: integer} excl Element to exclude, from the summary.components
	 * @param {String: integer} only Element to filter, from the summary.components
	 * @param {association(ndx=>infl)} already The influences already computed (modified by side-effect)
	 * @return {association(ndx=>infl)} Where 'ndx' is a local index and 'infl' 1 or 2 
	 */
	influence: function(klg, excl, only, already) {
		var rv = already || {};
		var eqc = this;
		var destSelect = function(cn, ndx) {
			return excl!= cn+':'+ndx && excl!= cn+':*' &&
				(!only || only==cn+':'+ndx || only==cn+':*' || ('undefined'== typeof ndx && cn==only.substr(0, cn.length)));
		};
		var subInfluence = function(cn, infl) {
			if(destSelect(cn))
				for(var e in ownNdx(eqc[cn])) if(destSelect(cn, e))
					for(var ndx in eqc[cn][e].dependance().usage(klg).local)
						if(!rv[ndx] || rv[ndx]<infl) rv[ndx] = infl;
		};
		subInfluence('belongs', 1);
		subInfluence('equivls', 2);
		subInfluence('attribs', 3);
		return rv;
	},
	
	/**
	 * Remove items that are not used in this knowledge
	 * Not used = depending on nothing else than the useless locals of thisknowledge
	 * @param {nul.xpr.knowledge} klg Pruned knowledge this class belongs to
	 * @param {association(ndx: true)} lcls List of used locals
	 */
	pruned: function(klg, lcls) {
		var remover = function() {
			if('local'!= this.expression || 
					klg.name!= this.klgRef ||
					lcls[this.ndx])
				return this;
		};
		var nVals = maf(this.equivls, remover);
		var nBlgs = maf(this.belongs, remover);
		//TODO 3: FA: do we forget attributes ?
		//FA var nAtts = maf(this.attribs, remover);
		if(nVals.length == this.equivls.length && nBlgs.length == this.belongs.length
			/*FA && nAtts.length == this.attribs.length*/) return this;
		var rv = this.modifiable();
		rv.equivls = nVals;
		rv.belongs = nBlgs;
		//FA rv.attribs = nAtts;
		return rv.built().placed(klg); 
	},
	
////////////////	public 
	
	/**
	 * Is the equivalences defined or is there only undefined objects unified ?
	 * @return {Boolean}
	 */
	eqvlDefined: function() { return this.equivls.length && this.equivls[0].isA(nul.obj.defined); },
	/**
	 * Is the belonging sets defined or is there only undefined sets whose the class belongs to ?
	 * @return {Boolean}
	 */
	blngDefined: function() { return this.belongs.length && this.belongs[0].isA(nul.obj.defined); },

	/**
	 * Determines weither this class defines elements of obj
	 * @param {nul.xpr.object} obj
	 * @return {Number} Index in belongs or -1 if not found
	 */
	extension: function(obj) {
		for(var b=0; this.belongs[b]; ++b)
			if(obj.toString() == this.belongs[b].toString())
				return b;
	},
	
//////////////// nul.expression implementation
	
	/** @constant */
	expression: 'eqCls',
	/** @constant */
	components: {
		'equivls' : {type: 'nul.xpr.object', bunch: true},
		'belongs' : {type: 'nul.xpr.object', bunch: true},
		'attribs' : {type: 'nul.xpr.object', bunch: true}
	},

	placed: function(prnt) {
		nul.klg.mod(prnt);
		if(!this.equivls.length && isEmpty(this.attribs,'') && 1== this.belongs.length && this.blngDefined()) {
			if('&phi;'== this.belongs[0].expression) nul.fail("&phi; is empty");
			return;
		}
		//TODO 4: this goes in knowledge prune (cf comment in prune) : pruned called on wrap and general built (for opposition, ior3, ...)
		if(!this.belongs.length && (!this.equivls.length || 
			(1== this.equivls.length && isEmpty(this.attribs))))
				return;
		return this.callSuper();
	}
});
/*FILE: src/lng/xpr/klg/null.klg.ior3.js*/
/*  NUL language JavaScript framework
 *  (c) 2009 E-med Ware
 *
 * NUL is freely distributable under the terms of GNU GPLv3 license.
 *  For details, see the NUL project site : http://code.google.com/p/nul/
 *
 *--------------------------------------------------------------------------*/


nul.klg.ior3 = new JS.Class(nul.expression, /** @lends nul.klg.ior3# */{
	/**
	 * @class Represent a list of possible knowledges 
	 * @extends nul.expression
	 * @constructs
	 * @param {nul.xpr.knowledge[]} choices The possible cases
	 */
	initialize: function(choices) {
		this.callSuper(null);
		this.choices = map(choices);
		if(!this.choices[0].isA(nul.klg.ncndtnl)) this.choices.unshift(nul.klg.never);
		this.alreadyBuilt();
	},

//////////////// Existence summaries

	maxXst: nul.summary('maxXst'), 	
	minXst: nul.summary('minXst'), 	
	sum_maxXst: function() {
		var rv = 0;
		for(var h in ownNdx(this.choices))
			rv += this.choices[h].maxXst();
		return rv;
	},
	sum_minXst: function() {
		var rv = 0;
		for(var h in ownNdx(this.choices))
			rv += this.choices[h].minXst();
		return rv;
	},

//////////////// nul.expression implementation

	/** @constant */
	expression: 'ior3',
	/** @constant */
	components: {'choices': {type: 'nul.xpr.knowledge', bunch: true}},
	built: function() {
		if(nul.debugged) nul.assert(this.choices.length, 'IOR3 Always has a first unconditional');
		this.choices = nul.solve.ior3(this.choices);
		for(var c=1; this.choices[c];)
			if(!this.choices[c].isA(nul.klg.ncndtnl)) ++c;
			else {
				this.choices[0].add(this.choices[c]);
				this.choices.splice(c,1);
			}
		if(nul.klg.never== this.choices[0]) this.choices.shift();
		return this.callSuper();
	}
});
