/*  NUL language JavaScript framework
 *  (c) 2009 François Marie De Mey
 *
 * NUL is freely distributable under the terms of GNU GPLv3 license.
 *  For details, see the NUL project site : http://code.google.com/p/nul/
 *
 *--------------------------------------------------------------------------*/
 
nul.natives = {
	Q: nul.build().nativeFunction('&#x211a;',
		function(xpr) {
			if('number'== typeof xpr.value) return xpr;
			if(xpr.fixed()) nul.fail('Not a number');
			return;
		},
		this.Q
	),
	Z: nul.build().nativeFunction('&#x2124;',
		function(xpr) {
			xpr = nul.natives.Q.callback(xpr);
			if(xpr && Math.floor(xpr.value)!= xpr.value) nul.fail('Not an integer');
			return xpr;
		},
		this.Z
	),
	N: nul.build().nativeFunction('&#x2115;',
		function(xpr) {
			xpr = nul.natives.Z.callback(xpr);
			if(xpr && 0> xpr.value) nul.fail('Not a positive integer');
			return xpr;
		},
		this.N
	),
	'true': nul.build().atom(true),
	'false': nul.build().atom(false),
	str: nul.build().nativeFunction('str',
		function(xpr) {
			if('string'== typeof xpr.value) return xpr;
			if(xpr.fixed()) nul.fail('Not a string');
			return;
		},
		this.str
	),
};