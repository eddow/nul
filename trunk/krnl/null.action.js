/*  NUL language JavaScript framework
 *  (c) 2009 E-med Ware
 *
 * NUL is freely distributable under the terms of GNU GPLv3 license.
 *  For details, see the NUL project site : http://code.google.com/p/nul/
 *
 *--------------------------------------------------------------------------*/

nul.action = new JS.Class(/** @lends nul.action# */{
	/**
	 * @param {String} Name
	 * @param {Object} applied
	 * @param {Object[]} args
	 * @class A described action made by the JavaScript interpreter
	 * @constructs
	 */
	initialize: function(name, applied, args) {
		this.name = name;
		if(applied) {
			this.applied = applied;
			//TODO 1: this call f*cks the perfs
			//this.appliedNode = applied.toNode?applied.toNode():$.text('TODO 1: unnoded');
			this.args = args;
			this.isToLog = nul.action.isToLog(name);
			if(this.isToLog) {
				console.groupCollapsed(name);
				console.log('Applied to', applied);
				console.log('Arguments', args);
			}
		}
		nul.action.begin(this);
	},
	/**
	 * Retrieve the english string describing the better this peculiar action
	 */
	description: function() {
		if(!nul.browser.def(this.applied)) return this.name;
		return this.name + ' ' + this.applied.description;		
	},
	/**
	 * Ends this action by specifying the produced value.
	 * @param {Any} value
	 * @return {Any} value
	 */
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
	/**
	 * Ends this action specifying it didn't produce a value but raised an exception.
	 * @param {Any} err
	 * @return {nul.ex} err - as a NUL exception
	 */
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
		/**
		 * Describe a function
		 * @param {String} name
		 * @return this
		 */
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

		/**
		 * The stacked list of begun actions
		 * @type {mul.action[]}
		 */
		present: [],
		/**
		 * Create an action object given the name.
		 * @param {String} action
		 * @return {nul.action}
		 */
		begin: function(action) {
			if(nul.debugged) nul.assert(!action.parent, 'Actions consistency');
			action.parent = this.doing();
			this.present.unshift(action);
		},
		/**
		 * End a given action object
		 * @param {nul.action} action
		 */
		end: function(action) {
			if(nul.debugged) nul.assert(this.present[0]===action, 'Actions consistency');
			this.present.shift();
		},
		/**
		 * Retrieve the last begun action still occuring.
		 * @return {nul.action}
		 */
		doing: function() {
			return this.present[0];
		},
		/**
		 * Retrieve weither this action has to produce Log in the browser console
		 * @param {String} name
		 * @return {Boolean}
		 */
		isToLog: function(name) {
			return nul.debugged && window.console && console.groupCollapsed && nul.debugged.logging && nul.debugged.logging[name];
		}		
	}
});

Function.prototype.describe = nul.action.described;

new nul.action('Bereshit');