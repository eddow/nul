/*  NUL language JavaScript framework
 *  (c) 2009 François Marie De Mey
 *
 * NUL is freely distributable under the terms of GNU GPLv3 license.
 *  For details, see the NUL project site : http://code.google.com/p/nul/
 *
 *--------------------------------------------------------------------------*/
 
nul.natives = {
	Q: nul.build.nativeSet('&#x211a;',
		function(xpr) {
			if('number'== typeof xpr.value) return xpr;
			if(xpr.fixed()) nul.fail('Not a number : '+xpr.dbgHTML());
			return;
		}
	),
	Z: nul.build.nativeSet('&#x2124;',
		function(xpr) {
			xpr = nul.natives.Q.callback(xpr);
			if(xpr && Math.floor(xpr.value)!= xpr.value) nul.fail('Not an integer : '+xpr.dbgHTML());
			return xpr;
		}
	),
	N: nul.build.nativeSet('&#x2115;',
		function(xpr) {
			xpr = nul.natives.Z.callback(xpr);
			if(xpr && 0> xpr.value) nul.fail('Not a positive integer : '+xpr.dbgHTML());
			return xpr;
		}
	),
	'true': nul.build.atom(true),
	'false': nul.build.atom(false),
	str: nul.build.nativeSet('str',
		function(xpr) {
			if('string'== typeof xpr.value) return xpr;
			if(xpr.fixed()) nul.fail('Not a string : '+xpr.dbgHTML());
			return;
		}
	),
};