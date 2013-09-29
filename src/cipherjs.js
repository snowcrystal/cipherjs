var cipherJS = new Object();

cipherJS.init = new Object();
cipherJS.init.entropyId = null; 
cipherJS.init.entropyInfoId = null; 
cipherJS.init.doneDOMObj = null;
cipherJS.init.doneInfoDOMObj = null;

/**
* Initiate SJCL's PRNG by collecting random values from mouse/ touchpad,
* window.crypto.getRandomValues and Math.random (yes, it is not secure
* in all browsers - that's what getRandomValues and the mouse thing are for).
* events.
* ----------------------------------------------------------------------
* @param   {String}    entropyId        ID of the element where the progress
*                                       of collection will be shown and where
*                                       the doneDOMObj will be displayed when 
*                                       enough values have been collected.
* @param   {DOMObject} doneDOMObj       DOM object to display when values
*                                       have been collected.
* @param   {String}    entropyInfoId    (Optional) ID of the element where you
*                                       provide some info like "Move your 
*                                       mouse or use your fingers on your 
*                                       touchpad/ touchscreen as randomly 
*                                       as possible until you see a 100% and the
*                                       proceed button below".
*                                       This message will disappear and @doneInfoDOMObj
*                                       will be shown when entropy is collected (i.e.
*                                       if window.crypto.getRandomValues is available, so
*                                       users won't see this message at all, or when 
*                                       they've moved long enough for entropy to be 
*                                       collected).
* @param   {DOMObject} doneInfoDOMObj   (Optional) Can be something empty or whatever you wish to
*                                       additionally tell the user (such as "Click on the
*                                       proceed button below to go to our page") after
*                                       entropy has been collected.
* */
cipherJS.init.init = function(entropyId, doneDOMObj, entropyInfoId, doneInfoDOMObj){
	windowonerrorBackup = window.onerror;
	window.onerror = function(){
	  return true;
	};
	cipherJS.init.entropyId = entropyId;
	cipherJS.init.doneDOMObj = doneDOMObj;
	if(entropyInfoId!="undefined") cipherJS.init.entropyInfoId = entropyInfoId;
	if(doneInfoDOMObj!="undefined") cipherJS.init.doneInfoDOMObj = doneInfoDOMObj;
	document.addEventListener("touchmove", cipherJS.init.touchMoveMapper, true);
	document.addEventListener("mousemove", cipherJS.init.update, true);
    sjcl.random.startCollectors();
    window.setTimeout(cipherJS.init.update, 0);
};

/**
 * Updates the random value elements. Do not call this manually.
 * */
cipherJS.init.update = function(){
	var elem = document.getElementById(cipherJS.init.entropyId);
	var domobj = cipherJS.init.doneDOMObj;
	var progress = sjcl.random.getProgress(10);
	if(progress === undefined || progress==1) {
		elem.innerHTML = "";
		elem.appendChild(cipherJS.init.doneDOMObj);
		if(cipherJS.init.entropyInfoId!=null){
			var infoElem = document.getElementById(cipherJS.init.entropyInfoId);
			infoElem.innerHTML = "";
			infoElem.appendChild(cipherJS.init.doneInfoDOMObj);
		}
		sjcl.random.stopCollectors();
		document.removeEventListener("touchmove", cipherJS.init.touchMoveMapper);
		document.removeEventListener("mousemove", cipherJS.init.update);
		window.onerror = windowonerrorBackup;
	} else {
		var prg = Math.round((progress.toFixed(2)*100));
		prg = prg + "%";
		elem.innerHTML = prg;
	}
};

cipherJS.init.touchMoveMapper = function(event)
{
    var touches = event.changedTouches,
        first = touches[0],
        type = "";
    switch(event.type)
    {
        case "touchmove":  type="mousemove"; break;        
        default: return;
    }
    var simulatedEvent = document.createEvent("MouseEvent");
    simulatedEvent.initMouseEvent(type, true, true, window, 1, 
                              first.screenX, first.screenY, 
                              first.clientX, first.clientY, false, 
                              false, false, false, 0, null);

    first.target.dispatchEvent(simulatedEvent);
    event.preventDefault();
};
