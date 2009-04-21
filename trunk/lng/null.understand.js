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
			for(var i=0; i<this.operands.length; ++i) {
				var op = this.operands[i];
				op = (new nul.understanding.base(ub)).valued(function(ub) {
					return op.understand(ub);
				});
				if('fz'!= op.charact || op.components) ops.push(op);
			}
		}
		else ops = map(this.operands, function() { 
				return this.understand(ub);				
			});
		if(['+' ,'-' ,'*' ,'/' ,'%' ,'&' ,'|' ,'^'].contains(this.operator))
			return new nul.xpr.operation.listed(this.operator, ops);
		if(['<','>', '<=','>='].contains(this.operator)) {
			ub.kb.knew(new nul.xpr.ordered(this.operator, ops));
			return ops[0];
		}
		switch(this.operator)
		{
			case ':-':	return new nul.xpr.lambda(ops[0], ops[1]);
			case ',':	return new nul.xpr.set(ops);
			case '=':
				return (new nul.xpr.unification(ops)).apply(ub.kb);
			case ':=':	return new nul.xpr.handle(ops[0], ops[1]);

			case '<<+':	return new nul.xpr.seAppend(ops[0], ops[1]);
			case ';':
				return ops[0];
			case '[]':	return nul.xpr.build(nul.xpr.ior3, ops);
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
		return new nul.xpr.value(value);
	},
	application: function(ub) {
		var rv = new nul.xpr.application(
			this.item.understand(ub),
			this.applied.understand(ub));
		return rv.operate(ub.kb) || rv;
	},
	set: function(ub) {
		if(!this.content) return new nul.xpr.set();
		ub = new nul.understanding.base.set(ub, this.selfRef);
		var cnt = this.content;
		return ub.valued(function(ub) { return cnt.understand(ub); });
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
			ub.kb);
	},
	objectivity: function(ub) {
		return new nul.xpr.objectivity(this.applied.understand(ub), this.lcl);
	}
};

nul.understanding.base = Class.create({
	initialize: function(prntUb) {
		this.prntUb = prntUb;
		this.kb = new nul.knowledge();
	},
	valued: function(cb) {
		var xpr;
		try { xpr = cb(this); }
		catch(err) {
			this.kb.leave();
			if(nul.failure!= err) throw nul.exception.notice(err); 
		}
		return this.kb.leave(xpr);
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
		if(selfName) {
			this.parms[selfName] = nul.lcl.slf;
			this.arCtxName = 'ar'+(++nul.understanding.srCtxNames);
		}
	},
	valued: function($super, cb) {
		var fzx = $super(cb);
		var stx = new nul.xpr.set(('fz'!= fzx.charact || fzx.components)?[fzx]:[]);
		if(this.arCtxName) stx.arCtxName = this.arCtxName;
		return stx.extend();
	},
	resolve: function($super, identifier) {
		if('undefined'!= typeof this.parms[identifier]) {
			var ndx = this.parms[identifier];
			return new nul.xpr.local(
				ndx==nul.lcl.slf?this.arCtxName:this.kb.ctxName,
				ndx, identifier);
		}
		return $super(identifier);
	},
	createFreedom: function(name, value) {
		if(this.parms[name]) throw nul.semanticException('FDT', 'Freedom declared twice: '+name);
		var rv = this.kb.locals.length;
		this.kb.locals.push(name);
		if('_'!= name) this.parms[name] = rv;
		rv = new nul.xpr.local(this.kb.ctxName, rv, name)
		if(value) this.premices.push(new nul.xpr.unification([rv, value]));
		return rv;
	}
});
