/*  NUL language JavaScript framework
 *  (c) 2009 François Marie De Mey
 *
 * NUL is freely distributable under the terms of GNU GPLv3 license.
 *  For details, see the NUL project site : http://code.google.com/p/nul/
 *
 *--------------------------------------------------------------------------*/
 
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
	perf: -1>= window.location.href.indexOf('noperf'),
	lcLimit: 0,
	action: function() {
		if(0>= nul.debug.callStack.length()) return 'Begining';
		return nul.debug.callStack.item().get()[0];
	},
	logCount: function() {
		if(0< nul.debug.lcLimit && nul.debug.lcNextLimit< nul.debug.lc) {
			nul.debug.warnRecursion();
			nul.debug.lcNextLimit += nul.debug.lcLimit;
		}
		return nul.debug.lc++;
	},
	log: function(tp) {
		return nul.debug.logging ? function(v) {
			v = beArrg(arguments);
			v.unshift(nul.debug.action());
			if(nul.debug.watches) v.push(nul.debug.kbase.length());
			else v.push();
			v.unshift(nul.debug.logCount());
			return nul.debug.logs.log(v).addClassName(tp);
		} : function() { nul.debug.logCount(); };
	},
	warnRecursion: function(v)
	{
		if(nul.erroneus) return;
		if(v) nul.debug.watch(v);
		nul.debug.applyTables();
		if(!confirm('Keep on recursion?')) throw nul.internalException('Broken by debugger');
	},
	watch: function(v)
	{
		rcr.innerHTML = v.toHTML();
	},
	makeCall: function(ftc, dscr, obj, cargs) {
		var d;
		try {
			if(nul.debug.actionLog || nul.debug.watches)
				d = dscr.apply(obj, cargs);
			if(nul.debug.actionLog) {
				nul.debug.log('actionLog')('Begin',d);
				if(nul.debug.logging) ll = nul.debug.logs.length();
			}
			if(nul.debug.watches) nul.debug.callStack.push(d);
			return ftc.apply(obj, cargs);
		} catch(err) { throw nul.exception.notice(err);
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
		nul.debug.lcs = nul.text.clpsSstm(this.logs.table, 'dn', function() { return nul.debug.lc; });
		nul.debug.lcNextLimit = nul.debug.lcLimit;
	},
	
	applyTables: function() {
		if(nul.debug.logging) {
			nul.debug.logs.apply();
			nul.debug.kevol.apply();
		}
		if(nul.debug.watches) {
			nul.debug.callStack.apply();
			nul.debug.kbase.apply();
		}
	},
	ctxTable: function(ctx, insd) {
		var rv = '';
		var prc = insd.origHTML[0];
		for(var i=0; i<ctx.length; ++i) if(ctx[i])
			rv += '<tr><th>'+i+'</th><td>'+ctx[i].dbgHTML()+'</td></tr>';
		return [prc, '<table class="context">'+rv+'</table>'];
	}
};

if(-1>= window.location.href.indexOf('noperf'))
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
