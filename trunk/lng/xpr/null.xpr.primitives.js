/*  NUL language JavaScript framework
 *  (c) 2009 François Marie De Mey
 *
 * NUL is freely distributable under the terms of GNU GPLv3 license.
 *  For details, see the NUL project site : http://code.google.com/p/nul/
 *
 *--------------------------------------------------------------------------*/

nul.xpr.anything = Class.create(nul.xpr.uncomposed, {
 	charact: 'any',
	failable: function() { return false; },
	initialize: function($super) {
		this.fuzze = {};	//Correct: <fidel> depends on no-one
		return $super();
	},
/////// String
	expressionHTML: function() {
		return '<span class="op">any</span>';
	},
	expressionString: function() {
		return 'any';
	},
	
	sub: {
		
	}
	
});
nul.xpr.fidel = Class.create(nul.xpr.uncomposed, {
 	charact: 'fidel',
	failable: function() { return false; },
	initialize: function($super) {
		this.fuzze = {};	//Correct: <fidel> depends on no-one
		return $super();
	},
/////// String
	expressionHTML: function() {
		return '<span class="op">&crarr;</span>';
	},
	expressionString: function() {
		return '&crarr;';
	},
	
	sub: {
		
	}
	
});

nul.xpr.subSet = Class.create(nul.xpr.listed, {
 	charact: 'set',
	failable: function() { return false; },
	initialize: function($super, ops) {
		this.arity = [];	//TODO: arités des sous-sets
		return $super(ops);
	},
	composed: function($super) {
		this.fuzze = {};	//TODO: mon arité/fuzziness?
		return $super();
	},
	sub: {
		
	}
});
