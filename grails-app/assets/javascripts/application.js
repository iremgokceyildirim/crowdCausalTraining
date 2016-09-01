// This is a manifest file that'll be compiled into application.js.
//
// Any JavaScript file within this directory can be referenced here using a relative path.
//
// You're free to add application-wide JavaScript to this file, but it's generally better
// to create separate JavaScript files as needed.
//
//= require jquery
//= require bootstrap
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
var alertEditingLength = 20;
var alertEditing = "Please add some text of at least " + alertEditingLength + " characters";
var alertWords = "Please add at least two words of cause-and-effect by highlighting some words from the posts";
var chunkIndex = 0;

function highlightForAllChunks(){
    $("#chunks .chunk").each(
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
    var itemText = $(elem).text();
    itemText = itemText.slice(0, -1);
    $('#'+$(elem).attr("referencedPost")).highlight(itemText);
}

function clearReferencedWordsFromPosts(){ //fix it
    if($('#toggleAll').length > 0 && $('#toggleAll').attr("show") == "true"){

        $('.chunk').each(function(index, elem){
            $(elem).find('.selectize-input .item').each(function(index2, innerElem){
                var itemText = $(innerElem).text();
                itemText = itemText.slice(0, -1);
                $('#'+$(innerElem).attr("referencedPost")).removeHighlight(itemText);
            });
        });

    }
    else{
        $('.currentChunk .selectize-input .item').each(function(index, elem){
            var itemText = $(elem).text();
            itemText = itemText.slice(0, -1);
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

function createPost(questionType, postText, postId, isLatest, isAnswerPage, isAdmin){ //merged with posts onclick
    var $div = $("<div>", {id: "post-"+postId, class: "post"});
    var $p = $("<p>");
    $p.html(postText);
    $div.append($p);
    $("#posts").append($div);
    $div.click(function(){
        $(".currentPost").removeClass("currentPost");
        $(this).addClass("currentPost");
        if(isAdmin || (questionType != "Type1" && !isAnswerPage)){
            var selectedText = $.selection();
            if(selectedText){
                if($("#chunks div").length > 0){
                    $('.currentPost p').highlight(selectedText);//{ wordsOnly: true }
                    $('.currentChunk input')[0].selectize.createItem(selectedText);
                    var createdItem = $('.currentChunk .selectize-input div').last();
                    createdItem.attr("id", $('.currentChunk').attr("id") + "-chunk-"+($('.currentChunk .selectize-input div').length-1));
                    createdItem.attr("referencedPost", $('.currentPost').attr("id"));
                    $("span:contains('" + selectedText + "')").each(
                        function(index, elem){
                            $(this).attr("referencedChunk",createdItem.attr("id"));
                        }); //oneTime, can be reassign after highlightForOnlyOneResult
                    //$('.currentResult textarea').val($('.currentResult input')[0].selectize.items.join(" "));
                    $("#addChunkAlert").hide();
                }
                else{
                    $("#addChunkAlert").show();
                }
                removeSelection();
            }
        }
    });
    if(isLatest){
        $div.addClass("currentPost");
        $div.addClass("latestPost");
    }
    focusOnTheLatest();
    return $div;
}

function createChunk(questionType, isAnswerPage, isAdmin){
    collapseCurrent();

    var div = $("<div>", {id: "chunk-"+chunkIndex, class: "panel chunk"});
    var button = $("<button>", {'data-toggle':"collapse", id:"collapseSelective", class:"btn btn-info", 'data-parent':"#chunks", 'data-target':"#collapse-"+chunkIndex, style:"width:100%;"});
    var p1 = $("<p>", {id: "alertWords", class:"alertMsg"});
    p1.html('<span class="glyphicon glyphicon-exclamation-sign"></span>&nbsp;' + alertWords);
    var divInner = $("<div>", {id: "collapse-"+chunkIndex, class: "panel-collapse collapse in"});
    $(divInner).collapse({"toggle": false, 'parent': '#chunks'});
    var input = $("<input>", {type: "text", placeholder:"Highlight some words from the posts"});
    var p2 = $("<p>", {id: "alertEditing", class:"alertMsg"});
    p2.html('<span class="glyphicon glyphicon-exclamation-sign"></span>&nbsp;' + alertEditing);
    var textArea = $("<textarea>", {class:"form-control", rows:"1", id:"textEdit", placeholder:"Enter some text here"});
    divInner.append(input);
    div.append(button);
    div.append(p1);
    div.append(divInner);
    div.append(p2);
    div.append(textArea);
    $("#chunks").append(div);

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
            if($('.currentChunk .selectize-input .item').length > 1) //naive expectation: 1 for cause 1 for effect
                p1.hide();
            $(item).click(function(e){
                var target = e.target || e.srcElement;
                if(target.tagName != "A"){ //if cross is clicked to remove a word
                    //$("#posts").unhighlight({ element: 'span', className: 'highlight' });
                    if(selectedWordtoShowHighlights && lastItemToHighlightPost == $(item).attr('data-value')){
                        $(item).removeClass('active');
                        selectedWordtoShowHighlights = false;
                        if($('#toggleAll').attr("show") == "true"){
                            highlightForAllChunks();
                        }
                        else{
                            highlightForOnlyOneChunk(div);
                        }
                    }
                    else{
                        clearReferencedWordsFromPosts();//TODO somewhere
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
    $('.currentChunk .selectize-input input').attr("readonly",'');
    if(!isAdmin) {
        if (questionType == "Type1" || (questionType == "Type2" && isAnswerPage))
            $('.currentChunk .selectize-input input').attr("disabled", 'disabled');//added important
    }
    $(div).find("button").click(function(e){ //this div only expandable using collapse icon
        if($('#toggleAll').attr("show") == "true"){
            collapseAll();
            setTimeout(function(){ $(this).click();}, 600);
        }
        else{
            collapseCurrent();
            $(this).parent().addClass("currentChunk");
            if(!isAnswerPage)
                $('.currentChunk textarea').removeAttr('readonly');
            expandCurrentCollapsed($(this).parent());
        }
    });

    $(textArea).on('change keyup paste', function() {
        if($(this).val().length < alertEditingLength)
            p2.show();
        else
            p2.hide();
    });
}


function highlightAndAddToChunk(referencedPost, selectedText, questionType, isAnswerPage, isAdmin){ //added modified
    if($("#chunks div").length > 0){
        $('#'+referencedPost).find("p").highlight(selectedText);//{ wordsOnly: true }
        $('.currentChunk input')[0].selectize.createItem(selectedText);
        var $createdItem = $('.currentChunk .selectize-input .item').last();
        $createdItem.attr("id", $('.currentChunk').attr("id") + "-casual-"+($('.currentChunk .selectize-input .item').length-1));
        $createdItem.attr("referencedPost", $('#'+referencedPost).attr("id"));
        if(!isAdmin){
            if(questionType == "Type1" || (questionType == "Type2" && isAnswerPage))
                $createdItem.find("a").remove();
        };

        $("span:contains('" + selectedText + "')").each(
            function(index, elem){
                $(this).attr("referencedChunk",$createdItem.attr("id"));
            }); //oneTime, can be reassign after highlightForOnlyOneResult
        //$('.currentResult textarea').val($('.currentResult input')[0].selectize.items.join(" "));
        $("#addChunkAlert").hide();
    }
    else{
        $("#addChunkAlert").show();
    }
    removeSelection();
}

function removeChunk(){
    clearReferencedWordsFromPosts();
    var idToFocus = $('.currentChunk').prev().attr("id");
    $('.currentChunk').remove();
    if($("#chunks .chunk").length > 0)
        $('#' + idToFocus).find('button').click();
}


function collapseCurrent(){
    $("#posts").unhighlight({ element: 'span', className: 'highlight' });
    $(".currentChunk .in").collapse("hide");
    $(".currentChunk button").addClass('collapsed');
    $(".currentChunk textarea").attr("readonly","");
    $(".currentChunk textarea").height(20);
    $(".currentChunk").removeClass("currentChunk");
    selectedWordtoShowHighlights = false;
}

function focusOnTheLatest(){
    $('#posts').scrollTop($('#posts')[0].scrollHeight);
}

function prepareInputsforAdminTrainingChunksSubmit(){
    if($("#chunks .chunk").length > 0){
        var a = isThereEmptyWords();
        var b = isThereEmptyText();
        if(!( a || b)){
            var input_chunks = $("<input>", {type: "hidden", name:"numberOfChunks", value: $('.chunk').length});
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

                var input_highlights = $("<input>", {type: "hidden", name:"chunk-" + index + "-highlights", value: JSON.stringify(highlights)});
                var input_text = $("<input>", {type: "hidden", name:"chunk-" + index + "-text", value:$(elem).find("textarea").val()});
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

function collapseAll(){
    $("#chunks button").addClass("collapsed");
    $('#chunks .in').collapse("hide");
    //$("#chunks textarea").attr("readonly","");//added
    $("#posts").unhighlight({ element: 'span', className: 'highlight' });
    $('#toggleAll').html("Show All");
    $('#toggleAll').attr("show", "false");
    selectedWordtoShowHighlights = false;
}

function expandAll(isAnswerPage){
    $('#chunks .in').collapse("hide");
    setTimeout(function(){
        $('#chunks .panel-collapse').collapse("show");
        $("#chunks button.collapsed").removeClass("collapsed");
        $(".currentChunk").removeClass("currentChunk"); //added
        $("#toggleAll").html("Hide All");
        $("#toggleAll").attr("show", "true");
        if(isAnswerPage)
            $("#chunks textarea").attr("readonly","");//added
        else
            $('#chunks textarea').removeAttr('readonly');
    }, 600);

    highlightForAllChunks();
}

function expandCurrentCollapsed($result){
    // no need to expand manually, button is doing itself already, so just highlight the words as follows
    highlightForOnlyOneChunk($result);
}

function isThereEmptyText(){
    var emptyText = false;
    $("#chunks .chunk").each(
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
    $("#chunks .chunk").each(
        function(index, elem){
            if($(elem).find(".selectize-input .item").length < 2){
                $(elem).find("#alertWords").show();
                emptyWords = true;
            }
        });

    return emptyWords;
}