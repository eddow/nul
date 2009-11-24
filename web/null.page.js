/*  NUL language JavaScript framework
 *  (c) 2009 E-med Ware
 *
 * NUL is freely distributable under the terms of GNU GPLv3 license.
 *  For details, see the NUL project site : http://code.google.com/p/nul/
 *
 *--------------------------------------------------------------------------*/

/**
 * Interract with the page
 * @namespace
 */
nul.page = {
	/**
	 * Called when the webpage contains a NUL error
	 * @param msg Error message
	 * @return nothing
	 */
	error: function(/**String*/msg) {
		alert(msg);
	}
};

nul.load.page = function() {
	try {
		var elm = $(this.documentElement);
		var nulScripts = $A(elm.select('script[type="text/nul"]'));
		for(var s=0; nulScripts[s]; ++s) {
			if(nulScripts[s].src) nul.data.ajax.loadNul(nulScripts[s].src, nulScripts[s].readAttribute('id'));
			else nul.read(nulScripts[s].text,
				nulScripts[s].readAttribute('id') || 'script'+nul.execution.name.gen('nul.debuger.eval'));
			//We don't really use the value afterward
		}
		return;
		var nulNodes = $j('nul');
		var exts = {}, ints= {};
		var nds = {};
		for(var n=0; nulNodes[n]; ++n) {
			var nnid = nulNodes[s].readAttribute('id');
			if(!nnid) nulNodes[s].writeAttribute(nnid = ('inline'+nul.execution.name.gen('nul.page.inline')));
			nds[nnid] = $j(nulNodes[s]);
			if(nulNodes[s].src) exts[nnid] = nulNodes[s].src;
			else ints[nnid] = nulNodes[s].textContent;
		}

		for(var n in ints) nds[n].replaceWith(nul.read(ints[n], n).XML(this));
		for(var n in exts) nds[n].replaceWith(nul.data.ajax.loadNul(exts[n], n).XML(this));
		nul.execution.existOnce();
	} catch(x) {
		var msg = nul.exception.notice(x).message;
		if(nul.erroneusJS) throw nul.erroneusJS;
		else nul.page.error(msg);
	}
};
nul.load.page.use = {'executionReady': true, 'console': true, 'HTML': true};
