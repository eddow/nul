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
		subject: function(kb) {
			switch(this.components.length) {
			case 1:
				var rv = this.components[0].attribute(this.charact, kb);
				if(!rv && this.components[0].free([kb.ctxName]))
					throw nul.semanticException('OUD',
						'Operator '+this.charact+' isnt defined for '+this.components[0].toString());
				return rv;
			default:
			}
		}.describe(function(kb) { return ['Subjectiving', this]; }),		
	});
}

nul.xpr.operation.listed = nul.xpr.operation(nul.xpr.listed);
nul.xpr.operation.preceded = nul.xpr.operation(nul.xpr.preceded);
nul.xpr.operation.postceded = nul.xpr.operation(nul.xpr.postceded);