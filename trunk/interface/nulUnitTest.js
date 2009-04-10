/*  NUL language JavaScript framework
 *  (c) 2009 François Marie De Mey
 *
 * NUL is freely distributable under the terms of GNU GPLv3 license.
 *  For details, see the NUL project site : http://code.google.com/p/nul/
 *
 *--------------------------------------------------------------------------*/
//ℕ  &#x2115;
//□  &#9633;
Array.prototype.named = function(nm) { this.name = nm; return this; };

tests = [
	[
		{xpr: '{ Q x :- 2*x } 4',
		rslt: '{8}'},
		{xpr: 'Q x; (y+1, y) = (x, 4)',
		rslt: '{5}'},
		{xpr: '(z+1, z+2) = (Q a, Q b)',
		rslt: '{((z[0|c2] + 1) , (z[0|c2] + 2))}'},
		{xpr: '((a+1)=(b+2))= z, (c+3)=z, a=2',
		rslt: '{(3 , 3 , 2)}'},
		{xpr: '(z+1, z+2) = (Q a, Q b); z=3',
		rslt: '{(4 , 5)}'},
		{xpr: 'd 4; d = { Q x :- x * 2 }',
		rslt: '{8}'},
		{xpr: '(a+1)=(a+2)=(a+3)',
		rslt: '{(a[0|c2] + 1); ((a[0|c2] + 1) = (a[0|c2] + 2) = (a[0|c2] + 3))}'},
		{xpr: 'S(n+1,"str"); S= {1, c}; Q n',
		rslt: '{(1 , "str")}'},
		{xpr: '{n :- {(Q x, Q y) :- x+y} (1, n)} 10',
		rslt: '{11}'}
	].named('Local management'),
	[
		{xpr: 'v; (z=1 [] z=2); v=z',
		rslt: '(1 , 2)'},
		{xpr: '(z+1)=(1 [] 2)',
		rslt: '(1 , 2)'},
		
		{xpr: '\\/a \\/b { a [] b } 5, Q a, Q b',
		rslt: '{((5 , a[0|c2] , 5) &#9633; (5 , 5 , b[1|c2]))}'},
		{xpr: '{ Q a [] Q b } 5, a, b',
		rslt: '{((5 , a[0|c2] , b[1|c2]) &#9633; (5 , a[0|c2] , b[1|c2]))}'},
		{xpr: '(z*1)=(((a+1=a+2);(z = 1)) [] z = 2)',
		rslt: '(1 , 2)'},
		{xpr: '{ (a,b,c) [] (d,e,f) }(_,1,2)',
		rslt: '{((_[0|c2] , 1 , 2) &#9633; (_[0|c2] , 1 , 2))}'},
	].named('OR-s management'),
	[
		{xpr: '(z+2)=z=1',
		rslt: '&phi;'},
		{xpr: '(e= 1-e) = (0 [] 1)',
		rslt: '&phi;'},
		{xpr: '(y, y+1) = (x, x), x',
		rslt: '{((ar1:(y[&crarr;|ar1] + 1) , ar1:(y[&crarr;|ar1] + 1)) , ar1:(y[&crarr;|ar1] + 1))}'},
		{xpr: 'x; (y, y+1) = (x, x)',
		rslt: '{ar1:(y[&crarr;|ar1] + 1)}'},
		
		/*
		{xpr: '{ x= (_, x) }(5,(5,(5,(5,(5,_)))))',
		rslt:  '(5 , x[&crarr;|1])'},
		{xpr: '[b [a (a,_)] = (b,5) ]',
		rslt: '(a[&crarr;|1] , 5)'},
*/
	].named('Auto-reference'),
/*	[
		{xpr: '{_}z (1::d 2.)=(1::d z.) ; z',
		rslt: '2'},
		{xpr: '({1::d 2.} x x::d _. ::q d*2.) -> q',
		rslt: '4'}
	].named('Attributes management'),*/
	[
		{xpr: '(p(1,1) [] p(1,2) [] p(2,5)) ; p= ((1,5), (2,5),.. { Q x, x })',
		rslt: '((1 , 1) , (2 , 5))'},
		{xpr: 'ld 5 ; ld={ 0 :- {} [] (Q n > 0) :- ((n, _) ,.. ld (n-1)) }',
		rslt: '{((5 , _[0|c2]) , (4 , _[1|c2]) , (3 , _[2|c2]) , (2 , _[3|c2]) , (1 , _[4|c2]))}'}
	].named('Lists management'),
	[
		{xpr: 'f 5; f={ 0 :- 1 [] Q n > 0 :- n * f(n-1)}',
		desc: 'Factorial of 5',
		rslt: '{120}'},
		{xpr: 'fib 5; fib={ (0 [] 1) :- 1 [] Q n > 0 :- fib(n-1) + fib(n-2) }',
		desc: 'Unoptimised Fibbonacci on 5',
		rslt: '{8}'},
		{xpr: 'fib 5 ; fib = {Q n > 0 :- (fibaux={ (Q x, _, 0) :- x [] (Q x, Q y, Q z > 0) :- fibaux(y, x+y, z-1) }) (1, 1, n) }',
		desc: 'Accumulated Fibbonacci on 5',
		rslt: '{8}'}
		/*{xpr: '[f{ 1 [] ({_}x x>1?x:- x * f[x-1]) }][5]',
		rslt: '120'},
		{xpr: '{ {_}n n:- [fib { {_}x x, _, 1 :- x [] {_}x {_}y {_}z z > 1 ? (x, y, z) :- fib[y, y+x, z-1] }][1, 1, n] }[5]',
		desc: 'Accumulated Fibbonacci on 5',
		rslt: '5'}*/
	].named('Recursive algorithms'),
	[
		{xpr: 'S = ((1, _, _), (2, _, _), (3, _, _)); S(1,_,"a"); S(3,"b",_); S(_,"c","d")',
		desc: 'Solution 3 items/3 components',
		rslt: '{((1 , _[0|c2] , "a") , (2 , "c" , "d") , (3 , "b" , _[1|c2]))}'},
		{xpr: 'x; S=( (1,a), (2,b), (3,c) ); S(x,9); S(1,8)',
		rslt: '(2 , 3)'}
	].named('Resolutions')
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
		(nul.debug.assert?rslt.chr:rslt.chr.toLowerCase())+'</div>';
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
	clpsSstm = nul.text.clpsSstm(tbody = $('tests'),'up');
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
	nul.debug.assert = !$('qndTst').checked;
	try {
		v = v = nul.expression(test.xpr).evaluate().toString();
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

