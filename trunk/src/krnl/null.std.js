/*  NUL language JavaScript framework
 *  (c) 2009 E-med Ware
 *
 * NUL is freely distributable under the terms of GNU GPLv3 license.
 *  For details, see the NUL project site : http://code.google.com/p/nul/
 *
 *--------------------------------------------------------------------------*/
/*# uses:
 * src/lng/xpr/null.expression, src/krnl/null.exception
 */

/**
 * @name nul
 * @namespace
 */
nul.extend( /** @lends nul */{
	/**
	 * List of failures that happened during these trys
	 */
	fails: [],
	/**
	 * Throw a failure
	 * @param reason items to shape a sentence
	 */
	fail: function(reason) {
		if(nul.debugged) nul.debugged.fail(beArrg(arguments));
		throw nul.ex.failure;
	},
	/**
	 * Make several try/catch; accept some failures (debug purpose)
	 */
	trys: function(cb, name, obj, args) {
		/*if(!nul.debugged || !nul.debugged.logging || !nul.debugged.acts)*/ return cb.apply(obj);
		//return nul.debugged.trys(cb, name, obj, beArrg(arguments, 3));
	},
	/**
	 * Catch only failure.
	 */
	failed: function(err) {
		if(nul.ex.failure!== err) throw nul.ex.be(err);
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
	 * @throw {nul.ex.semantic}
	 * @throw {nul.ex.syntax} 
	 */
	nulRead: function(txt, glbNm)
	{
		try {
			return nul.understand(nul.compile(txt), glbNm);
		} catch(x) {
			nul.failed(x);
			return nul.obj.empty;
		}
	},

	/**
	 * Compile an XML content and understand it
	 * @param {XML} txt
	 * @return {nul.expression}
	 * @throw {nul.ex.semantic}
	 * @throw {nul.ex.syntax} 
	 */
	xmlRead: function(txt, glbNm)
	{
		return nul.compile.xml(txt).mar(function() {
			try {
				return nul.understand(this, glbNm).listed();
			} catch(x) {
				nul.failed(x);
				return [];
			}
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
			nul.ex.semantic('KNW', 'The evaluation of '+name+' failed', set);
		}
		nul.execution.globalKlg = gKlg;
		return rv;
	}.describe('Knownation'),
	
	/**
	 * Compile a text, understand, have it queried and known
	 * @param {String} txt
	 * @return {nul.expression}
	 * @throw {nul.ex.semantic}
	 * @throw {nul.ex.syntax} 
	 */
	read: function(txt, glbNm)
	{
		return nul.known(nul.data.query(nul.nulRead(txt, glbNm)), glbNm);
	}.describe('Reading')
});

