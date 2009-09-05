/*  NUL language JavaScript framework
 *  (c) 2009 E-med Ware
 *
 * NUL is freely distributable under the terms of GNU GPLv3 license.
 *  For details, see the NUL project site : http://code.google.com/p/nul/
 *
 *--------------------------------------------------------------------------*/

nul.understanding = {
	srCtxNames: 0,
	unresolvable: 'localNameUnresolvable',

	expression: function(ub) {
		var ops;
		if('[]'== this.operator) {
			ops = [];
			for(var i=0; i<this.operands.length; ++i)
				ops.push((new nul.understanding.base(ub)).valued(this.operands[i]));
		}
		else ops = map(this.operands, function() { 
				return this.understand(ub);				
			});
		if(['+' ,'*' ,'&' ,'|' ,'^'].contains(this.operator))
			return new nul.xpr.operation.associative(this.operator, ops);
		if(['-' ,'/' ,'%'].contains(this.operator))
			return new nul.xpr.operation.listed(this.operator, ops);
		if(['<','>', '<=','>='].contains(this.operator)) {
			ub.klg.know(new nul.xpr.ordered(this.operator, ops));
			return ops[0];
		}
		switch(this.operator)
		{
			case ':-':	return new nul.xpr.lambda(ops[0], ops[1]);
			case ',':
				var ctxDef;
				if(ops.follow) {
					var flw = nul.inside(ops.follow);
					ops.pushs(flw.cs);
					ctxDef = flw.ctx;
					delete ops.follow;
				}	
				return new nul.xpr.set(ops, ctxDef);
			case '=':
				return (new nul.xpr.unification(ops)).value(ub.klg);
			case ':=':	return new nul.xpr.handle(ops[0], ops[1], ub.ctxDef);

			case ';':
				for(var i=1; i<ops.length; ++i)
					ub.klg.know(ops[i]);
				return ops[0];
			case '?':
				for(var i=0; i<ops.length-1; ++i)
					ub.klg.know(ops[i]);
				return ops[ops.length-1];
			case '[]':	return new nul.xpr.ior3(ops, ub.ctxDef);
			default:	throw nul.internalException('Unknown operator: "'+this.operator+'"');
		}
	},
	preceded: function(ub) {
		return new nul.xpr.operation.preceded(this.operator,this.operand.understand(ub));
	},
	postceded: function(ub) {
		var op = this.operand.understand(ub);
		//if(this.operator == '!') return nul.todobuild.extraction(op);
		return new nul.xpr.operation.postceded(this.operator,this.operand.understand(ub));
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
		var rv = new nul.xpr.application(
			this.item.understand(ub),
			this.applied.understand(ub),
			ub.ctxDef);
		return rv.value(ub.klg);
	},
	taking: function(ub) {
		var rv = new nul.xpr.application(
			this.item.understand(ub),
			this.applied.understand(ub),
			ub.ctxDef);
		return rv.value(ub.klg);
	},
	set: function(ub) {
		if(!this.content) return new nul.obj.empty();
		ub = new nul.understanding.base.set(ub, this.selfRef);
		return [nul.possibles(this.content.understand(ub)).set()];
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
		return new nul.obj.attribute(this.applied.understand(ub), this.lcl);	//TODO: .defined?
	}
};

nul.understanding.base = Class.create({
	initialize: function(prntUb, ctxName) {
		this.parms = {};
		this.prntUb = prntUb;
		if(prntUb) this.ctxDef = prntUb.ctxDef;
		this.klg = new nul.knowledge(ctxName);
	},
	valued: function(tu) {
		if(!tu) return this.klg.leave();
		var xpr, klg = this.klg;
		try {
			xpr = tu.understand?tu.understand(this):tu;
			xpr = this.klg.asFuzz(xpr);
		} catch(err) {
			xpr = null;
			if(nul.failure!= err) throw nul.exception.notice(err);
		} finally { xpr = this.klg.leave(xpr); }
		return xpr;
	},
	resolve: function(identifier) {
		if(this.prntUb) return this.prntUb.resolve(identifier);
		throw nul.understanding.unresolvable;
	},
	allocLocal: function(name) {
		if(this.parms[name]) throw nul.semanticException('FDT', 'Freedom declared twice: '+name);
		var rv = this.klg.locals.length;
		this.klg.locals.push(name);
		rv = new nul.xpr.local(this.klg.ctxName, rv, name)
		if('_'!= name) this.parms[name] = rv;
		return rv;
	},
	createFreedom: function(name, value) {
		return this.prntUb.createFreedom(name, value);
	},
});
nul.understanding.base.set = Class.create(nul.understanding.base, {
	initialize: function($super, prntUb, selfName, ctxName) {
		$super(prntUb, ctxName, ctxName);
		if(selfName)
			this.parms[selfName] = new nul.xpr.local(
				this.klg.ctxName,
				nul.lcl.slf, selfName);
		this.ctxDef = this.klg.ctxName;
	},
	valued: function($super, tu) {
		var fzx = $super(tu);
		var stx = new nul.xpr.set(fzx?[fzx]:[], this.klg.ctxName);
		return stx;
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