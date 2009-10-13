nul.page = {
	loads: function() {
		for(var l in nul.page.load)
			if(cstmNdx(l, nul.page.load))
				nul.page.load[l].apply(document);
	},
	load: {},
	error: function(msg) {
		//alert(msg);
	},
};

new Event.observe(window, 'load', nul.page.loads);
