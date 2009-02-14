nul.exception = function(type, msg, chrct)
{
	nul.debug.log('errorLog')('Error: '+type, msg);
	var err = { nul: true, type: type, message: msg,
		callStack: nul.debug.watches? nul.debug.callStack.value():null,
		kb: nul.debug.watches? nul.debug.kbase.value():null,
		chrct: chrct };
	if(!nul.erroneus) nul.erroneus = err;
	else nul.erroneus.follow = err;
	return nul.erroneus;
};
nul.exception.notice = function(err)
{
	if(err.fileName && err.stack && !nul.erroneus) {
		nul.internalException('Javascript error : '+err.message);
		nul.erroneusJS = err;
	}
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
