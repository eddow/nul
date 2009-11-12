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
			var val;
			if(nulScripts[s].src) val = nul.data.ajax.loadNul(nulScripts[s].src);
			else val = nul.data.query(nul.subRead(nulScripts[s].text, 'script'));	//TODO 1:Name script?
		}
		var nulNodes = $A(elm.select('nul'));
		for(var n=0; nulNodes[n]; ++n) {
			var val;
			if(nulNodes[s].src) val = nul.data.ajax.loadNul(nulNodes[s].src);
			else val = nul.xmlRead(nulNodes[s].textContent, 'node');	//TODO 1:Name node?
			//TODO 3: a real element reader
			var doc = this;
			//TODO 3: replace the node, not its content
			nulNodes[n].innerHTML = map(val, function() {
				return nul.data.query(this).XML(doc);
			}).join('');
		}
	} catch(x) {
		var msg = nul.exception.notice(x).message;
		if(nul.erroneusJS) throw nul.erroneusJS;
		else nul.page.error(msg);
	}
};
nul.load.page.use = {'executionReady': true};