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
			return xpr.xadd('number');
		}
	),
	Z: new nul.xpr.javascript.set('&#x2124;',
		function(xpr) {
	        xpr.xadd('number');
	        if('value'== xpr.charact) {
	        	if(Math.floor(xpr.value)!= xpr.value) nul.fail('Not an integer : '+xpr.dbgHTML());
            	return xpr;
	        }
	    }
	),
	'true': new nul.xpr.atom(true),
	'false': new nul.xpr.atom(false),
	str: new nul.xpr.javascript.set('str',
		function(xpr) {
			xpr.xadd('string');
			return;
		}
	),
	bool: new nul.xpr.javascript.set('bool',
		function(xpr) {
			xpr.xadd('boolean');
			return;
		}
	),
	set: new nul.xpr.javascript.set('set',
		function(xpr) {
			xpr.xadd('set');
			return;
		}
	),
	object: new nul.xpr.javascript.set('object',
		function(xpr, kb) {
			xpr.xadd('object');
			return;
		}
	),
};