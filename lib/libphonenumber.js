// Copyright 2006 The Closure Library Authors. All Rights Reserved.
//
// Licensed under the Apache License, Version 2.0 (the "License");
// you may not use this file except in compliance with the License.
// You may obtain a copy of the License at
//
//      http://www.apache.org/licenses/LICENSE-2.0
//
// Unless required by applicable law or agreed to in writing, software
// distributed under the License is distributed on an "AS-IS" BASIS,
// WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
// See the License for the specific language governing permissions and
// limitations under the License.

/**
 * @fileoverview Bootstrap for the Google JS Library (Closure).
 *
 * In uncompiled mode base.js will write out Closure's deps file, unless the
 * global <code>CLOSURE_NO_DEPS</code> is set to true.  This allows projects to
 * include their own deps file(s) from different locations.
 *
 * @author arv@google.com (Erik Arvidsson)
 *
 * @provideGoog
 */
'use strict';

/**
 * @define {boolean} Overridden to true by the compiler when
 *     --process_closure_primitives is specified.
 */
var COMPILED = false;


/**
 * Base namespace for the Closure library.  Checks to see goog is already
 * defined in the current scope before assigning to prevent clobbering if
 * base.js is loaded more than once.
 *
 * @const
 */
var goog = goog || {};


/**
 * Reference to the global context.  In most cases this will be 'window'.
 */
goog.global = {};

/**
 * A hook for overriding the define values in uncompiled mode.
 *
 * In uncompiled mode, {@code CLOSURE_UNCOMPILED_DEFINES} may be defined before
 * loading base.js.  If a key is defined in {@code CLOSURE_UNCOMPILED_DEFINES},
 * {@code goog.define} will use the value instead of the default value.  This
 * allows flags to be overwritten without compilation (this is normally
 * accomplished with the compiler's "define" flag).
 *
 * Example:
 * <pre>
 *   var CLOSURE_UNCOMPILED_DEFINES = {'goog.DEBUG': false};
 * </pre>
 *
 * @type {Object<string, (string|number|boolean)>|undefined}
 */
goog.global.CLOSURE_UNCOMPILED_DEFINES;


/**
 * A hook for overriding the define values in uncompiled or compiled mode,
 * like CLOSURE_UNCOMPILED_DEFINES but effective in compiled code.  In
 * uncompiled code CLOSURE_UNCOMPILED_DEFINES takes precedence.
 *
 * Also unlike CLOSURE_UNCOMPILED_DEFINES the values must be number, boolean or
 * string literals or the compiler will emit an error.
 *
 * While any @define value may be set, only those set with goog.define will be
 * effective for uncompiled code.
 *
 * Example:
 * <pre>
 *   var CLOSURE_DEFINES = {'goog.DEBUG': false} ;
 * </pre>
 *
 * @type {Object<string, (string|number|boolean)>|undefined}
 */
goog.global.CLOSURE_DEFINES;


/**
 * Returns true if the specified value is not undefined.
 * WARNING: Do not use this to test if an object has a property. Use the in
 * operator instead.
 *
 * @param {?} val Variable to test.
 * @return {boolean} Whether variable is defined.
 */
goog.isDef = function(val) {
  // void 0 always evaluates to undefined and hence we do not need to depend on
  // the definition of the global variable named 'undefined'.
  return val !== void 0;
};


/**
 * Builds an object structure for the provided namespace path, ensuring that
 * names that already exist are not overwritten. For example:
 * "a.b.c" -> a = {};a.b={};a.b.c={};
 * Used by goog.provide and goog.exportSymbol.
 * @param {string} name name of the object that this file defines.
 * @param {*=} opt_object the object to expose at the end of the path.
 * @param {Object=} opt_objectToExportTo The object to add the path to; default
 *     is |goog.global|.
 * @private
 */
goog.exportPath_ = function(name, opt_object, opt_objectToExportTo) {
  var parts = name.split('.');
  var cur = opt_objectToExportTo || goog.global;

  // Internet Explorer exhibits strange behavior when throwing errors from
  // methods externed in this manner.  See the testExportSymbolExceptions in
  // base_test.html for an example.
  if (!(parts[0] in cur) && cur.execScript) {
    cur.execScript('var ' + parts[0]);
  }

  // Certain browsers cannot parse code in the form for((a in b); c;);
  // This pattern is produced by the JSCompiler when it collapses the
  // statement above into the conditional loop below. To prevent this from
  // happening, use a for-loop and reserve the init logic as below.

  // Parentheses added to eliminate strict JS warning in Firefox.
  for (var part; parts.length && (part = parts.shift());) {
    if (!parts.length && goog.isDef(opt_object)) {
      // last part and we have an object; use it
      cur[part] = opt_object;
    } else if (cur[part]) {
      cur = cur[part];
    } else {
      cur = cur[part] = {};
    }
  }
};


/**
 * Defines a named value. In uncompiled mode, the value is retrieved from
 * CLOSURE_DEFINES or CLOSURE_UNCOMPILED_DEFINES if the object is defined and
 * has the property specified, and otherwise used the defined defaultValue.
 * When compiled the default can be overridden using the compiler
 * options or the value set in the CLOSURE_DEFINES object.
 *
 * @param {string} name The distinguished name to provide.
 * @param {string|number|boolean} defaultValue
 */
goog.define = function(name, defaultValue) {
  var value = defaultValue;
  if (!COMPILED) {
    if (goog.global.CLOSURE_UNCOMPILED_DEFINES &&
        Object.prototype.hasOwnProperty.call(
            goog.global.CLOSURE_UNCOMPILED_DEFINES, name)) {
      value = goog.global.CLOSURE_UNCOMPILED_DEFINES[name];
    } else if (goog.global.CLOSURE_DEFINES &&
        Object.prototype.hasOwnProperty.call(
            goog.global.CLOSURE_DEFINES, name)) {
      value = goog.global.CLOSURE_DEFINES[name];
    }
  }
  goog.exportPath_(name, value);
};


/**
 * @define {boolean} DEBUG is provided as a convenience so that debugging code
 * that should not be included in a production js_binary can be easily stripped
 * by specifying --define goog.DEBUG=false to the JSCompiler. For example, most
 * toString() methods should be declared inside an "if (goog.DEBUG)" conditional
 * because they are generally used for debugging purposes and it is difficult
 * for the JSCompiler to statically determine whether they are used.
 */
goog.define('goog.DEBUG', false);


/**
 * @define {string} LOCALE defines the locale being used for compilation. It is
 * used to select locale specific data to be compiled in js binary. BUILD rule
 * can specify this value by "--define goog.LOCALE=<locale_name>" as JSCompiler
 * option.
 *
 * Take into account that the locale code format is important. You should use
 * the canonical Unicode format with hyphen as a delimiter. Language must be
 * lowercase, Language Script - Capitalized, Region - UPPERCASE.
 * There are few examples: pt-BR, en, en-US, sr-Latin-BO, zh-Hans-CN.
 *
 * See more info about locale codes here:
 * http://www.unicode.org/reports/tr35/#Unicode_Language_and_Locale_Identifiers
 *
 * For language codes you should use values defined by ISO 693-1. See it here
 * http://www.w3.org/WAI/ER/IG/ert/iso639.htm. There is only one exception from
 * this rule: the Hebrew language. For legacy reasons the old code (iw) should
 * be used instead of the new code (he), see http://wiki/Main/IIISynonyms.
 */
goog.define('goog.LOCALE', 'en');  // default to en


/**
 * @define {boolean} Whether this code is running on trusted sites.
 *
 * On untrusted sites, several native functions can be defined or overridden by
 * external libraries like Prototype, Datejs, and JQuery and setting this flag
 * to false forces closure to use its own implementations when possible.
 *
 * If your JavaScript can be loaded by a third party site and you are wary about
 * relying on non-standard implementations, specify
 * "--define goog.TRUSTED_SITE=false" to the JSCompiler.
 */
goog.define('goog.TRUSTED_SITE', true);


/**
 * @define {boolean} Whether a project is expected to be running in strict mode.
 *
 * This define can be used to trigger alternate implementations compatible with
 * running in EcmaScript Strict mode or warn about unavailable functionality.
 * @see https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Functions_and_function_scope/Strict_mode
 *
 */
goog.define('goog.STRICT_MODE_COMPATIBLE', false);


/**
 * @define {boolean} Whether code that calls {@link goog.setTestOnly} should
 *     be disallowed in the compilation unit.
 */
goog.define('goog.DISALLOW_TEST_ONLY_CODE', COMPILED && !goog.DEBUG);


/**
 * @define {boolean} Whether to use a Chrome app CSP-compliant method for
 *     loading scripts via goog.require. @see appendScriptSrcNode_.
 */
goog.define('goog.ENABLE_CHROME_APP_SAFE_SCRIPT_LOADING', false);


/**
 * Defines a namespace in Closure.
 *
 * A namespace may only be defined once in a codebase. It may be defined using
 * goog.provide() or goog.module().
 *
 * The presence of one or more goog.provide() calls in a file indicates
 * that the file defines the given objects/namespaces.
 * Provided symbols must not be null or undefined.
 *
 * In addition, goog.provide() creates the object stubs for a namespace
 * (for example, goog.provide("goog.foo.bar") will create the object
 * goog.foo.bar if it does not already exist).
 *
 * Build tools also scan for provide/require/module statements
 * to discern dependencies, build dependency files (see deps.js), etc.
 *
 * @see goog.require
 * @see goog.module
 * @param {string} name Namespace provided by this file in the form
 *     "goog.package.part".
 */
goog.provide = function(name) {
  name = name.split('.');

  if (!COMPILED) {
    // Ensure that the same namespace isn't provided twice.
    // A goog.module/goog.provide maps a goog.require to a specific file
    if (goog.isProvided_(name)) {
      throw Error('Namespace "' + name + '" already declared.');
    }
  }

  goog.constructNamespace_(name);
};


/**
 * @param {string} name Namespace provided by this file in the form
 *     "goog.package.part".
 * @param {Object=} opt_obj The object to embed in the namespace.
 * @private
 */
goog.constructNamespace_ = function(name, opt_obj) {
  if (!COMPILED) {
    delete goog.implicitNamespaces_[name];

    var namespace = name;
    while ((namespace = namespace.substring(0, namespace.lastIndexOf('.')))) {
      if (goog.getObjectByName(namespace)) {
        break;
      }
      goog.implicitNamespaces_[namespace] = true;
    }
  }

  goog.exportPath_(name, opt_obj);
};


/**
 * Module identifier validation regexp.
 * Note: This is a conservative check, it is very possible to be more lenient,
 *   the primary exclusion here is "/" and "\" and a leading ".", these
 *   restrictions are intended to leave the door open for using goog.require
 *   with relative file paths rather than module identifiers.
 * @private
 */
goog.VALID_MODULE_RE_ = /^[a-zA-Z_$][a-zA-Z0-9._$]*$/;


/**
 * Defines a module in Closure.
 *
 * Marks that this file must be loaded as a module and claims the namespace.
 *
 * A namespace may only be defined once in a codebase. It may be defined using
 * goog.provide() or goog.module().
 *
 * goog.module() has three requirements:
 * - goog.module may not be used in the same file as goog.provide.
 * - goog.module must be the first statement in the file.
 * - only one goog.module is allowed per file.
 *
 * When a goog.module annotated file is loaded, it is enclosed in
 * a strict function closure. This means that:
 * - any variables declared in a goog.module file are private to the file
 * (not global), though the compiler is expected to inline the module.
 * - The code must obey all the rules of "strict" JavaScript.
 * - the file will be marked as "use strict"
 *
 * NOTE: unlike goog.provide, goog.module does not declare any symbols by
 * itself. If declared symbols are desired, use
 * goog.module.declareLegacyNamespace().
 *
 *
 * See the public goog.module proposal: http://goo.gl/Va1hin
 *
 * @param {string} name Namespace provided by this file in the form
 *     "goog.package.part", is expected but not required.
 */
goog.module = function(name) {
  if (!goog.isString(name) ||
      !name ||
      name.search(goog.VALID_MODULE_RE_) == -1) {
    throw Error('Invalid module identifier');
  }
  if (!goog.isInModuleLoader_()) {
    throw Error('Module ' + name + ' has been loaded incorrectly.');
  }
  if (goog.moduleLoaderState_.moduleName) {
    throw Error('goog.module may only be called once per module.');
  }

  // Store the module name for the loader.
  goog.moduleLoaderState_.moduleName = name;
  if (!COMPILED) {
    // Ensure that the same namespace isn't provided twice.
    // A goog.module/goog.provide maps a goog.require to a specific file
    if (goog.isProvided_(name)) {
      throw Error('Namespace "' + name + '" already declared.');
    }
    delete goog.implicitNamespaces_[name];
  }
};


/**
 * @param {string} name The module identifier.
 * @return {?} The module exports for an already loaded module or null.
 *
 * Note: This is not an alternative to goog.require, it does not
 * indicate a hard dependency, instead it is used to indicate
 * an optional dependency or to access the exports of a module
 * that has already been loaded.
 * @suppress {missingProvide}
 */
goog.module.get = function(name) {
  return goog.module.getInternal_(name);
};


/**
 * @param {string} name The module identifier.
 * @return {?} The module exports for an already loaded module or null.
 * @private
 */
goog.module.getInternal_ = function(name) {
  if (!COMPILED) {
    if (goog.isProvided_(name)) {
      // goog.require only return a value with-in goog.module files.
      return name in goog.loadedModules_ ?
          goog.loadedModules_[name] :
          goog.getObjectByName(name);
    } else {
      return null;
    }
  }
};


/**
 * @private {?{moduleName: (string|undefined)}}
 */
goog.moduleLoaderState_ = null;


/**
 * @private
 * @return {boolean} Whether a goog.module is currently being initialized.
 */
goog.isInModuleLoader_ = function() {
  return goog.moduleLoaderState_ != null;
};


/**
 * Provide the module's exports as a globally accessible object under the
 * module's declared name.  This is intended to ease migration to goog.module
 * for files that have existing usages.
 * @suppress {missingProvide}
 */
goog.module.declareLegacyNamespace = function() {
  if (!COMPILED && !goog.isInModuleLoader_()) {
    throw new Error('goog.module.declareLegacyNamespace must be called from ' +
        'within a goog.module');
  }
  if (!COMPILED && !goog.moduleLoaderState_.moduleName) {
    throw Error('goog.module must be called prior to ' +
        'goog.module.declareLegacyNamespace.');
  }
  goog.moduleLoaderState_.declareLegacyNamespace = true;
};


/**
 * Marks that the current file should only be used for testing, and never for
 * live code in production.
 *
 * In the case of unit tests, the message may optionally be an exact namespace
 * for the test (e.g. 'goog.stringTest'). The linter will then ignore the extra
 * provide (if not explicitly defined in the code).
 *
 * @param {string=} opt_message Optional message to add to the error that's
 *     raised when used in production code.
 */
goog.setTestOnly = function(opt_message) {
  if (goog.DISALLOW_TEST_ONLY_CODE) {
    opt_message = opt_message || '';
    throw Error('Importing test-only code into non-debug environment' +
                (opt_message ? ': ' + opt_message : '.'));
  }
};


/**
 * Forward declares a symbol. This is an indication to the compiler that the
 * symbol may be used in the source yet is not required and may not be provided
 * in compilation.
 *
 * The most common usage of forward declaration is code that takes a type as a
 * function parameter but does not need to require it. By forward declaring
 * instead of requiring, no hard dependency is made, and (if not required
 * elsewhere) the namespace may never be required and thus, not be pulled
 * into the JavaScript binary. If it is required elsewhere, it will be type
 * checked as normal.
 *
 *
 * @param {string} name The namespace to forward declare in the form of
 *     "goog.package.part".
 */
goog.forwardDeclare = function(name) {};


/**
 * Forward declare type information. Used to assign types to goog.global
 * referenced object that would otherwise result in unknown type references
 * and thus block property disambiguation.
 */
goog.forwardDeclare('Document');
goog.forwardDeclare('XMLHttpRequest');


if (!COMPILED) {

  /**
   * Check if the given name has been goog.provided. This will return false for
   * names that are available only as implicit namespaces.
   * @param {string} name name of the object to look for.
   * @return {boolean} Whether the name has been provided.
   * @private
   */
  goog.isProvided_ = function(name) {
    return (name in goog.loadedModules_) ||
        (!goog.implicitNamespaces_[name] &&
            goog.isDefAndNotNull(goog.getObjectByName(name)));
  };

  /**
   * Namespaces implicitly defined by goog.provide. For example,
   * goog.provide('goog.events.Event') implicitly declares that 'goog' and
   * 'goog.events' must be namespaces.
   *
   * @type {!Object<string, (boolean|undefined)>}
   * @private
   */
  goog.implicitNamespaces_ = {'goog.module': true};

  // NOTE: We add goog.module as an implicit namespace as goog.module is defined
  // here and because the existing module package has not been moved yet out of
  // the goog.module namespace. This satisifies both the debug loader and
  // ahead-of-time dependency management.
}


/**
 * Returns an object based on its fully qualified external name.  The object
 * is not found if null or undefined.  If you are using a compilation pass that
 * renames property names beware that using this function will not find renamed
 * properties.
 *
 * @param {string} name The fully qualified name.
 * @param {Object=} opt_obj The object within which to look; default is
 *     |goog.global|.
 * @return {?} The value (object or primitive) or, if not found, null.
 */
goog.getObjectByName = function(name, opt_obj) {
  var parts = name.split('.');
  var cur = opt_obj || goog.global;
  for (var part; part = parts.shift(); ) {
    if (goog.isDefAndNotNull(cur[part])) {
      cur = cur[part];
    } else {
      return null;
    }
  }
  return cur;
};


/**
 * Globalizes a whole namespace, such as goog or goog.lang.
 *
 * @param {!Object} obj The namespace to globalize.
 * @param {Object=} opt_global The object to add the properties to.
 * @deprecated Properties may be explicitly exported to the global scope, but
 *     this should no longer be done in bulk.
 */
goog.globalize = function(obj, opt_global) {
  var global = opt_global || goog.global;
  for (var x in obj) {
    global[x] = obj[x];
  }
};


/**
 * Adds a dependency from a file to the files it requires.
 * @param {string} relPath The path to the js file.
 * @param {!Array<string>} provides An array of strings with
 *     the names of the objects this file provides.
 * @param {!Array<string>} requires An array of strings with
 *     the names of the objects this file requires.
 * @param {boolean=} opt_isModule Whether this dependency must be loaded as
 *     a module as declared by goog.module.
 */
goog.addDependency = function(relPath, provides, requires, opt_isModule) {
  if (goog.DEPENDENCIES_ENABLED) {
    var provide, require;
    var path = relPath.replace(/\\/g, '/');
    var deps = goog.dependencies_;
    for (var i = 0; provide = provides[i]; i++) {
      deps.nameToPath[provide] = path;
      deps.pathIsModule[path] = !!opt_isModule;
    }
    for (var j = 0; require = requires[j]; j++) {
      if (!(path in deps.requires)) {
        deps.requires[path] = {};
      }
      deps.requires[path][require] = true;
    }
  }
};




// NOTE(nnaze): The debug DOM loader was included in base.js as an original way
// to do "debug-mode" development.  The dependency system can sometimes be
// confusing, as can the debug DOM loader's asynchronous nature.
//
// With the DOM loader, a call to goog.require() is not blocking -- the script
// will not load until some point after the current script.  If a namespace is
// needed at runtime, it needs to be defined in a previous script, or loaded via
// require() with its registered dependencies.
// User-defined namespaces may need their own deps file.  See http://go/js_deps,
// http://go/genjsdeps, or, externally, DepsWriter.
// https://developers.google.com/closure/library/docs/depswriter
//
// Because of legacy clients, the DOM loader can't be easily removed from
// base.js.  Work is being done to make it disableable or replaceable for
// different environments (DOM-less JavaScript interpreters like Rhino or V8,
// for example). See bootstrap/ for more information.


/**
 * @define {boolean} Whether to enable the debug loader.
 *
 * If enabled, a call to goog.require() will attempt to load the namespace by
 * appending a script tag to the DOM (if the namespace has been registered).
 *
 * If disabled, goog.require() will simply assert that the namespace has been
 * provided (and depend on the fact that some outside tool correctly ordered
 * the script).
 */
goog.define('goog.ENABLE_DEBUG_LOADER', true);


/**
 * @param {string} msg
 * @private
 */
goog.logToConsole_ = function(msg) {
  if (goog.global.console) {
    goog.global.console['error'](msg);
  }
};


/**
 * Implements a system for the dynamic resolution of dependencies that works in
 * parallel with the BUILD system. Note that all calls to goog.require will be
 * stripped by the JSCompiler when the --process_closure_primitives option is
 * used.
 * @see goog.provide
 * @param {string} name Namespace to include (as was given in goog.provide()) in
 *     the form "goog.package.part".
 * @return {?} If called within a goog.module file, the associated namespace or
 *     module otherwise null.
 */
goog.require = function(name) {
  return;
  
  // If the object already exists we do not need do do anything.
  if (!COMPILED) {
    if (goog.ENABLE_DEBUG_LOADER && goog.IS_OLD_IE_) {
      goog.maybeProcessDeferredDep_(name);
    }

    if (goog.isProvided_(name)) {
      if (goog.isInModuleLoader_()) {
        return goog.module.getInternal_(name);
      } else {
        return null;
      }
    }

    if (goog.ENABLE_DEBUG_LOADER) {
      var path = goog.getPathFromDeps_(name);
      if (path) {
        goog.writeScripts_(path);
        return null;
      }
    }

    var errorMessage = 'goog.require could not find: ' + name;
    goog.logToConsole_(errorMessage);

    throw Error(errorMessage);
  }
};


/**
 * Path for included scripts.
 * @type {string}
 */
goog.basePath = '';


/**
 * A hook for overriding the base path.
 * @type {string|undefined}
 */
goog.global.CLOSURE_BASE_PATH;


/**
 * Whether to write out Closure's deps file. By default, the deps are written.
 * @type {boolean|undefined}
 */
goog.global.CLOSURE_NO_DEPS = true;


/**
 * A function to import a single script. This is meant to be overridden when
 * Closure is being run in non-HTML contexts, such as web workers. It's defined
 * in the global scope so that it can be set before base.js is loaded, which
 * allows deps.js to be imported properly.
 *
 * The function is passed the script source, which is a relative URI. It should
 * return true if the script was imported, false otherwise.
 * @type {(function(string): boolean)|undefined}
 */
goog.global.CLOSURE_IMPORT_SCRIPT;


/**
 * Null function used for default values of callbacks, etc.
 * @return {void} Nothing.
 */
goog.nullFunction = function() {};


/**
 * When defining a class Foo with an abstract method bar(), you can do:
 * Foo.prototype.bar = goog.abstractMethod
 *
 * Now if a subclass of Foo fails to override bar(), an error will be thrown
 * when bar() is invoked.
 *
 * Note: This does not take the name of the function to override as an argument
 * because that would make it more difficult to obfuscate our JavaScript code.
 *
 * @type {!Function}
 * @throws {Error} when invoked to indicate the method should be overridden.
 */
goog.abstractMethod = function() {
  throw Error('unimplemented abstract method');
};


/**
 * Adds a {@code getInstance} static method that always returns the same
 * instance object.
 * @param {!Function} ctor The constructor for the class to add the static
 *     method to.
 */
goog.addSingletonGetter = function(ctor) {
  ctor.getInstance = function() {
    if (ctor.instance_) {
      return ctor.instance_;
    }
    if (goog.DEBUG) {
      // NOTE: JSCompiler can't optimize away Array#push.
      goog.instantiatedSingletons_[goog.instantiatedSingletons_.length] = ctor;
    }
    return ctor.instance_ = new ctor;
  };
};


/**
 * All singleton classes that have been instantiated, for testing. Don't read
 * it directly, use the {@code goog.testing.singleton} module. The compiler
 * removes this variable if unused.
 * @type {!Array<!Function>}
 * @private
 */
goog.instantiatedSingletons_ = [];


/**
 * @define {boolean} Whether to load goog.modules using {@code eval} when using
 * the debug loader.  This provides a better debugging experience as the
 * source is unmodified and can be edited using Chrome Workspaces or similar.
 * However in some environments the use of {@code eval} is banned
 * so we provide an alternative.
 */
goog.define('goog.LOAD_MODULE_USING_EVAL', true);


/**
 * @define {boolean} Whether the exports of goog.modules should be sealed when
 * possible.
 */
goog.define('goog.SEAL_MODULE_EXPORTS', goog.DEBUG);


/**
 * The registry of initialized modules:
 * the module identifier to module exports map.
 * @private @const {!Object<string, ?>}
 */
goog.loadedModules_ = {};


/**
 * True if goog.dependencies_ is available.
 * @const {boolean}
 */
goog.DEPENDENCIES_ENABLED = !COMPILED && goog.ENABLE_DEBUG_LOADER;


if (goog.DEPENDENCIES_ENABLED) {

  /**
   * This object is used to keep track of dependencies and other data that is
   * used for loading scripts.
   * @private
   * @type {{
   *   pathIsModule: !Object<string, boolean>,
   *   nameToPath: !Object<string, string>,
   *   requires: !Object<string, !Object<string, boolean>>,
   *   visited: !Object<string, boolean>,
   *   written: !Object<string, boolean>,
   *   deferred: !Object<string, string>
   * }}
   */
  goog.dependencies_ = {
    pathIsModule: {}, // 1 to 1

    nameToPath: {}, // 1 to 1

    requires: {}, // 1 to many

    // Used when resolving dependencies to prevent us from visiting file twice.
    visited: {},

    written: {}, // Used to keep track of script files we have written.

    deferred: {} // Used to track deferred module evaluations in old IEs
  };


  /**
   * Tries to detect whether is in the context of an HTML document.
   * @return {boolean} True if it looks like HTML document.
   * @private
   */
  goog.inHtmlDocument_ = function() {
    /** @type {Document} */
    var doc = goog.global.document;
    return typeof doc != 'undefined' &&
           'write' in doc;  // XULDocument misses write.
  };


  /**
   * Tries to detect the base path of base.js script that bootstraps Closure.
   * @private
   */
  goog.findBasePath_ = function() {
    if (goog.isDef(goog.global.CLOSURE_BASE_PATH)) {
      goog.basePath = goog.global.CLOSURE_BASE_PATH;
      return;
    } else if (!goog.inHtmlDocument_()) {
      return;
    }
    /** @type {Document} */
    var doc = goog.global.document;
    var scripts = doc.getElementsByTagName('SCRIPT');
    // Search backwards since the current script is in almost all cases the one
    // that has base.js.
    for (var i = scripts.length - 1; i >= 0; --i) {
      var script = /** @type {!HTMLScriptElement} */ (scripts[i]);
      var src = script.src;
      var qmark = src.lastIndexOf('?');
      var l = qmark == -1 ? src.length : qmark;
      if (src.substr(l - 7, 7) == 'base.js') {
        goog.basePath = src.substr(0, l - 7);
        return;
      }
    }
  };


  /**
   * Imports a script if, and only if, that script hasn't already been imported.
   * (Must be called at execution time)
   * @param {string} src Script source.
   * @param {string=} opt_sourceText The optionally source text to evaluate
   * @private
   */
  goog.importScript_ = function(src, opt_sourceText) {
    var importScript = goog.global.CLOSURE_IMPORT_SCRIPT ||
        goog.writeScriptTag_;
    if (importScript(src, opt_sourceText)) {
      goog.dependencies_.written[src] = true;
    }
  };


  /** @const @private {boolean} */
  goog.IS_OLD_IE_ = !!(!goog.global.atob && goog.global.document &&
      goog.global.document.all);


  /**
   * Given a URL initiate retrieval and execution of the module.
   * @param {string} src Script source URL.
   * @private
   */
  goog.importModule_ = function(src) {
    // In an attempt to keep browsers from timing out loading scripts using
    // synchronous XHRs, put each load in its own script block.
    var bootstrap = 'goog.retrieveAndExecModule_("' + src + '");';

    if (goog.importScript_('', bootstrap)) {
      goog.dependencies_.written[src] = true;
    }
  };


  /** @private {!Array<string>} */
  goog.queuedModules_ = [];


  /**
   * Return an appropriate module text. Suitable to insert into
   * a script tag (that is unescaped).
   * @param {string} srcUrl
   * @param {string} scriptText
   * @return {string}
   * @private
   */
  goog.wrapModule_ = function(srcUrl, scriptText) {
    if (!goog.LOAD_MODULE_USING_EVAL || !goog.isDef(goog.global.JSON)) {
      return '' +
          'goog.loadModule(function(exports) {' +
          '"use strict";' +
          scriptText +
          '\n' + // terminate any trailing single line comment.
          ';return exports' +
          '});' +
          '\n//# sourceURL=' + srcUrl + '\n';
    } else {
      return '' +
          'goog.loadModule(' +
          goog.global.JSON.stringify(
              scriptText + '\n//# sourceURL=' + srcUrl + '\n') +
          ');';
    }
  };

  // On IE9 and earlier, it is necessary to handle
  // deferred module loads. In later browsers, the
  // code to be evaluated is simply inserted as a script
  // block in the correct order. To eval deferred
  // code at the right time, we piggy back on goog.require to call
  // goog.maybeProcessDeferredDep_.
  //
  // The goog.requires are used both to bootstrap
  // the loading process (when no deps are available) and
  // declare that they should be available.
  //
  // Here we eval the sources, if all the deps are available
  // either already eval'd or goog.require'd.  This will
  // be the case when all the dependencies have already
  // been loaded, and the dependent module is loaded.
  //
  // But this alone isn't sufficient because it is also
  // necessary to handle the case where there is no root
  // that is not deferred.  For that there we register for an event
  // and trigger goog.loadQueuedModules_ handle any remaining deferred
  // evaluations.

  /**
   * Handle any remaining deferred goog.module evals.
   * @private
   */
  goog.loadQueuedModules_ = function() {
    var count = goog.queuedModules_.length;
    if (count > 0) {
      var queue = goog.queuedModules_;
      goog.queuedModules_ = [];
      for (var i = 0; i < count; i++) {
        var path = queue[i];
        goog.maybeProcessDeferredPath_(path);
      }
    }
  };


  /**
   * Eval the named module if its dependencies are
   * available.
   * @param {string} name The module to load.
   * @private
   */
  goog.maybeProcessDeferredDep_ = function(name) {
    if (goog.isDeferredModule_(name) &&
        goog.allDepsAreAvailable_(name)) {
      var path = goog.getPathFromDeps_(name);
      goog.maybeProcessDeferredPath_(goog.basePath + path);
    }
  };

  /**
   * @param {string} name The module to check.
   * @return {boolean} Whether the name represents a
   *     module whose evaluation has been deferred.
   * @private
   */
  goog.isDeferredModule_ = function(name) {
    var path = goog.getPathFromDeps_(name);
    if (path && goog.dependencies_.pathIsModule[path]) {
      var abspath = goog.basePath + path;
      return (abspath) in goog.dependencies_.deferred;
    }
    return false;
  };

  /**
   * @param {string} name The module to check.
   * @return {boolean} Whether the name represents a
   *     module whose declared dependencies have all been loaded
   *     (eval'd or a deferred module load)
   * @private
   */
  goog.allDepsAreAvailable_ = function(name) {
    var path = goog.getPathFromDeps_(name);
    if (path && (path in goog.dependencies_.requires)) {
      for (var requireName in goog.dependencies_.requires[path]) {
        if (!goog.isProvided_(requireName) &&
            !goog.isDeferredModule_(requireName)) {
          return false;
        }
      }
    }
    return true;
  };


  /**
   * @param {string} abspath
   * @private
   */
  goog.maybeProcessDeferredPath_ = function(abspath) {
    if (abspath in goog.dependencies_.deferred) {
      var src = goog.dependencies_.deferred[abspath];
      delete goog.dependencies_.deferred[abspath];
      goog.globalEval(src);
    }
  };


  /**
   * @param {function(?):?|string} moduleDef The module definition.
   */
  goog.loadModule = function(moduleDef) {
    // NOTE: we allow function definitions to be either in the from
    // of a string to eval (which keeps the original source intact) or
    // in a eval forbidden environment (CSP) we allow a function definition
    // which in its body must call {@code goog.module}, and return the exports
    // of the module.
    var previousState = goog.moduleLoaderState_;
    try {
      goog.moduleLoaderState_ = {moduleName: undefined};
      var exports;
      if (goog.isFunction(moduleDef)) {
        exports = moduleDef.call(goog.global, {});
      } else if (goog.isString(moduleDef)) {
        exports = goog.loadModuleFromSource_.call(goog.global, moduleDef);
      } else {
        throw Error('Invalid module definition');
      }

      var moduleName = goog.moduleLoaderState_.moduleName;
      if (!goog.isString(moduleName) || !moduleName) {
        throw Error('Invalid module name \"' + moduleName + '\"');
      }

      // Don't seal legacy namespaces as they may be uses as a parent of
      // another namespace
      if (goog.moduleLoaderState_.declareLegacyNamespace) {
        goog.constructNamespace_(moduleName, exports);
      } else if (goog.SEAL_MODULE_EXPORTS && Object.seal) {
        Object.seal(exports);
      }

      goog.loadedModules_[moduleName] = exports;
    } finally {
      goog.moduleLoaderState_ = previousState;
    }
  };


  /**
   * @private @const {function(string):?}
   * @suppress {newCheckTypes}
   */
  goog.loadModuleFromSource_ = function() {
    // NOTE: we avoid declaring parameters or local variables here to avoid
    // masking globals or leaking values into the module definition.
    'use strict';
    var exports = {};
    eval(arguments[0]);
    return exports;
  };


  /**
   * Writes a new script pointing to {@code src} directly into the DOM.
   *
   * NOTE: This method is not CSP-compliant. @see goog.appendScriptSrcNode_ for
   * the fallback mechanism.
   *
   * @param {string} src The script URL.
   * @private
   */
  goog.writeScriptSrcNode_ = function(src) {
    goog.global.document.write(
        '<script type="text/javascript" src="' + src + '"></' + 'script>');
  };


  /**
   * Appends a new script node to the DOM using a CSP-compliant mechanism. This
   * method exists as a fallback for document.write (which is not allowed in a
   * strict CSP context, e.g., Chrome apps).
   *
   * NOTE: This method is not analogous to using document.write to insert a
   * <script> tag; specifically, the user agent will execute a script added by
   * document.write immediately after the current script block finishes
   * executing, whereas the DOM-appended script node will not be executed until
   * the entire document is parsed and executed. That is to say, this script is
   * added to the end of the script execution queue.
   *
   * The page must not attempt to call goog.required entities until after the
   * document has loaded, e.g., in or after the window.onload callback.
   *
   * @param {string} src The script URL.
   * @private
   */
  goog.appendScriptSrcNode_ = function(src) {
    /** @type {Document} */
    var doc = goog.global.document;
    var scriptEl = doc.createElement('script');
    scriptEl.type = 'text/javascript';
    scriptEl.src = src;
    scriptEl.defer = false;
    scriptEl.async = false;
    doc.head.appendChild(scriptEl);
  };


  /**
   * The default implementation of the import function. Writes a script tag to
   * import the script.
   *
   * @param {string} src The script url.
   * @param {string=} opt_sourceText The optionally source text to evaluate
   * @return {boolean} True if the script was imported, false otherwise.
   * @private
   */
  goog.writeScriptTag_ = function(src, opt_sourceText) {
    if (goog.inHtmlDocument_()) {
      /** @type {Document} */
      var doc = goog.global.document;

      // If the user tries to require a new symbol after document load,
      // something has gone terribly wrong. Doing a document.write would
      // wipe out the page. This does not apply to the CSP-compliant method
      // of writing script tags.
      if (!goog.ENABLE_CHROME_APP_SAFE_SCRIPT_LOADING &&
          doc.readyState == 'complete') {
        // Certain test frameworks load base.js multiple times, which tries
        // to write deps.js each time. If that happens, just fail silently.
        // These frameworks wipe the page between each load of base.js, so this
        // is OK.
        var isDeps = /\bdeps.js$/.test(src);
        if (isDeps) {
          return false;
        } else {
          throw Error('Cannot write "' + src + '" after document load');
        }
      }

      var isOldIE = goog.IS_OLD_IE_;

      if (opt_sourceText === undefined) {
        if (!isOldIE) {
          if (goog.ENABLE_CHROME_APP_SAFE_SCRIPT_LOADING) {
            goog.appendScriptSrcNode_(src);
          } else {
            goog.writeScriptSrcNode_(src);
          }
        } else {
          var state = " onreadystatechange='goog.onScriptLoad_(this, " +
              ++goog.lastNonModuleScriptIndex_ + ")' ";
          doc.write(
              '<script type="text/javascript" src="' +
                  src + '"' + state + '></' + 'script>');
        }
      } else {
        doc.write(
            '<script type="text/javascript">' +
            opt_sourceText +
            '</' + 'script>');
      }
      return true;
    } else {
      return false;
    }
  };


  /** @private {number} */
  goog.lastNonModuleScriptIndex_ = 0;


  /**
   * A readystatechange handler for legacy IE
   * @param {!HTMLScriptElement} script
   * @param {number} scriptIndex
   * @return {boolean}
   * @private
   */
  goog.onScriptLoad_ = function(script, scriptIndex) {
    // for now load the modules when we reach the last script,
    // later allow more inter-mingling.
    if (script.readyState == 'complete' &&
        goog.lastNonModuleScriptIndex_ == scriptIndex) {
      goog.loadQueuedModules_();
    }
    return true;
  };

  /**
   * Resolves dependencies based on the dependencies added using addDependency
   * and calls importScript_ in the correct order.
   * @param {string} pathToLoad The path from which to start discovering
   *     dependencies.
   * @private
   */
  goog.writeScripts_ = function(pathToLoad) {
    /** @type {!Array<string>} The scripts we need to write this time. */
    var scripts = [];
    var seenScript = {};
    var deps = goog.dependencies_;

    /** @param {string} path */
    function visitNode(path) {
      if (path in deps.written) {
        return;
      }

      // We have already visited this one. We can get here if we have cyclic
      // dependencies.
      if (path in deps.visited) {
        return;
      }

      deps.visited[path] = true;

      if (path in deps.requires) {
        for (var requireName in deps.requires[path]) {
          // If the required name is defined, we assume that it was already
          // bootstrapped by other means.
          if (!goog.isProvided_(requireName)) {
            if (requireName in deps.nameToPath) {
              visitNode(deps.nameToPath[requireName]);
            } else {
              throw Error('Undefined nameToPath for ' + requireName);
            }
          }
        }
      }

      if (!(path in seenScript)) {
        seenScript[path] = true;
        scripts.push(path);
      }
    }

    visitNode(pathToLoad);

    // record that we are going to load all these scripts.
    for (var i = 0; i < scripts.length; i++) {
      var path = scripts[i];
      goog.dependencies_.written[path] = true;
    }

    // If a module is loaded synchronously then we need to
    // clear the current inModuleLoader value, and restore it when we are
    // done loading the current "requires".
    var moduleState = goog.moduleLoaderState_;
    goog.moduleLoaderState_ = null;

    for (var i = 0; i < scripts.length; i++) {
      var path = scripts[i];
      if (path) {
        if (!deps.pathIsModule[path]) {
          goog.importScript_(goog.basePath + path);
        } else {
          goog.importModule_(goog.basePath + path);
        }
      } else {
        goog.moduleLoaderState_ = moduleState;
        throw Error('Undefined script input');
      }
    }

    // restore the current "module loading state"
    goog.moduleLoaderState_ = moduleState;
  };


  /**
   * Looks at the dependency rules and tries to determine the script file that
   * fulfills a particular rule.
   * @param {string} rule In the form goog.namespace.Class or project.script.
   * @return {?string} Url corresponding to the rule, or null.
   * @private
   */
  goog.getPathFromDeps_ = function(rule) {
    if (rule in goog.dependencies_.nameToPath) {
      return goog.dependencies_.nameToPath[rule];
    } else {
      return null;
    }
  };

  goog.findBasePath_();

  // Allow projects to manage the deps files themselves.
  if (!goog.global.CLOSURE_NO_DEPS) {
    goog.importScript_(goog.basePath + 'deps.js');
  }
}


/**
 * Normalize a file path by removing redundant ".." and extraneous "." file
 * path components.
 * @param {string} path
 * @return {string}
 * @private
 */
goog.normalizePath_ = function(path) {
  var components = path.split('/');
  var i = 0;
  while (i < components.length) {
    if (components[i] == '.') {
      components.splice(i, 1);
    } else if (i && components[i] == '..' &&
        components[i - 1] && components[i - 1] != '..') {
      components.splice(--i, 2);
    } else {
      i++;
    }
  }
  return components.join('/');
};


/**
 * Loads file by synchronous XHR. Should not be used in production environments.
 * @param {string} src Source URL.
 * @return {string} File contents.
 * @private
 */
goog.loadFileSync_ = function(src) {
  if (goog.global.CLOSURE_LOAD_FILE_SYNC) {
    return goog.global.CLOSURE_LOAD_FILE_SYNC(src);
  } else {
    /** @type {XMLHttpRequest} */
    var xhr = new goog.global['XMLHttpRequest']();
    xhr.open('get', src, false);
    xhr.send();
    return xhr.responseText;
  }
};


/**
 * Retrieve and execute a module.
 * @param {string} src Script source URL.
 * @private
 */
goog.retrieveAndExecModule_ = function(src) {
  if (!COMPILED) {
    // The full but non-canonicalized URL for later use.
    var originalPath = src;
    // Canonicalize the path, removing any /./ or /../ since Chrome's debugging
    // console doesn't auto-canonicalize XHR loads as it does <script> srcs.
    src = goog.normalizePath_(src);

    var importScript = goog.global.CLOSURE_IMPORT_SCRIPT ||
        goog.writeScriptTag_;

    var scriptText = goog.loadFileSync_(src);

    if (scriptText != null) {
      var execModuleScript = goog.wrapModule_(src, scriptText);
      var isOldIE = goog.IS_OLD_IE_;
      if (isOldIE) {
        goog.dependencies_.deferred[originalPath] = execModuleScript;
        goog.queuedModules_.push(originalPath);
      } else {
        importScript(src, execModuleScript);
      }
    } else {
      throw new Error('load of ' + src + 'failed');
    }
  }
};


//==============================================================================
// Language Enhancements
//==============================================================================


/**
 * This is a "fixed" version of the typeof operator.  It differs from the typeof
 * operator in such a way that null returns 'null' and arrays return 'array'.
 * @param {*} value The value to get the type of.
 * @return {string} The name of the type.
 */
goog.typeOf = function(value) {
  var s = typeof value;
  if (s == 'object') {
    if (value) {
      // Check these first, so we can avoid calling Object.prototype.toString if
      // possible.
      //
      // IE improperly marshals tyepof across execution contexts, but a
      // cross-context object will still return false for "instanceof Object".
      if (value instanceof Array) {
        return 'array';
      } else if (value instanceof Object) {
        return s;
      }

      // HACK: In order to use an Object prototype method on the arbitrary
      //   value, the compiler requires the value be cast to type Object,
      //   even though the ECMA spec explicitly allows it.
      var className = Object.prototype.toString.call(
          /** @type {Object} */ (value));
      // In Firefox 3.6, attempting to access iframe window objects' length
      // property throws an NS_ERROR_FAILURE, so we need to special-case it
      // here.
      if (className == '[object Window]') {
        return 'object';
      }

      // We cannot always use constructor == Array or instanceof Array because
      // different frames have different Array objects. In IE6, if the iframe
      // where the array was created is destroyed, the array loses its
      // prototype. Then dereferencing val.splice here throws an exception, so
      // we can't use goog.isFunction. Calling typeof directly returns 'unknown'
      // so that will work. In this case, this function will return false and
      // most array functions will still work because the array is still
      // array-like (supports length and []) even though it has lost its
      // prototype.
      // Mark Miller noticed that Object.prototype.toString
      // allows access to the unforgeable [[Class]] property.
      //  15.2.4.2 Object.prototype.toString ( )
      //  When the toString method is called, the following steps are taken:
      //      1. Get the [[Class]] property of this object.
      //      2. Compute a string value by concatenating the three strings
      //         "[object ", Result(1), and "]".
      //      3. Return Result(2).
      // and this behavior survives the destruction of the execution context.
      if ((className == '[object Array]' ||
           // In IE all non value types are wrapped as objects across window
           // boundaries (not iframe though) so we have to do object detection
           // for this edge case.
           typeof value.length == 'number' &&
           typeof value.splice != 'undefined' &&
           typeof value.propertyIsEnumerable != 'undefined' &&
           !value.propertyIsEnumerable('splice')

          )) {
        return 'array';
      }
      // HACK: There is still an array case that fails.
      //     function ArrayImpostor() {}
      //     ArrayImpostor.prototype = [];
      //     var impostor = new ArrayImpostor;
      // this can be fixed by getting rid of the fast path
      // (value instanceof Array) and solely relying on
      // (value && Object.prototype.toString.vall(value) === '[object Array]')
      // but that would require many more function calls and is not warranted
      // unless closure code is receiving objects from untrusted sources.

      // IE in cross-window calls does not correctly marshal the function type
      // (it appears just as an object) so we cannot use just typeof val ==
      // 'function'. However, if the object has a call property, it is a
      // function.
      if ((className == '[object Function]' ||
          typeof value.call != 'undefined' &&
          typeof value.propertyIsEnumerable != 'undefined' &&
          !value.propertyIsEnumerable('call'))) {
        return 'function';
      }

    } else {
      return 'null';
    }

  } else if (s == 'function' && typeof value.call == 'undefined') {
    // In Safari typeof nodeList returns 'function', and on Firefox typeof
    // behaves similarly for HTML{Applet,Embed,Object}, Elements and RegExps. We
    // would like to return object for those and we can detect an invalid
    // function by making sure that the function object has a call method.
    return 'object';
  }
  return s;
};


/**
 * Returns true if the specified value is null.
 * @param {?} val Variable to test.
 * @return {boolean} Whether variable is null.
 */
goog.isNull = function(val) {
  return val === null;
};


/**
 * Returns true if the specified value is defined and not null.
 * @param {?} val Variable to test.
 * @return {boolean} Whether variable is defined and not null.
 */
goog.isDefAndNotNull = function(val) {
  // Note that undefined == null.
  return val != null;
};


/**
 * Returns true if the specified value is an array.
 * @param {?} val Variable to test.
 * @return {boolean} Whether variable is an array.
 */
goog.isArray = function(val) {
  return goog.typeOf(val) == 'array';
};


/**
 * Returns true if the object looks like an array. To qualify as array like
 * the value needs to be either a NodeList or an object with a Number length
 * property. As a special case, a function value is not array like, because its
 * length property is fixed to correspond to the number of expected arguments.
 * @param {?} val Variable to test.
 * @return {boolean} Whether variable is an array.
 */
goog.isArrayLike = function(val) {
  var type = goog.typeOf(val);
  // We do not use goog.isObject here in order to exclude function values.
  return type == 'array' || type == 'object' && typeof val.length == 'number';
};


/**
 * Returns true if the object looks like a Date. To qualify as Date-like the
 * value needs to be an object and have a getFullYear() function.
 * @param {?} val Variable to test.
 * @return {boolean} Whether variable is a like a Date.
 */
goog.isDateLike = function(val) {
  return goog.isObject(val) && typeof val.getFullYear == 'function';
};


/**
 * Returns true if the specified value is a string.
 * @param {?} val Variable to test.
 * @return {boolean} Whether variable is a string.
 */
goog.isString = function(val) {
  return typeof val == 'string';
};


/**
 * Returns true if the specified value is a boolean.
 * @param {?} val Variable to test.
 * @return {boolean} Whether variable is boolean.
 */
goog.isBoolean = function(val) {
  return typeof val == 'boolean';
};


/**
 * Returns true if the specified value is a number.
 * @param {?} val Variable to test.
 * @return {boolean} Whether variable is a number.
 */
goog.isNumber = function(val) {
  return typeof val == 'number';
};


/**
 * Returns true if the specified value is a function.
 * @param {?} val Variable to test.
 * @return {boolean} Whether variable is a function.
 */
goog.isFunction = function(val) {
  return goog.typeOf(val) == 'function';
};


/**
 * Returns true if the specified value is an object.  This includes arrays and
 * functions.
 * @param {?} val Variable to test.
 * @return {boolean} Whether variable is an object.
 */
goog.isObject = function(val) {
  var type = typeof val;
  return type == 'object' && val != null || type == 'function';
  // return Object(val) === val also works, but is slower, especially if val is
  // not an object.
};


/**
 * Gets a unique ID for an object. This mutates the object so that further calls
 * with the same object as a parameter returns the same value. The unique ID is
 * guaranteed to be unique across the current session amongst objects that are
 * passed into {@code getUid}. There is no guarantee that the ID is unique or
 * consistent across sessions. It is unsafe to generate unique ID for function
 * prototypes.
 *
 * @param {Object} obj The object to get the unique ID for.
 * @return {number} The unique ID for the object.
 */
goog.getUid = function(obj) {
  // TODO(arv): Make the type stricter, do not accept null.

  // In Opera window.hasOwnProperty exists but always returns false so we avoid
  // using it. As a consequence the unique ID generated for BaseClass.prototype
  // and SubClass.prototype will be the same.
  return obj[goog.UID_PROPERTY_] ||
      (obj[goog.UID_PROPERTY_] = ++goog.uidCounter_);
};


/**
 * Whether the given object is already assigned a unique ID.
 *
 * This does not modify the object.
 *
 * @param {!Object} obj The object to check.
 * @return {boolean} Whether there is an assigned unique id for the object.
 */
goog.hasUid = function(obj) {
  return !!obj[goog.UID_PROPERTY_];
};


/**
 * Removes the unique ID from an object. This is useful if the object was
 * previously mutated using {@code goog.getUid} in which case the mutation is
 * undone.
 * @param {Object} obj The object to remove the unique ID field from.
 */
goog.removeUid = function(obj) {
  // TODO(arv): Make the type stricter, do not accept null.

  // In IE, DOM nodes are not instances of Object and throw an exception if we
  // try to delete.  Instead we try to use removeAttribute.
  if ('removeAttribute' in obj) {
    obj.removeAttribute(goog.UID_PROPERTY_);
  }
  /** @preserveTry */
  try {
    delete obj[goog.UID_PROPERTY_];
  } catch (ex) {
  }
};


/**
 * Name for unique ID property. Initialized in a way to help avoid collisions
 * with other closure JavaScript on the same page.
 * @type {string}
 * @private
 */
goog.UID_PROPERTY_ = 'closure_uid_' + ((Math.random() * 1e9) >>> 0);


/**
 * Counter for UID.
 * @type {number}
 * @private
 */
goog.uidCounter_ = 0;


/**
 * Adds a hash code field to an object. The hash code is unique for the
 * given object.
 * @param {Object} obj The object to get the hash code for.
 * @return {number} The hash code for the object.
 * @deprecated Use goog.getUid instead.
 */
goog.getHashCode = goog.getUid;


/**
 * Removes the hash code field from an object.
 * @param {Object} obj The object to remove the field from.
 * @deprecated Use goog.removeUid instead.
 */
goog.removeHashCode = goog.removeUid;


/**
 * Clones a value. The input may be an Object, Array, or basic type. Objects and
 * arrays will be cloned recursively.
 *
 * WARNINGS:
 * <code>goog.cloneObject</code> does not detect reference loops. Objects that
 * refer to themselves will cause infinite recursion.
 *
 * <code>goog.cloneObject</code> is unaware of unique identifiers, and copies
 * UIDs created by <code>getUid</code> into cloned results.
 *
 * @param {*} obj The value to clone.
 * @return {*} A clone of the input value.
 * @deprecated goog.cloneObject is unsafe. Prefer the goog.object methods.
 */
goog.cloneObject = function(obj) {
  var type = goog.typeOf(obj);
  if (type == 'object' || type == 'array') {
    if (obj.clone) {
      return obj.clone();
    }
    var clone = type == 'array' ? [] : {};
    for (var key in obj) {
      clone[key] = goog.cloneObject(obj[key]);
    }
    return clone;
  }

  return obj;
};


/**
 * A native implementation of goog.bind.
 * @param {Function} fn A function to partially apply.
 * @param {Object|undefined} selfObj Specifies the object which this should
 *     point to when the function is run.
 * @param {...*} var_args Additional arguments that are partially applied to the
 *     function.
 * @return {!Function} A partially-applied form of the function bind() was
 *     invoked as a method of.
 * @private
 * @suppress {deprecated} The compiler thinks that Function.prototype.bind is
 *     deprecated because some people have declared a pure-JS version.
 *     Only the pure-JS version is truly deprecated.
 */
goog.bindNative_ = function(fn, selfObj, var_args) {
  return /** @type {!Function} */ (fn.call.apply(fn.bind, arguments));
};


/**
 * A pure-JS implementation of goog.bind.
 * @param {Function} fn A function to partially apply.
 * @param {Object|undefined} selfObj Specifies the object which this should
 *     point to when the function is run.
 * @param {...*} var_args Additional arguments that are partially applied to the
 *     function.
 * @return {!Function} A partially-applied form of the function bind() was
 *     invoked as a method of.
 * @private
 */
goog.bindJs_ = function(fn, selfObj, var_args) {
  if (!fn) {
    throw new Error();
  }

  if (arguments.length > 2) {
    var boundArgs = Array.prototype.slice.call(arguments, 2);
    return function() {
      // Prepend the bound arguments to the current arguments.
      var newArgs = Array.prototype.slice.call(arguments);
      Array.prototype.unshift.apply(newArgs, boundArgs);
      return fn.apply(selfObj, newArgs);
    };

  } else {
    return function() {
      return fn.apply(selfObj, arguments);
    };
  }
};


/**
 * Partially applies this function to a particular 'this object' and zero or
 * more arguments. The result is a new function with some arguments of the first
 * function pre-filled and the value of this 'pre-specified'.
 *
 * Remaining arguments specified at call-time are appended to the pre-specified
 * ones.
 *
 * Also see: {@link #partial}.
 *
 * Usage:
 * <pre>var barMethBound = goog.bind(myFunction, myObj, 'arg1', 'arg2');
 * barMethBound('arg3', 'arg4');</pre>
 *
 * @param {?function(this:T, ...)} fn A function to partially apply.
 * @param {T} selfObj Specifies the object which this should point to when the
 *     function is run.
 * @param {...*} var_args Additional arguments that are partially applied to the
 *     function.
 * @return {!Function} A partially-applied form of the function goog.bind() was
 *     invoked as a method of.
 * @template T
 * @suppress {deprecated} See above.
 */
goog.bind = function(fn, selfObj, var_args) {
  // TODO(nicksantos): narrow the type signature.
  if (Function.prototype.bind &&
      // NOTE(nicksantos): Somebody pulled base.js into the default Chrome
      // extension environment. This means that for Chrome extensions, they get
      // the implementation of Function.prototype.bind that calls goog.bind
      // instead of the native one. Even worse, we don't want to introduce a
      // circular dependency between goog.bind and Function.prototype.bind, so
      // we have to hack this to make sure it works correctly.
      Function.prototype.bind.toString().indexOf('native code') != -1) {
    goog.bind = goog.bindNative_;
  } else {
    goog.bind = goog.bindJs_;
  }
  return goog.bind.apply(null, arguments);
};


/**
 * Like goog.bind(), except that a 'this object' is not required. Useful when
 * the target function is already bound.
 *
 * Usage:
 * var g = goog.partial(f, arg1, arg2);
 * g(arg3, arg4);
 *
 * @param {Function} fn A function to partially apply.
 * @param {...*} var_args Additional arguments that are partially applied to fn.
 * @return {!Function} A partially-applied form of the function goog.partial()
 *     was invoked as a method of.
 */
goog.partial = function(fn, var_args) {
  var args = Array.prototype.slice.call(arguments, 1);
  return function() {
    // Clone the array (with slice()) and append additional arguments
    // to the existing arguments.
    var newArgs = args.slice();
    newArgs.push.apply(newArgs, arguments);
    return fn.apply(this, newArgs);
  };
};


/**
 * Copies all the members of a source object to a target object. This method
 * does not work on all browsers for all objects that contain keys such as
 * toString or hasOwnProperty. Use goog.object.extend for this purpose.
 * @param {Object} target Target.
 * @param {Object} source Source.
 */
goog.mixin = function(target, source) {
  for (var x in source) {
    target[x] = source[x];
  }

  // For IE7 or lower, the for-in-loop does not contain any properties that are
  // not enumerable on the prototype object (for example, isPrototypeOf from
  // Object.prototype) but also it will not include 'replace' on objects that
  // extend String and change 'replace' (not that it is common for anyone to
  // extend anything except Object).
};


/**
 * @return {number} An integer value representing the number of milliseconds
 *     between midnight, January 1, 1970 and the current time.
 */
goog.now = (goog.TRUSTED_SITE && Date.now) || (function() {
  // Unary plus operator converts its operand to a number which in the case of
  // a date is done by calling getTime().
  return +new Date();
});


/**
 * Evals JavaScript in the global scope.  In IE this uses execScript, other
 * browsers use goog.global.eval. If goog.global.eval does not evaluate in the
 * global scope (for example, in Safari), appends a script tag instead.
 * Throws an exception if neither execScript or eval is defined.
 * @param {string} script JavaScript string.
 */
goog.globalEval = function(script) {
  if (goog.global.execScript) {
    goog.global.execScript(script, 'JavaScript');
  } else if (goog.global.eval) {
    // Test to see if eval works
    if (goog.evalWorksForGlobals_ == null) {
      goog.global.eval('var _evalTest_ = 1;');
      if (typeof goog.global['_evalTest_'] != 'undefined') {
        try {
          delete goog.global['_evalTest_'];
        } catch (ignore) {
          // Microsoft edge fails the deletion above in strict mode.
        }
        goog.evalWorksForGlobals_ = true;
      } else {
        goog.evalWorksForGlobals_ = false;
      }
    }

    if (goog.evalWorksForGlobals_) {
      goog.global.eval(script);
    } else {
      /** @type {Document} */
      var doc = goog.global.document;
      var scriptElt = doc.createElement('SCRIPT');
      scriptElt.type = 'text/javascript';
      scriptElt.defer = false;
      // Note(user): can't use .innerHTML since "t('<test>')" will fail and
      // .text doesn't work in Safari 2.  Therefore we append a text node.
      scriptElt.appendChild(doc.createTextNode(script));
      doc.body.appendChild(scriptElt);
      doc.body.removeChild(scriptElt);
    }
  } else {
    throw Error('goog.globalEval not available');
  }
};


/**
 * Indicates whether or not we can call 'eval' directly to eval code in the
 * global scope. Set to a Boolean by the first call to goog.globalEval (which
 * empirically tests whether eval works for globals). @see goog.globalEval
 * @type {?boolean}
 * @private
 */
goog.evalWorksForGlobals_ = null;


/**
 * Optional map of CSS class names to obfuscated names used with
 * goog.getCssName().
 * @private {!Object<string, string>|undefined}
 * @see goog.setCssNameMapping
 */
goog.cssNameMapping_;


/**
 * Optional obfuscation style for CSS class names. Should be set to either
 * 'BY_WHOLE' or 'BY_PART' if defined.
 * @type {string|undefined}
 * @private
 * @see goog.setCssNameMapping
 */
goog.cssNameMappingStyle_;


/**
 * Handles strings that are intended to be used as CSS class names.
 *
 * This function works in tandem with @see goog.setCssNameMapping.
 *
 * Without any mapping set, the arguments are simple joined with a hyphen and
 * passed through unaltered.
 *
 * When there is a mapping, there are two possible styles in which these
 * mappings are used. In the BY_PART style, each part (i.e. in between hyphens)
 * of the passed in css name is rewritten according to the map. In the BY_WHOLE
 * style, the full css name is looked up in the map directly. If a rewrite is
 * not specified by the map, the compiler will output a warning.
 *
 * When the mapping is passed to the compiler, it will replace calls to
 * goog.getCssName with the strings from the mapping, e.g.
 *     var x = goog.getCssName('foo');
 *     var y = goog.getCssName(this.baseClass, 'active');
 *  becomes:
 *     var x= 'foo';
 *     var y = this.baseClass + '-active';
 *
 * If one argument is passed it will be processed, if two are passed only the
 * modifier will be processed, as it is assumed the first argument was generated
 * as a result of calling goog.getCssName.
 *
 * @param {string} className The class name.
 * @param {string=} opt_modifier A modifier to be appended to the class name.
 * @return {string} The class name or the concatenation of the class name and
 *     the modifier.
 */
goog.getCssName = function(className, opt_modifier) {
  var getMapping = function(cssName) {
    return goog.cssNameMapping_[cssName] || cssName;
  };

  var renameByParts = function(cssName) {
    // Remap all the parts individually.
    var parts = cssName.split('-');
    var mapped = [];
    for (var i = 0; i < parts.length; i++) {
      mapped.push(getMapping(parts[i]));
    }
    return mapped.join('-');
  };

  var rename;
  if (goog.cssNameMapping_) {
    rename = goog.cssNameMappingStyle_ == 'BY_WHOLE' ?
        getMapping : renameByParts;
  } else {
    rename = function(a) {
      return a;
    };
  }

  if (opt_modifier) {
    return className + '-' + rename(opt_modifier);
  } else {
    return rename(className);
  }
};


/**
 * Sets the map to check when returning a value from goog.getCssName(). Example:
 * <pre>
 * goog.setCssNameMapping({
 *   "goog": "a",
 *   "disabled": "b",
 * });
 *
 * var x = goog.getCssName('goog');
 * // The following evaluates to: "a a-b".
 * goog.getCssName('goog') + ' ' + goog.getCssName(x, 'disabled')
 * </pre>
 * When declared as a map of string literals to string literals, the JSCompiler
 * will replace all calls to goog.getCssName() using the supplied map if the
 * --process_closure_primitives flag is set.
 *
 * @param {!Object} mapping A map of strings to strings where keys are possible
 *     arguments to goog.getCssName() and values are the corresponding values
 *     that should be returned.
 * @param {string=} opt_style The style of css name mapping. There are two valid
 *     options: 'BY_PART', and 'BY_WHOLE'.
 * @see goog.getCssName for a description.
 */
goog.setCssNameMapping = function(mapping, opt_style) {
  goog.cssNameMapping_ = mapping;
  goog.cssNameMappingStyle_ = opt_style;
};


/**
 * To use CSS renaming in compiled mode, one of the input files should have a
 * call to goog.setCssNameMapping() with an object literal that the JSCompiler
 * can extract and use to replace all calls to goog.getCssName(). In uncompiled
 * mode, JavaScript code should be loaded before this base.js file that declares
 * a global variable, CLOSURE_CSS_NAME_MAPPING, which is used below. This is
 * to ensure that the mapping is loaded before any calls to goog.getCssName()
 * are made in uncompiled mode.
 *
 * A hook for overriding the CSS name mapping.
 * @type {!Object<string, string>|undefined}
 */
goog.global.CLOSURE_CSS_NAME_MAPPING;


if (!COMPILED && goog.global.CLOSURE_CSS_NAME_MAPPING) {
  // This does not call goog.setCssNameMapping() because the JSCompiler
  // requires that goog.setCssNameMapping() be called with an object literal.
  goog.cssNameMapping_ = goog.global.CLOSURE_CSS_NAME_MAPPING;
}


/**
 * Gets a localized message.
 *
 * This function is a compiler primitive. If you give the compiler a localized
 * message bundle, it will replace the string at compile-time with a localized
 * version, and expand goog.getMsg call to a concatenated string.
 *
 * Messages must be initialized in the form:
 * <code>
 * var MSG_NAME = goog.getMsg('Hello {$placeholder}', {'placeholder': 'world'});
 * </code>
 *
 * @param {string} str Translatable string, places holders in the form {$foo}.
 * @param {Object<string, string>=} opt_values Maps place holder name to value.
 * @return {string} message with placeholders filled.
 */
goog.getMsg = function(str, opt_values) {
  if (opt_values) {
    str = str.replace(/\{\$([^}]+)}/g, function(match, key) {
      return key in opt_values ? opt_values[key] : match;
    });
  }
  return str;
};


/**
 * Gets a localized message. If the message does not have a translation, gives a
 * fallback message.
 *
 * This is useful when introducing a new message that has not yet been
 * translated into all languages.
 *
 * This function is a compiler primitive. Must be used in the form:
 * <code>var x = goog.getMsgWithFallback(MSG_A, MSG_B);</code>
 * where MSG_A and MSG_B were initialized with goog.getMsg.
 *
 * @param {string} a The preferred message.
 * @param {string} b The fallback message.
 * @return {string} The best translated message.
 */
goog.getMsgWithFallback = function(a, b) {
  return a;
};


/**
 * Exposes an unobfuscated global namespace path for the given object.
 * Note that fields of the exported object *will* be obfuscated, unless they are
 * exported in turn via this function or goog.exportProperty.
 *
 * Also handy for making public items that are defined in anonymous closures.
 *
 * ex. goog.exportSymbol('public.path.Foo', Foo);
 *
 * ex. goog.exportSymbol('public.path.Foo.staticFunction', Foo.staticFunction);
 *     public.path.Foo.staticFunction();
 *
 * ex. goog.exportSymbol('public.path.Foo.prototype.myMethod',
 *                       Foo.prototype.myMethod);
 *     new public.path.Foo().myMethod();
 *
 * @param {string} publicPath Unobfuscated name to export.
 * @param {*} object Object the name should point to.
 * @param {Object=} opt_objectToExportTo The object to add the path to; default
 *     is goog.global.
 */
goog.exportSymbol = function(publicPath, object, opt_objectToExportTo) {
  goog.exportPath_(publicPath, object, opt_objectToExportTo);
};


/**
 * Exports a property unobfuscated into the object's namespace.
 * ex. goog.exportProperty(Foo, 'staticFunction', Foo.staticFunction);
 * ex. goog.exportProperty(Foo.prototype, 'myMethod', Foo.prototype.myMethod);
 * @param {Object} object Object whose static property is being exported.
 * @param {string} publicName Unobfuscated name to export.
 * @param {*} symbol Object the name should point to.
 */
goog.exportProperty = function(object, publicName, symbol) {
  object[publicName] = symbol;
};


/**
 * Inherit the prototype methods from one constructor into another.
 *
 * Usage:
 * <pre>
 * function ParentClass(a, b) { }
 * ParentClass.prototype.foo = function(a) { };
 *
 * function ChildClass(a, b, c) {
 *   ChildClass.base(this, 'constructor', a, b);
 * }
 * goog.inherits(ChildClass, ParentClass);
 *
 * var child = new ChildClass('a', 'b', 'see');
 * child.foo(); // This works.
 * </pre>
 *
 * @param {Function} childCtor Child class.
 * @param {Function} parentCtor Parent class.
 */
goog.inherits = function(childCtor, parentCtor) {
  /** @constructor */
  function tempCtor() {};
  tempCtor.prototype = parentCtor.prototype;
  childCtor.superClass_ = parentCtor.prototype;
  childCtor.prototype = new tempCtor();
  /** @override */
  childCtor.prototype.constructor = childCtor;

  /**
   * Calls superclass constructor/method.
   *
   * This function is only available if you use goog.inherits to
   * express inheritance relationships between classes.
   *
   * NOTE: This is a replacement for goog.base and for superClass_
   * property defined in childCtor.
   *
   * @param {!Object} me Should always be "this".
   * @param {string} methodName The method name to call. Calling
   *     superclass constructor can be done with the special string
   *     'constructor'.
   * @param {...*} var_args The arguments to pass to superclass
   *     method/constructor.
   * @return {*} The return value of the superclass method/constructor.
   */
  childCtor.base = function(me, methodName, var_args) {
    // Copying using loop to avoid deop due to passing arguments object to
    // function. This is faster in many JS engines as of late 2014.
    var args = new Array(arguments.length - 2);
    for (var i = 2; i < arguments.length; i++) {
      args[i - 2] = arguments[i];
    }
    return parentCtor.prototype[methodName].apply(me, args);
  };
};


/**
 * Call up to the superclass.
 *
 * If this is called from a constructor, then this calls the superclass
 * constructor with arguments 1-N.
 *
 * If this is called from a prototype method, then you must pass the name of the
 * method as the second argument to this function. If you do not, you will get a
 * runtime error. This calls the superclass' method with arguments 2-N.
 *
 * This function only works if you use goog.inherits to express inheritance
 * relationships between your classes.
 *
 * This function is a compiler primitive. At compile-time, the compiler will do
 * macro expansion to remove a lot of the extra overhead that this function
 * introduces. The compiler will also enforce a lot of the assumptions that this
 * function makes, and treat it as a compiler error if you break them.
 *
 * @param {!Object} me Should always be "this".
 * @param {*=} opt_methodName The method name if calling a super method.
 * @param {...*} var_args The rest of the arguments.
 * @return {*} The return value of the superclass method.
 * @suppress {es5Strict} This method can not be used in strict mode, but
 *     all Closure Library consumers must depend on this file.
 */
goog.base = function(me, opt_methodName, var_args) {
  var caller = arguments.callee.caller;

  if (goog.STRICT_MODE_COMPATIBLE || (goog.DEBUG && !caller)) {
    throw Error('arguments.caller not defined.  goog.base() cannot be used ' +
                'with strict mode code. See ' +
                'http://www.ecma-international.org/ecma-262/5.1/#sec-C');
  }

  if (caller.superClass_) {
    // Copying using loop to avoid deop due to passing arguments object to
    // function. This is faster in many JS engines as of late 2014.
    var ctorArgs = new Array(arguments.length - 1);
    for (var i = 1; i < arguments.length; i++) {
      ctorArgs[i - 1] = arguments[i];
    }
    // This is a constructor. Call the superclass constructor.
    return caller.superClass_.constructor.apply(me, ctorArgs);
  }

  // Copying using loop to avoid deop due to passing arguments object to
  // function. This is faster in many JS engines as of late 2014.
  var args = new Array(arguments.length - 2);
  for (var i = 2; i < arguments.length; i++) {
    args[i - 2] = arguments[i];
  }
  var foundCaller = false;
  for (var ctor = me.constructor;
       ctor; ctor = ctor.superClass_ && ctor.superClass_.constructor) {
    if (ctor.prototype[opt_methodName] === caller) {
      foundCaller = true;
    } else if (foundCaller) {
      return ctor.prototype[opt_methodName].apply(me, args);
    }
  }

  // If we did not find the caller in the prototype chain, then one of two
  // things happened:
  // 1) The caller is an instance method.
  // 2) This method was not called by the right caller.
  if (me[opt_methodName] === caller) {
    return me.constructor.prototype[opt_methodName].apply(me, args);
  } else {
    throw Error(
        'goog.base called from a method of one name ' +
        'to a method of a different name');
  }
};


/**
 * Allow for aliasing within scope functions.  This function exists for
 * uncompiled code - in compiled code the calls will be inlined and the aliases
 * applied.  In uncompiled code the function is simply run since the aliases as
 * written are valid JavaScript.
 *
 *
 * @param {function()} fn Function to call.  This function can contain aliases
 *     to namespaces (e.g. "var dom = goog.dom") or classes
 *     (e.g. "var Timer = goog.Timer").
 */
goog.scope = function(fn) {
  fn.call(goog.global);
};


/*
 * To support uncompiled, strict mode bundles that use eval to divide source
 * like so:
 *    eval('someSource;//# sourceUrl sourcefile.js');
 * We need to export the globally defined symbols "goog" and "COMPILED".
 * Exporting "goog" breaks the compiler optimizations, so we required that
 * be defined externally.
 * NOTE: We don't use goog.exportSymbol here because we don't want to trigger
 * extern generation when that compiler option is enabled.
 */
if (!COMPILED) {
  goog.global['COMPILED'] = COMPILED;
}



//==============================================================================
// goog.defineClass implementation
//==============================================================================


/**
 * Creates a restricted form of a Closure "class":
 *   - from the compiler's perspective, the instance returned from the
 *     constructor is sealed (no new properties may be added).  This enables
 *     better checks.
 *   - the compiler will rewrite this definition to a form that is optimal
 *     for type checking and optimization (initially this will be a more
 *     traditional form).
 *
 * @param {Function} superClass The superclass, Object or null.
 * @param {goog.defineClass.ClassDescriptor} def
 *     An object literal describing
 *     the class.  It may have the following properties:
 *     "constructor": the constructor function
 *     "statics": an object literal containing methods to add to the constructor
 *        as "static" methods or a function that will receive the constructor
 *        function as its only parameter to which static properties can
 *        be added.
 *     all other properties are added to the prototype.
 * @return {!Function} The class constructor.
 */
goog.defineClass = function(superClass, def) {
  // TODO(johnlenz): consider making the superClass an optional parameter.
  var constructor = def.constructor;
  var statics = def.statics;
  // Wrap the constructor prior to setting up the prototype and static methods.
  if (!constructor || constructor == Object.prototype.constructor) {
    constructor = function() {
      throw Error('cannot instantiate an interface (no constructor defined).');
    };
  }

  var cls = goog.defineClass.createSealingConstructor_(constructor, superClass);
  if (superClass) {
    goog.inherits(cls, superClass);
  }

  // Remove all the properties that should not be copied to the prototype.
  delete def.constructor;
  delete def.statics;

  goog.defineClass.applyProperties_(cls.prototype, def);
  if (statics != null) {
    if (statics instanceof Function) {
      statics(cls);
    } else {
      goog.defineClass.applyProperties_(cls, statics);
    }
  }

  return cls;
};


/**
 * @typedef {
 *     !Object|
 *     {constructor:!Function}|
 *     {constructor:!Function, statics:(Object|function(Function):void)}}
 * @suppress {missingProvide}
 */
goog.defineClass.ClassDescriptor;


/**
 * @define {boolean} Whether the instances returned by
 * goog.defineClass should be sealed when possible.
 */
goog.define('goog.defineClass.SEAL_CLASS_INSTANCES', goog.DEBUG);


/**
 * If goog.defineClass.SEAL_CLASS_INSTANCES is enabled and Object.seal is
 * defined, this function will wrap the constructor in a function that seals the
 * results of the provided constructor function.
 *
 * @param {!Function} ctr The constructor whose results maybe be sealed.
 * @param {Function} superClass The superclass constructor.
 * @return {!Function} The replacement constructor.
 * @private
 */
goog.defineClass.createSealingConstructor_ = function(ctr, superClass) {
  if (goog.defineClass.SEAL_CLASS_INSTANCES &&
      Object.seal instanceof Function) {
    // Don't seal subclasses of unsealable-tagged legacy classes.
    if (superClass && superClass.prototype &&
        superClass.prototype[goog.UNSEALABLE_CONSTRUCTOR_PROPERTY_]) {
      return ctr;
    }
    /**
     * @this {Object}
     * @return {?}
     */
    var wrappedCtr = function() {
      // Don't seal an instance of a subclass when it calls the constructor of
      // its super class as there is most likely still setup to do.
      var instance = ctr.apply(this, arguments) || this;
      instance[goog.UID_PROPERTY_] = instance[goog.UID_PROPERTY_];
      if (this.constructor === wrappedCtr) {
        Object.seal(instance);
      }
      return instance;
    };
    return wrappedCtr;
  }
  return ctr;
};


// TODO(johnlenz): share these values with the goog.object
/**
 * The names of the fields that are defined on Object.prototype.
 * @type {!Array<string>}
 * @private
 * @const
 */
goog.defineClass.OBJECT_PROTOTYPE_FIELDS_ = [
  'constructor',
  'hasOwnProperty',
  'isPrototypeOf',
  'propertyIsEnumerable',
  'toLocaleString',
  'toString',
  'valueOf'
];


// TODO(johnlenz): share this function with the goog.object
/**
 * @param {!Object} target The object to add properties to.
 * @param {!Object} source The object to copy properties from.
 * @private
 */
goog.defineClass.applyProperties_ = function(target, source) {
  // TODO(johnlenz): update this to support ES5 getters/setters

  var key;
  for (key in source) {
    if (Object.prototype.hasOwnProperty.call(source, key)) {
      target[key] = source[key];
    }
  }

  // For IE the for-in-loop does not contain any properties that are not
  // enumerable on the prototype object (for example isPrototypeOf from
  // Object.prototype) and it will also not include 'replace' on objects that
  // extend String and change 'replace' (not that it is common for anyone to
  // extend anything except Object).
  for (var i = 0; i < goog.defineClass.OBJECT_PROTOTYPE_FIELDS_.length; i++) {
    key = goog.defineClass.OBJECT_PROTOTYPE_FIELDS_[i];
    if (Object.prototype.hasOwnProperty.call(source, key)) {
      target[key] = source[key];
    }
  }
};


/**
 * Sealing classes breaks the older idiom of assigning properties on the
 * prototype rather than in the constructor.  As such, goog.defineClass
 * must not seal subclasses of these old-style classes until they are fixed.
 * Until then, this marks a class as "broken", instructing defineClass
 * not to seal subclasses.
 * @param {!Function} ctr The legacy constructor to tag as unsealable.
 */
goog.tagUnsealableClass = function(ctr) {
  if (!COMPILED && goog.defineClass.SEAL_CLASS_INSTANCES) {
    ctr.prototype[goog.UNSEALABLE_CONSTRUCTOR_PROPERTY_] = true;
  }
};


/**
 * Name for unsealable tag property.
 * @const @private {string}
 */
goog.UNSEALABLE_CONSTRUCTOR_PROPERTY_ = 'goog_defineClass_legacy_unsealable';
// Copyright 2006 The Closure Library Authors. All Rights Reserved.
//
// Licensed under the Apache License, Version 2.0 (the "License");
// you may not use this file except in compliance with the License.
// You may obtain a copy of the License at
//
//      http://www.apache.org/licenses/LICENSE-2.0
//
// Unless required by applicable law or agreed to in writing, software
// distributed under the License is distributed on an "AS-IS" BASIS,
// WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
// See the License for the specific language governing permissions and
// limitations under the License.

/**
 * @fileoverview Utilities for string manipulation.
 * @author arv@google.com (Erik Arvidsson)
 */


/**
 * Namespace for string utilities
 */
goog.string = {};


/**
 * @define {boolean} Enables HTML escaping of lowercase letter "e" which helps
 * with detection of double-escaping as this letter is frequently used.
 */
goog.define('goog.string.DETECT_DOUBLE_ESCAPING', false);


/**
 * @define {boolean} Whether to force non-dom html unescaping.
 */
goog.define('goog.string.FORCE_NON_DOM_HTML_UNESCAPING', false);


/**
 * Common Unicode string characters.
 * @enum {string}
 */
goog.string.Unicode = {
  NBSP: '\xa0'
};


/**
 * Fast prefix-checker.
 * @param {string} str The string to check.
 * @param {string} prefix A string to look for at the start of {@code str}.
 * @return {boolean} True if {@code str} begins with {@code prefix}.
 */
goog.string.startsWith = function(str, prefix) {
  return str.lastIndexOf(prefix, 0) == 0;
};


/**
 * Fast suffix-checker.
 * @param {string} str The string to check.
 * @param {string} suffix A string to look for at the end of {@code str}.
 * @return {boolean} True if {@code str} ends with {@code suffix}.
 */
goog.string.endsWith = function(str, suffix) {
  var l = str.length - suffix.length;
  return l >= 0 && str.indexOf(suffix, l) == l;
};


/**
 * Case-insensitive prefix-checker.
 * @param {string} str The string to check.
 * @param {string} prefix  A string to look for at the end of {@code str}.
 * @return {boolean} True if {@code str} begins with {@code prefix} (ignoring
 *     case).
 */
goog.string.caseInsensitiveStartsWith = function(str, prefix) {
  return goog.string.caseInsensitiveCompare(
      prefix, str.substr(0, prefix.length)) == 0;
};


/**
 * Case-insensitive suffix-checker.
 * @param {string} str The string to check.
 * @param {string} suffix A string to look for at the end of {@code str}.
 * @return {boolean} True if {@code str} ends with {@code suffix} (ignoring
 *     case).
 */
goog.string.caseInsensitiveEndsWith = function(str, suffix) {
  return goog.string.caseInsensitiveCompare(
      suffix, str.substr(str.length - suffix.length, suffix.length)) == 0;
};


/**
 * Case-insensitive equality checker.
 * @param {string} str1 First string to check.
 * @param {string} str2 Second string to check.
 * @return {boolean} True if {@code str1} and {@code str2} are the same string,
 *     ignoring case.
 */
goog.string.caseInsensitiveEquals = function(str1, str2) {
  return str1.toLowerCase() == str2.toLowerCase();
};


/**
 * Does simple python-style string substitution.
 * subs("foo%s hot%s", "bar", "dog") becomes "foobar hotdog".
 * @param {string} str The string containing the pattern.
 * @param {...*} var_args The items to substitute into the pattern.
 * @return {string} A copy of {@code str} in which each occurrence of
 *     {@code %s} has been replaced an argument from {@code var_args}.
 */
goog.string.subs = function(str, var_args) {
  var splitParts = str.split('%s');
  var returnString = '';

  var subsArguments = Array.prototype.slice.call(arguments, 1);
  while (subsArguments.length &&
         // Replace up to the last split part. We are inserting in the
         // positions between split parts.
         splitParts.length > 1) {
    returnString += splitParts.shift() + subsArguments.shift();
  }

  return returnString + splitParts.join('%s'); // Join unused '%s'
};


/**
 * Converts multiple whitespace chars (spaces, non-breaking-spaces, new lines
 * and tabs) to a single space, and strips leading and trailing whitespace.
 * @param {string} str Input string.
 * @return {string} A copy of {@code str} with collapsed whitespace.
 */
goog.string.collapseWhitespace = function(str) {
  // Since IE doesn't include non-breaking-space (0xa0) in their \s character
  // class (as required by section 7.2 of the ECMAScript spec), we explicitly
  // include it in the regexp to enforce consistent cross-browser behavior.
  return str.replace(/[\s\xa0]+/g, ' ').replace(/^\s+|\s+$/g, '');
};


/**
 * Checks if a string is empty or contains only whitespaces.
 * @param {string} str The string to check.
 * @return {boolean} Whether {@code str} is empty or whitespace only.
 */
goog.string.isEmptyOrWhitespace = function(str) {
  // testing length == 0 first is actually slower in all browsers (about the
  // same in Opera).
  // Since IE doesn't include non-breaking-space (0xa0) in their \s character
  // class (as required by section 7.2 of the ECMAScript spec), we explicitly
  // include it in the regexp to enforce consistent cross-browser behavior.
  return /^[\s\xa0]*$/.test(str);
};


/**
 * Checks if a string is empty.
 * @param {string} str The string to check.
 * @return {boolean} Whether {@code str} is empty.
 */
goog.string.isEmptyString = function(str) {
  return str.length == 0;
};


/**
 * Checks if a string is empty or contains only whitespaces.
 *
 * TODO(user): Deprecate this when clients have been switched over to
 * goog.string.isEmptyOrWhitespace.
 *
 * @param {string} str The string to check.
 * @return {boolean} Whether {@code str} is empty or whitespace only.
 */
goog.string.isEmpty = goog.string.isEmptyOrWhitespace;


/**
 * Checks if a string is null, undefined, empty or contains only whitespaces.
 * @param {*} str The string to check.
 * @return {boolean} Whether {@code str} is null, undefined, empty, or
 *     whitespace only.
 * @deprecated Use goog.string.isEmptyOrWhitespace(goog.string.makeSafe(str))
 *     instead.
 */
goog.string.isEmptyOrWhitespaceSafe = function(str) {
  return goog.string.isEmptyOrWhitespace(goog.string.makeSafe(str));
};


/**
 * Checks if a string is null, undefined, empty or contains only whitespaces.
 *
 * TODO(user): Deprecate this when clients have been switched over to
 * goog.string.isEmptyOrWhitespaceSafe.
 *
 * @param {*} str The string to check.
 * @return {boolean} Whether {@code str} is null, undefined, empty, or
 *     whitespace only.
 */
goog.string.isEmptySafe = goog.string.isEmptyOrWhitespaceSafe;


/**
 * Checks if a string is all breaking whitespace.
 * @param {string} str The string to check.
 * @return {boolean} Whether the string is all breaking whitespace.
 */
goog.string.isBreakingWhitespace = function(str) {
  return !/[^\t\n\r ]/.test(str);
};


/**
 * Checks if a string contains all letters.
 * @param {string} str string to check.
 * @return {boolean} True if {@code str} consists entirely of letters.
 */
goog.string.isAlpha = function(str) {
  return !/[^a-zA-Z]/.test(str);
};


/**
 * Checks if a string contains only numbers.
 * @param {*} str string to check. If not a string, it will be
 *     casted to one.
 * @return {boolean} True if {@code str} is numeric.
 */
goog.string.isNumeric = function(str) {
  return !/[^0-9]/.test(str);
};


/**
 * Checks if a string contains only numbers or letters.
 * @param {string} str string to check.
 * @return {boolean} True if {@code str} is alphanumeric.
 */
goog.string.isAlphaNumeric = function(str) {
  return !/[^a-zA-Z0-9]/.test(str);
};


/**
 * Checks if a character is a space character.
 * @param {string} ch Character to check.
 * @return {boolean} True if {@code ch} is a space.
 */
goog.string.isSpace = function(ch) {
  return ch == ' ';
};


/**
 * Checks if a character is a valid unicode character.
 * @param {string} ch Character to check.
 * @return {boolean} True if {@code ch} is a valid unicode character.
 */
goog.string.isUnicodeChar = function(ch) {
  return ch.length == 1 && ch >= ' ' && ch <= '~' ||
         ch >= '\u0080' && ch <= '\uFFFD';
};


/**
 * Takes a string and replaces newlines with a space. Multiple lines are
 * replaced with a single space.
 * @param {string} str The string from which to strip newlines.
 * @return {string} A copy of {@code str} stripped of newlines.
 */
goog.string.stripNewlines = function(str) {
  return str.replace(/(\r\n|\r|\n)+/g, ' ');
};


/**
 * Replaces Windows and Mac new lines with unix style: \r or \r\n with \n.
 * @param {string} str The string to in which to canonicalize newlines.
 * @return {string} {@code str} A copy of {@code} with canonicalized newlines.
 */
goog.string.canonicalizeNewlines = function(str) {
  return str.replace(/(\r\n|\r|\n)/g, '\n');
};


/**
 * Normalizes whitespace in a string, replacing all whitespace chars with
 * a space.
 * @param {string} str The string in which to normalize whitespace.
 * @return {string} A copy of {@code str} with all whitespace normalized.
 */
goog.string.normalizeWhitespace = function(str) {
  return str.replace(/\xa0|\s/g, ' ');
};


/**
 * Normalizes spaces in a string, replacing all consecutive spaces and tabs
 * with a single space. Replaces non-breaking space with a space.
 * @param {string} str The string in which to normalize spaces.
 * @return {string} A copy of {@code str} with all consecutive spaces and tabs
 *    replaced with a single space.
 */
goog.string.normalizeSpaces = function(str) {
  return str.replace(/\xa0|[ \t]+/g, ' ');
};


/**
 * Removes the breaking spaces from the left and right of the string and
 * collapses the sequences of breaking spaces in the middle into single spaces.
 * The original and the result strings render the same way in HTML.
 * @param {string} str A string in which to collapse spaces.
 * @return {string} Copy of the string with normalized breaking spaces.
 */
goog.string.collapseBreakingSpaces = function(str) {
  return str.replace(/[\t\r\n ]+/g, ' ').replace(
      /^[\t\r\n ]+|[\t\r\n ]+$/g, '');
};


/**
 * Trims white spaces to the left and right of a string.
 * @param {string} str The string to trim.
 * @return {string} A trimmed copy of {@code str}.
 */
goog.string.trim = (goog.TRUSTED_SITE && String.prototype.trim) ?
    function(str) {
      return str.trim();
    } :
    function(str) {
      // Since IE doesn't include non-breaking-space (0xa0) in their \s
      // character class (as required by section 7.2 of the ECMAScript spec),
      // we explicitly include it in the regexp to enforce consistent
      // cross-browser behavior.
      return str.replace(/^[\s\xa0]+|[\s\xa0]+$/g, '');
    };


/**
 * Trims whitespaces at the left end of a string.
 * @param {string} str The string to left trim.
 * @return {string} A trimmed copy of {@code str}.
 */
goog.string.trimLeft = function(str) {
  // Since IE doesn't include non-breaking-space (0xa0) in their \s character
  // class (as required by section 7.2 of the ECMAScript spec), we explicitly
  // include it in the regexp to enforce consistent cross-browser behavior.
  return str.replace(/^[\s\xa0]+/, '');
};


/**
 * Trims whitespaces at the right end of a string.
 * @param {string} str The string to right trim.
 * @return {string} A trimmed copy of {@code str}.
 */
goog.string.trimRight = function(str) {
  // Since IE doesn't include non-breaking-space (0xa0) in their \s character
  // class (as required by section 7.2 of the ECMAScript spec), we explicitly
  // include it in the regexp to enforce consistent cross-browser behavior.
  return str.replace(/[\s\xa0]+$/, '');
};


/**
 * A string comparator that ignores case.
 * -1 = str1 less than str2
 *  0 = str1 equals str2
 *  1 = str1 greater than str2
 *
 * @param {string} str1 The string to compare.
 * @param {string} str2 The string to compare {@code str1} to.
 * @return {number} The comparator result, as described above.
 */
goog.string.caseInsensitiveCompare = function(str1, str2) {
  var test1 = String(str1).toLowerCase();
  var test2 = String(str2).toLowerCase();

  if (test1 < test2) {
    return -1;
  } else if (test1 == test2) {
    return 0;
  } else {
    return 1;
  }
};


/**
 * Regular expression used for splitting a string into substrings of fractional
 * numbers, integers, and non-numeric characters.
 * @type {RegExp}
 * @private
 */
goog.string.numerateCompareRegExp_ = /(\.\d+)|(\d+)|(\D+)/g;


/**
 * String comparison function that handles numbers in a way humans might expect.
 * Using this function, the string "File 2.jpg" sorts before "File 10.jpg". The
 * comparison is mostly case-insensitive, though strings that are identical
 * except for case are sorted with the upper-case strings before lower-case.
 *
 * This comparison function is significantly slower (about 500x) than either
 * the default or the case-insensitive compare. It should not be used in
 * time-critical code, but should be fast enough to sort several hundred short
 * strings (like filenames) with a reasonable delay.
 *
 * @param {string} str1 The string to compare in a numerically sensitive way.
 * @param {string} str2 The string to compare {@code str1} to.
 * @return {number} less than 0 if str1 < str2, 0 if str1 == str2, greater than
 *     0 if str1 > str2.
 */
goog.string.numerateCompare = function(str1, str2) {
  if (str1 == str2) {
    return 0;
  }
  if (!str1) {
    return -1;
  }
  if (!str2) {
    return 1;
  }

  // Using match to split the entire string ahead of time turns out to be faster
  // for most inputs than using RegExp.exec or iterating over each character.
  var tokens1 = str1.toLowerCase().match(goog.string.numerateCompareRegExp_);
  var tokens2 = str2.toLowerCase().match(goog.string.numerateCompareRegExp_);

  var count = Math.min(tokens1.length, tokens2.length);

  for (var i = 0; i < count; i++) {
    var a = tokens1[i];
    var b = tokens2[i];

    // Compare pairs of tokens, returning if one token sorts before the other.
    if (a != b) {

      // Only if both tokens are integers is a special comparison required.
      // Decimal numbers are sorted as strings (e.g., '.09' < '.1').
      var num1 = parseInt(a, 10);
      if (!isNaN(num1)) {
        var num2 = parseInt(b, 10);
        if (!isNaN(num2) && num1 - num2) {
          return num1 - num2;
        }
      }
      return a < b ? -1 : 1;
    }
  }

  // If one string is a substring of the other, the shorter string sorts first.
  if (tokens1.length != tokens2.length) {
    return tokens1.length - tokens2.length;
  }

  // The two strings must be equivalent except for case (perfect equality is
  // tested at the head of the function.) Revert to default ASCII-betical string
  // comparison to stablize the sort.
  return str1 < str2 ? -1 : 1;
};


/**
 * URL-encodes a string
 * @param {*} str The string to url-encode.
 * @return {string} An encoded copy of {@code str} that is safe for urls.
 *     Note that '#', ':', and other characters used to delimit portions
 *     of URLs *will* be encoded.
 */
goog.string.urlEncode = function(str) {
  return encodeURIComponent(String(str));
};


/**
 * URL-decodes the string. We need to specially handle '+'s because
 * the javascript library doesn't convert them to spaces.
 * @param {string} str The string to url decode.
 * @return {string} The decoded {@code str}.
 */
goog.string.urlDecode = function(str) {
  return decodeURIComponent(str.replace(/\+/g, ' '));
};


/**
 * Converts \n to <br>s or <br />s.
 * @param {string} str The string in which to convert newlines.
 * @param {boolean=} opt_xml Whether to use XML compatible tags.
 * @return {string} A copy of {@code str} with converted newlines.
 */
goog.string.newLineToBr = function(str, opt_xml) {
  return str.replace(/(\r\n|\r|\n)/g, opt_xml ? '<br />' : '<br>');
};


/**
 * Escapes double quote '"' and single quote '\'' characters in addition to
 * '&', '<', and '>' so that a string can be included in an HTML tag attribute
 * value within double or single quotes.
 *
 * It should be noted that > doesn't need to be escaped for the HTML or XML to
 * be valid, but it has been decided to escape it for consistency with other
 * implementations.
 *
 * With goog.string.DETECT_DOUBLE_ESCAPING, this function escapes also the
 * lowercase letter "e".
 *
 * NOTE(user):
 * HtmlEscape is often called during the generation of large blocks of HTML.
 * Using statics for the regular expressions and strings is an optimization
 * that can more than half the amount of time IE spends in this function for
 * large apps, since strings and regexes both contribute to GC allocations.
 *
 * Testing for the presence of a character before escaping increases the number
 * of function calls, but actually provides a speed increase for the average
 * case -- since the average case often doesn't require the escaping of all 4
 * characters and indexOf() is much cheaper than replace().
 * The worst case does suffer slightly from the additional calls, therefore the
 * opt_isLikelyToContainHtmlChars option has been included for situations
 * where all 4 HTML entities are very likely to be present and need escaping.
 *
 * Some benchmarks (times tended to fluctuate +-0.05ms):
 *                                     FireFox                     IE6
 * (no chars / average (mix of cases) / all 4 chars)
 * no checks                     0.13 / 0.22 / 0.22         0.23 / 0.53 / 0.80
 * indexOf                       0.08 / 0.17 / 0.26         0.22 / 0.54 / 0.84
 * indexOf + re test             0.07 / 0.17 / 0.28         0.19 / 0.50 / 0.85
 *
 * An additional advantage of checking if replace actually needs to be called
 * is a reduction in the number of object allocations, so as the size of the
 * application grows the difference between the various methods would increase.
 *
 * @param {string} str string to be escaped.
 * @param {boolean=} opt_isLikelyToContainHtmlChars Don't perform a check to see
 *     if the character needs replacing - use this option if you expect each of
 *     the characters to appear often. Leave false if you expect few html
 *     characters to occur in your strings, such as if you are escaping HTML.
 * @return {string} An escaped copy of {@code str}.
 */
goog.string.htmlEscape = function(str, opt_isLikelyToContainHtmlChars) {

  if (opt_isLikelyToContainHtmlChars) {
    str = str.replace(goog.string.AMP_RE_, '&amp;')
          .replace(goog.string.LT_RE_, '&lt;')
          .replace(goog.string.GT_RE_, '&gt;')
          .replace(goog.string.QUOT_RE_, '&quot;')
          .replace(goog.string.SINGLE_QUOTE_RE_, '&#39;')
          .replace(goog.string.NULL_RE_, '&#0;');
    if (goog.string.DETECT_DOUBLE_ESCAPING) {
      str = str.replace(goog.string.E_RE_, '&#101;');
    }
    return str;

  } else {
    // quick test helps in the case when there are no chars to replace, in
    // worst case this makes barely a difference to the time taken
    if (!goog.string.ALL_RE_.test(str)) return str;

    // str.indexOf is faster than regex.test in this case
    if (str.indexOf('&') != -1) {
      str = str.replace(goog.string.AMP_RE_, '&amp;');
    }
    if (str.indexOf('<') != -1) {
      str = str.replace(goog.string.LT_RE_, '&lt;');
    }
    if (str.indexOf('>') != -1) {
      str = str.replace(goog.string.GT_RE_, '&gt;');
    }
    if (str.indexOf('"') != -1) {
      str = str.replace(goog.string.QUOT_RE_, '&quot;');
    }
    if (str.indexOf('\'') != -1) {
      str = str.replace(goog.string.SINGLE_QUOTE_RE_, '&#39;');
    }
    if (str.indexOf('\x00') != -1) {
      str = str.replace(goog.string.NULL_RE_, '&#0;');
    }
    if (goog.string.DETECT_DOUBLE_ESCAPING && str.indexOf('e') != -1) {
      str = str.replace(goog.string.E_RE_, '&#101;');
    }
    return str;
  }
};


/**
 * Regular expression that matches an ampersand, for use in escaping.
 * @const {!RegExp}
 * @private
 */
goog.string.AMP_RE_ = /&/g;


/**
 * Regular expression that matches a less than sign, for use in escaping.
 * @const {!RegExp}
 * @private
 */
goog.string.LT_RE_ = /</g;


/**
 * Regular expression that matches a greater than sign, for use in escaping.
 * @const {!RegExp}
 * @private
 */
goog.string.GT_RE_ = />/g;


/**
 * Regular expression that matches a double quote, for use in escaping.
 * @const {!RegExp}
 * @private
 */
goog.string.QUOT_RE_ = /"/g;


/**
 * Regular expression that matches a single quote, for use in escaping.
 * @const {!RegExp}
 * @private
 */
goog.string.SINGLE_QUOTE_RE_ = /'/g;


/**
 * Regular expression that matches null character, for use in escaping.
 * @const {!RegExp}
 * @private
 */
goog.string.NULL_RE_ = /\x00/g;


/**
 * Regular expression that matches a lowercase letter "e", for use in escaping.
 * @const {!RegExp}
 * @private
 */
goog.string.E_RE_ = /e/g;


/**
 * Regular expression that matches any character that needs to be escaped.
 * @const {!RegExp}
 * @private
 */
goog.string.ALL_RE_ = (goog.string.DETECT_DOUBLE_ESCAPING ?
    /[\x00&<>"'e]/ :
    /[\x00&<>"']/);


/**
 * Unescapes an HTML string.
 *
 * @param {string} str The string to unescape.
 * @return {string} An unescaped copy of {@code str}.
 */
goog.string.unescapeEntities = function(str) {
  if (goog.string.contains(str, '&')) {
    // We are careful not to use a DOM if we do not have one or we explicitly
    // requested non-DOM html unescaping.
    if (!goog.string.FORCE_NON_DOM_HTML_UNESCAPING &&
        'document' in goog.global) {
      return goog.string.unescapeEntitiesUsingDom_(str);
    } else {
      // Fall back on pure XML entities
      return goog.string.unescapePureXmlEntities_(str);
    }
  }
  return str;
};


/**
 * Unescapes a HTML string using the provided document.
 *
 * @param {string} str The string to unescape.
 * @param {!Document} document A document to use in escaping the string.
 * @return {string} An unescaped copy of {@code str}.
 */
goog.string.unescapeEntitiesWithDocument = function(str, document) {
  if (goog.string.contains(str, '&')) {
    return goog.string.unescapeEntitiesUsingDom_(str, document);
  }
  return str;
};


/**
 * Unescapes an HTML string using a DOM to resolve non-XML, non-numeric
 * entities. This function is XSS-safe and whitespace-preserving.
 * @private
 * @param {string} str The string to unescape.
 * @param {Document=} opt_document An optional document to use for creating
 *     elements. If this is not specified then the default window.document
 *     will be used.
 * @return {string} The unescaped {@code str} string.
 */
goog.string.unescapeEntitiesUsingDom_ = function(str, opt_document) {
  /** @type {!Object<string, string>} */
  var seen = {'&amp;': '&', '&lt;': '<', '&gt;': '>', '&quot;': '"'};
  var div;
  if (opt_document) {
    div = opt_document.createElement('div');
  } else {
    div = goog.global.document.createElement('div');
  }
  // Match as many valid entity characters as possible. If the actual entity
  // happens to be shorter, it will still work as innerHTML will return the
  // trailing characters unchanged. Since the entity characters do not include
  // open angle bracket, there is no chance of XSS from the innerHTML use.
  // Since no whitespace is passed to innerHTML, whitespace is preserved.
  return str.replace(goog.string.HTML_ENTITY_PATTERN_, function(s, entity) {
    // Check for cached entity.
    var value = seen[s];
    if (value) {
      return value;
    }
    // Check for numeric entity.
    if (entity.charAt(0) == '#') {
      // Prefix with 0 so that hex entities (e.g. &#x10) parse as hex numbers.
      var n = Number('0' + entity.substr(1));
      if (!isNaN(n)) {
        value = String.fromCharCode(n);
      }
    }
    // Fall back to innerHTML otherwise.
    if (!value) {
      // Append a non-entity character to avoid a bug in Webkit that parses
      // an invalid entity at the end of innerHTML text as the empty string.
      div.innerHTML = s + ' ';
      // Then remove the trailing character from the result.
      value = div.firstChild.nodeValue.slice(0, -1);
    }
    // Cache and return.
    return seen[s] = value;
  });
};


/**
 * Unescapes XML entities.
 * @private
 * @param {string} str The string to unescape.
 * @return {string} An unescaped copy of {@code str}.
 */
goog.string.unescapePureXmlEntities_ = function(str) {
  return str.replace(/&([^;]+);/g, function(s, entity) {
    switch (entity) {
      case 'amp':
        return '&';
      case 'lt':
        return '<';
      case 'gt':
        return '>';
      case 'quot':
        return '"';
      default:
        if (entity.charAt(0) == '#') {
          // Prefix with 0 so that hex entities (e.g. &#x10) parse as hex.
          var n = Number('0' + entity.substr(1));
          if (!isNaN(n)) {
            return String.fromCharCode(n);
          }
        }
        // For invalid entities we just return the entity
        return s;
    }
  });
};


/**
 * Regular expression that matches an HTML entity.
 * See also HTML5: Tokenization / Tokenizing character references.
 * @private
 * @type {!RegExp}
 */
goog.string.HTML_ENTITY_PATTERN_ = /&([^;\s<&]+);?/g;


/**
 * Do escaping of whitespace to preserve spatial formatting. We use character
 * entity #160 to make it safer for xml.
 * @param {string} str The string in which to escape whitespace.
 * @param {boolean=} opt_xml Whether to use XML compatible tags.
 * @return {string} An escaped copy of {@code str}.
 */
goog.string.whitespaceEscape = function(str, opt_xml) {
  // This doesn't use goog.string.preserveSpaces for backwards compatibility.
  return goog.string.newLineToBr(str.replace(/  /g, ' &#160;'), opt_xml);
};


/**
 * Preserve spaces that would be otherwise collapsed in HTML by replacing them
 * with non-breaking space Unicode characters.
 * @param {string} str The string in which to preserve whitespace.
 * @return {string} A copy of {@code str} with preserved whitespace.
 */
goog.string.preserveSpaces = function(str) {
  return str.replace(/(^|[\n ]) /g, '$1' + goog.string.Unicode.NBSP);
};


/**
 * Strip quote characters around a string.  The second argument is a string of
 * characters to treat as quotes.  This can be a single character or a string of
 * multiple character and in that case each of those are treated as possible
 * quote characters. For example:
 *
 * <pre>
 * goog.string.stripQuotes('"abc"', '"`') --> 'abc'
 * goog.string.stripQuotes('`abc`', '"`') --> 'abc'
 * </pre>
 *
 * @param {string} str The string to strip.
 * @param {string} quoteChars The quote characters to strip.
 * @return {string} A copy of {@code str} without the quotes.
 */
goog.string.stripQuotes = function(str, quoteChars) {
  var length = quoteChars.length;
  for (var i = 0; i < length; i++) {
    var quoteChar = length == 1 ? quoteChars : quoteChars.charAt(i);
    if (str.charAt(0) == quoteChar && str.charAt(str.length - 1) == quoteChar) {
      return str.substring(1, str.length - 1);
    }
  }
  return str;
};


/**
 * Truncates a string to a certain length and adds '...' if necessary.  The
 * length also accounts for the ellipsis, so a maximum length of 10 and a string
 * 'Hello World!' produces 'Hello W...'.
 * @param {string} str The string to truncate.
 * @param {number} chars Max number of characters.
 * @param {boolean=} opt_protectEscapedCharacters Whether to protect escaped
 *     characters from being cut off in the middle.
 * @return {string} The truncated {@code str} string.
 */
goog.string.truncate = function(str, chars, opt_protectEscapedCharacters) {
  if (opt_protectEscapedCharacters) {
    str = goog.string.unescapeEntities(str);
  }

  if (str.length > chars) {
    str = str.substring(0, chars - 3) + '...';
  }

  if (opt_protectEscapedCharacters) {
    str = goog.string.htmlEscape(str);
  }

  return str;
};


/**
 * Truncate a string in the middle, adding "..." if necessary,
 * and favoring the beginning of the string.
 * @param {string} str The string to truncate the middle of.
 * @param {number} chars Max number of characters.
 * @param {boolean=} opt_protectEscapedCharacters Whether to protect escaped
 *     characters from being cutoff in the middle.
 * @param {number=} opt_trailingChars Optional number of trailing characters to
 *     leave at the end of the string, instead of truncating as close to the
 *     middle as possible.
 * @return {string} A truncated copy of {@code str}.
 */
goog.string.truncateMiddle = function(str, chars,
    opt_protectEscapedCharacters, opt_trailingChars) {
  if (opt_protectEscapedCharacters) {
    str = goog.string.unescapeEntities(str);
  }

  if (opt_trailingChars && str.length > chars) {
    if (opt_trailingChars > chars) {
      opt_trailingChars = chars;
    }
    var endPoint = str.length - opt_trailingChars;
    var startPoint = chars - opt_trailingChars;
    str = str.substring(0, startPoint) + '...' + str.substring(endPoint);
  } else if (str.length > chars) {
    // Favor the beginning of the string:
    var half = Math.floor(chars / 2);
    var endPos = str.length - half;
    half += chars % 2;
    str = str.substring(0, half) + '...' + str.substring(endPos);
  }

  if (opt_protectEscapedCharacters) {
    str = goog.string.htmlEscape(str);
  }

  return str;
};


/**
 * Special chars that need to be escaped for goog.string.quote.
 * @private {!Object<string, string>}
 */
goog.string.specialEscapeChars_ = {
  '\0': '\\0',
  '\b': '\\b',
  '\f': '\\f',
  '\n': '\\n',
  '\r': '\\r',
  '\t': '\\t',
  '\x0B': '\\x0B', // '\v' is not supported in JScript
  '"': '\\"',
  '\\': '\\\\'
};


/**
 * Character mappings used internally for goog.string.escapeChar.
 * @private {!Object<string, string>}
 */
goog.string.jsEscapeCache_ = {
  '\'': '\\\''
};


/**
 * Encloses a string in double quotes and escapes characters so that the
 * string is a valid JS string.
 * @param {string} s The string to quote.
 * @return {string} A copy of {@code s} surrounded by double quotes.
 */
goog.string.quote = function(s) {
  s = String(s);
  if (s.quote) {
    return s.quote();
  } else {
    var sb = ['"'];
    for (var i = 0; i < s.length; i++) {
      var ch = s.charAt(i);
      var cc = ch.charCodeAt(0);
      sb[i + 1] = goog.string.specialEscapeChars_[ch] ||
          ((cc > 31 && cc < 127) ? ch : goog.string.escapeChar(ch));
    }
    sb.push('"');
    return sb.join('');
  }
};


/**
 * Takes a string and returns the escaped string for that character.
 * @param {string} str The string to escape.
 * @return {string} An escaped string representing {@code str}.
 */
goog.string.escapeString = function(str) {
  var sb = [];
  for (var i = 0; i < str.length; i++) {
    sb[i] = goog.string.escapeChar(str.charAt(i));
  }
  return sb.join('');
};


/**
 * Takes a character and returns the escaped string for that character. For
 * example escapeChar(String.fromCharCode(15)) -> "\\x0E".
 * @param {string} c The character to escape.
 * @return {string} An escaped string representing {@code c}.
 */
goog.string.escapeChar = function(c) {
  if (c in goog.string.jsEscapeCache_) {
    return goog.string.jsEscapeCache_[c];
  }

  if (c in goog.string.specialEscapeChars_) {
    return goog.string.jsEscapeCache_[c] = goog.string.specialEscapeChars_[c];
  }

  var rv = c;
  var cc = c.charCodeAt(0);
  if (cc > 31 && cc < 127) {
    rv = c;
  } else {
    // tab is 9 but handled above
    if (cc < 256) {
      rv = '\\x';
      if (cc < 16 || cc > 256) {
        rv += '0';
      }
    } else {
      rv = '\\u';
      if (cc < 4096) { // \u1000
        rv += '0';
      }
    }
    rv += cc.toString(16).toUpperCase();
  }

  return goog.string.jsEscapeCache_[c] = rv;
};


/**
 * Determines whether a string contains a substring.
 * @param {string} str The string to search.
 * @param {string} subString The substring to search for.
 * @return {boolean} Whether {@code str} contains {@code subString}.
 */
goog.string.contains = function(str, subString) {
  return str.indexOf(subString) != -1;
};


/**
 * Determines whether a string contains a substring, ignoring case.
 * @param {string} str The string to search.
 * @param {string} subString The substring to search for.
 * @return {boolean} Whether {@code str} contains {@code subString}.
 */
goog.string.caseInsensitiveContains = function(str, subString) {
  return goog.string.contains(str.toLowerCase(), subString.toLowerCase());
};


/**
 * Returns the non-overlapping occurrences of ss in s.
 * If either s or ss evalutes to false, then returns zero.
 * @param {string} s The string to look in.
 * @param {string} ss The string to look for.
 * @return {number} Number of occurrences of ss in s.
 */
goog.string.countOf = function(s, ss) {
  return s && ss ? s.split(ss).length - 1 : 0;
};


/**
 * Removes a substring of a specified length at a specific
 * index in a string.
 * @param {string} s The base string from which to remove.
 * @param {number} index The index at which to remove the substring.
 * @param {number} stringLength The length of the substring to remove.
 * @return {string} A copy of {@code s} with the substring removed or the full
 *     string if nothing is removed or the input is invalid.
 */
goog.string.removeAt = function(s, index, stringLength) {
  var resultStr = s;
  // If the index is greater or equal to 0 then remove substring
  if (index >= 0 && index < s.length && stringLength > 0) {
    resultStr = s.substr(0, index) +
        s.substr(index + stringLength, s.length - index - stringLength);
  }
  return resultStr;
};


/**
 *  Removes the first occurrence of a substring from a string.
 *  @param {string} s The base string from which to remove.
 *  @param {string} ss The string to remove.
 *  @return {string} A copy of {@code s} with {@code ss} removed or the full
 *      string if nothing is removed.
 */
goog.string.remove = function(s, ss) {
  var re = new RegExp(goog.string.regExpEscape(ss), '');
  return s.replace(re, '');
};


/**
 *  Removes all occurrences of a substring from a string.
 *  @param {string} s The base string from which to remove.
 *  @param {string} ss The string to remove.
 *  @return {string} A copy of {@code s} with {@code ss} removed or the full
 *      string if nothing is removed.
 */
goog.string.removeAll = function(s, ss) {
  var re = new RegExp(goog.string.regExpEscape(ss), 'g');
  return s.replace(re, '');
};


/**
 * Escapes characters in the string that are not safe to use in a RegExp.
 * @param {*} s The string to escape. If not a string, it will be casted
 *     to one.
 * @return {string} A RegExp safe, escaped copy of {@code s}.
 */
goog.string.regExpEscape = function(s) {
  return String(s).replace(/([-()\[\]{}+?*.$\^|,:#<!\\])/g, '\\$1').
      replace(/\x08/g, '\\x08');
};


/**
 * Repeats a string n times.
 * @param {string} string The string to repeat.
 * @param {number} length The number of times to repeat.
 * @return {string} A string containing {@code length} repetitions of
 *     {@code string}.
 */
goog.string.repeat = (String.prototype.repeat) ?
    function(string, length) {
      // The native method is over 100 times faster than the alternative.
      return string.repeat(length);
    } :
    function(string, length) {
      return new Array(length + 1).join(string);
    };


/**
 * Pads number to given length and optionally rounds it to a given precision.
 * For example:
 * <pre>padNumber(1.25, 2, 3) -> '01.250'
 * padNumber(1.25, 2) -> '01.25'
 * padNumber(1.25, 2, 1) -> '01.3'
 * padNumber(1.25, 0) -> '1.25'</pre>
 *
 * @param {number} num The number to pad.
 * @param {number} length The desired length.
 * @param {number=} opt_precision The desired precision.
 * @return {string} {@code num} as a string with the given options.
 */
goog.string.padNumber = function(num, length, opt_precision) {
  var s = goog.isDef(opt_precision) ? num.toFixed(opt_precision) : String(num);
  var index = s.indexOf('.');
  if (index == -1) {
    index = s.length;
  }
  return goog.string.repeat('0', Math.max(0, length - index)) + s;
};


/**
 * Returns a string representation of the given object, with
 * null and undefined being returned as the empty string.
 *
 * @param {*} obj The object to convert.
 * @return {string} A string representation of the {@code obj}.
 */
goog.string.makeSafe = function(obj) {
  return obj == null ? '' : String(obj);
};


/**
 * Concatenates string expressions. This is useful
 * since some browsers are very inefficient when it comes to using plus to
 * concat strings. Be careful when using null and undefined here since
 * these will not be included in the result. If you need to represent these
 * be sure to cast the argument to a String first.
 * For example:
 * <pre>buildString('a', 'b', 'c', 'd') -> 'abcd'
 * buildString(null, undefined) -> ''
 * </pre>
 * @param {...*} var_args A list of strings to concatenate. If not a string,
 *     it will be casted to one.
 * @return {string} The concatenation of {@code var_args}.
 */
goog.string.buildString = function(var_args) {
  return Array.prototype.join.call(arguments, '');
};


/**
 * Returns a string with at least 64-bits of randomness.
 *
 * Doesn't trust Javascript's random function entirely. Uses a combination of
 * random and current timestamp, and then encodes the string in base-36 to
 * make it shorter.
 *
 * @return {string} A random string, e.g. sn1s7vb4gcic.
 */
goog.string.getRandomString = function() {
  var x = 2147483648;
  return Math.floor(Math.random() * x).toString(36) +
         Math.abs(Math.floor(Math.random() * x) ^ goog.now()).toString(36);
};


/**
 * Compares two version numbers.
 *
 * @param {string|number} version1 Version of first item.
 * @param {string|number} version2 Version of second item.
 *
 * @return {number}  1 if {@code version1} is higher.
 *                   0 if arguments are equal.
 *                  -1 if {@code version2} is higher.
 */
goog.string.compareVersions = function(version1, version2) {
  var order = 0;
  // Trim leading and trailing whitespace and split the versions into
  // subversions.
  var v1Subs = goog.string.trim(String(version1)).split('.');
  var v2Subs = goog.string.trim(String(version2)).split('.');
  var subCount = Math.max(v1Subs.length, v2Subs.length);

  // Iterate over the subversions, as long as they appear to be equivalent.
  for (var subIdx = 0; order == 0 && subIdx < subCount; subIdx++) {
    var v1Sub = v1Subs[subIdx] || '';
    var v2Sub = v2Subs[subIdx] || '';

    // Split the subversions into pairs of numbers and qualifiers (like 'b').
    // Two different RegExp objects are needed because they are both using
    // the 'g' flag.
    var v1CompParser = new RegExp('(\\d*)(\\D*)', 'g');
    var v2CompParser = new RegExp('(\\d*)(\\D*)', 'g');
    do {
      var v1Comp = v1CompParser.exec(v1Sub) || ['', '', ''];
      var v2Comp = v2CompParser.exec(v2Sub) || ['', '', ''];
      // Break if there are no more matches.
      if (v1Comp[0].length == 0 && v2Comp[0].length == 0) {
        break;
      }

      // Parse the numeric part of the subversion. A missing number is
      // equivalent to 0.
      var v1CompNum = v1Comp[1].length == 0 ? 0 : parseInt(v1Comp[1], 10);
      var v2CompNum = v2Comp[1].length == 0 ? 0 : parseInt(v2Comp[1], 10);

      // Compare the subversion components. The number has the highest
      // precedence. Next, if the numbers are equal, a subversion without any
      // qualifier is always higher than a subversion with any qualifier. Next,
      // the qualifiers are compared as strings.
      order = goog.string.compareElements_(v1CompNum, v2CompNum) ||
          goog.string.compareElements_(v1Comp[2].length == 0,
              v2Comp[2].length == 0) ||
          goog.string.compareElements_(v1Comp[2], v2Comp[2]);
      // Stop as soon as an inequality is discovered.
    } while (order == 0);
  }

  return order;
};


/**
 * Compares elements of a version number.
 *
 * @param {string|number|boolean} left An element from a version number.
 * @param {string|number|boolean} right An element from a version number.
 *
 * @return {number}  1 if {@code left} is higher.
 *                   0 if arguments are equal.
 *                  -1 if {@code right} is higher.
 * @private
 */
goog.string.compareElements_ = function(left, right) {
  if (left < right) {
    return -1;
  } else if (left > right) {
    return 1;
  }
  return 0;
};


/**
 * String hash function similar to java.lang.String.hashCode().
 * The hash code for a string is computed as
 * s[0] * 31 ^ (n - 1) + s[1] * 31 ^ (n - 2) + ... + s[n - 1],
 * where s[i] is the ith character of the string and n is the length of
 * the string. We mod the result to make it between 0 (inclusive) and 2^32
 * (exclusive).
 * @param {string} str A string.
 * @return {number} Hash value for {@code str}, between 0 (inclusive) and 2^32
 *  (exclusive). The empty string returns 0.
 */
goog.string.hashCode = function(str) {
  var result = 0;
  for (var i = 0; i < str.length; ++i) {
    // Normalize to 4 byte range, 0 ... 2^32.
    result = (31 * result + str.charCodeAt(i)) >>> 0;
  }
  return result;
};


/**
 * The most recent unique ID. |0 is equivalent to Math.floor in this case.
 * @type {number}
 * @private
 */
goog.string.uniqueStringCounter_ = Math.random() * 0x80000000 | 0;


/**
 * Generates and returns a string which is unique in the current document.
 * This is useful, for example, to create unique IDs for DOM elements.
 * @return {string} A unique id.
 */
goog.string.createUniqueString = function() {
  return 'goog_' + goog.string.uniqueStringCounter_++;
};


/**
 * Converts the supplied string to a number, which may be Infinity or NaN.
 * This function strips whitespace: (toNumber(' 123') === 123)
 * This function accepts scientific notation: (toNumber('1e1') === 10)
 *
 * This is better than Javascript's built-in conversions because, sadly:
 *     (Number(' ') === 0) and (parseFloat('123a') === 123)
 *
 * @param {string} str The string to convert.
 * @return {number} The number the supplied string represents, or NaN.
 */
goog.string.toNumber = function(str) {
  var num = Number(str);
  if (num == 0 && goog.string.isEmptyOrWhitespace(str)) {
    return NaN;
  }
  return num;
};


/**
 * Returns whether the given string is lower camel case (e.g. "isFooBar").
 *
 * Note that this assumes the string is entirely letters.
 * @see http://en.wikipedia.org/wiki/CamelCase#Variations_and_synonyms
 *
 * @param {string} str String to test.
 * @return {boolean} Whether the string is lower camel case.
 */
goog.string.isLowerCamelCase = function(str) {
  return /^[a-z]+([A-Z][a-z]*)*$/.test(str);
};


/**
 * Returns whether the given string is upper camel case (e.g. "FooBarBaz").
 *
 * Note that this assumes the string is entirely letters.
 * @see http://en.wikipedia.org/wiki/CamelCase#Variations_and_synonyms
 *
 * @param {string} str String to test.
 * @return {boolean} Whether the string is upper camel case.
 */
goog.string.isUpperCamelCase = function(str) {
  return /^([A-Z][a-z]*)+$/.test(str);
};


/**
 * Converts a string from selector-case to camelCase (e.g. from
 * "multi-part-string" to "multiPartString"), useful for converting
 * CSS selectors and HTML dataset keys to their equivalent JS properties.
 * @param {string} str The string in selector-case form.
 * @return {string} The string in camelCase form.
 */
goog.string.toCamelCase = function(str) {
  return String(str).replace(/\-([a-z])/g, function(all, match) {
    return match.toUpperCase();
  });
};


/**
 * Converts a string from camelCase to selector-case (e.g. from
 * "multiPartString" to "multi-part-string"), useful for converting JS
 * style and dataset properties to equivalent CSS selectors and HTML keys.
 * @param {string} str The string in camelCase form.
 * @return {string} The string in selector-case form.
 */
goog.string.toSelectorCase = function(str) {
  return String(str).replace(/([A-Z])/g, '-$1').toLowerCase();
};


/**
 * Converts a string into TitleCase. First character of the string is always
 * capitalized in addition to the first letter of every subsequent word.
 * Words are delimited by one or more whitespaces by default. Custom delimiters
 * can optionally be specified to replace the default, which doesn't preserve
 * whitespace delimiters and instead must be explicitly included if needed.
 *
 * Default delimiter => " ":
 *    goog.string.toTitleCase('oneTwoThree')    => 'OneTwoThree'
 *    goog.string.toTitleCase('one two three')  => 'One Two Three'
 *    goog.string.toTitleCase('  one   two   ') => '  One   Two   '
 *    goog.string.toTitleCase('one_two_three')  => 'One_two_three'
 *    goog.string.toTitleCase('one-two-three')  => 'One-two-three'
 *
 * Custom delimiter => "_-.":
 *    goog.string.toTitleCase('oneTwoThree', '_-.')       => 'OneTwoThree'
 *    goog.string.toTitleCase('one two three', '_-.')     => 'One two three'
 *    goog.string.toTitleCase('  one   two   ', '_-.')    => '  one   two   '
 *    goog.string.toTitleCase('one_two_three', '_-.')     => 'One_Two_Three'
 *    goog.string.toTitleCase('one-two-three', '_-.')     => 'One-Two-Three'
 *    goog.string.toTitleCase('one...two...three', '_-.') => 'One...Two...Three'
 *    goog.string.toTitleCase('one. two. three', '_-.')   => 'One. two. three'
 *    goog.string.toTitleCase('one-two.three', '_-.')     => 'One-Two.Three'
 *
 * @param {string} str String value in camelCase form.
 * @param {string=} opt_delimiters Custom delimiter character set used to
 *      distinguish words in the string value. Each character represents a
 *      single delimiter. When provided, default whitespace delimiter is
 *      overridden and must be explicitly included if needed.
 * @return {string} String value in TitleCase form.
 */
goog.string.toTitleCase = function(str, opt_delimiters) {
  var delimiters = goog.isString(opt_delimiters) ?
      goog.string.regExpEscape(opt_delimiters) : '\\s';

  // For IE8, we need to prevent using an empty character set. Otherwise,
  // incorrect matching will occur.
  delimiters = delimiters ? '|[' + delimiters + ']+' : '';

  var regexp = new RegExp('(^' + delimiters + ')([a-z])', 'g');
  return str.replace(regexp, function(all, p1, p2) {
    return p1 + p2.toUpperCase();
  });
};


/**
 * Capitalizes a string, i.e. converts the first letter to uppercase
 * and all other letters to lowercase, e.g.:
 *
 * goog.string.capitalize('one')     => 'One'
 * goog.string.capitalize('ONE')     => 'One'
 * goog.string.capitalize('one two') => 'One two'
 *
 * Note that this function does not trim initial whitespace.
 *
 * @param {string} str String value to capitalize.
 * @return {string} String value with first letter in uppercase.
 */
goog.string.capitalize = function(str) {
  return String(str.charAt(0)).toUpperCase() +
      String(str.substr(1)).toLowerCase();
};


/**
 * Parse a string in decimal or hexidecimal ('0xFFFF') form.
 *
 * To parse a particular radix, please use parseInt(string, radix) directly. See
 * https://developer.mozilla.org/en/JavaScript/Reference/Global_Objects/parseInt
 *
 * This is a wrapper for the built-in parseInt function that will only parse
 * numbers as base 10 or base 16.  Some JS implementations assume strings
 * starting with "0" are intended to be octal. ES3 allowed but discouraged
 * this behavior. ES5 forbids it.  This function emulates the ES5 behavior.
 *
 * For more information, see Mozilla JS Reference: http://goo.gl/8RiFj
 *
 * @param {string|number|null|undefined} value The value to be parsed.
 * @return {number} The number, parsed. If the string failed to parse, this
 *     will be NaN.
 */
goog.string.parseInt = function(value) {
  // Force finite numbers to strings.
  if (isFinite(value)) {
    value = String(value);
  }

  if (goog.isString(value)) {
    // If the string starts with '0x' or '-0x', parse as hex.
    return /^\s*-?0x/i.test(value) ?
        parseInt(value, 16) : parseInt(value, 10);
  }

  return NaN;
};


/**
 * Splits a string on a separator a limited number of times.
 *
 * This implementation is more similar to Python or Java, where the limit
 * parameter specifies the maximum number of splits rather than truncating
 * the number of results.
 *
 * See http://docs.python.org/2/library/stdtypes.html#str.split
 * See JavaDoc: http://goo.gl/F2AsY
 * See Mozilla reference: http://goo.gl/dZdZs
 *
 * @param {string} str String to split.
 * @param {string} separator The separator.
 * @param {number} limit The limit to the number of splits. The resulting array
 *     will have a maximum length of limit+1.  Negative numbers are the same
 *     as zero.
 * @return {!Array<string>} The string, split.
 */

goog.string.splitLimit = function(str, separator, limit) {
  var parts = str.split(separator);
  var returnVal = [];

  // Only continue doing this while we haven't hit the limit and we have
  // parts left.
  while (limit > 0 && parts.length) {
    returnVal.push(parts.shift());
    limit--;
  }

  // If there are remaining parts, append them to the end.
  if (parts.length) {
    returnVal.push(parts.join(separator));
  }

  return returnVal;
};


/**
 * Computes the Levenshtein edit distance between two strings.
 * @param {string} a
 * @param {string} b
 * @return {number} The edit distance between the two strings.
 */
goog.string.editDistance = function(a, b) {
  var v0 = [];
  var v1 = [];

  if (a == b) {
    return 0;
  }

  if (!a.length || !b.length) {
    return Math.max(a.length, b.length);
  }

  for (var i = 0; i < b.length + 1; i++) {
    v0[i] = i;
  }

  for (var i = 0; i < a.length; i++) {
    v1[0] = i + 1;

    for (var j = 0; j < b.length; j++) {
      var cost = a[i] != b[j];
      // Cost for the substring is the minimum of adding one character, removing
      // one character, or a swap.
      v1[j + 1] = Math.min(v1[j] + 1, v0[j + 1] + 1, v0[j] + cost);
    }

    for (var j = 0; j < v0.length; j++) {
      v0[j] = v1[j];
    }
  }

  return v1[b.length];
};
// Copyright 2006 The Closure Library Authors. All Rights Reserved.
//
// Licensed under the Apache License, Version 2.0 (the "License");
// you may not use this file except in compliance with the License.
// You may obtain a copy of the License at
//
//      http://www.apache.org/licenses/LICENSE-2.0
//
// Unless required by applicable law or agreed to in writing, software
// distributed under the License is distributed on an "AS-IS" BASIS,
// WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
// See the License for the specific language governing permissions and
// limitations under the License.

/**
 * @fileoverview Utility for fast string concatenation.
 *
 * Utility class to facilitate string concatenation.
 *
 * @param {*=} opt_a1 Optional first initial item to append.
 * @param {...*} var_args Other initial items to
 *     append, e.g., new goog.string.StringBuffer('foo', 'bar').
 * @constructor
 */
goog.string.StringBuffer = function(opt_a1, var_args) {
  if (opt_a1 != null) {
    this.append.apply(this, arguments);
  }
};


/**
 * Internal buffer for the string to be concatenated.
 * @type {string}
 * @private
 */
goog.string.StringBuffer.prototype.buffer_ = '';


/**
 * Sets the contents of the string buffer object, replacing what's currently
 * there.
 *
 * @param {*} s String to set.
 */
goog.string.StringBuffer.prototype.set = function(s) {
  this.buffer_ = '' + s;
};


/**
 * Appends one or more items to the buffer.
 *
 * Calling this with null, undefined, or empty arguments is an error.
 *
 * @param {*} a1 Required first string.
 * @param {*=} opt_a2 Optional second string.
 * @param {...*} var_args Other items to append,
 *     e.g., sb.append('foo', 'bar', 'baz').
 * @return {!goog.string.StringBuffer} This same StringBuffer object.
 * @suppress {duplicate}
 */
goog.string.StringBuffer.prototype.append = function(a1, opt_a2, var_args) {
  // Use a1 directly to avoid arguments instantiation for single-arg case.
  this.buffer_ += a1;
  if (opt_a2 != null) { // second argument is undefined (null == undefined)
    for (var i = 1; i < arguments.length; i++) {
      this.buffer_ += arguments[i];
    }
  }
  return this;
};


/**
 * Clears the internal buffer.
 */
goog.string.StringBuffer.prototype.clear = function() {
  this.buffer_ = '';
};


/**
 * @return {number} the length of the current contents of the buffer.
 */
goog.string.StringBuffer.prototype.getLength = function() {
  return this.buffer_.length;
};


/**
 * @return {string} The concatenated string.
 * @override
 */
goog.string.StringBuffer.prototype.toString = function() {
  return this.buffer_;
};
// Copyright 2008 The Closure Library Authors. All Rights Reserved.
//
// Licensed under the Apache License, Version 2.0 (the "License");
// you may not use this file except in compliance with the License.
// You may obtain a copy of the License at
//
//      http://www.apache.org/licenses/LICENSE-2.0
//
// Unless required by applicable law or agreed to in writing, software
// distributed under the License is distributed on an "AS-IS" BASIS,
// WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
// See the License for the specific language governing permissions and
// limitations under the License.

/**
 * @fileoverview Utilities to check the preconditions, postconditions and
 * invariants runtime.
 *
 * Methods in this package should be given special treatment by the compiler
 * for type-inference. For example, <code>goog.asserts.assert(foo)</code>
 * will restrict <code>foo</code> to a truthy value.
 *
 * The compiler has an option to disable asserts. So code like:
 * <code>
 * var x = goog.asserts.assert(foo()); goog.asserts.assert(bar());
 * </code>
 * will be transformed into:
 * <code>
 * var x = foo();
 * </code>
 * The compiler will leave in foo() (because its return value is used),
 * but it will remove bar() because it assumes it does not have side-effects.
 *
 * @author agrieve@google.com (Andrew Grieve)
 */

goog.asserts = {};

goog.require('goog.debug.Error');
goog.require('goog.dom.NodeType');
goog.require('goog.string');    


/**
 * @define {boolean} Whether to strip out asserts or to leave them in.
 */
goog.define('goog.asserts.ENABLE_ASSERTS', goog.DEBUG);


/**
 * Error object for failed assertions.
 * @param {string} messagePattern The pattern that was used to form message.
 * @param {!Array<*>} messageArgs The items to substitute into the pattern.
 * @constructor
 * @extends {goog.debug.Error}
 * @final
 */
goog.asserts.AssertionError = function(messagePattern, messageArgs) {
  messageArgs.unshift(messagePattern);
  //goog.debug.Error.call(this, goog.string.subs.apply(null, messageArgs));
  // Remove the messagePattern afterwards to avoid permanently modifying the
  // passed in array.
  messageArgs.shift();

  /**
   * The message pattern used to format the error message. Error handlers can
   * use this to uniquely identify the assertion.
   * @type {string}
   */
  this.messagePattern = messagePattern;
};
//goog.inherits(goog.asserts.AssertionError, goog.debug.Error);


/** @override */
goog.asserts.AssertionError.prototype.name = 'AssertionError';


/**
 * The default error handler.
 * @param {!goog.asserts.AssertionError} e The exception to be handled.
 */
goog.asserts.DEFAULT_ERROR_HANDLER = function(e) { throw e; };


/**
 * The handler responsible for throwing or logging assertion errors.
 * @private {function(!goog.asserts.AssertionError)}
 */
goog.asserts.errorHandler_ = goog.asserts.DEFAULT_ERROR_HANDLER;


/**
 * Throws an exception with the given message and "Assertion failed" prefixed
 * onto it.
 * @param {string} defaultMessage The message to use if givenMessage is empty.
 * @param {Array<*>} defaultArgs The substitution arguments for defaultMessage.
 * @param {string|undefined} givenMessage Message supplied by the caller.
 * @param {Array<*>} givenArgs The substitution arguments for givenMessage.
 * @throws {goog.asserts.AssertionError} When the value is not a number.
 * @private
 */
goog.asserts.doAssertFailure_ =
    function(defaultMessage, defaultArgs, givenMessage, givenArgs) {
  var message = 'Assertion failed';
  if (givenMessage) {
    message += ': ' + givenMessage;
    var args = givenArgs;
  } else if (defaultMessage) {
    message += ': ' + defaultMessage;
    args = defaultArgs;
  }
  // The '' + works around an Opera 10 bug in the unit tests. Without it,
  // a stack trace is added to var message above. With this, a stack trace is
  // not added until this line (it causes the extra garbage to be added after
  // the assertion message instead of in the middle of it).
  var e = new goog.asserts.AssertionError('' + message, args || []);
  goog.asserts.errorHandler_(e);
};


/**
 * Sets a custom error handler that can be used to customize the behavior of
 * assertion failures, for example by turning all assertion failures into log
 * messages.
 * @param {function(!goog.asserts.AssertionError)} errorHandler
 */
goog.asserts.setErrorHandler = function(errorHandler) {
  if (goog.asserts.ENABLE_ASSERTS) {
    goog.asserts.errorHandler_ = errorHandler;
  }
};


/**
 * Checks if the condition evaluates to true if goog.asserts.ENABLE_ASSERTS is
 * true.
 * @template T
 * @param {T} condition The condition to check.
 * @param {string=} opt_message Error message in case of failure.
 * @param {...*} var_args The items to substitute into the failure message.
 * @return {T} The value of the condition.
 * @throws {goog.asserts.AssertionError} When the condition evaluates to false.
 */
goog.asserts.assert = function(condition, opt_message, var_args) {
  if (goog.asserts.ENABLE_ASSERTS && !condition) {
    goog.asserts.doAssertFailure_('', null, opt_message,
        Array.prototype.slice.call(arguments, 2));
  }
  return condition;
};


/**
 * Fails if goog.asserts.ENABLE_ASSERTS is true. This function is useful in case
 * when we want to add a check in the unreachable area like switch-case
 * statement:
 *
 * <pre>
 *  switch(type) {
 *    case FOO: doSomething(); break;
 *    case BAR: doSomethingElse(); break;
 *    default: goog.assert.fail('Unrecognized type: ' + type);
 *      // We have only 2 types - "default:" section is unreachable code.
 *  }
 * </pre>
 *
 * @param {string=} opt_message Error message in case of failure.
 * @param {...*} var_args The items to substitute into the failure message.
 * @throws {goog.asserts.AssertionError} Failure.
 */
goog.asserts.fail = function(opt_message, var_args) {
  if (goog.asserts.ENABLE_ASSERTS) {
    goog.asserts.errorHandler_(new goog.asserts.AssertionError(
        'Failure' + (opt_message ? ': ' + opt_message : ''),
        Array.prototype.slice.call(arguments, 1)));
  }
};


/**
 * Checks if the value is a number if goog.asserts.ENABLE_ASSERTS is true.
 * @param {*} value The value to check.
 * @param {string=} opt_message Error message in case of failure.
 * @param {...*} var_args The items to substitute into the failure message.
 * @return {number} The value, guaranteed to be a number when asserts enabled.
 * @throws {goog.asserts.AssertionError} When the value is not a number.
 */
goog.asserts.assertNumber = function(value, opt_message, var_args) {
  if (goog.asserts.ENABLE_ASSERTS && !goog.isNumber(value)) {
    goog.asserts.doAssertFailure_('Expected number but got %s: %s.',
        [goog.typeOf(value), value], opt_message,
        Array.prototype.slice.call(arguments, 2));
  }
  return /** @type {number} */ (value);
};


/**
 * Checks if the value is a string if goog.asserts.ENABLE_ASSERTS is true.
 * @param {*} value The value to check.
 * @param {string=} opt_message Error message in case of failure.
 * @param {...*} var_args The items to substitute into the failure message.
 * @return {string} The value, guaranteed to be a string when asserts enabled.
 * @throws {goog.asserts.AssertionError} When the value is not a string.
 */
goog.asserts.assertString = function(value, opt_message, var_args) {
  if (goog.asserts.ENABLE_ASSERTS && !goog.isString(value)) {
    goog.asserts.doAssertFailure_('Expected string but got %s: %s.',
        [goog.typeOf(value), value], opt_message,
        Array.prototype.slice.call(arguments, 2));
  }
  return /** @type {string} */ (value);
};


/**
 * Checks if the value is a function if goog.asserts.ENABLE_ASSERTS is true.
 * @param {*} value The value to check.
 * @param {string=} opt_message Error message in case of failure.
 * @param {...*} var_args The items to substitute into the failure message.
 * @return {!Function} The value, guaranteed to be a function when asserts
 *     enabled.
 * @throws {goog.asserts.AssertionError} When the value is not a function.
 */
goog.asserts.assertFunction = function(value, opt_message, var_args) {
  if (goog.asserts.ENABLE_ASSERTS && !goog.isFunction(value)) {
    goog.asserts.doAssertFailure_('Expected function but got %s: %s.',
        [goog.typeOf(value), value], opt_message,
        Array.prototype.slice.call(arguments, 2));
  }
  return /** @type {!Function} */ (value);
};


/**
 * Checks if the value is an Object if goog.asserts.ENABLE_ASSERTS is true.
 * @param {*} value The value to check.
 * @param {string=} opt_message Error message in case of failure.
 * @param {...*} var_args The items to substitute into the failure message.
 * @return {!Object} The value, guaranteed to be a non-null object.
 * @throws {goog.asserts.AssertionError} When the value is not an object.
 */
goog.asserts.assertObject = function(value, opt_message, var_args) {
  if (goog.asserts.ENABLE_ASSERTS && !goog.isObject(value)) {
    goog.asserts.doAssertFailure_('Expected object but got %s: %s.',
        [goog.typeOf(value), value],
        opt_message, Array.prototype.slice.call(arguments, 2));
  }
  return /** @type {!Object} */ (value);
};


/**
 * Checks if the value is an Array if goog.asserts.ENABLE_ASSERTS is true.
 * @param {*} value The value to check.
 * @param {string=} opt_message Error message in case of failure.
 * @param {...*} var_args The items to substitute into the failure message.
 * @return {!Array<?>} The value, guaranteed to be a non-null array.
 * @throws {goog.asserts.AssertionError} When the value is not an array.
 */
goog.asserts.assertArray = function(value, opt_message, var_args) {
  if (goog.asserts.ENABLE_ASSERTS && !goog.isArray(value)) {
    goog.asserts.doAssertFailure_('Expected array but got %s: %s.',
        [goog.typeOf(value), value], opt_message,
        Array.prototype.slice.call(arguments, 2));
  }
  return /** @type {!Array<?>} */ (value);
};


/**
 * Checks if the value is a boolean if goog.asserts.ENABLE_ASSERTS is true.
 * @param {*} value The value to check.
 * @param {string=} opt_message Error message in case of failure.
 * @param {...*} var_args The items to substitute into the failure message.
 * @return {boolean} The value, guaranteed to be a boolean when asserts are
 *     enabled.
 * @throws {goog.asserts.AssertionError} When the value is not a boolean.
 */
goog.asserts.assertBoolean = function(value, opt_message, var_args) {
  if (goog.asserts.ENABLE_ASSERTS && !goog.isBoolean(value)) {
    goog.asserts.doAssertFailure_('Expected boolean but got %s: %s.',
        [goog.typeOf(value), value], opt_message,
        Array.prototype.slice.call(arguments, 2));
  }
  return /** @type {boolean} */ (value);
};


/**
 * Checks if the value is a DOM Element if goog.asserts.ENABLE_ASSERTS is true.
 * @param {*} value The value to check.
 * @param {string=} opt_message Error message in case of failure.
 * @param {...*} var_args The items to substitute into the failure message.
 * @return {!Element} The value, likely to be a DOM Element when asserts are
 *     enabled.
 * @throws {goog.asserts.AssertionError} When the value is not an Element.
 */
goog.asserts.assertElement = function(value, opt_message, var_args) {
  if (goog.asserts.ENABLE_ASSERTS && (!goog.isObject(value) ||
      value.nodeType != goog.dom.NodeType.ELEMENT)) {
    goog.asserts.doAssertFailure_('Expected Element but got %s: %s.',
        [goog.typeOf(value), value], opt_message,
        Array.prototype.slice.call(arguments, 2));
  }
  return /** @type {!Element} */ (value);
};


/**
 * Checks if the value is an instance of the user-defined type if
 * goog.asserts.ENABLE_ASSERTS is true.
 *
 * The compiler may tighten the type returned by this function.
 *
 * @param {*} value The value to check.
 * @param {function(new: T, ...)} type A user-defined constructor.
 * @param {string=} opt_message Error message in case of failure.
 * @param {...*} var_args The items to substitute into the failure message.
 * @throws {goog.asserts.AssertionError} When the value is not an instance of
 *     type.
 * @return {T}
 * @template T
 */
goog.asserts.assertInstanceof = function(value, type, opt_message, var_args) {
  if (goog.asserts.ENABLE_ASSERTS && !(value instanceof type)) {
    goog.asserts.doAssertFailure_('Expected instanceof %s but got %s.',
        [goog.asserts.getType_(type), goog.asserts.getType_(value)],
        opt_message, Array.prototype.slice.call(arguments, 3));
  }
  return value;
};


/**
 * Checks that no enumerable keys are present in Object.prototype. Such keys
 * would break most code that use {@code for (var ... in ...)} loops.
 */
goog.asserts.assertObjectPrototypeIsIntact = function() {
  for (var key in Object.prototype) {
    goog.asserts.fail(key + ' should not be enumerable in Object.prototype.');
  }
};


/**
 * Returns the type of a value. If a constructor is passed, and a suitable
 * string cannot be found, 'unknown type name' will be returned.
 * @param {*} value A constructor, object, or primitive.
 * @return {string} The best display name for the value, or 'unknown type name'.
 * @private
 */
goog.asserts.getType_ = function(value) {
  if (value instanceof Function) {
    return value.displayName || value.name || 'unknown type name';
  } else if (value instanceof Object) {
    return value.constructor.displayName || value.constructor.name ||
        Object.prototype.toString.call(value);
  } else {
    return value === null ? 'null' : typeof value;
  }
};
// Copyright 2006 The Closure Library Authors. All Rights Reserved.
//
// Licensed under the Apache License, Version 2.0 (the "License");
// you may not use this file except in compliance with the License.
// You may obtain a copy of the License at
//
//      http://www.apache.org/licenses/LICENSE-2.0
//
// Unless required by applicable law or agreed to in writing, software
// distributed under the License is distributed on an "AS-IS" BASIS,
// WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
// See the License for the specific language governing permissions and
// limitations under the License.

/**
 * @fileoverview Utilities for manipulating objects/maps/hashes.
 * @author arv@google.com (Erik Arvidsson)
 */

goog.object = {};


/**
 * Calls a function for each element in an object/map/hash.
 *
 * @param {Object<K,V>} obj The object over which to iterate.
 * @param {function(this:T,V,?,Object<K,V>):?} f The function to call
 *     for every element. This function takes 3 arguments (the value, the
 *     key and the object) and the return value is ignored.
 * @param {T=} opt_obj This is used as the 'this' object within f.
 * @template T,K,V
 */
goog.object.forEach = function(obj, f, opt_obj) {
  for (var key in obj) {
    f.call(opt_obj, obj[key], key, obj);
  }
};


/**
 * Calls a function for each element in an object/map/hash. If that call returns
 * true, adds the element to a new object.
 *
 * @param {Object<K,V>} obj The object over which to iterate.
 * @param {function(this:T,V,?,Object<K,V>):boolean} f The function to call
 *     for every element. This
 *     function takes 3 arguments (the value, the key and the object)
 *     and should return a boolean. If the return value is true the
 *     element is added to the result object. If it is false the
 *     element is not included.
 * @param {T=} opt_obj This is used as the 'this' object within f.
 * @return {!Object<K,V>} a new object in which only elements that passed the
 *     test are present.
 * @template T,K,V
 */
goog.object.filter = function(obj, f, opt_obj) {
  var res = {};
  for (var key in obj) {
    if (f.call(opt_obj, obj[key], key, obj)) {
      res[key] = obj[key];
    }
  }
  return res;
};


/**
 * For every element in an object/map/hash calls a function and inserts the
 * result into a new object.
 *
 * @param {Object<K,V>} obj The object over which to iterate.
 * @param {function(this:T,V,?,Object<K,V>):R} f The function to call
 *     for every element. This function
 *     takes 3 arguments (the value, the key and the object)
 *     and should return something. The result will be inserted
 *     into a new object.
 * @param {T=} opt_obj This is used as the 'this' object within f.
 * @return {!Object<K,R>} a new object with the results from f.
 * @template T,K,V,R
 */
goog.object.map = function(obj, f, opt_obj) {
  var res = {};
  for (var key in obj) {
    res[key] = f.call(opt_obj, obj[key], key, obj);
  }
  return res;
};


/**
 * Calls a function for each element in an object/map/hash. If any
 * call returns true, returns true (without checking the rest). If
 * all calls return false, returns false.
 *
 * @param {Object<K,V>} obj The object to check.
 * @param {function(this:T,V,?,Object<K,V>):boolean} f The function to
 *     call for every element. This function
 *     takes 3 arguments (the value, the key and the object) and should
 *     return a boolean.
 * @param {T=} opt_obj This is used as the 'this' object within f.
 * @return {boolean} true if any element passes the test.
 * @template T,K,V
 */
goog.object.some = function(obj, f, opt_obj) {
  for (var key in obj) {
    if (f.call(opt_obj, obj[key], key, obj)) {
      return true;
    }
  }
  return false;
};


/**
 * Calls a function for each element in an object/map/hash. If
 * all calls return true, returns true. If any call returns false, returns
 * false at this point and does not continue to check the remaining elements.
 *
 * @param {Object<K,V>} obj The object to check.
 * @param {?function(this:T,V,?,Object<K,V>):boolean} f The function to
 *     call for every element. This function
 *     takes 3 arguments (the value, the key and the object) and should
 *     return a boolean.
 * @param {T=} opt_obj This is used as the 'this' object within f.
 * @return {boolean} false if any element fails the test.
 * @template T,K,V
 */
goog.object.every = function(obj, f, opt_obj) {
  for (var key in obj) {
    if (!f.call(opt_obj, obj[key], key, obj)) {
      return false;
    }
  }
  return true;
};


/**
 * Returns the number of key-value pairs in the object map.
 *
 * @param {Object} obj The object for which to get the number of key-value
 *     pairs.
 * @return {number} The number of key-value pairs in the object map.
 */
goog.object.getCount = function(obj) {
  // JS1.5 has __count__ but it has been deprecated so it raises a warning...
  // in other words do not use. Also __count__ only includes the fields on the
  // actual object and not in the prototype chain.
  var rv = 0;
  for (var key in obj) {
    rv++;
  }
  return rv;
};


/**
 * Returns one key from the object map, if any exists.
 * For map literals the returned key will be the first one in most of the
 * browsers (a know exception is Konqueror).
 *
 * @param {Object} obj The object to pick a key from.
 * @return {string|undefined} The key or undefined if the object is empty.
 */
goog.object.getAnyKey = function(obj) {
  for (var key in obj) {
    return key;
  }
};


/**
 * Returns one value from the object map, if any exists.
 * For map literals the returned value will be the first one in most of the
 * browsers (a know exception is Konqueror).
 *
 * @param {Object<K,V>} obj The object to pick a value from.
 * @return {V|undefined} The value or undefined if the object is empty.
 * @template K,V
 */
goog.object.getAnyValue = function(obj) {
  for (var key in obj) {
    return obj[key];
  }
};


/**
 * Whether the object/hash/map contains the given object as a value.
 * An alias for goog.object.containsValue(obj, val).
 *
 * @param {Object<K,V>} obj The object in which to look for val.
 * @param {V} val The object for which to check.
 * @return {boolean} true if val is present.
 * @template K,V
 */
goog.object.contains = function(obj, val) {
  return goog.object.containsValue(obj, val);
};


/**
 * Returns the values of the object/map/hash.
 *
 * @param {Object<K,V>} obj The object from which to get the values.
 * @return {!Array<V>} The values in the object/map/hash.
 * @template K,V
 */
goog.object.getValues = function(obj) {
  var res = [];
  var i = 0;
  for (var key in obj) {
    res[i++] = obj[key];
  }
  return res;
};


/**
 * Returns the keys of the object/map/hash.
 *
 * @param {Object} obj The object from which to get the keys.
 * @return {!Array<string>} Array of property keys.
 */
goog.object.getKeys = function(obj) {
  var res = [];
  var i = 0;
  for (var key in obj) {
    res[i++] = key;
  }
  return res;
};


/**
 * Get a value from an object multiple levels deep.  This is useful for
 * pulling values from deeply nested objects, such as JSON responses.
 * Example usage: getValueByKeys(jsonObj, 'foo', 'entries', 3)
 *
 * @param {!Object} obj An object to get the value from.  Can be array-like.
 * @param {...(string|number|!Array<number|string>)} var_args A number of keys
 *     (as strings, or numbers, for array-like objects).  Can also be
 *     specified as a single array of keys.
 * @return {*} The resulting value.  If, at any point, the value for a key
 *     is undefined, returns undefined.
 */
goog.object.getValueByKeys = function(obj, var_args) {
  var isArrayLike = goog.isArrayLike(var_args);
  var keys = isArrayLike ? var_args : arguments;

  // Start with the 2nd parameter for the variable parameters syntax.
  for (var i = isArrayLike ? 0 : 1; i < keys.length; i++) {
    obj = obj[keys[i]];
    if (!goog.isDef(obj)) {
      break;
    }
  }

  return obj;
};


/**
 * Whether the object/map/hash contains the given key.
 *
 * @param {Object} obj The object in which to look for key.
 * @param {*} key The key for which to check.
 * @return {boolean} true If the map contains the key.
 */
goog.object.containsKey = function(obj, key) {
  return key in obj;
};


/**
 * Whether the object/map/hash contains the given value. This is O(n).
 *
 * @param {Object<K,V>} obj The object in which to look for val.
 * @param {V} val The value for which to check.
 * @return {boolean} true If the map contains the value.
 * @template K,V
 */
goog.object.containsValue = function(obj, val) {
  for (var key in obj) {
    if (obj[key] == val) {
      return true;
    }
  }
  return false;
};


/**
 * Searches an object for an element that satisfies the given condition and
 * returns its key.
 * @param {Object<K,V>} obj The object to search in.
 * @param {function(this:T,V,string,Object<K,V>):boolean} f The
 *      function to call for every element. Takes 3 arguments (the value,
 *     the key and the object) and should return a boolean.
 * @param {T=} opt_this An optional "this" context for the function.
 * @return {string|undefined} The key of an element for which the function
 *     returns true or undefined if no such element is found.
 * @template T,K,V
 */
goog.object.findKey = function(obj, f, opt_this) {
  for (var key in obj) {
    if (f.call(opt_this, obj[key], key, obj)) {
      return key;
    }
  }
  return undefined;
};


/**
 * Searches an object for an element that satisfies the given condition and
 * returns its value.
 * @param {Object<K,V>} obj The object to search in.
 * @param {function(this:T,V,string,Object<K,V>):boolean} f The function
 *     to call for every element. Takes 3 arguments (the value, the key
 *     and the object) and should return a boolean.
 * @param {T=} opt_this An optional "this" context for the function.
 * @return {V} The value of an element for which the function returns true or
 *     undefined if no such element is found.
 * @template T,K,V
 */
goog.object.findValue = function(obj, f, opt_this) {
  var key = goog.object.findKey(obj, f, opt_this);
  return key && obj[key];
};


/**
 * Whether the object/map/hash is empty.
 *
 * @param {Object} obj The object to test.
 * @return {boolean} true if obj is empty.
 */
goog.object.isEmpty = function(obj) {
  for (var key in obj) {
    return false;
  }
  return true;
};


/**
 * Removes all key value pairs from the object/map/hash.
 *
 * @param {Object} obj The object to clear.
 */
goog.object.clear = function(obj) {
  for (var i in obj) {
    delete obj[i];
  }
};


/**
 * Removes a key-value pair based on the key.
 *
 * @param {Object} obj The object from which to remove the key.
 * @param {*} key The key to remove.
 * @return {boolean} Whether an element was removed.
 */
goog.object.remove = function(obj, key) {
  var rv;
  if ((rv = key in obj)) {
    delete obj[key];
  }
  return rv;
};


/**
 * Adds a key-value pair to the object. Throws an exception if the key is
 * already in use. Use set if you want to change an existing pair.
 *
 * @param {Object<K,V>} obj The object to which to add the key-value pair.
 * @param {string} key The key to add.
 * @param {V} val The value to add.
 * @template K,V
 */
goog.object.add = function(obj, key, val) {
  if (key in obj) {
    throw Error('The object already contains the key "' + key + '"');
  }
  goog.object.set(obj, key, val);
};


/**
 * Returns the value for the given key.
 *
 * @param {Object<K,V>} obj The object from which to get the value.
 * @param {string} key The key for which to get the value.
 * @param {R=} opt_val The value to return if no item is found for the given
 *     key (default is undefined).
 * @return {V|R|undefined} The value for the given key.
 * @template K,V,R
 */
goog.object.get = function(obj, key, opt_val) {
  if (key in obj) {
    return obj[key];
  }
  return opt_val;
};


/**
 * Adds a key-value pair to the object/map/hash.
 *
 * @param {Object<K,V>} obj The object to which to add the key-value pair.
 * @param {string} key The key to add.
 * @param {V} value The value to add.
 * @template K,V
 */
goog.object.set = function(obj, key, value) {
  obj[key] = value;
};


/**
 * Adds a key-value pair to the object/map/hash if it doesn't exist yet.
 *
 * @param {Object<K,V>} obj The object to which to add the key-value pair.
 * @param {string} key The key to add.
 * @param {V} value The value to add if the key wasn't present.
 * @return {V} The value of the entry at the end of the function.
 * @template K,V
 */
goog.object.setIfUndefined = function(obj, key, value) {
  return key in obj ? obj[key] : (obj[key] = value);
};


/**
 * Sets a key and value to an object if the key is not set. The value will be
 * the return value of the given function. If the key already exists, the
 * object will not be changed and the function will not be called (the function
 * will be lazily evaluated -- only called if necessary).
 *
 * This function is particularly useful for use with a map used a as a cache.
 *
 * @param {!Object<K,V>} obj The object to which to add the key-value pair.
 * @param {string} key The key to add.
 * @param {function():V} f The value to add if the key wasn't present.
 * @return {V} The value of the entry at the end of the function.
 * @template K,V
 */
goog.object.setWithReturnValueIfNotSet = function(obj, key, f) {
  if (key in obj) {
    return obj[key];
  }

  var val = f();
  obj[key] = val;
  return val;
};


/**
 * Compares two objects for equality using === on the values.
 *
 * @param {!Object<K,V>} a
 * @param {!Object<K,V>} b
 * @return {boolean}
 * @template K,V
 */
goog.object.equals = function(a, b) {
  for (var k in a) {
    if (!(k in b) || a[k] !== b[k]) {
      return false;
    }
  }
  for (var k in b) {
    if (!(k in a)) {
      return false;
    }
  }
  return true;
};


/**
 * Does a flat clone of the object.
 *
 * @param {Object<K,V>} obj Object to clone.
 * @return {!Object<K,V>} Clone of the input object.
 * @template K,V
 */
goog.object.clone = function(obj) {
  // We cannot use the prototype trick because a lot of methods depend on where
  // the actual key is set.

  var res = {};
  for (var key in obj) {
    res[key] = obj[key];
  }
  return res;
  // We could also use goog.mixin but I wanted this to be independent from that.
};


/**
 * Clones a value. The input may be an Object, Array, or basic type. Objects and
 * arrays will be cloned recursively.
 *
 * WARNINGS:
 * <code>goog.object.unsafeClone</code> does not detect reference loops. Objects
 * that refer to themselves will cause infinite recursion.
 *
 * <code>goog.object.unsafeClone</code> is unaware of unique identifiers, and
 * copies UIDs created by <code>getUid</code> into cloned results.
 *
 * @param {*} obj The value to clone.
 * @return {*} A clone of the input value.
 */
goog.object.unsafeClone = function(obj) {
  var type = goog.typeOf(obj);
  if (type == 'object' || type == 'array') {
    if (goog.isFunction(obj.clone)) {
      return obj.clone();
    }
    var clone = type == 'array' ? [] : {};
    for (var key in obj) {
      clone[key] = goog.object.unsafeClone(obj[key]);
    }
    return clone;
  }

  return obj;
};


/**
 * Returns a new object in which all the keys and values are interchanged
 * (keys become values and values become keys). If multiple keys map to the
 * same value, the chosen transposed value is implementation-dependent.
 *
 * @param {Object} obj The object to transpose.
 * @return {!Object} The transposed object.
 */
goog.object.transpose = function(obj) {
  var transposed = {};
  for (var key in obj) {
    transposed[obj[key]] = key;
  }
  return transposed;
};


/**
 * The names of the fields that are defined on Object.prototype.
 * @type {Array<string>}
 * @private
 */
goog.object.PROTOTYPE_FIELDS_ = [
  'constructor',
  'hasOwnProperty',
  'isPrototypeOf',
  'propertyIsEnumerable',
  'toLocaleString',
  'toString',
  'valueOf'
];


/**
 * Extends an object with another object.
 * This operates 'in-place'; it does not create a new Object.
 *
 * Example:
 * var o = {};
 * goog.object.extend(o, {a: 0, b: 1});
 * o; // {a: 0, b: 1}
 * goog.object.extend(o, {b: 2, c: 3});
 * o; // {a: 0, b: 2, c: 3}
 *
 * @param {Object} target The object to modify. Existing properties will be
 *     overwritten if they are also present in one of the objects in
 *     {@code var_args}.
 * @param {...Object} var_args The objects from which values will be copied.
 */
goog.object.extend = function(target, var_args) {
  var key, source;
  for (var i = 1; i < arguments.length; i++) {
    source = arguments[i];
    for (key in source) {
      target[key] = source[key];
    }

    // For IE the for-in-loop does not contain any properties that are not
    // enumerable on the prototype object (for example isPrototypeOf from
    // Object.prototype) and it will also not include 'replace' on objects that
    // extend String and change 'replace' (not that it is common for anyone to
    // extend anything except Object).

    for (var j = 0; j < goog.object.PROTOTYPE_FIELDS_.length; j++) {
      key = goog.object.PROTOTYPE_FIELDS_[j];
      if (Object.prototype.hasOwnProperty.call(source, key)) {
        target[key] = source[key];
      }
    }
  }
};


/**
 * Creates a new object built from the key-value pairs provided as arguments.
 * @param {...*} var_args If only one argument is provided and it is an array
 *     then this is used as the arguments,  otherwise even arguments are used as
 *     the property names and odd arguments are used as the property values.
 * @return {!Object} The new object.
 * @throws {Error} If there are uneven number of arguments or there is only one
 *     non array argument.
 */
goog.object.create = function(var_args) {
  var argLength = arguments.length;
  if (argLength == 1 && goog.isArray(arguments[0])) {
    return goog.object.create.apply(null, arguments[0]);
  }

  if (argLength % 2) {
    throw Error('Uneven number of arguments');
  }

  var rv = {};
  for (var i = 0; i < argLength; i += 2) {
    rv[arguments[i]] = arguments[i + 1];
  }
  return rv;
};


/**
 * Creates a new object where the property names come from the arguments but
 * the value is always set to true
 * @param {...*} var_args If only one argument is provided and it is an array
 *     then this is used as the arguments,  otherwise the arguments are used
 *     as the property names.
 * @return {!Object} The new object.
 */
goog.object.createSet = function(var_args) {
  var argLength = arguments.length;
  if (argLength == 1 && goog.isArray(arguments[0])) {
    return goog.object.createSet.apply(null, arguments[0]);
  }

  var rv = {};
  for (var i = 0; i < argLength; i++) {
    rv[arguments[i]] = true;
  }
  return rv;
};


/**
 * Creates an immutable view of the underlying object, if the browser
 * supports immutable objects.
 *
 * In default mode, writes to this view will fail silently. In strict mode,
 * they will throw an error.
 *
 * @param {!Object<K,V>} obj An object.
 * @return {!Object<K,V>} An immutable view of that object, or the
 *     original object if this browser does not support immutables.
 * @template K,V
 */
goog.object.createImmutableView = function(obj) {
  var result = obj;
  if (Object.isFrozen && !Object.isFrozen(obj)) {
    result = Object.create(obj);
    Object.freeze(result);
  }
  return result;
};


/**
 * @param {!Object} obj An object.
 * @return {boolean} Whether this is an immutable view of the object.
 */
goog.object.isImmutableView = function(obj) {
  return !!Object.isFrozen && Object.isFrozen(obj);
};
// Copyright 2006 The Closure Library Authors. All Rights Reserved.
//
// Licensed under the Apache License, Version 2.0 (the "License");
// you may not use this file except in compliance with the License.
// You may obtain a copy of the License at
//
//      http://www.apache.org/licenses/LICENSE-2.0
//
// Unless required by applicable law or agreed to in writing, software
// distributed under the License is distributed on an "AS-IS" BASIS,
// WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
// See the License for the specific language governing permissions and
// limitations under the License.

/**
 * @fileoverview Utilities for manipulating arrays.
 *
 * @author arv@google.com (Erik Arvidsson)
 */


goog.array = {};

goog.require('goog.asserts');


/**
 * @define {boolean} NATIVE_ARRAY_PROTOTYPES indicates whether the code should
 * rely on Array.prototype functions, if available.
 *
 * The Array.prototype functions can be defined by external libraries like
 * Prototype and setting this flag to false forces closure to use its own
 * goog.array implementation.
 *
 * If your javascript can be loaded by a third party site and you are wary about
 * relying on the prototype functions, specify
 * "--define goog.NATIVE_ARRAY_PROTOTYPES=false" to the JSCompiler.
 *
 * Setting goog.TRUSTED_SITE to false will automatically set
 * NATIVE_ARRAY_PROTOTYPES to false.
 */
goog.define('goog.NATIVE_ARRAY_PROTOTYPES', goog.TRUSTED_SITE);


/**
 * @define {boolean} If true, JSCompiler will use the native implementation of
 * array functions where appropriate (e.g., {@code Array#filter}) and remove the
 * unused pure JS implementation.
 */
goog.define('goog.array.ASSUME_NATIVE_FUNCTIONS', false);


/**
 * @typedef {Array|NodeList|Arguments|{length: number}}
 */
goog.array.ArrayLike;


/**
 * Returns the last element in an array without removing it.
 * Same as goog.array.last.
 * @param {Array<T>|goog.array.ArrayLike} array The array.
 * @return {T} Last item in array.
 * @template T
 */
goog.array.peek = function(array) {
  return array[array.length - 1];
};


/**
 * Returns the last element in an array without removing it.
 * Same as goog.array.peek.
 * @param {Array<T>|goog.array.ArrayLike} array The array.
 * @return {T} Last item in array.
 * @template T
 */
goog.array.last = goog.array.peek;


/**
 * Reference to the original {@code Array.prototype}.
 * @private
 */
goog.array.ARRAY_PROTOTYPE_ = Array.prototype;


// NOTE(arv): Since most of the array functions are generic it allows you to
// pass an array-like object. Strings have a length and are considered array-
// like. However, the 'in' operator does not work on strings so we cannot just
// use the array path even if the browser supports indexing into strings. We
// therefore end up splitting the string.


/**
 * Returns the index of the first element of an array with a specified value, or
 * -1 if the element is not present in the array.
 *
 * See {@link http://tinyurl.com/developer-mozilla-org-array-indexof}
 *
 * @param {Array<T>|goog.array.ArrayLike} arr The array to be searched.
 * @param {T} obj The object for which we are searching.
 * @param {number=} opt_fromIndex The index at which to start the search. If
 *     omitted the search starts at index 0.
 * @return {number} The index of the first matching array element.
 * @template T
 */
goog.array.indexOf = goog.NATIVE_ARRAY_PROTOTYPES &&
                     (goog.array.ASSUME_NATIVE_FUNCTIONS ||
                      goog.array.ARRAY_PROTOTYPE_.indexOf) ?
    function(arr, obj, opt_fromIndex) {
      goog.asserts.assert(arr.length != null);

      return goog.array.ARRAY_PROTOTYPE_.indexOf.call(arr, obj, opt_fromIndex);
    } :
    function(arr, obj, opt_fromIndex) {
      var fromIndex = opt_fromIndex == null ?
          0 : (opt_fromIndex < 0 ?
               Math.max(0, arr.length + opt_fromIndex) : opt_fromIndex);

      if (goog.isString(arr)) {
        // Array.prototype.indexOf uses === so only strings should be found.
        if (!goog.isString(obj) || obj.length != 1) {
          return -1;
        }
        return arr.indexOf(obj, fromIndex);
      }

      for (var i = fromIndex; i < arr.length; i++) {
        if (i in arr && arr[i] === obj)
          return i;
      }
      return -1;
    };


/**
 * Returns the index of the last element of an array with a specified value, or
 * -1 if the element is not present in the array.
 *
 * See {@link http://tinyurl.com/developer-mozilla-org-array-lastindexof}
 *
 * @param {!Array<T>|!goog.array.ArrayLike} arr The array to be searched.
 * @param {T} obj The object for which we are searching.
 * @param {?number=} opt_fromIndex The index at which to start the search. If
 *     omitted the search starts at the end of the array.
 * @return {number} The index of the last matching array element.
 * @template T
 */
goog.array.lastIndexOf = goog.NATIVE_ARRAY_PROTOTYPES &&
                         (goog.array.ASSUME_NATIVE_FUNCTIONS ||
                          goog.array.ARRAY_PROTOTYPE_.lastIndexOf) ?
    function(arr, obj, opt_fromIndex) {
      goog.asserts.assert(arr.length != null);

      // Firefox treats undefined and null as 0 in the fromIndex argument which
      // leads it to always return -1
      var fromIndex = opt_fromIndex == null ? arr.length - 1 : opt_fromIndex;
      return goog.array.ARRAY_PROTOTYPE_.lastIndexOf.call(arr, obj, fromIndex);
    } :
    function(arr, obj, opt_fromIndex) {
      var fromIndex = opt_fromIndex == null ? arr.length - 1 : opt_fromIndex;

      if (fromIndex < 0) {
        fromIndex = Math.max(0, arr.length + fromIndex);
      }

      if (goog.isString(arr)) {
        // Array.prototype.lastIndexOf uses === so only strings should be found.
        if (!goog.isString(obj) || obj.length != 1) {
          return -1;
        }
        return arr.lastIndexOf(obj, fromIndex);
      }

      for (var i = fromIndex; i >= 0; i--) {
        if (i in arr && arr[i] === obj)
          return i;
      }
      return -1;
    };


/**
 * Calls a function for each element in an array. Skips holes in the array.
 * See {@link http://tinyurl.com/developer-mozilla-org-array-foreach}
 *
 * @param {Array<T>|goog.array.ArrayLike} arr Array or array like object over
 *     which to iterate.
 * @param {?function(this: S, T, number, ?): ?} f The function to call for every
 *     element. This function takes 3 arguments (the element, the index and the
 *     array). The return value is ignored.
 * @param {S=} opt_obj The object to be used as the value of 'this' within f.
 * @template T,S
 */
goog.array.forEach = goog.NATIVE_ARRAY_PROTOTYPES &&
                     (goog.array.ASSUME_NATIVE_FUNCTIONS ||
                      goog.array.ARRAY_PROTOTYPE_.forEach) ?
    function(arr, f, opt_obj) {
      goog.asserts.assert(arr.length != null);

      goog.array.ARRAY_PROTOTYPE_.forEach.call(arr, f, opt_obj);
    } :
    function(arr, f, opt_obj) {
      var l = arr.length;  // must be fixed during loop... see docs
      var arr2 = goog.isString(arr) ? arr.split('') : arr;
      for (var i = 0; i < l; i++) {
        if (i in arr2) {
          f.call(opt_obj, arr2[i], i, arr);
        }
      }
    };


/**
 * Calls a function for each element in an array, starting from the last
 * element rather than the first.
 *
 * @param {Array<T>|goog.array.ArrayLike} arr Array or array
 *     like object over which to iterate.
 * @param {?function(this: S, T, number, ?): ?} f The function to call for every
 *     element. This function
 *     takes 3 arguments (the element, the index and the array). The return
 *     value is ignored.
 * @param {S=} opt_obj The object to be used as the value of 'this'
 *     within f.
 * @template T,S
 */
goog.array.forEachRight = function(arr, f, opt_obj) {
  var l = arr.length;  // must be fixed during loop... see docs
  var arr2 = goog.isString(arr) ? arr.split('') : arr;
  for (var i = l - 1; i >= 0; --i) {
    if (i in arr2) {
      f.call(opt_obj, arr2[i], i, arr);
    }
  }
};


/**
 * Calls a function for each element in an array, and if the function returns
 * true adds the element to a new array.
 *
 * See {@link http://tinyurl.com/developer-mozilla-org-array-filter}
 *
 * @param {Array<T>|goog.array.ArrayLike} arr Array or array
 *     like object over which to iterate.
 * @param {?function(this:S, T, number, ?):boolean} f The function to call for
 *     every element. This function
 *     takes 3 arguments (the element, the index and the array) and must
 *     return a Boolean. If the return value is true the element is added to the
 *     result array. If it is false the element is not included.
 * @param {S=} opt_obj The object to be used as the value of 'this'
 *     within f.
 * @return {!Array<T>} a new array in which only elements that passed the test
 *     are present.
 * @template T,S
 */
goog.array.filter = goog.NATIVE_ARRAY_PROTOTYPES &&
                    (goog.array.ASSUME_NATIVE_FUNCTIONS ||
                     goog.array.ARRAY_PROTOTYPE_.filter) ?
    function(arr, f, opt_obj) {
      goog.asserts.assert(arr.length != null);

      return goog.array.ARRAY_PROTOTYPE_.filter.call(arr, f, opt_obj);
    } :
    function(arr, f, opt_obj) {
      var l = arr.length;  // must be fixed during loop... see docs
      var res = [];
      var resLength = 0;
      var arr2 = goog.isString(arr) ? arr.split('') : arr;
      for (var i = 0; i < l; i++) {
        if (i in arr2) {
          var val = arr2[i];  // in case f mutates arr2
          if (f.call(opt_obj, val, i, arr)) {
            res[resLength++] = val;
          }
        }
      }
      return res;
    };


/**
 * Calls a function for each element in an array and inserts the result into a
 * new array.
 *
 * See {@link http://tinyurl.com/developer-mozilla-org-array-map}
 *
 * @param {Array<VALUE>|goog.array.ArrayLike} arr Array or array like object
 *     over which to iterate.
 * @param {function(this:THIS, VALUE, number, ?): RESULT} f The function to call
 *     for every element. This function takes 3 arguments (the element,
 *     the index and the array) and should return something. The result will be
 *     inserted into a new array.
 * @param {THIS=} opt_obj The object to be used as the value of 'this' within f.
 * @return {!Array<RESULT>} a new array with the results from f.
 * @template THIS, VALUE, RESULT
 */
goog.array.map = goog.NATIVE_ARRAY_PROTOTYPES &&
                 (goog.array.ASSUME_NATIVE_FUNCTIONS ||
                  goog.array.ARRAY_PROTOTYPE_.map) ?
    function(arr, f, opt_obj) {
      goog.asserts.assert(arr.length != null);

      return goog.array.ARRAY_PROTOTYPE_.map.call(arr, f, opt_obj);
    } :
    function(arr, f, opt_obj) {
      var l = arr.length;  // must be fixed during loop... see docs
      var res = new Array(l);
      var arr2 = goog.isString(arr) ? arr.split('') : arr;
      for (var i = 0; i < l; i++) {
        if (i in arr2) {
          res[i] = f.call(opt_obj, arr2[i], i, arr);
        }
      }
      return res;
    };


/**
 * Passes every element of an array into a function and accumulates the result.
 *
 * See {@link http://tinyurl.com/developer-mozilla-org-array-reduce}
 *
 * For example:
 * var a = [1, 2, 3, 4];
 * goog.array.reduce(a, function(r, v, i, arr) {return r + v;}, 0);
 * returns 10
 *
 * @param {Array<T>|goog.array.ArrayLike} arr Array or array
 *     like object over which to iterate.
 * @param {function(this:S, R, T, number, ?) : R} f The function to call for
 *     every element. This function
 *     takes 4 arguments (the function's previous result or the initial value,
 *     the value of the current array element, the current array index, and the
 *     array itself)
 *     function(previousValue, currentValue, index, array).
 * @param {?} val The initial value to pass into the function on the first call.
 * @param {S=} opt_obj  The object to be used as the value of 'this'
 *     within f.
 * @return {R} Result of evaluating f repeatedly across the values of the array.
 * @template T,S,R
 */
goog.array.reduce = goog.NATIVE_ARRAY_PROTOTYPES &&
                    (goog.array.ASSUME_NATIVE_FUNCTIONS ||
                     goog.array.ARRAY_PROTOTYPE_.reduce) ?
    function(arr, f, val, opt_obj) {
      goog.asserts.assert(arr.length != null);
      if (opt_obj) {
        f = goog.bind(f, opt_obj);
      }
      return goog.array.ARRAY_PROTOTYPE_.reduce.call(arr, f, val);
    } :
    function(arr, f, val, opt_obj) {
      var rval = val;
      goog.array.forEach(arr, function(val, index) {
        rval = f.call(opt_obj, rval, val, index, arr);
      });
      return rval;
    };


/**
 * Passes every element of an array into a function and accumulates the result,
 * starting from the last element and working towards the first.
 *
 * See {@link http://tinyurl.com/developer-mozilla-org-array-reduceright}
 *
 * For example:
 * var a = ['a', 'b', 'c'];
 * goog.array.reduceRight(a, function(r, v, i, arr) {return r + v;}, '');
 * returns 'cba'
 *
 * @param {Array<T>|goog.array.ArrayLike} arr Array or array
 *     like object over which to iterate.
 * @param {?function(this:S, R, T, number, ?) : R} f The function to call for
 *     every element. This function
 *     takes 4 arguments (the function's previous result or the initial value,
 *     the value of the current array element, the current array index, and the
 *     array itself)
 *     function(previousValue, currentValue, index, array).
 * @param {?} val The initial value to pass into the function on the first call.
 * @param {S=} opt_obj The object to be used as the value of 'this'
 *     within f.
 * @return {R} Object returned as a result of evaluating f repeatedly across the
 *     values of the array.
 * @template T,S,R
 */
goog.array.reduceRight = goog.NATIVE_ARRAY_PROTOTYPES &&
                         (goog.array.ASSUME_NATIVE_FUNCTIONS ||
                          goog.array.ARRAY_PROTOTYPE_.reduceRight) ?
    function(arr, f, val, opt_obj) {
      goog.asserts.assert(arr.length != null);
      if (opt_obj) {
        f = goog.bind(f, opt_obj);
      }
      return goog.array.ARRAY_PROTOTYPE_.reduceRight.call(arr, f, val);
    } :
    function(arr, f, val, opt_obj) {
      var rval = val;
      goog.array.forEachRight(arr, function(val, index) {
        rval = f.call(opt_obj, rval, val, index, arr);
      });
      return rval;
    };


/**
 * Calls f for each element of an array. If any call returns true, some()
 * returns true (without checking the remaining elements). If all calls
 * return false, some() returns false.
 *
 * See {@link http://tinyurl.com/developer-mozilla-org-array-some}
 *
 * @param {Array<T>|goog.array.ArrayLike} arr Array or array
 *     like object over which to iterate.
 * @param {?function(this:S, T, number, ?) : boolean} f The function to call for
 *     for every element. This function takes 3 arguments (the element, the
 *     index and the array) and should return a boolean.
 * @param {S=} opt_obj  The object to be used as the value of 'this'
 *     within f.
 * @return {boolean} true if any element passes the test.
 * @template T,S
 */
goog.array.some = goog.NATIVE_ARRAY_PROTOTYPES &&
                  (goog.array.ASSUME_NATIVE_FUNCTIONS ||
                   goog.array.ARRAY_PROTOTYPE_.some) ?
    function(arr, f, opt_obj) {
      goog.asserts.assert(arr.length != null);

      return goog.array.ARRAY_PROTOTYPE_.some.call(arr, f, opt_obj);
    } :
    function(arr, f, opt_obj) {
      var l = arr.length;  // must be fixed during loop... see docs
      var arr2 = goog.isString(arr) ? arr.split('') : arr;
      for (var i = 0; i < l; i++) {
        if (i in arr2 && f.call(opt_obj, arr2[i], i, arr)) {
          return true;
        }
      }
      return false;
    };


/**
 * Call f for each element of an array. If all calls return true, every()
 * returns true. If any call returns false, every() returns false and
 * does not continue to check the remaining elements.
 *
 * See {@link http://tinyurl.com/developer-mozilla-org-array-every}
 *
 * @param {Array<T>|goog.array.ArrayLike} arr Array or array
 *     like object over which to iterate.
 * @param {?function(this:S, T, number, ?) : boolean} f The function to call for
 *     for every element. This function takes 3 arguments (the element, the
 *     index and the array) and should return a boolean.
 * @param {S=} opt_obj The object to be used as the value of 'this'
 *     within f.
 * @return {boolean} false if any element fails the test.
 * @template T,S
 */
goog.array.every = goog.NATIVE_ARRAY_PROTOTYPES &&
                   (goog.array.ASSUME_NATIVE_FUNCTIONS ||
                    goog.array.ARRAY_PROTOTYPE_.every) ?
    function(arr, f, opt_obj) {
      goog.asserts.assert(arr.length != null);

      return goog.array.ARRAY_PROTOTYPE_.every.call(arr, f, opt_obj);
    } :
    function(arr, f, opt_obj) {
      var l = arr.length;  // must be fixed during loop... see docs
      var arr2 = goog.isString(arr) ? arr.split('') : arr;
      for (var i = 0; i < l; i++) {
        if (i in arr2 && !f.call(opt_obj, arr2[i], i, arr)) {
          return false;
        }
      }
      return true;
    };


/**
 * Counts the array elements that fulfill the predicate, i.e. for which the
 * callback function returns true. Skips holes in the array.
 *
 * @param {!(Array<T>|goog.array.ArrayLike)} arr Array or array like object
 *     over which to iterate.
 * @param {function(this: S, T, number, ?): boolean} f The function to call for
 *     every element. Takes 3 arguments (the element, the index and the array).
 * @param {S=} opt_obj The object to be used as the value of 'this' within f.
 * @return {number} The number of the matching elements.
 * @template T,S
 */
goog.array.count = function(arr, f, opt_obj) {
  var count = 0;
  goog.array.forEach(arr, function(element, index, arr) {
    if (f.call(opt_obj, element, index, arr)) {
      ++count;
    }
  }, opt_obj);
  return count;
};


/**
 * Search an array for the first element that satisfies a given condition and
 * return that element.
 * @param {Array<T>|goog.array.ArrayLike} arr Array or array
 *     like object over which to iterate.
 * @param {?function(this:S, T, number, ?) : boolean} f The function to call
 *     for every element. This function takes 3 arguments (the element, the
 *     index and the array) and should return a boolean.
 * @param {S=} opt_obj An optional "this" context for the function.
 * @return {T|null} The first array element that passes the test, or null if no
 *     element is found.
 * @template T,S
 */
goog.array.find = function(arr, f, opt_obj) {
  var i = goog.array.findIndex(arr, f, opt_obj);
  return i < 0 ? null : goog.isString(arr) ? arr.charAt(i) : arr[i];
};


/**
 * Search an array for the first element that satisfies a given condition and
 * return its index.
 * @param {Array<T>|goog.array.ArrayLike} arr Array or array
 *     like object over which to iterate.
 * @param {?function(this:S, T, number, ?) : boolean} f The function to call for
 *     every element. This function
 *     takes 3 arguments (the element, the index and the array) and should
 *     return a boolean.
 * @param {S=} opt_obj An optional "this" context for the function.
 * @return {number} The index of the first array element that passes the test,
 *     or -1 if no element is found.
 * @template T,S
 */
goog.array.findIndex = function(arr, f, opt_obj) {
  var l = arr.length;  // must be fixed during loop... see docs
  var arr2 = goog.isString(arr) ? arr.split('') : arr;
  for (var i = 0; i < l; i++) {
    if (i in arr2 && f.call(opt_obj, arr2[i], i, arr)) {
      return i;
    }
  }
  return -1;
};


/**
 * Search an array (in reverse order) for the last element that satisfies a
 * given condition and return that element.
 * @param {Array<T>|goog.array.ArrayLike} arr Array or array
 *     like object over which to iterate.
 * @param {?function(this:S, T, number, ?) : boolean} f The function to call
 *     for every element. This function
 *     takes 3 arguments (the element, the index and the array) and should
 *     return a boolean.
 * @param {S=} opt_obj An optional "this" context for the function.
 * @return {T|null} The last array element that passes the test, or null if no
 *     element is found.
 * @template T,S
 */
goog.array.findRight = function(arr, f, opt_obj) {
  var i = goog.array.findIndexRight(arr, f, opt_obj);
  return i < 0 ? null : goog.isString(arr) ? arr.charAt(i) : arr[i];
};


/**
 * Search an array (in reverse order) for the last element that satisfies a
 * given condition and return its index.
 * @param {Array<T>|goog.array.ArrayLike} arr Array or array
 *     like object over which to iterate.
 * @param {?function(this:S, T, number, ?) : boolean} f The function to call
 *     for every element. This function
 *     takes 3 arguments (the element, the index and the array) and should
 *     return a boolean.
 * @param {S=} opt_obj An optional "this" context for the function.
 * @return {number} The index of the last array element that passes the test,
 *     or -1 if no element is found.
 * @template T,S
 */
goog.array.findIndexRight = function(arr, f, opt_obj) {
  var l = arr.length;  // must be fixed during loop... see docs
  var arr2 = goog.isString(arr) ? arr.split('') : arr;
  for (var i = l - 1; i >= 0; i--) {
    if (i in arr2 && f.call(opt_obj, arr2[i], i, arr)) {
      return i;
    }
  }
  return -1;
};


/**
 * Whether the array contains the given object.
 * @param {goog.array.ArrayLike} arr The array to test for the presence of the
 *     element.
 * @param {*} obj The object for which to test.
 * @return {boolean} true if obj is present.
 */
goog.array.contains = function(arr, obj) {
  return goog.array.indexOf(arr, obj) >= 0;
};


/**
 * Whether the array is empty.
 * @param {goog.array.ArrayLike} arr The array to test.
 * @return {boolean} true if empty.
 */
goog.array.isEmpty = function(arr) {
  return arr.length == 0;
};


/**
 * Clears the array.
 * @param {goog.array.ArrayLike} arr Array or array like object to clear.
 */
goog.array.clear = function(arr) {
  // For non real arrays we don't have the magic length so we delete the
  // indices.
  if (!goog.isArray(arr)) {
    for (var i = arr.length - 1; i >= 0; i--) {
      delete arr[i];
    }
  }
  arr.length = 0;
};


/**
 * Pushes an item into an array, if it's not already in the array.
 * @param {Array<T>} arr Array into which to insert the item.
 * @param {T} obj Value to add.
 * @template T
 */
goog.array.insert = function(arr, obj) {
  if (!goog.array.contains(arr, obj)) {
    arr.push(obj);
  }
};


/**
 * Inserts an object at the given index of the array.
 * @param {goog.array.ArrayLike} arr The array to modify.
 * @param {*} obj The object to insert.
 * @param {number=} opt_i The index at which to insert the object. If omitted,
 *      treated as 0. A negative index is counted from the end of the array.
 */
goog.array.insertAt = function(arr, obj, opt_i) {
  goog.array.splice(arr, opt_i, 0, obj);
};


/**
 * Inserts at the given index of the array, all elements of another array.
 * @param {goog.array.ArrayLike} arr The array to modify.
 * @param {goog.array.ArrayLike} elementsToAdd The array of elements to add.
 * @param {number=} opt_i The index at which to insert the object. If omitted,
 *      treated as 0. A negative index is counted from the end of the array.
 */
goog.array.insertArrayAt = function(arr, elementsToAdd, opt_i) {
  goog.partial(goog.array.splice, arr, opt_i, 0).apply(null, elementsToAdd);
};


/**
 * Inserts an object into an array before a specified object.
 * @param {Array<T>} arr The array to modify.
 * @param {T} obj The object to insert.
 * @param {T=} opt_obj2 The object before which obj should be inserted. If obj2
 *     is omitted or not found, obj is inserted at the end of the array.
 * @template T
 */
goog.array.insertBefore = function(arr, obj, opt_obj2) {
  var i;
  if (arguments.length == 2 || (i = goog.array.indexOf(arr, opt_obj2)) < 0) {
    arr.push(obj);
  } else {
    goog.array.insertAt(arr, obj, i);
  }
};


/**
 * Removes the first occurrence of a particular value from an array.
 * @param {Array<T>|goog.array.ArrayLike} arr Array from which to remove
 *     value.
 * @param {T} obj Object to remove.
 * @return {boolean} True if an element was removed.
 * @template T
 */
goog.array.remove = function(arr, obj) {
  var i = goog.array.indexOf(arr, obj);
  var rv;
  if ((rv = i >= 0)) {
    goog.array.removeAt(arr, i);
  }
  return rv;
};


/**
 * Removes from an array the element at index i
 * @param {goog.array.ArrayLike} arr Array or array like object from which to
 *     remove value.
 * @param {number} i The index to remove.
 * @return {boolean} True if an element was removed.
 */
goog.array.removeAt = function(arr, i) {
  goog.asserts.assert(arr.length != null);

  // use generic form of splice
  // splice returns the removed items and if successful the length of that
  // will be 1
  return goog.array.ARRAY_PROTOTYPE_.splice.call(arr, i, 1).length == 1;
};


/**
 * Removes the first value that satisfies the given condition.
 * @param {Array<T>|goog.array.ArrayLike} arr Array or array
 *     like object over which to iterate.
 * @param {?function(this:S, T, number, ?) : boolean} f The function to call
 *     for every element. This function
 *     takes 3 arguments (the element, the index and the array) and should
 *     return a boolean.
 * @param {S=} opt_obj An optional "this" context for the function.
 * @return {boolean} True if an element was removed.
 * @template T,S
 */
goog.array.removeIf = function(arr, f, opt_obj) {
  var i = goog.array.findIndex(arr, f, opt_obj);
  if (i >= 0) {
    goog.array.removeAt(arr, i);
    return true;
  }
  return false;
};


/**
 * Removes all values that satisfy the given condition.
 * @param {Array<T>|goog.array.ArrayLike} arr Array or array
 *     like object over which to iterate.
 * @param {?function(this:S, T, number, ?) : boolean} f The function to call
 *     for every element. This function
 *     takes 3 arguments (the element, the index and the array) and should
 *     return a boolean.
 * @param {S=} opt_obj An optional "this" context for the function.
 * @return {number} The number of items removed
 * @template T,S
 */
goog.array.removeAllIf = function(arr, f, opt_obj) {
  var removedCount = 0;
  goog.array.forEachRight(arr, function(val, index) {
    if (f.call(opt_obj, val, index, arr)) {
      if (goog.array.removeAt(arr, index)) {
        removedCount++;
      }
    }
  });
  return removedCount;
};


/**
 * Returns a new array that is the result of joining the arguments.  If arrays
 * are passed then their items are added, however, if non-arrays are passed they
 * will be added to the return array as is.
 *
 * Note that ArrayLike objects will be added as is, rather than having their
 * items added.
 *
 * goog.array.concat([1, 2], [3, 4]) -> [1, 2, 3, 4]
 * goog.array.concat(0, [1, 2]) -> [0, 1, 2]
 * goog.array.concat([1, 2], null) -> [1, 2, null]
 *
 * There is bug in all current versions of IE (6, 7 and 8) where arrays created
 * in an iframe become corrupted soon (not immediately) after the iframe is
 * destroyed. This is common if loading data via goog.net.IframeIo, for example.
 * This corruption only affects the concat method which will start throwing
 * Catastrophic Errors (#-2147418113).
 *
 * See http://endoflow.com/scratch/corrupted-arrays.html for a test case.
 *
 * Internally goog.array should use this, so that all methods will continue to
 * work on these broken array objects.
 *
 * @param {...*} var_args Items to concatenate.  Arrays will have each item
 *     added, while primitives and objects will be added as is.
 * @return {!Array<?>} The new resultant array.
 */
goog.array.concat = function(var_args) {
  return goog.array.ARRAY_PROTOTYPE_.concat.apply(
      goog.array.ARRAY_PROTOTYPE_, arguments);
};


/**
 * Returns a new array that contains the contents of all the arrays passed.
 * @param {...!Array<T>} var_args
 * @return {!Array<T>}
 * @template T
 */
goog.array.join = function(var_args) {
  return goog.array.ARRAY_PROTOTYPE_.concat.apply(
      goog.array.ARRAY_PROTOTYPE_, arguments);
};


/**
 * Converts an object to an array.
 * @param {Array<T>|goog.array.ArrayLike} object  The object to convert to an
 *     array.
 * @return {!Array<T>} The object converted into an array. If object has a
 *     length property, every property indexed with a non-negative number
 *     less than length will be included in the result. If object does not
 *     have a length property, an empty array will be returned.
 * @template T
 */
goog.array.toArray = function(object) {
  var length = object.length;

  // If length is not a number the following it false. This case is kept for
  // backwards compatibility since there are callers that pass objects that are
  // not array like.
  if (length > 0) {
    var rv = new Array(length);
    for (var i = 0; i < length; i++) {
      rv[i] = object[i];
    }
    return rv;
  }
  return [];
};


/**
 * Does a shallow copy of an array.
 * @param {Array<T>|goog.array.ArrayLike} arr  Array or array-like object to
 *     clone.
 * @return {!Array<T>} Clone of the input array.
 * @template T
 */
goog.array.clone = goog.array.toArray;


/**
 * Extends an array with another array, element, or "array like" object.
 * This function operates 'in-place', it does not create a new Array.
 *
 * Example:
 * var a = [];
 * goog.array.extend(a, [0, 1]);
 * a; // [0, 1]
 * goog.array.extend(a, 2);
 * a; // [0, 1, 2]
 *
 * @param {Array<VALUE>} arr1  The array to modify.
 * @param {...(Array<VALUE>|VALUE)} var_args The elements or arrays of elements
 *     to add to arr1.
 * @template VALUE
 */
goog.array.extend = function(arr1, var_args) {
  for (var i = 1; i < arguments.length; i++) {
    var arr2 = arguments[i];
    if (goog.isArrayLike(arr2)) {
      var len1 = arr1.length || 0;
      var len2 = arr2.length || 0;
      arr1.length = len1 + len2;
      for (var j = 0; j < len2; j++) {
        arr1[len1 + j] = arr2[j];
      }
    } else {
      arr1.push(arr2);
    }
  }
};


/**
 * Adds or removes elements from an array. This is a generic version of Array
 * splice. This means that it might work on other objects similar to arrays,
 * such as the arguments object.
 *
 * @param {Array<T>|goog.array.ArrayLike} arr The array to modify.
 * @param {number|undefined} index The index at which to start changing the
 *     array. If not defined, treated as 0.
 * @param {number} howMany How many elements to remove (0 means no removal. A
 *     value below 0 is treated as zero and so is any other non number. Numbers
 *     are floored).
 * @param {...T} var_args Optional, additional elements to insert into the
 *     array.
 * @return {!Array<T>} the removed elements.
 * @template T
 */
goog.array.splice = function(arr, index, howMany, var_args) {
  goog.asserts.assert(arr.length != null);

  return goog.array.ARRAY_PROTOTYPE_.splice.apply(
      arr, goog.array.slice(arguments, 1));
};


/**
 * Returns a new array from a segment of an array. This is a generic version of
 * Array slice. This means that it might work on other objects similar to
 * arrays, such as the arguments object.
 *
 * @param {Array<T>|goog.array.ArrayLike} arr The array from
 * which to copy a segment.
 * @param {number} start The index of the first element to copy.
 * @param {number=} opt_end The index after the last element to copy.
 * @return {!Array<T>} A new array containing the specified segment of the
 *     original array.
 * @template T
 */
goog.array.slice = function(arr, start, opt_end) {
  goog.asserts.assert(arr.length != null);

  // passing 1 arg to slice is not the same as passing 2 where the second is
  // null or undefined (in that case the second argument is treated as 0).
  // we could use slice on the arguments object and then use apply instead of
  // testing the length
  if (arguments.length <= 2) {
    return goog.array.ARRAY_PROTOTYPE_.slice.call(arr, start);
  } else {
    return goog.array.ARRAY_PROTOTYPE_.slice.call(arr, start, opt_end);
  }
};


/**
 * Removes all duplicates from an array (retaining only the first
 * occurrence of each array element).  This function modifies the
 * array in place and doesn't change the order of the non-duplicate items.
 *
 * For objects, duplicates are identified as having the same unique ID as
 * defined by {@link goog.getUid}.
 *
 * Alternatively you can specify a custom hash function that returns a unique
 * value for each item in the array it should consider unique.
 *
 * Runtime: N,
 * Worstcase space: 2N (no dupes)
 *
 * @param {Array<T>|goog.array.ArrayLike} arr The array from which to remove
 *     duplicates.
 * @param {Array=} opt_rv An optional array in which to return the results,
 *     instead of performing the removal inplace.  If specified, the original
 *     array will remain unchanged.
 * @param {function(T):string=} opt_hashFn An optional function to use to
 *     apply to every item in the array. This function should return a unique
 *     value for each item in the array it should consider unique.
 * @template T
 */
goog.array.removeDuplicates = function(arr, opt_rv, opt_hashFn) {
  var returnArray = opt_rv || arr;
  var defaultHashFn = function(item) {
    // Prefix each type with a single character representing the type to
    // prevent conflicting keys (e.g. true and 'true').
    return goog.isObject(item) ? 'o' + goog.getUid(item) :
        (typeof item).charAt(0) + item;
  };
  var hashFn = opt_hashFn || defaultHashFn;

  var seen = {}, cursorInsert = 0, cursorRead = 0;
  while (cursorRead < arr.length) {
    var current = arr[cursorRead++];
    var key = hashFn(current);
    if (!Object.prototype.hasOwnProperty.call(seen, key)) {
      seen[key] = true;
      returnArray[cursorInsert++] = current;
    }
  }
  returnArray.length = cursorInsert;
};


/**
 * Searches the specified array for the specified target using the binary
 * search algorithm.  If no opt_compareFn is specified, elements are compared
 * using <code>goog.array.defaultCompare</code>, which compares the elements
 * using the built in < and > operators.  This will produce the expected
 * behavior for homogeneous arrays of String(s) and Number(s). The array
 * specified <b>must</b> be sorted in ascending order (as defined by the
 * comparison function).  If the array is not sorted, results are undefined.
 * If the array contains multiple instances of the specified target value, any
 * of these instances may be found.
 *
 * Runtime: O(log n)
 *
 * @param {Array<VALUE>|goog.array.ArrayLike} arr The array to be searched.
 * @param {TARGET} target The sought value.
 * @param {function(TARGET, VALUE): number=} opt_compareFn Optional comparison
 *     function by which the array is ordered. Should take 2 arguments to
 *     compare, and return a negative number, zero, or a positive number
 *     depending on whether the first argument is less than, equal to, or
 *     greater than the second.
 * @return {number} Lowest index of the target value if found, otherwise
 *     (-(insertion point) - 1). The insertion point is where the value should
 *     be inserted into arr to preserve the sorted property.  Return value >= 0
 *     iff target is found.
 * @template TARGET, VALUE
 */
goog.array.binarySearch = function(arr, target, opt_compareFn) {
  return goog.array.binarySearch_(arr,
      opt_compareFn || goog.array.defaultCompare, false /* isEvaluator */,
      target);
};


/**
 * Selects an index in the specified array using the binary search algorithm.
 * The evaluator receives an element and determines whether the desired index
 * is before, at, or after it.  The evaluator must be consistent (formally,
 * goog.array.map(goog.array.map(arr, evaluator, opt_obj), goog.math.sign)
 * must be monotonically non-increasing).
 *
 * Runtime: O(log n)
 *
 * @param {Array<VALUE>|goog.array.ArrayLike} arr The array to be searched.
 * @param {function(this:THIS, VALUE, number, ?): number} evaluator
 *     Evaluator function that receives 3 arguments (the element, the index and
 *     the array). Should return a negative number, zero, or a positive number
 *     depending on whether the desired index is before, at, or after the
 *     element passed to it.
 * @param {THIS=} opt_obj The object to be used as the value of 'this'
 *     within evaluator.
 * @return {number} Index of the leftmost element matched by the evaluator, if
 *     such exists; otherwise (-(insertion point) - 1). The insertion point is
 *     the index of the first element for which the evaluator returns negative,
 *     or arr.length if no such element exists. The return value is non-negative
 *     iff a match is found.
 * @template THIS, VALUE
 */
goog.array.binarySelect = function(arr, evaluator, opt_obj) {
  return goog.array.binarySearch_(arr, evaluator, true /* isEvaluator */,
      undefined /* opt_target */, opt_obj);
};


/**
 * Implementation of a binary search algorithm which knows how to use both
 * comparison functions and evaluators. If an evaluator is provided, will call
 * the evaluator with the given optional data object, conforming to the
 * interface defined in binarySelect. Otherwise, if a comparison function is
 * provided, will call the comparison function against the given data object.
 *
 * This implementation purposefully does not use goog.bind or goog.partial for
 * performance reasons.
 *
 * Runtime: O(log n)
 *
 * @param {Array<VALUE>|goog.array.ArrayLike} arr The array to be searched.
 * @param {function(TARGET, VALUE): number|
 *         function(this:THIS, VALUE, number, ?): number} compareFn Either an
 *     evaluator or a comparison function, as defined by binarySearch
 *     and binarySelect above.
 * @param {boolean} isEvaluator Whether the function is an evaluator or a
 *     comparison function.
 * @param {TARGET=} opt_target If the function is a comparison function, then
 *     this is the target to binary search for.
 * @param {THIS=} opt_selfObj If the function is an evaluator, this is an
  *    optional this object for the evaluator.
 * @return {number} Lowest index of the target value if found, otherwise
 *     (-(insertion point) - 1). The insertion point is where the value should
 *     be inserted into arr to preserve the sorted property.  Return value >= 0
 *     iff target is found.
 * @template THIS, VALUE, TARGET
 * @private
 */
goog.array.binarySearch_ = function(arr, compareFn, isEvaluator, opt_target,
    opt_selfObj) {
  var left = 0;  // inclusive
  var right = arr.length;  // exclusive
  var found;
  while (left < right) {
    var middle = (left + right) >> 1;
    var compareResult;
    if (isEvaluator) {
      compareResult = compareFn.call(opt_selfObj, arr[middle], middle, arr);
    } else {
      compareResult = compareFn(opt_target, arr[middle]);
    }
    if (compareResult > 0) {
      left = middle + 1;
    } else {
      right = middle;
      // We are looking for the lowest index so we can't return immediately.
      found = !compareResult;
    }
  }
  // left is the index if found, or the insertion point otherwise.
  // ~left is a shorthand for -left - 1.
  return found ? left : ~left;
};


/**
 * Sorts the specified array into ascending order.  If no opt_compareFn is
 * specified, elements are compared using
 * <code>goog.array.defaultCompare</code>, which compares the elements using
 * the built in < and > operators.  This will produce the expected behavior
 * for homogeneous arrays of String(s) and Number(s), unlike the native sort,
 * but will give unpredictable results for heterogenous lists of strings and
 * numbers with different numbers of digits.
 *
 * This sort is not guaranteed to be stable.
 *
 * Runtime: Same as <code>Array.prototype.sort</code>
 *
 * @param {Array<T>} arr The array to be sorted.
 * @param {?function(T,T):number=} opt_compareFn Optional comparison
 *     function by which the
 *     array is to be ordered. Should take 2 arguments to compare, and return a
 *     negative number, zero, or a positive number depending on whether the
 *     first argument is less than, equal to, or greater than the second.
 * @template T
 */
goog.array.sort = function(arr, opt_compareFn) {
  // TODO(arv): Update type annotation since null is not accepted.
  arr.sort(opt_compareFn || goog.array.defaultCompare);
};


/**
 * Sorts the specified array into ascending order in a stable way.  If no
 * opt_compareFn is specified, elements are compared using
 * <code>goog.array.defaultCompare</code>, which compares the elements using
 * the built in < and > operators.  This will produce the expected behavior
 * for homogeneous arrays of String(s) and Number(s).
 *
 * Runtime: Same as <code>Array.prototype.sort</code>, plus an additional
 * O(n) overhead of copying the array twice.
 *
 * @param {Array<T>} arr The array to be sorted.
 * @param {?function(T, T): number=} opt_compareFn Optional comparison function
 *     by which the array is to be ordered. Should take 2 arguments to compare,
 *     and return a negative number, zero, or a positive number depending on
 *     whether the first argument is less than, equal to, or greater than the
 *     second.
 * @template T
 */
goog.array.stableSort = function(arr, opt_compareFn) {
  for (var i = 0; i < arr.length; i++) {
    arr[i] = {index: i, value: arr[i]};
  }
  var valueCompareFn = opt_compareFn || goog.array.defaultCompare;
  function stableCompareFn(obj1, obj2) {
    return valueCompareFn(obj1.value, obj2.value) || obj1.index - obj2.index;
  };
  goog.array.sort(arr, stableCompareFn);
  for (var i = 0; i < arr.length; i++) {
    arr[i] = arr[i].value;
  }
};


/**
 * Sort the specified array into ascending order based on item keys
 * returned by the specified key function.
 * If no opt_compareFn is specified, the keys are compared in ascending order
 * using <code>goog.array.defaultCompare</code>.
 *
 * Runtime: O(S(f(n)), where S is runtime of <code>goog.array.sort</code>
 * and f(n) is runtime of the key function.
 *
 * @param {Array<T>} arr The array to be sorted.
 * @param {function(T): K} keyFn Function taking array element and returning
 *     a key used for sorting this element.
 * @param {?function(K, K): number=} opt_compareFn Optional comparison function
 *     by which the keys are to be ordered. Should take 2 arguments to compare,
 *     and return a negative number, zero, or a positive number depending on
 *     whether the first argument is less than, equal to, or greater than the
 *     second.
 * @template T,K
 */
goog.array.sortByKey = function(arr, keyFn, opt_compareFn) {
  var keyCompareFn = opt_compareFn || goog.array.defaultCompare;
  goog.array.sort(arr, function(a, b) {
    return keyCompareFn(keyFn(a), keyFn(b));
  });
};


/**
 * Sorts an array of objects by the specified object key and compare
 * function. If no compare function is provided, the key values are
 * compared in ascending order using <code>goog.array.defaultCompare</code>.
 * This won't work for keys that get renamed by the compiler. So use
 * {'foo': 1, 'bar': 2} rather than {foo: 1, bar: 2}.
 * @param {Array<Object>} arr An array of objects to sort.
 * @param {string} key The object key to sort by.
 * @param {Function=} opt_compareFn The function to use to compare key
 *     values.
 */
goog.array.sortObjectsByKey = function(arr, key, opt_compareFn) {
  goog.array.sortByKey(arr,
      function(obj) { return obj[key]; },
      opt_compareFn);
};


/**
 * Tells if the array is sorted.
 * @param {!Array<T>} arr The array.
 * @param {?function(T,T):number=} opt_compareFn Function to compare the
 *     array elements.
 *     Should take 2 arguments to compare, and return a negative number, zero,
 *     or a positive number depending on whether the first argument is less
 *     than, equal to, or greater than the second.
 * @param {boolean=} opt_strict If true no equal elements are allowed.
 * @return {boolean} Whether the array is sorted.
 * @template T
 */
goog.array.isSorted = function(arr, opt_compareFn, opt_strict) {
  var compare = opt_compareFn || goog.array.defaultCompare;
  for (var i = 1; i < arr.length; i++) {
    var compareResult = compare(arr[i - 1], arr[i]);
    if (compareResult > 0 || compareResult == 0 && opt_strict) {
      return false;
    }
  }
  return true;
};


/**
 * Compares two arrays for equality. Two arrays are considered equal if they
 * have the same length and their corresponding elements are equal according to
 * the comparison function.
 *
 * @param {goog.array.ArrayLike} arr1 The first array to compare.
 * @param {goog.array.ArrayLike} arr2 The second array to compare.
 * @param {Function=} opt_equalsFn Optional comparison function.
 *     Should take 2 arguments to compare, and return true if the arguments
 *     are equal. Defaults to {@link goog.array.defaultCompareEquality} which
 *     compares the elements using the built-in '===' operator.
 * @return {boolean} Whether the two arrays are equal.
 */
goog.array.equals = function(arr1, arr2, opt_equalsFn) {
  if (!goog.isArrayLike(arr1) || !goog.isArrayLike(arr2) ||
      arr1.length != arr2.length) {
    return false;
  }
  var l = arr1.length;
  var equalsFn = opt_equalsFn || goog.array.defaultCompareEquality;
  for (var i = 0; i < l; i++) {
    if (!equalsFn(arr1[i], arr2[i])) {
      return false;
    }
  }
  return true;
};


/**
 * 3-way array compare function.
 * @param {!Array<VALUE>|!goog.array.ArrayLike} arr1 The first array to
 *     compare.
 * @param {!Array<VALUE>|!goog.array.ArrayLike} arr2 The second array to
 *     compare.
 * @param {function(VALUE, VALUE): number=} opt_compareFn Optional comparison
 *     function by which the array is to be ordered. Should take 2 arguments to
 *     compare, and return a negative number, zero, or a positive number
 *     depending on whether the first argument is less than, equal to, or
 *     greater than the second.
 * @return {number} Negative number, zero, or a positive number depending on
 *     whether the first argument is less than, equal to, or greater than the
 *     second.
 * @template VALUE
 */
goog.array.compare3 = function(arr1, arr2, opt_compareFn) {
  var compare = opt_compareFn || goog.array.defaultCompare;
  var l = Math.min(arr1.length, arr2.length);
  for (var i = 0; i < l; i++) {
    var result = compare(arr1[i], arr2[i]);
    if (result != 0) {
      return result;
    }
  }
  return goog.array.defaultCompare(arr1.length, arr2.length);
};


/**
 * Compares its two arguments for order, using the built in < and >
 * operators.
 * @param {VALUE} a The first object to be compared.
 * @param {VALUE} b The second object to be compared.
 * @return {number} A negative number, zero, or a positive number as the first
 *     argument is less than, equal to, or greater than the second,
 *     respectively.
 * @template VALUE
 */
goog.array.defaultCompare = function(a, b) {
  return a > b ? 1 : a < b ? -1 : 0;
};


/**
 * Compares its two arguments for inverse order, using the built in < and >
 * operators.
 * @param {VALUE} a The first object to be compared.
 * @param {VALUE} b The second object to be compared.
 * @return {number} A negative number, zero, or a positive number as the first
 *     argument is greater than, equal to, or less than the second,
 *     respectively.
 * @template VALUE
 */
goog.array.inverseDefaultCompare = function(a, b) {
  return -goog.array.defaultCompare(a, b);
};


/**
 * Compares its two arguments for equality, using the built in === operator.
 * @param {*} a The first object to compare.
 * @param {*} b The second object to compare.
 * @return {boolean} True if the two arguments are equal, false otherwise.
 */
goog.array.defaultCompareEquality = function(a, b) {
  return a === b;
};


/**
 * Inserts a value into a sorted array. The array is not modified if the
 * value is already present.
 * @param {Array<VALUE>|goog.array.ArrayLike} array The array to modify.
 * @param {VALUE} value The object to insert.
 * @param {function(VALUE, VALUE): number=} opt_compareFn Optional comparison
 *     function by which the array is ordered. Should take 2 arguments to
 *     compare, and return a negative number, zero, or a positive number
 *     depending on whether the first argument is less than, equal to, or
 *     greater than the second.
 * @return {boolean} True if an element was inserted.
 * @template VALUE
 */
goog.array.binaryInsert = function(array, value, opt_compareFn) {
  var index = goog.array.binarySearch(array, value, opt_compareFn);
  if (index < 0) {
    goog.array.insertAt(array, value, -(index + 1));
    return true;
  }
  return false;
};


/**
 * Removes a value from a sorted array.
 * @param {!Array<VALUE>|!goog.array.ArrayLike} array The array to modify.
 * @param {VALUE} value The object to remove.
 * @param {function(VALUE, VALUE): number=} opt_compareFn Optional comparison
 *     function by which the array is ordered. Should take 2 arguments to
 *     compare, and return a negative number, zero, or a positive number
 *     depending on whether the first argument is less than, equal to, or
 *     greater than the second.
 * @return {boolean} True if an element was removed.
 * @template VALUE
 */
goog.array.binaryRemove = function(array, value, opt_compareFn) {
  var index = goog.array.binarySearch(array, value, opt_compareFn);
  return (index >= 0) ? goog.array.removeAt(array, index) : false;
};


/**
 * Splits an array into disjoint buckets according to a splitting function.
 * @param {Array<T>} array The array.
 * @param {function(this:S, T,number,Array<T>):?} sorter Function to call for
 *     every element.  This takes 3 arguments (the element, the index and the
 *     array) and must return a valid object key (a string, number, etc), or
 *     undefined, if that object should not be placed in a bucket.
 * @param {S=} opt_obj The object to be used as the value of 'this' within
 *     sorter.
 * @return {!Object} An object, with keys being all of the unique return values
 *     of sorter, and values being arrays containing the items for
 *     which the splitter returned that key.
 * @template T,S
 */
goog.array.bucket = function(array, sorter, opt_obj) {
  var buckets = {};

  for (var i = 0; i < array.length; i++) {
    var value = array[i];
    var key = sorter.call(opt_obj, value, i, array);
    if (goog.isDef(key)) {
      // Push the value to the right bucket, creating it if necessary.
      var bucket = buckets[key] || (buckets[key] = []);
      bucket.push(value);
    }
  }

  return buckets;
};


/**
 * Creates a new object built from the provided array and the key-generation
 * function.
 * @param {Array<T>|goog.array.ArrayLike} arr Array or array like object over
 *     which to iterate whose elements will be the values in the new object.
 * @param {?function(this:S, T, number, ?) : string} keyFunc The function to
 *     call for every element. This function takes 3 arguments (the element, the
 *     index and the array) and should return a string that will be used as the
 *     key for the element in the new object. If the function returns the same
 *     key for more than one element, the value for that key is
 *     implementation-defined.
 * @param {S=} opt_obj The object to be used as the value of 'this'
 *     within keyFunc.
 * @return {!Object<T>} The new object.
 * @template T,S
 */
goog.array.toObject = function(arr, keyFunc, opt_obj) {
  var ret = {};
  goog.array.forEach(arr, function(element, index) {
    ret[keyFunc.call(opt_obj, element, index, arr)] = element;
  });
  return ret;
};


/**
 * Creates a range of numbers in an arithmetic progression.
 *
 * Range takes 1, 2, or 3 arguments:
 * <pre>
 * range(5) is the same as range(0, 5, 1) and produces [0, 1, 2, 3, 4]
 * range(2, 5) is the same as range(2, 5, 1) and produces [2, 3, 4]
 * range(-2, -5, -1) produces [-2, -3, -4]
 * range(-2, -5, 1) produces [], since stepping by 1 wouldn't ever reach -5.
 * </pre>
 *
 * @param {number} startOrEnd The starting value of the range if an end argument
 *     is provided. Otherwise, the start value is 0, and this is the end value.
 * @param {number=} opt_end The optional end value of the range.
 * @param {number=} opt_step The step size between range values. Defaults to 1
 *     if opt_step is undefined or 0.
 * @return {!Array<number>} An array of numbers for the requested range. May be
 *     an empty array if adding the step would not converge toward the end
 *     value.
 */
goog.array.range = function(startOrEnd, opt_end, opt_step) {
  var array = [];
  var start = 0;
  var end = startOrEnd;
  var step = opt_step || 1;
  if (opt_end !== undefined) {
    start = startOrEnd;
    end = opt_end;
  }

  if (step * (end - start) < 0) {
    // Sign mismatch: start + step will never reach the end value.
    return [];
  }

  if (step > 0) {
    for (var i = start; i < end; i += step) {
      array.push(i);
    }
  } else {
    for (var i = start; i > end; i += step) {
      array.push(i);
    }
  }
  return array;
};


/**
 * Returns an array consisting of the given value repeated N times.
 *
 * @param {VALUE} value The value to repeat.
 * @param {number} n The repeat count.
 * @return {!Array<VALUE>} An array with the repeated value.
 * @template VALUE
 */
goog.array.repeat = function(value, n) {
  var array = [];
  for (var i = 0; i < n; i++) {
    array[i] = value;
  }
  return array;
};


/**
 * Returns an array consisting of every argument with all arrays
 * expanded in-place recursively.
 *
 * @param {...*} var_args The values to flatten.
 * @return {!Array<?>} An array containing the flattened values.
 */
goog.array.flatten = function(var_args) {
  var CHUNK_SIZE = 8192;

  var result = [];
  for (var i = 0; i < arguments.length; i++) {
    var element = arguments[i];
    if (goog.isArray(element)) {
      for (var c = 0; c < element.length; c += CHUNK_SIZE) {
        var chunk = goog.array.slice(element, c, c + CHUNK_SIZE);
        var recurseResult = goog.array.flatten.apply(null, chunk);
        for (var r = 0; r < recurseResult.length; r++) {
          result.push(recurseResult[r]);
        }
      }
    } else {
      result.push(element);
    }
  }
  return result;
};


/**
 * Rotates an array in-place. After calling this method, the element at
 * index i will be the element previously at index (i - n) %
 * array.length, for all values of i between 0 and array.length - 1,
 * inclusive.
 *
 * For example, suppose list comprises [t, a, n, k, s]. After invoking
 * rotate(array, 1) (or rotate(array, -4)), array will comprise [s, t, a, n, k].
 *
 * @param {!Array<T>} array The array to rotate.
 * @param {number} n The amount to rotate.
 * @return {!Array<T>} The array.
 * @template T
 */
goog.array.rotate = function(array, n) {
  goog.asserts.assert(array.length != null);

  if (array.length) {
    n %= array.length;
    if (n > 0) {
      goog.array.ARRAY_PROTOTYPE_.unshift.apply(array, array.splice(-n, n));
    } else if (n < 0) {
      goog.array.ARRAY_PROTOTYPE_.push.apply(array, array.splice(0, -n));
    }
  }
  return array;
};


/**
 * Moves one item of an array to a new position keeping the order of the rest
 * of the items. Example use case: keeping a list of JavaScript objects
 * synchronized with the corresponding list of DOM elements after one of the
 * elements has been dragged to a new position.
 * @param {!(Array|Arguments|{length:number})} arr The array to modify.
 * @param {number} fromIndex Index of the item to move between 0 and
 *     {@code arr.length - 1}.
 * @param {number} toIndex Target index between 0 and {@code arr.length - 1}.
 */
goog.array.moveItem = function(arr, fromIndex, toIndex) {
  goog.asserts.assert(fromIndex >= 0 && fromIndex < arr.length);
  goog.asserts.assert(toIndex >= 0 && toIndex < arr.length);
  // Remove 1 item at fromIndex.
  var removedItems = goog.array.ARRAY_PROTOTYPE_.splice.call(arr, fromIndex, 1);
  // Insert the removed item at toIndex.
  goog.array.ARRAY_PROTOTYPE_.splice.call(arr, toIndex, 0, removedItems[0]);
  // We don't use goog.array.insertAt and goog.array.removeAt, because they're
  // significantly slower than splice.
};


/**
 * Creates a new array for which the element at position i is an array of the
 * ith element of the provided arrays.  The returned array will only be as long
 * as the shortest array provided; additional values are ignored.  For example,
 * the result of zipping [1, 2] and [3, 4, 5] is [[1,3], [2, 4]].
 *
 * This is similar to the zip() function in Python.  See {@link
 * http://docs.python.org/library/functions.html#zip}
 *
 * @param {...!goog.array.ArrayLike} var_args Arrays to be combined.
 * @return {!Array<!Array<?>>} A new array of arrays created from
 *     provided arrays.
 */
goog.array.zip = function(var_args) {
  if (!arguments.length) {
    return [];
  }
  var result = [];
  for (var i = 0; true; i++) {
    var value = [];
    for (var j = 0; j < arguments.length; j++) {
      var arr = arguments[j];
      // If i is larger than the array length, this is the shortest array.
      if (i >= arr.length) {
        return result;
      }
      value.push(arr[i]);
    }
    result.push(value);
  }
};


/**
 * Shuffles the values in the specified array using the Fisher-Yates in-place
 * shuffle (also known as the Knuth Shuffle). By default, calls Math.random()
 * and so resets the state of that random number generator. Similarly, may reset
 * the state of the any other specified random number generator.
 *
 * Runtime: O(n)
 *
 * @param {!Array<?>} arr The array to be shuffled.
 * @param {function():number=} opt_randFn Optional random function to use for
 *     shuffling.
 *     Takes no arguments, and returns a random number on the interval [0, 1).
 *     Defaults to Math.random() using JavaScript's built-in Math library.
 */
goog.array.shuffle = function(arr, opt_randFn) {
  var randFn = opt_randFn || Math.random;

  for (var i = arr.length - 1; i > 0; i--) {
    // Choose a random array index in [0, i] (inclusive with i).
    var j = Math.floor(randFn() * (i + 1));

    var tmp = arr[i];
    arr[i] = arr[j];
    arr[j] = tmp;
  }
};


/**
 * Returns a new array of elements from arr, based on the indexes of elements
 * provided by index_arr. For example, the result of index copying
 * ['a', 'b', 'c'] with index_arr [1,0,0,2] is ['b', 'a', 'a', 'c'].
 *
 * @param {!Array<T>} arr The array to get a indexed copy from.
 * @param {!Array<number>} index_arr An array of indexes to get from arr.
 * @return {!Array<T>} A new array of elements from arr in index_arr order.
 * @template T
 */
goog.array.copyByIndex = function(arr, index_arr) {
  var result = [];
  goog.array.forEach(index_arr, function(index) {
    result.push(arr[index]);
  });
  return result;
};
// Copyright 2008 The Closure Library Authors. All Rights Reserved.
//
// Licensed under the Apache License, Version 2.0 (the "License");
// you may not use this file except in compliance with the License.
// You may obtain a copy of the License at
//
//      http://www.apache.org/licenses/LICENSE-2.0
//
// Unless required by applicable law or agreed to in writing, software
// distributed under the License is distributed on an "AS-IS" BASIS,
// WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
// See the License for the specific language governing permissions and
// limitations under the License.

/**
 * @fileoverview Protocol Buffer (Message) Descriptor class.
 */

goog.proto2 = {};

goog.require('goog.array');
goog.require('goog.asserts');
goog.require('goog.object');
goog.require('goog.string');


/**
 * @typedef {{name: (string|undefined),
 *            fullName: (string|undefined),
 *            containingType: (goog.proto2.Message|undefined)}}
 */
goog.proto2.Metadata;



/**
 * A class which describes a Protocol Buffer 2 Message.
 *
 * @param {function(new:goog.proto2.Message)} messageType Constructor for
 *      the message class that this descriptor describes.
 * @param {!goog.proto2.Metadata} metadata The metadata about the message that
 *      will be used to construct this descriptor.
 * @param {Array<!goog.proto2.FieldDescriptor>} fields The fields of the
 *      message described by this descriptor.
 *
 * @constructor
 * @final
 */
goog.proto2.Descriptor = function(messageType, metadata, fields) {

  /**
   * @type {function(new:goog.proto2.Message)}
   * @private
   */
  this.messageType_ = messageType;

  /**
   * @type {?string}
   * @private
   */
  this.name_ = metadata.name || null;

  /**
   * @type {?string}
   * @private
   */
  this.fullName_ = metadata.fullName || null;

  /**
   * @type {goog.proto2.Message|undefined}
   * @private
   */
  this.containingType_ = metadata.containingType;

  /**
   * The fields of the message described by this descriptor.
   * @type {!Object<number, !goog.proto2.FieldDescriptor>}
   * @private
   */
  this.fields_ = {};

  for (var i = 0; i < fields.length; i++) {
    var field = fields[i];
    this.fields_[field.getTag()] = field;
  }
};


/**
 * Returns the name of the message, if any.
 *
 * @return {?string} The name.
 */
goog.proto2.Descriptor.prototype.getName = function() {
  return this.name_;
};


/**
 * Returns the full name of the message, if any.
 *
 * @return {?string} The name.
 */
goog.proto2.Descriptor.prototype.getFullName = function() {
  return this.fullName_;
};


/**
 * Returns the descriptor of the containing message type or null if none.
 *
 * @return {goog.proto2.Descriptor} The descriptor.
 */
goog.proto2.Descriptor.prototype.getContainingType = function() {
  if (!this.containingType_) {
    return null;
  }

  return this.containingType_.getDescriptor();
};


/**
 * Returns the fields in the message described by this descriptor ordered by
 * tag.
 *
 * @return {!Array<!goog.proto2.FieldDescriptor>} The array of field
 *     descriptors.
 */
goog.proto2.Descriptor.prototype.getFields = function() {
  /**
   * @param {!goog.proto2.FieldDescriptor} fieldA First field.
   * @param {!goog.proto2.FieldDescriptor} fieldB Second field.
   * @return {number} Negative if fieldA's tag number is smaller, positive
   *     if greater, zero if the same.
   */
  function tagComparator(fieldA, fieldB) {
    return fieldA.getTag() - fieldB.getTag();
  };

  var fields = goog.object.getValues(this.fields_);
  goog.array.sort(fields, tagComparator);

  return fields;
};


/**
 * Returns the fields in the message as a key/value map, where the key is
 * the tag number of the field. DO NOT MODIFY THE RETURNED OBJECT. We return
 * the actual, internal, fields map for performance reasons, and changing the
 * map can result in undefined behavior of this library.
 *
 * @return {!Object<number, !goog.proto2.FieldDescriptor>} The field map.
 */
goog.proto2.Descriptor.prototype.getFieldsMap = function() {
  return this.fields_;
};


/**
 * Returns the field matching the given name, if any. Note that
 * this method searches over the *original* name of the field,
 * not the camelCase version.
 *
 * @param {string} name The field name for which to search.
 *
 * @return {goog.proto2.FieldDescriptor} The field found, if any.
 */
goog.proto2.Descriptor.prototype.findFieldByName = function(name) {
  var valueFound = goog.object.findValue(this.fields_,
      function(field, key, obj) {
        return field.getName() == name;
      });

  return /** @type {goog.proto2.FieldDescriptor} */ (valueFound) || null;
};


/**
 * Returns the field matching the given tag number, if any.
 *
 * @param {number|string} tag The field tag number for which to search.
 *
 * @return {goog.proto2.FieldDescriptor} The field found, if any.
 */
goog.proto2.Descriptor.prototype.findFieldByTag = function(tag) {
  goog.asserts.assert(goog.string.isNumeric(tag));
  return this.fields_[parseInt(tag, 10)] || null;
};


/**
 * Creates an instance of the message type that this descriptor
 * describes.
 *
 * @return {!goog.proto2.Message} The instance of the message.
 */
goog.proto2.Descriptor.prototype.createMessageInstance = function() {
  return new this.messageType_;
};
// Copyright 2008 The Closure Library Authors. All Rights Reserved.
//
// Licensed under the Apache License, Version 2.0 (the "License");
// you may not use this file except in compliance with the License.
// You may obtain a copy of the License at
//
//      http://www.apache.org/licenses/LICENSE-2.0
//
// Unless required by applicable law or agreed to in writing, software
// distributed under the License is distributed on an "AS-IS" BASIS,
// WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
// See the License for the specific language governing permissions and
// limitations under the License.

/**
 * @fileoverview Protocol Buffer Field Descriptor class.
 */

goog.require('goog.asserts');
goog.require('goog.string');



/**
 * A class which describes a field in a Protocol Buffer 2 Message.
 *
 * @param {function(new:goog.proto2.Message)} messageType Constructor for the
 *     message class to which the field described by this class belongs.
 * @param {number|string} tag The field's tag index.
 * @param {Object} metadata The metadata about this field that will be used
 *     to construct this descriptor.
 *
 * @constructor
 * @final
 */
goog.proto2.FieldDescriptor = function(messageType, tag, metadata) {
  /**
   * The message type that contains the field that this
   * descriptor describes.
   * @private {function(new:goog.proto2.Message)}
   */
  this.parent_ = messageType;

  // Ensure that the tag is numeric.
  goog.asserts.assert(goog.string.isNumeric(tag));

  /**
   * The field's tag number.
   * @private {number}
   */
  this.tag_ = /** @type {number} */ (tag);

  /**
   * The field's name.
   * @private {string}
   */
  this.name_ = metadata.name;

  /** @type {goog.proto2.FieldDescriptor.FieldType} */
  metadata.fieldType;

  /** @type {*} */
  metadata.repeated;

  /** @type {*} */
  metadata.required;

  /** @type {*} */
  metadata.packed;

  /**
   * If true, this field is a packed field.
   * @private {boolean}
   */
  this.isPacked_ = !!metadata.packed;

  /**
   * If true, this field is a repeating field.
   * @private {boolean}
   */
  this.isRepeated_ = !!metadata.repeated;

  /**
   * If true, this field is required.
   * @private {boolean}
   */
  this.isRequired_ = !!metadata.required;

  /**
   * The field type of this field.
   * @private {goog.proto2.FieldDescriptor.FieldType}
   */
  this.fieldType_ = metadata.fieldType;

  /**
   * If this field is a primitive: The native (ECMAScript) type of this field.
   * If an enumeration: The enumeration object.
   * If a message or group field: The Message function.
   * @private {Function}
   */
  this.nativeType_ = metadata.type;

  /**
   * Is it permissible on deserialization to convert between numbers and
   * well-formed strings?  Is true for 64-bit integral field types and float and
   * double types, false for all other field types.
   * @private {boolean}
   */
  this.deserializationConversionPermitted_ = false;

  switch (this.fieldType_) {
    case goog.proto2.FieldDescriptor.FieldType.INT64:
    case goog.proto2.FieldDescriptor.FieldType.UINT64:
    case goog.proto2.FieldDescriptor.FieldType.FIXED64:
    case goog.proto2.FieldDescriptor.FieldType.SFIXED64:
    case goog.proto2.FieldDescriptor.FieldType.SINT64:
    case goog.proto2.FieldDescriptor.FieldType.FLOAT:
    case goog.proto2.FieldDescriptor.FieldType.DOUBLE:
      this.deserializationConversionPermitted_ = true;
      break;
  }

  /**
   * The default value of this field, if different from the default, default
   * value.
   * @private {*}
   */
  this.defaultValue_ = metadata.defaultValue;
};


/**
 * An enumeration defining the possible field types.
 * Should be a mirror of that defined in descriptor.h.
 *
 * @enum {number}
 */
goog.proto2.FieldDescriptor.FieldType = {
  DOUBLE: 1,
  FLOAT: 2,
  INT64: 3,
  UINT64: 4,
  INT32: 5,
  FIXED64: 6,
  FIXED32: 7,
  BOOL: 8,
  STRING: 9,
  GROUP: 10,
  MESSAGE: 11,
  BYTES: 12,
  UINT32: 13,
  ENUM: 14,
  SFIXED32: 15,
  SFIXED64: 16,
  SINT32: 17,
  SINT64: 18
};


/**
 * Returns the tag of the field that this descriptor represents.
 *
 * @return {number} The tag number.
 */
goog.proto2.FieldDescriptor.prototype.getTag = function() {
  return this.tag_;
};


/**
 * Returns the descriptor describing the message that defined this field.
 * @return {!goog.proto2.Descriptor} The descriptor.
 */
goog.proto2.FieldDescriptor.prototype.getContainingType = function() {
  // Generated JS proto_library messages have getDescriptor() method which can
  // be called with or without an instance.
  return this.parent_.prototype.getDescriptor();
};


/**
 * Returns the name of the field that this descriptor represents.
 * @return {string} The name.
 */
goog.proto2.FieldDescriptor.prototype.getName = function() {
  return this.name_;
};


/**
 * Returns the default value of this field.
 * @return {*} The default value.
 */
goog.proto2.FieldDescriptor.prototype.getDefaultValue = function() {
  if (this.defaultValue_ === undefined) {
    // Set the default value based on a new instance of the native type.
    // This will be (0, false, "") for (number, boolean, string) and will
    // be a new instance of a group/message if the field is a message type.
    var nativeType = this.nativeType_;
    if (nativeType === Boolean) {
      this.defaultValue_ = false;
    } else if (nativeType === Number) {
      this.defaultValue_ = 0;
    } else if (nativeType === String) {
      if (this.deserializationConversionPermitted_) {
        // This field is a 64 bit integer represented as a string.
        this.defaultValue_ = '0';
      } else {
        this.defaultValue_ = '';
      }
    } else {
      return new nativeType;
    }
  }

  return this.defaultValue_;
};


/**
 * Returns the field type of the field described by this descriptor.
 * @return {goog.proto2.FieldDescriptor.FieldType} The field type.
 */
goog.proto2.FieldDescriptor.prototype.getFieldType = function() {
  return this.fieldType_;
};


/**
 * Returns the native (i.e. ECMAScript) type of the field described by this
 * descriptor.
 *
 * @return {Object} The native type.
 */
goog.proto2.FieldDescriptor.prototype.getNativeType = function() {
  return this.nativeType_;
};


/**
 * Returns true if simple conversions between numbers and strings are permitted
 * during deserialization for this field.
 *
 * @return {boolean} Whether conversion is permitted.
 */
goog.proto2.FieldDescriptor.prototype.deserializationConversionPermitted =
    function() {
  return this.deserializationConversionPermitted_;
};


/**
 * Returns the descriptor of the message type of this field. Only valid
 * for fields of type GROUP and MESSAGE.
 *
 * @return {!goog.proto2.Descriptor} The message descriptor.
 */
goog.proto2.FieldDescriptor.prototype.getFieldMessageType = function() {
  // Generated JS proto_library messages have getDescriptor() method which can
  // be called with or without an instance.
  var messageClass = /** @type {function(new:goog.proto2.Message)} */(
      this.nativeType_);
  return messageClass.prototype.getDescriptor();
};


/**
 * @return {boolean} True if the field stores composite data or repeated
 *     composite data (message or group).
 */
goog.proto2.FieldDescriptor.prototype.isCompositeType = function() {
  return this.fieldType_ == goog.proto2.FieldDescriptor.FieldType.MESSAGE ||
      this.fieldType_ == goog.proto2.FieldDescriptor.FieldType.GROUP;
};


/**
 * Returns whether the field described by this descriptor is packed.
 * @return {boolean} Whether the field is packed.
 */
goog.proto2.FieldDescriptor.prototype.isPacked = function() {
  return this.isPacked_;
};


/**
 * Returns whether the field described by this descriptor is repeating.
 * @return {boolean} Whether the field is repeated.
 */
goog.proto2.FieldDescriptor.prototype.isRepeated = function() {
  return this.isRepeated_;
};


/**
 * Returns whether the field described by this descriptor is required.
 * @return {boolean} Whether the field is required.
 */
goog.proto2.FieldDescriptor.prototype.isRequired = function() {
  return this.isRequired_;
};


/**
 * Returns whether the field described by this descriptor is optional.
 * @return {boolean} Whether the field is optional.
 */
goog.proto2.FieldDescriptor.prototype.isOptional = function() {
  return !this.isRepeated_ && !this.isRequired_;
};
// Copyright 2008 The Closure Library Authors. All Rights Reserved.
//
// Licensed under the Apache License, Version 2.0 (the "License");
// you may not use this file except in compliance with the License.
// You may obtain a copy of the License at
//
//      http://www.apache.org/licenses/LICENSE-2.0
//
// Unless required by applicable law or agreed to in writing, software
// distributed under the License is distributed on an "AS-IS" BASIS,
// WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
// See the License for the specific language governing permissions and
// limitations under the License.

/**
 * @fileoverview Protocol Buffer Message base class.
 */

goog.require('goog.asserts');
goog.require('goog.proto2.Descriptor');
goog.require('goog.proto2.FieldDescriptor');



/**
 * Abstract base class for all Protocol Buffer 2 messages. It will be
 * subclassed in the code generated by the Protocol Compiler. Any other
 * subclasses are prohibited.
 * @constructor
 */
goog.proto2.Message = function() {
  /**
   * Stores the field values in this message. Keyed by the tag of the fields.
   * @type {*}
   * @private
   */
  this.values_ = {};

  /**
   * Stores the field information (i.e. metadata) about this message.
   * @type {Object<number, !goog.proto2.FieldDescriptor>}
   * @private
   */
  this.fields_ = this.getDescriptor().getFieldsMap();

  /**
   * The lazy deserializer for this message instance, if any.
   * @type {goog.proto2.LazyDeserializer}
   * @private
   */
  this.lazyDeserializer_ = null;

  /**
   * A map of those fields deserialized, from tag number to their deserialized
   * value.
   * @type {Object}
   * @private
   */
  this.deserializedFields_ = null;
};


/**
 * An enumeration defining the possible field types.
 * Should be a mirror of that defined in descriptor.h.
 *
 * TODO(user): Remove this alias.  The code generator generates code that
 * references this enum, so it needs to exist until the code generator is
 * changed.  The enum was moved to from Message to FieldDescriptor to avoid a
 * dependency cycle.
 *
 * Use goog.proto2.FieldDescriptor.FieldType instead.
 *
 * @enum {number}
 */
goog.proto2.Message.FieldType = {
  DOUBLE: 1,
  FLOAT: 2,
  INT64: 3,
  UINT64: 4,
  INT32: 5,
  FIXED64: 6,
  FIXED32: 7,
  BOOL: 8,
  STRING: 9,
  GROUP: 10,
  MESSAGE: 11,
  BYTES: 12,
  UINT32: 13,
  ENUM: 14,
  SFIXED32: 15,
  SFIXED64: 16,
  SINT32: 17,
  SINT64: 18
};


/**
 * All instances of goog.proto2.Message should have a static descriptor_
 * property. The Descriptor will be deserialized lazily in the getDescriptor()
 * method.
 *
 * This declaration is just here for documentation purposes.
 * goog.proto2.Message does not have its own descriptor.
 *
 * @type {undefined}
 * @private
 */
goog.proto2.Message.descriptor_;


/**
 * Initializes the message with a lazy deserializer and its associated data.
 * This method should be called by internal methods ONLY.
 *
 * @param {goog.proto2.LazyDeserializer} deserializer The lazy deserializer to
 *   use to decode the data on the fly.
 *
 * @param {*} data The data to decode/deserialize.
 */
goog.proto2.Message.prototype.initializeForLazyDeserializer = function(
    deserializer, data) {

  this.lazyDeserializer_ = deserializer;
  this.values_ = data;
  this.deserializedFields_ = {};
};


/**
 * Sets the value of an unknown field, by tag.
 *
 * @param {number} tag The tag of an unknown field (must be >= 1).
 * @param {*} value The value for that unknown field.
 */
goog.proto2.Message.prototype.setUnknown = function(tag, value) {
  goog.asserts.assert(!this.fields_[tag],
      'Field is not unknown in this message');
  goog.asserts.assert(tag >= 1, 'Tag is not valid');
  goog.asserts.assert(value !== null, 'Value cannot be null');

  this.values_[tag] = value;
  if (this.deserializedFields_) {
    delete this.deserializedFields_[tag];
  }
};


/**
 * Iterates over all the unknown fields in the message.
 *
 * @param {function(number, *)} callback A callback method
 *     which gets invoked for each unknown field.
 * @param {Object=} opt_scope The scope under which to execute the callback.
 *     If not given, the current message will be used.
 */
goog.proto2.Message.prototype.forEachUnknown = function(callback, opt_scope) {
  var scope = opt_scope || this;
  for (var key in this.values_) {
    var keyNum = Number(key);
    if (!this.fields_[keyNum]) {
      callback.call(scope, keyNum, this.values_[key]);
    }
  }
};


/**
 * Returns the descriptor which describes the current message.
 *
 * This only works if we assume people never subclass protobufs.
 *
 * @return {!goog.proto2.Descriptor} The descriptor.
 */
goog.proto2.Message.prototype.getDescriptor = goog.abstractMethod;


/**
 * Returns whether there is a value stored at the field specified by the
 * given field descriptor.
 *
 * @param {goog.proto2.FieldDescriptor} field The field for which to check
 *     if there is a value.
 *
 * @return {boolean} True if a value was found.
 */
goog.proto2.Message.prototype.has = function(field) {
  goog.asserts.assert(
      field.getContainingType() == this.getDescriptor(),
      'The current message does not contain the given field');

  return this.has$Value(field.getTag());
};


/**
 * Returns the array of values found for the given repeated field.
 *
 * @param {goog.proto2.FieldDescriptor} field The field for which to
 *     return the values.
 *
 * @return {!Array<?>} The values found.
 */
goog.proto2.Message.prototype.arrayOf = function(field) {
  goog.asserts.assert(
      field.getContainingType() == this.getDescriptor(),
      'The current message does not contain the given field');

  return this.array$Values(field.getTag());
};


/**
 * Returns the number of values stored in the given field.
 *
 * @param {goog.proto2.FieldDescriptor} field The field for which to count
 *     the number of values.
 *
 * @return {number} The count of the values in the given field.
 */
goog.proto2.Message.prototype.countOf = function(field) {
  goog.asserts.assert(
      field.getContainingType() == this.getDescriptor(),
      'The current message does not contain the given field');

  return this.count$Values(field.getTag());
};


/**
 * Returns the value stored at the field specified by the
 * given field descriptor.
 *
 * @param {goog.proto2.FieldDescriptor} field The field for which to get the
 *     value.
 * @param {number=} opt_index If the field is repeated, the index to use when
 *     looking up the value.
 *
 * @return {*} The value found or null if none.
 */
goog.proto2.Message.prototype.get = function(field, opt_index) {
  goog.asserts.assert(
      field.getContainingType() == this.getDescriptor(),
      'The current message does not contain the given field');

  return this.get$Value(field.getTag(), opt_index);
};


/**
 * Returns the value stored at the field specified by the
 * given field descriptor or the default value if none exists.
 *
 * @param {goog.proto2.FieldDescriptor} field The field for which to get the
 *     value.
 * @param {number=} opt_index If the field is repeated, the index to use when
 *     looking up the value.
 *
 * @return {*} The value found or the default if none.
 */
goog.proto2.Message.prototype.getOrDefault = function(field, opt_index) {
  goog.asserts.assert(
      field.getContainingType() == this.getDescriptor(),
      'The current message does not contain the given field');

  return this.get$ValueOrDefault(field.getTag(), opt_index);
};


/**
 * Stores the given value to the field specified by the
 * given field descriptor. Note that the field must not be repeated.
 *
 * @param {goog.proto2.FieldDescriptor} field The field for which to set
 *     the value.
 * @param {*} value The new value for the field.
 */
goog.proto2.Message.prototype.set = function(field, value) {
  goog.asserts.assert(
      field.getContainingType() == this.getDescriptor(),
      'The current message does not contain the given field');

  this.set$Value(field.getTag(), value);
};


/**
 * Adds the given value to the field specified by the
 * given field descriptor. Note that the field must be repeated.
 *
 * @param {goog.proto2.FieldDescriptor} field The field in which to add the
 *     the value.
 * @param {*} value The new value to add to the field.
 */
goog.proto2.Message.prototype.add = function(field, value) {
  goog.asserts.assert(
      field.getContainingType() == this.getDescriptor(),
      'The current message does not contain the given field');

  this.add$Value(field.getTag(), value);
};


/**
 * Clears the field specified.
 *
 * @param {goog.proto2.FieldDescriptor} field The field to clear.
 */
goog.proto2.Message.prototype.clear = function(field) {
  goog.asserts.assert(
      field.getContainingType() == this.getDescriptor(),
      'The current message does not contain the given field');

  this.clear$Field(field.getTag());
};


/**
 * Compares this message with another one ignoring the unknown fields.
 * @param {*} other The other message.
 * @return {boolean} Whether they are equal. Returns false if the {@code other}
 *     argument is a different type of message or not a message.
 */
goog.proto2.Message.prototype.equals = function(other) {
  if (!other || this.constructor != other.constructor) {
    return false;
  }

  var fields = this.getDescriptor().getFields();
  for (var i = 0; i < fields.length; i++) {
    var field = fields[i];
    var tag = field.getTag();
    if (this.has$Value(tag) != other.has$Value(tag)) {
      return false;
    }

    if (this.has$Value(tag)) {
      var isComposite = field.isCompositeType();

      var fieldsEqual = function(value1, value2) {
        return isComposite ? value1.equals(value2) : value1 == value2;
      };

      var thisValue = this.getValueForTag_(tag);
      var otherValue = other.getValueForTag_(tag);

      if (field.isRepeated()) {
        // In this case thisValue and otherValue are arrays.
        if (thisValue.length != otherValue.length) {
          return false;
        }
        for (var j = 0; j < thisValue.length; j++) {
          if (!fieldsEqual(thisValue[j], otherValue[j])) {
            return false;
          }
        }
      } else if (!fieldsEqual(thisValue, otherValue)) {
        return false;
      }
    }
  }

  return true;
};


/**
 * Recursively copies the known fields from the given message to this message.
 * Removes the fields which are not present in the source message.
 * @param {!goog.proto2.Message} message The source message.
 */
goog.proto2.Message.prototype.copyFrom = function(message) {
  goog.asserts.assert(this.constructor == message.constructor,
      'The source message must have the same type.');

  if (this != message) {
    this.values_ = {};
    if (this.deserializedFields_) {
      this.deserializedFields_ = {};
    }
    this.mergeFrom(message);
  }
};


/**
 * Merges the given message into this message.
 *
 * Singular fields will be overwritten, except for embedded messages which will
 * be merged. Repeated fields will be concatenated.
 * @param {!goog.proto2.Message} message The source message.
 */
goog.proto2.Message.prototype.mergeFrom = function(message) {
  goog.asserts.assert(this.constructor == message.constructor,
      'The source message must have the same type.');
  var fields = this.getDescriptor().getFields();

  for (var i = 0; i < fields.length; i++) {
    var field = fields[i];
    var tag = field.getTag();
    if (message.has$Value(tag)) {
      if (this.deserializedFields_) {
        delete this.deserializedFields_[field.getTag()];
      }

      var isComposite = field.isCompositeType();
      if (field.isRepeated()) {
        var values = message.array$Values(tag);
        for (var j = 0; j < values.length; j++) {
          this.add$Value(tag, isComposite ? values[j].clone() : values[j]);
        }
      } else {
        var value = message.getValueForTag_(tag);
        if (isComposite) {
          var child = this.getValueForTag_(tag);
          if (child) {
            child.mergeFrom(value);
          } else {
            this.set$Value(tag, value.clone());
          }
        } else {
          this.set$Value(tag, value);
        }
      }
    }
  }
};


/**
 * @return {!goog.proto2.Message} Recursive clone of the message only including
 *     the known fields.
 */
goog.proto2.Message.prototype.clone = function() {
  /** @type {!goog.proto2.Message} */
  var clone = new this.constructor;
  clone.copyFrom(this);
  return clone;
};


/**
 * Fills in the protocol buffer with default values. Any fields that are
 * already set will not be overridden.
 * @param {boolean} simpleFieldsToo If true, all fields will be initialized;
 *     if false, only the nested messages and groups.
 */
goog.proto2.Message.prototype.initDefaults = function(simpleFieldsToo) {
  var fields = this.getDescriptor().getFields();
  for (var i = 0; i < fields.length; i++) {
    var field = fields[i];
    var tag = field.getTag();
    var isComposite = field.isCompositeType();

    // Initialize missing fields.
    if (!this.has$Value(tag) && !field.isRepeated()) {
      if (isComposite) {
        this.values_[tag] = new /** @type {Function} */ (field.getNativeType());
      } else if (simpleFieldsToo) {
        this.values_[tag] = field.getDefaultValue();
      }
    }

    // Fill in the existing composite fields recursively.
    if (isComposite) {
      if (field.isRepeated()) {
        var values = this.array$Values(tag);
        for (var j = 0; j < values.length; j++) {
          values[j].initDefaults(simpleFieldsToo);
        }
      } else {
        this.get$Value(tag).initDefaults(simpleFieldsToo);
      }
    }
  }
};


/**
 * Returns the whether or not the field indicated by the given tag
 * has a value.
 *
 * GENERATED CODE USE ONLY. Basis of the has{Field} methods.
 *
 * @param {number} tag The tag.
 *
 * @return {boolean} Whether the message has a value for the field.
 */
goog.proto2.Message.prototype.has$Value = function(tag) {
  return this.values_[tag] != null;
};


/**
 * Returns the value for the given tag number. If a lazy deserializer is
 * instantiated, lazily deserializes the field if required before returning the
 * value.
 *
 * @param {number} tag The tag number.
 * @return {*} The corresponding value, if any.
 * @private
 */
goog.proto2.Message.prototype.getValueForTag_ = function(tag) {
  // Retrieve the current value, which may still be serialized.
  var value = this.values_[tag];
  if (!goog.isDefAndNotNull(value)) {
    return null;
  }

  // If we have a lazy deserializer, then ensure that the field is
  // properly deserialized.
  if (this.lazyDeserializer_) {
    // If the tag is not deserialized, then we must do so now. Deserialize
    // the field's value via the deserializer.
    if (!(tag in this.deserializedFields_)) {
      var deserializedValue = this.lazyDeserializer_.deserializeField(
          this, this.fields_[tag], value);
      this.deserializedFields_[tag] = deserializedValue;
      return deserializedValue;
    }

    return this.deserializedFields_[tag];
  }

  // Otherwise, just return the value.
  return value;
};


/**
 * Gets the value at the field indicated by the given tag.
 *
 * GENERATED CODE USE ONLY. Basis of the get{Field} methods.
 *
 * @param {number} tag The field's tag index.
 * @param {number=} opt_index If the field is a repeated field, the index
 *     at which to get the value.
 *
 * @return {*} The value found or null for none.
 * @protected
 */
goog.proto2.Message.prototype.get$Value = function(tag, opt_index) {
  var value = this.getValueForTag_(tag);

  if (this.fields_[tag].isRepeated()) {
    var index = opt_index || 0;
    goog.asserts.assert(
        index >= 0 && index < value.length,
        'Given index %s is out of bounds.  Repeated field length: %s',
        index, value.length);
    return value[index];
  }

  return value;
};


/**
 * Gets the value at the field indicated by the given tag or the default value
 * if none.
 *
 * GENERATED CODE USE ONLY. Basis of the get{Field} methods.
 *
 * @param {number} tag The field's tag index.
 * @param {number=} opt_index If the field is a repeated field, the index
 *     at which to get the value.
 *
 * @return {*} The value found or the default value if none set.
 * @protected
 */
goog.proto2.Message.prototype.get$ValueOrDefault = function(tag, opt_index) {
  if (!this.has$Value(tag)) {
    // Return the default value.
    var field = this.fields_[tag];
    return field.getDefaultValue();
  }

  return this.get$Value(tag, opt_index);
};


/**
 * Gets the values at the field indicated by the given tag.
 *
 * GENERATED CODE USE ONLY. Basis of the {field}Array methods.
 *
 * @param {number} tag The field's tag index.
 *
 * @return {!Array<*>} The values found. If none, returns an empty array.
 * @protected
 */
goog.proto2.Message.prototype.array$Values = function(tag) {
  var value = this.getValueForTag_(tag);
  return /** @type {Array<*>} */ (value) || [];
};


/**
 * Returns the number of values stored in the field by the given tag.
 *
 * GENERATED CODE USE ONLY. Basis of the {field}Count methods.
 *
 * @param {number} tag The tag.
 *
 * @return {number} The number of values.
 * @protected
 */
goog.proto2.Message.prototype.count$Values = function(tag) {
  var field = this.fields_[tag];
  if (field.isRepeated()) {
    return this.has$Value(tag) ? this.values_[tag].length : 0;
  } else {
    return this.has$Value(tag) ? 1 : 0;
  }
};


/**
 * Sets the value of the *non-repeating* field indicated by the given tag.
 *
 * GENERATED CODE USE ONLY. Basis of the set{Field} methods.
 *
 * @param {number} tag The field's tag index.
 * @param {*} value The field's value.
 * @protected
 */
goog.proto2.Message.prototype.set$Value = function(tag, value) {
  if (goog.asserts.ENABLE_ASSERTS) {
    var field = this.fields_[tag];
    this.checkFieldType_(field, value);
  }

  this.values_[tag] = value;
  if (this.deserializedFields_) {
    this.deserializedFields_[tag] = value;
  }
};


/**
 * Adds the value to the *repeating* field indicated by the given tag.
 *
 * GENERATED CODE USE ONLY. Basis of the add{Field} methods.
 *
 * @param {number} tag The field's tag index.
 * @param {*} value The value to add.
 * @protected
 */
goog.proto2.Message.prototype.add$Value = function(tag, value) {
  if (goog.asserts.ENABLE_ASSERTS) {
    var field = this.fields_[tag];
    this.checkFieldType_(field, value);
  }

  if (!this.values_[tag]) {
    this.values_[tag] = [];
  }

  this.values_[tag].push(value);
  if (this.deserializedFields_) {
    delete this.deserializedFields_[tag];
  }
};


/**
 * Ensures that the value being assigned to the given field
 * is valid.
 *
 * @param {!goog.proto2.FieldDescriptor} field The field being assigned.
 * @param {*} value The value being assigned.
 * @private
 */
goog.proto2.Message.prototype.checkFieldType_ = function(field, value) {
  if (field.getFieldType() == goog.proto2.FieldDescriptor.FieldType.ENUM) {
    goog.asserts.assertNumber(value);
  } else {
    goog.asserts.assert(value.constructor == field.getNativeType());
  }
};


/**
 * Clears the field specified by tag.
 *
 * GENERATED CODE USE ONLY. Basis of the clear{Field} methods.
 *
 * @param {number} tag The tag of the field to clear.
 * @protected
 */
goog.proto2.Message.prototype.clear$Field = function(tag) {
  delete this.values_[tag];
  if (this.deserializedFields_) {
    delete this.deserializedFields_[tag];
  }
};


/**
 * Creates the metadata descriptor representing the definition of this message.
 *
 * @param {function(new:goog.proto2.Message)} messageType Constructor for the
 *     message type to which this metadata applies.
 * @param {!Object} metadataObj The object containing the metadata.
 * @return {!goog.proto2.Descriptor} The new descriptor.
 */
goog.proto2.Message.createDescriptor = function(messageType, metadataObj) {
  var fields = [];
  var descriptorInfo = metadataObj[0];

  for (var key in metadataObj) {
    if (key != 0) {
      // Create the field descriptor.
      fields.push(
          new goog.proto2.FieldDescriptor(messageType, key, metadataObj[key]));
    }
  }

  return new goog.proto2.Descriptor(messageType, descriptorInfo, fields);
};
// Copyright 2008 The Closure Library Authors. All Rights Reserved.
//
// Licensed under the Apache License, Version 2.0 (the "License");
// you may not use this file except in compliance with the License.
// You may obtain a copy of the License at
//
//      http://www.apache.org/licenses/LICENSE-2.0
//
// Unless required by applicable law or agreed to in writing, software
// distributed under the License is distributed on an "AS-IS" BASIS,
// WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
// See the License for the specific language governing permissions and
// limitations under the License.

/**
 * @fileoverview Base class for all Protocol Buffer 2 serializers.
 */

goog.require('goog.asserts');
goog.require('goog.proto2.FieldDescriptor');
goog.require('goog.proto2.Message');



/**
 * Abstract base class for PB2 serializers. A serializer is a class which
 * implements the serialization and deserialization of a Protocol Buffer Message
 * to/from a specific format.
 *
 * @constructor
 */
goog.proto2.Serializer = function() {};


/**
 * @define {boolean} Whether to decode and convert symbolic enum values to
 * actual enum values or leave them as strings.
 */
goog.define('goog.proto2.Serializer.DECODE_SYMBOLIC_ENUMS', false);


/**
 * Serializes a message to the expected format.
 *
 * @param {goog.proto2.Message} message The message to be serialized.
 *
 * @return {*} The serialized form of the message.
 */
goog.proto2.Serializer.prototype.serialize = goog.abstractMethod;


/**
 * Returns the serialized form of the given value for the given field if the
 * field is a Message or Group and returns the value unchanged otherwise, except
 * for Infinity, -Infinity and NaN numerical values which are converted to
 * string representation.
 *
 * @param {goog.proto2.FieldDescriptor} field The field from which this
 *     value came.
 *
 * @param {*} value The value of the field.
 *
 * @return {*} The value.
 * @protected
 */
goog.proto2.Serializer.prototype.getSerializedValue = function(field, value) {
  if (field.isCompositeType()) {
    return this.serialize(/** @type {goog.proto2.Message} */ (value));
  } else if (goog.isNumber(value) && !isFinite(value)) {
    return value.toString();
  } else {
    return value;
  }
};


/**
 * Deserializes a message from the expected format.
 *
 * @param {goog.proto2.Descriptor} descriptor The descriptor of the message
 *     to be created.
 * @param {*} data The data of the message.
 *
 * @return {!goog.proto2.Message} The message created.
 */
goog.proto2.Serializer.prototype.deserialize = function(descriptor, data) {
  var message = descriptor.createMessageInstance();
  this.deserializeTo(message, data);
  goog.asserts.assert(message instanceof goog.proto2.Message);
  return message;
};


/**
 * Deserializes a message from the expected format and places the
 * data in the message.
 *
 * @param {goog.proto2.Message} message The message in which to
 *     place the information.
 * @param {*} data The data of the message.
 */
goog.proto2.Serializer.prototype.deserializeTo = goog.abstractMethod;


/**
 * Returns the deserialized form of the given value for the given field if the
 * field is a Message or Group and returns the value, converted or unchanged,
 * for primitive field types otherwise.
 *
 * @param {goog.proto2.FieldDescriptor} field The field from which this
 *     value came.
 *
 * @param {*} value The value of the field.
 *
 * @return {*} The value.
 * @protected
 */
goog.proto2.Serializer.prototype.getDeserializedValue = function(field, value) {
  // Composite types are deserialized recursively.
  if (field.isCompositeType()) {
    if (value instanceof goog.proto2.Message) {
      return value;
    }

    return this.deserialize(field.getFieldMessageType(), value);
  }

  // Decode enum values.
  if (field.getFieldType() == goog.proto2.FieldDescriptor.FieldType.ENUM) {
    // If it's a string, get enum value by name.
    // NB: In order this feature to work, property renaming should be turned off
    // for the respective enums.
    if (goog.proto2.Serializer.DECODE_SYMBOLIC_ENUMS && goog.isString(value)) {
      // enumType is a regular Javascript enum as defined in field's metadata.
      var enumType = field.getNativeType();
      if (enumType.hasOwnProperty(value)) {
        return enumType[value];
      }
    }
    // Return unknown values as is for backward compatibility.
    return value;
  }

  // Return the raw value if the field does not allow the JSON input to be
  // converted.
  if (!field.deserializationConversionPermitted()) {
    return value;
  }

  // Convert to native type of field.  Return the converted value or fall
  // through to return the raw value.  The JSON encoding of int64 value 123
  // might be either the number 123 or the string "123".  The field native type
  // could be either Number or String (depending on field options in the .proto
  // file).  All four combinations should work correctly.
  var nativeType = field.getNativeType();
  if (nativeType === String) {
    // JSON numbers can be converted to strings.
    if (goog.isNumber(value)) {
      return String(value);
    }
  } else if (nativeType === Number) {
    // JSON strings are sometimes used for large integer numeric values, as well
    // as Infinity, -Infinity and NaN.
    if (goog.isString(value)) {
      // Handle +/- Infinity and NaN values.
      if (value === 'Infinity' || value === '-Infinity' || value === 'NaN') {
        return Number(value);
      }

      // Validate the string.  If the string is not an integral number, we would
      // rather have an assertion or error in the caller than a mysterious NaN
      // value.
      if (/^-?[0-9]+$/.test(value)) {
        return Number(value);
      }
    }
  }

  return value;
};
// Copyright 2009 The Closure Library Authors. All Rights Reserved.
//
// Licensed under the Apache License, Version 2.0 (the "License");
// you may not use this file except in compliance with the License.
// You may obtain a copy of the License at
//
//      http://www.apache.org/licenses/LICENSE-2.0
//
// Unless required by applicable law or agreed to in writing, software
// distributed under the License is distributed on an "AS-IS" BASIS,
// WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
// See the License for the specific language governing permissions and
// limitations under the License.

/**
 * @fileoverview Base class for all PB2 lazy deserializer. A lazy deserializer
 *   is a serializer whose deserialization occurs on the fly as data is
 *   requested. In order to use a lazy deserializer, the serialized form
 *   of the data must be an object or array that can be indexed by the tag
 *   number.
 *
 */

goog.require('goog.asserts');
goog.require('goog.proto2.Message');
goog.require('goog.proto2.Serializer');



/**
 * Base class for all lazy deserializers.
 *
 * @constructor
 * @extends {goog.proto2.Serializer}
 */
goog.proto2.LazyDeserializer = function() {};
goog.inherits(goog.proto2.LazyDeserializer, goog.proto2.Serializer);


/** @override */
goog.proto2.LazyDeserializer.prototype.deserialize =
    function(descriptor, data) {
  var message = descriptor.createMessageInstance();
  message.initializeForLazyDeserializer(this, data);
  goog.asserts.assert(message instanceof goog.proto2.Message);
  return message;
};


/** @override */
goog.proto2.LazyDeserializer.prototype.deserializeTo = function(message, data) {
  throw new Error('Unimplemented');
};


/**
 * Deserializes a message field from the expected format and places the
 * data in the given message
 *
 * @param {goog.proto2.Message} message The message in which to
 *     place the information.
 * @param {goog.proto2.FieldDescriptor} field The field for which to set the
 *     message value.
 * @param {*} data The serialized data for the field.
 *
 * @return {*} The deserialized data or null for no value found.
 */
goog.proto2.LazyDeserializer.prototype.deserializeField = goog.abstractMethod;
// Copyright 2008 The Closure Library Authors. All Rights Reserved.
//
// Licensed under the Apache License, Version 2.0 (the "License");
// you may not use this file except in compliance with the License.
// You may obtain a copy of the License at
//
//      http://www.apache.org/licenses/LICENSE-2.0
//
// Unless required by applicable law or agreed to in writing, software
// distributed under the License is distributed on an "AS-IS" BASIS,
// WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
// See the License for the specific language governing permissions and
// limitations under the License.

/**
 * @fileoverview Protocol Buffer 2 Serializer which serializes messages
 *  into PB-Lite ("JsPbLite") format.
 *
 * PB-Lite format is an array where each index corresponds to the associated tag
 * number. For example, a message like so:
 *
 * message Foo {
 *   optional int bar = 1;
 *   optional int baz = 2;
 *   optional int bop = 4;
 * }
 *
 * would be represented as such:
 *
 * [, (bar data), (baz data), (nothing), (bop data)]
 *
 * Note that since the array index is used to represent the tag number, sparsely
 * populated messages with tag numbers that are not continuous (and/or are very
 * large) will have many (empty) spots and thus, are inefficient.
 *
 *
 */

goog.require('goog.asserts');
goog.require('goog.proto2.FieldDescriptor');
goog.require('goog.proto2.LazyDeserializer');
goog.require('goog.proto2.Serializer');



/**
 * PB-Lite serializer.
 *
 * @constructor
 * @extends {goog.proto2.LazyDeserializer}
 */
goog.proto2.PbLiteSerializer = function() {};
goog.inherits(goog.proto2.PbLiteSerializer, goog.proto2.LazyDeserializer);


/**
 * If true, fields will be serialized with 0-indexed tags (i.e., the proto
 * field with tag id 1 will have index 0 in the array).
 * @type {boolean}
 * @private
 */
goog.proto2.PbLiteSerializer.prototype.zeroIndexing_ = false;


/**
 * By default, the proto tag with id 1 will have index 1 in the serialized
 * array.
 *
 * If the serializer is set to use zero-indexing, the tag with id 1 will have
 * index 0.
 *
 * @param {boolean} zeroIndexing Whether this serializer should deal with
 *     0-indexed protos.
 */
goog.proto2.PbLiteSerializer.prototype.setZeroIndexed = function(zeroIndexing) {
  this.zeroIndexing_ = zeroIndexing;
};


/**
 * Serializes a message to a PB-Lite object.
 *
 * @param {goog.proto2.Message} message The message to be serialized.
 * @return {!Array<?>} The serialized form of the message.
 * @override
 */
goog.proto2.PbLiteSerializer.prototype.serialize = function(message) {
  var descriptor = message.getDescriptor();
  var fields = descriptor.getFields();

  var serialized = [];
  var zeroIndexing = this.zeroIndexing_;

  // Add the known fields.
  for (var i = 0; i < fields.length; i++) {
    var field = fields[i];

    if (!message.has(field)) {
      continue;
    }

    var tag = field.getTag();
    var index = zeroIndexing ? tag - 1 : tag;

    if (field.isRepeated()) {
      serialized[index] = [];

      for (var j = 0; j < message.countOf(field); j++) {
        serialized[index][j] =
            this.getSerializedValue(field, message.get(field, j));
      }
    } else {
      serialized[index] = this.getSerializedValue(field, message.get(field));
    }
  }

  // Add any unknown fields.
  message.forEachUnknown(function(tag, value) {
    var index = zeroIndexing ? tag - 1 : tag;
    serialized[index] = value;
  });

  return serialized;
};


/** @override */
goog.proto2.PbLiteSerializer.prototype.deserializeField =
    function(message, field, value) {

  if (value == null) {
    // Since value double-equals null, it may be either null or undefined.
    // Ensure we return the same one, since they have different meanings.
    // TODO(user): If the field is repeated, this method should probably
    // return [] instead of null.
    return value;
  }

  if (field.isRepeated()) {
    var data = [];

    goog.asserts.assert(goog.isArray(value), 'Value must be array: %s', value);

    for (var i = 0; i < value.length; i++) {
      data[i] = this.getDeserializedValue(field, value[i]);
    }

    return data;
  } else {
    return this.getDeserializedValue(field, value);
  }
};


/** @override */
goog.proto2.PbLiteSerializer.prototype.getSerializedValue =
    function(field, value) {
  if (field.getFieldType() == goog.proto2.FieldDescriptor.FieldType.BOOL) {
    // Booleans are serialized in numeric form.
    return value ? 1 : 0;
  }

  return goog.proto2.Serializer.prototype.getSerializedValue.apply(this,
                                                                   arguments);
};


/** @override */
goog.proto2.PbLiteSerializer.prototype.getDeserializedValue =
    function(field, value) {

  if (field.getFieldType() == goog.proto2.FieldDescriptor.FieldType.BOOL) {
    goog.asserts.assert(goog.isNumber(value) || goog.isBoolean(value),
        'Value is expected to be a number or boolean');
    return !!value;
  }

  return goog.proto2.Serializer.prototype.getDeserializedValue.apply(this,
                                                                     arguments);
};


/** @override */
goog.proto2.PbLiteSerializer.prototype.deserialize =
    function(descriptor, data) {
  var toConvert = data;
  if (this.zeroIndexing_) {
    // Make the data align with tag-IDs (1-indexed) by shifting everything
    // up one.
    toConvert = [];
    for (var key in data) {
      toConvert[parseInt(key, 10) + 1] = data[key];
    }
  }
  return goog.proto2.PbLiteSerializer.base(
      this, 'deserialize', descriptor, toConvert);
};
/**
 * @license
 * Protocol Buffer 2 Copyright 2008 Google Inc.
 * All other code copyright its respective owners.
 * Copyright (C) 2010 The Libphonenumber Authors
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 * http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

/**
 * @fileoverview Generated Protocol Buffer code for file
 * phonenumber.proto.
 */

var i18n = {
  phonenumbers: {}
};

goog.require('goog.proto2.Message');



/**
 * Message PhoneNumber.
 * @constructor
 * @extends {goog.proto2.Message}
 */
i18n.phonenumbers.PhoneNumber = function() {
  goog.proto2.Message.call(this);
};
goog.inherits(i18n.phonenumbers.PhoneNumber, goog.proto2.Message);


/**
 * Overrides {@link goog.proto2.Message#clone} to specify its exact return type.
 * @return {!i18n.phonenumbers.PhoneNumber} The cloned message.
 * @override
 */
i18n.phonenumbers.PhoneNumber.prototype.clone;


/**
 * Gets the value of the country_code field.
 * @return {?number} The value.
 */
i18n.phonenumbers.PhoneNumber.prototype.getCountryCode = function() {
  return /** @type {?number} */ (this.get$Value(1));
};


/**
 * Gets the value of the country_code field or the default value if not set.
 * @return {number} The value.
 */
i18n.phonenumbers.PhoneNumber.prototype.getCountryCodeOrDefault = function() {
  return /** @type {number} */ (this.get$ValueOrDefault(1));
};


/**
 * Sets the value of the country_code field.
 * @param {number} value The value.
 */
i18n.phonenumbers.PhoneNumber.prototype.setCountryCode = function(value) {
  this.set$Value(1, value);
};


/**
 * @return {boolean} Whether the country_code field has a value.
 */
i18n.phonenumbers.PhoneNumber.prototype.hasCountryCode = function() {
  return this.has$Value(1);
};


/**
 * @return {number} The number of values in the country_code field.
 */
i18n.phonenumbers.PhoneNumber.prototype.countryCodeCount = function() {
  return this.count$Values(1);
};


/**
 * Clears the values in the country_code field.
 */
i18n.phonenumbers.PhoneNumber.prototype.clearCountryCode = function() {
  this.clear$Field(1);
};


/**
 * Gets the value of the national_number field.
 * @return {?number} The value.
 */
i18n.phonenumbers.PhoneNumber.prototype.getNationalNumber = function() {
  return /** @type {?number} */ (this.get$Value(2));
};


/**
 * Gets the value of the national_number field or the default value if not set.
 * @return {number} The value.
 */
i18n.phonenumbers.PhoneNumber.prototype.getNationalNumberOrDefault = function() {
  return /** @type {number} */ (this.get$ValueOrDefault(2));
};


/**
 * Sets the value of the national_number field.
 * @param {number} value The value.
 */
i18n.phonenumbers.PhoneNumber.prototype.setNationalNumber = function(value) {
  this.set$Value(2, value);
};


/**
 * @return {boolean} Whether the national_number field has a value.
 */
i18n.phonenumbers.PhoneNumber.prototype.hasNationalNumber = function() {
  return this.has$Value(2);
};


/**
 * @return {number} The number of values in the national_number field.
 */
i18n.phonenumbers.PhoneNumber.prototype.nationalNumberCount = function() {
  return this.count$Values(2);
};


/**
 * Clears the values in the national_number field.
 */
i18n.phonenumbers.PhoneNumber.prototype.clearNationalNumber = function() {
  this.clear$Field(2);
};


/**
 * Gets the value of the extension field.
 * @return {?string} The value.
 */
i18n.phonenumbers.PhoneNumber.prototype.getExtension = function() {
  return /** @type {?string} */ (this.get$Value(3));
};


/**
 * Gets the value of the extension field or the default value if not set.
 * @return {string} The value.
 */
i18n.phonenumbers.PhoneNumber.prototype.getExtensionOrDefault = function() {
  return /** @type {string} */ (this.get$ValueOrDefault(3));
};


/**
 * Sets the value of the extension field.
 * @param {string} value The value.
 */
i18n.phonenumbers.PhoneNumber.prototype.setExtension = function(value) {
  this.set$Value(3, value);
};


/**
 * @return {boolean} Whether the extension field has a value.
 */
i18n.phonenumbers.PhoneNumber.prototype.hasExtension = function() {
  return this.has$Value(3);
};


/**
 * @return {number} The number of values in the extension field.
 */
i18n.phonenumbers.PhoneNumber.prototype.extensionCount = function() {
  return this.count$Values(3);
};


/**
 * Clears the values in the extension field.
 */
i18n.phonenumbers.PhoneNumber.prototype.clearExtension = function() {
  this.clear$Field(3);
};


/**
 * Gets the value of the italian_leading_zero field.
 * @return {?boolean} The value.
 */
i18n.phonenumbers.PhoneNumber.prototype.getItalianLeadingZero = function() {
  return /** @type {?boolean} */ (this.get$Value(4));
};


/**
 * Gets the value of the italian_leading_zero field or the default value if not set.
 * @return {boolean} The value.
 */
i18n.phonenumbers.PhoneNumber.prototype.getItalianLeadingZeroOrDefault = function() {
  return /** @type {boolean} */ (this.get$ValueOrDefault(4));
};


/**
 * Sets the value of the italian_leading_zero field.
 * @param {boolean} value The value.
 */
i18n.phonenumbers.PhoneNumber.prototype.setItalianLeadingZero = function(value) {
  this.set$Value(4, value);
};


/**
 * @return {boolean} Whether the italian_leading_zero field has a value.
 */
i18n.phonenumbers.PhoneNumber.prototype.hasItalianLeadingZero = function() {
  return this.has$Value(4);
};


/**
 * @return {number} The number of values in the italian_leading_zero field.
 */
i18n.phonenumbers.PhoneNumber.prototype.italianLeadingZeroCount = function() {
  return this.count$Values(4);
};


/**
 * Clears the values in the italian_leading_zero field.
 */
i18n.phonenumbers.PhoneNumber.prototype.clearItalianLeadingZero = function() {
  this.clear$Field(4);
};


/**
 * Gets the value of the number_of_leading_zeros field.
 * @return {?number} The value.
 */
i18n.phonenumbers.PhoneNumber.prototype.getNumberOfLeadingZeros = function() {
  return /** @type {?number} */ (this.get$Value(8));
};


/**
 * Gets the value of the number_of_leading_zeros field or the default value if not set.
 * @return {number} The value.
 */
i18n.phonenumbers.PhoneNumber.prototype.getNumberOfLeadingZerosOrDefault = function() {
  return /** @type {number} */ (this.get$ValueOrDefault(8));
};


/**
 * Sets the value of the number_of_leading_zeros field.
 * @param {number} value The value.
 */
i18n.phonenumbers.PhoneNumber.prototype.setNumberOfLeadingZeros = function(value) {
  this.set$Value(8, value);
};


/**
 * @return {boolean} Whether the number_of_leading_zeros field has a value.
 */
i18n.phonenumbers.PhoneNumber.prototype.hasNumberOfLeadingZeros = function() {
  return this.has$Value(8);
};


/**
 * @return {number} The number of values in the number_of_leading_zeros field.
 */
i18n.phonenumbers.PhoneNumber.prototype.numberOfLeadingZerosCount = function() {
  return this.count$Values(8);
};


/**
 * Clears the values in the number_of_leading_zeros field.
 */
i18n.phonenumbers.PhoneNumber.prototype.clearNumberOfLeadingZeros = function() {
  this.clear$Field(8);
};


/**
 * Gets the value of the raw_input field.
 * @return {?string} The value.
 */
i18n.phonenumbers.PhoneNumber.prototype.getRawInput = function() {
  return /** @type {?string} */ (this.get$Value(5));
};


/**
 * Gets the value of the raw_input field or the default value if not set.
 * @return {string} The value.
 */
i18n.phonenumbers.PhoneNumber.prototype.getRawInputOrDefault = function() {
  return /** @type {string} */ (this.get$ValueOrDefault(5));
};


/**
 * Sets the value of the raw_input field.
 * @param {string} value The value.
 */
i18n.phonenumbers.PhoneNumber.prototype.setRawInput = function(value) {
  this.set$Value(5, value);
};


/**
 * @return {boolean} Whether the raw_input field has a value.
 */
i18n.phonenumbers.PhoneNumber.prototype.hasRawInput = function() {
  return this.has$Value(5);
};


/**
 * @return {number} The number of values in the raw_input field.
 */
i18n.phonenumbers.PhoneNumber.prototype.rawInputCount = function() {
  return this.count$Values(5);
};


/**
 * Clears the values in the raw_input field.
 */
i18n.phonenumbers.PhoneNumber.prototype.clearRawInput = function() {
  this.clear$Field(5);
};


/**
 * Gets the value of the country_code_source field.
 * @return {?i18n.phonenumbers.PhoneNumber.CountryCodeSource} The value.
 */
i18n.phonenumbers.PhoneNumber.prototype.getCountryCodeSource = function() {
  return /** @type {?i18n.phonenumbers.PhoneNumber.CountryCodeSource} */ (this.get$Value(6));
};


/**
 * Gets the value of the country_code_source field or the default value if not set.
 * @return {i18n.phonenumbers.PhoneNumber.CountryCodeSource} The value.
 */
i18n.phonenumbers.PhoneNumber.prototype.getCountryCodeSourceOrDefault = function() {
  return /** @type {i18n.phonenumbers.PhoneNumber.CountryCodeSource} */ (this.get$ValueOrDefault(6));
};


/**
 * Sets the value of the country_code_source field.
 * @param {i18n.phonenumbers.PhoneNumber.CountryCodeSource} value The value.
 */
i18n.phonenumbers.PhoneNumber.prototype.setCountryCodeSource = function(value) {
  this.set$Value(6, value);
};


/**
 * @return {boolean} Whether the country_code_source field has a value.
 */
i18n.phonenumbers.PhoneNumber.prototype.hasCountryCodeSource = function() {
  return this.has$Value(6);
};


/**
 * @return {number} The number of values in the country_code_source field.
 */
i18n.phonenumbers.PhoneNumber.prototype.countryCodeSourceCount = function() {
  return this.count$Values(6);
};


/**
 * Clears the values in the country_code_source field.
 */
i18n.phonenumbers.PhoneNumber.prototype.clearCountryCodeSource = function() {
  this.clear$Field(6);
};


/**
 * Gets the value of the preferred_domestic_carrier_code field.
 * @return {?string} The value.
 */
i18n.phonenumbers.PhoneNumber.prototype.getPreferredDomesticCarrierCode = function() {
  return /** @type {?string} */ (this.get$Value(7));
};


/**
 * Gets the value of the preferred_domestic_carrier_code field or the default value if not set.
 * @return {string} The value.
 */
i18n.phonenumbers.PhoneNumber.prototype.getPreferredDomesticCarrierCodeOrDefault = function() {
  return /** @type {string} */ (this.get$ValueOrDefault(7));
};


/**
 * Sets the value of the preferred_domestic_carrier_code field.
 * @param {string} value The value.
 */
i18n.phonenumbers.PhoneNumber.prototype.setPreferredDomesticCarrierCode = function(value) {
  this.set$Value(7, value);
};


/**
 * @return {boolean} Whether the preferred_domestic_carrier_code field has a value.
 */
i18n.phonenumbers.PhoneNumber.prototype.hasPreferredDomesticCarrierCode = function() {
  return this.has$Value(7);
};


/**
 * @return {number} The number of values in the preferred_domestic_carrier_code field.
 */
i18n.phonenumbers.PhoneNumber.prototype.preferredDomesticCarrierCodeCount = function() {
  return this.count$Values(7);
};


/**
 * Clears the values in the preferred_domestic_carrier_code field.
 */
i18n.phonenumbers.PhoneNumber.prototype.clearPreferredDomesticCarrierCode = function() {
  this.clear$Field(7);
};


/**
 * Enumeration CountryCodeSource.
 * @enum {number}
 */
i18n.phonenumbers.PhoneNumber.CountryCodeSource = {
  FROM_NUMBER_WITH_PLUS_SIGN: 1,
  FROM_NUMBER_WITH_IDD: 5,
  FROM_NUMBER_WITHOUT_PLUS_SIGN: 10,
  FROM_DEFAULT_COUNTRY: 20
};


/** @override */
i18n.phonenumbers.PhoneNumber.prototype.getDescriptor = function() {
  if (!i18n.phonenumbers.PhoneNumber.descriptor_) {
    // The descriptor is created lazily when we instantiate a new instance.
    var descriptorObj = {
      0: {
        name: 'PhoneNumber',
        fullName: 'i18n.phonenumbers.PhoneNumber'
      },
      1: {
        name: 'country_code',
        required: true,
        fieldType: goog.proto2.Message.FieldType.INT32,
        type: Number
      },
      2: {
        name: 'national_number',
        required: true,
        fieldType: goog.proto2.Message.FieldType.UINT64,
        type: Number
      },
      3: {
        name: 'extension',
        fieldType: goog.proto2.Message.FieldType.STRING,
        type: String
      },
      4: {
        name: 'italian_leading_zero',
        fieldType: goog.proto2.Message.FieldType.BOOL,
        type: Boolean
      },
      8: {
        name: 'number_of_leading_zeros',
        fieldType: goog.proto2.Message.FieldType.INT32,
        defaultValue: 1,
        type: Number
      },
      5: {
        name: 'raw_input',
        fieldType: goog.proto2.Message.FieldType.STRING,
        type: String
      },
      6: {
        name: 'country_code_source',
        fieldType: goog.proto2.Message.FieldType.ENUM,
        defaultValue: i18n.phonenumbers.PhoneNumber.CountryCodeSource.FROM_NUMBER_WITH_PLUS_SIGN,
        type: i18n.phonenumbers.PhoneNumber.CountryCodeSource
      },
      7: {
        name: 'preferred_domestic_carrier_code',
        fieldType: goog.proto2.Message.FieldType.STRING,
        type: String
      }
    };
    i18n.phonenumbers.PhoneNumber.descriptor_ =
        goog.proto2.Message.createDescriptor(
             i18n.phonenumbers.PhoneNumber, descriptorObj);
  }
  return i18n.phonenumbers.PhoneNumber.descriptor_;
};


// Export getDescriptor static function robust to minification.
i18n.phonenumbers.PhoneNumber['ctor'] = i18n.phonenumbers.PhoneNumber;
i18n.phonenumbers.PhoneNumber['ctor'].getDescriptor =
    i18n.phonenumbers.PhoneNumber.prototype.getDescriptor;
/**
 * @license
 * Protocol Buffer 2 Copyright 2008 Google Inc.
 * All other code copyright its respective owners.
 * Copyright (C) 2010 The Libphonenumber Authors
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 * http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

/**
 * @fileoverview Generated Protocol Buffer code for file
 * phonemetadata.proto.
 */

goog.require('goog.proto2.Message');



/**
 * Message NumberFormat.
 * @constructor
 * @extends {goog.proto2.Message}
 */
i18n.phonenumbers.NumberFormat = function() {
  goog.proto2.Message.call(this);
};
goog.inherits(i18n.phonenumbers.NumberFormat, goog.proto2.Message);


/**
 * Overrides {@link goog.proto2.Message#clone} to specify its exact return type.
 * @return {!i18n.phonenumbers.NumberFormat} The cloned message.
 * @override
 */
i18n.phonenumbers.NumberFormat.prototype.clone;


/**
 * Gets the value of the pattern field.
 * @return {?string} The value.
 */
i18n.phonenumbers.NumberFormat.prototype.getPattern = function() {
  return /** @type {?string} */ (this.get$Value(1));
};


/**
 * Gets the value of the pattern field or the default value if not set.
 * @return {string} The value.
 */
i18n.phonenumbers.NumberFormat.prototype.getPatternOrDefault = function() {
  return /** @type {string} */ (this.get$ValueOrDefault(1));
};


/**
 * Sets the value of the pattern field.
 * @param {string} value The value.
 */
i18n.phonenumbers.NumberFormat.prototype.setPattern = function(value) {
  this.set$Value(1, value);
};


/**
 * @return {boolean} Whether the pattern field has a value.
 */
i18n.phonenumbers.NumberFormat.prototype.hasPattern = function() {
  return this.has$Value(1);
};


/**
 * @return {number} The number of values in the pattern field.
 */
i18n.phonenumbers.NumberFormat.prototype.patternCount = function() {
  return this.count$Values(1);
};


/**
 * Clears the values in the pattern field.
 */
i18n.phonenumbers.NumberFormat.prototype.clearPattern = function() {
  this.clear$Field(1);
};


/**
 * Gets the value of the format field.
 * @return {?string} The value.
 */
i18n.phonenumbers.NumberFormat.prototype.getFormat = function() {
  return /** @type {?string} */ (this.get$Value(2));
};


/**
 * Gets the value of the format field or the default value if not set.
 * @return {string} The value.
 */
i18n.phonenumbers.NumberFormat.prototype.getFormatOrDefault = function() {
  return /** @type {string} */ (this.get$ValueOrDefault(2));
};


/**
 * Sets the value of the format field.
 * @param {string} value The value.
 */
i18n.phonenumbers.NumberFormat.prototype.setFormat = function(value) {
  this.set$Value(2, value);
};


/**
 * @return {boolean} Whether the format field has a value.
 */
i18n.phonenumbers.NumberFormat.prototype.hasFormat = function() {
  return this.has$Value(2);
};


/**
 * @return {number} The number of values in the format field.
 */
i18n.phonenumbers.NumberFormat.prototype.formatCount = function() {
  return this.count$Values(2);
};


/**
 * Clears the values in the format field.
 */
i18n.phonenumbers.NumberFormat.prototype.clearFormat = function() {
  this.clear$Field(2);
};


/**
 * Gets the value of the leading_digits_pattern field at the index given.
 * @param {number} index The index to lookup.
 * @return {?string} The value.
 */
i18n.phonenumbers.NumberFormat.prototype.getLeadingDigitsPattern = function(index) {
  return /** @type {?string} */ (this.get$Value(3, index));
};


/**
 * Gets the value of the leading_digits_pattern field at the index given or the default value if not set.
 * @param {number} index The index to lookup.
 * @return {string} The value.
 */
i18n.phonenumbers.NumberFormat.prototype.getLeadingDigitsPatternOrDefault = function(index) {
  return /** @type {string} */ (this.get$ValueOrDefault(3, index));
};


/**
 * Adds a value to the leading_digits_pattern field.
 * @param {string} value The value to add.
 */
i18n.phonenumbers.NumberFormat.prototype.addLeadingDigitsPattern = function(value) {
  this.add$Value(3, value);
};


/**
 * Returns the array of values in the leading_digits_pattern field.
 * @return {!Array.<string>} The values in the field.
 */
i18n.phonenumbers.NumberFormat.prototype.leadingDigitsPatternArray = function() {
  return /** @type {!Array.<string>} */ (this.array$Values(3));
};


/**
 * @return {boolean} Whether the leading_digits_pattern field has a value.
 */
i18n.phonenumbers.NumberFormat.prototype.hasLeadingDigitsPattern = function() {
  return this.has$Value(3);
};


/**
 * @return {number} The number of values in the leading_digits_pattern field.
 */
i18n.phonenumbers.NumberFormat.prototype.leadingDigitsPatternCount = function() {
  return this.count$Values(3);
};


/**
 * Clears the values in the leading_digits_pattern field.
 */
i18n.phonenumbers.NumberFormat.prototype.clearLeadingDigitsPattern = function() {
  this.clear$Field(3);
};


/**
 * Gets the value of the national_prefix_formatting_rule field.
 * @return {?string} The value.
 */
i18n.phonenumbers.NumberFormat.prototype.getNationalPrefixFormattingRule = function() {
  return /** @type {?string} */ (this.get$Value(4));
};


/**
 * Gets the value of the national_prefix_formatting_rule field or the default value if not set.
 * @return {string} The value.
 */
i18n.phonenumbers.NumberFormat.prototype.getNationalPrefixFormattingRuleOrDefault = function() {
  return /** @type {string} */ (this.get$ValueOrDefault(4));
};


/**
 * Sets the value of the national_prefix_formatting_rule field.
 * @param {string} value The value.
 */
i18n.phonenumbers.NumberFormat.prototype.setNationalPrefixFormattingRule = function(value) {
  this.set$Value(4, value);
};


/**
 * @return {boolean} Whether the national_prefix_formatting_rule field has a value.
 */
i18n.phonenumbers.NumberFormat.prototype.hasNationalPrefixFormattingRule = function() {
  return this.has$Value(4);
};


/**
 * @return {number} The number of values in the national_prefix_formatting_rule field.
 */
i18n.phonenumbers.NumberFormat.prototype.nationalPrefixFormattingRuleCount = function() {
  return this.count$Values(4);
};


/**
 * Clears the values in the national_prefix_formatting_rule field.
 */
i18n.phonenumbers.NumberFormat.prototype.clearNationalPrefixFormattingRule = function() {
  this.clear$Field(4);
};


/**
 * Gets the value of the national_prefix_optional_when_formatting field.
 * @return {?boolean} The value.
 */
i18n.phonenumbers.NumberFormat.prototype.getNationalPrefixOptionalWhenFormatting = function() {
  return /** @type {?boolean} */ (this.get$Value(6));
};


/**
 * Gets the value of the national_prefix_optional_when_formatting field or the default value if not set.
 * @return {boolean} The value.
 */
i18n.phonenumbers.NumberFormat.prototype.getNationalPrefixOptionalWhenFormattingOrDefault = function() {
  return /** @type {boolean} */ (this.get$ValueOrDefault(6));
};


/**
 * Sets the value of the national_prefix_optional_when_formatting field.
 * @param {boolean} value The value.
 */
i18n.phonenumbers.NumberFormat.prototype.setNationalPrefixOptionalWhenFormatting = function(value) {
  this.set$Value(6, value);
};


/**
 * @return {boolean} Whether the national_prefix_optional_when_formatting field has a value.
 */
i18n.phonenumbers.NumberFormat.prototype.hasNationalPrefixOptionalWhenFormatting = function() {
  return this.has$Value(6);
};


/**
 * @return {number} The number of values in the national_prefix_optional_when_formatting field.
 */
i18n.phonenumbers.NumberFormat.prototype.nationalPrefixOptionalWhenFormattingCount = function() {
  return this.count$Values(6);
};


/**
 * Clears the values in the national_prefix_optional_when_formatting field.
 */
i18n.phonenumbers.NumberFormat.prototype.clearNationalPrefixOptionalWhenFormatting = function() {
  this.clear$Field(6);
};


/**
 * Gets the value of the domestic_carrier_code_formatting_rule field.
 * @return {?string} The value.
 */
i18n.phonenumbers.NumberFormat.prototype.getDomesticCarrierCodeFormattingRule = function() {
  return /** @type {?string} */ (this.get$Value(5));
};


/**
 * Gets the value of the domestic_carrier_code_formatting_rule field or the default value if not set.
 * @return {string} The value.
 */
i18n.phonenumbers.NumberFormat.prototype.getDomesticCarrierCodeFormattingRuleOrDefault = function() {
  return /** @type {string} */ (this.get$ValueOrDefault(5));
};


/**
 * Sets the value of the domestic_carrier_code_formatting_rule field.
 * @param {string} value The value.
 */
i18n.phonenumbers.NumberFormat.prototype.setDomesticCarrierCodeFormattingRule = function(value) {
  this.set$Value(5, value);
};


/**
 * @return {boolean} Whether the domestic_carrier_code_formatting_rule field has a value.
 */
i18n.phonenumbers.NumberFormat.prototype.hasDomesticCarrierCodeFormattingRule = function() {
  return this.has$Value(5);
};


/**
 * @return {number} The number of values in the domestic_carrier_code_formatting_rule field.
 */
i18n.phonenumbers.NumberFormat.prototype.domesticCarrierCodeFormattingRuleCount = function() {
  return this.count$Values(5);
};


/**
 * Clears the values in the domestic_carrier_code_formatting_rule field.
 */
i18n.phonenumbers.NumberFormat.prototype.clearDomesticCarrierCodeFormattingRule = function() {
  this.clear$Field(5);
};



/**
 * Message PhoneNumberDesc.
 * @constructor
 * @extends {goog.proto2.Message}
 */
i18n.phonenumbers.PhoneNumberDesc = function() {
  goog.proto2.Message.call(this);
};
goog.inherits(i18n.phonenumbers.PhoneNumberDesc, goog.proto2.Message);


/**
 * Overrides {@link goog.proto2.Message#clone} to specify its exact return type.
 * @return {!i18n.phonenumbers.PhoneNumberDesc} The cloned message.
 * @override
 */
i18n.phonenumbers.PhoneNumberDesc.prototype.clone;


/**
 * Gets the value of the national_number_pattern field.
 * @return {?string} The value.
 */
i18n.phonenumbers.PhoneNumberDesc.prototype.getNationalNumberPattern = function() {
  return /** @type {?string} */ (this.get$Value(2));
};


/**
 * Gets the value of the national_number_pattern field or the default value if not set.
 * @return {string} The value.
 */
i18n.phonenumbers.PhoneNumberDesc.prototype.getNationalNumberPatternOrDefault = function() {
  return /** @type {string} */ (this.get$ValueOrDefault(2));
};


/**
 * Sets the value of the national_number_pattern field.
 * @param {string} value The value.
 */
i18n.phonenumbers.PhoneNumberDesc.prototype.setNationalNumberPattern = function(value) {
  this.set$Value(2, value);
};


/**
 * @return {boolean} Whether the national_number_pattern field has a value.
 */
i18n.phonenumbers.PhoneNumberDesc.prototype.hasNationalNumberPattern = function() {
  return this.has$Value(2);
};


/**
 * @return {number} The number of values in the national_number_pattern field.
 */
i18n.phonenumbers.PhoneNumberDesc.prototype.nationalNumberPatternCount = function() {
  return this.count$Values(2);
};


/**
 * Clears the values in the national_number_pattern field.
 */
i18n.phonenumbers.PhoneNumberDesc.prototype.clearNationalNumberPattern = function() {
  this.clear$Field(2);
};


/**
 * Gets the value of the possible_number_pattern field.
 * @return {?string} The value.
 */
i18n.phonenumbers.PhoneNumberDesc.prototype.getPossibleNumberPattern = function() {
  return /** @type {?string} */ (this.get$Value(3));
};


/**
 * Gets the value of the possible_number_pattern field or the default value if not set.
 * @return {string} The value.
 */
i18n.phonenumbers.PhoneNumberDesc.prototype.getPossibleNumberPatternOrDefault = function() {
  return /** @type {string} */ (this.get$ValueOrDefault(3));
};


/**
 * Sets the value of the possible_number_pattern field.
 * @param {string} value The value.
 */
i18n.phonenumbers.PhoneNumberDesc.prototype.setPossibleNumberPattern = function(value) {
  this.set$Value(3, value);
};


/**
 * @return {boolean} Whether the possible_number_pattern field has a value.
 */
i18n.phonenumbers.PhoneNumberDesc.prototype.hasPossibleNumberPattern = function() {
  return this.has$Value(3);
};


/**
 * @return {number} The number of values in the possible_number_pattern field.
 */
i18n.phonenumbers.PhoneNumberDesc.prototype.possibleNumberPatternCount = function() {
  return this.count$Values(3);
};


/**
 * Clears the values in the possible_number_pattern field.
 */
i18n.phonenumbers.PhoneNumberDesc.prototype.clearPossibleNumberPattern = function() {
  this.clear$Field(3);
};


/**
 * Gets the value of the example_number field.
 * @return {?string} The value.
 */
i18n.phonenumbers.PhoneNumberDesc.prototype.getExampleNumber = function() {
  return /** @type {?string} */ (this.get$Value(6));
};


/**
 * Gets the value of the example_number field or the default value if not set.
 * @return {string} The value.
 */
i18n.phonenumbers.PhoneNumberDesc.prototype.getExampleNumberOrDefault = function() {
  return /** @type {string} */ (this.get$ValueOrDefault(6));
};


/**
 * Sets the value of the example_number field.
 * @param {string} value The value.
 */
i18n.phonenumbers.PhoneNumberDesc.prototype.setExampleNumber = function(value) {
  this.set$Value(6, value);
};


/**
 * @return {boolean} Whether the example_number field has a value.
 */
i18n.phonenumbers.PhoneNumberDesc.prototype.hasExampleNumber = function() {
  return this.has$Value(6);
};


/**
 * @return {number} The number of values in the example_number field.
 */
i18n.phonenumbers.PhoneNumberDesc.prototype.exampleNumberCount = function() {
  return this.count$Values(6);
};


/**
 * Clears the values in the example_number field.
 */
i18n.phonenumbers.PhoneNumberDesc.prototype.clearExampleNumber = function() {
  this.clear$Field(6);
};


/**
 * Gets the value of the national_number_matcher_data field.
 * @return {?string} The value.
 */
i18n.phonenumbers.PhoneNumberDesc.prototype.getNationalNumberMatcherData = function() {
  return /** @type {?string} */ (this.get$Value(7));
};


/**
 * Gets the value of the national_number_matcher_data field or the default value if not set.
 * @return {string} The value.
 */
i18n.phonenumbers.PhoneNumberDesc.prototype.getNationalNumberMatcherDataOrDefault = function() {
  return /** @type {string} */ (this.get$ValueOrDefault(7));
};


/**
 * Sets the value of the national_number_matcher_data field.
 * @param {string} value The value.
 */
i18n.phonenumbers.PhoneNumberDesc.prototype.setNationalNumberMatcherData = function(value) {
  this.set$Value(7, value);
};


/**
 * @return {boolean} Whether the national_number_matcher_data field has a value.
 */
i18n.phonenumbers.PhoneNumberDesc.prototype.hasNationalNumberMatcherData = function() {
  return this.has$Value(7);
};


/**
 * @return {number} The number of values in the national_number_matcher_data field.
 */
i18n.phonenumbers.PhoneNumberDesc.prototype.nationalNumberMatcherDataCount = function() {
  return this.count$Values(7);
};


/**
 * Clears the values in the national_number_matcher_data field.
 */
i18n.phonenumbers.PhoneNumberDesc.prototype.clearNationalNumberMatcherData = function() {
  this.clear$Field(7);
};


/**
 * Gets the value of the possible_number_matcher_data field.
 * @return {?string} The value.
 */
i18n.phonenumbers.PhoneNumberDesc.prototype.getPossibleNumberMatcherData = function() {
  return /** @type {?string} */ (this.get$Value(8));
};


/**
 * Gets the value of the possible_number_matcher_data field or the default value if not set.
 * @return {string} The value.
 */
i18n.phonenumbers.PhoneNumberDesc.prototype.getPossibleNumberMatcherDataOrDefault = function() {
  return /** @type {string} */ (this.get$ValueOrDefault(8));
};


/**
 * Sets the value of the possible_number_matcher_data field.
 * @param {string} value The value.
 */
i18n.phonenumbers.PhoneNumberDesc.prototype.setPossibleNumberMatcherData = function(value) {
  this.set$Value(8, value);
};


/**
 * @return {boolean} Whether the possible_number_matcher_data field has a value.
 */
i18n.phonenumbers.PhoneNumberDesc.prototype.hasPossibleNumberMatcherData = function() {
  return this.has$Value(8);
};


/**
 * @return {number} The number of values in the possible_number_matcher_data field.
 */
i18n.phonenumbers.PhoneNumberDesc.prototype.possibleNumberMatcherDataCount = function() {
  return this.count$Values(8);
};


/**
 * Clears the values in the possible_number_matcher_data field.
 */
i18n.phonenumbers.PhoneNumberDesc.prototype.clearPossibleNumberMatcherData = function() {
  this.clear$Field(8);
};



/**
 * Message PhoneMetadata.
 * @constructor
 * @extends {goog.proto2.Message}
 */
i18n.phonenumbers.PhoneMetadata = function() {
  goog.proto2.Message.call(this);
};
goog.inherits(i18n.phonenumbers.PhoneMetadata, goog.proto2.Message);


/**
 * Overrides {@link goog.proto2.Message#clone} to specify its exact return type.
 * @return {!i18n.phonenumbers.PhoneMetadata} The cloned message.
 * @override
 */
i18n.phonenumbers.PhoneMetadata.prototype.clone;


/**
 * Gets the value of the general_desc field.
 * @return {i18n.phonenumbers.PhoneNumberDesc} The value.
 */
i18n.phonenumbers.PhoneMetadata.prototype.getGeneralDesc = function() {
  return /** @type {i18n.phonenumbers.PhoneNumberDesc} */ (this.get$Value(1));
};


/**
 * Gets the value of the general_desc field or the default value if not set.
 * @return {!i18n.phonenumbers.PhoneNumberDesc} The value.
 */
i18n.phonenumbers.PhoneMetadata.prototype.getGeneralDescOrDefault = function() {
  return /** @type {!i18n.phonenumbers.PhoneNumberDesc} */ (this.get$ValueOrDefault(1));
};


/**
 * Sets the value of the general_desc field.
 * @param {!i18n.phonenumbers.PhoneNumberDesc} value The value.
 */
i18n.phonenumbers.PhoneMetadata.prototype.setGeneralDesc = function(value) {
  this.set$Value(1, value);
};


/**
 * @return {boolean} Whether the general_desc field has a value.
 */
i18n.phonenumbers.PhoneMetadata.prototype.hasGeneralDesc = function() {
  return this.has$Value(1);
};


/**
 * @return {number} The number of values in the general_desc field.
 */
i18n.phonenumbers.PhoneMetadata.prototype.generalDescCount = function() {
  return this.count$Values(1);
};


/**
 * Clears the values in the general_desc field.
 */
i18n.phonenumbers.PhoneMetadata.prototype.clearGeneralDesc = function() {
  this.clear$Field(1);
};


/**
 * Gets the value of the fixed_line field.
 * @return {i18n.phonenumbers.PhoneNumberDesc} The value.
 */
i18n.phonenumbers.PhoneMetadata.prototype.getFixedLine = function() {
  return /** @type {i18n.phonenumbers.PhoneNumberDesc} */ (this.get$Value(2));
};


/**
 * Gets the value of the fixed_line field or the default value if not set.
 * @return {!i18n.phonenumbers.PhoneNumberDesc} The value.
 */
i18n.phonenumbers.PhoneMetadata.prototype.getFixedLineOrDefault = function() {
  return /** @type {!i18n.phonenumbers.PhoneNumberDesc} */ (this.get$ValueOrDefault(2));
};


/**
 * Sets the value of the fixed_line field.
 * @param {!i18n.phonenumbers.PhoneNumberDesc} value The value.
 */
i18n.phonenumbers.PhoneMetadata.prototype.setFixedLine = function(value) {
  this.set$Value(2, value);
};


/**
 * @return {boolean} Whether the fixed_line field has a value.
 */
i18n.phonenumbers.PhoneMetadata.prototype.hasFixedLine = function() {
  return this.has$Value(2);
};


/**
 * @return {number} The number of values in the fixed_line field.
 */
i18n.phonenumbers.PhoneMetadata.prototype.fixedLineCount = function() {
  return this.count$Values(2);
};


/**
 * Clears the values in the fixed_line field.
 */
i18n.phonenumbers.PhoneMetadata.prototype.clearFixedLine = function() {
  this.clear$Field(2);
};


/**
 * Gets the value of the mobile field.
 * @return {i18n.phonenumbers.PhoneNumberDesc} The value.
 */
i18n.phonenumbers.PhoneMetadata.prototype.getMobile = function() {
  return /** @type {i18n.phonenumbers.PhoneNumberDesc} */ (this.get$Value(3));
};


/**
 * Gets the value of the mobile field or the default value if not set.
 * @return {!i18n.phonenumbers.PhoneNumberDesc} The value.
 */
i18n.phonenumbers.PhoneMetadata.prototype.getMobileOrDefault = function() {
  return /** @type {!i18n.phonenumbers.PhoneNumberDesc} */ (this.get$ValueOrDefault(3));
};


/**
 * Sets the value of the mobile field.
 * @param {!i18n.phonenumbers.PhoneNumberDesc} value The value.
 */
i18n.phonenumbers.PhoneMetadata.prototype.setMobile = function(value) {
  this.set$Value(3, value);
};


/**
 * @return {boolean} Whether the mobile field has a value.
 */
i18n.phonenumbers.PhoneMetadata.prototype.hasMobile = function() {
  return this.has$Value(3);
};


/**
 * @return {number} The number of values in the mobile field.
 */
i18n.phonenumbers.PhoneMetadata.prototype.mobileCount = function() {
  return this.count$Values(3);
};


/**
 * Clears the values in the mobile field.
 */
i18n.phonenumbers.PhoneMetadata.prototype.clearMobile = function() {
  this.clear$Field(3);
};


/**
 * Gets the value of the toll_free field.
 * @return {i18n.phonenumbers.PhoneNumberDesc} The value.
 */
i18n.phonenumbers.PhoneMetadata.prototype.getTollFree = function() {
  return /** @type {i18n.phonenumbers.PhoneNumberDesc} */ (this.get$Value(4));
};


/**
 * Gets the value of the toll_free field or the default value if not set.
 * @return {!i18n.phonenumbers.PhoneNumberDesc} The value.
 */
i18n.phonenumbers.PhoneMetadata.prototype.getTollFreeOrDefault = function() {
  return /** @type {!i18n.phonenumbers.PhoneNumberDesc} */ (this.get$ValueOrDefault(4));
};


/**
 * Sets the value of the toll_free field.
 * @param {!i18n.phonenumbers.PhoneNumberDesc} value The value.
 */
i18n.phonenumbers.PhoneMetadata.prototype.setTollFree = function(value) {
  this.set$Value(4, value);
};


/**
 * @return {boolean} Whether the toll_free field has a value.
 */
i18n.phonenumbers.PhoneMetadata.prototype.hasTollFree = function() {
  return this.has$Value(4);
};


/**
 * @return {number} The number of values in the toll_free field.
 */
i18n.phonenumbers.PhoneMetadata.prototype.tollFreeCount = function() {
  return this.count$Values(4);
};


/**
 * Clears the values in the toll_free field.
 */
i18n.phonenumbers.PhoneMetadata.prototype.clearTollFree = function() {
  this.clear$Field(4);
};


/**
 * Gets the value of the premium_rate field.
 * @return {i18n.phonenumbers.PhoneNumberDesc} The value.
 */
i18n.phonenumbers.PhoneMetadata.prototype.getPremiumRate = function() {
  return /** @type {i18n.phonenumbers.PhoneNumberDesc} */ (this.get$Value(5));
};


/**
 * Gets the value of the premium_rate field or the default value if not set.
 * @return {!i18n.phonenumbers.PhoneNumberDesc} The value.
 */
i18n.phonenumbers.PhoneMetadata.prototype.getPremiumRateOrDefault = function() {
  return /** @type {!i18n.phonenumbers.PhoneNumberDesc} */ (this.get$ValueOrDefault(5));
};


/**
 * Sets the value of the premium_rate field.
 * @param {!i18n.phonenumbers.PhoneNumberDesc} value The value.
 */
i18n.phonenumbers.PhoneMetadata.prototype.setPremiumRate = function(value) {
  this.set$Value(5, value);
};


/**
 * @return {boolean} Whether the premium_rate field has a value.
 */
i18n.phonenumbers.PhoneMetadata.prototype.hasPremiumRate = function() {
  return this.has$Value(5);
};


/**
 * @return {number} The number of values in the premium_rate field.
 */
i18n.phonenumbers.PhoneMetadata.prototype.premiumRateCount = function() {
  return this.count$Values(5);
};


/**
 * Clears the values in the premium_rate field.
 */
i18n.phonenumbers.PhoneMetadata.prototype.clearPremiumRate = function() {
  this.clear$Field(5);
};


/**
 * Gets the value of the shared_cost field.
 * @return {i18n.phonenumbers.PhoneNumberDesc} The value.
 */
i18n.phonenumbers.PhoneMetadata.prototype.getSharedCost = function() {
  return /** @type {i18n.phonenumbers.PhoneNumberDesc} */ (this.get$Value(6));
};


/**
 * Gets the value of the shared_cost field or the default value if not set.
 * @return {!i18n.phonenumbers.PhoneNumberDesc} The value.
 */
i18n.phonenumbers.PhoneMetadata.prototype.getSharedCostOrDefault = function() {
  return /** @type {!i18n.phonenumbers.PhoneNumberDesc} */ (this.get$ValueOrDefault(6));
};


/**
 * Sets the value of the shared_cost field.
 * @param {!i18n.phonenumbers.PhoneNumberDesc} value The value.
 */
i18n.phonenumbers.PhoneMetadata.prototype.setSharedCost = function(value) {
  this.set$Value(6, value);
};


/**
 * @return {boolean} Whether the shared_cost field has a value.
 */
i18n.phonenumbers.PhoneMetadata.prototype.hasSharedCost = function() {
  return this.has$Value(6);
};


/**
 * @return {number} The number of values in the shared_cost field.
 */
i18n.phonenumbers.PhoneMetadata.prototype.sharedCostCount = function() {
  return this.count$Values(6);
};


/**
 * Clears the values in the shared_cost field.
 */
i18n.phonenumbers.PhoneMetadata.prototype.clearSharedCost = function() {
  this.clear$Field(6);
};


/**
 * Gets the value of the personal_number field.
 * @return {i18n.phonenumbers.PhoneNumberDesc} The value.
 */
i18n.phonenumbers.PhoneMetadata.prototype.getPersonalNumber = function() {
  return /** @type {i18n.phonenumbers.PhoneNumberDesc} */ (this.get$Value(7));
};


/**
 * Gets the value of the personal_number field or the default value if not set.
 * @return {!i18n.phonenumbers.PhoneNumberDesc} The value.
 */
i18n.phonenumbers.PhoneMetadata.prototype.getPersonalNumberOrDefault = function() {
  return /** @type {!i18n.phonenumbers.PhoneNumberDesc} */ (this.get$ValueOrDefault(7));
};


/**
 * Sets the value of the personal_number field.
 * @param {!i18n.phonenumbers.PhoneNumberDesc} value The value.
 */
i18n.phonenumbers.PhoneMetadata.prototype.setPersonalNumber = function(value) {
  this.set$Value(7, value);
};


/**
 * @return {boolean} Whether the personal_number field has a value.
 */
i18n.phonenumbers.PhoneMetadata.prototype.hasPersonalNumber = function() {
  return this.has$Value(7);
};


/**
 * @return {number} The number of values in the personal_number field.
 */
i18n.phonenumbers.PhoneMetadata.prototype.personalNumberCount = function() {
  return this.count$Values(7);
};


/**
 * Clears the values in the personal_number field.
 */
i18n.phonenumbers.PhoneMetadata.prototype.clearPersonalNumber = function() {
  this.clear$Field(7);
};


/**
 * Gets the value of the voip field.
 * @return {i18n.phonenumbers.PhoneNumberDesc} The value.
 */
i18n.phonenumbers.PhoneMetadata.prototype.getVoip = function() {
  return /** @type {i18n.phonenumbers.PhoneNumberDesc} */ (this.get$Value(8));
};


/**
 * Gets the value of the voip field or the default value if not set.
 * @return {!i18n.phonenumbers.PhoneNumberDesc} The value.
 */
i18n.phonenumbers.PhoneMetadata.prototype.getVoipOrDefault = function() {
  return /** @type {!i18n.phonenumbers.PhoneNumberDesc} */ (this.get$ValueOrDefault(8));
};


/**
 * Sets the value of the voip field.
 * @param {!i18n.phonenumbers.PhoneNumberDesc} value The value.
 */
i18n.phonenumbers.PhoneMetadata.prototype.setVoip = function(value) {
  this.set$Value(8, value);
};


/**
 * @return {boolean} Whether the voip field has a value.
 */
i18n.phonenumbers.PhoneMetadata.prototype.hasVoip = function() {
  return this.has$Value(8);
};


/**
 * @return {number} The number of values in the voip field.
 */
i18n.phonenumbers.PhoneMetadata.prototype.voipCount = function() {
  return this.count$Values(8);
};


/**
 * Clears the values in the voip field.
 */
i18n.phonenumbers.PhoneMetadata.prototype.clearVoip = function() {
  this.clear$Field(8);
};


/**
 * Gets the value of the pager field.
 * @return {i18n.phonenumbers.PhoneNumberDesc} The value.
 */
i18n.phonenumbers.PhoneMetadata.prototype.getPager = function() {
  return /** @type {i18n.phonenumbers.PhoneNumberDesc} */ (this.get$Value(21));
};


/**
 * Gets the value of the pager field or the default value if not set.
 * @return {!i18n.phonenumbers.PhoneNumberDesc} The value.
 */
i18n.phonenumbers.PhoneMetadata.prototype.getPagerOrDefault = function() {
  return /** @type {!i18n.phonenumbers.PhoneNumberDesc} */ (this.get$ValueOrDefault(21));
};


/**
 * Sets the value of the pager field.
 * @param {!i18n.phonenumbers.PhoneNumberDesc} value The value.
 */
i18n.phonenumbers.PhoneMetadata.prototype.setPager = function(value) {
  this.set$Value(21, value);
};


/**
 * @return {boolean} Whether the pager field has a value.
 */
i18n.phonenumbers.PhoneMetadata.prototype.hasPager = function() {
  return this.has$Value(21);
};


/**
 * @return {number} The number of values in the pager field.
 */
i18n.phonenumbers.PhoneMetadata.prototype.pagerCount = function() {
  return this.count$Values(21);
};


/**
 * Clears the values in the pager field.
 */
i18n.phonenumbers.PhoneMetadata.prototype.clearPager = function() {
  this.clear$Field(21);
};


/**
 * Gets the value of the uan field.
 * @return {i18n.phonenumbers.PhoneNumberDesc} The value.
 */
i18n.phonenumbers.PhoneMetadata.prototype.getUan = function() {
  return /** @type {i18n.phonenumbers.PhoneNumberDesc} */ (this.get$Value(25));
};


/**
 * Gets the value of the uan field or the default value if not set.
 * @return {!i18n.phonenumbers.PhoneNumberDesc} The value.
 */
i18n.phonenumbers.PhoneMetadata.prototype.getUanOrDefault = function() {
  return /** @type {!i18n.phonenumbers.PhoneNumberDesc} */ (this.get$ValueOrDefault(25));
};


/**
 * Sets the value of the uan field.
 * @param {!i18n.phonenumbers.PhoneNumberDesc} value The value.
 */
i18n.phonenumbers.PhoneMetadata.prototype.setUan = function(value) {
  this.set$Value(25, value);
};


/**
 * @return {boolean} Whether the uan field has a value.
 */
i18n.phonenumbers.PhoneMetadata.prototype.hasUan = function() {
  return this.has$Value(25);
};


/**
 * @return {number} The number of values in the uan field.
 */
i18n.phonenumbers.PhoneMetadata.prototype.uanCount = function() {
  return this.count$Values(25);
};


/**
 * Clears the values in the uan field.
 */
i18n.phonenumbers.PhoneMetadata.prototype.clearUan = function() {
  this.clear$Field(25);
};


/**
 * Gets the value of the emergency field.
 * @return {i18n.phonenumbers.PhoneNumberDesc} The value.
 */
i18n.phonenumbers.PhoneMetadata.prototype.getEmergency = function() {
  return /** @type {i18n.phonenumbers.PhoneNumberDesc} */ (this.get$Value(27));
};


/**
 * Gets the value of the emergency field or the default value if not set.
 * @return {!i18n.phonenumbers.PhoneNumberDesc} The value.
 */
i18n.phonenumbers.PhoneMetadata.prototype.getEmergencyOrDefault = function() {
  return /** @type {!i18n.phonenumbers.PhoneNumberDesc} */ (this.get$ValueOrDefault(27));
};


/**
 * Sets the value of the emergency field.
 * @param {!i18n.phonenumbers.PhoneNumberDesc} value The value.
 */
i18n.phonenumbers.PhoneMetadata.prototype.setEmergency = function(value) {
  this.set$Value(27, value);
};


/**
 * @return {boolean} Whether the emergency field has a value.
 */
i18n.phonenumbers.PhoneMetadata.prototype.hasEmergency = function() {
  return this.has$Value(27);
};


/**
 * @return {number} The number of values in the emergency field.
 */
i18n.phonenumbers.PhoneMetadata.prototype.emergencyCount = function() {
  return this.count$Values(27);
};


/**
 * Clears the values in the emergency field.
 */
i18n.phonenumbers.PhoneMetadata.prototype.clearEmergency = function() {
  this.clear$Field(27);
};


/**
 * Gets the value of the voicemail field.
 * @return {i18n.phonenumbers.PhoneNumberDesc} The value.
 */
i18n.phonenumbers.PhoneMetadata.prototype.getVoicemail = function() {
  return /** @type {i18n.phonenumbers.PhoneNumberDesc} */ (this.get$Value(28));
};


/**
 * Gets the value of the voicemail field or the default value if not set.
 * @return {!i18n.phonenumbers.PhoneNumberDesc} The value.
 */
i18n.phonenumbers.PhoneMetadata.prototype.getVoicemailOrDefault = function() {
  return /** @type {!i18n.phonenumbers.PhoneNumberDesc} */ (this.get$ValueOrDefault(28));
};


/**
 * Sets the value of the voicemail field.
 * @param {!i18n.phonenumbers.PhoneNumberDesc} value The value.
 */
i18n.phonenumbers.PhoneMetadata.prototype.setVoicemail = function(value) {
  this.set$Value(28, value);
};


/**
 * @return {boolean} Whether the voicemail field has a value.
 */
i18n.phonenumbers.PhoneMetadata.prototype.hasVoicemail = function() {
  return this.has$Value(28);
};


/**
 * @return {number} The number of values in the voicemail field.
 */
i18n.phonenumbers.PhoneMetadata.prototype.voicemailCount = function() {
  return this.count$Values(28);
};


/**
 * Clears the values in the voicemail field.
 */
i18n.phonenumbers.PhoneMetadata.prototype.clearVoicemail = function() {
  this.clear$Field(28);
};


/**
 * Gets the value of the no_international_dialling field.
 * @return {i18n.phonenumbers.PhoneNumberDesc} The value.
 */
i18n.phonenumbers.PhoneMetadata.prototype.getNoInternationalDialling = function() {
  return /** @type {i18n.phonenumbers.PhoneNumberDesc} */ (this.get$Value(24));
};


/**
 * Gets the value of the no_international_dialling field or the default value if not set.
 * @return {!i18n.phonenumbers.PhoneNumberDesc} The value.
 */
i18n.phonenumbers.PhoneMetadata.prototype.getNoInternationalDiallingOrDefault = function() {
  return /** @type {!i18n.phonenumbers.PhoneNumberDesc} */ (this.get$ValueOrDefault(24));
};


/**
 * Sets the value of the no_international_dialling field.
 * @param {!i18n.phonenumbers.PhoneNumberDesc} value The value.
 */
i18n.phonenumbers.PhoneMetadata.prototype.setNoInternationalDialling = function(value) {
  this.set$Value(24, value);
};


/**
 * @return {boolean} Whether the no_international_dialling field has a value.
 */
i18n.phonenumbers.PhoneMetadata.prototype.hasNoInternationalDialling = function() {
  return this.has$Value(24);
};


/**
 * @return {number} The number of values in the no_international_dialling field.
 */
i18n.phonenumbers.PhoneMetadata.prototype.noInternationalDiallingCount = function() {
  return this.count$Values(24);
};


/**
 * Clears the values in the no_international_dialling field.
 */
i18n.phonenumbers.PhoneMetadata.prototype.clearNoInternationalDialling = function() {
  this.clear$Field(24);
};


/**
 * Gets the value of the id field.
 * @return {?string} The value.
 */
i18n.phonenumbers.PhoneMetadata.prototype.getId = function() {
  return /** @type {?string} */ (this.get$Value(9));
};


/**
 * Gets the value of the id field or the default value if not set.
 * @return {string} The value.
 */
i18n.phonenumbers.PhoneMetadata.prototype.getIdOrDefault = function() {
  return /** @type {string} */ (this.get$ValueOrDefault(9));
};


/**
 * Sets the value of the id field.
 * @param {string} value The value.
 */
i18n.phonenumbers.PhoneMetadata.prototype.setId = function(value) {
  this.set$Value(9, value);
};


/**
 * @return {boolean} Whether the id field has a value.
 */
i18n.phonenumbers.PhoneMetadata.prototype.hasId = function() {
  return this.has$Value(9);
};


/**
 * @return {number} The number of values in the id field.
 */
i18n.phonenumbers.PhoneMetadata.prototype.idCount = function() {
  return this.count$Values(9);
};


/**
 * Clears the values in the id field.
 */
i18n.phonenumbers.PhoneMetadata.prototype.clearId = function() {
  this.clear$Field(9);
};


/**
 * Gets the value of the country_code field.
 * @return {?number} The value.
 */
i18n.phonenumbers.PhoneMetadata.prototype.getCountryCode = function() {
  return /** @type {?number} */ (this.get$Value(10));
};


/**
 * Gets the value of the country_code field or the default value if not set.
 * @return {number} The value.
 */
i18n.phonenumbers.PhoneMetadata.prototype.getCountryCodeOrDefault = function() {
  return /** @type {number} */ (this.get$ValueOrDefault(10));
};


/**
 * Sets the value of the country_code field.
 * @param {number} value The value.
 */
i18n.phonenumbers.PhoneMetadata.prototype.setCountryCode = function(value) {
  this.set$Value(10, value);
};


/**
 * @return {boolean} Whether the country_code field has a value.
 */
i18n.phonenumbers.PhoneMetadata.prototype.hasCountryCode = function() {
  return this.has$Value(10);
};


/**
 * @return {number} The number of values in the country_code field.
 */
i18n.phonenumbers.PhoneMetadata.prototype.countryCodeCount = function() {
  return this.count$Values(10);
};


/**
 * Clears the values in the country_code field.
 */
i18n.phonenumbers.PhoneMetadata.prototype.clearCountryCode = function() {
  this.clear$Field(10);
};


/**
 * Gets the value of the international_prefix field.
 * @return {?string} The value.
 */
i18n.phonenumbers.PhoneMetadata.prototype.getInternationalPrefix = function() {
  return /** @type {?string} */ (this.get$Value(11));
};


/**
 * Gets the value of the international_prefix field or the default value if not set.
 * @return {string} The value.
 */
i18n.phonenumbers.PhoneMetadata.prototype.getInternationalPrefixOrDefault = function() {
  return /** @type {string} */ (this.get$ValueOrDefault(11));
};


/**
 * Sets the value of the international_prefix field.
 * @param {string} value The value.
 */
i18n.phonenumbers.PhoneMetadata.prototype.setInternationalPrefix = function(value) {
  this.set$Value(11, value);
};


/**
 * @return {boolean} Whether the international_prefix field has a value.
 */
i18n.phonenumbers.PhoneMetadata.prototype.hasInternationalPrefix = function() {
  return this.has$Value(11);
};


/**
 * @return {number} The number of values in the international_prefix field.
 */
i18n.phonenumbers.PhoneMetadata.prototype.internationalPrefixCount = function() {
  return this.count$Values(11);
};


/**
 * Clears the values in the international_prefix field.
 */
i18n.phonenumbers.PhoneMetadata.prototype.clearInternationalPrefix = function() {
  this.clear$Field(11);
};


/**
 * Gets the value of the preferred_international_prefix field.
 * @return {?string} The value.
 */
i18n.phonenumbers.PhoneMetadata.prototype.getPreferredInternationalPrefix = function() {
  return /** @type {?string} */ (this.get$Value(17));
};


/**
 * Gets the value of the preferred_international_prefix field or the default value if not set.
 * @return {string} The value.
 */
i18n.phonenumbers.PhoneMetadata.prototype.getPreferredInternationalPrefixOrDefault = function() {
  return /** @type {string} */ (this.get$ValueOrDefault(17));
};


/**
 * Sets the value of the preferred_international_prefix field.
 * @param {string} value The value.
 */
i18n.phonenumbers.PhoneMetadata.prototype.setPreferredInternationalPrefix = function(value) {
  this.set$Value(17, value);
};


/**
 * @return {boolean} Whether the preferred_international_prefix field has a value.
 */
i18n.phonenumbers.PhoneMetadata.prototype.hasPreferredInternationalPrefix = function() {
  return this.has$Value(17);
};


/**
 * @return {number} The number of values in the preferred_international_prefix field.
 */
i18n.phonenumbers.PhoneMetadata.prototype.preferredInternationalPrefixCount = function() {
  return this.count$Values(17);
};


/**
 * Clears the values in the preferred_international_prefix field.
 */
i18n.phonenumbers.PhoneMetadata.prototype.clearPreferredInternationalPrefix = function() {
  this.clear$Field(17);
};


/**
 * Gets the value of the national_prefix field.
 * @return {?string} The value.
 */
i18n.phonenumbers.PhoneMetadata.prototype.getNationalPrefix = function() {
  return /** @type {?string} */ (this.get$Value(12));
};


/**
 * Gets the value of the national_prefix field or the default value if not set.
 * @return {string} The value.
 */
i18n.phonenumbers.PhoneMetadata.prototype.getNationalPrefixOrDefault = function() {
  return /** @type {string} */ (this.get$ValueOrDefault(12));
};


/**
 * Sets the value of the national_prefix field.
 * @param {string} value The value.
 */
i18n.phonenumbers.PhoneMetadata.prototype.setNationalPrefix = function(value) {
  this.set$Value(12, value);
};


/**
 * @return {boolean} Whether the national_prefix field has a value.
 */
i18n.phonenumbers.PhoneMetadata.prototype.hasNationalPrefix = function() {
  return this.has$Value(12);
};


/**
 * @return {number} The number of values in the national_prefix field.
 */
i18n.phonenumbers.PhoneMetadata.prototype.nationalPrefixCount = function() {
  return this.count$Values(12);
};


/**
 * Clears the values in the national_prefix field.
 */
i18n.phonenumbers.PhoneMetadata.prototype.clearNationalPrefix = function() {
  this.clear$Field(12);
};


/**
 * Gets the value of the preferred_extn_prefix field.
 * @return {?string} The value.
 */
i18n.phonenumbers.PhoneMetadata.prototype.getPreferredExtnPrefix = function() {
  return /** @type {?string} */ (this.get$Value(13));
};


/**
 * Gets the value of the preferred_extn_prefix field or the default value if not set.
 * @return {string} The value.
 */
i18n.phonenumbers.PhoneMetadata.prototype.getPreferredExtnPrefixOrDefault = function() {
  return /** @type {string} */ (this.get$ValueOrDefault(13));
};


/**
 * Sets the value of the preferred_extn_prefix field.
 * @param {string} value The value.
 */
i18n.phonenumbers.PhoneMetadata.prototype.setPreferredExtnPrefix = function(value) {
  this.set$Value(13, value);
};


/**
 * @return {boolean} Whether the preferred_extn_prefix field has a value.
 */
i18n.phonenumbers.PhoneMetadata.prototype.hasPreferredExtnPrefix = function() {
  return this.has$Value(13);
};


/**
 * @return {number} The number of values in the preferred_extn_prefix field.
 */
i18n.phonenumbers.PhoneMetadata.prototype.preferredExtnPrefixCount = function() {
  return this.count$Values(13);
};


/**
 * Clears the values in the preferred_extn_prefix field.
 */
i18n.phonenumbers.PhoneMetadata.prototype.clearPreferredExtnPrefix = function() {
  this.clear$Field(13);
};


/**
 * Gets the value of the national_prefix_for_parsing field.
 * @return {?string} The value.
 */
i18n.phonenumbers.PhoneMetadata.prototype.getNationalPrefixForParsing = function() {
  return /** @type {?string} */ (this.get$Value(15));
};


/**
 * Gets the value of the national_prefix_for_parsing field or the default value if not set.
 * @return {string} The value.
 */
i18n.phonenumbers.PhoneMetadata.prototype.getNationalPrefixForParsingOrDefault = function() {
  return /** @type {string} */ (this.get$ValueOrDefault(15));
};


/**
 * Sets the value of the national_prefix_for_parsing field.
 * @param {string} value The value.
 */
i18n.phonenumbers.PhoneMetadata.prototype.setNationalPrefixForParsing = function(value) {
  this.set$Value(15, value);
};


/**
 * @return {boolean} Whether the national_prefix_for_parsing field has a value.
 */
i18n.phonenumbers.PhoneMetadata.prototype.hasNationalPrefixForParsing = function() {
  return this.has$Value(15);
};


/**
 * @return {number} The number of values in the national_prefix_for_parsing field.
 */
i18n.phonenumbers.PhoneMetadata.prototype.nationalPrefixForParsingCount = function() {
  return this.count$Values(15);
};


/**
 * Clears the values in the national_prefix_for_parsing field.
 */
i18n.phonenumbers.PhoneMetadata.prototype.clearNationalPrefixForParsing = function() {
  this.clear$Field(15);
};


/**
 * Gets the value of the national_prefix_transform_rule field.
 * @return {?string} The value.
 */
i18n.phonenumbers.PhoneMetadata.prototype.getNationalPrefixTransformRule = function() {
  return /** @type {?string} */ (this.get$Value(16));
};


/**
 * Gets the value of the national_prefix_transform_rule field or the default value if not set.
 * @return {string} The value.
 */
i18n.phonenumbers.PhoneMetadata.prototype.getNationalPrefixTransformRuleOrDefault = function() {
  return /** @type {string} */ (this.get$ValueOrDefault(16));
};


/**
 * Sets the value of the national_prefix_transform_rule field.
 * @param {string} value The value.
 */
i18n.phonenumbers.PhoneMetadata.prototype.setNationalPrefixTransformRule = function(value) {
  this.set$Value(16, value);
};


/**
 * @return {boolean} Whether the national_prefix_transform_rule field has a value.
 */
i18n.phonenumbers.PhoneMetadata.prototype.hasNationalPrefixTransformRule = function() {
  return this.has$Value(16);
};


/**
 * @return {number} The number of values in the national_prefix_transform_rule field.
 */
i18n.phonenumbers.PhoneMetadata.prototype.nationalPrefixTransformRuleCount = function() {
  return this.count$Values(16);
};


/**
 * Clears the values in the national_prefix_transform_rule field.
 */
i18n.phonenumbers.PhoneMetadata.prototype.clearNationalPrefixTransformRule = function() {
  this.clear$Field(16);
};


/**
 * Gets the value of the same_mobile_and_fixed_line_pattern field.
 * @return {?boolean} The value.
 */
i18n.phonenumbers.PhoneMetadata.prototype.getSameMobileAndFixedLinePattern = function() {
  return /** @type {?boolean} */ (this.get$Value(18));
};


/**
 * Gets the value of the same_mobile_and_fixed_line_pattern field or the default value if not set.
 * @return {boolean} The value.
 */
i18n.phonenumbers.PhoneMetadata.prototype.getSameMobileAndFixedLinePatternOrDefault = function() {
  return /** @type {boolean} */ (this.get$ValueOrDefault(18));
};


/**
 * Sets the value of the same_mobile_and_fixed_line_pattern field.
 * @param {boolean} value The value.
 */
i18n.phonenumbers.PhoneMetadata.prototype.setSameMobileAndFixedLinePattern = function(value) {
  this.set$Value(18, value);
};


/**
 * @return {boolean} Whether the same_mobile_and_fixed_line_pattern field has a value.
 */
i18n.phonenumbers.PhoneMetadata.prototype.hasSameMobileAndFixedLinePattern = function() {
  return this.has$Value(18);
};


/**
 * @return {number} The number of values in the same_mobile_and_fixed_line_pattern field.
 */
i18n.phonenumbers.PhoneMetadata.prototype.sameMobileAndFixedLinePatternCount = function() {
  return this.count$Values(18);
};


/**
 * Clears the values in the same_mobile_and_fixed_line_pattern field.
 */
i18n.phonenumbers.PhoneMetadata.prototype.clearSameMobileAndFixedLinePattern = function() {
  this.clear$Field(18);
};


/**
 * Gets the value of the number_format field at the index given.
 * @param {number} index The index to lookup.
 * @return {i18n.phonenumbers.NumberFormat} The value.
 */
i18n.phonenumbers.PhoneMetadata.prototype.getNumberFormat = function(index) {
  return /** @type {i18n.phonenumbers.NumberFormat} */ (this.get$Value(19, index));
};


/**
 * Gets the value of the number_format field at the index given or the default value if not set.
 * @param {number} index The index to lookup.
 * @return {!i18n.phonenumbers.NumberFormat} The value.
 */
i18n.phonenumbers.PhoneMetadata.prototype.getNumberFormatOrDefault = function(index) {
  return /** @type {!i18n.phonenumbers.NumberFormat} */ (this.get$ValueOrDefault(19, index));
};


/**
 * Adds a value to the number_format field.
 * @param {!i18n.phonenumbers.NumberFormat} value The value to add.
 */
i18n.phonenumbers.PhoneMetadata.prototype.addNumberFormat = function(value) {
  this.add$Value(19, value);
};


/**
 * Returns the array of values in the number_format field.
 * @return {!Array.<!i18n.phonenumbers.NumberFormat>} The values in the field.
 */
i18n.phonenumbers.PhoneMetadata.prototype.numberFormatArray = function() {
  return /** @type {!Array.<!i18n.phonenumbers.NumberFormat>} */ (this.array$Values(19));
};


/**
 * @return {boolean} Whether the number_format field has a value.
 */
i18n.phonenumbers.PhoneMetadata.prototype.hasNumberFormat = function() {
  return this.has$Value(19);
};


/**
 * @return {number} The number of values in the number_format field.
 */
i18n.phonenumbers.PhoneMetadata.prototype.numberFormatCount = function() {
  return this.count$Values(19);
};


/**
 * Clears the values in the number_format field.
 */
i18n.phonenumbers.PhoneMetadata.prototype.clearNumberFormat = function() {
  this.clear$Field(19);
};


/**
 * Gets the value of the intl_number_format field at the index given.
 * @param {number} index The index to lookup.
 * @return {i18n.phonenumbers.NumberFormat} The value.
 */
i18n.phonenumbers.PhoneMetadata.prototype.getIntlNumberFormat = function(index) {
  return /** @type {i18n.phonenumbers.NumberFormat} */ (this.get$Value(20, index));
};


/**
 * Gets the value of the intl_number_format field at the index given or the default value if not set.
 * @param {number} index The index to lookup.
 * @return {!i18n.phonenumbers.NumberFormat} The value.
 */
i18n.phonenumbers.PhoneMetadata.prototype.getIntlNumberFormatOrDefault = function(index) {
  return /** @type {!i18n.phonenumbers.NumberFormat} */ (this.get$ValueOrDefault(20, index));
};


/**
 * Adds a value to the intl_number_format field.
 * @param {!i18n.phonenumbers.NumberFormat} value The value to add.
 */
i18n.phonenumbers.PhoneMetadata.prototype.addIntlNumberFormat = function(value) {
  this.add$Value(20, value);
};


/**
 * Returns the array of values in the intl_number_format field.
 * @return {!Array.<!i18n.phonenumbers.NumberFormat>} The values in the field.
 */
i18n.phonenumbers.PhoneMetadata.prototype.intlNumberFormatArray = function() {
  return /** @type {!Array.<!i18n.phonenumbers.NumberFormat>} */ (this.array$Values(20));
};


/**
 * @return {boolean} Whether the intl_number_format field has a value.
 */
i18n.phonenumbers.PhoneMetadata.prototype.hasIntlNumberFormat = function() {
  return this.has$Value(20);
};


/**
 * @return {number} The number of values in the intl_number_format field.
 */
i18n.phonenumbers.PhoneMetadata.prototype.intlNumberFormatCount = function() {
  return this.count$Values(20);
};


/**
 * Clears the values in the intl_number_format field.
 */
i18n.phonenumbers.PhoneMetadata.prototype.clearIntlNumberFormat = function() {
  this.clear$Field(20);
};


/**
 * Gets the value of the main_country_for_code field.
 * @return {?boolean} The value.
 */
i18n.phonenumbers.PhoneMetadata.prototype.getMainCountryForCode = function() {
  return /** @type {?boolean} */ (this.get$Value(22));
};


/**
 * Gets the value of the main_country_for_code field or the default value if not set.
 * @return {boolean} The value.
 */
i18n.phonenumbers.PhoneMetadata.prototype.getMainCountryForCodeOrDefault = function() {
  return /** @type {boolean} */ (this.get$ValueOrDefault(22));
};


/**
 * Sets the value of the main_country_for_code field.
 * @param {boolean} value The value.
 */
i18n.phonenumbers.PhoneMetadata.prototype.setMainCountryForCode = function(value) {
  this.set$Value(22, value);
};


/**
 * @return {boolean} Whether the main_country_for_code field has a value.
 */
i18n.phonenumbers.PhoneMetadata.prototype.hasMainCountryForCode = function() {
  return this.has$Value(22);
};


/**
 * @return {number} The number of values in the main_country_for_code field.
 */
i18n.phonenumbers.PhoneMetadata.prototype.mainCountryForCodeCount = function() {
  return this.count$Values(22);
};


/**
 * Clears the values in the main_country_for_code field.
 */
i18n.phonenumbers.PhoneMetadata.prototype.clearMainCountryForCode = function() {
  this.clear$Field(22);
};


/**
 * Gets the value of the leading_digits field.
 * @return {?string} The value.
 */
i18n.phonenumbers.PhoneMetadata.prototype.getLeadingDigits = function() {
  return /** @type {?string} */ (this.get$Value(23));
};


/**
 * Gets the value of the leading_digits field or the default value if not set.
 * @return {string} The value.
 */
i18n.phonenumbers.PhoneMetadata.prototype.getLeadingDigitsOrDefault = function() {
  return /** @type {string} */ (this.get$ValueOrDefault(23));
};


/**
 * Sets the value of the leading_digits field.
 * @param {string} value The value.
 */
i18n.phonenumbers.PhoneMetadata.prototype.setLeadingDigits = function(value) {
  this.set$Value(23, value);
};


/**
 * @return {boolean} Whether the leading_digits field has a value.
 */
i18n.phonenumbers.PhoneMetadata.prototype.hasLeadingDigits = function() {
  return this.has$Value(23);
};


/**
 * @return {number} The number of values in the leading_digits field.
 */
i18n.phonenumbers.PhoneMetadata.prototype.leadingDigitsCount = function() {
  return this.count$Values(23);
};


/**
 * Clears the values in the leading_digits field.
 */
i18n.phonenumbers.PhoneMetadata.prototype.clearLeadingDigits = function() {
  this.clear$Field(23);
};


/**
 * Gets the value of the leading_zero_possible field.
 * @return {?boolean} The value.
 */
i18n.phonenumbers.PhoneMetadata.prototype.getLeadingZeroPossible = function() {
  return /** @type {?boolean} */ (this.get$Value(26));
};


/**
 * Gets the value of the leading_zero_possible field or the default value if not set.
 * @return {boolean} The value.
 */
i18n.phonenumbers.PhoneMetadata.prototype.getLeadingZeroPossibleOrDefault = function() {
  return /** @type {boolean} */ (this.get$ValueOrDefault(26));
};


/**
 * Sets the value of the leading_zero_possible field.
 * @param {boolean} value The value.
 */
i18n.phonenumbers.PhoneMetadata.prototype.setLeadingZeroPossible = function(value) {
  this.set$Value(26, value);
};


/**
 * @return {boolean} Whether the leading_zero_possible field has a value.
 */
i18n.phonenumbers.PhoneMetadata.prototype.hasLeadingZeroPossible = function() {
  return this.has$Value(26);
};


/**
 * @return {number} The number of values in the leading_zero_possible field.
 */
i18n.phonenumbers.PhoneMetadata.prototype.leadingZeroPossibleCount = function() {
  return this.count$Values(26);
};


/**
 * Clears the values in the leading_zero_possible field.
 */
i18n.phonenumbers.PhoneMetadata.prototype.clearLeadingZeroPossible = function() {
  this.clear$Field(26);
};


/**
 * Message PhoneMetadataCollection.
 * @constructor
 * @extends {goog.proto2.Message}
 */
i18n.phonenumbers.PhoneMetadataCollection = function() {
  goog.proto2.Message.call(this);
};
goog.inherits(i18n.phonenumbers.PhoneMetadataCollection, goog.proto2.Message);


/**
 * Overrides {@link goog.proto2.Message#clone} to specify its exact return type.
 * @return {!i18n.phonenumbers.PhoneMetadataCollection} The cloned message.
 * @override
 */
i18n.phonenumbers.PhoneMetadataCollection.prototype.clone;


/**
 * Gets the value of the metadata field at the index given.
 * @param {number} index The index to lookup.
 * @return {i18n.phonenumbers.PhoneMetadata} The value.
 */
i18n.phonenumbers.PhoneMetadataCollection.prototype.getMetadata = function(index) {
  return /** @type {i18n.phonenumbers.PhoneMetadata} */ (this.get$Value(1, index));
};


/**
 * Gets the value of the metadata field at the index given or the default value if not set.
 * @param {number} index The index to lookup.
 * @return {!i18n.phonenumbers.PhoneMetadata} The value.
 */
i18n.phonenumbers.PhoneMetadataCollection.prototype.getMetadataOrDefault = function(index) {
  return /** @type {!i18n.phonenumbers.PhoneMetadata} */ (this.get$ValueOrDefault(1, index));
};


/**
 * Adds a value to the metadata field.
 * @param {!i18n.phonenumbers.PhoneMetadata} value The value to add.
 */
i18n.phonenumbers.PhoneMetadataCollection.prototype.addMetadata = function(value) {
  this.add$Value(1, value);
};


/**
 * Returns the array of values in the metadata field.
 * @return {!Array.<!i18n.phonenumbers.PhoneMetadata>} The values in the field.
 */
i18n.phonenumbers.PhoneMetadataCollection.prototype.metadataArray = function() {
  return /** @type {!Array.<!i18n.phonenumbers.PhoneMetadata>} */ (this.array$Values(1));
};


/**
 * @return {boolean} Whether the metadata field has a value.
 */
i18n.phonenumbers.PhoneMetadataCollection.prototype.hasMetadata = function() {
  return this.has$Value(1);
};


/**
 * @return {number} The number of values in the metadata field.
 */
i18n.phonenumbers.PhoneMetadataCollection.prototype.metadataCount = function() {
  return this.count$Values(1);
};


/**
 * Clears the values in the metadata field.
 */
i18n.phonenumbers.PhoneMetadataCollection.prototype.clearMetadata = function() {
  this.clear$Field(1);
};


/** @override */
i18n.phonenumbers.NumberFormat.prototype.getDescriptor = function() {
  if (!i18n.phonenumbers.NumberFormat.descriptor_) {
    // The descriptor is created lazily when we instantiate a new instance.
    var descriptorObj = {
      0: {
        name: 'NumberFormat',
        fullName: 'i18n.phonenumbers.NumberFormat'
      },
      1: {
        name: 'pattern',
        required: true,
        fieldType: goog.proto2.Message.FieldType.STRING,
        type: String
      },
      2: {
        name: 'format',
        required: true,
        fieldType: goog.proto2.Message.FieldType.STRING,
        type: String
      },
      3: {
        name: 'leading_digits_pattern',
        repeated: true,
        fieldType: goog.proto2.Message.FieldType.STRING,
        type: String
      },
      4: {
        name: 'national_prefix_formatting_rule',
        fieldType: goog.proto2.Message.FieldType.STRING,
        type: String
      },
      6: {
        name: 'national_prefix_optional_when_formatting',
        fieldType: goog.proto2.Message.FieldType.BOOL,
        type: Boolean
      },
      5: {
        name: 'domestic_carrier_code_formatting_rule',
        fieldType: goog.proto2.Message.FieldType.STRING,
        type: String
      }
    };
    i18n.phonenumbers.NumberFormat.descriptor_ =
        goog.proto2.Message.createDescriptor(
             i18n.phonenumbers.NumberFormat, descriptorObj);
  }
  return i18n.phonenumbers.NumberFormat.descriptor_;
};


// Export getDescriptor static function robust to minification.
i18n.phonenumbers.NumberFormat['ctor'] = i18n.phonenumbers.NumberFormat;
i18n.phonenumbers.NumberFormat['ctor'].getDescriptor =
    i18n.phonenumbers.NumberFormat.prototype.getDescriptor;


/** @override */
i18n.phonenumbers.PhoneNumberDesc.prototype.getDescriptor = function() {
  if (!i18n.phonenumbers.PhoneNumberDesc.descriptor_) {
    // The descriptor is created lazily when we instantiate a new instance.
    var descriptorObj = {
      0: {
        name: 'PhoneNumberDesc',
        fullName: 'i18n.phonenumbers.PhoneNumberDesc'
      },
      2: {
        name: 'national_number_pattern',
        fieldType: goog.proto2.Message.FieldType.STRING,
        type: String
      },
      3: {
        name: 'possible_number_pattern',
        fieldType: goog.proto2.Message.FieldType.STRING,
        type: String
      },
      6: {
        name: 'example_number',
        fieldType: goog.proto2.Message.FieldType.STRING,
        type: String
      },
      7: {
        name: 'national_number_matcher_data',
        fieldType: goog.proto2.Message.FieldType.BYTES,
        type: String
      },
      8: {
        name: 'possible_number_matcher_data',
        fieldType: goog.proto2.Message.FieldType.BYTES,
        type: String
      }
    };
    i18n.phonenumbers.PhoneNumberDesc.descriptor_ =
        goog.proto2.Message.createDescriptor(
             i18n.phonenumbers.PhoneNumberDesc, descriptorObj);
  }
  return i18n.phonenumbers.PhoneNumberDesc.descriptor_;
};


// Export getDescriptor static function robust to minification.
i18n.phonenumbers.PhoneNumberDesc['ctor'] = i18n.phonenumbers.PhoneNumberDesc;
i18n.phonenumbers.PhoneNumberDesc['ctor'].getDescriptor =
    i18n.phonenumbers.PhoneNumberDesc.prototype.getDescriptor;


/** @override */
i18n.phonenumbers.PhoneMetadata.prototype.getDescriptor = function() {
  if (!i18n.phonenumbers.PhoneMetadata.descriptor_) {
    // The descriptor is created lazily when we instantiate a new instance.
    var descriptorObj = {
      0: {
        name: 'PhoneMetadata',
        fullName: 'i18n.phonenumbers.PhoneMetadata'
      },
      1: {
        name: 'general_desc',
        fieldType: goog.proto2.Message.FieldType.MESSAGE,
        type: i18n.phonenumbers.PhoneNumberDesc
      },
      2: {
        name: 'fixed_line',
        fieldType: goog.proto2.Message.FieldType.MESSAGE,
        type: i18n.phonenumbers.PhoneNumberDesc
      },
      3: {
        name: 'mobile',
        fieldType: goog.proto2.Message.FieldType.MESSAGE,
        type: i18n.phonenumbers.PhoneNumberDesc
      },
      4: {
        name: 'toll_free',
        fieldType: goog.proto2.Message.FieldType.MESSAGE,
        type: i18n.phonenumbers.PhoneNumberDesc
      },
      5: {
        name: 'premium_rate',
        fieldType: goog.proto2.Message.FieldType.MESSAGE,
        type: i18n.phonenumbers.PhoneNumberDesc
      },
      6: {
        name: 'shared_cost',
        fieldType: goog.proto2.Message.FieldType.MESSAGE,
        type: i18n.phonenumbers.PhoneNumberDesc
      },
      7: {
        name: 'personal_number',
        fieldType: goog.proto2.Message.FieldType.MESSAGE,
        type: i18n.phonenumbers.PhoneNumberDesc
      },
      8: {
        name: 'voip',
        fieldType: goog.proto2.Message.FieldType.MESSAGE,
        type: i18n.phonenumbers.PhoneNumberDesc
      },
      21: {
        name: 'pager',
        fieldType: goog.proto2.Message.FieldType.MESSAGE,
        type: i18n.phonenumbers.PhoneNumberDesc
      },
      25: {
        name: 'uan',
        fieldType: goog.proto2.Message.FieldType.MESSAGE,
        type: i18n.phonenumbers.PhoneNumberDesc
      },
      27: {
        name: 'emergency',
        fieldType: goog.proto2.Message.FieldType.MESSAGE,
        type: i18n.phonenumbers.PhoneNumberDesc
      },
      28: {
        name: 'voicemail',
        fieldType: goog.proto2.Message.FieldType.MESSAGE,
        type: i18n.phonenumbers.PhoneNumberDesc
      },
      24: {
        name: 'no_international_dialling',
        fieldType: goog.proto2.Message.FieldType.MESSAGE,
        type: i18n.phonenumbers.PhoneNumberDesc
      },
      9: {
        name: 'id',
        required: true,
        fieldType: goog.proto2.Message.FieldType.STRING,
        type: String
      },
      10: {
        name: 'country_code',
        fieldType: goog.proto2.Message.FieldType.INT32,
        type: Number
      },
      11: {
        name: 'international_prefix',
        fieldType: goog.proto2.Message.FieldType.STRING,
        type: String
      },
      17: {
        name: 'preferred_international_prefix',
        fieldType: goog.proto2.Message.FieldType.STRING,
        type: String
      },
      12: {
        name: 'national_prefix',
        fieldType: goog.proto2.Message.FieldType.STRING,
        type: String
      },
      13: {
        name: 'preferred_extn_prefix',
        fieldType: goog.proto2.Message.FieldType.STRING,
        type: String
      },
      15: {
        name: 'national_prefix_for_parsing',
        fieldType: goog.proto2.Message.FieldType.STRING,
        type: String
      },
      16: {
        name: 'national_prefix_transform_rule',
        fieldType: goog.proto2.Message.FieldType.STRING,
        type: String
      },
      18: {
        name: 'same_mobile_and_fixed_line_pattern',
        fieldType: goog.proto2.Message.FieldType.BOOL,
        defaultValue: false,
        type: Boolean
      },
      19: {
        name: 'number_format',
        repeated: true,
        fieldType: goog.proto2.Message.FieldType.MESSAGE,
        type: i18n.phonenumbers.NumberFormat
      },
      20: {
        name: 'intl_number_format',
        repeated: true,
        fieldType: goog.proto2.Message.FieldType.MESSAGE,
        type: i18n.phonenumbers.NumberFormat
      },
      22: {
        name: 'main_country_for_code',
        fieldType: goog.proto2.Message.FieldType.BOOL,
        defaultValue: false,
        type: Boolean
      },
      23: {
        name: 'leading_digits',
        fieldType: goog.proto2.Message.FieldType.STRING,
        type: String
      },
      26: {
        name: 'leading_zero_possible',
        fieldType: goog.proto2.Message.FieldType.BOOL,
        defaultValue: false,
        type: Boolean
      }
    };
    i18n.phonenumbers.PhoneMetadata.descriptor_ =
        goog.proto2.Message.createDescriptor(
             i18n.phonenumbers.PhoneMetadata, descriptorObj);
  }
  return i18n.phonenumbers.PhoneMetadata.descriptor_;
};


// Export getDescriptor static function robust to minification.
i18n.phonenumbers.PhoneMetadata['ctor'] = i18n.phonenumbers.PhoneMetadata;
i18n.phonenumbers.PhoneMetadata['ctor'].getDescriptor =
    i18n.phonenumbers.PhoneMetadata.prototype.getDescriptor;


/** @override */
i18n.phonenumbers.PhoneMetadataCollection.prototype.getDescriptor = function() {
  if (!i18n.phonenumbers.PhoneMetadataCollection.descriptor_) {
    // The descriptor is created lazily when we instantiate a new instance.
    var descriptorObj = {
      0: {
        name: 'PhoneMetadataCollection',
        fullName: 'i18n.phonenumbers.PhoneMetadataCollection'
      },
      1: {
        name: 'metadata',
        repeated: true,
        fieldType: goog.proto2.Message.FieldType.MESSAGE,
        type: i18n.phonenumbers.PhoneMetadata
      }
    };
    i18n.phonenumbers.PhoneMetadataCollection.descriptor_ =
        goog.proto2.Message.createDescriptor(
             i18n.phonenumbers.PhoneMetadataCollection, descriptorObj);
  }
  return i18n.phonenumbers.PhoneMetadataCollection.descriptor_;
};


// Export getDescriptor static function robust to minification.
i18n.phonenumbers.PhoneMetadataCollection['ctor'] = i18n.phonenumbers.PhoneMetadataCollection;
i18n.phonenumbers.PhoneMetadataCollection['ctor'].getDescriptor =
    i18n.phonenumbers.PhoneMetadataCollection.prototype.getDescriptor;
/**
 * @license
 * Copyright (C) 2010 The Libphonenumber Authors
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 * http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

/**
 * @fileoverview Generated metadata for file
 * ../resources/PhoneNumberMetadata.xml
 * @author Nikolaos Trogkanis
 */

i18n.phonenumbers.metadata = {};

/**
 * A mapping from a country calling code to the region codes which denote the
 * region represented by that country calling code. In the case of multiple
 * countries sharing a calling code, such as the NANPA regions, the one
 * indicated with "isMainCountryForCode" in the metadata should be first.
 * @type {!Object.<number, Array.<string>>}
 */
i18n.phonenumbers.metadata.countryCodeToRegionCodeMap = {
1:["US","AG","AI","AS","BB","BM","BS","CA","DM","DO","GD","GU","JM","KN","KY","LC","MP","MS","PR","SX","TC","TT","VC","VG","VI"]
,7:["RU","KZ"]
,20:["EG"]
,27:["ZA"]
,30:["GR"]
,31:["NL"]
,32:["BE"]
,33:["FR"]
,34:["ES"]
,36:["HU"]
,39:["IT","VA"]
,40:["RO"]
,41:["CH"]
,43:["AT"]
,44:["GB","GG","IM","JE"]
,45:["DK"]
,46:["SE"]
,47:["NO","SJ"]
,48:["PL"]
,49:["DE"]
,51:["PE"]
,52:["MX"]
,53:["CU"]
,54:["AR"]
,55:["BR"]
,56:["CL"]
,57:["CO"]
,58:["VE"]
,60:["MY"]
,61:["AU","CC","CX"]
,62:["ID"]
,63:["PH"]
,64:["NZ"]
,65:["SG"]
,66:["TH"]
,81:["JP"]
,82:["KR"]
,84:["VN"]
,86:["CN"]
,90:["TR"]
,91:["IN"]
,92:["PK"]
,93:["AF"]
,94:["LK"]
,95:["MM"]
,98:["IR"]
,211:["SS"]
,212:["MA","EH"]
,213:["DZ"]
,216:["TN"]
,218:["LY"]
,220:["GM"]
,221:["SN"]
,222:["MR"]
,223:["ML"]
,224:["GN"]
,225:["CI"]
,226:["BF"]
,227:["NE"]
,228:["TG"]
,229:["BJ"]
,230:["MU"]
,231:["LR"]
,232:["SL"]
,233:["GH"]
,234:["NG"]
,235:["TD"]
,236:["CF"]
,237:["CM"]
,238:["CV"]
,239:["ST"]
,240:["GQ"]
,241:["GA"]
,242:["CG"]
,243:["CD"]
,244:["AO"]
,245:["GW"]
,246:["IO"]
,247:["AC"]
,248:["SC"]
,249:["SD"]
,250:["RW"]
,251:["ET"]
,252:["SO"]
,253:["DJ"]
,254:["KE"]
,255:["TZ"]
,256:["UG"]
,257:["BI"]
,258:["MZ"]
,260:["ZM"]
,261:["MG"]
,262:["RE","YT"]
,263:["ZW"]
,264:["NA"]
,265:["MW"]
,266:["LS"]
,267:["BW"]
,268:["SZ"]
,269:["KM"]
,290:["SH","TA"]
,291:["ER"]
,297:["AW"]
,298:["FO"]
,299:["GL"]
,350:["GI"]
,351:["PT"]
,352:["LU"]
,353:["IE"]
,354:["IS"]
,355:["AL"]
,356:["MT"]
,357:["CY"]
,358:["FI","AX"]
,359:["BG"]
,370:["LT"]
,371:["LV"]
,372:["EE"]
,373:["MD"]
,374:["AM"]
,375:["BY"]
,376:["AD"]
,377:["MC"]
,378:["SM"]
,380:["UA"]
,381:["RS"]
,382:["ME"]
,385:["HR"]
,386:["SI"]
,387:["BA"]
,389:["MK"]
,420:["CZ"]
,421:["SK"]
,423:["LI"]
,500:["FK"]
,501:["BZ"]
,502:["GT"]
,503:["SV"]
,504:["HN"]
,505:["NI"]
,506:["CR"]
,507:["PA"]
,508:["PM"]
,509:["HT"]
,590:["GP","BL","MF"]
,591:["BO"]
,592:["GY"]
,593:["EC"]
,594:["GF"]
,595:["PY"]
,596:["MQ"]
,597:["SR"]
,598:["UY"]
,599:["CW","BQ"]
,670:["TL"]
,672:["NF"]
,673:["BN"]
,674:["NR"]
,675:["PG"]
,676:["TO"]
,677:["SB"]
,678:["VU"]
,679:["FJ"]
,680:["PW"]
,681:["WF"]
,682:["CK"]
,683:["NU"]
,685:["WS"]
,686:["KI"]
,687:["NC"]
,688:["TV"]
,689:["PF"]
,690:["TK"]
,691:["FM"]
,692:["MH"]
,800:["001"]
,808:["001"]
,850:["KP"]
,852:["HK"]
,853:["MO"]
,855:["KH"]
,856:["LA"]
,870:["001"]
,878:["001"]
,880:["BD"]
,881:["001"]
,882:["001"]
,883:["001"]
,886:["TW"]
,888:["001"]
,960:["MV"]
,961:["LB"]
,962:["JO"]
,963:["SY"]
,964:["IQ"]
,965:["KW"]
,966:["SA"]
,967:["YE"]
,968:["OM"]
,970:["PS"]
,971:["AE"]
,972:["IL"]
,973:["BH"]
,974:["QA"]
,975:["BT"]
,976:["MN"]
,977:["NP"]
,979:["001"]
,992:["TJ"]
,993:["TM"]
,994:["AZ"]
,995:["GE"]
,996:["KG"]
,998:["UZ"]
};

/**
 * A mapping from a region code to the PhoneMetadata for that region.
 * @type {!Object.<string, Array>}
 */
i18n.phonenumbers.metadata.countryToMetadata = {
"AC":[,[,,"[46]\\d{4}|[01589]\\d{5}","\\d{5,6}"]
,[,,"6[2-467]\\d{3}","\\d{5}",,,"62889"]
,[,,"4\\d{4}","\\d{5}",,,"40123"]
,[,,"NA","NA"]
,[,,"NA","NA"]
,[,,"NA","NA"]
,[,,"NA","NA"]
,[,,"NA","NA"]
,"AC",247,"00",,,,,,,,,,[,,"NA","NA"]
,,,[,,"NA","NA"]
,[,,"[01589]\\d{5}","\\d{6}",,,"542011"]
,,,[,,"NA","NA"]
]
,"AD":[,[,,"(?:[346-9]|180)\\d{5}","\\d{6,8}"]
,[,,"[78]\\d{5}","\\d{6}",,,"712345"]
,[,,"[346]\\d{5}","\\d{6}",,,"312345"]
,[,,"180[02]\\d{4}","\\d{8}",,,"18001234"]
,[,,"9\\d{5}","\\d{6}",,,"912345"]
,[,,"NA","NA"]
,[,,"NA","NA"]
,[,,"NA","NA"]
,"AD",376,"00",,,,,,,,[[,"(\\d{3})(\\d{3})","$1 $2",["[346-9]"]
,"","",0]
,[,"(180[02])(\\d{4})","$1 $2",["1"]
,"","",0]
]
,,[,,"NA","NA"]
,,,[,,"NA","NA"]
,[,,"NA","NA"]
,,,[,,"NA","NA"]
]
,"AE":[,[,,"[2-79]\\d{7,8}|800\\d{2,9}","\\d{5,12}"]
,[,,"[2-4679][2-8]\\d{6}","\\d{7,8}",,,"22345678"]
,[,,"5[0256]\\d{7}","\\d{9}",,,"501234567"]
,[,,"400\\d{6}|800\\d{2,9}","\\d{5,12}",,,"800123456"]
,[,,"900[02]\\d{5}","\\d{9}",,,"900234567"]
,[,,"700[05]\\d{5}","\\d{9}",,,"700012345"]
,[,,"NA","NA"]
,[,,"NA","NA"]
,"AE",971,"00","0",,,"0",,,,[[,"([2-4679])(\\d{3})(\\d{4})","$1 $2 $3",["[2-4679][2-8]"]
,"0$1","",0]
,[,"(5[0256])(\\d{3})(\\d{4})","$1 $2 $3",["5"]
,"0$1","",0]
,[,"([479]00)(\\d)(\\d{5})","$1 $2 $3",["[479]0"]
,"$1","",0]
,[,"([68]00)(\\d{2,9})","$1 $2",["60|8"]
,"$1","",0]
]
,,[,,"NA","NA"]
,,,[,,"NA","NA"]
,[,,"600[25]\\d{5}","\\d{9}",,,"600212345"]
,,,[,,"NA","NA"]
]
,"AF":[,[,,"[2-7]\\d{8}","\\d{7,9}"]
,[,,"(?:[25][0-8]|[34][0-4]|6[0-5])[2-9]\\d{6}","\\d{7,9}",,,"234567890"]
,[,,"7(?:[014-9]\\d{7}|2[89]\\d{6})","\\d{9}",,,"701234567"]
,[,,"NA","NA"]
,[,,"NA","NA"]
,[,,"NA","NA"]
,[,,"NA","NA"]
,[,,"NA","NA"]
,"AF",93,"00","0",,,"0",,,,[[,"([2-7]\\d)(\\d{3})(\\d{4})","$1 $2 $3",["[2-7]"]
,"0$1","",0]
]
,,[,,"NA","NA"]
,,,[,,"NA","NA"]
,[,,"NA","NA"]
,,,[,,"NA","NA"]
]
,"AG":[,[,,"[2589]\\d{9}","\\d{7}(?:\\d{3})?"]
,[,,"268(?:4(?:6[0-38]|84)|56[0-2])\\d{4}","\\d{7}(?:\\d{3})?",,,"2684601234"]
,[,,"268(?:464|7(?:2[0-9]|64|7[0-689]|8[02-68]))\\d{4}","\\d{10}",,,"2684641234"]
,[,,"8(?:00|44|55|66|77|88)[2-9]\\d{6}","\\d{10}",,,"8002123456"]
,[,,"900[2-9]\\d{6}","\\d{10}",,,"9002123456"]
,[,,"NA","NA"]
,[,,"5(?:00|33|44|66|77)[2-9]\\d{6}","\\d{10}",,,"5002345678"]
,[,,"26848[01]\\d{4}","\\d{10}",,,"2684801234"]
,"AG",1,"011","1",,,"1",,,,,,[,,"26840[69]\\d{4}","\\d{10}",,,"2684061234"]
,,"268",[,,"NA","NA"]
,[,,"NA","NA"]
,,,[,,"NA","NA"]
]
,"AI":[,[,,"[2589]\\d{9}","\\d{7}(?:\\d{3})?"]
,[,,"2644(?:6[12]|9[78])\\d{4}","\\d{7}(?:\\d{3})?",,,"2644612345"]
,[,,"264(?:235|476|5(?:3[6-9]|8[1-4])|7(?:29|72))\\d{4}","\\d{10}",,,"2642351234"]
,[,,"8(?:00|44|55|66|77|88)[2-9]\\d{6}","\\d{10}",,,"8002123456"]
,[,,"900[2-9]\\d{6}","\\d{10}",,,"9002123456"]
,[,,"NA","NA"]
,[,,"5(?:00|33|44|66|77)[2-9]\\d{6}","\\d{10}",,,"5002345678"]
,[,,"NA","NA"]
,"AI",1,"011","1",,,"1",,,,,,[,,"NA","NA"]
,,"264",[,,"NA","NA"]
,[,,"NA","NA"]
,,,[,,"NA","NA"]
]
,"AL":[,[,,"[2-57]\\d{7}|6\\d{8}|8\\d{5,7}|9\\d{5}","\\d{5,9}"]
,[,,"(?:2(?:[168][1-9]|[247]\\d|9[1-7])|3(?:1[1-3]|[2-6]\\d|[79][1-8]|8[1-9])|4\\d{2}|5(?:1[1-4]|[2-578]\\d|6[1-5]|9[1-7])|8(?:[19][1-5]|[2-6]\\d|[78][1-7]))\\d{5}","\\d{5,8}",,,"22345678"]
,[,,"6[6-9]\\d{7}","\\d{9}",,,"661234567"]
,[,,"800\\d{4}","\\d{7}",,,"8001234"]
,[,,"900\\d{3}","\\d{6}",,,"900123"]
,[,,"808\\d{3}","\\d{6}",,,"808123"]
,[,,"700\\d{5}","\\d{8}",,,"70012345"]
,[,,"NA","NA"]
,"AL",355,"00","0",,,"0",,,,[[,"(4)(\\d{3})(\\d{4})","$1 $2 $3",["4[0-6]"]
,"0$1","",0]
,[,"(6[6-9])(\\d{3})(\\d{4})","$1 $2 $3",["6"]
,"0$1","",0]
,[,"(\\d{2})(\\d{3})(\\d{3})","$1 $2 $3",["[2358][2-5]|4[7-9]"]
,"0$1","",0]
,[,"(\\d{3})(\\d{3,5})","$1 $2",["[235][16-9]|8[016-9]|[79]"]
,"0$1","",0]
]
,,[,,"NA","NA"]
,,,[,,"NA","NA"]
,[,,"NA","NA"]
,,,[,,"NA","NA"]
]
,"AM":[,[,,"[1-9]\\d{7}","\\d{5,8}"]
,[,,"(?:1[01]\\d|2(?:2[2-46]|3[1-8]|4[2-69]|5[2-7]|6[1-9]|8[1-7])|3[12]2|47\\d)\\d{5}","\\d{5,8}",,,"10123456"]
,[,,"(?:4[139]|55|77|9[1-9])\\d{6}","\\d{8}",,,"77123456"]
,[,,"800\\d{5}","\\d{8}",,,"80012345"]
,[,,"90[016]\\d{5}","\\d{8}",,,"90012345"]
,[,,"80[1-4]\\d{5}","\\d{8}",,,"80112345"]
,[,,"NA","NA"]
,[,,"60[2-6]\\d{5}","\\d{8}",,,"60271234"]
,"AM",374,"00","0",,,"0",,,,[[,"(\\d{2})(\\d{6})","$1 $2",["1|47"]
,"(0$1)","",0]
,[,"(\\d{2})(\\d{6})","$1 $2",["4[139]|[5-7]|9[1-9]"]
,"0$1","",0]
,[,"(\\d{3})(\\d{5})","$1 $2",["[23]"]
,"(0$1)","",0]
,[,"(\\d{3})(\\d{2})(\\d{3})","$1 $2 $3",["8|90"]
,"0 $1","",0]
]
,,[,,"NA","NA"]
,,,[,,"NA","NA"]
,[,,"NA","NA"]
,,,[,,"NA","NA"]
]
,"AO":[,[,,"[29]\\d{8}","\\d{9}"]
,[,,"2\\d(?:[26-9]\\d|\\d[26-9])\\d{5}","\\d{9}",,,"222123456"]
,[,,"9[1-49]\\d{7}","\\d{9}",,,"923123456"]
,[,,"NA","NA"]
,[,,"NA","NA"]
,[,,"NA","NA"]
,[,,"NA","NA"]
,[,,"NA","NA"]
,"AO",244,"00",,,,,,,,[[,"(\\d{3})(\\d{3})(\\d{3})","$1 $2 $3",,"","",0]
]
,,[,,"NA","NA"]
,,,[,,"NA","NA"]
,[,,"NA","NA"]
,,,[,,"NA","NA"]
]
,"AR":[,[,,"11\\d{8}|[2368]\\d{9}|9\\d{10}","\\d{6,11}"]
,[,,"11\\d{8}|(?:2(?:2(?:[013]\\d|2[13-79]|4[1-6]|5[2457]|6[124-8]|7[1-4]|8[13-6]|9[1267])|3(?:1[467]|2[03-6]|3[13-8]|[49][2-6]|5[2-8]|[067]\\d)|4(?:7[3-8]|9\\d)|6(?:[01346]\\d|2[24-6]|5[15-8])|80\\d|9(?:[0124789]\\d|3[1-6]|5[234]|6[2-46]))|3(?:3(?:2[79]|6\\d|8[2578])|4(?:[78]\\d|0[0124-9]|[1-35]\\d|4[24-7]|6[02-9]|9[123678])|5(?:[138]\\d|2[1245]|4[1-9]|6[2-4]|7[1-6])|6[24]\\d|7(?:[0469]\\d|1[1568]|2[013-9]|3[145]|5[14-8]|7[2-57]|8[0-24-9])|8(?:[013578]\\d|2[15-7]|4[13-6]|6[1-357-9]|9[124]))|670\\d)\\d{6}","\\d{6,10}",,,"1123456789"]
,[,,"675\\d{7}|9(?:11[2-9]\\d{7}|(?:2(?:2[013]|3[067]|49|6[01346]|80|9[147-9])|3(?:36|4[12358]|5[138]|6[24]|7[069]|8[013578]))[2-9]\\d{6}|\\d{4}[2-9]\\d{5})","\\d{6,11}",,,"91123456789"]
,[,,"800\\d{7}","\\d{10}",,,"8001234567"]
,[,,"60[04579]\\d{7}","\\d{10}",,,"6001234567"]
,[,,"NA","NA"]
,[,,"NA","NA"]
,[,,"NA","NA"]
,"AR",54,"00","0",,,"0?(?:(11|2(?:2(?:02?|[13]|2[13-79]|4[1-6]|5[2457]|6[124-8]|7[1-4]|8[13-6]|9[1267])|3(?:02?|1[467]|2[03-6]|3[13-8]|[49][2-6]|5[2-8]|[67])|4(?:7[3-578]|9)|6(?:[0136]|2[24-6]|4[6-8]?|5[15-8])|80|9(?:0[1-3]|[19]|2\\d|3[1-6]|4[02568]?|5[2-4]|6[2-46]|72?|8[23]?))|3(?:3(?:2[79]|6|8[2578])|4(?:0[0-24-9]|[12]|3[5-8]?|4[24-7]|5[4-68]?|6[02-9]|7[126]|8[2379]?|9[1-36-8])|5(?:1|2[1245]|3[237]?|4[1-46-9]|6[2-4]|7[1-6]|8[2-5]?)|6[24]|7(?:[069]|1[1568]|2[15]|3[145]|4[13]|5[14-8]|7[2-57]|8[126])|8(?:[01]|2[15-7]|3[2578]?|4[13-6]|5[4-8]?|6[1-357-9]|7[36-8]?|8[5-8]?|9[124])))?15)?","9$1",,,[[,"([68]\\d{2})(\\d{3})(\\d{4})","$1-$2-$3",["[68]"]
,"0$1","",0]
,[,"(\\d{2})(\\d{4})","$1-$2",["[2-9]"]
,"$1","",0]
,[,"(\\d{3})(\\d{4})","$1-$2",["[2-9]"]
,"$1","",0]
,[,"(\\d{4})(\\d{4})","$1-$2",["[2-9]"]
,"$1","",0]
,[,"(9)(11)(\\d{4})(\\d{4})","$2 15-$3-$4",["911"]
,"0$1","",0]
,[,"(9)(\\d{3})(\\d{3})(\\d{4})","$2 15-$3-$4",["9(?:2[234689]|3[3-8])","9(?:2(?:2[013]|3[067]|49|6[01346]|80|9[147-9])|3(?:36|4[1-358]|5[138]|6[24]|7[069]|8[013578]))","9(?:2(?:2(?:0[013-9]|[13])|3(?:0[013-9]|[67])|49|6(?:[0136]|4[0-59])|8|9(?:[19]|44|7[013-9]|8[14]))|3(?:36|4(?:[12]|3[456]|[58]4)|5(?:1|3[0-24-689]|8[46])|6|7[069]|8(?:[01]|34|[578][45])))","9(?:2(?:2(?:0[013-9]|[13])|3(?:0[013-9]|[67])|49|6(?:[0136]|4[0-59])|8|9(?:[19]|44|7[013-9]|8[14]))|3(?:36|4(?:[12]|3(?:4|5[014]|6[1239])|[58]4)|5(?:1|3[0-24-689]|8[46])|6|7[069]|8(?:[01]|34|[578][45])))"]
,"0$1","",0]
,[,"(9)(\\d{4})(\\d{2})(\\d{4})","$2 15-$3-$4",["9[23]"]
,"0$1","",0]
,[,"(11)(\\d{4})(\\d{4})","$1 $2-$3",["1"]
,"0$1","",1]
,[,"(\\d{3})(\\d{3})(\\d{4})","$1 $2-$3",["2(?:2[013]|3[067]|49|6[01346]|80|9[147-9])|3(?:36|4[1-358]|5[138]|6[24]|7[069]|8[013578])","2(?:2(?:0[013-9]|[13])|3(?:0[013-9]|[67])|49|6(?:[0136]|4[0-59])|8|9(?:[19]|44|7[013-9]|8[14]))|3(?:36|4(?:[12]|3[456]|[58]4)|5(?:1|3[0-24-689]|8[46])|6|7[069]|8(?:[01]|34|[578][45]))","2(?:2(?:0[013-9]|[13])|3(?:0[013-9]|[67])|49|6(?:[0136]|4[0-59])|8|9(?:[19]|44|7[013-9]|8[14]))|3(?:36|4(?:[12]|3(?:4|5[014]|6[1239])|[58]4)|5(?:1|3[0-24-689]|8[46])|6|7[069]|8(?:[01]|34|[578][45]))"]
,"0$1","",1]
,[,"(\\d{4})(\\d{2})(\\d{4})","$1 $2-$3",["[23]"]
,"0$1","",1]
,[,"(\\d{3})","$1",["1[012]|911"]
,"$1","",0]
]
,[[,"([68]\\d{2})(\\d{3})(\\d{4})","$1-$2-$3",["[68]"]
,"0$1","",0]
,[,"(9)(11)(\\d{4})(\\d{4})","$1 $2 $3-$4",["911"]
]
,[,"(9)(\\d{3})(\\d{3})(\\d{4})","$1 $2 $3-$4",["9(?:2[234689]|3[3-8])","9(?:2(?:2[013]|3[067]|49|6[01346]|80|9[147-9])|3(?:36|4[1-358]|5[138]|6[24]|7[069]|8[013578]))","9(?:2(?:2(?:0[013-9]|[13])|3(?:0[013-9]|[67])|49|6(?:[0136]|4[0-59])|8|9(?:[19]|44|7[013-9]|8[14]))|3(?:36|4(?:[12]|3[456]|[58]4)|5(?:1|3[0-24-689]|8[46])|6|7[069]|8(?:[01]|34|[578][45])))","9(?:2(?:2(?:0[013-9]|[13])|3(?:0[013-9]|[67])|49|6(?:[0136]|4[0-59])|8|9(?:[19]|44|7[013-9]|8[14]))|3(?:36|4(?:[12]|3(?:4|5[014]|6[1239])|[58]4)|5(?:1|3[0-24-689]|8[46])|6|7[069]|8(?:[01]|34|[578][45])))"]
]
,[,"(9)(\\d{4})(\\d{2})(\\d{4})","$1 $2 $3-$4",["9[23]"]
]
,[,"(11)(\\d{4})(\\d{4})","$1 $2-$3",["1"]
,"0$1","",1]
,[,"(\\d{3})(\\d{3})(\\d{4})","$1 $2-$3",["2(?:2[013]|3[067]|49|6[01346]|80|9[147-9])|3(?:36|4[1-358]|5[138]|6[24]|7[069]|8[013578])","2(?:2(?:0[013-9]|[13])|3(?:0[013-9]|[67])|49|6(?:[0136]|4[0-59])|8|9(?:[19]|44|7[013-9]|8[14]))|3(?:36|4(?:[12]|3[456]|[58]4)|5(?:1|3[0-24-689]|8[46])|6|7[069]|8(?:[01]|34|[578][45]))","2(?:2(?:0[013-9]|[13])|3(?:0[013-9]|[67])|49|6(?:[0136]|4[0-59])|8|9(?:[19]|44|7[013-9]|8[14]))|3(?:36|4(?:[12]|3(?:4|5[014]|6[1239])|[58]4)|5(?:1|3[0-24-689]|8[46])|6|7[069]|8(?:[01]|34|[578][45]))"]
,"0$1","",1]
,[,"(\\d{4})(\\d{2})(\\d{4})","$1 $2-$3",["[23]"]
,"0$1","",1]
]
,[,,"NA","NA"]
,,,[,,"810\\d{7}","\\d{10}",,,"8101234567"]
,[,,"810\\d{7}","\\d{10}",,,"8101234567"]
,,,[,,"NA","NA"]
]
,"AS":[,[,,"[5689]\\d{9}","\\d{7}(?:\\d{3})?"]
,[,,"6846(?:22|33|44|55|77|88|9[19])\\d{4}","\\d{7}(?:\\d{3})?",,,"6846221234"]
,[,,"684(?:2(?:5[2468]|72)|7(?:3[13]|70))\\d{4}","\\d{10}",,,"6847331234"]
,[,,"8(?:00|44|55|66|77|88)[2-9]\\d{6}","\\d{10}",,,"8002123456"]
,[,,"900[2-9]\\d{6}","\\d{10}",,,"9002123456"]
,[,,"NA","NA"]
,[,,"5(?:00|33|44|66|77)[2-9]\\d{6}","\\d{10}",,,"5002345678"]
,[,,"NA","NA"]
,"AS",1,"011","1",,,"1",,,,,,[,,"NA","NA"]
,,"684",[,,"NA","NA"]
,[,,"NA","NA"]
,,,[,,"NA","NA"]
]
,"AT":[,[,,"[1-9]\\d{3,12}","\\d{3,13}"]
,[,,"1\\d{3,12}|(?:2(?:1[467]|2[13-8]|5[2357]|6[1-46-8]|7[1-8]|8[124-7]|9[1458])|3(?:1[1-8]|3[23568]|4[5-7]|5[1378]|6[1-38]|8[3-68])|4(?:2[1-8]|35|63|7[1368]|8[2457])|5(?:12|2[1-8]|3[357]|4[147]|5[12578]|6[37])|6(?:13|2[1-47]|4[1-35-8]|5[468]|62)|7(?:2[1-8]|3[25]|4[13478]|5[68]|6[16-8]|7[1-6]|9[45]))\\d{3,10}","\\d{3,13}",,,"1234567890"]
,[,,"6(?:44|5[0-3579]|6[013-9]|[7-9]\\d)\\d{4,10}","\\d{7,13}",,,"644123456"]
,[,,"80[02]\\d{6,10}","\\d{9,13}",,,"800123456"]
,[,,"(?:711|9(?:0[01]|3[019]))\\d{6,10}","\\d{9,13}",,,"900123456"]
,[,,"8(?:10|2[018])\\d{6,10}","\\d{9,13}",,,"810123456"]
,[,,"NA","NA"]
,[,,"780\\d{6,10}","\\d{9,13}",,,"780123456"]
,"AT",43,"00","0",,,"0",,,,[[,"(1)(\\d{3,12})","$1 $2",["1"]
,"0$1","",0]
,[,"(5\\d)(\\d{3,5})","$1 $2",["5[079]"]
,"0$1","",0]
,[,"(5\\d)(\\d{3})(\\d{3,4})","$1 $2 $3",["5[079]"]
,"0$1","",0]
,[,"(5\\d)(\\d{4})(\\d{4,7})","$1 $2 $3",["5[079]"]
,"0$1","",0]
,[,"(\\d{3})(\\d{3,10})","$1 $2",["316|46|51|732|6(?:44|5[0-3579]|[6-9])|7(?:1|[28]0)|[89]"]
,"0$1","",0]
,[,"(\\d{4})(\\d{3,9})","$1 $2",["2|3(?:1[1-578]|[3-8])|4[2378]|5[2-6]|6(?:[12]|4[1-35-9]|5[468])|7(?:2[1-8]|35|4[1-8]|[5-79])"]
,"0$1","",0]
]
,,[,,"NA","NA"]
,,,[,,"NA","NA"]
,[,,"5(?:(?:0[1-9]|17)\\d{2,10}|[79]\\d{3,11})|720\\d{6,10}","\\d{5,13}",,,"50123"]
,,,[,,"NA","NA"]
]
,"AU":[,[,,"[1-578]\\d{5,9}","\\d{6,10}"]
,[,,"[237]\\d{8}|8(?:[68]\\d{3}|7[0-69]\\d{2}|9(?:[02-9]\\d{2}|1(?:[0-57-9]\\d|6[0135-9])))\\d{4}","\\d{8,9}",,,"212345678"]
,[,,"14(?:5\\d|71)\\d{5}|4(?:[0-2]\\d|3[0-57-9]|4[47-9]|5[0-25-9]|6[6-9]|7[03-9]|8[147-9]|9[017-9])\\d{6}","\\d{9}",,,"412345678"]
,[,,"180(?:0\\d{3}|2)\\d{3}","\\d{7,10}",,,"1800123456"]
,[,,"190[0126]\\d{6}","\\d{10}",,,"1900123456"]
,[,,"13(?:00\\d{2})?\\d{4}","\\d{6,10}",,,"1300123456"]
,[,,"500\\d{6}","\\d{9}",,,"500123456"]
,[,,"550\\d{6}","\\d{9}",,,"550123456"]
,"AU",61,"(?:14(?:1[14]|34|4[17]|[56]6|7[47]|88))?001[14-689]","0",,,"0",,"0011",,[[,"([2378])(\\d{4})(\\d{4})","$1 $2 $3",["[2378]"]
,"(0$1)","",0]
,[,"(\\d{3})(\\d{3})(\\d{3})","$1 $2 $3",["[45]|14"]
,"0$1","",0]
,[,"(16)(\\d{3})(\\d{2,4})","$1 $2 $3",["16"]
,"0$1","",0]
,[,"(1[389]\\d{2})(\\d{3})(\\d{3})","$1 $2 $3",["1(?:[38]0|90)","1(?:[38]00|90)"]
,"$1","",0]
,[,"(180)(2\\d{3})","$1 $2",["180","1802"]
,"$1","",0]
,[,"(19\\d)(\\d{3})","$1 $2",["19[13]"]
,"$1","",0]
,[,"(19\\d{2})(\\d{4})","$1 $2",["19[67]"]
,"$1","",0]
,[,"(13)(\\d{2})(\\d{2})","$1 $2 $3",["13[1-9]"]
,"$1","",0]
]
,,[,,"16\\d{3,7}","\\d{5,9}",,,"1612345"]
,1,,[,,"1(?:3(?:\\d{4}|00\\d{6})|80(?:0\\d{6}|2\\d{3}))","\\d{6,10}",,,"1300123456"]
,[,,"NA","NA"]
,,,[,,"NA","NA"]
]
,"AW":[,[,,"[25-9]\\d{6}","\\d{7}"]
,[,,"5(?:2\\d|8[1-9])\\d{4}","\\d{7}",,,"5212345"]
,[,,"(?:5(?:6\\d|9[2-478])|6(?:[039]0|22|4[01]|6[0-2])|7[34]\\d|9(?:6[45]|9[4-8]))\\d{4}","\\d{7}",,,"5601234"]
,[,,"800\\d{4}","\\d{7}",,,"8001234"]
,[,,"900\\d{4}","\\d{7}",,,"9001234"]
,[,,"NA","NA"]
,[,,"NA","NA"]
,[,,"28\\d{5}|501\\d{4}","\\d{7}",,,"5011234"]
,"AW",297,"00",,,,,,,,[[,"(\\d{3})(\\d{4})","$1 $2",,"","",0]
]
,,[,,"NA","NA"]
,,,[,,"NA","NA"]
,[,,"NA","NA"]
,,,[,,"NA","NA"]
]
,"AX":[,[,,"[135]\\d{5,9}|[27]\\d{4,9}|4\\d{5,10}|6\\d{7,8}|8\\d{6,9}","\\d{5,12}"]
,[,,"18[1-8]\\d{3,9}","\\d{6,12}",,,"1812345678"]
,[,,"4\\d{5,10}|50\\d{4,8}","\\d{6,11}",,,"412345678"]
,[,,"800\\d{4,7}","\\d{7,10}",,,"8001234567"]
,[,,"[67]00\\d{5,6}","\\d{8,9}",,,"600123456"]
,[,,"NA","NA"]
,[,,"NA","NA"]
,[,,"NA","NA"]
,"AX",358,"00|99[049]","0",,,"0",,,,,,[,,"NA","NA"]
,,,[,,"[13]00\\d{3,7}|2(?:0(?:0\\d{3,7}|2[023]\\d{1,6}|9[89]\\d{1,6}))|60(?:[12]\\d{5,6}|6\\d{7})|7(?:1\\d{7}|3\\d{8}|5[03-9]\\d{2,7})","\\d{5,10}",,,"100123"]
,[,,"[13]0\\d{4,8}|2(?:0(?:[016-8]\\d{3,7}|[2-59]\\d{2,7})|9\\d{4,8})|60(?:[12]\\d{5,6}|6\\d{7})|7(?:1\\d{7}|3\\d{8}|5[03-9]\\d{2,7})","\\d{5,10}",,,"10112345"]
,,,[,,"NA","NA"]
]
,"AZ":[,[,,"[1-9]\\d{8}","\\d{7,9}"]
,[,,"(?:1[28]\\d|2(?:02|1[24]|2[2-4]|33|[45]2|6[23])|365)\\d{6}","\\d{7,9}",,,"123123456"]
,[,,"(?:4[04]|5[015]|60|7[07])\\d{7}","\\d{9}",,,"401234567"]
,[,,"88\\d{7}","\\d{9}",,,"881234567"]
,[,,"900200\\d{3}","\\d{9}",,,"900200123"]
,[,,"NA","NA"]
,[,,"NA","NA"]
,[,,"NA","NA"]
,"AZ",994,"00","0",,,"0",,,,[[,"(\\d{2})(\\d{3})(\\d{2})(\\d{2})","$1 $2 $3 $4",["(?:1[28]|2(?:[45]2|[0-36])|365)"]
,"(0$1)","",0]
,[,"(\\d{2})(\\d{3})(\\d{2})(\\d{2})","$1 $2 $3 $4",["[4-8]"]
,"0$1","",0]
,[,"(\\d{3})(\\d{2})(\\d{2})(\\d{2})","$1 $2 $3 $4",["9"]
,"0$1","",0]
]
,,[,,"NA","NA"]
,,,[,,"NA","NA"]
,[,,"NA","NA"]
,,,[,,"NA","NA"]
]
,"BA":[,[,,"[3-9]\\d{7,8}","\\d{6,9}"]
,[,,"(?:[35]\\d|49)\\d{6}","\\d{6,8}",,,"30123456"]
,[,,"6(?:03|44|71|[1-356])\\d{6}","\\d{8,9}",,,"61123456"]
,[,,"8[08]\\d{6}","\\d{8}",,,"80123456"]
,[,,"9[0246]\\d{6}","\\d{8}",,,"90123456"]
,[,,"8[12]\\d{6}","\\d{8}",,,"82123456"]
,[,,"NA","NA"]
,[,,"NA","NA"]
,"BA",387,"00","0",,,"0",,,,[[,"(\\d{2})(\\d{3})(\\d{3})","$1 $2-$3",["[3-5]"]
,"0$1","",0]
,[,"(\\d{2})(\\d{3})(\\d{3})","$1 $2 $3",["6[1-356]|[7-9]"]
,"0$1","",0]
,[,"(\\d{2})(\\d{2})(\\d{2})(\\d{3})","$1 $2 $3 $4",["6[047]"]
,"0$1","",0]
]
,,[,,"NA","NA"]
,,,[,,"NA","NA"]
,[,,"70[23]\\d{5}","\\d{8}",,,"70223456"]
,,,[,,"NA","NA"]
]
,"BB":[,[,,"[2589]\\d{9}","\\d{7}(?:\\d{3})?"]
,[,,"246[2-9]\\d{6}","\\d{7}(?:\\d{3})?",,,"2462345678"]
,[,,"246(?:(?:2[346]|45|82)\\d|25[0-46])\\d{4}","\\d{10}",,,"2462501234"]
,[,,"8(?:00|44|55|66|77|88)[2-9]\\d{6}","\\d{10}",,,"8002123456"]
,[,,"900[2-9]\\d{6}","\\d{10}",,,"9002123456"]
,[,,"NA","NA"]
,[,,"5(?:00|33|44|66|77)[2-9]\\d{6}","\\d{10}",,,"5002345678"]
,[,,"NA","NA"]
,"BB",1,"011","1",,,"1",,,,,,[,,"NA","NA"]
,,"246",[,,"NA","NA"]
,[,,"NA","NA"]
,,,[,,"NA","NA"]
]
,"BD":[,[,,"[2-79]\\d{5,9}|1\\d{9}|8[0-7]\\d{4,8}","\\d{6,10}"]
,[,,"2(?:7(?:1[0-267]|2[0-289]|3[0-29]|[46][01]|5[1-3]|7[017]|91)|8(?:0[125]|[139][1-6]|2[0157-9]|6[1-35]|7[1-5]|8[1-8])|9(?:0[0-2]|1[0-4]|2[568]|3[3-6]|5[5-7]|6[0167]|7[15]|8[0146-8]))\\d{4}|3(?:12?[5-7]\\d{2}|0(?:2(?:[025-79]\\d|[348]\\d{1,2})|3(?:[2-4]\\d|[56]\\d?))|2(?:1\\d{2}|2(?:[12]\\d|[35]\\d{1,2}|4\\d?))|3(?:1\\d{2}|2(?:[2356]\\d|4\\d{1,2}))|4(?:1\\d{2}|2(?:2\\d{1,2}|[47]|5\\d{2}))|5(?:1\\d{2}|29)|[67]1\\d{2}|8(?:1\\d{2}|2(?:2\\d{2}|3|4\\d)))\\d{3}|4(?:0(?:2(?:[09]\\d|7)|33\\d{2})|1\\d{3}|2(?:1\\d{2}|2(?:[25]\\d?|[348]\\d|[67]\\d{1,2}))|3(?:1\\d{2}(?:\\d{2})?|2(?:[045]\\d|[236-9]\\d{1,2})|32\\d{2})|4(?:[18]\\d{2}|2(?:[2-46]\\d{2}|3)|5[25]\\d{2})|5(?:1\\d{2}|2(?:3\\d|5))|6(?:[18]\\d{2}|2(?:3(?:\\d{2})?|[46]\\d{1,2}|5\\d{2}|7\\d)|5(?:3\\d?|4\\d|[57]\\d{1,2}|6\\d{2}|8))|71\\d{2}|8(?:[18]\\d{2}|23\\d{2}|54\\d{2})|9(?:[18]\\d{2}|2[2-5]\\d{2}|53\\d{1,2}))\\d{3}|5(?:02[03489]\\d{2}|1\\d{2}|2(?:1\\d{2}|2(?:2(?:\\d{2})?|[457]\\d{2}))|3(?:1\\d{2}|2(?:[37](?:\\d{2})?|[569]\\d{2}))|4(?:1\\d{2}|2[46]\\d{2})|5(?:1\\d{2}|26\\d{1,2})|6(?:[18]\\d{2}|2|53\\d{2})|7(?:1|24)\\d{2}|8(?:1|26)\\d{2}|91\\d{2})\\d{3}|6(?:0(?:1\\d{2}|2(?:3\\d{2}|4\\d{1,2}))|2(?:2[2-5]\\d{2}|5(?:[3-5]\\d{2}|7)|8\\d{2})|3(?:1|2[3478])\\d{2}|4(?:1|2[34])\\d{2}|5(?:1|2[47])\\d{2}|6(?:[18]\\d{2}|6(?:2(?:2\\d|[34]\\d{2})|5(?:[24]\\d{2}|3\\d|5\\d{1,2})))|72[2-5]\\d{2}|8(?:1\\d{2}|2[2-5]\\d{2})|9(?:1\\d{2}|2[2-6]\\d{2}))\\d{3}|7(?:(?:02|[3-589]1|6[12]|72[24])\\d{2}|21\\d{3}|32)\\d{3}|8(?:(?:4[12]|[5-7]2|1\\d?)|(?:0|3[12]|[5-7]1|217)\\d)\\d{4}|9(?:[35]1|(?:[024]2|81)\\d|(?:1|[24]1)\\d{2})\\d{3}","\\d{6,9}",,,"27111234"]
,[,,"(?:1[13-9]\\d|(?:3[78]|44)[02-9]|6(?:44|6[02-9]))\\d{7}","\\d{10}",,,"1812345678"]
,[,,"80[03]\\d{7}","\\d{10}",,,"8001234567"]
,[,,"NA","NA"]
,[,,"NA","NA"]
,[,,"NA","NA"]
,[,,"96(?:0[49]|1[0-4]|6[69])\\d{6}","\\d{10}",,,"9604123456"]
,"BD",880,"00[12]?","0",,,"0",,"00",,[[,"(2)(\\d{7})","$1-$2",["2"]
,"0$1","",0]
,[,"(\\d{2})(\\d{4,6})","$1-$2",["[3-79]1"]
,"0$1","",0]
,[,"(\\d{4})(\\d{3,6})","$1-$2",["1|3(?:0|[2-58]2)|4(?:0|[25]2|3[23]|[4689][25])|5(?:[02-578]2|6[25])|6(?:[0347-9]2|[26][25])|7[02-9]2|8(?:[023][23]|[4-7]2)|9(?:[02][23]|[458]2|6[016])"]
,"0$1","",0]
,[,"(\\d{3})(\\d{3,7})","$1-$2",["[3-79][2-9]|8"]
,"0$1","",0]
]
,,[,,"NA","NA"]
,,,[,,"NA","NA"]
,[,,"NA","NA"]
,,,[,,"NA","NA"]
]
,"BE":[,[,,"[1-9]\\d{7,8}","\\d{8,9}"]
,[,,"(?:1[0-69]|[23][2-8]|4[23]|5\\d|6[013-57-9]|71|8[1-79]|9[2-4])\\d{6}|80[2-8]\\d{5}","\\d{8}",,,"12345678"]
,[,,"4(?:6[0135-8]|[79]\\d|8[3-9])\\d{6}","\\d{9}",,,"470123456"]
,[,,"800\\d{5}","\\d{8}",,,"80012345"]
,[,,"(?:70[2-467]|90[0-79])\\d{5}","\\d{8}",,,"90123456"]
,[,,"NA","NA"]
,[,,"NA","NA"]
,[,,"NA","NA"]
,"BE",32,"00","0",,,"0",,,,[[,"(\\d{3})(\\d{2})(\\d{2})(\\d{2})","$1 $2 $3 $4",["4[6-9]"]
,"0$1","",0]
,[,"(\\d)(\\d{3})(\\d{2})(\\d{2})","$1 $2 $3 $4",["[23]|4[23]|9[2-4]"]
,"0$1","",0]
,[,"(\\d{2})(\\d{2})(\\d{2})(\\d{2})","$1 $2 $3 $4",["[156]|7[018]|8(?:0[1-9]|[1-79])"]
,"0$1","",0]
,[,"(\\d{3})(\\d{2})(\\d{3})","$1 $2 $3",["(?:80|9)0"]
,"0$1","",0]
]
,,[,,"NA","NA"]
,,,[,,"NA","NA"]
,[,,"78\\d{6}","\\d{8}",,,"78123456"]
,,,[,,"NA","NA"]
]
,"BF":[,[,,"[267]\\d{7}","\\d{8}"]
,[,,"2(?:0(?:49|5[23]|9[016-9])|4(?:4[569]|5[4-6]|7[0179])|5(?:[34]\\d|50))\\d{4}","\\d{8}",,,"20491234"]
,[,,"6(?:[0-689]\\d|7[0-5])\\d{5}|7\\d{7}","\\d{8}",,,"70123456"]
,[,,"NA","NA"]
,[,,"NA","NA"]
,[,,"NA","NA"]
,[,,"NA","NA"]
,[,,"NA","NA"]
,"BF",226,"00",,,,,,,,[[,"(\\d{2})(\\d{2})(\\d{2})(\\d{2})","$1 $2 $3 $4",,"","",0]
]
,,[,,"NA","NA"]
,,,[,,"NA","NA"]
,[,,"NA","NA"]
,,,[,,"NA","NA"]
]
,"BG":[,[,,"[23567]\\d{5,7}|[489]\\d{6,8}","\\d{5,9}"]
,[,,"2(?:[0-8]\\d{5,6}|9\\d{4,6})|(?:[36]\\d|5[1-9]|8[1-6]|9[1-7])\\d{5,6}|(?:4(?:[124-7]\\d|3[1-6])|7(?:0[1-9]|[1-9]\\d))\\d{4,5}","\\d{5,8}",,,"2123456"]
,[,,"(?:8[7-9]\\d|9(?:8\\d|99))\\d{6}|4(?:3[0789]|8\\d)\\d{5}","\\d{8,9}",,,"48123456"]
,[,,"800\\d{5}","\\d{8}",,,"80012345"]
,[,,"90\\d{6}","\\d{8}",,,"90123456"]
,[,,"NA","NA"]
,[,,"700\\d{5}","\\d{5,9}",,,"70012345"]
,[,,"NA","NA"]
,"BG",359,"00","0",,,"0",,,,[[,"(2)(\\d{5})","$1 $2",["29"]
,"0$1","",0]
,[,"(2)(\\d{3})(\\d{3,4})","$1 $2 $3",["2"]
,"0$1","",0]
,[,"(\\d{3})(\\d{4})","$1 $2",["43[124-7]|70[1-9]"]
,"0$1","",0]
,[,"(\\d{3})(\\d{3})(\\d{2})","$1 $2 $3",["43[124-7]|70[1-9]"]
,"0$1","",0]
,[,"(\\d{3})(\\d{2})(\\d{3})","$1 $2 $3",["[78]00"]
,"0$1","",0]
,[,"(\\d{3})(\\d{3})(\\d{3})","$1 $2 $3",["999"]
,"0$1","",0]
,[,"(\\d{2})(\\d{3})(\\d{2,3})","$1 $2 $3",["[356]|4[124-7]|7[1-9]|8[1-6]|9[1-7]"]
,"0$1","",0]
,[,"(\\d{2})(\\d{3})(\\d{3,4})","$1 $2 $3",["48|8[7-9]|9[08]"]
,"0$1","",0]
]
,,[,,"NA","NA"]
,,,[,,"NA","NA"]
,[,,"NA","NA"]
,,,[,,"NA","NA"]
]
,"BH":[,[,,"[136-9]\\d{7}","\\d{8}"]
,[,,"(?:1(?:3[1356]|6[0156]|7\\d)\\d|6(?:1[16]\\d|500|6(?:0\\d|3[12]|44|7[7-9])|9[69][69])|7(?:1(?:11|78)|7\\d{2}))\\d{4}","\\d{8}",,,"17001234"]
,[,,"(?:3(?:[1-4679]\\d|5[013569]|8[0-47-9])\\d|6(?:3(?:00|33|6[16])|6(?:[69]\\d|3[03-9]|7[0-6])))\\d{4}","\\d{8}",,,"36001234"]
,[,,"80\\d{6}","\\d{8}",,,"80123456"]
,[,,"(?:87|9[014578])\\d{6}","\\d{8}",,,"90123456"]
,[,,"84\\d{6}","\\d{8}",,,"84123456"]
,[,,"NA","NA"]
,[,,"NA","NA"]
,"BH",973,"00",,,,,,,,[[,"(\\d{4})(\\d{4})","$1 $2",,"","",0]
]
,,[,,"NA","NA"]
,,,[,,"NA","NA"]
,[,,"NA","NA"]
,,,[,,"NA","NA"]
]
,"BI":[,[,,"[267]\\d{7}","\\d{8}"]
,[,,"22(?:2[0-7]|[3-5]0)\\d{4}","\\d{8}",,,"22201234"]
,[,,"(?:[26]9|7[14-9])\\d{6}","\\d{8}",,,"79561234"]
,[,,"NA","NA"]
,[,,"NA","NA"]
,[,,"NA","NA"]
,[,,"NA","NA"]
,[,,"NA","NA"]
,"BI",257,"00",,,,,,,,[[,"(\\d{2})(\\d{2})(\\d{2})(\\d{2})","$1 $2 $3 $4",,"","",0]
]
,,[,,"NA","NA"]
,,,[,,"NA","NA"]
,[,,"NA","NA"]
,,,[,,"NA","NA"]
]
,"BJ":[,[,,"[2689]\\d{7}|7\\d{3}","\\d{4,8}"]
,[,,"2(?:02|1[037]|2[45]|3[68])\\d{5}","\\d{8}",,,"20211234"]
,[,,"(?:6[146-8]|9[03-9])\\d{6}","\\d{8}",,,"90011234"]
,[,,"7[3-5]\\d{2}","\\d{4}",,,"7312"]
,[,,"NA","NA"]
,[,,"NA","NA"]
,[,,"NA","NA"]
,[,,"857[58]\\d{4}","\\d{8}",,,"85751234"]
,"BJ",229,"00",,,,,,,,[[,"(\\d{2})(\\d{2})(\\d{2})(\\d{2})","$1 $2 $3 $4",,"","",0]
]
,,[,,"NA","NA"]
,,,[,,"NA","NA"]
,[,,"81\\d{6}","\\d{8}",,,"81123456"]
,,,[,,"NA","NA"]
]
,"BL":[,[,,"[56]\\d{8}","\\d{9}"]
,[,,"590(?:2[7-9]|5[12]|87)\\d{4}","\\d{9}",,,"590271234"]
,[,,"690(?:0[0-7]|[1-9]\\d)\\d{4}","\\d{9}",,,"690301234"]
,[,,"NA","NA"]
,[,,"NA","NA"]
,[,,"NA","NA"]
,[,,"NA","NA"]
,[,,"NA","NA"]
,"BL",590,"00","0",,,"0",,,,,,[,,"NA","NA"]
,,,[,,"NA","NA"]
,[,,"NA","NA"]
,,,[,,"NA","NA"]
]
,"BM":[,[,,"[4589]\\d{9}","\\d{7}(?:\\d{3})?"]
,[,,"441(?:2(?:02|23|61|[3479]\\d)|[46]\\d{2}|5(?:4\\d|60|89)|824)\\d{4}","\\d{7}(?:\\d{3})?",,,"4412345678"]
,[,,"441(?:[37]\\d|5[0-39])\\d{5}","\\d{10}",,,"4413701234"]
,[,,"8(?:00|44|55|66|77|88)[2-9]\\d{6}","\\d{10}",,,"8002123456"]
,[,,"900[2-9]\\d{6}","\\d{10}",,,"9002123456"]
,[,,"NA","NA"]
,[,,"5(?:00|33|44|66|77)[2-9]\\d{6}","\\d{10}",,,"5002345678"]
,[,,"NA","NA"]
,"BM",1,"011","1",,,"1",,,,,,[,,"NA","NA"]
,,"441",[,,"NA","NA"]
,[,,"NA","NA"]
,,,[,,"NA","NA"]
]
,"BN":[,[,,"[2-578]\\d{6}","\\d{7}"]
,[,,"2(?:[013-9]\\d|2[0-7])\\d{4}|[3-5]\\d{6}","\\d{7}",,,"2345678"]
,[,,"22[89]\\d{4}|[78]\\d{6}","\\d{7}",,,"7123456"]
,[,,"NA","NA"]
,[,,"NA","NA"]
,[,,"NA","NA"]
,[,,"NA","NA"]
,[,,"NA","NA"]
,"BN",673,"00",,,,,,,,[[,"([2-578]\\d{2})(\\d{4})","$1 $2",,"","",0]
]
,,[,,"NA","NA"]
,,,[,,"NA","NA"]
,[,,"NA","NA"]
,,,[,,"NA","NA"]
]
,"BO":[,[,,"[23467]\\d{7}","\\d{7,8}"]
,[,,"(?:2(?:2\\d{2}|5(?:11|[258]\\d|9[67])|6(?:12|2\\d|9[34])|8(?:2[34]|39|62))|3(?:3\\d{2}|4(?:6\\d|8[24])|8(?:25|42|5[257]|86|9[25])|9(?:2\\d|3[234]|4[248]|5[24]|6[2-6]|7\\d))|4(?:4\\d{2}|6(?:11|[24689]\\d|72)))\\d{4}","\\d{7,8}",,,"22123456"]
,[,,"[67]\\d{7}","\\d{8}",,,"71234567"]
,[,,"NA","NA"]
,[,,"NA","NA"]
,[,,"NA","NA"]
,[,,"NA","NA"]
,[,,"NA","NA"]
,"BO",591,"00(1\\d)?","0",,,"0(1\\d)?",,,,[[,"([234])(\\d{7})","$1 $2",["[234]"]
,"","0$CC $1",0]
,[,"([67]\\d{7})","$1",["[67]"]
,"","0$CC $1",0]
]
,,[,,"NA","NA"]
,,,[,,"NA","NA"]
,[,,"NA","NA"]
,,,[,,"NA","NA"]
]
,"BQ":[,[,,"[347]\\d{6}","\\d{7}"]
,[,,"(?:318[023]|416[023]|7(?:1[578]|50)\\d)\\d{3}","\\d{7}",,,"7151234"]
,[,,"(?:318[14-68]|416[15-9]|7(?:0[01]|7[07]|[89]\\d)\\d)\\d{3}","\\d{7}",,,"3181234"]
,[,,"NA","NA"]
,[,,"NA","NA"]
,[,,"NA","NA"]
,[,,"NA","NA"]
,[,,"NA","NA"]
,"BQ",599,"00",,,,,,,,,,[,,"NA","NA"]
,,,[,,"NA","NA"]
,[,,"NA","NA"]
,,,[,,"NA","NA"]
]
,"BR":[,[,,"[1-46-9]\\d{7,10}|5\\d{8,9}","\\d{8,11}"]
,[,,"1[1-9][2-5]\\d{7}|(?:[4689][1-9]|2[12478]|3[1-578]|5[1-5]|7[13-579])[2-5]\\d{7}","\\d{8,11}",,,"1123456789"]
,[,,"1[1-9](?:7|9\\d)\\d{7}|(?:2[12478]|[89][1-9])9?[6-9]\\d{7}|(?:3[1-578]|[46][1-9]|5[1-5]|7[13-579])[6-9]\\d{7}","\\d{10,11}",,,"11961234567"]
,[,,"800\\d{6,7}","\\d{8,11}",,,"800123456"]
,[,,"[359]00\\d{6,7}","\\d{8,11}",,,"300123456"]
,[,,"[34]00\\d{5}","\\d{8}",,,"40041234"]
,[,,"NA","NA"]
,[,,"NA","NA"]
,"BR",55,"00(?:1[45]|2[135]|31|4[13])","0",,,"0(?:(1[245]|2[135]|31|4[13])(\\d{10,11}))?","$2",,,[[,"(\\d{4})(\\d{4})","$1-$2",["[2-9](?:[1-9]|0[1-9])"]
,"$1","",0]
,[,"(\\d{5})(\\d{4})","$1-$2",["9(?:[1-9]|0[1-9])"]
,"$1","",0]
,[,"(\\d{3,5})","$1",["1[125689]"]
,"$1","",0]
,[,"(\\d{2})(\\d{5})(\\d{4})","$1 $2-$3",["(?:[189][1-9]|2[12478])9"]
,"($1)","0 $CC ($1)",0]
,[,"(\\d{2})(\\d{4})(\\d{4})","$1 $2-$3",["[1-9][1-9]"]
,"($1)","0 $CC ($1)",0]
,[,"([34]00\\d)(\\d{4})","$1-$2",["[34]00"]
,"","",0]
,[,"([3589]00)(\\d{2,3})(\\d{4})","$1 $2 $3",["[3589]00"]
,"0$1","",0]
]
,[[,"(\\d{2})(\\d{5})(\\d{4})","$1 $2-$3",["(?:[189][1-9]|2[12478])9"]
,"($1)","0 $CC ($1)",0]
,[,"(\\d{2})(\\d{4})(\\d{4})","$1 $2-$3",["[1-9][1-9]"]
,"($1)","0 $CC ($1)",0]
,[,"([34]00\\d)(\\d{4})","$1-$2",["[34]00"]
,"","",0]
,[,"([3589]00)(\\d{2,3})(\\d{4})","$1 $2 $3",["[3589]00"]
,"0$1","",0]
]
,[,,"NA","NA"]
,,,[,,"[34]00\\d{5}","\\d{8}",,,"40041234"]
,[,,"NA","NA"]
,,,[,,"NA","NA"]
]
,"BS":[,[,,"[2589]\\d{9}","\\d{7}(?:\\d{3})?"]
,[,,"242(?:3(?:02|[236][1-9]|4[0-24-9]|5[0-68]|7[3467]|8[0-4]|9[2-467])|461|502|6(?:0[12]|12|7[67]|8[78]|9[89])|7(?:02|88))\\d{4}","\\d{7}(?:\\d{3})?",,,"2423456789"]
,[,,"242(?:3(?:5[79]|[79]5)|4(?:[2-4][1-9]|5[1-8]|6[2-8]|7\\d|81)|5(?:2[45]|3[35]|44|5[1-9]|65|77)|6[34]6|727)\\d{4}","\\d{10}",,,"2423591234"]
,[,,"242300\\d{4}|8(?:00|44|55|66|77|88)[2-9]\\d{6}","\\d{10}",,,"8002123456"]
,[,,"900[2-9]\\d{6}","\\d{10}",,,"9002123456"]
,[,,"NA","NA"]
,[,,"5(?:00|33|44|66|77)[2-9]\\d{6}","\\d{10}",,,"5002345678"]
,[,,"NA","NA"]
,"BS",1,"011","1",,,"1",,,,,,[,,"NA","NA"]
,,"242",[,,"NA","NA"]
,[,,"NA","NA"]
,,,[,,"NA","NA"]
]
,"BT":[,[,,"[1-8]\\d{6,7}","\\d{6,8}"]
,[,,"(?:2[3-6]|[34][5-7]|5[236]|6[2-46]|7[246]|8[2-4])\\d{5}","\\d{6,7}",,,"2345678"]
,[,,"[17]7\\d{6}","\\d{8}",,,"17123456"]
,[,,"NA","NA"]
,[,,"NA","NA"]
,[,,"NA","NA"]
,[,,"NA","NA"]
,[,,"NA","NA"]
,"BT",975,"00",,,,,,,,[[,"([17]7)(\\d{2})(\\d{2})(\\d{2})","$1 $2 $3 $4",["1|77"]
,"","",0]
,[,"([2-8])(\\d{3})(\\d{3})","$1 $2 $3",["[2-68]|7[246]"]
,"","",0]
]
,,[,,"NA","NA"]
,,,[,,"NA","NA"]
,[,,"NA","NA"]
,,,[,,"NA","NA"]
]
,"BW":[,[,,"[2-79]\\d{6,7}","\\d{7,8}"]
,[,,"(?:2(?:4[0-48]|6[0-24]|9[0578])|3(?:1[0235-9]|55|6\\d|7[01]|9[0-57])|4(?:6[03]|7[1267]|9[0-5])|5(?:3[0389]|4[0489]|7[1-47]|88|9[0-49])|6(?:2[1-35]|5[149]|8[067]))\\d{4}","\\d{7}",,,"2401234"]
,[,,"7(?:[1-6]\\d|7[014-8])\\d{5}","\\d{8}",,,"71123456"]
,[,,"NA","NA"]
,[,,"90\\d{5}","\\d{7}",,,"9012345"]
,[,,"NA","NA"]
,[,,"NA","NA"]
,[,,"79[12][01]\\d{4}","\\d{8}",,,"79101234"]
,"BW",267,"00",,,,,,,,[[,"(\\d{3})(\\d{4})","$1 $2",["[2-6]"]
,"","",0]
,[,"(7\\d)(\\d{3})(\\d{3})","$1 $2 $3",["7"]
,"","",0]
,[,"(90)(\\d{5})","$1 $2",["9"]
,"","",0]
]
,,[,,"NA","NA"]
,,,[,,"NA","NA"]
,[,,"NA","NA"]
,,,[,,"NA","NA"]
]
,"BY":[,[,,"[1-4]\\d{8}|800\\d{3,7}|[89]\\d{9,10}","\\d{6,11}"]
,[,,"(?:1(?:5(?:1[1-5]|[24]\\d|6[2-4]|9[1-7])|6(?:[235]\\d|4[1-7])|7\\d{2})|2(?:1(?:[246]\\d|3[0-35-9]|5[1-9])|2(?:[235]\\d|4[0-8])|3(?:[26]\\d|3[02-79]|4[024-7]|5[03-7])))\\d{5}","\\d{6,11}",,,"152450911"]
,[,,"(?:2(?:5[5679]|9[1-9])|33\\d|44\\d)\\d{6}","\\d{9}",,,"294911911"]
,[,,"8(?:0[13]|20\\d)\\d{7}|800\\d{3,7}","\\d{6,11}",,,"8011234567"]
,[,,"(?:810|902)\\d{7}","\\d{10}",,,"9021234567"]
,[,,"NA","NA"]
,[,,"NA","NA"]
,[,,"249\\d{6}","\\d{9}",,,"249123456"]
,"BY",375,"810","8",,,"8?0?",,"8~10",,[[,"(\\d{2})(\\d{3})(\\d{2})(\\d{2})","$1 $2-$3-$4",["17[0-3589]|2[4-9]|[34]","17(?:[02358]|1[0-2]|9[0189])|2[4-9]|[34]"]
,"8 0$1","",0]
,[,"(\\d{3})(\\d{2})(\\d{2})(\\d{2})","$1 $2-$3-$4",["1(?:5[24]|6[235]|7[467])|2(?:1[246]|2[25]|3[26])","1(?:5[24]|6(?:2|3[04-9]|5[0346-9])|7(?:[46]|7[37-9]))|2(?:1[246]|2[25]|3[26])"]
,"8 0$1","",0]
,[,"(\\d{4})(\\d{2})(\\d{3})","$1 $2-$3",["1(?:5[169]|6[3-5]|7[179])|2(?:1[35]|2[34]|3[3-5])","1(?:5[169]|6(?:3[1-3]|4|5[125])|7(?:1[3-9]|7[0-24-6]|9[2-7]))|2(?:1[35]|2[34]|3[3-5])"]
,"8 0$1","",0]
,[,"([89]\\d{2})(\\d{3})(\\d{4})","$1 $2 $3",["8[01]|9"]
,"8 $1","",0]
,[,"(82\\d)(\\d{4})(\\d{4})","$1 $2 $3",["82"]
,"8 $1","",0]
,[,"(800)(\\d{3})","$1 $2",["800"]
,"8 $1","",0]
,[,"(800)(\\d{2})(\\d{2,4})","$1 $2 $3",["800"]
,"8 $1","",0]
]
,,[,,"NA","NA"]
,,,[,,"8(?:[013]|[12]0)\\d{8}|800\\d{3,7}|902\\d{7}","\\d{6,11}",,,"82012345678"]
,[,,"NA","NA"]
,,,[,,"NA","NA"]
]
,"BZ":[,[,,"[2-8]\\d{6}|0\\d{10}","\\d{7}(?:\\d{4})?"]
,[,,"[234578][02]\\d{5}","\\d{7}",,,"2221234"]
,[,,"6[0-367]\\d{5}","\\d{7}",,,"6221234"]
,[,,"0800\\d{7}","\\d{11}",,,"08001234123"]
,[,,"NA","NA"]
,[,,"NA","NA"]
,[,,"NA","NA"]
,[,,"NA","NA"]
,"BZ",501,"00",,,,,,,,[[,"(\\d{3})(\\d{4})","$1-$2",["[2-8]"]
,"","",0]
,[,"(0)(800)(\\d{4})(\\d{3})","$1-$2-$3-$4",["0"]
,"","",0]
]
,,[,,"NA","NA"]
,,,[,,"NA","NA"]
,[,,"NA","NA"]
,1,,[,,"NA","NA"]
]
,"CA":[,[,,"[2-9]\\d{9}|3\\d{6}","\\d{7}(?:\\d{3})?"]
,[,,"(?:2(?:04|[23]6|[48]9|50)|3(?:06|43|65)|4(?:03|1[68]|3[178]|50)|5(?:06|1[49]|48|79|8[17])|6(?:0[04]|13|22|39|47)|7(?:0[59]|78|8[02])|8(?:[06]7|19|73)|90[25])[2-9]\\d{6}|310\\d{4}","\\d{7}(?:\\d{3})?",,,"2042345678"]
,[,,"(?:2(?:04|[23]6|[48]9|50)|3(?:06|43|65)|4(?:03|1[68]|3[178]|50)|5(?:06|1[49]|48|79|8[17])|6(?:0[04]|13|22|39|47)|7(?:0[59]|78|8[02])|8(?:[06]7|19|73)|90[25])[2-9]\\d{6}","\\d{7}(?:\\d{3})?",,,"2042345678"]
,[,,"8(?:00|44|55|66|77|88)[2-9]\\d{6}|310\\d{4}","\\d{7}(?:\\d{3})?",,,"8002123456"]
,[,,"900[2-9]\\d{6}","\\d{10}",,,"9002123456"]
,[,,"NA","NA"]
,[,,"5(?:00|33|44|66|77)[2-9]\\d{6}","\\d{10}",,,"5002345678"]
,[,,"NA","NA"]
,"CA",1,"011","1",,,"1",,,,,,[,,"NA","NA"]
,,,[,,"NA","NA"]
,[,,"NA","NA"]
,,,[,,"NA","NA"]
]
,"CC":[,[,,"[1458]\\d{5,9}","\\d{6,10}"]
,[,,"89162\\d{4}","\\d{8,9}",,,"891621234"]
,[,,"14(?:5\\d|71)\\d{5}|4(?:[0-2]\\d|3[0-57-9]|4[47-9]|5[0-25-9]|6[6-9]|7[03-9]|8[17-9]|9[017-9])\\d{6}","\\d{9}",,,"412345678"]
,[,,"1(?:80(?:0\\d{2})?|3(?:00\\d{2})?)\\d{4}","\\d{6,10}",,,"1800123456"]
,[,,"190[0126]\\d{6}","\\d{10}",,,"1900123456"]
,[,,"NA","NA"]
,[,,"500\\d{6}","\\d{9}",,,"500123456"]
,[,,"550\\d{6}","\\d{9}",,,"550123456"]
,"CC",61,"(?:14(?:1[14]|34|4[17]|[56]6|7[47]|88))?001[14-689]","0",,,"0",,"0011",,,,[,,"NA","NA"]
,,,[,,"NA","NA"]
,[,,"NA","NA"]
,,,[,,"NA","NA"]
]
,"CD":[,[,,"[2-6]\\d{6}|[18]\\d{6,8}|9\\d{8}","\\d{7,9}"]
,[,,"1(?:2\\d{7}|\\d{6})|[2-6]\\d{6}","\\d{7,9}",,,"1234567"]
,[,,"8(?:[0-2459]\\d{2}|8)\\d{5}|9[7-9]\\d{7}","\\d{7,9}",,,"991234567"]
,[,,"NA","NA"]
,[,,"NA","NA"]
,[,,"NA","NA"]
,[,,"NA","NA"]
,[,,"NA","NA"]
,"CD",243,"00","0",,,"0",,,,[[,"(\\d{2})(\\d{3})(\\d{4})","$1 $2 $3",["12"]
,"0$1","",0]
,[,"([89]\\d{2})(\\d{3})(\\d{3})","$1 $2 $3",["8[0-2459]|9"]
,"0$1","",0]
,[,"(\\d{2})(\\d{2})(\\d{3})","$1 $2 $3",["88"]
,"0$1","",0]
,[,"(\\d{2})(\\d{5})","$1 $2",["[1-6]"]
,"0$1","",0]
]
,,[,,"NA","NA"]
,,,[,,"NA","NA"]
,[,,"NA","NA"]
,,,[,,"NA","NA"]
]
,"CF":[,[,,"[278]\\d{7}","\\d{8}"]
,[,,"2[12]\\d{6}","\\d{8}",,,"21612345"]
,[,,"7[0257]\\d{6}","\\d{8}",,,"70012345"]
,[,,"NA","NA"]
,[,,"8776\\d{4}","\\d{8}",,,"87761234"]
,[,,"NA","NA"]
,[,,"NA","NA"]
,[,,"NA","NA"]
,"CF",236,"00",,,,,,,,[[,"(\\d{2})(\\d{2})(\\d{2})(\\d{2})","$1 $2 $3 $4",,"","",0]
]
,,[,,"NA","NA"]
,,,[,,"NA","NA"]
,[,,"NA","NA"]
,,,[,,"NA","NA"]
]
,"CG":[,[,,"[028]\\d{8}","\\d{9}"]
,[,,"222[1-589]\\d{5}","\\d{9}",,,"222123456"]
,[,,"0[14-6]\\d{7}","\\d{9}",,,"061234567"]
,[,,"NA","NA"]
,[,,"800\\d{6}","\\d{9}",,,"800123456"]
,[,,"NA","NA"]
,[,,"NA","NA"]
,[,,"NA","NA"]
,"CG",242,"00",,,,,,,,[[,"(\\d{2})(\\d{3})(\\d{4})","$1 $2 $3",["[02]"]
,"","",0]
,[,"(\\d)(\\d{4})(\\d{4})","$1 $2 $3",["8"]
,"","",0]
]
,,[,,"NA","NA"]
,,,[,,"NA","NA"]
,[,,"NA","NA"]
,1,,[,,"NA","NA"]
]
,"CH":[,[,,"[2-9]\\d{8}|860\\d{9}","\\d{9}(?:\\d{3})?"]
,[,,"(?:2[12467]|3[1-4]|4[134]|5[256]|6[12]|[7-9]1)\\d{7}","\\d{9}",,,"212345678"]
,[,,"7[5-9]\\d{7}","\\d{9}",,,"781234567"]
,[,,"800\\d{6}","\\d{9}",,,"800123456"]
,[,,"90[016]\\d{6}","\\d{9}",,,"900123456"]
,[,,"84[0248]\\d{6}","\\d{9}",,,"840123456"]
,[,,"878\\d{6}","\\d{9}",,,"878123456"]
,[,,"NA","NA"]
,"CH",41,"00","0",,,"0",,,,[[,"([2-9]\\d)(\\d{3})(\\d{2})(\\d{2})","$1 $2 $3 $4",["[2-7]|[89]1"]
,"0$1","",0]
,[,"([89]\\d{2})(\\d{3})(\\d{3})","$1 $2 $3",["8[047]|90"]
,"0$1","",0]
,[,"(\\d{3})(\\d{2})(\\d{3})(\\d{2})(\\d{2})","$1 $2 $3 $4 $5",["860"]
,"0$1","",0]
]
,,[,,"74[0248]\\d{6}","\\d{9}",,,"740123456"]
,,,[,,"NA","NA"]
,[,,"5[18]\\d{7}","\\d{9}",,,"581234567"]
,,,[,,"860\\d{9}","\\d{12}",,,"860123456789"]
]
,"CI":[,[,,"[02-7]\\d{7}","\\d{8}"]
,[,,"(?:2(?:0[023]|1[02357]|[23][045]|4[03-5])|3(?:0[06]|1[069]|[2-4][07]|5[09]|6[08]))\\d{5}","\\d{8}",,,"21234567"]
,[,,"(?:0[1-9]|4\\d|5[4-9]|6[015-79]|7[578])\\d{6}","\\d{8}",,,"01234567"]
,[,,"NA","NA"]
,[,,"NA","NA"]
,[,,"NA","NA"]
,[,,"NA","NA"]
,[,,"NA","NA"]
,"CI",225,"00",,,,,,,,[[,"(\\d{2})(\\d{2})(\\d{2})(\\d{2})","$1 $2 $3 $4",,"","",0]
]
,,[,,"NA","NA"]
,,,[,,"NA","NA"]
,[,,"NA","NA"]
,1,,[,,"NA","NA"]
]
,"CK":[,[,,"[2-57]\\d{4}","\\d{5}"]
,[,,"(?:2\\d|3[13-7]|4[1-5])\\d{3}","\\d{5}",,,"21234"]
,[,,"(?:5[0-68]|7\\d)\\d{3}","\\d{5}",,,"71234"]
,[,,"NA","NA"]
,[,,"NA","NA"]
,[,,"NA","NA"]
,[,,"NA","NA"]
,[,,"NA","NA"]
,"CK",682,"00",,,,,,,,[[,"(\\d{2})(\\d{3})","$1 $2",,"","",0]
]
,,[,,"NA","NA"]
,,,[,,"NA","NA"]
,[,,"NA","NA"]
,,,[,,"NA","NA"]
]
,"CL":[,[,,"(?:[2-9]|600|123)\\d{7,8}","\\d{7,11}"]
,[,,"2(?:2\\d{7}|3(?:20|22)\\d{5}|1962\\d{4})|(?:3[2-5]|[47][1-35]|5[1-3578]|6[13-57])\\d{7}","\\d{7,9}",,,"221234567"]
,[,,"9[4-9]\\d{7}","\\d{8,9}",,,"961234567"]
,[,,"800\\d{6}|1230\\d{7}","\\d{9,11}",,,"800123456"]
,[,,"NA","NA"]
,[,,"600\\d{7,8}","\\d{10,11}",,,"6001234567"]
,[,,"NA","NA"]
,[,,"44\\d{7}","\\d{9}",,,"441234567"]
,"CL",56,"(?:0|1(?:1[0-69]|2[0-57]|5[13-58]|69|7[0167]|8[018]))0","0",,,"0|(1(?:1[0-69]|2[0-57]|5[13-58]|69|7[0167]|8[018]))",,,,[[,"(\\d)(\\d{4})(\\d{4})","$1 $2 $3",["2[23]"]
,"($1)","$CC ($1)",0]
,[,"(\\d{2})(\\d{3})(\\d{4})","$1 $2 $3",["[357]|4[1-35]|6[13-57]"]
,"($1)","$CC ($1)",0]
,[,"(9)(\\d{4})(\\d{4})","$1 $2 $3",["9"]
,"0$1","",0]
,[,"(44)(\\d{3})(\\d{4})","$1 $2 $3",["44"]
,"0$1","",0]
,[,"([68]00)(\\d{3})(\\d{3,4})","$1 $2 $3",["60|8"]
,"$1","",0]
,[,"(600)(\\d{3})(\\d{2})(\\d{3})","$1 $2 $3 $4",["60"]
,"$1","",0]
,[,"(1230)(\\d{3})(\\d{4})","$1 $2 $3",["1"]
,"$1","",0]
,[,"(\\d{5})(\\d{4})","$1 $2",["219"]
,"($1)","$CC ($1)",0]
,[,"(\\d{4,5})","$1",["[1-9]"]
,"$1","",0]
]
,[[,"(\\d)(\\d{4})(\\d{4})","$1 $2 $3",["2[23]"]
,"($1)","$CC ($1)",0]
,[,"(\\d{2})(\\d{3})(\\d{4})","$1 $2 $3",["[357]|4[1-35]|6[13-57]"]
,"($1)","$CC ($1)",0]
,[,"(9)(\\d{4})(\\d{4})","$1 $2 $3",["9"]
,"0$1","",0]
,[,"(44)(\\d{3})(\\d{4})","$1 $2 $3",["44"]
,"0$1","",0]
,[,"([68]00)(\\d{3})(\\d{3,4})","$1 $2 $3",["60|8"]
,"$1","",0]
,[,"(600)(\\d{3})(\\d{2})(\\d{3})","$1 $2 $3 $4",["60"]
,"$1","",0]
,[,"(1230)(\\d{3})(\\d{4})","$1 $2 $3",["1"]
,"$1","",0]
,[,"(\\d{5})(\\d{4})","$1 $2",["219"]
,"($1)","$CC ($1)",0]
]
,[,,"NA","NA"]
,,,[,,"600\\d{7,8}","\\d{10,11}",,,"6001234567"]
,[,,"NA","NA"]
,,,[,,"NA","NA"]
]
,"CM":[,[,,"[2368]\\d{7,8}","\\d{8,9}"]
,[,,"2(?:22|33|4[23])\\d{6}","\\d{9}",,,"222123456"]
,[,,"6[5-9]\\d{7}","\\d{9}",,,"671234567"]
,[,,"800\\d{5}","\\d{8}",,,"80012345"]
,[,,"88\\d{6}","\\d{8}",,,"88012345"]
,[,,"NA","NA"]
,[,,"NA","NA"]
,[,,"NA","NA"]
,"CM",237,"00",,,,,,,,[[,"([26])(\\d{2})(\\d{2})(\\d{2})(\\d{2})","$1 $2 $3 $4 $5",["[26]"]
,"","",0]
,[,"(\\d{2})(\\d{2})(\\d{2})(\\d{2})","$1 $2 $3 $4",["[23]|88"]
,"","",0]
,[,"(800)(\\d{2})(\\d{3})","$1 $2 $3",["80"]
,"","",0]
]
,,[,,"NA","NA"]
,,,[,,"NA","NA"]
,[,,"NA","NA"]
,,,[,,"NA","NA"]
]
,"CN":[,[,,"[1-7]\\d{6,11}|8[0-357-9]\\d{6,9}|9\\d{7,10}","\\d{4,12}"]
,[,,"21(?:100\\d{2}|95\\d{3,4}|\\d{8,10})|(?:10|2[02-57-9]|3(?:11|7[179])|4(?:[15]1|3[12])|5(?:1\\d|2[37]|3[12]|51|7[13-79]|9[15])|7(?:31|5[457]|6[09]|91)|8(?:[57]1|98))(?:100\\d{2}|95\\d{3,4}|\\d{8})|(?:3(?:1[02-9]|35|49|5\\d|7[02-68]|9[1-68])|4(?:1[02-9]|2[179]|3[3-9]|5[2-9]|6[4789]|7\\d|8[23])|5(?:3[03-9]|4[36]|5[02-9]|6[1-46]|7[028]|80|9[2-46-9])|6(?:3[1-5]|6[0238]|9[12])|7(?:01|[17]\\d|2[248]|3[04-9]|4[3-6]|5[0-3689]|6[2368]|9[02-9])|8(?:1[236-8]|2[5-7]|3\\d|5[4-9]|7[02-9]|8[3678]|9[1-7])|9(?:0[1-3689]|1[1-79]|[379]\\d|4[13]|5[1-5]))(?:100\\d{2}|95\\d{3,4}|\\d{7})|80(?:29|6[03578]|7[018]|81)\\d{4}","\\d{4,12}",,,"1012345678"]
,[,,"1(?:[38]\\d|4[57]|5[0-35-9]|7[06-8])\\d{8}","\\d{11}",,,"13123456789"]
,[,,"(?:10)?800\\d{7}","\\d{10,12}",,,"8001234567"]
,[,,"16[08]\\d{5}","\\d{8}",,,"16812345"]
,[,,"400\\d{7}|950\\d{7,8}|(?:10|2[0-57-9]|3(?:[157]\\d|35|49|9[1-68])|4(?:[17]\\d|2[179]|[35][1-9]|6[4789]|8[23])|5(?:[1357]\\d|2[37]|4[36]|6[1-46]|80|9[1-9])|6(?:3[1-5]|6[0238]|9[12])|7(?:01|[1579]\\d|2[248]|3[014-9]|4[3-6]|6[023689])|8(?:1[236-8]|2[5-7]|[37]\\d|5[14-9]|8[3678]|9[1-8])|9(?:0[1-3689]|1[1-79]|[379]\\d|4[13]|5[1-5]))96\\d{3,4}","\\d{7,11}",,,"4001234567"]
,[,,"NA","NA"]
,[,,"NA","NA"]
,"CN",86,"(1(?:[129]\\d{3}|79\\d{2}))?00","0",,,"(1(?:[129]\\d{3}|79\\d{2}))|0",,"00",,[[,"(80\\d{2})(\\d{4})","$1 $2",["80[2678]"]
,"0$1","$CC $1",1]
,[,"([48]00)(\\d{3})(\\d{4})","$1 $2 $3",["[48]00"]
,"","",0]
,[,"(\\d{5,6})","$1",["100|95"]
,"","",0]
,[,"(\\d{2})(\\d{5,6})","$1 $2",["(?:10|2\\d)[19]","(?:10|2\\d)(?:10|9[56])","(?:10|2\\d)(?:100|9[56])"]
,"0$1","$CC $1",0]
,[,"(\\d{3})(\\d{5,6})","$1 $2",["[3-9]","[3-9]\\d{2}[19]","[3-9]\\d{2}(?:10|9[56])"]
,"0$1","$CC $1",0]
,[,"(\\d{3,4})(\\d{4})","$1 $2",["[2-9]"]
,"","",0]
,[,"(21)(\\d{4})(\\d{4,6})","$1 $2 $3",["21"]
,"0$1","$CC $1",1]
,[,"([12]\\d)(\\d{4})(\\d{4})","$1 $2 $3",["10[1-9]|2[02-9]","10[1-9]|2[02-9]","10(?:[1-79]|8(?:[1-9]|0[1-9]))|2[02-9]"]
,"0$1","$CC $1",1]
,[,"(\\d{3})(\\d{4})(\\d{4})","$1 $2 $3",["3(?:11|7[179])|4(?:[15]1|3[12])|5(?:1|2[37]|3[12]|51|7[13-79]|9[15])|7(?:31|5[457]|6[09]|91)|8(?:[57]1|98)"]
,"0$1","$CC $1",1]
,[,"(\\d{3})(\\d{3})(\\d{4})","$1 $2 $3",["3(?:1[02-9]|35|49|5|7[02-68]|9[1-68])|4(?:1[02-9]|2[179]|[35][2-9]|6[4789]|7\\d|8[23])|5(?:3[03-9]|4[36]|5[02-9]|6[1-46]|7[028]|80|9[2-46-9])|6(?:3[1-5]|6[0238]|9[12])|7(?:01|[1579]|2[248]|3[04-9]|4[3-6]|6[2368])|8(?:1[236-8]|2[5-7]|3|5[4-9]|7[02-9]|8[3678]|9[1-7])|9(?:0[1-3689]|1[1-79]|[379]|4[13]|5[1-5])"]
,"0$1","$CC $1",1]
,[,"(\\d{3})(\\d{4})(\\d{4})","$1 $2 $3",["1[3-578]"]
,"","$CC $1",0]
,[,"(10800)(\\d{3})(\\d{4})","$1 $2 $3",["108","1080","10800"]
,"","",0]
,[,"(\\d{3})(\\d{7,8})","$1 $2",["950"]
,"","",0]
]
,[[,"(80\\d{2})(\\d{4})","$1 $2",["80[2678]"]
,"0$1","$CC $1",1]
,[,"([48]00)(\\d{3})(\\d{4})","$1 $2 $3",["[48]00"]
,"","",0]
,[,"(\\d{2})(\\d{5,6})","$1 $2",["(?:10|2\\d)[19]","(?:10|2\\d)(?:10|9[56])","(?:10|2\\d)(?:100|9[56])"]
,"0$1","$CC $1",0]
,[,"(\\d{3})(\\d{5,6})","$1 $2",["[3-9]","[3-9]\\d{2}[19]","[3-9]\\d{2}(?:10|9[56])"]
,"0$1","$CC $1",0]
,[,"(21)(\\d{4})(\\d{4,6})","$1 $2 $3",["21"]
,"0$1","$CC $1",1]
,[,"([12]\\d)(\\d{4})(\\d{4})","$1 $2 $3",["10[1-9]|2[02-9]","10[1-9]|2[02-9]","10(?:[1-79]|8(?:[1-9]|0[1-9]))|2[02-9]"]
,"0$1","$CC $1",1]
,[,"(\\d{3})(\\d{4})(\\d{4})","$1 $2 $3",["3(?:11|7[179])|4(?:[15]1|3[12])|5(?:1|2[37]|3[12]|51|7[13-79]|9[15])|7(?:31|5[457]|6[09]|91)|8(?:[57]1|98)"]
,"0$1","$CC $1",1]
,[,"(\\d{3})(\\d{3})(\\d{4})","$1 $2 $3",["3(?:1[02-9]|35|49|5|7[02-68]|9[1-68])|4(?:1[02-9]|2[179]|[35][2-9]|6[4789]|7\\d|8[23])|5(?:3[03-9]|4[36]|5[02-9]|6[1-46]|7[028]|80|9[2-46-9])|6(?:3[1-5]|6[0238]|9[12])|7(?:01|[1579]|2[248]|3[04-9]|4[3-6]|6[2368])|8(?:1[236-8]|2[5-7]|3|5[4-9]|7[02-9]|8[3678]|9[1-7])|9(?:0[1-3689]|1[1-79]|[379]|4[13]|5[1-5])"]
,"0$1","$CC $1",1]
,[,"(\\d{3})(\\d{4})(\\d{4})","$1 $2 $3",["1[3-578]"]
,"","$CC $1",0]
,[,"(10800)(\\d{3})(\\d{4})","$1 $2 $3",["108","1080","10800"]
,"","",0]
,[,"(\\d{3})(\\d{7,8})","$1 $2",["950"]
,"","",0]
]
,[,,"NA","NA"]
,,,[,,"(?:4|(?:10)?8)00\\d{7}|950\\d{7,8}","\\d{10,12}",,,"4001234567"]
,[,,"NA","NA"]
,,,[,,"NA","NA"]
]
,"CO":[,[,,"(?:[13]\\d{0,3}|[24-8])\\d{7}","\\d{7,11}"]
,[,,"[124-8][2-9]\\d{6}","\\d{8}",,,"12345678"]
,[,,"3(?:0[0-5]|1\\d|2[0-2]|5[01])\\d{7}","\\d{10}",,,"3211234567"]
,[,,"1800\\d{7}","\\d{11}",,,"18001234567"]
,[,,"19(?:0[01]|4[78])\\d{7}","\\d{11}",,,"19001234567"]
,[,,"NA","NA"]
,[,,"NA","NA"]
,[,,"NA","NA"]
,"CO",57,"00(?:4(?:[14]4|56)|[579])","0",,,"0([3579]|4(?:44|56))?",,,,[[,"(\\d)(\\d{7})","$1 $2",["1(?:8[2-9]|9[0-3]|[2-7])|[24-8]","1(?:8[2-9]|9(?:09|[1-3])|[2-7])|[24-8]"]
,"($1)","0$CC $1",0]
,[,"(\\d{3})(\\d{7})","$1 $2",["3"]
,"","0$CC $1",0]
,[,"(1)(\\d{3})(\\d{7})","$1-$2-$3",["1(?:80|9[04])","1(?:800|9(?:0[01]|4[78]))"]
,"0$1","",0]
]
,[[,"(\\d)(\\d{7})","$1 $2",["1(?:8[2-9]|9[0-3]|[2-7])|[24-8]","1(?:8[2-9]|9(?:09|[1-3])|[2-7])|[24-8]"]
,"($1)","0$CC $1",0]
,[,"(\\d{3})(\\d{7})","$1 $2",["3"]
,"","0$CC $1",0]
,[,"(1)(\\d{3})(\\d{7})","$1 $2 $3",["1(?:80|9[04])","1(?:800|9(?:0[01]|4[78]))"]
]
]
,[,,"NA","NA"]
,,,[,,"NA","NA"]
,[,,"NA","NA"]
,,,[,,"NA","NA"]
]
,"CR":[,[,,"[24-9]\\d{7,9}","\\d{8,10}"]
,[,,"2[0-24-7]\\d{6}","\\d{8}",,,"22123456"]
,[,,"5(?:0[01]|7[0-3])\\d{5}|6(?:[0-2]\\d|30)\\d{5}|7[0-3]\\d{6}|8[3-9]\\d{6}","\\d{8}",,,"83123456"]
,[,,"800\\d{7}","\\d{10}",,,"8001234567"]
,[,,"90[059]\\d{7}","\\d{10}",,,"9001234567"]
,[,,"NA","NA"]
,[,,"NA","NA"]
,[,,"210[0-6]\\d{4}|4\\d{7}|5100\\d{4}","\\d{8}",,,"40001234"]
,"CR",506,"00",,,,"(19(?:0[012468]|1[09]|20|66|77|99))",,,,[[,"(\\d{4})(\\d{4})","$1 $2",["[24-7]|8[3-9]"]
,"","$CC $1",0]
,[,"(\\d{3})(\\d{3})(\\d{4})","$1-$2-$3",["[89]0"]
,"","$CC $1",0]
]
,,[,,"NA","NA"]
,,,[,,"NA","NA"]
,[,,"NA","NA"]
,,,[,,"NA","NA"]
]
,"CU":[,[,,"[2-57]\\d{5,7}","\\d{4,8}"]
,[,,"2[1-4]\\d{5,6}|3(?:1\\d{6}|[23]\\d{4,6})|4(?:[125]\\d{5,6}|[36]\\d{6}|[78]\\d{4,6})|7\\d{6,7}","\\d{4,8}",,,"71234567"]
,[,,"5\\d{7}","\\d{8}",,,"51234567"]
,[,,"NA","NA"]
,[,,"NA","NA"]
,[,,"NA","NA"]
,[,,"NA","NA"]
,[,,"NA","NA"]
,"CU",53,"119","0",,,"0",,,,[[,"(\\d)(\\d{6,7})","$1 $2",["7"]
,"(0$1)","",0]
,[,"(\\d{2})(\\d{4,6})","$1 $2",["[2-4]"]
,"(0$1)","",0]
,[,"(\\d)(\\d{7})","$1 $2",["5"]
,"0$1","",0]
]
,,[,,"NA","NA"]
,,,[,,"NA","NA"]
,[,,"NA","NA"]
,,,[,,"NA","NA"]
]
,"CV":[,[,,"[259]\\d{6}","\\d{7}"]
,[,,"2(?:2[1-7]|3[0-8]|4[12]|5[1256]|6\\d|7[1-3]|8[1-5])\\d{4}","\\d{7}",,,"2211234"]
,[,,"(?:9\\d|59)\\d{5}","\\d{7}",,,"9911234"]
,[,,"NA","NA"]
,[,,"NA","NA"]
,[,,"NA","NA"]
,[,,"NA","NA"]
,[,,"NA","NA"]
,"CV",238,"0",,,,,,,,[[,"(\\d{3})(\\d{2})(\\d{2})","$1 $2 $3",,"","",0]
]
,,[,,"NA","NA"]
,,,[,,"NA","NA"]
,[,,"NA","NA"]
,,,[,,"NA","NA"]
]
,"CW":[,[,,"[169]\\d{6,7}","\\d{7,8}"]
,[,,"9(?:[48]\\d{2}|50\\d|7(?:2[0-24]|[34]\\d|6[35-7]|77|8[7-9]))\\d{4}","\\d{7,8}",,,"94151234"]
,[,,"9(?:5(?:[1246]\\d|3[01])|6(?:[16-9]\\d|3[01]))\\d{4}","\\d{7,8}",,,"95181234"]
,[,,"NA","NA"]
,[,,"NA","NA"]
,[,,"(?:10|69)\\d{5}","\\d{7}",,,"1011234"]
,[,,"NA","NA"]
,[,,"NA","NA"]
,"CW",599,"00",,,,,,,,[[,"(\\d{3})(\\d{4})","$1 $2",["[13-7]"]
,"","",0]
,[,"(9)(\\d{3})(\\d{4})","$1 $2 $3",["9"]
,"","",0]
]
,,[,,"955\\d{5}","\\d{7,8}",,,"95581234"]
,1,,[,,"NA","NA"]
,[,,"NA","NA"]
,,,[,,"NA","NA"]
]
,"CX":[,[,,"[1458]\\d{5,9}","\\d{6,10}"]
,[,,"89164\\d{4}","\\d{8,9}",,,"891641234"]
,[,,"14(?:5\\d|71)\\d{5}|4(?:[0-2]\\d|3[0-57-9]|4[47-9]|5[0-25-9]|6[6-9]|7[03-9]|8[17-9]|9[017-9])\\d{6}","\\d{9}",,,"412345678"]
,[,,"1(?:80(?:0\\d{2})?|3(?:00\\d{2})?)\\d{4}","\\d{6,10}",,,"1800123456"]
,[,,"190[0126]\\d{6}","\\d{10}",,,"1900123456"]
,[,,"NA","NA"]
,[,,"500\\d{6}","\\d{9}",,,"500123456"]
,[,,"550\\d{6}","\\d{9}",,,"550123456"]
,"CX",61,"(?:14(?:1[14]|34|4[17]|[56]6|7[47]|88))?001[14-689]","0",,,"0",,"0011",,,,[,,"NA","NA"]
,,,[,,"NA","NA"]
,[,,"NA","NA"]
,,,[,,"NA","NA"]
]
,"CY":[,[,,"[257-9]\\d{7}","\\d{8}"]
,[,,"2[2-6]\\d{6}","\\d{8}",,,"22345678"]
,[,,"9[5-79]\\d{6}","\\d{8}",,,"96123456"]
,[,,"800\\d{5}","\\d{8}",,,"80001234"]
,[,,"90[09]\\d{5}","\\d{8}",,,"90012345"]
,[,,"80[1-9]\\d{5}","\\d{8}",,,"80112345"]
,[,,"700\\d{5}","\\d{8}",,,"70012345"]
,[,,"NA","NA"]
,"CY",357,"00",,,,,,,,[[,"(\\d{2})(\\d{6})","$1 $2",,"","",0]
]
,,[,,"NA","NA"]
,,,[,,"NA","NA"]
,[,,"(?:50|77)\\d{6}","\\d{8}",,,"77123456"]
,,,[,,"NA","NA"]
]
,"CZ":[,[,,"[2-8]\\d{8}|9\\d{8,11}","\\d{9,12}"]
,[,,"2\\d{8}|(?:3[1257-9]|4[16-9]|5[13-9])\\d{7}","\\d{9,12}",,,"212345678"]
,[,,"(?:60[1-8]|7(?:0[2-5]|[2379]\\d))\\d{6}","\\d{9,12}",,,"601123456"]
,[,,"800\\d{6}","\\d{9,12}",,,"800123456"]
,[,,"9(?:0[05689]|76)\\d{6}","\\d{9,12}",,,"900123456"]
,[,,"8[134]\\d{7}","\\d{9,12}",,,"811234567"]
,[,,"70[01]\\d{6}","\\d{9,12}",,,"700123456"]
,[,,"9[17]0\\d{6}","\\d{9,12}",,,"910123456"]
,"CZ",420,"00",,,,,,,,[[,"([2-9]\\d{2})(\\d{3})(\\d{3})","$1 $2 $3",["[2-8]|9[015-7]"]
,"","",0]
,[,"(96\\d)(\\d{3})(\\d{3})(\\d{3})","$1 $2 $3 $4",["96"]
,"","",0]
,[,"(9\\d)(\\d{3})(\\d{3})(\\d{3})","$1 $2 $3 $4",["9[36]"]
,"","",0]
]
,,[,,"NA","NA"]
,,,[,,"NA","NA"]
,[,,"9(?:5\\d|7[234])\\d{6}","\\d{9,12}",,,"972123456"]
,,,[,,"9(?:3\\d{9}|6\\d{7,10})","\\d{9,12}",,,"93123456789"]
]
,"DE":[,[,,"[1-35-9]\\d{3,14}|4(?:[0-8]\\d{4,12}|9(?:[0-37]\\d|4(?:[1-35-8]|4\\d?)|5\\d{1,2}|6[1-8]\\d?)\\d{2,8})","\\d{2,15}"]
,[,,"[246]\\d{5,13}|3(?:0\\d{3,13}|2\\d{9}|[3-9]\\d{4,13})|5(?:0[2-8]|[1256]\\d|[38][0-8]|4\\d{0,2}|[79][0-7])\\d{3,11}|7(?:0[2-8]|[1-9]\\d)\\d{3,10}|8(?:0[2-9]|[1-9]\\d)\\d{3,10}|9(?:0[6-9]\\d{3,10}|1\\d{4,12}|[2-9]\\d{4,11})","\\d{2,15}",,,"30123456"]
,[,,"1(?:5[0-25-9]\\d{8}|6[023]\\d{7,8}|7(?:[0-57-9]\\d?|6\\d)\\d{7})","\\d{10,11}",,,"15123456789"]
,[,,"800\\d{7,12}","\\d{10,15}",,,"8001234567890"]
,[,,"137[7-9]\\d{6}|900(?:[135]\\d{6}|9\\d{7})","\\d{10,11}",,,"9001234567"]
,[,,"1(?:3(?:7[1-6]\\d{6}|8\\d{4})|80\\d{5,11})","\\d{7,14}",,,"18012345"]
,[,,"700\\d{8}","\\d{11}",,,"70012345678"]
,[,,"NA","NA"]
,"DE",49,"00","0",,,"0",,,,[[,"(1\\d{2})(\\d{7,8})","$1 $2",["1[67]"]
,"0$1","",0]
,[,"(15\\d{3})(\\d{6})","$1 $2",["15[0568]"]
,"0$1","",0]
,[,"(1\\d{3})(\\d{7})","$1 $2",["15"]
,"0$1","",0]
,[,"(\\d{2})(\\d{3,11})","$1 $2",["3[02]|40|[68]9"]
,"0$1","",0]
,[,"(\\d{3})(\\d{3,11})","$1 $2",["2(?:\\d1|0[2389]|1[24]|28|34)|3(?:[3-9][15]|40)|[4-8][1-9]1|9(?:06|[1-9]1)"]
,"0$1","",0]
,[,"(\\d{4})(\\d{2,11})","$1 $2",["[24-6]|[7-9](?:\\d[1-9]|[1-9]\\d)|3(?:[3569][02-46-9]|4[2-4679]|7[2-467]|8[2-46-8])","[24-6]|[7-9](?:\\d[1-9]|[1-9]\\d)|3(?:3(?:0[1-467]|2[127-9]|3[124578]|[46][1246]|7[1257-9]|8[1256]|9[145])|4(?:2[135]|3[1357]|4[13578]|6[1246]|7[1356]|9[1346])|5(?:0[14]|2[1-3589]|3[1357]|4[1246]|6[1-4]|7[1346]|8[13568]|9[1246])|6(?:0[356]|2[1-489]|3[124-6]|4[1347]|6[13]|7[12579]|8[1-356]|9[135])|7(?:2[1-7]|3[1357]|4[145]|6[1-5]|7[1-4])|8(?:21|3[1468]|4[1347]|6[0135-9]|7[1467]|8[136])|9(?:0[12479]|2[1358]|3[1357]|4[134679]|6[1-9]|7[136]|8[147]|9[1468]))"]
,"0$1","",0]
,[,"(3\\d{4})(\\d{1,10})","$1 $2",["3"]
,"0$1","",0]
,[,"(800)(\\d{7,12})","$1 $2",["800"]
,"0$1","",0]
,[,"(177)(99)(\\d{7,8})","$1 $2 $3",["177","1779","17799"]
,"0$1","",0]
,[,"(\\d{3})(\\d)(\\d{4,10})","$1 $2 $3",["(?:18|90)0|137","1(?:37|80)|900[1359]"]
,"0$1","",0]
,[,"(1\\d{2})(\\d{5,11})","$1 $2",["181"]
,"0$1","",0]
,[,"(18\\d{3})(\\d{6})","$1 $2",["185","1850","18500"]
,"0$1","",0]
,[,"(18\\d{2})(\\d{7})","$1 $2",["18[68]"]
,"0$1","",0]
,[,"(18\\d)(\\d{8})","$1 $2",["18[2-579]"]
,"0$1","",0]
,[,"(700)(\\d{4})(\\d{4})","$1 $2 $3",["700"]
,"0$1","",0]
,[,"(138)(\\d{4})","$1 $2",["138"]
,"0$1","",0]
]
,,[,,"16(?:4\\d{1,10}|[89]\\d{1,11})","\\d{4,14}",,,"16412345"]
,,,[,,"NA","NA"]
,[,,"18(?:1\\d{5,11}|[2-9]\\d{8})","\\d{8,14}",,,"18500123456"]
,,,[,,"17799\\d{7,8}","\\d{12,13}",,,"177991234567"]
]
,"DJ":[,[,,"[27]\\d{7}","\\d{8}"]
,[,,"2(?:1[2-5]|7[45])\\d{5}","\\d{8}",,,"21360003"]
,[,,"77[6-8]\\d{5}","\\d{8}",,,"77831001"]
,[,,"NA","NA"]
,[,,"NA","NA"]
,[,,"NA","NA"]
,[,,"NA","NA"]
,[,,"NA","NA"]
,"DJ",253,"00",,,,,,,,[[,"(\\d{2})(\\d{2})(\\d{2})(\\d{2})","$1 $2 $3 $4",,"","",0]
]
,,[,,"NA","NA"]
,,,[,,"NA","NA"]
,[,,"NA","NA"]
,,,[,,"NA","NA"]
]
,"DK":[,[,,"[2-9]\\d{7}","\\d{8}"]
,[,,"(?:[2-7]\\d|8[126-9]|9[1-36-9])\\d{6}","\\d{8}",,,"32123456"]
,[,,"(?:[2-7]\\d|8[126-9]|9[1-36-9])\\d{6}","\\d{8}",,,"20123456"]
,[,,"80\\d{6}","\\d{8}",,,"80123456"]
,[,,"90\\d{6}","\\d{8}",,,"90123456"]
,[,,"NA","NA"]
,[,,"NA","NA"]
,[,,"NA","NA"]
,"DK",45,"00",,,,,,,1,[[,"(\\d{2})(\\d{2})(\\d{2})(\\d{2})","$1 $2 $3 $4",,"","",0]
]
,,[,,"NA","NA"]
,,,[,,"NA","NA"]
,[,,"NA","NA"]
,,,[,,"NA","NA"]
]
,"DM":[,[,,"[57-9]\\d{9}","\\d{7}(?:\\d{3})?"]
,[,,"767(?:2(?:55|66)|4(?:2[01]|4[0-25-9])|50[0-4]|70[1-3])\\d{4}","\\d{7}(?:\\d{3})?",,,"7674201234"]
,[,,"767(?:2(?:[234689]5|7[5-7])|31[5-7]|61[2-7])\\d{4}","\\d{10}",,,"7672251234"]
,[,,"8(?:00|44|55|66|77|88)[2-9]\\d{6}","\\d{10}",,,"8002123456"]
,[,,"900[2-9]\\d{6}","\\d{10}",,,"9002123456"]
,[,,"NA","NA"]
,[,,"5(?:00|33|44|66|77)[2-9]\\d{6}","\\d{10}",,,"5002345678"]
,[,,"NA","NA"]
,"DM",1,"011","1",,,"1",,,,,,[,,"NA","NA"]
,,"767",[,,"NA","NA"]
,[,,"NA","NA"]
,,,[,,"NA","NA"]
]
,"DO":[,[,,"[589]\\d{9}","\\d{7}(?:\\d{3})?"]
,[,,"8(?:[04]9[2-9]\\d{6}|29(?:2(?:[0-59]\\d|6[04-9]|7[0-27]|8[0237-9])|3(?:[0-35-9]\\d|4[7-9])|[45]\\d{2}|6(?:[0-27-9]\\d|[3-5][1-9]|6[0135-8])|7(?:0[013-9]|[1-37]\\d|4[1-35689]|5[1-4689]|6[1-57-9]|8[1-79]|9[1-8])|8(?:0[146-9]|1[0-48]|[248]\\d|3[1-79]|5[01589]|6[013-68]|7[124-8]|9[0-8])|9(?:[0-24]\\d|3[02-46-9]|5[0-79]|60|7[0169]|8[57-9]|9[02-9]))\\d{4})","\\d{7}(?:\\d{3})?",,,"8092345678"]
,[,,"8[024]9[2-9]\\d{6}","\\d{7}(?:\\d{3})?",,,"8092345678"]
,[,,"8(?:00|44|55|66|77|88)[2-9]\\d{6}","\\d{10}",,,"8002123456"]
,[,,"900[2-9]\\d{6}","\\d{10}",,,"9002123456"]
,[,,"NA","NA"]
,[,,"5(?:00|33|44|66|77)[2-9]\\d{6}","\\d{10}",,,"5002345678"]
,[,,"NA","NA"]
,"DO",1,"011","1",,,"1",,,,,,[,,"NA","NA"]
,,"8[024]9",[,,"NA","NA"]
,[,,"NA","NA"]
,,,[,,"NA","NA"]
]
,"DZ":[,[,,"(?:[1-4]|[5-9]\\d)\\d{7}","\\d{8,9}"]
,[,,"(?:1\\d|2[013-79]|3[0-8]|4[0135689])\\d{6}|9619\\d{5}","\\d{8,9}",,,"12345678"]
,[,,"(?:5[4-6]|7[7-9])\\d{7}|6(?:[569]\\d|7[0-6])\\d{6}","\\d{9}",,,"551234567"]
,[,,"800\\d{6}","\\d{9}",,,"800123456"]
,[,,"80[3-689]1\\d{5}","\\d{9}",,,"808123456"]
,[,,"80[12]1\\d{5}","\\d{9}",,,"801123456"]
,[,,"NA","NA"]
,[,,"98[23]\\d{6}","\\d{9}",,,"983123456"]
,"DZ",213,"00","0",,,"0",,,,[[,"([1-4]\\d)(\\d{2})(\\d{2})(\\d{2})","$1 $2 $3 $4",["[1-4]"]
,"0$1","",0]
,[,"([5-8]\\d{2})(\\d{2})(\\d{2})(\\d{2})","$1 $2 $3 $4",["[5-8]"]
,"0$1","",0]
,[,"(9\\d)(\\d{3})(\\d{2})(\\d{2})","$1 $2 $3 $4",["9"]
,"0$1","",0]
]
,,[,,"NA","NA"]
,,,[,,"NA","NA"]
,[,,"NA","NA"]
,,,[,,"NA","NA"]
]
,"EC":[,[,,"1\\d{9,10}|[2-8]\\d{7}|9\\d{8}","\\d{7,11}"]
,[,,"[2-7][2-7]\\d{6}","\\d{7,8}",,,"22123456"]
,[,,"9(?:39|[45][89]|[67][7-9]|[89]\\d)\\d{6}","\\d{9}",,,"991234567"]
,[,,"1800\\d{6,7}","\\d{10,11}",,,"18001234567"]
,[,,"NA","NA"]
,[,,"NA","NA"]
,[,,"NA","NA"]
,[,,"[2-7]890\\d{4}","\\d{8}",,,"28901234"]
,"EC",593,"00","0",,,"0",,,,[[,"(\\d)(\\d{3})(\\d{4})","$1 $2-$3",["[247]|[356][2-8]"]
,"(0$1)","",0]
,[,"(\\d{2})(\\d{3})(\\d{4})","$1 $2 $3",["9"]
,"0$1","",0]
,[,"(1800)(\\d{3})(\\d{3,4})","$1 $2 $3",["1"]
,"$1","",0]
]
,[[,"(\\d)(\\d{3})(\\d{4})","$1-$2-$3",["[247]|[356][2-8]"]
]
,[,"(\\d{2})(\\d{3})(\\d{4})","$1 $2 $3",["9"]
,"0$1","",0]
,[,"(1800)(\\d{3})(\\d{3,4})","$1 $2 $3",["1"]
,"$1","",0]
]
,[,,"NA","NA"]
,,,[,,"NA","NA"]
,[,,"NA","NA"]
,,,[,,"NA","NA"]
]
,"EE":[,[,,"1\\d{3,4}|[3-9]\\d{6,7}|800\\d{6,7}","\\d{4,10}"]
,[,,"(?:3[23589]|4[3-8]|6\\d|7[1-9]|88)\\d{5}","\\d{7}",,,"3212345"]
,[,,"(?:5\\d|8[1-5])\\d{6}|5(?:[02]\\d{2}|1(?:[0-8]\\d|95)|5[0-478]\\d|64[0-4]|65[1-589])\\d{3}","\\d{7,8}",,,"51234567"]
,[,,"800(?:0\\d{3}|1\\d|[2-9])\\d{3}","\\d{7,10}",,,"80012345"]
,[,,"(?:40\\d{2}|900)\\d{4}","\\d{7,8}",,,"9001234"]
,[,,"NA","NA"]
,[,,"70[0-2]\\d{5}","\\d{8}",,,"70012345"]
,[,,"NA","NA"]
,"EE",372,"00",,,,,,,,[[,"([3-79]\\d{2})(\\d{4})","$1 $2",["[369]|4[3-8]|5(?:[0-2]|5[0-478]|6[45])|7[1-9]","[369]|4[3-8]|5(?:[02]|1(?:[0-8]|95)|5[0-478]|6(?:4[0-4]|5[1-589]))|7[1-9]"]
,"","",0]
,[,"(70)(\\d{2})(\\d{4})","$1 $2 $3",["70"]
,"","",0]
,[,"(8000)(\\d{3})(\\d{3})","$1 $2 $3",["800","8000"]
,"","",0]
,[,"([458]\\d{3})(\\d{3,4})","$1 $2",["40|5|8(?:00|[1-5])","40|5|8(?:00[1-9]|[1-5])"]
,"","",0]
]
,,[,,"NA","NA"]
,,,[,,"1\\d{3,4}|800[2-9]\\d{3}","\\d{4,7}",,,"8002123"]
,[,,"1(?:2[01245]|3[0-6]|4[1-489]|5[0-59]|6[1-46-9]|7[0-27-9]|8[189]|9[012])\\d{1,2}","\\d{4,5}",,,"12123"]
,,,[,,"NA","NA"]
]
,"EG":[,[,,"1\\d{4,9}|[2456]\\d{8}|3\\d{7}|[89]\\d{8,9}","\\d{5,10}"]
,[,,"(?:1(?:3[23]\\d|5(?:[23]|9\\d))|2[2-4]\\d{2}|3\\d{2}|4(?:0[2-5]|[578][23]|64)\\d|5(?:0[2-7]|[57][23])\\d|6[24-689]3\\d|8(?:2[2-57]|4[26]|6[237]|8[2-4])\\d|9(?:2[27]|3[24]|52|6[2356]|7[2-4])\\d)\\d{5}|1[69]\\d{3}","\\d{5,9}",,,"234567890"]
,[,,"1(?:0[0-269]|1[0-245]|2[0-278])\\d{7}","\\d{10}",,,"1001234567"]
,[,,"800\\d{7}","\\d{10}",,,"8001234567"]
,[,,"900\\d{7}","\\d{10}",,,"9001234567"]
,[,,"NA","NA"]
,[,,"NA","NA"]
,[,,"NA","NA"]
,"EG",20,"00","0",,,"0",,,,[[,"(\\d)(\\d{7,8})","$1 $2",["[23]"]
,"0$1","",0]
,[,"(\\d{3})(\\d{3})(\\d{4})","$1 $2 $3",["1[012]|[89]00"]
,"0$1","",0]
,[,"(\\d{2})(\\d{6,7})","$1 $2",["1[35]|[4-6]|[89][2-9]"]
,"0$1","",0]
]
,,[,,"NA","NA"]
,,,[,,"NA","NA"]
,[,,"NA","NA"]
,,,[,,"NA","NA"]
]
,"EH":[,[,,"[5689]\\d{8}","\\d{9}"]
,[,,"528[89]\\d{5}","\\d{9}",,,"528812345"]
,[,,"6(?:0[0-8]|[12-79]\\d|8[017])\\d{6}","\\d{9}",,,"650123456"]
,[,,"80\\d{7}","\\d{9}",,,"801234567"]
,[,,"89\\d{7}","\\d{9}",,,"891234567"]
,[,,"NA","NA"]
,[,,"NA","NA"]
,[,,"NA","NA"]
,"EH",212,"00","0",,,"0",,,,,,[,,"NA","NA"]
,,"528[89]",[,,"NA","NA"]
,[,,"NA","NA"]
,,,[,,"NA","NA"]
]
,"ER":[,[,,"[178]\\d{6}","\\d{6,7}"]
,[,,"1(?:1[12568]|20|40|55|6[146])\\d{4}|8\\d{6}","\\d{6,7}",,,"8370362"]
,[,,"17[1-3]\\d{4}|7\\d{6}","\\d{7}",,,"7123456"]
,[,,"NA","NA"]
,[,,"NA","NA"]
,[,,"NA","NA"]
,[,,"NA","NA"]
,[,,"NA","NA"]
,"ER",291,"00","0",,,"0",,,,[[,"(\\d)(\\d{3})(\\d{3})","$1 $2 $3",,"0$1","",0]
]
,,[,,"NA","NA"]
,,,[,,"NA","NA"]
,[,,"NA","NA"]
,,,[,,"NA","NA"]
]
,"ES":[,[,,"[5-9]\\d{8}","\\d{9}"]
,[,,"8(?:[13]0|[28][0-8]|[47][1-9]|5[01346-9]|6[0457-9])\\d{6}|9(?:[1238][0-8]\\d{6}|4[1-9]\\d{6}|5\\d{7}|6(?:[0-8]\\d{6}|9(?:0(?:[0-57-9]\\d{4}|6(?:0[0-8]|1[1-9]|[2-9]\\d)\\d{2})|[1-9]\\d{5}))|7(?:[124-9]\\d{2}|3(?:[0-8]\\d|9[1-9]))\\d{4})","\\d{9}",,,"810123456"]
,[,,"(?:6\\d{6}|7[1-4]\\d{5}|9(?:6906(?:09|10)|7390\\d{2}))\\d{2}","\\d{9}",,,"612345678"]
,[,,"[89]00\\d{6}","\\d{9}",,,"800123456"]
,[,,"80[367]\\d{6}","\\d{9}",,,"803123456"]
,[,,"90[12]\\d{6}","\\d{9}",,,"901123456"]
,[,,"70\\d{7}","\\d{9}",,,"701234567"]
,[,,"NA","NA"]
,"ES",34,"00",,,,,,,,[[,"([89]00)(\\d{3})(\\d{3})","$1 $2 $3",["[89]00"]
,"","",0]
,[,"([5-9]\\d{2})(\\d{2})(\\d{2})(\\d{2})","$1 $2 $3 $4",["[568]|[79][0-8]"]
,"","",0]
]
,,[,,"NA","NA"]
,,,[,,"NA","NA"]
,[,,"51\\d{7}","\\d{9}",,,"511234567"]
,,,[,,"NA","NA"]
]
,"ET":[,[,,"[1-59]\\d{8}","\\d{7,9}"]
,[,,"(?:11(?:1(?:1[124]|2[2-57]|3[1-5]|5[5-8]|8[6-8])|2(?:13|3[6-8]|5[89]|7[05-9]|8[2-6])|3(?:2[01]|3[0-289]|4[1289]|7[1-4]|87)|4(?:1[69]|3[2-49]|4[0-3]|6[5-8])|5(?:1[57]|44|5[0-4])|6(?:18|2[69]|4[5-7]|5[1-5]|6[0-59]|8[015-8]))|2(?:2(?:11[1-9]|22[0-7]|33\\d|44[1467]|66[1-68])|5(?:11[124-6]|33[2-8]|44[1467]|55[14]|66[1-3679]|77[124-79]|880))|3(?:3(?:11[0-46-8]|22[0-6]|33[0134689]|44[04]|55[0-6]|66[01467])|4(?:44[0-8]|55[0-69]|66[0-3]|77[1-5]))|4(?:6(?:22[0-24-7]|33[1-5]|44[13-69]|55[14-689]|660|88[1-4])|7(?:11[1-9]|22[1-9]|33[13-7]|44[13-6]|55[1-689]))|5(?:7(?:227|55[05]|(?:66|77)[14-8])|8(?:11[149]|22[013-79]|33[0-68]|44[013-8]|550|66[1-5]|77\\d)))\\d{4}","\\d{7,9}",,,"111112345"]
,[,,"9(?:[1-3]\\d|5[89])\\d{6}","\\d{9}",,,"911234567"]
,[,,"NA","NA"]
,[,,"NA","NA"]
,[,,"NA","NA"]
,[,,"NA","NA"]
,[,,"NA","NA"]
,"ET",251,"00","0",,,"0",,,,[[,"([1-59]\\d)(\\d{3})(\\d{4})","$1 $2 $3",,"0$1","",0]
]
,,[,,"NA","NA"]
,,,[,,"NA","NA"]
,[,,"NA","NA"]
,,,[,,"NA","NA"]
]
,"FI":[,[,,"1\\d{4,11}|[2-9]\\d{4,10}","\\d{5,12}"]
,[,,"1(?:[3569][1-8]\\d{3,9}|[47]\\d{5,10})|2[1-8]\\d{3,9}|3(?:[1-8]\\d{3,9}|9\\d{4,8})|[5689][1-8]\\d{3,9}","\\d{5,12}",,,"1312345678"]
,[,,"4\\d{5,10}|50\\d{4,8}","\\d{6,11}",,,"412345678"]
,[,,"800\\d{4,7}","\\d{7,10}",,,"8001234567"]
,[,,"[67]00\\d{5,6}","\\d{8,9}",,,"600123456"]
,[,,"NA","NA"]
,[,,"NA","NA"]
,[,,"NA","NA"]
,"FI",358,"00|99[049]","0",,,"0",,,,[[,"(\\d{3})(\\d{3,7})","$1 $2",["(?:[1-3]00|[6-8]0)"]
,"0$1","",0]
,[,"(\\d{2})(\\d{4,10})","$1 $2",["[14]|2[09]|50|7[135]"]
,"0$1","",0]
,[,"(\\d)(\\d{4,11})","$1 $2",["[25689][1-8]|3"]
,"0$1","",0]
]
,,[,,"NA","NA"]
,1,,[,,"[13]00\\d{3,7}|2(?:0(?:0\\d{3,7}|2[023]\\d{1,6}|9[89]\\d{1,6}))|60(?:[12]\\d{5,6}|6\\d{7})|7(?:1\\d{7}|3\\d{8}|5[03-9]\\d{2,7})","\\d{5,10}",,,"100123"]
,[,,"[13]0\\d{4,8}|2(?:0(?:[016-8]\\d{3,7}|[2-59]\\d{2,7})|9\\d{4,8})|60(?:[12]\\d{5,6}|6\\d{7})|7(?:1\\d{7}|3\\d{8}|5[03-9]\\d{2,7})","\\d{5,10}",,,"10112345"]
,,,[,,"NA","NA"]
]
,"FJ":[,[,,"[36-9]\\d{6}|0\\d{10}","\\d{7}(?:\\d{4})?"]
,[,,"(?:3[0-5]|6[25-7]|8[58])\\d{5}","\\d{7}",,,"3212345"]
,[,,"(?:7[0-8]|8[034679]|9\\d)\\d{5}","\\d{7}",,,"7012345"]
,[,,"0800\\d{7}","\\d{11}",,,"08001234567"]
,[,,"NA","NA"]
,[,,"NA","NA"]
,[,,"NA","NA"]
,[,,"NA","NA"]
,"FJ",679,"0(?:0|52)",,,,,,"00",,[[,"(\\d{3})(\\d{4})","$1 $2",["[36-9]"]
,"","",0]
,[,"(\\d{4})(\\d{3})(\\d{4})","$1 $2 $3",["0"]
,"","",0]
]
,,[,,"NA","NA"]
,,,[,,"NA","NA"]
,[,,"NA","NA"]
,1,,[,,"NA","NA"]
]
,"FK":[,[,,"[2-7]\\d{4}","\\d{5}"]
,[,,"[2-47]\\d{4}","\\d{5}",,,"31234"]
,[,,"[56]\\d{4}","\\d{5}",,,"51234"]
,[,,"NA","NA"]
,[,,"NA","NA"]
,[,,"NA","NA"]
,[,,"NA","NA"]
,[,,"NA","NA"]
,"FK",500,"00",,,,,,,,,,[,,"NA","NA"]
,,,[,,"NA","NA"]
,[,,"NA","NA"]
,,,[,,"NA","NA"]
]
,"FM":[,[,,"[39]\\d{6}","\\d{7}"]
,[,,"3[2357]0[1-9]\\d{3}|9[2-6]\\d{5}","\\d{7}",,,"3201234"]
,[,,"3[2357]0[1-9]\\d{3}|9[2-7]\\d{5}","\\d{7}",,,"3501234"]
,[,,"NA","NA"]
,[,,"NA","NA"]
,[,,"NA","NA"]
,[,,"NA","NA"]
,[,,"NA","NA"]
,"FM",691,"00",,,,,,,,[[,"(\\d{3})(\\d{4})","$1 $2",,"","",0]
]
,,[,,"NA","NA"]
,,,[,,"NA","NA"]
,[,,"NA","NA"]
,,,[,,"NA","NA"]
]
,"FO":[,[,,"[2-9]\\d{5}","\\d{6}"]
,[,,"(?:20|[3-4]\\d|8[19])\\d{4}","\\d{6}",,,"201234"]
,[,,"(?:2[1-9]|5\\d|7[1-79])\\d{4}","\\d{6}",,,"211234"]
,[,,"80[257-9]\\d{3}","\\d{6}",,,"802123"]
,[,,"90(?:[1345][15-7]|2[125-7]|99)\\d{2}","\\d{6}",,,"901123"]
,[,,"NA","NA"]
,[,,"NA","NA"]
,[,,"(?:6[0-36]|88)\\d{4}","\\d{6}",,,"601234"]
,"FO",298,"00",,,,"(10(?:01|[12]0|88))",,,,[[,"(\\d{6})","$1",,"","$CC $1",0]
]
,,[,,"NA","NA"]
,,,[,,"NA","NA"]
,[,,"NA","NA"]
,,,[,,"NA","NA"]
]
,"FR":[,[,,"[1-9]\\d{8}","\\d{9}"]
,[,,"[1-5]\\d{8}","\\d{9}",,,"123456789"]
,[,,"6\\d{8}|7(?:00\\d{6}|[3-9]\\d{7})","\\d{9}",,,"612345678"]
,[,,"80\\d{7}","\\d{9}",,,"801234567"]
,[,,"89[1-37-9]\\d{6}","\\d{9}",,,"891123456"]
,[,,"8(?:1[019]|2[0156]|84|90)\\d{6}","\\d{9}",,,"810123456"]
,[,,"NA","NA"]
,[,,"9\\d{8}","\\d{9}",,,"912345678"]
,"FR",33,"00","0",,,"0",,,,[[,"([1-79])(\\d{2})(\\d{2})(\\d{2})(\\d{2})","$1 $2 $3 $4 $5",["[1-79]"]
,"0$1","",0]
,[,"(1\\d{2})(\\d{3})","$1 $2",["11"]
,"$1","",0]
,[,"(8\\d{2})(\\d{2})(\\d{2})(\\d{2})","$1 $2 $3 $4",["8"]
,"0 $1","",0]
]
,[[,"([1-79])(\\d{2})(\\d{2})(\\d{2})(\\d{2})","$1 $2 $3 $4 $5",["[1-79]"]
,"0$1","",0]
,[,"(8\\d{2})(\\d{2})(\\d{2})(\\d{2})","$1 $2 $3 $4",["8"]
,"0 $1","",0]
]
,[,,"NA","NA"]
,,,[,,"NA","NA"]
,[,,"NA","NA"]
,,,[,,"NA","NA"]
]
,"GA":[,[,,"0?\\d{7}","\\d{7,8}"]
,[,,"01\\d{6}","\\d{8}",,,"01441234"]
,[,,"0?[2-7]\\d{6}","\\d{7,8}",,,"06031234"]
,[,,"NA","NA"]
,[,,"NA","NA"]
,[,,"NA","NA"]
,[,,"NA","NA"]
,[,,"NA","NA"]
,"GA",241,"00",,,,,,,,[[,"(\\d)(\\d{2})(\\d{2})(\\d{2})","$1 $2 $3 $4",["[2-7]"]
,"0$1","",0]
,[,"(\\d{2})(\\d{2})(\\d{2})(\\d{2})","$1 $2 $3 $4",["0"]
,"","",0]
]
,,[,,"NA","NA"]
,,,[,,"NA","NA"]
,[,,"NA","NA"]
,1,,[,,"NA","NA"]
]
,"GB":[,[,,"\\d{7,10}","\\d{4,10}"]
,[,,"2(?:0[01378]|3[0189]|4[017]|8[0-46-9]|9[012])\\d{7}|1(?:(?:1(?:3[0-48]|[46][0-4]|5[012789]|7[0-49]|8[01349])|21[0-7]|31[0-8]|[459]1\\d|61[0-46-9]))\\d{6}|1(?:2(?:0[024-9]|2[3-9]|3[3-79]|4[1-689]|[58][02-9]|6[0-4789]|7[013-9]|9\\d)|3(?:0\\d|[25][02-9]|3[02-579]|[468][0-46-9]|7[1235679]|9[24578])|4(?:0[03-9]|[28][02-5789]|[37]\\d|4[02-69]|5[0-8]|[69][0-79])|5(?:0[1235-9]|2[024-9]|3[015689]|4[02-9]|5[03-9]|6\\d|7[0-35-9]|8[0-468]|9[0-5789])|6(?:0[034689]|2[0-35689]|[38][013-9]|4[1-467]|5[0-69]|6[13-9]|7[0-8]|9[0124578])|7(?:0[0246-9]|2\\d|3[023678]|4[03-9]|5[0-46-9]|6[013-9]|7[0-35-9]|8[024-9]|9[02-9])|8(?:0[35-9]|2[1-5789]|3[02-578]|4[0-578]|5[124-9]|6[2-69]|7\\d|8[02-9]|9[02569])|9(?:0[02-589]|2[02-689]|3[1-5789]|4[2-9]|5[0-579]|6[234789]|7[0124578]|8\\d|9[2-57]))\\d{6}|1(?:2(?:0(?:46[1-4]|87[2-9])|545[1-79]|76(?:2\\d|3[1-8]|6[1-6])|9(?:7(?:2[0-4]|3[2-5])|8(?:2[2-8]|7[0-4789]|8[345])))|3(?:638[2-5]|647[23]|8(?:47[04-9]|64[015789]))|4(?:044[1-7]|20(?:2[23]|8\\d)|6(?:0(?:30|5[2-57]|6[1-8]|7[2-8])|140)|8(?:052|87[123]))|5(?:24(?:3[2-79]|6\\d)|276\\d|6(?:26[06-9]|686))|6(?:06(?:4\\d|7[4-79])|295[567]|35[34]\\d|47(?:24|61)|59(?:5[08]|6[67]|74)|955[0-4])|7(?:26(?:6[13-9]|7[0-7])|442\\d|50(?:2[0-3]|[3-68]2|76))|8(?:27[56]\\d|37(?:5[2-5]|8[239])|84(?:3[2-58]))|9(?:0(?:0(?:6[1-8]|85)|52\\d)|3583|4(?:66[1-8]|9(?:2[01]|81))|63(?:23|3[1-4])|9561))\\d{3}|176888[234678]\\d{2}|16977[23]\\d{3}","\\d{4,10}",,,"1212345678"]
,[,,"7(?:[1-4]\\d\\d|5(?:0[0-8]|[13-9]\\d|2[0-35-9])|7(?:0[1-9]|[1-7]\\d|8[02-9]|9[0-689])|8(?:[014-9]\\d|[23][0-8])|9(?:[04-9]\\d|1[02-9]|2[0-35-9]|3[0-689]))\\d{6}","\\d{10}",,,"7400123456"]
,[,,"80(?:0(?:1111|\\d{6,7})|8\\d{7})|500\\d{6}","\\d{7}(?:\\d{2,3})?",,,"8001234567"]
,[,,"(?:87[123]|9(?:[01]\\d|8[2349]))\\d{7}","\\d{10}",,,"9012345678"]
,[,,"8(?:4(?:5464\\d|[2-5]\\d{7})|70\\d{7})","\\d{7}(?:\\d{3})?",,,"8431234567"]
,[,,"70\\d{8}","\\d{10}",,,"7012345678"]
,[,,"56\\d{8}","\\d{10}",,,"5612345678"]
,"GB",44,"00","0"," x",,"0",,,,[[,"(\\d{2})(\\d{4})(\\d{4})","$1 $2 $3",["2|5[56]|7(?:0|6[013-9])","2|5[56]|7(?:0|6(?:[013-9]|2[0-35-9]))"]
,"0$1","",0]
,[,"(\\d{3})(\\d{3})(\\d{4})","$1 $2 $3",["1(?:1|\\d1)|3|9[018]"]
,"0$1","",0]
,[,"(\\d{5})(\\d{4,5})","$1 $2",["1(?:38|5[23]|69|76|94)","1(?:387|5(?:24|39)|697|768|946)","1(?:3873|5(?:242|39[456])|697[347]|768[347]|9467)"]
,"0$1","",0]
,[,"(1\\d{3})(\\d{5,6})","$1 $2",["1"]
,"0$1","",0]
,[,"(7\\d{3})(\\d{6})","$1 $2",["7(?:[1-5789]|62)","7(?:[1-5789]|624)"]
,"0$1","",0]
,[,"(800)(\\d{4})","$1 $2",["800","8001","80011","800111","8001111"]
,"0$1","",0]
,[,"(845)(46)(4\\d)","$1 $2 $3",["845","8454","84546","845464"]
,"0$1","",0]
,[,"(8\\d{2})(\\d{3})(\\d{4})","$1 $2 $3",["8(?:4[2-5]|7[0-3])"]
,"0$1","",0]
,[,"(80\\d)(\\d{3})(\\d{4})","$1 $2 $3",["80"]
,"0$1","",0]
,[,"([58]00)(\\d{6})","$1 $2",["[58]00"]
,"0$1","",0]
]
,,[,,"76(?:0[012]|2[356]|4[0134]|5[49]|6[0-369]|77|81|9[39])\\d{6}","\\d{10}",,,"7640123456"]
,1,,[,,"NA","NA"]
,[,,"(?:3[0347]|55)\\d{8}","\\d{10}",,,"5512345678"]
,,,[,,"NA","NA"]
]
,"GD":[,[,,"[4589]\\d{9}","\\d{7}(?:\\d{3})?"]
,[,,"473(?:2(?:3[0-2]|69)|3(?:2[89]|86)|4(?:[06]8|3[5-9]|4[0-49]|5[5-79]|68|73|90)|63[68]|7(?:58|84)|800|938)\\d{4}","\\d{7}(?:\\d{3})?",,,"4732691234"]
,[,,"473(?:4(?:0[2-79]|1[04-9]|20|58)|5(?:2[01]|3[3-8])|901)\\d{4}","\\d{10}",,,"4734031234"]
,[,,"8(?:00|44|55|66|77|88)[2-9]\\d{6}","\\d{10}",,,"8002123456"]
,[,,"900[2-9]\\d{6}","\\d{10}",,,"9002123456"]
,[,,"NA","NA"]
,[,,"5(?:00|33|44|66|77)[2-9]\\d{6}","\\d{10}",,,"5002345678"]
,[,,"NA","NA"]
,"GD",1,"011","1",,,"1",,,,,,[,,"NA","NA"]
,,"473",[,,"NA","NA"]
,[,,"NA","NA"]
,,,[,,"NA","NA"]
]
,"GE":[,[,,"[34578]\\d{8}","\\d{6,9}"]
,[,,"(?:3(?:[256]\\d|4[124-9]|7[0-4])|4(?:1\\d|2[2-7]|3[1-79]|4[2-8]|7[239]|9[1-7]))\\d{6}","\\d{6,9}",,,"322123456"]
,[,,"5(?:14|5[01578]|68|7[0147-9]|9[0-35-9])\\d{6}","\\d{9}",,,"555123456"]
,[,,"800\\d{6}","\\d{9}",,,"800123456"]
,[,,"NA","NA"]
,[,,"NA","NA"]
,[,,"NA","NA"]
,[,,"706\\d{6}","\\d{9}",,,"706123456"]
,"GE",995,"00","0",,,"0",,,,[[,"(\\d{3})(\\d{2})(\\d{2})(\\d{2})","$1 $2 $3 $4",["[348]"]
,"0$1","",0]
,[,"(\\d{3})(\\d{3})(\\d{3})","$1 $2 $3",["7"]
,"0$1","",0]
,[,"(\\d{3})(\\d{2})(\\d{2})(\\d{2})","$1 $2 $3 $4",["5"]
,"$1","",0]
]
,,[,,"NA","NA"]
,,,[,,"706\\d{6}","\\d{9}",,,"706123456"]
,[,,"NA","NA"]
,,,[,,"NA","NA"]
]
,"GF":[,[,,"[56]\\d{8}","\\d{9}"]
,[,,"594(?:10|2[012457-9]|3[0-57-9]|4[3-9]|5[7-9]|6[0-3]|9[014])\\d{4}","\\d{9}",,,"594101234"]
,[,,"694(?:[04][0-7]|1[0-5]|3[018]|[29]\\d)\\d{4}","\\d{9}",,,"694201234"]
,[,,"NA","NA"]
,[,,"NA","NA"]
,[,,"NA","NA"]
,[,,"NA","NA"]
,[,,"NA","NA"]
,"GF",594,"00","0",,,"0",,,,[[,"(\\d{3})(\\d{2})(\\d{2})(\\d{2})","$1 $2 $3 $4",,"0$1","",0]
]
,,[,,"NA","NA"]
,,,[,,"NA","NA"]
,[,,"NA","NA"]
,,,[,,"NA","NA"]
]
,"GG":[,[,,"[135789]\\d{6,9}","\\d{6,10}"]
,[,,"1481\\d{6}","\\d{6,10}",,,"1481456789"]
,[,,"7(?:781|839|911)\\d{6}","\\d{10}",,,"7781123456"]
,[,,"80(?:0(?:1111|\\d{6,7})|8\\d{7})|500\\d{6}","\\d{7}(?:\\d{2,3})?",,,"8001234567"]
,[,,"(?:87[123]|9(?:[01]\\d|8[0-3]))\\d{7}","\\d{10}",,,"9012345678"]
,[,,"8(?:4(?:5464\\d|[2-5]\\d{7})|70\\d{7})","\\d{7}(?:\\d{3})?",,,"8431234567"]
,[,,"70\\d{8}","\\d{10}",,,"7012345678"]
,[,,"56\\d{8}","\\d{10}",,,"5612345678"]
,"GG",44,"00","0"," x",,"0",,,,,,[,,"76(?:0[012]|2[356]|4[0134]|5[49]|6[0-369]|77|81|9[39])\\d{6}","\\d{10}",,,"7640123456"]
,,,[,,"NA","NA"]
,[,,"(?:3[0347]|55)\\d{8}","\\d{10}",,,"5512345678"]
,,,[,,"NA","NA"]
]
,"GH":[,[,,"[235]\\d{8}|8\\d{7}","\\d{7,9}"]
,[,,"3(?:0[237]\\d|[167](?:2[0-6]|7\\d)|2(?:2[0-5]|7\\d)|3(?:2[0-3]|7\\d)|4(?:2[013-9]|3[01]|7\\d)|5(?:2[0-7]|7\\d)|8(?:2[0-2]|7\\d)|9(?:20|7\\d))\\d{5}","\\d{7,9}",,,"302345678"]
,[,,"(?:2[034678]\\d|5(?:[047]\\d|5[3-6]|6[01]))\\d{6}","\\d{9}",,,"231234567"]
,[,,"800\\d{5}","\\d{8}",,,"80012345"]
,[,,"NA","NA"]
,[,,"NA","NA"]
,[,,"NA","NA"]
,[,,"NA","NA"]
,"GH",233,"00","0",,,"0",,,,[[,"(\\d{2})(\\d{3})(\\d{4})","$1 $2 $3",["[235]"]
,"0$1","",0]
,[,"(\\d{3})(\\d{5})","$1 $2",["8"]
,"0$1","",0]
]
,,[,,"NA","NA"]
,,,[,,"800\\d{5}","\\d{8}",,,"80012345"]
,[,,"NA","NA"]
,,,[,,"NA","NA"]
]
,"GI":[,[,,"[2568]\\d{7}","\\d{8}"]
,[,,"2(?:00\\d|1(?:6[24-7]|9\\d)|2(?:00|2[2457]))\\d{4}","\\d{8}",,,"20012345"]
,[,,"(?:5[46-8]|62)\\d{6}","\\d{8}",,,"57123456"]
,[,,"80\\d{6}","\\d{8}",,,"80123456"]
,[,,"8[1-689]\\d{6}","\\d{8}",,,"88123456"]
,[,,"87\\d{6}","\\d{8}",,,"87123456"]
,[,,"NA","NA"]
,[,,"NA","NA"]
,"GI",350,"00",,,,,,,,[[,"(\\d{3})(\\d{5})","$1 $2",["2"]
,"","",0]
]
,,[,,"NA","NA"]
,,,[,,"NA","NA"]
,[,,"NA","NA"]
,,,[,,"NA","NA"]
]
,"GL":[,[,,"[1-689]\\d{5}","\\d{6}"]
,[,,"(?:19|3[1-6]|6[14689]|8[14-79]|9\\d)\\d{4}","\\d{6}",,,"321000"]
,[,,"[245][2-9]\\d{4}","\\d{6}",,,"221234"]
,[,,"80\\d{4}","\\d{6}",,,"801234"]
,[,,"NA","NA"]
,[,,"NA","NA"]
,[,,"NA","NA"]
,[,,"3[89]\\d{4}","\\d{6}",,,"381234"]
,"GL",299,"00",,,,,,,,[[,"(\\d{2})(\\d{2})(\\d{2})","$1 $2 $3",,"","",0]
]
,,[,,"NA","NA"]
,,,[,,"NA","NA"]
,[,,"NA","NA"]
,,,[,,"NA","NA"]
]
,"GM":[,[,,"[2-9]\\d{6}","\\d{7}"]
,[,,"(?:4(?:[23]\\d{2}|4(?:1[024679]|[6-9]\\d))|5(?:54[0-7]|6(?:[67]\\d)|7(?:1[04]|2[035]|3[58]|48))|8\\d{3})\\d{3}","\\d{7}",,,"5661234"]
,[,,"(?:2[0-6]|[3679]\\d)\\d{5}","\\d{7}",,,"3012345"]
,[,,"NA","NA"]
,[,,"NA","NA"]
,[,,"NA","NA"]
,[,,"NA","NA"]
,[,,"NA","NA"]
,"GM",220,"00",,,,,,,,[[,"(\\d{3})(\\d{4})","$1 $2",,"","",0]
]
,,[,,"NA","NA"]
,,,[,,"NA","NA"]
,[,,"NA","NA"]
,,,[,,"NA","NA"]
]
,"GN":[,[,,"[367]\\d{7,8}","\\d{8,9}"]
,[,,"30(?:24|3[12]|4[1-35-7]|5[13]|6[189]|[78]1|9[1478])\\d{4}","\\d{8}",,,"30241234"]
,[,,"6[02356]\\d{7}","\\d{9}",,,"601123456"]
,[,,"NA","NA"]
,[,,"NA","NA"]
,[,,"NA","NA"]
,[,,"NA","NA"]
,[,,"722\\d{6}","\\d{9}",,,"722123456"]
,"GN",224,"00",,,,,,,,[[,"(\\d{2})(\\d{2})(\\d{2})(\\d{2})","$1 $2 $3 $4",["3"]
,"","",0]
,[,"(\\d{3})(\\d{2})(\\d{2})(\\d{2})","$1 $2 $3 $4",["[67]"]
,"","",0]
]
,,[,,"NA","NA"]
,,,[,,"NA","NA"]
,[,,"NA","NA"]
,,,[,,"NA","NA"]
]
,"GP":[,[,,"[56]\\d{8}","\\d{9}"]
,[,,"590(?:0[13468]|1[012]|2[0-68]|3[28]|4[0-8]|5[579]|6[0189]|70|8[0-689]|9\\d)\\d{4}","\\d{9}",,,"590201234"]
,[,,"690(?:0[0-7]|[1-9]\\d)\\d{4}","\\d{9}",,,"690301234"]
,[,,"NA","NA"]
,[,,"NA","NA"]
,[,,"NA","NA"]
,[,,"NA","NA"]
,[,,"NA","NA"]
,"GP",590,"00","0",,,"0",,,,[[,"([56]90)(\\d{2})(\\d{4})","$1 $2-$3",,"0$1","",0]
]
,,[,,"NA","NA"]
,1,,[,,"NA","NA"]
,[,,"NA","NA"]
,,,[,,"NA","NA"]
]
,"GQ":[,[,,"[23589]\\d{8}","\\d{9}"]
,[,,"3(?:3(?:3\\d[7-9]|[0-24-9]\\d[46])|5\\d{2}[7-9])\\d{4}","\\d{9}",,,"333091234"]
,[,,"(?:222|551)\\d{6}","\\d{9}",,,"222123456"]
,[,,"80\\d[1-9]\\d{5}","\\d{9}",,,"800123456"]
,[,,"90\\d[1-9]\\d{5}","\\d{9}",,,"900123456"]
,[,,"NA","NA"]
,[,,"NA","NA"]
,[,,"NA","NA"]
,"GQ",240,"00",,,,,,,,[[,"(\\d{3})(\\d{3})(\\d{3})","$1 $2 $3",["[235]"]
,"","",0]
,[,"(\\d{3})(\\d{6})","$1 $2",["[89]"]
,"","",0]
]
,,[,,"NA","NA"]
,,,[,,"NA","NA"]
,[,,"NA","NA"]
,,,[,,"NA","NA"]
]
,"GR":[,[,,"[26-9]\\d{9}","\\d{10}"]
,[,,"2(?:1\\d{2}|2(?:2[1-46-9]|3[1-8]|4[1-7]|5[1-4]|6[1-8]|7[1-5]|[89][1-9])|3(?:1\\d|2[1-57]|[35][1-3]|4[13]|7[1-7]|8[124-6]|9[1-79])|4(?:1\\d|2[1-8]|3[1-4]|4[13-5]|6[1-578]|9[1-5])|5(?:1\\d|[29][1-4]|3[1-5]|4[124]|5[1-6])|6(?:1\\d|3[1245]|4[1-7]|5[13-9]|[269][1-6]|7[14]|8[1-5])|7(?:1\\d|2[1-5]|3[1-6]|4[1-7]|5[1-57]|6[135]|9[125-7])|8(?:1\\d|2[1-5]|[34][1-4]|9[1-57]))\\d{6}","\\d{10}",,,"2123456789"]
,[,,"69\\d{8}","\\d{10}",,,"6912345678"]
,[,,"800\\d{7}","\\d{10}",,,"8001234567"]
,[,,"90[19]\\d{7}","\\d{10}",,,"9091234567"]
,[,,"8(?:0[16]|12|25)\\d{7}","\\d{10}",,,"8011234567"]
,[,,"70\\d{8}","\\d{10}",,,"7012345678"]
,[,,"NA","NA"]
,"GR",30,"00",,,,,,,,[[,"([27]\\d)(\\d{4})(\\d{4})","$1 $2 $3",["21|7"]
,"","",0]
,[,"(\\d{3})(\\d{3})(\\d{4})","$1 $2 $3",["2[2-9]1|[689]"]
,"","",0]
,[,"(2\\d{3})(\\d{6})","$1 $2",["2[2-9][02-9]"]
,"","",0]
]
,,[,,"NA","NA"]
,,,[,,"NA","NA"]
,[,,"NA","NA"]
,,,[,,"NA","NA"]
]
,"GT":[,[,,"[2-7]\\d{7}|1[89]\\d{9}","\\d{8}(?:\\d{3})?"]
,[,,"[267][2-9]\\d{6}","\\d{8}",,,"22456789"]
,[,,"[345]\\d{7}","\\d{8}",,,"51234567"]
,[,,"18[01]\\d{8}","\\d{11}",,,"18001112222"]
,[,,"19\\d{9}","\\d{11}",,,"19001112222"]
,[,,"NA","NA"]
,[,,"NA","NA"]
,[,,"NA","NA"]
,"GT",502,"00",,,,,,,,[[,"(\\d{4})(\\d{4})","$1 $2",["[2-7]"]
,"","",0]
,[,"(\\d{4})(\\d{3})(\\d{4})","$1 $2 $3",["1"]
,"","",0]
]
,,[,,"NA","NA"]
,,,[,,"NA","NA"]
,[,,"NA","NA"]
,,,[,,"NA","NA"]
]
,"GU":[,[,,"[5689]\\d{9}","\\d{7}(?:\\d{3})?"]
,[,,"671(?:3(?:00|3[39]|4[349]|55|6[26])|4(?:56|7[1-9]|8[236-9])|5(?:55|6[2-5]|88)|6(?:3[2-578]|4[24-9]|5[34]|78|8[5-9])|7(?:[079]7|2[0167]|3[45]|8[789])|8(?:[2-5789]8|6[48])|9(?:2[29]|6[79]|7[179]|8[789]|9[78]))\\d{4}","\\d{7}(?:\\d{3})?",,,"6713001234"]
,[,,"671(?:3(?:00|3[39]|4[349]|55|6[26])|4(?:56|7[1-9]|8[236-9])|5(?:55|6[2-5]|88)|6(?:3[2-578]|4[24-9]|5[34]|78|8[5-9])|7(?:[079]7|2[0167]|3[45]|8[789])|8(?:[2-5789]8|6[48])|9(?:2[29]|6[79]|7[179]|8[789]|9[78]))\\d{4}","\\d{7}(?:\\d{3})?",,,"6713001234"]
,[,,"8(?:00|44|55|66|77|88)[2-9]\\d{6}","\\d{10}",,,"8002123456"]
,[,,"900[2-9]\\d{6}","\\d{10}",,,"9002123456"]
,[,,"NA","NA"]
,[,,"5(?:00|33|44|66|77)[2-9]\\d{6}","\\d{10}",,,"5002345678"]
,[,,"NA","NA"]
,"GU",1,"011","1",,,"1",,,1,,,[,,"NA","NA"]
,,"671",[,,"NA","NA"]
,[,,"NA","NA"]
,,,[,,"NA","NA"]
]
,"GW":[,[,,"[3-79]\\d{6}","\\d{7}"]
,[,,"3(?:2[0125]|3[1245]|4[12]|5[1-4]|70|9[1-467])\\d{4}","\\d{7}",,,"3201234"]
,[,,"(?:[5-7]\\d|9[012])\\d{5}","\\d{7}",,,"5012345"]
,[,,"NA","NA"]
,[,,"NA","NA"]
,[,,"NA","NA"]
,[,,"NA","NA"]
,[,,"40\\d{5}","\\d{7}",,,"4012345"]
,"GW",245,"00",,,,,,,,[[,"(\\d{3})(\\d{4})","$1 $2",,"","",0]
]
,,[,,"NA","NA"]
,,,[,,"NA","NA"]
,[,,"NA","NA"]
,,,[,,"NA","NA"]
]
,"GY":[,[,,"[2-4679]\\d{6}","\\d{7}"]
,[,,"(?:2(?:1[6-9]|2[0-35-9]|3[1-4]|5[3-9]|6\\d|7[0-24-79])|3(?:2[25-9]|3\\d)|4(?:4[0-24]|5[56])|77[1-57])\\d{4}","\\d{7}",,,"2201234"]
,[,,"6\\d{6}","\\d{7}",,,"6091234"]
,[,,"(?:289|862)\\d{4}","\\d{7}",,,"2891234"]
,[,,"9008\\d{3}","\\d{7}",,,"9008123"]
,[,,"NA","NA"]
,[,,"NA","NA"]
,[,,"NA","NA"]
,"GY",592,"001",,,,,,,,[[,"(\\d{3})(\\d{4})","$1 $2",,"","",0]
]
,,[,,"NA","NA"]
,,,[,,"NA","NA"]
,[,,"NA","NA"]
,,,[,,"NA","NA"]
]
,"HK":[,[,,"[235-7]\\d{7}|8\\d{7,8}|9\\d{4,10}","\\d{5,11}"]
,[,,"(?:[23]\\d|58)\\d{6}","\\d{8}",,,"21234567"]
,[,,"(?:5[1-79]\\d|6\\d{2}|8[4-79]\\d|9(?:0[1-9]|[1-8]\\d))\\d{5}","\\d{8}",,,"51234567"]
,[,,"800\\d{6}","\\d{9}",,,"800123456"]
,[,,"900(?:[0-24-9]\\d{7}|3\\d{1,4})","\\d{5,11}",,,"90012345678"]
,[,,"NA","NA"]
,[,,"8[1-3]\\d{6}","\\d{8}",,,"81123456"]
,[,,"NA","NA"]
,"HK",852,"00",,,,,,,,[[,"(\\d{4})(\\d{4})","$1 $2",["[235-7]|[89](?:0[1-9]|[1-9])"]
,"","",0]
,[,"(800)(\\d{3})(\\d{3})","$1 $2 $3",["800"]
,"","",0]
,[,"(900)(\\d{2})(\\d{3})(\\d{3})","$1 $2 $3 $4",["900"]
,"","",0]
,[,"(900)(\\d{2,5})","$1 $2",["900"]
,"","",0]
]
,,[,,"7\\d{7}","\\d{8}",,,"71234567"]
,,,[,,"NA","NA"]
,[,,"NA","NA"]
,,,[,,"NA","NA"]
]
,"HN":[,[,,"[237-9]\\d{7}","\\d{8}"]
,[,,"2(?:2(?:0[019]|1[1-36]|[23]\\d|4[056]|5[57]|7[01389]|8[0146-9]|9[012])|4(?:2[3-59]|3[13-689]|4[0-68]|5[1-35])|5(?:4[3-5]|5\\d|6[56]|74)|6(?:[056]\\d|34|4[0-378]|[78][0-8]|9[01])|7(?:6[46-9]|7[02-9]|8[34])|8(?:79|8[0-35789]|9[1-57-9]))\\d{4}","\\d{8}",,,"22123456"]
,[,,"[37-9]\\d{7}","\\d{8}",,,"91234567"]
,[,,"NA","NA"]
,[,,"NA","NA"]
,[,,"NA","NA"]
,[,,"NA","NA"]
,[,,"NA","NA"]
,"HN",504,"00",,,,,,,,[[,"(\\d{4})(\\d{4})","$1-$2",,"","",0]
]
,,[,,"NA","NA"]
,,,[,,"NA","NA"]
,[,,"NA","NA"]
,,,[,,"NA","NA"]
]
,"HR":[,[,,"[1-7]\\d{5,8}|[89]\\d{6,11}","\\d{6,12}"]
,[,,"1\\d{7}|(?:2[0-3]|3[1-5]|4[02-47-9]|5[1-3])\\d{6,7}","\\d{6,9}",,,"12345678"]
,[,,"9(?:[1-9]\\d{6,10}|01\\d{6,9})","\\d{8,12}",,,"912345678"]
,[,,"80[01]\\d{4,7}","\\d{7,10}",,,"8001234567"]
,[,,"6(?:[01459]\\d{4,7})","\\d{6,9}",,,"611234"]
,[,,"NA","NA"]
,[,,"7[45]\\d{4,7}","\\d{6,9}",,,"741234567"]
,[,,"NA","NA"]
,"HR",385,"00","0",,,"0",,,,[[,"(1)(\\d{4})(\\d{3})","$1 $2 $3",["1"]
,"0$1","",0]
,[,"(6[09])(\\d{4})(\\d{3})","$1 $2 $3",["6[09]"]
,"0$1","",0]
,[,"([67]2)(\\d{3})(\\d{3,4})","$1 $2 $3",["[67]2"]
,"0$1","",0]
,[,"([2-5]\\d)(\\d{3})(\\d{3,4})","$1 $2 $3",["[2-5]"]
,"0$1","",0]
,[,"(9\\d)(\\d{3})(\\d{3,4})","$1 $2 $3",["9"]
,"0$1","",0]
,[,"(9\\d)(\\d{4})(\\d{4})","$1 $2 $3",["9"]
,"0$1","",0]
,[,"(9\\d)(\\d{3,4})(\\d{3})(\\d{3})","$1 $2 $3 $4",["9"]
,"0$1","",0]
,[,"(\\d{2})(\\d{2})(\\d{2,3})","$1 $2 $3",["6[0145]|7"]
,"0$1","",0]
,[,"(\\d{2})(\\d{3,4})(\\d{3})","$1 $2 $3",["6[0145]|7"]
,"0$1","",0]
,[,"(80[01])(\\d{2})(\\d{2,3})","$1 $2 $3",["8"]
,"0$1","",0]
,[,"(80[01])(\\d{3,4})(\\d{3})","$1 $2 $3",["8"]
,"0$1","",0]
]
,,[,,"NA","NA"]
,,,[,,"NA","NA"]
,[,,"[76]2\\d{6,7}","\\d{8,9}",,,"62123456"]
,,,[,,"NA","NA"]
]
,"HT":[,[,,"[2-489]\\d{7}","\\d{8}"]
,[,,"2(?:[24]\\d|5[1-5]|94)\\d{5}","\\d{8}",,,"22453300"]
,[,,"(?:3[1-9]\\d|4\\d{2}|9(?:8[0-35]|9[5-9]))\\d{5}","\\d{8}",,,"34101234"]
,[,,"8\\d{7}","\\d{8}",,,"80012345"]
,[,,"NA","NA"]
,[,,"NA","NA"]
,[,,"NA","NA"]
,[,,"98[89]\\d{5}","\\d{8}",,,"98901234"]
,"HT",509,"00",,,,,,,,[[,"(\\d{2})(\\d{2})(\\d{4})","$1 $2 $3",,"","",0]
]
,,[,,"NA","NA"]
,,,[,,"NA","NA"]
,[,,"NA","NA"]
,,,[,,"NA","NA"]
]
,"HU":[,[,,"[1-9]\\d{7,8}","\\d{6,9}"]
,[,,"(?:1\\d|2(?:1\\d|[2-9])|3(?:[2-7]|8\\d)|4[24-9]|5[2-79]|6[23689]|7(?:1\\d|[2-9])|8[2-57-9]|9[2-69])\\d{6}","\\d{6,9}",,,"12345678"]
,[,,"(?:[257]0|3[01])\\d{7}","\\d{9}",,,"201234567"]
,[,,"80\\d{6}","\\d{8}",,,"80123456"]
,[,,"9[01]\\d{6}","\\d{8}",,,"90123456"]
,[,,"40\\d{6}","\\d{8}",,,"40123456"]
,[,,"NA","NA"]
,[,,"NA","NA"]
,"HU",36,"00","06",,,"06",,,,[[,"(1)(\\d{3})(\\d{4})","$1 $2 $3",["1"]
,"($1)","",0]
,[,"(\\d{2})(\\d{3})(\\d{3,4})","$1 $2 $3",["[2-9]"]
,"($1)","",0]
]
,,[,,"NA","NA"]
,,,[,,"[48]0\\d{6}","\\d{8}",,,"80123456"]
,[,,"NA","NA"]
,,,[,,"NA","NA"]
]
,"ID":[,[,,"[1-9]\\d{6,10}","\\d{5,11}"]
,[,,"2(?:1(?:14\\d{3}|[0-8]\\d{6,7}|500\\d{3}|9\\d{6})|2\\d{6,8}|4\\d{7,8})|(?:2(?:[35][1-4]|6[0-8]|7[1-6]|8\\d|9[1-8])|3(?:1|[25][1-8]|3[1-68]|4[1-3]|6[1-3568]|7[0-469]|8\\d)|4(?:0[1-589]|1[01347-9]|2[0-36-8]|3[0-24-68]|43|5[1-378]|6[1-5]|7[134]|8[1245])|5(?:1[1-35-9]|2[25-8]|3[124-9]|4[1-3589]|5[1-46]|6[1-8])|6(?:19?|[25]\\d|3[1-69]|4[1-6])|7(?:02|[125][1-9]|[36]\\d|4[1-8]|7[0-36-9])|9(?:0[12]|1[013-8]|2[0-479]|5[125-8]|6[23679]|7[159]|8[01346]))\\d{5,8}","\\d{5,11}",,,"612345678"]
,[,,"(?:2(?:1(?:3[145]|4[01]|5[1-469]|60|8[0359]|9\\d)|2(?:88|9[1256])|3[1-4]9|4(?:36|91)|5(?:1[349]|[2-4]9)|6[0-7]9|7(?:[1-36]9|4[39])|8[1-5]9|9[1-48]9)|3(?:19[1-3]|2[12]9|3[13]9|4(?:1[69]|39)|5[14]9|6(?:1[69]|2[89])|709)|4[13]19|5(?:1(?:19|8[39])|4[129]9|6[12]9)|6(?:19[12]|2(?:[23]9|77))|7(?:1[13]9|2[15]9|419|5(?:1[89]|29)|6[15]9|7[178]9))\\d{5,6}|8[1-35-9]\\d{7,9}","\\d{9,11}",,,"812345678"]
,[,,"177\\d{6,8}|800\\d{5,7}","\\d{8,11}",,,"8001234567"]
,[,,"809\\d{7}","\\d{10}",,,"8091234567"]
,[,,"NA","NA"]
,[,,"NA","NA"]
,[,,"NA","NA"]
,"ID",62,"0(?:0[1789]|10(?:00|1[67]))","0",,,"0",,,,[[,"(\\d{2})(\\d{5,8})","$1 $2",["2[124]|[36]1"]
,"(0$1)","",0]
,[,"(\\d{3})(\\d{5,8})","$1 $2",["[4579]|2[035-9]|[36][02-9]"]
,"(0$1)","",0]
,[,"(8\\d{2})(\\d{3,4})(\\d{3,4})","$1-$2-$3",["8[1-35-9]"]
,"0$1","",0]
,[,"(177)(\\d{6,8})","$1 $2",["1"]
,"0$1","",0]
,[,"(800)(\\d{5,7})","$1 $2",["800"]
,"0$1","",0]
,[,"(80\\d)(\\d)(\\d{3})(\\d{3})","$1 $2 $3 $4",["80[79]"]
,"0$1","",0]
]
,,[,,"NA","NA"]
,,,[,,"8071\\d{6}","\\d{10}",,,"8071123456"]
,[,,"8071\\d{6}","\\d{10}",,,"8071123456"]
,,,[,,"NA","NA"]
]
,"IE":[,[,,"[124-9]\\d{6,9}","\\d{5,10}"]
,[,,"1\\d{7,8}|2(?:1\\d{6,7}|3\\d{7}|[24-9]\\d{5})|4(?:0[24]\\d{5}|[1-469]\\d{7}|5\\d{6}|7\\d{5}|8[0-46-9]\\d{7})|5(?:0[45]\\d{5}|1\\d{6}|[23679]\\d{7}|8\\d{5})|6(?:1\\d{6}|[237-9]\\d{5}|[4-6]\\d{7})|7[14]\\d{7}|9(?:1\\d{6}|[04]\\d{7}|[35-9]\\d{5})","\\d{5,10}",,,"2212345"]
,[,,"8(?:22\\d{6}|[35-9]\\d{7})","\\d{9}",,,"850123456"]
,[,,"1800\\d{6}","\\d{10}",,,"1800123456"]
,[,,"15(?:1[2-8]|[2-8]0|9[089])\\d{6}","\\d{10}",,,"1520123456"]
,[,,"18[59]0\\d{6}","\\d{10}",,,"1850123456"]
,[,,"700\\d{6}","\\d{9}",,,"700123456"]
,[,,"76\\d{7}","\\d{9}",,,"761234567"]
,"IE",353,"00","0",,,"0",,,,[[,"(1)(\\d{3,4})(\\d{4})","$1 $2 $3",["1"]
,"(0$1)","",0]
,[,"(\\d{2})(\\d{5})","$1 $2",["2[24-9]|47|58|6[237-9]|9[35-9]"]
,"(0$1)","",0]
,[,"(\\d{3})(\\d{5})","$1 $2",["40[24]|50[45]"]
,"(0$1)","",0]
,[,"(48)(\\d{4})(\\d{4})","$1 $2 $3",["48"]
,"(0$1)","",0]
,[,"(818)(\\d{3})(\\d{3})","$1 $2 $3",["81"]
,"(0$1)","",0]
,[,"(\\d{2})(\\d{3})(\\d{3,4})","$1 $2 $3",["[24-69]|7[14]"]
,"(0$1)","",0]
,[,"([78]\\d)(\\d{3,4})(\\d{4})","$1 $2 $3",["76|8[35-9]"]
,"0$1","",0]
,[,"(700)(\\d{3})(\\d{3})","$1 $2 $3",["70"]
,"0$1","",0]
,[,"(\\d{4})(\\d{3})(\\d{3})","$1 $2 $3",["1(?:8[059]|5)","1(?:8[059]0|5)"]
,"$1","",0]
]
,,[,,"NA","NA"]
,,,[,,"18[59]0\\d{6}","\\d{10}",,,"1850123456"]
,[,,"818\\d{6}","\\d{9}",,,"818123456"]
,,,[,,"8[35-9]\\d{8}","\\d{10}",,,"8501234567"]
]
,"IL":[,[,,"[17]\\d{6,9}|[2-589]\\d{3}(?:\\d{3,6})?|6\\d{3}","\\d{4,10}"]
,[,,"[2-489]\\d{7}","\\d{7,8}",,,"21234567"]
,[,,"5(?:[02-47-9]\\d{2}|5(?:01|2[23]|3[34]|4[45]|5[5689]|6[67]|7[0178]|[89][6-9])|6[2-9]\\d)\\d{5}","\\d{9}",,,"501234567"]
,[,,"1(?:80[019]\\d{3}|255)\\d{3}","\\d{7,10}",,,"1800123456"]
,[,,"1(?:212|(?:9(?:0[01]|19)|200)\\d{2})\\d{4}","\\d{8,10}",,,"1919123456"]
,[,,"1700\\d{6}","\\d{10}",,,"1700123456"]
,[,,"NA","NA"]
,[,,"7(?:18\\d|2[23]\\d|3[237]\\d|47\\d|6(?:5\\d|8[0168])|7\\d{2}|8(?:2\\d|33|55|77|81)|99\\d)\\d{5}","\\d{9}",,,"771234567"]
,"IL",972,"0(?:0|1[2-9])","0",,,"0",,,,[[,"([2-489])(\\d{3})(\\d{4})","$1-$2-$3",["[2-489]"]
,"0$1","",0]
,[,"([57]\\d)(\\d{3})(\\d{4})","$1-$2-$3",["[57]"]
,"0$1","",0]
,[,"(1)([7-9]\\d{2})(\\d{3})(\\d{3})","$1-$2-$3-$4",["1[7-9]"]
,"$1","",0]
,[,"(1255)(\\d{3})","$1-$2",["125"]
,"$1","",0]
,[,"(1200)(\\d{3})(\\d{3})","$1-$2-$3",["120"]
,"$1","",0]
,[,"(1212)(\\d{2})(\\d{2})","$1-$2-$3",["121"]
,"$1","",0]
,[,"(1599)(\\d{6})","$1-$2",["15"]
,"$1","",0]
,[,"(\\d{4})","*$1",["[2-689]"]
,"$1","",0]
]
,,[,,"NA","NA"]
,,,[,,"1700\\d{6}|[2-689]\\d{3}","\\d{4,10}",,,"1700123456"]
,[,,"[2-689]\\d{3}|1599\\d{6}","\\d{4}(?:\\d{6})?",,,"1599123456"]
,,,[,,"NA","NA"]
]
,"IM":[,[,,"[135789]\\d{6,9}","\\d{6,10}"]
,[,,"1624\\d{6}","\\d{6,10}",,,"1624456789"]
,[,,"7[569]24\\d{6}","\\d{10}",,,"7924123456"]
,[,,"808162\\d{4}","\\d{10}",,,"8081624567"]
,[,,"(?:872299|90[0167]624)\\d{4}","\\d{10}",,,"9016247890"]
,[,,"8(?:4(?:40[49]06|5624\\d)|70624\\d)\\d{3}","\\d{10}",,,"8456247890"]
,[,,"70\\d{8}","\\d{10}",,,"7012345678"]
,[,,"56\\d{8}","\\d{10}",,,"5612345678"]
,"IM",44,"00","0"," x",,"0",,,,,,[,,"NA","NA"]
,,,[,,"NA","NA"]
,[,,"3(?:08162\\d|3\\d{5}|4(?:40[49]06|5624\\d)|7(?:0624\\d|2299\\d))\\d{3}|55\\d{8}","\\d{10}",,,"5512345678"]
,,,[,,"NA","NA"]
]
,"IN":[,[,,"1\\d{7,12}|[2-9]\\d{9,10}","\\d{6,13}"]
,[,,"(?:11|2[02]|33|4[04]|79)[2-7]\\d{7}|80[2-467]\\d{7}|(?:1(?:2[0-249]|3[0-25]|4[145]|[59][14]|6[014]|7[1257]|8[01346])|2(?:1[257]|3[013]|4[01]|5[0137]|6[0158]|78|8[1568]|9[14])|3(?:26|4[1-3]|5[34]|6[01489]|7[02-46]|8[159])|4(?:1[36]|2[1-47]|3[15]|5[12]|6[0-26-9]|7[0-24-9]|8[013-57]|9[014-7])|5(?:1[025]|[36][25]|22|4[28]|5[12]|[78]1|9[15])|6(?:12|[2345]1|57|6[13]|7[14]|80)|7(?:12|2[14]|3[134]|4[47]|5[15]|[67]1|88)|8(?:16|2[014]|3[126]|6[136]|7[078]|8[34]|91))[2-7]\\d{6}|(?:(?:1(?:2[35-8]|3[346-9]|4[236-9]|[59][0235-9]|6[235-9]|7[34689]|8[257-9])|2(?:1[134689]|3[24-8]|4[2-8]|5[25689]|6[2-4679]|7[13-79]|8[2-479]|9[235-9])|3(?:01|1[79]|2[1-5]|4[25-8]|5[125689]|6[235-7]|7[157-9]|8[2-467])|4(?:1[14578]|2[5689]|3[2-467]|5[4-7]|6[35]|73|8[2689]|9[2389])|5(?:[16][146-9]|2[14-8]|3[1346]|4[14-69]|5[46]|7[2-4]|8[2-8]|9[246])|6(?:1[1358]|2[2457]|3[2-4]|4[235-7]|[57][2-689]|6[24-578]|8[1-6])|8(?:1[1357-9]|2[235-8]|3[03-57-9]|4[0-24-9]|5\\d|6[2457-9]|7[1-6]|8[1256]|9[2-4]))\\d|7(?:(?:1[013-9]|2[0235-9]|3[2679]|4[1-35689]|5[2-46-9]|[67][02-9]|9\\d)\\d|8(?:2[0-6]|[013-8]\\d)))[2-7]\\d{5}","\\d{6,10}",,,"1123456789"]
,[,,"(?:7(?:0\\d{2}|2(?:[02379]\\d|[14][017-9]|5[047-9]|6[015-9]|8[0-59]|9[389])|3(?:[058]\\d|10|7[3679]|9[689])|4(?:0[1-9]|1[015-9]|[29][89]|39|8[389])|5(?:[034678]\\d|2[03-9]|5[017-9]|9[7-9])|6(?:0[0-47]|1[0-257-9]|2[0-4]|3[19]|5[4589]|[6-9]\\d)|7(?:0[2-9]|[1-79]\\d|8[1-9])|8[0-79]\\d)|8(?:0(?:[01589]\\d|6[67])|1(?:[02-57-9]\\d|1[0135-9])|2(?:[236-9]\\d|5[1-9])|3(?:[0357-9]\\d|4[1-9])|[45]\\d{2}|6[02457-9]\\d|7(?:07|[1-69]\\d)|8(?:[0-26-9]\\d|44|5[2-9])|9(?:[035-9]\\d|2[2-9]|4[0-8]))|9\\d{3})\\d{6}","\\d{10}",,,"9123456789"]
,[,,"1(?:600\\d{6}|80(?:0\\d{4,9}|3\\d{9}))","\\d{8,13}",,,"1800123456"]
,[,,"186[12]\\d{9}","\\d{13}",,,"1861123456789"]
,[,,"1860\\d{7}","\\d{11}",,,"18603451234"]
,[,,"NA","NA"]
,[,,"NA","NA"]
,"IN",91,"00","0",,,"0",,,,[[,"(\\d{5})(\\d{5})","$1 $2",["7(?:[0257]|3[0157-9]|4[0-389]|6[0-35-9]|8[0-79])|8(?:0[015689]|1[0-57-9]|2[2356-9]|3[0-57-9]|[45]|6[02457-9]|7[01-69]|8[0-24-9]|9[02-9])|9","7(?:0|2(?:[02379]|[14][017-9]|5[047-9]|6[015-9]|8[0-59]|9[389])|3(?:[058]|10|7[3679]|9[689])|4(?:0[1-9]|1[015-9]|[29][89]|39|8[389])|5(?:[034678]|2[03-9]|5[017-9]|9[7-9])|6(?:0[0-47]|1[0-257-9]|2[0-4]|3[19]|5[4589]|[6-9])|7(?:0[2-9]|[1-79]|8[1-9])|8[0-79])|8(?:0(?:[01589]|6[67])|1(?:[02-57-9]|1[0135-9])|2(?:[236-9]|5[1-9])|3(?:[0357-9]|4[1-9])|[45]|6[02457-9]|7(?:07|[1-69])|8(?:[0-26-9]|44|5[2-9])|9(?:[035-9]|2[2-9]|4[0-8]))|9"]
,"0$1","",1]
,[,"(\\d{2})(\\d{4})(\\d{4})","$1 $2 $3",["11|2[02]|33|4[04]|79|80[2-46]"]
,"0$1","",1]
,[,"(\\d{3})(\\d{3})(\\d{4})","$1 $2 $3",["1(?:2[0-249]|3[0-25]|4[145]|[569][14]|7[1257]|8[1346]|[68][1-9])|2(?:1[257]|3[013]|4[01]|5[0137]|6[0158]|78|8[1568]|9[14])|3(?:26|4[1-3]|5[34]|6[01489]|7[02-46]|8[159])|4(?:1[36]|2[1-47]|3[15]|5[12]|6[0-26-9]|7[0-24-9]|8[013-57]|9[014-7])|5(?:1[025]|[36][25]|22|4[28]|5[12]|[78]1|9[15])|6(?:12|[2345]1|57|6[13]|7[14]|80)"]
,"0$1","",1]
,[,"(\\d{3})(\\d{3})(\\d{4})","$1 $2 $3",["7(?:12|2[14]|3[134]|4[47]|5[15]|[67]1|88)","7(?:12|2[14]|3[134]|4[47]|5(?:1|5[2-6])|[67]1|88)"]
,"0$1","",1]
,[,"(\\d{3})(\\d{3})(\\d{4})","$1 $2 $3",["8(?:16|2[014]|3[126]|6[136]|7[078]|8[34]|91)"]
,"0$1","",1]
,[,"(\\d{4})(\\d{3})(\\d{3})","$1 $2 $3",["1(?:[23579]|[468][1-9])|[2-8]"]
,"0$1","",1]
,[,"(1600)(\\d{2})(\\d{4})","$1 $2 $3",["160","1600"]
,"$1","",1]
,[,"(1800)(\\d{4,5})","$1 $2",["180","1800"]
,"$1","",1]
,[,"(18[06]0)(\\d{2,4})(\\d{4})","$1 $2 $3",["18[06]","18[06]0"]
,"$1","",1]
,[,"(140)(\\d{3})(\\d{4})","$1 $2 $3",["140"]
,"$1","",1]
,[,"(\\d{4})(\\d{3})(\\d{3})(\\d{3})","$1 $2 $3 $4",["18[06]","18(?:0[03]|6[12])"]
,"$1","",1]
]
,,[,,"NA","NA"]
,,,[,,"1(?:600\\d{6}|8(?:0(?:0\\d{4,9}|3\\d{9})|6(?:0\\d{7}|[12]\\d{9})))","\\d{8,13}",,,"1800123456"]
,[,,"140\\d{7}","\\d{10}",,,"1409305260"]
,,,[,,"NA","NA"]
]
,"IO":[,[,,"3\\d{6}","\\d{7}"]
,[,,"37\\d{5}","\\d{7}",,,"3709100"]
,[,,"38\\d{5}","\\d{7}",,,"3801234"]
,[,,"NA","NA"]
,[,,"NA","NA"]
,[,,"NA","NA"]
,[,,"NA","NA"]
,[,,"NA","NA"]
,"IO",246,"00",,,,,,,,[[,"(\\d{3})(\\d{4})","$1 $2",,"","",0]
]
,,[,,"NA","NA"]
,,,[,,"NA","NA"]
,[,,"NA","NA"]
,,,[,,"NA","NA"]
]
,"IQ":[,[,,"[1-7]\\d{7,9}","\\d{6,10}"]
,[,,"1\\d{7}|(?:2[13-5]|3[02367]|4[023]|5[03]|6[026])\\d{6,7}","\\d{6,9}",,,"12345678"]
,[,,"7[3-9]\\d{8}","\\d{10}",,,"7912345678"]
,[,,"NA","NA"]
,[,,"NA","NA"]
,[,,"NA","NA"]
,[,,"NA","NA"]
,[,,"NA","NA"]
,"IQ",964,"00","0",,,"0",,,,[[,"(1)(\\d{3})(\\d{4})","$1 $2 $3",["1"]
,"0$1","",0]
,[,"([2-6]\\d)(\\d{3})(\\d{3,4})","$1 $2 $3",["[2-6]"]
,"0$1","",0]
,[,"(7\\d{2})(\\d{3})(\\d{4})","$1 $2 $3",["7"]
,"0$1","",0]
]
,,[,,"NA","NA"]
,,,[,,"NA","NA"]
,[,,"NA","NA"]
,,,[,,"NA","NA"]
]
,"IR":[,[,,"[1-8]\\d{9}|9(?:[0-4]\\d{8}|9\\d{2,8})","\\d{4,10}"]
,[,,"(?:1[137]|2[13-68]|3[1458]|4[145]|5[146-8]|6[146]|7[1467]|8[13467])\\d{8}","\\d{10}",,,"2123456789"]
,[,,"9(?:0[12]|[1-3]\\d)\\d{7}","\\d{10}",,,"9123456789"]
,[,,"NA","NA"]
,[,,"NA","NA"]
,[,,"NA","NA"]
,[,,"NA","NA"]
,[,,"(?:[2-6]0\\d|993)\\d{7}","\\d{10}",,,"9932123456"]
,"IR",98,"00","0",,,"0",,,,[[,"(21)(\\d{3,5})","$1 $2",["21"]
,"0$1","",0]
,[,"(\\d{2})(\\d{4})(\\d{4})","$1 $2 $3",["[1-8]"]
,"0$1","",0]
,[,"(\\d{3})(\\d{3})(\\d{3,4})","$1 $2 $3",["9"]
,"0$1","",0]
,[,"(\\d{3})(\\d{2})(\\d{2,3})","$1 $2 $3",["9"]
,"0$1","",0]
,[,"(\\d{3})(\\d{3})","$1 $2",["9"]
,"0$1","",0]
]
,,[,,"943\\d{7}","\\d{10}",,,"9432123456"]
,,,[,,"NA","NA"]
,[,,"9990\\d{0,6}","\\d{4,10}",,,"9990123456"]
,,,[,,"NA","NA"]
]
,"IS":[,[,,"[4-9]\\d{6}|38\\d{7}","\\d{7,9}"]
,[,,"(?:4(?:1[0-24-6]|2[0-7]|[37][0-8]|4[0-245]|5[0-3568]|6\\d|8[0-36-8])|5(?:05|[156]\\d|2[02578]|3[013-7]|4[03-7]|7[0-2578]|8[0-35-9]|9[013-689])|87[23])\\d{4}","\\d{7}",,,"4101234"]
,[,,"38[589]\\d{6}|(?:6(?:1[1-8]|3[089]|4[0167]|5[019]|[67][0-69]|9\\d)|7(?:5[057]|7\\d|8[0-36-8])|8(?:2[0-5]|3[0-4]|[469]\\d|5[1-9]))\\d{4}","\\d{7,9}",,,"6111234"]
,[,,"800\\d{4}","\\d{7}",,,"8001234"]
,[,,"90\\d{5}","\\d{7}",,,"9011234"]
,[,,"NA","NA"]
,[,,"NA","NA"]
,[,,"49\\d{5}","\\d{7}",,,"4921234"]
,"IS",354,"00",,,,,,,,[[,"(\\d{3})(\\d{4})","$1 $2",["[4-9]"]
,"","",0]
,[,"(3\\d{2})(\\d{3})(\\d{3})","$1 $2 $3",["3"]
,"","",0]
]
,,[,,"NA","NA"]
,,,[,,"NA","NA"]
,[,,"NA","NA"]
,,,[,,"(?:6(?:2[0-8]|49|8\\d)|87[0189]|95[48])\\d{4}","\\d{7}",,,"6201234"]
]
,"IT":[,[,,"[01589]\\d{5,10}|3(?:[12457-9]\\d{8}|[36]\\d{7,9})","\\d{6,11}"]
,[,,"0(?:[26]\\d{4,9}|(?:1(?:[0159]\\d|[27][1-5]|31|4[1-4]|6[1356]|8[2-57])|3(?:[0159]\\d|2[1-4]|3[12]|[48][1-6]|6[2-59]|7[1-7])|4(?:[0159]\\d|[23][1-9]|4[245]|6[1-5]|7[1-4]|81)|5(?:[0159]\\d|2[1-5]|3[2-6]|4[1-79]|6[4-6]|7[1-578]|8[3-8])|7(?:[0159]\\d|2[12]|3[1-7]|4[2346]|6[13569]|7[13-6]|8[1-59])|8(?:[0159]\\d|2[34578]|3[1-356]|[6-8][1-5])|9(?:[0159]\\d|[238][1-5]|4[12]|6[1-8]|7[1-6]))\\d{2,7})","\\d{6,11}",,,"0212345678"]
,[,,"3(?:[12457-9]\\d{8}|6\\d{7,8}|3\\d{7,9})","\\d{9,11}",,,"3123456789"]
,[,,"80(?:0\\d{6}|3\\d{3})","\\d{6,9}",,,"800123456"]
,[,,"0878\\d{5}|1(?:44|6[346])\\d{6}|89(?:2\\d{3}|4(?:[0-4]\\d{2}|[5-9]\\d{4})|5(?:[0-4]\\d{2}|[5-9]\\d{6})|9\\d{6})","\\d{6,10}",,,"899123456"]
,[,,"84(?:[08]\\d{6}|[17]\\d{3})","\\d{6,9}",,,"848123456"]
,[,,"1(?:78\\d|99)\\d{6}","\\d{9,10}",,,"1781234567"]
,[,,"55\\d{8}","\\d{10}",,,"5512345678"]
,"IT",39,"00",,,,,,,,[[,"(\\d{2})(\\d{3,4})(\\d{4})","$1 $2 $3",["0[26]|55"]
,"","",0]
,[,"(0[26])(\\d{4})(\\d{5})","$1 $2 $3",["0[26]"]
,"","",0]
,[,"(0[26])(\\d{4,6})","$1 $2",["0[26]"]
,"","",0]
,[,"(0\\d{2})(\\d{3,4})(\\d{4})","$1 $2 $3",["0[13-57-9][0159]"]
,"","",0]
,[,"(\\d{3})(\\d{3,6})","$1 $2",["0[13-57-9][0159]|8(?:03|4[17]|9[245])","0[13-57-9][0159]|8(?:03|4[17]|9(?:2|[45][0-4]))"]
,"","",0]
,[,"(0\\d{3})(\\d{3})(\\d{4})","$1 $2 $3",["0[13-57-9][2-46-8]"]
,"","",0]
,[,"(0\\d{3})(\\d{2,6})","$1 $2",["0[13-57-9][2-46-8]"]
,"","",0]
,[,"(\\d{3})(\\d{3})(\\d{3,4})","$1 $2 $3",["[13]|8(?:00|4[08]|9[59])","[13]|8(?:00|4[08]|9(?:5[5-9]|9))"]
,"","",0]
,[,"(\\d{4})(\\d{4})","$1 $2",["894","894[5-9]"]
,"","",0]
,[,"(\\d{3})(\\d{4})(\\d{4})","$1 $2 $3",["3"]
,"","",0]
]
,,[,,"NA","NA"]
,1,,[,,"848\\d{6}","\\d{9}",,,"848123456"]
,[,,"NA","NA"]
,1,,[,,"NA","NA"]
]
,"JE":[,[,,"[135789]\\d{6,9}","\\d{6,10}"]
,[,,"1534\\d{6}","\\d{6,10}",,,"1534456789"]
,[,,"7(?:509|7(?:00|97)|829|937)\\d{6}","\\d{10}",,,"7797123456"]
,[,,"80(?:07(?:35|81)|8901)\\d{4}","\\d{10}",,,"8007354567"]
,[,,"(?:871206|90(?:066[59]|1810|71(?:07|55)))\\d{4}","\\d{10}",,,"9018105678"]
,[,,"8(?:4(?:4(?:4(?:05|42|69)|703)|5(?:041|800))|70002)\\d{4}","\\d{10}",,,"8447034567"]
,[,,"701511\\d{4}","\\d{10}",,,"7015115678"]
,[,,"56\\d{8}","\\d{10}",,,"5612345678"]
,"JE",44,"00","0"," x",,"0",,,,,,[,,"76(?:0[012]|2[356]|4[0134]|5[49]|6[0-369]|77|81|9[39])\\d{6}","\\d{10}",,,"7640123456"]
,,,[,,"NA","NA"]
,[,,"3(?:0(?:07(?:35|81)|8901)|3\\d{4}|4(?:4(?:4(?:05|42|69)|703)|5(?:041|800))|7(?:0002|1206))\\d{4}|55\\d{8}","\\d{10}",,,"5512345678"]
,,,[,,"NA","NA"]
]
,"JM":[,[,,"[589]\\d{9}","\\d{7}(?:\\d{3})?"]
,[,,"876(?:5(?:0[12]|1[0-468]|2[35]|63)|6(?:0[1-3579]|1[027-9]|[23]\\d|40|5[06]|6[2-589]|7[05]|8[04]|9[4-9])|7(?:0[2-689]|[1-6]\\d|8[056]|9[45])|9(?:0[1-8]|1[02378]|[2-8]\\d|9[2-468]))\\d{4}","\\d{7}(?:\\d{3})?",,,"8765123456"]
,[,,"876(?:2[16-9]\\d|[348]\\d{2}|5(?:0[3-9]|27|6[0-24-9]|[3-578]\\d)|7(?:0[07]|7\\d|8[1-47-9]|9[0-36-9])|9(?:[01]9|9[0579]))\\d{4}","\\d{10}",,,"8762101234"]
,[,,"8(?:00|44|55|66|77|88)[2-9]\\d{6}","\\d{10}",,,"8002123456"]
,[,,"900[2-9]\\d{6}","\\d{10}",,,"9002123456"]
,[,,"NA","NA"]
,[,,"5(?:00|33|44|66|77)[2-9]\\d{6}","\\d{10}",,,"5002345678"]
,[,,"NA","NA"]
,"JM",1,"011","1",,,"1",,,,,,[,,"NA","NA"]
,,"876",[,,"NA","NA"]
,[,,"NA","NA"]
,,,[,,"NA","NA"]
]
,"JO":[,[,,"[235-9]\\d{7,8}","\\d{8,9}"]
,[,,"(?:2(?:6(?:2[0-35-9]|3[0-57-8]|4[24-7]|5[0-24-8]|[6-8][023]|9[0-3])|7(?:0[1-79]|10|2[014-7]|3[0-689]|4[019]|5[0-3578]))|32(?:0[1-69]|1[1-35-7]|2[024-7]|3\\d|4[0-3]|[57][023]|6[03])|53(?:0[0-3]|[13][023]|2[0-59]|49|5[0-35-9]|6[15]|7[45]|8[1-6]|9[0-36-9])|6(?:2[50]0|3(?:00|33)|4(?:0[0125]|1[2-7]|2[0569]|[38][07-9]|4[025689]|6[0-589]|7\\d|9[0-2])|5(?:[01][056]|2[034]|3[0-57-9]|4[17-8]|5[0-69]|6[0-35-9]|7[1-379]|8[0-68]|9[02-39]))|87(?:[02]0|7[08]|90))\\d{4}","\\d{8}",,,"62001234"]
,[,,"7(?:55|7[025-9]|8[015-9]|9[0-25-9])\\d{6}","\\d{9}",,,"790123456"]
,[,,"80\\d{6}","\\d{8}",,,"80012345"]
,[,,"900\\d{5}","\\d{8}",,,"90012345"]
,[,,"85\\d{6}","\\d{8}",,,"85012345"]
,[,,"70\\d{7}","\\d{9}",,,"700123456"]
,[,,"NA","NA"]
,"JO",962,"00","0",,,"0",,,,[[,"(\\d)(\\d{3})(\\d{4})","$1 $2 $3",["[2356]|87"]
,"(0$1)","",0]
,[,"(7)(\\d{4})(\\d{4})","$1 $2 $3",["7[457-9]"]
,"0$1","",0]
,[,"(\\d{3})(\\d{5,6})","$1 $2",["70|8[0158]|9"]
,"0$1","",0]
]
,,[,,"74(?:66|77)\\d{5}","\\d{9}",,,"746612345"]
,,,[,,"NA","NA"]
,[,,"8(?:10|8\\d)\\d{5}","\\d{8}",,,"88101234"]
,,,[,,"NA","NA"]
]
,"JP":[,[,,"[1-9]\\d{8,9}|00(?:[36]\\d{7,14}|7\\d{5,7}|8\\d{7})","\\d{8,17}"]
,[,,"(?:1(?:1[235-8]|2[3-6]|3[3-9]|4[2-6]|[58][2-8]|6[2-7]|7[2-9]|9[1-9])|2[2-9]\\d|[36][1-9]\\d|4(?:6[02-8]|[2-578]\\d|9[2-59])|5(?:6[1-9]|7[2-8]|[2-589]\\d)|7(?:3[4-9]|4[02-9]|[25-9]\\d)|8(?:3[2-9]|4[5-9]|5[1-9]|8[03-9]|[2679]\\d)|9(?:[679][1-9]|[2-58]\\d))\\d{6}","\\d{9}",,,"312345678"]
,[,,"[7-9]0[1-9]\\d{7}","\\d{10}",,,"9012345678"]
,[,,"120\\d{6}|800\\d{7}|00(?:37\\d{6,13}|66\\d{6,13}|777(?:[01]\\d{2}|5\\d{3}|8\\d{4})|882[1245]\\d{4})","\\d{8,17}",,,"120123456"]
,[,,"990\\d{6}","\\d{9}",,,"990123456"]
,[,,"NA","NA"]
,[,,"60\\d{7}","\\d{9}",,,"601234567"]
,[,,"50[1-9]\\d{7}","\\d{10}",,,"5012345678"]
,"JP",81,"010","0",,,"0",,,,[[,"(\\d{3})(\\d{3})(\\d{3})","$1-$2-$3",["(?:12|57|99)0"]
,"0$1","",0]
,[,"(\\d{3})(\\d{3})(\\d{4})","$1-$2-$3",["800"]
,"0$1","",0]
,[,"(\\d{4})(\\d{4})","$1-$2",["0077"]
,"$1","",0]
,[,"(\\d{4})(\\d{2})(\\d{3,4})","$1-$2-$3",["0077"]
,"$1","",0]
,[,"(\\d{4})(\\d{2})(\\d{4})","$1-$2-$3",["0088"]
,"$1","",0]
,[,"(\\d{4})(\\d{3})(\\d{3,4})","$1-$2-$3",["00(?:37|66)"]
,"$1","",0]
,[,"(\\d{4})(\\d{4})(\\d{4,5})","$1-$2-$3",["00(?:37|66)"]
,"$1","",0]
,[,"(\\d{4})(\\d{5})(\\d{5,6})","$1-$2-$3",["00(?:37|66)"]
,"$1","",0]
,[,"(\\d{4})(\\d{6})(\\d{6,7})","$1-$2-$3",["00(?:37|66)"]
,"$1","",0]
,[,"(\\d{2})(\\d{4})(\\d{4})","$1-$2-$3",["[2579]0|80[1-9]"]
,"0$1","",0]
,[,"(\\d{4})(\\d)(\\d{4})","$1-$2-$3",["1(?:26|3[79]|4[56]|5[4-68]|6[3-5])|5(?:76|97)|499|746|8(?:3[89]|63|47|51)|9(?:49|80|9[16])","1(?:267|3(?:7[247]|9[278])|4(?:5[67]|66)|5(?:47|58|64|8[67])|6(?:3[245]|48|5[4-68]))|5(?:76|97)9|499[2468]|7468|8(?:3(?:8[78]|96)|636|477|51[24])|9(?:496|802|9(?:1[23]|69))","1(?:267|3(?:7[247]|9[278])|4(?:5[67]|66)|5(?:47|58|64|8[67])|6(?:3[245]|48|5[4-68]))|5(?:769|979[2-69])|499[2468]|7468|8(?:3(?:8[78]|96[2457-9])|636[2-57-9]|477|51[24])|9(?:496|802|9(?:1[23]|69))"]
,"0$1","",0]
,[,"(\\d{3})(\\d{2})(\\d{4})","$1-$2-$3",["1(?:2[3-6]|3[3-9]|4[2-6]|5[2-8]|[68][2-7]|7[2-689]|9[1-578])|2(?:2[03-689]|3[3-58]|4[0-468]|5[04-8]|6[013-8]|7[06-9]|8[02-57-9]|9[13])|4(?:2[28]|3[689]|6[035-7]|7[05689]|80|9[3-5])|5(?:3[1-36-9]|4[4578]|5[013-8]|6[1-9]|7[2-8]|8[14-7]|9[4-9])|7(?:2[15]|3[5-9]|4[02-9]|6[135-8]|7[0-4689]|9[014-9])|8(?:2[49]|3[3-8]|4[5-8]|5[2-9]|6[35-9]|7[579]|8[03-579]|9[2-8])|9(?:[23]0|4[02-46-9]|5[024-79]|6[4-9]|7[2-47-9]|8[02-7]|9[3-7])","1(?:2[3-6]|3[3-9]|4[2-6]|5(?:[236-8]|[45][2-69])|[68][2-7]|7[2-689]|9[1-578])|2(?:2(?:[04-689]|3[23])|3[3-58]|4[0-468]|5(?:5[78]|7[2-4]|[0468][2-9])|6(?:[0135-8]|4[2-5])|7(?:[0679]|8[2-7])|8(?:[024578]|3[25-9]|9[6-9])|9(?:11|3[2-4]))|4(?:2(?:2[2-9]|8[237-9])|3[689]|6[035-7]|7(?:[059][2-8]|[68])|80|9[3-5])|5(?:3[1-36-9]|4[4578]|5[013-8]|6[1-9]|7[2-8]|8[14-7]|9(?:[89][2-8]|[4-7]))|7(?:2[15]|3[5-9]|4[02-9]|6[135-8]|7[0-4689]|9(?:[017-9]|4[6-8]|5[2-478]|6[2-589]))|8(?:2(?:4[4-8]|9[2-8])|3(?:7[2-6]|[3-6][2-9]|8[2-5])|4[5-8]|5[2-9]|6(?:[37]|5[4-7]|6[2-9]|8[2-8]|9[236-9])|7[579]|8[03-579]|9[2-8])|9(?:[23]0|4[02-46-9]|5[024-79]|6[4-9]|7[2-47-9]|8[02-7]|9(?:3[34]|[4-7]))","1(?:2[3-6]|3[3-9]|4[2-6]|5(?:[236-8]|[45][2-69])|[68][2-7]|7[2-689]|9[1-578])|2(?:2(?:[04-689]|3[23])|3[3-58]|4[0-468]|5(?:5[78]|7[2-4]|[0468][2-9])|6(?:[0135-8]|4[2-5])|7(?:[0679]|8[2-7])|8(?:[024578]|3[25-9]|9[6-9])|9(?:11|3[2-4]))|4(?:2(?:2[2-9]|8[237-9])|3[689]|6[035-7]|7(?:[059][2-8]|[68])|80|9[3-5])|5(?:3[1-36-9]|4[4578]|5[013-8]|6[1-9]|7[2-8]|8[14-7]|9(?:[89][2-8]|[4-7]))|7(?:2[15]|3[5-9]|4[02-9]|6[135-8]|7[0-4689]|9(?:[017-9]|4[6-8]|5[2-478]|6[2-589]))|8(?:2(?:4[4-8]|9(?:[3578]|20|4[04-9]|6[56]))|3(?:7(?:[2-5]|6[0-59])|[3-6][2-9]|8[2-5])|4[5-8]|5[2-9]|6(?:[37]|5(?:[467]|5[014-9])|6(?:[2-8]|9[02-69])|8[2-8]|9(?:[236-8]|9[23]))|7[579]|8[03-579]|9[2-8])|9(?:[23]0|4[02-46-9]|5[024-79]|6[4-9]|7[2-47-9]|8[02-7]|9(?:3(?:3[02-9]|4[0-24689])|4[2-69]|[5-7]))","1(?:2[3-6]|3[3-9]|4[2-6]|5(?:[236-8]|[45][2-69])|[68][2-7]|7[2-689]|9[1-578])|2(?:2(?:[04-689]|3[23])|3[3-58]|4[0-468]|5(?:5[78]|7[2-4]|[0468][2-9])|6(?:[0135-8]|4[2-5])|7(?:[0679]|8[2-7])|8(?:[024578]|3[25-9]|9[6-9])|9(?:11|3[2-4]))|4(?:2(?:2[2-9]|8[237-9])|3[689]|6[035-7]|7(?:[059][2-8]|[68])|80|9[3-5])|5(?:3[1-36-9]|4[4578]|5[013-8]|6[1-9]|7[2-8]|8[14-7]|9(?:[89][2-8]|[4-7]))|7(?:2[15]|3[5-9]|4[02-9]|6[135-8]|7[0-4689]|9(?:[017-9]|4[6-8]|5[2-478]|6[2-589]))|8(?:2(?:4[4-8]|9(?:[3578]|20|4[04-9]|6(?:5[25]|60)))|3(?:7(?:[2-5]|6[0-59])|[3-6][2-9]|8[2-5])|4[5-8]|5[2-9]|6(?:[37]|5(?:[467]|5[014-9])|6(?:[2-8]|9[02-69])|8[2-8]|9(?:[236-8]|9[23]))|7[579]|8[03-579]|9[2-8])|9(?:[23]0|4[02-46-9]|5[024-79]|6[4-9]|7[2-47-9]|8[02-7]|9(?:3(?:3[02-9]|4[0-24689])|4[2-69]|[5-7]))"]
,"0$1","",0]
,[,"(\\d{2})(\\d{3})(\\d{4})","$1-$2-$3",["1|2(?:2[37]|5[5-9]|64|78|8[39]|91)|4(?:2[2689]|64|7[347])|5(?:[2-589]|39)|60|8(?:[46-9]|3[279]|2[124589])|9(?:[235-8]|93)","1|2(?:2[37]|5(?:[57]|[68]0|9[19])|64|78|8[39]|917)|4(?:2(?:[68]|20|9[178])|64|7[347])|5(?:[2-589]|39[67])|60|8(?:[46-9]|3[279]|2[124589])|9(?:[235-8]|93[34])","1|2(?:2[37]|5(?:[57]|[68]0|9(?:17|99))|64|78|8[39]|917)|4(?:2(?:[68]|20|9[178])|64|7[347])|5(?:[2-589]|39[67])|60|8(?:[46-9]|3[279]|2[124589])|9(?:[235-8]|93(?:31|4))"]
,"0$1","",0]
,[,"(\\d{3})(\\d{2})(\\d{4})","$1-$2-$3",["2(?:9[14-79]|74|[34]7|[56]9)|82|993"]
,"0$1","",0]
,[,"(\\d)(\\d{4})(\\d{4})","$1-$2-$3",["3|4(?:2[09]|7[01])|6[1-9]"]
,"0$1","",0]
,[,"(\\d{2})(\\d{3})(\\d{4})","$1-$2-$3",["[2479][1-9]"]
,"0$1","",0]
]
,[[,"(\\d{3})(\\d{3})(\\d{3})","$1-$2-$3",["(?:12|57|99)0"]
,"0$1","",0]
,[,"(\\d{3})(\\d{3})(\\d{4})","$1-$2-$3",["800"]
,"0$1","",0]
,[,"(\\d{2})(\\d{4})(\\d{4})","$1-$2-$3",["[2579]0|80[1-9]"]
,"0$1","",0]
,[,"(\\d{4})(\\d)(\\d{4})","$1-$2-$3",["1(?:26|3[79]|4[56]|5[4-68]|6[3-5])|5(?:76|97)|499|746|8(?:3[89]|63|47|51)|9(?:49|80|9[16])","1(?:267|3(?:7[247]|9[278])|4(?:5[67]|66)|5(?:47|58|64|8[67])|6(?:3[245]|48|5[4-68]))|5(?:76|97)9|499[2468]|7468|8(?:3(?:8[78]|96)|636|477|51[24])|9(?:496|802|9(?:1[23]|69))","1(?:267|3(?:7[247]|9[278])|4(?:5[67]|66)|5(?:47|58|64|8[67])|6(?:3[245]|48|5[4-68]))|5(?:769|979[2-69])|499[2468]|7468|8(?:3(?:8[78]|96[2457-9])|636[2-57-9]|477|51[24])|9(?:496|802|9(?:1[23]|69))"]
,"0$1","",0]
,[,"(\\d{3})(\\d{2})(\\d{4})","$1-$2-$3",["1(?:2[3-6]|3[3-9]|4[2-6]|5[2-8]|[68][2-7]|7[2-689]|9[1-578])|2(?:2[03-689]|3[3-58]|4[0-468]|5[04-8]|6[013-8]|7[06-9]|8[02-57-9]|9[13])|4(?:2[28]|3[689]|6[035-7]|7[05689]|80|9[3-5])|5(?:3[1-36-9]|4[4578]|5[013-8]|6[1-9]|7[2-8]|8[14-7]|9[4-9])|7(?:2[15]|3[5-9]|4[02-9]|6[135-8]|7[0-4689]|9[014-9])|8(?:2[49]|3[3-8]|4[5-8]|5[2-9]|6[35-9]|7[579]|8[03-579]|9[2-8])|9(?:[23]0|4[02-46-9]|5[024-79]|6[4-9]|7[2-47-9]|8[02-7]|9[3-7])","1(?:2[3-6]|3[3-9]|4[2-6]|5(?:[236-8]|[45][2-69])|[68][2-7]|7[2-689]|9[1-578])|2(?:2(?:[04-689]|3[23])|3[3-58]|4[0-468]|5(?:5[78]|7[2-4]|[0468][2-9])|6(?:[0135-8]|4[2-5])|7(?:[0679]|8[2-7])|8(?:[024578]|3[25-9]|9[6-9])|9(?:11|3[2-4]))|4(?:2(?:2[2-9]|8[237-9])|3[689]|6[035-7]|7(?:[059][2-8]|[68])|80|9[3-5])|5(?:3[1-36-9]|4[4578]|5[013-8]|6[1-9]|7[2-8]|8[14-7]|9(?:[89][2-8]|[4-7]))|7(?:2[15]|3[5-9]|4[02-9]|6[135-8]|7[0-4689]|9(?:[017-9]|4[6-8]|5[2-478]|6[2-589]))|8(?:2(?:4[4-8]|9[2-8])|3(?:7[2-6]|[3-6][2-9]|8[2-5])|4[5-8]|5[2-9]|6(?:[37]|5[4-7]|6[2-9]|8[2-8]|9[236-9])|7[579]|8[03-579]|9[2-8])|9(?:[23]0|4[02-46-9]|5[024-79]|6[4-9]|7[2-47-9]|8[02-7]|9(?:3[34]|[4-7]))","1(?:2[3-6]|3[3-9]|4[2-6]|5(?:[236-8]|[45][2-69])|[68][2-7]|7[2-689]|9[1-578])|2(?:2(?:[04-689]|3[23])|3[3-58]|4[0-468]|5(?:5[78]|7[2-4]|[0468][2-9])|6(?:[0135-8]|4[2-5])|7(?:[0679]|8[2-7])|8(?:[024578]|3[25-9]|9[6-9])|9(?:11|3[2-4]))|4(?:2(?:2[2-9]|8[237-9])|3[689]|6[035-7]|7(?:[059][2-8]|[68])|80|9[3-5])|5(?:3[1-36-9]|4[4578]|5[013-8]|6[1-9]|7[2-8]|8[14-7]|9(?:[89][2-8]|[4-7]))|7(?:2[15]|3[5-9]|4[02-9]|6[135-8]|7[0-4689]|9(?:[017-9]|4[6-8]|5[2-478]|6[2-589]))|8(?:2(?:4[4-8]|9(?:[3578]|20|4[04-9]|6[56]))|3(?:7(?:[2-5]|6[0-59])|[3-6][2-9]|8[2-5])|4[5-8]|5[2-9]|6(?:[37]|5(?:[467]|5[014-9])|6(?:[2-8]|9[02-69])|8[2-8]|9(?:[236-8]|9[23]))|7[579]|8[03-579]|9[2-8])|9(?:[23]0|4[02-46-9]|5[024-79]|6[4-9]|7[2-47-9]|8[02-7]|9(?:3(?:3[02-9]|4[0-24689])|4[2-69]|[5-7]))","1(?:2[3-6]|3[3-9]|4[2-6]|5(?:[236-8]|[45][2-69])|[68][2-7]|7[2-689]|9[1-578])|2(?:2(?:[04-689]|3[23])|3[3-58]|4[0-468]|5(?:5[78]|7[2-4]|[0468][2-9])|6(?:[0135-8]|4[2-5])|7(?:[0679]|8[2-7])|8(?:[024578]|3[25-9]|9[6-9])|9(?:11|3[2-4]))|4(?:2(?:2[2-9]|8[237-9])|3[689]|6[035-7]|7(?:[059][2-8]|[68])|80|9[3-5])|5(?:3[1-36-9]|4[4578]|5[013-8]|6[1-9]|7[2-8]|8[14-7]|9(?:[89][2-8]|[4-7]))|7(?:2[15]|3[5-9]|4[02-9]|6[135-8]|7[0-4689]|9(?:[017-9]|4[6-8]|5[2-478]|6[2-589]))|8(?:2(?:4[4-8]|9(?:[3578]|20|4[04-9]|6(?:5[25]|60)))|3(?:7(?:[2-5]|6[0-59])|[3-6][2-9]|8[2-5])|4[5-8]|5[2-9]|6(?:[37]|5(?:[467]|5[014-9])|6(?:[2-8]|9[02-69])|8[2-8]|9(?:[236-8]|9[23]))|7[579]|8[03-579]|9[2-8])|9(?:[23]0|4[02-46-9]|5[024-79]|6[4-9]|7[2-47-9]|8[02-7]|9(?:3(?:3[02-9]|4[0-24689])|4[2-69]|[5-7]))"]
,"0$1","",0]
,[,"(\\d{2})(\\d{3})(\\d{4})","$1-$2-$3",["1|2(?:2[37]|5[5-9]|64|78|8[39]|91)|4(?:2[2689]|64|7[347])|5(?:[2-589]|39)|60|8(?:[46-9]|3[279]|2[124589])|9(?:[235-8]|93)","1|2(?:2[37]|5(?:[57]|[68]0|9[19])|64|78|8[39]|917)|4(?:2(?:[68]|20|9[178])|64|7[347])|5(?:[2-589]|39[67])|60|8(?:[46-9]|3[279]|2[124589])|9(?:[235-8]|93[34])","1|2(?:2[37]|5(?:[57]|[68]0|9(?:17|99))|64|78|8[39]|917)|4(?:2(?:[68]|20|9[178])|64|7[347])|5(?:[2-589]|39[67])|60|8(?:[46-9]|3[279]|2[124589])|9(?:[235-8]|93(?:31|4))"]
,"0$1","",0]
,[,"(\\d{3})(\\d{2})(\\d{4})","$1-$2-$3",["2(?:9[14-79]|74|[34]7|[56]9)|82|993"]
,"0$1","",0]
,[,"(\\d)(\\d{4})(\\d{4})","$1-$2-$3",["3|4(?:2[09]|7[01])|6[1-9]"]
,"0$1","",0]
,[,"(\\d{2})(\\d{3})(\\d{4})","$1-$2-$3",["[2479][1-9]"]
,"0$1","",0]
]
,[,,"20\\d{8}","\\d{10}",,,"2012345678"]
,,,[,,"00(?:37\\d{6,13}|66\\d{6,13}|777(?:[01]\\d{2}|5\\d{3}|8\\d{4})|882[1245]\\d{4})","\\d{8,17}",,,"00777012"]
,[,,"570\\d{6}","\\d{9}",,,"570123456"]
,1,,[,,"NA","NA"]
]
,"KE":[,[,,"20\\d{6,7}|[4-9]\\d{6,9}","\\d{7,10}"]
,[,,"20\\d{6,7}|4(?:[0136]\\d{7}|[245]\\d{5,7})|5(?:[08]\\d{7}|[1-79]\\d{5,7})|6(?:[01457-9]\\d{5,7}|[26]\\d{7})","\\d{7,9}",,,"202012345"]
,[,,"7(?:[0-36]\\d|5[0-6]|7[0-5]|8[0-25-9])\\d{6}","\\d{9}",,,"712123456"]
,[,,"800[24-8]\\d{5,6}","\\d{9,10}",,,"800223456"]
,[,,"900[02-9]\\d{5}","\\d{9}",,,"900223456"]
,[,,"NA","NA"]
,[,,"NA","NA"]
,[,,"NA","NA"]
,"KE",254,"000","0",,,"0",,,,[[,"(\\d{2})(\\d{5,7})","$1 $2",["[24-6]"]
,"0$1","",0]
,[,"(\\d{3})(\\d{6,7})","$1 $2",["7"]
,"0$1","",0]
,[,"(\\d{3})(\\d{3})(\\d{3,4})","$1 $2 $3",["[89]"]
,"0$1","",0]
]
,,[,,"NA","NA"]
,,,[,,"NA","NA"]
,[,,"NA","NA"]
,,,[,,"NA","NA"]
]
,"KG":[,[,,"[235-8]\\d{8,9}","\\d{5,10}"]
,[,,"(?:3(?:1(?:[256]\\d|3[1-9]|47)|2(?:22|3[0-479]|6[0-7])|4(?:22|5[6-9]|6\\d)|5(?:22|3[4-7]|59|6\\d)|6(?:22|5[35-7]|6\\d)|7(?:22|3[468]|4[1-9]|59|[67]\\d)|9(?:22|4[1-8]|6\\d))|6(?:09|12|2[2-4])\\d)\\d{5}","\\d{5,10}",,,"312123456"]
,[,,"(?:20[0-35]|5[124-7]\\d|7[07]\\d)\\d{6}","\\d{9}",,,"700123456"]
,[,,"800\\d{6,7}","\\d{9,10}",,,"800123456"]
,[,,"NA","NA"]
,[,,"NA","NA"]
,[,,"NA","NA"]
,[,,"NA","NA"]
,"KG",996,"00","0",,,"0",,,,[[,"(\\d{3})(\\d{3})(\\d{3})","$1 $2 $3",["[25-7]|31[25]"]
,"0$1","",0]
,[,"(\\d{4})(\\d{5})","$1 $2",["3(?:1[36]|[2-9])"]
,"0$1","",0]
,[,"(\\d{3})(\\d{3})(\\d)(\\d{3})","$1 $2 $3 $4",["8"]
,"0$1","",0]
]
,,[,,"NA","NA"]
,,,[,,"NA","NA"]
,[,,"NA","NA"]
,,,[,,"NA","NA"]
]
,"KH":[,[,,"[1-9]\\d{7,9}","\\d{6,10}"]
,[,,"(?:2[3-6]|3[2-6]|4[2-4]|[5-7][2-5])(?:[237-9]|4[56]|5\\d|6\\d?)\\d{5}|23(?:4[234]|8\\d{2})\\d{4}","\\d{6,9}",,,"23756789"]
,[,,"(?:1(?:[013-9]|2\\d?)|3[18]\\d|6[016-9]|7(?:[07-9]|[16]\\d)|8(?:[013-79]|8\\d)|9(?:6\\d|7\\d?|[0-589]))\\d{6}","\\d{8,9}",,,"91234567"]
,[,,"1800(?:1\\d|2[019])\\d{4}","\\d{10}",,,"1800123456"]
,[,,"1900(?:1\\d|2[09])\\d{4}","\\d{10}",,,"1900123456"]
,[,,"NA","NA"]
,[,,"NA","NA"]
,[,,"NA","NA"]
,"KH",855,"00[14-9]","0",,,"0",,,,[[,"(\\d{2})(\\d{3})(\\d{3,4})","$1 $2 $3",["1\\d[1-9]|[2-9]"]
,"0$1","",0]
,[,"(1[89]00)(\\d{3})(\\d{3})","$1 $2 $3",["1[89]0"]
,"","",0]
]
,,[,,"NA","NA"]
,,,[,,"NA","NA"]
,[,,"NA","NA"]
,,,[,,"NA","NA"]
]
,"KI":[,[,,"[2458]\\d{4}|3\\d{4,7}|7\\d{7}","\\d{5,8}"]
,[,,"(?:[24]\\d|3[1-9]|50|8[0-5])\\d{3}","\\d{5}",,,"31234"]
,[,,"7(?:[24]\\d|3[1-9]|8[0-5])\\d{5}","\\d{8}",,,"72012345"]
,[,,"NA","NA"]
,[,,"3001\\d{4}","\\d{5,8}",,,"30010000"]
,[,,"NA","NA"]
,[,,"NA","NA"]
,[,,"NA","NA"]
,"KI",686,"00",,,,"0",,,,,,[,,"NA","NA"]
,,,[,,"NA","NA"]
,[,,"NA","NA"]
,,,[,,"NA","NA"]
]
,"KM":[,[,,"[379]\\d{6}","\\d{7}"]
,[,,"7(?:6[0-37-9]|7[0-57-9])\\d{4}","\\d{7}",,,"7712345"]
,[,,"3[234]\\d{5}","\\d{7}",,,"3212345"]
,[,,"NA","NA"]
,[,,"(?:39[01]|9[01]0)\\d{4}","\\d{7}",,,"9001234"]
,[,,"NA","NA"]
,[,,"NA","NA"]
,[,,"NA","NA"]
,"KM",269,"00",,,,,,,,[[,"(\\d{3})(\\d{2})(\\d{2})","$1 $2 $3",,"","",0]
]
,,[,,"NA","NA"]
,,,[,,"NA","NA"]
,[,,"NA","NA"]
,,,[,,"NA","NA"]
]
,"KN":[,[,,"[589]\\d{9}","\\d{7}(?:\\d{3})?"]
,[,,"869(?:2(?:29|36)|302|4(?:6[015-9]|70))\\d{4}","\\d{7}(?:\\d{3})?",,,"8692361234"]
,[,,"869(?:5(?:5[6-8]|6[5-7])|66\\d|76[02-6])\\d{4}","\\d{10}",,,"8697652917"]
,[,,"8(?:00|44|55|66|77|88)[2-9]\\d{6}","\\d{10}",,,"8002123456"]
,[,,"900[2-9]\\d{6}","\\d{10}",,,"9002123456"]
,[,,"NA","NA"]
,[,,"5(?:00|33|44|66|77)[2-9]\\d{6}","\\d{10}",,,"5002345678"]
,[,,"NA","NA"]
,"KN",1,"011","1",,,"1",,,,,,[,,"NA","NA"]
,,"869",[,,"NA","NA"]
,[,,"NA","NA"]
,,,[,,"NA","NA"]
]
,"KP":[,[,,"1\\d{9}|[28]\\d{7}","\\d{6,8}|\\d{10}"]
,[,,"2\\d{7}|85\\d{6}","\\d{6,8}",,,"21234567"]
,[,,"19[123]\\d{7}","\\d{10}",,,"1921234567"]
,[,,"NA","NA"]
,[,,"NA","NA"]
,[,,"NA","NA"]
,[,,"NA","NA"]
,[,,"NA","NA"]
,"KP",850,"00|99","0",,,"0",,,,[[,"(\\d{3})(\\d{3})(\\d{4})","$1 $2 $3",["1"]
,"0$1","",0]
,[,"(\\d)(\\d{3})(\\d{4})","$1 $2 $3",["2"]
,"0$1","",0]
,[,"(\\d{2})(\\d{3})(\\d{3})","$1 $2 $3",["8"]
,"0$1","",0]
]
,,[,,"NA","NA"]
,,,[,,"2(?:[0-24-9]\\d{2}|3(?:[0-79]\\d|8[02-9]))\\d{4}","\\d{8}",,,"23821234"]
,[,,"NA","NA"]
,,,[,,"NA","NA"]
]
,"KR":[,[,,"[1-7]\\d{3,9}|8\\d{8}","\\d{4,10}"]
,[,,"(?:2|3[1-3]|[46][1-4]|5[1-5])(?:1\\d{2,3}|[1-9]\\d{6,7})","\\d{4,10}",,,"22123456"]
,[,,"1[0-26-9]\\d{7,8}","\\d{9,10}",,,"1000000000"]
,[,,"80\\d{7}","\\d{9}",,,"801234567"]
,[,,"60[2-9]\\d{6}","\\d{9}",,,"602345678"]
,[,,"NA","NA"]
,[,,"50\\d{8}","\\d{10}",,,"5012345678"]
,[,,"70\\d{8}","\\d{10}",,,"7012345678"]
,"KR",82,"00(?:[124-68]|[37]\\d{2})","0",,,"0(8[1-46-8]|85\\d{2})?",,,,[[,"(\\d{2})(\\d{4})(\\d{4})","$1-$2-$3",["1(?:0|1[19]|[69]9|5[458])|[57]0","1(?:0|1[19]|[69]9|5(?:44|59|8))|[57]0"]
,"0$1","0$CC-$1",0]
,[,"(\\d{2})(\\d{3,4})(\\d{4})","$1-$2-$3",["1(?:[169][2-8]|[78]|5[1-4])|[68]0|[3-6][1-9][1-9]","1(?:[169][2-8]|[78]|5(?:[1-3]|4[56]))|[68]0|[3-6][1-9][1-9]"]
,"0$1","0$CC-$1",0]
,[,"(\\d{3})(\\d)(\\d{4})","$1-$2-$3",["131","1312"]
,"0$1","0$CC-$1",0]
,[,"(\\d{3})(\\d{2})(\\d{4})","$1-$2-$3",["131","131[13-9]"]
,"0$1","0$CC-$1",0]
,[,"(\\d{3})(\\d{3})(\\d{4})","$1-$2-$3",["13[2-9]"]
,"0$1","0$CC-$1",0]
,[,"(\\d{2})(\\d{2})(\\d{3})(\\d{4})","$1-$2-$3-$4",["30"]
,"0$1","0$CC-$1",0]
,[,"(\\d)(\\d{3,4})(\\d{4})","$1-$2-$3",["2[1-9]"]
,"0$1","0$CC-$1",0]
,[,"(\\d)(\\d{3,4})","$1-$2",["21[0-46-9]"]
,"0$1","0$CC-$1",0]
,[,"(\\d{2})(\\d{3,4})","$1-$2",["[3-6][1-9]1","[3-6][1-9]1(?:[0-46-9])"]
,"0$1","0$CC-$1",0]
,[,"(\\d{4})(\\d{4})","$1-$2",["1(?:5[46-9]|6[04678]|8[0579])","1(?:5(?:44|66|77|88|99)|6(?:00|44|6[16]|70|88)|8(?:00|55|77|99))"]
,"$1","0$CC-$1",0]
]
,,[,,"15\\d{7,8}","\\d{9,10}",,,"1523456789"]
,,,[,,"NA","NA"]
,[,,"1(?:5(?:44|66|77|88|99)|6(?:00|44|6[16]|70|88)|8(?:00|55|77|99))\\d{4}","\\d{8}",,,"15441234"]
,,,[,,"NA","NA"]
]
,"KW":[,[,,"[12569]\\d{6,7}","\\d{7,8}"]
,[,,"(?:18\\d|2(?:[23]\\d{2}|4(?:[1-35-9]\\d|44)|5(?:0[034]|[2-46]\\d|5[1-3]|7[1-7])))\\d{4}","\\d{7,8}",,,"22345678"]
,[,,"(?:5(?:[05]\\d|1[0-7])|6(?:0[034679]|5[015-9]|6\\d|7[067]|9[0369])|9(?:0[09]|22|4[01479]|55|6[0679]|[79]\\d|8[057-9]))\\d{5}","\\d{8}",,,"50012345"]
,[,,"NA","NA"]
,[,,"NA","NA"]
,[,,"NA","NA"]
,[,,"NA","NA"]
,[,,"NA","NA"]
,"KW",965,"00",,,,,,,,[[,"(\\d{4})(\\d{3,4})","$1 $2",["[126]|9[04-9]"]
,"","",0]
,[,"(\\d{3})(\\d{5})","$1 $2",["5[015]|92"]
,"","",0]
]
,,[,,"NA","NA"]
,,,[,,"NA","NA"]
,[,,"NA","NA"]
,,,[,,"NA","NA"]
]
,"KY":[,[,,"[3589]\\d{9}","\\d{7}(?:\\d{3})?"]
,[,,"345(?:2(?:22|44)|444|6(?:23|38|40)|7(?:4[35-79]|6[6-9]|77)|8(?:00|1[45]|25|[48]8)|9(?:14|4[035-9]))\\d{4}","\\d{7}(?:\\d{3})?",,,"3452221234"]
,[,,"345(?:32[1-9]|5(?:1[67]|2[5-7]|4[6-8]|76)|9(?:1[67]|2[2-9]|3[689]))\\d{4}","\\d{10}",,,"3453231234"]
,[,,"8(?:00|44|55|66|77|88)[2-9]\\d{6}","\\d{10}",,,"8002345678"]
,[,,"900[2-9]\\d{6}|345976\\d{4}","\\d{10}",,,"9002345678"]
,[,,"NA","NA"]
,[,,"5(?:00|33|44|66|77)[2-9]\\d{6}","\\d{10}",,,"5002345678"]
,[,,"NA","NA"]
,"KY",1,"011","1",,,"1",,,,,,[,,"345849\\d{4}","\\d{10}",,,"3458491234"]
,,"345",[,,"NA","NA"]
,[,,"NA","NA"]
,,,[,,"NA","NA"]
]
,"KZ":[,[,,"(?:33\\d|7\\d{2}|80[09])\\d{7}","\\d{10}"]
,[,,"33622\\d{5}|7(?:1(?:0(?:[23]\\d|4[023]|59|63)|1(?:[23]\\d|4[0-79]|59)|2(?:[23]\\d|59)|3(?:2\\d|3[1-79]|4[0-35-9]|59)|4(?:2\\d|3[013-79]|4[0-8]|5[1-79])|5(?:2\\d|3[1-8]|4[1-7]|59)|6(?:[234]\\d|5[19]|61)|72\\d|8(?:[27]\\d|3[1-46-9]|4[0-5]))|2(?:1(?:[23]\\d|4[46-9]|5[3469])|2(?:2\\d|3[0679]|46|5[12679])|3(?:[234]\\d|5[139])|4(?:2\\d|3[1235-9]|59)|5(?:[23]\\d|4[01246-8]|59|61)|6(?:2\\d|3[1-9]|4[0-4]|59)|7(?:[237]\\d|40|5[279])|8(?:[23]\\d|4[0-3]|59)|9(?:2\\d|3[124578]|59)))\\d{5}","\\d{10}",,,"7123456789"]
,[,,"7(?:0[012578]|47|6[02-4]|7[15-8]|85)\\d{7}","\\d{10}",,,"7710009998"]
,[,,"800\\d{7}","\\d{10}",,,"8001234567"]
,[,,"809\\d{7}","\\d{10}",,,"8091234567"]
,[,,"NA","NA"]
,[,,"NA","NA"]
,[,,"751\\d{7}","\\d{10}",,,"7511234567"]
,"KZ",7,"810","8",,,"8",,"8~10",,,,[,,"NA","NA"]
,,,[,,"751\\d{7}","\\d{10}",,,"7511234567"]
,[,,"NA","NA"]
,,,[,,"NA","NA"]
]
,"LA":[,[,,"[2-8]\\d{7,9}","\\d{6,10}"]
,[,,"(?:2[13]|3(?:0\\d|[14])|[5-7][14]|41|8[1468])\\d{6}","\\d{6,9}",,,"21212862"]
,[,,"20(?:2[2389]|5[4-689]|7[6-8]|9[15-9])\\d{6}","\\d{10}",,,"2023123456"]
,[,,"NA","NA"]
,[,,"NA","NA"]
,[,,"NA","NA"]
,[,,"NA","NA"]
,[,,"NA","NA"]
,"LA",856,"00","0",,,"0",,,,[[,"(20)(\\d{2})(\\d{3})(\\d{3})","$1 $2 $3 $4",["20"]
,"0$1","",0]
,[,"([2-8]\\d)(\\d{3})(\\d{3})","$1 $2 $3",["2[13]|3[14]|[4-8]"]
,"0$1","",0]
,[,"(30)(\\d{2})(\\d{2})(\\d{3})","$1 $2 $3 $4",["30"]
,"0$1","",0]
]
,,[,,"NA","NA"]
,,,[,,"NA","NA"]
,[,,"NA","NA"]
,,,[,,"NA","NA"]
]
,"LB":[,[,,"[13-9]\\d{6,7}","\\d{7,8}"]
,[,,"(?:[14-6]\\d{2}|7(?:[2-57]\\d|62|8[0-7]|9[04-9])|8[02-9]\\d|9\\d{2})\\d{4}","\\d{7}",,,"1123456"]
,[,,"(?:3\\d|7(?:[01]\\d|6[013-9]|8[89]|9[1-3])|81\\d)\\d{5}","\\d{7,8}",,,"71123456"]
,[,,"NA","NA"]
,[,,"9[01]\\d{6}","\\d{8}",,,"90123456"]
,[,,"80\\d{6}","\\d{8}",,,"80123456"]
,[,,"NA","NA"]
,[,,"NA","NA"]
,"LB",961,"00","0",,,"0",,,,[[,"(\\d)(\\d{3})(\\d{3})","$1 $2 $3",["[13-6]|7(?:[2-57]|62|8[0-7]|9[04-9])|8[02-9]|9"]
,"0$1","",0]
,[,"([7-9]\\d)(\\d{3})(\\d{3})","$1 $2 $3",["[89][01]|7(?:[01]|6[013-9]|8[89]|9[1-3])"]
,"","",0]
]
,,[,,"NA","NA"]
,,,[,,"NA","NA"]
,[,,"NA","NA"]
,,,[,,"NA","NA"]
]
,"LC":[,[,,"[5789]\\d{9}","\\d{7}(?:\\d{3})?"]
,[,,"758(?:4(?:30|5[0-9]|6[2-9]|8[0-2])|57[0-2]|638)\\d{4}","\\d{7}(?:\\d{3})?",,,"7584305678"]
,[,,"758(?:28[4-7]|384|4(?:6[01]|8[4-9])|5(?:1[89]|20|84)|7(?:1[2-9]|2[0-8]))\\d{4}","\\d{10}",,,"7582845678"]
,[,,"8(?:00|44|55|66|77|88)[2-9]\\d{6}","\\d{10}",,,"8002123456"]
,[,,"900[2-9]\\d{6}","\\d{10}",,,"9002123456"]
,[,,"NA","NA"]
,[,,"5(?:00|33|44|66|77)[2-9]\\d{6}","\\d{10}",,,"5002345678"]
,[,,"NA","NA"]
,"LC",1,"011","1",,,"1",,,,,,[,,"NA","NA"]
,,"758",[,,"NA","NA"]
,[,,"NA","NA"]
,,,[,,"NA","NA"]
]
,"LI":[,[,,"6\\d{8}|[23789]\\d{6}","\\d{7,9}"]
,[,,"(?:2(?:01|1[27]|3\\d|6[02-578]|96)|3(?:7[0135-7]|8[048]|9[0269]))\\d{4}","\\d{7}",,,"2345678"]
,[,,"6(?:51[01]|6(?:0[0-6]|2[016-9]|39))\\d{5}|7(?:[37-9]\\d|42|56)\\d{4}","\\d{7,9}",,,"660234567"]
,[,,"80(?:02[28]|9\\d{2})\\d{2}","\\d{7}",,,"8002222"]
,[,,"90(?:02[258]|1(?:23|3[14])|66[136])\\d{2}","\\d{7}",,,"9002222"]
,[,,"NA","NA"]
,[,,"NA","NA"]
,[,,"NA","NA"]
,"LI",423,"00","0",,,"0",,,,[[,"(\\d{3})(\\d{2})(\\d{2})","$1 $2 $3",["[23789]"]
,"","",0]
,[,"(\\d{3})(\\d{3})(\\d{3})","$1 $2 $3",["6[56]"]
,"","",0]
,[,"(69)(7\\d{2})(\\d{4})","$1 $2 $3",["697"]
,"","",0]
]
,,[,,"NA","NA"]
,,,[,,"NA","NA"]
,[,,"870(?:28|87)\\d{2}","\\d{7}",,,"8702812"]
,,,[,,"697(?:42|56|[7-9]\\d)\\d{4}","\\d{9}",,,"697861234"]
]
,"LK":[,[,,"[1-9]\\d{8}","\\d{7,9}"]
,[,,"(?:[189]1|2[13-7]|3[1-8]|4[157]|5[12457]|6[35-7])[2-57]\\d{6}","\\d{7,9}",,,"112345678"]
,[,,"7[0125-8]\\d{7}","\\d{9}",,,"712345678"]
,[,,"NA","NA"]
,[,,"NA","NA"]
,[,,"NA","NA"]
,[,,"NA","NA"]
,[,,"NA","NA"]
,"LK",94,"00","0",,,"0",,,,[[,"(\\d{2})(\\d{1})(\\d{6})","$1 $2 $3",["[1-689]"]
,"0$1","",0]
,[,"(\\d{2})(\\d{3})(\\d{4})","$1 $2 $3",["7"]
,"0$1","",0]
]
,,[,,"NA","NA"]
,,,[,,"NA","NA"]
,[,,"NA","NA"]
,,,[,,"NA","NA"]
]
,"LR":[,[,,"2\\d{7}|[37-9]\\d{8}|[45]\\d{6}","\\d{7,9}"]
,[,,"2\\d{7}","\\d{8}",,,"21234567"]
,[,,"(?:330\\d|4[67]|5\\d|77\\d{2}|88\\d{2}|994\\d)\\d{5}","\\d{7,9}",,,"770123456"]
,[,,"NA","NA"]
,[,,"90[03]\\d{6}","\\d{9}",,,"900123456"]
,[,,"NA","NA"]
,[,,"NA","NA"]
,[,,"332(?:0[02]|5\\d)\\d{4}","\\d{9}",,,"332001234"]
,"LR",231,"00","0",,,"0",,,,[[,"(2\\d)(\\d{3})(\\d{3})","$1 $2 $3",["2"]
,"0$1","",0]
,[,"([79]\\d{2})(\\d{3})(\\d{3})","$1 $2 $3",["[79]"]
,"0$1","",0]
,[,"([4-6])(\\d{3})(\\d{3})","$1 $2 $3",["[4-6]"]
,"0$1","",0]
,[,"(\\d{2})(\\d{3})(\\d{4})","$1 $2 $3",["[38]"]
,"0$1","",0]
]
,,[,,"NA","NA"]
,,,[,,"NA","NA"]
,[,,"NA","NA"]
,,,[,,"NA","NA"]
]
,"LS":[,[,,"[2568]\\d{7}","\\d{8}"]
,[,,"2\\d{7}","\\d{8}",,,"22123456"]
,[,,"[56]\\d{7}","\\d{8}",,,"50123456"]
,[,,"800[256]\\d{4}","\\d{8}",,,"80021234"]
,[,,"NA","NA"]
,[,,"NA","NA"]
,[,,"NA","NA"]
,[,,"NA","NA"]
,"LS",266,"00",,,,,,,,[[,"(\\d{4})(\\d{4})","$1 $2",,"","",0]
]
,,[,,"NA","NA"]
,,,[,,"NA","NA"]
,[,,"NA","NA"]
,,,[,,"NA","NA"]
]
,"LT":[,[,,"[3-9]\\d{7}","\\d{8}"]
,[,,"(?:3[1478]|4[124-6]|52)\\d{6}","\\d{8}",,,"31234567"]
,[,,"6\\d{7}","\\d{8}",,,"61234567"]
,[,,"800\\d{5}","\\d{8}",,,"80012345"]
,[,,"9(?:0[0239]|10)\\d{5}","\\d{8}",,,"90012345"]
,[,,"808\\d{5}","\\d{8}",,,"80812345"]
,[,,"700\\d{5}","\\d{8}",,,"70012345"]
,[,,"NA","NA"]
,"LT",370,"00","8",,,"[08]",,,,[[,"([34]\\d)(\\d{6})","$1 $2",["37|4(?:1|5[45]|6[2-4])"]
,"(8-$1)","",1]
,[,"([3-6]\\d{2})(\\d{5})","$1 $2",["3[148]|4(?:[24]|6[09])|528|6"]
,"(8-$1)","",1]
,[,"([7-9]\\d{2})(\\d{2})(\\d{3})","$1 $2 $3",["[7-9]"]
,"8 $1","",1]
,[,"(5)(2\\d{2})(\\d{4})","$1 $2 $3",["52[0-79]"]
,"(8-$1)","",1]
]
,,[,,"NA","NA"]
,,,[,,"NA","NA"]
,[,,"70[67]\\d{5}","\\d{8}",,,"70712345"]
,,,[,,"NA","NA"]
]
,"LU":[,[,,"[24-9]\\d{3,10}|3(?:[0-46-9]\\d{2,9}|5[013-9]\\d{1,8})","\\d{4,11}"]
,[,,"(?:2[2-9]\\d{2,9}|(?:[3457]\\d{2}|8(?:0[2-9]|[13-9]\\d)|9(?:0[89]|[2-579]\\d))\\d{1,8})","\\d{4,11}",,,"27123456"]
,[,,"6[2679][18]\\d{6}","\\d{9}",,,"628123456"]
,[,,"800\\d{5}","\\d{8}",,,"80012345"]
,[,,"90[015]\\d{5}","\\d{8}",,,"90012345"]
,[,,"801\\d{5}","\\d{8}",,,"80112345"]
,[,,"70\\d{6}","\\d{8}",,,"70123456"]
,[,,"20(?:1\\d{5}|[2-689]\\d{1,7})","\\d{4,10}",,,"20201234"]
,"LU",352,"00",,,,"(15(?:0[06]|1[12]|35|4[04]|55|6[26]|77|88|99)\\d)",,,,[[,"(\\d{2})(\\d{3})","$1 $2",["[2-5]|7[1-9]|[89](?:[1-9]|0[2-9])"]
,"","$CC $1",0]
,[,"(\\d{2})(\\d{2})(\\d{2})","$1 $2 $3",["[2-5]|7[1-9]|[89](?:[1-9]|0[2-9])"]
,"","$CC $1",0]
,[,"(\\d{2})(\\d{2})(\\d{3})","$1 $2 $3",["20"]
,"","$CC $1",0]
,[,"(\\d{2})(\\d{2})(\\d{2})(\\d{1,2})","$1 $2 $3 $4",["2(?:[0367]|4[3-8])"]
,"","$CC $1",0]
,[,"(\\d{2})(\\d{2})(\\d{2})(\\d{3})","$1 $2 $3 $4",["20"]
,"","$CC $1",0]
,[,"(\\d{2})(\\d{2})(\\d{2})(\\d{2})(\\d{1,2})","$1 $2 $3 $4 $5",["2(?:[0367]|4[3-8])"]
,"","$CC $1",0]
,[,"(\\d{2})(\\d{2})(\\d{2})(\\d{1,4})","$1 $2 $3 $4",["2(?:[12589]|4[12])|[3-5]|7[1-9]|8(?:[1-9]|0[2-9])|9(?:[1-9]|0[2-46-9])"]
,"","$CC $1",0]
,[,"(\\d{3})(\\d{2})(\\d{3})","$1 $2 $3",["70|80[01]|90[015]"]
,"","$CC $1",0]
,[,"(\\d{3})(\\d{3})(\\d{3})","$1 $2 $3",["6"]
,"","$CC $1",0]
]
,,[,,"NA","NA"]
,,,[,,"NA","NA"]
,[,,"NA","NA"]
,,,[,,"NA","NA"]
]
,"LV":[,[,,"[2689]\\d{7}","\\d{8}"]
,[,,"6[3-8]\\d{6}","\\d{8}",,,"63123456"]
,[,,"2\\d{7}","\\d{8}",,,"21234567"]
,[,,"80\\d{6}","\\d{8}",,,"80123456"]
,[,,"90\\d{6}","\\d{8}",,,"90123456"]
,[,,"81\\d{6}","\\d{8}",,,"81123456"]
,[,,"NA","NA"]
,[,,"NA","NA"]
,"LV",371,"00",,,,,,,,[[,"([2689]\\d)(\\d{3})(\\d{3})","$1 $2 $3",,"","",0]
]
,,[,,"NA","NA"]
,,,[,,"NA","NA"]
,[,,"NA","NA"]
,,,[,,"NA","NA"]
]
,"LY":[,[,,"[25679]\\d{8}","\\d{7,9}"]
,[,,"(?:2[1345]|5[1347]|6[123479]|71)\\d{7}","\\d{7,9}",,,"212345678"]
,[,,"9[1-6]\\d{7}","\\d{9}",,,"912345678"]
,[,,"NA","NA"]
,[,,"NA","NA"]
,[,,"NA","NA"]
,[,,"NA","NA"]
,[,,"NA","NA"]
,"LY",218,"00","0",,,"0",,,,[[,"([25679]\\d)(\\d{7})","$1-$2",,"0$1","",0]
]
,,[,,"NA","NA"]
,,,[,,"NA","NA"]
,[,,"NA","NA"]
,,,[,,"NA","NA"]
]
,"MA":[,[,,"[5689]\\d{8}","\\d{9}"]
,[,,"5(?:2(?:(?:[015-7]\\d|2[2-9]|3[2-57]|4[2-8]|8[235-7])\\d|9(?:0\\d|[89]0))|3(?:(?:[0-4]\\d|[57][2-9]|6[235-8]|9[3-9])\\d|8(?:0\\d|[89]0)))\\d{4}","\\d{9}",,,"520123456"]
,[,,"6(?:0[0-8]|[12-79]\\d|8[017])\\d{6}","\\d{9}",,,"650123456"]
,[,,"80\\d{7}","\\d{9}",,,"801234567"]
,[,,"89\\d{7}","\\d{9}",,,"891234567"]
,[,,"NA","NA"]
,[,,"NA","NA"]
,[,,"NA","NA"]
,"MA",212,"00","0",,,"0",,,,[[,"([56]\\d{2})(\\d{6})","$1-$2",["5(?:2[015-7]|3[0-4])|6"]
,"0$1","",0]
,[,"([58]\\d{3})(\\d{5})","$1-$2",["5(?:2[2-489]|3[5-9])|892","5(?:2(?:[2-48]|90)|3(?:[5-79]|80))|892"]
,"0$1","",0]
,[,"(5\\d{4})(\\d{4})","$1-$2",["5(?:29|38)","5(?:29|38)[89]"]
,"0$1","",0]
,[,"(8[09])(\\d{7})","$1-$2",["8(?:0|9[013-9])"]
,"0$1","",0]
]
,,[,,"NA","NA"]
,1,,[,,"NA","NA"]
,[,,"NA","NA"]
,,,[,,"NA","NA"]
]
,"MC":[,[,,"[4689]\\d{7,8}","\\d{8,9}"]
,[,,"870\\d{5}|9[2-47-9]\\d{6}","\\d{8}",,,"99123456"]
,[,,"6\\d{8}|4(?:4\\d|5[2-9])\\d{5}","\\d{8,9}",,,"612345678"]
,[,,"90\\d{6}","\\d{8}",,,"90123456"]
,[,,"NA","NA"]
,[,,"NA","NA"]
,[,,"NA","NA"]
,[,,"NA","NA"]
,"MC",377,"00","0",,,"0",,,,[[,"(\\d{2})(\\d{2})(\\d{2})(\\d{2})","$1 $2 $3 $4",["9"]
,"$1","",0]
,[,"(\\d{2})(\\d{3})(\\d{3})","$1 $2 $3",["4"]
,"0$1","",0]
,[,"(6)(\\d{2})(\\d{2})(\\d{2})(\\d{2})","$1 $2 $3 $4 $5",["6"]
,"0$1","",0]
,[,"(\\d{3})(\\d{3})(\\d{2})","$1 $2 $3",["8"]
,"$1","",0]
]
,,[,,"NA","NA"]
,,,[,,"8\\d{7}","\\d{8}"]
,[,,"NA","NA"]
,,,[,,"NA","NA"]
]
,"MD":[,[,,"[235-9]\\d{7}","\\d{8}"]
,[,,"(?:2(?:1[0569]|2\\d|3[015-7]|4[1-46-9]|5[0-24689]|6[2-589]|7[1-37]|9[1347-9])|5(?:33|5[257]))\\d{5}","\\d{8}",,,"22212345"]
,[,,"(?:562\\d|6(?:[089]\\d{2}|1[01]\\d|21\\d|7(?:[1-6]\\d|7[0-4]))|7(?:6[07]|7[457-9]|[89]\\d)\\d)\\d{4}","\\d{8}",,,"62112345"]
,[,,"800\\d{5}","\\d{8}",,,"80012345"]
,[,,"90[056]\\d{5}","\\d{8}",,,"90012345"]
,[,,"808\\d{5}","\\d{8}",,,"80812345"]
,[,,"NA","NA"]
,[,,"3[08]\\d{6}","\\d{8}",,,"30123456"]
,"MD",373,"00","0",,,"0",,,,[[,"(\\d{2})(\\d{3})(\\d{3})","$1 $2 $3",["22|3"]
,"0$1","",0]
,[,"([25-7]\\d{2})(\\d{2})(\\d{3})","$1 $2 $3",["2[13-79]|[5-7]"]
,"0$1","",0]
,[,"([89]\\d{2})(\\d{5})","$1 $2",["[89]"]
,"0$1","",0]
]
,,[,,"NA","NA"]
,,,[,,"NA","NA"]
,[,,"8(?:03|14)\\d{5}","\\d{8}",,,"80312345"]
,,,[,,"NA","NA"]
]
,"ME":[,[,,"[2-9]\\d{7,8}","\\d{6,9}"]
,[,,"(?:20[2-8]|3(?:0[2-7]|[12][35-7]|3[4-7])|4(?:0[2367]|1[267])|5(?:0[467]|1[267]|2[367]))\\d{5}","\\d{6,8}",,,"30234567"]
,[,,"6(?:00\\d|32\\d|[89]\\d{2}|61\\d|7(?:[0-8]\\d|9(?:[3-9]|[0-2]\\d)))\\d{4}","\\d{8,9}",,,"67622901"]
,[,,"80\\d{6}","\\d{8}",,,"80080002"]
,[,,"(?:9(?:4[1568]|5[178]))\\d{5}","\\d{8}",,,"94515151"]
,[,,"NA","NA"]
,[,,"NA","NA"]
,[,,"78[1-9]\\d{5}","\\d{8}",,,"78108780"]
,"ME",382,"00","0",,,"0",,,,[[,"(\\d{2})(\\d{3})(\\d{3})","$1 $2 $3",["[2-57-9]|6[036-9]","[2-57-9]|6(?:[03689]|7(?:[0-8]|9[3-9]))"]
,"0$1","",0]
,[,"(67)(9)(\\d{3})(\\d{3})","$1 $2 $3 $4",["679","679[0-2]"]
,"0$1","",0]
]
,,[,,"NA","NA"]
,,,[,,"NA","NA"]
,[,,"77\\d{6}","\\d{8}",,,"77273012"]
,,,[,,"NA","NA"]
]
,"MF":[,[,,"[56]\\d{8}","\\d{9}"]
,[,,"590(?:[02][79]|13|5[0-268]|[78]7)\\d{4}","\\d{9}",,,"590271234"]
,[,,"690(?:0[0-7]|[1-9]\\d)\\d{4}","\\d{9}",,,"690301234"]
,[,,"NA","NA"]
,[,,"NA","NA"]
,[,,"NA","NA"]
,[,,"NA","NA"]
,[,,"NA","NA"]
,"MF",590,"00","0",,,"0",,,,,,[,,"NA","NA"]
,,,[,,"NA","NA"]
,[,,"NA","NA"]
,,,[,,"NA","NA"]
]
,"MG":[,[,,"[23]\\d{8}","\\d{7,9}"]
,[,,"20(?:2\\d{2}|4[47]\\d|5[3467]\\d|6[279]\\d|7(?:2[29]|[35]\\d)|8[268]\\d|9[245]\\d)\\d{4}","\\d{7,9}",,,"202123456"]
,[,,"3[2-49]\\d{7}","\\d{9}",,,"321234567"]
,[,,"NA","NA"]
,[,,"NA","NA"]
,[,,"NA","NA"]
,[,,"NA","NA"]
,[,,"22\\d{7}","\\d{9}",,,"221234567"]
,"MG",261,"00","0",,,"0",,,,[[,"([23]\\d)(\\d{2})(\\d{3})(\\d{2})","$1 $2 $3 $4",,"0$1","",0]
]
,,[,,"NA","NA"]
,,,[,,"NA","NA"]
,[,,"NA","NA"]
,,,[,,"NA","NA"]
]
,"MH":[,[,,"[2-6]\\d{6}","\\d{7}"]
,[,,"(?:247|528|625)\\d{4}","\\d{7}",,,"2471234"]
,[,,"(?:235|329|45[56]|545)\\d{4}","\\d{7}",,,"2351234"]
,[,,"NA","NA"]
,[,,"NA","NA"]
,[,,"NA","NA"]
,[,,"NA","NA"]
,[,,"635\\d{4}","\\d{7}",,,"6351234"]
,"MH",692,"011","1",,,"1",,,,[[,"(\\d{3})(\\d{4})","$1-$2",,"","",0]
]
,,[,,"NA","NA"]
,,,[,,"NA","NA"]
,[,,"NA","NA"]
,,,[,,"NA","NA"]
]
,"MK":[,[,,"[2-578]\\d{7}","\\d{8}"]
,[,,"(?:2(?:[23]\\d|5[124578]|6[01])|3(?:1[3-6]|[23][2-6]|4[2356])|4(?:[23][2-6]|4[3-6]|5[256]|6[25-8]|7[24-6]|8[4-6]))\\d{5}","\\d{6,8}",,,"22212345"]
,[,,"7(?:[0-25-8]\\d{2}|32\\d|421)\\d{4}","\\d{8}",,,"72345678"]
,[,,"800\\d{5}","\\d{8}",,,"80012345"]
,[,,"5[02-9]\\d{6}","\\d{8}",,,"50012345"]
,[,,"8(?:0[1-9]|[1-9]\\d)\\d{5}","\\d{8}",,,"80123456"]
,[,,"NA","NA"]
,[,,"NA","NA"]
,"MK",389,"00","0",,,"0",,,,[[,"(2)(\\d{3})(\\d{4})","$1 $2 $3",["2"]
,"0$1","",0]
,[,"([347]\\d)(\\d{3})(\\d{3})","$1 $2 $3",["[347]"]
,"0$1","",0]
,[,"([58]\\d{2})(\\d)(\\d{2})(\\d{2})","$1 $2 $3 $4",["[58]"]
,"0$1","",0]
]
,,[,,"NA","NA"]
,,,[,,"NA","NA"]
,[,,"NA","NA"]
,,,[,,"NA","NA"]
]
,"ML":[,[,,"[246-9]\\d{7}","\\d{8}"]
,[,,"(?:2(?:0(?:2[0-589]|7\\d)|1(?:2[5-7]|[3-689]\\d|7[2-4689]))|44[239]\\d)\\d{4}","\\d{8}",,,"20212345"]
,[,,"[67]\\d{7}|9[0-25-9]\\d{6}","\\d{8}",,,"65012345"]
,[,,"800\\d{5}","\\d{8}",,,"80012345"]
,[,,"NA","NA"]
,[,,"NA","NA"]
,[,,"NA","NA"]
,[,,"NA","NA"]
,"ML",223,"00",,,,,,,,[[,"(\\d{2})(\\d{2})(\\d{2})(\\d{2})","$1 $2 $3 $4",["[246-9]"]
,"","",0]
,[,"(\\d{4})","$1",["67|74"]
,"","",0]
]
,[[,"(\\d{2})(\\d{2})(\\d{2})(\\d{2})","$1 $2 $3 $4",["[246-9]"]
,"","",0]
]
,[,,"NA","NA"]
,,,[,,"NA","NA"]
,[,,"NA","NA"]
,,,[,,"NA","NA"]
]
,"MM":[,[,,"[14578]\\d{5,7}|[26]\\d{5,8}|9(?:2\\d{0,2}|[58]|3\\d|4\\d{1,2}|6\\d?|[79]\\d{0,2})\\d{6}","\\d{5,10}"]
,[,,"1(?:2\\d{1,2}|[3-5]\\d|6\\d?|[89][0-6]\\d)\\d{4}|2(?:[236-9]\\d{4}|4(?:0\\d{5}|\\d{4})|5(?:1\\d{3,6}|[02-9]\\d{3,5}))|4(?:2[245-8]|[346][2-6]|5[3-5])\\d{4}|5(?:2(?:20?|[3-8])|3[2-68]|4(?:21?|[4-8])|5[23]|6[2-4]|7[2-8]|8[24-7]|9[2-7])\\d{4}|6(?:0[23]|1[2356]|[24][2-6]|3[24-6]|5[2-4]|6[2-8]|7(?:[2367]|4\\d|5\\d?|8[145]\\d)|8[245]|9[24])\\d{4}|7(?:[04][24-8]|[15][2-7]|22|3[2-4])\\d{4}|8(?:1(?:2\\d?|[3-689])|2[2-8]|3[24]|4[24-7]|5[245]|6[23])\\d{4}","\\d{5,9}",,,"1234567"]
,[,,"17[01]\\d{4}|9(?:2(?:[0-4]|5\\d{2})|3[136]\\d|4(?:0[0-4]\\d|[1379]\\d|[24][0-589]\\d|5\\d{2}|88)|5[0-6]|61?\\d|7(?:3\\d|[89]\\d{2})|8\\d|9(?:1\\d|7\\d{2}|[089]))\\d{5}","\\d{7,10}",,,"92123456"]
,[,,"NA","NA"]
,[,,"NA","NA"]
,[,,"NA","NA"]
,[,,"NA","NA"]
,[,,"1333\\d{4}","\\d{8}",,,"13331234"]
,"MM",95,"00","0",,,"0",,,,[[,"(\\d)(\\d{3})(\\d{3,4})","$1 $2 $3",["1|2[45]"]
,"0$1","",0]
,[,"(2)(\\d{4})(\\d{4})","$1 $2 $3",["251"]
,"0$1","",0]
,[,"(\\d)(\\d{2})(\\d{3})","$1 $2 $3",["16|2"]
,"0$1","",0]
,[,"(\\d{2})(\\d{3})(\\d{3,4})","$1 $2 $3",["67|81"]
,"0$1","",0]
,[,"(\\d{2})(\\d{2})(\\d{3,4})","$1 $2 $3",["[4-8]"]
,"0$1","",0]
,[,"(9)(\\d{3})(\\d{4,6})","$1 $2 $3",["9(?:2[0-4]|[35-9]|4[13789])"]
,"0$1","",0]
,[,"(9)(4\\d{4})(\\d{4})","$1 $2 $3",["94[0245]"]
,"0$1","",0]
,[,"(9)(\\d{3})(\\d{3})(\\d{3})","$1 $2 $3 $4",["925"]
,"0$1","",0]
]
,,[,,"NA","NA"]
,,,[,,"NA","NA"]
,[,,"NA","NA"]
,,,[,,"NA","NA"]
]
,"MN":[,[,,"[12]\\d{7,9}|[57-9]\\d{7}","\\d{6,10}"]
,[,,"[12](?:1\\d|2(?:[1-3]\\d?|7\\d)|3[2-8]\\d{1,2}|4[2-68]\\d{1,2}|5[1-4689]\\d{1,2})\\d{5}|5[0568]\\d{6}","\\d{6,10}",,,"50123456"]
,[,,"(?:8[0689]|9[013-9])\\d{6}","\\d{8}",,,"88123456"]
,[,,"NA","NA"]
,[,,"NA","NA"]
,[,,"NA","NA"]
,[,,"NA","NA"]
,[,,"7[05-8]\\d{6}","\\d{8}",,,"75123456"]
,"MN",976,"001","0",,,"0",,,,[[,"([12]\\d)(\\d{2})(\\d{4})","$1 $2 $3",["[12]1"]
,"0$1","",0]
,[,"([12]2\\d)(\\d{5,6})","$1 $2",["[12]2[1-3]"]
,"0$1","",0]
,[,"([12]\\d{3})(\\d{5})","$1 $2",["[12](?:27|[3-5])","[12](?:27|[3-5]\\d)2"]
,"0$1","",0]
,[,"(\\d{4})(\\d{4})","$1 $2",["[57-9]"]
,"$1","",0]
,[,"([12]\\d{4})(\\d{4,5})","$1 $2",["[12](?:27|[3-5])","[12](?:27|[3-5]\\d)[4-9]"]
,"0$1","",0]
]
,,[,,"NA","NA"]
,,,[,,"NA","NA"]
,[,,"NA","NA"]
,,,[,,"NA","NA"]
]
,"MO":[,[,,"[268]\\d{7}","\\d{8}"]
,[,,"(?:28[2-57-9]|8[2-57-9]\\d)\\d{5}","\\d{8}",,,"28212345"]
,[,,"6[236]\\d{6}","\\d{8}",,,"66123456"]
,[,,"NA","NA"]
,[,,"NA","NA"]
,[,,"NA","NA"]
,[,,"NA","NA"]
,[,,"NA","NA"]
,"MO",853,"00",,,,,,,,[[,"([268]\\d{3})(\\d{4})","$1 $2",,"","",0]
]
,,[,,"NA","NA"]
,,,[,,"NA","NA"]
,[,,"NA","NA"]
,,,[,,"NA","NA"]
]
,"MP":[,[,,"[5689]\\d{9}","\\d{7}(?:\\d{3})?"]
,[,,"670(?:2(?:3[3-7]|56|8[5-8])|32[1238]|4(?:33|8[348])|5(?:32|55|88)|6(?:64|70|82)|78[589]|8[3-9]8|989)\\d{4}","\\d{7}(?:\\d{3})?",,,"6702345678"]
,[,,"670(?:2(?:3[3-7]|56|8[5-8])|32[1238]|4(?:33|8[348])|5(?:32|55|88)|6(?:64|70|82)|78[589]|8[3-9]8|989)\\d{4}","\\d{7}(?:\\d{3})?",,,"6702345678"]
,[,,"8(?:00|44|55|66|77|88)[2-9]\\d{6}","\\d{10}",,,"8002123456"]
,[,,"900[2-9]\\d{6}","\\d{10}",,,"9002123456"]
,[,,"NA","NA"]
,[,,"5(?:00|33|44|66|77)[2-9]\\d{6}","\\d{10}",,,"5002345678"]
,[,,"NA","NA"]
,"MP",1,"011","1",,,"1",,,1,,,[,,"NA","NA"]
,,"670",[,,"NA","NA"]
,[,,"NA","NA"]
,,,[,,"NA","NA"]
]
,"MQ":[,[,,"[56]\\d{8}","\\d{9}"]
,[,,"596(?:0[2-5]|[12]0|3[05-9]|4[024-8]|[5-7]\\d|89|9[4-8])\\d{4}","\\d{9}",,,"596301234"]
,[,,"696(?:[0-479]\\d|5[01]|8[0-689])\\d{4}","\\d{9}",,,"696201234"]
,[,,"NA","NA"]
,[,,"NA","NA"]
,[,,"NA","NA"]
,[,,"NA","NA"]
,[,,"NA","NA"]
,"MQ",596,"00","0",,,"0",,,,[[,"(\\d{3})(\\d{2})(\\d{2})(\\d{2})","$1 $2 $3 $4",,"0$1","",0]
]
,,[,,"NA","NA"]
,,,[,,"NA","NA"]
,[,,"NA","NA"]
,,,[,,"NA","NA"]
]
,"MR":[,[,,"[2-48]\\d{7}","\\d{8}"]
,[,,"25[08]\\d{5}|35\\d{6}|45[1-7]\\d{5}","\\d{8}",,,"35123456"]
,[,,"(?:2(?:2\\d|70)|3(?:3\\d|6[1-36]|7[1-3])|4(?:[49]\\d|6[0457-9]|7[4-9]|8[01346-8]))\\d{5}","\\d{8}",,,"22123456"]
,[,,"800\\d{5}","\\d{8}",,,"80012345"]
,[,,"NA","NA"]
,[,,"NA","NA"]
,[,,"NA","NA"]
,[,,"NA","NA"]
,"MR",222,"00",,,,,,,,[[,"([2-48]\\d)(\\d{2})(\\d{2})(\\d{2})","$1 $2 $3 $4",,"","",0]
]
,,[,,"NA","NA"]
,,,[,,"NA","NA"]
,[,,"NA","NA"]
,,,[,,"NA","NA"]
]
,"MS":[,[,,"[5689]\\d{9}","\\d{7}(?:\\d{3})?"]
,[,,"664491\\d{4}","\\d{7}(?:\\d{3})?",,,"6644912345"]
,[,,"66449[2-6]\\d{4}","\\d{10}",,,"6644923456"]
,[,,"8(?:00|44|55|66|77|88)[2-9]\\d{6}","\\d{10}",,,"8002123456"]
,[,,"900[2-9]\\d{6}","\\d{10}",,,"9002123456"]
,[,,"NA","NA"]
,[,,"5(?:00|33|44|66|77)[2-9]\\d{6}","\\d{10}",,,"5002345678"]
,[,,"NA","NA"]
,"MS",1,"011","1",,,"1",,,,,,[,,"NA","NA"]
,,"664",[,,"NA","NA"]
,[,,"NA","NA"]
,,,[,,"NA","NA"]
]
,"MT":[,[,,"[2357-9]\\d{7}","\\d{8}"]
,[,,"2(?:0(?:1[0-6]|3[1-4]|[69]\\d)|[1-357]\\d{2})\\d{4}","\\d{8}",,,"21001234"]
,[,,"(?:7(?:210|[79]\\d{2})|9(?:2(?:1[01]|31)|696|8(?:1[1-3]|89|97)|9\\d{2}))\\d{4}","\\d{8}",,,"96961234"]
,[,,"800[3467]\\d{4}","\\d{8}",,,"80071234"]
,[,,"5(?:0(?:0(?:37|43)|6\\d{2}|70\\d|9[0168])|[12]\\d0[1-5])\\d{3}","\\d{8}",,,"50037123"]
,[,,"NA","NA"]
,[,,"NA","NA"]
,[,,"3550\\d{4}","\\d{8}",,,"35501234"]
,"MT",356,"00",,,,,,,,[[,"(\\d{4})(\\d{4})","$1 $2",,"","",0]
]
,,[,,"7117\\d{4}","\\d{8}",,,"71171234"]
,,,[,,"NA","NA"]
,[,,"501\\d{5}","\\d{8}",,,"50112345"]
,,,[,,"NA","NA"]
]
,"MU":[,[,,"[2-9]\\d{6,7}","\\d{7,8}"]
,[,,"(?:2(?:[03478]\\d|1[0-7]|6[1-69])|4(?:[013568]\\d|2[4-7])|5(?:44\\d|471)|6\\d{2}|8(?:14|3[129]))\\d{4}","\\d{7,8}",,,"2012345"]
,[,,"5(?:2[59]\\d|4(?:2[1-389]|4\\d|7[1-9]|9\\d)|7\\d{2}|8(?:[0-2568]\\d|7[15-8])|9[0-8]\\d)\\d{4}","\\d{8}",,,"52512345"]
,[,,"80[012]\\d{4}","\\d{7}",,,"8001234"]
,[,,"30\\d{5}","\\d{7}",,,"3012345"]
,[,,"NA","NA"]
,[,,"NA","NA"]
,[,,"3(?:20|9\\d)\\d{4}","\\d{7}",,,"3201234"]
,"MU",230,"0(?:0|[2-7]0|33)",,,,,,"020",,[[,"([2-46-9]\\d{2})(\\d{4})","$1 $2",["[2-46-9]"]
,"","",0]
,[,"(5\\d{3})(\\d{4})","$1 $2",["5"]
,"","",0]
]
,,[,,"NA","NA"]
,,,[,,"NA","NA"]
,[,,"NA","NA"]
,,,[,,"NA","NA"]
]
,"MV":[,[,,"[3467]\\d{6}|9(?:00\\d{7}|\\d{6})","\\d{7,10}"]
,[,,"(?:3(?:0[01]|3[0-59])|6(?:[567][02468]|8[024689]|90))\\d{4}","\\d{7}",,,"6701234"]
,[,,"(?:46[46]|7[3-9]\\d|9[15-9]\\d)\\d{4}","\\d{7}",,,"7712345"]
,[,,"NA","NA"]
,[,,"900\\d{7}","\\d{10}",,,"9001234567"]
,[,,"NA","NA"]
,[,,"NA","NA"]
,[,,"NA","NA"]
,"MV",960,"0(?:0|19)",,,,,,"00",,[[,"(\\d{3})(\\d{4})","$1-$2",["[3467]|9(?:[1-9]|0[1-9])"]
,"","",0]
,[,"(\\d{3})(\\d{3})(\\d{4})","$1 $2 $3",["900"]
,"","",0]
]
,,[,,"781\\d{4}","\\d{7}",,,"7812345"]
,,,[,,"NA","NA"]
,[,,"NA","NA"]
,,,[,,"NA","NA"]
]
,"MW":[,[,,"(?:1(?:\\d{2})?|[2789]\\d{2})\\d{6}","\\d{7,9}"]
,[,,"(?:1[2-9]|21\\d{2})\\d{5}","\\d{7,9}",,,"1234567"]
,[,,"(?:111|77\\d|88\\d|99\\d)\\d{6}","\\d{9}",,,"991234567"]
,[,,"NA","NA"]
,[,,"NA","NA"]
,[,,"NA","NA"]
,[,,"NA","NA"]
,[,,"NA","NA"]
,"MW",265,"00","0",,,"0",,,,[[,"(\\d)(\\d{3})(\\d{3})","$1 $2 $3",["1"]
,"0$1","",0]
,[,"(2\\d{2})(\\d{3})(\\d{3})","$1 $2 $3",["2"]
,"0$1","",0]
,[,"(\\d{3})(\\d{2})(\\d{2})(\\d{2})","$1 $2 $3 $4",["[1789]"]
,"0$1","",0]
]
,,[,,"NA","NA"]
,,,[,,"NA","NA"]
,[,,"NA","NA"]
,,,[,,"NA","NA"]
]
,"MX":[,[,,"[1-9]\\d{9,10}","\\d{7,11}"]
,[,,"(?:33|55|81)\\d{8}|(?:2(?:0[01]|2[2-9]|3[1-35-8]|4[13-9]|7[1-689]|8[1-578]|9[467])|3(?:1[1-79]|[2458][1-9]|7[1-8]|9[1-5])|4(?:1[1-57-9]|[24-6][1-9]|[37][1-8]|8[1-35-9]|9[2-689])|5(?:88|9[1-79])|6(?:1[2-68]|[234][1-9]|5[1-3689]|6[12457-9]|7[1-7]|8[67]|9[4-8])|7(?:[13467][1-9]|2[1-8]|5[13-9]|8[1-69]|9[17])|8(?:2[13-689]|3[1-6]|4[124-6]|6[1246-9]|7[1-378]|9[12479])|9(?:1[346-9]|2[1-4]|3[2-46-8]|5[1348]|[69][1-9]|7[12]|8[1-8]))\\d{7}","\\d{7,10}",,,"2221234567"]
,[,,"1(?:(?:33|55|81)\\d{8}|(?:2(?:2[2-9]|3[1-35-8]|4[13-9]|7[1-689]|8[1-578]|9[467])|3(?:1[1-79]|[2458][1-9]|7[1-8]|9[1-5])|4(?:1[1-57-9]|[24-6][1-9]|[37][1-8]|8[1-35-9]|9[2-689])|5(?:88|9[1-79])|6(?:1[2-68]|[2-4][1-9]|5[1-3689]|6[12457-9]|7[1-7]|8[67]|9[4-8])|7(?:[13467][1-9]|2[1-8]|5[13-9]|8[1-69]|9[17])|8(?:2[13-689]|3[1-6]|4[124-6]|6[1246-9]|7[1-378]|9[12479])|9(?:1[346-9]|2[1-4]|3[2-46-8]|5[1348]|[69][1-9]|7[12]|8[1-8]))\\d{7})","\\d{11}",,,"12221234567"]
,[,,"8(?:00|88)\\d{7}","\\d{10}",,,"8001234567"]
,[,,"900\\d{7}","\\d{10}",,,"9001234567"]
,[,,"300\\d{7}","\\d{10}",,,"3001234567"]
,[,,"500\\d{7}","\\d{10}",,,"5001234567"]
,[,,"NA","NA"]
,"MX",52,"0[09]","01",,,"0[12]|04[45](\\d{10})","1$1",,,[[,"([358]\\d)(\\d{4})(\\d{4})","$1 $2 $3",["33|55|81"]
,"01 $1","",1]
,[,"(\\d{3})(\\d{3})(\\d{4})","$1 $2 $3",["[2467]|3[0-2457-9]|5[089]|8[02-9]|9[0-35-9]"]
,"01 $1","",1]
,[,"(1)([358]\\d)(\\d{4})(\\d{4})","044 $2 $3 $4",["1(?:33|55|81)"]
,"$1","",1]
,[,"(1)(\\d{3})(\\d{3})(\\d{4})","044 $2 $3 $4",["1(?:[2467]|3[0-2457-9]|5[089]|8[2-9]|9[1-35-9])"]
,"$1","",1]
]
,[[,"([358]\\d)(\\d{4})(\\d{4})","$1 $2 $3",["33|55|81"]
,"01 $1","",1]
,[,"(\\d{3})(\\d{3})(\\d{4})","$1 $2 $3",["[2467]|3[0-2457-9]|5[089]|8[02-9]|9[0-35-9]"]
,"01 $1","",1]
,[,"(1)([358]\\d)(\\d{4})(\\d{4})","$1 $2 $3 $4",["1(?:33|55|81)"]
]
,[,"(1)(\\d{3})(\\d{3})(\\d{4})","$1 $2 $3 $4",["1(?:[2467]|3[0-2457-9]|5[089]|8[2-9]|9[1-35-9])"]
]
]
,[,,"NA","NA"]
,,,[,,"NA","NA"]
,[,,"NA","NA"]
,1,,[,,"NA","NA"]
]
,"MY":[,[,,"[13-9]\\d{7,9}","\\d{6,10}"]
,[,,"(?:3[2-9]\\d|[4-9][2-9])\\d{6}","\\d{6,9}",,,"323456789"]
,[,,"1(?:1[1-5]\\d{2}|[02-4679][2-9]\\d|59\\d{2}|8(?:1[23]|[2-9]\\d))\\d{5}","\\d{9,10}",,,"123456789"]
,[,,"1[378]00\\d{6}","\\d{10}",,,"1300123456"]
,[,,"1600\\d{6}","\\d{10}",,,"1600123456"]
,[,,"NA","NA"]
,[,,"NA","NA"]
,[,,"154\\d{7}","\\d{10}",,,"1541234567"]
,"MY",60,"00","0",,,"0",,,,[[,"([4-79])(\\d{3})(\\d{4})","$1-$2 $3",["[4-79]"]
,"0$1","",0]
,[,"(3)(\\d{4})(\\d{4})","$1-$2 $3",["3"]
,"0$1","",0]
,[,"([18]\\d)(\\d{3})(\\d{3,4})","$1-$2 $3",["1[02-46-9][1-9]|8"]
,"0$1","",0]
,[,"(1)([36-8]00)(\\d{2})(\\d{4})","$1-$2-$3-$4",["1[36-8]0"]
,"","",0]
,[,"(11)(\\d{4})(\\d{4})","$1-$2 $3",["11"]
,"0$1","",0]
,[,"(15[49])(\\d{3})(\\d{4})","$1-$2 $3",["15"]
,"0$1","",0]
]
,,[,,"NA","NA"]
,,,[,,"NA","NA"]
,[,,"NA","NA"]
,,,[,,"NA","NA"]
]
,"MZ":[,[,,"[28]\\d{7,8}","\\d{8,9}"]
,[,,"2(?:[1346]\\d|5[0-2]|[78][12]|93)\\d{5}","\\d{8}",,,"21123456"]
,[,,"8[23467]\\d{7}","\\d{9}",,,"821234567"]
,[,,"800\\d{6}","\\d{9}",,,"800123456"]
,[,,"NA","NA"]
,[,,"NA","NA"]
,[,,"NA","NA"]
,[,,"NA","NA"]
,"MZ",258,"00",,,,,,,,[[,"([28]\\d)(\\d{3})(\\d{3,4})","$1 $2 $3",["2|8[2-7]"]
,"","",0]
,[,"(80\\d)(\\d{3})(\\d{3})","$1 $2 $3",["80"]
,"","",0]
]
,,[,,"NA","NA"]
,,,[,,"NA","NA"]
,[,,"NA","NA"]
,,,[,,"NA","NA"]
]
,"NA":[,[,,"[68]\\d{7,8}","\\d{8,9}"]
,[,,"6(?:1(?:17|2(?:[0189]\\d|[2-6]|7\\d?)|3(?:[01378]|2\\d)|4[01]|69|7[014])|2(?:17|5(?:[0-36-8]|4\\d?)|69|70)|3(?:17|2(?:[0237]\\d?|[14-689])|34|6[29]|7[01]|81)|4(?:17|2(?:[012]|7?)|4(?:[06]|1\\d)|5(?:[01357]|[25]\\d?)|69|7[01])|5(?:17|2(?:[0459]|[23678]\\d?)|69|7[01])|6(?:17|2(?:5|6\\d?)|38|42|69|7[01])|7(?:17|2(?:[569]|[234]\\d?)|3(?:0\\d?|[13])|69|7[01]))\\d{4}","\\d{8,9}",,,"61221234"]
,[,,"(?:60|8[125])\\d{7}","\\d{9}",,,"811234567"]
,[,,"NA","NA"]
,[,,"8701\\d{5}","\\d{9}",,,"870123456"]
,[,,"NA","NA"]
,[,,"NA","NA"]
,[,,"8(?:3\\d{2}|86)\\d{5}","\\d{8,9}",,,"88612345"]
,"NA",264,"00","0",,,"0",,,,[[,"(8\\d)(\\d{3})(\\d{4})","$1 $2 $3",["8[1235]"]
,"0$1","",0]
,[,"(6\\d)(\\d{2,3})(\\d{4})","$1 $2 $3",["6"]
,"0$1","",0]
,[,"(88)(\\d{3})(\\d{3})","$1 $2 $3",["88"]
,"0$1","",0]
,[,"(870)(\\d{3})(\\d{3})","$1 $2 $3",["870"]
,"0$1","",0]
]
,,[,,"NA","NA"]
,,,[,,"NA","NA"]
,[,,"NA","NA"]
,,,[,,"NA","NA"]
]
,"NC":[,[,,"[2-57-9]\\d{5}","\\d{6}"]
,[,,"(?:2[03-9]|3[0-5]|4[1-7]|88)\\d{4}","\\d{6}",,,"201234"]
,[,,"(?:5[0-4]|[79]\\d|8[0-79])\\d{4}","\\d{6}",,,"751234"]
,[,,"NA","NA"]
,[,,"36\\d{4}","\\d{6}",,,"366711"]
,[,,"NA","NA"]
,[,,"NA","NA"]
,[,,"NA","NA"]
,"NC",687,"00",,,,,,,,[[,"(\\d{2})(\\d{2})(\\d{2})","$1.$2.$3",["[2-46-9]|5[0-4]"]
,"","",0]
]
,,[,,"NA","NA"]
,,,[,,"NA","NA"]
,[,,"NA","NA"]
,,,[,,"NA","NA"]
]
,"NE":[,[,,"[0289]\\d{7}","\\d{8}"]
,[,,"2(?:0(?:20|3[1-7]|4[134]|5[14]|6[14578]|7[1-578])|1(?:4[145]|5[14]|6[14-68]|7[169]|88))\\d{4}","\\d{8}",,,"20201234"]
,[,,"(?:8[89]|9\\d)\\d{6}","\\d{8}",,,"93123456"]
,[,,"08\\d{6}","\\d{8}",,,"08123456"]
,[,,"09\\d{6}","\\d{8}",,,"09123456"]
,[,,"NA","NA"]
,[,,"NA","NA"]
,[,,"NA","NA"]
,"NE",227,"00",,,,,,,,[[,"(\\d{2})(\\d{2})(\\d{2})(\\d{2})","$1 $2 $3 $4",["[289]|09"]
,"","",0]
,[,"(08)(\\d{3})(\\d{3})","$1 $2 $3",["08"]
,"","",0]
]
,,[,,"NA","NA"]
,,,[,,"NA","NA"]
,[,,"NA","NA"]
,1,,[,,"NA","NA"]
]
,"NF":[,[,,"[13]\\d{5}","\\d{5,6}"]
,[,,"(?:1(?:06|17|28|39)|3[012]\\d)\\d{3}","\\d{5,6}",,,"106609"]
,[,,"3[58]\\d{4}","\\d{5,6}",,,"381234"]
,[,,"NA","NA"]
,[,,"NA","NA"]
,[,,"NA","NA"]
,[,,"NA","NA"]
,[,,"NA","NA"]
,"NF",672,"00",,,,,,,,[[,"(\\d{2})(\\d{4})","$1 $2",["1"]
,"","",0]
,[,"(\\d)(\\d{5})","$1 $2",["3"]
,"","",0]
]
,,[,,"NA","NA"]
,,,[,,"NA","NA"]
,[,,"NA","NA"]
,,,[,,"NA","NA"]
]
,"NG":[,[,,"[1-6]\\d{5,8}|9\\d{5,9}|[78]\\d{5,13}","\\d{5,14}"]
,[,,"[12]\\d{6,7}|9(?:0[3-9]|[1-9]\\d)\\d{5}|(?:3\\d|4[023568]|5[02368]|6[02-469]|7[4-69]|8[2-9])\\d{6}|(?:4[47]|5[14579]|6[1578]|7[0-357])\\d{5,6}|(?:78|41)\\d{5}","\\d{5,9}",,,"12345678"]
,[,,"(?:1(?:7[34]\\d|8(?:04|[124579]\\d|8[0-3])|95\\d)|287[0-7]|3(?:18[1-8]|88[0-7]|9(?:8[5-9]|6[1-5]))|4(?:28[0-2]|6(?:7[1-9]|8[02-47])|88[0-2])|5(?:2(?:7[7-9]|8\\d)|38[1-79]|48[0-7]|68[4-7])|6(?:2(?:7[7-9]|8\\d)|4(?:3[7-9]|[68][129]|7[04-69]|9[1-8])|58[0-2]|98[7-9])|7(?:38[0-7]|69[1-8]|78[2-4])|8(?:28[3-9]|38[0-2]|4(?:2[12]|3[147-9]|5[346]|7[4-9]|8[014-689]|90)|58[1-8]|78[2-9]|88[5-7])|98[07]\\d)\\d{4}|(?:70(?:[13-9]\\d|2[1-9])|8(?:0[2-9]|1\\d)\\d|90[2359]\\d)\\d{6}","\\d{8,10}",,,"8021234567"]
,[,,"800\\d{7,11}","\\d{10,14}",,,"80017591759"]
,[,,"NA","NA"]
,[,,"NA","NA"]
,[,,"NA","NA"]
,[,,"NA","NA"]
,"NG",234,"009","0",,,"0",,,,[[,"([129])(\\d{3})(\\d{3,4})","$1 $2 $3",["[129]"]
,"0$1","",0]
,[,"(\\d{2})(\\d{3})(\\d{2,3})","$1 $2 $3",["[3-6]|7(?:[1-79]|0[1-9])|8[2-9]"]
,"0$1","",0]
,[,"(\\d{3})(\\d{3})(\\d{3,4})","$1 $2 $3",["70|8[01]|90[2359]"]
,"0$1","",0]
,[,"([78]00)(\\d{4})(\\d{4,5})","$1 $2 $3",["[78]00"]
,"0$1","",0]
,[,"([78]00)(\\d{5})(\\d{5,6})","$1 $2 $3",["[78]00"]
,"0$1","",0]
,[,"(78)(\\d{2})(\\d{3})","$1 $2 $3",["78"]
,"0$1","",0]
]
,,[,,"NA","NA"]
,,,[,,"NA","NA"]
,[,,"700\\d{7,11}","\\d{10,14}",,,"7001234567"]
,,,[,,"NA","NA"]
]
,"NI":[,[,,"[12578]\\d{7}","\\d{8}"]
,[,,"2\\d{7}","\\d{8}",,,"21234567"]
,[,,"5(?:5[0-7]\\d{5}|[78]\\d{6})|7[5-8]\\d{6}|8\\d{7}","\\d{8}",,,"81234567"]
,[,,"1800\\d{4}","\\d{8}",,,"18001234"]
,[,,"NA","NA"]
,[,,"NA","NA"]
,[,,"NA","NA"]
,[,,"NA","NA"]
,"NI",505,"00",,,,,,,,[[,"(\\d{4})(\\d{4})","$1 $2",,"","",0]
]
,,[,,"NA","NA"]
,,,[,,"NA","NA"]
,[,,"NA","NA"]
,,,[,,"NA","NA"]
]
,"NL":[,[,,"1\\d{4,8}|[2-7]\\d{8}|[89]\\d{6,9}","\\d{5,10}"]
,[,,"(?:1[0135-8]|2[02-69]|3[0-68]|4[0135-9]|[57]\\d|8[478])\\d{7}","\\d{9}",,,"101234567"]
,[,,"6[1-58]\\d{7}","\\d{9}",,,"612345678"]
,[,,"800\\d{4,7}","\\d{7,10}",,,"8001234"]
,[,,"90[069]\\d{4,7}","\\d{7,10}",,,"9061234"]
,[,,"NA","NA"]
,[,,"NA","NA"]
,[,,"85\\d{7}","\\d{9}",,,"851234567"]
,"NL",31,"00","0",,,"0",,,,[[,"([1-578]\\d)(\\d{3})(\\d{4})","$1 $2 $3",["1[035]|2[0346]|3[03568]|4[0356]|5[0358]|7|8[4578]"]
,"0$1","",0]
,[,"([1-5]\\d{2})(\\d{3})(\\d{3})","$1 $2 $3",["1[16-8]|2[259]|3[124]|4[17-9]|5[124679]"]
,"0$1","",0]
,[,"(6)(\\d{8})","$1 $2",["6[0-57-9]"]
,"0$1","",0]
,[,"(66)(\\d{7})","$1 $2",["66"]
,"0$1","",0]
,[,"(14)(\\d{3,4})","$1 $2",["14"]
,"$1","",0]
,[,"([89]0\\d)(\\d{4,7})","$1 $2",["80|9"]
,"0$1","",0]
]
,,[,,"66\\d{7}","\\d{9}",,,"662345678"]
,,,[,,"14\\d{3,4}","\\d{5,6}"]
,[,,"140(?:1(?:[035]|[16-8]\\d)|2(?:[0346]|[259]\\d)|3(?:[03568]|[124]\\d)|4(?:[0356]|[17-9]\\d)|5(?:[0358]|[124679]\\d)|7\\d|8[458])","\\d{5,6}",,,"14020"]
,,,[,,"NA","NA"]
]
,"NO":[,[,,"0\\d{4}|[2-9]\\d{7}","\\d{5}(?:\\d{3})?"]
,[,,"(?:2[1-4]|3[1-3578]|5[1-35-7]|6[1-4679]|7[0-8])\\d{6}","\\d{8}",,,"21234567"]
,[,,"(?:4[015-8]|5[89]|9\\d)\\d{6}","\\d{8}",,,"40612345"]
,[,,"80[01]\\d{5}","\\d{8}",,,"80012345"]
,[,,"82[09]\\d{5}","\\d{8}",,,"82012345"]
,[,,"810(?:0[0-6]|[2-8]\\d)\\d{3}","\\d{8}",,,"81021234"]
,[,,"880\\d{5}","\\d{8}",,,"88012345"]
,[,,"85[0-5]\\d{5}","\\d{8}",,,"85012345"]
,"NO",47,"00",,,,,,,,[[,"([489]\\d{2})(\\d{2})(\\d{3})","$1 $2 $3",["[489]"]
,"","",0]
,[,"([235-7]\\d)(\\d{2})(\\d{2})(\\d{2})","$1 $2 $3 $4",["[235-7]"]
,"","",0]
]
,,[,,"NA","NA"]
,1,,[,,"NA","NA"]
,[,,"0\\d{4}|81(?:0(?:0[7-9]|1\\d)|5\\d{2})\\d{3}","\\d{5}(?:\\d{3})?",,,"01234"]
,1,,[,,"81[23]\\d{5}","\\d{8}",,,"81212345"]
]
,"NP":[,[,,"[1-8]\\d{7}|9(?:[1-69]\\d{6,8}|7[2-6]\\d{5,7}|8\\d{8})","\\d{6,10}"]
,[,,"(?:1[0-6]\\d|2[13-79][2-6]|3[135-8][2-6]|4[146-9][2-6]|5[135-7][2-6]|6[13-9][2-6]|7[15-9][2-6]|8[1-46-9][2-6]|9[1-79][2-6])\\d{5}","\\d{6,8}",,,"14567890"]
,[,,"9(?:6[013]|7[245]|8[0-24-6])\\d{7}","\\d{10}",,,"9841234567"]
,[,,"NA","NA"]
,[,,"NA","NA"]
,[,,"NA","NA"]
,[,,"NA","NA"]
,[,,"NA","NA"]
,"NP",977,"00","0",,,"0",,,,[[,"(1)(\\d{7})","$1-$2",["1[2-6]"]
,"0$1","",0]
,[,"(\\d{2})(\\d{6})","$1-$2",["1[01]|[2-8]|9(?:[1-69]|7[15-9])"]
,"0$1","",0]
,[,"(9\\d{2})(\\d{7})","$1-$2",["9(?:6[013]|7[245]|8)"]
,"0$1","",0]
]
,,[,,"NA","NA"]
,,,[,,"NA","NA"]
,[,,"NA","NA"]
,,,[,,"NA","NA"]
]
,"NR":[,[,,"[458]\\d{6}","\\d{7}"]
,[,,"(?:444|888)\\d{4}","\\d{7}",,,"4441234"]
,[,,"55[5-9]\\d{4}","\\d{7}",,,"5551234"]
,[,,"NA","NA"]
,[,,"NA","NA"]
,[,,"NA","NA"]
,[,,"NA","NA"]
,[,,"NA","NA"]
,"NR",674,"00",,,,,,,,[[,"(\\d{3})(\\d{4})","$1 $2",,"","",0]
]
,,[,,"NA","NA"]
,,,[,,"NA","NA"]
,[,,"NA","NA"]
,,,[,,"NA","NA"]
]
,"NU":[,[,,"[1-5]\\d{3}","\\d{4}"]
,[,,"[34]\\d{3}","\\d{4}",,,"4002"]
,[,,"[125]\\d{3}","\\d{4}",,,"1234"]
,[,,"NA","NA"]
,[,,"NA","NA"]
,[,,"NA","NA"]
,[,,"NA","NA"]
,[,,"NA","NA"]
,"NU",683,"00",,,,,,,,,,[,,"NA","NA"]
,,,[,,"NA","NA"]
,[,,"NA","NA"]
,,,[,,"NA","NA"]
]
,"NZ":[,[,,"6[235-9]\\d{6}|[2-57-9]\\d{7,10}","\\d{7,11}"]
,[,,"(?:3[2-79]|[49][2-9]|6[235-9]|7[2-57-9])\\d{6}|24099\\d{3}","\\d{7,8}",,,"32345678"]
,[,,"2(?:[028]\\d{7,8}|1(?:[03]\\d{5,7}|[12457]\\d{5,6}|[689]\\d{5})|[79]\\d{7})","\\d{8,10}",,,"211234567"]
,[,,"508\\d{6,7}|80\\d{6,8}","\\d{8,10}",,,"800123456"]
,[,,"90\\d{7,9}","\\d{9,11}",,,"900123456"]
,[,,"NA","NA"]
,[,,"70\\d{7}","\\d{9}",,,"701234567"]
,[,,"NA","NA"]
,"NZ",64,"0(?:0|161)","0",,,"0",,"00",,[[,"([34679])(\\d{3})(\\d{4})","$1-$2 $3",["[346]|7[2-57-9]|9[1-9]"]
,"0$1","",0]
,[,"(24099)(\\d{3})","$1 $2",["240","2409","24099"]
,"0$1","",0]
,[,"(\\d{2})(\\d{3})(\\d{3})","$1 $2 $3",["21"]
,"0$1","",0]
,[,"(\\d{2})(\\d{3})(\\d{3,5})","$1 $2 $3",["2(?:1[1-9]|[69]|7[0-35-9])|70|86"]
,"0$1","",0]
,[,"(2\\d)(\\d{3,4})(\\d{4})","$1 $2 $3",["2[028]"]
,"0$1","",0]
,[,"(\\d{3})(\\d{3})(\\d{3,4})","$1 $2 $3",["2(?:10|74)|5|[89]0"]
,"0$1","",0]
]
,,[,,"[28]6\\d{6,7}","\\d{8,9}",,,"26123456"]
,,,[,,"NA","NA"]
,[,,"NA","NA"]
,,,[,,"NA","NA"]
]
,"OM":[,[,,"(?:2[2-6]|5|9[1-9])\\d{6}|800\\d{5,6}","\\d{7,9}"]
,[,,"2[2-6]\\d{6}","\\d{8}",,,"23123456"]
,[,,"9[1-9]\\d{6}","\\d{8}",,,"92123456"]
,[,,"8007\\d{4,5}|500\\d{4}","\\d{7,9}",,,"80071234"]
,[,,"NA","NA"]
,[,,"NA","NA"]
,[,,"NA","NA"]
,[,,"NA","NA"]
,"OM",968,"00",,,,,,,,[[,"(2\\d)(\\d{6})","$1 $2",["2"]
,"","",0]
,[,"(9\\d{3})(\\d{4})","$1 $2",["9"]
,"","",0]
,[,"([58]00)(\\d{4,6})","$1 $2",["[58]"]
,"","",0]
]
,,[,,"NA","NA"]
,,,[,,"NA","NA"]
,[,,"NA","NA"]
,,,[,,"NA","NA"]
]
,"PA":[,[,,"[1-9]\\d{6,7}","\\d{7,8}"]
,[,,"(?:1(?:0[02-579]|19|2[37]|3[03]|4[479]|57|65|7[016-8]|8[58]|9[1349])|2(?:[0235679]\\d|1[0-7]|4[04-9]|8[028])|3(?:[09]\\d|1[14-7]|2[0-3]|3[03]|4[0457]|5[56]|6[068]|7[06-8]|8[089])|4(?:3[013-69]|4\\d|7[0-689])|5(?:[01]\\d|2[0-7]|[56]0|79)|7(?:0[09]|2[0-267]|3[06]|[49]0|5[06-9]|7[0-24-7]|8[89])|8(?:[34]\\d|5[0-4]|8[02])|9(?:0[6-8]|1[016-8]|2[036-8]|3[3679]|40|5[0489]|6[06-9]|7[046-9]|8[36-8]|9[1-9]))\\d{4}","\\d{7}",,,"2001234"]
,[,,"(?:1[16]1|21[89]|8(?:1[01]|7[23]))\\d{4}|6(?:[024-9]\\d|1[0-5]|3[0-24-9])\\d{5}","\\d{7,8}",,,"60012345"]
,[,,"80[09]\\d{4}","\\d{7}",,,"8001234"]
,[,,"(?:779|8(?:2[235]|55|60|7[578]|86|95)|9(?:0[0-2]|81))\\d{4}","\\d{7}",,,"8601234"]
,[,,"NA","NA"]
,[,,"NA","NA"]
,[,,"NA","NA"]
,"PA",507,"00",,,,,,,,[[,"(\\d{3})(\\d{4})","$1-$2",["[1-57-9]"]
,"","",0]
,[,"(\\d{4})(\\d{4})","$1-$2",["6"]
,"","",0]
]
,,[,,"NA","NA"]
,,,[,,"NA","NA"]
,[,,"NA","NA"]
,,,[,,"NA","NA"]
]
,"PE":[,[,,"[14-9]\\d{7,8}","\\d{6,9}"]
,[,,"(?:1\\d|4[1-4]|5[1-46]|6[1-7]|7[2-46]|8[2-4])\\d{6}","\\d{6,8}",,,"11234567"]
,[,,"9\\d{8}","\\d{9}",,,"912345678"]
,[,,"800\\d{5}","\\d{8}",,,"80012345"]
,[,,"805\\d{5}","\\d{8}",,,"80512345"]
,[,,"801\\d{5}","\\d{8}",,,"80112345"]
,[,,"80[24]\\d{5}","\\d{8}",,,"80212345"]
,[,,"NA","NA"]
,"PE",51,"19(?:1[124]|77|90)00","0"," Anexo ",,"0",,,,[[,"(1)(\\d{7})","$1 $2",["1"]
,"(0$1)","",0]
,[,"([4-8]\\d)(\\d{6})","$1 $2",["[4-7]|8[2-4]"]
,"(0$1)","",0]
,[,"(\\d{3})(\\d{5})","$1 $2",["80"]
,"(0$1)","",0]
,[,"(9\\d{2})(\\d{3})(\\d{3})","$1 $2 $3",["9"]
,"$1","",0]
]
,,[,,"NA","NA"]
,,,[,,"NA","NA"]
,[,,"NA","NA"]
,,,[,,"NA","NA"]
]
,"PF":[,[,,"4\\d{5,7}|8\\d{7}","\\d{6}(?:\\d{2})?"]
,[,,"4(?:[09][45689]\\d|4)\\d{4}","\\d{6}(?:\\d{2})?",,,"40412345"]
,[,,"8[79]\\d{6}","\\d{8}",,,"87123456"]
,[,,"NA","NA"]
,[,,"NA","NA"]
,[,,"NA","NA"]
,[,,"NA","NA"]
,[,,"NA","NA"]
,"PF",689,"00",,,,,,,,[[,"(\\d{2})(\\d{2})(\\d{2})(\\d{2})","$1 $2 $3 $4",["4[09]|8[79]"]
,"","",0]
,[,"(\\d{2})(\\d{2})(\\d{2})","$1 $2 $3",["44"]
,"","",0]
]
,,[,,"NA","NA"]
,,,[,,"44\\d{4}","\\d{6}",,,"441234"]
,[,,"NA","NA"]
,,,[,,"NA","NA"]
]
,"PG":[,[,,"[1-9]\\d{6,7}","\\d{7,8}"]
,[,,"(?:3[0-2]\\d|4[25]\\d|5[34]\\d|64[1-9]|77(?:[0-24]\\d|30)|85[02-46-9]|9[78]\\d)\\d{4}","\\d{7}",,,"3123456"]
,[,,"(?:20150|68\\d{2}|7(?:[0-369]\\d|75)\\d{2})\\d{3}","\\d{7,8}",,,"6812345"]
,[,,"180\\d{4}","\\d{7}",,,"1801234"]
,[,,"NA","NA"]
,[,,"NA","NA"]
,[,,"NA","NA"]
,[,,"275\\d{4}","\\d{7}",,,"2751234"]
,"PG",675,"00",,,,,,,,[[,"(\\d{3})(\\d{4})","$1 $2",["[13-689]|27"]
,"","",0]
,[,"(\\d{4})(\\d{4})","$1 $2",["20|7"]
,"","",0]
]
,,[,,"NA","NA"]
,,,[,,"NA","NA"]
,[,,"NA","NA"]
,,,[,,"NA","NA"]
]
,"PH":[,[,,"2\\d{5,7}|[3-9]\\d{7,9}|1800\\d{7,9}","\\d{5,13}"]
,[,,"2\\d{5}(?:\\d{2})?|(?:3[2-68]|4[2-9]|5[2-6]|6[2-58]|7[24578]|8[2-8])\\d{7}|88(?:22\\d{6}|42\\d{4})","\\d{5,10}",,,"21234567"]
,[,,"(?:81[37]|9(?:0[5-9]|1[024-9]|2[0-35-9]|3[02-9]|4[236-9]|50|7[34-79]|89|9[4-9]))\\d{7}","\\d{10}",,,"9051234567"]
,[,,"1800\\d{7,9}","\\d{11,13}",,,"180012345678"]
,[,,"NA","NA"]
,[,,"NA","NA"]
,[,,"NA","NA"]
,[,,"NA","NA"]
,"PH",63,"00","0",,,"0",,,,[[,"(2)(\\d{3})(\\d{4})","$1 $2 $3",["2"]
,"(0$1)","",0]
,[,"(2)(\\d{5})","$1 $2",["2"]
,"(0$1)","",0]
,[,"(\\d{4})(\\d{4,6})","$1 $2",["3(?:23|39|46)|4(?:2[3-6]|[35]9|4[26]|76)|5(?:22|44)|642|8(?:62|8[245])","3(?:230|397|461)|4(?:2(?:35|[46]4|51)|396|4(?:22|63)|59[347]|76[15])|5(?:221|446)|642[23]|8(?:622|8(?:[24]2|5[13]))"]
,"(0$1)","",0]
,[,"(\\d{5})(\\d{4})","$1 $2",["346|4(?:27|9[35])|883","3469|4(?:279|9(?:30|56))|8834"]
,"(0$1)","",0]
,[,"([3-8]\\d)(\\d{3})(\\d{4})","$1 $2 $3",["[3-8]"]
,"(0$1)","",0]
,[,"(\\d{3})(\\d{3})(\\d{4})","$1 $2 $3",["81|9"]
,"0$1","",0]
,[,"(1800)(\\d{3})(\\d{4})","$1 $2 $3",["1"]
,"","",0]
,[,"(1800)(\\d{1,2})(\\d{3})(\\d{4})","$1 $2 $3 $4",["1"]
,"","",0]
]
,,[,,"NA","NA"]
,,,[,,"NA","NA"]
,[,,"NA","NA"]
,,,[,,"NA","NA"]
]
,"PK":[,[,,"1\\d{8}|[2-8]\\d{5,11}|9(?:[013-9]\\d{4,9}|2\\d(?:111\\d{6}|\\d{3,7}))","\\d{6,12}"]
,[,,"(?:21|42)[2-9]\\d{7}|(?:2[25]|4[0146-9]|5[1-35-7]|6[1-8]|7[14]|8[16]|91)[2-9]\\d{6}|(?:2(?:3[2358]|4[2-4]|9[2-8])|45[3479]|54[2-467]|60[468]|72[236]|8(?:2[2-689]|3[23578]|4[3478]|5[2356])|9(?:1|2[2-8]|3[27-9]|4[2-6]|6[3569]|9[25-8]))[2-9]\\d{5,6}|58[126]\\d{7}","\\d{6,10}",,,"2123456789"]
,[,,"3(?:0\\d|1[0-6]|2[0-5]|3[0-7]|4[0-8]|55|64)\\d{7}","\\d{10}",,,"3012345678"]
,[,,"800\\d{5}","\\d{8}",,,"80012345"]
,[,,"900\\d{5}","\\d{8}",,,"90012345"]
,[,,"NA","NA"]
,[,,"122\\d{6}","\\d{9}",,,"122044444"]
,[,,"NA","NA"]
,"PK",92,"00","0",,,"0",,,,[[,"(\\d{2})(111)(\\d{3})(\\d{3})","$1 $2 $3 $4",["(?:2[125]|4[0-246-9]|5[1-35-7]|6[1-8]|7[14]|8[16]|91)1","(?:2[125]|4[0-246-9]|5[1-35-7]|6[1-8]|7[14]|8[16]|91)11","(?:2[125]|4[0-246-9]|5[1-35-7]|6[1-8]|7[14]|8[16]|91)111"]
,"(0$1)","",0]
,[,"(\\d{3})(111)(\\d{3})(\\d{3})","$1 $2 $3 $4",["2[349]|45|54|60|72|8[2-5]|9[2-9]","(?:2[349]|45|54|60|72|8[2-5]|9[2-9])\\d1","(?:2[349]|45|54|60|72|8[2-5]|9[2-9])\\d11","(?:2[349]|45|54|60|72|8[2-5]|9[2-9])\\d111"]
,"(0$1)","",0]
,[,"(\\d{2})(\\d{7,8})","$1 $2",["(?:2[125]|4[0-246-9]|5[1-35-7]|6[1-8]|7[14]|8[16]|91)[2-9]"]
,"(0$1)","",0]
,[,"(\\d{3})(\\d{6,7})","$1 $2",["2[349]|45|54|60|72|8[2-5]|9[2-9]","(?:2[349]|45|54|60|72|8[2-5]|9[2-9])\\d[2-9]"]
,"(0$1)","",0]
,[,"(3\\d{2})(\\d{7})","$1 $2",["3"]
,"0$1","",0]
,[,"([15]\\d{3})(\\d{5,6})","$1 $2",["58[12]|1"]
,"(0$1)","",0]
,[,"(586\\d{2})(\\d{5})","$1 $2",["586"]
,"(0$1)","",0]
,[,"([89]00)(\\d{3})(\\d{2})","$1 $2 $3",["[89]00"]
,"0$1","",0]
]
,,[,,"NA","NA"]
,,,[,,"NA","NA"]
,[,,"(?:2(?:[125]|3[2358]|4[2-4]|9[2-8])|4(?:[0-246-9]|5[3479])|5(?:[1-35-7]|4[2-467])|6(?:[1-8]|0[468])|7(?:[14]|2[236])|8(?:[16]|2[2-689]|3[23578]|4[3478]|5[2356])|9(?:1|22|3[27-9]|4[2-6]|6[3569]|9[2-7]))111\\d{6}","\\d{11,12}",,,"21111825888"]
,,,[,,"NA","NA"]
]
,"PL":[,[,,"[12]\\d{6,8}|[3-57-9]\\d{8}|6\\d{5,8}","\\d{6,9}"]
,[,,"(?:1[2-8]|2[2-69]|3[2-4]|4[1-468]|5[24-689]|6[1-3578]|7[14-7]|8[1-79]|9[145])\\d{7}|[12]2\\d{5}","\\d{6,9}",,,"123456789"]
,[,,"(?:5[0137]|6[069]|7[2389]|88)\\d{7}","\\d{9}",,,"512345678"]
,[,,"800\\d{6}","\\d{9}",,,"800123456"]
,[,,"70\\d{7}","\\d{9}",,,"701234567"]
,[,,"801\\d{6}","\\d{9}",,,"801234567"]
,[,,"NA","NA"]
,[,,"39\\d{7}","\\d{9}",,,"391234567"]
,"PL",48,"00",,,,,,,,[[,"(\\d{2})(\\d{3})(\\d{2})(\\d{2})","$1 $2 $3 $4",["[14]|2[0-57-9]|3[2-4]|5[24-689]|6[1-3578]|7[14-7]|8[1-79]|9[145]"]
,"","",0]
,[,"(\\d{2})(\\d{1})(\\d{4})","$1 $2 $3",["[12]2"]
,"","",0]
,[,"(\\d{3})(\\d{3})(\\d{3})","$1 $2 $3",["26|39|5[0137]|6[0469]|7[02389]|8[08]"]
,"","",0]
,[,"(\\d{3})(\\d{2})(\\d{2,3})","$1 $2 $3",["64"]
,"","",0]
,[,"(\\d{3})(\\d{3})","$1 $2",["64"]
,"","",0]
]
,,[,,"64\\d{4,7}","\\d{6,9}",,,"641234567"]
,,,[,,"NA","NA"]
,[,,"NA","NA"]
,,,[,,"NA","NA"]
]
,"PM":[,[,,"[45]\\d{5}","\\d{6}"]
,[,,"41\\d{4}","\\d{6}",,,"411234"]
,[,,"55\\d{4}","\\d{6}",,,"551234"]
,[,,"NA","NA"]
,[,,"NA","NA"]
,[,,"NA","NA"]
,[,,"NA","NA"]
,[,,"NA","NA"]
,"PM",508,"00","0",,,"0",,,,[[,"([45]\\d)(\\d{2})(\\d{2})","$1 $2 $3",,"0$1","",0]
]
,,[,,"NA","NA"]
,,,[,,"NA","NA"]
,[,,"NA","NA"]
,,,[,,"NA","NA"]
]
,"PR":[,[,,"[5789]\\d{9}","\\d{7}(?:\\d{3})?"]
,[,,"(?:787|939)[2-9]\\d{6}","\\d{7}(?:\\d{3})?",,,"7872345678"]
,[,,"(?:787|939)[2-9]\\d{6}","\\d{7}(?:\\d{3})?",,,"7872345678"]
,[,,"8(?:00|44|55|66|77|88)[2-9]\\d{6}","\\d{10}",,,"8002345678"]
,[,,"900[2-9]\\d{6}","\\d{10}",,,"9002345678"]
,[,,"NA","NA"]
,[,,"5(?:00|33|44|66|77)[2-9]\\d{6}","\\d{10}",,,"5002345678"]
,[,,"NA","NA"]
,"PR",1,"011","1",,,"1",,,1,,,[,,"NA","NA"]
,,"787|939",[,,"NA","NA"]
,[,,"NA","NA"]
,,,[,,"NA","NA"]
]
,"PS":[,[,,"[24589]\\d{7,8}|1(?:[78]\\d{8}|[49]\\d{2,3})","\\d{4,10}"]
,[,,"(?:22[234789]|42[45]|82[01458]|92[369])\\d{5}","\\d{7,8}",,,"22234567"]
,[,,"5[69]\\d{7}","\\d{9}",,,"599123456"]
,[,,"1800\\d{6}","\\d{10}",,,"1800123456"]
,[,,"1(?:4|9\\d)\\d{2}","\\d{4,5}",,,"19123"]
,[,,"1700\\d{6}","\\d{10}",,,"1700123456"]
,[,,"NA","NA"]
,[,,"NA","NA"]
,"PS",970,"00","0",,,"0",,,,[[,"([2489])(2\\d{2})(\\d{4})","$1 $2 $3",["[2489]"]
,"0$1","",0]
,[,"(5[69]\\d)(\\d{3})(\\d{3})","$1 $2 $3",["5"]
,"0$1","",0]
,[,"(1[78]00)(\\d{3})(\\d{3})","$1 $2 $3",["1[78]"]
,"$1","",0]
]
,,[,,"NA","NA"]
,,,[,,"NA","NA"]
,[,,"NA","NA"]
,,,[,,"NA","NA"]
]
,"PT":[,[,,"[2-46-9]\\d{8}","\\d{9}"]
,[,,"2(?:[12]\\d|[35][1-689]|4[1-59]|6[1-35689]|7[1-9]|8[1-69]|9[1256])\\d{6}","\\d{9}",,,"212345678"]
,[,,"9(?:[136]\\d{2}|2[0-79]\\d|480)\\d{5}","\\d{9}",,,"912345678"]
,[,,"80[02]\\d{6}","\\d{9}",,,"800123456"]
,[,,"76(?:0[1-57]|1[2-47]|2[237])\\d{5}","\\d{9}",,,"760123456"]
,[,,"80(?:8\\d|9[1579])\\d{5}","\\d{9}",,,"808123456"]
,[,,"884[128]\\d{5}","\\d{9}",,,"884123456"]
,[,,"30\\d{7}","\\d{9}",,,"301234567"]
,"PT",351,"00",,,,,,,,[[,"(2\\d)(\\d{3})(\\d{4})","$1 $2 $3",["2[12]"]
,"","",0]
,[,"([2-46-9]\\d{2})(\\d{3})(\\d{3})","$1 $2 $3",["2[3-9]|[346-9]"]
,"","",0]
]
,,[,,"NA","NA"]
,,,[,,"NA","NA"]
,[,,"70(?:7\\d|8[17])\\d{5}","\\d{9}",,,"707123456"]
,,,[,,"NA","NA"]
]
,"PW":[,[,,"[2-8]\\d{6}","\\d{7}"]
,[,,"2552255|(?:277|345|488|5(?:35|44|87)|6(?:22|54|79)|7(?:33|47)|8(?:24|55|76))\\d{4}","\\d{7}",,,"2771234"]
,[,,"(?:6[234689]0|77[45789])\\d{4}","\\d{7}",,,"6201234"]
,[,,"NA","NA"]
,[,,"NA","NA"]
,[,,"NA","NA"]
,[,,"NA","NA"]
,[,,"NA","NA"]
,"PW",680,"01[12]",,,,,,,,[[,"(\\d{3})(\\d{4})","$1 $2",,"","",0]
]
,,[,,"NA","NA"]
,,,[,,"NA","NA"]
,[,,"NA","NA"]
,,,[,,"NA","NA"]
]
,"PY":[,[,,"5[0-5]\\d{4,7}|[2-46-9]\\d{5,8}","\\d{5,9}"]
,[,,"(?:[26]1|3[289]|4[124678]|7[123]|8[1236])\\d{5,7}|(?:2(?:2[4568]|7[15]|9[1-5])|3(?:18|3[167]|4[2357]|51)|4(?:18|2[45]|3[12]|5[13]|64|71|9[1-47])|5(?:[1-4]\\d|5[0234])|6(?:3[1-3]|44|7[1-4678])|7(?:17|4[0-4]|6[1-578]|75|8[0-8])|858)\\d{5,6}","\\d{5,9}",,,"212345678"]
,[,,"9(?:6[12]|[78][1-6]|9[1-5])\\d{6}","\\d{9}",,,"961456789"]
,[,,"NA","NA"]
,[,,"NA","NA"]
,[,,"NA","NA"]
,[,,"NA","NA"]
,[,,"8700[0-4]\\d{4}","\\d{9}",,,"870012345"]
,"PY",595,"00","0",,,"0",,,,[[,"(\\d{2})(\\d{5,7})","$1 $2",["(?:[26]1|3[289]|4[124678]|7[123]|8[1236])"]
,"($1)","",0]
,[,"(\\d{3})(\\d{3,6})","$1 $2",["[2-9]0"]
,"0$1","",0]
,[,"(\\d{3})(\\d{6})","$1 $2",["9[1-9]"]
,"0$1","",0]
,[,"(\\d{2})(\\d{3})(\\d{4})","$1 $2 $3",["8700"]
,"","",0]
,[,"(\\d{3})(\\d{4,6})","$1 $2",["[2-8][1-9]"]
,"($1)","",0]
]
,,[,,"NA","NA"]
,,,[,,"NA","NA"]
,[,,"[2-9]0\\d{4,7}","\\d{6,9}",,,"201234567"]
,,,[,,"NA","NA"]
]
,"QA":[,[,,"[2-8]\\d{6,7}","\\d{7,8}"]
,[,,"4[04]\\d{6}","\\d{7,8}",,,"44123456"]
,[,,"[3567]\\d{7}","\\d{7,8}",,,"33123456"]
,[,,"800\\d{4}","\\d{7,8}",,,"8001234"]
,[,,"NA","NA"]
,[,,"NA","NA"]
,[,,"NA","NA"]
,[,,"NA","NA"]
,"QA",974,"00",,,,,,,,[[,"([28]\\d{2})(\\d{4})","$1 $2",["[28]"]
,"","",0]
,[,"([3-7]\\d{3})(\\d{4})","$1 $2",["[3-7]"]
,"","",0]
]
,,[,,"2(?:[12]\\d|61)\\d{4}","\\d{7}",,,"2123456"]
,,,[,,"NA","NA"]
,[,,"NA","NA"]
,,,[,,"NA","NA"]
]
,"RE":[,[,,"[268]\\d{8}","\\d{9}"]
,[,,"262\\d{6}","\\d{9}",,,"262161234"]
,[,,"6(?:9[23]|47)\\d{6}","\\d{9}",,,"692123456"]
,[,,"80\\d{7}","\\d{9}",,,"801234567"]
,[,,"89[1-37-9]\\d{6}","\\d{9}",,,"891123456"]
,[,,"8(?:1[019]|2[0156]|84|90)\\d{6}","\\d{9}",,,"810123456"]
,[,,"NA","NA"]
,[,,"NA","NA"]
,"RE",262,"00","0",,,"0",,,,[[,"([268]\\d{2})(\\d{2})(\\d{2})(\\d{2})","$1 $2 $3 $4",,"0$1","",0]
]
,,[,,"NA","NA"]
,1,"262|6[49]|8",[,,"NA","NA"]
,[,,"NA","NA"]
,,,[,,"NA","NA"]
]
,"RO":[,[,,"2\\d{5,8}|[37-9]\\d{8}","\\d{6,9}"]
,[,,"2(?:1(?:\\d{7}|9\\d{3})|[3-6](?:\\d{7}|\\d9\\d{2}))|3[13-6]\\d{7}","\\d{6,9}",,,"211234567"]
,[,,"7(?:000|[1-8]\\d{2}|99\\d)\\d{5}","\\d{9}",,,"712345678"]
,[,,"800\\d{6}","\\d{9}",,,"800123456"]
,[,,"90[036]\\d{6}","\\d{9}",,,"900123456"]
,[,,"801\\d{6}","\\d{9}",,,"801123456"]
,[,,"802\\d{6}","\\d{9}",,,"802123456"]
,[,,"NA","NA"]
,"RO",40,"00","0"," int ",,"0",,,,[[,"([237]\\d)(\\d{3})(\\d{4})","$1 $2 $3",["[23]1"]
,"0$1","",0]
,[,"(21)(\\d{4})","$1 $2",["21"]
,"0$1","",0]
,[,"(\\d{3})(\\d{3})(\\d{3})","$1 $2 $3",["[23][3-7]|[7-9]"]
,"0$1","",0]
,[,"(2\\d{2})(\\d{3})","$1 $2",["2[3-6]"]
,"0$1","",0]
]
,,[,,"NA","NA"]
,,,[,,"NA","NA"]
,[,,"37\\d{7}","\\d{9}",,,"372123456"]
,,,[,,"NA","NA"]
]
,"RS":[,[,,"[126-9]\\d{4,11}|3(?:[0-79]\\d{3,10}|8[2-9]\\d{2,9})","\\d{5,12}"]
,[,,"(?:1(?:[02-9][2-9]|1[1-9])\\d|2(?:[0-24-7][2-9]\\d|[389](?:0[2-9]|[2-9]\\d))|3(?:[0-8][2-9]\\d|9(?:[2-9]\\d|0[2-9])))\\d{3,8}","\\d{5,12}",,,"10234567"]
,[,,"6(?:[0-689]|7\\d)\\d{6,7}","\\d{8,10}",,,"601234567"]
,[,,"800\\d{3,9}","\\d{6,12}",,,"80012345"]
,[,,"(?:90[0169]|78\\d)\\d{3,7}","\\d{6,12}",,,"90012345"]
,[,,"NA","NA"]
,[,,"NA","NA"]
,[,,"NA","NA"]
,"RS",381,"00","0",,,"0",,,,[[,"([23]\\d{2})(\\d{4,9})","$1 $2",["(?:2[389]|39)0"]
,"0$1","",0]
,[,"([1-3]\\d)(\\d{5,10})","$1 $2",["1|2(?:[0-24-7]|[389][1-9])|3(?:[0-8]|9[1-9])"]
,"0$1","",0]
,[,"(6\\d)(\\d{6,8})","$1 $2",["6"]
,"0$1","",0]
,[,"([89]\\d{2})(\\d{3,9})","$1 $2",["[89]"]
,"0$1","",0]
,[,"(7[26])(\\d{4,9})","$1 $2",["7[26]"]
,"0$1","",0]
,[,"(7[08]\\d)(\\d{4,9})","$1 $2",["7[08]"]
,"0$1","",0]
]
,,[,,"NA","NA"]
,,,[,,"NA","NA"]
,[,,"7[06]\\d{4,10}","\\d{6,12}",,,"700123456"]
,,,[,,"NA","NA"]
]
,"RU":[,[,,"[3489]\\d{9}","\\d{10}"]
,[,,"(?:3(?:0[12]|4[1-35-79]|5[1-3]|8[1-58]|9[0145])|4(?:01|1[1356]|2[13467]|7[1-5]|8[1-7]|9[1-689])|8(?:1[1-8]|2[01]|3[13-6]|4[0-8]|5[15]|6[1-35-7]|7[1-37-9]))\\d{7}","\\d{10}",,,"3011234567"]
,[,,"9\\d{9}","\\d{10}",,,"9123456789"]
,[,,"80[04]\\d{7}","\\d{10}",,,"8001234567"]
,[,,"80[39]\\d{7}","\\d{10}",,,"8091234567"]
,[,,"NA","NA"]
,[,,"NA","NA"]
,[,,"NA","NA"]
,"RU",7,"810","8",,,"8",,"8~10",,[[,"(\\d{3})(\\d{2})(\\d{2})","$1-$2-$3",["[1-79]"]
,"$1","",1]
,[,"([3489]\\d{2})(\\d{3})(\\d{2})(\\d{2})","$1 $2-$3-$4",["[34689]"]
,"8 ($1)","",1]
,[,"(7\\d{2})(\\d{3})(\\d{4})","$1 $2 $3",["7"]
,"8 ($1)","",1]
]
,[[,"([3489]\\d{2})(\\d{3})(\\d{2})(\\d{2})","$1 $2-$3-$4",["[34689]"]
,"8 ($1)","",1]
,[,"(7\\d{2})(\\d{3})(\\d{4})","$1 $2 $3",["7"]
,"8 ($1)","",1]
]
,[,,"NA","NA"]
,1,,[,,"NA","NA"]
,[,,"NA","NA"]
,,,[,,"NA","NA"]
]
,"RW":[,[,,"[027-9]\\d{7,8}","\\d{8,9}"]
,[,,"2[258]\\d{7}|06\\d{6}","\\d{8,9}",,,"250123456"]
,[,,"7[238]\\d{7}","\\d{9}",,,"720123456"]
,[,,"800\\d{6}","\\d{9}",,,"800123456"]
,[,,"900\\d{6}","\\d{9}",,,"900123456"]
,[,,"NA","NA"]
,[,,"NA","NA"]
,[,,"NA","NA"]
,"RW",250,"00","0",,,"0",,,,[[,"(2\\d{2})(\\d{3})(\\d{3})","$1 $2 $3",["2"]
,"$1","",0]
,[,"([7-9]\\d{2})(\\d{3})(\\d{3})","$1 $2 $3",["[7-9]"]
,"0$1","",0]
,[,"(0\\d)(\\d{2})(\\d{2})(\\d{2})","$1 $2 $3 $4",["0"]
,"","",0]
]
,,[,,"NA","NA"]
,,,[,,"NA","NA"]
,[,,"NA","NA"]
,1,,[,,"NA","NA"]
]
,"SA":[,[,,"1\\d{7,8}|(?:[2-467]|92)\\d{7}|5\\d{8}|8\\d{9}","\\d{7,10}"]
,[,,"11\\d{7}|1?(?:2[24-8]|3[35-8]|4[3-68]|6[2-5]|7[235-7])\\d{6}","\\d{7,9}",,,"112345678"]
,[,,"(?:5(?:[013-689]\\d|7[0-26-8])|811\\d)\\d{6}","\\d{9,10}",,,"512345678"]
,[,,"800\\d{7}","\\d{10}",,,"8001234567"]
,[,,"NA","NA"]
,[,,"92[05]\\d{6}","\\d{9}",,,"920012345"]
,[,,"NA","NA"]
,[,,"NA","NA"]
,"SA",966,"00","0",,,"0",,,,[[,"([1-467])(\\d{3})(\\d{4})","$1 $2 $3",["[1-467]"]
,"0$1","",0]
,[,"(1\\d)(\\d{3})(\\d{4})","$1 $2 $3",["1[1-467]"]
,"0$1","",0]
,[,"(5\\d)(\\d{3})(\\d{4})","$1 $2 $3",["5"]
,"0$1","",0]
,[,"(92\\d{2})(\\d{5})","$1 $2",["92"]
,"$1","",0]
,[,"(800)(\\d{3})(\\d{4})","$1 $2 $3",["80"]
,"$1","",0]
,[,"(811)(\\d{3})(\\d{3,4})","$1 $2 $3",["81"]
,"0$1","",0]
]
,,[,,"NA","NA"]
,,,[,,"NA","NA"]
,[,,"NA","NA"]
,,,[,,"NA","NA"]
]
,"SB":[,[,,"[1-9]\\d{4,6}","\\d{5,7}"]
,[,,"(?:1[4-79]|[23]\\d|4[0-2]|5[03]|6[0-37])\\d{3}","\\d{5}",,,"40123"]
,[,,"48\\d{3}|7(?:30|[46-8]\\d|5[025-9]|9[0-5])\\d{4}|8[4-8]\\d{5}|9(?:1[2-9]|2[013-9]|3[0-2]|[46]\\d|5[0-46-9]|7[0-689]|8[0-79]|9[0-8])\\d{4}","\\d{5,7}",,,"7421234"]
,[,,"1[38]\\d{3}","\\d{5}",,,"18123"]
,[,,"NA","NA"]
,[,,"NA","NA"]
,[,,"NA","NA"]
,[,,"5[12]\\d{3}","\\d{5}",,,"51123"]
,"SB",677,"0[01]",,,,,,,,[[,"(\\d{2})(\\d{5})","$1 $2",["[7-9]"]
,"","",0]
]
,,[,,"NA","NA"]
,,,[,,"NA","NA"]
,[,,"NA","NA"]
,,,[,,"NA","NA"]
]
,"SC":[,[,,"[2468]\\d{5,6}","\\d{6,7}"]
,[,,"4[2-46]\\d{5}","\\d{7}",,,"4217123"]
,[,,"2[5-8]\\d{5}","\\d{7}",,,"2510123"]
,[,,"8000\\d{2}","\\d{6}",,,"800000"]
,[,,"NA","NA"]
,[,,"NA","NA"]
,[,,"NA","NA"]
,[,,"64\\d{5}","\\d{7}",,,"6412345"]
,"SC",248,"0[0-2]",,,,,,"00",,[[,"(\\d{3})(\\d{3})","$1 $2",["8"]
,"","",0]
,[,"(\\d)(\\d{3})(\\d{3})","$1 $2 $3",["[246]"]
,"","",0]
]
,,[,,"NA","NA"]
,,,[,,"NA","NA"]
,[,,"NA","NA"]
,,,[,,"NA","NA"]
]
,"SD":[,[,,"[19]\\d{8}","\\d{9}"]
,[,,"1(?:[125]\\d|8[3567])\\d{6}","\\d{9}",,,"121231234"]
,[,,"9[0-3569]\\d{7}","\\d{9}",,,"911231234"]
,[,,"NA","NA"]
,[,,"NA","NA"]
,[,,"NA","NA"]
,[,,"NA","NA"]
,[,,"NA","NA"]
,"SD",249,"00","0",,,"0",,,,[[,"(\\d{2})(\\d{3})(\\d{4})","$1 $2 $3",,"0$1","",0]
]
,,[,,"NA","NA"]
,,,[,,"NA","NA"]
,[,,"NA","NA"]
,,,[,,"NA","NA"]
]
,"SE":[,[,,"[1-9]\\d{5,9}","\\d{5,10}"]
,[,,"1(?:0[1-8]\\d{6}|[136]\\d{5,7}|(?:2[0-35]|4[0-4]|5[0-25-9]|7[13-6]|[89]\\d)\\d{5,6})|2(?:[136]\\d{5,7}|(?:2[0-7]|4[0136-8]|5[0138]|7[018]|8[01]|9[0-57])\\d{5,6})|3(?:[356]\\d{5,7}|(?:0[0-4]|1\\d|2[0-25]|4[056]|7[0-2]|8[0-3]|9[023])\\d{5,6})|4(?:0[1-9]\\d{4,6}|[246]\\d{5,7}|(?:1[013-8]|3[0135]|5[14-79]|7[0-246-9]|8[0156]|9[0-689])\\d{5,6})|5(?:0[0-6]|[15][0-5]|2[0-68]|3[0-4]|4\\d|6[03-5]|7[013]|8[0-79]|9[01])\\d{5,6}|6(?:0[1-9]\\d{4,6}|3\\d{5,7}|(?:1[1-3]|2[0-4]|4[02-57]|5[0-37]|6[0-3]|7[0-2]|8[0247]|9[0-356])\\d{5,6})|8[1-9]\\d{5,7}|9(?:0[1-9]\\d{4,6}|(?:1[0-68]|2\\d|3[02-5]|4[0-3]|5[0-4]|[68][01]|7[0135-8])\\d{5,6})","\\d{5,9}",,,"8123456"]
,[,,"7[02369]\\d{7}","\\d{9}",,,"701234567"]
,[,,"20(?:0(?:0\\d{2}|[1-9](?:0\\d{1,4}|[1-9]\\d{4}))|1(?:0\\d{4}|[1-9]\\d{4,5})|[2-9]\\d{5})","\\d{6,9}",,,"20123456"]
,[,,"9(?:00|39|44)(?:1(?:[0-26]\\d{5}|[3-57-9]\\d{2})|2(?:[0-2]\\d{5}|[3-9]\\d{2})|3(?:[0139]\\d{5}|[24-8]\\d{2})|4(?:[045]\\d{5}|[1-36-9]\\d{2})|5(?:5\\d{5}|[0-46-9]\\d{2})|6(?:[679]\\d{5}|[0-58]\\d{2})|7(?:[078]\\d{5}|[1-69]\\d{2})|8(?:[578]\\d{5}|[0-469]\\d{2}))","\\d{7}(?:\\d{3})?",,,"9001234567"]
,[,,"77(?:0(?:0\\d{2}|[1-9](?:0\\d|[1-9]\\d{4}))|[1-6][1-9]\\d{5})","\\d{6}(?:\\d{3})?",,,"771234567"]
,[,,"75[1-8]\\d{6}","\\d{9}",,,"751234567"]
,[,,"NA","NA"]
,"SE",46,"00","0",,,"0",,,,[[,"(8)(\\d{2,3})(\\d{2,3})(\\d{2})","$1-$2 $3 $4",["8"]
,"0$1","",0]
,[,"([1-69]\\d)(\\d{2,3})(\\d{2})(\\d{2})","$1-$2 $3 $4",["1[013689]|2[0136]|3[1356]|4[0246]|54|6[03]|90"]
,"0$1","",0]
,[,"([1-69]\\d)(\\d{3})(\\d{2})","$1-$2 $3",["1[13689]|2[136]|3[1356]|4[0246]|54|6[03]|90"]
,"0$1","",0]
,[,"(\\d{3})(\\d{2})(\\d{2})(\\d{2})","$1-$2 $3 $4",["1[2457]|2[2457-9]|3[0247-9]|4[1357-9]|5[0-35-9]|6[124-9]|9(?:[125-8]|3[0-5]|4[0-3])"]
,"0$1","",0]
,[,"(\\d{3})(\\d{2,3})(\\d{2})","$1-$2 $3",["1[2457]|2[2457-9]|3[0247-9]|4[1357-9]|5[0-35-9]|6[124-9]|9(?:[125-8]|3[0-5]|4[0-3])"]
,"0$1","",0]
,[,"(7\\d)(\\d{3})(\\d{2})(\\d{2})","$1-$2 $3 $4",["7"]
,"0$1","",0]
,[,"(77)(\\d{2})(\\d{2})","$1-$2$3",["7"]
,"0$1","",0]
,[,"(20)(\\d{2,3})(\\d{2})","$1-$2 $3",["20"]
,"0$1","",0]
,[,"(9[034]\\d)(\\d{2})(\\d{2})(\\d{3})","$1-$2 $3 $4",["9[034]"]
,"0$1","",0]
,[,"(9[034]\\d)(\\d{4})","$1-$2",["9[034]"]
,"0$1","",0]
]
,[[,"(8)(\\d{2,3})(\\d{2,3})(\\d{2})","$1 $2 $3 $4",["8"]
]
,[,"([1-69]\\d)(\\d{2,3})(\\d{2})(\\d{2})","$1 $2 $3 $4",["1[013689]|2[0136]|3[1356]|4[0246]|54|6[03]|90"]
]
,[,"([1-69]\\d)(\\d{3})(\\d{2})","$1 $2 $3",["1[13689]|2[136]|3[1356]|4[0246]|54|6[03]|90"]
]
,[,"(\\d{3})(\\d{2})(\\d{2})(\\d{2})","$1 $2 $3 $4",["1[2457]|2[2457-9]|3[0247-9]|4[1357-9]|5[0-35-9]|6[124-9]|9(?:[125-8]|3[0-5]|4[0-3])"]
]
,[,"(\\d{3})(\\d{2,3})(\\d{2})","$1 $2 $3",["1[2457]|2[2457-9]|3[0247-9]|4[1357-9]|5[0-35-9]|6[124-9]|9(?:[125-8]|3[0-5]|4[0-3])"]
]
,[,"(7\\d)(\\d{3})(\\d{2})(\\d{2})","$1 $2 $3 $4",["7"]
]
,[,"(77)(\\d{2})(\\d{2})","$1 $2 $3",["7"]
]
,[,"(20)(\\d{2,3})(\\d{2})","$1 $2 $3",["20"]
]
,[,"(9[034]\\d)(\\d{2})(\\d{2})(\\d{3})","$1 $2 $3 $4",["9[034]"]
]
,[,"(9[034]\\d)(\\d{4})","$1 $2",["9[034]"]
]
]
,[,,"74[02-9]\\d{6}","\\d{9}",,,"740123456"]
,,,[,,"NA","NA"]
,[,,"NA","NA"]
,,,[,,"NA","NA"]
]
,"SG":[,[,,"[36]\\d{7}|[17-9]\\d{7,10}","\\d{8,11}"]
,[,,"6[1-9]\\d{6}","\\d{8}",,,"61234567"]
,[,,"(?:8[1-8]|9[0-8])\\d{6}","\\d{8}",,,"81234567"]
,[,,"1?800\\d{7}","\\d{10,11}",,,"18001234567"]
,[,,"1900\\d{7}","\\d{11}",,,"19001234567"]
,[,,"NA","NA"]
,[,,"NA","NA"]
,[,,"3[12]\\d{6}","\\d{8}",,,"31234567"]
,"SG",65,"0[0-3]\\d",,,,,,,,[[,"([3689]\\d{3})(\\d{4})","$1 $2",["[369]|8[1-9]"]
,"","",0]
,[,"(1[89]00)(\\d{3})(\\d{4})","$1 $2 $3",["1[89]"]
,"","",0]
,[,"(7000)(\\d{4})(\\d{3})","$1 $2 $3",["70"]
,"","",0]
,[,"(800)(\\d{3})(\\d{4})","$1 $2 $3",["80"]
,"","",0]
]
,,[,,"NA","NA"]
,,,[,,"NA","NA"]
,[,,"7000\\d{7}","\\d{11}",,,"70001234567"]
,,,[,,"NA","NA"]
]
,"SH":[,[,,"[256]\\d{4}","\\d{4,5}"]
,[,,"2(?:[0-57-9]\\d|6[4-9])\\d{2}","\\d{5}",,,"22158"]
,[,,"[56]\\d{4}","\\d{5}"]
,[,,"NA","NA"]
,[,,"NA","NA"]
,[,,"NA","NA"]
,[,,"NA","NA"]
,[,,"262\\d{2}","\\d{5}"]
,"SH",290,"00",,,,,,,,,,[,,"NA","NA"]
,1,,[,,"NA","NA"]
,[,,"NA","NA"]
,,,[,,"NA","NA"]
]
,"SI":[,[,,"[1-7]\\d{6,7}|[89]\\d{4,7}","\\d{5,8}"]
,[,,"(?:1\\d|[25][2-8]|3[4-8]|4[24-8]|7[3-8])\\d{6}","\\d{7,8}",,,"11234567"]
,[,,"(?:[37][01]|4[0139]|51|6[48])\\d{6}","\\d{8}",,,"31234567"]
,[,,"80\\d{4,6}","\\d{6,8}",,,"80123456"]
,[,,"90\\d{4,6}|89[1-3]\\d{2,5}","\\d{5,8}",,,"90123456"]
,[,,"NA","NA"]
,[,,"NA","NA"]
,[,,"(?:59|8[1-3])\\d{6}","\\d{8}",,,"59012345"]
,"SI",386,"00","0",,,"0",,,,[[,"(\\d)(\\d{3})(\\d{2})(\\d{2})","$1 $2 $3 $4",["[12]|3[4-8]|4[24-8]|5[2-8]|7[3-8]"]
,"(0$1)","",0]
,[,"([3-7]\\d)(\\d{3})(\\d{3})","$1 $2 $3",["[37][01]|4[0139]|51|6"]
,"0$1","",0]
,[,"([89][09])(\\d{3,6})","$1 $2",["[89][09]"]
,"0$1","",0]
,[,"([58]\\d{2})(\\d{5})","$1 $2",["59|8[1-3]"]
,"0$1","",0]
]
,,[,,"NA","NA"]
,,,[,,"NA","NA"]
,[,,"NA","NA"]
,,,[,,"NA","NA"]
]
,"SJ":[,[,,"0\\d{4}|[4789]\\d{7}","\\d{5}(?:\\d{3})?"]
,[,,"79\\d{6}","\\d{8}",,,"79123456"]
,[,,"(?:4[015-8]|5[89]|9\\d)\\d{6}","\\d{8}",,,"41234567"]
,[,,"80[01]\\d{5}","\\d{8}",,,"80012345"]
,[,,"82[09]\\d{5}","\\d{8}",,,"82012345"]
,[,,"810(?:0[0-6]|[2-8]\\d)\\d{3}","\\d{8}",,,"81021234"]
,[,,"880\\d{5}","\\d{8}",,,"88012345"]
,[,,"85[0-5]\\d{5}","\\d{8}",,,"85012345"]
,"SJ",47,"00",,,,,,,,,,[,,"NA","NA"]
,,,[,,"NA","NA"]
,[,,"0\\d{4}|81(?:0(?:0[7-9]|1\\d)|5\\d{2})\\d{3}","\\d{5}(?:\\d{3})?",,,"01234"]
,1,,[,,"81[23]\\d{5}","\\d{8}",,,"81212345"]
]
,"SK":[,[,,"[2-689]\\d{8}","\\d{9}"]
,[,,"[2-5]\\d{8}","\\d{9}",,,"212345678"]
,[,,"9(?:0[1-8]|1[0-24-9]|4[0489])\\d{6}","\\d{9}",,,"912123456"]
,[,,"800\\d{6}","\\d{9}",,,"800123456"]
,[,,"9(?:[78]\\d{7}|00\\d{6})","\\d{9}",,,"900123456"]
,[,,"8[5-9]\\d{7}","\\d{9}",,,"850123456"]
,[,,"NA","NA"]
,[,,"6(?:5[0-4]|9[0-6])\\d{6}","\\d{9}",,,"690123456"]
,"SK",421,"00","0",,,"0",,,,[[,"(2)(\\d{3})(\\d{3})(\\d{2})","$1/$2 $3 $4",["2"]
,"0$1","",0]
,[,"([3-5]\\d)(\\d{3})(\\d{2})(\\d{2})","$1/$2 $3 $4",["[3-5]"]
,"0$1","",0]
,[,"([689]\\d{2})(\\d{3})(\\d{3})","$1 $2 $3",["[689]"]
,"0$1","",0]
]
,,[,,"NA","NA"]
,,,[,,"(?:8(?:00|[5-9]\\d)|9(?:00|[78]\\d))\\d{6}","\\d{9}",,,"800123456"]
,[,,"96\\d{7}","\\d{9}",,,"961234567"]
,,,[,,"NA","NA"]
]
,"SL":[,[,,"[2-9]\\d{7}","\\d{6,8}"]
,[,,"[235]2[2-4][2-9]\\d{4}","\\d{6,8}",,,"22221234"]
,[,,"(?:2[15]|3[03-5]|4[04]|5[05]|66|7[6-9]|88|99)\\d{6}","\\d{6,8}",,,"25123456"]
,[,,"NA","NA"]
,[,,"NA","NA"]
,[,,"NA","NA"]
,[,,"NA","NA"]
,[,,"NA","NA"]
,"SL",232,"00","0",,,"0",,,,[[,"(\\d{2})(\\d{6})","$1 $2",,"(0$1)","",0]
]
,,[,,"NA","NA"]
,,,[,,"NA","NA"]
,[,,"NA","NA"]
,,,[,,"NA","NA"]
]
,"SM":[,[,,"[05-7]\\d{7,9}","\\d{6,10}"]
,[,,"0549(?:8[0157-9]|9\\d)\\d{4}","\\d{6,10}",,,"0549886377"]
,[,,"6[16]\\d{6}","\\d{8}",,,"66661212"]
,[,,"NA","NA"]
,[,,"7[178]\\d{6}","\\d{8}",,,"71123456"]
,[,,"NA","NA"]
,[,,"NA","NA"]
,[,,"5[158]\\d{6}","\\d{8}",,,"58001110"]
,"SM",378,"00",,,,"(?:0549)?([89]\\d{5})","0549$1",,,[[,"(\\d{2})(\\d{2})(\\d{2})(\\d{2})","$1 $2 $3 $4",["[5-7]"]
,"","",0]
,[,"(0549)(\\d{6})","$1 $2",["0"]
,"","",0]
,[,"(\\d{6})","0549 $1",["[89]"]
,"","",0]
]
,[[,"(\\d{2})(\\d{2})(\\d{2})(\\d{2})","$1 $2 $3 $4",["[5-7]"]
,"","",0]
,[,"(0549)(\\d{6})","($1) $2",["0"]
]
,[,"(\\d{6})","(0549) $1",["[89]"]
]
]
,[,,"NA","NA"]
,,,[,,"NA","NA"]
,[,,"NA","NA"]
,1,,[,,"NA","NA"]
]
,"SN":[,[,,"[3789]\\d{8}","\\d{9}"]
,[,,"3(?:0(?:1[0-2]|80)|282|3(?:8[1-9]|9[3-9])|611|90[1-5])\\d{5}","\\d{9}",,,"301012345"]
,[,,"7(?:[067]\\d|21|8[0-26]|90)\\d{6}","\\d{9}",,,"701234567"]
,[,,"800\\d{6}","\\d{9}",,,"800123456"]
,[,,"88[4689]\\d{6}","\\d{9}",,,"884123456"]
,[,,"81[02468]\\d{6}","\\d{9}",,,"810123456"]
,[,,"NA","NA"]
,[,,"3392\\d{5}|93330\\d{4}","\\d{9}",,,"933301234"]
,"SN",221,"00",,,,,,,,[[,"(\\d{2})(\\d{3})(\\d{2})(\\d{2})","$1 $2 $3 $4",["[379]"]
,"","",0]
,[,"(\\d{3})(\\d{2})(\\d{2})(\\d{2})","$1 $2 $3 $4",["8"]
,"","",0]
]
,,[,,"NA","NA"]
,,,[,,"NA","NA"]
,[,,"NA","NA"]
,,,[,,"NA","NA"]
]
,"SO":[,[,,"[1-79]\\d{6,8}","\\d{7,9}"]
,[,,"(?:1\\d|2[0-79]|3[0-46-8]|4[0-7]|59)\\d{5}","\\d{7}",,,"4012345"]
,[,,"(?:15\\d|2(?:4\\d|8)|6[137-9]?\\d{2}|7[1-9]\\d|907\\d)\\d{5}","\\d{7,9}",,,"71123456"]
,[,,"NA","NA"]
,[,,"NA","NA"]
,[,,"NA","NA"]
,[,,"NA","NA"]
,[,,"NA","NA"]
,"SO",252,"00","0",,,"0",,,,[[,"(\\d)(\\d{6})","$1 $2",["2[0-79]|[13-5]"]
,"","",0]
,[,"(\\d)(\\d{7})","$1 $2",["24|[67]"]
,"","",0]
,[,"(\\d{2})(\\d{5,7})","$1 $2",["15|28|6[1378]"]
,"","",0]
,[,"(69\\d)(\\d{6})","$1 $2",["69"]
,"","",0]
,[,"(90\\d)(\\d{3})(\\d{3})","$1 $2 $3",["90"]
,"","",0]
]
,,[,,"NA","NA"]
,,,[,,"NA","NA"]
,[,,"NA","NA"]
,,,[,,"NA","NA"]
]
,"SR":[,[,,"[2-8]\\d{5,6}","\\d{6,7}"]
,[,,"(?:2[1-3]|3[0-7]|4\\d|5[2-58]|68\\d)\\d{4}","\\d{6,7}",,,"211234"]
,[,,"(?:7[124-7]|8[1-9])\\d{5}","\\d{7}",,,"7412345"]
,[,,"NA","NA"]
,[,,"NA","NA"]
,[,,"NA","NA"]
,[,,"NA","NA"]
,[,,"5(?:6\\d{4}|90[0-4]\\d{3})","\\d{6,7}",,,"561234"]
,"SR",597,"00",,,,,,,,[[,"(\\d{3})(\\d{3})","$1-$2",["[2-4]|5[2-58]"]
,"","",0]
,[,"(\\d{2})(\\d{2})(\\d{2})","$1-$2-$3",["56"]
,"","",0]
,[,"(\\d{3})(\\d{4})","$1-$2",["59|[6-8]"]
,"","",0]
]
,,[,,"NA","NA"]
,,,[,,"NA","NA"]
,[,,"NA","NA"]
,,,[,,"NA","NA"]
]
,"SS":[,[,,"[19]\\d{8}","\\d{9}"]
,[,,"18\\d{7}","\\d{9}",,,"181234567"]
,[,,"(?:12|9[1257])\\d{7}","\\d{9}",,,"977123456"]
,[,,"NA","NA"]
,[,,"NA","NA"]
,[,,"NA","NA"]
,[,,"NA","NA"]
,[,,"NA","NA"]
,"SS",211,"00","0",,,"0",,,,[[,"(\\d{3})(\\d{3})(\\d{3})","$1 $2 $3",,"0$1","",0]
]
,,[,,"NA","NA"]
,,,[,,"NA","NA"]
,[,,"NA","NA"]
,,,[,,"NA","NA"]
]
,"ST":[,[,,"[29]\\d{6}","\\d{7}"]
,[,,"22\\d{5}","\\d{7}",,,"2221234"]
,[,,"9(?:0(?:0[5-9]|[1-9]\\d)|[89]\\d{2})\\d{3}","\\d{7}",,,"9812345"]
,[,,"NA","NA"]
,[,,"NA","NA"]
,[,,"NA","NA"]
,[,,"NA","NA"]
,[,,"NA","NA"]
,"ST",239,"00",,,,,,,,[[,"(\\d{3})(\\d{4})","$1 $2",,"","",0]
]
,,[,,"NA","NA"]
,,,[,,"NA","NA"]
,[,,"NA","NA"]
,,,[,,"NA","NA"]
]
,"SV":[,[,,"[267]\\d{7}|[89]\\d{6}(?:\\d{4})?","\\d{7,8}|\\d{11}"]
,[,,"2[1-6]\\d{6}","\\d{8}",,,"21234567"]
,[,,"[67]\\d{7}","\\d{8}",,,"70123456"]
,[,,"800\\d{4}(?:\\d{4})?","\\d{7}(?:\\d{4})?",,,"8001234"]
,[,,"900\\d{4}(?:\\d{4})?","\\d{7}(?:\\d{4})?",,,"9001234"]
,[,,"NA","NA"]
,[,,"NA","NA"]
,[,,"NA","NA"]
,"SV",503,"00",,,,,,,,[[,"(\\d{4})(\\d{4})","$1 $2",["[267]"]
,"","",0]
,[,"(\\d{3})(\\d{4})","$1 $2",["[89]"]
,"","",0]
,[,"(\\d{3})(\\d{4})(\\d{4})","$1 $2 $3",["[89]"]
,"","",0]
]
,,[,,"NA","NA"]
,,,[,,"NA","NA"]
,[,,"NA","NA"]
,,,[,,"NA","NA"]
]
,"SX":[,[,,"[5789]\\d{9}","\\d{7}(?:\\d{3})?"]
,[,,"7215(?:4[2-8]|8[239]|9[056])\\d{4}","\\d{7}(?:\\d{3})?",,,"7215425678"]
,[,,"7215(?:1[02]|2\\d|5[034679]|8[014-8])\\d{4}","\\d{10}",,,"7215205678"]
,[,,"8(?:00|44|55|66|77|88)[2-9]\\d{6}","\\d{10}",,,"8002123456"]
,[,,"900[2-9]\\d{6}","\\d{10}",,,"9002123456"]
,[,,"NA","NA"]
,[,,"5(?:00|33|44|66|77)[2-9]\\d{6}","\\d{10}",,,"5002345678"]
,[,,"NA","NA"]
,"SX",1,"011","1",,,"1",,,,,,[,,"NA","NA"]
,,"721",[,,"NA","NA"]
,[,,"NA","NA"]
,,,[,,"NA","NA"]
]
,"SY":[,[,,"[1-59]\\d{7,8}","\\d{6,9}"]
,[,,"(?:1(?:1\\d?|4\\d|[2356])|2(?:1\\d?|[235])|3(?:[13]\\d|4)|4[13]|5[1-3])\\d{6}","\\d{6,9}",,,"112345678"]
,[,,"9(?:22|[35][0-8]|4\\d|6[024-9]|88|9[0-489])\\d{6}","\\d{9}",,,"944567890"]
,[,,"NA","NA"]
,[,,"NA","NA"]
,[,,"NA","NA"]
,[,,"NA","NA"]
,[,,"NA","NA"]
,"SY",963,"00","0",,,"0",,,,[[,"(\\d{2})(\\d{3})(\\d{3,4})","$1 $2 $3",["[1-5]"]
,"0$1","",1]
,[,"(9\\d{2})(\\d{3})(\\d{3})","$1 $2 $3",["9"]
,"0$1","",1]
]
,,[,,"NA","NA"]
,,,[,,"NA","NA"]
,[,,"NA","NA"]
,,,[,,"NA","NA"]
]
,"SZ":[,[,,"[027]\\d{7}","\\d{8}"]
,[,,"2[2-5]\\d{6}","\\d{8}",,,"22171234"]
,[,,"7[6-8]\\d{6}","\\d{8}",,,"76123456"]
,[,,"0800\\d{4}","\\d{8}",,,"08001234"]
,[,,"NA","NA"]
,[,,"NA","NA"]
,[,,"NA","NA"]
,[,,"NA","NA"]
,"SZ",268,"00",,,,,,,,[[,"(\\d{4})(\\d{4})","$1 $2",["[027]"]
,"","",0]
]
,,[,,"NA","NA"]
,,,[,,"0800\\d{4}","\\d{8}",,,"08001234"]
,[,,"NA","NA"]
,1,,[,,"NA","NA"]
]
,"TA":[,[,,"8\\d{3}","\\d{4}"]
,[,,"8\\d{3}","\\d{4}",,,"8999"]
,[,,"NA","NA"]
,[,,"NA","NA"]
,[,,"NA","NA"]
,[,,"NA","NA"]
,[,,"NA","NA"]
,[,,"NA","NA"]
,"TA",290,"00",,,,,,,,,,[,,"NA","NA"]
,,,[,,"NA","NA"]
,[,,"NA","NA"]
,,,[,,"NA","NA"]
]
,"TC":[,[,,"[5689]\\d{9}","\\d{7}(?:\\d{3})?"]
,[,,"649(?:712|9(?:4\\d|50))\\d{4}","\\d{7}(?:\\d{3})?",,,"6497121234"]
,[,,"649(?:2(?:3[129]|4[1-7])|3(?:3[1-389]|4[1-7])|4[34][1-3])\\d{4}","\\d{10}",,,"6492311234"]
,[,,"8(?:00|44|55|66|77|88)[2-9]\\d{6}","\\d{10}",,,"8002345678"]
,[,,"900[2-9]\\d{6}","\\d{10}",,,"9002345678"]
,[,,"NA","NA"]
,[,,"5(?:00|33|44|66|77)[2-9]\\d{6}","\\d{10}",,,"5002345678"]
,[,,"64971[01]\\d{4}","\\d{10}",,,"6497101234"]
,"TC",1,"011","1",,,"1",,,,,,[,,"NA","NA"]
,,"649",[,,"NA","NA"]
,[,,"NA","NA"]
,,,[,,"NA","NA"]
]
,"TD":[,[,,"[2679]\\d{7}","\\d{8}"]
,[,,"22(?:[3789]0|5[0-5]|6[89])\\d{4}","\\d{8}",,,"22501234"]
,[,,"(?:6[02368]\\d|77\\d|9\\d{2})\\d{5}","\\d{8}",,,"63012345"]
,[,,"NA","NA"]
,[,,"NA","NA"]
,[,,"NA","NA"]
,[,,"NA","NA"]
,[,,"NA","NA"]
,"TD",235,"00|16",,,,,,"00",,[[,"(\\d{2})(\\d{2})(\\d{2})(\\d{2})","$1 $2 $3 $4",,"","",0]
]
,,[,,"NA","NA"]
,,,[,,"NA","NA"]
,[,,"NA","NA"]
,,,[,,"NA","NA"]
]
,"TG":[,[,,"[29]\\d{7}","\\d{8}"]
,[,,"2(?:2[2-7]|3[23]|44|55|66|77)\\d{5}","\\d{8}",,,"22212345"]
,[,,"9[0-389]\\d{6}","\\d{8}",,,"90112345"]
,[,,"NA","NA"]
,[,,"NA","NA"]
,[,,"NA","NA"]
,[,,"NA","NA"]
,[,,"NA","NA"]
,"TG",228,"00",,,,,,,,[[,"(\\d{2})(\\d{2})(\\d{2})(\\d{2})","$1 $2 $3 $4",,"","",0]
]
,,[,,"NA","NA"]
,,,[,,"NA","NA"]
,[,,"NA","NA"]
,,,[,,"NA","NA"]
]
,"TH":[,[,,"[2-9]\\d{7,8}|1\\d{3}(?:\\d{5,6})?","\\d{4}|\\d{8,10}"]
,[,,"(?:2\\d|3[2-9]|4[2-5]|5[2-6]|7[3-7])\\d{6}","\\d{8}",,,"21234567"]
,[,,"(?:14|6[1-3]|[89]\\d)\\d{7}","\\d{9}",,,"812345678"]
,[,,"1800\\d{6}","\\d{10}",,,"1800123456"]
,[,,"1900\\d{6}","\\d{10}",,,"1900123456"]
,[,,"NA","NA"]
,[,,"NA","NA"]
,[,,"6[08]\\d{7}","\\d{9}",,,"601234567"]
,"TH",66,"00","0",,,"0",,,,[[,"(2)(\\d{3})(\\d{4})","$1 $2 $3",["2"]
,"0$1","",0]
,[,"([13-9]\\d)(\\d{3})(\\d{3,4})","$1 $2 $3",["14|[3-9]"]
,"0$1","",0]
,[,"(1[89]00)(\\d{3})(\\d{3})","$1 $2 $3",["1"]
,"$1","",0]
]
,,[,,"NA","NA"]
,,,[,,"1\\d{3}","\\d{4}",,,"1100"]
,[,,"1\\d{3}","\\d{4}",,,"1100"]
,,,[,,"NA","NA"]
]
,"TJ":[,[,,"[3-59]\\d{8}","\\d{3,9}"]
,[,,"(?:3(?:1[3-5]|2[245]|3[12]|4[24-7]|5[25]|72)|4(?:46|74|87))\\d{6}","\\d{3,9}",,,"372123456"]
,[,,"(?:50[125]|9[0-35-9]\\d)\\d{6}","\\d{9}",,,"917123456"]
,[,,"NA","NA"]
,[,,"NA","NA"]
,[,,"NA","NA"]
,[,,"NA","NA"]
,[,,"NA","NA"]
,"TJ",992,"810","8",,,"8",,"8~10",,[[,"([349]\\d{2})(\\d{2})(\\d{4})","$1 $2 $3",["[34]7|91[78]"]
,"(8) $1","",1]
,[,"([459]\\d)(\\d{3})(\\d{4})","$1 $2 $3",["4[48]|5|9(?:1[59]|[0235-9])"]
,"(8) $1","",1]
,[,"(331700)(\\d)(\\d{2})","$1 $2 $3",["331","3317","33170","331700"]
,"(8) $1","",1]
,[,"(\\d{4})(\\d)(\\d{4})","$1 $2 $3",["3[1-5]","3(?:[1245]|3(?:[02-9]|1[0-589]))"]
,"(8) $1","",1]
]
,,[,,"NA","NA"]
,,,[,,"NA","NA"]
,[,,"NA","NA"]
,,,[,,"NA","NA"]
]
,"TK":[,[,,"[2-9]\\d{3}","\\d{4}"]
,[,,"[2-4]\\d{3}","\\d{4}",,,"3010"]
,[,,"[5-9]\\d{3}","\\d{4}",,,"5190"]
,[,,"NA","NA"]
,[,,"NA","NA"]
,[,,"NA","NA"]
,[,,"NA","NA"]
,[,,"NA","NA"]
,"TK",690,"00",,,,,,,,,,[,,"NA","NA"]
,,,[,,"NA","NA"]
,[,,"NA","NA"]
,,,[,,"NA","NA"]
]
,"TL":[,[,,"[2-489]\\d{6}|7\\d{6,7}","\\d{7,8}"]
,[,,"(?:2[1-5]|3[1-9]|4[1-4])\\d{5}","\\d{7}",,,"2112345"]
,[,,"7[3-8]\\d{6}","\\d{8}",,,"77212345"]
,[,,"80\\d{5}","\\d{7}",,,"8012345"]
,[,,"90\\d{5}","\\d{7}",,,"9012345"]
,[,,"NA","NA"]
,[,,"70\\d{5}","\\d{7}",,,"7012345"]
,[,,"NA","NA"]
,"TL",670,"00",,,,,,,,[[,"(\\d{3})(\\d{4})","$1 $2",["[2-489]"]
,"","",0]
,[,"(\\d{4})(\\d{4})","$1 $2",["7"]
,"","",0]
]
,,[,,"NA","NA"]
,,,[,,"NA","NA"]
,[,,"NA","NA"]
,,,[,,"NA","NA"]
]
,"TM":[,[,,"[1-6]\\d{7}","\\d{8}"]
,[,,"(?:1(?:2\\d|3[1-9])|2(?:22|4[0-35-8])|3(?:22|4[03-9])|4(?:22|3[128]|4\\d|6[15])|5(?:22|5[7-9]|6[014-689]))\\d{5}","\\d{8}",,,"12345678"]
,[,,"6[2-9]\\d{6}","\\d{8}",,,"66123456"]
,[,,"NA","NA"]
,[,,"NA","NA"]
,[,,"NA","NA"]
,[,,"NA","NA"]
,[,,"NA","NA"]
,"TM",993,"810","8",,,"8",,"8~10",,[[,"(\\d{2})(\\d{2})(\\d{2})(\\d{2})","$1 $2-$3-$4",["12"]
,"(8 $1)","",0]
,[,"(\\d{2})(\\d{6})","$1 $2",["6"]
,"8 $1","",0]
,[,"(\\d{3})(\\d)(\\d{2})(\\d{2})","$1 $2-$3-$4",["13|[2-5]"]
,"(8 $1)","",0]
]
,,[,,"NA","NA"]
,,,[,,"NA","NA"]
,[,,"NA","NA"]
,,,[,,"NA","NA"]
]
,"TN":[,[,,"[2-57-9]\\d{7}","\\d{8}"]
,[,,"3[012]\\d{6}|7\\d{7}|81200\\d{3}","\\d{8}",,,"71234567"]
,[,,"(?:[259]\\d|4[0-24])\\d{6}","\\d{8}",,,"20123456"]
,[,,"8010\\d{4}","\\d{8}",,,"80101234"]
,[,,"88\\d{6}","\\d{8}",,,"88123456"]
,[,,"8[12]10\\d{4}","\\d{8}",,,"81101234"]
,[,,"NA","NA"]
,[,,"NA","NA"]
,"TN",216,"00",,,,,,,,[[,"(\\d{2})(\\d{3})(\\d{3})","$1 $2 $3",,"","",0]
]
,,[,,"NA","NA"]
,,,[,,"NA","NA"]
,[,,"NA","NA"]
,,,[,,"NA","NA"]
]
,"TO":[,[,,"[02-8]\\d{4,6}","\\d{5,7}"]
,[,,"(?:2\\d|3[1-8]|4[1-4]|[56]0|7[0149]|8[05])\\d{3}","\\d{5}",,,"20123"]
,[,,"(?:7[578]|8[47-9])\\d{5}","\\d{7}",,,"7715123"]
,[,,"0800\\d{3}","\\d{7}",,,"0800222"]
,[,,"NA","NA"]
,[,,"NA","NA"]
,[,,"NA","NA"]
,[,,"NA","NA"]
,"TO",676,"00",,,,,,,,[[,"(\\d{2})(\\d{3})","$1-$2",["[1-6]|7[0-4]|8[05]"]
,"","",0]
,[,"(\\d{3})(\\d{4})","$1 $2",["7[5-9]|8[47-9]"]
,"","",0]
,[,"(\\d{4})(\\d{3})","$1 $2",["0"]
,"","",0]
]
,,[,,"NA","NA"]
,,,[,,"NA","NA"]
,[,,"NA","NA"]
,1,,[,,"NA","NA"]
]
,"TR":[,[,,"[2-589]\\d{9}|444\\d{4}","\\d{7,10}"]
,[,,"(?:2(?:[13][26]|[28][2468]|[45][268]|[67][246])|3(?:[13][28]|[24-6][2468]|[78][02468]|92)|4(?:[16][246]|[23578][2468]|4[26]))\\d{7}","\\d{10}",,,"2123456789"]
,[,,"5(?:0[1-7]|22|[34]\\d|5[1-59]|9[246])\\d{7}","\\d{10}",,,"5012345678"]
,[,,"800\\d{7}","\\d{10}",,,"8001234567"]
,[,,"900\\d{7}","\\d{10}",,,"9001234567"]
,[,,"NA","NA"]
,[,,"NA","NA"]
,[,,"NA","NA"]
,"TR",90,"00","0",,,"0",,,,[[,"(\\d{3})(\\d{3})(\\d{4})","$1 $2 $3",["[23]|4(?:[0-35-9]|4[0-35-9])"]
,"(0$1)","",1]
,[,"(\\d{3})(\\d{3})(\\d{4})","$1 $2 $3",["[589]"]
,"0$1","",1]
,[,"(444)(\\d{1})(\\d{3})","$1 $2 $3",["444"]
,"","",0]
]
,,[,,"512\\d{7}","\\d{10}",,,"5123456789"]
,,,[,,"444\\d{4}","\\d{7}",,,"4441444"]
,[,,"444\\d{4}|850\\d{7}","\\d{7,10}",,,"4441444"]
,,,[,,"NA","NA"]
]
,"TT":[,[,,"[589]\\d{9}","\\d{7}(?:\\d{3})?"]
,[,,"868(?:2(?:01|2[1-5]|3[1-5])|6(?:0[79]|1[02-8]|2[1-9]|[3-69]\\d|7[0-79])|82[124])\\d{4}","\\d{7}(?:\\d{3})?",,,"8682211234"]
,[,,"868(?:2(?:[789]\\d)|3(?:0[1-9]|1[02-9]|[2-9]\\d)|4[6-9]\\d|6(?:20|78|8\\d)|7(?:0[1-9]|1[02-9]|[2-9]\\d))\\d{4}","\\d{10}",,,"8682911234"]
,[,,"8(?:00|44|55|66|77|88)[2-9]\\d{6}","\\d{10}",,,"8002345678"]
,[,,"900[2-9]\\d{6}","\\d{10}",,,"9002345678"]
,[,,"NA","NA"]
,[,,"5(?:00|33|44|66|77)[2-9]\\d{6}","\\d{10}",,,"5002345678"]
,[,,"NA","NA"]
,"TT",1,"011","1",,,"1",,,,,,[,,"NA","NA"]
,,"868",[,,"NA","NA"]
,[,,"NA","NA"]
,,,[,,"868619\\d{4}","\\d{10}"]
]
,"TV":[,[,,"[29]\\d{4,5}","\\d{5,6}"]
,[,,"2[02-9]\\d{3}","\\d{5}",,,"20123"]
,[,,"90\\d{4}","\\d{6}",,,"901234"]
,[,,"NA","NA"]
,[,,"NA","NA"]
,[,,"NA","NA"]
,[,,"NA","NA"]
,[,,"NA","NA"]
,"TV",688,"00",,,,,,,,,,[,,"NA","NA"]
,,,[,,"NA","NA"]
,[,,"NA","NA"]
,,,[,,"NA","NA"]
]
,"TW":[,[,,"[2-689]\\d{7,8}|7\\d{7,9}","\\d{8,10}"]
,[,,"[2-8]\\d{7,8}","\\d{8,9}",,,"21234567"]
,[,,"9\\d{8}","\\d{9}",,,"912345678"]
,[,,"800\\d{6}","\\d{9}",,,"800123456"]
,[,,"900\\d{6}","\\d{9}",,,"900123456"]
,[,,"NA","NA"]
,[,,"NA","NA"]
,[,,"70\\d{8}","\\d{10}",,,"7012345678"]
,"TW",886,"0(?:0[25679]|19)","0","#",,"0",,,,[[,"([2-8])(\\d{3,4})(\\d{4})","$1 $2 $3",["[2-6]|[78][1-9]"]
,"0$1","",0]
,[,"([89]\\d{2})(\\d{3})(\\d{3})","$1 $2 $3",["80|9"]
,"0$1","",0]
,[,"(70)(\\d{4})(\\d{4})","$1 $2 $3",["70"]
,"0$1","",0]
]
,,[,,"NA","NA"]
,,,[,,"NA","NA"]
,[,,"NA","NA"]
,,,[,,"NA","NA"]
]
,"TZ":[,[,,"\\d{9}","\\d{7,9}"]
,[,,"2[2-8]\\d{7}","\\d{7,9}",,,"222345678"]
,[,,"(?:6[1578]|7[1-9])\\d{7}","\\d{9}",,,"612345678"]
,[,,"80[08]\\d{6}","\\d{9}",,,"800123456"]
,[,,"90\\d{7}","\\d{9}",,,"900123456"]
,[,,"8(?:40|6[01])\\d{6}","\\d{9}",,,"840123456"]
,[,,"NA","NA"]
,[,,"41\\d{7}","\\d{9}",,,"412345678"]
,"TZ",255,"00[056]","0",,,"0",,,,[[,"([24]\\d)(\\d{3})(\\d{4})","$1 $2 $3",["[24]"]
,"0$1","",0]
,[,"([67]\\d{2})(\\d{3})(\\d{3})","$1 $2 $3",["[67]"]
,"0$1","",0]
,[,"([89]\\d{2})(\\d{2})(\\d{4})","$1 $2 $3",["[89]"]
,"0$1","",0]
]
,,[,,"NA","NA"]
,,,[,,"NA","NA"]
,[,,"NA","NA"]
,,,[,,"NA","NA"]
]
,"UA":[,[,,"[3-9]\\d{8}","\\d{5,9}"]
,[,,"(?:3[1-8]|4[13-8]|5[1-7]|6[12459])\\d{7}","\\d{5,9}",,,"311234567"]
,[,,"(?:39|50|6[36-8]|73|9[1-9])\\d{7}","\\d{9}",,,"391234567"]
,[,,"800\\d{6}","\\d{9}",,,"800123456"]
,[,,"900\\d{6}","\\d{9}",,,"900123456"]
,[,,"NA","NA"]
,[,,"NA","NA"]
,[,,"89\\d{7}","\\d{9}",,,"891234567"]
,"UA",380,"00","0",,,"0",,"0~0",,[[,"([3-9]\\d)(\\d{3})(\\d{4})","$1 $2 $3",["[38]9|4(?:[45][0-5]|87)|5(?:0|6[37]|7[37])|6[36-8]|73|9[1-9]","[38]9|4(?:[45][0-5]|87)|5(?:0|6(?:3[14-7]|7)|7[37])|6[36-8]|73|9[1-9]"]
,"0$1","",0]
,[,"([3-689]\\d{2})(\\d{3})(\\d{3})","$1 $2 $3",["3[1-8]2|4[13678]2|5(?:[12457]2|6[24])|6(?:[49]2|[12][29]|5[24])|8[0-8]|90","3(?:[1-46-8]2[013-9]|52)|4(?:[1378]2|62[013-9])|5(?:[12457]2|6[24])|6(?:[49]2|[12][29]|5[24])|8[0-8]|90"]
,"0$1","",0]
,[,"([3-6]\\d{3})(\\d{5})","$1 $2",["3(?:5[013-9]|[1-46-8])|4(?:[137][013-9]|6|[45][6-9]|8[4-6])|5(?:[1245][013-9]|6[0135-9]|3|7[4-6])|6(?:[49][013-9]|5[0135-9]|[12][13-8])","3(?:5[013-9]|[1-46-8](?:22|[013-9]))|4(?:[137][013-9]|6(?:[013-9]|22)|[45][6-9]|8[4-6])|5(?:[1245][013-9]|6(?:3[02389]|[015689])|3|7[4-6])|6(?:[49][013-9]|5[0135-9]|[12][13-8])"]
,"0$1","",0]
]
,,[,,"NA","NA"]
,,,[,,"NA","NA"]
,[,,"NA","NA"]
,,,[,,"NA","NA"]
]
,"UG":[,[,,"\\d{9}","\\d{5,9}"]
,[,,"20(?:[0147]\\d{2}|2(?:40|[5-9]\\d)|3[23]\\d|5[0-4]\\d|6[03]\\d|8[0-2]\\d)\\d{4}|[34]\\d{8}","\\d{5,9}",,,"312345678"]
,[,,"2030\\d{5}|7(?:0[0-7]|[15789]\\d|2[03]|30|[46][0-4])\\d{6}","\\d{9}",,,"712345678"]
,[,,"800[123]\\d{5}","\\d{9}",,,"800123456"]
,[,,"90[123]\\d{6}","\\d{9}",,,"901123456"]
,[,,"NA","NA"]
,[,,"NA","NA"]
,[,,"NA","NA"]
,"UG",256,"00[057]","0",,,"0",,,,[[,"(\\d{3})(\\d{6})","$1 $2",["[7-9]|20(?:[013-8]|2[5-9])|4(?:6[45]|[7-9])"]
,"0$1","",0]
,[,"(\\d{2})(\\d{7})","$1 $2",["3|4(?:[1-5]|6[0-36-9])"]
,"0$1","",0]
,[,"(2024)(\\d{5})","$1 $2",["2024"]
,"0$1","",0]
]
,,[,,"NA","NA"]
,,,[,,"NA","NA"]
,[,,"NA","NA"]
,,,[,,"NA","NA"]
]
,"US":[,[,,"[2-9]\\d{9}","\\d{7}(?:\\d{3})?"]
,[,,"(?:2(?:0[1-35-9]|1[02-9]|2[04589]|3[149]|4[08]|5[1-46]|6[0279]|7[026]|8[13])|3(?:0[1-57-9]|1[02-9]|2[0135]|3[014679]|4[67]|5[12]|6[014]|8[56])|4(?:0[124-9]|1[02-579]|2[3-5]|3[0245]|4[0235]|58|69|7[0589]|8[04])|5(?:0[1-57-9]|1[0235-8]|20|3[0149]|4[01]|5[19]|6[1-37]|7[013-5]|8[056])|6(?:0[1-35-9]|1[024-9]|2[03689]|3[016]|4[16]|5[017]|6[0-279]|78|8[12])|7(?:0[1-46-8]|1[02-9]|2[0457]|3[1247]|4[07]|5[47]|6[02359]|7[02-59]|8[156])|8(?:0[1-68]|1[02-8]|28|3[0-25]|4[3578]|5[06-9]|6[02-5]|7[028])|9(?:0[1346-9]|1[02-9]|2[0589]|3[01678]|4[0179]|5[12469]|7[0-3589]|8[0459]))[2-9]\\d{6}","\\d{7}(?:\\d{3})?",,,"2015555555"]
,[,,"(?:2(?:0[1-35-9]|1[02-9]|2[04589]|3[149]|4[08]|5[1-46]|6[0279]|7[026]|8[13])|3(?:0[1-57-9]|1[02-9]|2[0135]|3[014679]|4[67]|5[12]|6[014]|8[56])|4(?:0[124-9]|1[02-579]|2[3-5]|3[0245]|4[0235]|58|69|7[0589]|8[04])|5(?:0[1-57-9]|1[0235-8]|20|3[0149]|4[01]|5[19]|6[1-37]|7[013-5]|8[056])|6(?:0[1-35-9]|1[024-9]|2[03689]|3[016]|4[16]|5[017]|6[0-279]|78|8[12])|7(?:0[1-46-8]|1[02-9]|2[0457]|3[1247]|4[07]|5[47]|6[02359]|7[02-59]|8[156])|8(?:0[1-68]|1[02-8]|28|3[0-25]|4[3578]|5[06-9]|6[02-5]|7[028])|9(?:0[1346-9]|1[02-9]|2[0589]|3[01678]|4[0179]|5[12469]|7[0-3589]|8[0459]))[2-9]\\d{6}","\\d{7}(?:\\d{3})?",,,"2015555555"]
,[,,"8(?:00|44|55|66|77|88)[2-9]\\d{6}","\\d{10}",,,"8002345678"]
,[,,"900[2-9]\\d{6}","\\d{10}",,,"9002345678"]
,[,,"NA","NA"]
,[,,"5(?:00|33|44|66|77)[2-9]\\d{6}","\\d{10}",,,"5002345678"]
,[,,"NA","NA"]
,"US",1,"011","1",,,"1",,,1,[[,"(\\d{3})(\\d{4})","$1-$2",,"","",1]
,[,"(\\d{3})(\\d{3})(\\d{4})","($1) $2-$3",,"","",1]
]
,[[,"(\\d{3})(\\d{3})(\\d{4})","$1-$2-$3"]
]
,[,,"NA","NA"]
,1,,[,,"NA","NA"]
,[,,"NA","NA"]
,,,[,,"NA","NA"]
]
,"UY":[,[,,"[2489]\\d{6,7}","\\d{7,8}"]
,[,,"2\\d{7}|4[2-7]\\d{6}","\\d{7,8}",,,"21231234"]
,[,,"9[1-9]\\d{6}","\\d{8}",,,"94231234"]
,[,,"80[05]\\d{4}","\\d{7}",,,"8001234"]
,[,,"90[0-8]\\d{4}","\\d{7}",,,"9001234"]
,[,,"NA","NA"]
,[,,"NA","NA"]
,[,,"NA","NA"]
,"UY",598,"0(?:1[3-9]\\d|0)","0"," int. ",,"0",,"00",,[[,"(\\d{4})(\\d{4})","$1 $2",["[24]"]
,"","",0]
,[,"(\\d{2})(\\d{3})(\\d{3})","$1 $2 $3",["9[1-9]"]
,"0$1","",0]
,[,"(\\d{3})(\\d{4})","$1 $2",["[89]0"]
,"0$1","",0]
]
,,[,,"NA","NA"]
,,,[,,"NA","NA"]
,[,,"NA","NA"]
,,,[,,"NA","NA"]
]
,"UZ":[,[,,"[679]\\d{8}","\\d{7,9}"]
,[,,"(?:6(?:1(?:22|3[124]|4[1-4]|5[123578]|64)|2(?:22|3[0-57-9]|41)|5(?:22|3[3-7]|5[024-8])|6\\d{2}|7(?:[23]\\d|7[69])|9(?:22|4[1-8]|6[135]))|7(?:0(?:5[4-9]|6[0146]|7[12456]|9[135-8])|1[12]\\d|2(?:22|3[1345789]|4[123579]|5[14])|3(?:2\\d|3[1578]|4[1-35-7]|5[1-57]|61)|4(?:2\\d|3[1-579]|7[1-79])|5(?:22|5[1-9]|6[1457])|6(?:22|3[12457]|4[13-8])|9(?:22|5[1-9])))\\d{5}","\\d{7,9}",,,"662345678"]
,[,,"6(?:1(?:2(?:98|2[01])|35[0-4]|50\\d|61[23]|7(?:[01][017]|4\\d|55|9[5-9]))|2(?:11\\d|2(?:[12]1|9[01379])|5(?:[126]\\d|3[0-4])|7\\d{2})|5(?:19[01]|2(?:27|9[26])|30\\d|59\\d|7\\d{2})|6(?:2(?:1[5-9]|2[0367]|38|41|52|60)|3[79]\\d|4(?:56|83)|7(?:[07]\\d|1[017]|3[07]|4[047]|5[057]|67|8[0178]|9[79])|9[0-3]\\d)|7(?:2(?:24|3[237]|4[5-9]|7[15-8])|5(?:7[12]|8[0589])|7(?:0\\d|[39][07])|9(?:0\\d|7[079]))|9(?:2(?:1[1267]|5\\d|3[01]|7[0-4])|5[67]\\d|6(?:2[0-26]|8\\d)|7\\d{2}))\\d{4}|7(?:0\\d{3}|1(?:13[01]|6(?:0[47]|1[67]|66)|71[3-69]|98\\d)|2(?:2(?:2[79]|95)|3(?:2[5-9]|6[0-6])|57\\d|7(?:0\\d|1[17]|2[27]|3[37]|44|5[057]|66|88))|3(?:2(?:1[0-6]|21|3[469]|7[159])|33\\d|5(?:0[0-4]|5[579]|9\\d)|7(?:[0-3579]\\d|4[0467]|6[67]|8[078])|9[4-6]\\d)|4(?:2(?:29|5[0257]|6[0-7]|7[1-57])|5(?:1[0-4]|8\\d|9[5-9])|7(?:0\\d|1[024589]|2[0127]|3[0137]|[46][07]|5[01]|7[5-9]|9[079])|9(?:7[015-9]|[89]\\d))|5(?:112|2(?:0\\d|2[29]|[49]4)|3[1568]\\d|52[6-9]|7(?:0[01578]|1[017]|[23]7|4[047]|[5-7]\\d|8[78]|9[079]))|6(?:2(?:2[1245]|4[2-4])|39\\d|41[179]|5(?:[349]\\d|5[0-2])|7(?:0[017]|[13]\\d|22|44|55|67|88))|9(?:22[128]|3(?:2[0-4]|7\\d)|57[05629]|7(?:2[05-9]|3[37]|4\\d|60|7[2579]|87|9[07])))\\d{4}|9[0-57-9]\\d{7}","\\d{7,9}",,,"912345678"]
,[,,"NA","NA"]
,[,,"NA","NA"]
,[,,"NA","NA"]
,[,,"NA","NA"]
,[,,"NA","NA"]
,"UZ",998,"810","8",,,"8",,"8~10",,[[,"([679]\\d)(\\d{3})(\\d{2})(\\d{2})","$1 $2 $3 $4",,"8 $1","",0]
]
,,[,,"NA","NA"]
,,,[,,"NA","NA"]
,[,,"NA","NA"]
,,,[,,"NA","NA"]
]
,"VA":[,[,,"(?:0(?:878\\d{5}|6698\\d{5})|[1589]\\d{5,10}|3(?:[12457-9]\\d{8}|[36]\\d{7,9}))","\\d{6,11}"]
,[,,"06698\\d{5}","\\d{10}",,,"0669812345"]
,[,,"3(?:[12457-9]\\d{8}|6\\d{7,8}|3\\d{7,9})","\\d{9,11}",,,"3123456789"]
,[,,"80(?:0\\d{6}|3\\d{3})","\\d{6,9}",,,"800123456"]
,[,,"0878\\d{5}|1(?:44|6[346])\\d{6}|89(?:2\\d{3}|4(?:[0-4]\\d{2}|[5-9]\\d{4})|5(?:[0-4]\\d{2}|[5-9]\\d{6})|9\\d{6})","\\d{6,10}",,,"899123456"]
,[,,"84(?:[08]\\d{6}|[17]\\d{3})","\\d{6,9}",,,"848123456"]
,[,,"1(?:78\\d|99)\\d{6}","\\d{9,10}",,,"1781234567"]
,[,,"55\\d{8}","\\d{10}",,,"5512345678"]
,"VA",39,"00",,,,,,,,,,[,,"NA","NA"]
,,,[,,"848\\d{6}","\\d{9}",,,"848123456"]
,[,,"NA","NA"]
,1,,[,,"NA","NA"]
]
,"VC":[,[,,"[5789]\\d{9}","\\d{7}(?:\\d{3})?"]
,[,,"784(?:266|3(?:6[6-9]|7\\d|8[0-24-6])|4(?:38|5[0-36-8]|8[0-8])|5(?:55|7[0-2]|93)|638|784)\\d{4}","\\d{7}(?:\\d{3})?",,,"7842661234"]
,[,,"784(?:4(?:3[0-4]|5[45]|89|9[0-5])|5(?:2[6-9]|3[0-4]))\\d{4}","\\d{10}",,,"7844301234"]
,[,,"8(?:00|44|55|66|77|88)[2-9]\\d{6}","\\d{10}",,,"8002345678"]
,[,,"900[2-9]\\d{6}","\\d{10}",,,"9002345678"]
,[,,"NA","NA"]
,[,,"5(?:00|33|44|66|77)[2-9]\\d{6}","\\d{10}",,,"5002345678"]
,[,,"NA","NA"]
,"VC",1,"011","1",,,"1",,,,,,[,,"NA","NA"]
,,"784",[,,"NA","NA"]
,[,,"NA","NA"]
,,,[,,"NA","NA"]
]
,"VE":[,[,,"[24589]\\d{9}","\\d{7,10}"]
,[,,"(?:2(?:12|3[457-9]|[58][1-9]|[467]\\d|9[1-6])|50[01])\\d{7}","\\d{7,10}",,,"2121234567"]
,[,,"4(?:1[24-8]|2[46])\\d{7}","\\d{10}",,,"4121234567"]
,[,,"800\\d{7}","\\d{10}",,,"8001234567"]
,[,,"900\\d{7}","\\d{10}",,,"9001234567"]
,[,,"NA","NA"]
,[,,"NA","NA"]
,[,,"NA","NA"]
,"VE",58,"00","0",,,"0",,,,[[,"(\\d{3})(\\d{7})","$1-$2",,"0$1","$CC $1",0]
]
,,[,,"NA","NA"]
,,,[,,"NA","NA"]
,[,,"NA","NA"]
,,,[,,"NA","NA"]
]
,"VG":[,[,,"[2589]\\d{9}","\\d{7}(?:\\d{3})?"]
,[,,"284(?:(?:229|4(?:22|9[45])|774|8(?:52|6[459]))\\d{4}|496[0-5]\\d{3})","\\d{7}(?:\\d{3})?",,,"2842291234"]
,[,,"284(?:(?:3(?:0[0-3]|4[0-367])|4(?:4[0-6]|68|99)|54[0-57])\\d{4}|496[6-9]\\d{3})","\\d{10}",,,"2843001234"]
,[,,"8(?:00|44|55|66|77|88)[2-9]\\d{6}","\\d{10}",,,"8002345678"]
,[,,"900[2-9]\\d{6}","\\d{10}",,,"9002345678"]
,[,,"NA","NA"]
,[,,"5(?:00|33|44|66|77)[2-9]\\d{6}","\\d{10}",,,"5002345678"]
,[,,"NA","NA"]
,"VG",1,"011","1",,,"1",,,,,,[,,"NA","NA"]
,,"284",[,,"NA","NA"]
,[,,"NA","NA"]
,,,[,,"NA","NA"]
]
,"VI":[,[,,"[3589]\\d{9}","\\d{7}(?:\\d{3})?"]
,[,,"340(?:2(?:01|2[0678]|44|77)|3(?:32|44)|4(?:22|7[34])|5(?:1[34]|55)|6(?:26|4[23]|77|9[023])|7(?:1[2-589]|27|7\\d)|884|998)\\d{4}","\\d{7}(?:\\d{3})?",,,"3406421234"]
,[,,"340(?:2(?:01|2[0678]|44|77)|3(?:32|44)|4(?:22|7[34])|5(?:1[34]|55)|6(?:26|4[23]|77|9[023])|7(?:1[2-589]|27|7\\d)|884|998)\\d{4}","\\d{7}(?:\\d{3})?",,,"3406421234"]
,[,,"8(?:00|44|55|66|77|88)[2-9]\\d{6}","\\d{10}",,,"8002345678"]
,[,,"900[2-9]\\d{6}","\\d{10}",,,"9002345678"]
,[,,"NA","NA"]
,[,,"5(?:00|33|44|66|77)[2-9]\\d{6}","\\d{10}",,,"5002345678"]
,[,,"NA","NA"]
,"VI",1,"011","1",,,"1",,,1,,,[,,"NA","NA"]
,,"340",[,,"NA","NA"]
,[,,"NA","NA"]
,,,[,,"NA","NA"]
]
,"VN":[,[,,"[17]\\d{6,9}|[2-69]\\d{7,9}|8\\d{6,8}","\\d{7,10}"]
,[,,"(?:2(?:[025-79]|1[0189]|[348][01])|3(?:[0136-9]|[25][01])|4\\d|5(?:[01][01]|[2-9])|6(?:[0-46-8]|5[01])|7(?:[02-79]|[18][01])|8[1-9])\\d{7}","\\d{9,10}",,,"2101234567"]
,[,,"(?:9\\d|1(?:2\\d|6[2-9]|8[68]|99))\\d{7}","\\d{9,10}",,,"912345678"]
,[,,"1800\\d{4,6}","\\d{8,10}",,,"1800123456"]
,[,,"1900\\d{4,6}","\\d{8,10}",,,"1900123456"]
,[,,"NA","NA"]
,[,,"NA","NA"]
,[,,"NA","NA"]
,"VN",84,"00","0",,,"0",,,,[[,"([17]99)(\\d{4})","$1 $2",["[17]99"]
,"0$1","",1]
,[,"([48])(\\d{4})(\\d{4})","$1 $2 $3",["[48]"]
,"0$1","",1]
,[,"([235-7]\\d)(\\d{4})(\\d{3})","$1 $2 $3",["2[025-79]|3[0136-9]|5[2-9]|6[0-46-8]|7[02-79]"]
,"0$1","",1]
,[,"(80)(\\d{5})","$1 $2",["80"]
,"0$1","",1]
,[,"(69\\d)(\\d{4,5})","$1 $2",["69"]
,"0$1","",1]
,[,"([235-7]\\d{2})(\\d{4})(\\d{3})","$1 $2 $3",["2[1348]|3[25]|5[01]|65|7[18]"]
,"0$1","",1]
,[,"(9\\d)(\\d{3})(\\d{2})(\\d{2})","$1 $2 $3 $4",["9"]
,"0$1","",1]
,[,"(1[2689]\\d)(\\d{3})(\\d{4})","$1 $2 $3",["1(?:[26]|8[68]|99)"]
,"0$1","",1]
,[,"(1[89]00)(\\d{4,6})","$1 $2",["1[89]0"]
,"$1","",1]
]
,,[,,"NA","NA"]
,,,[,,"[17]99\\d{4}|69\\d{5,6}","\\d{7,8}",,,"1992000"]
,[,,"[17]99\\d{4}|69\\d{5,6}|80\\d{5}","\\d{7,8}",,,"1992000"]
,,,[,,"NA","NA"]
]
,"VU":[,[,,"[2-57-9]\\d{4,6}","\\d{5,7}"]
,[,,"(?:2[02-9]\\d|3(?:[5-7]\\d|8[0-8])|48[4-9]|88\\d)\\d{2}","\\d{5}",,,"22123"]
,[,,"(?:5(?:7[2-5]|[3-69]\\d)|7[013-7]\\d)\\d{4}","\\d{7}",,,"5912345"]
,[,,"NA","NA"]
,[,,"NA","NA"]
,[,,"NA","NA"]
,[,,"NA","NA"]
,[,,"NA","NA"]
,"VU",678,"00",,,,,,,,[[,"(\\d{3})(\\d{4})","$1 $2",["[579]"]
,"","",0]
]
,,[,,"NA","NA"]
,,,[,,"NA","NA"]
,[,,"3[03]\\d{3}|900\\d{4}","\\d{5,7}",,,"30123"]
,,,[,,"NA","NA"]
]
,"WF":[,[,,"[5-7]\\d{5}","\\d{6}"]
,[,,"(?:50|68|72)\\d{4}","\\d{6}",,,"501234"]
,[,,"(?:50|68|72)\\d{4}","\\d{6}",,,"501234"]
,[,,"NA","NA"]
,[,,"NA","NA"]
,[,,"NA","NA"]
,[,,"NA","NA"]
,[,,"NA","NA"]
,"WF",681,"00",,,,,,,1,[[,"(\\d{2})(\\d{2})(\\d{2})","$1 $2 $3",,"","",0]
]
,,[,,"NA","NA"]
,,,[,,"NA","NA"]
,[,,"NA","NA"]
,,,[,,"NA","NA"]
]
,"WS":[,[,,"[2-8]\\d{4,6}","\\d{5,7}"]
,[,,"(?:[2-5]\\d|6[1-9]|84\\d{2})\\d{3}","\\d{5,7}",,,"22123"]
,[,,"(?:60|7[25-7]\\d)\\d{4}","\\d{6,7}",,,"601234"]
,[,,"800\\d{3}","\\d{6}",,,"800123"]
,[,,"NA","NA"]
,[,,"NA","NA"]
,[,,"NA","NA"]
,[,,"NA","NA"]
,"WS",685,"0",,,,,,,,[[,"(8\\d{2})(\\d{3,4})","$1 $2",["8"]
,"","",0]
,[,"(7\\d)(\\d{5})","$1 $2",["7"]
,"","",0]
,[,"(\\d{5})","$1",["[2-6]"]
,"","",0]
]
,,[,,"NA","NA"]
,,,[,,"NA","NA"]
,[,,"NA","NA"]
,,,[,,"NA","NA"]
]
,"YE":[,[,,"[1-7]\\d{6,8}","\\d{6,9}"]
,[,,"(?:1(?:7\\d|[2-68])|2[2-68]|3[2358]|4[2-58]|5[2-6]|6[3-58]|7[24-68])\\d{5}","\\d{6,8}",,,"1234567"]
,[,,"7[0137]\\d{7}","\\d{9}",,,"712345678"]
,[,,"NA","NA"]
,[,,"NA","NA"]
,[,,"NA","NA"]
,[,,"NA","NA"]
,[,,"NA","NA"]
,"YE",967,"00","0",,,"0",,,,[[,"([1-7])(\\d{3})(\\d{3,4})","$1 $2 $3",["[1-6]|7[24-68]"]
,"0$1","",0]
,[,"(7\\d{2})(\\d{3})(\\d{3})","$1 $2 $3",["7[0137]"]
,"0$1","",0]
]
,,[,,"NA","NA"]
,,,[,,"NA","NA"]
,[,,"NA","NA"]
,,,[,,"NA","NA"]
]
,"YT":[,[,,"[268]\\d{8}","\\d{9}"]
,[,,"269(?:6[0-4]|50)\\d{4}","\\d{9}",,,"269601234"]
,[,,"639\\d{6}","\\d{9}",,,"639123456"]
,[,,"80\\d{7}","\\d{9}",,,"801234567"]
,[,,"NA","NA"]
,[,,"NA","NA"]
,[,,"NA","NA"]
,[,,"NA","NA"]
,"YT",262,"00","0",,,"0",,,,,,[,,"NA","NA"]
,,"269|63",[,,"NA","NA"]
,[,,"NA","NA"]
,,,[,,"NA","NA"]
]
,"ZA":[,[,,"[1-79]\\d{8}|8(?:[067]\\d{7}|[1-4]\\d{3,7})","\\d{5,9}"]
,[,,"(?:1[0-8]|2[0-378]|3[1-69]|4\\d|5[1346-8])\\d{7}","\\d{9}",,,"101234567"]
,[,,"(?:6[0-5]|7[0-46-9])\\d{7}|8[1-4]\\d{3,7}","\\d{5,9}",,,"711234567"]
,[,,"80\\d{7}","\\d{9}",,,"801234567"]
,[,,"86[2-9]\\d{6}|90\\d{7}","\\d{9}",,,"862345678"]
,[,,"860\\d{6}","\\d{9}",,,"860123456"]
,[,,"NA","NA"]
,[,,"87\\d{7}","\\d{9}",,,"871234567"]
,"ZA",27,"00","0",,,"0",,,,[[,"(860)(\\d{3})(\\d{3})","$1 $2 $3",["860"]
,"0$1","",0]
,[,"(\\d{2})(\\d{3})(\\d{4})","$1 $2 $3",["[1-79]|8(?:[0-47]|6[1-9])"]
,"0$1","",0]
,[,"(\\d{2})(\\d{3,4})","$1 $2",["8[1-4]"]
,"0$1","",0]
,[,"(\\d{2})(\\d{3})(\\d{2,3})","$1 $2 $3",["8[1-4]"]
,"0$1","",0]
]
,,[,,"NA","NA"]
,,,[,,"NA","NA"]
,[,,"861\\d{6}","\\d{9}",,,"861123456"]
,,,[,,"NA","NA"]
]
,"ZM":[,[,,"[289]\\d{8}","\\d{9}"]
,[,,"21[1-8]\\d{6}","\\d{9}",,,"211234567"]
,[,,"9(?:5[05]|6\\d|7[1-9])\\d{6}","\\d{9}",,,"955123456"]
,[,,"800\\d{6}","\\d{9}",,,"800123456"]
,[,,"NA","NA"]
,[,,"NA","NA"]
,[,,"NA","NA"]
,[,,"NA","NA"]
,"ZM",260,"00","0",,,"0",,,,[[,"([29]\\d)(\\d{7})","$1 $2",["[29]"]
,"0$1","",0]
,[,"(800)(\\d{3})(\\d{3})","$1 $2 $3",["8"]
,"0$1","",0]
]
,,[,,"NA","NA"]
,,,[,,"NA","NA"]
,[,,"NA","NA"]
,,,[,,"NA","NA"]
]
,"ZW":[,[,,"2(?:[012457-9]\\d{3,8}|6(?:[14]\\d{7}|\\d{4}))|[13-79]\\d{4,9}|8[06]\\d{8}","\\d{3,10}"]
,[,,"(?:2(?:0(?:4\\d|5\\d{2})|2[278]\\d|48\\d|7(?:[1-7]\\d|[089]\\d{2})|8(?:[2-57-9]|[146]\\d{2})|98)|3(?:08|17|3[78]|7(?:[19]|[56]\\d)|8[37]|98)|5[15][78]|6(?:28\\d{2}|[36]7|75\\d|[69]8|8(?:7\\d|8)))\\d{3}|(?:2(?:1[39]|2[0157]|6[14]|7[35]|84)|329)\\d{7}|(?:1(?:3\\d{2}|9\\d|[4-8])|2(?:0\\d{2}|[569]\\d)|3(?:[26]|[013459]\\d)|5(?:0|5\\d{2}|[689]\\d)|6(?:[39]|[01246]\\d|[78]\\d{2}))\\d{3}|(?:29\\d|39|54)\\d{6}|(?:(?:25|54)83|2582\\d)\\d{3}|(?:4\\d{6,7}|9[2-9]\\d{4,5})","\\d{3,10}",,,"1312345"]
,[,,"7[1378]\\d{7}","\\d{9}",,,"711234567"]
,[,,"800\\d{7}","\\d{10}",,,"8001234567"]
,[,,"NA","NA"]
,[,,"NA","NA"]
,[,,"NA","NA"]
,[,,"86(?:1[12]|30|44|55|77|8[367]|99)\\d{6}","\\d{10}",,,"8686123456"]
,"ZW",263,"00","0",,,"0",,,,[[,"([49])(\\d{3})(\\d{2,4})","$1 $2 $3",["4|9[2-9]"]
,"0$1","",0]
,[,"(7\\d)(\\d{3})(\\d{3,4})","$1 $2 $3",["7"]
,"0$1","",0]
,[,"(86\\d{2})(\\d{3})(\\d{3})","$1 $2 $3",["86[24]"]
,"0$1","",0]
,[,"([2356]\\d{2})(\\d{3,5})","$1 $2",["2(?:0[45]|2[278]|[49]8|[78])|3(?:08|17|3[78]|7[1569]|8[37]|98)|5[15][78]|6(?:[29]8|[38]7|6[78]|75|[89]8)"]
,"0$1","",0]
,[,"(\\d{3})(\\d{3})(\\d{3,4})","$1 $2 $3",["2(?:1[39]|2[0157]|6[14]|7[35]|84)|329"]
,"0$1","",0]
,[,"([1-356]\\d)(\\d{3,5})","$1 $2",["1[3-9]|2[0569]|3[0-69]|5[05689]|6[0-46-9]"]
,"0$1","",0]
,[,"([235]\\d)(\\d{3})(\\d{3,4})","$1 $2 $3",["[23]9|54"]
,"0$1","",0]
,[,"([25]\\d{3})(\\d{3,5})","$1 $2",["(?:25|54)8","258[23]|5483"]
,"0$1","",0]
,[,"(8\\d{3})(\\d{6})","$1 $2",["86"]
,"0$1","",0]
,[,"(80\\d)(\\d{3})(\\d{4})","$1 $2 $3",["80"]
,"0$1","",0]
]
,,[,,"NA","NA"]
,,,[,,"NA","NA"]
,[,,"NA","NA"]
,,,[,,"NA","NA"]
]
,"800":[,[,,"\\d{8}","\\d{8}",,,"12345678"]
,[,,"NA","NA",,,"12345678"]
,[,,"NA","NA",,,"12345678"]
,[,,"\\d{8}","\\d{8}",,,"12345678"]
,[,,"NA","NA"]
,[,,"NA","NA"]
,[,,"NA","NA"]
,[,,"NA","NA"]
,"001",800,"",,,,,,,1,[[,"(\\d{4})(\\d{4})","$1 $2",,"","",0]
]
,,[,,"NA","NA"]
,,,[,,"NA","NA"]
,[,,"NA","NA"]
,1,,[,,"NA","NA"]
]
,"808":[,[,,"\\d{8}","\\d{8}",,,"12345678"]
,[,,"NA","NA",,,"12345678"]
,[,,"NA","NA",,,"12345678"]
,[,,"NA","NA"]
,[,,"NA","NA"]
,[,,"\\d{8}","\\d{8}",,,"12345678"]
,[,,"NA","NA"]
,[,,"NA","NA"]
,"001",808,"",,,,,,,1,[[,"(\\d{4})(\\d{4})","$1 $2",,"","",0]
]
,,[,,"NA","NA"]
,,,[,,"NA","NA"]
,[,,"NA","NA"]
,1,,[,,"NA","NA"]
]
,"870":[,[,,"[35-7]\\d{8}","\\d{9}",,,"301234567"]
,[,,"NA","NA",,,"301234567"]
,[,,"(?:[356]\\d|7[6-8])\\d{7}","\\d{9}",,,"301234567"]
,[,,"NA","NA"]
,[,,"NA","NA"]
,[,,"NA","NA"]
,[,,"NA","NA"]
,[,,"NA","NA"]
,"001",870,"",,,,,,,,[[,"(\\d{3})(\\d{3})(\\d{3})","$1 $2 $3",,"","",0]
]
,,[,,"NA","NA"]
,,,[,,"NA","NA"]
,[,,"NA","NA"]
,,,[,,"NA","NA"]
]
,"878":[,[,,"1\\d{11}","\\d{12}",,,"101234567890"]
,[,,"NA","NA",,,"101234567890"]
,[,,"NA","NA",,,"101234567890"]
,[,,"NA","NA"]
,[,,"NA","NA"]
,[,,"NA","NA"]
,[,,"NA","NA"]
,[,,"10\\d{10}","\\d{12}",,,"101234567890"]
,"001",878,"",,,,,,,1,[[,"(\\d{2})(\\d{5})(\\d{5})","$1 $2 $3",,"","",0]
]
,,[,,"NA","NA"]
,,,[,,"NA","NA"]
,[,,"NA","NA"]
,,,[,,"NA","NA"]
]
,"881":[,[,,"[67]\\d{8}","\\d{9}",,,"612345678"]
,[,,"NA","NA",,,"612345678"]
,[,,"[67]\\d{8}","\\d{9}",,,"612345678"]
,[,,"NA","NA"]
,[,,"NA","NA"]
,[,,"NA","NA"]
,[,,"NA","NA"]
,[,,"NA","NA"]
,"001",881,"",,,,,,,,[[,"(\\d)(\\d{3})(\\d{5})","$1 $2 $3",["[67]"]
,"","",0]
]
,,[,,"NA","NA"]
,,,[,,"NA","NA"]
,[,,"NA","NA"]
,,,[,,"NA","NA"]
]
,"882":[,[,,"[13]\\d{6,11}","\\d{7,12}",,,"3451234567"]
,[,,"NA","NA",,,"3451234567"]
,[,,"3(?:2\\d{3}|37\\d{2}|4(?:2|7\\d{3}))\\d{4}","\\d{7,10}",,,"3451234567"]
,[,,"NA","NA"]
,[,,"NA","NA"]
,[,,"NA","NA"]
,[,,"NA","NA"]
,[,,"1(?:3(?:0[0347]|[13][0139]|2[035]|4[013568]|6[0459]|7[06]|8[15678]|9[0689])\\d{4}|6\\d{5,10})|345\\d{7}","\\d{7,12}",,,"3451234567"]
,"001",882,"",,,,,,,,[[,"(\\d{2})(\\d{4})(\\d{3})","$1 $2 $3",["3[23]"]
,"","",0]
,[,"(\\d{2})(\\d{5})","$1 $2",["16|342"]
,"","",0]
,[,"(\\d{2})(\\d{4})(\\d{4})","$1 $2 $3",["34[57]"]
,"","",0]
,[,"(\\d{3})(\\d{4})(\\d{4})","$1 $2 $3",["348"]
,"","",0]
,[,"(\\d{2})(\\d{2})(\\d{4})","$1 $2 $3",["1"]
,"","",0]
,[,"(\\d{2})(\\d{3,4})(\\d{4})","$1 $2 $3",["16"]
,"","",0]
,[,"(\\d{2})(\\d{4,5})(\\d{5})","$1 $2 $3",["16"]
,"","",0]
]
,,[,,"NA","NA"]
,,,[,,"NA","NA"]
,[,,"NA","NA"]
,,,[,,"348[57]\\d{7}","\\d{11}",,,"3451234567"]
]
,"883":[,[,,"51\\d{7}(?:\\d{3})?","\\d{9}(?:\\d{3})?",,,"510012345"]
,[,,"NA","NA",,,"510012345"]
,[,,"NA","NA",,,"510012345"]
,[,,"NA","NA"]
,[,,"NA","NA"]
,[,,"NA","NA"]
,[,,"NA","NA"]
,[,,"51(?:00\\d{5}(?:\\d{3})?|[13]0\\d{8})","\\d{9}(?:\\d{3})?",,,"510012345"]
,"001",883,"",,,,,,,1,[[,"(\\d{3})(\\d{3})(\\d{3})","$1 $2 $3",["510"]
,"","",0]
,[,"(\\d{3})(\\d{3})(\\d{3})(\\d{3})","$1 $2 $3 $4",["510"]
,"","",0]
,[,"(\\d{4})(\\d{4})(\\d{4})","$1 $2 $3",["51[13]"]
,"","",0]
]
,,[,,"NA","NA"]
,,,[,,"NA","NA"]
,[,,"NA","NA"]
,,,[,,"NA","NA"]
]
,"888":[,[,,"\\d{11}","\\d{11}",,,"12345678901"]
,[,,"NA","NA",,,"12345678901"]
,[,,"NA","NA",,,"12345678901"]
,[,,"NA","NA"]
,[,,"NA","NA"]
,[,,"NA","NA"]
,[,,"NA","NA"]
,[,,"NA","NA"]
,"001",888,"",,,,,,,1,[[,"(\\d{3})(\\d{3})(\\d{5})","$1 $2 $3",,"","",0]
]
,,[,,"NA","NA"]
,,,[,,"NA","NA"]
,[,,"\\d{11}","\\d{11}",,,"12345678901"]
,1,,[,,"NA","NA"]
]
,"979":[,[,,"\\d{9}","\\d{9}",,,"123456789"]
,[,,"NA","NA",,,"123456789"]
,[,,"NA","NA",,,"123456789"]
,[,,"NA","NA"]
,[,,"\\d{9}","\\d{9}",,,"123456789"]
,[,,"NA","NA"]
,[,,"NA","NA"]
,[,,"NA","NA"]
,"001",979,"",,,,,,,1,[[,"(\\d)(\\d{4})(\\d{4})","$1 $2 $3",,"","",0]
]
,,[,,"NA","NA"]
,,,[,,"NA","NA"]
,[,,"NA","NA"]
,1,,[,,"NA","NA"]
]
};
/**
 * @license
 * Copyright (C) 2010 The Libphonenumber Authors.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 * http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

/**
 * @fileoverview  Utility for international phone numbers.
 * Functionality includes formatting, parsing and validation.
 * (based on the java implementation).
 *
 * NOTE: A lot of methods in this class require Region Code strings. These must
 * be provided using ISO 3166-1 two-letter country-code format. These should be
 * in upper-case (but for compatibility lower-case is also allowed). The list of
 * the codes can be found here:
 * http://www.iso.org/iso/english_country_names_and_code_elements
 *
 * @author Nikolaos Trogkanis
 */

goog.require('goog.array');
goog.require('goog.proto2.PbLiteSerializer');
goog.require('goog.string');
goog.require('goog.string.StringBuffer');
goog.require('i18n.phonenumbers.NumberFormat');
goog.require('i18n.phonenumbers.PhoneMetadata');
goog.require('i18n.phonenumbers.PhoneMetadataCollection');
goog.require('i18n.phonenumbers.PhoneNumber');
goog.require('i18n.phonenumbers.PhoneNumber.CountryCodeSource');
goog.require('i18n.phonenumbers.PhoneNumberDesc');
goog.require('i18n.phonenumbers.metadata');



/**
 * @constructor
 * @private
 */
i18n.phonenumbers.PhoneNumberUtil = function() {
  /**
   * A mapping from a region code to the PhoneMetadata for that region.
   * @type {Object.<string, i18n.phonenumbers.PhoneMetadata>}
   */
  this.regionToMetadataMap = {};
};
goog.addSingletonGetter(i18n.phonenumbers.PhoneNumberUtil);


/**
 * Errors encountered when parsing phone numbers.
 *
 * @enum {string}
 */
i18n.phonenumbers.Error = {
  INVALID_COUNTRY_CODE: 'Invalid country calling code',
  // This generally indicates the string passed in had less than 3 digits in it.
  // More specifically, the number failed to match the regular expression
  // VALID_PHONE_NUMBER.
  NOT_A_NUMBER: 'The string supplied did not seem to be a phone number',
  // This indicates the string started with an international dialing prefix, but
  // after this was stripped from the number, had less digits than any valid
  // phone number (including country calling code) could have.
  TOO_SHORT_AFTER_IDD: 'Phone number too short after IDD',
  // This indicates the string, after any country calling code has been
  // stripped, had less digits than any valid phone number could have.
  TOO_SHORT_NSN: 'The string supplied is too short to be a phone number',
  // This indicates the string had more digits than any valid phone number could
  // have.
  TOO_LONG: 'The string supplied is too long to be a phone number'
};


/**
 * @const
 * @type {number}
 * @private
 */
i18n.phonenumbers.PhoneNumberUtil.NANPA_COUNTRY_CODE_ = 1;


/**
 * The minimum length of the national significant number.
 *
 * @const
 * @type {number}
 * @private
 */
i18n.phonenumbers.PhoneNumberUtil.MIN_LENGTH_FOR_NSN_ = 2;


/**
 * The ITU says the maximum length should be 15, but we have found longer
 * numbers in Germany.
 *
 * @const
 * @type {number}
 * @private
 */
i18n.phonenumbers.PhoneNumberUtil.MAX_LENGTH_FOR_NSN_ = 17;


/**
 * The maximum length of the country calling code.
 *
 * @const
 * @type {number}
 * @private
 */
i18n.phonenumbers.PhoneNumberUtil.MAX_LENGTH_COUNTRY_CODE_ = 3;


/**
 * We don't allow input strings for parsing to be longer than 250 chars. This
 * prevents malicious input from consuming CPU.
 *
 * @const
 * @type {number}
 * @private
 */
i18n.phonenumbers.PhoneNumberUtil.MAX_INPUT_STRING_LENGTH_ = 250;


/**
 * Region-code for the unknown region.
 *
 * @const
 * @type {string}
 * @private
 */
i18n.phonenumbers.PhoneNumberUtil.UNKNOWN_REGION_ = 'ZZ';


/**
 * The prefix that needs to be inserted in front of a Colombian landline number
 * when dialed from a mobile phone in Colombia.
 *
 * @const
 * @type {string}
 * @private
 */
i18n.phonenumbers.PhoneNumberUtil.COLOMBIA_MOBILE_TO_FIXED_LINE_PREFIX_ = '3';


/**
 * Map of country calling codes that use a mobile token before the area code.
 * One example of when this is relevant is when determining the length of the
 * national destination code, which should be the length of the area code plus
 * the length of the mobile token.
 *
 * @const
 * @type {!Object.<number, string>}
 * @private
 */
i18n.phonenumbers.PhoneNumberUtil.MOBILE_TOKEN_MAPPINGS_ = {
  52: '1',
  54: '9'
};


/**
 * The PLUS_SIGN signifies the international prefix.
 *
 * @const
 * @type {string}
 */
i18n.phonenumbers.PhoneNumberUtil.PLUS_SIGN = '+';


/**
 * @const
 * @type {string}
 * @private
 */
i18n.phonenumbers.PhoneNumberUtil.STAR_SIGN_ = '*';


/**
 * The RFC 3966 format for extensions.
 *
 * @const
 * @type {string}
 * @private
 */
i18n.phonenumbers.PhoneNumberUtil.RFC3966_EXTN_PREFIX_ = ';ext=';


/**
 * @const
 * @type {string}
 * @private
 */
i18n.phonenumbers.PhoneNumberUtil.RFC3966_PREFIX_ = 'tel:';


/**
 * @const
 * @type {string}
 * @private
 */
i18n.phonenumbers.PhoneNumberUtil.RFC3966_PHONE_CONTEXT_ = ';phone-context=';


/**
 * @const
 * @type {string}
 * @private
 */
i18n.phonenumbers.PhoneNumberUtil.RFC3966_ISDN_SUBADDRESS_ = ';isub=';


/**
 * These mappings map a character (key) to a specific digit that should replace
 * it for normalization purposes. Non-European digits that may be used in phone
 * numbers are mapped to a European equivalent.
 *
 * @const
 * @type {!Object.<string, string>}
 */
i18n.phonenumbers.PhoneNumberUtil.DIGIT_MAPPINGS = {
  '0': '0',
  '1': '1',
  '2': '2',
  '3': '3',
  '4': '4',
  '5': '5',
  '6': '6',
  '7': '7',
  '8': '8',
  '9': '9',
  '\uFF10': '0', // Fullwidth digit 0
  '\uFF11': '1', // Fullwidth digit 1
  '\uFF12': '2', // Fullwidth digit 2
  '\uFF13': '3', // Fullwidth digit 3
  '\uFF14': '4', // Fullwidth digit 4
  '\uFF15': '5', // Fullwidth digit 5
  '\uFF16': '6', // Fullwidth digit 6
  '\uFF17': '7', // Fullwidth digit 7
  '\uFF18': '8', // Fullwidth digit 8
  '\uFF19': '9', // Fullwidth digit 9
  '\u0660': '0', // Arabic-indic digit 0
  '\u0661': '1', // Arabic-indic digit 1
  '\u0662': '2', // Arabic-indic digit 2
  '\u0663': '3', // Arabic-indic digit 3
  '\u0664': '4', // Arabic-indic digit 4
  '\u0665': '5', // Arabic-indic digit 5
  '\u0666': '6', // Arabic-indic digit 6
  '\u0667': '7', // Arabic-indic digit 7
  '\u0668': '8', // Arabic-indic digit 8
  '\u0669': '9', // Arabic-indic digit 9
  '\u06F0': '0', // Eastern-Arabic digit 0
  '\u06F1': '1', // Eastern-Arabic digit 1
  '\u06F2': '2', // Eastern-Arabic digit 2
  '\u06F3': '3', // Eastern-Arabic digit 3
  '\u06F4': '4', // Eastern-Arabic digit 4
  '\u06F5': '5', // Eastern-Arabic digit 5
  '\u06F6': '6', // Eastern-Arabic digit 6
  '\u06F7': '7', // Eastern-Arabic digit 7
  '\u06F8': '8', // Eastern-Arabic digit 8
  '\u06F9': '9'  // Eastern-Arabic digit 9
};


/**
 * A map that contains characters that are essential when dialling. That means
 * any of the characters in this map must not be removed from a number when
 * dialling, otherwise the call will not reach the intended destination.
 *
 * @const
 * @type {!Object.<string, string>}
 * @private
 */
i18n.phonenumbers.PhoneNumberUtil.DIALLABLE_CHAR_MAPPINGS_ = {
  '0': '0',
  '1': '1',
  '2': '2',
  '3': '3',
  '4': '4',
  '5': '5',
  '6': '6',
  '7': '7',
  '8': '8',
  '9': '9',
  '+': i18n.phonenumbers.PhoneNumberUtil.PLUS_SIGN,
  '*': '*'
};


/**
 * Only upper-case variants of alpha characters are stored.
 *
 * @const
 * @type {!Object.<string, string>}
 * @private
 */
i18n.phonenumbers.PhoneNumberUtil.ALPHA_MAPPINGS_ = {
  'A': '2',
  'B': '2',
  'C': '2',
  'D': '3',
  'E': '3',
  'F': '3',
  'G': '4',
  'H': '4',
  'I': '4',
  'J': '5',
  'K': '5',
  'L': '5',
  'M': '6',
  'N': '6',
  'O': '6',
  'P': '7',
  'Q': '7',
  'R': '7',
  'S': '7',
  'T': '8',
  'U': '8',
  'V': '8',
  'W': '9',
  'X': '9',
  'Y': '9',
  'Z': '9'
};


/**
 * For performance reasons, amalgamate both into one map.
 *
 * @const
 * @type {!Object.<string, string>}
 * @private
 */
i18n.phonenumbers.PhoneNumberUtil.ALL_NORMALIZATION_MAPPINGS_ = {
  '0': '0',
  '1': '1',
  '2': '2',
  '3': '3',
  '4': '4',
  '5': '5',
  '6': '6',
  '7': '7',
  '8': '8',
  '9': '9',
  '\uFF10': '0', // Fullwidth digit 0
  '\uFF11': '1', // Fullwidth digit 1
  '\uFF12': '2', // Fullwidth digit 2
  '\uFF13': '3', // Fullwidth digit 3
  '\uFF14': '4', // Fullwidth digit 4
  '\uFF15': '5', // Fullwidth digit 5
  '\uFF16': '6', // Fullwidth digit 6
  '\uFF17': '7', // Fullwidth digit 7
  '\uFF18': '8', // Fullwidth digit 8
  '\uFF19': '9', // Fullwidth digit 9
  '\u0660': '0', // Arabic-indic digit 0
  '\u0661': '1', // Arabic-indic digit 1
  '\u0662': '2', // Arabic-indic digit 2
  '\u0663': '3', // Arabic-indic digit 3
  '\u0664': '4', // Arabic-indic digit 4
  '\u0665': '5', // Arabic-indic digit 5
  '\u0666': '6', // Arabic-indic digit 6
  '\u0667': '7', // Arabic-indic digit 7
  '\u0668': '8', // Arabic-indic digit 8
  '\u0669': '9', // Arabic-indic digit 9
  '\u06F0': '0', // Eastern-Arabic digit 0
  '\u06F1': '1', // Eastern-Arabic digit 1
  '\u06F2': '2', // Eastern-Arabic digit 2
  '\u06F3': '3', // Eastern-Arabic digit 3
  '\u06F4': '4', // Eastern-Arabic digit 4
  '\u06F5': '5', // Eastern-Arabic digit 5
  '\u06F6': '6', // Eastern-Arabic digit 6
  '\u06F7': '7', // Eastern-Arabic digit 7
  '\u06F8': '8', // Eastern-Arabic digit 8
  '\u06F9': '9', // Eastern-Arabic digit 9
  'A': '2',
  'B': '2',
  'C': '2',
  'D': '3',
  'E': '3',
  'F': '3',
  'G': '4',
  'H': '4',
  'I': '4',
  'J': '5',
  'K': '5',
  'L': '5',
  'M': '6',
  'N': '6',
  'O': '6',
  'P': '7',
  'Q': '7',
  'R': '7',
  'S': '7',
  'T': '8',
  'U': '8',
  'V': '8',
  'W': '9',
  'X': '9',
  'Y': '9',
  'Z': '9'
};


/**
 * Separate map of all symbols that we wish to retain when formatting alpha
 * numbers. This includes digits, ASCII letters and number grouping symbols such
 * as '-' and ' '.
 *
 * @const
 * @type {!Object.<string, string>}
 * @private
 */
i18n.phonenumbers.PhoneNumberUtil.ALL_PLUS_NUMBER_GROUPING_SYMBOLS_ = {
  '0': '0',
  '1': '1',
  '2': '2',
  '3': '3',
  '4': '4',
  '5': '5',
  '6': '6',
  '7': '7',
  '8': '8',
  '9': '9',
  'A': 'A',
  'B': 'B',
  'C': 'C',
  'D': 'D',
  'E': 'E',
  'F': 'F',
  'G': 'G',
  'H': 'H',
  'I': 'I',
  'J': 'J',
  'K': 'K',
  'L': 'L',
  'M': 'M',
  'N': 'N',
  'O': 'O',
  'P': 'P',
  'Q': 'Q',
  'R': 'R',
  'S': 'S',
  'T': 'T',
  'U': 'U',
  'V': 'V',
  'W': 'W',
  'X': 'X',
  'Y': 'Y',
  'Z': 'Z',
  'a': 'A',
  'b': 'B',
  'c': 'C',
  'd': 'D',
  'e': 'E',
  'f': 'F',
  'g': 'G',
  'h': 'H',
  'i': 'I',
  'j': 'J',
  'k': 'K',
  'l': 'L',
  'm': 'M',
  'n': 'N',
  'o': 'O',
  'p': 'P',
  'q': 'Q',
  'r': 'R',
  's': 'S',
  't': 'T',
  'u': 'U',
  'v': 'V',
  'w': 'W',
  'x': 'X',
  'y': 'Y',
  'z': 'Z',
  '-': '-',
  '\uFF0D': '-',
  '\u2010': '-',
  '\u2011': '-',
  '\u2012': '-',
  '\u2013': '-',
  '\u2014': '-',
  '\u2015': '-',
  '\u2212': '-',
  '/': '/',
  '\uFF0F': '/',
  ' ': ' ',
  '\u3000': ' ',
  '\u2060': ' ',
  '.': '.',
  '\uFF0E': '.'
};


/**
 * Pattern that makes it easy to distinguish whether a region has a unique
 * international dialing prefix or not. If a region has a unique international
 * prefix (e.g. 011 in USA), it will be represented as a string that contains a
 * sequence of ASCII digits. If there are multiple available international
 * prefixes in a region, they will be represented as a regex string that always
 * contains character(s) other than ASCII digits. Note this regex also includes
 * tilde, which signals waiting for the tone.
 *
 * @const
 * @type {!RegExp}
 * @private
 */
i18n.phonenumbers.PhoneNumberUtil.UNIQUE_INTERNATIONAL_PREFIX_ =
    /[\d]+(?:[~\u2053\u223C\uFF5E][\d]+)?/;


/**
 * Regular expression of acceptable punctuation found in phone numbers. This
 * excludes punctuation found as a leading character only. This consists of dash
 * characters, white space characters, full stops, slashes, square brackets,
 * parentheses and tildes. It also includes the letter 'x' as that is found as a
 * placeholder for carrier information in some phone numbers. Full-width
 * variants are also present.
 *
 * @const
 * @type {string}
 */
i18n.phonenumbers.PhoneNumberUtil.VALID_PUNCTUATION =
    '-x\u2010-\u2015\u2212\u30FC\uFF0D-\uFF0F \u00A0\u00AD\u200B\u2060\u3000' +
    '()\uFF08\uFF09\uFF3B\uFF3D.\\[\\]/~\u2053\u223C\uFF5E';


/**
 * Digits accepted in phone numbers (ascii, fullwidth, arabic-indic, and eastern
 * arabic digits).
 *
 * @const
 * @type {string}
 * @private
 */
i18n.phonenumbers.PhoneNumberUtil.VALID_DIGITS_ =
    '0-9\uFF10-\uFF19\u0660-\u0669\u06F0-\u06F9';


/**
 * We accept alpha characters in phone numbers, ASCII only, upper and lower
 * case.
 *
 * @const
 * @type {string}
 * @private
 */
i18n.phonenumbers.PhoneNumberUtil.VALID_ALPHA_ = 'A-Za-z';


/**
 * @const
 * @type {string}
 * @private
 */
i18n.phonenumbers.PhoneNumberUtil.PLUS_CHARS_ = '+\uFF0B';


/**
 * @const
 * @type {!RegExp}
 */
i18n.phonenumbers.PhoneNumberUtil.PLUS_CHARS_PATTERN =
    new RegExp('[' + i18n.phonenumbers.PhoneNumberUtil.PLUS_CHARS_ + ']+');


/**
 * @const
 * @type {!RegExp}
 * @private
 */
i18n.phonenumbers.PhoneNumberUtil.LEADING_PLUS_CHARS_PATTERN_ =
    new RegExp('^[' + i18n.phonenumbers.PhoneNumberUtil.PLUS_CHARS_ + ']+');


/**
 * @const
 * @type {string}
 * @private
 */
i18n.phonenumbers.PhoneNumberUtil.SEPARATOR_PATTERN_ =
    '[' + i18n.phonenumbers.PhoneNumberUtil.VALID_PUNCTUATION + ']+';


/**
 * @const
 * @type {!RegExp}
 */
i18n.phonenumbers.PhoneNumberUtil.CAPTURING_DIGIT_PATTERN =
    new RegExp('([' + i18n.phonenumbers.PhoneNumberUtil.VALID_DIGITS_ + '])');


/**
 * Regular expression of acceptable characters that may start a phone number for
 * the purposes of parsing. This allows us to strip away meaningless prefixes to
 * phone numbers that may be mistakenly given to us. This consists of digits,
 * the plus symbol and arabic-indic digits. This does not contain alpha
 * characters, although they may be used later in the number. It also does not
 * include other punctuation, as this will be stripped later during parsing and
 * is of no information value when parsing a number.
 *
 * @const
 * @type {!RegExp}
 * @private
 */
i18n.phonenumbers.PhoneNumberUtil.VALID_START_CHAR_PATTERN_ =
    new RegExp('[' + i18n.phonenumbers.PhoneNumberUtil.PLUS_CHARS_ +
               i18n.phonenumbers.PhoneNumberUtil.VALID_DIGITS_ + ']');


/**
 * Regular expression of characters typically used to start a second phone
 * number for the purposes of parsing. This allows us to strip off parts of the
 * number that are actually the start of another number, such as for:
 * (530) 583-6985 x302/x2303 -> the second extension here makes this actually
 * two phone numbers, (530) 583-6985 x302 and (530) 583-6985 x2303. We remove
 * the second extension so that the first number is parsed correctly.
 *
 * @const
 * @type {!RegExp}
 * @private
 */
i18n.phonenumbers.PhoneNumberUtil.SECOND_NUMBER_START_PATTERN_ = /[\\\/] *x/;


/**
 * Regular expression of trailing characters that we want to remove. We remove
 * all characters that are not alpha or numerical characters. The hash character
 * is retained here, as it may signify the previous block was an extension.
 *
 * @const
 * @type {!RegExp}
 * @private
 */
i18n.phonenumbers.PhoneNumberUtil.UNWANTED_END_CHAR_PATTERN_ =
    new RegExp('[^' + i18n.phonenumbers.PhoneNumberUtil.VALID_DIGITS_ +
               i18n.phonenumbers.PhoneNumberUtil.VALID_ALPHA_ + '#]+$');


/**
 * We use this pattern to check if the phone number has at least three letters
 * in it - if so, then we treat it as a number where some phone-number digits
 * are represented by letters.
 *
 * @const
 * @type {!RegExp}
 * @private
 */
i18n.phonenumbers.PhoneNumberUtil.VALID_ALPHA_PHONE_PATTERN_ =
    /(?:.*?[A-Za-z]){3}.*/;


/**
 * Regular expression of viable phone numbers. This is location independent.
 * Checks we have at least three leading digits, and only valid punctuation,
 * alpha characters and digits in the phone number. Does not include extension
 * data. The symbol 'x' is allowed here as valid punctuation since it is often
 * used as a placeholder for carrier codes, for example in Brazilian phone
 * numbers. We also allow multiple '+' characters at the start.
 * Corresponds to the following:
 * [digits]{minLengthNsn}|
 * plus_sign*
 * (([punctuation]|[star])*[digits]){3,}([punctuation]|[star]|[digits]|[alpha])*
 *
 * The first reg-ex is to allow short numbers (two digits long) to be parsed if
 * they are entered as "15" etc, but only if there is no punctuation in them.
 * The second expression restricts the number of digits to three or more, but
 * then allows them to be in international form, and to have alpha-characters
 * and punctuation. We split up the two reg-exes here and combine them when
 * creating the reg-ex VALID_PHONE_NUMBER_PATTERN_ itself so we can prefix it
 * with ^ and append $ to each branch.
 *
 * Note VALID_PUNCTUATION starts with a -, so must be the first in the range.
 *
 * @const
 * @type {string}
 * @private
 */
i18n.phonenumbers.PhoneNumberUtil.MIN_LENGTH_PHONE_NUMBER_PATTERN_ =
    '[' + i18n.phonenumbers.PhoneNumberUtil.VALID_DIGITS_ + ']{' +
    i18n.phonenumbers.PhoneNumberUtil.MIN_LENGTH_FOR_NSN_ + '}';


/**
 * See MIN_LENGTH_PHONE_NUMBER_PATTERN_ for a full description of this reg-exp.
 *
 * @const
 * @type {string}
 * @private
 */
i18n.phonenumbers.PhoneNumberUtil.VALID_PHONE_NUMBER_ =
    '[' + i18n.phonenumbers.PhoneNumberUtil.PLUS_CHARS_ + ']*(?:[' +
    i18n.phonenumbers.PhoneNumberUtil.VALID_PUNCTUATION +
    i18n.phonenumbers.PhoneNumberUtil.STAR_SIGN_ + ']*[' +
    i18n.phonenumbers.PhoneNumberUtil.VALID_DIGITS_ + ']){3,}[' +
    i18n.phonenumbers.PhoneNumberUtil.VALID_PUNCTUATION +
    i18n.phonenumbers.PhoneNumberUtil.STAR_SIGN_ +
    i18n.phonenumbers.PhoneNumberUtil.VALID_ALPHA_ +
    i18n.phonenumbers.PhoneNumberUtil.VALID_DIGITS_ + ']*';


/**
 * Default extension prefix to use when formatting. This will be put in front of
 * any extension component of the number, after the main national number is
 * formatted. For example, if you wish the default extension formatting to be
 * ' extn: 3456', then you should specify ' extn: ' here as the default
 * extension prefix. This can be overridden by region-specific preferences.
 *
 * @const
 * @type {string}
 * @private
 */
i18n.phonenumbers.PhoneNumberUtil.DEFAULT_EXTN_PREFIX_ = ' ext. ';


/**
 * Pattern to capture digits used in an extension.
 * Places a maximum length of '7' for an extension.
 *
 * @const
 * @type {string}
 * @private
 */
i18n.phonenumbers.PhoneNumberUtil.CAPTURING_EXTN_DIGITS_ =
    '([' + i18n.phonenumbers.PhoneNumberUtil.VALID_DIGITS_ + ']{1,7})';


/**
 * Regexp of all possible ways to write extensions, for use when parsing. This
 * will be run as a case-insensitive regexp match. Wide character versions are
 * also provided after each ASCII version. There are three regular expressions
 * here. The first covers RFC 3966 format, where the extension is added using
 * ';ext='. The second more generic one starts with optional white space and
 * ends with an optional full stop (.), followed by zero or more spaces/tabs and
 * then the numbers themselves. The other one covers the special case of
 * American numbers where the extension is written with a hash at the end, such
 * as '- 503#'. Note that the only capturing groups should be around the digits
 * that you want to capture as part of the extension, or else parsing will fail!
 * We allow two options for representing the accented o - the character itself,
 * and one in the unicode decomposed form with the combining acute accent.
 *
 * @const
 * @type {string}
 * @private
 */
i18n.phonenumbers.PhoneNumberUtil.EXTN_PATTERNS_FOR_PARSING_ =
    i18n.phonenumbers.PhoneNumberUtil.RFC3966_EXTN_PREFIX_ +
    i18n.phonenumbers.PhoneNumberUtil.CAPTURING_EXTN_DIGITS_ + '|' +
    '[ \u00A0\\t,]*' +
    '(?:e?xt(?:ensi(?:o\u0301?|\u00F3))?n?|\uFF45?\uFF58\uFF54\uFF4E?|' +
    '[,x\uFF58#\uFF03~\uFF5E]|int|anexo|\uFF49\uFF4E\uFF54)' +
    '[:\\.\uFF0E]?[ \u00A0\\t,-]*' +
    i18n.phonenumbers.PhoneNumberUtil.CAPTURING_EXTN_DIGITS_ + '#?|' +
    '[- ]+([' + i18n.phonenumbers.PhoneNumberUtil.VALID_DIGITS_ + ']{1,5})#';


/**
 * Regexp of all known extension prefixes used by different regions followed by
 * 1 or more valid digits, for use when parsing.
 *
 * @const
 * @type {!RegExp}
 * @private
 */
i18n.phonenumbers.PhoneNumberUtil.EXTN_PATTERN_ =
    new RegExp('(?:' +
               i18n.phonenumbers.PhoneNumberUtil.EXTN_PATTERNS_FOR_PARSING_ +
               ')$', 'i');


/**
 * We append optionally the extension pattern to the end here, as a valid phone
 * number may have an extension prefix appended, followed by 1 or more digits.
 *
 * @const
 * @type {!RegExp}
 * @private
 */
i18n.phonenumbers.PhoneNumberUtil.VALID_PHONE_NUMBER_PATTERN_ =
    new RegExp(
        '^' +
        i18n.phonenumbers.PhoneNumberUtil.MIN_LENGTH_PHONE_NUMBER_PATTERN_ +
        '$|' +
        '^' + i18n.phonenumbers.PhoneNumberUtil.VALID_PHONE_NUMBER_ +
        '(?:' + i18n.phonenumbers.PhoneNumberUtil.EXTN_PATTERNS_FOR_PARSING_ +
        ')?' + '$', 'i');


/**
 * @const
 * @type {!RegExp}
 * @private
 */
i18n.phonenumbers.PhoneNumberUtil.NON_DIGITS_PATTERN_ = /\D+/;


/**
 * This was originally set to $1 but there are some countries for which the
 * first group is not used in the national pattern (e.g. Argentina) so the $1
 * group does not match correctly.  Therefore, we use \d, so that the first
 * group actually used in the pattern will be matched.
 * @const
 * @type {!RegExp}
 * @private
 */
i18n.phonenumbers.PhoneNumberUtil.FIRST_GROUP_PATTERN_ = /(\$\d)/;


/**
 * @const
 * @type {!RegExp}
 * @private
 */
i18n.phonenumbers.PhoneNumberUtil.NP_PATTERN_ = /\$NP/;


/**
 * @const
 * @type {!RegExp}
 * @private
 */
i18n.phonenumbers.PhoneNumberUtil.FG_PATTERN_ = /\$FG/;


/**
 * @const
 * @type {!RegExp}
 * @private
 */
i18n.phonenumbers.PhoneNumberUtil.CC_PATTERN_ = /\$CC/;


/**
 * A pattern that is used to determine if the national prefix formatting rule
 * has the first group only, i.e., does not start with the national prefix.
 * Note that the pattern explicitly allows for unbalanced parentheses.
 * @const
 * @type {!RegExp}
 * @private
 */
i18n.phonenumbers.PhoneNumberUtil.FIRST_GROUP_ONLY_PREFIX_PATTERN_ =
    /^\(?\$1\)?$/;


/**
 * @const
 * @type {string}
 */
i18n.phonenumbers.PhoneNumberUtil.REGION_CODE_FOR_NON_GEO_ENTITY = '001';


/**
 * INTERNATIONAL and NATIONAL formats are consistent with the definition in
 * ITU-T Recommendation E123. For example, the number of the Google Switzerland
 * office will be written as '+41 44 668 1800' in INTERNATIONAL format, and as
 * '044 668 1800' in NATIONAL format. E164 format is as per INTERNATIONAL format
 * but with no formatting applied, e.g. '+41446681800'. RFC3966 is as per
 * INTERNATIONAL format, but with all spaces and other separating symbols
 * replaced with a hyphen, and with any phone number extension appended with
 * ';ext='. It also will have a prefix of 'tel:' added, e.g.
 * 'tel:+41-44-668-1800'.
 *
 * Note: If you are considering storing the number in a neutral format, you are
 * highly advised to use the PhoneNumber class.
 * @enum {number}
 */
i18n.phonenumbers.PhoneNumberFormat = {
  E164: 0,
  INTERNATIONAL: 1,
  NATIONAL: 2,
  RFC3966: 3
};


/**
 * Type of phone numbers.
 *
 * @enum {number}
 */
i18n.phonenumbers.PhoneNumberType = {
  FIXED_LINE: 0,
  MOBILE: 1,
  // In some regions (e.g. the USA), it is impossible to distinguish between
  // fixed-line and mobile numbers by looking at the phone number itself.
  FIXED_LINE_OR_MOBILE: 2,
  // Freephone lines
  TOLL_FREE: 3,
  PREMIUM_RATE: 4,
  // The cost of this call is shared between the caller and the recipient, and
  // is hence typically less than PREMIUM_RATE calls. See
  // http://en.wikipedia.org/wiki/Shared_Cost_Service for more information.
  SHARED_COST: 5,
  // Voice over IP numbers. This includes TSoIP (Telephony Service over IP).
  VOIP: 6,
  // A personal number is associated with a particular person, and may be routed
  // to either a MOBILE or FIXED_LINE number. Some more information can be found
  // here: http://en.wikipedia.org/wiki/Personal_Numbers
  PERSONAL_NUMBER: 7,
  PAGER: 8,
  // Used for 'Universal Access Numbers' or 'Company Numbers'. They may be
  // further routed to specific offices, but allow one number to be used for a
  // company.
  UAN: 9,
  // Used for 'Voice Mail Access Numbers'.
  VOICEMAIL: 10,
  // A phone number is of type UNKNOWN when it does not fit any of the known
  // patterns for a specific region.
  UNKNOWN: -1
};


/**
 * Types of phone number matches. See detailed description beside the
 * isNumberMatch() method.
 *
 * @enum {number}
 */
i18n.phonenumbers.PhoneNumberUtil.MatchType = {
  NOT_A_NUMBER: 0,
  NO_MATCH: 1,
  SHORT_NSN_MATCH: 2,
  NSN_MATCH: 3,
  EXACT_MATCH: 4
};


/**
 * Possible outcomes when testing if a PhoneNumber is possible.
 *
 * @enum {number}
 */
i18n.phonenumbers.PhoneNumberUtil.ValidationResult = {
  IS_POSSIBLE: 0,
  INVALID_COUNTRY_CODE: 1,
  TOO_SHORT: 2,
  TOO_LONG: 3,
  NOT_A_NUMBER: 4
};


/**
 * Attempts to extract a possible number from the string passed in. This
 * currently strips all leading characters that cannot be used to start a phone
 * number. Characters that can be used to start a phone number are defined in
 * the VALID_START_CHAR_PATTERN. If none of these characters are found in the
 * number passed in, an empty string is returned. This function also attempts to
 * strip off any alternative extensions or endings if two or more are present,
 * such as in the case of: (530) 583-6985 x302/x2303. The second extension here
 * makes this actually two phone numbers, (530) 583-6985 x302 and (530) 583-6985
 * x2303. We remove the second extension so that the first number is parsed
 * correctly.
 *
 * @param {string} number the string that might contain a phone number.
 * @return {string} the number, stripped of any non-phone-number prefix (such as
 *     'Tel:') or an empty string if no character used to start phone numbers
 *     (such as + or any digit) is found in the number.
 */
i18n.phonenumbers.PhoneNumberUtil.extractPossibleNumber = function(number) {
  /** @type {string} */
  var possibleNumber;

  /** @type {number} */
  var start = number
      .search(i18n.phonenumbers.PhoneNumberUtil.VALID_START_CHAR_PATTERN_);
  if (start >= 0) {
    possibleNumber = number.substring(start);
    // Remove trailing non-alpha non-numerical characters.
    possibleNumber = possibleNumber.replace(
        i18n.phonenumbers.PhoneNumberUtil.UNWANTED_END_CHAR_PATTERN_, '');

    // Check for extra numbers at the end.
    /** @type {number} */
    var secondNumberStart = possibleNumber
        .search(i18n.phonenumbers.PhoneNumberUtil.SECOND_NUMBER_START_PATTERN_);
    if (secondNumberStart >= 0) {
      possibleNumber = possibleNumber.substring(0, secondNumberStart);
    }
  } else {
    possibleNumber = '';
  }
  return possibleNumber;
};


/**
 * Checks to see if the string of characters could possibly be a phone number at
 * all. At the moment, checks to see that the string begins with at least 2
 * digits, ignoring any punctuation commonly found in phone numbers. This method
 * does not require the number to be normalized in advance - but does assume
 * that leading non-number symbols have been removed, such as by the method
 * extractPossibleNumber.
 *
 * @param {string} number string to be checked for viability as a phone number.
 * @return {boolean} true if the number could be a phone number of some sort,
 *     otherwise false.
 */
i18n.phonenumbers.PhoneNumberUtil.isViablePhoneNumber = function(number) {
  if (number.length < i18n.phonenumbers.PhoneNumberUtil.MIN_LENGTH_FOR_NSN_) {
    return false;
  }
  return i18n.phonenumbers.PhoneNumberUtil.matchesEntirely_(
      i18n.phonenumbers.PhoneNumberUtil.VALID_PHONE_NUMBER_PATTERN_, number);
};


/**
 * Normalizes a string of characters representing a phone number. This performs
 * the following conversions:
 *   Punctuation is stripped.
 *   For ALPHA/VANITY numbers:
 *   Letters are converted to their numeric representation on a telephone
 *       keypad. The keypad used here is the one defined in ITU Recommendation
 *       E.161. This is only done if there are 3 or more letters in the number,
 *       to lessen the risk that such letters are typos.
 *   For other numbers:
 *   Wide-ascii digits are converted to normal ASCII (European) digits.
 *   Arabic-Indic numerals are converted to European numerals.
 *   Spurious alpha characters are stripped.
 *
 * @param {string} number a string of characters representing a phone number.
 * @return {string} the normalized string version of the phone number.
 */
i18n.phonenumbers.PhoneNumberUtil.normalize = function(number) {
  if (i18n.phonenumbers.PhoneNumberUtil.matchesEntirely_(
      i18n.phonenumbers.PhoneNumberUtil.VALID_ALPHA_PHONE_PATTERN_, number)) {
    return i18n.phonenumbers.PhoneNumberUtil.normalizeHelper_(number,
        i18n.phonenumbers.PhoneNumberUtil.ALL_NORMALIZATION_MAPPINGS_, true);
  } else {
    return i18n.phonenumbers.PhoneNumberUtil.normalizeDigitsOnly(number);
  }
};


/**
 * Normalizes a string of characters representing a phone number. This is a
 * wrapper for normalize(String number) but does in-place normalization of the
 * StringBuffer provided.
 *
 * @param {!goog.string.StringBuffer} number a StringBuffer of characters
 *     representing a phone number that will be normalized in place.
 * @private
 */
i18n.phonenumbers.PhoneNumberUtil.normalizeSB_ = function(number) {
  /** @type {string} */
  var normalizedNumber = i18n.phonenumbers.PhoneNumberUtil.normalize(number
      .toString());
  number.clear();
  number.append(normalizedNumber);
};


/**
 * Normalizes a string of characters representing a phone number. This converts
 * wide-ascii and arabic-indic numerals to European numerals, and strips
 * punctuation and alpha characters.
 *
 * @param {string} number a string of characters representing a phone number.
 * @return {string} the normalized string version of the phone number.
 */
i18n.phonenumbers.PhoneNumberUtil.normalizeDigitsOnly = function(number) {
  return i18n.phonenumbers.PhoneNumberUtil.normalizeHelper_(number,
      i18n.phonenumbers.PhoneNumberUtil.DIGIT_MAPPINGS, true);
};


/**
 * Converts all alpha characters in a number to their respective digits on a
 * keypad, but retains existing formatting. Also converts wide-ascii digits to
 * normal ascii digits, and converts Arabic-Indic numerals to European numerals.
 *
 * @param {string} number a string of characters representing a phone number.
 * @return {string} the normalized string version of the phone number.
 */
i18n.phonenumbers.PhoneNumberUtil.convertAlphaCharactersInNumber =
    function(number) {

  return i18n.phonenumbers.PhoneNumberUtil.normalizeHelper_(number,
      i18n.phonenumbers.PhoneNumberUtil.ALL_NORMALIZATION_MAPPINGS_, false);
};


/**
 * Gets the length of the geographical area code from the
 * {@code national_number} field of the PhoneNumber object passed in, so that
 * clients could use it to split a national significant number into geographical
 * area code and subscriber number. It works in such a way that the resultant
 * subscriber number should be diallable, at least on some devices. An example
 * of how this could be used:
 *
 * <pre>
 * var phoneUtil = i18n.phonenumbers.PhoneNumberUtil.getInstance();
 * var number = phoneUtil.parse('16502530000', 'US');
 * var nationalSignificantNumber =
 *     phoneUtil.getNationalSignificantNumber(number);
 * var areaCode;
 * var subscriberNumber;
 *
 * var areaCodeLength = phoneUtil.getLengthOfGeographicalAreaCode(number);
 * if (areaCodeLength > 0) {
 *   areaCode = nationalSignificantNumber.substring(0, areaCodeLength);
 *   subscriberNumber = nationalSignificantNumber.substring(areaCodeLength);
 * } else {
 *   areaCode = '';
 *   subscriberNumber = nationalSignificantNumber;
 * }
 * </pre>
 *
 * N.B.: area code is a very ambiguous concept, so the I18N team generally
 * recommends against using it for most purposes, but recommends using the more
 * general {@code national_number} instead. Read the following carefully before
 * deciding to use this method:
 * <ul>
 *  <li> geographical area codes change over time, and this method honors those
 *    changes; therefore, it doesn't guarantee the stability of the result it
 *    produces.
 *  <li> subscriber numbers may not be diallable from all devices (notably
 *    mobile devices, which typically requires the full national_number to be
 *    dialled in most regions).
 *  <li> most non-geographical numbers have no area codes, including numbers
 *    from non-geographical entities.
 *  <li> some geographical numbers have no area codes.
 * </ul>
 *
 * @param {i18n.phonenumbers.PhoneNumber} number the PhoneNumber object for
 *     which clients want to know the length of the area code.
 * @return {number} the length of area code of the PhoneNumber object passed in.
 */
i18n.phonenumbers.PhoneNumberUtil.prototype.getLengthOfGeographicalAreaCode =
    function(number) {
  /** @type {i18n.phonenumbers.PhoneMetadata} */
  var metadata = this.getMetadataForRegion(this.getRegionCodeForNumber(number));
  if (metadata == null) {
    return 0;
  }
  // If a country doesn't use a national prefix, and this number doesn't have
  // an Italian leading zero, we assume it is a closed dialling plan with no
  // area codes.
  if (!metadata.hasNationalPrefix() && !number.hasItalianLeadingZero()) {
    return 0;
  }

  if (!this.isNumberGeographical(number)) {
    return 0;
  }

  return this.getLengthOfNationalDestinationCode(number);
};


/**
 * Gets the length of the national destination code (NDC) from the PhoneNumber
 * object passed in, so that clients could use it to split a national
 * significant number into NDC and subscriber number. The NDC of a phone number
 * is normally the first group of digit(s) right after the country calling code
 * when the number is formatted in the international format, if there is a
 * subscriber number part that follows. An example of how this could be used:
 *
 * <pre>
 * var phoneUtil = i18n.phonenumbers.PhoneNumberUtil.getInstance();
 * var number = phoneUtil.parse('18002530000', 'US');
 * var nationalSignificantNumber =
 *     phoneUtil.getNationalSignificantNumber(number);
 * var nationalDestinationCode;
 * var subscriberNumber;
 *
 * var nationalDestinationCodeLength =
 *     phoneUtil.getLengthOfNationalDestinationCode(number);
 * if (nationalDestinationCodeLength > 0) {
 *   nationalDestinationCode =
 *       nationalSignificantNumber.substring(0, nationalDestinationCodeLength);
 *   subscriberNumber =
 *       nationalSignificantNumber.substring(nationalDestinationCodeLength);
 * } else {
 *   nationalDestinationCode = '';
 *   subscriberNumber = nationalSignificantNumber;
 * }
 * </pre>
 *
 * Refer to the unittests to see the difference between this function and
 * {@link #getLengthOfGeographicalAreaCode}.
 *
 * @param {i18n.phonenumbers.PhoneNumber} number the PhoneNumber object for
 *     which clients want to know the length of the NDC.
 * @return {number} the length of NDC of the PhoneNumber object passed in.
 */
i18n.phonenumbers.PhoneNumberUtil.prototype.getLengthOfNationalDestinationCode =
    function(number) {

  /** @type {i18n.phonenumbers.PhoneNumber} */
  var copiedProto;
  if (number.hasExtension()) {
    // We don't want to alter the proto given to us, but we don't want to
    // include the extension when we format it, so we copy it and clear the
    // extension here.
    copiedProto = number.clone();
    copiedProto.clearExtension();
  } else {
    copiedProto = number;
  }

  /** @type {string} */
  var nationalSignificantNumber = this.format(copiedProto,
      i18n.phonenumbers.PhoneNumberFormat.INTERNATIONAL);
  /** @type {!Array.<string>} */
  var numberGroups = nationalSignificantNumber.split(
      i18n.phonenumbers.PhoneNumberUtil.NON_DIGITS_PATTERN_);
  // The pattern will start with '+COUNTRY_CODE ' so the first group will always
  // be the empty string (before the + symbol) and the second group will be the
  // country calling code. The third group will be area code if it is not the
  // last group.
  // NOTE: On IE the first group that is supposed to be the empty string does
  // not appear in the array of number groups... so make the result on non-IE
  // browsers to be that of IE.
  if (numberGroups[0].length == 0) {
    numberGroups.shift();
  }
  if (numberGroups.length <= 2) {
    return 0;
  }

  if (this.getNumberType(number) == i18n.phonenumbers.PhoneNumberType.MOBILE) {
    // For example Argentinian mobile numbers, when formatted in the
    // international format, are in the form of +54 9 NDC XXXX.... As a result,
    // we take the length of the third group (NDC) and add the length of the
    // mobile token, which also forms part of the national significant number.
    // This assumes that the mobile token is always formatted separately from
    // the rest of the phone number.
    /** @type {string} */
    var mobileToken = i18n.phonenumbers.PhoneNumberUtil.getCountryMobileToken(
        number.getCountryCodeOrDefault());
    if (mobileToken != '') {
      return numberGroups[2].length + mobileToken.length;
    }
  }
  return numberGroups[1].length;
};


/**
 * Returns the mobile token for the provided country calling code if it has
 * one, otherwise returns an empty string. A mobile token is a number inserted
 * before the area code when dialing a mobile number from that country from
 * abroad.
 *
 * @param {number} countryCallingCode the country calling code for which we
 *     want the mobile token.
 * @return {string} the mobile token for the given country calling code.
 */
i18n.phonenumbers.PhoneNumberUtil.getCountryMobileToken =
    function(countryCallingCode) {
  return i18n.phonenumbers.PhoneNumberUtil.MOBILE_TOKEN_MAPPINGS_[
      countryCallingCode] || '';
};


/**
 * Convenience method to get a list of what regions the library has metadata
 * for.
 * @return {!Array.<string>} region codes supported by the library.
 */
i18n.phonenumbers.PhoneNumberUtil.prototype.getSupportedRegions = function() {
  return goog.array.filter(
      Object.keys(i18n.phonenumbers.metadata.countryToMetadata),
      function(regionCode) {
        return isNaN(regionCode);
      });
};


/**
 * Convenience method to get a list of what global network calling codes the
 * library has metadata for.
 * @return {!Array.<number>} global network calling codes supported by the
 *     library.
 */
i18n.phonenumbers.PhoneNumberUtil.prototype.
    getSupportedGlobalNetworkCallingCodes = function() {
  var callingCodesAsStrings = goog.array.filter(
      Object.keys(i18n.phonenumbers.metadata.countryToMetadata),
      function(regionCode) {
        return !isNaN(regionCode);
      });
  return goog.array.map(callingCodesAsStrings,
      function(callingCode) {
        return parseInt(callingCode, 10);
      });
};


/**
 * Normalizes a string of characters representing a phone number by replacing
 * all characters found in the accompanying map with the values therein, and
 * stripping all other characters if removeNonMatches is true.
 *
 * @param {string} number a string of characters representing a phone number.
 * @param {!Object.<string, string>} normalizationReplacements a mapping of
 *     characters to what they should be replaced by in the normalized version
 *     of the phone number.
 * @param {boolean} removeNonMatches indicates whether characters that are not
 *     able to be replaced should be stripped from the number. If this is false,
 *     they will be left unchanged in the number.
 * @return {string} the normalized string version of the phone number.
 * @private
 */
i18n.phonenumbers.PhoneNumberUtil.normalizeHelper_ =
    function(number, normalizationReplacements, removeNonMatches) {

  /** @type {!goog.string.StringBuffer} */
  var normalizedNumber = new goog.string.StringBuffer();
  /** @type {string} */
  var character;
  /** @type {string} */
  var newDigit;
  /** @type {number} */
  var numberLength = number.length;
  for (var i = 0; i < numberLength; ++i) {
    character = number.charAt(i);
    newDigit = normalizationReplacements[character.toUpperCase()];
    if (newDigit != null) {
      normalizedNumber.append(newDigit);
    } else if (!removeNonMatches) {
      normalizedNumber.append(character);
    }
    // If neither of the above are true, we remove this character.
  }
  return normalizedNumber.toString();
};


/**
 * Helper function to check if the national prefix formatting rule has the first
 * group only, i.e., does not start with the national prefix.
 *
 * @param {string} nationalPrefixFormattingRule The formatting rule for the
 *     national prefix.
 * @return {boolean} true if the national prefix formatting rule has the first
 *     group only.
 */
i18n.phonenumbers.PhoneNumberUtil.prototype.formattingRuleHasFirstGroupOnly =
    function(nationalPrefixFormattingRule) {
  return nationalPrefixFormattingRule.length == 0 ||
      i18n.phonenumbers.PhoneNumberUtil.FIRST_GROUP_ONLY_PREFIX_PATTERN_.
          test(nationalPrefixFormattingRule);
};


/**
 * Tests whether a phone number has a geographical association. It checks if
 * the number is associated to a certain region in the country where it belongs
 * to. Note that this doesn't verify if the number is actually in use.
 *
 * @param {i18n.phonenumbers.PhoneNumber} phoneNumber The phone number to test.
 * @return {boolean} true if the phone number has a geographical association.
 */
i18n.phonenumbers.PhoneNumberUtil.prototype.isNumberGeographical =
    function(phoneNumber) {
  /** @type {i18n.phonenumbers.PhoneNumberType} */
  var numberType = this.getNumberType(phoneNumber);
  // TODO: Include mobile phone numbers from countries like Indonesia, which
  // has some mobile numbers that are geographical.
  return numberType == i18n.phonenumbers.PhoneNumberType.FIXED_LINE ||
      numberType == i18n.phonenumbers.PhoneNumberType.FIXED_LINE_OR_MOBILE;
};


/**
 * Helper function to check region code is not unknown or null.
 *
 * @param {?string} regionCode the ISO 3166-1 two-letter region code.
 * @return {boolean} true if region code is valid.
 * @private
 */
i18n.phonenumbers.PhoneNumberUtil.prototype.isValidRegionCode_ =
    function(regionCode) {

  // In Java we check whether the regionCode is contained in supportedRegions
  // that is built out of all the values of countryCallingCodeToRegionCodeMap
  // (countryCodeToRegionCodeMap in JS) minus REGION_CODE_FOR_NON_GEO_ENTITY.
  // In JS we check whether the regionCode is contained in the keys of
  // countryToMetadata but since for non-geographical country calling codes
  // (e.g. +800) we use the country calling codes instead of the region code as
  // key in the map we have to make sure regionCode is not a number to prevent
  // returning true for non-geographical country calling codes.
  return regionCode != null &&
      isNaN(regionCode) &&
      regionCode.toUpperCase() in i18n.phonenumbers.metadata.countryToMetadata;
};


/**
 * Helper function to check the country calling code is valid.
 *
 * @param {number} countryCallingCode the country calling code.
 * @return {boolean} true if country calling code code is valid.
 * @private
 */
i18n.phonenumbers.PhoneNumberUtil.prototype.hasValidCountryCallingCode_ =
    function(countryCallingCode) {

  return countryCallingCode in
      i18n.phonenumbers.metadata.countryCodeToRegionCodeMap;
};


/**
 * Formats a phone number in the specified format using default rules. Note that
 * this does not promise to produce a phone number that the user can dial from
 * where they are - although we do format in either 'national' or
 * 'international' format depending on what the client asks for, we do not
 * currently support a more abbreviated format, such as for users in the same
 * 'area' who could potentially dial the number without area code. Note that if
 * the phone number has a country calling code of 0 or an otherwise invalid
 * country calling code, we cannot work out which formatting rules to apply so
 * we return the national significant number with no formatting applied.
 *
 * @param {i18n.phonenumbers.PhoneNumber} number the phone number to be
 *     formatted.
 * @param {i18n.phonenumbers.PhoneNumberFormat} numberFormat the format the
 *     phone number should be formatted into.
 * @return {string} the formatted phone number.
 */
i18n.phonenumbers.PhoneNumberUtil.prototype.format =
    function(number, numberFormat) {

  if (number.getNationalNumber() == 0 && number.hasRawInput()) {
    // Unparseable numbers that kept their raw input just use that.
    // This is the only case where a number can be formatted as E164 without a
    // leading '+' symbol (but the original number wasn't parseable anyway).
    // TODO: Consider removing the 'if' above so that unparseable strings
    // without raw input format to the empty string instead of "+00"
    /** @type {string} */
    var rawInput = number.getRawInputOrDefault();
    if (rawInput.length > 0) {
      return rawInput;
    }
  }
  /** @type {number} */
  var countryCallingCode = number.getCountryCodeOrDefault();
  /** @type {string} */
  var nationalSignificantNumber = this.getNationalSignificantNumber(number);
  if (numberFormat == i18n.phonenumbers.PhoneNumberFormat.E164) {
    // Early exit for E164 case (even if the country calling code is invalid)
    // since no formatting of the national number needs to be applied.
    // Extensions are not formatted.
    return this.prefixNumberWithCountryCallingCode_(
        countryCallingCode, i18n.phonenumbers.PhoneNumberFormat.E164,
        nationalSignificantNumber, '');
  }
  if (!this.hasValidCountryCallingCode_(countryCallingCode)) {
    return nationalSignificantNumber;
  }
  // Note getRegionCodeForCountryCode() is used because formatting information
  // for regions which share a country calling code is contained by only one
  // region for performance reasons. For example, for NANPA regions it will be
  // contained in the metadata for US.
  /** @type {string} */
  var regionCode = this.getRegionCodeForCountryCode(countryCallingCode);

  // Metadata cannot be null because the country calling code is valid (which
  // means that the region code cannot be ZZ and must be one of our supported
  // region codes).
  /** @type {i18n.phonenumbers.PhoneMetadata} */
  var metadata =
      this.getMetadataForRegionOrCallingCode_(countryCallingCode, regionCode);
  /** @type {string} */
  var formattedExtension =
      this.maybeGetFormattedExtension_(number, metadata, numberFormat);
  /** @type {string} */
  var formattedNationalNumber =
      this.formatNsn_(nationalSignificantNumber, metadata, numberFormat);
  return this.prefixNumberWithCountryCallingCode_(countryCallingCode,
                                                  numberFormat,
                                                  formattedNationalNumber,
                                                  formattedExtension);
};


/**
 * Formats a phone number in the specified format using client-defined
 * formatting rules. Note that if the phone number has a country calling code of
 * zero or an otherwise invalid country calling code, we cannot work out things
 * like whether there should be a national prefix applied, or how to format
 * extensions, so we return the national significant number with no formatting
 * applied.
 *
 * @param {i18n.phonenumbers.PhoneNumber} number the phone  number to be
 *     formatted.
 * @param {i18n.phonenumbers.PhoneNumberFormat} numberFormat the format the
 *     phone number should be formatted into.
 * @param {Array.<i18n.phonenumbers.NumberFormat>} userDefinedFormats formatting
 *     rules specified by clients.
 * @return {string} the formatted phone number.
 */
i18n.phonenumbers.PhoneNumberUtil.prototype.formatByPattern =
    function(number, numberFormat, userDefinedFormats) {

  /** @type {number} */
  var countryCallingCode = number.getCountryCodeOrDefault();
  /** @type {string} */
  var nationalSignificantNumber = this.getNationalSignificantNumber(number);
  if (!this.hasValidCountryCallingCode_(countryCallingCode)) {
    return nationalSignificantNumber;
  }
  // Note getRegionCodeForCountryCode() is used because formatting information
  // for regions which share a country calling code is contained by only one
  // region for performance reasons. For example, for NANPA regions it will be
  // contained in the metadata for US.
  /** @type {string} */
  var regionCode = this.getRegionCodeForCountryCode(countryCallingCode);
  // Metadata cannot be null because the country calling code is valid
  /** @type {i18n.phonenumbers.PhoneMetadata} */
  var metadata =
      this.getMetadataForRegionOrCallingCode_(countryCallingCode, regionCode);

  /** @type {string} */
  var formattedNumber = '';

  /** @type {i18n.phonenumbers.NumberFormat} */
  var formattingPattern = this.chooseFormattingPatternForNumber_(
      userDefinedFormats, nationalSignificantNumber);
  if (formattingPattern == null) {
    // If no pattern above is matched, we format the number as a whole.
    formattedNumber = nationalSignificantNumber;
  } else {
    // Before we do a replacement of the national prefix pattern $NP with the
    // national prefix, we need to copy the rule so that subsequent replacements
    // for different numbers have the appropriate national prefix.
    /** @type {i18n.phonenumbers.NumberFormat} */
    var numFormatCopy = formattingPattern.clone();
    /** @type {string} */
    var nationalPrefixFormattingRule =
        formattingPattern.getNationalPrefixFormattingRuleOrDefault();
    if (nationalPrefixFormattingRule.length > 0) {
      /** @type {string} */
      var nationalPrefix = metadata.getNationalPrefixOrDefault();
      if (nationalPrefix.length > 0) {
        // Replace $NP with national prefix and $FG with the first group ($1).
        nationalPrefixFormattingRule = nationalPrefixFormattingRule
            .replace(i18n.phonenumbers.PhoneNumberUtil.NP_PATTERN_,
                     nationalPrefix)
            .replace(i18n.phonenumbers.PhoneNumberUtil.FG_PATTERN_, '$1');
        numFormatCopy.setNationalPrefixFormattingRule(
            nationalPrefixFormattingRule);
      } else {
        // We don't want to have a rule for how to format the national prefix if
        // there isn't one.
        numFormatCopy.clearNationalPrefixFormattingRule();
      }
    }
    formattedNumber = this.formatNsnUsingPattern_(
        nationalSignificantNumber, numFormatCopy, numberFormat);
  }

  /** @type {string} */
  var formattedExtension =
      this.maybeGetFormattedExtension_(number, metadata, numberFormat);
  return this.prefixNumberWithCountryCallingCode_(countryCallingCode,
                                                  numberFormat,
                                                  formattedNumber,
                                                  formattedExtension);
};


/**
 * Formats a phone number in national format for dialing using the carrier as
 * specified in the {@code carrierCode}. The {@code carrierCode} will always be
 * used regardless of whether the phone number already has a preferred domestic
 * carrier code stored. If {@code carrierCode} contains an empty string, returns
 * the number in national format without any carrier code.
 *
 * @param {i18n.phonenumbers.PhoneNumber} number the phone number to be
 *     formatted.
 * @param {string} carrierCode the carrier selection code to be used.
 * @return {string} the formatted phone number in national format for dialing
 *     using the carrier as specified in the {@code carrierCode}.
 */
i18n.phonenumbers.PhoneNumberUtil.prototype.
    formatNationalNumberWithCarrierCode = function(number, carrierCode) {

  /** @type {number} */
  var countryCallingCode = number.getCountryCodeOrDefault();
  /** @type {string} */
  var nationalSignificantNumber = this.getNationalSignificantNumber(number);
  if (!this.hasValidCountryCallingCode_(countryCallingCode)) {
    return nationalSignificantNumber;
  }

  // Note getRegionCodeForCountryCode() is used because formatting information
  // for regions which share a country calling code is contained by only one
  // region for performance reasons. For example, for NANPA regions it will be
  // contained in the metadata for US.
  /** @type {string} */
  var regionCode = this.getRegionCodeForCountryCode(countryCallingCode);
  // Metadata cannot be null because the country calling code is valid.
  /** @type {i18n.phonenumbers.PhoneMetadata} */
  var metadata =
      this.getMetadataForRegionOrCallingCode_(countryCallingCode, regionCode);
  /** @type {string} */
  var formattedExtension = this.maybeGetFormattedExtension_(
      number, metadata, i18n.phonenumbers.PhoneNumberFormat.NATIONAL);
  /** @type {string} */
  var formattedNationalNumber = this.formatNsn_(
      nationalSignificantNumber, metadata,
      i18n.phonenumbers.PhoneNumberFormat.NATIONAL, carrierCode);
  return this.prefixNumberWithCountryCallingCode_(
      countryCallingCode, i18n.phonenumbers.PhoneNumberFormat.NATIONAL,
      formattedNationalNumber, formattedExtension);
};


/**
 * @param {number} countryCallingCode
 * @param {?string} regionCode
 * @return {i18n.phonenumbers.PhoneMetadata}
 * @private
 */
i18n.phonenumbers.PhoneNumberUtil.prototype.getMetadataForRegionOrCallingCode_ =
    function(countryCallingCode, regionCode) {
  return i18n.phonenumbers.PhoneNumberUtil.REGION_CODE_FOR_NON_GEO_ENTITY ==
      regionCode ?
      this.getMetadataForNonGeographicalRegion(countryCallingCode) :
      this.getMetadataForRegion(regionCode);
};


/**
 * Formats a phone number in national format for dialing using the carrier as
 * specified in the preferred_domestic_carrier_code field of the PhoneNumber
 * object passed in. If that is missing, use the {@code fallbackCarrierCode}
 * passed in instead. If there is no {@code preferred_domestic_carrier_code},
 * and the {@code fallbackCarrierCode} contains an empty string, return the
 * number in national format without any carrier code.
 *
 * <p>Use {@link #formatNationalNumberWithCarrierCode} instead if the carrier
 * code passed in should take precedence over the number's
 * {@code preferred_domestic_carrier_code} when formatting.
 *
 * @param {i18n.phonenumbers.PhoneNumber} number the phone number to be
 *     formatted.
 * @param {string} fallbackCarrierCode the carrier selection code to be used, if
 *     none is found in the phone number itself.
 * @return {string} the formatted phone number in national format for dialing
 *     using the number's preferred_domestic_carrier_code, or the
 *     {@code fallbackCarrierCode} passed in if none is found.
 */
i18n.phonenumbers.PhoneNumberUtil.prototype.
    formatNationalNumberWithPreferredCarrierCode = function(
        number, fallbackCarrierCode) {
  return this.formatNationalNumberWithCarrierCode(
      number,
      number.hasPreferredDomesticCarrierCode() ?
          number.getPreferredDomesticCarrierCodeOrDefault() :
          fallbackCarrierCode);
};


/**
 * Returns a number formatted in such a way that it can be dialed from a mobile
 * phone in a specific region. If the number cannot be reached from the region
 * (e.g. some countries block toll-free numbers from being called outside of the
 * country), the method returns an empty string.
 *
 * @param {i18n.phonenumbers.PhoneNumber} number the phone number to be
 *     formatted.
 * @param {string} regionCallingFrom the region where the call is being placed.
 * @param {boolean} withFormatting whether the number should be returned with
 *     formatting symbols, such as spaces and dashes.
 * @return {string} the formatted phone number.
 */
i18n.phonenumbers.PhoneNumberUtil.prototype.formatNumberForMobileDialing =
    function(number, regionCallingFrom, withFormatting) {

  /** @type {number} */
  var countryCallingCode = number.getCountryCodeOrDefault();
  if (!this.hasValidCountryCallingCode_(countryCallingCode)) {
    return number.hasRawInput() ? number.getRawInputOrDefault() : '';
  }

  /** @type {string} */
  var formattedNumber = '';
  // Clear the extension, as that part cannot normally be dialed together with
  // the main number.
  /** @type {i18n.phonenumbers.PhoneNumber} */
  var numberNoExt = number.clone();
  numberNoExt.clearExtension();
  /** @type {string} */
  var regionCode = this.getRegionCodeForCountryCode(countryCallingCode);
  /** @type {i18n.phonenumbers.PhoneNumberType} */
  var numberType = this.getNumberType(numberNoExt);
  /** @type {boolean} */
  var isValidNumber = (numberType != i18n.phonenumbers.PhoneNumberType.UNKNOWN);
  if (regionCallingFrom == regionCode) {
    /** @type {boolean} */
    var isFixedLineOrMobile =
        (numberType == i18n.phonenumbers.PhoneNumberType.FIXED_LINE) ||
        (numberType == i18n.phonenumbers.PhoneNumberType.MOBILE) ||
        (numberType == i18n.phonenumbers.PhoneNumberType.FIXED_LINE_OR_MOBILE);
    // Carrier codes may be needed in some countries. We handle this here.
    if (regionCode == 'CO' &&
        numberType == i18n.phonenumbers.PhoneNumberType.FIXED_LINE) {
      formattedNumber = this.formatNationalNumberWithCarrierCode(
          numberNoExt,
          i18n.phonenumbers.PhoneNumberUtil
              .COLOMBIA_MOBILE_TO_FIXED_LINE_PREFIX_);
    } else if (regionCode == 'BR' && isFixedLineOrMobile) {
      formattedNumber = numberNoExt.hasPreferredDomesticCarrierCode() ?
          this.formatNationalNumberWithPreferredCarrierCode(numberNoExt, '') :
          // Brazilian fixed line and mobile numbers need to be dialed with a
          // carrier code when called within Brazil. Without that, most of the
          // carriers won't connect the call. Because of that, we return an
          // empty string here.
          '';
    } else if (isValidNumber && regionCode == 'HU') {
      // The national format for HU numbers doesn't contain the national prefix,
      // because that is how numbers are normally written down. However, the
      // national prefix is obligatory when dialing from a mobile phone. As a
      // result, we add it back here if it is a valid regular length phone
      // number.
      formattedNumber =
          this.getNddPrefixForRegion(regionCode, true /* strip non-digits */) +
          ' ' + this.format(numberNoExt,
              i18n.phonenumbers.PhoneNumberFormat.NATIONAL);
    } else if (countryCallingCode ==
               i18n.phonenumbers.PhoneNumberUtil.NANPA_COUNTRY_CODE_) {
      // For NANPA countries, we output international format for numbers that
      // can be dialed internationally, since that always works, except for
      // numbers which might potentially be short numbers, which are always
      // dialled in national format.
      /** @type {i18n.phonenumbers.PhoneMetadata} */
      var regionMetadata = this.getMetadataForRegion(regionCallingFrom);
      if (this.canBeInternationallyDialled(numberNoExt) &&
          !this.isShorterThanPossibleNormalNumber_(
              regionMetadata, this.getNationalSignificantNumber(numberNoExt))) {
        formattedNumber = this.format(
            numberNoExt, i18n.phonenumbers.PhoneNumberFormat.INTERNATIONAL);
      } else {
        formattedNumber = this.format(
            numberNoExt, i18n.phonenumbers.PhoneNumberFormat.NATIONAL);
      }
    } else {
      // For non-geographical countries, Mexican and Chilean fixed line and
      // mobile numbers, we output international format for numbers that can be
      // dialed internationally, as that always works.
      if ((regionCode ==
           i18n.phonenumbers.PhoneNumberUtil.REGION_CODE_FOR_NON_GEO_ENTITY ||
          // MX fixed line and mobile numbers should always be formatted in
          // international format, even when dialed within MX. For national
          // format to work, a carrier code needs to be used, and the correct
          // carrier code depends on if the caller and callee are from the
          // same local area. It is trickier to get that to work correctly than
          // using international format, which is tested to work fine on all
          // carriers.
          // CL fixed line numbers need the national prefix when dialing in the
          // national format, but don't have it when used for display. The
          // reverse is true for mobile numbers. As a result, we output them in
          // the international format to make it work.
          ((regionCode == 'MX' || regionCode == 'CL') &&
              isFixedLineOrMobile)) &&
          this.canBeInternationallyDialled(numberNoExt)) {
        formattedNumber = this.format(
            numberNoExt, i18n.phonenumbers.PhoneNumberFormat.INTERNATIONAL);
      } else {
        formattedNumber = this.format(
            numberNoExt, i18n.phonenumbers.PhoneNumberFormat.NATIONAL);
      }
    }
  } else if (isValidNumber && this.canBeInternationallyDialled(numberNoExt)) {
    // We assume that short numbers are not diallable from outside their region,
    // so if a number is not a valid regular length phone number, we treat it as
    // if it cannot be internationally dialled.
    return withFormatting ?
        this.format(numberNoExt,
                    i18n.phonenumbers.PhoneNumberFormat.INTERNATIONAL) :
        this.format(numberNoExt, i18n.phonenumbers.PhoneNumberFormat.E164);
  }
  return withFormatting ?
      formattedNumber :
      i18n.phonenumbers.PhoneNumberUtil.normalizeHelper_(formattedNumber,
          i18n.phonenumbers.PhoneNumberUtil.DIALLABLE_CHAR_MAPPINGS_, true);
};


/**
 * Formats a phone number for out-of-country dialing purposes. If no
 * regionCallingFrom is supplied, we format the number in its INTERNATIONAL
 * format. If the country calling code is the same as that of the region where
 * the number is from, then NATIONAL formatting will be applied.
 *
 * <p>If the number itself has a country calling code of zero or an otherwise
 * invalid country calling code, then we return the number with no formatting
 * applied.
 *
 * <p>Note this function takes care of the case for calling inside of NANPA and
 * between Russia and Kazakhstan (who share the same country calling code). In
 * those cases, no international prefix is used. For regions which have multiple
 * international prefixes, the number in its INTERNATIONAL format will be
 * returned instead.
 *
 * @param {i18n.phonenumbers.PhoneNumber} number the phone number to be
 *     formatted.
 * @param {string} regionCallingFrom the region where the call is being placed.
 * @return {string} the formatted phone number.
 */
i18n.phonenumbers.PhoneNumberUtil.prototype.formatOutOfCountryCallingNumber =
    function(number, regionCallingFrom) {

  if (!this.isValidRegionCode_(regionCallingFrom)) {
    return this.format(number,
                       i18n.phonenumbers.PhoneNumberFormat.INTERNATIONAL);
  }
  /** @type {number} */
  var countryCallingCode = number.getCountryCodeOrDefault();
  /** @type {string} */
  var nationalSignificantNumber = this.getNationalSignificantNumber(number);
  if (!this.hasValidCountryCallingCode_(countryCallingCode)) {
    return nationalSignificantNumber;
  }
  if (countryCallingCode ==
          i18n.phonenumbers.PhoneNumberUtil.NANPA_COUNTRY_CODE_) {
    if (this.isNANPACountry(regionCallingFrom)) {
      // For NANPA regions, return the national format for these regions but
      // prefix it with the country calling code.
      return countryCallingCode + ' ' +
          this.format(number, i18n.phonenumbers.PhoneNumberFormat.NATIONAL);
    }
  } else if (countryCallingCode ==
                 this.getCountryCodeForValidRegion_(regionCallingFrom)) {
    // If regions share a country calling code, the country calling code need
    // not be dialled. This also applies when dialling within a region, so this
    // if clause covers both these cases. Technically this is the case for
    // dialling from La Reunion to other overseas departments of France (French
    // Guiana, Martinique, Guadeloupe), but not vice versa - so we don't cover
    // this edge case for now and for those cases return the version including
    // country calling code. Details here:
    // http://www.petitfute.com/voyage/225-info-pratiques-reunion
    return this.format(number,
                       i18n.phonenumbers.PhoneNumberFormat.NATIONAL);
  }
  // Metadata cannot be null because we checked 'isValidRegionCode()' above.
  /** @type {i18n.phonenumbers.PhoneMetadata} */
  var metadataForRegionCallingFrom =
      this.getMetadataForRegion(regionCallingFrom);
  /** @type {string} */
  var internationalPrefix =
      metadataForRegionCallingFrom.getInternationalPrefixOrDefault();

  // For regions that have multiple international prefixes, the international
  // format of the number is returned, unless there is a preferred international
  // prefix.
  /** @type {string} */
  var internationalPrefixForFormatting = '';
  if (i18n.phonenumbers.PhoneNumberUtil.matchesEntirely_(
      i18n.phonenumbers.PhoneNumberUtil.UNIQUE_INTERNATIONAL_PREFIX_,
      internationalPrefix)) {
    internationalPrefixForFormatting = internationalPrefix;
  } else if (metadataForRegionCallingFrom.hasPreferredInternationalPrefix()) {
    internationalPrefixForFormatting =
        metadataForRegionCallingFrom.getPreferredInternationalPrefixOrDefault();
  }

  /** @type {string} */
  var regionCode = this.getRegionCodeForCountryCode(countryCallingCode);
  // Metadata cannot be null because the country calling code is valid.
  /** @type {i18n.phonenumbers.PhoneMetadata} */
  var metadataForRegion =
      this.getMetadataForRegionOrCallingCode_(countryCallingCode, regionCode);
  /** @type {string} */
  var formattedNationalNumber = this.formatNsn_(
      nationalSignificantNumber, metadataForRegion,
      i18n.phonenumbers.PhoneNumberFormat.INTERNATIONAL);
  /** @type {string} */
  var formattedExtension = this.maybeGetFormattedExtension_(number,
      metadataForRegion, i18n.phonenumbers.PhoneNumberFormat.INTERNATIONAL);
  return internationalPrefixForFormatting.length > 0 ?
      internationalPrefixForFormatting + ' ' + countryCallingCode + ' ' +
          formattedNationalNumber + formattedExtension :
      this.prefixNumberWithCountryCallingCode_(
          countryCallingCode, i18n.phonenumbers.PhoneNumberFormat.INTERNATIONAL,
          formattedNationalNumber, formattedExtension);
};


/**
 * Formats a phone number using the original phone number format that the number
 * is parsed from. The original format is embedded in the country_code_source
 * field of the PhoneNumber object passed in. If such information is missing,
 * the number will be formatted into the NATIONAL format by default. When the
 * number contains a leading zero and this is unexpected for this country, or we
 * don't have a formatting pattern for the number, the method returns the raw
 * input when it is available.
 *
 * Note this method guarantees no digit will be inserted, removed or modified as
 * a result of formatting.
 *
 * @param {i18n.phonenumbers.PhoneNumber} number the phone number that needs to
 *     be formatted in its original number format.
 * @param {string} regionCallingFrom the region whose IDD needs to be prefixed
 *     if the original number has one.
 * @return {string} the formatted phone number in its original number format.
 */
i18n.phonenumbers.PhoneNumberUtil.prototype.formatInOriginalFormat =
    function(number, regionCallingFrom) {

  if (number.hasRawInput() &&
      (this.hasUnexpectedItalianLeadingZero_(number) ||
       !this.hasFormattingPatternForNumber_(number))) {
    // We check if we have the formatting pattern because without that, we might
    // format the number as a group without national prefix.
    return number.getRawInputOrDefault();
  }
  if (!number.hasCountryCodeSource()) {
    return this.format(number, i18n.phonenumbers.PhoneNumberFormat.NATIONAL);
  }
  /** @type {string} */
  var formattedNumber;
  switch (number.getCountryCodeSource()) {
    case i18n.phonenumbers.PhoneNumber.CountryCodeSource
        .FROM_NUMBER_WITH_PLUS_SIGN:
      formattedNumber = this.format(number,
          i18n.phonenumbers.PhoneNumberFormat.INTERNATIONAL);
      break;
    case i18n.phonenumbers.PhoneNumber.CountryCodeSource.FROM_NUMBER_WITH_IDD:
      formattedNumber =
          this.formatOutOfCountryCallingNumber(number, regionCallingFrom);
      break;
    case i18n.phonenumbers.PhoneNumber.CountryCodeSource
        .FROM_NUMBER_WITHOUT_PLUS_SIGN:
      formattedNumber = this.format(number,
          i18n.phonenumbers.PhoneNumberFormat.INTERNATIONAL).substring(1);
      break;
    case i18n.phonenumbers.PhoneNumber.CountryCodeSource.FROM_DEFAULT_COUNTRY:
      // Fall-through to default case.
    default:
      /** @type {string} */
      var regionCode =
          this.getRegionCodeForCountryCode(number.getCountryCodeOrDefault());
      // We strip non-digits from the NDD here, and from the raw input later,
      // so that we can compare them easily.
      /** @type {?string} */
      var nationalPrefix = this.getNddPrefixForRegion(regionCode, true);
      /** @type {string} */
      var nationalFormat =
          this.format(number, i18n.phonenumbers.PhoneNumberFormat.NATIONAL);
      if (nationalPrefix == null || nationalPrefix.length == 0) {
        // If the region doesn't have a national prefix at all, we can safely
        // return the national format without worrying about a national prefix
        // being added.
        formattedNumber = nationalFormat;
        break;
      }
      // Otherwise, we check if the original number was entered with a national
      // prefix.
      if (this.rawInputContainsNationalPrefix_(
          number.getRawInputOrDefault(), nationalPrefix, regionCode)) {
        // If so, we can safely return the national format.
        formattedNumber = nationalFormat;
        break;
      }
      // Metadata cannot be null here because getNddPrefixForRegion() (above)
      // returns null if there is no metadata for the region.
      /** @type {i18n.phonenumbers.PhoneMetadata} */
      var metadata = this.getMetadataForRegion(regionCode);
      /** @type {string} */
      var nationalNumber = this.getNationalSignificantNumber(number);
      /** @type {i18n.phonenumbers.NumberFormat} */
      var formatRule = this.chooseFormattingPatternForNumber_(
          metadata.numberFormatArray(), nationalNumber);
      // The format rule could still be null here if the national number was 0
      // and there was no raw input (this should not be possible for numbers
      // generated by the phonenumber library as they would also not have a
      // country calling code and we would have exited earlier).
      if (formatRule == null) {
        formattedNumber = nationalFormat;
        break;
      }
      // When the format we apply to this number doesn't contain national
      // prefix, we can just return the national format.
      // TODO: Refactor the code below with the code in
      // isNationalPrefixPresentIfRequired.
      /** @type {string} */
      var candidateNationalPrefixRule =
          formatRule.getNationalPrefixFormattingRuleOrDefault();
      // We assume that the first-group symbol will never be _before_ the
      // national prefix.
      /** @type {number} */
      var indexOfFirstGroup = candidateNationalPrefixRule.indexOf('$1');
      if (indexOfFirstGroup <= 0) {
        formattedNumber = nationalFormat;
        break;
      }
      candidateNationalPrefixRule =
          candidateNationalPrefixRule.substring(0, indexOfFirstGroup);
      candidateNationalPrefixRule = i18n.phonenumbers.PhoneNumberUtil
          .normalizeDigitsOnly(candidateNationalPrefixRule);
      if (candidateNationalPrefixRule.length == 0) {
        // National prefix not used when formatting this number.
        formattedNumber = nationalFormat;
        break;
      }
      // Otherwise, we need to remove the national prefix from our output.
      /** @type {i18n.phonenumbers.NumberFormat} */
      var numFormatCopy = formatRule.clone();
      numFormatCopy.clearNationalPrefixFormattingRule();
      formattedNumber = this.formatByPattern(number,
          i18n.phonenumbers.PhoneNumberFormat.NATIONAL, [numFormatCopy]);
      break;
  }
  /** @type {string} */
  var rawInput = number.getRawInputOrDefault();
  // If no digit is inserted/removed/modified as a result of our formatting, we
  // return the formatted phone number; otherwise we return the raw input the
  // user entered.
  if (formattedNumber != null && rawInput.length > 0) {
    /** @type {string} */
    var normalizedFormattedNumber =
        i18n.phonenumbers.PhoneNumberUtil.normalizeHelper_(formattedNumber,
            i18n.phonenumbers.PhoneNumberUtil.DIALLABLE_CHAR_MAPPINGS_,
            true /* remove non matches */);
    /** @type {string} */
    var normalizedRawInput =
        i18n.phonenumbers.PhoneNumberUtil.normalizeHelper_(rawInput,
            i18n.phonenumbers.PhoneNumberUtil.DIALLABLE_CHAR_MAPPINGS_,
            true /* remove non matches */);
    if (normalizedFormattedNumber != normalizedRawInput) {
      formattedNumber = rawInput;
    }
  }
  return formattedNumber;
};


/**
 * Check if rawInput, which is assumed to be in the national format, has a
 * national prefix. The national prefix is assumed to be in digits-only form.
 * @param {string} rawInput
 * @param {string} nationalPrefix
 * @param {string} regionCode
 * @return {boolean}
 * @private
 */
i18n.phonenumbers.PhoneNumberUtil.prototype.rawInputContainsNationalPrefix_ =
    function(rawInput, nationalPrefix, regionCode) {

  /** @type {string} */
  var normalizedNationalNumber =
      i18n.phonenumbers.PhoneNumberUtil.normalizeDigitsOnly(rawInput);
  if (goog.string.startsWith(normalizedNationalNumber, nationalPrefix)) {
    try {
      // Some Japanese numbers (e.g. 00777123) might be mistaken to contain the
      // national prefix when written without it (e.g. 0777123) if we just do
      // prefix matching. To tackle that, we check the validity of the number if
      // the assumed national prefix is removed (777123 won't be valid in
      // Japan).
      return this.isValidNumber(
          this.parse(normalizedNationalNumber.substring(nationalPrefix.length),
                     regionCode));
    } catch (e) {
      return false;
    }
  }
  return false;
};


/**
 * Returns true if a number is from a region whose national significant number
 * couldn't contain a leading zero, but has the italian_leading_zero field set
 * to true.
 * @param {i18n.phonenumbers.PhoneNumber} number
 * @return {boolean}
 * @private
 */
i18n.phonenumbers.PhoneNumberUtil.prototype.hasUnexpectedItalianLeadingZero_ =
    function(number) {

  return number.hasItalianLeadingZero() &&
      !this.isLeadingZeroPossible(number.getCountryCodeOrDefault());
};


/**
 * @param {i18n.phonenumbers.PhoneNumber} number
 * @return {boolean}
 * @private
 */
i18n.phonenumbers.PhoneNumberUtil.prototype.hasFormattingPatternForNumber_ =
    function(number) {

  /** @type {number} */
  var countryCallingCode = number.getCountryCodeOrDefault();
  /** @type {string} */
  var phoneNumberRegion = this.getRegionCodeForCountryCode(countryCallingCode);
  /** @type {i18n.phonenumbers.PhoneMetadata} */
  var metadata = this.getMetadataForRegionOrCallingCode_(
      countryCallingCode, phoneNumberRegion);
  if (metadata == null) {
    return false;
  }
  /** @type {string} */
  var nationalNumber = this.getNationalSignificantNumber(number);
  /** @type {i18n.phonenumbers.NumberFormat} */
  var formatRule = this.chooseFormattingPatternForNumber_(
      metadata.numberFormatArray(), nationalNumber);
  return formatRule != null;
};


/**
 * Formats a phone number for out-of-country dialing purposes.
 *
 * Note that in this version, if the number was entered originally using alpha
 * characters and this version of the number is stored in raw_input, this
 * representation of the number will be used rather than the digit
 * representation. Grouping information, as specified by characters such as '-'
 * and ' ', will be retained.
 *
 * <p><b>Caveats:</b></p>
 * <ul>
 * <li>This will not produce good results if the country calling code is both
 * present in the raw input _and_ is the start of the national number. This is
 * not a problem in the regions which typically use alpha numbers.
 * <li>This will also not produce good results if the raw input has any grouping
 * information within the first three digits of the national number, and if the
 * function needs to strip preceding digits/words in the raw input before these
 * digits. Normally people group the first three digits together so this is not
 * a huge problem - and will be fixed if it proves to be so.
 * </ul>
 *
 * @param {i18n.phonenumbers.PhoneNumber} number the phone number that needs to
 *     be formatted.
 * @param {string} regionCallingFrom the region where the call is being placed.
 * @return {string} the formatted phone number.
 */
i18n.phonenumbers.PhoneNumberUtil.prototype.
    formatOutOfCountryKeepingAlphaChars = function(number, regionCallingFrom) {
  /** @type {string} */
  var rawInput = number.getRawInputOrDefault();
  // If there is no raw input, then we can't keep alpha characters because there
  // aren't any. In this case, we return formatOutOfCountryCallingNumber.
  if (rawInput.length == 0) {
    return this.formatOutOfCountryCallingNumber(number, regionCallingFrom);
  }
  /** @type {number} */
  var countryCode = number.getCountryCodeOrDefault();
  if (!this.hasValidCountryCallingCode_(countryCode)) {
    return rawInput;
  }
  // Strip any prefix such as country calling code, IDD, that was present. We do
  // this by comparing the number in raw_input with the parsed number. To do
  // this, first we normalize punctuation. We retain number grouping symbols
  // such as ' ' only.
  rawInput = i18n.phonenumbers.PhoneNumberUtil.normalizeHelper_(
      rawInput,
      i18n.phonenumbers.PhoneNumberUtil.ALL_PLUS_NUMBER_GROUPING_SYMBOLS_,
      true);
  // Now we trim everything before the first three digits in the parsed number.
  // We choose three because all valid alpha numbers have 3 digits at the start
  // - if it does not, then we don't trim anything at all. Similarly, if the
  // national number was less than three digits, we don't trim anything at all.
  /** @type {string} */
  var nationalNumber = this.getNationalSignificantNumber(number);
  if (nationalNumber.length > 3) {
    /** @type {number} */
    var firstNationalNumberDigit =
        rawInput.indexOf(nationalNumber.substring(0, 3));
    if (firstNationalNumberDigit != -1) {
      rawInput = rawInput.substring(firstNationalNumberDigit);
    }
  }
  /** @type {i18n.phonenumbers.PhoneMetadata} */
  var metadataForRegionCallingFrom =
      this.getMetadataForRegion(regionCallingFrom);
  if (countryCode == i18n.phonenumbers.PhoneNumberUtil.NANPA_COUNTRY_CODE_) {
    if (this.isNANPACountry(regionCallingFrom)) {
      return countryCode + ' ' + rawInput;
    }
  } else if (metadataForRegionCallingFrom != null &&
      countryCode == this.getCountryCodeForValidRegion_(regionCallingFrom)) {
    /** @type {i18n.phonenumbers.NumberFormat} */
    var formattingPattern = this.chooseFormattingPatternForNumber_(
        metadataForRegionCallingFrom.numberFormatArray(), nationalNumber);
    if (formattingPattern == null) {
      // If no pattern above is matched, we format the original input.
      return rawInput;
    }
    /** @type {i18n.phonenumbers.NumberFormat} */
    var newFormat = formattingPattern.clone();
    // The first group is the first group of digits that the user wrote
    // together.
    newFormat.setPattern('(\\d+)(.*)');
    // Here we just concatenate them back together after the national prefix
    // has been fixed.
    newFormat.setFormat('$1$2');
    // Now we format using this pattern instead of the default pattern, but
    // with the national prefix prefixed if necessary.
    // This will not work in the cases where the pattern (and not the leading
    // digits) decide whether a national prefix needs to be used, since we have
    // overridden the pattern to match anything, but that is not the case in the
    // metadata to date.
    return this.formatNsnUsingPattern_(rawInput, newFormat,
        i18n.phonenumbers.PhoneNumberFormat.NATIONAL);
  }
  /** @type {string} */
  var internationalPrefixForFormatting = '';
  // If an unsupported region-calling-from is entered, or a country with
  // multiple international prefixes, the international format of the number is
  // returned, unless there is a preferred international prefix.
  if (metadataForRegionCallingFrom != null) {
    /** @type {string} */
    var internationalPrefix =
        metadataForRegionCallingFrom.getInternationalPrefixOrDefault();
    internationalPrefixForFormatting =
        i18n.phonenumbers.PhoneNumberUtil.matchesEntirely_(
            i18n.phonenumbers.PhoneNumberUtil.UNIQUE_INTERNATIONAL_PREFIX_,
            internationalPrefix) ?
        internationalPrefix :
        metadataForRegionCallingFrom.getPreferredInternationalPrefixOrDefault();
  }
  /** @type {string} */
  var regionCode = this.getRegionCodeForCountryCode(countryCode);
  // Metadata cannot be null because the country calling code is valid.
  /** @type {i18n.phonenumbers.PhoneMetadata} */
  var metadataForRegion =
      this.getMetadataForRegionOrCallingCode_(countryCode, regionCode);
  /** @type {string} */
  var formattedExtension = this.maybeGetFormattedExtension_(
      number, metadataForRegion,
      i18n.phonenumbers.PhoneNumberFormat.INTERNATIONAL);
  if (internationalPrefixForFormatting.length > 0) {
    return internationalPrefixForFormatting + ' ' + countryCode + ' ' +
        rawInput + formattedExtension;
  } else {
    // Invalid region entered as country-calling-from (so no metadata was found
    // for it) or the region chosen has multiple international dialling
    // prefixes.
    return this.prefixNumberWithCountryCallingCode_(
        countryCode, i18n.phonenumbers.PhoneNumberFormat.INTERNATIONAL,
        rawInput, formattedExtension);
  }
};


/**
 * Gets the national significant number of the a phone number. Note a national
 * significant number doesn't contain a national prefix or any formatting.
 *
 * @param {i18n.phonenumbers.PhoneNumber} number the phone number for which the
 *     national significant number is needed.
 * @return {string} the national significant number of the PhoneNumber object
 *     passed in.
 */
i18n.phonenumbers.PhoneNumberUtil.prototype.getNationalSignificantNumber =
    function(number) {

  // If leading zero(s) have been set, we prefix this now. Note this is not a
  // national prefix.
  /** @type {string} */
  var nationalNumber = '' + number.getNationalNumber();
  if (number.hasItalianLeadingZero() && number.getItalianLeadingZero()) {
    return Array(number.getNumberOfLeadingZerosOrDefault() + 1).join('0') +
        nationalNumber;
  }
  return nationalNumber;
};


/**
 * A helper function that is used by format and formatByPattern.
 *
 * @param {number} countryCallingCode the country calling code.
 * @param {i18n.phonenumbers.PhoneNumberFormat} numberFormat the format the
 *     phone number should be formatted into.
 * @param {string} formattedNationalNumber
 * @param {string} formattedExtension
 * @return {string} the formatted phone number.
 * @private
 */
i18n.phonenumbers.PhoneNumberUtil.prototype.
    prefixNumberWithCountryCallingCode_ = function(countryCallingCode,
                                                   numberFormat,
                                                   formattedNationalNumber,
                                                   formattedExtension) {

  switch (numberFormat) {
    case i18n.phonenumbers.PhoneNumberFormat.E164:
      return i18n.phonenumbers.PhoneNumberUtil.PLUS_SIGN + countryCallingCode +
          formattedNationalNumber + formattedExtension;
    case i18n.phonenumbers.PhoneNumberFormat.INTERNATIONAL:
      return i18n.phonenumbers.PhoneNumberUtil.PLUS_SIGN + countryCallingCode +
          ' ' + formattedNationalNumber + formattedExtension;
    case i18n.phonenumbers.PhoneNumberFormat.RFC3966:
      return i18n.phonenumbers.PhoneNumberUtil.RFC3966_PREFIX_ +
          i18n.phonenumbers.PhoneNumberUtil.PLUS_SIGN + countryCallingCode +
          '-' + formattedNationalNumber + formattedExtension;
    case i18n.phonenumbers.PhoneNumberFormat.NATIONAL:
    default:
      return formattedNationalNumber + formattedExtension;
  }
};


/**
 * Note in some regions, the national number can be written in two completely
 * different ways depending on whether it forms part of the NATIONAL format or
 * INTERNATIONAL format. The numberFormat parameter here is used to specify
 * which format to use for those cases. If a carrierCode is specified, this will
 * be inserted into the formatted string to replace $CC.
 *
 * @param {string} number a string of characters representing a phone number.
 * @param {i18n.phonenumbers.PhoneMetadata} metadata the metadata for the
 *     region that we think this number is from.
 * @param {i18n.phonenumbers.PhoneNumberFormat} numberFormat the format the
 *     phone number should be formatted into.
 * @param {string=} opt_carrierCode
 * @return {string} the formatted phone number.
 * @private
 */
i18n.phonenumbers.PhoneNumberUtil.prototype.formatNsn_ =
    function(number, metadata, numberFormat, opt_carrierCode) {

  /** @type {Array.<i18n.phonenumbers.NumberFormat>} */
  var intlNumberFormats = metadata.intlNumberFormatArray();
  // When the intlNumberFormats exists, we use that to format national number
  // for the INTERNATIONAL format instead of using the numberDesc.numberFormats.
  /** @type {Array.<i18n.phonenumbers.NumberFormat>} */
  var availableFormats =
      (intlNumberFormats.length == 0 ||
          numberFormat == i18n.phonenumbers.PhoneNumberFormat.NATIONAL) ?
      metadata.numberFormatArray() : metadata.intlNumberFormatArray();
  /** @type {i18n.phonenumbers.NumberFormat} */
  var formattingPattern = this.chooseFormattingPatternForNumber_(
      availableFormats, number);
  return (formattingPattern == null) ?
      number :
      this.formatNsnUsingPattern_(number, formattingPattern,
                                  numberFormat, opt_carrierCode);
};


/**
 * @param {Array.<i18n.phonenumbers.NumberFormat>} availableFormats the
 *     available formats the phone number could be formatted into.
 * @param {string} nationalNumber a string of characters representing a phone
 *     number.
 * @return {i18n.phonenumbers.NumberFormat}
 * @private
 */
i18n.phonenumbers.PhoneNumberUtil.prototype.chooseFormattingPatternForNumber_ =
    function(availableFormats, nationalNumber) {

  /** @type {i18n.phonenumbers.NumberFormat} */
  var numFormat;
  /** @type {number} */
  var l = availableFormats.length;
  for (var i = 0; i < l; ++i) {
    numFormat = availableFormats[i];
    /** @type {number} */
    var size = numFormat.leadingDigitsPatternCount();
    if (size == 0 ||
        // We always use the last leading_digits_pattern, as it is the most
        // detailed.
        nationalNumber
            .search(numFormat.getLeadingDigitsPattern(size - 1)) == 0) {
      /** @type {!RegExp} */
      var patternToMatch = new RegExp(numFormat.getPattern());
      if (i18n.phonenumbers.PhoneNumberUtil.matchesEntirely_(patternToMatch,
                                                             nationalNumber)) {
        return numFormat;
      }
    }
  }
  return null;
};


/**
 * Note that carrierCode is optional - if null or an empty string, no carrier
 * code replacement will take place.
 *
 * @param {string} nationalNumber a string of characters representing a phone
 *     number.
 * @param {i18n.phonenumbers.NumberFormat} formattingPattern the formatting rule
 *     the phone number should be formatted into.
 * @param {i18n.phonenumbers.PhoneNumberFormat} numberFormat the format the
 *     phone number should be formatted into.
 * @param {string=} opt_carrierCode
 * @return {string} the formatted phone number.
 * @private
 */
i18n.phonenumbers.PhoneNumberUtil.prototype.formatNsnUsingPattern_ =
    function(nationalNumber, formattingPattern, numberFormat, opt_carrierCode) {

  /** @type {string} */
  var numberFormatRule = formattingPattern.getFormatOrDefault();
  /** @type {!RegExp} */
  var patternToMatch = new RegExp(formattingPattern.getPattern());
  /** @type {string} */
  var domesticCarrierCodeFormattingRule =
      formattingPattern.getDomesticCarrierCodeFormattingRuleOrDefault();
  /** @type {string} */
  var formattedNationalNumber = '';
  if (numberFormat == i18n.phonenumbers.PhoneNumberFormat.NATIONAL &&
      opt_carrierCode != null && opt_carrierCode.length > 0 &&
      domesticCarrierCodeFormattingRule.length > 0) {
    // Replace the $CC in the formatting rule with the desired carrier code.
    /** @type {string} */
    var carrierCodeFormattingRule = domesticCarrierCodeFormattingRule
        .replace(i18n.phonenumbers.PhoneNumberUtil.CC_PATTERN_,
                 opt_carrierCode);
    // Now replace the $FG in the formatting rule with the first group and
    // the carrier code combined in the appropriate way.
    numberFormatRule = numberFormatRule.replace(
        i18n.phonenumbers.PhoneNumberUtil.FIRST_GROUP_PATTERN_,
        carrierCodeFormattingRule);
    formattedNationalNumber =
        nationalNumber.replace(patternToMatch, numberFormatRule);
  } else {
    // Use the national prefix formatting rule instead.
    /** @type {string} */
    var nationalPrefixFormattingRule =
        formattingPattern.getNationalPrefixFormattingRuleOrDefault();
    if (numberFormat == i18n.phonenumbers.PhoneNumberFormat.NATIONAL &&
        nationalPrefixFormattingRule != null &&
        nationalPrefixFormattingRule.length > 0) {
      formattedNationalNumber = nationalNumber.replace(patternToMatch,
          numberFormatRule.replace(
              i18n.phonenumbers.PhoneNumberUtil.FIRST_GROUP_PATTERN_,
              nationalPrefixFormattingRule));
    } else {
      formattedNationalNumber =
          nationalNumber.replace(patternToMatch, numberFormatRule);
    }
  }
  if (numberFormat == i18n.phonenumbers.PhoneNumberFormat.RFC3966) {
    // Strip any leading punctuation.
    formattedNationalNumber = formattedNationalNumber.replace(
        new RegExp('^' + i18n.phonenumbers.PhoneNumberUtil.SEPARATOR_PATTERN_),
        '');
    // Replace the rest with a dash between each number group.
    formattedNationalNumber = formattedNationalNumber.replace(
        new RegExp(i18n.phonenumbers.PhoneNumberUtil.SEPARATOR_PATTERN_, 'g'),
        '-');
  }
  return formattedNationalNumber;
};


/**
 * Gets a valid number for the specified region.
 *
 * @param {string} regionCode the region for which an example number is needed.
 * @return {i18n.phonenumbers.PhoneNumber} a valid fixed-line number for the
 *     specified region. Returns null when the metadata does not contain such
 *     information, or the region 001 is passed in. For 001 (representing non-
 *     geographical numbers), call {@link #getExampleNumberForNonGeoEntity}
 *     instead.
 */
i18n.phonenumbers.PhoneNumberUtil.prototype.getExampleNumber =
    function(regionCode) {

  return this.getExampleNumberForType(regionCode,
      i18n.phonenumbers.PhoneNumberType.FIXED_LINE);
};


/**
 * Gets a valid number for the specified region and number type.
 *
 * @param {string} regionCode the region for which an example number is needed.
 * @param {i18n.phonenumbers.PhoneNumberType} type the type of number that is
 *     needed.
 * @return {i18n.phonenumbers.PhoneNumber} a valid number for the specified
 *     region and type. Returns null when the metadata does not contain such
 *     information or if an invalid region or region 001 was entered.
 *     For 001 (representing non-geographical numbers), call
 *     {@link #getExampleNumberForNonGeoEntity} instead.
 */
i18n.phonenumbers.PhoneNumberUtil.prototype.getExampleNumberForType =
    function(regionCode, type) {

  // Check the region code is valid.
  if (!this.isValidRegionCode_(regionCode)) {
    return null;
  }
  /** @type {i18n.phonenumbers.PhoneNumberDesc} */
  var desc = this.getNumberDescByType_(
      this.getMetadataForRegion(regionCode), type);
  try {
    if (desc.hasExampleNumber()) {
      return this.parse(desc.getExampleNumberOrDefault(), regionCode);
    }
  } catch (e) {
  }
  return null;
};


/**
 * Gets a valid number for the specified country calling code for a
 * non-geographical entity.
 *
 * @param {number} countryCallingCode the country calling code for a
 *     non-geographical entity.
 * @return {i18n.phonenumbers.PhoneNumber} a valid number for the
 *     non-geographical entity. Returns null when the metadata does not contain
 *     such information, or the country calling code passed in does not belong
 *     to a non-geographical entity.
 */
i18n.phonenumbers.PhoneNumberUtil.prototype.getExampleNumberForNonGeoEntity =
    function(countryCallingCode) {
  /** @type {i18n.phonenumbers.PhoneMetadata} */
  var metadata =
      this.getMetadataForNonGeographicalRegion(countryCallingCode);
  if (metadata != null) {
    /** @type {i18n.phonenumbers.PhoneNumberDesc} */
    var desc = metadata.getGeneralDesc();
    try {
      if (desc.hasExampleNumber()) {
        return this.parse('+' + countryCallingCode + desc.getExampleNumber(),
                          'ZZ');
      }
    } catch (e) {
    }
  }
  return null;
};


/**
 * Gets the formatted extension of a phone number, if the phone number had an
 * extension specified. If not, it returns an empty string.
 *
 * @param {i18n.phonenumbers.PhoneNumber} number the PhoneNumber that might have
 *     an extension.
 * @param {i18n.phonenumbers.PhoneMetadata} metadata the metadata for the
 *     region that we think this number is from.
 * @param {i18n.phonenumbers.PhoneNumberFormat} numberFormat the format the
 *     phone number should be formatted into.
 * @return {string} the formatted extension if any.
 * @private
 */
i18n.phonenumbers.PhoneNumberUtil.prototype.maybeGetFormattedExtension_ =
    function(number, metadata, numberFormat) {

  if (!number.hasExtension() || number.getExtension().length == 0) {
    return '';
  } else {
    if (numberFormat == i18n.phonenumbers.PhoneNumberFormat.RFC3966) {
      return i18n.phonenumbers.PhoneNumberUtil.RFC3966_EXTN_PREFIX_ +
          number.getExtension();
    } else {
      if (metadata.hasPreferredExtnPrefix()) {
        return metadata.getPreferredExtnPrefix() +
            number.getExtensionOrDefault();
      } else {
        return i18n.phonenumbers.PhoneNumberUtil.DEFAULT_EXTN_PREFIX_ +
            number.getExtensionOrDefault();
      }
    }
  }
};


/**
 * @param {i18n.phonenumbers.PhoneMetadata} metadata
 * @param {i18n.phonenumbers.PhoneNumberType} type
 * @return {i18n.phonenumbers.PhoneNumberDesc}
 * @private
 */
i18n.phonenumbers.PhoneNumberUtil.prototype.getNumberDescByType_ =
    function(metadata, type) {

  switch (type) {
    case i18n.phonenumbers.PhoneNumberType.PREMIUM_RATE:
      return metadata.getPremiumRate();
    case i18n.phonenumbers.PhoneNumberType.TOLL_FREE:
      return metadata.getTollFree();
    case i18n.phonenumbers.PhoneNumberType.MOBILE:
      return metadata.getMobile();
    case i18n.phonenumbers.PhoneNumberType.FIXED_LINE:
    case i18n.phonenumbers.PhoneNumberType.FIXED_LINE_OR_MOBILE:
      return metadata.getFixedLine();
    case i18n.phonenumbers.PhoneNumberType.SHARED_COST:
      return metadata.getSharedCost();
    case i18n.phonenumbers.PhoneNumberType.VOIP:
      return metadata.getVoip();
    case i18n.phonenumbers.PhoneNumberType.PERSONAL_NUMBER:
      return metadata.getPersonalNumber();
    case i18n.phonenumbers.PhoneNumberType.PAGER:
      return metadata.getPager();
    case i18n.phonenumbers.PhoneNumberType.UAN:
      return metadata.getUan();
    case i18n.phonenumbers.PhoneNumberType.VOICEMAIL:
      return metadata.getVoicemail();
    default:
      return metadata.getGeneralDesc();
  }
};


/**
 * Gets the type of a phone number.
 *
 * @param {i18n.phonenumbers.PhoneNumber} number the phone number that we want
 *     to know the type.
 * @return {i18n.phonenumbers.PhoneNumberType} the type of the phone number.
 */
i18n.phonenumbers.PhoneNumberUtil.prototype.getNumberType =
    function(number) {

  /** @type {?string} */
  var regionCode = this.getRegionCodeForNumber(number);
  /** @type {i18n.phonenumbers.PhoneMetadata} */
  var metadata = this.getMetadataForRegionOrCallingCode_(
      number.getCountryCodeOrDefault(), regionCode);
  if (metadata == null) {
    return i18n.phonenumbers.PhoneNumberType.UNKNOWN;
  }
  /** @type {string} */
  var nationalSignificantNumber = this.getNationalSignificantNumber(number);
  return this.getNumberTypeHelper_(nationalSignificantNumber, metadata);
};


/**
 * @param {string} nationalNumber
 * @param {i18n.phonenumbers.PhoneMetadata} metadata
 * @return {i18n.phonenumbers.PhoneNumberType}
 * @private
 */
i18n.phonenumbers.PhoneNumberUtil.prototype.getNumberTypeHelper_ =
    function(nationalNumber, metadata) {

  if (!this.isNumberMatchingDesc_(nationalNumber, metadata.getGeneralDesc())) {
    return i18n.phonenumbers.PhoneNumberType.UNKNOWN;
  }

  if (this.isNumberMatchingDesc_(nationalNumber, metadata.getPremiumRate())) {
    return i18n.phonenumbers.PhoneNumberType.PREMIUM_RATE;
  }
  if (this.isNumberMatchingDesc_(nationalNumber, metadata.getTollFree())) {
    return i18n.phonenumbers.PhoneNumberType.TOLL_FREE;
  }
  if (this.isNumberMatchingDesc_(nationalNumber, metadata.getSharedCost())) {
    return i18n.phonenumbers.PhoneNumberType.SHARED_COST;
  }
  if (this.isNumberMatchingDesc_(nationalNumber, metadata.getVoip())) {
    return i18n.phonenumbers.PhoneNumberType.VOIP;
  }
  if (this.isNumberMatchingDesc_(nationalNumber,
                                 metadata.getPersonalNumber())) {
    return i18n.phonenumbers.PhoneNumberType.PERSONAL_NUMBER;
  }
  if (this.isNumberMatchingDesc_(nationalNumber, metadata.getPager())) {
    return i18n.phonenumbers.PhoneNumberType.PAGER;
  }
  if (this.isNumberMatchingDesc_(nationalNumber, metadata.getUan())) {
    return i18n.phonenumbers.PhoneNumberType.UAN;
  }
  if (this.isNumberMatchingDesc_(nationalNumber, metadata.getVoicemail())) {
    return i18n.phonenumbers.PhoneNumberType.VOICEMAIL;
  }

  /** @type {boolean} */
  var isFixedLine = this.isNumberMatchingDesc_(nationalNumber, metadata
      .getFixedLine());
  if (isFixedLine) {
    if (metadata.getSameMobileAndFixedLinePattern()) {
      return i18n.phonenumbers.PhoneNumberType.FIXED_LINE_OR_MOBILE;
    } else if (this.isNumberMatchingDesc_(nationalNumber,
                                          metadata.getMobile())) {
      return i18n.phonenumbers.PhoneNumberType.FIXED_LINE_OR_MOBILE;
    }
    return i18n.phonenumbers.PhoneNumberType.FIXED_LINE;
  }
  // Otherwise, test to see if the number is mobile. Only do this if certain
  // that the patterns for mobile and fixed line aren't the same.
  if (!metadata.getSameMobileAndFixedLinePattern() &&
      this.isNumberMatchingDesc_(nationalNumber, metadata.getMobile())) {
    return i18n.phonenumbers.PhoneNumberType.MOBILE;
  }
  return i18n.phonenumbers.PhoneNumberType.UNKNOWN;
};


/**
 * Returns the metadata for the given region code or {@code null} if the region
 * code is invalid or unknown.
 *
 * @param {?string} regionCode
 * @return {i18n.phonenumbers.PhoneMetadata}
 */
i18n.phonenumbers.PhoneNumberUtil.prototype.getMetadataForRegion =
    function(regionCode) {

  if (regionCode == null) {
    return null;
  }
  regionCode = regionCode.toUpperCase();
  /** @type {i18n.phonenumbers.PhoneMetadata} */
  var metadata = this.regionToMetadataMap[regionCode];
  if (metadata == null) {
    /** @type {goog.proto2.PbLiteSerializer} */
    var serializer = new goog.proto2.PbLiteSerializer();
    /** @type {Array} */
    var metadataSerialized =
        i18n.phonenumbers.metadata.countryToMetadata[regionCode];
    if (metadataSerialized == null) {
      return null;
    }
    metadata = /** @type {i18n.phonenumbers.PhoneMetadata} */ (
        serializer.deserialize(i18n.phonenumbers.PhoneMetadata.getDescriptor(),
            metadataSerialized));
    this.regionToMetadataMap[regionCode] = metadata;
  }
  return metadata;
};


/**
 * @param {number} countryCallingCode
 * @return {i18n.phonenumbers.PhoneMetadata}
 */
i18n.phonenumbers.PhoneNumberUtil.prototype.
    getMetadataForNonGeographicalRegion = function(countryCallingCode) {

  return this.getMetadataForRegion('' + countryCallingCode);
};


/**
 * @param {string} nationalNumber
 * @param {i18n.phonenumbers.PhoneNumberDesc} numberDesc
 * @return {boolean}
 * @private
 */
i18n.phonenumbers.PhoneNumberUtil.prototype.isNumberMatchingDesc_ =
    function(nationalNumber, numberDesc) {

  return i18n.phonenumbers.PhoneNumberUtil.matchesEntirely_(
      numberDesc.getPossibleNumberPatternOrDefault(), nationalNumber) &&
      i18n.phonenumbers.PhoneNumberUtil.matchesEntirely_(
          numberDesc.getNationalNumberPatternOrDefault(), nationalNumber);
};


/**
 * Tests whether a phone number matches a valid pattern. Note this doesn't
 * verify the number is actually in use, which is impossible to tell by just
 * looking at a number itself.
 *
 * @param {i18n.phonenumbers.PhoneNumber} number the phone number that we want
 *     to validate.
 * @return {boolean} a boolean that indicates whether the number is of a valid
 *     pattern.
 */
i18n.phonenumbers.PhoneNumberUtil.prototype.isValidNumber = function(number) {
  /** @type {?string} */
  var regionCode = this.getRegionCodeForNumber(number);
  return this.isValidNumberForRegion(number, regionCode);
};


/**
 * Tests whether a phone number is valid for a certain region. Note this doesn't
 * verify the number is actually in use, which is impossible to tell by just
 * looking at a number itself. If the country calling code is not the same as
 * the country calling code for the region, this immediately exits with false.
 * After this, the specific number pattern rules for the region are examined.
 * This is useful for determining for example whether a particular number is
 * valid for Canada, rather than just a valid NANPA number.
 * Warning: In most cases, you want to use {@link #isValidNumber} instead. For
 * example, this method will mark numbers from British Crown dependencies such
 * as the Isle of Man as invalid for the region "GB" (United Kingdom), since it
 * has its own region code, "IM", which may be undesirable.
 *
 * @param {i18n.phonenumbers.PhoneNumber} number the phone number that we want
 *     to validate.
 * @param {?string} regionCode the region that we want to validate the phone
 *     number for.
 * @return {boolean} a boolean that indicates whether the number is of a valid
 *     pattern.
 */
i18n.phonenumbers.PhoneNumberUtil.prototype.isValidNumberForRegion =
    function(number, regionCode) {

  /** @type {number} */
  var countryCode = number.getCountryCodeOrDefault();
  /** @type {i18n.phonenumbers.PhoneMetadata} */
  var metadata =
      this.getMetadataForRegionOrCallingCode_(countryCode, regionCode);
  if (metadata == null ||
      (i18n.phonenumbers.PhoneNumberUtil.REGION_CODE_FOR_NON_GEO_ENTITY !=
       regionCode &&
       countryCode != this.getCountryCodeForValidRegion_(regionCode))) {
    // Either the region code was invalid, or the country calling code for this
    // number does not match that of the region code.
    return false;
  }
  /** @type {string} */
  var nationalSignificantNumber = this.getNationalSignificantNumber(number);

  return this.getNumberTypeHelper_(nationalSignificantNumber, metadata) !=
      i18n.phonenumbers.PhoneNumberType.UNKNOWN;
};


/**
 * Returns the region where a phone number is from. This could be used for
 * geocoding at the region level.
 *
 * @param {i18n.phonenumbers.PhoneNumber} number the phone number whose origin
 *     we want to know.
 * @return {?string} the region where the phone number is from, or null
 *     if no region matches this calling code.
 */
i18n.phonenumbers.PhoneNumberUtil.prototype.getRegionCodeForNumber =
    function(number) {

  if (number == null) {
    return null;
  }
  /** @type {number} */
  var countryCode = number.getCountryCodeOrDefault();
  /** @type {Array.<string>} */
  var regions =
      i18n.phonenumbers.metadata.countryCodeToRegionCodeMap[countryCode];
  if (regions == null) {
    return null;
  }
  if (regions.length == 1) {
    return regions[0];
  } else {
    return this.getRegionCodeForNumberFromRegionList_(number, regions);
  }
};


/**
 * @param {i18n.phonenumbers.PhoneNumber} number
 * @param {Array.<string>} regionCodes
 * @return {?string}
 * @private
 */
i18n.phonenumbers.PhoneNumberUtil.prototype.
    getRegionCodeForNumberFromRegionList_ = function(number, regionCodes) {

  /** @type {string} */
  var nationalNumber = this.getNationalSignificantNumber(number);
  /** @type {string} */
  var regionCode;
  /** @type {number} */
  var regionCodesLength = regionCodes.length;
  for (var i = 0; i < regionCodesLength; i++) {
    regionCode = regionCodes[i];
    // If leadingDigits is present, use this. Otherwise, do full validation.
    // Metadata cannot be null because the region codes come from the country
    // calling code map.
    /** @type {i18n.phonenumbers.PhoneMetadata} */
    var metadata = this.getMetadataForRegion(regionCode);
    if (metadata.hasLeadingDigits()) {
      if (nationalNumber.search(metadata.getLeadingDigits()) == 0) {
        return regionCode;
      }
    } else if (this.getNumberTypeHelper_(nationalNumber, metadata) !=
        i18n.phonenumbers.PhoneNumberType.UNKNOWN) {
      return regionCode;
    }
  }
  return null;
};


/**
 * Returns the region code that matches the specific country calling code. In
 * the case of no region code being found, ZZ will be returned. In the case of
 * multiple regions, the one designated in the metadata as the 'main' region for
 * this calling code will be returned.
 *
 * @param {number} countryCallingCode the country calling code.
 * @return {string}
 */
i18n.phonenumbers.PhoneNumberUtil.prototype.getRegionCodeForCountryCode =
    function(countryCallingCode) {

  /** @type {Array.<string>} */
  var regionCodes =
      i18n.phonenumbers.metadata.countryCodeToRegionCodeMap[countryCallingCode];
  return regionCodes == null ?
      i18n.phonenumbers.PhoneNumberUtil.UNKNOWN_REGION_ : regionCodes[0];
};


/**
 * Returns a list with the region codes that match the specific country calling
 * code. For non-geographical country calling codes, the region code 001 is
 * returned. Also, in the case of no region code being found, an empty list is
 * returned.
 *
 * @param {number} countryCallingCode the country calling code.
 * @return {Array.<string>}
 */
i18n.phonenumbers.PhoneNumberUtil.prototype.getRegionCodesForCountryCode =
    function(countryCallingCode) {

  /** @type {Array.<string>} */
  var regionCodes =
      i18n.phonenumbers.metadata.countryCodeToRegionCodeMap[countryCallingCode];
  return regionCodes == null ? [] : regionCodes;
};


/**
 * Returns the country calling code for a specific region. For example, this
 * would be 1 for the United States, and 64 for New Zealand.
 *
 * @param {?string} regionCode the region that we want to get the country
 *     calling code for.
 * @return {number} the country calling code for the region denoted by
 *     regionCode.
 */
i18n.phonenumbers.PhoneNumberUtil.prototype.getCountryCodeForRegion =
    function(regionCode) {

  if (!this.isValidRegionCode_(regionCode)) {
    return 0;
  }
  return this.getCountryCodeForValidRegion_(regionCode);
};


/**
 * Returns the country calling code for a specific region. For example, this
 * would be 1 for the United States, and 64 for New Zealand. Assumes the region
 * is already valid.
 *
 * @param {?string} regionCode the region that we want to get the country
 *     calling code for.
 * @return {number} the country calling code for the region denoted by
 *     regionCode.
 * @throws {string} if the region is invalid
 * @private
 */
i18n.phonenumbers.PhoneNumberUtil.prototype.getCountryCodeForValidRegion_ =
    function(regionCode) {

  /** @type {i18n.phonenumbers.PhoneMetadata} */
  var metadata = this.getMetadataForRegion(regionCode);
  if (metadata == null) {
    throw 'Invalid region code: ' + regionCode;
  }
  return metadata.getCountryCodeOrDefault();
};


/**
 * Returns the national dialling prefix for a specific region. For example, this
 * would be 1 for the United States, and 0 for New Zealand. Set stripNonDigits
 * to true to strip symbols like '~' (which indicates a wait for a dialling
 * tone) from the prefix returned. If no national prefix is present, we return
 * null.
 *
 * <p>Warning: Do not use this method for do-your-own formatting - for some
 * regions, the national dialling prefix is used only for certain types of
 * numbers. Use the library's formatting functions to prefix the national prefix
 * when required.
 *
 * @param {?string} regionCode the region that we want to get the dialling
 *     prefix for.
 * @param {boolean} stripNonDigits true to strip non-digits from the national
 *     dialling prefix.
 * @return {?string} the dialling prefix for the region denoted by
 *     regionCode.
 */
i18n.phonenumbers.PhoneNumberUtil.prototype.getNddPrefixForRegion = function(
    regionCode, stripNonDigits) {
  /** @type {i18n.phonenumbers.PhoneMetadata} */
  var metadata = this.getMetadataForRegion(regionCode);
  if (metadata == null) {
    return null;
  }
  /** @type {string} */
  var nationalPrefix = metadata.getNationalPrefixOrDefault();
  // If no national prefix was found, we return null.
  if (nationalPrefix.length == 0) {
    return null;
  }
  if (stripNonDigits) {
    // Note: if any other non-numeric symbols are ever used in national
    // prefixes, these would have to be removed here as well.
    nationalPrefix = nationalPrefix.replace('~', '');
  }
  return nationalPrefix;
};


/**
 * Checks if this is a region under the North American Numbering Plan
 * Administration (NANPA).
 *
 * @param {?string} regionCode the ISO 3166-1 two-letter region code.
 * @return {boolean} true if regionCode is one of the regions under NANPA.
 */
i18n.phonenumbers.PhoneNumberUtil.prototype.isNANPACountry =
    function(regionCode) {

  return regionCode != null && goog.array.contains(
      i18n.phonenumbers.metadata.countryCodeToRegionCodeMap[
          i18n.phonenumbers.PhoneNumberUtil.NANPA_COUNTRY_CODE_],
      regionCode.toUpperCase());
};


/**
 * Checks whether countryCode represents the country calling code from a region
 * whose national significant number could contain a leading zero. An example of
 * such a region is Italy. Returns false if no metadata for the country is
 * found.
 *
 * @param {number} countryCallingCode the country calling code.
 * @return {boolean}
 */
i18n.phonenumbers.PhoneNumberUtil.prototype.isLeadingZeroPossible =
    function(countryCallingCode) {
  /** @type {i18n.phonenumbers.PhoneMetadata} */
  var mainMetadataForCallingCode = this.getMetadataForRegionOrCallingCode_(
      countryCallingCode,
      this.getRegionCodeForCountryCode(countryCallingCode));
  return mainMetadataForCallingCode != null &&
      mainMetadataForCallingCode.getLeadingZeroPossibleOrDefault();
};


/**
 * Checks if the number is a valid vanity (alpha) number such as 800 MICROSOFT.
 * A valid vanity number will start with at least 3 digits and will have three
 * or more alpha characters. This does not do region-specific checks - to work
 * out if this number is actually valid for a region, it should be parsed and
 * methods such as {@link #isPossibleNumberWithReason} and
 * {@link #isValidNumber} should be used.
 *
 * @param {string} number the number that needs to be checked.
 * @return {boolean} true if the number is a valid vanity number.
 */
i18n.phonenumbers.PhoneNumberUtil.prototype.isAlphaNumber = function(number) {
  if (!i18n.phonenumbers.PhoneNumberUtil.isViablePhoneNumber(number)) {
    // Number is too short, or doesn't match the basic phone number pattern.
    return false;
  }
  /** @type {!goog.string.StringBuffer} */
  var strippedNumber = new goog.string.StringBuffer(number);
  this.maybeStripExtension(strippedNumber);
  return i18n.phonenumbers.PhoneNumberUtil.matchesEntirely_(
      i18n.phonenumbers.PhoneNumberUtil.VALID_ALPHA_PHONE_PATTERN_,
      strippedNumber.toString());
};


/**
 * Convenience wrapper around {@link #isPossibleNumberWithReason}. Instead of
 * returning the reason for failure, this method returns a boolean value.
 *
 * @param {i18n.phonenumbers.PhoneNumber} number the number that needs to be
 *     checked.
 * @return {boolean} true if the number is possible.
 */
i18n.phonenumbers.PhoneNumberUtil.prototype.isPossibleNumber =
    function(number) {

  return this.isPossibleNumberWithReason(number) ==
      i18n.phonenumbers.PhoneNumberUtil.ValidationResult.IS_POSSIBLE;
};


/**
 * Helper method to check a number against a particular pattern and determine
 * whether it matches, or is too short or too long. Currently, if a number
 * pattern suggests that numbers of length 7 and 10 are possible, and a number
 * in between these possible lengths is entered, such as of length 8, this will
 * return TOO_LONG.
 *
 * @param {string} numberPattern
 * @param {string} number
 * @return {i18n.phonenumbers.PhoneNumberUtil.ValidationResult}
 * @private
 */
i18n.phonenumbers.PhoneNumberUtil.prototype.testNumberLengthAgainstPattern_ =
    function(numberPattern, number) {
  if (i18n.phonenumbers.PhoneNumberUtil.matchesEntirely_(numberPattern,
                                                         number)) {
    return i18n.phonenumbers.PhoneNumberUtil.ValidationResult.IS_POSSIBLE;
  }
  if (number.search(numberPattern) == 0) {
    return i18n.phonenumbers.PhoneNumberUtil.ValidationResult.TOO_LONG;
  } else {
    return i18n.phonenumbers.PhoneNumberUtil.ValidationResult.TOO_SHORT;
  }
};


/**
 * Helper method to check whether a number is too short to be a regular length
 * phone number in a region.
 *
 * @param {i18n.phonenumbers.PhoneMetadata} regionMetadata
 * @param {string} number
 * @return {boolean}
 * @private
 */
i18n.phonenumbers.PhoneNumberUtil.prototype.isShorterThanPossibleNormalNumber_ =
    function(regionMetadata, number) {
  /** @type {string} */
  var possibleNumberPattern =
      regionMetadata.getGeneralDesc().getPossibleNumberPatternOrDefault();
  return this.testNumberLengthAgainstPattern_(possibleNumberPattern, number) ==
      i18n.phonenumbers.PhoneNumberUtil.ValidationResult.TOO_SHORT;
};


/**
 * Check whether a phone number is a possible number. It provides a more lenient
 * check than {@link #isValidNumber} in the following sense:
 * <ol>
 * <li>It only checks the length of phone numbers. In particular, it doesn't
 * check starting digits of the number.
 * <li>It doesn't attempt to figure out the type of the number, but uses general
 * rules which applies to all types of phone numbers in a region. Therefore, it
 * is much faster than isValidNumber.
 * <li>For fixed line numbers, many regions have the concept of area code, which
 * together with subscriber number constitute the national significant number.
 * It is sometimes okay to dial the subscriber number only when dialing in the
 * same area. This function will return true if the subscriber-number-only
 * version is passed in. On the other hand, because isValidNumber validates
 * using information on both starting digits (for fixed line numbers, that would
 * most likely be area codes) and length (obviously includes the length of area
 * codes for fixed line numbers), it will return false for the
 * subscriber-number-only version.
 * </ol>
 *
 * @param {i18n.phonenumbers.PhoneNumber} number the number that needs to be
 *     checked.
 * @return {i18n.phonenumbers.PhoneNumberUtil.ValidationResult} a
 *     ValidationResult object which indicates whether the number is possible.
 */
i18n.phonenumbers.PhoneNumberUtil.prototype.isPossibleNumberWithReason =
    function(number) {

  /** @type {string} */
  var nationalNumber = this.getNationalSignificantNumber(number);
  /** @type {number} */
  var countryCode = number.getCountryCodeOrDefault();
  // Note: For Russian Fed and NANPA numbers, we just use the rules from the
  // default region (US or Russia) since the getRegionCodeForNumber will not
  // work if the number is possible but not valid. This would need to be
  // revisited if the possible number pattern ever differed between various
  // regions within those plans.
  if (!this.hasValidCountryCallingCode_(countryCode)) {
    return i18n.phonenumbers.PhoneNumberUtil.ValidationResult
        .INVALID_COUNTRY_CODE;
  }
  /** @type {string} */
  var regionCode = this.getRegionCodeForCountryCode(countryCode);
  // Metadata cannot be null because the country calling code is valid.
  /** @type {i18n.phonenumbers.PhoneMetadata} */
  var metadata =
      this.getMetadataForRegionOrCallingCode_(countryCode, regionCode);
  /** @type {string} */
  var possibleNumberPattern =
      metadata.getGeneralDesc().getPossibleNumberPatternOrDefault();
  return this.testNumberLengthAgainstPattern_(possibleNumberPattern,
                                              nationalNumber);
};


/**
 * Check whether a phone number is a possible number given a number in the form
 * of a string, and the region where the number could be dialed from. It
 * provides a more lenient check than {@link #isValidNumber}. See
 * {@link #isPossibleNumber} for details.
 *
 * <p>This method first parses the number, then invokes
 * {@link #isPossibleNumber} with the resultant PhoneNumber object.
 *
 * @param {string} number the number that needs to be checked, in the form of a
 *     string.
 * @param {string} regionDialingFrom the region that we are expecting the number
 *     to be dialed from.
 *     Note this is different from the region where the number belongs.
 *     For example, the number +1 650 253 0000 is a number that belongs to US.
 *     When written in this form, it can be dialed from any region. When it is
 *     written as 00 1 650 253 0000, it can be dialed from any region which uses
 *     an international dialling prefix of 00. When it is written as
 *     650 253 0000, it can only be dialed from within the US, and when written
 *     as 253 0000, it can only be dialed from within a smaller area in the US
 *     (Mountain View, CA, to be more specific).
 * @return {boolean} true if the number is possible.
 */
i18n.phonenumbers.PhoneNumberUtil.prototype.isPossibleNumberString =
    function(number, regionDialingFrom) {

  try {
    return this.isPossibleNumber(this.parse(number, regionDialingFrom));
  } catch (e) {
    return false;
  }
};


/**
 * Attempts to extract a valid number from a phone number that is too long to be
 * valid, and resets the PhoneNumber object passed in to that valid version. If
 * no valid number could be extracted, the PhoneNumber object passed in will not
 * be modified.
 * @param {i18n.phonenumbers.PhoneNumber} number a PhoneNumber object which
 *     contains a number that is too long to be valid.
 * @return {boolean} true if a valid phone number can be successfully extracted.
 */
i18n.phonenumbers.PhoneNumberUtil.prototype.truncateTooLongNumber =
    function(number) {

  if (this.isValidNumber(number)) {
    return true;
  }
  /** @type {i18n.phonenumbers.PhoneNumber} */
  var numberCopy = number.clone();
  /** @type {number} */
  var nationalNumber = number.getNationalNumberOrDefault();
  do {
    nationalNumber = Math.floor(nationalNumber / 10);
    numberCopy.setNationalNumber(nationalNumber);
    if (nationalNumber == 0 ||
        this.isPossibleNumberWithReason(numberCopy) ==
            i18n.phonenumbers.PhoneNumberUtil.ValidationResult.TOO_SHORT) {
      return false;
    }
  } while (!this.isValidNumber(numberCopy));
  number.setNationalNumber(nationalNumber);
  return true;
};


/**
 * Extracts country calling code from fullNumber, returns it and places the
 * remaining number in nationalNumber. It assumes that the leading plus sign or
 * IDD has already been removed. Returns 0 if fullNumber doesn't start with a
 * valid country calling code, and leaves nationalNumber unmodified.
 *
 * @param {!goog.string.StringBuffer} fullNumber
 * @param {!goog.string.StringBuffer} nationalNumber
 * @return {number}
 */
i18n.phonenumbers.PhoneNumberUtil.prototype.extractCountryCode =
    function(fullNumber, nationalNumber) {

  /** @type {string} */
  var fullNumberStr = fullNumber.toString();
  if ((fullNumberStr.length == 0) || (fullNumberStr.charAt(0) == '0')) {
    // Country codes do not begin with a '0'.
    return 0;
  }
  /** @type {number} */
  var potentialCountryCode;
  /** @type {number} */
  var numberLength = fullNumberStr.length;
  for (var i = 1;
      i <= i18n.phonenumbers.PhoneNumberUtil.MAX_LENGTH_COUNTRY_CODE_ &&
      i <= numberLength; ++i) {
    potentialCountryCode = parseInt(fullNumberStr.substring(0, i), 10);
    if (potentialCountryCode in
        i18n.phonenumbers.metadata.countryCodeToRegionCodeMap) {
      nationalNumber.append(fullNumberStr.substring(i));
      return potentialCountryCode;
    }
  }
  return 0;
};


/**
 * Tries to extract a country calling code from a number. This method will
 * return zero if no country calling code is considered to be present. Country
 * calling codes are extracted in the following ways:
 * <ul>
 * <li>by stripping the international dialing prefix of the region the person is
 * dialing from, if this is present in the number, and looking at the next
 * digits
 * <li>by stripping the '+' sign if present and then looking at the next digits
 * <li>by comparing the start of the number and the country calling code of the
 * default region. If the number is not considered possible for the numbering
 * plan of the default region initially, but starts with the country calling
 * code of this region, validation will be reattempted after stripping this
 * country calling code. If this number is considered a possible number, then
 * the first digits will be considered the country calling code and removed as
 * such.
 * </ul>
 *
 * It will throw a i18n.phonenumbers.Error if the number starts with a '+' but
 * the country calling code supplied after this does not match that of any known
 * region.
 *
 * @param {string} number non-normalized telephone number that we wish to
 *     extract a country calling code from - may begin with '+'.
 * @param {i18n.phonenumbers.PhoneMetadata} defaultRegionMetadata metadata
 *     about the region this number may be from.
 * @param {!goog.string.StringBuffer} nationalNumber a string buffer to store
 *     the national significant number in, in the case that a country calling
 *     code was extracted. The number is appended to any existing contents. If
 *     no country calling code was extracted, this will be left unchanged.
 * @param {boolean} keepRawInput true if the country_code_source and
 *     preferred_carrier_code fields of phoneNumber should be populated.
 * @param {i18n.phonenumbers.PhoneNumber} phoneNumber the PhoneNumber object
 *     where the country_code and country_code_source need to be populated.
 *     Note the country_code is always populated, whereas country_code_source is
 *     only populated when keepCountryCodeSource is true.
 * @return {number} the country calling code extracted or 0 if none could be
 *     extracted.
 * @throws {i18n.phonenumbers.Error}
 */
i18n.phonenumbers.PhoneNumberUtil.prototype.maybeExtractCountryCode =
    function(number, defaultRegionMetadata, nationalNumber,
             keepRawInput, phoneNumber) {

  if (number.length == 0) {
    return 0;
  }
  /** @type {!goog.string.StringBuffer} */
  var fullNumber = new goog.string.StringBuffer(number);
  // Set the default prefix to be something that will never match.
  /** @type {?string} */
  var possibleCountryIddPrefix;
  if (defaultRegionMetadata != null) {
    possibleCountryIddPrefix = defaultRegionMetadata.getInternationalPrefix();
  }
  if (possibleCountryIddPrefix == null) {
    possibleCountryIddPrefix = 'NonMatch';
  }

  /** @type {i18n.phonenumbers.PhoneNumber.CountryCodeSource} */
  var countryCodeSource = this.maybeStripInternationalPrefixAndNormalize(
      fullNumber, possibleCountryIddPrefix);
  if (keepRawInput) {
    phoneNumber.setCountryCodeSource(countryCodeSource);
  }
  if (countryCodeSource !=
      i18n.phonenumbers.PhoneNumber.CountryCodeSource.FROM_DEFAULT_COUNTRY) {
    if (fullNumber.getLength() <=
        i18n.phonenumbers.PhoneNumberUtil.MIN_LENGTH_FOR_NSN_) {
      throw i18n.phonenumbers.Error.TOO_SHORT_AFTER_IDD;
    }
    /** @type {number} */
    var potentialCountryCode = this.extractCountryCode(fullNumber,
                                                       nationalNumber);
    if (potentialCountryCode != 0) {
      phoneNumber.setCountryCode(potentialCountryCode);
      return potentialCountryCode;
    }

    // If this fails, they must be using a strange country calling code that we
    // don't recognize, or that doesn't exist.
    throw i18n.phonenumbers.Error.INVALID_COUNTRY_CODE;
  } else if (defaultRegionMetadata != null) {
    // Check to see if the number starts with the country calling code for the
    // default region. If so, we remove the country calling code, and do some
    // checks on the validity of the number before and after.
    /** @type {number} */
    var defaultCountryCode = defaultRegionMetadata.getCountryCodeOrDefault();
    /** @type {string} */
    var defaultCountryCodeString = '' + defaultCountryCode;
    /** @type {string} */
    var normalizedNumber = fullNumber.toString();
    if (goog.string.startsWith(normalizedNumber, defaultCountryCodeString)) {
      /** @type {!goog.string.StringBuffer} */
      var potentialNationalNumber = new goog.string.StringBuffer(
          normalizedNumber.substring(defaultCountryCodeString.length));
      /** @type {i18n.phonenumbers.PhoneNumberDesc} */
      var generalDesc = defaultRegionMetadata.getGeneralDesc();
      /** @type {!RegExp} */
      var validNumberPattern =
          new RegExp(generalDesc.getNationalNumberPatternOrDefault());
      // Passing null since we don't need the carrier code.
      this.maybeStripNationalPrefixAndCarrierCode(
          potentialNationalNumber, defaultRegionMetadata, null);
      /** @type {string} */
      var potentialNationalNumberStr = potentialNationalNumber.toString();
      /** @type {string} */
      var possibleNumberPattern =
          generalDesc.getPossibleNumberPatternOrDefault();
      // If the number was not valid before but is valid now, or if it was too
      // long before, we consider the number with the country calling code
      // stripped to be a better result and keep that instead.
      if ((!i18n.phonenumbers.PhoneNumberUtil.matchesEntirely_(
              validNumberPattern, fullNumber.toString()) &&
          i18n.phonenumbers.PhoneNumberUtil.matchesEntirely_(
              validNumberPattern, potentialNationalNumberStr)) ||
          this.testNumberLengthAgainstPattern_(possibleNumberPattern,
                                               fullNumber.toString()) ==
              i18n.phonenumbers.PhoneNumberUtil.ValidationResult.TOO_LONG) {
        nationalNumber.append(potentialNationalNumberStr);
        if (keepRawInput) {
          phoneNumber.setCountryCodeSource(
              i18n.phonenumbers.PhoneNumber.CountryCodeSource
                  .FROM_NUMBER_WITHOUT_PLUS_SIGN);
        }
        phoneNumber.setCountryCode(defaultCountryCode);
        return defaultCountryCode;
      }
    }
  }
  // No country calling code present.
  phoneNumber.setCountryCode(0);
  return 0;
};


/**
 * Strips the IDD from the start of the number if present. Helper function used
 * by maybeStripInternationalPrefixAndNormalize.
 *
 * @param {!RegExp} iddPattern the regular expression for the international
 *     prefix.
 * @param {!goog.string.StringBuffer} number the phone number that we wish to
 *     strip any international dialing prefix from.
 * @return {boolean} true if an international prefix was present.
 * @private
 */
i18n.phonenumbers.PhoneNumberUtil.prototype.parsePrefixAsIdd_ =
    function(iddPattern, number) {

  /** @type {string} */
  var numberStr = number.toString();
  if (numberStr.search(iddPattern) == 0) {
    /** @type {number} */
    var matchEnd = numberStr.match(iddPattern)[0].length;
    /** @type {Array.<string>} */
    var matchedGroups = numberStr.substring(matchEnd).match(
        i18n.phonenumbers.PhoneNumberUtil.CAPTURING_DIGIT_PATTERN);
    if (matchedGroups && matchedGroups[1] != null &&
        matchedGroups[1].length > 0) {
      /** @type {string} */
      var normalizedGroup =
          i18n.phonenumbers.PhoneNumberUtil.normalizeDigitsOnly(
              matchedGroups[1]);
      if (normalizedGroup == '0') {
        return false;
      }
    }
    number.clear();
    number.append(numberStr.substring(matchEnd));
    return true;
  }
  return false;
};


/**
 * Strips any international prefix (such as +, 00, 011) present in the number
 * provided, normalizes the resulting number, and indicates if an international
 * prefix was present.
 *
 * @param {!goog.string.StringBuffer} number the non-normalized telephone number
 *     that we wish to strip any international dialing prefix from.
 * @param {string} possibleIddPrefix the international direct dialing prefix
 *     from the region we think this number may be dialed in.
 * @return {i18n.phonenumbers.PhoneNumber.CountryCodeSource} the corresponding
 *     CountryCodeSource if an international dialing prefix could be removed
 *     from the number, otherwise CountryCodeSource.FROM_DEFAULT_COUNTRY if
 *     the number did not seem to be in international format.
 */
i18n.phonenumbers.PhoneNumberUtil.prototype.
    maybeStripInternationalPrefixAndNormalize = function(number,
                                                         possibleIddPrefix) {
  /** @type {string} */
  var numberStr = number.toString();
  if (numberStr.length == 0) {
    return i18n.phonenumbers.PhoneNumber.CountryCodeSource.FROM_DEFAULT_COUNTRY;
  }
  // Check to see if the number begins with one or more plus signs.
  if (i18n.phonenumbers.PhoneNumberUtil.LEADING_PLUS_CHARS_PATTERN_
      .test(numberStr)) {
    numberStr = numberStr.replace(
        i18n.phonenumbers.PhoneNumberUtil.LEADING_PLUS_CHARS_PATTERN_, '');
    // Can now normalize the rest of the number since we've consumed the '+'
    // sign at the start.
    number.clear();
    number.append(i18n.phonenumbers.PhoneNumberUtil.normalize(numberStr));
    return i18n.phonenumbers.PhoneNumber.CountryCodeSource
        .FROM_NUMBER_WITH_PLUS_SIGN;
  }
  // Attempt to parse the first digits as an international prefix.
  /** @type {!RegExp} */
  var iddPattern = new RegExp(possibleIddPrefix);
  i18n.phonenumbers.PhoneNumberUtil.normalizeSB_(number);
  return this.parsePrefixAsIdd_(iddPattern, number) ?
      i18n.phonenumbers.PhoneNumber.CountryCodeSource.FROM_NUMBER_WITH_IDD :
      i18n.phonenumbers.PhoneNumber.CountryCodeSource.FROM_DEFAULT_COUNTRY;
};


/**
 * Strips any national prefix (such as 0, 1) present in the number provided.
 *
 * @param {!goog.string.StringBuffer} number the normalized telephone number
 *     that we wish to strip any national dialing prefix from.
 * @param {i18n.phonenumbers.PhoneMetadata} metadata the metadata for the
 *     region that we think this number is from.
 * @param {goog.string.StringBuffer} carrierCode a place to insert the carrier
 *     code if one is extracted.
 * @return {boolean} true if a national prefix or carrier code (or both) could
 *     be extracted.
 */
i18n.phonenumbers.PhoneNumberUtil.prototype.
    maybeStripNationalPrefixAndCarrierCode = function(number, metadata,
                                                      carrierCode) {
  /** @type {string} */
  var numberStr = number.toString();
  /** @type {number} */
  var numberLength = numberStr.length;
  /** @type {?string} */
  var possibleNationalPrefix = metadata.getNationalPrefixForParsing();
  if (numberLength == 0 || possibleNationalPrefix == null ||
      possibleNationalPrefix.length == 0) {
    // Early return for numbers of zero length.
    return false;
  }
  // Attempt to parse the first digits as a national prefix.
  /** @type {!RegExp} */
  var prefixPattern = new RegExp('^(?:' + possibleNationalPrefix + ')');
  /** @type {Array.<string>} */
  var prefixMatcher = prefixPattern.exec(numberStr);
  if (prefixMatcher) {
    /** @type {!RegExp} */
    var nationalNumberRule = new RegExp(
        metadata.getGeneralDesc().getNationalNumberPatternOrDefault());
    // Check if the original number is viable.
    /** @type {boolean} */
    var isViableOriginalNumber =
        i18n.phonenumbers.PhoneNumberUtil.matchesEntirely_(
            nationalNumberRule, numberStr);
    // prefixMatcher[numOfGroups] == null implies nothing was captured by the
    // capturing groups in possibleNationalPrefix; therefore, no transformation
    // is necessary, and we just remove the national prefix.
    /** @type {number} */
    var numOfGroups = prefixMatcher.length - 1;
    /** @type {?string} */
    var transformRule = metadata.getNationalPrefixTransformRule();
    /** @type {boolean} */
    var noTransform = transformRule == null || transformRule.length == 0 ||
                      prefixMatcher[numOfGroups] == null ||
                      prefixMatcher[numOfGroups].length == 0;
    if (noTransform) {
      // If the original number was viable, and the resultant number is not,
      // we return.
      if (isViableOriginalNumber &&
          !i18n.phonenumbers.PhoneNumberUtil.matchesEntirely_(
              nationalNumberRule,
              numberStr.substring(prefixMatcher[0].length))) {
        return false;
      }
      if (carrierCode != null &&
          numOfGroups > 0 && prefixMatcher[numOfGroups] != null) {
        carrierCode.append(prefixMatcher[1]);
      }
      number.set(numberStr.substring(prefixMatcher[0].length));
      return true;
    } else {
      // Check that the resultant number is still viable. If not, return. Check
      // this by copying the string buffer and making the transformation on the
      // copy first.
      /** @type {string} */
      var transformedNumber;
      transformedNumber = numberStr.replace(prefixPattern, transformRule);
      if (isViableOriginalNumber &&
          !i18n.phonenumbers.PhoneNumberUtil.matchesEntirely_(
              nationalNumberRule, transformedNumber)) {
        return false;
      }
      if (carrierCode != null && numOfGroups > 0) {
        carrierCode.append(prefixMatcher[1]);
      }
      number.set(transformedNumber);
      return true;
    }
  }
  return false;
};


/**
 * Strips any extension (as in, the part of the number dialled after the call is
 * connected, usually indicated with extn, ext, x or similar) from the end of
 * the number, and returns it.
 *
 * @param {!goog.string.StringBuffer} number the non-normalized telephone number
 *     that we wish to strip the extension from.
 * @return {string} the phone extension.
 */
i18n.phonenumbers.PhoneNumberUtil.prototype.maybeStripExtension =
    function(number) {

  /** @type {string} */
  var numberStr = number.toString();
  /** @type {number} */
  var mStart =
      numberStr.search(i18n.phonenumbers.PhoneNumberUtil.EXTN_PATTERN_);
  // If we find a potential extension, and the number preceding this is a viable
  // number, we assume it is an extension.
  if (mStart >= 0 && i18n.phonenumbers.PhoneNumberUtil.isViablePhoneNumber(
      numberStr.substring(0, mStart))) {
    // The numbers are captured into groups in the regular expression.
    /** @type {Array.<string>} */
    var matchedGroups =
        numberStr.match(i18n.phonenumbers.PhoneNumberUtil.EXTN_PATTERN_);
    /** @type {number} */
    var matchedGroupsLength = matchedGroups.length;
    for (var i = 1; i < matchedGroupsLength; ++i) {
      if (matchedGroups[i] != null && matchedGroups[i].length > 0) {
        // We go through the capturing groups until we find one that captured
        // some digits. If none did, then we will return the empty string.
        number.clear();
        number.append(numberStr.substring(0, mStart));
        return matchedGroups[i];
      }
    }
  }
  return '';
};


/**
 * Checks to see that the region code used is valid, or if it is not valid, that
 * the number to parse starts with a + symbol so that we can attempt to infer
 * the region from the number.
 * @param {string} numberToParse number that we are attempting to parse.
 * @param {?string} defaultRegion region that we are expecting the number to be
 *     from.
 * @return {boolean} false if it cannot use the region provided and the region
 *     cannot be inferred.
 * @private
 */
i18n.phonenumbers.PhoneNumberUtil.prototype.checkRegionForParsing_ = function(
    numberToParse, defaultRegion) {
  // If the number is null or empty, we can't infer the region.
  return this.isValidRegionCode_(defaultRegion) ||
      (numberToParse != null && numberToParse.length > 0 &&
          i18n.phonenumbers.PhoneNumberUtil.LEADING_PLUS_CHARS_PATTERN_.test(
              numberToParse));
};


/**
 * Parses a string and returns it in proto buffer format. This method will throw
 * a {@link i18n.phonenumbers.Error} if the number is not considered to be a
 * possible number. Note that validation of whether the number is actually a
 * valid number for a particular region is not performed. This can be done
 * separately with {@link #isValidNumber}.
 *
 * @param {?string} numberToParse number that we are attempting to parse. This
 *     can contain formatting such as +, ( and -, as well as a phone number
 *     extension. It can also be provided in RFC3966 format.
 * @param {?string} defaultRegion region that we are expecting the number to be
 *     from. This is only used if the number being parsed is not written in
 *     international format. The country_code for the number in this case would
 *     be stored as that of the default region supplied. If the number is
 *     guaranteed to start with a '+' followed by the country calling code, then
 *     'ZZ' or null can be supplied.
 * @return {i18n.phonenumbers.PhoneNumber} a phone number proto buffer filled
 *     with the parsed number.
 * @throws {i18n.phonenumbers.Error} if the string is not considered to be a
 *     viable phone number or if no default region was supplied and the number
 *     is not in international format (does not start with +).
 */
i18n.phonenumbers.PhoneNumberUtil.prototype.parse = function(numberToParse,
                                                             defaultRegion) {
  return this.parseHelper_(numberToParse, defaultRegion, false, true);
};


/**
 * Parses a string and returns it in proto buffer format. This method differs
 * from {@link #parse} in that it always populates the raw_input field of the
 * protocol buffer with numberToParse as well as the country_code_source field.
 *
 * @param {string} numberToParse number that we are attempting to parse. This
 *     can contain formatting such as +, ( and -, as well as a phone number
 *     extension.
 * @param {?string} defaultRegion region that we are expecting the number to be
 *     from. This is only used if the number being parsed is not written in
 *     international format. The country calling code for the number in this
 *     case would be stored as that of the default region supplied.
 * @return {i18n.phonenumbers.PhoneNumber} a phone number proto buffer filled
 *     with the parsed number.
 * @throws {i18n.phonenumbers.Error} if the string is not considered to be a
 *     viable phone number or if no default region was supplied.
 */
i18n.phonenumbers.PhoneNumberUtil.prototype.parseAndKeepRawInput =
    function(numberToParse, defaultRegion) {

  if (!this.isValidRegionCode_(defaultRegion)) {
    if (numberToParse.length > 0 && numberToParse.charAt(0) !=
        i18n.phonenumbers.PhoneNumberUtil.PLUS_SIGN) {
      throw i18n.phonenumbers.Error.INVALID_COUNTRY_CODE;
    }
  }
  return this.parseHelper_(numberToParse, defaultRegion, true, true);
};


/**
 * A helper function to set the values related to leading zeros in a
 * PhoneNumber.
 *
 * @param {string} nationalNumber the number we are parsing.
 * @param {i18n.phonenumbers.PhoneNumber} phoneNumber a phone number proto
 *     buffer to fill in.
 * @private
 */
i18n.phonenumbers.PhoneNumberUtil.prototype.setItalianLeadingZerosForPhoneNumber_ =
    function(nationalNumber, phoneNumber) {
  if (nationalNumber.length > 1 && nationalNumber.charAt(0) == '0') {
    phoneNumber.setItalianLeadingZero(true);
    var numberOfLeadingZeros = 1;
    // Note that if the national number is all "0"s, the last "0" is not counted
    // as a leading zero.
    while (numberOfLeadingZeros < nationalNumber.length - 1 &&
           nationalNumber.charAt(numberOfLeadingZeros) == '0') {
      numberOfLeadingZeros++;
    }
    if (numberOfLeadingZeros != 1) {
      phoneNumber.setNumberOfLeadingZeros(numberOfLeadingZeros);
    }
  }
};


/**
 * Parses a string and returns it in proto buffer format. This method is the
 * same as the public {@link #parse} method, with the exception that it allows
 * the default region to be null, for use by {@link #isNumberMatch}.
 *
 * @param {?string} numberToParse number that we are attempting to parse. This
 *     can contain formatting such as +, ( and -, as well as a phone number
 *     extension.
 * @param {?string} defaultRegion region that we are expecting the number to be
 *     from. This is only used if the number being parsed is not written in
 *     international format. The country calling code for the number in this
 *     case would be stored as that of the default region supplied.
 * @param {boolean} keepRawInput whether to populate the raw_input field of the
 *     phoneNumber with numberToParse.
 * @param {boolean} checkRegion should be set to false if it is permitted for
 *     the default coregion to be null or unknown ('ZZ').
 * @return {i18n.phonenumbers.PhoneNumber} a phone number proto buffer filled
 *     with the parsed number.
 * @throws {i18n.phonenumbers.Error}
 * @private
 */
i18n.phonenumbers.PhoneNumberUtil.prototype.parseHelper_ =
    function(numberToParse, defaultRegion, keepRawInput, checkRegion) {

  if (numberToParse == null) {
    throw i18n.phonenumbers.Error.NOT_A_NUMBER;
  } else if (numberToParse.length >
      i18n.phonenumbers.PhoneNumberUtil.MAX_INPUT_STRING_LENGTH_) {
    throw i18n.phonenumbers.Error.TOO_LONG;
  }

  /** @type {!goog.string.StringBuffer} */
  var nationalNumber = new goog.string.StringBuffer();
  this.buildNationalNumberForParsing_(numberToParse, nationalNumber);

  if (!i18n.phonenumbers.PhoneNumberUtil.isViablePhoneNumber(
      nationalNumber.toString())) {
    throw i18n.phonenumbers.Error.NOT_A_NUMBER;
  }

  // Check the region supplied is valid, or that the extracted number starts
  // with some sort of + sign so the number's region can be determined.
  if (checkRegion &&
      !this.checkRegionForParsing_(nationalNumber.toString(), defaultRegion)) {
    throw i18n.phonenumbers.Error.INVALID_COUNTRY_CODE;
  }

  /** @type {i18n.phonenumbers.PhoneNumber} */
  var phoneNumber = new i18n.phonenumbers.PhoneNumber();
  if (keepRawInput) {
    phoneNumber.setRawInput(numberToParse);
  }
  // Attempt to parse extension first, since it doesn't require region-specific
  // data and we want to have the non-normalised number here.
  /** @type {string} */
  var extension = this.maybeStripExtension(nationalNumber);
  if (extension.length > 0) {
    phoneNumber.setExtension(extension);
  }

  /** @type {i18n.phonenumbers.PhoneMetadata} */
  var regionMetadata = this.getMetadataForRegion(defaultRegion);
  // Check to see if the number is given in international format so we know
  // whether this number is from the default region or not.
  /** @type {!goog.string.StringBuffer} */
  var normalizedNationalNumber = new goog.string.StringBuffer();
  /** @type {number} */
  var countryCode = 0;
  /** @type {string} */
  var nationalNumberStr = nationalNumber.toString();
  try {
    countryCode = this.maybeExtractCountryCode(nationalNumberStr,
        regionMetadata, normalizedNationalNumber, keepRawInput, phoneNumber);
  } catch (e) {
    if (e == i18n.phonenumbers.Error.INVALID_COUNTRY_CODE &&
        i18n.phonenumbers.PhoneNumberUtil.LEADING_PLUS_CHARS_PATTERN_
            .test(nationalNumberStr)) {
      // Strip the plus-char, and try again.
      nationalNumberStr = nationalNumberStr.replace(
          i18n.phonenumbers.PhoneNumberUtil.LEADING_PLUS_CHARS_PATTERN_, '');
      countryCode = this.maybeExtractCountryCode(nationalNumberStr,
          regionMetadata, normalizedNationalNumber, keepRawInput, phoneNumber);
      if (countryCode == 0) {
        throw e;
      }
    } else {
      throw e;
    }
  }
  if (countryCode != 0) {
    /** @type {string} */
    var phoneNumberRegion = this.getRegionCodeForCountryCode(countryCode);
    if (phoneNumberRegion != defaultRegion) {
      // Metadata cannot be null because the country calling code is valid.
      regionMetadata = this.getMetadataForRegionOrCallingCode_(
          countryCode, phoneNumberRegion);
    }
  } else {
    // If no extracted country calling code, use the region supplied instead.
    // The national number is just the normalized version of the number we were
    // given to parse.
    i18n.phonenumbers.PhoneNumberUtil.normalizeSB_(nationalNumber);
    normalizedNationalNumber.append(nationalNumber.toString());
    if (defaultRegion != null) {
      countryCode = regionMetadata.getCountryCodeOrDefault();
      phoneNumber.setCountryCode(countryCode);
    } else if (keepRawInput) {
      phoneNumber.clearCountryCodeSource();
    }
  }
  if (normalizedNationalNumber.getLength() <
      i18n.phonenumbers.PhoneNumberUtil.MIN_LENGTH_FOR_NSN_) {
    throw i18n.phonenumbers.Error.TOO_SHORT_NSN;
  }

  if (regionMetadata != null) {
    /** @type {!goog.string.StringBuffer} */
    var carrierCode = new goog.string.StringBuffer();
    /** @type {!goog.string.StringBuffer} */
    var potentialNationalNumber =
        new goog.string.StringBuffer(normalizedNationalNumber.toString());
    this.maybeStripNationalPrefixAndCarrierCode(
        potentialNationalNumber, regionMetadata, carrierCode);
    if (!this.isShorterThanPossibleNormalNumber_(
            regionMetadata, potentialNationalNumber.toString())) {
      normalizedNationalNumber = potentialNationalNumber;
      if (keepRawInput) {
        phoneNumber.setPreferredDomesticCarrierCode(carrierCode.toString());
      }
    }
  }
  /** @type {string} */
  var normalizedNationalNumberStr = normalizedNationalNumber.toString();
  /** @type {number} */
  var lengthOfNationalNumber = normalizedNationalNumberStr.length;
  if (lengthOfNationalNumber <
      i18n.phonenumbers.PhoneNumberUtil.MIN_LENGTH_FOR_NSN_) {
    throw i18n.phonenumbers.Error.TOO_SHORT_NSN;
  }
  if (lengthOfNationalNumber >
      i18n.phonenumbers.PhoneNumberUtil.MAX_LENGTH_FOR_NSN_) {
    throw i18n.phonenumbers.Error.TOO_LONG;
  }
  this.setItalianLeadingZerosForPhoneNumber_(
      normalizedNationalNumberStr, phoneNumber);
  phoneNumber.setNationalNumber(parseInt(normalizedNationalNumberStr, 10));
  return phoneNumber;
};


/**
 * Converts numberToParse to a form that we can parse and write it to
 * nationalNumber if it is written in RFC3966; otherwise extract a possible
 * number out of it and write to nationalNumber.
 *
 * @param {?string} numberToParse number that we are attempting to parse. This
 *     can contain formatting such as +, ( and -, as well as a phone number
 *     extension.
 * @param {!goog.string.StringBuffer} nationalNumber a string buffer for storing
 *     the national significant number.
 * @private
 */
i18n.phonenumbers.PhoneNumberUtil.prototype.buildNationalNumberForParsing_ =
    function(numberToParse, nationalNumber) {

  /** @type {number} */
  var indexOfPhoneContext = numberToParse.indexOf(
      i18n.phonenumbers.PhoneNumberUtil.RFC3966_PHONE_CONTEXT_);
  if (indexOfPhoneContext > 0) {
    var phoneContextStart = indexOfPhoneContext +
        i18n.phonenumbers.PhoneNumberUtil.RFC3966_PHONE_CONTEXT_.length;
    // If the phone context contains a phone number prefix, we need to capture
    // it, whereas domains will be ignored.
    if (numberToParse.charAt(phoneContextStart) ==
        i18n.phonenumbers.PhoneNumberUtil.PLUS_SIGN) {
      // Additional parameters might follow the phone context. If so, we will
      // remove them here because the parameters after phone context are not
      // important for parsing the phone number.
      var phoneContextEnd = numberToParse.indexOf(';', phoneContextStart);
      if (phoneContextEnd > 0) {
        nationalNumber.append(numberToParse.substring(phoneContextStart,
            phoneContextEnd));
      } else {
        nationalNumber.append(numberToParse.substring(phoneContextStart));
      }
    }

    // Now append everything between the "tel:" prefix and the phone-context.
    // This should include the national number, an optional extension or
    // isdn-subaddress component. Note we also handle the case when "tel:" is
    // missing, as we have seen in some of the phone number inputs.
    // In that case, we append everything from the beginning.
    var indexOfRfc3966Prefix = numberToParse.indexOf(
        i18n.phonenumbers.PhoneNumberUtil.RFC3966_PREFIX_);
    var indexOfNationalNumber = (indexOfRfc3966Prefix >= 0) ?
        indexOfRfc3966Prefix +
        i18n.phonenumbers.PhoneNumberUtil.RFC3966_PREFIX_.length : 0;
    nationalNumber.append(numberToParse.substring(indexOfNationalNumber,
        indexOfPhoneContext));
  } else {
    // Extract a possible number from the string passed in (this strips leading
    // characters that could not be the start of a phone number.)
    nationalNumber.append(
        i18n.phonenumbers.PhoneNumberUtil.extractPossibleNumber(numberToParse));
  }

  // Delete the isdn-subaddress and everything after it if it is present.
  // Note extension won't appear at the same time with isdn-subaddress
  // according to paragraph 5.3 of the RFC3966 spec,
  /** @type {string} */
  var nationalNumberStr = nationalNumber.toString();
  var indexOfIsdn = nationalNumberStr.indexOf(
      i18n.phonenumbers.PhoneNumberUtil.RFC3966_ISDN_SUBADDRESS_);
  if (indexOfIsdn > 0) {
    nationalNumber.clear();
    nationalNumber.append(nationalNumberStr.substring(0, indexOfIsdn));
  }
  // If both phone context and isdn-subaddress are absent but other
  // parameters are present, the parameters are left in nationalNumber. This
  // is because we are concerned about deleting content from a potential
  // number string when there is no strong evidence that the number is
  // actually written in RFC3966.
};


/**
 * Takes two phone numbers and compares them for equality.
 *
 * <p>Returns EXACT_MATCH if the country_code, NSN, presence of a leading zero
 * for Italian numbers and any extension present are the same. Returns NSN_MATCH
 * if either or both has no region specified, and the NSNs and extensions are
 * the same. Returns SHORT_NSN_MATCH if either or both has no region specified,
 * or the region specified is the same, and one NSN could be a shorter version
 * of the other number. This includes the case where one has an extension
 * specified, and the other does not. Returns NO_MATCH otherwise. For example,
 * the numbers +1 345 657 1234 and 657 1234 are a SHORT_NSN_MATCH. The numbers
 * +1 345 657 1234 and 345 657 are a NO_MATCH.
 *
 * @param {i18n.phonenumbers.PhoneNumber|string} firstNumberIn first number to
 *     compare. If it is a string it can contain formatting, and can have
 *     country calling code specified with + at the start.
 * @param {i18n.phonenumbers.PhoneNumber|string} secondNumberIn second number to
 *     compare. If it is a string it can contain formatting, and can have
 *     country calling code specified with + at the start.
 * @return {i18n.phonenumbers.PhoneNumberUtil.MatchType} NOT_A_NUMBER, NO_MATCH,
 *     SHORT_NSN_MATCH, NSN_MATCH or EXACT_MATCH depending on the level of
 *     equality of the two numbers, described in the method definition.
 */
i18n.phonenumbers.PhoneNumberUtil.prototype.isNumberMatch =
    function(firstNumberIn, secondNumberIn) {

  // If the input arguements are strings parse them to a proto buffer format.
  // Else make copies of the phone numbers so that the numbers passed in are not
  // edited.
  /** @type {i18n.phonenumbers.PhoneNumber} */
  var firstNumber;
  /** @type {i18n.phonenumbers.PhoneNumber} */
  var secondNumber;
  if (typeof firstNumberIn == 'string') {
    // First see if the first number has an implicit country calling code, by
    // attempting to parse it.
    try {
      firstNumber = this.parse(
          firstNumberIn, i18n.phonenumbers.PhoneNumberUtil.UNKNOWN_REGION_);
    } catch (e) {
      if (e != i18n.phonenumbers.Error.INVALID_COUNTRY_CODE) {
        return i18n.phonenumbers.PhoneNumberUtil.MatchType.NOT_A_NUMBER;
      }
      // The first number has no country calling code. EXACT_MATCH is no longer
      // possible. We parse it as if the region was the same as that for the
      // second number, and if EXACT_MATCH is returned, we replace this with
      // NSN_MATCH.
      if (typeof secondNumberIn != 'string') {
        /** @type {string} */
        var secondNumberRegion = this.getRegionCodeForCountryCode(
            secondNumberIn.getCountryCodeOrDefault());
        if (secondNumberRegion !=
            i18n.phonenumbers.PhoneNumberUtil.UNKNOWN_REGION_) {
          try {
            firstNumber = this.parse(firstNumberIn, secondNumberRegion);
          } catch (e2) {
            return i18n.phonenumbers.PhoneNumberUtil.MatchType.NOT_A_NUMBER;
          }
          /** @type {i18n.phonenumbers.PhoneNumberUtil.MatchType} */
          var match = this.isNumberMatch(firstNumber, secondNumberIn);
          if (match ==
              i18n.phonenumbers.PhoneNumberUtil.MatchType.EXACT_MATCH) {
            return i18n.phonenumbers.PhoneNumberUtil.MatchType.NSN_MATCH;
          }
          return match;
        }
      }
      // If the second number is a string or doesn't have a valid country
      // calling code, we parse the first number without country calling code.
      try {
        firstNumber = this.parseHelper_(firstNumberIn, null, false, false);
      } catch (e2) {
        return i18n.phonenumbers.PhoneNumberUtil.MatchType.NOT_A_NUMBER;
      }
    }
  } else {
    firstNumber = firstNumberIn.clone();
  }
  if (typeof secondNumberIn == 'string') {
    try {
      secondNumber = this.parse(
          secondNumberIn, i18n.phonenumbers.PhoneNumberUtil.UNKNOWN_REGION_);
      return this.isNumberMatch(firstNumberIn, secondNumber);
    } catch (e) {
      if (e != i18n.phonenumbers.Error.INVALID_COUNTRY_CODE) {
        return i18n.phonenumbers.PhoneNumberUtil.MatchType.NOT_A_NUMBER;
      }
      return this.isNumberMatch(secondNumberIn, firstNumber);
    }
  } else {
    secondNumber = secondNumberIn.clone();
  }
  // First clear raw_input, country_code_source and
  // preferred_domestic_carrier_code fields and any empty-string extensions so
  // that we can use the proto-buffer equality method.
  firstNumber.clearRawInput();
  firstNumber.clearCountryCodeSource();
  firstNumber.clearPreferredDomesticCarrierCode();
  secondNumber.clearRawInput();
  secondNumber.clearCountryCodeSource();
  secondNumber.clearPreferredDomesticCarrierCode();
  if (firstNumber.hasExtension() && firstNumber.getExtension().length == 0) {
    firstNumber.clearExtension();
  }
  if (secondNumber.hasExtension() && secondNumber.getExtension().length == 0) {
    secondNumber.clearExtension();
  }

  // Early exit if both had extensions and these are different.
  if (firstNumber.hasExtension() && secondNumber.hasExtension() &&
      firstNumber.getExtension() != secondNumber.getExtension()) {
    return i18n.phonenumbers.PhoneNumberUtil.MatchType.NO_MATCH;
  }
  /** @type {number} */
  var firstNumberCountryCode = firstNumber.getCountryCodeOrDefault();
  /** @type {number} */
  var secondNumberCountryCode = secondNumber.getCountryCodeOrDefault();
  // Both had country_code specified.
  if (firstNumberCountryCode != 0 && secondNumberCountryCode != 0) {
    if (firstNumber.equals(secondNumber)) {
      return i18n.phonenumbers.PhoneNumberUtil.MatchType.EXACT_MATCH;
    } else if (firstNumberCountryCode == secondNumberCountryCode &&
        this.isNationalNumberSuffixOfTheOther_(firstNumber, secondNumber)) {
      // A SHORT_NSN_MATCH occurs if there is a difference because of the
      // presence or absence of an 'Italian leading zero', the presence or
      // absence of an extension, or one NSN being a shorter variant of the
      // other.
      return i18n.phonenumbers.PhoneNumberUtil.MatchType.SHORT_NSN_MATCH;
    }
    // This is not a match.
    return i18n.phonenumbers.PhoneNumberUtil.MatchType.NO_MATCH;
  }
  // Checks cases where one or both country_code fields were not specified. To
  // make equality checks easier, we first set the country_code fields to be
  // equal.
  firstNumber.setCountryCode(0);
  secondNumber.setCountryCode(0);
  // If all else was the same, then this is an NSN_MATCH.
  if (firstNumber.equals(secondNumber)) {
    return i18n.phonenumbers.PhoneNumberUtil.MatchType.NSN_MATCH;
  }
  if (this.isNationalNumberSuffixOfTheOther_(firstNumber, secondNumber)) {
    return i18n.phonenumbers.PhoneNumberUtil.MatchType.SHORT_NSN_MATCH;
  }
  return i18n.phonenumbers.PhoneNumberUtil.MatchType.NO_MATCH;
};


/**
 * Returns true when one national number is the suffix of the other or both are
 * the same.
 *
 * @param {i18n.phonenumbers.PhoneNumber} firstNumber the first PhoneNumber
 *     object.
 * @param {i18n.phonenumbers.PhoneNumber} secondNumber the second PhoneNumber
 *     object.
 * @return {boolean} true if one PhoneNumber is the suffix of the other one.
 * @private
 */
i18n.phonenumbers.PhoneNumberUtil.prototype.isNationalNumberSuffixOfTheOther_ =
    function(firstNumber, secondNumber) {

  /** @type {string} */
  var firstNumberNationalNumber = '' + firstNumber.getNationalNumber();
  /** @type {string} */
  var secondNumberNationalNumber = '' + secondNumber.getNationalNumber();
  // Note that endsWith returns true if the numbers are equal.
  return goog.string.endsWith(firstNumberNationalNumber,
                              secondNumberNationalNumber) ||
         goog.string.endsWith(secondNumberNationalNumber,
                              firstNumberNationalNumber);
};


/**
 * Returns true if the number can be dialled from outside the region, or
 * unknown. If the number can only be dialled from within the region, returns
 * false. Does not check the number is a valid number.
 * TODO: Make this method public when we have enough metadata to make it
 * worthwhile. Currently visible for testing purposes only.
 *
 * @param {i18n.phonenumbers.PhoneNumber} number the phone-number for which we
 *     want to know whether it is diallable from outside the region.
 * @return {boolean} true if the number can only be dialled from within the
 *     country.
 */
i18n.phonenumbers.PhoneNumberUtil.prototype.canBeInternationallyDialled =
    function(number) {
  /** @type {i18n.phonenumbers.PhoneMetadata} */
  var metadata = this.getMetadataForRegion(this.getRegionCodeForNumber(number));
  if (metadata == null) {
    // Note numbers belonging to non-geographical entities (e.g. +800 numbers)
    // are always internationally diallable, and will be caught here.
    return true;
  }
  /** @type {string} */
  var nationalSignificantNumber = this.getNationalSignificantNumber(number);
  return !this.isNumberMatchingDesc_(nationalSignificantNumber,
                                     metadata.getNoInternationalDialling());
};


/**
 * Check whether the entire input sequence can be matched against the regular
 * expression.
 *
 * @param {!RegExp|string} regex the regular expression to match against.
 * @param {string} str the string to test.
 * @return {boolean} true if str can be matched entirely against regex.
 * @private
 */
i18n.phonenumbers.PhoneNumberUtil.matchesEntirely_ = function(regex, str) {
  /** @type {Array.<string>} */
  var matchedGroups = (typeof regex == 'string') ?
      str.match('^(?:' + regex + ')$') : str.match(regex);
  if (matchedGroups && matchedGroups[0].length == str.length) {
    return true;
  }
  return false;
};
/**
 * @license
 * Copyright (C) 2010 The Libphonenumber Authors.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 * http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

/**
 * @fileoverview  A formatter which formats phone numbers as they are entered.
 * (based on the java implementation).
 *
 * <p>An AsYouTypeFormatter can be created by new AsYouTypeFormatter(). After
 * that, digits can be added by invoking {@link #inputDigit} on the formatter
 * instance, and the partially formatted phone number will be returned each time
 * a digit is added. {@link #clear} can be invoked before formatting a new
 * number.
 *
 * <p>See the unittests for more details on how the formatter is to be used.
 *
 * @author Nikolaos Trogkanis
 */

goog.require('goog.string.StringBuffer');
goog.require('i18n.phonenumbers.NumberFormat');
goog.require('i18n.phonenumbers.PhoneMetadata');
goog.require('i18n.phonenumbers.PhoneMetadataCollection');
goog.require('i18n.phonenumbers.PhoneNumber');
goog.require('i18n.phonenumbers.PhoneNumber.CountryCodeSource');
goog.require('i18n.phonenumbers.PhoneNumberDesc');
goog.require('i18n.phonenumbers.PhoneNumberUtil');
goog.require('i18n.phonenumbers.metadata');



/**
 * Constructs an AsYouTypeFormatter for the specific region.
 *
 * @param {string} regionCode the ISO 3166-1 two-letter region code that denotes
 *     the region where the phone number is being entered.
 * @constructor
 */
i18n.phonenumbers.AsYouTypeFormatter = function(regionCode) {
  /**
   * The digits that have not been entered yet will be represented by a \u2008,
   * the punctuation space.
   * @const
   * @type {string}
   * @private
   */
  this.DIGIT_PLACEHOLDER_ = '\u2008';
  /**
   * @type {RegExp}
   * @private
   */
  this.DIGIT_PATTERN_ = new RegExp(this.DIGIT_PLACEHOLDER_);
  /**
   * @type {string}
   * @private
   */
  this.currentOutput_ = '';
  /**
   * @type {!goog.string.StringBuffer}
   * @private
   */
  this.formattingTemplate_ = new goog.string.StringBuffer();
  /**
   * The pattern from numberFormat that is currently used to create
   * formattingTemplate.
   * @type {string}
   * @private
   */
  this.currentFormattingPattern_ = '';
  /**
   * @type {!goog.string.StringBuffer}
   * @private
   */
  this.accruedInput_ = new goog.string.StringBuffer();
  /**
   * @type {!goog.string.StringBuffer}
   * @private
   */
  this.accruedInputWithoutFormatting_ = new goog.string.StringBuffer();
  /**
   * This indicates whether AsYouTypeFormatter is currently doing the
   * formatting.
   * @type {boolean}
   * @private
   */
  this.ableToFormat_ = true;
  /**
   * Set to true when users enter their own formatting. AsYouTypeFormatter will
   * do no formatting at all when this is set to true.
   * @type {boolean}
   * @private
   */
  this.inputHasFormatting_ = false;
  /**
   * This is set to true when we know the user is entering a full national
   * significant number, since we have either detected a national prefix or an
   * international dialing prefix. When this is true, we will no longer use
   * local number formatting patterns.
   * @type {boolean}
   * @private
   */
  this.isCompleteNumber_ = false;
  /**
   * @type {boolean}
   * @private
   */
  this.isExpectingCountryCallingCode_ = false;
  /**
   * @type {i18n.phonenumbers.PhoneNumberUtil}
   * @private
   */
  this.phoneUtil_ = i18n.phonenumbers.PhoneNumberUtil.getInstance();
  /**
   * @type {number}
   * @private
   */
  this.lastMatchPosition_ = 0;
  /**
   * The position of a digit upon which inputDigitAndRememberPosition is most
   * recently invoked, as found in the original sequence of characters the user
   * entered.
   * @type {number}
   * @private
   */
  this.originalPosition_ = 0;
  /**
   * The position of a digit upon which inputDigitAndRememberPosition is most
   * recently invoked, as found in accruedInputWithoutFormatting.
   * entered.
   * @type {number}
   * @private
   */
  this.positionToRemember_ = 0;
  /**
   * This contains anything that has been entered so far preceding the national
   * significant number, and it is formatted (e.g. with space inserted). For
   * example, this can contain IDD, country code, and/or NDD, etc.
   * @type {!goog.string.StringBuffer}
   * @private
   */
  this.prefixBeforeNationalNumber_ = new goog.string.StringBuffer();
  /**
   * @type {boolean}
   * @private
   */
  this.shouldAddSpaceAfterNationalPrefix_ = false;
  /**
   * This contains the national prefix that has been extracted. It contains only
   * digits without formatting.
   * @type {string}
   * @private
   */
  this.extractedNationalPrefix_ = '';
  /**
   * @type {!goog.string.StringBuffer}
   * @private
   */
  this.nationalNumber_ = new goog.string.StringBuffer();
  /**
   * @type {Array.<i18n.phonenumbers.NumberFormat>}
   * @private
   */
  this.possibleFormats_ = [];
  /**
   * @type {string}
   * @private
   */
  this.defaultCountry_ = regionCode;
  this.currentMetadata_ = this.getMetadataForRegion_(this.defaultCountry_);
  /**
   * @type {i18n.phonenumbers.PhoneMetadata}
   * @private
   */
  this.defaultMetadata_ = this.currentMetadata_;
};


/**
 * Character used when appropriate to separate a prefix, such as a long NDD or a
 * country calling code, from the national number.
 * @const
 * @type {string}
 * @private
 */
i18n.phonenumbers.AsYouTypeFormatter.SEPARATOR_BEFORE_NATIONAL_NUMBER_ = ' ';


/**
 * @const
 * @type {i18n.phonenumbers.PhoneMetadata}
 * @private
 */
i18n.phonenumbers.AsYouTypeFormatter.EMPTY_METADATA_ =
    new i18n.phonenumbers.PhoneMetadata();
i18n.phonenumbers.AsYouTypeFormatter.EMPTY_METADATA_
    .setInternationalPrefix('NA');


/**
 * A pattern that is used to match character classes in regular expressions.
 * An example of a character class is [1-4].
 * @const
 * @type {RegExp}
 * @private
 */
i18n.phonenumbers.AsYouTypeFormatter.CHARACTER_CLASS_PATTERN_ =
    /\[([^\[\]])*\]/g;


/**
 * Any digit in a regular expression that actually denotes a digit. For
 * example, in the regular expression 80[0-2]\d{6,10}, the first 2 digits
 * (8 and 0) are standalone digits, but the rest are not.
 * Two look-aheads are needed because the number following \\d could be a
 * two-digit number, since the phone number can be as long as 15 digits.
 * @const
 * @type {RegExp}
 * @private
 */
i18n.phonenumbers.AsYouTypeFormatter.STANDALONE_DIGIT_PATTERN_ =
    /\d(?=[^,}][^,}])/g;


/**
 * A pattern that is used to determine if a numberFormat under availableFormats
 * is eligible to be used by the AYTF. It is eligible when the format element
 * under numberFormat contains groups of the dollar sign followed by a single
 * digit, separated by valid phone number punctuation. This prevents invalid
 * punctuation (such as the star sign in Israeli star numbers) getting into the
 * output of the AYTF.
 * @const
 * @type {RegExp}
 * @private
 */
i18n.phonenumbers.AsYouTypeFormatter.ELIGIBLE_FORMAT_PATTERN_ = new RegExp(
    '^[' + i18n.phonenumbers.PhoneNumberUtil.VALID_PUNCTUATION + ']*' +
    '(\\$\\d[' + i18n.phonenumbers.PhoneNumberUtil.VALID_PUNCTUATION + ']*)+$');


/**
 * A set of characters that, if found in a national prefix formatting rules, are
 * an indicator to us that we should separate the national prefix from the
 * number when formatting.
 * @const
 * @type {RegExp}
 * @private
 */
i18n.phonenumbers.AsYouTypeFormatter.NATIONAL_PREFIX_SEPARATORS_PATTERN_ =
    /[- ]/;


/**
 * This is the minimum length of national number accrued that is required to
 * trigger the formatter. The first element of the leadingDigitsPattern of
 * each numberFormat contains a regular expression that matches up to this
 * number of digits.
 * @const
 * @type {number}
 * @private
 */
i18n.phonenumbers.AsYouTypeFormatter.MIN_LEADING_DIGITS_LENGTH_ = 3;


/**
 * The metadata needed by this class is the same for all regions sharing the
 * same country calling code. Therefore, we return the metadata for "main"
 * region for this country calling code.
 * @param {string} regionCode an ISO 3166-1 two-letter region code.
 * @return {i18n.phonenumbers.PhoneMetadata} main metadata for this region.
 * @private
 */
i18n.phonenumbers.AsYouTypeFormatter.prototype.getMetadataForRegion_ =
    function(regionCode) {

  /** @type {number} */
  var countryCallingCode = this.phoneUtil_.getCountryCodeForRegion(regionCode);
  /** @type {string} */
  var mainCountry =
      this.phoneUtil_.getRegionCodeForCountryCode(countryCallingCode);
  /** @type {i18n.phonenumbers.PhoneMetadata} */
  var metadata = this.phoneUtil_.getMetadataForRegion(mainCountry);
  if (metadata != null) {
    return metadata;
  }
  // Set to a default instance of the metadata. This allows us to function with
  // an incorrect region code, even if formatting only works for numbers
  // specified with '+'.
  return i18n.phonenumbers.AsYouTypeFormatter.EMPTY_METADATA_;
};


/**
 * @return {boolean} true if a new template is created as opposed to reusing the
 *     existing template.
 * @private
 */
i18n.phonenumbers.AsYouTypeFormatter.prototype.maybeCreateNewTemplate_ =
    function() {

  // When there are multiple available formats, the formatter uses the first
  // format where a formatting template could be created.
  /** @type {number} */
  var possibleFormatsLength = this.possibleFormats_.length;
  for (var i = 0; i < possibleFormatsLength; ++i) {
    /** @type {i18n.phonenumbers.NumberFormat} */
    var numberFormat = this.possibleFormats_[i];
    /** @type {string} */
    var pattern = numberFormat.getPatternOrDefault();
    if (this.currentFormattingPattern_ == pattern) {
      return false;
    }
    if (this.createFormattingTemplate_(numberFormat)) {
      this.currentFormattingPattern_ = pattern;
      this.shouldAddSpaceAfterNationalPrefix_ =
          i18n.phonenumbers.AsYouTypeFormatter.
          NATIONAL_PREFIX_SEPARATORS_PATTERN_.test(
              numberFormat.getNationalPrefixFormattingRule());
      // With a new formatting template, the matched position using the old
      // template needs to be reset.
      this.lastMatchPosition_ = 0;
      return true;
    }
  }
  this.ableToFormat_ = false;
  return false;
};


/**
 * @param {string} leadingDigits leading digits of entered number.
 * @private
 */
i18n.phonenumbers.AsYouTypeFormatter.prototype.getAvailableFormats_ =
    function(leadingDigits) {

  /** @type {Array.<i18n.phonenumbers.NumberFormat>} */
  var formatList =
      (this.isCompleteNumber_ &&
           this.currentMetadata_.intlNumberFormatCount() > 0) ?
      this.currentMetadata_.intlNumberFormatArray() :
      this.currentMetadata_.numberFormatArray();
  /** @type {number} */
  var formatListLength = formatList.length;
  for (var i = 0; i < formatListLength; ++i) {
    /** @type {i18n.phonenumbers.NumberFormat} */
    var format = formatList[i];
    /** @type {boolean} */
    var nationalPrefixIsUsedByCountry =
        this.currentMetadata_.hasNationalPrefix();
    if (!nationalPrefixIsUsedByCountry || this.isCompleteNumber_ ||
        format.getNationalPrefixOptionalWhenFormatting() ||
        this.phoneUtil_.formattingRuleHasFirstGroupOnly(
            format.getNationalPrefixFormattingRuleOrDefault())) {
      if (this.isFormatEligible_(format.getFormatOrDefault())) {
        this.possibleFormats_.push(format);
      }
    }
  }
  this.narrowDownPossibleFormats_(leadingDigits);
};


/**
 * @param {string} format
 * @return {boolean}
 * @private
 */
i18n.phonenumbers.AsYouTypeFormatter.prototype.isFormatEligible_ =
    function(format) {
  return i18n.phonenumbers.AsYouTypeFormatter.ELIGIBLE_FORMAT_PATTERN_
      .test(format);
};


/**
 * @param {string} leadingDigits
 * @private
 */
i18n.phonenumbers.AsYouTypeFormatter.prototype.narrowDownPossibleFormats_ =
    function(leadingDigits) {

  /** @type {Array.<i18n.phonenumbers.NumberFormat>} */
  var possibleFormats = [];
  /** @type {number} */
  var indexOfLeadingDigitsPattern =
      leadingDigits.length -
      i18n.phonenumbers.AsYouTypeFormatter.MIN_LEADING_DIGITS_LENGTH_;
  /** @type {number} */
  var possibleFormatsLength = this.possibleFormats_.length;
  for (var i = 0; i < possibleFormatsLength; ++i) {
    /** @type {i18n.phonenumbers.NumberFormat} */
    var format = this.possibleFormats_[i];
    if (format.leadingDigitsPatternCount() == 0) {
      // Keep everything that isn't restricted by leading digits.
      possibleFormats.push(this.possibleFormats_[i]);
      continue;
    }
    /** @type {number} */
    var lastLeadingDigitsPattern = Math.min(
        indexOfLeadingDigitsPattern, format.leadingDigitsPatternCount() - 1);
    /** @type {string} */
    var leadingDigitsPattern = /** @type {string} */
        (format.getLeadingDigitsPattern(lastLeadingDigitsPattern));
    if (leadingDigits.search(leadingDigitsPattern) == 0) {
      possibleFormats.push(this.possibleFormats_[i]);
    }
  }
  this.possibleFormats_ = possibleFormats;
};


/**
 * @param {i18n.phonenumbers.NumberFormat} format
 * @return {boolean}
 * @private
 */
i18n.phonenumbers.AsYouTypeFormatter.prototype.createFormattingTemplate_ =
    function(format) {

  /** @type {string} */
  var numberPattern = format.getPatternOrDefault();

  // The formatter doesn't format numbers when numberPattern contains '|', e.g.
  // (20|3)\d{4}. In those cases we quickly return.
  if (numberPattern.indexOf('|') != -1) {
    return false;
  }

  // Replace anything in the form of [..] with \d
  numberPattern = numberPattern.replace(
      i18n.phonenumbers.AsYouTypeFormatter.CHARACTER_CLASS_PATTERN_, '\\d');

  // Replace any standalone digit (not the one in d{}) with \d
  numberPattern = numberPattern.replace(
      i18n.phonenumbers.AsYouTypeFormatter.STANDALONE_DIGIT_PATTERN_, '\\d');
  this.formattingTemplate_.clear();
  /** @type {string} */
  var tempTemplate = this.getFormattingTemplate_(numberPattern,
                                                 format.getFormatOrDefault());
  if (tempTemplate.length > 0) {
    this.formattingTemplate_.append(tempTemplate);
    return true;
  }
  return false;
};


/**
 * Gets a formatting template which can be used to efficiently format a
 * partial number where digits are added one by one.
 *
 * @param {string} numberPattern
 * @param {string} numberFormat
 * @return {string}
 * @private
 */
i18n.phonenumbers.AsYouTypeFormatter.prototype.getFormattingTemplate_ =
    function(numberPattern, numberFormat) {

  // Creates a phone number consisting only of the digit 9 that matches the
  // numberPattern by applying the pattern to the longestPhoneNumber string.
  /** @type {string} */
  var longestPhoneNumber = '999999999999999';
  /** @type {Array.<string>} */
  var m = longestPhoneNumber.match(numberPattern);
  // this match will always succeed
  /** @type {string} */
  var aPhoneNumber = m[0];
  // No formatting template can be created if the number of digits entered so
  // far is longer than the maximum the current formatting rule can accommodate.
  if (aPhoneNumber.length < this.nationalNumber_.getLength()) {
    return '';
  }
  // Formats the number according to numberFormat
  /** @type {string} */
  var template = aPhoneNumber.replace(new RegExp(numberPattern, 'g'),
                                      numberFormat);
  // Replaces each digit with character DIGIT_PLACEHOLDER
  template = template.replace(new RegExp('9', 'g'), this.DIGIT_PLACEHOLDER_);
  return template;
};


/**
 * Clears the internal state of the formatter, so it can be reused.
 */
i18n.phonenumbers.AsYouTypeFormatter.prototype.clear = function() {
  this.currentOutput_ = '';
  this.accruedInput_.clear();
  this.accruedInputWithoutFormatting_.clear();
  this.formattingTemplate_.clear();
  this.lastMatchPosition_ = 0;
  this.currentFormattingPattern_ = '';
  this.prefixBeforeNationalNumber_.clear();
  this.extractedNationalPrefix_ = '';
  this.nationalNumber_.clear();
  this.ableToFormat_ = true;
  this.inputHasFormatting_ = false;
  this.positionToRemember_ = 0;
  this.originalPosition_ = 0;
  this.isCompleteNumber_ = false;
  this.isExpectingCountryCallingCode_ = false;
  this.possibleFormats_ = [];
  this.shouldAddSpaceAfterNationalPrefix_ = false;
  if (this.currentMetadata_ != this.defaultMetadata_) {
    this.currentMetadata_ = this.getMetadataForRegion_(this.defaultCountry_);
  }
};


/**
 * Formats a phone number on-the-fly as each digit is entered.
 *
 * @param {string} nextChar the most recently entered digit of a phone number.
 *     Formatting characters are allowed, but as soon as they are encountered
 *     this method formats the number as entered and not 'as you type' anymore.
 *     Full width digits and Arabic-indic digits are allowed, and will be shown
 *     as they are.
 * @return {string} the partially formatted phone number.
 */
i18n.phonenumbers.AsYouTypeFormatter.prototype.inputDigit = function(nextChar) {
  this.currentOutput_ =
      this.inputDigitWithOptionToRememberPosition_(nextChar, false);
  return this.currentOutput_;
};


/**
 * Same as {@link #inputDigit}, but remembers the position where
 * {@code nextChar} is inserted, so that it can be retrieved later by using
 * {@link #getRememberedPosition}. The remembered position will be automatically
 * adjusted if additional formatting characters are later inserted/removed in
 * front of {@code nextChar}.
 *
 * @param {string} nextChar
 * @return {string}
 */
i18n.phonenumbers.AsYouTypeFormatter.prototype.inputDigitAndRememberPosition =
    function(nextChar) {

  this.currentOutput_ =
      this.inputDigitWithOptionToRememberPosition_(nextChar, true);
  return this.currentOutput_;
};


/**
 * @param {string} nextChar
 * @param {boolean} rememberPosition
 * @return {string}
 * @private
 */
i18n.phonenumbers.AsYouTypeFormatter.prototype.
    inputDigitWithOptionToRememberPosition_ = function(nextChar,
                                                       rememberPosition) {

  this.accruedInput_.append(nextChar);
  if (rememberPosition) {
    this.originalPosition_ = this.accruedInput_.getLength();
  }
  // We do formatting on-the-fly only when each character entered is either a
  // digit, or a plus sign (accepted at the start of the number only).
  if (!this.isDigitOrLeadingPlusSign_(nextChar)) {
    this.ableToFormat_ = false;
    this.inputHasFormatting_ = true;
  } else {
    nextChar = this.normalizeAndAccrueDigitsAndPlusSign_(nextChar,
                                                         rememberPosition);
  }
  if (!this.ableToFormat_) {
    // When we are unable to format because of reasons other than that
    // formatting chars have been entered, it can be due to really long IDDs or
    // NDDs. If that is the case, we might be able to do formatting again after
    // extracting them.
    if (this.inputHasFormatting_) {
      return this.accruedInput_.toString();
    } else if (this.attemptToExtractIdd_()) {
      if (this.attemptToExtractCountryCallingCode_()) {
        return this.attemptToChoosePatternWithPrefixExtracted_();
      }
    } else if (this.ableToExtractLongerNdd_()) {
      // Add an additional space to separate long NDD and national significant
      // number for readability. We don't set shouldAddSpaceAfterNationalPrefix_
      // to true, since we don't want this to change later when we choose
      // formatting templates.
      this.prefixBeforeNationalNumber_.append(
          i18n.phonenumbers.AsYouTypeFormatter.
          SEPARATOR_BEFORE_NATIONAL_NUMBER_);
      return this.attemptToChoosePatternWithPrefixExtracted_();
    }
    return this.accruedInput_.toString();
  }

  // We start to attempt to format only when at least MIN_LEADING_DIGITS_LENGTH
  // digits (the plus sign is counted as a digit as well for this purpose) have
  // been entered.
  switch (this.accruedInputWithoutFormatting_.getLength()) {
    case 0:
    case 1:
    case 2:
      return this.accruedInput_.toString();
    case 3:
      if (this.attemptToExtractIdd_()) {
        this.isExpectingCountryCallingCode_ = true;
      } else {
        // No IDD or plus sign is found, might be entering in national format.
        this.extractedNationalPrefix_ =
            this.removeNationalPrefixFromNationalNumber_();
        return this.attemptToChooseFormattingPattern_();
      }
    default:
      if (this.isExpectingCountryCallingCode_) {
        if (this.attemptToExtractCountryCallingCode_()) {
          this.isExpectingCountryCallingCode_ = false;
        }
        return this.prefixBeforeNationalNumber_.toString() +
            this.nationalNumber_.toString();
      }
      if (this.possibleFormats_.length > 0) {
        // The formatting patterns are already chosen.
        /** @type {string} */
        var tempNationalNumber = this.inputDigitHelper_(nextChar);
        // See if the accrued digits can be formatted properly already. If not,
        // use the results from inputDigitHelper, which does formatting based on
        // the formatting pattern chosen.
        /** @type {string} */
        var formattedNumber = this.attemptToFormatAccruedDigits_();
        if (formattedNumber.length > 0) {
          return formattedNumber;
        }
        this.narrowDownPossibleFormats_(this.nationalNumber_.toString());
        if (this.maybeCreateNewTemplate_()) {
          return this.inputAccruedNationalNumber_();
        }
        return this.ableToFormat_ ?
            this.appendNationalNumber_(tempNationalNumber) :
            this.accruedInput_.toString();
      } else {
        return this.attemptToChooseFormattingPattern_();
      }
  }
};


/**
 * @return {string}
 * @private
 */
i18n.phonenumbers.AsYouTypeFormatter.prototype.
    attemptToChoosePatternWithPrefixExtracted_ = function() {

  this.ableToFormat_ = true;
  this.isExpectingCountryCallingCode_ = false;
  this.possibleFormats_ = [];
  this.lastMatchPosition_ = 0;
  this.formattingTemplate_.clear();
  this.currentFormattingPattern_ = '';
  return this.attemptToChooseFormattingPattern_();
};


/**
 * @return {string}
 * @private
 */
i18n.phonenumbers.AsYouTypeFormatter.prototype.getExtractedNationalPrefix_ =
    function() {
  return this.extractedNationalPrefix_;
};


/**
 * Some national prefixes are a substring of others. If extracting the shorter
 * NDD doesn't result in a number we can format, we try to see if we can extract
 * a longer version here.
 * @return {boolean}
 * @private
 */
i18n.phonenumbers.AsYouTypeFormatter.prototype.ableToExtractLongerNdd_ =
    function() {
  if (this.extractedNationalPrefix_.length > 0) {
    // Put the extracted NDD back to the national number before attempting to
    // extract a new NDD.
    /** @type {string} */
    var nationalNumberStr = this.nationalNumber_.toString();
    this.nationalNumber_.clear();
    this.nationalNumber_.append(this.extractedNationalPrefix_);
    this.nationalNumber_.append(nationalNumberStr);
    // Remove the previously extracted NDD from prefixBeforeNationalNumber. We
    // cannot simply set it to empty string because people sometimes incorrectly
    // enter national prefix after the country code, e.g. +44 (0)20-1234-5678.
    /** @type {string} */
    var prefixBeforeNationalNumberStr =
        this.prefixBeforeNationalNumber_.toString();
    /** @type {number} */
    var indexOfPreviousNdd = prefixBeforeNationalNumberStr.lastIndexOf(
        this.extractedNationalPrefix_);
    this.prefixBeforeNationalNumber_.clear();
    this.prefixBeforeNationalNumber_.append(
        prefixBeforeNationalNumberStr.substring(0, indexOfPreviousNdd));
  }
  return this.extractedNationalPrefix_ !=
      this.removeNationalPrefixFromNationalNumber_();
};


/**
 * @param {string} nextChar
 * @return {boolean}
 * @private
 */
i18n.phonenumbers.AsYouTypeFormatter.prototype.isDigitOrLeadingPlusSign_ =
    function(nextChar) {
  return i18n.phonenumbers.PhoneNumberUtil.CAPTURING_DIGIT_PATTERN
      .test(nextChar) ||
      (this.accruedInput_.getLength() == 1 &&
       i18n.phonenumbers.PhoneNumberUtil.PLUS_CHARS_PATTERN.test(nextChar));
};


/**
 * Check to see if there is an exact pattern match for these digits. If so, we
 * should use this instead of any other formatting template whose
 * leadingDigitsPattern also matches the input.
 * @return {string}
 * @private
 */
i18n.phonenumbers.AsYouTypeFormatter.prototype.attemptToFormatAccruedDigits_ =
    function() {

  /** @type {string} */
  var nationalNumber = this.nationalNumber_.toString();
  /** @type {number} */
  var possibleFormatsLength = this.possibleFormats_.length;
  for (var i = 0; i < possibleFormatsLength; ++i) {
    /** @type {i18n.phonenumbers.NumberFormat} */
    var numberFormat = this.possibleFormats_[i];
    /** @type {string} */
    var pattern = numberFormat.getPatternOrDefault();
    /** @type {RegExp} */
    var patternRegExp = new RegExp('^(?:' + pattern + ')$');
    if (patternRegExp.test(nationalNumber)) {
      this.shouldAddSpaceAfterNationalPrefix_ =
          i18n.phonenumbers.AsYouTypeFormatter.
          NATIONAL_PREFIX_SEPARATORS_PATTERN_.test(
              numberFormat.getNationalPrefixFormattingRule());
      /** @type {string} */
      var formattedNumber = nationalNumber.replace(new RegExp(pattern, 'g'),
                                                   numberFormat.getFormat());
      return this.appendNationalNumber_(formattedNumber);
    }
  }
  return '';
};


/**
 * Combines the national number with any prefix (IDD/+ and country code or
 * national prefix) that was collected. A space will be inserted between them if
 * the current formatting template indicates this to be suitable.
 * @param {string} nationalNumber The number to be appended.
 * @return {string} The combined number.
 * @private
 */
i18n.phonenumbers.AsYouTypeFormatter.prototype.appendNationalNumber_ =
    function(nationalNumber) {
  /** @type {number} */
  var prefixBeforeNationalNumberLength =
      this.prefixBeforeNationalNumber_.getLength();
  if (this.shouldAddSpaceAfterNationalPrefix_ &&
      prefixBeforeNationalNumberLength > 0 &&
      this.prefixBeforeNationalNumber_.toString().charAt(
          prefixBeforeNationalNumberLength - 1) !=
      i18n.phonenumbers.AsYouTypeFormatter.SEPARATOR_BEFORE_NATIONAL_NUMBER_) {
    // We want to add a space after the national prefix if the national prefix
    // formatting rule indicates that this would normally be done, with the
    // exception of the case where we already appended a space because the NDD
    // was surprisingly long.
    return this.prefixBeforeNationalNumber_ +
        i18n.phonenumbers.AsYouTypeFormatter.SEPARATOR_BEFORE_NATIONAL_NUMBER_ +
        nationalNumber;
  } else {
    return this.prefixBeforeNationalNumber_ + nationalNumber;
  }
};


/**
 * Returns the current position in the partially formatted phone number of the
 * character which was previously passed in as the parameter of
 * {@link #inputDigitAndRememberPosition}.
 *
 * @return {number}
 */
i18n.phonenumbers.AsYouTypeFormatter.prototype.getRememberedPosition =
    function() {

  if (!this.ableToFormat_) {
    return this.originalPosition_;
  }
  /** @type {number} */
  var accruedInputIndex = 0;
  /** @type {number} */
  var currentOutputIndex = 0;
  /** @type {string} */
  var accruedInputWithoutFormatting =
      this.accruedInputWithoutFormatting_.toString();
  /** @type {string} */
  var currentOutput = this.currentOutput_.toString();
  while (accruedInputIndex < this.positionToRemember_ &&
         currentOutputIndex < currentOutput.length) {
    if (accruedInputWithoutFormatting.charAt(accruedInputIndex) ==
        currentOutput.charAt(currentOutputIndex)) {
      accruedInputIndex++;
    }
    currentOutputIndex++;
  }
  return currentOutputIndex;
};


/**
 * Attempts to set the formatting template and returns a string which contains
 * the formatted version of the digits entered so far.
 *
 * @return {string}
 * @private
 */
i18n.phonenumbers.AsYouTypeFormatter.prototype.
    attemptToChooseFormattingPattern_ = function() {

  /** @type {string} */
  var nationalNumber = this.nationalNumber_.toString();
  // We start to attempt to format only when at least MIN_LEADING_DIGITS_LENGTH
  // digits of national number (excluding national prefix) have been entered.
  if (nationalNumber.length >=
      i18n.phonenumbers.AsYouTypeFormatter.MIN_LEADING_DIGITS_LENGTH_) {
    this.getAvailableFormats_(nationalNumber);
    // See if the accrued digits can be formatted properly already.
    var formattedNumber = this.attemptToFormatAccruedDigits_();
    if (formattedNumber.length > 0) {
      return formattedNumber;
    }
    return this.maybeCreateNewTemplate_() ?
        this.inputAccruedNationalNumber_() : this.accruedInput_.toString();
  } else {
    return this.appendNationalNumber_(nationalNumber);
  }
};


/**
 * Invokes inputDigitHelper on each digit of the national number accrued, and
 * returns a formatted string in the end.
 *
 * @return {string}
 * @private
 */
i18n.phonenumbers.AsYouTypeFormatter.prototype.inputAccruedNationalNumber_ =
    function() {

  /** @type {string} */
  var nationalNumber = this.nationalNumber_.toString();
  /** @type {number} */
  var lengthOfNationalNumber = nationalNumber.length;
  if (lengthOfNationalNumber > 0) {
    /** @type {string} */
    var tempNationalNumber = '';
    for (var i = 0; i < lengthOfNationalNumber; i++) {
      tempNationalNumber =
          this.inputDigitHelper_(nationalNumber.charAt(i));
    }
    return this.ableToFormat_ ?
        this.appendNationalNumber_(tempNationalNumber) :
        this.accruedInput_.toString();
  } else {
    return this.prefixBeforeNationalNumber_.toString();
  }
};


/**
 * @return {boolean} true if the current country is a NANPA country and the
 *     national number begins with the national prefix.
 * @private
 */
i18n.phonenumbers.AsYouTypeFormatter.prototype.
    isNanpaNumberWithNationalPrefix_ = function() {
  // For NANPA numbers beginning with 1[2-9], treat the 1 as the national
  // prefix. The reason is that national significant numbers in NANPA always
  // start with [2-9] after the national prefix. Numbers beginning with 1[01]
  // can only be short/emergency numbers, which don't need the national prefix.
  if (this.currentMetadata_.getCountryCode() != 1) {
    return false;
  }
  /** @type {string} */
  var nationalNumber = this.nationalNumber_.toString();
  return (nationalNumber.charAt(0) == '1') &&
      (nationalNumber.charAt(1) != '0') &&
      (nationalNumber.charAt(1) != '1');
};


/**
 * Returns the national prefix extracted, or an empty string if it is not
 * present.
 * @return {string}
 * @private
 */
i18n.phonenumbers.AsYouTypeFormatter.prototype.
    removeNationalPrefixFromNationalNumber_ = function() {

  /** @type {string} */
  var nationalNumber = this.nationalNumber_.toString();
  /** @type {number} */
  var startOfNationalNumber = 0;
  if (this.isNanpaNumberWithNationalPrefix_()) {
    startOfNationalNumber = 1;
    this.prefixBeforeNationalNumber_.append('1').append(
        i18n.phonenumbers.AsYouTypeFormatter.SEPARATOR_BEFORE_NATIONAL_NUMBER_);
    this.isCompleteNumber_ = true;
  } else if (this.currentMetadata_.hasNationalPrefixForParsing()) {
    /** @type {RegExp} */
    var nationalPrefixForParsing = new RegExp(
        '^(?:' + this.currentMetadata_.getNationalPrefixForParsing() + ')');
    /** @type {Array.<string>} */
    var m = nationalNumber.match(nationalPrefixForParsing);
    // Since some national prefix patterns are entirely optional, check that a
    // national prefix could actually be extracted.
    if (m != null && m[0] != null && m[0].length > 0) {
      // When the national prefix is detected, we use international formatting
      // rules instead of national ones, because national formatting rules could
      // contain local formatting rules for numbers entered without area code.
      this.isCompleteNumber_ = true;
      startOfNationalNumber = m[0].length;
      this.prefixBeforeNationalNumber_.append(nationalNumber.substring(0,
          startOfNationalNumber));
    }
  }
  this.nationalNumber_.clear();
  this.nationalNumber_.append(nationalNumber.substring(startOfNationalNumber));
  return nationalNumber.substring(0, startOfNationalNumber);
};


/**
 * Extracts IDD and plus sign to prefixBeforeNationalNumber when they are
 * available, and places the remaining input into nationalNumber.
 *
 * @return {boolean} true when accruedInputWithoutFormatting begins with the
 *     plus sign or valid IDD for defaultCountry.
 * @private
 */
i18n.phonenumbers.AsYouTypeFormatter.prototype.attemptToExtractIdd_ =
    function() {

  /** @type {string} */
  var accruedInputWithoutFormatting =
      this.accruedInputWithoutFormatting_.toString();
  /** @type {RegExp} */
  var internationalPrefix = new RegExp(
      '^(?:' + '\\' + i18n.phonenumbers.PhoneNumberUtil.PLUS_SIGN + '|' +
      this.currentMetadata_.getInternationalPrefix() + ')');
  /** @type {Array.<string>} */
  var m = accruedInputWithoutFormatting.match(internationalPrefix);
  if (m != null && m[0] != null && m[0].length > 0) {
    this.isCompleteNumber_ = true;
    /** @type {number} */
    var startOfCountryCallingCode = m[0].length;
    this.nationalNumber_.clear();
    this.nationalNumber_.append(
        accruedInputWithoutFormatting.substring(startOfCountryCallingCode));
    this.prefixBeforeNationalNumber_.clear();
    this.prefixBeforeNationalNumber_.append(
        accruedInputWithoutFormatting.substring(0, startOfCountryCallingCode));
    if (accruedInputWithoutFormatting.charAt(0) !=
        i18n.phonenumbers.PhoneNumberUtil.PLUS_SIGN) {
      this.prefixBeforeNationalNumber_.append(
          i18n.phonenumbers.AsYouTypeFormatter.
          SEPARATOR_BEFORE_NATIONAL_NUMBER_);
    }
    return true;
  }
  return false;
};


/**
 * Extracts the country calling code from the beginning of nationalNumber to
 * prefixBeforeNationalNumber when they are available, and places the remaining
 * input into nationalNumber.
 *
 * @return {boolean} true when a valid country calling code can be found.
 * @private
 */
i18n.phonenumbers.AsYouTypeFormatter.prototype.
    attemptToExtractCountryCallingCode_ = function() {

  if (this.nationalNumber_.getLength() == 0) {
    return false;
  }
  /** @type {!goog.string.StringBuffer} */
  var numberWithoutCountryCallingCode = new goog.string.StringBuffer();
  /** @type {number} */
  var countryCode = this.phoneUtil_.extractCountryCode(
      this.nationalNumber_, numberWithoutCountryCallingCode);
  if (countryCode == 0) {
    return false;
  }
  this.nationalNumber_.clear();
  this.nationalNumber_.append(numberWithoutCountryCallingCode.toString());
  /** @type {string} */
  var newRegionCode = this.phoneUtil_.getRegionCodeForCountryCode(countryCode);
  if (i18n.phonenumbers.PhoneNumberUtil.REGION_CODE_FOR_NON_GEO_ENTITY ==
      newRegionCode) {
    this.currentMetadata_ =
        this.phoneUtil_.getMetadataForNonGeographicalRegion(countryCode);
  } else if (newRegionCode != this.defaultCountry_) {
    this.currentMetadata_ = this.getMetadataForRegion_(newRegionCode);
  }
  /** @type {string} */
  var countryCodeString = '' + countryCode;
  this.prefixBeforeNationalNumber_.append(countryCodeString).append(
      i18n.phonenumbers.AsYouTypeFormatter.SEPARATOR_BEFORE_NATIONAL_NUMBER_);
  // When we have successfully extracted the IDD, the previously extracted NDD
  // should be cleared because it is no longer valid.
  this.extractedNationalPrefix_ = '';
  return true;
};


/**
 * Accrues digits and the plus sign to accruedInputWithoutFormatting for later
 * use. If nextChar contains a digit in non-ASCII format (e.g. the full-width
 * version of digits), it is first normalized to the ASCII version. The return
 * value is nextChar itself, or its normalized version, if nextChar is a digit
 * in non-ASCII format. This method assumes its input is either a digit or the
 * plus sign.
 *
 * @param {string} nextChar
 * @param {boolean} rememberPosition
 * @return {string}
 * @private
 */
i18n.phonenumbers.AsYouTypeFormatter.prototype.
    normalizeAndAccrueDigitsAndPlusSign_ = function(nextChar,
                                                    rememberPosition) {

  /** @type {string} */
  var normalizedChar;
  if (nextChar == i18n.phonenumbers.PhoneNumberUtil.PLUS_SIGN) {
    normalizedChar = nextChar;
    this.accruedInputWithoutFormatting_.append(nextChar);
  } else {
    normalizedChar = i18n.phonenumbers.PhoneNumberUtil.DIGIT_MAPPINGS[nextChar];
    this.accruedInputWithoutFormatting_.append(normalizedChar);
    this.nationalNumber_.append(normalizedChar);
  }
  if (rememberPosition) {
    this.positionToRemember_ = this.accruedInputWithoutFormatting_.getLength();
  }
  return normalizedChar;
};


/**
 * @param {string} nextChar
 * @return {string}
 * @private
 */
i18n.phonenumbers.AsYouTypeFormatter.prototype.inputDigitHelper_ =
    function(nextChar) {

  // Note that formattingTemplate is not guaranteed to have a value, it could be
  // empty, e.g. when the next digit is entered after extracting an IDD or NDD.
  /** @type {string} */
  var formattingTemplate = this.formattingTemplate_.toString();
  if (formattingTemplate.substring(this.lastMatchPosition_)
      .search(this.DIGIT_PATTERN_) >= 0) {
    /** @type {number} */
    var digitPatternStart = formattingTemplate.search(this.DIGIT_PATTERN_);
    /** @type {string} */
    var tempTemplate =
        formattingTemplate.replace(this.DIGIT_PATTERN_, nextChar);
    this.formattingTemplate_.clear();
    this.formattingTemplate_.append(tempTemplate);
    this.lastMatchPosition_ = digitPatternStart;
    return tempTemplate.substring(0, this.lastMatchPosition_ + 1);
  } else {
    if (this.possibleFormats_.length == 1) {
      // More digits are entered than we could handle, and there are no other
      // valid patterns to try.
      this.ableToFormat_ = false;
    }  // else, we just reset the formatting pattern.
    this.currentFormattingPattern_ = '';
    return this.accruedInput_.toString();
  }
};

goog.require('i18n.phonenumbers.AsYouTypeFormatter');
goog.require('i18n.phonenumbers.PhoneNumberFormat');
goog.require('i18n.phonenumbers.PhoneNumberUtil');

goog.exportSymbol('libphonenumber', {
  // format the given number (optionally add any formatting suffix e.g. a hyphen)
  formatNumber:function formatNumber(val, countryCode, addSuffix, allowExtension, isAllowedKey) {
    try {
      var clean = val.replace(/\D/g, ""),
        // NOTE: we use AsYouTypeFormatter because the default format function can't handle incomplete numbers e.g. "+17024" formats to "+1 7024" as opposed to "+1 702-4"
        formatter = new i18n.phonenumbers.AsYouTypeFormatter(countryCode),
        // if clean is empty, we still need this to be a string otherwise we get errors later
        result = "",
        next,
        extSuffix = " ext. ";

      if (val.substr(0, 1) == "+") {
        clean = "+" + clean;
      }

      for (var i = 0; i < clean.length; i++) {
        // TODO: improve this so don't just pump in every digit every time - we should just cache this formatter object, and just call inputDigit once each time the user enters a new digit
        next = formatter.inputDigit(clean.charAt(i));
        // if adding this char didn't change the length, or made it smaller (and there's no longer any spaces): that means that formatting failed which means the number was no longer a potentially valid number, so if we're allowing extensions: assume the rest is the ext
        if (allowExtension && result && next.length <= result.length && next.indexOf(" ") == -1) {
          // set flag for extension
          next = -1;
          break;
        }
        result = next;
      }

      // for some reason libphonenumber formats "+44" to "+44 ", but doesn't do the same with "+1"
      if (result.charAt(result.length - 1) == " ") {
        result = result.substr(0, result.length - 1);
      }
      // check if there's a suffix to add (unless there's an ext)
      if (addSuffix && !val.split(extSuffix)[1]) {
        // hack to get formatting suffix
        var test = formatter.inputDigit('5');
        // again the "+44 " problem... (also affects "+45" apparently)
        if (test.charAt(test.length - 1) == " ") {
          test = test.substr(0, test.length - 1);
        }
        // if adding a '5' introduces a formatting char - check if the penultimate char is not-a-number
        var penultimate = test.substr(test.length - 2, 1);
        // Note: never use isNaN without parseFloat
        if (isNaN(parseFloat(penultimate))) {
          // return the new value (minus that last '5' we just added)
          return test.substr(0, test.length - 1);
        } else if (allowExtension && result && test.length <= result.length && test.indexOf(" ") == -1 && !isAllowedKey) {
          // else if the next digit would break the formating, and we're allowing extensions, AND this is not an allowed key: add the suffix
          // NOTE: we must check this is not an allowed key because if it was that means it was the last digit in a valid number and we dont want to add the "ext" suffix in that case. This whole condition is just here to catch the case that: after typing a valid number, they try to type "ext" - this will not automatically add it for them.
          return result + extSuffix;
        }
      }

      // if the clean number contains an extension we need to add it
      if (next == -1) {
        result += extSuffix + clean.substring(i, clean.length);
      }
      return result;
    } catch (e) {
      return val;
    }
  },

  // format the given number to the given type
  formatNumberByType: function formatNumberByType(number, countryCode, type) {
    try {
      var phoneUtil = i18n.phonenumbers.PhoneNumberUtil.getInstance();
      var numberObj = phoneUtil.parseAndKeepRawInput(number, countryCode);
      type = (typeof type == "undefined") ? i18n.phonenumbers.PhoneNumberFormat.E164 : type;
      return phoneUtil.format(numberObj, type);
    } catch (e) {
      return "";
    }
  },

  // get an example number for the given country code
  getExampleNumber: function getExampleNumber(countryCode, national, numberType) {
    try {
      var phoneUtil = i18n.phonenumbers.PhoneNumberUtil.getInstance();
      var numberObj = phoneUtil.getExampleNumberForType(countryCode, numberType);
      var format = (national) ? i18n.phonenumbers.PhoneNumberFormat.NATIONAL : i18n.phonenumbers.PhoneNumberFormat.INTERNATIONAL;
      return phoneUtil.format(numberObj, format);
    } catch (e) {
      return "";
    }
  },

  // get the type of the given number e.g. fixed-line/mobile
  getNumberType: function getNumberType(number, countryCode) {
    try {
      var phoneUtil = i18n.phonenumbers.PhoneNumberUtil.getInstance();
      var numberObj = phoneUtil.parseAndKeepRawInput(number, countryCode);
      return phoneUtil.getNumberType(numberObj)
    } catch (e) {
      // broken
      return -99;
    }
  },

  // get more info if the validation has failed e.g. too long/too short
  getValidationError: function getValidationError(number, countryCode) {
    try {
      var phoneUtil = i18n.phonenumbers.PhoneNumberUtil.getInstance();
      var numberObj = phoneUtil.parseAndKeepRawInput(number, countryCode);
      return phoneUtil.isPossibleNumberWithReason(numberObj);
    } catch (e) {
      //console.log(e);

      // here I convert thrown errors into ValidationResult enums (if possible)
      if (e == i18n.phonenumbers.Error.INVALID_COUNTRY_CODE) {
        return i18n.phonenumbers.PhoneNumberUtil.ValidationResult.INVALID_COUNTRY_CODE;
      }
      if (e == i18n.phonenumbers.Error.NOT_A_NUMBER) {
        return 4;
      }
      if (e == i18n.phonenumbers.Error.TOO_SHORT_AFTER_IDD || e == i18n.phonenumbers.Error.TOO_SHORT_NSN) {
        return i18n.phonenumbers.PhoneNumberUtil.ValidationResult.TOO_SHORT;
      }
      if (e == i18n.phonenumbers.Error.TOO_LONG) {
        return i18n.phonenumbers.PhoneNumberUtil.ValidationResult.TOO_LONG;
      }

      // broken
      return -99;
    }
  },

  // check if given number is valid
  isValidNumber: function isValidNumber(number, countryCode) {
    try {
      var phoneUtil = i18n.phonenumbers.PhoneNumberUtil.getInstance();
      var numberObj = phoneUtil.parseAndKeepRawInput(number, countryCode);
      return phoneUtil.isValidNumber(numberObj);
    } catch (e) {
      return false;
    }
  },
  
  // enums
  numberType: i18n.phonenumbers.PhoneNumberType,
  validationError: {
    IS_POSSIBLE: 0,
    INVALID_COUNTRY_CODE: 1,
    TOO_SHORT: 2,
    TOO_LONG: 3,
    NOT_A_NUMBER: 4
  },
  numberFormat: i18n.phonenumbers.PhoneNumberFormat
}, utils);
