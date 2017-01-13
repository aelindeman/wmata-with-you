function template(locals) {
var buf = [];
var jade_mixins = {};
var jade_interp;
;var locals_for_with = (locals || {});(function (b, i, l, n, undefined) {
buf.push("<li" + (jade.attrs(jade.merge([{'data-id': i}]), false)) + "><span class=\"name\">" + (jade.escape(null == (jade_interp = n) ? "" : jade_interp)));
if ( l)
{
// iterate l
;(function(){
  var $$obj = l;
  if ('number' == typeof $$obj.length) {

    for (var $index = 0, $$l = $$obj.length; $index < $$l; $index++) {
      var i = $$obj[$index];

buf.push("<span" + (jade.cls(['l',i], [null,true])) + "><span class=\"hidden\">" + (jade.escape(null == (jade_interp = i) ? "" : jade_interp)) + "</span></span>");
    }

  } else {
    var $$l = 0;
    for (var $index in $$obj) {
      $$l++;      var i = $$obj[$index];

buf.push("<span" + (jade.cls(['l',i], [null,true])) + "><span class=\"hidden\">" + (jade.escape(null == (jade_interp = i) ? "" : jade_interp)) + "</span></span>");
    }

  }
}).call(this);

}
else if ( b)
{
buf.push("<span class=\"r\">" + (jade.escape(null == (jade_interp = b) ? "" : jade_interp)) + "</span>");
}
buf.push("</span><ul class=\"actions\"><li class=\"move-up\"><a href=\"javascript:;\">&uarr;</a></li><li class=\"move-down\"><a href=\"javascript:;\">&darr;</a></li><li class=\"remove\"><a href=\"javascript:;\">&times;</a></li></ul></li>");}.call(this,"b" in locals_for_with?locals_for_with.b:typeof b!=="undefined"?b:undefined,"i" in locals_for_with?locals_for_with.i:typeof i!=="undefined"?i:undefined,"l" in locals_for_with?locals_for_with.l:typeof l!=="undefined"?l:undefined,"n" in locals_for_with?locals_for_with.n:typeof n!=="undefined"?n:undefined,"undefined" in locals_for_with?locals_for_with.undefined:typeof undefined!=="undefined"?undefined:undefined));;return buf.join("");
}