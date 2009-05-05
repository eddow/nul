/*  NUL language JavaScript framework
 *  (c) 2009 François Marie De Mey
 *
 * NUL is freely distributable under the terms of GNU GPLv3 license.
 *  For details, see the NUL project site : http://code.google.com/p/nul/
 *
 *--------------------------------------------------------------------------*/

/**
 * List defined in extension : each element is a member
 */
nul.xpr.operation = function(pos) {
	return Class.create(pos, {
		initialize: function($super, oprtr, oprnds) {
			this.obj = this.charact = oprtr;
			$super(oprnds);
		},
		subject: function(klg) {
			var ops = [], rrv = [], fct = [], prsntFct = {},
				toOp = clone1(this.components);
			while(toOp.length) {
				var o = toOp.shift();
				var oprtr = o.attribute(this.charact);
				if(!oprtr) rrv.push(o);
				else {
					ops.push(o)
					if(nul.debug.assert) assert('{}'== oprtr.charact,
						'Operators are functions');
					if(!prsntFct[fct.ndx]) {
						//TODO: redirect 'self' : all self point to the built fct
						fct.pushs(oprtr.components);
						prsntFct[fct.ndx] = true;
					}
				}
			}
			if((!ops.length) ||
					(1>= ops.length && 1< this.components.length))
				return [nul.unSubj('Operator "'+this.charact+'" undefined for',
					this.components)];
			
			fct = new nul.xpr.set(fct, 'g');
			var trv = new nul.xpr.application(
				fct,
				(1==ops.length)?ops[0]:new nul.xpr.set(ops),
				klg.ctxName);
			trv = trv.operate(klg);
			if(!trv) return;
			if(!rrv.length) return this.replaceBy(trv);
			rrv.push(trv);
			return this.compose(rrv);
		}.perform('nul.xpr.operation->subject'),	
	});
}

nul.xpr.operation.associative = nul.xpr.operation(nul.xpr.associative);
nul.xpr.operation.listed = nul.xpr.operation(nul.xpr.relation);
nul.xpr.operation.preceded = nul.xpr.operation(nul.xpr.preceded);
nul.xpr.operation.postceded = nul.xpr.operation(nul.xpr.postceded);