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
	emptyBase: function(prntUb, alocal) {
		return {
			parms: alocal?null:{},
			lvals: [],
			premices: [],
			locals: [],
			prntUb: prntUb,
			asSet: function(xpr) {
				return nul.build.set(xpr, this.premices, this.lvals, this.locals);
			},
			asKwFrdm: function(xpr) {
				return nul.build.kwFreedom(xpr, this.premices);
			},
			resolve: function(identifier, delta) {
				if(!delta) delta = 0;
				if(this.parms && 'undefined'!= typeof this.parms[identifier]) {
					var ndx = this.parms[identifier];
					return nul.build.local(delta, ndx, (identifier!=ndx)?identifier:null);
				}
				if(this.prntUb) return this.prntUb.resolve(identifier, (this.parms?1:0)+delta);
				throw nul.understanding.unresolvable;
			},
			createFreedom: function(name, value) {
				if(!this.parms) return this.prntUb.createFreedom(name, value);
				if(this.parms[name]) throw nul.semanticException('Freedom declared twice: '+name);
				this.locals.push(name);
				var rv = this.lvals.length;
				if('_'!= name) this.parms[name] = rv;
				rv = nul.build.local(0, rv, name)
				this.lvals.push(value||null);
				return rv;
			},
			know: function(xpr) {
				this.premices.push(xpr);
			}
		};
	},

	understandOperands: function(operands, ub) {
		return map(operands, function() { return this.understand(ub) });
	},

	expression: function(ub) {
		var ops;
		if(['[]',':'].contains(this.operator)) {
			var ops = [], sub;
			for(var i=0; i<this.operands.length; ++i) {
				sub = nul.understanding.emptyBase(ub,'alocal');
				ops.push(sub.asKwFrdm(this.operands[i].understand(sub)));
			}
		}
		else ops = nul.understanding.understandOperands(this.operands, ub);
		if(['&&', '||', '+' ,'-' ,'*' ,'/' ,'%' ,'&' ,'|' ,'^' ,'&&' ,'||'].contains(this.operator))
			return nul.build.cumulExpr(this.operator, ops);
		if(['<','>','<=','>='].contains(this.operator))
			return nul.build.biExpr(this.operator, ops);
		switch(this.operator)
		{
			case ':-':	return nul.build.lambda(ops[0], ops[1]);
			case ',':	return nul.build.list(ops);
			case ',..':
				var lst = (','== ops[0].operator)?ops[0]:[ops[0]];
				lst.follow = ops[1];
				return ub.build.list(lst);

			case '=':	return nul.build.unification(ops, 0);
			case ':=':	return nul.build.unification(ops, -1);

			case '<<=':	return nul.build.seAppend(ops[0], ops[1]);

			case '?': 
				ub.know(nul.build.assert(ops[0]));
				return ops[1];
			case ';':
				for(var i=1; i<ops.length; ++i) ub.know(ops[i]);
				return ops[0];

			case '[]':	return nul.build.or3(ops);
			case ':':	return nul.build.xor3(ops);
			default:	throw nul.internalException('Unknown operator: "'+this.operator+'"');
		}
	},
	preceded: function(ub) {
		var op = this.operand.understand(ub);
		if(this.operator == '?') {
			ub.know(nul.build.assert(op));
			return nul.build.set();
		}
		return nul.build.preceded(this.operator,op);
	},
	postceded: function(ub) {
		var op = this.operand.understand(ub);
		if(this.operator == '!') return nul.build.extraction(op);
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
					//throw nul.semanticException('Identifier "'+this.value+'" undefined.');
					return ub.createFreedom(this.value);
				}
				break;
			default:
				throw nul.internalException('unknown atom type: ' + this.type + ' - ' + this.value);
		}
		return nul.build.atom(value);
	},
	application: function(ub) {
		return nul.build.application(
			this.item.understand(ub),
			this.applied.understand(ub) );
	},
	set: function(ub) {
		ub = nul.understanding.emptyBase(ub);
		if(!this.content) return nul.build.list([]);
		return ub.asSet(this.content.understand(ub));
	},
	
	definition: function(ub) {
		ub.createFreedom(this.decl);
		return this.value.understand(ub);
	},
	/*
	xml: function(o, ub) {
		var attrs = {}, content = [];
		for(var i=0; i<o.content.length; ++i) content[i] = nul.understanding.understand(o.content[i], ub);
		ub = nul.understanding.emptyBase(ub);
		for(var a in o.attributes) attrs[a] = nul.understanding.understand(o.attributes[a], ub);
		return nul.build.xml( o.node, attrs, content );
	},

	attributed: function(o, ub) {
		var decls = {};
		var applied = nul.understanding.understand(o.applied, ub, 'noub');
		var rv = nul.build.attributed(applied, o.name, nul.understanding.understand(o.value, ub));
		ub.createFreedom(o.name, null, true)
		return rv;
	},
	objectivity: function(o, ub) {
		var lindx = ub.createFreedom(o.lcl);
		var sub = nul.understanding.emptyBase(ub);
		return nul.build.and3([
			nul.understanding.attributed({
				applied: o.applied, name: o.lcl, value:nul.compiled.atom({type:'alphanum', value:o.lcl})
			}, sub), nul.build.local(1, lindx, o.lcl)]);
	}
	*/
};