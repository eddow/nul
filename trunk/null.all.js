/*
 * JavaScript file created by Rockstarapps Concatenation
*/

/*
 * START OF FILE - /trunk/3rd/jsclass/core.js
 */
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
/*
 * END OF FILE - /trunk/3rd/jsclass/core.js
 */

/*
 * START OF FILE - /trunk/3rd/jquery/jquery.js
 */
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

/*
 * END OF FILE - /trunk/3rd/jquery/jquery.js
 */

/*
 * START OF FILE - /trunk/3rd/jquery/emw.js
 */
/*  NUL language JavaScript framework
 *  (c) 2009 E-med Ware
 *
 * NUL is freely distributable under the terms of GNU GPLv3 license.
 *  For details, see the NUL project site : http://code.google.com/p/nul/
 *
 *--------------------------------------------------------------------------*/

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

/*
 * END OF FILE - /trunk/3rd/jquery/emw.js
 */

/*
 * START OF FILE - /trunk/3rd/jquery/treeTable.js
 */
/*! jQuery treeTable Plugin 2.2.3 - http://ludo.cubicphuse.nl/jquery-plugins/treeTable/ */
(function($) {
  // Helps to make options available to all functions
  // TODO: This gives problems when there are both expandable and non-expandable
  // trees on a page. The options shouldn't be global to all these instances!
  var options;
  var defaultPaddingLeft;
  
  $.fn.treeTable = function(opts) {
    options = $.extend({}, $.fn.treeTable.defaults, opts);
    
    return this.each(function() {
      $(this).addClass("treeTable").find("tbody tr").each(function() {
        // Initialize root nodes only if possible
        if(!options.expandable || $(this)[0].className.search("child-of-") == -1) {
          // To optimize performance of indentation, I retrieve the padding-left
          // value of the first root node. This way I only have to call +css+ 
          // once.
          if (isNaN(defaultPaddingLeft)) {
            defaultPaddingLeft = parseInt($($(this).children()[options.treeColumn]).css('padding-left'), 10);
          }
          
          initialize($(this));
        } else if(options.initialState == "collapsed") {
          this.style.display = "none"; // Performance! $(this).hide() is slow...
        }
      });
    });
  };
  
  $.fn.treeTable.defaults = {
    childPrefix: "child-of-",
    clickableNodeNames: false,
    expandable: true,
    indent: 19,
    initialState: "collapsed",
    treeColumn: 0
  };
  
  // Recursively hide all node's children in a tree
  $.fn.collapse = function() {
    $(this).addClass("collapsed");
    
    childrenOf($(this)).each(function() {
      if(!$(this).hasClass("collapsed")) {
        $(this).collapse();
      }
      
      this.style.display = "none"; // Performance! $(this).hide() is slow...
    });
    
    return this;
  };
  
  // Recursively show all node's children in a tree
  $.fn.expand = function() {
    $(this).removeClass("collapsed").addClass("expanded");
    
    childrenOf($(this)).each(function() {
      initialize($(this));
      
      if($(this).is(".expanded.parent")) {
        $(this).expand();
      }
      
      // this.style.display = "table-row"; // Unfortunately this is not possible with IE :-(
      $(this).show();
    });
    
    return this;
  };
  
  // Add an entire branch to +destination+
  $.fn.appendBranchTo = function(destination) {
    var node = $(this);
    var parent = parentOf(node);
    
    var ancestorNames = $.map(ancestorsOf($(destination)), function(a) { return a.id; });
    
    // Conditions:
    // 1: +node+ should not be inserted in a location in a branch if this would
    //    result in +node+ being an ancestor of itself.
    // 2: +node+ should not have a parent OR the destination should not be the
    //    same as +node+'s current parent (this last condition prevents +node+
    //    from being moved to the same location where it already is).
    // 3: +node+ should not be inserted as a child of +node+ itself.
    if($.inArray(node[0].id, ancestorNames) == -1 && (!parent || (destination.id != parent[0].id)) && destination.id != node[0].id) {
      indent(node, ancestorsOf(node).length * options.indent * -1); // Remove indentation
      
      if(parent) { node.removeClass(options.childPrefix + parent[0].id); }
      
      node.addClass(options.childPrefix + destination.id);
      move(node, destination); // Recursively move nodes to new location
      indent(node, ancestorsOf(node).length * options.indent);
    }
    
    return this;
  };
  
  // Add reverse() function from JS Arrays
  $.fn.reverse = function() {
    return this.pushStack(this.get().reverse(), arguments);
  };
  
  // Toggle an entire branch
  $.fn.toggleBranch = function() {
    if($(this).hasClass("collapsed")) {
      $(this).expand();
    } else {
      $(this).removeClass("expanded").collapse();
    }
    
    return this;
  };
  
  // === Private functions
  
  function ancestorsOf(node) {
    var ancestors = [];
    while(node = parentOf(node)) {
      ancestors[ancestors.length] = node[0];
    }
    return ancestors;
  };
  
  function childrenOf(node) {
    return $("table.treeTable tbody tr." + options.childPrefix + node[0].id);
  };
  
  function getPaddingLeft(node) {
    var paddingLeft = parseInt(node[0].style.paddingLeft, 10);
    return (isNaN(paddingLeft)) ? defaultPaddingLeft : paddingLeft;
  }
  
  function indent(node, value) {
    var cell = $(node.children()[options.treeColumn]);
    cell[0].style.paddingLeft = getPaddingLeft(cell) + value + "px";
    
    childrenOf(node).each(function() {
      indent($(this), value);
    });
  };
  
  function initialize(node) {
    if(!node.hasClass("initialized")) {
      node.addClass("initialized");
      
      var childNodes = childrenOf(node);
      
      if(!node.hasClass("parent") && childNodes.length > 0) {
        node.addClass("parent");
      }
      
      if(node.hasClass("parent")) {
        var cell = $(node.children()[options.treeColumn]);
        var padding = getPaddingLeft(cell) + options.indent;
        
        childNodes.each(function() {
          $(this).children()[options.treeColumn].style.paddingLeft = padding + "px";
        });
        
        if(options.expandable) {
          cell.prepend('<span style="margin-left: -' + options.indent + 'px; padding-left: ' + options.indent + 'px" class="expander"></span>');
          $(cell[0].firstChild).click(function() { node.toggleBranch(); });
          
          if(options.clickableNodeNames) {
            cell[0].style.cursor = "pointer";
            $(cell).click(function(e) {
              // Don't double-toggle if the click is on the existing expander icon
              if (e.target.className != 'expander') {
                node.toggleBranch();
              }
            });
          }
          
          // Check for a class set explicitly by the user, otherwise set the default class
          if(!(node.hasClass("expanded") || node.hasClass("collapsed"))) {
            node.addClass(options.initialState);
          }

          if(node.hasClass("expanded")) {
            node.expand();
          }
        }
      }
    }
  };
  
  function move(node, destination) {
    node.insertAfter(destination);
    childrenOf(node).reverse().each(function() { move($(this), node[0]); });
  };
  
  function parentOf(node) {
    var classNames = node[0].className.split(' ');
    
    for(key in classNames) {
      if(classNames[key].match("child-of-")) {
        return $("#" + classNames[key].substring(9));
      }
    }
  };
})(jQuery);
/*
 * END OF FILE - /trunk/3rd/jquery/treeTable.js
 */

/*
 * START OF FILE - /trunk/3rd/jquery/ui.all.js
 */
/*!
 * jQuery UI 1.7.2
 *
 * Copyright (c) 2009 AUTHORS.txt (http://jqueryui.com/about)
 * Dual licensed under the MIT (MIT-LICENSE.txt)
 * and GPL (GPL-LICENSE.txt) licenses.
 *
 * http://docs.jquery.com/UI
 */
jQuery.ui||(function(c){var i=c.fn.remove,d=c.browser.mozilla&&(parseFloat(c.browser.version)<1.9);c.ui={version:"1.7.2",plugin:{add:function(k,l,n){var m=c.ui[k].prototype;for(var j in n){m.plugins[j]=m.plugins[j]||[];m.plugins[j].push([l,n[j]])}},call:function(j,l,k){var n=j.plugins[l];if(!n||!j.element[0].parentNode){return}for(var m=0;m<n.length;m++){if(j.options[n[m][0]]){n[m][1].apply(j.element,k)}}}},contains:function(k,j){return document.compareDocumentPosition?k.compareDocumentPosition(j)&16:k!==j&&k.contains(j)},hasScroll:function(m,k){if(c(m).css("overflow")=="hidden"){return false}var j=(k&&k=="left")?"scrollLeft":"scrollTop",l=false;if(m[j]>0){return true}m[j]=1;l=(m[j]>0);m[j]=0;return l},isOverAxis:function(k,j,l){return(k>j)&&(k<(j+l))},isOver:function(o,k,n,m,j,l){return c.ui.isOverAxis(o,n,j)&&c.ui.isOverAxis(k,m,l)},keyCode:{BACKSPACE:8,CAPS_LOCK:20,COMMA:188,CONTROL:17,DELETE:46,DOWN:40,END:35,ENTER:13,ESCAPE:27,HOME:36,INSERT:45,LEFT:37,NUMPAD_ADD:107,NUMPAD_DECIMAL:110,NUMPAD_DIVIDE:111,NUMPAD_ENTER:108,NUMPAD_MULTIPLY:106,NUMPAD_SUBTRACT:109,PAGE_DOWN:34,PAGE_UP:33,PERIOD:190,RIGHT:39,SHIFT:16,SPACE:32,TAB:9,UP:38}};if(d){var f=c.attr,e=c.fn.removeAttr,h="http://www.w3.org/2005/07/aaa",a=/^aria-/,b=/^wairole:/;c.attr=function(k,j,l){var m=l!==undefined;return(j=="role"?(m?f.call(this,k,j,"wairole:"+l):(f.apply(this,arguments)||"").replace(b,"")):(a.test(j)?(m?k.setAttributeNS(h,j.replace(a,"aaa:"),l):f.call(this,k,j.replace(a,"aaa:"))):f.apply(this,arguments)))};c.fn.removeAttr=function(j){return(a.test(j)?this.each(function(){this.removeAttributeNS(h,j.replace(a,""))}):e.call(this,j))}}c.fn.extend({remove:function(){c("*",this).add(this).each(function(){c(this).triggerHandler("remove")});return i.apply(this,arguments)},enableSelection:function(){return this.attr("unselectable","off").css("MozUserSelect","").unbind("selectstart.ui")},disableSelection:function(){return this.attr("unselectable","on").css("MozUserSelect","none").bind("selectstart.ui",function(){return false})},scrollParent:function(){var j;if((c.browser.msie&&(/(static|relative)/).test(this.css("position")))||(/absolute/).test(this.css("position"))){j=this.parents().filter(function(){return(/(relative|absolute|fixed)/).test(c.curCSS(this,"position",1))&&(/(auto|scroll)/).test(c.curCSS(this,"overflow",1)+c.curCSS(this,"overflow-y",1)+c.curCSS(this,"overflow-x",1))}).eq(0)}else{j=this.parents().filter(function(){return(/(auto|scroll)/).test(c.curCSS(this,"overflow",1)+c.curCSS(this,"overflow-y",1)+c.curCSS(this,"overflow-x",1))}).eq(0)}return(/fixed/).test(this.css("position"))||!j.length?c(document):j}});c.extend(c.expr[":"],{data:function(l,k,j){return !!c.data(l,j[3])},focusable:function(k){var l=k.nodeName.toLowerCase(),j=c.attr(k,"tabindex");return(/input|select|textarea|button|object/.test(l)?!k.disabled:"a"==l||"area"==l?k.href||!isNaN(j):!isNaN(j))&&!c(k)["area"==l?"parents":"closest"](":hidden").length},tabbable:function(k){var j=c.attr(k,"tabindex");return(isNaN(j)||j>=0)&&c(k).is(":focusable")}});function g(m,n,o,l){function k(q){var p=c[m][n][q]||[];return(typeof p=="string"?p.split(/,?\s+/):p)}var j=k("getter");if(l.length==1&&typeof l[0]=="string"){j=j.concat(k("getterSetter"))}return(c.inArray(o,j)!=-1)}c.widget=function(k,j){var l=k.split(".")[0];k=k.split(".")[1];c.fn[k]=function(p){var n=(typeof p=="string"),o=Array.prototype.slice.call(arguments,1);if(n&&p.substring(0,1)=="_"){return this}if(n&&g(l,k,p,o)){var m=c.data(this[0],k);return(m?m[p].apply(m,o):undefined)}return this.each(function(){var q=c.data(this,k);(!q&&!n&&c.data(this,k,new c[l][k](this,p))._init());(q&&n&&c.isFunction(q[p])&&q[p].apply(q,o))})};c[l]=c[l]||{};c[l][k]=function(o,n){var m=this;this.namespace=l;this.widgetName=k;this.widgetEventPrefix=c[l][k].eventPrefix||k;this.widgetBaseClass=l+"-"+k;this.options=c.extend({},c.widget.defaults,c[l][k].defaults,c.metadata&&c.metadata.get(o)[k],n);this.element=c(o).bind("setData."+k,function(q,p,r){if(q.target==o){return m._setData(p,r)}}).bind("getData."+k,function(q,p){if(q.target==o){return m._getData(p)}}).bind("remove",function(){return m.destroy()})};c[l][k].prototype=c.extend({},c.widget.prototype,j);c[l][k].getterSetter="option"};c.widget.prototype={_init:function(){},destroy:function(){this.element.removeData(this.widgetName).removeClass(this.widgetBaseClass+"-disabled "+this.namespace+"-state-disabled").removeAttr("aria-disabled")},option:function(l,m){var k=l,j=this;if(typeof l=="string"){if(m===undefined){return this._getData(l)}k={};k[l]=m}c.each(k,function(n,o){j._setData(n,o)})},_getData:function(j){return this.options[j]},_setData:function(j,k){this.options[j]=k;if(j=="disabled"){this.element[k?"addClass":"removeClass"](this.widgetBaseClass+"-disabled "+this.namespace+"-state-disabled").attr("aria-disabled",k)}},enable:function(){this._setData("disabled",false)},disable:function(){this._setData("disabled",true)},_trigger:function(l,m,n){var p=this.options[l],j=(l==this.widgetEventPrefix?l:this.widgetEventPrefix+l);m=c.Event(m);m.type=j;if(m.originalEvent){for(var k=c.event.props.length,o;k;){o=c.event.props[--k];m[o]=m.originalEvent[o]}}this.element.trigger(m,n);return !(c.isFunction(p)&&p.call(this.element[0],m,n)===false||m.isDefaultPrevented())}};c.widget.defaults={disabled:false};c.ui.mouse={_mouseInit:function(){var j=this;this.element.bind("mousedown."+this.widgetName,function(k){return j._mouseDown(k)}).bind("click."+this.widgetName,function(k){if(j._preventClickEvent){j._preventClickEvent=false;k.stopImmediatePropagation();return false}});if(c.browser.msie){this._mouseUnselectable=this.element.attr("unselectable");this.element.attr("unselectable","on")}this.started=false},_mouseDestroy:function(){this.element.unbind("."+this.widgetName);(c.browser.msie&&this.element.attr("unselectable",this._mouseUnselectable))},_mouseDown:function(l){l.originalEvent=l.originalEvent||{};if(l.originalEvent.mouseHandled){return}(this._mouseStarted&&this._mouseUp(l));this._mouseDownEvent=l;var k=this,m=(l.which==1),j=(typeof this.options.cancel=="string"?c(l.target).parents().add(l.target).filter(this.options.cancel).length:false);if(!m||j||!this._mouseCapture(l)){return true}this.mouseDelayMet=!this.options.delay;if(!this.mouseDelayMet){this._mouseDelayTimer=setTimeout(function(){k.mouseDelayMet=true},this.options.delay)}if(this._mouseDistanceMet(l)&&this._mouseDelayMet(l)){this._mouseStarted=(this._mouseStart(l)!==false);if(!this._mouseStarted){l.preventDefault();return true}}this._mouseMoveDelegate=function(n){return k._mouseMove(n)};this._mouseUpDelegate=function(n){return k._mouseUp(n)};c(document).bind("mousemove."+this.widgetName,this._mouseMoveDelegate).bind("mouseup."+this.widgetName,this._mouseUpDelegate);(c.browser.safari||l.preventDefault());l.originalEvent.mouseHandled=true;return true},_mouseMove:function(j){if(c.browser.msie&&!j.button){return this._mouseUp(j)}if(this._mouseStarted){this._mouseDrag(j);return j.preventDefault()}if(this._mouseDistanceMet(j)&&this._mouseDelayMet(j)){this._mouseStarted=(this._mouseStart(this._mouseDownEvent,j)!==false);(this._mouseStarted?this._mouseDrag(j):this._mouseUp(j))}return !this._mouseStarted},_mouseUp:function(j){c(document).unbind("mousemove."+this.widgetName,this._mouseMoveDelegate).unbind("mouseup."+this.widgetName,this._mouseUpDelegate);if(this._mouseStarted){this._mouseStarted=false;this._preventClickEvent=(j.target==this._mouseDownEvent.target);this._mouseStop(j)}return false},_mouseDistanceMet:function(j){return(Math.max(Math.abs(this._mouseDownEvent.pageX-j.pageX),Math.abs(this._mouseDownEvent.pageY-j.pageY))>=this.options.distance)},_mouseDelayMet:function(j){return this.mouseDelayMet},_mouseStart:function(j){},_mouseDrag:function(j){},_mouseStop:function(j){},_mouseCapture:function(j){return true}};c.ui.mouse.defaults={cancel:null,distance:1,delay:0}})(jQuery);;/*
 * jQuery UI Draggable 1.7.2
 *
 * Copyright (c) 2009 AUTHORS.txt (http://jqueryui.com/about)
 * Dual licensed under the MIT (MIT-LICENSE.txt)
 * and GPL (GPL-LICENSE.txt) licenses.
 *
 * http://docs.jquery.com/UI/Draggables
 *
 * Depends:
 *	ui.core.js
 */
(function(a){a.widget("ui.draggable",a.extend({},a.ui.mouse,{_init:function(){if(this.options.helper=="original"&&!(/^(?:r|a|f)/).test(this.element.css("position"))){this.element[0].style.position="relative"}(this.options.addClasses&&this.element.addClass("ui-draggable"));(this.options.disabled&&this.element.addClass("ui-draggable-disabled"));this._mouseInit()},destroy:function(){if(!this.element.data("draggable")){return}this.element.removeData("draggable").unbind(".draggable").removeClass("ui-draggable ui-draggable-dragging ui-draggable-disabled");this._mouseDestroy()},_mouseCapture:function(b){var c=this.options;if(this.helper||c.disabled||a(b.target).is(".ui-resizable-handle")){return false}this.handle=this._getHandle(b);if(!this.handle){return false}return true},_mouseStart:function(b){var c=this.options;this.helper=this._createHelper(b);this._cacheHelperProportions();if(a.ui.ddmanager){a.ui.ddmanager.current=this}this._cacheMargins();this.cssPosition=this.helper.css("position");this.scrollParent=this.helper.scrollParent();this.offset=this.element.offset();this.offset={top:this.offset.top-this.margins.top,left:this.offset.left-this.margins.left};a.extend(this.offset,{click:{left:b.pageX-this.offset.left,top:b.pageY-this.offset.top},parent:this._getParentOffset(),relative:this._getRelativeOffset()});this.originalPosition=this._generatePosition(b);this.originalPageX=b.pageX;this.originalPageY=b.pageY;if(c.cursorAt){this._adjustOffsetFromHelper(c.cursorAt)}if(c.containment){this._setContainment()}this._trigger("start",b);this._cacheHelperProportions();if(a.ui.ddmanager&&!c.dropBehaviour){a.ui.ddmanager.prepareOffsets(this,b)}this.helper.addClass("ui-draggable-dragging");this._mouseDrag(b,true);return true},_mouseDrag:function(b,d){this.position=this._generatePosition(b);this.positionAbs=this._convertPositionTo("absolute");if(!d){var c=this._uiHash();this._trigger("drag",b,c);this.position=c.position}if(!this.options.axis||this.options.axis!="y"){this.helper[0].style.left=this.position.left+"px"}if(!this.options.axis||this.options.axis!="x"){this.helper[0].style.top=this.position.top+"px"}if(a.ui.ddmanager){a.ui.ddmanager.drag(this,b)}return false},_mouseStop:function(c){var d=false;if(a.ui.ddmanager&&!this.options.dropBehaviour){d=a.ui.ddmanager.drop(this,c)}if(this.dropped){d=this.dropped;this.dropped=false}if((this.options.revert=="invalid"&&!d)||(this.options.revert=="valid"&&d)||this.options.revert===true||(a.isFunction(this.options.revert)&&this.options.revert.call(this.element,d))){var b=this;a(this.helper).animate(this.originalPosition,parseInt(this.options.revertDuration,10),function(){b._trigger("stop",c);b._clear()})}else{this._trigger("stop",c);this._clear()}return false},_getHandle:function(b){var c=!this.options.handle||!a(this.options.handle,this.element).length?true:false;a(this.options.handle,this.element).find("*").andSelf().each(function(){if(this==b.target){c=true}});return c},_createHelper:function(c){var d=this.options;var b=a.isFunction(d.helper)?a(d.helper.apply(this.element[0],[c])):(d.helper=="clone"?this.element.clone():this.element);if(!b.parents("body").length){b.appendTo((d.appendTo=="parent"?this.element[0].parentNode:d.appendTo))}if(b[0]!=this.element[0]&&!(/(fixed|absolute)/).test(b.css("position"))){b.css("position","absolute")}return b},_adjustOffsetFromHelper:function(b){if(b.left!=undefined){this.offset.click.left=b.left+this.margins.left}if(b.right!=undefined){this.offset.click.left=this.helperProportions.width-b.right+this.margins.left}if(b.top!=undefined){this.offset.click.top=b.top+this.margins.top}if(b.bottom!=undefined){this.offset.click.top=this.helperProportions.height-b.bottom+this.margins.top}},_getParentOffset:function(){this.offsetParent=this.helper.offsetParent();var b=this.offsetParent.offset();if(this.cssPosition=="absolute"&&this.scrollParent[0]!=document&&a.ui.contains(this.scrollParent[0],this.offsetParent[0])){b.left+=this.scrollParent.scrollLeft();b.top+=this.scrollParent.scrollTop()}if((this.offsetParent[0]==document.body)||(this.offsetParent[0].tagName&&this.offsetParent[0].tagName.toLowerCase()=="html"&&a.browser.msie)){b={top:0,left:0}}return{top:b.top+(parseInt(this.offsetParent.css("borderTopWidth"),10)||0),left:b.left+(parseInt(this.offsetParent.css("borderLeftWidth"),10)||0)}},_getRelativeOffset:function(){if(this.cssPosition=="relative"){var b=this.element.position();return{top:b.top-(parseInt(this.helper.css("top"),10)||0)+this.scrollParent.scrollTop(),left:b.left-(parseInt(this.helper.css("left"),10)||0)+this.scrollParent.scrollLeft()}}else{return{top:0,left:0}}},_cacheMargins:function(){this.margins={left:(parseInt(this.element.css("marginLeft"),10)||0),top:(parseInt(this.element.css("marginTop"),10)||0)}},_cacheHelperProportions:function(){this.helperProportions={width:this.helper.outerWidth(),height:this.helper.outerHeight()}},_setContainment:function(){var e=this.options;if(e.containment=="parent"){e.containment=this.helper[0].parentNode}if(e.containment=="document"||e.containment=="window"){this.containment=[0-this.offset.relative.left-this.offset.parent.left,0-this.offset.relative.top-this.offset.parent.top,a(e.containment=="document"?document:window).width()-this.helperProportions.width-this.margins.left,(a(e.containment=="document"?document:window).height()||document.body.parentNode.scrollHeight)-this.helperProportions.height-this.margins.top]}if(!(/^(document|window|parent)$/).test(e.containment)&&e.containment.constructor!=Array){var c=a(e.containment)[0];if(!c){return}var d=a(e.containment).offset();var b=(a(c).css("overflow")!="hidden");this.containment=[d.left+(parseInt(a(c).css("borderLeftWidth"),10)||0)+(parseInt(a(c).css("paddingLeft"),10)||0)-this.margins.left,d.top+(parseInt(a(c).css("borderTopWidth"),10)||0)+(parseInt(a(c).css("paddingTop"),10)||0)-this.margins.top,d.left+(b?Math.max(c.scrollWidth,c.offsetWidth):c.offsetWidth)-(parseInt(a(c).css("borderLeftWidth"),10)||0)-(parseInt(a(c).css("paddingRight"),10)||0)-this.helperProportions.width-this.margins.left,d.top+(b?Math.max(c.scrollHeight,c.offsetHeight):c.offsetHeight)-(parseInt(a(c).css("borderTopWidth"),10)||0)-(parseInt(a(c).css("paddingBottom"),10)||0)-this.helperProportions.height-this.margins.top]}else{if(e.containment.constructor==Array){this.containment=e.containment}}},_convertPositionTo:function(f,h){if(!h){h=this.position}var c=f=="absolute"?1:-1;var e=this.options,b=this.cssPosition=="absolute"&&!(this.scrollParent[0]!=document&&a.ui.contains(this.scrollParent[0],this.offsetParent[0]))?this.offsetParent:this.scrollParent,g=(/(html|body)/i).test(b[0].tagName);return{top:(h.top+this.offset.relative.top*c+this.offset.parent.top*c-(a.browser.safari&&this.cssPosition=="fixed"?0:(this.cssPosition=="fixed"?-this.scrollParent.scrollTop():(g?0:b.scrollTop()))*c)),left:(h.left+this.offset.relative.left*c+this.offset.parent.left*c-(a.browser.safari&&this.cssPosition=="fixed"?0:(this.cssPosition=="fixed"?-this.scrollParent.scrollLeft():g?0:b.scrollLeft())*c))}},_generatePosition:function(e){var h=this.options,b=this.cssPosition=="absolute"&&!(this.scrollParent[0]!=document&&a.ui.contains(this.scrollParent[0],this.offsetParent[0]))?this.offsetParent:this.scrollParent,i=(/(html|body)/i).test(b[0].tagName);if(this.cssPosition=="relative"&&!(this.scrollParent[0]!=document&&this.scrollParent[0]!=this.offsetParent[0])){this.offset.relative=this._getRelativeOffset()}var d=e.pageX;var c=e.pageY;if(this.originalPosition){if(this.containment){if(e.pageX-this.offset.click.left<this.containment[0]){d=this.containment[0]+this.offset.click.left}if(e.pageY-this.offset.click.top<this.containment[1]){c=this.containment[1]+this.offset.click.top}if(e.pageX-this.offset.click.left>this.containment[2]){d=this.containment[2]+this.offset.click.left}if(e.pageY-this.offset.click.top>this.containment[3]){c=this.containment[3]+this.offset.click.top}}if(h.grid){var g=this.originalPageY+Math.round((c-this.originalPageY)/h.grid[1])*h.grid[1];c=this.containment?(!(g-this.offset.click.top<this.containment[1]||g-this.offset.click.top>this.containment[3])?g:(!(g-this.offset.click.top<this.containment[1])?g-h.grid[1]:g+h.grid[1])):g;var f=this.originalPageX+Math.round((d-this.originalPageX)/h.grid[0])*h.grid[0];d=this.containment?(!(f-this.offset.click.left<this.containment[0]||f-this.offset.click.left>this.containment[2])?f:(!(f-this.offset.click.left<this.containment[0])?f-h.grid[0]:f+h.grid[0])):f}}return{top:(c-this.offset.click.top-this.offset.relative.top-this.offset.parent.top+(a.browser.safari&&this.cssPosition=="fixed"?0:(this.cssPosition=="fixed"?-this.scrollParent.scrollTop():(i?0:b.scrollTop())))),left:(d-this.offset.click.left-this.offset.relative.left-this.offset.parent.left+(a.browser.safari&&this.cssPosition=="fixed"?0:(this.cssPosition=="fixed"?-this.scrollParent.scrollLeft():i?0:b.scrollLeft())))}},_clear:function(){this.helper.removeClass("ui-draggable-dragging");if(this.helper[0]!=this.element[0]&&!this.cancelHelperRemoval){this.helper.remove()}this.helper=null;this.cancelHelperRemoval=false},_trigger:function(b,c,d){d=d||this._uiHash();a.ui.plugin.call(this,b,[c,d]);if(b=="drag"){this.positionAbs=this._convertPositionTo("absolute")}return a.widget.prototype._trigger.call(this,b,c,d)},plugins:{},_uiHash:function(b){return{helper:this.helper,position:this.position,absolutePosition:this.positionAbs,offset:this.positionAbs}}}));a.extend(a.ui.draggable,{version:"1.7.2",eventPrefix:"drag",defaults:{addClasses:true,appendTo:"parent",axis:false,cancel:":input,option",connectToSortable:false,containment:false,cursor:"auto",cursorAt:false,delay:0,distance:1,grid:false,handle:false,helper:"original",iframeFix:false,opacity:false,refreshPositions:false,revert:false,revertDuration:500,scope:"default",scroll:true,scrollSensitivity:20,scrollSpeed:20,snap:false,snapMode:"both",snapTolerance:20,stack:false,zIndex:false}});a.ui.plugin.add("draggable","connectToSortable",{start:function(c,e){var d=a(this).data("draggable"),f=d.options,b=a.extend({},e,{item:d.element});d.sortables=[];a(f.connectToSortable).each(function(){var g=a.data(this,"sortable");if(g&&!g.options.disabled){d.sortables.push({instance:g,shouldRevert:g.options.revert});g._refreshItems();g._trigger("activate",c,b)}})},stop:function(c,e){var d=a(this).data("draggable"),b=a.extend({},e,{item:d.element});a.each(d.sortables,function(){if(this.instance.isOver){this.instance.isOver=0;d.cancelHelperRemoval=true;this.instance.cancelHelperRemoval=false;if(this.shouldRevert){this.instance.options.revert=true}this.instance._mouseStop(c);this.instance.options.helper=this.instance.options._helper;if(d.options.helper=="original"){this.instance.currentItem.css({top:"auto",left:"auto"})}}else{this.instance.cancelHelperRemoval=false;this.instance._trigger("deactivate",c,b)}})},drag:function(c,f){var e=a(this).data("draggable"),b=this;var d=function(i){var n=this.offset.click.top,m=this.offset.click.left;var g=this.positionAbs.top,k=this.positionAbs.left;var j=i.height,l=i.width;var p=i.top,h=i.left;return a.ui.isOver(g+n,k+m,p,h,j,l)};a.each(e.sortables,function(g){this.instance.positionAbs=e.positionAbs;this.instance.helperProportions=e.helperProportions;this.instance.offset.click=e.offset.click;if(this.instance._intersectsWith(this.instance.containerCache)){if(!this.instance.isOver){this.instance.isOver=1;this.instance.currentItem=a(b).clone().appendTo(this.instance.element).data("sortable-item",true);this.instance.options._helper=this.instance.options.helper;this.instance.options.helper=function(){return f.helper[0]};c.target=this.instance.currentItem[0];this.instance._mouseCapture(c,true);this.instance._mouseStart(c,true,true);this.instance.offset.click.top=e.offset.click.top;this.instance.offset.click.left=e.offset.click.left;this.instance.offset.parent.left-=e.offset.parent.left-this.instance.offset.parent.left;this.instance.offset.parent.top-=e.offset.parent.top-this.instance.offset.parent.top;e._trigger("toSortable",c);e.dropped=this.instance.element;e.currentItem=e.element;this.instance.fromOutside=e}if(this.instance.currentItem){this.instance._mouseDrag(c)}}else{if(this.instance.isOver){this.instance.isOver=0;this.instance.cancelHelperRemoval=true;this.instance.options.revert=false;this.instance._trigger("out",c,this.instance._uiHash(this.instance));this.instance._mouseStop(c,true);this.instance.options.helper=this.instance.options._helper;this.instance.currentItem.remove();if(this.instance.placeholder){this.instance.placeholder.remove()}e._trigger("fromSortable",c);e.dropped=false}}})}});a.ui.plugin.add("draggable","cursor",{start:function(c,d){var b=a("body"),e=a(this).data("draggable").options;if(b.css("cursor")){e._cursor=b.css("cursor")}b.css("cursor",e.cursor)},stop:function(b,c){var d=a(this).data("draggable").options;if(d._cursor){a("body").css("cursor",d._cursor)}}});a.ui.plugin.add("draggable","iframeFix",{start:function(b,c){var d=a(this).data("draggable").options;a(d.iframeFix===true?"iframe":d.iframeFix).each(function(){a('<div class="ui-draggable-iframeFix" style="background: #fff;"></div>').css({width:this.offsetWidth+"px",height:this.offsetHeight+"px",position:"absolute",opacity:"0.001",zIndex:1000}).css(a(this).offset()).appendTo("body")})},stop:function(b,c){a("div.ui-draggable-iframeFix").each(function(){this.parentNode.removeChild(this)})}});a.ui.plugin.add("draggable","opacity",{start:function(c,d){var b=a(d.helper),e=a(this).data("draggable").options;if(b.css("opacity")){e._opacity=b.css("opacity")}b.css("opacity",e.opacity)},stop:function(b,c){var d=a(this).data("draggable").options;if(d._opacity){a(c.helper).css("opacity",d._opacity)}}});a.ui.plugin.add("draggable","scroll",{start:function(c,d){var b=a(this).data("draggable");if(b.scrollParent[0]!=document&&b.scrollParent[0].tagName!="HTML"){b.overflowOffset=b.scrollParent.offset()}},drag:function(d,e){var c=a(this).data("draggable"),f=c.options,b=false;if(c.scrollParent[0]!=document&&c.scrollParent[0].tagName!="HTML"){if(!f.axis||f.axis!="x"){if((c.overflowOffset.top+c.scrollParent[0].offsetHeight)-d.pageY<f.scrollSensitivity){c.scrollParent[0].scrollTop=b=c.scrollParent[0].scrollTop+f.scrollSpeed}else{if(d.pageY-c.overflowOffset.top<f.scrollSensitivity){c.scrollParent[0].scrollTop=b=c.scrollParent[0].scrollTop-f.scrollSpeed}}}if(!f.axis||f.axis!="y"){if((c.overflowOffset.left+c.scrollParent[0].offsetWidth)-d.pageX<f.scrollSensitivity){c.scrollParent[0].scrollLeft=b=c.scrollParent[0].scrollLeft+f.scrollSpeed}else{if(d.pageX-c.overflowOffset.left<f.scrollSensitivity){c.scrollParent[0].scrollLeft=b=c.scrollParent[0].scrollLeft-f.scrollSpeed}}}}else{if(!f.axis||f.axis!="x"){if(d.pageY-a(document).scrollTop()<f.scrollSensitivity){b=a(document).scrollTop(a(document).scrollTop()-f.scrollSpeed)}else{if(a(window).height()-(d.pageY-a(document).scrollTop())<f.scrollSensitivity){b=a(document).scrollTop(a(document).scrollTop()+f.scrollSpeed)}}}if(!f.axis||f.axis!="y"){if(d.pageX-a(document).scrollLeft()<f.scrollSensitivity){b=a(document).scrollLeft(a(document).scrollLeft()-f.scrollSpeed)}else{if(a(window).width()-(d.pageX-a(document).scrollLeft())<f.scrollSensitivity){b=a(document).scrollLeft(a(document).scrollLeft()+f.scrollSpeed)}}}}if(b!==false&&a.ui.ddmanager&&!f.dropBehaviour){a.ui.ddmanager.prepareOffsets(c,d)}}});a.ui.plugin.add("draggable","snap",{start:function(c,d){var b=a(this).data("draggable"),e=b.options;b.snapElements=[];a(e.snap.constructor!=String?(e.snap.items||":data(draggable)"):e.snap).each(function(){var g=a(this);var f=g.offset();if(this!=b.element[0]){b.snapElements.push({item:this,width:g.outerWidth(),height:g.outerHeight(),top:f.top,left:f.left})}})},drag:function(u,p){var g=a(this).data("draggable"),q=g.options;var y=q.snapTolerance;var x=p.offset.left,w=x+g.helperProportions.width,f=p.offset.top,e=f+g.helperProportions.height;for(var v=g.snapElements.length-1;v>=0;v--){var s=g.snapElements[v].left,n=s+g.snapElements[v].width,m=g.snapElements[v].top,A=m+g.snapElements[v].height;if(!((s-y<x&&x<n+y&&m-y<f&&f<A+y)||(s-y<x&&x<n+y&&m-y<e&&e<A+y)||(s-y<w&&w<n+y&&m-y<f&&f<A+y)||(s-y<w&&w<n+y&&m-y<e&&e<A+y))){if(g.snapElements[v].snapping){(g.options.snap.release&&g.options.snap.release.call(g.element,u,a.extend(g._uiHash(),{snapItem:g.snapElements[v].item})))}g.snapElements[v].snapping=false;continue}if(q.snapMode!="inner"){var c=Math.abs(m-e)<=y;var z=Math.abs(A-f)<=y;var j=Math.abs(s-w)<=y;var k=Math.abs(n-x)<=y;if(c){p.position.top=g._convertPositionTo("relative",{top:m-g.helperProportions.height,left:0}).top-g.margins.top}if(z){p.position.top=g._convertPositionTo("relative",{top:A,left:0}).top-g.margins.top}if(j){p.position.left=g._convertPositionTo("relative",{top:0,left:s-g.helperProportions.width}).left-g.margins.left}if(k){p.position.left=g._convertPositionTo("relative",{top:0,left:n}).left-g.margins.left}}var h=(c||z||j||k);if(q.snapMode!="outer"){var c=Math.abs(m-f)<=y;var z=Math.abs(A-e)<=y;var j=Math.abs(s-x)<=y;var k=Math.abs(n-w)<=y;if(c){p.position.top=g._convertPositionTo("relative",{top:m,left:0}).top-g.margins.top}if(z){p.position.top=g._convertPositionTo("relative",{top:A-g.helperProportions.height,left:0}).top-g.margins.top}if(j){p.position.left=g._convertPositionTo("relative",{top:0,left:s}).left-g.margins.left}if(k){p.position.left=g._convertPositionTo("relative",{top:0,left:n-g.helperProportions.width}).left-g.margins.left}}if(!g.snapElements[v].snapping&&(c||z||j||k||h)){(g.options.snap.snap&&g.options.snap.snap.call(g.element,u,a.extend(g._uiHash(),{snapItem:g.snapElements[v].item})))}g.snapElements[v].snapping=(c||z||j||k||h)}}});a.ui.plugin.add("draggable","stack",{start:function(b,c){var e=a(this).data("draggable").options;var d=a.makeArray(a(e.stack.group)).sort(function(g,f){return(parseInt(a(g).css("zIndex"),10)||e.stack.min)-(parseInt(a(f).css("zIndex"),10)||e.stack.min)});a(d).each(function(f){this.style.zIndex=e.stack.min+f});this[0].style.zIndex=e.stack.min+d.length}});a.ui.plugin.add("draggable","zIndex",{start:function(c,d){var b=a(d.helper),e=a(this).data("draggable").options;if(b.css("zIndex")){e._zIndex=b.css("zIndex")}b.css("zIndex",e.zIndex)},stop:function(b,c){var d=a(this).data("draggable").options;if(d._zIndex){a(c.helper).css("zIndex",d._zIndex)}}})})(jQuery);;/*
 * jQuery UI Droppable 1.7.2
 *
 * Copyright (c) 2009 AUTHORS.txt (http://jqueryui.com/about)
 * Dual licensed under the MIT (MIT-LICENSE.txt)
 * and GPL (GPL-LICENSE.txt) licenses.
 *
 * http://docs.jquery.com/UI/Droppables
 *
 * Depends:
 *	ui.core.js
 *	ui.draggable.js
 */
(function(a){a.widget("ui.droppable",{_init:function(){var c=this.options,b=c.accept;this.isover=0;this.isout=1;this.options.accept=this.options.accept&&a.isFunction(this.options.accept)?this.options.accept:function(e){return e.is(b)};this.proportions={width:this.element[0].offsetWidth,height:this.element[0].offsetHeight};a.ui.ddmanager.droppables[this.options.scope]=a.ui.ddmanager.droppables[this.options.scope]||[];a.ui.ddmanager.droppables[this.options.scope].push(this);(this.options.addClasses&&this.element.addClass("ui-droppable"))},destroy:function(){var b=a.ui.ddmanager.droppables[this.options.scope];for(var c=0;c<b.length;c++){if(b[c]==this){b.splice(c,1)}}this.element.removeClass("ui-droppable ui-droppable-disabled").removeData("droppable").unbind(".droppable")},_setData:function(b,c){if(b=="accept"){this.options.accept=c&&a.isFunction(c)?c:function(e){return e.is(c)}}else{a.widget.prototype._setData.apply(this,arguments)}},_activate:function(c){var b=a.ui.ddmanager.current;if(this.options.activeClass){this.element.addClass(this.options.activeClass)}(b&&this._trigger("activate",c,this.ui(b)))},_deactivate:function(c){var b=a.ui.ddmanager.current;if(this.options.activeClass){this.element.removeClass(this.options.activeClass)}(b&&this._trigger("deactivate",c,this.ui(b)))},_over:function(c){var b=a.ui.ddmanager.current;if(!b||(b.currentItem||b.element)[0]==this.element[0]){return}if(this.options.accept.call(this.element[0],(b.currentItem||b.element))){if(this.options.hoverClass){this.element.addClass(this.options.hoverClass)}this._trigger("over",c,this.ui(b))}},_out:function(c){var b=a.ui.ddmanager.current;if(!b||(b.currentItem||b.element)[0]==this.element[0]){return}if(this.options.accept.call(this.element[0],(b.currentItem||b.element))){if(this.options.hoverClass){this.element.removeClass(this.options.hoverClass)}this._trigger("out",c,this.ui(b))}},_drop:function(c,d){var b=d||a.ui.ddmanager.current;if(!b||(b.currentItem||b.element)[0]==this.element[0]){return false}var e=false;this.element.find(":data(droppable)").not(".ui-draggable-dragging").each(function(){var f=a.data(this,"droppable");if(f.options.greedy&&a.ui.intersect(b,a.extend(f,{offset:f.element.offset()}),f.options.tolerance)){e=true;return false}});if(e){return false}if(this.options.accept.call(this.element[0],(b.currentItem||b.element))){if(this.options.activeClass){this.element.removeClass(this.options.activeClass)}if(this.options.hoverClass){this.element.removeClass(this.options.hoverClass)}this._trigger("drop",c,this.ui(b));return this.element}return false},ui:function(b){return{draggable:(b.currentItem||b.element),helper:b.helper,position:b.position,absolutePosition:b.positionAbs,offset:b.positionAbs}}});a.extend(a.ui.droppable,{version:"1.7.2",eventPrefix:"drop",defaults:{accept:"*",activeClass:false,addClasses:true,greedy:false,hoverClass:false,scope:"default",tolerance:"intersect"}});a.ui.intersect=function(q,j,o){if(!j.offset){return false}var e=(q.positionAbs||q.position.absolute).left,d=e+q.helperProportions.width,n=(q.positionAbs||q.position.absolute).top,m=n+q.helperProportions.height;var g=j.offset.left,c=g+j.proportions.width,p=j.offset.top,k=p+j.proportions.height;switch(o){case"fit":return(g<e&&d<c&&p<n&&m<k);break;case"intersect":return(g<e+(q.helperProportions.width/2)&&d-(q.helperProportions.width/2)<c&&p<n+(q.helperProportions.height/2)&&m-(q.helperProportions.height/2)<k);break;case"pointer":var h=((q.positionAbs||q.position.absolute).left+(q.clickOffset||q.offset.click).left),i=((q.positionAbs||q.position.absolute).top+(q.clickOffset||q.offset.click).top),f=a.ui.isOver(i,h,p,g,j.proportions.height,j.proportions.width);return f;break;case"touch":return((n>=p&&n<=k)||(m>=p&&m<=k)||(n<p&&m>k))&&((e>=g&&e<=c)||(d>=g&&d<=c)||(e<g&&d>c));break;default:return false;break}};a.ui.ddmanager={current:null,droppables:{"default":[]},prepareOffsets:function(e,g){var b=a.ui.ddmanager.droppables[e.options.scope];var f=g?g.type:null;var h=(e.currentItem||e.element).find(":data(droppable)").andSelf();droppablesLoop:for(var d=0;d<b.length;d++){if(b[d].options.disabled||(e&&!b[d].options.accept.call(b[d].element[0],(e.currentItem||e.element)))){continue}for(var c=0;c<h.length;c++){if(h[c]==b[d].element[0]){b[d].proportions.height=0;continue droppablesLoop}}b[d].visible=b[d].element.css("display")!="none";if(!b[d].visible){continue}b[d].offset=b[d].element.offset();b[d].proportions={width:b[d].element[0].offsetWidth,height:b[d].element[0].offsetHeight};if(f=="mousedown"){b[d]._activate.call(b[d],g)}}},drop:function(b,c){var d=false;a.each(a.ui.ddmanager.droppables[b.options.scope],function(){if(!this.options){return}if(!this.options.disabled&&this.visible&&a.ui.intersect(b,this,this.options.tolerance)){d=this._drop.call(this,c)}if(!this.options.disabled&&this.visible&&this.options.accept.call(this.element[0],(b.currentItem||b.element))){this.isout=1;this.isover=0;this._deactivate.call(this,c)}});return d},drag:function(b,c){if(b.options.refreshPositions){a.ui.ddmanager.prepareOffsets(b,c)}a.each(a.ui.ddmanager.droppables[b.options.scope],function(){if(this.options.disabled||this.greedyChild||!this.visible){return}var e=a.ui.intersect(b,this,this.options.tolerance);var g=!e&&this.isover==1?"isout":(e&&this.isover==0?"isover":null);if(!g){return}var f;if(this.options.greedy){var d=this.element.parents(":data(droppable):eq(0)");if(d.length){f=a.data(d[0],"droppable");f.greedyChild=(g=="isover"?1:0)}}if(f&&g=="isover"){f.isover=0;f.isout=1;f._out.call(f,c)}this[g]=1;this[g=="isout"?"isover":"isout"]=0;this[g=="isover"?"_over":"_out"].call(this,c);if(f&&g=="isout"){f.isout=0;f.isover=1;f._over.call(f,c)}})}}})(jQuery);;/*
 * jQuery UI Resizable 1.7.2
 *
 * Copyright (c) 2009 AUTHORS.txt (http://jqueryui.com/about)
 * Dual licensed under the MIT (MIT-LICENSE.txt)
 * and GPL (GPL-LICENSE.txt) licenses.
 *
 * http://docs.jquery.com/UI/Resizables
 *
 * Depends:
 *	ui.core.js
 */
(function(c){c.widget("ui.resizable",c.extend({},c.ui.mouse,{_init:function(){var e=this,j=this.options;this.element.addClass("ui-resizable");c.extend(this,{_aspectRatio:!!(j.aspectRatio),aspectRatio:j.aspectRatio,originalElement:this.element,_proportionallyResizeElements:[],_helper:j.helper||j.ghost||j.animate?j.helper||"ui-resizable-helper":null});if(this.element[0].nodeName.match(/canvas|textarea|input|select|button|img/i)){if(/relative/.test(this.element.css("position"))&&c.browser.opera){this.element.css({position:"relative",top:"auto",left:"auto"})}this.element.wrap(c('<div class="ui-wrapper" style="overflow: hidden;"></div>').css({position:this.element.css("position"),width:this.element.outerWidth(),height:this.element.outerHeight(),top:this.element.css("top"),left:this.element.css("left")}));this.element=this.element.parent().data("resizable",this.element.data("resizable"));this.elementIsWrapper=true;this.element.css({marginLeft:this.originalElement.css("marginLeft"),marginTop:this.originalElement.css("marginTop"),marginRight:this.originalElement.css("marginRight"),marginBottom:this.originalElement.css("marginBottom")});this.originalElement.css({marginLeft:0,marginTop:0,marginRight:0,marginBottom:0});this.originalResizeStyle=this.originalElement.css("resize");this.originalElement.css("resize","none");this._proportionallyResizeElements.push(this.originalElement.css({position:"static",zoom:1,display:"block"}));this.originalElement.css({margin:this.originalElement.css("margin")});this._proportionallyResize()}this.handles=j.handles||(!c(".ui-resizable-handle",this.element).length?"e,s,se":{n:".ui-resizable-n",e:".ui-resizable-e",s:".ui-resizable-s",w:".ui-resizable-w",se:".ui-resizable-se",sw:".ui-resizable-sw",ne:".ui-resizable-ne",nw:".ui-resizable-nw"});if(this.handles.constructor==String){if(this.handles=="all"){this.handles="n,e,s,w,se,sw,ne,nw"}var k=this.handles.split(",");this.handles={};for(var f=0;f<k.length;f++){var h=c.trim(k[f]),d="ui-resizable-"+h;var g=c('<div class="ui-resizable-handle '+d+'"></div>');if(/sw|se|ne|nw/.test(h)){g.css({zIndex:++j.zIndex})}if("se"==h){g.addClass("ui-icon ui-icon-gripsmall-diagonal-se")}this.handles[h]=".ui-resizable-"+h;this.element.append(g)}}this._renderAxis=function(p){p=p||this.element;for(var m in this.handles){if(this.handles[m].constructor==String){this.handles[m]=c(this.handles[m],this.element).show()}if(this.elementIsWrapper&&this.originalElement[0].nodeName.match(/textarea|input|select|button/i)){var n=c(this.handles[m],this.element),o=0;o=/sw|ne|nw|se|n|s/.test(m)?n.outerHeight():n.outerWidth();var l=["padding",/ne|nw|n/.test(m)?"Top":/se|sw|s/.test(m)?"Bottom":/^e$/.test(m)?"Right":"Left"].join("");p.css(l,o);this._proportionallyResize()}if(!c(this.handles[m]).length){continue}}};this._renderAxis(this.element);this._handles=c(".ui-resizable-handle",this.element).disableSelection();this._handles.mouseover(function(){if(!e.resizing){if(this.className){var i=this.className.match(/ui-resizable-(se|sw|ne|nw|n|e|s|w)/i)}e.axis=i&&i[1]?i[1]:"se"}});if(j.autoHide){this._handles.hide();c(this.element).addClass("ui-resizable-autohide").hover(function(){c(this).removeClass("ui-resizable-autohide");e._handles.show()},function(){if(!e.resizing){c(this).addClass("ui-resizable-autohide");e._handles.hide()}})}this._mouseInit()},destroy:function(){this._mouseDestroy();var d=function(f){c(f).removeClass("ui-resizable ui-resizable-disabled ui-resizable-resizing").removeData("resizable").unbind(".resizable").find(".ui-resizable-handle").remove()};if(this.elementIsWrapper){d(this.element);var e=this.element;e.parent().append(this.originalElement.css({position:e.css("position"),width:e.outerWidth(),height:e.outerHeight(),top:e.css("top"),left:e.css("left")})).end().remove()}this.originalElement.css("resize",this.originalResizeStyle);d(this.originalElement)},_mouseCapture:function(e){var f=false;for(var d in this.handles){if(c(this.handles[d])[0]==e.target){f=true}}return this.options.disabled||!!f},_mouseStart:function(f){var i=this.options,e=this.element.position(),d=this.element;this.resizing=true;this.documentScroll={top:c(document).scrollTop(),left:c(document).scrollLeft()};if(d.is(".ui-draggable")||(/absolute/).test(d.css("position"))){d.css({position:"absolute",top:e.top,left:e.left})}if(c.browser.opera&&(/relative/).test(d.css("position"))){d.css({position:"relative",top:"auto",left:"auto"})}this._renderProxy();var j=b(this.helper.css("left")),g=b(this.helper.css("top"));if(i.containment){j+=c(i.containment).scrollLeft()||0;g+=c(i.containment).scrollTop()||0}this.offset=this.helper.offset();this.position={left:j,top:g};this.size=this._helper?{width:d.outerWidth(),height:d.outerHeight()}:{width:d.width(),height:d.height()};this.originalSize=this._helper?{width:d.outerWidth(),height:d.outerHeight()}:{width:d.width(),height:d.height()};this.originalPosition={left:j,top:g};this.sizeDiff={width:d.outerWidth()-d.width(),height:d.outerHeight()-d.height()};this.originalMousePosition={left:f.pageX,top:f.pageY};this.aspectRatio=(typeof i.aspectRatio=="number")?i.aspectRatio:((this.originalSize.width/this.originalSize.height)||1);var h=c(".ui-resizable-"+this.axis).css("cursor");c("body").css("cursor",h=="auto"?this.axis+"-resize":h);d.addClass("ui-resizable-resizing");this._propagate("start",f);return true},_mouseDrag:function(d){var g=this.helper,f=this.options,l={},p=this,i=this.originalMousePosition,m=this.axis;var q=(d.pageX-i.left)||0,n=(d.pageY-i.top)||0;var h=this._change[m];if(!h){return false}var k=h.apply(this,[d,q,n]),j=c.browser.msie&&c.browser.version<7,e=this.sizeDiff;if(this._aspectRatio||d.shiftKey){k=this._updateRatio(k,d)}k=this._respectSize(k,d);this._propagate("resize",d);g.css({top:this.position.top+"px",left:this.position.left+"px",width:this.size.width+"px",height:this.size.height+"px"});if(!this._helper&&this._proportionallyResizeElements.length){this._proportionallyResize()}this._updateCache(k);this._trigger("resize",d,this.ui());return false},_mouseStop:function(g){this.resizing=false;var h=this.options,l=this;if(this._helper){var f=this._proportionallyResizeElements,d=f.length&&(/textarea/i).test(f[0].nodeName),e=d&&c.ui.hasScroll(f[0],"left")?0:l.sizeDiff.height,j=d?0:l.sizeDiff.width;var m={width:(l.size.width-j),height:(l.size.height-e)},i=(parseInt(l.element.css("left"),10)+(l.position.left-l.originalPosition.left))||null,k=(parseInt(l.element.css("top"),10)+(l.position.top-l.originalPosition.top))||null;if(!h.animate){this.element.css(c.extend(m,{top:k,left:i}))}l.helper.height(l.size.height);l.helper.width(l.size.width);if(this._helper&&!h.animate){this._proportionallyResize()}}c("body").css("cursor","auto");this.element.removeClass("ui-resizable-resizing");this._propagate("stop",g);if(this._helper){this.helper.remove()}return false},_updateCache:function(d){var e=this.options;this.offset=this.helper.offset();if(a(d.left)){this.position.left=d.left}if(a(d.top)){this.position.top=d.top}if(a(d.height)){this.size.height=d.height}if(a(d.width)){this.size.width=d.width}},_updateRatio:function(g,f){var h=this.options,i=this.position,e=this.size,d=this.axis;if(g.height){g.width=(e.height*this.aspectRatio)}else{if(g.width){g.height=(e.width/this.aspectRatio)}}if(d=="sw"){g.left=i.left+(e.width-g.width);g.top=null}if(d=="nw"){g.top=i.top+(e.height-g.height);g.left=i.left+(e.width-g.width)}return g},_respectSize:function(k,f){var i=this.helper,h=this.options,q=this._aspectRatio||f.shiftKey,p=this.axis,s=a(k.width)&&h.maxWidth&&(h.maxWidth<k.width),l=a(k.height)&&h.maxHeight&&(h.maxHeight<k.height),g=a(k.width)&&h.minWidth&&(h.minWidth>k.width),r=a(k.height)&&h.minHeight&&(h.minHeight>k.height);if(g){k.width=h.minWidth}if(r){k.height=h.minHeight}if(s){k.width=h.maxWidth}if(l){k.height=h.maxHeight}var e=this.originalPosition.left+this.originalSize.width,n=this.position.top+this.size.height;var j=/sw|nw|w/.test(p),d=/nw|ne|n/.test(p);if(g&&j){k.left=e-h.minWidth}if(s&&j){k.left=e-h.maxWidth}if(r&&d){k.top=n-h.minHeight}if(l&&d){k.top=n-h.maxHeight}var m=!k.width&&!k.height;if(m&&!k.left&&k.top){k.top=null}else{if(m&&!k.top&&k.left){k.left=null}}return k},_proportionallyResize:function(){var j=this.options;if(!this._proportionallyResizeElements.length){return}var f=this.helper||this.element;for(var e=0;e<this._proportionallyResizeElements.length;e++){var g=this._proportionallyResizeElements[e];if(!this.borderDif){var d=[g.css("borderTopWidth"),g.css("borderRightWidth"),g.css("borderBottomWidth"),g.css("borderLeftWidth")],h=[g.css("paddingTop"),g.css("paddingRight"),g.css("paddingBottom"),g.css("paddingLeft")];this.borderDif=c.map(d,function(k,m){var l=parseInt(k,10)||0,n=parseInt(h[m],10)||0;return l+n})}if(c.browser.msie&&!(!(c(f).is(":hidden")||c(f).parents(":hidden").length))){continue}g.css({height:(f.height()-this.borderDif[0]-this.borderDif[2])||0,width:(f.width()-this.borderDif[1]-this.borderDif[3])||0})}},_renderProxy:function(){var e=this.element,h=this.options;this.elementOffset=e.offset();if(this._helper){this.helper=this.helper||c('<div style="overflow:hidden;"></div>');var d=c.browser.msie&&c.browser.version<7,f=(d?1:0),g=(d?2:-1);this.helper.addClass(this._helper).css({width:this.element.outerWidth()+g,height:this.element.outerHeight()+g,position:"absolute",left:this.elementOffset.left-f+"px",top:this.elementOffset.top-f+"px",zIndex:++h.zIndex});this.helper.appendTo("body").disableSelection()}else{this.helper=this.element}},_change:{e:function(f,e,d){return{width:this.originalSize.width+e}},w:function(g,e,d){var i=this.options,f=this.originalSize,h=this.originalPosition;return{left:h.left+e,width:f.width-e}},n:function(g,e,d){var i=this.options,f=this.originalSize,h=this.originalPosition;return{top:h.top+d,height:f.height-d}},s:function(f,e,d){return{height:this.originalSize.height+d}},se:function(f,e,d){return c.extend(this._change.s.apply(this,arguments),this._change.e.apply(this,[f,e,d]))},sw:function(f,e,d){return c.extend(this._change.s.apply(this,arguments),this._change.w.apply(this,[f,e,d]))},ne:function(f,e,d){return c.extend(this._change.n.apply(this,arguments),this._change.e.apply(this,[f,e,d]))},nw:function(f,e,d){return c.extend(this._change.n.apply(this,arguments),this._change.w.apply(this,[f,e,d]))}},_propagate:function(e,d){c.ui.plugin.call(this,e,[d,this.ui()]);(e!="resize"&&this._trigger(e,d,this.ui()))},plugins:{},ui:function(){return{originalElement:this.originalElement,element:this.element,helper:this.helper,position:this.position,size:this.size,originalSize:this.originalSize,originalPosition:this.originalPosition}}}));c.extend(c.ui.resizable,{version:"1.7.2",eventPrefix:"resize",defaults:{alsoResize:false,animate:false,animateDuration:"slow",animateEasing:"swing",aspectRatio:false,autoHide:false,cancel:":input,option",containment:false,delay:0,distance:1,ghost:false,grid:false,handles:"e,s,se",helper:false,maxHeight:null,maxWidth:null,minHeight:10,minWidth:10,zIndex:1000}});c.ui.plugin.add("resizable","alsoResize",{start:function(e,f){var d=c(this).data("resizable"),g=d.options;_store=function(h){c(h).each(function(){c(this).data("resizable-alsoresize",{width:parseInt(c(this).width(),10),height:parseInt(c(this).height(),10),left:parseInt(c(this).css("left"),10),top:parseInt(c(this).css("top"),10)})})};if(typeof(g.alsoResize)=="object"&&!g.alsoResize.parentNode){if(g.alsoResize.length){g.alsoResize=g.alsoResize[0];_store(g.alsoResize)}else{c.each(g.alsoResize,function(h,i){_store(h)})}}else{_store(g.alsoResize)}},resize:function(f,h){var e=c(this).data("resizable"),i=e.options,g=e.originalSize,k=e.originalPosition;var j={height:(e.size.height-g.height)||0,width:(e.size.width-g.width)||0,top:(e.position.top-k.top)||0,left:(e.position.left-k.left)||0},d=function(l,m){c(l).each(function(){var p=c(this),q=c(this).data("resizable-alsoresize"),o={},n=m&&m.length?m:["width","height","top","left"];c.each(n||["width","height","top","left"],function(r,t){var s=(q[t]||0)+(j[t]||0);if(s&&s>=0){o[t]=s||null}});if(/relative/.test(p.css("position"))&&c.browser.opera){e._revertToRelativePosition=true;p.css({position:"absolute",top:"auto",left:"auto"})}p.css(o)})};if(typeof(i.alsoResize)=="object"&&!i.alsoResize.nodeType){c.each(i.alsoResize,function(l,m){d(l,m)})}else{d(i.alsoResize)}},stop:function(e,f){var d=c(this).data("resizable");if(d._revertToRelativePosition&&c.browser.opera){d._revertToRelativePosition=false;el.css({position:"relative"})}c(this).removeData("resizable-alsoresize-start")}});c.ui.plugin.add("resizable","animate",{stop:function(h,m){var n=c(this).data("resizable"),i=n.options;var g=n._proportionallyResizeElements,d=g.length&&(/textarea/i).test(g[0].nodeName),e=d&&c.ui.hasScroll(g[0],"left")?0:n.sizeDiff.height,k=d?0:n.sizeDiff.width;var f={width:(n.size.width-k),height:(n.size.height-e)},j=(parseInt(n.element.css("left"),10)+(n.position.left-n.originalPosition.left))||null,l=(parseInt(n.element.css("top"),10)+(n.position.top-n.originalPosition.top))||null;n.element.animate(c.extend(f,l&&j?{top:l,left:j}:{}),{duration:i.animateDuration,easing:i.animateEasing,step:function(){var o={width:parseInt(n.element.css("width"),10),height:parseInt(n.element.css("height"),10),top:parseInt(n.element.css("top"),10),left:parseInt(n.element.css("left"),10)};if(g&&g.length){c(g[0]).css({width:o.width,height:o.height})}n._updateCache(o);n._propagate("resize",h)}})}});c.ui.plugin.add("resizable","containment",{start:function(e,q){var s=c(this).data("resizable"),i=s.options,k=s.element;var f=i.containment,j=(f instanceof c)?f.get(0):(/parent/.test(f))?k.parent().get(0):f;if(!j){return}s.containerElement=c(j);if(/document/.test(f)||f==document){s.containerOffset={left:0,top:0};s.containerPosition={left:0,top:0};s.parentData={element:c(document),left:0,top:0,width:c(document).width(),height:c(document).height()||document.body.parentNode.scrollHeight}}else{var m=c(j),h=[];c(["Top","Right","Left","Bottom"]).each(function(p,o){h[p]=b(m.css("padding"+o))});s.containerOffset=m.offset();s.containerPosition=m.position();s.containerSize={height:(m.innerHeight()-h[3]),width:(m.innerWidth()-h[1])};var n=s.containerOffset,d=s.containerSize.height,l=s.containerSize.width,g=(c.ui.hasScroll(j,"left")?j.scrollWidth:l),r=(c.ui.hasScroll(j)?j.scrollHeight:d);s.parentData={element:j,left:n.left,top:n.top,width:g,height:r}}},resize:function(f,p){var s=c(this).data("resizable"),h=s.options,e=s.containerSize,n=s.containerOffset,l=s.size,m=s.position,q=s._aspectRatio||f.shiftKey,d={top:0,left:0},g=s.containerElement;if(g[0]!=document&&(/static/).test(g.css("position"))){d=n}if(m.left<(s._helper?n.left:0)){s.size.width=s.size.width+(s._helper?(s.position.left-n.left):(s.position.left-d.left));if(q){s.size.height=s.size.width/h.aspectRatio}s.position.left=h.helper?n.left:0}if(m.top<(s._helper?n.top:0)){s.size.height=s.size.height+(s._helper?(s.position.top-n.top):s.position.top);if(q){s.size.width=s.size.height*h.aspectRatio}s.position.top=s._helper?n.top:0}s.offset.left=s.parentData.left+s.position.left;s.offset.top=s.parentData.top+s.position.top;var k=Math.abs((s._helper?s.offset.left-d.left:(s.offset.left-d.left))+s.sizeDiff.width),r=Math.abs((s._helper?s.offset.top-d.top:(s.offset.top-n.top))+s.sizeDiff.height);var j=s.containerElement.get(0)==s.element.parent().get(0),i=/relative|absolute/.test(s.containerElement.css("position"));if(j&&i){k-=s.parentData.left}if(k+s.size.width>=s.parentData.width){s.size.width=s.parentData.width-k;if(q){s.size.height=s.size.width/s.aspectRatio}}if(r+s.size.height>=s.parentData.height){s.size.height=s.parentData.height-r;if(q){s.size.width=s.size.height*s.aspectRatio}}},stop:function(e,m){var p=c(this).data("resizable"),f=p.options,k=p.position,l=p.containerOffset,d=p.containerPosition,g=p.containerElement;var i=c(p.helper),q=i.offset(),n=i.outerWidth()-p.sizeDiff.width,j=i.outerHeight()-p.sizeDiff.height;if(p._helper&&!f.animate&&(/relative/).test(g.css("position"))){c(this).css({left:q.left-d.left-l.left,width:n,height:j})}if(p._helper&&!f.animate&&(/static/).test(g.css("position"))){c(this).css({left:q.left-d.left-l.left,width:n,height:j})}}});c.ui.plugin.add("resizable","ghost",{start:function(f,g){var d=c(this).data("resizable"),h=d.options,e=d.size;d.ghost=d.originalElement.clone();d.ghost.css({opacity:0.25,display:"block",position:"relative",height:e.height,width:e.width,margin:0,left:0,top:0}).addClass("ui-resizable-ghost").addClass(typeof h.ghost=="string"?h.ghost:"");d.ghost.appendTo(d.helper)},resize:function(e,f){var d=c(this).data("resizable"),g=d.options;if(d.ghost){d.ghost.css({position:"relative",height:d.size.height,width:d.size.width})}},stop:function(e,f){var d=c(this).data("resizable"),g=d.options;if(d.ghost&&d.helper){d.helper.get(0).removeChild(d.ghost.get(0))}}});c.ui.plugin.add("resizable","grid",{resize:function(d,l){var n=c(this).data("resizable"),g=n.options,j=n.size,h=n.originalSize,i=n.originalPosition,m=n.axis,k=g._aspectRatio||d.shiftKey;g.grid=typeof g.grid=="number"?[g.grid,g.grid]:g.grid;var f=Math.round((j.width-h.width)/(g.grid[0]||1))*(g.grid[0]||1),e=Math.round((j.height-h.height)/(g.grid[1]||1))*(g.grid[1]||1);if(/^(se|s|e)$/.test(m)){n.size.width=h.width+f;n.size.height=h.height+e}else{if(/^(ne)$/.test(m)){n.size.width=h.width+f;n.size.height=h.height+e;n.position.top=i.top-e}else{if(/^(sw)$/.test(m)){n.size.width=h.width+f;n.size.height=h.height+e;n.position.left=i.left-f}else{n.size.width=h.width+f;n.size.height=h.height+e;n.position.top=i.top-e;n.position.left=i.left-f}}}}});var b=function(d){return parseInt(d,10)||0};var a=function(d){return !isNaN(parseInt(d,10))}})(jQuery);;/*
 * jQuery UI Selectable 1.7.2
 *
 * Copyright (c) 2009 AUTHORS.txt (http://jqueryui.com/about)
 * Dual licensed under the MIT (MIT-LICENSE.txt)
 * and GPL (GPL-LICENSE.txt) licenses.
 *
 * http://docs.jquery.com/UI/Selectables
 *
 * Depends:
 *	ui.core.js
 */
(function(a){a.widget("ui.selectable",a.extend({},a.ui.mouse,{_init:function(){var b=this;this.element.addClass("ui-selectable");this.dragged=false;var c;this.refresh=function(){c=a(b.options.filter,b.element[0]);c.each(function(){var d=a(this);var e=d.offset();a.data(this,"selectable-item",{element:this,$element:d,left:e.left,top:e.top,right:e.left+d.outerWidth(),bottom:e.top+d.outerHeight(),startselected:false,selected:d.hasClass("ui-selected"),selecting:d.hasClass("ui-selecting"),unselecting:d.hasClass("ui-unselecting")})})};this.refresh();this.selectees=c.addClass("ui-selectee");this._mouseInit();this.helper=a(document.createElement("div")).css({border:"1px dotted black"}).addClass("ui-selectable-helper")},destroy:function(){this.element.removeClass("ui-selectable ui-selectable-disabled").removeData("selectable").unbind(".selectable");this._mouseDestroy()},_mouseStart:function(d){var b=this;this.opos=[d.pageX,d.pageY];if(this.options.disabled){return}var c=this.options;this.selectees=a(c.filter,this.element[0]);this._trigger("start",d);a(c.appendTo).append(this.helper);this.helper.css({"z-index":100,position:"absolute",left:d.clientX,top:d.clientY,width:0,height:0});if(c.autoRefresh){this.refresh()}this.selectees.filter(".ui-selected").each(function(){var e=a.data(this,"selectable-item");e.startselected=true;if(!d.metaKey){e.$element.removeClass("ui-selected");e.selected=false;e.$element.addClass("ui-unselecting");e.unselecting=true;b._trigger("unselecting",d,{unselecting:e.element})}});a(d.target).parents().andSelf().each(function(){var e=a.data(this,"selectable-item");if(e){e.$element.removeClass("ui-unselecting").addClass("ui-selecting");e.unselecting=false;e.selecting=true;e.selected=true;b._trigger("selecting",d,{selecting:e.element});return false}})},_mouseDrag:function(i){var c=this;this.dragged=true;if(this.options.disabled){return}var e=this.options;var d=this.opos[0],h=this.opos[1],b=i.pageX,g=i.pageY;if(d>b){var f=b;b=d;d=f}if(h>g){var f=g;g=h;h=f}this.helper.css({left:d,top:h,width:b-d,height:g-h});this.selectees.each(function(){var j=a.data(this,"selectable-item");if(!j||j.element==c.element[0]){return}var k=false;if(e.tolerance=="touch"){k=(!(j.left>b||j.right<d||j.top>g||j.bottom<h))}else{if(e.tolerance=="fit"){k=(j.left>d&&j.right<b&&j.top>h&&j.bottom<g)}}if(k){if(j.selected){j.$element.removeClass("ui-selected");j.selected=false}if(j.unselecting){j.$element.removeClass("ui-unselecting");j.unselecting=false}if(!j.selecting){j.$element.addClass("ui-selecting");j.selecting=true;c._trigger("selecting",i,{selecting:j.element})}}else{if(j.selecting){if(i.metaKey&&j.startselected){j.$element.removeClass("ui-selecting");j.selecting=false;j.$element.addClass("ui-selected");j.selected=true}else{j.$element.removeClass("ui-selecting");j.selecting=false;if(j.startselected){j.$element.addClass("ui-unselecting");j.unselecting=true}c._trigger("unselecting",i,{unselecting:j.element})}}if(j.selected){if(!i.metaKey&&!j.startselected){j.$element.removeClass("ui-selected");j.selected=false;j.$element.addClass("ui-unselecting");j.unselecting=true;c._trigger("unselecting",i,{unselecting:j.element})}}}});return false},_mouseStop:function(d){var b=this;this.dragged=false;var c=this.options;a(".ui-unselecting",this.element[0]).each(function(){var e=a.data(this,"selectable-item");e.$element.removeClass("ui-unselecting");e.unselecting=false;e.startselected=false;b._trigger("unselected",d,{unselected:e.element})});a(".ui-selecting",this.element[0]).each(function(){var e=a.data(this,"selectable-item");e.$element.removeClass("ui-selecting").addClass("ui-selected");e.selecting=false;e.selected=true;e.startselected=true;b._trigger("selected",d,{selected:e.element})});this._trigger("stop",d);this.helper.remove();return false}}));a.extend(a.ui.selectable,{version:"1.7.2",defaults:{appendTo:"body",autoRefresh:true,cancel:":input,option",delay:0,distance:0,filter:"*",tolerance:"touch"}})})(jQuery);;/*
 * jQuery UI Sortable 1.7.2
 *
 * Copyright (c) 2009 AUTHORS.txt (http://jqueryui.com/about)
 * Dual licensed under the MIT (MIT-LICENSE.txt)
 * and GPL (GPL-LICENSE.txt) licenses.
 *
 * http://docs.jquery.com/UI/Sortables
 *
 * Depends:
 *	ui.core.js
 */
(function(a){a.widget("ui.sortable",a.extend({},a.ui.mouse,{_init:function(){var b=this.options;this.containerCache={};this.element.addClass("ui-sortable");this.refresh();this.floating=this.items.length?(/left|right/).test(this.items[0].item.css("float")):false;this.offset=this.element.offset();this._mouseInit()},destroy:function(){this.element.removeClass("ui-sortable ui-sortable-disabled").removeData("sortable").unbind(".sortable");this._mouseDestroy();for(var b=this.items.length-1;b>=0;b--){this.items[b].item.removeData("sortable-item")}},_mouseCapture:function(e,f){if(this.reverting){return false}if(this.options.disabled||this.options.type=="static"){return false}this._refreshItems(e);var d=null,c=this,b=a(e.target).parents().each(function(){if(a.data(this,"sortable-item")==c){d=a(this);return false}});if(a.data(e.target,"sortable-item")==c){d=a(e.target)}if(!d){return false}if(this.options.handle&&!f){var g=false;a(this.options.handle,d).find("*").andSelf().each(function(){if(this==e.target){g=true}});if(!g){return false}}this.currentItem=d;this._removeCurrentsFromItems();return true},_mouseStart:function(e,f,b){var g=this.options,c=this;this.currentContainer=this;this.refreshPositions();this.helper=this._createHelper(e);this._cacheHelperProportions();this._cacheMargins();this.scrollParent=this.helper.scrollParent();this.offset=this.currentItem.offset();this.offset={top:this.offset.top-this.margins.top,left:this.offset.left-this.margins.left};this.helper.css("position","absolute");this.cssPosition=this.helper.css("position");a.extend(this.offset,{click:{left:e.pageX-this.offset.left,top:e.pageY-this.offset.top},parent:this._getParentOffset(),relative:this._getRelativeOffset()});this.originalPosition=this._generatePosition(e);this.originalPageX=e.pageX;this.originalPageY=e.pageY;if(g.cursorAt){this._adjustOffsetFromHelper(g.cursorAt)}this.domPosition={prev:this.currentItem.prev()[0],parent:this.currentItem.parent()[0]};if(this.helper[0]!=this.currentItem[0]){this.currentItem.hide()}this._createPlaceholder();if(g.containment){this._setContainment()}if(g.cursor){if(a("body").css("cursor")){this._storedCursor=a("body").css("cursor")}a("body").css("cursor",g.cursor)}if(g.opacity){if(this.helper.css("opacity")){this._storedOpacity=this.helper.css("opacity")}this.helper.css("opacity",g.opacity)}if(g.zIndex){if(this.helper.css("zIndex")){this._storedZIndex=this.helper.css("zIndex")}this.helper.css("zIndex",g.zIndex)}if(this.scrollParent[0]!=document&&this.scrollParent[0].tagName!="HTML"){this.overflowOffset=this.scrollParent.offset()}this._trigger("start",e,this._uiHash());if(!this._preserveHelperProportions){this._cacheHelperProportions()}if(!b){for(var d=this.containers.length-1;d>=0;d--){this.containers[d]._trigger("activate",e,c._uiHash(this))}}if(a.ui.ddmanager){a.ui.ddmanager.current=this}if(a.ui.ddmanager&&!g.dropBehaviour){a.ui.ddmanager.prepareOffsets(this,e)}this.dragging=true;this.helper.addClass("ui-sortable-helper");this._mouseDrag(e);return true},_mouseDrag:function(f){this.position=this._generatePosition(f);this.positionAbs=this._convertPositionTo("absolute");if(!this.lastPositionAbs){this.lastPositionAbs=this.positionAbs}if(this.options.scroll){var g=this.options,b=false;if(this.scrollParent[0]!=document&&this.scrollParent[0].tagName!="HTML"){if((this.overflowOffset.top+this.scrollParent[0].offsetHeight)-f.pageY<g.scrollSensitivity){this.scrollParent[0].scrollTop=b=this.scrollParent[0].scrollTop+g.scrollSpeed}else{if(f.pageY-this.overflowOffset.top<g.scrollSensitivity){this.scrollParent[0].scrollTop=b=this.scrollParent[0].scrollTop-g.scrollSpeed}}if((this.overflowOffset.left+this.scrollParent[0].offsetWidth)-f.pageX<g.scrollSensitivity){this.scrollParent[0].scrollLeft=b=this.scrollParent[0].scrollLeft+g.scrollSpeed}else{if(f.pageX-this.overflowOffset.left<g.scrollSensitivity){this.scrollParent[0].scrollLeft=b=this.scrollParent[0].scrollLeft-g.scrollSpeed}}}else{if(f.pageY-a(document).scrollTop()<g.scrollSensitivity){b=a(document).scrollTop(a(document).scrollTop()-g.scrollSpeed)}else{if(a(window).height()-(f.pageY-a(document).scrollTop())<g.scrollSensitivity){b=a(document).scrollTop(a(document).scrollTop()+g.scrollSpeed)}}if(f.pageX-a(document).scrollLeft()<g.scrollSensitivity){b=a(document).scrollLeft(a(document).scrollLeft()-g.scrollSpeed)}else{if(a(window).width()-(f.pageX-a(document).scrollLeft())<g.scrollSensitivity){b=a(document).scrollLeft(a(document).scrollLeft()+g.scrollSpeed)}}}if(b!==false&&a.ui.ddmanager&&!g.dropBehaviour){a.ui.ddmanager.prepareOffsets(this,f)}}this.positionAbs=this._convertPositionTo("absolute");if(!this.options.axis||this.options.axis!="y"){this.helper[0].style.left=this.position.left+"px"}if(!this.options.axis||this.options.axis!="x"){this.helper[0].style.top=this.position.top+"px"}for(var d=this.items.length-1;d>=0;d--){var e=this.items[d],c=e.item[0],h=this._intersectsWithPointer(e);if(!h){continue}if(c!=this.currentItem[0]&&this.placeholder[h==1?"next":"prev"]()[0]!=c&&!a.ui.contains(this.placeholder[0],c)&&(this.options.type=="semi-dynamic"?!a.ui.contains(this.element[0],c):true)){this.direction=h==1?"down":"up";if(this.options.tolerance=="pointer"||this._intersectsWithSides(e)){this._rearrange(f,e)}else{break}this._trigger("change",f,this._uiHash());break}}this._contactContainers(f);if(a.ui.ddmanager){a.ui.ddmanager.drag(this,f)}this._trigger("sort",f,this._uiHash());this.lastPositionAbs=this.positionAbs;return false},_mouseStop:function(c,d){if(!c){return}if(a.ui.ddmanager&&!this.options.dropBehaviour){a.ui.ddmanager.drop(this,c)}if(this.options.revert){var b=this;var e=b.placeholder.offset();b.reverting=true;a(this.helper).animate({left:e.left-this.offset.parent.left-b.margins.left+(this.offsetParent[0]==document.body?0:this.offsetParent[0].scrollLeft),top:e.top-this.offset.parent.top-b.margins.top+(this.offsetParent[0]==document.body?0:this.offsetParent[0].scrollTop)},parseInt(this.options.revert,10)||500,function(){b._clear(c)})}else{this._clear(c,d)}return false},cancel:function(){var b=this;if(this.dragging){this._mouseUp();if(this.options.helper=="original"){this.currentItem.css(this._storedCSS).removeClass("ui-sortable-helper")}else{this.currentItem.show()}for(var c=this.containers.length-1;c>=0;c--){this.containers[c]._trigger("deactivate",null,b._uiHash(this));if(this.containers[c].containerCache.over){this.containers[c]._trigger("out",null,b._uiHash(this));this.containers[c].containerCache.over=0}}}if(this.placeholder[0].parentNode){this.placeholder[0].parentNode.removeChild(this.placeholder[0])}if(this.options.helper!="original"&&this.helper&&this.helper[0].parentNode){this.helper.remove()}a.extend(this,{helper:null,dragging:false,reverting:false,_noFinalSort:null});if(this.domPosition.prev){a(this.domPosition.prev).after(this.currentItem)}else{a(this.domPosition.parent).prepend(this.currentItem)}return true},serialize:function(d){var b=this._getItemsAsjQuery(d&&d.connected);var c=[];d=d||{};a(b).each(function(){var e=(a(d.item||this).attr(d.attribute||"id")||"").match(d.expression||(/(.+)[-=_](.+)/));if(e){c.push((d.key||e[1]+"[]")+"="+(d.key&&d.expression?e[1]:e[2]))}});return c.join("&")},toArray:function(d){var b=this._getItemsAsjQuery(d&&d.connected);var c=[];d=d||{};b.each(function(){c.push(a(d.item||this).attr(d.attribute||"id")||"")});return c},_intersectsWith:function(m){var e=this.positionAbs.left,d=e+this.helperProportions.width,k=this.positionAbs.top,j=k+this.helperProportions.height;var f=m.left,c=f+m.width,n=m.top,i=n+m.height;var o=this.offset.click.top,h=this.offset.click.left;var g=(k+o)>n&&(k+o)<i&&(e+h)>f&&(e+h)<c;if(this.options.tolerance=="pointer"||this.options.forcePointerForContainers||(this.options.tolerance!="pointer"&&this.helperProportions[this.floating?"width":"height"]>m[this.floating?"width":"height"])){return g}else{return(f<e+(this.helperProportions.width/2)&&d-(this.helperProportions.width/2)<c&&n<k+(this.helperProportions.height/2)&&j-(this.helperProportions.height/2)<i)}},_intersectsWithPointer:function(d){var e=a.ui.isOverAxis(this.positionAbs.top+this.offset.click.top,d.top,d.height),c=a.ui.isOverAxis(this.positionAbs.left+this.offset.click.left,d.left,d.width),g=e&&c,b=this._getDragVerticalDirection(),f=this._getDragHorizontalDirection();if(!g){return false}return this.floating?(((f&&f=="right")||b=="down")?2:1):(b&&(b=="down"?2:1))},_intersectsWithSides:function(e){var c=a.ui.isOverAxis(this.positionAbs.top+this.offset.click.top,e.top+(e.height/2),e.height),d=a.ui.isOverAxis(this.positionAbs.left+this.offset.click.left,e.left+(e.width/2),e.width),b=this._getDragVerticalDirection(),f=this._getDragHorizontalDirection();if(this.floating&&f){return((f=="right"&&d)||(f=="left"&&!d))}else{return b&&((b=="down"&&c)||(b=="up"&&!c))}},_getDragVerticalDirection:function(){var b=this.positionAbs.top-this.lastPositionAbs.top;return b!=0&&(b>0?"down":"up")},_getDragHorizontalDirection:function(){var b=this.positionAbs.left-this.lastPositionAbs.left;return b!=0&&(b>0?"right":"left")},refresh:function(b){this._refreshItems(b);this.refreshPositions()},_connectWith:function(){var b=this.options;return b.connectWith.constructor==String?[b.connectWith]:b.connectWith},_getItemsAsjQuery:function(b){var l=this;var g=[];var e=[];var h=this._connectWith();if(h&&b){for(var d=h.length-1;d>=0;d--){var k=a(h[d]);for(var c=k.length-1;c>=0;c--){var f=a.data(k[c],"sortable");if(f&&f!=this&&!f.options.disabled){e.push([a.isFunction(f.options.items)?f.options.items.call(f.element):a(f.options.items,f.element).not(".ui-sortable-helper"),f])}}}}e.push([a.isFunction(this.options.items)?this.options.items.call(this.element,null,{options:this.options,item:this.currentItem}):a(this.options.items,this.element).not(".ui-sortable-helper"),this]);for(var d=e.length-1;d>=0;d--){e[d][0].each(function(){g.push(this)})}return a(g)},_removeCurrentsFromItems:function(){var d=this.currentItem.find(":data(sortable-item)");for(var c=0;c<this.items.length;c++){for(var b=0;b<d.length;b++){if(d[b]==this.items[c].item[0]){this.items.splice(c,1)}}}},_refreshItems:function(b){this.items=[];this.containers=[this];var h=this.items;var p=this;var f=[[a.isFunction(this.options.items)?this.options.items.call(this.element[0],b,{item:this.currentItem}):a(this.options.items,this.element),this]];var l=this._connectWith();if(l){for(var e=l.length-1;e>=0;e--){var m=a(l[e]);for(var d=m.length-1;d>=0;d--){var g=a.data(m[d],"sortable");if(g&&g!=this&&!g.options.disabled){f.push([a.isFunction(g.options.items)?g.options.items.call(g.element[0],b,{item:this.currentItem}):a(g.options.items,g.element),g]);this.containers.push(g)}}}}for(var e=f.length-1;e>=0;e--){var k=f[e][1];var c=f[e][0];for(var d=0,n=c.length;d<n;d++){var o=a(c[d]);o.data("sortable-item",k);h.push({item:o,instance:k,width:0,height:0,left:0,top:0})}}},refreshPositions:function(b){if(this.offsetParent&&this.helper){this.offset.parent=this._getParentOffset()}for(var d=this.items.length-1;d>=0;d--){var e=this.items[d];if(e.instance!=this.currentContainer&&this.currentContainer&&e.item[0]!=this.currentItem[0]){continue}var c=this.options.toleranceElement?a(this.options.toleranceElement,e.item):e.item;if(!b){e.width=c.outerWidth();e.height=c.outerHeight()}var f=c.offset();e.left=f.left;e.top=f.top}if(this.options.custom&&this.options.custom.refreshContainers){this.options.custom.refreshContainers.call(this)}else{for(var d=this.containers.length-1;d>=0;d--){var f=this.containers[d].element.offset();this.containers[d].containerCache.left=f.left;this.containers[d].containerCache.top=f.top;this.containers[d].containerCache.width=this.containers[d].element.outerWidth();this.containers[d].containerCache.height=this.containers[d].element.outerHeight()}}},_createPlaceholder:function(d){var b=d||this,e=b.options;if(!e.placeholder||e.placeholder.constructor==String){var c=e.placeholder;e.placeholder={element:function(){var f=a(document.createElement(b.currentItem[0].nodeName)).addClass(c||b.currentItem[0].className+" ui-sortable-placeholder").removeClass("ui-sortable-helper")[0];if(!c){f.style.visibility="hidden"}return f},update:function(f,g){if(c&&!e.forcePlaceholderSize){return}if(!g.height()){g.height(b.currentItem.innerHeight()-parseInt(b.currentItem.css("paddingTop")||0,10)-parseInt(b.currentItem.css("paddingBottom")||0,10))}if(!g.width()){g.width(b.currentItem.innerWidth()-parseInt(b.currentItem.css("paddingLeft")||0,10)-parseInt(b.currentItem.css("paddingRight")||0,10))}}}}b.placeholder=a(e.placeholder.element.call(b.element,b.currentItem));b.currentItem.after(b.placeholder);e.placeholder.update(b,b.placeholder)},_contactContainers:function(d){for(var c=this.containers.length-1;c>=0;c--){if(this._intersectsWith(this.containers[c].containerCache)){if(!this.containers[c].containerCache.over){if(this.currentContainer!=this.containers[c]){var h=10000;var g=null;var e=this.positionAbs[this.containers[c].floating?"left":"top"];for(var b=this.items.length-1;b>=0;b--){if(!a.ui.contains(this.containers[c].element[0],this.items[b].item[0])){continue}var f=this.items[b][this.containers[c].floating?"left":"top"];if(Math.abs(f-e)<h){h=Math.abs(f-e);g=this.items[b]}}if(!g&&!this.options.dropOnEmpty){continue}this.currentContainer=this.containers[c];g?this._rearrange(d,g,null,true):this._rearrange(d,null,this.containers[c].element,true);this._trigger("change",d,this._uiHash());this.containers[c]._trigger("change",d,this._uiHash(this));this.options.placeholder.update(this.currentContainer,this.placeholder)}this.containers[c]._trigger("over",d,this._uiHash(this));this.containers[c].containerCache.over=1}}else{if(this.containers[c].containerCache.over){this.containers[c]._trigger("out",d,this._uiHash(this));this.containers[c].containerCache.over=0}}}},_createHelper:function(c){var d=this.options;var b=a.isFunction(d.helper)?a(d.helper.apply(this.element[0],[c,this.currentItem])):(d.helper=="clone"?this.currentItem.clone():this.currentItem);if(!b.parents("body").length){a(d.appendTo!="parent"?d.appendTo:this.currentItem[0].parentNode)[0].appendChild(b[0])}if(b[0]==this.currentItem[0]){this._storedCSS={width:this.currentItem[0].style.width,height:this.currentItem[0].style.height,position:this.currentItem.css("position"),top:this.currentItem.css("top"),left:this.currentItem.css("left")}}if(b[0].style.width==""||d.forceHelperSize){b.width(this.currentItem.width())}if(b[0].style.height==""||d.forceHelperSize){b.height(this.currentItem.height())}return b},_adjustOffsetFromHelper:function(b){if(b.left!=undefined){this.offset.click.left=b.left+this.margins.left}if(b.right!=undefined){this.offset.click.left=this.helperProportions.width-b.right+this.margins.left}if(b.top!=undefined){this.offset.click.top=b.top+this.margins.top}if(b.bottom!=undefined){this.offset.click.top=this.helperProportions.height-b.bottom+this.margins.top}},_getParentOffset:function(){this.offsetParent=this.helper.offsetParent();var b=this.offsetParent.offset();if(this.cssPosition=="absolute"&&this.scrollParent[0]!=document&&a.ui.contains(this.scrollParent[0],this.offsetParent[0])){b.left+=this.scrollParent.scrollLeft();b.top+=this.scrollParent.scrollTop()}if((this.offsetParent[0]==document.body)||(this.offsetParent[0].tagName&&this.offsetParent[0].tagName.toLowerCase()=="html"&&a.browser.msie)){b={top:0,left:0}}return{top:b.top+(parseInt(this.offsetParent.css("borderTopWidth"),10)||0),left:b.left+(parseInt(this.offsetParent.css("borderLeftWidth"),10)||0)}},_getRelativeOffset:function(){if(this.cssPosition=="relative"){var b=this.currentItem.position();return{top:b.top-(parseInt(this.helper.css("top"),10)||0)+this.scrollParent.scrollTop(),left:b.left-(parseInt(this.helper.css("left"),10)||0)+this.scrollParent.scrollLeft()}}else{return{top:0,left:0}}},_cacheMargins:function(){this.margins={left:(parseInt(this.currentItem.css("marginLeft"),10)||0),top:(parseInt(this.currentItem.css("marginTop"),10)||0)}},_cacheHelperProportions:function(){this.helperProportions={width:this.helper.outerWidth(),height:this.helper.outerHeight()}},_setContainment:function(){var e=this.options;if(e.containment=="parent"){e.containment=this.helper[0].parentNode}if(e.containment=="document"||e.containment=="window"){this.containment=[0-this.offset.relative.left-this.offset.parent.left,0-this.offset.relative.top-this.offset.parent.top,a(e.containment=="document"?document:window).width()-this.helperProportions.width-this.margins.left,(a(e.containment=="document"?document:window).height()||document.body.parentNode.scrollHeight)-this.helperProportions.height-this.margins.top]}if(!(/^(document|window|parent)$/).test(e.containment)){var c=a(e.containment)[0];var d=a(e.containment).offset();var b=(a(c).css("overflow")!="hidden");this.containment=[d.left+(parseInt(a(c).css("borderLeftWidth"),10)||0)+(parseInt(a(c).css("paddingLeft"),10)||0)-this.margins.left,d.top+(parseInt(a(c).css("borderTopWidth"),10)||0)+(parseInt(a(c).css("paddingTop"),10)||0)-this.margins.top,d.left+(b?Math.max(c.scrollWidth,c.offsetWidth):c.offsetWidth)-(parseInt(a(c).css("borderLeftWidth"),10)||0)-(parseInt(a(c).css("paddingRight"),10)||0)-this.helperProportions.width-this.margins.left,d.top+(b?Math.max(c.scrollHeight,c.offsetHeight):c.offsetHeight)-(parseInt(a(c).css("borderTopWidth"),10)||0)-(parseInt(a(c).css("paddingBottom"),10)||0)-this.helperProportions.height-this.margins.top]}},_convertPositionTo:function(f,h){if(!h){h=this.position}var c=f=="absolute"?1:-1;var e=this.options,b=this.cssPosition=="absolute"&&!(this.scrollParent[0]!=document&&a.ui.contains(this.scrollParent[0],this.offsetParent[0]))?this.offsetParent:this.scrollParent,g=(/(html|body)/i).test(b[0].tagName);return{top:(h.top+this.offset.relative.top*c+this.offset.parent.top*c-(a.browser.safari&&this.cssPosition=="fixed"?0:(this.cssPosition=="fixed"?-this.scrollParent.scrollTop():(g?0:b.scrollTop()))*c)),left:(h.left+this.offset.relative.left*c+this.offset.parent.left*c-(a.browser.safari&&this.cssPosition=="fixed"?0:(this.cssPosition=="fixed"?-this.scrollParent.scrollLeft():g?0:b.scrollLeft())*c))}},_generatePosition:function(e){var h=this.options,b=this.cssPosition=="absolute"&&!(this.scrollParent[0]!=document&&a.ui.contains(this.scrollParent[0],this.offsetParent[0]))?this.offsetParent:this.scrollParent,i=(/(html|body)/i).test(b[0].tagName);if(this.cssPosition=="relative"&&!(this.scrollParent[0]!=document&&this.scrollParent[0]!=this.offsetParent[0])){this.offset.relative=this._getRelativeOffset()}var d=e.pageX;var c=e.pageY;if(this.originalPosition){if(this.containment){if(e.pageX-this.offset.click.left<this.containment[0]){d=this.containment[0]+this.offset.click.left}if(e.pageY-this.offset.click.top<this.containment[1]){c=this.containment[1]+this.offset.click.top}if(e.pageX-this.offset.click.left>this.containment[2]){d=this.containment[2]+this.offset.click.left}if(e.pageY-this.offset.click.top>this.containment[3]){c=this.containment[3]+this.offset.click.top}}if(h.grid){var g=this.originalPageY+Math.round((c-this.originalPageY)/h.grid[1])*h.grid[1];c=this.containment?(!(g-this.offset.click.top<this.containment[1]||g-this.offset.click.top>this.containment[3])?g:(!(g-this.offset.click.top<this.containment[1])?g-h.grid[1]:g+h.grid[1])):g;var f=this.originalPageX+Math.round((d-this.originalPageX)/h.grid[0])*h.grid[0];d=this.containment?(!(f-this.offset.click.left<this.containment[0]||f-this.offset.click.left>this.containment[2])?f:(!(f-this.offset.click.left<this.containment[0])?f-h.grid[0]:f+h.grid[0])):f}}return{top:(c-this.offset.click.top-this.offset.relative.top-this.offset.parent.top+(a.browser.safari&&this.cssPosition=="fixed"?0:(this.cssPosition=="fixed"?-this.scrollParent.scrollTop():(i?0:b.scrollTop())))),left:(d-this.offset.click.left-this.offset.relative.left-this.offset.parent.left+(a.browser.safari&&this.cssPosition=="fixed"?0:(this.cssPosition=="fixed"?-this.scrollParent.scrollLeft():i?0:b.scrollLeft())))}},_rearrange:function(g,f,c,e){c?c[0].appendChild(this.placeholder[0]):f.item[0].parentNode.insertBefore(this.placeholder[0],(this.direction=="down"?f.item[0]:f.item[0].nextSibling));this.counter=this.counter?++this.counter:1;var d=this,b=this.counter;window.setTimeout(function(){if(b==d.counter){d.refreshPositions(!e)}},0)},_clear:function(d,e){this.reverting=false;var f=[],b=this;if(!this._noFinalSort&&this.currentItem[0].parentNode){this.placeholder.before(this.currentItem)}this._noFinalSort=null;if(this.helper[0]==this.currentItem[0]){for(var c in this._storedCSS){if(this._storedCSS[c]=="auto"||this._storedCSS[c]=="static"){this._storedCSS[c]=""}}this.currentItem.css(this._storedCSS).removeClass("ui-sortable-helper")}else{this.currentItem.show()}if(this.fromOutside&&!e){f.push(function(g){this._trigger("receive",g,this._uiHash(this.fromOutside))})}if((this.fromOutside||this.domPosition.prev!=this.currentItem.prev().not(".ui-sortable-helper")[0]||this.domPosition.parent!=this.currentItem.parent()[0])&&!e){f.push(function(g){this._trigger("update",g,this._uiHash())})}if(!a.ui.contains(this.element[0],this.currentItem[0])){if(!e){f.push(function(g){this._trigger("remove",g,this._uiHash())})}for(var c=this.containers.length-1;c>=0;c--){if(a.ui.contains(this.containers[c].element[0],this.currentItem[0])&&!e){f.push((function(g){return function(h){g._trigger("receive",h,this._uiHash(this))}}).call(this,this.containers[c]));f.push((function(g){return function(h){g._trigger("update",h,this._uiHash(this))}}).call(this,this.containers[c]))}}}for(var c=this.containers.length-1;c>=0;c--){if(!e){f.push((function(g){return function(h){g._trigger("deactivate",h,this._uiHash(this))}}).call(this,this.containers[c]))}if(this.containers[c].containerCache.over){f.push((function(g){return function(h){g._trigger("out",h,this._uiHash(this))}}).call(this,this.containers[c]));this.containers[c].containerCache.over=0}}if(this._storedCursor){a("body").css("cursor",this._storedCursor)}if(this._storedOpacity){this.helper.css("opacity",this._storedOpacity)}if(this._storedZIndex){this.helper.css("zIndex",this._storedZIndex=="auto"?"":this._storedZIndex)}this.dragging=false;if(this.cancelHelperRemoval){if(!e){this._trigger("beforeStop",d,this._uiHash());for(var c=0;c<f.length;c++){f[c].call(this,d)}this._trigger("stop",d,this._uiHash())}return false}if(!e){this._trigger("beforeStop",d,this._uiHash())}this.placeholder[0].parentNode.removeChild(this.placeholder[0]);if(this.helper[0]!=this.currentItem[0]){this.helper.remove()}this.helper=null;if(!e){for(var c=0;c<f.length;c++){f[c].call(this,d)}this._trigger("stop",d,this._uiHash())}this.fromOutside=false;return true},_trigger:function(){if(a.widget.prototype._trigger.apply(this,arguments)===false){this.cancel()}},_uiHash:function(c){var b=c||this;return{helper:b.helper,placeholder:b.placeholder||a([]),position:b.position,absolutePosition:b.positionAbs,offset:b.positionAbs,item:b.currentItem,sender:c?c.element:null}}}));a.extend(a.ui.sortable,{getter:"serialize toArray",version:"1.7.2",eventPrefix:"sort",defaults:{appendTo:"parent",axis:false,cancel:":input,option",connectWith:false,containment:false,cursor:"auto",cursorAt:false,delay:0,distance:1,dropOnEmpty:true,forcePlaceholderSize:false,forceHelperSize:false,grid:false,handle:false,helper:"original",items:"> *",opacity:false,placeholder:false,revert:false,scroll:true,scrollSensitivity:20,scrollSpeed:20,scope:"default",tolerance:"intersect",zIndex:1000}})})(jQuery);;/*
 * jQuery UI Accordion 1.7.2
 *
 * Copyright (c) 2009 AUTHORS.txt (http://jqueryui.com/about)
 * Dual licensed under the MIT (MIT-LICENSE.txt)
 * and GPL (GPL-LICENSE.txt) licenses.
 *
 * http://docs.jquery.com/UI/Accordion
 *
 * Depends:
 *	ui.core.js
 */
(function(a){a.widget("ui.accordion",{_init:function(){var d=this.options,b=this;this.running=0;if(d.collapsible==a.ui.accordion.defaults.collapsible&&d.alwaysOpen!=a.ui.accordion.defaults.alwaysOpen){d.collapsible=!d.alwaysOpen}if(d.navigation){var c=this.element.find("a").filter(d.navigationFilter);if(c.length){if(c.filter(d.header).length){this.active=c}else{this.active=c.parent().parent().prev();c.addClass("ui-accordion-content-active")}}}this.element.addClass("ui-accordion ui-widget ui-helper-reset");if(this.element[0].nodeName=="UL"){this.element.children("li").addClass("ui-accordion-li-fix")}this.headers=this.element.find(d.header).addClass("ui-accordion-header ui-helper-reset ui-state-default ui-corner-all").bind("mouseenter.accordion",function(){a(this).addClass("ui-state-hover")}).bind("mouseleave.accordion",function(){a(this).removeClass("ui-state-hover")}).bind("focus.accordion",function(){a(this).addClass("ui-state-focus")}).bind("blur.accordion",function(){a(this).removeClass("ui-state-focus")});this.headers.next().addClass("ui-accordion-content ui-helper-reset ui-widget-content ui-corner-bottom");this.active=this._findActive(this.active||d.active).toggleClass("ui-state-default").toggleClass("ui-state-active").toggleClass("ui-corner-all").toggleClass("ui-corner-top");this.active.next().addClass("ui-accordion-content-active");a("<span/>").addClass("ui-icon "+d.icons.header).prependTo(this.headers);this.active.find(".ui-icon").toggleClass(d.icons.header).toggleClass(d.icons.headerSelected);if(a.browser.msie){this.element.find("a").css("zoom","1")}this.resize();this.element.attr("role","tablist");this.headers.attr("role","tab").bind("keydown",function(e){return b._keydown(e)}).next().attr("role","tabpanel");this.headers.not(this.active||"").attr("aria-expanded","false").attr("tabIndex","-1").next().hide();if(!this.active.length){this.headers.eq(0).attr("tabIndex","0")}else{this.active.attr("aria-expanded","true").attr("tabIndex","0")}if(!a.browser.safari){this.headers.find("a").attr("tabIndex","-1")}if(d.event){this.headers.bind((d.event)+".accordion",function(e){return b._clickHandler.call(b,e,this)})}},destroy:function(){var c=this.options;this.element.removeClass("ui-accordion ui-widget ui-helper-reset").removeAttr("role").unbind(".accordion").removeData("accordion");this.headers.unbind(".accordion").removeClass("ui-accordion-header ui-helper-reset ui-state-default ui-corner-all ui-state-active ui-corner-top").removeAttr("role").removeAttr("aria-expanded").removeAttr("tabindex");this.headers.find("a").removeAttr("tabindex");this.headers.children(".ui-icon").remove();var b=this.headers.next().css("display","").removeAttr("role").removeClass("ui-helper-reset ui-widget-content ui-corner-bottom ui-accordion-content ui-accordion-content-active");if(c.autoHeight||c.fillHeight){b.css("height","")}},_setData:function(b,c){if(b=="alwaysOpen"){b="collapsible";c=!c}a.widget.prototype._setData.apply(this,arguments)},_keydown:function(e){var g=this.options,f=a.ui.keyCode;if(g.disabled||e.altKey||e.ctrlKey){return}var d=this.headers.length;var b=this.headers.index(e.target);var c=false;switch(e.keyCode){case f.RIGHT:case f.DOWN:c=this.headers[(b+1)%d];break;case f.LEFT:case f.UP:c=this.headers[(b-1+d)%d];break;case f.SPACE:case f.ENTER:return this._clickHandler({target:e.target},e.target)}if(c){a(e.target).attr("tabIndex","-1");a(c).attr("tabIndex","0");c.focus();return false}return true},resize:function(){var e=this.options,d;if(e.fillSpace){if(a.browser.msie){var b=this.element.parent().css("overflow");this.element.parent().css("overflow","hidden")}d=this.element.parent().height();if(a.browser.msie){this.element.parent().css("overflow",b)}this.headers.each(function(){d-=a(this).outerHeight()});var c=0;this.headers.next().each(function(){c=Math.max(c,a(this).innerHeight()-a(this).height())}).height(Math.max(0,d-c)).css("overflow","auto")}else{if(e.autoHeight){d=0;this.headers.next().each(function(){d=Math.max(d,a(this).outerHeight())}).height(d)}}},activate:function(b){var c=this._findActive(b)[0];this._clickHandler({target:c},c)},_findActive:function(b){return b?typeof b=="number"?this.headers.filter(":eq("+b+")"):this.headers.not(this.headers.not(b)):b===false?a([]):this.headers.filter(":eq(0)")},_clickHandler:function(b,f){var d=this.options;if(d.disabled){return false}if(!b.target&&d.collapsible){this.active.removeClass("ui-state-active ui-corner-top").addClass("ui-state-default ui-corner-all").find(".ui-icon").removeClass(d.icons.headerSelected).addClass(d.icons.header);this.active.next().addClass("ui-accordion-content-active");var h=this.active.next(),e={options:d,newHeader:a([]),oldHeader:d.active,newContent:a([]),oldContent:h},c=(this.active=a([]));this._toggle(c,h,e);return false}var g=a(b.currentTarget||f);var i=g[0]==this.active[0];if(this.running||(!d.collapsible&&i)){return false}this.active.removeClass("ui-state-active ui-corner-top").addClass("ui-state-default ui-corner-all").find(".ui-icon").removeClass(d.icons.headerSelected).addClass(d.icons.header);this.active.next().addClass("ui-accordion-content-active");if(!i){g.removeClass("ui-state-default ui-corner-all").addClass("ui-state-active ui-corner-top").find(".ui-icon").removeClass(d.icons.header).addClass(d.icons.headerSelected);g.next().addClass("ui-accordion-content-active")}var c=g.next(),h=this.active.next(),e={options:d,newHeader:i&&d.collapsible?a([]):g,oldHeader:this.active,newContent:i&&d.collapsible?a([]):c.find("> *"),oldContent:h.find("> *")},j=this.headers.index(this.active[0])>this.headers.index(g[0]);this.active=i?a([]):g;this._toggle(c,h,e,i,j);return false},_toggle:function(b,i,g,j,k){var d=this.options,m=this;this.toShow=b;this.toHide=i;this.data=g;var c=function(){if(!m){return}return m._completed.apply(m,arguments)};this._trigger("changestart",null,this.data);this.running=i.size()===0?b.size():i.size();if(d.animated){var f={};if(d.collapsible&&j){f={toShow:a([]),toHide:i,complete:c,down:k,autoHeight:d.autoHeight||d.fillSpace}}else{f={toShow:b,toHide:i,complete:c,down:k,autoHeight:d.autoHeight||d.fillSpace}}if(!d.proxied){d.proxied=d.animated}if(!d.proxiedDuration){d.proxiedDuration=d.duration}d.animated=a.isFunction(d.proxied)?d.proxied(f):d.proxied;d.duration=a.isFunction(d.proxiedDuration)?d.proxiedDuration(f):d.proxiedDuration;var l=a.ui.accordion.animations,e=d.duration,h=d.animated;if(!l[h]){l[h]=function(n){this.slide(n,{easing:h,duration:e||700})}}l[h](f)}else{if(d.collapsible&&j){b.toggle()}else{i.hide();b.show()}c(true)}i.prev().attr("aria-expanded","false").attr("tabIndex","-1").blur();b.prev().attr("aria-expanded","true").attr("tabIndex","0").focus()},_completed:function(b){var c=this.options;this.running=b?0:--this.running;if(this.running){return}if(c.clearStyle){this.toShow.add(this.toHide).css({height:"",overflow:""})}this._trigger("change",null,this.data)}});a.extend(a.ui.accordion,{version:"1.7.2",defaults:{active:null,alwaysOpen:true,animated:"slide",autoHeight:true,clearStyle:false,collapsible:false,event:"click",fillSpace:false,header:"> li > :first-child,> :not(li):even",icons:{header:"ui-icon-triangle-1-e",headerSelected:"ui-icon-triangle-1-s"},navigation:false,navigationFilter:function(){return this.href.toLowerCase()==location.href.toLowerCase()}},animations:{slide:function(j,h){j=a.extend({easing:"swing",duration:300},j,h);if(!j.toHide.size()){j.toShow.animate({height:"show"},j);return}if(!j.toShow.size()){j.toHide.animate({height:"hide"},j);return}var c=j.toShow.css("overflow"),g,d={},f={},e=["height","paddingTop","paddingBottom"],b;var i=j.toShow;b=i[0].style.width;i.width(parseInt(i.parent().width(),10)-parseInt(i.css("paddingLeft"),10)-parseInt(i.css("paddingRight"),10)-(parseInt(i.css("borderLeftWidth"),10)||0)-(parseInt(i.css("borderRightWidth"),10)||0));a.each(e,function(k,m){f[m]="hide";var l=(""+a.css(j.toShow[0],m)).match(/^([\d+-.]+)(.*)$/);d[m]={value:l[1],unit:l[2]||"px"}});j.toShow.css({height:0,overflow:"hidden"}).show();j.toHide.filter(":hidden").each(j.complete).end().filter(":visible").animate(f,{step:function(k,l){if(l.prop=="height"){g=(l.now-l.start)/(l.end-l.start)}j.toShow[0].style[l.prop]=(g*d[l.prop].value)+d[l.prop].unit},duration:j.duration,easing:j.easing,complete:function(){if(!j.autoHeight){j.toShow.css("height","")}j.toShow.css("width",b);j.toShow.css({overflow:c});j.complete()}})},bounceslide:function(b){this.slide(b,{easing:b.down?"easeOutBounce":"swing",duration:b.down?1000:200})},easeslide:function(b){this.slide(b,{easing:"easeinout",duration:700})}}})})(jQuery);;/*
 * jQuery UI Dialog 1.7.2
 *
 * Copyright (c) 2009 AUTHORS.txt (http://jqueryui.com/about)
 * Dual licensed under the MIT (MIT-LICENSE.txt)
 * and GPL (GPL-LICENSE.txt) licenses.
 *
 * http://docs.jquery.com/UI/Dialog
 *
 * Depends:
 *	ui.core.js
 *	ui.draggable.js
 *	ui.resizable.js
 */
(function(c){var b={dragStart:"start.draggable",drag:"drag.draggable",dragStop:"stop.draggable",maxHeight:"maxHeight.resizable",minHeight:"minHeight.resizable",maxWidth:"maxWidth.resizable",minWidth:"minWidth.resizable",resizeStart:"start.resizable",resize:"drag.resizable",resizeStop:"stop.resizable"},a="ui-dialog ui-widget ui-widget-content ui-corner-all ";c.widget("ui.dialog",{_init:function(){this.originalTitle=this.element.attr("title");var l=this,m=this.options,j=m.title||this.originalTitle||"&nbsp;",e=c.ui.dialog.getTitleId(this.element),k=(this.uiDialog=c("<div/>")).appendTo(document.body).hide().addClass(a+m.dialogClass).css({position:"absolute",overflow:"hidden",zIndex:m.zIndex}).attr("tabIndex",-1).css("outline",0).keydown(function(n){(m.closeOnEscape&&n.keyCode&&n.keyCode==c.ui.keyCode.ESCAPE&&l.close(n))}).attr({role:"dialog","aria-labelledby":e}).mousedown(function(n){l.moveToTop(false,n)}),g=this.element.show().removeAttr("title").addClass("ui-dialog-content ui-widget-content").appendTo(k),f=(this.uiDialogTitlebar=c("<div></div>")).addClass("ui-dialog-titlebar ui-widget-header ui-corner-all ui-helper-clearfix").prependTo(k),i=c('<a href="#"/>').addClass("ui-dialog-titlebar-close ui-corner-all").attr("role","button").hover(function(){i.addClass("ui-state-hover")},function(){i.removeClass("ui-state-hover")}).focus(function(){i.addClass("ui-state-focus")}).blur(function(){i.removeClass("ui-state-focus")}).mousedown(function(n){n.stopPropagation()}).click(function(n){l.close(n);return false}).appendTo(f),h=(this.uiDialogTitlebarCloseText=c("<span/>")).addClass("ui-icon ui-icon-closethick").text(m.closeText).appendTo(i),d=c("<span/>").addClass("ui-dialog-title").attr("id",e).html(j).prependTo(f);f.find("*").add(f).disableSelection();(m.draggable&&c.fn.draggable&&this._makeDraggable());(m.resizable&&c.fn.resizable&&this._makeResizable());this._createButtons(m.buttons);this._isOpen=false;(m.bgiframe&&c.fn.bgiframe&&k.bgiframe());(m.autoOpen&&this.open())},destroy:function(){(this.overlay&&this.overlay.destroy());this.uiDialog.hide();this.element.unbind(".dialog").removeData("dialog").removeClass("ui-dialog-content ui-widget-content").hide().appendTo("body");this.uiDialog.remove();(this.originalTitle&&this.element.attr("title",this.originalTitle))},close:function(f){var d=this;if(false===d._trigger("beforeclose",f)){return}(d.overlay&&d.overlay.destroy());d.uiDialog.unbind("keypress.ui-dialog");(d.options.hide?d.uiDialog.hide(d.options.hide,function(){d._trigger("close",f)}):d.uiDialog.hide()&&d._trigger("close",f));c.ui.dialog.overlay.resize();d._isOpen=false;if(d.options.modal){var e=0;c(".ui-dialog").each(function(){if(this!=d.uiDialog[0]){e=Math.max(e,c(this).css("z-index"))}});c.ui.dialog.maxZ=e}},isOpen:function(){return this._isOpen},moveToTop:function(f,e){if((this.options.modal&&!f)||(!this.options.stack&&!this.options.modal)){return this._trigger("focus",e)}if(this.options.zIndex>c.ui.dialog.maxZ){c.ui.dialog.maxZ=this.options.zIndex}(this.overlay&&this.overlay.$el.css("z-index",c.ui.dialog.overlay.maxZ=++c.ui.dialog.maxZ));var d={scrollTop:this.element.attr("scrollTop"),scrollLeft:this.element.attr("scrollLeft")};this.uiDialog.css("z-index",++c.ui.dialog.maxZ);this.element.attr(d);this._trigger("focus",e)},open:function(){if(this._isOpen){return}var e=this.options,d=this.uiDialog;this.overlay=e.modal?new c.ui.dialog.overlay(this):null;(d.next().length&&d.appendTo("body"));this._size();this._position(e.position);d.show(e.show);this.moveToTop(true);(e.modal&&d.bind("keypress.ui-dialog",function(h){if(h.keyCode!=c.ui.keyCode.TAB){return}var g=c(":tabbable",this),i=g.filter(":first")[0],f=g.filter(":last")[0];if(h.target==f&&!h.shiftKey){setTimeout(function(){i.focus()},1)}else{if(h.target==i&&h.shiftKey){setTimeout(function(){f.focus()},1)}}}));c([]).add(d.find(".ui-dialog-content :tabbable:first")).add(d.find(".ui-dialog-buttonpane :tabbable:first")).add(d).filter(":first").focus();this._trigger("open");this._isOpen=true},_createButtons:function(g){var f=this,d=false,e=c("<div></div>").addClass("ui-dialog-buttonpane ui-widget-content ui-helper-clearfix");this.uiDialog.find(".ui-dialog-buttonpane").remove();(typeof g=="object"&&g!==null&&c.each(g,function(){return !(d=true)}));if(d){c.each(g,function(h,i){c('<button type="button"></button>').addClass("ui-state-default ui-corner-all").text(h).click(function(){i.apply(f.element[0],arguments)}).hover(function(){c(this).addClass("ui-state-hover")},function(){c(this).removeClass("ui-state-hover")}).focus(function(){c(this).addClass("ui-state-focus")}).blur(function(){c(this).removeClass("ui-state-focus")}).appendTo(e)});e.appendTo(this.uiDialog)}},_makeDraggable:function(){var d=this,f=this.options,e;this.uiDialog.draggable({cancel:".ui-dialog-content",handle:".ui-dialog-titlebar",containment:"document",start:function(){e=f.height;c(this).height(c(this).height()).addClass("ui-dialog-dragging");(f.dragStart&&f.dragStart.apply(d.element[0],arguments))},drag:function(){(f.drag&&f.drag.apply(d.element[0],arguments))},stop:function(){c(this).removeClass("ui-dialog-dragging").height(e);(f.dragStop&&f.dragStop.apply(d.element[0],arguments));c.ui.dialog.overlay.resize()}})},_makeResizable:function(g){g=(g===undefined?this.options.resizable:g);var d=this,f=this.options,e=typeof g=="string"?g:"n,e,s,w,se,sw,ne,nw";this.uiDialog.resizable({cancel:".ui-dialog-content",alsoResize:this.element,maxWidth:f.maxWidth,maxHeight:f.maxHeight,minWidth:f.minWidth,minHeight:f.minHeight,start:function(){c(this).addClass("ui-dialog-resizing");(f.resizeStart&&f.resizeStart.apply(d.element[0],arguments))},resize:function(){(f.resize&&f.resize.apply(d.element[0],arguments))},handles:e,stop:function(){c(this).removeClass("ui-dialog-resizing");f.height=c(this).height();f.width=c(this).width();(f.resizeStop&&f.resizeStop.apply(d.element[0],arguments));c.ui.dialog.overlay.resize()}}).find(".ui-resizable-se").addClass("ui-icon ui-icon-grip-diagonal-se")},_position:function(i){var e=c(window),f=c(document),g=f.scrollTop(),d=f.scrollLeft(),h=g;if(c.inArray(i,["center","top","right","bottom","left"])>=0){i=[i=="right"||i=="left"?i:"center",i=="top"||i=="bottom"?i:"middle"]}if(i.constructor!=Array){i=["center","middle"]}if(i[0].constructor==Number){d+=i[0]}else{switch(i[0]){case"left":d+=0;break;case"right":d+=e.width()-this.uiDialog.outerWidth();break;default:case"center":d+=(e.width()-this.uiDialog.outerWidth())/2}}if(i[1].constructor==Number){g+=i[1]}else{switch(i[1]){case"top":g+=0;break;case"bottom":g+=e.height()-this.uiDialog.outerHeight();break;default:case"middle":g+=(e.height()-this.uiDialog.outerHeight())/2}}g=Math.max(g,h);this.uiDialog.css({top:g,left:d})},_setData:function(e,f){(b[e]&&this.uiDialog.data(b[e],f));switch(e){case"buttons":this._createButtons(f);break;case"closeText":this.uiDialogTitlebarCloseText.text(f);break;case"dialogClass":this.uiDialog.removeClass(this.options.dialogClass).addClass(a+f);break;case"draggable":(f?this._makeDraggable():this.uiDialog.draggable("destroy"));break;case"height":this.uiDialog.height(f);break;case"position":this._position(f);break;case"resizable":var d=this.uiDialog,g=this.uiDialog.is(":data(resizable)");(g&&!f&&d.resizable("destroy"));(g&&typeof f=="string"&&d.resizable("option","handles",f));(g||this._makeResizable(f));break;case"title":c(".ui-dialog-title",this.uiDialogTitlebar).html(f||"&nbsp;");break;case"width":this.uiDialog.width(f);break}c.widget.prototype._setData.apply(this,arguments)},_size:function(){var e=this.options;this.element.css({height:0,minHeight:0,width:"auto"});var d=this.uiDialog.css({height:"auto",width:e.width}).height();this.element.css({minHeight:Math.max(e.minHeight-d,0),height:e.height=="auto"?"auto":Math.max(e.height-d,0)})}});c.extend(c.ui.dialog,{version:"1.7.2",defaults:{autoOpen:true,bgiframe:false,buttons:{},closeOnEscape:true,closeText:"close",dialogClass:"",draggable:true,hide:null,height:"auto",maxHeight:false,maxWidth:false,minHeight:150,minWidth:150,modal:false,position:"center",resizable:true,show:null,stack:true,title:"",width:300,zIndex:1000},getter:"isOpen",uuid:0,maxZ:0,getTitleId:function(d){return"ui-dialog-title-"+(d.attr("id")||++this.uuid)},overlay:function(d){this.$el=c.ui.dialog.overlay.create(d)}});c.extend(c.ui.dialog.overlay,{instances:[],maxZ:0,events:c.map("focus,mousedown,mouseup,keydown,keypress,click".split(","),function(d){return d+".dialog-overlay"}).join(" "),create:function(e){if(this.instances.length===0){setTimeout(function(){if(c.ui.dialog.overlay.instances.length){c(document).bind(c.ui.dialog.overlay.events,function(f){var g=c(f.target).parents(".ui-dialog").css("zIndex")||0;return(g>c.ui.dialog.overlay.maxZ)})}},1);c(document).bind("keydown.dialog-overlay",function(f){(e.options.closeOnEscape&&f.keyCode&&f.keyCode==c.ui.keyCode.ESCAPE&&e.close(f))});c(window).bind("resize.dialog-overlay",c.ui.dialog.overlay.resize)}var d=c("<div></div>").appendTo(document.body).addClass("ui-widget-overlay").css({width:this.width(),height:this.height()});(e.options.bgiframe&&c.fn.bgiframe&&d.bgiframe());this.instances.push(d);return d},destroy:function(d){this.instances.splice(c.inArray(this.instances,d),1);if(this.instances.length===0){c([document,window]).unbind(".dialog-overlay")}d.remove();var e=0;c.each(this.instances,function(){e=Math.max(e,this.css("z-index"))});this.maxZ=e},height:function(){if(c.browser.msie&&c.browser.version<7){var e=Math.max(document.documentElement.scrollHeight,document.body.scrollHeight);var d=Math.max(document.documentElement.offsetHeight,document.body.offsetHeight);if(e<d){return c(window).height()+"px"}else{return e+"px"}}else{return c(document).height()+"px"}},width:function(){if(c.browser.msie&&c.browser.version<7){var d=Math.max(document.documentElement.scrollWidth,document.body.scrollWidth);var e=Math.max(document.documentElement.offsetWidth,document.body.offsetWidth);if(d<e){return c(window).width()+"px"}else{return d+"px"}}else{return c(document).width()+"px"}},resize:function(){var d=c([]);c.each(c.ui.dialog.overlay.instances,function(){d=d.add(this)});d.css({width:0,height:0}).css({width:c.ui.dialog.overlay.width(),height:c.ui.dialog.overlay.height()})}});c.extend(c.ui.dialog.overlay.prototype,{destroy:function(){c.ui.dialog.overlay.destroy(this.$el)}})})(jQuery);;/*
 * jQuery UI Slider 1.7.2
 *
 * Copyright (c) 2009 AUTHORS.txt (http://jqueryui.com/about)
 * Dual licensed under the MIT (MIT-LICENSE.txt)
 * and GPL (GPL-LICENSE.txt) licenses.
 *
 * http://docs.jquery.com/UI/Slider
 *
 * Depends:
 *	ui.core.js
 */
(function(a){a.widget("ui.slider",a.extend({},a.ui.mouse,{_init:function(){var b=this,c=this.options;this._keySliding=false;this._handleIndex=null;this._detectOrientation();this._mouseInit();this.element.addClass("ui-slider ui-slider-"+this.orientation+" ui-widget ui-widget-content ui-corner-all");this.range=a([]);if(c.range){if(c.range===true){this.range=a("<div></div>");if(!c.values){c.values=[this._valueMin(),this._valueMin()]}if(c.values.length&&c.values.length!=2){c.values=[c.values[0],c.values[0]]}}else{this.range=a("<div></div>")}this.range.appendTo(this.element).addClass("ui-slider-range");if(c.range=="min"||c.range=="max"){this.range.addClass("ui-slider-range-"+c.range)}this.range.addClass("ui-widget-header")}if(a(".ui-slider-handle",this.element).length==0){a('<a href="#"></a>').appendTo(this.element).addClass("ui-slider-handle")}if(c.values&&c.values.length){while(a(".ui-slider-handle",this.element).length<c.values.length){a('<a href="#"></a>').appendTo(this.element).addClass("ui-slider-handle")}}this.handles=a(".ui-slider-handle",this.element).addClass("ui-state-default ui-corner-all");this.handle=this.handles.eq(0);this.handles.add(this.range).filter("a").click(function(d){d.preventDefault()}).hover(function(){if(!c.disabled){a(this).addClass("ui-state-hover")}},function(){a(this).removeClass("ui-state-hover")}).focus(function(){if(!c.disabled){a(".ui-slider .ui-state-focus").removeClass("ui-state-focus");a(this).addClass("ui-state-focus")}else{a(this).blur()}}).blur(function(){a(this).removeClass("ui-state-focus")});this.handles.each(function(d){a(this).data("index.ui-slider-handle",d)});this.handles.keydown(function(i){var f=true;var e=a(this).data("index.ui-slider-handle");if(b.options.disabled){return}switch(i.keyCode){case a.ui.keyCode.HOME:case a.ui.keyCode.END:case a.ui.keyCode.UP:case a.ui.keyCode.RIGHT:case a.ui.keyCode.DOWN:case a.ui.keyCode.LEFT:f=false;if(!b._keySliding){b._keySliding=true;a(this).addClass("ui-state-active");b._start(i,e)}break}var g,d,h=b._step();if(b.options.values&&b.options.values.length){g=d=b.values(e)}else{g=d=b.value()}switch(i.keyCode){case a.ui.keyCode.HOME:d=b._valueMin();break;case a.ui.keyCode.END:d=b._valueMax();break;case a.ui.keyCode.UP:case a.ui.keyCode.RIGHT:if(g==b._valueMax()){return}d=g+h;break;case a.ui.keyCode.DOWN:case a.ui.keyCode.LEFT:if(g==b._valueMin()){return}d=g-h;break}b._slide(i,e,d);return f}).keyup(function(e){var d=a(this).data("index.ui-slider-handle");if(b._keySliding){b._stop(e,d);b._change(e,d);b._keySliding=false;a(this).removeClass("ui-state-active")}});this._refreshValue()},destroy:function(){this.handles.remove();this.range.remove();this.element.removeClass("ui-slider ui-slider-horizontal ui-slider-vertical ui-slider-disabled ui-widget ui-widget-content ui-corner-all").removeData("slider").unbind(".slider");this._mouseDestroy()},_mouseCapture:function(d){var e=this.options;if(e.disabled){return false}this.elementSize={width:this.element.outerWidth(),height:this.element.outerHeight()};this.elementOffset=this.element.offset();var h={x:d.pageX,y:d.pageY};var j=this._normValueFromMouse(h);var c=this._valueMax()-this._valueMin()+1,f;var k=this,i;this.handles.each(function(l){var m=Math.abs(j-k.values(l));if(c>m){c=m;f=a(this);i=l}});if(e.range==true&&this.values(1)==e.min){f=a(this.handles[++i])}this._start(d,i);k._handleIndex=i;f.addClass("ui-state-active").focus();var g=f.offset();var b=!a(d.target).parents().andSelf().is(".ui-slider-handle");this._clickOffset=b?{left:0,top:0}:{left:d.pageX-g.left-(f.width()/2),top:d.pageY-g.top-(f.height()/2)-(parseInt(f.css("borderTopWidth"),10)||0)-(parseInt(f.css("borderBottomWidth"),10)||0)+(parseInt(f.css("marginTop"),10)||0)};j=this._normValueFromMouse(h);this._slide(d,i,j);return true},_mouseStart:function(b){return true},_mouseDrag:function(d){var b={x:d.pageX,y:d.pageY};var c=this._normValueFromMouse(b);this._slide(d,this._handleIndex,c);return false},_mouseStop:function(b){this.handles.removeClass("ui-state-active");this._stop(b,this._handleIndex);this._change(b,this._handleIndex);this._handleIndex=null;this._clickOffset=null;return false},_detectOrientation:function(){this.orientation=this.options.orientation=="vertical"?"vertical":"horizontal"},_normValueFromMouse:function(d){var c,h;if("horizontal"==this.orientation){c=this.elementSize.width;h=d.x-this.elementOffset.left-(this._clickOffset?this._clickOffset.left:0)}else{c=this.elementSize.height;h=d.y-this.elementOffset.top-(this._clickOffset?this._clickOffset.top:0)}var f=(h/c);if(f>1){f=1}if(f<0){f=0}if("vertical"==this.orientation){f=1-f}var e=this._valueMax()-this._valueMin(),i=f*e,b=i%this.options.step,g=this._valueMin()+i-b;if(b>(this.options.step/2)){g+=this.options.step}return parseFloat(g.toFixed(5))},_start:function(d,c){var b={handle:this.handles[c],value:this.value()};if(this.options.values&&this.options.values.length){b.value=this.values(c);b.values=this.values()}this._trigger("start",d,b)},_slide:function(f,e,d){var g=this.handles[e];if(this.options.values&&this.options.values.length){var b=this.values(e?0:1);if((this.options.values.length==2&&this.options.range===true)&&((e==0&&d>b)||(e==1&&d<b))){d=b}if(d!=this.values(e)){var c=this.values();c[e]=d;var h=this._trigger("slide",f,{handle:this.handles[e],value:d,values:c});var b=this.values(e?0:1);if(h!==false){this.values(e,d,(f.type=="mousedown"&&this.options.animate),true)}}}else{if(d!=this.value()){var h=this._trigger("slide",f,{handle:this.handles[e],value:d});if(h!==false){this._setData("value",d,(f.type=="mousedown"&&this.options.animate))}}}},_stop:function(d,c){var b={handle:this.handles[c],value:this.value()};if(this.options.values&&this.options.values.length){b.value=this.values(c);b.values=this.values()}this._trigger("stop",d,b)},_change:function(d,c){var b={handle:this.handles[c],value:this.value()};if(this.options.values&&this.options.values.length){b.value=this.values(c);b.values=this.values()}this._trigger("change",d,b)},value:function(b){if(arguments.length){this._setData("value",b);this._change(null,0)}return this._value()},values:function(b,e,c,d){if(arguments.length>1){this.options.values[b]=e;this._refreshValue(c);if(!d){this._change(null,b)}}if(arguments.length){if(this.options.values&&this.options.values.length){return this._values(b)}else{return this.value()}}else{return this._values()}},_setData:function(b,d,c){a.widget.prototype._setData.apply(this,arguments);switch(b){case"disabled":if(d){this.handles.filter(".ui-state-focus").blur();this.handles.removeClass("ui-state-hover");this.handles.attr("disabled","disabled")}else{this.handles.removeAttr("disabled")}case"orientation":this._detectOrientation();this.element.removeClass("ui-slider-horizontal ui-slider-vertical").addClass("ui-slider-"+this.orientation);this._refreshValue(c);break;case"value":this._refreshValue(c);break}},_step:function(){var b=this.options.step;return b},_value:function(){var b=this.options.value;if(b<this._valueMin()){b=this._valueMin()}if(b>this._valueMax()){b=this._valueMax()}return b},_values:function(b){if(arguments.length){var c=this.options.values[b];if(c<this._valueMin()){c=this._valueMin()}if(c>this._valueMax()){c=this._valueMax()}return c}else{return this.options.values}},_valueMin:function(){var b=this.options.min;return b},_valueMax:function(){var b=this.options.max;return b},_refreshValue:function(c){var f=this.options.range,d=this.options,l=this;if(this.options.values&&this.options.values.length){var i,h;this.handles.each(function(p,n){var o=(l.values(p)-l._valueMin())/(l._valueMax()-l._valueMin())*100;var m={};m[l.orientation=="horizontal"?"left":"bottom"]=o+"%";a(this).stop(1,1)[c?"animate":"css"](m,d.animate);if(l.options.range===true){if(l.orientation=="horizontal"){(p==0)&&l.range.stop(1,1)[c?"animate":"css"]({left:o+"%"},d.animate);(p==1)&&l.range[c?"animate":"css"]({width:(o-lastValPercent)+"%"},{queue:false,duration:d.animate})}else{(p==0)&&l.range.stop(1,1)[c?"animate":"css"]({bottom:(o)+"%"},d.animate);(p==1)&&l.range[c?"animate":"css"]({height:(o-lastValPercent)+"%"},{queue:false,duration:d.animate})}}lastValPercent=o})}else{var j=this.value(),g=this._valueMin(),k=this._valueMax(),e=k!=g?(j-g)/(k-g)*100:0;var b={};b[l.orientation=="horizontal"?"left":"bottom"]=e+"%";this.handle.stop(1,1)[c?"animate":"css"](b,d.animate);(f=="min")&&(this.orientation=="horizontal")&&this.range.stop(1,1)[c?"animate":"css"]({width:e+"%"},d.animate);(f=="max")&&(this.orientation=="horizontal")&&this.range[c?"animate":"css"]({width:(100-e)+"%"},{queue:false,duration:d.animate});(f=="min")&&(this.orientation=="vertical")&&this.range.stop(1,1)[c?"animate":"css"]({height:e+"%"},d.animate);(f=="max")&&(this.orientation=="vertical")&&this.range[c?"animate":"css"]({height:(100-e)+"%"},{queue:false,duration:d.animate})}}}));a.extend(a.ui.slider,{getter:"value values",version:"1.7.2",eventPrefix:"slide",defaults:{animate:false,delay:0,distance:0,max:100,min:0,orientation:"horizontal",range:false,step:1,value:0,values:null}})})(jQuery);;/*
 * jQuery UI Tabs 1.7.2
 *
 * Copyright (c) 2009 AUTHORS.txt (http://jqueryui.com/about)
 * Dual licensed under the MIT (MIT-LICENSE.txt)
 * and GPL (GPL-LICENSE.txt) licenses.
 *
 * http://docs.jquery.com/UI/Tabs
 *
 * Depends:
 *	ui.core.js
 */
(function(a){a.widget("ui.tabs",{_init:function(){if(this.options.deselectable!==undefined){this.options.collapsible=this.options.deselectable}this._tabify(true)},_setData:function(b,c){if(b=="selected"){if(this.options.collapsible&&c==this.options.selected){return}this.select(c)}else{this.options[b]=c;if(b=="deselectable"){this.options.collapsible=c}this._tabify()}},_tabId:function(b){return b.title&&b.title.replace(/\s/g,"_").replace(/[^A-Za-z0-9\-_:\.]/g,"")||this.options.idPrefix+a.data(b)},_sanitizeSelector:function(b){return b.replace(/:/g,"\\:")},_cookie:function(){var b=this.cookie||(this.cookie=this.options.cookie.name||"ui-tabs-"+a.data(this.list[0]));return a.cookie.apply(null,[b].concat(a.makeArray(arguments)))},_ui:function(c,b){return{tab:c,panel:b,index:this.anchors.index(c)}},_cleanup:function(){this.lis.filter(".ui-state-processing").removeClass("ui-state-processing").find("span:data(label.tabs)").each(function(){var b=a(this);b.html(b.data("label.tabs")).removeData("label.tabs")})},_tabify:function(n){this.list=this.element.children("ul:first");this.lis=a("li:has(a[href])",this.list);this.anchors=this.lis.map(function(){return a("a",this)[0]});this.panels=a([]);var p=this,d=this.options;var c=/^#.+/;this.anchors.each(function(r,o){var q=a(o).attr("href");var s=q.split("#")[0],u;if(s&&(s===location.toString().split("#")[0]||(u=a("base")[0])&&s===u.href)){q=o.hash;o.href=q}if(c.test(q)){p.panels=p.panels.add(p._sanitizeSelector(q))}else{if(q!="#"){a.data(o,"href.tabs",q);a.data(o,"load.tabs",q.replace(/#.*$/,""));var w=p._tabId(o);o.href="#"+w;var v=a("#"+w);if(!v.length){v=a(d.panelTemplate).attr("id",w).addClass("ui-tabs-panel ui-widget-content ui-corner-bottom").insertAfter(p.panels[r-1]||p.list);v.data("destroy.tabs",true)}p.panels=p.panels.add(v)}else{d.disabled.push(r)}}});if(n){this.element.addClass("ui-tabs ui-widget ui-widget-content ui-corner-all");this.list.addClass("ui-tabs-nav ui-helper-reset ui-helper-clearfix ui-widget-header ui-corner-all");this.lis.addClass("ui-state-default ui-corner-top");this.panels.addClass("ui-tabs-panel ui-widget-content ui-corner-bottom");if(d.selected===undefined){if(location.hash){this.anchors.each(function(q,o){if(o.hash==location.hash){d.selected=q;return false}})}if(typeof d.selected!="number"&&d.cookie){d.selected=parseInt(p._cookie(),10)}if(typeof d.selected!="number"&&this.lis.filter(".ui-tabs-selected").length){d.selected=this.lis.index(this.lis.filter(".ui-tabs-selected"))}d.selected=d.selected||0}else{if(d.selected===null){d.selected=-1}}d.selected=((d.selected>=0&&this.anchors[d.selected])||d.selected<0)?d.selected:0;d.disabled=a.unique(d.disabled.concat(a.map(this.lis.filter(".ui-state-disabled"),function(q,o){return p.lis.index(q)}))).sort();if(a.inArray(d.selected,d.disabled)!=-1){d.disabled.splice(a.inArray(d.selected,d.disabled),1)}this.panels.addClass("ui-tabs-hide");this.lis.removeClass("ui-tabs-selected ui-state-active");if(d.selected>=0&&this.anchors.length){this.panels.eq(d.selected).removeClass("ui-tabs-hide");this.lis.eq(d.selected).addClass("ui-tabs-selected ui-state-active");p.element.queue("tabs",function(){p._trigger("show",null,p._ui(p.anchors[d.selected],p.panels[d.selected]))});this.load(d.selected)}a(window).bind("unload",function(){p.lis.add(p.anchors).unbind(".tabs");p.lis=p.anchors=p.panels=null})}else{d.selected=this.lis.index(this.lis.filter(".ui-tabs-selected"))}this.element[d.collapsible?"addClass":"removeClass"]("ui-tabs-collapsible");if(d.cookie){this._cookie(d.selected,d.cookie)}for(var g=0,m;(m=this.lis[g]);g++){a(m)[a.inArray(g,d.disabled)!=-1&&!a(m).hasClass("ui-tabs-selected")?"addClass":"removeClass"]("ui-state-disabled")}if(d.cache===false){this.anchors.removeData("cache.tabs")}this.lis.add(this.anchors).unbind(".tabs");if(d.event!="mouseover"){var f=function(o,i){if(i.is(":not(.ui-state-disabled)")){i.addClass("ui-state-"+o)}};var j=function(o,i){i.removeClass("ui-state-"+o)};this.lis.bind("mouseover.tabs",function(){f("hover",a(this))});this.lis.bind("mouseout.tabs",function(){j("hover",a(this))});this.anchors.bind("focus.tabs",function(){f("focus",a(this).closest("li"))});this.anchors.bind("blur.tabs",function(){j("focus",a(this).closest("li"))})}var b,h;if(d.fx){if(a.isArray(d.fx)){b=d.fx[0];h=d.fx[1]}else{b=h=d.fx}}function e(i,o){i.css({display:""});if(a.browser.msie&&o.opacity){i[0].style.removeAttribute("filter")}}var k=h?function(i,o){a(i).closest("li").removeClass("ui-state-default").addClass("ui-tabs-selected ui-state-active");o.hide().removeClass("ui-tabs-hide").animate(h,h.duration||"normal",function(){e(o,h);p._trigger("show",null,p._ui(i,o[0]))})}:function(i,o){a(i).closest("li").removeClass("ui-state-default").addClass("ui-tabs-selected ui-state-active");o.removeClass("ui-tabs-hide");p._trigger("show",null,p._ui(i,o[0]))};var l=b?function(o,i){i.animate(b,b.duration||"normal",function(){p.lis.removeClass("ui-tabs-selected ui-state-active").addClass("ui-state-default");i.addClass("ui-tabs-hide");e(i,b);p.element.dequeue("tabs")})}:function(o,i,q){p.lis.removeClass("ui-tabs-selected ui-state-active").addClass("ui-state-default");i.addClass("ui-tabs-hide");p.element.dequeue("tabs")};this.anchors.bind(d.event+".tabs",function(){var o=this,r=a(this).closest("li"),i=p.panels.filter(":not(.ui-tabs-hide)"),q=a(p._sanitizeSelector(this.hash));if((r.hasClass("ui-tabs-selected")&&!d.collapsible)||r.hasClass("ui-state-disabled")||r.hasClass("ui-state-processing")||p._trigger("select",null,p._ui(this,q[0]))===false){this.blur();return false}d.selected=p.anchors.index(this);p.abort();if(d.collapsible){if(r.hasClass("ui-tabs-selected")){d.selected=-1;if(d.cookie){p._cookie(d.selected,d.cookie)}p.element.queue("tabs",function(){l(o,i)}).dequeue("tabs");this.blur();return false}else{if(!i.length){if(d.cookie){p._cookie(d.selected,d.cookie)}p.element.queue("tabs",function(){k(o,q)});p.load(p.anchors.index(this));this.blur();return false}}}if(d.cookie){p._cookie(d.selected,d.cookie)}if(q.length){if(i.length){p.element.queue("tabs",function(){l(o,i)})}p.element.queue("tabs",function(){k(o,q)});p.load(p.anchors.index(this))}else{throw"jQuery UI Tabs: Mismatching fragment identifier."}if(a.browser.msie){this.blur()}});this.anchors.bind("click.tabs",function(){return false})},destroy:function(){var b=this.options;this.abort();this.element.unbind(".tabs").removeClass("ui-tabs ui-widget ui-widget-content ui-corner-all ui-tabs-collapsible").removeData("tabs");this.list.removeClass("ui-tabs-nav ui-helper-reset ui-helper-clearfix ui-widget-header ui-corner-all");this.anchors.each(function(){var c=a.data(this,"href.tabs");if(c){this.href=c}var d=a(this).unbind(".tabs");a.each(["href","load","cache"],function(e,f){d.removeData(f+".tabs")})});this.lis.unbind(".tabs").add(this.panels).each(function(){if(a.data(this,"destroy.tabs")){a(this).remove()}else{a(this).removeClass(["ui-state-default","ui-corner-top","ui-tabs-selected","ui-state-active","ui-state-hover","ui-state-focus","ui-state-disabled","ui-tabs-panel","ui-widget-content","ui-corner-bottom","ui-tabs-hide"].join(" "))}});if(b.cookie){this._cookie(null,b.cookie)}},add:function(e,d,c){if(c===undefined){c=this.anchors.length}var b=this,g=this.options,i=a(g.tabTemplate.replace(/#\{href\}/g,e).replace(/#\{label\}/g,d)),h=!e.indexOf("#")?e.replace("#",""):this._tabId(a("a",i)[0]);i.addClass("ui-state-default ui-corner-top").data("destroy.tabs",true);var f=a("#"+h);if(!f.length){f=a(g.panelTemplate).attr("id",h).data("destroy.tabs",true)}f.addClass("ui-tabs-panel ui-widget-content ui-corner-bottom ui-tabs-hide");if(c>=this.lis.length){i.appendTo(this.list);f.appendTo(this.list[0].parentNode)}else{i.insertBefore(this.lis[c]);f.insertBefore(this.panels[c])}g.disabled=a.map(g.disabled,function(k,j){return k>=c?++k:k});this._tabify();if(this.anchors.length==1){i.addClass("ui-tabs-selected ui-state-active");f.removeClass("ui-tabs-hide");this.element.queue("tabs",function(){b._trigger("show",null,b._ui(b.anchors[0],b.panels[0]))});this.load(0)}this._trigger("add",null,this._ui(this.anchors[c],this.panels[c]))},remove:function(b){var d=this.options,e=this.lis.eq(b).remove(),c=this.panels.eq(b).remove();if(e.hasClass("ui-tabs-selected")&&this.anchors.length>1){this.select(b+(b+1<this.anchors.length?1:-1))}d.disabled=a.map(a.grep(d.disabled,function(g,f){return g!=b}),function(g,f){return g>=b?--g:g});this._tabify();this._trigger("remove",null,this._ui(e.find("a")[0],c[0]))},enable:function(b){var c=this.options;if(a.inArray(b,c.disabled)==-1){return}this.lis.eq(b).removeClass("ui-state-disabled");c.disabled=a.grep(c.disabled,function(e,d){return e!=b});this._trigger("enable",null,this._ui(this.anchors[b],this.panels[b]))},disable:function(c){var b=this,d=this.options;if(c!=d.selected){this.lis.eq(c).addClass("ui-state-disabled");d.disabled.push(c);d.disabled.sort();this._trigger("disable",null,this._ui(this.anchors[c],this.panels[c]))}},select:function(b){if(typeof b=="string"){b=this.anchors.index(this.anchors.filter("[href$="+b+"]"))}else{if(b===null){b=-1}}if(b==-1&&this.options.collapsible){b=this.options.selected}this.anchors.eq(b).trigger(this.options.event+".tabs")},load:function(e){var c=this,g=this.options,b=this.anchors.eq(e)[0],d=a.data(b,"load.tabs");this.abort();if(!d||this.element.queue("tabs").length!==0&&a.data(b,"cache.tabs")){this.element.dequeue("tabs");return}this.lis.eq(e).addClass("ui-state-processing");if(g.spinner){var f=a("span",b);f.data("label.tabs",f.html()).html(g.spinner)}this.xhr=a.ajax(a.extend({},g.ajaxOptions,{url:d,success:function(i,h){a(c._sanitizeSelector(b.hash)).html(i);c._cleanup();if(g.cache){a.data(b,"cache.tabs",true)}c._trigger("load",null,c._ui(c.anchors[e],c.panels[e]));try{g.ajaxOptions.success(i,h)}catch(j){}c.element.dequeue("tabs")}}))},abort:function(){this.element.queue([]);this.panels.stop(false,true);if(this.xhr){this.xhr.abort();delete this.xhr}this._cleanup()},url:function(c,b){this.anchors.eq(c).removeData("cache.tabs").data("load.tabs",b)},length:function(){return this.anchors.length}});a.extend(a.ui.tabs,{version:"1.7.2",getter:"length",defaults:{ajaxOptions:null,cache:false,cookie:null,collapsible:false,disabled:[],event:"click",fx:null,idPrefix:"ui-tabs-",panelTemplate:"<div></div>",spinner:"<em>Loading&#8230;</em>",tabTemplate:'<li><a href="#{href}"><span>#{label}</span></a></li>'}});a.extend(a.ui.tabs.prototype,{rotation:null,rotate:function(d,f){var b=this,g=this.options;var c=b._rotate||(b._rotate=function(h){clearTimeout(b.rotation);b.rotation=setTimeout(function(){var i=g.selected;b.select(++i<b.anchors.length?i:0)},d);if(h){h.stopPropagation()}});var e=b._unrotate||(b._unrotate=!f?function(h){if(h.clientX){b.rotate(null)}}:function(h){t=g.selected;c()});if(d){this.element.bind("tabsshow",c);this.anchors.bind(g.event+".tabs",e);c()}else{clearTimeout(b.rotation);this.element.unbind("tabsshow",c);this.anchors.unbind(g.event+".tabs",e);delete this._rotate;delete this._unrotate}}})})(jQuery);;/*
 * jQuery UI Datepicker 1.7.2
 *
 * Copyright (c) 2009 AUTHORS.txt (http://jqueryui.com/about)
 * Dual licensed under the MIT (MIT-LICENSE.txt)
 * and GPL (GPL-LICENSE.txt) licenses.
 *
 * http://docs.jquery.com/UI/Datepicker
 *
 * Depends:
 *	ui.core.js
 */
(function($){$.extend($.ui,{datepicker:{version:"1.7.2"}});var PROP_NAME="datepicker";function Datepicker(){this.debug=false;this._curInst=null;this._keyEvent=false;this._disabledInputs=[];this._datepickerShowing=false;this._inDialog=false;this._mainDivId="ui-datepicker-div";this._inlineClass="ui-datepicker-inline";this._appendClass="ui-datepicker-append";this._triggerClass="ui-datepicker-trigger";this._dialogClass="ui-datepicker-dialog";this._disableClass="ui-datepicker-disabled";this._unselectableClass="ui-datepicker-unselectable";this._currentClass="ui-datepicker-current-day";this._dayOverClass="ui-datepicker-days-cell-over";this.regional=[];this.regional[""]={closeText:"Done",prevText:"Prev",nextText:"Next",currentText:"Today",monthNames:["January","February","March","April","May","June","July","August","September","October","November","December"],monthNamesShort:["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"],dayNames:["Sunday","Monday","Tuesday","Wednesday","Thursday","Friday","Saturday"],dayNamesShort:["Sun","Mon","Tue","Wed","Thu","Fri","Sat"],dayNamesMin:["Su","Mo","Tu","We","Th","Fr","Sa"],dateFormat:"mm/dd/yy",firstDay:0,isRTL:false};this._defaults={showOn:"focus",showAnim:"show",showOptions:{},defaultDate:null,appendText:"",buttonText:"...",buttonImage:"",buttonImageOnly:false,hideIfNoPrevNext:false,navigationAsDateFormat:false,gotoCurrent:false,changeMonth:false,changeYear:false,showMonthAfterYear:false,yearRange:"-10:+10",showOtherMonths:false,calculateWeek:this.iso8601Week,shortYearCutoff:"+10",minDate:null,maxDate:null,duration:"normal",beforeShowDay:null,beforeShow:null,onSelect:null,onChangeMonthYear:null,onClose:null,numberOfMonths:1,showCurrentAtPos:0,stepMonths:1,stepBigMonths:12,altField:"",altFormat:"",constrainInput:true,showButtonPanel:false};$.extend(this._defaults,this.regional[""]);this.dpDiv=$('<div id="'+this._mainDivId+'" class="ui-datepicker ui-widget ui-widget-content ui-helper-clearfix ui-corner-all ui-helper-hidden-accessible"></div>')}$.extend(Datepicker.prototype,{markerClassName:"hasDatepicker",log:function(){if(this.debug){console.log.apply("",arguments)}},setDefaults:function(settings){extendRemove(this._defaults,settings||{});return this},_attachDatepicker:function(target,settings){var inlineSettings=null;for(var attrName in this._defaults){var attrValue=target.getAttribute("date:"+attrName);if(attrValue){inlineSettings=inlineSettings||{};try{inlineSettings[attrName]=eval(attrValue)}catch(err){inlineSettings[attrName]=attrValue}}}var nodeName=target.nodeName.toLowerCase();var inline=(nodeName=="div"||nodeName=="span");if(!target.id){target.id="dp"+(++this.uuid)}var inst=this._newInst($(target),inline);inst.settings=$.extend({},settings||{},inlineSettings||{});if(nodeName=="input"){this._connectDatepicker(target,inst)}else{if(inline){this._inlineDatepicker(target,inst)}}},_newInst:function(target,inline){var id=target[0].id.replace(/([:\[\]\.])/g,"\\\\$1");return{id:id,input:target,selectedDay:0,selectedMonth:0,selectedYear:0,drawMonth:0,drawYear:0,inline:inline,dpDiv:(!inline?this.dpDiv:$('<div class="'+this._inlineClass+' ui-datepicker ui-widget ui-widget-content ui-helper-clearfix ui-corner-all"></div>'))}},_connectDatepicker:function(target,inst){var input=$(target);inst.append=$([]);inst.trigger=$([]);if(input.hasClass(this.markerClassName)){return}var appendText=this._get(inst,"appendText");var isRTL=this._get(inst,"isRTL");if(appendText){inst.append=$('<span class="'+this._appendClass+'">'+appendText+"</span>");input[isRTL?"before":"after"](inst.append)}var showOn=this._get(inst,"showOn");if(showOn=="focus"||showOn=="both"){input.focus(this._showDatepicker)}if(showOn=="button"||showOn=="both"){var buttonText=this._get(inst,"buttonText");var buttonImage=this._get(inst,"buttonImage");inst.trigger=$(this._get(inst,"buttonImageOnly")?$("<img/>").addClass(this._triggerClass).attr({src:buttonImage,alt:buttonText,title:buttonText}):$('<button type="button"></button>').addClass(this._triggerClass).html(buttonImage==""?buttonText:$("<img/>").attr({src:buttonImage,alt:buttonText,title:buttonText})));input[isRTL?"before":"after"](inst.trigger);inst.trigger.click(function(){if($.datepicker._datepickerShowing&&$.datepicker._lastInput==target){$.datepicker._hideDatepicker()}else{$.datepicker._showDatepicker(target)}return false})}input.addClass(this.markerClassName).keydown(this._doKeyDown).keypress(this._doKeyPress).bind("setData.datepicker",function(event,key,value){inst.settings[key]=value}).bind("getData.datepicker",function(event,key){return this._get(inst,key)});$.data(target,PROP_NAME,inst)},_inlineDatepicker:function(target,inst){var divSpan=$(target);if(divSpan.hasClass(this.markerClassName)){return}divSpan.addClass(this.markerClassName).append(inst.dpDiv).bind("setData.datepicker",function(event,key,value){inst.settings[key]=value}).bind("getData.datepicker",function(event,key){return this._get(inst,key)});$.data(target,PROP_NAME,inst);this._setDate(inst,this._getDefaultDate(inst));this._updateDatepicker(inst);this._updateAlternate(inst)},_dialogDatepicker:function(input,dateText,onSelect,settings,pos){var inst=this._dialogInst;if(!inst){var id="dp"+(++this.uuid);this._dialogInput=$('<input type="text" id="'+id+'" size="1" style="position: absolute; top: -100px;"/>');this._dialogInput.keydown(this._doKeyDown);$("body").append(this._dialogInput);inst=this._dialogInst=this._newInst(this._dialogInput,false);inst.settings={};$.data(this._dialogInput[0],PROP_NAME,inst)}extendRemove(inst.settings,settings||{});this._dialogInput.val(dateText);this._pos=(pos?(pos.length?pos:[pos.pageX,pos.pageY]):null);if(!this._pos){var browserWidth=window.innerWidth||document.documentElement.clientWidth||document.body.clientWidth;var browserHeight=window.innerHeight||document.documentElement.clientHeight||document.body.clientHeight;var scrollX=document.documentElement.scrollLeft||document.body.scrollLeft;var scrollY=document.documentElement.scrollTop||document.body.scrollTop;this._pos=[(browserWidth/2)-100+scrollX,(browserHeight/2)-150+scrollY]}this._dialogInput.css("left",this._pos[0]+"px").css("top",this._pos[1]+"px");inst.settings.onSelect=onSelect;this._inDialog=true;this.dpDiv.addClass(this._dialogClass);this._showDatepicker(this._dialogInput[0]);if($.blockUI){$.blockUI(this.dpDiv)}$.data(this._dialogInput[0],PROP_NAME,inst);return this},_destroyDatepicker:function(target){var $target=$(target);var inst=$.data(target,PROP_NAME);if(!$target.hasClass(this.markerClassName)){return}var nodeName=target.nodeName.toLowerCase();$.removeData(target,PROP_NAME);if(nodeName=="input"){inst.append.remove();inst.trigger.remove();$target.removeClass(this.markerClassName).unbind("focus",this._showDatepicker).unbind("keydown",this._doKeyDown).unbind("keypress",this._doKeyPress)}else{if(nodeName=="div"||nodeName=="span"){$target.removeClass(this.markerClassName).empty()}}},_enableDatepicker:function(target){var $target=$(target);var inst=$.data(target,PROP_NAME);if(!$target.hasClass(this.markerClassName)){return}var nodeName=target.nodeName.toLowerCase();if(nodeName=="input"){target.disabled=false;inst.trigger.filter("button").each(function(){this.disabled=false}).end().filter("img").css({opacity:"1.0",cursor:""})}else{if(nodeName=="div"||nodeName=="span"){var inline=$target.children("."+this._inlineClass);inline.children().removeClass("ui-state-disabled")}}this._disabledInputs=$.map(this._disabledInputs,function(value){return(value==target?null:value)})},_disableDatepicker:function(target){var $target=$(target);var inst=$.data(target,PROP_NAME);if(!$target.hasClass(this.markerClassName)){return}var nodeName=target.nodeName.toLowerCase();if(nodeName=="input"){target.disabled=true;inst.trigger.filter("button").each(function(){this.disabled=true}).end().filter("img").css({opacity:"0.5",cursor:"default"})}else{if(nodeName=="div"||nodeName=="span"){var inline=$target.children("."+this._inlineClass);inline.children().addClass("ui-state-disabled")}}this._disabledInputs=$.map(this._disabledInputs,function(value){return(value==target?null:value)});this._disabledInputs[this._disabledInputs.length]=target},_isDisabledDatepicker:function(target){if(!target){return false}for(var i=0;i<this._disabledInputs.length;i++){if(this._disabledInputs[i]==target){return true}}return false},_getInst:function(target){try{return $.data(target,PROP_NAME)}catch(err){throw"Missing instance data for this datepicker"}},_optionDatepicker:function(target,name,value){var inst=this._getInst(target);if(arguments.length==2&&typeof name=="string"){return(name=="defaults"?$.extend({},$.datepicker._defaults):(inst?(name=="all"?$.extend({},inst.settings):this._get(inst,name)):null))}var settings=name||{};if(typeof name=="string"){settings={};settings[name]=value}if(inst){if(this._curInst==inst){this._hideDatepicker(null)}var date=this._getDateDatepicker(target);extendRemove(inst.settings,settings);this._setDateDatepicker(target,date);this._updateDatepicker(inst)}},_changeDatepicker:function(target,name,value){this._optionDatepicker(target,name,value)},_refreshDatepicker:function(target){var inst=this._getInst(target);if(inst){this._updateDatepicker(inst)}},_setDateDatepicker:function(target,date,endDate){var inst=this._getInst(target);if(inst){this._setDate(inst,date,endDate);this._updateDatepicker(inst);this._updateAlternate(inst)}},_getDateDatepicker:function(target){var inst=this._getInst(target);if(inst&&!inst.inline){this._setDateFromField(inst)}return(inst?this._getDate(inst):null)},_doKeyDown:function(event){var inst=$.datepicker._getInst(event.target);var handled=true;var isRTL=inst.dpDiv.is(".ui-datepicker-rtl");inst._keyEvent=true;if($.datepicker._datepickerShowing){switch(event.keyCode){case 9:$.datepicker._hideDatepicker(null,"");break;case 13:var sel=$("td."+$.datepicker._dayOverClass+", td."+$.datepicker._currentClass,inst.dpDiv);if(sel[0]){$.datepicker._selectDay(event.target,inst.selectedMonth,inst.selectedYear,sel[0])}else{$.datepicker._hideDatepicker(null,$.datepicker._get(inst,"duration"))}return false;break;case 27:$.datepicker._hideDatepicker(null,$.datepicker._get(inst,"duration"));break;case 33:$.datepicker._adjustDate(event.target,(event.ctrlKey?-$.datepicker._get(inst,"stepBigMonths"):-$.datepicker._get(inst,"stepMonths")),"M");break;case 34:$.datepicker._adjustDate(event.target,(event.ctrlKey?+$.datepicker._get(inst,"stepBigMonths"):+$.datepicker._get(inst,"stepMonths")),"M");break;case 35:if(event.ctrlKey||event.metaKey){$.datepicker._clearDate(event.target)}handled=event.ctrlKey||event.metaKey;break;case 36:if(event.ctrlKey||event.metaKey){$.datepicker._gotoToday(event.target)}handled=event.ctrlKey||event.metaKey;break;case 37:if(event.ctrlKey||event.metaKey){$.datepicker._adjustDate(event.target,(isRTL?+1:-1),"D")}handled=event.ctrlKey||event.metaKey;if(event.originalEvent.altKey){$.datepicker._adjustDate(event.target,(event.ctrlKey?-$.datepicker._get(inst,"stepBigMonths"):-$.datepicker._get(inst,"stepMonths")),"M")}break;case 38:if(event.ctrlKey||event.metaKey){$.datepicker._adjustDate(event.target,-7,"D")}handled=event.ctrlKey||event.metaKey;break;case 39:if(event.ctrlKey||event.metaKey){$.datepicker._adjustDate(event.target,(isRTL?-1:+1),"D")}handled=event.ctrlKey||event.metaKey;if(event.originalEvent.altKey){$.datepicker._adjustDate(event.target,(event.ctrlKey?+$.datepicker._get(inst,"stepBigMonths"):+$.datepicker._get(inst,"stepMonths")),"M")}break;case 40:if(event.ctrlKey||event.metaKey){$.datepicker._adjustDate(event.target,+7,"D")}handled=event.ctrlKey||event.metaKey;break;default:handled=false}}else{if(event.keyCode==36&&event.ctrlKey){$.datepicker._showDatepicker(this)}else{handled=false}}if(handled){event.preventDefault();event.stopPropagation()}},_doKeyPress:function(event){var inst=$.datepicker._getInst(event.target);if($.datepicker._get(inst,"constrainInput")){var chars=$.datepicker._possibleChars($.datepicker._get(inst,"dateFormat"));var chr=String.fromCharCode(event.charCode==undefined?event.keyCode:event.charCode);return event.ctrlKey||(chr<" "||!chars||chars.indexOf(chr)>-1)}},_showDatepicker:function(input){input=input.target||input;if(input.nodeName.toLowerCase()!="input"){input=$("input",input.parentNode)[0]}if($.datepicker._isDisabledDatepicker(input)||$.datepicker._lastInput==input){return}var inst=$.datepicker._getInst(input);var beforeShow=$.datepicker._get(inst,"beforeShow");extendRemove(inst.settings,(beforeShow?beforeShow.apply(input,[input,inst]):{}));$.datepicker._hideDatepicker(null,"");$.datepicker._lastInput=input;$.datepicker._setDateFromField(inst);if($.datepicker._inDialog){input.value=""}if(!$.datepicker._pos){$.datepicker._pos=$.datepicker._findPos(input);$.datepicker._pos[1]+=input.offsetHeight}var isFixed=false;$(input).parents().each(function(){isFixed|=$(this).css("position")=="fixed";return !isFixed});if(isFixed&&$.browser.opera){$.datepicker._pos[0]-=document.documentElement.scrollLeft;$.datepicker._pos[1]-=document.documentElement.scrollTop}var offset={left:$.datepicker._pos[0],top:$.datepicker._pos[1]};$.datepicker._pos=null;inst.rangeStart=null;inst.dpDiv.css({position:"absolute",display:"block",top:"-1000px"});$.datepicker._updateDatepicker(inst);offset=$.datepicker._checkOffset(inst,offset,isFixed);inst.dpDiv.css({position:($.datepicker._inDialog&&$.blockUI?"static":(isFixed?"fixed":"absolute")),display:"none",left:offset.left+"px",top:offset.top+"px"});if(!inst.inline){var showAnim=$.datepicker._get(inst,"showAnim")||"show";var duration=$.datepicker._get(inst,"duration");var postProcess=function(){$.datepicker._datepickerShowing=true;if($.browser.msie&&parseInt($.browser.version,10)<7){$("iframe.ui-datepicker-cover").css({width:inst.dpDiv.width()+4,height:inst.dpDiv.height()+4})}};if($.effects&&$.effects[showAnim]){inst.dpDiv.show(showAnim,$.datepicker._get(inst,"showOptions"),duration,postProcess)}else{inst.dpDiv[showAnim](duration,postProcess)}if(duration==""){postProcess()}if(inst.input[0].type!="hidden"){inst.input[0].focus()}$.datepicker._curInst=inst}},_updateDatepicker:function(inst){var dims={width:inst.dpDiv.width()+4,height:inst.dpDiv.height()+4};var self=this;inst.dpDiv.empty().append(this._generateHTML(inst)).find("iframe.ui-datepicker-cover").css({width:dims.width,height:dims.height}).end().find("button, .ui-datepicker-prev, .ui-datepicker-next, .ui-datepicker-calendar td a").bind("mouseout",function(){$(this).removeClass("ui-state-hover");if(this.className.indexOf("ui-datepicker-prev")!=-1){$(this).removeClass("ui-datepicker-prev-hover")}if(this.className.indexOf("ui-datepicker-next")!=-1){$(this).removeClass("ui-datepicker-next-hover")}}).bind("mouseover",function(){if(!self._isDisabledDatepicker(inst.inline?inst.dpDiv.parent()[0]:inst.input[0])){$(this).parents(".ui-datepicker-calendar").find("a").removeClass("ui-state-hover");$(this).addClass("ui-state-hover");if(this.className.indexOf("ui-datepicker-prev")!=-1){$(this).addClass("ui-datepicker-prev-hover")}if(this.className.indexOf("ui-datepicker-next")!=-1){$(this).addClass("ui-datepicker-next-hover")}}}).end().find("."+this._dayOverClass+" a").trigger("mouseover").end();var numMonths=this._getNumberOfMonths(inst);var cols=numMonths[1];var width=17;if(cols>1){inst.dpDiv.addClass("ui-datepicker-multi-"+cols).css("width",(width*cols)+"em")}else{inst.dpDiv.removeClass("ui-datepicker-multi-2 ui-datepicker-multi-3 ui-datepicker-multi-4").width("")}inst.dpDiv[(numMonths[0]!=1||numMonths[1]!=1?"add":"remove")+"Class"]("ui-datepicker-multi");inst.dpDiv[(this._get(inst,"isRTL")?"add":"remove")+"Class"]("ui-datepicker-rtl");if(inst.input&&inst.input[0].type!="hidden"&&inst==$.datepicker._curInst){$(inst.input[0]).focus()}},_checkOffset:function(inst,offset,isFixed){var dpWidth=inst.dpDiv.outerWidth();var dpHeight=inst.dpDiv.outerHeight();var inputWidth=inst.input?inst.input.outerWidth():0;var inputHeight=inst.input?inst.input.outerHeight():0;var viewWidth=(window.innerWidth||document.documentElement.clientWidth||document.body.clientWidth)+$(document).scrollLeft();var viewHeight=(window.innerHeight||document.documentElement.clientHeight||document.body.clientHeight)+$(document).scrollTop();offset.left-=(this._get(inst,"isRTL")?(dpWidth-inputWidth):0);offset.left-=(isFixed&&offset.left==inst.input.offset().left)?$(document).scrollLeft():0;offset.top-=(isFixed&&offset.top==(inst.input.offset().top+inputHeight))?$(document).scrollTop():0;offset.left-=(offset.left+dpWidth>viewWidth&&viewWidth>dpWidth)?Math.abs(offset.left+dpWidth-viewWidth):0;offset.top-=(offset.top+dpHeight>viewHeight&&viewHeight>dpHeight)?Math.abs(offset.top+dpHeight+inputHeight*2-viewHeight):0;return offset},_findPos:function(obj){while(obj&&(obj.type=="hidden"||obj.nodeType!=1)){obj=obj.nextSibling}var position=$(obj).offset();return[position.left,position.top]},_hideDatepicker:function(input,duration){var inst=this._curInst;if(!inst||(input&&inst!=$.data(input,PROP_NAME))){return}if(inst.stayOpen){this._selectDate("#"+inst.id,this._formatDate(inst,inst.currentDay,inst.currentMonth,inst.currentYear))}inst.stayOpen=false;if(this._datepickerShowing){duration=(duration!=null?duration:this._get(inst,"duration"));var showAnim=this._get(inst,"showAnim");var postProcess=function(){$.datepicker._tidyDialog(inst)};if(duration!=""&&$.effects&&$.effects[showAnim]){inst.dpDiv.hide(showAnim,$.datepicker._get(inst,"showOptions"),duration,postProcess)}else{inst.dpDiv[(duration==""?"hide":(showAnim=="slideDown"?"slideUp":(showAnim=="fadeIn"?"fadeOut":"hide")))](duration,postProcess)}if(duration==""){this._tidyDialog(inst)}var onClose=this._get(inst,"onClose");if(onClose){onClose.apply((inst.input?inst.input[0]:null),[(inst.input?inst.input.val():""),inst])}this._datepickerShowing=false;this._lastInput=null;if(this._inDialog){this._dialogInput.css({position:"absolute",left:"0",top:"-100px"});if($.blockUI){$.unblockUI();$("body").append(this.dpDiv)}}this._inDialog=false}this._curInst=null},_tidyDialog:function(inst){inst.dpDiv.removeClass(this._dialogClass).unbind(".ui-datepicker-calendar")},_checkExternalClick:function(event){if(!$.datepicker._curInst){return}var $target=$(event.target);if(($target.parents("#"+$.datepicker._mainDivId).length==0)&&!$target.hasClass($.datepicker.markerClassName)&&!$target.hasClass($.datepicker._triggerClass)&&$.datepicker._datepickerShowing&&!($.datepicker._inDialog&&$.blockUI)){$.datepicker._hideDatepicker(null,"")}},_adjustDate:function(id,offset,period){var target=$(id);var inst=this._getInst(target[0]);if(this._isDisabledDatepicker(target[0])){return}this._adjustInstDate(inst,offset+(period=="M"?this._get(inst,"showCurrentAtPos"):0),period);this._updateDatepicker(inst)},_gotoToday:function(id){var target=$(id);var inst=this._getInst(target[0]);if(this._get(inst,"gotoCurrent")&&inst.currentDay){inst.selectedDay=inst.currentDay;inst.drawMonth=inst.selectedMonth=inst.currentMonth;inst.drawYear=inst.selectedYear=inst.currentYear}else{var date=new Date();inst.selectedDay=date.getDate();inst.drawMonth=inst.selectedMonth=date.getMonth();inst.drawYear=inst.selectedYear=date.getFullYear()}this._notifyChange(inst);this._adjustDate(target)},_selectMonthYear:function(id,select,period){var target=$(id);var inst=this._getInst(target[0]);inst._selectingMonthYear=false;inst["selected"+(period=="M"?"Month":"Year")]=inst["draw"+(period=="M"?"Month":"Year")]=parseInt(select.options[select.selectedIndex].value,10);this._notifyChange(inst);this._adjustDate(target)},_clickMonthYear:function(id){var target=$(id);var inst=this._getInst(target[0]);if(inst.input&&inst._selectingMonthYear&&!$.browser.msie){inst.input[0].focus()}inst._selectingMonthYear=!inst._selectingMonthYear},_selectDay:function(id,month,year,td){var target=$(id);if($(td).hasClass(this._unselectableClass)||this._isDisabledDatepicker(target[0])){return}var inst=this._getInst(target[0]);inst.selectedDay=inst.currentDay=$("a",td).html();inst.selectedMonth=inst.currentMonth=month;inst.selectedYear=inst.currentYear=year;if(inst.stayOpen){inst.endDay=inst.endMonth=inst.endYear=null}this._selectDate(id,this._formatDate(inst,inst.currentDay,inst.currentMonth,inst.currentYear));if(inst.stayOpen){inst.rangeStart=this._daylightSavingAdjust(new Date(inst.currentYear,inst.currentMonth,inst.currentDay));this._updateDatepicker(inst)}},_clearDate:function(id){var target=$(id);var inst=this._getInst(target[0]);inst.stayOpen=false;inst.endDay=inst.endMonth=inst.endYear=inst.rangeStart=null;this._selectDate(target,"")},_selectDate:function(id,dateStr){var target=$(id);var inst=this._getInst(target[0]);dateStr=(dateStr!=null?dateStr:this._formatDate(inst));if(inst.input){inst.input.val(dateStr)}this._updateAlternate(inst);var onSelect=this._get(inst,"onSelect");if(onSelect){onSelect.apply((inst.input?inst.input[0]:null),[dateStr,inst])}else{if(inst.input){inst.input.trigger("change")}}if(inst.inline){this._updateDatepicker(inst)}else{if(!inst.stayOpen){this._hideDatepicker(null,this._get(inst,"duration"));this._lastInput=inst.input[0];if(typeof(inst.input[0])!="object"){inst.input[0].focus()}this._lastInput=null}}},_updateAlternate:function(inst){var altField=this._get(inst,"altField");if(altField){var altFormat=this._get(inst,"altFormat")||this._get(inst,"dateFormat");var date=this._getDate(inst);dateStr=this.formatDate(altFormat,date,this._getFormatConfig(inst));$(altField).each(function(){$(this).val(dateStr)})}},noWeekends:function(date){var day=date.getDay();return[(day>0&&day<6),""]},iso8601Week:function(date){var checkDate=new Date(date.getFullYear(),date.getMonth(),date.getDate());var firstMon=new Date(checkDate.getFullYear(),1-1,4);var firstDay=firstMon.getDay()||7;firstMon.setDate(firstMon.getDate()+1-firstDay);if(firstDay<4&&checkDate<firstMon){checkDate.setDate(checkDate.getDate()-3);return $.datepicker.iso8601Week(checkDate)}else{if(checkDate>new Date(checkDate.getFullYear(),12-1,28)){firstDay=new Date(checkDate.getFullYear()+1,1-1,4).getDay()||7;if(firstDay>4&&(checkDate.getDay()||7)<firstDay-3){return 1}}}return Math.floor(((checkDate-firstMon)/86400000)/7)+1},parseDate:function(format,value,settings){if(format==null||value==null){throw"Invalid arguments"}value=(typeof value=="object"?value.toString():value+"");if(value==""){return null}var shortYearCutoff=(settings?settings.shortYearCutoff:null)||this._defaults.shortYearCutoff;var dayNamesShort=(settings?settings.dayNamesShort:null)||this._defaults.dayNamesShort;var dayNames=(settings?settings.dayNames:null)||this._defaults.dayNames;var monthNamesShort=(settings?settings.monthNamesShort:null)||this._defaults.monthNamesShort;var monthNames=(settings?settings.monthNames:null)||this._defaults.monthNames;var year=-1;var month=-1;var day=-1;var doy=-1;var literal=false;var lookAhead=function(match){var matches=(iFormat+1<format.length&&format.charAt(iFormat+1)==match);if(matches){iFormat++}return matches};var getNumber=function(match){lookAhead(match);var origSize=(match=="@"?14:(match=="y"?4:(match=="o"?3:2)));var size=origSize;var num=0;while(size>0&&iValue<value.length&&value.charAt(iValue)>="0"&&value.charAt(iValue)<="9"){num=num*10+parseInt(value.charAt(iValue++),10);size--}if(size==origSize){throw"Missing number at position "+iValue}return num};var getName=function(match,shortNames,longNames){var names=(lookAhead(match)?longNames:shortNames);var size=0;for(var j=0;j<names.length;j++){size=Math.max(size,names[j].length)}var name="";var iInit=iValue;while(size>0&&iValue<value.length){name+=value.charAt(iValue++);for(var i=0;i<names.length;i++){if(name==names[i]){return i+1}}size--}throw"Unknown name at position "+iInit};var checkLiteral=function(){if(value.charAt(iValue)!=format.charAt(iFormat)){throw"Unexpected literal at position "+iValue}iValue++};var iValue=0;for(var iFormat=0;iFormat<format.length;iFormat++){if(literal){if(format.charAt(iFormat)=="'"&&!lookAhead("'")){literal=false}else{checkLiteral()}}else{switch(format.charAt(iFormat)){case"d":day=getNumber("d");break;case"D":getName("D",dayNamesShort,dayNames);break;case"o":doy=getNumber("o");break;case"m":month=getNumber("m");break;case"M":month=getName("M",monthNamesShort,monthNames);break;case"y":year=getNumber("y");break;case"@":var date=new Date(getNumber("@"));year=date.getFullYear();month=date.getMonth()+1;day=date.getDate();break;case"'":if(lookAhead("'")){checkLiteral()}else{literal=true}break;default:checkLiteral()}}}if(year==-1){year=new Date().getFullYear()}else{if(year<100){year+=new Date().getFullYear()-new Date().getFullYear()%100+(year<=shortYearCutoff?0:-100)}}if(doy>-1){month=1;day=doy;do{var dim=this._getDaysInMonth(year,month-1);if(day<=dim){break}month++;day-=dim}while(true)}var date=this._daylightSavingAdjust(new Date(year,month-1,day));if(date.getFullYear()!=year||date.getMonth()+1!=month||date.getDate()!=day){throw"Invalid date"}return date},ATOM:"yy-mm-dd",COOKIE:"D, dd M yy",ISO_8601:"yy-mm-dd",RFC_822:"D, d M y",RFC_850:"DD, dd-M-y",RFC_1036:"D, d M y",RFC_1123:"D, d M yy",RFC_2822:"D, d M yy",RSS:"D, d M y",TIMESTAMP:"@",W3C:"yy-mm-dd",formatDate:function(format,date,settings){if(!date){return""}var dayNamesShort=(settings?settings.dayNamesShort:null)||this._defaults.dayNamesShort;var dayNames=(settings?settings.dayNames:null)||this._defaults.dayNames;var monthNamesShort=(settings?settings.monthNamesShort:null)||this._defaults.monthNamesShort;var monthNames=(settings?settings.monthNames:null)||this._defaults.monthNames;var lookAhead=function(match){var matches=(iFormat+1<format.length&&format.charAt(iFormat+1)==match);if(matches){iFormat++}return matches};var formatNumber=function(match,value,len){var num=""+value;if(lookAhead(match)){while(num.length<len){num="0"+num}}return num};var formatName=function(match,value,shortNames,longNames){return(lookAhead(match)?longNames[value]:shortNames[value])};var output="";var literal=false;if(date){for(var iFormat=0;iFormat<format.length;iFormat++){if(literal){if(format.charAt(iFormat)=="'"&&!lookAhead("'")){literal=false}else{output+=format.charAt(iFormat)}}else{switch(format.charAt(iFormat)){case"d":output+=formatNumber("d",date.getDate(),2);break;case"D":output+=formatName("D",date.getDay(),dayNamesShort,dayNames);break;case"o":var doy=date.getDate();for(var m=date.getMonth()-1;m>=0;m--){doy+=this._getDaysInMonth(date.getFullYear(),m)}output+=formatNumber("o",doy,3);break;case"m":output+=formatNumber("m",date.getMonth()+1,2);break;case"M":output+=formatName("M",date.getMonth(),monthNamesShort,monthNames);break;case"y":output+=(lookAhead("y")?date.getFullYear():(date.getYear()%100<10?"0":"")+date.getYear()%100);break;case"@":output+=date.getTime();break;case"'":if(lookAhead("'")){output+="'"}else{literal=true}break;default:output+=format.charAt(iFormat)}}}}return output},_possibleChars:function(format){var chars="";var literal=false;for(var iFormat=0;iFormat<format.length;iFormat++){if(literal){if(format.charAt(iFormat)=="'"&&!lookAhead("'")){literal=false}else{chars+=format.charAt(iFormat)}}else{switch(format.charAt(iFormat)){case"d":case"m":case"y":case"@":chars+="0123456789";break;case"D":case"M":return null;case"'":if(lookAhead("'")){chars+="'"}else{literal=true}break;default:chars+=format.charAt(iFormat)}}}return chars},_get:function(inst,name){return inst.settings[name]!==undefined?inst.settings[name]:this._defaults[name]},_setDateFromField:function(inst){var dateFormat=this._get(inst,"dateFormat");var dates=inst.input?inst.input.val():null;inst.endDay=inst.endMonth=inst.endYear=null;var date=defaultDate=this._getDefaultDate(inst);var settings=this._getFormatConfig(inst);try{date=this.parseDate(dateFormat,dates,settings)||defaultDate}catch(event){this.log(event);date=defaultDate}inst.selectedDay=date.getDate();inst.drawMonth=inst.selectedMonth=date.getMonth();inst.drawYear=inst.selectedYear=date.getFullYear();inst.currentDay=(dates?date.getDate():0);inst.currentMonth=(dates?date.getMonth():0);inst.currentYear=(dates?date.getFullYear():0);this._adjustInstDate(inst)},_getDefaultDate:function(inst){var date=this._determineDate(this._get(inst,"defaultDate"),new Date());var minDate=this._getMinMaxDate(inst,"min",true);var maxDate=this._getMinMaxDate(inst,"max");date=(minDate&&date<minDate?minDate:date);date=(maxDate&&date>maxDate?maxDate:date);return date},_determineDate:function(date,defaultDate){var offsetNumeric=function(offset){var date=new Date();date.setDate(date.getDate()+offset);return date};var offsetString=function(offset,getDaysInMonth){var date=new Date();var year=date.getFullYear();var month=date.getMonth();var day=date.getDate();var pattern=/([+-]?[0-9]+)\s*(d|D|w|W|m|M|y|Y)?/g;var matches=pattern.exec(offset);while(matches){switch(matches[2]||"d"){case"d":case"D":day+=parseInt(matches[1],10);break;case"w":case"W":day+=parseInt(matches[1],10)*7;break;case"m":case"M":month+=parseInt(matches[1],10);day=Math.min(day,getDaysInMonth(year,month));break;case"y":case"Y":year+=parseInt(matches[1],10);day=Math.min(day,getDaysInMonth(year,month));break}matches=pattern.exec(offset)}return new Date(year,month,day)};date=(date==null?defaultDate:(typeof date=="string"?offsetString(date,this._getDaysInMonth):(typeof date=="number"?(isNaN(date)?defaultDate:offsetNumeric(date)):date)));date=(date&&date.toString()=="Invalid Date"?defaultDate:date);if(date){date.setHours(0);date.setMinutes(0);date.setSeconds(0);date.setMilliseconds(0)}return this._daylightSavingAdjust(date)},_daylightSavingAdjust:function(date){if(!date){return null}date.setHours(date.getHours()>12?date.getHours()+2:0);return date},_setDate:function(inst,date,endDate){var clear=!(date);var origMonth=inst.selectedMonth;var origYear=inst.selectedYear;date=this._determineDate(date,new Date());inst.selectedDay=inst.currentDay=date.getDate();inst.drawMonth=inst.selectedMonth=inst.currentMonth=date.getMonth();inst.drawYear=inst.selectedYear=inst.currentYear=date.getFullYear();if(origMonth!=inst.selectedMonth||origYear!=inst.selectedYear){this._notifyChange(inst)}this._adjustInstDate(inst);if(inst.input){inst.input.val(clear?"":this._formatDate(inst))}},_getDate:function(inst){var startDate=(!inst.currentYear||(inst.input&&inst.input.val()=="")?null:this._daylightSavingAdjust(new Date(inst.currentYear,inst.currentMonth,inst.currentDay)));return startDate},_generateHTML:function(inst){var today=new Date();today=this._daylightSavingAdjust(new Date(today.getFullYear(),today.getMonth(),today.getDate()));var isRTL=this._get(inst,"isRTL");var showButtonPanel=this._get(inst,"showButtonPanel");var hideIfNoPrevNext=this._get(inst,"hideIfNoPrevNext");var navigationAsDateFormat=this._get(inst,"navigationAsDateFormat");var numMonths=this._getNumberOfMonths(inst);var showCurrentAtPos=this._get(inst,"showCurrentAtPos");var stepMonths=this._get(inst,"stepMonths");var stepBigMonths=this._get(inst,"stepBigMonths");var isMultiMonth=(numMonths[0]!=1||numMonths[1]!=1);var currentDate=this._daylightSavingAdjust((!inst.currentDay?new Date(9999,9,9):new Date(inst.currentYear,inst.currentMonth,inst.currentDay)));var minDate=this._getMinMaxDate(inst,"min",true);var maxDate=this._getMinMaxDate(inst,"max");var drawMonth=inst.drawMonth-showCurrentAtPos;var drawYear=inst.drawYear;if(drawMonth<0){drawMonth+=12;drawYear--}if(maxDate){var maxDraw=this._daylightSavingAdjust(new Date(maxDate.getFullYear(),maxDate.getMonth()-numMonths[1]+1,maxDate.getDate()));maxDraw=(minDate&&maxDraw<minDate?minDate:maxDraw);while(this._daylightSavingAdjust(new Date(drawYear,drawMonth,1))>maxDraw){drawMonth--;if(drawMonth<0){drawMonth=11;drawYear--}}}inst.drawMonth=drawMonth;inst.drawYear=drawYear;var prevText=this._get(inst,"prevText");prevText=(!navigationAsDateFormat?prevText:this.formatDate(prevText,this._daylightSavingAdjust(new Date(drawYear,drawMonth-stepMonths,1)),this._getFormatConfig(inst)));var prev=(this._canAdjustMonth(inst,-1,drawYear,drawMonth)?'<a class="ui-datepicker-prev ui-corner-all" onclick="DP_jQuery.datepicker._adjustDate(\'#'+inst.id+"', -"+stepMonths+", 'M');\" title=\""+prevText+'"><span class="ui-icon ui-icon-circle-triangle-'+(isRTL?"e":"w")+'">'+prevText+"</span></a>":(hideIfNoPrevNext?"":'<a class="ui-datepicker-prev ui-corner-all ui-state-disabled" title="'+prevText+'"><span class="ui-icon ui-icon-circle-triangle-'+(isRTL?"e":"w")+'">'+prevText+"</span></a>"));var nextText=this._get(inst,"nextText");nextText=(!navigationAsDateFormat?nextText:this.formatDate(nextText,this._daylightSavingAdjust(new Date(drawYear,drawMonth+stepMonths,1)),this._getFormatConfig(inst)));var next=(this._canAdjustMonth(inst,+1,drawYear,drawMonth)?'<a class="ui-datepicker-next ui-corner-all" onclick="DP_jQuery.datepicker._adjustDate(\'#'+inst.id+"', +"+stepMonths+", 'M');\" title=\""+nextText+'"><span class="ui-icon ui-icon-circle-triangle-'+(isRTL?"w":"e")+'">'+nextText+"</span></a>":(hideIfNoPrevNext?"":'<a class="ui-datepicker-next ui-corner-all ui-state-disabled" title="'+nextText+'"><span class="ui-icon ui-icon-circle-triangle-'+(isRTL?"w":"e")+'">'+nextText+"</span></a>"));var currentText=this._get(inst,"currentText");var gotoDate=(this._get(inst,"gotoCurrent")&&inst.currentDay?currentDate:today);currentText=(!navigationAsDateFormat?currentText:this.formatDate(currentText,gotoDate,this._getFormatConfig(inst)));var controls=(!inst.inline?'<button type="button" class="ui-datepicker-close ui-state-default ui-priority-primary ui-corner-all" onclick="DP_jQuery.datepicker._hideDatepicker();">'+this._get(inst,"closeText")+"</button>":"");var buttonPanel=(showButtonPanel)?'<div class="ui-datepicker-buttonpane ui-widget-content">'+(isRTL?controls:"")+(this._isInRange(inst,gotoDate)?'<button type="button" class="ui-datepicker-current ui-state-default ui-priority-secondary ui-corner-all" onclick="DP_jQuery.datepicker._gotoToday(\'#'+inst.id+"');\">"+currentText+"</button>":"")+(isRTL?"":controls)+"</div>":"";var firstDay=parseInt(this._get(inst,"firstDay"),10);firstDay=(isNaN(firstDay)?0:firstDay);var dayNames=this._get(inst,"dayNames");var dayNamesShort=this._get(inst,"dayNamesShort");var dayNamesMin=this._get(inst,"dayNamesMin");var monthNames=this._get(inst,"monthNames");var monthNamesShort=this._get(inst,"monthNamesShort");var beforeShowDay=this._get(inst,"beforeShowDay");var showOtherMonths=this._get(inst,"showOtherMonths");var calculateWeek=this._get(inst,"calculateWeek")||this.iso8601Week;var endDate=inst.endDay?this._daylightSavingAdjust(new Date(inst.endYear,inst.endMonth,inst.endDay)):currentDate;var defaultDate=this._getDefaultDate(inst);var html="";for(var row=0;row<numMonths[0];row++){var group="";for(var col=0;col<numMonths[1];col++){var selectedDate=this._daylightSavingAdjust(new Date(drawYear,drawMonth,inst.selectedDay));var cornerClass=" ui-corner-all";var calender="";if(isMultiMonth){calender+='<div class="ui-datepicker-group ui-datepicker-group-';switch(col){case 0:calender+="first";cornerClass=" ui-corner-"+(isRTL?"right":"left");break;case numMonths[1]-1:calender+="last";cornerClass=" ui-corner-"+(isRTL?"left":"right");break;default:calender+="middle";cornerClass="";break}calender+='">'}calender+='<div class="ui-datepicker-header ui-widget-header ui-helper-clearfix'+cornerClass+'">'+(/all|left/.test(cornerClass)&&row==0?(isRTL?next:prev):"")+(/all|right/.test(cornerClass)&&row==0?(isRTL?prev:next):"")+this._generateMonthYearHeader(inst,drawMonth,drawYear,minDate,maxDate,selectedDate,row>0||col>0,monthNames,monthNamesShort)+'</div><table class="ui-datepicker-calendar"><thead><tr>';var thead="";for(var dow=0;dow<7;dow++){var day=(dow+firstDay)%7;thead+="<th"+((dow+firstDay+6)%7>=5?' class="ui-datepicker-week-end"':"")+'><span title="'+dayNames[day]+'">'+dayNamesMin[day]+"</span></th>"}calender+=thead+"</tr></thead><tbody>";var daysInMonth=this._getDaysInMonth(drawYear,drawMonth);if(drawYear==inst.selectedYear&&drawMonth==inst.selectedMonth){inst.selectedDay=Math.min(inst.selectedDay,daysInMonth)}var leadDays=(this._getFirstDayOfMonth(drawYear,drawMonth)-firstDay+7)%7;var numRows=(isMultiMonth?6:Math.ceil((leadDays+daysInMonth)/7));var printDate=this._daylightSavingAdjust(new Date(drawYear,drawMonth,1-leadDays));for(var dRow=0;dRow<numRows;dRow++){calender+="<tr>";var tbody="";for(var dow=0;dow<7;dow++){var daySettings=(beforeShowDay?beforeShowDay.apply((inst.input?inst.input[0]:null),[printDate]):[true,""]);var otherMonth=(printDate.getMonth()!=drawMonth);var unselectable=otherMonth||!daySettings[0]||(minDate&&printDate<minDate)||(maxDate&&printDate>maxDate);tbody+='<td class="'+((dow+firstDay+6)%7>=5?" ui-datepicker-week-end":"")+(otherMonth?" ui-datepicker-other-month":"")+((printDate.getTime()==selectedDate.getTime()&&drawMonth==inst.selectedMonth&&inst._keyEvent)||(defaultDate.getTime()==printDate.getTime()&&defaultDate.getTime()==selectedDate.getTime())?" "+this._dayOverClass:"")+(unselectable?" "+this._unselectableClass+" ui-state-disabled":"")+(otherMonth&&!showOtherMonths?"":" "+daySettings[1]+(printDate.getTime()>=currentDate.getTime()&&printDate.getTime()<=endDate.getTime()?" "+this._currentClass:"")+(printDate.getTime()==today.getTime()?" ui-datepicker-today":""))+'"'+((!otherMonth||showOtherMonths)&&daySettings[2]?' title="'+daySettings[2]+'"':"")+(unselectable?"":" onclick=\"DP_jQuery.datepicker._selectDay('#"+inst.id+"',"+drawMonth+","+drawYear+', this);return false;"')+">"+(otherMonth?(showOtherMonths?printDate.getDate():"&#xa0;"):(unselectable?'<span class="ui-state-default">'+printDate.getDate()+"</span>":'<a class="ui-state-default'+(printDate.getTime()==today.getTime()?" ui-state-highlight":"")+(printDate.getTime()>=currentDate.getTime()&&printDate.getTime()<=endDate.getTime()?" ui-state-active":"")+'" href="#">'+printDate.getDate()+"</a>"))+"</td>";printDate.setDate(printDate.getDate()+1);printDate=this._daylightSavingAdjust(printDate)}calender+=tbody+"</tr>"}drawMonth++;if(drawMonth>11){drawMonth=0;drawYear++}calender+="</tbody></table>"+(isMultiMonth?"</div>"+((numMonths[0]>0&&col==numMonths[1]-1)?'<div class="ui-datepicker-row-break"></div>':""):"");group+=calender}html+=group}html+=buttonPanel+($.browser.msie&&parseInt($.browser.version,10)<7&&!inst.inline?'<iframe src="javascript:false;" class="ui-datepicker-cover" frameborder="0"></iframe>':"");inst._keyEvent=false;return html},_generateMonthYearHeader:function(inst,drawMonth,drawYear,minDate,maxDate,selectedDate,secondary,monthNames,monthNamesShort){minDate=(inst.rangeStart&&minDate&&selectedDate<minDate?selectedDate:minDate);var changeMonth=this._get(inst,"changeMonth");var changeYear=this._get(inst,"changeYear");var showMonthAfterYear=this._get(inst,"showMonthAfterYear");var html='<div class="ui-datepicker-title">';var monthHtml="";if(secondary||!changeMonth){monthHtml+='<span class="ui-datepicker-month">'+monthNames[drawMonth]+"</span> "}else{var inMinYear=(minDate&&minDate.getFullYear()==drawYear);var inMaxYear=(maxDate&&maxDate.getFullYear()==drawYear);monthHtml+='<select class="ui-datepicker-month" onchange="DP_jQuery.datepicker._selectMonthYear(\'#'+inst.id+"', this, 'M');\" onclick=\"DP_jQuery.datepicker._clickMonthYear('#"+inst.id+"');\">";for(var month=0;month<12;month++){if((!inMinYear||month>=minDate.getMonth())&&(!inMaxYear||month<=maxDate.getMonth())){monthHtml+='<option value="'+month+'"'+(month==drawMonth?' selected="selected"':"")+">"+monthNamesShort[month]+"</option>"}}monthHtml+="</select>"}if(!showMonthAfterYear){html+=monthHtml+((secondary||changeMonth||changeYear)&&(!(changeMonth&&changeYear))?"&#xa0;":"")}if(secondary||!changeYear){html+='<span class="ui-datepicker-year">'+drawYear+"</span>"}else{var years=this._get(inst,"yearRange").split(":");var year=0;var endYear=0;if(years.length!=2){year=drawYear-10;endYear=drawYear+10}else{if(years[0].charAt(0)=="+"||years[0].charAt(0)=="-"){year=drawYear+parseInt(years[0],10);endYear=drawYear+parseInt(years[1],10)}else{year=parseInt(years[0],10);endYear=parseInt(years[1],10)}}year=(minDate?Math.max(year,minDate.getFullYear()):year);endYear=(maxDate?Math.min(endYear,maxDate.getFullYear()):endYear);html+='<select class="ui-datepicker-year" onchange="DP_jQuery.datepicker._selectMonthYear(\'#'+inst.id+"', this, 'Y');\" onclick=\"DP_jQuery.datepicker._clickMonthYear('#"+inst.id+"');\">";for(;year<=endYear;year++){html+='<option value="'+year+'"'+(year==drawYear?' selected="selected"':"")+">"+year+"</option>"}html+="</select>"}if(showMonthAfterYear){html+=(secondary||changeMonth||changeYear?"&#xa0;":"")+monthHtml}html+="</div>";return html},_adjustInstDate:function(inst,offset,period){var year=inst.drawYear+(period=="Y"?offset:0);var month=inst.drawMonth+(period=="M"?offset:0);var day=Math.min(inst.selectedDay,this._getDaysInMonth(year,month))+(period=="D"?offset:0);var date=this._daylightSavingAdjust(new Date(year,month,day));var minDate=this._getMinMaxDate(inst,"min",true);var maxDate=this._getMinMaxDate(inst,"max");date=(minDate&&date<minDate?minDate:date);date=(maxDate&&date>maxDate?maxDate:date);inst.selectedDay=date.getDate();inst.drawMonth=inst.selectedMonth=date.getMonth();inst.drawYear=inst.selectedYear=date.getFullYear();if(period=="M"||period=="Y"){this._notifyChange(inst)}},_notifyChange:function(inst){var onChange=this._get(inst,"onChangeMonthYear");if(onChange){onChange.apply((inst.input?inst.input[0]:null),[inst.selectedYear,inst.selectedMonth+1,inst])}},_getNumberOfMonths:function(inst){var numMonths=this._get(inst,"numberOfMonths");return(numMonths==null?[1,1]:(typeof numMonths=="number"?[1,numMonths]:numMonths))},_getMinMaxDate:function(inst,minMax,checkRange){var date=this._determineDate(this._get(inst,minMax+"Date"),null);return(!checkRange||!inst.rangeStart?date:(!date||inst.rangeStart>date?inst.rangeStart:date))},_getDaysInMonth:function(year,month){return 32-new Date(year,month,32).getDate()},_getFirstDayOfMonth:function(year,month){return new Date(year,month,1).getDay()},_canAdjustMonth:function(inst,offset,curYear,curMonth){var numMonths=this._getNumberOfMonths(inst);var date=this._daylightSavingAdjust(new Date(curYear,curMonth+(offset<0?offset:numMonths[1]),1));if(offset<0){date.setDate(this._getDaysInMonth(date.getFullYear(),date.getMonth()))}return this._isInRange(inst,date)},_isInRange:function(inst,date){var newMinDate=(!inst.rangeStart?null:this._daylightSavingAdjust(new Date(inst.selectedYear,inst.selectedMonth,inst.selectedDay)));newMinDate=(newMinDate&&inst.rangeStart<newMinDate?inst.rangeStart:newMinDate);var minDate=newMinDate||this._getMinMaxDate(inst,"min");var maxDate=this._getMinMaxDate(inst,"max");return((!minDate||date>=minDate)&&(!maxDate||date<=maxDate))},_getFormatConfig:function(inst){var shortYearCutoff=this._get(inst,"shortYearCutoff");shortYearCutoff=(typeof shortYearCutoff!="string"?shortYearCutoff:new Date().getFullYear()%100+parseInt(shortYearCutoff,10));return{shortYearCutoff:shortYearCutoff,dayNamesShort:this._get(inst,"dayNamesShort"),dayNames:this._get(inst,"dayNames"),monthNamesShort:this._get(inst,"monthNamesShort"),monthNames:this._get(inst,"monthNames")}},_formatDate:function(inst,day,month,year){if(!day){inst.currentDay=inst.selectedDay;inst.currentMonth=inst.selectedMonth;inst.currentYear=inst.selectedYear}var date=(day?(typeof day=="object"?day:this._daylightSavingAdjust(new Date(year,month,day))):this._daylightSavingAdjust(new Date(inst.currentYear,inst.currentMonth,inst.currentDay)));return this.formatDate(this._get(inst,"dateFormat"),date,this._getFormatConfig(inst))}});function extendRemove(target,props){$.extend(target,props);for(var name in props){if(props[name]==null||props[name]==undefined){target[name]=props[name]}}return target}function isArray(a){return(a&&(($.browser.safari&&typeof a=="object"&&a.length)||(a.constructor&&a.constructor.toString().match(/\Array\(\)/))))}$.fn.datepicker=function(options){if(!$.datepicker.initialized){$(document).mousedown($.datepicker._checkExternalClick).find("body").append($.datepicker.dpDiv);$.datepicker.initialized=true}var otherArgs=Array.prototype.slice.call(arguments,1);if(typeof options=="string"&&(options=="isDisabled"||options=="getDate")){return $.datepicker["_"+options+"Datepicker"].apply($.datepicker,[this[0]].concat(otherArgs))}if(options=="option"&&arguments.length==2&&typeof arguments[1]=="string"){return $.datepicker["_"+options+"Datepicker"].apply($.datepicker,[this[0]].concat(otherArgs))}return this.each(function(){typeof options=="string"?$.datepicker["_"+options+"Datepicker"].apply($.datepicker,[this].concat(otherArgs)):$.datepicker._attachDatepicker(this,options)})};$.datepicker=new Datepicker();$.datepicker.initialized=false;$.datepicker.uuid=new Date().getTime();$.datepicker.version="1.7.2";window.DP_jQuery=$})(jQuery);;/*
 * jQuery UI Progressbar 1.7.2
 *
 * Copyright (c) 2009 AUTHORS.txt (http://jqueryui.com/about)
 * Dual licensed under the MIT (MIT-LICENSE.txt)
 * and GPL (GPL-LICENSE.txt) licenses.
 *
 * http://docs.jquery.com/UI/Progressbar
 *
 * Depends:
 *   ui.core.js
 */
(function(a){a.widget("ui.progressbar",{_init:function(){this.element.addClass("ui-progressbar ui-widget ui-widget-content ui-corner-all").attr({role:"progressbar","aria-valuemin":this._valueMin(),"aria-valuemax":this._valueMax(),"aria-valuenow":this._value()});this.valueDiv=a('<div class="ui-progressbar-value ui-widget-header ui-corner-left"></div>').appendTo(this.element);this._refreshValue()},destroy:function(){this.element.removeClass("ui-progressbar ui-widget ui-widget-content ui-corner-all").removeAttr("role").removeAttr("aria-valuemin").removeAttr("aria-valuemax").removeAttr("aria-valuenow").removeData("progressbar").unbind(".progressbar");this.valueDiv.remove();a.widget.prototype.destroy.apply(this,arguments)},value:function(b){if(b===undefined){return this._value()}this._setData("value",b);return this},_setData:function(b,c){switch(b){case"value":this.options.value=c;this._refreshValue();this._trigger("change",null,{});break}a.widget.prototype._setData.apply(this,arguments)},_value:function(){var b=this.options.value;if(b<this._valueMin()){b=this._valueMin()}if(b>this._valueMax()){b=this._valueMax()}return b},_valueMin:function(){var b=0;return b},_valueMax:function(){var b=100;return b},_refreshValue:function(){var b=this.value();this.valueDiv[b==this._valueMax()?"addClass":"removeClass"]("ui-corner-right");this.valueDiv.width(b+"%");this.element.attr("aria-valuenow",b)}});a.extend(a.ui.progressbar,{version:"1.7.2",defaults:{value:0}})})(jQuery);;/*
 * jQuery UI Effects 1.7.2
 *
 * Copyright (c) 2009 AUTHORS.txt (http://jqueryui.com/about)
 * Dual licensed under the MIT (MIT-LICENSE.txt)
 * and GPL (GPL-LICENSE.txt) licenses.
 *
 * http://docs.jquery.com/UI/Effects/
 */
jQuery.effects||(function(d){d.effects={version:"1.7.2",save:function(g,h){for(var f=0;f<h.length;f++){if(h[f]!==null){g.data("ec.storage."+h[f],g[0].style[h[f]])}}},restore:function(g,h){for(var f=0;f<h.length;f++){if(h[f]!==null){g.css(h[f],g.data("ec.storage."+h[f]))}}},setMode:function(f,g){if(g=="toggle"){g=f.is(":hidden")?"show":"hide"}return g},getBaseline:function(g,h){var i,f;switch(g[0]){case"top":i=0;break;case"middle":i=0.5;break;case"bottom":i=1;break;default:i=g[0]/h.height}switch(g[1]){case"left":f=0;break;case"center":f=0.5;break;case"right":f=1;break;default:f=g[1]/h.width}return{x:f,y:i}},createWrapper:function(f){if(f.parent().is(".ui-effects-wrapper")){return f.parent()}var g={width:f.outerWidth(true),height:f.outerHeight(true),"float":f.css("float")};f.wrap('<div class="ui-effects-wrapper" style="font-size:100%;background:transparent;border:none;margin:0;padding:0"></div>');var j=f.parent();if(f.css("position")=="static"){j.css({position:"relative"});f.css({position:"relative"})}else{var i=f.css("top");if(isNaN(parseInt(i,10))){i="auto"}var h=f.css("left");if(isNaN(parseInt(h,10))){h="auto"}j.css({position:f.css("position"),top:i,left:h,zIndex:f.css("z-index")}).show();f.css({position:"relative",top:0,left:0})}j.css(g);return j},removeWrapper:function(f){if(f.parent().is(".ui-effects-wrapper")){return f.parent().replaceWith(f)}return f},setTransition:function(g,i,f,h){h=h||{};d.each(i,function(k,j){unit=g.cssUnit(j);if(unit[0]>0){h[j]=unit[0]*f+unit[1]}});return h},animateClass:function(h,i,k,j){var f=(typeof k=="function"?k:(j?j:null));var g=(typeof k=="string"?k:null);return this.each(function(){var q={};var o=d(this);var p=o.attr("style")||"";if(typeof p=="object"){p=p.cssText}if(h.toggle){o.hasClass(h.toggle)?h.remove=h.toggle:h.add=h.toggle}var l=d.extend({},(document.defaultView?document.defaultView.getComputedStyle(this,null):this.currentStyle));if(h.add){o.addClass(h.add)}if(h.remove){o.removeClass(h.remove)}var m=d.extend({},(document.defaultView?document.defaultView.getComputedStyle(this,null):this.currentStyle));if(h.add){o.removeClass(h.add)}if(h.remove){o.addClass(h.remove)}for(var r in m){if(typeof m[r]!="function"&&m[r]&&r.indexOf("Moz")==-1&&r.indexOf("length")==-1&&m[r]!=l[r]&&(r.match(/color/i)||(!r.match(/color/i)&&!isNaN(parseInt(m[r],10))))&&(l.position!="static"||(l.position=="static"&&!r.match(/left|top|bottom|right/)))){q[r]=m[r]}}o.animate(q,i,g,function(){if(typeof d(this).attr("style")=="object"){d(this).attr("style")["cssText"]="";d(this).attr("style")["cssText"]=p}else{d(this).attr("style",p)}if(h.add){d(this).addClass(h.add)}if(h.remove){d(this).removeClass(h.remove)}if(f){f.apply(this,arguments)}})})}};function c(g,f){var i=g[1]&&g[1].constructor==Object?g[1]:{};if(f){i.mode=f}var h=g[1]&&g[1].constructor!=Object?g[1]:(i.duration?i.duration:g[2]);h=d.fx.off?0:typeof h==="number"?h:d.fx.speeds[h]||d.fx.speeds._default;var j=i.callback||(d.isFunction(g[1])&&g[1])||(d.isFunction(g[2])&&g[2])||(d.isFunction(g[3])&&g[3]);return[g[0],i,h,j]}d.fn.extend({_show:d.fn.show,_hide:d.fn.hide,__toggle:d.fn.toggle,_addClass:d.fn.addClass,_removeClass:d.fn.removeClass,_toggleClass:d.fn.toggleClass,effect:function(g,f,h,i){return d.effects[g]?d.effects[g].call(this,{method:g,options:f||{},duration:h,callback:i}):null},show:function(){if(!arguments[0]||(arguments[0].constructor==Number||(/(slow|normal|fast)/).test(arguments[0]))){return this._show.apply(this,arguments)}else{return this.effect.apply(this,c(arguments,"show"))}},hide:function(){if(!arguments[0]||(arguments[0].constructor==Number||(/(slow|normal|fast)/).test(arguments[0]))){return this._hide.apply(this,arguments)}else{return this.effect.apply(this,c(arguments,"hide"))}},toggle:function(){if(!arguments[0]||(arguments[0].constructor==Number||(/(slow|normal|fast)/).test(arguments[0]))||(d.isFunction(arguments[0])||typeof arguments[0]=="boolean")){return this.__toggle.apply(this,arguments)}else{return this.effect.apply(this,c(arguments,"toggle"))}},addClass:function(g,f,i,h){return f?d.effects.animateClass.apply(this,[{add:g},f,i,h]):this._addClass(g)},removeClass:function(g,f,i,h){return f?d.effects.animateClass.apply(this,[{remove:g},f,i,h]):this._removeClass(g)},toggleClass:function(g,f,i,h){return((typeof f!=="boolean")&&f)?d.effects.animateClass.apply(this,[{toggle:g},f,i,h]):this._toggleClass(g,f)},morph:function(f,h,g,j,i){return d.effects.animateClass.apply(this,[{add:h,remove:f},g,j,i])},switchClass:function(){return this.morph.apply(this,arguments)},cssUnit:function(f){var g=this.css(f),h=[];d.each(["em","px","%","pt"],function(j,k){if(g.indexOf(k)>0){h=[parseFloat(g),k]}});return h}});d.each(["backgroundColor","borderBottomColor","borderLeftColor","borderRightColor","borderTopColor","color","outlineColor"],function(g,f){d.fx.step[f]=function(h){if(h.state==0){h.start=e(h.elem,f);h.end=b(h.end)}h.elem.style[f]="rgb("+[Math.max(Math.min(parseInt((h.pos*(h.end[0]-h.start[0]))+h.start[0],10),255),0),Math.max(Math.min(parseInt((h.pos*(h.end[1]-h.start[1]))+h.start[1],10),255),0),Math.max(Math.min(parseInt((h.pos*(h.end[2]-h.start[2]))+h.start[2],10),255),0)].join(",")+")"}});function b(g){var f;if(g&&g.constructor==Array&&g.length==3){return g}if(f=/rgb\(\s*([0-9]{1,3})\s*,\s*([0-9]{1,3})\s*,\s*([0-9]{1,3})\s*\)/.exec(g)){return[parseInt(f[1],10),parseInt(f[2],10),parseInt(f[3],10)]}if(f=/rgb\(\s*([0-9]+(?:\.[0-9]+)?)\%\s*,\s*([0-9]+(?:\.[0-9]+)?)\%\s*,\s*([0-9]+(?:\.[0-9]+)?)\%\s*\)/.exec(g)){return[parseFloat(f[1])*2.55,parseFloat(f[2])*2.55,parseFloat(f[3])*2.55]}if(f=/#([a-fA-F0-9]{2})([a-fA-F0-9]{2})([a-fA-F0-9]{2})/.exec(g)){return[parseInt(f[1],16),parseInt(f[2],16),parseInt(f[3],16)]}if(f=/#([a-fA-F0-9])([a-fA-F0-9])([a-fA-F0-9])/.exec(g)){return[parseInt(f[1]+f[1],16),parseInt(f[2]+f[2],16),parseInt(f[3]+f[3],16)]}if(f=/rgba\(0, 0, 0, 0\)/.exec(g)){return a.transparent}return a[d.trim(g).toLowerCase()]}function e(h,f){var g;do{g=d.curCSS(h,f);if(g!=""&&g!="transparent"||d.nodeName(h,"body")){break}f="backgroundColor"}while(h=h.parentNode);return b(g)}var a={aqua:[0,255,255],azure:[240,255,255],beige:[245,245,220],black:[0,0,0],blue:[0,0,255],brown:[165,42,42],cyan:[0,255,255],darkblue:[0,0,139],darkcyan:[0,139,139],darkgrey:[169,169,169],darkgreen:[0,100,0],darkkhaki:[189,183,107],darkmagenta:[139,0,139],darkolivegreen:[85,107,47],darkorange:[255,140,0],darkorchid:[153,50,204],darkred:[139,0,0],darksalmon:[233,150,122],darkviolet:[148,0,211],fuchsia:[255,0,255],gold:[255,215,0],green:[0,128,0],indigo:[75,0,130],khaki:[240,230,140],lightblue:[173,216,230],lightcyan:[224,255,255],lightgreen:[144,238,144],lightgrey:[211,211,211],lightpink:[255,182,193],lightyellow:[255,255,224],lime:[0,255,0],magenta:[255,0,255],maroon:[128,0,0],navy:[0,0,128],olive:[128,128,0],orange:[255,165,0],pink:[255,192,203],purple:[128,0,128],violet:[128,0,128],red:[255,0,0],silver:[192,192,192],white:[255,255,255],yellow:[255,255,0],transparent:[255,255,255]};d.easing.jswing=d.easing.swing;d.extend(d.easing,{def:"easeOutQuad",swing:function(g,h,f,j,i){return d.easing[d.easing.def](g,h,f,j,i)},easeInQuad:function(g,h,f,j,i){return j*(h/=i)*h+f},easeOutQuad:function(g,h,f,j,i){return -j*(h/=i)*(h-2)+f},easeInOutQuad:function(g,h,f,j,i){if((h/=i/2)<1){return j/2*h*h+f}return -j/2*((--h)*(h-2)-1)+f},easeInCubic:function(g,h,f,j,i){return j*(h/=i)*h*h+f},easeOutCubic:function(g,h,f,j,i){return j*((h=h/i-1)*h*h+1)+f},easeInOutCubic:function(g,h,f,j,i){if((h/=i/2)<1){return j/2*h*h*h+f}return j/2*((h-=2)*h*h+2)+f},easeInQuart:function(g,h,f,j,i){return j*(h/=i)*h*h*h+f},easeOutQuart:function(g,h,f,j,i){return -j*((h=h/i-1)*h*h*h-1)+f},easeInOutQuart:function(g,h,f,j,i){if((h/=i/2)<1){return j/2*h*h*h*h+f}return -j/2*((h-=2)*h*h*h-2)+f},easeInQuint:function(g,h,f,j,i){return j*(h/=i)*h*h*h*h+f},easeOutQuint:function(g,h,f,j,i){return j*((h=h/i-1)*h*h*h*h+1)+f},easeInOutQuint:function(g,h,f,j,i){if((h/=i/2)<1){return j/2*h*h*h*h*h+f}return j/2*((h-=2)*h*h*h*h+2)+f},easeInSine:function(g,h,f,j,i){return -j*Math.cos(h/i*(Math.PI/2))+j+f},easeOutSine:function(g,h,f,j,i){return j*Math.sin(h/i*(Math.PI/2))+f},easeInOutSine:function(g,h,f,j,i){return -j/2*(Math.cos(Math.PI*h/i)-1)+f},easeInExpo:function(g,h,f,j,i){return(h==0)?f:j*Math.pow(2,10*(h/i-1))+f},easeOutExpo:function(g,h,f,j,i){return(h==i)?f+j:j*(-Math.pow(2,-10*h/i)+1)+f},easeInOutExpo:function(g,h,f,j,i){if(h==0){return f}if(h==i){return f+j}if((h/=i/2)<1){return j/2*Math.pow(2,10*(h-1))+f}return j/2*(-Math.pow(2,-10*--h)+2)+f},easeInCirc:function(g,h,f,j,i){return -j*(Math.sqrt(1-(h/=i)*h)-1)+f},easeOutCirc:function(g,h,f,j,i){return j*Math.sqrt(1-(h=h/i-1)*h)+f},easeInOutCirc:function(g,h,f,j,i){if((h/=i/2)<1){return -j/2*(Math.sqrt(1-h*h)-1)+f}return j/2*(Math.sqrt(1-(h-=2)*h)+1)+f},easeInElastic:function(g,i,f,m,l){var j=1.70158;var k=0;var h=m;if(i==0){return f}if((i/=l)==1){return f+m}if(!k){k=l*0.3}if(h<Math.abs(m)){h=m;var j=k/4}else{var j=k/(2*Math.PI)*Math.asin(m/h)}return -(h*Math.pow(2,10*(i-=1))*Math.sin((i*l-j)*(2*Math.PI)/k))+f},easeOutElastic:function(g,i,f,m,l){var j=1.70158;var k=0;var h=m;if(i==0){return f}if((i/=l)==1){return f+m}if(!k){k=l*0.3}if(h<Math.abs(m)){h=m;var j=k/4}else{var j=k/(2*Math.PI)*Math.asin(m/h)}return h*Math.pow(2,-10*i)*Math.sin((i*l-j)*(2*Math.PI)/k)+m+f},easeInOutElastic:function(g,i,f,m,l){var j=1.70158;var k=0;var h=m;if(i==0){return f}if((i/=l/2)==2){return f+m}if(!k){k=l*(0.3*1.5)}if(h<Math.abs(m)){h=m;var j=k/4}else{var j=k/(2*Math.PI)*Math.asin(m/h)}if(i<1){return -0.5*(h*Math.pow(2,10*(i-=1))*Math.sin((i*l-j)*(2*Math.PI)/k))+f}return h*Math.pow(2,-10*(i-=1))*Math.sin((i*l-j)*(2*Math.PI)/k)*0.5+m+f},easeInBack:function(g,h,f,k,j,i){if(i==undefined){i=1.70158}return k*(h/=j)*h*((i+1)*h-i)+f},easeOutBack:function(g,h,f,k,j,i){if(i==undefined){i=1.70158}return k*((h=h/j-1)*h*((i+1)*h+i)+1)+f},easeInOutBack:function(g,h,f,k,j,i){if(i==undefined){i=1.70158}if((h/=j/2)<1){return k/2*(h*h*(((i*=(1.525))+1)*h-i))+f}return k/2*((h-=2)*h*(((i*=(1.525))+1)*h+i)+2)+f},easeInBounce:function(g,h,f,j,i){return j-d.easing.easeOutBounce(g,i-h,0,j,i)+f},easeOutBounce:function(g,h,f,j,i){if((h/=i)<(1/2.75)){return j*(7.5625*h*h)+f}else{if(h<(2/2.75)){return j*(7.5625*(h-=(1.5/2.75))*h+0.75)+f}else{if(h<(2.5/2.75)){return j*(7.5625*(h-=(2.25/2.75))*h+0.9375)+f}else{return j*(7.5625*(h-=(2.625/2.75))*h+0.984375)+f}}}},easeInOutBounce:function(g,h,f,j,i){if(h<i/2){return d.easing.easeInBounce(g,h*2,0,j,i)*0.5+f}return d.easing.easeOutBounce(g,h*2-i,0,j,i)*0.5+j*0.5+f}})})(jQuery);;/*
 * jQuery UI Effects Blind 1.7.2
 *
 * Copyright (c) 2009 AUTHORS.txt (http://jqueryui.com/about)
 * Dual licensed under the MIT (MIT-LICENSE.txt)
 * and GPL (GPL-LICENSE.txt) licenses.
 *
 * http://docs.jquery.com/UI/Effects/Blind
 *
 * Depends:
 *	effects.core.js
 */
(function(a){a.effects.blind=function(b){return this.queue(function(){var d=a(this),c=["position","top","left"];var h=a.effects.setMode(d,b.options.mode||"hide");var g=b.options.direction||"vertical";a.effects.save(d,c);d.show();var j=a.effects.createWrapper(d).css({overflow:"hidden"});var e=(g=="vertical")?"height":"width";var i=(g=="vertical")?j.height():j.width();if(h=="show"){j.css(e,0)}var f={};f[e]=h=="show"?i:0;j.animate(f,b.duration,b.options.easing,function(){if(h=="hide"){d.hide()}a.effects.restore(d,c);a.effects.removeWrapper(d);if(b.callback){b.callback.apply(d[0],arguments)}d.dequeue()})})}})(jQuery);;/*
 * jQuery UI Effects Bounce 1.7.2
 *
 * Copyright (c) 2009 AUTHORS.txt (http://jqueryui.com/about)
 * Dual licensed under the MIT (MIT-LICENSE.txt)
 * and GPL (GPL-LICENSE.txt) licenses.
 *
 * http://docs.jquery.com/UI/Effects/Bounce
 *
 * Depends:
 *	effects.core.js
 */
(function(a){a.effects.bounce=function(b){return this.queue(function(){var e=a(this),l=["position","top","left"];var k=a.effects.setMode(e,b.options.mode||"effect");var n=b.options.direction||"up";var c=b.options.distance||20;var d=b.options.times||5;var g=b.duration||250;if(/show|hide/.test(k)){l.push("opacity")}a.effects.save(e,l);e.show();a.effects.createWrapper(e);var f=(n=="up"||n=="down")?"top":"left";var p=(n=="up"||n=="left")?"pos":"neg";var c=b.options.distance||(f=="top"?e.outerHeight({margin:true})/3:e.outerWidth({margin:true})/3);if(k=="show"){e.css("opacity",0).css(f,p=="pos"?-c:c)}if(k=="hide"){c=c/(d*2)}if(k!="hide"){d--}if(k=="show"){var h={opacity:1};h[f]=(p=="pos"?"+=":"-=")+c;e.animate(h,g/2,b.options.easing);c=c/2;d--}for(var j=0;j<d;j++){var o={},m={};o[f]=(p=="pos"?"-=":"+=")+c;m[f]=(p=="pos"?"+=":"-=")+c;e.animate(o,g/2,b.options.easing).animate(m,g/2,b.options.easing);c=(k=="hide")?c*2:c/2}if(k=="hide"){var h={opacity:0};h[f]=(p=="pos"?"-=":"+=")+c;e.animate(h,g/2,b.options.easing,function(){e.hide();a.effects.restore(e,l);a.effects.removeWrapper(e);if(b.callback){b.callback.apply(this,arguments)}})}else{var o={},m={};o[f]=(p=="pos"?"-=":"+=")+c;m[f]=(p=="pos"?"+=":"-=")+c;e.animate(o,g/2,b.options.easing).animate(m,g/2,b.options.easing,function(){a.effects.restore(e,l);a.effects.removeWrapper(e);if(b.callback){b.callback.apply(this,arguments)}})}e.queue("fx",function(){e.dequeue()});e.dequeue()})}})(jQuery);;/*
 * jQuery UI Effects Clip 1.7.2
 *
 * Copyright (c) 2009 AUTHORS.txt (http://jqueryui.com/about)
 * Dual licensed under the MIT (MIT-LICENSE.txt)
 * and GPL (GPL-LICENSE.txt) licenses.
 *
 * http://docs.jquery.com/UI/Effects/Clip
 *
 * Depends:
 *	effects.core.js
 */
(function(a){a.effects.clip=function(b){return this.queue(function(){var f=a(this),j=["position","top","left","height","width"];var i=a.effects.setMode(f,b.options.mode||"hide");var k=b.options.direction||"vertical";a.effects.save(f,j);f.show();var c=a.effects.createWrapper(f).css({overflow:"hidden"});var e=f[0].tagName=="IMG"?c:f;var g={size:(k=="vertical")?"height":"width",position:(k=="vertical")?"top":"left"};var d=(k=="vertical")?e.height():e.width();if(i=="show"){e.css(g.size,0);e.css(g.position,d/2)}var h={};h[g.size]=i=="show"?d:0;h[g.position]=i=="show"?0:d/2;e.animate(h,{queue:false,duration:b.duration,easing:b.options.easing,complete:function(){if(i=="hide"){f.hide()}a.effects.restore(f,j);a.effects.removeWrapper(f);if(b.callback){b.callback.apply(f[0],arguments)}f.dequeue()}})})}})(jQuery);;/*
 * jQuery UI Effects Drop 1.7.2
 *
 * Copyright (c) 2009 AUTHORS.txt (http://jqueryui.com/about)
 * Dual licensed under the MIT (MIT-LICENSE.txt)
 * and GPL (GPL-LICENSE.txt) licenses.
 *
 * http://docs.jquery.com/UI/Effects/Drop
 *
 * Depends:
 *	effects.core.js
 */
(function(a){a.effects.drop=function(b){return this.queue(function(){var e=a(this),d=["position","top","left","opacity"];var i=a.effects.setMode(e,b.options.mode||"hide");var h=b.options.direction||"left";a.effects.save(e,d);e.show();a.effects.createWrapper(e);var f=(h=="up"||h=="down")?"top":"left";var c=(h=="up"||h=="left")?"pos":"neg";var j=b.options.distance||(f=="top"?e.outerHeight({margin:true})/2:e.outerWidth({margin:true})/2);if(i=="show"){e.css("opacity",0).css(f,c=="pos"?-j:j)}var g={opacity:i=="show"?1:0};g[f]=(i=="show"?(c=="pos"?"+=":"-="):(c=="pos"?"-=":"+="))+j;e.animate(g,{queue:false,duration:b.duration,easing:b.options.easing,complete:function(){if(i=="hide"){e.hide()}a.effects.restore(e,d);a.effects.removeWrapper(e);if(b.callback){b.callback.apply(this,arguments)}e.dequeue()}})})}})(jQuery);;/*
 * jQuery UI Effects Explode 1.7.2
 *
 * Copyright (c) 2009 AUTHORS.txt (http://jqueryui.com/about)
 * Dual licensed under the MIT (MIT-LICENSE.txt)
 * and GPL (GPL-LICENSE.txt) licenses.
 *
 * http://docs.jquery.com/UI/Effects/Explode
 *
 * Depends:
 *	effects.core.js
 */
(function(a){a.effects.explode=function(b){return this.queue(function(){var k=b.options.pieces?Math.round(Math.sqrt(b.options.pieces)):3;var e=b.options.pieces?Math.round(Math.sqrt(b.options.pieces)):3;b.options.mode=b.options.mode=="toggle"?(a(this).is(":visible")?"hide":"show"):b.options.mode;var h=a(this).show().css("visibility","hidden");var l=h.offset();l.top-=parseInt(h.css("marginTop"),10)||0;l.left-=parseInt(h.css("marginLeft"),10)||0;var g=h.outerWidth(true);var c=h.outerHeight(true);for(var f=0;f<k;f++){for(var d=0;d<e;d++){h.clone().appendTo("body").wrap("<div></div>").css({position:"absolute",visibility:"visible",left:-d*(g/e),top:-f*(c/k)}).parent().addClass("ui-effects-explode").css({position:"absolute",overflow:"hidden",width:g/e,height:c/k,left:l.left+d*(g/e)+(b.options.mode=="show"?(d-Math.floor(e/2))*(g/e):0),top:l.top+f*(c/k)+(b.options.mode=="show"?(f-Math.floor(k/2))*(c/k):0),opacity:b.options.mode=="show"?0:1}).animate({left:l.left+d*(g/e)+(b.options.mode=="show"?0:(d-Math.floor(e/2))*(g/e)),top:l.top+f*(c/k)+(b.options.mode=="show"?0:(f-Math.floor(k/2))*(c/k)),opacity:b.options.mode=="show"?1:0},b.duration||500)}}setTimeout(function(){b.options.mode=="show"?h.css({visibility:"visible"}):h.css({visibility:"visible"}).hide();if(b.callback){b.callback.apply(h[0])}h.dequeue();a("div.ui-effects-explode").remove()},b.duration||500)})}})(jQuery);;/*
 * jQuery UI Effects Fold 1.7.2
 *
 * Copyright (c) 2009 AUTHORS.txt (http://jqueryui.com/about)
 * Dual licensed under the MIT (MIT-LICENSE.txt)
 * and GPL (GPL-LICENSE.txt) licenses.
 *
 * http://docs.jquery.com/UI/Effects/Fold
 *
 * Depends:
 *	effects.core.js
 */
(function(a){a.effects.fold=function(b){return this.queue(function(){var e=a(this),k=["position","top","left"];var h=a.effects.setMode(e,b.options.mode||"hide");var o=b.options.size||15;var n=!(!b.options.horizFirst);var g=b.duration?b.duration/2:a.fx.speeds._default/2;a.effects.save(e,k);e.show();var d=a.effects.createWrapper(e).css({overflow:"hidden"});var i=((h=="show")!=n);var f=i?["width","height"]:["height","width"];var c=i?[d.width(),d.height()]:[d.height(),d.width()];var j=/([0-9]+)%/.exec(o);if(j){o=parseInt(j[1],10)/100*c[h=="hide"?0:1]}if(h=="show"){d.css(n?{height:0,width:o}:{height:o,width:0})}var m={},l={};m[f[0]]=h=="show"?c[0]:o;l[f[1]]=h=="show"?c[1]:0;d.animate(m,g,b.options.easing).animate(l,g,b.options.easing,function(){if(h=="hide"){e.hide()}a.effects.restore(e,k);a.effects.removeWrapper(e);if(b.callback){b.callback.apply(e[0],arguments)}e.dequeue()})})}})(jQuery);;/*
 * jQuery UI Effects Highlight 1.7.2
 *
 * Copyright (c) 2009 AUTHORS.txt (http://jqueryui.com/about)
 * Dual licensed under the MIT (MIT-LICENSE.txt)
 * and GPL (GPL-LICENSE.txt) licenses.
 *
 * http://docs.jquery.com/UI/Effects/Highlight
 *
 * Depends:
 *	effects.core.js
 */
(function(a){a.effects.highlight=function(b){return this.queue(function(){var e=a(this),d=["backgroundImage","backgroundColor","opacity"];var h=a.effects.setMode(e,b.options.mode||"show");var c=b.options.color||"#ffff99";var g=e.css("backgroundColor");a.effects.save(e,d);e.show();e.css({backgroundImage:"none",backgroundColor:c});var f={backgroundColor:g};if(h=="hide"){f.opacity=0}e.animate(f,{queue:false,duration:b.duration,easing:b.options.easing,complete:function(){if(h=="hide"){e.hide()}a.effects.restore(e,d);if(h=="show"&&a.browser.msie){this.style.removeAttribute("filter")}if(b.callback){b.callback.apply(this,arguments)}e.dequeue()}})})}})(jQuery);;/*
 * jQuery UI Effects Pulsate 1.7.2
 *
 * Copyright (c) 2009 AUTHORS.txt (http://jqueryui.com/about)
 * Dual licensed under the MIT (MIT-LICENSE.txt)
 * and GPL (GPL-LICENSE.txt) licenses.
 *
 * http://docs.jquery.com/UI/Effects/Pulsate
 *
 * Depends:
 *	effects.core.js
 */
(function(a){a.effects.pulsate=function(b){return this.queue(function(){var d=a(this);var g=a.effects.setMode(d,b.options.mode||"show");var f=b.options.times||5;var e=b.duration?b.duration/2:a.fx.speeds._default/2;if(g=="hide"){f--}if(d.is(":hidden")){d.css("opacity",0);d.show();d.animate({opacity:1},e,b.options.easing);f=f-2}for(var c=0;c<f;c++){d.animate({opacity:0},e,b.options.easing).animate({opacity:1},e,b.options.easing)}if(g=="hide"){d.animate({opacity:0},e,b.options.easing,function(){d.hide();if(b.callback){b.callback.apply(this,arguments)}})}else{d.animate({opacity:0},e,b.options.easing).animate({opacity:1},e,b.options.easing,function(){if(b.callback){b.callback.apply(this,arguments)}})}d.queue("fx",function(){d.dequeue()});d.dequeue()})}})(jQuery);;/*
 * jQuery UI Effects Scale 1.7.2
 *
 * Copyright (c) 2009 AUTHORS.txt (http://jqueryui.com/about)
 * Dual licensed under the MIT (MIT-LICENSE.txt)
 * and GPL (GPL-LICENSE.txt) licenses.
 *
 * http://docs.jquery.com/UI/Effects/Scale
 *
 * Depends:
 *	effects.core.js
 */
(function(a){a.effects.puff=function(b){return this.queue(function(){var f=a(this);var c=a.extend(true,{},b.options);var h=a.effects.setMode(f,b.options.mode||"hide");var g=parseInt(b.options.percent,10)||150;c.fade=true;var e={height:f.height(),width:f.width()};var d=g/100;f.from=(h=="hide")?e:{height:e.height*d,width:e.width*d};c.from=f.from;c.percent=(h=="hide")?g:100;c.mode=h;f.effect("scale",c,b.duration,b.callback);f.dequeue()})};a.effects.scale=function(b){return this.queue(function(){var g=a(this);var d=a.extend(true,{},b.options);var j=a.effects.setMode(g,b.options.mode||"effect");var h=parseInt(b.options.percent,10)||(parseInt(b.options.percent,10)==0?0:(j=="hide"?0:100));var i=b.options.direction||"both";var c=b.options.origin;if(j!="effect"){d.origin=c||["middle","center"];d.restore=true}var f={height:g.height(),width:g.width()};g.from=b.options.from||(j=="show"?{height:0,width:0}:f);var e={y:i!="horizontal"?(h/100):1,x:i!="vertical"?(h/100):1};g.to={height:f.height*e.y,width:f.width*e.x};if(b.options.fade){if(j=="show"){g.from.opacity=0;g.to.opacity=1}if(j=="hide"){g.from.opacity=1;g.to.opacity=0}}d.from=g.from;d.to=g.to;d.mode=j;g.effect("size",d,b.duration,b.callback);g.dequeue()})};a.effects.size=function(b){return this.queue(function(){var c=a(this),n=["position","top","left","width","height","overflow","opacity"];var m=["position","top","left","overflow","opacity"];var j=["width","height","overflow"];var p=["fontSize"];var k=["borderTopWidth","borderBottomWidth","paddingTop","paddingBottom"];var f=["borderLeftWidth","borderRightWidth","paddingLeft","paddingRight"];var g=a.effects.setMode(c,b.options.mode||"effect");var i=b.options.restore||false;var e=b.options.scale||"both";var o=b.options.origin;var d={height:c.height(),width:c.width()};c.from=b.options.from||d;c.to=b.options.to||d;if(o){var h=a.effects.getBaseline(o,d);c.from.top=(d.height-c.from.height)*h.y;c.from.left=(d.width-c.from.width)*h.x;c.to.top=(d.height-c.to.height)*h.y;c.to.left=(d.width-c.to.width)*h.x}var l={from:{y:c.from.height/d.height,x:c.from.width/d.width},to:{y:c.to.height/d.height,x:c.to.width/d.width}};if(e=="box"||e=="both"){if(l.from.y!=l.to.y){n=n.concat(k);c.from=a.effects.setTransition(c,k,l.from.y,c.from);c.to=a.effects.setTransition(c,k,l.to.y,c.to)}if(l.from.x!=l.to.x){n=n.concat(f);c.from=a.effects.setTransition(c,f,l.from.x,c.from);c.to=a.effects.setTransition(c,f,l.to.x,c.to)}}if(e=="content"||e=="both"){if(l.from.y!=l.to.y){n=n.concat(p);c.from=a.effects.setTransition(c,p,l.from.y,c.from);c.to=a.effects.setTransition(c,p,l.to.y,c.to)}}a.effects.save(c,i?n:m);c.show();a.effects.createWrapper(c);c.css("overflow","hidden").css(c.from);if(e=="content"||e=="both"){k=k.concat(["marginTop","marginBottom"]).concat(p);f=f.concat(["marginLeft","marginRight"]);j=n.concat(k).concat(f);c.find("*[width]").each(function(){child=a(this);if(i){a.effects.save(child,j)}var q={height:child.height(),width:child.width()};child.from={height:q.height*l.from.y,width:q.width*l.from.x};child.to={height:q.height*l.to.y,width:q.width*l.to.x};if(l.from.y!=l.to.y){child.from=a.effects.setTransition(child,k,l.from.y,child.from);child.to=a.effects.setTransition(child,k,l.to.y,child.to)}if(l.from.x!=l.to.x){child.from=a.effects.setTransition(child,f,l.from.x,child.from);child.to=a.effects.setTransition(child,f,l.to.x,child.to)}child.css(child.from);child.animate(child.to,b.duration,b.options.easing,function(){if(i){a.effects.restore(child,j)}})})}c.animate(c.to,{queue:false,duration:b.duration,easing:b.options.easing,complete:function(){if(g=="hide"){c.hide()}a.effects.restore(c,i?n:m);a.effects.removeWrapper(c);if(b.callback){b.callback.apply(this,arguments)}c.dequeue()}})})}})(jQuery);;/*
 * jQuery UI Effects Shake 1.7.2
 *
 * Copyright (c) 2009 AUTHORS.txt (http://jqueryui.com/about)
 * Dual licensed under the MIT (MIT-LICENSE.txt)
 * and GPL (GPL-LICENSE.txt) licenses.
 *
 * http://docs.jquery.com/UI/Effects/Shake
 *
 * Depends:
 *	effects.core.js
 */
(function(a){a.effects.shake=function(b){return this.queue(function(){var e=a(this),l=["position","top","left"];var k=a.effects.setMode(e,b.options.mode||"effect");var n=b.options.direction||"left";var c=b.options.distance||20;var d=b.options.times||3;var g=b.duration||b.options.duration||140;a.effects.save(e,l);e.show();a.effects.createWrapper(e);var f=(n=="up"||n=="down")?"top":"left";var p=(n=="up"||n=="left")?"pos":"neg";var h={},o={},m={};h[f]=(p=="pos"?"-=":"+=")+c;o[f]=(p=="pos"?"+=":"-=")+c*2;m[f]=(p=="pos"?"-=":"+=")+c*2;e.animate(h,g,b.options.easing);for(var j=1;j<d;j++){e.animate(o,g,b.options.easing).animate(m,g,b.options.easing)}e.animate(o,g,b.options.easing).animate(h,g/2,b.options.easing,function(){a.effects.restore(e,l);a.effects.removeWrapper(e);if(b.callback){b.callback.apply(this,arguments)}});e.queue("fx",function(){e.dequeue()});e.dequeue()})}})(jQuery);;/*
 * jQuery UI Effects Slide 1.7.2
 *
 * Copyright (c) 2009 AUTHORS.txt (http://jqueryui.com/about)
 * Dual licensed under the MIT (MIT-LICENSE.txt)
 * and GPL (GPL-LICENSE.txt) licenses.
 *
 * http://docs.jquery.com/UI/Effects/Slide
 *
 * Depends:
 *	effects.core.js
 */
(function(a){a.effects.slide=function(b){return this.queue(function(){var e=a(this),d=["position","top","left"];var i=a.effects.setMode(e,b.options.mode||"show");var h=b.options.direction||"left";a.effects.save(e,d);e.show();a.effects.createWrapper(e).css({overflow:"hidden"});var f=(h=="up"||h=="down")?"top":"left";var c=(h=="up"||h=="left")?"pos":"neg";var j=b.options.distance||(f=="top"?e.outerHeight({margin:true}):e.outerWidth({margin:true}));if(i=="show"){e.css(f,c=="pos"?-j:j)}var g={};g[f]=(i=="show"?(c=="pos"?"+=":"-="):(c=="pos"?"-=":"+="))+j;e.animate(g,{queue:false,duration:b.duration,easing:b.options.easing,complete:function(){if(i=="hide"){e.hide()}a.effects.restore(e,d);a.effects.removeWrapper(e);if(b.callback){b.callback.apply(this,arguments)}e.dequeue()}})})}})(jQuery);;/*
 * jQuery UI Effects Transfer 1.7.2
 *
 * Copyright (c) 2009 AUTHORS.txt (http://jqueryui.com/about)
 * Dual licensed under the MIT (MIT-LICENSE.txt)
 * and GPL (GPL-LICENSE.txt) licenses.
 *
 * http://docs.jquery.com/UI/Effects/Transfer
 *
 * Depends:
 *	effects.core.js
 */
(function(a){a.effects.transfer=function(b){return this.queue(function(){var f=a(this),h=a(b.options.to),e=h.offset(),g={top:e.top,left:e.left,height:h.innerHeight(),width:h.innerWidth()},d=f.offset(),c=a('<div class="ui-effects-transfer"></div>').appendTo(document.body).addClass(b.options.className).css({top:d.top,left:d.left,height:f.innerHeight(),width:f.innerWidth(),position:"absolute"}).animate(g,b.duration,b.options.easing,function(){c.remove();(b.callback&&b.callback.apply(f[0],arguments));f.dequeue()})})}})(jQuery);;
/*
 * END OF FILE - /trunk/3rd/jquery/ui.all.js
 */

/*
 * START OF FILE - /trunk/3rd/jquery/ui.layout.js
 */
/*!
 * jquery.layout 1.3.0 - Release Candidate 14
 *
 * Copyright (c) 2009 
 *   Fabrizio Balliano (http://www.fabrizioballiano.net)
 *   Kevin Dalman (http://allpro.net)
 *
 * Dual licensed under the GPL (http://www.gnu.org/licenses/gpl.html)
 * and MIT (http://www.opensource.org/licenses/mit-license.php) licenses.
 *
 * Docs: http://layout.jquery-dev.net/documentation.html
 * Tips: http://layout.jquery-dev.net/tips.html
 * Help: http://groups.google.com/group/jquery-ui-layout
 *
 * $Date: 2009-11-05 08:00:00 -0800 (Thu, 5 Nov 2009) $
 * $Rev: 203 $
 * 
 * NOTE: For best code readability, view this with a fixed-width font and tabs equal to 4-chars
 */
;(function ($) {

$.fn.layout = function (opts) {

/*
 * ###########################
 *   WIDGET CONFIG & OPTIONS
 * ###########################
 */

	// LANGUAGE CUSTOMIZATION - will be *externally customizable* in next version
	var lang = {
		Pane:		"Pane"
	,	Open:		"Open"	// eg: "Open Pane"
	,	Close:		"Close"
	,	Resize:		"Resize"
	,	Slide:		"Slide Open"
	,	Pin:		"Pin"
	,	Unpin:		"Un-Pin"
	,	selector:	"selector"
	,	msgNoRoom:	"Not enough room to show this pane."
	,	errContainerMissing:	"UI.Layout Initialization Error\n\nThe specified layout-container does not exist."
	,	errContainerHeight:		"UI.Layout Initialization Error\n\nThe layout-container \"CONTAINER\" has no height!"
	,	errButton:				"Error Adding Button \n\nInvalid "
	};

	// DEFAULT OPTIONS - CHANGE IF DESIRED
	var options = {
		name:						""			// Not required, but useful for buttons and used for the state-cookie
	,	scrollToBookmarkOnLoad:		true		// after creating a layout, scroll to bookmark in URL (.../page.htm#myBookmark)
	,	resizeWithWindow:			true		// bind thisLayout.resizeAll() to the window.resize event
	,	resizeWithWindowDelay:		200			// delay calling resizeAll because makes window resizing very jerky
	,	onresizeall_start:			null		// CALLBACK when resizeAll() STARTS	- NOT pane-specific
	,	onresizeall_end:			null		// CALLBACK when resizeAll() ENDS	- NOT pane-specific
	,	onload:						null		// CALLBACK when Layout inits - after options initialized, but before elements
	,	onunload:					null		// CALLBACK when Layout is destroyed OR onWindowUnload
	,	autoBindCustomButtons:		false		// search for buttons with ui-layout-button class and auto-bind them
	//	PANE SETTINGS
	,	defaults: { // default options for 'all panes' - will be overridden by 'per-pane settings'
			applyDemoStyles: 		false		// NOTE: renamed from applyDefaultStyles for clarity
		,	closable:				true		// pane can open & close
		,	resizable:				true		// when open, pane can be resized 
		,	slidable:				true		// when closed, pane can 'slide open' over other panes - closes on mouse-out
		,	initClosed:				false		// true = init pane as 'closed'
		,	initHidden: 			false 		// true = init pane as 'hidden' - no resizer-bar/spacing
		//	SELECTORS
		//,	paneSelector:			""			// MUST be pane-specific - jQuery selector for pane
		,	contentSelector:		".ui-layout-content" // INNER div/element to auto-size so only it scrolls, not the entire pane!
		,	contentIgnoreSelector:	".ui-layout-ignore"	// element(s) to 'ignore' when measuring 'content'
		//	GENERIC ROOT-CLASSES - for auto-generated classNames
		,	paneClass:				"ui-layout-pane"	// border-Pane - default: 'ui-layout-pane'
		,	resizerClass:			"ui-layout-resizer"	// Resizer Bar		- default: 'ui-layout-resizer'
		,	togglerClass:			"ui-layout-toggler"	// Toggler Button	- default: 'ui-layout-toggler'
		,	buttonClass:			"ui-layout-button"	// CUSTOM Buttons	- default: 'ui-layout-button-toggle/-open/-close/-pin'
		//	ELEMENT SIZE & SPACING
		//,	size:					100			// MUST be pane-specific -initial size of pane
		,	minSize:				0			// when manually resizing a pane
		,	maxSize:				0			// ditto, 0 = no limit
		,	spacing_open:			6			// space between pane and adjacent panes - when pane is 'open'
		,	spacing_closed:			6			// ditto - when pane is 'closed'
		,	togglerLength_open:		50			// Length = WIDTH of toggler button on north/south sides - HEIGHT on east/west sides
		,	togglerLength_closed: 	50			// 100% OR -1 means 'full height/width of resizer bar' - 0 means 'hidden'
		,	togglerAlign_open:		"center"	// top/left, bottom/right, center, OR...
		,	togglerAlign_closed:	"center"	// 1 => nn = offset from top/left, -1 => -nn == offset from bottom/right
		,	togglerTip_open:		lang.Close	// Toggler tool-tip (title)
		,	togglerTip_closed:		lang.Open	// ditto
		//	RESIZING OPTIONS
		,	noSelectionWhileDragging: true		// set $(document).disableSelection to avoid selecting text while dragging the resizer
		,	autoResize:				true		// IF size is 'auto' or a percentage, then recalc 'pixel size' whenever the layout resizes
		,	autoReopen:				true		// IF a pane was auto-closed due to noRoom, reopen it when there is room? False = leave it closed
		,	resizerDragOpacity:		1			// option for ui.draggable
		//,	resizerCursor:			""			// MUST be pane-specific - cursor when over resizer-bar
		,	maskIframesOnResize:	true		// true = all iframes OR = iframe-selector(s) - adds masking-div during resizing/dragging
		,	resizeWhileDragging:	false		// true = LIVE Resizing as resizer is dragged
		//	TIPS & MESSAGES - also see lang object
		,	noRoomToOpenTip:		lang.msgNoRoom
		,	resizerTip:				lang.Resize	// Resizer tool-tip (title)
		,	sliderTip:				lang.Slide // resizer-bar triggers 'sliding' when pane is closed
		,	sliderCursor:			"pointer"	// cursor when resizer-bar will trigger 'sliding'
		,	slideTrigger_open:		"click"		// click, dblclick, mouseover
		,	slideTrigger_close:		"mouseout"	// click, mouseout
		,	hideTogglerOnSlide:		false		// when pane is slid-open, should the toggler show?
		,	togglerContent_open:	""			// text or HTML to put INSIDE the toggler
		,	togglerContent_closed:	""			// ditto
		//	HOT-KEYS & MISC
		,	showOverflowOnHover:	false		// will bind allowOverflow() utility to pane.onMouseOver
		,	enableCursorHotkey:		true		// enabled 'cursor' hotkeys
		//,	customHotkey:			""			// MUST be pane-specific - EITHER a charCode OR a character
		,	customHotkeyModifier:	"SHIFT"		// either 'SHIFT', 'CTRL' or 'CTRL+SHIFT' - NOT 'ALT'
		//	PANE ANIMATION
		//	NOTE: fxSss_open & fxSss_close options (eg: fxName_open) are auto-generated if not passed
		,	fxName:					"slide" 	// ('none' or blank), slide, drop, scale
		,	fxSpeed:				null		// slow, normal, fast, 200, nnn - if passed, will OVERRIDE fxSettings.duration
		,	fxSettings:				{}			// can be passed, eg: { easing: "easeOutBounce", duration: 1500 }
		,	fxOpacityFix:			true		// tries to fix opacity in IE to restore anti-aliasing after animation
		//	CALLBACKS
		,	triggerEventsOnLoad:	true		// true = trigger onopen OR onclose callbacks when layout initializes
		,	onshow_start:			null		// CALLBACK when pane STARTS to Show	- BEFORE onopen/onhide_start
		,	onshow_end:				null		// CALLBACK when pane ENDS being Shown	- AFTER  onopen/onhide_end
		,	onhide_start:			null		// CALLBACK when pane STARTS to Close	- BEFORE onclose_start
		,	onhide_end:				null		// CALLBACK when pane ENDS being Closed	- AFTER  onclose_end
		,	onopen_start:			null		// CALLBACK when pane STARTS to Open
		,	onopen_end:				null		// CALLBACK when pane ENDS being Opened
		,	onclose_start:			null		// CALLBACK when pane STARTS to Close
		,	onclose_end:			null		// CALLBACK when pane ENDS being Closed
		,	onresize_start:			null		// CALLBACK when pane STARTS to be ***MANUALLY*** Resized
		,	onresize_end:			null		// CALLBACK when pane ENDS being Resized ***FOR ANY REASON***
		}
	,	north: {
			paneSelector:			".ui-layout-north"
		,	size:					"auto"		// eg: "auto", "30%", 200
		,	resizerCursor:			"n-resize"	// custom = url(myCursor.cur)
		,	customHotkey:			""			// EITHER a charCode OR a character
		}
	,	south: {
			paneSelector:			".ui-layout-south"
		,	size:					"auto"
		,	resizerCursor:			"s-resize"
		,	customHotkey:			""
		}
	,	east: {
			paneSelector:			".ui-layout-east"
		,	size:					200
		,	resizerCursor:			"e-resize"
		,	customHotkey:			""
		}
	,	west: {
			paneSelector:			".ui-layout-west"
		,	size:					200
		,	resizerCursor:			"w-resize"
		,	customHotkey:			""
		}
	,	center: {
			paneSelector:			".ui-layout-center"
		,	minWidth:				0
		,	minHeight:				0
		}

	//	STATE MANAGMENT
	,	useStateCookie:				false		// Enable cookie-based state-management - can fine-tune with cookie.autoLoad/autoSave
	,	cookie: {
			name:					""			// If not specified, will use Layout.name, else just "Layout"
		,	autoSave:				true		// Save a state cookie when page exits?
		,	autoLoad:				true		// Load the state cookie when Layout inits?
		//	Cookie Options
		,	domain:					""
		,	path:					""
		,	expires:				""			// 'days' to keep cookie - leave blank for 'session cookie'
		,	secure:					false
		//	List of options to save in the cookie - must be pane-specific
		,	keys:					"north.size,south.size,east.size,west.size,"+
									"north.isClosed,south.isClosed,east.isClosed,west.isClosed,"+
									"north.isHidden,south.isHidden,east.isHidden,west.isHidden"
		}
	};


	// PREDEFINED EFFECTS / DEFAULTS
	var effects = { // LIST *PREDEFINED EFFECTS* HERE, even if effect has no settings
		slide:	{
			all:	{ duration:  "fast"	} // eg: duration: 1000, easing: "easeOutBounce"
		,	north:	{ direction: "up"	}
		,	south:	{ direction: "down"	}
		,	east:	{ direction: "right"}
		,	west:	{ direction: "left"	}
		}
	,	drop:	{
			all:	{ duration:  "slow"	} // eg: duration: 1000, easing: "easeOutQuint"
		,	north:	{ direction: "up"	}
		,	south:	{ direction: "down"	}
		,	east:	{ direction: "right"}
		,	west:	{ direction: "left"	}
		}
	,	scale:	{
			all:	{ duration:  "fast"	}
		}
	};


	// DYNAMIC DATA - READ-ONLY EXTERNALLY!
	var state = {
		// generate random 'ID#' to identify layout - used to create global namespace for timers & events
		id:			"layout"+ Math.floor(Math.random() * 10000)
	,	initialized: false
	,	container:	{}
	,	north:		{}
	,	south:		{}
	,	east:		{}
	,	west:		{}
	,	center:		{}
	,	cookie:		{} // State Managment data storage
	};


	// INTERNAL CONFIG DATA - DO NOT CHANGE THIS!
	var _c = {
		allPanes:		"north,south,west,east,center"
	,	borderPanes:	"north,south,west,east"
	,	altSide: {
			north:	"south"
		,	south:	"north"
		,	east: 	"west"
		,	west: 	"east"
		}
	//	CSS used in multiple places
	,	hidden:  { visibility: "hidden" }
	,	visible: { visibility: "visible" }
	//	layout element settings
	,	zIndex: { // set z-index values here
			pane_normal:	1		// normal z-index for panes
		,	resizer_normal:	2		// normal z-index for resizer-bars
		,	iframe_mask:	2		// overlay div used to mask pane(s) during resizing
		,	pane_sliding:	100		// applied to *BOTH* the pane and its resizer when a pane is 'slid open'
		,	pane_animate:	1000	// applied to the pane when being animated - not applied to the resizer
		,	resizer_drag:	10000	// applied to the CLONED resizer-bar when being 'dragged'
		}
	,	resizers: {
			cssReq: {
				position: 	"absolute"
			,	padding: 	0
			,	margin: 	0
			,	fontSize:	"1px"
			,	textAlign:	"left"	// to counter-act "center" alignment!
			,	overflow: 	"hidden" // keep toggler button from overflowing
			,	zIndex: 	2		// = c.zIndex.resizer_normal
			}
		,	cssDemo: { // DEMO CSS - applied if: options.PANE.applyDemoStyles=true
				background: "#DDD"
			,	border:		"none"
			}
		}
	,	togglers: {
			cssReq: {
				position: 	"absolute"
			,	display: 	"block"
			,	padding: 	0
			,	margin: 	0
			,	overflow:	"hidden"
			,	textAlign:	"center"
			,	fontSize:	"1px"
			,	cursor: 	"pointer"
			,	zIndex: 	1
			}
		,	cssDemo: { // DEMO CSS - applied if: options.PANE.applyDemoStyles=true
				background: "#AAA"
			}
		}
	,	content: {
			cssReq: {
				position:	"relative" /* contain floated or positioned elements */
			}
		,	cssDemo: {
				overflow:	"auto"
			,	padding:	"10px"
			}
		,	cssDemoPane: { /* REMOVE scrolling from 'pane' when it has a content-div */
				overflow:	"hidden"
			,	padding:	0
			}
		}
	,	defaults: { // defaults for ALL panes - overridden by 'per-pane settings' below
			cssReq: {
				position: 	"absolute"
			,	margin:		0
			,	zIndex: 	1 // = c.zIndex.pane_normal
			}
		,	cssDemo: {
				padding:	"10px"
			,	background:	"#FFF"
			,	border:		"1px solid #BBB"
			,	overflow:	"auto"
			}
		}
	,	north: {
			side:			"Top"
		,	sizeType:		"Height"
		,	dir:			"horz"
		,	cssReq: {
				top: 		0
			,	bottom: 	"auto"
			,	left: 		0
			,	right: 		0
			,	width: 		"auto"
			//	height: 	DYNAMIC
			}
		,	pins:			[]
		}
	,	south: {
			side:			"Bottom"
		,	sizeType:		"Height"
		,	dir:			"horz"
		,	cssReq: {
				top: 		"auto"
			,	bottom: 	0
			,	left: 		0
			,	right: 		0
			,	width: 		"auto"
			//	height: 	DYNAMIC
			}
		,	pins:			[]
		}
	,	east: {
			side:			"Right"
		,	sizeType:		"Width"
		,	dir:			"vert"
		,	cssReq: {
				left: 		"auto"
			,	right: 		0
			,	top: 		"auto" // DYNAMIC
			,	bottom: 	"auto" // DYNAMIC
			,	height: 	"auto"
			//	width: 		DYNAMIC
			}
		,	pins:			[]
		}
	,	west: {
			side:			"Left"
		,	sizeType:		"Width"
		,	dir:			"vert"
		,	cssReq: {
				left: 		0
			,	right: 		"auto"
			,	top: 		"auto" // DYNAMIC
			,	bottom: 	"auto" // DYNAMIC
			,	height: 	"auto"
			//	width: 		DYNAMIC
			}
		,	pins:			[]
		}
	,	center: {
			dir:			"center"
		,	cssReq: {
				left: 		"auto" // DYNAMIC
			,	right: 		"auto" // DYNAMIC
			,	top: 		"auto" // DYNAMIC
			,	bottom: 	"auto" // DYNAMIC
			,	height: 	"auto"
			,	width: 		"auto"
			}
		}
	//	internal tracking
	,	timers: {}
	};


/*
 * ###########################
 *  INTERNAL HELPER FUNCTIONS
 * ###########################
 */

	/**
	 * min / max
	 *
	 * Aliases for Math methods to simplify coding
	 */
	var min = function (x,y) { return Math.min(x,y); };
	var max = function (x,y) { return Math.max(x,y); };

	/**
	 * _transformData
	 *
	 * Processes the options passed in and transforms them into the format used by layout()
	 * Missing keys are added, and converts the data if passed in 'flat-format' (no sub-keys)
	 * In flat-format, pane-specific-settings are prefixed like: north__optName  (2-underscores)
	 * To update effects, options MUST use nested-keys format, with an effects key ???
	 *
	 * @callers	initOptions()
	 * @params  JSON	d	Data/options passed by user - may be a single level or nested levels
	 * @returns JSON		Creates a data struture that perfectly matches 'options', ready to be imported
	 */
	var _transformData = function (d) {
		var json = { cookie:{}, defaults:{fxSettings:{}}, north:{fxSettings:{}}, south:{fxSettings:{}}, east:{fxSettings:{}}, west:{fxSettings:{}}, center:{fxSettings:{}} };
		d = d || {};
		if (d.effects || d.cookie || d.defaults || d.north || d.south || d.west || d.east || d.center)
			json = $.extend( true, json, d ); // already in json format - add to base keys
		else
			// convert 'flat' to 'nest-keys' format - also handles 'empty' user-options
			$.each( d, function (key,val) {
				a = key.split("__");
				if (!a[1] || json[a[0]]) // check for invalid keys
					json[ a[1] ? a[0] : "defaults" ][ a[1] ? a[1] : a[0] ] = val;
			});
		return json;
	};

	/**
	 * _queue
	 *
	 * Set an INTERNAL callback to avoid simultaneous animation
	 * Runs only if needed and only if all callbacks are not 'already set'
	 * Called by open() and close() when isLayoutBusy=true
	 *
	 * @param String   action  Either 'open' or 'close'
	 * @param String   pane    A valid border-pane name, eg 'west'
	 * @param Boolean  param   Extra param for callback (optional)
	 */
	var _queue = function (action, pane, param) {
		var tried = [];

		// if isLayoutBusy, then some pane must be 'moving'
		$.each(_c.borderPanes.split(","), function (i, p) {
			if (_c[p].isMoving) {
				bindCallback(p); // TRY to bind a callback
				return false;	// BREAK
			}
		});

		// if pane does NOT have a callback, then add one, else follow the callback chain...
		function bindCallback (p) {
			var c = _c[p];
			if (!c.doCallback) {
				c.doCallback = true;
				c.callback = action +","+ pane +","+ (param ? 1 : 0);
			}
			else { // try to 'chain' this callback
				tried.push(p);
				var cbPane = c.callback.split(",")[1]; // 2nd param of callback is 'pane'
				// ensure callback target NOT 'itself' and NOT 'target pane' and NOT already tried (avoid loop)
				if (cbPane != p && cbPane != pane && !$.inArray(p, tried))
					bindCallback(cbPane); // RECURSE
			}
		}
	};

	/**
	 * _dequeue
	 *
	 * RUN the INTERNAL callback for this pane - if one exists
	 *
	 * @param String   action  Either 'open' or 'close'
	 * @param String   pane    A valid border-pane name, eg 'west'
	 * @param Boolean  param   Extra param for callback (optional)
	 */
	var _dequeue = function (pane) {
		var c = _c[pane];

		// RESET flow-control flags
		_c.isLayoutBusy = false;
		delete c.isMoving;
		if (!c.doCallback || !c.callback) return;

		c.doCallback = false; // RESET logic flag

		// EXECUTE the callback
		var
			cb = c.callback.split(",")
		,	param = (cb[2] > 0 ? true : false)
		;
		if (cb[0] == "open")
			open( cb[1], param  );
		else if (cb[0] == "close")
			close( cb[1], param );

		if (!c.doCallback) c.callback = null; // RESET - unless callback above enabled it again!
	};

	/**
	 * _execCallback
	 *
	 * Executes a Callback function after a trigger event, like resize, open or close
	 *
	 * @param String  pane   This is passed only so we can pass the 'pane object' to the callback
	 * @param String  v_fn  Accepts a function name, OR a comma-delimited array: [0]=function name, [1]=argument
	 */
	var _execCallback = function (pane, v_fn) {
		if (!v_fn) return;
		var fn;
		try {
			if (typeof v_fn == "function")
				fn = v_fn;	
			else if (typeof v_fn != "string")
				return;
			else if (v_fn.indexOf(",") > 0) {
				// function name cannot contain a comma, so must be a function name AND a 'name' parameter
				var
					args = v_fn.split(",")
				,	fn = eval(args[0])
				;
				if (typeof fn=="function" && args.length > 1)
					return fn(args[1]); // pass the argument parsed from 'list'
			}
			else // just the name of an external function?
				fn = eval(v_fn);

			if (typeof fn=="function") {
				if (pane && $Ps[pane])
					// pass data: pane-name, pane-element, pane-state (copy), pane-options, and layout-name
					return fn( pane, $Ps[pane], $.extend({},state[pane]), options[pane], options.name );
				else // must be a layout/container callback - pass suitable info
					return fn( Instance, $.extend({},state), options, options.name );
			}
		}
		catch (ex) {}
	};

	/**
	 * _showInvisibly
	 *
	 * Returns hash container 'display' and 'visibility'
	 */
	var _showInvisibly = function ($E, force) {
		if (!$E) return {};
		if (!$E.jquery) $E = $($E);
		var CSS = {
			display:	$E.css('display')
		,	visibility:	$E.css('visibility')
		};
		if (force || CSS.display == "none") { // only if not *already hidden*
			$E.css({ display: "block", visibility: "hidden" }); // show element 'invisibly' so can be measured
			return CSS;
		}
		else return {};
	};

	/**
	 * _cssNum
	 *
	 * Returns the 'current CSS value' for an element - returns 0 if property does not exist
	 *
	 * @callers  Called by many methods
	 * @param jQuery  $Elem  Must pass a jQuery object - first element is processed
	 * @param String  property  The name of the CSS property, eg: top, width, etc.
	 * @returns Variant  Usually is used to get an integer value for position (top, left) or size (height, width)
	 */
	var _cssNum = function ($E, prop) {
		if (!$E.jquery) $E = $($E);
		var CSS = _showInvisibly($E);
		var val = parseInt($.curCSS($E[0], prop, true), 10) || 0;
		$E.css( CSS ); // RESET
		return val;
	};

	var _borderWidth = function (E, side) {
		if (E.jquery) E = E[0];
		var b = "border"+ side.substr(0,1).toUpperCase() + side.substr(1); // left => Left
		return $.curCSS(E, b+"Style", true) == "none" ? 0 : (parseInt($.curCSS(E, b+"Width", true), 10) || 0);
	};

	/**
	 * cssW / cssH / cssSize / cssMinSize
	 *
	 * Contains logic to check boxModel & browser, and return the correct width/height for the current browser/doctype
	 *
	 * @callers  initPanes(), sizeMidPanes(), initHandles(), sizeHandles()
	 * @param Variant  el  Can accept a 'pane' (east, west, etc) OR a DOM object OR a jQuery object
	 * @param Integer  outerWidth/outerHeight  (optional) Can pass a width, allowing calculations BEFORE element is resized
	 * @returns Integer  Returns the innerWidth/Height of the elem by subtracting padding and borders
	 *
	 * @TODO  May need additional logic for other browser/doctype variations? Maybe use more jQuery methods?
	 */
	var cssW = function (el, outerWidth) {
		var
			str	= typeof el == "string"
		,	$E	= str ? $Ps[el] : $(el)
		;
		if (isNaN(outerWidth)) // not specified
			outerWidth = str ? getPaneSize(el) : $E.outerWidth();

		// a 'calculated' outerHeight can be passed so borders and/or padding are removed if needed
		if (outerWidth <= 0) return 0;

		if (!state.browser.boxModel) return outerWidth;

		// strip border and padding size from outerWidth to get CSS Width
		var W = outerWidth
			- _cssNum($E, "paddingLeft")		
			- _cssNum($E, "paddingRight")
			- _borderWidth($E, "Left")
			- _borderWidth($E, "Right")
		;
		return W > 0 ? W : 0;
	};

	var cssH = function (el, outerHeight) {
		var
			str	= typeof el == "string"
		,	$E	= str ? $Ps[el] : $(el)
		;
		if (isNaN(outerHeight)) // not specified
			outerHeight = str ? getPaneSize(el) : $E.outerHeight();

		// a 'calculated' outerHeight can be passed so borders and/or padding are removed if needed
		if (outerHeight <= 0) return 0;

		if (!state.browser.boxModel) return outerHeight;

		// strip border and padding size from outerHeight to get CSS Height
		var H = outerHeight
			- _cssNum($E, "paddingTop")
			- _cssNum($E, "paddingBottom")
			- _borderWidth($E, "Top")
			- _borderWidth($E, "Bottom")
		;
		return H > 0 ? H : 0;
	};

	var cssSize = function (pane, outerSize) {
		if (_c[pane].dir=="horz") // pane = north or south
			return cssH(pane, outerSize);
		else // pane = east or west
			return cssW(pane, outerSize);
	};

	var cssMinSize = function (pane) {
		// minWidth/Height means CSS width/height = 1px
		if (pane == "center")
			return {
				minWidth:	1001 - cssW(pane, 1000)
			,	minHeight:	1001 - cssH(pane, 1000)
			};
		else
			return 1001 - cssSize(pane, 1000);
	};

	// TODO: see if these methods can be made more useful...

	var setOuterWidth = function (el, outerWidth, autoHide) {
		var $E = el, w;
		if (typeof el == "string") $E = $Ps[el]; // west
		else if (!el.jquery) $E = $(el);
		w = cssW($E, outerWidth);
		$E.css({ width: w });
		if (w > 0) {
			if (autoHide && $E.data('autoHidden') && $E.innerHeight() > 0) {
				$E.show().data('autoHidden', false);
				if (!state.browser.mozilla) // FireFox refreshes iframes - IE doesn't
					// make hidden, then visible to 'refresh' display after animation
					$E.css(_c.hidden).css(_c.visible);
			}
		}
		else if (autoHide && !$E.data('autoHidden'))
			$E.hide().data('autoHidden', true);
	};

	var setOuterHeight = function (el, outerHeight, autoHide) {
		var $E = el;
		if (typeof el == "string") $E = $Ps[el]; // west
		else if (!el.jquery) $E = $(el);
		h = cssH($E, outerHeight);
		$E.css({ height: h });
		if (h > 0) {
			if (autoHide && $E.data('autoHidden') && $E.innerWidth() > 0) {
				$E.show().data('autoHidden', false);
				if (!state.browser.mozilla) // FireFox refreshes iframes - IE doesn't
					$E.css(_c.hidden).css(_c.visible);
			}
		}
		else if (autoHide && !$E.data('autoHidden'))
			$E.hide().data('autoHidden', true);
	};

	var setOuterSize = function (el, outerSize, autoHide) {
		if (_c[pane].dir=="horz") // pane = north or south
			setOuterHeight(el, outerSize, autoHide);
		else // pane = east or west
			setOuterWidth(el, outerSize, autoHide);
	};


	/**
	 * _parseSize
	 *
	 * Converts any 'size' params to a pixel/integer size, if not already
	 * If 'auto' or a decimal/percentage is passed as 'size', a pixel-size is calculated
	 *
	 * @returns Integer
	 */
	var _parseSize = function (pane, size, dir) {
		if (!dir) dir = _c[pane].dir;

		if (typeof size=='string' && size.indexOf('%') > 0)
			size = parseInt(size) / 100; // convert % to decimal

		if (size === 0)
			return 0;
		else if (size >= 1)
			return parseInt(size,10);
		else if (size > 0) { // percentage, eg: .25
			var o = options, avail;
			if (dir=="horz") // north or south or center.minHeight
				avail = sC.innerHeight - ($Ps.north ? o.north.spacing_open : 0) - ($Ps.south ? o.south.spacing_open : 0);
			else if (dir=="vert") // east or west or center.minWidth
				avail = sC.innerWidth - ($Ps.west ? o.west.spacing_open : 0) - ($Ps.east ? o.east.spacing_open : 0);
			return Math.floor(avail * size);
		}
		else if (pane=="center")
			return 0;
		else { // size < 0 || size=='auto' || size==Missing || size==Invalid
			// auto-size the pane
			var
				$P	= $Ps[pane]
			,	dim	= (dir == "horz" ? "height" : "width")
			,	vis	= _showInvisibly($P) // show pane invisibly if hidden
			,	s	= $P.css(dim); // SAVE current size
			;
			$P.css(dim, "auto");
			size = (dim == "height") ? $P.outerHeight() : $P.outerWidth(); // MEASURE
			$P.css(dim, s).css(vis); // RESET size & visibility
			return size;
		}
	};

	/**
	 * getPaneSize
	 *
	 * Calculates the current 'size' (width or height) of a border-pane - optionally with 'pane spacing' added
	 *
	 * @returns Integer  Returns EITHER Width for east/west panes OR Height for north/south panes - adjusted for boxModel & browser
	 */
	var getPaneSize = function (pane, inclSpace) {
		var 
			$P	= $Ps[pane]
		,	o	= options[pane]
		,	s	= state[pane]
		,	oSp	= (inclSpace ? o.spacing_open : 0)
		,	cSp	= (inclSpace ? o.spacing_closed : 0)
		;
		if (!$P || s.isHidden)
			return 0;
		else if (s.isClosed || (s.isSliding && inclSpace))
			return cSp;
		else if (_c[pane].dir == "horz")
			return $P.outerHeight() + oSp;
		else // dir == "vert"
			return $P.outerWidth() + oSp;
	};

	/**
	 * setSizeLimits
	 */
	var setSizeLimits = function (pane, slide) {
		var 
			o				= options[pane]
		,	s				= state[pane]
		,	c				= _c[pane]
		,	dir				= c.dir
		,	side			= c.side.toLowerCase()
		,	type			= c.sizeType.toLowerCase()
		,	isSliding		= (slide != undefined ? slide : s.isSliding) // only open() passes 'slide' param
		,	$P				= $Ps[pane]
		,	paneSpacing		= o.spacing_open
		//	measure the pane on the *opposite side* from this pane
		,	altPane			= _c.altSide[pane]
		,	altS			= state[altPane]
		,	$altP			= $Ps[altPane]
		,	altPaneSize		= (!$altP || altS.isVisible===false || altS.isSliding ? 0 : (dir=="horz" ? $altP.outerHeight() : $altP.outerWidth()))
		,	altPaneSpacing	= ((!$altP || altS.isHidden ? 0 : options[altPane][ altS.isClosed !== false ? "spacing_closed" : "spacing_open" ]) || 0)
		//	limitSize prevents this pane from 'overlapping' opposite pane
		,	containerSize	= (dir=="horz" ? sC.innerHeight : sC.innerWidth)
		,	minCenterSize	= options.center[dir=="horz" ? "minHeight" : "minWidth"]
		//	if pane is 'sliding', then ignore center and alt-pane sizes - because 'overlays' them
		,	limitSize		= (containerSize - paneSpacing - (isSliding ? 0 : (_parseSize("center", minCenterSize, dir) + altPaneSize + altPaneSpacing)))
		,	minSize			= s.minSize = max( _parseSize(pane, o.minSize), cssMinSize(pane) )
		,	maxSize			= s.maxSize = min( _parseSize(pane, o.maxSize) || 100000, limitSize )
		,	r				= s.resizerPosition = {} // used to set resizing limits
		,	top				= sC.insetTop
		,	left			= sC.insetLeft
		,	W				= sC.innerWidth
		,	H				= sC.innerHeight
		,	rW				= o.spacing_open // subtract resizer-width to get top/left position for south/east
		;
		switch (pane) {
			case "north":	r.min = top + minSize;
							r.max = top + maxSize;
							break;
			case "west":	r.min = left + minSize;
							r.max = left + maxSize;
							break;
			case "south":	r.min = top + H - maxSize - rW;
							r.max = top + H - minSize - rW;
							break;
			case "east":	r.min = left + W - maxSize - rW;
							r.max = left + W - minSize - rW;
							break;
		};
	};

	/**
	 * calcNewCenterPaneDims
	 *
	 * Returns data for setting the size/position of center pane. Also used to set Height for east/west panes
	 *
	 * @returns JSON  Returns a hash of all dimensions: top, bottom, left, right, (outer) width and (outer) height
	 */
	var calcNewCenterPaneDims = function () {
		var d = {
			top:	getPaneSize("north", true) // true = include 'spacing' value for pane
		,	bottom:	getPaneSize("south", true)
		,	left:	getPaneSize("west", true)
		,	right:	getPaneSize("east", true)
		,	width:	0
		,	height:	0
		};

		with (d) {
			// calc center-pane's outer dimensions
			width	= sC.innerWidth - left - right;  // outerWidth
			height	= sC.innerHeight - bottom - top; // outerHeight
			// add the 'container border/padding' to get final positions relative to the container
			top		+= sC.insetTop;
			bottom	+= sC.insetBottom;
			left	+= sC.insetLeft;
			right	+= sC.insetRight;
		}

		return d;
	};


	/**
	 * getElemDims
	 *
	 * Returns data for setting size of an element (container or a pane).
	 *
	 * @callers  create(), onWindowResize() for container, plus others for pane
	 * @returns JSON  Returns a hash of all dimensions: top, bottom, left, right, outerWidth, innerHeight, etc
	 */
	var getElemDims = function ($E) {
		var
			d	= {}			// dimensions hash
		,	x	= d.css = {}	// CSS hash
		,	i	= {}			// TEMP insets
		,	b, p				// TEMP border, padding
		,	off = $E.offset()
		;
		d.offsetLeft	= off.left;
		d.offsetTop		= off.top;

		$.each("Left,Right,Top,Bottom".split(","), function (idx, e) {
			b = x["border" + e] = _borderWidth($E, e);
			p = x["padding"+ e] = _cssNum($E, "padding"+e);
			i[e] = b + p; // total offset of content from outer side
			// if BOX MODEL, then 'position' = PADDING (ignore borderWidth)
			if ($E == $Container)
				d["inset"+ e] = (state.browser.boxModel ? p : 0); 
		});

		d.innerWidth	= d.outerWidth  = $E.outerWidth();
		d.offsetWidth	= $E.innerWidth(true); // true=include Padding
		d.innerHeight	= d.outerHeight = $E.outerHeight();
		d.offsetHeight	= $E.innerHeight(true);
		if (state.browser.boxModel) {
			d.innerWidth  -= (i.Left + i.Right);
			d.innerHeight -= (i.Top  + i.Bottom);
		}

		// TESTING
		x.width  = $E.width();
		x.height = $E.height();

		return d;
	};

	var getElemCSS = function ($E, list) {
		var
			CSS	= {}
		,	style	= $E[0].style
		,	props	= list.split(",")
		,	sides	= "Top,Bottom,Left,Right".split(",")
		,	attrs	= "Color,Style,Width".split(",")
		,	p, s, a, i, j, k
		;
		for (i=0; i < props.length; i++) {
			p = props[i];
			if ("border|padding|margin".indexOf(p) >= 0)
				for (j=0; j < 4; j++) {
					s = sides[j];
					if (p == "border")
						for (k=0; k < 3; k++) {
							a = attrs[k];
							CSS[p+s+a] = style[p+s+a];
						}
					else
						CSS[p+s] = style[p+s];
				}
			else
				CSS[p] = style[p];
		};
		return CSS;
	};


	var setTimer = function (name, fn, ms) {
		clearTimer(name); // clear previous timer if exists
		_c.timers[name] = setTimeout(fn, ms);
	};

	var clearTimer = function (name) {
		if (_c.timers[name]) {
			clearTimeout(_c.timers[name]);
			delete _c.timers[name];
		}
	};


	var getHoverClasses = function (el, allStates) {
		var
			$El		= $(el)
		,	type	= $El.data("layoutRole")
		,	pane	= $El.data("layoutEdge")
		,	o		= options[pane]
		,	root	= o[type +"Class"]
		,	_pane	= "-"+ pane // eg: "-west"
		,	_open	= "-open"
		,	_closed	= "-closed"
		,	_slide	= "-sliding"
		,	_hover	= "-hover " // NOTE the trailing space
		,	_state	= $El.hasClass(root+_closed) ? _closed : _open
		,	_alt	= _state == _closed ? _open : _closed
		,	classes = (root+_hover) + (root+_pane+_hover) + (root+_state+_hover) + (root+_pane+_state+_hover)
		;
		if (allStates) // when 'removing' classes, also remove alternate-state classes
			classes += (root+_alt+_hover) + (root+_pane+_alt+_hover);

		if (type=="resizer" && $El.hasClass(root+_slide))
			classes += (root+_slide+_hover) + (root+_pane+_slide+_hover);

		return $.trim(classes);
	};
	var addHover	= function (evt, el) { var e = el || this; $(e).addClass( getHoverClasses(e) ); };
	var removeHover	= function (evt, el) { var e = el || this; $(e).removeClass( getHoverClasses(e, true) ); };

/*
 * ###########################
 *   INITIALIZATION METHODS
 * ###########################
 */

	/**
	 * create
	 *
	 * Initialize the layout - called automatically whenever an instance of layout is created
	 *
	 * @callers  NEVER explicity called
	 * @returns  An object pointer to the instance created
	 */
	var create = function () {
		// initialize config/options
		initOptions();
		var o = options;

		// onload will CANCEL resizing if returns false
		if (false === _execCallback(null, o.onload)) return false;

		// update options with saved state, if option enabled
		if (o.useStateCookie && o.cookie.autoLoad)
			loadCookie(); // Update options from state-cookie

		// set environment - can update code here if $.browser is phased out
		state.browser = {
			mozilla:	$.browser.mozilla
		,	msie:		$.browser.msie
		,	isIE6:		$.browser.msie && $.browser.version == 6
		,	boxModel:	$.support.boxModel
		//,	version:	$.browser.version - not used
		};

		// initialize all layout elements
		initContainer();	// set CSS as needed and init state.container dimensions
		initPanes();		// size & position all panes - calls initHandles()
		//initHandles();	// create and position all resize bars & togglers buttons
		initResizable();	// activate resizing on all panes where resizable=true
		sizeContent("all");	// AFTER panes & handles have been initialized, size 'content' divs

		if (o.scrollToBookmarkOnLoad)
			with (self.location) if (hash) replace( hash ); // scrollTo Bookmark

		// search for and bind custom-buttons
		if (o.autoBindCustomButtons) initButtons();

		// bind hotkey function - keyDown - if required
		initHotkeys();
		// track mouse position so we can use it anytime we need it
		initMouseTracking();

		// bind resizeAll() for 'this layout instance' to window.resize event
		if (o.resizeWithWindow && !$Container.data("layoutRole")) // skip if 'nested' inside a pane
			$(window).bind("resize."+ sID, windowResize);

		// bind window.onunload
		$(window).bind("unload."+ sID, unload);

		state.initialized = true;
	};

	var windowResize = function () {
		// resizing use a delay because the resize event fires repeatly - except in FF, but delay anyway
		setTimer("winResize", resizeAll, Number(options.resizeWithWindowDelay) || 0);
		//self.location = '#count='+ (window.counter ? ++window.counter : (window.counter=1)); // DEBUG
	};

	var unload = function () {
		var o = options;
		state.cookie = getState(); // save state in case onunload has custom state-management
		if (o.useStateCookie && o.cookie.autoSave) saveCookie();

		_execCallback(null, o.onunload);
	};

	/**
	 *	initMouseTracking / trackMouse / isMouseOver
	 *
	 *	Bound to document.mousemove - updates window.mouseCoords.X/Y
	 *
	 *	TODO: use ui.isOver(y, x, top, left, height, width)
	 */
	var initMouseTracking = function () {
		if (!window.mouseCoords) { // only need 1 mouse tracker!
			window.mouseCoords = { X: 0, Y: 0 }; // init
			$(document).bind("mousemove."+ sID, trackMouse);
		}
	};
	var trackMouse = function (evt) {
		var m = window.mouseCoords;
		m.X = evt.pageX;
		m.Y = evt.pageY;
	};
	var isMouseOver = function (el) {
		var $E	= (typeof(el == "string") ? $Ps[el] : $(el));
		if (!$E.length) return false;
		var
			_	= this
		,	d	= $E.offset()
		,	T	= d.top
		,	L	= d.left
		,	R	= L + $E.outerWidth()
		,	B	= T + $E.outerHeight()
		,	m	= window.mouseCoords
		;
		return ((m.X >= L && m.X <= R) && (m.Y >= T && m.Y <= B));
	};


	/**
	 * initContainer
	 *
	 * Validate and initialize container CSS and events
	 *
	 * @callers  create()
	 */
	var initContainer = function () {
			sC.tagName	= $Container.attr("tagName");
		var
			isFullPage	= (sC.tagName == "BODY")
		,	$C		= $Container // alias
		,	props	= "position,margin,padding,border"
		,	CSS		= {}
		;

		// the layoutContainer key is used to store the unique layoutID
		$C
			.data("layoutContainer", sID)		// unique identifier for internal use
			.data("layoutName", options.name)	// add user's layout-name - even if blank!
		;

		// SAVE original container CSS for use in destroy()
		if (!$C.data("layoutCSS")) {
			// handle props like overflow different for BODY & HTML - has 'system default' values
			if (isFullPage) {
				CSS = $.extend( getElemCSS($C, props), {
					height:		$C.css("height")
				,	overflow:	$C.css("overflow")
				,	overflowX:	$C.css("overflowX")
				,	overflowY:	$C.css("overflowY")
				});
				// ALSO SAVE <HTML> CSS
				var $H = $("html");
				$H.data("layoutCSS", {
					height:		"auto" // FF would return a fixed px-size!
				,	overflow:	$H.css("overflow")
				,	overflowX:	$H.css("overflowX")
				,	overflowY:	$H.css("overflowY")
				});
			}
			else // handle props normally for non-body elements
				CSS = getElemCSS($C, props+",top,bottom,left,right,width,height,overflow,overflowX,overflowY");

			$C.data("layoutCSS", CSS);
		}

		try { // format html/body if this is a full page layout
			if (isFullPage) {
				$("html").css({
					height:		"100%"
				,	overflow:	"hidden"
				,	overflowX:	"hidden"
				,	overflowY:	"hidden"
				});
				$("body").css({
					position:	"relative"
				,	height:		"100%"
				,	overflow:	"hidden"
				,	overflowX:	"hidden"
				,	overflowY:	"hidden"
				,	margin:		0
				,	padding:	0		// TODO: test whether body-padding could be handled?
				,	border:		"none"	// a body-border creates problems because it cannot be measured!
				});
			}
			else { // set required CSS for overflow and position
				var
					CSS	= { overflow: "hidden" } // make sure container will not 'scroll'
				,	p	= $C.css("position")
				,	h	= $C.css("height")
				;
				// if this is a NESTED layout, then container/outer-pane ALREADY has position and height
				if (!$C.data("layoutRole")) {
					if (!p || "fixed,absolute,relative".indexOf(p) < 0)
						CSS.position = "relative"; // container MUST have a 'position'
					if (!h || h=="auto")
						CSS.height = "100%"; // container MUST have a 'height'
				}
				$C.css( CSS );
				if ($C.is(":visible") && $C.innerHeight() < 2)
					alert( lang.errContainerHeight.replace(/CONTAINER/, $C[0].tagName + ($C.selector || '')) );
			}
		} catch (ex) {}

		// set current layout-container dimensions
		$.extend( state.container, getElemDims( $C ), true );
	};

	/**
	 * initHotkeys
	 *
	 * Bind layout hotkeys - if options enabled
	 *
	 * @callers  create()
	 */
	var initHotkeys = function () {
		// bind keyDown to capture hotkeys, if option enabled for ANY pane
		$.each(_c.borderPanes.split(","), function (i, pane) {
			var o = options[pane];
			if (o.enableCursorHotkey || o.customHotkey) {
				$(document).bind("keydown."+ sID, keyDown); // only need to bind this ONCE
				return false; // BREAK - binding was done
			}
		});
	};

	/**
	 * initOptions
	 *
	 * Build final OPTIONS data
	 *
	 * @callers  create()
	 */
	var initOptions = function () {
		// simplify logic by making sure passed 'opts' var has basic keys
		opts = _transformData( opts );

		// TODO: create a compatibility add-on for new UI widget that will transform old option syntax
		var newOpts = {
			applyDefaultStyles:		"applyDemoStyles"
		};
		renameOpts(opts.defaults);
		$.each(_c.allPanes.split(","), function (i, pane) {
			renameOpts(opts[pane]);
		});

		// update default effects, if case user passed key
		if (opts.effects) {
			$.extend( effects, opts.effects );
			delete opts.effects;
		}
		$.extend( options.cookie, opts.cookie );

		// see if any 'global options' were specified
		var globals = "name,scrollToBookmarkOnLoad,resizeWithWindow,resizeWithWindowDelay,"+
			"onresizeall,onresizeall_start,onresizeall_end,onload,onunload,autoBindCustomButtons,useStateCookie";
		$.each(globals.split(","), function (i, key) {
			if (opts[key] !== undefined)
				options[key] = opts[key];
			else if (opts.defaults[key] !== undefined) {
				options[key] = opts.defaults[key];
				delete opts.defaults[key];
			}
		});

		// remove any 'defaults' that MUST be set 'per-pane'
		$.each("paneSelector,resizerCursor,customHotkey".split(","),
			function (i, key) { delete opts.defaults[key]; } // is OK if key does not exist
		);

		// now update options.defaults
		$.extend( true, options.defaults, opts.defaults );

		// merge all config & options for the 'center' pane
		_c.center = $.extend( true, {}, _c.defaults, _c.center );
		$.extend( options.center, opts.center );
		// Most 'default options' do not apply to 'center', so add only those that DO
		var o_Center = $.extend( true, {}, options.defaults, opts.defaults, options.center ); // TEMP data
		$.each("paneClass,contentSelector,contentIgnoreSelector,applyDemoStyles,showOverflowOnHover,triggerEventsOnLoad".split(","),
			function (i, key) { options.center[key] = o_Center[key]; }
		);

		var defs = options.defaults;

		// create a COMPLETE set of options for EACH border-pane
		$.each(_c.borderPanes.split(","), function (i, pane) {
			// apply 'pane-defaults' to CONFIG.PANE
			_c[pane] = $.extend( true, {}, _c.defaults, _c[pane] );

			// apply 'pane-defaults' +  user-options to OPTIONS.PANE
			o = options[pane] = $.extend( true, {}, options.defaults, options[pane], opts.defaults, opts[pane] );

			// make sure we have base-classes
			if (!o.paneClass)		o.paneClass		= "ui-layout-pane";
			if (!o.resizerClass)	o.resizerClass	= "ui-layout-resizer";
			if (!o.togglerClass)	o.togglerClass	= "ui-layout-toggler";

			// create FINAL fx options for each pane, ie: options.PANE.fxName/fxSpeed/fxSettings[_open|_close]
			$.each(["_open","_close",""], function (i,n) { 
				var
					sName		= "fxName"+n
				,	sSpeed		= "fxSpeed"+n
				,	sSettings	= "fxSettings"+n
				;
				// recalculate fxName according to specificity rules
				o[sName] =
					opts[pane][sName]		// opts.west.fxName_open
				||	opts[pane].fxName		// opts.west.fxName
				||	opts.defaults[sName]	// opts.defaults.fxName_open
				||	opts.defaults.fxName	// opts.defaults.fxName
				||	o[sName]				// options.west.fxName_open
				||	o.fxName				// options.west.fxName
				||	defs[sName]				// options.defaults.fxName_open
				||	defs.fxName				// options.defaults.fxName
				||	"none"
				;
				// validate fxName to be sure is a valid effect
				var fxName = o[sName];
				if (fxName == "none" || !$.effects || !$.effects[fxName] || (!effects[fxName] && !o[sSettings] && !o.fxSettings))
					fxName = o[sName] = "none"; // effect not loaded, OR undefined FX AND fxSettings not passed
				// set vars for effects subkeys to simplify logic
				var
					fx = effects[fxName]	|| {} // effects.slide
				,	fx_all	= fx.all		|| {} // effects.slide.all
				,	fx_pane	= fx[pane]		|| {} // effects.slide.west
				;
				// RECREATE the fxSettings[_open|_close] keys using specificity rules
				o[sSettings] = $.extend(
					{}
				,	fx_all						// effects.slide.all
				,	fx_pane						// effects.slide.west
				,	defs.fxSettings || {}		// options.defaults.fxSettings
				,	defs[sSettings] || {}		// options.defaults.fxSettings_open
				,	o.fxSettings				// options.west.fxSettings
				,	o[sSettings]				// options.west.fxSettings_open
				,	opts.defaults.fxSettings	// opts.defaults.fxSettings
				,	opts.defaults[sSettings] || {} // opts.defaults.fxSettings_open
				,	opts[pane].fxSettings		// opts.west.fxSettings
				,	opts[pane][sSettings] || {}	// opts.west.fxSettings_open
				);
				// recalculate fxSpeed according to specificity rules
				o[sSpeed] =
					opts[pane][sSpeed]		// opts.west.fxSpeed_open
				||	opts[pane].fxSpeed		// opts.west.fxSpeed (pane-default)
				||	opts.defaults[sSpeed]	// opts.defaults.fxSpeed_open
				||	opts.defaults.fxSpeed	// opts.defaults.fxSpeed
				||	o[sSpeed]				// options.west.fxSpeed_open
				||	o[sSettings].duration	// options.west.fxSettings_open.duration
				||	o.fxSpeed				// options.west.fxSpeed
				||	o.fxSettings.duration	// options.west.fxSettings.duration
				||	defs.fxSpeed			// options.defaults.fxSpeed
				||	defs.fxSettings.duration// options.defaults.fxSettings.duration
				||	fx_pane.duration		// effects.slide.west.duration
				||	fx_all.duration			// effects.slide.all.duration
				||	"normal"				// DEFAULT
				;
			});
		});

		function renameOpts (O) {
			for (var key in newOpts) {
				if (O[key] != undefined) {
					O[newOpts[key]] = O[key];
					delete O[key];
				}
			}
		}
	};

	/**
	 * initPanes
	 *
	 * Initialize module objects, styling, size and position for all panes
	 *
	 * @callers  create()
	 */
	var initPanes = function () {
		// NOTE: do north & south FIRST so we can measure their height - do center LAST
		$.each(_c.allPanes.split(","), function (idx, pane) {
			var
				o		= options[pane]
			,	s		= state[pane]
			,	c		= _c[pane]
			,	fx		= s.fx
			,	dir		= c.dir
			,	sel		= o.paneSelector
			,	spacing	= o.spacing_open || 0
			,	isCenter = (pane == "center")
			,	CSS		= {}
			,	$P, $C
			,	size, minSize, maxSize
			;
			$Cs[pane] = false; // init

			if (sel.substr(0,1)==="#") // ID selector
				// NOTE: elements selected 'by ID' DO NOT have to be 'children'
				$P = $Ps[pane] = $Container.find(sel+":first");
			else { // class or other selector
				$P = $Ps[pane] = $Container.children(sel+":first");
				// look for the pane nested inside a 'form' element
				if (!$P.length) $P = $Ps[pane] = $Container.children("form:first").children(sel+":first");
			}

			if (!$P.length) {
				$Ps[pane] = false; // logic
				return true; // SKIP to next
			}

			// SAVE original Pane CSS
			if (!$P.data("layoutCSS")) {
				var props = "position,top,left,bottom,right,width,height,overflow,zIndex,display,backgroundColor,padding,margin,border";
				$P.data("layoutCSS", getElemCSS($P, props));
			}

			// add basic classes & attributes
			$P
				.data("layoutName", options.name)	// add user's layout-name - even if blank!
				.data("layoutRole", "pane")
				.data("layoutEdge", pane)
				.css(_c.defaults.cssReq)	// pane-default styles
				.css(c.cssReq)				// side-specific styles
				.css(o.applyDemoStyles ? c.cssDemo : {}) // demo styles
				.addClass( o.paneClass +" "+ o.paneClass+"-"+pane ) // default = "ui-layout-pane ui-layout-pane-west" - may be a dupe of 'paneSelector'
				.bind("mouseenter."+ sID, addHover )
				.bind("mouseleave."+ sID, removeHover )
			;

			// see if this pane has a 'scrolling-content element'
			if (o.contentSelector) {
				$C = $Cs[pane] = $P.children(o.contentSelector+":first"); // match 1-element only
				if (!$C.length)
					$Cs[pane] = false;
				else {
					$C.css( _c.content.cssReq );
					if (o.applyDemoStyles) {
						$C.css( _c.content.cssDemo ); // add padding & overflow: auto to content-div
						$P.css( _c.content.cssDemoPane ); // REMOVE padding/scrolling from pane
					}
					// sizeContent() is called later
				}
			}

			if (!isCenter) {
				// call _parseSize AFTER applying pane classes & styles - but before making visible (if hidden)
				// if o.size is auto or not valid, then MEASURE the pane and use that as it's 'size'
				size	= s.size = _parseSize(pane,o.size);
				minSize	= _parseSize(pane,o.minSize) || 1;
				maxSize	= _parseSize(pane,o.maxSize) || 100000;
			}

			// init pane-logic vars
				s.tagName	= $P.attr("tagName");
				s.noRoom	= false; // true = pane 'automatically' hidden due to insufficient room - will unhide automatically
				s.isVisible	= true;  // false = pane is invisible - closed OR hidden - simplify logic
			if (!isCenter) {
				s.isClosed  = false; // true = pane is closed
				s.isSliding = false; // true = pane is currently open by 'sliding' over adjacent panes
				s.isResizing= false; // true = pane is in process of being resized
				s.isHidden	= false; // true = pane is hidden - no spacing, resizer or toggler is visible!
			}

			// set css-position to account for container borders & padding
			switch (pane) {
				case "north": 	CSS.top 	= sC.insetTop;
								CSS.left 	= sC.insetLeft;
								CSS.right	= sC.insetRight;
								break;
				case "south": 	CSS.bottom	= sC.insetBottom;
								CSS.left 	= sC.insetLeft;
								CSS.right 	= sC.insetRight;
								break;
				case "west": 	CSS.left 	= sC.insetLeft; // top, bottom & height set by sizeMidPanes()
								break;
				case "east": 	CSS.right 	= sC.insetRight; // ditto
								break;
				case "center":	// top, left, width & height set by sizeMidPanes()
			}

			if (dir == "horz") // north or south pane
				CSS.height = max(1, cssH(pane, size));
			else if (dir == "vert") // east or west pane
				CSS.width = max(1, cssW(pane, size));
			//else if (isCenter) {}

			$P.css(CSS); // apply size -- top, bottom & height will be set by sizeMidPanes
			if (dir != "horz") sizeMidPanes(pane, true, true); // true = onInit

			// NOW make the pane visible - in case was initially hidden
			$P.css({ visibility: "visible", display: "block" });

			// close or hide the pane if specified in settings
			if (o.initClosed && o.closable)
				close(pane, true, true, true); // true = onInit
			else if (o.initHidden || o.initClosed)
				hide(pane, true, true); // will be completely invisible - no resizer or spacing
			// ELSE setAsOpen() - called later by initHandles()

			// check option for auto-handling of pop-ups & drop-downs
			if (o.showOverflowOnHover)
				$P.hover( allowOverflow, resetOverflow );

		});

		/*
		 *	init the pane-handles NOW in case we have to hide or close the pane below
		 */
		initHandles();

		// make sure there is enough space available for each pane pane
		$.each(_c.borderPanes.split(","), function (i, pane) {
			if ($Ps[pane] && state[pane].isVisible) { // pane is OPEN
				setSizeLimits(pane);
				makePaneFit(pane); // pane may be Closed, Hidden or Resized by makePaneFit()
			}
		});

		// size center-pane AGAIN in case we 'closed' a border-pane in loop above
		sizeMidPanes("center", true, true); // true = onInit

		// border-pane callbacks are triggered in setAsOpen, but need to handle center-pane here
		var o = options.center;
		if (state.center.isVisible && o.triggerEventsOnLoad)
			_execCallback('center', o.onresize_end || o.onresize); // call onresize
	};

	/**
	 * initHandles
	 *
	 * Initialize module objects, styling, size and position for all resize bars and toggler buttons
	 *
	 * @callers  create()
	 */
	var initHandles = function (panes) {
		if (!panes || panes == "all") panes = _c.borderPanes;

		// create toggler DIVs for each pane, and set object pointers for them, eg: $R.north = north toggler DIV
		$.each(panes.split(","), function (i, pane) {
			var $P		= $Ps[pane];
			$Rs[pane]	= false; // INIT
			$Ts[pane]	= false;
			if (!$P) return; // pane does not exist - skip

			var 
				o		= options[pane]
			,	s		= state[pane]
			,	c		= _c[pane]
			,	rClass	= o.resizerClass
			,	tClass	= o.togglerClass
			,	side	= c.side.toLowerCase()
			,	spacing	= (s.isVisible ? o.spacing_open : o.spacing_closed)
			,	_pane	= "-"+ pane // used for classNames
			,	_state	= (s.isVisible ? "-open" : "-closed") // used for classNames
				// INIT RESIZER BAR
			,	$R		= $Rs[pane] = $("<div></div>")
				// INIT TOGGLER BUTTON
			,	$T		= (o.closable ? $Ts[pane] = $("<div></div>") : false)
			;

			if (s.isVisible && o.resizable)
				; // handled by initResizable
			else if (!s.isVisible && o.slidable)
				$R.attr("title", o.sliderTip).css("cursor", o.sliderCursor);

			$R
				// if paneSelector is an ID, then create a matching ID for the resizer, eg: "#paneLeft" => "paneLeft-resizer"
				.attr("id", (o.paneSelector.substr(0,1)=="#" ? o.paneSelector.substr(1) + "-resizer" : ""))
				.data("layoutRole", "resizer")
				.data("layoutEdge", pane)
				.css(_c.resizers.cssReq) // add base/required styles
				.css(o.applyDemoStyles ? _c.resizers.cssDemo : {}) // add demo styles
				.addClass(rClass +" "+ rClass+_pane)
				.appendTo($Container) // append DIV to container
				.mouseenter( addHover )
				.mouseleave( removeHover )
			;

			if ($T) {
				$T
					// if paneSelector is an ID, then create a matching ID for the resizer, eg: "#paneLeft" => "#paneLeft-toggler"
					.attr("id", (o.paneSelector.substr(0,1)=="#" ? o.paneSelector.substr(1) + "-toggler" : ""))
					.data("layoutRole", "toggler")
					.data("layoutEdge", pane)
					.css(_c.togglers.cssReq) // add base/required styles
					.css(o.applyDemoStyles ? _c.togglers.cssDemo : {}) // add demo styles
					.addClass(tClass +" "+ tClass+_pane)
					.appendTo($R) // append SPAN to resizer DIV
					.click(function(evt){ toggle(pane); evt.stopPropagation(); })
					.mouseenter( addHover )
					.mouseleave( removeHover )
				;
				// ADD INNER-SPANS TO TOGGLER
				if (o.togglerContent_open) // ui-layout-open
					$("<span>"+ o.togglerContent_open +"</span>")
						.data("layoutRole", "togglerContent")
						.data("layoutEdge", pane)
						.addClass("content content-open")
						.css("display","none")
						.appendTo( $T )
						.mouseenter( addHover )
						.mouseleave( removeHover )
					;
				if (o.togglerContent_closed) // ui-layout-closed
					$("<span>"+ o.togglerContent_closed +"</span>")
						.data("layoutRole", "togglerContent")
						.data("layoutEdge", pane)
						.addClass("content content-closed")
						.css("display","none")
						.appendTo( $T )
						.mouseenter( addHover )
						.mouseleave( removeHover )
					;
			}

			// ADD CLASSNAMES & SLIDE-BINDINGS - eg: class="resizer resizer-west resizer-open"
			if (s.isVisible)
				setAsOpen(pane, true); // true = onInit
			else {
				setAsClosed(pane, true); // true = onInit
				bindStartSlidingEvent(pane, true); // will enable events IF option is set
			}

		});

		// SET ALL HANDLE DIMENSIONS
		sizeHandles("all", true); // true = onInit
	};

	/**
	 * initButtons
	 *
	 * Searches for .ui-layout-button-xxx elements and auto-binds them as layout-buttons
	 *
	 * @callers  create()
	 */
	var initButtons = function () {
		var pre	= "ui-layout-button-", name;
		$.each("toggle,open,close,pin".split(","), function (i, action) {
			$.each(_c.borderPanes.split(","), function (ii, pane) {
				$("."+pre+action+"-"+pane).each(function(){
					// if button was previously 'bound', data.layoutName was set, but is blank if layout has no 'name'
					name = $(this).data("layoutName") || $(this).attr("layoutName");
					if (name == undefined || name == options.name)
						bindButton(this, action, pane);
				});
			});
		});
	};

	/**
	 * initResizable
	 *
	 * Add resize-bars to all panes that specify it in options
	 *
	 * @dependancies  $.fn.resizable - will skip if not found
	 * @callers  create()
	 */
	var initResizable = function (panes) {
		var
			draggingAvailable = (typeof $.fn.draggable == "function")
		,	$Frames, side // set in start()
		;
		if (!panes || panes == "all") panes = _c.borderPanes;

		$.each(panes.split(","), function (idx, pane) {
			var 
				o	= options[pane]
			,	s	= state[pane]
			,	c	= _c[pane]
			,	side = (c.dir=="horz" ? "top" : "left")
			,	r, live // set in start because may change
			;
			if (!draggingAvailable || !$Ps[pane] || !o.resizable) {
				o.resizable = false;
				return true; // skip to next
			}

			var 
				$P 		= $Ps[pane]
			,	$R		= $Rs[pane]
			,	base	= o.resizerClass
			//	'drag' classes are applied to the ORIGINAL resizer-bar while dragging is in process
			,	resizerClass		= base+"-drag"				// resizer-drag
			,	resizerPaneClass	= base+"-"+pane+"-drag"		// resizer-north-drag
			//	'helper' class is applied to the CLONED resizer-bar while it is being dragged
			,	helperClass			= base+"-dragging"			// resizer-dragging
			,	helperPaneClass		= base+"-"+pane+"-dragging" // resizer-north-dragging
			,	helperLimitClass	= base+"-dragging-limit"	// resizer-drag
			,	helperClassesSet	= false 					// logic var
			;

			if (!s.isClosed)
				$R
					.attr("title", o.resizerTip)
					.css("cursor", o.resizerCursor) // n-resize, s-resize, etc
				;

			$R.draggable({
				containment:	$Container[0] // limit resizing to layout container
			,	axis:			(c.dir=="horz" ? "y" : "x") // limit resizing to horz or vert axis
			,	delay:			100
			,	distance:		1
			//	basic format for helper - style it using class: .ui-draggable-dragging
			,	helper:			"clone"
			,	opacity:		o.resizerDragOpacity
			,	addClasses:		false // avoid ui-state-disabled class when disabled
			//,	iframeFix:		o.draggableIframeFix // TODO: consider using when bug is fixed
			,	zIndex:			_c.zIndex.resizer_drag

			,	start: function (e, ui) {
					// REFRESH options & state pointers in case we used swapPanes
					o = options[pane];
					s = state[pane];
					// re-read options
					live = o.resizeWhileDragging;

					// onresize_start callback - will CANCEL hide if returns false
					// TODO: CONFIRM that dragging can be cancelled like this???
					if (false === _execCallback(pane, o.onresize_start)) return false;

					s.isResizing = true; // prevent pane from closing while resizing
					clearTimer(pane+"_closeSlider"); // just in case already triggered

					// SET RESIZER LIMITS - used in drag()
					setSizeLimits(pane); // update pane/resizer state
					r = s.resizerPosition;

					$R.addClass( resizerClass +" "+ resizerPaneClass ); // add drag classes
					helperClassesSet = false; // reset logic var - see drag()

					// MASK PANES WITH IFRAMES OR OTHER TROUBLESOME ELEMENTS
					$Frames = $(o.maskIframesOnResize === true ? "iframe" : o.maskIframesOnResize).filter(":visible");
					var id, i=0; // ID incrementer - used when 'resizing' masks during dynamic resizing
					$Frames.each(function() {					
						id = "ui-layout-mask-"+ (++i);
						$(this).data("layoutMaskID", id); // tag iframe with corresponding maskID
						$('<div id="'+ id +'" class="ui-layout-mask ui-layout-mask-'+ pane +'"/>')
							.css({
								background:	"#fff"
							,	opacity:	"0.001"
							,	zIndex:		_c.zIndex.iframe_mask
							,	position:	"absolute"
							,	width:		this.offsetWidth+"px"
							,	height:		this.offsetHeight+"px"
							})
							.css($(this).position()) // top & left -- changed from offset()
							.appendTo(this.parentNode) // put mask-div INSIDE pane to avoid zIndex issues
						;
					});

					// DISABLE TEXT SELECTION - particularly for WebKit browsers, Safari & Chrome
					if (o.noSelectionWhileDragging) $(document).disableSelection(); 
				}

			,	drag: function (e, ui) {
					if (!helperClassesSet) { // can only add classes after clone has been added to the DOM
						//$(".ui-draggable-dragging")
						ui.helper
							.addClass( helperClass +" "+ helperPaneClass ) // add helper classes
							.children().css("visibility","hidden") // hide toggler inside dragged resizer-bar
						;
						helperClassesSet = true;
						// draggable bug!? RE-SET zIndex to prevent E/W resize-bar showing through N/S pane!
						if (s.isSliding) $Ps[pane].css("zIndex", _c.zIndex.pane_sliding);
					}
					// CONTAIN RESIZER-BAR TO RESIZING LIMITS
					var limit = 0;
					if (ui.position[side] < r.min) {
						ui.position[side] = r.min;
						limit = -1;
					}
					else if (ui.position[side] > r.max) {
						ui.position[side] = r.max;
						limit = 1;
					}
					// ADD/REMOVE dragging-limit CLASS
					if (limit) {
						ui.helper.addClass( helperLimitClass ); // at dragging-limit
						window.defaultStatus = "Panel has reached its "+ (limit>0 ? "maximum" : "minimum") +" size";
					}
					else {
						ui.helper.removeClass( helperLimitClass ); // not at dragging-limit
						window.defaultStatus = "";
					}
					// DYNAMICALLY RESIZE PANES IF OPTION ENABLED
					if (live) resizePanes(e, ui, pane);
				}

			,	stop: function (e, ui) {
					// RE-ENABLE TEXT SELECTION
					if (o.noSelectionWhileDragging) $(document).enableSelection(); 
					window.defaultStatus = ""; // clear 'resizing limit' message from statusbar
					$R.removeClass( resizerClass +" "+ resizerPaneClass +" "+ helperLimitClass ); // remove drag classes from Resizer
					resizePanes(e, ui, pane, true); // true = resizingDone
					s.isResizing = false;
				}

			});

			/**
			 * resizePanes
			 *
			 * Sub-routine called from stop() and optionally drag()
			 */
			var resizePanes = function (e, ui, pane, resizingDone) {
				var 
					dragPos	= ui.position
				,	c		= _c[pane]
				,	resizerPos, newSize
				,	i = 0 // ID incrementer
				;
				switch (pane) {
					case "north":	resizerPos = dragPos.top; break;
					case "west":	resizerPos = dragPos.left; break;
					case "south":	resizerPos = sC.offsetHeight - dragPos.top  - o.spacing_open; break;
					case "east":	resizerPos = sC.offsetWidth  - dragPos.left - o.spacing_open; break;
				};

				// remove container margin from resizer position to get the pane size
				newSize = resizerPos - sC["inset"+ c.side];
				manualSizePane(pane, newSize);

				if (resizingDone) {
					// Remove OR Resize MASK(S) created in drag.start
					$("div.ui-layout-mask").each(function() { this.parentNode.removeChild(this); });
					//$("div.ui-layout-mask").remove(); // TODO: Is this less efficient?
				}
				else
					$Frames.each(function() {
						$("#"+ $(this).data("layoutMaskID")) // get corresponding mask by ID
							.css($(this).position()) // update top & left
							.css({ // update width & height
								width:	this.offsetWidth +"px"
							,	height:	this.offsetHeight+"px"
							})
						;
					});
			};
		});
	};


	/**
	 *	destroy
	 *
	 *	Destroy this layout and reset all elements
	 */
	var destroy = function () {
		// UNBIND layout events
		$(window).unbind("."+ sID);
		$(document).unbind("."+ sID);

		var
			isFullPage	= (sC.tagName == "BODY")
		//	create list of ALL pane-classes that need to be removed
		,	root	= o.paneClass // default="ui-layout-pane"
		,	_open	= "-open"
		,	_sliding= "-sliding"
		,	_closed	= "-closed"
		,	generic = [ root, root+_open, root+_closed, root+_sliding ] // generic classes
		,	$P, pRoot, pClasses // loop vars
		;
		// loop all panes to remove layout classes, attributes and bindings
		$.each(_c.allPanes.split(","), function (i, pane) {
			$P = $Ps[pane];
			if (!$P) return true; // no pane - SKIP

			// REMOVE pane's resizer and toggler elements
			if (pane != "center") {
				$Ts[pane].remove();
				$Rs[pane].remove();
			}

			pRoot = root+"-"+pane; // eg: "ui-layout-pane-west"
			pClasses = []; // reset
			pClasses.push( pRoot );
			pClasses.push( pRoot+_open );
			pClasses.push( pRoot+_closed );
			pClasses.push( pRoot+_sliding );

			$.merge(pClasses, generic); // ADD generic classes
			$.merge(pClasses, getHoverClasses($P, true)); // ADD hover-classes

			$P
				.removeClass( pClasses.join(" ") ) // remove ALL pane-classes
				.removeData("layoutRole")
				.removeData("layoutEdge")
				.unbind("."+ sID) // remove ALL Layout events
				// TODO: remove these extra unbind commands when jQuery is fixed
				.unbind("mouseenter")
				.unbind("mouseleave")
			;

			// do NOT reset CSS if this pane is STILL the container of a nested layout!
			// the nested layout will reset its 'container' when/if it is destroyed
			if (!$P.data("layoutContainer"))
				$P.css( $P.data("layoutCSS") );
		});

		// reset layout-container
		$Container.removeData("layoutContainer");

		// do NOT reset container CSS if is a 'pane' in an outer-layout - ie, THIS layout is 'nested'
		if (!$Container.data("layoutEdge"))
			$Container.css( $Container.data("layoutCSS") ); // RESET CSS
		// for full-page layouts, must also reset the <HTML> CSS
		if (isFullPage)
			$("html").css( $("html").data("layoutCSS") ); // RESET CSS

		// trigger state-management and onunload callback
		unload();

		var n = options.name; // layout-name
		if (n && window[n]) window[n] = null; // clear window object, if exists
	};


/*
 * ###########################
 *       ACTION METHODS
 * ###########################
 */

	/**
	 * hide / show
	 *
	 * Completely 'hides' a pane, including its spacing - as if it does not exist
	 * The pane is not actually 'removed' from the source, so can use 'show' to un-hide it
	 *
	 * @param String  pane   The pane being hidden, ie: north, south, east, or west
	 */
	var hide = function (pane, noAnimation, onInit) {
		var
			o	= options[pane]
		,	s	= state[pane]
		,	$P	= $Ps[pane]
		,	$R	= $Rs[pane]
		;
		if (!$P || s.isHidden) return; // pane does not exist OR is already hidden

		// onhide_start callback - will CANCEL hide if returns false
		if (!onInit && false === _execCallback(pane, o.onhide_start)) return;

		s.isSliding = false; // just in case

		// now hide the elements
		if ($R) $R.hide(); // hide resizer-bar
		if (onInit || s.isClosed) {
			s.isClosed = true; // to trigger open-animation on show()
			s.isHidden  = true;
			s.isVisible = false;
			$P.hide(); // no animation when loading page
			sizeMidPanes(_c[pane].dir == "horz" ? "all" : "center");
			if (!onInit || o.triggerEventsOnLoad)
				_execCallback(pane, o.onhide_end || o.onhide);
		}
		else {
			s.isHiding = true; // used by onclose
			close(pane, false, noAnimation); // adjust all panes to fit
		}
	};

	var show = function (pane, openPane, noAnimation, noAlert) {
		var
			o	= options[pane]
		,	s	= state[pane]
		,	$P	= $Ps[pane]
		,	$R	= $Rs[pane]
		;
		if (!$P || !s.isHidden) return; // pane does not exist OR is not hidden

		// onshow_start callback - will CANCEL show if returns false
		if (false === _execCallback(pane, o.onshow_start)) return;

		s.isSliding = false; // just in case
		s.isShowing = true; // used by onopen/onclose
		//s.isHidden  = false; - will be set by open/close - if not cancelled

		// now show the elements
		//if ($R) $R.show(); - will be shown by open/close
		if (openPane === false)
			close(pane, true); // true = force
		else
			open(pane, false, noAnimation, noAlert); // adjust all panes to fit
	};


	var slideOpen = function (evt_or_pane) {
		var pane = (typeof evt_or_pane == "string" ? evt_or_pane : $(this).data("layoutEdge"));
		if (state[pane].isClosed)
			open(pane, true); // true = slide - ie, called from here!
		else // skip 'open' if already open!
			bindStopSlidingEvents(pane, true); // BIND trigger events to close sliding-pane
	};

	var slideClosed = function (evt_or_pane) {
		var
			$E	= (typeof evt_or_pane == "string" ? $Ps[evt_or_pane] : $(this))
		,	pane= $E.data("layoutEdge")
		,	o	= options[pane]
		,	s	= state[pane]
		,	$P	= $Ps[pane]
		;
		if (s.isClosed || s.isResizing)
			return; // skip if already closed OR in process of resizing
		else if (o.slideTrigger_close == "click")
			close_NOW(); // close immediately onClick
		//else if (isMouseOver(pane))
		//	clearTimer(pane+"_closeSlider"); // browser glitch - mouse is REALLY 'over' the pane
		else // trigger = mouseout - use a delay
			setTimer(pane+"_closeSlider", close_NOW, 300); // .3 sec delay

		// SUBROUTINE for timed close
		function close_NOW (e) {
			if (s.isClosed) // skip 'close' if already closed!
				bindStopSlidingEvents(pane, false); // UNBIND trigger events
			else
				close(pane); // close will handle unbinding
		}
	};


	/**
	 * toggle
	 *
	 * Toggles a pane open/closed by calling either open or close
	 *
	 * @param String  pane   The pane being toggled, ie: north, south, east, or west
	 */
	var toggle = function (pane) {
		if (typeof pane !="string")
			pane = $(this).data("layoutEdge"); // bound to $R.dblclick
		var s = state[pane];
		if (s.isHidden)
			show(pane); // will call 'open' after unhiding it
		else if (s.isClosed)
			open(pane);
		else
			close(pane);
	};

	/**
	 * close
	 *
	 * Close the specified pane (animation optional), and resize all other panes as needed
	 *
	 * @param String  pane   The pane being closed, ie: north, south, east, or west
	 */
	var close = function (pane, force, noAnimation, onInit) {
		var
			$P		= $Ps[pane]
		,	$R		= $Rs[pane]
		,	$T		= $Ts[pane]
		,	o		= options[pane]
		,	s		= state[pane]
		,	doFX	= !noAnimation && !s.isClosed && (o.fxName_close != "none")
		// 	transfer logic vars to temp vars
		,	isShowing	= s.isShowing
		,	isHiding	= s.isHiding
		,	wasSliding	= s.isSliding
		;
		// now clear the logic vars
		delete s.isShowing;
		delete s.isHiding;

		if (!$P || (!o.resizable && !o.closable)) return; // invalid request
		else if (!force && s.isClosed && !isShowing) return; // already closed

		if (_c.isLayoutBusy) { // layout is 'busy' - probably with an animation
			_queue("close", pane, force); // set a callback for this action, if possible
			return; // ABORT 
		}

		// onclose_start callback - will CANCEL hide if returns false
		// SKIP if just 'showing' a hidden pane as 'closed'
		if (!onInit && !isShowing && false === _execCallback(pane, o.onclose_start)) return;

		// SET flow-control flags
		_c[pane].isMoving = true;
		_c.isLayoutBusy = true;

		s.isClosed = true;
		s.isVisible = false;
		// update isHidden BEFORE sizing panes
		if (isHiding) s.isHidden = true;
		else if (isShowing) s.isHidden = false;

		if (s.isSliding) // pane is being closed, so UNBIND trigger events
			bindStopSlidingEvents(pane, false); // will set isSliding=false
		else if (!onInit) // resize panes adjacent to this one
			sizeMidPanes(_c[pane].dir == "horz" ? "all" : "center");

		// if this pane has a resizer bar, move it NOW - before animation
		if (!onInit) setAsClosed(pane); // onInit, this will be called LATER by initHandles

		// ANIMATE 'CLOSE' - if no animation, then was ALREADY shown above
		if (doFX) {
			lockPaneForFX(pane, true); // need to set left/top so animation will work
			$P.hide( o.fxName_close, o.fxSettings_close, o.fxSpeed_close, function () {
				lockPaneForFX(pane, false); // undo
				close_2();
			});
		}
		else {
			$P.hide(); // just hide pane NOW
			close_2();
		};

		// SUBROUTINE
		function close_2 () {
			if (s.isClosed) { // make sure pane was not 'reopened' before animation finished!

				bindStartSlidingEvent(pane, true); // will enable if state.PANE.isSliding = true

				// if opposite-pane was autoClosed, see if it can be autoOpened now
				var altPane = _c.altSide[pane];
				if (state[ altPane ].noRoom) {
					setSizeLimits( altPane );
					makePaneFit( altPane );
				}

				if (!onInit || o.triggerEventsOnLoad) {
					// onclose callback - UNLESS just 'showing' a hidden pane as 'closed'
					if (!isShowing && !wasSliding) _execCallback(pane, o.onclose_end || o.onclose);
					// onhide OR onshow callback
					if (isShowing)	_execCallback(pane, o.onshow_end || o.onshow);
					if (isHiding)	_execCallback(pane, o.onhide_end || o.onhide);
				}
			}
			// execute internal flow-control callback
			_dequeue(pane);
		}
	};

	var setAsClosed = function (pane, onInit) {
		var
			$P		= $Ps[pane]
		,	$R		= $Rs[pane]
		,	$T		= $Ts[pane]
		,	o		= options[pane]
		,	s		= state[pane]
		,	side	= _c[pane].side.toLowerCase()
		,	inset	= "inset"+ _c[pane].side
		,	rClass	= o.resizerClass
		,	tClass	= o.togglerClass
		,	_pane	= "-"+ pane // used for classNames
		,	_open	= "-open"
		,	_sliding= "-sliding"
		,	_closed	= "-closed"
		;
		$R
			.css(side, sC[inset]) // move the resizer
			.removeClass( rClass+_open +" "+ rClass+_pane+_open )
			.removeClass( rClass+_sliding +" "+ rClass+_pane+_sliding )
			.addClass( rClass+_closed +" "+ rClass+_pane+_closed )
			.unbind("dblclick."+ sID)
		;
		// DISABLE 'resizing' when closed - do this BEFORE bindStartSlidingEvent?
		if (o.resizable && typeof $.fn.draggable == "function")
			$R
				.draggable("disable")
				.removeClass("ui-state-disabled") // do NOT apply disabled styling - not suitable here
				.css("cursor", "default")
				.attr("title","")
			;

		// if pane has a toggler button, adjust that too
		if ($T) {
			$T
				.removeClass( tClass+_open +" "+ tClass+_pane+_open )
				.addClass( tClass+_closed +" "+ tClass+_pane+_closed )
				.attr("title", o.togglerTip_closed) // may be blank
			;
			// toggler-content - if exists
			$T.children(".content-open").hide();
			$T.children(".content-closed").css("display","block");
		}

		// sync any 'pin buttons'
		syncPinBtns(pane, false);

		if (!onInit) {
			// resize 'length' and position togglers for adjacent panes
			sizeHandles("all");
		}
	};

	/**
	 * open
	 *
	 * Open the specified pane (animation optional), and resize all other panes as needed
	 *
	 * @param String  pane   The pane being opened, ie: north, south, east, or west
	 */
	var open = function (pane, slide, noAnimation, noAlert) {
		var 
			$P		= $Ps[pane]
		,	$R		= $Rs[pane]
		,	$T		= $Ts[pane]
		,	o		= options[pane]
		,	s		= state[pane]
		,	doFX	= !noAnimation && s.isClosed && (o.fxName_open != "none")
		// 	transfer logic var to temp var
		,	isShowing = s.isShowing
		;
		// now clear the logic var
		delete s.isShowing;

		if (!$P || (!o.resizable && !o.closable)) return; // invalid request
		else if (s.isVisible && !s.isSliding) return; // already open

		// pane can ALSO be unhidden by just calling show(), so handle this scenario
		if (s.isHidden && !isShowing) {
			show(pane, true);
			return;
		}

		if (_c.isLayoutBusy) { // layout is 'busy' - probably with an animation
			_queue("open", pane, slide); // set a callback for this action, if possible
			return; // ABORT
		}

		// onopen_start callback - will CANCEL hide if returns false
		if (false === _execCallback(pane, o.onopen_start)) return;

		// make sure there is enough space available to open the pane
		setSizeLimits(pane, slide); // update pane-state
		if (s.minSize > s.maxSize) { // INSUFFICIENT ROOM FOR PANE TO OPEN!
			syncPinBtns(pane, false); // make sure pin-buttons are reset
			if (!noAlert && o.noRoomToOpenTip) alert(o.noRoomToOpenTip);
			return; // ABORT
		}

		// SET flow-control flags
		_c[pane].isMoving = true;
		_c.isLayoutBusy = true;

		if (slide) // START Sliding - will set isSliding=true
			bindStopSlidingEvents(pane, true); // BIND trigger events to close sliding-pane
		else if (s.isSliding) // PIN PANE (stop sliding) - open pane 'normally' instead
			bindStopSlidingEvents(pane, false); // UNBIND trigger events - will set isSliding=false

		s.noRoom = false; // will be reset by makePaneFit if 'noRoom'
		makePaneFit(pane);

		s.isVisible = true;
		s.isClosed	= false;
		// update isHidden BEFORE sizing panes - WHY??? Old?
		if (isShowing) s.isHidden = false;

		bindStartSlidingEvent(pane, false); // remove trigger event from resizer-bar

		if (doFX) { // ANIMATE
			lockPaneForFX(pane, true); // need to set left/top so animation will work
			$P.show( o.fxName_open, o.fxSettings_open, o.fxSpeed_open, function() {
				lockPaneForFX(pane, false); // undo
				open_2(); // continue
			});
		}
		else {// no animation
			$P.show();	// just show pane and...
			open_2();	// continue
		};

		// SUBROUTINE
		function open_2 () {
			if (s.isVisible) { // make sure pane was not closed or hidden before animation finished!

				// cure iframe display issues in IE & other browsers
				if (!state.browser.mozilla) { // skip FireFox - it auto-refreshes iframes onShow
					if (s.tagName == "IFRAME") $P.css(_c.hidden).css(_c.visible); 
					$P.find('IFRAME').css(_c.hidden).css(_c.visible); // ditto for interior iframes
				}

				// NOTE: if isSliding, then other panes are NOT 'resized'
				if (!s.isSliding) // resize all panes adjacent to this one
					sizeMidPanes(_c[pane].dir=="vert" ? "center" : "all");
				else if (o.slideTrigger_close == "mouseout") {
					if (isMouseOver(pane)) // handle Chrome browser glitch...
						clearTimer(pane+"_closeSlider"); // prevent premature close
					else
						slideClosed(pane);
				}

				// set classes, position handles and execute callbacks...
				setAsOpen(pane);
			}

			// internal flow-control callback
			_dequeue(pane);
		};
	
	};

	var setAsOpen = function (pane, onInit) {
		var 
			$P		= $Ps[pane]
		,	$R		= $Rs[pane]
		,	$T		= $Ts[pane]
		,	o		= options[pane]
		,	s		= state[pane]
		,	side	= _c[pane].side.toLowerCase()
		,	inset	= "inset"+ _c[pane].side
		,	rClass	= o.resizerClass
		,	tClass	= o.togglerClass
		,	_pane	= "-"+ pane // used for classNames
		,	_open	= "-open"
		,	_closed	= "-closed"
		,	_sliding= "-sliding"
		;
		$R
			.css(side, sC[inset] + getPaneSize(pane)) // move the resizer
			.removeClass( rClass+_closed +" "+ rClass+_pane+_closed )
			.addClass( rClass+_open +" "+ rClass+_pane+_open )
			.addClass( !s.isSliding ? "" : rClass+_sliding +" "+ rClass+_pane+_sliding )
			.bind("dblclick."+ sID, toggle )
		;
		removeHover( 0, $R ); // remove hover classes
		if (o.resizable && typeof $.fn.draggable == "function")
			$R
				.draggable("enable")
				.css("cursor", o.resizerCursor)
				.attr("title", o.resizerTip)
			;
		else
			$R.css("cursor", "default"); // n-resize, s-resize, etc

		// if pane also has a toggler button, adjust that too
		if ($T) {
			$T
				.removeClass( tClass+_closed +" "+ tClass+_pane+_closed )
				.addClass( tClass+_open +" "+ tClass+_pane+_open )
				.attr("title", o.togglerTip_open) // may be blank
			;
			removeHover( 0, $T ); // remove hover classes
			// toggler-content - if exists
			$T.children(".content-closed").hide();
			$T.children(".content-open").css("display","block");
		}

		// sync any 'pin buttons'
		syncPinBtns(pane, !s.isSliding);

		if (!onInit) {
			// resize resizer & toggler sizes for all panes
			sizeHandles("all");
			// resize content every time pane opens - to be sure
			sizeContent(pane);
		}

		if (!onInit || o.triggerEventsOnLoad) {
			// onopen callback
			_execCallback(pane, o.onopen_end || o.onopen);
			// ALSO call onresize because layout-size *may* have changed while pane was closed
			_execCallback(pane, o.onresize_end || o.onresize); // if (!onInit) 
			// onshow callback - TODO: should this be here?
			if (s.isShowing) _execCallback(pane, o.onshow_end || o.onshow);
		}

		// update pane-state dimensions
		$.extend(s, getElemDims($P), true);
	};


	/**
	 * lockPaneForFX
	 *
	 * Must set left/top on East/South panes so animation will work properly
	 *
	 * @param String  pane  The pane to lock, 'east' or 'south' - any other is ignored!
	 * @param Boolean  doLock  true = set left/top, false = remove
	 */
	var lockPaneForFX = function (pane, doLock) {
		var $P = $Ps[pane];
		if (doLock) {
			$P.css({ zIndex: _c.zIndex.pane_animate }); // overlay all elements during animation
			if (pane=="south")
				$P.css({ top: sC.insetTop + sC.innerHeight - $P.outerHeight() });
			else if (pane=="east")
				$P.css({ left: sC.insetLeft + sC.innerWidth - $P.outerWidth() });
		}
		else { // animation DONE - RESET CSS
			$P.css({ zIndex: (state[pane].isSliding ? _c.zIndex.pane_sliding : _c.zIndex.pane_normal) });
			if (pane=="south")
				$P.css({ top: "auto" });
			else if (pane=="east")
				$P.css({ left: "auto" });
			// fix anti-aliasing in IE - only needed for animations that change opacity
			var o = options[pane];
			if (state.browser.msie && o.fxOpacityFix && o.fxName_open != "slide" && $P.css("filter") && $P.css("opacity") == 1)
				$P[0].style.removeAttribute('filter');
		}
	};


	/**
	 * bindStartSlidingEvent
	 *
	 * Toggle sliding functionality of a specific pane on/off by adding removing 'slide open' trigger
	 *
	 * @callers  open(), close()
	 * @param String  pane  The pane to enable/disable, 'north', 'south', etc.
	 * @param Boolean  enable  Enable or Disable sliding?
	 */
	var bindStartSlidingEvent = function (pane, enable) {
		var 
			o		= options[pane]
		,	$R		= $Rs[pane]
		,	trigger	= o.slideTrigger_open
		;
		if (!$R || !o.slidable) return;
		// make sure we have a valid event
		if (trigger != "click" && trigger != "dblclick" && trigger != "mouseover")
			trigger = o.slideTrigger_open = "click";
		$R
			// add or remove trigger event
			[enable ? "bind" : "unbind"](trigger, slideOpen)
			// set the appropriate cursor & title/tip
			.css("cursor", (enable ? o.sliderCursor: "default"))
			.attr("title", (enable ? o.sliderTip : ""))
		;
	};

	/**
	 * bindStopSlidingEvents
	 *
	 * Add or remove 'mouseout' events to 'slide close' when pane is 'sliding' open or closed
	 * Also increases zIndex when pane is sliding open
	 * See bindStartSlidingEvent for code to control 'slide open'
	 *
	 * @callers  slideOpen(), slideClosed()
	 * @param String  pane  The pane to process, 'north', 'south', etc.
	 * @param Boolean  enable  Enable or Disable events?
	 */
	var bindStopSlidingEvents = function (pane, enable) {
		var 
			o		= options[pane]
		,	s		= state[pane]
		,	trigger	= o.slideTrigger_close
		,	action	= (enable ? "bind" : "unbind") // can't make 'unbind' work! - see disabled code below
		,	$P		= $Ps[pane]
		,	$R		= $Rs[pane]
		;

		s.isSliding = enable; // logic
		clearTimer(pane+"_closeSlider"); // just in case

		// raise z-index when sliding
		$P.css({ zIndex: (enable ? _c.zIndex.pane_sliding : _c.zIndex.pane_normal) });
		$R.css({ zIndex: (enable ? _c.zIndex.pane_sliding : _c.zIndex.resizer_normal) });

		// make sure we have a valid event
		if (trigger != "mouseout" && trigger != "click")
			trigger = o.slideTrigger_close = "mouseout";

		// when trigger is 'mouseout', must cancel timer when mouse moves between 'pane' and 'resizer'
		if (enable) { // BIND trigger events
			$R.bind(trigger+"."+ sID, slideClosed ); // click OR mouseout - 'click' on resizer will close
			if (trigger == "mouseout") {
				$P.bind("mouseout."+ sID, slideClosed );
				// must cancel timer when mouse moves between 'pane' and 'resizer'
				$P.bind("mouseover."+ sID, cancelMouseOut );
				$R.bind("mouseover."+ sID, cancelMouseOut );
			}
		}
		else { // UNBIND trigger events
			// TODO: why does unbind of a 'single function' not work reliably?
			//$P[action](trigger, slideClosed );
			$R.unbind(trigger+"."+ sID);
			if (trigger == "mouseout") {
				$P.unbind("mouseout."+ sID);
				$P.unbind("mouseover."+ sID);
				$R.unbind("mouseover."+ sID);
				clearTimer(pane+"_closeSlider");
			}
		}

		// SUBROUTINE for mouseout timer clearing
		function cancelMouseOut (evt) {
			clearTimer(pane+"_closeSlider");
			evt.stopPropagation();
		}
	};


	/**
	 * makePaneFit
	 *
	 * Hides/closes a pane if there is insufficient room - reverses this when there is room again
	 * MUST have already called setSizeLimits() before calling this method
	 */
	var makePaneFit = function (pane, isOpening, skipCallback) {
		var
			o = options[pane]
		,	s = state[pane]
		;
		// special handling for center pane
		if (pane == "center") {
			// see if there is enough room to display the center-pane
			if (s.minWidth <= s.maxWidth && s.minHeight <= s.maxHeight) {
				if (s.noRoom) { // previously hidden due to noRoom
					$Ps.center.show();
					s.noRoom = false;
				}
			}
			else // has room
				if (!s.noRoom) { // previously hidden due to noRoom
					$Ps.center.hide();
					s.noRoom = true;
				}
		}
		// see if there is enough room to fit the border-pane
		else if (s.minSize <= s.maxSize) { // pane CAN fit
			if (s.size > s.maxSize) // pane is too big - shrink it
				sizePane(pane, s.maxSize, skipCallback);
			else if (s.size < s.minSize) // pane is too small - enlarge it
				sizePane(pane, s.minSize, skipCallback);

			// if was previously hidden due to noRoom, then RESET because NOW there is room
			if (s.noRoom) {
				// s.noRoom state will be set by open or show
				if (s.wasOpen && o.closable) {
					if (o.autoReopen)
						open(pane, false, true, true); // true = noAnimation, true = noAlert
					else // leave the pane closed, so just update state
						s.noRoom = false;
				}
				else
					show(pane, s.wasOpen, true, true); // true = noAnimation, true = noAlert
			}
		}
		else // pane CANNOT fit
			if (!s.noRoom) { // pane not set as noRoom yet, so hide or close it now...
				s.noRoom = true; // update state
				s.wasOpen = !s.isClosed && !s.isSliding;
				if (o.closable) // always 'close' if possible
					close(pane, true, true); // true = force, true = noAnimation
				else // hide pane if not closable
					hide(pane, true); // true = noAnimation
			}
	};


	/**
	 * sizePane / manualSizePane
	 *
	 * sizePane is called only by internal methods whenever a pane needs to be resized
	 * manualSizePane is an exposed flow-through method allowing extra code when pane is 'manually resized'
	 *
	 * @param String	pane	The pane being resized
	 * @param Integer	size	The *desired* new size for this pane - will be validated
	 * @param Boolean	skipCallback	Should the onresize callback be run?
	 */
	var manualSizePane = function (pane, size, skipCallback) {
		// ANY call to sizePane will disabled autoResize
		options[pane].autoResize = false;
		// flow-through...
		sizePane(pane, size, skipCallback);
	};
	var sizePane = function (pane, size, skipCallback) {
		var 
			o		= options[pane]
		,	s		= state[pane]
		,	$P		= $Ps[pane]
		,	$R		= $Rs[pane]
		,	side	= _c[pane].side.toLowerCase()
		,	inset	= "inset"+ _c[pane].side
		,	oldSize
		;
		// calculate 'current' min/max sizes
		setSizeLimits(pane); // update pane-state
		oldSize = s.size;

		size = _parseSize(pane, size); // handle percentages & auto
		size = max(size, _parseSize(pane, o.minSize));
		size = min(size, s.maxSize);
		if (size < s.minSize) { // not enough room for pane!
			makePaneFit(pane, false, skipCallback);	// will hide or close pane
			return;
		}

		// IF newSize is same as oldSize, then nothing to do - abort
		if (size == oldSize) return;
		s.size = size;

		// resize the pane and move the resizer
		$P.css( _c[pane].sizeType.toLowerCase(), max(1, cssSize(pane, size)) );
		// update pane-state dimensions
		$.extend(s, getElemDims($P), true);
		// reposition the resizer-bar
		if ($R && $P.is(":visible")) $R.css( side, size + sC[inset] );

		// resize all the adjacent panes, and adjust their toggler buttons
		// when skipCallback passed, it means the controlling method will handle 'other panes'
		if (!skipCallback) {
			if (!s.isSliding) sizeMidPanes(_c[pane].dir=="horz" ? "all" : "center", skipCallback);
			sizeHandles("all");
		}

		sizeContent(pane);

		if (!skipCallback && s.isVisible)
			_execCallback(pane, o.onresize_end || o.onresize);

		// if opposite-pane was autoClosed, see if it can be autoOpened now
		var altPane = _c.altSide[pane];
		if (size < oldSize && state[ altPane ].noRoom) {
			setSizeLimits( altPane );
			makePaneFit( altPane, false, skipCallback );
		}
	};

	/**
	 * sizeMidPanes
	 *
	 * @callers  initPanes(), sizePane(), resizeAll(), open(), close(), hide()
	 */
	var sizeMidPanes = function (panes, skipCallback, onInit) {
		if (!panes || panes == "all") panes = "east,west,center";

		$.each(panes.split(","), function (i, pane) {
			if (!$Ps[pane]) return; // NO PANE - skip
			var 
				o		= options[pane]
			,	s		= state[pane]
			,	$P		= $Ps[pane]
			,	$R		= $Rs[pane]
			,	isCenter= (pane=="center")
			,	hasRoom	= true
			,	CSS		= {}
			,	d		= calcNewCenterPaneDims()
			;

			if (pane == "center") {
				if (d.width == s.outerWidth && d.height == s.outerHeight)
					return true; // SKIP - pane already the correct size
				CSS = d;
				// convert OUTER width/height to CSS width/height 
				CSS.width	= cssW(pane, CSS.width);
				CSS.height	= cssH(pane, CSS.height);
				hasRoom		= (CSS.width > 0 && CSS.height > 0);
				// set state.minWidth/Height/.maxWidth/Height for logic
				$.extend(s, cssMinSize(pane), {
					maxWidth:	max(0, CSS.width)
				,	maxHeight:	max(0, CSS.height)
				});
			}
			else { // for east and west, set only the height, which is same as center height
				if (d.height == s.outerHeight)
					return true; // SKIP - pane already the correct size
				CSS.top		= d.top;
				CSS.bottom	= d.bottom;
				CSS.height	= cssH(pane, d.height);
				hasRoom		= (CSS.height > 0);
			}

			if (hasRoom) {
				$P.css(CSS); // apply the CSS to pane
				if (pane == "center") $.extend(s, getElemDims($P)); // set new dimensions
				if (s.noRoom) makePaneFit(pane); // will re-open/show auto-closed/hidden pane
				if (!onInit) sizeContent(pane);
			}
			else if (!s.noRoom && s.isVisible) { // no room for pane
				makePaneFit(pane); // will hide or close pane
			}

			/*
			 * Extra CSS for IE6 or IE7 in Quirks-mode - add 'width' to NORTH/SOUTH panes
			 * Normally these panes have only 'left' & 'right' positions so pane auto-sizes
			 * ALSO required when pane is an IFRAME because will NOT default to 'full width'
			 */
			if (pane == "center") { // finished processing midPanes
				var fix = state.browser.isIE6;
				if ($Ps.north && (fix || state.north.tagName=="IFRAME")) 
					$Ps.north.css("width", cssW($Ps.north, sC.innerWidth));
				if ($Ps.south && (fix || state.south.tagName=="IFRAME"))
					$Ps.south.css("width", cssW($Ps.south, sC.innerWidth));
			}

			// resizeAll passes skipCallback because it triggers callbacks after ALL panes are resized
			if (!onInit && !skipCallback && s.isVisible)
				_execCallback(pane, o.onresize_end || o.onresize);
		});
	};


	/**
	 * resizeAll
	 *
	 * @callers  window.onresize(), callbacks or custom code
	 */
	var resizeAll = function () {
		var
			oldW	= sC.innerWidth
		,	oldH	= sC.innerHeight
		;
		$.extend( state.container, getElemDims( $Container ) ); // UPDATE container dimensions
		if (!sC.outerHeight) return; // cannot size layout when 'container' is hidden or collapsed

		// onresizeall_start will CANCEL resizing if returns false
		// state.container has already been set, so user can access this info for calcuations
		if (false === _execCallback(null, options.onresizeall_start)) return false;

		var
			// see if container is now 'smaller' than before
			shrunkH	= (sC.innerHeight < oldH)
		,	shrunkW	= (sC.innerWidth < oldW)
		,	o, s, dir
		;
		// NOTE special order for sizing: S-N-E-W
		$.each(["south","north","east","west"], function (i, pane) {
			if (!$Ps[pane]) return; // no pane - SKIP
			s	= state[pane];
			o	= options[pane];
			dir	= _c[pane].dir;
			if (o.autoResize && s.size != o.size) // resize pane to original size set in options
				sizePane(pane, o.size, true); // true - skipCallback
			else {
				setSizeLimits(pane);
				makePaneFit(pane, false, true); // true - skipCallback
			}
		});

		sizeMidPanes("all", true); // true - skipCallback
		sizeHandles("all"); // reposition the toggler elements

		// trigger all individual pane callbacks AFTER layout has finished resizing
		o = options; // reuse alias
		$.each(_c.allPanes.split(","), function (i, pane) {
			if (state[pane].isVisible) // undefined for non-existent panes
				_execCallback(null, o[pane].onresize_end || o[pane].onresize); // callback - if exists
		});
		_execCallback(null, o.onresizeall_end || o.onresizeall); // onresizeall callback, if exists
	};


	/**
	 * sizeContent
	 *
	 * IF pane has a content-div, then resize all elements inside pane to fit pane-height
	 */
	var sizeContent = function (panes, recalc) {
		if (!panes || panes == "all") panes = _c.allPanes;
		recalc = true; // Always recalc sizes for now

		$.each(panes.split(","), function (idx, pane) {
			if (!$Cs[pane]) return; // NO CONTENT - skip
			var 
				s		= state[pane].content
			,	$P		= $Ps[pane]
			,	$C		= $Cs[pane]
			,	pHeight	= cssH($P)	// pane.innerHeight
			,	above	= 0
			,	below	= 0
			;
			if (!$P.is(":visible"))
				return true; // NOT VISIBLE - skip
			else if (!recalc && s) {
				above = s.above;
				below = s.below;
			}
			else {
				var CSS		= _showInvisibly( $C );
					above	= $C.position().top;
				var
					cHeight	= $C.outerHeight() // EXCLUDING margins
				,	cBottom	= above + cHeight
				,	ignore	= options[pane].contentIgnoreSelector
				,	$Es		= $P.children()
				;

				for (var i = $Es.length-1; i >= 0; i--) {
					if ($Es[i] == $C[0]) break; // Content elem - NOTHING AFTER IT
					var $E = $( $Es[i] );
					if ((!ignore || !$E.is(ignore)) && $E.css("display") !="none" && !$E.hasClass('ui-layout-mask')) {
						var // IMPORTANT - must measure outerHeight() BEFORE position() or else eTop=0 - some kind of bug!
							eHt  = $E.outerHeight()
						,	eTop = $E.position().top
						,	eBot = eTop + eHt + _cssNum($E,'marginBottom')
						;
						below = eBot - cBottom;
						// save size-data to use next time
						state[pane].content = { above: above, below: below };
						break;
					}
					// restore original visiblity
					$C.css( CSS );
				}
			}
			// resize the Content element to fit -  will autoHide if not enough room
			setOuterHeight($C, (pHeight - above - below), true); // true=autoHide
		}); // END $.each(panes)
	};


	/**
	 * sizeHandles
	 *
	 * Called every time a pane is opened, closed, or resized to slide the togglers to 'center' and adjust their length if necessary
	 *
	 * @callers  initHandles(), open(), close(), resizeAll()
	 */
	var sizeHandles = function (panes, onInit) {
		if (!panes || panes == "all") panes = _c.borderPanes;

		$.each(panes.split(","), function (i, pane) {
			var 
				o	= options[pane]
			,	s	= state[pane]
			,	$P	= $Ps[pane]
			,	$R	= $Rs[pane]
			,	$T	= $Ts[pane]
			,	$TC
			;
			if (!$P || !$R) return;

			var
				dir			= _c[pane].dir
			,	_state		= (s.isClosed ? "_closed" : "_open")
			,	spacing		= o["spacing"+ _state]
			,	togAlign	= o["togglerAlign"+ _state]
			,	togLen		= o["togglerLength"+ _state]
			,	paneLen
			,	offset
			,	CSS = {}
			;
			if (spacing == 0) {
				$R.hide();
				return;
			}
			else if (!s.noRoom && !s.isHidden) // skip if resizer was hidden for any reason
				$R.show(); // in case was previously hidden

			// Resizer Bar is ALWAYS same width/height of pane it is attached to
			if (dir == "horz") { // north/south
				paneLen = $P.outerWidth(); // s.outerWidth || 
				if (s.resizerLength == paneLen) return; // SKIP - no resize needed
				s.resizerLength = paneLen;
				$R.css({
					width:	max(1, cssW($R, paneLen)) // account for borders & padding
				,	height:	max(0, cssH($R, spacing)) // ditto
				,	left:	_cssNum($P, "left")
				});
			}
			else { // east/west
				paneLen = $P.outerHeight(); // s.outerHeight || 
				if (s.resizerLength == paneLen) return; // SKIP - no resize needed
				s.resizerLength = paneLen;
				$R.css({
					height:	max(1, cssH($R, paneLen)) // account for borders & padding
				,	width:	max(0, cssW($R, spacing)) // ditto
				,	top:	sC.insetTop + getPaneSize("north", true)
				//,	top:	_cssNum($Ps["center"], "top")
				});
			}

			// remove hover classes
			removeHover( o, $R );

			if ($T) {
				if (togLen == 0 || (s.isSliding && o.hideTogglerOnSlide)) {
					$T.hide(); // always HIDE the toggler when 'sliding'
					return;
				}
				else
					$T.show(); // in case was previously hidden

				if (!(togLen > 0) || togLen == "100%" || togLen > paneLen) {
					togLen = paneLen;
					offset = 0;
				}
				else { // calculate 'offset' based on options.PANE.togglerAlign_open/closed
					if (typeof togAlign == "string") {
						switch (togAlign) {
							case "top":
							case "left":	offset = 0;
											break;
							case "bottom":
							case "right":	offset = paneLen - togLen;
											break;
							case "middle":
							case "center":
							default:		offset = Math.floor((paneLen - togLen) / 2); // 'default' catches typos
						}
					}
					else { // togAlign = number
						var x = parseInt(togAlign); //
						if (togAlign >= 0) offset = x;
						else offset = paneLen - togLen + x; // NOTE: x is negative!
					}
				}

				if (dir == "horz") { // north/south
					var width = cssW($T, togLen);
					$T.css({
						width:	max(0, width)  // account for borders & padding
					,	height:	max(1, cssH($T, spacing)) // ditto
					,	left:	offset // TODO: VERIFY that toggler  positions correctly for ALL values
					,	top:	0
					});
					// CENTER the toggler content SPAN
					$T.children(".content").each(function(){
						$TC = $(this);
						$TC.css("marginLeft", Math.floor((width-$TC.outerWidth())/2)); // could be negative
					});
				}
				else { // east/west
					var height = cssH($T, togLen);
					$T.css({
						height:	max(0, height)  // account for borders & padding
					,	width:	max(1, cssW($T, spacing)) // ditto
					,	top:	offset // POSITION the toggler
					,	left:	0
					});
					// CENTER the toggler content SPAN
					$T.children(".content").each(function(){
						$TC = $(this);
						$TC.css("marginTop", Math.floor((height-$TC.outerHeight())/2)); // could be negative
					});
				}

				// remove ALL hover classes
				removeHover( 0, $T );
			}

			// DONE measuring and sizing this resizer/toggler, so can be 'hidden' now
			if (onInit && o.initHidden) {
				$R.hide();
				if ($T) $T.hide();
			}
		});
	};


	/**
	 *	swapPanes
	 *
	 *	Move a pane from source-side (eg, west) to target-side (eg, east)
	 *	If pane exists on target-side, move that to source-side, ie, 'swap' the panes
	 */
	var swapPanes = function (pane1, pane2) {
		var
			oPane1	= copy( pane1 )
		,	oPane2	= copy( pane2 )
		,	sizes	= {}
		;
		sizes[pane1] = oPane1 ? oPane1.state.size : 0;
		sizes[pane2] = oPane2 ? oPane2.state.size : 0;

		// clear pointers & state
		$Ps[pane1] = false;
		$Ps[pane2] = false;
		state[pane1] = {};
		state[pane2] = {};
		
		// transfer element pointers and data to NEW Layout keys
		move( oPane1, pane2 );
		move( oPane2, pane1 );

		if (!$Ps[pane1] && $Rs[pane1]) {
			$Rs[pane1].remove();
			$Rs[pane1] = false;
			$Ts[pane1] = false;
		}

		if (!$Ps[pane2] && $Rs[pane2]) {
			$Rs[pane2].remove();
			$Rs[pane2] = false;
			$Ts[pane2] = false;
		}

		// resize layout - will move all elements as needed
		resizeAll();

		// make panes 'visible' again
		if ($Ps[pane1]) $Ps[pane1].css(_c.visible);
		if ($Ps[pane2]) $Ps[pane2].css(_c.visible);

		return;

		function copy (n) { // n = pane
			var
				$P	= $Ps[n]
			,	$C	= $Cs[n]
			;
			return !$P ? false : {
				pane:		n
			,	P:			$P ? $P[0] : false
			,	C:			$C ? $C[0] : false
			,	state:		$.extend({}, state[n])
			,	options:	$.extend({}, options[n])
			};
		};

		function move (oPane, pane) {
			if (!oPane) return;
			var
				P		= oPane.P
			,	C		= oPane.C
			,	oldPane = oPane.pane
			,	c		= _c[pane]
			,	side	= c.side.toLowerCase()
			,	inset	= "inset"+ c.side
			//	save pane-options that should be retained
			,	s		= $.extend({}, state[pane])
			,	o		= options[pane]
			//	RETAIN side-specific FX Settings - more below
			,	fx		= { resizerCursor: o.resizerCursor }
			,	re, size, pos
			;
			$.each("fxName,fxSpeed,fxSettings".split(","), function (i, k) {
				fx[k] = o[k];
				fx[k +"_open"]  = o[k +"_open"];
				fx[k +"_close"] = o[k +"_close"];
			});

			// update object pointers and attributes
			$Ps[pane] = $(P)
				.data("layoutEdge", pane)
				.css(_c.hidden)
				.css(c.cssReq)
			;
			$Cs[pane] = C ? $(C) : false;

			// set options and state
			options[pane]	= $.extend({}, oPane.options, fx);
			state[pane]		= $.extend({}, oPane.state);

			// change classNames on the pane, eg: ui-layout-pane-east ==> ui-layout-pane-west
			re = new RegExp("pane-"+ oldPane, "g");
			P.className = P.className.replace(re, "pane-"+ pane);

			if (!$Rs[pane]) {
				initHandles(pane); // create the required resizer & toggler
				initResizable(pane);
			}

			// if moving to different orientation, then keep 'target' pane size
			if (c.dir != _c[oldPane].dir) {
				size = sizes[pane] || 0;
				setSizeLimits(pane); // update pane-state
				size = max(size, state[pane].minSize);
				// use manualSizePane to disable autoResize - not useful after panes are swapped
				manualSizePane(pane, size, true); // true = skipCallback
			}
			else // move the resizer here
				$Rs[pane].css(side, sC[inset] + (state[pane].isVisible ? getPaneSize(pane) : 0));


			// ADD CLASSNAMES & SLIDE-BINDINGS
			if (oPane.state.isVisible && !s.isVisible)
				setAsOpen(pane, true); // true = onInit to disable callbacks
			else {
				setAsClosed(pane, true); // true = onInit to disable callbacks
				bindStartSlidingEvent(pane, true); // will enable events IF option is set
			}

			// DESTROY the object
			oPane = null;
		};
	};


	/**
	 * keyDown
	 *
	 * Capture keys when enableCursorHotkey - toggle pane if hotkey pressed
	 *
	 * @callers  document.keydown()
	 */
	function keyDown (evt) {
		if (!evt) return true;
		var code = evt.keyCode;
		if (code < 33) return true; // ignore special keys: ENTER, TAB, etc

		var
			PANE = {
				38: "north" // Up Cursor
			,	40: "south" // Down Cursor
			,	37: "west"  // Left Cursor
			,	39: "east"  // Right Cursor
			}
		,	ALT		= evt.altKey // no worky!
		,	SHIFT	= evt.shiftKey
		,	CTRL	= evt.ctrlKey
		,	CURSOR	= (CTRL && code >= 37 && code <= 40)
		,	o, k, m, pane
		;

		if (CURSOR && options[PANE[code]].enableCursorHotkey) // valid cursor-hotkey
			pane = PANE[code];
		else if (CTRL || SHIFT) // check to see if this matches a custom-hotkey
			$.each(_c.borderPanes.split(","), function (i, p) { // loop each pane to check its hotkey
				o = options[p];
				k = o.customHotkey;
				m = o.customHotkeyModifier; // if missing or invalid, treated as "CTRL+SHIFT"
				if ((SHIFT && m=="SHIFT") || (CTRL && m=="CTRL") || (CTRL && SHIFT)) { // Modifier matches
					if (k && code == (isNaN(k) || k <= 9 ? k.toUpperCase().charCodeAt(0) : k)) { // Key matches
						pane = p;
						return false; // BREAK
					}
				}
			});

		// validate pane
		if (!pane || !$Ps[pane] || state[pane].isHidden)
			return true;

		toggle(pane);
		evt.stopPropagation();

		// "returnValue=false"	= abort keystroke but NOT abort function
		// "return false"		= abort keystroke AND abort function
		evt.returnValue = false; // CANCEL key
		return false;
	};


/*
 * ######################################
 *      UTILITY METHODS
 *   called externally or by initButtons
 * ######################################
 */

	/**
	* allowOverflow / resetOverflow
	*
	* Change/reset a pane's overflow setting & zIndex to allow popups/drop-downs to work
	*
	* @param element   elem 	Optional - can also be 'bound' to a click, mouseOver, or other event
	*/
	function allowOverflow (el) {
		if (this && this.tagName) el = this; // BOUND to element
		var $P;
		if (typeof el == "string")
			$P = $Ps[el];
		else if ($(el).data("layoutRole"))
			$P = $(el);
		else
			$(el).parents.each(function(){
				if ($(this).data("layoutRole")) {
					$P = $(this);
					return false; // BREAK
				}
			});
		if (!$P || !$P.length) return; // INVALID

		var
			pane	= $P.data("layoutEdge")
		,	s		= state[pane]
		;

		// if pane is already raised, then reset it before doing it again!
		// this would happen if allowOverflow is attached to BOTH the pane and an element 
		if (s.cssSaved)
			resetOverflow(pane); // reset previous CSS before continuing

		// if pane is raised by sliding or resizing, or it's closed, then abort
		if (s.isSliding || s.isResizing || s.isClosed) {
			s.cssSaved = false;
			return;
		}

		var
			newCSS	= { zIndex: (_c.zIndex.pane_normal + 1) }
		,	curCSS	= {}
		,	of		= $P.css("overflow")
		,	ofX		= $P.css("overflowX")
		,	ofY		= $P.css("overflowY")
		;
		// determine which, if any, overflow settings need to be changed
		if (of != "visible") {
			curCSS.overflow = of;
			newCSS.overflow = "visible";
		}
		if (ofX && ofX != "visible" && ofX != "auto") {
			curCSS.overflowX = ofX;
			newCSS.overflowX = "visible";
		}
		if (ofY && ofY != "visible" && ofY != "auto") {
			curCSS.overflowY = ofX;
			newCSS.overflowY = "visible";
		}

		// save the current overflow settings - even if blank!
		s.cssSaved = curCSS;

		// apply new CSS to raise zIndex and, if necessary, make overflow 'visible'
		$P.css( newCSS );

		// make sure the zIndex of all other panes is normal
		$.each(_c.allPanes.split(","), function(i, p) {
			if (p != pane) resetOverflow(p);
		});

	};

	function resetOverflow (el) {
		if (this && this.tagName) el = this; // BOUND to element
		var $P;
		if (typeof el == "string")
			$P = $Ps[el];
		else if ($(el).data("layoutRole"))
			$P = $(el);
		else
			$(el).parents.each(function(){
				if ($(this).data("layoutRole")) {
					$P = $(this);
					return false; // BREAK
				}
			});
		if (!$P || !$P.length) return; // INVALID

		var
			pane	= $P.data("layoutEdge")
		,	s		= state[pane]
		,	CSS		= s.cssSaved || {}
		;
		// reset the zIndex
		if (!s.isSliding && !s.isResizing)
			$P.css("zIndex", _c.zIndex.pane_normal);

		// reset Overflow - if necessary
		$P.css( CSS );

		// clear var
		s.cssSaved = false;
	};


	/**
	* getBtn
	*
	* Helper function to validate params received by addButton utilities
	*
	* Two classes are added to the element, based on the buttonClass...
	* The type of button is appended to create the 2nd className:
	*  - ui-layout-button-pin
	*  - ui-layout-pane-button-toggle
	*  - ui-layout-pane-button-open
	*  - ui-layout-pane-button-close
	*
	* @param String   selector 	jQuery selector for button, eg: ".ui-layout-north .toggle-button"
	* @param String   pane 		Name of the pane the button is for: 'north', 'south', etc.
	* @returns  If both params valid, the element matching 'selector' in a jQuery wrapper - otherwise 'false'
	*/
	function getBtn(selector, pane, action) {
		var $E	= $(selector);
		if (!$E.length) // element not found
			alert(lang.errButton + lang.selector +": "+ selector);
		else if (_c.borderPanes.indexOf(pane) == -1) // invalid 'pane' sepecified
			alert(lang.errButton + lang.Pane.toLowerCase() +": "+ pane);
		else { // VALID
			var btn = options[pane].buttonClass +"-"+ action;
			$E
				.addClass( btn +" "+ btn +"-"+ pane )
				.data("layoutName", options.name) // add layout identifier - even if blank!
			;
			return $E;
		}
		return false;  // INVALID
	};


	/**
	* bindButton
	*
	* NEW syntax for binding layout-buttons - will eventually replace addToggleBtn, addOpenBtn, etc.
	*
	*/
	function bindButton (selector, action, pane) {
		switch (action.toLowerCase()) {
			case "toggle":	addToggleBtn(selector, pane);	break;	
			case "open":	addOpenBtn(selector, pane);		break;
			case "close":	addCloseBtn(selector, pane);	break;
			case "pin":		addPinBtn(selector, pane);
		}
	};

	/**
	* addToggleBtn
	*
	* Add a custom Toggler button for a pane
	*
	* @param String   selector 	jQuery selector for button, eg: ".ui-layout-north .toggle-button"
	* @param String   pane 		Name of the pane the button is for: 'north', 'south', etc.
	*/
	function addToggleBtn (selector, pane) {
		var $E = getBtn(selector, pane, "toggle");
		if ($E)
			$E
				.attr("title", state[pane].isClosed ? lang.Open : lang.Close)
				.click(function (evt) {
					toggle(pane);
					evt.stopPropagation();
				})
			;
	};

	/**
	* addOpenBtn
	*
	* Add a custom Open button for a pane
	*
	* @param String   selector 	jQuery selector for button, eg: ".ui-layout-north .open-button"
	* @param String   pane 		Name of the pane the button is for: 'north', 'south', etc.
	*/
	function addOpenBtn (selector, pane) {
		var $E = getBtn(selector, pane, "open");
		if ($E)
			$E
				.attr("title", lang.Open)
				.click(function (evt) {
					open(pane);
					evt.stopPropagation();
				})
			;
	};

	/**
	* addCloseBtn
	*
	* Add a custom Close button for a pane
	*
	* @param String   selector 	jQuery selector for button, eg: ".ui-layout-north .close-button"
	* @param String   pane 		Name of the pane the button is for: 'north', 'south', etc.
	*/
	function addCloseBtn (selector, pane) {
		var $E = getBtn(selector, pane, "close");
		if ($E)
			$E
				.attr("title", lang.Close)
				.click(function (evt) {
					close(pane);
					evt.stopPropagation();
				})
			;
	};

	/**
	* addPinBtn
	*
	* Add a custom Pin button for a pane
	*
	* Four classes are added to the element, based on the paneClass for the associated pane...
	* Assuming the default paneClass and the pin is 'up', these classes are added for a west-pane pin:
	*  - ui-layout-pane-pin
	*  - ui-layout-pane-west-pin
	*  - ui-layout-pane-pin-up
	*  - ui-layout-pane-west-pin-up
	*
	* @param String   selector 	jQuery selector for button, eg: ".ui-layout-north .ui-layout-pin"
	* @param String   pane 		Name of the pane the pin is for: 'north', 'south', etc.
	*/
	function addPinBtn (selector, pane) {
		var $E = getBtn(selector, pane, "pin");
		if ($E) {
			var s = state[pane];
			$E.click(function (evt) {
				setPinState($(this), pane, (s.isSliding || s.isClosed));
				if (s.isSliding || s.isClosed) open( pane ); // change from sliding to open
				else close( pane ); // slide-closed
				evt.stopPropagation();
			});
			// add up/down pin attributes and classes
			setPinState ($E, pane, (!s.isClosed && !s.isSliding));
			// add this pin to the pane data so we can 'sync it' automatically
			// PANE.pins key is an array so we can store multiple pins for each pane
			_c[pane].pins.push( selector ); // just save the selector string
		}
	};

	/**
	* syncPinBtns
	*
	* INTERNAL function to sync 'pin buttons' when pane is opened or closed
	* Unpinned means the pane is 'sliding' - ie, over-top of the adjacent panes
	*
	* @callers  open(), close()
	* @params  pane   These are the params returned to callbacks by layout()
	* @params  doPin  True means set the pin 'down', False means 'up'
	*/
	function syncPinBtns (pane, doPin) {
		$.each(_c[pane].pins, function (i, selector) {
			setPinState($(selector), pane, doPin);
		});
	};

	/**
	* setPinState
	*
	* Change the class of the pin button to make it look 'up' or 'down'
	*
	* @callers  addPinBtn(), syncPinBtns()
	* @param Element  $Pin		The pin-span element in a jQuery wrapper
	* @param Boolean  doPin		True = set the pin 'down', False = set it 'up'
	* @param String   pinClass	The root classname for pins - will add '-up' or '-down' suffix
	*/
	function setPinState ($Pin, pane, doPin) {
		var updown = $Pin.attr("pin");
		if (updown && doPin == (updown=="down")) return; // already in correct state
		var
			pin		= options[pane].buttonClass +"-pin"
		,	side	= pin +"-"+ pane
		,	UP		= pin +"-up "+	side +"-up"
		,	DN		= pin +"-down "+side +"-down"
		;
		$Pin
			.attr("pin", doPin ? "down" : "up") // logic
			.attr("title", doPin ? lang.Unpin : lang.Pin)
			.removeClass( doPin ? UP : DN ) 
			.addClass( doPin ? DN : UP ) 
		;
	};


	/*
	 *	LAYOUT STATE MANAGEMENT
	 *
	 *	@example .layout({ cookie: { name: "myLayout", keys: "west.isClosed,east.isClosed" } })
	 *	@example .layout({ cookie__name: "myLayout", cookie__keys: "west.isClosed,east.isClosed" })
	 *	@example myLayout.getState( "west.isClosed,north.size,south.isHidden" );
	 *	@example myLayout.saveCookie( "west.isClosed,north.size,south.isHidden", {expires: 7} );
	 *	@example myLayout.deleteCookie();
	 *	@example myLayout.loadCookie();
	 *	@example var hSaved = myLayout.state.cookie;
	 */

	function isCookiesEnabled () {
		// TODO: is the cookieEnabled property common enough to be useful???
		return (navigator.cookieEnabled != 0);
	};
	
	/*
	 * getCookie
	 *
	 * Read & return data from the cookie - as JSON
	 */
	function getCookie (opts) {
		var
			o		= $.extend( {}, options.cookie, opts || {} )
		,	name	= o.name || options.name || "Layout"
		,	c		= document.cookie
		,	cs		= c ? c.split(';') : []
		,	pair	// loop var
		;
		for (var i=0, n=cs.length; i < n; i++) {
			pair = $.trim(cs[i]).split('='); // name=value pair
			if (pair[0] == name) // found the layout cookie
				// convert cookie string back to a hash
				return decodeJSON( decodeURIComponent(pair[1]) );
		}
		return "";
	};

	/*
	 * saveCookie
	 *
	 * Get the current layout state and save it to a cookie
	 */
	function saveCookie (keys, opts) {
		var
			o		= $.extend( {}, options.cookie, opts || {} )
		,	name	= o.name || options.name || "Layout"
		,	params	= ''
		,	date	= ''
		,	clear	= false
		;
		if (o.expires.toUTCString)
			date = o.expires;
		else if (typeof o.expires == 'number') {
			date = new Date();
			if (o.expires > 0)
				date.setDate(date.getDate() + o.expires);
			else {
				date.setYear(1970);
				clear = true;
			}
		}
		if (date)		params += ';expires='+ date.toUTCString();
		if (o.path)		params += ';path='+ o.path;
		if (o.domain)	params += ';domain='+ o.domain;
		if (o.secure)	params += ';secure';

		if (clear) {
			state.cookie = {}; // clear data
			document.cookie = name +'='+ params; // expire the cookie
		}
		else {
			state.cookie = getState(keys || o.keys); // read current panes-state
			document.cookie = name +'='+ encodeURIComponent( encodeJSON(state.cookie) ) + params; // write cookie
		}

		return $.extend({}, state.cookie); // return COPY of state.cookie
	};

	/*
	 * deleteCookie
	 *
	 * Remove the state cookie
	 */
	function deleteCookie () {
		saveCookie('', { expires: -1 });
	};

	/*
	 * loadCookie
	 *
	 * Get data from the cookie and USE IT to loadState
	 */
	function loadCookie (opts) {
		var o = getCookie(opts); // READ the cookie
		if (o) {
			state.cookie = $.extend({}, o); // SET state.cookie
			loadState(o);	// LOAD the retrieved state
		}
		return o;
	};

	/*
	 * loadState
	 *
	 * Update layout options from the cookie, if one exists
	 */
	function loadState (opts) {
		$.extend( true, options, opts ); // update layout options
	};

	/*
	 * getState
	 *
	 * Get the *current layout state* and return it as a hash
	 */
	function getState (keys) {
		var
			data	= {}
		,	alt		= { isClosed: 'initClosed', isHidden: 'initHidden' }
		,	pair, pane, key, val
		;
		if (!keys) keys = options.cookie.keys; // if called by user
		if ($.isArray(keys)) keys = keys.join(",");
		// convert keys to an array and change delimiters from '__' to '.'
		keys = keys.replace(/__/g, ".").split(',');
		// loop keys and create a data hash
		for (var i=0,n=keys.length; i < n; i++) {
			pair = keys[i].split(".");
			pane = pair[0];
			key  = pair[1];
			if (_c.allPanes.indexOf(pane) < 0) continue; // bad pane!
			val = state[ pane ][ key ];
			if (val == undefined) continue;
			if (key=="isClosed" && state[pane]["isSliding"])
				val = true; // if sliding, then *really* isClosed
			( data[pane] || (data[pane]={}) )[ alt[key] ? alt[key] : key ] = val;
		}
		return data;
	};

	/*
	 * encodeJSON
	 *
	 * Stringify a JSON hash so can save in a cookie or db-field
	 */
	function encodeJSON (JSON) {
		return parse( JSON );
		function parse (h) {
			var D=[], i=0, k, v, t; // k = key, v = value
			for (k in h) {
				v = h[k];
				t = typeof v;
				if (t == 'string')		// STRING - add quotes
					v = '"'+ v +'"';
				else if (t == 'object')	// SUB-KEY - recurse into it
					v = parse(v);
				D[i++] = '"'+ k +'":'+ v;
			}
			return "{"+ D.join(",") +"}";
		};
	};

	/*
	 * decodeJSON
	 *
	 * Convert stringified JSON back to a hash object
	 */
	function decodeJSON (str) {
		try { return window["eval"]("("+ str +")") || {}; }
		catch (e) { return {}; }
	};


/*
 * #####################
 * CREATE/RETURN LAYOUT
 * #####################
 */

	// validate the container
	if (!$(this).length) {
		alert( lang.errContainerMissing );
		return {};
	};

	// init global vars
	var 
		$Container = $(this) // Container element
	,	$Ps	= {} // Panes x5	- set in initPanes()
	,	$Cs	= {} // Content x5	- set in initPanes()
	,	$Rs	= {} // Resizers x4	- set in initHandles()
	,	$Ts	= {} // Togglers x4	- set in initHandles()
	//	aliases for code brevity
	,	sC	= state.container // alias for easy access to 'container dimensions'
	,	sID	= state.id // alias for unique layout ID/namespace - eg: "layout435"
	;

	// return object pointers to expose data & option Properties, and primary action Methods
	var Instance = {
		options:		options			// property - options hash
	,	state:			state			// property - dimensions hash
	,	container:		$Container		// property - object pointers for layout container
	,	panes:			$Ps				// property - object pointers for ALL panes: panes.north, panes.center
	,	toggle:			toggle			// method - pass a 'pane' ("north", "west", etc)
	,	open:			open			// method - ditto
	,	close:			close			// method - ditto
	,	hide:			hide			// method - ditto
	,	show:			show			// method - ditto
	,	resizeContent:	sizeContent		// method - ditto - DEPRICATED - "resize" is inconsistent
	,	sizeContent:	sizeContent		// method - pass a 'pane'
	,	sizePane:		manualSizePane	// method - pass a 'pane' AND an 'outer-size' in pixels or percent, or 'auto'
	,	swapPanes:		swapPanes		// method - pass TWO 'panes' - will swap them
	,	resizeAll:		resizeAll		// method - no parameters
	,	destroy:		destroy			// method - no parameters
	,	setSizeLimits:	setSizeLimits	// method - pass a 'pane' - update state min/max data
	,	bindButton:		bindButton		// utility - pass element selector, 'action' and 'pane' (E, "toggle", "west")
	,	addToggleBtn:	addToggleBtn	// utility - pass element selector and 'pane' (E, "west")
	,	addOpenBtn:		addOpenBtn		// utility - ditto
	,	addCloseBtn:	addCloseBtn		// utility - ditto
	,	addPinBtn:		addPinBtn		// utility - ditto
	,	allowOverflow:	allowOverflow	// utility - pass calling element (this)
	,	resetOverflow:	resetOverflow	// utility - ditto
	,	encodeJSON:		encodeJSON		// method - pass a JSON object
	,	decodeJSON:		decodeJSON		// method - pass a string of encoded JSON
	,	getState:		getState		// method - returns hash of current layout-state
	,	getCookie:		getCookie		// method - update options from cookie - returns hash of cookie data
	,	saveCookie:		saveCookie		// method - optionally pass keys-list and cookie-options (hash)
	,	deleteCookie:	deleteCookie	// method
	,	loadCookie:		loadCookie		// method - update options from cookie - returns hash of cookie data
	,	loadState:		loadState		// method - pass a hash of state to use to update options
	,	cssWidth:		cssW			// utility - pass element and target outerWidth
	,	cssHeight:		cssH			// utility - ditto
	,	isMouseOver:	isMouseOver		// utility - pass any element OR 'pane' - returns true or false
	};

	// create the border layout NOW
	create();

	// return the Instance object
	return Instance;

};
})( jQuery );
/*
 * END OF FILE - /trunk/3rd/jquery/ui.layout.js
 */

/*
 * START OF FILE - /trunk/3rd/jquery/xmlns.js
 */
//
//  jquery.xmlns.js:  xml-namespace selector support for jQuery
//
//  This plugin modifies the jQuery tag and attribute selectors to
//  support optional namespace specifiers as defined in CSS 3.
//
//    $("elem")      - matches 'elem' nodes in the default namespace
//    $("|elem")     - matches 'elem' nodes that don't have a namespace
//    $("NS|elem")   - matches 'elem' nodes in declared namespace 'NS'
//    $("*|elem")    - matches 'elem' nodes in any namespace
//    $("NS|*")      - matches any nodes in declared namespace 'NS'
//
//  A similar synax is also supported for attribute selectors, but note
//  that the default namespace does *not* apply to attributes - a missing
//  or empty namespace selector selects only attributes with no namespace.
//
//  In a slight break from the W3C standards, and with a nod to ease of
//  implementation, the empty namespace URI is treated as equivalent to
//  an unspecified namespace.  Plenty of browsers seem to make the same
//  assumption...
//
//  Namespace declarations live in the $.xmlns object, which is a simple
//  mapping from namespace ids to namespace URIs.  The default namespace
//  is determined by the value associated with the empty string.
//
//    $.xmlns.D = "DAV:"
//    $.xmlns.FOO = "http://www.foo.com/xmlns/foobar"
//    $.xmlns[""] = "http://www.example.com/new/default/namespace/"
//
//  Unfortunately this is a global setting - I can't find a way to do
//  query-object-specific namespaces since the jQuery selector machinery
//  is stateless.  However, you can use the 'xmlns' function to push and
//  pop namespace delcarations with ease:
//
//    $().xmlns({D:"DAV:"})     // pushes the DAV: namespace
//    $().xmlns("DAV:")         // makes DAV: the default namespace
//    $().xmlns(false)          // pops the namespace we just pushed
//    $().xmlns(false)          // pops again, returning to defaults
//
//  To execute ths as a kind of "transaction", pass a function as the
//  second argument.  It will be executed in the context of the current
//  jQuery object:
//
//    $().xmlns("DAV:",function() {
//      //  The default namespace is DAV: within this function,
//      //  but it is reset to the previous value on exit.
//      return this.find("response").each(...);
//    }).find("div")
//
//
//  And finally, the legal stuff:
//
//    Copyright (c) 2009, Ryan Kelly.
//    TAG and ATTR functions derived from jQuery's selector.js.
//    Dual licensed under the MIT and GPL licenses.
//    http://docs.jquery.com/License
//

(function($) {

//  Some common default namespaces, that are treated specially by browsers.
//
var default_xmlns = {
    "xml": "http://www.w3.org/XML/1998/namespace",
    "xmlns": "http://www.w3.org/2000/xmlns/",
    "html": "http://www.w3.org/1999/xhtml/"
};
 

//  A reverse mapping for common namespace prefixes.
//
var default_xmlns_rev = {};
for(var k in default_xmlns) {
    default_xmlns_rev[default_xmlns[k]] = k;
}


//  $.xmlns is a mapping from namespace identifiers to namespace URIs.
//  The default default-namespace is "*", and we provide some additional
//  defaults that are specified in the XML Namespaces standard.
//
$.extend({xmlns: $.extend({},default_xmlns,{"":"*"})});


//  jQuery method to push/pop namespace declarations.
//
//  If a single argument is specified:
//    * if it's a mapping, push those namespaces onto the stack
//    * if it's a string, push that as the default namespace
//    * if it evaluates to false, pop the latest namespace
//
//  It two arguments are specified, the second argument must be a function.
//  It will be called in the context of the current jQuery object, with the
//  given namespace mapping automatically pushed and then popped.
//
var xmlns_stack = [];
$.fn.extend({xmlns: function(nsmap,func) {
    if(typeof nsmap == "string") {
        nsmap = {"":nsmap};
    }
    if(nsmap) {
        xmlns_stack.push($.xmlns);
        $.xmlns = $.extend({},$.xmlns,nsmap);
        if(func) {
            var self = func.call(this);
            if(!self) {
                self = this;
            }
            return self.xmlns(undefined);
        } else {
            return this;
        }
    } else {
        $.xmlns = (xmlns_stack ? xmlns_stack.pop() : {});
        return this;
    }
}});


//  Convert a namespace prefix into a namespace URI, based
//  on the delcarations made in $.xmlns.
//
var getNamespaceURI = function(id) {
    // No namespace id, use the default.
    if(!id) {
        return $.xmlns[""];
    }
    // Strip the pipe character from the specifier
    id = id.substr(0,id.length-1);
    // Certain special namespaces aren't mapped to a URI
    if(id == "" || id == "*") {
        return id;
    }
    var ns = $.xmlns[id];
    if(typeof(ns) == "undefined") {
        throw "Syntax error, undefined namespace prefix '" + id + "'";
    }
    return ns;
};


//  Modify the TAG match regexp to include optional namespace selector.
//  This is basically (namespace|)?(tagname).
//
$.expr.match.TAG = /^((?:[\w\u00c0-\uFFFF\*_-]*\|)?)((?:[\w\u00c0-\uFFFF\*_-]|\\.)+)/;


//  Sometimes getElementsByTagName("*") will return comment nodes,
//  which we will have to remove from the results.
//
var gebtn_yields_comments = false;
var div = document.createElement("div");
div.appendChild(document.createComment(""));
if(div.getElementsByTagName("*").length > 0) {
    gebtn_yields_comments = true;
}
div = null;


//  Modify the TAG find function to account for a namespace selector.
//
$.expr.find.TAG = function(match,context,isXML) {
    var ns = getNamespaceURI(match[1]);
    var ln = match[2];
    var res;
    if(typeof context.getElementsByTagNameNS != "undefined") {
        //  Easy case - we have getElementsByTagNameNS
        res = context.getElementsByTagNameNS(ns,ln);
    } else if(typeof context.selectNodes != "undefined") {
        //  Use xpath if possible (not available on HTML DOM nodes in IE)
        if(context.ownerDocument) {
            context.ownerDocument.setProperty("SelectionLanguage","XPath");
        } else {
            context.setProperty("SelectionLanguage","XPath");
        }
        var predicate = "";
        if(ns != "*") {
            if(ln != "*") {
                predicate="namespace-uri()='"+ns+"' and local-name()='"+ln+"'";
            } else {
                predicate="namespace-uri()='"+ns+"'";
            }
        } else {
            if(ln != "*") {
                predicate="local-name()='"+ln+"'";
            }
        }
        if(predicate) {
            res = context.selectNodes("descendant-or-self::*["+predicate+"]");
        } else {
            res = context.selectNodes("descendant-or-self::*");
        }
    } else {
        //  Otherwise, we need to simulate using getElementsByTagName
        res = context.getElementsByTagName(ln); 
        if(gebtn_yields_comments && ln == "*") {
            var tmp = [];
            for(var i=0; res[i]; i++) {
                if(res[i].nodeType == 1) {
                    tmp.push(res[i]);
                }
            }
            res = tmp;
        }
        if(res && ns != "*") {
            var tmp = [];
            for(var i=0; res[i]; i++) {
               if(res[i].namespaceURI == ns || res[i].tagUrn == ns) {
                   tmp.push(res[i]);
               }
            }
            res = tmp;
        }
    }
    return res;
};


//  Check whether a node is part of an XML document.
//  Copied verbatim from jQuery sources, needed in TAG preFilter below.
//
var isXML = function(elem){
    return elem.nodeType === 9 && elem.documentElement.nodeName !== "HTML" ||
            !!elem.ownerDocument && elem.ownerDocument.documentElement.nodeName !== "HTML";
};


//  Modify the TAG preFilter function to work with modified match regexp.
//  This uppercases the tag name if we're in a HTML document.
//
$.expr.preFilter.TAG = function(match,curLoop) {
  for (var i=0; curLoop[i] === false; i++){}
  var ln = curLoop[i] && isXML(curLoop[i]) ? match[2] : match[2].toUpperCase();
  return [match[0],getNamespaceURI(match[1]),ln];
};


//  Modify the TAG filter function to account for a namespace selector.
//
$.expr.filter.TAG = function(elem,match) {
    var ns = match[1];
    var ln = match[2];
    var e_ns = elem.namespaceURI ? elem.namespaceURI : elem.tagUrn;
    var e_ln = elem.localName ? elem.localName : elem.tagName;
    if(ns == "*" || en_s == ns || (ns == "" && !e_ns)) {
        return ((ln == "*" && elem.nodeType == 1)  || e_ln == ln);
    }
    return false;
};


//  Modify the ATTR match regexp to extract a namespace selector.
//  This is basically ([namespace|])(attrname)(op)(quote)(pattern)(quote)
//
$.expr.match.ATTR = /\[\s*((?:[\w\u00c0-\uFFFF\*_-]*\|)?)((?:[\w\u00c0-\uFFFF_-]|\\.)+)\s*(?:(\S?=)\s*(['"]*)(.*?)\4|)\s*\]/;

//  Modify the ATTR preFilter function to account for new regexp match groups,
//  and normalise the namespace URI.
//
$.expr.preFilter.ATTR = function(match, curLoop, inplace, result, not, isXML) {
    var name = match[2].replace(/\\/g, "");
    if(!isXML && $.expr.attrMap[name]) {
        match[2] = $.expr.attrMap[name];
    }
    if( match[3] == "~=" ) {
        match[5] = " " + match[5] + " ";
    }
    if(!match[1] || match[1] == "|") {
        match[1] = "";
    } else {
        match[1] = getNamespaceURI(match[1]);
    }
    return match;
};


//  Modify the ATTR filter function to account for namespace selector.
//  Unfortunately this means factoring out the attribute-checking code
//  into a separate function, since it might be called multiple times.
//
var filter_attr = function(result,type,check) {
    var value = result + "";
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
                value === check || value.substr(0,check.length+1)===check+"-" :
                false;
};


$.expr.filter.ATTR = function(elem, match) {
    var ns = match[1];
    var name = match[2];
    var type = match[3];
    var check = match[5];
    var result;
    //  No namespace, just use ordinary attribute lookup.
    if(ns == "") {
        result = $.expr.attrHandle[name] ?
                     $.expr.attrHandle[name](elem) :
                     elem[name] != null ?
                         elem[name] :
                         elem.getAttribute(name);
        return filter_attr(result,type,check);
    }
    //  Directly use getAttributeNS if applicable and available
    if(ns != "*" && typeof elem.getAttributeNS != "undefined") {
        return filter_attr(elem.getAttributeNS(ns,name),type,check);
    }
    //  Need to iterate over all attributes, either because we couldn't
    //  look it up or because we need to match any namespace.
    var attrs = elem.attributes;
    for(var i=0; attrs[i]; i++) {
        var ln = attrs[i].localName;
        if(!ln) {
            ln = attrs[i].nodeName;
            var idx = ln.indexOf(":");
            if(idx >= 0) {
                ln = ln.substr(idx+1);
            }
        }
        if(ln == name) {
            result = attrs[i].nodeValue;
            if(ns == "*" || attrs[i].namespaceURI == ns) {
                if(filter_attr(result,type,check)) {
                    return true;
                }
            }
            if(attrs[i].namespaceURI === "" && attrs[i].prefix) {
                if(attrs[i].prefix == default_xmlns_rev[ns]) {
                    if(filter_attr(result,type,check)) {
                        return true;
                    }
                }
            }
        }
    }
    return false;
};


})(jQuery);


/*
 * END OF FILE - /trunk/3rd/jquery/xmlns.js
 */

/*
 * START OF FILE - /trunk/null.loading.js
 */
/*!
 *  NUL language JavaScript framework
 *  (c) 2009 E-med Ware
 *
 * NUL is freely distributable under the terms of GNU GPLv3 license.
 *  For details, see the NUL project site : http://code.google.com/p/nul/
 *
 *--------------------------------------------------------------------------*/

/**
 * @fileoverview
 * This file just load the needed script files. 
 */

nul = new JS.Singleton(/** @lends nul */{ load: {} });

nul.rootPath = '';
nul.loading = function() {
	$('head script').each(function(){
		var spl = this.src.split('null.');
		if(1< spl.length) {
			nul.rootPath = spl[0].split('/');
			nul.rootPath.pop(); nul.rootPath.pop();
			nul.rootPath = nul.rootPath.join('/');
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



/*
 * END OF FILE - /trunk/null.loading.js
 */

/*
 * START OF FILE - /trunk/null.inplace.js
 */
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

/*
 * END OF FILE - /trunk/null.inplace.js
 */

/*
 * START OF FILE - /trunk/krnl/null.helper.js
 */
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
 * Gets weither the index is defined in the class definition
 * @param obj
 * @param ndx
 * @return {Boolean}
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
	//TODO 3: use yield
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

/*
 * END OF FILE - /trunk/krnl/null.helper.js
 */

/*
 * START OF FILE - /trunk/krnl/null.action.js
 */
/*  NUL language JavaScript framework
 *  (c) 2009 E-med Ware
 *
 * NUL is freely distributable under the terms of GNU GPLv3 license.
 *  For details, see the NUL project site : http://code.google.com/p/nul/
 *
 *--------------------------------------------------------------------------*/

nul.action = new JS.Class(/** @lends nul.action# */{
	/**
	 * @param {String} Name
	 * @param {Object} applied
	 * @param {Object[]} args
	 * @constructs
	 * @class A described action made by the JavaScript interpreter
	 */
	initialize: function(name, applied, args) {
		this.name = name;
		this.applied = applied;
		//TODO 1: this call f*cks the perfs
		//this.appliedNode = applied.toNode?applied.toNode():$.text('TODO 1: unnoded');
		this.args = args;
		nul.action.begin(this);
		this.isToLog = nul.action.isToLog(name);
		if(this.isToLog) {
			console.groupCollapsed(name);
			console.log('Applied to', applied);
			console.log('Arguments', args);
		}
	},
	/**
	 * Retrieve the english string describing the better this peculiar action
	 */
	description: function() {
		if(!nul.browser.def(this.applied)) return this.name;
		return this.name + ' ' + this.applied.description;		
	},
	/**
	 * Ends this action by specifying the produced value.
	 * @param {Any} value
	 * @return {Any} value
	 */
	returns: function(value) {
		nul.action.end(this);
		this.success = true;
		this.result = value;
		if(this.isToLog) {
			console.log('Gives', value);
			console.groupEnd();
		}
		return value;
	},
	/**
	 * Ends this action specifying it didn't produce a value but raised an exception.
	 * @param {Any} err
	 * @return {nul.ex} err - as a NUL exception
	 */
	abort: function(err) {
		nul.action.end(this);
		this.success = false;
		this.error = nul.ex.be(err);
		if(this.isToLog) {
			console.warn('Aborted : ', this.error);
			console.groupEnd();
		}
		return this.error;
	},
	extend: /** @lends nul.action */{
		/**
		 * Describe a function
		 * @param {String} name
		 * @return this
		 */
		described: function(name) {
			var ftc = this;
			if(nul.debugged && !nul.debugged.possibleLogging.include(name)) nul.debugged.possibleLogging.push(name);
			return function() {
				var cargs = $.makeArray(arguments);
				var action = new nul.action(name, this, cargs);
				try { return action.returns(ftc.apply(this, cargs)); }
				catch(err) { throw action.abort(err); }			
			};
		},

		/**
		 * The stacked list of begun actions
		 * @type {mul.action[]}
		 */
		present: [],
		/**
		 * Create an action object given the name.
		 * @param {String} action
		 * @return {nul.action}
		 */
		begin: function(action) {
			if(nul.debugged) nul.assert(!action.parent, 'Actions consistency');
			action.parent = this.doing();
			this.present.unshift(action);
		},
		/**
		 * End a given action object
		 * @param {nul.action} action
		 */
		end: function(action) {
			if(nul.debugged) nul.assert(this.present[0]===action, 'Actions consistency');
			this.present.shift();
		},
		/**
		 * Retrieve the last begun action still occuring.
		 * @return {nul.action}
		 */
		doing: function() {
			return this.present[0];
		},
		/**
		 * Retrieve weither this action has to produce Log in the browser console
		 * @param {String} name
		 * @return {Boolean}
		 */
		isToLog: function(name) {
			return nul.debugged && window.console && console.groupCollapsed && nul.debugged.logging && nul.debugged.logging[name];
		}		
	}
});

Function.prototype.describe = nul.action.described;


/*
 * END OF FILE - /trunk/krnl/null.action.js
 */

/*
 * START OF FILE - /trunk/krnl/null.std.js
 */
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

/**
 * Functions that will be called once the scripts are loaded
 * @name nul.load
 * @namespace
 */

/*
 * END OF FILE - /trunk/krnl/null.std.js
 */

/*
 * START OF FILE - /trunk/krnl/null.exception.js
 */
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
	 * @constructs
	 * @class Exception thrown by NUL
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
	 * @extend nul.ex
	 * @constructs
	 * @class Exception thrown by JavaScript interpreter on JavaScript error.
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
	 * @extend nul.ex
	 * @constructs
	 * @class Exception thrown by the NUL interpreter when the semantic of the NUL text is wrong
	 */
	initialize: function(name, msg, xpr) {
		this.callSuper();
		this.xpr = xpr;
	},
	toString: function() { return 'Semantic error'; }
});

nul.ex.syntax = new JS.Class(nul.ex, /** @lends nul.ex.syntax# */{
	/**
	 * @extend nul.ex
	 * @constructs
	 * @class Exception thrown by the NUL interpreter when the syntax of the NUL text is wrong
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
	 * @extend nul.ex
	 * @constructs
	 * @class Exception thrown from we don't know where - should never happend (throw assertion or internal then)
	 */
	initialize: function(obj) {
		this.callSuper('wtf', obj.toString());
		this.object = obj;
	},
	toString: function() { return 'Unknown error'; }
});

nul.ex.internal = new JS.Class(nul.ex, /** @lends nul.ex.internal# */{
	/**
	 * @extend nul.ex
	 * @constructs
	 * @class A bug in the NUL interpreter - ideally never raised
	 */
	initialize: function(msg) {
		this.callSuper('bug', msg);
		if(window.console) console.error(msg);
	},
	toString: function() { return 'Internal error'; }
});

nul.ex.assert = new JS.Class(nul.ex, /** @lends nul.ex.assert# */{
	/**
	 * @extend nul.ex
	 * @constructs
	 * @class A failed assertion - ideally never raised
	 */
	initialize: function(msg) {
		this.callSuper('assertion', msg);
	},
	toString: function() { return 'Assertion failure'; }
});

nul.ex.failure = new JS.Singleton(nul.ex, /** @lends nul.ex.failure# */{
	/**
	 * @extend nul.ex
	 * @constructs
	 * @class A failed evaluation
	 */
	initialize: function(msg) {
		this.callSuper('failure');
	},
	toString: function() { return 'Failure'; }
});


/*
 * END OF FILE - /trunk/krnl/null.exception.js
 */

/*
 * START OF FILE - /trunk/krnl/null.dependance.js
 */
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
	 * @constructs
	 * @class A list of dependancies toward knowledges or external resources
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
/*
 * END OF FILE - /trunk/krnl/null.dependance.js
 */

/*
 * START OF FILE - /trunk/lng/null.execution.js
 */
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
		nul.execution.uberLocal = nul.execution.globalKlg.newLocal('�berLocal');	//TODO 2: use string ndx?
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

/*
 * END OF FILE - /trunk/lng/null.execution.js
 */

/*
 * START OF FILE - /trunk/lng/txt/in/null.tokenizer.js
 */
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
/*
 * END OF FILE - /trunk/lng/txt/in/null.tokenizer.js
 */

/*
 * START OF FILE - /trunk/lng/txt/in/null.compile.js
 */
/*  NUL language JavaScript framework
 *  (c) 2009 E-med Ware
 *
 * NUL is freely distributable under the terms of GNU GPLv3 license.
 *  For details, see the NUL project site : http://code.google.com/p/nul/
 *
 *--------------------------------------------------------------------------*/

//TODO 3: parser les CDATA et <!-- -->

/**
 * Defines a set of compiled items
 * @class
 */
nul.compiled = {
	/**
	 * @name understand
	 * @function
	 * @param {nul.understanding.base} ub
	 * @return {nul.xpr.object}
	 */
		
	/**
	 * @param {String} oprtr
	 * @param {nul.compiled[]} oprnds
	 * @return {nul.compiled}
	 */
	expression: function(oprtr, oprnds) {
		return { operator: oprtr, operands: oprnds, understand: nul.understanding.expression };
	},
	/**
	 * @param {String} oprtr
	 * @param {nul.compiled} oprnd
	 * @return {nul.compiled}
	 */
	preceded: function(oprtr, oprnd) {
		return { operator: oprtr, operand: oprnd, understand: nul.understanding.preceded };
	},
	/**
	 * @param {String} oprtr
	 * @param {nul.compiled} oprnd
	 * @return {nul.compiled}
	 */
	postceded: function(oprtr, oprnd) {
		return { operator: oprtr, operand: oprnd, understand: nul.understanding.postceded };
	},
	/**
	 * @param {nul.compiled} item
	 * @param {nul.compiled} applied
	 * @return {nul.compiled}
	 */
	application: function(item, applied) {
		return { item: item, applied: applied, understand: nul.understanding.application };
	},
	/**
	 * @param {nul.compiled} item
	 * @param {nul.compiled} token
	 * @return {nul.compiled}
	 */
	taking: function(item, token) {
		return { item: item, token: token, understand: nul.understanding.taking };
	},
	/**
	 * @param {String} type
	 * @param {Litteral} value
	 * @return {nul.compiled}
	 */
	atom: function(type, value) {
		return { type: type, value: value, understand: nul.understanding.atom };
	},
	/**
	 * @param {String} decl
	 * @param {nul.compiled} value
	 * @return {nul.compiled}
	 */
	definition: function(decl, value) {
		return { decl: decl, value: value, understand: nul.understanding.definition };
	},
	/**
	 * @param {nul.compiled} content
	 * @param {String} selfRef
	 * @return {nul.compiled}
	 */
	set: function(content, selfRef) {
		return { content: content, selfRef: selfRef, understand: nul.understanding.set };
	},
	/**
	 * @param {String} node
	 * @param {nul.compiled[String]} attrs
	 * @param {nul.compiled[]} content
	 * @return {nul.compiled}
	 */
	xml: function(node, attrs, content) {
		return { node: node, attributes: attrs, content: content, understand: nul.understanding.xml };
	},
	/**
	 * @param {nul.compiled} obj
	 * @param {String} anm
	 * @param {nul.compiled} v
	 * @return {nul.compiled}
	 */
	composed: function(obj, anm, val) {
		return { object: obj, aName: anm, value: val, understand: nul.understanding.composed };
	},
	/**
	 * @param {nul.compiled} appl
	 * @param {String} lcl
	 * @return {nul.compiled}
	 */
	objectivity: function(appl, lcl) {
		return { applied: appl, lcl: lcl, understand: nul.understanding.objectivity };
	},
	/**
	 * @param {nul.xpr.object} val
	 * @return {nul.compiled}
	 */
	hardcode: function(val) {
		return { value: val, understand: nul.understanding.hardcode };
	}
};

/**
 * Recognised operators sorted by precedance
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
				this.expression(0, nul.compiled.postceded(oprtr[0], rv[0]));
			else firstOp = nul.compiled.expression(oprtr[0], rv);
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
			if(this.tknzr.take('.')) rv = nul.compiled.objectivity(rv, this.alphanum()); 
			else if('[]'!= this.tknzr.token.value && this.tknzr.take('['))
				rv = nul.compiled.taking(rv, this.tknzr.rawExpect(']', this.expression())); 				
			else if(tst = this.applied('lax')) rv = nul.compiled.application(rv, tst);
			else if(this.tknzr.take('::')) {
				var anm = this.tknzr.rawTake('(') ?
					this.tknzr.rawExpect(')', this.tknzr.fly(')')) :
					this.alphanum();
				rv = nul.compiled.composed(rv, anm, this.item());					
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
			if(''!== aTxt) comps.push(nul.compiled.atom('string', aTxt.replace(/\uffff/g, '\n')));
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
		if(this.tknzr.rawTake('/>')) return nul.compiled.xml(node, attrs, []);
		this.tknzr.rawExpect('>');
		var comps = this.innerXML();
		this.tknzr.expect(node);
		return this.tknzr.rawExpect('>', nul.compiled.xml(node, attrs, comps));
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
			if(this.tknzr.rawTake('<{')) return nul.compiled.hardcode(eval(this.tknzr.rawExpect('}>', this.tknzr.fly('}>'))));
			
			//declaration
			if(this.tknzr.take('\\/')) return nul.compiled.definition(this.alphanum(), this.expression());
			//Singletons
			if(this.tknzr.take('{')) {
				if(this.tknzr.take('}')) return nul.compiled.set();
				var sr;
				if(this.tknzr.take(':')) sr = this.alphanum();
				return this.tknzr.expect('}', nul.compiled.set(this.expression(), sr));
			}
			//Global' attribute
			if(this.tknzr.take('.')) return nul.compiled.objectivity(nul.compiled.atom('alphanum', ''), this.alphanum());
			//Parenthesis
			if(this.tknzr.take('(')) return this.tknzr.expect(')', this.expression());
			if(!lax) {
				if(this.tknzr.take('<')) return this.xml();
				for(var p= 0; p<nul.operators.length; ++p) {
					var oprtr = nul.operators[p];
					if('p'== oprtr[1] && this.tknzr.take(oprtr[0]))
						return nul.compiled.preceded(oprtr[0], this.expression(1+p));
				}
			}
			rv = this.tknzr.pop(['alphanum', 'number', 'string']);
		}
		if(!rv && !lax) nul.ex.syntax('ITE', 'Item expected', this.tknzr);
		if(rv) return nul.compiled.atom(rv.type, rv.value);
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

/*
 * END OF FILE - /trunk/lng/txt/in/null.compile.js
 */

/*
 * START OF FILE - /trunk/lng/txt/in/null.understand.js
 */
/*  NUL language JavaScript framework
 *  (c) 2009 E-med Ware
 *
 * NUL is freely distributable under the terms of GNU GPLv3 license.
 *  For details, see the NUL project site : http://code.google.com/p/nul/
 *
 *--------------------------------------------------------------------------*/

/**@namespace*/
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
	},
	/**
	 * Generic expression (operator and operands) understanding
	 * @example a <b>+</b> b <b>+</b> c
	 * @param {nul.understanding.base} ub
	 * @return {nul.xpr.object}
	 */
	expression: function(ub) {
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
			nul.ex.internal('Unknown operator: "'+operator+'"');
		}
	}.describe('Understand'),
	/**
	 * Precedor understanding : a precedor and an operand
	 * @example <b>++</b>operand
	 * @param {nul.understanding.base} ub
	 * @return {nul.xpr.object}
	 */
	preceded: function(ub) {
		return ub.klg.attribute(this.operand.understand(ub), this.operator+' ');
	}.describe('Understand'),
	/**
	 * Postcedor understanding : a postcedor and an operand
	 * @example operand<b>++</b>
	 * @param {nul.understanding.base} ub
	 * @return {nul.xpr.object}
	 */
	postceded: function(ub) {
		switch(this.operator) {
		case ',.': return nul.obj.pair.list(null, [this.operand.understand(ub)]);
		default: return ub.klg.attribute(this.operand.understand(ub), ' '+this.operator);
		}
	}.describe('Understand'),
	/**
	 * Atom understanding : a type and a value
	 * @example <b>"</b>quoted text<b>"</b>
	 * @example 42
	 * @example identifier
	 * @param {nul.understanding.base} ub
	 * @return {nul.xpr.object}
	 */
	atom: function(ub) {
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
	}.describe('Understand'),
	/**
	 * Application understanding : two symbols separated by a space
	 * @example item applied
	 * @param {nul.understanding.base} ub
	 * @return {nul.xpr.object}
	 */
	application: function(ub) {
		return ub.klg.hesitate(this.item.understand(ub).having(this.applied.understand(ub)));
	}.describe('Understand'),
	/**
	 * 'Taking' understanding
	 * @example item<b>[</b>token<b>]</b>
	 * @param {nul.understanding.base} ub
	 * @return {nul.xpr.object}
	 */
	taking: function(ub) {
		return nul.xpr.application(this.item.understand(ub), this.token.understand(ub), ub.klg);
	}.describe('Understand'),
	/**
	 * 'Set' understanding
	 * @example <b>{</b>content<b>}</b>
	 * @param {nul.understanding.base} ub
	 * @return {nul.obj.pair|nul.obj.empty}
	 */
	set: function(ub) {
 		if(!this.content) return nul.obj.empty;
		return new nul.understanding.base.set(ub, this.selfRef).understand(this.content);
	}.describe('Understand'),

	/**
	 * Local-definition value understanding
	 * @example <b>\/</b>decl value
	 * @param {nul.understanding.base} ub
	 * @return {nul.xpr.object}
	 */
	definition: function(ub) {
		if('_'== this.decl) nul.ex.semantic('JKD', 'Cannot declare joker !');
		ub.createFreedom(this.decl);
		return this.value.understand(ub);
	}.describe('Understand'),

	/**
	 * XML-node understanding
	 * @example <b>&lt;</b>node <b>/&gt</b>;
	 * @param {nul.understanding.base} ub
	 * @return {nul.obj.node}
	 */
	xml: function(ub) {
		return new nul.obj.node(this.node,												//tag
			map(this.attributes, function() { return this.understand(ub); }),			//attributes
			nul.obj.pair.list(null, nul.understanding.possibles(this.content, ub))		//content
		);
	}.describe('Understand'),

	/**
	 * Composition understanding
	 * @example object <b>::</b>aName value
	 * @param {nul.understanding.base} ub
	 * @return {nul.xpr.object}
	 */
	composed: function(ub) {
		return ub.klg.attributed(this.object.understand(ub), this.aName, this.value.understand(ub));
	}.describe('Understand'),
	/**
	 * Objective value understanding
	 * @example applied<b>.</b>lcl
	 * @param {nul.understanding.base} ub
	 * @return {nul.xpr.object}
	 */
	objectivity: function(ub) {
		return ub.klg.attribute(this.applied.understand(ub), this.lcl);
	}.describe('Understand'),
	/**
	 * Hardcoded JS value
	 * @example <b><{</b> value = nul.obj.litteral.make(34) <b>}></b>
	 * @param {nul.understanding.base} ub
	 * @return {nul.xpr.object}
	 */
	hardcode: function(ub) {
		return this.value;
	}.describe('Understand')
};

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

/*
 * END OF FILE - /trunk/lng/txt/in/null.understand.js
 */

/*
 * START OF FILE - /trunk/lng/txt/out/null.txt.js
 */
/*  NUL language JavaScript framework
 *  (c) 2009 E-med Ware
 *
 * NUL is freely distributable under the terms of GNU GPLv3 license.
 *  For details, see the NUL project site : http://code.google.com/p/nul/
 *
 *--------------------------------------------------------------------------*/
 
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

/*
 * END OF FILE - /trunk/lng/txt/out/null.txt.js
 */

/*
 * START OF FILE - /trunk/lng/txt/out/null.txt.flat.js
 */
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
					'&#x2124;':	//ℤ
					'&#x2115;';	//ℕ			
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

/*
 * END OF FILE - /trunk/lng/txt/out/null.txt.flat.js
 */

/*
 * START OF FILE - /trunk/lng/txt/out/null.txt.html.js
 */
/*  NUL language JavaScript framework
 *  (c) 2009 E-med Ware
 *
 * NUL is freely distributable under the terms of GNU GPLv3 license.
 *  For details, see the NUL project site : http://code.google.com/p/nul/
 *
 *--------------------------------------------------------------------------*/

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
				'&#x2124;':	//ℤ
				'&#x2115;';	//ℕ
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

/*
 * END OF FILE - /trunk/lng/txt/out/null.txt.html.js
 */

/*
 * START OF FILE - /trunk/lng/txt/out/null.txt.node.js
 */
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
				$('<span>&#x2124;</span>'):	//ℤ
				$('<span>&#x2115;</span>');	//ℕ
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

/*
 * END OF FILE - /trunk/lng/txt/out/null.txt.node.js
 */

/*
 * START OF FILE - /trunk/lng/xpr/null.expression.js
 */
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
		this.origin.from = frm;
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


/*
 * END OF FILE - /trunk/lng/xpr/null.expression.js
 */

/*
 * START OF FILE - /trunk/lng/xpr/null.origin.js
 */
/*  NUL language JavaScript framework
 *  (c) 2009 E-med Ware
 *
 * NUL is freely distributable under the terms of GNU GPLv3 license.
 *  For details, see the NUL project site : http://code.google.com/p/nul/
 *
 *--------------------------------------------------------------------------*/

nul.origin = new JS.Class({
	initialize: function(frm) {
		this.action = nul.action.doing();
		this.from = frm;
	},
	toShort: function() {
		if(!this.action) return 'Bereshit ...';
		if(!this.from) return 'Created while ' + this.action.description() + '.';
		return 'Transformation while ' + this.action.description() + ' of ' + this.from.toFlat();
	}
});
/*
 * END OF FILE - /trunk/lng/xpr/null.origin.js
 */

/*
 * START OF FILE - /trunk/lng/algo/null.browse.js
 */
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

/*
 * END OF FILE - /trunk/lng/algo/null.browse.js
 */

/*
 * START OF FILE - /trunk/lng/algo/null.solve.js
 */
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
/*
 * END OF FILE - /trunk/lng/algo/null.solve.js
 */

/*
 * START OF FILE - /trunk/lng/xpr/klg/null.xpr.knowledge.js
 */
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
	useLocalNames: function() {},
	emptyLocals: function() { return 0; },
	concatLocals: function(klg) { this.locals += klg.locals; },
	freeLastLocal: function() { --this.locals; },
	nbrLocals: function() { return this.locals; },
 	newLocal: function(name, ndx) {
 		if('undefined'== typeof ndx) ndx = this.locals++;
 		return new nul.obj.local(this.name, ndx);
 	}
});

nul.xpr.knowledge.include(nul.localsMdl);

/*
 * END OF FILE - /trunk/lng/xpr/klg/null.xpr.knowledge.js
 */

/*
 * START OF FILE - /trunk/lng/xpr/klg/null.klg.algo.js
 */
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

/*
 * END OF FILE - /trunk/lng/xpr/klg/null.klg.algo.js
 */

/*
 * START OF FILE - /trunk/lng/xpr/klg/null.klg.js
 */
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

/*
 * END OF FILE - /trunk/lng/xpr/klg/null.klg.js
 */

/*
 * START OF FILE - /trunk/lng/xpr/klg/null.klg.browse.js
 */
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

/*
 * END OF FILE - /trunk/lng/xpr/klg/null.klg.browse.js
 */

/*
 * START OF FILE - /trunk/lng/xpr/klg/null.klg.eqClass.js
 */
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

/*
 * END OF FILE - /trunk/lng/xpr/klg/null.klg.eqClass.js
 */

/*
 * START OF FILE - /trunk/lng/xpr/klg/null.klg.ior3.js
 */
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
/*
 * END OF FILE - /trunk/lng/xpr/klg/null.klg.ior3.js
 */

/*
 * START OF FILE - /trunk/lng/xpr/klg/null.xpr.possible.js
 */
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

/*
 * END OF FILE - /trunk/lng/xpr/klg/null.xpr.possible.js
 */

/*
 * START OF FILE - /trunk/lng/xpr/obj/null.xpr.object.js
 */
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

/*
 * END OF FILE - /trunk/lng/xpr/obj/null.xpr.object.js
 */

/*
 * START OF FILE - /trunk/lng/xpr/obj/defined/null.obj.defined.js
 */
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

/*
 * END OF FILE - /trunk/lng/xpr/obj/defined/null.obj.defined.js
 */

/*
 * START OF FILE - /trunk/lng/xpr/obj/defined/null.obj.hc.js
 */
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

/*
 * END OF FILE - /trunk/lng/xpr/obj/defined/null.obj.hc.js
 */

/*
 * START OF FILE - /trunk/lng/xpr/obj/defined/null.obj.lambda.js
 */
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

/*
 * END OF FILE - /trunk/lng/xpr/obj/defined/null.obj.lambda.js
 */

/*
 * START OF FILE - /trunk/lng/xpr/obj/defined/null.obj.list.js
 */
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
/*
 * END OF FILE - /trunk/lng/xpr/obj/defined/null.obj.list.js
 */

/*
 * START OF FILE - /trunk/lng/xpr/obj/defined/null.obj.litteral.js
 */
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

/*
 * END OF FILE - /trunk/lng/xpr/obj/defined/null.obj.litteral.js
 */

/*
 * START OF FILE - /trunk/lng/xpr/obj/defined/null.obj.node.js
 */
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
/*
 * END OF FILE - /trunk/lng/xpr/obj/defined/null.obj.node.js
 */

/*
 * START OF FILE - /trunk/lng/xpr/obj/defined/null.obj.pair.js
 */
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
/*
 * END OF FILE - /trunk/lng/xpr/obj/defined/null.obj.pair.js
 */

/*
 * START OF FILE - /trunk/lng/xpr/obj/defined/null.obj.sets.js
 */
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

/*
 * END OF FILE - /trunk/lng/xpr/obj/defined/null.obj.sets.js
 */

/*
 * START OF FILE - /trunk/lng/xpr/obj/undefnd/null.obj.undefnd.js
 */
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
/*
 * END OF FILE - /trunk/lng/xpr/obj/undefnd/null.obj.undefnd.js
 */

/*
 * START OF FILE - /trunk/lng/xpr/obj/undefnd/null.obj.data.js
 */
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

/*
 * END OF FILE - /trunk/lng/xpr/obj/undefnd/null.obj.data.js
 */

/*
 * START OF FILE - /trunk/lng/xpr/obj/undefnd/null.obj.local.js
 */
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

/*
 * END OF FILE - /trunk/lng/xpr/obj/undefnd/null.obj.local.js
 */

/*
 * START OF FILE - /trunk/lng/xpr/obj/undefnd/null.obj.operation.js
 */
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
/*
 * END OF FILE - /trunk/lng/xpr/obj/undefnd/null.obj.operation.js
 */

/*
 * START OF FILE - /trunk/data/null.data.js
 */
/*  NUL language JavaScript framework
 *  (c) 2009 E-med Ware
 *
 * NUL is freely distributable under the terms of GNU GPLv3 license.
 *  For details, see the NUL project site : http://code.google.com/p/nul/
 *
 *--------------------------------------------------------------------------*/

nul.data = new JS.Class(/** @lends nul.data# */{
	/**
	 * @constructs
	 * @class The data-source providing basic data interaction.
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
			 * @constructs
			 * @class The browser to replace atomic query-dependant values by their queried value
			 * @extends nul.browser.bijectif
			 * @param {nul.data.context} context
			 * @param {Object} prm Parameter given to the queried function
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
	 * @constructs
	 * @class The data-source provider
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
/*
 * END OF FILE - /trunk/data/null.data.js
 */

/*
 * START OF FILE - /trunk/data/null.data.ajax.js
 */
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
			error: function(rq, x) {
				switch(x.code) {
					case 1012: alert('AJAX', 'Ajax failure : Not respecting the <a href="http://en.wikipedia.org/wiki/Same_origin_policy">Same Origin Policy</a>');
					default: alert('AJAX', 'Ajax failure : '+x);
				}
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
/*
 * END OF FILE - /trunk/data/null.data.ajax.js
 */

/*
 * START OF FILE - /trunk/data/null.data.time.js
 */
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
	 * @constructs
	 * @class The DateTime object as a node with attributes
	 * @param {Date} dto
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

/*
 * END OF FILE - /trunk/data/null.data.time.js
 */

/*
 * START OF FILE - /trunk/data/null.data.dom.js
 */
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
	 * @constructs
	 * @class Data access to an XML document
	 * @extends nul.data
	 * @param {URL | XMLdocument} doc
	 */
	initialize: function(doc) {
		this.document = doc;
		this.extract = new nul.data.dom.element($(doc.documentElement));
		this.callSuper(nul.data.dom, doc.documentURI);
	}
});

nul.data.dom.element = new JS.Class(nul.obj.hc, /** @lends nul.data.dom.element */{
	/**
	 * @constructs
	 * @class Data access to an XML element
	 * @extends nul.obj.hc
	 * @param {HTMLElement} element
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
/*
 * END OF FILE - /trunk/data/null.data.dom.js
 */

/*
 * START OF FILE - /trunk/web/null.page.js
 */
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

/*
 * END OF FILE - /trunk/web/null.page.js
 */

/*
 * START OF FILE - /trunk/web/console/null.console.js
 */
/*  NUL language JavaScript framework
 *  (c) 2009 E-med Ware
 *
 * NUL is freely distributable under the terms of GNU GPLv3 license.
 *  For details, see the NUL project site : http://code.google.com/p/nul/
 *
 *--------------------------------------------------------------------------*/

if('undefined'== typeof nul.console) {
//TODO 5: test for presence of nulConsole.html
	nul.load.console = function() {
		nul.console.frame = $('<iframe id="_nul_console" src="javascript:false;" frameborder="0" scrolling="auto"></iframe>');
		
		var bdy = $('body');
		bdy.wrapInner('<div id="_nul_content" class="ui-layout-center" ></div>');
		bdy.append(nul.console.frame);
		nul.console.layout = bdy.layout({
			south : {
				paneSelector: '#_nul_console',
				maskIframesOnResize: '#_nul_console',
				resizable: true,
				slidable: false,
				closable: false,
				
				//togglerLength_open: 0,
				//togglerLength_closed: 0,		
				togglerContent_closed: 'BLAH',
				
				togglerTip_closed: 'NUL console',
				
				size: 300,
				initClosed: false,
				minSize: 150,
				resizeWhileDragging: true,
				fxName: "none",
				onopen_end: nul.console.loadFrame
			}
		});
	};
	nul.load.console.use = {'operators': true, 'executionReady': true, 'HTML': true};
	
	nul.console = {
		loadFrame: function(pane, $Pane) {
			if(!nul.console.frame.loaded) {
				nul.console.frame.attr('src', nul.rootPath + '/web/console/nulConsole.html'); 	//TODO 2: rel src
				nul.console.frame.ready(nul.console.frameLoaded);
				nul.console.frame.loaded = true;
			}
		},
		frameLoaded: function() {
			var cw = nul.console.frame[0].contentWindow;
			var cde = nul.console.frame[0].contentDocument.documentElement;
			cw.nul = nul;
			nul.ex.js.hook(cw);
			nul.status = nul.console.child.status;
		},
		close: function() {
			nul.console.layout.hide('south');
			//nul.status = my status line
		},
		open: function() {
			nul.console.layout.show('south');
			nul.status = nul.console.child.status;
		},
		extern: function(nwnd) {
			nwnd.nul = nul;
			nul.ex.hook(nwnd);
			nul.console.layout.hide('south');
		}
	};

}
/*
 * END OF FILE - /trunk/web/console/null.console.js
 */

/*
 * JavaScript file created by Rockstarapps Concatenation
*/
