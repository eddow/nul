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
	charact: 'native',
	failable: function() { return false; },
	initialize: function($super, name) {
		this.name = name;
		this.acNdx = '['+name+']';
		$super();
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
	initialize: function($super, name, callback, primitive) {
		this.callback = callback;
		this.elementPrimitive = primitive;
		$super(name);
	},
	transform: function() { return false; },
	take: function(apl, klg, way) {
		if(this.callback(apl, klg)) return apl;
	}.perform('nul.xpr.javascript.set->take'),
	elementAttribute: function(xpr, atn) {
		var fct = nul.primitiveTree.primObject(this.elementPrimitive)[atn];
		if(fct) return fct.apply(xpr);
	},
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
	transform: function() { return true; },
	take: function(apl, klg, way) {
		var cb = (1==way)?this.callback:this.invcallback;
		var rv;
		if(cb) rv = cb(apl,klg);
		return rv;
	}.perform('nul.xpr.javascript.fct->take')
});