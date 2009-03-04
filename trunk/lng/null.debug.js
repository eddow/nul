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
	levels: true,
	assert: true,
	logging: false,
	watches: false,
	perf: 0> window.location.href.indexOf('noperf'),
	xTest: 0> window.location.href.indexOf('noxtest'),
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
	toLogText: function(v) {
		if(isArray(v)) {
			for(var i=0; i<v.length; ++i) v[i] = nul.debug.toLogText(v[i]);
			return v.join(' ');
		}
		if(v.dbgHTML) return v.dbgHTML();
		return v.toString()
	},
	log: function(tp) {
		return nul.debug.logging && nul.debug.logging[tp] ? function(v) {
			v = beArrg(arguments);
			for(var vi = 0; vi<v.length; ++vi) v[vi] = nul.debug.toLogText(v[vi]);
			v.unshift(nul.debug.action());
			if(nul.debug.watches) v.push(nul.debug.kbase.length());
			else v.push();
			v.unshift(nul.debug.logCount());
			return nul.debug.logs.log(v).addClassName(tp+' log');
		} : function() {};
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
	ctxTable: function(ctx) {
		var rv = '';
		var prc = ctx.origHTML;
		for(var i=0; i<ctx.length; ++i)
			rv += '<tr><th>'+i+'</th><td>'+ctx.lvals[i].dbgHTML()+'</td></tr>';
		return [prc, '<table class="context">'+rv+'</table>'];
	}
};

if(nul.debug.xTest)
	Function.prototype.xKeep = function() {
		var ftc = this;
		return function() {
			var args = arrg(arguments);
			var oldX = (this&&this.x)?this.x.dbg:
				(args[0]&&args[0].x)?args[0].x.dbg:
				null;
			var rv = ftc.apply(this,args);
			assert(!rv || !oldX || rv.x.dbg==oldX, 'X miss-kept');
			return rv;
		}
	};
else Function.prototype.xKeep = function() { return this; };
	
function assert(cnd, str) {
	if(!cnd)
		throw nul.internalException('Assertion failed : '+str);
}

//Shortcuts to write in the firebug 'watch' box
function nw(v) { nul.debug.watch(v); }
function dat() { nul.debug.applyTables(); }
