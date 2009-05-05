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
	hardCoded: function(ftp, txt, hcFctNm, hcFct, hcInv) {
		if(!nul.nativeFunctions.hardCoded[hcFctNm]) {
			nul.debug.log('evals')(nul.debug.lcs.collapser('hardCode'), [hcFctNm]);
			var rv;
			try {
				var ub = nul.globalsUse('operation');
				ub.createFreedom(
					'hardCoded', new nul.xpr.javascript[ftp](
						hcFctNm, hcFct, hcInv));
				nul.nativeFunctions.hardCoded[hcFctNm] =
					ub.valued(nul.compile(txt));
			} finally {
				if(nul.debug.assert) assert(nul.nativeFunctions.hardCoded[hcFctNm],
					'Hardcoded '+hcFctNm+' compile');
				nul.debug.log('evals')(nul.debug.lcs.endCollapser('hardCoded'),
					[nul.nativeFunctions.hardCoded[hcFctNm]]);
			}
		}
		return nul.nativeFunctions.hardCoded[hcFctNm].clone();
	}.perform('nul.nativeFunctions.hardCoded'),
	atomOp: function(op, tp, neutral) {
		return function() {
			return nul.nativeFunctions.hardCoded('fct',
//				tp+' a ? {a} :- a [] ' +
//				'('+tp+' a, b,.. C) :- hardCoded(a, operation(b, C))',
				'('+tp+' a, '+tp+' b) :- hardCoded(a,b)',
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
	atomBiOp: function(op, tp) {
		return function() {
			return nul.nativeFunctions.hardCoded('fct',
				'('+tp+' a, '+tp+' b) :- hardCoded(a,b)',
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
	atomOrdr: function(tp) {
		return function() {
			return nul.nativeFunctions.hardCoded('set',
				'hardCoded('+tp+' a, '+tp+' b)',
				nul.natives[tp].name+'&lt;'+nul.natives[tp].name,
				function(o, klg) {
					var o1 = o.components[0], o2 = o.components[1];
					if(!o1.finalRoot() || !o2.finalRoot()) return;
					if(o1.jsValue()>=o2.jsValue()) nul.fail('Bad order');
					return 'ok';
			 	}
			);
		}
	},
	atomCeded: function(fct, op, tp) {
		return function() {
			return nul.nativeFunctions.hardCoded('fct',
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
			return new nul.xpr.value(0);	//TODO
		}, '#', 'set'),
	},
	'number': {
		'+': nul.nativeFunctions.atomOp('+', 'Q', 0),
		'-': nul.nativeFunctions.atomBiOp('-', 'Q'),
		'*': nul.nativeFunctions.atomOp('*', 'Q', 1),
		'/': nul.nativeFunctions.atomBiOp('/', 'Q'),
		'%': nul.nativeFunctions.atomBiOp('%', 'Q'),	//TODO: 3.7 % 0.7 = 0.2 
		'<': nul.nativeFunctions.atomOrdr('Q'),
	},
	'integer': {
		
	},
	'string': {
		'id': function() {
			return new nul.xpr.value('string');
		},
		'+': nul.nativeFunctions.atomOp('+', 'str', '""'),
		'#': nul.nativeFunctions.atomCeded(function(o) {
			return new nul.xpr.value(o.jsValue().length-2);
				//remove 2 for the "" added by jsValue
		}, '#', 'str'),
	},
	'boolean': {
		//TODO? qq +(or), *(and) et -(not/don't imply) ?
	},
	'object': {
		' hndl': function() {
			return [null, this, this];
		}
	},
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
		if(!xpr.primitive) return;
		if(xpr.primitive[''].contains(pnm)) return true;
		nul.fail('Not '+artcl+' '+pnm+' : '+xpr.toString());
	},
	primObject: function(pnm) {
		if(!nul.primitiveTree.primObject[pnm]) {
			var rv = {};
			rv[''] = [];
			while(pnm) {
				rv[''].push(pnm);
				rv = merge(rv, nul.primitive[pnm]);
				pnm = nul.primitiveTree[pnm];
			}
			nul.primitiveTree.primObject[pnm] = rv;
		}
		return nul.primitiveTree.primObject[pnm];
	}
};
