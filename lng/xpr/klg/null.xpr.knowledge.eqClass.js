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
	initialize: function(knowledge, index, copy) {
		this.knowledge = knowledge;
		this.index = index;
 		//Create new objects each time
		this.values = copy?clone1(copy.values):[];		//Equal values
		this.belongs = copy?clone1(copy.belongs):[];	//Sets the values belong to
		this.prototyp = copy?copy.prototyp:null;		//The values all equals to, used as prototype
	},

//////////////// internal

	/**
	 * Build and get a representative value for this class.
	 */
	taken: function() {
		if(nul.debug.assert) assert(this.knowledge, 'Take from freshly created equivalence class');
		var rv = this.prototyp || this.values[0];
		var knowledge = this.knowledge;
		var index = this.index;
		var rec = knowledge.accede(index, this.built());
		return rec?rec.equivalents[0]:rv;
	},

	/**
	 * Creates a browser that replace all occurence of the expressions refered
	 * by this class by this class representant.
	 */
	represent: function() {
		this.use();
		return new nul.xpr.knowledge.eqClass.represent(this);
	},

//////////////// public

	/**
	 * Add an object in the equivlence.
	 * @param {nul.xpr.object} o object to add
	 * @return array(nul.xpr.object) Array of objects to equal to this eqCls afterward
	 * @throws nul.failure
	 */
	isEq: function(o) {
 		this.modify(); nul.xpr.use(o);
		var rv = [];
 		if('eqCls'== o.expression) {
 			//Merge to an existing equivalence class
			var tec = this;
			rv.pushs(o.values.mar(function() { return tec.isEq(this); }));
			o.belongs.mar(function() { return tec.isIn(this); });
			if(o.prototyp) rv.pushs(this.isEq(o.prototyp));
 		} else {
 			//Add an object to the equivalence class
 			nul.obj.use(o);
			if(o.isDefined()) {
				if(this.prototyp)
					try {
						var unf = this.prototyp.unified(o, this.knowledge);
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
 		}
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
		
		//TODO3 : virer les intersections
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
					tbl.splice(e, 1);
					return eqc.built();
				}
		};
		
		nul.obj.use(o);
		var oStr = o.toString();
		var rv = this.modifiable();
		return unused(rv, rv.values, oStr) || unused(rv, rv.belongs, oStr); 
	},

//////////////// nul.expression implementation
	
	expression: 'eqCls',
	components: ['prototyp', 'values', 'belongs'],
	modifiable: function($super) {
		var rv = $super();
		delete rv.equivalents;
		rv.values = clone1(rv.values);		//Equal values
		rv.belongs = clone1(rv.belongs);	//Sets the values belong to
		return rv;		
	},
	fix: function($super) {
		if(this.knowledge) {
			delete this.knowledge;
			delete this.index;
		}
		this.equivalents = this.prototyp?this.values.added(this.prototyp):this.values;
		return $super();
	},
	placed: function($super, prnt) {
		nul.xpr.mod(prnt, nul.xpr.knowledge);
		if(!this.belongs.length && 1>= this.equivalents.length) return;
		if(!this.equivalents.length) {
			//TODO3: add \/i this.belongs[i] not empty
			return;
		}
		return $super(prnt);
	},
});

nul.xpr.knowledge.eqClass.represent = Class.create(nul.browser.bijectif, {
	initialize: function($super, eqCls) {
		this.tbl = {};
		for(var i=1; i<eqCls.equivalents.length; ++i)
			this.tbl[eqCls.equivalents[i]] = eqCls.equivalents[0];
		$super();
	},
	transform: function(xpr) {
		return this.tbl[xpr] || nul.browser.bijectif.unchanged;
	},
});
