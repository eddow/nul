/*  NUL language JavaScript framework
 *  (c) 2009 E-med Ware
 *
 * NUL is freely distributable under the terms of GNU GPLv3 license.
 *  For details, see the NUL project site : http://code.google.com/p/nul/
 *
 *--------------------------------------------------------------------------*/
 
nul.page = {
	load: function() {
		for(var l in nul.load)
			if(!function(){}[l])
				nul.load[l].apply(document);
	},
	error: function(msg) {
		//alert(msg);
	},
};

//new Event.observe(window, 'load', nul.page.load);
