nul.eval = {
	/*TODO: type expectations
	 * &&, || expect boolean
	 * &, |, ^ expect numbers or booleans
	 */
	cumul: function(c, asAccum, by2op, solvedActx, partialActx, accumulable) {
		var accum = [], cdp = [], tv;
		for(var i=0; i<c.length; ++i)
			if(accumulable(c[i]))
			{
				tv = asAccum(c[i])
				if(isArray(accum) && 0==accum.length) accum = tv;
				else accum = by2op(accum, tv);
			}
			else cdp.push(c[i]);
		if(cdp.length >= c.length-1) return;
		accum = solvedActx(accum).ctxd();
		if(0>= cdp.length) return accum;
		cdp.push(accum);
		return partialActx(cdp);			
	},

	evaluate: function(kb) {
		return {
			kb: kb,
			newComponent: function(ctxd, oldComp, newComp) {
				if(oldComp!= newComp) return newComp.numerise(ctxd);
				else return newComp.clean();
			},
			newAttribute: function(ctxd, name, oldAttr, newAttr) {
				this.kb.know(name, newAttr, 1);
				if(oldAttr!= newAttr) return newAttr.numerise(ctxd);
				else return newAttr.clean();
			},
			browse: function(ctxd) {
				return !ctxd.evaluation || !ctxd.evaluation.management;
			},
			before: function(ctxd) {
				if(!ctxd.flags.dirty) throw nul.ctxd.noBrowse;
				this.kb.enter(ctxd);
			},
			finish: function(ctxd, chgd) {
				var assertKbLen, assertLc;
				if(nul.debug.assert) { assertKbLen = this.kb.knowledge.length; assertLc = nul.debug.lc; } 
				if(nul.debug.levels) assert(ctxd.locals.lvl == this.kb.knowledge.length-1, 'Evaluation level');
				try {
					try {
						if(ctxd.evaluation && (
							!ctxd.evaluation.evaluable ||
							ctxd.evaluation.evaluable(ctxd)
						) ) {
							var rv = ctxd.evaluation.evaluated(ctxd, this.kb);
							if(rv) { chgd = true; ctxd = rv; }
						}
						else ctxd = ctxd.ctxd(true);
					} catch(err) { this.abort(ctxd); throw err; }
					if(!chgd && ctxd.deps[0]) for(var d in ctxd.deps[0])
						if(nul.lcl.slf!= d && 'number'!= typeof d)
							{ chgd = true; break; }
					
					return this.kb.leave(chgd?ctxd:undefined);
				} finally { if(nul.debug.assert) assert(assertKbLen== this.kb.knowledge.length+1,
					'Knowledge enter/leave paired while evaluation ['+assertLc+']'); }
			}.describe(function(ctxd, chgd) { return 'Evaluating '+ctxd.toHTML(); }),
			abort: function(ctxd, chgd) {
				if(ctxd && !ctxd.flags.dirty) return;
				return this.kb.abort(chgd?ctxd:undefined, ctxd);
			}
		};
	},

	application: {
		management: true,
		evaluated: function(ctxd, kb) {
			var obj = ctxd.components.object.evaluate(kb) || ctxd.components.object;
			var apl = ctxd.components.applied.evaluate(kb) || ctxd.components.applied;
			if(obj.take) {
				//var rv = kb.knowing([obj, apl], function(kb) {
					var rv = obj.take(apl, kb, ctxd.locals);
				//});
				if(!rv) return rv;
				if(rv.deps[0] && rv.deps[0][nul.lcl.rcr]) {
					
				//TODO: optimise :)
				//TODO: workaround with leave/enter
					try {
						rv = kb.leave(rv)
							.rDevelop(obj, 0, nul.lcl.rcr)
							//.numerise(ctxd.locals.lvl+1)
							.evaluate(kb);
							//.numerise(ctxd.locals.lvl);
					} finally { kb.enter(rv); }
				}
						
				return rv;
			}
			if(ctxd.components.object.free())
				throw nul.semanticException('Not a set : '+ ctxd.components.object.toHTML());
			
		}.describe(function(ctxd, kb) {
			return ''+
				'Applying '+ctxd.components.applied.toHTML()+
				' to '+ctxd.components.object.toHTML();
		})
	},
	biExpr: {
		evaluable: function(ctxd)
		{
			return ctxd.components[0].free() && ctxd.components[1].free();
		},
		evaluated: function(ctxd, kb)
		{
			return nul.actx.atom(eval('' +
				nul.asJs(ctxd.components[0], ctxd.charact) +
				ctxd.charact +
				nul.asJs(ctxd.components[1], ctxd.charact) ))
				.ctxd().withLocals(ctxd.locals);
		}
	},
	cumulExpr: {
		evaluated: function(ctxd, kb)
		{
			var rv = nul.eval.cumul(
				ctxd.components,
				function(o) { return nul.asJs(o,ctxd.charact); },
				function(a,b) { return eval( ''+a + ctxd.charact + b ); },
				function(v) { return nul.actx.atom(v).ctxd().withLocals(ctxd.locals); },
				function(ops) { return nul.actx.cumulExpr(ctxd.charact, ops)
										.ctxd().numerise(ctxd.locals.lvl); },
				function(o) { return !!o.free(); }
			);
			if(rv) return rv.clean();
		}
	},
	preceded: {
		evaluable: function(ctxd)
		{
			return ctxd.free();
		},
		evaluated: function(ctxd, kb)
		{
			return nul.actx.atom(eval( ctxd.charact + nul.asJs(ctxd.components[0],ctxd.charact) ))
				.ctxd().withLocals(ctxd.locals);
		}
	},
	assert: {
		evaluable: function(ctxd)
		{
			return ctxd.free();
		},
		evaluated: function(ctxd, kb)
		{
			var v = nul.asJs(ctxd.components[0],'?');
			if('boolean'!= typeof v)
				throw nul.semanticException('Boolean expected instead of ' +
					ctxd.components[0].toString());
			if(v) return ctxd.components[0].withLocals(ctxd.locals);
			nul.fail('Assertion not provided');
		}
	},
	extraction: {
		//TODO: nul.eval.extraction
	},
	unification: {
		evaluated: function(ctxd, kb)
		{
			var rv = nul.unify.multiple(ctxd.components, kb, ctxd.locals)
			if(!rv) return;
			if(1== rv.length) {
				rv = rv[0].stpUp(ctxd.locals, kb);
				//TODO: workaround with leave/enter
				try { rv = kb.leave(rv).evaluate(kb); }
				finally { kb.enter(rv); }
				return rv;
			}
			return ctxd.clone(rv);
		}
	},
	and3: {
		evaluated: function(ctxd, kb)
		{
			var cdp = [], i;
			for(i=0; i<ctxd.components.length-1; ++i)
				if(ctxd.components[i].flags.failable)
					cdp.push(ctxd.components[i]);
			if(0== cdp.length) return ctxd.components[i].stpUp(ctxd.locals, kb);
			cdp.push(ctxd.components[i]);
			if(cdp.length < ctxd.components.length) return ctxd.modify(cdp).clean();
		}
	},
	or3: {
		management: true,
		evaluated: function(ctxd, kb)
		{
			var rv = kb.trys(
				'OR3', ctxd.components, ctxd.locals,
				function(c, kb) { return c.browse(nul.eval.evaluate(kb)); });
			if(rv && isArray(rv)) rv = ctxd.modify(rv);
			return rv;
		}
	},
	xor3: {
		management: true,
		evaluated: function(ctxd, kb)
		{
			var rv = kb.trys(
				'XOR3', ctxd.components, ctxd.locals,
				function(c, kb) { return c.browse(nul.eval.evaluate(kb)); },
				function(cs, kbs) {
					for(var i=0; i<cs.length; ++i) {
						var d=0;
						while(d<kbs[i].length && 0>=kbs[i][d].length) ++d;
						if(!cs[i].flags.failable && d>=kbs[i].length) return cs.splice(0,i+1);
					}
				});
			if(rv && isArray(rv)) rv = ctxd.modify(rv);
			return rv;
		}
	},
	objectivity: {
		evaluated: function(ctxd, kb)
		{
			if(!ctxd.components.object.free()) return;
			var itm =
				ctxd.components.item.contextualize(ctxd.components.object.attributes, 1) ||
				ctxd.components.item;
			if(is_empty(itm.deps[1])) return (itm.evaluate(kb) || itm).stpUp(ctxd.locals, kb);
			throw nul.semanticException(
				'No such attribute declared : '+keys(itm.deps[1]).join(', '));
		}
	}
};