import { Component, OnInit } from '@angular/core';

import { CompareService } from '../compare.service';
import { CompareData } from '../compare-data.model';

@Component({
  selector: 'app-compare-results',
  templateUrl: './compare-results.component.html',
  styleUrls: ['./compare-results.component.css']
})
export class CompareResultsComponent implements OnInit {
  compareData: CompareData[] = [];
  didFail = false;
  user: CompareData | null = null;
  lowerIsBetter = false;
  filter: keyof CompareData = 'age';

  constructor(private compareService: CompareService) {
  }

  ngOnInit() {
    this.user = this.compareService.userData;
    this.compareService.dataEdited.subscribe(
      () => this.user = this.compareService.userData
    );
    this.compareService.dataLoaded.subscribe(
      (data: CompareData[]) => {
        this.compareData = data;
      }
    );
    this.compareService.dataLoadFailed.subscribe(
      (didFail: boolean) => this.didFail = didFail
    );
  }

  onFilter(filter: keyof CompareData ) {
    this.filter = filter;
  }

  onSelectLower(isBetter: boolean) {
    this.lowerIsBetter = isBetter;
  }

  getListGroupItemClass(item: CompareData) {
    if(!this.user) return '';
    if (+item[this.filter] === +this.user[this.filter]) {
      return 'list-group-item-warning';
    }
    if (this.lowerIsBetter) {
      return this.user[this.filter] < item[this.filter] ? 'list-group-item-success' : 'list-group-item-danger';
    } else {
      return this.user[this.filter] > item[this.filter] ? 'list-group-item-success' : 'list-group-item-danger';
    }
  }

  onStartSetData () {
    this.compareService.dataEdited.next(false);
  }

  onGetResults() {
    this.compareService.onRetrieveData();
  }

  onClearData() {
    this.compareService.onDeleteData();
  }
}
