/*  NUL language JavaScript framework
 *  (c) 2009 E-med Ware
 *
 * NUL is freely distributable under the terms of GNU GPLv3 license.
 *  For details, see the NUL project site : http://code.google.com/p/nul/
 *
 *--------------------------------------------------------------------------*/

/**@namespace*/
nul.execution = {
	reset: function()
	{
		nul.erroneus = false;
		//namespaces
		nul.xpr.knowledge.nameSpace = 0;
		nul.browser.cached.nameSpace = 0;
		nul.obj.local.self.nameSpace = 0;
		
		nul.debug.reset();
		nul.execution.benchmark.reset();
	},
	/**@namespace*/
	benchmark: {
		stack: [],
		computed: {},
		measure: function(nm, cb) {
			this.cstart(nm);
			try { return cb(); }
			finally { this.cstop(nm); }
		},
		cstart: function(nm) {
			if(!this.computed[nm]) this.computed[nm] = 0;
			this.computed[nm] -= this.timeStamp(); 
		},
		cstop: function(nm) {
			this.computed[nm] += this.timeStamp();
		},
		timeStamp: function() {
			var d = new Date();
			return d.getTime(); 
		},
		enter: function(nm) {
			if(0<this.stack.length) this.cstop(this.stack[0]);
			this.stack.unshift(nm);
			this.cstart(nm);
		},
		leave: function(nm) {
			if(nul.debug.assert) assert(nm == this.stack[0], 'benchmark stack coherence');
			this.cstop(this.stack[0]);
			this.stack.shift();
			if(0<this.stack.length) this.cstart(this.stack[0]);			
		},
		reset: function() {
			this.computed = {};
			this.stack = [];
		},
		draw: function(tbd) {
			while(0< tbd.rows.length) tbd.deleteRow(0);
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

if(nul.urlOption('noperf'))
	/** @ignore */ Function.prototype.perform = function(name) { return this; };
else
	/**
	 * Notifies the performances of this function
	 * @param {String} name Benchmark name to use.
	 */
	Function.prototype.perform = function(name) {
		var ftc = this;
		return function() {
			var cargs = arrg(arguments);
			var obj = this;
			if('function'== typeof name) name = name.apply(obj, cargs);
			nul.execution.benchmark.enter(name);
			try { return ftc.apply(obj, cargs); }
			finally { nul.execution.benchmark.leave(name); }
		};
	};