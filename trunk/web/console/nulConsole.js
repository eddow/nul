/*  NUL language JavaScript framework
 *  (c) 2009 E-med Ware
 *
 * NUL is freely distributable under the terms of GNU GPLv3 license.
 *  For details, see the NUL project site : http://code.google.com/p/nul/
 *
 *--------------------------------------------------------------------------*/

$j.fn.fitV = function() {
	var fitter = this;
	$j(window).resize(function () {
		fitter.each(function() {
			if($j(this).is(':visible')) $j(this).height($j(this).offsetParent().innerHeight()-$j(this).position().top);
		});
	});		
};

csl = {
	keyHandler: function(e) {
		if(e.charCode || e.altKey || e.ctrlKey || e.metaKey || e.shiftKey || !csl.keyCmd(e.keyCode)) return true;
		if(e.stop) e.stop(); else e.stopPropagation();
		return false;
	},
	cmReady: function() {
		csl.editor.grabKeys(csl.keyHandler, function(kc) { return 111<kc && 123>=kc; } );
		for(var i in window) csl.knGlobs[i] = true;
		csl.editValue();
		csl.editChanged();
	},

	init: function() {
		$j('body').tabs().bind('tabsshow', function(e, ui) { $j('#conToolBar').attr('class', 'toolFor'+ui.panel.id); }).tabs('select', 1);
		$j('#_nul_console_pages').fitV();
		
		$j(window).resize();
		
		//TODO 1: see why editor doesn't load on refresh
		csl.editor = new CodeMirror($j('#_nul_valuesVw')[0], {
			parserfile: ["parsenul.js"],
			path: "../../3rd/codemirror/",
			stylesheet: "../../3rd/codemirror/nulcolors.css",
			tabMode: 'shift',
			lineNumbers: true,
			height: '100%',
			initCallback: csl.cmReady,
			onChange: csl.editChanged
		});
		
		nul.debug.globalKlg = $j('#_nul_globalKlgVw')[0];
		nul.debug.newLog($j('#logsTBD'));
		nul.debug.applyTables();
		var logSlct = $j('#dbgLogSelect');
		for(var i=0; i<nul.debug.possibleLogging.length; ++i)
			logSlct.append('<li class="checkable"><a class="checker">'+nul.debug.possibleLogging[i]+'</a></li>');
	
		$j('#conToolBar .checker').click(function() { $j(this).parent('.checkable').toggleClass('checked'); });
		$j(window).keypress(csl.keyHandler);
		$j('#conToolBar .command').click(function() {
			csl.command($j(this).attr('name'));
		});
		csl.disable('reset');
	},
	keyCmd: function(keyCode) {
		var kn = keyCode-111;
		if(1>kn || 12< kn) return false;
		var cmd = $j('.command[title^="F'+kn+':"]');
		if(!cmd.length) return false;
		csl.command(cmd.attr('name'));
		return true;
		
	},
	command: function(cmd) { if(!csl.commands[cmd].disabled) csl.commands[cmd](); },
	enable: function(cmd, v) {
		if('undefined'!= typeof v && !v) return csl.disable(cmd);
		if(csl.commands[cmd].disabled) {
			csl.commands[cmd].disabled = false;
			$j('#conToolBar .command[name="'+cmd+'"]').parent().removeClass('ui-state-default');
		}
	},
	disable: function(cmd) {
		if(!csl.commands[cmd].disabled) {
			csl.commands[cmd].disabled = true;
			$j('#conToolBar .command[name="'+cmd+'"]').parent().addClass('ui-state-default');
		}
	},
	editChanged: function() {
		var hs = csl.editor.historySize();
		csl.enable('edit_undo', hs.undo);
		csl.enable('edit_redo', hs.redo);
	},
	commands: {
		'edit': function() { csl.editValue(); },
		eval: function() {
			csl.test(function() {
				csl.evaled = nul.nulRead(csl.editor.getCode());
				csl.enable('known');
				return csl.evaled.toHtml();
			});
		},
		query: function() {
			alert('query');
		},
		known: function() {
			alert('known');
		},
		reset: function() {
			alert('reset');
		},
		
		edit_undo: function() { csl.editor.undo(); },
		edit_redo: function() { csl.editor.redo(); },

		clearLogs: function() {
			alert('clearLogs');
		},
		clearBenchmarks: function() {
			alert('clearBenchmarks');
		}
	},
	showValue: function(val) {
		if($j(csl.editor.wrapping).is(':visible')) {
			if(val) $j('#valuesViewer')[0].innerHTML = val;
			$j(csl.editor.wrapping).hide();
			$j('#conToolBar').removeClass('toolForEdit');
			$j('#valuesViewer').show();
			csl.enable('edit');
			csl.disable('eval');
		}
	},
	editValue: function() {
		if($j('#valuesViewer').is(':visible')) {
			$j('#valuesViewer').hide();
			$j('#conToolBar').addClass('toolForEdit');
			$j(csl.editor.wrapping).show();
			csl.disable('edit');
			csl.disable('query');
			csl.disable('known');
			csl.enable('eval');
			csl.evaled = null;
		}
	},

	
	test: function(cb)
	{
		if(nul.debug) {
			if($j('#dbgLogSelect').parent().hasClass('checked')) {
				nul.debug.logging = {error: true, fail: true};
				var chkd = $j('#dbgLogSelect li.checked a');
				for(var c=0; c<chkd.length; ++c)
					nul.debug.logging[chkd[c].textContent] = true;
			} else nul.debug.logging = false;
			
			if($j('#dbgBreakLimited').hasClass('checked')) {
				var bl = $j('#dbgBreakLimit').val();
				try {
					var nbl = parseInt(bl);
					if(isNaN(nbl)) throw '!';
					nul.debug.begin(nbl);
				} catch(err) {
					alert('Bad break limit : ' + bl);
					return false;
				}					
			} else nul.debug.begin(0);
			
		}
		
		window.setTimeout('nul.debug.applyTables();', 100);
		
		try {
			csl.disable('query');
			csl.showValue(cb());
			csl.enable('query');
		} catch( err ) {
			nul.exception.notice(err);
			csl.showValue(err.message);
			if(nul.erroneusJS) throw nul.erroneusJS;
			//Forward JS errors to Firebug
		} finally {
			nul.debug.applyTables();
			nul.execution.benchmark.draw($j('#benchmarks')[0]);
			csl.assertSmGlobals();
		}
	},
	
	knGlobs: {},
	ignGlobs: {'getInterface':'firebug'},
	assertSmGlobals: function() {
		var nwGlb = [];
		for(var i in window)
			if(!csl.knGlobs[i] && !csl.ignGlobs[i] && '_fire'!= i.substr(0,5).toLowerCase()) {
				nwGlb.push(i);
				csl.ignGlobs[i] = true;
			}
		if(0<nwGlb.length) alert('Unexpected global(s) created : ' + nwGlb.join(', ')); 
	}

};

nul.console.child = csl;
