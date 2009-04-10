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
			return xpr.xadd('number');
		}
	),
	'true': nul.build.atom(true),
	'false': nul.build.atom(false),
	str: nul.build.nativeSet('str',
		function(xpr) {
			xpr.xadd('string');
			return;
		}
	),
	bool: nul.build.nativeSet('bool',
		function(xpr) {
			xpr.xadd('boolean');
			return;
		}
	),
	set: nul.build.nativeSet('set',
		function(xpr) {
			xpr.xadd('set');
			return;
		}
	),
	object: nul.build.nativeSet('object',
		function(xpr, kb) {
			xpr.xadd('object');
			return;
		}
	),
};