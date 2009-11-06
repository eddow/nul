/*  NUL language JavaScript framework
 *  (c) 2009 E-med Ware
 *
 * NUL is freely distributable under the terms of GNU GPLv3 license.
 *  For details, see the NUL project site : http://code.google.com/p/nul/
 *
 *--------------------------------------------------------------------------*/

nul.xpr.knowledge.addMethods(/** @lends nul.xpr.knowledge# */{
 	/**
 	 * Remove any information about locals that are not refered anymore
 	 * @param {nul.dependance.usage} deps
 	 * remove all access before : these are not preserved
 	 */
 	pruned: function(value) {
 		this.modify();
		this.clearAccess();
 		var vdps = new nul.dependance();
		
		if(value) vdps.also(value.dependance());
		for(var i in this.ior3) if(cstmNdx(i) && this.ior3[i]) vdps.also(this.ior3[i].dependance());
		for(var i in this.veto) if(cstmNdx(i) && this.veto[i]) vdps.also(this.veto[i].dependance());
		vdps.also(this.rocks);
		vdps = this.localNeed(vdps.usage(this).local);

		//Remove useless equivalence class specifications
		for(var c=0; c<this.eqCls.length;) {
			this.eqCls[c] = this.eqCls[c].pruned(this, vdps);
			if(!this.eqCls[c]) this.eqCls.splice(c,1);
			else ++c;
		} 
 		
 		var deps = this.usage(value);
 		for(i=0; this.ior3[i];) switch(this.ior3[i].choices.length) {
 		case 0: throw nul.internalException('IOR3 Always has a first unconditional');
 		case 1:
 			this.merge(this.ior3[0]);
 			this.ior3.splice(i, 1);
 			break;
 		default: ++i; break;
 		}
 		
 		//Remove trailing unrefered locals (not more to preserve indexes)
		while(this.nbrLocals() && !deps.local[this.nbrLocals()-1]) this.freeLastLocal();
 		this.useLocalNames(deps.local);
 		
 		return this;
 	}.describe('Prune', function(value) {
		return this.name+': ' + (value?(value.dbgHtml()+' ; '):'') + this.dbgHtml();
	}),

	/**
	 * Make the need envelope of locals.
	 * If at least 'lcls' are needed to determine a value, then determine which locals are needed
	 * to determine a value, for this knowledge, regarding the equivalence classes
	 * @param {association(ndx: any)} lcls List of needed locals at least
	 * @return {association(ndx: true)} lcls List of needed locals
	 */
	localNeed: function(lcls) {
		lcls = map(lcls,function() { return 3; });
		var toNeed = Object.keys(lcls);
		///1: calculate influences
		var max = function(a,b) { return !a?b:!b?a:a>b?a:b; };
		/**
		 * Change the list of local needs and determine which local is discovered needed
		 * knowing that local 'ndx' is needed 'infl' (infl = 1(belong) or 2(equival))
		 * @param {index} ndx Local index
		 * @param {association(ndx:influence)} infl Influence = 1: something belongs to this local. 2: Something is equived to this local
		 * @param {association(ndx:need)} lcls how locals are already known to be needed
		 * @return {array[index]} Locals freshly disvorered to be needed
		 */
		var influence = function(infl, lcls) {
/*(infl[ndx] \ lcls[ndx] :	('>' means 'more than 2')
 * 			0	1	2	>
 * 		1	1	1	>	>
 * 		2	2	>	>	>
 */
 			var rv = [];
 			for(var ndx in infl)
				if( (1!= lcls[ndx] || 1!= infl[ndx]) &&	
					(!lcls[ndx] || 2>= lcls[ndx]) &&
					(2< (lcls[ndx] = (lcls[ndx]||0)+infl[ndx])) )
						rv.push(ndx);
			return rv;
		};
		var lclInfl = {};	//nx => {ndx: [0, 1, 2]}
		//	0: no need
		//	1: define content
		//	2: define equivalence
		for(var c=0; c<this.eqCls.length; ++c) {
			var ec = this.eqCls[c];
			var elms = [];
			elms.pushs(ec.equivls);
			elms.pushs(ec.belongs);
			var extInfl = false;
			
			//Compute influence from other knowledge.
			// If influence from several elements, influence the whole class
			// If influence from only one element, influence the class without that element 
			for(var e in elms) if(cstmNdx(e) &&
				('local'!= elms[e].expression || this.name!= elms[e].klgRef)) {
					extInfl = extInfl?true:e;
					if(true=== extInfl) break;
				}
			//If this refer to something defined by its attributes
			if(true!== extInfl && !isEmpty(ec.attribs,'')) extInfl = extInfl?true:'attribs:*';
			//If this refer to something equaled in absolute
			if(true!== extInfl && this.eqCls[c].eqvlDefined()) extInfl = extInfl?true:'equivls:0';
			//If this refer to something beblonging in absolute
			if(true!== extInfl && this.eqCls[c].blngDefined()) extInfl = extInfl?true:'belongs:0';
			
			if(extInfl) //If this refer to something defined in another context
				toNeed.pushs(influence(ec.influence(this, extInfl), lcls));
			if(true!== extInfl) for(var e in elms) if(cstmNdx(e)) {
				//For each usage of this element, influence each other usage of the eqclass
				for(var srcNdx in elms[e].dependance().usage(this).local)
					lclInfl[srcNdx] = ec.influence(this, e, extInfl, lclInfl[srcNdx]);
			}
		}
		//2: use influence to need all influenced locals
		while(toNeed.length)
			toNeed.pushs(influence(lclInfl[toNeed.shift()], lcls));
		return map(lcls,function(i, o) { return 3<=o; });
	},
	
  	/**
 	 * Know that all the arguments are unifiable
 	 * Modifies the knowledge
 	 * @param {nul.xpr.object} and {nul.klg.eqClass}
 	 * @return {nul.klg.eqClass} unsummarised (if in a higher-stack level unification) or summarised
 	 * @throws {nul.failure}
 	 */
 	unification: function() { 	
 		var toUnify = beArrg(arguments);
 		this.modify();
 		var dstEqCls = new nul.klg.eqClass();
 		var alreadyBlg = {};	//TODO 3: make a 'belong' this.access ?
 		var toBelong = [];
 		var ownClass = true;
 		try {
	 		while(toUnify.length || toBelong.length) {
	 			while(toUnify.length) {
		 			var v = toUnify.shift();
		 			nul.xpr.use(v);
		 			if(this.access[v]) {
		 				v = this.access[v];
		 				if(dstEqCls=== v) {}
		 				else if(!v.summarised) {	//If not summarised, then it's a class built in another unification higher in the stack
		 					ownClass = false;
		 					this.unaccede(dstEqCls);
		 					dstEqCls.merged = v;
		 					v = dstEqCls;
		 					dstEqCls = v.merged;
		 				}
		 				else this.removeEC(v);
		 			}
		 			if(dstEqCls=== v) {}
		 			else if('eqCls'== v.expression) {
		 				toUnify.pushs(v.equivls);
						toBelong.pushs(v.belongs);
						dstEqCls.hasAttr(v.attribs, this);
		 			} else {
		 				this.access[v] = dstEqCls;
		 				dstEqCls.isEq(v, this);
		 			}
		 		}
		 		if(toBelong.length) {
		 			var s = toBelong.shift();
					alreadyBlg[s] = true;
					dstEqCls.isIn(s, this);
		 		}
	 		}
	 		if(ownClass) this.ownEC(dstEqCls);
 		} catch(err) {
 			throw nul.exception.notice(err);
 		}
		return dstEqCls;
 	}.describe('Unification', function() {
 		return map(beArrg(arguments), function() { return this.dbgHtml(); }).join(' = ');
 	}),

 	/**
 	 * Get a pruned possible
 	 * @param {nul.xpr.object} value
	 * @return {nul.xpr.possible}
	 * @throws {nul.failure}
 	 */
 	wrap: function(value) {
 		this.modify(); nul.obj.use(value);
		var representer = new nul.klg.represent(this);
		nul.debug.log('Represent')(this.name, 'Knowledge', this);
		for(var i=0; i<this.eqCls.length;) {
			var ec = this.eqCls[i];
			var dlc = nul.debug.lc;
			var nec = representer.subBrowse(ec);
			if(nul.browser.bijectif.unchanged == nec) ++i;
			else {
				value = representer.browse(value);
				this.removeEC(ec)
				nec = this.unify(nec);
				
				//this.unification has effect on other equivalence classes that have to change in the representer
				representer.invalidateCache();
				
				nul.debug.log('Represent')(this.name, 'Knowledge', this);
				i = 0;
			}
		}

		//TODO O: represent sur ior3s : useful or we let it post-resolution ?
		value = representer.browse(value);
		
		var opposition = this.veto;
		//TODO 3: browse 'vetos' like 'value'
		this.veto = [];
		while(opposition.length)
			this.oppose(representer.browse(opposition.shift()));
 		this.pruned(value);
 		
 		return new nul.xpr.possible(value, this.built());
 	}.describe('Wrapping', function(value) {
 		//TODO4: standardise the knowledge name in logs
		return this.name+': ' + value.dbgHtml() + ' ; ' + this.dbgHtml();
	})
	
});