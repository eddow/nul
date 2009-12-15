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
nul.debugged = {
	fails: [],
	logging: false,
	logDeep: [],
	possibleLogging: ['Represent'],
	
	log: function(tp, ltp) {
		if(0< nul.debugged.lcLimit && nul.debugged.lcNextLimit< nul.debugged.lc) {
			nul.debugged.warnRecursion();
			nul.debugged.lcNextLimit += nul.debugged.lcLimit;
		}
		return window.console && tp && nul.debugged.logging && nul.debugged.logging[tp] ? console[ltp||'log'] : function() {};
	},

	warn: function(tp) { return this.log(tp, 'warn'); },
	info: function(tp) { return this.log(tp, 'info'); },
	error: function(tp) { return this.log(tp, 'error'); },
	
	warnRecursion: function()
	{
		if(nul.erroneus) return;
		if(!confirm('Keep on recursion?')) nul.ex.internal('Broken by debugger');
	},
	begin: function(nlcl) {
		nul.debugged.lc = 0;
		if('undefined'!= typeof nlcl) nul.debugged.lcLimit = nlcl;
		if(true===nul.debugged.lcLimit) nul.debugged.lcLimit = 500;
		nul.debugged.lcNextLimit = nul.debugged.lcLimit;
	},
	
	asserted: function(obj, str) {
		if('string'== typeof obj) {
			str = obj;
			obj = null;
		}
		if(nul.debugged) nul.assert(this.apply(obj), str);
	},
	contract: function(str) {
		if(!nul.debugged.assert) return function() {};
		var ftc = this;
		return function() { assert(ftc.apply(this), str); };
	},
	
	/**
	 * Assert this object implements a class
	 * @param {Class} cls The expected class
	 * @param {String} nm [optional] The description of what is expected
	 * @param {function(obj) {Boolean}} cb [optional] Call back to try on the tested objects
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
			if(nul.debugged) nul.assert(
					cls.def(obj) &&
					(!cb || cb(obj)),
				'Expected '+(nm||'a specific object'));
			return obj;
		}; 
	},
	/**
	 * Assert these objects has a member (use a member which name defines the class)
	 * @param {Class} cls The expected class
	 * @param {String} nm [optional] The description of what is expected
	 * @param {function(obj) {Boolean}} cb [optional] Call back to try on the tested objects
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
			if(nul.debugged.assert) map(objs, function(i, obj) { assert(
					cls.def(obj) &&
					(!cb || cb(obj)),
					'Expected '+ (nm||'specific object') + 's'); });
		}; 
	},
	
	/**
	 * Draw a failure info
	 */
	fail: function(reason) {
		reason = beArrg(arguments);
		if(nul.debugged.fails.length) nul.debugged.fails[0].push(reason, '|');
		else nul.debugged.warn('fail')('', 'Failure', reason);
	},
	/**
	 * Make a bunch of tries. If none succed, report a failure
	 */
	trys: function(cb, name, obj, args) {
		//TOREDO
		nul.debugged.fails.unshift([]);
		nul.debugged.log(name)(nul.debugged.lcs.collapser('Begin'), name, args);
		try {
			var rv = cb.apply(obj);
			nul.debugged.log(name, 'end')(nul.debugged.lcs.endCollapser('End','Done'), name, rv || 'nothing', args);
			nul.debugged.fails.shift();
			return rv;
		} catch(err) {
			nul.failed(err);
			if(nul.debugged) nul.assert(nul.debugged.fails.length && nul.debugged.fails[0].length,'Finally failed if failed once');
			nul.debugged.fails[0].pop();	//Remove the last '|' TODO O: ?
			var le = nul.debugged.log(name);
			if(le) le(nul.debugged.lcs.endCollapser('Abort', 'Failed'), name, nul.debugged.fails[0]);
			else nul.debugged.log('fail', 'end')('', 'Failure', nul.debugged.fails[0]);
			nul.debugged.fails.shift();
			nul.fail(name, args);
		}
	}
};

Function.prototype.contract = nul.debugged.contract;
Function.prototype.asserted = nul.debugged.asserted;

nul.assert = function(cnd, str) {
	if(window.console) console.assert(cnd, str);
	if(!cnd)
		nul.ex.assert('Assertion failed : '+str);
};
