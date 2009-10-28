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
						nul.loading.path = spl[0];
						nul.loading.nsn = nss[i];
						if(nss[i].attributes.nocache) nul.loading.suffix = '?'+(new Date()).getTime();
						break;
					}
				}

				nul.loading.addNexScriptRef();
				nul.loading.addRef('link', {href: nul.loading.path+'lng/null.css', rel: 'stylesheet', type: 'text/css'});
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
'lng/xpr/klg/null.xpr.knowledge.browse',
'lng/xpr/klg/null.xpr.knowledge.eqClass',
'lng/xpr/klg/null.xpr.knowledge.ior3',
'lng/xpr/klg/null.xpr.possible',

'lng/xpr/obj/null.xpr.object',

'lng/xpr/obj/defined/null.obj.defined',
'lng/xpr/obj/defined/null.obj.litteral',
'lng/xpr/obj/defined/null.obj.pair',
'lng/xpr/obj/defined/null.obj.sets',
'lng/xpr/obj/defined/null.obj.lambda',
'lng/xpr/obj/defined/null.obj.node',

'lng/xpr/obj/undefined/null.obj.undefined',
'lng/xpr/obj/undefined/null.obj.data',
'lng/xpr/obj/undefined/null.obj.local',
'lng/xpr/obj/undefined/null.obj.operation',
'lng/xpr/obj/undefined/null.obj.ior3',

'web/null.page',

'data/null.data',
'data/null.data.onPage',
'data/null.data.compute'
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
	if(!nul.loading.files.length) {
		window.status = nul.loading.files.length + '/' + nul.loading.total + ' : Starting script';
		delete nul.loading;
		nul.page.load();
		window.status = window.defaultStatus;
		return;
	}
	var sf = nul.loading.files.shift();
	window.status = nul.loading.files.length + '/' + nul.loading.total + ' : ' + sf;
	nul.loading.addRef('script', {
		type: 'text/javascript',
		src: nul.loading.path+sf+'.js' + nul.loading.suffix,
		onreadystatechange: nul.loading.onreadystatechange,
		onload: nul.loading.addNexScriptRef
	});
};
nul.loading.path = '';

nul.loading();
