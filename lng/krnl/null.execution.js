/*  NUL language JavaScript framework
 *  (c) 2009 E-med Ware
 *
 * NUL is freely distributable under the terms of GNU GPLv3 license.
 *  For details, see the NUL project site : http://code.google.com/p/nul/
 *
 *--------------------------------------------------------------------------*/
 
nul.execution = {	//TODO2: réactiver les benchmarks
	reset: function()
	{
		nul.erroneus = false;
		//namespaces
		nul.obj.extension.nameSpace = 0;
		nul.xpr.knowledge.nameSpace = 0;
		nul.browser.cached.nameSpace = 0;
		
		nul.debug.reset();
		nul.execution.benchmark.reset();
	},
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