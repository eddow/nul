/*  NUL language JavaScript framework
 *  (c) 2009 François Marie De Mey
 *
 * NUL is freely distributable under the terms of GNU GPLv3 license.
 *  For details, see the NUL project site : http://code.google.com/p/nul/
 *
 *--------------------------------------------------------------------------*/
nul.x = function(x) {
	rv = {};
	rv.attributes = x&&x.attributes?clone1(x.attributes):{};
	rv.clone = function() { return nul.x(this); };
	rv.xadd = function(x, kb) {
		//TODO: avoid too much xadd
		//if(nul.debug.xTest) assert(this.dbg!= x.dbg, 'X doesnt merge to itself');
		merge(this.attributes, x.attributes, function(a,b) { return nul.unify.level(a,b, kb); });
		for(var i in x) if(!['attributes'].contains(i))
			this[i] = x[i];
		return this;
	}.perform('nul.xpr->xadd');
	if(nul.debug.xTest) rv.dbg = ++nul.x.cpt;
	return rv;
};
if(nul.debug.xTest) nul.x.cpt = 0;

nul.build = {
	freeval: function(value, premices) {
		var rv = premices || [];
		if(value) rv.value = value;
		return rv;
	},
	freedom: function(tp, locals, itm) {
		if(itm.charact && ['{}','kw'].contains(itm.charact)) {
			itm.freedom = tp;
			
			map(itm, function(i, o) { if('function'== typeof o && 'f_'!= i.substr(0,2))
				itm['f_'+i] = o; })
			for(var i in nul.behav.freedom) itm[i] = nul.behav.freedom[i];
			itm.locals = locals;
		}
		return itm;
	},
	item: function(ops) {
		var itm = {};
		for(var i=1; i<arguments.length; ++i) map(arguments[i],
			function(i, o) { itm[i] = o; })
		itm.x = nul.x();
		for(var i in nul.xpr) if(!itm[i]) itm[i] = nul.xpr[i];
		itm.toString = nul.text.toString;
		
		if(nul.debug.assert) assert(
			'{}'== itm.charact || !this.locals || 0>=this.locals.length,
			'Locals only defined on sets')
		if(this.locals) itm.locals = this.locals;
		if(ops) {
			itm.components = isArray(ops)?[]:{};
			itm = itm.compose(ops);
		}
		return itm.summarised();
	}.perform('nul.build->item'),
	listOp: function(itm, chrct, ops, strC) {
		if(!strC) strC = chrct;
		itm.charact = chrct;
		if(typeof(strC) == 'string') {
			itm.expressionHTML = function() {
				return nul.text.expressionHTML(
					'<span class="op">'+strC+'</span>', this.components);
			};
			itm.expressionString = function() {
				return '('+nul.text.expressionString(strC, this.components)+')';
			};
		} else {
			itm.expressionHTML = strC[0];
			itm.expressionString = strC[1];
		}
		return this.item(ops, itm);
	}.perform('nul.build->listOp'),
	ceded: function(itm, chrct, oprnd, strC) {
		itm.charact = chrct;
		itm.expressionHTML = strC[0];
		itm.expressionString = strC[1];
		return this.item([oprnd], itm);
	}.perform('nul.build->ceded'),
	prec: function(itm, chrct, oprnd, strC) {
		if(!strC) strC = chrct;
		return this.ceded(itm, chrct, oprnd, typeof(strC) == 'string' ?
			[function() { return '<span class="op">'+strC+'</span>'+this.components[0].toHTML(); },
			function() { return strC+this.components[0].toString(); }] : strC);
	}.perform('nul.build->prec'),
	post: function(itm, chrct, oprnd, strC) {
		if(!strC) strC = chrct;
		return this.ceded(itm, chrct, oprnd, typeof(strC) == 'string' ?
			[function() { return this.components[0].toHTML()+'<span class="op">'+strC+'</span>'; },
			function() { return this.components[0].toString()+strC; }] : strC);
	}.perform('nul.build->post'),
	nmdOp: function(itm, chrct, ops, strC) {
		if('undefined'== typeof strC) strC = chrct;

		itm.charact = chrct;
		if(typeof(strC) == 'string') { 
			itm.expressionHTML = function() { 
				var comps = [];
				for(var nm in this.components) comps.push(this.components[nm]);
				return nul.text.expressionHTML('<span class="op">'+strC+'</span>', comps);
			};
			itm.expressionString = function() { 
				var comps = [];
				for(var nm in this.components) comps.push(this.components[nm]);
				return '('+nul.text.expressionString(strC, comps)+')';
			};
		} else {
			itm.expressionHTML = strC[0];
			itm.expressionString = strC[1];
		}
		return this.item(ops, itm);
	}.perform('nul.build->nmdOp'),

	html_place: function(htmlElement) {
		return this.item(null, {
			charact: '<html>',
			element: htmlElement,
			expressionHTML: function() { return '&lt;Element&gt;'; },
			expressionString: function() { return '&lt;Element&gt;'; }
		}, nul.behav.html_place);
	},

	atom: function(value) {
		return this.item(null, {
			value: value,
			charact: 'atom',
			expressionHTML: 'string'==typeof(value)?
				function() { return escapeHTML('"'+this.value+'"'); }:
				function() { return ''+this.value; },
			expressionString: 'string'==typeof(value)?
				function() { return escapeHTML('"'+this.value+'"'); }:
				function() { return ''+this.value; },
		});
	},
	local: function(ctxDelta, lindx, dbgName) {
		return this.item(null, {
			charact: 'local',	//TODO: remplacer les 'undefined'!= typeof ....lindx par un test sur charact
			ctxDelta: ctxDelta,
			lindx: lindx,
			dbgName: dbgName,
			expressionHTML: function() {
				return this.dbgName? (
					'<span class="local">'+this.dbgName+'<span class="desc"><span class="sup">'+this.lindx+'</span><span class="sub">'+this.ctxDelta+'</span></span></span>'
					) : (
					'<span class="local">'+this.lindx+'<span class="desc"><span class="sub">'+this.ctxDelta+'</span></span></span>'
					);
			},
			expressionString: function() {
				return (this.dbgName?this.dbgName:'')+ '['+this.lindx+'|'+this.ctxDelta+']';
			},
			makeDeps: function() { return nul.lcl.dep.dep(this.ctxDelta, this.lindx); },
		});
	},
		
	application: function(obj, apl) {
		return this.nmdOp(
			nul.behav.application,'[-]', {object: obj, applied: apl},'');
	},
	kwFreedom: function(value, premices) {	//Knowledge-wide freedom
		return this.freedom('kw', [], this.item(this.freeval(value, premices), nul.behav.kwFreedom, {
			charact: 'kw',
			expressionHTML: function() {
				if(!this.components) return '<span class="failure">fail</span>';
				return this.freedomHTML();
			},
			expressionString: function() {
				if(!this.components) return '&lt;fail&gt;';
				return this.freedomString();
			},
		}));
	},
	set: function(value, premices, locals) {
		if(!value) return this.item(null, {
			charact: '{}',
			expressionHTML: function() { return '&phi;'; },
			expressionString: function() { return '&phi;'; },
			take: function(apl) { nul.fail('Taking from empty set : ' + apl.dbgHTML()); }
		});
		return this.freedom('ctx', locals, this.item(this.freeval(value, premices), nul.behav.set, {
			charact: '{}',
			expressionHTML: function() { 
				return ''+
					'<span class="big op">{</span>' +
					this.freedomHTML() +
					'<span class="big op">}</span>';
			},
			expressionString: function() {
				return '{'+this.freedomString()+'}';
			},
		}));
	},
	seAppend: function(dst, itms) {
		return this.nmdOp(nul.behav.seAppend,'<<+', { effected: dst, appended: itms }, '&lt;&lt;=');
	},
	lambda: function(parms, value) {
		if(value.handle()) return nul.build.lambda(parms, value.handle());
		return value.handled(parms).summarised();
	},
	cumulExpr: function(oprtr, oprnds) {
		return this.listOp(nul.behav.cumulExpr,oprtr, oprnds, mathSymbol(oprtr));
	},
    biExpr: function(oprtr, oprnds) {
            return this.listOp(nul.behav.biExpr,oprtr, oprnds, mathSymbol(oprtr));
    },
	list: function(oprnds) {
		return this.listOp(nul.behav.list,',', oprnds,[
			function() {
				if(1==this.components.length && !this.components.follow)
					return '<span class="op">{</span>'+this.components[0].toHTML()+'<span class="op">}</span>';
				var rv = nul.text.expressionHTML('<span class="op">,</span>', this.components);
				if(!this.components.follow) return rv;
				return rv+'<span class="op">,..</span>'+this.components.follow.toHTML();
			},
			function() {
				if(1==this.components.length && !this.components.follow)
					return '{'+this.components[0].toString()+'}';
				var rv = '('+nul.text.expressionString(',', this.components);
				if(!this.components.follow) return rv + ')';
				return rv +' ,.. '+this.components.follow.toString()+')';
			}			
		]);
	},
	preceded: function(oprtr, oprnd) {
		return this.prec(nul.behav.preceded,oprtr, oprnd);
	},
	assert: function(oprnd) {
		return this.prec(nul.behav.assert,'?', oprnd, '?');
	},
	extraction: function(oprnd) {
		return this.post(nul.behav.extraction,' !', oprnd, '!');
	},
	unification: function(ops, way) {
		if(1== way) { var t = ops[0]; ops[0] = ops[1]; ops[1] = t; way = -1; }
		return this.listOp(
			merge({way:way||0}, nul.behav.unification),
			way==-1?':=':'=',
			ops);
	},
	and3: function(ops) {
		return this.listOp(nul.behav.and3,';', ops);
	},
	ior3: function(ops) {
		return this.listOp(merge(nul.behav.ior3, nul.behav.kwFreedomHolder), '[]', ops, '&#9633;');
	},
	xor3: function(ops) {
		return this.listOp(merge(nul.behav.xor3, nul.behav.kwFreedomHolder),':', ops);
	},
	xml: function(node, attrs, content) {
		var rv = this.lambda(
				nul.build.atom(node),
				nul.build.list(content)
			);
		rv.x.attributes = attrs;
		rv.toXML = function() {
			var opn = '<' + this.components.parms.value;
			for(var a in this.x.attributes) opn += ' ' + a + '=' + this.attributes[a].toHTML();
			var itms = this.components.value.components;
			if(0>= itms.length) return opn + ' />';
			var insd = '';
			for(var i=0; i<itms.length; ++i) {
				if(itms[i].value) insd += itms[i].value;
				else if(itms[i].toXML) insd += itms[i].toXML();
				else throw nul.semanticException('XML element is still context dependant.');
			}
			return opn+'>'+insd+'</'+this.components.parms.value+'>';
		};
		return rv;
	},

	attributed: function(applied, name, value) {
		applied.x.attributes[name] = value;
		return applied.summarised();
	},
	nativeSet: function(name, fct) {
		return this.item(null, {
			callback: fct,
			charact: 'native',
			name: name,
			expressionHTML: function() { return '<span class="global">'+this.name+'</span>'; },
			expressionString: function() { return this.name; }
		}, nul.behav.nativeSet);
	}
};
