/*  NUL language JavaScript framework
 *  (c) 2009 E-med Ware
 *
 * NUL is freely distributable under the terms of GNU GPLv3 license.
 *  For details, see the NUL project site : http://code.google.com/p/nul/
 *
 *--------------------------------------------------------------------------*/

nul.understanding = {
	expression: function(ub) {
		var ops;
		if('[]'== this.operator)
			return this.operands.mar(function() {
			//Understand each operands in a freshly created UB that DOESN'T stores locals
				return this.understand(new nul.understanding.base(ub));
			});
		var ops = map(this.operands, function() { 
			return this.understand(ub);				
		});
		var operator = operator;
		nul.possibles.map(ops, function(klg) {
			if(['+' ,'*'].contains(this.operator))
				return new nul.obj.through(new nul.obj.attribute(this[0],operator), this[1]);
			if(['-' ,'/' ,'%'].contains(this.operator))
				return new nul.obj.through(new nul.obj.attribute(this[0],operator), this[1]);
/*			if(['<','>', '<=','>='].contains(this.operator)) {
				ub.klg.know(new nul.xpr.ordered(this.operator, this));
				return this[0];
			}*/

			switch(this.operator)
			{
				case ':-':	return new nul.obj.pair(this[0], this[1]);
				case ',':
					var rv = this.follow?this.follow:new nul.obj.empty();
					while(this.length) rv = new nul.obj.pair(this.pop(), rv);
					return rv;
				case '=': return klg.unify(this);
				case ';':
					return this[0];
				default:	throw nul.internalException('Unknown operator: "'+operator+'"');
			}
		});
	},
	preceded: function(ub) {
		var operand = this.operand.understand(ub);
		var operator = this.operator;
		return nul.possibles.map({op: operand}, function(klg) {
			return new nul.obj.attribute(this.op, ' '+operator);
		});
	},
	postceded: function(ub) {
		var operand = this.operand.understand(ub);
		var operator = this.operator;
		return nul.possibles.map({op: operand}, function(klg) {
			return new nul.obj.attribute(this.op, operator+' ');
		});
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
		var item = this.item.understand(ub);
		var applied = this.applied.understand(ub);
		return nul.possibles.map({itm: item, app: applied}, function(klg) {
			var rv = this.itm.has(this.app);
			if(rv) return rv;
			klg.belong(this.itm, this.app);
			return this.app;
		});
	},
	taking: function(ub) {
		var item = this.item.understand(ub);
		var applied = this.applied.understand(ub);
		return nul.possibles.map({itm: item, app: applied}, function() {
			return new nul.obj.through(this.itm, this.app);
		});
	},
	set: function(ub) {
		if(!this.content) return new nul.obj.empty();
		var cnt = this.content;
		if('[]'== cnt.operator) cnt = cnt.operands;
		else cnt = [cnt];
		
		var slf = this.selfRef;
		return [nul.possibles(cnt.mar(function() {
			//Understand each operands in a freshly created UB that stores locals
			return this.understand(new nul.understanding.base.set(ub, slf));
		})).set()];
	},
	range: function(ub) {
		var lower = this.lower.understand(ub);
		var upper = this.lower.understand(ub);
		return nul.possibles.map({lwr: lower, upr:upper}, function() {
			return nul.obj.range(this.lwr, this.upr)
		});
	},
	definition: function(ub) {
		/*TODO
		if('_'== this.decl) throw nul.semanticException('JKD', 'Cannot declare joker !')
		ub.createFreedom(this.decl);
		return this.value.understand(ub); */
	},

	xml: function(ub) {
		//TODO
	},

	composed: function(ub) {
		return [new nul.obj.defined(map(this.vals, function() { return this.understand(ub); }))];
	},
	objectivity: function(ub) {
		var applied = this.applied.understand(ub);
		var lcl = this.lcl;
		return nul.possibles.map({app: applied}, function() {
			return new nul.obj.attribute(this.app, lcl);
		});
	}
};

nul.understanding.base = Class.create({
	initialize: function(prntUb) {
		this.parms = {};
		this.prntUb = prntUb;
		this.klg = new nul.knowledge(prntUb.klg);
	},
	resolve: function(identifier) {
		if(this.prntUb) return this.prntUb.resolve(identifier);
		throw 'unresolvable name';
	},
	allocLocal: function(name) {
		if(this.parms[name]) throw nul.semanticException('FDT', 'Freedom declared twice: '+name);
		var rv = this.klg.newLocal(name);
		if('_'!= name) this.parms[name] = rv;
		return rv;
	},
	createFreedom: function(name, value) {
		return this.prntUb.createFreedom(name, value);
	},
});
nul.understanding.base.set = Class.create(nul.understanding.base, {
	initialize: function($super, prntUb, selfName) {
		$super(prntUb);
		if(selfName) this.parms[selfName] = this.klg.local(selfName, nul.slf);
	},
	resolve: function($super, identifier) {
		if('undefined'!= typeof this.parms[identifier])
			return this.parms[identifier];
		return $super(identifier);
	},
	createFreedom: function(name, value) {
		if(value) this.parms[name] = value;
		else value = this.allocLocal(name);
		return value;
	}
});