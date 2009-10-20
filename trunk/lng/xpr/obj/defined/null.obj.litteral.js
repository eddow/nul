/*  NUL language JavaScript framework
 *  (c) 2009 E-med Ware
 *
 * NUL is freely distributable under the terms of GNU GPLv3 license.
 *  For details, see the NUL project site : http://code.google.com/p/nul/
 *
 *--------------------------------------------------------------------------*/

nul.obj.litteral = Class.create(nul.obj.defined, {
	initialize: function($super, val) {
		this.value = val;
		this.alreadyBuilt();
		$super();
	}
});

nul.obj.litteral.number = Class.create(nul.obj.litteral, {
//////////////// nul.xpr.object implementation

	attributes: {
		
	},

	subHas: function(o) {
		nul.fail(o, ' doesnt contains anything');
	},
	
//////////////// nul.expression implementation

	expression: 'number',
	sum_index: function() { return this.indexedSub(this.value.toString().replace(']','[|]')); }
});
nul.obj.litteral.string = Class.create(nul.obj.litteral, {
//////////////// nul.xpr.object implementation

	attributes: {
		'# ': function() { return nul.obj.litteral.make(this.value.length); }
	},

//////////////// nul.expression implementation

	expression: 'string',
	sum_index: function() { return this.indexedSub(this.value.replace(']','[|]')); }
});
nul.obj.litteral['boolean'] = Class.create(nul.obj.litteral, {
//////////////// nul.xpr.object implementation

	attributes: {
		
	},

//////////////// nul.expression implementation

	expression: 'boolean',
	sum_index: function() { return this.indexedSub(this.value?'T':'F'); }
});

/**
 * Make a litteral from a javascript value
 */
nul.obj.litteral.make = function(v) {
	if(nul.debug.assert) assert(nul.obj.litteral[typeof v], (typeof v)+' is a litteral type')
	return new nul.obj.litteral[typeof v](v);
};
/*
nul.obj.litteral.straightArythmetics = function(expression, oprtr, srnd) {
	srnd = srnd || '';
	return function(op1, op2, klg) {
		if(expression== op2.expression) 
			return nul.obj.litteral(eval(
				srnd + op1.value + oprtr + op2.value + srnd
			));
		if(op2.defined) return nul.fail(op2, ' is not a ', expression);
	}
};

nul.obj.litteral.attr = {};
nul.obj.litteral.attr.string = {}
nul.obj.litteral.attr.number = {};

nul.obj.litteral.attr.string['+'] = nul.obj.litteral.straightArythmetics('string','"+"','"');
//TODO4: integers and & | ^
map(['+', '-', '*', '/', '%'],
	function(i,v) { nul.obj.litteral.attr.number[v] = nul.obj.litteral.straightArythmetics('number',v); });
*/