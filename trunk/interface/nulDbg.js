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
	nul.debug.logs.table = $('logs');
	if(!nul.debug.acts) $('shwLoggingActs').disabled = true;
	src = document.getElementById('source');
	prd = document.getElementById('parsed');
	evd = document.getElementById('evaled');
	rcr = document.getElementById('recur');
	sbx = document.getElementById('sandBox');
	nul.globals.sandBox = nul.build.htmlPlace(sbx);
	for(var i in this) knGlobs[i] = true;
}

var toSolve = null;
function extractThis() {
	$('solutionFuz').innerHTML = $('solutionLst').innerHTML = '';

	var v;
	if(nul.debug && nul.debug.jsDebug) {
		v = toSolve.extraction();
		evd.innerHTML = toSolve.toHTML();
	} else try { v = toSolve.extraction() }
	catch( err ) {
		nul.exception.notice(err);
		evd.innerHTML = err.message;
		if(nul.debug.watches && err.callStack) nul.debug.callStack.draw(err.callStack);
		if(nul.debug.watches && err.kb) nul.debug.kbase.draw(err.kb);
		if(nul.erroneusJS) throw nul.erroneusJS;
		//Forward JS errors to Firebug
		return;
	}

	if(','!= v.charact)
		return $('solutionFuz').innerHTML = 'Unexpected solution :<br />' + v.toHTML();
	if(v.components.follow) $('solutionFuz').innerHTML = v.components.follow.toHTML();
	for(var n=0; n<v.components.length; ++n)
		$('solutionLst').insert(new Element('li').update(v.components[n].toHTML()));
}

function setToSolve(v) {
	$('extractBu').disabled = !v;
	$('solutionFuz').innerHTML = $('solutionLst').innerHTML = '';
	toSolve = v;
	if($('extractChk').checked && v) extractThis();
}

function evaluate()
{
	rcr.innerHTML = '';
	prd.innerHTML = 'parsing...';
	evd.innerHTML = '';
	var v = nul.expression(src.value);
	prd.innerHTML = v.toHTML();
	evd.innerHTML = 'evaluating...';
	nul.execution.benchmark.measure('*evaluation',function(){
		v = v.evaluate();
	});
	evd.innerHTML = v.toHTML();
	setToSolve(v);
}

function testEvaluation()
{
	if(nul.debug) {
		nul.debug.jsDebug = !$('catch').checked;
		
		nul.debug.assert = $('shwAssert').checked;
		if($('shwLogging').checked) {
			nul.debug.logging = {error: true};
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
//TODO: store this.keys to see if no globals are created by mistake
