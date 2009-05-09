/*  NUL language JavaScript framework
 *  (c) 2009 François Marie De Mey
 *
 * NUL is freely distributable under the terms of GNU GPLv3 license.
 *  For details, see the NUL project site : http://code.google.com/p/nul/
 *
 *--------------------------------------------------------------------------*/

nul.xpr.holder = function(pos) {
	return Class.create(pos, {
		hold: true,
		/**
		 * Determines weither this set can be empty or not.
		 * If 'true', the set *CAN* be empty
		 * if 'false', the set contains at least one element for sure
		 */
		canBeEmpty: function() {
			for(var i=0; i<this.components.length; ++i)
				if(!this.components[i].flags.failable) return false;
			return true;
		},
		composed: function($super) {
			///	Removes empty fuzzy values
			for(var i = 0; i<this.components.length;)
				if(this.components[i].failed)
					this.components.splice(i,1);
				else ++i;
			return $super();
		},
		subRecursion: function(cb, kb) {
			var chgd = false;
			var rv = maf(this.components, function() {
				var trv = cb.apply(this);
				chgd |= !!trv;
				if(!this.failed) return this;
			});
			if(chgd) return this.compose(rv);
		},
	});
};

nul.xpr.holder.listed = nul.xpr.holder(nul.xpr.listed);
nul.xpr.holder.preceded = nul.xpr.holder(nul.xpr.preceded);
