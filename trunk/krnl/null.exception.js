/*  NUL language JavaScript framework
 *  (c) 2009 E-med Ware
 *
 * NUL is freely distributable under the terms of GNU GPLv3 license.
 *  For details, see the NUL project site : http://code.google.com/p/nul/
 *
 *--------------------------------------------------------------------------*/
 
//TODO D

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

nul.exception.notice = function(err)
{
	if(err.fileName && err.stack && !nul.erroneus) {
		nul.internalException('Javascript error : '+err.message);
		nul.erroneusJS = err;
	}
	return err;
};

nul.semanticException = function(code, msg, chrct)
{
	return nul.exception('semantic', 'SEM'+code, msg, chrct);
};
nul.syntaxException = function(code, msg, chrct)
{
	return nul.exception('syntax', 'SYN'+code, msg, chrct);
};
nul.internalException = function(msg, chrct)
{
	return nul.exception('internal', 'INT', msg, chrct);
};
