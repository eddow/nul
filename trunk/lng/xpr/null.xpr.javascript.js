/*  NUL language JavaScript framework
 *  (c) 2009 François Marie De Mey
 *
 * NUL is freely distributable under the terms of GNU GPLv3 license.
 *  For details, see the NUL project site : http://code.google.com/p/nul/
 *
 *--------------------------------------------------------------------------*/

/**
 * Native sets : the ones written in javascript
 */
nul.xpr.javascript = Class.create(nul.xpr.primitive(nul.xpr.uncomposed,'set'), {
	failable: function() { return false; },
	initialize: function(name) {
		this.name = name;
	},
/////// String
	expressionHTML: function() {
		return '<span class="native">' + this.name + '</span>';
	},
	expressionString: function() {
		return this.name;
	}
});

/**
 * Set definition : the callback returns :
 * - a value if the item is accepted
 * - no value if we cannot determine
 * The callbacks has to fail if the item is not an element
 */
nul.xpr.javascript.set = Class.create(nul.xpr.javascript, {
	initialize: function($super, name, callback) {
		this.callback = callback;
		$super(name);
	},
	transform: function() { return false; },
	take: function(apl, kb, way) {
		if(this.callback(apl, kb)) return apl;
	}.perform('nul.xpr.javascript.set->take'),
});

/**
 * Function definition : the callback returns :
 * - a value, the resultant expression if computed
 * - no value if we cannot determine
 * The callbacks has to fail if the item is not a good argument
 * the second 'invcallback' is called with the expected return value when we seek the argument.
 */
nul.xpr.javascript.fct = Class.create(nul.xpr.javascript, {
	initialize: function($super, name, callback, invcallback) {
		this.callback = callback;
		this.invcallback = invcallback;
		$super(name);
	},
	transform: function() { return false; },
	take: function(apl, kb, way) {
		var cb = (1==way)?this.callback:this.invcallback;
		var rv;
		if(cb) rv = cb(apl,kb);
		return rv;
	}.perform('nul.xpr.javascript.fct->take'),
});