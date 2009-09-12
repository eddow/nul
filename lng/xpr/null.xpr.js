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
	toHTML: function() { return this.toString(); },
	toString: function() { throw 'abstract'; },
	
	build_components: function() {
		var rv = {};
		for(var comp in this.components) if(cstmNdx(comp)) {
			if(isArray(comp)) {
				for(var ci in this[comp]) if(cstmNdx(ci))
					rv[comp+':'+ci] = this[comp][ci];
			} else {
				rv[comp] = this[comp];
			}
		}
		return rv;
	},
	
	is: function(prm) {
		var rv = this['is_'+prm];
		if('function'== typeof(rv)) rv = rv.apply(this);
		return rv;
	},
	is_list: function() { return this.is('set'); },
	ndx: function() { return this.build_ndx(); },
	//TODO2: generic build
	build_ndx: function() {
		if(nul.debug.assert) assert(this.type, 'NDX builder implemented');
		return '['+this.type+':'+ this.build_components().join('|')+']';
	},
	components: [],
 });