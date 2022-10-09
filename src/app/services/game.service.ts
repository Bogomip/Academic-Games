import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';
import { Banner } from '../app.component';

export interface Game {
  name?: string;
  teams: Team[];
  rounds: Round[];
  currentRound: number;
  currentQuestion: number;
  currentTeam: number;
  playDirection: 1 | -1;
  forStealId: number;
  questionStyle: 1 | 2;
}

export interface Team { id: number; teamName: string; correct: number; incorrect: number; score: number; log: { round: number; question: number; text?: string }[] }
export interface Round { id: number; quickfire: boolean; steal: boolean; questions: number; questionValue: number; questionTime: number }


@Injectable({
  providedIn: 'root'
})
export class GameService {

  gameSubscription: BehaviorSubject<Game> = new BehaviorSubject<Game>(null!);
  bannerSubscriptions: BehaviorSubject<Banner[]> = new BehaviorSubject<Banner[]>(null!);

  gameStarted: boolean = false;
  public gameEnded: boolean = false;
  game: Game | null = null;

  constructor() { }

  /**
   * Takes a new game and sends it to the interested components.
   * @param game
   */
  newGameSetup(game: Game): void {
    this.gameStarted = true;
    this.game = game;
    this.nextRound(0);
    this.bannerSubscriptions.next([{ text: `Begin!`, time: 1 }]);
    this.gameSubscription.next(game);
  }

  correctAnswer(): void {
    let team: number = this.game!.currentTeam;

    if(this.game!.forStealId !== -1) {
      // question was stolen
      team = this.game!.forStealId;
      this.game!.forStealId = -1;
    }

    if(this.quickFire) {
      // flag this question as having been answered correctly...
      this.quickFireQuestions[this.game!.currentQuestion] = 1;
    }

    this.game!.teams[team].score += +this.questionValue();
    this.game!.teams[team].correct ++;
    this.nextQuestion();
    console.log(this.order, this.quickFireQuestions);

  }

  incorrectAnswer(): void {
    const currentTeam: number = this.game!.currentTeam;

    if(this.game!.forStealId === -1) {
      // this was the first time it was asked...
      this.game!.teams[this.game!.currentTeam].incorrect += 1;

      if(this.quickFire) {
        // flag this question as being ASKED but not answered correctly
        this.quickFireQuestions[this.game!.currentQuestion] = 0;
        this.nextQuestion();
        console.log(this.order, this.quickFireQuestions);

        return;
      }

      // if the question is stealable, set up the stealable bit!
      // otherwise just goto the next question.
      if(this.stealable()) {
        this.game!.forStealId = currentTeam;
      } else {
        this.nextQuestion();
      }
    }

    if(this.game!.forStealId !== -1 && this.stealable()) {
      this.game!.forStealId = this.stealTeam(this.game!.forStealId);

      if(this.game!.forStealId === currentTeam) {
        // everyone has had a chance to steal and failed...
        this.game!.forStealId = -1;
        this.nextQuestion();
      }
    }
  }

  nextQuestion(): void {
    const round: Round = this.game?.rounds[this.game.currentRound - 1]!;

    if(this.quickFire) {
      if(this.game?.currentQuestion! + 1 >= this.quickFireQuestions.length) {
        // next round OR next TEAM
        if(this.order.length > 0) {
          // next team
          console.log('next team');
          this.nextTeam();
        } else {
          console.log('next round');
          this.nextRound();
        }
      } else {
        // next question, dont change the team!
        this.game!.currentQuestion = this.game?.currentQuestion! + 1;
        let firstTeam: boolean = this.game?.teams.length === this.order.length + 1;
        console.log(`First Team ${firstTeam}`);

        // check for the next unanswered question...
        for(let i = this.game!.currentQuestion ; i < this.quickFireQuestions.length ; i++) {

          if(firstTeam) {
            this.game!.currentQuestion = i;
            break;
          } else {
            // only select incorrect answered questions...
            if(this.quickFireQuestions[i] === 0) {
              console.log(`Question ${i + 1}`);
              this.game!.currentQuestion = i;
              break;
            }
          }

          if(i === this.quickFireQuestions.length -1) {
            // nothing found, so move onto the next team or round...
            this.nextTeam();
            break;
          }
        }


        this.gameSubscription.next(this.game!);
      }
    } else {
      // normal round style
      if(this.game?.currentQuestion! + 1 >= round.questions) {
        // end of the round...
        this.nextRound();
      } else {
        // next question
        this.game!.currentQuestion = this.game?.currentQuestion! + 1;
        this.gameSubscription.next(this.game!);
      }

      this.nextTeam();
    }
  }

  stealable(): boolean { return this.game!.rounds[this.game!.currentRound - 1].steal };
  questionValue(): number { return this.game!.rounds[this.game!.currentRound - 1].questionValue };
  questionCount(): number { return this.game!.rounds[this.game!.currentRound - 1].questions };
  questionTime(): number { return this.game!.rounds[this.game!.currentRound - 1].questionTime };
  currentRound(): Round { return this.game!.rounds[this.game!.currentRound - 1] };
  quickfire(): boolean { return this.game!.rounds[this.game!.currentRound - 1].quickfire };

  firstQuickfireTeam: number = 0;     // id of the current quickfire team
  quickFireQuestions: number[] = []; // array indicating which questions in this quickfire round have been correctly answered.

  /**
   * Switches to the next team
   * Works on both styles of play
   */
  nextTeam(): void {
    const questionsStyle: 1 | 2 = this.game!.questionStyle;
    const currentTeam: number = this.game!.currentTeam;
    const numberOfTeams: number = this.game!.teams.length;

    if(this.quickFire) {

      const firstTeam: boolean = this.game?.teams.length === this.order.length;

      if(firstTeam) {
        let teamId: number = this.order.shift()!;
        this.game!.currentTeam = teamId;
        this.game!.currentQuestion = 0
      } else {
        let incorrectAnswers: number[] = this.quickFireQuestions.filter((a: number) => a === 0)

        if(incorrectAnswers.length > 0) {
          // run through all the teams
          let teamId: number = this.order.shift()!;
          this.game!.currentTeam = teamId;

          for(let i = 0 ; i < this.quickFireQuestions.length ; i++) {
            // fin d the first unansweered question
            if(this.quickFireQuestions[i] === 0) {
              this.game!.currentQuestion = i;
              break;
            }
          }
        }
      }

      console.log(this.game!.currentTeam);
      return;
    }

    if(questionsStyle === 1) {
      // this is A B ... Y Z Z Y ... B A
      if(currentTeam === numberOfTeams - 1) {
        // if its the second go
        if(this.game!.playDirection === 1) {
          // reverse direction but stick the the same team.
          this.game!.playDirection = -1;
        } else {
          this.game!.currentTeam -= 1;
        }
      } else if (currentTeam === 0) {
        if(this.game!.playDirection === 1) {
          this.game!.currentTeam++;
        } else {
          this.game!.playDirection = 1;
        }
      } else {
        if(this.game!.playDirection === 1) { this.game!.currentTeam++; }
        else if(this.game!.playDirection === -1) { this.game!.currentTeam--; }
      }
    } else {
      // This is A B ... Y Z A B ... Y Z
      if(currentTeam === numberOfTeams) {
        this.game!.currentTeam = 0;
      } else {
        this.game!.currentTeam += 1;
      }
    }
  }

  /**
   * If there is a steal, which team goes next?
   */
  stealTeam(lastSteal: number): number {
    const numberOfTeams: number = this.game!.teams.length;

    /**
     * Go in order basically, so if you are at the end of the pile, go back to the front.
     */
    if(lastSteal === numberOfTeams - 1) {
      return 0;
    } else {
      return lastSteal + 1;
    }
  }

  quickFire: boolean = false;
  order: number[] = [];
  quickfireTeamOrder: number[] = [];

  nextRound(roundNumber?: number): void {
    let banner: Banner[] = [];

    console.log(roundNumber);

    if(this.game?.currentRound === this.game!.rounds.length) {
      // end of the game
      this.gameEnded = true;
      banner.push({ text:`Game Over!`, time: 3 });
    } else {
      // next round!
      banner = [{ text: `Round ${this.game!.currentRound + 1}`, time: 1 }]
      this.game!.currentRound = roundNumber || this.game!.currentRound + 1;
      this.game!.currentQuestion = 0;

      if(this.quickfire()) {
        // quickfiore round coming!
        banner.push({ text: 'Quickfire!', time: 1 });

        // set up the answers array
        for(let i = 0 ; i < this.questionCount() ; i++) {
          this.quickFireQuestions.push(-1);
        }

        // sort the teams by score and put them into an array
        this.game!.teams.sort((a: Team, b: Team) => a.score - b.score );
        this.order = this.game!.teams.map((a: Team) => a .id );
        this.quickfireTeamOrder = [...this.order];
        this.quickFire = true;

        console.log(this.order, this.quickFireQuestions);
        this.nextTeam();
      } else {
        this.quickFire = false;
        this.quickFireQuestions = [];
      }
    }

    this.bannerSubscriptions.next(banner);
    this.gameSubscription.next(this.game!);
  }

  newQuickfireGame(): void {

  }

}
