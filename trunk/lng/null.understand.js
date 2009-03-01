/*  NUL language JavaScript framework
 *  (c) 2009 François Marie De Mey
 *
 * NUL is freely distributable under the terms of GNU GPLv3 license.
 *  For details, see the NUL project site : http://code.google.com/p/nul/
 *
 *--------------------------------------------------------------------------*/
 
nul.understanding = {
	phase: 0,
	unresolvable: 'localNameUnresolvable',
	emptyBase: function(prntUb) {
		return {
			parms: {},
			locals: [],
			prntUb: prntUb,
			asSet: function(xpr) {
				this.locals[nul.lcl.slf] = xpr;
				xpr.kasName = nul.lcl.slf;
				return nul.build().set(this.locals).subResolve();
			},
			resolve: function(identifier, delta)
			{
				if(!delta) delta = 0;
				if('undefined'!= typeof this.parms[identifier]) {
					var ndx = this.parms[identifier];
					return nul.build().local(delta, ndx, (identifier!=ndx)?identifier:null);
				}
				if(this.prntUb) return this.prntUb.resolve(identifier, 1+delta);
				throw nul.understanding.unresolvable;
			},
			createFreedom: function(name, type)
			{
				if(this.parms[name]) throw nul.semanticException('Freedom declared twice: '+name);
				type.kasName = name;
				var rv = this.locals.length;
				this.locals.push(type);
				if('_'!= name) this.parms[name] = rv;
				return rv;
			},
			setSelf: function(name)
			{
				if(this.parms[name]) throw nul.semanticException('Freedom declared twice: '+name);
				this.parms[name] = nul.lcl.slf;
			}
		};
	},

	understandOperands: function(operands, ub) {
		return map(operands, function() { return this.understand(ub) });
	},

	expression: function(ub) {
		var ops = nul.understanding.understandOperands(this.operands, ub);
		if(['&&', '||', '+' ,'-' ,'*' ,'/' ,'%' ,'&' ,'|' ,'^' ,'&&' ,'||'].contains(this.operator))
			return nul.build().cumulExpr(this.operator, ops);
		if(['<','>','<=','>='].contains(this.operator))
			return nul.build().biExpr(this.operator, ops);
		switch(this.operator)
		{
			case '?': return nul.build().and3([nul.build().assert(ops[0], ops[1])]);
			case ',..':
				var lst = (','== ops[0].operator)?ops[0]:[ops[0]];
				lst.follow = ops[1];
				return ub.build.list(lst);
			case ':-':	return nul.build().lambda(ops[0], ops[1]);
			case ',':	return nul.build().list(ops);
			case '=':	return nul.build().unification(ops);
			case ';':	return nul.build().and3(ops);
			case '[]':	return nul.build().or3(ops);
			case ':':	return nul.build().xor3(ops);
			case '<<=':	return nul.build().seAppend(ops[0], ops[1]);
			default:	throw nul.internalException('Unknown operator: "'+this.operator+'"');
		}
	},
	preceded: function(ub) {
		var op = this.operand.understand(ub);
		if(this.operator == '?') return nul.build().assert(op);
		return nul.build().preceded(this.operator,op);
	},
	postceded: function(ub) {
		var op = this.operand.understand(ub);
		if(this.operator == '!') return nul.build().extraction(op);
		throw nul.internalException('Unknown postceder');
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
					throw nul.semanticException('Identifier "'+this.value+'" undefined.');
				}
				break;
			default:
				throw nul.internalException('unknown atom type: ' + this.type + ' - ' + this.value);
		}
		return nul.build().atom(value);
	},
	application: function(ub) {
		return nul.build().application(
			this.item.understand(ub),
			this.applied.understand(ub) );
	},
	set: function(ub) {
		ub = nul.understanding.emptyBase(ub);
		if(!this.content) return nul.build().list([]);
		return ub.asSet(this.content.understand(ub));
	},
	
	definition: function(ub) {
		ub.createFreedom(this.decl, this.type.understand(ub));
		return ub.resolve(this.decl);
	},
	/*
	xml: function(o, ub) {
		var attrs = {}, content = [];
		for(var i=0; i<o.content.length; ++i) content[i] = nul.understanding.understand(o.content[i], ub);
		ub = nul.understanding.emptyBase(ub);
		for(var a in o.attributes) attrs[a] = nul.understanding.understand(o.attributes[a], ub);
		return nul.build().xml( o.node, attrs, content );
	},

	attributed: function(o, ub) {
		var decls = {};
		var applied = nul.understanding.understand(o.applied, ub, 'noub');
		var rv = nul.build().attributed(applied, o.name, nul.understanding.understand(o.value, ub));
		ub.createFreedom(o.name, null, true)
		return rv;
	},
	objectivity: function(o, ub) {
		var lindx = ub.createFreedom(o.lcl);
		var sub = nul.understanding.emptyBase(ub);
		return nul.build().and3([
			nul.understanding.attributed({
				applied: o.applied, name: o.lcl, value:nul.compiled.atom({type:'alphanum', value:o.lcl})
			}, sub), nul.build().local(1, lindx, o.lcl)]);
	}
	*/
};