
var ua = navigator.userAgent.toLowerCase();
var head= document.getElementsByTagName('head')[0];
var script= document.createElement('script');
if(ua.indexOf("blackberry")>=0){
	script.type= 'text/javascript';
	script.src= './js/xui/xui.bb.min.js';
	head.appendChild(script);
}else if(ua.indexOf("msie")>=0){
	script.type= 'text/javascript';
	script.src= './js/xui/xui.ie.min.js';
	head.appendChild(script);
}else{
	script.type= 'text/javascript';
	script.src= './js/xui/xui.min.js';
	head.appendChild(script);
}
