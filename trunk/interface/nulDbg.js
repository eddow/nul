/*  NUL language JavaScript framework
 *  (c) 2009 E-med Ware
 *
 * NUL is freely distributable under the terms of GNU GPLv3 license.
 *  For details, see the NUL project site : http://code.google.com/p/nul/
 *
 *--------------------------------------------------------------------------*/
 
function init()
{
	selectNamedTab($('info'),$('infoTS').value);
	nul.debug.callStack.table = $('callStack');
	nul.debug.logs.table = $('logs');
	src = document.getElementById('source');
	evd = document.getElementById('evaled');
	wtc = document.getElementById('watch');
	sbx = document.getElementById('sandBox');
	//nul.globals.sandBox = nul.?.htmlPlace(sbx);
	for(var i in this) knGlobs[i] = true;
}

function evaluate()
{
	wtc.innerHTML = '';
	evd.innerHTML = '';
	var v = nul.execution.benchmark.measure('*evaluation',function(){
		return nul.read	(src.value);
	});
	return evd.innerHTML = v.toHtml();
	var cpt = 0;
	while('pair'== v.expression) {
		++cpt;
		v = v.second;
	}
	evd.innerHTML = cpt;
}

function testEvaluation()
{
	if(nul.debug) {
		if($('shwLogging').checked) {
			nul.debug.logging = {error: true, fail: true};
			nul.debug.logging.Resolution = $('shwLoggingResolution').checked;
			nul.debug.logging.Unification = $('shwLoggingUnification').checked;
			nul.debug.logging.Wrapping = $('shwLoggingWrapping').checked;
			nul.debug.logging.Knowledge = $('shwLoggingKnowledge').checked;
			nul.debug.logging.Represent = $('shwLoggingRepresent').checked;
			nul.debug.logging.Prune = $('shwLoggingPrune').checked;
		} else nul.debug.logging = false;
	}
	nul.execution.reset();
	
	window.setTimeout('nul.debug.applyTables();', 100);
	
	try { evaluate(); }
	catch( err ) {
		nul.exception.notice(err);
		evd.innerHTML = err.message;
		if(nul.debug.watches && err.callStack) nul.debug.callStack.draw(err.callStack);
		if(nul.erroneusJS) throw nul.erroneusJS;
		//Forward JS errors to Firebug
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
