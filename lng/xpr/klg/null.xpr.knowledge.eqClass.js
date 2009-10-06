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
	initialize: function(obj, attr) {
 		if(obj && 'eqCls'== obj.expression) {
			this.equivls = clone1(obj.equivls);	//Equal values
			this.belongs = clone1(obj.belongs);	//Sets the values belong to
			this.attribs = clone1(obj.attribs);	//Sets the attributes owned
 		} else {
			this.equivls = obj?[obj]:[];
			this.belongs = [];
			this.attribs = attr||{};
			this.attribs[''] = 'xprBunch';
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
		if(v.defined) return -1;
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
	taken: function(knowledge) {
		try { return this.equivls[0]; }
		finally {
			var rec = this.built();
			if(rec) knowledge.accede(rec);
		}
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
			if(this.eqvlDefined())
				try {
					nul.xpr.mod(klg, nul.xpr.knowledge);
					var unf;
					try {
						unf = this.equivls[0].unified(o, klg);
					} catch(err) {
						nul.failed(err);
						unf = o.unified(this.equivls[0], klg);
					}
					if(unf && true!== unf) this.equivls[0] = unf;
				} catch(err) {
					nul.failed(err);
					if('lambda'== this.equivls[0].expression) {
						var t = o; o = this.equivls[0]; this.equivls[0] = t;
					}
					if('lambda'== o.expression) rv.pushs([o.point, o.image]);
					else throw err;
				}
			else {
				this.equivls.unshift(o);
				rv.pushs(this.hasAttr(this.attribs, klg));
			}
		} else {
			var p = 0;
			var ordr = this.orderEqs(o, klg);
			for(p=0; p<this.equivls.length; ++p) if(ordr<this.orderEqs(this.equivls[p], klg)) break;
			this.equivls.splice(p,0,o);
		}
		return rv;
	},

	/**
	 * Add an object as a belongs.
	 * @param {nul.xpr.object} o object that belongs the class
	 * @return array(nul.xpr.object) Array of objects to equal to this eqCls afterward
	 * @throws nul.failure
	 */
	isIn: function(s, klg) {
 		this.modify(); s.use();
 		if(s.defined) {
 			if(this.blngDefined()) {
				nul.xpr.mod(klg, nul.xpr.knowledge);
				var ntr;
				try {
					ntr = this.belongs[0].intersect(s, klg);
				} catch(err) {
					nul.failed(err);
					ntr = s.intersect(this.belongs[0], klg);
				}
				if(ntr && true!== ntr) this.belongs[0] = unf;
 			} else this.belongs.unshift(s);
 		} else this.belongs.push(s);
	},
	
	/**
	 * Specify attributes
	 * @param {{string: nul.xpr.object}} attrs 
	 * @return array(nul.xpr.object) Array of objects to equal to this eqCls afterward
	 * @throws nul.failure
	 */
	hasAttr: function(attrs, klg) {
		var rv = [];
		if(this.equivls[0] && 'lambda'== this.equivls[0].expression && !isEmpty(attrs,[''])) {
			var o = this.equivls.shift();
			rv = [o.point, o.image];
		}
		if(!rv.length && this.eqvlDefined()) {
			for(var an in attrs) if(an) klg.unify(attrs[an], this.equivls[0].attribute(an));
			this.attribs = {'':'xprBunch'};
		} else if(this.attribs !== attrs)
			this.attribs = merge(this.attribs, attrs, function(a,b) {
				return a&&b?klg.unify(a,b):a||b;
			});
		return rv;
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
		unused = unused(rv, rv.equivls, oStr) || unused(rv, rv.belongs, oStr);
		if(unused) return unused.built();
		return this; 
	},
	
	/**
	 * Compute the influence of this equivalence class (excluded 'exclElm')
	 * @param {nul.xpr.knowledge} klg
	 * @param {string: integer} excl Element to exclude, from the summary.components
	 * @param {association(ndx=>infl)} already The influences already computed (modified by side-effect)
	 * @return {association(ndx=>infl)} Where 'ndx' is a local index and 'infl' 1 or 2 
	 */
	influence: function(klg, excl, only, already) {
		var rv = already || {};
		var eqc = this;
		var destSelect = function(cn, ndx) {
			return excl!= cn+':'+ndx && excl!= cn+':*' && (!only || only==cn+':'+ndx || only==cn+':*')
		};
		var subInfluence = function(cn, infl) {
			if(destSelect(cn))
				for(var e in eqc[cn]) if(cstmNdx(e) && destSelect(cn, e))
					for(var ndx in eqc[cn][e].dependance().usage(klg).local)
						if(!rv[ndx] || rv[ndx]<infl) rv[ndx] = infl;
		}
		subInfluence('equivls', 2);
		subInfluence('belongs', 1);
		subInfluence('attribs', 1);
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
			if(isEmpty(deps.usages)) return this;
			//TODO2: otherThan : only in locals or in ior3 too ?
			if(deps.otherThan(klg)) return this;	//If depends on another knowledge, keep
			deps = deps.usage(klg);
			for(var l in deps.local) if(lcls[l]) return this;	//If depends on a needed local, keep
		};
		var nVals = maf(this.equivls, remover);
		var nBlgs = maf(this.belongs, remover);
		//TODO3: FA: do we forget attributes ?
		//FA var nAtts = maf(this.attribs, remover);
		if(nVals.length == this.equivls.length && nBlgs.length == this.belongs.length
			/*FA && nAtts.length == this.attribs.length*/) return this;
		var rv = this.modifiable();
		rv.equivls = nVals;
		rv.belongs = nBlgs;
		//FA rv.attribs = nAtts;
		return rv.built().placed(klg); 
	},
	
	eqvlDefined: function() { return this.equivls.length && this.equivls[0].defined; },
	blngDefined: function() { return this.belongs.length && this.belongs[0].defined; },
	
//////////////// nul.expression implementation
	
	expression: 'eqCls',
	components: ['equivls', 'belongs', 'attribs'],
	modifiable: function($super) {
		var rv = $super();
		rv.equivls = clone1(rv.equivls);	//Equal values
		rv.belongs = clone1(rv.belongs);	//Sets the values belong to
		rv.attribs = clone1(rv.attribs);
		rv.attribs[''] = 'xprBunch';
		return rv;		
	},
	fix: function($super) {
		return $super();
	},
	placed: function($super, prnt) {
		nul.xpr.mod(prnt, nul.xpr.knowledge);
		//TODO3: if(!this.belongs.length && !eqs.length) return;
		if(!this.belongs.length && (!this.equivls.length || 
			(1== this.equivls.length && isEmpty(this.attribs,['']))))
				return;
		return $super(prnt);
	},
});

nul.xpr.knowledge.eqClass.represent = Class.create(nul.browser.chewer, {
	initialize: function($super, ec) {
		this.tbl = {};
		for(var c in ec) if(cstmNdx(c)) {
			this.invalidateCache();
			nul.xpr.use(ec[c], nul.xpr.knowledge.eqClass);
			for(var e=1; e<ec[c].equivls.length; ++e)
				this.tbl[ec[c].equivls[e]] = ec[c].equivls[0];
		}
		$super('Representation');
		this.prepStack = [];
	},
	subBrowse: function(xpr) {
		nul.xpr.use(xpr, nul.xpr.knowledge.eqClass);
		this.protect = [];
		for(var i=0; i<xpr.equivls.length; ++i) this.protect[xpr.equivls[i]] = xpr.equivls[i];
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
		if(this.prepStack.contains(xpr))
			return nul.browser.bijectif.unchanged;
		return xpr;
	},
});