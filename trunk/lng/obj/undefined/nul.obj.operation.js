/*  NUL language JavaScript framework
 *  (c) 2009 E-med Ware
 *
 * NUL is freely distributable under the terms of GNU GPLv3 license.
 *  For details, see the NUL project site : http://code.google.com/p/nul/
 *
 *--------------------------------------------------------------------------*/

nul.obj.operation = {};
nul.obj.operation.binary = Class.create(nul.obj, {
	initialise: function(operator, ops) {
		this.operator = operator;
		this.operands = ops;
	},
});

nul.obj.operation.binary = Class.create(nul.obj.operation, {
	//TODO2
});