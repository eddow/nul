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
		nul.debug.log('fail')('Failure', beArrg(arguments));
		throw nul.failure;
	},
	/**
	 * Catch only failure.
	 */
	failed: function(err) {
		if(nul.failure!= err) throw nul.exception.notice(err);
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
	read: function(txt)
	{
		nul.execution.reset();
		return nul.execution.benchmark.measure('*reading',function(){
			return nul.globalsUse().understand(nul.compile(txt));
		});
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
	},

	/**
	 * Weither the string opt appear in the url parameters
	 */
	urlOption: function(opt) {
		var srch = window.location.href.split('?')[1];
		if(!srch) return;
		return 0<=('&'+srch+'&').indexOf('&'+opt+'&');
	},
};

new Event.observe(window, 'load', nul.onload);

