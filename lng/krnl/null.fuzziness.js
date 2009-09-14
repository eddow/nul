/*  NUL language JavaScript framework
 *  (c) 2009 E-med Ware
 *
 * NUL is freely distributable under the terms of GNU GPLv3 license.
 *  For details, see the NUL project site : http://code.google.com/p/nul/
 *
 *--------------------------------------------------------------------------*/

nul.fuzziness = Class.create({
	initialize: function(name) {
 		this.locals = [];		//dbgNames, could remember just the length (as an int) if no debug info needed
		this.name = name || ++nul.fuzziness.ndx;
	},

 	newLocal: function(name, ndx) {
 		if('undefined'== typeof ndx) {
 			ndx = this.locals.length;
 			this.locals.push(name);
 		}
 		return new nul.obj.local(this.name, ndx, name)
 	},

});