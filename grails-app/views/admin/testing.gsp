<!doctype html>
<html>
<head>
    <meta name="layout" content="admin"/>
</head>
<body>



    <div class="row">
        <h2>Testing Questions</h2>
        <g:if test="${qs.empty}">
            <p>There are no questions yet!</p>
        </g:if>
        <g:else>
            <table border="3px">
                <tr style="font-weight:bold">
                    <td>Type</td>
                    <td>Question</td>
                    <td>Answers</td>
                    <td>Highlights</td>
                    <td>Actions</td>
                </tr>
                <g:each var="q" in="${qs}">
                    <tr>
                        <td>${q.type.shortName}</td>
                        <td>${q.questionText}</td>
                        <td style="column-width: 300px">
                            <g:each var="answer" in="${q.answers}">
                                <g:if test="${q.correctAnswer != null && answer.id == q.correctAnswer.id}">
                                    <input type="radio" name="correctAnswer_${q.id}" checked="checked" value="${answer.id}" disabled="true"/>
                                </g:if>
                                <g:else>
                                    <input type="radio" name="correctAnswer_${q.id}" value="${answer.id}" disabled="true"/>
                                </g:else>

                                ${answer.answerText}<br>
                            </g:each>
                        </td>
                        <td><g:each var="highlight" in="${q.highlights}"></g:each></td>
                        <td>
                            <g:link mapping="editTesting" params='[id:"${q.id}"]'><input type="button" value="Edit"/></g:link>

                            <g:if test="${q.type.id == crowdcausaltraining.TestingType.findByShortName('Type2').id}">
                                <g:link mapping="editTestingHighlights" params='[id:"${q.id}"]'><input type="button" value="Highlights"/></g:link>
                            </g:if>
                            <g:link action="deleteTestingQ" params='[id:"${q.id}"]' onclick="return confirm('Are you sure you want to delete the question?')"><input type="button" value="Delete"/></g:link>
                        </td>
                    </tr>
                </g:each>
            </table>
        </g:else>
        <br>
        <g:link action="newTestingQ"><button type="button">Add another question</button></g:link>
    </div>




</body>
</html>