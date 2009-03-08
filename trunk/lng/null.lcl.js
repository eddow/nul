/*  NUL language JavaScript framework
 *  (c) 2009 François Marie De Mey
 *
 * NUL is freely distributable under the terms of GNU GPLv3 license.
 *  For details, see the NUL project site : http://code.google.com/p/nul/
 *
 *--------------------------------------------------------------------------*/
 
nul.lcl = {
	slf: '&crarr;',
	//Manage dependances
	dep : {
		//The empty dependances
		empty: {},
		//Is the dependances <d> free beside <beside> on the form {ctxDelta : true}
		free: function(d, beside) {
			if(!beside) beside=[true];
			for(var c in d) if(!beside[c]) return false;
			return true;
		},
		//Create a one-local dependance
		//A dependance toward ctx <ctxName>, lindx <lndx> and depending <cnt> times
		dep: function(ctxName, lndx, cnt) {
			var rv = {};
			rv[ctxName] = {};
			rv[ctxName][lndx] = cnt||1;
			return rv;
		},
		//mix the dependances in the array <dn>
		mix: function(ds) {
			var rv = {};
			for(var dn = 0; dn< ds.length; ++dn )
				for(var d in ds[dn])
				{
					if(!rv[d]) rv[d] = {};
					for(var l in ds[dn][d])
						if(!rv[d][l]) rv[d][l] = ds[dn][d][l];
						else rv[d][l] += ds[dn][d][l];
				}
			return rv;
		},
	}
};