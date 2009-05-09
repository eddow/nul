/*  NUL language JavaScript framework
 *  (c) 2009 François Marie De Mey
 *
 * NUL is freely distributable under the terms of GNU GPLv3 license.
 *  For details, see the NUL project site : http://code.google.com/p/nul/
 *
 *--------------------------------------------------------------------------*/
nul.natives = {
	Q: new nul.xpr.javascript.set('&#x211a;',
		function(xpr) {
			if(nul.primitiveTree.is(xpr, 'number', 'a')) return xpr;
		}, 'number'
	),
	Z: new nul.xpr.javascript.set('&#x2124;',
		function(xpr) {
			if(nul.primitiveTree.is(xpr, 'integer', 'an')) return xpr;
	    }, 'integer'
	),
	'true': new nul.xpr.atom(true),
	'false': new nul.xpr.atom(false),
	str: new nul.xpr.javascript.set('str',
		function(xpr) {
			if(nul.primitiveTree.is(xpr, 'string', 'a')) return xpr;
		}, 'string'
	),
	bool: new nul.xpr.javascript.set('bool',
		function(xpr) {
			if(nul.primitiveTree.is(xpr, 'boolean', 'a')) return xpr;
		}, 'boolean'
	),
	object: new nul.xpr.javascript.set('object',
		function(xpr) {
			if(nul.primitiveTree.is(xpr, 'object', 'an')) return xpr;
		}, 'object'
	),
};

function included(a, b) {
	a.inSet(new nul.xpr.subset([new nul.xpr.intersection([b])], ['*']));
}

included(nul.natives.Z, nul.natives.Q);
included(nul.natives.Q, nul.natives.object);
included(nul.natives.bool, nul.natives.object);
included(nul.natives.str, nul.natives.object);
