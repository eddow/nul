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
				return new nul.understanding.base(ub).understand(this);
			});
		var ops = map(this.operands, function() { 
			return this.understand(ub);				
		});
		var operator = operator;
		nul.possibles.map(ub.klg, ops, function(klg) {
			if(['+' ,'*'].contains(this.operator))
				return new nul.obj.operation.Nary(operator, this);
			if(['-' ,'/' ,'%'].contains(this.operator))
				return new nul.obj.operation.binary(operator, this);
/*			if(['<','>', '<=','>='].contains(this.operator)) {
				ub.klg.know(new nul.xpr.ordered(this.operator, this));
				return this[0];
			}*/

			switch(this.operator)
			{
				case ':-':	return new nul.obj.pair(this[0], this[1], klg);
				case ',':
					var rv = this.follow?this.follow:nul.obj.empty;
					while(this.length) rv = new nul.obj.pair(this.pop(), rv, klg);
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
		return nul.possibles.map(ub.klg, {op: operand}, function(klg) {
			return new nul.obj.attribute(this.op, ' '+operator);
		});
	},
	postceded: function(ub) {
		var operand = this.operand.understand(ub);
		var operator = this.operator;
		return nul.possibles.map(ub.klg, {op: operand}, function(klg) {
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
		return nul.possibles.map(ub.klg, {itm: item, app: applied}, function(klg) {
			var rv = this.itm.has(this.app, klg);
			if(rv) return rv;
			klg.belong(this.app, this.itm);
			return this.app;
		});
	},
	taking: function(ub) {
		var item = this.item.understand(ub);
		var applied = this.applied.understand(ub);
		return nul.possibles.map(ub.klg, {itm: item, app: applied}, function() {
			return this.app.through(this.itm);
		});
	},
	set: function(ub) {
		if(!this.content) return nul.obj.empty;
		return [nul.understanding.base.set.understand(this.content, ub, this.selfRef)];
	},
	range: function(ub) {
		return [new nul.obj.range(this.lower, this.upper)];
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
		return new nul.possibles(ub.klg, [
			new nul.obj.byAttr(map(this.vals, function() { return this.understand(ub); }))
		]);
	},
	objectivity: function(ub) {
		var applied = this.applied.understand(ub);
		var lcl = this.lcl;
		return nul.possibles.map(ub.klg, {app: applied}, function() {
			return new nul.obj.attribute(this.app, lcl);
		});
	}
};

nul.understanding.base = Class.create({
	initialize: function(prntUb) {
		this.parms = {};
		this.prntUb = prntUb;
		this.klg = new nul.xpr.knowledge(prntUb?prntUb.klg:null);
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
	/**
	 * Understand <tu> in a new context that doesn't store locals
	 */
	 understand: function(tu) {
	 	var rv = new nul.possibles(this.klg, tu.understand(this));
	 	return rv.and(this.klg);
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

nul.understanding.base.set.understand = function(cnt, ub, slf) {
	if('[]'== cnt.operator) cnt = cnt.operands;
	else cnt = [cnt];
	
	return new nul.possibles(ub.klg, cnt.mar(function() {
		//Understand each operands in a freshly created UB that stores locals
		return new nul.understanding.base.set(ub, slf).understand(this);
	})).set();
};