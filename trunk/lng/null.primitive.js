/*  NUL language JavaScript framework
 *  (c) 2009 François Marie De Mey
 *
 * NUL is freely distributable under the terms of GNU GPLv3 license.
 *  For details, see the NUL project site : http://code.google.com/p/nul/
 *
 *--------------------------------------------------------------------------*/

nul.primitive = {
	':-': {
/*		valHandle: function(hr, hd, kb) {
			nul.unify.level(hr, hd.components.handle, kb);
			return hd.components.value;
		},
		handeling: function(hr, hd, vh, kb) {
			return nul.build.lambda(hr.components.handle, vh(hr.components.value, hd, kb));
		}*/
	},
	'set': {
	},
	'number': {
/*		'+': nul.nativeFunctions.atomOp('+', 'Q'),
		'-': nul.nativeFunctions.atomOp('-', 'Q'),
		'*': nul.nativeFunctions.atomOp('*', 'Q'),
		'/': nul.nativeFunctions.atomOp('/', 'Q'),
		'%': nul.nativeFunctions.atomOp('%', 'Q'),
		'-.': function(kb) {
			if(this.finalRoot()) return nul.build.atom(-this.value);
		},
		'<': function(o, kb) {
			nul.natives.Q.callback(o);
			if(this.finalRoot() && o.finalRoot()) {
				if(this.value >= o.value) nul.fail('Bad order');
				return true;
			}
		}*/
	},
	'string': {
/*		'+': nul.nativeFunctions.atomOp('+', 'str'),
		'<': function(o, kb) {
			nul.natives.str.callback(o);
			if(this.finalRoot() && o.finalRoot()) {
				if(this.value >= o.value) nul.fail('Bad order');
				return true;
			}
		},
		//TODO: here, we really have to specify it is commutative !
		//TODO: 2 'inverses'
		'*': function(o, kb) {
			nul.natives.Q.callback(o);
			if(this.finalRoot() && o.finalRoot()) {
				var ns = '';
				for(var i=0; i<o.value; ++i) ns += this.value;
				return nul.build.atom(ns);
			}
		},*/
		'length': function(kb) {
			return nul.build.application(nul.nativeFunctions.strLen, this).evaluate(kb);
		}
	},
	'boolean': {
		//TODO? qq +, * et - ?
	},
	

};

/*
nul.nativeFunctions = {
	atomOp: function(op, tp) {
		return function(o, kb) {
			nul.natives[tp].callback(o);
			if(nul.debug.assert) assert('atom'== o.charact, 'Atom operators operate on atoms.');
			if(this.finalRoot() && o.finalRoot())
				return nul.build.atom(
					eval( ''+nul.jsVal(this.value) + op + nul.jsVal(o.value) )
				);
		};
	},
	strLength: nul.build.nativeFunction('strLen', function(o, kb, way) {
		if(way==-1) return; //TODO: implement inverse
		if(!o.finalRoot()) return;
		if(nul.debug.assert) assert('string'== typeof o.value, 'strLen should only apply on strings');
		return nul.build.atom(o.value.length);
	})
};
*/