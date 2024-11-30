import { Injectable } from '@angular/core';
import { ApiConfigService } from '../ApiConfigService';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { ReportRequest } from '../../entity/request/report-request';
import { Observable } from 'rxjs';
import { ApiRespone } from '../../entity/api-respone';

@Injectable({
  providedIn: 'root'
})
export class ReportService {
  url = ApiConfigService.apiUrlReport;
  constructor(private http : HttpClient) { }

  header = new HttpHeaders(
    { "Authorization": "Bearer " + localStorage.getItem("jwt") }
  )

  filterReport(theStartDate:string, theEndDate:string,theGroupBy:string): Observable<ApiRespone> {
    let startDate = theStartDate ? `&startDate=${theStartDate}` : '';
    let endDate = theEndDate ? `&endDate=${theEndDate}` : '';
    let groupBy = theGroupBy ? `&groupBy=${theGroupBy}` : '';
    const searchUrl = `${this.url}/filter?${startDate}${endDate}${groupBy}`;
    return this.http.get<ApiRespone>(searchUrl,{headers:this.header});
  } 
  // filterChart(theGroupBy:string): Observable<ApiRespone>{
  //   let groupBy = theGroupBy ? `&groupBy=${theGroupBy}` : '';
  //   const searchUrl = `${this.url}/filterchart?${groupBy}`;
  //   return this.http.get<ApiRespone>(searchUrl);

  // }
}
