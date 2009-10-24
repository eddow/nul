/*  NUL language JavaScript framework
 *  (c) 2009 E-med Ware
 *
 * NUL is freely distributable under the terms of GNU GPLv3 license.
 *  For details, see the NUL project site : http://code.google.com/p/nul/
 *
 *--------------------------------------------------------------------------*/
 
/**
 * @class
 */
nul.txt = {
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
	dispatchPair: function(xpr, obj) {
		var lstd = xpr.listed();
		if(xpr.isList()) {
			if(1== lstd.length && !lstd.follow)
				return this.draw.singleton.apply(obj, []);
			return this.draw.list.apply(obj, [lstd]);
		} 
		return this.draw.set.apply(obj, [lstd]);
	},
	beginDraw: function(xpr) {
		if(this.drawing.contains(xpr)) return false;
		this.drawing.push(xpr);
		return true;
	},
	endDraw: function(xpr) {
		if(nul.debug.assert) assert(xpr==this.drawing.pop(), 'Drawing consistency');
		else this.drawing.pop();
	},
	clpsSstm : function(table, uc, lcFct) {
		if(table) return table.clpsSstm = { 
			table: table,
			uc: uc,
			collapsing: {},
			toPair: [],
			lineCount: lcFct || function() { return this.table.rows.length-('up'==this.uc?0:1); },
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
				}
			},
			endCollapser: function(opnd, clsd) {
				if('undefined'== typeof clsd) clsd = opnd;
				return {
					toPair: this.toPair,
					lineCount: this.lineCount(),
					collapsing: this.collapsing,
					toString: function() {
						var plc = this.toPair.pop();
						if(nul.debug.assert) assert('undefined'== typeof this.collapsing[plc], 'Debug collapsers correspondance')
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
			//'collapsed' class name is added once for each collapsement : this is not a bug if it appears
			// several time on an item
			collapse: function(lc) {
				assert(this.collapsing[lc] && 'topair'!= this.collapsing[lc], 'Collapsing pairs coherence.');
				for(var r=lc; r<this.collapsing[lc]; ++r)
					$(this.table.rows[r]).className = 'collapsed ' + $(this.table.rows[r]).className;
				this.table.rows[r].addClassName('uncollapsing');
				if('up'==this.uc && 0<lc) this.table.rows[lc-1].addClassName('unsubcollapsing');
			},
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
	//'collapsed' class name is added once for each collapsement : this is not a bug if it appears
	// several time on an item
	collapse: function(tbl, lc) {
		while(tbl && !tbl.clpsSstm) tbl = tbl.parentNode;
		assert(tbl,'No orphan collapsers');
		return tbl.clpsSstm.collapse(lc);
	},
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
};
