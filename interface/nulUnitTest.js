/*  NUL language JavaScript framework
 *  (c) 2009 E-med Ware
 *
 * NUL is freely distributable under the terms of GNU GPLv3 license.
 *  For details, see the NUL project site : http://code.google.com/p/nul/
 *
 *--------------------------------------------------------------------------*/
//ℕ  &#x2115;
//ℚ	 &#x211a;
//ℤ  &#x2124;
//□  &#9633;
//∈  &isin;
//↵  &crarr;
//⇒  &rArr;
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
		rslt: '{n[g|0]; ((n[g|0]) &isin; &#x211a;)}'},
		{xpr: '{x => (x,x)}[1]',
		rslt: '{(1, 1)}'},
		{xpr: 'dec[4]; dec= {5 => 4 [] 4 => 3 [] 3 => 2 [] 2 => 1}',
		rslt: '{3}'},
		{xpr: 'S = (_,_); S 5',
		rslt: '{(5, _[g|2]) &#9633; (_[g|1], 5)}'},
		{xpr: '<{ nul.obj.litteral.make(34) }>',
		rslt: '{34}'},
	].named('Simples'),
	[
		{xpr: 'b["j"]'+
			'; f = ("j"=>"l", "l"=>"a", "p"=>"l")'+
			'; b = { x => y != x; f[x] = f[y] }',
		rslt: '{"p"}'},
		{xpr: 'i[1..3] _ ; i = { \\/x {x} => {} [] (a,b,.. o) => ((a,b),.. i[b,.. o] ) }',
		rslt: '((1, 2), (2, 3))'},
		{xpr: 'tp={ {} => {} [] (T,.. Ts) => ( T _,.. tp[Ts] ) }',
		rslt: '{{&phi; &rArr; &phi; &#9633; (T[1|0],.. Ts[1|1]) &rArr; (_[1|2],.. &crarr;[1|3]); ((_[1|2]) &isin; T[1|0] &and; (Ts[1|1] &rArr; &crarr;[1|3]) &isin; &uArr;[&crarr;|1])}}'},
		{xpr: 'tp[Q,str] ; tp={ {} => {} [] (T,.. Ts) => ( T _,.. tp[Ts] ) }',
		rslt: '{(_[g|4], _[g|8]); ((_[g|4]) &isin; &#x211a; &and; (_[g|8]) &isin; str)}'},
		{xpr:'t[Q,str] ; t ={ {} => {{}} [] (T,.. Ts) => { T _,.. t[Ts] _ } }',
		rslt:'{{(_[19|0], _[19|3]); ((_[19|0]) &isin; &#x211a; &and; (_[19|3]) &isin; str)}}'}
	].named('Complexs'),
	[
		{xpr: '( u::n 1 ::f "u" ::e "o", d::n 2 ::f "d" ::e "t" ) (x ::f "u")',
		rslt: '{u[g|0]; (([e: "o", f: "u", n: 1]u[g|0]))}'},
		{xpr: 'a; Q (a.nbr)',
		rslt: '{a[g|0]; (([nbr: &rarr;nbr[g|1]]a[g|0]) &and; (&rarr;nbr[g|1]) &isin; &#x211a;)}'},
		{xpr: '(cmplx c).pair ; c.real = 5 ; c.img = 3 ; cmplx = {_ ::real(Q r) ::img(Q i) ::pair(i,r)}',
		rslt: '{(3, 5)}'}
	].named('Attributes')
].named('Unit testing');

function rsltDiv(rslt) {
	var rslts = {
		succ:	{chr:'V', clr:'lightgreen'},
		fail:	{chr:'X', clr:'pink'},
		err:	{chr:'X', clr:'red'},
		unk:	{chr:'?', clr:'lightblue'},
		wrk:	{chr:'*', clr:'lightgray'}
	};
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
		var rv = $(tbody.insertRow(-1));
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
	
	for(var i=0; i<tests.length; ++i) if(tests[i])
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
			for(var j=0; j<rw.cells.length; ++j) if(rw.cells[j]) rw.cells[j].rowSpan=2;
			preCollapsed().insertCell(-1);
		}
	}
	cs.endCollapser('','').toString();
	preCollapsed('uncollapsing')
}

nul.load.unitTest = function() {
	if(!nul.debug.perf) $('perfTbl').hide();
	clpsSstm = nul.txt.clpsSstm(tbody = $('tests'),'up');
	drawTests(tests, clpsSstm, 0);
	nul.execution.reset();
};

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
	for(var i=0; i<tstsBats.length; ++i) if(tstsBats[i] && tstsBats[i].rslt<tRslt) tstsBats[i].rslt = tRslt;  
	prgTests(1+tn);
}

