import { Component, Input, OnInit, Output } from '@angular/core';
import { Team } from '../app.component';
import { GameService } from '../services/game.service';

@Component({
  selector: 'app-team',
  templateUrl: './team.component.html',
  styleUrls: ['./team.component.scss']
})
export class TeamComponent implements OnInit {

  @Input() team: Team = { id: 5, name: "", score: 56, log: [] };
  @Input() manual: boolean = false;

  constructor(
    private gameService: GameService
  ) { }

  ngOnInit(): void {
  }

}
