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

Object.extend(nul, 
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
	 * Understand the compiled text in a knowledge named glbNm, using the uber-local
	 * @param {nul.compiled} cmpl
	 * @param {String} glbNm
	 * @return {nul.xpr.object}
	 */
	understand: function(cmpl, glbNm) {
		var rv = (new nul.understanding.base.set(null, null, glbNm || 'g')).understand(cmpl);
		return (new nul.klg.represent(nul.execution.globalKlg)).browse(rv);
	},
	
	/**
	 * Compile a text and understand it
	 * @param {String} txt
	 * @return {nul.expression}
	 * @throw {nul.semanticException}
	 * @throw {nul.syntaxException} 
	 */
	nulRead: function(txt, glbNm)
	{
		return nul.execution.benchmark.measure('*reading',function(){
			try {
				return nul.understand(nul.compile(txt), glbNm);
			} catch(x) {
				nul.failed(x);
				return nul.obj.empty;
			}
		});
	},

	/**
	 * Compile an XML content and understand it
	 * @param {XML} txt
	 * @return {nul.expression}
	 * @throw {nul.semanticException}
	 * @throw {nul.syntaxException} 
	 */
	xmlRead: function(txt, glbNm)
	{
		return nul.execution.benchmark.measure('*reading',function(){
			return nul.compile.xml(txt).mar(function() {
				try {
					return nul.understand(this, glbNm).listed();
				} catch(x) {
					nul.failed(x);
					return [];
				}
			});
		});
	},

	/**
	 * Modify the global knowledge : the set contains one and only one element
	 * @param {nul.xpr.object} set The set of value to make known
	 * @return {nul.xpr.object} The value asserted
	 */
	known: function(set, name) {
		var gKlg = nul.execution.globalKlg.modifiable();
		var rv = gKlg.newLocal(name);
		try {
			var tattr = {};
			tattr[name] = gKlg.hesitate(set.having(rv));
			gKlg.attributed(nul.execution.evalLocal, tattr);
			gKlg = gKlg.wrap(nul.execution.uberLocal).knowledge;
			rv = gKlg.attribute(nul.execution.evalLocal, name);
		} catch(x) {
			nul.failed(x);
			throw nul.semanticException('KNW', 'The evaluation of '+name+' failed');
		}
		nul.execution.globalKlg = gKlg;
		/*if(nul.debug.assert) assert(!rv.dependance().usages['global'],
				'Knowning is enough to unreference global knowledge');*/
		return rv;
	},
	
	/**
	 * Compile a text and understand it in a fresh execution context
	 * @param {String} txt
	 * @return {nul.expression}
	 * @throw {nul.semanticException}
	 * @throw {nul.syntaxException} 
	 */
	read: function(txt, glbNm)
	{
		try { return nul.known(nul.data.query(nul.nulRead(txt, glbNm)), glbNm); }
		finally { nul.debug.applyTables(); }
	}
});

/**
 * Functions that will be called once the scripts are loaded
 * @name nul.load
 * @namespace
 */
