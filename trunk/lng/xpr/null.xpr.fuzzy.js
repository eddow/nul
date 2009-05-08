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
	cloned: function($super) {
		this.locals = clone1(this.locals);
		if(this.openedKnowledge) delete this.openedKnowledge;
	},
	failable: function() {
		return !this.components ||
			0<this.components.length ||
			this.components.value.flags.failable;
	},
	fail: function() {
		delete this.components;
		this.failed = true;
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
		return this.composed();
	},
	composed: function($super) {
		var cn = this.ctxName;
		if(!this.components) this.failed = true;
		else {
			if(
				this.components.value &&	//Value is not set when called from within ctor
				!this.components.length &&
				!trys(this.components, function() { return this.fuzze[cn]; }) &&
				!this.components.value.deps[this.ctxName])
					return this.components.value;
			for(var i=0; i<this.components.length; ++i)
				if('fz'== this.components[i].charact) {
					this.components.pushs(this.components[i].components);
					if(this.components[i].components.value.flags.failable)
						this.components[i] = this.components[i].components.value;
					else {
						this.components.splice(i,1);
						--i;
					}
				}
		}
		$super();
		var fz = this;
		if(this.components) map(this.components.value.belong, function() {
			if(!this.deps[fz.ctxName]) fz.inSet(this, 'skipSub');
			//TODO: else, see what 'this' is a subset off and detail it
		});
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
	operate: function(klg) {
		if(!this.locals.length)	//TODO: si locals comps, import => ior3
			return this.replaceBy(this.stpUp(klg));
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
/////// Forward specific
	belongChg: function($super, sets, flg) {
		if('skipSub'!= flg) this.components.value.alsoInSets(sets, flg);
		return $super(sets);
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
			rv = klg.leave(rv, this);
		} 
		return rv;
	},
	withKlg: function(klg, org) {	//Debug purpose only
		this.openedKnowledge = klg;
		this.openedKnowledgeOrg = org;
		this.openedKnowledgeDlc = nul.debug.lc;
		return klg;
	},
	subBrowse: function(behav, act) {
		var klg = this.openedKnowledge;
		var prmcs = klg.forget();
		this.components.value = this.components.value
			.browsed(behav);
		while(prmcs.length) {
			var p = prmcs.shift();
			if('knwl'== act && '='== p.charact)
				klg.know(p.compose(map(p.components,
					function() { return this.components?
						this.compose(map(this.components,
						function() { return this.browsed(behav); })):
						this;
					})));
			else klg.know(p.browsed(behav));
		}
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
		var rv = this, tt = {};	//Transformation table
		
		tt = {};
		for(var i= 0; i<rv.components.length;)
			if('[.]'== rv.components[i].charact) {
				var cs = rv.components[i].components;
				tt[cs.applied.ndx] = 
					(tt[cs.applied.ndx] || cs.applied)
					.inSet(cs.object);
				//rv.components.splice(i,1);
				++i;
			} else ++i;
		rv = rv.subBrowse(nul.browse.contextualise(tt));
		
		if('fz'!= rv.charact) return rv;
		
		tt = {};
		for(var i= 0; i<rv.components.length; ++i)
			if('='== rv.components[i].charact) {
				var rplBy = rv.components[i].components[0];
				for(var c=1; c<rv.components[i].components.length; ++c)
					rplBy.alsoInSets(rv.components[i].components[c].belong);
					
				tt[rplBy.ndx] = rplBy;
				if(isEmpty(rplBy.fuzze)) {
					for(var c=1; c<rv.components[i].components.length; ++c) {
						var rplOrg = rv.components[i].components[c];
						if(!rplBy.contains(rplOrg)) //TODO: par tests: Encore besoin de cette vérification?
							tt[rplOrg.ndx] = rplBy;
					}
				} else {
					for(var c=1; c<rv.components[i].components.length; ++c) {
						var rplOrg = rv.components[i].components[c];
						tt[rplOrg.ndx] = rplOrg.inSets(rplBy.belong);
					}
				}
			}
		rv = rv.subBrowse(nul.browse.contextualise(tt), 'knwl');
		
		return rv;
	}.perform('nul.xpr.fuzzy->simplify')
	.describe(function(klg) { return ['Simplifying', this]; }),
	/**
	 * Defragment the local index-space.
	 */
	relocalise: function() {
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
		return this.subBrowse(nul.browse.contextualise(tt));
	}.perform('nul.xpr.fuzzy->relocalise')
	.describe(function(klg) { return ['Relocating', this]; }),
	/**
	 * This expression out of the set
	 * this' locals are added to <klg>' last context 
	 * This ctxName is not referenced anymore
	 */
	renameCtx: function(klg) {
		var dlt = klg.addLocals(this.locals);
		return this.browse(
			nul.browse.lclShft(dlt, this.ctxName, klg.ctxName)
		) || this;
	},
	/**
	 * This expression out of the set
	 * this' locals are added to <klg>' last context 
	 * This ctxName is not referenced anymore
	 * knowledge is moved in the specified <klg>
	 */
	stpUp: function(klg) {
		var rv = this.renameCtx(klg);
		klg.know(rv.components);
		return rv.components.value;
	}.perform('nul.xpr.fuzzy->stpUp')
	.describe(function(klg) { return ['Fuzzy stpUp',
		klg.ctxName,
		'(',klg.locals,')',
		this]; }),

/////// Knowledge
	enter: function(emptyK) {
		if(nul.debug.assert) assert(!this.openedKnowledge,
			'Knowledge not entered twice');
		return this.withKlg(
			new nul.knowledge(
				this.ctxName,
				emptyK?[]:this.components,
				this.locals), 'enter');
	},
	entered: function(cb) {
		if(nul.debug.assert) assert(!this.openedKnowledge,
			'Knowledge not entered twice');
		this.withKlg(new nul.knowledge(
			this.ctxName, this.components, this.locals), 'aknlgd');
		var rv;
		try { rv = cb.apply(this, [this.openedKnowledge]); }
		finally { 
			rv = this.openedKnowledge.leave(rv, this);
		}
		return rv;
	},
	aknlgd: function(cb) {
		if(nul.debug.assert) assert(!this.openedKnowledge,
			'Knowledge not entered twice');
		this.withKlg(new nul.knowledge(
			this.ctxName, this.components, this.locals), 'entered');
		var rv;
		try { rv = cb.apply(this.components.value, [this.openedKnowledge]); }
		finally { 
			rv = this.openedKnowledge.leave(rv, this);
		}
		return rv;
	},
});

nul.xpr.fuzzy.createCtxName = function(hd) {
	return (hd||'fc')+(++nul.xpr.fuzzy.ctxNameCpt);
};