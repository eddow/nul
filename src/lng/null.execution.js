/*  NUL language JavaScript framework
 *  (c) 2009 E-med Ware
 *
 * NUL is freely distributable under the terms of GNU GPLv3 license.
 *  For details, see the NUL project site : http://code.google.com/p/nul/
 *
 *--------------------------------------------------------------------------*/

/**@namespace*/
nul.execution = {
	/**@namespace*/
	name: {
		gen: function(ns) {
			if(!nul.execution.name.space[ns]) nul.execution.name.space[ns] = 0;
			return ++nul.execution.name.space[ns];
		},
		space: {}
	},
	/**
	 * Create the global knowledge
	 */
	createGlobalKlg: function() {
		nul.erroneus = false;
		nul.execution.name.space = {};
		
		/**
		 * The knowledge that is shared as a parent knowledge from a reading to another
		 * @type {nul.xpr.knowledge}
		 */
		nul.execution.globalKlg = new nul.xpr.knowledge('global');
		nul.execution.uberLocal = nul.execution.globalKlg.newLocal('�berLocal');	//TODO 2: use string ndx?
		nul.execution.evalLocal = nul.execution.globalKlg.newLocal('evalLocal');	//TODO 2: use string ndx?
		nul.execution.globalKlg.attributed(nul.execution.uberLocal, {eval: nul.execution.evalLocal});
	},
	/**
	 * Called once nul.globals is made, to close the construction of the primordial globalKlg
	 */
	ready: function() {
		if(!isEmpty(nul.globals)) nul.execution.globalKlg.attributed(nul.execution.uberLocal, nul.globals);
		nul.execution.globalKlg.built();
	},
	/**
	 * Reset the namespaces, the debug state, the erroneus state and the benchmarks(if not specified else)
	 */
	reset: function() {
		nul.execution.createGlobalKlg();
		nul.execution.ready();
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
			if(nul.debugged) nul.assert(nm == this.stack[0], 'benchmark stack coherence');
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
		 * @param {HTMLTable} tbl
		 * @param {Number} firsts Number of lines to draw (default 7)
		 */
		draw: function(tbl, firsts) {
			var tbd;
			switch(tbl[0].tagName.toLowerCase()) {
			case 'tbody': tbd = tbl; break;
			case 'table': 
				tbd = tbl.find('tbody');
				if(!tbd.length) tbl.append(tbd = $('<tbody></tbody>'));
				break;
			default: throw 'trace me';
			}
			
			tbd.empty();
			var cs = [];
			for(var c in this.computed) cs.push([c, this.computed[c]]);
			cs.sort(function(a, b){ return b[1]-a[1]; });
			for(var i=0; i<cs.length && i < (firsts||7); ++i)
				tbd.append($('<tr><td>'+cs[i][1]+'</td><th>'+cs[i][0]+'</th></tr>'));
		}
	},
	
	/**
	 * Called when the page should have a fixed value (when all libs are loaded)
	 * @throw {nul.ex.semantic}
	 */
	existOnce: function() {
		//TODO 2: verify that all attribs of evalLocal are context-free from 'global'
		if(nul.execution.globalKlg.ior3.length || 2!= nul.execution.globalKlg.nbrLocals())	//kill globalKlg ?
			//TODO 2: specify which .attr is too fuzzy
			nul.ex.semantic('GLB', 'The global knowledge is too fuzzy');
	}
};

nul.load.globalKnowledge = nul.execution.createGlobalKlg;

nul.load.executionReady = nul.execution.ready;
nul.load.executionReady.use = {'nul.globals': true, 'globalKnowledge': true};
