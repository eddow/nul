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
		this.type = typeof(val);
		this.attr = nul.obj.litteral.attr[typeof(val)]
		this.summarise({
			isSet: false,
			isList: false,
		}); 
	},
	
//////////////// nul.xpr implementation

	//type: set on initialise
	sum_index: function() { return this.indexedSub(this.value.toString().replace(']','[|]')); },
});

nul.obj.litteral.straightArythmetics = function(type, oprtr, srnd) {
	srnd = srnd || '';
	return function(op1, op2, klg) {
		if(type== op2.type) 
			return nul.obj.litteral(eval(
				srnd + op1.value + oprtr + op2.value + srnd
			));
		if(op2.isDefined()) return nul.fail(op2, ' is not a ', type);
	}
};

nul.obj.litteral.attr = {};
nul.obj.litteral.attr.string = {}
nul.obj.litteral.attr.number = {};

nul.obj.litteral.attr.string['+'] = nul.obj.litteral.straightArythmetics('string','"+"','"');
//TODO4: integers and & | ^
map(['+', '-', '*', '/', '%'],
	function(i,v) { nul.obj.litteral.attr.number[v] = nul.obj.litteral.straightArythmetics('number',v); });
