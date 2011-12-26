	Dts = Backbone.Model.extend({
		defaults: {
			data: {},
			template: dom.template.getSession().getValue(),
			style: dom.style.getSession().getValue()
		},
	    initialize: function(){
	        console.log("New Dts created.");
	        this.bind("change", function(){
	        	console.log("change...");
	        	this.renderHtml();
	        });
	    },
	    setData: function(_data){
			// yadda yadda
			this.set({
				data: _data
			});
	    },
	});
	
	dts = new Dts();
	dom.data.live("keyup change", function(){
		dts.setData(dom.data.getSession().getValue())
	});
	dom.template.live("keyup change", function(){
		dts.set({
			template: dom.template.getSession().getValue()
		})
	});
	dom.style.live("keyup change", function(){
		dts.set({
			style: dom.style.getSession().getValue()
		})
	});
	dts.setData(dom.data.getSession().getValue());	
