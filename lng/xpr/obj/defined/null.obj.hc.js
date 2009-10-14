/*  NUL language JavaScript framework
 *  (c) 2009 E-med Ware
 *
 * NUL is freely distributable under the terms of GNU GPLv3 license.
 *  For details, see the NUL project site : http://code.google.com/p/nul/
 *
 *--------------------------------------------------------------------------*/

/**
 * Compute a hard-coded result.
 * @param {nul.xpr.possible}
 * @return {nul.xpr.possible} The precised element. Or null if not determinable : the image through the function
 * @throw nul.failure
 * @alias queryCallBack
 */

/**
 * Create a hard-coded set.
 * @param {string} ndx Custom index
 * @param {queryCallBack} cb Call-back
 * @return {nul.xpr.object}  
 */
nul.obj.set = function(ndx, cb) {
	return new nul.obj.data(new nul.data.compute(ndx, cb));
};

/**
 * Compute a hard-coded result.
 * @param {nul.xpr.possible}
 * @return {nul.xpr.possible} The image point. Or null if not determinable : the image through the function
 * @throw nul.failure
 * @alias functionCallBack
 */

/**
 * Create a hard-coded function.
 * @param {string} ndx Custom index
 * @param {functionCallBack} cb Call-back  
 * @return {nul.xpr.object}  
 */
nul.obj.fct = function(ndx, cb) {
	return new nul.obj.data(new nul.data.compute(ndx, cb));
};