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

nul.obj.operation = Class.create(nul.obj.undefined, {
	initialize: function(operator, ops) {
		nul.obj.use(ops);
		this.operator = operator;
		this.operands = ops;
		this.alreadyBuilt();
	},
	
//////////////// nul.expression implementation
	
	type: 'operation',
	components: ['operands'],
});

nul.obj.operation.binary = Class.create(nul.obj.operation, {
	//TODO2
});

nul.obj.operation.Nary = Class.create(nul.obj.operation, {
	//TODO2
});