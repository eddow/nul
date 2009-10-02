/*  NUL language JavaScript framework
 *  (c) 2009 E-med Ware
 *
 * NUL is freely distributable under the terms of GNU GPLv3 license.
 *  For details, see the NUL project site : http://code.google.com/p/nul/
 *
 *--------------------------------------------------------------------------*/

nul.obj.litteral = Class.create(nul.obj.defined, {
	initialize: function(val) {
		this.value = val;
		this.expression = typeof(val);
		this.attr = nul.obj.litteral.attr[typeof(val)]
		this.alreadyBuilt(); 
	},
	
//////////////// nul.xpr.object implementation

	has: function(o) {
		return [];	//TODO4: exception ?
	},
	
//////////////// nul.expression implementation

	//expression: set on initialise
	sum_index: function() { return this.indexedSub(this.value.toString().replace(']','[|]')); },
});

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
