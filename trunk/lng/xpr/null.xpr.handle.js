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
	failable: function() { return true; },
/////// Ctor
	initialize: function($super, handler, handled) {
		$super({handler:handler, handled:handled});
	},
/////// Objectivity specific
	subject: function(left, hpnd) {
		var hr = this.components.handler.handle(left);
		var hd = this.components.handled.handle(left);
		if(	(!hr && this.components.handler.free([left.ctxName])) )
			throw nul.semanticException('HUD',
				'Cannot handle with '+this.components.handler.toString());
		if(	(!hd && this.components.handled.free([left.ctxName])) )
			throw nul.semanticException('HUD',
				'Cannot handle '+this.components.handled.toString());
		if(!hr || !hd)
			hpnd.know(this); 
		else {
			nul.unify.level(hr[2], hd[1], hpnd);
			return this.replaceBy(!hr[0]?hd[2]:new nul.xpr.lambda(hr[0], hd[2]));
		}
	}.perform('nul.xpr.handle->subject')
	.describe(function(left, hpnd) { return ['Handeling', this]; })
});

nul.xpr.lambda = Class.create(nul.xpr.primitive(nul.xpr.composed), {
	charact: ':-',
	htmlCharact: '&rArr;',
/////// Ctor
	initialize: function($super, handle, object) {
		$super({handle:handle, object:object});
	},
	handle: function(klg) { return [
		this.components.handle,
		this.components.handle,
		this.components.object]; },
});