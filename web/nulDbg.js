/*  NUL language JavaScript framework
 *  (c) 2009 E-med Ware
 *
 * NUL is freely distributable under the terms of GNU GPLv3 license.
 *  For details, see the NUL project site : http://code.google.com/p/nul/
 *
 *--------------------------------------------------------------------------*/

nul.load.debuger = function() {
	$('knownCmd').disable();
	$('resetCmd').disable();
	$('queryCmd').disable();
	selectNamedTab($('info'),$('infoTS').value);
	nul.debug.logs.table = $('logs');
	nul.debug.globalKlg = $('globalKlg');
	shwDbgOptClk();

	nul.debuger.init();
};

nul.load.debuger.use = {operators:true};

nul.debuger = {
	getSrcText: function() { return nul.debuger.DOM.src.value; },
	cmDone: function() {
		nul.debuger.DOM.editor.grabKeys(nul.debuger.eventKeyDown, function(kc) { return [116,117,119].include(kc); } );
		nul.debuger.getSrcText = function() { return nul.debuger.DOM.editor.getCode(); };
		for(var i in window) nul.debuger.knGlobs[i] = true;
	},
	eventKeyDown: function(e) {
		if(!e.charCode && !e.altKey && !e.ctrlKey && !e.metaKey && !e.shiftKey && nul.debuger.shortcuts[e.keyCode]) { 
			nul.debuger.shortcuts[e.keyCode]();
			e.stop();
		}
	},
	init: function() {
		nul.debuger.DOM.src = $('source');
		nul.debuger.DOM.evd = $('evaled');
		nul.debuger.DOM.wtc = $('watch');
		nul.debuger.DOM.qrd = $('queried');

		nul.debuger.shortcuts = {
			116: nul.debuger.reset,		//F5
			117: nul.debuger.query,		//F6
			119: nul.debuger.eval,		//F8
			120: nul.debuger.known		//F9
		};
		nul.debuger.DOM.src.observe('keydown', nul.debuger.eventKeyDown);

		nul.debuger.DOM.editor = CodeMirror.fromTextArea(nul.debuger.DOM.src, {
			parserfile: ["parsenul.js"],
			path: "../3rd/codemirror/",
			stylesheet: "../3rd/codemirror/nulcolors.css",
			tabMode: 'shift',
			lineNumbers: true,
			initCallback: nul.debuger.cmDone,
			onChange: function() { if(nul.debuger.DOM.editor.editor) nul.debuger.DOM.src.value = nul.debuger.DOM.editor.getCode(); }
		});
	},
	reset: function() {
		$('resetCmd').disable();
		nul.execution.reset();
		nul.debuger.DOM.evd.innerHTML = '';
		nul.debuger.DOM.qrd.innerHTML = '';
	},

	DOM: {},
	evaled: null,
	eval: function() {
		nul.debuger.test('Evaluating...', nul.debuger.DOM.evd, function() {
			nul.debuger.evaled = nul.nulRead(nul.debuger.getSrcText());
			if(nul.debuger.evaled.dependance().usages['global'])
				$('knownCmd').enable();
			return nul.debuger.evaled.toHtml();
		});
	},
	query: function() {
		if(!nul.debuger.evaled) return;
		nul.debuger.test('Querying...', nul.debuger.DOM.qrd, function () {
			return nul.data.query(nul.debuger.evaled).toHtml();
		});
	},
	known: function() {
		if(!nul.debuger.evaled || !nul.debuger.evaled.dependance().usages['global']) return;
		$('knownCmd').disable();
		$('resetCmd').enable();
		nul.debuger.test('Knowing...', nul.debuger.DOM.evd, function() {
			return nul.known(nul.debuger.evaled, 'this expression').toHtml();
		});
	},
	
	test: function(prgrsMsg, dst, cb)
	{
		if(nul.debug) {	//Set the debug options as it is checked
			if($('shwLogging').checked) {
				nul.debug.logging = {error: true, fail: true};
				var opts = $('loggingChk').options;
				for(var o=0; opts[o]; ++o)
					nul.debug.logging[opts[o].value] = opts[o].selected;
			} else nul.debug.logging = false;
			nul.debug.begin($('dbgBreak').checked?parseInt($('dbgBreakLimit').value):0);
		}
		
		window.setTimeout('nul.debug.applyTables();', 100);
		
		try {
			nul.debuger.DOM.wtc.innerHTML = '';
			dst.innerHTML = prgrsMsg;
			$('queryCmd').disable();
			dst.innerHTML = cb();
			$('queryCmd').enable();
		} catch( err ) {
			nul.exception.notice(err);
			dst.innerHTML = err.message;
			if(nul.erroneusJS) throw nul.erroneusJS;
			//Forward JS errors to Firebug
		} finally {
			nul.debug.applyTables();
			nul.execution.benchmark.draw($('benchmark'));
			nul.debuger.assertSmGlobals();
		}
	},
	watch: function(v)
	{
		nul.debuger.DOM.wtc.innerHTML = v.toHtml();
	},
	
	knGlobs: {},
	ignGlobs: {},
	assertSmGlobals: function() {
		var nwGlb = [];
		for(var i in window)
			if(!nul.debuger.knGlobs[i] && !nul.debuger.ignGlobs[i] && '_fire'!= i.substr(0,5).toLowerCase()) {
				nwGlb.push(i);
				nul.debuger.ignGlobs[i] = true;
			}
		if(0<nwGlb.length) alert('Unexpected global(s) created : ' + nwGlb.join(', ')); 
	}
	
};

function selectNamedTab(elm, tnm) {
	$$('.msTab').each(function(tb) {
		if(tnm == tb.attributes.name.value) tb.addClassName('selected');
		else tb.removeClassName('selected');
	});
}

function tabSelect(te) {
	if(te.hasClassName('selected')) return;
	selectNamedTab(te.parentNode.parentNode, $('infoTS').value = te.attributes.name.value);
}

function shwDbgOptClk() {
	if($('shwLogging').checked) $('shwLoggingFS').removeClassName('collapsed');
	else $('shwLoggingFS').addClassName('collapsed');
	if($('dbgBreak').checked) $('dbgBreakFS').removeClassName('collapsed');
	else $('dbgBreakFS').addClassName('collapsed');
}

function nw(v) { nul.debuger.watch(v); return 'drawn'; }
