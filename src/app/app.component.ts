import { Component, OnChanges, OnInit, SimpleChanges } from '@angular/core';
import { GameService } from './services/game.service';

export interface QuestionID {
  questionNumber: number, stolen: boolean, correct: boolean
}

export interface Team {
  id: number, name: string, score: number, log: QuestionID[]
}

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss']
})
export class AppComponent implements OnInit, OnChanges {

  manualMode: boolean = false;

  teams: Team[] = [
    { id: 0, name: "Fun", score: 12, log: [] },
    { id: 1, name: "Evil", score: 6, log: [] }
  ];

  time: number = 15.00;
  timerStarted: number  = 0;
  timer: number = 0;

  constructor(
    private gameService: GameService
  ) {}

  ngOnInit(): void {

  }

  ngOnChanges(changes: SimpleChanges): void {
      console.log(changes);
  }

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
        clearInterval(this.timer);
      }
    }, 20);

  }

  /**
   * Toggles manual mode, i.e. normal, no automation.
   */
  toggleManualMode(): void { this.manualMode = !this.manualMode; }
}
