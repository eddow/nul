/*  NUL language JavaScript framework
 *  (c) 2009 E-med Ware
 *
 * NUL is freely distributable under the terms of GNU GPLv3 license.
 *  For details, see the NUL project site : http://code.google.com/p/nul/
 *
 *--------------------------------------------------------------------------*/

/**
 * A list of dependancies toward knowledges
 */
nul.dependance = Class.create({
	initialize: function(lcl) {
		this.usages = {};
		if(lcl) {
			nul.xpr.is(lcl, nul.obj.lcl);
			this.depend(lcl.klgRef, 'local', lcl.ndx);
		}
	},
	
//////////////// private
	
	depend: function(klgNm, type, ndx, qtt) {
		if(!qtt) qtt = 1;
		if(!this.usages[klgNm]) this.usages[klgNm] = { local: {}, ior3: {} };
		if(!this.usages[klgNm][type][ndx]) this.usages[klgNm][type][ndx] = qtt;
		else this.usages[klgNm][type][ndx] += qtt;
	},

//////////////// public

	/**
	 * Retrieve a usage and forget about it
	 */
	usage: function(klg) {
		try{ return this.usages[klg.name] || { local: {}, ior3: {} }; }
		finally { delete this.usages[klg.name]; }
	},

	/**
	 * Depends also on all what 'deps' depends on
	 * @param {nul.dependance} deps
	 */
	also: function(deps) {
		for(var klgNm in deps.usages)
			for(var type in deps.usages[klgNm])
				for(var ndx in deps.usages[klgNm][type])
					this.depend(klgNm, type, ndx, deps.usages[klgNm][type][ndx]);
		return this;
	},

	/**
	 * Specify dependance from an ior3 expression
	 */
	ior3dep: function(ior3) {
		nul.xpr.is(ior3, nul.obj.ior3);
		this.depend(ior3.klgRef, 'ior3', ior3.ndx);
		return this;
	},
	
//////////////// Text output

	toHtml : function() {
		var rv = [];
		for(var krf in this.usages) {
			var ld = this.usages[krf].local;
			var rld = [];
			for(var l in ld) rld.push(html.td(l+':'+ld[l]));
			rv.push(html.th(krf) + rld.join());
		}
		return html.table(rv.join());
	},
	
	toFlat : function() {
		var rv = [];
		for(var krf in this.usages) {
			var ld = this.usages[krf].local;
			var rld = [];
			for(var l in ld) rld.push(l+':'+ld[l]);
			rv.push(krf + '[' + rld.join(', ') + ']');
		}
		return rv.join(' ');
	},
	
});
