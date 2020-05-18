import {Injectable} from '@angular/core';
import {BehaviorSubject, Observable} from 'rxjs';
import {HttpClient, HttpHeaders} from '@angular/common/http';
import {environment} from '../../environments/environment';
import {Game} from '../_models/game';
import {SseService} from './sse.service';
import {GameSession} from '../_models/game-session';
import {catchError} from 'rxjs/operators';
import {HandleErrorsService} from './handle-errors.service';
import {AnonymService} from './anonym.service';
import {Router} from '@angular/router';

@Injectable({
  providedIn: 'root'
})
export class GameSettingsService {
  gameUrl = `${environment.apiUrl}games/`;
  private sseConnectorUrl = `${environment.apiUrl}sse/stream/`;

  private sessionsSubject: BehaviorSubject<any[]>;
  public sessions: Observable<any[]>;
  private readySubject: BehaviorSubject<string[]>;
  public readyList: Observable<string[]>;

  httpOptions = {
    headers: new HttpHeaders({
      'Content-Type': 'application/json'
    })
  };

  constructor(private http: HttpClient,
              private sseService: SseService,
              private errorsService: HandleErrorsService,
              private anonymService: AnonymService,
              private router: Router) {
    this.sessionsSubject = new BehaviorSubject<any[]>([]);
    this.sessions = this.sessionsSubject.asObservable();
    this.readySubject = new BehaviorSubject<string[]>([]);
    this.readyList = this.readySubject.asObservable();
  }

  getSseForGame(gameId: string) {
    const eventSource = this.sseService.getEventSource(this.sseConnectorUrl + gameId);

    eventSource.addEventListener('join', event => {
      const ev: any = event;
      console.log('Join ' + ev.data);
      this.setSubjSessions(gameId);
    });

    eventSource.addEventListener('ready', event => {
      const ev: any = event;
      console.log('Ready ' + ev.data);
      if (!this.readySubject.value.includes(ev.data)) {
        this.readySubject.value.push(ev.data);
        this.readySubject.next(this.readySubject.value);
      }
    });

    eventSource.addEventListener('start', () => {
      this.readySubject.next([]);
      this.sessionsSubject.next([]);
      this.router.navigateByUrl(`/play/${gameId}`);
    });

    eventSource.onerror = error => {
      console.error(error);
    };

  }

  createGame(settings: any): Observable<Game> {
    if (!settings.additionalPoints) {
      settings.additionalPoints = false;
    }
    console.log(settings);
    return this.http.post<Game>(this.gameUrl, JSON.stringify(settings), this.httpOptions);
  }

  getGame(gameId: string): Observable<Game> {
    return this.http.get<Game>(this.gameUrl + `game/${gameId}`, this.httpOptions);
  }

  join(accessId: string): Observable<GameSession> {
    return this.http.get<GameSession>(this.gameUrl + `join/${accessId}`,
      this.httpOptions);
  }

  // TODO Set images
  getSessions(gameId: string): Observable<any> {
    return this.http.get<any>(this.gameUrl + `sessions/${gameId}`, this.httpOptions);
  }

  setSubjSessions(gameId: string) {
    this.getSessions(gameId).subscribe(ses => this.sessionsSubject.next(ses));
  }

  setReady(gameId: string, sessionId: string) {
    return this.http.post(this.gameUrl + `game/${gameId}/ready`, {},
      {headers: this.httpOptions.headers, params: {sessionId}})
      .pipe(catchError(this.errorsService.handleError('setReady')));
  }

  startGame(gameId: string): Observable<any> {
    return this.http.post(this.gameUrl + `start`, null,
      {headers: this.httpOptions.headers, params: {gameId}})
      .pipe(catchError(this.errorsService.handleError('startGame')));
  }

  quitGame(sessionId: string) {
    this.anonymService.removeAnonym();
    return this.http.post(this.gameUrl + `quit`, null,
      {headers: this.httpOptions.headers, params: {sessionId}})
      .pipe(catchError(this.errorsService.handleError('quitGame')));
  }
}