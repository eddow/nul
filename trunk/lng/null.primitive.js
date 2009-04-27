/*  NUL language JavaScript framework
 *  (c) 2009 François Marie De Mey
 *
 * NUL is freely distributable under the terms of GNU GPLv3 license.
 *  For details, see the NUL project site : http://code.google.com/p/nul/
 *
 *--------------------------------------------------------------------------*/

/**
 * Functions not accessible by name in NUL code but used by operators.
 */
nul.nativeFunctions = {
	hardCoded: function(txt, hcFctNm, hcFct) {
		if(!nul.nativeFunctions.hardCoded[hcFctNm]) {
			nul.debug.log('evals')(nul.debug.lcs.collapser('hardCode'), [hcFctNm]);
			var rv;
			try {
				var ub = new nul.globalsUse(null, 'operation');
				ub.createFreedom(
					'hardCoded', new nul.xpr.javascript.fct(hcFctNm,hcFct));
				nul.nativeFunctions.hardCoded[hcFctNm] =
					ub.valued(nul.compile(txt));
			} finally {
				nul.debug.log('evals')(nul.debug.lcs.endCollapser('hardCoded'),
					[nul.nativeFunctions.hardCoded[hcFctNm]]);
			}
		}
		return nul.nativeFunctions.hardCoded[hcFctNm].clone();
	}.perform('nul.nativeFunctions.hardCoded'),
	atomOp: function(op, tp) {
		return function() {
			return nul.nativeFunctions.hardCoded(
				'('+tp+' a, '+tp+' b) :- hardCoded(a,b)',
				//'{} :- 0 []'+'(a, b,.. c) :- operation(hardCoded(a,b), c)'
				nul.natives[tp].name+op+nul.natives[tp].name,
				function(o, klg) {
					var o1 = o.components[0], o2 = o.components[1];
					if(!o1.finalRoot() || !o2.finalRoot()) return;
					return new nul.xpr.value(
						eval(''+o1.jsValue()+op+o2.jsValue()));
			 	}
			);
		}
	},
	atomCeded: function(fct, op, tp) {
		return function() {
			return nul.nativeFunctions.hardCoded(
				'\\/a {'+tp+' a} :- hardCoded a',
				op+nul.natives[tp].name,
				function(o, klg) {
					if(o.finalRoot()) return fct(o);
			 	}
			);
		}
	},
};

nul.primitive = {
	'set': {
		'#': nul.nativeFunctions.atomCeded(function(o) {
			return new nul.xpr.value(0/*TODO*/);
		}, '#', 'set'),
	},
	'number': {
		'+': nul.nativeFunctions.atomOp('+', 'Q'),
		'-': nul.nativeFunctions.atomOp('-', 'Q'),
		'*': nul.nativeFunctions.atomOp('*', 'Q'),
		'/': nul.nativeFunctions.atomOp('/', 'Q'),
		'%': nul.nativeFunctions.atomOp('%', 'Q'),
/*		'-.': function(klg) {
			if(this.finalRoot()) return nul.build.atom(-this.value);
		},
		'<': function(o, klg) {
			nul.natives.Q.callback(o);
			if(this.finalRoot() && o.finalRoot()) {
				if(this.value >= o.value) nul.fail('Bad order');
				return true;
			}
		}*/
	},
	'integer': {
		
	},
	'string': {
		'+': nul.nativeFunctions.atomOp('+', 'str'),
/*		'<': function(o, klg) {
			nul.natives.str.callback(o);
			if(this.finalRoot() && o.finalRoot()) {
				if(this.value >= o.value) nul.fail('Bad order');
				return true;
			}
		},
		//TODO: here, we really have to specify it is commutative !
		//TODO: 2 'inverses'
		'*': function(o, klg) {
			nul.natives.Q.callback(o);
			if(this.finalRoot() && o.finalRoot()) {
				var ns = '';
				for(var i=0; i<o.value; ++i) ns += this.value;
				return nul.build.atom(ns);
			}
		},*/
		'#': nul.nativeFunctions.atomCeded(function(o) {
			return new nul.xpr.value(o.jsValue().length-2);
				//remove 2 for the "" added by jsValue
		}, '#', 'str'),
	},
	'boolean': {
		//TODO? qq +(or), *(and) et -(not/don't imply) ?
	},
	'object': {
	}

};

/**
 * Primitive types hyerarchy
 */
nul.primitiveTree = {
	'integer': 'number',
	'number': 'object',
	'string': 'object',
	'boolean': 'object',
	'set': 'object',
	is: function(xpr, pnm, artcl) {
		var spnm = xpr.primitive;
		while(spnm) if(spnm == pnm) return true;
			else spnm = nul.primitiveTree[spnm];
		if(xpr.primitive) nul.fail('Not '+artcl+' '+pnm+' : '+xpr.toString());
	},
	attribute: function(pnm, atn) {
		while(pnm) if(!nul.primitive[pnm][atn]) pnm = nul.primitiveTree[pnm];
		else return nul.primitive[pnm][atn];
	}
};
