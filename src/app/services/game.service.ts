import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';
import { Banner } from '../app.component';

export interface Game { name?: string; teams: Team[]; rounds: Round[]; currentRound: number; currentQuestion: number; currentTeam: number; playDirection: 1 | -1; forStealId: number; questionStyle: 1 | 2; }
export interface Team { id: number; teamName: string; correct: number; incorrect: number; score: number; log: { round: number; question: number; text?: string }[] }
export interface Round { id: number; quickfire: boolean; steal: boolean; questions: number; questionValue: number; questionTime: number; first: string; }


@Injectable({
  providedIn: 'root'
})
export class GameService {

  gameSubscription: BehaviorSubject<Game> = new BehaviorSubject<Game>(null!);
  bannerSubscriptions: BehaviorSubject<Banner[]> = new BehaviorSubject<Banner[]>(null!);

  gameStarted: boolean = false;
  game: Game | null = null;
  gameEnded: boolean = false;

  /**
   * Takes a new game and sends it to the interested components.
   * @param game
   */
  newGameSetup(game: Game): void {
    this.gameStarted = true;
    this.game = game;
    this.nextRound(0);

    // send the initial subscription states for a game start...
    this.bannerSubscriptions.next([{ text: `Begin!`, time: 1 }]);
    this.gameSubscription.next(game);
  }

  inc: number = 0;

  /**
   * Manually modifies the score
   * @param teamId
   * @param score
   */
  modifyScore(teamId: number, score: number): void {
    let team: Team = this.game!.teams.find((a: Team) => a.id === teamId)!;

    if(team) {
      team.score += score;
      this.gameSubscription.next(this.game!);
    }
  }

  /**
   * Manually modifies the name of a team
   * @param teamId
   * @param newName
   */
  modifyName(teamId: number, newName: string): void {
    let team: Team = this.game!.teams.find((a: Team) => a.id === teamId)!;

    if(team) {
      team.teamName = newName;
      this.gameSubscription.next(this.game!);
    }
  }

  /**
   * Manually sets the team currently in play
   * @param id
   */
  setTeamInPlay(id: number): void {
    this.game!.currentTeam = id ? id : 0;
  }




  quickFire: boolean = false;
  quickfireRoundOrder: number[] = [];
  quickfireTeamOrder: number[] = [];

  nextRound(roundNumber?: number): void {

    if(this.game!.currentRound + 1 === this.game!.rounds.length && this.quickfireTeamOrder.length === 0) {
      // end of the game
      console.log(`win1`);
      this.gameEnded = true;

    } else {
      // still quickfire and another team to go...
      if(this.quickfire() && this.quickfireTeamOrder.length > 0) {
        console.log(`win2`);
        console.log(this.quickfireTeamOrder);
        // quickfire game is moving into the next quickfire stage
        // reset the questions
        this.newQuickfireGame(this.quickfireTeamOrder.shift()!);
        return;
      }

      // next round!
      this.game!.currentRound = roundNumber ?? this.game!.currentRound + 1;
      this.game!.currentQuestion = 0;

      let roundFirstTeam: string = this.game!.rounds[this.game!.currentRound].first;
      console.log(`win3`);

      if(this.quickfire()) {
        // switch depending upon the order chosen
        switch(roundFirstTeam) {
          case 'first':
            this.quickfireTeamOrder = [...this.game!.teams.map((a: Team) => a.id)];
          break;
            case 'last':
            this.quickfireTeamOrder = [...this.game!.teams.map((a: Team) => a.id)].reverse();
            break;
          case 'random':
            const teamsRandom: Team[] = [...this.game!.teams];
            teamsRandom.sort((a: Team, b: Team) => 0.5 - Math.random());
            this.quickfireTeamOrder = [...teamsRandom.map((a: Team) => a.id)];
            break;
          case 'lowest':
            const teamsLowest: Team[] = [...this.game!.teams];
            teamsLowest.sort((a: Team, b: Team) => a.score - b.score );
            this.quickfireTeamOrder = [...teamsLowest.map((a: Team) => a.id)];
            break;
          case 'highest':
            const teamsHighest: Team[] = [...this.game!.teams];
            teamsHighest.sort((a: Team, b: Team) => b.score - a.score );
            this.quickfireTeamOrder = [...teamsHighest.map((a: Team) => a.id)];
            break;
          default:
            const teamsLowestDe: Team[] = [...this.game!.teams];
            teamsLowestDe.sort((a: Team, b: Team) => a.score - b.score );
            this.quickfireTeamOrder = [...teamsLowestDe.map((a: Team) => a.id)];
            break;
        }

        // quickfire round coming!
        // sort the teams by score
        // const teams: Team[] = [...this.game!.teams];
        // teams.sort((a: Team, b: Team) => a.score - b.score );

        // this.quickfireTeamOrder = [...teams.map((a: Team) => a.id)];

        // let round: number | undefined = this.game!.currentRound !== 0 ? this.quickfireTeamOrder[0] : this.quickfireTeamOrder.shift();
        let round: number | undefined = this.quickfireTeamOrder.shift();
        this.newQuickfireGame(round!);

      } else {
        console.log(`win5`);
        this.quickFire = false;
        this.quickFireQuestions = [];

        switch(roundFirstTeam) {
          case 'first':
            console.log(`first`);
            this.game!.currentTeam = 0;
            this.game!.playDirection = 1;
            break;
          case 'last':
            console.log(`last`);
            this.game!.currentTeam = this.game!.teams.length - 1;
            this.game!.playDirection = -1;
            break;
          case 'random':
            console.log(`random`);
            this.game!.currentTeam = Math.floor(Math.random() * (this.game!.teams.length - 1));
            this.game!.playDirection = Math.random() > 0.5 ? 1 : -1;
            break;
          case 'lowest':
            console.log(`lowest`);
            let teamsLowest: Team[] = [...this.game!.teams];
            teamsLowest.sort((a: Team, b: Team) => a.score - b.score );

            this.game!.currentTeam = teamsLowest[0].id;
            this.game!.playDirection = 1;
            break;
          case 'highest':
            console.log(`highest`);
            const teamsHighest: Team[] = [...this.game!.teams];
            teamsHighest.sort((a: Team, b: Team) => a.score - b.score );

            this.game!.currentTeam = teamsHighest[teamsHighest.length - 1].id;
            this.game!.playDirection = 1;
            break;
          default:
            console.log(`default`);
            this.game!.currentTeam = 0;
            this.game!.playDirection = 1;
            break;
        }
      }
    }

    this.gameSubscription.next(this.game!);
  }

  // backup
  // nextRound(roundNumber?: number): void {

  //   if(this.game!.currentRound + 1 === this.game!.rounds.length && this.quickfireTeamOrder.length === 0) {
  //     // end of the game
  //     console.log(`win1`);
  //     this.gameEnded = true;

  //   } else {
  //     // still quickfire and another team to go...
  //     if(this.quickfire() && this.quickfireTeamOrder.length > 0) {
  //       console.log(`win2`);
  //       console.log(this.quickfireTeamOrder);
  //       // quickfire game is moving into the next quickfire stage
  //       // reset the questions
  //       this.newQuickfireGame(this.quickfireTeamOrder.shift()!);
  //       return;
  //     }

  //     // next round!
  //     this.game!.currentRound = roundNumber ?? this.game!.currentRound + 1;
  //     this.game!.currentQuestion = 0;

  //     let roundFirstTeam: string = this.game!.rounds[this.game!.currentRound].first;
  //     console.log(`win3`);

  //     if(this.quickfire()) {
  //       // quickfire round coming!
  //       // sort the teams by score
  //       const teams: Team[] = [...this.game!.teams];
  //       teams.sort((a: Team, b: Team) => a.score - b.score );

  //       // quickfire team order is in score order, so copy that into the quickfireteam order...
  //       console.log(`win4`);
  //       this.quickfireTeamOrder = [...teams.map((a: Team) => a.id)];

  //       let round: number | undefined = this.game!.currentRound !== 0 ? this.quickfireTeamOrder[0] : this.quickfireTeamOrder.shift();
  //       this.newQuickfireGame(round!);

  //     } else {
  //       console.log(`win5`);
  //       this.quickFire = false;
  //       this.quickFireQuestions = [];
  //       this.game!.playDirection = 1;
  //       this.game!.currentTeam = 0;
  //     }
  //   }

  //   this.gameSubscription.next(this.game!);
  // }

  /**
   * Sets up the appropriate arrays for a new quickfire ROUND
   * @param startingTeam
   */
  newQuickfireGame(startingTeam: number): void {
    this.quickFire = true;
    this.quickFireQuestions = [];
    this.game!.currentQuestion = 0;

    // set up the answers array
    for(let i = 0 ; i < this.questionCount() ; i++) {
      this.quickFireQuestions.push(-1);
    }

    // find the first team then steals are in team order...
    this.quickfireRoundOrder = [];

    for(let i = 0 ; i < this.game!.teams.length ; i++) {
      if(startingTeam + i + 1 > this.game!.teams.length) {
        this.quickfireRoundOrder.push(i - this.game!.teams.length + startingTeam)
      } else {
        this.quickfireRoundOrder.push(startingTeam + i);
      }
    }

    // set the current team to the first in the round order and take it off the array
    this.game!.currentTeam = this.quickfireRoundOrder.shift()!;
  }


































  correctAnswer(): void {
    let team: number = this.game!.currentTeam;
    this.inc++;

    // do stuff based on quickfire or normal
    if(this.quickFire) {
      this.correctAnswerQuickfire();
    } else {
      team = this.correctAnswerNormal(team);
    }

    this.game!.teams[team].score += +this.questionValue();
    this.game!.teams[team].correct++;

    this.nextQuestion();
  }

  correctAnswerNormal(team: number): number {

    if(this.game!.forStealId !== -1) {
      // question was stolen
      team = this.game!.forStealId;
      this.game!.forStealId = -1;
    }

    return team;
  }

  correctAnswerQuickfire(): void {
    // flag this question as having been answered correctly...
    this.quickFireQuestions[this.game!.currentQuestion] = 1;
  }

  incorrectAnswerQuickfire(): void {
    // flag this question as being ASKED but not answered correctly
    this.quickFireQuestions[this.game!.currentQuestion] = 0;
    this.nextQuestion();
  }




  incorrectAnswer(): void {
    const team: number = this.game!.currentTeam;
    this.inc++;

    // do stuff based on quickfire or normal
    if(this.quickFire) {
      this.incorrectAnswerQuickfire();
    } else {
      this.incorrectAnswerNormal(team);
    }

  }

  incorrectAnswerNormal(team: number): void {
    if(this.game!.forStealId === -1) {
      // this was the first time it was asked...
      this.game!.teams[this.game!.currentTeam].incorrect += 1;

      // if the question is stealable, set up the stealable bit!
      // otherwise just goto the next question.
      if(this.stealable()) {
        this.game!.forStealId = team;
      } else {
        this.nextQuestion();
      }
    }

    if(this.game!.forStealId !== -1 && this.stealable()) {
      this.game!.forStealId = this.stealTeam(this.game!.forStealId);

      if(this.game!.forStealId === team) {
        // everyone has had a chance to steal and failed...
        this.game!.forStealId = -1;
        this.nextQuestion();
      }
    }
  }

  /**
   * Directs to the next question Function.
   */
  nextQuestion(): void {
    if(this.quickFire) {
      this.nextQuestionQuickfire();
    } else {
      this.nextQuestionNormal();
    }
  }

  /**
   * Next Quickfire Question
   * @returns
   */
  nextQuestionQuickfire(): void {
    const round: Round = this.currentRound();

    if(this.game?.currentQuestion! + 1 >= this.quickFireQuestions.length) {
      // next round OR next TEAM
      if(this.quickfireRoundOrder.length > 0) {
        // next team
        this.nextTeam();
      } else {
        if(this.quickfireTeamOrder.length > 0) {
          // next teams turn at quickfire
          this.newQuickfireGame(this.quickfireTeamOrder.shift()!);
          return;
        } else {
          this.nextRound();
        }

      }
    } else {
      // next question, dont change the team!
      this.game!.currentQuestion = this.game?.currentQuestion! + 1;
      let firstTeam: boolean = this.game?.teams.length === this.quickfireRoundOrder.length + 1;

      // check for the next unanswered question...
      for(let i = this.game!.currentQuestion ; i < this.quickFireQuestions.length ; i++) {
        // what if its not the first team
        if(firstTeam) {
          this.game!.currentQuestion = i;
          break;
        } else {
          // only select incorrect answered questions...
          if(this.quickFireQuestions[i] === 0) {
            this.game!.currentQuestion = i;
            break;
          }
        }

        if(i === this.quickFireQuestions.length - 1) {
          // nothing found, so move onto the next team or round...
          this.nextTeam();
          break;
        }
      }

      this.gameSubscription.next(this.game!);
    }
  }

  /**
   * Next Normal Question
   */
  nextQuestionNormal(): void {
    const round: Round = this.currentRound();

    // normal round style
    if(this.game?.currentQuestion! + 1 >= round.questions) {
      // end of the round...
      this.nextRound();
    } else {
      // next question
      this.game!.currentQuestion = this.game?.currentQuestion! + 1;
      this.gameSubscription.next(this.game!);
      this.nextTeam();
    }

  }

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

      const firstTeam: boolean = this.game?.teams.length === this.quickfireRoundOrder.length;

      if(firstTeam) {
        let teamId: number = this.quickfireRoundOrder.shift()!;
        this.game!.currentTeam = teamId;
        this.game!.currentQuestion = 0
      } else {
        let incorrectAnswers: number[] = this.quickFireQuestions.filter((a: number) => a === 0)

        // doesnt work...
        if(incorrectAnswers.length > 0 && this.quickfireRoundOrder.length > 0) {
          // run through all the teams
          let teamId: number = this.quickfireRoundOrder.shift()!;
          this.game!.currentTeam = teamId;

          for(let i = 0 ; i < this.quickFireQuestions.length ; i++) {
            // fin d the first unansweered question
            if(this.quickFireQuestions[i] === 0) {
              this.game!.currentQuestion = i;
              break;
            }
          }
        } else {
          // no answers left
          this.nextRound();
        }
      }
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
      if(currentTeam === numberOfTeams - 1) {
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

  // quickFire: boolean = false;
  // order: number[] = [];
  // quickfireTeamOrder: number[] = [];

  // nextRound(roundNumber?: number): void {
  //   let banner: Banner[] = [];

  //   console.log(`${this.inc} ${roundNumber}`);

  //   if(this.game!.currentRound + 1 === this.game!.rounds.length && this.quickfireTeamOrder.length === 0) {
  //     // end of the game
  //     this.gameEnded = true;
  //     banner.push({ text:`Game Over!`, time: 1 });
  //   } else {

  //     // still quickfire and another team to go...
  //     if(this.quickfire() && this.quickfireTeamOrder.length > 0) {
  //       // quickfire game is moving into the next quickfire stage
  //       // reset the questions
  //       console.log(`${this.inc} next quickfire team`);
  //       this.newQuickfireGame(this.quickfireTeamOrder.shift());
  //       let teamId: number = this.order.shift()!;
  //       this.game!.currentTeam = teamId;
  //       return;
  //     }

  //     // next round!
  //     banner = [{ text: `Round ${this.game!.currentRound + 1}`, time: 1 }]
  //     this.game!.currentRound = roundNumber ?? this.game!.currentRound + 1;
  //     this.game!.currentQuestion = 0;

  //     if(this.quickfire()) {
  //       // quickfire round coming!
  //       banner.push({ text: 'Quickfire!', time: 1 });

  //       // sort the teams by score
  //       const teams: Team[] = [...this.game!.teams];
  //       teams.sort((a: Team, b: Team) => a.score - b.score );

  //       // quickfire team order is in score order, so copy that into the quickfireteam order...
  //       this.quickfireTeamOrder = [...teams.map((a: Team) => a.id)];
  //       this.newQuickfireGame(this.quickfireTeamOrder.shift());

  //       // this is where its so hax thats its ridiculous :(
  //       if(this.game!.currentRound === 0) {
  //         console.log(`hax`);
  //         let teamId: number = this.order.shift()!;
  //         this.game!.currentTeam = teamId;
  //       }

  //     } else {
  //       this.quickFire = false;
  //       this.quickFireQuestions = [];
  //     }
  //   }

  //   this.bannerSubscriptions.next(banner);
  //   this.gameSubscription.next(this.game!);
  // }

  // newQuickfireGame(startingTeam?: number): void {
  //   this.quickFire = true;
  //   this.quickFireQuestions = [];

  //   // set up the answers array
  //   for(let i = 0 ; i < this.questionCount() ; i++) {
  //     this.quickFireQuestions.push(-1);
  //   }

  //   this.game!.currentQuestion = 0;

  //   // find the first team thenj steals are in team order...
  //   let first: number = startingTeam ?? this.game!.teams[0].id;
  //   this.order = [];

  //   for(let i = 0 ; i < this.game!.teams.length ; i++) {
  //     if(first + i + 1 > this.game!.teams.length) {
  //       this.order.push(i - this.game!.teams.length + first)
  //     } else {
  //       this.order.push(first + i);
  //     }
  //   }

  //   console.log(this.inc, first, this.game!.teams.length, this.order, this.quickfireTeamOrder);

  // }

  stealable(): boolean { return this.game!.rounds[this.game!.currentRound].steal };
  questionValue(): number { return this.game!.rounds[this.game!.currentRound].questionValue };
  questionCount(): number { return this.game!.rounds[this.game!.currentRound].questions };
  questionTime(): number { return this.game!.rounds[this.game!.currentRound].questionTime };
  currentRound(): Round { return this.game!.rounds[this.game!.currentRound] };
  quickfire(): boolean { return this.game!.rounds[this.game!.currentRound].quickfire };

}
