/*  NUL language JavaScript framework
 *  (c) 2009 E-med Ware
 *
 * NUL is freely distributable under the terms of GNU GPLv3 license.
 *  For details, see the NUL project site : http://code.google.com/p/nul/
 *
 *--------------------------------------------------------------------------*/

 nul.xpr = Class.create({
 	/**
 	 * Return a clone where just one item has been changed.
 	 * Only the needed part are cloned, not the whole tree : to allow the change
 	 * @param itm path to the component
 	 * @param vl value to give to the component
 	 */
	modd: function(inm, vl) {
		var rv = clone1(this), brwsr = rv;
		inm = inm.split('.');
		while(1<inm.length) {
			var uinm = inm.unshift();
			brwsr = brwsr[uinm] = clone1(rv[uinm]);
		}
		brwsr[uinm[0]] = vl;
		return rv;
	},
 	/**
 	 * Get the value of a sub-component
 	 * @param itm path to the component
 	 */
 	 getd: function(inm) {
		var rv = clone1(this), brwsr = rv;
		inm = inm.split('.');
		while(1<inm.length) {
			var uinm = inm.unshift();
			brwsr = brwsr[uinm] = clone1(rv[uinm]);
		}
		return brwsr[uinm[0]];
	},
	ndx: function() { throw 'abstract'; },
	components: [],
 });