/*  NUL language JavaScript framework
 *  (c) 2009 E-med Ware
 *
 * NUL is freely distributable under the terms of GNU GPLv3 license.
 *  For details, see the NUL project site : http://code.google.com/p/nul/
 *
 *--------------------------------------------------------------------------*/

/**
 * @namespace NUL Debugging tools
 */
nul.action = new JS.Class(/** @lends nul.action# */{
	/**
	 * @construct
	 */
	initialize: function(name, applied, args) {
		this.name = name;
		this.applied = applied;
		this.args = args;
		nul.action.begin(this);
		this.isToLog = nul.action.isToLog(name);
		if(this.isToLog) {
			console.groupCollapsed(name);
			console.log('Applied to', applied);
			console.log('Arguments', args);
		}
	},
	returns: function(value) {
		nul.action.end(this);
		this.success = true;
		this.result = value;
		if(this.isToLog) {
			console.log('Gives', value);
			console.groupEnd();
		}
		return value;
	},
	abort: function(err) {
		nul.action.end(this);
		this.success = false;
		this.error = nul.ex.be(err);
		if(this.isToLog) {
			console.warn('Aborted : ', this.error);
			console.groupEnd();
		}
		return this.error;
	},
	extend: /** @lends nul.action */{
		described: function(name) {
			var ftc = this;
			if(nul.debugged && !nul.debugged.possibleLogging.include(name)) nul.debugged.possibleLogging.push(name);
			return function() {
				var cargs = $.makeArray(arguments);
				var action = new nul.action(name, this, cargs);
				try { return action.returns(ftc.apply(this, cargs)); }
				catch(err) { throw action.abort(err); }			
			};
		},

		present: [],
		begin: function(action) {
			if(nul.debugged) nul.assert(!action.parent, 'Actions consistency');
			action.parent = this.doing();
			this.present.unshift(action);
		},
		end: function(action) {
			if(nul.debugged) nul.assert(this.present[0]===action, 'Actions consistency');
			this.present.shift();
		},
		doing: function() {
			return this.present[0];
		},
		isToLog: function(name) {
			return nul.debugged && window.console && console.groupCollapsed && nul.debugged.logging && nul.debugged.logging[name];
		}		
	}
});

Function.prototype.describe = nul.action.described;

