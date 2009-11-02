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
	globalsUse: function(glbNm) {
		return new nul.understanding.base.set(null, null, glbNm);
	},
	/**
	 * Compile a text and understand it
	 * @param {String} txt
	 * @return {nul.expression}
	 * @throw {nul.semanticException}
	 * @throw {nul.syntaxException} 
	 */
	subRead: function(txt, glbNm)
	{
		return nul.globalsUse(glbNm).understand(nul.compile(txt));
	},
	/**
	 * Compile a text and understand it in a fresh execution context
	 * @param {String} txt
	 * @return {nul.expression}
	 * @throw {nul.semanticException}
	 * @throw {nul.syntaxException} 
	 */
	read: function(txt)
	{
		return nul.execution.benchmark.measure('*reading',function(){
			try {
				nul.execution.globalKlg = nul.execution.globalKlg.modifiable();
				var rv = nul.subRead(txt, nul.execution.globalKlg);
				if(nul.debug.assert) assert(nul.execution.globalKlg.summarised, 'Reading wrap and wrapping summarise');
				var gKlg = new nul.xpr.knowledge('g');
				return gKlg.merge(nul.execution.globalKlg, rv);
			} catch(err) {
				nul.execution.globalKlg = nul.klg.never;
				nul.failed(err);
				return nul.obj.empty;
			} finally {
				if(nul.klg.never!= nul.execution.globalKlg)
					nul.execution.globalKlg = nul.execution.globalKlg.modifiable().pruned().built();
			}
		});
	}
});

/**
 * Functions that will be called once the scripts are loaded
 * @name nul.load
 * @namespace
 */
