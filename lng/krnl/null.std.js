/*  NUL language JavaScript framework
 *  (c) 2009 E-med Ware
 *
 * NUL is freely distributable under the terms of GNU GPLv3 license.
 *  For details, see the NUL project site : http://code.google.com/p/nul/
 *
 *--------------------------------------------------------------------------*/
 
var nul = {
	failure: 'failure',
	/**
	 * Throw a failure
	 * @param reason items to shape a sentence
	 */
	fail: function(reason) {
		reason = beArrg(arguments)
		//TODO2: log
		throw nul.failure;
	},
	globals: {},
	slf: '&crarr;',
    isJsInt: function(n) {
    	return n== Math.floor(n);
    },
	globalsUse: function(srName) {
		var ub = new nul.understanding.base.set(null, srName, 'g');
		for(var p in nul.globals) 
			ub.createFreedom(p, nul.globals[p]);
		return ub;
	},
	expression: function(txt)
	{
		nul.erroneus = false;
		nul.fuzziness.ndx = 0;
		nul.obj.extension.nbr = 0;
		return nul.globalsUse().understand(nul.compile(txt));
	},
	html: function(txt)
	{
		nul.erroneus = false;
		var comps = nul.compiler(txt+' </').innerXML();
		var gu = nul.globalsUse();
		for(var i=0; i<comps.length; ++i) {
			var ub = new nul.understanding.base.set(gu);
			comps[i] = ub.valued(comps[i]);
		}
		gu.valued();
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
