import { Injectable } from '@angular/core';
import { Router } from '@angular/router';
import { Subject, Observable, BehaviorSubject } from 'rxjs';

import { 
  CognitoUserAttribute, 
  CognitoUser, 
  AuthenticationDetails, 
  CognitoUserSession
} from 'amazon-cognito-identity-js';

import { User } from './user.model';
import { userPool } from './userPool';

console.log("UP", userPool);

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  authIsLoading = new BehaviorSubject<boolean>(false);
  authDidFail = new BehaviorSubject<boolean>(false);
  authStatusChanged = new Subject<boolean>();
  registeredUser: CognitoUser | null = null;
  
  constructor(private router: Router) {}

  signUp(username: string, email: string, password: string): void {
    this.authIsLoading.next(true);
    
    //object with username, password, and all additional attributes
    const user: User = {
      username: username,
      email: email,
      password: password
    };
    
    //Name - name of the attribute on cognito, Value - attribute value
    const emailAttribute = {
      Name: 'email',
      Value: user.email
    };

    //need to create attribute list - populate it all attribute object besides username & password
    const attrList: CognitoUserAttribute[] = [];
    attrList.push(new CognitoUserAttribute(emailAttribute));

    //signup
    userPool.signUp(username, password, attrList, [], (err,result) => {      
      if (err) {
        //console.log("Signup Err",err)
        this.authDidFail.next(true);
        this.authIsLoading.next(false);
        return;
      }
      this.authDidFail.next(false);
      this.authIsLoading.next(false);
      if( result) {
        //console.log("Signup Res",result)
        this.registeredUser = result.user;
      }
    });
    
    return;
  }

  confirmUser(username: string, code: string) {
    this.authIsLoading.next(true);

    const userData = {
      Username: username,
      Pool: userPool
    };
    
    const cognitoUser = new CognitoUser(userData);

    cognitoUser.confirmRegistration(code, true, (err, result) => {
      if (err) {    
        //console.log("Confirm Err",err);
        this.authDidFail.next(true);     
        this.authIsLoading.next(false);               
        return;
      }
      //console.log("Confirm Res",result);
      this.authDidFail.next(false); 
      this.authIsLoading.next(false);               
      this.router.navigate(["/"]);
    });  
  }

  signIn(username: string, password: string): void {
    this.authIsLoading.next(true);

    const authData = {
      Username: username,
      Password: password
    };

    const authenticationDetails = new AuthenticationDetails(authData);    

    const userData = {
      Username: username,
      Pool: userPool,
    };

    const cognitoUser = new CognitoUser(userData);

    const that = this;
    cognitoUser.authenticateUser(authenticationDetails, {
      onSuccess: (result: CognitoUserSession) => {
        this.authStatusChanged.next(true);
        this.authDidFail.next(false);
        this.authIsLoading.next(false);
        //console.log("Login Res",result);
      },
      onFailure: (err) => {
        this.authDidFail.next(true);
        this.authIsLoading.next(false);       
        //console.log("Login Err",err); 
      }
    });

    this.authStatusChanged.next(true);

    return;
  }

  getAuthenticatedUser(): CognitoUser | null {
    return userPool.getCurrentUser();
  }

  logout() {
    //will delete tokens from browser local storage
    this.getAuthenticatedUser()?.signOut();
    this.authStatusChanged.next(false);
  }

  isAuthenticated(): Observable<boolean> {
    const user = this.getAuthenticatedUser();
    const obs = new Observable<boolean>((observer) => {
      if (!user) {
        //check on the client
        observer.next(false);
      } else {
        //check on the server if the user is still logged in
        user.getSession( (err: Error | null, session: CognitoUserSession | null) => {
          if(err) {
            observer.next(false);
          }
          else {
            if(session && session.isValid()) {
              observer.next(true); //authenticated!
            }
            else {
              observer.next(false);
            }
          }
        });
      }      
      observer.complete();
    });
    return obs;
  }

  initAuth() {
    this.isAuthenticated().subscribe(
      (auth) => {
        //console.log("AUTH",auth);
        this.authStatusChanged.next(auth);
      } 
    );
  }
}
