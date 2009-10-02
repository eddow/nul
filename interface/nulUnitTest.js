/*  NUL language JavaScript framework
 *  (c) 2009 E-med Ware
 *
 * NUL is freely distributable under the terms of GNU GPLv3 license.
 *  For details, see the NUL project site : http://code.google.com/p/nul/
 *
 *--------------------------------------------------------------------------*/
//ℕ  &#x2115;
//ℚ	 &#x211a;
//□  &#9633;
//∈ &isin;
//↵	&crarr;
//⇒	&rArr;
Array.prototype.named = function(nm) { this.name = nm; return this; };

tests = [
	[
		{xpr: '{ a, a } (1, 1)',
		rslt: '{(1, 1)}'},
		{xpr: '{ a, a } (1, 2)',
		rslt: '&phi;'},
		{xpr: '{ a, a } (1, _)',
		rslt: '{(1, 1)}'},
		{xpr: 'Q n',
		rslt: '{n[g|1]; ((n[g|1]) &isin; &#x211a;)}'},
		{xpr: '{x => (x,x)} 1',
		rslt: '{(1, 1)}'},
		{xpr: 'x; [..] (x=>1)',
		rslt: '{1}'},
		{xpr: 'dec 4; dec= {5 => 4 [] 4 => 3 [] 3 => 2 [] 2 => 1}',
		rslt: '{3}'},
		{xpr: 'S = (_,_); S 5',
		rslt: '{(5 &rArr; &crarr;[g|3], _[g|2]) &#9633; (_[g|1], 5 &rArr; &crarr;[g|3])}'},
	].named('Simples'),
	[
		{xpr: 'brother "John"'+
			'; father = (("Luke", "John"), ("Abraham", "Luke"), ("Luke", "Peter"))'+
			'; brother = { (a => b); father(f, a); father(f, b) }',
		rslt: '("John", "Peter")'},
	].named('Complexs'),
].named('Unit testing');

function rsltDiv(rslt) {
	var rslts = {
		succ:	{chr:'V', clr:'lightgreen'},
		fail:	{chr:'X', clr:'pink'},
		err:	{chr:'X', clr:'red'},
		unk:	{chr:'?', clr:'lightblue'},
		wrk:	{chr:'*', clr:'lightgray'},
	}
	rslt = rslts[rslt];
	return '<div style="'+
		'width: 1em; '+
		'text-align: center; '+
		'background-color: '+rslt.clr+'; '+
		'font-size: 1.4em;">'+
		rslt.chr+'</div>';
}

function drawTests(tests, cs, lvl) {
	function preCollapsed(c) {
		var rv = tbody.insertRow(-1);
		if(0<lvl) {
			for(var i=0; i<lvl-1; ++i) rv.className = 'collapsed '+rv.className;
			if(c) rv.addClassName(c);
			else rv.className = 'collapsed '+rv.className;
		}
		return rv;
	}
	var rw = preCollapsed('unsubcollapsing');
	rw.insertCell(-1).innerHTML = '<h'+(lvl+1)+'>'+cs.collapser('')+tests.name+'</hh'+(lvl+1)+'>';

	rw.insertCell(-1).innerHTML = 
		'<input type="checkbox" checked="checked" '+
			'onclick="prgGrpCheck(this.checked,'+tbody.rows.length+')" />'+
		'<input type="button" value="'+tests.length+'" onclick="prgGrpTest('+tbody.rows.length+')" />';
	rw.insertCell(-1).innerHTML = rsltDiv('unk');
	rw.testGroup = tests;
	
	for(var i=0; i<tests.length; ++i)
	{
		var t = tests[i];
		if(isArray(t)) drawTests(t, cs, 1+lvl);
		else {
			var tn = tbody.rows.length;
			rw = preCollapsed();
			rw.test = t;
			//Expression
			rw.insertCell(-1).innerHTML = t.desc || escapeHTML(t.xpr);
			//Test?
			rw.insertCell(-1).innerHTML = 
				'<input type="checkbox" checked="checked" id="t'+tn+'" />'+
				'<input type="button" value="1" onclick="prgTest('+tn+')" />';
			//Result
			rw.insertCell(-1).innerHTML = rsltDiv('unk');
			rw.insertCell(-1).innerHTML = t.rslt;
			for(var j=0; j<rw.cells.length; ++j) rw.cells[j].rowSpan=2;
			preCollapsed().insertCell(-1);
		}
	}
	cs.endCollapser('','');
	preCollapsed('uncollapsing')
}

function init() {
	if(!nul.debug.perf) $('perfTbl').hide();
	clpsSstm = nul.txt.clpsSstm(tbody = $('tests'),'up');
	drawTests(tests, clpsSstm, 0);
	nul.execution.reset();
}

function setResult(tn, rslt, comm) {
	var rw = tbody.rows[tn];
	rw.cells[2].innerHTML = rsltDiv(rslt);
	rw.cells[3].rowSpan=comm?1:2;
	tbody.rows[1+tn].cells[0].innerHTML = comm || '';
	return rslt;
}

function prgTest(tn) {
	setResult(tn,'wrk');
	setTimeout('doTest('+tn+')',200);
}

function doTest(tn) {
	var v, test = tbody.rows[tn].test;
	try {
		v = nul.read(test.xpr).toFlat();
	} catch(err) {
		nul.exception.notice(err);
		if(nul.erroneusJS) throw nul.erroneusJS;
		return setResult(tn, 'err', err.message || err);
	}
	nul.execution.benchmark.draw($('benchmark'));
	if(v== test.rslt) return setResult(tn, 'succ');
	return setResult(tn, 'fail', v);
}

function prgGrpCheck(c, lc) {
	for(var l = lc; l<clpsSstm.collapsing[lc]; ++l)
		map(tbody.rows[l].select('input[type=checkbox]'), function() { this.checked = c; });
}

function prgGrpTest(tn) {
	tstsBats = [];
	prgTests(tn-1);
}

function prgTests(tn) {
	var rw, ic;
	while(true) {
		if(0<tstsBats.length && tn== tstsBats[0].endl) {
			tstsBats[0].rsltDiv.innerHTML = rsltDiv(['unk','succ','fail','err'][tstsBats[0].rslt]);
			tstsBats.shift();
			if(0==tstsBats.length) {
				nul.execution.reset();
				return;
			}
		}
		ic = (rw=tbody.rows[tn]).select('input[type=checkbox]')
		if(ic) {
			if(rw.test && ic[0].checked) break;
			if(rw.testGroup) {
				rw.cells[2].innerHTML = rsltDiv('wrk');
				tstsBats.unshift({
					rslt: 0, rsltDiv: rw.cells[2], endl: [clpsSstm.collapsing[tn+1]] });
			}
		}
		++tn;
	}
	setResult(tn,'wrk');
	setTimeout('doTests('+tn+')',200);
}

function doTests(tn) {
	var tRslt = {
		succ:	1,
		fail:	2,
		err:	3
	};
	var tRslt = tRslt[doTest(tn)];
	for(var i=0; i<tstsBats.length; ++i) if(tstsBats[i].rslt<tRslt) tstsBats[i].rslt = tRslt;  
	prgTests(1+tn);
}

