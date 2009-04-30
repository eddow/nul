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
	},
	primitiveAttribute: function(prmtv, atn, klg) {
		var fct = nul.primitiveTree.attribute(prmtv, atn);
		if(fct) return fct.apply(this,[klg]);
	},
	attribute: function(atn, klg) {
		var p = klg.primitive(this);
		if(p) return this.primitiveAttribute(p, atn, klg);
		if(this.free([klg.ctxName]))
			throw nul.semanticException('AUD',
				(nul.tokenizer.isAB(atn, 'alphanum')?'Attribute':'Operator')+
				' '+atn+' isnt defined for '+this.toString());
		
	},
	composed: function() {
		//TODO: remove this, just used to smooth fuzze change
		//assert(this.fuzze, 'fuzze est initialisé');
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
		if(xpr) return merge(this, xpr, function(a,b) { return b; });
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

	/**
	 * Makes the components not anymore using objectivities concerning this knowledge.
	 */
	subjective: function() {
		return this.entered(function(klg) {
			return this.browse(nul.browse.subjectivise(klg, [klg]));
		}) || this;
	}.perform('nul.xpr->subjective'),

	subRecursion: function(cb, kb) {
		return this.compose(map(this.components, cb));
	},

	subjected: function(left, hpnd) {
		var xpr = this.operated(hpnd);//this.operate?(this.operate(hpnd)||this):this;
		return xpr.subject?(xpr.subject(left, hpnd)||xpr):xpr;
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
		//TODO: vérifier qu'il n'y a pas de redondance : NE PAS TROP SUMMARISER
		var dps = [];
		var flags = {};
		var ndx = '';
		if(this.components) map(this.components, function() {
			if(nul.debug.assert) assert(this.deps,'Subs summarised.'); 
			dps.push(this.deps);
			for(var f in this.flags) flags[f] = true;
			ndx += '|' + this.ndx;
		});
		if(this.acNdx) this.ndx = this.acNdx;
		else this.ndx = '[' + this.charact + ndx + ']';
		ndx = '';
		if(['{}'].contains(this.charact)) {
			delete flags.fuzzy;
			delete flags.failable;
		}
		if(['[.]','[]','fz','$'].contains(this.charact)) flags.fuzzy = true;
		
		if(this.makeDeps) dps.push(this.makeDeps());
		this.deps = nul.lcl.dep.mix(dps);
		if('fz'== this.charact) {
			//TODO: envoie ça dans une sous-classe
			this.used = this.deps[this.ctxName] || {};
			delete this.deps[this.ctxName];
		}
		
		
		if(this.ctxDef) {
			if(this.deps[this.ctxDef]) delete this.deps[this.ctxDef];
			//TODO: else if(!rv.fuzzyTo(this.ctxDef)) delete this.ctxDef;
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
	handle: function(klg) {
		if(klg.primitive(this)) return [null, this, this];
	},


//shortcuts defined elsewhere
	toHTML: nul.text.toHTML,
	toString: nul.text.toString,
	browse: nul.browse.expression,
	browsed: function(behav, noOwnBS) {
		return this.browse(behav, noOwnBS) || this;
	}
	
});

nul.xpr.uncomposed = Class.create(nul.xpr, {
	compose: function(nComps) {
		if(nul.debug.assert) assert(!nComps, 'This shouldnt be composed!');
		return this.summarised();
	}.perform('nul.xpr.uncomposed->compose'),
	initialize: function($super) {
		this.compose();
		$super();
	}
});

nul.xpr.composed = Class.create(nul.xpr, {
	compose: function(nComps) {
		if(nComps && nComps!== this.components)
			merge(this.components, nComps);
		return this.summarised().composed();
	}.perform('nul.xpr.composed->compose'),
/////// Ctor
	initialize: function($super, ops) {
		this.components = {};
		this.compose(ops||{});
		$super();
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
		return this.summarised().composed();
	}.perform('nul.xpr.listed->compose'),
	composed: function($super) {
		return $super();
	},
	initialize: function($super, ops) {
		this.components = [];
		var cpsd = this.compose(ops);
		if(cpsd !== this) return this.replaceBy(cpsd);
		$super();
	},
});

nul.xpr.relation = Class.create(nul.xpr.listed, {
	composed: function($super) {
		if(nul.debug.assert) assert(1< this.components.length,
			'Relation has several components');
		return this;
	}.perform('nul.xpr.relation->compose'),
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
		finalRoot: function() { return true; },
		handle: function(klg) { return [null, this, this]; },
		attribute: function($super, atn, klg) {
			return this.primitiveAttribute(this.primitive, atn, klg) ||
				$super(atn, klg);
		}
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
		handle: function(klg) { return this.components[fkey].handle(klg); },
	});
};
