/*  NUL language JavaScript framework
 *  (c) 2009 François Marie De Mey
 *
 * NUL is freely distributable under the terms of GNU GPLv3 license.
 *  For details, see the NUL project site : http://code.google.com/p/nul/
 *
 *--------------------------------------------------------------------------*/

nul.build = function(on, kb) {
	var sf, lcls
	if(!on)				{ sf = null;	lcls = [];			}
	else if(on.locals)	{ sf = on;		lcls = on.locals;	}
	else				{ sf = null;	lcls = on;			}
	return {
		standFor: sf,
		locals: lcls,
		kb: kb,
		item: function(ops) {
			var itm = {};
			for(var i=1; i<arguments.length; ++i) map(arguments[i], function(o, i) { itm[i] = o; })
			if(!itm.attributes) itm.attributes = {};
			for(var i in nul.xpr) if(!itm[i]) itm[i] = nul.xpr[i];

			itm.locals = this.locals;
			if(this.sf) itm.addAttrs(this.kb, this.sf);
			itm = itm.modify(ops);
			itm.summarised(true);
			return itm;
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
					return nul.text.toString(strC, this.components);
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
		srndd: function(itm, chrct, oprnd, strCA, strCZ) {
			if(!strCA) strCA = strCZ = chrct;
			return this.ceded(itm, chrct, oprnd, typeof(strCA) == 'string' ?
				[function() { return '<span class="op">'+strCA+'</span>'+this.components[0].toHTML()+'<span class="op">'+strCZ+'</span>'; },
				function() { return strCA+this.components[0].toString()+strCZ; }] : strCA);
		}.perform('nul.build->srndd'),
		nmdOp: function(itm, chrct, ops, strC) {
			if(!strC) strC = chrct;

			itm.charact = chrct;
			if(typeof(strC) == 'string') { 
				itm.expressionHTML = function() { 
					var comps = [];
					for(nm in this.components) comps.push(this.components[nm]);
					return nul.text.expressionHTML('<span class="op">'+strC+'</span>', comps);
				};
				itm.toString = function() { 
					var comps = [];
					for(nm in this.components) comps.push(this.components[nm]);
					return nul.text.toString(strC, comps);
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
				expressionHTML: function() {
					return '&lt;Element&gt;';
				}
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
				nul.behav.application,'[-]', {object: obj, applied: apl},[
				function() { 
					return this.components.object.toHTML() +
						'<span class="op">[</span>' +
						this.components.applied.toHTML() +
						'<span class="op">]</span>'; 
				},function() { 
					return this.components.object.toString() +'['+
						this.components.applied.toString() +']'; 
				}] );
		},
		set: function(content) {
			return content?
				this.srndd(nul.behav.set,'{}', content,'{','}')
			:
				this.item(null, {
					charact: '{}',
					expressionHTML: function() { return '&phi;'; },
					toString: function() { return '&phi;'; },
					take: function() { nul.fail('Taking from empty set.'); }
				});
		},
		seAppend: function(dst, itms) {
			return this.nmdOp(nul.behav.seAppend,'<<=', { effected: dst, appended: itms }, '&lt;&lt;=');
		},
		lambda: function(parms, value) {
			/*
	(a :- b) :- c  <==> a :- (b = c)
	(x :- y) = z   <==> (x = z) :- y
	(x :- y) = (i :- j) <==> (x = (i :- j)) :- y <==> ((x = i) :- j) :- y <==> (x = i) :- (y = j)
	a :- (b :- c) =  x :- y   <==> a=x :- (b=y :- c)
			 */
			return this.nmdOp({},':-', { parms: parms, value: value }, '&lArr;');
		},
		cumulExpr: function(oprtr, oprnds) {
			return this.listOp(nul.behav.cumulExpr,oprtr, oprnds, mathSymbol(oprtr));
		},
		biExpr: function(oprtr, oprnds) {
			return this.listOp(nul.behav.biExpr,oprtr, oprnds, mathSymbol(oprtr));
		},
		list: function(oprnds) {
			//TODO: Les valeurs floues donnent lieu à une variable déclarée en ctxDelta=0
			// D'où la liste est candidate à être utilisée comme contextualisation
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
		unification: function(ops) {
			return this.listOp(nul.behav.unification,'=', ops);
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
					nul.build().atom(node),
					nul.build().list(content)
				);
			rv.attributes = attrs;
			rv.toXML = function() {
				var opn = '<' + this.components.parms.value;
				for(var a in this.attributes) opn += ' ' + a + '=' + this.attributes[a].toHTML();
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
	
		prototype: function(applied, name, value) {
			applied.attributes[name] = value;
			return applied.summarised(true);
		},
		defined: function(lcl) {
			this.locals.unshift(lcl);
			return this;
		},
		nativeFunction: function(name, fct, dom, img) {
			return this.item(null, {
				callback: fct,
				charact: 'native',
				name: name,
				expressionHTML: function() { return '<span class="global">'+this.name+'</span>'; },
				toString: function() { return this.name; }
			}, nul.behav.nativeFunction);
		},
		objectivity: function(obj, itm) {
			return this.nmdOp(nul.behav.objectivity,'->', {object: obj, item: itm}, '&rarr;');
		}
	};
};