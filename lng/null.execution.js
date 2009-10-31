/*  NUL language JavaScript framework
 *  (c) 2009 E-med Ware
 *
 * NUL is freely distributable under the terms of GNU GPLv3 license.
 *  For details, see the NUL project site : http://code.google.com/p/nul/
 *
 *--------------------------------------------------------------------------*/

/**@namespace*/
nul.execution = {
	/**
	 * Reset the namespaces, the debug state, the erroneus state and the benchmarks(if not specified else)
	 * @param {Boolean} letBM If set, don't reset the benchmarks
	 */
	reset: function(letBM)
	{
		nul.erroneus = false;
		//namespaces
		nul.xpr.knowledge.nameSpace = 0;
		nul.browser.cached.nameSpace = 0;
		nul.obj.local.self.nameSpace = 0;
		
		nul.debug.reset();
		if(!letBM) nul.execution.benchmark.reset();
	},
	/**@namespace*/
	benchmark: {
		/** List of entered benchmarked named-codes */
		stack: [],
		/** Cumulated named-codes benchmarks */
		computed: {},
		/**
		 * Call cb cumulating its benchmark as named-code 'nm'
		 * @param {String} nm
		 * @param {function() void} cb
		 * @return What cb returns
		 */
		measure: function(nm, cb) {
			this.cstart(nm);
			try { return cb(); }
			finally { this.cstop(nm); }
		},
		/**
		 * Starts a named-code benchmark 'nm' timing
		 * @param {String} nm
		 */
		cstart: function(nm) {
			if(!this.computed[nm]) this.computed[nm] = 0;
			this.computed[nm] -= this.timeStamp(); 
		},
		/**
		 * Stops a named-code benchmark 'nm' timing
		 * @param {String} nm
		 */
		cstop: function(nm) {
			this.computed[nm] += this.timeStamp();
		},
		/**
		 * Get the 'now' time-stamp
		 * @return {DateTime}
		 */
		timeStamp: function() {
			var d = new Date();
			return d.getTime(); 
		},
		/**
		 * Stops the present named-code benchmark and starts a named-code benchmark 'nm' timing instead
		 * @param {String} nm
		 */
		enter: function(nm) {
			if(this.stack.length) this.cstop(this.stack[0]);
			this.stack.unshift(nm);
			this.cstart(nm);
		},
		/**
		 * Stops the present named-code benchmark (named 'nm) and starts back the one stopped before entering if any
		 * @param {String} nm
		 */
		leave: function(nm) {
			if(nul.debug.assert) assert(nm == this.stack[0], 'benchmark stack coherence');
			this.cstop(this.stack[0]);
			this.stack.shift();
			if(this.stack.length) this.cstart(this.stack[0]);			
		},
		/**
		 * Clear benchmarks data.
		 */
		reset: function() {
			this.computed = {};
			this.stack = [];
		},
		/**
		 * Draw the benchmarks in a table
		 * @param {HTMLTable} tbd
		 */
		draw: function(tbd) {
			while(0< $(tbd).nbrRows()) tbd.deleteRow(0);
			var cs = [];
			for(var c in this.computed) cs.push([c, this.computed[c]]);
			cs.sort(function(a, b){ return b[1]-a[1]; });
			for(var i=0; i<cs.length && i < 7; ++i) {
				var rw = tbd.insertRow(-1);
				rw.insertCell(0).innerHTML = cs[i][0];
				rw.insertCell(1).innerHTML = cs[i][1];
			}
		}
	}
};

if(urlOption('noperf'))
	/** @ignore */ Function.prototype.perform = function(name) { return this; };
else
	/**
	 * Notifies the performances of this function
	 * @param {String} name Benchmark name to use.
	 */
	Function.prototype.perform = function(name) {
		var ftc = this;
		return function() {
			var cargs = $A(arguments);
			var obj = this;
			if('function'== typeof name) name = name.apply(obj, cargs);
			nul.execution.benchmark.enter(name);
			try { return ftc.apply(obj, cargs); }
			finally { nul.execution.benchmark.leave(name); }
		};
	};