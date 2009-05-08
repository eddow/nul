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
	fzmap: function(itm, fct) {	//TODO: new function, use me instead of local hacks
		var rv = [];
		for(var i=0; i< itm.length; ++i)
			try { rv.push(fct.apply(itm[i],[i, itm[i]])); }
			catch(err) { if(nul.failure!= err) throw nul.exception.notice(err); }
		return rv;
	},
	/**
	 * Is <xpr> suitable to replace another expression
	 */
	canSimpl: function(xpr) {
		return isEmpty(xpr.fuzze);
	},
	jsVal: function(v) {
		return ('string'== typeof v)?('"'+v+'"'):v;
	},
	isJsInt: function(n) {
		return n== Math.floor(n);
	},
	unSubj: function(dsc, ops) {
		if(isArray(ops)) ops = clone1(ops);
		else ops = [ops];
		ops.desc = dsc;
		return ops;
	},
	inside: function(xpr) {
		if('{}'== xpr.charact) return {
			ctx: xpr.ctxDef,
			cs: xpr.components
		};
		var klg = new nul.knowledge();
		klg.addLocals('?');
		var jkr = new nul.xpr.local(klg.ctxName, 0, '?');
		return {
			ctx: klg.ctxName,
			cs: [klg.leave(jkr.inSet(xpr))]
		};
	},
	globalsUse: function(srName) {
		var ub = new nul.understanding.base.set(null, srName, nul.xpr.fuzzy.createCtxName('g'));
		for(var p in nul.globals) 
			ub.createFreedom(p, nul.globals[p]);
		return ub;
	},
	expression: function(txt)
	{
		nul.erroneus = false;
		nul.xpr.fuzzy.ctxNameCpt = 0;
		nul.understanding.srCtxNames = 0;
		return nul.globalsUse().valued(nul.compile(txt));
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
