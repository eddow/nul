nul.page = {
	load: function() {
		for(var l in nul.page.load)
			if(!function(){}[l])
				nul.page.load[l].apply(document);
	},
	error: function(msg) {
		//alert(msg);
	},
};

new Event.observe(window, 'load', nul.page.load);
