/*  NUL language JavaScript framework
 *  (c) 2009 François Marie De Mey
 *
 * NUL is freely distributable under the terms of GNU GPLv3 license.
 *  For details, see the NUL project site : http://code.google.com/p/nul/
 *
 *--------------------------------------------------------------------------*/

nul.build = {
	freeval: function(value, premices) {
		var rv = premices || [];
		if(value) rv[''] = value;
		return rv;
	},
	item: function(ops) {
		var itm = clone1(nul.xpr);
		for(var i=1; i<arguments.length; ++i) merge(itm,arguments[i]);

		if(ops) {
			itm.components = isArray(ops)?[]:{};
			itm = itm.compose(ops);
		}
		if('string'== typeof itm.x) {
			var tmp = itm.x;
			delete itm.x;
			itm.xadd(tmp);
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
			x: typeof value,
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
	definition: function(value, premices, locals, ctxName) {
		if(!value) return this.item(null, {
			x: 'set',
			charact: '{}',
			expressionHTML: function() { return '&phi;'; },
			expressionString: function() { return '&phi;'; },
			take: function(apl) { nul.fail('Taking from empty set : ' + apl.dbgHTML()); }
		});
		return this.item(
			this.freeval(value, premices),
			nul.behav.definition,
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
		return this.listOp(nul.behav.cumulExpr,oprtr, oprnds);
	},
    biExpr: function(oprtr, oprnds) {
            return this.listOp(nul.behav.biExpr, oprtr, oprnds, {'<':'&lt;','>':'&gt;'}[oprtr]);
    },
    order: function(oprnds) {
            return this.listOp(nul.behav.order, '<', oprnds, '&lt;');
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
	extraction: function(oprnd) {
		return this.post(nul.behav.extraction,' !', oprnd, '!');
	},
	unification: function(ops) {
		return this.listOp(nul.behav.unification, '=', ops);
	},
	lambda: function(parms, value) {
		return this.nmdOp(nul.behav.lambda, ':-', {handle:parms, value:value}, '&rArr;');
	},
	handle: function(handler, handled) {
		return this.nmdOp(nul.behav.handle, ':=', {handler:handler, handled:handled}, '&lArr;');
	},
	ior3: function(ops) {
		//TODO! Gather common knowledge (about types too) in parent's !
		return this.listOp(merge(nul.behav.ior3, nul.behav.kwFreedomHolder), '[]', ops, '&#9633;');
	},
	xor3: function(ops) {
		return this.listOp(merge(nul.behav.xor3, nul.behav.kwFreedomHolder),':', ops);
	},
	xml: function(node, attrs, content) {
		/*var rv = this.lambda(
				nul.build.atom(node),
				nul.build.list(content)
			);
		rv.xadd(attrs, 'overwrite');
		rv.toXML = function() {
			var tag = this.handle().value;
			if(!tag || 'string'!= typeof tag) throw nul.semanticException('"'+tag.toString()+'" should be a computed string')
			var opn = '<' + tag;
			for(var a in thisthis.components) if('#'!= a)
				opn += ' ' + a + '=' + this.components[a].toString();
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
		return rv;*/
	},

	object: function(cs) {
		return this.nmdOp(nul.behav.object, '[.]', cs||{}, [
			function() {
				var rv = '';
				for(var i in this.components) rv +=
					'<tr><th>'+i+'</th><td>'+this.components[i].toHTML()+'</td></tr>';
				if(isEmpty(this.components)) rv = '<tr><td>&nbsp;</td></tr>';
				return '<table class="object">'+rv+'</table>';
			},
			function() { 
				var rv = '';
				for(var i in this.components) rv +=
					'::'+i+' '+this.components[i].toString()+' ';
				if(isEmpty(this.components)) rv = '[Object]';
				return '('+rv+')';
			}]
		);
	},
	composed: function(applied, name, value) {
		if(nul.debug.assert) assert('[.]'== applied.charact, 'Only compose objects');
		applied.components[name] = value;
		return applied.summarised();
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
	},
	nativeFunction: function(name, fct) {
		return this.item(null, {
				callback: fct,
				charact: 'native',
				name: name,
				acNdx: '['+name+']',
				expressionHTML: function() { return '<span class="global">'+this.name+'</span>'; },
				expressionString: function() { return this.name; }
			}, nul.behav.nativeFunction);		
	}
};
nul.build.htmlPlace.expressed = [];
nul.build.dataTable.expressed = [];

