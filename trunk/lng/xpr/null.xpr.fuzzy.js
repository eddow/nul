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
		if(rv.openedKnowledge) delete rv.openedKnowledge;
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
	compose: function($super, nComps) {
		if(!nComps) {
			delete this.components;
		} else {
			if(!this.components) this.components = [];
			var rv = $super(nComps);
			if(rv!== this) return rv;
		}
		return this.summarised().composed();
	},
	composed: function() {
		if(!this.components) this.flags = {failed: true};
		else if(
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
	subRecursion: function(cb, kb) {
		//TODO: standardiser les deux semi-méthodes ci-dessous
		if(this.openedKnowledge) {
			var ps = this.openedKnowledge.forget();
			while(ps.length) {
				var trv = cb.apply(ps.shift());
				//trv = trv.operate?(trv.operate(this.openedKnowledge)||trv):trv;
				this.openedKnowledge.know(trv);
			}
			//return this.openedKnowledge.asFuzz(cb.apply(this.components.value));
			return cb.apply(this.components.value);
		}
		var klg = this.enter('empty'), rv; //TODO: plus de 'empty', on le vide à la main après
		try {
			while(this.components.length) {
				var trv = cb.apply(this.components.shift());
				//trv = trv.operate?(trv.operate(klg)||trv):trv;
				klg.know(trv);
			}
			rv = cb.apply(this.components.value);
		} finally {
			rv = klg.leave(rv);
		} 
		return rv;
	},
	withKlg: function(klg, org) {	//Debug purpose only
		this.openedKnowledge = klg;
		this.openedKnowledgeOrg = org;
		this.openedKnowledgeDlc = nul.debug.lc;
		return klg;
	},
	subContextualise: function(tt, act) {
		var klg = this.openedKnowledge;
		var prmcs = klg.forget();
		var cntxtls = nul.browse.contextualise(klg, tt, act);
		this.components.value = this.components.value
			.browsed(cntxtls);
		while(prmcs.length)
			klg.know(prmcs.shift().browsed(cntxtls,'nocs'));
		return this;
	},
	/**
	 * Replace each element that can be found in an equivalence class by
	 * the class' stereotype.
	 * exemple: If knowledge contains '3 = x', replace all 'x+2' by '3+2'
	 * Always returns sth : either a new expression, either this.
	 * 
	 * Also replace all operable expression by the result of its operation.
	 */
	simplify: function() {
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
		return this.subContextualise(tt, 'knwl');
	}.perform('nul.xpr.fuzzy->simplify')
	.describe(function(klg) { return ['Simplifying', this]; }),
	/**
	 * Defragment the local index-space.
	 */
	relocalise: function() {
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
		return this.subContextualise(tt);
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
		klg.know(rv.components);
		return rv.components.value;
	}.perform('nul.xpr.fuzzy->stpUp'),

/////// Knowledge
	enter: function(emptyK) {
		if(nul.debug.assert) assert(!this.openedKnowledge,
			'Knowledge not entered twice');
		return this.withKlg(
			new nul.knowledge(
				emptyK?[]:this.components,
				this.locals, this.ctxName), 'enter');
	},
	entered: function(cb) {
		if(nul.debug.assert) assert(!this.openedKnowledge,
			'Knowledge not entered twice');
		this.withKlg(new nul.knowledge(
			this.components, this.locals, this.ctxName), 'aknlgd');
		var rv;
		try { rv = cb.apply(this, [this.openedKnowledge]); }
		finally { 
			rv = this.openedKnowledge.leave(rv);
			delete this.openedKnowledge;
		}
		return rv;
	},
	aknlgd: function(cb) {
		if(nul.debug.assert) assert(!this.openedKnowledge,
			'Knowledge not entered twice');
		this.withKlg(new nul.knowledge(
			this.components, this.locals, this.ctxName), 'aknlgd');
		var rv;
		try { rv = cb.apply(this.components.value, [this.openedKnowledge]); }
		finally { 
			rv = this.openedKnowledge.leave(rv);
			delete this.openedKnowledge;
		}
		return rv;
	},
});
nul.xpr.fuzzy.createCtxName = function(hd) {
	return (hd||'fc')+(++nul.xpr.fuzzy.ctxNameCpt);
};