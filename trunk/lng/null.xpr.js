/*  NUL language JavaScript framework
 *  (c) 2009 François Marie De Mey
 *
 * NUL is freely distributable under the terms of GNU GPLv3 license.
 *  For details, see the NUL project site : http://code.google.com/p/nul/
 *
 *--------------------------------------------------------------------------*/
 
nul.xpr = {	//Main interface implemented by all expressions
	isXpr: true,
	clone: function() {
		return clone(this.integre());
	}.perform('nul.xpr->clone').xKeep(),
	toHTML: nul.text.toHTML,
	dbgHTML: function() {
		if(!nul.debug.logging) return 'dbg';
		var str = this.toString();
		if(str.length < 150) return this.toHTML();
		return str;
	},
	browse: nul.browse.recursion.xKeep(),
	//Just compare : returns true or false
	cmp: function(xpr) {
		if(xpr.integre().charact != this.integre().charact) return false;
		var txpr = this;
		if((trys(xpr.x.attributes, function(c, i) {
			return !txpr.x.attributes[i];
		}) || trys(this.x.attributes, function(c,i) {
			return !c.cmp(xpr.x.attributes[i]);
		}))) return false;
		if( this.components || xpr.components ) {
			if(!this.components || !xpr.components || this.components.length != xpr.components.length)
				return false;
			return !(trys(xpr.components, function(c, i) {
				return !txpr.components[i];
			}) || trys(this.components, function(c,i) {
				return !c.cmp(xpr.components[i]);	
			}));
		}
		switch(this.charact) {
			case 'atom': return this.value == xpr.value;
			case 'local': return this.lindx == xpr.lindx && this.ctxDelta==xpr.ctxDelta;
		}
		return true;
	}.perform('nul.xpr->cmp'),
/* Makes a summary of components and characteristics :
 *  Fix flags, dependances, ...
 */
	summarised: function(first) {
		//TODO: vérifier qu'il n'y a pas de redondance : NE PAS TROP SUMMARISER
		var dps = [];
		var flags = {};
		nul.browse.subs(this.integre(),function() {
			if(nul.debug.assert) assert(this.deps,'Subs summarised.'); 
			dps.push(this.deps);
			for(var f in this.flags) if(first || 'dirty'!=f) flags[f] = true;
		});

		if(['<<=','=','?','[-]'].contains(this.charact)) flags.failable = true;
		else if(this.isFailable && this.isFailable()) flags.failable = true;
		if(['{}', ';'].contains(this.charact)) delete flags.fuzzy;
		if(['[-]','[]'].contains(this.charact)) flags.fuzzy = true;
		
		if(this.makeDeps) dps.push(this.makeDeps());
		this.deps = nul.lcl.dep.mix(dps);
		if(this.freedom) {
			this.used = this.deps[0] || {};
			this.deps = nul.lcl.dep.dec(this.deps, this.used);
		}
		//Attributes unification could fail later
		if(!this.fixed() && !isEmpty(this.x.attributes)) flags.failable = true;
		this.flags = flags;

		if(first && !this.flags.dirty && this.operable()) this.flags.dirty = true;
		if(this.flags.dirty && !this.operable() && !this.components) delete this.flags.dirty;
		return this;
	}.perform('nl.xpr->summarised').xKeep(),
	//Be sure the expression is operated until it's not dirty anymore
	composed: function() { return this.integre(); },	
	finalize: function(kb) {
		var xpr = this.integre().known(kb) || this;
		var cpt = 20;
		while(xpr.flags.dirty) {
			xpr = xpr.evaluate(kb) || xpr;
			if(0>=--cpt) throw nul.internalException('Too much finalization');
		}
		return xpr;
	}.perform('nul.xpr->finalize').xKeep(),
	//Get a list of non-fuzzy expressions
	solve: function() {
		if(nul.debug) nul.debug.log('leaveLog')(
			nul.debug.lcs.collapser('Solving'), nul.debug.logging?this.dbgHTML():'');
		var sltn;
		try {
			sltn = nul.solve.solve(this.integre());
		} finally {
			if(nul.debug) {
				if(sltn) nul.debug.log('leaveLog')(
					nul.debug.lcs.endCollapser('Solved', 'Solved'), sltn.length + ' possibiliti(es)');
				else nul.debug.log('leaveLog')(
					nul.debug.lcs.endCollapser('Aborted', 'Unsolvable'), nul.debug.logging?this.dbgHTML():'');
			}			
		}
		return sltn;
	}.perform('nul.xpr->solve'),
	//Gets the value of this expression after operations effect (unifications, '+',  ...)
	evaluate: function(kb) {
		return this.browse(nul.browse.evaluate(kb||nul.kb())) || this.clean();
	}.perform('nul.xpr->evaluate').xKeep(),
	//Replace this context's locals according to association/table <ctx>
	contextualize: function(st) {
		return this.browse(nul.browse.contextualize([st], -1));
	}.perform('nul.xpr->contextualize').xKeep(),
	known: function(kb) {
		var sts = [];
		for(var j = 0; j<kb.knowledge.length; ++j) {
			sts.push({});
			for(var i=0; i<kb.knowledge[j].lvals.length; ++i)
				if(kb.knowledge[j].lvals[i] && !kb.knowledge[j].lvals[i].flags.fuzzy)
					sts[j][i] = kb.knowledge[j].lvals[i];
		}
		return this.browse(nul.browse.contextualize(sts, 0));
	}.perform('nul.xpr->known').xKeep(),
	
	//Take the side-effected value of this expression
	extraction: function() {
		return this.browse(nul.browse.extraction);
	}.perform('nul.xpr->extraction').xKeep(),

	
	//This expression wrapped.
	//ctxDelta-s of outer locals are incremented
	wrap: function() {
		return this.browse(nul.browse.lclShft('wrp')) || this;
	}.perform('nul.xpr->wrap').xKeep(),
	//This expression wrapped. Locals are given up.
	//ctxDelta-s of these locals and outer locals are incremented
	stpDn: function() {
		return this.browse(nul.browse.lclShft('sdn')) || this;
	}.perform('nul.xpr->stpDn').xKeep(),

	//Transform an expression from kb local-space to expression local-space and vice versa
	localise: function(inc) {
		//TODO: optimise: throw nul.unlocalisable en fonction des dépendances
		var rv = this.clone();
		return rv.browse(nul.browse.localise(inc||0)) || rv;
	}.perform('nul.xpr->localise').xKeep(),
	//Shortcut: Weither this epression is free of dependance toward external locals
	free: function() { return nul.lcl.dep.free(this.deps); }.perform('nul.xpr->free'),
	//If the root expression of this operand will be kept forever
	finalRoot: function() { return !this.operate && 'local'!= this.charact; },
	//If this expression is self-refering
	selfRef: function() { return this.deps[0] && this.deps[0][nul.lcl.slf]; },
	//If this operand will keep this value forever
	fixed: function() { return this.free() && this.finalRoot() && !this.selfRef(); },
	subFixed: function() { return !trys(this.components, function(o) { return !o.fixed(); }) },
	operable: function() { return !!this.operate; },
	clean: function() { delete this.flags.dirty; return this; },
	dirty: function() {
		if(this.operable() || this.components) this.flags.dirty = true;
		return this;
	},
	
	compose: function(nComps) {
		if(['[]',':','=','&','|','^','+','*','&&','||'].contains(this.charact)) {
			var nc = [];
			while(0<nComps.length) {
				var tc = nComps.pop();
				if(tc.charact == this.charact) nComps.pushs(tc.xadd(this.x).components);
				else nc.unshift(tc);
			}
			nComps = nc;
		}
		if(isArray(nComps)) this.components.slice(0);
		merge(this.components, nComps);
		return this.integre().composed().integre().summarised(true);
	}.perform('nul.xpr->compose').xKeep(),
	xed : function(kb, way, axs) {
		var i, xpr = this;
		if(0<way) for(i=2; i<arguments.length; ++i) xpr = xpr.xadd(arguments[i]);
		else for(i=arguments.length-1; i>=2; --i) xpr = xpr.xadd(arguments[i]);
		return xpr;
	},
	xadd: function(x, kb) {
		var tx = this.integre().x;
		if(x.x) x = x.x;
		//This dirty comes from the unification created (just the line under) in the attributes
		if(!kb && trys(x.attributes, function(o, i) { return !tx.attributes[i]; } )) this.dirty();
		this.x.xadd(x,kb);
		return this.summarised();
	}.perform('nul.xpr->xadd'),
//Debug purpose
	integre: function() {
		if(nul.debug.assert && this.integrity) assert(this.integrity(),
			'Integrity : ' + this.dbgHTML());
		return this;
	}
};