function tableStack(nm, tbl) {
	return {
		nm: nm,
		table: tbl,
		buffer: document.createElement('tbody'),
		getRowValue: function(tr) {
			var rv = [];
			for(var i=0; i<tr.cells.length; ++i) rv.push(tr.cells[i].innerHTML);
			return rv;
		},
		setRowValue: function(tr, rv) {
			this.dirty = true;
			tr.innerHTML = '';
			for(var i=0; i<rv.length; ++i ) {
				var cl = tr.insertCell(-1);
				cl.setAttribute('class',this.nm + ' c' + i);
				cl.innerHTML = rv[i];
			}
			return $(tr);
		},
		value: function() {
			var rv = [];
			for(var i=this.buffer.rows.length-1; i>=0; --i)
				rv.push(this.getRowValue(this.buffer.rows[i]));
			return rv;
		},
		length: function() {
			return this.buffer.rows.length;
		},
		clear: function() {
			this.dirty = true;
			while(0< this.buffer.rows.length) this.pop();
			this.apply();		
		},
		draw: function(cs) {
			this.dirty = true;
			this.clear();
			for(var i=0; i<cs.length; ++i) this.push(cs[i]);
			this.apply();
		},
		push: function(v) {
			this.dirty = true;
			return this.setRowValue(this.buffer.insertRow(0), beArrg(arguments))
		},
		log: function(v) {
			this.dirty = true;
			return this.setRowValue(this.buffer.insertRow(-1), beArrg(arguments))
		},
		unlog: function() {
			this.dirty = true;
			var p = this.buffer.rows.length-1;
			var rv = this.getRowValue(this.buffer.rows[p]);
			this.buffer.deleteRow(p);
			return rv;
		},
		pop: function() {
			this.dirty = true;
			var rv = this.getRowValue(this.buffer.rows[0]);
			this.buffer.deleteRow(0);
			return rv;
		},
		item: function(ndx) {
			if(!ndx) ndx = 0;
			return {
				ts: this,
				tr: this.buffer.rows[ndx],
				set: function(rv) {
					this.ts.dirty = true;
					this.ts.setRowValue(this.tr, beArrg(arguments));
				},
				get: function() {
					return this.ts.getRowValue(this.tr);
				}
			};
		},
		apply: function() {
			if(this.dirty && this.table) {
				this.dirty = false;
				this.table.innerHTML = this.buffer.innerHTML;
			}
		}
	};
}
nul.debug = {
	callStack: tableStack('callStack'),
	kbase: tableStack('kb'),
	kevol: tableStack('ke'),
	logs: tableStack('logs'),
	jsDebug: false,
	actionLog: false,
	levels: true,
	assert: true,
	logging: false,
	watches: false,
	action: function() {
		if(0>= nul.debug.callStack.length()) return 'Begining';
		return nul.debug.callStack.item().get()[0];
	},
	log: function(tp) {
		return nul.debug.logging ? function(v) {
			v = beArrg(arguments);
			v.unshift(nul.debug.action());
			if(nul.debug.watches) v.push(nul.debug.kbase.length());
			else v.push();
			v.unshift(nul.debug.lc++);
			return nul.debug.logs.log(v).addClassName(tp);
		} : function(v) { ++nul.debug.lc; };
	},
	warnRecursion: function(v)
	{
		nul.debug.watch(v);
		if(!confirm('Keep on recursion?')) nul.fail('Broken by debugger');
	},
	watch: function(v)
	{
		rcr.innerHTML = v.toHTML();
	},
	makeCall: function(ftc, dscr, obj, cargs) {
		var d;
		try {
			d = dscr.apply(obj, cargs);
			if(nul.debug.actionLog) {
				nul.debug.log('actionLog')('Begin',d);
				if(nul.debug.logging) ll = nul.debug.logs.length();
			}
			if(nul.debug.watches) nul.debug.callStack.push(d);
			return ftc.apply(obj, cargs);
		} catch(err) { nul.exception.notice(err); throw err;
		} finally {
			if(!nul.erroneus) {
				if(nul.debug.watches) nul.debug.callStack.pop();
				if(nul.debug.actionLog) {
					if(nul.debug.logging) {
						var kw='Done';
						if(ll == nul.debug.logs.length()) nul.debug.logs.unlog();
						else kw='End';
					}
					nul.debug.log('actionLog')(kw,d);
				}
			}
		}
	},
	reset: function() {
		nul.debug.logs.clear();
		nul.debug.callStack.clear();
		nul.debug.kbase.clear();
		nul.debug.kevol.clear();
		nul.debug.lc = 0;
		nul.debug.collapsing = {};
		nul.debug.toPair = [];
	},
	collapser: function(html) {
		nul.debug.toPair.push(this.lc);
		return '<a class="collapser" ' +
			'onclick="nul.debug.collapse(this, '+this.lc+');">&darr;</a>'+html;
	},
	endCollapser: function(opnd, clsd) {
		var plc = nul.debug.toPair.pop();
		this.collapsing[plc] = this.lc;
		return '<span class="collapser">' +
			'<a class="collapser" ' +
			'onclick="nul.debug.collapse(this, '+plc+');">&uarr;</a>' + opnd +
			'</span><span class="uncollapser">' +
			'<a class="collapser" ' +
			'onclick="nul.debug.uncollapse(this, '+plc+');">+</a>' + clsd +
			'</span>';
	},
	//'collapsed' class name is added once for each collapsement : this is not a bug if it appears
	// several time on an item
	collapse: function(tbl, lc) {
		while('table'!= tbl.tagName.toLowerCase()) tbl = tbl.parentNode;
		assert(this.collapsing[lc] && 'topair'!= this.collapsing[lc], 'Collapsing pairs coherence.');
		var r;
		for(r=lc; r<this.collapsing[lc]; ++r)
			$(tbl.rows[r]).className = 'collapsed ' + $(tbl.rows[r]).className;
		tbl.rows[r].addClassName('uncollapsing')
	},
	uncollapse: function(tbl, lc) {
		while('table'!= tbl.tagName.toLowerCase()) tbl = tbl.parentNode;
		assert(this.collapsing[lc] && 'topair'!= this.collapsing[lc], 'Collapsing pairs coherence.');
		var r;
		for(r=lc; r<this.collapsing[lc]; ++r)
			$(tbl.rows[r]).className = $(tbl.rows[r]).className.substr('collapsed '.length);
		tbl.rows[r].removeClassName('uncollapsing')
	},
	applyTables: function() {
		if(nul.debug.logging) nul.debug.logs.apply();
		if(nul.debug.watches) {
			nul.debug.callStack.apply();
			nul.debug.kbase.apply();
			nul.debug.kevol.apply();
		}
	},
	ctxTable: function(ctx) {
		var rv = '';
		var prc = ctx['+entrHTML']();
		for(var i=0; i<ctx.length; ++i) if(ctx[i])
			rv += '<tr><th>'+i+'</th><td>'+ctx[i].toHTML()+'</td></tr>';
		return [prc, '<table class="context">'+rv+'</table>'];
	}
};

Function.prototype.describe = function(dscr) {
	var ftc = this;
	return function() {
		var cargs = arrg(arguments);
		var obj = this;
		return nul.debug.makeCall(ftc, dscr, obj, cargs);
	};
};

function assert(cnd, str) {
	if(!cnd)
		throw nul.internalException('Assertion failed : '+str);
}

//Shortcuts to write in the firebug 'watch' box
function nw(v) {
	nul.debug.watch(v);
}
function dat() {
	nul.debug.applyTables();
}