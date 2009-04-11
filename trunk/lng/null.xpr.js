/*  NUL language JavaScript framework
 *  (c) 2009 François Marie De Mey
 *
 * NUL is freely distributable under the terms of GNU GPLv3 license.
 *  For details, see the NUL project site : http://code.google.com/p/nul/
 *
 *--------------------------------------------------------------------------*/
 
nul.xpr = {	//Main interface implemented by all expressions
	isXpr: true,
	clone: function(nComps) {
		var rv = clone1(this);
		if(nComps) rv.components = nComps;
		else if(rv.components) rv.components = map(this.components, function() { return this.clone(); });
		return rv.integre();
	}.perform('nul.xpr->clone').xKeep(),
	clone1: function() {
		return this.clone(clone1(this.components));
	}.perform('nul.xpr->clone').xKeep(),
	toHTML: nul.text.toHTML,
	toString: nul.text.toString,
	dbgHTML: function() {
		if(!nul.debug.logging) return 'dbg';
		var str = this.toString();
		if(str.length < 250) return this.toHTML();
		return str;
	},
	browse: nul.browse.recursion.xKeep(),
	//Just compare : returns true or false
	cmp: function(xpr) {
		return this.ndx == xpr.ndx;
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
	fixTypes: function(types) {
		return this.browse(nul.browse.fixTypes(types)) || this;
	},
	//Specify that occurences of <xpr> in <this> expression are indeed self-references
	setSelfRef: function(xpr) {
		var tt = {};
		if(!this.arCtxName) this.arCtxName = 'ar'+(++nul.understanding.srCtxNames);
		tt[xpr.ndx] = nul.build.local(this.arCtxName,nul.lcl.slf, xpr.dbgName?xpr.dbgName:null);
		return this.contextualise(tt);
	},
	//Weither an expression contains another one or not
	contains: function(xpr) {
		if('string'!= typeof xpr) xpr = xpr.ndx;
		return -1<this.ndx.indexOf(xpr);
	},
	//Take the side-effected value of this expression
	extraction: function() {
		var rv = this.browse(nul.browse.extraction);
		if(rv) return rv.evaluate()||rv;
	}.perform('nul.xpr->extraction').xKeep(),

	//Until the function <forApi> is available or no extraction can be done anymore
	//Until the function <forApi> is available or no extraction can be done anymore
	extractInterface: function(forApi) {
		var rv = this;
		while(!rv[forApi]) {
			var nt = rv.extraction();
			if(!nt) throw nul.semanticException('uh?', 'Expected interface to '+forApi+' : ' + rv.toString());
			rv = nt;
		}
		return function() {
			return rv[forApi].apply(rv, arrg(arguments));
		}
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
		//TODO: '[]',':' use sub-components : distribué au solve
		if(['[]',':','=','&','|','^','+','*','&&','||'].contains(this.charact)) {
			var nc = [];
			while(0<nComps.length) {
				var tc = nComps.pop();
				if(tc.charact == this.charact) nComps.pushs(tc.xadd(this.x).components);
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

////////// Attributes management

	xadd: function(x) {
		if('undefined'== typeof x) return this;
		if('string'== typeof x) x = nul.primitive[x];
		this.x = this.x?nul.primitive.mix(x,this.x):x;
		return this.summarised();
	}.perform('nul.xpr->xadd'),
	
////////// Failability management
	
	//Gets weither this expresion i failable by itself (cf. attributes, ...)
	failableNature: function() {
		return ['<<+','=',':=','[-]','<','>'].contains(this.charact)/* ||
			(!this.fixed() && !isEmpty(this.x))*/;
	},
	//Return the failable parts of this expression in an array
	// The ones the inner expression doesn't know, depending on attributes and generic props
	failables: function() {
		if(this.failableNature()) return [this];
		var rv = [];
		if(this.isFailable && this.isFailable()) {
			//Add 'this' but without the attributes
			rv = [clone1(this)];
			rv[0].x = {};
		} else if(!this.isFailable)
			map(this.components, function() {
				if(nul.debug.assert) assert(this.failables, 'Only xprs')
				rv.pushs(this.failables());
			});
		map(this.x, function() { rv.pushs(this.failables()); });

		return rv;
	},
	handled: function(h, kb) {
		//TODO: si !h.x.handeling alors error : pas dft behav!
		if(!(this.x && h.x)) return nul.build.handle(h, this).xadd(this.x,kb).clean();
		return (h.x.handeling || function(hr, hd, vh, kb) {
			return vh(hr, hd, kb);
		})(h, this, this.x.valHandle || function(hr, hd, kb) {
			return nul.unify.level(hr, hd, kb);
		}, kb);
	},

//Debug purpose
	integre: function() {
		if(nul.debug.assert && this.integrity) assert(this.integrity(),
			'Integrity : ' + this.dbgHTML());
		return this;
	}.perform('nul.xpr->integre')
};
