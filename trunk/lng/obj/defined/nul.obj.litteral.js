/*  NUL language JavaScript framework
 *  (c) 2009 E-med Ware
 *
 * NUL is freely distributable under the terms of GNU GPLv3 license.
 *  For details, see the NUL project site : http://code.google.com/p/nul/
 *
 *--------------------------------------------------------------------------*/

nul.obj.litteral = Class.create(nul.obj.defined, {
	initialise: function(val) {
		this.value = val;
		this.type = typeof(val);
		this.attr = nul.obj.litteral.attr[typeof(val)] 
	}
});

nul.obj.litteral.straightArythmetics = function(oprtr, srnd) {
	srnd = srnd || '';
	return function(op1, op2) {
		if('number'== op2.type) 
			return [nul.fuzzy(nul.obj.number(eval(
				srnd + op1.value + oprtr + op2.value + srnd
			)))];
		if(op2.attr) return [];
	}
};

nul.obj.litteral.attr.string = { '+': nul.obj.litteral.straightArythmetics('"+"','"') };
nul.obj.litteral.attr.number = {};
//TODO: integers and & | ^
map(['+', '-', '*', '/', '%'],
	function(i,v) { nul.obj.litteral.attr.number[v] = nul.obj.litteral.straightArythmetics(v); });
