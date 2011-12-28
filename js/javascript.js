// remove the static text for search engines
document.getElementById("static").style.display = "none";

var tmpltr;		// kept outside for console inspection

// needed:		debounce render
// consider:	more sensical nomenclature
// bugs:		occasional stuck view on load, opera crappiness (maybe from Ace)

$.fn.ready(function(){

	var $body = $("body");

	// browser fail
	if ((Modernizr.generatedcontent === false) || (Modernizr.localstorage === false)) {
		$("body").addClass("error").removeClass("loading").css({ width: "700px", margin: "20px auto" }).html("<h1>Dang.</h1><p>Looks like your browser didn't pass whatever random tests I decided were arbitrarily important:</p><pre>Modernizr: " + JSON.stringify(Modernizr).replace(/,/gi, ",\n    ").replace(/{/gi, "{\n    ").replace(/}/gi, "\n}") + "</pre><p>If you think this is in error or that I'm a dummy, contact me <a href=\"http://mynameistommy.com/\">here</a>. Otherwise, if you'd like to use this app, <a href='http://browsehappy.com/'>upgrade your browser</a>.</p>");
		return false;
	}

	tmpltr = {
		appname: "tmpltr",
		data: {},
		structure: "",
		style: "",
		editors: {},
		$: {
			output: {
				body: $("#ifrOutput").contents().find("body"),
				head: $("#ifrOutput").contents().find("head")
			}
		},
		fn: {
			setData: function(_data) {
				tmpltr.$.data.removeClass("invalid");
				if (typeof _data === "string") {
					try {
						_data = $.parseJSON(_data);
					} catch (e1) {
						try {
							// Error parsing string data, attempting eval();
							_data = eval('(' + _data + ')');
						} catch (e2) {
							tmpltr.$.data.addClass("invalid");
							return false;
						}
					}
				}
				if (typeof _data === "object") {
					tmpltr.data = _data || tmpltr.data;
				}
			},
			setStructure: function(_structure) {
				tmpltr.structure = _structure || tmpltr.structure;
			},
			setStyle: function(_style) {
				tmpltr.style = _style || tmpltr.style;
			},
			// sets tmpltr props, fills editors, renders output
			useDataStructureStyle: function(settings) {
				if (typeof settings !== "object") { return false; }
				if (!settings.data || !settings.structure || !settings.style) { return false; }
				tmpltr.fn.setData(settings.data);
				tmpltr.fn.setStructure(settings.structure);
				tmpltr.fn.setStyle(settings.style);
				tmpltr.editors.data.getSession().setValue(settings.data);
				tmpltr.editors.structure.getSession().setValue(settings.structure);
				tmpltr.editors.style.getSession().setValue(settings.style);
				return true;
			},
			renderOutput: function(sWhat){
				sWhat = sWhat || "all";
				if ((sWhat === "html") || (sWhat === "all")) {
					tmpltr.$.output.body.html(
						Mustache.to_html(tmpltr.structure, tmpltr.data)
					);
					var sTitle = tmpltr.$.output.body.find("h1:first").text().trim();
					document.title = tmpltr.appname;
					if (sTitle && sTitle !== tmpltr.appname) { document.title +=  " - " + sTitle; }
				}
				if ((sWhat === "style") || (sWhat === "all")) {
					tmpltr.$.output.head.html(
						$("<style />").html(tmpltr.style)
					);
				}
			},
			saveToLocal: function(){
				var obj = {
					data: tmpltr.editors.data.getSession().getValue(),
					structure: tmpltr.editors.structure.getSession().getValue(),
					style: tmpltr.editors.style.getSession().getValue()
				};
				localStorage.tmpltr = JSON.stringify(obj);
				return localStorage.tmpltr;
			},
			getLocal: function() {
				if (localStorage.tmpltr) {
					tmpltr.fn.useDataStructureStyle($.parseJSON(localStorage.tmpltr));
					return true;
				}
				return false;
			},
			getDefaults: function(){
				// probably not the cleanest way to do this...
				var iMilli = +new Date(), def = {};
				function areWeThereYet() {
					if (def.data && def.structure && def.style) {
						tmpltr.fn.useDataStructureStyle(def);
					}
				}
				$.get("defaults/data.json?" + iMilli, function(resp) {
					def.data = resp;
					areWeThereYet();
				}, "text");
				$.get("defaults/structure.html?" + iMilli, function(resp) {
					def.structure = resp;
					areWeThereYet();
				}, "text");
				$.get("defaults/style.css?" + iMilli, function(resp) {
					def.style = resp;
					areWeThereYet();
				}, "text");
				return true;
			},
			reset: function(){
				delete localStorage.tmpltr;
				tmpltr.fn.getDefaults();
			},
			export: function(){
				// will open a data URI in a new window, some browsers may cut it off...
				var sTitle = tmpltr.$.output.body.find("h1:first").text().trim();
				var sUrl = "data:text/html," +
				encodeURIComponent(
					(sTitle ? "<title>" + sTitle + "</title> " : "") +
					"<body>" + Mustache.to_html(tmpltr.structure, tmpltr.data) + "</body> " +
					"<style>" + tmpltr.style + "</style> " +
					"<form action='" + document.location.protocol + "//" + document.location.host + document.location.pathname + "' method='get' style='display:none'>" + 
						"<textarea name='data'>" + tmpltr.editors.data.getSession().getValue() + "</textarea> " +
						"<textarea name='structure'>" + tmpltr.editors.structure.getSession().getValue() + "</textarea> " +
						"<textarea name='style'>" + tmpltr.editors.style.getSession().getValue() + "</textarea> " +
					"</form> " +
					"<script src='" + document.location.protocol + "//" + document.location.host + document.location.pathname + "js/external.js'></script>"
				);
				window.open(sUrl);
			},
			getFromUrl: function(){
				// http://stackoverflow.com/questions/439463/how-to-get-get-and-post-variables-with-jquery
				var params = (function(){
					var qs = document.location.search.split("+").join(" ");
					var params = {}, tokens, re = /[?&]?([^=]+)=([^&]*)/g;
					while (tokens = re.exec(qs)) {
						params[decodeURIComponent(tokens[1])] = decodeURIComponent(tokens[2]);
					}
					return params;
				}());
				if (!params.data || !params.structure || !params.style) { return false; }
				tmpltr.fn.useDataStructureStyle(params);
				// clean up URL
				if (Modernizr.history) {
					history.replaceState(null, null, document.location.pathname);
				}
				return true;
			},
			fileDragOver: function (evt) {
				evt.stopPropagation();
				evt.preventDefault();
				$body.addClass("dropit");
			},
			fileDrop: function (evt) {
				evt.stopPropagation();
				evt.preventDefault();
				var files = evt.dataTransfer.files;
				for (var i = 0, f; f = files[i]; i++) {
					var reader = new FileReader();
					reader.onload = (function (theFile) {
						return function (e) {
							// clean this up!
							if (theFile.name.indexOf(".json") > -1) {
								tmpltr.editors.data.getSession().setValue(e.target.result);
								tmpltr.fn.setData(e.target.result);
							} else if (theFile.name.indexOf(".html") > -1) {
								tmpltr.editors.structure.getSession().setValue(e.target.result);
								tmpltr.fn.setStructure(e.target.result);
							} else if (theFile.name.indexOf(".css") > -1) {
								tmpltr.editors.style.getSession().setValue(e.target.result);
								tmpltr.fn.setStyle(e.target.result);
							}
						};
					})(f);
					reader.readAsText(f);
				}
				tmpltr.fn.renderOutput();
				tmpltr.fn.saveToLocal();
				$body.removeClass("dropit");
			}
		} // fn
	};

	// instantiate ace editors
	var editors = [
		{ name: "data", id: "preData", mode: require("ace/mode/json").Mode  },
		{ name: "structure", id: "preStructure", mode: require("ace/mode/html").Mode },
		{ name: "style", id: "preStyle", mode: require("ace/mode/css").Mode }
	];
	$.each(editors, function (iEditor, editor) {
		var $editor = tmpltr.$[editor.name] = $("#" + editor.id);
		var oEditor = ace.edit(editor.id);
		oEditor.setTheme("ace/theme/twilight");
		oEditor.getSession().setMode(new editor.mode);
		oEditor.renderer.setShowGutter(false);
		oEditor.renderer.setShowPrintMargin(false);
		oEditor.getSession().setUseSoftTabs(true);
		tmpltr.editors[editor.name] = oEditor;
		oEditor.on("focus", function(){ $editor.addClass("focus"); });
		oEditor.on("blur", function(){ $editor.removeClass("focus"); });
	});

	// attempt: fill from URL, get localStorage, or load defaults; then render
	if (!tmpltr.fn.getFromUrl()) {
		if (!tmpltr.fn.getLocal()) {
			tmpltr.fn.getDefaults();
		}
	}
	tmpltr.fn.renderOutput();

	// bind change events (not perfect: doesn't know paste, deleting)
	// could be abstracted more
	tmpltr.editors.data.getSession().on('change', function() {
		tmpltr.fn.setData(tmpltr.editors.data.getSession().getValue());
		tmpltr.fn.renderOutput("html");
		tmpltr.fn.saveToLocal();
	});
	tmpltr.editors.structure.getSession().on('change', function() {
		tmpltr.fn.setStructure(tmpltr.editors.structure.getSession().getValue());
		tmpltr.fn.renderOutput("html");
		tmpltr.fn.saveToLocal();
	});
	tmpltr.editors.style.getSession().on('change', function() {
		tmpltr.fn.setStyle(tmpltr.editors.style.getSession().getValue());
		tmpltr.fn.renderOutput("style");
		tmpltr.fn.saveToLocal();
	});
	
	tmpltr.$.nav = $("#nav");

	// view switcher and nav links
	tmpltr.$.nav
		.on("click", ".inpView", function(){
			var $checked = tmpltr.$.nav.find("input:checked"), sVal = $checked.val();
			$body.attr("role", sVal);
			localStorage.view = sVal;
			$.each(tmpltr.editors, function(i, editor) {
				editor.resize();
			});
		})
		.on("click", "#aReset", function(){
			tmpltr.fn.reset();
			return false;
		})
		.on("click", "#aExport", function(){
			tmpltr.fn.export();
			return false;
		});

	// view in localStorage?
	if (localStorage.view) { $(".inpView[value='" + localStorage.view + "']").click(); }
	
	// handle files getting dragged into document
	if (Modernizr.file) {
		$body[0].addEventListener('dragover', tmpltr.fn.fileDragOver, false);
		$body[0].addEventListener('drop', tmpltr.fn.fileDrop, false);
		tmpltr.$.output.body[0].addEventListener('dragover', tmpltr.fn.fileDragOver, false);
		tmpltr.$.output.body[0].addEventListener('drop', tmpltr.fn.fileDrop, false);
	}

	// force links in output out of iframe
	tmpltr.$.output.body.on("click", "a", function() {
		var $a = $(this);
		if ($a.attr("href") && $a.attr("href") !== "#") {
			document.location = $a.attr("href");
		}
	});

	$body.removeClass("loading");

});