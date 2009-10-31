/*  NUL language JavaScript framework
 *  (c) 2009 E-med Ware
 *
 * NUL is freely distributable under the terms of GNU GPLv3 license.
 *  For details, see the NUL project site : http://code.google.com/p/nul/
 *
 *--------------------------------------------------------------------------*/

nul.dependance = Class.create(/** @lends nul.dependance# */{
	/**
	 * A list of dependancies toward knowledges or external resources
	 * @constructs
	 * @param {nul.obj.local|nul.obj.data} dep
	 */
	initialize: function(dep) {
		this.usages = {};
		if(dep) {
			nul.obj.is(dep);
			switch(dep.expression) {
			case 'local': this.depend(dep.klgRef, 'local', dep.ndx, dep); break;
			case 'data':
				var ctxName = dep.source.context.toString();
				if(!nul.dependance.contexts[ctxName]) nul.dependance.contexts[ctxName] = dep.source.context; 
				this.depend(ctxName, 'local', dep.source.index, dep);
				break;
			default: throw nul.internalException('No dependance defined for '+dep.expression);
			}
		}
	},
	
//////////////// private
	
	/** @private */
	depend: function(klgNm, type, ndx, objs) {
		if(!isArray(objs)) {
			objs = [objs];
			objs.number = 1;
		}
		if(!this.usages[klgNm]) this.usages[klgNm] = { local: {}, ior3: {} };
		if(!this.usages[klgNm][type][ndx]) {
			this.usages[klgNm][type][ndx] = [];
			this.usages[klgNm][type][ndx].number = 0;
		}
		this.usages[klgNm][type][ndx].union(objs);
		this.usages[klgNm][type][ndx].number += objs.number;
	},

//////////////// public

	/**
	 * Retrieve a usage
	 * @param {nul.xpr.knowledge} klg
	 * @return {nul.dependance.usage}
	 */
	usage: function(klg) {
		return this.usages[klg.name] || { local: {}, ior3: {} };
	},

	/**
	 * Retrieve a usage and remove it from the list
	 * @param {nul.xpr.knowledge} klg
	 * @return {nul.dependance.usage}
	 */
	use: function(klg) {
		try{ return this.usage(klg); }
		finally { delete this.usages[klg.name]; }
	},

	/**
	 * Depends also on all what 'deps' depends on
	 * @param {nul.dependance} deps
	 * @return {nul.dependance}
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
	 * @param {nul.obj.ior3} ior3
	 * @return {nul.dependance}
	 */
	ior3dep: function(ior3) {
		nul.xpr.is(ior3, nul.obj.ior3);
		this.depend(ior3.klgRef, 'ior3', ior3.ndx, ior3);
		return this;
	},

	
//////////////// Text output

	/**
	 * Draw a HTML description of these dependances
	 * @return {HTML}
	 */
	toHtml : function() {
		var rv = [];
		for(var krf in this.usages) {
			var ld = this.usages[krf].local;
			var rld = [];
			for(var l in ld) rld.push(html.td(l+':'+ld[l].number));
			rv.push(html.th(krf) + rld.join());
		}
		return html.table(rv.join());
	},
	
	/**
	 * Draw a flat description of these dependances
	 * @return {String}
	 */
	toFlat : function() {
		var rv = [];
		for(var krf in this.usages) {
			var ld = this.usages[krf].local;
			var rld = [];
			for(var l in ld) rld.push(l+':'+ld[l].number);
			rv.push(krf + '[' + rld.join(', ') + ']');
		}
		return rv.join(' ');
	}
});

/**
 * External data-contexts dictionary.
 * @type {nul.data.context[String]} 
 */
nul.dependance.contexts = {};