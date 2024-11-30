import { ChangeDetectorRef, Component, OnInit } from '@angular/core';
import { Icart } from '../../../interface/cart/iCart';
import { ApiConfigService } from '../../../service/ApiConfigService';
import { CartService } from '../../../service/cartService/cart.service';
import { Router } from '@angular/router';
import { RequestOrder } from '../../../service/requestOrder.service';
import { verifyTable } from '../../../service/verifyTable.service';
import { Subscription } from 'rxjs';

import { WebsocketService } from '../../../service/websocketService/websocket.service';
import { IpServiceService } from '../../../service/ipService/ip-service.service';
import { TableService } from '../../../service/tableService/table.service';
import { tableResponse } from '../../../entity/response/table-response';
import { LocalStorageService } from '../../../service/localStoredService/localStored.service';


@Component({
  selector: 'app-cart',
  templateUrl: './cart.component.html',
  styleUrls: ['./cart.component.css']
})
export class CartComponent implements OnInit {
  isConfirmed: boolean = false; 
  iserror : boolean = false; 
  errorShift : boolean = false; 
  isSuccess : boolean = false;

  itemTable! : tableResponse
  items: Icart[] = [];
  total: number = 0;
  discount: number = 0;
  message: string = '';
  isMerge : boolean = false;
  isOrderConfirm: boolean = false;
  private notificationSubscription: Subscription | undefined;

  constructor(private cartService: CartService,
    private changeDetectorRef: ChangeDetectorRef, 
    private router: Router,
    private tableService : TableService,
    private requestOrderService: RequestOrder,
    private websocketService: WebsocketService,
    private localStoredService : LocalStorageService 
  ) { }

  ngOnInit(): void {
    this.getAllCart();
    this.calculateTotal();
    this.websocketService.connect()

  }



  // ******End Notification*****

 // Xử lý đặt hàng hoặc gộp đơn
 callOrder() {
  this.requestOrderService.postRequestOrder()?.subscribe(
    data => {
      this.isConfirmed = true;
      sessionStorage.removeItem('cart');
      this.getAllCart();
      CartService.items = [];
      this.localStoredService.saveOrderId(data.result.idOrder)
    },
    error => {
      if (error.error.code === 1005) {
        console.error('Lỗi đặt hàng:', error.error.code);
        this.iserror = true;

      }
      if (error.error.code == 1901) {
            
        this.errorShift = true;
      }
    }
  )
  this.isOrderConfirm = false
  this.isMerge = false
}
  

  getAllCart() {
    this.items = this.cartService.getCart();
    this.changeDetectorRef.detectChanges();
  }

  calculateTotal() {
    this.total = 0
    this.items.forEach((item) => {
      console.log(item.price);
      this.total += (item.price) * item.quantity;
    });
    console.log(this.total);
  }

  formatPrice(price: number) {

    return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(price)
  }

  onNotify(checkChange: number) {
    console.log('chackCHange: ',checkChange);
    this.items = CartService.items
    this.calculateTotal()
  }

 // Kiểm tra trạng thái bàn và hiển thị modal thích hợp
 checkOrder() {
  this.iserror = false
  const idTable = sessionStorage.getItem("itb");
  if (idTable) {
    this.tableService.getTable(Number(idTable)).subscribe(data => {
      console.log('d',data)
      this.itemTable = data.result;
      console.log('Thông tin bàn:', this.itemTable);
      // Kiểm tra trạng thái idOrderMain
      if (this.itemTable.idOrderMain !== null) {
        this.isMerge = true; // Hiển thị modal xác nhận gộp hàng
        this.isOrderConfirm = false;
      } else {
        this.isOrderConfirm = true; // Hiển thị modal xác nhận đặt hàng
        this.isMerge = false;
      }

      // Hiển thị modal
      const modal = document.getElementById('id01');
      if (modal) {
        modal.style.display = 'block';
      }
    });
  }
}
}
