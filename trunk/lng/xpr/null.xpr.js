/*  NUL language JavaScript framework
 *  (c) 2009 François Marie De Mey
 *
 * NUL is freely distributable under the terms of GNU GPLv3 license.
 *  For details, see the NUL project site : http://code.google.com/p/nul/
 *
 *--------------------------------------------------------------------------*/

/**
 * NUL expression
 */
nul.xpr = Class.create({
	initialize: function() {
		this.belong = [];
	},
	primitiveAttribute: function(prmtv, atn, klg) {
		var fct = nul.primitiveTree.attribute(prmtv, atn);
		if(fct) return fct.apply(this,[klg]);
	},
	attribute: function(atn) {
		if(this.primitive && this.primitive[atn])
			return this.primitive[atn].apply(this);
		var apl = this;
		var fromBlng = trys(this.belong, function() {
			if(this.elementAttribute)
				return this.elementAttribute(apl, atn);
		});
		return fromBlng;
	},
	composed: function() {
		this.summarised();
		return this;
	},
	clone: function(nComps) {
		return this.browse(nul.browse.clonage());
		var rv = clone1(this);
		if(rv.components) rv.components = map(this.components,
			function() { return this.clone(); });
		return rv;
	}.perform('nul.xpr->clone'),
	replaceBy: function(xpr) {
		var blng = this.belong;
		if(xpr) {
			merge(this, xpr, function(a,b) { return b; });
			if(blng) this.inSets(blng);
			return this;
		}
	},

	dbgHTML: function() {
		if(!nul.debug.logging) return 'dbg';
		var str = this.toString();
		if(str.length < 250) return this.toHTML();
		return str;
	},

	cmp: function(xpr) {
		return this.ndx == xpr.ndx;
	},

	//Weither an expression contains another one or not
	contains: function(xpr) {
		if('string'!= typeof xpr) xpr = xpr.ndx;
		return -1<this.ndx.indexOf(xpr);
	},
	handle: function() { return this.attribute(' hndl'); },

	/**
	 * Specify that occurences of <xpr> in <this> expression are indeed self-references
	 */
	setSelfRef: function(xpr, klg) {
		var tt = {};
		if(!this.ctxDef) this.ctxDef = nul.xpr.fuzzy.createCtxName();
		tt[xpr.ndx] = new nul.xpr.local(this.ctxDef,nul.lcl.slf, xpr.dbgName?xpr.dbgName:null);
		return this.contextualise(tt);
	},
	/**
	 * Expand self references of <this> as <xpr> 
	 */
	expSelfRef: function(xpr, klg, ctxNm) {
		ctxNm = ctxNm || this.ctxDef;
		if(!ctxNm) return;
		var tt = {};
		tt[nul.xpr.local.ndx(nul.lcl.slf, ctxNm)] = xpr;
		return this.contextualise(tt);
	},
	contextualise: function(tt) {
		//if(isEmpty(tt)) return this;
		return this.browse(nul.browse.contextualise(tt)) || this;
	}.perform('nul.xpr->contextualise'),
	operated: function(klg) {
		//if(isEmpty(tt)) return this;
		return this.browse(nul.browse.operated(klg)) || this;
	}.perform('nul.xpr->contextualise'),

	subRecursion: function(cb, kb) {
		return this.compose(map(this.components, cb));
	},


	stpUp: function(klg) {
		return this.ctxName?(this.browse(
			nul.browse.lclShft(0, this.ctxName, klg.ctxName)
		) || this):this;
	}.describe(function(klg) { return ['Generic stpUp',
		klg.ctxName,
		'(',klg.locals,')',
		this]; }),

	renameCtx: function(ctxTo, ctxFrom) {
		if(!ctxFrom) ctxFrom = this.ctxDef;
		if(this.ctxDef == ctxFrom) this.ctxDef = ctxTo;
		return this.browse(
			nul.browse.lclShft(0, ctxFrom, ctxTo)
		) || this;
	},
	aknlgd: function(cb) {
		var klg = this.enter();
		var rv;
		try { rv = cb.apply(this, [klg]); }
		finally { rv = klg.leave(rv); }
		return rv;
	},
	entered: function(cb) {
		var klg = this.enter();
		var rv;
		try { rv = cb.apply(this, [klg]); }
		finally { rv = klg.leave(rv); }
		return rv;
	},
	enter: function() {
		return new nul.knowledge();
	},
	
	/**
	 * Replace all operable expression by the result of its operation.
	 */
	simplify: function(klg) {
		return this.operate(klg) || this;
	}.perform('nul.xpr->simplify')
	.describe(function(klg) { return ['Simplifying', this]; }),
/**
 * Makes a summary of components and characteristics :
 *  Fix flags, dependances, ...
 */
	summarised: function() {
		var dps = [];
		var flags = {};
		var ndx = '';
		var fuzze = {};

		function accountSub() {
			if(nul.debug.assert) assert(this.deps,'Subs summarised.'); 
			dps.push(this.deps);
			fuzze = merge(fuzze, this.fuzze);
			for(var f in this.flags) flags[f] = true;
		}
		if(this.components) map(this.components, function() {
			accountSub.apply(this);
			ndx += '|' + this.ndx;
		});
		map(this.belong, accountSub);
		if(this.acNdx) this.ndx = this.acNdx;
		else this.ndx = '[' + ((this.obj&&this.obj!=this.charact) ? 
				this.charact + this.obj : this.charact) + ndx + ']';
		ndx = '';
		if(['{}'].contains(this.charact)) delete flags.failable;
		
		//TODO: application.deps ==> fuzze ?
		if(this.ctxName && 'local'!= this.charact) fuzze[this.ctxName] = true;
		if(this.ctxDef) {
			if(fuzze[this.ctxDef]) delete fuzze[this.ctxDef];
			else delete this.ctxDef;
		}
		this.fuzze = fuzze; 
		if(this.makeDeps) dps.push(this.makeDeps());
		this.deps = nul.lcl.dep.mix(dps);
		if('fz'== this.charact) {
			//TODO: envoie ça dans une sous-classe
			this.used = this.deps[this.ctxName] || {};
			delete this.deps[this.ctxName];
		}
		
		if(this.failable && this.failable()) flags.failable = true;
		this.flags = flags;
		
		return this;
	}.perform('nl.xpr->summarised'),

	//Shortcut: Weither this epression is free of dependance toward external locals
	free: function(bsd) { return nul.lcl.dep.free(this.deps, bsd); }.perform('nul.xpr->free'),
	//If the root expression of this operand will be kept forever
	//TODO: en faire un flag?
	finalRoot: function() { return false; },

//shortcuts defined elsewhere
	toHTML: nul.text.toHTML,
	toString: nul.text.toString,
	browse: nul.browse.expression,
	browsed: function(behav, noOwnBS) {
		return this.browse(behav, noOwnBS) || this;
	},
/////// Belonging management
	/**
	 * Asserts this expression is in <set>.
	 * Returns the expression.
	 */
	inSet: function(set, flg) {
		if(this.doesBelong(set)) return this;
		this.belong = map(this.belong, function(ndx) {
			if(!this.isSubSet(set)) return this;
		});
		this.belong.push(set);
		//TODO: become failable ?
		if('noSum'== flg) return this;
		return this.summarised();
	},
	inSets: function(sets) {
		for(var i=0; i<sets.length; ++i) this.inSet(sets[i], 'noSum');
		return this.summarised();
	},
	/**
	 * Rurns weither this expression belongs to <set>
	 */
	doesBelong: function(set) {
		return trys(this.belong, function() {
			if(this.isSubSet(set)) return true;
		});
	},
	/**
	 * Returns weither this set is a sub-set of <set>.
	 */
	isSubSet: function(set) {
		if(this.ndx==set.ndx) return true;
		return trys(this.containers(), function() {
			if(this.isSubSet(set)) return true;
		});
	},
	/**
	 * Returns the list of sets that contains this one.
	 */
	containers: function() {
		var rv = maf(this.belong, function() {
			if('set'== this.charact) return this.components[0];
		});
	}
});

nul.xpr.uncomposed = Class.create(nul.xpr, {
	compose: function(nComps) {
		if(nul.debug.assert) assert(!nComps, 'This shouldnt be composed!');
		return this.composed();
	},
	initialize: function($super) {
		$super();
		this.compose();
	}
});

nul.xpr.composed = Class.create(nul.xpr, {
	compose: function(nComps) {
		if(nComps && nComps!== this.components)
			merge(this.components, nComps);
		return this.composed();
	},
/////// Ctor
	initialize: function($super, ops) {
		$super();
		this.components = {};
		this.compose(ops||{});
	},
/////// Strings
	expressionHTML: function() {
		return nul.text.expressionHTML(
			'<span class="op">'+(this.htmlCharact || this.charact)+'</span>',
			vals(this.components));
	},
	expressionString: function() {
		return '('+nul.text.expressionString(
			this.htmlCharact || this.charact,
			vals(this.components))+')';
	}
});

nul.xpr.listed = Class.create(nul.xpr, {
	compose: function(nComps) {
		if(nComps && nComps!== this.components) {
			this.components.splice(0);
			merge(this.components, nComps);
		}
		return this.composed();
	},
	initialize: function($super, ops) {
		$super();
		this.components = [];
		var cpsd = this.compose(ops);
		if(cpsd !== this) return this.replaceBy(cpsd);
	},
});

nul.xpr.relation = Class.create(nul.xpr.listed, {
	composed: function($super) {
		if(nul.debug.assert) assert(1< this.components.length,
			'Relation has several components');
		return $super();
	},
/////// Strings
	expressionHTML: function() {
		return nul.text.expressionHTML(
			'<span class="op">'+(this.htmlCharact || this.charact)+'</span>',
			this.components);
	},
	expressionString: function() {
		return '('+nul.text.expressionString(
			this.htmlCharact || this.charact,
			this.components)+')';
	}
});

nul.xpr.associative = Class.create(nul.xpr.relation, {
	compose: function($super, nComps) {
		if(!nComps) nComps = this.components;
		var nc = [];
		while(0<nComps.length) {
			var tc = nComps.pop();
			if(tc.charact == this.charact) nComps.pushs(tc.components);
			else nc.unshift(tc);
		}
		return $super(nc);
	},
});

nul.xpr.ceded = Class.create(nul.xpr.listed, {
/////// Ctor
	initialize: function($super, op) {
		$super([op]);
	}
});

nul.xpr.preceded = Class.create(nul.xpr.ceded, {
/////// Ctor
	initialize: function($super, op) {
		$super(op);
	},
/////// Strings
	expressionHTML: function() {
		return '<span class="op">'+(this.htmlCharact || this.charact)+'</span>'+
			this.components[0].toHTML();
	},
	expressionString: function() {
		return (this.htmlCharact || this.charact) + this.components[0].toString();
	}	
});

nul.xpr.postceded = Class.create(nul.xpr.ceded, {
/////// Ctor
	initialize: function($super, op) {
		$super(op);
	},
/////// Strings
	expressionHTML: function() {
		return this.components[0].toHTML() +
			'<span class="op">'+(this.htmlCharact || this.charact)+'</span>';
	},
	expressionString: function() {
		return this.components[0].toString() +
			(this.htmlCharact || this.charact);
	}	
});

nul.xpr.primitive = function(root, pnm) {
	return Class.create(root, {
		primitive: pnm,
		initialize: function($super, arg) {
			if('string'== typeof this.primitive)
				this.primitive = nul.primitiveTree.primObject(this.primitive);
			$super(arg);
		},
		finalRoot: function() { return true; },
	});
};

nul.xpr.forward = function(root, fkey) {
	return Class.create(root, {
		initialise: function($super, o) {
			$super(o);
			this.primitive = this.components[fkey].primitive;
		},
		finalRoot: function() { return this.components[fkey].finalRoot(); },
		jsValue: function() { return this..components[fkey].jsValue; },
		attribute: function(atn) { return this.components[fkey].attribute(atn); },
	});
};
