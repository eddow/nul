/*  NUL language JavaScript framework
 *  (c) 2009 E-med Ware
 *
 * NUL is freely distributable under the terms of GNU GPLv3 license.
 *  For details, see the NUL project site : http://code.google.com/p/nul/
 *
 *--------------------------------------------------------------------------*/

nul.understanding = {
	unresolvable: 'unresolved identifier',
	expression: function(ub) {
		var ops;
		if('[]'== this.operator)
			return new nul.obj.ior3(this.operands.mar(function() {
			//Understand each operands in a freshly created UB that DOESN'T stores locals
				try { return new nul.understanding.base(ub).understand(this); }
				catch(err) {
					if(nul.failure!= err) throw nul.exception.notice(err);
				}
			})).built();
		var ops = map(this.operands, function() { 
			return new nul.possibles(ub.klg, this.understand(ub));				
		});
		if(['+' ,'*'].contains(this.operator))
			return new nul.obj.operation.Nary(this.operator, ops);
		if(['-' ,'/' ,'%'].contains(this.operator))
			return new nul.obj.operation.binary(this.operator, ops);
/*		if(['<','>', '<=','>='].contains(this.operator)) {
				ub.klg.know(new nul.xpr.ordered(this.operator, this));
				return this[0];
			}*/

		switch(operator)
		{
			case ':-':
				return new nul.obj.pair(ops[0], ops[1], ub.klg);
			case ',':
				var rv = ops.follow?ops.follow:nul.obj.empty;
				while(this.length) rv = new nul.obj.pair(ops.pop(), rv, ub.klg);
				return rv;
			case '=': return klg.unify(ops);
			case ';':
				return ops[0];
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
		return klg.belong(this.applied.understand(ub), this.item.understand(ub));
	},
	taking: function(ub) {
		return this.applied.understand(ub).through(this.item.understand(ub));
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
	initialize: function(prntUb) {
		this.prntUb = prntUb;
		this.klg = new nul.xpr.knowledge(prntUb?prntUb.klg:null);
	},
	resolve: function(identifier) {
		if(this.prntUb) return this.prntUb.resolve(identifier);
		throw nul.understanding.unresolvable;
	},
	createFreedom: function(name, value) {
		return this.prntUb.createFreedom(name, value);
	},
	fuzziness: function() { return prntUb.fuzziness(); },
	understand: function(cnt) {
		return new nul.obj.fuzzy(cnt.understand(this), this.klg.built());
	},
});
nul.understanding.base.set = Class.create(nul.understanding.base, {
	initialize: function($super, prntUb, selfName) {
		$super(prntUb);
		this.parms = {};
		this.fzns = new nul.fuzziness();
		if(selfName) this.parms[selfName] = this.klg.local(selfName, nul.slf);
	},
	resolve: function($super, identifier) {
		if('undefined'!= typeof this.parms[identifier])
			return this.parms[identifier];
		return $super(identifier);
	},
	allocLocal: function(name) {
		if(this.parms[name]) throw nul.semanticException('FDT', 'Freedom declared twice: '+name);
		var rv = this.fzns.newLocal(name);
		if('_'!= name) this.parms[name] = rv;
		return rv;
	},
	createFreedom: function(name, value) {
		if(value) this.parms[name] = value;
		else value = this.allocLocal(name);
		return value;
	},
	fuzziness: function() { return prntUb.fuzziness(); },
	understand: function(cnt) {
		return new nul.obj.pair(cnt.understand(this), nul.obj.empty, this.klg.built(), this.fzns);
	},
});

nul.understanding.base.set.understand = function(cnt, ub, slf) {
	//TODO2: cnt=[cnt] pourrait marcher à tous les coups -> redondance -> repenser
	if('[]'== cnt.operator) cnt = cnt.operands;
	else cnt = [cnt];
	
	return new nul.possibles(ub.klg, cnt.mar(function() {
		//Understand each operands in a freshly created UB that stores locals
		return new nul.understanding.base.set(ub, slf).understand(this);
	})).set();
};