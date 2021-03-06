// This is a manifest file that'll be compiled into application.js.
//
// Any JavaScript file within this directory can be referenced here using a relative path.
//
// You're free to add application-wide JavaScript to this file, but it's generally better
// to create separate JavaScript files as needed.
//
//= require jquery
//= require bootstrap.min
//= require jquery-ui
//= require jquery.highlight
//= require jquery.selection
//= require selectize
//= require_tree .
//= require_self

if (typeof jQuery !== 'undefined') {
    (function($) {
        $('#spinner').ajaxStart(function() {
            $(this).fadeIn();
        }).ajaxStop(function() {
            $(this).fadeOut();
        });
    })(jQuery);
}

$(document).ready(function () {
    $("#footer").show();

    //Initialize tooltips
    $('.nav-tabs > li a[title]').tooltip();

    //Wizard
    $('a[data-toggle="tab"]').on('show.bs.tab', function (e) {

        var $target = $(e.target);
        // alert($target.attr('id'));
        if ($target.parent().hasClass('disabled')) {
            return false;
        }
    });

});

function activateStep($elem) {
    $elem.removeClass('disabled');
    $elem.find('a[data-toggle="tab"]').click();
}

//STARTING HERE
var selectedWordtoShowHighlights = false;
var lastItemToHighlightPost;
var selectedText;
var highlightListForTrainingQ = [];
var alertEditingLength = 10;
var alertHighlightLength = 1;
var alertEditing = "Please add some text of at least " + alertEditingLength + " characters";
var alertWords = "Please add at least " + alertHighlightLength+" highlights from the posts which includes a causal knowledge.";
var chunkIndex = 0;

var totalNumberofPosts = 0;
var randomColorList = [];
var randomColorToneList = [];

function highlightForAllChunks(questionId){
    $("#chunks-"+questionId + " .chunk").each(
        function(index, elem){
            highlightForOnlyOneChunk($(elem));
        });
}

function highlightForOnlyOneChunk($chunk){
    $chunk.find('.selectize-input .item').each(function(index, elem){
        highlightForOneItem(elem);
    });
}

function highlightForOneItem(elem){
    var itemText = $(elem).attr("data-value");
    $('#'+$(elem).attr("referencedPost")).highlight(itemText);//, {wordsOnly: true }
    $('#'+$(elem).attr("referencedPost")).find("span:contains('" + itemText + "')").each(
        function (index, elem2) {
            $(elem2).attr("referencedChunk", $(elem).attr("id"));
            $(elem2).css("background-color", $(elem).attr("bgColor"));
    });
}

function clearReferencedWordsFromPosts(questionId){ //fix it
    if($('#toggleAll-'+questionId).length > 0 && $('#toggleAll-'+questionId).attr("show") == "true"){

        $('.chunk').each(function(index, elem){
            $(elem).find('.selectize-input .item').each(function(index2, innerElem){
                var itemText = $(innerElem).attr("data-value");
                $('#'+$(innerElem).attr("referencedPost")).removeHighlight(itemText);
            });
        });

    }
    else{
        $('.currentChunk .selectize-input .item').each(function(index, elem){
            var itemText = $(elem).attr("data-value");
            $('#'+$(elem).attr("referencedPost")).removeHighlight(itemText);
        });
    }
}

jQuery.fn.removeHighlight = function (pat) {
    return this.find("span.highlight").each(function () {
        if (!pat || pat.toUpperCase() == $(this).html().toUpperCase()) {
            this.parentNode.firstChild.nodeName;
            with (this.parentNode) {
                replaceChild(this.firstChild, this);
                normalize();
            }
        }
    }).end();
};

function removeSelection(){
    if (window.getSelection) {
        if (window.getSelection().empty) {  // Chrome
            window.getSelection().empty();
        } else if (window.getSelection().removeAllRanges) {  // Firefox
            window.getSelection().removeAllRanges();
        } else if (document.selection) {  // IE?
            document.selection.empty();
        }
    }
}

function createPost(questionId,questionType, postText, postId, isLatest, isAnswerPage, isAdmin, isPrepend){ //merged with posts onclick
    var $div = $("<div>", {id: "post-"+postId, class: "post", "postColor": getRandomColor()});
    var $p = $("<p>");
    $p.html(postText);
    $div.append($p);
    if(isPrepend)
        $("#posts-"+questionId).prepend($div);
    else
        $("#posts-"+questionId).append($div);
    $div.click(function(){
        $("#posts-"+questionId + " .currentPost").removeClass("currentPost");
        $(this).addClass("currentPost");
        if(isAdmin || (questionType != "Type1" && !isAnswerPage)){
            var selectedText = $.selection();
            if (selectedText) {
                if ($('#chunks-' + questionId + ' .currentChunk').length != 0) {
                    if ($("#chunks-" + questionId + " div").length > 0) {
                        $('#posts-' + questionId + ' .currentPost p').highlight(selectedText);
                        $('#chunks-' + questionId + ' .currentChunk input')[0].selectize.createItem(selectedText);
                        var createdItem = $('#chunks-' + questionId + ' .currentChunk .selectize-input div').last();

                        createdItem.css('background-image',"none");
                        createdItem.attr("id", $(this).attr("id") + "-chunk-" + ($('#chunks-' + questionId + ' .currentChunk .selectize-input div').length - 1));
                        createdItem.attr("referencedPost", $(this).attr("id"));
                        createdItem.attr("bgColor",getRandomToneofColor($(this).attr('postColor')));
                        createdItem.css('background-color', createdItem.attr("bgColor") );
                        $("span:contains('" + selectedText + "')").each(
                            function (index, elem) {
                                $(this).attr("referencedChunk", createdItem.attr("id"));
                                $(this).css("background-color", createdItem.attr("bgColor"));
                            }); //oneTime, can be reassign after highlightForOnlyOneResult
                        //$('.currentResult textarea').val($('.currentResult input')[0].selectize.items.join(" "));
                        $("#addChunkAlert").hide();
                    }
                    else {
                        $("#addChunkAlert").show();
                    }
                    removeSelection();
                }
                else
                    alert("Select a chunk to add the highlights first!");
            }
        }
    });
    if(isLatest){
        $div.addClass("currentPost");
        $div.addClass("latestPost");
    }
    if(!isPrepend)
        focusOnTheLatest(questionId);
    return $div;
}

function createChunk(questionId,questionType, isAnswerPage, isAdmin, chunkText){
    collapseCurrentForAdd(questionId);
    $("#chunks-" + questionId + " .currentChunk").removeClass("currentChunk");

    var div = $("<div>", {id: "chunk-"+chunkIndex, class: "panel chunk"});
    var button = $("<button>", {'data-toggle':"collapse", id:"collapseSelective", class:"btn btn-info", 'data-parent':"#chunks-"+questionId, 'data-target':"#collapse-"+chunkIndex, style:"width:100%;"});
    var p1 = $("<p>", {id: "alertWords", class:"alertMsg"});
    p1.html('<span class="glyphicon glyphicon-exclamation-sign"></span>&nbsp;' + alertWords);
    var divInner = $("<div>", {id: "collapse-"+chunkIndex, class: "panel-collapse collapse in"});
    $(divInner).collapse({"toggle": false, 'parent': '#chunks-'+questionId});
    var input = $("<input>", {type: "text", placeholder:"Highlight some words from the posts"});
    var p2 = $("<p>", {id: "alertEditing", class:"alertMsg"});
    p2.html('<span class="glyphicon glyphicon-exclamation-sign"></span>&nbsp;' + alertEditing);
    var textArea = $("<textarea>", {class:"form-control", rows:"1", id:"textEdit", placeholder:"Enter some text here"});
    if(isAnswerPage || chunkText != "")
        textArea.val(chunkText);
    if(isAnswerPage)
        $("#chunks-" + questionId+" textarea").attr("readonly","");//added
    divInner.append(input);
    div.append(button);
    div.append(p1);
    div.append(divInner);
    div.append(p2);
    div.append(textArea);
    $("#chunks-"+questionId).append(div);

    $(div).addClass("currentChunk");
    chunkIndex++;

    $(input).selectize({
        plugins: ['drag_drop','remove_button'],
        delimiter: ',',
        persist: false,
        create: function(input) {
            return {
                value: input,
                text: input
            }
        },
        onItemAdd: function (value, item) {
            if($("#chunks-"+questionId + " .currentChunk .selectize-input .item").length > 1) //naive expectation: 1 for cause 1 for effect
                p1.hide();
            $(item).click(function(e){
                var target = e.target || e.srcElement;
                if(target.tagName != "A"){ //if cross is clicked to remove a word
                    //$("#posts").unhighlight({ element: 'span', className: 'highlight' });
                    if(selectedWordtoShowHighlights && lastItemToHighlightPost == $(item).attr('data-value')){
                        $(item).removeClass('active');
                        selectedWordtoShowHighlights = false;
                        if($('#toggleAll-'+questionId).attr("show") == "true"){
                            highlightForAllChunks(questionId);
                        }
                        else{
                            highlightForOnlyOneChunk(div);
                        }
                    }
                    else{
                        clearReferencedWordsFromPosts(questionId);//TODO somewhere
                        highlightForOneItem(item);
                        selectedWordtoShowHighlights = true;
                        lastItemToHighlightPost = $(item).attr('data-value');
                    }
                }
            });
        },
        onItemRemove: function (value, item) {
            $('#' + $(item).attr('referencedPost')).removeHighlight(value);
            //$('.currentResult textarea').val($('.currentResult textarea').val().replace(value,''));
            if(lastItemToHighlightPost == $(item).attr('data-value')){
                highlightForOnlyOneChunk(div);
                selectedWordtoShowHighlights = false;
            }
        },
        onChange: function (value){ //calling onItemRemove as well

        }
    });
    $("#chunks-"+questionId + " .currentChunk .selectize-input input").attr("readonly",'');
    if(!isAdmin) {
        if (questionType == "Type1" || (questionType == "Type2" && isAnswerPage))
            $("#chunks-"+questionId + " .currentChunk .selectize-input input").attr("disabled", 'disabled');//added important
    }
    $(div).find("button").click(function(e){ //this div only expandable using collapse icon
        if($('#toggleAll-'+questionId).attr("show") == "true"){
            collapseAll(questionId);
            setTimeout(function(){ $(this).click();}, 600);
        }
        else{
            if($(this).parent().hasClass("currentChunk")) {
                if ($(this).hasClass("collapsed")){
                    //expand will be done automatically by accordion structure
                    highlightForOnlyOneChunk($(this).parent());
                }
                else
                    afterCollapseCurrent(questionId);
            }
            else{
                $("#chunks-" + questionId + " .currentChunk").removeClass("currentChunk");
                $(this).parent().addClass("currentChunk");
                //others automatically will be collapsed due to accordion nature
                afterCollapseCurrent(questionId);
                highlightForOnlyOneChunk($(this).parent());
            }

            if(!isAnswerPage)
                $("#chunks-"+questionId + " .currentChunk textarea").removeAttr('readonly');
        }
    });

    $(textArea).on('change keyup paste', function() {
        if($(this).val().length < alertEditingLength)
            p2.show();
        else
            p2.hide();
    });
}


function highlightAndAddToChunk(questionId,referencedPost, selectedText, questionType, isAnswerPage, isAdmin){ //added modified
    if($("#chunks-" +questionId + " div").length > 0){
        $('#'+referencedPost).find("p").highlight(selectedText);
        $("#chunks-" +questionId + ' .currentChunk input')[0].selectize.createItem(selectedText);
        var $createdItem = $("#chunks-" +questionId + ' .currentChunk .selectize-input .item').last();
        $createdItem.attr("id", $("#chunks-" +questionId + ' .currentChunk').attr("id") + "-casual-"+($("#chunks-" +questionId + ' .currentChunk .selectize-input .item').length-1));
        $createdItem.attr("referencedPost", referencedPost);

        $createdItem.attr("bgColor",getRandomToneofColor($('#'+referencedPost).attr('postColor')));
        $createdItem.css('background-image',"none");
        $createdItem.css('background-color', $createdItem.attr("bgColor") );
        if(!isAdmin){
            if(questionType == "Type1" || (questionType == "Type2" && isAnswerPage))
                $createdItem.find("a").remove();
        };

        $('#'+referencedPost).find("span:contains('" + selectedText + "')").each(
            function(index, elem){
                $(elem).attr("referencedChunk",$createdItem.attr("id"));
                $(elem).css("background-color", $createdItem.attr("bgColor"));
            }); //oneTime, can be reassign after highlightForOnlyOneResult
        //$('.currentResult textarea').val($('.currentResult input')[0].selectize.items.join(" "));
        $("#addChunkAlert").hide();
    }
    else{
        $("#addChunkAlert").show();
    }
    removeSelection();
}

function removeChunk(questionId){
    clearReferencedWordsFromPosts(questionId);
    var idToFocus = $('#chunks-' + questionId + " .currentChunk").prev().attr("id");
    $('#chunks-' + questionId + " .currentChunk").remove();
    if($("#chunks-" + questionId +" .chunk").length > 0)
        $('#' + idToFocus).find('button').click();
}


function collapseCurrentForAdd(questionId){
    $("#posts-"+questionId).unhighlight({ element: 'span', className: 'highlight' });
    $("#chunks-" + questionId + " .currentChunk .in").collapse("hide");
    $("#chunks-" + questionId + " .currentChunk button").addClass('collapsed');
    //$(".currentChunk textarea").attr("readonly","");
    $("#chunks-" + questionId + " .currentChunk textarea").height(20);
    selectedWordtoShowHighlights = false;
}

function afterCollapseCurrent(questionId){
    $("#posts-"+questionId).unhighlight({ element: 'span', className: 'highlight' });
    $("#chunks-" + questionId + " .currentChunk textarea").height(20);
    selectedWordtoShowHighlights = false;
}

function focusOnTheLatest(questionId){
    $('#posts-'+questionId).scrollTop($('#posts-'+questionId)[0].scrollHeight);
}

//TODO make the id of chunksParent dynamic, edit all the subsequent functions accordingly
function prepareInputsforAdminTrainingChunksSubmit(qId){
    var id = $("<input>", {type: "hidden", name:"id", value: qId});
    $('#inputsToSubmit').append(id);
    if($("#chunks-"+qId+" .chunk").length > 0){
        var a = isThereEmptyWords();
        var b = isThereEmptyText();
        if(!( a || b)){
            var input_chunks = $("<input>", {type: "hidden", name:"numberOfChunks", value: $("#chunks-"+qId+" .chunk").length});
            $('#inputsToSubmit').append(input_chunks);

            $('.chunk').each(function(index, elem){
                var highlights = [];
                $(elem).find('.items .item').each(function(index, elem){
                    var highlight = {};
                    highlight.index = index;
                    highlight.value = $(elem).attr("data-value");
                    highlight.referencedPost = $(elem).attr("referencedPost");
                    highlights.push(highlight);
                });

                var input_highlights = $("<input>", {type: "hidden", name:"chunk-" + qId + "-" + index + "-highlights", value: JSON.stringify(highlights)});
                var input_text = $("<input>", {type: "hidden", name:"chunk-" + qId + "-" + index + "-text", value:$(elem).find("textarea").val()});
                $('#inputsToSubmit').append(input_highlights);
                $('#inputsToSubmit').append(input_text);

            });

            return true;
        }
        else{
            alert("Please fix the errors!");
            return false;
        }

    }
    else{
        alert("Add at least one causal chunk item first!");
        return false;
    }
}

function prepareInputsforAdminTestingHighlightsSubmit(){
    if($('.currentChunk .selectize-input .item').length == 0) {
        alert("Please add highlights!");
        return false;
    }
    else {
        $(".chunk").find('.items .item').each(function () {
            var input_highlight = $("<input>", {
                type: "hidden",
                name: "highlight",
                value: $(this).attr("data-value")
            });
            $('#inputsToSubmit').append(input_highlight);
        });

        return true;
    }
}

function collapseAll(questionId){
    var questionIdforPost = questionId;
    if(questionId.indexOf("-") > -1)
        questionIdforPost = questionId.split("-")[0];
    $("#chunks-"+questionId+" button").addClass("collapsed");
    $("#chunks-"+questionId+" .in").collapse("hide");
    //$("#chunks textarea").attr("readonly","");//added
    $("#posts-"+questionIdforPost).unhighlight({ element: 'span', className: 'highlight' });
    $('#toggleAll-'+questionId).html("Show All");
    $('#toggleAll-'+questionId).attr("show", "false");
    selectedWordtoShowHighlights = false;
}

function expandAll(isAnswerPage,questionId){
    $("#chunks-"+questionId+" .in").collapse("hide");
    setTimeout(function(){
        $("#chunks-"+questionId+" .panel-collapse").collapse("show");
        $("#chunks-"+questionId+" button.collapsed").removeClass("collapsed");
        $("#chunks-"+questionId+" .currentChunk").removeClass("currentChunk"); //added
        $('#toggleAll-'+questionId).html("Hide All");
        $('#toggleAll-'+questionId).attr("show", "true");
        if(isAnswerPage)
            $("#chunks-"+questionId+" textarea").attr("readonly","");//added
        else
            $("#chunks-"+questionId+" textarea").removeAttr('readonly');
    }, 600);

    highlightForAllChunks(questionId);
}

function expandCurrentCollapsed($chunk){
    // $chunk.find("button.collapsed").removeClass("collapsed");
    // // alert($chunk.find("div.collapse").className);
    // $chunk.find(".panel-collapse").collapse("show");
    // no need to expand manually, button is doing itself already, so just highlight the words as follows
    highlightForOnlyOneChunk($chunk);
}

function isThereEmptyText(){
    var emptyText = false;
    $(".chunk").each(
        function(index, elem){
            if($(elem).find("textarea").val() == "" || $(elem).find("textarea").val().length < alertEditingLength){
                $(elem).find("#alertEditing").show();
                emptyText = true;
            }
        });

    return emptyText;
}

function isThereEmptyWords(){
    var emptyWords = false;
    $(".chunk").each(
        function(index, elem){
            if($(elem).find(".selectize-input .item").length < alertHighlightLength){
                $(elem).find("#alertWords").show();
                emptyWords = true;
            }
        });

    return emptyWords;
}

function getRandomColor() {
    // var letters = '123456789ABCDEF'.split('');
    // var color;
    // while(true) {
    //     color = '#';
    //     for (var i = 0; i < 6; i++) {
    //         color += letters[Math.floor(Math.random() * 11)+4];
    //     }
    //     if(randomColorList.indexOf(color) == -1) {
    //         randomColorList.push(color);
    //         break;
    //     }
    // }

    // assumes hue [0, 360), saturation [0, 100), lightness [0, 100)
    var c = {};
    c.hue = randomColorList.length * (360 / totalNumberofPosts);

    randomColorList.push(c);
    return "hsl("+c.hue+",0%,0%)";


}

function getRandomToneofColor(color) {
    var c = {};
    c.hue = (color.split(",")[0]).split("(")[1];
    c.saturation = 50 + Math.floor(Math.random() * 10) + Math.floor(Math.random() * 40);
    c.lightness = 40 + Math.floor(Math.random() * 20) + Math.floor(Math.random() * 40);

    return "hsl("+c.hue+","+c.saturation+"%,"+c.lightness+"%)";
    // var mainColorR = color.substr(1,2); //manipulating R
    // var mainColorG = color.substr(3,2);
    // var mainColorB = color.substr(5,2);
    //
    // var letters = '0123456789'.split('');
    // var color_tone;
    // while (true) {
    //
    //     color_tone = '#';
    //     color_tone += mainColorR + mainColorG;
    //     for (var i = 0; i < 2; i++) {
    //         color_tone += letters[Math.floor(Math.random() * 10)];
    //     }
    //     if(randomColorToneList.indexOf(color_tone) == -1) {
    //         randomColorToneList.push(color_tone);
    //         break;
    //     }
    // }
    // return color_tone;

}