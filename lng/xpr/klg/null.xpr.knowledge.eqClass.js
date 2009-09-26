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
	taken: function() {
		if(nul.debug.assert) assert(this.knowledge, 'Take from freshly created equivalence class');
		var rv = this.prototyp || this.values[0];
		var knowledge = this.knowledge;
		var index = this.index;
		var rec = knowledge.accede(index, this.built());
		return rec?rec.good:rv;
	},
	/**
	 * Add an object in the equivlence.
	 * @param {nul.xpr.object} o object to add
	 * @return bool failure
	 */
	isEq: function(o) {
 		this.modify(); o.use();
		
		if(o.isDefined()) {
			if(this.prototyp) {
				var unf = this.prototyp.unified(o, this.knowledge);
				if(!unf) return true;
				if(true!== unf) this.prototyp = unf;
			} else this.prototyp = o;
		} else this.values.push(o);	//TODO2: sort not to have ior3 as 'good'
	},
	/**
	 * Add an object as a belongs.
	 * @param {nul.xpr.object} o object that belongs the class
	 * @return bool failure
	 */
	isIn: function(s) {
 		this.modify(); s.use();
		
		//TODO3 : virer les intersections
		this.belongs.push(s);
	},
	/**
	 * Add this to another whole equivalence class
	 * @param {nul.xpr.knowledge.eqClass} c 
	 * @return bool failure
	 */
	merge: function(c) {
		this.modify(); nul.xpr.use(c, nul.xpr.knowledge.eqClass);
		
		var tec = this;
		return (c.prototyp?this.isEq(c.prototyp):false) ||
			trys(c.values, function() { return tec.isEq(c); }) ||
			trys(c.belongs, function() { return tec.isIn(c); });
	},

//////////////// nul.expression implementation
	
	expression: 'eqCls',
	components: ['prototyp', 'values', 'belongs'],
	modifiable: function($super) {
		var rv = $super();
		delete rv.equivalents;
		delete rv.good;
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
		this.good = this.prototyp || this.values[0];
		return $super();
	},
	placed: function($super, prnt) {
		nul.xpr.mod(prnt, nul.xpr.knowledge);
		if(!this.equivalents.length ||
			(!this.belongs.length && 1== this.equivalents.length))
				return;
		return $super(prnt);
	},
});
