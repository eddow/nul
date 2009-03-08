/*  NUL language JavaScript framework
 *  (c) 2009 François Marie De Mey
 *
 * NUL is freely distributable under the terms of GNU GPLv3 license.
 *  For details, see the NUL project site : http://code.google.com/p/nul/
 *
 *--------------------------------------------------------------------------*/
 
nul.xpr = {	//Main interface implemented by all expressions
	isXpr: true,
	clone: function(nComps, nAttrs) {
		var rv = clone1(this);
		if(nComps) rv.components = nComps;
		else if(rv.components) rv.components = map(this.components, function() { return this.clone(); });
		rv.x = clone1(rv.x);
		rv.x.attributes = nAttrs || map(this.x.attributes, function() { return this.clone(); });
		return rv.integre();
	}.perform('nul.xpr->clone').xKeep(),
	clone1: function() {
		return this.clone(clone1(this.components),clone1(this.x.attributes));
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
		if((trys(xpr.x.attributes, function(i) {
			return !txpr.x.attributes[i];
		}) || trys(this.x.attributes, function(i) {
			return !xpr.x.attributes[i] || !this.cmp(xpr.x.attributes[i]);
		}))) return false;
		if( this.components || xpr.components ) {
			if(!this.components || !xpr.components || this.components.length != xpr.components.length)
				return false;
			return !(trys(xpr.components, function(i) {
				return !txpr.components[i];
			}) || trys(this.components, function(i) {
				return !xpr.components[i] || !this.cmp(xpr.components[i]);	
			}));
		}
		switch(this.charact) {
			case 'atom': return this.value == xpr.value;
			case 'local': return this.lindx == xpr.lindx && this.ctxName==xpr.ctxName;
			case 'native': return this.name == xpr.name; 
		}
		throw nul.internalException('Unknown expression to compare : '+this.charact);
	}.perform('nul.xpr->cmp'),
/* Makes a summary of components and characteristics :
 *  Fix flags, dependances, ...
 * If First is specified, don't raise 'dirty' automatically
 */
	summarised: function(first) {
		//TODO: vérifier qu'il n'y a pas de redondance : NE PAS TROP SUMMARISER
		var dps = [];
		var flags = {};
		var ndx = '';
		var sumSubs = function() {
			if(nul.debug.assert) assert(this.deps,'Subs summarised.'); 
			dps.push(this.deps);
			for(var f in this.flags) flags[f] = true;
			ndx += '|' + this.ndx;
		};
		if(this.components) map(this.components, sumSubs);
		map(this.x.attributes, sumSubs);
		if(this.acNdx) this.ndx = this.acNdx;
		else this.ndx = '[' + this.charact + ndx + ']';
		if(['{}', ';'].contains(this.charact)) delete flags.fuzzy;
		if(['[-]','[]'].contains(this.charact)) flags.fuzzy = true;
		
		if(this.makeDeps) dps.push(this.makeDeps());
		this.deps = nul.lcl.dep.mix(dps);
		if('ctx'== this.freedom) {
			this.used = this.deps[this.ctxName] || {};
			delete this.deps[this.ctxName];
		}
		if(this.arCtxName) {
			if(this.deps[this.arCtxName]) delete this.deps[this.arCtxName];
			else delete this.arCtxName;
		}
		if(this.failableNature() || (this.isFailable && this.isFailable())) flags.failable = true;

		if((!this.flags || this.flags.dirty) && !flags.dirty && this.operable()) flags.dirty = true;
		this.flags = flags;
		
		return this;
	}.perform('nl.xpr->summarised').xKeep(),
	//Be sure the expression is operated until it's not dirty anymore
	composed: function() { return this.integre(); },	
	//Get a list of non-fuzzy expressions
	solve: function() {
		//if(nul.debug) nul.debug.log('kbLog')(
		//	nul.debug.lcs.collapser('Solving'), nul.debug.logging?this.dbgHTML():'');
		var sltn;
		try {
			sltn = nul.solve.solve(this.integre());
		} finally {
			/*if(nul.debug) {
				if(sltn) nul.debug.log('kbLog')(
					nul.debug.lcs.endCollapser('Solved', 'Solved'), sltn.length + ' possibiliti(es)');
				else nul.debug.log('kbLog')(
					nul.debug.lcs.endCollapser('Aborted', 'Unsolvable'), nul.debug.logging?this.dbgHTML():'');
			}*/			
		}
		return sltn;
	}.perform('nul.xpr->solve'),
	//Gets the value of this expression after operations effect (unifications, '+',  ...)
	evaluate: function(kb) {
		if(!kb) kb = nul.kb();
		var rv = this;
		var dbgCpt = 0;
		while(rv.flags.dirty) {
			if(nul.debug.assert) assert(50>++dbgCpt, 'Finite loop');
			rv = rv.browse(nul.browse.evaluate(kb)) || rv.clean();
		}
		return rv;
	}.perform('nul.xpr->evaluate').xKeep(),
	//Replace this context's locals according to association/table <ctx>
	known: function(knwlg) {
		var tt = {};	//Transformation table
		for(var i= 0; i<knwlg.length; ++i)
			if('='== knwlg[i].charact) {
				var rplBy = knwlg[i].components[0];
				if(!rplBy.flags.fuzzy) for(var c=1; c<knwlg[i].components.length; ++c) {
					var rplOrg = knwlg[i].components[c];
					if(!rplBy.contains(rplOrg) /*&& 'local'== rplOrg.charact*/)
						tt[rplOrg.ndx] = rplBy;
				}
			}
		return this.contextualise(tt, 'knwl');
	},
	contextualise: function(tt, prtct) {
		if(isEmpty(tt)) return this;
		return this.browse(nul.browse.contextualise(tt, prtct)) || this;
	}.perform('nul.xpr->contextualise').xKeep(),

	//Specify that occurences of <xpr> in <this> expression are indeed self-references
	setSelfRef: function(xpr) {
		var tt = {};
		if(!this.arCtxName) this.arCtxName = 'ar'+(++nul.understanding.srCtxNames);
		tt[xpr.ndx] = nul.build.local(this.arCtxName,nul.lcl.slf, xpr.dbgName?xpr.dbgName:null);
		return this.contextualise(tt);
	},
	contains: function(xpr) {
		return -1<this.ndx.indexOf(xpr.ndx);
	},
	//Take the side-effected value of this expression
	extraction: function() {
		return this.browse(nul.browse.extraction);
	}.perform('nul.xpr->extraction').xKeep(),

	//Shortcut: Weither this epression is free of dependance toward external locals
	free: function() { return nul.lcl.dep.free(this.deps); }.perform('nul.xpr->free'),
	//If the root expression of this operand will be kept forever
	finalRoot: function() { return !this.operate && 'local'!= this.charact; },
	//If this operand will keep this value forever
	fixed: function() { return this.free() && this.finalRoot() },
	subFixed: function() { return !trys(this.components, function() { return !this.fixed(); }) },
	operable: function() { return !!this.operate; },
	clean: function() { delete this.flags.dirty; return this; },
	dirty: function() {
		if(this.operable() || this.components) this.flags.dirty = true;
		return this;
	},
	
	compose: function(nComps) {
		if(!nComps) {
			if(!this.components) return this.composed();
			nComps = this.components;
		}
		//TODO: '[]',':' use sub-components
		if(['[]',':','=','&','|','^','+','*','&&','||'].contains(this.charact)) {
			var nc = [];
			while(0<nComps.length) {
				var tc = nComps.pop();
				if(tc.charact == this.charact) nComps.pushs(tc.xadd(this).components);
				else nc.unshift(tc);
			}
			nComps = nc;
		}
		if(nComps!== this.components) {
			if(isArray(nComps)) this.components.splice(0);
			merge(this.components, nComps);
		}
		return this.integre().summarised().composed().integre();
	}.perform('nul.xpr->compose').xKeep(),
	xed : function(kb, way, axs) {
		var i, xpr = this;
		if(0<way) for(i=2; i<arguments.length; ++i) xpr = xpr.xadd(arguments[i], kb);
		else for(i=arguments.length-1; i>=2; --i) xpr = xpr.xadd(arguments[i], kb);
		return xpr;
	},
	xadd: function(x, kb) {
		var tx = this.integre().x;
		if(x.x) x = x.x;
		//This dirty comes from the unification created (just the line under) in the attributes
		if(!kb && trys(x.attributes, function(i) { return !tx.attributes[i]; } )) this.dirty();
		this.x.xadd(x,kb);
		return this.summarised();
	}.perform('nul.xpr->xadd'),
	
////////// Failability management
	
	//Gets weither this expresion i failable by itself (cf. attributes, ...)
	failableNature: function() {
		return ['<<+','=',':=','?','[-]'].contains(this.charact) ||
			(!this.fixed() && !isEmpty(this.x.attributes));
	},
	//Return the failable parts of this expression in an array
	// The ones the inner expression doesn't know, depending on attributes and generic props
	failables: function() {
		if(this.failableNature()) return [this];
		var rv = [];
		if(this.isFailable && this.isFailable()) {
			//Add 'this' but without the attributes
			rv = [clone1(this)];
			rv[0].x = clone1(this.x);
			rv[0].x.attributes = {};
		} else if(!this.isFailable)
			map(this.components, function() {
				if(nul.debug.assert) assert(this.failables, 'Only xprs')
				rv.pushs(this.failables());
			});
		map(this.x.attributes, function() { rv.pushs(this.failables()); });

		return rv;
	},
	handle: function() { return this.x.attributes['+handle']; },
	handled: function(k) {
		if(k) this.x.attributes['+handle'] = k;
		else delete this.x.attributes['+handle'];
		return this;
	},
//Debug purpose
	integre: function() {
		if(nul.debug.assert && this.integrity) assert(this.integrity(),
			'Integrity : ' + this.dbgHTML());
		return this;
	}.perform('nul.xpr->integre')
};