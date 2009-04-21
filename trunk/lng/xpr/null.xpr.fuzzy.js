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
		return 0<this.components.length || this.components.value.flags.failable;
	},
	fail: function() {
		delete this. components;
		this.flags = this.deps = {};
		return this;
	},
	summarised: function($super) {
		if(!this.components) return this;
		return $super();
	},
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
	initialize: function($super, value, premices, locals, ctxName) {
		if(!value) $super(); 
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
	 */
	simplify: function(kb) {
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
		return this.contextualise(kb, tt, 'knwl');
	}.perform('nul.xpr.fuzzy->simplify')
	.describe(function(kb) { return ['Simplifying', this]; }),
	/**
	 * Remove all clauses in the knowledge that share no deps with 'values'
	 * nor with a useful clause.
	 * No return value.
	 */
	concentrate: function() {
		var ctxn = this.ctxName;
		this.summarised();
		var usefulLocals = clone1(this.components.value.deps[ctxn]);
		//TODO: We should keep the premices about another context !!!
		if(!usefulLocals) {
			this.components.splice(0);
			return this;
		}
		//First eliminate locals found once in an equality of the premices
		for(var l in this.used) if(1== this.used[l] && !usefulLocals[l]) {
			//This local is used only once in the premices. Is it as a term of a unification ?
			var p;
			for(p=0; p < this.components.length && (
				!this.components[p].deps[ctxn] ||
				 !this.components[p].deps[ctxn][l] )
			; ++p);	///Find the premice containing this local
			if(p < this.components.length) {	//The premice can have been deleted by this algorithm!
				var prm = this.components[p];
				if('='== prm.charact) {
					var c;
					for(c=0; !prm.components[c].deps[ctxn] || !prm.components[c].deps[ctxn][l]; ++c); //Find the term refering the local
					if('local'== prm.components[c].charact) {
						if(2== prm.components.length) {
							this.components.splice(p,1);
							this.summarised();
						} else {
							prm.components.splice(c,1);
							prm.summarised();
							this.summarised();
						}
					}
				}
			}
		}
		//Second, sort the premices to keep only the ones with no link at all from the value
		var forgottenPrmcs = [];
		for(var i=0; i<this.components.length; ++i)
			if(isEmpty(this.components[i].deps, [ctxn]))
				forgottenPrmcs.push(i);
		do {
			var ds;
			for(var i=0; i<forgottenPrmcs.length; ++i) {
				ds = this.components[forgottenPrmcs[i]].deps[ctxn];
				if(ds) if(trys(ds, function(d) { return usefulLocals[d] })) break; 
			}
			if(i>=forgottenPrmcs.length) ++i;
			else {
				merge(usefulLocals, ds);
				forgottenPrmcs.splice(i,1);
			}
		} while(i<=forgottenPrmcs.length);
		//Remove in inverse orders to have valid indices.
		// If [1, 3] must be removed from (0,1,2,3,4) to give (0,2,4),
		//  first remove 3 then 1.
		while(0<forgottenPrmcs.length) this.components.splice(forgottenPrmcs.pop(), 1);
		return this;
	}.perform('nul.xpr.fuzzy->concentrate')
	.describe(function() { return ['Concentrating', this]; }),
	/**
	 * Defragment the local index-space.
	 */
	relocalise: function(kb) {
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
		var rv = this.contextualise(kb, tt);
		return rv;
	}.perform('nul.xpr.fuzzy->relocalise')
	.describe(function(kb) { return ['Relocating', this]; }),
	/**
	 * This expression out of the set
	 * this' locals are added to <kb>' last context 
	 * This ctxName is not referenced anymore
	 */
	stpUp: function(kb) {
		var dlt = kb.addLocals(this.locals);
		var rv = (this.browse(
			nul.browse.lclShft(dlt, this.ctxName, kb.contexts[0].ctxName)
		) || this);
		kb.knew(rv.components);
		return rv.components.value;
	}.perform('nul.xpr.fuzzy->stpUp'),
/////// Knowledge
	enter: function() {
		return new nul.knowledge(this.components, this.locals, this.ctxName);
	}
/*
		takeFrdm: function(knwl, ctx) {
			if(this.solving) return this;
			this.solving = true;
			try { var rv = nul.solve.solve(this); }
			finally { delete this.solving; }
	
			if(rv.solved.length) {
				if(0<rv.fuzzy.length)
					rv.solved.follow = this.asUnion(rv.fuzzy);
				rv = nul. build.list(rv.solved);
				if(this.arCtxName) {
					rv.arCtxName = this.arCtxName;
					delete this.arCtxName;
					this.summarised();
				}
			}
			else if(rv.fuzzy.length) rv = this.asUnion(rv.fuzzy, this.x);
			else return nul. build.definition();

			if('{}'== rv.charact) return rv.removeUnused().clean();
			if(nul.debug.assert) assert(','== rv.charact, 'Solution value is set or list');
			if(rv.components.follow) rv.components.follow.removeUnused();
			return rv;
		}.perform('set->takeFrdm'),
		makeFrdm: function(kb) {
			kb.push(nul.knowledge(this.components), {
				ctxName: this.ctxName,
				locals: this.locals,
				addLocals: function(locals) {
					this.locals.pushs(isArray(locals)?locals:[locals]);
					return this.locals.length-locals.length;
				}
			});
			return this;
		},*/

});
nul.xpr.fuzzy.createCtxName = function(hd) {
	return (hd||'fc')+(++nul.xpr.fuzzy.ctxNameCpt);
};