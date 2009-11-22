/*  NUL language JavaScript framework
 *  (c) 2009 E-med Ware
 *
 * NUL is freely distributable under the terms of GNU GPLv3 license.
 *  For details, see the NUL project site : http://code.google.com/p/nul/
 *
 *--------------------------------------------------------------------------*/


nul.load.console = function() {
};
nul.load.page.use = {'executionReady': true, 'HTML': true};

$j(document).ready(function () {
	var console= $j('<div id="_nul_console" class="ui-layout-south">coucou</div>');
	var bdy = $j('body');
	
	bdy.wrapInner('<div id="_nul_content" class="ui-layout-center"></div>');
	bdy.append(console);
	var myLayout = bdy.layout({
		resizable: true,
		slidable: false,
		closable: true
	});
});