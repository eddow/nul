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
			if(this.components['']) {
				if(0<this.components.length) return ''+
					'<table class="xpr freedom"><tr><td class="freedom">' +
					this.components[''].toHTML() +
					'</td></tr><tr><th class="freedom">' +
					nul.text.expressionHTML(';', this.components) +
					'</th></tr></table>';
				return this.components[''].toHTML();
			}
			if(0<this.components.length) return nul.text.expressionHTML(';', this.components);
			return '<span class="failure">Ok</span>';
		},
		freedomString: function() {
			var rv = '';
			if(this.components['']) rv =
				this.components[''].toString() + (0<this.components.length?'; ':'');
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
			return nul.build.list(nul.html(this.element.innerHTML)).xadd(this.x);
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
			throw nul.semanticException('htmlPlace', 'XML element expected for appending');	//TODO: make it a type def	
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
				throw nul.semanticException('OPM', 'Cannot take from '+ this.components.object.toHTML());
			//TODO: put selfRef dans le .x.take
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
				return rv.xadd(this.x, kb);
			}
			if(!this.components.object.transform()) {
				kb.knew(this.clean().clone());
				return this.components.applied.xadd(this.x, kb);
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
			this.components[''] &&	//Value is not set when called from within nul.build.item
			0== this.components.length &&
			!this.components[''].flags.failable)
				return this.components[''];
			return this;
		},
		fail: function() {
			delete this. components;
			this.flags = this.deps = {};
			return this;
		},
		makeFrdm: function(kb) {
			kb.push(nul.knowledge(this.components));
			return this;
		}
	},
	definition: nul.set.behaviour,
	seAppend: {
		extract: function() {
			return this.components.effected.extractInterface('append')
				(this.components.appended).xadd(this.x);
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
					o = cps.pop();
					while(o && o.fixed()) {
						var opFct = o.x[this.charact];
						if(!opFct)
							throw nul.semanticException('OPM', 'Operator '+this.charact+' is not defined for ' + o.toHTML());
						c = opFct.apply(o, [c, kb]);
						o = cps.pop();
					}
				} else o = null;
				ncps.unshift(c);
			}
			if(1==ncps.length) return ncps[0].xadd(this.x, kb);
			if(ncps.length != this.components.length)
				return this.compose(ncps).clean();
		}.perform('cumulExpr->operate').xKeep()
	},
	biExpr: {
		operate: function(kb)
		{
			var knwldg = nul.build.order('<'==this.charact?this.components:
				[this.components[1],this.components[0]]).evaluate(kb);
			if('atom'!= knwldg.charact) kb.knew(knwldg);
			return this.components[0].xadd(this.x, kb);
		}.perform('order->operate').xKeep()
	},
	order: {
		operable: nul.xpr.subFixed,
		operate: function(kb)
		{
			var opFct = this.components[0].x['<'];
			if(!opFct)
				throw nul.semanticException('OPM', 'Operator < is not defined for ' + this.components[0].toHTML());
			if(opFct.apply(this.components[0], [this.components[1], kb])) return nul.build.atom(true);
		}.perform('order->operate').xKeep()
	},
	list: {
		x: 'set',
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
				return this.components.follow || nul.build.definition();
			return this;
		}.perform('list->composed').xKeep(),
		take: function(apl, kb, way) {
			var rv = [];
			var xpr = this.clone();	//TODO: please kill me :'(
			for(var i=0; i<xpr.components.length; ++i) {
				var kwf = nul.build.kwFreedom();
				kwf.makeFrdm(kb);
				try {
					kwf.components[''] = xpr.components[i].handled(apl.clone(), kb);
				} catch(err) {
					kb.pop('kw');
					if(nul.failure!= err) throw nul.exception.notice(err);
				}
				if(kwf.components['']) {
					kwf = kb.pop(kwf).dirty();
					rv.push(kwf.evaluate(kb)||kwf);
				}
			}
			if(xpr.components.follow) {
				var kwf = nul.build.kwFreedom();
				kwf.makeFrdm(kb);
				try {
					kwf.components[''] = xpr.components.follow.take(apl,kb,way).dirty();
				} catch(err) {
					kb.pop('kw');
					if(nul.failure!= err) throw nul.exception.notice(err);
				}
				if(kwf.components['']) {
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
		{	//TODO: make a X op
			var opFct = this.components[0].x[this.charact+'.'];
			if(!opFct)
				throw nul.semanticException('OPM', 'Precedor '+this.charact+' is not defined for ' + o.toHTML(this.components[0]));
			var rv = opFct.apply(this.components[0], [kb]);
			if(rv) return rv.xadd(this.x, kb);
		}.perform('preceded->operate').xKeep()
	},

	extraction: {
		operate: function(kb)
		{
			var rv = this.components[0].extraction();
			if(!rv) return this.components[0].xadd(this.x);
			if(rv) return rv.evaluate(kb).xadd(this.x);
		}.perform('extration->operate').xKeep(),
		extract: function() {}		//Must avoid sub-expr extraction
	},
	unification: {
		operate: function(kb)
		{
			var fl = this.components.length;
			var rv = nul.unify.multiple(this.components, kb)
			if(rv && 1== rv.length) return rv[0].xadd(this.x, kb);
			if(!rv) rv = this.components;
			return kb.affect(rv, this.x).xadd(this.x, kb);
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
					rv = rv.components[''];
				}
				if(rv) return rv;
				return nul.build.definition();
			}
		}.perform('kwFreedomHolder->operate').xKeep(),
	},
	ior3: {
		possibility: function(n, kb) {
			if(n<this.components.length)
				return nul.build.ior3([this.components[n]])/*.evaluate(kb)*/.xadd(this.x);
		},
		isFailable: function() {
			for(var i=0; i<this.components.length; ++i)
				if(!this.components[i].flags.failable) return false;
			return true;
		}/*,
		handled: function(h, kb) {
			var rv = [], tmp;
			for(var i=0; i<hd.components.length; ++i) {
				var kwf = hd.components[i].clone();
				if('kw'!= kwf.charact) {
					tmp = kwf;
					kwf = nul.build.kwFreedom();
					kwf.components[''] = tmp;
				}
				kwf.makeFrdm(kb);
				try {
					tmp = kwf.components[''];
					delete kwf.components[''];
					kwf.components[''] = tmp.x.valHandle(hr, tmp, kb);
				} catch(err) {
					kb.pop('kw');
					if(nul.failure!= err) throw nul.exception.notice(err);
				}
				if(kwf.components['']) {
					kwf = kb.pop(kwf).dirty();
					rv.push(kwf.evaluate(kb)||kwf);
				}
			}
			return nul.build.ior3(rv).xadd(hd.x, kb);
		}*/
	},
	xor3: {
		isFailable: function() {
			return this.components[this.components.length-1].flags.failable;
		}
	},
	lambda: {
		x: ':-'
	},
	handle: {
		operable: function() {
			return this.components.handler.finalRoot() && this.components.handled.x;
		},
		operate: function(kb) {
			return this.components.handled.handled(this.components.handler, kb);
		}
	},
	object: {
	},
	nativeSet : {
		x: 'set',
		transform: function() { return false; },
		take: function(apl, kb, way) {
			return this.callback(apl, kb);
		}.perform('nativeSet->take'),
		isFailable: function() { return false; }
	},
	nativeFunction : {
		x: 'set',
		transform: function() { return true; },
		take: function(apl, kb, way) {
			return this.callback(apl, kb);
		}.perform('nativeFunction->take'),
		isFailable: function() { return false; }
	},
};