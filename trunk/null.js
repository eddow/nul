/*  NUL language JavaScript framework
 *  (c) 2009 E-med Ware
 *
 * NUL is freely distributable under the terms of GNU GPLv3 license.
 *  For details, see the NUL project site : http://code.google.com/p/nul/
 *
 *--------------------------------------------------------------------------*/

/**
 * This file just load the needed files. 
 */

var nulFiles = [
'prototype',

'lng/krnl/null.std',
'lng/krnl/null.debug',
'lng/krnl/null.exception',
'lng/krnl/null.execution',
'lng/krnl/null.helper',
'lng/krnl/null.dependance',

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
'lng/xpr/klg/null.xpr.knowledge.eqClass',
'lng/xpr/klg/null.xpr.knowledge.ior3',
'lng/xpr/klg/null.xpr.possible',

'lng/xpr/obj/null.xpr.object',

'lng/xpr/obj/defined/null.obj.defined',
'lng/xpr/obj/defined/null.obj.data',
'lng/xpr/obj/defined/null.obj.litteral',
'lng/xpr/obj/defined/null.obj.pair',
'lng/xpr/obj/defined/null.obj.sets',
'lng/xpr/obj/defined/null.obj.lambda',
'lng/xpr/obj/defined/null.obj.node',

'lng/xpr/obj/undefined/null.obj.undefined',
'lng/xpr/obj/undefined/null.obj.local',
'lng/xpr/obj/undefined/null.obj.operation',
'lng/xpr/obj/undefined/null.obj.ior3',

'web/null.page',

'data/null.data',
'data/null.data.onPage',
];

function addRef(hd, nsn, tag, props) {
	var elm = document.createElement(tag);
	for(l in props) if(!{}[l]) elm[l] = props[l];
	if(true) hd.appendChild(elm);
	else hd.insertBefore(elm, nsn);
}

if (document.getElementsByTagName) {
	var head = document.getElementsByTagName("HEAD");
	if (head) {
		head = head[0];
		var path = '';
		var nss = head.getElementsByTagName("SCRIPT");
		var nsn;
		for(var i=0; i<nss.length; ++i) if(nss[i].src) {
			var spl = nss[i].src.split('null.js');
			if(1< spl.length && ''==spl[1]) {
				path = spl[0];
				nsn = nss[i];
				break;
			}
		}
		var getXMLHttpObj = function(){
			if(typeof(XMLHttpRequest)!='undefined')
				return new XMLHttpRequest();

			var axO=['Msxml2.XMLHTTP.6.0', 'Msxml2.XMLHTTP.4.0',
				'Msxml2.XMLHTTP.3.0', 'Msxml2.XMLHTTP', 'Microsoft.XMLHTTP'], i;
			for(i=0;i<axO.length;i++)
				try{
					return new ActiveXObject(axO[i]);
				}catch(e){}
			return null;
		}
		//*
		while(nulFiles.length) addRef(head, nsn, 'script', {type: 'text/javascript', src: path+nulFiles.shift()+'.js'});
		/*/
		while(nulFiles.length)
		{
			
			var oXML = getXMLHttpObj();
			oXML.open('GET', path+nulFiles.shift()+'.js', false);
			oXML.send('');
			eval(oXML.responseText);
		}	//*/
		
		addRef(head, nsn, 'link', {href: path+'lng/null.css', rel: 'stylesheet', type: 'text/css'});
	}
}
delete nulFiles;
delete addRef;