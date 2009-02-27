/*  NUL language JavaScript framework
 *  (c) 2009 François Marie De Mey
 *
 * NUL is freely distributable under the terms of GNU GPLv3 license.
 *  For details, see the NUL project site : http://code.google.com/p/nul/
 *
 *--------------------------------------------------------------------------*/
 
nul.understanding = {
	phase: 0,
	emptyBase: function(prntUb) {
		return { 
			nbrI : 0,
			parms: {},
			prntUb: prntUb,
			resolve: function(identifier, delta)
			{
				if(!delta) delta = 0;
				if('undefined'!= typeof this.parms[identifier]) {
					var ndx = this.parms[identifier].lindx;
					return nul.build().local(delta, ndx, (identifier!=ndx)?identifier:null);
				}
				if(this.prntUb) return this.prntUb.resolve(identifier, 1+delta);
				throw nul.semanticException('Identifier "'+identifier+'" undefined.');
			},
			createFreedom: function(name, type, stringed)
			{
				if(this.parms[name]) throw nul.semanticException('Freedom declared twice: '+name);
				var lindx = stringed?name:this.nbrI++;
				this.parms[name] = { lindx: lindx, type: type };
				return lindx;
			},
			setSelf: function(name)
			{
				if(this.parms[name]) throw nul.semanticException('Freedom declared twice: '+name);
				this.parms[name] = { lindx: nul.lcl.slf };
			}
		};
	},

	understand: function(operand, ub, locals) {
		++nul.understanding.phase;
		if('noub'!= locals) ub = nul.understanding.emptyBase(ub);
		try { return operand.understand(operand, ub); }
		finally { --nul.understanding.phase; }
	},
	understandOperands: function(operands, ub) {
		var rv = []
		for(var i=0; i<operands.length; ++i)
			rv.push(nul.understanding.understand(operands[i], ub));
		return rv;
	},

	expression: function(xpr, ub) {
		switch(xpr.operator)
		{
		case '?':
			var value = nul.understanding.understand(xpr.operands[1],ub);
			ub = nul.understanding.emptyBase(ub);
			var guard = nul.understanding.understand(xpr.operands[0],ub);
			return nul.build().and3([nul.build().assert(guard), value]);
		}
		var ops = nul.understanding.understandOperands(xpr.operands, ub);
		if(['&&', '||', '+' ,'-' ,'*' ,'/' ,'%' ,'&' ,'|' ,'^' ,'&&' ,'||'].contains(xpr.operator))
			return nul.build().cumulExpr(xpr.operator, ops);
		if(['<','>','<=','>='].contains(xpr.operator))
			return nul.build().biExpr(xpr.operator, ops);
		switch(xpr.operator)
		{
			case ':-':	return nul.build().lambda(ops[0], ops[1]);
			case ',':	return nul.build().list(ops);
			case '=':	return nul.build().unification(ops);
			case ';':	return nul.build().and3(ops);
			case '[]':	return nul.build().or3(ops);
			case ':':	return nul.build().xor3(ops);
			case '<<=':	return nul.build().seAppend(ops[0], ops[1]);
			default:	throw nul.internalException('Unknown operator: "'+xpr.operator+'"');
		}
	},
	preceded: function(prc, ub) {
		var op = nul.understanding.understand(prc.operand, ub);
		if(prc.operator == '?') return nul.build().assert(op);
		if(prc.operator == ',') return nul.build().list([op]);
		return nul.build().preceded(prc.operator,op);
	},
	postceded: function(pstc, ub) {
		var op = nul.understanding.understand(pstc.operand, ub);
		if(pstc.operator == '!') return nul.build().extraction(op);
		throw nul.internalException('Unknown postceder');
	},
	atom: function(atm, ub) {
		var value;
		switch(atm.type)
		{
			case "string":
				value = ''+atm.value;
				break;
			case "number":
				value = 1*atm.value;
				break;
			case "alphanum" :
				if( '_'==atm.value ) return nul.build().definition('_', nul.build().local(0,0,'_'));
				else return ub.resolve(atm.value);
				break;
			default:
				throw nul.semanticException('unknown atom: ' + atm.type + ' - ' + atm.value);
		}
		return nul.build().atom(value);
	},
	xml: function(o, ub) {
		var attrs = {}, content = [];
		for(var i=0; i<o.content.length; ++i) content[i] = nul.understanding.understand(o.content[i], ub);
		ub = nul.understanding.emptyBase(ub);
		for(var a in o.attributes) attrs[a] = nul.understanding.understand(o.attributes[a], ub);
		return nul.build().xml( o.node, attrs, content );
	},
	application: function(o, ub) {
		return nul.build().application(
			nul.understanding.understand(o.item, ub),
			nul.understanding.understand(o.applied, ub) );
	},
	set: function(o, ub) {
		return nul.build().set(o.content?nul.understanding.understand(o.content, ub):null);
	},
	
	definition: function(ctxtl, ub, locals) {
		if(ctxtl.type) {
			var lindx = ub.createFreedom(ctxtl.decl);
			var val = nul.understanding.understand(ctxtl.value, ub);
			ub = nul.understanding.emptyBase(ub);
			var tp = nul.understanding.understand(ctxtl.type, ub);
			var lcl = nul.build().local(2, lindx, ctxtl.decl);
			
			var rv = nul.build().definition(ctxtl.decl, nul.build().and3());
			//TODO: remettre en une ligne ?
			return rv.modify([
				nul.build().application(tp, lcl),
				val]).summarised(true);
		} else {
			ub.createFreedom(ctxtl.decl);
			return nul.build().definition(ctxtl.decl, nul.understanding.understand(ctxtl.value, ub, 'noub'));
		}
	},
	selfed: function(ctxtl, ub, locals) {
		ub.setSelf(ctxtl.decl);
		return nul.build().definition(ctxtl.decl, nul.understanding.understand(ctxtl.value, ub, 'noub'));
	},
	prototype: function(o, ub) {
		var decls = {};
		var applied = nul.understanding.understand(o.applied, ub, 'noub');
		var rv = nul.build().prototype(applied, o.name, nul.understanding.understand(o.value, ub));
		ub.createFreedom(o.name, null, true)
		return rv;
	},
	objectivity: function(o, ub) {
		var applied = nul.understanding.understand(o.applied, ub);
		for(var i=0; i<o.lcls.length; ++i)
			ub.createFreedom(o.lcls[i], null, true)
		var value = nul.understanding.understand(o.value, ub);
		return nul.build().objectivity(applied, value);
	}
};