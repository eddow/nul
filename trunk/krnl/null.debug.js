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
	action: new JS.Class(/** @lends nul.debug.action# */{
		/**
		 * @construct
		 */
		initialize: function(name, applied, args) {
			this.name = name;
			this.applied = applied;
			this.args = args;
			nul.debug.action.begin(this);
			this.isToLog = nul.debug.action.isToLog(name);
			if(this.isToLog) {
				console.groupCollapsed(name);
				console.log('Applied to', applied);
				console.log('Arguments', args);
			}
		},
		returns: function(value) {
			nul.debug.action.end(this);
			this.success = true;
			this.result = value;
			if(this.isToLog) {
				console.log('Gives', rv);
				console.groupEnd();
			}
			return value;
		},
		abort: function(err) {
			nul.debug.action.end(this);
			this.success = false;
			this.error = nul.ex.be(err);
			if(this.isToLog) {
				console.warn('Aborted : ', this.error);
				console.groupEnd();
			}
			return this.error;
		},
		extend: /** @lends nul.debug.action */{
			present: [],
			begin: function(action) {
				if(nul.debug.assert) assert(!action.parent, 'Actions consistency');
				action.parent = this.doing();
				this.present.unshift(action);
			},
			end: function(action) {
				if(nul.debug.assert) assert(this.present[0]===action, 'Actions consistency');
				this.present.shift();
			},
			doing: function() {
				return this.present[0];
			},
			isToLog: function(name) {
				return window.console && console.groupCollapsed && nul.debug.logging && nul.debug.logging[name];
			}		
		}
	}),
	fails: [],
	logging: false,
	logDeep: [],
	possibleLogging: ['Represent'],
	assert: urlOption('debug'),
	perf: !urlOption('noperf'),
	lcLimit: urlOption('break'),
	
	logCount: function() {
		if(0< nul.debug.lcLimit && nul.debug.lcNextLimit< nul.debug.lc) {
			nul.debug.warnRecursion();
			nul.debug.lcNextLimit += nul.debug.lcLimit;
		}
		return nul.debug.lc++;
	},
	log: function(tp, ltp) {
		return window.console && tp && nul.debug.logging && nul.debug.logging[tp] ? console[ltp||'log'] : function() {};
		nul.debug.logCount();
	},

	warn: function(tp) { return this.log(tp, 'warn'); },
	info: function(tp) { return this.log(tp, 'info'); },
	error: function(tp) { return this.log(tp, 'error'); },
	
	newLog: function(logTbl) {
	},
	applyTables: function() {
		if(nul.debug.globalKlg) nul.debug.globalKlg.html(nul.execution.globalKlg.toHtml());
	},
	
	warnRecursion: function(v)
	{
		if(nul.erroneus) return;
		if(v) nul.debug.watch(v);
		nul.debug.applyTables();
		if(!confirm('Keep on recursion?')) nul.ex.internal('Broken by debugger');
	},
	begin: function(nlcl) {
		nul.debug.lc = 0;
		if('undefined'!= typeof nlcl) nul.debug.lcLimit = nlcl;
		if(true===nul.debug.lcLimit) nul.debug.lcLimit = 500;
		nul.debug.lcNextLimit = nul.debug.lcLimit;
	},
	
	described: function(name) {
		var ftc = this;
		if(!nul.debug.possibleLogging.include(name)) nul.debug.possibleLogging.push(name);
		return function() {
			var cargs = $.makeArray(arguments);
			var action = new nul.debug.action(name, this, cargs);
			try { return action.returns(ftc.apply(this, cargs)); }
			catch(err) { throw action.abort(err); }			
		};
	},
	asserted: function(obj, str) {
		if('string'== typeof obj) {
			str = obj;
			obj = null;
		}
		if(nul.debug.assert) assert(this.apply(obj), str);
	},
	contract: function(str) {
		if(!nul.debug.assert) return function() {};
		var ftc = this;
		return function() { assert(ftc.apply(this), str); };
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
					obj && obj.isA && 
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
					obj && obj.isA && 
					obj.isA(cls) &&
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
		else nul.debug.warn('fail')('', 'Failure', reason);
	},
	/**
	 * Make a bunch of tries. If none succed, report a failure
	 */
	trys: function(cb, name, obj, args) {
		//TOREDO
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

Function.prototype.describe = nul.debug.described;

Function.prototype.contract = nul.debug.contract;
if(nul.debug.assert) Function.prototype.asserted = nul.debug.asserted;
else Function.prototype.asserted = function() {};

function assert(cnd, str) {
	if(window.console) console.assert(cnd, str);
	if(!cnd)
		nul.ex.assert('Assertion failed : '+str);
}
