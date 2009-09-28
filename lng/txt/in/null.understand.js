/*  NUL language JavaScript framework
 *  (c) 2009 E-med Ware
 *
 * NUL is freely distributable under the terms of GNU GPLv3 license.
 *  For details, see the NUL project site : http://code.google.com/p/nul/
 *
 *--------------------------------------------------------------------------*/

nul.understanding = {
	rvName : '&crarr;',
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
			case '=>':
				return new nul.obj.lambda(ops[0], ops[1]);
			case '|':
				return new nul.obj.pair(ops[0], ops[1]);
			case ',':
				var rv = ops.follow?ops.follow:nul.obj.empty;
				while(ops.length) rv = new nul.obj.pair(ops.pop(), rv);
				return rv;
			case '=': return ub.klg.unify(ops);
			case ';': return ops[0];
			default:
				throw nul.internalException('Unknown operator: "'+operator+'"');
		}
	},
	preceded: function(ub) {
		return new nul.obj.attribute(this.operand.understand(ub), operator+' ');
	},
	postceded: function(ub) {
		return new nul.obj.attribute(this.operand.understand(ub), ' '+operator);
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
		return new nul.obj.litteral(value);
	},
	application: function(ub) {
		var rv = ub.createFreedom(nul.understanding.rvName);
		ub.klg.hesitate(this.item.understand(ub).having(
			new nul.obj.lambda(
				this.applied.understand(ub), rv)));
		return rv;
		//return this.token.understand(ub).through(this.item.understand(ub));
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
		//TODO3
	},

	composed: function(ub) {
		return new nul.obj.extension(map(this.vals, function() { return this.understand(ub); }))
	},
	objectivity: function(ub) {
		return new nul.obj.attribute(this.applied.understand(ub), this.lcl);
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
	createFreedom: function(name, value) {
		return this.prntUb.createFreedom(name, value);
	},
	understand: function(cnt) {
		return this.klg.wrap(cnt.understand(this));
	},
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
	allocLocal: function(name) {
		if(this.parms[name]) throw nul.semanticException('FDT', 'Freedom declared twice: '+name);
		var rv = this.klg.newLocal(name);
		if('_'!= name && nul.understanding.rvName!= name) this.parms[name] = rv;
		return rv;
	},
	createFreedom: function(name, value) {
		if(value) this.parms[name] = value;
		else value = this.allocLocal(name);
		return value;
	},
	understand: function(cnt) {
		try {
			return new nul.obj.pair(
				this.klg.wrap(cnt.understand(this)),
				nul.obj.empty);
		} catch(err) {
			nul.failed(err);
			return nul.obj.empty;
		}
	},
});
