/*  NUL language JavaScript framework
 *  (c) 2009 E-med Ware
 *
 * NUL is freely distributable under the terms of GNU GPLv3 license.
 *  For details, see the NUL project site : http://code.google.com/p/nul/
 *
 *--------------------------------------------------------------------------*/
 
/**
 * Text output kernel
 * @class Singleton
 */
nul.txt = new JS.Singleton({
	/**
	 * Main function, making a string out of an expression
	 * @param {nul.expression} xpr
	 */
	toText: function(xpr) {
		if(!this.beginDraw(xpr)) return this.recurStr;
		var ctx = this.enterContext(xpr);
		try {
			return this.wrap(
				(this.draw[xpr.expression]||this.draw.other)
					.apply(this.outp(xpr), [this.context]),
				xpr);
		}
		finally {
			this.leaveContext(ctx);
			this.endDraw(xpr);
		}
	},
	/**
	 * Pairs can have several writing depending on their constitution : singleton { 1 }, list (1, 2, 3) or set { 1 [] 2 [] 3 }.
	 * This function call one of the three sub-function.
	 * @param {nul.expression} xpr
	 */
	dispatchPair: function(xpr) {
		var lstd = xpr.listed();
		if(xpr.isList()) {
			if(1== lstd.length && !lstd.follow)
				return this.draw.singleton.apply(xpr, []);
			return this.draw.list.apply(xpr, [lstd]);
		} 
		return this.draw.set.apply(xpr, [lstd]);
	},
	/**
	 * Called when an expression is about to be drawn
	 * @param {nul.expression} xpr
	 */
	beginDraw: function(xpr) {
		if(this.drawing.include(xpr)) return false;
		this.drawing.push(xpr);
		return true;
	},
	/**
	 * Called for each expression that have been drawn
	 * @param {nul.expression} xpr
	 */
	endDraw: function(xpr) {
		if(nul.debug.assert) assert(xpr==this.drawing.pop(), 'Drawing consistency');
		else this.drawing.pop();
	},
	/**
	 * Event managing the 'collapse' command.
	 * @param {HTMLTable} tbl The collapsing table or one of its son
	 * @param {Number} lc The table item to collapse (its collapser begin or its collapser end index)
	 * @event
	 */
	collapse: function(tbl, lc) {
		while(tbl && !tbl.clpsSstm) tbl = tbl.parentNode;
		assert(tbl,'No orphan collapsers');
		return tbl.clpsSstm.collapse(lc);
	},
	/**
	 * Event managing the 'uncollapse' command.
	 * @param {HTMLTable} tbl The collapsing table or one of its son
	 * @param {Number} lc The table item to collapse (its collapser begin or its collapser end index)
	 * @event
	 */
	uncollapse: function(tbl, lc) {
		while(tbl && !tbl.clpsSstm) tbl = tbl.parentNode;
		assert(tbl,'No orphan collapsers');
		return tbl.clpsSstm.uncollapse(lc);
	},
//////////////// Knowledge data retrieval
	context: {},
	enterContext: function(xpr) {
		if(!xpr.knowledge || this.context[xpr.knowledge.name]) return;
		return this.context[xpr.knowledge.name] = xpr.knowledge;
	},
	leaveContext: function(xpr) {
		if(xpr)
			delete this.context[xpr.name];
	}
});
