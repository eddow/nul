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
			this.charact = oprtr;
			$super(oprnds);
		},
		subject: function(klg) {
			var ops = [], rrv = [], fct = [], prsntFct = {},
				toOp = clone1(this.components);
			while(toOp.length) {
				var o = toOp.shift();
				var oprtr = o.attribute(this.charact, klg);
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
			if(!ops.length) return;
			
			var trv = new nul.xpr.application(
				new nul.xpr.set(fct),
				new nul.xpr.set(ops));
			trv = trv.operate(klg);
			if(!trv) return;
			if(!rrv.length) return this.replaceBy(trv.subjective(klg));
			rrv.push(trv);
			return this.compose(rrv);
		}.describe(function(klg) { return ['Subjectiving', this]; }),		
	});
}

nul.xpr.operation.listed = nul.xpr.operation(nul.xpr.listed);
nul.xpr.operation.preceded = nul.xpr.operation(nul.xpr.preceded);
nul.xpr.operation.postceded = nul.xpr.operation(nul.xpr.postceded);