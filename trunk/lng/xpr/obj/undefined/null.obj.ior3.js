/*  NUL language JavaScript framework
 *  (c) 2009 E-med Ware
 *
 * NUL is freely distributable under the terms of GNU GPLv3 license.
 *  For details, see the NUL project site : http://code.google.com/p/nul/
 *
 *--------------------------------------------------------------------------*/

/**
 * Defined an object that can be several one, on a choice
 * TODO: comment link w/ knowledge
 */
nul.obj.ior3 = Class.create(nul.obj.undefined, {
	initialize: function(klg, items) {
		var vals = [];
		var klgs = [];
		map(items, function() {
			vals.push(this.value);
			klgs.push(this.knowledge);
		});
		this.values = vals;
		this.klgs = klgs;
	},

//////////////// nul.expression summaries

	sum_index: function() {
		return this.indexedSub(this.ior3ndx, this.values);
	},

//////////////// nul.expression implementation
	
	type: 'ior3',
	components: ['values'],
	built: function($super) {
		//TODO: prévoir le modifiable
		if(!this.choices.length) nul.fail('No more choices');
		if(1== this.choices.length) {
			this.klg.merge(this.klgs[0]);
			return this.values[0];
		}
		this.klg = klg;
		this.ior3ndx = this.klg.hesitate(this.klgs);
		delete this.klgs;
		return $super({
			isDefined: false,
		});
	},
});