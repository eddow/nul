/*  NUL language JavaScript framework
 *  (c) 2009 E-med Ware
 *
 * NUL is freely distributable under the terms of GNU GPLv3 license.
 *  For details, see the NUL project site : http://code.google.com/p/nul/
 *
 *--------------------------------------------------------------------------*/

/**
 * @name nul
 * @namespace
 */

merge(nul, 
/** @lends nul */
{
	/**
	 * Failure object that is thrown and caught
	 * @constant
	 */
	failure: 'failure',
	/**
	 * List of failures that happened during these trys
	 */
	fails: [],
	/**
	 * Throw a failure
	 * @param reason items to shape a sentence
	 */
	fail: function(reason) {
		nul.debug.fail(beArrg(arguments));
		throw nul.failure;
	},
	/**
	 * Make several try/catch; accept some failures (debug purpose)
	 */
	trys: function(cb, name, obj, args) {
		if(!nul.debug || !nul.debug.logging || !nul.debug.acts) return cb.apply(obj);
		return nul.debug.trys(cb, name, obj, beArrg(arguments, 3));
	},
	/**
	 * Catch only failure.
	 */
	failed: function(err) {
		if(nul.failure!= err) throw nul.exception.notice(err);
	},
	
	/**
	 * Global NUL values
	 * @type nul.expression[String]
	 */
	globals: {},
	
	/**
	 * Creates the root understing-base with the declared {@link nul.globals}
	 * @return {nul.understanding.base.set}
	 */
	globalsUse: function() {
		var ub = new nul.understanding.base.set(null, null, 'g');
		for(var p in nul.globals) 
			ub.createFreedom(p, nul.globals[p]);
		return ub;
	},
	/**
	 * Compile a text and understand it
	 * @param {String} txt
	 * @return {nul.expression}
	 * @throw {nul.semanticException}
	 * @throw {nul.syntaxException} 
	 */
	subRead: function(txt)
	{
		return nul.globalsUse().understand(nul.compile(txt));
	},
	/**
	 * Compile a text and understand it in a fresh execution context
	 * @param {String} txt
	 * @return {nul.expression}
	 * @throw {nul.semanticException}
	 * @throw {nul.syntaxException} 
	 */
	read: function(txt, letBM)
	{
		nul.execution.reset(letBM);
		return nul.execution.benchmark.measure('*reading',function(){
			return nul.subRead(txt);
		});
	}
});
