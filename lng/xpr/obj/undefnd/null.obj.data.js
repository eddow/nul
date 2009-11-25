/*  NUL language JavaScript framework
 *  (c) 2009 E-med Ware
 *
 * NUL is freely distributable under the terms of GNU GPLv3 license.
 *  For details, see the NUL project site : http://code.google.com/p/nul/
 *
 *--------------------------------------------------------------------------*/

nul.obj.data = new JS.Class(nul.obj.undefnd, /** @lends nul.obj.data# */{
	/**
	 * @extends nul.obj.undefnd
	 * @constructs
	 * Refers to a data-source from nul.data...
	 */
	initialize: function(ds) {
		this.source = ds;
		this.alreadyBuilt();
		return this.callSuper(null);
	},

//////////////// nul.expression implementation

	/** <a href="http://code.google.com/p/nul/wiki/Summary">Summary</a> computation of {@link dependance} */
	sum_dependance: function() {
		return new nul.dependance(this);
	},

	/** @constant */
	expression: 'data',
	/** <a href="http://code.google.com/p/nul/wiki/Summary">Summary</a> computation of {@link index} */
	sum_index: function() { return this.indexedSub(this.source.context, this.source.index); }
});
