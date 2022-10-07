import { Component, OnChanges, OnInit, SimpleChanges } from '@angular/core';
import { Game, GameService, Round } from './services/game.service';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss']
})
export class AppComponent implements OnInit, OnChanges {

  manualMode: boolean = false;

  time: number = 15.00;
  timerStarted: number  = 0;
  timer: number = 0;
  outOfTimeAudio: HTMLAudioElement = new Audio('/assets/outOfTime.mp3');

  game: Game | null = null;

  mode: string = ``;
  round: Round | null = null;

  banners: string[] = [];

  constructor(
    public gameService: GameService
  ) {
    // get the game object
    this.gameService.gameSubscription.subscribe({
      next: (game: Game) => {
        this.game = game;
        this.round = this.game.rounds[this.game.currentRound];
        this.mode = this.round.quickfire ? 'Quickfire' : 'Normal';
      }
    })

    this.gameService.bannerSubscriptions.subscribe({
      next: (banner: string[]) => {
        this.banners.push(...banner);
        this.launchBanners();
      }
    })
  }

  ngOnInit(): void {

  }

  ngOnChanges(changes: SimpleChanges): void {
      console.log(changes);
  }

  correct(): void {
    if(!this.clickPaused) this.gameService.correctAnswer();
  }

  incorrect(): void {
    if(!this.clickPaused) this.gameService.incorrectAnswer();
  }

  clickPaused: boolean = false;

  /**
   * Stops double clicks on the right or wrong buttons...
   */
  pauseClickInput(): void {
    this.clickPaused = true;

    setTimeout(() => {
      this.clickPaused = false;
    }, 1000);
  }

  endRound(): void {
    this.gameService.nextRound();
  }

  outOfTime(): void {
    this.outOfTimeAudio.play();
  }

  /**
   * Starts the countdown timer on screen
   * @param time
   */
 startTimer(time: number): void {

  this.time = time;
  this.timerStarted = new Date().getTime();

  clearInterval(this.timer);

  this.timer = window.setInterval(() => {

    let currentTime: number = new Date().getTime();
    let elapsed: number = (currentTime - this.timerStarted) / 1000;

    this.time = time - elapsed;

    if(this.time < 0) {
      this.time = 0;
      this.outOfTime();
      clearInterval(this.timer);
    }
  }, 20);
}

  /**
   * Toggles manual mode, i.e. normal, no automation.
   */
  toggleManualMode(): void { this.manualMode = !this.manualMode; }

  // test
  nextTeam(): void {
    this.gameService.nextTeam();
  }

  bannerTimer: number = -1;

  /**
   * Times the display of banners, running down the 'banners' object.
   */
  launchBanners(): void {
    // if the timer is already running then dont do anything
    if(this.bannerTimer !== -1) return;
    // duration in seconds of a banner
    const bannerDuration: number = 1;
    // set the interval
    this.bannerTimer = window.setInterval(() => {
      let banner: string = this.banners.shift()!;
      console.log(banner);

      // check fi thats the last banner and if so clear the timer.
      if(this.banners.length === 0) {
        clearInterval(this.bannerTimer);
        this.bannerTimer = -1;
      }
    }, bannerDuration * 1000);
  }
}
