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
	asBoolean: function(v)
	{
		if('undefined'== typeof v.value) throw nul.semanticException('Boolean expected: '+v.toHTML());
		return null!== v && false!== v;
	},
	firstUnderstandBase: function() {
		var fb = nul.understanding.emptyBase();
		for(var p in nul.globals) {
			fb.createFreedom(p, null, true);
			nul.globals[p].ctxd();
		}
		return fb;
	},
	expression: function(txt)
	{
		nul.erroneus = false;
		return nul.understanding.understand(nul.compile(txt), nul.firstUnderstandBase())
			.ctxd().numerise();
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
		//TODO: charger des items avec nulname ?
		for(p in nul.natives)
			nul.globals[p] = nul.natives[p];
	}
};

if(!nul.debug) {
	Function.prototype.describe = function(dscr) { return this; };
}
new Event.observe(window, 'load', nul.onload);