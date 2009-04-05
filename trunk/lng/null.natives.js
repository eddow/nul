/*  NUL language JavaScript framework
 *  (c) 2009 François Marie De Mey
 *
 * NUL is freely distributable under the terms of GNU GPLv3 license.
 *  For details, see the NUL project site : http://code.google.com/p/nul/
 *
 *--------------------------------------------------------------------------*/
nul.nativeFunction = {
	/**
	 * Gets an expression, operation on atoms
	 * op (operator)
	 * itm (item): first component
	 * tp (type): expected component type (a native function)
	 * tpn (type name): expected component type name (a JS string)
	 */
	atomOp: function(op, itm, tp, tpn) {
		return nul.build.nativeFunction(tpn+op, function(o) {
			tp.callback(o);
			return nul.build.atom(eval( ''+nul.jsVal(itm.value) + op + nul.jsVal(nul.asJs(o, op)) ));
		});
	},
	///Function given as attribute, that give the atomOp if needed
	//tp is the string key of native set
	atomOpDifferer: function(op, tp, tpn) {
		return function(itm) { return nul.nativeFunction.atomOp(op, itm, nul.natives[tp], tpn); };
	},
	/**
	 * Makes a function that manages two NUL set (list, set, ...) out of a function managing two
	 * lists in a common local space
	 */
	setItmFct: function(f) {
		return function(o) {	//The returned function is the operation : <this> is the item
			if(
			!nul.natives.set.callback(o) ||	//If undefined other operands, wait
			//If one 'follow' is not fixed, wait
			','== this.charact && this.components.follow && '{}'!= this.components.follow.charact ||
			','== o.charact && o.components.follow && '{}'!= o.components.follow.charact)
				return;
		};
	}
};
nul.primitive = {
	'set': {
		/*'"op+': nul.build.nativeFunction('set+set', function(o) {
			nul.natives.set.callback(o);
			var ns = '';
			for(var i=0; i<o.value; ++i) ns += itm.value;
			return nul.build.atom(ns);
		})*/
	},
	'number': {
		'"op+': nul.nativeFunction.atomOpDifferer('+', 'Q', 'number'),
		'"op-': nul.nativeFunction.atomOpDifferer('-', 'Q', 'number'),
		'"op*': nul.nativeFunction.atomOpDifferer('*', 'Q', 'number'),
		'"op/': nul.nativeFunction.atomOpDifferer('/', 'Q', 'number'),
		'"op%': nul.nativeFunction.atomOpDifferer('%', 'Q', 'number')
	},
	'string': {
		'"op+': nul.nativeFunction.atomOpDifferer('+', 'str', 'string'),
		//TODO: here, we really have to specify it is commutative !
		'"op*': function(itm) {
			return nul.build.nativeFunction('string*integer', function(o) {
				nul.natives.N.callback(o);
				var ns = '';
				for(var i=0; i<o.value; ++i) ns += itm.value;
				return nul.build.atom(ns);
			});
		}
	},
	'boolean': {
	}
};

nul.natives = {
	Q: nul.build.nativeSet('&#x211a;',
		function(xpr) {
			if('number'== typeof xpr.value) return xpr;
			if(xpr.fixed()) nul.fail('Not a number : '+xpr.dbgHTML());
			return;
		}
	),
	Z: nul.build.nativeSet('&#x2124;',
		function(xpr) {
			xpr = nul.natives.Q.callback(xpr);
			if(xpr && Math.floor(xpr.value)!= xpr.value) nul.fail('Not an integer : '+xpr.dbgHTML());
			return xpr;
		}
	),
	N: nul.build.nativeSet('&#x2115;',
		function(xpr) {
			xpr = nul.natives.Z.callback(xpr);
			if(xpr && 0> xpr.value) nul.fail('Not a positive integer : '+xpr.dbgHTML());
			return xpr;
		}
	),
	'true': nul.build.atom(true),
	'false': nul.build.atom(false),
	str: nul.build.nativeSet('str',
		function(xpr) {
			if('string'== typeof xpr.value) return xpr;
			if(xpr.fixed()) nul.fail('Not a string : '+xpr.dbgHTML());
			return;
		}
	),
	bool: nul.build.nativeSet('bool',
		function(xpr) {
			if('boolean'== typeof xpr.value) return xpr;
			if(xpr.fixed()) nul.fail('Not a boolean : '+xpr.dbgHTML());
			return;
		}
	),
	set: nul.build.nativeSet('set',
		function(xpr) {
			if([',','{}'].contains(xpr.charact)) return xpr;
			if(xpr.fixed()) nul.fail('Not a set : '+xpr.dbgHTML());
			return;
		}
	)
};