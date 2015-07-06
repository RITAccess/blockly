'use strict';
/**
 * @license
 * Visual Blocks Editor
 *
 * Copyright 2012 Google Inc.
 * https://developers.google.com/blockly/
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

/**
 * @fileoverview object that retrieves an array of blocks in the workspace and generates comments.
 * @author Amber Libby, Alex Bowen, Mary Costa, Rachael Bosley, Luna Meier
 */

goog.provide('Blockly.Accessibility.TreeView');

/**
 * gets all of the blocks that aren't conditionals and calls get indent on the array list it generates
 */
Blockly.BlockSvg.prototype.defaultFireChangeEvent = Blockly.BlockSvg.prototype.fireChangeEvent;

var commentableBlockArr = []; //an array of the blocks we will be checking for comments
var prefixArr = []; //an array containing the prefix for the comment generation
var indentationArr = []; //an array that stores the depth of the blocks for indentation
var stateChange = false;

/**
 * Whenever the workspace is modified it updates the state so that we better know when to call the comment generation
 */
Blockly.WorkspaceSvg.prototype.fireChangeEvent = function() {
  if (this.rendered && this.svgBlockCanvas_) {
    Blockly.fireUiEvent(this.svgBlockCanvas_, 'blocklyWorkspaceChange');
    stateChange = true;
  }
};

/**
 * If the state has changed in the workspace it updates the comments to match the new xml
 */
Blockly.Accessibility.TreeView.callImportantBlocks = function() {
	if(stateChange == true) {
		Blockly.Accessibility.TreeView.getImportantBlocks();
		stateChange = false;
	}
};

/**
 * Adds the important blocks to an array for an easily constructed tree view 
 */
Blockly.Accessibility.TreeView.getImportantBlocks = function(){
	//Check if the workspace is empty
	if (!xmlDoc || !xmlDoc.getElementsByTagName('BLOCK')) {
		console.log("nothings here");
        return null;
    }
    //Add all xml blocks to blockArr 
     var blockArr = xmlDoc.getElementsByTagName('BLOCK');

    commentableBlockArr = []; //empty the list from the last time it was called so that 

    //adding any blocks which can stand on their own to commentableBlockArr 
    for(var i=0; i < blockArr.length; i++) {
		var strType = blockArr[i].getAttribute('type'); //gets the type of blocks so that we can check if 
		//they are important blocks 
		if(strType.match(/controls/g)){
			commentableBlockArr.push(blockArr[i]);
		}
		else if(strType.match(/procedures/g)){
			commentableBlockArr.push(blockArr[i]);
		}
		else if(strType == "beep"){
			commentableBlockArr.push(blockArr[i]);
		}
		else if(strType == "math_change") {
			commentableBlockArr.push(blockArr[i]);
		}
		else if(strType == "text_append") {
			commentableBlockArr.push(blockArr[i]);
		}
		else if(strType == "text_print") {
			commentableBlockArr.push(blockArr[i]);
		}
		else if(strType == "list_setIndex") {
			commentableBlockArr.push(blockArr[i]);
		}
		else if(strType == "variables_set") {
			commentableBlockArr.push(blockArr[i]);
		}
	}
    Blockly.Accessibility.TreeView.getIndent(commentableBlockArr);
};

/**
 * Gets how deeply indented all the provided blocks are and passes that array into 
 * the commentPrefix along with the commentableBlockArr
 * @param {array} commentableBlockArr is the array of blocks that we are checking their indentation
 */
Blockly.Accessibility.TreeView.getIndent = function(commentableBlockArr){

	//the string format of the current XML Doc
	var currentXml = Blockly.Xml.domToPrettyText(Blockly.Xml.workspaceToDom(Blockly.mainWorkspace));
	
	var openStatementCnt; 
	var closeStatementCnt;
	var indexOfId;
	var idOfBlock;
	var miniXml;
	var i;
	var currNode;
	indentationArr = [];

	for(i = 0; i < commentableBlockArr.length; i++){
		currNode = commentableBlockArr[i];
		idOfBlock = currNode.getAttribute('id');
		indexOfId = currentXml.indexOf('id="'+idOfBlock+'"');
		miniXml = currentXml.substring(0, indexOfId);
		openStatementCnt = (miniXml.match(/<statement/g) || []).length;
		closeStatementCnt = (miniXml.match(/statement>/g) || []).length;
		indentationArr[i] = openStatementCnt - closeStatementCnt;
		indentationArr.push(indentationArr[i]);
	}
	indentationArr.splice(i);
	return indentationArr;
	//Blockly.Accessibility.TreeView.createComments(commentableBlockArr, indentationArr);
};

/**
 * Based on how the comments are placed this will generate their prefixes correctly to display them
 * in the proper order based on their indentation depth.
 * @param {array} commentableBlockArr is the array of blocks that potentially have comments
 * @param {array} indentationArr is an array that tracks how deeply nested the blocks are
 * @return {array} prefixArr is an array of the prefixes built for each block indent
 */
Blockly.Accessibility.TreeView.commentPrefix = function(commentableBlockArr, indentationArr){
	var zeroCount = 1;
    var allCount = 0;
    var prefixStringPrev; //prefix of the previous node
    prefixArr = []; //prefix arr to store all the prefix to comments

    for (var i = 0; i < indentationArr.length; i++) {
        if(indentationArr[i].toString() == "0"){
            prefixArr[i] = "*" + zeroCount.toString();
            zeroCount++;
            //console.log("this is level 0");
        }
        else{
            var currentIndent = indentationArr[i];
            var prevIndent = indentationArr[i-1];

            if(currentIndent == prevIndent){
                //at the same indent level

                var shortStr = prefixArr[i-1].length-1;
                var prevCount = prefixArr[i-1].substring(shortStr);

                var newCount = parseInt(prevCount);
                newCount++;

                var preString = prefixArr[i-1].substring(0, shortStr);

                prefixArr[i] = preString + newCount;
            }
            else if(currentIndent > prevIndent){
                //there is another indent
                prefixArr[i] = prefixArr[i-1] + ".1";
                prefixStringPrev = prefixArr[i];
            }
            else if(currentIndent < prevIndent){
                //there is one less indent here
                var indentDiff = prevIndent - currentIndent;
                var takeStr = indentDiff * 2;

                var prevPrefixStr = prefixArr[i-1];
                var prevPrefixStrLength = prevPrefixStr.length;
                var subStrVal = prevPrefixStrLength - takeStr;

                var thePrevPre = prevPrefixStr.substring(subStrVal);
               //x is the prev prefix string name we need
                var x = prevPrefixStr.substring(0, subStrVal-2);

                //get the last char of the prev indent and up that value by 1 
                //and append to the end of the prev string and set equal to the new prefix

                var lastNum = prevPrefixStr.substring(subStrVal-1, subStrVal);
                var num = parseInt(lastNum);
                num++;
                prefixArr[i] = x + "." + num;
            }
        }
    }
    return prefixArr;
};

/**
 * Generates the comments and places them into the div in the HTML to display the comments on the page
 * with the right format of prefixes. It puts all the comment blocks into <p> tags so they properly
 * display on the web.
 * @param {array} commentableBlockArr is the array of blocks that potentially have comments
 * @param {array} indentationArr is an array that tracks how deeply nested the blocks are
 */
Blockly.Accessibility.TreeView.createComments = function(commentableBlockArr, indentationArr){
  //clears the comment div of old data
  document.getElementById("comment").innerHTML = "";

  var pTag; 
  var commentStr;
  var prefixes = Blockly.Accessibility.TreeView.commentPrefix(commentableBlockArr, indentationArr);
  var indent;
  var currNode;
  for(var i = 0; i < commentableBlockArr.length; i++){
    commentStr = '';
    currNode = commentableBlockArr[i];
    pTag = document.createElement("p");
    pTag.setAttribute("tabindex", 0);
    pTag.setAttribute("id", i);
    indent = indentationArr[i];
    //checks how many indents a comment is going to have
    while(indent != 0) {
      commentStr += "---";
      indent--;
    }
    commentStr += " " + prefixes[i];

    if(commentableBlockArr[i].getElementsByTagName("comment")[0] == undefined){
      commentStr += " No comment";
    } 

    else{
    	//if the block has a comment it will be shown otherwise it will print no comment
        var parentsId = commentableBlockArr[i].getElementsByTagName("comment")[0].parentNode.getAttribute('id');
        if(parentsId == currNode.getAttribute('id')){
          var htmlComment = currNode.getElementsByTagName("comment")[0].innerHTML;
          commentStr += " " + htmlComment;
        }
        else{
          commentStr += " No comment";
        }
    }

    var pTextNode = document.createTextNode(commentStr);
    pTag.appendChild(pTextNode);
    document.getElementById("comment").appendChild(pTag);
  }
};

/**
* Uses the currently selected comment to jump to the block with the corresponding id.
*/
Blockly.Accessibility.TreeView.commentOrBlockJump = function(){
	//checks if something is not selected which would throw errors
	console.log(document.activeElement);
	
    if(getCurrentNode() != null && document.activeElement.id != "importExport") {
    	//jump from block to comment 
    	if(document.activeElement.id) {
    		var eleId = document.activeElement.id;
    		var blockId = commentableBlockArr[eleId].getAttribute('id');
    		jumpToID(blockId);
    	}
    	else {
    		//jump from comment to block
    		var highlightedBlock = getCurrentNode();
			for (var i = 0; i < commentableBlockArr.length; i++) {
	    		if(commentableBlockArr[i].getAttribute('id') == highlightedBlock.getAttribute('id')) {
	    			document.getElementById(i).focus();
	    		}
	    	}
    	}
	}
};

/**
 * Generates the information in the info box based on the block you are on.
 * (@param int) the id of the current node we are on
 */
Blockly.Accessibility.TreeView.infoBoxFill = function(currentNode){
	//erases any pre-existing text in the div
	document.getElementById("infoBox").innerHTML = "";
	var sectionStr = '';
	var depthStr = '';
	var prefixStr = '';
	var sectionP = document.createElement('p');
	var depthP = document.createElement('p');
	var prefixP = document.createElement('p');

	//Build String to put in box
	for (var i = 0; i < commentableBlockArr.length; i++) {
		if(currentNode.getAttribute('id') == commentableBlockArr[i].getAttribute('id')){	
			var indexOfPeriod = prefixArr[i].indexOf(".");
			if(indexOfPeriod == -1){
				var prefixLength = prefixArr[i].length;
				if(prefixLength == 2){
					sectionStr = "Section " + prefixArr[i].substring(1, 2);
				}
				else{
					sectionStr = "Section " + prefixArr[i].substring(1, 3);
				}
			}
			else if(indexOfPeriod == 2){
				sectionStr = "Section " + prefixArr[i].substring(1, 2);
			}
			else if(indexOfPeriod == 3){
				sectionStr = "Section " + prefixArr[i].substring(1, 3);
			}
			depthStr = "Depth " + (indentationArr[i] + 1);
			prefixStr = prefixArr[i].substring(1, prefixArr[i].length+1);
		}
	}
	//puts the text onto the page and in the div
	var sectionTextNode = document.createTextNode(sectionStr);
	var depthTextNode = document.createTextNode(depthStr);
	var prefixTextNode = document.createTextNode(prefixStr);
	sectionP.appendChild(sectionTextNode);
	depthP.appendChild(depthTextNode);
	prefixP.appendChild(prefixTextNode);
	document.getElementById('infoBox').appendChild(sectionP);
	document.getElementById('infoBox').appendChild(depthP);
	document.getElementById('infoBox').appendChild(prefixP);
};

/**
 * Will toggle the information box visible or invisible
 */
Blockly.Accessibility.TreeView.getInfoBox = function(){
	if(document.getElementById('infoBox').style.visibility == 'visible'){
		document.getElementById('infoBox').style.visibility='hidden';
	}
	else{
		document.getElementById('infoBox').style.visibility='visible';
	}
};

/**
 * A function that will generate the alphabetical representation of the number you give it
 */
Blockly.Accessibility.TreeView.getAlphabetical = function(number) {
	var alphabetList = ['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h', 'i', 'j', 'k', 'l', 'm', 'n', 
	'o', 'p', 'q', 'r', 's', 't', 'u', 'v', 'w', 'x', 'y', 'z'];
	var numberCount = 0;
	var repeatLetter = '';
	var bigLetter = '';
	while(number > 26) {
		//console.log('in the while');
		repeatLetter = alphabetList[numberCount];
		numberCount++;
		//console.log(repeatLetter);
		number = number - 26;
	}
	if(numberCount > 0)
	{
		bigLetter = repeatLetter + alphabetList[number];
		return bigLetter;
	}
	return alphabetList[number];
}

/**
 * will get all blocks and generate their prefixes
 */
Blockly.Accessibility.TreeView.getAllComments = function() {
	//Check if the workspace is empty
	if (!xmlDoc || !xmlDoc.getElementsByTagName('BLOCK')) {
		console.log("nothings here");
        return null;
    }
    //Add all xml blocks to blockArr 
     var blockArr = xmlDoc.getElementsByTagName('BLOCK');
     //array of indented blocks
     var indentArr = null//Blockly.Accessibility.TreeView.getIndent2(blockArr);
     var nextCount = 0;
     var capitalAlphabet = 0;
     var lowerAlphabet = 0;
     var newPrefixArr = [];
     var oldPrefix = '';
     var blockIndex = 1;
     var emptyVisited = false;
     var previousNode = null; //previous node for checking statements
     var storedStr = ''; // the stored str for weird jumps in indentation
     var statementCount = 1; //how indented the statement got
     var statementIndex = 1; //block index of statements
     var statementVisited = false;
     console.log(blockArr);
     //console.log(indentArr);
     for (var i = 0; i <= blockArr.length - 1; i++) {
     	//will find blocks that currently don't have any children
     	if(blockArr[i].childNodes.length == 0){
     		if(emptyVisited == true){
     			emptyVisited = false;
     		}
     		else{
     			oldPrefix = oldPrefix.substring(0, oldPrefix.length - 1) + blockIndex;
     			newPrefixArr.push(oldPrefix);
     			blockIndex++;
     			lowerAlphabet = 0;
     			previousNode = blockArr[i];
     		}
     	}
     	//will find blocks that arent connected to anything
     	if(blockArr[i].parentNode.nodeName == 'XML'){
     		blockIndex = 1;
     		oldPrefix = Blockly.Accessibility.TreeView.getAlphabetical(capitalAlphabet).toUpperCase() + blockIndex;
     		newPrefixArr.push(oldPrefix);
     		capitalAlphabet++;
     		lowerAlphabet = 0;
     		previousNode = blockArr[i];
     		emptyVisited = true;
     	}
     	for (var j = 0; j < blockArr[i].childNodes.length; j++) {
     		//this is for blocks nested inside of a block
     		if(blockArr[i].childNodes[j].nodeName == 'VALUE'){
     			if(lowerAlphabet > 0){
     				oldPrefix = oldPrefix.substring(0, oldPrefix.length - 1);
     			}
     			oldPrefix = oldPrefix + Blockly.Accessibility.TreeView.getAlphabetical(lowerAlphabet);
     			newPrefixArr.push(oldPrefix);
     			lowerAlphabet++;
     		}
     		//if our current node has something below it
     		else if(blockArr[i].childNodes[j].nodeName == 'NEXT'){
     			var lastPrefixStr = oldPrefix[oldPrefix.length - 1];
     			blockIndex++;
     			if(lastPrefixStr.match(/[a-z]/i)){
     				oldPrefix = oldPrefix.substring(0, oldPrefix.length - 1)
     			}
     			//if your counting after a statement
     			if(statementVisited == true) {
     				//childNodes[0] allows you to access the block within the next or statement tag
     				var prevNumberOfParents = Blockly.Accessibility.TreeView.getNumberOfParents(previousNode.childNodes[0]);
     				var curNumberOfParents = Blockly.Accessibility.TreeView.getNumberOfParents(blockArr[i].childNodes[j].childNodes[0]);
     				console.log(prevNumberOfParents);
     				console.log(curNumberOfParents);
     				var difference = prevNumberOfParents - curNumberOfParents;
     				if(difference == 0){
     					if(storedStr != '')
     					{
     						difference = 2;
     						oldPrefix = storedStr;
     						var lastGoodNumber = parseInt(oldPrefix.charAt(oldPrefix.length - (difference - 1)), 10);
     						oldPrefix = oldPrefix.substring(0, oldPrefix.length - (difference)) + "." + (lastGoodNumber + 1);	
     						console.log("OldPrefix if we went backwards before");
     						console.log(oldPrefix);	
     					}
     					else{
     						difference = 2;
     						var lastGoodNumber = parseInt(oldPrefix.charAt(oldPrefix.length - (difference - 1)), 10);
     						oldPrefix = oldPrefix.substring(0, oldPrefix.length - (difference)) + "." + (lastGoodNumber + 1);
     						console.log("Going Down normally");
     						console.log(oldPrefix);
     					}
     				}
     				else if(difference > 0){
     					//handles the case of the outtermost block since it has a different prefix
     					if(curNumberOfParents == 0)
     					{
     						difference = difference * 2;
     						storedStr = oldPrefix.substring(0, oldPrefix.length);
     						var lastGoodNumber = parseInt(oldPrefix.charAt(oldPrefix.length - (difference - 1)), 10);
     						oldPrefix = oldPrefix.substring(0, oldPrefix.length - (difference + 1)) + (lastGoodNumber + 1);
     						console.log("were going to a top node");
     						console.log(oldPrefix);
     						console.log(storedStr);
     					}
     					else{
     						difference = difference * 2;
     						storedStr = oldPrefix.substring(oldPrefix.length - (difference), oldPrefix.length);
     						var lastGoodNumber = parseInt(oldPrefix.charAt(oldPrefix.length - (difference - 1)), 10);
     						oldPrefix = oldPrefix.substring(0, oldPrefix.length - (difference)) + "." + (lastGoodNumber + 1);
     						console.log("we went backwards but still have some stuff to save");
     						console.log(oldPrefix);
     					}
     				}
     				newPrefixArr.push(oldPrefix);
     			}
     			//if your normally counting down
     			else{
     				console.log("just went down- same indent and no statement");
     				oldPrefix = oldPrefix.substring(0, oldPrefix.length - 1) + blockIndex;
     				newPrefixArr.push(oldPrefix);
     				lowerAlphabet = 0;
     				emptyVisited = true;
     				statementCount = 0;
     				previousNode = blockArr[i].childNodes[j];
     			}
     		}
     		//if you have a statement
     		else if(blockArr[i].childNodes[j].nodeName == 'STATEMENT'){
     			//console.log("more indented...only called for the first block in statement");
     			var lastPrefixStr = oldPrefix[oldPrefix.length - 1];
     			lowerAlphabet = 0;
     			if(lastPrefixStr.match(/[a-z]/i)){
     				oldPrefix = oldPrefix.substring(0, oldPrefix.length - 1)
     			}
     			statementCount++;
     			oldPrefix = oldPrefix + '.1';
     			newPrefixArr.push(oldPrefix);
     			emptyVisited = true;
     			statementVisited = true;
     			previousNode = blockArr[i].childNodes[j];
     		}
     		else{
     			console.log("This is a value");
     		}
     	}
    }
    var noDuplicatePrefixArr = newPrefixArr.filter(function(elem, pos) {
    return newPrefixArr.indexOf(elem) == pos;
   	});
    console.log(noDuplicatePrefixArr);
};

Blockly.Accessibility.TreeView.getIndent2 = function(blockArr){
	var statementCount = 0;
	var blockArrIndent = [];
	for (var i = 0; i < blockArr.length; i++) {
		var blockIndent = Blockly.Accessibility.TreeView.getNumberOfParents(blockArr[i]);
		blockArrIndent.push(blockIndent);
	}
	//console.log("This is the indent arr");
	//console.log(blockArrIndent);
	return blockArrIndent;
}

Blockly.Accessibility.TreeView.eliminateDuplicates = function(arr) {
  var i,
  len=arr.length,
  out=[],
  obj={};
 
  for (i=0;i<len;i++) {
    obj[arr[i]]=0;
  }
  for (i in obj) {
    out.push(i);
  }
  return out;
};

/**
 * Goes out of a block to go up a level
 */
Blockly.Accessibility.TreeView.getNumberOfParents = function(block) {
	var numberOfParents = 0;
	var topReached = false;
    while(topReached == false){
    	if (Blockly.Accessibility.Navigation.findTop(block).parentNode.nodeName.toUpperCase() == 'STATEMENT') {
        	block = Blockly.Accessibility.Navigation.findTop(block).parentNode.parentNode;
        	numberOfParents++;
    	}
    	else{
    		topReached = true;
    	}
    }
    //console.log(numberOfParents);
    return numberOfParents;
};