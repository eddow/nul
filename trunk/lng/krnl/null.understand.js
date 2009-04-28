/*  NUL language JavaScript framework
 *  (c) 2009 François Marie De Mey
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
				ops.pushs((new nul.understanding.base(ub)).valued(this.operands[i]));
		}
		else ops = map(this.operands, function() { 
				return this.understand(ub);				
			});
		if(['+' ,'-' ,'*' ,'/' ,'%' ,'&' ,'|' ,'^'].contains(this.operator))
			return new nul.xpr.operation.listed(this.operator, ops);
		if(['<','>', '<=','>='].contains(this.operator)) {
			ub.klg.know(new nul.xpr.ordered(this.operator, ops));
			return ops[0];
		}
		switch(this.operator)
		{
			case ':-':	return new nul.xpr.lambda(ops[0], ops[1]);
			case ',':	return new nul.xpr.set(ops);	//TODO: gérer le '.follow'!!!
			case '=':
				return (new nul.xpr.unification(ops)).operate(ub.klg);
			case ':=':	return new nul.xpr.handle(ops[0], ops[1]);

			case '<<+':	return new nul.xpr.seAppend(ops[0], ops[1]);
			case ';':
				for(var i=1; i<ops.length; ++i)
					ub.klg.know(ops[i]);
				return ops[0];
			case '[]':	return new nul.xpr.ior3(ops);
			default:	throw nul.internalException('Unknown operator: "'+this.operator+'"');
		}
	},
	preceded: function(ub) {
		if('!'== this.operator)
			map((new nul.understanding.base(ub)).valued(this.operand),
			function() {
				ub.klg.knew(new nul.xpr.not(this));
			});
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
		return new nul.xpr.value(value);
	},
	application: function(ub) {
		var rv = new nul.xpr.application(
			this.item.understand(ub),
			this.applied.understand(ub));
		return rv.operate(ub.klg) || rv;
	},
	set: function(ub) {
		if(!this.content) return new nul.xpr.set();
		ub = new nul.understanding.base.set(ub, this.selfRef);
		var cnt = this.content;
		return ub.valued(cnt);
	},
	
	definition: function(ub) {
		if('_'== this.decl) throw nul.semanticException('JKD', 'Cannot declare joker !')
		ub.createFreedom(this.decl);
		return this.value.understand(ub);
	},

	xml: function(ub) {
		/*TODO
		var attrs = {};
		for(var a in this.attributes) attrs[a] = this.attributes[a].understand(ub);
		return nul.todobuild.xml(this.node, attrs,
			nul.understanding.understandOperands(this.content, ub));
			* */
	},

	composed: function(ub) {
		return new nul.xpr.attributed(
			this.applied.understand(ub),
			this.name,
			this.value.understand(ub),
			ub.klg);
	},
	objectivity: function(ub) {
		return new nul.xpr.objectivity(this.applied.understand(ub), this.lcl);
	}
};

nul.understanding.base = Class.create({
	initialize: function(prntUb) {
		this.prntUb = prntUb;
		this.klg = new nul.knowledge();
	},
	valued: function(tu) {
		if(!tu) return this.klg.leave();
		var xpr, klg = this.klg;
		try {
			xpr = tu.understand(this);
			xpr = this.klg.asFuzz(xpr);
		} catch(err) {
			xpr = null;
			if(nul.failure!= err) throw nul.exception.notice(err);
		} finally { xpr = this.klg.leave(xpr); }
		xpr = !xpr?[]:nul.solve.solve(xpr);
		return map(xpr, function() {
			return this.subjective() || this;
		});
	},
	resolve: function(identifier) {
		if(this.prntUb) return this.prntUb.resolve(identifier);
		throw nul.understanding.unresolvable;
	},
	createFreedom: function(name, value) {
		return this.prntUb.createFreedom(name, value);
	},
});
nul.understanding.base.set = Class.create(nul.understanding.base, {
	initialize: function($super, prntUb, selfName) {
		$super(prntUb);
		this.parms = {};
		if(selfName)
			this.parms[selfName] = new nul.xpr.local(
				this.arCtxName = 'ar'+(++nul.understanding.srCtxNames),
				nul.lcl.slf, selfName);
	},
	valued: function($super, tu) {
		var fzx = $super(tu);
		var stx = new nul.xpr.set(fzx);
		if(this.arCtxName) stx.arCtxName = this.arCtxName;
		return stx;//.extended();
	},
	resolve: function($super, identifier) {
		if('undefined'!= typeof this.parms[identifier])
			return this.parms[identifier];
		return $super(identifier);
	},
	createFreedom: function(name, value) {
		if(this.parms[name]) throw nul.semanticException('FDT', 'Freedom declared twice: '+name);
		if(!value) {
			var rv = this.klg.locals.length;
			this.klg.locals.push(name);
			rv = new nul.xpr.local(this.klg.ctxName, rv, name)
			if('_'!= name) this.parms[name] = rv;
			return rv;
		}
		return this.parms[name] = value;
	}
});
