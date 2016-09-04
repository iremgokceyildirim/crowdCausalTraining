<%@ page import="crowdcausaltraining.QType" %>
<!doctype html>
<html>
<head>
    <meta name="layout" content="admin"/>
</head>
<body>

<h2>New Training Post</h2>
<div class="row" style="text-align: center;">
    <g:hasErrors bean="${q}">
        <ul class="fieldError">
            <g:eachError var="err" bean="${q}">
                <li><g:message error="${err}"/></li>
            </g:eachError>
        </ul>
    </g:hasErrors>


    <g:form action="createTrainingQ">
        <g:select name='type' value="${q?.type?.id}"
                  from='${QType.findAllByType("Training")}'
                  optionKey="id" optionValue="shortAndLongName"></g:select><br><br>

        <button type="button" onclick="addPost()">Add Post</button><br><br>
        Posts:<br>
        <div id="postsContainer">
            <g:each var="p" in="${q.posts}">
                <div>
                    <g:if test="${p.isLatest == true}">
                        <input type="radio" name="latestPost" checked="checked" value="${p.id}"/>
                    </g:if>
                    <g:else>
                        <input type="radio" name="latestPost" value="${p.id}"/>
                    </g:else>
                    <g:textArea name="postText" value="${p.postText}" rows="5" cols="60"/>
                    <button type="button" onclick="removePost(this)">
                        <span><i class="glyphicon glyphicon-minus"></i> </span></button>
                </div>
                <br>
            </g:each>
        </div>
        <g:submitButton name="Submit" onclick="return validateForm();"/>
    </g:form><br>


</div>

<content tag="script">
    <script>

        function addPost(){
            $.ajax({
                url: "/admin/newTrainingQ_P"
            }).done(function(data) {
                $('#postsContainer').append( data);
            });
        }

        function removePost(elem){
            $(elem).parent().remove();
        }

        function validateForm(){
            if($("input[type=radio]").length > 0 && $("input[type=radio]:checked").length == 0) {
                alert('Please select the latest post for this question!');
                return false;
            }
            else {
                $("input[type=radio]").each(function (index) {
                    if ($(this).prop('checked'))
                        $(this).val(index);
                });
                return confirm('Are you sure you want to submit the question?');
            }
        }

    </script>
</content>

</body>
</html>