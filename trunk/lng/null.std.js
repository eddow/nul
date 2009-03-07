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
	globalsUse: function() {
		var ub = nul.understanding.emptyBase();
		var tt = [];
		for(var p in nul.globals) tt[ub.createFreedom(p).ndx] = nul.globals[p];
		return {ub: ub, tt:tt};
	},
	firstContextualise: function(xpr) {
		var tt = [];
	},
	expression: function(txt)
	{
		nul.erroneus = false;
		var gu = nul.globalsUse();
		return gu.ub.asSet(nul.compile(txt).understand(gu.ub)).absolutise().contextualise(gu.tt);
	},
	html: function(txt)
	{
		nul.erroneus = false;
		var comps = nul.compiler(txt+' </').innerXML();
		var ub = nul.firstUnderstandBase();
		var ubl = ub.length;
		for(var i=0; i<comps.length; ++i) {
			comps[i] = ub.asSet(comps[i].understand(ub));
			ub.splice(ubl);
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
