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
		if(nul.debug.xTest) assert(this.dbg!= x.dbg, 'X doesnt merge to itself');
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
	freedom: function(value, premices, lvals, locals, itm) {
		itm.freedom = true;
		itm.f_composed = itm.composed;
		itm.f_integrity = itm.integrity;
		for(var i in nul.behav.freedom) itm[i] = nul.behav.freedom[i];
		itm.locals = locals;
		lvals.premices = nul.build.and3(premices);
		lvals.value = value;
		return itm.compose(lvals);
	},
	item: function(ops) {
		var itm = {};
		for(var i=1; i<arguments.length; ++i) map(arguments[i],
			function(i, o) { itm[i] = o; })
		itm.x = nul.x();
		for(var i in nul.xpr) if(!itm[i]) itm[i] = nul.xpr[i];
		if(nul.debug.assert) assert(
			'{}'== itm.charact || !this.locals || 0>=this.locals.length,
			'Locals only defined on sets')
		if(this.locals) itm.locals = this.locals;
		if(ops) {
			itm.components = isArray(ops)?[]:{};
			itm = itm.compose(ops);
		}
		return itm.summarised(true);
	}.perform('nul.build->item'),
	listOp: function(itm, chrct, ops, strC) {
		if(!strC) strC = chrct;
		itm.charact = chrct;
		if(typeof(strC) == 'string') {
			itm.expressionHTML = function() {
				return nul.text.expressionHTML(
					'<span class="op">'+strC+'</span>', this.components);
			};
			itm.toString = function() {
				return '('+nul.text.toString(strC, this.components)+')';
			};
		} else {
			itm.expressionHTML = strC[0];
			itm.toString = strC[1];
		}
		return this.item(ops, itm);
	}.perform('nul.build->listOp'),
	ceded: function(itm, chrct, oprnd, strC) {
		itm.charact = chrct;
		itm.expressionHTML = strC[0];
		itm.toString = strC[1];
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
			itm.toString = function() { 
				var comps = [];
				for(var nm in this.components) comps.push(this.components[nm]);
				return '('+nul.text.toString(strC, comps)+')';
			};
		} else {
			itm.expressionHTML = strC[0];
			itm.toString = strC[1];
		}
		return this.item(ops, itm);
	}.perform('nul.build->nmdOp'),

	html_place: function(htmlElement) {
		return this.item(null, {
			charact: '<html>',
			element: htmlElement,
			expressionHTML: function() { return '&lt;Element&gt;'; },
			toString: function() { return '&lt;Element&gt;'; }
		}, nul.behav.html_place);
	},

	atom: function(value) {
		return this.item(null, {
			value: value,
			charact: 'atom',
			expressionHTML: 'string'==typeof(value)?
				function() { return escapeHTML('"'+this.value+'"'); }:
				function() { return ''+this.value; },
			toString: 'string'==typeof(value)?
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
			toString: function() {
				return (this.dbgName?this.dbgName:'')+ '['+this.lindx+'|'+this.ctxDelta+']';
			},
			makeDeps: function() { return nul.lcl.dep.dep(this.ctxDelta, this.lindx); },
		});
	},
		
	application: function(obj, apl) {
		return this.nmdOp(
			nul.behav.application,'[-]', {object: obj, applied: apl},'');
	},
	set: function(value, premices, lvals, locals) {
		if(!value) return this.item(null, {
			charact: '{}',
			expressionHTML: function() { return '&phi;'; },
			toString: function() { return '&phi;'; },
			take: function(apl) { nul.fail('Taking from empty set : ' + apl.dbgHTML()); }
		});
		return this.freedom(value, premices, lvals, locals, this.item([], nul.behav.set, {
			charact: '{}',
			expressionHTML: function() { 
				var rv = '<span class="op">{</span>' + this.components.value.toHTML();
				if(0<this.components.premices.components.length)
					rv += '<hr />' + this.components.premices.toHTML();
				return rv + '<span class="op">}</span>';
			},
			toString: function() {
				var rv = '{'+this.components.value.toString();
				if(0<this.components.premices.components.length)
					rv += '; '+this.components.premices.toString();
				return rv+'}';
			},
		}));
	},
	seAppend: function(dst, itms) {
		return this.nmdOp(nul.behav.seAppend,'<<=', { effected: dst, appended: itms }, '&lt;&lt;=');
	},
	lambda: function(parms, value) {
		value.x.attributes[''] = parms;
		return value;
	},
	cumulExpr: function(oprtr, oprnds) {
		return this.listOp(nul.behav.cumulExpr,oprtr, oprnds, mathSymbol(oprtr));
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
				var rv = nul.text.toString(',', this.components);
				if(!this.components.follow) return rv;
				return rv.substr(0,rv.length-1)+' ,.. '+this.components.follow.toString()+')';
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
		return this.listOp(
			merge({way:way||0}, nul.behav.unification),
			['=:','=',':='][(way||0)+1],
			ops);
	},
	and3: function(ops) {
		return this.listOp(nul.behav.and3,';', ops);
	},
	or3: function(ops) {
		return this.listOp(nul.behav.or3,'[]', ops, '&#9633;');
	},
	xor3: function(ops) {
		return this.listOp(nul.behav.xor3,':', ops);
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
		return applied.summarised(true);
	},
	nativeSet: function(name, fct) {
		return this.item(null, {
			callback: fct,
			charact: 'native',
			name: name,
			expressionHTML: function() { return '<span class="global">'+this.name+'</span>'; },
			toString: function() { return this.name; }
		}, nul.behav.nativeSet);
	}
};
