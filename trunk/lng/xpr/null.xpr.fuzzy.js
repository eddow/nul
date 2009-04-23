/*  NUL language JavaScript framework
 *  (c) 2009 François Marie De Mey
 *
 * NUL is freely distributable under the terms of GNU GPLv3 license.
 *  For details, see the NUL project site : http://code.google.com/p/nul/
 *
 *--------------------------------------------------------------------------*/

/**
 * Expression that comes with some knowledge.
 * Components have :
 * - components.value = value
 * - components[0..] = knowledge
 * 	(expressions for which the value is not important, only the failability)
 * 
 * These expressions are sons of IOR3
 */
nul.xpr.fuzzy = Class.create(nul.xpr.forward(nul.xpr.listed, 'value'), {
/////// XPR duty
	charact: 'fz',
	clone: function($super, ncomps) {
		var rv = $super(ncomps);
		rv.locals = clone1(rv.locals);
		return rv;
	},
	failable: function() {
		return !this.components ||
			0<this.components.length ||
			this.components.value.flags.failable;
	},
	fail: function() {
		delete this.components;
		this.flags = {failed: true};
		this.deps = {};
		return this;
	},
	compose: function(nComps) {
		if(nul.debug.assert) assert(!this.openedKnowledge,
			'Never compose while knowledge opened');
		this.components = nComps;
		if(!nComps) this.flags = {failed: true};
		return this.summarised().composed();
	}.perform('nul.xpr.fuzzy->compose'),
	composed: function() {
		if(this.components &&
		this.components.value &&	//Value is not set when called from within ctor
		0== this.components.length &&
		!this.components.value.flags.failable &&
		!this.components.value.deps[this.ctxName])
			return this.components.value;
		return this;
	},
/////// Ctor
	initialize: function($super,value, premices, locals, ctxName) {
		if(!value) return $super(); 
		var comps = premices || [];
		comps.value = value;
		this.ctxName = ctxName || nul.xpr.fuzzy.createCtxName();
		this.locals = locals || [];
		$super(comps);
	},
	
/////// String management
	expressionHTML: function() {
		if(!this.components) return '<span class="failure">fail</span>';
		var rv = '';
		if(this.components.value) {
			if(0<this.components.length) return ''+
				'<table class="xpr freedom"><tr><td class="freedom">' +
				this.components.value.toHTML() +
				'</td></tr><tr><th class="freedom">' +
				nul.text.expressionHTML(';', this.components) +
				'</th></tr></table>';
			return this.components.value.toHTML();
		}
		if(0<this.components.length) return nul.text.expressionHTML(';', this.components);
		return '<span class="failure">Ok</span>';
	},
	expressionString: function() {
		if(!this.components) return '&lt;fail&gt;';
		var rv = '';
		if(this.components.value) rv =
			this.components.value.toString() + (0<this.components.length?'; ':'');
		if(0<this.components.length)
			rv += nul.text.expressionString(';', this.components);
		return rv;
	},
/////// Fuzzy specific
	/**
	 * Replace each element that can be found in an equivalence class by
	 * the class' stereotype.
	 * exemple: If knowledge contains '3 = x', replace all 'x+2' by '3+2'
	 * Always returns sth : either a new expression, either this.
	 * 
	 * Also replace all operable expression by the result of its operation.
	 */
	simplify: function(klg) {
		var tt = {};	//Transformation table
		for(var i= 0; i<this.components.length; ++i)
			if('='== this.components[i].charact) {
				var rplBy = this.components[i].components[0];
				if(!rplBy.flags.fuzzy) for(var c=1; c<this.components[i].components.length; ++c) {
					var rplOrg = this.components[i].components[c];
					if(!rplBy.contains(rplOrg))
						tt[rplOrg.ndx] = rplBy;
				}
			}
		return this.contextualise(klg, tt, 'knwl');
	}.perform('nul.xpr.fuzzy->simplify')
	.describe(function(klg) { return ['Simplifying', this]; }),
	/**
	 * Defragment the local index-space.
	 */
	relocalise: function(klg) {
		this.summarised();
		//Remove local-index-space allocations for unknowns not used anymore
		var delta = 0, i = 0, tt = {};
		while(i<this.locals.length) {
			if(!this.used[i+delta]) {
				++delta;
				this.locals.splice(i,1);
			} else {
				if(0<delta) tt[new nul.xpr.local(this.ctxName,i+delta).ndx] =
					new nul.xpr.local(this.ctxName,i,this.locals[i]); 
				++i;
			}
		}
		if(!delta) return this;
		var rv = this.contextualise(klg, tt);
		return rv;
	}.perform('nul.xpr.fuzzy->relocalise')
	.describe(function(klg) { return ['Relocating', this]; }),
	/**
	 * This expression out of the set
	 * this' locals are added to <klg>' last context 
	 * This ctxName is not referenced anymore
	 */
	stpUp: function(klg) {
		var dlt = klg.addLocals(this.locals);
		var rv = (this.browse(
			nul.browse.lclShft(dlt, this.ctxName, klg.ctxName)
		) || this);
		if('fz'!= rv.charact) return rv;
		klg.knew(rv.components);
		return rv.components.value;
	}.perform('nul.xpr.fuzzy->stpUp'),
/////// Knowledge
	enter: function() {
		return new nul.knowledge([], this.locals, this.ctxName);
	},
	aknlgd: function(cb, klg) {
		this.openedKnowledge = new nul.knowledge(this.components, this.locals, this.ctxName);
		var rv = cb(this.components.value, this.openedKnowledge);
		return klg.leave(this.openedKnowledge);
	},
});
nul.xpr.fuzzy.createCtxName = function(hd) {
	return (hd||'fc')+(++nul.xpr.fuzzy.ctxNameCpt);
};