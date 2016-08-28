package crowdcausaltraining

class AdminController {

    def index() { }

    def testing() {
        def qs = TestingQ.list()
        [qs:qs]
    }

    def newTestingQ(){
        def q = new TestingQ()
        [q:q]
    }

    def createTestingQ(){
        print params
        def q = new TestingQ()
        q.questionText = params.questionText
        q.type = TestingType.get(params.type)
        params.list('answerText').eachWithIndex  { a, index ->
            def tA = new TestingA()
            tA.answerText = a
            if (params.containsKey("correctAnswer") && params.correctAnswer.toInteger() == index) {
                q.correctAnswer = tA
            }
            q.addToAnswers(tA)
        }

        if(q.save()) {
            redirect(action: "testing")
        }
        else {
//            def locale = Locale.getDefault()
//            //println locale
//            tQ.errors?.allErrors?.each{
//                println  messageSource.getMessage(it, locale)
//            }
            render(view: "newTestingQ", model: [q: q])
        }
    }

    def newTestingA(){
        print params
        render(template:"newTestingA")
    }

    def editTestingQ(){
        def q = TestingQ.get(params.id)
        [q:q]
    }

    def updateTestingQ(){
        def q = TestingQ.get(params.id)
        q.answers.clear()
        if(params.type.toInteger() == TestingType.findByShortName('Type1').id)
            q.highlights.clear()

        q.questionText = params.questionText
        q.type = TestingType.get(params.type)
        params.list('answerText').eachWithIndex  { a, index ->
            def tA = new TestingA()
            tA.answerText = a
            if (params.containsKey("correctAnswer") && params.correctAnswer.toInteger() == index) {
                q.correctAnswer = tA
            }
            q.addToAnswers(tA)
        }

        if(q.save()) {
            redirect(action: "testing")
        }
        else {
//            def locale = Locale.getDefault()
//            //println locale
//            tQ.errors?.allErrors?.each{
//                println  messageSource.getMessage(it, locale)
//            }
            render(view: "newTestingQ", model: [tQ: tQ])
        }
    }

    def deleteTestingQ(){
        def q = TestingQ.get(params.id)
        q.delete(flush:true)
        redirect(action:"testing")
    }

    def editHighlightsOfTestingQ(){
        def q = TestingQ.get(params.id)
        [q:q]
    }

    def updateHighlightsOfTestingQ(){
        def q = TestingQ.get(params.id)
        q.highlights = []
        q.highlights = params.list('highlights')
        if(q.save()) {
            redirect(action: "testing")
        }
        else {
            render(view: "editHighlightsOfTestingQ", model: [q: q])
        }
    }

    def training() { }
}
