/*  NUL language JavaScript framework
 *  (c) 2009 E-med Ware
 *
 * NUL is freely distributable under the terms of GNU GPLv3 license.
 *  For details, see the NUL project site : http://code.google.com/p/nul/
 *
 *--------------------------------------------------------------------------*/
 
nul.load.nulDbg = function() {
	selectNamedTab($('info'),$('infoTS').value);
	nul.debug.callStack.table = $('callStack');
	nul.debug.logs.table = $('logs');
	src = $('source');
	evd = $('evaled');
	wtc = $('watch');
	qrd = $('queried');
	for(var i in window) knGlobs[i] = true;
};

function tquery() {
	return nul.data.query($('queryCmd').query).toHtml();
}

function tread()
{
	var v = nul.read(src.value);
	$('queryCmd').query = v;
	return v.toHtml();
	var cpt = 0;
	while('pair'== v.expression) {
		++cpt;
		v = v.second;
	}
	return cpt;
}

function test(cb, dst, prgrsMsg)
{
	if(nul.debug) {
		if($('shwLogging').checked) {
			nul.debug.logging = {error: true, fail: true};
			var opts = $('loggingChk').options;
			for(var o=0; opts[o]; ++o)
				nul.debug.logging[opts[o].value] = opts[o].selected;
		} else nul.debug.logging = false;
	}
	
	window.setTimeout('nul.debug.applyTables();', 100);
	
	try {
		wtc.innerHTML = '';
		dst.innerHTML = prgrsMsg;
		$('queryCmd').writeAttribute('disabled','true');
		dst.innerHTML = cb();
		$('queryCmd').writeAttribute('disabled', null);
	} catch( err ) {
		nul.exception.notice(err);
		dst.innerHTML = err.message;
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
