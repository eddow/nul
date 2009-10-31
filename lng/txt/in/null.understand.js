/*  NUL language JavaScript framework
 *  (c) 2009 E-med Ware
 *
 * NUL is freely distributable under the terms of GNU GPLv3 license.
 *  For details, see the NUL project site : http://code.google.com/p/nul/
 *
 *--------------------------------------------------------------------------*/

/**@namespace*/
nul.understanding = {
	/** Used as return-value local naming @constant */
	rvName : '&crarr;',
	/** Exception used when a local need to be created @constant */
	unresolvable: 'unresolved identifier',
	/**
	 * Generic expression (operator and operands) understanding
	 * @example a <b>+</b> b <b>+</b> c
	 * @param {nul.understanding.base} ub
	 * @return {nul.xpr.object}
	 */
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
				return nul.obj.operation.binary(this.operator, ops);
			//TODO 3: > < >= <=
			case '=>': return new nul.obj.lambda(ops[0], ops[1]);
			case ',': return nul.obj.pair.list(ops.follow, ops);
			case '=': return ub.klg.unify(ops);
			case '!=': ub.klg.oppose(nul.xpr.knowledge.unification(ops));
				return ops[0];
			case ';': return ops[0];
			case '?': return ops[1];
			case '..':
				if('number'!= ops[0].expression) throw nul.semanticException('RNG', 'Range can only be defined with immediates');
				if('number'!= ops[1].expression) throw nul.semanticException('RNG', 'Range can only be defined with immediates');
				return new nul.obj.range(ops[0].value, ops[1].value);
			case ':': 
				var rv = ub.createFreedom(nul.understanding.rvName, false);
				ub.klg.hesitate(ops[0].having(new nul.obj.lambda(rv, ops[1])));
				return rv;
			default:
				throw nul.internalException('Unknown operator: "'+operator+'"');
		}
	},
	/**
	 * Precedor understanding : a precedor and an operand
	 * @example <b>++</b>operand
	 * @param {nul.understanding.base} ub
	 * @return {nul.xpr.object}
	 */
	preceded: function(ub) {
		return ub.attributed(this.operand.understand(ub), this.operator+' ');
	},
	/**
	 * Postcedor understanding : a postcedor and an operand
	 * @example operand<b>++</b>
	 * @param {nul.understanding.base} ub
	 * @return {nul.xpr.object}
	 */
	postceded: function(ub) {
		return ub.attributed(this.operand.understand(ub), ' '+this.operator);
	},
	/**
	 * Atom understanding : a type and a value
	 * @example <b>"</b>quoted text<b>"</b>
	 * @example 42
	 * @example identifier
	 * @param {nul.understanding.base} ub
	 * @return {nul.xpr.object}
	 */
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
	/**
	 * Application understanding : two symbols separated by a space
	 * @example item applied
	 * @param {nul.understanding.base} ub
	 * @return {nul.xpr.object}
	 */
	application: function(ub) {
		return ub.klg.hesitate(this.item.understand(ub).having(this.applied.understand(ub)));
	},
	/**
	 * 'Taking' understanding
	 * @example item<b>[</b>token<b>]</b>
	 * @param {nul.understanding.base} ub
	 * @return {nul.xpr.object}
	 */
	taking: function(ub) {
		return nul.xpr.application(this.item.understand(ub), this.token.understand(ub), ub.klg);
	},
	/**
	 * 'Set' understanding
	 * @example <b>{</b>content<b>}</b>
	 * @param {nul.understanding.base} ub
	 * @return {nul.obj.pair|nul.obj.empty}
	 */
	set: function(ub) {
 		if(!this.content) return nul.obj.empty;
		return new nul.understanding.base.set(ub, this.selfRef).understand(this.content);
	},

	/**
	 * Local-definition value understanding
	 * @example <b>\/</b>decl value
	 * @param {nul.understanding.base} ub
	 * @return {nul.xpr.object}
	 */
	definition: function(ub) {
		if('_'== this.decl) throw nul.semanticException('JKD', 'Cannot declare joker !')
		ub.createFreedom(this.decl);
		return this.value.understand(ub);
	},

	/**
	 * XML-node understanding
	 * @example <b>&lt;</b>node <b>/&gt</b>;
	 * @param {nul.understanding.base} ub
	 * @return {nul.obj.node}
	 */
	xml: function(ub) {
		var attrs = {};
		for(var an in this.attributes) if(cstmNdx(an))
			attrs[an] = this.attributes[an].understand(ub);
		return new nul.obj.node(
			this.node,
			map(this.attributes, function() {
				return this.understand(ub);
			}),
			map(this.content, function() {
				return this.understand(ub);
			}));
	},

	/**
	 * Composition understanding
	 * @example object <b>::</b>aName value
	 * @param {nul.understanding.base} ub
	 * @return {nul.xpr.object}
	 */
	composed: function(ub) {
		return ub.klg.attributed(this.object.understand(ub), this.aName, this.value.understand(ub));
	},
	/**
	 * Objective value understanding
	 * @example applied<b>.</b>lcl
	 * @param {nul.understanding.base} ub
	 * @return {nul.xpr.object}
	 */
	objectivity: function(ub) {
		return ub.attributed(this.applied.understand(ub), this.lcl);
	},
	/**
	 * Hardcoded JS value
	 * @example <b><{</b> value = nul.obj.litteral.make(34) <b>}></b>
	 * @param {nul.understanding.base} ub
	 * @return {nul.xpr.object}
	 */
	hardcode: function(ub) {
		return this.value;
	}
};

nul.understanding.base = Class.create(/** @lends nul.understanding.base# */{
	/**
	 * Understanding context' informations
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
		if(!Object.isUndefined(this.parms[identifier]))
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
	 * @throw {nul.semanticException}
	 */
	createFreedom: function(name, value) {
		if(this.parms[name]) throw nul.semanticException('FDT', 'Freedom declared twice: '+name);
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
	 * @throw {nul.semanticException}
	 */
	understand: function(cnt) {
		return this.klg.wrap(cnt.understand(this));
	},
	/**
	 * Gets a value that represent the attribute of an object. Creates a local and assert attribute value.
	 * @param {nul.xpr.object} obj
	 * @param {String} anm
	 * @return {nul.obj.local}
	 */
	attributed: function(obj, anm) {
		//TODO 3? essayer de ne pas créer deux variables si (a.b + a.b)
		// a.b = a.b ?? non ! mais pas utile deux variables anyway! 
		if(obj.defined) return obj.attribute(anm);
		var rv = this.createFreedom('&rarr;'+anm, false);
		this.klg.attributed(obj, anm, rv);
		return rv;
	}
});

nul.understanding.base.set = Class.create(nul.understanding.base, /** @lends nul.understanding.base.set# */{
	/**
	 * Understanding context' information inside brackets
	 * @extends nul.understanding.base
	 * @constructs
	 * @param {nul.understanding.base} prntUb The parent understanding base
	 * @param {String} selfName The name to use internally (understanding this value) to give to the created value.
	 * @param {String} klgName The name to give to the created context if any special (if not, one will be generated)
	 */
	initialize: function($super, prntUb, selfName, klgName) {
		$super(prntUb, klgName);
		if(selfName) this.setSelfRef = (this.parms[selfName] = nul.obj.local.self(null, selfName)).ndx;
	},
	/**
	 * Applies the understandment process to a compiled node
	 * @param {nul.compiled} cnt
	 * @return {nul.obj.pair|nul.obj.empty}
	 * @throw {nul.semanticException}
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
