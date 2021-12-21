'use strict';

let bigDic = {};
let purgatory = {};

chrome.runtime.onInstalled.addListener(function() {
  loadDictionary().then(r=>[bigDic, purgatory]=r);
  
  chrome.storage.sync.set({color: '#FFC000'}, function() {
    console.log('The color is green.');
  });
  chrome.storage.sync.set({'dictionary': bigDic}, function() {
    console.log('dictionary set to chrome storage');
  });
  chrome.storage.sync.set({'purgatory': purgatory}, function() {
    console.log('purgatory  set to chrome storage');
  });
});

async function loadDictData() {
    let bigDicFile = fetch(chrome.runtime.getURL(
        "data/objects.csv")).then(r => r.text());
    let purgatoryFile = fetch(chrome.runtime.getURL(
        "data/purgatory.csv")).then(r => r.text());
    return Promise.all([bigDicFile, purgatoryFile]);
}

async function loadDictionary() {
	console.log("loading dic...");
    let [bigDicFile, purgatoryFile] = await loadDictData();
	
	let bigDicLines = bigDicFile.split('\r\n');
	
	let keys = ["thing_1" ,"type", "thing_2", "expect", "expected_times", "frequency"];
	
	for(let line in bigDicLines){
		let entry = bigDicLines[line].split(',');
		bigDic[entry[0]] = {};
		for(let i=0; i<keys.length; i++){
			bigDic[entry[0]][keys[i]] = entry[i];
		}
	}	
	
	let purgatoryLines = purgatoryFile.split('\r\n');
	purgatoryLines = purgatoryLines.slice(0, purgatoryLines.length-2);
	keys = ["thing","frequency"];
	
	for(let line in purgatoryLines){
		let entry = purgatoryLines[line].split(',');
		purgatory[entry[0]] = {};
		for(let i=0; i<keys.length; i++){
			if (!isNaN(parseInt(entry[i]))){
				entry[i]=parseInt(entry[i]);
			}
			purgatory[entry[0]][keys[i]] = entry[i];
		}
	}
	
	let partialDic = {};
	Object.keys(bigDic).slice(0,20).map(x=>partialDic[x]=bigDic[x]);
	console.table(partialDic);
	partialDic = {};
	Object.keys(bigDic).slice(0,20).map(x=>partialDic[x]=purgatory[x]);
	console.table(partialDic);
	
	return [bigDic, purgatory];
}

function analyse(text){
	console.log('analysing...');
	function inBigDic(word){
		return bigDic[word]!=null;
	}
	
	function inPurgatory(word){
		return purgatory[word]!=null;
	}
	
	function incrementBigDicCount(word){
		if (inBigDic(word)){
			bigDic[word]["frequency"] = bigDic[word]["frequency"]+1;
		}
	}
	
	function incrementPurgatoryCount(word){
		if (inPurgatory(word)){
			purgatory[word]["frequency"] = purgatory[word]["frequency"]+1
		}
	}
	
	function addToPurgatory(word){
		purgatory[word] = {"thing":word, "frequency":1};
    }
	
	chrome.storage.sync.get('purgatory', function(data) {
		purgatory = data;
	});
	
	chrome.storage.sync.get('dictionary', function(data) {
		bigDic = data;
	});
	
	text = text.split('.')
	for(let i = 0;i<text.length;i++){
		let sent = text[i];
		let sent_words = sent.split(' ');
		for(let j=0;j<sent_words.length;j++){
			let word = sent_words[j];
			if(inBigDic(word)){
				incrementBigDicCount(word);
			}else if(inPurgatory(word)){
				incrementPurgatoryCount(word);
			}else{
				addToPurgatory(word);
			}
		}
	}
	console.table(purgatory);
}

chrome.runtime.onMessage.addListener(function (request, sender, callback) {

    switch (request.type) {

        case 'transmit_article': {
            analyse(request.text);
        }
            break;
	}
});