/*  NUL language JavaScript framework
 *  (c) 2009 E-med Ware
 *
 * NUL is freely distributable under the terms of GNU GPLv3 license.
 *  For details, see the NUL project site : http://code.google.com/p/nul/
 *
 *--------------------------------------------------------------------------*/

/**
 * @namespace Debugging tools
 */
nul.debug = {
	fails: [],
	logging: false,
	logDeep: [],
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
		if($.isArray(v)) {
			var rv = [];
			for(var i=0; i<v.length; ++i) rv.push(nul.debug.toLogText(v[i]));
			return rv.join(' ');
		}
		if(v.dbgHtml) return v.dbgHtml();
		return v.toFlat?v.toFlat():v.toString();
	},
	log: function(tp, endC) {
		return tp && nul.debug.logging && nul.debug.logging[tp] ? function(v) {
			//TODO
			var rw = $('<tr></tr>');
			rw.append($('<th></th>').wrap(''+nul.debug.logCount()));
			v = beArrg(arguments);
			for(var vi = 0; vi<v.length; ++vi) rw.append($('<th></th>').wrap(nul.debug.toLogText(v[vi])));
			
			return nul.debug.logTbl.append(rw.addClass(tp+' log'));
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
		if(logTbl) nul.debug.logTbl = logTbl;
		nul.debug.logDeep = [];
		if(nul.debug.logTbl) nul.debug.logTbl.empty();
		nul.debug.begin();
	},
	
	applyTables: function() {
		return; //TODO
		if(nul.debug.logging && nul.debug.logTbl) nul.debug.logTbl.treeTable({ indent: 16, initialState: 'collapsed' });;
		if(nul.debug.globalKlg) nul.debug.globalKlg.html(nul.execution.globalKlg.toHtml());
	},
	wrapped: function() {
		
	},
	described: function(name, dscr) {
		return this;
		//TOREDO
		var ftc = this.perform(name);
		return function() {
			var cargs = $.makeArray(arguments);
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
