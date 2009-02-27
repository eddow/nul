/*  NUL language JavaScript framework
 *  (c) 2009 François Marie De Mey
 *
 * NUL is freely distributable under the terms of GNU GPLv3 license.
 *  For details, see the NUL project site : http://code.google.com/p/nul/
 *
 *--------------------------------------------------------------------------*/
 
nul.exception = function(type, msg, chrct)
{
	var err = { nul: true, type: type, message: msg,
		callStack: nul.debug.watches? nul.debug.callStack.value():null,
		kb: nul.debug.watches? nul.debug.kbase.value():null,
		chrct: chrct };
	if(!nul.erroneus) nul.erroneus = err;
	else nul.erroneus.follow = err;
	nul.debug.log('errorLog')('Error: '+type, msg);
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

nul.semanticException = function(msg, chrct)
{
	return nul.exception('semantic', msg, chrct);
};
nul.syntaxException = function(msg, chrct)
{
	return nul.exception('syntax', msg, chrct);
};
nul.internalException = function(msg, chrct)
{
	return nul.exception('internal', msg, chrct);
};
nul.unbrowsableException = function(obj)
{
	var rv = nul.exception('internal', 'Cannot browse: '+obj.toHTML());
	rv.unbrowsable = obj;
	return rv;
};
