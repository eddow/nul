/*  NUL language JavaScript framework
 *  (c) 2009 François Marie De Mey
 *
 * NUL is freely distributable under the terms of GNU GPLv3 license.
 *  For details, see the NUL project site : http://code.google.com/p/nul/
 *
 *--------------------------------------------------------------------------*/

nul.xpr.handle = Class.create(nul.xpr.composed, {
	charact: ':=',
	htmlCharact: '&lArr;',
	obj: ':=',
	failable: function() { return true; },
/////// Ctor
	initialize: function($super, handler, handled) {
		$super({handler:handler, handled:handled});
	},
/////// Objectivity specific
	subject: function(klg) {
		var hr = this.components.handler.handle();
		var hd = this.components.handled.handle();

		if(!hr || !hd) {
			var rv = [];
			if(!hr) rv.push(nul.unSubj('Unable to handle with', this.components.handler));
			if(!hd) rv.push(nul.unSubj('Unable to handle', this.components.handled));
			return rv;
		} else {
			nul.unify.level(hr[2], hd[1], klg);
			return this.replaceBy(!hr[0]?hd[2]:new nul.xpr.lambda(hr[0], hd[2]));
		}
	}.perform('nul.xpr.handle->subject')
	.describe(function(klg) { return ['Handeling', this]; })
});

nul.xpr.lambda = Class.create(nul.xpr.primitive(nul.xpr.composed), {
	charact: ':-',
	htmlCharact: '&rArr;',
/////// Ctor
	initialize: function($super, handle, object) {
		$super({handle:handle, object:object});
	},
	handle: function() { return [
		this.components.handle,
		this.components.handle,
		this.components.object]; },
/////// Application sets
	take: function(apl, klg, way) {
		if(':-'!= apl.charact) return;
		var h = new nul.xpr.application(
			this.components.handle,
			apl.components.handle,
			klg.ctxName);
		var o = new nul.xpr.application(
			this.components.object,
			apl.components.object,
			klg.ctxName);
		h = h.operate(klg) || h;
		o = o.operate(klg) || o;
		return apl;
	}.perform('nul.xpr.lambda->take'),
});