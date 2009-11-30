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

nul.unitTest = function(nm, arr) {
	arr.name = nm;
	return arr;
};

nul.unitTest.tests = nul.unitTest('Unit testing', [
	nul.unitTest('Simples', [
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
	]),
	nul.unitTest('Data', [
  	 	{xpr: '.document["#sandBox b"](.text _)',
  	 	rslt: '{"yh"}'},
  	 	{xpr: '.xml["xml/test.xml"].ab',
  	 	rslt: '{"bidon"}'},
  	 	{xpr: '.time["Jul 8, 2005"].year',
  		rslt: '{2005}'},
  	 	{xpr: '.time.now.year',
  		rslt: '{'+(new Date().getFullYear())+'}'}
  	]),
	nul.unitTest('Complexs', [
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
	]),
	nul.unitTest('Attributes', [
		{xpr: '( u::n 1 ::f "u" ::e "o", d::n 2 ::f "d" ::e "t" ) (x ::f "u")',
		rslt: '{u[g|@0]; (([e: "o", f: "u", n: 1]u[g|@0]))}'},
		{xpr: 'a; .Q (a.nbr)',
		rslt: '{a[g|@0]; (([nbr: &rarr;nbr[g|@1]]a[g|@0]) &and; (&rarr;nbr[g|@1]) &isin; &#x211a;)}'},
		{xpr: '(cmplx c).pair ; c.real = 5 ; c.img = 3 ; cmplx = {_ ::real(Q r) ::img(Q i) ::pair(i,r)}',
		rslt: '{(3, 5)}'}
	]),
	nul.unitTest('Nodes', [
	    //TODO 1: use "node.text <= xpr" and not "node.html <= xpr", so that "<n>" draws "<n>"  
	 	{xpr: '<n><a q="1" w="2" /><a q="3" e="4" /></n> [<a q="5" w="6" e="7" r="8" />]',
	 	rslt: '{&crarr;[g|@1]; (([q: "1", w: "2", # : 0, e: "7", r: "8"]&crarr;[g|@1])) &#9633; &crarr;[g|@1]; (([q: "3", e: "4", # : 0, w: "6", r: "8"]&crarr;[g|@1]))}'}
	])	
]);


nul.unitTest.fcts = {
	createRow: function(tst, tp, name, pn, tn, rslt) {
		var rv = $('<tr></tr>');
		if(!rslt) rv.attr('id', "node-"+tn);
		rv.append($('<'+tp+'></'+tp+'>').text(name));
		if('undefined'!= typeof pn) rv.addClass('child-of-node-'+pn);
		rv.append('<td class="state"><input type="button" value="" onclick="nul.unitTest.launchTest('+tn+')" /></td>');
	
		if(rslt) rv.append($('<td class="comm"></td>').text(rslt));
		else rv.append('<td />');
	
		rv[0].test = tst;
		rv[0].state = 'tdo';
		rv[0].nbrChld2do = tst.length;
		rv[0].cumRslt = 'succ';
	
		return rv;
	},

	drawTests: function(tests, tbody, ppn) {
		var pn = tbody.children().length;
		tbody.append(nul.unitTest.createRow(tests, 'th', tests.name, ppn, pn));
		for(var i=0;i<tests.length;i++)
		{
			var t = tests[i];
			if($.isArray(t)) nul.unitTest.drawTests(t, tbody, pn);
			else {
				++nul.unitTest.nbrTests;
				tbody.append(nul.unitTest.createRow(t, 'td', t.xpr, pn, tbody.children().length, t.rslt));
			}
		}
		
	},
	
	row: function(tn) {
		return $('#tests tbody').children()[tn];
	},
	
	relRsltCnt: function(rslt, dlt) {
		var spn = $('#progress .rslt-'+rslt);
		spn[0].nbr += dlt;
		spn.attr('style', 'width: '+(100*spn[0].nbr/nul.unitTest.nbrTests)+'%;');
		/*var rw = spn.width()/$('#progress').width();
		rw += dlt / nul.unitTest.nbrTests;
		spn.attr('style', 'width: '+Math.floor(rw*100)+'%;');*/
	},
	
	erroneusest: function(r1, r2) {
		var r = r1+'.'+r2;
		return (/err/.test(r)) ? 'err' :
			(/fail/.test(r)) ? 'fail' :
				'succ';
	},
	
	propRslt: function(parent_row, rslt) {
		parent_row.cumRslt = nul.unitTest.erroneusest(parent_row.cumRslt, rslt);
		
		parent_row.nbrChld2do--;
		if(parent_row.nbrChld2do == 0) nul.unitTest.setResult(parent_row, parent_row.cumRslt);
	},
	
	setState: function(rw, state) {
		if(!$.isArray(rw.test)) {
			nul.unitTest.relRsltCnt(rw.state, -1);
			nul.unitTest.relRsltCnt(state, +1);
		}
		rw.state = state;
		var inm = { unk: 'help', succ: 'check', fail: 'closethick', err: 'alert', wrk: 'gear' };
		//$(rw).find('td.state').html('<span class="ui-icon ui-icon-'+inm[state]+' rslt-'+state+'"/>');
		$($(rw).children()[1]).html('<span class="ui-icon ui-icon-'+inm[state]+' rslt-'+state+'"/>');
		return state;
	},
	
	setResult: function(rw, rslt, comm) {
		var splits;
		splits = $(rw).attr("class").split("child-of-");
		if (splits[1]) nul.unitTest.propRslt($("#"+splits[1].split(' ')[0])[0], rslt);
		if(comm) {
			var cc = $(rw).find('td.comm');
			if('succ'==rslt) cc.html(comm);
			else cc.html(cc.html() + '<br />' + comm);
		}
		nul.unitTest.setState(rw, rslt);
	},
	
	prgTest: function(tn) {
		nul.unitTest.setState(nul.unitTest.row(tn),'wrk');
		setTimeout('nul.unitTest.doTest('+tn+')',50);
	},
	
	isResult: function(rslt, v) {
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
	},
	
	doTest: function(tn) {
		var v, rw = nul.unitTest.row(tn);
		var splits = $(rw).attr("class").split("child-of-");
		if(!$.isArray(rw.test)) {
			nul.execution.reset();
			try {
				v = nul.data.query(nul.nulRead(rw.test.xpr)).toFlat();
			} catch(err) {
				nul.unitTest.setResult(rw, 'err', nul.ex.be(err).present());
				v = null;
			}
			if(v) nul.unitTest.setResult(rw, nul.unitTest.isResult(rw.test.rslt, v)?'succ':'fail', v);
		}
		var nxt = nul.unitTest.row(++tn);
		while (nxt) {
			if('unk' == nxt.state) { 
				nul.unitTest.prgTest(tn);
				break;
			}
			else nxt = nul.unitTest.row(++tn);
		}
		if('repeat'== nul.unitTest.auto) {
			if('succ'!= nul.unitTest.row(0).state) alert('Unit test failed !');
			else setTimeout('window.location.reload()',50);
		}
		else nul.unitTest.launchable = true;
	},

	planTests: function(rw) {
		if('tdo' == rw.state) {
			nul.unitTest.setState(rw, 'unk');
			if($.isArray(rw.test)) $('#tests tr.child-of-'+$(rw).attr('id')).each( function() { nul.unitTest.planTests(this); } );
		}
	},
	
	launchTest: function(tn) {
		if(!nul.unitTest.launchable) return false;
		nul.unitTest.launchable = false;
		nul.unitTest.planTests(nul.unitTest.row(tn));
		nul.unitTest.prgTest(tn);
	},

	load: function() {
		nul.unitTest.nbrTests = 0;
		nul.unitTest.drawTests(nul.unitTest.tests, $('#tests tbody'));
		
		$("#tests").treeTable({ indent: 16, initialState: 'collapsed' });
		
		$(nul.unitTest.row(0)).expand();

		$('#progress div').each(function() {
			var spn = $(this);
			if(spn.is('.rslt-tdo')) {
				spn.attr('style', 'width: 100%;');
				spn[0].nbr = nul.unitTest.nbrTests;
			} else {
				spn.attr('style', 'width: 0%;');
				spn[0].nbr = 0;
			}
		});
		
		nul.unitTest.launchable = true;
		if(nul.unitTest.auto) setTimeout('nul.unitTest.launchTest(0);',50);
	}
	
};

nul.unitTest.auto = $.url('auto');
nul.load.unitTest = function() {
	$.extend(nul.unitTest, nul.unitTest.fcts);
	nul.unitTest.load();
};

