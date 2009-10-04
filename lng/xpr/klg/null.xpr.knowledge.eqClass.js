/*  NUL language JavaScript framework
 *  (c) 2009 E-med Ware
 *
 * NUL is freely distributable under the terms of GNU GPLv3 license.
 *  For details, see the NUL project site : http://code.google.com/p/nul/
 *
 *--------------------------------------------------------------------------*/

/**
 * A piece of knowledge:
 * A set of objects known equivalents and a set of items they are known to belong to. 
 */
nul.xpr.knowledge.eqClass = Class.create(nul.expression, {
	initialize: function(obj) {
 		if(obj && 'eqCls'== obj.expression) {
			this.values = clone1(obj.values);	//Equal values
			this.belongs = clone1(obj.belongs);	//Sets the values belong to
			this.prototyp = obj.prototyp;		//The values all equals to, used as prototype
 		} else {
			this.values = obj?[obj]:[];
			this.belongs = [];
		}
	},

//////////////// private
	
	/**
	 * Order the values to equal.
	 * @param {nul.xpr.object} v
	 * @param {nul.xpr.knowledge} klg 
	 * @return A big number if not interesting, a small one if a good "replacement value"
	 * Note: v is undefined 
	 */
	orderEqs: function(v, klg) {
		var d = v.dependance();
		var rv = 0;
		if(d.otherThan(klg)) rv += 1;
		if(!isEmpty(d.usage(klg).local)) rv += 2;
		if(!isEmpty(d.usage(klg).ior3)) rv += 4;
		return rv;
	},

//////////////// internal

	/**
	 * Build and get a representative value for this class.
	 */
	taken: function(knowledge, index) {
		var rv = this.prototyp || this.values[0];
		var rec = this.built();
		if(rec) knowledge.accede(index, rec);
		if(nul.debug.assert && rec) assert(rec.prototyp || rec.values.length,
			'Built equivalence class has equivalents');
		return rec?rec.equivalents()[0]:rv;
	},

//////////////// public

	/**
	 * Add an object in the equivlence.
	 * @param {nul.xpr.object} o object to add
	 * @return array(nul.xpr.object) Array of objects to equal to this eqCls afterward
	 * @throws nul.failure
	 */
	isEq: function(o, klg) {
 		this.modify(); nul.obj.use(o);
		var rv = [];
		//Add an object to the equivalence class
		nul.obj.use(o);
		if(o.defined) {
			if(this.prototyp)
				try {
					nul.xpr.mod(klg, nul.xpr.knowledge);
					var unf;
					try {
						unf = this.prototyp.unified(o, klg);
					} catch(err) {
						nul.failed(err);
						unf = o.unified(this.prototyp, klg);
					}
					if(unf && true!== unf) this.prototyp = unf;
				} catch(err) {
					nul.failed(err);
					if('lambda'== this.prototyp.expression) {
						var t = o; o = this.prototyp; this.prototyp = t;
					}
					if('lambda'== o.expression) rv.pushs([o.point, o.image]);
					else throw err;
				}
			else this.prototyp = o;
		} else {
			var p = 0;
			var ordr = this.orderEqs(o, klg);
			for(p=0; p<this.values.length; ++p) if(ordr<this.orderEqs(this.values[p], klg)) break;
			this.values.splice(p,0,o);
		}
		return rv;
	},

	/**
	 * Add an object as a belongs.
	 * @param {nul.xpr.object} o object that belongs the class
	 * @return array(nul.xpr.object) Array of objects to equal to this eqCls afterward
	 * @throws nul.failure
	 */
	isIn: function(s) {
 		this.modify(); s.use();
 		//TODO2: use intersect if possible
		this.belongs.push(s);
	},
	
	/**
	 * The object appears only in this equivalence class.
	 * Retrive an equivalence class that doesn't bother with useless knowledge
	 * @param {nul.xpr.object} o
	 * @return nul.xpr.knowledge.eqClass or null
	 * TODO3: this function is useless
	 */
	unused: function(o) {
		var unused = function(eqc, tbl, str) {
			for(var e=0; e<tbl.length; ++e)
				if(tbl[e].toString() == str) {
					nul.debug.log('Knowledge')('Forget', tbl[e]);
					tbl.splice(e, 1);
					return eqc;
				}
		};
		
		this.use(); nul.obj.use(o);
		var oStr = o.toString();
		var rv = this.modifiable();
		unused = unused(rv, rv.values, oStr) || unused(rv, rv.belongs, oStr);
		if(unused) return unused.built();
		return this; 
	},
	
	/**
	 * Compute the influence of this equivalence class (excluded 'exclElm')
	 * @param {nul.xpr.knowledge} klg
	 * @param {integer} exclElm Element to exclude, from the summary.components
	 * @param {association(ndx=>infl)} already The influences already computed
	 * @return {association(ndx=>infl)} Where 'ndx' is a local index and 'infl' 1 or 2 
	 */
	influence: function(klg, exclElm, already) {
		var rv = already || {};
		var eqs = this.equivalents();
		for(var e=0; e<eqs.length; ++e) if(e!=exclElm) {
			var usg = eqs[e].dependance().usage(klg).local;
			for(var ndx in usg) rv[ndx] = 2;
		}
		for(var e=0; e<this.belongs.length; ++e) if(e!=exclElm - eqs.length) {
			var usg = this.belongs[e].dependance().usage(klg).local;
			for(var ndx in usg) if(!rv[ndx]) rv[ndx] = 1;
		}
		return rv;
	},
	
	/**
	 * Remove items that are not used in this knowledge
	 * Not used = depending on nothing else than the useless locals of thisknowledge
	 * @param {nul.xpr.knowledge} klg Pruned knowledge this class belongs to
	 * @param {association(ndx: true)} lcls List of used locals
	 */
	pruned: function(klg, lcls) {
		var remover = function() {
			var deps = this.dependance();
			if(isEmpty(deps.usages)) return this;	//ex: in Q
			//TODO2: otherThan : only in locals or in ior3 too ?
			if(deps.otherThan(klg)) return this;	//If depends on another knowledge, keep
			deps = deps.usage(klg);
			for(var l in deps.local) if(lcls[l]) return this;	//If depends on a needed local, keep
		};
		var nVals = maf(this.values, remover);
		var nBlgs = maf(this.belongs, remover);
		if(nVals.length == this.values.length && nBlgs.length == this.belongs.length) return this;
		var rv = this.modifiable();
		rv.values = nVals;
		rv.belongs = nBlgs;
		return rv.built().placed(klg); 
	},
	
	equivalents: nul.summary('equivalents'),
	sum_equivalents: function() {
		return this.prototyp?this.values.added(this.prototyp):this.values;
	},	

//////////////// nul.expression implementation
	
	expression: 'eqCls',
	components: ['prototyp', 'values', 'belongs'],
	modifiable: function($super) {
		var rv = $super();
		rv.values = clone1(rv.values);		//Equal values
		rv.belongs = clone1(rv.belongs);	//Sets the values belong to
		return rv;		
	},
	fix: function($super) {
		return $super();
	},
	placed: function($super, prnt) {
		nul.xpr.mod(prnt, nul.xpr.knowledge);
		var eqs = this.equivalents();
		//TODO3: if(!this.belongs.length && !eqs.length) return;
		if(!this.belongs.length && 1>= eqs.length) return;
		if(!eqs.length) return;
		return $super(prnt);
	},
});

nul.xpr.knowledge.eqClass.represent = Class.create(nul.browser.chewer, {
	initialize: function($super, ec) {
		this.tbl = {};
		for(var i in ec) if(cstmNdx(i)) {
			this.invalidateCache();
			nul.xpr.use(ec[i], nul.xpr.knowledge.eqClass);
			var eqs = ec[i].equivalents();
			for(var i=1; i<eqs.length; ++i)
				this.tbl[eqs[i]] = eqs[0];
		}
		$super('Representation');
		this.prepStack = [];
	},
	subBrowse: function(xpr) {
		nul.xpr.use(xpr, nul.xpr.knowledge.eqClass);
		this.protect = [];
		var eqs = xpr.equivalents();
		for(var i=0; i<eqs.length; ++i) this.protect[eqs[i]] = eqs[i];
		try { return this.recursion(xpr); }
		finally {
			for(var i in this.protect) this.uncache(this.protect[i]);
			delete this.protect;
		}
	},
	prepare: function($super, xpr) {
		this.prepStack.push(xpr);
		return $super();
	},
	transform: function(xpr) {
		this.prepStack.pop();
		if((this.protect && this.protect[xpr]) || !this.tbl[xpr]) return nul.browser.bijectif.unchanged;
		do xpr = this.tbl[xpr]; while(this.tbl[xpr]);
		//If I'm replacing a value by an expression that contains this value, just don't
		for(var i=0; i<this.prepStack.length; ++i)
			if(this.prepStack[i] === xpr)
				return nul.browser.bijectif.unchanged;
		return xpr;
	},
});