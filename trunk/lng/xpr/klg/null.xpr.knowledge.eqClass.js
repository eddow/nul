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
		if(o.isDefined()) {
			if(this.prototyp)
				try {
					nul.xpr.mod(klg, nul.xpr.knowledge);
					var unf = this.prototyp.unified(o, klg);
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
		} else this.values.push(o);
		//TODO2: sort :
		//	independants, locals dependant, ior3 dependant
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
		this.belongs.push(s);
	},
	
	/**
	 * The object appears only in this equivalence class.
	 * Retrive an equivalence class that doesn't bother with useless knowledge
	 * @param {nul.xpr.object} o
	 * @return nul.xpr.knowledge.eqClass or null
	 */
	unused: function(o) {
		var unused = function(eqc, tbl, str) {
			for(var e=0; e<tbl.length; ++e)
				if(tbl[e].toString() == str) {
					nul.debug.log('Knowledge')('Forget', tbl[e]);
					tbl.splice(e, 1);
					return eqc.built();
				}
		};
		
		this.use(); nul.obj.use(o);
		var oStr = o.toString();
		var rv = this.modifiable();
		return unused(rv, rv.values, oStr) || unused(rv, rv.belongs, oStr); 
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
		if(!this.belongs.length && 1>= eqs.length) return;
		if(!eqs.length) {
			//TODO3: add \/i this.belongs[i] not empty
			return;
		}
		return $super(prnt);
	},
});

nul.xpr.knowledge.eqClass.represent = Class.create(nul.browser.bijectif, {
	initialize: function($super) {
		this.tbl = {};
		$super();
	},
	represent: function(ec) {
		if(isArray(ec)) { for(var i in ec) if(cstmNdx(i)) this.represent(ec[i]); }
		else {
			this.invalidateCache();
			nul.xpr.use(ec, nul.xpr.knowledge.eqClass);
			var eqs = ec.equivalents();
			for(var i=1; i<eqs.length; ++i)
				this.tbl[eqs[i]] = eqs[0];
		}
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
	transform: function(xpr) {
		if((this.protect && this.protect[xpr]) || !this.tbl[xpr]) return nul.browser.bijectif.unchanged;
		do xpr = this.tbl[xpr]; while(this.tbl[xpr]);
		return xpr;
	},
});
