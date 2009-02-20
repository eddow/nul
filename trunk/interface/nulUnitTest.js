/*  NUL language JavaScript framework
 *  (c) 2009 François Marie De Mey
 *
 * NUL is freely distributable under the terms of GNU GPLv3 license.
 *  For details, see the NUL project site : http://code.google.com/p/nul/
 *
 *--------------------------------------------------------------------------*/
 
tests = [
	{xpr: '\\/x ((\\/y (y, y+1)) = (4, x)), x',
	rslt: '((4 , 5) , 5)'},
	{xpr: '\\/x ((\\/y (y, y+1)) = (x, x)), x',
	rslt: '(((x[&crarr;|1] + 1) , (x[&crarr;|1] + 1)) , (x[&crarr;|1] + 1))'},
	{xpr: '\\/a \\/b (\\/z (z+1, z+2)) = (a,b)',
	rslt: '((z[2|2] + 1) , (z[2|2] + 2))'},
	{xpr: '\\/a \\/b \\/c \\/z ((a+1)=(b+2))=z, (c+3)=z, a=2',
	rslt: '((3 = (b[1|3] + 2)) , ((c[2|3] + 3) = 3) , 2)'},
	{xpr: '\\/x \\/f f={\\/y y:-y+2}, f[1:-x], x, f',
	rslt: '({(y[0|1] &lArr; (y[0|2] + 2))} , (1 &lArr; 3) , 3 , {(y[0|1] &lArr; (y[0|2] + 2))})'},
	{xpr: '{ [x _, x] }[5,(5,(5,(5,(5,_))))]',
	rslt:  '(5 , x[&crarr;|1])'},
	{xpr: '{\\/a \\/b (a,b) :- a>b? a : b} [(5,4) :- _]',
	rslt: '((5 , 4) &lArr; 5)'},
	{xpr: '[e!e] = (1>0 [] 1<0)',
	rslt: 'Failure'},
	{xpr: '[b [a (a,_)] = (b,5) ]',
	rslt: '(a[&crarr;|1] , 5)'},
	{xpr: '\\/z (z=1 [] z=2)',
	rslt: '((((-[0|4]) = (1)) ; 1) &#9633; (((-[0|4]) = (2)) ; 2))'},
	{xpr: '\\/z (z+1)=(1 [] 2)',
	rslt: '((1 = (z[0|3] + 1)) &#9633; (2 = (z[0|3] + 1)))'},
	{xpr: '\\/z (z+2)=z=1',
	rslt: 'Failure'},
	{xpr: '\\/z \\/a (z*1)=(((a+1=a+2);(z = 1)) [] z = 2)',
	rslt: '((((-[0|4]) = (1)) ; ((a[1|4] + 1) = (a[1|4] + 2)) ; z[0|2]) &#9633; (((-[0|4]) = (2)) ; z[0|2]))'},
	{xpr: '\\/a {(a+1)=(a+2)}[(a+3)=(a+4)]',
	rslt: '((a[0|2] + 1) = (a[0|2] + 2) = (a[0|2] + 3) = (a[0|2] + 4))'},
	{xpr: '[f { 1 [] (\\/x x>1?x:- x * f[x-1]) }][4]',
	rslt: '24'},];

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

function init() {
	$('rslt').innerHTML = rsltDiv('unk');
	tbody = $('tests');
	for(var i=0; i<tests.length; ++i)
	{
		var t = tests[i];
		rw = tbody.insertRow(-1);
		//Expression
		rw.insertCell(-1).innerHTML = escapeHTML(t.xpr);
		//Test?
		rw.insertCell(-1).innerHTML = 
			'<input type="checkbox" checked="checked" id="t'+i+'" />'+
			'<input type="button" value="1" onclick="prgTest('+i+')" />';
		//Result
		rw.insertCell(-1).innerHTML = rsltDiv('unk');
		rw.insertCell(-1).innerHTML = t.rslt;
		for(var j=0; j<rw.cells.length; ++j) rw.cells[j].rowSpan=2;
		tbody.insertRow(-1).insertCell(-1);
	}
}

function setResult(tn, rslt, comm) {
	var rw = tbody.rows[tn*2];
	rw.cells[2].innerHTML = rsltDiv(rslt);
	rw.cells[3].rowSpan=comm?1:2;
	tbody.rows[1+tn*2].cells[0].innerHTML = comm || '';
	return rslt;
}

function prgTest(tn) {
	setResult(tn,'wrk');
	setTimeout('doTest('+tn+')',200);
}

function launchTests(tn, dbg) {
	glblRslt=0;
	$('rslt').innerHTML = rsltDiv('wrk');
	prgTests(0);
}

function prgTests(tn) {
	while(tn < tests.length && !$('t'+tn).checked) ++tn;
	if(tn >= tests.length) {
		$('rslt').innerHTML = rsltDiv(['succ', 'fail', 'err'][glblRslt]);
		return;
	}
	setResult(tn,'wrk');
	setTimeout('doTests('+tn+')',200);
}

function doTests(tn) {
	var tRslt = {
		succ:	0,
		fail:	1,
		err:	2
	};
	var tRslt = tRslt[doTest(tn)];
	if(tRslt> glblRslt) glblRslt = tRslt;
	prgTests(1+tn);
}

function doTest(tn) {
	var v;
	nul.debug.levels = nul.debug.assert = !$('qndTst').checked;
	try {
		nul.debug.reset();
		v = nul.expression(tests[tn].xpr).ctxd().evaluate().toString();
	} catch(err) {
		nul.exception.notice(err);
		if(nul.erroneusJS) throw nul.erroneusJS;
		if(nul.failure!= err) return setResult(tn, 'err', err.message || err);
		v = 'Failure';
	}
	if(v== tests[tn].rslt) return setResult(tn, 'succ');
	return setResult(tn, 'fail', v);
}