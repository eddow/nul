/*  NUL language JavaScript framework
 *  (c) 2009 E-med Ware
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
	nul.debug.logs.table = $('logs');
	if(!nul.debug.acts) $('shwLoggingActs').disabled = true;
	src = document.getElementById('source');
	bln = document.getElementById('belongs');
	evd = document.getElementById('evaled');
	rcr = document.getElementById('recur');
	sbx = document.getElementById('sandBox');
	//nul.globals.sandBox = nul.?.htmlPlace(sbx);
	for(var i in this) knGlobs[i] = true;
}

function evaluate()
{
	rcr.innerHTML = '';
	watchBelongs();
	evd.innerHTML = '';
	var v;
	nul.execution.benchmark.measure('*evaluation',function(){
		v = nul.expression(src.value);
	});
	evd.innerHTML = v?v.toHTML():'Empty!';
}

function testEvaluation()
{
	if(nul.debug) {
		nul.debug.jsDebug = !$('catch').checked;
		
		nul.debug.assert = $('shwAssert').checked;
		if($('shwLogging').checked) {
			nul.debug.logging = {error: true, fail: true};
			nul.debug.logging.knowledge = nul.debug.watches = $('shwWatches').checked;
			nul.debug.logging.ctxs = $('shwLoggingCtxs').checked;
			nul.debug.logging.evals = $('shwLoggingEvals').checked;
			nul.debug.logging.solve = $('shwLoggingSolve').checked;
			nul.debug.logging.acts = $('shwLoggingActs').checked;
			nul.debug.logging.perf = $('shwLoggingPerfs').checked;
		} else nul.debug.logging = false;
	}
	nul.execution.reset();
	
	window.setTimeout('nul.debug.applyTables();', 100);
	
	try {
		if(nul.debug && nul.debug.jsDebug) evaluate();
		else try { evaluate(); }
		catch( err ) {
			nul.exception.notice(err);
			evd.innerHTML = err.message;
			if(nul.debug.watches && err.callStack) nul.debug.callStack.draw(err.callStack);
			if(nul.debug.watches && err.kb) nul.debug.kbase.draw(err.kb);
			if(nul.erroneusJS) throw nul.erroneusJS;
			//Forward JS errors to Firebug
		}
	} finally {
		nul.debug.applyTables();
		nul.execution.benchmark.draw($('benchmark'));
		assertSmGlobals();
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

function shwLoggingClk() {
	if($('shwLogging').checked) $('loggingChk').show();
	else $('loggingChk').hide();
}

function watchBelongs(x) {
	while(bln.rows.length) bln.deleteRow(0);
	if(x) {
		rw.insertCell(0).innerHTML = x.toHTML() + ' belongs to ...';
		map(x.belong, function(i) {
			var rw = bln.insertRow(-1);
			rw.insertCell(0).innerHTML = i;
			rw.insertCell(0).innerHTML = this.toHTML();
		});
	}
}

var knGlobs = {}, ignGlobs = {};
function assertSmGlobals() {
	var nwGlb = [];
	for(var i in this)
		if(!knGlobs[i] && !ignGlobs[i] && '_fire'!= i.substr(0,5).toLowerCase()) {
			nwGlb.push(i);
			ignGlobs[i] = true;
		}
	if(0<nwGlb.length) alert('Unexpected global(s) created : ' + nwGlb.join(', ')); 
}
