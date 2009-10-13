/*  NUL language JavaScript framework
 *  (c) 2009 E-med Ware
 *
 * NUL is freely distributable under the terms of GNU GPLv3 license.
 *  For details, see the NUL project site : http://code.google.com/p/nul/
 *
 *--------------------------------------------------------------------------*/

var nul = {
	failure: 'failure',
	/**
	 * Throw a failure
	 * @param reason items to shape a sentence
	 */
	fail: function(reason) {
		nul.debug.log('fail')('Failure', beArrg(arguments));
		throw nul.failure;
	},
	/**
	 * Catch only failure.
	 */
	failed: function(err) {
		if(nul.failure!= err) throw nul.exception.notice(err);
	},
	globals: {},
	slf: '&crarr;',
	
    isJsInt: function(n) {
    	return n== Math.floor(n);
    },
	globalsUse: function(srName) {
		var ub = new nul.understanding.base.set(null, srName, 'g');
		for(var p in nul.globals) 
			ub.createFreedom(p, nul.globals[p]);
		return ub;
	},
	read: function(txt)
	{
		nul.execution.reset();
		return nul.execution.benchmark.measure('*reading',function(){
			return nul.globalsUse().understand(nul.compile(txt));
		});
	},
	html: function(txt)
	{
		nul.erroneus = false;
		var comps = nul.compiler(txt+' </').innerXML();
		for(var i=0; i<comps.length; ++i)
			comps[i] = nul.globalsUse().understand(comps[i]);
		return comps;
	},

	/**
	 * Weither the string opt appear in the url parameters
	 */
	urlOption: function(opt) {
		var srch = window.location.href.split('?')[1];
		if(!srch) return;
		return 0<=('&'+srch+'&').indexOf('&'+opt+'&');
	},
};
/*  NUL language JavaScript framework
 *  (c) 2009 E-med Ware
 *
 * NUL is freely distributable under the terms of GNU GPLv3 license.
 *  For details, see the NUL project site : http://code.google.com/p/nul/
 *
 *--------------------------------------------------------------------------*/
 
function tableStack(nm, tbl) {
	return {
		nm: nm,
		table: tbl,
		buffer: document.createElement('tbody'),
		getRowValue: function(tr) {
			var rv = [];
			for(var i=0; i<tr.cells.length; ++i) rv.push(tr.cells[i].innerHTML);
			return rv;
		},
		setRowValue: function(tr, rv) {
			this.dirty = true;
			tr.innerHTML = '';
			for(var i=0; i<rv.length; ++i ) {
				var cl = tr.insertCell(-1);
				cl.setAttribute('class',this.nm + ' c' + i);
				cl.innerHTML = rv[i];
			}
			return $(tr);
		},
		value: function() {
			var rv = [];
			for(var i=this.buffer.rows.length-1; i>=0; --i)
				rv.push(this.getRowValue(this.buffer.rows[i]));
			return rv;
		},
		length: function() {
			return this.buffer.rows.length;
		},
		clear: function() {
			this.dirty = true;
			while(this.buffer.rows.length) this.pop();
			this.apply();		
		},
		draw: function(cs) {
			this.dirty = true;
			this.clear();
			for(var i=0; i<cs.length; ++i) this.push(cs[i]);
			this.apply();
		},
		push: function(v) {
			this.dirty = true;
			return this.setRowValue(this.buffer.insertRow(0), beArrg(arguments))
		},
		log: function(v) {
			this.dirty = true;
			return this.setRowValue(this.buffer.insertRow(-1), beArrg(arguments))
		},
		unlog: function() {
			this.dirty = true;
			var p = this.buffer.rows.length-1;
			var rv = this.getRowValue(this.buffer.rows[p]);
			this.buffer.deleteRow(p);
			return rv;
		},
		pop: function() {
			this.dirty = true;
			var rv = this.getRowValue(this.buffer.rows[0]);
			this.buffer.deleteRow(0);
			return rv;
		},
		item: function(ndx) {
			if(!ndx) ndx = 0;
			return {
				ts: this,
				tr: this.buffer.rows[ndx],
				set: function(rv) {
					this.ts.dirty = true;
					this.ts.setRowValue(this.tr, beArrg(arguments));
				},
				get: function() {
					return this.ts.getRowValue(this.tr);
				}
			};
		},
		apply: function() {
			if(this.dirty && this.table) {
				this.dirty = false;
				this.table.innerHTML = this.buffer.innerHTML;
			}
		}
	};
}

nul.debug = {
	callStack: tableStack('callStack'),
	logs: tableStack('logs'),
	logging: false,
	watches: false,
	assert: nul.urlOption('debug'),
	perf: !nul.urlOption('noperf'),
	acts: nul.urlOption('actLog'),
	lcLimit: 1000,
	logCount: function() {
		if(0< nul.debug.lcLimit && nul.debug.lcNextLimit< nul.debug.lc) {
			nul.debug.warnRecursion();
			nul.debug.lcNextLimit += nul.debug.lcLimit;
		}
		return nul.debug.lc++;
	},
	toLogText: function(v) {
		if(isArray(v)) {
			var rv = [];
			for(var i=0; i<v.length; ++i) rv.push(nul.debug.toLogText(v[i]));
			return rv.join(' ');
		}
		if(v.dbgHtml) return v.dbgHtml();
		return v.toFlat?v.toFlat():v.toString();
	},
	log: function(tp) {
		return nul.debug.logging && nul.debug.logging[tp] ? function(v) {
			v = beArrg(arguments);
			for(var vi = 0; vi<v.length; ++vi) v[vi] = nul.debug.toLogText(v[vi]);
			v.unshift(nul.debug.logCount());
			return nul.debug.logs.log(v).addClassName(tp+' log');
		} : nul.debug.logCount;
	},
	warnRecursion: function(v)
	{
		if(nul.erroneus) return;
		if(v) nul.debug.watch(v);
		nul.debug.applyTables();
		if(!confirm('Keep on recursion?')) throw nul.internalException('Broken by debugger');
	},
	watch: function(v)
	{
		wtc.innerHTML = v.toHtml();
	},
	reset: function() {
		nul.debug.logs.clear();
		nul.debug.callStack.clear();
		nul.debug.lc = 0;
		nul.debug.lcs = nul.txt.clpsSstm(this.logs.table, 'dn',
			function() { return nul.debug.logs.buffer.rows.length; });
		nul.debug.lcNextLimit = nul.debug.lcLimit;
	},
	
	applyTables: function() {
		if(nul.debug.logging) nul.debug.logs.apply();
		if(nul.debug.watches) nul.debug.callStack.apply();
	},
	ctxTable: function(ctx) {
		var rv = '';
		for(var i=0; i<ctx.length; ++i)
			rv += '<tr><th>'+i+'</th><td>'+ctx.lvals[i].dbgHtml()+'</td></tr>';
		return ['', '<table class="context">'+rv+'</table>'];
	},
	described: function(name, dscr) {
		var ftc = this.perform(name);
		return function() {
			var cargs = arrg(arguments);
			var d, abrt = false, lgd = false, rv;
			try {
				d = dscr.apply(this, cargs);
				nul.debug.log(name)(nul.debug.lcs.collapser(name+' begin'),d);
				lgd = true;
				rv = ftc.apply(this, cargs);
				return rv;
			} catch(err) { abrt = true; nul.exception.notice(err); throw err;
			} finally {
				if(lgd) nul.debug.log(name)(
					nul.debug.lcs.endCollapser(
						name+' '+ (abrt?'abort':'end'),
						name+' '+ (abrt?'failed':'done')),
					rv?[rv]:['nothing'], d);
			}
		};
	},
	asserted: function(str, obj) {
		var ok = true;
		if(nul.debug.assert) ok = this.apply(obj);
		assert(ok, str);
	},
	contract: function(str) {
		if(!nul.debug.assert) return function() {};
		var ftc = this;
		return function() {
			assert(ftc.apply(this), str);
		};
	},
	/**
	 * Assert this object has a member (use a member which name defines the class)
	 * @param {string} elm The member to test
	 * @return nothing
	 * @throws assertException
	 */
	is: function(elm) {
		return function(obj) {
			if(nul.debug.assert) assert(obj && obj[elm], 'Expected '+elm);
			return obj;
		}; 
	},
	/**
	 * Assert these objects has a member (use a member which name defines the class)
	 * @param {string} elm The member to test
	 * @return nothing
	 * @throws assertException
	 */
	are: function(elm) {
		return function(objs) {
			if(nul.debug.assert) map(objs, function(i, o) { assert(o && o[elm], 'Expected '+elm + 's'); });
			return objs;
		}; 
	},
};

if(nul.debug.acts) Function.prototype.describe = nul.debug.described;
else Function.prototype.describe = function(name) { return this.perform(name); };

Function.prototype.contract = nul.debug.contract;
if(nul.debug.assert) Function.prototype.asserted = nul.debug.asserted;
else Function.prototype.asserted = function() {};

function assert(cnd, str) {
	if(!cnd)
		throw nul.internalException('Assertion failed : '+str);
}

//Shortcuts to write in the firebug 'watch' box
function nw(v) { nul.debug.watch(v); return 'drawn'; }
function dat() { nul.debug.applyTables(); return 'drawn'; }
/*  NUL language JavaScript framework
 *  (c) 2009 E-med Ware
 *
 * NUL is freely distributable under the terms of GNU GPLv3 license.
 *  For details, see the NUL project site : http://code.google.com/p/nul/
 *
 *--------------------------------------------------------------------------*/
 
nul.exception = function(type, code, msg, chrct)
{
	var err = { nul: true, type: type, message: msg,
		code: code,
		callStack: nul.debug.watches? nul.debug.callStack.value():null,
		chrct: chrct };
	if(!nul.erroneus) nul.erroneus = err;
	else nul.erroneus.follow = err;
	nul.debug.log('error')('Error: '+type, msg);
	return nul.erroneus;
};

nul.exception.notice = function(err)
{
	if(err.fileName && err.stack && !nul.erroneus) {
		nul.internalException('Javascript error : '+err.message);
		nul.erroneusJS = err;
	}
	return err;
};

nul.semanticException = function(code, msg, chrct)
{
	return nul.exception('semantic', 'SEM'+code, msg, chrct);
};
nul.syntaxException = function(code, msg, chrct)
{
	return nul.exception('syntax', 'SYN'+code, msg, chrct);
};
nul.internalException = function(msg, chrct)
{
	return nul.exception('internal', 'INT', msg, chrct);
};
/*  NUL language JavaScript framework
 *  (c) 2009 E-med Ware
 *
 * NUL is freely distributable under the terms of GNU GPLv3 license.
 *  For details, see the NUL project site : http://code.google.com/p/nul/
 *
 *--------------------------------------------------------------------------*/
 
nul.execution = {
	reset: function()
	{
		nul.erroneus = false;
		//namespaces
		nul.xpr.knowledge.nameSpace = 0;
		nul.browser.cached.nameSpace = 0;
		
		nul.debug.reset();
		nul.execution.benchmark.reset();
	},
	benchmark: {
		stack: [],
		computed: {},
		measure: function(nm, cb) {
			this.cstart(nm);
			try { return cb(); }
			finally { this.cstop(nm); }
		},
		cstart: function(nm) {
			if(!this.computed[nm]) this.computed[nm] = 0;
			this.computed[nm] -= this.timeStamp(); 
		},
		cstop: function(nm) {
			this.computed[nm] += this.timeStamp();
		},
		timeStamp: function() {
			var d = new Date();
			return d.getTime(); 
		},
		enter: function(nm) {
			if(0<this.stack.length) this.cstop(this.stack[0]);
			this.stack.unshift(nm);
			this.cstart(nm);
		},
		leave: function(nm) {
			if(nul.debug.assert) assert(nm == this.stack[0], 'benchmark stack coherence');
			this.cstop(this.stack[0]);
			this.stack.shift();
			if(0<this.stack.length) this.cstart(this.stack[0]);			
		},
		reset: function() {
			this.computed = {};
			this.stack = [];
		},
		draw: function(tbd) {
			while(0< tbd.rows.length) tbd.deleteRow(0);
			var cs = [];
			for(var c in this.computed) cs.push([c, this.computed[c]]);
			cs.sort(function(a, b){ return b[1]-a[1]; });
			for(var i=0; i<cs.length && i < 7; ++i) {
				var rw = tbd.insertRow(-1);
				rw.insertCell(0).innerHTML = cs[i][0];
				rw.insertCell(1).innerHTML = cs[i][1];
			}
		}
	}
};

if(nul.urlOption('noperf'))
	Function.prototype.perform = function(name) { return this; };
else
	Function.prototype.perform = function(name) {
		var ftc = this;
		return function() {
			var cargs = arrg(arguments);
			var obj = this;
			if('function'== typeof name) name = name.apply(obj, cargs);
			nul.execution.benchmark.enter(name);
			try { return ftc.apply(obj, cargs); }
			finally { nul.execution.benchmark.leave(name); }
		};
	};/*  NUL language JavaScript framework
 *  (c) 2009 E-med Ware
 *
 * NUL is freely distributable under the terms of GNU GPLv3 license.
 *  For details, see the NUL project site : http://code.google.com/p/nul/
 *
 *--------------------------------------------------------------------------*/
 
/**
 * Gets weither this object is an array [] and not an object {}
 */
function isArray(itm) {
	return itm &&
		typeof(itm) == 'object' &&
		typeof itm.length === 'number' &&
		typeof itm.splice === 'function';
}

var cloneStack = [];
/**
 * Duplicate <myObj> and its components
 */
function clone(myObj) {
	if(null== myObj || typeof(myObj) != 'object' || myObj.ownerDocument) return myObj;
	if(nul.debug.assert) assert(!cloneStack.contains(myObj), 'Clone not re-entrant'); 
	cloneStack.push(myObj);
	try { return map(myObj, function(i, o) { return clone(o); }); }
	finally { cloneStack.pop(myObj); }
}

/**
 * Duplicate <myObj> ut components are just references
 */
function clone1(myObj) {
	if(null== myObj || typeof(myObj) != 'object') return myObj;
	return map(myObj, function(i,o) { return o; });
}

/**
 * Gets weither <ndx> is a custom index of <ass>
 * Returns false for all the default properties of the arrays.
 */
function cstmNdx(ndx, ass) {
	return ''!== ndx && 
		((ass && (!isArray(ass) || ass[ndx]!= [][ndx])) || 'undefined'== typeof [][ndx]);
}
/**
 * Internal (helper) use for mapping functions
 */
function mapCb(fct, ndx, itm) {
	return fct?fct.apply( ['object','function'].contains(typeof itm)?itm:null, [reTyped(ndx), itm]):itm;
}

/**
 * Returns the first of <itm> for which the function <fct> returned a value evaluated to true
 */
function trys(itm, fct) {
	var rv;
	for(var i in itm) if(cstmNdx(i, itm))
		if(rv = mapCb(fct, i, itm[i])) return rv;
}

/**
 * Returns the sum of the returns value (or 1 if not-false and not-number)
 */
function cnt(itm, fct) {
	var rv = 0;
	for(var i in itm) if(cstmNdx(i, itm)) { 
		var trv = mapCb(fct, i, itm[i]);
		if('number'== typeof trv) rv += trv;
		else if(trv) ++rv;
	}
	return rv;
}

/**
 * Returns the same item as <itm> where each member went through <fct>
 */
function map(itm, fct) {
	var rv = isArray(itm)?[]:{};
	for(var i in itm) if(cstmNdx(i, itm)) 
		rv[i] = mapCb(fct, i, itm[i]);
	return rv;
}


/**
 * Returns the same item as <itm> where each member went through <fct>
 * Each members returning an empty value are not added
 */
function maf(itm, fct) {
	var rv = isArray(itm)?[]:{};
	for(var i in itm) if(cstmNdx(i, itm)) {
		var ndx = reTyped(i); 
		var trv = mapCb(fct, i, itm[i]);
		if('undefined'!= typeof trv && null!== trv) {
			if('number'== typeof ndx) rv.push(trv);
			else rv[ndx] = trv;
		}
	}
	return rv;
}

function escapeHTML(str) {
   var div = document.createElement('div');
   var text = document.createTextNode(str);
   div.appendChild(text);
   return div.innerHTML;
};

//Is <o> an empty association ? (beside the values contained in array <b>) 
function isEmpty(o, b) {
	for(var i in o) if(!b || !b.contains(reTyped(i))) return false;
	return true;
}

//If a string is '5', get it as the number 5
function reTyped(v) {
	if('string'!= typeof v) return v;
	if((new RegExp('^(\\d+)$', 'g')).exec(v)) return parseInt(v);
	return v;
}

//The array of keys of association <ass>
function keys(ass) {
	var rv = [];
	for(var i in ass) if(cstmNdx(i, ass)) rv.push(i);
	return rv;
}

//The array of values of association <ass>
function vals(ass) {
	var rv = [];
	for(var i in ass) if(cstmNdx(i, ass)) rv.push(ass[i]);
	return rv;
}

//If elements of <t> are tables, they become part of <t>
// [ 1, [2, [3, 4]], 5 ] ==> [ 1, 2, 3, 4, 5 ]
function oneFlatTable(t) {
	var rv = [];
	for(var i=0; i<t.length; ++i)
		if(isArray(t[i])) rv = rv.concat(oneFlatTable(t[i]));
		else rv.push(t[i]);
	return rv;
}

//Compare arrays
function arrCmp(a, b) {
	if(a.length != b.length) return false;
	for(var i=0; i<a.length; ++i) if(a[i] != b[i]) return false;
	return true;
}

//arguments to Array()
function arrg(args, ndx) {
	var rv = [];
	for(var i=(ndx||0); i<args.length; ++i) rv.push(args[i]);
	return rv;
}

function beArrg(args, ndx) {
	if(!ndx) ndx = 0;
	if(ndx >= args.length) return [];
	if(1+ndx== args.length && isArray(args[ndx])) return clone1(args[ndx]);
	return arrg(args, ndx);
}

function merge(a, b, cb) {
	for(var i in b) if(cstmNdx(i, a)) a[i] = cb?cb(a[i],b[i], i):b[i];
	if(cb) for(var i in a) if('undefined'== typeof b[i]) a[i] = cb(a[i], null, i);
	return a; 
}

[].indexOf || (Array.prototype.indexOf = function(v){
       for(var i = this.length; i-- && this[i] !== v;);
       return i;
});
[].contains || (Array.prototype.contains = function(v){ return -1< this.indexOf(v); });

[].pushs || (Array.prototype.pushs = function(){
	for(var j=0; j<arguments.length; ++j) {
		var o = arguments[j];
		if(this===o)
			throw nul.internalException('Catenating self')
		for(var i=0; i<o.length; ++i) this.push(o[i]);
	}
	return this; 
});

[].union || (Array.prototype.union = function(){
	for(var j=0; j<arguments.length; ++j) {
		var o = arguments[j];
		for(var i=0; i<o.length; ++i) {
			var s;
			for(s=0; s<this.length; ++s) if(this[s]===o[i]) break;
			if(s>=this.length) this.push(o[i]);
		}
	}
	return this; 
});

[].added || (Array.prototype.added = function(v){
	var rv = clone1(this);
	rv.unshift(v);
	return rv; 
});

/**
 * Returns an array whose elements are the return values of <fct> taken for each item of <itm>
 * <fct> return an array of element to add in the return list
 */
[].mar || (Array.prototype.mar = function(fct) {
	var rv = [];
	for(var i in this) if(cstmNdx(i)) rv.pushs(mapCb(fct, i, this[i]));
	return rv;
});

pinf = Number.POSITIVE_INFINITY;
ninf = Number.NEGATIVE_INFINITY;
/*  NUL language JavaScript framework
 *  (c) 2009 E-med Ware
 *
 * NUL is freely distributable under the terms of GNU GPLv3 license.
 *  For details, see the NUL project site : http://code.google.com/p/nul/
 *
 *--------------------------------------------------------------------------*/

/**
 * A list of dependancies toward knowledges
 */
nul.dependance = Class.create({
	initialize: function(lcl) {
		this.usages = {};
		if(lcl) {
			nul.obj.is(lcl);
			switch(lcl.expression) {
			case 'local': this.depend(lcl.klgRef, 'local', lcl.ndx, lcl); break;
			case 'data': this.depend(lcl.source.context, 'local', lcl.source.index, lcl); break;
			default: throw nul.internalException('No dependance defined for '+lcl.expression);
			}
		}
	},
	
//////////////// private
	
	depend: function(klgNm, type, ndx, objs) {
		if(!isArray(objs)) {
			objs = [objs];
			objs.number = 1;
		}
		if(!this.usages[klgNm]) this.usages[klgNm] = { local: {}, ior3: {} };
		if(!this.usages[klgNm][type][ndx]) {
			this.usages[klgNm][type][ndx] = [];
			this.usages[klgNm][type][ndx].number = 0;
		}
		this.usages[klgNm][type][ndx].union(objs);
		this.usages[klgNm][type][ndx].number += objs.number;
	},

//////////////// public

	/**
	 * Retrieve a usage
	 */
	usage: function(klg) {
		return this.usages[klg.name] || { local: {}, ior3: {} };
	},

	/**
	 * Retrieve a usage and forget about it
	 */
	use: function(klg) {
		try{ return this.usage(klg); }
		finally { delete this.usages[klg.name]; }
	},

	/**
	 * Depends also on all what 'deps' depends on
	 * @param {nul.dependance} deps
	 */
	also: function(deps) {
		for(var klgNm in deps.usages)
			for(var type in deps.usages[klgNm])
				for(var ndx in deps.usages[klgNm][type])
					this.depend(klgNm, type, ndx, deps.usages[klgNm][type][ndx]);
		return this;
	},

	/**
	 * Specify dependance from an ior3 expression
	 */
	ior3dep: function(ior3) {
		nul.xpr.is(ior3, nul.obj.ior3);
		this.depend(ior3.klgRef, 'ior3', ior3.ndx, ior3);
		return this;
	},
	
	/**
	 * Retrieve if this dependance refers another knowledge than the given one
	 */
	otherThan: function(klg) {
		for(var u in this.usages) if(!klg || u!= klg.name) return u;
	},
	
//////////////// Text output

	toHtml : function() {
		var rv = [];
		for(var krf in this.usages) {
			var ld = this.usages[krf].local;
			var rld = [];
			for(var l in ld) rld.push(html.td(l+':'+ld[l].number));
			rv.push(html.th(krf) + rld.join());
		}
		return html.table(rv.join());
	},
	
	toFlat : function() {
		var rv = [];
		for(var krf in this.usages) {
			var ld = this.usages[krf].local;
			var rld = [];
			for(var l in ld) rld.push(l+':'+ld[l].number);
			rv.push(krf + '[' + rld.join(', ') + ']');
		}
		return rv.join(' ');
	},
	
});
/*  NUL language JavaScript framework
 *  (c) 2009 E-med Ware
 *
 * NUL is freely distributable under the terms of GNU GPLv3 license.
 *  For details, see the NUL project site : http://code.google.com/p/nul/
 *
 *--------------------------------------------------------------------------*/

nul.understanding = {
	rvName : '&crarr;',
	objName: 'obj',
	unresolvable: 'unresolved identifier',
	expression: function(ub) {
		var ops;
		if('[]'== this.operator)
			return ub.klg.hesitate(maf(this.operands, function() {
			//Understand each operands in a freshly created UB that DOESN'T stores locals
				try { return new nul.understanding.base(ub).understand(this); }
				catch(err) { nul.failed(err); }
			}));
		var ops = map(this.operands, function() { return this.understand(ub); });

		switch(this.operator)
		{
			case '+':
			case '*':
				return new nul.obj.operation.Nary(this.operator, ops);
			case '-':
			case '/':
			case '%':
				return new nul.obj.operation.binary(this.operator, ops);
			//TODO3: > < >= <=
			case '=>': return new nul.obj.lambda(ops[0], ops[1]);
			case ',': return nul.obj.pair.list(ops.follow, ops);
			case '=': return ub.klg.unify(ops);
			case '!=': ub.klg.oppose(nul.xpr.knowledge.unification(ops));
				return ops[0];
			case ';': return ops[0];
			case ':': 
				var rv = ub.createFreedom(nul.understanding.rvName, false);
				ub.klg.hesitate(ops[0].having(new nul.obj.lambda(rv, ops[1])));
				return rv;
			default:
				throw nul.internalException('Unknown operator: "'+operator+'"');
		}
	},
	preceded: function(ub) {
		return ub.attributed(this.operand.understand(ub), this.operator+' ');
	},
	postceded: function(ub) {
		return ub.attributed(this.operand.understand(ub), ' '+this.operator);
	},
	atom: function(ub) {
		var value;
		switch(this.type)
		{
		case "string":
			value = ''+this.value;
			break;
		case "number":
			value = 1*this.value;
			break;
		case "alphanum" :
			try { return ub.resolve(this.value); }
			catch(err) {
				if(nul.understanding.unresolvable!= err) throw err;
				return ub.createFreedom(this.value);
			}
			break;
		default:
			throw nul.internalException('unknown atom type: ' + this.type + ' - ' + this.value);
		}
		return nul.obj.litteral.make(value);
	},
	application: function(ub) {
		//return ub.klg.hesitate(this.item.understand(ub).having(this.applied.understand(ub)));
		var rv = ub.createFreedom(nul.understanding.rvName, false);
		ub.klg.hesitate(this.item.understand(ub).having(
			new nul.obj.lambda(
				this.applied.understand(ub), rv)));
		return rv;
	},
	set: function(ub) {
 		if(!this.content) return nul.obj.empty;
		return new nul.understanding.base.set(ub, this.selfRef).understand(this.content);
	},
	range: function(ub) {
		return new nul.obj.range(this.lower, this.upper);
	},
	definition: function(ub) {
		if('_'== this.decl) throw nul.semanticException('JKD', 'Cannot declare joker !')
		ub.createFreedom(this.decl);
		return this.value.understand(ub);
	},

	xml: function(ub) {
		var attrs = {};
		for(var an in this.attributes) if(cstmNdx(an))
			attrs[an] = this.attributes[an].understand(ub);
		//TODO2: content
		return new nul.obj.node(
			this.node,
			map(this.attributes, function() {
				return this.understand(ub);
			}),
			nul.obj.pair.list(null, map(this.content, function() {
				return this.understand(ub);
			})));
	},

	composed: function(ub) {
		return ub.klg.attribute(this.object.understand(ub), this.aName, this.value.understand(ub));
	},
	objectivity: function(ub) {
		return ub.attributed(this.applied.understand(ub), this.lcl);
	}
};

nul.understanding.base = Class.create({
	initialize: function(prntUb, klgName) {
		this.prntUb = prntUb;
		this.klg = new nul.xpr.knowledge(klgName);
	},
	resolve: function(identifier) {
		if(this.prntUb) return this.prntUb.resolve(identifier);
		throw nul.understanding.unresolvable;
	},
	/**
	 * Associate name to value.
	 * If no value is specified, a local is created
	 * If value is specified explicitely as 'false', a local is created and the name is not remembered
	 */
	createFreedom: function(name, value) {
		return this.prntUb.createFreedom(name, value);
	},
	understand: function(cnt) {
		return this.klg.wrap(cnt.understand(this));
	},
	attributed: function(obj, anm) {
		//TODO3: essayer de pas créer deux variables si (a.b + a.b)
		if(obj.defined) return obj.attribute(anm);
		var rv = this.createFreedom('&rarr;'+anm, false);
		this.klg.attribute(obj, anm, rv);
		return rv;
	}
});

nul.understanding.base.set = Class.create(nul.understanding.base, {
	initialize: function($super, prntUb, selfName, klgName) {
		$super(prntUb, klgName);
		this.parms = {};
		if(selfName) this.parms[selfName] = this.klg.local(selfName, nul.slf);
	},
	resolve: function($super, identifier) {
		if('undefined'!= typeof this.parms[identifier])
			return this.parms[identifier];
		return $super(identifier);
	},
	createFreedom: function(name, value) {
		if(this.parms[name]) throw nul.semanticException('FDT', 'Freedom declared twice: '+name);
		var uniqueName = true;
		if(false===value) uniqueName = false;
		if(!value) value = this.klg.newLocal(name);
		if('_'== name) uniqueName = false;
		if(uniqueName) this.parms[name] = value;
		return value;
	},
	understand: function(cnt) {
		try {
			return nul.obj.pair.list(null, this.klg.wrap(cnt.understand(this)));
		} catch(err) {
			nul.failed(err);
			return nul.obj.empty;
		}
	},
});
/*  NUL language JavaScript framework
 *  (c) 2009 E-med Ware
 *
 * NUL is freely distributable under the terms of GNU GPLv3 license.
 *  For details, see the NUL project site : http://code.google.com/p/nul/
 *
 *--------------------------------------------------------------------------*/
 
nul.compiled = {
	//Compiled just have pure data: operators, operands, stuffs, ...
	expression: function(oprtr, oprnds) {
		return { operator: oprtr, operands: oprnds, understand: nul.understanding.expression };
	},
	preceded: function(oprtr, oprnd) {
		return { operator: oprtr, operand: oprnd, understand: nul.understanding.preceded };
	},
	postceded: function(oprtr, oprnd) {
		return { operator: oprtr, operand: oprnd, understand: nul.understanding.postceded };
	},
	application: function(item, applied) {
		return { item: item, applied: applied, understand: nul.understanding.application };
	},
	taking: function(item, token) {
		return { item: item, token: token, understand: nul.understanding.taking };
	},
	range: function(lwr, upr) {
		return { lower: lwr, upper: upr, understand: nul.understanding.range };
	},
	atom: function(token, decl) {
		return { type: token.type, value: token.value, declared: decl, understand: nul.understanding.atom };
	},
	definition: function(decl, value) {
		return { decl: decl, value: value, understand: nul.understanding.definition };
	},
	set: function(content, selfRef) {
		return { content: content, selfRef: selfRef, understand: nul.understanding.set };
	},
	xml: function(node, attrs, content) {
		return { node: node, attributes: attrs, content: content, understand: nul.understanding.xml };
	},
	composed: function(obj, anm, val) {
		return { object: obj, aName: anm, value: val, understand: nul.understanding.composed };
	},
	objectivity: function(appl, lcl) {
		return { applied: appl, lcl: lcl, understand: nul.understanding.objectivity };
	}
};

//l => left built ((a . b) . c)
//r => right built (a . (b . c))
//m => multi (a , b , c)
//p => preceder (- a)
//s => postceder (a !)
//k => kept (a , b , c ,.. d)
nul.operators = [
	['[]','m'],								//booleans:meta OR
	[';','m'],								//booleans:meta AND
	[',','k'],				 				//list
	['=>','r'],								//lambda
	['!','p'],
	['=','m'], ['!=','r'],					//unify
	['<','r'], ['>','r'], ['<=','r'], ['>=','r'],
	['+','m'], ['-','l'],
	['-','p'], ['#','p'],
	['*','m'], ['/','l'], ['%','l'],
	['$','p'], [':','l'],
];

nul.compiler = function(txt)
{
	return {
		tknzr: nul.tokenizer(txt),
		alphanum: function() {
			var rv = this.tknzr.pop(['alphanum']);
			if(!rv)
				throw nul.syntaxException('IDE', 'Identifier expected');
			return rv.value;
		},
		number: function() {
			var rv = this.tknzr.pop(['number']);
			if(!rv)
				throw nul.syntaxException('IDE', 'Number expected');
			return rv.value;
		},
		list: function(firstOp, oprtr, oprtrLvl) {
			var rv = [firstOp];
			switch(oprtr[1])
			{
				case 'k':
					while( this.tknzr.take(oprtr[0]) ) rv.push(this.expression(oprtrLvl));
					if(this.tknzr.take(oprtr[0]+'..')) rv.follow = this.expression(oprtrLvl);
					break;
				case 'm':
					while( this.tknzr.take(oprtr[0]) ) rv.push(this.expression(oprtrLvl));
					break;
				case 'l':
					if( this.tknzr.take(oprtr[0]) ) rv.push(this.expression(oprtrLvl));
					break;
				case 'r':
					if( this.tknzr.take(oprtr[0]) ) rv.push(this.expression(oprtrLvl-1));
					break;
				case 's':
					if( this.tknzr.take(oprtr[0]) ) rv.push('ceded');
					break;
				default: throw nul.internalException('Bad operator type');
			}
			return rv;
		},
		expression: function(oprtrLvl) {
			if('undefined'== typeof oprtrLvl) oprtrLvl = 0; 
			if(nul.operators.length <= oprtrLvl) return this.applied();
			var oprtr = nul.operators[oprtrLvl];
			var firstOp = this.expression(1+oprtrLvl);
			if('p'== oprtr[1]) return firstOp;	//don't manage preceders here but in .item
			var rv = [firstOp];
			do
			{
				rv = this.list(firstOp, oprtr, 1+oprtrLvl);
				if(0== rv.length) throw nul.internalException('No components and an operator');
				if(1== rv.length && !rv.follow) return rv[0];
				if('ceded'== rv[1]) firstOp = nul.compiled.postceded(oprtr[0], rv[0]);
				else firstOp = nul.compiled.expression(oprtr[0], rv);
			} while('l'== oprtr[1]);
			return firstOp;
		},
		applied: function() {
			var rv = this.item();
			do
			{
				var tst;
				if(this.tknzr.take('.')) rv = nul.compiled.objectivity(rv, this.alphanum()); 
				/*else if(this.tknzr.take('['))
					rv = nul.compiled.taking(rv, this.tknzr.expect(']', this.expression()));*/ 				
				else if(tst = this.item('lax')) rv = nul.compiled.application(rv, tst);
				else if(this.tknzr.take('::')) {
					var anm = this.tknzr.rawTake('(') ?
							this.tokenizer.rawExpect(')', this.tokenizer.fly(')')) :
							this.alphanum();
					rv = nul.compiled.composed(rv, anm, this.item());					
				}
				else return rv;
			} while(true);
		},
		innerXML: function() {
			var comps = [];
			do
			{
				var aTxt = this.tknzr.fly('<');
				if(null=== aTxt) throw nul.syntaxException('XML', 'XML node not closed');
				if(''!== aTxt) comps.push(nul.compiled.atom({type:'string', value: aTxt}));
				if(this.tknzr.rawTake('<(')) comps.push(this.tknzr.rawExpect(')>',this.expression()));
				else if(this.tknzr.rawTake('</')) return comps;
				else if(this.tknzr.rawTake('<')) comps.push(this.xml());
				else throw nul.syntaxException('UEI', "Don't know what to do with '"+this.tknzr.token.value+"'");
			} while(true);
		},
		xml: function() {
			var node = this.alphanum(), attr, attrs = {};
			while(attr = this.tknzr.pop(['alphanum']))
			{
				this.tknzr.expect('=');
				attrs[attr.value] = this.item();
			}
			if(this.tknzr.rawTake('/>')) return nul.compiled.xml(node, attrs, []);
			this.tknzr.rawExpect('>');
			var comps = this.innerXML();
			this.tknzr.expect(node);
			return this.tknzr.rawExpect('>', nul.compiled.xml(node, attrs, comps));
		},
		item: function(lax) {
			var rv;
			if('eof'!= this.tknzr.token.type) {
				if(this.tknzr.take('\\/')) return nul.compiled.definition(this.alphanum(), this.expression());
				if(this.tknzr.take('{')) {
					if(this.tknzr.take('}')) return nul.compiled.set();
					var sr;
					if(this.tknzr.take(':')) sr = this.alphanum();
					return this.tknzr.expect('}', nul.compiled.set(this.expression(), sr));
				}
				if(this.tknzr.take('(')) return this.tknzr.expect(')', this.expression());
                if('[]'!= this.tknzr.token.value && this.tknzr.rawTake('[')) {
                    var lwr, upr;
                    if(!this.tknzr.rawTake('..'))
						lwr = this.tknzr.rawExpect('..',this.number());
                    if(!this.tknzr.take(']'))
                    	upr = this.tknzr.expect(']',this.number());
                    return nul.compiled.range(lwr, upr);
                }
				if(!lax) {
					if(this.tknzr.take('<')) return this.xml();
					for(var p= 0; p<nul.operators.length; ++p) {
						var oprtr = nul.operators[p];
						if('p'== oprtr[1] && this.tknzr.take(oprtr[0]))
							return nul.compiled.preceded(oprtr[0], this.expression(1+p));
					}
				}
				rv = this.tknzr.pop(['alphanum', 'number', 'string']);
			}
			if(!rv && !lax) throw nul.syntaxException('ITE', 'Item expected');
			if(rv) return nul.compiled.atom(rv);
		}
	};
}
nul.compile = function(txt)
{
	var rv = nul.compiler(txt);
	var ev = rv.expression();
	if(rv.tknzr.token.type != 'eof') throw nul.syntaxException('TOE', 'Unexpected: "'+rv.tknzr.token.value+"'.");
	return ev;
};
/*  NUL language JavaScript framework
 *  (c) 2009 E-med Ware
 *
 * NUL is freely distributable under the terms of GNU GPLv3 license.
 *  For details, see the NUL project site : http://code.google.com/p/nul/
 *
 *--------------------------------------------------------------------------*/
 
nul.alphabets = {
	number:		'(\\d+(\\.\\d+)?)',
	alphanum:	'([_\\w@]+)',
	string:		'"([^"]*)"',
	space:		'\\s+',
	comm1:		'\\/\\/.*\n/',
	comm2:		'\\/\\*.*\\*\\/',
	oprtr:		'([\\~\\:\\+\\-\\>\\<\\=\\*\\/\\!\\&\\|\\\\\\/\\.\\?\\[\\]\\,]+)'
};
nul.tokenizer = function(src)
{
	var rv = {
		txt: src,
		token: { type: '', value: '', raw: '' },
		/**
		 * Take next token
		 */
		next: function()
		{
			var match, alphabet;
			do
			{
				if(''== this.txt)
					return this.token = { value: '', type: 'eof' };
				for(alphabet in nul.alphabets)
					if(match = nul.tokenizer.isAB(this.txt, alphabet))
					{
						this.token = {
							value: (1< match.length) ? match[1]: null,
							type: alphabet,
							raw: match[0]};
						this.txt = this.txt.substr(match[0].length);
						break;
					}
				if(!match)
				{
					this.token = this.txt.substr(0,1);
					this.token = { value: this.token, type: 'other', raw:this.token };
					this.txt = this.txt.substr(1);
				}
			} while(!this.token.value && 'string'!= this.token.type);
			
			return this.token;
		},
		/**
		 * Compare and return next token
		 * @param {array(string)} accepted A list of accepted token type
		 * @return next token if accepted or null
		 */
		peek: function(accepted)
		{
			if(accepted)	//if specified
			{
				var argx;
				for(argx=0; argx<accepted.length; ++argx)
					if(accepted[argx]== this.token.type)
						break;
				if( argx >= accepted.length )
					return null;
			}
			return this.token;
		},
		/**
		 * Gets next token and advance if accepted.
		 * @param {array(string)} accepted A list of accepted token type
		 * @return next token if accepted or null
		 */
		pop: function(accepted)
		{
			if('eof'== this.token.type) throw nul.syntaxException('EOF', 'End of file reached.');
			var rv = this.peek(accepted);
			if(rv) this.next();
			return rv;
		},
		/**
		 * Gets next token and advance if accepted.
		 * @param {string} value The only accepted token value
		 * @return true if token was token, false if nothing changed
		 */
		take: function(value)
		{
			var rv = this.token.value == value;
			if( rv ) this.next();
			return rv;
		},
		/**
		 * Take next token, asserts its value
		 * @param {string} value The expected value of the next token
		 * @param {any} rv The return value of this function
		 * @return the parameter 'rv'
		 * @throws nul.synthaxException if the token is not the one expected.
		 */
		expect: function(value, rv)
		{
			if(!this.take(value))
				throw nul.syntaxException('EXP', '"'+value+'" expected');
			return rv;
		},
		/**
		 * Gets next characters and advance if accepted.
		 * @param {string} value The characters expected to de found
		 * @return true if the characters were found
		 */
		rawTake: function(value)
		{
			var txt = this.token.raw + this.txt;
			if( txt.substr(0,value.length) != value ) return false;
			this.txt = txt.substr(value.length);
			this.next();
			return true;
		},
		/**
		 * Take some characters, asserts their value
		 * @param {string} value The expected string to find
		 * @param {any} rv The return value of this function
		 * @return the parameter 'rv'
		 * @throws nul.synthaxException if the characters were not found exactly
		 */
		rawExpect: function(value, rv)
		{
			if(!this.rawTake(value))
				throw nul.syntaxException('EXP', '"'+value+'" expected');
			return rv;
		},
		/**
		 * Get a string until some character
		 * @param {string} seeked The bound for seeking
		 * @return the string until the bound.
		 */
		fly: function(seeked)
		{
			var txt = this.token.raw + this.txt;
			var n = txt.indexOf(seeked);
			if(-1== n) return null;
			var rv = txt.substr(0, n);
			this.txt = txt.substr(n);
			this.next();
			return rv;
		}
	};
	rv.next();
	return rv;
};
nul.tokenizer.isAB = function(v, alphabet) {
	return (new RegExp('^'+nul.alphabets[alphabet], 'g')).exec(v);
};/*  NUL language JavaScript framework
 *  (c) 2009 E-med Ware
 *
 * NUL is freely distributable under the terms of GNU GPLv3 license.
 *  For details, see the NUL project site : http://code.google.com/p/nul/
 *
 *--------------------------------------------------------------------------*/
 
nul.txt = {
	toText: function(xpr) {
		if(!this.beginDraw(xpr)) return this.recurStr;
		var ctx = this.enterContext(xpr);
		try {
			return this.wrap(
				(this.draw[xpr.expression]||this.draw.other)
					.apply(this.outp(xpr), [this.context]),
				xpr);
		}
		finally {
			this.leaveContext(ctx);
			this.endDraw(xpr);
		}
	},
	dispatchPair: function(xpr, obj) {
		var lstd = xpr.listed();
		if(xpr.isList()) {
			if(1== lstd.length && !lstd.follow)
				return this.draw.singleton.apply(obj, []);
			return this.draw.list.apply(obj, [lstd]);
		} 
		return this.draw.set.apply(obj, [lstd]);
	},
	beginDraw: function(xpr) {
		if(this.drawing.contains(xpr)) return false;
		this.drawing.push(xpr);
		return true;
	},
	endDraw: function(xpr) {
		if(nul.debug.assert) assert(xpr==this.drawing.pop(), 'Drawing consistency');
		else this.drawing.pop();
	},
	clpsSstm : function(table, uc, lcFct) {
		return table ? table.clpsSstm = {
			table: table,
			uc: uc,
			collapsing: {},
			toPair: [],
			lineCount: lcFct || function() { return this.table.rows.length-('up'==this.uc?0:1); },
			collapser: function(html) {
				this.toPair.push(this.lineCount());
				return '<span class="collapser start"><a class="collapser" ' +
					'onclick="nul.txt.collapse(this, '+this.lineCount()+');">&darr;</a></span>'+
					'<span class="uncollapser start"><a class="collapser" ' +
					'onclick="nul.txt.uncollapse(this, '+this.lineCount()+');">+</a></span>'+
					html;
			},
			endCollapser: function(opnd, clsd) {
				var plc = this.toPair.pop();
				if('undefined'== typeof clsd) clsd = opnd;
				if('undefined'!= typeof this.collapsing[plc]) return '';	//Collaper was not drawn
				this.collapsing[plc] = this.lineCount();
				return '<span class="collapser end">' +
					'<a class="collapser" ' +
					'onclick="nul.txt.collapse(this, '+plc+');">&uarr;</a>' + opnd +
					'</span><span class="uncollapser end">' +
					'<a class="collapser" ' +
					'onclick="nul.txt.uncollapse(this, '+plc+');">+</a>' + clsd +
					'</span>';
			},
			//'collapsed' class name is added once for each collapsement : this is not a bug if it appears
			// several time on an item
			collapse: function(lc) {
				assert(this.collapsing[lc] && 'topair'!= this.collapsing[lc], 'Collapsing pairs coherence.');
				for(var r=lc; r<this.collapsing[lc]; ++r)
					$(this.table.rows[r]).className = 'collapsed ' + $(this.table.rows[r]).className;
				this.table.rows[r].addClassName('uncollapsing');
				if('up'==this.uc && 0<lc) this.table.rows[lc-1].addClassName('unsubcollapsing');
			},
			uncollapse: function(lc) {
				assert(this.collapsing[lc] && 'topair'!= this.collapsing[lc], 'Collapsing pairs coherence.');
				for(var r=lc; r<this.collapsing[lc]; ++r)
					$(this.table.rows[r]).className = $(this.table.rows[r]).className.substr('collapsed '.length);
				this.table.rows[r].removeClassName('uncollapsing');
				if('up'==this.uc && 0<lc) this.table.rows[lc-1].removeClassName('unsubcollapsing');
			}			
		} : {
			collapser: function(html) {},
			endCollapser: function(opnd, clsd) {}
		};
	},
	//'collapsed' class name is added once for each collapsement : this is not a bug if it appears
	// several time on an item
	collapse: function(tbl, lc) {
		while(tbl && !tbl.clpsSstm) tbl = tbl.parentNode;
		assert(tbl,'No orphan collapsers');
		return tbl.clpsSstm.collapse(lc);
	},
	uncollapse: function(tbl, lc) {
		while(tbl && !tbl.clpsSstm) tbl = tbl.parentNode;
		assert(tbl,'No orphan collapsers');
		return tbl.clpsSstm.uncollapse(lc);
	},
//////////////// Knowledge data retrieval
	context: {},
	enterContext: function(xpr) {
		if(!xpr.knowledge || this.context[xpr.knowledge.name]) return;
		return this.context[xpr.knowledge.name] = xpr.knowledge;
	},
	leaveContext: function(xpr) {
		if(xpr)
			delete this.context[xpr.name];
	},
};
/*  NUL language JavaScript framework
 *  (c) 2009 E-med Ware
 *
 * NUL is freely distributable under the terms of GNU GPLv3 license.
 *  For details, see the NUL project site : http://code.google.com/p/nul/
 *
 *--------------------------------------------------------------------------*/

nul.txt.flat = merge({
	drawing: [],
	all: function(ass) {
		return maf(ass, function() { return this.toFlat(); });
	},
	recurStr: '[recur]',
	wrap: function(txt) { return txt; },
	outp: function(xpr) { return xpr; },
	draw: {
		pair: function() { return nul.txt.flat.dispatchPair(this, this); },
		
		local: function() {
			return (this.dbgName||'') + '[' + this.klgRef + '|' + this.ndx + ']';
		},
		attribute: function() {
			return this.ofObject.toFlat() + '&rarr;' + this.attributeName;
		},
		operation: function() {
			return '(' + nul.txt.flat.all(this.operands).join(' '+this.operator+' ') + ')';
		},
		extension: function() {
			var attrs = [];
			for(var an in this.attr) if(cstmNdx(an, this.attr))
				attrs.push('::' + an + ' ' + this.attr[an].toFlat());
			return '[' + attrs.join(' ') + ']';
		},
		number: function() {
			if(pinf==this.value) return '+&infin;';
			if(ninf==this.value) return '-&infin;';
			return ''+this.value;
		},
		string: function() {
			return '"'+this.value+'"';
		},
		'boolean': function() {
			return this.value?'true':'false';
		},
		range: function() {
			var rv = '&#x2124;[';
			if(ninf!= this.lower) rv += this.lower;
			rv += '..';
			if(pinf!= this.upper) rv += this.upper;
			return rv + ']';
		},
		data: function() {
			return '['+this.source.context+':'+this.source.index+']';
		},
		other: function() {
			return this.expression;
		},
		
		lambda: function() {
			return this.point.toFlat() + ' &rArr; ' + this.image.toFlat();
		},
		singleton: function() {
			return '{' + this.first.toFlat() + '}';
		},
		list: function(flat) {
			return '(' + nul.txt.flat.all(flat).join(', ') +
				(flat.follow?(',.. '+flat.follow.toFlat()):'')+ ')';
		},
		set: function(flat) {
			return '{' + nul.txt.flat.all(flat).join(' &#9633; ') + '}' +
				(flat.follow?(' &cup; '+flat.follow.toFlat()):'');
		},
		ior3: function() {
			return '(' + nul.txt.flat.all(this.possibles()).join(' &#9633; ') + ')';
		},
		
		eqCls: function() {
			var attr = [];
			for(var anm in this.attribs) if(anm)
				attr.push(anm+': '+this.attribs[anm].toFlat())
			attr = (attr.length)?('['+attr.join(', ')+']'):'';
			return '(' + attr + nul.txt.flat.all(this.equivls).join(' = ') + ')' +
				(this.belongs.length?(' &isin; ' + nul.txt.flat.all(this.belongs).join(', ')):'');
		},
		klg: function() {
			if(this==nul.xpr.knowledge.never) return 'Never';
			if(this==nul.xpr.knowledge.always) return '';
			var rv = nul.txt.flat.all(this.eqCls).join(' &and; ');
			//var deps = this.usage();
			var kior3 = nul.txt.flat.all(this.ior3).join(' &and; ')
			if(rv && kior3) rv += ' &and; ' + kior3;
			else if(kior3) rv = kior3;
			return rv?'('+rv+')':'';
		},
		kior3: function() {
			return '('+nul.txt.flat.all(maf(this.choices)).join(' &or; ')+')';
		},
		possible: function() {
			if(this===nul.xpr.failure) return 'Failure';
			if(this.knowledge===nul.xpr.knowledge.always) return this.value.toFlat();
			var klgStr = this.knowledge.toFlat();
			var valStr = this.value.toFlat();
			if(!klgStr) return valStr;
			return valStr + '; ' + klgStr;
		},
	}
}, nul.txt);/*  NUL language JavaScript framework
 *  (c) 2009 E-med Ware
 *
 * NUL is freely distributable under the terms of GNU GPLv3 license.
 *  For details, see the NUL project site : http://code.google.com/p/nul/
 *
 *--------------------------------------------------------------------------*/

html = {
	tagged: function(tag, attrs, cnt) {
		var rv = '<'+tag;
		for(var a in attrs) if(attrs[a]) rv += ' '+a+'="'+attrs[a]+'"';
		if(null=== cnt) return rv + ' />';
		return rv + '>' + cnt + '</'+tag+'>';
	},
	span: function(cls, cnt) {
		return html.tagged('span', {'class': cls}, cnt);
	},
	op: function(o) {
		return ' ' + html.span('op', o) + ' ';
	},
	table: function(cnt, cls) {
		return html.tagged('table', {'class': cls}, cnt);
	},
	tr: function(cnt, cls) {
		return html.tagged('tr', {'class': cls}, cnt);
	},
	th: function(cnt, cls) {
		return html.tagged('th', {'class': cls}, cnt);
	},
	td: function(cnt, cls) {
		return html.tagged('td', {'class': cls}, cnt);
	},

	tilePopup: function(knd, cnt) {
		return ''+
			html.tagged('div', {
				'class': knd,
		        onmouseout: 'nul.txt.html.js.leave();',
		        style: 'display: none;',
			}, cnt);
	},
	tileSquare: function(knd, ttl, pos) {
        return ''+
			html.tagged('a', {
				'class': knd,
				title: ttl,
		        onmouseover: 'nul.txt.html.js.enter(this.parentNode, \''+knd+'\');',
		        style: 'left: '+(5*pos)+'px;',
			}, '');
	},
};

nul.txt.html = merge({
	drawing: [],
	all: function(ass) {
		return maf(ass, function() { return this.toHtml(); });
	},
	recurStr: '[recur]',
	wrap: function(txt, xpr) {
		var tileSquares = '', tilePopups = '';
		var tiles = {};
		tiles.shortStr = xpr.toFlat();
		tiles.index = xpr.toString();
		merge(tiles, txt);
		delete tiles[''];
		var spos = 0;
		for(var t in tiles) {
			tileSquares += html.tileSquare(t, tiles[t], spos++);
			tilePopups += html.tilePopup(t, tiles[t]);
		}
		
		var deps = xpr.dependance();
		var df = deps.toFlat();
		if(df) {
			tileSquares += html.tileSquare('dependances', df, spos++);
			tilePopups += html.tilePopup('dependances', deps.toHtml());
		}
		return html.span('xpr',
			tilePopups+tileSquares+
				html.span(xpr.expression, txt['']));
	},
	outp: function(xpr) { return xpr; },
	draw: {
		pair: function() { return nul.txt.html.dispatchPair(this, this); },
		
		local: function() {
			return {
				'': this.dbgName? (
	                	this.dbgName+
	                	html.span('desc', html.span('sup',this.ndx)+
	                	html.span('sub',this.klgRef))
                	) : this.ndx+html.span('desc', html.span('sub',this.klgRef))
                };
		},
		attribute: function() {
			return {'': this.ofObject.toHtml() + html.op('&rarr;' + this.attributeName)};
		},
		operation: function() {
			return {'': html.op('(') +
				nul.txt.html.all(this.operands)
					.join(html.op(this.operator)) +
				html.op(')')};
		},
		extension: function() {
			var attrs = [];	//TODO3: expandable table ?
			for(var an in this.attr) if(cstmNdx(an, this.attr))
				attrs.push(html.tr(html.th(an)+html.td(this.attr[an].toHtml())));
			return {'': html.table(attrs.join(''))};
		},
		number: function() {
			if(pinf==this.value) return {'': '+&infin;'};
			if(ninf==this.value) return {'': '-&infin;'};
			return {'': ''+this.value};
		},
		string: function() {
			return {'': '"'+this.value+'"'};
		},
		'boolean': function() {
			return {'': this.value?'true':'false'};
		},
		range: function() {
			var ltr = 0> this.lower ?
				'&#x2124;':	//ℤ
				'&#x2115;';	//ℕ
			if(pinf==this.upper) {
				if(ninf==this.lower) return {'': ltr};
				if(0== this.lower) return {'': ltr};
			}
			return {'': ltr+html.span('desc',
				html.span('sup',(pinf==this.upper)?'&infin;':this.upper)+
                html.span('sub',(ninf==this.lower)?'&infin;':this.lower))};
		},
		data: function() {
			return {
				'': html.span('op','&Dagger;') +
	                	html.span('desc', html.span('sup',this.source.index)+
	                	html.span('sub',this.source.context))
                };
		},
		other: function() {
			return {'': this.expression};
		},
		
		lambda: function() {
			return {'': this.point.toHtml() + html.op('&rArr;') + this.image.toHtml()};
		},
		singleton: function() {
			return {'': html.op('{') + this.first.toHtml() + html.op('}')};
		},
		list: function(flat) {
			return {'': html.op('(') + nul.txt.html.all(flat).join(html.op(',')) +
				(flat.follow?(html.op(',.. ')+flat.follow.toHtml()):'')+ html.op(')')};
		},
		set: function(flat) {
			return {
				'': html.span('big op','{') +
						nul.txt.html.all(flat).join(' &#9633; ') +
					html.span('big op','}') +
					(flat.follow?(html.op('&cup;')+flat.follow.toHtml()):'')
			};
		},
		ior3: function() {
			return {'': html.op('(') +
				nul.txt.html.all(this.possibles()).join(html.op('&#9633;')) +
				html.op(')')};
		},
		
		eqCls: function() {
			var attrs = [];
			for(var an in this.attribs) if(cstmNdx(an))
				attrs.push(html.tr(html.th(an)+html.td(this.attribs[an].toHtml())));

			attrs = attrs.length?html.table(attrs.join(''),'attributes'):'';

			return {'': html.op('(') + attrs +
				nul.txt.html.all(this.equivls).join(html.op('=')) +
				html.op(')') +
				(this.belongs.length?
					(html.op('&isin;') + nul.txt.html.all(this.belongs).join(html.op(','))):
					'')};
		},
		klg: function() {
			if(this==nul.xpr.knowledge.never) return {'':html.op('Never')};
			if(this==nul.xpr.knowledge.always) return {'':html.op('Always')};
			var rv = nul.txt.html.all(this.eqCls).join(html.op('&and;'));
			/*var dior3 = [], deps = this.	//TODO2: retrieve usage
			for(var i=0; i< this.ior3.length; ++i)
				if()*/
			var kior3 = nul.txt.html.all(this.ior3).join(html.op('&and;'))
			var veto = nul.txt.html.all(this.veto).join(html.op('&or;'))
			if(rv && kior3) rv += html.op('&and;') + kior3;
			else if(kior3) rv = kior3;
			if(rv && veto) rv += html.op('&and;')+html.op('&not;') + veto;
			else if(veto) rv = html.op('&not;') + veto;
			return {
				'': rv?(html.op('(')+rv+html.op(')')):'',
				locals: this.name + (this.locals.length?(' : ' + this.locals.join(', ')):''),
			};
		},
		kior3: function() {
			return {
				'': html.op('(')+nul.txt.html.all(maf(this.choices)).join(html.op('&or;'))+html.op(')'),
			};
		},
		
		
		possible: function() {
			if(this===nul.xpr.failure) return { '': html.op('Failure') };
			if(this.knowledge===nul.xpr.knowledge.always) return { '': this.value.toHtml() };
			return {
				'': html.table(
					html.tr(html.td(this.value.toHtml(),'freedom')) +
					html.tr(html.th(this.knowledge.toHtml(),'freedom')),
					'xpr freedom'),
			};
		},
	},
	
	js: {
		enter: function(elm, knd) {
			if(this.entered && elm == this.entered[0] && knd == this.entered[1]) return;
			if(this.entered) this.leave();
			this.entered = [elm, knd];
			elm.addClassName('lined');
			elm.getElementsBySelector('a.'+knd).each(Element.hide);
			elm.getElementsBySelector('div.'+knd).each(Element.show);
			elm.getElementsBySelector('span a.'+knd).each(Element.show);
			elm.getElementsBySelector('span div.'+knd).each(Element.hide);
			//this.keepTimeOut = window.setTimeout('nul.txt.js.leave();',100);
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
}, nul.txt)/*  NUL language JavaScript framework
 *  (c) 2009 E-med Ware
 *
 * NUL is freely distributable under the terms of GNU GPLv3 license.
 *  For details, see the NUL project site : http://code.google.com/p/nul/
 *
 *--------------------------------------------------------------------------*/

 /**
  * Used to build expression summary items
  */
nul.summary = function(itm) {
	return function() { return this.summary(itm); };
};
 
nul.expression = Class.create({
 	initialize: function(tp) {
 		if(tp) this.expression = tp;
 	},
	components: [],
	
//////////////// Assertion functionment

	/**
	 * Assert this expression is modifiable
	 */
	modify: function() {
		return !this.summarised;
	}.contract('Cannot modify summarised'),
	/**
	 * Assert this expression is summarised
	 */
	use: function() {
		return this.summarised;
	}.contract('Cannot use non-summarised'),

//////////////// Summary functionment

	/**
	 * Retrieve a computed value about this expression
	 */
	summary: function(itm) {
		if(!this.summarised) return this['sum_'+itm].apply(this);
		//this.use();
		if('undefined'== typeof this.summarised[itm]) {
			assert(this['sum_'+itm],'Summary '+itm+' provided for '+this.expression);
			this.summarised[itm] = this['sum_'+itm].apply(this);
		}
		return this.summarised[itm];
	},
	/**
	 * Stop the modifications brought to this expression. Now, we compute some values about
	 * @param {association} smr The given summary
	 */
	summarise: function(smr) {
		this.modify();
		this.summarised = smr || {};
	},

	/**
	 * Return a clone version of this expression to modify it.
	 */
	modifiable: function() {
		this.use();
		return maf(this, function(ndx, obj) { if('summarised'!= ndx) return obj; });
	},

//////////////// Virtuals

	/**
	 * Return a built version of this expression when the components has bee modified by browse
	 */
	chew: function() {
		this.modify();
		return this.built();
	},	
	/**
	 * Return a summarised version of this.
	 */
	built: function(smr) {
		this.modify();
		for(var comp in this.components) if(cstmNdx(comp)) {
			var cname = this.components[comp];
			if(nul.debug.assert) assert('attribs'!= cname || nul.xpr.bunch(this[cname]),
				'Attributes ARE bunch');
			if(nul.xpr.bunch(this[cname])) {
				for(var ci in this[cname]) if(cstmNdx(ci))
					this[cname][ci] = this[cname][ci].placed(this);
			} else this[cname] = this[cname].placed(this);
		}
		this.summarise(smr);
		return this.fix();
	},
	/**
	 * Built called in a constructor.
	 * No return value, assume it returns this
	 */
	alreadyBuilt: function(smr) {
		var built = this.built(smr);
		if(nul.debug.assert) assert(this===built, 'Already built fix self');
	},
	/**
	 * Modify internal representation : you won't be changed anymore
	 */
	fix: function() {
		this.use();
		return this;
	},
	/**
	 * Get the version to set as a child of 'prnt' to represent me
	 */
	placed: function(prnt) {
		this.use(); nul.xpr.mod(prnt);
		return this;
	},
	
//////////////// Public

	dbgHtml: function() {
		var f = this.toFlat();
		if(100>f.length) return this.toHtml();
		return f;
	},
	invalidateTexts: function() {
		//TODO3: invalidate parent texts ?
		delete this.summarised.flatTxt;
		delete this.summarised.htmlTxt;
	},

//////////////// Summary users

	toString: nul.summary('index'),
	toHtml: nul.summary('htmlTxt'),			//The HTML representation of an expression
	toFlat: nul.summary('flatTxt'),			//The flat-text representation of an expression
	isList: nul.summary('isList'),			//Weither this expression is a list
	dependance: nul.summary('dependance'),	//nul.dependance

//////////////// Generic summary providers

	sum_components: function() {
		var rv = {};
		for(var comp in this.components) if(cstmNdx(comp)) {
			var cname = this.components[comp];
			if(nul.xpr.bunch(this[cname])) {
				for(var ci in this[cname]) if(cstmNdx(ci))
					rv[cname+':'+ci] = this[cname][ci];
			} else {
				rv[cname] = this[cname];
			}
		}
		return rv;
	},
	
	sum_index: function() {
		var cs = [];
		for(var c in this.components) if(cstmNdx(c))
			cs.push(this[this.components[c]]);
		return this.indexedSub(cs);
	},
	indexedSub: function(items) {
		//TODO3: assert no infinite recursion
		nul.xpr.is(this);
	 	items = beArrg(arguments);
	 	var rv = [];
	 	if(items) for(var e in items) if(cstmNdx(e))
	 		rv.push(nul.xpr.indexedBunch(items[e]));
	 	return '['+this.expression + (rv.length?(':' + rv.join('|')):'') +']';
	},

	sum_htmlTxt: function() { return nul.txt.html.toText(this); },
	sum_flatTxt: function() { return nul.txt.flat.toText(this); },
	sum_dependance: function() {
		var comps = this.summary('components');
		var rv = new nul.dependance();
		for(var c in comps) if(comps[c])
			rv.also(comps[c].dependance());
		return rv;
	},
	sum_isList: function() { return true; },
});

nul.xpr = {
	are: nul.debug.are('expression'),
	is: function(x, t) {
		nul.debug.is('expression')(x);
		if(t) {
			t = t.prototype.expression;
			(function() { return x.expression == t; }.asserted('Expected "'+t+'" expression'));
		}
	},
	use: function(x, t) {
		if(!nul.xpr.bunch(x)) x = [x];
		if(nul.debug.assert) map(x, function(i, o) {
			nul.xpr.is(o, t);
			o.use();
		});
	},
	
	mod: function(x, t) {
		if(!nul.xpr.bunch(x)) x = [x];
		if(nul.debug.assert) map(x, function(i, o) {
			nul.xpr.is(o, t);
			o.modify();
		});
	},
};

/**
 * X is either an expression either a [components] bunch of expression
 * @return weither x is a bunch of expressions
 */
nul.xpr.bunch = function(x) {
	return isArray(x) || 'xprBunch'== x[''];
};
/**
 * Mark an object as an expression bunch
 * @param {association} x
 * @return x that has been modified
 */
nul.xpr.beBunch = function(x) {
	if(!x) x = {};
	x[''] = 'xprBunch';
	return x;
};
nul.xpr.indexedBunch = function(b) {
	if(!nul.xpr.bunch(b)) return b.toString();
	var rv = [];
	for(var e in b) if(cstmNdx(e))
		rv.push(e+':'+b[e].toString());
	return rv.join('/');
};
/*  NUL language JavaScript framework
 *  (c) 2009 E-med Ware
 *
 * NUL is freely distributable under the terms of GNU GPLv3 license.
 *  For details, see the NUL project site : http://code.google.com/p/nul/
 *
 *--------------------------------------------------------------------------*/

nul.browser = Class.create({
	initialize: function(desc) {
		this.description = desc;
	},
	/**
	 * Called after sub-element browsing
	 * @param {association} bwsd An assocation of the components browsed mapping the result of the browsing
	 * @param {nul.expression} xpr The xpr given to this function
	 * @return Whatever this browse function should return
	 */
	makeRV: function(xpr, bwsd) { throw 'abstract'; },
	/**
	 * Recursion function over an expression
	 */
	recursion: function(xpr) {
		if(!xpr) return nul.browser.bijectif.unchanged;
		try {
			nul.xpr.use(xpr);
			
			var bwsd = {};
			for(var comp in xpr.components) if(cstmNdx(comp)) {
				comp = xpr.components[comp];
				if(nul.xpr.bunch(xpr[comp])) {
					var brwsr = this;
					bwsd[comp] = map(xpr[comp], function(i, o) { return brwsr.recursion(o); });
				} else
					bwsd[comp] = this.recursion(xpr[comp], comp);
			}
			return this.makeRV(xpr, bwsd);
		} catch(err) {
			nul.failed(err);
			if(xpr.failure) return xpr.failure;
			throw err;
		}
 	},
 	/**
 	 * Entry point of browsing
 	 */
 	browse: function(xpr) {
 		var brwsr = this;
 		return nul.execution.benchmark.measure(this.description+' browse', function() { 
 			return brwsr.recursion(xpr);
 		});
 	},
});

/**
 * A browser that cache returns value in the expression JS object
 */
nul.browser.cached = Class.create(nul.browser, {
	initialize: function($super, desc) {
		this.name = 'browseCache' + ++nul.browser.cached.nameSpace;
		this.cachedExpressions = [];
		$super(desc);
	},
	/**
	 * Remove the cache info from an object
	 */
	uncache: function(xpr) {
		delete xpr[this.name];
	},
	/**
	 * Destroy the cache of returned expression
	 */
	invalidateCache: function() {
		if(this.cachedExpressions)
			while(this.cachedExpressions.length)
				this.uncache(this.cachedExpressions.pop());
		
	},
	/**
	 * Called before to browse an expression
	 * @return nothing
	 */
	prepare: function(xpr) {},
	/**
	 * Recursion function over an expression
	 */
	recursion: function($super, xpr) {
		if(!xpr) return nul.browser.bijectif.unchanged;
		if(!xpr[this.name]) {
			this.prepare(xpr);
			xpr[this.name] = $super(xpr);
			this.cachedExpressions.push(xpr);
		}
 		return xpr[this.name];
 	},
 	/**
 	 * Entry point of browsing
 	 */
 	browse: function($super, xpr) {
 		try { return $super(xpr); }
 		finally { this.invalidateCache(); }
 	},
});

/**
 * Gives one other expression or the same expression
 */
nul.browser.bijectif = Class.create(nul.browser.cached, {
	/**
	 * Transform an expression without recursion.
	 * @return nul.expression or nul.browser.bijectif.unchanged
	 */
	transform: function(xpr) { throw 'abstract'; },
	recursion: function($super, xpr) {
		var evl = new nul.browser.bijectif.evolution(xpr);
		//evl.receive(this.prepare(evl.value));
		evl.receive($super(evl.value));
		return evl.changed;
 	},
	/**
	 * Transform this expression that already had bee browsed.
	 * @return Either a new object or 'null' if nothing changed
	 */
	makeRV: function(xpr, bwsd) {
		var evl = new nul.browser.bijectif.evolution(xpr);
		var mod = nul.browser.bijectif.merge(evl.value, bwsd);
		if(mod) evl.receive(mod.chew());	//Here are built modifiabled expressions
		evl.receive(this.transform(evl.value));
		return evl.changed;
	},
 	/**
 	 * Entry point of browsing
 	 */
 	browse: function($super, xpr) {
		var evl = new nul.browser.bijectif.evolution(xpr);
		evl.receive($super(evl.value));
		return evl.value;
	},
});


/**
 * Gives one other expression or the same expression - chew until the result is unchanged
 */
nul.browser.chewer = Class.create(nul.browser.bijectif, {
	//TODO0: another condition than to try to re-browse and to see if changed?
	makeRV: function($super, xpr, bwsd) {
		var rv = $super(xpr, bwsd);
		if(nul.browser.bijectif.unchanged== rv) return rv;
		var nrv = this.recursion(rv);
		return (nul.browser.bijectif.unchanged== nrv)?rv:nrv;
	},
});

//////////////// Bijectif browser statics

nul.browser.bijectif.merge = function(xpr, bwsd) {
	var mod;
	for(var c in bwsd) {
		var nwItm = bwsd[c];
		if(nul.xpr.bunch(xpr[c])) {
			nwItm[''] = nul.browser.bijectif.unchanged;
			//bwsd[c] contient des null-s et des valeurs
			if(nul.browser.bijectif.unchanged != nul.browser.bijectif.firstChange(nwItm)) {
				//If at least one non-null return value,
				nwItm = merge(nwItm, xpr[c], nul.browser.bijectif.firstChange);
				nwItm[''] = xpr[c][''];	//Peculiar case of 'xprBunch'
			} else nwItm = nul.browser.bijectif.unchanged;
		}
		if(nul.browser.bijectif.unchanged!= nwItm) {
			if(!mod) mod = xpr.modifiable();
			mod[c] = nwItm;
		}
	}
	return mod;
};

nul.browser.bijectif.unchanged = 'bijectif.unchanged';
nul.browser.bijectif.evolution = Class.create({
	initialize: function(xpr) {
		this.value = xpr;
		this.changed = nul.browser.bijectif.unchanged;
	},
	receive: function(xpr) {
		if(nul.browser.bijectif.unchanged== xpr) return;
		this.changed = this.value = xpr;
		if(xpr) nul.xpr.use(xpr);
	},
});
nul.browser.bijectif.firstChange = function(vals, b) {
	if(b) vals = [vals, b];
	for(var i in vals) if(cstmNdx(i,vals))
		if(vals[i] != nul.browser.bijectif.unchanged)
			return vals[i];
	return nul.browser.bijectif.unchanged;
};

/*  NUL language JavaScript framework
 *  (c) 2009 E-med Ware
 *
 * NUL is freely distributable under the terms of GNU GPLv3 license.
 *  For details, see the NUL project site : http://code.google.com/p/nul/
 *
 *--------------------------------------------------------------------------*/

/**
 * TODO0: a real resolution engine ! :)
 * Interface function of Solver.
 * Gets a distributed list of fuzzies that don't contains ior3 anymore
 * @param {nul.xpr.possible} fz
 * @return array(nul.xpr.possible)
 */
nul.solve = function(fz) {
	nul.xpr.is(fz, nul.xpr.possible);
	var cases = fz.knowledge.ior3;
	var ndx = map(cases, function() { return 0; });
	var rv = [];
	var incndx = 0;
	while(incndx < cases.length) {
		var klg = nul.xpr.knowledge.always;
		try {
			for(var i=0; i<ndx.length; ++i) {
				if(nul.xpr.knowledge.always== klg) {
					klg = fz.knowledge.modifiable();
					klg.ior3 = [];
				}
				if(cases[i].choices[ndx[i]]) klg.merge(cases[i].choices[ndx[i]]);
			}
			rv.push((new nul.solve.browser(fz.knowledge, ndx))
				.browse(klg.wrap(fz.value)));
		} catch(err) { nul.failed(err); }
	    //increment indexes
		for(incndx=0; incndx<cases.length; ++incndx) {
			if(++ndx[incndx] < cases[incndx].choices.length) break;
			ndx[incndx] = 0;
		}
	}
	return rv;
}.describe('Resolution', function() {
	return map(beArrg(arguments), function() { return this.dbgHtml(); }).join(' &#9633; ');
});

/**
 * Interface function of Solver.
 * Distribute sub-fuzzies
 * @param {array(nul.xpr.possible)} fzs
 * @return array(nul.xpr.possible) Each element of the returned arrays contain no ior3
 */
nul.solve.ior3 = function(fzs) {
	var rv = [];
	for(var c in fzs) if(cstmNdx(c)) rv.pushs(nul.solve(fzs[c]));
	return rv;
};

nul.solve.browser = Class.create(nul.browser.bijectif, {
	initialize: function($super, klg, tries) {
		this.klg = klg;
		this.tries = tries;
		$super('Resolution');
	},
	transform: function(xpr) {
		if('ior3'== xpr.expression && this.klg.name == xpr.klgRef)
			return xpr.values[this.tries[xpr.ndx]];
		return nul.browser.bijectif.unchanged;
	},
});/*  NUL language JavaScript framework
 *  (c) 2009 E-med Ware
 *
 * NUL is freely distributable under the terms of GNU GPLv3 license.
 *  For details, see the NUL project site : http://code.google.com/p/nul/
 *
 *--------------------------------------------------------------------------*/

/**
 * A list of conditions and fuzziness reduction.
 */
nul.xpr.knowledge = Class.create(nul.expression, {
	initialize: function(klgName) {
 		//Create new objects each time
        this.locals = this.emptyLocals();
        this.veto = [];
 		this.eqCls = [];		//Array of equivalence classes.
 		this.access = {};		//Access from an obj.ndx to an eq class it's in.
 		this.ior3 = [];	//List of unchoosed IOR3
 		this.name = klgName || ++nul.xpr.knowledge.nameSpace;
 		//this.mult = 1;	//TODO0: 'mult' optimisation
 	},

//////////////// privates

	/**
	 * Modify eqCls and set accesses
	 */
 	accede: function(ec, ecNdx) {
		this.modify(); nul.xpr.use(ec, nul.xpr.knowledge.eqClass);

		if('undefined'== typeof ecNdx) ecNdx = this.eqCls.length;
		if(ec) ec = ec.placed(this);
		if(ec) {
			for(var n in this.access) if(this.access[n] == ecNdx) delete this.access[n];
	 		this.eqCls[ecNdx] = ec;
			var eqs = this.eqCls[ecNdx].equivls;
			for(var unfd in eqs) if(cstmNdx(unfd))
				this.access[eqs[unfd]] = ecNdx;
		}
		else this.unaccede(ecNdx);
		return ec;
 	},
 	
	/**
	 * The eqCls of index 'ndx' has been removed : change access
	 */
	unaccede: function(ecNdx) {
		try { return this.eqCls[ecNdx]; }
		finally {
			this.eqCls.splice(ecNdx, 1);
			for(var i in this.access)
				if(this.access[i] > ecNdx) --this.access[i];
				else if(this.access[i] == ecNdx) delete this.access[i];
		}
	},
 	
 	/**
 	 * Begin modification of an equivalence class
 	 * @param {nul.obj} obj Object whose information is brought
 	 * @return equivalence class to re-add to the knowledge
 	 */
	inform: function(obj) {
		this.modify();
		
		var ndx = this.access[obj];
		if('number'== typeof ndx) return this.unaccede(ndx).modifiable();
 		return new nul.xpr.knowledge.eqClass(obj);
	},
 	
 	/**
 	 * Add the given equivalence classes in this knowledge
 	 * @param {array(nul.xpr.knowledge.eqClass)} eqCls
 	 * @throws nul.failure
 	 */
 	addEqCls: function(eqCls) {
 		nul.xpr.use(eqCls, nul.xpr.knowledge.eqCls);
 		for(var ec in eqCls) if(cstmNdx(ec) && eqCls[ec]) this.unify(eqCls[ec]);
 	},
 	
 	/**
 	 * Remove any information about locals or ior3s that are not refered anymore
 	 * @param {nul.dependance.usage} deps
 	 * remove all access before : these are not preserved
 	 */
 	pruned: function(value) {
 		this.modify();
 		var i;
 		var vdps = new nul.dependance();
		
		vdps.also(value.dependance());
		for(var i in this.ior3) if(cstmNdx(i) && this.ior3[i]) vdps.also(this.ior3[i].dependance());
		vdps = this.localNeed(vdps.usage(this).local);

		//Remove useless equivalence class specifications
		for(var c=0; c<this.eqCls.length;) {
			this.eqCls[c] = this.eqCls[c].pruned(this, vdps);
			if(!this.eqCls[c]) this.eqCls.splice(c,1);
			else ++c;
		} 
 		
 		var deps = this.usage(value);
 		/*TODO0: 'mult' optimisation
		//Remove unrefered ior3 tautologies, affect the 'mult' property 
 		for(i=0; i<this.ior3.length; ++i) if(!deps.ior3[i]) {
 			var nior3 = this.ior3[i].modifiable();
 			if(nior3.unrefer()) this.ior3[i] = nior3.built().placed(this);
 		}
 		
 		//Remove trailing empty ior3s (not more to preserve indexes)
 		while(this.ior3.length && !this.ior3[this.ior3.length-1]) this.ior3.pop();
 		*/
 		this.useIor3Choices(deps.ior3);
 		
 		//Remove trailing unrefered locals (not more to preserve indexes)
		while(this.nbrLocals() && !deps.local[this.nbrLocals()-1]) this.freeLastLocal();
 		this.useLocalNames(deps.local);
 		return this;
 	}.describe('Prune', function(value) {
		return this.name+': ' + value.dbgHtml() + ' ; ' + this.dbgHtml();
	}),
 	
 	/**
 	 * Gets the dependance of an hypothetic possible while this knowledge is not summarised.
 	 */
 	usage: function(value) {
 		//TODO0: use summary if possible.
		var rv = new nul.dependance();
		var comps = value?[value]:[];
		comps.pushs(this.eqCls, this.ior3);
		for(var c=0; c<comps.length; ++c)
			rv.also(comps[c].dependance());
		return rv.use(this);
	},

	/**
	 * Make the need envelope of locals.
	 * If at least 'lcls' are needed to determine a value, then determine which locals are needed
	 * to determine a value, for this knowledge, regarding the equivalence classes
	 * @param {association(ndx: any)} lcls List of needed locals at least
	 * @return {association(ndx: true)} lcls List of needed locals
	 */
	localNeed: function(lcls) {
		lcls = map(lcls,function() { return 3; });
		var toNeed = keys(lcls);
		///1: calculate influences
		var max = function(a,b) { return !a?b:!b?a:a>b?a:b; };
		/**
		 * Change the list of local needs and determine which local is discovered needed
		 * knowing that local 'ndx' is needed 'infl' (infl = 1(belong) or 2(equival))
		 * @param {index} ndx Local index
		 * @param {association(ndx:influence)} infl Influence = 1: something belongs to this local. 2: Something is equived to this local
		 * @param {association(ndx:need)} lcls how locals are already known to be needed
		 * @return {array[index]} Locals freshly disvorered to be needed
		 */
		var influence = function(infl, lcls) {
/*(infl[ndx] \ lcls[ndx] :	('>' means 'more than 2')
 * 			0	1	2	>
 * 		1	1	1	>	>
 * 		2	2	>	>	>
 */
 			var rv = [];
 			for(var ndx in infl)
				if( (1!= lcls[ndx] || 1!= infl[ndx]) &&	
					(!lcls[ndx] || 2>= lcls[ndx]) &&
					(2< (lcls[ndx] = (lcls[ndx]||0)+infl[ndx])) )
						rv.push(ndx);
			return rv;
		};
		//TODO1: need opposition
		var lclInfl = {};	//nx => {ndx: [0, 1, 2]}
		//	0: no need
		//	1: define content
		//	2: define equivalence
		for(var c=0; c<this.eqCls.length; ++c) {
			var ec = this.eqCls[c];
			var elms = ec.summary('components');
			var extInfl = false;
			
			//Compute influence from other knowledge.
			// If influence from several elements, influence the whole class
			// If influence from only one element, influence the class without that element 
			for(var e in elms) if(cstmNdx(e)) {
				if(elms[e].dependance().otherThan(this)) {
					extInfl = extInfl?true:e;
					if(true=== extInfl) break;
				}
			}
			//If this refer to something defined by its attributes
			if(true!== extInfl && !isEmpty(ec.attribs,[''])) extInfl = extInfl?true:'attribs:*';
			//If this refer to something equaled in absolute
			if(true!== extInfl && this.eqCls[c].eqvlDefined()) extInfl = extInfl?true:'equivls:0';
			//If this refer to something beblonging in absolute
			if(true!== extInfl && this.eqCls[c].blngDefined()) extInfl = extInfl?true:'belongs:0';
			
			if(extInfl) //If this refer to something defined in another context
				toNeed.pushs(influence(ec.influence(this, extInfl), lcls));
			if(true!== extInfl) for(var e in elms) if(cstmNdx(e)) {
				//var usg = elms[e].dependance().usage(this).local;
				//For each usage of this element, influence each other usage of the eqclass
				for(var srcNdx in elms[e].dependance().usage(this).local)
					lclInfl[srcNdx] = ec.influence(this, e, extInfl, lclInfl[srcNdx]);
			}
		}
		//2: use influence to need all influenced locals
		while(toNeed.length)
			toNeed.pushs(influence(lclInfl[toNeed.shift()], lcls));
		return map(lcls,function(i, o) { return 3<=o; });
	},
	
  	/**
 	 * Know that all the arguments are unifiable
 	 * Modifies the knowledge
 	 * @param {nul.xpr.object} and {nul.xpr.knowledge.eqCls}
 	 * @return {nul.xpr.knowledge.eqCls} unsummarised
 	 * @throws nul.failure
 	 */
 	unification: function() { 	
 		var toUnify = beArrg(arguments);
 		this.modify(); nul.xpr.use(toUnify);
 		var dstEqCls = new nul.xpr.knowledge.eqClass();
 		var alreadyEqd = {}, alreadyBlg = {};
 		var toBelong = [];
 		var abrtVal = nul.xpr.knowledge.cloneData(this);	//Save datas in case of failure
 		try {
	 		while(toUnify.length || toBelong.length) {
	 			while(toUnify.length) {
		 			var v = toUnify.shift();
		 			if('undefined'!= typeof this.access[v]) {
		 				v = this.access[v];
		 				var ec = this.eqCls[v];
		 				this.unaccede(v);
	 					v = ec;
		 			}
		 			if(!v) {}
		 			else if('eqCls'== v.expression) {
		 				toUnify.pushs(v.equivls);
						toBelong.pushs(v.belongs);
						toUnify.pushs(dstEqCls.hasAttr(v.attribs, this));
		 			} else if(!alreadyEqd[v]) {
		 				toUnify.pushs(dstEqCls.isEq(v, this));
		 				alreadyEqd[v] = true;
		 			}
		 		}
		 		if(toBelong.length) {
		 			var unf = dstEqCls.equivls[0];
		 			if(nul.debug.assert) assert(unf, 'Has some value when time to belong');
		 			var s = toBelong.shift();
					var chx = s.has(unf);
					if(chx) {
						switch(chx.length) {
						case 0:
							nul.fail('Unification failed');
						case 1:
							if('possible'== chx[0].expression) {
								toUnify.push(this.merge(chx[0].knowledge, chx[0].value));
								//TODO0: Reset unification, to do it knowing the newly brought knowledge
								//useful ??!?
								
								alreadyEqd = {};
								alreadyBlg = {};
								toUnify.pushs(dstEqCls.equivls);
								toBelong.pushs(dstEqCls.belongs);
								dstEqCls.equivls = [];
								dstEqCls.belongs = [];
							} else toUnify.push(chx[0]);
							break;
						default:
							var vals = [];
							var klgs = [];
							map(chx, function() {
								var p = nul.xpr.possible.cast(this);
								var klg = p.knowledge.modifiable();
								klg.unify(p.value, unf);
								klgs.push(klg.built());
							});
					 		this.ior3.push(new nul.xpr.knowledge.ior3(klgs));
						}					
					}
					else if(!alreadyBlg[s]) {
						alreadyBlg[s] = true;
						dstEqCls.isIn(s, this);
					}
		 		}
	 		}
 		} catch(err) {
 			nul.xpr.knowledge.cloneData(abrtVal, this);
 			throw nul.exception.notice(err);
 		}
		nul.debug.log('Knowledge')('EqCls '+this.name, dstEqCls.equivls);
		return dstEqCls;
 	}.describe('Unification', function() {
 		return map(beArrg(arguments), function() { return this.dbgHtml(); }).join(' = ');
 	}),
 	
 //////////////// publics

 	/**
 	 * Gets a value out of these choices
 	 * @param {array} choices of nul.xpr.possible
 	 * @return nul.xpr.object
 	 */
 	hesitate: function(choices) {
 		choices = beArrg(arguments);
 		this.modify();
		switch(choices.length) {
		case 0:
			nul.fail('No choices');
		case 1:
			return choices[0].valueKnowing(this);
		default:
			var vals = [];
			var klgs = [];
			map(choices, function() {
				var p = nul.xpr.possible.cast(this);
				vals.push(p.value);
				klgs.push(p.knowledge);
			});
			try { return new nul.obj.ior3(this.name, this.ior3.length, vals); }
	 		finally { this.ior3.push(new nul.xpr.knowledge.ior3(klgs)); }
		}
	},
 	
 	/**
 	 * Know all what klg knows
 	 * @return {nul.xpr.object} Value expressed under this knowledge
 	 * @throws {nul.failure}
 	 */
 	merge: function(klg, val) {
 		if(nul.xpr.knowledge.never== klg) nul.fail('Merging failure');
 		if(nul.xpr.knowledge.always== klg) return val;
 		
 		this.modify(); nul.xpr.use(klg, nul.xpr.knowledge);

 		var brwsr = new nul.xpr.knowledge.stepUp(klg, this.name, this.ior3.length, this.nbrLocals());
		
 		this.concatLocals(klg);
		klg = brwsr.browse(klg);

		this.addEqCls(klg.eqCls);
		this.ior3.pushs(klg.ior3);
 		this.veto.pushs(klg.veto);
 		
 		if(val) return brwsr.browse(val);
 	},

 	/**
 	 * Know that all the arguments are unifiable
 	 * Modifies the knowledge
 	 * @param {nul.xpr.object} and {nul.xpr.knowledge.eqCls}
 	 * @return nul.xpr.object The replacement value for all the given values
 	 * @throws nul.failure
 	 */
 	unify: function(a, b) {
 		return this.unification(beArrg(arguments)).taken(this);
 	},
 	 	
	/**
 	 * Know that 'e' is in the sets 'ss'.
 	 * Modifies the knowledge
 	 * @return The replacement value for 'e' or nothing if inclusion failed.
 	 * @throws nul.failure
 	 */
 	belong: function(e, ss) {
 		this.modify(); nul.obj.use(e); nul.obj.use(ss);
		
 		ss = beArrg(arguments, 1);
 		if(!ss.length) return e;
 		var dstEC = this.inform(e);
 		for(var s in ss) if(cstmNdx(s)) dstEC.isIn(ss[s], this);
 		return dstEC.taken(this);
 	},
 	
 	/**
 	 * States that 'e.anm = vl'
 	 * @param {nul.xpr.object} e
 	 * @param {string} anm
 	 * @param {nul.xpr.object} vl
 	 * @return {nul.xpr.object}
 	 * @throws {nul.failure}
 	 */
 	attribute: function(e, anm, vl) {
 		this.modify(); nul.obj.use(e); nul.obj.use(vl);
 		var attrs = {};
 		if(vl) attrs[anm] = vl;
 		else attrs = anm;
 		
 		var ec = new nul.xpr.knowledge.eqClass(e, attrs).built();
 		return this.unify(ec);
 	},

	/**
	 * Brings a knowledge in opposition
	 */
	oppose: function(klg) {
		this.modify(); nul.xpr.use(klg, nul.xpr.knowledge);
		if(klg.veto && klg.veto.length) {
			klg = klg.modifiable();
			while(klg.veto.length) this.merge(klg.veto.pop());
			klg = klg.built();
		}
		if(0< klg.minXst()) nul.fail('Opposition : ', klg);
		if(nul.xpr.knowledge.never!= klg) this.veto.push(klg);
		return this;
	},
	 
 	/**
 	 * Get a pruned possible
 	 * @param {nul.xpr.object} value
	 * @return nul.xpr.possible or  nul.xpr.object
 	 */
 	wrap: function(value) {
 		this.modify(); nul.obj.use(value);
		var representer = new nul.xpr.knowledge.eqClass.represent(this.eqCls);
		
		for(var i=0; i<this.eqCls.length;) {
			var nec = representer.subBrowse(this.eqCls[i]);
			if(nul.browser.bijectif.unchanged == nec) ++i;
			else {
				this.unaccede(i);
				nec = this.unification(nec).built();
				if(nec) this.accede(nec);
				representer = new nul.xpr.knowledge.eqClass.represent(this.eqCls);
				nul.debug.log('Represent')('Representation', this);
				i = 0;
			}
		}

//TODO0: represent sur ior3s : useful or post-resolution ?
		value = representer.browse(value);
		
		var opposition = this.veto;
		this.veto = [];
		while(opposition.length)
			this.oppose(representer.browse(opposition.shift()));
 		this.pruned(value);
 		
 		return new nul.xpr.possible(value, this.built());
 	}.describe('Wrapping', function(value) {
 		//TODO4: standardise the knowledge name in logs
		return this.name+': ' + value.dbgHtml() + ' ; ' + this.dbgHtml();
	}),

//////////////// Existence summaries

	maxXst: nul.summary('maxXst'), 	
	minXst: nul.summary('minXst'), 	
	sum_maxXst: function() {
		var rv = 1;
		for(var h in this.ior3) if(cstmNdx(h))
			rv *= this.ior3[h].maxXst();
		return rv;
	},
	sum_minXst: function() {
		if(this.eqCls.length || this.veto.length) return 0;
		var rv = 1;
		for(var h in this.ior3) if(cstmNdx(h))
			rv *= this.ior3[h].minXst();
		return rv;
	},

	sum_index: function() {
		return this.indexedSub(this.name, this.eqCls, this.ior3);
	},
	
//////////////// nul.expression implementation
	
	expression: 'klg',
	components: ['eqCls','ior3','veto'],
	modifiable: function($super) {
		var rv = $super();
		rv.eqCls = [];
		rv.access = {};
		for(var i=0; i<this.eqCls.length; ++i)
			rv.accede(this.eqCls[i], i);
		rv.ior3 = clone1(rv.ior3);
		rv.locals = clone1(rv.locals);
		rv.veto = clone1(rv.veto);
		return rv;
	},
	
	chew: function($super) {
		var nwEqCls = this.eqCls;
		var nwOppstn = this.veto;
		this.veto = [];
		this.eqCls = [];
		this.access = {};
		this.addEqCls(nwEqCls);
		while(nwOppstn.length) this.oppose(nwOppstn.shift());
		return $super();
	},
	
 	built: function($super) {
		delete this.access;
		//if(0== this.mult) return nul.xpr.knowledge.never;
 		if(this.isFixed()) return nul.xpr.knowledge.always; 
 		return $super();
 	},
 	isFixed: function() {
 		return (!this.eqCls.length && !this.nbrLocals() && !this.ior3.length && !this.veto.length);
 	},
});

nul.xpr.knowledge.stepUp = Class.create(nul.browser.bijectif, {
	initialize: function($super, srcKlg, dstKlgRef, deltaIor3ndx, deltaLclNdx) {
		this.srcKlg = srcKlg;
		this.dstKlgRef = dstKlgRef;
		this.deltaIor3ndx = deltaIor3ndx || 0;
		this.deltaLclNdx = deltaLclNdx || 0;
		$super('StepUp');
	},
	transform: function(xpr) {
		if('local'== xpr.expression && this.srcKlg.name == xpr.klgRef )
			return new nul.obj.local(this.dstKlgRef, xpr.ndx+this.deltaLclNdx, xpr.dbgName);
		if('ior3'== xpr.expression && this.srcKlg.name  == xpr.klgRef )
			return new nul.obj.ior3(this.dstKlgRef, xpr.ndx+this.deltaIor3ndx, xpr.values);
		return nul.browser.bijectif.unchanged;
	},
});

/**
 * Private use !
 * Cone thedata from a knowledge (or a save object) to another knowledge (or a save object)
 */
nul.xpr.knowledge.cloneData = function(src, dst) {
	if(!dst) dst = {};
	dst.eqCls = clone1(src.eqCls);
	dst.access = clone1(src.access);
	dst.ior3 = clone1(src.ior3);
	dst.locals = clone1(src.locals);
	return dst;	
};

if(nul.debug) merge(nul.xpr.knowledge.prototype, {

	/**
	 * Use the ior3 choices to textualise ior3 references.
	 */
	useIor3Choices: function(keep) {
		for(var i=0; i<this.ior3.length; ++i)
			if(keep[i]) for(var l = 0; l<keep[i].length; ++l)
				keep[i][l].invalidateTexts(this.ior3[i].choices);
	},

	/**
	 * Remove the names of the unused locals.
	 * Use the local names to textualise locals references.
	 */
	useLocalNames: function(keep) {
		for(var i=0; i<this.locals.length; ++i)
			if(!keep[i]) this.locals[i] = null;
			else for(var l = 0; l<keep[i].length; ++l)		//TODO0: useful ? locals should have correct dbgName now
				keep[i][l].invalidateTexts(this.locals[i]);
	},

	/**
	 * An empty set of managed locals
	 */
	emptyLocals: function() { return []; },

	/**
	 * This knowledge now manage this new knowledge locals too
	 */
	concatLocals: function(klg) { this.locals.pushs(klg.locals); },
	
	/**
	 * Unallocate the last local
	 */
	freeLastLocal: function() { this.locals.pop(); },
	
	/**
	 * Get the number of locals this knowledge manage
	 */
	nbrLocals: function() { return this.locals.length; },
	
	/**
	 * Register a new local
	 */
 	newLocal: function(name, ndx) {
 		if('undefined'== typeof ndx) ndx = this.locals.length;
		this.locals[ndx] = name;
 		return new nul.obj.local(this.name, ndx, name)
 	},
}); else merge(nul.xpr.knowledge.prototype, {
	/**
	 * Use the ior3 choices to textualise ior3 references.
	 */
	useIor3Choices: function() {},
	
	/**
	 * Remove the names of the unused locals
	 */
	useLocalNames: function(keep) {},

	/**
	 * An empty set of managed locals
	 */
	emptyLocals: function() { return 0; },
	
	/**
	 * This knowledge now manage this new knowledge locals too
	 */
	concatLocals: function(klg) { this.locals += klg.locals; },
	
	/**
	 * Unallocate the last local
	 */
	freeLastLocal: function() { --this.locals; },
	
	/**
	 * Get the number of locals this knowledge manage
	 */
	nbrLocals: function() { return this.locals; },
	
	/**
	 * Register a new local
	 */
 	newLocal: function(name, ndx) {
 		if('undefined'== typeof ndx) ndx = this.locals++;
 		return new nul.obj.local(this.name, ndx)
 	},
});

nul.xpr.knowledge.never = nul.xpr.knowledge.prototype.failure = new (Class.create(nul.expression, {
	initialize: function() { this.alreadyBuilt(); },
	expression: 'klg',
	name: 'Failure',
	modifiable: function() { return this; },
	wrap: function(value) { return nul.xpr.failure; },
	components: [],
	minXst: function() { return 0; },
	maxXst: function() { return 0; },
}))();

nul.xpr.knowledge.always = new (Class.create(nul.expression, {
	initialize: function() { this.alreadyBuilt(); },
	expression: 'klg',
	name: 'Always',
	modifiable: function() { return new nul.xpr.knowledge(); },
	wrap: function(value) { return new nul.xpr.possible.cast(value); },
	components: [],
	ior3: [],
	isFixed: function() { return true; },
	minXst: function() { return 1; },
	maxXst: function() { return 1; },
}))();

nul.xpr.knowledge.unification = function(objs) {
	objs = beArrg(arguments);
	nul.obj.use(objs);
	var klg = new nul.xpr.knowledge();
	klg.unify(objs);
	return klg.built();
};/*  NUL language JavaScript framework
 *  (c) 2009 E-med Ware
 *
 * NUL is freely distributable under the terms of GNU GPLv3 license.
 *  For details, see the NUL project site : http://code.google.com/p/nul/
 *
 *--------------------------------------------------------------------------*/

/**
 * A piece of knowledge:
 * A set of objects known equivalents and a set of items they are known to belong to. 
 */
nul.xpr.knowledge.eqClass = Class.create(nul.expression, {
	initialize: function(obj, attr) {
 		if(obj && 'eqCls'== obj.expression) {
			this.equivls = clone1(obj.equivls);	//Equal values
			this.belongs = clone1(obj.belongs);	//Sets the values belong to
			this.attribs = clone1(obj.attribs);	//Sets the attributes owned
 		} else {
			this.equivls = obj?[obj]:[];
			this.belongs = [];
			this.attribs = nul.xpr.beBunch(attr);
		}
	},

//////////////// private
	
	/**
	 * Order the values to equal.
	 * @param {nul.xpr.object} v
	 * @param {nul.xpr.knowledge} klg 
	 * @return A big number if not interesting, a small one if a good "replacement value"
	 * Note: v is undefined 
	 */
	orderEqs: function(v, klg) {
		if(v.defined) return -1;
		var d = v.dependance();
		var rv = 0;
		if(d.otherThan(klg)) rv += 1;
		if(!isEmpty(d.usage(klg).local)) rv += 2;
		if(!isEmpty(d.usage(klg).ior3)) rv += 4;
		return rv;
	},

//////////////// internal

	/**
	 * Build and get a representative value for this class.
	 */
	taken: function(knowledge) {
		try { return this.equivls[0]; }
		finally {
			var rec = this.built();
			if(rec) knowledge.accede(rec);
		}
	},

//////////////// public

	/**
	 * Add an object in the equivlence.
	 * @param {nul.xpr.object} o object to add
	 * @return array(nul.xpr.object) Array of objects to equal to this eqCls afterward
	 * @throws nul.failure
	 */
	isEq: function(o, klg) {
 		this.modify(); nul.obj.use(o);
		var rv = [];
		//Add an object to the equivalence class
		nul.obj.use(o);
		if(o.defined) {
			if(this.eqvlDefined())
				try {
					nul.xpr.mod(klg, nul.xpr.knowledge);
					var unf;
					try {
						unf = this.equivls[0].unified(o, klg);
					} catch(err) {
						nul.failed(err);
						unf = o.unified(this.equivls[0], klg);
					}
					if(unf && true!== unf) this.equivls[0] = unf;
				} catch(err) {
					nul.failed(err);
					if('lambda'== this.equivls[0].expression) {
						var t = o; o = this.equivls[0]; this.equivls[0] = t;
					}
					if('lambda'== o.expression) rv.pushs([o.point, o.image]);
					else throw err;
				}
			else {
				this.equivls.unshift(o);
				rv.pushs(this.hasAttr(this.attribs, klg));
			}
		} else {
			var p = 0;
			var ordr = this.orderEqs(o, klg);
			for(p=0; p<this.equivls.length; ++p) if(ordr<this.orderEqs(this.equivls[p], klg)) break;
			this.equivls.splice(p,0,o);
		}
		return rv;
	},

	/**
	 * Add an object as a belongs.
	 * @param {nul.xpr.object} o object that belongs the class
	 * @return array(nul.xpr.object) Array of objects to equal to this eqCls afterward
	 * @throws nul.failure
	 */
	isIn: function(s, klg) {
 		this.modify(); s.use();
 		if(s.defined) {
 			if(this.blngDefined()) {
				nul.xpr.mod(klg, nul.xpr.knowledge);
				var ntr;
				try {
					ntr = this.belongs[0].intersect(s, klg);
				} catch(err) {
					nul.failed(err);
					ntr = s.intersect(this.belongs[0], klg);
				}
				if(ntr && true!== ntr) this.belongs[0] = unf;
 			} else this.belongs.unshift(s);
 		} else this.belongs.push(s);
	},
	
	/**
	 * Specify attributes
	 * @param {{string: nul.xpr.object}} attrs 
	 * @return array(nul.xpr.object) Array of objects to equal to this eqCls afterward
	 * @throws nul.failure
	 */
	hasAttr: function(attrs, klg) {
		var rv = [];
		if(this.equivls[0] && 'lambda'== this.equivls[0].expression && !isEmpty(attrs,[''])) {
			var o = this.equivls.shift();
			rv = [o.point, o.image];
		}
		if(!rv.length && this.eqvlDefined()) {
			for(var an in attrs) if(an) klg.unify(attrs[an], this.equivls[0].attribute(an));
			this.attribs = nul.xpr.beBunch();
		} else if(this.attribs !== attrs)
			this.attribs = merge(this.attribs, attrs, function(a,b) {
				return a&&b?klg.unify(a,b):a||b;
			});
		return rv;
	},
	
	/**
	 * The object appears only in this equivalence class.
	 * Retrive an equivalence class that doesn't bother with useless knowledge
	 * @param {nul.xpr.object} o
	 * @return nul.xpr.knowledge.eqClass or null
	 * TODO3: this function is useless
	 */
	unused: function(o) {
		var unused = function(eqc, tbl, str) {
			for(var e=0; e<tbl.length; ++e)
				if(tbl[e].toString() == str) {
					nul.debug.log('Knowledge')('Forget', tbl[e]);
					tbl.splice(e, 1);
					return eqc;
				}
		};
		
		this.use(); nul.obj.use(o);
		var oStr = o.toString();
		var rv = this.modifiable();
		unused = unused(rv, rv.equivls, oStr) || unused(rv, rv.belongs, oStr);
		if(unused) return unused.built();
		return this; 
	},
	
	/**
	 * Compute the influence of this equivalence class (excluded 'exclElm')
	 * @param {nul.xpr.knowledge} klg
	 * @param {string: integer} excl Element to exclude, from the summary.components
	 * @param {association(ndx=>infl)} already The influences already computed (modified by side-effect)
	 * @return {association(ndx=>infl)} Where 'ndx' is a local index and 'infl' 1 or 2 
	 */
	influence: function(klg, excl, only, already) {
		var rv = already || {};
		var eqc = this;
		var destSelect = function(cn, ndx) {
			return excl!= cn+':'+ndx && excl!= cn+':*' && (!only || only==cn+':'+ndx || only==cn+':*')
		};
		var subInfluence = function(cn, infl) {
			if(destSelect(cn))
				for(var e in eqc[cn]) if(cstmNdx(e) && destSelect(cn, e))
					for(var ndx in eqc[cn][e].dependance().usage(klg).local)
						if(!rv[ndx] || rv[ndx]<infl) rv[ndx] = infl;
		}
		subInfluence('equivls', 2);
		subInfluence('belongs', 1);
		subInfluence('attribs', 1);
		return rv;
	},
	
	/**
	 * Remove items that are not used in this knowledge
	 * Not used = depending on nothing else than the useless locals of thisknowledge
	 * @param {nul.xpr.knowledge} klg Pruned knowledge this class belongs to
	 * @param {association(ndx: true)} lcls List of used locals
	 */
	pruned: function(klg, lcls) {
		var remover = function() {
			var deps = this.dependance();
			if(isEmpty(deps.usages)) return this;
			//TODO2: otherThan : only in locals or in ior3 too ?
			if(deps.otherThan(klg)) return this;	//If depends on another knowledge, keep
			deps = deps.usage(klg);
			for(var l in deps.local) if(lcls[l]) return this;	//If depends on a needed local, keep
		};
		var nVals = maf(this.equivls, remover);
		var nBlgs = maf(this.belongs, remover);
		//TODO3: FA: do we forget attributes ?
		//FA var nAtts = maf(this.attribs, remover);
		if(nVals.length == this.equivls.length && nBlgs.length == this.belongs.length
			/*FA && nAtts.length == this.attribs.length*/) return this;
		var rv = this.modifiable();
		rv.equivls = nVals;
		rv.belongs = nBlgs;
		//FA rv.attribs = nAtts;
		return rv.built().placed(klg); 
	},
	
	eqvlDefined: function() { return this.equivls.length && this.equivls[0].defined; },
	blngDefined: function() { return this.belongs.length && this.belongs[0].defined; },
	
//////////////// nul.expression implementation
	
	expression: 'eqCls',
	components: ['equivls', 'belongs', 'attribs'],
	modifiable: function($super) {
		var rv = $super();
		rv.equivls = clone1(rv.equivls);	//Equal values
		rv.belongs = clone1(rv.belongs);	//Sets the values belong to
		rv.attribs = nul.xpr.beBunch(clone1(rv.attribs));
		return rv;		
	},
	fix: function($super) {
		return $super();
	},
	placed: function($super, prnt) {
		nul.xpr.mod(prnt, nul.xpr.knowledge);
		if(!this.equivls.length && isEmpty(this.attribs,['']) && 1== this.belongs.length && this.blngDefined()) {
			if('&phi;'== this.belongs[0].expression) nul.fail("&phi; is empty");
			return;
		}
		if(!this.belongs.length && (!this.equivls.length || 
			(1== this.equivls.length && isEmpty(this.attribs,['']))))
				return;
		return $super(prnt);
	},
});

nul.xpr.knowledge.eqClass.represent = Class.create(nul.browser.chewer, {
	initialize: function($super, ec) {
		this.tbl = {};
		for(var c in ec) if(cstmNdx(c)) {
			this.invalidateCache();
			nul.xpr.use(ec[c], nul.xpr.knowledge.eqClass);
			for(var e=1; e<ec[c].equivls.length; ++e)
				this.tbl[ec[c].equivls[e]] = ec[c].equivls[0];
		}
		$super('Representation');
		this.prepStack = [];
	},
	subBrowse: function(xpr) {
		nul.xpr.use(xpr, nul.xpr.knowledge.eqClass);
		this.protect = [];
		for(var i=0; i<xpr.equivls.length; ++i) this.protect[xpr.equivls[i]] = xpr.equivls[i];
		try { return this.recursion(xpr); }
		finally {
			for(var i in this.protect) this.uncache(this.protect[i]);
			delete this.protect;
		}
	},
	prepare: function($super, xpr) {
		this.prepStack.push(xpr);
		return $super();
	},
	transform: function(xpr) {
		this.prepStack.pop();
		if((this.protect && this.protect[xpr]) || !this.tbl[xpr]) return nul.browser.bijectif.unchanged;
		do xpr = this.tbl[xpr]; while(this.tbl[xpr]);
		//If I'm replacing a value by an expression that contains this value, just don't
		if(this.prepStack.contains(xpr))
			return nul.browser.bijectif.unchanged;
		return xpr;
	},
});/*  NUL language JavaScript framework
 *  (c) 2009 E-med Ware
 *
 * NUL is freely distributable under the terms of GNU GPLv3 license.
 *  For details, see the NUL project site : http://code.google.com/p/nul/
 *
 *--------------------------------------------------------------------------*/

/**
 * A set of possible values, bound to a knowledge hesitations
 */
nul.xpr.knowledge.ior3 = Class.create(nul.expression, {
	initialize: function(choices) {
		this.choices = choices;
		//this.mult = 0;	//TODO0: 'mult' optimisation
		this.alreadyBuilt();
	},

//////////////// Internal

	/**
	 * Specify this cases are not refered by any nul.obj.ior3
	 * @return {bool} weither something changed
	 */
	unrefer: function() {	//TODO0: 'mult' optimisation
		var ol = this.choices.length;
		for(var j=0; j<this.choices.length;) 
			if(!this.choices[j]) {
				++this.mult;
				this.choices.splice(j, 1);
			} else ++j;
		return ol != this.choices.length;
	},

//////////////// Existence summaries

	maxXst: nul.summary('maxXst'), 	
	minXst: nul.summary('minXst'), 	
	sum_maxXst: function() {
		var rv = 1;
		for(var h in this.ior3) if(cstmNdx(h))
			rv *= this.ior3[h].maxXst();
		return rv;
	},
	sum_minXst: function() {
		if(this.eqCls.length) return 0;
		var rv = 1;
		for(var h in this.ior3) if(cstmNdx(h))
			rv *= this.ior3[h].minXst();
		return rv;
	},

//////////////// nul.expression implementation

	expression: 'kior3',
	components: ['choices'],
	placed: function($super, prnt) {
		nul.xpr.mod(prnt, nul.xpr.knowledge);
 		if(!this.choices.length) {	//TODO0: 'mult' optimisation
 			prnt.mult *= this.mult;
 			return;
 		} 
		return $super(prnt);
	},
});/*  NUL language JavaScript framework
 *  (c) 2009 E-med Ware
 *
 * NUL is freely distributable under the terms of GNU GPLv3 license.
 *  For details, see the NUL project site : http://code.google.com/p/nul/
 *
 *--------------------------------------------------------------------------*/

/**
 * A possible value; refering a value and a condition
 */
nul.xpr.possible = Class.create(nul.expression, {
	initialize: function(value, knowledge) {
		if(!knowledge) knowledge = nul.xpr.knowledge.always;
		nul.obj.use(value); nul.xpr.use(knowledge, nul.xpr.knowledge);
		this.value = value;
		this.knowledge = knowledge;
		this.alreadyBuilt();
	},

//////////////// public

	/**
	 * 'klg' now knows all what this possible knows
	 * @param {nul.xpr.knowledge} klg destination knowledge
	 * @return nul.xpr.object This modified value (to refer the new knowledge)
	 */
	valueKnowing: function(klg) {
		return klg.merge(this.knowledge, this.value);
	},
	
	/**
	 * Returns a possible, this unified to o.
	 * @param {nul.xpr.object} o
	 * @return {nul.xpr.possible}
	 */
	unified: function(o) {
		var klg = this.knowledge.modifiable();
		return klg.wrap(klg.unify(this.value, o));
	},
	
	/**
	 * Determine wether the resolution engine can change anything
	 * @return {bool}
	 */
	distribuable: function() {
		return !!this.knowledge.ior3.length;
	},
	
	/**
	 * Use the resolution engine : make severa possibles without ior3
	 * @return {array(nul.xpr.possible)}
	 */
	distribute: function() {
		if(this.knowledge.ior3.length) return nul.solve(this);
		return [this];
	},
	
//////////////// nul.expression summaries

	sum_dependance: function($super) {
		var rv = $super();
		this.usage = rv.use(this.knowledge);
		return rv;
	},

//////////////// nul.expression implementation
	
	expression: 'possible',
	components: ['value','knowledge'],
	chew: function() {
		return this.knowledge.modifiable().wrap(this.value);
	},	
	fix: function($super) {
		assert(this.knowledge, 'Possible now always has a knowledge');
		return $super();
	},
});

nul.xpr.failure = new (Class.create(nul.expression, {
	initialize: function() { this.alreadyBuilt(); },
	expression: 'possible',
	components: [],
	distribuable: function() { return true; },
	distribute: function() { return []; },
}))();

/**
 * Have a possible for sure. Made with nul.xpr.knowledge.always if an object is given
 * @param {nul.xpr.possible or nul.xpr.object} o
 */
nul.xpr.possible.cast = function(o) {
	if('possible'== o.expression) return o;
	return new nul.xpr.possible(o);
};
/*  NUL language JavaScript framework
 *  (c) 2009 E-med Ware
 *
 * NUL is freely distributable under the terms of GNU GPLv3 license.
 *  For details, see the NUL project site : http://code.google.com/p/nul/
 *
 *--------------------------------------------------------------------------*/

nul.xpr.object = Class.create(nul.expression, {
	object: true,

	/**
	 * Return a list of possibles[nul.xpr.possible] 'o' once it is known that 'o' is in this 'set'
	 * @param {nul.xpr.object} o
	 * @param {nul.xpr.knowledge} klg
	 * @return array(nul.xpr.object or nul.xpr.possible)
	 */
	having: function(o) {
		var rv = this.has(o);
		if(rv) return rv;
		var klg = new nul.xpr.knowledge();
		klg.belong(o, this);
		return [klg.wrap(o)];
	},
	
	/**
	 * Return a list of possibles[nul.xpr.possible] 'o' once it is known that 'o' is in this 'set'
	 * Or nothing if nothing can be simplified
	 * @param {nul.xpr.object} o
	 * @param {nul.xpr.knowledge} klg
	 * @return array(nul.xpr.object or nul.xpr.possible)
	 */
	has: function(o) {},
	
	/**
	 * Abstract defined also by nul.xpr.possible
	 */
	valueKnowing: function(klg) { return this; },
});

nul.obj = {
	are: nul.debug.are('object'),
	is: function(x, t) {
		nul.debug.is('object')(x);
		if(t) {
			t = t.prototype.expression;
			(function() { return x.expression == t; }.asserted('Expected "'+t+'" object'));
		}
	},
	use: function(x, t) {
		if(!nul.xpr.bunch(x)) x = [x];
		if(nul.debug.assert) map(x, function(i, o) {
			nul.obj.is(o, t);
			o.use();
		});
	},
	
	mod: function(x, t) {
		if(!nul.xpr.bunch(x)) x = [x];
		if(nul.debug.assert) map(x, function(i, o) {
			nul.obj.is(o, t);
			o.modify();
		});
	},
};/*  NUL language JavaScript framework
 *  (c) 2009 E-med Ware
 *
 * NUL is freely distributable under the terms of GNU GPLv3 license.
 *  For details, see the NUL project site : http://code.google.com/p/nul/
 *
 *--------------------------------------------------------------------------*/

nul.obj.defined = Class.create(nul.xpr.object, {
	summarise: function($super, smr) {
		$super(smr);
	},
	defined : true,
	
//////////////// public

	/**
	 * Unify two defined objects
	 * @return nul.obj.defined
	 * @throws nul.failure
	 */
	unified: function(o, klg) {
		this.use(); nul.obj.use(o); nul.xpr.mod(klg, nul.xpr.knowledge);
		
		if(o.toString() != this.toString()) nul.fail(this, ' does not unify to ', o);
		return true;
	},
	
	/**
	 * Intersect two defined objects
	 * @return nul.obj.defined
	 * @throws nul.failure
	 */
	intersect: function(o, klg) {
		this.use(); nul.obj.use(o); nul.xpr.mod(klg, nul.xpr.knowledge);
		
		if(o.toString() != this.toString()) nul.fail(this, ' does not intersect with ', o);
		return true;
	},
	
	/**
	 * Retrieve an attribute
	 * @param {string} an Attribute Name
	 * @return {nul.xpr.object}
	 * @throws {nul.failure}
	 */
	attribute: function(an) {
		var af = this.attributes[an];
		if(!af) {
			if(' '!= an) nul.fail(this, 'doesnt have the attribute "'+an+'"');
			return this;	//TODO4: useful ?
		}
		return ('function'== typeof af)?af.apply(this):af;
	},

});
/*  NUL language JavaScript framework
 *  (c) 2009 E-med Ware
 *
 * NUL is freely distributable under the terms of GNU GPLv3 license.
 *  For details, see the NUL project site : http://code.google.com/p/nul/
 *
 *--------------------------------------------------------------------------*/

nul.obj.litteral = Class.create(nul.obj.defined, {
	initialize: function($super, val) {
		this.value = val;
		this.alreadyBuilt();
		$super();
	},
});

nul.obj.litteral.number = Class.create(nul.obj.litteral, {
//////////////// nul.xpr.object implementation

	attributes: {
		
	},

	has: function(o) {
		nul.fail(o, ' doesnt contains anything');
	},
	
//////////////// nul.expression implementation

	expression: 'number',
	sum_index: function() { return this.indexedSub(this.value.toString().replace(']','[|]')); },
});
nul.obj.litteral.string = Class.create(nul.obj.litteral, {
//////////////// nul.xpr.object implementation

	attributes: {
		'# ': function() { return nul.obj.litteral.make(this.value.length); },
	},

//////////////// nul.expression implementation

	expression: 'string',
	sum_index: function() { return this.indexedSub(this.value.replace(']','[|]')); },
});
nul.obj.litteral['boolean'] = Class.create(nul.obj.litteral, {
//////////////// nul.xpr.object implementation

	attributes: {
		
	},

//////////////// nul.expression implementation

	expression: 'boolean',
	sum_index: function() { return this.indexedSub(this.value?'T':'F'); },
});

/**
 * Make a litteral from a javascript value
 */
nul.obj.litteral.make = function(v) {
	if(nul.debug.assert) assert(nul.obj.litteral[typeof v], (typeof v)+' is a litteral type')
	return new nul.obj.litteral[typeof v](v);
};
/*
nul.obj.litteral.straightArythmetics = function(expression, oprtr, srnd) {
	srnd = srnd || '';
	return function(op1, op2, klg) {
		if(expression== op2.expression) 
			return nul.obj.litteral(eval(
				srnd + op1.value + oprtr + op2.value + srnd
			));
		if(op2.defined) return nul.fail(op2, ' is not a ', expression);
	}
};

nul.obj.litteral.attr = {};
nul.obj.litteral.attr.string = {}
nul.obj.litteral.attr.number = {};

nul.obj.litteral.attr.string['+'] = nul.obj.litteral.straightArythmetics('string','"+"','"');
//TODO4: integers and & | ^
map(['+', '-', '*', '/', '%'],
	function(i,v) { nul.obj.litteral.attr.number[v] = nul.obj.litteral.straightArythmetics('number',v); });
*//*  NUL language JavaScript framework
 *  (c) 2009 E-med Ware
 *
 * NUL is freely distributable under the terms of GNU GPLv3 license.
 *  For details, see the NUL project site : http://code.google.com/p/nul/
 *
 *--------------------------------------------------------------------------*/

nul.obj.pair = Class.create(nul.obj.defined, {
	/**
	 * @param {nul.xpr.possible} first
	 * @param {nul.xpr.object} second
	 */
	initialize: function(first, second) {
		nul.xpr.use(first); nul.obj.use(second);
		this.first = nul.xpr.possible.cast(first);
		this.second = second;
	},
	
//////////////// Summary
	
	listed: nul.summary('listed'),

	sum_listed: function() {
		var rv = [];
		var brwsr = this;
		do {
			rv.push(brwsr.first);
			brwsr = brwsr.second;
		} while('pair'== brwsr.expression);
		if('&phi;'!= brwsr.expression) rv.follow = brwsr;
		return rv;
	},

//////////////// nul.obj.defined implementation

	unified: function(o, klg) {
		if('&phi;'== o.expression) {
			klg.oppose(this.first.knowledge);
			return klg.unify(this.second, o);
		}
		if('pair'!= o.expression) nul.fail(o, ' not a pair');
		if(this.first.knowledge === o.first.knowledge)
			return (new nul.obj.pair(
				klg.unify(this.first.value, o.first.value),
				klg.unify(this.second, o.second))).built();
		//TODO4: unifier les possibles
	},
	
//////////////// nul.xpr.object implementation

	attributes: {
		
	},

	has: function($super, o) {
		this.use(); nul.obj.use(o);
		
		//TODO3: summarise a tree of fixed values (=> ram db)
		//make a table fct also
		var rv = [];
		try {
			var trv = this.first.unified(o);
			if(nul.debug.assert)
				assert(!trv.dependance().usages[this.first.knowledge.name],
					'Out of knowledge, no more deps');
			rv.push(trv);
		} catch(err) { nul.failed(err); }
		return rv.pushs(this.second.having(o));
	},

//////////////// nul.expression implementation

	expression: 'pair',
	components: ['first', 'second'],
	sum_isList: function() {
		return this.first.knowledge.isFixed() && this.second.isList();
	},
	built: function($super) {
		if(!this.first.distribuable()) return $super();
		return nul.obj.pair.list(this.second, this.first.distribute());
	},
});

nul.obj.pair.list = function(flw, elms) {
	elms = beArrg(arguments, 1);
	nul.xpr.use(elms);
	var rv = flw?flw:nul.obj.empty;
	while(elms.length) rv = (new nul.obj.pair(elms.pop(), rv)).built();
	return rv;
};/*  NUL language JavaScript framework
 *  (c) 2009 E-med Ware
 *
 * NUL is freely distributable under the terms of GNU GPLv3 license.
 *  For details, see the NUL project site : http://code.google.com/p/nul/
 *
 *--------------------------------------------------------------------------*/

nul.obj.hcSet = Class.create(nul.obj.defined, {
	initialize: function() {
		this.alreadyBuilt();
	},
	
	/**
	 * Consider this set is not a transformation
	 */
	has: function($super, o) {
		nul.obj.use(o);
		if(o.isInSet) return [o.isInSet(this)];
		if(o.defined) return [];
		return $super(o);
	},
	
//////////////// nul.obj.defined implementation

	attributes: {
		'# ': function() { return nul.obj.litteral.make(pinf); },
	},

});

nul.obj.empty = new (Class.create(nul.obj.hcSet, {
	intersect: function(o) {
		nul.fail('No intersection with ', this);
	},
	has: function() { return []; },
	
	expression: '&phi;',
	
//////////////// nul.obj.defined implementation

	attributes: {
		'# ': function() { return nul.obj.litteral.make(0); },
	},
	
}))();

nul.obj.number = new (Class.create(nul.obj.hcSet, {
	intersect: function($super, o, klg) {
		if('range'== o.expression) return o;
		return $super(o, klg);
	},
	has: function($super, o) {
		if('number'== o.expression) return [o];
		return $super(o);
	},
	expression: '&#x211a;',
}))();

nul.obj.string = new (Class.create(nul.obj.hcSet, {
	has: function($super, o) {
		if('string'== o.expression) return [o];
		return $super(o);
	},
	expression: 'str',
}))();

nul.obj.bool = new (Class.create(nul.obj.hcSet, {
	has: function($super, o) {
		if('boolean'== o.expression) return [o];
		return $super(o);
	},
	expression: 'bool',
}))();

nul.obj.range = Class.create(nul.obj.hcSet, {
	intersect: function($super, o, klg) {
		if('range'== o.expression) {
			var lwr = this.lower<o.lower?o.lower:this.lower;
			var upr = this.upper>o.upper?o.upper:this.upper;
			if(lwr > upr) return [];
			return new nul.obj.range(lwr, upr);
		}
		return $super(o, klg);
	},
	initialize: function($super, lwr, upr) {
		this.lower = lwr?parseInt(lwr):ninf;
		this.upper = upr?parseInt(upr):pinf;
		$super();
	},
	has: function($super, o) {
		if(this.lower==this.upper && !o.defined) {
			//TODO3: return "o=nbr[this.bound]"
		}
		if(!o.defined || 'number'!= o.expression) return $super(o);
		if(!nul.isJsInt(o.value)) return [];
		if( o.value < this.lower || o.value > this.upper) return [];
		return [o];
	},

//////////////// nul.obj.defined implementation

	unified: function(o, klg) {
		this.use(); nul.obj.use(o); nul.xpr.mod(klg, nul.xpr.knowledge);
		
		if('range'== o.expression) return (o.lower==this.lower && o.upper==this.upper);
		if('pair'!= o.expression) nul.fail(o, ' is not a range nor a pair');
		if(ninf== this.lower) nul.fail(this, ' has no first');
		//TODO0: warn if(pinf== this.upper) : queue infinie
		klg.unify(nul.obj.litteral.make(this.lower), o.first.value);
		klg.unify(
			(this.lower == this.upper) ?
				nul.obj.empty :
				new nul.obj.range(this.lower+1, this.upper),
			o.second);
		return this;
	},

	attributes: {
		'# ': function() {
			if(ninf== this.lower || pinf== this.upper)
				return nul.obj.litteral.make(pinf);
			return nul.obj.litteral.make(this.upper-this.lower+1);
		},
	},

//////////////// nul.expression implementation

	expression: 'range',
	sum_index: function() { return this.indexedSub(this.lower, this.upper); },
});

nul.globals.Q = nul.obj.number;
nul.globals.str = nul.obj.string;
nul.globals.bool = nul.obj.bool;
/*  NUL language JavaScript framework
 *  (c) 2009 E-med Ware
 *
 * NUL is freely distributable under the terms of GNU GPLv3 license.
 *  For details, see the NUL project site : http://code.google.com/p/nul/
 *
 *--------------------------------------------------------------------------*/

nul.obj.lambda = Class.create(nul.obj.defined, {
	/**
	 * @param {nul.xpr.object} point
	 * @param {nul.xpr.object} image
	 */
	initialize: function(point, image) {
		this.point = point;
		this.image = image;
		this.alreadyBuilt();
	},
	
//////////////// public

	/**
	 * Specify this belongs to a set (not a function).
	 * Build a possible value where point=image in 's'
	 * @param {nul.xpr.object} s
	 * @return nul.xpr.possible
	 */
	isInSet: function(s) {
		var klg = new nul.xpr.knowledge();
		return klg.wrap(klg.hesitate(s.having(klg.unify(this.point, this.image))));
	},

	/**
	 * Specify this belongs to a set (not a function).
	 * Build a possible value where point=image in 's'
	 * @param {nul.xpr.object} p Domain / Lambda set (optional)
	 * @param {nul.xpr.object} i Image set
	 * @return nul.xpr.possible
	 */
	isInFct: function(p, i) {
		var l;
		if(i) l = new nul.obj.lambda(p, i);
		else {
			l = p;
			p = l.point;
			i = l.image;
		}
		var klg = new nul.xpr.knowledge();
		var kSep = new nul.xpr.knowledge();	//a=>b in A=>B iif a in A and b in B
		var vSep = kSep.wrap(
				new nul.obj.lambda(
						kSep.hesitate(p.having(this.point)),
						kSep.hesitate(i.having(this.image)) )
				);
		var vMut = this.isInSet(l);	//a=>b in A=>B iif (a=b) in A=>B
		return klg.wrap(klg.hesitate(vSep, vMut));
	},

//////////////// nul.obj.defined implementation

	attribute: function(an) { nul.fail('Lambdas have no attributes'); },
	
	unified: function(o, klg) {
		if('lambda'!= o.expression) nul.fail(o, ' not a lambda');
		return new nul.obj.lambda(
			klg.unify(this.point, o.point),
			klg.unify(this.image, o.image));
	},

//////////////// nul.xpr.object implementation

	has: function($super, o) {
		if(!o.defined) return $super(o);
		if('lambda'!= o.expression) {
			var klg = new nul.xpr.knowledge();
			return klg.wrap(klg.hesitate(this.point.having(klg.hesitate(this.image.having(o)))));
		}
		return o.isInFct(this);
	},
		
//////////////// nul.expression implementation

	expression: 'lambda',
	components: ['point', 'image'],
	placed: function($super, prnt) {
		if(this.point.toString() == this.image.toString())
			//TODO0 Knowledge can bring this info too
			return this.point;	//TODO4: another comparison?
		return $super(prnt);
	},
});
/*  NUL language JavaScript framework
 *  (c) 2009 E-med Ware
 *
 * NUL is freely distributable under the terms of GNU GPLv3 license.
 *  For details, see the NUL project site : http://code.google.com/p/nul/
 *
 *--------------------------------------------------------------------------*/

nul.obj.node = Class.create(nul.obj.defined, {
	initialize: function($super, tag, attrs, content) {
		this.attributes = nul.xpr.beBunch(attrs);
		this.tag = tag;
		this.content = content;
		this.alreadyBuilt();
		$super();
	},
//////////////// nul.obj.defined implementation

	unified: function(o, klg) {
		if('node'!= o.expression) nul.fail(o, ' not a node');
		var nattrs = merge(this.attributes, o.attributes, function(a, b, i) {
			if(!a || !b) nul.fail('Attribute not common : '+i);
			return klg.unify(a, b); 
		});
		return new nul.obj.node(nattrs);
	},
	intersect: function(o, klg) {
		return this.unified(o, klg);
	},

//////////////// nul.xpr.object implementation

	has: function($super, o) {
		return this.content.has(o);
	},

//////////////// nul.expression implementation

	expression: 'node',
	components: ['attributes','content'],
});/*  NUL language JavaScript framework
 *  (c) 2009 E-med Ware
 *
 * NUL is freely distributable under the terms of GNU GPLv3 license.
 *  For details, see the NUL project site : http://code.google.com/p/nul/
 *
 *--------------------------------------------------------------------------*/

nul.obj.undefined = Class.create(nul.xpr.object, {
	summarise: function($super, smr) {
		$super(smr);
	},
	defined: false,
});/*  NUL language JavaScript framework
 *  (c) 2009 E-med Ware
 *
 * NUL is freely distributable under the terms of GNU GPLv3 license.
 *  For details, see the NUL project site : http://code.google.com/p/nul/
 *
 *--------------------------------------------------------------------------*/

/*TODO4: ndx system :
 * Two different knowledge should be recognised even if :
 * - their knowledge name is different, so their locals wear a different klgName
 * - their variables are ordered differently
*/

/**
 * Define an object that is a value of a local
 */
nul.obj.local = Class.create(nul.obj.undefined, {
	initialize: function(klgRef, ndx, dbgName) {
		this.klgRef = klgRef;
		this.ndx = ndx;
		this.dbgName = dbgName;
		this.alreadyBuilt({
			index: this.indexedSub(this.klgRef, this.ndx),
		});
	},

////////////////nul.expression implementation

	sum_dependance: function($super) {
		return new nul.dependance(this);
	},
	
	expression: 'local',
	invalidateTexts: function($super, dbgName) {
		this.dbgName = dbgName;
		$super();
	},
});/*  NUL language JavaScript framework
 *  (c) 2009 E-med Ware
 *
 * NUL is freely distributable under the terms of GNU GPLv3 license.
 *  For details, see the NUL project site : http://code.google.com/p/nul/
 *
 *--------------------------------------------------------------------------*/

//TODO4: ((a + b) + (c + d)) => (a + b + c + d)
//TODO4: ((a - b) - c) =?> (a - (b + c)) 
//TODO4: (a - (b - c)) =?> ((a + c) - b) !!!/0 

nul.obj.operation = Class.create(nul.obj.undefined, {
	initialize: function(operator, ops) {
		nul.obj.use(ops);
		this.operator = operator;
		this.operands = ops;
		this.alreadyBuilt();
	},
	
//////////////// nul.expression implementation
	
	expression: 'operation',
	components: ['operands'],
});

nul.obj.operation.binary = Class.create(nul.obj.operation, {
	//TODO3
});

nul.obj.operation.Nary = Class.create(nul.obj.operation, {
	//TODO3
});/*  NUL language JavaScript framework
 *  (c) 2009 E-med Ware
 *
 * NUL is freely distributable under the terms of GNU GPLv3 license.
 *  For details, see the NUL project site : http://code.google.com/p/nul/
 *
 *--------------------------------------------------------------------------*/

/**
 * Defined an object that can be several one, on a choice
 */
nul.obj.ior3 = Class.create(nul.obj.undefined, {
	initialize: function(klgRef, ndx, items) {
		nul.obj.use(items);
		this.klgRef = klgRef;
		this.values = items;
		this.ndx = ndx;
		this.alreadyBuilt();
	},

//////////////// public

	/**
	 * Gather the list of values as 'possible' thanks to the associated the knowledge.
	 * @param {array(nul.xpr.knowledge)} ctx
	 * @return array(nul.xpr.possible)
	 */
	possibles: function() {
		if(!this.choices) return this.values;
		var rv = [];
		for(var i=0; i<this.values.length; ++i)
			rv.push(new nul.xpr.possible(this.values[i], this.choices[i]));
		return rv;
	},
	
//////////////// nul.expression summaries

	sum_index: function() {
		return this.indexedSub(this.klgRef, this.ndx, this.values);
	},
	sum_dependance: function($super) {
		return $super().ior3dep(this);
	},
	
//////////////// nul.expression implementation
	
	expression: 'ior3',
	components: ['values'],
	invalidateTexts: function($super, chxs) {
		this.choices = chxs;
		if(nul.debug.assert) assert(this.values.length == this.choices.length,
			'IOR3 has same values as the correspondant knowledge entry')
		$super();
	},
});nul.page = {
	loads: function() {
		for(var l in nul.page.load)
			if(cstmNdx(l, nul.page.load))
				nul.page.load[l].apply(document);
	},
	load: {},
	error: function(msg) {
		//alert(msg);
	},
};

new Event.observe(window, 'load', nul.page.loads);
