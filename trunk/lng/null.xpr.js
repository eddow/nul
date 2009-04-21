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
	attribute: function(atn) {
	},
	composed: function() { return this; },
	clone: function(nComps) {
		var rv = clone1(this);
		if(nComps) rv.components = nComps;
		else if(rv.components) rv.components = map(this.components, function() { return this.clone(); });
		return rv;
	}.perform('nul.xpr->clone'),
	clone1: function() {
		return this.clone(clone1(this.components));
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

	//Specify that occurences of <xpr> in <this> expression are indeed self-references
	setSelfRef: function(xpr) {
		var tt = {};
		if(!this.arCtxName) this.arCtxName = 'ar'+(++nul.understanding.srCtxNames);
		tt[xpr.ndx] = new nul.xpr.local(this.arCtxName,nul.lcl.slf, xpr.dbgName?xpr.dbgName:null);
		return this.contextualise(null, tt);
	},
	contextualise: function(kb, tt, prtct) {
		if(isEmpty(tt)) return this;
		return this.browse(nul.browse.contextualise(tt, prtct), kb) || this;
	}.perform('nul.xpr->contextualise'),
	evaluate: function(kb) {
		return this;
	}.perform('nul.xpr->evaluate'),

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
		if(['[-]','[]','!'].contains(this.charact)) flags.fuzzy = true;
		
		if(this.makeDeps) dps.push(this.makeDeps());
		this.deps = nul.lcl.dep.mix(dps);
		if('fz'== this.charact) {
			//TODO: envoie ça dans une sous-classe
			this.used = this.deps[this.ctxName] || {};
			delete this.deps[this.ctxName];
		}
		if(this.arCtxName) {
			if(this.deps[this.arCtxName]) delete this.deps[this.arCtxName];
			else delete this.arCtxName;
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
	handle: function() {},

	clean: function() { return this; },	//TODO:killme
	dirty: function() { return this; },	//TODO:killme


//shortcuts defined elsewhere
	toHTML: nul.text.toHTML,
	toString: nul.text.toString,
	browse: nul.browse.recursion,
	
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
	initialize: function($super, ops) {
		this.components = [];
		this.compose(ops||[]);
		$super();
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

nul.xpr.associative = Class.create(nul.xpr.listed, {
	compose: function($super, nComps) {
		if(!nComps) nComps = this.components;
		var nc = [];
		while(0<nComps.length) {
			var tc = nComps.pop();
			if(tc.charact == this.charact) nComps.pushs(tc.components);
			else nc.unshift(tc);
		}
		return $super(nc);
	}.perform('nul.xpr.associative->compose')
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
		handle: function() { return [null, this, this]; },
	});
};

nul.xpr.forward = function(root, fkey) {
	return Class.create(root, {
		finalRoot: function() { return this.components[fkey].finalRoot(); },
		handle: function() { return this.components[fkey].handle(); },
	});
};