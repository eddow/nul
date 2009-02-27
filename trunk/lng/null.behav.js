/*  NUL language JavaScript framework
 *  (c) 2009 François Marie De Mey
 *
 * NUL is freely distributable under the terms of GNU GPLv3 license.
 *  For details, see the NUL project site : http://code.google.com/p/nul/
 *
 *--------------------------------------------------------------------------*/
 
nul.behav = {
	html_place: {
		take: function() {},
		extract: function() {
			return nul.build(this).list(nul.html(this.element.innerHTML));
		},
		append: function(itm) {
			if(itm.toXML) {
				this.element.innerHTML += itm.toXML();
				return itm.components.parms;
			}
			if(itm.value) {
				this.element.innerHTML += itm.value;
				return nul.build(this).atom('#text');
			}
			throw nul.semanticException('XML element expected for appending');
		}		
	},
	application: {
		operable: function() {
			return (this.components.applied.free() && !this.components.applied.flags.fuzzy)
				|| !this.components.object.deps[0]
				|| !this.components.object.deps[0][nul.lcl.slf];
		},
		operate: function(kb) {
			if(this.components.object.take) {
				var rv = this.components.object.take(this.components.applied, kb, this.locals);
				if(!rv) return rv;
				if(rv.deps[0] && rv.deps[0][nul.lcl.rcr])	//TODO: optimise :)
					rv = rv.rDevelop(this.components.object, 0, nul.lcl.rcr).dirty();
				return rv;
			}
			if(this.components.object.free())
				throw nul.semanticException('Not a set : '+ this.components.object.toHTML());
			
		}.describe(function(kb) {
			return ''+
				'Applying '+this.components.applied.toHTML()+
				' to '+this.components.object.toHTML();
		}).perform('application->operate')
	},
	set: {
		//TODO: operate : if can enumarate, just enumerate in a list
		take: function(apl, kb, lcls) {
			var rcr = nul.build().local(1, nul.lcl.rcr);
			var unf = this.components[0].clone();
			var tlcls = this.locals;
			//TODO: remplacer rcr AVANT unification ?
			var rv = kb.knowing([this, apl], function(kb) {
				var rv = nul.unify.sub1(unf, apl, kb);
				return (rv.rDevelop(rcr, 1) || rv).stpUp(tlcls, kb).clean();
			}).stpUp(lcls, kb).clean();
			if(':-'!= rv.charact ^ ':-'== apl.charact) return rv;
			return (':-'== rv.charact?rv:apl).components.value.stpUp(lcls, kb);
		}.perform('set->take'),
		extract: function() {
			//TODO: remember extraction and use it instead from now on
			var sltns = this.components[0].solve();
			return nul.build(this).atom(
				'Solved: '+sltns.solved.length+
				'\nFuzzies: '+sltns.fuzzy.length);
			if(sltns.solved.length) {
				if(0<sltns.fuzzy.length)
					sltns.solved.follow = nul.build().set(nul.build().or3(sltns.fuzzy));
				return nul.build(this).list(sltns.solved);
			}
			if(sltns.fuzzy.length)
				return nul.build(this).set(nul.build().or3(sltns.fuzzy));
			return nul.build(this).set();
		}.perform('set->extract')
	},
	seAppend: {
		extract: function() {
			if(!this.components.effected.append)
				throw nul.semanticException('Expected appendable : ',
					this.components.effected.toString());
			return this.components.effected.append(this.components.appended).levelise(this);
		}			
	},
	cumulExpr: {
		operable: function()
		{
			return this.free();	//TODO: manage: numbers commutatives but not strings!
			/*var nbrCumulable = 0;
			for(var i=0; i<this.components.length; ++i)
				if(this.components[i].free() && !this.components.fuzzy
					&& 1< ++nbrCumulable) return true;*/
		}.perform('cumulExpr->operable'),
		operate: function(kb)
		{
			var cps = clone1(this.components), ncps = [], o;
			while(o || 0< cps.length) {
				var c = o || cps.pop();
				var clcls = c.locals;
				if(!c.flags.fuzzy && c.free()) {
					c = nul.asJs(c, this.charact);
					o = cps.pop();
					while(o && !o.flags.fuzzy && o.free()) {
						seConcat(clcls, o.locals);
						o = nul.asJs(o, this.charact);
						c = eval( ''+nul.jsVal(o) + this.charact + nul.jsVal(c) );
						o = cps.pop();
					}
					c = nul.build(clcls, kb).atom(c);
				} else o = null;
				ncps.unshift(c);
			}
			if(1==ncps.length) return ncps[0].stpUp(this.locals, kb);
			return nul.build(this, kb).cumulExpr(this.charact, ncps).clean();
		}.perform('cumulExpr->operate')
	},
	biExpr: {
		operable: function()
		{
			return this.components[0].free() && this.components[1].free();
		},
		operate: function(kb)
		{
			return nul.build(this, kb).atom(eval('' +
				nul.asJs(this.components[0], this.charact) +
				this.charact +
				nul.asJs(this.components[1], this.charact) ));
		}.perform('biExpr->operate')
	},
	list: {
		take: function(apl, kb, lcls) {
			var cs = this.components;
			var rv = kb.knowing([this, apl], function(kb) {
				var rvl, rvf;
				try{ rvl = nul.unify.orDist(cs, lcls, apl, kb); }
				catch(err) { if(nul.failure!= err) throw nul.exception.notice(err); }
				if(cs.follow) {
					try{ rvf = cs.follow.take(apl,kb,lcls); }
					catch(err) { if(nul.failure!= err) throw nul.exception.notice(err); }
				}
				if(!rvl && !rvf) nul.fail;
				if(!rvl ^ !rvf) return rvl || rvf;
				return nul.build(apl, kb).or3([rvl,rvf])
			});
			return rv?rv.stpUp(lcls, kb):rv;	//TODO: vérifier que les <lcls> doivent bien être repassés			
		}.perform('list->take')		
	},
	preceded: {
		operable: function()
		{
			return this.free() && !this.flags.fuzzy;
		},
		operate: function(kb)
		{
			return nul.build(this, kb)
				.atom(eval( this.charact + nul.asJs(this.components[0],this.charact) ))
		}.perform('preceded->operate')
	},
	assert: {
		operable: function()
		{
			return this.free();
		},
		operate: function(kb)
		{
			var v = nul.asJs(this.components[0],'?');
			if('boolean'!= typeof v)
				throw nul.semanticException('Boolean expected instead of ' +
					this.components[0].toString());
			if(v) return this.components[0].stpUp(this.locals, kb);
			nul.fail('Assertion not provided');
		}.perform('assert->operate')
	},
	extraction: {
		operable: function() {
			return this.free();
		},
		operate: function(kb)
		{
			var rv = this.components[0].extraction();
			if(rv) return rv.stpUp(this.locals, kb).dirty();
		}.perform('extration->operate'),
		extract: function() {}		//Must avoid sub-expr extraction
	},
	unification: {
		operate: function(kb)
		{
			var rv = nul.unify.multiple(this.components, kb, this.locals)
			if(!rv) return;
			if(1== rv.length)
				return rv[0].stpUp(this.locals, kb);

			return this.modify(rv);
		}.perform('unification->operate')
	},
	and3: {
		operate: function(kb)
		{
			var cdp = [], i;
			for(i=0; i<this.components.length-1; ++i)
				if(this.components[i].flags.failable)
					cdp.push(this.components[i]);
			if(0== cdp.length)
				return this.components[i].stpUp(this.locals, kb).summarised().dirty();
			cdp.push(this.components[i]);
			if(cdp.length < this.components.length) return this.modify(cdp).clean();
		}.perform('and3->operate')
	},
	or3: {
		subOperationManagement: true,
		operate: function(kb)
		{
			var rv = kb.trys(
				'OR3', this.components, this.locals,
				function(c, kb) { return c.browse(nul.browse.evaluate(kb)); });
			if(rv && isArray(rv)) return nul.build(this.locals).or3(rv).clean();
			return rv;
		}.perform('or3->operate'),
		isFailable: function() {
			for(var i=0; i<this.components.length; ++i)
				if(!this.components[i].flags.failable) return false;
			return true;
		}
	},
	xor3: {
		subOperationManagement: true,
		operate: function(kb)
		{
			var rv = kb.trys(
				'XOR3', this.components, this.locals,
				function(c, kb) { return c.browse(nul.browse.evaluate(kb)); },
				function(cs, kbs) {
					for(var i=0; i<cs.length-1; ++i) {
						var d=0;
						while(d<kbs[i].length && 0>=kbs[i][d].length) ++d;
						if(!cs[i].flags.failable && d>=kbs[i].length) return cs.splice(0,i+1);
					}
				});
			if(rv && isArray(rv)) rv = this.modify(rv);
			return rv;
		}.perform('xor3->operate'),
		isFailable: function() {
			return this.components[this.components.length-1].flags.failable;
		}
	},
	nativeFunction : {
		take: function(apl, kb, lcls) {
			var tnf = this;
			var rv = kb.knowing([this, apl], function(kb) {
				var rv = tnf.callback(apl, kb);
				if(!rv) return;
				return rv.numerise(tnf).stpUp(tnf.locals, kb);
			});
			if(rv) return rv.stpUp(lcls, kb);
		}.perform('nativeFunction->take')
	},
	objectivity: {
		operate: function(kb)
		{
			var itm = this.components.item.contextualize(this.components.object.attributes, 1);
			if(itm) return (itm.evaluate(kb) || itm).stpUp(this.locals, kb);
			return;
			//TODO: once locals get down to more specific,
			//  if a specific local don't give an attribute, we can consider the attribute is
			//  absent and throw an error. Beside, the value can still be modified beside.
			throw nul.semanticException(
				'No such attribute declared : '+keys(itm.deps[1]).join(', '));
		}.perform('objectivity->operate')
	}
};