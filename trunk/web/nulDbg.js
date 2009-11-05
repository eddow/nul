/*  NUL language JavaScript framework
 *  (c) 2009 E-med Ware
 *
 * NUL is freely distributable under the terms of GNU GPLv3 license.
 *  For details, see the NUL project site : http://code.google.com/p/nul/
 *
 *--------------------------------------------------------------------------*/

nul.load.debuger = function() {
	selectNamedTab($('info'),$('infoTS').value);
	nul.debug.logs.table = $('logs');
	nul.debug.globalKlg = $('globalKlg');
	shwDbgOptClk();

	nul.debuger.init();
};

nul.load.debuger.use = {operators:true};

nul.debuger = {
	getSrcText: function() { return nul.debuger.DOM.src.value; },
	cmDone: function() {
		nul.debuger.getSrcText = function() { return nul.debuger.DOM.editor.getCode(); };
		for(var i in window) knGlobs[i] = true;
	},
	init: function() {
		nul.debuger.DOM.src = $('source');
		nul.debuger.DOM.evd = $('evaled');
		nul.debuger.DOM.wtc = $('watch');
		nul.debuger.DOM.qrd = $('queried');

		nul.debuger.shortcuts = {
			116: nul.debuger.reset,	//F5
			117: nul.debuger.query,	//F6
			119: nul.debuger.eval		//F8
		};
		nul.debuger.DOM.src.observe('keydown', function(e) {
			if(!e.charCode && !e.altKey && !e.ctrlKey && !e.metaKey && !e.shiftKey && nul.debuger.shortcuts[e.keyCode]) { 
				nul.debuger.shortcuts[e.keyCode]();
				e.stop();
			}
		});

		nul.debuger.DOM.editor = CodeMirror.fromTextArea(nul.debuger.DOM.src, {
			  parserfile: ["parsenul.js"],
			  path: "../3rd/codemirror/",
			  stylesheet: "../3rd/codemirror/nulcolors.css",
			  tabMode: 'shift',
			  lineNumbers: true,
			  initCallback: nul.debuger.cmDone
			});
	},
	reset: function() {
		nul.execution.reset();
		nul.debuger.DOM.evd.innerHTML = '';
		nul.debuger.DOM.qrd.innerHTML = '';
	},

	DOM: {},
	eval: function() { nul.debuger.test(nul.debuger.tread, nul.debuger.DOM.evd, 'Evaluating...'); },
	query: function() { nul.debuger.test(nul.debuger.tquery, nul.debuger.DOM.qrd, 'Querying...'); },
	
	tquery: function() { return nul.data.query($('queryCmd').query).toHtml(); },
	tread: function() { 
		var v = nul.read(nul.debuger.getSrcText());
		$('queryCmd').query = v;
		return v.toHtml();
		var cpt = 0;
		while('pair'== v.expression) {
			++cpt;
			v = v.second;
		}
		return cpt;
	},
	
	test: function(cb, dst, prgrsMsg)
	{
		if(nul.debug) {	//Set the debug options as it is checked
			if($('shwLogging').checked) {
				nul.debug.logging = {error: true, fail: true};
				var opts = $('loggingChk').options;
				for(var o=0; opts[o]; ++o)
					nul.debug.logging[opts[o].value] = opts[o].selected;
			} else nul.debug.logging = false;
			nul.debug.begin($('dbgBreak').checked?parseInt($('dbgBreakLimit').value):0);
		}
		
		window.setTimeout('nul.debug.applyTables();', 100);
		
		try {
			nul.debuger.DOM.wtc.innerHTML = '';
			dst.innerHTML = prgrsMsg;
			$('queryCmd').writeAttribute('disabled','true');
			dst.innerHTML = cb();
			$('queryCmd').writeAttribute('disabled', null);
		} catch( err ) {
			nul.exception.notice(err);
			dst.innerHTML = err.message;
			if(nul.erroneusJS) throw nul.erroneusJS;
			//Forward JS errors to Firebug
		} finally {
			nul.debug.applyTables();
			nul.execution.benchmark.draw($('benchmark'));
			assertSmGlobals();
		}
	},
	ea_syntax: function() {
		return {
			'COMMENT_SINGLE' : {1 : '//'},
			'COMMENT_MULTI' : {'/*' : '*/'},
			'QUOTEMARKS' : {1: '"'},
			'KEYWORD_CASE_SENSITIVE' : true,
			'KEYWORDS' : {},
			'OPERATORS' : nul.tokenizer.operators.without('::', '.'),
			'DELIMITERS' :[
				'(', ')', '[', ']', '{', '}'
			],
			'REGEXPS' : {
				/*'ior3' : {
					'search' : '()(\\[\\])()'
					,'class' : 'ior3'
					,'modifiers' : 'g'
					,'execute' : 'before'
				},*/
				'phi' : {
					'search' : '()(\\{\\})()'
					,'class' : 'phi'
					,'modifiers' : 'g'
					,'execute' : 'before'
				},
				'attribute' : {
					'search' : '(::|\\.)([_\\w@]+)()'
					,'class' : 'attribute'
					,'modifiers' : 'g'
					,'execute' : 'after'
				},
				'attributer' : {
					'search' : '()(::|\\.)()'
					,'class' : 'attributer'
					,'modifiers' : 'g'
					,'execute' : 'after'
				}
			},
			'STYLES' : {
				'COMMENTS': 'color: #AAAAAA;'
				,'QUOTESMARKS': 'color: #6381F8;'
				,'KEYWORDS' : {}
				,'OPERATORS' : 'color: #c00020;'
				,'DELIMITERS' : 'color: #e038E1;'
				,'REGEXPS' : {
					//'ior3' : 'color: #c00020;'
					'attribute' : 'color: #009900;',
					'attributer' : 'color: #d08000;',
					'phi' : 'color: #ff1080;'
				}
			}
		};
	},
	watch: function(v)
	{
		nul.debuger.DOM.wtc.innerHTML = v.toHtml();
	}
};

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

function shwDbgOptClk() {
	if($('shwLogging').checked) $('shwLoggingFS').removeClassName('collapsed');
	else $('shwLoggingFS').addClassName('collapsed');
	if($('dbgBreak').checked) $('dbgBreakFS').removeClassName('collapsed');
	else $('dbgBreakFS').addClassName('collapsed');
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

function nw(v) { nul.debuger.watch(v); return 'drawn'; }
