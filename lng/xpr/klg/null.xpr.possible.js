/*  NUL language JavaScript framework
 *  (c) 2009 E-med Ware
 *
 * NUL is freely distributable under the terms of GNU GPLv3 license.
 *  For details, see the NUL project site : http://code.google.com/p/nul/
 *
 *--------------------------------------------------------------------------*/

/**
 * A possible value; refering a value and a condition
 */
nul.xpr.possible = Class.create(nul.expression, {
	initialize: function(value, knowledge) {
		this.value = value;
		this.knowledge = knowledge;
	},

//TODO1
	firstIn: function(fzns, klg) {
		if(!this.firstKlg) return this.first;
		var stpUp = this.firstKlg.stepUp(fzns, this.first);
		klg.merge(stpUp.knowledge);
		return stpUp.value || this.first;
	},
	
	built: function($super) {
		if(!this.knowledge) return this.value;
		return $super();
	},
	
	usedIor3s: function() {
		if(!this.summarised.usedIor3s) this.ior3dep();
		if(nul.debug.assert) assert(this.summarised.usedIor3s, 'ior3dep summary build usedIor3s');
		return this.summarised.usedIor3s;
	},
	usedLcls: function() {
		if(!this.summarised.usedLcls) this.lclDep();
		if(nul.debug.assert) assert(this.summarised.usedLcls, 'lclDep summary build usedLcls');
		return this.summarised.usedLcls;
	},	
	sum_ior3dep: function($super) {
		var rv = $super();
		this.summarised.usedIor3s = rv[this.knowledge.name] || {};
		delete rv[this.knowledge.name];
		return rv;
	},

	sum_lclDep: function($super) {
		var rv = $super();
		this.summarised.usedLcls = rv[this.knowledge.name] || {};
		delete rv[this.knowledge.name];
		return rv;
	},

//////////////// nul.expression implementation
	
	type: 'possible',
	components: ['value','knowledge'],
});
