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
	},
	unify: function(o) { return o.type == this.type && o.value == this.value; },
	 
//////////////// nul.xpr implementation

	//type: on_init
	toString : function() {
		//TODO1
	},
	ndx: function() { return '['+this.type+':'+(''+this.value).replace(']','[|]')+']'; },
});

nul.obj.litteral.straightArythmetics = function(oprtr, srnd) {
	srnd = srnd || '';
	return function(op1, op2, klg) {
		if('number'== op2.type) 
			return new nul.possibles(klg, [nul.obj.litteral(eval(
				srnd + op1.value + oprtr + op2.value + srnd
			))]);
		if(op2.attr) return [];
	}
};

nul.obj.litteral.attr = {};
nul.obj.litteral.attr.string = {}
nul.obj.litteral.attr.number = {};

nul.obj.litteral.attr.string['+'] = nul.obj.litteral.straightArythmetics('"+"','"');
//TODO4: integers and & | ^
map(['+', '-', '*', '/', '%'],
	function(i,v) { nul.obj.litteral.attr.number[v] = nul.obj.litteral.straightArythmetics(v); });
