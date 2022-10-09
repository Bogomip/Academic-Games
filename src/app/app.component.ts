import { Component, OnChanges, OnInit, SimpleChanges } from '@angular/core';
import { Game, GameService, Round } from './services/game.service';

export interface Banner { text: string; time: number }

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

  banners: Banner[] = [];

  constructor(
    public gameService: GameService
  ) {
    // get the game object
    this.gameService.gameSubscription.subscribe({
      next: (game: Game) => {
        this.game = game;
        this.round = this.game.rounds[this.game.currentRound - 1];
        this.mode = this.round.quickfire ? 'Quickfire' : 'Normal';
      }
    })

    this.gameService.bannerSubscriptions.subscribe({
      next: (banner: Banner[]) => {
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

  quickfireTeamChange(): void {
    this.gameService.nextTeam();
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
    const bannerDuration: number = 2;
    // set the banner display to visible...
    const bannerDiv: HTMLElement = document.getElementById('banner')!;
    bannerDiv.classList.remove('score-sheet__banner--invisible')
    bannerDiv.classList.add('score-sheet__banner--visible')

    // fire immediatele the first time.
    this.createBannerFunction(bannerDiv);

    //  THIS DOESNT YET OBEY THE TIME PART OF THE BANNER
    //  MAKE IT DO THAT!

    // set the interval
    this.bannerTimer = window.setInterval(() => {
      // check fi thats the last banner and if so clear the timer.
      if(this.banners.length === 0) {
        clearInterval(this.bannerTimer);
        bannerDiv.innerHTML = "";
        bannerDiv.classList.add('score-sheet__banner--invisible')
        bannerDiv.classList.remove('score-sheet__banner--visible')
        this.bannerTimer = -1;
      } else {
        this.createBannerFunction(bannerDiv);
      }

    }, bannerDuration * 1000);
  }

  createBannerFunction(parentDiv: HTMLElement): void {
    let banner: Banner = this.banners.shift()!;

    parentDiv.innerHTML = "";

    // create a new element and add it to the document...
    let newBanner: HTMLElement = document.createElement('div');
    newBanner.classList.add('score-sheet__banner--text');
    newBanner.style.animation = `fadeIn .2s ease-in-out 0s 1 forwards, bannerOut .2s ease-in-out ${banner.time}s 1 forwards`;
    newBanner.style.opacity = `0`;
    newBanner.innerText = banner.text;
    parentDiv.appendChild(newBanner);
  }
}
