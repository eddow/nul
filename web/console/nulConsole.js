/*  NUL language JavaScript framework
 *  (c) 2009 E-med Ware
 *
 * NUL is freely distributable under the terms of GNU GPLv3 license.
 *  For details, see the NUL project site : http://code.google.com/p/nul/
 *
 *--------------------------------------------------------------------------*/

csl = {
	keyHandler: function(e) {
		if(e.charCode || e.altKey || e.ctrlKey || e.metaKey || e.shiftKey || !csl.keyCmd(e.keyCode)) return true;
		if(e.stop) e.stop(); else e.stopPropagation();
		return false;
	},
	cmReady: function() {
		csl.editor.grabKeys(csl.keyHandler, function(kc) { return 111<kc && 123>=kc; } );
		for(var i in window) csl.knGlobs[i] = true;
		//setTimeout('csl.editValue();', 50);
		csl.editValue();
		csl.editChanged();
	},

	panelInit: {
		_nul_postsVw: function() {
			$('#_nul_postsVw').layout({
				east : {
					resizable: true,
					slidable: true,
					closable: true,
					resizeWhileDragging: true,
					size: 150,
					initClosed: true,
					SliderTip: 'Benchmarks',
					slideTrigger_open: 'mouseover',
					hideTogglerOnSlide: true,
					minSize: 100,
					spacing_closed: 3,
					togglerLength_closed: 0,
					togglerLength_opened: 0,
					resizeWhileDragging: true,
					fxName: 'slide'
				}
			});
		},
		_nul_valuesVw: function() {
			//TODO 1: see why editor doesn't load on refresh
			csl.editor = new CodeMirror($('#_nul_valuesVw')[0], {
				parserfile: ["parsenul.js"],
				path: "../../3rd/codemirror/",
				stylesheet: "../../3rd/codemirror/nulcolors.css",
				tabMode: 'shift',
				lineNumbers: true,
				height: '100%',
				width: '100%',
				initCallback: csl.cmReady,
				onChange: csl.editChanged
			});
		}
	},
	
	init: function() {
		if('undefined' == typeof nul || nul.loading) return;
		csl.init = function() {};
		if(!window.console) $('#loggingOption').hide();

		switch(csl.mode) {
		case 'stand-alone': $('a.command[name^="con_"]').hide(); break;
		case 'inside': $('a.command[name="con_link"]').hide(); break;
		case 'outside': $('a.command[name="con_free"]').hide(); break;
		}
		$.fn.fitV = function() {
			var fitter = this;
			$(window).resize(function () {
				fitter.each(function() {
					if($(this).is(':visible')) $(this).height($(this).offsetParent().innerHeight()-$(this).position().top);
				});
			});		
		};
		
		$('body').tabs().bind('tabsshow', function(e, ui) { 
			if(csl.panelInit[ui.panel.id]) {
				csl.panelInit[ui.panel.id]();
				delete csl.panelInit[ui.panel.id];
			}
			$('#conToolBar').attr('class', 'toolFor'+ui.panel.id);
		});
		setTimeout("$('body').tabs('select', 1);",50);
		$('#_nul_console_pages').fitV();
		$(window).resize();
		
		nul.debug.globalKlg = $('#_nul_globalKlgVw');
		nul.debug.newLog($('#logsTBD'));
		nul.debug.applyTables();
		var logSlct = $('#dbgLogSelect');
		for(var i=0; i<nul.debug.possibleLogging.length; ++i)
			logSlct.append('<li class="checkable"><a class="checker">'+nul.debug.possibleLogging[i]+'</a></li>');
	
		$('#conToolBar .checker').click(function() { $(this).parent('.checkable').toggleClass('checked'); });
		$(window).keypress(csl.keyHandler);
		$('a.command').click(function() {
			csl.command($(this).attr('name'));
		});
		csl.disable('reset');
	},
	keyCmd: function(keyCode) {
		var kn = keyCode-111;
		if(1>kn || 12< kn) return false;
		var cmd = $('.command[title^="F'+kn+':"]');
		if(!cmd.length) return false;
		csl.command(cmd.attr('name'));
		return true;
		
	},
	command: function(cmd) { if(!csl.commands[cmd].disabled) csl.commands[cmd](); },
	enable: function(cmd, v) {
		if('undefined'!= typeof v && !v) return csl.disable(cmd);
		if(csl.commands[cmd].disabled) {
			csl.commands[cmd].disabled = false;
			$('#conToolBar .command[name="'+cmd+'"]').parent().removeClass('ui-state-default');
		}
	},
	disable: function(cmd) {
		if(!csl.commands[cmd].disabled) {
			csl.commands[cmd].disabled = true;
			$('#conToolBar .command[name="'+cmd+'"]').parent().addClass('ui-state-default');
		}
	},
	editChanged: function() {
		var hs = csl.editor.historySize();
		csl.enable('edit_undo', hs.undo);
		csl.enable('edit_redo', hs.redo);
	},
	commands: {
		edit: function() { csl.editValue(); },
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

		clearPosts: function() {
			alert('clearPosts');
		},
		
		con_close: function() {
			switch(csl.mode) {
			case 'inside': nul.console.close(); break;
			case 'outside': window.close(); break;
			}
		},
		con_free: function() {
			nul.console.extern(window.open(location.href, 'nul.console', 'channelmode=no, directories=no, menubar=no, toolbar=no'));
		},
		con_link: function() {
			window.close();	//TODO
		}
	},
	showValue: function(val) {
		if($(csl.editor.wrapping).is(':visible')) {
			if(val) $('#valuesViewer')[0].innerHTML = val;
			$(csl.editor.wrapping).hide();
			$('#conToolBar').removeClass('toolForEdit');
			$('#valuesViewer').show();
			csl.enable('edit');
			csl.disable('eval');
		}
	},
	editValue: function() {
		if($('#valuesViewer').is(':visible')) {
			$('#valuesViewer').hide();
			$('#conToolBar').addClass('toolForEdit');
			$(csl.editor.wrapping).show();
			csl.disable('edit');
			csl.disable('query');
			csl.disable('known');
			csl.enable('eval');
			csl.evaled = null;
			csl.editor.focus();
		}
	},

	
	test: function(cb)
	{
		if(nul.debug) {
			if(window.console && $('#dbgLogSelect').parent().hasClass('checked')) {
				nul.debug.logging = {error: true, fail: true};
				var chkd = $('#dbgLogSelect li.checked a');
				for(var c=0; c<chkd.length; ++c)
					nul.debug.logging[chkd[c].textContent] = true;
			} else nul.debug.logging = false;
			
			if($('#dbgBreakLimited').hasClass('checked')) {
				var bl = $('#dbgBreakLimit').val();
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
		
		try {
			csl.disable('query');
			csl.showValue(cb());
			csl.enable('query');
		} catch( err ) {
			csl.showValue(nul.ex.be(err).message);
			//Forward JS errors to Firebug
		} finally {
			nul.debug.applyTables();
			nul.execution.benchmark.draw($('#_nul_benchmarkVw'));
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
	},
	
	
	onreadystatechange: function(f) {
		return function() {
			if(this.readyState == 'loaded' || this.readyState == 'complete') {
				this.onreadystatechange = function(){};
				f();
			}
		};
	},
	addRef: function(tag, props) {
		var elm = document.createElement(tag);
		if(props.onload) elm['onreadystatechange'] = csl.onreadystatechange(props.onload);
		for(l in props) if('string'!= typeof props[l]) elm[l] = props[l];
		else elm.setAttribute(l,props[l]);
		document.getElementsByTagName('head')[0].appendChild(elm);
	}

};

if('undefined' != typeof nul) {
	nul.console.child = csl;
	csl.addRef('link', { type: 'text/css', href: '../../lng/txt/out/null.txt.html.css', rel:'stylesheet' });
	csl.addRef('link', { type: 'text/css', href: '../../3rd/jquery/theme/ui.css',  rel:'stylesheet' });
	csl.addRef('script', { type: 'text/javascript', src: '../../3rd/jquery/jquery.js' });
	csl.addRef('script', { type: 'text/javascript', src: '../../3rd/jquery/ui.all.js' });
	csl.addRef('script', { type: 'text/javascript', src: '../../3rd/jquery/ui.layout.js' });
	csl.addRef('script', { type: 'text/javascript', src: '../../3rd/jquery/emw.js' });
	csl.mode = nul.console.frame[0].contentWindow===window?'inside':'outside';
} else {
	csl.addRef('script', { type: 'text/javascript', src: '../../null.js', noconsole:'please', onload: function() { 
		nul.load.csl = csl.init;
		nul.load.csl.use = {executionReady: true};
	} });
	csl.mode = 'stand-alone';
};
