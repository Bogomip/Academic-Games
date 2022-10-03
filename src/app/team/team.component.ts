import { Component, Input, OnChanges, OnInit, Output, SimpleChanges } from '@angular/core';
import { GameService, Team } from '../services/game.service';

@Component({
  selector: 'app-team',
  templateUrl: './team.component.html',
  styleUrls: ['./team.component.scss']
})
export class TeamComponent implements OnInit, OnChanges {

  @Input() team: Team = { id: 5, teamName: "", correct: 0, incorrect: 0, score: 0, log: [] };
  @Input() manual: boolean = false;
  @Input() turn: number = 0;
  @Input() stealing: number = -1;

  constructor(
    private gameService: GameService
  ) { }

  ngOnInit(): void {
  }

  ngOnChanges(changes: SimpleChanges): void {
  }

}
