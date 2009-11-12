/*  NUL language JavaScript framework
 *  (c) 2009 E-med Ware
 *
 * NUL is freely distributable under the terms of GNU GPLv3 license.
 *  For details, see the NUL project site : http://code.google.com/p/nul/
 *
 *--------------------------------------------------------------------------*/

nul.klg.eqClass = Class.create(nul.expression, /** @lends nul.klg.eqClass# */{
//TODO 4: rename local when we have a non-anonymous name
	/**
	 * Represent a list of values that are known unifiable, along with the sets they're known in and their known attributes 
	 * @extends nul.expression
	 * @constructs
	 * @param {nul.xpr.object} obj An object the class is initialised zith
	 * @param {Attributes} attr The attributes the object is known zith
	 */
	initialize: function(obj, attr) {
 		if(obj && 'eqCls'== obj.expression) {
			this.equivls = map(obj.equivls);	//Equal values
			this.belongs = map(obj.belongs);	//Sets the values belong to
			this.attribs = map(obj.attribs);	//Sets the attributes owned
 		} else {
			this.equivls = obj?[obj]:[];
			if(obj) this.represent(obj);
			this.belongs = [];
			this.attribs = attr || {};
		}
	},

//////////////// private
	
	/**
	 * Order the values to equal.
	 * @param {nul.xpr.object} v
	 * @param {nul.xpr.knowledge} klg 
	 * @return A big number if not interesting, a small one if a good "replacement value"
	 * Note: v is undefined 
	 */
	orderEqs: function(v, klg) {
		//if(nul.obj.local.is(v) && nul.obj.local.self.ref == v.klgRef) return -2;
		if(v.defined) return -1;
		var d = v.dependance();
		var rv = 0;
		if('local'!= this.expression || klg.name!= this.klgRef) rv += 1;
		if(klg && !isEmpty(d.usage(klg).local)) rv += 2;
		if(v.anonymous) rv += 0.5;
		return rv;
	},

//////////////// public equivalence class modification

	/**
	 * Retrieve the representant of this equivalence class, knowing that it could be 'obj' also.
	 * @param {nul.xpr.object} obj
	 * @return {nul.xpr.object}
	 */
	represent: function(obj) {
		return this.equivls[0];
		if(obj && (!this.representant || this.orderEqs(obj) < this.orderEqs(this.representant))) this.representant = obj;
		nul.xpr.use(this.representant);
		return this.representant;
	},
	
	/**
	 * Add an object in the equivlence.
	 * @param {nul.xpr.object} o object to add
	 * @param {nul.xpr.knowledge} klg
	 * @return nothing
	 * @throws {nul.failure}
	 */
	isEq: function(o, klg) {
 		this.modify(); nul.obj.use(o);
		//Add an object to the equivalence class
		nul.obj.use(o);
		if(o.defined) {
			if(this.eqvlDefined())
				nul.trys(function() {
					nul.klg.mod(klg);
					var unf;
					try {
						unf = this.equivls[0].unified(o, klg);
					} catch(err) {
						if(this.equivls[0].expression == o.expression) throw err;
						nul.failed(err);
						unf = o.unified(this.equivls[0], klg);
					}
					if(true=== unf) unf = this.equivls[0];
					else {
						if(nul.debug.assert) {
							assert(klg.access[this.equivls[0]] == this, 'Access consistence');
							assert(klg.access[o] == this, 'Access consistence');
						}
						//TODO O: still let 'o' and 'this.equivls[0]' so they are replaced straight in representation ?
						delete klg.access[o];
						delete klg.access[this.equivls[0]];
						klg.access[unf] = this;
						this.equivls[0] = unf;
					}
					return this.represent(unf);
				}, 'Equivalence', this, [this.equivls[0], o]);
			else {
				this.equivls.unshift(o);
				this.hasAttr(this.attribs, klg);
			}
 			this.wedding(klg);
		} else {
			var p = 0;
			var ordr = this.orderEqs(o, klg);
			for(p=0; p<this.equivls.length; ++p) if(ordr<this.orderEqs(this.equivls[p], klg)) break;
			this.equivls.splice(p,0,o);
		}
		return this.represent(o);
	},

	/**
	 * Add an object as a belongs.
	 * @param {nul.xpr.object} o object that belongs the class
	 * @param {nul.xpr.knowledge} klg
	 * @throws {nul.failure}
	 */
	isIn: function(s, klg) {
 		this.modify(); s.use();
 		if(s.defined) {
 			while(true) {
 				var ntr = null, sn;
	 			for(sn=0; this.belongs[sn] && this.belongs[sn].defined; ++sn) {
	 				var ntr = this.intersect(klg, s, this.belongs[sn]);
	 				if(ntr) break;
	 			}
 				if(ntr) {
 					this.belongs.splice(sn,1);
 					s = ntr;
 				} else {
 					this.belongs.unshift(s);
 					break;
 				}
 			}
 			this.wedding(klg);
 		} else {
 			var b;
 			for(b=0; this.belongs[b]; ++b) if(this.belongs[b].toString() == s.toString()) break;
 			if(!this.belongs[b]) this.belongs.push(s);
 		}
	},
	
	/**
	 * Specify attributes
	 * @param {Attributes} attrs 
	 * @param {nul.xpr.knowledge} klg
	 * @return {Boolean} Weither the call was useless
	 * @throws {nul.failure}
	 */
	hasAttr: function(attrs, klg) {
		this.modify();
		var useless = true;
		if(this.eqvlDefined()) {
			for(var an in attrs) klg.unify(attrs[an], this.equivls[0].attribute(an, klg));
			useless = isEmpty(attrs);
			this.attribs = {};
		} else if(this.attribs !== attrs) {	//TODO 3: gardien est-il necessaire?
			merge(this.attribs, attrs, function(a,b) {
				if((a?a.toString():'')==(b?b.toString():'')) return a;
				useless = false;
				return (a&&b)?klg.unify(a,b):(a||b);
			});
			if(!useless) this.wedding(klg);
		}
		return useless;
	},

	/**
	 * Sets the information that defines the values : the attributes and the defined belong
	 * @param {nul.klg.eqClass} def The class that give some definitions for me
	 * @param {nul.xpr.knowledge} klg The knowledge of this class
	 * @returns {Boolean} Weither something changed
	 */
	define: function(def, klg) {
		var rv = false;
		for(var a in def.attribs) if(this.attribs[a] && def.attribs[a] != this.attribs[a]) {
			rv = true;
			klg.unify(def.attribs[a], this.attribs[a]);
			delete this.attribs[a];
		}
		//rv |= !this.hasAttr(def.attribs, klg);
		return rv;
	},	
	
////////////////	private equivalence class modification

	/**
	 * Try to apply what we know about defined equivalents, defined belongs and attributes
	 * @param {nul.xpr.knowledge} klg
	 */
	wedding: function(klg) {
		nul.klg.mod(klg);
		var unf = this.equivls[0];
		if(!isEmpty(this.attribs) && !unf && this.blngDefined()) {
			unf = klg.newLocal(nul.understanding.rvName);
			klg.access[unf] = this;
			this.equivls.unshift(unf);
		}
		for(var sn=0; this.belongs[sn] && this.belongs[sn].defined;) {
			var attrs = this.attribs;
			if('lambda'== unf.expression) attrs = klg.attributes(unf.image);
			var chx = this.belongs[sn].has(unf, attrs);
			if(chx) {
				this.belongs.splice(sn,1);
				unf = klg.hesitate(chx);
				delete klg.access[this.equivls[0]];
				klg.access[this.equivls[0] = unf] = this;
			}
			else ++sn;
		}
	},
	
	/**
	 * Try to see the intersections of these two sets - knowing that these two sets can have different 'oppinions' about it.
	 * Fails when both intersection fail, gives nothing when both intersection give nothing, else give any of the result the intersection gave.
	 * @param {nul.xpr.knowledge} klg
	 * @param {nul.obj.defined} s1
	 * @param {nul.obj.defined} s2
	 * @return {nul.obj.defined | null} Nothing if nothing can still be said
	 * @throws {nul.failure}
	 */
	intersect: function(klg, s1, s2) {
		if(s1==s2) return s1;
		var rv;
		var trueDft = function(c,d) { return (true===c)?d:c; };
		
		return nul.trys(function() {
			try {
				rv = s1.intersect(s2, klg);
				if(rv) return trueDft(rv, s1);					//If (1 & 2) give a result, don't even wonder what (2 & 1) is, just be happy with that
			} catch(err) {
				nul.failed(err);								//If (1 & 2) failed, try to give (2 & 1)
				return trueDft(s2.intersect(s1, klg), s2);		//If (2 & 1) failed too, just fail
			}
			//We're here when (1 & 2) returns nothing
			try {
				return trueDft(s2.intersect(s1, klg), s2);		//If (2 & 1) give a result, while (1 & 2) had nothing to say, just take that as the answer
			} catch(err) {
				nul.failed(err);								//If (2 & 1) failed, we'r not sure, while (1 & 2) didn't fail or give a result
			}
			//So we returns nothing
		}, 'Intersection', this, [s1, s2]);
	},

////////////////	public prune system
	
	/**
	 * Compute the influence of this equivalence class (excluded 'exclElm')
	 * @param {nul.xpr.knowledge} klg
	 * @param {String: integer} excl Element to exclude, from the summary.components
	 * @param {association(ndx=>infl)} already The influences already computed (modified by side-effect)
	 * @return {association(ndx=>infl)} Where 'ndx' is a local index and 'infl' 1 or 2 
	 */
	influence: function(klg, excl, only, already) {
		var rv = already || {};
		var eqc = this;
		var destSelect = function(cn, ndx) {
			return excl!= cn+':'+ndx && excl!= cn+':*' &&
				(!only || only==cn+':'+ndx || only==cn+':*' || (Object.isUndefined(ndx) && cn==only.substr(0, cn.length)));
		};
		var subInfluence = function(cn, infl) {
			if(destSelect(cn))
				for(var e in eqc[cn]) if(cstmNdx(e) && destSelect(cn, e))
					for(var ndx in eqc[cn][e].dependance().usage(klg).local)
						if(!rv[ndx] || rv[ndx]<infl) rv[ndx] = infl;
		};
		subInfluence('equivls', 2);
		subInfluence('belongs', 1);
		subInfluence('attribs', 2);
		return rv;
	},
	
	/**
	 * Remove items that are not used in this knowledge
	 * Not used = depending on nothing else than the useless locals of thisknowledge
	 * @param {nul.xpr.knowledge} klg Pruned knowledge this class belongs to
	 * @param {association(ndx: true)} lcls List of used locals
	 */
	pruned: function(klg, lcls) {
		var remover = function() {
			if('local'!= this.expression || 
					klg.name!= this.klgRef ||
					lcls[this.ndx])
				return this;
		};
		var nVals = maf(this.equivls, remover);
		var nBlgs = maf(this.belongs, remover);
		//TODO 3: FA: do we forget attributes ?
		//FA var nAtts = maf(this.attribs, remover);
		if(nVals.length == this.equivls.length && nBlgs.length == this.belongs.length
			/*FA && nAtts.length == this.attribs.length*/) return this;
		var rv = this.modifiable();
		rv.equivls = nVals;
		rv.belongs = nBlgs;
		//FA rv.attribs = nAtts;
		return rv.built().placed(klg); 
	},
	
////////////////	public 
	
	/**
	 * Is the equivalences defined or is there only undefined objects unified ?
	 * @return {Boolean}
	 */
	eqvlDefined: function() { return this.equivls.length && this.equivls[0].defined; },
	/**
	 * Is the belonging sets defined or is there only undefined sets whose the class belongs to ?
	 * @return {Boolean}
	 */
	blngDefined: function() { return this.belongs.length && this.belongs[0].defined; },

	/**
	 * Determines weither this class defines elements of obj
	 * @param {nul.xpr.object} obj
	 * @return {Number} Index in belongs or -1 if not found
	 */
	extend: function(obj) {
		for(var b=0; this.belongs[b]; ++b)
			if(obj.toString() == this.belongs[b].toString())
				return b;
	},
	
//////////////// nul.expression implementation
	
	/** @constant */
	expression: 'eqCls',
	/** @constant */
	components: {
		'equivls' : {type: 'nul.xpr.object', bunch: true},
		'belongs' : {type: 'nul.xpr.object', bunch: true},
		'attribs' : {type: 'nul.xpr.object', bunch: true}
	},

	placed: function($super, prnt) {
		nul.klg.mod(prnt);
		if(!this.equivls.length && isEmpty(this.attribs,'') && 1== this.belongs.length && this.blngDefined()) {
			if('&phi;'== this.belongs[0].expression) nul.fail("&phi; is empty");
			return;
		}
		//TODO 4: this goes in knowledge prune (cf comment in prune) : pruned called on wrap and generl built (for opposition, ior3, ...)
		if(!this.belongs.length && (!this.equivls.length || 
			(1== this.equivls.length && isEmpty(this.attribs))))
				return;
		return $super(prnt);
	}
});
