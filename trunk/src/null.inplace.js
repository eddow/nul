/*  NUL language JavaScript framework
 *  (c) 2009 E-med Ware
 *
 * NUL is freely distributable under the terms of GNU GPLv3 license.
 *  For details, see the NUL project site : http://code.google.com/p/nul/
 *
 *--------------------------------------------------------------------------*/
//#requires: src/null.loading

nul.loading.fixConsole = function(ncd) { if(ncd) nul.console = false; };
nul.loading.follow = function(f) {f();};
nul.loading();
