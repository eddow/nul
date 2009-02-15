nul.understanding = {
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
					return nul.actx.local(delta, ndx, (identifier!=ndx)?identifier:null);
				}
				if(this.prntUb) return this.prntUb.resolve(identifier, 1+delta);
				throw nul.semanticException('Identifier "'+identifier+'" undefined.');
			},
			createFreedom: function(name, type, stringed)
			{
				if(this.parms[name]) throw nul.semanticException('Freedom declared twice: '+name);
				this.parms[name] = stringed?
					{ lindx: name, type: type }:
					{ lindx: this.nbrI++, type: type };
			},
			setSelf: function(name)
			{
				if(this.parms[name]) throw nul.semanticException('Freedom declared twice: '+name);
				this.parms[name] = { lindx: nul.lcl.slf };
			}
		};
	},

	understand: function(operand, ub, locals) {
		if('noub'!= locals) ub = nul.understanding.emptyBase(ub);
		return operand.understand(operand, ub);
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
			return nul.actx.and3([nul.actx.assert(guard), value]);
		}
		var ops = nul.understanding.understandOperands(xpr.operands, ub);
		if(['&&', '||', '+' ,'-' ,'*' ,'/' ,'%' ,'&' ,'|' ,'^' ,'&&' ,'||'].contains(xpr.operator))
			return nul.actx.cumulExpr(xpr.operator, ops);
		if(-1< ' == < > <= >= '.indexOf(' '+xpr.operator+' '))
			return nul.actx.biExpr(xpr.operator, ops);
		switch(xpr.operator)
		{
			case ':-':	return nul.actx.lambda(ops[0], ops[1]);
			case ',':	return nul.actx.staticExpr(ops);
			case '=':	return nul.actx.unification(ops);
			case ';':	return nul.actx.and3(ops);
			case '[]':	return nul.actx.or3(ops);
			case ':':	return nul.actx.xor3(ops);
			case '<<=':	return nul.actx.seAppend(ops[0], ops[1]);
			default:	throw nul.internalException('Unknown operator: "'+xpr.operator+'"');
		}
	},
	preceded: function(prc, ub) {
		var op = nul.understanding.understand(prc.operand, ub);
		if(prc.operator == '?') return nul.actx.assert(op);
		if(prc.operator == ',') return nul.actx.staticExpr([op]);
		return nul.actx.preceded(prc.operator,op);
	},
	postceded: function(pstc, ub) {
		var op = nul.understanding.understand(pstc.operand, ub);
		if(pstc.operator == '!') return nul.actx.extraction(op);
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
				if( '_'==atm.value ) return nul.actx.definition('_', nul.actx.local(0,0,'_'));
				else return ub.resolve(atm.value);
				break;
			default:
				throw nul.semanticException('unknown atom: ' + atm.type + ' - ' + atm.value);
		}
		return nul.actx.atom(value);
	},
	xml: function(o, ub) {
		var attrs = {}, content = [];
		for(var i=0; i<o.content.length; ++i) content[i] = nul.understanding.understand(o.content[i], ub);
		ub = nul.understanding.emptyBase(ub);
		for(var a in o.attributes) attrs[a] = nul.understanding.understand(o.attributes[a], ub);
		return nul.actx.xml( o.node, attrs, content );
	},
	application: function(o, ub) {
		return nul.actx.application(
			nul.understanding.understand(o.item, ub),
			nul.understanding.understand(o.applied, ub) );
	},
	set: function(o, ub) {
		return nul.actx.set(o.content?nul.understanding.understand(o.content, ub):null);
	},
	
	definition: function(ctxtl, ub, locals) {
		ub.createFreedom(ctxtl.decl, ctxtl.type?
			nul.understanding.understand(ctxtl.type, ub):null);
		return nul.actx.definition(ctxtl.decl, nul.understanding.understand(ctxtl.value, ub, 'noub'));
	},
	selfed: function(ctxtl, ub, locals) {
		ub.setSelf(ctxtl.decl);
		return nul.actx.definition(ctxtl.decl, nul.understanding.understand(ctxtl.value, ub, 'noub'));
	},
	prototype: function(o, ub) {
		var decls = {};
		var applied = o.applied ? nul.understanding.understand(o.applied, ub, 'noub') : nul.actx.atom(null);
		var rv = nul.actx.prototype(applied, o.name, nul.understanding.understand(o.value, ub));
		ub.createFreedom(o.name, null, true)
		return rv;
	},
	objectivity: function(o, ub) {
		var applied = nul.understanding.understand(o.applied, ub);
		for(var i=0; i<o.lcls.length; ++i)
			ub.createFreedom(o.lcls[i], null, true)
		var value = nul.understanding.understand(o.value, ub);
		return nul.actx.objectivity(applied, value);
	}
};