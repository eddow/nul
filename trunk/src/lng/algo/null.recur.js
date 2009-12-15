/*  NUL language JavaScript framework
 *  (c) 2009 E-med Ware
 *
 * NUL is freely distributable under the terms of GNU GPLv3 license.
 *  For details, see the NUL project site : http://code.google.com/p/nul/
 *
 *--------------------------------------------------------------------------*/
//#requires: src/lng/xpr/null.expression

nul.expression.include(/** @lends nul.expression# */{
	/**
	 * Retrieve this expression value after programmer' algorythm (recursive) is executed.
	 * @returns {nul.expression}
	 */
	recur: function() { return this; }
});

nul.obj.pair.include(/** @lends nul.obj.pair# */{
	/**
	 * Retrieve this expression value after programmer' algorythm (recursive) is executed : applied to each elements of the set.
	 * @returns {nul.obj.pair}
	 */
	recur: function() {
		return new nul.obj.pair(this.first.recur(), this.second.recur());
	}
});

nul.xpr.possible.include(/** @lends nul.xpr.possible# */{
	/**
	 * Retrieve this expression value after programmer' algorythm (recursive) is executed. If self-reference as belonging, expand them 
	 * @returns {nul.xpr.possible}
	 */
	recur: function() {
		var klg = this.knowledge;
		for(var c=0; c<klg.eqCls.length; ++c) if(klg.eqCls[c].belongs[0].selfRef) {
			//TODO R
		}
		return this;
	}
});
