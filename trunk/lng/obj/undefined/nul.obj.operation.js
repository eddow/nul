/*  NUL language JavaScript framework
 *  (c) 2009 E-med Ware
 *
 * NUL is freely distributable under the terms of GNU GPLv3 license.
 *  For details, see the NUL project site : http://code.google.com/p/nul/
 *
 *--------------------------------------------------------------------------*/

//TODO4: ((a + b) + (c + d)) => (a + b + c + d)
//TODO4: ((a - b) - c) =?> (a - (b + c)) 
//TODO4: (a - (b - c)) =?> ((a + c) - b) !!!/0 

nul.obj.operation = {};
nul.obj.operation.binary = Class.create(nul.obj, {
	initialise: function(operator, ops) {
		this.operator = operator;
		this.operands = ops;
	},
	ndx: function() { return '[op:'+this.operator+'|'+
		this.operands.map(function() { return this.ndx(); }).join('|')+
		']'; },
});

nul.obj.operation.binary = Class.create(nul.obj.operation, {
	//TODO2
});