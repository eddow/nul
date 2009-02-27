/*  NUL language JavaScript framework
 *  (c) 2009 François Marie De Mey
 *
 * NUL is freely distributable under the terms of GNU GPLv3 license.
 *  For details, see the NUL project site : http://code.google.com/p/nul/
 *
 *--------------------------------------------------------------------------*/
 
var nul = {
	globals: {},
	failure: 'nul.failure',
	unlocalisable: 'nul.unlocalisable',
	fail: function(msg)
	{
		nul.debug.log('failLog')('Failure', msg || '');		
		throw nul.failure;
	},
	asJs: function(o, oprtr)
	{
		if('undefined'== typeof o.value)
			throw nul.semanticException("Cannot operate '"+oprtr+"' with: "+o.toHTML());
		return o.value;
	},
	jsVal: function(v) {
		return ('string'== typeof v)?('"'+v+'"'):v;
	},
	asBoolean: function(v)
	{
		if('undefined'== typeof v.value) throw nul.semanticException('Boolean expected: '+v.toHTML());
		return null!== v && false!== v;
	},
	firstUnderstandBase: function() {
		var fb = nul.understanding.emptyBase();
		for(var p in nul.globals) {
			fb.createFreedom(p, null, true);
			nul.globals[p];
		}
		return fb;
	},
	expression: function(txt)
	{
		nul.erroneus = false;
		return nul.understanding.understand(nul.compile(txt), nul.firstUnderstandBase()).numerise();
	},
	globalized: function(xpr) {
		return xpr.contextualize(nul.globals, 1) || xpr;
	},
	html: function(txt)
	{
		nul.erroneus = false;
		var comps = nul.compiler(txt+' </').innerXML();
		for(var i=0; i<comps.length; ++i)
			comps[i] = nul.understanding.understand(comps[i], nul.firstUnderstandBase());
		return comps;
	},
	onload: function() {
		for(p in nul.natives)
			nul.globals[p] = nul.natives[p];
	}
};

if(!nul.debug) {
	Function.prototype.describe = function(dscr) { return this; };
}
new Event.observe(window, 'load', nul.onload);
if(-1< window.location.href.indexOf('noperf'))
	Function.prototype.perform = function(name) { return this; };
else
	Function.prototype.perform = function(name) {
		var ftc = this;
		return function() {
			var cargs = arrg(arguments);
			var obj = this;
			if('function'== typeof name) name = name.apply(obj, cargs);
			nul.execution.benchmark.enter(name);
			try { return ftc.apply(obj, cargs); }
			finally { nul.execution.benchmark.leave(name); }
		};
	};
