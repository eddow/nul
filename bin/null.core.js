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
/*FILE: src/lng/txt/out/null.txt.js*/
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
 		return new nul.obj.local(this.name, ndx);
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
/*FILE: src/lng/xpr/klg/nul.klg.ior3.js*/
/*FILE: src/lng/xpr/klg/nul.klg.eqCls.js*/
/*FILE: src/lng/xpr/klg/nul.klg.browse.js*/
/*FILE: src/lng/xpr/klg/nul.klg.algo.js*/
