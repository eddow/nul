/*  NUL language JavaScript framework
 *  (c) 2009 E-med Ware
 *
 * NUL is freely distributable under the terms of GNU GPLv3 license.
 *  For details, see the NUL project site : http://code.google.com/p/nul/
 *
 *--------------------------------------------------------------------------*/

nul.understanding = {
	/** Used as return-value local naming @constant */
	rvName : '&crarr;',
	/** Exception used when a local need to be created @constant */
	unresolvable: 'unresolved identifier',
	/**
	 * Understand each 'ops' in a freshly created understand.base
	 * @param {nul.compiled[]} objs
	 * @param {nul.understanding.base} ub
	 * @return {nul.xpr.possible[]}
	 */
	possibles: function(ops, ub) {
		return maf(ops, function() {
			try { return new nul.understanding.base(ub).understand(this); }
			catch(err) { nul.failed(err); }
		});
	}
};

nul.compiled.node.extend({
	expression: new JS.Class (nul.compiled.node, {understand: function(ub) {
		var ops;
		if('[]'== this.operator)
			return ub.klg.hesitate(nul.understanding.possibles(this.operands, ub));

		var ops = map(this.operands, function(n, o) {
			return this.understand(ub);
		});
		switch(this.operator)
		{
		case '+':
		case '*':
			return new nul.obj.operation.Nary(this.operator, ops);
		case '-':
		case '/':
		case '%':
			return nul.obj.operation.binary(this.operator, ops);
		//TODO 3: > < >= <=
		case '=>': return new nul.obj.lambda(ops[0], ops[1]);
		case ',': return nul.obj.pair.list(ops.follow, ops);
		case '=': return ub.klg.unify(ops);
		case '!=': ub.klg.oppose(nul.klg.unification(ops));
			return ops[0];
		case ';': return ops[0];
		case '?': return ops[1];
		case '..':
			if('number'!= ops[0].expression) nul.ex.semantic('RNG', 'Range can only be defined with immediates', ops[0]);
			if('number'!= ops[1].expression) nul.ex.semantic('RNG', 'Range can only be defined with immediates', ops[1]);
			return new nul.obj.range(ops[0].value, ops[1].value);
		case ':': 
			var rv = ub.createFreedom(nul.understanding.rvName, false);
			ub.klg.hesitate(ops[0].having(new nul.obj.lambda(rv, ops[1])));
			return rv;
		default:
			nul.ex.internal('Unknown operator: "'+this.operator+'"');
		}
	}}),
	preceded: new JS.Class (nul.compiled.node, {understand: function (ub) {
		return ub.klg.attribute(this.operand.understand(ub), this.operator+' ');
	}}),
	postceded: new JS.Class (nul.compiled.node, {understand: function (ub) {
		switch(this.operator) {
		case ',.': return nul.obj.pair.list(null, [this.operand.understand(ub)]);
		default: return ub.klg.attribute(this.operand.understand(ub), ' '+this.operator);
		}
	}}),
	application: new JS.Class (nul.compiled.node, {understand: function(ub){
		return ub.klg.hesitate(this.item.understand(ub).having(this.applied.understand(ub)));
	}}),
	taking: new JS.Class (nul.compiled.node, {understand: function (ub) {
		return nul.xpr.application(this.item.understand(ub), this.token.understand(ub), ub.klg);
	}}),
	atom: new JS.Class (nul.compiled.node, {understand: function (ub) {
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
			if(!this.value) return nul.execution.uberLocal;
			try { return ub.resolve(this.value); }
			catch(err) {
				if(nul.understanding.unresolvable!= err) throw err;
				return ub.createFreedom(this.value);
			}
			break;
		default:
			nul.ex.internal('unknown atom type: ' + this.type + ' - ' + this.value);
		}
		return nul.obj.litteral.make(value);
	}}),
	definition: new JS.Class (nul.compiled.node, {understand: function (ub) {
		if('_'== this.decl) nul.ex.semantic('JKD', 'Cannot declare joker !');
		ub.createFreedom(this.decl);
		return this.value.understand(ub);
	}}),
	set: new JS.Class (nul.compiled.node, {understand: function (ub) {
		if(!this.content) return nul.obj.empty;
		return new nul.understanding.base.set(ub, this.selfRef).understand(this.content);
	}}),
	xml: new JS.Class (nul.compiled.node, {understand: function (ub) {
		return new nul.obj.node(this.node,												//tag
		map(this.attributes, function() { return this.understand(ub); }),			//attributes
		nul.obj.pair.list(null, nul.understanding.possibles(this.content, ub)));		//content
	}}),
	composed: new JS.Class (nul.compiled.node, {understand: function (ub) {
		return ub.klg.attributed(this.object.understand(ub), this.aName, this.value.understand(ub));
	}}),
	objectivity: new JS.Class (nul.compiled.node, {understand: function (ub) {
		return ub.klg.attribute(this.applied.understand(ub), this.lcl);
	}}),
	hardcode: new JS.Class (nul.compiled.node, {understand: function (ub) {
		return this.value;
	}})
});

nul.understanding.base = new JS.Class(/** @lends nul.understanding.base# */{
	/**
	 * @class Understanding context informations
	 * @constructs
	 * @param {nul.understanding.base} prntUb The parent understanding base
	 * @param {String} klgName The name to give to the created context if any special (if not, one will be generated)
	 */
	initialize: function(prntUb, klgName) {
		this.prntUb = prntUb;
		this.parms = {};
		this.klg = new nul.xpr.knowledge(klgName);
	},
	/**
	 * Gets the value associated with an identifier
	 * @param {String} identifier
	 * @return {nul.xpr.object}
	 * @throw {nul.understanding.unresolvable}
	 */
	resolve: function(identifier) {
		if('undefined'!= typeof this.parms[identifier])
			return this.parms[identifier];
		if(this.prntUb) return this.prntUb.resolve(identifier);
		throw nul.understanding.unresolvable;
	},
	/**
	 * Associate an identifier to a value.
	 * If no value is specified, a local is created
	 * If value is specified explicitely as 'false', a local is created and the name is not remembered
	 * @param {String} name
	 * @param {nul.xpr.object} value
	 * @return {nul.xpr.object}
	 * @throw {nul.ex.semantic}
	 */
	createFreedom: function(name, value) {
		if(this.parms[name]) nul.ex.semantic('FDT', 'Freedom declared twice: '+name);
		var uniqueName = true;
		if(false===value) uniqueName = false;
		if(!value) value = this.klg.newLocal(name);
		if('_'== name) uniqueName = false;
		if(uniqueName) this.parms[name] = value;
		return value;
	},
	/**
	 * Applies the understandment process to a compiled node
	 * @param {nul.compiled} cnt
	 * @return {nul.xpr.object}
	 * @throw {nul.ex.semantic}
	 */
	understand: function(cnt) {
		return this.klg.wrap(cnt.understand(this));
	}
});

nul.understanding.base.set = new JS.Class(nul.understanding.base, /** @lends nul.understanding.base.set# */{
	/**
	 * @class Understanding context' information inside brackets
	 * @extends nul.understanding.base
	 * @constructs
	 * @param {nul.understanding.base} prntUb The parent understanding base
	 * @param {String} selfName The name to use internally (understanding this value) to give to the created value.
	 * @param {String} klgName The name to give to the created context if any special (if not, one will be generated)
	 */
	initialize: function(prntUb, selfName, klgName) {
		this.callSuper(prntUb, klgName);
		if(selfName) this.setSelfRef = (this.parms[selfName] = nul.obj.local.self(null, selfName)).ndx;
	},
	/**
	 * Applies the understandment process to a compiled node
	 * @param {nul.compiled} cnt
	 * @return {nul.obj.pair|nul.obj.empty}
	 * @throw {nul.ex.semantic}
	 */
	understand: function(cnt) {
		var rv;
		try {
			rv = nul.obj.pair.list(null, this.klg.wrap(cnt.understand(this)));
		} catch(err) {
			nul.failed(err);
			return nul.obj.empty;
		}
		if(this.setSelfRef) rv.selfRef = this.setSelfRef;
		return rv;
	}
});
