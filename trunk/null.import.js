/*  NUL language JavaScript framework
 *  (c) 2009 E-med Ware
 *
 * NUL is freely distributable under the terms of GNU GPLv3 license.
 *  For details, see the NUL project site : http://code.google.com/p/nul/
 *
 *--------------------------------------------------------------------------*/


nul.loading.styles = [
'web/null.page',
'lng/txt/out/null.txt.html',
'3rd/jquery/theme/ui',
'3rd/jquery/theme/treeTable',
];

nul.loading.scripts = [
'3rd/jquery/ui.all',
'3rd/jquery/xmlns',
'3rd/jquery/ui.layout',
'3rd/jquery/emw',
'3rd/jquery/treeTable',

'krnl/null.helper',
'krnl/null.debugged',
'krnl/null.action',
'krnl/null.std',
'krnl/null.exception',
'krnl/null.dependance',

'lng/null.execution',

'lng/txt/in/null.tokenizer',
'lng/txt/in/null.compile',
'lng/txt/in/null.compiled',
'lng/txt/in/null.understand',

'lng/txt/out/null.txt',
'lng/txt/out/null.txt.flat',
'lng/txt/out/null.txt.html',
'lng/txt/out/null.txt.node',

'lng/xpr/null.expression',
'lng/xpr/null.origin',

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

'web/null.page'
];

nul.loading.fixConsole = function(ncd) {
	if(!ncd) {
		nul.loading.scripts.push('web/console/null.console');
		nul.loading.styles.push('web/console/null.console');
	}
};
nul.loading.follow = function(f) {
	for(var i=0; nul.loading.styles[i]; ++i) nul.loading.styles[i] = nul.rootPath+nul.loading.styles[i]+'.css';
	$.include(nul.loading.styles);

	for(var i=0; nul.loading.scripts[i]; ++i) nul.loading.scripts[i] = nul.rootPath+nul.loading.scripts[i]+'.js';
	$.chainclude(nul.loading.scripts, f);
};
nul.loading();
