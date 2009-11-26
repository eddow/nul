/*  NUL language JavaScript framework
 *  (c) 2009 E-med Ware
 *
 * NUL is freely distributable under the terms of GNU GPLv3 license.
 *  For details, see the NUL project site : http://code.google.com/p/nul/
 *
 *--------------------------------------------------------------------------*/

/**
 * @fileoverview
 * This file just load the needed script files. 
 */

/**@namespace*/
nul = {
	load: {},
	loading : function() {
		if (document.getElementsByTagName) {
			nul.loading.head = document.getElementsByTagName("HEAD");
			if (nul.loading.head) {
				nul.loading.head = nul.loading.head[0];
				var nss = nul.loading.head.getElementsByTagName("SCRIPT");
				for(var i=0; i<nss.length; ++i) if(nss[i] && nss[i].src) {
					var spl = nss[i].src.split('null.js');
					if(1< spl.length && ''==spl[1]) {
						nul.rootPath = spl[0];
						nul.loading.nsn = nss[i];
						nul.noConsole = nss[i].getAttribute('noconsole');
						break;
					}
				}
				if(urlOption('nocache')) nul.loading.suffix = '?'+(new Date()).getTime();
				nul.loading.addNexScriptRef();
				while(nul.loading.styles.length) nul.loading.addRef('link', {
					href: nul.rootPath+nul.loading.styles.shift()+'.css',
					rel: 'stylesheet', type: 'text/css'
				});
			}
		}
	}
};

nul.loading.styles = [
'web/null.page',
'lng/txt/out/null.txt.html',
'lng/txt/out/null.txt.clpsSstm',
'3rd/jquery/theme/ui',
'3rd/jquery/theme/treeTable',
'web/console/null.console'
];

nul.loading.files = [
//'3rd/prototype',
'3rd/jsclass/core',		//must be first

'3rd/jquery/jquery',
'3rd/jquery/ui.all',
'3rd/jquery/xmlns',
'3rd/jquery/ui.layout',
'3rd/jquery/emw',
'3rd/jquery/treeTable',

'krnl/null.helper',
'krnl/null.std',
'krnl/null.debug',
'krnl/null.exception',
'krnl/null.dependance',

'lng/null.execution',

'lng/txt/in/null.understand',
'lng/txt/in/null.compile',
'lng/txt/in/null.tokenizer',

'lng/txt/out/null.txt',
'lng/txt/out/null.txt.flat',
'lng/txt/out/null.txt.html',

'lng/xpr/null.expression',

'lng/algo/null.browse',
'lng/algo/null.solve',

'lng/xpr/klg/null.xpr.knowledge',
'lng/xpr/klg/null.klg.algo',
'lng/xpr/klg/null.klg',
'lng/xpr/klg/null.klg.browse',
'lng/xpr/klg/null.klg.eqClass',
'lng/xpr/klg/null.klg.ior3',
'lng/xpr/klg/null.xpr.possible',

'lng/xpr/obj/null.xpr.object',

'lng/xpr/obj/defined/null.obj.defined',
'lng/xpr/obj/defined/null.obj.hc',
'lng/xpr/obj/defined/null.obj.litteral',
'lng/xpr/obj/defined/null.obj.lambda',
'lng/xpr/obj/defined/null.obj.list',
'lng/xpr/obj/defined/null.obj.pair',
'lng/xpr/obj/defined/null.obj.sets',
'lng/xpr/obj/defined/null.obj.node',

'lng/xpr/obj/undefnd/null.obj.undefnd',
'lng/xpr/obj/undefnd/null.obj.data',
'lng/xpr/obj/undefnd/null.obj.local',
'lng/xpr/obj/undefnd/null.obj.operation',

'data/null.data',
'data/null.data.ajax',
'data/null.data.time',
'data/null.data.dom',

'web/null.page',
'web/console/null.console'
];

nul.loading.total = nul.loading.files.length;

nul.loading.suffix = '';

nul.loading.addRef = function(tag, props) {
	var elm = document.createElement(tag);
	for(l in props) if(!{}[l]) elm[l] = props[l];
	if(nul.loading.nsn) nul.loading.head.appendChild(elm);
	else nul.loading.head.insertBefore(elm, nul.loading.nsn);
};

nul.loading.onreadystatechange = function() {
	if(this.readyState == 'loaded' || this.readyState == 'complete') {
		this.onreadystatechange = function(){};
		nul.loading.addNexScriptRef();
	}
};

nul.loading.loaded = function(wwl) {
	nul.loading.loaded.already[wwl] = true;
	if(nul.loading.loaded.already.document && nul.loading.loaded.already.scripts) {
		var toProvide = {};
		var toLoad = [];
		for(var l in nul.load)
			if(!function(){}[l]) {
				if(!nul.load[l].provide) nul.load[l].provide = [];
				if(!nul.load[l].provide.include(l)) nul.load[l].provide.push(l);
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
				nul.loading.status('loader', nxtLd.name);
				nxtLd.apply(document);
				for(var p=0; nxtLd.provide[p]; ++p)
					--toProvide[nxtLd.provide[p]];
			} else toLoad.push(nxtLd);
		}
		nul.loading.status('end');
		delete nul.loading;
	}
};
nul.loading.loaded.already = {};

nul.loading.status = function(type, arg) {
	if('undefined'== typeof $j) return;	//Need jquery to be loaded
	if(!nul.loading.status.bar) {
		nul.loading.status.bar = $j('<div id="nul_loading_bar"></div>');
		$j('body').prepend(nul.loading.status.bar);
	}
	if('end'== type) nul.loading.status.bar.remove();
	else {
		nul.loading.status.bar.innerHTML = arg;
	}
};

nul.loading.addNexScriptRef = function() {
	if('undefined'!= typeof $j && !nul.loading.jquery) {
		//if($j(document).ready(??)) nul.loading.loaded('document');	//TODO 3: problems chrome css before js
		/*else*/ $j(document).ready(function () { nul.loading.loaded('document');});
		nul.loading.jquery = true;
	}
	var sf = nul.loading.files.shift();
	if(!sf) return nul.loading.loaded('scripts');
	nul.loading.status('script', sf);
	nul.loading.addRef('script', {
		type: 'text/javascript',
		src: nul.rootPath+sf+'.js' + nul.loading.suffix,
		onreadystatechange: nul.loading.onreadystatechange,
		onload: nul.loading.addNexScriptRef
	});
};
nul.rootPath = '';

nul.loading();


/**
 * Weither the string opt appear in the url parameters
 * @param {String} opt
 * @return {Boolean}
 */
function urlOption(opt) {
	var srch = window.location.href.split('?')[1];
	if(!srch) return;
	srch = '&'+srch+'&';
	var rx = new RegExp('\\&'+opt+'(\\=(.*?))?\\&');
	var mh = rx.exec(srch);
	return mh?(mh[2]||true):false;
}
/*
window.onerror = function(a, b, c) {
	alert(a+'\n'+b+'\n'+c);
};
*/