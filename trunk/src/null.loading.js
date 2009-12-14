/*!
 *  NUL language JavaScript framework
 *  (c) 2009 E-med Ware
 *
 * NUL is freely distributable under the terms of GNU GPLv3 license.
 *  For details, see the NUL project site : http://code.google.com/p/nul/
 *
 *--------------------------------------------------------------------------*/

nul = new JS.Singleton(/** @lends nul */{ load: {} });

nul.rootPath = '';
nul.loading = function() {
	$('head script').each(function(){
		var spl = this.src.split('null.');
		if(1< spl.length) {
			nul.rootPath = spl[0];
			                   /*.split('/');
			nul.rootPath.pop(); nul.rootPath.pop();
			nul.rootPath = nul.rootPath.join('/');*/
			nul.loading.fixConsole($(this).attr('noconsole'));
		}
	});

	nul.loading.follow(function() {
		if('complete'== document.readyState) nul.loading.initiate();
		else $('body').ready(nul.loading.initiate);
	});
};
nul.loading.initiate = function() {
	var toProvide = {};
	var toLoad = [];
	for(var l in nul.load)
		if(!function(){}[l]) {
			if(!nul.load[l].provide) nul.load[l].provide = [];
			if(0> $.inArray(l, nul.load[l].provide)) nul.load[l].provide.push(l);
			for(var p=0; nul.load[l].provide[p]; ++p)
				toProvide[nul.load[l].provide[p]] = 1+(toProvide[nul.load[l].provide[p]]||0);
			nul.load[l].name = l;
			toLoad.push(nul.load[l]);
		}
	while(toLoad.length) {
		var nxtLd = toLoad.shift();
		var cn = true;
		if(nxtLd.use)
			for(var u in nxtLd.use)
				if(toProvide[u]) cn = false;
		if(cn) {
			nxtLd.apply(document);
			for(var p=0; nxtLd.provide[p]; ++p)
				--toProvide[nxtLd.provide[p]];
		} else toLoad.push(nxtLd);
	}
	delete nul.loading;
};


