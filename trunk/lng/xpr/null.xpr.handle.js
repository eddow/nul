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
	subject: function(kb) {
		var hr = this.components.handler.handle();
		var hd = this.components.handled.handle();
		if(	(!hr && this.components.handler.free([kb.fzx.ctxName])) ||
			(!hd && this.components.handled.free([kb.fzx.ctxName])) )
			throw nul.semanticException('HUD',
				'Handeling undefined for '+this.components[0].toString());
		nul.unify.level(hr[2], hd[1], kb);
		if(!hr[0]) return hd[2];
		return new nul.xpr.lambda(hr[0], hd[2]);
	}
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
});