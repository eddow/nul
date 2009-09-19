/*  NUL language JavaScript framework
 *  (c) 2009 E-med Ware
 *
 * NUL is freely distributable under the terms of GNU GPLv3 license.
 *  For details, see the NUL project site : http://code.google.com/p/nul/
 *
 *--------------------------------------------------------------------------*/

nul.fuzziness = Class.create({
	initialize: function(name) {
 		if(nul.debug) this.locals = [];
 		else this.locals = 0;
		this.name = name || ++nul.fuzziness.nameSpace;
	},
	
	concat: function(fzns) {
 		if(nul.debug) this.locals.pushs(fzns.locals);
 		else this.locals += fzns.locals;
	},
	dbgName: function(ndx) {
		if(nul.debug) return this.locals[ndx];
	},

 	newLocal: function(name, ndx) {
 		if('undefined'== typeof ndx) {
 			ndx = this.locals.length;
 			this.locals.push(name);
 		}
 		return new nul.obj.local(this, ndx)
 	},

});