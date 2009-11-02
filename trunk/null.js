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
						break;
					}
				}
				if(urlOption('nocache')) nul.loading.suffix = '?'+(new Date()).getTime();
				nul.loading.addNexScriptRef();
				nul.loading.addRef('link', {href: nul.rootPath+'lng/null.css', rel: 'stylesheet', type: 'text/css'});
			}
		}
	}
};

nul.loading.files = [
'prototype',

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
'lng/xpr/klg/null.klg.browse',
'lng/xpr/klg/null.klg.eqClass',
'lng/xpr/klg/null.klg.ior3',
'lng/xpr/klg/null.xpr.possible',

'lng/xpr/obj/null.xpr.object',

'lng/xpr/obj/defined/null.obj.defined',
'lng/xpr/obj/defined/null.obj.hc',
'lng/xpr/obj/defined/null.obj.litteral',
'lng/xpr/obj/defined/null.obj.pair',
'lng/xpr/obj/defined/null.obj.lambda',
'lng/xpr/obj/defined/null.obj.sets',
'lng/xpr/obj/defined/null.obj.node',

'lng/xpr/obj/undefined/null.obj.undefined',
'lng/xpr/obj/undefined/null.obj.data',
'lng/xpr/obj/undefined/null.obj.local',
'lng/xpr/obj/undefined/null.obj.operation',

'data/null.data',
'data/null.data.ajax',
'data/null.data.time',
'data/null.data.dom',

'web/null.page'
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

nul.loading.addNexScriptRef = function() {
	var sf = nul.loading.files.shift();
	if(!sf) {
		window.status = nul.loading.files.length + '/' + nul.loading.total + ' : Starting script';
		delete nul.loading;
		for(var l in nul.load)
			if(!function(){}[l])
				nul.load[l].apply(document);
		nul.execution.ready();
		window.status = window.defaultStatus;
		return;
	}
	window.status = nul.loading.files.length + '/' + nul.loading.total + ' : ' + sf;
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
	return 0<=('&'+srch+'&').indexOf('&'+opt+'&');
}
