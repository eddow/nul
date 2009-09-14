/*  NUL language JavaScript framework
 *  (c) 2009 E-med Ware
 *
 * NUL is freely distributable under the terms of GNU GPLv3 license.
 *  For details, see the NUL project site : http://code.google.com/p/nul/
 *
 *--------------------------------------------------------------------------*/

nul.obj.fuzzy = Class.create(nul.obj, {
	initialize: function(value, knowledge) {
		this.value = value;
		this.knowledge = knowledge;
		this.summarise();
	},
	
//////////////// public
	
	/**
	 * Make this fuzzy an object of the given knowledge
	 * @param fzns nul.fuzziness
	 * @param klg nul.xpr.knowledge
	 * @return nul.obj
	 * @throws nul.failure
	 */
	stepUp: function(fzns, klg) {
		var stpUp = this.knowledge.stepUp(fzns, this.value);
		klg.merge(stpUp.knowledge);
		return stpUp.value || this.value;
	},
	
//////////////// nul.xpr implementation
	
	type: 'fuzzy',
	components: ['value', 'knowledge'],
});
