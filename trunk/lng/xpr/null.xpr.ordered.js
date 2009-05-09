/*  NUL language JavaScript framework
 *  (c) 2009 François Marie De Mey
 *
 * NUL is freely distributable under the terms of GNU GPLv3 license.
 *  For details, see the NUL project site : http://code.google.com/p/nul/
 *
 *--------------------------------------------------------------------------*/

nul.xpr.ordered = Class.create(nul.xpr.relation, {
	failable: function() { return true; },
	initialize: function($super, oprtr, oprnds) {
		if('='== oprtr.substr(1)) {
			oprtr = oprtr.substr(0, 1);
			this.charact = '<=';
			this.htmlCharact = '&le;';
		} else {
			this.charact = '<';
			this.htmlCharact = '&lt;';
		}
		switch(oprtr) {
			case '>': $super([oprnds[1], oprnds[0]]); break;
			case '<': $super(oprnds); break;
		}
	},
	subject: function(klg) {
		var a = this.components[0], b = this.components[1];
		var oa = a.attribute('<'), ob = b.attribute('<');
		var fct;
		if(!oa || !ob) return [
			nul.unSubj('Operator "&lt;" undefined for', this.components)];
		if(nul.debug.assert) assert('{}'== oa.charact && '{}'== ob.charact,
			'Operators are functions');
		if(oa.ndx == ob.ndx) fct = oa;
		else {
			fct = clone1(oa.components);
			fct.pushs(ob.components);
			fct = new nul.xpr.set(fct, 'g');
		}
		var trv = new nul.xpr.application(fct, new nul.xpr.set([a, b]), klg.ctxName);
		trv = trv.value(klg);
		if(!trv) return;
		return this.replaceBy(trv);
	}.perform('nul.xpr.operation->subject'),
});