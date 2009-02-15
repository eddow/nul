/*  NUL language JavaScript framework
 *  (c) 2009 François Marie De Mey
 *
 * NUL is freely distributable under the terms of GNU GPLv3 license.
 *  For details, see the NUL project site : http://code.google.com/p/nul/
 *
 *--------------------------------------------------------------------------*/
 
nul.lcl = {
	slf: '&crarr;',
	rcr: '&uarr;',
	//Manage dependances
	dep : {
		//The empty dependances
		empty: {},
		//Is the dependances <d> free beside <beside> on the form {ctxDelta : true}
		free: function(d, beside) {
			if(!beside) beside={};
			for(var c in d) if(!beside[c]) return false;
			return true;
		},
		//Create a one-local dependance
		dep: function(delta, lndx) {
			var rv = {};
			rv[delta] = {};
			rv[delta][lndx] = true;
			return rv;
		},
		//mix the dependances <d1> and <d2>
		//<d1> can also be a table[] and no <d2>
		mix: function(d1, d2) {
			if(d2) d1 = [ d1, d2 ];
			var rv = {};
			for(var dn = 0; dn< d1.length; ++dn )
				for(var d in d1[dn])
				{
					if(!rv[d]) rv[d] = {};
					for(var l in d1[dn][d]) rv[d][l] = d1[dn][d][l];
				}
			return rv;
		},
		//Returns the <inc>-times un-wrapped dependances <deps>
		stdDec: function(deps) {
			var nDeps = {};
			for(var d in deps) 
			{
				d = reTyped(d);
				if(0< d) nDeps[d-1] = deps[d];
			}
			return nDeps;
		}
	},
	//Create a context where a variable is associated to 'self'
	//<lindx> is the local-index of variable becoming 'self'
	selfCtx: function(dbgName, lindx, ctx) {
		var rv = ctx?clone1(ctx):[];
		rv[lindx] = nul.actx.local(-1, nul.lcl.slf, dbgName||'').ctxd();
		return rv;
	}
};