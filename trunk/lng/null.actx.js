/*  NUL language JavaScript framework
 *  (c) 2009 François Marie De Mey
 *
 * NUL is freely distributable under the terms of GNU GPLv3 license.
 *  For details, see the NUL project site : http://code.google.com/p/nul/
 *
 *--------------------------------------------------------------------------*/
 
nul.actx = {
	tblHTML: function(tbl, glue) {
		if(isArray(tbl)) return map(tbl, function(c) {
			return c.toHTML();
		}).join(glue || ' and ');
		return tbl.toHTML();
	},
	js: {
		tilement: '',
		tilePos: 0,
		tiled: function() {
			var rv = this.tilement;
			this.tilement = '';
			this.tilePos = 0;
			return rv;
		},
		tile: function(knd, cnt, ttl) {
			var aCnt = '';
			if(isArray(ttl)) {
				for(var i=0; i<ttl.length; ++i) aCnt +=
					'<div class="'+ttl[i].toLowerCase()+'"></div>'
				ttl = null;
			}
			if(!ttl) ttl = cnt;
			this.tilement += '<a class="'+knd+'" '+
				'title="'+ttl+'" '+
				'onmouseover="nul.actx.js.enter(this.parentNode, \''+knd+'\');" '+
				//'onmouseout="nul.actx.js.leave(\''+this.divs+'\');" '+
				'style="left: '+((this.tilePos++)*5)+'px;" '+
				'>'+aCnt+'</a>' ;
			return '<div class="'+knd+'" '+
				'onmouseout="nul.actx.js.leave();" '+
				'onmouseover="nul.actx.js.keepIn();" '+
				'style="display: none;" '+
				'>'+ cnt + '</div>';
		},
		keepIn: function() {
			if(this.keepTimeOut) {
				window.clearTimeout(this.keepTimeOut);
				delete this.keepTimeOut;
			}
		},
		enter: function(elm, knd) {
			if(this.entered && elm == this.entered[0] && knd == this.entered[1]) return;
			if(this.entered) this.leave();
			this.entered = [elm, knd];
			elm.addClassName('lined');
			elm.getElementsBySelector('a.'+knd).each(Element.hide);
			elm.getElementsBySelector('div.'+knd).each(Element.show);
			elm.getElementsBySelector('span a.'+knd).each(Element.show);
			elm.getElementsBySelector('span div.'+knd).each(Element.hide);
			//this.keepTimeOut = window.setTimeout('nul.actx.js.leave();',100);
		},
		leave: function(elm, knd) {
			if(!this.entered) return;
			elm = this.entered[0];
			knd = this.entered[1];
			delete this.entered;
			elm.removeClassName('lined');
			elm.getElementsBySelector('a.'+knd).each(Element.show);
			elm.getElementsBySelector('div.'+knd).each(Element.hide);
		}
	},
	isC: function(actx, charact) {
		return actx.charact && charact == actx.charact;	
	},
	expressionHTML: function(oprtr, oprnds) {
		var strings = [];
		for(var i=0; i<oprnds.length; ++i)
			strings.push(oprnds[i].toHTML());
		return strings.join(' '+oprtr+' ');
	},
	toString: function(oprtr, oprnds) {
		var strings = [];
		for(var i=0; i<oprnds.length; ++i)
			strings.push(oprnds[i].toString());
		return '('+strings.join(' '+oprtr+' ')+')';
	},

	std: {
		item: function(itm, ops) {
			if(!itm.attributes) itm.attributes = {};
			if(!itm.locals) itm.locals = [];
			itm.toHTML = function() {
				var aLocals = '', aDeps = '', aDepsTtl = '', aShort = this.toString(),
					aFlags, aAttr = '', aAttrTtl = '';
				aShort = nul.actx.js.tile('shortStr', this.toString(), 
					(('undefined'!= typeof this.locals.lvl)?(this.locals.lvl+'] '):'')+this.toString());
				aFlags = nul.actx.js.tile('flags',
					is_empty(this.flags)?'&phi;':keys(this.flags).join(', '),
					keys(this.flags));
				if(this.deps && !is_empty(this.deps)) {
					for(var i in this.deps) {
						var ds = [];
						for(var j in this.deps[i])
							ds.push(j+':'+this.deps[i][j]);
						aDeps += '<tr><th>'+i+'</th><td>'+ds.join('</td><td>')+'</td></tr>';
						aDepsTtl += i+'['+ds.join(',')+']';
					}
					aDeps = nul.actx.js.tile('dependances', '<table>'+aDeps+'</table>', aDepsTtl);
				}
				if((0<this.locals.length) || (this.deps && this.deps[0])) {
					aLocals = [];
					if(this.deps && this.deps[0] && this.deps[0][nul.lcl.slf])
						aLocals.push(nul.lcl.slf);
					for(var i=0; i<this.locals.length; ++i)
						if(this.locals[i])
							aLocals.push(this.locals[i]);
					if(0<aLocals.length) aLocals = nul.actx.js.tile('locals', aLocals.join(', '));
					else aLocals = '';
				}
				if(!is_empty(this.attributes)) {
					aAttrTtl = [];
					aAttr = [];
					for(var i in this.attributes) {
						aAttr.push('<b>'+i+'</b>&nbsp;'+this.attributes[i].toString());
						aAttrTtl.push(i);
					}
					aAttr = nul.actx.js.tile('attributes', aAttr.join('<hr />'), aAttrTtl.join(','));
				}
				var str = aShort+aLocals+aDeps+aFlags+aAttr+nul.actx.js.tiled();
				if('undefined'!= typeof this.locals.lvl)
					str += '<div class="shortStr level" style="display: none;" >' +
						this.locals.lvl + '</div>';
				var es = this.expressionHTML();
				var brn = ('<ul'== es.substr(0,3) || '<table'== es.substr(0,6)) ? 'div' : 'span';
				str += es;
				return 'span'==brn?('<span class="xpr">'+str+'</span>'):str;
			}.perform('nul.actx.std.item->toHTML');
			
			for(var i in nul.ctxd.itf) if(!itm[i]) itm[i] = nul.ctxd.itf[i];
			itm.modify(ops);
			itm.summarised(true);
			return itm;
		}.perform('nul.actx.std.item'),
		listOp: function(itm, chrct, ops, strC) {
			if(!strC) strC = chrct;
			itm.charact = chrct;
			if(typeof(strC) == 'string') {
				itm.expressionHTML = function() {
					return nul.actx.expressionHTML(
						'<span class="op">'+strC+'</span>', this.components);
					};
				itm.toString = function() {
					return nul.actx.toString(strC, this.components);
					};
			} else {
				itm.expressionHTML = strC[0];
				itm.toString = strC[1];
			}
			return nul.actx.std.item(itm, ops);
		}.perform('nul.actx.std.listOp'),
		ceded: function(itm, chrct, oprnd, strC) {
			itm.charact = chrct;
			itm.expressionHTML = strC[0];
			itm.toString = strC[1];
			return nul.actx.std.item(itm, [oprnd]);
		}.perform('nul.actx.std.ceded'),
		prec: function(itm, chrct, oprnd, strC) {
			if(!strC) strC = chrct;
			return nul.actx.std.ceded(itm, chrct, oprnd, typeof(strC) == 'string' ?
				[function() { return '<span class="op">'+strC+'</span>'+this.components[0].toHTML(); },
				function() { return strC+this.components[0].toString(); }] : strC);
		}.perform('nul.actx.std.prec'),
		post: function(itm, chrct, oprnd, strC) {
			if(!strC) strC = chrct;
			return nul.actx.std.ceded(itm, chrct, oprnd, typeof(strC) == 'string' ?
				[function() { return this.components[0].toHTML()+'<span class="op">'+strC+'</span>'; },
				function() { return this.components[0].toString()+strC; }] : strC);
		}.perform('nul.actx.std.post'),
		srndd: function(itm, chrct, oprnd, strCA, strCZ) {
			if(!strCA) strCA = strCZ = chrct;
			return nul.actx.std.ceded(itm, chrct, oprnd, typeof(strCA) == 'string' ?
				[function() { return '<span class="op">'+strCA+'</span>'+this.components[0].toHTML()+'<span class="op">'+strCZ+'</span>'; },
				function() { return strCA+this.components[0].toString()+strCZ; }] : strCA);
		}.perform('nul.actx.std.srndd'),
		nmdOp: function(itm, chrct, ops, strC) {
			if(!strC) strC = chrct;

			itm.charact = chrct;
			if(typeof(strC) == 'string') { 
				itm.expressionHTML = function() { 
					var comps = [];
					for(nm in this.components) comps.push(this.components[nm]);
					return nul.actx.expressionHTML('<span class="op">'+strC+'</span>', comps);
				};
				itm.toString = function() { 
					var comps = [];
					for(nm in this.components) comps.push(this.components[nm]);
					return nul.actx.toString(strC, comps);
				};
			} else {
				itm.expressionHTML = strC[0];
				itm.toString = strC[1];
			}
			return nul.actx.std.item(itm, ops);
		}.perform('nul.actx.std.nmdOp'),
	},

	html_place: function(htmlElement) {
		return nul.actx.std.item({
			charact: '<html>',
			element: htmlElement,
			take: function() {},
			extract: function() {
				return nul.actx.list(nul.html(this.element.innerHTML));
			},
			append: function(itm) {
				if(itm.toXML) {
					this.element.innerHTML += itm.toXML();
					return itm.components.parms;
				}
				if(itm.value) {
					this.element.innerHTML += itm.value;
					return nul.actx.atom('#text');
				}
				throw nul.semanticException('XML element expected for appending');
			},
			expressionHTML: function() {
				return '&lt;Element&gt;';
			}
		});
	},

	atom: function(value) {
		return nul.actx.std.item({
			value: value,
			expressionHTML: 'string'==typeof(value)?
				function() { return escapeHTML('"'+this.value+'"'); }:
				function() { return ''+this.value; },
			toString: 'string'==typeof(value)?
				function() { return '"'+this.value+'"'; }:
				function() { return ''+this.value; },
			browse: function(behav) { return nul.ctxd.flatBrowse(behav, this, 'atom'); }
		});
	},
	local: function(ctxDelta, lindx, dbgName) {
		return nul.actx.std.item({
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
			browse: function(behav) { return nul.ctxd.flatBrowse(behav, this, 'local'); }
		});
	},
		
	application: function(obj, apl) {
		return nul.actx.std.nmdOp({
			evaluation:nul.eval.application
		},'[-]', {object: obj, applied: apl},[
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
			nul.actx.std.srndd({
				evaluation:nul.eval.set,
				take: function(apl, kb, lcls) {
					var rcr = nul.actx.local(1, nul.lcl.rcr);
					var unf = this.components[0];
					var tlcls = clone1(this.locals);
					//TODO: remplacer rcr AVANT unification ?
					var rv = kb.knowing([this, apl], function(kb) {
						var rv = nul.unify.sub1(unf, apl, kb);
						//if(rv) rv = rv.stpUp(tlcls, kb).clean();
						//return rv.rDevelop(rcr, 0) || rv;
						return (rv.rDevelop(rcr, 1) || rv).stpUp(tlcls, kb).clean();
					}).stpUp(lcls, kb).clean();
					if(!nul.actx.isC(rv,':-') || nul.actx.isC(apl,':-')) return rv;
					return rv.components.value.levelise(this).stpUp(lcls, kb);
				}.perform('nul.actx.set->take'),
				extract: function() {
					//TODO: remember extraction and use it instead from now on
					return nul.actx.list(this.components[0].solve());
				}.perform('nul.actx.set->extract')
			},'{}', content,'{','}')
		:
			nul.actx.std.item({
				charact: '{}',
				expressionHTML: function() { return '&phi;'; },
				toString: function() { return '&phi;'; },
				take: function() { nul.fail('Taking from empty set.'); }
			});
	},
	seAppend: function(dst, itms) {
		return nul.actx.std.nmdOp({
			extract: function() {
				if(!this.components.effected.append)
					throw nul.semanticException('Expected appendable : ',
						this.components.effected.toString());
				return this.components.effected.append(this.components.appended).levelise(this);
			}			
		},'<<=', { effected: dst, appended: itms }, '&lt;&lt;=');
	},
	lambda: function(parms, value) {
		/*
(a :- b) :- c  <==> a :- (b = c)
(x :- y) = z   <==> (x = z) :- y
(x :- y) = (i :- j) <==> (x = (i :- j)) :- y <==> ((x = i) :- j) :- y <==> (x = i) :- (y = j)
a :- (b :- c) =  x :- y   <==> a=x :- (b=y :- c)
		 */
		return nul.actx.std.nmdOp({},':-', { parms: parms, value: value }, '&lArr;');
	},
	cumulExpr: function(oprtr, oprnds) {
		return nul.actx.std.listOp({evaluation:nul.eval.cumulExpr},oprtr, oprnds, mathSymbol(oprtr));
	},
	biExpr: function(oprtr, oprnds) {
		return nul.actx.std.listOp({evaluation:nul.eval.biExpr},oprtr, oprnds, mathSymbol(oprtr));
	},
	list: function(oprnds) {
		//TODO: Les valeurs floues donnent lieu à une variable déclarée en ctxDelta=0
		// D'où la liste est candidate à être utilisée comme contextualisation
		return nul.actx.std.listOp({
			take: function(apl, kb, lcls) {
				var cs = this.components;
				var rv = kb.knowing([this, apl], function(kb) {
					var rv = nul.unify.orDist(cs, lcls, apl, kb);
					return rv.levelise(apl);				
				});
				return rv?rv.stpUp(lcls, kb):rv;	//TODO: vérifier que les <lcls> doivent bien être repassés			
			}.perform('nul.actx.list->take')
		},',', oprnds);
	},
	preceded: function(oprtr, oprnd) {
		return nul.actx.std.prec({evaluation:nul.eval.preceded},oprtr, oprnd);
	},
	assert: function(oprnd) {
		return nul.actx.std.prec({evaluation:nul.eval.assert},'?', oprnd, '?');
	},
	extraction: function(oprnd) {
		return nul.actx.std.post({
			extract: function() {},	//Must avoid sub-expr extraction
			evaluation:nul.eval.extraction
		},' !', oprnd, '!');
	},
	unification: function(ops) {
		return nul.actx.std.listOp({evaluation:nul.eval.unification},'=', ops);
	},
	and3: function(ops) {
		return nul.actx.std.listOp({evaluation:nul.eval.and3},';', ops);
	},
	or3: function(ops) {
		return nul.actx.std.listOp({
			evaluation:nul.eval.or3,
			isFailable: function() {
				for(var i=0; i<this.components.length; ++i)
					if(!this.components[i].flags.failable) return false;
				return true;
			}
		},'[]', ops, '&#9633;');
	},
	xor3: function(ops) {
		return nul.actx.std.listOp({
			evaluation:nul.eval.xor3,
			isFailable: function() {
				return this.components[this.components.length-1].flags.failable;
			}
		},':', ops);
	},
	xml: function(node, attrs, content) {
		var rv = nul.actx.lambda(
				nul.actx.atom(node),
				nul.actx.list(content)
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
		return applied;
	},
	definition: function(lcl, val) {
		val.locals.unshift(lcl);
		return val;
	},
	nativeFunction: function(name, fct, dom, img) {
		return nul.actx.std.item({
			callback: fct,
			charact: 'native',
			name: name,
			expressionHTML: function() { return '<span class="global">'+this.name+'</span>'; },
			toString: function() { return this.name; },
			take: function(apl, kb, lcls) {
				var tnf = this;
				var rv = kb.knowing([this, apl], function(kb) {
					var rv = tnf.callback(apl, kb);
					if(!rv) return;
					return rv.numerise(tnf).stpUp(clone1(tnf.locals), kb);
				});
				if(rv) return rv.stpUp(lcls, kb);
			}.perform('nul.actx.nativeFunction->take')
		});
	},
	objectivity: function(obj, itm) {
		return nul.actx.std.nmdOp({
			evaluation:nul.eval.objectivity
		},'->', {object: obj, item: itm}, '&rarr;');
	}
};