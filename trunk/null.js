/*!
 *  NUL language JavaScript framework
 *  (c) 2009 E-med Ware
 *
 * NUL is freely distributable under the terms of GNU GPLv3 license.
 *  For details, see the NUL project site : http://code.google.com/p/nul/
 *
 *--------------------------------------------------------------------------*/

nul = new JS.Singleton(/** @lends nul */{ load: {} });

$('head script').each(function(){
	var spl = this.src.split('null.');
	if(1< spl.length) {
		nul.rootPath = spl[0];
		if($(this).attr('noconsole')) nul.console = false;
	}
});

if('complete'== document.readyState) nul.loading.initiate();
else $('body').ready(nul.loading.initiate);
