<<<<<<< HEAD
import {Component} from '@angular/core';
import {AuthenticationService} from '../_services/authentication.service';
import {NgbActiveModal, NgbModal} from '@ng-bootstrap/ng-bootstrap';
import {RecoverPasswordComponent} from '../recover-password/recover-password.component';
=======
import { Component } from '@angular/core';
import { Router } from '@angular/router';
import { AuthenticationService } from '../_services/authentication.service';
import { NgbActiveModal } from '@ng-bootstrap/ng-bootstrap';
>>>>>>> b9ecbac7eba0e24ee35883cdd4ac65a1ce99ef31

@Component({
  selector: 'app-log-in',
  templateUrl: './log-in.component.html',
  styleUrls: ['./log-in.component.css']
})
export class LogInComponent {
<<<<<<< HEAD
  constructor(private authenticationService: AuthenticationService,
              public activeModal: NgbActiveModal,
              private modalService: NgbModal) {
=======
  constructor(private _router: Router,
    private authenticationService: AuthenticationService,
    public activeModal: NgbActiveModal) {
>>>>>>> b9ecbac7eba0e24ee35883cdd4ac65a1ce99ef31
  }

  email = '';
  password = '';
  loading: boolean;
  message: string;


  logIn() {
    if (this.email === '' || this.email == null) {
      alert('Enter the email or username!');
      return;
    }
    if (this.password === '' || this.password == null) {
      alert('Enter the password!');
      return;
    }

    /*Code for comunication with back-end*/
    this.authenticationService.loginUser(this.email, this.password)
      .subscribe(n => {
          alert(n.username + ' logged in!');
          this.loading = false;
        },
        error => {
          if (error.error) {
            this.message = error.error.message;
          } else {
            this.message = 'An error occurred';
          }
          console.log(error);
          this.loading = false;
        }
      )
    ;
    this.loading = true;
  }

  openRecover() {
    this.activeModal.dismiss();
    const modalRef = this.modalService.open(RecoverPasswordComponent);
    this.authenticationService.loginUser(this.email, this.password).pipe()
      .subscribe(n => {
        this.activeModal.dismiss('Cross click');
        window.location.reload();
      }
      );
  }
}
