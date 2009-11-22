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
		var nulNodes = $A(elm.select('nul'));
		var exts = {}, ints= {};
		for(var n=0; nulNodes[n]; ++n) {
			if(!nulNodes[s].readAttribute('id')) nulNodes[s].writeAttribute('inline'+nul.execution.name.gen('nul.page.inline'));
			if(nulNodes[s].src) exts[nulNodes[s].readAttribute('id')] = nulNodes[s].src;
			else ints[nulNodes[s].readAttribute('id')] = nulNodes[s].text;
			nulNodes[s].innerHTML = 'Loading...';
			nulNodes[s].addClassName('loading');
		}

		for(var n in exts) nul.data.ajax.loadNul(exts[n], n);
		for(var n in ints) nul.read(ints[n], n);
		//nul.execution.existOnce();
		for(var n=0; nulNodes[n]; ++n) {
			//nulNodes[n].parentNode.replaceChild(val.XML(this), nulNodes[n]);
		}
	} catch(x) {
		var msg = nul.exception.notice(x).message;
		if(nul.erroneusJS) throw nul.erroneusJS;
		else nul.page.error(msg);
	}
};
nul.load.page.use = {'executionReady': true, 'console': true, 'HTML': true};
