/*  NUL language JavaScript framework
 *  (c) 2009 E-med Ware
 *
 * NUL is freely distributable under the terms of GNU GPLv3 license.
 *  For details, see the NUL project site : http://code.google.com/p/nul/
 *
 *--------------------------------------------------------------------------*/

/**
 * TODO:comment
 */
nul.xpr.knowledge.eqClass = Class.create(nul.expression, {
	initialize: function(knowledge, index, copy) {
		this.knowledge = knowledge;
		this.index = index;
 		//Create new objects each time
		this.values = copy?clone1(copy.values):[];		//Equal values
		this.belongs = copy?clone1(copy.belongs):[];	//Sets the values belong to
		this.prototyp = null;
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
	 * @param o JsNulObj object to add
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
	 * @param o JsNulObj object that belongs the class
	 * @return bool failure
	 */
	isIn: function(s) {
 		this.modify(); s.use();
		
		//TODO3 : virer les intersections
		this.belongs.push(s);
	},
	/**
	 * Add this to another whole equivalence class
	 * @param o JsNulEqClass
	 * @return bool failure
	 */
	mergeTo: function(c) {
		this.use(); c.modify();
		
		var rv = this.prototyp?c.isEq(this.prototyp):false;
		return rv ||
			trys(this.values, function() { return c.isEq(this); }) ||
			trys(this.belongs, function() { return c.isIn(this); });
	},

//////////////// nul.expression implementation
	
	type: 'eqCls',
	components: ['prototyp', 'values', 'belongs'],
	modifiable: function($super) {
		var rv = $super();
		delete rv.equivalents;
		delete rv.good;
		rv.values = clone1(rv.values);		//Equal values
		rv.belongs = clone1(rv.belongs);	//Sets the values belong to
		return rv;		
	},
	built: function($super) {
		if(this.knowledge) {
			delete this.knowledge;
			delete this.index;
		}
		this.equivalents = this.prototyp?this.values.added(this.prototyp):this.values;
		if(!this.equivalents.length ||
			(!this.belongs.length && 1== this.equivalents.length))
				return;
		this.good = this.prototyp || this.values[0];
		return $super();
	},
});
