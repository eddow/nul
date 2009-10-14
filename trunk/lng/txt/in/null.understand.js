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
				return nul.obj.operation.binary(this.operator, ops);
			//TODO3: > < >= <=
			case '=>': return new nul.obj.lambda(ops[0], ops[1]);
			case ',': return nul.obj.pair.list(ops.follow, ops);
			case '=': return ub.klg.unify(ops);
			case '!=': ub.klg.oppose(nul.xpr.knowledge.unification(ops));
				return ops[0];
			case ';': return ops[0];
			case '?': return ops[1];
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
		return nul.expression.application(this.item.understand(ub), this.applied.understand(ub), ub.klg);
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
		return ub.klg.attributed(this.object.understand(ub), this.aName, this.value.understand(ub));
	},
	objectivity: function(ub) {
		return ub.attributed(this.applied.understand(ub), this.lcl);
	},
	hardcode: function(ub) {
		return this.value;
	},
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
		this.klg.attributed(obj, anm, rv);
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
