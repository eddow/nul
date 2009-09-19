/*  NUL language JavaScript framework
 *  (c) 2009 E-med Ware
 *
 * NUL is freely distributable under the terms of GNU GPLv3 license.
 *  For details, see the NUL project site : http://code.google.com/p/nul/
 *
 *--------------------------------------------------------------------------*/

nul.obj.pair = Class.create(nul.obj.defined, {
	/**
	 * @param first Either nul.object, either {value/knowledge}
	 * @param second JsNulObj
	 * @param klg If <first> is JsNulObj, this is the parent knowledge
	 */
	initialize: function(first, second) {
		//Note if a klg is given, its fuziness belong to this pair' first
		nul.xpr.use(first); nul.obj.use(second);
		if('possible'== first.type) {
			first.use();
			var ops = nul.solve(first);
			first = ops.shift();
			while(ops.length) {
				var op = ops.pop();
				second = new nul.obj.pair(op, second);
			}
		}
		this.first = first;
		this.second = second;
		this.summarise();
	},
	
//////////////// Summary
	
	listed: nul.summary('listed'),

	sum_listed: function() {
		var rv = [];
		var brwsr = this;
		do {
			rv.push(brwsr.first);
			brwsr = brwsr.second;
		} while('pair'== brwsr.type);
		if('&phi;'!= brwsr.type) rv.follow = brwsr;
		return rv;
	},

//////////////// nul.xpr.object implementation

	has: function(o, fzns, klg) {
		this.use();
		nul.obj.use(o);
		nul.xpr.mod(klg, nul.xpr.knowledge);
		
		//TODO3: summarise a tree of fixed values (=> ram db)
		var brwsr = this;
		var rv = [];
		do {
			var tklg = new nul.xpr.knowledge(fzns.name);
			try {
				rv.push((new nul.xpr.possible(tklg.unify(brwsr.firstIn(fzns, tklg), o),
					tklg.built(fzns))).built());
			} catch(err) { nul.failed(err); }
			brwsr = brwsr.second;
		} while('pair'== brwsr.type);
		//TODO2: follow
		return klg.hesitate(rv);
	},

//////////////// nul.obj.defined implementation

	attr: {	
		'& ': function(op, klg) {
			if(op.first.fixed()) return op.first;
			//if(1<= op.first.minXst()) return [op.first];	//TODO3: ?
			//if(pinf<= op.first.minXst() && op.first.enumerableExistence)
			// 	return [nul.possible(op.first.firstExistence())];	// &{ N x [] 'oui' } = 0
		},
		'* ': function(op, klg) {
			//if(pinf<= op.first.minXst() && op.first.enumerableExistence)
			// 	return [nul.possible(op[first.next])];	// *{ N x [] 'oui' } = { [2..pinf] x [] 'oui' }
			if(pinf<= op.first.minXst()) return op;	// *{ Q x [] 'oui' } = { Q x [] 'oui' }
			if(op.first.fixed()) return op.second;
		},
	},

	/*unified: function(o, klg) {
		if('pair'!= o.type) nul.fail(this, ' does not unify to ', o);
		//TODO4
	},*/
	
//////////////// nul.expression implementation

	type: 'pair',
	components: ['first', 'second'],
	sum_isSet: function() { return this.second.isSet(); },
	sum_isList: function() {
		return this.first.object && this.second.isList();
	},
});
