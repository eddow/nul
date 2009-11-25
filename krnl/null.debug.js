/*  NUL language JavaScript framework
 *  (c) 2009 E-med Ware
 *
 * NUL is freely distributable under the terms of GNU GPLv3 license.
 *  For details, see the NUL project site : http://code.google.com/p/nul/
 *
 *--------------------------------------------------------------------------*/
 
//TODO D

tableStack = new JS.Class({
	initialize: function(nm, tbl) {
		this.nm = nm;
		if(tbl) this.table = $j(tbl);
	},
	buffer: $j('<tbody></tbody>'),
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
	length: function() {
		return this.buffer.nbrRows();
	},
	clear: function() {
		this.dirty = true;
		this.buffer.clearRows();
		if(this.table) this.table.clearRows();
		this.apply();		
	},
	draw: function(cs) {
		this.dirty = true;
		this.clearRows();
		for(var i=0; i<cs.length; ++i) this.push(cs[i]);
		this.apply();
	},
	push: function(v) {
		this.dirty = true;
		return this.setRowValue(this.buffer[0].insertRow(0), beArrg(arguments));
	},
	log: function(v) {
		this.dirty = true;
		return this.setRowValue(this.buffer[0].insertRow(-1), beArrg(arguments));
	},
	unlog: function() {
		this.dirty = true;
		var p = this.buffer[0].nbrRows()-1;
		var rv = this.getRowValue(this.buffer[0].rows[p]);
		this.buffer[0].deleteRow(p);
		return rv;
	},
	pop: function() {
		this.dirty = true;
		var rv = this.getRowValue(this.buffer[0].rows[0]);
		this.buffer[0].deleteRow(0);
		return rv;
	},
	item: function(ndx) {
		if(!ndx) ndx = 0;
		return {
			ts: this,
			tr: this.buffer[0].rows[ndx],
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
			this.table.completeRowsFrom(this.buffer);
		}
	}
});

/**
 * @namespace Debugging tools
 */
nul.debug = {
	fails: [],
	logs: new tableStack('logs'),
	logging: false,
	possibleLogging: [
		'Resolution',
		'Unification',
		'Equivalence',
		'Wrapping',
		'Represent',
		'Prune',
		'Recursion',
		'Extraction',
		'Query',
		'Relativise'],
	watches: false,
	assert: urlOption('debug'),
	perf: !urlOption('noperf'),
	acts: urlOption('actLog'),
	lcLimit: urlOption('break'),
	logCount: function() {
		if(0< nul.debug.lcLimit && nul.debug.lcNextLimit< nul.debug.lc) {
			nul.debug.warnRecursion();
			nul.debug.lcNextLimit += nul.debug.lcLimit;
		}
		return nul.debug.lc++;
	},
	toLogText: function(v) {
		if($j.isArray(v)) {
			var rv = [];
			for(var i=0; i<v.length; ++i) rv.push(nul.debug.toLogText(v[i]));
			return rv.join(' ');
		}
		if(v.dbgHtml) return v.dbgHtml();
		return v.toFlat?v.toFlat():v.toString();
	},
	log: function(tp, endC) {
		return tp && nul.debug.logging && nul.debug.logging[tp] ? function(v) {
			v = beArrg(arguments);
			for(var vi = 0; vi<v.length; ++vi) v[vi] = nul.debug.toLogText(v[vi]);
			v.unshift(nul.debug.logCount());
			var lg = nul.debug.logs.log(v);
			for(var i=0; i<nul.debug.lcs.toPair.length; ++i) lg.className = 'collapsed '+lg.className;
			if(endC) lg.addClassName('uncollapsing');
			return lg.addClassName(tp+' log');
		} : nul.debug.logCount;
	},
	warnRecursion: function(v)
	{
		if(nul.erroneus) return;
		if(v) nul.debug.watch(v);
		nul.debug.applyTables();
		if(!confirm('Keep on recursion?')) throw nul.internalException('Broken by debugger');
	},
	begin: function(nlcl) {
		nul.debug.lc = 0;
		if('undefined'!= typeof nlcl) nul.debug.lcLimit = nlcl;
		if(true===nul.debug.lcLimit) nul.debug.lcLimit = 500;
		nul.debug.lcNextLimit = nul.debug.lcLimit;
	},
	
	newLog: function(logTbl) {
		if(logTbl) this.logs.table = logTbl;
		nul.debug.logs.clear();
		nul.debug.lcs = nul.txt.clpsSstm(this.logs.table, 'dn',
			function() { return nul.debug.logs.buffer.nbrRows(); });
		nul.debug.begin();
	},
	
	applyTables: function() {
		if(nul.debug.logging) nul.debug.logs.apply();
		if(nul.debug.globalKlg) nul.debug.globalKlg.innerHTML = nul.execution.globalKlg.toHtml();
	},
	ctxTable: function(ctx) {
		var rv = '';
		for(var i=0; i<ctx.length; ++i)
			rv += '<tr><th>'+i+'</th><td>'+ctx.lvals[i].dbgHtml()+'</td></tr>';
		return ['', '<table class="context">'+rv+'</table>'];
	},
	described: function(name, dscr) {
		var ftc = this.perform(name);
		return function() {
			var cargs = $A(arguments);
			var d, abrt = false, lgd = false, rv;
			try {
				d = dscr.apply(this, cargs);
				nul.debug.log(name)(nul.debug.lcs.collapser('Begin'), name, d);
				lgd = true;
				rv = ftc.apply(this, cargs);
				return rv;
			} catch(err) { abrt = true; nul.exception.notice(err); throw err;
			} finally {
				if(lgd) nul.debug.log(name,'end')(
					nul.debug.lcs.endCollapser(
						(abrt?'Abort':'End'),
						(abrt?'Failed':'Done')),
					name,
					rv?[rv]:['nothing'], d);
			}
		};
	},
	asserted: function(str, obj) {
		var ok = true;
		if(nul.debug.assert) ok = this.apply(obj);
		assert(ok, str);
	},
	contract: function(str) {
		if(!nul.debug.assert) return function() {};
		var ftc = this;
		return function() {
			assert(ftc.apply(this), str);
		};
	},
	
	/**
	 * Assert this object implements a class
	 * @param {Class} cls The expected class
	 * @param {String} nm [optional] The description of what is expected
	 * @param {function(obj) {Boolean}} cb [optional] Cqll bqck to try on the tested objects
	 * @return nothing
	 * @throws {assertException}
	 */
	is: function(cls, nm, cb) {
		if('string' == typeof cls) {
			nm = cls;
			cls = eval(nm);
		}
		cb = cb || nm;
		if('function' != typeof cb) cb = null;
		return function(obj) {
			if(nul.debug.assert) assert(
					obj && 
					obj.isA(cls) &&
					(!cb || cb(obj)),
				'Expected '+(nm||'a specific object'));
			return obj;
		}; 
	},
	/**
	 * Assert these objects has a member (use a member which name defines the class)
	 * @param {Class} cls The expected class
	 * @param {String} nm [optional] The description of what is expected
	 * @param {function(obj) {Boolean}} cb [optional] Cqll bqck to try on the tested objects
	 * @return nothing
	 * @throws {assertException}
	 */
	are: function(cls, nm, cb) {
		if('string'== typeof cls) {
			nm = cls;
			cls = eval(nm);
		}
		cb = cb || nm;
		if(!'function'== typeof cb) cb = null;
		return function(objs) {
			if(nul.debug.assert) map(objs, function(i, obj) { assert(
					obj && 
					cls.is(obj) &&
					(!cb || cb(obj)),
					'Expected '+ (nm||'specific object') + 's'); });
		}; 
	},
	
	/**
	 * Draw a failure info
	 */
	fail: function(reason) {
		reason = beArrg(arguments);
		if(nul.debug.fails.length) nul.debug.fails[0].push(reason, '|');
		else nul.debug.log('fail')('', 'Failure', reason);
	},
	/**
	 * Make a bunch of tries. If none succed, report a failure
	 */
	trys: function(cb, name, obj, args) {
		nul.debug.fails.unshift([]);
		nul.debug.log(name)(nul.debug.lcs.collapser('Begin'), name, args);
		try {
			var rv = cb.apply(obj);
			nul.debug.log(name, 'end')(nul.debug.lcs.endCollapser('End','Done'), name, rv || 'nothing', args);
			nul.debug.fails.shift();
			return rv;
		} catch(err) {
			nul.failed(err);
			if(nul.debug.assert) assert(nul.debug.fails.length && nul.debug.fails[0].length,'Finally failed if failed once');
			nul.debug.fails[0].pop();	//Remove the last '|' TODO O: ?
			var le = nul.debug.log(name);
			if(le) le(nul.debug.lcs.endCollapser('Abort', 'Failed'), name, nul.debug.fails[0]);
			else nul.debug.log('fail', 'end')('', 'Failure', nul.debug.fails[0]);
			nul.debug.fails.shift();
			nul.fail(name, args);
		}
	}
};

if(nul.debug.acts) Function.prototype.describe = nul.debug.described;
else Function.prototype.describe = function(name) { return this.perform(name); };

Function.prototype.contract = nul.debug.contract;
if(nul.debug.assert) Function.prototype.asserted = nul.debug.asserted;
else Function.prototype.asserted = function() {};

function assert(cnd, str) {
	//if(console) console.assert(cnd, str); /*try { console.assert(cnd, str); } catch(err) { throw nul.internalException('Assertion failed : '+str); }*/ else
	if(!cnd)
		throw nul.internalException('Assertion failed : '+str);
}

//Shortcuts to write in the firebug 'watch' box
function dat() { nul.debug.applyTables(); return 'drawn'; }
