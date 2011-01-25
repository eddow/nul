/*  NUL language JavaScript framework
 *  (c) 2009 E-med Ware
 *
 * NUL is freely distributable under the terms of GNU GPLv3 license.
 *  For details, see the NUL project site : http://code.google.com/p/nul/
 *
 *--------------------------------------------------------------------------*/
/*#requires:
 * src/lng/xpr/null.expression
 * src/lng/xpr/obj/defined/null.obj.pair
 * src/lng/xpr/klg/null.xpr.possible
 */

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
		/*
		 * Algorythme crétin :
		 * Pour le premier eqCls, on remplace la self-ref par le stéréotype de cet eqCls, on recrée le possible
		 * et on le re-recur
		 */
		for(var c=0; c<klg.eqCls.length; ++c) if(klg.eqCls[c].belongs[0].selfRef) {
			//TODO R
		}
		return this;
	}
});
