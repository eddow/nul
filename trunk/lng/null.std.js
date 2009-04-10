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
	fail: function(msg)
	{
		nul.debug.log('fail')('Failure', msg || '');		
		throw nul.failure;
	},
	asJs: function(o, oprtr)
	{
		if('atom'!= o.charact)
			throw nul.semanticException('deprecated', "Cannot operate '"+oprtr+"' with: "+o.toHTML());
		return o.value;
	},
	jsVal: function(v) {
		return ('string'== typeof v)?('"'+v+'"'):v;
	},


	globalsUse: function() {
		nul.understanding.ctxNames = 0;
		nul.understanding.srCtxNames = 0;
		var ub = nul.understanding.emptyBase();
		var tt = [];
		for(var p in nul.globals) tt[ub.createFreedom(p).ndx] = nul.globals[p];
		return {ub: nul.understanding.emptyBase(ub), rub: ub, tt:tt};
	},
	expression: function(txt)
	{
		nul.erroneus = false;
		var gu = nul.globalsUse();
		return gu.ub.asSet(nul.compile(txt).understand(gu.ub)).contextualise(gu.tt,'glbls');
	},
	html: function(txt)
	{
		nul.erroneus = false;
		var comps = nul.compiler(txt+' </').innerXML();
		var gu = nul.globalsUse();
		for(var i=0; i<comps.length; ++i) {
			gu.ub = nul.understanding.emptyBase(gu.rub);
			comps[i] = comps[i].understand(gu.ub).contextualise(gu.tt,'glbls');
		}
		return comps;
	},
	onload: function() {
		for(p in nul.natives)
			nul.globals[p] = nul.natives[p];
	}
};

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
