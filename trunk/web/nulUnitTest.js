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
var parent_id;

tests = [
	[
		{xpr: '{ a, a } (1, 1)',
		rslt: '{(1, 1)}'},
		{xpr: '{ a, a } (1, 2)',
		rslt: '&phi;'},
		{xpr: '{ a, a } (1, _)',
		rslt: '{(1, 1)}'},
		{xpr: '.Q n',
		rslt: '{n[g|@0]; ((n[g|@0]) &isin; &#x211a;)}'},
		{xpr: '{x => (x,x)}[1]',
		rslt: '{(1, 1)}'},
		{xpr: 'dec[4]; dec= {5 => 4 [] 4 => 3 [] 3 => 2 [] 2 => 1}',
		rslt: '{3}'},
		{xpr: 'S = (_,_); S 5',
		rslt: '{(5, _[g|@0]) &#9633; (_[g|@1], 5)}'},
		{xpr: '<{ nul.obj.litteral.make(34) }>',
		rslt: '{34}'}
	].named('Simples'),
	[
		{xpr: 'b["j"]'+
			'; f = ("j"=>"l", "l"=>"a", "p"=>"l")'+
			'; b = { x => y != x; f[x] = f[y] }',
		rslt: '{"p"}'},
		{xpr: 'i[1..3] _ ; i = { _,. => {} [] (a,b,.. o) => ((a,b),.. i[b,.. o] ) }',
		rslt: '((1, 2), (2, 3))'},
		{xpr: '{:tp {} => {} [] (T,.. Ts) => ( T _,.. tp[Ts] ) }',
		rslt: '{{&phi; &rArr; &phi; &#9633; (T[@k|@0],.. Ts[@k|@1]) &rArr; (_[@k|@2],.. &crarr;[@k|@3]); ((_[@k|@2]) &isin; T[@k|@0] &and; (Ts[@k|@1] &rArr; &crarr;[@k|@3]) &isin; tp[&crarr;|@r])}}'},
		{xpr: '{:tp {} => {} [] (T,.. Ts) => ( T _,.. tp[Ts] ) }[.Q, .text]',
		rslt: '{(_[g|@4], _[g|@8]); ((_[g|@4]) &isin; &#x211a; &and; (_[g|@8]) &isin; text)}'},
		{xpr:'{:t {} => {{}} [] (T,.. Ts) => { T _,.. t[Ts] _ } }[.Q, .text]',
		rslt:'{{(_[@k|@0], _[@k|@3]); ((_[@k|@0]) &isin; &#x211a; &and; (_[@k|@3]) &isin; text)}}'},
		{xpr:'{:ap ({}, s) => s [] ((a,.. r), s) => (a,.. ap[r,s])}[(1,2,3), (4,5,6)]',
		rslt:'{(1, 2, 3, 4, 5, 6)}'}
	].named('Complexs'),
	[
		{xpr: '( u::n 1 ::f "u" ::e "o", d::n 2 ::f "d" ::e "t" ) (x ::f "u")',
		rslt: '{u[g|@0]; (([e: "o", f: "u", n: 1]u[g|@0]))}'},
		{xpr: 'a; .Q (a.nbr)',
		rslt: '{a[g|@0]; (([nbr: &rarr;nbr[g|@1]]a[g|@0]) &and; (&rarr;nbr[g|@1]) &isin; &#x211a;)}'},
		{xpr: '(cmplx c).pair ; c.real = 5 ; c.img = 3 ; cmplx = {_ ::real(Q r) ::img(Q i) ::pair(i,r)}',
		rslt: '{(3, 5)}'}
	].named('Attributes'),
	[
	 	{xpr: '.document["#sandBox b"](.text _)',
	 	rslt: '{"yh"}'},
	 	{xpr: '.xml["xml/test.xml"].ab',
	 	rslt: '{"bidon"}'},
	 	{xpr: '.time["Jul 8, 2005"].year',
		rslt: '{2005}'},
	 	{xpr: '.time.now.year',
		rslt: '{'+(new Date().getFullYear())+'}'}
	].named('Data'),
	[
	 	{xpr: '<n><a q="1" w="2" /><a q="3" e="4" /></n> [<a q="5" w="6" e="7" r="8" />]',
	 	rslt: '{&crarr;[g|@1]; (([q: "1", w: "2", # : 0, e: "7", r: "8"]&crarr;[g|@1])) &#9633; &crarr;[g|@1]; (([q: "3", e: "4", # : 0, w: "6", r: "8"]&crarr;[g|@1]))}'}
	].named('Nodes')	
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

function createRow(tp, name, tn, rslt) {
	var rv = $j('<tr></tr>');
	rv.append('<'+tp+'>'+name+'</'+tp+'>');
	if(rslt) rv.append('<td><input type="checkbox" checked="checked" '+
			'onclick="prgGrpCgheck"(this.checked,'+'" />'+tn+
			'<input type="button" value="1" onclick="prgTest('+tn+')" /></td><td>'+
			rsltDiv('unk')+'</td><td>'+
			rslt+'</td>');
	else rv.append('<td><input type="checkbox" checked="checked" '+
			'onclick="prgGrpCheck(this.checked,'+tn+')" />'+
			'<input type="button" value="*" onclick="prgGrpTest('+tn+')" /></td></tr>');
	return rv;
}

function drawTests(tests, tbody) {
	
	
	var row;
	var tn = tbody.nbrRows();
	row = createRow('th', tests.name, tn, 0);
	/*row = $j('<tr><th>'+tests.name+'</th><td>'+
			'<input type="checkbox" checked="checked" '+
			'onclick="prgGrpCheck(this.checked,'+tn+')" />'+
			'<input type="button" value="*" onclick="prgGrpTest('+tn+')" /></td></tr>');*/
	tbody.append(row);
	for(var i=0;i<tests.length;i++)
	{
		var t = tests[i];
		if($j.isArray(t)) drawTests(t,tbody);
		else
		{
			row = createRow('td', t.xpr, tn, t.rslt);
			/*row = $j('<tr><td>'+t.xpr+'</td><td>'+
					'<input type="checkbox" checked="checked" id="t'+tn+'" />'+
					'<input type="button" value="1" onclick="prgTest('+tn+')" />'+'</td><td>'+
					rsltDiv('unk')+'</td><td>'+
					t.rslt+'</td></tr>');*/	
			tbody.append(row);			
		}
	}
	
	/*function preCollapsed(c) {
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
		'<input type="button" value="*" onclick="prgGrpTest('+tbody.rows.length+')" />';
	rw.insertCell(-1).innerHTML = rsltDiv('unk');
	rw.testGroup = tests;
	
	for(var i=0; i<tests.length; ++i)
	{
		var t = tests[i];
		if($j.isArray(t)) drawTests(t, cs, 1+lvl);
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

			preCollapsed().insertCell(-1);
		}
	}
	cs.endCollapser('','').toString();
	preCollapsed('uncollapsing');*/
}

nul.load.unitTest = function() {
	if(!nul.debug.perf) $j('perfTbl').hide();
	//clpsSstm = nul.txt.clpsSstm(tbody = $('tests'),'up');
	drawTests(tests, $j('#tests'));
	if(urlOption('auto')) prgGrpTest(1);
};

function setResult(tn, rslt, comm) {
	var rw = tbody.rows[tn];
	rw.cells[2].innerHTML = rsltDiv(rslt);
	if(comm) for(var j=0; 3>j; ++j) rw.cells[j].rowSpan=2;
	//rw.cells[3].rowSpan=comm?1:2;
	tbody.rows[1+tn].cells[0].innerHTML = comm || '';
	return rslt;
}

function prgTest(tn) {
	setResult(tn,'wrk');
	setTimeout('doTest('+tn+')',50);
}

function isResult(rslt, v) {
	while(rslt.length && v.length) {
		var nxtStr8 = rslt.search(/@\w/gi);
		if(-1== nxtStr8) nxtStr8 = rslt.length;
		if(0<nxtStr8) {
			if(rslt.substr(0,nxtStr8) != v.substr(0,nxtStr8)) return false;
			rslt = rslt.substr(nxtStr8);
			v = v.substr(nxtStr8);
		}
		var ndx = new RegExp(rslt.substr(0,2),'g');
		var val = v.match(/\d*/);
		rslt = rslt.replace(ndx, val);
	}
	return !rslt.length && !v.length;
}

function doTest(tn) {
	var v, test = tbody.rows[tn].test;
	nul.execution.reset('letBM');
	try {
		v = nul.data.query(nul.nulRead(test.xpr)).toFlat();
	} catch(err) {
		nul.exception.notice(err);
		if(nul.erroneusJS) throw nul.erroneusJS;
		return setResult(tn, 'err', err.message || err);
	}
	nul.execution.benchmark.draw($j('#perfTbl'));
	if(isResult(test.rslt, v)) return setResult(tn, 'succ', v);
	return setResult(tn, 'fail', v);
}

function prgGrpCheck(c, lc) {
	for(var l = lc; l<clpsSstm.collapsing[lc]; ++l)
		$j(tbody.rows[l]).find('input[type=checkbox]').each(function() { this.checked = c; });
}

function prgGrpTest(tn) {
	tstsBats = [];
	prgTests(tn-1);
}

function prgTests(tn) {
	var rw, ic;
	while(true) {
		if(0<tstsBats.length && tn== tstsBats[0].endl) {
			var tt = tstsBats.shift();
			tt.rsltDiv.innerHTML = rsltDiv(['unk','succ','fail','err'][tt.rslt]);
			if(0==tstsBats.length) {
				if('repeat'== urlOption('auto')) {
					if(1!= tt.rslt) alert('Unit test failed !');
					else setTimeout('window.location.reload()',50);
				}
				return;
			}
		}
		ic = (rw=tbody.rows[tn]).select('input[type=checkbox]');
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
	setTimeout('doTests('+tn+')',50);
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

