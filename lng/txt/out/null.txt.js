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
	 * Create a collapse system out of an HTML table.
	 * @param {HTMLTable} table The table element that will collapse rows.
	 * @param {'up' | 'dn'} uc Determine which collapser row (the beginner-up or the ender-dn) is kept visible when the rows are collapsed
	 * @param {function() {Number}} lcFct The function giving the index of the row (the table row number is used if no fct is specified)
	 * @return {nul.clpsSstm} 
	 */
	clpsSstm : function(table, uc, lcFct) {
		/**
		 * @class
		 * @name nul.clpsSstm
		 */
		if(table) return table.clpsSstm = /** @lends nul.clpsSstm# */{ 
			/**
			 * The element table this collapser applies to
			 * @type HTMLTable
			 */
			table: table,
			/**
			 * Determine which collapser row (the beginner-up or the ender-dn) is kept visible when the rows are collapsed
			 * @type {'up' | 'dn'}
			 */
			uc: uc,
			/**
			 * Remember the collapser-end row number for each collapser-begin row number
			 * @type {Number : Number}
			 */
			collapsing: {},
			/**
			 * List of collapser row numbers that have been opened (toPair[0] is the first opened collapser row number)
			 * @type Number[]
			 */
			toPair: [],
			/**
			 * Determine which is the row count of this table (for when the row counting is not the effective one - like in logging where the logCount is used instead) 
			 * @function
			 * @return {Number}
			 */
			lineCount: lcFct || function() { return this.table.rows.length-('up'==this.uc?0:1); },
			/**
			 * Create a HTML collapser start that draw a given information
			 * @param {HTML} html The collapser text
			 * @return {HTML}
			 */
			collapser: function(html) {
				return {
					toPair: this.toPair,
					lineCount: this.lineCount(),
					toString: function() {
						this.toPair.push(this.lineCount);
						return ''+
							'<span class="collapser start"><a class="collapser" ' +
							'onclick="nul.txt.collapse(this, '+this.lineCount+');">&darr;</a></span>'+
							'<span class="uncollapser start"><a class="collapser" ' +
							'onclick="nul.txt.uncollapse(this, '+this.lineCount+');">+</a></span>'+
							html;
					}
				};
			},
			/**
			 * Create a HTML collapser end that draw a given information
			 * @param {HTML} opnd The collapser text when the collapser is opened
			 * @param {HTML} clsd The collapser text when the collapser is collapsed
			 * @return {HTML}
			 */
			endCollapser: function(opnd, clsd) {
				if('undefined'== typeof clsd) clsd = opnd;
				return {
					toPair: this.toPair,
					lineCount: this.lineCount(),
					collapsing: this.collapsing,
					toString: function() {
						var plc = this.toPair.pop();
						if(nul.debug.assert) assert('undefined'== typeof this.collapsing[plc], 'Debug collapsers correspondance');
						this.collapsing[plc] = this.lineCount;
						return '<span class="collapser end">' +
							'<a class="collapser" ' +
							'onclick="nul.txt.collapse(this, '+plc+');">&uarr;</a>' + opnd +
							'</span><span class="uncollapser end">' +
							'<a class="collapser" ' +
							'onclick="nul.txt.uncollapse(this, '+plc+');">+</a>' + clsd +
							'</span>';
					}
				};
			},
			/**
			 * Collapse an item of the collapsers table. Answers to a click on the 'collapse' command.
			 * @param {Number} lc The table item to collapse (its collapser begin or its collapser end index)
			 * @event
			 */
			collapse: function(lc) {
				assert(this.collapsing[lc] && 'topair'!= this.collapsing[lc], 'Collapsing pairs coherence.');
				for(var r=lc; r<this.collapsing[lc]; ++r)
					$(this.table.rows[r]).className = 'collapsed ' + $(this.table.rows[r]).className;
				this.table.rows[r].addClassName('uncollapsing');
				if('up'==this.uc && 0<lc) this.table.rows[lc-1].addClassName('unsubcollapsing');
			},
			/**
			 * Uncollapse an item of the collapsers table. Answers to a click on the 'uncollapse' command.
			 * @param {Number} lc The table item to collapse (its collapser begin or its collapser end index)
			 * @event
			 */
			uncollapse: function(lc) {
				assert(this.collapsing[lc] && 'topair'!= this.collapsing[lc], 'Collapsing pairs coherence.');
				for(var r=lc; r<this.collapsing[lc]; ++r)
					$(this.table.rows[r]).className = $(this.table.rows[r]).className.substr('collapsed '.length);
				this.table.rows[r].removeClassName('uncollapsing');
				if('up'==this.uc && 0<lc) this.table.rows[lc-1].removeClassName('unsubcollapsing');
			}			
		};
		return {
			collapser: function(html) {},
			endCollapser: function(opnd, clsd) {}
		};
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
