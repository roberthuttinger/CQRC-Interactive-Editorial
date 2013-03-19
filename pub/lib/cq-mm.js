//CQ Multimedia Utility Functions
//By Thomas Wilburn and the CQ Multimedia Team
//Uses jQuery 1.6+ for some functions, but does not require it.

(function($, window, undefined) {

	//This library is namespaced as multimedia.*;
	var multimedia = window.multimedia = window.multimedia ? window.multimedia : {};

	//LOCAL/PRIVATE VARIABLES
	var templateCache = {};

	//Internal version of $.extend() so that the library doesn't require jQuery to load.
	var extend = function(target, hash) {
		var src, copy, clone;
		for (key in hash) {
			copy = hash[key];
			if (target === copy) {
				continue;
			}
			if (copy !== undefined) {
				target[key] = copy;
	        }
	    }
	}

	//We extend the multimedia object, instead of just replacing it wholesale.
	extend(multimedia, {

/************
multimedia.commafy() takes a numerical string and adds commas every three digits starting
from the decimal. It also handles currency and negative numbers.
************/
		commafy: function(s) {
			s = s + "";
			var period = s.indexOf('.');
			if (period == -1) period = s.length;
			for (var i = (s.length - period) + 3; i < s.length; i +=4) {
				s = s.substr(0, s.length - i) + ',' + s.substr(s.length - i);
			}
			s = s.replace(/\-\,/, '-');
			s = s.replace(/\$\,/, '$');
			s = s.replace(/\$\-/, '-$');
			return s;
		},

/************
----REQUIRES JQUERY----
multimedia.alert() creates an alert attached to the top of the page in a fixed
position which fades out.

Used without parameters, this will simply flash a white bar to alert you that
something occurred. If you prefer a red or green alert, you must at least pass
in the type of error as boolean (true == green, false == red, NULL == white).

************/
    alert: function(message, type, duration, classname) {
			if (!$) throw ("Error in multimedia.alert(): jQuery not found.");
			$('#multimediaAlertDiv').remove();
			var message   = (message == null)   ? "" : message;
			var classname = (classname == null) ? "" : " class='" + classname + "'";
			var duration  = (duration == null)  ? 2000 : duration;
			var alertDiv  = $('<div id="multimediaAlertDiv"' + classname + '">' + message + '</div>');
			var type      = (type == null)      ? 2 : type;
			switch(type) {
      case true:
        bgColor = "#B0FFB0";
        break;
      case false:
        bgColor = "#FFB0B0";
        break;
      default:
        bgColor = "#FFFFFF";
      }
			$(alertDiv).css({
        "width"                 : "600px",
        "border"                : "1px solid #ececec",
        "text-align"            : "left",
        "position"              : "fixed",
        "top"                   : "0px",
        "left"                  : "50%",
        "margin-left"           : "-300px",
        "background-color"      : bgColor,
        "z-index"               : "5555",
        "text-align"            : "center",
	      "-moz-border-radius"    : "0 0 6px 6px",
        "-webkit-border-radius" : "0 0 6px 6px",
        "border-radius"         :	"0 0 6px 6px",
        "padding"               :	"10px 6px"
      });
      $('body').append($(alertDiv));
      $('#multimediaAlertDiv').delay(duration).slideUp(function() {
        $('#multimediaAlertDiv').remove();
      });
//       $('#multimediaAlertDiv').stop().animate({ "background-color": "#FFF" }, duration, function() {
//         $('#multimediaAlertDiv').slideUp(function() {
//           $('#multimediaAlertDiv').remove();
//         });
//       });
    },

/************
----REQUIRES JQUERY----
multimedia.inflate() pulls HTML layouts from specially-marked script tags and
populates them from an optional key-value hash. It also caches the templates
after first retrieval, to reduce DOM accesses.

To use this, you must place your HTML in <script> tags with the type="template"
and a valid ID (the string you pass in as the 'template' parameter). Layouts
can include replacement strings as mustache.js-style tags, such as {{sample}},
which will be swapped at runtime with the value of replacements.sample (or, if
replacements.sample does not exist, simply removed).

If prewrapped == true, inflate() returns a jQuery object instead of a string.
************/
		inflate: function(template, replacements, prewrapped) {
			if (!$) throw ("Error in multimedia.inflate(): jQuery not found.");
			var input, keyList = [];
			if (templateCache[template]) {
				input = templateCache[template].text;
				keyList = templateCache[template].keys;
			} else {
				input = $.trim($('script[type=template]#' + template).html());
				if (input == "") throw("Error in multimedia.inflate(): no template for '" + template + ".'");
				templateCache[template] = {};
				templateCache[template].text = input;
				templateCache[template].keys = [];
				var matches = input.match(/\{\{.*?\}\}/g);
				if (matches) for (var i = 0; i < matches.length; i++) {
					var match = matches[i].replace(/[{}]/g, '');
					templateCache[template].keys.push(match);
				}
				keyList = templateCache[template].keys;
			}
			var output = input;
			for (var j = 0; j < keyList.length; j++) {
				var key = keyList[j];
				var needle = '{{' + key + '}}';
				var sub = replacements && replacements[key] != undefined ? replacements[key] : "";
				output = output.replace(needle, sub);
			}
			if (prewrapped) return $(output);
			return output;
		},

/**********
multimedia.inherit() is a helper function for easier prototypal
inheritance. If it is called with only one parameter, it will instantiate
an object using "from" as a prototype, and calling the init() method as a
pseudo-constructor (if one exists). "Classes" created from these prototypes can
also be instantiated just using the "new" parameter.

If called with two parameters, it will instead extend "from" using "extension",
making it an easy way to design a base prototype and then chain descendant
prototypes from there.

Note that none of these descendants will return valid results under the
instanceof operator, but since instanceof is pretty much completely broken in
JavaScript to begin with, that's not really a big concern.
**********/

		inherit: function(from, extension) {
			function f() {
				if (this.init) this.init();
			};
			f.prototype = from;
			var r = new f();
			if (extension) {
				$.extend(r, extension);
			}
			return r;
		},

/************
multimedia.augment() provides multiple inheritance through an Interface, or a
mix-in pattern. It is typically called with two parameters--the target that
should recieve the mix-in, and the Interface function, which is written like a
JS constructor (using "this" to refer to the target).

If you plan on augmenting a single object with multiple interfaces, you can call
it with a single argument, and it will return a chainable object with two
methods: using(), which augments the original target and continues chaining,
and end(), which returns the augmented object.

It is good practice to design Interface "constructors" using a closure, to
reduce their memory footprint. For example, this function:

function Interface() {
	this.method = function() {...};
}

will use a much greater amount of memory than this one:

var Interface = (function() {
	var method = function() {...};
	return function() {
		this.method = method;
	}
})()

because the latter creates the method() function only once within the closure,
then returns the actual Interface from the self-executing function, whereas the
former creates a unique method() for every augmented object.
************/

		augment: function(target, Interface) {
			if (Interface) {
				Interface.call(target);
			} else return {
				using: function(Interface) {
					Interface.call(target);
					return this;
					},
				end: function() {
					return target;
				}
			}
		},

/************
multimedia.desync() addresses a common problem when debugging communication
between the AS3 VM and the browser's JavaScript runtime when using Flash's
ExternalInterface calls. Basically, setting a breakpoint inside a JS function
called from ActionScript will cause the browser to hang as the AS3 VM blocks
for the function's return value. desync wraps the function in a short timeout,
allowing Flash to return immediately, while allowing the JavaScript to execute
as normal.

Due to flaws in Javascript's pass-by-value/pass-by-reference rules, you must
set the new function to the return value of desync, instead of simply calling
it on the target function. In other words,

desync(bridgeFunction);

will leave the original untouched, because function references in the wider
scope can't be modified. You must instead write it as:

bridgeFunction = desync(bridgeFunction);

It is also worth noting that declaring functions inside other functions using

function functionName() {...}

syntax is not technically valid JavaScript, and browsers are not guaranteed to
support it, or may do so with undocumented behavior. Use variable syntax
instead:

var functionName = function() {...}

************/

		desync: function(f) {
		    return function() {
		        var args = arguments;
		        setTimeout(function() {
		            f.apply(this, args);
		        }, 10);
		    }
		},


/************
multimedia.xmlObjectify() is used to convert an XML node to a standard JavaScript
object. It works best on well-formed XML--lots of hard returns or comments will
screw things up. It works by recursively walking the XML DOM, setting _both_
attributes and child nodes to properties of the object. If there is more than one
child node with the same name, they'll be placed in an array together.
xmlObjectify() accepts jQuery objects, but it does not actually rely on jQuery for
parsing.

Note that xmlObjectify() preserves the explicit structure of the XML file, so
properties may be buried several lookups deeper than native JavaScript objects
would typically be constructed. Blame Tim Bray.
************/
		xmlObjectify: function(xml) {
			if (xml.jquery) {
				xml = xml.get(0);
			}
			var i = 0, structure = { };
			var objectify = multimedia.xmlObjectify;
			var cast = function(untyped) {
				var typed;
				if (!parseFloat(untyped) && parseFloat(untyped) !== 0) {
					if (untyped.toLowerCase() == "true" || untyped.toLowerCase() == "false") {
						if (untyped.toLowerCase() == "true") {
							typed = true;
						} else {
							typed = false;
						}
					} else {
						typed = untyped;
					}
				} else {
					typed = parseFloat(untyped);
				}
				return typed;
			}

			var attrList = xml.attributes;
			if (attrList) for (i = 0; i < attrList.length; i++) {
				var attr = attrList[i].nodeName;
				var xmlVal = xml.getAttribute(attr) + "";
				structure[attr] = cast(xmlVal);
			}

			var childList = xml.childNodes;
			if (childList && childList.length) for (i = 0; i < childList.length; i++) {
				var branch = childList[i];
				var propName = branch.nodeName;
				if (propName == "#text") {
					if (branch.data && branch.data.replace(/[\W\n\r]/g, '')) {
						var textContent = branch.data;
						return cast(textContent);
					}
					continue;
				}
				if (propName == 'xml') continue;
				if (structure[propName]) {
					if (structure[propName].push) {
						structure[propName].push(objectify(branch));
					} else {
						var leaf = objectify(branch);
						structure[propName] = [structure[propName], leaf];
					}
				} else {
					structure[propName] = objectify(branch);
				}
			} else return null;

			return structure;
		},

/************
multimedia.IPubSub is an interface for giving objects the ability to publish
and subscribe to custom events. It adds three methods to its target: subscribe()
adds an event listener, unsubscribe() remove one (or all) listeners for a given
event, and publish() sends an event and a data object out to registered listeners.

The pipeline is contained in a closure, so as not to be visible to the rest of
the namespace. You can also call IPubSub() directly on an object, but I would
recommend using multimedia.augment() to implement the interface on your prototypes.
*************/

		IPubSub: (function() {
			var pipeline = {};
			var subscribe = function(e, f) {
				if (!pipeline[e]) pipeline[e] = [];
				pipeline[e].push({target: this, callback: f});
				return this;
			}
			var unsubscribe = function(e, f) {
				if (!pipeline[e]) return;
				var callbacks = pipeline[e];
				var replacement = [];
				for (var i = 0; i < callbacks.length; i++) {
					var c = callbacks[i];
					if (c.target == this) {
						if (f && f != c.callback) {
							replacement.push(c);
						}
					}
				}
				pipeline[e] = replacement;
				return this;
			}
			var publish = function(e, data) {
				if (!pipeline[e]) return;
				var callbacks = pipeline[e];
				for (var i = 0; i < callbacks.length; i++) {
					var c = callbacks[i];
					c.callback.call(c.target, e, data);
				}
				return this;
			}
			return function(target) {
				if (!target) target = this;
				target.subscribe = subscribe;
				target.unsubscribe = unsubscribe;
				target.publish = publish;
				return target;
			}
		})()

	});

})($, window);

