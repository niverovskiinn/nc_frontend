import {Component} from '@angular/core';
import {AuthenticationService} from '../../core/_services/authentication/authentication.service';
import {NgbActiveModal, NgbModal} from '@ng-bootstrap/ng-bootstrap';
import {RecoverPasswordComponent} from '../recover-password/recover-password.component';
import {Router} from '@angular/router';
import {TranslateService} from '@ngx-translate/core';
import {first} from 'rxjs/operators';
import {LocaleService} from '../../core/_services/utils/locale.service';

@Component({
    selector: 'app-log-in',
    templateUrl: './log-in.component.html',
    styleUrls: ['./log-in.component.css']
})
export class LogInComponent {
    constructor(private authenticationService: AuthenticationService,
                public activeModal: NgbActiveModal,
                private modalService: NgbModal,
                private _router: Router,
                private localeService: LocaleService) {
    }

    email = '';
    password = '';
    loading: boolean;
    message: string;


    logIn() {
        if (this.email === '' || this.email == null) {
            this.message = this.localeService.getValue('authorization.login.emptyName');
            return;
        }
        if (this.password === '' || this.password == null) {
            this.message = this.localeService.getValue('authorization.login.emptyPassword');
            return;
        }

        this.authenticationService.loginUser(this.email, this.password).pipe(first())
            .subscribe(
                n => {
                    location.reload();
                    this.loading = false;
                },
                error => {
                    this.message = error.error ? error.error.message : this.localeService.getValue('authorization.login.error');
                    console.log(error);
                    this.loading = false;
                }
            );
        this.loading = true;
    }

    openRecover() {
        this.activeModal.dismiss();
        const modalRef = this.modalService.open(RecoverPasswordComponent);
    }
}
