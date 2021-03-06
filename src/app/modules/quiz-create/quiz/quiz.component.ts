import { Component, OnInit, OnDestroy } from '@angular/core';
import { QuizService } from '../../core/_services/quiz/quiz.service';
import { ActivatedRoute, Router } from '@angular/router';
import { QuestionService } from '../../core/_services/quiz/question.service';
import { DomSanitizer } from '@angular/platform-browser';
import { ExtendedQuiz } from '../../core/_models/extended-quiz';
import { faSpinner } from '@fortawesome/free-solid-svg-icons';
import { ExtendedQuestion } from '../../core/_models/question/extendedquestion';
import { ModalService } from '../../core/_services/utils/modal.service';
import { ToastsService } from '../../core/_services/utils/toasts.service';
import { LocaleService } from '../../core/_services/utils/locale.service';
import { AuthenticationService } from '../../core/_services/authentication/authentication.service';
import { Subscription } from 'rxjs';
import { first } from 'rxjs/operators';

@Component({
    selector: 'app-quiz',
    templateUrl: './quiz.component.html',
    styleUrls: ['./quiz.component.css']
})
export class QuizComponent implements OnInit, OnDestroy {

    tagLabel: string;
    categoryLabel: string;

    quiz: ExtendedQuiz;
    questions: ExtendedQuestion[];

    questionSelector: ExtendedQuestion;

    thumbnail: any;
    file: File;


    quizLoading: boolean;
    questionLoading: boolean;
    faSpinner = faSpinner;

    subscriptions: Subscription = new Subscription();


    constructor(private quizService: QuizService, private questionService: QuestionService,
        private activateRoute: ActivatedRoute, private router: Router, private sanitizer: DomSanitizer,
        private modalService: ModalService, public toastsService: ToastsService,
        private localeService: LocaleService, private authenticationService: AuthenticationService) {
        this.quizLoading = true;
        this.questionLoading = false;
        this.questions = [];
        this.tagLabel = 'Tags';
        this.categoryLabel = 'Categories';
    }
    
    ngOnDestroy(): void {
        this.subscriptions.unsubscribe();
    }

    ngOnInit(): void {
        this.toastsService.removeAll();
        const id = this.activateRoute.snapshot.params.id;
        if (id === undefined) {
            this.initCreateQuiz();
        } else {
            this.getAllQuiz(id);
        }
    }


    initCreateQuiz() {
        this.quiz = new ExtendedQuiz().deserialize({
            id: '',
            title: '',
            description: '',
            creationDate: new Date(),
            creatorId: '',
            author: '',
            activated: false,
            validated: false,
            published: false,
            language: 'eng',
            adminComment: '',
            rating: 0,
            tagIdList: [],
            tagNameList: [],
            categoryIdList: [],
            categoryNameList: [],
            isFavourite: false,
            imageContent: ''
        }, this.sanitizer);


        this.quizLoading = false;
    }

    initQuestion(): ExtendedQuestion {

        const res = new ExtendedQuestion().deserialize({
            id: '',
            quizId: this.quiz.id,
            title: '',
            content: '',
            imageContent: '',
            points: 1,
            typeId: 1,
            typeName: '',
            rightOptions: [''],
            otherOptions: ['']

        }, this.sanitizer);
        return res;
    }

    getAllQuiz(data) {
        //Find questions
        this.subscriptions.add(this.questionService.getAllQuestionsNew(data)
            .subscribe(
                ans => this.mapGettedQuestions(ans),
                () =>
                    this.toastsService.toastAddDanger(this.localeService.getValue('toasterEditor.wentWrong'))
            ));

        //Find quiz
        this.subscriptions.add(this.quizService.getQuiz(data)
            .subscribe(
                ans => this.setGettedQuiz(ans),
                () =>
                    this.toastsService.toastAddDanger(this.localeService.getValue('toasterEditor.wentWrong'))
            ));

    }

    //Gettig quiz by id in url
    setGettedQuiz(answer) {
        if(answer.creatorId !== this.authenticationService.currentUserValue.id){
            this.router.navigate(['/']);
        }

        this.quiz = answer;
        this.file = this.quiz.unsanitizedImage;
        this.thumbnail = this.quiz.imageContent;

        this.quizLoading = false;

    }

    //Getting questions of quiz in url
    mapGettedQuestions(ans) {
        this.questions = ans;
    }


    //Clicked on already saved questions TODO : show image
    showQuestion(i) {
        this.questionSelector = this.questions[i];
    }


    addNewQuestion() {
        this.questionSelector = this.initQuestion();
        this.questions.push(this.questionSelector);
    }


    saveQuestion() {
        const validated = this.questionService.questionValidator(this.questionSelector);

        if (validated.length == 0) {
            this.questionLoading = true;
            if (this.questionSelector.id === '') {
                this.subscriptions.add(this.questionService.sendQuestion(this.questionSelector, true).subscribe(
                    ans => this.setSavedQuestion(ans),
                    () => this.toastsService.toastAddDanger(this.localeService.getValue('toasterEditor.wentWrong'))
                ));

            } else {
                this.subscriptions.add(this.questionService.sendQuestion(this.questionSelector, false).subscribe(
                    ans => this.setSavedQuestion(ans),
                    () => this.toastsService.toastAddDanger(this.localeService.getValue('toasterEditor.wentWrong'))
                ));
            }

        } else {
            this.toastsService.removeAll();
            validated.forEach(x =>
                this.toastsService.toastAddDanger(x));
        }
    }


    setSavedQuestion(ans) {

        const index = this.questions.findIndex(el => el === this.questionSelector);

        this.questions[index] = ans;
        this.questionSelector = this.questions[index];

        this.toastsService.toastAddSuccess(this.localeService.getValue('toasterEditor.saved'));
        this.questionLoading = false;
    }

    saveQuiz() {
        const validated = this.quizService.quizValidator(this.quiz);

        if (validated.length == 0) {
            this.quizLoading = true;

            if (this.quiz.id === '') {
                this.createQuiz();
            } else {
                this.editQuiz();
            }

        } else {
            this.toastsService.removeAll();
            validated.forEach(x =>
                this.toastsService.toastAddDanger(x));
        }
    }

    createQuiz() {
        this.subscriptions.add(this.quizService.createQuiz(this.quiz, this.file).subscribe(
            ans => {
                this.toastsService.toastAddSuccess(this.localeService.getValue('toasterEditor.created'));
                this.quizLoading = false;
                this.router.navigate(['/quizedit/' + ans.id]);
            },
            () =>
                this.toastsService.toastAddDanger(this.localeService.getValue('toasterEditor.wentWrong')))
        );
    }

    editQuiz() {
        this.subscriptions.add(this.quizService.saveQuiz(this.quiz, this.file).subscribe(
            ans => {
                this.toastsService.toastAddSuccess(this.localeService.getValue('toasterEditor.saved'));
                this.quiz = ans;
                this.quizLoading = false;
                if (this.quiz.published === true) {
                    this.router.navigate(['/quizedit/' + ans.id]);
                }

            },
            () =>
                this.toastsService.toastAddDanger(this.localeService.getValue('toasterEditor.wentWrong')))
        );
    }


    publish() {
        this.modalService
            .openModal(this.localeService.getValue('modal.sure') + this.localeService.getValue('modal.publish'), 'warning')
            .pipe(first())
            .subscribe((receivedEntry) => {
                if (receivedEntry) {
                    this.subscriptions.add(this.quizService.publishQuiz(this.quiz.id)
                        .subscribe(
                            () => {
                                this.toastsService.toastAddSuccess(this.localeService.getValue('toasterEditor.published'));
                                this.quiz.published = true;
                            },
                            () =>
                                this.toastsService.toastAddDanger(this.localeService.getValue('toasterEditor.wentWrong'))));
                }
            });
    }


    removeQuestionIndex(i, onCreatorDelete) {
        this.modalService
            .openModal(this.localeService.getValue('modal.sure') + this.localeService.getValue('modal.delete'), 'danger')
            .pipe(first())
            .subscribe((receivedEntry) => {
                if (receivedEntry) {
                    if (this.questions[i].id === '') {
                        this.removeQuestionFromList(i, onCreatorDelete);
                    } else {
                        this.subscriptions.add(this.questionService.deleteQuestion(this.questions[i].id)
                            .subscribe(
                                () => this.removeQuestionFromList(i, onCreatorDelete),
                                () =>
                                    this.toastsService.toastAddDanger(this.localeService.getValue('toasterEditor.wentWrong'))
                            ));
                    }
                }
            });
    }

    removeQuestion() {
        this.removeQuestionIndex(this.questions.findIndex(el => el === this.questionSelector), true);
    }

    removeQuestionFromList(index, onCreatorDelete) {
        this.questions.splice(index, 1);
        if (onCreatorDelete) {
            this.questionSelector = undefined;
        }
        this.toastsService.toastAddWarning(this.localeService.getValue('toasterEditor.removed'));
    }

    quizImage(e) {
        if (e.target.files[0] !== null && e.target.files[0] !== undefined) {
            this.file = e.target.files[0];
            this.setImage();
        }
    }


    setImage() {
        let reader = new FileReader();
        reader.readAsDataURL(this.file);
        reader.onload = () => {
            this.thumbnail = reader.result;
        };
    }

    removeImage() {
        this.file = null;
        this.thumbnail = null;
    }


    isQuizCreated() {
        return this.quiz !== undefined && this.quiz.id !== '';
    }

    isPublishAvailable() {
        return this.questions.filter(q => q.id.length > 0).length > 3 && !this.quiz.published;
    }

    isQuestionCreatorAvailable() {
        return !this.questionLoading && !this.quizLoading && !this.quiz.published && this.isQuizCreated();
    }

}
