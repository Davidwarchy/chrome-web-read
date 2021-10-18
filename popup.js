// Copyright 2018 The Chromium Authors. All rights reserved.
// Use of this source code is governed by a BSD-style license that can be
// found in the LICENSE file.

'use strict';

let changeColor = document.getElementById('changeColor');

chrome.storage.sync.get('color', function(data) {
  changeColor.style.backgroundColor = data.color;
  changeColor.setAttribute('value', data.color);
});

changeColor.onclick = function(element) {
  let color = element.target.value;
  // The extension must query the active tab
  // before it can injected a content script
  
	chrome.tabs.query({active: true, currentWindow: true}, function(tabs) {
		chrome.tabs.executeScript(
		  tabs[0].id,
		  // Scripts injected with tabs.executeScript() will not have access to
		  // variables from this context, leaving |color| undefined.
		  {code: 'document.body.style.backgroundColor = "' + color + '" ;'});
	});
	//chrome.tabs.create({
    //  url: 'https://www.google.com'
    //});
};
