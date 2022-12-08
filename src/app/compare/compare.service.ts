import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { BehaviorSubject, Subject } from 'rxjs';
import { tap } from 'rxjs/operators';

import { environment } from 'src/environments/environment';
import { CompareData } from './compare-data.model';
import { AuthService } from '../user/auth.service';
import { CognitoUserSession } from 'amazon-cognito-identity-js';

@Injectable({
  providedIn: 'root'
})
export class CompareService {
  dataEdited = new BehaviorSubject<boolean>(false);
  dataIsLoading = new BehaviorSubject<boolean>(false);
  dataLoaded = new Subject<CompareData[]>();
  dataLoadFailed = new Subject<boolean>();
  userData: CompareData | null = null;

  constructor(private http: HttpClient,
              private authService: AuthService) {
  }

  onStoreData(data: CompareData) {
    //console.log("onStoreData");
    this.dataLoadFailed.next(false);
    this.dataIsLoading.next(true);
    this.dataEdited.next(false);
    this.userData = data;

    const user = this.authService.getAuthenticatedUser();
    if(!user) return;

    user.getSession( (err: Error | null, session: CognitoUserSession | null) => {
      if(err) {
        return;
      }
      if(session && session.isValid()) {
        this.http.post(environment.apiUrl, data, {
          headers: {'Authorization': session.getIdToken().getJwtToken()}
        })
        .subscribe({
          next: (result) => {
            this.dataLoadFailed.next(false);
            this.dataIsLoading.next(false);
            this.dataEdited.next(true);
          },
          error: (error) => {
            this.dataIsLoading.next(false);
            this.dataLoadFailed.next(true);
            this.dataEdited.next(false);
          }
        });      
      }
    });
  }

  onRetrieveData(all = true) {
    //console.log("onRetrieveData");
    this.dataLoaded.next([]);
    this.dataLoadFailed.next(false);    
    let urlParam = 'all';
    if (!all) {
      urlParam = 'single';
    }

    const user = this.authService.getAuthenticatedUser();
    if(!user) return;

    user.getSession( (err: Error | null, session: CognitoUserSession | null) => {
      if(err) {
        return;
      }
      if(session && session.isValid()) {
        const accessToken = session.getAccessToken().getJwtToken();
        const queryParam = `?accessToken=${accessToken}`;
        this.http.get<CompareData[]>(environment.apiUrl+'/' + urlParam + queryParam, 
        {
          headers: {'Authorization': session.getIdToken().getJwtToken()}
        })
        .pipe(
          tap(data => console.log(data))
        )
        .subscribe({
          next: (data) => {
            if (all) {
              this.dataLoaded.next(data);
            } else {
              console.log(data);
              if (!data) {
                this.dataLoadFailed.next(true);
                return;
              }
              this.userData = data[0];
              this.dataEdited.next(true);
            }
          },
          error: (error) => {
            this.dataLoadFailed.next(true);
            this.dataLoaded.next([]);
          }
        });
      }
    });
  }

  onDeleteData() {
    //console.log("onDeleteData");

    const user = this.authService.getAuthenticatedUser();
    if(!user) return;

    user.getSession( (err: Error | null, session: CognitoUserSession | null) => {
      if(err) {
        return;
      }
      if(session && session.isValid()) {
        this.dataLoadFailed.next(false);
        this.http.delete(environment.apiUrl, {
          headers: {'Authorization': session.getIdToken().getJwtToken()}
        })
        .subscribe({        
          next: (data) => {
            console.log("Delete",data);
          },
          error: (error) => this.dataLoadFailed.next(true)
        });
      }
    });        
  }
}
