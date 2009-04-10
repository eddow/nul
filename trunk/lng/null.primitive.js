/*  NUL language JavaScript framework
 *  (c) 2009 François Marie De Mey
 *
 * NUL is freely distributable under the terms of GNU GPLv3 license.
 *  For details, see the NUL project site : http://code.google.com/p/nul/
 *
 *--------------------------------------------------------------------------*/

nul.nativeFunctions = {
	atomOp: function(op, tp) {
		return function(o, kb) {
			nul.natives[tp].callback(o);
			if(this.finalRoot() && o.finalRoot())
				return nul.build.atom(
					eval( ''+nul.jsVal(this) + op + nul.jsVal(nul.asJs(o, op)) )
				);
		};
	}
};

nul.primitive = {
/*
	/**
	 * Makes a function that manages two NUL set (list, set, ...) out of a function managing two
	 * lists in a common local space
	 * /
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
  */
	':-': {
		primitive: 'lambda',
		valHandle: function(hr, hd, kb) {
			nul.unify.level(hr, hd.components.handle, kb);
			return hd.components.value;
		},
		handeling: function(hr, hd, vh, kb) {
			return nul.build.lambda(hr.components.handle, vh(hr.components.value, hd, kb));
		}
	},
	'set': {
		primitive: 'set'
		/*'+': nul.build.nativeFunction('set+set', function(o) {
			nul.natives.set.callback(o);
			var ns = '';
			for(var i=0; i<o.value; ++i) ns += itm.value;
			return nul.build.atom(ns);
		})*/
	},
	'number': {
		primitive: 'number',
		'+': nul.nativeFunctions.atomOp('+', 'Q'),
		'-': nul.nativeFunctions.atomOp('-', 'Q'),
		'*': nul.nativeFunctions.atomOp('*', 'Q'),
		'/': nul.nativeFunctions.atomOp('/', 'Q'),
		'%': nul.nativeFunctions.atomOp('%', 'Q'),
		'<': function(o, kb) {
				nul.natives.Q.callback(o);
				if(this.finalRoot() && o.finalRoot()) {
					if(this.value >= o.value) nul.fail('Bad order');
					return true;
				}
			}
		},
	'string': {
		primitive: 'string',
		'+': nul.nativeFunctions.atomOp('+', 'str'),
		'<': function(o, kb) {
				nul.natives.Q.callback(o);
				if(this.finalRoot() && o.finalRoot()) {
					if(this.value >= o.value) nul.fail('Bad order');
					return true;
				}
			}
		//TODO: here, we really have to specify it is commutative !
		/*'*': function(itm) {
			return nul.build.nativeFunction('string*integer', function(o) {
				nul.natives.N.callback(o);
				if(!o.finalRoot() || !itm.finalRoot()) return;
				var ns = '';
				for(var i=0; i<o.value; ++i) ns += itm.value;
				return nul.build.atom(ns);
			});
		}*/
	},
	'boolean': {
		primitive: 'boolean'
	},
	'': {
		primitive: 'unknown',
		valHandle: function(hr, hd, kb) {
			throw nul.semanticException('OPM', 'No knowledge on how to handle '+hd.toString())
		},
		handeling: function(hr, hd, vh, kb) {
			throw nul.semanticException('OPM', 'No knowledge on how to handle with '+hr.toString())
		}
	},
	
	
	mix: function(a, b) {
		if(!a || a==nul.primitive['']) return b;
		if(!b || b==nul.primitive['']) return a;
		if(a!=b) nul.fail('Type missmatch');
		return a;
	}
};