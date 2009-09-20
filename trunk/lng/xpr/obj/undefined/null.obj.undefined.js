/*  NUL language JavaScript framework
 *  (c) 2009 E-med Ware
 *
 * NUL is freely distributable under the terms of GNU GPLv3 license.
 *  For details, see the NUL project site : http://code.google.com/p/nul/
 *
 *--------------------------------------------------------------------------*/

nul.obj.undefined = Class.create(nul.xpr.object, {
	summarise: function($super, smr) {
		var ownSmr = { isDefined: false };
		$super(smr?merge(ownSmr,smr):ownSmr);
	},
	
});