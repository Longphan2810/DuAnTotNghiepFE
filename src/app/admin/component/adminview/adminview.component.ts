import { Component } from '@angular/core';
import { LoginService } from '../../../service/loginService/login.service';
import { shiftService } from '../../../service/shift/Shift.service';
import { error } from 'console';

@Component({
  selector: 'app-adminview',
  templateUrl: './adminview.component.html',
  styleUrl: './adminview.component.css'
})
export class AdminviewComponent {
  constructor(private loginLogoutService : LoginService, private shiftService : shiftService){}

  logout(){
    this.loginLogoutService.logout()

  }
  
  errorRecord : Record<number,string> ={
    1904:"Không phải ca làm của bạn !",
    1903:"Còn đơn hàng đang phục vụ, không thể kết ngày!"
  }
  currentTime: Date = new Date();
  datainfoCheckout = {
      "cashAtStart": 0,
      "cashAmountEnd": 0,
      "bankAmountEnd": 0,
      "shiftRevenue": 0,
      "totalServing": 0,
      "dateStart": ""
  }
  formatPrice(price: number) {
    return new Intl.NumberFormat('vi-VN').format(price)
  }

  getDatainfoCheckout(){
    this.shiftService.infoCheckoutShift().subscribe(
      data=>{
        this.datainfoCheckout  = data.result
        this.currentTime = new Date
        console.log(this.datainfoCheckout)  
      },
      error=>{
        console.log(error)
        alert("Không có ca nào đang làm !")
      }
    )
  }

  totalAmount = 0;

  endShift(){
    if(this.totalAmount!=this.datainfoCheckout.cashAtStart+this.datainfoCheckout.cashAmountEnd){
        alert("Số tiền cần nộp phải đúng với tiền mặt cần nộp (2) để kết ca !")
        return;
    }
    this.shiftService.shiftEnd(this.totalAmount).subscribe(
      data=>{
        console.log(data);
        alert("Kết ca thành công !")
        this.logout()
      },
      error=>{
        console.log(error);
        alert(this.errorRecord[error.error.code])
      }
    )
  }


  endDay(){
    if(this.totalAmount!=this.datainfoCheckout.cashAtStart+this.datainfoCheckout.cashAmountEnd){
      alert("Số tiền cần nộp phải đúng với tiền mặt cần nộp (2) để kết ca !")
        return;
    }
    this.shiftService.EndDay(this.totalAmount).subscribe(
      data=>{
        console.log(data);
        alert("Kết ca thành công !")
        this.logout()
      },
      error=>{
        console.log(error);
        alert(this.errorRecord[error.error.code])
      }
    )
  }

// Danh sách mệnh giá và số lượng tờ (ban đầu)
denominations = [
  { value: 1000, quantity: 0 },
  { value: 2000, quantity: 0 },
  { value: 5000, quantity: 0 },
  { value: 10000, quantity: 0 },
  { value: 50000, quantity: 0 },
  { value: 100000, quantity: 0 },
  { value: 200000, quantity: 0 },
  { value: 500000, quantity: 0 }
];

absNum(num :number){
  return Math.abs(num)
}

// Hàm tính tổng tiền
calculateTotal() {

  this.totalAmount = this.denominations.reduce(
    (total, denom) => total + denom.value * Math.abs(denom.quantity),
    0
  );
}

}
