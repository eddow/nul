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
		return new nul.xpr.fuzzy();
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
	/**
	 * Get weither this expression is not simply its value, without fuzziness
	 */
	precisable: function() {
		var cn = this.ctxName;
		return	this.components.value &&	//Value is not set when called from within ctor
				!this.components.length &&
				!trys(this.components, function() { return this.fuzze[cn]; }) &&
				!this.components.value.deps[cn];
	},
	/**
	 * Remove the lock avoiding this expression to be simplified
	 */
	unlock: function() {
	 	delete this.locked;
	 	if(this.precisable()) this.replaceBy(this.components.value);
	 	return this;
	},
	composed: function($super) {
		if(!this.components) this.failed = true;
		else {
			if(this.precisable() && !this.locked)
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
		if(this.components) this.inSet(maf(this.components.value.belongs(), function() {
			if(!this.deps[fz.ctxName]) return this;
			//TODO: else, see what 'this' is a subset off and detail it ph?
		}), 'skipSub');
		return this;
	},
/////// Ctor
	//If locked is specified, this remains a fuzzy and don't get simplified
	initialize: function($super,value, premices, locals, ctxName, locked) {
		if(!value) return $super(); 
		var comps = premices || [];
		comps.value = value;
		this.ctxName = ctxName || nul.xpr.fuzzy.createCtxName();
		this.locals = locals || [];
		if(locked) this.locked = locked;
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
/////// Forward specific
	inSet: function($super, sets, flg) {
		if(!this.components) return this;
		if('skipSub'!= flg) this.components.value.inSet(sets, flg);
		return $super(sets, flg);
	},
/////// Fuzzy specific
	subRecursion: function(cb, kb) {
		if(nul.debug.assert) assert(!this.openedKnowledge, 'No browse of an opened fuzzy')
		var klg = this.enter(), rv;
		kb.unshift(klg);
		try {
			rv = cnt(klg.forget(), function() {
				return !klg.know(this, !cb.apply(this));
			});
			rv |= !!cb.apply(this.components.value);
		} catch(err) {
			if(nul.failure!= err) throw nul.exception.notice(err);
			this.replaceBy(new nul.xpr.fuzzy());	//makes a failure
			rv = 0;
		} finally {
			if(rv) this.replaceBy(klg.leave(this));
			else klg.leave(null, this);
			kb.shift();
		} 
		return !!rv;
	},
	withKlg: function(klg, org) {	//Debug purpose only
		this.openedKnowledge = klg;
		this.openedKnowledgeOrg = org;
		this.openedKnowledgeDlc = nul.debug.lc;
		return klg;
	},
	subBrowse: function(behav, act) {
		var klg = this.openedKnowledge;
		
		var eqcls;
		if('knwl'== act) eqcls = maf(this.components, function() {
			if('='== this.charact) this.components = map(this.components, function() {
				return this.clone1();
			});
		});

		var prmcs = klg.forget();
		this.components.value = this.components.value
			.browsed(behav);
		while(prmcs.length) {
			var p = prmcs.shift();
			if('knwl'== act && '='== p.charact) {
				var chg = false;
				var nc = map(p.components,
					function() {
						chg |= !!this.components && cnt(this.components,
							function() {
								return this.browse(behav);
							});
					});
				klg.know(p, !chg);
			} else klg.know(p, !p.browse(behav));
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
		rv = rv.subBrowse(new nul.browse.contextualise(tt));
		
		if('fz'!= rv.charact) return rv;
		
		tt = {};
		for(var i= 0; i<rv.components.length; ++i)
			if('='== rv.components[i].charact) {
				var rplBy = rv.components[i].components[0];
				for(var c=1; c<rv.components[i].components.length; ++c)
					rplBy.inSet(rv.components[i].components[c].belong);
					
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
						tt[rplOrg.ndx] = rplOrg.inSet(rplBy.belong, 'replace');
					}
				}
			}
		rv = rv.subBrowse(new nul.browse.contextualise(tt), 'knwl');
		
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
		return this.subBrowse(new nul.browse.contextualise(tt));
	}.perform('nul.xpr.fuzzy->relocalise')
	.describe(function(klg) { return ['Relocating', this]; }),
	/**
	 * This expression out of the set
	 * this locals are added to <klg> last context 
	 * This ctxName is not referenced anymore
	 */
	renameCtx: function(klg) {
		this.browse(new nul.browse.lclShft(
			klg.addLocals(this.locals), this.ctxName, klg.ctxName));
		delete this.ctxName;
		return this;
	}
	.describe(function(klg) { return ['ctx rename',
		klg.ctxName,
		'(',klg.locals,')',
		this]; }),
	/**
	 * This expression out of the set
	 * this' locals are added to <klg>' last context 
	 * This ctxName is not referenced anymore
	 * knowledge is moved in the specified <klg>
	 */
	stpUp: function(klg) {
		var rv = this;//.renameCtx(klg);
		klg.know(rv.components);
		return rv.components.value;
	}.perform('nul.xpr.fuzzy->stpUp'),

/////// Knowledge
	enter: function() {
		if(nul.debug.assert) assert(!this.openedKnowledge,
			'Knowledge not entered twice');
		return this.withKlg(
			new nul.knowledge(
				this.ctxName,
				this.components,
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