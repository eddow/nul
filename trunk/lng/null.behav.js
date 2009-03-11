/*  NUL language JavaScript framework
 *  (c) 2009 François Marie De Mey
 *
 * NUL is freely distributable under the terms of GNU GPLv3 license.
 *  For details, see the NUL project site : http://code.google.com/p/nul/
 *
 *--------------------------------------------------------------------------*/
 
nul.behav = {
	freedom: {
		finalise: function(kb) {
			if('{}'== this.charact) this.removeUnusedKnowledge();
			return this.composed();
		}.perform('freedom->finalise').xKeep(),

		freedomHTML: function() {
			var rv = '';
			if(this.components.value) {
				if(0<this.components.length) return ''+
					'<table class="xpr freedom"><tr><td class="freedom">' +
					this.components.value.toHTML() +
					'</td></tr><tr><th class="freedom">' +
					nul.text.expressionHTML(';', this.components) +
					'</th></tr></table>';
				return this.components.value.toHTML();
			}
			if(0<this.components.length) return nul.text.expressionHTML(';', this.components);
			return '<span class="failure">Ok</span>';
		},
		freedomString: function() {
			var rv = '';
			if(this.components.value) rv =
				this.components.value.toString() + (0<this.components.length?'; ':'');
			if(0<this.components.length)
				rv += nul.text.expressionString(';', this.components);
			return rv;
		},
		integrity: function() {
			return this.charact == {kw:'kw', ctx:'{}'}[this.freedom];
		}
	},
	htmlPlace: {
		transform: function() { return true; },
		take: function() {},
		extract: function() {
			return nul.build.list(nul.html(this.element.innerHTML)).xadd(this);
		}.xKeep(),
		append: function(itm) {
			if(itm.toXML) {
				this.element.innerHTML += itm.toXML();
				return itm;
			}
			if(itm.value) {
				this.element.innerHTML += itm.value;
				return nul.build.atom('#text');
			}
			throw nul.semanticException('XML element expected for appending');
		},
		isFailable: function() { return false; }
	},
	dataTable: {
		transform: function() { return true; },
//		take: function() {},
//		append: function(itm) {},
		isFailable: function() { return false; }
	},

	application: {
		operable: function() {
			return this.components.object.finalRoot();
		},
		operate: function(kb) {
			if(!this.components.object.take)
				throw nul.semanticException('Not a set : '+ this.components.object.toHTML());
			var selfRef = this.components.object.arCtxName, srTt;
			if(selfRef) {
				srTt = {};
				srTt[nul.build.local(selfRef,nul.lcl.slf).ndx] = this.components.object;
			}
			if(selfRef && !isEmpty(this.components.applied.deps)) return;
			var rv = this.components.object.take(this.components.applied, kb, 1);
			if(rv) {
				//TODO: optimise recursion
				while(selfRef && rv.deps[selfRef]) {
					for(var v in srTt) srTt[v] = srTt[v].clone();
					rv = rv.contextualise(srTt,'self').evaluate(kb);
				}
				return rv.xadd(this, kb);
			}
			if(!this.components.object.transform()) {
				kb.knew(this.clean().clone());
				return this.components.applied.xadd(this, kb);
			}
		}.perform('application->operate').xKeep()
	},
	kwFreedom: {
		takeFrdm: function(knwl, ctx) {
			//TODO: cela vaut-il vraiment la peine ?
			return this.composed().summarised();
		}.perform('kwFreedom->takeFrdm'),
		composed: function() {
			if(this.components &&
			this.components.value &&	//Value is not set when called from within nul.build.item
			0== this.components.length &&
			!this.components.value.flags.failable)
				return this.components.value.xadd(this);
			return this;
		},
		fail: function() {
			delete this.components;
			this.flags = this.deps = {};
			return this;
		},
		makeFrdm: function(kb) {
			kb.push(nul.knowledge(this.components));
			return this;
		}
	},
	set: nul.set.behaviour,
	seAppend: {
		extract: function() {
			return this.components.effected.extractInterface('append')
				(this.components.appended).xadd(this);
		}		
	},
	cumulExpr: {
		//operable: nul.xpr.subFixed,
		operate: function(kb)
		{
			var cps = clone1(this.components), ncps = [], o;
			while(o || 0< cps.length) {
				var c = o || cps.pop();
				if(c.fixed()) {
					c = nul.asJs(c, this.charact);
					o = cps.pop();
					while(o && o.fixed()) {
						o = nul.asJs(o, this.charact);
						c = eval( ''+nul.jsVal(o) + this.charact + nul.jsVal(c) );
						o = cps.pop();
					}
					c = nul.build.atom(c);
				} else o = null;
				ncps.unshift(c);
			}
			if(1==ncps.length) return ncps[0].xadd(this, kb);
			if(ncps.length != this.components.length)
				return this.compose(ncps).clean();
		}.perform('cumulExpr->operate').xKeep()
	},
	biExpr: {
		operable: nul.xpr.subFixed,
		operate: function(kb)
		{
			return nul.build.atom(eval('' +
				nul.asJs(this.components[0], this.charact) +
				this.charact +
				nul.asJs(this.components[1], this.charact) ))
				.xadd(this, kb);
		}.perform('biExpr->operate').xKeep()
	},
	list: {
		followed: function(flw) {
			if(flw) this.components.follow = flw;
			else delete this.components.follow;
			return this.composed();
		},
		composed: function() {
			//a, b,.. c, d,.. e ==> a, b, c, d,.. e
			while(this.components.follow && ','== this.components.follow.charact) {
				this.components.pushs(this.components.follow.components);
				this.followed(this.components.follow.components.follow);
			}
			if(
					this.components.follow &&
					'{}'== this.components.follow.charact &&
					!this.components.follow.components)
				delete this.components.follow;
			if(0== this.components.length)
				return this.components.follow || nul.build.set();
			return this;
		}.perform('list->composed').xKeep(),
		take: function(apl, kb, way) {
			var rv = [];
			var xpr = this.clone();	//TODO: please kill me :'(
			try{ rv = nul.unify.orDist(xpr.components, xpr.x, apl, kb, way); }
			catch(err) { if(nul.failure!= err) throw nul.exception.notice(err); }
			if(xpr.components.follow) {
				var kwf = nul.build.kwFreedom();
				kwf.makeFrdm(kb);
				try {
					kwf.components.value = xpr.components.follow.take(apl,kb,way).dirty();
				} catch(err) {
					kb.pop('kw');
					if(nul.failure!= err) throw nul.exception.notice(err);
				}
				if(kwf.components.value) {
					kwf = kb.pop(kwf).dirty();
					rv.push(kwf.evaluate(kb)||kwf);
				}
			}
			if(!rv.length) nul.fail();
			rv = nul.build.ior3(rv)
			return rv.operate(kb)||rv;
		}.perform('list->take')
	},
	preceded: {
		operable: nul.xpr.subFixed,
		operate: function(kb)
		{
			return nul.build
				.atom(eval( this.charact + nul.asJs(this.components[0],this.charact) ))
				.xadd(this, kb);
		}.perform('preceded->operate').xKeep()
	},
	assert: {
		operable: nul.xpr.subFixed,
		operate: function(kb)
		{
			var v = nul.asJs(this.components[0],'?');
			if('boolean'!= typeof v)
				throw nul.semanticException('Boolean expected instead of ' +
					this.components[0].toString());
			if(v) return this.components[0].xadd(this, kb);
			nul.fail('Assertion not provided');
		}.perform('assert->operate').xKeep()
	},
	extraction: {
		operate: function(kb)
		{
			var rv = this.components[0].extraction();
			if(!rv) return this.components[0].xadd(this);
			if(rv) return rv.evaluate(kb).xadd(this);
		}.perform('extration->operate').xKeep(),
		extract: function() {}		//Must avoid sub-expr extraction
	},
	unification: {
		operate: function(kb)
		{
			var fl = this.components.length;
			var rv = nul.unify.multiple(this.components, kb, this.way, this.x)
			if(rv && 1== rv.length) return rv[0].xadd(this, kb);
			if(!rv) rv = this.components;
			return kb.affect(rv, this.way, this.x).xadd(this, kb);
		}.perform('unification->operate').xKeep()
	},
	kwFreedomHolder: {
		composed: function() {
			var i=0;
			while(i<this.components.length)
				//If component is failed, remove it
				if('kw'== this.components[i].charact && !this.components[i].components)
					this.components.splice(i,1);
				//If xor and component is not failable, stop browsing
				else if(':'== this.charact && 'kw'!= this.components[i].charact)
					break;
				else ++i;
			if(i<this.components.length) this.components.splice(++i);
			switch(i) {
				case 0: nul.fail();
				case 1: this.dirty();
			}
			return this;
		}.perform('kwFreedomHolder->composed'),
		operate: function(kb) {
			if(1== this.components.length) {
				var rv = this.components[0];
				if('kw'== rv.charact) {
					kb.knew(rv.components);
					rv = rv.components.value;
				}
				if(rv) return rv.xadd(this, kb);
				return nul.build.set().xadd(this, kb);
			}
		}.perform('kwFreedomHolder->operate').xKeep(),
	},
	ior3: {
		possibility: function(n, kb) {
			if(n<this.components.length)
				return nul.build.ior3([this.components[n]])/*.evaluate(kb)*/.xadd(this);
		},
		isFailable: function() {
			for(var i=0; i<this.components.length; ++i)
				if(!this.components[i].flags.failable) return false;
			return true;
		}
	},
	xor3: {
		isFailable: function() {
			return this.components[this.components.length-1].flags.failable;
		}
	},
	nativeSet : {
		transform: function() { return false; },
		take: function(apl, kb, way) {
			return this.callback(apl, kb);
		}.perform('nativeFunction->take'),
		isFailable: function() { return false; }
	}
};