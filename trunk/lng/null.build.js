/*  NUL language JavaScript framework
 *  (c) 2009 François Marie De Mey
 *
 * NUL is freely distributable under the terms of GNU GPLv3 license.
 *  For details, see the NUL project site : http://code.google.com/p/nul/
 *
 *--------------------------------------------------------------------------*/

nul.x = function() {
	rv = {};
	rv.attributes = {};
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
	item: function(ops) {
		var itm = clone1(nul.xpr);
		for(var i=1; i<arguments.length; ++i) merge(itm,arguments[i]);

		itm.x = nul.x();
		
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

	htmlPlace: function(htmlElement) {
		var nr = nul.build.htmlPlace.expressed.indexOf(htmlElement);
		if(0>nr) {
			nr = nul.build.htmlPlace.expressed.length;
			nul.build.htmlPlace.expressed.push(htmlElement);
		}
		return this.item(null, {
			charact: '<html>',
			element: htmlElement,
			acNdx: '[<'+nr.toString()+'>]',
			expressionHTML: function() { return '&lt;Element&gt;'; },
			expressionString: function() { return '&lt;Element&gt;'; },
		}, nul.behav.htmlPlace);
	},
	dataTable: function(dataSource) {
		var nr = nul.build.dataTable.expressed.indexOf(dataSource);
		if(0>nr) {
			nr = nul.build.dataTable.expressed.length;
			nul.build.dataTable.expressed.push(dataSource);
		}
		return this.item(null, {
			charact: '<db>',
			acNdx: '[<'+nr.toString()+'>]',
			expressionHTML: function() { return '&lt;DB&gt;'; },
			expressionString: function() { return '&lt;DB&gt;'; },
		}, nul.behav.htmlPlace);
	},

	atom: function(value) {
		return this.item(null, {
			acNdx: '[' + ('string'==typeof(value)?'"':'') +
				value.toString().replace('[','[[]').replace(']','[]]').replace('|','[|]') +
				('string'==typeof(value)?'"':'') + ']',
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
	local: function(ctxName, lindx, dbgName) {
		return this.item(null, {
			charact: 'local',	//TODO: remplacer les 'undefined'!= typeof ....lindx par un test sur charact
			ctxName: ctxName,
			lindx: lindx,
			acNdx: '['+lindx+'|'+ctxName+']',
			dbgName: dbgName,
			expressionHTML: function() {
				return this.dbgName? (
					'<span class="local">'+this.dbgName+'<span class="desc"><span class="sup">'+this.lindx+'</span><span class="sub">'+this.ctxName+'</span></span></span>'
					) : (
					'<span class="local">'+this.lindx+'<span class="desc"><span class="sub">'+this.ctxName+'</span></span></span>'
					);
			},
			expressionString: function() {
				return (this.dbgName?this.dbgName:'')+ this.acNdx;
			},
			makeDeps: function() { return nul.lcl.dep.dep(this.ctxName, this.lindx); },
		});
	},
		
	application: function(obj, apl) {
		return this.nmdOp(
			nul.behav.application,'[-]', {object: obj, applied: apl},'');
	},
	kwFreedom: function(value, premices) {	//Knowledge-wide freedom
		return this.item(
			this.freeval(value, premices), 
			nul.behav.kwFreedom,
			nul.behav.freedom,
			{
				charact: 'kw',
				freedom: 'kw',
				expressionHTML: function() {
					if(!this.components) return '<span class="failure">fail</span>';
					return this.freedomHTML();
				},
				expressionString: function() {
					if(!this.components) return '&lt;fail&gt;';
					return this.freedomString();
				},
			});
	},
	set: function(value, premices, locals, ctxName) {
		if(!value) return this.item(null, {
			charact: '{}',
			expressionHTML: function() { return '&phi;'; },
			expressionString: function() { return '&phi;'; },
			take: function(apl) { nul.fail('Taking from empty set : ' + apl.dbgHTML()); }
		});
		return this.item(
			this.freeval(value, premices),
			nul.behav.set,
			nul.behav.freedom,
			{
				freedom: 'ctx',
				charact: '{}',
				ctxName: ctxName,
				locals: locals,
				expressionHTML: function() { 
					return ''+
						'<span class="big op">{</span>' +
						this.freedomHTML() +
						'<span class="big op">}</span>';
				},
				expressionString: function() {
					return '{'+this.freedomString()+'}';
				},
			});
	},
	seAppend: function(dst, itms) {
		return this.nmdOp(nul.behav.seAppend,'<<+', { effected: dst, appended: itms }, '&lt;&lt;+');
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
			merge({
				way:way||0,
				unification: true
			}, nul.behav.unification),
			way==-1?':=':'=',
			ops);
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
		merge(rv.x.attributes, attrs);
		rv.toXML = function() {
			var tag = this.handle().value;
			if(!tag || 'string'!= typeof tag) throw nul.semanticException('"'+tag.toString()+'" should be a computed string')
			var opn = '<' + tag;
			for(var a in this.x.attributes) if('+'!= a.substr(0,1))
				opn += ' ' + a + '=' + this.x.attributes[a].toString();
			var itms = this.components;
			if(0>= itms.length) return opn + ' />';
			var insd = '';
			for(var i=0; i<itms.length; ++i) {
				if(itms[i].value) insd += itms[i].value;
				else if(itms[i].toXML) insd += itms[i].toXML();
				else throw nul.semanticException('XML element is still context dependant.');
			}
			return opn+'>'+insd+'</'+tag+'>';
		};
		return rv;
	},

	attributed: function(applied, name, value) {
		applied.x.attributes[name] = value;
		return applied.summarised();
	},
	lambda: function(parms, value) {
		if(value.handle()) {
			nul.build.lambda(parms, value.handle());
			return value;
		}
		return value.handled(parms).summarised();
		//return this.attributed(value, '+handle', parms);
	},
	nativeSet: function(name, fct) {
		return this.item(null, {
			callback: fct,
			charact: 'native',
			name: name,
			acNdx: '['+name+']',
			expressionHTML: function() { return '<span class="global">'+this.name+'</span>'; },
			expressionString: function() { return this.name; }
		}, nul.behav.nativeSet);
	}
};
nul.build.htmlPlace.expressed = [];
nul.build.dataTable.expressed = [];
