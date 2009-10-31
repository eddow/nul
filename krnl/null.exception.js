/*  NUL language JavaScript framework
 *  (c) 2009 E-med Ware
 *
 * NUL is freely distributable under the terms of GNU GPLv3 license.
 *  For details, see the NUL project site : http://code.google.com/p/nul/
 *
 *--------------------------------------------------------------------------*/
 
//TODO D
/**
 * @class
 */
nul.exception = function(type, code, msg, chrct)
{
	var err = { nul: true, type: type, message: msg,
		code: code,
		callStack: nul.debug.watches? nul.debug.callStack.value():null,
		chrct: chrct };
	if(!nul.erroneus) nul.erroneus = err;
	else nul.erroneus.follow = err;
	nul.debug.log('error')('Error', type, msg);
	return nul.erroneus;
};

/**
 * Manage an exception and sets the globals if there was JavaScript problems
 */
nul.exception.notice = function(err)
{
	if(err.fileName && err.stack && !nul.erroneus) {
		nul.internalException('Javascript error : '+err.message);
		nul.erroneusJS = err;
	}
	return err;
};

/**
 * An exception considering what is expressed by the NUL program
 * @constructs
 * @methodOf nul.exception
 * @param {String} code
 * @param {String} msg
 * @param {String} chrct
 */
nul.semanticException = function(code, msg, chrct)
{
	return nul.exception('semantic', 'SEM'+code, msg, chrct);
};

/**
 * An exception considering how is written a NUL program
 * @constructs
 * @methodOf nul.exception
 * @param {String} code
 * @param {String} msg
 * @param {String} chrct
 */
nul.syntaxException = function(code, msg, chrct)
{
	return nul.exception('syntax', 'SYN'+code, msg, chrct);
};

/**
 * A bug in the NUL interpreter - ideally never raised
 * @constructs
 * @methodOf nul.exception
 * @param {String} msg
 * @param {String} chrct
 */
nul.internalException = function(msg, chrct)
{
	return nul.exception('internal', 'INT', msg, chrct);
};
