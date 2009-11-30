/*  NUL language JavaScript framework
 *  (c) 2009 E-med Ware
 *
 * NUL is freely distributable under the terms of GNU GPLv3 license.
 *  For details, see the NUL project site : http://code.google.com/p/nul/
 *
 *--------------------------------------------------------------------------*/

nul.load.console = function() {
	nul.console.frame = $('<iframe id="_nul_console" src="javascript:false;" frameborder="0" scrolling="auto"></iframe>');
	
	var bdy = $('body');
	bdy.wrapInner('<div id="_nul_content" class="ui-layout-center" ></div>');
	bdy.append(nul.console.frame);
	nul.console.layout = bdy.layout({
		south : {
			paneSelector: '#_nul_console',
			maskIframesOnResize: '#_nul_console',
			resizable: true,
			slidable: false,
			closable: false,
			
			//togglerLength_open: 0,
			//togglerLength_closed: 0,		
			togglerContent_closed: 'BLAH',
			
			togglerTip_closed: 'NUL console',
			
			size: 300,
			initClosed: false,
			minSize: 150,
			resizeWhileDragging: true,
			fxName: "none",
			onopen_end: nul.console.loadFrame
		}
	});
};
nul.load.console.use = {'operators': true, 'executionReady': true, 'HTML': true};

nul.console = {
	loadFrame: function(pane, $Pane) {
		if(!nul.console.frame.loaded) {
			nul.console.frame.attr('src', nul.rootPath + '/web/console/nulConsole.html'); 	//TODO 2: rel src
			nul.console.frame.ready(nul.console.frameLoaded);
			nul.console.frame.loaded = true;
		}
	},
	frameLoaded: function() {
		var cw = nul.console.frame[0].contentWindow;
		var cde = nul.console.frame[0].contentDocument.documentElement;
		cw.nul = nul;
		nul.ex.js.hook(cw);
		nul.status = nul.console.child.status;
	},
	close: function() {
		nul.console.layout.hide('south');
		//nul.status = my status line
	},
	open: function() {
		nul.console.layout.show('south');
		nul.status = nul.console.child.status;
	},
	extern: function(nwnd) {
		nwnd.nul = nul;
		nul.ex.hook(nwnd);
		nul.console.layout.hide('south');
	}
};

