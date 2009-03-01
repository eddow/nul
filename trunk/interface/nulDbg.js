/*  NUL language JavaScript framework
 *  (c) 2009 François Marie De Mey
 *
 * NUL is freely distributable under the terms of GNU GPLv3 license.
 *  For details, see the NUL project site : http://code.google.com/p/nul/
 *
 *--------------------------------------------------------------------------*/
 
function init()
{
	selectNamedTab($('info'),$('infoTS').value)
	nul.debug.callStack.table = $('callStack');
	nul.debug.kbase.table = $('kbase');
	nul.debug.kevol.table = $('kevol');
	nul.debug.logs.table = $('logs');
	src = document.getElementById('source');
	prd = document.getElementById('parsed');
	evd = document.getElementById('evaled');
	rcr = document.getElementById('recur');
	sbx = document.getElementById('sandBox');
	nul.globals.sandBox = nul.build().html_place(sbx);
}

function evaluate()
{
	rcr.innerHTML = '';
	prd.innerHTML = 'parsing...';
	evd.innerHTML = '';
	var v = nul.expression(src.value);
	prd.innerHTML = v.toHTML();
	prd.innerHTML = v.toHTML();
	evd.innerHTML = 'evaluating...';
	nul.execution.benchmark.measure('*evaluation',function(){
		v = v.evaluate();
	});
	evd.innerHTML = v.toHTML();

	sortLogs();
}

function testEvaluation()
{
	if(nul.debug) {
		nul.debug.jsDebug = !$('catch').checked;
		nul.debug.actionLog = $('shwActLog').checked;
		
		nul.debug.assert = $('shwAssert').checked;
		nul.debug.logging = $('shwLogging').checked;
		nul.debug.watches = $('shwWatches').checked;
	}
	nul.execution.reset();
	
	window.setTimeout('nul.debug.applyTables();', 100);
	
	try {
		if(nul.debug && nul.debug.jsDebug) evaluate();
		else try { evaluate(); }
		catch( err ) {
			nul.exception.notice(err);
			evd.innerHTML = (err == nul.failure)?'Failed.':err.message;
			if(nul.debug.watches && err.callStack) nul.debug.callStack.draw(err.callStack);
			if(nul.debug.watches && err.kb) nul.debug.kbase.draw(err.kb);
			if(nul.erroneusJS) throw nul.erroneusJS;
			//Forward JS errors to Firebug
		}
	} finally {
		nul.debug.applyTables();
		nul.execution.benchmark.draw($('benchmark'));
	}
}

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

function sortLogs() {
	$$('#logs .actionLog').each($('shwActLog').checked?Element.show:Element.hide)
}
